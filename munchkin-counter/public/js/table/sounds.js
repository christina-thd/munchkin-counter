// Sound effects, synthesized with the Web Audio API; level 9 uses the music's recorded piano and drum
// (public/audio/instruments), with a synthesized version until they've loaded.
// Browsers only allow audio after the page has been touched, so the context is unlocked
// on the first tap or key press.
import { storage } from '../shared/storage.js';
import { decodeAudio } from '../shared/tv.js';
import { noteFrequency } from './tunes.js';

const SETTING_KEY = 'munchkinSound';

/** Sound for each newsworthy announcer situation. */
export const NEWS_SOUNDS = Object.freeze({
  win: 'fanfare',
  death: 'trombone',
  nine: 'dramatic',
  cursed: 'spooky',
  stuck: 'crickets',
});

/** Sound when any player's level goes up or down (if no news sound plays). */
export const LEVEL_SOUNDS = Object.freeze({ up: 'levelUp', down: 'levelDown' });

/** Sound when someone's sex changes (♂ ↔ ♀). */
export const SEX_SOUND = 'sexChange';

/** Shown on the #sounds test page. */
export const SOUND_TEST = Object.freeze([
  ['fanfare', '👑 Someone wins (level 10)'],
  ['trombone', '💀 Someone died'],
  ['dramatic', '⚠️ Level 9: about to win'],
  ['crickets', 'Stuck at level 1'],
  ['spooky', 'Cursed (negative gear)'],
  ['levelUp', '⬆️ Someone gained a level'],
  ['levelDown', '⬇️ Someone lost a level'],
  ['sexChange', '♂/♀ Someone changed sex'],
]);

/** Recorded notes the effects use: folder and notes, as for the music (js/table/music.js). */
const SAMPLES = {
  piano: { folder: 'acoustic_grand_piano', notes: 'Eb2 Eb3 Gb3 A3' },
  drum: { folder: 'taiko_drum', notes: 'C3' },
};

// Each sound gets a synth with:
//   note(freq, at, length, wave, volume, slideTo?, vibrato? { rate, depth })
//   noise(at, length, { type, f, fTo, q, vol })   filtered noise burst
//   sample(instrument, freq, at, length, volume)   a recorded note (false if it hasn't loaded)
const LIBRARY = {
  // 💀 sad trombone: wah wah wah wahhh
  trombone({ note }) {
    [392, 370, 349].forEach((f, i) => note(f, i * 0.38, 0.36, 'sawtooth', 0.12));
    note(330, 1.14, 1.1, 'sawtooth', 0.12, 300);
  },
  // 👑 fanfare
  fanfare({ note }) {
    [523, 659, 784].forEach((f, i) => note(f, i * 0.13, 0.18, 'square', 0.1));
    [523, 659, 784, 1047].forEach((f) => note(f, 0.45, 1.1, 'triangle', 0.12));
  },
  // ⚠️ level 9: dun… dun… DUNNN. Deep piano octaves with a taiko hit, twice, then a dark, tense chord
  // (D, F, A♭: diminished) under a big drum hit, left to ring. Synthesized until the recordings are in.
  dramatic({ note, noise, sample }) {
    const [d2, d3, f3, ab3] = ['D2', 'D3', 'F3', 'Ab3'].map(noteFrequency);
    if (sample('piano', d2, 0, 0.32, 0.9)) {
      sample('piano', d3, 0, 0.32, 0.6);
      sample('drum', 110, 0, 0.6, 0.8);
      for (const f of [d2, d3]) sample('piano', f, 0.38, 0.32, f === d2 ? 0.9 : 0.6);
      sample('drum', 110, 0.38, 0.6, 0.8);
      for (const f of [d2, d3, f3, ab3]) sample('piano', f, 0.76, 2.6, f === d2 ? 0.95 : 0.7);
      sample('drum', 82, 0.76, 1.6, 1);
      sample('drum', 98, 0.84, 1.2, 0.5);
      return;
    }
    for (const at of [0, 0.32]) {
      note(196, at, 0.24, 'sawtooth', 0.13);
      note(98, at, 0.24, 'sawtooth', 0.1);
    }
    note(155.6, 0.66, 1.5, 'sawtooth', 0.15, 146.8, { rate: 5, depth: 3 });
    note(77.8, 0.66, 1.5, 'sawtooth', 0.12);
    noise(0.66, 0.5, { type: 'lowpass', f: 180, vol: 0.5 });
  },
  // stuck at level 1: crickets…
  crickets({ note }) {
    for (const start of [0, 0.55, 1.1]) {
      for (let i = 0; i < 3; i++) note(4400, start + i * 0.05, 0.03, 'sine', 0.07);
    }
  },
  // cursed: ghostly wail
  spooky({ note }) {
    note(330, 0, 1.4, 'sine', 0.14, 262, { rate: 6, depth: 14 });
    note(262, 0.25, 1.3, 'sine', 0.1, 196, { rate: 5, depth: 10 });
  },
  // quick power-up arpeggio
  levelUp({ note }) {
    [523, 659, 784].forEach((f, i) => note(f, i * 0.07, 0.1, 'square', 0.07));
    note(1047, 0.21, 0.3, 'square', 0.07);
  },
  // ♂/♀ a Change Sex curse: a simple swoop, up and back down, like a quick swap
  sexChange({ note }) {
    note(330, 0, 0.22, 'sine', 0.16, 880);
    note(880, 0.2, 0.26, 'sine', 0.14, 440);
  },
  // falling "bwoop"
  levelDown({ note }) {
    note(523, 0, 0.15, 'square', 0.07, 440);
    note(392, 0.14, 0.35, 'square', 0.07, 247);
  },
  // confirmation when sound is switched on
  beep({ note }) {
    note(880, 0, 0.18, 'triangle', 0.2);
  },
};

