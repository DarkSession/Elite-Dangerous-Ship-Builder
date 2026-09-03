import { describe, expect, it } from 'vitest';
import {
  clearSlot,
  fitModification,
  fitWeapon,
  newLoadout,
  resolveForWeapon,
  selectSuit,
  setSuitGrade,
  setWeaponGrade,
  slotsOf,
} from './loadout-edit';
import type { EquipmentLoadout } from '../loadout-link/equipment-loadout';

const RIFLE = 'wpn_m_assaultrifle_plasma_fauto';
const PISTOL = 'wpn_s_pistol_kinetic_sauto';

const dominator = (): EquipmentLoadout => newLoadout('tacticalsuit')!;

describe('starting a loadout', () => {
  it('opens a suit at its lowest published grade with every mount empty', () => {
    const loadout = dominator();

    expect(loadout.suitGrade).toBe(1);
    expect(loadout.suitModifications).toEqual([null, null, null, null]);
    expect(loadout.weapons).toEqual([null, null, null]);
  });

  it('answers no loadout for a suit family this release does not publish', () => {
    expect(newLoadout('stealthsuit')).toBeNull();
  });
});

describe('selecting a suit', () => {
  it('keeps a weapon on a mount the new suit does not carry', () => {
    // The Maverick carries one primary mount. Nothing is discarded: the weapon
    // on the second is held and returns on a suit that carries it (FR-007).
    const fitted = fitWeapon(setSuitGrade(dominator(), 5), 'PrimaryWeapon2', RIFLE);
    const maverick = selectSuit(fitted, 'utilitysuit');

    expect(maverick.weapons[1]).toEqual(fitted.weapons[1]);
    expect(selectSuit(maverick, 'tacticalsuit').weapons).toEqual(fitted.weapons);
  });

  it('brings the grade down to the highest the new suit publishes', () => {
    // The Flight Suit publishes grade 1 alone.
    const flight = selectSuit(setSuitGrade(dominator(), 5), 'flightsuit');

    expect(flight.suitGrade).toBe(1);
    // And back up is a choice, not an undo: the grade stays where it was put.
    expect(selectSuit(flight, 'tacticalsuit').suitGrade).toBe(1);
  });

  it('keeps the suit modifications the new suit has locked', () => {
    // A locked slot holds what was fitted to it and is back in effect when the
    // grade is raised (FR-011).
    const modified = fitModification(setSuitGrade(dominator(), 5), 'suit', 3, 'suit_nightvision');

    expect(selectSuit(modified, 'flightsuit').suitModifications).toEqual(
      modified.suitModifications,
    );
  });

  it('refuses a suit family this release does not publish', () => {
    const loadout = dominator();

    expect(selectSuit(loadout, 'stealthsuit')).toBe(loadout);
    expect(selectSuit(loadout, 'tacticalsuit')).toBe(loadout);
  });
});

describe('grades', () => {
  it('sets a grade the item publishes and refuses one it does not', () => {
    const loadout = dominator();

    expect(setSuitGrade(loadout, 4).suitGrade).toBe(4);
    expect(setSuitGrade(loadout, 6)).toBe(loadout);
    expect(setSuitGrade(loadout, 1)).toBe(loadout);
    expect(setSuitGrade(selectSuit(loadout, 'flightsuit'), 2).suitGrade).toBe(1);
  });

  it('sets a weapon grade independently of the suit', () => {
    // A weapon's grade is its own and unrelated to the suit's (FR-002a).
    const fitted = fitWeapon(dominator(), 'PrimaryWeapon1', RIFLE);
    const raised = setWeaponGrade(fitted, 'PrimaryWeapon1', 5);

    expect(raised.weapons[0]?.grade).toBe(5);
    expect(raised.suitGrade).toBe(1);
    expect(setWeaponGrade(raised, 'PrimaryWeapon1', 7)).toBe(raised);
    expect(setWeaponGrade(raised, 'PrimaryWeapon2', 3)).toBe(raised);
  });
});

