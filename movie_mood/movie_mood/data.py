"""CMU corpus acquisition and deterministic, restartable importing."""
import csv
import hashlib
import json
import random
import shutil
import tarfile
import urllib.request
from pathlib import Path

URL = "https://www.cs.cmu.edu/~ark/personas/data/MovieSummaries.tar.gz"


def download(destination: Path):
    destination.mkdir(parents=True, exist_ok=True)
    archive = destination / "MovieSummaries.tar.gz"
    temporary = archive.with_suffix(".part")
    if not archive.exists():
        print("Downloading CMU Movie Summary Corpus (~46 MB)...", flush=True)
        try:
            with urllib.request.urlopen(URL, timeout=60) as src, temporary.open("wb") as out:
                shutil.copyfileobj(src, out)
            temporary.replace(archive)
        finally:
            temporary.unlink(missing_ok=True)
    # Copy only the two expected regular members; never extract arbitrary paths.
    with tarfile.open(archive, "r:gz") as tar:
        for name in ("movie.metadata.tsv", "plot_summaries.txt"):
            member = tar.getmember("MovieSummaries/" + name)
            if not member.isfile():
                raise ValueError(f"Archive member is not a regular file: {name}")
            with tar.extractfile(member) as src, (destination / name).open("wb") as out:
                shutil.copyfileobj(src, out)
    print(f"Data ready: {destination}")


def values(raw):
    try:
        value = json.loads(raw)
        return ", ".join(value.values()) if isinstance(value, dict) else ""
    except (ValueError, TypeError):
        return ""


def read_cmu(directory: Path, limit=1000, seed=113):
    if limit < 1:
        raise ValueError("Import limit must be positive.")
    metadata = {}
    with (directory / "movie.metadata.tsv").open(encoding="utf-8") as src:
        for row in csv.reader(src, delimiter="\t", quoting=csv.QUOTE_NONE):
            if len(row) >= 9:
                metadata[row[0]] = row
    movies = []
    with (directory / "plot_summaries.txt").open(encoding="utf-8") as src:
        for line in src:
            mid, separator, plot = line.rstrip("\n").partition("\t")
            row = metadata.get(mid)
            if not separator or not row or len(plot.split()) < 10:
                continue
            movies.append(dict(movie_id="cmu:" + mid, title=row[2], plot=plot,
                               year=row[3][:4] if row[3][:4].isdigit() else "",
                               language=values(row[6]), genres=values(row[8]), source="CMU/Wikipedia"))
    # Sorting before shuffling keeps this independent of file iteration order.
    movies.sort(key=lambda m: m["movie_id"])
    random.Random(seed).shuffle(movies)
    return movies[:limit]


def import_cmu(store, directory, limit=1000, seed=113):
    movies = read_cmu(directory, limit, seed)
    added = 0
    for i, movie in enumerate(movies, 1):
        _, created = store.add(**movie)
        added += created
        if i % 25 == 0 or i == len(movies):
            print(f"Processed {i}/{len(movies)} movies; {added} newly added.", flush=True)
    report = {"source": URL, "seed": seed, "requested": limit, "selected": len(movies),
              "newly_added": added, "collection_count": store.collection.count(),
              "embedding": "Chroma ONNX all-MiniLM-L6-v2; normalized mean of 600-character windows, 80-character overlap",
              "input_sha256": {name: hashlib.sha256((directory / name).read_bytes()).hexdigest()
                               for name in ("movie.metadata.tsv", "plot_summaries.txt")}}
    (store.path / "import_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report
