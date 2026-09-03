import { applyPersonalModifiers } from '@elite-dangerous-almanac/core/equipment/engineering';
import { getSuitByFamily, getSuitGrade } from '@elite-dangerous-almanac/core/equipment/suits';
import type { Suit } from '@elite-dangerous-almanac/core/equipment/suits';
import type { EquipmentLoadout } from '../loadout-link/equipment-loadout';
import { modifiersOf, unlockedRecipes } from './fitted-modifiers';

/** What the suit on the bench is worth at the grade it is set to. */
export interface SuitReadings {
  /** The suit's own identity, which it keeps at every grade. */
  readonly family: string;
  /** Shield points, modified. */
  readonly shieldStrength: number;
  /** Shield points regenerated per second, modified. */
  readonly shieldRegeneration: number;
  /** Damage resistances as fractions; a negative one increases damage taken. */
  readonly kineticResistance: number;
  readonly thermalResistance: number;
  readonly plasmaResistance: number;
  readonly explosiveResistance: number;
  /** Modification slots this grade unlocks. */
  readonly modificationSlots: number;
  /** The recipes in those slots, which are the ones in effect. */
  readonly unlocked: readonly string[];
}

const RESISTANCES = [
  'kineticResistance',
  'thermalResistance',
  'plasmaResistance',
  'explosiveResistance',
] as const;

/**
 * The suit's figures, each one the package's answer.
 *
 * A resistance folds on damage *taken*, which `applyPersonalModifiers` already
 * handles for any stat whose name ends in `Resistance`: Damage Resistance is
 * ×0.9 on damage taken, which turns a 0.5 resistance into 0.55 rather than 0.45.
 * The bench does not reimplement that rule and does not correct it.
 *
 * `null` where the release publishes no such suit, or no such grade of it. It is
 * never a zero (constitution IV).
 */
export function suitReadings(loadout: EquipmentLoadout): SuitReadings | null {
  const suit = getSuitByFamily(loadout.suitFamily);
  if (suit === null) return null;
  // Asked of the published list first: the accessor raises on a grade outside
  // 1-5 rather than answering `null`, and a loadout that arrived from storage or
  // an older release may name one.
  if (!gradesOf(suit).includes(loadout.suitGrade)) return null;
  const grade = getSuitGrade(suit, loadout.suitGrade);
  if (grade === null) return null;

  const unlocked = unlockedRecipes(loadout.suitModifications, grade.modificationSlots);
  const modifiers = modifiersOf(unlocked);
  const fold = (stat: string, base: number): number =>
    applyPersonalModifiers(stat, base, modifiers);

  return {
    family: suit.family,
    shieldStrength: fold('shieldStrength', grade.shieldStrength),
    shieldRegeneration: fold('shieldRegeneration', grade.shieldRegeneration),
    ...(Object.fromEntries(RESISTANCES.map((stat) => [stat, fold(stat, grade[stat])])) as Record<
      (typeof RESISTANCES)[number],
      number
    >),
    modificationSlots: grade.modificationSlots,
    unlocked,
  };
}

/** Every grade the suit publishes, lowest first, or none where there is no such suit. */
export function publishedSuitGrades(suitFamily: string): readonly number[] {
  return gradesOf(getSuitByFamily(suitFamily));
}

function gradesOf(suit: Suit | null): readonly number[] {
  if (suit === null) return [];
  return Object.keys(suit.grades)
    .map(Number)
    .sort((one, other) => one - other);
}
