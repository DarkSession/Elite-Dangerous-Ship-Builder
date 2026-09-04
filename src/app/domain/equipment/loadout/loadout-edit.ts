import { getSuitByFamily } from '@elite-dangerous-almanac/core/equipment/suits';
import { getPersonalWeaponBySymbol } from '@elite-dangerous-almanac/core/equipment/weapons';
import { getPersonalModification } from '@elite-dangerous-almanac/core/equipment/modifications';
import { resolvePersonalModificationForWeapon } from '@elite-dangerous-almanac/core/equipment/modification-journal';
import type { PersonalMountKey } from '@elite-dangerous-almanac/core/equipment/suits';
import type {
  EquipmentLoadout,
  FittedPersonalWeapon,
  ModificationSlots,
} from '../loadout-link/equipment-loadout';
import { CATALOGUE_MOUNTS, mountPosition } from './loadout-mounts';

/**
 * Which item an edit is about: the suit, or the weapon on one mount.
 *
 * The mount rather than the weapon, because a mount is what a Commander points
 * at and it is addressed even while it is empty.
 */
export type EditTarget = 'suit' | PersonalMountKey;

/** How many modification slots every item addresses, whatever its grade unlocks. */
export const MODIFICATION_SLOT_COUNT = 4;

const EMPTY_SLOTS: ModificationSlots = Object.freeze([null, null, null, null]);

/**
 * Every choice a Commander can make, as a pure transition over a loadout.
 *
 * A transition that would produce a loadout the game cannot hold returns the
 * loadout it was given, unchanged and by identity. The bench never offers such a
 * choice — what it offers comes from `candidate-query` — so this is the floor
 * under that rather than a second way to report a refusal: a refusal a Commander
 * reads comes from ingress, never from an edit (013 contracts/equipment-bench.md,
 * "Refusals").
 *
 * Nothing here is stated about a loadout. Every figure is asked of the package
 * by `domain/equipment/readings` from the loadout these transitions produce.
 */

/** A bench with one suit on it at its lowest published grade, and nothing else. */
export function newLoadout(suitFamily: string): EquipmentLoadout | null {
  const grade = lowestGrade(suitFamily);
  if (grade === null) return null;
  return {
    suitFamily,
    suitGrade: grade,
    suitModifications: EMPTY_SLOTS,
    weapons: CATALOGUE_MOUNTS.map(() => null),
  };
}

/**
 * Wear a different suit.
 *
 * Nothing on the mounts is discarded. A weapon on a mount the new suit does not
 * carry becomes held — retained, stated by nothing, and back in effect on a suit
 * that carries the mount again (FR-007). The grade comes down to the highest the
 * new suit publishes, because the Flight Suit publishes only grade 1; the suit's
 * modifications stay where they are, locked rather than dropped (FR-011).
 */
export function selectSuit(loadout: EquipmentLoadout, suitFamily: string): EquipmentLoadout {
  const grades = publishedSuitGrades(suitFamily);
  if (grades.length === 0 || suitFamily === loadout.suitFamily) return loadout;
  const highest = grades[grades.length - 1]!;
  return {
    ...loadout,
    suitFamily,
    suitGrade: Math.min(loadout.suitGrade, highest),
  };
}

/** Set the suit's grade, where the suit publishes it. */
export function setSuitGrade(loadout: EquipmentLoadout, grade: number): EquipmentLoadout {
  if (!publishedSuitGrades(loadout.suitFamily).includes(grade)) return loadout;
  return grade === loadout.suitGrade ? loadout : { ...loadout, suitGrade: grade };
}

/**
 * Fit a weapon to a mount, or empty the mount with `null`.
 *
 * The weapon has to take the mount's kind: a rifle does not go on
 * `SecondaryWeapon`. It arrives at the grade the mount already carried where the
 * new weapon publishes it, and with empty slots, because a recipe fitted to the
 * weapon that was there is not a recipe this one necessarily takes.
 */
export function fitWeapon(
  loadout: EquipmentLoadout,
  mount: PersonalMountKey,
  symbol: string | null,
): EquipmentLoadout {
  const position = mountPosition(mount);
  if (position < 0) return loadout;
  if (symbol === null) return withWeapon(loadout, position, null);

  const weapon = getPersonalWeaponBySymbol(symbol);
  if (weapon === null || weapon.slot !== CATALOGUE_MOUNTS[position]!.kind) return loadout;

  // Fitting what is already there is not a change, and the mount keeps what it
  // carries. The canvas lists the fitted weapon among the alternatives and marks
  // it, so the row for the weapon on the mount is a live control a Commander can
  // press — without this the press would rebuild the mount on `EMPTY_SLOTS` and
  // take four modifications with it. `selectSuit` above refuses the same way.
  if (loadout.weapons[position]?.symbol === weapon.symbol) return loadout;

  const grades = publishedGrades(weapon);
  const carried = loadout.weapons[position]?.grade;
  return withWeapon(loadout, position, {
    symbol: weapon.symbol,
    grade: carried !== undefined && grades.includes(carried) ? carried : grades[0]!,
    modifications: EMPTY_SLOTS,
  });
}

