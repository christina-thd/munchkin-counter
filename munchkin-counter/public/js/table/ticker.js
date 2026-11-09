// The announcer bar in the top bar: shows one situation at a time, rotates through them,
// and jumps straight to news (a death, a win, someone newly stuck at 1…).
import { restartAnimation } from '../shared/dom.js';
import { LineDeck, SituationTracker, situationKey, situations } from './announcer.js';

const FONT_PX = 15;
const MIN_FONT_PX = 11;

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

  constructor(el, { rotateMs = 60_000, deathMs = 30_000 } = {}) {
    this.#el = el;
    this.#deathMs = deathMs;
    this.#timers = [setInterval(() => this.#rotate(), rotateMs), setInterval(() => this.#expireDeath(), 1000)];
    addEventListener('resize', this.#fit);
    document.fonts?.ready.then(this.#fit);
  }

  /** Stops rotating (when the dashboard is hidden). */
  stop() {
    this.#timers.forEach(clearInterval);
    this.#timers = [];
    removeEventListener('resize', this.#fit);
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
    const spoken = list.filter((s) => s.lines.length);
    if (news && spoken.includes(news)) this.#index = spoken.indexOf(news);
    this.#render(spoken);
    return news?.category ?? null;
  }

  // every situation, including the ones that only make a sound
  #situations() {
    const death = Date.now() < this.#death.until ? this.#view.game.lastDeath : null;
    return situations(this.#view.players, death);
  }

  #spoken() {
    return this.#situations().filter((s) => s.lines.length);
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
      this.#render(this.#spoken());
    }
  }

  #rotate() {
    if (!this.#view) return;
    this.#index += 1;
    this.#chosen.clear();
    this.#render(this.#spoken());
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
      this.#fit();
      restartAnimation(this.#el, 'fresh');
      this.#shown = html;
    }
  }

  // A long line gets a smaller font rather than making the top bar (and so the board) change height.
  #fit = () => {
    const el = this.#el;
    let size = FONT_PX;
    el.style.fontSize = `${size}px`;
    while (el.scrollHeight > el.clientHeight + 1 && size > MIN_FONT_PX) {
      size -= 1;
      el.style.fontSize = `${size}px`;
    }
  };
}
