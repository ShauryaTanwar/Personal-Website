# Movie Mood

Local movie discovery by meaning, with a Flask web interface, CLI, conversational preference adjustments, and a persistent watchlist. No API key, paid service, or generative model is required.

### What my App does and inspiration

Movie Mood is meant to help you find a movie to watch based on plot points you put in it. It then chooses movies based on their plots and lets you refine your query until you find something enjoyable to watch. You can keep track of what you watch and want to watch in the future. 

I chose to make this application because, over Fall Break, I was always looking for new things to watch, especially rom-coms. A tool like this would have helped me significantly. In the future, I would want to add ratings and images of the movies. 

### What I store in the databse

I store information about the movies including the title, year it was made, genre, tags that describe the movie, and finally the plot of the movie. These give me ways to refine and look for movies based on the user's input. There is also a seperate table for the user's watchlist.

### How a user uses this application

A user inputs key points they are looking for in the input field and then, through a semantic search, the application returns movies that are similar. 
There is another input field to refine their searches even more.
Finally, there is a tab for the user's watchlist where they can mark movies as watched or remove them from the watchlist. 

### Two Queries used for testing

1. An amnesiac piecing together their identity
Results: Dr. Moreau’s House of Pain
Why It gets this result: Its plot describes a prisoner whose brain surgery removes his memory. 
Why a regular keyword search would miss it: None of the query’s words appeared in the stored plot, but the meaning connects amnesia with memory loss.

2. A claustrophobic nightmare
Results: Dr. Moreau’s House of Pain
Why It gets this result: Its plot describes friends trapped in a house with a strange doctor and his creations. 
Why a regular keyword search would miss it: Neither “claustrophobic” nor “nightmare” appears in the plot; the only shared word is “a.”

### How AI was used 

AI was used to generate the idea, application, and database used for this application. It assisted in bug fixes and UI changes. 

## AI-generated setup and technical documentation

### Requirements

Use **Python 3.10–3.13**, preferably 3.11 or 3.12, on Windows, macOS, or Linux. Allow a few hundred MB for packages/model and more space for the source corpus and generated database. Internet is needed for installing dependencies, downloading the corpus, and the first embedding operation. Afterwards the app runs locally using the cached model.

### Install

Unzip the project, open a terminal **inside the folder containing `pyproject.toml`**, then:

**Windows PowerShell:**

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
```

Activate the environment if permitted:

```powershell
.\.venv\Scripts\Activate.ps1
```

If activation is blocked by PowerShell policy, no policy change is necessary. Replace `python` in every command below with `.\.venv\Scripts\python.exe`.

**macOS/Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e '.[dev]'
```

### Upgrade from the CLI version and launch the website

Extract this release into a new folder. Open a terminal in that folder (the one containing `pyproject.toml`), create/use your virtual environment, and reinstall the project so Flask and the updated code are available:

```powershell
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m movie_mood web
```

On macOS/Linux with your environment activated:

```bash
python -m pip install -e '.[dev]'
python -m movie_mood web
```

Open **http://127.0.0.1:5000** in your browser. Keep the terminal open; press Ctrl+C there to stop the server. If port 5000 is busy, use `python -m movie_mood web --port 5001` and open http://127.0.0.1:5001.

**Existing data is reused automatically** when you previously used the default `~/.movie_mood` location. You do not need to download or embed the corpus again. For a custom data directory, use the same absolute path as before:

```bash
python -m movie_mood --home "path/to/your/existing/database" web
```

If you extract to a new folder, create a new virtual environment using the installation instructions above; do not copy an old `.venv`. Keep your original project folder until you confirm your movies and watchlist appear. Preserve any README or prompt-log sections you have written yourself when updating project files.

#### Using the web interface

- **Discover:** enter a mood and choose Find my movie. Example prompts fill the field so you can edit before searching.
- **Refine:** after searching, enter `more adventure, less tragedy`. Active preference chips show what was understood; Reset removes preferences and repeats the base mood. A new mood search starts fresh.
- **Watchlist:** save cards, switch to the Watched tab, mark watched, undo watched, or remove saved status.
- **Add movie:** enter a title and at least 10 words of plot. Optional year, genres, and language are supported. Added movies are immediately searchable through both interfaces.
- **Movie details:** select a title; the full plot stays hidden until you explicitly reveal it. Search excerpts can still contain spoilers.
- **Include watched:** check the option and run the search to include titles already watched.

