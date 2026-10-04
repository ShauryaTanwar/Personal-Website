# Uncharted

## Student Project README

Uncharted is specifically a desktop only application because of the wide UI it requires to show a globe and the Atlas Chat Bot on the entire screen. The point of Uncharted is to uncover more of the world and discover new places. It offers a mode to freely explore and ask Atlas about different areas or places, or a clues gamemode to try and guess different places around the world based on a short hint of what they are known for. 

To run this project, run the backend "app.py" with py app.py in the backend directory. Then run gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 8 --timeout 120 in the Uncharted directory and visit localhost:8000. The only secrets that are nessesary are in .env.example in the backend directory and a link to the backend in config.js. 

I am most proud of being able to save the locations on the globe and having a fully functional chatbot that works well. 

AI was used to create the full-stack application and deploy to GitHub. I mainly used ChatGPT 6.0 Astra. 

My contribution to the project was customizing the URL endpoints in the backend and modifying the schema given to the chatbot to prevent any malicious prompt injection. 

The 8 hours of work were spread across October 2nd - 4th with it mainly consisting of the initial draft, understanding how to utilize Render and OpenAI API, testing, adding features, and creating multiple drafts until I was happy with the results. 

## AI-generated project reference

Uncharted is a browser-based exploration game. A realistic Earth begins under drifting clouds. Talk to Atlas, a friendly AI travel companion, or follow its geography clues. Choose a destination to fly around the globe, clear a patch of cloud, and add a stamp to your passport. Revisit places for current weather and an area overview.

This folder is independent of the rest of the portfolio. It contains the entire frontend, backend, tests, assets, and deployment instructions. No existing repository was read or changed to create it.

**Updating the first version? Read [UPDATE.md](UPDATE.md) to preserve your local API settings.**

**Start with [DEPLOY.md](DEPLOY.md).** You do not need npm or a frontend build to deploy the app. Python is used for the Flask backend; npm is only for the optional browser tests.

### Features and use

- **Free explore:** name a place, ask for a recommendation, or describe your interests. Choose a verified map match to discover it. An ambiguous name produces multiple choices instead of silently choosing a city.
- **Follow a clue:** ask for a mystery, guess the place, request progressive hints, or reveal the answer. Use just the place name when guessing. Atlas accepts generated alternate names, capitalization differences, and accented spellings; it is not a general semantic answer grader.
- **Worldwide search:** Photon/OpenStreetMap supplies cities, landmarks, and natural features, rather than a preset destination list. Coverage and naming depend on the provider. If Photon is unavailable, Open-Meteo/GeoNames provides a city/town fallback; landmark coverage is reduced during that outage.
- **Discovery animation:** the camera follows a smooth spherical path, a local reveal spreads through the clouds, and a gold marker remains. A discovery reveals a local area, not a whole country.
- **Context-aware guide:** each request includes up to 12 recent messages and the last 80 discovery names. The browser retains up to 30 messages. This is bounded context, not unlimited model memory.
- **Destination cards:** model-derived current weather from Open-Meteo, Celsius/Fahrenheit, an AI-generated area overview, three highlights, and an OpenStreetMap link. Weather and summary failures are handled separately.
- **Full Earth reward:** after six distinct discoveries, a cloud toggle unlocks in Free Explore. Clue mode always restores the normal cloud cover. The preference is saved without changing discovered places.
- **Passport:** revisit markers or accessible passport buttons, filter discoveries, export JSON, and merge discoveries from an imported journey.
- **Local progress:** discoveries, cached details, settings, and recent conversation live in `localStorage`. Clearing site data resets them. There are no accounts or database.
- **Mobile and accessibility:** stacked phone layout, touch rotation/pinch zoom, labeled controls, keyboard-accessible passport, native dialogs, and reduced-motion support. If WebGL is unavailable, the chat/passport still work.

