import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { LevelWatcher, LineDeck, situations, SituationTracker } from '../public/js/table/announcer.js';

const player = (id, level = 1, gear = 0) => ({ id, name: id, emoji: '🧙', level, gear });
const categories = (list) => list.map((s) => s.category);

describe('situations', () => {
  test('everyone at level 1 is the start of the game', () => {
    assert.deepEqual(categories(situations([player('a'), player('b')])), ['start']);
  });

  test('a close mid game has table talk and status', () => {
    assert.deepEqual(categories(situations([player('a', 3), player('b', 2)])), ['flavor', 'status']);
  });

  test('detects level 9, stuck at 1, far behind, loaded and cursed', () => {
    const list = situations([player('a', 9, 9), player('b', 2), player('c', 1, -1)]);
    assert.deepEqual(categories(list), ['nine', 'stuck', 'behind', 'loaded', 'cursed', 'status']);
    assert.deepEqual(list.find((s) => s.category === 'stuck').ids, ['c']);
  });

  test('a tie at the top', () => {
    assert.ok(categories(situations([player('a', 5), player('b', 5), player('c', 3)])).includes('tie'));
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
    assert.ok(s.lines.every((line) => !line.includes('<img')));
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
