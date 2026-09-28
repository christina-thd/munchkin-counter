// Dashboard (tablet / TV): wires the server view to the board, announcer and sounds.
import { fetchInfo, sendAction, subscribe } from '../shared/api.js';
import { $ } from '../shared/dom.js';
import { LevelWatcher } from './announcer.js';
import { renderBoard } from './board.js';
import { askPlayerName, confirmDeath, confirmRemovePlayer, showSoundTest } from './dialogs.js';
import { fitRows } from './sizing.js';
import { LEVEL_SOUNDS, NEWS_SOUNDS, Soundboard } from './sounds.js';
import { Ticker } from './ticker.js';

const DEATH_FLASH_MS = 1600;

const board = $('board');
const ticker = new Ticker($('announcer'));
const levels = new LevelWatcher();
const sounds = new Soundboard();
const flashIds = new Set();   // players who just died: their row flashes red

let view = { game: {}, players: [], games: [] };

function send(action) {
  return sendAction(action).catch((err) => console.warn(`${action.type} failed:`, err.message));
}

function render() {
  $('gameName').textContent = view.game.name ?? '';
  fitRows(board, view.players.length);
  renderBoard(board, view.players, flashIds);
}

subscribe((next) => {
  view = next;
  render();
  // One sound per update: news (death, win, level 9…) beats a plain level change.
  const news = ticker.update(view);
  const levelChange = levels.update(view.game.id, view.players);
  if (news) sounds.play(NEWS_SOUNDS[news]);
  else if (levelChange) sounds.play(LEVEL_SOUNDS[levelChange]);
});

addEventListener('resize', () => fitRows(board, view.players.length));

// ----- player rows -----

board.addEventListener('click', async (e) => {
  const button = e.target.closest('button[data-action]');
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
const openSoundTestFromHash = () => { if (location.hash === '#sounds') showSoundTest(sounds); };
addEventListener('hashchange', openSoundTestFromHash);
openSoundTestFromHash();
