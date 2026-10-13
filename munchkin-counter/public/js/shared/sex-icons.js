// ♂ / ♀ as small drawn icons. Not the text characters: the app's fonts don't have them, so every device used its
// own symbol font, and on iPhones the sign sat low and off-center in its circle. Drawn, they look the same
// everywhere, take the color of the text around them (currentColor), and center exactly.
import { SEX_LABELS, SEXES } from './rules.js';

const PATHS = {
  // a circle with an arrow to the upper right
  male: '<circle cx="10" cy="14" r="5.6"/><path d="M14.2 9.8 20 4 M14.5 4H20V9.5"/>',
  // a circle with a cross below
  female: '<circle cx="12" cy="9" r="5.6"/><path d="M12 14.6V21.5 M8.6 18.3H15.4"/>',
};

/**
 * The ♂ or ♀ icon (decorative: whatever shows it names the sex in text or a label).
 * @param {string} sex   'male' | 'female'
 */
export const sexIcon = (sex) => (PATHS[sex] ? `<svg class="sex-glyph" viewBox="0 0 24 24" aria-hidden="true" fill="none"
  stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${PATHS[sex]}</svg>` : '');

/** The picker in the dashboard's Add player dialog: icon and "Male" / "Female". */
export const SEX_OPTIONS = Object.freeze(SEXES.map((sex) => ({
  value: sex, label: `${sexIcon(sex)}${SEX_LABELS[sex]}`, className: sex,
})));

/** The same, icon only (the phone's join form), named for screen readers. */
export const SEX_ICON_OPTIONS = Object.freeze(SEXES.map((sex) => ({
  value: sex, label: sexIcon(sex), title: SEX_LABELS[sex], className: sex,
})));