The revised UI is a full-screen astronomical observatory with a narrow map-tool rail, a collapsible field-communications panel, and a nearly opaque cloud deck. Its most distinctive implementation is the cloud reveal mask: a canvas texture records explored patches in geographic coordinates while the cloud texture drifts independently. The marker, reveal patch, and destination camera use the same latitude/longitude conversion.

### Architecture and source map

| File | Responsibility |
|---|---|
| `index.html` | Semantic layout, dialogs, import map, script entry points |
| `styles.css` | Desktop/mobile layout, typography, states, destination cards |
| `config.js` | Public backend URL only |
| `js/app.js` | UI events, API requests, discovery flow, chat, passport, weather rendering |
| `js/globe.js` | Three.js rendering, clouds, geographic reveal mask, raycasting, camera animation |
| `js/observatory.js` | Collapsible guide and map-search controls |
| `js/store.js` | Validate, load, and save browser state; validate imported journey files |
| `backend/app.py` | Flask routes, AI prompts, geocoding, weather, signed location tokens, clue sessions, caches and limits |
| `backend/requirements.txt` | Pinned Python runtime dependencies |
| `backend/.env.example` | Environment-variable template with no real secrets |
| `render.yaml` | Optional Render blueprint; manual setup is documented in DEPLOY.md |
| `vendor/` | Pinned Three.js 0.170.0, OrbitControls, and MIT license |
| `assets/` | Bundled realistic Earth and cloud textures, favicon |
| `backend/tests/` | Backend unit/integration tests with mocked external services |
| `tests/persistence.mjs` | Reload regression: six markers, revealed cloud mask, and damaged-save recovery |
| `tests/browser.mjs` | Browser workflow tests using explicit API fixtures |
| `prompt_log.md` | Actual user prompts, implementation notes, AI usage, and observed mistakes |

### Backend API

Every route is under `/api`. Errors return `{ "error": "Human-readable message" }` with an appropriate HTTP status.

| Method/path | Parameters | Response / behavior |
|---|---|---|
| `GET /api/health` | None | `status`, `guide_ready`; does not expose the key |
| `POST /api/search` | `query` | Up to six verified place candidates, each with a signed `token` |
| `POST /api/chat` | `message`, `mode` (`explore` or `clue`), `history`, `discoveries` | Guide `reply`, candidate `places`, or an opaque `riddle` ID |
| `POST /api/clue` | `riddle`, `action` (`guess`, `hint`, `reveal`), optional `guess` | `reply`, `solved`; solved responses contain a verified `place` |
| `POST /api/place` | Signed location `token` | Place, current weather, overview, and independent service-error fields |

The frontend sends JSON with `fetch`. It requests `/chat` on a message, `/clue` while a riddle is active, `/search` when a user submits a direct search, and `/place` on discovery/revisit/refresh. The backend sends requests only to fixed service endpoints. Model-generated URLs are never fetched.

The guide uses the OpenAI Responses API with strict structured output. That separates conversational text from actions. It suggests search terms; **it does not supply the map coordinates**. The map service verifies coordinates, and the backend signs them before accepting a details request. All provider/model text is inserted as text, not rendered HTML.

### Local setup

See [DEPLOY.md](DEPLOY.md) for Windows and macOS/Linux commands. Run Flask on port 5000 and a static server on port 8000. Open the frontend through HTTP, not by double-clicking `index.html`; browser ES modules need a server.

### Secrets, service limits, and state

