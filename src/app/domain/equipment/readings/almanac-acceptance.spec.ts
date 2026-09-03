import { describe, expect, it } from 'vitest';
import { SUITS, getSuitGrade } from '@elite-dangerous-almanac/core/equipment/suits';
import {
  PERSONAL_WEAPONS,
  getPersonalWeaponGrade,
  personalWeaponMetrics,
} from '@elite-dangerous-almanac/core/equipment/weapons';
import { PERSONAL_MODIFICATIONS } from '@elite-dangerous-almanac/core/equipment/modifications';
import { getPersonalModificationCost } from '@elite-dangerous-almanac/core/equipment/modification-costs';
import {
  applyPersonalModifiers,
  sumPersonalEngineeringIngredients,
} from '@elite-dangerous-almanac/core/equipment/engineering';
import { resolveForWeapon } from '../loadout/loadout-edit';
import { materialRequirement } from './material-requirement';
import { suitReadings } from './suit-readings';
import { weaponReadings } from './weapon-readings';
import type { EquipmentLoadout, ModificationSlots } from '../loadout-link/equipment-loadout';

/**
 * Every figure the bench states, against the package's own answer, exhaustively.
 *
 * SC-002's off-screen half: every suit at every grade it publishes, every weapon
 * at every grade it publishes, and every modification on every item it is
 * offered for. No expectation here computes a figure — each one asks the package
 * the same question a second way — so a test cannot agree with a reading this
 * repository got wrong.
 */

const EMPTY_SLOTS: ModificationSlots = [null, null, null, null];

const publishedGrades = (item: { grades: Readonly<Record<string, unknown>> }): number[] =>
  Object.keys(item.grades)
    .map(Number)
    .sort((one, other) => one - other);

const suitRecipes = Object.entries(PERSONAL_MODIFICATIONS)
  .filter(([, recipe]) => recipe.target === 'suit')
  .map(([symbol]) => symbol);

const weaponRecipes = Object.entries(PERSONAL_MODIFICATIONS)
  .filter(([, recipe]) => recipe.target === 'weapon')
  .map(([symbol]) => symbol);

const bench = (
  suitFamily: string,
  suitGrade: number,
  suitModifications: ModificationSlots = EMPTY_SLOTS,
): EquipmentLoadout => ({
  suitFamily,
  suitGrade,
  suitModifications,
  weapons: [null, null, null],
});

describe('every suit at every published grade', () => {
  it('states the package’s own figures, unmodified', () => {
    for (const suit of SUITS) {
      for (const grade of publishedGrades(suit)) {
        const published = getSuitGrade(suit, grade)!;
        const readings = suitReadings(bench(suit.family, grade))!;

        expect(readings.shieldStrength).toBe(published.shieldStrength);
        expect(readings.shieldRegeneration).toBe(published.shieldRegeneration);
        expect(readings.kineticResistance).toBe(published.kineticResistance);
        expect(readings.thermalResistance).toBe(published.thermalResistance);
        expect(readings.plasmaResistance).toBe(published.plasmaResistance);
        expect(readings.explosiveResistance).toBe(published.explosiveResistance);
        expect(readings.modificationSlots).toBe(published.modificationSlots);
      }
    }
  });

  it('states no grade a suit does not publish', () => {
    // The Flight Suit publishes grade 1 alone, and a figure for grade 2 of it
    // would be one the package never gave (constitution IV).
    for (const suit of SUITS) {
      const published = publishedGrades(suit);
      for (const grade of [1, 2, 3, 4, 5]) {
        expect(suitReadings(bench(suit.family, grade)) === null).toBe(!published.includes(grade));
      }
    }
  });
});

describe('every suit modification on every suit it is offered for', () => {
  it('folds through the package, in the slots the grade unlocks', () => {
    for (const suit of SUITS) {
      for (const grade of publishedGrades(suit)) {
        const published = getSuitGrade(suit, grade)!;
        for (const symbol of suitRecipes) {
          const recipe = PERSONAL_MODIFICATIONS[symbol]!;
          const slots: ModificationSlots = [symbol, null, null, null];
          const readings = suitReadings(bench(suit.family, grade, slots))!;
          // A grade unlocking no slot holds the recipe without applying it,
          // which is the Flight Suit's whole modification story.
          const inEffect = published.modificationSlots > 0 ? recipe.modifiers : [];

          expect(readings.unlocked).toEqual(published.modificationSlots > 0 ? [symbol] : []);
          expect(readings.shieldStrength).toBe(
            applyPersonalModifiers('shieldStrength', published.shieldStrength, inEffect),
          );
          expect(readings.shieldRegeneration).toBe(
            applyPersonalModifiers('shieldRegeneration', published.shieldRegeneration, inEffect),
          );
          for (const stat of [
            'kineticResistance',
            'thermalResistance',
            'plasmaResistance',
            'explosiveResistance',
          ] as const) {
            expect(readings[stat]).toBe(applyPersonalModifiers(stat, published[stat], inEffect));
          }
        }
      }
    }
  });

  it('requires exactly what the package costs it at, one application each', () => {
    for (const suit of SUITS) {
      for (const grade of publishedGrades(suit)) {
        const unlocked = getSuitGrade(suit, grade)!.modificationSlots;
        for (const symbol of suitRecipes) {
          const slots: ModificationSlots = [symbol, null, null, null];

          expect(materialRequirement(bench(suit.family, grade, slots)).ingredients).toEqual(
            unlocked > 0
              ? sumPersonalEngineeringIngredients(getPersonalModificationCost(symbol)!)
              : [],
          );
        }
      }
    }
  });
});

