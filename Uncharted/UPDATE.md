# Six-discovery Full Earth view

Replace these files in your current Uncharted folder, then refresh with **Ctrl+Shift+R**:

- `index.html`
- `styles.css`
- `js/app.js`
- `js/globe.js`
- `js/store.js`

Keep your `config.js` and `backend/.env`. No backend changes are required. This package includes the saved-coordinate fix from the previous update.

The **Cloud layer** control shows discovery progress until six distinct locations are saved. At six, **Show full Earth** removes all clouds in **Free Explore**. **Restore cloud cover** restores the normal discovery mask. Entering **Follow a clue** always restores the cloud layer and disables the toggle. Returning to Free Explore restores your preferred view. The preference survives reloads, but is only applied when six discoveries exist and Free Explore is active. Resetting a journey clears the preference and locks the feature again.

This is a viewing reward: it does not mark the rest of the world as discovered or change your saved cloud openings.

---

# Globe reload fix — October 4

For this bug fix, replace these **two files** in your current Uncharted folder:

- `js/store.js`
- `js/app.js`

Keep `config.js` and `backend/.env` as they are. Refresh with **Ctrl+Shift+R** after replacing both files. Do not reset your journey or clear browser storage.

The old save-loading code kept names but omitted `lat` and `lon` from each restored place. The globe therefore could not position the markers or rebuild the revealed-cloud mask. The corrected loader preserves those fields. It also recovers missing coordinates from public metadata in existing signed place tokens, without an API call or API key. The backend continues to validate tokens independently for API requests.

Affected raw data is backed up locally before migration. Recovery works when the location records and their tokens still exist; it cannot reconstruct records already erased by clearing browser data or overwriting them with an empty journey.

Verified with six locations, three reload/save cycles per scenario, actual rendered cloud-mask openings, marker coordinates and marker clicks. Both normal saves and damaged saves with compressed/uncompressed tokens pass, and chat is retained.

---

# Observatory UI update

This update changes the visual interface and cloud rendering. Your backend API, saved journey format, and API-key setup remain compatible.

## Updating your existing installation

Keep your existing **`config.js`** and **`backend/.env`**. Do not replace them with the example values from a fresh download.

Copy these files from this package into the matching paths in your existing Uncharted folder:

- `index.html`
- `styles.css`
- `js/globe.js`
- `js/observatory.js` (new)
- `assets/star-atlas.svg` (new)

You can also copy the updated README, prompt log, asset credits, and browser tests. No backend restart is required for this UI update. Refresh the browser with Ctrl+Shift+R after copying the files.

## What changed

- Full-screen observatory layout with a Google Earth-inspired navigation rail, separate place-search panel, and collapsible Atlas guide.
- Dark star atlas, subtle constellation lines, compass markings, muted brass, serif titles, and field-journal destination cards.
- A nearly opaque cloud deck. Satellite cloud texture and procedural detail shade the surface; undiscovered terrain no longer shows through a transparent blue veil.
- Discoveries dissolve an irregular opening in the cloud deck, revealing the real Earth texture beneath.
- Mobile globe framing accounts for narrow viewports, and the guide becomes a compact bottom panel.
- Direct `file://` launches show a local-server setup message even when browser modules cannot load.

The stars, constellation strokes, and compass ring are decorative—not a calibrated sky map or live astronomical dataset.

## Open locally

Leave Flask running on port 5000. In a second terminal, run this from the directory containing Uncharted:

```sh
python -m http.server 8000
```

Open **http://localhost:8000/Uncharted/**. Your existing local API URL `http://127.0.0.1:5000` is correct.
