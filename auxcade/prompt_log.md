# AI assistance log

## Tool disclosure

This project was developed with OpenAI ChatGPT/Codex assistance, filesystem/terminal tools and browser testing. The specific underlying model version was not exposed reliably, so none is claimed. No additional AI model API is part of Auxcade. In particular, roasts are local handcrafted rules. This log summarizes development prompts rather than reproducing the entire conversation.

## Prompts that shaped the project

1. The owner supplied a 48-section Auxcade brief: seven distinct personalized music games, a non-neon retro arcade, Spotify PKCE plus Demo Mode, a real 3D globe, local progression, modular understandable code, and static GitHub Pages delivery.
2. The brief asked for verification of current official Spotify and Wikidata documentation before API implementation, including development restrictions and deprecated fields.
3. After the general Spotify games restriction was raised, the owner stated: “I have special permission from Spotify to build these games. Please integrate these games as asked.” The integration was implemented on that stated basis.
4. The owner asked to continue working, prompting completion of browser checks, fixes, documentation and packaging.
5. The owner requested a Pudding-style connection flow: the site owner configures Spotify once, then visitors click a single link and never enter a developer identifier.

## Decisions and reasoning

- Use Vite and native JavaScript/Canvas/Web Audio, keeping the production bundle static and the dependency list small.
- Normalize Spotify and demo data into the same MusicProfile so games stay independent of authentication and network details.
- Use a clearly labeled temporary synthetic demo because the owner's actual listening export was not supplied. Do not fabricate claims that demo ranks represent their taste.
- Render the rotating globe using real 3D projection in Canvas; schematic geographic outlines avoid shipping a large map library.
- Design Track Attack as a collect-and-bank action game and Album Drop as artist-group clearing with gravity, rather than direct clones.
- Make Crate Code a uniquely solvable deduction puzzle, verified across seeded generated examples.
- Use original synthesized arcade audio, optional Premium SDK listening between games, and no bundled Spotify audio.
- Keep the public Client ID in the build configuration and send visitors straight to Spotify's PKCE authorization page. Make playback scopes an optional owner setting so the default consent request stays focused.

## Debugging and review

- Tests cover profile normalization, PKCE's RFC test vector, quiz correctness, puzzle uniqueness, engine rules, reward deduplication, geographic math, unsafe markup and API failure paths.
- Browser testing found that insecure preview origins lack crypto.randomUUID; non-security run IDs now use a separate fallback while OAuth continues to require cryptographically secure randomness.
- Review fixed stale profile cache on a new account login, scope retention during token refresh, a delayed next-piece display in Album Drop, cancellation of World Tour lookups after finishing, and player connection rejection cleanup.
- Typography was made self-contained with a licensed bundled display font after a system font fallback changed the intended layout.

## Honest scope of evidence

This is an AI-assisted implementation. The owner should read and understand the engines and document their own further work for the assignment. No number of student work hours, personal listening history, authenticated Spotify test, or completed deployment is claimed without evidence. See docs/testing.md for verification and remaining live-account checks.
