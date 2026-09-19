import { CABINETS } from './cabinets.js';
import { escapeHtml, number } from '../utils/dom.js';
import { startAttract } from './attract.js';
export function renderLobby(root, services) {
    const { profile, progress, navigate } = services;
    const d = progress.data;
    root.innerHTML = `<section class="lobby"><div class="lobby-heading"><div><span class="eyebrow">WELCOME TO YOUR ROTATION, ${escapeHtml(profile.user.name.toUpperCase())}</span><h1>Good taste.<br class="mobile-break"> Better high scores.</h1></div><div class="lobby-stamp"><span>ALL SYSTEMS GO</span><strong>07</strong><small>CABINETS / FREE PLAY</small></div></div><div class="lobby-toolbar"><span><i class="live-dot"></i> THE ARCADE FLOOR</span><span>${profile.source === 'demo' ? 'DEMO COLLECTION · FICTIONAL RANKINGS' : `${profile.artists.length} ARTISTS · ${profile.tracks.length} TRACKS`}</span></div><div class="cabinet-grid">${CABINETS.map((game, i) => `<button class="cabinet ${i === 0 ? 'featured' : ''}" style="--cabinet-color:${game.color}" data-cabinet="${game.id}"><div class="cabinet-marquee"><span>${game.category}</span><span>NO. ${game.number}</span></div><div class="cabinet-screen"><canvas data-preview="${game.id}" aria-hidden="true"></canvas><span class="screen-label">${i === 0 ? 'RECOVER YOUR ROTATION' : 'PRESS START'}</span></div><div class="cabinet-copy"><div><h2>${game.name}</h2><p>${game.description}</p></div><span class="cabinet-arrow">↗</span></div><div class="cabinet-bottom"><span>${d.highScores[game.id] ? `BEST ${number(d.highScores[game.id])}` : game.tag}</span><span>${d.plays[game.id] ? 'PLAY AGAIN' : 'PLAY'}</span></div></button>`).join('')}</div><div class="lobby-note"><span>YOUR MUSIC IS THE GAME.</span><p>Different ways to play. One collection that makes it yours.</p><button class="text-button" data-passport>Open arcade passport ↗</button></div></section>`;
    root.querySelectorAll('[data-cabinet]').forEach(b => b.onclick = () => navigate(`play/${b.dataset.cabinet}`));
    root.querySelector('[data-passport]').onclick = () => navigate('passport');
    return startAttract(root, profile);
}
