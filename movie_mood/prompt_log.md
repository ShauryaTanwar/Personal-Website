# Prompt log

## Tool/model roles

ChatGPT was used for requirement analysis, brainstorming, planning, implementation, and documentation. Python/pytest and real Chroma/local ONNX embeddings were used for verification. The exact assistant model identifier is not available to the application; do not invent one. The app itself uses local all-MiniLM-L6-v2 embeddings, not a generative LLM or hosted API.

### Why I used ChatGPT

I used ChatGPT Sol 6.0 Light because this was a relatively easy project to generate. I only needed help with the database portion and prefered quicker responses so I could make changes. 

## Actual user prompts (verbatim)

### Brainstorming

```text
ok lets draft some ideas for this project. what could we do?
```

### Planning

```text
i like the movie mood finder idea. lets plan it out fully. ask any questions you may have
```

### Preference response

```text
> What interface do you want for the finished project?
Start with a CLI, then add a web interface

> Should an AI model explain recommendations and interpret follow-up requests?
Keep everything local and avoid paid APIs

> Which extra features would you most want beyond mood search and adding movies? Pick up to two to prioritize.
Refine results conversationally: “less dark, more adventurous”, Save a watchlist and mark movies watched
```

### Implementation

```text
sounds good. fully build this application and provide instructions on how to load the data and run the CLI
```

## Development record

- Selected CMU movie summaries as the starting corpus.
- Implemented a persistent Chroma collection and separate SQLite user state.
- Used all plot chunks to form each movie embedding rather than embedding just the beginning of long summaries.
- Implemented explicit refinement parsing and soft preference reranking without a paid API.
- Added immediate runtime additions, watchlists, watched exclusion, and restartable corpus imports.
- Added tests and ran real-model retrieval checks. Read `VERIFICATION.md` and `SEMANTIC_CHECKS.md` for observations.
- Wrote AI-labeled technical documentation; student-authored assignment sections remain the student's responsibility.

## Add your own work below

Record actual dates/times, important prompts exactly as sent, what you changed after receiving AI output, failures you encountered, and your own validation. Do not fabricate prompts or time spent.

## Web interface phase — actual user prompt

```text
sounds good, build it
```

This followed the assistant's proposal to build a local Flask interface with Discover, refinement, watchlist/watched management, movie entry, and spoiler-revealed details. ChatGPT implemented those views and added integration tests. The user had confirmed the CLI worked pretty well. No student work hours have been inferred.

## Performance and theater styling — actual user prompt

```text
it takes an incredibly long time to search compared to the CLI. investigate the problem and see if you can cut it down. Also, rework the UI to become more old styled movie theater themed
```

ChatGPT inspected the installed embedding wrapper, measured original web request times, reused the model and cached unchanged results, added invalidation tests, and restyled the app. 