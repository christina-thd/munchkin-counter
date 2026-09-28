// Game-list helpers shared by the start page and the dashboard.
import { openDialog } from './dialog.js';
import { escapeHtml } from './dom.js';
import { plural } from './format.js';
import { MAX_GAME_NAME, MAX_LEVEL } from './rules.js';

const formatDate = (time) => new Date(time).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** "28 Sep, 19:24 · 4 players · 👑 🧙 Ana lvl 10" */
export function describeGame(game) {
  const leader = game.leader
    ? ` · ${game.leader.level >= MAX_LEVEL ? '👑' : 'top'} ${escapeHtml(game.leader.emoji)} ${escapeHtml(game.leader.name)} lvl ${game.leader.level}`
    : '';
  return `${formatDate(game.createdAt)} · ${game.playerCount} ${plural(game.playerCount, 'player')}${leader}`;
}

/** @returns {Promise<{name: string, keepPlayers: boolean} | null>} */
export async function askNewGame(view) {
  const result = await openDialog({
    title: 'New game',
    ok: 'Start game',
    body: `<p class="note">"${escapeHtml(view.game.name)}" stays in the game list — you can go back to it any time.</p>`,
    input: { value: `Game ${view.games.length + 1}`, placeholder: 'Game name', maxLength: MAX_GAME_NAME },
    check: view.players.length
      ? { label: `Same players as "${escapeHtml(view.game.name)}" (back to level 1, no gear)`, checked: true }
      : null,
  });
  return result && { name: result.value, keepPlayers: Boolean(result.checked) };
}

export async function confirmDeleteGame(game) {
  return Boolean(await openDialog({
    title: 'Delete game?',
    ok: 'Delete',
    danger: true,
    body: `<p>Delete <b>${escapeHtml(game.name)}</b> and its ${game.playerCount} ${plural(game.playerCount, 'player')}? This can't be undone.</p>`,
  }));
}
