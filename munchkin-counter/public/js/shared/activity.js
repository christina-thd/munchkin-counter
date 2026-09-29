// Activity log dialog: what happened in a game, newest first. Opened from the dashboard.
import { fetchLog } from './api.js';
import { openDialog } from './dialog.js';
import { $, escapeHtml } from './dom.js';
import { formatGear, plural } from './format.js';
import { MAX_LEVEL } from './rules.js';

const SOURCE_LABELS = { dashboard: 'Tablet', phone: 'Phone' };

const who = (e) => `<b>${escapeHtml(e.emoji ?? '')} ${escapeHtml(e.name ?? 'Someone')}</b>`;
const arrow = (from, to) => `<span class="${to > from ? 'up' : 'down'}">${to > from ? '▲' : '▼'}</span>`;

/** One entry as a line of HTML. Pure, so it can be tested. */
export function describeEntry(e) {
  switch (e.kind) {
    case 'start':
      return e.kept
        ? `🎲 Game started with the same ${e.kept} ${plural(e.kept, 'player')}`
        : '🎲 Game started';
    case 'join':
      return `${who(e)} joined`;
    case 'remove':
      return `${who(e)} was removed`;
    case 'rename':
      return `<b>${escapeHtml(e.from)}</b> is now called ${who(e)}`;
    case 'emoji':
      return `<b>${escapeHtml(e.name)}</b> changed emoji ${escapeHtml(e.from)} → ${escapeHtml(e.to)}`;
    case 'level':
      return `${who(e)} ${arrow(e.from, e.to)} level ${e.from} → ${e.to}${e.to >= MAX_LEVEL ? ' 👑' : ''}`;
    case 'gear':
      return `${who(e)} ${arrow(e.from, e.to)} gear ${formatGear(e.from)} → ${formatGear(e.to)}`;
    case 'death':
      return e.from ? `💀 ${who(e)} died and lost ${formatGear(e.from)} gear` : `💀 ${who(e)} died`;
    default:
      return escapeHtml(e.kind);
  }
}

function formatTime(at) {
  const date = new Date(at);
  const today = new Date().toDateString() === date.toDateString();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return today ? time : `${date.toLocaleDateString([], { day: 'numeric', month: 'short' })} ${time}`;
}

function listHtml(entries) {
  if (!entries.length) return '<p class="note">Nothing has happened in this game yet.</p>';
  return [...entries].reverse().map((e) => `
    <div class="entry">
      <span class="time">${formatTime(e.at)}</span>
      <span class="what">${describeEntry(e)}</span>
      ${e.source ? `<span class="source">${SOURCE_LABELS[e.source] ?? ''}</span>` : ''}
    </div>`).join('');
}

let openGameId = null;   // the game whose log is on screen, if any

async function renderList() {
  const list = $('activityList');
  if (!list || !openGameId) return;
  try {
    const { entries } = await fetchLog(openGameId);
    if (openGameId && $('activityList')) $('activityList').innerHTML = listHtml(entries);
  } catch (err) {
    list.innerHTML = `<p class="note">${escapeHtml(err.message)}</p>`;
  }
}

/** Opens the activity log of a game. */
export async function showActivityLog(gameId, gameName) {
  openGameId = gameId;
  const closed = openDialog({
    title: `📜 ${escapeHtml(gameName)}`,
    ok: null,
    cancel: 'Close',
    body: `<p class="note">Everything that happened in this game, newest first.
             Quick taps in a row in the same direction are shown as one change.</p>
           <div class="activity" id="activityList"><p class="note">Loading…</p></div>`,
  });
  renderList();
  await closed;
  if (openGameId === gameId) openGameId = null;
}

/** Call on every live update, so an open log shows new entries straight away. */
export function refreshActivityLog() {
  if (openGameId) renderList();
}
