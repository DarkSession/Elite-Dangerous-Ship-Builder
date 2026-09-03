import { getPersonalModification } from '@elite-dangerous-almanac/core/equipment/modifications';
import type { PersonalModifier } from '@elite-dangerous-almanac/core/equipment/engineering';
import type { ModificationSlots } from '../loadout-link/equipment-loadout';

/**
 * Which of an item's fitted modifications are in effect, and what they move.
 *
 * The slots a grade unlocks are its **first** ones, so an item at grade 3 has
 * slots 1 and 2 in effect and has locked whatever is in 3 and 4. A locked slot
 * keeps its modification, states nothing, costs nothing, and is back in effect
 * when the grade is raised (FR-008, FR-011).
 *
 * Everything the bench states about a modified item folds this list through
 * `applyPersonalModifiers`, so a locked slot dropping out here is what makes it
 * drop out of every figure at once.
 */

/** The recipes an item's grade has unlocked, in slot order. */
export function unlockedRecipes(slots: ModificationSlots, unlocked: number): readonly string[] {
  return slots.slice(0, Math.max(0, unlocked)).filter((symbol) => symbol !== null);
}

/** The modifiers those recipes carry, in the order they are fitted. */
export function modifiersOf(recipes: readonly string[]): readonly PersonalModifier[] {
  return recipes.flatMap((symbol) => getPersonalModification(symbol)?.modifiers ?? []);
}
