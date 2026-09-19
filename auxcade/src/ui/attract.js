import { Globe } from '../games/worldTour/globe.js';
import { TrackAttackEngine } from '../games/trackAttack/trackAttackEngine.js';
import { drawArena } from '../games/trackAttack/trackAttackRenderer.js';
// The cabinet screens show miniature game states, not stock artwork.
export function startAttract(root, profile) {
    const canvases = [...root.querySelectorAll('[data-preview]')];
    const globes = new Map();
    const trackEngine = new TrackAttackEngine(profile);
    let frame;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function draw(now) {
        const time = reduced ? 0 : now / 1000;
        for (const canvas of canvases) {
            const id = canvas.dataset.preview;
            if (id === 'world') {
                if (!globes.has(canvas)) {
                    const globe = new Globe(canvas, { interactive: false });
                    globe.zoom = 1.12;
                    globe.setMarkers(profile.artists.filter(a => a.location).slice(0, 12).map(a => ({ ...a, location: a.location })));
                    globes.set(canvas, globe);
                }
                globes.get(canvas).draw(time, !reduced);
                continue;
            }
            const c = canvas.getContext('2d');
            const w = 480, h = 210;
            canvas.width = w;
            canvas.height = h;
            c.fillStyle = '#09051f';
            c.fillRect(0, 0, w, h);
            c.textAlign = 'center';
            if (id === 'track') {
                c.save();
                c.scale(w / 880, h / 490);
                trackEngine.player.x = 440 + Math.sin(time * .5) * 175;
                trackEngine.player.y = 245 + Math.cos(time * .8) * 76;
                drawArena(c, trackEngine, time);
                c.restore();
            }
            else if (id === 'higher') {
                c.fillStyle = '#ffd84a';
                c.font = 'bold 65px monospace';
                c.fillText('#04', 125, 124);
                c.fillStyle = '#ff4f9a';
                c.fillText('#??', 355, 124);
                c.fillStyle = '#31d7ff';
                c.font = '15px monospace';
                c.fillText('VS', 240, 115);
                c.font = '12px monospace';
                c.fillText('WHO DO YOU RANK HIGHER?', 240, 176);
            }
            else if (id === 'roast') {
                c.fillStyle = '#fff4cd';
                c.fillRect(125, 18, 230, 220);
                c.fillStyle = '#32165e';
                c.font = 'bold 18px monospace';
                c.fillText('TASTE UNDER', 240, 58);
                c.fillText('INVESTIGATION', 240, 82);
                c.font = '12px monospace';
                c.fillText('01  REPEAT OFFENDER', 240, 120);
                c.fillText('02  ALBUM TENANCY', 240, 145);
                c.fillText('03  AUX CORD RISK', 240, 170);
                c.strokeStyle = '#8d4d9b';
                c.setLineDash([3, 4]);
                c.beginPath();
                c.moveTo(140, 98);
                c.lineTo(340, 98);
                c.stroke();
                c.setLineDash([]);
            }
            else if (id === 'aux') {
                const colors = ['#ff5757', '#1ed760', '#31d7ff', '#9b72ff', '#ffd84a'];
                for (let i = 0; i < 5; i++) {
                    const x = 104 + i * 68, y = 150 - (50 + Math.sin(time * 1.3 + i * 2) * 32);
                    c.fillStyle = '#301968';
                    c.fillRect(x - 15, 50, 30, 110);
                    c.fillStyle = colors[i];
                    c.fillRect(x - 15, y, 30, 160 - y);
                    c.fillStyle = '#fff8df';
                    c.font = '11px monospace';
                    c.fillText(['MIRA', 'JULES', 'ROWAN', 'CASEY', 'SAM'][i], x, 186);
                }
                c.fillStyle = '#cfc2ef';
                c.font = '12px monospace';
                c.fillText('READ THE ROOM', 240, 27);
            }
            else if (id === 'drop') {
                const colors = ['#ffd84a', '#31d7ff', '#ff4f9a', '#9b72ff'];
                for (let y = 0; y < 3; y++)
                    for (let x = 0; x < 6; x++) {
                        if (y === 0 && (x === 0 || x === 4))
                            continue;
                        const px = 99 + x * 47, py = 65 + y * 43;
                        c.fillStyle = colors[(x + Math.floor(y / 2)) % 4];
                        c.fillRect(px, py, 39, 37);
                        c.fillStyle = '#281459';
                        c.beginPath();
                        c.arc(px + 19, py + 18, 12, 0, Math.PI * 2);
                        c.fill();
                        c.fillStyle = colors[(x + Math.floor(y / 2)) % 4];
                        c.beginPath();
                        c.arc(px + 19, py + 18, 3, 0, Math.PI * 2);
                        c.fill();
                    }
                c.fillStyle = '#d9cff3';
                c.font = '12px monospace';
                c.fillText('CONNECT THREE. CLEAR THE CRATE.', 240, 30);
            }
            else if (id === 'crate') {
                for (let i = 0; i < 4; i++) {
                    const x = 73 + i * 86;
                    c.strokeStyle = '#ffd84a';
                    c.strokeRect(x, 58, 65, 89);
                    c.fillStyle = '#ff70ad';
                    c.font = 'bold 40px monospace';
                    c.fillText(i === 1 ? '✓' : '?', x + 33, 118);
                    c.fillStyle = '#d6c8f5';
                    c.font = '12px monospace';
                    c.fillText('0' + (i + 1), x + 33, 172);
                }
                c.fillStyle = '#d6c8f5';
                c.font = '12px monospace';
                c.fillText('FOUR MISSING RECORDS', 240, 31);
            }
            c.fillStyle = '#0000000e';
            for (let y = 0; y < h; y += 4)
                c.fillRect(0, y, w, 1);
        }
        if (!reduced)
            frame = requestAnimationFrame(draw);
    }
    draw(0);
    return () => { cancelAnimationFrame(frame); globes.forEach(g => g.destroy()); };
}