export class Soundboard {
  #ctx = null;
  #noiseBuffer = null;
  /** @type {Record<string, { freq: number, buffer: AudioBuffer }[]> | null} */
  #samples = null;
  #enabled = storage.get(SETTING_KEY) !== 'off';

  constructor() {
    const unlock = () => this.unlock();
    addEventListener('pointerdown', unlock);
    addEventListener('keydown', unlock);
  }

  get enabled() {
    return this.#enabled;
  }

  set enabled(on) {
    this.#enabled = on;
    storage.set(SETTING_KEY, on ? 'on' : 'off');
  }

  unlock() {
    try {
      // older Safari only has the webkit-prefixed name
      const AudioContextClass = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
      this.#ctx ??= new AudioContextClass();
      if (this.#ctx.state === 'suspended') this.#ctx.resume();
      if (!this.#samples) this.#loadSamples();
    } catch {
      // no Web Audio: stay silent
    }
  }

  /** Loads the recorded notes; each instrument is used once all its notes are in. */
  #loadSamples() {
    this.#samples = {};
    for (const [name, { folder, notes }] of Object.entries(SAMPLES)) {
      Promise.all(notes.split(' ').map(async (note) => {
        const response = await fetch(`audio/instruments/${folder}/${note}.mp3`);
        if (!response.ok) throw new Error(`${folder}/${note}: ${response.status}`);
        return { freq: noteFrequency(note), buffer: await decodeAudio(this.#ctx, await response.arrayBuffer()) };
      }))
        .then((list) => { this.#samples[name] = list; })
        .catch(() => { /* the synthesized sound plays instead */ });
    }
  }

  /** Plays a recorded note (the nearest one, faster or slower); false if its instrument isn't loaded. */
  #sample = (instrument, freq, at, length, volume) => {
    const list = this.#samples?.[instrument];
    if (!list) return false;
    const ctx = this.#ctx;
    const t = ctx.currentTime + at;
    const near = list.reduce((best, s) => (Math.abs(Math.log(s.freq / freq)) < Math.abs(Math.log(best.freq / freq)) ? s : best));
    const source = ctx.createBufferSource();
    source.buffer = near.buffer;
    source.playbackRate.value = freq / near.freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.5, t);
    gain.gain.setValueAtTime(volume * 0.5, t + Math.max(0, length - 0.2));
    gain.gain.linearRampToValueAtTime(0, t + length);
    source.connect(gain).connect(ctx.destination);
    source.start(t);
    source.stop(t + length + 0.05);
    return true;
  };

  /**
   * Plays a sound if sound is on and audio is unlocked. `force` ignores the on/off setting
   * (for the sound test). Returns whether it played.
   */
  play(name, { force = false } = {}) {
    if ((!this.#enabled && !force) || this.#ctx?.state !== 'running' || !LIBRARY[name]) return false;
    try {
      LIBRARY[name]({ note: this.#note, noise: this.#noise, sample: this.#sample });
      return true;
    } catch {
      return false;
    }
  }

  #note = (freq, at, length, wave = 'triangle', volume = 0.25, slideTo = null, vibrato = null) => {
    const ctx = this.#ctx;
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + length);
    if (vibrato) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = vibrato.rate;
      depth.gain.value = vibrato.depth;
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + length + 0.05);
    }
    this.#envelope(gain, t, length, volume, 0.02);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + length + 0.05);
  };

  #noise = (at, length, { type = 'bandpass', f = 1000, fTo = null, q = 1, vol = 0.2 } = {}) => {
    const ctx = this.#ctx;
    if (!this.#noiseBuffer) {
      this.#noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = this.#noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const t = ctx.currentTime + at;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = this.#noiseBuffer;
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(f, t);
    if (fTo) filter.frequency.exponentialRampToValueAtTime(fTo, t + length);
    this.#envelope(gain, t, length, vol, 0.01);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(t);
    source.stop(t + length + 0.05);
  };

  #envelope(gain, t, length, volume, attack) {
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  }
}
