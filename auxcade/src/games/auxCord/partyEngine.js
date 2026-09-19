import { createGuests, buildRules } from './npcSystem.js';
import { shuffle, clamp } from '../../utils/random.js';
export class PartyEngine {
    constructor(profile, random = Math.random) { this.profile = profile; this.random = random; this.guests = createGuests(profile, random); this.rules = buildRules(profile); this.energy = 65; this.score = 0; this.turn = 0; this.skips = 2; this.played = []; this.previous = null; this.hand = this.deal(); this.finished = false; this.guesses = new Set(); this.correctDeductions = 0; }
    get activeGuests() { return this.guests.slice(0, Math.min(this.guests.length, 2 + Math.floor(this.turn / 3))); }
    deal() { return shuffle(this.profile.tracks.filter(t => !this.played?.slice(-4).includes(t.id)), this.random).slice(0, 5); }
    select(trackId) {
        if (this.finished)
            return null;
        const track = this.hand.find(t => t.id === trackId);
        if (!track)
            return null;
        const guests = this.activeGuests, repeated = this.played.includes(track.id);
        let net = 0;
        for (const guest of guests) {
            const rule = this.rules[guest.ruleId], liked = !!rule.likes(track, this.previous);
            const delta = liked ? 13 : -10;
            guest.satisfaction = clamp(guest.satisfaction + delta - (repeated ? 8 : 0), 0, 100);
            guest.reaction = rule[liked ? 'yes' : 'no'] + (repeated ? ' We just heard this, though.' : '');
            guest.history.push({ name: track.name, liked });
            guest.history = guest.history.slice(-4);
            net += liked ? 1 : -.7;
        }
        const change = Math.round(net / Math.max(1, guests.length) * 16) - 2 - (repeated ? 8 : 0);
        this.energy = clamp(this.energy + change, 0, 100);
        this.score += Math.max(0, Math.round(this.energy * 2 + Math.max(0, net) * 40));
        this.played.push(track.id);
        this.previous = track;
        this.turn++;
        this.hand = this.deal();
        this.finished = this.energy <= 0 || this.turn >= 12;
        return { track, change };
    }
    refresh() { if (this.skips <= 0 || this.finished)
        return false; this.skips--; this.energy = Math.max(0, this.energy - 3); this.hand = this.deal(); return true; }
    infer(guestId, guess) {
        const guest = this.activeGuests.find(g => g.id === guestId);
        if (!guest || guest.inferred || this.guesses.has(guestId))
            return null;
        this.guesses.add(guestId);
        if (guest.ruleId === guess) {
            guest.inferred = true;
            this.correctDeductions++;
            this.score += 250;
            this.energy = clamp(this.energy + 8, 0, 100);
            return true;
        }
        this.energy = Math.max(0, this.energy - 5);
        return false;
    }
}
