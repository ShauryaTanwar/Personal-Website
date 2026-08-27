/*
  VERCEL SERVERLESS FUNCTION — RECENT SPOTIFY TRACK
  -------------------------------------------------
  This file runs on the server, NOT in the browser.

  Required environment variables (never commit these values):
    SPOTIFY_CLIENT_ID
    SPOTIFY_CLIENT_SECRET
    SPOTIFY_REFRESH_TOKEN

  The browser calls /api/spotify-recent. This function refreshes a short-lived
  Spotify access token, requests exactly one recently played track, and returns
  only the fields the portfolio needs to display.
*/

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return res.status(503).json({
      error: "Spotify is not configured yet. Add the three Spotify environment variables described in README.md."
    });
  }

  try {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken
      })
    });

    const tokenPayload = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenPayload.access_token) {
      const detail = tokenPayload.error_description || tokenPayload.error || "Token refresh failed.";
      throw new Error(detail);
    }

    const recentResponse = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", {
      headers: { "Authorization": `Bearer ${tokenPayload.access_token}` }
    });

    const recentPayload = await recentResponse.json();
    if (!recentResponse.ok) {
      const detail = recentPayload?.error?.message || "Could not read recently played tracks.";
      throw new Error(detail);
    }

    const item = recentPayload.items?.[0];
    const track = item?.track;
    if (!track) {
      return res.status(200).json({ track: null });
    }

    // Cache only briefly so the portfolio updates without hammering Spotify.
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({
      track: {
        name: track.name,
        artists: Array.isArray(track.artists) ? track.artists.map(artist => artist.name) : [],
        album: track.album?.name || "",
        artwork: track.album?.images?.[0]?.url || "",
        spotifyUrl: track.external_urls?.spotify || "https://open.spotify.com/",
        playedAt: item.played_at || null
      }
    });
  } catch (error) {
    console.error("Spotify recent-track error:", error);
    return res.status(502).json({ error: error.message || "Spotify request failed." });
  }
};
