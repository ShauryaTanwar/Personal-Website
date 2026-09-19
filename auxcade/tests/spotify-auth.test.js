import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizationUrl, DATA_SCOPES, PLAYBACK_SCOPES } from '../src/auth/spotifyAuth.js';

const clientId = '0123456789abcdef0123456789abcdef';
const redirect = 'https://example.test/auxcade/';
const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

test('one-click authorization URL requests data scopes without a client secret', async () => {
    const url = new URL(await authorizationUrl(clientId, redirect, verifier, 'test-state'));
    assert.equal(url.origin + url.pathname, 'https://accounts.spotify.com/authorize');
    assert.equal(url.searchParams.get('client_id'), clientId);
    assert.equal(url.searchParams.get('redirect_uri'), redirect);
    assert.equal(url.searchParams.get('response_type'), 'code');
    assert.equal(url.searchParams.get('state'), 'test-state');
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
    assert.ok(url.searchParams.get('code_challenge'));
    assert.deepEqual(url.searchParams.get('scope').split(' '), DATA_SCOPES);
    assert.equal(url.searchParams.has('client_secret'), false);
});

test('playback scopes are added only when the owner enables playback', async () => {
    const url = new URL(await authorizationUrl(clientId, redirect, verifier, 'test-state', true));
    const scopes = url.searchParams.get('scope').split(' ');
    for (const scope of [...DATA_SCOPES, ...PLAYBACK_SCOPES])
        assert.ok(scopes.includes(scope));
});
