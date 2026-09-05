import { getPersonalModificationCost } from '@elite-dangerous-almanac/core/equipment/modification-costs';
import { sumPersonalEngineeringIngredients } from '@elite-dangerous-almanac/core/equipment/engineering';
import {
  getPersonalWeaponUpgradeCost,
  getSuitUpgradeCost,
} from '@elite-dangerous-almanac/core/equipment/upgrade-costs';
import type { PersonalEngineeringIngredient } from '@elite-dangerous-almanac/core/equipment/engineering';
import type { EquipmentLoadout } from '../loadout-link/equipment-loadout';
import { fittedWeaponReadings } from './weapon-readings';
import { suitReadings } from './suit-readings';

/** What the loadout on the bench costs to reach. */
export interface MaterialRequirement {
  /** One line per micro resource, in the order the package sums them. */
  readonly ingredients: readonly PersonalEngineeringIngredient[];
  /** How many kinds of micro resource are needed. */
  readonly types: number;
  /** How many units in total. */
  readonly units: number;
}

/**
 * The micro resources the loadout requires.
 *
 * Two costs, which is what an on-foot loadout carries: the climb to each item's
 * selected grade, counted from grade 1, and one application of each fitted,
 * unlocked modification (FR-014).
 *
 * The package answers a climb three ways and two of them are nothing to gather:
 * `[]` where the grade asks for no climb, and `null` where the item has no
 * ladder — the Flight Suit. `null` also means an item the catalogue does not
 * know, and that cannot arrive here: the family and the symbols come from
 * `suitReadings` and `fittedWeaponReadings`, which answer only for items the
 * package published. So neither answer is a figure the package withheld
 * (constitution IV).
 *
 * A locked slot's modification costs nothing while it is locked, and a held
 * mount's weapon costs nothing at all: it is neither modified nor raised until a
 * suit carrying its mount is worn again (FR-011, FR-007).
 *
 * Every figure is the package's — `getSuitUpgradeCost`,
 * `getPersonalWeaponUpgradeCost` and `getPersonalModificationCost`, summed by
 * `sumPersonalEngineeringIngredients`; nothing is added up here.
 */
export function materialRequirement(loadout: EquipmentLoadout): MaterialRequirement {
  const suit = suitReadings(loadout);
  const weapons = fittedWeaponReadings(loadout);
  const climbs = [
    ...(suit === null ? [] : [getSuitUpgradeCost(suit.family, loadout.suitGrade)]),
    ...weapons.map((weapon) => getPersonalWeaponUpgradeCost(weapon.symbol, weapon.grade)),
  ];
  const recipes = [...(suit?.unlocked ?? []), ...weapons.flatMap((weapon) => weapon.unlocked)];
  const ingredients = sumPersonalEngineeringIngredients(
    ...climbs.map((climb) => climb ?? []),
    ...recipes.map((symbol) => getPersonalModificationCost(symbol) ?? []),
  );
  return {
    ingredients,
    types: ingredients.length,
    units: ingredients.reduce((total, ingredient) => total + ingredient.count, 0),
  };
}
