import { describe, expect, it } from 'vitest';
import { applyPersonalModifiers } from '@elite-dangerous-almanac/core/equipment/engineering';
import { getSuitByFamily, getSuitGrade } from '@elite-dangerous-almanac/core/equipment/suits';
import { getPersonalModification } from '@elite-dangerous-almanac/core/equipment/modifications';
import { publishedSuitGrades, suitReadings } from './suit-readings';
import type { EquipmentLoadout, ModificationSlots } from '../loadout-link/equipment-loadout';

const EMPTY_SLOTS: ModificationSlots = [null, null, null, null];

const dominator = (suitGrade: number, suitModifications = EMPTY_SLOTS): EquipmentLoadout => ({
  suitFamily: 'tacticalsuit',
  suitGrade,
  suitModifications,
  weapons: [null, null, null],
});

const grade = (family: string, value: number) => getSuitGrade(getSuitByFamily(family)!, value)!;
const suit = (family: string) => getSuitByFamily(family)!;

describe('suit readings', () => {
  it('states the package’s own figures at the selected grade', () => {
    const published = grade('tacticalsuit', 4);
    const readings = suitReadings(dominator(4))!;

    expect(readings.shieldStrength).toBe(published.shieldStrength);
    expect(readings.shieldRegeneration).toBe(published.shieldRegeneration);
    // Two published sets since 0.2.10: the armour's on the grade, the shield's
    // on the family, and neither is the other.
    expect(readings.armourKineticResistance).toBe(published.armourKineticResistance);
    expect(readings.armourThermalResistance).toBe(published.armourThermalResistance);
    expect(readings.armourPlasmaResistance).toBe(published.armourPlasmaResistance);
    expect(readings.armourExplosiveResistance).toBe(published.armourExplosiveResistance);
    expect(readings.shieldKineticResistance).toBe(suit('tacticalsuit').shieldKineticResistance);
    expect(readings.shieldThermalResistance).toBe(suit('tacticalsuit').shieldThermalResistance);
    expect(readings.shieldPlasmaResistance).toBe(suit('tacticalsuit').shieldPlasmaResistance);
    expect(readings.shieldExplosiveResistance).toBe(suit('tacticalsuit').shieldExplosiveResistance);
    expect(readings.modificationSlots).toBe(published.modificationSlots);
  });

  it('folds a fitted modification through the package rather than here', () => {
    // Faster Shield Regen is ×1.25 on `shieldRegeneration`. The expected value
    // is the package's own fold of the same base and modifier, so a test that
    // multiplied 1.25 here would be a second implementation of the arithmetic.
    const recipe = getPersonalModification('suit_increasedshieldregen')!;
    const published = grade('tacticalsuit', 5);
    const readings = suitReadings(dominator(5, ['suit_increasedshieldregen', null, null, null]))!;

    expect(readings.shieldRegeneration).toBe(
      applyPersonalModifiers('shieldRegeneration', published.shieldRegeneration, recipe.modifiers),
    );
    expect(readings.shieldRegeneration).toBeGreaterThan(published.shieldRegeneration);
  });

  it('folds a resistance on damage taken, which is the package’s own rule', () => {
    // Damage Resistance is ×0.9 on damage *taken*, so a 0.5 resistance becomes
    // 0.55 rather than 0.45. The bench does not reimplement that rule.
    const recipe = getPersonalModification('suit_improvedarmourrating')!;
    const published = grade('tacticalsuit', 5);
    const readings = suitReadings(dominator(5, ['suit_improvedarmourrating', null, null, null]))!;

    expect(readings.armourKineticResistance).toBe(
      applyPersonalModifiers(
        'armourKineticResistance',
        published.armourKineticResistance,
        recipe.modifiers,
      ),
    );

    // The recipe points at the armour's four alone, so the shield's are exactly
    // what the suit publishes — the split is a real one, not two readings of one
    // number.
    expect(readings.shieldKineticResistance).toBe(suit('tacticalsuit').shieldKineticResistance);
  });

  it('leaves a modification in a locked slot out of every figure', () => {
    // Grade 3 unlocks two slots, so the recipe in slot 3 states nothing until
    // the grade is raised again (FR-011).
    const held = dominator(3, [null, null, 'suit_increasedshieldregen', null]);

    expect(suitReadings(held)!.unlocked).toEqual([]);
    expect(suitReadings(held)!.shieldRegeneration).toBe(
      grade('tacticalsuit', 3).shieldRegeneration,
    );
    expect(suitReadings({ ...held, suitGrade: 5 })!.unlocked).toEqual([
      'suit_increasedshieldregen',
    ]);
  });

  it('states a recipe with no published magnitude as no numeric change', () => {
    // Night Vision moves nothing. It is fitted and in effect, and it is never
    // rendered as a zero (constitution IV).
    const plain = suitReadings(dominator(5))!;
    const withNightVision = suitReadings(dominator(5, ['suit_nightvision', null, null, null]))!;

    expect(withNightVision.unlocked).toEqual(['suit_nightvision']);
    expect(withNightVision.shieldStrength).toBe(plain.shieldStrength);
  });

  it('answers nothing where the release publishes no such suit or grade', () => {
    expect(suitReadings({ ...dominator(5), suitFamily: 'stealthsuit' })).toBeNull();
    expect(suitReadings({ ...dominator(5), suitFamily: 'flightsuit', suitGrade: 5 })).toBeNull();
    expect(suitReadings(dominator(9))).toBeNull();
  });

  it('publishes each suit’s own grades, and the Flight Suit’s one', () => {
    expect(publishedSuitGrades('tacticalsuit')).toEqual([1, 2, 3, 4, 5]);
    expect(publishedSuitGrades('flightsuit')).toEqual([1]);
    expect(publishedSuitGrades('stealthsuit')).toEqual([]);
  });
});
