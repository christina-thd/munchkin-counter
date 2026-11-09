// The dashboard's background music: original tunes, written as notes (a few kilobytes instead of audio files).
// js/table/music.js plays them on recorded instruments, arranged by style:
//   tavern    a small Renaissance tavern band: guitar chords and tune, upright bass, drum
//   dungeon   dark and mysterious: slow guitar chords, upright bass, the tune low on the guitar, a distant drum
//   spooky    like dungeon, but the tune sits high and thin, like a music box
//   mystery   intrigue, like a tabletop quest's puzzles: the tavern band with a quieter drum
//   adventure a heroic fantasy campaign (D&D-style): strummed chords, the bass on the strong beats, a marching drum
//   goblin    comic and sneaky, no guitar: a tiptoeing bassoon over an oom-pah of bass and soft piano
//
// Every tune moves at 95–100 beats a minute and lasts about 3 minutes (`seconds` if set: Torchlight Fading, the
// start page's, 5). Each has four sections of 8 bars, A B C D, played in turn (formOf); when a section comes back
// it's a variation of itself (variantBars), never the same notes twice, and the tune ends on its A.
// A section has a chord per bar and a melody: bars separated by "|", notes as pitch/beats ("D5/1.5"), "r/1" a
// rest. Every bar's notes add up to `beats`.

/** @typedef {{ chords: string, melody: string }} Section */
/**
 * @typedef {object} Tune
 * @property {string} name
 * @property {'tavern' | 'dungeon' | 'spooky' | 'mystery' | 'adventure' | 'goblin'} [style]
 * @property {number} tempo
 * @property {3 | 4} beats
 * @property {number} [seconds]   how long it plays (TUNE_SECONDS if not set)
 * @property {Section} A
 * @property {Section} B
 * @property {Section} C
 * @property {Section} D
 */

