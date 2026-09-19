import {registerAgentTools} from './ui/agentTools.js';
import { CONFIG } from './config.js';
import { createDemoProfile } from './demo/demoProfile.js';
import { buildSpotifyProfile } from './profile/profileBuilder.js';
import { applyArtworkFallbacks, enrichDemoArtwork } from './profile/artwork.js';
import { connectSpotify, handleSpotifyCallback, disconnectSpotify } from './auth/spotifyAuth.js';
import { readToken } from './auth/tokenManager.js';
import { ArcadeAudio } from './audio/arcadeAudio.js';
import { SpotifyPlayer } from './audio/spotifyPlayer.js';
import { Progression } from './progression/progression.js';
import { readJson, writeJson, removeItem } from './utils/storage.js';
import { escapeHtml, number, artwork, spotifyLink, attachImageFallback } from './utils/dom.js';
import { notify, achievementPopup, dialog } from './ui/notifications.js';
import { CABINETS } from './ui/cabinets.js';
import { renderLobby } from './ui/lobby.js';
import { renderPassport } from './ui/passport.js';
import { renderSettings } from './ui/settings.js';
import { GameSession } from './ui/gameSession.js';
import { startAttract } from './ui/attract.js';
const app = document.querySelector('#app');
attachImageFallback(document.body);
const audio = new ArcadeAudio();
let profile = null, progress = null, session = null, cleanup = null, lastTrack = null, loading = null, currentRoute = 'lobby', playbackState = null;
const player = new SpotifyPlayer(audio, state => { playbackState = state; updatePlayer(); }, error => { notify(error.message, 'error'); updatePlayer(); });
const logo = '<span class="brand-stripes" aria-hidden="true"><i></i><i></i><i></i></span><span>AUXCADE</span>';
function teardown() { cleanup?.(); cleanup = null; session?.destroy(); session = null; }
function navigate(route, force = false) { if (location.hash === `#${route}` || force) {
    currentRoute = route;
    renderRoute();
}
else
    location.hash = route; }
