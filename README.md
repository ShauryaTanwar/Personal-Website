# Shaurya Tanwar // Signal Lab

A dependency-free personal portfolio built with HTML, CSS, and vanilla JavaScript. The current visual direction is **retro analog lab equipment + a classic personal homepage**.

## Start here

Open `index.html` locally for the static site. Most editable portfolio content lives in `data.js`; interactions live in `app.js`; styling lives in `styles.css`.

For the Spotify module, this version is set up specifically for **GitHub Pages + GitHub Actions**. GitHub Pages never receives your Spotify Client Secret or refresh token. A scheduled GitHub Action privately calls Spotify and writes only safe display metadata to `spotify-recent.json` before deploying the Pages artifact.

## Files

- `index.html` — page structure and accessibility markup.
- `styles.css` — retro theme, responsive layout, skill highlighting, tennis UI, and Spotify receiver.
- `data.js` — editable portfolio text, projects, experience, skills, contacts, and interest settings.
- `app.js` — all browser interactions.
- `spotify-recent.json` — public, display-safe Spotify snapshot. GitHub Actions replaces this during deployment.
- `scripts/update-spotify-json.mjs` — runs inside GitHub Actions to retrieve your last played track.
- `scripts/get-spotify-refresh-token.mjs` — one-time local helper used to authorize your Spotify account.
- `.github/workflows/deploy-pages.yml` — deploys the site to GitHub Pages and refreshes Spotify roughly every 10 minutes.
- `privacy.html` — privacy disclosure for the Spotify integration and site behavior.
- `assets/` — project diagrams, placeholder portrait, resume, and Spotify-logo instructions.

## Main interactions

- Power switch / startup sequence
- Responsive analog oscilloscope
- Click-persistent **skill → related work** mapping
- C0VM stack-machine demo
- I2C bus demo
- Experience timeline
- FM interest tuner
- Playable arcade tennis match
- Spotify recently-listened receiver
- Drawing pad
- TV channel selector
- Contact-form validation + mail-app handoff

## Important personal edits

Search the project for `TODO:`. Those comments mark the most likely places you will want to personalize.

1. Replace `assets/profile-placeholder.svg` with your own photo, or change its `<img>` path in `index.html`.
2. Replace the portfolio GitHub-profile placeholder in `data.js` with the final repository URL.
3. Add project screenshots if you want them instead of the included retro diagrams.
4. Replace the generic TV channels in `data.js` with your actual favorites.
5. Update Credits if you add third-party images, fonts, icons, screenshots, text, or templates.

---

# Spotify + GitHub Pages setup

## How this version works

GitHub Pages is static hosting, so browser JavaScript **must not** contain your Spotify secret. The secure flow is:

`GitHub Actions secrets → Spotify Web API → spotify-recent.json → GitHub Pages → visitor browser`

Only the final track name, artist, album, artwork URL, Spotify link, and timestamps become public. Your Client Secret and refresh token remain GitHub Actions secrets.

This feature makes your most recently played track visible to anyone visiting your portfolio. If you do not want that activity to be public, do not add the Spotify secrets.

## Step 1 — Create/configure your Spotify developer app

1. Sign in to the Spotify Developer Dashboard.
2. Create an app and select **Web API**.
3. Open the app's **Settings**.
4. Add this exact redirect URI:

   `http://127.0.0.1:8888/callback`

   Use `127.0.0.1`, not `localhost`.
5. In Settings, copy your **Client ID**.
6. Choose **View client secret** and copy your **Client Secret** somewhere private.
7. If the Spotify account you will authorize is not already permitted for the app, add it in the app's **Users Management** / allowlist.

The helper requests only:

`user-read-recently-played`

Spotify currently requires the Development Mode app owner to have Spotify Premium.

## Step 2 — Add Spotify's official full logo

Spotify requires displayed Spotify metadata/artwork to be accompanied by Spotify branding. This project intentionally waits to display the live metadata until the official logo file exists.

