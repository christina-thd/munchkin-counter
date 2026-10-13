// Avatar pictures as HTML, for every screen (and the announcer, which is tested in Node: no DOM here).
import { escapeHtml } from './dom.js';
import { AVATARS } from './rules.js';

const LABELS = new Map(AVATARS.map((a) => [a.id, a.label]));

/** The avatar's name ("Elf"), or null for an unknown id. */
export const avatarLabel = (id) => LABELS.get(id) ?? null;

/**
 * An avatar as an <img>; nothing for an unknown id. Paths are relative, like everything else (Home Assistant ingress).
 * `inline` sizes it to the text around it (announcer, activity log, dialogs).
 * @param {string} id
 * @param {{ inline?: boolean, className?: string }} [options]
 */
export function avatarHtml(id, { inline = false, className = '' } = {}) {
  const label = avatarLabel(id);
  if (!label) return '';
  const classes = ['avatar-img', inline && 'inline', className].filter(Boolean).join(' ');
  return `<img class="${classes}" src="img/avatars/${id}.svg" alt="${escapeHtml(label)}" draggable="false">`;
}
