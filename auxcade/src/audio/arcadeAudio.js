import { readJson, writeJson } from '../utils/storage.js';
import { clamp } from '../utils/random.js';
// Original oscillator score: no recordings, samples, or commercial music.
const melody = [64, 67, 71, 74, 71, 67, 62, 67, 60, 64, 67, 72, 71, 67, 64, 62, 57, 60, 64, 67, 64, 60, 59, 62, 55, 59, 62, 67, 66, 62, 59, 62];
export class ArcadeAudio {
    constructor() { this.settings = { master: .45, music: .35, sfx: .55, spotify: .5, mute: false, ...readJson('auxcade:audio', {}) }; this.spotifyActive = false; this.running = false; this.step = 0; }
    async unlock() {
        try {
            if (!this.context) {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
                this.master = this.context.createGain();
                this.master.connect(this.context.destination);
            }
            await this.context.resume();
            this.apply();
            if (!this.running) {
                this.running = true;
                this.nextNote = this.context.currentTime + .1;
                this.timer = setInterval(() => this.schedule(), 100);
            }
        }
        catch { /* Silent gameplay remains fully functional on unsupported browsers. */ }
    }
    apply() { if (this.master)
        this.master.gain.setTargetAtTime(this.settings.mute || this.spotifyActive ? 0 : clamp(this.settings.master, 0, 1), this.context.currentTime, .03); writeJson('auxcade:audio', this.settings); }
    set(name, value) { this.settings[name] = name === 'mute' ? !!value : clamp(Number(value) || 0, 0, 1); this.apply(); this.onSettingsChange?.(); }
    setSpotify(active) { this.spotifyActive = active; this.apply(); }
    tone(note, duration = .1, volume = .1, type = 'square', when = this.context?.currentTime) {
        if (!this.context || this.context.state !== 'running')
            return;
        const oscillator = this.context.createOscillator(), gain = this.context.createGain();
        oscillator.type = type;
        oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
        gain.gain.setValueAtTime(0, when);
        gain.gain.linearRampToValueAtTime(volume, when + .008);
        gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
        oscillator.connect(gain);
        gain.connect(this.master);
        oscillator.start(when);
        oscillator.stop(when + duration + .02);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    }
    schedule() {
        if (!this.context || this.context.state !== 'running')
            return;
        if (this.nextNote < this.context.currentTime)
            this.nextNote = this.context.currentTime + .05;
        while (this.nextNote < this.context.currentTime + .18) {
            if (!document.hidden && !this.spotifyActive && this.settings.music > 0) {
                this.tone(melody[this.step % 32], .18, this.settings.music * .06, 'triangle', this.nextNote);
                if (this.step % 4 === 0)
                    this.tone([40, 36, 33, 31][Math.floor(this.step / 8) % 4], .38, this.settings.music * .11, 'sine', this.nextNote);
            }
            this.step++;
            this.nextNote += .225;
        }
    }
    sfx(kind = 'click') {
        if (this.spotifyActive)
            return;
        const patterns = { click: [72], collect: [72, 79], good: [67, 72, 79], bad: [45, 40], win: [60, 64, 67, 72, 79], drop: [52, 64], stamp: [60, 72], pause: [60, 55] };
        (patterns[kind] || patterns.click).forEach((note, i) => this.tone(note, .13, this.settings.sfx * .1, 'square', (this.context?.currentTime || 0) + i * .065));
    }
    destroy() { clearInterval(this.timer); this.context?.close(); }
}
