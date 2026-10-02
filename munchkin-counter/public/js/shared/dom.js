/**
 * An element of the page by its id (the page always has it).
 * @param {string} id
 * @returns {HTMLElement}
 */
export const $ = (id) => document.getElementById(id);

/**
 * A form field by its id: the same as `$`, typed so `.value`, `.checked` and `.disabled` are known.
 * @param {string} id
 * @returns {HTMLInputElement}
 */
export const input = (id) => /** @type {HTMLInputElement} */ ($(id));

/**
 * The element a tap was on, or inside, that matches `selector`, or null: one listener for a whole list.
 * @param {Event} event
 * @param {string} selector
 * @returns {HTMLElement | null}
 */
export const closest = (event, selector) => /** @type {Element} */ (event.target).closest(selector);

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapes text for safe use inside HTML (player and game names come from users). */
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ENTITIES[c]);

/**
 * Plays a CSS animation class on an element once. The class is removed when the animation ends,
 * so it doesn't replay when the element is hidden and shown again.
 */
export function restartAnimation(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;   // force a reflow so the animation starts again
  el.classList.add(className);
  el.addEventListener('animationend', () => el.classList.remove(className), { once: true });
}