describe('every weapon at every published grade', () => {
  it('states the package’s own catalogue figures and derived metrics', () => {
    for (const weapon of PERSONAL_WEAPONS) {
      for (const grade of publishedGrades(weapon)) {
        const published = getPersonalWeaponGrade(weapon, grade)!;
        const readings = weaponReadings(
          'PrimaryWeapon1',
          { symbol: weapon.symbol, grade, modifications: EMPTY_SLOTS },
          [],
        )!;

        expect(readings.damage).toBe(published.damage);
        expect(readings.rateOfFire).toBe(weapon.rateOfFire);
        expect(readings.magazineSize).toBe(weapon.magazineSize);
        expect(readings.reserveAmmo).toBe(weapon.reserveAmmo);
        expect(readings.effectiveRange).toBe(weapon.effectiveRange);
        expect(readings.headshotMultiplier).toBe(weapon.headshotMultiplier);
        expect(readings.scopeMagnification).toBe(weapon.scopeMagnification.default);
        expect(readings.reloadTime).toBe(weapon.reloadTime.default);
        expect(readings.modificationSlots).toBe(published.modificationSlots);
        expect(readings.metrics).toEqual(personalWeaponMetrics(weapon, grade, [], {}));
      }
    }
  });
});

describe('every weapon modification on every weapon it is offered for', () => {
  it('folds through the package, with Reload Speed passed as the option it is', () => {
    for (const weapon of PERSONAL_WEAPONS) {
      for (const grade of publishedGrades(weapon)) {
        const unlocked = getPersonalWeaponGrade(weapon, grade)!.modificationSlots;
        for (const offered of weaponRecipes) {
          // Greater Range, Headshot Damage and Improved Hip Fire Accuracy are
          // three recipes each; the package settles which the weapon takes.
          const symbol = resolveForWeapon(weapon.symbol, offered);
          if (symbol !== offered) continue;

          const recipe = PERSONAL_MODIFICATIONS[symbol]!;
          const inEffect = unlocked > 0 ? recipe.modifiers : [];
          const reloadSpeed = unlocked > 0 && symbol === 'weapon_reloadspeed';
          const readings = weaponReadings(
            'PrimaryWeapon1',
            { symbol: weapon.symbol, grade, modifications: [symbol, null, null, null] },
            [],
          )!;

          expect(readings.magazineSize).toBe(
            applyPersonalModifiers('magazineSize', weapon.magazineSize, inEffect),
          );
          expect(readings.effectiveRange).toBe(
            applyPersonalModifiers('effectiveRange', weapon.effectiveRange, inEffect),
          );
          expect(readings.headshotMultiplier).toBe(
            applyPersonalModifiers('headshotMultiplier', weapon.headshotMultiplier, inEffect),
          );
          expect(readings.reserveAmmo).toBe(
            applyPersonalModifiers('reserveAmmo', weapon.reserveAmmo, inEffect),
          );
          expect(readings.reloadTime).toBe(
            reloadSpeed ? weapon.reloadTime.upgraded : weapon.reloadTime.default,
          );
          expect(readings.scopeMagnification).toBe(
            unlocked > 0 && symbol === 'weapon_scope'
              ? weapon.scopeMagnification.upgraded
              : weapon.scopeMagnification.default,
          );
          // Never computed here: the same call, with the same modifiers and the
          // same option, is the whole of the expectation.
          expect(readings.metrics).toEqual(
            personalWeaponMetrics(weapon, grade, inEffect, { reloadSpeed }),
          );
        }
      }
    }
  });

  it('offers each three-technology recipe as one spelling per weapon', () => {
    // FR-015: the weapon takes one of the three, never three.
    const paired = weaponRecipes.filter((symbol) => /_(kinetic|laser|plasma)$/.test(symbol));

    for (const weapon of PERSONAL_WEAPONS) {
      const taken = paired.filter((symbol) => resolveForWeapon(weapon.symbol, symbol) === symbol);

      expect(taken.length).toBe(paired.length / 3);
    }
  });
});

describe('the suit’s reserve-ammo recipe reaches a weapon', () => {
  it('folds it into every weapon the loadout counts', () => {
    // Extra Ammo Capacity is a suit recipe that moves a weapon's `reserveAmmo`.
    const suitModifiers = PERSONAL_MODIFICATIONS['suit_increasedammoreserves']!.modifiers;

    for (const weapon of PERSONAL_WEAPONS) {
      const readings = weaponReadings(
        'PrimaryWeapon1',
        { symbol: weapon.symbol, grade: 1, modifications: EMPTY_SLOTS },
        suitModifiers,
      )!;

      expect(readings.reserveAmmo).toBe(
        applyPersonalModifiers('reserveAmmo', weapon.reserveAmmo, suitModifiers),
      );
    }
  });
});
