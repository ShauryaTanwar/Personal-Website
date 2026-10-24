# Recording checklist

1. Load the default sample (1000 movies, seed 113); show `status`.
2. Run one verified query from `SEMANTIC_CHECKS.md` and explain the mismatch in wording.
3. Run `refine more adventure, less tragedy`; explain that these are soft preferences.
4. Save a result using `save 1`, then show `watchlist`.
5. Use `add` to enter a genuine movie and descriptive plot. Search for its premise immediately.
6. Save the added movie using its full returned ID.
7. Quit and reopen the CLI; display `watchlist` to show persistence.
8. Mark the added movie watched and show `history`. Repeat the search and show that watched results are excluded.

Keep the screen recording short. Dataset ingestion can happen before recording. Do not claim a particular movie must rank first unless you have tested it in your database. Adding movies changes the corpus and can change rankings.

Before submitting: write the required README sections in your own words, complete the honest prompt log with your actual work, link the project from your portfolio, upload the recording, test its sharing link in incognito, and submit the assignment form.

## Optional web demo

Run `python -m movie_mood web` and open http://127.0.0.1:5000. Demonstrate the same sequence through Discover, Refine, Watchlist, and Add Movie. Reveal the full plot only when needed. Closing and restarting the server preserves movies and saved/watched state.
