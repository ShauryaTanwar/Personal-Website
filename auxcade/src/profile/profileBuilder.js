import { fetchTop, fetchMe, fetchRecent, fetchSaved } from '../api/spotify.js';
import { readToken } from '../auth/tokenManager.js';
import { RANGES } from './musicProfile.js';
import { deriveStats } from './profileStats.js';
import { readJson, writeJson } from '../utils/storage.js';
const imageOf = images => Array.isArray(images) ? ([...images].filter(i => i?.url).sort((a, b) => (a.width || 0) - (b.width || 0)).find(i => (i.width || 0) >= 160) || images[0])?.url || null : null;
export function normalizeProfile(raw) {
    if (!raw?.user || typeof raw.user !== 'object')
        throw new Error('Spotify returned an incomplete account profile. Please reconnect.');
    const artists = new Map(), tracks = new Map(), topArtists = {}, topTracks = {};
    function addArtist(a) {
        if (!a?.id || !a.name)
            return null;
        const previous = artists.get(a.id);
        artists.set(a.id, { ...previous, id: a.id, name: a.name, image: imageOf(a.images) || previous?.image || null, url: a.external_urls?.spotify || previous?.url || null, uri: a.uri || previous?.uri || null });
        return a.id;
    }
    function addTrack(t, saved = false) {
        if (!t?.id || !t.name || !Array.isArray(t.artists) || !t.artists.length)
            return null;
        const ids = t.artists.map(addArtist).filter(Boolean);
        if (!ids.length)
            return null;
        const year = Number.parseInt(t.album?.release_date?.slice(0, 4));
        tracks.set(t.id, { id: t.id, name: t.name, artistId: ids[0], artistIds: ids, artistName: t.artists.map(a => a.name).join(', '), albumId: t.album?.id || `unknown-${t.id}`, albumName: t.album?.name || 'Unknown album', year: Number.isFinite(year) ? year : null, image: imageOf(t.album?.images), url: t.external_urls?.spotify || null, uri: t.uri || null, saved: saved || tracks.get(t.id)?.saved || false });
        return t.id;
    }
    for (const range of RANGES) {
        const a = raw.artists?.[range], t = raw.tracks?.[range];
        if (a && !Array.isArray(a.items) || t && !Array.isArray(t.items))
            throw new Error('Spotify returned an unexpected top-items response. Please try again.');
        topArtists[range] = [...new Set((a?.items || []).map(addArtist).filter(Boolean))];
        topTracks[range] = [...new Set((t?.items || []).map(t => addTrack(t)).filter(Boolean))];
    }
    const savedTrackIds = [...new Set((raw.saved?.items || []).map(item => addTrack(item?.track, true)).filter(Boolean))];
    const recent = (raw.recent?.items || []).map(item => ({ trackId: addTrack(item?.track), playedAt: item?.played_at })).filter(item => item.trackId && typeof item.playedAt === 'string');
    const profile = { version: 1, source: 'spotify', user: { id: raw.user.account_id || raw.user.id || 'spotify-user', name: raw.user.display_name || 'Music lover', image: imageOf(raw.user.images) }, artists: [...artists.values()], tracks: [...tracks.values()], topArtists, topTracks, savedTrackIds, recent, capabilities: { saved: !!raw.saved, recent: !!raw.recent, playback: !!readToken()?.scope?.includes('streaming') }, warnings: raw.warnings || [], stats: {} };
    profile.stats = deriveStats(profile);
    return profile;
}
export async function buildSpotifyProfile(onProgress = () => { }, signal, force = false) {
    const cached = readJson('auxcade:profile', null, true);
    if (!force && cached?.expiresAt > Date.now() && cached?.clientId === readToken()?.clientId && cached.profile?.version === 1) {
        onProgress('RESTORING YOUR MUSIC PROFILE', 100);
        return cached.profile;
    }
    const raw = { user: null, artists: {}, tracks: {}, warnings: [] };
    let done = 0;
    onProgress('CONNECTING TO SPOTIFY', 5);
    raw.user = await fetchMe(signal);
    for (const range of RANGES) {
        // Two concurrent calls, not dozens of per-game fetches.
        const responses = await Promise.allSettled([fetchTop('artists', range, signal), fetchTop('tracks', range, signal)]);
        for (let i = 0; i < responses.length; i++) {
            const r = responses[i];
            if (r.status === 'fulfilled')
                raw[i === 0 ? 'artists' : 'tracks'][range] = r.value;
            else if ([401, 403, 429].includes(r.reason.status) || signal?.aborted)
                throw r.reason;
            else
                raw.warnings.push(`Could not load ${range.replace('_', ' ')} ${i === 0 ? 'artists' : 'tracks'}.`);
        }
        done += 2;
        onProgress(`SCANNING ${range.replace('_', ' ').toUpperCase()}`, 10 + done * 10);
    }
    for (const [name, load] of [['recent', fetchRecent], ['saved', fetchSaved]]) {
        try {
            const response = await load(signal);
            if (!Array.isArray(response?.items))
                throw new Error('Malformed response');
            raw[name] = response;
        }
        catch (error) {
            if (signal?.aborted)
                throw error;
            raw.warnings.push(`${name === 'saved' ? 'Saved tracks' : 'Recent history'} are unavailable; the arcade will use your top items.`);
        }
        onProgress(`LOADING ${name.toUpperCase()}`, name === 'recent' ? 85 : 95);
    }
    const profile = normalizeProfile(raw);
    if (!profile.tracks.length && !profile.artists.length)
        throw new Error('Your account does not have enough listening data yet. Play the demo while Spotify learns your favorites.');
    writeJson('auxcade:profile', { profile, expiresAt: Date.now() + 3600000, clientId: readToken()?.clientId }, true);
    onProgress('PLAYER PROFILE READY', 100);
    return profile;
}
