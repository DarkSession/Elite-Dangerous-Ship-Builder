import { BuildMetrics } from '@elite-dangerous-almanac/core/ships/build-metrics';
import { defaultBuild, fixedRewardBuild } from '../outfitting/outfitting.fixtures';
import {
  CARGO_RACK,
  cargoRackBuild,
  mercenaryCargoRack,
  uncostableCargoRack,
} from './cost-materials.fixtures';
import { projectMercCoin } from './cost-materials';

/** The canvas's conditional Merc Coin row, from the package's unified build cost. */
describe('cost and materials — Merc Coin', () => {
  it('is absent when the package reports no Merc Coin charge', () => {
    const cost = BuildMetrics.of(defaultBuild()).buildCost();

    expect(cost.mercCoins).toBe(0);
    expect(projectMercCoin(cost)).toBeNull();
  });

  it('is absent for a pre-engineered article bought some other way', () => {
    const build = fixedRewardBuild();

    expect(build.fittedModules().some((module) => module.preEngineeredVariant !== null)).toBe(true);
    expect(projectMercCoin(BuildMetrics.of(build).buildCost())).toBeNull();
  });

  it('is absent for the same mount fitted with its non-Mercenary article', () => {
    const build = cargoRackBuild(uncostableCargoRack());

    expect(projectMercCoin(BuildMetrics.of(build).buildCost())).toBeNull();
  });

  it('shows the package build total once it reports a charge', () => {
    const build = cargoRackBuild(mercenaryCargoRack());
    const cost = BuildMetrics.of(build).buildCost();

    expect(projectMercCoin(cost)).toBe(cost.mercCoins);
    expect(projectMercCoin(cost)).toBeGreaterThan(0);
  });

  it('reads the package total rather than adding up variant prices', () => {
    const variant = mercenaryCargoRack();
    const build = cargoRackBuild(variant);

    expect(projectMercCoin(BuildMetrics.of(build).buildCost())).toBe(
      BuildMetrics.of(build).buildCost().mercCoins,
    );
    expect(variant.mercCoinCost).toBeDefined();
  });

  it('follows the package back to absent when the charge leaves the build', () => {
    const build = cargoRackBuild(mercenaryCargoRack());
    expect(projectMercCoin(BuildMetrics.of(build).buildCost())).not.toBeNull();

    build.removeModule(CARGO_RACK.slot);

    expect(projectMercCoin(BuildMetrics.of(build).buildCost())).toBeNull();
  });
});
