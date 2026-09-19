import { generateQuestions, scoreAnswer } from './questionGenerator.js';
import { escapeHtml, artwork, spotifyLink } from '../../utils/dom.js';
import { RANGE_LABELS, topTrackForArtist } from '../../profile/musicProfile.js';
export function mount(ctx) {
    let questions = [], index = 0, correct = 0, score = 0, streak = 0, answered = false, deepCut = false, mode = 'artists';
    ctx.root.innerHTML = `<div class="quiz-setup"><span class="eyebrow">TEN ROUNDS / YOUR RANKINGS</span><h2>How well do you know<br>your own favorites?</h2><div class="form-grid"><label>Matchup<select data-mode><option value="artists">Artists</option><option value="tracks">Tracks</option><option value="mixed">Mixed</option><option value="movement">Ranking movement</option></select></label><label>Listening period<select data-range>${Object.entries(RANGE_LABELS).map(([k, v]) => `<option value="${k}" ${k === 'medium_term' ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div><button class="button primary" data-deal>Deal ten rounds →</button><p class="muted">${ctx.profile.source === 'demo' ? 'Demo rankings are fictional. Get to know the demo profile in your passport.' : 'Based on Spotify affinity ranks, not exact play counts.'}</p></div>`;
    ctx.on(ctx.root.querySelector('[data-deal]'), 'click', () => {
        mode = ctx.root.querySelector('[data-mode]').value;
        const range = ctx.root.querySelector('[data-range]').value;
        questions = generateQuestions(ctx.profile, mode, range);
        if (!questions.length) {
            ctx.empty('This mode needs at least ten distinct matchups. Try artists, tracks, or a different period.');
            return;
        }
        render();
    });
    function render() {
        answered = false;
        const q = questions[index];
        ctx.setStatus(`ROUND ${index + 1} / 10 · ${streak} STREAK`);
        ctx.root.innerHTML = `<div class="quiz"><div class="round-dots">${questions.map((_, i) => `<i class="${i < index ? 'done' : i === index ? 'current' : ''}"></i>`).join('')}</div><span class="eyebrow">${q.movement ? 'WHO IS TAKING OVER YOUR ROTATION?' : 'WHO DO YOU RANK HIGHER?'}</span><div class="versus"><div class="vs-label">VS</div>${[q.a, q.b].map((item, i) => `<div class="matchup-wrap"><button class="matchup" data-choice="${i}"><span class="choice-key">${i + 1}</span>${artwork(item, 'matchup-art')}<h2>${escapeHtml(item.name)}</h2><p>${escapeHtml(item.artistName || 'Artist')}</p><span class="rank-reveal">?</span></button>${ctx.profile.source === 'spotify' ? spotifyLink(item) : ''}</div>`).join('')}</div><p class="quiz-feedback" aria-live="polite">${index < 3 ? 'Trust your first instinct.' : index < 7 ? 'The gaps are getting smaller.' : 'Close call. Make it count.'}</p><button class="button primary" data-next disabled>Next matchup →</button></div>`;
        ctx.root.querySelectorAll('[data-choice]').forEach(button => ctx.on(button, 'click', () => choose(Number(button.dataset.choice))));
        ctx.on(ctx.root.querySelector('[data-next]'), 'click', next);
    }
    function choose(choice) {
        if (answered || ctx.paused || !questions.length)
            return;
        answered = true;
        const q = questions[index], item = [q.a, q.b][choice], right = item.id === q.winner;
        streak = right ? streak + 1 : 0;
        if (right) {
            correct++;
            score += scoreAnswer(index + 1, streak);
            if (Math.min(q.a.rank, q.b.rank) > 10 && q.gap <= 3)
                deepCut = true;
        }
        ctx.setScore(score);
        ctx.audio.sfx(right ? 'good' : 'bad');
        ctx.touch(q.type === 'tracks' ? item : topTrackForArtist(ctx.profile, item.id));
        ctx.root.querySelectorAll('[data-choice]').forEach((button, i) => {
            const candidate = [q.a, q.b][i];
            button.disabled = true;
            button.classList.add(candidate.id === q.winner ? 'winner' : 'loser');
            button.querySelector('.rank-reveal').textContent = q.movement ? `${q.values[candidate.id] >= 0 ? '+' : ''}${q.values[candidate.id]} places` : `#${candidate.rank}`;
        });
        ctx.root.querySelector('.quiz-feedback').textContent = right ? `Correct. ${streak > 1 ? `${streak} in a row!` : 'You know the rotation.'}` : `Not this time. ${[q.a, q.b].find(i => i.id === q.winner).name} wins this matchup.`;
        ctx.root.querySelector('[data-next]').disabled = false;
        ctx.root.querySelector('[data-next]').textContent = index === 9 ? 'See your result →' : 'Next matchup →';
    }
    function next() { if (!answered || ctx.paused)
        return; if (++index === 10) {
        ctx.finish({ score, correct, rounds: 10, won: correct >= 7, title: correct === 10 ? 'Perfect ear.' : correct >= 7 ? 'Rotation royalty.' : 'The shuffle surprised you.', message: `${correct} out of 10 correct.`, achievements: [...(correct === 10 ? ['perfect-ear'] : []), ...(deepCut ? ['deep-cut'] : [])] });
    }
    else
        render(); }
    ctx.on(document, 'keydown', event => { if (document.querySelector('dialog[open]'))
        return; if (['1', '2'].includes(event.key))
        choose(Number(event.key) - 1); if (event.key === 'Enter' && answered) {
        event.preventDefault();
        next();
    } });
    return {};
}
