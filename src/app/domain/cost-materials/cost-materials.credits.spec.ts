import { defaultBuild, FIXTURE_SLOTS } from '../outfitting/outfitting.fixtures';
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
    const fitted = build.fittedModules();
    const captured = fitted.filter((module) => module.value !== undefined);

    const credits = projectCredits(build);
    const retail = build.retailCredits();

    // Whatever a source Commander paid is not what this build costs at current
    // catalogue retail (FR-003). If any captured value had leaked in, these two
    // would part company.
    expect(credits.modules).toBe(retail.modules);
    expect(captured.every((module) => credits.modules !== module.value)).toBe(true);
  });

  it('shows the package figures for a build the catalogue cannot fully price', () => {
    const build = defaultBuild();
    build.applyBlueprint(FIXTURE_SLOTS.frameShiftDrive, 'FSD_LongRange', { grade: 5 });
    const retail = build.retailCredits();

    const credits = projectCredits(build);

    // Ruling F: whatever `unpriced` holds, nothing about it is drawn. The
    // figures stay the package's own, and `modules` is silently a lower bound —
    // a cost accepted with that ruling.
    expect(credits.modules).toBe(retail.modules);
    expect(credits.total).toBe(retail.hull + retail.modules);
  });

  it('returns a frozen projection', () => {
    const projection = projectCostAndMaterials(defaultBuild());

    expect(Object.isFrozen(projection)).toBe(true);
  });
});
