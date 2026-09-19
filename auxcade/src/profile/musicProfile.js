/**
 * @typedef {'short_term'|'medium_term'|'long_term'} TimeRange
 * @typedef {{id:string,name:string,image:string|null,url:string|null,uri:string|null,
 *   wikipedia?:string,location?:object}} Artist
 * @typedef {{id:string,name:string,artistId:string,artistIds:string[],artistName:string,
 *   albumId:string,albumName:string,year:number|null,image:string|null,url:string|null,
 *   uri:string|null,saved:boolean}} Track
 * @typedef {{version:1,source:'demo'|'spotify',user:{id:string,name:string,image:string|null},
 *   artists:Artist[],tracks:Track[],topArtists:Record<TimeRange,string[]>,
 *   topTracks:Record<TimeRange,string[]>,recent:{trackId:string,playedAt:string}[],
 *   savedTrackIds:string[],capabilities:object,warnings:string[],stats:object}} MusicProfile
 */
export const RANGES = ['short_term', 'medium_term', 'long_term'];
export const RANGE_LABELS = { short_term: 'Recent obsessions', medium_term: 'Current rotation', long_term: 'Long-term favorites' };
export function ranked(profile, type = 'artists', range = 'medium_term') {
    const list = type === 'artists' ? profile.artists : profile.tracks;
    const ids = type === 'artists' ? profile.topArtists[range] : profile.topTracks[range];
    const byId = new Map(list.map(item => [item.id, item]));
    return (ids || []).map((id, index) => ({ ...byId.get(id), rank: index + 1 })).filter(item => item.id);
}
export function artistRank(profile, artistId, range = 'medium_term') {
    const index = profile.topArtists[range].indexOf(artistId);
    return index < 0 ? null : index + 1;
}
export function rankMovement(profile, artistId) {
    const recent = artistRank(profile, artistId, 'short_term');
    const long = artistRank(profile, artistId, 'long_term');
    return recent && long ? long - recent : null;
}
export function topTrackForArtist(profile, artistId) {
    return ranked(profile, 'tracks').find(track => track.artistIds.includes(artistId)) || profile.tracks.find(track => track.artistIds.includes(artistId));
}
