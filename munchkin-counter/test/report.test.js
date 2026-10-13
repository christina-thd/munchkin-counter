import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { applyAction } from '../src/game/actions.js';
import { createInitialState, currentGame } from '../src/game/state.js';
import { formatElapsed, levelAt, levelReport } from '../public/js/shared/report.js';

const MIN = 60_000;

/** Plays a game through the real actions, so the report reads a real activity log. */
function play(steps) {
  const state = createInitialState(0);
  const ids = {};
  for (const [minute, action] of steps) {
    const at = minute * MIN;
    const playerId = action.player && ids[action.player];
    const result = applyAction(state, { ...action, playerId }, at);
    if (action.type === 'addPlayer') ids[action.name] = result.id;
  }
  const game = currentGame(state);
  return { report: levelReport(game.log, game.players), ids, game };
}

const track = (report, id) => report.tracks.find((t) => t.playerId === id);

describe('levelReport', () => {
  test("every player's levels over the game, a win, and deaths", () => {
    const { report, ids } = play([
      [0, { type: 'addPlayer', name: 'Ana' }],
      [0, { type: 'addPlayer', name: 'Bo' }],
      [5, { type: 'setLevel', player: 'Ana', level: 4 }],
      [10, { type: 'changeLevel', player: 'Bo', delta: 1 }],
      [12, { type: 'die', player: 'Bo' }],
      [20, { type: 'setLevel', player: 'Ana', level: 10 }],
    ]);
    const ana = track(report, ids.Ana);
    assert.deepEqual(ana.points.map((p) => [p.at / MIN, p.level]), [[0, 1], [5, 4], [20, 10]]);
    assert.deepEqual([ana.final, ana.peak], [10, 10]);
    assert.deepEqual(track(report, ids.Bo).deaths, [12 * MIN]);
    assert.deepEqual(report.winner, { playerId: ids.Ana, at: 20 * MIN });
    assert.equal(report.end, 20 * MIN);
    assert.deepEqual(report.tracks.map((t) => t.name), ['Ana', 'Bo']);       // join order: matches the dashboard
  });

  test('players kept from the previous game start at the new game, at level 1', () => {
    const state = createInitialState(0);
    const ana = applyAction(state, { type: 'addPlayer', name: 'Ana' }, 0);
    applyAction(state, { type: 'setLevel', playerId: ana.id, level: 7 }, MIN);
    applyAction(state, { type: 'newGame', name: 'Round 2', keepPlayers: true }, 10 * MIN);
    applyAction(state, { type: 'changeLevel', playerId: ana.id, delta: 1 }, 15 * MIN);
    const game = currentGame(state);
    const report = levelReport(game.log, game.players);
    assert.equal(report.start, 10 * MIN);
    assert.deepEqual(report.tracks[0].points.map((p) => [p.at / MIN, p.level]), [[10, 1], [15, 2]]);
  });

  test('a removed player stops at their removal; nobody is drawn before they joined', () => {
    const { report, ids } = play([
      [0, { type: 'addPlayer', name: 'Ana' }],
      [3, { type: 'addPlayer', name: 'Bo' }],
      [8, { type: 'removePlayer', player: 'Bo' }],
      [9, { type: 'changeLevel', player: 'Ana', delta: 1 }],
    ]);
    const bo = track(report, ids.Bo);
    assert.equal(bo.leftAt, 8 * MIN);
    assert.equal(levelAt(bo, 2 * MIN), null);
    assert.equal(levelAt(bo, 5 * MIN), 1);
    assert.equal(levelAt(bo, 9 * MIN), null);
    assert.equal(levelAt(track(report, ids.Ana), 9 * MIN), 2);
  });

  test('a player nothing happened to is a flat line at their level', () => {
    const report = levelReport([], [{ id: 'a', name: 'Ana', avatar: 'elf', level: 3 }]);
    assert.deepEqual(report.tracks[0].points.map((p) => p.level), [3]);
    assert.equal(report.winner, null);
  });
});

test('formatElapsed', () => {
  assert.equal(formatElapsed(0), 'Start');
  assert.equal(formatElapsed(12 * MIN), '12 min');
  assert.equal(formatElapsed(65 * MIN), '1 h 5 min');
  assert.equal(formatElapsed(120 * MIN), '2 h');
});