function requestNavigation(route) {
    if (session?.started && !session.ended) {
        session.pause();
        notify('Finish or leave your current run before switching panels.');
        return;
    }
    navigate(route);
}
function updateCounters() {
    if (!progress)
        return;
    app.querySelectorAll('[data-coins]').forEach(e => e.textContent = number(progress.data.coins));
    app.querySelectorAll('[data-tickets]').forEach(e => e.textContent = number(progress.data.tickets));
    app.querySelectorAll('[data-level]').forEach(e => { if (e.closest('.topbar'))
        e.textContent = `LVL ${String(progress.level).padStart(2, '0')}`; });
}
function selectTrack(track) { lastTrack = track; progress?.touchTrack(track); updatePlayer(); }
function updatePlayer() {
    const bar = app.querySelector('#player-bar');
    if (!bar)
        return;
    const actual = playbackState && !playbackState.paused ? playbackState.track_window?.current_track : null;
    const track = actual ? { name: actual.name, artistName: actual.artists.map(a => a.name).join(', '), image: actual.album?.images?.[0]?.url, url: `https://open.spotify.com/track/${actual.id}`, uri: actual.uri } : lastTrack;
    bar.innerHTML = `<div class="now-playing">${track ? artwork(track) : '<span class="player-disc" aria-hidden="true">◎</span>'}<div><span class="eyebrow">${actual ? 'PLAYING ON SPOTIFY' : track ? 'ON YOUR RADAR' : 'AUXCADE ORIGINAL SOUNDTRACK'}</span><strong>${escapeHtml(track?.name || 'After-hours at the arcade')}</strong><small>${escapeHtml(track?.artistName || 'Original synth loop · No Spotify required')}</small></div></div><div class="player-center">${profile?.source === 'spotify' && track ? `${spotifyLink(track, 'Spotify ↗')}<button class="button small" data-listen ${session?.started && !session?.ended ? 'disabled' : ''}>${actual ? 'Ⅱ Pause' : '▶ Listen'}</button>` : '<span class="audio-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="player-caption">ORIGINAL ARCADE AUDIO</span>'}</div><div class="player-right"><button class="text-button" data-mute>${audio.settings.mute ? '◌ Sound off' : '◖ Sound on'}</button><button class="icon-button" data-audio-settings aria-label="Audio settings">☷</button></div>`;
    bar.querySelector('[data-mute]').onclick = () => { audio.set('mute', !audio.settings.mute); audio.unlock(); updatePlayer(); };
    bar.querySelector('[data-audio-settings]').onclick = () => requestNavigation('settings');
    bar.querySelector('[data-listen]')?.addEventListener('click', async () => {
        if (session?.started && !session.ended)
            return;
        const button = bar.querySelector('[data-listen]');
        button.disabled = true;
        try {
            if (!player.paused)
                await player.pause();
            else
                await player.play(lastTrack);
        }
        catch (error) {
            notify(error.message, 'error');
        }
        finally {
            updatePlayer();
        }
    });
}
function shell() {
    app.innerHTML = `<header class="topbar"><button class="brand" data-home aria-label="Auxcade arcade home">${logo}</button><nav aria-label="Main navigation"><button data-route="lobby">Arcade</button><button data-route="passport">Passport</button><button data-route="settings">Settings</button></nav><div class="header-player"><span class="source-pill">${profile.source === 'demo' ? 'DEMO PLAYER' : 'SPOTIFY CONNECTED'}</span><span class="wallet"><b>◉</b><span data-coins>${number(progress.data.coins)}</span></span><span class="wallet"><b>▥</b><span data-tickets>${number(progress.data.tickets)}</span></span><button class="player-badge" data-profile><span class="avatar">${escapeHtml(profile.user.name.slice(0, 1))}</span><span data-level>LVL ${String(progress.level).padStart(2, '0')}</span></button></div></header><main id="main" tabindex="-1"></main><footer id="player-bar" class="player-bar"></footer><div class="desktop-advice">Best with a keyboard and a little room to play.</div>`;
    app.querySelector('[data-home]').onclick = () => requestNavigation('lobby');
    app.querySelector('[data-profile]').onclick = () => requestNavigation('passport');
    app.querySelectorAll('[data-route]').forEach(b => b.onclick = () => {
        if (session?.started && !session.ended) {
            session.pause();
            notify('Finish or leave your current run before switching panels.');
        }
        else
            navigate(b.dataset.route);
    });
    updatePlayer();
}
function services() { return { profile, progress, audio, player, navigate, onTrack: selectTrack, onConnect: showConnection, onDisconnect: disconnect, onRefresh: () => bootSpotify(true), onAudioChange: updatePlayer }; }
function renderRoute() {
    if (!profile)
        return;
    teardown();
    const route = location.hash.slice(1) || 'lobby';
    currentRoute = route;
    app.querySelectorAll('[data-route]').forEach(b => { b.classList.toggle('active', b.dataset.route === route); if (b.dataset.route === route)
        b.setAttribute('aria-current', 'page');
    else
        b.removeAttribute('aria-current'); });
    const main = app.querySelector('#main');
    if (!main) {
        shell();
        return renderRoute();
    }
    if (route.startsWith('play/')) {
        const cabinet = CABINETS.find(c => c.id === route.split('/')[1]);
        if (cabinet)
            session = new GameSession(cabinet, main, services());
        else
            navigate('lobby');
    }
    else if (route === 'passport')
        renderPassport(main, services());
    else if (route === 'settings')
        renderSettings(main, services());
    else
        cleanup = renderLobby(main, services());
    updatePlayer();
    window.scrollTo({ top: 0, behavior: 'instant' });
}
function activate(nextProfile) {
    profile = applyArtworkFallbacks(nextProfile);
    progress = new Progression(profile.user.id, updateCounters, achievement => { achievementPopup(achievement); audio.sfx('win'); });
    lastTrack = null;
    playbackState = null;
    document.documentElement.dataset.theme = progress.data.theme;
    writeJson('auxcade:mode', profile.source, true);
    shell();
    renderRoute();
    for (const warning of profile.warnings)
        notify(warning);
}
function loadingScreen(label = 'CALIBRATING THE ARCADE') {
    teardown();
    app.innerHTML = `<main id="main" class="boot-screen"><div class="boot-cabinet"><span class="eyebrow">AUXCADE / SYSTEM BOOT</span><h1>Your music.<br>Loading potential.</h1><div class="boot-terminal"><p>✓ AUDIO SYSTEM READY</p><p>✓ SEVEN CABINETS STANDING BY</p><p data-boot-label>${label}</p><div class="meter"><i data-boot-progress style="width:5%"></i></div><small data-boot-percent>5%</small></div><button class="button" data-cancel>Play demo instead</button></div></main>`;
    app.querySelector('[data-cancel]').onclick = () => { loading?.abort(); loading = null; startDemo(); };
}
function bootProgress(label, value) { const node = app.querySelector('[data-boot-label]'); if (node) {
    node.textContent = label;
    app.querySelector('[data-boot-progress]').style.width = value + '%';
    app.querySelector('[data-boot-percent]').textContent = value + '%';
} }
async function bootSpotify(force = false) {
    loading?.abort();
    loading = new AbortController();
    const controller = loading;
    loadingScreen('CONNECTING TO SPOTIFY');
    try {
        const next = await buildSpotifyProfile(bootProgress, controller.signal, force);
        if (!controller.signal.aborted) {
            loading = null;
            activate(next);
        }
    }
    catch (error) {
        if (!controller.signal.aborted) {
            loading = null;
            showIntro(error.message);
        }
    }
}
async function startDemo() {
    loading?.abort();
    loading = new AbortController();
    const controller = loading;
    audio.unlock();
    await player.pause();
    loadingScreen();
    const artworkPromise = enrichDemoArtwork(createDemoProfile(), controller.signal);
    const steps = [['LOADING THE DEMO COLLECTION', 25], ['FETCHING ARTIST ARTWORK', 60], ['CALIBRATING ALL SEVEN CABINETS', 85], ['PLAYER PROFILE READY', 100]];
    for (const [label, value] of steps) {
        if (controller.signal.aborted)
            return;
        bootProgress(label, value);
        await new Promise(resolve => setTimeout(resolve, 180));
    }
    if (controller.signal.aborted)
        return;
    const demoProfile = await artworkPromise;
    if (controller.signal.aborted)
        return;
    loading = null;
    location.hash = 'lobby';
    activate(demoProfile);
}
function showConnection() {
    if (!CONFIG.spotifyClientId) {
        dialog('Spotify is not configured yet.', '<p>The site owner still needs to add the public Spotify Client ID. Visitors never need to enter a developer credential.</p><p>Demo Mode remains fully playable.</p>', [{ label: 'Play demo', primary: true, action: close => { close(); startDemo(); } }]);
        return;
    }
    connectSpotify(CONFIG.spotifyClientId, CONFIG.spotifyPlayback)
        .catch(error => showIntro(error.message));
}
async function disconnect() { progress?.forget(); await player.destroy(); disconnectSpotify(); removeItem('auxcade:mode', true); profile = null; progress = null; lastTrack = null; playbackState = null; location.hash = ''; showIntro(); }
function showIntro(error = '') {
    teardown();
    profile = null;
    app.innerHTML = `<header class="intro-top"><a class="brand" href="#">${logo}</a><span class="eyebrow">PERSONAL MUSIC / SEVEN WAYS TO PLAY</span><span class="intro-version">EST. 2026 · VOL. 01</span></header><main id="main" class="intro"><div class="intro-copy"><span class="eyebrow"><i class="live-dot"></i> SEVEN GAMES. YOUR ROTATION.</span><h1>YOUR TASTE.<br>YOUR<br><em>HIGH SCORE.</em></h1><p>Games powered by your listening.<br>Welcome to your new favorite arcade.</p>${error ? `<p class="inline-error" role="alert">${escapeHtml(error)}</p>` : ''}<div class="intro-buttons"><button class="button primary big" data-demo>Play demo <span>↗</span></button><button class="button spotify-button big" data-connect>Connect Spotify <span>↗</span></button></div><small class="intro-caption">No quarters required. Just questionable amounts of good music.</small></div><div class="intro-machine"><div class="machine-marquee"><strong>TRACK ATTACK</strong><span>RECOVER YOUR ROTATION</span></div><div class="machine-display"><canvas data-preview="track" aria-hidden="true"></canvas><div class="attract-caption"><span class="eyebrow">READY, PLAYER ONE?</span><strong>INSERT YOUR<br>LISTENING HABITS.</strong></div></div><div class="machine-controls"><span class="eyebrow">PERSONAL MUSIC SYSTEM</span><span class="machine-free">FREE PLAY</span></div><div class="machine-label"><span>AUXCADE ORIGINAL</span><span>AC–001 / STEREO</span></div></div><div class="intro-bottom"><span>A LITTLE LESS SCROLLING.<br>A LITTLE MORE PLAYING.</span><p>Action · Exploration · Comedy · Trivia<br>Strategy · Falling records · Deduction</p><span>BUILT FOR YOUR DESKTOP<br>PLAYABLE WITHOUT SPOTIFY</span></div></main><footer class="intro-footer"><span>© 2026 AUXCADE</span><button class="text-button" data-about>About the demo & privacy</button><span>TURN IT UP. PRESS START.</span></footer>`;
    app.querySelector('[data-demo]').onclick = startDemo;
    app.querySelector('[data-connect]').onclick = showConnection;
    app.querySelector('[data-about]').onclick = () => dialog('A little about Auxcade.', `<p>Auxcade is a collection of seven games built from one music profile. This build includes a temporary demo catalog with fictional rankings. It does not claim to represent Shaurya’s listening.</p><p>Spotify authentication uses PKCE without a client secret. Data stays in this browser, except artist-origin and public demo-artwork lookups sent to Wikidata. Demo images are served by Wikimedia Commons. No Spotify content is sent to AI models.</p><p>Spotify’s general policy prohibits game integrations. This project implements the integration under the project owner’s stated special permission. That permission does not transfer to other deployments.</p>`);
    cleanup = startAttract(app, createDemoProfile());
}
window.addEventListener('hashchange', () => { if (profile)
    renderRoute(); });
