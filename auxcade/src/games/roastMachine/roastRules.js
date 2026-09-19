import { shuffle } from '../../utils/random.js';
export function roastProfile(profile, random = Math.random) {
    const s = profile.stats, artistItem = id => profile.artists.find(a => a.id === id), artist = id => artistItem(id)?.name || 'your favorite artist';
    const lead = profile.topArtists.medium_term[0];
    const album = Object.entries(s.albumCounts).sort((a, b) => b[1] - a[1])[0];
    const topTrack = profile.tracks.find(track => track.id === profile.topTracks.medium_term[0]) || profile.tracks[0] || artistItem(lead);
    const albumTrack = profile.tracks.find(track => track.albumId === album?.[0] || track.albumName === album?.[0]) || topTrack;
    const rules = [
        [!!lead, 'REPEAT OFFENDER', `You don’t have a favorite artist. You have a ${artist(lead)} subscription inside your subscription.`, `#1 artist in current rotation: ${artist(lead)}.`, artistItem(lead)],
        [s.persistentFavorites.length > 0, 'PERMANENT RESIDENCY', `That ${artist(s.persistentFavorites[0])} phase has its own forwarding address.`, `${s.persistentFavorites.length} artists appear in both recent and long-term top fives.`, artistItem(s.persistentFavorites[0])],
        [s.averageYear && s.averageYear < 2005, 'VINTAGE EQUIPMENT', 'Your music library would like a paper receipt and a landline.', `Average release year in this profile: ${s.averageYear}.`],
        [s.averageYear >= 2005, 'FRESH PAINT', 'Your nostalgia comes with a software update.', `Average release year in this profile: ${s.averageYear}.`],
        [s.uniqueArtistRatio > .6, 'COMMITMENT ISSUES', 'Your rotation is a group project where nobody knows anyone.', `${Math.round(s.uniqueArtistRatio * 100)}% unique artists per track in the top-track sample.`],
        [s.uniqueArtistRatio <= .6, 'SMALL CIRCLE', 'You hit shuffle and somehow arrange a family reunion.', `${Object.keys(s.rotationCounts).length} artists across ${profile.topTracks.medium_term.length} top tracks.`],
        [s.biggestJump?.change >= 10, 'RAPID PROMOTION', `${artist(s.biggestJump?.artistId)} went from guest appearance to department head.`, `Up ${s.biggestJump?.change} positions from long-term to recent artist rank.`, artistItem(s.biggestJump?.artistId)],
        [Object.keys(s.decades).length >= 5, 'TIME TRAVEL', 'Your queue needs a historian, not a DJ.', `Your tracks span ${Object.keys(s.decades).length} release decades.`],
        [Object.keys(s.decades).length < 3, 'ERA LOCK', 'Your library found a decade and signed a long lease.', `${Object.keys(s.decades).length} release decades represented.`],
        [album?.[1] >= 3, 'ALBUM TENANCY', 'At this point, just put your name on the album’s mailbox.', `${album?.[1] || 0} tracks from one album in your profile.`, albumTrack],
        [s.savedOverlap > 15, 'BOOKMARK ENTHUSIAST', 'You saved it. You ranked it. You’re one spreadsheet away from managing it.', `${s.savedOverlap} current top tracks also appear in the fetched saved-track sample.`],
        [profile.capabilities.saved && s.savedOverlap < 5, 'UNSIGNED CONTRACT', 'You listen like a superfan and save tracks like a mysterious stranger.', `${s.savedOverlap} top tracks overlap the saved-track sample.`],
        [s.concentration > 20, 'SINGLE-ARTIST ECONOMY', 'Your shuffle button has a very limited social circle.', `One artist supplies ${s.concentration}% of your top-track sample.`],
        [s.concentration <= 20, 'MUSICAL BUFFET', 'Your music taste is a buffet plate with absolutely no structural integrity.', `The largest artist share is only ${s.concentration}% of top tracks.`],
        [profile.recent.length > 0, 'PAPER TRAIL', 'Incognito mode for your music taste remains a work in progress.', `${profile.recent.length} recent listening entries are in this profile.`],
        [profile.tracks.length >= 40, 'STORAGE PROBLEM', '“Just one more song” is how every storage crisis begins.', `${profile.tracks.length} distinct tracks loaded.`],
        [profile.artists.length >= 15, 'OVERSIZED GUEST LIST', 'Your imaginary festival has already exceeded the venue capacity.', `${profile.artists.length} artists represented.`],
        [Object.values(s.albumCounts).some(n => n === 1), 'ALBUM TOURIST', 'You visited the album, bought one souvenir, and left.', `At least one album contributes only a single loaded track.`],
    ];
    return shuffle(rules.filter(rule => rule[0]).map(([, title, joke, evidence, subject]) => ({ title, joke, evidence, subject: subject || topTrack })), random).slice(0, 6);
}
