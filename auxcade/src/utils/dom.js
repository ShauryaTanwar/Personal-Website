// Escape every piece of remote or user-provided text before interpolating HTML.
export const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
export const number = value => new Intl.NumberFormat('en-US').format(value || 0);
export function safeUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' ? url.href : '';
    }
    catch {
        return '';
    }
}
export function artwork(item, className = '') {
    const url = safeUrl(item?.image);
    const description = item?.artistId || item?.albumId ? `${item?.name || 'Track'} cover` : `${item?.name || 'Artist'} artist image`;
    return url ? `<img class="cover ${className}" src="${escapeHtml(url)}" alt="${escapeHtml(description)}" loading="lazy" referrerpolicy="no-referrer" />` : `<span class="cover cover-fallback ${className}" aria-label="Artwork unavailable">${escapeHtml((item?.name || 'A').slice(0, 2).toUpperCase())}</span>`;
}
export function spotifyLink(item, label = 'Open in Spotify') {
    const url = safeUrl(item?.url);
    return url ? `<a class="spotify-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>` : '';
}
export function meter(value, label, max = 100) {
    return `<div class="meter" role="meter" aria-label="${escapeHtml(label)}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}"><i style="width:${Math.max(0, Math.min(100, value / max * 100))}%"></i></div>`;
}
export function attachImageFallback(root) {
    root.addEventListener('error', event => {
        if (event.target instanceof HTMLImageElement) {
            const fallback = document.createElement('span');
            fallback.className = event.target.className + ' cover-fallback';
            fallback.textContent = '♫';
            fallback.setAttribute('aria-label', 'Artwork unavailable');
            event.target.replaceWith(fallback);
        }
    }, true);
}
