"""Persistent retrieval and user state, independent of the interface."""
from __future__ import annotations

import json
import re
import sqlite3
import uuid
from dataclasses import asdict, dataclass, field
from pathlib import Path

import numpy as np


def chunks(text: str, size: int = 600, overlap: int = 80) -> list[str]:
    """Word-boundary character windows; cover the complete plot with overlap."""
    text = " ".join(text.split())
    result, start = [], 0
    while start < len(text):
        end = min(start + size, len(text))
        if end < len(text):
            end = text.rfind(" ", start, end) or end
            if end <= start:
                end = min(start + size, len(text))
        result.append(text[start:end])
        if end == len(text):
            break
        start = max(start + 1, end - overlap)
        boundary = text.find(" ", start, end)
        if boundary >= 0:
            start = boundary + 1
    return result


def unit(vector):
    vector = np.asarray(vector, dtype=np.float32)
    return vector / max(float(np.linalg.norm(vector)), 1e-12)


@dataclass
class Intent:
    query: str
    prefer: list[str] = field(default_factory=list)
    avoid: list[str] = field(default_factory=list)

    def refine(self, text: str) -> None:
        # Parse before mutating so malformed follow-ups leave intent unchanged.
        parts = re.split(r"\s*(?:,|;|\band\b)\s*", text.strip(), flags=re.I)
        changes = []
        for part in parts:
            match = re.fullmatch(r"(more|less|without|avoid|instead)\s+(.+?)\s*[.!]?", part, re.I)
            if not match:
                raise ValueError('Use "more adventure, less tragedy" or "without violence". Start a new search for a different request.')
            kind, concept = match.groups()
            concept = concept.strip().rstrip(".!").lower()
            if not concept:
                raise ValueError("Enter a concept after more/less/without/avoid/instead.")
            changes.append((kind.lower(), concept))
        for kind, concept in changes:
            target, opposite = (self.avoid, self.prefer) if kind in {"less", "without", "avoid"} else (self.prefer, self.avoid)
            if concept in opposite:
                opposite.remove(concept)
            if concept not in target:
                target.append(concept)