- `OPENAI_API_KEY` belongs only in `backend/.env` locally or Render environment variables. It never belongs in `config.js`, browser code, prompt logs, or Git.
- `SECRET_KEY` signs verified locations. Keep it stable across deploys so saved destinations can continue fetching details. If it changes, existing stamps remain visible, but re-search a place to obtain a new location token.
- `ALLOWED_ORIGINS` is a comma-separated list of frontend **origins** (scheme + host, no path or trailing slash). It includes localhost defaults and should include the deployed portfolio origin.
- CORS/origin checks are not authentication. This is a public portfolio API.
- A process-wide `DAILY_AI_LIMIT` defaults to 250 attempts in a rolling 24 hours. Both chat and new area overviews count. A per-IP limit allows 60 requests/minute. Limits, caches, and clues are held in process memory and reset on restart; configure an appropriate provider budget as well.
- Run **one Gunicorn worker and one service instance**, with threads. More workers would split clues and counters. A larger deployment should move state/limits to shared storage.
- Clue answers stay in server memory behind random IDs, rather than being embedded in browser-visible tokens. Clues expire after an hour or a restart. Location tokens contain public location metadata and are not secret.
- Geocoding and overview cache TTL: 24 hours. Weather cache TTL: 10 minutes. Caches are bounded to 600 entries. Open-Meteo current conditions are weather-model estimates, not live station observations.
- There is no fabricated demo weather or scripted chatbot in the production app. Without an API key, it shows an explicit connection message and direct location search still works.
- Fonts are requested from Google Fonts, with system-font fallbacks. Earth imagery and Three.js are bundled locally; there is no runtime CDN dependency for the globe.

### Testing

Backend (from this folder):

```sh
python -m pip install -r backend/requirements.txt pytest
python -m pytest backend/tests -q
```

Optional browser tests (Node.js 20+ and Python on PATH):

```sh
npm install
npx playwright install chromium
npm run test:ui
```

The browser suite starts a temporary static server on port 8765 and uses controlled API responses, never an API key. `PYTHON` can override the Python executable; `CHROMIUM_PATH` can specify an installed Chromium executable.

Validation during creation: 12 backend tests passed; browser tests passed for the real WebGL globe, discovery animation, cards, temperature units, passport, reload persistence, clue hints/guesses, context propagation, duplicate prevention, error recovery, ambiguous choices, and phone-width overflow. Live map and weather requests were also exercised. Live OpenAI account/model access was **not tested**, because no user key was supplied. After configuration, test one free-explore request, one clue, and one overview against your account.

### Assignment fit and authorship

This implements frontend/backend communication, third-party APIs, and rich WebGL interactivity. A database is not required to meet those categories. The delivered implementation and reference documentation were AI-generated. No student-authored code changes or time totals are claimed. The student's README introduction/reflection, meaningful personal changes, commit history, portfolio link, deployment, video, check-in/presentation, and form submission remain their own tasks.

### Citations and credits

- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs) and [Responses API](https://developers.openai.com/api/reference/responses): guide and generated area overview.
- [Photon](https://github.com/komoot/photon): worldwide place search over OpenStreetMap. Its public server is intended for reasonable-volume projects with no availability guarantee. `PHOTON_URL` can select another compatible server.
- [OpenStreetMap contributors / ODbL](https://www.openstreetmap.org/copyright): underlying place data and source-map links.
- [Open-Meteo weather documentation](https://open-meteo.com/en/docs) and [geocoding documentation](https://open-meteo.com/en/docs/geocoding-api): weather and city fallback. Geocoding data is based on GeoNames.
- [Three.js](https://threejs.org/): MIT-licensed rendering library; license included in `vendor/THREE-LICENSE.txt`.
- Earth/cloud textures from [Bjørn Sandvik's WebGL Earth example](https://github.com/turban/webgl-earth/tree/master/images), using NASA imagery. See [ASSETS.md](ASSETS.md) for exact source paths.
- [Render Flask deployment](https://render.com/docs/deploy-flask) and [monorepo root directory](https://render.com/docs/monorepo-support).
- Google Fonts: Cormorant Garamond, IBM Plex Mono, and Libre Franklin; system fonts are fallbacks.

### Reload bug fix

The restored place validator now retains latitude and longitude. Previously it dropped those fields even though names stayed in the passport. Loading an affected save repairs missing coordinates from its existing signed location-token metadata where possible, preserving a raw backup before migration. The recovery decoder is for local rendering only; API tokens remain verified by Flask. `npm run test:persistence` exercises six discoveries across repeated reloads, checks the real cloud mask, and clicks a restored globe marker.
