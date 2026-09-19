import { CONFIG } from '../config.js';
import { randomToken, codeChallenge, validCallback } from './pkce.js';
import { saveToken, clearToken } from './tokenManager.js';
import { readJson, writeJson, removeItem } from '../utils/storage.js';
import { requestJson } from '../utils/apiUtils.js';
const KEY = 'auxcade:spotify:pending';
export const DATA_SCOPES = ['user-top-read', 'user-read-recently-played', 'user-library-read'];
export const PLAYBACK_SCOPES = ['streaming', 'user-read-private', 'user-read-email', 'user-modify-playback-state', 'user-read-playback-state'];
export function redirectUri() {
    return CONFIG.spotifyRedirectUri || new URL(import.meta.env.BASE_URL, location.href).href.split('?')[0].split('#')[0];
}
export function authorizationUrl(clientId, redirect, verifier, state, withPlayback = false) {
    return codeChallenge(verifier).then(challenge => {
        const params = new URLSearchParams({
            client_id: clientId,
            response_type: 'code',
            redirect_uri: redirect,
            state,
            scope: [...DATA_SCOPES, ...(withPlayback ? PLAYBACK_SCOPES : [])].join(' '),
            code_challenge_method: 'S256',
            code_challenge: challenge,
        });
        return `https://accounts.spotify.com/authorize?${params}`;
    });
}
export async function connectSpotify(clientId, withPlayback = false) {
    if (!/^[a-f0-9]{32}$/i.test(clientId))
        throw new Error('Spotify connection has not been configured by the site owner. Demo Mode is still available.');
    const redirect = redirectUri();
    const parsed = new URL(redirect);
    if (parsed.hostname === 'localhost')
        throw new Error('Spotify requires 127.0.0.1 instead of localhost. Open this app at http://127.0.0.1:4173/.');
    if (parsed.protocol !== 'https:' && !['127.0.0.1', '[::1]'].includes(parsed.hostname))
        throw new Error('Spotify login requires HTTPS or a loopback IP address.');
    const verifier = randomToken();
    const state = randomToken(24);
    const pending = { verifier, state, clientId, redirect, createdAt: Date.now() };
    if (!writeJson(KEY, pending, true))
        throw new Error('Enable session storage to connect Spotify. Demo Mode works without it.');
    location.assign(await authorizationUrl(clientId, redirect, verifier, state, withPlayback));
}
export async function handleSpotifyCallback() {
    const params = new URLSearchParams(location.search);
    if (!params.has('code') && !params.has('error'))
        return false;
    const pending = readJson(KEY, null, true);
    removeItem(KEY, true);
    // Remove authorization codes from URL/history immediately, including failures.
    history.replaceState({}, '', location.pathname + location.hash);
    if (!validCallback(pending, params.get('state')))
        throw new Error('This login link expired or could not be verified. Please connect again.');
    if (params.has('error'))
        throw new Error('Spotify login was canceled. You can reconnect or play the demo.');
    const response = await requestJson('https://accounts.spotify.com/api/token', { method: 'POST', retries: 0, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: pending.clientId, grant_type: 'authorization_code', code: params.get('code'), redirect_uri: pending.redirect, code_verifier: pending.verifier }) });
    removeItem('auxcade:profile', true);
    saveToken(response, pending.clientId);
    return true;
}
export function disconnectSpotify() { clearToken(); removeItem(KEY, true); }
