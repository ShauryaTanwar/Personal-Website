import { escapeHtml, number, artwork } from '../utils/dom.js';
import { dialog, notify } from './notifications.js';
export class GameSession {
    constructor(cabinet, host, services) {
        this.cabinet = cabinet;
        this.host = host;
        Object.assign(this, services);
        this.controller = new AbortController();
        this.signal = this.controller.signal;
        this.paused = false;
        this.ended = false;
        this.started = false;
        this.frames = new Set();
        this.runId = `run-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        host.innerHTML = `<section class="game-shell game-${cabinet.id}" style="--game-color:${cabinet.color}"><div class="game-top"><button class="button small" data-back>← Arcade</button><div class="game-title"><span class="eyebrow">CABINET ${cabinet.number} / ${cabinet.category}</span><h1>${cabinet.name}</h1></div><div class="game-actions"><button class="button small" data-help>How to play</button><button class="button small" data-pause disabled>Ⅱ Pause</button></div></div><div class="game-hud"><div><span>SCORE</span><strong data-score>00000</strong></div><p data-status>${cabinet.tag}</p><span class="source-pill">${this.profile.source === 'demo' ? 'DEMO PROFILE' : 'SPOTIFY PROFILE'}</span></div><div class="game-stage"><div class="game-intro"><span class="large-index">${cabinet.number}</span><span class="eyebrow">${cabinet.category}</span><h2>${cabinet.tag}</h2><ol>${cabinet.instructions.map(i => `<li>${i}</li>`).join('')}</ol><button class="button primary big" data-start>Start ${cabinet.name} <span>↗</span></button><p class="controls">${cabinet.controls}</p></div></div><div class="game-foot"><span>${cabinet.controls}</span><span>FREE PLAY · SAVE YOUR HIGH SCORE</span></div></section>`;
        this.root = host.querySelector('.game-stage');
        this.on(host.querySelector('[data-back]'), 'click', () => this.leave());
        this.on(host.querySelector('[data-start]'), 'click', () => this.start());
        this.on(host.querySelector('[data-help]'), 'click', () => this.help());
        this.on(host.querySelector('[data-pause]'), 'click', () => this.pause());
        this.on(document, 'keydown', event => { if (event.key.toLowerCase() === 'p' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName) && !document.querySelector('dialog[open]'))
            this.pause(); });
        this.on(document, 'visibilitychange', () => { if (document.hidden && this.started && !this.ended && !this.paused)
            this.pause(); });
    }
    on(target, event, handler, options = {}) { target.addEventListener(event, handler, { ...options, signal: this.signal }); }
    async start() {
        if (this.started)
            return;
        this.started = true;
        this.audio.unlock();
        await this.player.pause();
        this.host.querySelector('[data-pause]').disabled = false;
        this.root.innerHTML = '<div class="loading-message">WARMING UP THE CABINET…</div>';
        try {
            const module = await this.cabinet.load();
            if (this.signal.aborted)
                return;
            this.game = await module.mount(this);
        }
        catch (error) {
            if (!this.signal.aborted) {
                this.root.innerHTML = `<div class="empty-state"><h2>This cabinet needs a moment.</h2><p>${escapeHtml(error.message)}</p><button class="button primary" data-retry>Try again</button></div>`;
                this.on(this.root.querySelector('[data-retry]'), 'click', () => this.restart());
            }
        }
    }
    loop(update) {
        let previous = performance.now();
        const frame = now => { if (this.signal.aborted || this.ended)
            return; const dt = Math.min((now - previous) / 1000, .05); previous = now; if (!this.paused)
            update(dt, now / 1000); this.frame = requestAnimationFrame(frame); };
        this.frame = requestAnimationFrame(frame);
    }
    setScore(value) { this.score = Math.round(value); this.host.querySelector('[data-score]').textContent = String(this.score).padStart(5, '0'); }
    setStatus(text) { this.host.querySelector('[data-status]').textContent = text; }
    touch(track) { if (track) {
        this.progress.touchTrack(track);
        this.onTrack(track);
    } }
    pause() {
        if (!this.started || this.ended || this.paused)
            return;
        this.paused = true;
        this.game?.pause?.();
        this.audio.sfx('pause');
        const modal = dialog('Take a breather.', `<p>Your ${this.cabinet.name} run is paused.</p>`, [{ label: 'Resume game', primary: true, action: close => close() }, { label: 'Leave run', action: close => { close(); this.navigate('lobby'); } }]);
        modal.node.addEventListener('close', () => { this.paused = false; this.game?.resume?.(); });
    }
    help() { const wasPaused = this.paused; this.paused = true; const modal = dialog(this.cabinet.name, `<ol class="help-list">${this.cabinet.instructions.map(t => `<li>${t}</li>`).join('')}</ol><p class="controls">${this.cabinet.controls}</p>`); modal.node.addEventListener('close', () => this.paused = wasPaused); }
    leave() { if (this.started && !this.ended) {
        this.paused = true;
        const modal = dialog('Leave this run?', `<p>Your previous records are saved. This unfinished run will not earn rewards.</p>`, [{ label: 'Keep playing', primary: true, action: close => close() }, { label: 'Return to arcade', action: close => { close(); this.navigate('lobby'); } }]);
        modal.node.addEventListener('close', () => this.paused = false);
    }
    else
        this.navigate('lobby'); }
    finish(result) {
        if (this.ended || this.signal.aborted)
            return;
        this.ended = true;
        this.game?.destroy?.();
        cancelAnimationFrame(this.frame);
        this.host.querySelector('[data-pause]').disabled = true;
        const reward = this.progress.complete(this.cabinet.id, result, this.runId);
        this.audio.sfx(result.won ? 'win' : 'good');
        this.setScore(result.score);
        this.root.innerHTML = `<div class="result-screen"><span class="eyebrow">${result.won ? 'RUN COMPLETE' : 'RUN RECORDED'}</span><h2>${escapeHtml(result.title || 'That’s a wrap.')}</h2><p>${escapeHtml(result.message || 'Another score for the passport.')}</p>${result.items?.length ? `<div class="result-artwork">${result.items.slice(0, 4).map(item => artwork(item, 'result-art')).join('')}</div>` : ''}<div class="result-score">${number(result.score)}<span>POINTS</span></div><div class="rewards"><span>◉ +${reward.coins} coins</span><span>▥ +${reward.tickets} tickets</span></div>${result.detail ? `<p class="result-detail">${escapeHtml(result.detail)}</p>` : ''}<div class="button-row"><button class="button primary" data-replay>Play again ↻</button><button class="button" data-lobby>Back to arcade</button></div></div>`;
        this.on(this.root.querySelector('[data-replay]'), 'click', () => this.restart());
        this.on(this.root.querySelector('[data-lobby]'), 'click', () => this.navigate('lobby'));
    }
    empty(message) { this.setStatus('MORE MUSIC NEEDED'); this.root.innerHTML = `<div class="empty-state"><h2>A little more listening first.</h2><p>${escapeHtml(message)}</p><p>Try a different time range or return to the arcade and play Demo Mode.</p><button class="button" data-empty-back>Back to arcade</button></div>`; this.on(this.root.querySelector('button'), 'click', () => this.navigate('lobby')); }
    restart() { this.navigate(`play/${this.cabinet.id}`, true); }
    destroy() { this.controller.abort(); cancelAnimationFrame(this.frame); this.game?.destroy?.(); }
}
