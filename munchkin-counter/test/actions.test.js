import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';
import { ActionError, applyAction } from '../src/game/actions.js';
import { createInitialState, currentGame } from '../src/game/state.js';
import { AVATAR_IDS, MAX_LEVEL } from '../public/js/shared/rules.js';

let state;
const act = (action, now) => applyAction(state, action, now);
const players = () => currentGame(state).players;
const add = (name) => act({ type: 'addPlayer', name });

beforeEach(() => {
  state = createInitialState(0);
});

describe('players', () => {
  test('addPlayer starts male at level 1 with no gear, and with an avatar nobody else has', () => {
    const a = add('Ana');
    const b = add('Bo');
    assert.deepEqual({ ...a, id: undefined }, { id: undefined, name: 'Ana', avatar: AVATAR_IDS[0], sex: 'male', level: 1, gear: 0 });
    assert.equal(b.avatar, AVATAR_IDS[1]);
    assert.notEqual(a.id, b.id);
    act({ type: 'setAvatar', playerId: a.id, avatar: AVATAR_IDS[2] });
    assert.equal(add('Cy').avatar, AVATAR_IDS[0]);                     // the first free one, not the next in line
  });

  test('addPlayer trims, limits and defaults the name', () => {
    assert.equal(add('   ').name, 'Player 1');
    assert.equal(add('  Konstantina Papadopoulou  ').name.length, 20);
  });

  test('removePlayer', () => {
    const a = add('Ana');
    act({ type: 'removePlayer', playerId: a.id });
    assert.equal(players().length, 0);
  });

  test('setAvatar only accepts avatars from the list', () => {
    const a = add('Ana');
    act({ type: 'setAvatar', playerId: a.id, avatar: 'dragon' });
    assert.equal(players()[0].avatar, 'dragon');
    for (const avatar of ['<script>', '🧙', '', undefined]) {
      assert.throws(() => act({ type: 'setAvatar', playerId: a.id, avatar }), ActionError);
    }
    assert.throws(() => act({ type: 'setEmoji', playerId: a.id, emoji: '🧙' }), /Unknown action/);   // gone in 2.8.0
  });

  test("setAvatar refuses an avatar another player in the game has; your own is fine", () => {
    const a = add('Ana');
    const b = add('Bo');
    assert.throws(() => act({ type: 'setAvatar', playerId: b.id, avatar: a.avatar }), { status: 409, message: /Ana/ });
    assert.notEqual(players()[1].avatar, a.avatar);
    act({ type: 'setAvatar', playerId: a.id, avatar: a.avatar });           // already hers: nothing to refuse
    act({ type: 'removePlayer', playerId: a.id });
    act({ type: 'setAvatar', playerId: b.id, avatar: 'elf' });             // free again once she left
    assert.equal(players()[0].avatar, 'elf');
  });

  test('addPlayer takes the sex chosen when adding, and rejects an invalid one', () => {
    assert.equal(act({ type: 'addPlayer', name: 'Ana', sex: 'female' }).sex, 'female');
    assert.equal(act({ type: 'addPlayer', name: 'Bo', sex: 'male' }).sex, 'male');
    assert.throws(() => act({ type: 'addPlayer', name: 'Cy', sex: 'robot' }), ActionError);
    assert.equal(players().length, 2);                                   // nothing added on an error
  });

  test('setSex switches between male and female, and rejects anything else', () => {
    const a = add('Ana');
    act({ type: 'setSex', playerId: a.id, sex: 'female' });
    assert.equal(players()[0].sex, 'female');
    act({ type: 'setSex', playerId: a.id, sex: 'male' });
    assert.equal(players()[0].sex, 'male');
    for (const sex of ['other', '', undefined, 'FEMALE']) {
      assert.throws(() => act({ type: 'setSex', playerId: a.id, sex }), ActionError);
    }
    assert.equal(players()[0].sex, 'male');
    assert.throws(() => act({ type: 'setSex', playerId: 'nope', sex: 'female' }), { status: 404 });
  });

  test('unknown player is a 404', () => {
    assert.throws(() => act({ type: 'changeLevel', playerId: 'nope', delta: 1 }), { status: 404 });
  });
});

