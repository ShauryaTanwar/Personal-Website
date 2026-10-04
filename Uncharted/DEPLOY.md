# Deploy Uncharted

AI-generated setup guide. The folder is ready to add to your existing repository; these steps do not replace or rebuild the rest of your website.

## 1. Add the folder to your repository

Extract `Uncharted.zip`. Copy the enclosed **Uncharted** folder into the root of your local `Personal-Website` checkout. Avoid nesting it as `Uncharted/Uncharted/`.

The project frontend is `Uncharted/index.html`. It uses relative asset paths, so it works under a GitHub Pages repository path or custom domain. It needs no npm build. Commit the project folder, including `assets/`, `vendor/`, and `backend/`. Do not commit an actual `.env` file; the included `.gitignore` excludes it.

If your existing Pages workflow only publishes a `docs/`, `dist/`, or other build-output directory, make sure it copies the Uncharted static frontend into that output. This package does not change your existing workflow.

## 2. Create the Render backend

In Render, create a **Web Service** connected to your Personal-Website repository and select the branch containing Uncharted.

| Setting | Value |
|---|---|
| Runtime | Python 3 |
| Root Directory | `Uncharted/backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 8 --timeout 120` |
| Health Check Path | `/api/health` |

Set environment variables in Render:

| Variable | Value |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `OPENAI_MODEL` | `gpt-4.1-mini` (configurable; choose a model your account can access that supports Responses structured outputs) |
| `SECRET_KEY` | A long random value; keep it stable across deploys |
| `ALLOWED_ORIGINS` | `https://shauryatanwar.github.io,http://localhost:8000,http://127.0.0.1:8000` |
| `DAILY_AI_LIMIT` | `250`, or a smaller maximum number of model requests per rolling day |
| `PYTHON_VERSION` | `3.12.8` |

If you use a custom portfolio domain, add its exact origin to `ALLOWED_ORIGINS`, comma-separated. Do **not** include `/Personal-Website/Uncharted/` or another path. CORS origins contain only scheme and host.

To generate `SECRET_KEY` locally:

```sh
python -c "import secrets; print(secrets.token_hex(32))"
```

Deploy, then visit `https://YOUR-SERVICE.onrender.com/api/health`. You should see:

```json
{"guide_ready": true, "status": "ok"}
```

`guide_ready` checks whether a key is configured, not whether it is valid or has credit. Test a real message after connecting the frontend.

An optional `render.yaml` is included. Manual Web Service setup above is the simplest route; a blueprint must be explicitly pointed at `Uncharted/render.yaml` if Render asks for its path. If you deploy this as a separate repository later, change `rootDir` to `backend`.

## 3. Connect the frontend

Edit `Uncharted/config.js`:

```js
window.UNCHARTED_CONFIG = {
  API_BASE_URL: 'https://YOUR-SERVICE.onrender.com',
};
```

Use your actual Render URL, without a trailing slash or `/api`. This is a public URL, **not** a secret or API key. Commit/push this change and let your existing GitHub Pages deployment run.

Open your deployed portfolio URL with `/Uncharted/` appended. If your portfolio uses the standard project-site URL, the app will be at:

`https://shauryatanwar.github.io/Personal-Website/Uncharted/`

If your portfolio uses a custom domain or a different published base, append `/Uncharted/` to that base instead.

## 4. Add the portfolio link

Add a project card/link in your website's existing Projects section. From a portfolio homepage at the same folder level as Uncharted, the link can be:

```html
<a href="./Uncharted/">Uncharted — Explore the world with Atlas</a>
```

## 5. Verify the public app

1. Open the deployed link in a private/incognito window.
2. Verify the globe loads. Ask Atlas to visit Kyoto and choose the correct Japanese location.
3. Watch the flight/cloud reveal and check that the card contains actual weather and a generated overview.
4. Close the card and open Passport. Reload and verify the discovery remains.
5. Switch to Follow a clue, start a mystery, request a hint, and guess/reveal it.
6. Try a place like Springfield and verify the choices distinguish locations.
7. Check phone-width layout. Confirm backend failures produce readable messages.
8. Record the deployed app for your assignment demo, and submit the required URLs yourself.

## Local development on Windows (PowerShell)

From the `Uncharted` folder, create a virtual environment and install dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
Copy-Item backend/.env.example backend/.env
```

Edit `backend/.env` and set your real key and a random secret. Start Flask:

```powershell
.\.venv\Scripts\python.exe backend/app.py
```

In another terminal, from the **parent directory containing Uncharted**:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/Uncharted/`. While `API_BASE_URL` is empty, localhost automatically uses `http://127.0.0.1:5000`. If you already configured a Render URL and want to use your local backend, temporarily set the value to `http://127.0.0.1:5000` and restore the Render URL before pushing.

## Local development on macOS/Linux

From `Uncharted`:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
```

Edit `backend/.env`, then:

```sh
.venv/bin/python backend/app.py
```

In another terminal from its parent directory:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/Uncharted/`.

## Troubleshooting

| Symptom | Check |
|---|---|
| Backend URL not configured | Set `config.js` and push it. |
| Cannot reach the guide | Check Render is running, URL uses HTTPS in production, and frontend origin is in `ALLOWED_ORIGINS`. Sleeping services can take time to start. |
| Atlas needs a key | Add `OPENAI_API_KEY` to the Render service and redeploy/restart. |
| Atlas cannot connect, but direct search works | Check model access, API billing/credit, key validity, and Render logs. The UI never displays raw provider secrets. |
| Mystery expired | Start a new clue. Clues last one hour and are lost when the backend restarts. |
| Saved stamp cannot load fresh details | If `SECRET_KEY` changed, re-search the destination. Keep that key stable. |
| Globe missing after copying files | Confirm `assets/` and `vendor/` deployed; check path capitalization and browser WebGL support. |
| Opening HTML directly fails | Use the local HTTP server; ES modules do not work reliably from `file://`. |
| Daily guide allowance used up | Wait for the rolling window, adjust the configured limit intentionally, or use direct place search. |
| Landmark search temporarily unavailable | Retry later; the fallback only covers populated places. |

## Hosting scope

The frontend is static and public. Flask is a separate Render service. Run exactly one service instance with one worker for the in-memory clue/caching/limit design. Scaling beyond a small portfolio demo requires shared state and stronger abuse controls. No paid service was created or deployed as part of generating this package.
