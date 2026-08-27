/*
  ONE-TIME LOCAL SPOTIFY AUTHORIZATION HELPER
  -------------------------------------------
  Run this locally to authorize YOUR Spotify account and obtain the refresh
  token that your deployed serverless function needs.

  Before running, create a Spotify developer app and add this exact redirect:
    http://127.0.0.1:8888/callback

  Then set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your terminal.
  This script never writes either credential to a file.
*/

import http from "node:http";
import crypto from "node:crypto";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = "http://127.0.0.1:8888/callback";
const scope = "user-read-recently-played";

if (!clientId || !clientSecret) {
  console.error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET environment variable.");
  process.exit(1);
}

const state = crypto.randomBytes(18).toString("hex");
const authorize = new URL("https://accounts.spotify.com/authorize");
authorize.search = new URLSearchParams({
  response_type: "code",
  client_id: clientId,
  scope,
  redirect_uri: redirectUri,
  state
}).toString();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", redirectUri);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end("Not found");
    return;
  }

  if (url.searchParams.get("state") !== state) {
    res.writeHead(400, { "Content-Type": "text/plain" }).end("State check failed. Close this window and try again.");
    server.close();
    return;
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (error || !code) {
    res.writeHead(400, { "Content-Type": "text/plain" }).end(`Authorization failed: ${error || "missing code"}`);
    server.close();
    return;
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
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri
      })
    });
    const payload = await tokenResponse.json();
    if (!tokenResponse.ok || !payload.refresh_token) {
      throw new Error(payload.error_description || payload.error || "No refresh token returned.");
    }

    console.log("\nSUCCESS — add this value to your GitHub repository Actions secret named SPOTIFY_REFRESH_TOKEN:\n");
    console.log(payload.refresh_token);
    console.log("\nTreat it like a password. Do not commit it to the repository or paste it into frontend JavaScript.\n");
    res.writeHead(200, { "Content-Type": "text/plain" }).end("Spotify authorization succeeded. Return to your terminal to copy the refresh token, then close this tab.");
  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "text/plain" }).end("Token exchange failed. Check the terminal for details.");
  } finally {
    server.close();
  }
});

server.listen(8888, "127.0.0.1", () => {
  console.log("\n1. Copy this URL into your browser and authorize the app:\n");
  console.log(authorize.toString());
  console.log("\n2. Spotify will redirect back to this script automatically.\n");
});