/** @type {readonly Tune[]} */
export const TUNES = Object.freeze([
  // ----- tavern -----
  {
    name: 'The Quiet Hearth',
    tempo: 96,
    beats: 3,
    A: {
      chords: 'Dm C F C Dm C Am Dm',
      melody: 'A4/2 D5/1 | E5/1.5 D5/0.5 C5/1 | A4/2 F4/1 | G4/3 | A4/1 B4/1 C5/1 | D5/1 E5/1 C5/1 | C5/1 B4/1 A4/1 | D5/3',
    },
    B: {
      chords: 'F C Dm Am F C Am A',
      melody: 'F5/2 E5/1 | E5/1 D5/1 C5/1 | D5/2 A4/1 | C5/3 | A4/1 C5/1 F5/1 | E5/1.5 D5/0.5 C5/1 | A4/1 G4/1 E4/1 | A4/3',
    },
    C: {
      chords: 'F F C C Bb F Gm A',
      melody: 'C5/2 F5/1 | A5/2 F5/1 | E5/2 G5/1 | C5/3 | D5/1 F5/1 D5/1 | C5/2 A4/1 | Bb4/1 D5/1 G5/1 | E5/2 C#5/1',
    },
    D: {
      chords: 'Dm Gm C F Bb Gm A Dm',
      melody: 'F5/1 E5/1 D5/1 | D5/2 Bb4/1 | C5/1 E5/1 G5/1 | F5/2 A4/1 | Bb4/2 D5/1 | G4/1 Bb4/1 D5/1 | C#5/1 E5/1 A4/1 | D5/3',
    },
  },
  {
    name: 'The Lantern Dance',
    tempo: 100,
    beats: 3,
    A: {
      chords: 'Am G Am E Am F E Am',
      melody: 'E5/1 A5/1 E5/1 | D5/1 B4/1 G4/1 | C5/1 B4/1 A4/1 | B4/2 G#4/1 | A4/1 C5/1 E5/1 | F5/1 E5/1 D5/1 | E5/1 D5/1 B4/1 | A4/3',
    },
    B: {
      chords: 'C G Am E F C E Am',
      melody: 'G5/2 E5/1 | D5/2 B4/1 | C5/1 D5/1 E5/1 | E5/3 | A5/1 G5/1 F5/1 | E5/1 D5/1 C5/1 | B4/1 C5/1 B4/1 | A4/3',
    },
    C: {
      chords: 'F C G C F C Dm E',
      melody: 'A4/1 C5/1 F5/1 | E5/2 C5/1 | D5/1 B4/1 G4/1 | C5/3 | F5/1 A5/1 F5/1 | E5/1 G5/1 C5/1 | D5/1 F5/1 A4/1 | B4/2 G#4/1',
    },
    D: {
      chords: 'Am Dm G C F Dm E Am',
      melody: 'C5/1 B4/1 A4/1 | D5/2 F5/1 | B4/1 D5/1 G5/1 | E5/2 C5/1 | A5/2 F5/1 | D5/1 E5/1 F5/1 | E5/1 G#4/1 B4/1 | A4/3',
    },
  },
  {
    name: 'Mist over the Moor',
    tempo: 95,
    beats: 4,
    A: {
      chords: 'Am G F E Am Dm E Am',
      melody: 'E4/1 A4/1 C5/2 | B4/1 A4/1 G4/2 | A4/2 F4/2 | G#4/2 E4/2 | A4/1 B4/1 C5/1 E5/1 | F5/2 D5/2 | B4/2 G#4/1 B4/1 | A4/4',
    },
    B: {
      chords: 'F C G Am F C E Am',
      melody: 'C5/2 F5/2 | E5/2 G4/2 | D5/1 B4/1 G4/2 | A4/2 C5/2 | F5/1 E5/1 D5/1 C5/1 | E5/2 C5/2 | B4/1 G#4/1 E4/2 | A4/4',
    },
    C: {
      chords: 'C G Am Em F C G E',
      melody: 'E5/2 G5/2 | D5/2 B4/2 | C5/1 A4/1 E5/2 | G4/2 B4/2 | A4/1 C5/1 F5/2 | E5/2 C5/2 | D5/1 B4/1 G4/2 | G#4/4',
    },
    D: {
      chords: 'Dm Am E Am Dm F E Am',
      melody: 'F5/2 D5/2 | E5/1 C5/1 A4/2 | B4/2 G#4/2 | A4/1 C5/1 E5/2 | D5/1 F5/1 A5/2 | A5/1 G5/1 F5/2 | E5/2 B4/1 G#4/1 | A4/4',
    },
  },
  {
    name: 'The Wandering Minstrel',
    tempo: 100,
    beats: 3,
    A: {
      chords: 'Dm Am Dm C Dm G Am Dm',
      melody: 'D5/1 F5/1 A5/1 | E5/1 C5/1 A4/1 | F5/1 E5/1 D5/1 | E5/2 C5/1 | A4/1 D5/1 F5/1 | G5/1 B4/1 D5/1 | C5/1 B4/1 A4/1 | D5/3',
    },
    B: {
      chords: 'F C G Dm F C Am Dm',
      melody: 'A5/2 F5/1 | G5/2 E5/1 | D5/1 G5/1 B4/1 | D5/3 | C5/1 F5/1 A5/1 | G5/1 E5/1 C5/1 | E5/1 C5/1 A4/1 | D5/3',
    },
    C: {
      chords: 'Bb F C F Bb F G A',
      melody: 'D5/1 F5/1 Bb5/1 | C5/2 A4/1 | E5/1 G5/1 C5/1 | F5/3 | Bb4/1 D5/1 F5/1 | A4/2 C5/1 | B4/1 D5/1 G5/1 | C#5/2 E5/1',
    },
    D: {
      chords: 'Dm C Bb A Dm Gm A Dm',
      melody: 'A5/1 G5/1 F5/1 | E5/2 G5/1 | F5/1 D5/1 Bb4/1 | A4/3 | D5/1 E5/1 F5/1 | G5/2 Bb4/1 | C#5/1 E5/1 G5/1 | D5/3',
    },
  },

  // ----- dark dungeon -----
  {
    name: 'Deep Below',
    style: 'dungeon',
    tempo: 96,
    beats: 4,
    A: {
      chords: 'Dm Dm Eb Dm Dm Gm A Dm',
      melody: 'A4/3 D5/1 | C5/2 A4/2 | Bb4/2 G4/2 | A4/4 | F5/2 E5/1 D5/1 | D5/2 Bb4/2 | C#5/2 A4/2 | D5/4',
    },
    B: {
      chords: 'Bb Gm Eb A Bb Gm A Dm',
      melody: 'F5/3 D5/1 | G5/2 D5/2 | Eb5/2 Bb4/2 | C#5/4 | D5/2 F5/2 | Bb4/2 D5/1 C5/1 | E5/2 C#5/2 | D5/4',
    },
    C: {
      chords: 'F C Dm Bb F C Eb A',
      melody: 'A4/2 C5/2 | E5/2 G4/2 | F4/2 A4/2 | D5/4 | C5/1 A4/1 F4/2 | G4/2 E4/2 | Eb5/2 Bb4/2 | C#5/4',
    },
    D: {
      chords: 'Dm Eb Dm Gm Dm Eb A Dm',
      melody: 'D5/3 F5/1 | Eb5/2 G4/2 | F4/2 A4/2 | Bb4/4 | A4/1 D5/1 F5/2 | G5/2 Eb5/2 | E5/2 C#5/2 | D5/4',
    },
  },
  {
    name: 'Torchlight Fading',
    style: 'dungeon',
    tempo: 96,
    beats: 3,
    seconds: 300,     // the start page's tune: a long one
    A: {
      chords: 'Am Am F E Am Dm E Am',
      melody: 'E5/2 C5/1 | A4/3 | C5/2 A4/1 | B4/3 | A4/1 C5/1 E5/1 | F5/2 D5/1 | G#4/2 B4/1 | A4/3',
    },
    B: {
      chords: 'F G Am E F Dm E Am',
      melody: 'A5/2 F5/1 | G5/2 D5/1 | E5/2 C5/1 | B4/3 | C5/1 F5/1 A5/1 | F5/2 D5/1 | E5/1 D5/1 B4/1 | A4/3',
    },
    C: {
      chords: 'C C G G Am F E E',
      melody: 'G5/2 E5/1 | C5/3 | D5/2 B4/1 | G4/3 | A4/1 C5/1 E5/1 | F5/2 A4/1 | B4/1 C5/1 D5/1 | E5/3',
    },
    D: {
      chords: 'Am G F E Dm Am E Am',
      melody: 'E5/1 D5/1 C5/1 | D5/1 C5/1 B4/1 | C5/1 B4/1 A4/1 | G#4/3 | F5/2 E5/1 | E5/1 C5/1 A4/1 | B4/2 G#4/1 | A4/3',
    },
  },
  {
    name: 'The Sleeping Wyrm',
    style: 'dungeon',
    tempo: 95,
    beats: 4,
    A: {
      chords: 'Em F Em F Em Am F Em',
      melody: 'B4/4 | C5/2 A4/2 | G4/2 B4/2 | A4/4 | E5/2 D5/1 B4/1 | C5/2 E5/2 | F5/2 C5/2 | E5/4',
    },
    B: {
      chords: 'C Dm Em F C Am F Em',
      melody: 'G5/2 E5/2 | F5/2 D5/2 | E5/2 B4/2 | C5/4 | E5/2 G5/2 | A5/2 E5/2 | F5/2 A5/1 F5/1 | E5/4',
    },
    C: {
      chords: 'Am Em F G Am Em F Em',
      melody: 'C5/2 A4/2 | B4/2 G4/2 | A4/1 C5/1 F5/2 | D5/4 | E5/2 C5/2 | G4/2 B4/2 | A4/2 F4/2 | E4/4',
    },
    D: {
      chords: 'Dm Am Em F Dm Am F Em',
      melody: 'F5/2 D5/2 | E5/2 C5/2 | B4/2 G4/2 | A4/4 | D5/1 F5/1 A5/2 | E5/2 A4/2 | C5/1 A4/1 F4/2 | E4/4',
    },
  },

  // ----- spooky: a creepy little waltz, like a music box left running in a crypt -----
  {
    name: 'Crypt Lullaby',
    style: 'spooky',
    tempo: 96,
    beats: 3,
    A: {
      chords: 'Dm Dm Gm A Dm Bb Edim A',
      melody: 'D5/1 F5/1 A5/1 | G#5/1 A5/1 F5/1 | Bb5/2 G5/1 | E5/1 C#5/1 A4/1 | D5/1 F5/1 E5/1 | D5/1 C#5/1 D5/1 | Bb4/1 G4/1 E4/1 | C#5/2 A4/1',
    },
    B: {
      chords: 'Gm Dm A Dm Bb Gm A Dm',
      melody: 'D5/1 Bb4/1 G4/1 | A4/1 F4/1 D4/1 | E4/1 G4/1 C#5/1 | D5/3 | F5/1 D5/1 Bb4/1 | Bb4/1 D5/1 G5/1 | F5/1 E5/1 C#5/1 | D5/3',
    },
    C: {
      chords: 'Bb Bb F F Gm Gm A A',
      melody: 'F5/2 D5/1 | C#5/1 D5/1 Bb4/1 | A4/2 C5/1 | F5/3 | G5/1 F5/1 D5/1 | Bb4/1 C#5/1 D5/1 | E5/2 G5/1 | C#5/3',
    },
    D: {
      chords: 'Dm Edim Dm A Dm Bb Edim Dm',
      melody: 'A5/2 F5/1 | G5/1 Bb5/1 E5/1 | F5/1 D5/1 A4/1 | G#4/1 A4/1 C#5/1 | D5/2 F5/1 | F5/1 D5/1 Bb4/1 | G4/1 Bb4/1 C#5/1 | D5/3',
    },
  },

  // ----- mystery: intrigue, like a tabletop quest's puzzles (old modes, a rolling guitar, a quiet drum) -----
  {
    name: 'The Riddle Door',
    style: 'mystery',
    tempo: 98,
    beats: 4,
    A: {
      chords: 'Dm C Dm G Dm F C Dm',
      melody: 'D5/1 E5/1 F5/2 | E5/1 G5/1 E5/1 C5/1 | D5/2 A4/2 | B4/2 D5/2 | F5/1 E5/1 D5/1 C5/1 | A4/2 C5/2 | G4/1 C5/1 E5/1 G5/1 | D5/4',
    },
    B: {
      chords: 'Bb C Dm Am Bb C G Dm',
      melody: 'F5/2 D5/2 | E5/2 G5/2 | A5/2 F5/2 | E5/4 | D5/1 F5/1 Bb5/2 | G5/1 E5/1 C5/2 | B4/2 D5/1 G5/1 | D5/4',
    },
    C: {
      chords: 'F C Dm Am Bb F C Dm',
      melody: 'A4/2 C5/2 | E5/1 G5/1 C5/2 | D5/1 F5/1 A5/2 | E5/2 C5/2 | D5/1 Bb4/1 F4/2 | A4/1 C5/1 F5/2 | E5/1 D5/1 C5/1 E5/1 | D5/4',
    },
    D: {
      chords: 'Gm Dm Am Dm Gm C Am Dm',
      melody: 'G4/1 Bb4/1 D5/2 | F5/2 A4/2 | C5/1 E5/1 A5/2 | F5/4 | Bb5/2 G5/2 | E5/1 G5/1 C5/2 | E5/1 C5/1 A4/2 | D5/4',
    },
  },
  {
    name: 'Map of Forgotten Roads',
    style: 'mystery',
    tempo: 100,
    beats: 3,
    A: {
      chords: 'Am D Am Em Am D G Am',
      melody: 'E5/1 A5/1 E5/1 | F#5/2 D5/1 | C5/1 B4/1 A4/1 | G4/2 B4/1 | A4/1 C5/1 E5/1 | F#5/1 A5/1 F#5/1 | G5/1 D5/1 B4/1 | A4/3',
    },
    B: {
      chords: 'C G D Am C G Em Am',
      melody: 'E5/2 G5/1 | D5/2 B4/1 | A4/1 D5/1 F#5/1 | E5/3 | G5/1 E5/1 C5/1 | D5/1 B4/1 G4/1 | B4/2 E5/1 | A4/3',
    },
    C: {
      chords: 'F C G D F C G E',
      melody: 'A4/1 C5/1 F5/1 | E5/2 C5/1 | D5/1 B4/1 G4/1 | F#4/2 A4/1 | C5/1 F5/1 A5/1 | G5/2 E5/1 | D5/1 G5/1 B4/1 | G#4/3',
    },
    D: {
      chords: 'Am Em D Am F G Em Am',
      melody: 'C5/2 E5/1 | B4/2 G4/1 | F#4/1 A4/1 D5/1 | E5/3 | F5/1 C5/1 A4/1 | B4/1 D5/1 G5/1 | E5/1 B4/1 G4/1 | A4/3',
    },
  },

  // ----- adventure: a heroic fantasy campaign (the party sets out): strummed chords, a marching drum -----
  {
    name: 'The Party Assembles',
    style: 'adventure',
    tempo: 100,
    beats: 4,
    A: {
      chords: 'G D Em C G D C D',
      melody: 'G4/1 B4/1 D5/2 | F#5/1 E5/1 D5/2 | E5/1 G5/1 B4/2 | C5/2 E5/2 | D5/1 B4/1 G4/1 B4/1 | A4/2 D5/2 | E5/1 D5/1 C5/1 E5/1 | D5/4',
    },
    B: {
      chords: 'Em C G D Em C D G',
      melody: 'B4/2 E5/2 | G5/2 E5/2 | D5/1 E5/1 D5/1 B4/1 | A4/4 | G4/1 B4/1 E5/2 | E5/1 G5/1 C5/2 | F#5/2 A5/2 | G5/4',
    },
    C: {
      chords: 'C G Am Em C G Am D',
      melody: 'E5/2 G5/2 | D5/2 B4/2 | C5/1 E5/1 A5/2 | G5/2 E5/2 | C5/1 E5/1 G5/2 | B4/2 D5/2 | C5/1 A4/1 E5/2 | F#5/2 D5/2',
    },
    D: {
      chords: 'G Bm C D G Em C G',
      melody: 'D5/2 G5/2 | F#5/2 D5/2 | E5/1 G5/1 E5/1 C5/1 | A4/2 F#4/2 | G4/1 B4/1 D5/2 | E5/2 B4/2 | C5/1 E5/1 G5/1 E5/1 | G4/4',
    },
  },
  {
    name: 'Roll for Initiative',
    style: 'adventure',
    tempo: 100,
    beats: 4,
    A: {
      chords: 'Dm Bb C Dm Dm Bb C A',
      melody: 'D5/1 D5/1 F5/1 A5/1 | Bb4/2 D5/2 | C5/1 E5/1 G5/2 | F5/1 E5/1 D5/2 | A4/1 D5/1 F5/1 D5/1 | F5/2 D5/2 | E5/1 G5/1 E5/1 C5/1 | C#5/4',
    },
    B: {
      chords: 'F C Dm Bb F C A Dm',
      melody: 'A5/2 F5/2 | G5/2 E5/2 | F5/1 E5/1 D5/2 | D5/4 | C5/1 F5/1 A5/2 | G5/1 E5/1 C5/2 | E5/2 C#5/2 | D5/4',
    },
    C: {
      chords: 'Bb Bb C C Gm Gm A A',
      melody: 'F5/2 Bb5/2 | A5/1 G5/1 F5/2 | G5/2 E5/2 | C5/4 | D5/1 G5/1 Bb5/2 | A5/1 G5/1 D5/2 | E5/1 A5/1 C#5/2 | E5/4',
    },
    D: {
      chords: 'Dm C Bb A Dm C A Dm',
      melody: 'D5/1 F5/1 A5/2 | G5/2 E5/2 | F5/1 D5/1 Bb4/2 | A4/4 | F5/1 E5/1 D5/1 F5/1 | E5/1 G5/1 C5/2 | C#5/2 E5/2 | D5/4',
    },
  },

  // ----- goblin: comic and sneaky, a tiptoeing bassoon over an oom-pah of bass and soft piano -----
  {
    name: 'Goblin Footsteps',
    style: 'goblin',
    tempo: 100,
    beats: 4,
    A: {
      chords: 'Am E Am E Am Dm E Am',
      melody: 'A4/0.5 r/0.5 C5/0.5 r/0.5 E5/0.5 r/0.5 A4/1 | G#4/0.5 r/0.5 B4/0.5 r/0.5 E5/2 | A4/0.5 r/0.5 C5/0.5 r/0.5 E5/0.5 r/0.5 A5/1 | G#5/1 E5/1 B4/2 | C5/0.5 B4/0.5 A4/0.5 r/0.5 C5/0.5 B4/0.5 A4/1 | D5/0.5 r/0.5 F5/0.5 r/0.5 A5/2 | G#5/0.5 F5/0.5 E5/0.5 D5/0.5 B4/2 | A4/1 r/1 A4/1 r/1',
    },
    B: {
      chords: 'F C E Am F C E Am',
      melody: 'F4/0.5 r/0.5 A4/0.5 r/0.5 C5/2 | E5/0.5 r/0.5 G5/0.5 r/0.5 C5/2 | B4/0.5 G#4/0.5 E4/0.5 G#4/0.5 B4/2 | A4/2 r/2 | C5/1 A4/1 F4/1 A4/1 | G4/1 C5/1 E5/1 C5/1 | B4/0.5 C5/0.5 B4/0.5 A4/0.5 G#4/2 | A4/1 r/1 E4/1 r/1',
    },
    C: {
      chords: 'C G C G Dm Am E Am',
      melody: 'C5/0.5 r/0.5 E5/0.5 r/0.5 G5/2 | D5/0.5 r/0.5 B4/0.5 r/0.5 G4/2 | E5/0.5 D5/0.5 C5/0.5 r/0.5 E5/0.5 D5/0.5 C5/1 | B4/1 D5/1 G4/2 | F5/0.5 r/0.5 D5/0.5 r/0.5 A4/2 | C5/0.5 B4/0.5 A4/0.5 r/0.5 E5/2 | G#4/0.5 B4/0.5 D5/0.5 B4/0.5 G#4/2 | A4/1 r/1 E4/1 r/1',
    },
    D: {
      chords: 'Am Am Dm Dm F E Am Am',
      melody: 'E5/0.5 r/0.5 E5/0.5 r/0.5 C5/0.5 r/0.5 A4/1 | B4/0.5 C5/0.5 D5/0.5 C5/0.5 B4/2 | D5/0.5 r/0.5 F5/0.5 r/0.5 D5/0.5 r/0.5 A4/1 | F4/1 A4/1 D5/2 | C5/0.5 r/0.5 A4/0.5 r/0.5 F4/2 | G#4/0.5 A4/0.5 B4/0.5 D5/0.5 E5/2 | C5/1 B4/1 A4/2 | A4/1 r/1 A4/1 r/1',
    },
  },
  {
    // slow, heavy and grumpy: stomping low in a minor key
    name: 'Troll Under the Bridge',
    style: 'goblin',
    tempo: 95,
    beats: 4,
    A: {
      chords: 'Gm Gm Cm D Gm Eb D Gm',
      melody: 'G4/1.5 G4/0.5 Bb4/1 G4/1 | D5/2 C5/1 Bb4/1 | C5/1.5 Eb5/0.5 C5/1 G4/1 | F#4/2 D4/2 | G4/1.5 A4/0.5 Bb4/1 C5/1 | Bb4/2 G4/2 | A4/1 F#4/1 D4/1 F#4/1 | G4/4',
    },
    B: {
      chords: 'Eb Bb Cm D Eb Bb D Gm',
      melody: 'Eb5/1.5 D5/0.5 C5/1 Bb4/1 | D5/2 F4/2 | G4/1.5 Ab4/0.5 G4/1 Eb4/1 | D4/4 | G4/1 Bb4/1 Eb5/2 | D5/1.5 C5/0.5 Bb4/2 | A4/1 C5/1 F#4/2 | G4/4',
    },
    C: {
      chords: 'Cm Cm Gm Gm Ab Eb D D',
      melody: 'C5/1.5 C5/0.5 Eb5/1 C5/1 | G4/2 Eb4/2 | D5/1.5 Bb4/0.5 G4/1 Bb4/1 | D5/4 | C5/1.5 Ab4/0.5 Eb4/2 | G4/1 Bb4/1 Eb5/2 | F#4/1 A4/1 C5/1 A4/1 | D4/4',
    },
    D: {
      chords: 'Gm F Eb D Gm Cm D Gm',
      melody: 'G4/1 Bb4/1 D5/1 G5/1 | F5/1.5 C5/0.5 A4/2 | G4/1.5 Eb4/0.5 Bb4/2 | A4/2 F#4/2 | Bb4/1.5 A4/0.5 G4/1 D4/1 | Eb4/1 G4/1 C5/2 | D5/1.5 C5/0.5 A4/1 F#4/1 | G4/4',
    },
  },
]);

