import { describe, expect, it } from 'vitest';
import { PERSONAL_WEAPONS } from '@elite-dangerous-almanac/core/equipment/weapons';
import { PERSONAL_MODIFICATIONS } from '@elite-dangerous-almanac/core/equipment/modifications';
import { SUITS } from '@elite-dangerous-almanac/core/equipment/suits';
import { modificationCandidates, suitCandidates, weaponCandidates } from './candidate-query';
import type {
  EquipmentLoadout,
  ModificationSlots,
} from '../../domain/equipment/loadout-link/equipment-loadout';

const EMPTY_SLOTS: ModificationSlots = [null, null, null, null];
const RIFLE = 'wpn_m_assaultrifle_plasma_fauto';

const bench = (
  weapons: EquipmentLoadout['weapons'] = [null, null, null],
  suitModifications = EMPTY_SLOTS,
): EquipmentLoadout => ({
  suitFamily: 'tacticalsuit',
  suitGrade: 5,
  suitModifications,
  weapons,
});

describe('what may be chosen', () => {
  it('offers every suit the release publishes, and no other', () => {
    expect(suitCandidates()).toEqual(SUITS.map((suit) => suit.family));
  });

  it('offers a mount only the weapons its own kind takes', () => {
    // The mount's kind and never the whole catalogue (FR-003, FR-004).
    const primary = weaponCandidates('PrimaryWeapon1');
    const secondary = weaponCandidates('SecondaryWeapon');

    expect(primary).toEqual(
      PERSONAL_WEAPONS.filter((weapon) => weapon.slot === 'primary').map((weapon) => weapon.symbol),
    );
    expect(secondary).toEqual(
      PERSONAL_WEAPONS.filter((weapon) => weapon.slot === 'secondary').map(
        (weapon) => weapon.symbol,
      ),
    );
    expect(primary.some((symbol) => secondary.includes(symbol))).toBe(false);
    expect(weaponCandidates('PrimaryWeapon2')).toEqual(primary);
  });

  it('offers a suit slot the suit recipes and never a weapon’s', () => {
    const offered = modificationCandidates(bench(), 'suit', 0).map((candidate) => candidate.symbol);

    expect(offered).toEqual(
      Object.entries(PERSONAL_MODIFICATIONS)
        .filter(([, recipe]) => recipe.target === 'suit')
        .map(([symbol]) => symbol),
    );
  });

  it('offers a three-technology recipe as the one spelling the weapon takes', () => {
    // Greater Range is three recipes, one per damage technology; the plasma
    // rifle takes one of them (FR-015).
    const offered = modificationCandidates(
      bench([{ symbol: RIFLE, grade: 5, modifications: EMPTY_SLOTS }, null, null]),
      'PrimaryWeapon1',
      0,
    ).map((candidate) => candidate.symbol);

    expect(offered).toContain('weapon_range_plasma');
    expect(offered).not.toContain('weapon_range_kinetic');
    expect(offered).not.toContain('weapon_range_laser');
    expect(offered.filter((symbol) => symbol.startsWith('weapon_range_')).length).toBe(1);
  });

  it('marks a recipe another slot on the same item already holds', () => {
    // Offered and marked rather than hidden: it is why the slot cannot take it,
    // and a list that dropped it would leave a Commander looking for something
    // the game says they already have (FR-009).
    const fitted = modificationCandidates(
      bench([null, null, null], ['suit_nightvision', null, null, null]),
      'suit',
      1,
    );

    expect(fitted.find((candidate) => candidate.symbol === 'suit_nightvision')?.fitted).toBe(true);
    expect(fitted.filter((candidate) => candidate.fitted).length).toBe(1);
  });

  it('does not mark the recipe the slot itself holds', () => {
    const held = modificationCandidates(
      bench([null, null, null], ['suit_nightvision', null, null, null]),
      'suit',
      0,
    );

    expect(held.find((candidate) => candidate.symbol === 'suit_nightvision')?.fitted).toBe(false);
  });

  it('offers nothing for a mount with no weapon on it, or a slot outside the four', () => {
    expect(modificationCandidates(bench(), 'PrimaryWeapon1', 0)).toEqual([]);
    expect(modificationCandidates(bench(), 'suit', 4)).toEqual([]);
    expect(modificationCandidates(bench(), 'suit', -1)).toEqual([]);
  });
});
