// Phone controls: pick (or create) your player, then change your own level, gear, avatar and sex.
import { sendAction, setActionSource, subscribe } from '../shared/api.js';
import { avatarHtml, avatarLabel } from '../shared/avatars.js';
import { choiceHtml, openDialog } from '../shared/dialog.js';
import { $, closest, escapeHtml, input, restartAnimation } from '../shared/dom.js';
import { formatGear } from '../shared/format.js';
import {
  AVATAR_IDS, MAX_LEVEL, MIN_LEVEL, otherSex, SEX_LABELS, strengthOf,
} from '../shared/rules.js';
import { SEX_ICON_OPTIONS, sexIcon } from '../shared/sex-icons.js';
import { storage } from '../shared/storage.js';
import { showMyReport } from './report.js';

const PLAYER_KEY = 'playerId';   // remembered per phone

setActionSource('phone');

/** @type {import('../shared/rules.js').Player[]} */
let players = [];
/** @type {import('../shared/rules.js').View | null} */
let view = null;
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
        <button data-player="${p.id}">
          ${avatarHtml(p.avatar, { className: 'list-avatar' })}
          <span class="player-name">${escapeHtml(p.name)}</span>
          <span class="sex-icon ${p.sex}" title="${SEX_LABELS[p.sex]}">${sexIcon(p.sex)}</span>
        </button>`).join('')
    : '<p class="hint">No players yet — enter your name below.</p>';
}

function renderPlayer(player) {
  const won = player.level >= MAX_LEVEL;
  $('avatarButton').innerHTML = avatarHtml(player.avatar);
  $('playerName').textContent = player.name;
  const sexButton = $('sexButton');
  sexButton.innerHTML = sexIcon(player.sex);
  sexButton.className = `sex-icon ${player.sex}`;
  sexButton.title = `${SEX_LABELS[player.sex]} (tap to change sex)`;
  $('strength').textContent = String(strengthOf(player));
  $('level').textContent = String(player.level);
  $('gear').textContent = formatGear(player.gear);
  $('levelLabel').textContent = won ? '👑 Level 10 — You win!' : 'Level';
  $('levelPanel').classList.toggle('won', won);
  input('levelDown').disabled = player.level <= MIN_LEVEL;
  input('levelUp').disabled = player.level >= MAX_LEVEL;
  // Each avatar belongs to one player per game: the ones others have can't be picked
  const owners = new Map(players.filter((p) => p.id !== player.id).map((p) => [p.avatar, p.name]));
  for (const button of /** @type {NodeListOf<HTMLButtonElement>} */ ($('avatarGrid').querySelectorAll('button'))) {
    const id = button.dataset.avatar;
    const owner = owners.get(id);
    button.classList.toggle('selected', id === player.avatar);
    button.classList.toggle('taken', Boolean(owner));
    button.disabled = Boolean(owner);
    button.title = owner ? `${avatarLabel(id)}: ${owner} has it` : avatarLabel(id);
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
  const button = closest(e, '[data-player]');
  if (button) choosePlayer(button.dataset.player);
});

$('newSex').innerHTML = choiceHtml('newSex', [...SEX_ICON_OPTIONS], { className: 'icons' });

$('joinForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = input('newName');
  const sex = /** @type {HTMLInputElement} */ ($('joinForm').querySelector('input[name="newSex"]:checked')).value;
  const player = await sendAction({ type: 'addPlayer', name: name.value, sex }).catch(() => null);
  if (!player) return;
  name.value = '';
  choosePlayer(player.id);
});

$('switchPlayer').addEventListener('click', () => choosePlayer(null));

// ----- controls -----

for (const button of /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('button[data-action]'))) {
  button.addEventListener('click', () => {
    send({ type: button.dataset.action, playerId: myId, delta: Number(button.dataset.delta) });
  });
}

$('sexButton').addEventListener('click', () => {
  const player = me();
  if (player) send({ type: 'setSex', playerId: myId, sex: otherSex(player.sex) });
});

$('avatarButton').addEventListener('click', () => {
  $('avatarGrid').hidden = !$('avatarGrid').hidden;
});

$('avatarGrid').addEventListener('click', (e) => {
  const button = closest(e, '[data-avatar]');
  if (!button) return;
  send({ type: 'setAvatar', playerId: myId, avatar: button.dataset.avatar });
  $('avatarGrid').hidden = true;
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

$('avatarGrid').innerHTML = AVATAR_IDS.map((id) => `
  <button data-avatar="${id}" title="${avatarLabel(id)}" aria-label="${avatarLabel(id)}">${avatarHtml(id)}</button>`).join('');

$('report').addEventListener('click', () => { if (view) showMyReport(view, myId); });

subscribe((next) => {
  view = next;
  players = next.players;
  render();
});
