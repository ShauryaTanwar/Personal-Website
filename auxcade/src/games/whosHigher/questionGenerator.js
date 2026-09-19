import { ranked, rankMovement } from '../../profile/musicProfile.js';
import { shuffle, pick } from '../../utils/random.js';
export function generateQuestions(profile, mode = 'artists', range = 'medium_term', random = Math.random) {
    const pools = [];
    for (const type of mode === 'mixed' ? ['artists', 'tracks'] : [mode === 'movement' ? 'artists' : mode]) {
        const list = ranked(profile, type, range);
        for (let i = 0; i < list.length; i++)
            for (let j = i + 1; j < list.length; j++) {
                const a = list[i], b = list[j];
                const va = mode === 'movement' ? rankMovement(profile, a.id) : -a.rank;
                const vb = mode === 'movement' ? rankMovement(profile, b.id) : -b.rank;
                if (va === null || vb === null || va === vb)
                    continue;
                pools.push({ a, b, type, gap: Math.abs(va - vb), winner: va > vb ? a.id : b.id, movement: mode === 'movement', values: { [a.id]: va, [b.id]: vb } });
            }
    }
    if (pools.length < 10)
        return [];
    const sorted = shuffle(pools, random).sort((a, b) => b.gap - a.gap), questions = [];
    for (let round = 0; round < 10; round++) {
        const fraction = round / 9;
        const target = Math.floor(fraction * (sorted.length - 1));
        const window = sorted.slice(Math.max(0, target - 3), Math.min(sorted.length, target + 4));
        const selected = pick(window, random);
        sorted.splice(sorted.indexOf(selected), 1);
        if (random() > .5)
            [selected.a, selected.b] = [selected.b, selected.a];
        questions.push({ ...selected, round: round + 1 });
    }
    return questions;
}
export function scoreAnswer(round, streak) { return 100 + round * 15 + Math.min(streak, 5) * 25; }