class MovieStore:
    def __init__(self, path: Path, embedder=None):
        import chromadb
        from chromadb.config import Settings
        from .embedding import local_embeddings

        self.path = Path(path).expanduser().resolve()
        self.path.mkdir(parents=True, exist_ok=True)
        self.embedder = embedder if embedder is not None else local_embeddings()
        self.client = chromadb.PersistentClient(
            path=str(self.path / "chroma"), settings=Settings(anonymized_telemetry=False)
        )
        self.collection = self.client.get_or_create_collection(
            "movie_plots_v1", embedding_function=None,
            metadata={"hnsw:space": "cosine", "embedding_recipe": "minilm-600char-80overlap-mean-v1"},
        )
        self.db = sqlite3.connect(self.path / "user.sqlite3")
        self.db.execute("CREATE TABLE IF NOT EXISTS status (movie_id TEXT PRIMARY KEY, state TEXT NOT NULL CHECK(state IN ('saved','watched')))")
        self.db.execute("CREATE TABLE IF NOT EXISTS session (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        self.db.commit()

    def close(self):
        self.db.close()

    def encode(self, texts):
        output = []
        for start in range(0, len(texts), 64):
            output.extend(self.embedder(texts[start:start + 64]))
        return np.asarray(output, dtype=np.float32)

    def add(self, title, plot, year="", genres="", language="", movie_id=None, source="user"):
        title, plot = title.strip(), " ".join(plot.split())
        if not title or len(plot.split()) < 10:
            raise ValueError("Provide a title and a plot with at least 10 words.")
        if year and not re.fullmatch(r"\d{4}", str(year)):
            raise ValueError("Year must be four digits or blank.")
        movie_id = movie_id or "user:" + uuid.uuid4().hex[:12]
        if self.collection.get(ids=[movie_id])["ids"]:
            return movie_id, False
        vector = unit(self.encode(chunks(plot)).mean(axis=0))
        self.collection.add(ids=[movie_id], documents=[plot], embeddings=[vector.tolist()], metadatas=[{
            "title": title, "year": str(year), "genres": genres, "language": language, "source": source,
        }])
        return movie_id, True

    def get(self, movie_id):
        result = self.collection.get(ids=[movie_id], include=["documents", "metadatas"])
        if not result["ids"]:
            raise ValueError(f"No movie with ID {movie_id!r}.")
        return {"id": movie_id, "plot": result["documents"][0], **result["metadatas"][0]}

    def set_status(self, movie_id, state):
        self.get(movie_id)
        if state not in {"saved", "watched", "clear"}:
            raise ValueError("Status must be saved, watched, or clear.")
        if state == "clear":
            self.db.execute("DELETE FROM status WHERE movie_id=?", (movie_id,))
        else:
            self.db.execute("INSERT INTO status VALUES (?,?) ON CONFLICT(movie_id) DO UPDATE SET state=excluded.state", (movie_id, state))
        self.db.commit()

    def statuses(self):
        return dict(self.db.execute("SELECT movie_id,state FROM status"))

    def watchlist(self, state="saved"):
        return [self.get(mid) for mid, status in self.statuses().items() if status == state]

    def save_intent(self, intent):
        self.db.execute("INSERT INTO session VALUES ('intent',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (json.dumps(asdict(intent)),))
        self.db.commit()

    def load_intent(self):
        row = self.db.execute("SELECT value FROM session WHERE key='intent'").fetchone()
        if not row:
            raise ValueError("Run a search first.")
        return Intent(**json.loads(row[0]))

    def search(self, intent: Intent, limit=5, include_watched=False):
        if not intent.query.strip():
            raise ValueError("Enter a description of what you want to watch.")
        if not 1 <= limit <= 20:
            raise ValueError("Result count must be between 1 and 20.")
        if not self.collection.count():
            return []
        texts = [intent.query] + intent.prefer + intent.avoid
        vectors = self.encode(texts)
        base = unit(vectors[0])
        positive = [unit(v) for v in vectors[1:1 + len(intent.prefer)]]
        negative = [unit(v) for v in vectors[1 + len(intent.prefer):]]
        retrieval = unit(base + (0.6 * np.mean(positive, axis=0) if positive else 0))
        watched = [mid for mid, state in self.statuses().items() if state == "watched"]
        # Chroma's ID filter support varies; expand the pool by the number excluded.
        pool = min(self.collection.count(), max(60, limit * 10) + (len(watched) if not include_watched else 0))
        result = self.collection.query(query_embeddings=[retrieval.tolist()], n_results=pool,
                                       include=["documents", "metadatas", "embeddings"])
        matches = []
        for mid, plot, meta, vector in zip(result["ids"][0], result["documents"][0], result["metadatas"][0], result["embeddings"][0]):
            if not include_watched and mid in watched:
                continue
            v = unit(vector)
            score = float(v @ base)
            if positive:
                score += 0.35 * float(np.mean([v @ p for p in positive]))
            if negative:
                score -= 0.35 * float(np.mean([max(0.0, float(v @ n)) for n in negative]))
            matches.append({"id": mid, "plot": plot, **meta, "score": score})
        matches.sort(key=lambda x: (-x["score"], x["id"]))
        matches = matches[:limit]
        # Select real source text; no generated claims about tone or content safety.
        evidence_query = unit(base + (np.mean(positive, axis=0) if positive else 0))
        groups = [chunks(movie["plot"]) for movie in matches]
        if groups:
            passage_vectors = self.encode([passage for group in groups for passage in group])
            offset = 0
            for movie, passages in zip(matches, groups):
                similarities = passage_vectors[offset:offset + len(passages)] @ evidence_query
                movie["evidence"] = passages[int(np.argmax(similarities))]
                offset += len(passages)
        return matches
