import { TrackAttackEngine, ARENA, LEVELS } from './trackAttackEngine.js';
import { escapeHtml, meter, artwork } from '../../utils/dom.js';
import { drawArena } from './trackAttackRenderer.js';
export function mount(ctx) {
    if (ctx.profile.tracks.length < 4) {
        ctx.empty('Track Attack needs at least four records to recover.');
        return {};
    }
    ctx.root.innerHTML = `<div class="action-layout"><div class="arena-wrap"><canvas class="arena" width="880" height="490" tabindex="0" aria-label="Track Attack arena. Use WASD or arrow keys to move and Space to dash."></canvas><div class="touch-controls"><button data-move="ArrowLeft" aria-label="Move left">←</button><button data-move="ArrowUp" aria-label="Move up">↑</button><button data-move="ArrowDown" aria-label="Move down">↓</button><button data-move="ArrowRight" aria-label="Move right">→</button><button data-dash>Dash</button></div></div><aside class="run-sidebar"><span class="eyebrow" data-level>LEVEL 01</span><h2 data-level-title></h2><div class="run-stat"><span>Time left</span><strong data-time>80</strong></div><div class="run-stat"><span>Signal integrity</span><strong data-lives>● ● ●</strong></div><div class="run-stat"><span>Records banked</span><strong data-banked>0 / 8</strong></div><div data-dash-meter></div><span class="eyebrow">IN YOUR CRATE</span><div data-carry class="carry-list">Crate empty. Go find your music.</div><p class="run-tip">Same-artist banks earn a ×2 combo. Carrying four records slows you down.</p><div class="enemy-key"><span>◆ The Skip</span><span>◆ The Algorithm</span><span>◆ The Aux Thief</span></div></aside></div>`;
    const canvas = ctx.root.querySelector('canvas'), c = canvas.getContext('2d');
    const art = new Map();
    for (const track of ctx.profile.tracks) {
        if (!track.image || art.has(track.image)) continue;
        const image = new Image();
        image.src = track.image;
        art.set(track.image, image);
    }
    const keys = new Set();
    let cleared = 0, hudTime = 0;
    const engine = new TrackAttackEngine(ctx.profile, event => {
        if (event.type === 'collect') {
            ctx.audio.sfx('collect');
            ctx.touch(event.track);
        }
        if (['bank', 'power', 'shield', 'clear'].includes(event.type))
            ctx.audio.sfx('good');
        if (event.type === 'hit')
            ctx.audio.sfx('bad');
        if (event.type === 'dash')
            ctx.audio.sfx('drop');
        if (event.type === 'clear')
            cleared++;
        if (event.type === 'bank')
            ctx.setStatus(event.combo ? 'ARTIST CHAIN ×2 · RECORDS SECURED' : 'RECORDS SECURED');
        if (event.type === 'end')
            ctx.finish({ score: engine.score, won: event.won, title: event.won ? 'Collection restored.' : 'Keep the good records.', message: `${engine.totalBanked} records archived across ${engine.level + 1} levels.`, achievements: [...(cleared ? ['full-clear'] : []), ...(event.won ? ['unskippable'] : [])] });
    });
    function hud() { ctx.setScore(engine.score); ctx.root.querySelector('[data-level]').textContent = `LEVEL 0${engine.level + 1}`; ctx.root.querySelector('[data-level-title]').textContent = LEVELS[engine.level]; ctx.root.querySelector('[data-time]').textContent = `${Math.ceil(engine.time)}s`; ctx.root.querySelector('[data-lives]').textContent = Array(Math.max(0, engine.lives)).fill('●').join(' '); ctx.root.querySelector('[data-banked]').textContent = `${engine.banked.length} / ${engine.records.length}`; ctx.root.querySelector('[data-dash-meter]').innerHTML = `<span class="eyebrow">${engine.dashCooldown <= 0 ? 'DASH READY / SPACE' : 'DASH RECHARGING'}</span>${meter(100 - engine.dashCooldown / 2.5 * 100, 'Dash charge')}`; ctx.root.querySelector('[data-carry]').innerHTML = engine.carry.length ? engine.carry.map(r => `<span>${artwork(r.track, 'carry-art')}<b>${escapeHtml(r.track.name)}</b></span>`).join('') : 'Crate empty. Go find your music.'; }
    ctx.on(document, 'keydown', e => { if (document.querySelector('dialog[open]') || ctx.ended)
        return; const key = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd', ' '].includes(key)) {
        e.preventDefault();
        if (key === ' ' && !ctx.paused)
            engine.dash();
        else
            keys.add(key);
    } });
    ctx.on(document, 'keyup', e => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
    ctx.on(window, 'blur', () => keys.clear());
    ctx.root.querySelectorAll('[data-move]').forEach(b => { ctx.on(b, 'pointerdown', e => { b.setPointerCapture(e.pointerId); keys.add(b.dataset.move); }); ctx.on(b, 'pointerup', () => keys.delete(b.dataset.move)); ctx.on(b, 'pointercancel', () => keys.delete(b.dataset.move)); });
    ctx.on(ctx.root.querySelector('[data-dash]'), 'click', () => { if (!ctx.paused)
        engine.dash(); });
    hud();
    canvas.focus({ preventScroll: true });
    ctx.setStatus('RECOVER RECORDS · BANK AT THE CENTER');
    ctx.loop((dt, time) => { engine.update(dt, keys); if (ctx.ended)
        return; drawArena(c, engine, time, art); hudTime += dt; if (hudTime > .1) {
        hud();
        hudTime = 0;
    } });
    return { pause: () => keys.clear() };
}
