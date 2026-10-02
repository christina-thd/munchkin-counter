// Game rules shared by the server and the browser.

/**
 * A player as every screen gets them (src/game/state.js has the saved form).
 * @typedef {object} Player
 * @property {string} id
 * @property {string} name
 * @property {string} emoji      one of EMOJIS
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

export const EMOJIS = Object.freeze([
  '🧙', '🧝', '🧛', '🧟', '🧞', '🧜', '🦸', '🦹', '🥷', '🤴',
  '👸', '🐉', '🦄', '🐺', '🦊', '🐸', '🐙', '💀', '👹', '👻',
  '🤖', '👽', '🐱', '🐶', '🐼', '🦁', '🐯', '🍄', '⚔️', '🛡️',
]);

export const clampLevel = (level) => Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level));

/**
 * Combat strength: level plus the bonus from gear.
 * @param {Player} player
 */
export const strengthOf = (player) => player.level + player.gear;
