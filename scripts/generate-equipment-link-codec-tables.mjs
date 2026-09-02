#!/usr/bin/env node
/**
 * Write the equipment-link codec table from the Almanac.
 *
 * The link names a suit, a weapon and a modification by its position in this
 * table, so the table is the contract a published link is read back through. It
 * is generated rather than written, because the catalogue behind it belongs to
 * `@elite-dangerous-almanac/core` and this repository does not keep a second
 * copy of game data (constitution II).
 *
 * The table also carries what the codec has to know to refuse a loadout that
 * cannot exist: which grades a suit and a weapon publish, how many mounts of
 * each kind a suit offers, which kind a weapon fits, and the most modification
 * slots any grade unlocks. Reading those from the package at decode time would
 * make an old link's meaning depend on the release that happened to be
 * installed.
 *
 * Like the ship builder's table, a changed content hash is a new encoding and
 * belongs under the next table version. `--overwrite` replaces this one in
 * place, and is sound only while no link has been published against it.
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SUITS } from '@elite-dangerous-almanac/core/equipment/suits';
import { PERSONAL_WEAPONS } from '@elite-dangerous-almanac/core/equipment/weapons';
import { PERSONAL_MODIFICATIONS } from '@elite-dangerous-almanac/core/equipment/modifications';
import { resolvePersonalModificationForWeapon } from '@elite-dangerous-almanac/core/equipment/modification-journal';

const TABLE_VERSION = 1;
const outputPath = fileURLToPath(
  new URL('../src/app/domain/equipment/loadout-link/equipment-link-table-1.json', import.meta.url),
);
const overwrite = process.argv.includes('--overwrite');

const suits = Object.values(SUITS);
const weapons = Object.values(PERSONAL_WEAPONS);
const modifications = Object.entries(PERSONAL_MODIFICATIONS);

const grades = (item) =>
  Object.keys(item.grades)
    .map((grade) => Number(grade))
    .sort((left, right) => left - right);

const modificationSlots = Math.max(
  ...[...suits, ...weapons].flatMap((item) =>
    Object.values(item.grades).map((grade) => grade.modificationSlots),
  ),
);

const weaponModifications = modifications
  .filter(([, recipe]) => recipe.target === 'weapon')
  .map(([symbol]) => symbol);

/**
 * Which of the weapon recipes each weapon can actually take.
 *
 * Greater Range, Headshot Damage and Improved Hip Fire Accuracy are three
 * recipes each, one per damage technology, and a weapon takes exactly one of
 * the three. The package settles which with
 * `resolvePersonalModificationForWeapon`, and asking it is the only way to know
 * — the pairing is the library's, not a rule this repository may restate.
 */
const weaponModificationSets = weapons.map((weapon) =>
  weaponModifications.flatMap((symbol, index) => {
    const journal = symbol.replace(/_(kinetic|laser|plasma)$/, '');
    if (journal === symbol) return [index];
    return resolvePersonalModificationForWeapon(weapon.symbol, journal) === symbol ? [index] : [];
  }),
);

const payload = {
  SUITS: suits.map((suit) => suit.family),
  SUIT_GRADES: suits.map(grades),
  // `[primary, secondary]`, which is the order a loadout lists its mounts in.
  SUIT_MOUNTS: suits.map((suit) => [suit.primarySlots, suit.secondarySlots]),
  WEAPONS: weapons.map((weapon) => weapon.symbol),
  WEAPON_GRADES: weapons.map(grades),
  WEAPON_MOUNTS: weapons.map((weapon) => weapon.slot),
  SUIT_MODIFICATIONS: modifications
    .filter(([, recipe]) => recipe.target === 'suit')
    .map(([symbol]) => symbol),
  WEAPON_MODIFICATIONS: weaponModifications,
  WEAPON_MODIFICATION_SETS: weaponModificationSets,
  MODIFICATION_SLOTS: modificationSlots,
};

const contentHashOf = (value) =>
  createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex');

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

const contentHash = contentHashOf(payload);
const previous = JSON.parse(await readFile(outputPath, 'utf8').catch(() => 'null'));
const previousHash = previous?.$generated?.contentHash ?? null;

if (previousHash !== null && previousHash !== contentHash) {
  const detail =
    `Equipment codec table ${TABLE_VERSION} content changed\n` +
    `  committed: ${previousHash}\n  generated: ${contentHash}\n` +
    'Every published link names the table version that decodes it, so a changed table is a\n' +
    'new encoding: mint the next table version and keep this one for the links already out.';
  if (!overwrite) {
    throw new Error(
      `${detail}\nRe-run with --overwrite only while no link has been published against table ${TABLE_VERSION}.`,
    );
  }
  console.warn(`${detail}\nOverwriting table ${TABLE_VERSION} in place (--overwrite).`);
}

await writeFile(
  outputPath,
  `${JSON.stringify({ $generated: { tableVersion: TABLE_VERSION, contentHash }, ...payload })}\n`,
);
console.log(
  `Equipment codec table ${TABLE_VERSION} written: ${payload.SUITS.length} suits, ` +
    `${payload.WEAPONS.length} weapons, ` +
    `${payload.SUIT_MODIFICATIONS.length + payload.WEAPON_MODIFICATIONS.length} modifications ` +
    `(${contentHash.slice(0, 12)}…).`,
);
