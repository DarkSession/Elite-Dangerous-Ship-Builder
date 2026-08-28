import type { OutfittingModule } from '@elite-dangerous-almanac/core/ships/modules';
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
 * Nothing is derived here. The figures are the package's own, read off its
 * result and passed on unchanged.
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
 * The two figures a continuous-fire weapon has no reading for.
 *
 * A beam or mining laser fires no shots, so the package's result carries its
 * per-second damage as `damagePerShot` and a `sustainedRateOfFire` of `1`.
 * Both are how the calculation carries a weapon with no cadence through the
 * same arithmetic as one that has; neither is a figure anyone measured, and
 * `Sustained rate of fire /s 1` on a beam laser is exactly the number this
 * application never writes (constitution IV).
 */
const CADENCE_FIGURES: readonly WeaponFigure[] = ['damagePerShot', 'sustainedRateOfFire'];

/**
 * The package's figures for one article, or `null` where it is not a weapon.
 *
 * The test for a weapon is the package's own: `weaponMetrics` is fed by
 * `hardpoint` records and nothing else, which is why feature 007 never
 * measures the one utility module that carries a damage figure. A point
 * defence turret publishes no capacitor draw, and the calculation's own
 * default would report that absence as a draw of zero.
 */
export function weaponFigures(
  article: OutfittingModule | null,
): Readonly<Partial<Record<WeaponFigure, number>>> | null {
  if (article === null || article.category !== 'hardpoint') {
    return null;
  }

  const metrics = weaponMetrics(article);
  if (!metrics.continuous) {
    return metrics;
  }

  return Object.fromEntries(
    WEAPON_FIGURES.filter((figure) => !CADENCE_FIGURES.includes(figure)).map((figure) => [
      figure,
      metrics[figure],
    ]),
  );
}
