# Architecture walkthrough

## One profile, many games

The data flow is: Spotify authorization → Spotify API responses → profile normalizer → MusicProfile → seven independent games. Demo Mode starts at MusicProfile, so it exercises the same engines, scoring and views without mocked network requests.

`musicProfile.js` defines the contract with JSDoc. `artists` and `tracks` contain unique objects. `topArtists` and `topTracks` map short_term, medium_term and long_term to ordered IDs. The `ranked()` helper materializes a numbered view without changing the underlying records. `recent` preserves timestamps; `savedTrackIds` preserves membership in the loaded sample. `capabilities` and `warnings` let partial data remain useful.

Derived values are explicit calculations. Rank movement is long-term rank minus short-term rank. Genre, mood, exact play count and audio energy are not invented when the API cannot supply them. Party “energy” is a game-state value, not a Spotify audio feature.

## Session lifecycle

`GameSession` owns start, lazy module import, pause/help dialogs, a requestAnimationFrame loop, score/status, results and replay. Event listeners use its AbortSignal; destroying the session aborts them and cancels the frame. Engines consume bounded delta time. Visibility changes pause active runs. World Tour owns an additional cancellation controller so an in-flight lookup cannot update a destroyed result screen.

Games call `finish(result)` once. Progression deduplicates a run ID, computes earned rewards, updates high scores and awards newly eligible badges. Local storage keys separate Demo Player from connected accounts. The result screen describes run rewards; achievement popups separately describe badge bonuses.

## Explainable engines

- Track Attack integrates velocity in continuous coordinates, tests axis-separated wall collisions, limits carrying capacity, and models three enemies with different targets. Banking is distinct from collecting, creating a risk/reward route decision.
- Who’s Higher samples non-tied pairs with progressively narrower rank gaps. It supports both ranks and rank movement without needing artist popularity.
- Roast Machine filters handcrafted predicates, derives evidence strings, shuffles eligible rules and prints a bounded selection. It does not send prompts or user data to a model.
- Aux Cord stores one hidden preference per guest. Reactions and satisfaction use the same deterministic preference predicate; the player can infer the rule from visible track metadata. Repetition adds boredom.
- Album Drop locks a horizontal pair, flood-fills orthogonally connected artist groups, clears qualifying groups, applies gravity and repeats for cascades. A top-five power record reduces the required group size to two. Album and era bonuses are independent evidence from the cleared records.
- Crate Code builds predicates from a chosen answer, narrows candidates until exactly one matches per slot, and uses a catalog-number clue if the available data cannot distinguish it. Four answers are distinct. Tests generate fifty seeded puzzles and prove uniqueness.
- World Tour rotates Cartesian points on a sphere and culls the far side. Haversine distance handles wraparound; the geographic center averages 3D unit vectors to avoid the international-date-line error of averaging longitudes.

## Boundaries

Rendering escapes external text and restricts URLs to HTTP(S). Request logic is shared; non-JSON errors and 204 playback responses are handled explicitly. Tokens stay in the auth/API layer. Audio service ensures original arcade audio does not overlap Spotify playback. A shared footer surfaces a record encountered during play; optional listening happens between runs.

The project intentionally has no server, authoritative leaderboard, multi-device synchronization, commerce, or public personal-data export. Adding those would change its security and deployment model.
