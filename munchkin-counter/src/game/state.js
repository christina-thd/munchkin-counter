import { randomBytes } from 'node:crypto';
import { normalizeLog } from './activity.js';
import { AVATAR_IDS, clampLevel, freeAvatar, MAX_GAME_NAME, MAX_PLAYER_NAME, SEXES } from '../../public/js/shared/rules.js';

/**
 * State shape (saved to disk as JSON):
 *
 *   {
 *     schema: 2,
 *     currentGameId: string,
 *     games: [{
 *       id, name, createdAt,
 *       players: [{ id, name, avatar, sex, level, gear }],   (both added in 2.8.0; avatar replaced emoji)
 *       lastDeath: { playerId, at } | null,
 *       log: [activity entries],          (see activity.js)
 *     }],
 *   }
 */
export const SCHEMA_VERSION = 2;

/** @typedef {ReturnType<typeof createInitialState>} State */

export const newId = () => randomBytes(4).toString('hex');

export function createGame(name, players = [], now = Date.now()) {
  return { id: newId(), name, createdAt: now, players, lastDeath: null, log: [] };
}

export function createInitialState(now = Date.now()) {
  const game = createGame('Game 1', [], now);
  return { schema: SCHEMA_VERSION, currentGameId: game.id, games: [game] };
}

export function currentGame(state) {
  return state.games.find((g) => g.id === state.currentGameId);
}

/** Players saved before 2.8.0 had an emoji: each becomes the closest avatar (the rest get one by position). */
const AVATAR_FOR_EMOJI = {
  '🧙': 'wizard', '🧝': 'elf', '🧛': 'vampire', '🧟': 'zombie', '🧞': 'ghost', '🧜': 'slime', '🦸': 'warrior',
  '🦹': 'thief', '🥷': 'thief', '🤴': 'crown', '👸': 'crown', '🐉': 'dragon', '🐺': 'werewolf', '🐸': 'slime',
  '🐙': 'slime', '💀': 'skeleton', '👹': 'orc', '👻': 'ghost', '🍄': 'gnome', '⚔️': 'warrior', '🛡️': 'warrior',
};

function avatarOf(raw, index) {
  if (AVATAR_IDS.includes(raw.avatar)) return raw.avatar;
  return AVATAR_FOR_EMOJI[raw.emoji] ?? AVATAR_IDS[index % AVATAR_IDS.length];
}

const toInt = (value, fallback) => (Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : fallback);
const toText = (value, max, fallback) => String(value ?? '').trim().slice(0, max) || fallback;

function normalizePlayer(raw, index) {
  return {
    id: String(raw.id ?? newId()),
    name: toText(raw.name, MAX_PLAYER_NAME, `Player ${index + 1}`),
    avatar: avatarOf(raw, index),
    sex: SEXES.includes(raw.sex) ? raw.sex : SEXES[0],   // saved before 2.8.0: none yet
    level: clampLevel(toInt(raw.level, 1)),
    gear: toInt(raw.gear ?? raw.bonus, 0),              // schema 1 called it "bonus"
  };
}

/**
 * Every avatar belongs to one player per game. Games saved earlier could share one (two emojis that became the
 * same avatar, or picked before 2.8.2): the first player keeps it, the next ones get the first free avatars.
 */
function uniqueAvatars(players) {
  const seen = new Set();
  for (const player of players) {
    if (seen.has(player.avatar)) player.avatar = freeAvatar(players.filter((p) => p !== player));
    seen.add(player.avatar);
  }
  return players;
}

function normalizeGame(raw, index, now) {
  const players = uniqueAvatars(Array.isArray(raw.players) ? raw.players.map(normalizePlayer) : []);
  const death = raw.lastDeath;
  const deathPlayerId = death && String(death.playerId ?? death.id ?? '');   // schema 1 called it "id"
  return {
    id: String(raw.id ?? newId()),
    name: toText(raw.name, MAX_GAME_NAME, `Game ${index + 1}`),
    createdAt: toInt(raw.createdAt, now),
    players,
    lastDeath: deathPlayerId ? { playerId: deathPlayerId, at: toInt(death.at, now) } : null,
    log: normalizeLog(raw.log),
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
  return {
    id: game.id,
    name: game.name,
    createdAt: game.createdAt,
    playerCount: game.players.length,
  };
}

/**
 * The activity log of one game (oldest first), or null if there's no such game. With the game's players as
 * they are now, for its report: players kept from a previous game never "joined" this one in the log.
 */
export function gameLog(state, gameId) {
  const game = state.games.find((g) => g.id === gameId);
  return game ? { gameId: game.id, name: game.name, players: game.players, entries: game.log } : null;
}

/**
 * What every screen receives: the current game in full, plus a summary of all games.
 * @returns {import('../../public/js/shared/rules.js').View}
 */
export function toView(state, appVersion) {
  const game = currentGame(state);
  return {
    version: appVersion,
    game: { id: game.id, name: game.name, lastDeath: game.lastDeath },
    players: game.players,
    games: state.games.map(summarize),
  };
}
