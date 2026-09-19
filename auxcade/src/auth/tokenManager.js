import { readJson, writeJson, removeItem } from '../utils/storage.js';
import { requestJson, ApiError } from '../utils/apiUtils.js';
const TOKEN_KEY = 'auxcade:spotify:token';
let refreshing = null;
export const readToken = () => readJson(TOKEN_KEY, null, true);
export function saveToken(response, clientId, oldRefresh = null, oldScope = '') {
    if (typeof response?.access_token !== 'string' || !Number.isFinite(response?.expires_in))
        throw new ApiError('Spotify returned an incomplete token response.');
    const token = { accessToken: response.access_token, refreshToken: response.refresh_token || oldRefresh, expiresAt: Date.now() + response.expires_in * 1000, clientId, scope: response.scope ?? oldScope };
    if (!writeJson(TOKEN_KEY, token, true))
        throw new ApiError('Session storage is unavailable. Allow browser storage to connect Spotify.');
    return token;
}
export function clearToken() { removeItem(TOKEN_KEY, true); removeItem('auxcade:profile', true); }
export async function accessToken(force = false) {
    const token = readToken();
    if (!token)
        throw new ApiError('Connect Spotify to load your music.', 401);
    if (!force && token.expiresAt > Date.now() + 45000)
        return token.accessToken;
    if (!token.refreshToken) {
        clearToken();
        throw new ApiError('Your Spotify session has expired. Please reconnect.', 401);
    }
    // Concurrent requests share one refresh; refresh-token rotation stays atomic.
    if (!refreshing)
        refreshing = (async () => {
            try {
                const response = await requestJson('https://accounts.spotify.com/api/token', { method: 'POST', retries: 0, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: token.refreshToken, client_id: token.clientId }) });
                return saveToken(response, token.clientId, token.refreshToken, token.scope).accessToken;
            }
            catch (error) {
                if ([400, 401, 403].includes(error.status))
                    clearToken();
                throw error;
            }
            finally {
                refreshing = null;
            }
        })();
    return refreshing;
}