describe('fitting a weapon', () => {
  it('fits a weapon the mount takes and refuses one it does not', () => {
    const loadout = dominator();

    expect(fitWeapon(loadout, 'PrimaryWeapon1', RIFLE).weapons[0]?.symbol).toBe(RIFLE);
    // A rifle does not go on the secondary mount, whichever suit is worn.
    expect(fitWeapon(loadout, 'SecondaryWeapon', RIFLE)).toBe(loadout);
    expect(fitWeapon(loadout, 'PrimaryWeapon1', PISTOL)).toBe(loadout);
    expect(fitWeapon(loadout, 'PrimaryWeapon1', 'wpn_s_pistol_thargoid')).toBe(loadout);
  });

  it('keeps the grade the mount carried and clears the slots', () => {
    // A recipe fitted to the weapon that was there is not one this weapon
    // necessarily takes, so the slots start empty.
    const fitted = setWeaponGrade(
      fitWeapon(dominator(), 'PrimaryWeapon1', RIFLE),
      'PrimaryWeapon1',
      4,
    );
    const modified = fitModification(fitted, 'PrimaryWeapon1', 0, 'weapon_clipsize');
    const swapped = fitWeapon(modified, 'PrimaryWeapon1', 'wpn_m_sniper_plasma_charged');

    expect(swapped.weapons[0]?.grade).toBe(4);
    expect(swapped.weapons[0]?.modifications).toEqual([null, null, null, null]);
  });

  it('empties a mount', () => {
    const fitted = fitWeapon(dominator(), 'PrimaryWeapon1', RIFLE);

    expect(fitWeapon(fitted, 'PrimaryWeapon1', null).weapons[0]).toBeNull();
    expect(fitWeapon(dominator(), 'PrimaryWeapon1', null)).toEqual(dominator());
  });

  it('fits a weapon to a mount the worn suit does not carry', () => {
    // Held content is a choice a Commander made, so it can be made deliberately
    // as well as inherited from a suit change (FR-018a).
    const maverick = selectSuit(dominator(), 'utilitysuit');

    expect(fitWeapon(maverick, 'PrimaryWeapon2', RIFLE).weapons[1]?.symbol).toBe(RIFLE);
  });
});

describe('fitting a modification', () => {
  const graded = (): EquipmentLoadout =>
    setWeaponGrade(
      fitWeapon(setSuitGrade(dominator(), 5), 'PrimaryWeapon1', RIFLE),
      'PrimaryWeapon1',
      5,
    );

  it('fits a recipe the item takes, in the slot named', () => {
    const fitted = fitModification(graded(), 'suit', 2, 'suit_nightvision');

    expect(fitted.suitModifications).toEqual([null, null, 'suit_nightvision', null]);
    expect(slotsOf(fitted, 'suit')).toEqual(fitted.suitModifications);
  });

  it('refuses a recipe meant for the other kind of item', () => {
    const loadout = graded();

    expect(fitModification(loadout, 'suit', 0, 'weapon_scope')).toBe(loadout);
    expect(fitModification(loadout, 'PrimaryWeapon1', 0, 'suit_nightvision')).toBe(loadout);
    expect(fitModification(loadout, 'suit', 0, 'suit_invisibility')).toBe(loadout);
  });

  it('takes the spelling of a three-technology recipe the package pairs with the weapon', () => {
    // Greater Range is three recipes, one per damage technology, and the
    // package settles which one a weapon takes (FR-015).
    const loadout = graded();

    expect(resolveForWeapon(RIFLE, 'weapon_range_kinetic')).toBe('weapon_range_plasma');
    expect(
      fitModification(loadout, 'PrimaryWeapon1', 0, 'weapon_range_plasma').weapons[0]
        ?.modifications[0],
    ).toBe('weapon_range_plasma');
    expect(fitModification(loadout, 'PrimaryWeapon1', 0, 'weapon_range_kinetic')).toBe(loadout);
  });

  it('refuses one recipe fitted twice on one item', () => {
    const once = fitModification(graded(), 'suit', 0, 'suit_nightvision');

    expect(fitModification(once, 'suit', 1, 'suit_nightvision')).toBe(once);
    // The slot it is already in is not a second fitting.
    expect(fitModification(once, 'suit', 0, 'suit_nightvision')).toBe(once);
  });

  it('refuses a slot outside the four every item addresses', () => {
    const loadout = graded();

    for (const slot of [-1, 4, 1.5]) {
      expect(fitModification(loadout, 'suit', slot, 'suit_nightvision')).toBe(loadout);
      expect(clearSlot(loadout, 'suit', slot)).toBe(loadout);
    }
  });

  it('refuses a mount with nothing on it', () => {
    const loadout = graded();

    expect(fitModification(loadout, 'SecondaryWeapon', 0, 'weapon_scope')).toBe(loadout);
    expect(slotsOf(loadout, 'SecondaryWeapon')).toBeNull();
  });

  it('fits a modification into a slot the grade has locked, and keeps it there', () => {
    // Slot position is what a grade unlocks, so slot 4 is addressed at every
    // grade and holds what was fitted to it (FR-008, FR-011).
    const held = fitModification(graded(), 'suit', 3, 'suit_nightvision');
    const lowered = setSuitGrade(held, 2);

    expect(lowered.suitModifications[3]).toBe('suit_nightvision');
    expect(setSuitGrade(lowered, 5).suitModifications[3]).toBe('suit_nightvision');
  });

  it('clears a slot, and clearing an empty one changes nothing', () => {
    const fitted = fitModification(graded(), 'PrimaryWeapon1', 1, 'weapon_scope');

    expect(clearSlot(fitted, 'PrimaryWeapon1', 1).weapons[0]?.modifications).toEqual([
      null,
      null,
      null,
      null,
    ]);
    expect(clearSlot(fitted, 'PrimaryWeapon1', 0)).toBe(fitted);
  });
});
