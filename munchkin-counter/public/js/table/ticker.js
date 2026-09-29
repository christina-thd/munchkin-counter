// The announcer bar in the top bar: shows one situation at a time, rotates through them,
// and jumps straight to news (a death, a win, someone newly stuck at 1…).
import { restartAnimation } from '../shared/dom.js';
import { LineDeck, SituationTracker, situationKey, situations } from './announcer.js';

export class Ticker {
  #el;
  #deathMs;
  #deck = new LineDeck();
  #tracker = new SituationTracker();
  #view = null;
  #index = 0;
  #chosen = new Map();   // situation key → the line picked for it until the next rotation
  #shown = '';
  #death = { gameId: null, seenAt: null, until: 0 };
  #timers = [];

  constructor(el, { rotateMs = 30_000, deathMs = 30_000 } = {}) {
    this.#el = el;
    this.#deathMs = deathMs;
    this.#timers = [setInterval(() => this.#rotate(), rotateMs), setInterval(() => this.#expireDeath(), 1000)];
  }

  /** Stops rotating (when the dashboard is hidden). */
  stop() {
    this.#timers.forEach(clearInterval);
    this.#timers = [];
  }

  /**
   * Call with every view from the server.
   * @returns {string | null} the category of news that just happened, if any (for its sound)
   */
  update(view) {
    this.#view = view;
    this.#trackDeath(view.game);
    const list = this.#situations();
    const [news] = this.#tracker.update(view.game.id, list);
    if (news) this.#index = list.indexOf(news);
    this.#render(list);
    return news?.category ?? null;
  }

  #situations() {
    const death = Date.now() < this.#death.until ? this.#view.game.lastDeath : null;
    return situations(this.#view.players, death);
  }

  // A death is announced for `deathMs` from when it happened. On page load or after switching
  // games, only a death that happened moments ago is shown.
  #trackDeath(game) {
    const death = game.lastDeath;
    const now = Date.now();
    if (game.id !== this.#death.gameId) {
      const recent = death && now - death.at < this.#deathMs;
      this.#death = { gameId: game.id, seenAt: death?.at ?? null, until: recent ? death.at + this.#deathMs : 0 };
      return;
    }
    if (death && death.at !== this.#death.seenAt) {
      this.#death.seenAt = death.at;
      this.#death.until = now + this.#deathMs;
    }
  }

  #expireDeath() {
    if (this.#death.until && Date.now() >= this.#death.until) {
      this.#death.until = 0;
      this.#render(this.#situations());
    }
  }

  #rotate() {
    if (!this.#view) return;
    this.#index += 1;
    this.#chosen.clear();
    this.#render(this.#situations());
  }

  #render(list) {
    if (!list.length) {
      this.#el.textContent = '';
      this.#shown = '';
      return;
    }
    const current = list[0].pinned ? list[0] : list[this.#index % list.length];
    const key = situationKey(current);
    if (!this.#chosen.has(key)) this.#chosen.set(key, this.#deck.draw(current.category, current.lines));
    const html = this.#chosen.get(key);
    if (html !== this.#shown) {
      this.#el.innerHTML = html;
      restartAnimation(this.#el, 'fresh');
      this.#shown = html;
    }
  }
}