describe('levels and gear', () => {
  test('changeLevel stays between 1 and 10', () => {
    const a = add('Ana');
    act({ type: 'changeLevel', playerId: a.id, delta: -1 });
    assert.equal(players()[0].level, 1);
    for (let i = 0; i < 15; i++) act({ type: 'changeLevel', playerId: a.id, delta: 1 });
    assert.equal(players()[0].level, MAX_LEVEL);
  });

  test('delta must be exactly 1 or -1', () => {
    const a = add('Ana');
    for (const delta of [5, 0, 'x', undefined]) {
      assert.throws(() => act({ type: 'changeLevel', playerId: a.id, delta }), ActionError);
    }
    assert.equal(players()[0].level, 1);
  });

  test('setLevel jumps to a level and rejects out-of-range values', () => {
    const a = add('Ana');
    act({ type: 'setLevel', playerId: a.id, level: 7 });
    assert.equal(players()[0].level, 7);
    for (const level of [0, 11, 2.5, 'nine']) {
      assert.throws(() => act({ type: 'setLevel', playerId: a.id, level }), ActionError);
    }
  });

  test('gear can go negative (curses)', () => {
    const a = add('Ana');
    act({ type: 'changeGear', playerId: a.id, delta: -1 });
    act({ type: 'changeGear', playerId: a.id, delta: -1 });
    assert.equal(players()[0].gear, -2);
  });

  test('die keeps the level, loses all gear and records the death', () => {
    const a = add('Ana');
    act({ type: 'setLevel', playerId: a.id, level: 6 });
    act({ type: 'changeGear', playerId: a.id, delta: 1 });
    act({ type: 'die', playerId: a.id }, 1234);
    assert.deepEqual([players()[0].level, players()[0].gear], [6, 0]);
    assert.deepEqual(currentGame(state).lastDeath, { playerId: a.id, at: 1234 });
  });
});

describe('games', () => {
  test('newGame adds a game, keeps the old one and switches to it', () => {
    const first = state.currentGameId;
    add('Ana');
    const { gameId } = act({ type: 'newGame', name: 'Friday' });
    assert.equal(state.games.length, 2);
    assert.equal(state.currentGameId, gameId);
    assert.equal(currentGame(state).name, 'Friday');
    assert.equal(players().length, 0);
    assert.equal(state.games.find((g) => g.id === first).players.length, 1);
  });

  test('newGame with keepPlayers keeps ids and sex, and resets level and gear', () => {
    const a = add('Ana');
    act({ type: 'setLevel', playerId: a.id, level: 8 });
    act({ type: 'setSex', playerId: a.id, sex: 'female' });
    act({ type: 'newGame', name: '', keepPlayers: true });
    assert.equal(currentGame(state).name, 'Game 2');
    assert.deepEqual(players(), [{ ...a, sex: 'female', level: 1, gear: 0 }]);
  });

  test('switchGame and deleteGame', () => {
    const first = state.currentGameId;
    act({ type: 'newGame', name: 'Second' });
    assert.throws(() => act({ type: 'deleteGame', gameId: state.currentGameId }), ActionError);
    act({ type: 'switchGame', gameId: first });
    assert.equal(state.currentGameId, first);
    const second = state.games[1].id;
    act({ type: 'deleteGame', gameId: second });
    assert.equal(state.games.length, 1);
    assert.throws(() => act({ type: 'switchGame', gameId: second }), { status: 404 });
  });
});

describe('validation', () => {
  test('rejects non-objects and unknown types', () => {
    assert.throws(() => act(null), ActionError);
    assert.throws(() => act({ type: 'toString' }), ActionError);
    assert.throws(() => act({ type: 'winTheGame' }), /Unknown action/);
  });
});
