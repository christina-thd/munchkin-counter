import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { levelReport } from '../public/js/shared/report.js';
import { winStory } from '../public/js/shared/win-story.js';

const MIN = 60_000;
/** @returns {import('../public/js/shared/rules.js').Player} */
const player = (id, level, name = id) => ({ id, name, avatar: 'elf', sex: 'male', level, gear: 0 });
const level = (at, id, from, to) => ({ at: at * MIN, kind: 'level', playerId: id, name: id, from, to });
const death = (at, id) => ({ at: at * MIN, kind: 'death', playerId: id, name: id });
const start = { at: 0, kind: 'start' };

/** The story of a game: its log (oldest first), and the players at the end. */
const story = (entries, players) => winStory(levelReport([start, ...entries], players), players, () => 0);

/** a leads, b follows; a wins at `wonAt` minutes with b at `b` */
const game = (wonAt, b) => story(
  [level(5, 'a', 1, 6), level(10, 'b', 1, b), level(wonAt, 'a', 6, 10)],
  [player('a', 10), player('b', b)],
);

describe('winStory', () => {
  test('a comeback: the winner was 3+ levels behind at some point', () => {
    const s = story(
      [level(10, 'b', 1, 5), level(20, 'a', 1, 2), level(60, 'a', 2, 10)],
      [player('a', 10), player('b', 5)],
    );
    assert.equal(s.kind, 'comeback');
    assert.match(s.line, /4 levels/);
  });

  test('a blowout, a marathon, or nothing special', () => {
    assert.equal(game(45, 4).kind, 'blowout');
    assert.equal(game(170, 7).kind, 'marathon');
    assert.equal(game(90, 7).kind, 'plain');
  });

  test('the facts: how long and how many deaths', () => {
    const s = story(
      [death(5, 'b'), level(6, 'a', 1, 6), level(10, 'b', 1, 7), level(90, 'a', 6, 10)],
      [player('a', 10), player('b', 7)],
    );
    assert.deepEqual([s.time, s.deaths], ['1 h 30 min', '1 death']);
  });

  test('without the log, a general line and no facts; names are HTML-escaped', () => {
    const s = winStory(null, [player('a', 10)], () => 0);
    assert.deepEqual([s.kind, s.time, s.deaths], ['plain', null, null]);
    const comeback = story([level(10, 'b', 1, 5), level(60, 'a', 1, 10)],
      [player('a', 10, '<img onerror=x>'), player('b', 5)]);
    assert.equal(comeback.kind, 'comeback');
    assert.ok(!comeback.line.includes('<img'));
  });
});
