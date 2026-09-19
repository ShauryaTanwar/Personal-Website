import { ACHIEVEMENTS } from './achievements.js';
import { readJson, writeJson, removeItem } from '../utils/storage.js';
export function defaultProgress() { return { version: 1, coins: 0, tickets: 0, xp: 0, sessions: 0, gamesPlayed: 0, highScores: {}, plays: {}, achievements: [], countries: [], continents: [], locations: [], decades: [], unlocked: ['classic'], theme: 'classic', history: [], quizCorrect: 0, quizRounds: 0, puzzlesSolved: 0 }; }
export class Progression {
    constructor(playerId, onChange = () => { }, onAchievement = () => { }) {
        this.key = `auxcade:progress:${playerId}`;
        this.onChange = onChange;
        this.onAchievement = onAchievement;
        const saved = readJson(this.key);
        this.data = saved?.version === 1 ? { ...defaultProgress(), ...saved } : defaultProgress();
        // Damaged storage must not poison counters or prevent the arcade loading.
        for (const field of ['coins', 'tickets', 'xp', 'sessions', 'gamesPlayed', 'quizCorrect', 'quizRounds', 'puzzlesSolved'])
            if (!Number.isFinite(this.data[field]) || this.data[field] < 0)
                this.data[field] = 0;
        for (const field of ['achievements', 'countries', 'continents', 'locations', 'decades', 'unlocked', 'history'])
            if (!Array.isArray(this.data[field]))
                this.data[field] = defaultProgress()[field];
        for (const field of ['highScores', 'plays'])
            if (!this.data[field] || typeof this.data[field] !== 'object' || Array.isArray(this.data[field]))
                this.data[field] = {};
        this.completedRuns = new Set();
        this.data.sessions++;
        this.save();
    }
    get level() { return 1 + Math.floor(this.data.xp / 500); }
    save() { writeJson(this.key, this.data); this.onChange(this.data); }
    award(id) {
        if (this.data.achievements.includes(id))
            return;
        const achievement = ACHIEVEMENTS.find(a => a.id === id);
        if (!achievement)
            return;
        this.data.achievements.push(id);
        this.data.coins += achievement.coins;
        this.data.tickets += achievement.tickets;
        this.save();
        this.onAchievement(achievement);
    }
    complete(gameId, result, runId) {
        if (this.completedRuns.has(runId))
            return { coins: 0, tickets: 0 };
        this.completedRuns.add(runId);
        const score = Math.max(0, Math.round(Number(result.score) || 0));
        const coins = Math.min(120, 10 + Math.floor(score / 70));
        const tickets = result.won ? 2 : 0;
        this.data.coins += coins;
        this.data.tickets += tickets;
        this.data.xp += Math.min(300, 30 + Math.floor(score / 15));
        this.data.gamesPlayed++;
        this.data.plays[gameId] = (this.data.plays[gameId] || 0) + 1;
        this.data.highScores[gameId] = Math.max(this.data.highScores[gameId] || 0, score);
        this.data.history.unshift({ gameId, score, date: new Date().toISOString() });
        this.data.history = this.data.history.slice(0, 20);
        if (gameId === 'higher') {
            this.data.quizCorrect += result.correct || 0;
            this.data.quizRounds += result.rounds || 0;
        }
        if (gameId === 'crate' && result.won)
            this.data.puzzlesSolved++;
        this.save();
        this.award('first-play');
        if (Object.keys(this.data.plays).length >= 7)
            this.award('all-seven');
        for (const id of result.achievements || [])
            this.award(id);
        return { coins, tickets };
    }
    discover(artistId, location) {
        if (!this.data.locations.includes(artistId))
            this.data.locations.push(artistId);
        if (location.country && !this.data.countries.includes(location.country))
            this.data.countries.push(location.country);
        if (location.continent && !this.data.continents.includes(location.continent))
            this.data.continents.push(location.continent);
        this.save();
        this.award('first-stamp');
        if (this.data.continents.length >= 5)
            this.award('worldwide');
    }
    touchTrack(track) {
        if (!track?.year)
            return;
        const decade = Math.floor(track.year / 10) * 10;
        if (!this.data.decades.includes(decade)) {
            this.data.decades.push(decade);
            this.save();
        }
        if (this.data.decades.length >= 5)
            this.award('archivist');
    }
    purchase(theme, cost) {
        if (!this.data.unlocked.includes(theme)) {
            if (this.data.coins < cost)
                return false;
            this.data.coins -= cost;
            this.data.unlocked.push(theme);
        }
        this.data.theme = theme;
        this.save();
        return true;
    }
    reset() { this.data = defaultProgress(); this.save(); }
    forget() { removeItem(this.key); }
}
