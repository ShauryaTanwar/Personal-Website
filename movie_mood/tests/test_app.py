"""Real Chroma persistence tests with a tiny deterministic test-only embedder.

The substitute avoids downloading model weights in unit tests; it is never an
application option and is not evidence of semantic retrieval quality.
"""
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest

from movie_mood.core import Intent, MovieStore, chunks
from movie_mood.data import read_cmu


class TestEmbedder:
    __test__ = False
    def __call__(self, texts):
        rows = []
        for text in texts:
            words = set(re.findall(r"\w+", text.lower()))
            rows.append([1 + len(words & group) for group in (
                {"space", "stars", "astronaut"}, {"love", "romance", "couple"},
                {"tragedy", "death", "grief"}, {"adventure", "journey", "explore"})])
        return np.asarray(rows, dtype=np.float32)


@pytest.fixture
def store(tmp_path):
    app = MovieStore(tmp_path, TestEmbedder())
    yield app
    app.close()


def test_add_persist_and_watchlist(tmp_path):
    app = MovieStore(tmp_path, TestEmbedder())
    mid, created = app.add("Orbit", "An astronaut leaves home to explore distant stars with a loyal crew.", "2001", movie_id="test:orbit")
    assert created
    assert not app.add("Orbit", "An astronaut leaves home to explore distant stars with a loyal crew.", movie_id=mid)[1]
    assert app.search(Intent("space adventure"))[0]["id"] == mid
    app.set_status(mid, "saved")
    app.save_intent(Intent("space", ["adventure"], ["tragedy"]))
    app.close()
    reopened = MovieStore(tmp_path, TestEmbedder())
    assert reopened.watchlist()[0]["id"] == mid
    assert reopened.load_intent().avoid == ["tragedy"]
    reopened.set_status(mid, "watched")
    assert reopened.search(Intent("space")) == []
    assert reopened.search(Intent("space"), include_watched=True)[0]["id"] == mid
    reopened.set_status(mid, "clear")
    assert reopened.statuses() == {}
    reopened.close()


def test_refinement_atomic_and_reversible():
    intent = Intent("friendship")
    intent.refine("more adventure, less tragedy")
    assert intent.prefer == ["adventure"] and intent.avoid == ["tragedy"]
    intent.refine("more tragedy")
    assert "tragedy" in intent.prefer and not intent.avoid
    with pytest.raises(ValueError):
        intent.refine("more space, make it different")
    assert "space" not in intent.prefer


def test_invalid_input(store):
    with pytest.raises(ValueError):
        store.add("", "too short")
    with pytest.raises(ValueError):
        store.add("Title", "This plot has enough words to pass the minimum length check today.", "xx")
    with pytest.raises(ValueError):
        store.search(Intent(""))
    with pytest.raises(ValueError):
        store.set_status("missing", "watched")


def test_chunks_cover_long_plot():
    text = " ".join(f"word{i}" for i in range(500))
    pieces = chunks(text)
    assert len(pieces) > 1
    assert set(text.split()) == set(" ".join(pieces).split())
    assert all(len(piece) <= 600 for piece in pieces)


def test_reranking_changes_order(store):
    store.add("Grief", "An astronaut travels to space and stars facing tragedy death grief and tragedy.", movie_id="test:grief")
    store.add("Explore", "An astronaut travels to space on an adventure journey to explore with friends.", movie_id="test:explore")
    result = store.search(Intent("space", ["adventure"], ["tragedy"]))
    assert result[0]["id"] == "test:explore"
    assert result[0]["evidence"] in result[0]["plot"]


def test_cmu_parser_deterministic(tmp_path):
    (tmp_path / "movie.metadata.tsv").write_text('1\t/m/1\tFirst\t2000-01-01\t\t90\t{"a":"English"}\t{}\t{"b":"Drama"}\n', encoding="utf-8")
    (tmp_path / "plot_summaries.txt").write_text('1\tA young traveler leaves home and meets an unexpected companion on the road.\n', encoding="utf-8")
    rows = read_cmu(tmp_path)
    assert rows == read_cmu(tmp_path)
    assert rows[0]["year"] == "2000" and rows[0]["genres"] == "Drama"


def test_cli_empty_database(tmp_path):
    result = subprocess.run([sys.executable, "-m", "movie_mood", "--home", str(tmp_path), "search", "space adventure"], capture_output=True, text=True)
    assert result.returncode == 0
    assert "No recommendations" in result.stdout
