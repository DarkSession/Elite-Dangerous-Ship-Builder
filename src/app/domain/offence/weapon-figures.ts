import type { OutfittingModule } from '@elite-dangerous-almanac/core/ships/modules';
import { weaponMetrics, type WeaponMetrics } from '@elite-dangerous-almanac/core/ships/weapons';

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
 * The package's figures for one article, or `null` where there is none to give.
 *
 * Two articles get nothing. `weaponMetrics` is data-free and will measure
 * whatever it is handed, so which articles are weapons is decided the way
 * `BuildMetrics.weaponMetrics()` decides it — by walking the build's hardpoints
 * — and that is the rule restated here as the article's own `category`. It is
 * why neither surface measures the one utility module that carries a damage
 * figure: a point defence turret publishes no capacitor draw, and the
 * calculation's default would report that absence as a draw of zero.
 *
 * And a continuous-fire weapon — a beam or a mining laser — carries no cadence
 * for anything to be worked out over. Its damage, its draw and its heat are
 * already per second, so every figure here restates the catalogue stat the
 * table draws beside it, and its `sustainedRateOfFire` is the `1` the
 * arithmetic needs to carry a weapon that fires no shots. A row repeating the
 * row above it is not a second reading (constitution IV).
 */
export function weaponFigures(
  article: OutfittingModule | null,
): Pick<WeaponMetrics, WeaponFigure> | null {
  if (article === null || article.category !== 'hardpoint') {
    return null;
  }

  const metrics = weaponMetrics(article);
  return metrics.continuous ? null : metrics;
}
