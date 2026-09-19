import { deriveStats } from '../profile/profileStats.js';
// Replace this one file with an authorized normalized profile when Shaurya's data
// is available. These rankings/history are synthetic, NOT Shaurya's listening.
// No Spotify audio, artwork files, or credentials are bundled. Artist images
// are resolved from Wikidata/Wikimedia Commons at runtime.
const catalog = [
    ['The Weeknd', 'The Weeknd', 'After Hours', 2020, ['Blinding Lights', 'Save Your Tears', 'In Your Eyes']],
    ['Kendrick Lamar', 'Kendrick Lamar', 'DAMN.', 2017, ['HUMBLE.', 'DNA.', 'LOVE.']],
    ['Frank Ocean', 'Frank Ocean', 'Blonde', 2016, ['Pink + White', 'Ivy', 'Nights']],
    ['SZA', 'SZA', 'SOS', 2022, ['Snooze', 'Good Days', 'Shirt']],
    ['Daft Punk', 'Daft Punk', 'Discovery', 2001, ['One More Time', 'Digital Love', 'Something About Us']],
    ['Radiohead', 'Radiohead', 'In Rainbows', 2007, ['Weird Fishes/Arpeggi', 'Reckoner', 'Nude']],
    ['Tame Impala', 'Tame Impala', 'Currents', 2015, ['Let It Happen', 'The Less I Know the Better', 'Eventually']],
    ['Nujabes', 'Nujabes', 'Modal Soul', 2005, ['Feather', 'Reflection Eternal', 'Ordinary Joe']],
    ['Burna Boy', 'Burna Boy', 'African Giant', 2019, ['Anybody', 'On the Low', 'Gbona']],
    ['Bad Bunny', 'Bad Bunny', 'Un Verano Sin Ti', 2022, ['Moscow Mule', 'Ojitos Lindos', 'Otro Atardecer']],
    ['Björk', 'Björk', 'Post', 1995, ['Army of Me', 'Hyperballad', 'Isobel']],
    ['A. R. Rahman', 'A. R. Rahman', 'Roja', 1992, ['Chinna Chinna Aasai', 'Pudhu Vellai Mazhai', 'Kadhal Rojave']],
    ['ABBA', 'ABBA', 'Arrival', 1976, ['Dancing Queen', 'Knowing Me, Knowing You', 'Money, Money, Money']],
    ['Stevie Wonder', 'Stevie Wonder', 'Songs in the Key of Life', 1976, ['Sir Duke', 'I Wish', 'As']],
    ['Nina Simone', 'Nina Simone', 'I Put a Spell on You', 1965, ['Feeling Good', 'I Put a Spell on You', 'One September Day']],
    ['Fleetwood Mac', 'Fleetwood Mac', 'Rumours', 1977, ['Dreams', 'The Chain', 'Go Your Own Way']],
    ['Dua Lipa', 'Dua Lipa', 'Future Nostalgia', 2020, ['Levitating', 'Physical', "Don't Start Now"]],
    ['Gorillaz', 'Gorillaz', 'Demon Days', 2005, ['Feel Good Inc.', 'DARE', 'El Mañana']],
    ['Lorde', 'Lorde', 'Melodrama', 2017, ['Green Light', 'The Louvre', 'Perfect Places']],
    ['Anitta', 'Anitta (singer)', 'Versions of Me', 2022, ['Envolver', 'Girl from Rio', 'Boys Don’t Cry']],
];
// Offline seed: city coordinates are geographic reference points, not invented
// live API results. Live enrichment verifies origins and labels its source.
const origins = [
    ['Toronto', 'Canada', 'North America', 43.65, -79.38, 'birthplace'],
    ['Compton', 'United States', 'North America', 33.90, -118.22, 'birthplace'],
    ['Long Beach', 'United States', 'North America', 33.77, -118.19, 'birthplace'],
    ['St. Louis', 'United States', 'North America', 38.63, -90.20, 'birthplace'],
    ['Paris', 'France', 'Europe', 48.86, 2.35, 'formation'],
    ['Abingdon', 'United Kingdom', 'Europe', 51.67, -1.28, 'formation'],
    ['Perth', 'Australia', 'Oceania', -31.95, 115.86, 'formation'],
    ['Tokyo', 'Japan', 'Asia', 35.68, 139.69, 'birthplace'],
    ['Port Harcourt', 'Nigeria', 'Africa', 4.82, 7.05, 'birthplace'],
    ['Bayamón', 'Puerto Rico', 'North America', 18.40, -66.16, 'birthplace'],
    ['Reykjavík', 'Iceland', 'Europe', 64.15, -21.94, 'birthplace'],
    ['Chennai', 'India', 'Asia', 13.08, 80.27, 'birthplace'],
    ['Stockholm', 'Sweden', 'Europe', 59.33, 18.07, 'formation'],
    ['Saginaw', 'United States', 'North America', 43.42, -83.95, 'birthplace'],
    ['Tryon', 'United States', 'North America', 35.21, -82.24, 'birthplace'],
    ['London', 'United Kingdom', 'Europe', 51.51, -0.13, 'formation'],
    ['London', 'United Kingdom', 'Europe', 51.51, -0.13, 'birthplace'],
    ['London', 'United Kingdom', 'Europe', 51.51, -0.13, 'formation'],
    ['Auckland', 'New Zealand', 'Oceania', -36.85, 174.76, 'birthplace'],
    ['Rio de Janeiro', 'Brazil', 'South America', -22.91, -43.17, 'birthplace'],
];
export function createDemoProfile() {
    const artists = catalog.map((row, i) => ({
        id: `artist-${i}`, name: row[0], wikipedia: row[1], image: null, uri: null, url: null,
        location: { city: origins[i][0], country: origins[i][1], continent: origins[i][2], lat: origins[i][3], lon: origins[i][4], kind: origins[i][5], source: 'Bundled reference', sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(row[1])}` },
    }));
    const tracks = catalog.flatMap((row, i) => row[4].map((name, j) => ({
        id: `track-${i}-${j}`, name, artistId: `artist-${i}`, artistIds: [`artist-${i}`], artistName: row[0],
        albumId: `album-${i}`, albumName: row[2], year: row[3], image: null, url: null, uri: null, saved: (i + j) % 3 !== 0,
    })));
    const orders = { short_term: [3, 0, 1, 2, 16, 6, 4, 9, 8, 17, 10, 18, 5, 7, 11, 12, 19, 13, 15, 14], medium_term: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], long_term: [4, 5, 0, 2, 1, 7, 13, 14, 15, 12, 6, 10, 11, 17, 18, 8, 19, 16, 9, 3] };
    const topArtists = {}, topTracks = {};
    for (const [range, order] of Object.entries(orders)) {
        topArtists[range] = order.map(i => `artist-${i}`);
        topTracks[range] = [0, 1, 2].flatMap(j => order.map(i => `track-${i}-${j}`)).slice(0, 50);
    }
    const profile = { version: 1, source: 'demo', user: { id: 'demo', name: 'Player One', image: null }, artists, tracks, topArtists, topTracks,
        savedTrackIds: tracks.filter(t => t.saved).map(t => t.id), recent: topTracks.short_term.slice(0, 20).map((id, i) => ({ trackId: id, playedAt: new Date(Date.UTC(2026, 8, 1, 12) - i * 240000).toISOString() })),
        capabilities: { recent: true, saved: true, playback: false }, warnings: [], stats: {} };
    profile.stats = deriveStats(profile);
    return profile;
}