The web app uses the same Chroma and SQLite files as the CLI. Saved and watched state persist across restarts. Browser search preferences are session-scoped and reset when the server restarts; the latest search intent is also saved for CLI refinement. There are no external fonts, images, CDN scripts, APIs, or account requirements. The server binds only to `127.0.0.1` for local use.

### Download and load the real dataset

Run from the project folder:

```bash
python -m movie_mood download-data
python -m movie_mood import-cmu --limit 1000 --seed 113
python -m movie_mood status
```

The first command downloads the approximately 46 MB CMU archive and copies only `movie.metadata.tsv` and `plot_summaries.txt` into `data/raw`. It does not download the much larger CoreNLP supplement.

The second command selects a repeatable sample and embeds it locally. The first embedding downloads Chroma's approximately 80 MB ONNX model archive. Loading can take several minutes or longer on a laptop CPU; progress appears every 25 movies. **Wait for `Processed 1000/1000` before beginning the full demo.** A quick smoke test can start with `--limit 25`; rerunning with `--limit 1000 --seed 113` fills out the same deterministic subset without duplicating existing IDs. An interrupted import is safe to rerun.

For a manual download, obtain the dataset from <https://www.cs.cmu.edu/~ark/personas/>, extract it, and point the importer to the directory containing the two files:

```bash
python -m movie_mood import-cmu --source "path/to/MovieSummaries" --limit 1000 --seed 113
```

`data/` is ignored by Git. Do not commit the raw archive, generated embeddings, or personal state.

### Launch the CLI

```bash
python -m movie_mood shell
```

Example interactive session (no quotation marks needed inside the shell):

```text
search an unlikely friendship on a long journey
refine more adventure, less tragedy
save 1
watchlist
show 1
watched 1
history
include-watched on
search an unlikely friendship on a long journey
add
status
quit
```

`add` prompts for title, optional year/genres/language, and a plot. Paste one or more lines and finish with a blank line. Plots need at least 10 words. Add a real descriptive plot rather than only a title or tags.

Numbers refer to the **last displayed list**, including watchlist/history. Full IDs such as `cmu:1234` or `user:abc123...` also work. Marking a saved movie watched moves it from the watchlist to history. `clear ID` removes its saved/watched state; it does not delete the movie.

A new `search` clears refinements. `reset` clears refinements while repeating the current base request. The last search intent survives restart; result numbers do not. Use full IDs after restart or display a list again.

### One-shot CLI commands

```bash
python -m movie_mood search "people building a new life far from home"
python -m movie_mood refine "more adventure, less tragedy"
python -m movie_mood search "unlikely companions" --limit 3 --json
python -m movie_mood add --title "My Movie" --year 2026 --plot "A solitary musician travels across the country and forms a band with strangers who become lifelong companions."
```

Use the returned ID with these commands (replace `MOVIE_ID`):

```bash
python -m movie_mood save MOVIE_ID
python -m movie_mood watchlist
python -m movie_mood watched MOVIE_ID
python -m movie_mood watchlist --watched
python -m movie_mood clear MOVIE_ID
python -m movie_mood show MOVIE_ID
```

For a long plot, `add --title "Title" --plot-file plot.txt` reads UTF-8 text. `search --include-watched` allows watched titles in results. `python -m movie_mood --help` lists commands.

### Storage and persistence

By default, application data is stored in **`~/.movie_mood`**, independent of the current working directory:

- `chroma/`: persistent plot documents, metadata, and vectors.
- `user.sqlite3`: saved/watched state and latest search intent.
- `import_report.json`: last import's count, seed, source, and input hashes.

Use `--home` **before the subcommand** to isolate a demo or choose another location:

```bash
python -m movie_mood --home data/demo import-cmu --limit 1000
python -m movie_mood --home data/demo shell
python -m movie_mood --home data/demo status
```

Use the same `--home` on every command for that database. Alternatively set the `MOVIE_MOOD_HOME` environment variable. The model cache is separate, normally `~/.cache/chroma/onnx_models/`.

### How retrieval works

