import { clampLevel, EMOJIS, MAX_GAME_NAME, MAX_LEVEL, MAX_PLAYER_NAME, MIN_LEVEL } from '../../public/js/shared/rules.js';
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
  addPlayer(state, { name }, ctx) {
    const game = currentGame(state);
    const player = {
      id: newId(),
      name: text(name, MAX_PLAYER_NAME) || `Player ${game.players.length + 1}`,
      emoji: EMOJIS[game.players.length % EMOJIS.length],
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

  setEmoji(state, { playerId, emoji }, ctx) {
    if (!EMOJIS.includes(emoji)) throw new ActionError('Unknown emoji');
    const game = currentGame(state);
    const player = findPlayer(game, playerId);
    const from = player.emoji;
    player.emoji = emoji;
    record(game, { kind: 'emoji', ...aboutPlayer(player), from, to: emoji }, ctx);
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

  deleteGame(state, { gameId }) {
    findGame(state, gameId);
    if (gameId === state.currentGameId) throw new ActionError('Cannot delete the game being played');
    state.games = state.games.filter((g) => g.id !== gameId);
  },
};

/**
 * Applies one action to the state (mutating it) and returns the handler's result.
 * Throws ActionError for anything invalid; the state is left unchanged in that case.
 * `action.source` ('dashboard' or 'phone') is optional and only shows up in the activity log.
 */
export function applyAction(state, action, now = Date.now()) {
  if (!action || typeof action !== 'object') throw new ActionError('Action must be a JSON object');
  if (!Object.hasOwn(handlers, action.type)) throw new ActionError(`Unknown action: ${action.type}`);
  const source = SOURCES.includes(action.source) ? action.source : null;
  return handlers[action.type](state, action, { now, source }) ?? { ok: true };
}
