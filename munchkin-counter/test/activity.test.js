import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';
import { describeEntry } from '../public/js/shared/activity.js';
import { MAX_ENTRIES, MERGE_WINDOW_MS, normalizeLog, record } from '../src/game/activity.js';
import { applyAction } from '../src/game/actions.js';
import { createInitialState, currentGame, normalizeState } from '../src/game/state.js';

let state;
let clock;
const act = (action, source) => applyAction(state, { ...action, source }, clock);
const log = () => currentGame(state).log;
const kinds = () => log().map((e) => e.kind);

beforeEach(() => {
  state = createInitialState(0);
  clock = 1_000_000;
});

describe('recording actions', () => {
  test('every player action is logged, with who did it and from which screen', () => {
    const ana = act({ type: 'addPlayer', name: 'Ana' }, 'dashboard');
    act({ type: 'setEmoji', playerId: ana.id, emoji: '🧝' }, 'phone');
    act({ type: 'renamePlayer', playerId: ana.id, name: 'Anna' }, 'phone');
    act({ type: 'setLevel', playerId: ana.id, level: 5 }, 'dashboard');
    act({ type: 'changeGear', playerId: ana.id, delta: 1 }, 'phone');
    act({ type: 'die', playerId: ana.id }, 'phone');
    act({ type: 'removePlayer', playerId: ana.id }, 'dashboard');

    assert.deepEqual(kinds(), ['join', 'emoji', 'rename', 'level', 'gear', 'death', 'remove']);
    assert.deepEqual(log().map((e) => e.source), ['dashboard', 'phone', 'phone', 'dashboard', 'phone', 'phone', 'dashboard']);
    assert.deepEqual(log()[3], { at: clock, source: 'dashboard', kind: 'level', playerId: ana.id, name: 'Anna', emoji: '🧝', from: 1, to: 5 });
    assert.deepEqual([log()[5].from, log()[5].to], [1, 0]);           // death: lost +1 gear
    assert.equal(log()[6].name, 'Anna');                                // removed players still have a name
  });

  test('an unknown source is not trusted', () => {
    act({ type: 'addPlayer', name: 'Ana' }, 'hacker');
    assert.equal(log()[0].source, null);
  });

  test('quick taps in a row become one entry', () => {
    const ana = act({ type: 'addPlayer', name: 'Ana' });
    for (let i = 0; i < 3; i++) { clock += 1000; act({ type: 'changeLevel', playerId: ana.id, delta: 1 }, 'dashboard'); }
    assert.deepEqual(kinds(), ['join', 'level']);
    assert.deepEqual([log()[1].from, log()[1].to], [1, 4]);
  });

  test('taps from another screen, another player, or later are separate entries', () => {
    const ana = act({ type: 'addPlayer', name: 'Ana' });
    const bo = act({ type: 'addPlayer', name: 'Bo' });
    act({ type: 'changeLevel', playerId: ana.id, delta: 1 }, 'dashboard');
    act({ type: 'changeLevel', playerId: ana.id, delta: 1 }, 'phone');
    act({ type: 'changeLevel', playerId: bo.id, delta: 1 }, 'phone');
    clock += MERGE_WINDOW_MS + 1;
    act({ type: 'changeLevel', playerId: bo.id, delta: 1 }, 'phone');
    assert.equal(kinds().filter((k) => k === 'level').length, 4);
  });

  test('going up and then back down shows both changes', () => {
    const ana = act({ type: 'addPlayer', name: 'Ana' });
    act({ type: 'changeLevel', playerId: ana.id, delta: 1 }, 'phone');
    act({ type: 'changeLevel', playerId: ana.id, delta: -1 }, 'phone');
    act({ type: 'changeGear', playerId: ana.id, delta: 1 }, 'dashboard');
    act({ type: 'changeGear', playerId: ana.id, delta: 1 }, 'dashboard');
    act({ type: 'changeGear', playerId: ana.id, delta: -1 }, 'dashboard');
    const changes = log().filter((e) => e.kind !== 'join').map((e) => `${e.kind} ${e.from}→${e.to}`);
    assert.deepEqual(changes, ['level 1→2', 'level 2→1', 'gear 0→2', 'gear 2→1']);
  });

  test('a change that changes nothing leaves no entry', () => {
    const ana = act({ type: 'addPlayer', name: 'Ana' });
    act({ type: 'changeLevel', playerId: ana.id, delta: -1 }, 'phone');   // already level 1
    act({ type: 'setLevel', playerId: ana.id, level: 1 }, 'dashboard');
    act({ type: 'renamePlayer', playerId: ana.id, name: 'Ana' }, 'phone');
    assert.deepEqual(kinds(), ['join']);
  });

  test('a new game starts its own log', () => {
    act({ type: 'addPlayer', name: 'Ana' });
    act({ type: 'newGame', name: 'Round 2', keepPlayers: true }, 'dashboard');
    assert.deepEqual(log(), [{ at: clock, source: 'dashboard', kind: 'start', kept: 1 }]);
    assert.equal(state.games[0].log.length, 1);   // the old game keeps its own
  });

  test('keeps only the newest entries', () => {
    const game = { log: [] };
    for (let i = 0; i < MAX_ENTRIES + 20; i++) record(game, { kind: 'join', playerId: String(i) }, { now: i });
    assert.equal(game.log.length, MAX_ENTRIES);
    assert.equal(game.log[0].playerId, '20');
  });
});

describe('saved logs', () => {
  test('games saved before the log existed get an empty one', () => {
    const loaded = normalizeState({ games: [{ id: 'g', players: [] }] }, 0);
    assert.deepEqual(currentGame(loaded).log, []);
  });

  test('invalid entries are dropped, extra fields removed', () => {
    const cleaned = normalizeLog([
      { at: 1, kind: 'level', from: 1, to: 2, name: 'Ana', evil: '<script>' },
      { at: 'x', kind: 'level' },
      { at: 2, kind: 'dance' },
      null,
      { at: 3, kind: 'join', source: 'toaster' },
    ]);
    assert.deepEqual(cleaned, [
      { at: 1, kind: 'level', source: null, name: 'Ana', from: 1, to: 2 },
      { at: 3, kind: 'join', source: null },
    ]);
  });
});

describe('describing entries', () => {
  const ana = { name: 'Ana', emoji: '🧙' };

  test('reads like a sentence', () => {
    const plain = (e) => describeEntry(e).replace(/<[^>]+>/g, '');
    assert.equal(plain({ kind: 'level', ...ana, from: 3, to: 6 }), '🧙 Ana ▲ level 3 → 6');
    assert.equal(plain({ kind: 'level', ...ana, from: 9, to: 10 }), '🧙 Ana ▲ level 9 → 10 👑');
    assert.equal(plain({ kind: 'gear', ...ana, from: 2, to: -1 }), '🧙 Ana ▼ gear +2 → -1');
    assert.equal(plain({ kind: 'death', ...ana, from: 3, to: 0 }), '💀 🧙 Ana died and lost +3 gear');
    assert.equal(plain({ kind: 'rename', ...ana, from: 'Ann', to: 'Ana' }), 'Ann is now called 🧙 Ana');
    assert.equal(plain({ kind: 'start', kept: 4 }), '🎲 Game started with the same 4 players');
  });

  test('names are HTML-escaped', () => {
    assert.ok(!describeEntry({ kind: 'join', name: '<img onerror=alert(1)>', emoji: '🧙' }).includes('<img'));
  });
});
