/*
  GITHUB PAGES SPOTIFY SNAPSHOT
  -----------------------------
  This script runs inside GitHub Actions, NOT in the visitor's browser.

  It exchanges your private refresh token for a short-lived Spotify access
  token, retrieves one recently played track, and writes ONLY display-safe
  metadata to spotify-recent.json for GitHub Pages to publish.

  NEVER hard-code credentials in this file. Add them as GitHub Actions secrets:
    SPOTIFY_CLIENT_ID
    SPOTIFY_CLIENT_SECRET
    SPOTIFY_REFRESH_TOKEN
*/

import fs from "node:fs/promises";

const outputPath = new URL("../spotify-recent.json", import.meta.url);
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

async function writeSnapshot(payload) {
  await fs.writeFile(
    outputPath,
    `${JSON.stringify({ ...payload, updatedAt: new Date().toISOString() }, null, 2)}\n`,
    "utf8"
  );
}

// Keep the rest of the site deployable before Spotify is configured.
if (!clientId || !clientSecret || !refreshToken) {
  await writeSnapshot({
    status: "not_configured",
    track: null,
    message: "Spotify secrets have not been added to GitHub Actions yet."
  });
  console.log("Spotify snapshot skipped: one or more GitHub Actions secrets are missing.");
  process.exit(0);
}

try {
  // 1) Exchange the long-lived refresh token for a one-hour access token.
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    })
  });

  const tokenPayload = await tokenResponse.json().catch(() => ({}));

  if (!tokenResponse.ok || !tokenPayload.access_token) {
    // Spotify refresh tokens now expire after six months. Expose only a safe
    // status string publicly; never write the actual refresh token to the file.
    if (tokenPayload.error === "invalid_grant") {
      await writeSnapshot({
        status: "reauthorization_required",
        track: null,
        message: "Spotify authorization needs to be renewed."
      });
      console.error("Spotify refresh token expired or was revoked. Reauthorize the app and replace SPOTIFY_REFRESH_TOKEN.");
      process.exit(0);
    }

    throw new Error(tokenPayload.error_description || tokenPayload.error || `Token request failed (${tokenResponse.status}).`);
  }

  // 2) Ask Spotify for exactly one recently played track.
  const recentResponse = await fetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=1",
    { headers: { Authorization: `Bearer ${tokenPayload.access_token}` } }
  );
  const recentPayload = await recentResponse.json().catch(() => ({}));

  if (!recentResponse.ok) {
    throw new Error(recentPayload?.error?.message || `Recently played request failed (${recentResponse.status}).`);
  }

  const item = recentPayload.items?.[0];
  const track = item?.track;

  if (!track) {
    await writeSnapshot({
      status: "empty",
      track: null,
      message: "No recently played track was returned by Spotify."
    });
    console.log("Spotify returned no recently played track.");
    process.exit(0);
  }

  // 3) Publish only the metadata the portfolio actually needs.
  await writeSnapshot({
    status: "ok",
    track: {
      name: track.name || "Unknown track",
      artists: Array.isArray(track.artists) ? track.artists.map(artist => artist.name).filter(Boolean) : [],
      album: track.album?.name || "",
      artwork: track.album?.images?.[0]?.url || "",
      spotifyUrl: track.external_urls?.spotify || "https://open.spotify.com/",
      playedAt: item.played_at || null
    }
  });

  console.log(`Spotify snapshot updated: ${track.name} — ${track.artists?.map(a => a.name).join(", ") || "Unknown artist"}`);
} catch (error) {
  // A temporary Spotify/network failure should not break the entire portfolio.
  await writeSnapshot({
    status: "temporarily_unavailable",
    track: null,
    message: "Spotify data is temporarily unavailable."
  });
  console.error("Spotify snapshot update failed:", error.message || error);
}
