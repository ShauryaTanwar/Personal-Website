# AI assistance log

## Tool disclosure

This project was developed with OpenAI Codex, a GPT-5-family coding agent, through ChatGPT Work. Supporting tools included local filesystem and terminal commands, npm/Node test and build tooling, browser automation for interactive QA, and web research for official Spotify and Wikidata documentation. No AI model API runs inside Auxcade, and no listening data is sent to an AI service; the roast text is produced by local handcrafted rules. This log records the representative exchanges that most affected the implementation rather than reproducing the entire conversation.

## Prompts that shaped the project

1. The owner supplied a 48-section Auxcade brief: seven distinct personalized music games, a non-neon retro arcade, Spotify PKCE plus Demo Mode, a real 3D globe, local progression, modular understandable code, and static GitHub Pages delivery.
2. The brief asked for verification of current official Spotify and Wikidata documentation before API implementation, including development restrictions and deprecated fields.
3. After the general Spotify games restriction was raised, the owner stated: â€œI have special permission from Spotify to build these games. Please integrate these games as asked.â€ The integration was implemented on that stated basis.
4. The owner asked to continue working, prompting completion of browser checks, fixes, documentation and packaging.
5. The owner requested a Pudding-style connection flow: the site owner configures Spotify once, then visitors click a single link and never enter a developer identifier.

## Representative prompt and response excerpts

The user prompts below are reproduced verbatim. Assistant entries are concise records of the corresponding implementation response, retaining the substantive answer without presenting an entire chat dump.

### Spotify permission and authentication

**User prompt:** â€œI have special permission from Spotify to build these games. Please integrate these games as asked.â€

**Assistant response:** The integration proceeded on the owner's stated permission while documenting that the exception was not independently verified. Spotify access was isolated behind a normalized profile layer so the games also remain playable in Demo Mode.

**User prompt:** â€œcan you redo the authentication system so that it works the same where the user just connects their spotify via a link instead of needing to provide a development token? Its fine if it still only works for 5 users.â€

**Assistant response:** The manual-token interface was replaced with Spotify Authorization Code with PKCE. The site owner supplies the public Client ID at build time, visitors select **Connect Spotify**, tokens remain in session storage, and Spotify Development Mode's allowlist can still limit access to approved test users.

### Artwork and visual direction

**User prompt:** â€œMuch better. Now, make it so that any time an album or song or artist is mentioned, either the song/album cover image or the artist cover image is shown instead of the placeholder currently used.â€

**Assistant response:** Spotify album and artist image URLs were carried through profile normalization and rendered throughout the UI. Tracks fall back to the primary artist image, Demo Mode resolves artist images through Wikidata/Wikimedia Commons, and initials appear only when no usable image exists.

**User prompt:** â€œCan you do a final update of the UI of all the games too. Make them look much much better and retero. Make the globe look more realistic too.â€

**Assistant response:** â€œCompleted the final UI overhaul across all seven games,â€ including unique cabinet styling and â€œa more dimensional globe with atmosphere, lighting, cloud bands, stars, colored terrain, and glowing markers.â€ The response also recorded 27 passing tests, a successful production build, and zero reported npm vulnerabilities.

### Deployment debugging

**User prompt:** â€œwhen i uploaded to github, the website wasnt able to read the vite_client_id even though its an environment secret.â€

**Assistant response:** The deployed workflow was inspected and found to reference `vars.VITE_SPOTIFY_CLIENT_ID` while the configuration had been entered under repository secrets. The response explained that `VITE_*` values must be supplied during `npm run build`, that a Spotify Client ID is public, and that a client secret must never be exposed to Vite.

**User prompt:** â€œim getting this error **Spotify login requires HTTPS or a loopback IP address.**â€

**Assistant response:** The compiled deployment was inspected and found to contain an `http://` GitHub Pages redirect. The response identified the exact HTTPS redirect format, reminded the owner to register the same value in Spotify's dashboard, and noted that changing a GitHub secret requires rerunning the build workflow.

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