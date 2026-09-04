import { getPersonalModificationCost } from '@elite-dangerous-almanac/core/equipment/modification-costs';
import { sumPersonalEngineeringIngredients } from '@elite-dangerous-almanac/core/equipment/engineering';
import type { PersonalEngineeringIngredient } from '@elite-dangerous-almanac/core/equipment/engineering';
import type { EquipmentLoadout } from '../loadout-link/equipment-loadout';
import { fittedWeaponReadings } from './weapon-readings';
import { suitReadings } from './suit-readings';

/** What every fitted, unlocked modification on the bench costs to apply. */
export interface MaterialRequirement {
  /** One line per micro resource, in the order the package sums them. */
  readonly ingredients: readonly PersonalEngineeringIngredient[];
  /** How many kinds of micro resource are needed. */
  readonly types: number;
  /** How many units in total. */
  readonly units: number;
}

/**
 * The micro resources the fitted modifications require.
 *
 * One application of each fitted, unlocked modification and nothing else. A
 * locked slot's modification costs nothing while it is locked, and a held
 * mount's weapon costs nothing at all (FR-011, FR-007). Raising a grade is paid
 * for separately at a settlement and is not counted here (FR-014).
 *
 * Every figure is `getPersonalModificationCost` summed by
 * `sumPersonalEngineeringIngredients`; nothing is added up here.
 */
export function materialRequirement(loadout: EquipmentLoadout): MaterialRequirement {
  const recipes = [
    ...(suitReadings(loadout)?.unlocked ?? []),
    ...fittedWeaponReadings(loadout).flatMap((weapon) => weapon.unlocked),
  ];
  const ingredients = sumPersonalEngineeringIngredients(
    ...recipes.map((symbol) => getPersonalModificationCost(symbol) ?? []),
  );
  return {
    ingredients,
    types: ingredients.length,
    units: ingredients.reduce((total, ingredient) => total + ingredient.count, 0),
  };
}