1. Open Spotify for Developers → **Design & Branding Guidelines**.
2. Download Spotify's official **Full Logo**.
3. For this site's light receiver background, use Spotify's official black full logo.
4. Save the unmodified file as:

   `assets/spotify-full-logo.svg`

Do not redraw, recolor, crop, rotate, or distort the logo. The album artwork is also displayed without cropping and links back to the track on Spotify.

## Step 3 — Generate your Spotify refresh token

You need Node.js 18 or newer locally.

### macOS / Linux

From the project folder:

```bash
export SPOTIFY_CLIENT_ID="paste-your-client-id"
export SPOTIFY_CLIENT_SECRET="paste-your-client-secret"
node scripts/get-spotify-refresh-token.mjs
```

### Windows PowerShell

```powershell
$env:SPOTIFY_CLIENT_ID="paste-your-client-id"
$env:SPOTIFY_CLIENT_SECRET="paste-your-client-secret"
node scripts/get-spotify-refresh-token.mjs
```

The script starts a temporary callback server at `127.0.0.1:8888`, then prints an authorization URL.

1. Open the printed URL in your browser.
2. Sign into the Spotify account whose listening history you want on the site.
3. Approve the requested recently-played permission.
4. Spotify redirects to `http://127.0.0.1:8888/callback`.
5. Return to your terminal.
6. Copy the value printed under `SPOTIFY_REFRESH_TOKEN`.

Treat that refresh token like a password. Never paste it into `app.js`, `data.js`, `index.html`, or any committed file.

## Step 4 — Add the three GitHub Actions secrets

In the repository on GitHub:

**Settings → Secrets and variables → Actions → New repository secret**

Create these three repository secrets:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`

Paste only the matching value into each secret.

## Step 5 — Switch GitHub Pages to GitHub Actions

This repository already includes `.github/workflows/deploy-pages.yml`.

In GitHub:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push this project to the `main` branch.
4. Open the repository's **Actions** tab.
5. Open **Deploy Signal Lab to GitHub Pages**.
6. If needed, choose **Run workflow** once to test it manually.

The workflow also runs after pushes to `main` and on a schedule at approximately 10-minute intervals. Scheduled GitHub Actions can run a little late; this is a “recently listened” display, not a real-time player.

## Step 6 — What the workflow does

Each workflow run:

1. Checks out the website.
2. Reads the three Spotify values from GitHub Actions secrets.
3. Exchanges the refresh token for a short-lived Spotify access token.
4. Calls `GET /v1/me/player/recently-played?limit=1`.
5. Writes safe metadata to `spotify-recent.json`.
6. Packages the static website as a GitHub Pages artifact.
7. Deploys the artifact.

No Spotify secret is copied into the deployed site.

## Step 7 — Refresh-token expiration

Spotify developer-app refresh tokens currently expire after **6 months from authorization**. Refreshing the one-hour access token does not extend that six-month lifetime.

When the Music receiver says authorization is required:

1. Run `scripts/get-spotify-refresh-token.mjs` again.
2. Authorize your account again.
3. Replace the `SPOTIFY_REFRESH_TOKEN` repository secret in GitHub.
4. Manually run the Pages workflow, or wait for the next scheduled run.

---

## Skill mapping

Skill chips support both project cards and experience cards. IDs live in `data.js`:

- Project IDs: `signal-lab`, `c0vm`, `scout-tracker`, `embedded`, etc.
- Experience IDs: `uvd-dashboard`, `code-ninjas`, `superwit`.

A skill's `projects` array can contain either kind of ID. Clicking a skill keeps matching work highlighted and shows direct links below the patch bay. Clicking the selected skill again clears it.

`Linux` is currently mapped to `uvd-dashboard` / UltraViolet Devices rather than C0VM.

## Credits

The base site uses original HTML, CSS, JavaScript, and local illustrative SVGs. If Spotify is enabled, Spotify metadata/artwork is supplied by Spotify and must be shown according to Spotify's current Developer Policy and Design & Branding Guidelines. Add attribution for any other external assets before publishing.
