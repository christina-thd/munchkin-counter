// Dashboard (tablet / TV): the board, announcer and sounds for the current game.
import { refreshActivityLog, showActivityLog } from '../shared/activity.js';
import { fetchInfo, sendAction } from '../shared/api.js';
import { closeDialog, openDialog } from '../shared/dialog.js';
import { $, closest, escapeHtml } from '../shared/dom.js';
import { MAX_PLAYERS, winnersOf } from '../shared/rules.js';
import { loadWinStory, winHtml } from '../shared/win.js';
import { LevelWatcher } from './announcer.js';
import { renderBoard } from './board.js';
import { askNewPlayer, confirmDeath, confirmRemovePlayer, showSoundTest } from './dialogs.js';
import { showReport } from './report.js';
import { fitRows, keepRowsFitted } from './sizing.js';
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
  let shownWin = null;         // the win the popup was shown for (game and winners), so it opens once by itself
  let winOpen = false;

  const send = (action) => sendAction(action).catch((err) => console.warn(`${action.type} failed:`, err.message));
  const isOver = () => winnersOf(view.players).length > 0;

  function render() {
    $('gameName').textContent = view.game.name ?? '';
    // Munchkin is for up to 6 players; nobody joins a game that's over
    const full = view.players.length >= MAX_PLAYERS;
    const over = isOver();
    const add = /** @type {HTMLButtonElement} */ ($('addPlayer'));
    add.disabled = full || over;
    add.title = over ? 'The game is over'
      : full ? `The game is full: Munchkin is for up to ${MAX_PLAYERS} players` : 'Add a player';
    board.classList.toggle('over', over);
    fitRows(board, view.players.length);
    renderBoard(board, view.players, flashIds);
  }

  // ----- the end of the game -----

  async function showWin() {
    const gameId = view.game.id;
    winOpen = true;
    const story = await loadWinStory(gameId, view.players);
    if (!active || view.game.id !== gameId || !isOver()) {             // undone or switched meanwhile
      winOpen = false;
      return;
    }
    const who = story.winners.map((p) => escapeHtml(p.name)).join(' & ');
    const result = await openDialog({
      title: '',
      className: 'win-sheet',
      body: winHtml(story, `${who} ${story.winners.length > 1 ? 'win' : 'wins'}!`),
      ok: null,
      cancel: null,
      closeX: true,
      buttons: [{ value: 'undo', label: '↩ Undo' }, { value: 'report', label: '📈 Report' }, { value: 'lobby', label: '🎲 All games', primary: true }],
    });
    winOpen = false;
    if (result?.button === 'undo') send({ type: 'undoWin' });
    else if (result?.button === 'report') showReport(gameId);
    else if (result?.button === 'lobby') openLobby();
  }

  // Opens by itself once per win; after that, tapping the (locked) board brings it back.
  function watchWin() {
    const key = isOver() ? `${view.game.id}:${winnersOf(view.players).map((p) => p.id).join(',')}` : null;
    if (!key && winOpen) closeDialog();          // undone from a phone
    if (key && key !== shownWin) showWin();
    shownWin = key;
  }

  function react() {
    // One sound per update: news (death, win, level 9…) beats a plain level change.
    const news = active.ticker.update(view);
    const levelChange = active.levels.update(view.game.id, view.players);
    if (news) sounds.play(NEWS_SOUNDS[news]);
    else if (levelChange) sounds.play(LEVEL_SOUNDS[levelChange]);
  }

  // the window, or the top bar when the announcer wraps onto more lines
  keepRowsFitted(board, () => view.players.length);

  // ----- player rows -----

  board.addEventListener('click', async (e) => {
    if (isOver()) {
      if (!winOpen) showWin();
      return;
    }
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
      case 'setSex':
        send({ type: 'setSex', playerId, sex: button.dataset.sex });
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
  $('report').addEventListener('click', () => showReport(view.game.id));

  $('addPlayer').addEventListener('click', async () => {
    const player = await askNewPlayer();
    if (player) send({ type: 'addPlayer', ...player });
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
      watchWin();
    },

    show() {
      if (active) return;
      active = { ticker: new Ticker($('announcer')), levels: new LevelWatcher() };
      shownWin = null;        // opening a finished game shows its popup
      render();
      react();                // the first update only learns the table: no sounds
      watchWin();
      openSoundTestFromHash();
    },

    hide() {
      if (!active) return;
      active.ticker.stop();
      active = null;
      if (winOpen) closeDialog();
      qrOverlay.classList.remove('open');
    },
  };
}
