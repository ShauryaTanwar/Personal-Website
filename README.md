# Shaurya Tanwar // Signal Lab

A dependency-free personal portfolio built with HTML, CSS, and vanilla JavaScript. The current visual direction is **retro analog lab equipment + a classic personal homepage** rather than a futuristic dashboard.

## Start here

Open `index.html` in a browser for the static site. Most personal content lives in `data.js`, while interactions live in `app.js` and visual styling lives in `styles.css`.

For the optional Spotify integration, deploy the site somewhere that can run the included serverless function. The easiest matching setup for this starter is Vercel because files in `/api` can run as serverless functions.

## Files

- `index.html` — page structure and accessibility markup.
- `styles.css` — retro theme, responsive layout, rounded panels, skill highlights, tennis UI, and Spotify receiver.
- `data.js` — editable portfolio text, projects, experience, skills, contacts, and interest settings.
- `app.js` — all browser interactions.
- `api/spotify-recent.js` — server-side Spotify endpoint for the last played track.
- `scripts/get-spotify-refresh-token.mjs` — one-time local helper used to authorize your Spotify account.
- `privacy.html` — simple privacy disclosure for the Spotify integration and site behavior.
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
- Spotify recently-listened display (optional setup below)
- Drawing pad
- TV channel selector
- Contact-form validation + mail-app handoff

## Important personal edits

Search the project for `TODO:`. Those comments mark the most likely places you will want to personalize.

1. Replace `assets/profile-placeholder.svg` with your own photo, or change its `<img>` path in `index.html`.
2. Replace the portfolio GitHub-profile placeholder in `data.js` with the final repository URL.
3. Add any project screenshots you want to show instead of the included illustrated diagrams.
4. Replace the generic TV channels in `data.js` with your actual favorites.
5. Update Credits if you add third-party images, fonts, icons, screenshots, text, or templates.

---

# Spotify: show your last listened track

The site is already coded to call:

`/api/spotify-recent`

That endpoint returns **one** recently played track from your own Spotify account. The browser never receives your client secret or refresh token.

### Before you enable this

This feature makes your most recently played track visible to anyone who visits the portfolio. If you do not want your listening activity to be public, leave Spotify unconfigured; the site will show a setup/offline message instead.

Spotify currently requires a Spotify Premium account for Development Mode Web API apps. Spotify refresh tokens also expire after about six months, so you will occasionally need to authorize again and replace the refresh-token environment variable.

## Step 1 — Create a Spotify developer app

1. Sign in to the Spotify Developer Dashboard.
2. Create a new app. A name such as `Signal Lab Music` is appropriate; do **not** put `Spotify` in your app name.
3. Select **Web API** when asked what API you plan to use.
4. Open the app's Settings.
5. Add this exact redirect URI for the one-time local authorization helper:

   `http://127.0.0.1:8888/callback`

   Spotify does not allow `http://localhost` as a redirect URI. Loopback `127.0.0.1` is allowed for local development.
6. Save your Client ID and Client Secret somewhere private.

The integration requests only this OAuth scope:

`user-read-recently-played`

## Step 2 — Add the official Spotify logo asset

Spotify requires Spotify-provided metadata and album artwork to be accompanied by Spotify branding. The site intentionally refuses to render live track metadata until the official logo file is present.

1. Open Spotify for Developers → **Design & Branding Guidelines**.
2. Download the official **Full Logo**.
3. Because Signal Lab has a light background, use Spotify's official **black** full logo.
4. Save the unmodified SVG as:

   `assets/spotify-full-logo.svg`

Do not redraw, recolor, stretch, crop, or otherwise alter the mark. The album art returned by Spotify is also displayed unmodified and links back to the track on Spotify.

## Step 3 — Get your refresh token once locally

You need Node.js 18+ installed locally.

### macOS / Linux

```bash
export SPOTIFY_CLIENT_ID="your-client-id"
export SPOTIFY_CLIENT_SECRET="your-client-secret"
node scripts/get-spotify-refresh-token.mjs
```

### Windows PowerShell

```powershell
$env:SPOTIFY_CLIENT_ID="your-client-id"
$env:SPOTIFY_CLIENT_SECRET="your-client-secret"
node scripts/get-spotify-refresh-token.mjs
```

The script prints an authorization URL. Open it, approve access, and Spotify redirects to `127.0.0.1:8888`. The terminal will then print your refresh token.

**Treat the refresh token like a password. Never paste it into `data.js`, `app.js`, or GitHub.**

If Spotify returns a 403 for the authorized account, check the app's **Users Management** / allowlist in the Developer Dashboard. Development Mode is intended for personal/small-use apps.

## Step 4 — Deploy to Vercel

1. Push the project to GitHub **without any secrets**.
2. Import the repository into Vercel.
3. In the Vercel project, open **Settings → Environment Variables**.
4. Add:

   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REFRESH_TOKEN`

5. Redeploy.
6. Visit your portfolio and tune the radio to **Music**.

The browser requests `/api/spotify-recent`; the serverless function obtains a short-lived Spotify access token and requests the latest item from Spotify's Recently Played endpoint. Responses are briefly cached to reduce unnecessary API calls.

### If you use GitHub Pages

GitHub Pages is static hosting and cannot execute `api/spotify-recent.js`. You can still host the frontend there, but the Spotify endpoint would need to live on a separate server/serverless host and then you would change `spotifyEndpoint` in `data.js` to that HTTPS endpoint. Hosting the whole project on Vercel is simpler for this version.

## Step 5 — Six-month reauthorization

Spotify now gives developer-app refresh tokens a six-month lifetime. When yours expires:

1. Run `scripts/get-spotify-refresh-token.mjs` again.
2. Authorize your account again.
3. Replace `SPOTIFY_REFRESH_TOKEN` in Vercel.
4. Redeploy if your hosting platform requires it.

---

## Skill mapping

Skill chips now support both project cards and experience cards. IDs live in `data.js`:

- Project IDs: `signal-lab`, `c0vm`, `scout-tracker`, `embedded`, etc.
- Experience IDs: `uvd-dashboard`, `code-ninjas`, `superwit`.

A skill's `projects` array can contain either kind of ID. Clicking a skill keeps its matching work highlighted and prints direct links under the patch bay; click the selected skill again to clear it.

## Credits

The base site uses only original HTML, CSS, JavaScript, and local illustrative SVGs. If Spotify is enabled, Spotify metadata/artwork is supplied by Spotify and must be shown according to Spotify's current Developer Policy and Design Guidelines. Add attribution for any other external assets before publishing.
