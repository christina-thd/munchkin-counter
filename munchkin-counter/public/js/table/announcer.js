// What the announcer can say about the table right now, and what counts as news.
// Pure logic (no DOM, no timers) so it can be unit-tested in Node.
import { avatarHtml } from '../shared/avatars.js';
import { escapeHtml } from '../shared/dom.js';
import { MAX_LEVEL, MIN_LEVEL } from '../shared/rules.js';
import { LINES } from './lines.js';

const STUCK_WHEN_LEADER_AT = 4;   // "stuck at level 1" only once someone has reached this level
const RUNAWAY_BY = 3;
// Suspiciously much gear: one player with way more than everybody else: at least HOARD_GEAR, at least HOARD_BY
// more than the next one, and at least twice as much. (General gear talk is out: with everyone well equipped it
// read oddly; one player far ahead of the rest is worth a remark.)
const HOARD_GEAR = 10;
const HOARD_BY = 6;

/** Situations that interrupt the rotation (and make a sound), most important first. */
const NEWSWORTHY = Object.freeze(['win', 'death', 'nine', 'cursed', 'stuck']);

const nameHtml = (p) => `<b>${avatarHtml(p.avatar, { inline: true })} ${escapeHtml(p.name)}</b>`;
const namesHtml = (players) => (players.length > 2
  ? `${nameHtml(players[0])} & ${players.length - 1} others`
  : players.map(nameHtml).join(' & '));

/**
 * @typedef {object} Situation
 * @property {string}   category  e.g. 'stuck'
 * @property {string[]} ids       who (or what) it is about; used to tell if it's new
 * @property {boolean}  pinned    takes over the bar instead of rotating
 * @property {string[]} lines     every way to say it (HTML); none for a situation that only makes a sound
 */

/**
 * Lists the situations that apply to these players.
 * Level talk is only about a player alone at the top (with several level with each other, it reads oddly);
 * gear gets no talk at all (everyone has plenty by mid-game). Level 9 shared, stuck at level 1 and cursed
 * still count as news, for their sounds, but say nothing.
 * @param {import('../shared/rules.js').Player[]} players
 * @param {{ playerId: string, at?: number } | null} activeDeath  a death that should currently be announced
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
  const started = top > MIN_LEVEL;
  const alone = leaders.length === 1;
  const leader = { who: nameHtml(leaders[0]), level: top };

  if (!started) out.push(make('start', ['*'], LINES.start()));

  if (top === MAX_LEVEL - 1) out.push(make('nine', leaderIds, alone ? LINES.nine(leader) : []));
  else if (top === MAX_LEVEL - 2 && alone) out.push(make('eight', leaderIds, LINES.eight(leader)));

  if (alone && second && top - second.level >= RUNAWAY_BY && top < MAX_LEVEL - 1) {
    out.push(make('runaway', leaderIds, LINES.runaway({ ...leader, gap: top - second.level })));
  }

  const stuck = players.filter((p) => p.level === MIN_LEVEL);
  if (stuck.length && top >= STUCK_WHEN_LEADER_AT) out.push(make('stuck', stuck.map((p) => p.id), []));

  const cursed = players.filter((p) => p.gear < 0);
  if (cursed.length) out.push(make('cursed', cursed.map((p) => p.id), []));

  const byGear = [...players].sort((a, b) => b.gear - a.gear);
  const [hoarder, nextGear] = byGear;
  const runnerUp = nextGear ? Math.max(nextGear.gear, 0) : 0;
  if (players.length > 1 && hoarder.gear >= HOARD_GEAR && hoarder.gear - runnerUp >= HOARD_BY
      && hoarder.gear >= 2 * runnerUp) {
    out.push(make('hoard', [hoarder.id], LINES.hoard({ who: nameHtml(hoarder) })));
  }

  if (started) out.push(make('flavor', ['*'], LINES.flavor()));
  if (started && alone) out.push(make('status', [...leaderIds, `L${top}`], LINES.status(leader)));
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

/** Notices when any player's sex changed (♂ ↔ ♀, a Change Sex curse) since the last update of the same game. */
export class SexWatcher {
  #sexes = null;
  #gameId = null;

  /** @returns {boolean} */
  update(gameId, players) {
    const now = new Map(players.map((p) => [p.id, p.sex]));
    const changed = Boolean(this.#sexes) && gameId === this.#gameId
      && [...now].some(([id, sex]) => this.#sexes.has(id) && this.#sexes.get(id) !== sex);
    this.#sexes = now;
    this.#gameId = gameId;
    return changed;
  }
}
