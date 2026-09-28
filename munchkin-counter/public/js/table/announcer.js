// What the announcer can say about the table right now, and what counts as news.
// Pure logic (no DOM, no timers) so it can be unit-tested in Node.
import { escapeHtml } from '../shared/dom.js';
import { MAX_LEVEL, MIN_LEVEL } from '../shared/rules.js';
import { LINES } from './lines.js';

const STUCK_WHEN_LEADER_AT = 4;   // "stuck at level 1" only once someone has reached this level
const BEHIND_BY = 4;
const RUNAWAY_BY = 3;
const TIE_FROM_LEVEL = 4;
const LOADED_GEAR = 8;

/** Situations that interrupt the rotation (and make a sound), most important first. */
export const NEWSWORTHY = Object.freeze(['win', 'death', 'nine', 'cursed', 'stuck']);

const nameHtml = (p) => `<b>${escapeHtml(p.emoji)} ${escapeHtml(p.name)}</b>`;
const namesHtml = (players) => (players.length > 2
  ? `${nameHtml(players[0])} & ${players.length - 1} others`
  : players.map(nameHtml).join(' & '));

/**
 * @typedef {object} Situation
 * @property {string}   category  e.g. 'stuck'
 * @property {string[]} ids       who (or what) it is about; used to tell if it's new
 * @property {boolean}  pinned    takes over the bar instead of rotating
 * @property {string[]} lines     every way to say it (HTML)
 */

/**
 * Lists the situations that apply to these players.
 * @param {Array} players
 * @param {{ playerId: string } | null} activeDeath  a death that should currently be announced
 * @returns {Situation[]}
 */
export function situations(players, activeDeath = null) {
  if (!players.length) return [];

  const make = (category, ids, lines, pinned = false) => ({ category, ids: ids.map(String), pinned, lines });
  const group = (list) => ({ who: namesHtml(list), n: list.length });

  const byLevel = [...players].sort((a, b) => b.level - a.level);
  const top = byLevel[0].level;
  const leaders = players.filter((p) => p.level === top);
  const leaderIds = leaders.map((p) => p.id);
  const second = byLevel.find((p) => p.level < top);

  // A win or a fresh death takes the whole bar.
  const winners = players.filter((p) => p.level >= MAX_LEVEL);
  if (winners.length) return [make('win', winners.map((p) => p.id), LINES.win(group(winners)), true)];

  const dead = activeDeath && players.find((p) => p.id === activeDeath.playerId);
  if (dead) return [make('death', [activeDeath.at ?? dead.id], LINES.death(group([dead])), true)];

  const out = [];
  if (players.every((p) => p.level === MIN_LEVEL)) out.push(make('start', ['*'], LINES.start()));

  if (top === MAX_LEVEL - 1) out.push(make('nine', leaderIds, LINES.nine(group(leaders))));
  else if (top === MAX_LEVEL - 2) out.push(make('eight', leaderIds, LINES.eight(group(leaders))));

  if (leaders.length > 1 && top >= TIE_FROM_LEVEL && top < MAX_LEVEL - 1) {
    out.push(make('tie', [top], LINES.tie({ ...group(leaders), level: top })));
  }
  if (leaders.length === 1 && second && top - second.level >= RUNAWAY_BY && top < MAX_LEVEL - 1) {
    out.push(make('runaway', leaderIds, LINES.runaway({ ...group(leaders), gap: top - second.level })));
  }

  const stuck = players.filter((p) => p.level === MIN_LEVEL);
  if (stuck.length && top >= STUCK_WHEN_LEADER_AT) {
    out.push(make('stuck', stuck.map((p) => p.id), LINES.stuck(group(stuck))));
  }

  const behind = players.filter((p) => p.level > MIN_LEVEL && top - p.level >= BEHIND_BY);
  if (behind.length) {
    const gap = top - Math.max(...behind.map((p) => p.level));
    out.push(make('behind', behind.map((p) => p.id), LINES.behind({ ...group(behind), gap })));
  }

  const loaded = players.filter((p) => p.gear >= LOADED_GEAR);
  if (loaded.length) {
    out.push(make('loaded', loaded.map((p) => p.id), LINES.loaded({ ...group(loaded), gear: loaded[0].gear })));
  }

  const cursed = players.filter((p) => p.gear < 0);
  if (cursed.length) {
    out.push(make('cursed', cursed.map((p) => p.id), LINES.cursed({ ...group(cursed), gear: cursed[0].gear })));
  }

  if (top > MIN_LEVEL && top < MAX_LEVEL - 2) out.push(make('flavor', ['*'], LINES.flavor()));
  if (top > MIN_LEVEL) {
    out.push(make('status', [...leaderIds, `L${top}`],
      LINES.status({ ...group(leaders), level: top, toWin: MAX_LEVEL - top })));
  }
  return out;
}

export const situationKey = (s) => `${s.category}:${s.ids.join(',')}`;

/**
 * Draws lines like cards from a shuffled deck per category, so no line repeats
 * until every line of that category has been shown once.
 */
export class LineDeck {
  #decks = new Map();
  #random;

  constructor(random = Math.random) {
    this.#random = random;
  }

  draw(category, lines) {
    let deck = this.#decks.get(category);
    if (!deck || !deck.order.length || deck.size !== lines.length) {
      const order = lines.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(this.#random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      deck = { order, size: lines.length };
      this.#decks.set(category, deck);
    }
    return lines[deck.order.pop()];
  }
}

/**
 * Tells which situations are news: someone *new* in a newsworthy situation
 * (newly stuck at 1, newly cursed, a new level-9 player, a new death, a win).
 * Someone leaving a situation is not news; neither is opening the page or switching games.
 */
export class SituationTracker {
  #known = null;       // category → Set of ids already seen in it
  #gameId = null;

  /** @returns {Situation[]} the new newsworthy situations, most important first */
  update(gameId, list) {
    if (gameId !== this.#gameId) {
      this.#known = null;
      this.#gameId = gameId;
    }

    const fresh = this.#known
      ? list.filter((s) => NEWSWORTHY.includes(s.category)
          && s.ids.some((id) => !this.#known.get(s.category)?.has(id)))
      : [];

    // While a win/death is pinned the other situations are hidden, so keep remembering them.
    const next = list[0]?.pinned && this.#known ? this.#known : new Map();
    for (const s of list) next.set(s.category, new Set([...(next.get(s.category) ?? []), ...s.ids]));
    this.#known = next;

    return fresh.sort((a, b) => NEWSWORTHY.indexOf(a.category) - NEWSWORTHY.indexOf(b.category));
  }
}

/** Notices when any player's level went up or down since the last update of the same game. */
export class LevelWatcher {
  #levels = null;
  #gameId = null;

  /** @returns {'up' | 'down' | null} */
  update(gameId, players) {
    const now = new Map(players.map((p) => [p.id, p.level]));
    let up = false;
    let down = false;
    if (this.#levels && gameId === this.#gameId) {
      for (const [id, level] of now) {
        const before = this.#levels.get(id);
        if (before === undefined) continue;          // new player
        if (level > before) up = true;
        else if (level < before) down = true;
      }
    }
    this.#levels = now;
    this.#gameId = gameId;
    return up ? 'up' : down ? 'down' : null;
  }
}
