import { accessToken, readToken } from '../auth/tokenManager.js';
import { spotifyRequest } from '../api/spotify.js';
let sdkPromise;
function loadSdk() {
    if (window.Spotify)
        return Promise.resolve();
    if (sdkPromise)
        return sdkPromise;
    sdkPromise = new Promise((resolve, reject) => {
        const timer = setTimeout(() => { sdkPromise = null; reject(new Error('Spotify playback took too long to load.')); }, 15000);
        window.onSpotifyWebPlaybackSDKReady = () => { clearTimeout(timer); resolve(); };
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        script.onerror = () => { clearTimeout(timer); sdkPromise = null; script.remove(); reject(new Error('Spotify playback is unavailable.')); };
        document.head.append(script);
    });
    return sdkPromise;
}
export class SpotifyPlayer {
    constructor(audio, onState, onError) { this.audio = audio; this.onState = onState; this.onError = onError; this.ready = false; this.paused = true; this.deviceId = null; this.audio.onSettingsChange = () => this.setVolume(this.audio.settings.spotify); }
    async initialize() {
        if (this.ready)
            return;
        if (!readToken()?.scope?.includes('streaming'))
            throw new Error('Reconnect with browser playback enabled to listen here.');
        await loadSdk();
        this.player?.disconnect();
        this.player = new window.Spotify.Player({ name: 'Auxcade listening lounge', volume: this.audio.settings.mute ? 0 : this.audio.settings.spotify * this.audio.settings.master, getOAuthToken: callback => accessToken().then(callback).catch(this.onError) });
        for (const event of ['initialization_error', 'authentication_error', 'account_error', 'playback_error'])
            this.player.addListener(event, ({ message }) => { this.audio.setSpotify(false); this.paused = true; this.onError(new Error(event === 'account_error' ? 'Browser playback needs Spotify Premium. The arcade still works.' : message)); });
        this.player.addListener('not_ready', () => { this.ready = false; this.audio.setSpotify(false); this.onError(new Error('Spotify’s playback device is unavailable.')); });
        this.player.addListener('autoplay_failed', () => { this.audio.setSpotify(false); this.onError(new Error('Press Listen again to allow browser playback.')); });
        this.player.addListener('player_state_changed', state => { if (!state)
            return; this.paused = state.paused; this.audio.setSpotify(!state.paused); this.onState(state); });
        await new Promise((resolve, reject) => {
            let settled = false;
            const finish = (error) => { if (settled)
                return; settled = true; clearTimeout(timer); if (error) {
                this.player.disconnect();
                reject(error);
            }
            else
                resolve(); };
            const timer = setTimeout(() => finish(new Error('Spotify could not create a browser player.')), 15000);
            this.player.addListener('ready', ({ device_id }) => { this.deviceId = device_id; this.ready = true; finish(); });
            this.player.connect().then(connected => { if (!connected)
                finish(new Error('This browser cannot start Spotify playback.')); }).catch(finish);
        });
    }
    async play(track) {
        if (!track?.uri)
            throw new Error('This demo record has no Spotify playback. Connect your account to listen.');
        this.audio.setSpotify(true);
        try {
            await this.initialize();
            await this.player.activateElement();
            await spotifyRequest(`/me/player/play?device_id=${encodeURIComponent(this.deviceId)}`, { method: 'PUT', body: JSON.stringify({ uris: [track.uri] }) });
        }
        catch (error) {
            this.audio.setSpotify(false);
            throw error;
        }
    }
    async pause() { if (this.player)
        await this.player.pause().catch(() => { }); this.paused = true; this.audio.setSpotify(false); }
    setVolume(value) { return this.player?.setVolume(this.audio.settings.mute ? 0 : value * this.audio.settings.master).catch(() => { }); }
    async destroy() { await this.pause(); this.player?.disconnect(); this.ready = false; }
}
