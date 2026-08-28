import { hasWeaponDamageStats } from '@elite-dangerous-almanac/core/ships/module-capabilities';
import type { OutfittingModuleStats } from '@elite-dangerous-almanac/core/ships/modules';
import { weaponMetrics } from '@elite-dangerous-almanac/core/ships/weapons';

/**
 * What one weapon article does per second, as the package calculates it.
 *
 * This lives beside the build's offence projection because the repository has
 * one rule about `weaponMetrics()`: it is asked in this directory and nowhere
 * else, so a damage figure on any screen has one place it can have come from
 * (`scripts/policy/offence-ownership.mjs`, feature 007 FR-001). The question is
 * a different one from the panel's — the panel measures the build's fitted
 * weapons through `BuildMetrics`, and this measures one article a Commander is
 * looking at in the engineering editor, stock or modified, fitted or not.
 *
 * Nothing is derived here. The eight figures are the package's own, read off
 * its result and passed on unchanged.
 */
export const WEAPON_FIGURES = [
  'damagePerShot',
  'damagePerSecond',
  'sustainedDamagePerSecond',
  'sustainedRateOfFire',
  'energyPerSecond',
  'sustainedEnergyPerSecond',
  'heatPerSecond',
  'sustainedHeatPerSecond',
] as const;

/** One of the package's calculated per-weapon figures. */
export type WeaponFigure = (typeof WEAPON_FIGURES)[number];

/**
 * The package's figures for one article, or `null` where it is not a weapon.
 *
 * `hasWeaponDamageStats` is the package's own test for a damage figure. A
 * module without one is not a weapon, and `weaponMetrics` would answer for it
 * with zeroes — a whole block of firing figures on a fuel tank, every one of
 * them a value nobody published (constitution IV).
 */
export function weaponFigures(
  article: OutfittingModuleStats | null,
): Readonly<Record<WeaponFigure, number>> | null {
  return hasWeaponDamageStats(article) ? weaponMetrics(article) : null;
}
