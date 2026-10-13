// The game report's chart: every player's level over the game as step lines, with a crosshair readout.
// Used full size on the dashboard (js/table/report.js) and compact on phones (js/phone/report.js), where
// your own line is in color and everyone else's is gray.
import { formatElapsed, levelAt } from './report.js';
import { MAX_LEVEL, MIN_LEVEL } from './rules.js';

// One color per player, in join order, never reused (validated for the dialog's surface #2a1c12: color-blind
// separation, contrast). A 9th player and beyond are drawn in a neutral gray; the legend and avatars name them.
const SERIES = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];
const OVERFLOW = '#898781';
const OTHERS = '#8a7560';          // compact: everyone but you
const SURFACE = '#2a1c12';
const GRID = '#4a3322';
const AXIS = '#6a4c34';
const INK_MUTED = '#b39a78';
const OFFSET = 3;                  // px between players at the same level, so a line can't hide behind another

export const colorOf = (i) => SERIES[i] ?? OVERFLOW;

/** @typedef {ReturnType<typeof import('./report.js').levelReport>} Report */

const LAYOUTS = {
  full: { width: 760, height: 330, margin: { left: 34, right: 18, top: 14, bottom: 30 }, maxTicks: 5, everyLevel: true },
  compact: { width: 360, height: 230, margin: { left: 26, right: 12, top: 12, bottom: 26 }, maxTicks: 2, everyLevel: false },
};

/** Tick every 1, 2, 5, 10… minutes: at most `max` steps along the axis. */
function timeTicks(spanMs, max) {
  const minutes = spanMs / 60_000;
  const step = [1, 2, 5, 10, 15, 20, 30, 60, 90, 120, 180, 240].find((s) => minutes / s <= max) ?? 360;
  const ticks = [];
  for (let m = 0; m <= minutes + 1e-9; m += step) ticks.push(m * 60_000);
  return ticks;
}

function geometry(report, layout) {
  const { width: W, height: H, margin: M } = layout;
  const span = Math.max(report.end - report.start, 60_000);
  const n = report.tracks.length;
  const x = (at) => M.left + ((at - report.start) / span) * (W - M.left - M.right);
  const rowY = (level) => M.top + ((MAX_LEVEL - level) / (MAX_LEVEL - MIN_LEVEL)) * (H - M.top - M.bottom);
  const y = (level, i) => rowY(level) + (i - (n - 1) / 2) * OFFSET;
  return { W, H, M, span, x, rowY, y, endX: x(report.start + span), axisY: H - M.bottom + 1 };
}

/**
 * The chart as SVG markup (no names in it: those go in the legend and tooltip, as text).
 * @param {Report} report
 * @param {{ compact?: boolean, highlight?: string | null }} [options]   highlight: a player id, drawn in color
 *        over everyone else in gray (compact view)
 */
export function chartSvg(report, { compact = false, highlight = null } = {}) {
  const layout = compact ? LAYOUTS.compact : LAYOUTS.full;
  const g = geometry(report, layout);

  const grid = [];
  for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
    grid.push(`<line x1="${g.M.left}" x2="${g.W - g.M.right}" y1="${g.rowY(level)}" y2="${g.rowY(level)}" stroke="${GRID}" stroke-width="1"/>`);
    if (level === MAX_LEVEL) {
      grid.push(`<text x="${g.M.left - 7}" y="${g.rowY(level) + 6}" text-anchor="end" class="crown">👑</text>`);
    } else if (layout.everyLevel || level % 2 === 1) {
      grid.push(`<text x="${g.M.left - 9}" y="${g.rowY(level) + 4}" text-anchor="end" class="tick">${level}</text>`);
    }
  }
  grid.push(`<line x1="${g.M.left}" x2="${g.W - g.M.right}" y1="${g.axisY}" y2="${g.axisY}" stroke="${AXIS}" stroke-width="1"/>`);
  const ticks = timeTicks(g.span, layout.maxTicks);
  for (const t of ticks) {
    const last = t === ticks[ticks.length - 1] && t > 0;
    const anchor = t === 0 ? 'start' : last && compact ? 'end' : 'middle';
    const tx = last && compact ? Math.min(g.x(report.start + t), g.W - g.M.right) : g.x(report.start + t);
    grid.push(`<text x="${tx}" y="${g.H - 8}" text-anchor="${anchor}" class="tick">${t === 0 ? 'Start' : formatElapsed(t)}</text>`);
  }

  const mine = (track) => !highlight || track.playerId === highlight;
  const colorFor = (track, i) => (mine(track) ? colorOf(i) : OTHERS);
  const order = report.tracks.map((track, i) => ({ track, i }))
    .sort((a, b) => Number(mine(a.track)) - Number(mine(b.track)));   // yours on top

  const lines = order.map(({ track, i }) => {
    const [first, ...rest] = track.points;
    let d = `M${g.x(first.at)} ${g.y(first.level, i)}`;
    for (const p of rest) d += ` H${g.x(p.at)} V${g.y(p.level, i)}`;
    d += ` H${track.leftAt != null ? g.x(track.leftAt) : g.endX}`;
    const faint = highlight && !mine(track) ? ' stroke-opacity="0.75"' : '';
    const width = highlight && mine(track) ? 3 : highlight ? 1.5 : 2;
    return `<path d="${d}" fill="none" stroke="${colorFor(track, i)}" stroke-width="${width}"${faint} stroke-linejoin="round" stroke-linecap="round"/>`;
  });

  const marks = order.filter(({ track }) => mine(track)).flatMap(({ track, i }) => {
    const out = track.deaths.map((at) => {
      const level = levelAt(track, at) ?? track.final;
      return `<circle cx="${g.x(at)}" cy="${g.y(level, i)}" r="4.5" fill="${colorOf(i)}" stroke="${SURFACE}" stroke-width="2"/>
        <text x="${g.x(at)}" y="${g.y(level, i) - 9}" text-anchor="middle" class="death" aria-hidden="true">💀</text>`;
    });
    if (track.leftAt == null) {
      out.push(`<circle cx="${g.endX}" cy="${g.y(track.final, i)}" r="4" fill="${colorOf(i)}" stroke="${SURFACE}" stroke-width="2"/>`);
    }
    return out;
  });

  return `<svg class="report-svg" viewBox="0 0 ${g.W} ${g.H}" tabindex="0" role="img"
      aria-label="Levels over the game; touch it to see everyone's level at that moment">
    ${grid.join('')}${lines.join('')}${marks.join('')}
    <line class="crosshair" x1="0" x2="0" y1="${g.M.top - 6}" y2="${g.axisY}" stroke="${INK_MUTED}" stroke-width="1" visibility="hidden"/>
    <rect class="hit" x="${g.M.left}" y="0" width="${g.W - g.M.left - g.M.right}" height="${g.H}" fill="transparent"/>
  </svg>`;
}

