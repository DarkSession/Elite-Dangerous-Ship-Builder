import { describe, expect, it } from 'vitest';
import { applyPersonalModifiers } from '@elite-dangerous-almanac/core/equipment/engineering';
import {
  getPersonalWeaponBySymbol,
  getPersonalWeaponGrade,
  personalWeaponMetrics,
} from '@elite-dangerous-almanac/core/equipment/weapons';
import { getPersonalModification } from '@elite-dangerous-almanac/core/equipment/modifications';
import { fittedWeaponReadings, publishedWeaponGrades, weaponReadings } from './weapon-readings';
import type { EquipmentLoadout, ModificationSlots } from '../loadout-link/equipment-loadout';

const EMPTY_SLOTS: ModificationSlots = [null, null, null, null];
const RIFLE = 'wpn_m_assaultrifle_plasma_fauto';
const PISTOL = 'wpn_s_pistol_kinetic_sauto';

const weapon = (symbol: string) => getPersonalWeaponBySymbol(symbol)!;
const modifiers = (...symbols: string[]) =>
  symbols.flatMap((symbol) => getPersonalModification(symbol)!.modifiers);

const fitted = (symbol: string, grade: number, modifications = EMPTY_SLOTS) => ({
  symbol,
  grade,
  modifications,
});

const loadout = (
  suitFamily: string,
  weapons: EquipmentLoadout['weapons'],
  suitModifications = EMPTY_SLOTS,
  suitGrade = 5,
): EquipmentLoadout => ({ suitFamily, suitGrade, suitModifications, weapons });

describe('weapon readings', () => {
  it('states the package’s own catalogue figures at the selected grade', () => {
    const readings = weaponReadings('PrimaryWeapon1', fitted(RIFLE, 4), [])!;
    const published = weapon(RIFLE);

    expect(readings.damage).toBe(getPersonalWeaponGrade(published, 4)!.damage);
    expect(readings.rateOfFire).toBe(published.rateOfFire);
    expect(readings.magazineSize).toBe(published.magazineSize);
    expect(readings.reserveAmmo).toBe(published.reserveAmmo);
    expect(readings.effectiveRange).toBe(published.effectiveRange);
    expect(readings.headshotMultiplier).toBe(published.headshotMultiplier);
    expect(readings.scopeMagnification).toBe(published.scopeMagnification.default);
    expect(readings.reloadTime).toBe(published.reloadTime.default);
  });

  it('takes every derived combat figure from personalWeaponMetrics', () => {
    const readings = weaponReadings('PrimaryWeapon1', fitted(RIFLE, 5), [])!;

    expect(readings.metrics).toEqual(personalWeaponMetrics(weapon(RIFLE), 5, [], {}));
  });

  it('passes the fitted modifiers into the call as they are', () => {
    // The call reads `magazineSize` and `headshotMultiplier` off the list and
    // ignores modifiers naming other stats. Filtering the list here would be
    // this application deciding what a figure is made of.
    const slots = ['weapon_clipsize', 'weapon_headshotdamage_plasma', 'weapon_stability', null];
    const readings = weaponReadings('PrimaryWeapon1', fitted(RIFLE, 5, slots), [])!;

    expect(readings.metrics).toEqual(
      personalWeaponMetrics(
        weapon(RIFLE),
        5,
        modifiers('weapon_clipsize', 'weapon_headshotdamage_plasma', 'weapon_stability'),
        {},
      ),
    );
  });

  it('passes Reload Speed as an option, because it carries no modifier', () => {
    // Its magnitude is the weapon's own `reloadTime.upgraded`. A call passing
    // only the modifier list would state the unmodified sustained figure, and
    // nothing in the list would reveal it.
    const slots = ['weapon_reloadspeed', null, null, null];
    const readings = weaponReadings('PrimaryWeapon1', fitted(RIFLE, 5, slots), [])!;

    expect(getPersonalModification('weapon_reloadspeed')!.modifiers).toEqual([]);
    expect(readings.reloadTime).toBe(weapon(RIFLE).reloadTime.upgraded);
    expect(readings.metrics).toEqual(
      personalWeaponMetrics(weapon(RIFLE), 5, [], { reloadSpeed: true }),
    );
    expect(readings.metrics.sustainedDamagePerSecond).toBeGreaterThan(
      personalWeaponMetrics(weapon(RIFLE), 5, [], {})!.sustainedDamagePerSecond,
    );
  });

  it('states Scope as the weapon’s own upgraded magnification', () => {
    const slots = ['weapon_scope', null, null, null];
    const readings = weaponReadings('PrimaryWeapon1', fitted(RIFLE, 5, slots), [])!;

    expect(getPersonalModification('weapon_scope')!.modifiers).toEqual([]);
    expect(readings.scopeMagnification).toBe(weapon(RIFLE).scopeMagnification.upgraded);
  });

  it('folds the suit’s Extra Ammo Capacity into the weapon’s reserve', () => {
    // A suit recipe that moves a weapon's stat. Read from the weapon's own
    // modifiers alone, the reserve would never change.
    const suitModifiers = modifiers('suit_increasedammoreserves');
    const readings = weaponReadings('PrimaryWeapon1', fitted(RIFLE, 5), suitModifiers)!;

    expect(readings.reserveAmmo).toBe(
      applyPersonalModifiers('reserveAmmo', weapon(RIFLE).reserveAmmo, suitModifiers),
    );
    expect(readings.reserveAmmo).toBeGreaterThan(weapon(RIFLE).reserveAmmo);
  });

  it('leaves a modification in a locked slot out of every figure', () => {
    // Grade 2 unlocks one slot, so the recipe in slot 2 states nothing.
    const readings = weaponReadings(
      'PrimaryWeapon1',
      fitted(RIFLE, 2, [null, 'weapon_clipsize', null, null]),
      [],
    )!;

    expect(readings.unlocked).toEqual([]);
    expect(readings.magazineSize).toBe(weapon(RIFLE).magazineSize);
    expect(readings.metrics).toEqual(personalWeaponMetrics(weapon(RIFLE), 2, [], {}));
  });

  it('answers nothing where the release publishes no such weapon or grade', () => {
    expect(weaponReadings('PrimaryWeapon1', fitted('wpn_s_pistol_thargoid', 1), [])).toBeNull();
    // The accessor raises on a grade outside 1-5, so a loadout naming one is
    // answered rather than thrown at.
    expect(weaponReadings('PrimaryWeapon1', fitted(RIFLE, 9), [])).toBeNull();
    expect(weaponReadings('PrimaryWeapon1', fitted(RIFLE, 0), [])).toBeNull();
  });

  it('publishes each weapon’s own grades', () => {
    expect(publishedWeaponGrades(RIFLE)).toEqual([1, 2, 3, 4, 5]);
    expect(publishedWeaponGrades('wpn_s_pistol_thargoid')).toEqual([]);
  });
});

