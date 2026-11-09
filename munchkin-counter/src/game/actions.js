import {
  AVATAR_IDS, clampLevel, freeAvatar, MAX_GAME_NAME, MAX_LEVEL, MAX_PLAYER_NAME, MAX_PLAYERS, MIN_LEVEL, SEXES, winnersOf,
} from '../../public/js/shared/rules.js';
import { dungeonName } from '../../public/js/shared/dungeon-names.js';
import { aboutPlayer, record, SOURCES } from './activity.js';
import { createGame, currentGame, newId } from './state.js';

/** A rejected action. `status` is the HTTP status the API answers with. */
export class ActionError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ActionError';
    this.status = status;
  }
}

// ----- input helpers -----

function text(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

/** +1 or -1 from a delta; anything else is an error. */
function step(delta) {
  const n = Number(delta);
  if (n !== 1 && n !== -1) throw new ActionError('delta must be 1 or -1');
  return n;
}

/** 'male' or 'female'; anything else is an error. */
function validSex(sex) {
  if (!SEXES.includes(sex)) throw new ActionError(`sex must be ${SEXES.join(' or ')}`);
  return sex;
}

function findPlayer(game, playerId) {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) throw new ActionError(`No player ${playerId} in this game`, 404);
  return player;
}

function findGame(state, gameId) {
  const game = state.games.find((g) => g.id === gameId);
  if (!game) throw new ActionError(`No game ${gameId}`, 404);
  return game;
}

// ----- actions -----
// Each handler changes `state` in place, records what happened in the game's activity log,
// and may return a result for the caller. `ctx` is { now, source }.

