// Background music: the tunes in js/table/tunes.js, played with the Web Audio API, one after another in shuffled
// order during a game; the start page plays HOME_TUNE.
//
// The instruments are real recordings (public/audio/instruments, FluidR3_GM, CC BY 3.0): a note every three
// semitones over just the range the tunes use, each played a little faster or slower for the notes in between.
// A small, low band: a nylon guitar plays the chords and the tune, a plucked upright bass plays the roots, and a
// low drum marks the bars, with only a touch of room echo; the goblin tunes swap the guitar for a bassoon and a
// piano. Kept out on purpose: long held notes (a cello sounded like a choir or an organ), and anything high,
// bowed or ringing (a fiddle, a tin whistle, a hammered dulcimer).
// Until the recordings have loaded (or if they can't), a modelled plucked string (Karplus-Strong) plays instead;
// not on a TV, whose slow processor plays a lighter version (see IS_TV below).
// Each tune is played in its form (formOf in tunes.js). Open the dashboard with #music to listen to each tune.
import { storage } from '../shared/storage.js';
import { decodeAudio, IS_TV } from '../shared/tv.js';
import { chordFrequencies, formOf, noteFrequency, TUNES, variantBars } from './tunes.js';

export { TUNES };

/** The recorded notes of each instrument (public/audio/instruments/<folder>/<note>.mp3). */
const SAMPLES = {
  guitar: { folder: 'acoustic_guitar_nylon', notes: 'E2 G2 Bb2 Db3 E3 G3 Bb3 Db4 E4 G4 Bb4 Db5', ring: 2.2 },
  drum: { folder: 'taiko_drum', notes: 'C3', ring: 0.8 },
  bass: { folder: 'acoustic_bass', notes: 'Db2 E2 G2 Bb2 Db3 E3', ring: 1.4 },
  piano: { folder: 'acoustic_grand_piano', notes: 'C3 Eb3 Gb3 A3 C4 Eb4 Gb4', ring: 2.6 },
  bassoon: { folder: 'bassoon', notes: 'C3 Eb3 Gb3 A3 C4 Eb4', ring: 0 },
};
const MELODY = 0.5;            // the tavern tunes are written an octave above where the guitar plays them
const DRUM_PITCH = 110;        // the drum recording (a C3) played a little lower: a deep, soft thump
/** The start page plays this one tune, over and over. */
const HOME_TUNE = TUNES.findIndex((t) => t.name === 'Torchlight Fading');
/** @typedef {keyof typeof SAMPLES} Instrument */

const SETTING_KEY = 'munchkinMusic';
const PLAYLIST_KEY = 'munchkinPlaylist';   // the shuffled tunes still to play, kept between sessions
const FADE_IN_S = 3;           // between tunes: the next one fades in…
const FADE_OUT_S = 4;          // …after the last one faded out over its final seconds
const GAP_S = 1.5;             // and a moment of quiet in between
const VOLUME_KEY = 'munchkinMusicVolume';
export const VOLUME_STEPS = 10;    // the volume is a level from 0 (silent) to VOLUME_STEPS (loudest)
const DEFAULT_VOLUME = 6;

/** The volume level this screen last chose, or the default. */
function savedVolume() {
  const saved = storage.get(VOLUME_KEY);
  const level = Number(saved);
  return saved != null && Number.isInteger(level) && level >= 0 && level <= VOLUME_STEPS ? level : DEFAULT_VOLUME;
}
// Notes are scheduled this far ahead, every TICK_MS. A TV's slow processor can be busy for a moment: there the
// notes are queued further ahead, so a busy moment doesn't make the music stumble.
const LOOKAHEAD_S = IS_TV ? 1.5 : 0.6;
const TICK_MS = IS_TV ? 300 : 150;
// The chords are played an octave lower than written, deep and dark. Every part moves by whole octaves only
// (chords and tune down one, the dungeon tune down two): any other shift puts the chords and the tune in
// different keys, which sounds out of tune.
const DEEPER = 0.5;

const LUTE = { brightness: 3.5, maxTone: 1500 };

/**
 * Music doesn't need a quick reaction, so the browser may use a bigger audio buffer ('playback'): on a slow
 * processor (a TV) that's what stops crackles and gaps. Browsers that don't take options get the default.
 */
