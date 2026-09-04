import { describe, expect, it } from 'vitest';
import { getPersonalModificationCost } from '@elite-dangerous-almanac/core/equipment/modification-costs';
import { sumPersonalEngineeringIngredients } from '@elite-dangerous-almanac/core/equipment/engineering';
import { materialRequirement } from './material-requirement';
import type { EquipmentLoadout, ModificationSlots } from '../loadout-link/equipment-loadout';

const EMPTY_SLOTS: ModificationSlots = [null, null, null, null];
const RIFLE = 'wpn_m_assaultrifle_plasma_fauto';

const cost = (symbol: string) => getPersonalModificationCost(symbol)!;

const loadout = (
  weapons: EquipmentLoadout['weapons'],
  suitModifications = EMPTY_SLOTS,
  suitGrade = 5,
  suitFamily = 'tacticalsuit',
): EquipmentLoadout => ({ suitFamily, suitGrade, suitModifications, weapons });

describe('material requirement', () => {
  it('requires nothing when nothing is fitted', () => {
    expect(materialRequirement(loadout([null, null, null]))).toEqual({
      ingredients: [],
      types: 0,
      units: 0,
    });
  });

  it('sums every fitted modification through the package', () => {
    const requirement = materialRequirement(
      loadout(
        [
          { symbol: RIFLE, grade: 5, modifications: ['weapon_clipsize', null, null, null] },
          null,
          null,
        ],
        ['suit_nightvision', null, null, null],
      ),
    );

    expect(requirement.ingredients).toEqual(
      sumPersonalEngineeringIngredients(cost('suit_nightvision'), cost('weapon_clipsize')),
    );
    expect(requirement.types).toBe(requirement.ingredients.length);
    expect(requirement.units).toBe(
      requirement.ingredients.reduce((total, entry) => total + entry.count, 0),
    );
  });

  it('counts one application of each modification and no grade upgrade', () => {
    // The material requirement covers applying a modification. Raising a grade
    // is paid for separately at a settlement (FR-014).
    const one = materialRequirement(
      loadout([null, null, null], ['suit_nightvision', null, null, null]),
    );
    const five = materialRequirement(
      loadout([null, null, null], ['suit_nightvision', null, null, null], 5),
    );
    const two = materialRequirement(
      loadout([null, null, null], ['suit_nightvision', null, null, null], 2),
    );

    expect(one.ingredients).toEqual(cost('suit_nightvision'));
    expect(five).toEqual(two);
  });

  it('leaves a locked slot out of the total, and puts it back when the grade rises', () => {
    // Grade 3 unlocks two slots (FR-011).
    const held = loadout([null, null, null], [null, null, 'suit_nightvision', null], 3);

    expect(materialRequirement(held).units).toBe(0);
    expect(materialRequirement({ ...held, suitGrade: 5 }).ingredients).toEqual(
      cost('suit_nightvision'),
    );
  });

  it('leaves a held mount’s weapon out of the total', () => {
    // The Maverick carries one primary mount, so the second's modifications
    // cost nothing until a suit carrying that mount is worn (FR-007).
    const held = loadout(
      [
        null,
        { symbol: RIFLE, grade: 5, modifications: ['weapon_clipsize', null, null, null] },
        null,
      ],
      EMPTY_SLOTS,
      4,
      'utilitysuit',
    );

    expect(materialRequirement(held).units).toBe(0);
    expect(materialRequirement({ ...held, suitFamily: 'tacticalsuit' }).ingredients).toEqual(
      cost('weapon_clipsize'),
    );
  });
});
