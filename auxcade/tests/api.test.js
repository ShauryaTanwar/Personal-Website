import test from 'node:test';
import assert from 'node:assert/strict';
import { requestJson, ApiError, parseRetryAfter } from '../src/utils/apiUtils.js';
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
test('JSON success and no-content playback responses work', async () => {
    assert.deepEqual(await requestJson('https://example.test', { fetchImpl: async () => json({ items: [] }) }), { items: [] });
    assert.equal(await requestJson('https://example.test', { fetchImpl: async () => new Response(null, { status: 204 }) }), null);
});
test('expired tokens and allowlist denial return useful typed errors', async () => {
    await assert.rejects(requestJson('https://example.test', { fetchImpl: async () => json({}, 401) }), e => e instanceof ApiError && e.status === 401 && e.message.includes('expired'));
    await assert.rejects(requestJson('https://example.test', { fetchImpl: async () => json({}, 403) }), e => e.status === 403 && e.message.includes('allowlist'));
});
test('long rate limits and exhausted quota do not retry in a loop', async () => {
    let calls = 0;
    await assert.rejects(requestJson('https://example.test', { fetchImpl: async () => { calls++; return json({}, 429, { 'Retry-After': '120' }); } }), e => e.status === 429 && e.retryAfter === 120);
    assert.equal(calls, 1);
    calls = 0;
    await assert.rejects(requestJson('https://example.test', { fetchImpl: async () => { calls++; return json({ error: { reason: 'QUOTA_EXCEEDED' } }, 429); } }), e => e.message.includes('quota'));
    assert.equal(calls, 1);
});
test('Retry-After parses seconds and HTTP dates', () => { assert.equal(parseRetryAfter('7'), 7); assert.equal(parseRetryAfter(new Date(12000).toUTCString(), 1000), 11); });
test('network disconnection, malformed JSON, and abort are recoverable', async () => {
    await assert.rejects(requestJson('https://example.test', { fetchImpl: async () => { throw new TypeError('Failed to fetch'); } }), /offline/);
    await assert.rejects(requestJson('https://example.test', { fetchImpl: async () => new Response('not json') }), /unreadable/);
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(requestJson('https://example.test', { signal: controller.signal, fetchImpl: async (url, { signal }) => { signal.throwIfAborted(); } }), e => e.name === 'AbortError');
});
test('server errors retry only the configured bounded number', async () => {
    let calls = 0;
    const response = await requestJson('https://example.test', { fetchImpl: async () => { calls++; return calls === 1 ? json({}, 503) : json({ ok: true }); } });
    assert.equal(calls, 2);
    assert.equal(response.ok, true);
});
