import { artistRank, rankMovement } from '../../profile/musicProfile.js';
import { shuffle } from '../../utils/random.js';
export const PREFERENCE_LABELS = { nostalgia: 'Older releases', superfan: 'Top-five artists', contrarian: 'Artists outside the top ten', momentum: 'Fast-rising artists', deepcut: 'Tracks outside the top fifteen', familiar: 'Saved tracks', album: 'Same album as the last record' };
export function buildRules(profile) {
    const years = profile.tracks.map(t => t.year).filter(Number.isFinite).sort((a, b) => a - b);
    const median = years[Math.floor(years.length / 2)] || 2010;
    return {
        nostalgia: { likes: t => t.year && t.year < median, yes: 'This takes me back. Keep this era going.', no: 'A little too new for my mood.' },
        superfan: { likes: t => { const rank = artistRank(profile, t.artistId); return rank !== null && rank <= 5; }, yes: 'Now THAT is a headliner.', no: 'Where are the big favorites?' },
        contrarian: { likes: t => { const rank = artistRank(profile, t.artistId); return rank === null || rank > 10; }, yes: 'Finally, someone off the main stage.', no: 'We hear this artist everywhere.' },
        momentum: { likes: t => (rankMovement(profile, t.artistId) || 0) >= 3, yes: 'I’m so into this artist lately.', no: 'I’m looking for something on the rise.' },
        deepcut: { likes: t => { const i = profile.topTracks.medium_term.indexOf(t.id); return i < 0 || i >= 15; }, yes: 'A proper deep cut. You get it.', no: 'That’s the obvious pick.' },
        familiar: { likes: t => t.saved, yes: 'Already in the collection. Love it.', no: 'I don’t think this one was saved.' },
        album: { likes: (t, previous) => previous?.albumId === t.albumId, yes: 'Same album! Let it tell its story.', no: 'Could we stay with one album for a minute?' },
    };
}
export function createGuests(profile, random = Math.random) {
    const rules = buildRules(profile);
    const available = Object.keys(rules).filter(id => id === 'album' || (id !== 'familiar' || profile.capabilities.saved) && profile.tracks.some(t => rules[id].likes(t)) && profile.tracks.some(t => !rules[id].likes(t)));
    const names = ['Mira', 'Jules', 'Rowan', 'Casey', 'Sam', 'Nova'];
    const colors = ['#d9a476', '#a5bf8e', '#8cb5bf', '#b39cc6', '#d3bf7e', '#d39999'];
    return shuffle(available, random).slice(0, 6).map((ruleId, i) => ({ id: i, name: names[i], color: colors[i], ruleId, satisfaction: 65, patience: 3, inferred: false, reaction: 'Let’s hear what you’ve got.', history: [] }));
}
