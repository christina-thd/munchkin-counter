// The dashboard's 📈 game report: every player's level over the game (shared/report-chart.js), a legend,
// and a summary table (the chart's values without hovering). Built from the game's activity log.
import { fetchLog } from '../shared/api.js';
import { avatarHtml } from '../shared/avatars.js';
import { openDialog } from '../shared/dialog.js';
import { escapeHtml } from '../shared/dom.js';
import { levelReport } from '../shared/report.js';
import { attachHover, chartSvg, colorOf, summaryText } from '../shared/report-chart.js';
import { MAX_LEVEL } from '../shared/rules.js';

function legendHtml(report) {
  return `<div class="report-legend">${report.tracks.map((t, i) => `
    <span class="item${t.leftAt != null ? ' left' : ''}"><span class="key" style="background:${colorOf(i)}"></span>${avatarHtml(t.avatar, { inline: true })}
      ${escapeHtml(t.name)}${t.leftAt != null ? ' <span class="note">(left)</span>' : ''}</span>`).join('')}
    <span class="item note">💀 died</span>
  </div>`;
}

function tableHtml(report) {
  const rows = [...report.tracks].sort((a, b) => b.final - a.final || b.peak - a.peak);
  return `<table class="report-table">
    <thead><tr><th>Player</th><th>Final level</th><th>Highest</th><th>Deaths</th></tr></thead>
    <tbody>${rows.map((t) => `<tr>
      <td>${avatarHtml(t.avatar, { inline: true })} ${escapeHtml(t.name)}</td>
      <td>${t.final >= MAX_LEVEL ? '👑 ' : ''}${t.final}</td><td>${t.peak}</td><td>${t.deaths.length}</td></tr>`).join('')}
    </tbody></table>`;
}

/**
 * Opens the report of a game: the current one from the dashboard, any game from the start page.
 * @param {string} gameId
 */
export async function showReport(gameId) {
  let report;
  let name;
  try {
    const log = await fetchLog(gameId);
    report = levelReport(log.entries, log.players);
    name = log.name;
  } catch (err) {
    openDialog({ title: '📈 Game report', ok: null, cancel: 'Close', body: `<p class="note">${escapeHtml(err.message)}</p>` });
    return;
  }

  const body = report.tracks.length
    ? `<p class="note">${summaryText(report, escapeHtml)}</p>
       <div class="report-chart">${chartSvg(report)}<div class="report-tip" hidden></div></div>
       ${legendHtml(report)}${tableHtml(report)}`
    : '<p class="note">No players in this game yet.</p>';
  openDialog({ title: `📈 ${escapeHtml(name)}`, ok: null, cancel: 'Close', wide: true, body });
  const chart = /** @type {HTMLElement} */ (document.querySelector('#sheet .report-chart'));
  if (chart) attachHover(chart, report);
}