const handlers = {
  /** `sex` is chosen when adding; without one (older screens) the character starts male. At most MAX_PLAYERS. */
  addPlayer(state, { name, sex = SEXES[0] }, ctx) {
    const game = currentGame(state);
    if (game.players.length >= MAX_PLAYERS) {
      throw new ActionError(`The game is full: Munchkin is for up to ${MAX_PLAYERS} players`, 409);
    }
    const player = {
      id: newId(),
      name: text(name, MAX_PLAYER_NAME) || `Player ${game.players.length + 1}`,
      avatar: freeAvatar(game.players),
      sex: validSex(sex),
      level: MIN_LEVEL,
      gear: 0,
    };
    game.players.push(player);
    record(game, { kind: 'join', ...aboutPlayer(player) }, ctx);
    return player;
  },

  removePlayer(state, { playerId }, ctx) {
    const game = currentGame(state);
    const player = findPlayer(game, playerId);
    game.players = game.players.filter((p) => p.id !== playerId);
    record(game, { kind: 'remove', ...aboutPlayer(player) }, ctx);
  },

  /** Each avatar belongs to one player per game: one someone else has is refused (two phones picking at once). */
  setAvatar(state, { playerId, avatar }, ctx) {
    if (!AVATAR_IDS.includes(avatar)) throw new ActionError('Unknown avatar');
    const game = currentGame(state);
    const player = findPlayer(game, playerId);
    const owner = game.players.find((p) => p.avatar === avatar && p.id !== player.id);
    if (owner) throw new ActionError(`${owner.name} already has that avatar`, 409);
    const from = player.avatar;
    player.avatar = avatar;
    record(game, { kind: 'avatar', ...aboutPlayer(player), from, to: avatar }, ctx);
    return player;
  },

  /** The character's sex (Change Sex curse, sex-specific items). It's kept when a new game keeps the players. */
  setSex(state, { playerId, sex }, ctx) {
    const to = validSex(sex);
    const game = currentGame(state);
    const player = findPlayer(game, playerId);
    const from = player.sex;
    player.sex = to;
    record(game, { kind: 'sex', ...aboutPlayer(player), from, to }, ctx);
    return player;
  },

  changeLevel(state, { playerId, delta }, ctx) {
    const game = currentGame(state);
    const player = findPlayer(game, playerId);
    const from = player.level;
    player.level = clampLevel(player.level + step(delta));
    record(game, { kind: 'level', ...aboutPlayer(player), from, to: player.level }, ctx);
    return player;
  },

  setLevel(state, { playerId, level }, ctx) {
    const n = Number(level);
    if (!Number.isInteger(n) || n < MIN_LEVEL || n > MAX_LEVEL) {
      throw new ActionError(`level must be ${MIN_LEVEL}–${MAX_LEVEL}`);
    }
    const game = currentGame(state);
    const player = findPlayer(game, playerId);
    const from = player.level;
    player.level = n;
    record(game, { kind: 'level', ...aboutPlayer(player), from, to: n }, ctx);
    return player;
  },

  changeGear(state, { playerId, delta }, ctx) {
    const game = currentGame(state);
    const player = findPlayer(game, playerId);
    const from = player.gear;
    player.gear += step(delta);          // may go negative: curses
    record(game, { kind: 'gear', ...aboutPlayer(player), from, to: player.gear }, ctx);
    return player;
  },

  /** Takes a win back (a slip of the finger): each winner goes back to the level they had just before level 10. */
  undoWin(state, _action, ctx) {
    const game = currentGame(state);
    const winners = winnersOf(game.players);
    if (!winners.length) throw new ActionError('Nobody has won this game', 409);
    for (const player of winners) {
      const won = game.log.findLast((e) => e.kind === 'level' && e.playerId === player.id && e.to >= MAX_LEVEL);
      const from = player.level;
      player.level = won && won.from < MAX_LEVEL ? won.from : MAX_LEVEL - 1;
      record(game, { kind: 'level', ...aboutPlayer(player), from, to: player.level }, ctx);
    }
  },

  /** Munchkin death: you keep your level but lose all your gear. */
  die(state, { playerId }, ctx) {
    const game = currentGame(state);
    const player = findPlayer(game, playerId);
    const gearLost = player.gear;
    player.gear = 0;
    game.lastDeath = { playerId, at: ctx.now };
    record(game, { kind: 'death', ...aboutPlayer(player), from: gearLost, to: 0 }, ctx);
    return player;
  },

  /** Adds a game to the list and switches to it; old games are kept. */
  newGame(state, { name, keepPlayers }, ctx) {
    const players = keepPlayers
      // same ids, so phones stay connected to their player
      ? currentGame(state).players.map((p) => ({ ...p, level: MIN_LEVEL, gear: 0 }))
      : [];
    const game = createGame(text(name, MAX_GAME_NAME) || `Game ${state.games.length + 1}`, players, ctx.now);
    record(game, { kind: 'start', kept: players.length }, ctx);
    state.games.push(game);
    state.currentGameId = game.id;
    return { gameId: game.id };
  },

  switchGame(state, { gameId }) {
    state.currentGameId = findGame(state, gameId).id;
  },

  /**
   * The game being played can't be deleted, but a finished one can, even if it's the current game:
   * then the newest other game becomes the current one (or a new, empty one if it was the last).
   */
  deleteGame(state, { gameId }, ctx) {
    const game = findGame(state, gameId);
    const current = gameId === state.currentGameId;
    if (current && !winnersOf(game.players).length) throw new ActionError('Cannot delete the game being played');
    state.games = state.games.filter((g) => g.id !== gameId);
    if (!current) return;
    if (!state.games.length) {
      const fresh = createGame(dungeonName([]), [], ctx.now);
      record(fresh, { kind: 'start', kept: 0 }, ctx);
      state.games.push(fresh);
    }
    state.currentGameId = state.games[state.games.length - 1].id;
  },
};

/** Changes to the players of the current game: refused once someone has won, until the win is undone. */
const IN_GAME = new Set(['addPlayer', 'removePlayer', 'setAvatar', 'setSex', 'changeLevel', 'setLevel', 'changeGear', 'die']);

/**
 * Applies one action to the state (mutating it) and returns the handler's result.
 * Throws ActionError for anything invalid; the state is left unchanged in that case.
 * `action.source` ('dashboard' or 'phone') is optional and only shows up in the activity log.
 */
export function applyAction(state, action, now = Date.now()) {
  if (!action || typeof action !== 'object') throw new ActionError('Action must be a JSON object');
  if (!Object.hasOwn(handlers, action.type)) throw new ActionError(`Unknown action: ${action.type}`);
  if (IN_GAME.has(action.type) && winnersOf(currentGame(state).players).length) {
    throw new ActionError('The game is over: undo the win or start a new dungeon', 409);
  }
  const source = SOURCES.includes(action.source) ? action.source : null;
  return handlers[action.type](state, action, { now, source }) ?? { ok: true };
}
