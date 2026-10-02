// Dashboard (tablet / TV): the board, announcer and sounds for the current game.
import { refreshActivityLog, showActivityLog } from '../shared/activity.js';
import { fetchInfo, sendAction } from '../shared/api.js';
import { $, closest } from '../shared/dom.js';
import { LevelWatcher } from './announcer.js';
import { renderBoard } from './board.js';
import { askPlayerName, confirmDeath, confirmRemovePlayer, showSoundTest } from './dialogs.js';
import { fitRows } from './sizing.js';
import { LEVEL_SOUNDS, NEWS_SOUNDS, Soundboard } from './sounds.js';
import { Ticker } from './ticker.js';

const DEATH_FLASH_MS = 1600;

/** @typedef {import('../shared/rules.js').View} View */

/**
 * The dashboard only works while it's on screen: the announcer, sounds and level watching start
 * fresh (and silently, like a page load) each time it's shown, so nothing plays on the start page.
 * @param {{ openLobby: () => void }} options  switches the page to the start page view
 * @returns {{ update(view: View): void, show(): void, hide(): void }}
 */
export function createDashboard({ openLobby }) {
  const board = $('board');
  const sounds = new Soundboard();
  const flashIds = new Set();   // players who just died: their row flashes red
  /** @type {View} */
  let view = { version: '', game: { id: '', name: '', lastDeath: null }, players: [], games: [] };
  let active = null;           // { ticker, levels } while shown

  const send = (action) => sendAction(action).catch((err) => console.warn(`${action.type} failed:`, err.message));

  function render() {
    $('gameName').textContent = view.game.name ?? '';
    fitRows(board, view.players.length);
    renderBoard(board, view.players, flashIds);
  }

  function react() {
    // One sound per update: news (death, win, level 9…) beats a plain level change.
    const news = active.ticker.update(view);
    const levelChange = active.levels.update(view.game.id, view.players);
    if (news) sounds.play(NEWS_SOUNDS[news]);
    else if (levelChange) sounds.play(LEVEL_SOUNDS[levelChange]);
  }

  addEventListener('resize', () => { if (active) fitRows(board, view.players.length); });

  // ----- player rows -----

  board.addEventListener('click', async (e) => {
    const button = closest(e, 'button[data-action]');
    if (!button) return;
    const { action, player: playerId } = button.dataset;
    const player = view.players.find((p) => p.id === playerId);
    if (!player) return;

    switch (action) {
      case 'changeLevel':
      case 'changeGear':
        send({ type: action, playerId, delta: Number(button.dataset.delta) });
        break;
      case 'setLevel':
        send({ type: 'setLevel', playerId, level: Number(button.dataset.level) });
        break;
      case 'die':
        if (await confirmDeath(player)) {
          flashIds.add(playerId);
          setTimeout(() => flashIds.delete(playerId), DEATH_FLASH_MS);
          send({ type: 'die', playerId });
        }
        break;
      case 'removePlayer':
        if (await confirmRemovePlayer(player, view.game.name)) send({ type: 'removePlayer', playerId });
        break;
    }
  });

  // ----- top bar -----

  $('gameButton').addEventListener('click', (e) => {
    e.preventDefault();     // same page: stays in full screen
    openLobby();
  });

  $('activity').addEventListener('click', () => showActivityLog(view.game.id, view.game.name));

  $('addPlayer').addEventListener('click', async () => {
    const name = await askPlayerName();
    if (name !== null) send({ type: 'addPlayer', name });
  });

  function showSoundState() {
    const button = $('sound');
    button.textContent = sounds.enabled ? '🔊' : '🔇';
    button.title = sounds.enabled ? 'Sound on (tap to mute)' : 'Sound off (tap to unmute)';
  }
  $('sound').addEventListener('click', () => {
    sounds.enabled = !sounds.enabled;
    showSoundState();
    sounds.unlock();
    if (sounds.enabled) setTimeout(() => sounds.play('beep'), 50);
  });
  showSoundState();

  const qrOverlay = $('qrOverlay');
  $('qrButton').addEventListener('click', () => qrOverlay.classList.add('open'));
  qrOverlay.addEventListener('click', () => qrOverlay.classList.remove('open'));
  fetchInfo().then((info) => { $('joinUrl').textContent = info.joinUrl; });

  // Open the dashboard with #sounds at the end of the address to hear every sound.
  const openSoundTestFromHash = () => { if (active && location.hash === '#sounds') showSoundTest(sounds); };
  addEventListener('hashchange', openSoundTestFromHash);

  return {
    update(next) {
      view = next;
      if (!active) return;
      render();
      refreshActivityLog();
      react();
    },

    show() {
      if (active) return;
      active = { ticker: new Ticker($('announcer')), levels: new LevelWatcher() };
      render();
      react();                // the first update only learns the table: no sounds
      openSoundTestFromHash();
    },

    hide() {
      if (!active) return;
      active.ticker.stop();
      active = null;
      qrOverlay.classList.remove('open');
    },
  };
}
