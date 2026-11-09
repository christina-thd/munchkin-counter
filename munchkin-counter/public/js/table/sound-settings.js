// The sound popup (dashboard and start page): sound effects on/off, music on/off, the music's volume, and
// skipping to the next song.
// It works with a touch screen and with a TV remote: the arrow keys move between the rows (left / right change
// the volume), OK / Enter presses, Back / Esc closes, and the focused control has a clear outline.
import { closeDialog, openDialog } from '../shared/dialog.js';
import { $ } from '../shared/dom.js';
import { ICONS } from '../shared/icons.js';
import { VOLUME_STEPS } from './music.js';

/** @typedef {import('./music.js').Music} Music */
/** @typedef {import('./sounds.js').Soundboard} Soundboard */

const BACK_KEYS = ['Escape', 'Backspace', 'GoBack', 'BrowserBack'];

/**
 * @param {{ sounds: Soundboard, music: Music, onChange: () => void }} options  onChange: after any change
 *        (to update the speaker buttons)
 */
export async function showSoundSettings({ sounds, music, onChange }) {
  const done = openDialog({
    title: `${ICONS.speaker} Sound`,
    ok: null,
    cancel: 'Close',
    className: 'sound-sheet',
    body: `
      <div class="sound-settings">
        <button type="button" class="sound-toggle" id="toggleEffects"></button>
        <button type="button" class="sound-toggle" id="toggleMusic"></button>
        <div class="volume-row" role="group" aria-label="Music volume">
          <span class="volume-label">Music volume</span>
          <button type="button" class="volume-step" id="volumeDown" aria-label="Quieter">${ICONS.minus}</button>
          <div class="volume-bar" aria-hidden="true">${'<span></span>'.repeat(VOLUME_STEPS)}</div>
          <button type="button" class="volume-step" id="volumeUp" aria-label="Louder">${ICONS.plus}</button>
        </div>
        <div class="now-row">
          <span class="now-text"><span class="now-label">Now playing</span><span class="now-name" id="nowPlaying"></span></span>
          <button type="button" class="volume-step" id="nextSong" aria-label="Next song" title="Next song">${ICONS.next}</button>
        </div>
      </div>`,
  });
  const sheet = $('sheet');

  const render = () => {
    const toggle = (id, icon, label, on) => {
      const button = $(id);
      button.innerHTML = `<span class="sound-name">${icon} ${label}</span><span class="sound-state">${on ? 'On' : 'Off'}</span>`;
      button.setAttribute('aria-pressed', String(on));
      button.classList.toggle('on', on);
    };
    toggle('toggleEffects', ICONS.speaker, 'Sound effects', sounds.enabled);
    toggle('toggleMusic', ICONS.music, 'Music', music.enabled);
    sheet.querySelectorAll('.volume-bar span').forEach((step, i) => step.classList.toggle('lit', i < music.volume));
    sheet.querySelector('.volume-row').classList.toggle('muted', !music.enabled);
    sheet.querySelector('.volume-row').setAttribute('aria-valuetext', `${music.volume} of ${VOLUME_STEPS}`);
    const playing = music.current;
    $('nowPlaying').textContent = playing ?? (music.enabled ? 'Starting…' : 'Music is off');
    /** @type {HTMLButtonElement} */ ($('nextSong')).disabled = !playing;
    onChange();
  };
  const changeVolume = (by) => {
    music.volume += by;
    if (by > 0 && !music.enabled) music.enabled = true;     // turning it up means: let me hear it
    render();
  };

  $('toggleEffects').addEventListener('click', () => {
    sounds.enabled = !sounds.enabled;
    sounds.unlock();
    if (sounds.enabled) setTimeout(() => sounds.play('beep'), 50);
    render();
  });
  $('toggleMusic').addEventListener('click', () => {
    music.enabled = !music.enabled;
    render();
  });
  $('volumeDown').addEventListener('click', () => changeVolume(-1));
  $('volumeUp').addEventListener('click', () => changeVolume(1));
  $('nextSong').addEventListener('click', () => {
    music.next();
    render();
  });
  // the song changes on its own (and starts a moment after the music is turned on): keep the name current
  const refresh = setInterval(render, 1000);

  // A TV remote: up / down between the rows, left / right for the volume, Back to close.
  // The sheet is shared by every dialog, so the listener goes when this one closes.
  const listening = new AbortController();
  const rows = () => [$('toggleEffects'), $('toggleMusic'), $('volumeUp'), $('nextSong'), $('dialogCancel')]
    .filter((b) => !/** @type {HTMLButtonElement} */ (b).disabled);
  sheet.addEventListener('keydown', (e) => {
    const focused = /** @type {HTMLElement} */ (document.activeElement);
    const list = rows();
    const at = list.indexOf(focused === $('volumeDown') ? $('volumeUp') : focused);
    if (BACK_KEYS.includes(e.key)) {
      e.preventDefault();
      closeDialog();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = at < 0 ? 0 : (at + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length;
      list[next].focus();
    } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && focused.closest('.volume-row')) {
      e.preventDefault();
      changeVolume(e.key === 'ArrowRight' ? 1 : -1);
      $(e.key === 'ArrowRight' ? 'volumeUp' : 'volumeDown').focus();
    }
  }, { signal: listening.signal });

  render();
  $('toggleEffects').focus();          // a remote needs something focused to start from
  await done;
  listening.abort();
  clearInterval(refresh);
}