function newContext(AudioContextClass) {
  try {
    return new AudioContextClass({ latencyHint: 'playback' });
  } catch {
    return new AudioContextClass();
  }
}

export class Music {
  #enabled = storage.get(SETTING_KEY) !== 'off';
  /** @type {'home' | 'game' | null} */
  #mode = null;               // what's on screen: the start page (one tune) or a game (the shuffle); null: neither
  #ctx = null;
  #master = null;
  #bus = null;
  #timer = null;
  #strings = new Map();       // frequency → a modelled plucked string, made once (until the recordings load)
  /** @type {Partial<Record<Instrument, { freq: number, buffer: AudioBuffer }[]>>} */
  #samples = {};
  #out = null;                // the current tune's own volume, for its fades: { wet, dry } gain nodes
  #fadeIn = false;            // the next tune fades in (not the first after music is switched on: that's instant)
  #lastTune = null;           // the name of the tune played last
  #skipHome = false;          // "next song" on the start page: one tune from the shuffle instead of HOME_TUNE
  #audition = null;           // the tune index listened to on the #music test page
  #song = null;               // { tune, form, bars: { A, B, … }, part, bar }
  #nextBar = 0;
  #sounding = new Set();      // notes scheduled or playing: cut off when the music stops or switches

  constructor() {
    const unlock = () => this.#unlock();
    addEventListener('pointerdown', unlock);
    addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', () => this.#update());
  }

  #level = savedVolume();

  /** The music's volume, 0 (silent) to VOLUME_STEPS; remembered on this screen. It changes at once. */
  get volume() {
    return this.#level;
  }

