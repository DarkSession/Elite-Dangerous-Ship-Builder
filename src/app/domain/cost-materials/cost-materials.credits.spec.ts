import { BuildMetrics } from '@elite-dangerous-almanac/core/ships/build-metrics';
import { defaultBuild } from '../outfitting/outfitting.fixtures';
import { projectCostAndMaterials, projectCredits } from './cost-materials';

/**
 * The canvas's `COST` block, checked against the package's own answer.
 *
 * Not one credit figure is written down here. Every expectation is the
 * `buildCost().credits` result, so the suite proves this module *reads*
 * correctly rather than pinning the Almanac's catalogue, which is the package's
 * business (constitution II, VIII).
 */
describe('cost and materials — credits', () => {
  it('shows every package credit figure unchanged', () => {
    const cost = BuildMetrics.of(defaultBuild()).buildCost();

    const credits = projectCredits(cost);

    expect(credits).toEqual({
      hull: cost.credits.hull,
      modules: cost.credits.modules,
      total: cost.credits.total,
      rebuy: cost.credits.rebuy,
    });
  });

  it('does not derive the total or rebuy from neighbouring figures', () => {
    const cost = BuildMetrics.of(defaultBuild()).buildCost();
    const distinct = {
      ...cost,
      credits: { ...cost.credits, total: 123, rebuy: 17 },
    };

    expect(projectCredits(distinct).total).toBe(123);
    expect(projectCredits(distinct).rebuy).toBe(17);
  });

  it('reads build cost exactly once for a projection', () => {
    // The calculations live on `BuildMetrics` since Almanac 0.2.0, and the
    // projector makes its own view of the build, so the seam is the prototype
    // rather than any one instance.
    const spy = vi.spyOn(BuildMetrics.prototype, 'buildCost');

    projectCostAndMaterials(defaultBuild());

    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('passes through a package result without reading captured purchase values', () => {
    const cost = BuildMetrics.of(defaultBuild()).buildCost();
    const synthetic = {
      ...cost,
      credits: { hull: 11, modules: 22, total: 33, rebuy: 3, unpriced: [] },
    };

    expect(projectCredits(synthetic)).toEqual({ hull: 11, modules: 22, total: 33, rebuy: 3 });
  });

  it('shows the package figures for a build the catalogue cannot fully price', () => {
    const build = defaultBuild();
    const cost = BuildMetrics.of(build).buildCost();
    const unpriced = build
      .fittedModules()
      .slice(0, 2)
      .map((module) => ({ slot: module.slot, symbol: module.symbol }));
    const changed = {
      ...cost,
      credits: {
        ...cost.credits,
        modules: cost.credits.modules - 1_000,
        total: cost.credits.total - 1_000,
        unpriced,
      },
    };

    const credits = projectCredits(changed);

    expect(unpriced).toHaveLength(2);
    expect(credits.modules).toBe(cost.credits.modules - 1_000);
    expect(credits.total).toBe(cost.credits.total - 1_000);
  });

  it('returns a frozen projection', () => {
    const projection = projectCostAndMaterials(defaultBuild());

    expect(Object.isFrozen(projection)).toBe(true);
  });
});
