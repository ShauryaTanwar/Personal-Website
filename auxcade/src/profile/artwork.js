import { requestJson } from '../utils/apiUtils.js';
import { readJson, writeJson } from '../utils/storage.js';

const ARTWORK_CACHE = 'auxcade:artist-artwork:v1';
const THIRTY_DAYS = 30 * 86400000;

export function commonsImageUrl(filename, width = 640) {
    if (!filename || typeof filename !== 'string')
        return '';
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename.replace(/^File:/i, ''))}?width=${width}`;
}

export function applyArtworkFallbacks(profile) {
    const artistImages = new Map(profile.artists.map(artist => [artist.id, artist.image]).filter(([, image]) => image));
    profile.tracks = profile.tracks.map(track => ({ ...track, image: track.image || artistImages.get(track.artistId) || track.artistIds?.map(id => artistImages.get(id)).find(Boolean) || null }));
    return profile;
}

export async function enrichDemoArtwork(profile, signal, load = requestJson) {
    const cached = readJson(ARTWORK_CACHE, {});
    const current = cached.expiresAt > Date.now() ? cached.images || {} : {};
    const missing = profile.artists.filter(artist => artist.wikipedia && !artist.image && !current[artist.wikipedia]);
    let images = { ...current };
    if (missing.length) {
        try {
            const query = new URLSearchParams({
                format: 'json', origin: '*', action: 'wbgetentities', sites: 'enwiki',
                titles: missing.map(artist => artist.wikipedia).join('|'), props: 'claims|sitelinks',
            });
            const result = await load(`https://www.wikidata.org/w/api.php?${query}`, { signal, retries: 1 });
            for (const entity of Object.values(result?.entities || {})) {
                const title = entity?.sitelinks?.enwiki?.title;
                const filename = entity?.claims?.P18?.find(claim => claim.rank !== 'deprecated')?.mainsnak?.datavalue?.value;
                if (title && filename)
                    images[title] = commonsImageUrl(filename);
            }
            writeJson(ARTWORK_CACHE, { images, expiresAt: Date.now() + THIRTY_DAYS });
        }
        catch (error) {
            if (signal?.aborted)
                throw error;
        }
    }
    profile.artists = profile.artists.map(artist => ({ ...artist, image: artist.image || images[artist.wikipedia] || null, imageSource: artist.image ? artist.imageSource : images[artist.wikipedia] ? 'Wikimedia Commons' : undefined }));
    return applyArtworkFallbacks(profile);
}
