import { defaultBuild } from '../outfitting/outfitting.fixtures';
import { projectCostAndMaterials, projectCredits } from './cost-materials';

/**
 * The canvas's `COST` block, checked against the package's own answer.
 *
 * Not one credit figure is written down here. Every expectation is
 * `retailCredits()`'s own result, so the suite proves this module *reads*
 * correctly rather than pinning the Almanac's catalogue, which is the package's
 * business (constitution II, VIII).
 */
describe('cost and materials — credits', () => {
  it('shows the package hull, modules and rebuy unchanged', () => {
    const build = defaultBuild();
    const retail = build.retailCredits();

    const credits = projectCredits(build);

    expect(credits.hull).toBe(retail.hull);
    expect(credits.modules).toBe(retail.modules);
    expect(credits.rebuy).toBe(retail.rebuy);
  });

  it('adds the package hull and modules for the TOTAL row', () => {
    const build = defaultBuild();
    const retail = build.retailCredits();

    // Ruling A. `RetailCredits` has no combined field, so this row is the
    // application's own addition — and it is asserted against the two package
    // values rather than a literal, so it stays right when the catalogue moves.
    expect(projectCredits(build).total).toBe(retail.hull + retail.modules);
  });

  it('does not derive the rebuy from the total it sits under', () => {
    const build = defaultBuild();
    const credits = projectCredits(build);

    // The `5%` is the canvas's fixed label text (ruling B). The number beneath
    // it is the package's, and the package truncates — so a consumer that
    // recomputed five percent here would drift from it by up to a credit.
    expect(credits.rebuy).toBe(build.retailCredits().rebuy);
  });

  it('reads retail exactly once for a projection', () => {
    const build = defaultBuild();
    const retail = build.retailCredits.bind(build);
    const spy = vi.fn(retail);
    build.retailCredits = spy;

    projectCostAndMaterials(build);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('never reads a captured purchase value to fill a price', () => {
    const build = defaultBuild();
    const fitted = vi.fn(build.fittedModules.bind(build));
    build.fittedModules = fitted;
    // A build imported from a journal carries what its Commander paid. The
    // catalogue is stood in for with figures nothing else could produce, so a
    // value reaching these rows from anywhere else would be visible.
    build.retailCredits = () => ({ hull: 11, modules: 22, rebuy: 3, unpriced: [] });

    const credits = projectCredits(build);

    // Every figure is that one catalogue answer, and the fitted modules — the
    // only place a captured `value` lives — are never consulted for credits at
    // all (FR-003). One source is what makes the claim structural rather than
    // a property of this fixture's numbers.
    expect(credits).toEqual({ hull: 11, modules: 22, total: 33, rebuy: 3 });
    expect(fitted).not.toHaveBeenCalled();
  });

  it('shows the package figures for a build the catalogue cannot fully price', () => {
    const build = defaultBuild();
    const retail = build.retailCredits();

    // No fixture hull produces an unpriced module, so the package's answer is
    // stood in for at the seam it is read through. Two mounts the catalogue
    // cannot price, and a `modules` figure that consequently omits them.
    const unpriced = build
      .fittedModules()
      .slice(0, 2)
      .map((module) => ({ slot: module.slot, symbol: module.symbol }));
    expect(unpriced).toHaveLength(2);
    build.retailCredits = () => ({ ...retail, modules: retail.modules - 1_000, unpriced });

    const credits = projectCredits(build);

    // Ruling F: whatever `unpriced` holds, nothing about it is drawn and
    // nothing about it changes a figure. `modules` is passed through as the
    // package stated it — silently a lower bound, a cost accepted with that
    // ruling — and `TOTAL` adds that same lower bound rather than compensating.
    expect(credits.modules).toBe(retail.modules - 1_000);
    expect(credits.total).toBe(retail.hull + retail.modules - 1_000);
  });

  it('returns a frozen projection', () => {
    const projection = projectCostAndMaterials(defaultBuild());

    expect(Object.isFrozen(projection)).toBe(true);
  });
});