// ----- notes and chords -----

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "F#5" → its frequency in Hz. */
export function noteFrequency(name) {
  const [, letter, accidental, octave] = /^([A-G])(#|b)?(\d)$/.exec(name);
  const midi = 12 * (Number(octave) + 1) + NOTE[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
}

/** "F#m", "Edim" → its root, third and fifth around octave 3 (Hz), lowest first. */
export function chordFrequencies(name) {
  const [, root, kind] = /^([A-G][#b]?)(m|dim)?$/.exec(name);
  const low = noteFrequency(`${root}3`);
  const steps = kind === 'dim' ? [0, 3, 6] : kind === 'm' ? [0, 3, 7] : [0, 4, 7];
  return steps.map((semis) => low * 2 ** (semis / 12));
}

/**
 * @typedef {{ beat: number, beats: number, freq: number | null }} Note
 * @typedef {{ chord: string, notes: Note[] }} Bar
 */

/**
 * A section as bars: each { chord, notes: [{ beat, beats, freq | null }] }.
 * @param {Section} section
 * @returns {Bar[]}
 */
export function sectionBars(section) {
  const chords = section.chords.split(' ');
  return section.melody.split('|').map((bar, i) => {
    let beat = 0;
    const notes = bar.trim().split(/\s+/).map((token) => {
      const [pitch, length] = token.split('/');
      const note = { beat, beats: Number(length), freq: pitch === 'r' ? null : noteFrequency(pitch) };
      beat += note.beats;
      return note;
    });
    return { chord: chords[i], notes };
  });
}

// ----- how long a tune plays, and in what order -----

const TUNE_SECONDS = 180;   // how long a tune plays, unless it sets `seconds`
const SECTIONS = ['A', 'B', 'C', 'D'];

/** Seconds one 8-bar section of the tune takes. */
export const sectionSeconds = (tune) => 8 * tune.beats * 60 / tune.tempo;

/**
 * The order a tune's sections are played in, for about its length: A B C D, then again as variations
 * (A1 B1 C1 D1, then A2 …), ending on a variation of A. No name comes twice: no section plays the same way twice.
 * @param {Tune} tune
 * @returns {string[]} e.g. ['A', 'B', 'C', 'D', 'A1', 'B1', 'C1', 'D1', 'A2']
 */
export function formOf(tune) {
  const count = Math.max(5, Math.round((tune.seconds ?? TUNE_SECONDS) / sectionSeconds(tune)));
  const form = [];
  for (let i = 0; form.length < count - 1; i++) {
    const round = Math.floor(i / SECTIONS.length);
    form.push(`${SECTIONS[i % SECTIONS.length]}${round || ''}`);
  }
  form.push(`A${form.filter((name) => name[0] === 'A').length}`);
  return form;
}

// ----- variations: how a section is played when it comes back -----
// Each keeps the harmony (new notes are always tones of the bar's chord) and every bar's beats.

const octaveDistance = (a, b) => Math.abs(Math.log2(a / b));

/** The tone of `chord` nearest to `freq`, in any octave, other than `freq` itself. */
function nearestChordTone(chord, freq) {
  const tones = chordFrequencies(chord).flatMap((t) => [t / 2, t, t * 2, t * 4, t * 8]);
  return tones
    .filter((t) => octaveDistance(t, freq) > 0.02)
    .reduce((best, t) => (octaveDistance(t, freq) < octaveDistance(best, freq) ? t : best));
}

/** Sets each note's beat from the lengths before it. */
function restamp(notes) {
  let beat = 0;
  return notes.map((n) => {
    const note = { ...n, beat };
    beat += n.beats;
    return note;
  });
}

const perBar = (change) => (bars) => bars.map((bar) => ({ ...bar, notes: restamp(change(bar)) }));

/** Long notes (2 beats or more) split in two: the note, then a tone of the chord. */
const ornament = perBar((bar) => bar.notes.flatMap((n) => (n.freq && n.beats >= 2
  ? [{ ...n, beats: n.beats / 2 }, { ...n, beats: n.beats / 2, freq: nearestChordTone(bar.chord, n.freq) }]
  : [n])));

/** Two even beats on a strong beat become long-short (1½ + ½): a lilt. */
const dotted = perBar((bar) => {
  const out = [];
  for (let i = 0; i < bar.notes.length; i++) {
    const [n, next] = [bar.notes[i], bar.notes[i + 1]];
    if (n.freq && next?.freq && n.beats === 1 && next.beats === 1 && n.beat % 2 === 0) {
      out.push({ ...n, beats: 1.5 }, { ...next, beats: 0.5 });
      i += 1;
    } else {
      out.push(n);
    }
  }
  return out;
});

/** The notes inside each bar move to other tones of the chord: the same rhythm, a new line. */
const reshape = perBar((bar) => bar.notes.map((n, i) => (n.freq && i > 0 && i < bar.notes.length - 1
  ? { ...n, freq: nearestChordTone(bar.chord, n.freq) }
  : n)));

/** Busier bars thinned out: the first two notes become one. */
const simpler = perBar((bar) => (bar.notes.length >= 3 && bar.notes[0].freq && bar.notes[1].freq
  ? [{ ...bar.notes[0], beats: bar.notes[0].beats + bar.notes[1].beats }, ...bar.notes.slice(2)]
  : bar.notes));

const VARIATIONS = [ornament, dotted, reshape, simpler, (b) => dotted(ornament(b)), (b) => reshape(ornament(b))];

const signature = (bars) => bars.map((bar) => bar.notes.map((n) => `${n.beats}:${n.freq?.toFixed(1)}`).join(',')).join('|');

/**
 * The bars of a section in the form: "B" as written, "B1", "B2"… each a different variation of it
 * (one that changes nothing, or repeats an earlier one, is skipped).
 * @param {Tune} tune
 * @param {string} name   a section letter, and the variation number if it's one
 * @returns {Bar[]}
 */
export function variantBars(tune, name) {
  const original = sectionBars(tune[name[0]]);
  const wanted = Number(name.slice(1) || 0);
  const seen = new Set([signature(original)]);
  let bars = original;
  for (let n = 1, k = 0; n <= wanted && k < VARIATIONS.length * 2; k++) {
    const candidate = VARIATIONS[k % VARIATIONS.length](k < VARIATIONS.length ? original : bars);
    const sig = signature(candidate);
    if (seen.has(sig)) continue;
    seen.add(sig);
    bars = candidate;
    n += 1;
  }
  return bars;
}
