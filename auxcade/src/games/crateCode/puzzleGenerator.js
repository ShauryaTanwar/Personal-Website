import { shuffle } from '../../utils/random.js';
import { artistRank } from '../../profile/musicProfile.js';
export function recordFacts(profile, track) {
    const trackRank = profile.topTracks.medium_term.indexOf(track.id) + 1;
    return { artistRank: artistRank(profile, track.artistId), trackRank: trackRank || null, decade: track.year ? Math.floor(track.year / 10) * 10 : null, saved: track.saved, albumCount: profile.stats.albumCounts[track.albumId] || 1 };
}
function cluesFor(profile, target, pool, random) {
    const f = recordFacts(profile, target);
    const possible = [
        f.decade !== null && { text: `Released in the ${f.decade}s.`, test: t => recordFacts(profile, t).decade === f.decade },
        f.artistRank !== null && { text: `The artist ranks ${f.artistRank % 2 === 0 ? 'even' : 'odd'} in current rotation.`, test: t => { const r = artistRank(profile, t.artistId); return r !== null && r % 2 === f.artistRank % 2; } },
        f.artistRank !== null && { text: `The artist is ${f.artistRank <= 10 ? 'inside' : 'outside'} your top ten.`, test: t => { const r = artistRank(profile, t.artistId); return r !== null && (r <= 10) === (f.artistRank <= 10); } },
        f.trackRank !== null && { text: `The track is ranked #${Math.floor((f.trackRank - 1) / 10) * 10 + 1}–${Math.floor((f.trackRank - 1) / 10) * 10 + 10}.`, test: t => { const r = recordFacts(profile, t).trackRank; return r !== null && Math.floor((r - 1) / 10) === Math.floor((f.trackRank - 1) / 10); } },
        profile.capabilities.saved && { text: f.saved ? 'Present in the saved-track sample.' : 'Not in the saved-track sample.', test: t => t.saved === f.saved },
        { text: `The title has ${target.name.length % 2 === 0 ? 'an even' : 'an odd'} number of characters (including spaces).`, test: t => t.name.length % 2 === target.name.length % 2 },
        { text: `The album contributes ${f.albumCount} loaded records.`, test: t => recordFacts(profile, t).albumCount === f.albumCount },
    ].filter(Boolean);
    let candidates = pool, clues = [];
    for (const clue of shuffle(possible, random)) {
        const narrowed = candidates.filter(clue.test);
        if (narrowed.length < candidates.length) {
            clues.push(clue);
            candidates = narrowed;
        }
        if (candidates.length === 1)
            break;
    }
    // Deterministic last discriminator guarantees a unique, verifiable puzzle,
    // even for sparse profiles where every track has the same artist/year.
    if (candidates.length !== 1) {
        const index = pool.findIndex(t => t.id === target.id) + 1;
        clues.push({ text: `Its catalog number is ${index}.`, test: t => t.id === target.id });
        candidates = [target];
    }
    return { clues: clues.map(c => c.text), matches: candidates.map(t => t.id), scan: `Artist: ${target.artistName}. Album: ${target.albumName}.` };
}
export function generatePuzzle(profile, random = Math.random) {
    const pool = shuffle(profile.tracks, random).slice(0, 12);
    if (pool.length < 6)
        return null;
    const answer = shuffle(pool, random).slice(0, 4);
    const slots = answer.map((track, index) => ({ number: index + 1, trackId: track.id, ...cluesFor(profile, track, pool, random) }));
    return { pool, slots };
}
export function checkCrate(slots, assignments) { return slots.reduce((count, slot, i) => count + (slot.trackId === assignments[i] ? 1 : 0), 0); }
