import { accessToken } from '../auth/tokenManager.js';
import { requestJson } from '../utils/apiUtils.js';
export async function spotifyRequest(path, options = {}) {
    if (!path.startsWith('/') || path.startsWith('//'))
        throw new Error('Invalid API path.');
    const send = async (force) => requestJson(`https://api.spotify.com/v1${path}`, { ...options, retries: options.method ? 0 : 1, headers: { 'Content-Type': 'application/json', ...options.headers, Authorization: `Bearer ${await accessToken(force)}` } });
    try {
        return await send(false);
    }
    catch (error) {
        if (error.status === 401)
            return send(true);
        throw error;
    }
}
export const fetchTop = (type, range, signal) => spotifyRequest(`/me/top/${type}?time_range=${range}&limit=50`, { signal });
export const fetchMe = signal => spotifyRequest('/me', { signal });
export const fetchRecent = signal => spotifyRequest('/me/player/recently-played?limit=50', { signal });
export const fetchSaved = signal => spotifyRequest('/me/tracks?limit=50', { signal });
