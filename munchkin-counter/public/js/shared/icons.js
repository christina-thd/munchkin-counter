// Line icons, in the style of Tabler Icons (MIT), drawn in the text's colour with their main shape filled in
// (css/base.css: .icon). Unlike emoji they look the same on every TV, tablet and phone.
// In HTML: <span data-icon="report"></span>, filled in by fillIcons(); in JS: ICONS.report.

const svg = (inner) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;

export const ICONS = Object.freeze({
  // a speaker; its slash (.off) shows inside a .muted button
  speaker: svg('<path class="fill" d="M6 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2l3.5-4.5a.8.8 0 0 1 1.5.5v14a.8.8 0 0 1-1.5.5L6 15"/>'
    + '<path d="M15 8a5 5 0 0 1 0 8M17.7 5a9 9 0 0 1 0 14"/><path class="off" d="M3 3l18 18"/>'),
  music: svg('<circle class="fill" cx="6" cy="17" r="3"/><circle class="fill" cx="16" cy="17" r="3"/><path d="M9 17V4h10v13M9 8h10"/>'),
  minus: svg('<path d="M5 12h14"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  next: svg('<path class="fill" d="M4 5v14l12-7z"/><path d="M20 5v14"/>'),
  // the game report: a bar chart on its axes, the bars in no particular order (rising bars read as a signal or
  // volume meter); solid bars with no outline so the gaps between them stay clear
  report: svg('<path d="M3 3v18h18"/><rect class="solid" x="6.5" y="10" width="3.5" height="8" rx="0.8"/>'
    + '<rect class="solid" x="12" y="5" width="3.5" height="13" rx="0.8"/><rect class="solid" x="17.5" y="12" width="3.5" height="6" rx="0.8"/>'),
});

/** Puts each icon into the elements that ask for it with data-icon="name". */
export function fillIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    el.innerHTML = ICONS[/** @type {HTMLElement} */ (el).dataset.icon] ?? '';
  });
}
