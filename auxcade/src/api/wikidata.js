import { requestJson, delay, ApiError } from '../utils/apiUtils.js';
import { readJson, writeJson } from '../utils/storage.js';
const API = 'https://www.wikidata.org/w/api.php';
const entityCache = new Map();
export const claimValues = (entity, property) => (entity?.claims?.[property] || []).filter(c => c.rank !== 'deprecated').map(c => c.mainsnak?.datavalue?.value).filter(v => v !== undefined);
const firstId = (entity, property) => claimValues(entity, property).find(v => v?.id)?.id;
async function call(params, signal) {
    const result = await requestJson(`${API}?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`, { signal, retries: 1 });
    if (result?.error)
        throw new ApiError('Wikidata could not complete the lookup.');
    return result;
}
export async function entities(ids, signal) {
    const missing = ids.filter(id => !entityCache.has(id));
    if (missing.length) {
        const result = await call({ action: 'wbgetentities', ids: missing.join('|'), props: 'labels|descriptions|claims|sitelinks', languages: 'en' }, signal);
        if (!result?.entities || typeof result.entities !== 'object')
            throw new ApiError('Wikidata returned an incomplete response.');
        for (const [id, entity] of Object.entries(result.entities))
            entityCache.set(id, entity);
    }
    return ids.map(id => entityCache.get(id)).filter(Boolean);
}
async function identify(artist, signal) {
    if (artist.wikipedia) {
        const result = await call({ action: 'wbgetentities', sites: 'enwiki', titles: artist.wikipedia, props: 'labels|descriptions|claims|sitelinks', languages: 'en' }, signal);
        return Object.values(result.entities || {}).find(e => e.id && e.missing === undefined) || null;
    }
    const search = await call({ action: 'wbsearchentities', search: artist.name, language: 'en', limit: '5', type: 'item' }, signal);
    if (!Array.isArray(search.search))
        throw new ApiError('Wikidata returned an incomplete search.');
    const candidates = await entities(search.search.map(x => x.id).filter(id => /^Q\d+$/.test(id)), signal);
    // Exact P1902 identity matching avoids confusing artists with identical names.
    return candidates.find(e => claimValues(e, 'P1902').includes(artist.id)) || null;
}
export async function resolveArtistLocation(artist, { signal, force = false } = {}) {
    const key = `auxcade:geo:${artist.id}`;
    const cached = readJson(key);
    if (!force && cached?.expiresAt > Date.now())
        return cached.value;
    const artistEntity = await identify(artist, signal);
    if (!artistEntity)
        return { unavailable: true, reason: 'Artist identity could not be verified in Wikidata.' };
    const solo = claimValues(artistEntity, 'P31').some(v => v.id === 'Q5');
    const placeId = firstId(artistEntity, solo ? 'P19' : 'P740');
    if (!placeId)
        return { unavailable: true, reason: solo ? 'Birthplace unavailable.' : 'Formation location unavailable.' };
    let [place] = await entities([placeId], signal);
    const originalPlace = place;
    let coordinate = claimValues(place, 'P625')[0], countryId = firstId(place, 'P17');
    // Some city subdivisions put country/coordinates on their parent area.
    for (let depth = 0; depth < 3 && (!coordinate || !countryId); depth++) {
        const parentId = firstId(place, 'P131');
        if (!parentId)
            break;
        [place] = await entities([parentId], signal);
        coordinate ||= claimValues(place, 'P625')[0];
        countryId ||= firstId(place, 'P17');
    }
    if (!Number.isFinite(coordinate?.latitude) || !Number.isFinite(coordinate?.longitude))
        return { unavailable: true, reason: 'Coordinates unavailable.' };
    let country, continent;
    if (countryId) {
        [country] = await entities([countryId], signal);
        const continentId = firstId(country, 'P30');
        if (continentId)
            [continent] = await entities([continentId], signal);
    }
    const value = { city: originalPlace.labels?.en?.value || placeId, country: country?.labels?.en?.value || 'Country unavailable', continent: continent?.labels?.en?.value || null, lat: coordinate.latitude, lon: coordinate.longitude, kind: solo ? 'birthplace' : 'formation', source: 'Wikidata', sourceUrl: `https://www.wikidata.org/wiki/${artistEntity.id}`, description: artistEntity.descriptions?.en?.value || '', areaApproximation: !claimValues(originalPlace, 'P625').length };
    writeJson(key, { value, expiresAt: Date.now() + 30 * 86400000 });
    return value;
}
export async function resolveLocations(artists, onResult, signal) {
    for (const artist of artists) {
        if (signal?.aborted)
            return;
        try {
            const value = await resolveArtistLocation(artist, { signal });
            onResult(artist, value);
        }
        catch (error) {
            if (signal?.aborted)
                return;
            onResult(artist, { unavailable: true, reason: error.message });
            if (error.status === 429)
                break;
        }
        await delay(250, signal);
    }
}
