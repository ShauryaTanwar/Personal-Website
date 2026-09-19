# Auxcade

Seven games. One music profile. A desktop-first, candy-colored music arcade built with modular JavaScript, Vite, Canvas, and Web Audio. The visual system uses chunky coin-op controls, bright cabinet colors, maze-like room details, and Spotify-green connection states without copying characters or artwork from existing games. Every game has its own cabinet treatment: neon maze action, an orbital travel console, a receipt printer, a 1970s quiz show, a roller-rink party, a falling-record machine, and an analog evidence desk. Production is entirely static and works on GitHub Pages.

## Run it

Use Node 22.12 or newer (Node 24 LTS recommended). The project uses Vite 8.3.0 or newer within the 8.x line; this avoids the Windows development-server vulnerabilities reported for Vite 8.0.0–8.0.15.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:4173/** and select **Play demo**. Use the IP address instead of localhost for Spotify's redirect rules. Run `npm test` for the automated suite, `npm run build` for static output, and `npm run preview` to inspect that output. Serve `dist/` over HTTP(S); opening index.html as a file does not support module loading or authentication.

The archive includes both editable source and a prebuilt `dist/` folder. No backend, database, runtime Node server, or API secret is required.

## The seven cabinets

| Cabinet | Interaction | How your profile matters |
| --- | --- | --- |
| Track Attack | Move, collect four records, evade three enemy behaviors, bank at the center, dash and shield | Ranked records define collections and values across four levels |
| World Tour | Rotate a 3D globe, zoom, visit artist origins, collect six stamps | Top artists become sourced locations; distances and geographic center come from your discoveries |
| Roast Machine | Print an evidence-backed receipt and choose a charge | Eighteen local rules inspect artist concentration, albums, eras, ranks, saved tracks, and history |
| Who’s Higher? | Ten comparisons, streak scoring, artist/track/mixed/movement modes | Compares actual ordinal ranks across three time windows |
| The Aux Cord | Manage crowd energy for twelve selections, read reactions, infer hidden preferences | Guests react to release years, saved status, artists, albums, and rankings |
| Album Drop | Move and swap falling record pairs, clear artist groups and trigger cascades | Artist families, albums, release eras, and top-five power records change scoring |
| Crate Code | Fill four slots from twelve candidates using clues, five checks and two scans | Unique puzzles use artists, eras, title length, saved status and ranks |

Shared systems provide instructions, pause, results, replay, sound controls, earned coins/tickets, seventeen achievements, cosmetic themes, track collection, and an Arcade Passport. Coins and tickets are fictional earned points with no cash value, purchases, betting, or random paid rewards. Progress is stored per profile in this browser.

## Demo data

The bundled collection contains 20 artists and 60 tracks with **fictional listening rankings and history**. It is a temporary demonstration dataset, not Shaurya's actual Spotify history. Real personal data was not supplied. Titles and artist names are metadata; no recordings, lyrics, or Spotify artwork are bundled. At runtime, Demo Mode resolves each known artist's `P18` image through Wikidata and displays the corresponding Wikimedia Commons file; tracks reuse that artist image because the demo does not redistribute album covers. Results are cached for 30 days, and initials appear only if an image is unavailable. `src/demo/demoProfile.js` is the replacement point once a permitted personal export is available. Preserve the normalized MusicProfile contract when replacing it, and explicitly review any data intended for public publication.

## Connect Spotify

1. Create a Spotify application in the [developer dashboard](https://developer.spotify.com/dashboard) under the account and authorization covering this project.
2. Add `http://127.0.0.1:4173/` to Redirect URIs for local development. Add the exact deployed HTTPS URL, including its final slash, for production. Do not use a URL fragment or localhost.
3. Add test accounts to the application's allowlist when using Development Mode.
4. Copy `.env.example` to `.env.local` and enter the **public Client ID**, optionally the exact redirect URI. Set `VITE_SPOTIFY_PLAYBACK=true` only if you want to request the additional Premium browser-playback permissions. Restart Vite.
5. Choose Connect Spotify. Auxcade immediately opens Spotify's authorization page; visitors never enter a Client ID or developer token. After they approve access, Spotify redirects them back to the arcade.

**Never put a client secret into this app, any VITE_ variable, GitHub Pages, or the repository.** The Client ID is public. The app does not request a password directly.

Spotify's general developer policy prohibits game integrations and certain derived uses. The project owner explicitly stated that Spotify granted special permission and requested this integration; implementation proceeds on that basis. No permission document was supplied or independently verified, and that exception should not be assumed to cover someone else's deployment. No Spotify content is sent to an AI service. Playback is deliberately separate from active gameplay and stops the original arcade audio.

### OAuth: Authorization Code with PKCE

`auth/pkce.js` creates a cryptographically random verifier and computes an SHA-256, base64url-encoded challenge. A separate random state binds the redirect to a ten-minute pending login in sessionStorage. `spotifyAuth.js` sends the challenge, redirect and scopes to Spotify's authorization endpoint. The callback validates state/age, immediately removes the code from browser history, and exchanges code plus verifier for tokens at `https://accounts.spotify.com/api/token` without a secret. A new login invalidates the cached profile.

`tokenManager.js` keeps tokens in sessionStorage, refreshes before expiry and shares one refresh across concurrent requests. Refresh token rotation and omitted refresh-response scopes are handled. A 401 gets one forced refresh/retry; invalid sessions can reconnect. Tokens are never placed in localStorage or log output. Session storage is still readable by same-origin JavaScript, so avoid untrusted scripts and shared-origin apps. Closing the browser session clears its token storage; explicitly disconnect on shared computers. Local progress is independent of authentication.

### API requests and returned data

Current official documentation was reviewed during implementation on September 18, 2026. API fields and account access may change independently of this app.

| Request | Scope / parameters | Relevant JSON |
| --- | --- | --- |
| `GET /v1/me` | Account identity; optional playback scopes include user-read-private/email | `account_id` (preferred), `id`, `display_name`, `images[]` |
| `GET /v1/me/top/artists` | `user-top-read`; `time_range`, `limit=50` | `items[]` of artists: `id`, `name`, `images`, `external_urls`, `uri` |
| `GET /v1/me/top/tracks` | `user-top-read`; same parameters | `items[]` of tracks: `id`, `name`, `artists[]`, `album`, `external_urls`, `uri` |
| `GET /v1/me/player/recently-played` | `user-read-recently-played`; `limit=50` | `items[]` with `track` and `played_at` |
| `GET /v1/me/tracks` | `user-library-read`; `limit=50` | `items[]` with `added_at` and `track` |
| `PUT /v1/me/player/play?device_id=…` | `user-modify-playback-state`; body `{ "uris": ["spotify:track:…"] }` | Usually 204, no JSON body |

The Web Playback SDK also requests `streaming`, `user-read-private`, `user-read-email`, and `user-read-playback-state`; it supplies browser device readiness, state, pause and volume. SDK playback is optional. An unavailable device or non-Premium account leaves games usable.

Time ranges are `short_term` (approximately four weeks), `medium_term` (approximately six months), and `long_term` (approximately one year in current documentation). Rank is the position in the ordered array, **not a play count**. Six top-list requests run in pairs. Recently played and saved tracks each load one page of up to 50; these are samples, not complete listening or library histories. “Saved” means present in the loaded saved sample. Unknown rank is never converted to zero. Spotify album and artist images are displayed throughout the interface; a track without album art uses its artist image, with initials reserved for true image failures. No popularity, audio-features, audio-analysis, preview clips or restricted batch artist endpoints are required.

Development Mode currently requires the app owner to maintain Premium and generally allows five allowlisted users. An OAuth success does not guarantee API access: an unallowlisted user can receive 403. The July 2026 changes permit up to 25 client IDs and aggregate quotas across a developer's apps. This build has no fixed daily request allowance assumption. A 429 respects short Retry-After values with bounded retries; long waits and `QUOTA_EXCEEDED` show an error instead of polling indefinitely. Transient server failures retry a bounded number of times. Abort and timeout stop abandoned work.

### Secondary API: Wikidata

World Tour calls the public [Wikibase API](https://www.mediawiki.org/wiki/Wikibase/API) at `https://www.wikidata.org/w/api.php` with `format=json&origin=*`.

- `action=wbsearchentities&search=ARTIST&language=en&limit=5&type=item` returns `search[]` candidate entity IDs.
- `action=wbgetentities&ids=Q…&props=labels|descriptions|claims|sitelinks&languages=en` returns an `entities` map.
- Real Spotify artists must match their Spotify artist ID against Wikidata property `P1902`. A name-only resemblance is insufficient.
- Demo references use `wbgetentities&sites=enwiki&titles=…` to resolve their known article identities.
- Demo artwork reads the resolved entity's `P18` Commons filename and renders it through `Special:FilePath`; the images themselves are not included in this repository.
- `P31=Q5` identifies people. People use `P19` birthplace; groups use `P740` formation place. Place entities supply `P625` coordinates, `P17` country and country's `P30` continent. Up to three `P131` parent hops fill missing area data; approximate coordinates are labeled.

Missing/ambiguous identities remain unavailable. Lookups run serially with a small delay, cache successful locations for 30 days, and cancel on leaving the game. The demo retains its offline reference if a live lookup fails. Artist names/IDs are sent to Wikidata; Spotify account IDs and tokens are not. Map coastlines are intentionally schematic. The globe is genuinely 3D: latitude/longitude becomes Cartesian coordinates, yaw/pitch rotation and perspective projection, with back-face culling, rendered using Canvas rather than WebGL. Layered ocean lighting, a day/night falloff, atmosphere, moving cloud bands, stars, latitude-sensitive land color and illuminated pins make the schematic planet read more naturally without pretending to be a cartographic map.

## GitHub Pages

1. Put the source in your chosen GitHub repository. Keep the provided `.gitignore`. Do not commit node_modules, actual env files or credentials.
2. In Settings → Pages choose **GitHub Actions** as the source.
3. Set repository **variables** `VITE_SPOTIFY_CLIENT_ID` and `VITE_SPOTIFY_REDIRECT_URI`, for example `https://YOUR_USERNAME.github.io/Personal-Website/auxcade/`. The public Client ID does not require a secret. Optionally set `VITE_SPOTIFY_PLAYBACK` to `true`; otherwise omit it or use `false`.
4. Push to `main`, or manually run **Deploy Signal Lab to GitHub Pages**. The root workflow installs from the lockfile, tests, builds and publishes Auxcade with the portfolio.
5. Register that exact HTTPS URL in Spotify's dashboard. Check login on the deployed origin using an allowlisted account.
6. Link your existing portfolio to the new URL. Auxcade remains a separate experience.

Vite uses `base: './'`, so assets work under repository subpaths or a custom domain. Hash routes (`#play/track`) avoid server rewrite requirements. OAuth returns to the root path before the hash router runs. Redirect URLs must match exactly, including trailing slash and case. GitHub Pages provides HTTPS; no backend proxy is needed. Deployment has not been performed in this delivery because no repository target was supplied.

## Code map

- `src/auth/`: PKCE, callback validation and token refresh.
- `src/api/`: Spotify requests and Wikidata identity/location resolution.
- `src/profile/`: normalization, reusable schema and derived statistics.
- `src/games/`: separate engines and views for all seven cabinets.
- `src/ui/`: lobby, sessions, passport, settings and notifications.
- `src/audio/`: original synthesized audio and optional Spotify player.
- `src/progression/`: rewards, achievements and persistent profile state.
- `src/utils/`: safe rendering, resilient storage, randomization and requests.
- `src/styles/`: visual tokens, responsive layouts, reduced-motion styles.
- `tests/`: deterministic rules, data, security and failure-path tests.

Games receive a MusicProfile and shared session services. They never read OAuth tokens. Normalized artists/tracks are deduplicated by ID; ordered ID arrays preserve each time range's ranking. See [architecture](docs/architecture.md), [testing](docs/testing.md), [video guide](docs/video-guide.md), and [prompt log](prompt_log.md).

## Privacy, accessibility and limitations

No analytics, server database, uploaded listening history, or AI inference service is used. The roast is a local rules engine. localStorage retains arcade progress, settings, geographic cache and the public demo-artwork mapping; sessionStorage holds authentication and profile cache. Settings offers reset and disconnect controls. localStorage is not an anti-cheat boundary; scores are local and editable, not a global leaderboard.

Controls use buttons, visible focus, labeled dialogs, keyboard shortcuts and score/status text. Globe locations also have a button list. Reduced-motion settings are respected in CSS. Canvas action and falling-record play remain primarily visual and are not fully screen-reader equivalent. The design is desktop first; small screens get responsive layouts and game buttons, but desktop is the primary play target. Browser audio needs a click to unlock. No downloaded song is used as the original synth soundtrack.

Live Spotify OAuth and refresh still need an actual configured Client ID and allowlisted account for end-to-end validation. Premium playback additionally requires `VITE_SPOTIFY_PLAYBACK=true`. These paths are implemented but were not authenticated in this build session. See testing notes for the precise verified scope.

## Official references

- [Spotify PKCE](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow), [redirect URIs](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri), [top items](https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks)
- [Saved tracks](https://developer.spotify.com/documentation/web-api/reference/get-users-saved-tracks), [recently played](https://developer.spotify.com/documentation/web-api/reference/get-recently-played), [rate limits](https://developer.spotify.com/documentation/web-api/concepts/rate-limits)
- [Quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes), [July 2026 changes](https://developer.spotify.com/documentation/web-api/references/changes/july-2026), [Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk), [developer policy](https://developer.spotify.com/policy)
- [Wikidata data access](https://www.wikidata.org/wiki/Wikidata:Data_access)

The bundled DejaVu display font includes its license in `public/assets/font-license.txt`. Visuals and audio are code-generated. No proprietary music recordings are redistributed.
