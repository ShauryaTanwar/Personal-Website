import { DropEngine, COLS, ROWS } from './dropEngine.js';
import { escapeHtml, artwork } from '../../utils/dom.js';
const COLORS = ['#ffd84a', '#31d7ff', '#ff4f9a', '#9b72ff'];
export function mount(ctx) {
    if (new Set(ctx.profile.tracks.map(t => t.artistId)).size < 2) {
        ctx.empty('Album Drop needs records from at least two artists.');
        return {};
    }
    ctx.root.innerHTML = `<div class="drop-layout"><aside class="drop-instructions"><span class="eyebrow">THE COLLECTION IS FALLING</span><h2>Stack.<br>Connect.<br><em>Repeat.</em></h2><p>Connect 3 records by the same artist. A ★ power record only needs a pair.</p><div data-families class="family-key"></div><div class="drop-callout" aria-live="polite">MAKE ROOM FOR YOUR ROTATION</div></aside><div class="drop-board-wrap"><canvas width="360" height="600" tabindex="0" aria-label="Album Drop board. Left and right move; up swaps; down drops; Space hard drops."></canvas><div class="drop-buttons"><button class="button" data-control="left" aria-label="Move left">←</button><button class="button" data-control="swap" aria-label="Swap records">⇄</button><button class="button" data-control="right" aria-label="Move right">→</button><button class="button primary" data-control="drop">Drop ↓</button></div></div><aside class="drop-stats"><span class="eyebrow">NEXT UP</span><div data-next class="next-records"></div><div class="run-stat"><span>Drops</span><strong data-drops>0 / 40</strong></div><div class="run-stat"><span>Records cleared</span><strong data-cleared>0</strong></div><div class="run-stat"><span>Best cascade</span><strong data-chain>0×</strong></div><p>Same album +150<br>Same era +60<br>Cascades multiply clears.</p><span class="eyebrow">TOP OUT = GAME OVER</span></aside></div>`;
    const canvas = ctx.root.querySelector('canvas'), c = canvas.getContext('2d');
    const art = new Map();
    for (const track of ctx.profile.tracks) {
        if (!track.image || art.has(track.image)) continue;
        const image = new Image();
        image.src = track.image;
        art.set(track.image, image);
    }
    let flash = 0;
    let engine;
    engine = new DropEngine(ctx.profile, event => {
        if (event.type === 'end') {
            ctx.finish({ score: engine.score, won: event.won, title: event.won ? 'A beautifully sorted mess.' : 'The crate is full.', message: `${engine.cleared} records cleared in ${engine.drops} drops. Best cascade: ${engine.bestChain}×.`, achievements: [...(engine.hadAlbum ? ['album-clear'] : []), ...(engine.bestChain >= 2 ? ['chain-reaction'] : [])] });
            return;
        }
        event.tracks?.forEach(track => ctx.touch(track));
        ctx.audio.sfx(event.type === 'clear' ? 'good' : 'drop');
        flash = .3;
        ctx.root.querySelector('.drop-callout').textContent = event.chains > 1 ? `${event.chains}× CHAIN REACTION!` : event.albumClear ? 'ALBUM CLEAR + BONUS' : event.cleared ? 'ARTIST COMBO' : 'NICE DROP. KEEP CONNECTING.';
        hud();
    });
    const color = track => COLORS[Math.max(0, engine.families.indexOf(track.artistId))];
    function tile(track, x, y, ghost = false) { const px = x * 60 + 4, py = y * 60 + 4, image = art.get(track.image); c.globalAlpha = ghost ? .25 : 1; c.fillStyle = color(track); c.fillRect(px, py, 52, 52); if (image?.complete && image.naturalWidth) { const side = Math.min(image.naturalWidth, image.naturalHeight), sx = (image.naturalWidth - side) / 2, sy = (image.naturalHeight - side) / 2; c.drawImage(image, sx, sy, side, side, px + 3, py + 3, 46, 46); c.strokeStyle = color(track); c.lineWidth = 3; c.strokeRect(px + 1.5, py + 1.5, 49, 49); } else { c.fillStyle = '#202620'; c.beginPath(); c.arc(x * 60 + 30, y * 60 + 28, 17, 0, Math.PI * 2); c.fill(); c.fillStyle = color(track); c.textAlign = 'center'; c.font = 'bold 10px monospace'; c.fillText(track.artistName.slice(0, 2).toUpperCase(), x * 60 + 30, y * 60 + 32); } if (track.power) { c.fillStyle = '#fff3bd'; c.font = 'bold 15px monospace'; c.textAlign = 'right'; c.fillText('★', px + 47, py + 15); } c.globalAlpha = 1; }
    function hud() { if (ctx.ended)
        return; ctx.setScore(engine.score); ctx.setStatus(`DROP ${engine.drops} / 40 · CONNECT THREE`); ctx.root.querySelector('[data-drops]').textContent = `${engine.drops} / 40`; ctx.root.querySelector('[data-cleared]').textContent = engine.cleared; ctx.root.querySelector('[data-chain]').textContent = `${engine.bestChain}×`; ctx.root.querySelector('[data-next]').innerHTML = engine.next.map(t => `<div style="--record-color:${color(t)}">${artwork(t, 'next-art')}<span>${escapeHtml(t.artistName)}</span><strong>${escapeHtml(t.name)}</strong>${t.power ? '<small>★ POWER RECORD</small>' : ''}</div>`).join(''); }
    ctx.root.querySelector('[data-families]').innerHTML = engine.families.map((id, i) => { const artist = ctx.profile.artists.find(a => a.id === id); return `<div><i style="background:${COLORS[i]}"></i>${artist ? artwork(artist, 'family-art') : ''}${escapeHtml(artist?.name || 'Artist')}</div>`; }).join('');
    const control = action => { if (ctx.paused || ctx.ended)
        return; if (action === 'left')
        engine.move(-1); if (action === 'right')
        engine.move(1); if (action === 'swap')
        engine.swap(); if (action === 'drop')
        engine.hardDrop(); if (action === 'soft')
        engine.step(); hud(); };
    ctx.on(document, 'keydown', e => { if (document.querySelector('dialog[open]'))
        return; const action = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'swap', ArrowDown: 'soft', ' ': 'drop' }[e.key]; if (action) {
        e.preventDefault();
        control(action);
    } });
    ctx.root.querySelectorAll('[data-control]').forEach(b => ctx.on(b, 'click', () => control(b.dataset.control)));
    hud();
    canvas.focus({ preventScroll: true });
    ctx.loop(dt => { const previousDrops = engine.drops; engine.update(dt); if (engine.drops !== previousDrops)
        hud(); if (ctx.ended)
        return; flash = Math.max(0, flash - dt); c.fillStyle = flash > 0 ? '#29145f' : '#09051f'; c.fillRect(0, 0, 360, 600); c.strokeStyle = '#30206b'; for (let x = 0; x <= 6; x++) {
        c.beginPath();
        c.moveTo(x * 60, 0);
        c.lineTo(x * 60, 600);
        c.stroke();
    } for (let y = 0; y <= 10; y++) {
        c.beginPath();
        c.moveTo(0, y * 60);
        c.lineTo(360, y * 60);
        c.stroke();
    } engine.board.forEach((row, y) => row.forEach((t, x) => { if (t)
        tile(t, x, y); })); engine.active.tracks.forEach((t, i) => { tile(t, engine.active.x + i, engine.landingY(), true); tile(t, engine.active.x + i, engine.active.y); }); });
    return {};
}
