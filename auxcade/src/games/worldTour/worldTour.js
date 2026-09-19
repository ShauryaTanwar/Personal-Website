import { Globe } from './globe.js';
import { geographicCenter, distanceKm } from './geography.js';
import { ranked, topTrackForArtist } from '../../profile/musicProfile.js';
import { resolveLocations } from '../../api/wikidata.js';
import { escapeHtml, artwork, spotifyLink, safeUrl } from '../../utils/dom.js';
export function mount(ctx) {
    const artists = ranked(ctx.profile, 'artists').slice(0, 20);
    if (!artists.length) {
        ctx.empty('World Tour needs some ranked artists to locate.');
        return {};
    }
    const lookupController = new AbortController();
    const lookupSignal = AbortSignal.any([ctx.signal, lookupController.signal]);
    const locations = new Map(artists.filter(a => a.location).map(a => [a.id, a.location]));
    const discovered = new Set();
    let selected = null, refreshing = false;
    ctx.root.innerHTML = `<div class="world-layout"><div class="globe-panel"><div class="map-label"><span class="eyebrow">YOUR LISTENING, IN ORBIT</span><strong data-tour-count>00 / 06 stamps</strong></div><canvas class="globe-canvas" tabindex="0" aria-label="Interactive 3D globe. Drag to rotate, scroll to zoom, or use the artist list and arrow keys."></canvas><div class="globe-controls"><button class="icon-button" data-zoom="1" aria-label="Zoom in">+</button><button class="icon-button" data-zoom="-1" aria-label="Zoom out">−</button><button class="button small" data-refresh>Refresh origins</button></div><small class="map-caption">SCHEMATIC COASTLINES · VERIFIED LOCATION SOURCES</small></div><aside class="world-info"><div class="artist-detail"><span class="eyebrow">NEXT STOP: YOUR ROTATION</span><h2>Take the scenic route.</h2><p>Choose an artist or a point on the globe to stamp your passport.</p></div><div class="passport-mini"><div><strong data-countries>0</strong><span>Countries / territories</span></div><div><strong data-continents>0</strong><span>Continents</span></div><div><strong data-spread>0 km</strong><span>Farthest pair</span></div></div><p class="geo-status" aria-live="polite">${ctx.profile.source === 'demo' ? 'Offline reference locations loaded. Refresh to verify with Wikidata.' : 'Locating your artists with Wikidata…'}</p><div class="artist-list"></div><button class="button primary" data-finish disabled>Finish tour →</button></aside></div>`;
    const globe = new Globe(ctx.root.querySelector('canvas'), { onSelect: marker => visit(marker.id) });
    function list() {
        ctx.root.querySelector('.artist-list').innerHTML = artists.map(a => `<button data-artist="${escapeHtml(a.id)}" class="artist-stop ${discovered.has(a.id) ? 'visited' : ''} ${selected === a.id ? 'selected' : ''}"><span>${discovered.has(a.id) ? '✓' : String(a.rank).padStart(2, '0')}</span>${artwork(a, 'artist-stop-art')}<div><strong>${escapeHtml(a.name)}</strong><small>${escapeHtml(locations.get(a.id)?.city || locations.get(a.id)?.reason || 'Location unavailable')}</small></div></button>`).join('');
        ctx.root.querySelectorAll('[data-artist]').forEach(b => ctx.on(b, 'click', () => visit(b.dataset.artist)));
        updateMarkers();
    }
    function updateMarkers() { globe.setMarkers(artists.filter(a => Number.isFinite(locations.get(a.id)?.lat)).map(a => ({ ...a, location: locations.get(a.id), discovered: discovered.has(a.id), selected: selected === a.id }))); }
    function visit(id) {
        if (ctx.paused)
            return;
        selected = id;
        const artist = artists.find(a => a.id === id), location = locations.get(id), track = topTrackForArtist(ctx.profile, id);
        ctx.touch(track);
        if (Number.isFinite(location?.lat)) {
            globe.focus(location);
            if (!discovered.has(id)) {
                discovered.add(id);
                ctx.audio.sfx('stamp');
                ctx.progress.discover(id, location);
                ctx.setScore(discovered.size * 250);
            }
        }
        ctx.root.querySelector('.artist-detail').innerHTML = `${artwork(artist, 'artist-hero-art')}<span class="eyebrow">RANK #${artist.rank} / ${location?.kind === 'formation' ? 'BAND FORMED IN' : 'BIRTHPLACE'}</span><h2>${escapeHtml(artist.name)}</h2><h3>${escapeHtml(location?.city || 'Location unavailable')}</h3><p>${escapeHtml(location?.country || location?.reason || 'We could not locate this artist.')}${location?.areaApproximation ? ' · approximate area coordinates' : ''}</p>${track ? `<div class="world-track">${artwork(track)}<div><small>YOUR HIGHEST-RANKED TRACK</small><strong>${escapeHtml(track.name)}</strong></div></div>` : ''}${ctx.profile.source === 'spotify' ? spotifyLink(artist) : ''}${safeUrl(location?.sourceUrl) ? `<a class="source-link" href="${escapeHtml(safeUrl(location.sourceUrl))}" target="_blank" rel="noopener noreferrer">${escapeHtml(location.source)} ↗</a>` : ''}`;
        const stops = [...discovered].map(id => locations.get(id));
        const countries = new Set(stops.map(l => l.country)), continents = new Set(stops.map(l => l.continent).filter(Boolean));
        let spread = 0;
        for (const a of stops)
            for (const b of stops)
                spread = Math.max(spread, distanceKm(a, b));
        ctx.root.querySelector('[data-countries]').textContent = countries.size;
        ctx.root.querySelector('[data-continents]').textContent = continents.size;
        ctx.root.querySelector('[data-spread]').textContent = `${Math.round(spread).toLocaleString()} km`;
        ctx.root.querySelector('[data-tour-count]').textContent = `${String(discovered.size).padStart(2, '0')} / ${String(Math.min(6, artists.length)).padStart(2, '0')} stamps`;
        ctx.root.querySelector('[data-finish]').disabled = discovered.size === 0;
        ctx.root.querySelector('[data-finish]').textContent = discovered.size >= Math.min(6, artists.length) ? 'Complete tour →' : 'Save this tour →';
        ctx.setStatus(`${countries.size} COUNTRIES / TERRITORIES · ${continents.size} CONTINENTS`);
        list();
    }
    async function refresh() {
        if (refreshing)
            return;
        refreshing = true;
        ctx.root.querySelector('[data-refresh]').disabled = true;
        try {
            await resolveLocations(artists, (artist, value) => { if (lookupSignal.aborted || ctx.ended)
                return; if (!value.unavailable || !locations.has(artist.id))
                locations.set(artist.id, value); ctx.root.querySelector('.geo-status').textContent = value.unavailable ? `${artist.name}: ${value.reason} ${artist.location ? 'Keeping the offline reference.' : ''}` : `Located ${artist.name} via Wikidata.`; list(); }, lookupSignal);
        }
        catch (error) {
            if (!lookupSignal.aborted && !ctx.ended)
                ctx.root.querySelector('.geo-status').textContent = error.message;
        }
        finally {
            refreshing = false;
            if (!lookupSignal.aborted && !ctx.ended)
                ctx.root.querySelector('[data-refresh]').disabled = false;
        }
    }
    ctx.on(ctx.root.querySelector('[data-refresh]'), 'click', refresh);
    ctx.root.querySelectorAll('[data-zoom]').forEach(b => ctx.on(b, 'click', () => globe.zoom = Math.max(.7, Math.min(1.6, globe.zoom + Number(b.dataset.zoom) * .15))));
    ctx.on(ctx.root.querySelector('[data-finish]'), 'click', () => { if (ctx.paused || !discovered.size)
        return; const center = geographicCenter([...discovered].map(id => locations.get(id))); ctx.finish({ score: discovered.size * 250, won: discovered.size >= Math.min(6, artists.length), title: 'Well traveled. Well played.', message: `${discovered.size} artist origins stamped into your passport.`, detail: center ? `Musical center of gravity: ${center.lat.toFixed(1)}°, ${center.lon.toFixed(1)}°. Each discovered artist has equal weight.` : '' }); });
    list();
    ctx.loop((dt, time) => globe.draw(time, false));
    if (ctx.profile.source === 'spotify')
        refresh();
    return { destroy: () => { lookupController.abort(); globe.destroy(); } };
}
