import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoProfile } from '../src/demo/demoProfile.js';
import { normalizeProfile } from '../src/profile/profileBuilder.js';
import { ranked, rankMovement } from '../src/profile/musicProfile.js';
import { deriveStats } from '../src/profile/profileStats.js';
import { seededRandom } from '../src/utils/random.js';
import { generateQuestions } from '../src/games/whosHigher/questionGenerator.js';
import { generatePuzzle, checkCrate } from '../src/games/crateCode/puzzleGenerator.js';
import { roastProfile } from '../src/games/roastMachine/roastRules.js';
import { TrackAttackEngine, circleHitsRect } from '../src/games/trackAttack/trackAttackEngine.js';
import { DropEngine, findGroups, resolveBoard, COLS, ROWS } from '../src/games/albumDrop/dropEngine.js';
import { PartyEngine } from '../src/games/auxCord/partyEngine.js';
import { Progression } from '../src/progression/progression.js';
import { distanceKm, geographicCenter, spherePoint } from '../src/games/worldTour/geography.js';
import { codeChallenge, validCallback, randomToken } from '../src/auth/pkce.js';
import { escapeHtml, safeUrl } from '../src/utils/dom.js';
const demo = createDemoProfile();
test('demo and real normalizer share one profile shape', () => {
    assert.equal(demo.tracks.length, 60);
    assert.equal(demo.artists.length, 20);
    for (const period of ['short_term', 'medium_term', 'long_term']) {
        assert.equal(new Set(demo.topTracks[period]).size, 50);
        assert.ok(demo.topTracks[period].every(id => demo.tracks.some(t => t.id === id)));
    }
    const sparse = normalizeProfile({ user: { account_id: 'stable-account', display_name: 'Player' }, artists: { short_term: { items: [] } }, tracks: {}, warnings: [] });
    assert.equal(sparse.user.id, 'stable-account');
    assert.deepEqual(sparse.tracks, []);
    assert.equal(sparse.stats.averageYear, null);
    assert.deepEqual(Object.keys(sparse).sort(), Object.keys(demo).sort());
});
test('normalizer deduplicates tracks, preserves saved flags, tolerates missing artwork', () => {
    const track = { id: 'one', name: 'A track', artists: [{ id: 'a', name: 'Artist' }], album: { id: 'album', name: 'Album', release_date: '1999' } };
    const raw = { user: { id: 'user' }, tracks: { short_term: { items: [track, track, null] } }, saved: { items: [{ track }] }, recent: { items: [{ track, played_at: '2026-09-18T00:00:00Z' }] } };
    const profile = normalizeProfile(raw);
    assert.equal(profile.tracks.length, 1);
    assert.equal(profile.artists.length, 1);
    assert.equal(profile.tracks[0].saved, true);
    assert.equal(profile.tracks[0].image, null);
    assert.equal(profile.tracks[0].year, 1999);
    assert.equal(profile.recent.length, 1);
    assert.throws(() => normalizeProfile({ user: { id: 'x' }, tracks: { short_term: { items: { wrong: true } } } }), /unexpected/);
});
test('rank movement uses long-term minus short-term and missing is unknown', () => {
    assert.equal(rankMovement(demo, 'artist-3'), 19);
    assert.equal(rankMovement(demo, 'missing'), null);
    assert.equal(ranked(demo)[0].rank, 1);
});
test('all quiz modes produce ten distinct, non-tied, correct comparisons', () => {
    for (const mode of ['artists', 'tracks', 'mixed', 'movement']) {
        const questions = generateQuestions(demo, mode, 'medium_term', seededRandom(42));
        assert.equal(questions.length, 10);
        assert.equal(new Set(questions.map(q => [q.a.id, q.b.id].sort().join('|'))).size, 10);
        for (const q of questions) {
            assert.notEqual(q.a.id, q.b.id);
            assert.ok(q.values[q.winner] > q.values[q.winner === q.a.id ? q.b.id : q.a.id]);
        }
        assert.ok(questions[0].gap > questions[9].gap);
    }
    assert.equal(generateQuestions({ ...demo, artists: [], topArtists: { short_term: [], medium_term: [], long_term: [] } }).length, 0);
});
test('fifty generated crate puzzles have distinct answers and unique clue matches', () => {
    for (let seed = 1; seed <= 50; seed++) {
        const p = generatePuzzle(demo, seededRandom(seed));
        assert.equal(new Set(p.slots.map(s => s.trackId)).size, 4);
        for (const slot of p.slots) {
            assert.deepEqual(slot.matches, [slot.trackId]);
            assert.ok(slot.clues.length > 0);
        }
        assert.equal(checkCrate(p.slots, p.slots.map(s => s.trackId)), 4);
        assert.equal(checkCrate(p.slots, [null, null, null, null]), 0);
    }
    assert.equal(generatePuzzle({ ...demo, tracks: [] }), null);
});
test('roasts are local, evidence-backed, varied, and handle an empty profile', () => {
    const a = roastProfile(demo, seededRandom(1)), b = roastProfile(demo, seededRandom(2));
    assert.equal(a.length, 6);
    assert.notDeepEqual(a, b);
    assert.ok(a.every(r => r.evidence && r.joke && r.title));
    const empty = { ...demo, tracks: [], artists: [], topTracks: { ...demo.topTracks, medium_term: [] }, topArtists: { short_term: [], medium_term: [], long_term: [] }, savedTrackIds: [], recent: [] };
    empty.stats = deriveStats(empty);
    assert.doesNotThrow(() => roastProfile(empty));
});
test('Track Attack banks collected records, preserves wall collision, and ends once', () => {
    let ended = 0;
    const engine = new TrackAttackEngine(demo, e => { if (e.type === 'end')
        ended++; }, seededRandom(9));
    const record = engine.records[0];
    engine.player.x = record.x;
    engine.player.y = record.y;
    engine.update(.01, new Set());
    assert.equal(engine.carry.length, 1);
    engine.player.x = 440;
    engine.player.y = 245;
    engine.update(.01, new Set());
    assert.equal(engine.carry.length, 0);
    assert.equal(engine.totalBanked, 1);
    assert.ok(engine.score > 0);
    assert.equal(circleHitsRect(10, 10, 5, { x: 12, y: 12, w: 10, h: 10 }), true);
    assert.equal(circleHitsRect(0, 0, 5, { x: 12, y: 12, w: 10, h: 10 }), false);
    engine.time = 0;
    engine.update(.1, new Set());
    engine.update(.1, new Set());
    assert.equal(ended, 1);
});
test('Album Drop clears connected artists, then gravity triggers a real cascade', () => {
    const board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    const a = { artistId: 'a', albumId: 'aa', year: 2001 }, b = { artistId: 'b', albumId: 'bb', year: 1992 };
    board[9][0] = a;
    board[8][0] = a;
    board[7][0] = a;
    board[6][0] = b;
    board[9][1] = b;
    board[9][2] = b;
    assert.equal(findGroups(board).length, 1);
    const result = resolveBoard(board);
    assert.equal(result.chains, 2);
    assert.equal(result.cleared, 6);
    assert.equal(result.albumClear, true);
    assert.ok(board.every(row => row.every(cell => cell === null)));
});
test('power pairs clear; separated equal artists do not', () => {
    const board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    const t = { artistId: 'a', albumId: 'aa' };
    board[9][0] = { ...t, power: true };
    board[9][1] = t;
    board[9][5] = t;
    assert.equal(findGroups(board)[0].length, 2);
    resolveBoard(board);
    assert.equal(board[9][5], t);
});
test('Album Drop bounds pieces and eventually completes or tops out', () => {
    const engine = new DropEngine(demo, () => { }, seededRandom(4));
    for (let i = 0; i < 20; i++)
        engine.move(-1);
    assert.equal(engine.active.x, 0);
    let safety = 0;
    while (!engine.finished && safety++ < 50)
        engine.hardDrop();
    assert.equal(engine.finished, true);
    assert.ok(engine.drops <= 40);
});
test('party deductions award once and turns finish cleanly', () => {
    const party = new PartyEngine(demo, seededRandom(5));
    assert.ok(party.guests.length >= 3);
    const guest = party.activeGuests[0];
    assert.equal(party.infer(guest.id, guest.ruleId), true);
    assert.equal(party.infer(guest.id, guest.ruleId), null);
    assert.equal(party.correctDeductions, 1);
    assert.equal(party.refresh(), true);
    assert.equal(party.refresh(), true);
    assert.equal(party.refresh(), false);
    while (!party.finished)
        party.select(party.hand[0].id);
    assert.ok(party.turn <= 12);
    assert.equal(party.select('anything'), null);
});
test('progression cannot pay the same run or achievement twice', () => {
    const progress = new Progression(`test-${Date.now()}`);
    progress.complete('higher', { score: 1000, won: true, correct: 8, rounds: 10 }, 'run');
    const coins = progress.data.coins;
    progress.complete('higher', { score: 1000, won: true }, 'run');
    assert.equal(progress.data.coins, coins);
    assert.equal(progress.data.gamesPlayed, 1);
    progress.award('perfect-ear');
    const after = progress.data.coins;
    progress.award('perfect-ear');
    assert.equal(progress.data.coins, after);
    assert.equal(progress.purchase('mint', 100000), false);
    assert.equal(progress.data.quizCorrect, 8);
    progress.forget();
});
test('globe math is 3D and handles the international date line', () => {
    assert.deepEqual(spherePoint(0, 0), [0, 0, 1]);
    assert.ok(Math.abs(distanceKm({ lat: 0, lon: 0 }, { lat: 0, lon: 90 }) - 10007.5) < 2);
    const center = geographicCenter([{ lat: 0, lon: 179 }, { lat: 0, lon: -179 }]);
    assert.ok(Math.abs(center.lon) > 179);
    assert.equal(geographicCenter([]), null);
});
test('PKCE matches the RFC 7636 test vector and rejects stale state', async () => {
    assert.equal(await codeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
    assert.match(randomToken(), /^[A-Za-z0-9_-]{64}$/);
    assert.equal(validCallback({ state: 'correct', createdAt: 1000 }, 'wrong', 2000), false);
    assert.equal(validCallback({ state: 'correct', createdAt: 1000 }, 'correct', 700000), false);
    assert.equal(validCallback({ state: 'correct', createdAt: 1000 }, 'correct', 2000), true);
});
test('remote HTML and unsafe URLs cannot be rendered as active markup', () => {
    assert.equal(escapeHtml('<script>"&'), '&lt;script&gt;&quot;&amp;');
    assert.equal(safeUrl('javascript:alert(1)'), '');
    assert.equal(safeUrl('https://open.spotify.com/track/abc'), 'https://open.spotify.com/track/abc');
});
