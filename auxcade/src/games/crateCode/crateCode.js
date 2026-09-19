import { generatePuzzle, checkCrate, recordFacts } from './puzzleGenerator.js';
import { escapeHtml, artwork } from '../../utils/dom.js';
export function mount(ctx) {
    const puzzle = generatePuzzle(ctx.profile);
    if (!puzzle) {
        ctx.empty('Crate Code needs at least six distinct tracks.');
        return {};
    }
    const assignments = Array(4).fill(null), scanned = new Set();
    let selected = 0, attempts = 0, feedback = 'Select a slot, then assign a record. Read every clue.';
    function render() {
        ctx.setStatus(`${5 - attempts} CHECKS LEFT · ${2 - scanned.size} SCANS LEFT`);
        ctx.root.innerHTML = `<div class="crate-layout"><div class="crate-header"><div><span class="eyebrow">CASE FILE / YOUR MISSING RECORDS</span><h2>Crack the collection.</h2></div><button class="button small" data-scan ${scanned.size >= 2 || scanned.has(selected) ? 'disabled' : ''}>Scan slot ${selected + 1} · −200 pts</button></div><div class="crate-slots">${puzzle.slots.map((slot, i) => { const t = puzzle.pool.find(t => t.id === assignments[i]); return `<button class="crate-slot ${selected === i ? 'selected' : ''} ${t ? 'filled' : ''}" data-slot="${i}"><span class="eyebrow">SLOT 0${i + 1}</span>${t ? artwork(t, 'crate-slot-art') : ''}<strong>${t ? escapeHtml(t.name) : 'Unassigned record'}</strong><ul>${slot.clues.map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ul>${scanned.has(i) ? `<p class="scan-clue">${escapeHtml(slot.scan)}</p>` : ''}</button>`; }).join('')}</div><div class="crate-toolbar"><p aria-live="polite">${escapeHtml(feedback)}</p><div class="button-row"><button class="button small" data-clear>Clear slot</button><button class="button primary" data-check ${assignments.some(a => !a) ? 'disabled' : ''}>Check the crate →</button></div></div><div class="candidate-grid">${puzzle.pool.map((t, i) => { const facts = recordFacts(ctx.profile, t), assigned = assignments.indexOf(t.id); return `<button class="candidate ${assigned >= 0 ? 'assigned' : ''}" data-record="${escapeHtml(t.id)}">${artwork(t, 'candidate-art')}<span class="catalog-no">${String(i + 1).padStart(2, '0')}${assigned >= 0 ? ` → SLOT ${assigned + 1}` : ''}</span><strong>${escapeHtml(t.name)}</strong><span>${escapeHtml(t.artistName)} · ${t.year || 'YEAR UNKNOWN'}</span><small>${escapeHtml(t.albumName)}</small><small>Artist #${facts.artistRank || '—'} · Track #${facts.trackRank || '—'} · ${t.saved ? 'Saved' : 'Not saved'}</small></button>`; }).join('')}</div></div>`;
        ctx.root.querySelectorAll('[data-slot]').forEach(b => ctx.on(b, 'click', () => { if (!ctx.paused) {
            selected = Number(b.dataset.slot);
            render();
        } }));
        ctx.root.querySelectorAll('[data-record]').forEach(b => ctx.on(b, 'click', () => { if (ctx.paused)
            return; const id = b.dataset.record, previous = assignments.indexOf(id); if (previous >= 0)
            assignments[previous] = null; assignments[selected] = id; ctx.touch(puzzle.pool.find(t => t.id === id)); ctx.audio.sfx(); selected = (selected + 1) % 4; render(); }));
        ctx.on(ctx.root.querySelector('[data-clear]'), 'click', () => { if (!ctx.paused) {
            assignments[selected] = null;
            render();
        } });
        ctx.on(ctx.root.querySelector('[data-scan]'), 'click', () => { if (ctx.paused || scanned.size >= 2 || scanned.has(selected))
            return; scanned.add(selected); ctx.audio.sfx('stamp'); render(); });
        ctx.on(ctx.root.querySelector('[data-check]'), 'click', () => {
            if (ctx.paused || assignments.some(a => !a))
                return;
            attempts++;
            const correct = checkCrate(puzzle.slots, assignments);
            ctx.audio.sfx(correct === 4 ? 'win' : 'bad');
            if (correct === 4 || attempts >= 5) {
                const won = correct === 4, score = won ? 2400 - (attempts - 1) * 250 - scanned.size * 200 : correct * 200;
                ctx.finish({ score, won, title: won ? 'Case closed. Crate filled.' : 'A few records got away.', message: won ? `Solved in ${attempts} ${attempts === 1 ? 'check' : 'checks'} with ${scanned.size} scans.` : `${correct} of 4 records were correctly placed.`, detail: `Solution: ${puzzle.slots.map((s, i) => `${i + 1}. ${puzzle.pool.find(t => t.id === s.trackId).name}`).join(' / ')}`, items: puzzle.slots.map(slot => puzzle.pool.find(track => track.id === slot.trackId)), achievements: won ? ['codebreaker', ...(attempts === 1 && scanned.size === 0 ? ['clean-solve'] : [])] : [] });
            }
            else {
                feedback = `${correct} of 4 records are in the right slots. ${5 - attempts} checks left.`;
                ctx.setScore(correct * 200);
                render();
            }
        });
    }
    render();
    return {};
}
