import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { LevelWatcher, LineDeck, SexWatcher, situations, SituationTracker } from '../public/js/table/announcer.js';

/** @returns {import('../public/js/shared/rules.js').Player} */
const player = (id, level = 1, gear = 0) => ({ id, name: id, avatar: 'wizard', sex: 'male', level, gear });
const categories = (list) => list.map((s) => s.category);
const spoken = (list) => categories(list.filter((s) => s.lines.length));

describe('situations', () => {
  test('everyone at level 1 is the start of the game', () => {
    assert.deepEqual(categories(situations([player('a'), player('b')])), ['start']);
  });

  test('a mid game with one leader has table talk and status', () => {
    assert.deepEqual(categories(situations([player('a', 3), player('b', 2)])), ['flavor', 'status']);
  });

  test('level 9, stuck at 1 and cursed are news; stuck and cursed only make a sound', () => {
    const list = situations([player('a', 9, 9), player('b', 2), player('c', 1, -1)]);
    assert.deepEqual(categories(list), ['nine', 'stuck', 'cursed', 'flavor', 'status']);
    assert.deepEqual(spoken(list), ['nine', 'flavor', 'status']);
    assert.deepEqual(list.find((s) => s.category === 'stuck').ids, ['c']);
  });

  test('no gear talk when everyone is well equipped', () => {
    assert.deepEqual(spoken(situations([player('a', 4, 20), player('b', 3, 15)])), ['flavor', 'status']);
  });

  test('one player with suspiciously much more gear than anyone else gets a remark', () => {
    const list = situations([player('a', 4, 3), player('b', 3, 12)]);
    assert.ok(spoken(list).includes('hoard'));
    assert.deepEqual(list.find((s) => s.category === 'hoard').ids, ['b']);
    assert.ok(!categories(situations([player('a', 4, 9), player('b', 3, 3)])).includes('hoard'));   // under 10
    // way more than everybody else, not just the most: 20 against 14 is a well-equipped table
    assert.ok(!categories(situations([player('a', 4, 20), player('b', 3, 14)])).includes('hoard'));
    assert.ok(categories(situations([player('a', 4, 12), player('b', 3, 5), player('c', 2, 6)])).includes('hoard'));
  });

  test('several level with each other at the top: only table talk', () => {
    assert.deepEqual(spoken(situations([player('a', 5), player('b', 5), player('c', 3)])), ['flavor']);
    assert.deepEqual(spoken(situations([player('a', 8), player('b', 8)])), ['flavor']);
    const nine = situations([player('a', 9), player('b', 9)]);
    assert.deepEqual([categories(nine), spoken(nine)], [['nine', 'flavor'], ['flavor']]);   // still news, for its sound
  });

  test('a runaway leader', () => {
    assert.ok(categories(situations([player('a', 7), player('b', 3)])).includes('runaway'));
  });

  test('a win or an active death is pinned and alone', () => {
    const win = situations([player('a', 10), player('b', 1)]);
    assert.deepEqual([categories(win), win[0].pinned], [['win'], true]);

    const death = situations([player('a', 5), player('b', 3)], { playerId: 'b', at: 42 });
    assert.deepEqual([categories(death), death[0].ids], [['death'], ['42']]);
  });

  test('names are HTML-escaped', () => {
    const [s] = situations([{ ...player('x', 10), name: '<img onerror=alert(1)>' }]);
    assert.ok(s.lines.every((line) => !line.includes('<img onerror')));   // the avatar's own <img> is fine
  });
});

describe('LineDeck', () => {
  test('never repeats a line until all of them were used', () => {
    const deck = new LineDeck();
    const lines = ['a', 'b', 'c', 'd', 'e'];
    const first = Array.from(lines, () => deck.draw('x', lines));
    assert.deepEqual([...first].sort(), lines);
    const second = Array.from(lines, () => deck.draw('x', lines));
    assert.deepEqual([...second].sort(), lines);
  });
});

describe('SituationTracker', () => {
  const news = (tracker, players, gameId = 'g') => categories(tracker.update(gameId, situations(players)));

  test('the first update (page load) is never news', () => {
    assert.deepEqual(news(new SituationTracker(), [player('a', 9), player('b', 1)]), []);
  });

  test('someone new in a situation is news; someone leaving is not', () => {
    const tracker = new SituationTracker();
    news(tracker, [player('a', 4), player('b', 1), player('c', 2)]);            // b already stuck
    assert.deepEqual(news(tracker, [player('a', 4), player('b', 1), player('c', 1)]), ['stuck']);   // c joins
    assert.deepEqual(news(tracker, [player('a', 4), player('b', 2), player('c', 1)]), []);          // b leaves
    assert.deepEqual(news(tracker, [player('a', 9), player('b', 2), player('c', 1)]), ['nine']);
  });

  test('the most important news comes first', () => {
    const tracker = new SituationTracker();
    news(tracker, [player('a', 8), player('b', 2)]);
    assert.deepEqual(news(tracker, [player('a', 9), player('b', 1, -1)]), ['nine', 'cursed', 'stuck']);
  });

  test('switching games is not news', () => {
    const tracker = new SituationTracker();
    news(tracker, [player('a', 2)], 'g1');
    assert.deepEqual(news(tracker, [player('x', 9), player('y', 1)], 'g2'), []);
  });

  test('situations hidden behind a pinned death are remembered', () => {
    const tracker = new SituationTracker();
    const table = [player('a', 5), player('b', 1)];
    tracker.update('g', situations(table));
    tracker.update('g', situations(table, { playerId: 'a', at: 1 }));      // death pinned
    assert.deepEqual(categories(tracker.update('g', situations(table))), []);   // pin ends: nothing new
  });
});

describe('LevelWatcher', () => {
  test('reports up, down or nothing, ignoring new players and game switches', () => {
    const watcher = new LevelWatcher();
    assert.equal(watcher.update('g', [player('a', 1)]), null);
    assert.equal(watcher.update('g', [player('a', 2)]), 'up');
    assert.equal(watcher.update('g', [player('a', 1)]), 'down');
    assert.equal(watcher.update('g', [player('a', 1), player('b', 5)]), null);
    assert.equal(watcher.update('other', [player('a', 7)]), null);
  });
});

describe('SexWatcher', () => {
  test('notices a change of sex, ignoring the first update, new players and game switches', () => {
    const watcher = new SexWatcher();
    const as = (sex) => ({ ...player('a'), sex });
    assert.equal(watcher.update('g', [as('male')]), false);
    assert.equal(watcher.update('g', [as('female')]), true);
    assert.equal(watcher.update('g', [as('female')]), false);
    assert.equal(watcher.update('g', [as('female'), { ...player('b'), sex: 'male' }]), false);
    assert.equal(watcher.update('other', [as('male')]), false);
  });
});
