import { ranked } from '../../profile/musicProfile.js';
import { shuffle, clamp } from '../../utils/random.js';
export const ARENA = { width: 880, height: 490 };
export const LEVELS = ['Recent obsessions', 'Current rotation', 'Long-term favorites', 'The ultimate collection'];
const PERIODS = ['short_term', 'medium_term', 'long_term', 'medium_term'];
export function circleHitsRect(x, y, r, rect) { return Math.hypot(x - clamp(x, rect.x, rect.x + rect.w), y - clamp(y, rect.y, rect.y + rect.h)) < r; }
export class TrackAttackEngine {
    constructor(profile, onEvent = () => { }, random = Math.random) { this.profile = profile; this.onEvent = onEvent; this.random = random; this.level = 0; this.score = 0; this.lives = 3; this.totalBanked = 0; this.finished = false; this.loadLevel(); }
    loadLevel() {
        this.player = { x: 440, y: 245, r: 11, dx: 1, dy: 0 };
        this.time = 80;
        this.dashCooldown = 0;
        this.dashTime = 0;
        this.invincible = 1.5;
        this.shield = false;
        this.carry = [];
        this.banked = [];
        this.walls = [{ x: 180, y: 118, w: 165, h: 23 }, { x: 535, y: 118, w: 165, h: 23 }, { x: 180, y: 345, w: 165, h: 23 }, { x: 535, y: 345, w: 165, h: 23 }, { x: 105, y: 205, w: 24, h: 85 }, { x: 751, y: 205, w: 24, h: 85 }];
        const positions = [[90, 75], [270, 75], [440, 58], [650, 70], [792, 90], [795, 405], [630, 418], [440, 430], [240, 420], [72, 400], [268, 245], [610, 245]];
        let tracks = ranked(this.profile, 'tracks', PERIODS[this.level]);
        if (!tracks.length)
            tracks = this.profile.tracks.map((t, i) => ({ ...t, rank: i + 1 }));
        const choices = this.level === 3 ? tracks.slice(0, 10) : shuffle(tracks, this.random).slice(0, 8 + this.level);
        this.records = choices.map((track, i) => ({ track, x: positions[i][0], y: positions[i][1], state: 'field' }));
        this.powerups = [{ x: 435, y: 92, type: 'shield', taken: false }, { x: 435, y: 388, type: 'burst', taken: false }];
        this.enemies = [{ x: 40, y: 40, type: 'skip', phase: 0 }, { x: 840, y: 450, type: 'algorithm', phase: 2 }, ...(this.level > 0 ? [{ x: 830, y: 50, type: 'thief', phase: 4 }] : [])];
        this.onEvent({ type: 'level', level: this.level });
    }
    move(actor, dx, dy, r) {
        const x = clamp(actor.x + dx, r + 12, ARENA.width - r - 12);
        if (!this.walls.some(w => circleHitsRect(x, actor.y, r, w)))
            actor.x = x;
        const y = clamp(actor.y + dy, r + 12, ARENA.height - r - 12);
        if (!this.walls.some(w => circleHitsRect(actor.x, y, r, w)))
            actor.y = y;
    }
    dash() { if (this.dashCooldown <= 0) {
        this.dashTime = .18;
        this.dashCooldown = 2.5;
        this.invincible = Math.max(this.invincible, .25);
        this.onEvent({ type: 'dash' });
    } }
    update(dt, keys) {
        if (this.finished)
            return;
        this.time -= dt;
        this.dashCooldown = Math.max(0, this.dashCooldown - dt);
        this.dashTime = Math.max(0, this.dashTime - dt);
        this.invincible = Math.max(0, this.invincible - dt);
        let dx = (keys.has('ArrowRight') || keys.has('d') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('a') ? 1 : 0), dy = (keys.has('ArrowDown') || keys.has('s') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('w') ? 1 : 0);
        if (dx || dy) {
            const length = Math.hypot(dx, dy);
            dx /= length;
            dy /= length;
            this.player.dx = dx;
            this.player.dy = dy;
        }
        if (this.dashTime > 0) {
            dx = this.player.dx;
            dy = this.player.dy;
        }
        const speed = this.dashTime > 0 ? 540 : 190 - this.carry.length * 12;
        this.move(this.player, dx * speed * dt, dy * speed * dt, 11);
        for (const record of this.records)
            if (record.state === 'field' && this.carry.length < 4 && Math.hypot(this.player.x - record.x, this.player.y - record.y) < 24) {
                record.state = 'carried';
                this.carry.push(record);
                this.onEvent({ type: 'collect', track: record.track });
            }
        for (const power of this.powerups)
            if (!power.taken && Math.hypot(this.player.x - power.x, this.player.y - power.y) < 25) {
                power.taken = true;
                if (power.type === 'shield')
                    this.shield = true;
                else
                    this.dashCooldown = 0;
                this.onEvent({ type: 'power', power: power.type });
            }
        if (this.carry.length && Math.hypot(this.player.x - 440, this.player.y - 245) < 47) {
            const artists = new Set(this.carry.map(r => r.track.artistId));
            const multiplier = artists.size === 1 && this.carry.length > 1 ? 2 : 1;
            for (const record of this.carry) {
                record.state = 'banked';
                this.banked.push(record);
                this.score += (60 + Math.max(1, 51 - record.track.rank) * 3) * multiplier;
                this.totalBanked++;
            }
            this.carry = [];
            this.onEvent({ type: 'bank', combo: multiplier > 1 });
        }
        for (const enemy of this.enemies) {
            enemy.phase += dt;
            let tx = this.player.x, ty = this.player.y;
            if (enemy.type === 'algorithm') {
                tx += this.player.dx * 85;
                ty += this.player.dy * 85;
            }
            if (enemy.type === 'thief') {
                const target = this.records.find(r => r.state === 'field');
                if (target) {
                    tx = target.x + Math.cos(enemy.phase) * 65;
                    ty = target.y + Math.sin(enemy.phase) * 65;
                }
            }
            const distance = Math.hypot(tx - enemy.x, ty - enemy.y) || 1;
            const speed = 60 + this.level * 12;
            this.move(enemy, (tx - enemy.x) / distance * speed * dt, (ty - enemy.y) / distance * speed * dt, 12);
            // If a wall blocks a chaser, a lateral patrol offsets it around the end.
            if (this.walls.some(w => circleHitsRect(enemy.x + (tx - enemy.x) / distance * 16, enemy.y + (ty - enemy.y) / distance * 16, 12, w)))
                this.move(enemy, Math.sin(enemy.phase) * speed * dt, Math.cos(enemy.phase) * speed * dt, 12);
            if (this.invincible <= 0 && Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y) < 23) {
                if (this.shield) {
                    this.shield = false;
                    this.invincible = 2;
                    this.onEvent({ type: 'shield' });
                }
                else {
                    this.lives--;
                    this.invincible = 2;
                    this.carry.forEach(r => r.state = 'field');
                    this.carry = [];
                    this.player.x = 440;
                    this.player.y = 245;
                    this.onEvent({ type: 'hit' });
                }
            }
        }
        if (this.lives <= 0 || this.time <= 0) {
            this.finished = true;
            this.onEvent({ type: 'end', won: false });
            return;
        }
        if (this.banked.length === this.records.length) {
            this.score += Math.floor(this.time) * 10;
            this.onEvent({ type: 'clear' });
            if (this.level === 3) {
                this.finished = true;
                this.onEvent({ type: 'end', won: true });
            }
            else {
                this.level++;
                this.loadLevel();
            }
        }
    }
}
