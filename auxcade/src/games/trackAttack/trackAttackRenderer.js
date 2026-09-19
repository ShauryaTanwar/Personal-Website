import { ARENA } from './trackAttackEngine.js';
export function drawArena(c, engine, time = 0, art = new Map()) {
    const { width: w, height: h } = ARENA;
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#09051f';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#32216d';
    c.lineWidth = 1;
    for (let x = 24; x < w; x += 36) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, h);
        c.stroke();
    }
    for (let y = 18; y < h; y += 36) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(w, y);
        c.stroke();
    }
    c.strokeStyle = '#31d7ff66';
    c.strokeRect(12, 12, w - 24, h - 24);
    for (const wall of engine.walls) {
        c.fillStyle = '#442177';
        c.fillRect(wall.x, wall.y, wall.w, wall.h);
        c.fillStyle = '#ff4f9a';
        c.fillRect(wall.x, wall.y, wall.w, 3);
    }
    c.strokeStyle = '#ffd84a';
    c.fillStyle = '#ffd84a18';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(440, 245, 48, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.textAlign = 'center';
    c.fillStyle = '#fff06b';
    c.font = '12px monospace';
    c.fillText('ARCHIVE', 440, 244);
    c.font = '10px monospace';
    c.fillText('BANK HERE', 440, 260);
    for (const r of engine.records)
        if (r.state === 'field') {
            const image = art.get(r.track.image);
            c.fillStyle = '#ffd84a';
            c.fillRect(r.x - 15, r.y - 15, 30, 30);
            if (image?.complete && image.naturalWidth) {
                const side = Math.min(image.naturalWidth, image.naturalHeight);
                c.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, r.x - 12, r.y - 12, 24, 24);
            }
            else {
                c.fillStyle = '#32165e';
                c.beginPath();
                c.arc(r.x, r.y, 9, 0, Math.PI * 2);
                c.fill();
            }
            c.fillStyle = '#fff8df';
            c.font = '9px monospace';
            c.fillText(r.track.artistName.slice(0, 14), r.x, r.y + 27);
        }
    for (const p of engine.powerups)
        if (!p.taken) {
            c.strokeStyle = '#31d7ff';
            c.fillStyle = '#31d7ff22';
            c.beginPath();
            c.arc(p.x, p.y, 13 + Math.sin(time * 3), 0, Math.PI * 2);
            c.fill();
            c.stroke();
            c.fillStyle = '#b7f3ff';
            c.font = 'bold 14px monospace';
            c.fillText(p.type === 'shield' ? 'S' : '↯', p.x, p.y + 5);
        }
    for (const enemy of engine.enemies) {
        c.fillStyle = enemy.type === 'skip' ? '#ff5757' : enemy.type === 'algorithm' ? '#31d7ff' : '#ff4f9a';
        c.beginPath();
        c.moveTo(enemy.x, enemy.y - 14);
        c.lineTo(enemy.x + 14, enemy.y);
        c.lineTo(enemy.x, enemy.y + 14);
        c.lineTo(enemy.x - 14, enemy.y);
        c.closePath();
        c.fill();
        c.fillStyle = '#170a38';
        c.font = 'bold 13px monospace';
        c.fillText(enemy.type === 'skip' ? '»' : enemy.type === 'algorithm' ? 'A' : 'T', enemy.x, enemy.y + 4);
    }
    const p = engine.player;
    c.globalAlpha = engine.invincible > 0 && Math.floor(time * 12) % 2 === 0 ? .55 : 1;
    c.fillStyle = '#fff8df';
    c.beginPath();
    c.arc(p.x, p.y, 11, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#774cff';
    c.beginPath();
    c.arc(p.x + p.dx * 4, p.y + p.dy * 4, 4, 0, Math.PI * 2);
    c.fill();
    if (engine.shield) {
        c.strokeStyle = '#31d7ff';
        c.beginPath();
        c.arc(p.x, p.y, 18, 0, Math.PI * 2);
        c.stroke();
    }
    c.globalAlpha = 1;
    engine.carry.forEach((_, i) => { c.fillStyle = '#ffd84a'; c.fillRect(p.x - 14 + i * 8, p.y + 18, 5, 5); });
}
