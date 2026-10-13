// Game rules shared by the server and the browser.

/**
 * A player as every screen gets them (src/game/state.js has the saved form).
 * @typedef {object} Player
 * @property {string} id
 * @property {string} name
 * @property {string} avatar     id of one of AVATARS (picture: public/img/avatars/<id>.svg)
 * @property {'male' | 'female'} sex   the character's, which some cards check (Change Sex curse)
 * @property {number} level      MIN_LEVEL–MAX_LEVEL
 * @property {number} gear       may be negative: curses
 */

/**
 * What every screen receives on connect and after every change (src/game/state.js, toView).
 * @typedef {object} View
 * @property {string} version                                   the app's; a page that sees a new one reloads
 * @property {{ id: string, name: string, lastDeath: { playerId: string, at: number } | null }} game   the current game
 * @property {Player[]} players
 * @property {{ id: string, name: string, createdAt: number, playerCount: number }[]} games   every game, oldest first
 */

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;          // reaching it wins the game
export const MAX_PLAYER_NAME = 20;
export const MAX_GAME_NAME = 30;

/**
 * The pictures players choose from, in picker order: races, classes, monsters, dungeon stuff.
 * Drawn by art/avatars.mjs into public/img/avatars/<id>.svg (original drawings, not the card art).
 */
export const AVATARS = Object.freeze([
  ['elf', 'Elf'], ['dwarf', 'Dwarf'], ['halfling', 'Halfling'], ['gnome', 'Gnome'], ['orc', 'Orc'], ['human', 'Human'],
  ['wizard', 'Wizard'], ['warrior', 'Warrior'], ['cleric', 'Cleric'], ['thief', 'Thief'], ['bard', 'Bard'],
  ['dragon', 'Dragon'], ['skeleton', 'Skeleton'], ['slime', 'Slime'], ['ghost', 'Ghost'], ['troll', 'Troll'],
  ['vampire', 'Vampire'], ['zombie', 'Zombie'], ['werewolf', 'Werewolf'], ['mimic', 'Mimic'],
  ['door', 'Door'], ['loot', 'Loot'], ['potion', 'Potion'], ['crown', 'Crown'],
].map(([id, label]) => Object.freeze({ id, label })));
export const AVATAR_IDS = Object.freeze(AVATARS.map((a) => a.id));

/** The first avatar nobody in the game has yet, so new players start out different. */
export function freeAvatar(players) {
  const taken = new Set(players.map((p) => p.avatar));
  return AVATAR_IDS.find((id) => !taken.has(id)) ?? AVATAR_IDS[players.length % AVATAR_IDS.length];
}

/**
 * A character is male or female, picked when adding a player; cards like the Change Sex curse switch it.
 * The first is the default for players saved before 2.8.0 and for screens that don't send one.
 */
export const SEXES = Object.freeze(['male', 'female']);
export const SEX_SYMBOLS = Object.freeze({ male: '♂', female: '♀' });
export const SEX_LABELS = Object.freeze({ male: 'Male', female: 'Female' });
/** The picker shown when adding a player in the dashboard's dialog: "♂ Male", "♀ Female". */
export const SEX_OPTIONS = Object.freeze(SEXES.map((sex) => ({
  value: sex, label: `${SEX_SYMBOLS[sex]} ${SEX_LABELS[sex]}`, className: sex,
})));
/** The same, icon only (the phone's join form): "♂", "♀", named for screen readers. */
export const SEX_ICON_OPTIONS = Object.freeze(SEXES.map((sex) => ({
  value: sex, label: SEX_SYMBOLS[sex], title: SEX_LABELS[sex], className: sex,
})));

/** @param {'male' | 'female'} sex */
export const otherSex = (sex) => (sex === 'female' ? 'male' : 'female');

export const clampLevel =(level) => Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level));

/**
 * Combat strength: level plus the bonus from gear.
 * @param {Player} player
 */
export const strengthOf = (player) => player.level + player.gear;