describe('the weapons a loadout counts', () => {
  it('counts one weapon per offered mount, in mount order', () => {
    const readings = fittedWeaponReadings(
      loadout('tacticalsuit', [fitted(RIFLE, 5), null, fitted(PISTOL, 3)]),
    );

    expect(readings.map((entry) => entry.mount)).toEqual(['PrimaryWeapon1', 'SecondaryWeapon']);
  });

  it('counts nothing on a held mount', () => {
    // The Maverick carries one primary mount. The weapon on the second is named
    // in the ledger and stated by no figure (FR-007).
    const readings = fittedWeaponReadings(
      loadout('utilitysuit', [fitted(RIFLE, 5), fitted(RIFLE, 5), null], EMPTY_SLOTS, 4),
    );

    expect(readings.map((entry) => entry.mount)).toEqual(['PrimaryWeapon1']);
  });

  it('carries the suit’s unlocked modifiers into every weapon it counts', () => {
    const slots = ['suit_increasedammoreserves', null, null, null];
    const [readings] = fittedWeaponReadings(
      loadout('tacticalsuit', [fitted(RIFLE, 5), null, null], slots),
    );

    expect(readings!.reserveAmmo).toBe(
      applyPersonalModifiers(
        'reserveAmmo',
        weapon(RIFLE).reserveAmmo,
        modifiers('suit_increasedammoreserves'),
      ),
    );
  });

  it('leaves a suit recipe in a locked slot out of the weapon’s reserve', () => {
    const slots = [null, null, null, 'suit_increasedammoreserves'];
    const [readings] = fittedWeaponReadings(
      loadout('tacticalsuit', [fitted(RIFLE, 5), null, null], slots, 3),
    );

    expect(readings!.reserveAmmo).toBe(weapon(RIFLE).reserveAmmo);
  });
});