/** Set a fitted weapon's grade, where that weapon publishes it. */
export function setWeaponGrade(
  loadout: EquipmentLoadout,
  mount: PersonalMountKey,
  grade: number,
): EquipmentLoadout {
  const position = mountPosition(mount);
  const fitted = position < 0 ? null : (loadout.weapons[position] ?? null);
  if (fitted === null) return loadout;

  const weapon = getPersonalWeaponBySymbol(fitted.symbol);
  if (weapon === null || !publishedGrades(weapon).includes(grade)) return loadout;
  return grade === fitted.grade ? loadout : withWeapon(loadout, position, { ...fitted, grade });
}

/**
 * Fit a modification to one of an item's four slots.
 *
 * The recipe has to be one the item takes — a weapon recipe on a suit is not —
 * and a recipe is fitted at most once per item (FR-009). A three-technology
 * recipe is settled by the package: `resolvePersonalModificationForWeapon` says
 * which of Greater Range, Headshot Damage and Improved Hip Fire Accuracy this
 * weapon takes, and no other spelling of it is accepted (FR-015).
 */
export function fitModification(
  loadout: EquipmentLoadout,
  target: EditTarget,
  slot: number,
  symbol: string,
): EquipmentLoadout {
  if (!Number.isInteger(slot) || slot < 0 || slot >= MODIFICATION_SLOT_COUNT) return loadout;
  const recipe = getPersonalModification(symbol);
  if (recipe === null) return loadout;

  if (target === 'suit') {
    if (recipe.target !== 'suit') return loadout;
    return withSlots(loadout, target, replaceSlot(loadout.suitModifications, slot, symbol));
  }

  const position = mountPosition(target);
  const fitted = position < 0 ? null : (loadout.weapons[position] ?? null);
  if (fitted === null || recipe.target !== 'weapon') return loadout;
  if (resolveForWeapon(fitted.symbol, symbol) !== symbol) return loadout;
  return withSlots(loadout, target, replaceSlot(fitted.modifications, slot, symbol));
}

/** Empty one of an item's modification slots (FR-012). */
export function clearSlot(
  loadout: EquipmentLoadout,
  target: EditTarget,
  slot: number,
): EquipmentLoadout {
  if (!Number.isInteger(slot) || slot < 0 || slot >= MODIFICATION_SLOT_COUNT) return loadout;
  const slots = slotsOf(loadout, target);
  if (slots === null || slots[slot] === null) return loadout;
  return withSlots(loadout, target, replaceSlot(slots, slot, null));
}

/** What an item's modification slots currently hold, or `null` when there is no item. */
export function slotsOf(loadout: EquipmentLoadout, target: EditTarget): ModificationSlots | null {
  if (target === 'suit') return loadout.suitModifications;
  const position = mountPosition(target);
  return position < 0 ? null : (loadout.weapons[position]?.modifications ?? null);
}

/**
 * Which spelling of a recipe this weapon takes.
 *
 * Greater Range, Headshot Damage and Improved Hip Fire Accuracy are three
 * recipes each, one per damage technology. The package settles the pairing and
 * this asks it; a recipe carrying no technology suffix answers as itself.
 */
export function resolveForWeapon(weaponSymbol: string, recipeSymbol: string): string {
  const journal = recipeSymbol.replace(/_(kinetic|laser|plasma)$/, '');
  return journal === recipeSymbol
    ? recipeSymbol
    : resolvePersonalModificationForWeapon(weaponSymbol, journal);
}

function replaceSlot(
  slots: ModificationSlots,
  slot: number,
  symbol: string | null,
): ModificationSlots | null {
  if (slots.length !== MODIFICATION_SLOT_COUNT) return null;
  // One recipe per item, so fitting one that is already in another slot is a
  // loadout the game cannot hold rather than a move (FR-009).
  if (symbol !== null && slots.some((held, index) => held === symbol && index !== slot)) {
    return null;
  }
  if (slots[slot] === symbol) return null;
  return slots.map((held, index) => (index === slot ? symbol : held));
}

function withSlots(
  loadout: EquipmentLoadout,
  target: EditTarget,
  slots: ModificationSlots | null,
): EquipmentLoadout {
  if (slots === null) return loadout;
  if (target === 'suit') return { ...loadout, suitModifications: slots };
  const position = mountPosition(target);
  const fitted = loadout.weapons[position];
  if (fitted == null) return loadout;
  return withWeapon(loadout, position, { ...fitted, modifications: slots });
}

function withWeapon(
  loadout: EquipmentLoadout,
  position: number,
  fitted: FittedPersonalWeapon | null,
): EquipmentLoadout {
  if (loadout.weapons[position] === fitted) return loadout;
  return {
    ...loadout,
    weapons: loadout.weapons.map((held, index) => (index === position ? fitted : held)),
  };
}

function publishedGrades(item: { grades: Readonly<Record<string, unknown>> }): readonly number[] {
  return Object.keys(item.grades)
    .map(Number)
    .sort((one, other) => one - other);
}

function publishedSuitGrades(suitFamily: string): readonly number[] {
  const suit = getSuitByFamily(suitFamily);
  return suit === null ? [] : publishedGrades(suit);
}

function lowestGrade(suitFamily: string): number | null {
  return publishedSuitGrades(suitFamily)[0] ?? null;
}
