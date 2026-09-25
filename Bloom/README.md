# Bloom

A cozy low-poly study game. Focus for a while, receive a random garden object, place it on your floating island, and watch the island grow as you accumulate study time.

## Run locally

Requires Python 3.10+ and an internet connection for the Three.js CDN and web fonts. The frontend itself has no build step or Node.js requirement.

```bash
python -m venv .venv
source .venv/bin/activate       # macOS / Linux (Bash)
pip install -r requirements.txt
python -m backend.app           # API on http://localhost:5000
```

On **Windows PowerShell**, replace the `source` line with:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell does not allow activation on your machine, run the environment's Python directly: `.\.venv\Scripts\python.exe -m pip install -r requirements.txt`, then `.\.venv\Scripts\python.exe -m backend.app`.

In a second terminal from the repository root:

```bash
python -m http.server 8000
```

Open **http://localhost:8000/**. The local API uses a SQLite file named `bloom.db` in the project root. It is ignored by Git. To try the complete study loop quickly during development, use the API tests; actual browser sessions use the selected real-world minutes.

## Publish with GitHub Pages and Render

1. Push these files to a GitHub repository. Keep `index.html` in the repository root.
2. In Render, create a **Blueprint** from that repository using `render.yaml`. It creates the Python web service and PostgreSQL database. When Render asks for `FRONTEND_ORIGIN`, enter the **exact origin** of the Pages site, such as `https://YOUR_USERNAME.github.io` (no path or trailing slash). If publishing at a custom domain, use its origin instead.
3. Once Render supplies your service URL, change `API_BASE` in [`js/config.js`](js/config.js) to that HTTPS URL, for example `https://YOUR_BLOOM_API.onrender.com`. Commit and push the change. This is a public address, **not** a secret. The database URL belongs only in Render.
4. In the repository's **Settings → Pages**, select **Deploy from a branch**, the default branch, and **/(root)**. Visit `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/` when GitHub finishes publishing.
5. Register one account and complete a study session. Register a second account to test Community's read-only island browsing. If your GitHub Pages origin changes, update `FRONTEND_ORIGIN` in the Render service environment and redeploy.

For a repository named `bloom`, the Pages URL is usually `https://YOUR_USERNAME.github.io/bloom/`. All frontend asset paths are relative, so the site works below this repository path. Do **not** open `index.html` directly as a `file://` URL; ES modules need an HTTP server. The browser fetches Three.js from the pinned CDN; no JavaScript build runs on GitHub Pages.

**Persistence note:** The free Render PostgreSQL plan expires after **30 days**. Render allows a 14-day upgrade window before deleting its data. Upgrade the database plan before expiration if you need to keep players' islands longer; the free plan is suitable for a short homework demonstration. A free Render web service may also take time to wake after being idle. Never use the web service's ephemeral filesystem as your production database.

## How it works

- The Flask API stores password hashes, opaque login tokens (stored hashed in the database), study sessions, individual earned objects, placements, and tutorial progress. SQLite serves local development and PostgreSQL serves Render.
- Starting a session records the server start time. A visible browser tab sends a heartbeat every 30 seconds. A gap exceeding two minutes invalidates the session. The server checks elapsed time, ownership, heartbeat freshness, and claim status before awarding exactly one object. A page reload restores an active session within that window. Heartbeats establish tab presence, though they cannot prove a person is studying.
- Every reward catalog object has a nonzero chance at every duration. Longer sessions favor larger objects. A starter Daisy Patch is granted on registration. Rewards are saved immediately when earned, even if the reveal is dismissed.
- Objects snap to a hidden 0.75-unit grid. The API checks island boundaries, collisions, object ownership, and the full object list before saving. Island sizes grow at 2, 5, and 10 total hours.
- The viewer requests other players' public garden data but exposes no mutation endpoint for their gardens. Settings and inventory are hidden during a visit.

### Owner preview shortcut

The optional owner shortcut can finish a running session immediately and award its item. It is disabled unless **both** `BLOOM_ADMIN_USERNAME` (your exact Bloom account username) and `BLOOM_ADMIN_KEY` (a private random string of at least 20 characters) are set on the Render web service under **Environment**. Generate a key locally with `python -c "import secrets; print(secrets.token_urlsafe(32))"`; paste it into Render, **never** into a tracked source file or `js/config.js`. Redeploy after saving those environment variables.

During Study Mode, press **Alt+Shift+B** to open the discreet owner dialog and enter the key. It is sent to the server over HTTPS for that one request, never stored in browser storage. The server checks the logged-in username and key, grants one reward, and credits the full selected duration. Other users and anyone without the key cannot invoke it. Without those Render variables, normal server-timed sessions continue unchanged.

## Checks

```bash
python -m pytest -q
node --check js/app.js
node --check js/scene.js
```

The API tests cover registration, password hashing, early and duplicate completion, heartbeat expiry, reward persistence, garden placement, community view, CORS, and reload from the saved database.
