import { pick, shuffle } from '../../utils/random.js';
export const COLS = 6, ROWS = 10;
export function findGroups(board) {
    const seen = new Set(), groups = [];
    for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++) {
            if (!board[y][x] || seen.has(`${x},${y}`))
                continue;
            const group = [], stack = [[x, y]], artist = board[y][x].artistId;
            while (stack.length) {
                const [cx, cy] = stack.pop(), key = `${cx},${cy}`;
                if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS || seen.has(key) || board[cy][cx]?.artistId !== artist)
                    continue;
                seen.add(key);
                group.push({ x: cx, y: cy, track: board[cy][cx] });
                stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
            }
            if (group.length >= 3 || group.length >= 2 && group.some(cell => cell.track.power))
                groups.push(group);
        }
    return groups;
}
export function applyGravity(board) {
    for (let x = 0; x < COLS; x++) {
        const column = board.map(row => row[x]).filter(Boolean);
        for (let y = ROWS - 1; y >= 0; y--)
            board[y][x] = column.pop() || null;
    }
    return board;
}
export function resolveBoard(board) {
    let chains = 0, score = 0, albumClear = false, cleared = 0;
    const flashes = [];
    while (true) {
        const groups = findGroups(board);
        if (!groups.length)
            break;
        chains++;
        for (const group of groups) {
            const sameAlbum = new Set(group.map(c => c.track.albumId)).size === 1, sameEra = new Set(group.map(c => c.track.year ? Math.floor(c.track.year / 10) : null)).size === 1 && group.every(c => c.track.year);
            albumClear ||= sameAlbum;
            score += group.length * 80 * chains + (sameAlbum ? 150 : 0) + (sameEra ? 60 : 0);
            cleared += group.length;
            for (const cell of group) {
                board[cell.y][cell.x] = null;
                flashes.push({ x: cell.x, y: cell.y });
            }
        }
        applyGravity(board);
    }
    return { score, chains, albumClear, cleared, flashes };
}
export class DropEngine {
    constructor(profile, onEvent = () => { }, random = Math.random) {
        this.random = random;
        this.onEvent = onEvent;
        this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        const familyIds = shuffle([...new Set(profile.tracks.map(t => t.artistId))], random).slice(0, 4);
        this.families = familyIds;
        this.pool = profile.tracks.filter(t => familyIds.includes(t.artistId)).map(t => ({ ...t, power: profile.topTracks.medium_term.slice(0, 5).includes(t.id) }));
        this.score = 0;
        this.drops = 0;
        this.cleared = 0;
        this.bestChain = 0;
        this.hadAlbum = false;
        this.finished = false;
        this.clock = 0;
        this.next = this.pair();
        this.spawn();
    }
    pair() { return [pick(this.pool, this.random), pick(this.pool, this.random)]; }
    spawn() { this.active = { x: 2, y: 0, tracks: this.next }; this.next = this.pair(); if (!this.canPlace(this.active.x, 0)) {
        this.finished = true;
        this.onEvent({ type: 'end', won: false });
    } }
    canPlace(x, y) { return x >= 0 && x < COLS - 1 && y >= 0 && y < ROWS && !this.board[y][x] && !this.board[y][x + 1]; }
    move(dx) { if (!this.finished && this.canPlace(this.active.x + dx, this.active.y))
        this.active.x += dx; }
    swap() { if (!this.finished)
        this.active.tracks.reverse(); }
    step() { if (this.finished)
        return; if (this.canPlace(this.active.x, this.active.y + 1))
        this.active.y++;
    else
        this.lock(); }
    hardDrop() { if (this.finished)
        return; while (this.canPlace(this.active.x, this.active.y + 1)) {
        this.active.y++;
        this.score += 2;
    } this.lock(); }
    landingY() { let y = this.active.y; while (this.canPlace(this.active.x, y + 1))
        y++; return y; }
    lock() {
        for (let i = 0; i < 2; i++)
            this.board[this.active.y][this.active.x + i] = this.active.tracks[i];
        const landed = this.active.tracks;
        applyGravity(this.board);
        const result = resolveBoard(this.board);
        this.score += result.score;
        this.drops++;
        this.cleared += result.cleared;
        this.bestChain = Math.max(this.bestChain, result.chains);
        this.hadAlbum ||= result.albumClear;
        this.onEvent({ type: result.cleared ? 'clear' : 'drop', ...result, tracks: landed });
        this.clock = 0;
        if (this.drops >= 40) {
            this.finished = true;
            this.onEvent({ type: 'end', won: true });
        }
        else
            this.spawn();
    }
    update(dt) { if (this.finished)
        return; this.clock += dt; const interval = Math.max(.23, 1.1 - this.drops * .021); if (this.clock >= interval) {
        this.clock = 0;
        this.step();
    } }
}
