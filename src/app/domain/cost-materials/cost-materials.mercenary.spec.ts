import { defaultBuild, fixedRewardBuild } from '../outfitting/outfitting.fixtures';
import {
  CARGO_RACK,
  cargoRackBuild,
  mercenaryCargoRack,
  uncostableCargoRack,
} from './cost-materials.fixtures';
import { projectMercCoin } from './cost-materials';

/**
 * The canvas's conditional `Merc Coins` row.
 *
 * The whole question this suite asks is *when* the row exists, because the
 * package's own total cannot answer it: `mercCoinCost()` returns `0` both for a
 * build with no Mercenary article and for one whose article carries no
 * published price. Recognition has to come from the fitted variant, and nothing
 * else (FR-004).
 */
describe('cost and materials — Merc Coin', () => {
  it('is absent for a build with no Mercenary article', () => {
    const build = defaultBuild();

    expect(projectMercCoin(build.fittedModules(), build)).toBeNull();
  });

  it('never asks the package for a total it would not draw', () => {
    const build = defaultBuild();
    const spy = vi.fn(build.mercCoinCost.bind(build));
    build.mercCoinCost = spy;

    projectMercCoin(build.fittedModules(), build);

    // A zero total drawn as `0` would read as "this build costs no Merc Coin",
    // which is a different claim from "nothing here is bought with it"
    // (FR-006). Not asking is how the two stay apart.
    expect(spy).not.toHaveBeenCalled();
  });

  it('is absent for a pre-engineered article bought some other way', () => {
    const build = fixedRewardBuild();

    // A tech-broker article is pre-engineered and recognised, and still costs
    // no Merc Coin. The route is the test, not the presence of a variant.
    expect(build.fittedModules().some((module) => module.preEngineeredVariant !== null)).toBe(true);
    expect(projectMercCoin(build.fittedModules(), build)).toBeNull();
  });

  it('is absent for the same mount fitted with its non-Mercenary article', () => {
    const build = cargoRackBuild(uncostableCargoRack());

    // The same slot, the same module, a different route. Nothing but
    // `acquisition` separates this case from the one below it.
    expect(projectMercCoin(build.fittedModules(), build)).toBeNull();
  });

  it('shows the package build total once an article is recognised', () => {
    const build = cargoRackBuild(mercenaryCargoRack());

    expect(projectMercCoin(build.fittedModules(), build)).toBe(build.mercCoinCost());
    expect(projectMercCoin(build.fittedModules(), build)).toBeGreaterThan(0);
  });

  it('asks the package for the total exactly once', () => {
    const build = cargoRackBuild(mercenaryCargoRack());
    const spy = vi.fn(build.mercCoinCost.bind(build));
    build.mercCoinCost = spy;

    projectMercCoin(build.fittedModules(), build);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('reads the package total rather than adding up variant prices', () => {
    const variant = mercenaryCargoRack();
    const build = cargoRackBuild(variant);

    // Ruling C left one row carrying `mercCoinCost()`. There is no per-slot
    // price to sum, and summing the variants' own `mercCoinCost` fields would
    // be an application-owned total the package never stated (FR-005).
    expect(projectMercCoin(build.fittedModules(), build)).toBe(build.mercCoinCost());
    expect(variant.mercCoinCost).toBeDefined();
  });

  it('follows the package back to absent when the article stops being fitted', () => {
    const build = cargoRackBuild(mercenaryCargoRack());
    expect(projectMercCoin(build.fittedModules(), build)).not.toBeNull();

    build.removeModule(CARGO_RACK.slot);

    // No retained purchase history: the row follows current package
    // recognition and nothing remembers what was there before.
    expect(projectMercCoin(build.fittedModules(), build)).toBeNull();
  });
});
