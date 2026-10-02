// Activity log: what happened in a game, so players can check it if something looks wrong.
//
// Entry shape: { at, kind, source, playerId?, name?, emoji?, from?, to?, kept? }
//   kind     start | join | remove | emoji | level | gear | death
//   source   'dashboard' | 'phone' | null (which kind of screen did it)
//   name, emoji   the player as they were at that moment (so removed players still read well)

export const MAX_ENTRIES = 500;      // per game; the oldest are dropped
export const MERGE_WINDOW_MS = 15_000;

export const KINDS = Object.freeze(['start', 'join', 'remove', 'emoji', 'level', 'gear', 'death']);
export const SOURCES = Object.freeze(['dashboard', 'phone']);

/**
 * Quick repeated taps on the same counter, in the same direction, become one entry ("level 3 → 6").
 * A change of direction always starts a new entry, so going up and back down shows both.
 */
const MERGEABLE = new Set(['level', 'gear']);
/** Entries that describe a change; they're skipped when nothing changed (e.g. + at level 10). */
const CHANGES = new Set(['level', 'gear', 'emoji']);

/** Who an entry is about, as they are right now. */
export const aboutPlayer = (player) => ({ playerId: player.id, name: player.name, emoji: player.emoji });

const direction = (e) => Math.sign(e.to - e.from);

function continues(last, item) {
  return last && MERGEABLE.has(item.kind) && last.kind === item.kind && last.playerId === item.playerId
    && last.source === item.source && item.at - last.at <= MERGE_WINDOW_MS
    && direction(last) === direction(item);
}

/** Adds an entry to the game's log. */
export function record(game, entry, { now, source = null }) {
  const log = game.log;
  const item = { at: now, source, ...entry };
  if (CHANGES.has(item.kind) && item.from === item.to) return;

  const last = log[log.length - 1];
  if (continues(last, item)) {
    last.to = item.to;
    last.at = now;
    return;
  }

  log.push(item);
  if (log.length > MAX_ENTRIES) log.splice(0, log.length - MAX_ENTRIES);
}

const FIELDS = ['playerId', 'name', 'emoji'];

/** Cleans a saved log: keeps valid entries only, newest MAX_ENTRIES. */
export function normalizeLog(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e) => e && typeof e === 'object' && KINDS.includes(e.kind) && Number.isFinite(Number(e.at)))
    .map((e) => {
      const entry = { at: Number(e.at), kind: e.kind, source: SOURCES.includes(e.source) ? e.source : null };
      for (const field of FIELDS) if (typeof e[field] === 'string') entry[field] = e[field];
      for (const field of ['from', 'to']) {
        if (typeof e[field] === 'string' || Number.isFinite(e[field])) entry[field] = e[field];
      }
      if (Number.isInteger(e.kept)) entry.kept = e.kept;
      return entry;
    })
    .slice(-MAX_ENTRIES);
}