- Database: ChromaDB `PersistentClient`, cosine distance, collection `movie_plots_v1`.
- Embeddings: Chroma's local ONNX `all-MiniLM-L6-v2`, 384 dimensions.
- Each logical item is one movie. Full plot text is stored as the document. Title/year/genres/language/source are metadata, not the primary search input.
- Plots are split into approximately 600-character word-boundary windows with 80-character overlap. Every window is embedded; their mean is normalized into one movie vector. This lets later plot sections contribute, although averaging loses some detail. Extremely token-dense windows may still be truncated by the model.
- Initial retrieval uses the base mood plus positive preferences. A candidate pool of at least 60 is reranked using base similarity, a positive bonus, and a negative penalty. Watched items are skipped, with the candidate pool enlarged to compensate.
- A real plot passage is selected by similarity as evidence. It is an excerpt, not an AI-written explanation or a guarantee of suitability.

Follow-ups support explicit `more X`, `less X`, `without X`, `avoid X`, and `instead X` clauses separated by commas, semicolons, or `and`. They are not unrestricted chatbot conversations. Opposite preferences replace earlier preferences for the same concept. `instead X` adds a positive preference; use `search` to replace the entire request.

**Limitations:** Negative preferences are soft reranking signals, not content filters. The dataset describes plots, not viewers' emotional reactions, so mood judgments are approximate. The corpus is historical and lacks recent releases; add missing movies yourself. Plot excerpts can spoil endings. No model-generated text, posters, streaming links, or ratings are included in this release.

### Verification

```bash
python -m pytest -q
```

Tests cover persistence, immediate searchability, duplicate import IDs, watched exclusions, status changes, atomic refinement parsing, chunk coverage, deterministic corpus parsing, reranking, and an empty CLI. Unit tests use an explicitly test-only embedding substitute; real-model semantic checks are separate.

Before recording, add a movie, search for its premise, save it, restart, inspect the watchlist, mark it watched, and confirm it is excluded. Record at least one verified no-keyword-overlap query. See `SEMANTIC_CHECKS.md` for actual retrieval observations and `VERIFICATION.md` for validation notes.

### Troubleshooting

- **`No module named movie_mood`:** run inside the extracted project folder after `python -m pip install -e .`, using the same virtual environment.
- **Zero movies:** run the import step. Check `status` and ensure the same `--home` is in use.
- **Model download fails:** reconnect and retry; the first embedding needs internet. If your network uses a SOCKS proxy, install `python -m pip install 'httpx[socks]'`.
- **Import interrupted:** rerun the identical import command; stable IDs skip completed additions.
- **Poor mood matches:** describe the situation or story theme in more detail. Try a positive concept and keep refinements short. Results depend on the sample available.
- **Unrecognized follow-up:** use explicit syntax such as `refine more adventurous, less tragic`.
- **No newer movies:** this corpus is historical, not a current movie catalog.

### Sources and attribution

- CMU Movie Summary Corpus: <https://www.cs.cmu.edu/~ark/personas/>. David Bamman, Brendan O'Connor, and Noah A. Smith, *Learning Latent Personas of Film Characters*, ACL 2013. The source describes Wikipedia plot summaries and Freebase metadata, released under Creative Commons Attribution-ShareAlike. Consult the corpus page/readme for licensing; source text remains attributed to the corpus/Wikipedia and is not relicensed as original application code.
- Flask documentation: <https://flask.palletsprojects.com/en/stable/>.
- Chroma client documentation: <https://docs.trychroma.com/reference/python/client>.
- Model documentation: <https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2>.

### AI use

ChatGPT implemented the CLI, Flask web interface, ingestion, persistence, refinement/reranking, tests, and this technical documentation from the user's project plan. Important actual user prompts are in `prompt_log.md`. No 4.5-hour work history or unseen prompts are invented. The student must add their own design rationale, testing observations, work history, and required README sections before submission.

### Version 1.2: faster searches and a vintage picture house

The model now stays loaded, plot-evidence embeddings are reused, and returning to Discover reuses unchanged results. A bounded cache automatically checks movie additions and watched-state changes, including changes made through the CLI. Your existing database remains compatible; **do not reimport or delete it** for this update. The first search still loads the model into memory.

The UI now uses cream paper, burgundy, brass rules, filmstrip card details, and a vintage theater header, with no external assets.

Stop the running server, update the code, run `python -m pip install -e .`, and restart `python -m movie_mood web`. Refresh the browser with Ctrl+F5 if it still shows the old stylesheet. Keep your own README/prompt-log writing when merging this release.

See `PERFORMANCE.md` for before/after observations. Run `python benchmark.py` (or the full virtual-environment Python path) to measure your own database and computer.
