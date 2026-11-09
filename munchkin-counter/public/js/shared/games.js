// Game-list helpers shared by the start page and the dashboard.
import { openDialog } from './dialog.js';
import { escapeHtml } from './dom.js';
import { dungeonName } from './dungeon-names.js';
import { plural } from './format.js';
import { MAX_GAME_NAME } from './rules.js';

const formatDate = (time) => new Date(time).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/**
 * A game's date, players and winner as HTML: "28 Sep, 19:24", "4 players", "👑 Ana" (null while nobody won).
 * @param {import('./rules.js').GameSummary} game
 */
export function gameFacts(game) {
  return {
    date: formatDate(game.createdAt),
    players: `${game.playerCount} ${plural(game.playerCount, 'player')}`,
    winner: game.winners?.length ? `👑 ${game.winners.map(escapeHtml).join(' & ')}` : null,
  };
}

/** "28 Sep, 19:24 · 4 players" */
export function describeGame(game) {
  const { date, players } = gameFacts(game);
  return `${date} · ${players}`;
}

/** @returns {Promise<{name: string, keepPlayers: boolean} | null>} */
export async function askNewGame(view) {
  const taken = view.games.map((g) => g.name);
  const result = await openDialog({
    title: 'New dungeon',
    ok: 'Enter the dungeon',
    input: {
      value: dungeonName(taken), placeholder: 'Game name', maxLength: MAX_GAME_NAME,
      suggest: (current) => dungeonName(taken, current),
    },
    check: view.players.length
      ? {
        label: `<span>Same players as "${escapeHtml(view.game.name)}"
                <small class="check-detail">${view.players.map((p) => escapeHtml(p.name)).join(', ')}</small></span>`,
        checked: true,
      }
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
