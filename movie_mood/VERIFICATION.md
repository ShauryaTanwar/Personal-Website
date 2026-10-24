# Verification notes

AI-generated implementation validation, performed 2026-10-24.

## Automated checks

- `python -m pytest -q`: **14 passed**.
- Tests use real persistent Chroma storage with a deliberately tiny deterministic embedding substitute, except the empty-database CLI subprocess test. This avoids requiring model downloads for unit tests; it does not establish semantic quality.
- Covered: immediate runtime add/search, re-opening storage, duplicate stable IDs, saved/watched status, exclusion, clearing status, search intent persistence, refinement reversal and atomic validation, invalid inputs, long-plot coverage, deterministic corpus parsing, positive/negative reranking, and interactive shell workflow.
- Python compile check passed.

## Real data and model

- Downloaded the official CMU archive with the included command.
- Imported **1000 movies** using seed **113**, with the actual locally downloaded ONNX MiniLM model.
- A separate CLI process reported 1000 movies after import, demonstrating database persistence outside the importing process.
- Ran five natural-language searches. Two useful no-important-keyword-overlap examples are recorded in `SEMANTIC_CHECKS.md`; failures are also documented there.
- Separate-process real-model smoke checks **passed** for add, immediate search, save, reopen persistence, watched exclusion, and include-watched override.

## Environment and reproducibility

Verified on Linux with Python 3.12, Chroma 1.5.9, NumPy 2.3.5, pytest 9.1.1, and Flask 3.1.3. Exact direct dependency versions are provided in `requirements-tested.txt`. Windows PowerShell commands are documented, but were not executed on a Windows machine here.

## Scope and limitations

This delivery implements the CLI and the local Flask web interface. No external account, deployment, portfolio edit, video upload, or submission was performed. User additions do not require a restart. Negative preferences are soft signals and cannot enforce content restrictions. Mood quality is limited by plot-only data and the sampled catalog.

The package excludes raw corpus files, generated databases, model weights, and environment-specific caches. The documented commands reproduce the dataset locally. The first four required README sections still need student authorship, and the prompt log needs the student's actual subsequent work; no hours or prompts were fabricated.

## Web interface validation

- Four additional Flask integration tests cover the complete add/search/refine/save/watched workflow, preference and form validation, literal HTML escaping, CSRF checks, missing movie responses, packaged static assets, and shared CLI/web state.
- The full suite passes: **14 tests**.
- A live HTTP GET and search POST **passed** against the actual local model and 1000-movie database; five result cards were rendered and the expected semantic match, Man in the Dark, was present.
- The available remote browser could not reach this environment's loopback server (connection refused). Browser screenshots, visual rendering, and responsive layout were not verified in a real browser here. CSS includes layouts for desktop and small screens; this remains a validation limit.
- Flask is launched locally with debug/reloader disabled and loopback binding. Templates autoescape source text, changes use POST and session CSRF tokens, form sizes are bounded, and no external browser assets are required.

## Version 1.2

Added regression tests for cache reuse, watched/addition invalidation (including external CLI writes), model-wrapper reuse, deduplication, bounded cache eviction, and safe output copies. Measured actual web search performance against the full sample; see `PERFORMANCE.md`. The vintage UI is implemented in local templates and CSS; visual browser QA remains unavailable.