/**
 * Hover, touch and arrow keys: a crosshair at the nearest change, with everyone's level then (names as text).
 * @param {HTMLElement} root   the .report-chart around the svg and its .report-tip
 * @param {Report} report
 * @param {{ compact?: boolean, highlight?: string | null }} [options]   as for chartSvg
 */
export function attachHover(root, report, { compact = false, highlight = null } = {}) {
  const g = geometry(report, compact ? LAYOUTS.compact : LAYOUTS.full);
  const svg = root.querySelector('svg');
  const hit = /** @type {SVGElement} */ (svg.querySelector('.hit'));
  const crosshair = svg.querySelector('.crosshair');
  const tip = /** @type {HTMLElement} */ (root.querySelector('.report-tip'));
  const moments = [...new Set([report.start, report.end, ...report.tracks.flatMap((t) => [...t.points.map((p) => p.at), ...t.deaths])])]
    .sort((a, b) => a - b);
  let index = -1;

  function show(i) {
    index = i;
    const at = moments[i];
    const sx = g.x(at);
    crosshair.setAttribute('x1', String(sx));
    crosshair.setAttribute('x2', String(sx));
    crosshair.setAttribute('visibility', 'visible');

    tip.replaceChildren();
    const head = document.createElement('div');
    head.className = 'when';
    head.textContent = at === report.start ? 'Start' : formatElapsed(at - report.start);
    tip.append(head);
    const rows = report.tracks.map((t, n) => ({ t, n, level: levelAt(t, at) }))
      .filter((r) => r.level != null)
      .sort((a, b) => b.level - a.level);
    for (const { t, n, level } of rows) {
      const isMe = t.playerId === highlight;
      const row = document.createElement('div');
      row.className = isMe ? 'row mine' : 'row';
      const key = document.createElement('span');
      key.className = 'key';
      key.style.background = !highlight || isMe ? colorOf(n) : OTHERS;
      const value = document.createElement('b');
      value.textContent = String(level);
      const name = document.createElement('span');
      name.textContent = (isMe ? 'You' : t.name) + (t.deaths.includes(at) ? ' 💀' : '');
      row.append(key, value, name);
      tip.append(row);
    }
    tip.hidden = false;
    if (compact) return;            // a strip under the chart (CSS): nothing to place
    const box = svg.getBoundingClientRect();
    const px = (sx / g.W) * box.width;
    const right = px + 12;
    tip.style.left = `${right + tip.offsetWidth > box.width ? Math.max(px - 12 - tip.offsetWidth, 0) : right}px`;
  }

  function hide() {
    crosshair.setAttribute('visibility', 'hidden');
    if (compact) return;            // the strip keeps the last moment touched
    tip.hidden = true;
  }

  function nearest(clientX) {
    const box = svg.getBoundingClientRect();
    const vx = ((clientX - box.left) / box.width) * g.W;
    const at = report.start + ((vx - g.M.left) / (g.W - g.M.left - g.M.right)) * g.span;
    let best = 0;
    for (let i = 1; i < moments.length; i++) if (Math.abs(moments[i] - at) < Math.abs(moments[best] - at)) best = i;
    return best;
  }

  hit.addEventListener('pointermove', (e) => show(nearest(e.clientX)));
  hit.addEventListener('pointerdown', (e) => show(nearest(e.clientX)));
  hit.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hide(); });
  svg.addEventListener('focus', () => show(Math.max(index, 0)));
  svg.addEventListener('blur', hide);
  svg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      show(Math.min(Math.max(index + (e.key === 'ArrowRight' ? 1 : -1), 0), moments.length - 1));
    }
  });
}

/** "Played 1 h 22 min · 👑 Ana won after 1 h 20 min" (HTML: the name is escaped by the caller's escapeHtml). */
export function summaryText(report, escapeHtml) {
  // non-breaking spaces: "1 h 22 min" never splits over two lines
  const elapsed = (ms) => formatElapsed(ms).replace('Start', 'under a minute').replaceAll(' ', ' ');
  const parts = [`Played ${elapsed(report.end - report.start)}`];
  if (report.winner) {
    const who = report.tracks.find((t) => t.playerId === report.winner.playerId);
    parts.push(`👑 ${escapeHtml(who?.name ?? 'Someone')} won after ${elapsed(report.winner.at - report.start)}`);
  }
  return parts.join(' · ');
}
