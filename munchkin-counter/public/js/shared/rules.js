// Game rules shared by the server and the browser.

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

/** Combat strength: level plus the bonus from gear. */
export const strengthOf = (player) => player.level + player.gear;
