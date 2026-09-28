// Dialogs used by the dashboard.
import { openDialog } from '../shared/dialog.js';
import { $, escapeHtml } from '../shared/dom.js';
import { formatGear } from '../shared/format.js';
import { MAX_PLAYER_NAME, strengthOf } from '../shared/rules.js';
import { SOUND_TEST } from './sounds.js';

const playerLabel = (p) => `<b>${escapeHtml(p.emoji)} ${escapeHtml(p.name)}</b>`;

/** @returns {Promise<string|null>} the name, or null if cancelled */
export async function askPlayerName() {
  const result = await openDialog({
    title: 'Add player',
    ok: 'Add',
    input: { placeholder: 'Player name', maxLength: MAX_PLAYER_NAME },
  });
  return result && result.value;
}

export async function confirmRemovePlayer(player, gameName) {
  return Boolean(await openDialog({
    title: 'Remove player?',
    ok: 'Remove',
    danger: true,
    body: `<p>Remove ${playerLabel(player)} from <b>${escapeHtml(gameName)}</b>? Their level and gear will be lost.</p>`,
  }));
}

export async function confirmDeath(player) {
  return Boolean(await openDialog({
    title: `💀 ${escapeHtml(player.name)} died?`,
    ok: '💀 Yes, died',
    danger: true,
    body: `<p>In Munchkin, when you die you <b>keep your level</b> but <b>lose all your gear</b>.</p>
           <p class="note">Level ${player.level} stays · Gear ${formatGear(player.gear)} → 0 · Strength ${strengthOf(player)} → ${player.level}</p>`,
  }));
}

/** Lists every sound so it can be heard (open the dashboard with #sounds). */
export function showSoundTest(soundboard) {
  openDialog({
    title: '🔊 Sound test',
    ok: null,
    cancel: 'Close',
    body: `<p class="note">Tap to listen. During a game, only news makes a sound.</p>
      <div class="list">${SOUND_TEST.map(([name, label]) => `
        <button class="list-item" data-sound="${name}">
          <span class="text"><span class="title">▶ ${label}</span><span class="meta">${name}</span></span>
        </button>`).join('')}
      </div>`,
  });
  $('sheet').querySelector('.list').addEventListener('click', (e) => {
    const button = e.target.closest('[data-sound]');
    if (!button) return;
    soundboard.unlock();
    setTimeout(() => soundboard.play(button.dataset.sound, { force: true }), 30);
  });
}
