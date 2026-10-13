// The phone's 📈: a simpler game report. Your line in color over everyone else's in gray, your deaths, and
// the standings as a plain list. Touch the chart for everyone's level at that moment.
import { fetchLog } from '../shared/api.js';
import { avatarHtml } from '../shared/avatars.js';
import { openDialog } from '../shared/dialog.js';
import { escapeHtml } from '../shared/dom.js';
import { levelReport } from '../shared/report.js';
import { attachHover, chartSvg, colorOf, summaryText } from '../shared/report-chart.js';
import { MAX_LEVEL } from '../shared/rules.js';

function standingsHtml(report, myId) {
  const rows = [...report.tracks].filter((t) => t.leftAt == null).sort((a, b) => b.final - a.final || b.peak - a.peak);
  return `<ol class="standings">${rows.map((t) => `
    <li class="${t.playerId === myId ? 'mine' : ''}">
      ${avatarHtml(t.avatar, { className: 'standings-avatar' })}
      <span class="who">${escapeHtml(t.name)}${t.playerId === myId ? ' <span class="you">you</span>' : ''}</span>
      <b>${t.final >= MAX_LEVEL ? '👑 ' : ''}${t.final}</b>
    </li>`).join('')}</ol>`;
}

/**
 * @param {import('../shared/rules.js').View} view
 * @param {string} myId   this phone's player
 */
export async function showMyReport(view, myId) {
  let report;
  try {
    const log = await fetchLog(view.game.id);
    report = levelReport(log.entries, log.players);
  } catch (err) {
    openDialog({ title: '📈 How it went', ok: null, cancel: 'Close', body: `<p class="note">${escapeHtml(err.message)}</p>` });
    return;
  }
  const me = report.tracks.findIndex((t) => t.playerId === myId);
  const options = { compact: true, highlight: myId };
  const body = `
    <p class="note">${summaryText(report, escapeHtml)}</p>
    <div class="report-chart compact">${chartSvg(report, options)}</div>
    <div class="report-tip compact"><span class="hint">Touch the chart to see everyone's level at that moment</span></div>
    <div class="report-legend compact">
      <span class="item"><span class="key wide" style="background:${colorOf(Math.max(me, 0))}"></span>You</span>
      <span class="item"><span class="key others"></span>Everyone else</span>
    </div>
    ${standingsHtml(report, myId)}`;
  openDialog({ title: '📈 How it went', ok: null, cancel: 'Close', body });
  // the chart and its readout strip share a parent (the sheet), which attachHover searches
  attachHover(/** @type {HTMLElement} */ (document.getElementById('sheet')), report, options);
}