window.addEventListener('offline', () => notify('You’re offline. Loaded games still work; music and live lookups may pause.'));
window.addEventListener('unhandledrejection', event => { event.preventDefault(); notify(event.reason?.message || 'Something interrupted the arcade. Please return to the lobby and try again.', 'error'); });
window.addEventListener('pagehide', () => { session?.destroy(); audio.context?.suspend(); });
async function initialize() {
    try {
        const connected = await handleSpotifyCallback();
        if (connected || readToken() && readJson('auxcade:mode', null, true) === 'spotify') {
            await bootSpotify();
            return;
        }
    }
    catch (error) {
        showIntro(error.message);
        return;
    }
    if (readJson('auxcade:mode', null, true) === 'demo') {
        const controller = new AbortController();
        activate(await enrichDemoArtwork(createDemoProfile(), controller.signal));
    }
    else
        showIntro();
}
registerAgentTools({
    getState: () => ({ screen: profile ? currentRoute : 'intro', activeRun: !!(session?.started && !session.ended), cabinets: CABINETS.map(({id,name})=>({id,name})) }),
    openCabinet: async id => {
        if (!profile) throw new Error('Enter Demo Mode or connect Spotify first.');
        if (session?.started && !session.ended) throw new Error('Finish or leave the active run first.');
        const route = `play/${id}`;
        history.replaceState({}, '', `#${route}`);
        renderRoute();
    },
});
document.querySelector('.skip-link').addEventListener('click', event => {event.preventDefault();document.querySelector('#main')?.focus();});
initialize();
