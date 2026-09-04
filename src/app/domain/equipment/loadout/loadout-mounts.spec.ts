import { describe, expect, it } from 'vitest';
import { SUITS } from '@elite-dangerous-almanac/core/equipment/suits';
import { CATALOGUE_MOUNTS, mountAvailability, mountPosition, offers } from './loadout-mounts';
import type { EquipmentLoadout, ModificationSlots } from '../loadout-link/equipment-loadout';

const EMPTY_SLOTS: ModificationSlots = [null, null, null, null];

const loadout = (suitFamily: string, weapons: EquipmentLoadout['weapons']): EquipmentLoadout => ({
  suitFamily,
  suitGrade: 1,
  suitModifications: EMPTY_SLOTS,
  weapons,
});

const rifle = { symbol: 'wpn_m_assaultrifle_plasma_fauto', grade: 1, modifications: EMPTY_SLOTS };

describe('catalogue mounts', () => {
  it('holds every mount any suit carries, once each', () => {
    const published = new Set(SUITS.flatMap((suit) => suit.mounts.map((mount) => mount.key)));

    expect(new Set(CATALOGUE_MOUNTS.map((mount) => mount.key))).toEqual(published);
    expect(CATALOGUE_MOUNTS.length).toBe(published.size);
  });

  it('lists them in the order the game lists them', () => {
    // Merged from the suits' own lists rather than sorted, so the order is the
    // game's and this application invents no comparator for it.
    expect(CATALOGUE_MOUNTS.map((mount) => mount.key)).toEqual([
      'PrimaryWeapon1',
      'PrimaryWeapon2',
      'SecondaryWeapon',
    ]);
  });

  it('keeps every mount in the order the suit that carries them lists them', () => {
    for (const suit of SUITS) {
      const positions = suit.mounts.map((mount) => mountPosition(mount.key));

      expect(positions).not.toContain(-1);
      expect([...positions].sort((one, other) => one - other)).toEqual(positions);
    }
  });

  it('says which kind of weapon each mount takes', () => {
    expect(CATALOGUE_MOUNTS.map((mount) => mount.kind)).toEqual([
      'primary',
      'primary',
      'secondary',
    ]);
  });
});

describe('mount availability', () => {
  it('offers every mount the worn suit carries', () => {
    // The Dominator carries all three.
    expect(mountAvailability(loadout('tacticalsuit', [null, null, null]))).toEqual([
      'offered',
      'offered',
      'offered',
    ]);
  });

  it('holds a weapon on a mount the worn suit does not carry', () => {
    // The Maverick carries one primary mount. A weapon on the second is held —
    // named, counted in nothing, and restored on a suit that carries it
    // (FR-007).
    expect(mountAvailability(loadout('utilitysuit', [null, rifle, null]))).toEqual([
      'offered',
      'held',
      'offered',
    ]);
  });

  it('leaves an empty mount the worn suit does not carry absent', () => {
    // Nothing is drawn for it: there is no weapon to name and no mount to fill.
    expect(mountAvailability(loadout('utilitysuit', [null, null, null]))).toEqual([
      'offered',
      'absent',
      'offered',
    ]);
  });

  it('holds both primary mounts on the Flight Suit, which carries neither', () => {
    expect(mountAvailability(loadout('flightsuit', [rifle, rifle, null]))).toEqual([
      'held',
      'held',
      'offered',
    ]);
  });

  it('treats a suit family this release does not publish as carrying no mount', () => {
    expect(offers('stealthsuit', 'PrimaryWeapon1')).toBe(false);
    expect(mountAvailability(loadout('stealthsuit', [rifle, null, null]))).toEqual([
      'held',
      'absent',
      'absent',
    ]);
  });
});
