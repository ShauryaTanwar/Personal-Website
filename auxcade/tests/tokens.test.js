import test from 'node:test';
import assert from 'node:assert/strict';
import {saveToken,readToken,accessToken,clearToken} from '../src/auth/tokenManager.js';

test('concurrent refresh preserves omitted scope and rotates the refresh token', async () => {
    const originalFetch=globalThis.fetch, originalStorage=globalThis.sessionStorage;
    const data=new Map();
    globalThis.sessionStorage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
    let requests=0;
    globalThis.fetch=async()=>{
        requests++;
        return new Response(JSON.stringify({access_token:'test-access-new',refresh_token:'test-refresh-new',expires_in:3600}),{status:200,headers:{'Content-Type':'application/json'}});
    };
    try {
        saveToken({access_token:'test-access-old',refresh_token:'test-refresh-old',expires_in:-1,scope:'streaming user-top-read'},'public-test-client');
        assert.deepEqual(await Promise.all([accessToken(),accessToken(),accessToken()]),Array(3).fill('test-access-new'));
        assert.equal(requests,1);
        assert.equal(readToken().scope,'streaming user-top-read');
        assert.equal(readToken().refreshToken,'test-refresh-new');
        clearToken();
        assert.equal(readToken(),null);
    } finally {globalThis.fetch=originalFetch;globalThis.sessionStorage=originalStorage;}
});