  set volume(level) {
    this.#level = Math.min(VOLUME_STEPS, Math.max(0, Math.round(level)));
    storage.set(VOLUME_KEY, String(this.#level));
    if (this.#timer) {
      const t = this.#ctx.currentTime;
      this.#master.gain.cancelScheduledValues(t);
      this.#master.gain.setTargetAtTime(this.#gain(), t, 0.05);
    }
  }

  /** The master volume for the level: 0.6 at the default level, 1 at the top. */
  #gain() {
    return this.#level / VOLUME_STEPS;
  }

  get enabled() {
    return this.#enabled;
  }

  set enabled(on) {
    this.#enabled = on;
    storage.set(SETTING_KEY, on ? 'on' : 'off');
    this.#update();
  }

  /**
   * What to play (while music is on): 'home' on the start page, HOME_TUNE over and over; 'game' on the dashboard,
   * every tune shuffled. Opening a game doesn't interrupt (the tune playing carries on, then the shuffle);
   * coming back to the start page goes straight to HOME_TUNE, unless it's the one playing.
   * @param {'home' | 'game'} mode
   */
  play(mode) {
    if (mode === this.#mode) return;
    this.#mode = mode;
    const homeTuneOn = this.#song?.tune === TUNES[HOME_TUNE];
    if (mode === 'home' && this.#timer && !homeTuneOn) this.#stop();
    this.#update();
  }

  pause() {
    this.#mode = null;
    this.#update();
  }

  /**
   * Plays one tune from its start, over and over, even with music off (the #music test page); null goes back to normal.
   * @param {number | null} index  in TUNES
   */
  audition(index) {
    this.#audition = index;
    if (this.#timer) this.#stop();
    this.#unlock();
    this.#update();
  }

  /** Quieter for a moment, so a sound effect stands out. */
  duck() {
    if (!this.#timer) return;
    const gain = this.#master.gain;
    const t = this.#ctx.currentTime;
    gain.cancelScheduledValues(t);
    gain.setTargetAtTime(this.#gain() * 0.3, t, 0.08);
    gain.setTargetAtTime(this.#gain(), t + 2.2, 0.6);
  }

  // ----- starting and stopping -----

  #unlock() {
    try {
      // older Safari only has the webkit-prefixed name
      const AudioContextClass = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
      if (!this.#ctx) this.#setUp(newContext(AudioContextClass));
      if (this.#ctx.state === 'suspended') this.#ctx.resume();
    } catch {
      return;                 // no Web Audio: no music
    }
    this.#update();
  }

  #update() {
    const wanted = this.#audition != null || (this.#enabled && this.#mode != null);
    const play = wanted && !document.hidden && this.#ctx?.state === 'running';
    if (play && !this.#timer) this.#start();
    else if (!play && this.#timer) this.#stop();
  }

  // no fading: switching the music on or off is instant
  #start() {
    const t = this.#ctx.currentTime;
    this.#master.gain.cancelScheduledValues(t);
    this.#master.gain.setValueAtTime(this.#gain(), t);
    this.#song = null;
    this.#fadeIn = false;
    this.#nextBar = t + 0.15;
    this.#timer = setInterval(() => this.#schedule(), TICK_MS);
    this.#schedule();
  }

  #stop() {
    clearInterval(this.#timer);
    this.#timer = null;
    const t = this.#ctx.currentTime;
    this.#master.gain.cancelScheduledValues(t);
    this.#master.gain.setValueAtTime(0, t);
    this.#cutNotes(t);
  }

  // notes are scheduled up to LOOKAHEAD_S ahead: cut them all, or they'd play into whatever starts next
  #cutNotes(t) {
    for (const source of this.#sounding) {
      try {
        source.stop(t);
      } catch {
        // not started yet in some browsers' eyes: nothing to stop
      }
    }
    this.#sounding.clear();
  }

  /** The tune playing now (its name), or null. */
  get current() {
    return this.#timer ? this.#song?.tune.name ?? null : null;
  }

  /**
   * Skips to the next tune of the shuffle at once (it fades in), also on the start page. Nothing happens while
   * the music is off.
   */
  next() {
    if (!this.#timer) return;
    this.#cutNotes(this.#ctx.currentTime);
    this.#song = null;
    this.#skipHome = true;
    this.#fadeIn = true;
    this.#nextBar = this.#ctx.currentTime + 0.1;
    this.#schedule();
  }

  /** Starts a note's source at `t`, remembering it until it ends so #stop can cut it off. */
  #startSource(source, t, end = null) {
    this.#sounding.add(source);
    source.onended = () => this.#sounding.delete(source);
    source.start(t);
    if (end != null) source.stop(end);
  }

  // master volume ← dry + small-room reverb ← every instrument (no reverb on a TV: it's the heaviest part to work
  // out all the time, and barely heard)
  #setUp(ctx) {
    this.#ctx = ctx;
    this.#master = ctx.createGain();
    this.#master.gain.value = 0;
    this.#master.connect(ctx.destination);
    this.#bus = ctx.createGain();
    this.#bus.connect(this.#master);
    if (!IS_TV) {
      const reverb = ctx.createConvolver();
      reverb.buffer = this.#roomImpulse(1.1);          // a small room, barely there: echo blurs the notes
      const wet = ctx.createGain();
      wet.gain.value = 0.1;
      this.#bus.connect(reverb).connect(wet).connect(this.#master);
    }
    this.#loadSamples();
  }

  /** Loads every instrument's recorded notes; each instrument is used as soon as all its notes are in. */
  #loadSamples() {
    for (const [name, { folder, notes }] of Object.entries(SAMPLES)) {
      Promise.all(notes.split(' ').map(async (note) => {
        const response = await fetch(`audio/instruments/${folder}/${note}.mp3`);
        if (!response.ok) throw new Error(`${folder}/${note}: ${response.status}`);
        const buffer = await decodeAudio(this.#ctx, await response.arrayBuffer());
        return { freq: noteFrequency(note), buffer };
      }))
        .then((list) => { this.#samples[name] = list; })
        .catch((err) => console.warn('Music: using the modelled string instead of', name, err.message));
    }
  }

  #roomImpulse(seconds) {
    const ctx = this.#ctx;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 4;
    }
    return buffer;
  }

  // ----- playing the tunes -----

  #schedule() {
    while (this.#nextBar < this.#ctx.currentTime + LOOKAHEAD_S) {
      if (!this.#song) this.#beginSong(this.#nextBar);
      const song = this.#song;
      const beat = 60 / song.tune.tempo;
      this.#playBar(song, this.#nextBar, beat);
      this.#nextBar += song.tune.beats * beat;
      song.bar += 1;
      if (song.bar === 8) {
        song.bar = 0;
        song.part += 1;
        if (song.part === song.form.length) {
          this.#song = null;
          this.#nextBar += GAP_S;
        }
      }
    }
  }

  /**
   * Starts the next tune at `t`, through its own volume: it fades in (unless it's the first since the music
   * started) and fades out over its last seconds, so tunes never cut into each other.
   */
  #beginSong(t) {
    const song = this.#nextSong();
    const length = song.form.length * 8 * song.tune.beats * (60 / song.tune.tempo);
    const end = t + length;
    const fade = (target) => {
      const gain = this.#ctx.createGain();
      gain.gain.setValueAtTime(this.#fadeIn ? 0 : 1, t);
      if (this.#fadeIn) gain.gain.linearRampToValueAtTime(1, t + FADE_IN_S);
      gain.gain.setValueAtTime(1, end - FADE_OUT_S);
      gain.gain.linearRampToValueAtTime(0, end);
      gain.connect(target);
      return gain;
    };
    this.#out = { wet: fade(this.#bus), dry: fade(this.#master) };
    this.#fadeIn = true;
    this.#song = song;
    this.#lastTune = song.tune.name;
  }

  /** The tune listened to on the test page, the start page's tune, or the next of the shuffled playlist. */
  #nextSong() {
    const home = this.#mode === 'home' && !this.#skipHome;
    this.#skipHome = false;
    const index = this.#audition ?? (home ? HOME_TUNE : this.#nextFromPlaylist());
    const tune = TUNES[index];
    const form = formOf(tune);
    const bars = Object.fromEntries(form.map((name) => [name, variantBars(tune, name)]));
    return { tune, form, bars, part: 0, bar: 0 };
  }

  /**
   * Every tune once, in random order, then a new random order; kept on this screen between sessions, so a new
   * session goes on where the last one stopped instead of starting over. A new order never starts with the tune
   * that just played.
   */
  #nextFromPlaylist() {
    const names = TUNES.map((t) => t.name);
    let playlist = [];
    try {
      playlist = JSON.parse(storage.get(PLAYLIST_KEY) ?? '[]').filter((name) => names.includes(name));
    } catch {
      // nothing saved, or something unreadable: a new order
    }
    if (!playlist.length) {
      playlist = [...names].sort(() => Math.random() - 0.5);
      if (playlist.length > 1 && playlist[0] === this.#lastTune) playlist.push(playlist.shift());
    }
    const next = playlist.shift();
    storage.set(PLAYLIST_KEY, JSON.stringify(playlist));
    return names.indexOf(next);
  }

  #playBar(song, start, beat) {
    const { tune } = song;
    const name = song.form[song.part];        // "B", or "B1", "B2"… for its variations
    const section = name[0];
    const { chord, notes } = song.bars[name][song.bar];
    const [root, third, fifth] = chordFrequencies(chord).map((f) => f * DEEPER);
    const lastPart = song.part === song.form.length - 1;

    const barLength = tune.beats * beat;
    if (tune.style === 'dungeon' || tune.style === 'spooky') {
      this.#dungeonBar(song, start, beat, { root, third, fifth, notes, section });
      return;
    }
    if (tune.style === 'adventure') {
      this.#adventureBar(song, start, beat, { root, third, fifth, notes, lastPart });
      return;
    }
    if (tune.style === 'goblin') {
      this.#goblinBar(song, start, beat, { root, third, fifth, notes });
      return;
    }

    // guitar: the chord's root, then its notes in gentle eighths (the very last bar: one slow strum)
    if (lastPart && song.bar === 7) {
      [root, fifth, root * 2, third * 2].forEach((f, i) => this.#note('guitar', start + i * 0.07, f, barLength, 0.5));
    } else {
      const pattern = tune.beats === 3
        ? [root, fifth, root * 2, third * 2, root * 2, fifth]
        : [root, fifth, root * 2, third * 2, fifth * 2, third * 2, root * 2, fifth];
      pattern.forEach((f, i) => this.#note('guitar', start + i * beat / 2, f, beat, i === 0 ? 0.55 : 0.3));
    }

    // bass and drum, once the band has joined in: the upright bass on every bar's root (as in the dungeon
    // tunes), and a soft low beat on each bar's first beat (and its middle, in 4/4)
    if (song.part > 0) {
      this.#bass(start, root, barLength, section === 'A' ? 0.55 : 0.65);
      if (tune.style === 'mystery') {
        // mystery: a quieter drum, every other bar only
        if (song.bar % 2 === 0) this.#note('drum', start, DRUM_PITCH * 0.9, beat, 0.35);
      } else {
        this.#note('drum', start, DRUM_PITCH, beat, 0.5);
        if (tune.beats === 4) this.#note('drum', start + 2 * beat, DRUM_PITCH, beat, 0.3);
      }
    }

    // melody, an octave down, on the guitar (softer the first time, alone)
    for (const note of notes) {
      if (!note.freq) continue;
      this.#note('guitar', start + note.beat * beat, note.freq * MELODY, note.beats * beat, song.part === 0 ? 0.5 : 0.6);
    }
  }

  /**
   * Heroic adventure (a D&D-style campaign): the guitar strums the whole chord on every beat (harder on the
   * first), the bass on the strong beats, a marching drum (every beat, the first one loudest) and the tune
   * bold in the middle. The first A is the guitar alone, quieter: the party gathering before setting out.
   */
  #adventureBar(song, start, beat, { root, third, fifth, notes, lastPart }) {
    const { tune } = song;
    const band = song.part > 0;
    const strum = (t, volume) => [root, fifth, root * 2, third * 2].forEach((f, i) => {
      this.#note('guitar', t + i * 0.018, f, beat, volume);        // low to high, a quick strum
    });
    for (let b = 0; b < tune.beats; b++) strum(start + b * beat, (b === 0 ? 0.32 : 0.2) * (band ? 1 : 0.7));
    if (band) {
      const strong = tune.beats === 4 ? [0, 2] : [0];
      for (const b of strong) this.#bass(start + b * beat, b === 0 ? root : fifth, beat * 2, 0.6);
      for (let b = 0; b < tune.beats; b++) this.#note('drum', start + b * beat, DRUM_PITCH, beat, b === 0 ? 0.5 : 0.22);
    }
    for (const note of notes) {
      if (!note.freq) continue;
      this.#note('guitar', start + note.beat * beat, note.freq * MELODY, note.beats * beat, band ? 0.7 : 0.55);
      // the last time through, doubled an octave down: the whole party joins in
      if (lastPart) this.#note('guitar', start + note.beat * beat, note.freq * MELODY / 2, note.beats * beat, 0.35);
    }
  }

  /**
   * Goblin (no guitar): a tiptoeing bassoon, short detached notes, over an oom-pah (oom-pah-pah in 3/4): the bass
   * on the strong beats and a soft piano chord on the others, with a light drum tap once it gets going.
   */
  #goblinBar(song, start, beat, { root, third, fifth, notes }) {
    const { tune } = song;
    for (let b = 0; b < tune.beats; b++) {
      const t = start + b * beat;
      const oom = b === 0 || (tune.beats === 4 && b === 2);
      if (oom) this.#bass(t, b === 0 ? root : fifth, beat * 0.8, 0.6);
      else [root * 2, third * 2, fifth * 2].forEach((f) => this.#note('piano', t, f, beat * 0.4, 0.13));
    }
    if (song.part > 0) this.#note('drum', start, DRUM_PITCH * 1.2, beat, 0.22);

    for (const note of notes) {
      if (!note.freq) continue;
      this.#note('bassoon', start + note.beat * beat, note.freq * MELODY, note.beats * beat * 0.6, 0.55);
    }
  }

  /**
   * Dark dungeon: few notes and lots of space. A slow low guitar (one chord note a beat), a deep plucked bass
   * root, the tune two octaves down on the guitar from the first bar (softer the first time, before the bass
   * comes in), and a distant drum every other bar. The C and D sections of a long tune lift the tune an octave,
   * for some contrast. A spooky tune plays its tune an octave up all the way: high and thin, like a music box.
   */
  #dungeonBar(song, start, beat, { root, third, fifth, notes, section }) {
    const { tune } = song;
    // guitar: the root deep down, then the chord slowly, one note a beat
    [root, fifth, third * 2, fifth * 2].slice(0, tune.beats).forEach((f, i) => {
      this.#note('guitar', start + i * beat, f, beat, i === 0 ? 0.45 : 0.2);
    });
    if (song.part > 0) this.#bass(start, root, beat, section === 'A' ? 0.5 : 0.65);
    if (song.bar % 2 === 0) this.#note('drum', start, DRUM_PITCH * 0.8, beat, song.part > 0 ? 0.42 : 0.28);

    const octave = tune.style === 'spooky' || section === 'C' || section === 'D' ? 0.5 : 0.25;
    for (const note of notes) {
      if (!note.freq) continue;
      this.#note('guitar', start + note.beat * beat, note.freq * octave, note.beats * beat, song.part === 0 ? 0.45 : 0.6);
    }
  }

  // ----- instruments: a recorded note, or the modelled string until the recordings are in -----

  /**
   * A bass note on the plucked upright bass, kept out of the reverb (in a room's echo, bass turns into a high,
   * ringing smear). Until its recordings are in: the guitar's lowest notes with their bright overtones filtered off.
   */
  #bass(t, f, length, volume) {
    if (this.#samples.bass) this.#note('bass', t, f, length, volume * 1.4, { tone: 900, dry: true });
    else this.#note('guitar', t, f, length, volume, { tone: f * 2.5, dry: true });
  }

  /**
   * @param {Instrument} instrument
   * @param {number} length  seconds the note lasts; plucked instruments ring on after it, the others stop
   * @param {{ tone?: number, dry?: boolean }} [options]  tone: a low-pass filter (Hz); dry: no reverb
   */
  #note(instrument, t, f, length, volume, options = {}) {
    const { tone = 0, dry = false } = options;
    const samples = this.#samples[instrument];
    if (!samples) {
      // the modelled string is worked out note by note, too much for a TV: it waits for the recordings
      if (instrument === 'guitar' && !IS_TV) this.#pluck(t, f, volume * 0.45);
      return;
    }
    // the recording closest in pitch, played faster or slower to reach this one
    const sample = samples.reduce((best, s) => (Math.abs(Math.log(s.freq / f)) < Math.abs(Math.log(best.freq / f)) ? s : best));
    const ctx = this.#ctx;
    const source = ctx.createBufferSource();
    source.buffer = sample.buffer;
    source.playbackRate.value = f / sample.freq;
    const ring = SAMPLES[instrument].ring;
    const end = t + (ring ? Math.max(length, ring) : length + 0.08);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.setValueAtTime(volume, Math.max(t, end - 0.25));
    gain.gain.linearRampToValueAtTime(0, end);
    let out = source.connect(gain);
    if (tone) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = tone;
      out = out.connect(filter);
    }
    out.connect(dry ? this.#out.dry : this.#out.wet);         // through the tune's own volume, for its fades
    this.#startSource(source, t, end + 0.02);
  }

  // ----- the plucked string -----

  /** Karplus-Strong: a noise burst in a delay line, softened each pass, rendered once per pitch. */
  #stringBuffer(f) {
    const key = Math.round(f * 10);
    let buffer = this.#strings.get(key);
    if (buffer) return buffer;
    const ctx = this.#ctx;
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * 3);
    buffer = ctx.createBuffer(1, length, rate);
    const out = buffer.getChannelData(0);
    const period = rate / f;
    const n = Math.max(2, Math.floor(period));
    const frac = period - n;               // the delay's fraction of a sample keeps the pitch in tune
    const line = new Float32Array(n + 2);
    let prev = 0;
    for (let i = 0; i < line.length; i++) {
      prev = prev * 0.55 + (Math.random() * 2 - 1) * 0.45;   // a softened burst: a fingertip, not a pick
      line[i] = prev;
    }
    const damping = 0.997 - Math.min(0.006, f / 200000);    // high strings fade sooner
    let read = 0;
    for (let i = 0; i < length; i++) {
      const a = line[read % line.length];
      const b = line[(read + 1) % line.length];
      const sample = a + (b - a) * frac;
      out[i] = sample;
      line[(read + n) % line.length] = damping * 0.5 * (sample + b);
      read += 1;
    }
    this.#strings.set(key, buffer);
    return buffer;
  }

  /** A plucked lute string: softened (low-passed) so it sounds closer to the nylon guitar it stands in for. */
  #pluck(t, f, volume) {
    const ctx = this.#ctx;
    const source = ctx.createBufferSource();
    source.buffer = this.#stringBuffer(f);
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = Math.min(LUTE.maxTone, f * LUTE.brightness);
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(tone).connect(gain).connect(this.#out.wet);
    this.#startSource(source, t);
  }
}
