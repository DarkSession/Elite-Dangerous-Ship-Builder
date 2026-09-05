import { describe, expect, it } from 'vitest';
import { getPersonalModificationCost } from '@elite-dangerous-almanac/core/equipment/modification-costs';
import { sumPersonalEngineeringIngredients } from '@elite-dangerous-almanac/core/equipment/engineering';
import {
  getPersonalWeaponUpgradeCost,
  getSuitUpgradeCost,
} from '@elite-dangerous-almanac/core/equipment/upgrade-costs';
import { materialRequirement } from './material-requirement';
import type { EquipmentLoadout, ModificationSlots } from '../loadout-link/equipment-loadout';

const EMPTY_SLOTS: ModificationSlots = [null, null, null, null];
const RIFLE = 'wpn_m_assaultrifle_plasma_fauto';

const cost = (symbol: string) => getPersonalModificationCost(symbol)!;
const suitClimb = (family: string, grade: number) => getSuitUpgradeCost(family, grade)!;
const weaponClimb = (symbol: string, grade: number) => getPersonalWeaponUpgradeCost(symbol, grade)!;

const loadout = (
  weapons: EquipmentLoadout['weapons'],
  suitModifications = EMPTY_SLOTS,
  suitGrade = 5,
  suitFamily = 'tacticalsuit',
): EquipmentLoadout => ({ suitFamily, suitGrade, suitModifications, weapons });

const NOTHING = { ingredients: [], types: 0, units: 0 };

describe('material requirement', () => {
  it('requires nothing at grade 1 with nothing fitted', () => {
    expect(materialRequirement(loadout([null, null, null], EMPTY_SLOTS, 1))).toEqual(NOTHING);
  });

  it('requires nothing for a suit the package publishes no upgrade recipe for', () => {
    // The Flight Suit has one grade and no ladder to climb (FR-014).
    expect(materialRequirement(loadout([null, null, null], EMPTY_SLOTS, 1, 'flightsuit'))).toEqual(
      NOTHING,
    );
  });

  it('sums the climb to each grade and every fitted modification through the package', () => {
    const requirement = materialRequirement(
      loadout(
        [
          { symbol: RIFLE, grade: 4, modifications: ['weapon_clipsize', null, null, null] },
          null,
          null,
        ],
        ['suit_nightvision', null, null, null],
      ),
    );

    expect(requirement.ingredients).toEqual(
      sumPersonalEngineeringIngredients(
        suitClimb('tacticalsuit', 5),
        weaponClimb(RIFLE, 4),
        cost('suit_nightvision'),
        cost('weapon_clipsize'),
      ),
    );
    expect(requirement.types).toBe(requirement.ingredients.length);
    expect(requirement.units).toBe(
      requirement.ingredients.reduce((total, entry) => total + entry.count, 0),
    );
  });

  it('counts the climb from grade 1, so a higher grade asks for more', () => {
    const two = materialRequirement(loadout([null, null, null], EMPTY_SLOTS, 2));
    const five = materialRequirement(loadout([null, null, null], EMPTY_SLOTS, 5));

    expect(two.ingredients).toEqual(suitClimb('tacticalsuit', 2));
    expect(five.ingredients).toEqual(suitClimb('tacticalsuit', 5));
    expect(five.units).toBeGreaterThan(two.units);
  });

  it('leaves a locked slot out of the total, and puts it back when the grade rises', () => {
    // Grade 3 unlocks two slots (FR-011).
    const held = loadout([null, null, null], [null, null, 'suit_nightvision', null], 3);

    expect(materialRequirement(held).ingredients).toEqual(suitClimb('tacticalsuit', 3));
    expect(materialRequirement({ ...held, suitGrade: 5 }).ingredients).toEqual(
      sumPersonalEngineeringIngredients(suitClimb('tacticalsuit', 5), cost('suit_nightvision')),
    );
  });

  it('leaves a held mount’s weapon out of the total, climb and all', () => {
    // The Maverick carries one primary mount, so the second's weapon is neither
    // raised nor modified until a suit carrying that mount is worn (FR-007).
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

    expect(materialRequirement(held).ingredients).toEqual(suitClimb('utilitysuit', 4));
    expect(materialRequirement({ ...held, suitFamily: 'tacticalsuit' }).ingredients).toEqual(
      sumPersonalEngineeringIngredients(
        suitClimb('tacticalsuit', 4),
        weaponClimb(RIFLE, 5),
        cost('weapon_clipsize'),
      ),
    );
  });
});
