export function randomToken(bytes = 48) {
    return base64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}
export function base64Url(bytes) {
    return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export async function codeChallenge(verifier) {
    return base64Url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
}
export function validCallback(pending, state, now = Date.now()) {
    return !!pending && typeof state === 'string' && state === pending.state && now - pending.createdAt < 600000 && now >= pending.createdAt;
}
