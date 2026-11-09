// Dialogs used by the dashboard.
import { avatarHtml } from '../shared/avatars.js';
import { openDialog } from '../shared/dialog.js';
import { $, closest, escapeHtml } from '../shared/dom.js';
import { formatGear } from '../shared/format.js';
import { MAX_PLAYER_NAME, strengthOf } from '../shared/rules.js';
import { SEX_OPTIONS } from '../shared/sex-icons.js';
import { TUNES } from './tunes.js';
import { SOUND_TEST } from './sounds.js';

const playerLabel = (p) => `<b>${avatarHtml(p.avatar, { inline: true })} ${escapeHtml(p.name)}</b>`;

/** @returns {Promise<{ name: string, sex: string } | null>} the new player, or null if cancelled */
export async function askNewPlayer() {
  const result = await openDialog({
    title: 'Add player',
    ok: 'Add',
    input: { placeholder: 'Player name', maxLength: MAX_PLAYER_NAME },
    choice: { options: [...SEX_OPTIONS] },
  });
  return result && { name: result.value, sex: result.choice };
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
/** @returns {Promise<unknown>} settles when the dialog closes */
export function showSoundTest(soundboard) {
  const done = openDialog({
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
    const button = closest(e, '[data-sound]');
    if (!button) return;
    soundboard.unlock();
    setTimeout(() => soundboard.play(button.dataset.sound, { force: true }), 30);
  });
  return done;
}

/**
 * The #music test page: listen to every tune. A tune plays from its start and repeats until another is picked
 * or the dialog closes.
 * @param {import('./music.js').Music} music
 */
export async function showMusicTest(music) {
  const done = openDialog({
    title: '🎵 Music',
    ok: null,
    cancel: 'Close',
    body: `<p class="note">Tap a tune to hear it from the start; tap it again to stop. During a game they play shuffled.</p>
      <div class="list tunes">${TUNES.map((tune, i) => `
        <button class="list-item" data-tune="${i}"><span class="text">
          <span class="title">▶ ${escapeHtml(tune.name)}</span><span class="meta">${tune.beats}/4 · ${tune.tempo} bpm</span>
        </span></button>`).join('')}
      </div>`,
  });
  const sheet = $('sheet');
  let playing = null;
  sheet.querySelector('.tunes').addEventListener('click', (e) => {
    const button = closest(e, '[data-tune]');
    if (!button) return;
    const index = Number(button.dataset.tune);
    playing = playing === index ? null : index;          // tapping the playing tune stops it
    music.audition(playing);
    for (const b of /** @type {NodeListOf<HTMLElement>} */ (sheet.querySelectorAll('[data-tune]'))) {
      const on = Number(b.dataset.tune) === playing;
      b.classList.toggle('playing', on);
      b.querySelector('.title').textContent = `${on ? '■' : '▶'} ${TUNES[Number(b.dataset.tune)].name}`;
    }
  });
  await done;
  music.audition(null);
}
