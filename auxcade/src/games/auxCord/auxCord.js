import { PartyEngine } from './partyEngine.js';
import { PREFERENCE_LABELS } from './npcSystem.js';
import { artistRank } from '../../profile/musicProfile.js';
import { escapeHtml, meter, artwork } from '../../utils/dom.js';
import { dialog, notify } from '../../ui/notifications.js';
export function mount(ctx) {
    if (ctx.profile.tracks.length < 8) {
        ctx.empty('The party needs at least eight tracks and a little variety.');
        return {};
    }
    const engine = new PartyEngine(ctx.profile);
    if (engine.guests.length < 2) {
        ctx.empty('This collection needs more variation in artists, ranks, or release years for the guests to have different preferences.');
        return {};
    }
    function render() {
        ctx.setScore(engine.score);
        ctx.setStatus(`SELECTION ${Math.min(engine.turn + 1, 12)} / 12 · ${engine.activeGuests.length} GUESTS`);
        ctx.root.innerHTML = `<div class="party"><div class="party-header"><div><span class="eyebrow">YOU HAVE THE AUX CORD</span><h2>${engine.turn === 0 ? 'Set the mood.' : engine.energy > 65 ? 'You’ve got the room.' : engine.energy > 35 ? 'Read those reactions.' : 'Time to turn it around.'}</h2></div><div class="crowd-energy"><span>CROWD ENERGY <strong>${engine.energy}%</strong></span>${meter(engine.energy, 'Crowd energy')}</div></div><div class="guest-floor">${engine.activeGuests.map(guest => `<article class="guest" style="--guest-color:${guest.color}"><div class="guest-top"><span class="guest-avatar">${guest.name.slice(0, 1)}</span><div><strong>${guest.name}</strong><small>${guest.inferred ? escapeHtml(PREFERENCE_LABELS[guest.ruleId]) : 'Preference unknown'}</small></div></div><p class="reaction">“${escapeHtml(guest.reaction)}”</p>${meter(guest.satisfaction, `${guest.name} satisfaction`)}<button class="button small" data-guest="${guest.id}" ${engine.guesses.has(guest.id) ? 'disabled' : ''}>${guest.inferred ? '✓ Profile solved' : engine.guesses.has(guest.id) ? 'Guess used' : 'Open notebook'}</button></article>`).join('')}</div><div class="setlist-bar"><span>${engine.previous ? `LAST PLAYED: ${escapeHtml(engine.previous.name)}` : 'THE FLOOR IS WAITING'}</span><button class="button small" data-refresh ${engine.skips <= 0 ? 'disabled' : ''}>Refresh hand · ${engine.skips} left</button></div><div class="track-hand">${engine.hand.map(t => `<button class="song-card" data-song="${escapeHtml(t.id)}">${artwork(t)}<span class="song-year">${t.year || 'YEAR UNKNOWN'} ${t.saved ? '· SAVED' : ''}</span><strong>${escapeHtml(t.name)}</strong><span>${escapeHtml(t.artistName)}</span><small>${escapeHtml(t.albumName)}</small><span class="song-rank">ARTIST #${artistRank(ctx.profile, t.artistId) || '—'} · ${ctx.profile.topTracks.medium_term.includes(t.id) ? `TRACK #${ctx.profile.topTracks.medium_term.indexOf(t.id) + 1}` : 'DEEP CUT'}</span></button>`).join('')}</div><p class="party-hint">A good host listens to the guests. Match their reactions to the clues on each record.</p></div>`;
        ctx.root.querySelectorAll('[data-song]').forEach(b => ctx.on(b, 'click', () => {
            if (ctx.paused)
                return;
            const result = engine.select(b.dataset.song);
            if (!result)
                return;
            ctx.touch(result.track);
            ctx.audio.sfx(result.change >= 0 ? 'good' : 'bad');
            if (engine.finished)
                finish();
            else
                render();
        }));
        ctx.on(ctx.root.querySelector('[data-refresh]'), 'click', () => { if (!ctx.paused && engine.refresh()) {
            ctx.audio.sfx('drop');
            render();
        } });
        ctx.root.querySelectorAll('[data-guest]').forEach(b => ctx.on(b, 'click', () => notebook(Number(b.dataset.guest))));
    }
    function notebook(id) {
        const guest = engine.activeGuests.find(g => g.id === id);
        const modal = dialog(`${guest.name}’s listening notes`, `<p>One guess per guest. Correct: +250 points and +8 energy. Incorrect: −5 energy.</p><ul>${guest.history.length ? guest.history.map(h => `<li>${h.liked ? '✓' : '−'} ${escapeHtml(h.name)}</li>`).join('') : '<li>No observations yet. Try a few records first.</li>'}</ul><label>What does ${guest.name} prefer?<select data-rule>${Object.entries(PREFERENCE_LABELS).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}</select></label>`, [{ label: 'Lock in deduction', primary: true, action: (close, node) => { const right = engine.infer(id, node.querySelector('select').value); close(); notify(right ? 'Correct. You read the room!' : 'That wasn’t the pattern. Watch the next reactions.'); ctx.audio.sfx(right ? 'good' : 'bad'); if (engine.energy <= 0) {
                    engine.finished = true;
                    finish();
                }
                else
                    render(); } }]);
    }
    function finish() { ctx.finish({ score: engine.score, won: engine.turn >= 12 && engine.energy > 0, title: engine.energy > 40 ? 'The aux cord is yours.' : engine.energy > 0 ? 'You kept the party going.' : 'The room needs a reset.', message: `${engine.turn} selections · ${engine.energy}% final energy · ${engine.correctDeductions} guests figured out.`, detail: engine.guests.map(g => `${g.name}: ${PREFERENCE_LABELS[g.ruleId]}`).join(' / '), achievements: [...(engine.turn >= 12 && engine.energy > 40 ? ['aux-survivor'] : []), ...(engine.correctDeductions >= 3 ? ['crowd-reader'] : [])] }); }
    render();
    return {};
}
