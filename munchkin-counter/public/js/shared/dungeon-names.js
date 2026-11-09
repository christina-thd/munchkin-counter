// Names suggested for a new game (🎲 in the new game dialog rolls another). Short and written together, so they
// take little room on the dashboard's top bar: at most SHORT (14) letters.
export const DUNGEON_NAMES = Object.freeze([
  'RoomOfDoom',
  'BackstabBistro',
  'PitOfBetrayal',
  'KickTheDoor',
  'LootOrDie',
  'StabAndGrab',
  'DiceOfDoom',
  'MonsterMansion',
  'GrabTheLoot',
  'BackstabBazaar',
  'BribeOrDie',
  'KickAndRun',
  'WinOrWhine',
  'LootAndBoot',
  'SnatchAndDash',
  'GreedOrBleed',
  'DoomOrBloom',
  'RobAndRun',
  'HoardOrHorde',
  'DieAndBuy',
  'KickAndPray',
  'StealAndDeal',
  'CurseAndBurst',
  'TrickOrKick',
  'PillageVillage',
  'RaidAndFade',
  'PlunderBlunder',
  'DodgeLodge',
  'GobbleOrHobble',
  'ZapAndNap',
  'WinOrSin',
  'RoomOfGloom',
  'CaveOfGreed',
  'VaultOfFaults',
  'PitOfPain',
  'PitOfDespair',
]);
export const SHORT = 14;

/**
 * A random name, not one of `taken` (the games there already are) unless every one is, and not `current`.
 * @param {readonly string[]} taken
 * @param {string} [current]   the one suggested now: 🎲 always gives a different one
 */
export function dungeonName(taken, current = '', random = Math.random) {
  const unused = DUNGEON_NAMES.filter((n) => !taken.includes(n) && n !== current);
  const pool = unused.length ? unused : DUNGEON_NAMES.filter((n) => n !== current);
  return pool[Math.floor(random() * pool.length)];
}
