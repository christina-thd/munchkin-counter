import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { AVATAR_IDS } from '../public/js/shared/rules.js';
import { createInitialState, currentGame, normalizeState, SCHEMA_VERSION, toView } from '../src/game/state.js';

describe('normalizeState', () => {
  test('missing or garbage data starts a fresh game', () => {
    for (const raw of [null, 'text', 42, {}, { games: [] }]) {
      const state = normalizeState(raw, 0);
      assert.equal(state.games.length, 1);
      assert.equal(currentGame(state).name, 'Game 1');
    }
  });

  test('migrates the original single-game format', () => {
    const state = normalizeState({ players: [{ id: 'a', name: 'Ana', emoji: '🧙', level: 3, bonus: 2 }] }, 0);
    assert.equal(state.schema, SCHEMA_VERSION);
    assert.deepEqual(currentGame(state).players, [{ id: 'a', name: 'Ana', avatar: 'wizard', sex: 'male', level: 3, gear: 2 }]);
  });

  test('a game saved with a shared avatar: the first player keeps it, the next gets a free one', () => {
    const raw = { games: [
      { id: 'g', players: [{ id: 'a', emoji: '🐸' }, { id: 'b', emoji: '🐙' }, { id: 'c', avatar: 'elf' }] },
      { id: 'h', players: [{ id: 'd', avatar: 'slime' }] },                // other games are separate
    ] };
    const state = normalizeState(raw, 0);
    const avatars = state.games[0].players.map((p) => p.avatar);
    assert.equal(avatars[0], 'slime');                                     // both emojis meant the slime
    assert.equal(avatars[1], 'dwarf');                                     // the first one nobody had
    assert.equal(avatars[2], 'elf');
    assert.equal(new Set(avatars).size, 3);
    assert.equal(state.games[1].players[0].avatar, 'slime');
  });

  test('players saved before 2.8.0 get the avatar closest to their emoji; a saved avatar is kept', () => {
    const raw = { games: [{ id: 'g', players: [
      { id: 'a', emoji: '🧝' }, { id: 'b', emoji: '💀' }, { id: 'c', emoji: '🐼' }, { id: 'd', avatar: 'mimic' },
      { id: 'e', avatar: 'unicorn' },
    ] }] };
    assert.deepEqual(currentGame(normalizeState(raw, 0)).players.map((p) => p.avatar),
      ['elf', 'skeleton', AVATAR_IDS[2], 'mimic', AVATAR_IDS[4]]);     // no match: one by position
    assert.ok(currentGame(normalizeState(raw, 0)).players.every((p) => !('emoji' in p)));
  });

  test('players saved before 2.8.0 become male; a saved sex is kept, an invalid one is repaired', () => {
    const raw = { games: [{ id: 'g', players: [
      { id: 'a', name: 'Ana' },
      { id: 'b', name: 'Bo', sex: 'female' },
      { id: 'c', name: 'Cy', sex: 'robot' },
    ] }] };
    assert.deepEqual(currentGame(normalizeState(raw, 0)).players.map((p) => p.sex), ['male', 'female', 'male']);
  });

  test('migrates schema 1 (current, bonus, lastDeath.id)', () => {
    const raw = {
      current: 'g2',
      games: [
        { id: 'g1', name: 'Old', createdAt: 1, players: [] },
        { id: 'g2', name: 'New', createdAt: 2, players: [{ id: 'a', name: 'Ana', emoji: '🧙', level: 4, bonus: -1 }],
          lastDeath: { id: 'a', at: 99 } },
      ],
    };
    const state = normalizeState(raw, 0);
    assert.equal(state.currentGameId, 'g2');
    assert.equal(currentGame(state).players[0].gear, -1);
    assert.deepEqual(currentGame(state).lastDeath, { playerId: 'a', at: 99 });
  });

  test('repairs out-of-range values and a missing current game', () => {
    const raw = { currentGameId: 'gone', games: [{ id: 'g', players: [{ id: 'a', level: 99, gear: 'x' }] }] };
    const state = normalizeState(raw, 0);
    assert.equal(state.currentGameId, 'g');
    const [player] = currentGame(state).players;
    assert.equal(player.level, 10);
    assert.equal(player.gear, 0);
    assert.equal(player.name, 'Player 1');
  });
});

describe('toView', () => {
  test('sends the current game in full and a summary of every game', () => {
    const state = createInitialState(5);
    currentGame(state).players.push(
      { id: 'a', name: 'Ana', avatar: 'wizard', sex: 'male', level: 3, gear: 0 },
      { id: 'b', name: 'Bo', avatar: 'elf', sex: 'female', level: 6, gear: 1 },
    );
    const view = toView(state, '9.9.9');
    assert.equal(view.version, '9.9.9');
    assert.equal(view.players.length, 2);
    assert.deepEqual(view.games[0], {
      id: state.currentGameId, name: 'Game 1', createdAt: 5, playerCount: 2,
    });
  });
});
