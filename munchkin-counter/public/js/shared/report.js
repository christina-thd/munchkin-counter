// The game report: every player's level over the whole game, rebuilt from its activity log.
// Pure (no DOM), so it can be tested in Node.
import { MAX_LEVEL, MIN_LEVEL } from './rules.js';

/**
 * @typedef {object} Track          one player's levels through the game
 * @property {string} playerId
 * @property {string} name          as last seen
 * @property {string | null} avatar
 * @property {{ at: number, level: number }[]} points   from where they start, then every change (oldest first)
 * @property {number[]} deaths      when they died
 * @property {number | null} leftAt removed from the game then
 * @property {number} final         level at the end
 * @property {number} peak          highest level reached
 */

/**
 * An activity log entry (src/game/activity.js); `from` / `to` are levels for kind 'level'.
 * @typedef {{ at: number, kind: string, playerId?: string, name?: string, avatar?: string, from?: any, to?: any }} Entry
 */

/**
 * @param {Entry[]} entries   the game's activity log, oldest first
 * @param {{ id: string, name: string, avatar: string, level: number }[]} [players]   who is in it now (fills in
 *        players kept from the previous game, who never "joined" this one, and players nothing happened to)
 * @returns {{ start: number, end: number, tracks: Track[], winner: { playerId: string, at: number } | null }}
 */
export function levelReport(entries, players = []) {
  const times = entries.map((e) => e.at);
  const start = entries.find((e) => e.kind === 'start')?.at ?? (times.length ? Math.min(...times) : Date.now());
  const end = Math.max(start, ...times);

  /** @type {Map<string, Track>} */
  const tracks = new Map();
  const track = (id, about = {}) => {
    let t = tracks.get(id);
    if (!t) {
      t = { playerId: id, name: 'Someone', avatar: null, points: [], deaths: [], leftAt: null, final: MIN_LEVEL, peak: MIN_LEVEL };
      tracks.set(id, t);
    }
    if (about.name) t.name = about.name;
    if (about.avatar) t.avatar = about.avatar;
    return t;
  };

  // Players in the game now come first, in join order: their colors then match the dashboard's rows.
  for (const p of players) track(p.id, p);

  for (const e of entries) {
    if (!e.playerId) continue;
    const t = track(e.playerId, e);
    if (e.kind === 'join') {
      t.points.push({ at: e.at, level: MIN_LEVEL });
      t.leftAt = null;
    } else if (e.kind === 'level') {
      // Kept from the previous game (no join) or the log's start trimmed: they were at `from` since the start
      if (!t.points.length) t.points.push({ at: start, level: e.from });
      t.points.push({ at: e.at, level: e.to });
    } else if (e.kind === 'death') {
      t.deaths.push(e.at);
    } else if (e.kind === 'remove') {
      t.leftAt = e.at;
    }
  }

  const current = new Map(players.map((p) => [p.id, p]));
  for (const t of tracks.values()) {
    // Nothing changed their level: a flat line at the level they have (or the starting one)
    if (!t.points.length) t.points.push({ at: start, level: current.get(t.playerId)?.level ?? MIN_LEVEL });
    t.final = current.get(t.playerId)?.level ?? t.points[t.points.length - 1].level;
    t.peak = Math.max(...t.points.map((p) => p.level));
  }

  let winner = null;
  for (const t of tracks.values()) {
    const won = t.points.find((p) => p.level >= MAX_LEVEL);
    if (won && (!winner || won.at < winner.at)) winner = { playerId: t.playerId, at: won.at };
  }

  return { start, end, tracks: [...tracks.values()], winner };
}

/** A track's level at a moment, or null if they weren't in the game then. */
export function levelAt(track, at) {
  if (track.leftAt != null && at > track.leftAt) return null;
  let level = null;
  for (const p of track.points) {
    if (p.at > at) break;
    level = p.level;
  }
  return level;
}

/** "Start", "12 min", "1 h 5 min": time since the game started. */
export function formatElapsed(ms) {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return ms < 30_000 ? 'Start' : '1 min';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
