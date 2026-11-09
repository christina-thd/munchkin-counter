// Start page: continue the current game, start a new one, or reopen / delete a past game (🕘 recap a finished one,
// ▶ resume one nobody won yet); 📈 shows any game's report.
import { sendAction } from '../shared/api.js';
import { avatarHtml } from '../shared/avatars.js';
import { $, closest, escapeHtml } from '../shared/dom.js';
import { askNewGame, confirmDeleteGame, describeGame, gameFacts } from '../shared/games.js';
import { winnersOf } from '../shared/rules.js';
import { showReport } from '../table/report.js';

/** @typedef {import('../shared/rules.js').View} View */

const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>';
// drawn rather than 🗑, which stays gray: this one takes the Delete button's color
const TRASH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 3h4M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>';
// a clock with an arrow going back: look back at how the game went
const HISTORY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v4l2.5 2.5M3.05 11a9 9 0 1 1 .5 4M3.5 20v-5h5"/></svg>';

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

  // A finished game (someone reached level 10) is history: it moves from Continue to the past games,
  // and + New dungeon becomes the main button.
  const finished = () => winnersOf(view.players).length > 0;

  function renderCurrent() {
    const current = view.games.find((g) => g.id === view.game.id);
    $('continue').hidden = finished();
    $('newGame').classList.toggle('primary', finished());
    $('currentName').textContent = view.game.name;
    $('currentPlayers').innerHTML = view.players.length
      ? view.players.map((p) => `<span title="${escapeHtml(p.name)}">${avatarHtml(p.avatar)}</span>`).join('')
      : '<span class="none">No players yet</span>';
    $('currentMeta').innerHTML = describeGame(current);
  }

  // the date, then the players with the winner
  function gameLines(game) {
    const { date, players, winner } = gameFacts(game);
    return `<div class="meta">${date}</div><div class="meta">${[players, winner].filter(Boolean).join(' · ')}</div>`;
  }

  // before the name: ▶ resumes a game nobody won yet, 🕘 recaps a finished one (tapping the name does the same)
  function openButton(game) {
    const [label, icon] = game.winners.length ? ['Recap', HISTORY] : ['Resume', PLAY];
    return `<button class="go ${game.winners.length ? 'recap' : 'resume'}" data-open="${game.id}"
              title="${label}" aria-label="${label}">${icon}</button>`;
  }

  function renderHistory() {
    const past = [...view.games].reverse().filter((g) => g.id !== view.game.id || finished());
    $('games').innerHTML = past.length
      ? past.map((g) => `
          <div class="game">
            ${openButton(g)}
            <div class="text" data-open="${g.id}">
              <div class="title">${escapeHtml(g.name)}</div>
              ${gameLines(g)}
            </div>
            <button class="report" data-report="${g.id}" title="Game report: levels over time">📈 Report</button>
            <button class="delete" data-delete="${g.id}" title="Delete this game" aria-label="Delete this game">${TRASH}</button>
          </div>`).join('')
      : '<p class="empty">No past games yet. Finished games show up here.</p>';
  }

  $('continueButton').addEventListener('click', openDashboard);
  $('currentReport').addEventListener('click', () => { if (view) showReport(view.game.id); });

  $('newGame').addEventListener('click', async () => {
    if (!view) return;
    const choice = await askNewGame(view);
    if (!choice) return;
    await send({ type: 'newGame', ...choice });
    openDashboard();
  });

  $('games').addEventListener('click', async (e) => {
    const open = closest(e, '[data-open]');
    const report = closest(e, '[data-report]');
    const del = closest(e, '[data-delete]');
    if (report) {
      showReport(report.dataset.report);
    } else if (open) {
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
