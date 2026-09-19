import { roastProfile } from './roastRules.js';
import { escapeHtml, meter, artwork } from '../../utils/dom.js';
export function mount(ctx) {
    if (!ctx.profile.tracks.length && !ctx.profile.artists.length) {
        ctx.empty('The machine needs tracks or artists before it can print a report.');
        return {};
    }
    const roasts = roastProfile(ctx.profile);
    let printed = 0, elapsed = 0, selected = -1;
    ctx.root.innerHTML = `<div class="roast-layout"><div class="roast-console"><span class="eyebrow">AUXCADE QUALITY CONTROL</span><h2>Good music.<br>Questionable<br><em>decisions.</em></h2><p>Analyzing the rotation. Please keep your excuses inside the machine.</p><div class="diagnostics"><div><span>Artist loyalty</span><strong>${Math.min(99, ctx.profile.stats.concentration * 4)} / 100</strong>${meter(Math.min(99, ctx.profile.stats.concentration * 4), 'Artist loyalty')}</div><div><span>Exploration</span><strong>${Math.round(ctx.profile.stats.uniqueArtistRatio * 100)} / 100</strong>${meter(ctx.profile.stats.uniqueArtistRatio * 100, 'Exploration')}</div><div><span>Album commitment</span><strong>${Math.min(99, Math.max(0, ...Object.values(ctx.profile.stats.albumCounts)) * 12)} / 100</strong>${meter(Math.min(99, Math.max(0, ...Object.values(ctx.profile.stats.albumCounts)) * 12), 'Album commitment')}</div></div><small>Fictional ratings. Real rotation. All jokes stay on this device.</small><button class="button" data-skip>Print the rest ↓</button></div><div class="receipt-printer"><div class="printer-slot"></div><article class="receipt"><div class="receipt-head"><strong>AUXCADE</strong><span>MUSIC CRIMES REPORT</span><small>CASE ${String(ctx.progress.data.gamesPlayed + 1).padStart(4, '0')} · MEDIUM ROAST</small></div><div data-roasts></div><div class="receipt-end" hidden><p>Select the charge that hits closest.</p><button class="button dark" data-collect disabled>Accept the evidence</button><div class="barcode" aria-hidden="true"></div><small>NO REFUNDS ON YOUR TASTE</small></div></article></div></div>`;
    function print() {
        if (printed >= roasts.length)
            return;
        const item = roasts[printed], index = printed++;
        const button = document.createElement('button');
        button.className = 'roast-item';
        button.innerHTML = `${artwork(item.subject, 'roast-art')}<span>0${index + 1} / ${escapeHtml(item.title)}</span><strong>${escapeHtml(item.joke)}</strong><small>${escapeHtml(item.evidence)}</small>`;
        ctx.root.querySelector('[data-roasts]').append(button);
        ctx.audio.sfx('stamp');
        ctx.setScore(printed * 100);
        ctx.setStatus(`PRINTING EVIDENCE ${printed} / ${roasts.length}`);
        ctx.on(button, 'click', () => { if (ctx.paused)
            return; selected = index; ctx.root.querySelectorAll('.roast-item').forEach(b => b.classList.toggle('selected', b === button)); ctx.root.querySelector('[data-collect]').disabled = false; ctx.audio.sfx(); });
        if (printed === roasts.length) {
            ctx.root.querySelector('.receipt-end').hidden = false;
            ctx.root.querySelector('[data-skip]').hidden = true;
            ctx.setStatus('VERDICT: YOUR TASTE HAS CHARACTER');
        }
    }
    ctx.loop(dt => { elapsed += dt; if (elapsed > .7) {
        elapsed = 0;
        print();
    } });
    ctx.on(ctx.root.querySelector('[data-skip]'), 'click', () => { if (!ctx.paused)
        while (printed < roasts.length)
            print(); });
    ctx.on(ctx.root.querySelector('[data-collect]'), 'click', () => { if (selected < 0 || ctx.paused)
        return; ctx.finish({ score: roasts.length * 100 + 200, won: true, title: 'Roasted. Respectfully.', message: roasts[selected].joke, items: [roasts[selected].subject], detail: 'Your receipt was generated locally from your profile. No AI service received your listening data.', achievements: ['roasted', ...(ctx.profile.stats.biggestJump?.change >= 10 ? ['obsession'] : [])] }); });
    return {};
}
