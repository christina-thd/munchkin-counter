// The player rows of the dashboard.
import { escapeHtml } from '../shared/dom.js';
import { formatGear } from '../shared/format.js';
import { MAX_LEVEL, MIN_LEVEL, strengthOf } from '../shared/rules.js';

const EMPTY = `
  <div class="empty">
    <img src="qr.svg" alt="QR code to join">
    Scan to join from your phone<br>or tap <b>+ Player</b>
  </div>`;

function levelTrack(player) {
  return Array.from({ length: MAX_LEVEL }, (_, i) => {
    const level = i + 1;
    const classes = ['pip', level <= player.level && 'on', level === player.level && 'current'].filter(Boolean).join(' ');
    return `<button class="${classes}" data-action="setLevel" data-player="${player.id}" data-level="${level}">${level === MAX_LEVEL ? '👑' : level}</button>`;
  }).join('');
}

function stepper({ label, className, action, player, value, canDown = true, canUp = true }) {
  return `
    <div class="stepper ${className}">
      <div class="label">${label}</div>
      <div class="controls">
        <button class="pm minus" data-action="${action}" data-player="${player.id}" data-delta="-1" ${canDown ? '' : 'disabled'} aria-label="${label} down"></button>
        <span class="value">${value}</span>
        <button class="pm plus" data-action="${action}" data-player="${player.id}" data-delta="1" ${canUp ? '' : 'disabled'} aria-label="${label} up"></button>
      </div>
    </div>`;
}

function rowHtml(player, { rank, leading, flash }) {
  const won = player.level >= MAX_LEVEL;
  const classes = ['player', won ? 'won' : leading && 'leading', flash && 'died'].filter(Boolean).join(' ');
  return `
    <div class="${classes}">
      <button class="remove" data-action="removePlayer" data-player="${player.id}" title="Remove player" aria-label="Remove player">✕</button>
      <div class="avatar"><span class="emoji">${escapeHtml(player.emoji)}</span><span class="rank">${rank}</span></div>
      <div class="identity">
        <div class="name-line"><span class="name">${escapeHtml(player.name)}</span>${won ? '<span class="tag">WINNER</span>' : ''}</div>
        <div class="track-line">
          <div class="track" title="Tap a number to set the level">${levelTrack(player)}</div>
          <button class="die" data-action="die" data-player="${player.id}" title="This player died" aria-label="Died">💀</button>
        </div>
      </div>
      ${stepper({ label: 'Level', className: 'level', action: 'changeLevel', player, value: player.level,
                  canDown: player.level > MIN_LEVEL, canUp: player.level < MAX_LEVEL })}
      ${stepper({ label: 'Gear', className: 'gear', action: 'changeGear', player, value: formatGear(player.gear) })}
      <div class="strength"><span>Strength</span><b>${strengthOf(player)}</b></div>
    </div>`;
}

/**
 * Renders all players. Rows keep join order so buttons never move under a finger;
 * the rank badge shows position by level (ties share a rank).
 * @param {Set<string>} flashIds  players to flash red (they just died)
 */
export function renderBoard(el, players, flashIds = new Set()) {
  if (!players.length) {
    el.innerHTML = EMPTY;
    return;
  }
  const levels = players.map((p) => p.level).sort((a, b) => b - a);
  const top = levels[0];
  el.innerHTML = players.map((p) => rowHtml(p, {
    rank: levels.indexOf(p.level) + 1,
    leading: p.level === top && players.length > 1,
    flash: flashIds.has(p.id),
  })).join('');
}
