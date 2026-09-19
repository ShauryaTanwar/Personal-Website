import { rankMovement } from './musicProfile.js';
export function deriveStats(profile) {
    const artistCounts = {}, albumCounts = {}, decades = {};
    for (const track of profile.tracks) {
        artistCounts[track.artistId] = (artistCounts[track.artistId] || 0) + 1;
        albumCounts[track.albumId] = (albumCounts[track.albumId] || 0) + 1;
        if (track.year) {
            const decade = Math.floor(track.year / 10) * 10;
            decades[decade] = (decades[decade] || 0) + 1;
        }
    }
    const years = profile.tracks.map(t => t.year).filter(Number.isFinite);
    const topIds = profile.topTracks.medium_term;
    const trackMap = new Map(profile.tracks.map(t => [t.id, t]));
    const rotationCounts = {};
    for (const id of topIds) {
        const t = trackMap.get(id);
        if (t)
            rotationCounts[t.artistId] = (rotationCounts[t.artistId] || 0) + 1;
    }
    const rotationArtists = Object.keys(rotationCounts).length;
    const max = Math.max(0, ...Object.values(rotationCounts));
    return {
        artistCounts, albumCounts, decades,
        averageYear: years.length ? Math.round(years.reduce((a, b) => a + b, 0) / years.length) : null,
        concentration: topIds.length ? Math.round(max / topIds.length * 100) : 0,
        uniqueArtistRatio: topIds.length ? rotationArtists / topIds.length : 0,
        savedOverlap: topIds.filter(id => profile.savedTrackIds.includes(id)).length,
        biggestJump: profile.artists.map(a => ({ artistId: a.id, change: rankMovement(profile, a.id) })).filter(a => a.change !== null).sort((a, b) => b.change - a.change)[0] || null,
        persistentFavorites: profile.topArtists.short_term.slice(0, 5).filter(id => profile.topArtists.long_term.slice(0, 5).includes(id)),
        rotationCounts,
    };
}
