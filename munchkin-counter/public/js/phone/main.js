// Phone controls: pick (or create) your player, then change your own level, gear and emoji.
import { fetchInfo, sendAction, setActionSource, subscribe } from '../shared/api.js';
import { openDialog } from '../shared/dialog.js';
import { $, escapeHtml, restartAnimation } from '../shared/dom.js';
import { formatGear } from '../shared/format.js';
import { MAX_LEVEL, MIN_LEVEL, strengthOf } from '../shared/rules.js';
import { storage } from '../shared/storage.js';

const PLAYER_KEY = 'playerId';   // remembered per phone

setActionSource('phone');

let players = [];
let myId = storage.get(PLAYER_KEY);

const me = () => players.find((p) => p.id === myId);

function send(action) {
  return sendAction(action).catch((err) => console.warn(`${action.type} failed:`, err.message));
}

function choosePlayer(id) {
  myId = id;
  storage.set(PLAYER_KEY, id);
  render();
}

// ----- rendering -----

function renderPicker() {
  $('playerList').innerHTML = players.length
    ? players.map((p) => `
        <button data-player="${p.id}"><span class="emoji">${escapeHtml(p.emoji)}</span>${escapeHtml(p.name)}</button>`).join('')
    : '<p class="hint">No players yet — enter your name below.</p>';
}

function renderPlayer(player) {
  const won = player.level >= MAX_LEVEL;
  $('emojiButton').textContent = player.emoji;
  $('playerName').textContent = player.name;
  $('strength').textContent = strengthOf(player);
  $('level').textContent = player.level;
  $('gear').textContent = formatGear(player.gear);
  $('levelLabel').textContent = won ? '👑 Level 10 — You win!' : 'Level';
  $('levelPanel').classList.toggle('won', won);
  $('levelDown').disabled = player.level <= MIN_LEVEL;
  $('levelUp').disabled = player.level >= MAX_LEVEL;
  for (const button of $('emojiGrid').children) {
    button.classList.toggle('selected', button.dataset.emoji === player.emoji);
  }
}

function render() {
  const player = me();
  $('pickView').hidden = Boolean(player);
  $('playView').hidden = !player;
  if (player) renderPlayer(player);
  else renderPicker();
}

// ----- picking a player -----

$('playerList').addEventListener('click', (e) => {
  const button = e.target.closest('[data-player]');
  if (button) choosePlayer(button.dataset.player);
});

$('joinForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = $('newName');
  const player = await sendAction({ type: 'addPlayer', name: input.value }).catch(() => null);
  if (!player) return;
  input.value = '';
  choosePlayer(player.id);
});

$('switchPlayer').addEventListener('click', () => choosePlayer(null));

// ----- controls -----

for (const button of document.querySelectorAll('[data-action]')) {
  button.addEventListener('click', () => {
    send({ type: button.dataset.action, playerId: myId, delta: Number(button.dataset.delta) });
  });
}

$('emojiButton').addEventListener('click', () => {
  $('emojiGrid').hidden = !$('emojiGrid').hidden;
});

$('emojiGrid').addEventListener('click', (e) => {
  const button = e.target.closest('[data-emoji]');
  if (!button) return;
  send({ type: 'setEmoji', playerId: myId, emoji: button.dataset.emoji });
  $('emojiGrid').hidden = true;
});

$('died').addEventListener('click', async () => {
  const player = me();
  if (!player) return;
  const confirmed = await openDialog({
    title: '💀 You died?',
    ok: '💀 Yes, died',
    danger: true,
    body: `<p>In Munchkin you <b>keep your level</b> but <b>lose all your gear</b>.</p>
           <p class="note">Level ${player.level} stays · Gear ${formatGear(player.gear)} → 0 · Strength ${strengthOf(player)} → ${player.level}</p>`,
  });
  if (!confirmed) return;
  send({ type: 'die', playerId: myId });
  for (const panel of document.querySelectorAll('.panel')) restartAnimation(panel, 'died');
});

// ----- start -----

fetchInfo().then(({ emojis }) => {
  $('emojiGrid').innerHTML = emojis.map((e) => `<button data-emoji="${e}">${e}</button>`).join('');
  render();
});

subscribe((view) => {
  players = view.players;
  render();
});
