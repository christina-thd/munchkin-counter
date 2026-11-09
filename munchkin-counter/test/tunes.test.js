import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  chordFrequencies, formOf, noteFrequency, sectionBars, sectionSeconds, TUNES, variantBars,
} from '../public/js/table/tunes.js';

const notesOf = (bars) => bars.map((bar) => bar.notes.map((n) => `${n.beats}:${n.freq?.toFixed(1)}`).join(',')).join('|');

describe('tunes', () => {
  test('every tune has sections A B C D of 8 bars, a chord for each, and every bar adds up', () => {
    for (const tune of TUNES) {
      for (const name of ['A', 'B', 'C', 'D']) {
        assert.ok(tune[name], `${tune.name}: no section ${name}`);
        const bars = sectionBars(tune[name]);
        assert.equal(bars.length, 8, `${tune.name} ${name}`);
        bars.forEach((bar, i) => {
          assert.ok(bar.chord, `${tune.name} ${name} bar ${i + 1}: no chord`);
          chordFrequencies(bar.chord);                     // a chord it can play
          const beats = bar.notes.reduce((sum, n) => sum + n.beats, 0);
          assert.equal(beats, tune.beats, `${tune.name} ${name} bar ${i + 1}`);
        });
      }
    }
  });

  test('every tune lasts about 3 minutes, and Torchlight Fading (the start page\'s) about 5', () => {
    for (const tune of TUNES) {
      const seconds = formOf(tune).length * sectionSeconds(tune);
      const [low, high] = tune.name === 'Torchlight Fading' ? [280, 320] : [165, 200];
      assert.ok(seconds >= low && seconds <= high, `${tune.name}: ${Math.round(seconds)} s`);
      assert.equal(formOf(tune).at(-1)[0], 'A', `${tune.name} ends on its main tune`);
    }
  });

  test('nothing plays the same way twice: every section and variation in a tune is different', () => {
    for (const tune of TUNES) {
      const played = formOf(tune).map((name) => notesOf(variantBars(tune, name)));
      assert.equal(new Set(played).size, played.length, tune.name);
    }
  });

  test('variations keep every bar\'s beats and its chord', () => {
    for (const tune of TUNES) {
      for (const name of formOf(tune)) {
        const bars = variantBars(tune, name);
        const original = sectionBars(tune[name[0]]);
        bars.forEach((bar, i) => {
          assert.equal(bar.chord, original[i].chord);
          assert.equal(bar.notes.reduce((sum, n) => sum + n.beats, 0), tune.beats, `${tune.name} ${name} bar ${i + 1}`);
        });
      }
    }
  });

  test('notes and chords become the right frequencies', () => {
    assert.equal(noteFrequency('A4'), 440);
    assert.equal(Math.round(noteFrequency('C4') * 100) / 100, 261.63);
    assert.equal(Math.round(noteFrequency('F#5')), 740);
    assert.deepEqual(chordFrequencies('Am').map(Math.round), [220, 262, 330]);
  });
});
