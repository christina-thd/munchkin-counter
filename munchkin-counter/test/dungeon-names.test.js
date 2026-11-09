import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DUNGEON_NAMES, dungeonName, SHORT } from '../public/js/shared/dungeon-names.js';

test('dungeon names are short, written together, and all different', () => {
  assert.ok(DUNGEON_NAMES.every((n) => n.length <= SHORT && !n.includes(' ')));
  assert.equal(new Set(DUNGEON_NAMES).size, DUNGEON_NAMES.length);
});

test('a suggestion skips the names already taken and the one shown now', () => {
  const taken = DUNGEON_NAMES.slice(0, -2);
  const [a, b] = DUNGEON_NAMES.slice(-2);
  assert.equal(dungeonName(taken, a, () => 0), b);
  assert.equal(dungeonName(DUNGEON_NAMES, a, () => 0), DUNGEON_NAMES[0]);     // all taken: any other one
});
