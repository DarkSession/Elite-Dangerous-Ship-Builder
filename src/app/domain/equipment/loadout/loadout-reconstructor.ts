import { getPersonalModification } from '@elite-dangerous-almanac/core/equipment/modifications';
import type { EquipmentLoadout, ModificationSlots } from '../loadout-link/equipment-loadout';
import { publishedSuitGrades } from '../readings/suit-readings';
import { publishedWeaponGrades } from '../readings/weapon-readings';
import type { StoredLoadoutV1 } from './stored-loadout.serializer';
import { CATALOGUE_MOUNTS } from './loadout-mounts';

/**
 * Rebuilding a stored loadout through the package.
 *
 * Parsing says the bytes are a loadout; this says the installed
 * `@elite-dangerous-almanac/core` still carries what the loadout names. The two
 * are separate questions and fail differently: a malformed record is broken,
 * while a record naming a suit a later Almanac withdrew is intact and simply
 * cannot be opened by this build (FR-019).
 *
 * Nothing partial is ever returned. A loadout whose second weapon names an
 * unknown symbol is refused whole, because opening three quarters of a saved
 * loadout would silently discard the rest of a Commander's choice.
 */
export type LoadoutReconstruction =
  | { readonly ok: true; readonly loadout: EquipmentLoadout }
  | { readonly ok: false; readonly reason: string };

export function reconstructLoadout(stored: StoredLoadoutV1): LoadoutReconstruction {
  const suitGrades = publishedSuitGrades(stored.suitFamily);
  if (suitGrades.length === 0) {
    return { ok: false, reason: `This Almanac does not carry the suit "${stored.suitFamily}".` };
  }
  if (!suitGrades.includes(stored.suitGrade)) {
    return {
      ok: false,
      reason: `The suit "${stored.suitFamily}" does not publish grade ${String(stored.suitGrade)}.`,
    };
  }

  const suitModifications = resolveSlots(stored.suitModifications);
  if (suitModifications === null) {
    return { ok: false, reason: 'The suit holds a modification this Almanac does not carry.' };
  }

  const weapons: EquipmentLoadout['weapons'][number][] = [];
  for (const [position, mount] of CATALOGUE_MOUNTS.entries()) {
    const fitted = stored.weapons[position] ?? null;
    if (fitted === null) {
      weapons.push(null);
      continue;
    }

    const grades = publishedWeaponGrades(fitted.symbol);
    if (grades.length === 0) {
      return {
        ok: false,
        reason: `This Almanac does not carry the weapon "${fitted.symbol}" on ${mount.key}.`,
      };
    }
    if (!grades.includes(fitted.grade)) {
      return {
        ok: false,
        reason: `The weapon "${fitted.symbol}" does not publish grade ${String(fitted.grade)}.`,
      };
    }

    const modifications = resolveSlots(fitted.modifications);
    if (modifications === null) {
      return {
        ok: false,
        reason: `The weapon "${fitted.symbol}" holds a modification this Almanac does not carry.`,
      };
    }
    weapons.push({ symbol: fitted.symbol, grade: fitted.grade, modifications });
  }

  return {
    ok: true,
    loadout: {
      suitFamily: stored.suitFamily,
      suitGrade: stored.suitGrade,
      suitModifications,
      weapons,
    },
  };
}

/**
 * Every slot's recipe, checked against the package as stored.
 *
 * The stored spelling is kept rather than re-resolved: a weapon's
 * technology-specific recipe was resolved when it was fitted, and resolving it
 * again on open would let a package change quietly rewrite what a Commander
 * saved. What is asked here is only whether the recipe still exists.
 */
function resolveSlots(slots: ModificationSlots): ModificationSlots | null {
  const resolved: (string | null)[] = [];
  for (const symbol of slots) {
    if (symbol === null) {
      resolved.push(null);
      continue;
    }
    if (getPersonalModification(symbol) == null) {
      return null;
    }
    resolved.push(symbol);
  }
  return resolved;
}
