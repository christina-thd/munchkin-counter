import { randomBytes } from 'node:crypto';
import { clampLevel, EMOJIS, MAX_GAME_NAME, MAX_PLAYER_NAME } from '../../public/js/shared/rules.js';

/**
 * State shape (saved to disk as JSON):
 *
 *   {
 *     schema: 2,
 *     currentGameId: string,
 *     games: [{
 *       id, name, createdAt,
 *       players: [{ id, name, emoji, level, gear }],
 *       lastDeath: { playerId, at } | null,
 *     }],
 *   }
 */
export const SCHEMA_VERSION = 2;

export const newId = () => randomBytes(4).toString('hex');

export function createGame(name, players = [], now = Date.now()) {
  return { id: newId(), name, createdAt: now, players, lastDeath: null };
}

export function createInitialState(now = Date.now()) {
  const game = createGame('Game 1', [], now);
  return { schema: SCHEMA_VERSION, currentGameId: game.id, games: [game] };
}

export function currentGame(state) {
  return state.games.find((g) => g.id === state.currentGameId);
}

const toInt = (value, fallback) => (Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : fallback);
const toText = (value, max, fallback) => String(value ?? '').trim().slice(0, max) || fallback;

function normalizePlayer(raw, index) {
  return {
    id: String(raw.id ?? newId()),
    name: toText(raw.name, MAX_PLAYER_NAME, `Player ${index + 1}`),
    emoji: typeof raw.emoji === 'string' && raw.emoji ? raw.emoji : EMOJIS[index % EMOJIS.length],
    level: clampLevel(toInt(raw.level, 1)),
    gear: toInt(raw.gear ?? raw.bonus, 0),              // schema 1 called it "bonus"
  };
}

function normalizeGame(raw, index, now) {
  const players = Array.isArray(raw.players) ? raw.players.map(normalizePlayer) : [];
  const death = raw.lastDeath;
  const deathPlayerId = death && String(death.playerId ?? death.id ?? '');   // schema 1 called it "id"
  return {
    id: String(raw.id ?? newId()),
    name: toText(raw.name, MAX_GAME_NAME, `Game ${index + 1}`),
    createdAt: toInt(raw.createdAt, now),
    players,
    lastDeath: deathPlayerId ? { playerId: deathPlayerId, at: toInt(death.at, now) } : null,
  };
}

/**
 * Turns whatever was read from disk into a valid current-schema state.
 * Handles the older formats: a single `{ players }` game, and schema 1 (`current`, `bonus`).
 */
export function normalizeState(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object') return createInitialState(now);

  const rawGames = Array.isArray(raw.games) ? raw.games
    : Array.isArray(raw.players) ? [{ name: 'Game 1', players: raw.players }]
    : [];
  if (!rawGames.length) return createInitialState(now);

  const games = rawGames.map((g, i) => normalizeGame(g, i, now));
  const wanted = String(raw.currentGameId ?? raw.current ?? '');
  const currentGameId = games.some((g) => g.id === wanted) ? wanted : games[games.length - 1].id;
  return { schema: SCHEMA_VERSION, currentGameId, games };
}

function summarize(game) {
  const leader = game.players.reduce((best, p) => (!best || p.level > best.level ? p : best), null);
  return {
    id: game.id,
    name: game.name,
    createdAt: game.createdAt,
    playerCount: game.players.length,
    leader: leader && { name: leader.name, emoji: leader.emoji, level: leader.level },
  };
}

/** What every screen receives: the current game in full, plus a summary of all games. */
export function toView(state, appVersion) {
  const game = currentGame(state);
  return {
    version: appVersion,
    game: { id: game.id, name: game.name, lastDeath: game.lastDeath },
    players: game.players,
    games: state.games.map(summarize),
  };
}
