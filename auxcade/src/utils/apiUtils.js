export class ApiError extends Error {
    constructor(message, status = 0, retryAfter = 0) { super(message); this.name = 'ApiError'; this.status = status; this.retryAfter = retryAfter; }
}
export function parseRetryAfter(value, now = Date.now()) {
    if (!value)
        return 1;
    const seconds = Number(value);
    return Number.isFinite(seconds) ? Math.max(1, seconds) : Math.max(1, Math.ceil((Date.parse(value) - now) / 1000) || 1);
}
export const delay = (ms, signal) => new Promise((resolve, reject) => {
    if (signal?.aborted)
        return reject(new DOMException('Canceled', 'AbortError'));
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, ms);
    function abort() { clearTimeout(timer); reject(new DOMException('Canceled', 'AbortError')); }
    signal?.addEventListener('abort', abort, { once: true });
});
/** Bounded GET retries; never spin on quota exhaustion or ignore Retry-After. */
export async function requestJson(url, { signal, timeout = 12000, retries = 1, fetchImpl = fetch, ...options } = {}) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const abort = () => controller.abort();
        signal?.addEventListener('abort', abort, { once: true });
        if (signal?.aborted)
            controller.abort();
        const timer = setTimeout(abort, timeout);
        try {
            const response = await fetchImpl(url, { ...options, signal: controller.signal });
            if (response.status === 204)
                return null;
            let body;
            try {
                body = await response.json();
            }
            catch {
                throw new ApiError('The service returned an unreadable response.', response.status);
            }
            if (response.ok)
                return body;
            if (response.status === 429) {
                const wait = parseRetryAfter(response.headers.get('Retry-After'));
                if (body?.error?.reason !== 'QUOTA_EXCEEDED' && wait <= 10 && attempt < retries) {
                    await delay(wait * 1000, signal);
                    continue;
                }
                throw new ApiError(body?.error?.reason === 'QUOTA_EXCEEDED' ? 'Spotify’s application quota is used up. Please try Demo Mode.' : `The service is busy. Try again in ${wait} seconds.`, 429, wait);
            }
            if (response.status >= 500 && attempt < retries) {
                await delay(600 * (attempt + 1), signal);
                continue;
            }
            const messages = { 401: 'Your Spotify session has expired. Please reconnect.', 403: 'Spotify denied access. Your account may need to be added to this app’s allowlist.', 404: 'This item is no longer available.' };
            throw new ApiError(messages[response.status] || 'The music service is not responding right now.', response.status);
        }
        catch (error) {
            if (signal?.aborted)
                throw new DOMException('Canceled', 'AbortError');
            if (error instanceof ApiError)
                throw error;
            throw new ApiError(error.name === 'AbortError' ? 'The request took too long. Please try again.' : 'You appear to be offline. The demo arcade is still available.');
        }
        finally {
            clearTimeout(timer);
            signal?.removeEventListener('abort', abort);
        }
    }
}
