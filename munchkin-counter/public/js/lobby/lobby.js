// Start page: continue the current game, start a new one, or reopen / delete a past game.
import { sendAction } from '../shared/api.js';
import { $, closest, escapeHtml } from '../shared/dom.js';
import { askNewGame, confirmDeleteGame, describeGame } from '../shared/games.js';

/** @typedef {import('../shared/rules.js').View} View */

/**
 * @param {{ openDashboard: () => void }} options  switches the page to the dashboard view
 * @returns {{ update(view: View): void }}
 */
export function createLobby({ openDashboard }) {
  /** @type {View | null} */
  let view = null;

  function send(action) {
    return sendAction(action).catch((err) => {
      console.warn(`${action.type} failed:`, err.message);
      throw err;
    });
  }

  function renderCurrent() {
    const current = view.games.find((g) => g.id === view.game.id);
    $('continue').hidden = false;
    $('currentName').textContent = view.game.name;
    $('currentPlayers').innerHTML = view.players.length
      ? view.players.map((p) => `<span title="${escapeHtml(p.name)}">${escapeHtml(p.emoji)}</span>`).join('')
      : '<span class="none">No players yet</span>';
    $('currentMeta').innerHTML = describeGame(current);
  }

  function renderHistory() {
    const past = [...view.games].reverse().filter((g) => g.id !== view.game.id);
    $('games').innerHTML = past.length
      ? past.map((g) => `
          <div class="game">
            <div class="text">
              <div class="title">${escapeHtml(g.name)}</div>
              <div class="meta">${describeGame(g)}</div>
            </div>
            <button class="open" data-open="${g.id}">Open</button>
            <button class="delete" data-delete="${g.id}" title="Delete game" aria-label="Delete game">🗑</button>
          </div>`).join('')
      : '<p class="empty">No past games yet. Finished games show up here.</p>';
  }

  $('continueButton').addEventListener('click', openDashboard);

  $('newGame').addEventListener('click', async () => {
    if (!view) return;
    const choice = await askNewGame(view);
    if (!choice) return;
    await send({ type: 'newGame', ...choice });
    openDashboard();
  });

  $('games').addEventListener('click', async (e) => {
    const open = closest(e, '[data-open]');
    const del = closest(e, '[data-delete]');
    if (open) {
      await send({ type: 'switchGame', gameId: open.dataset.open });
      openDashboard();
    } else if (del) {
      const game = view.games.find((g) => g.id === del.dataset.delete);
      if (game && await confirmDeleteGame(game)) send({ type: 'deleteGame', gameId: game.id });
    }
  });

  return {
    update(next) {
      view = next;
      renderCurrent();
      renderHistory();
    },
  };
}
