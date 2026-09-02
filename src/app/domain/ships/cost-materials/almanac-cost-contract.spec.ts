import { BuildMetrics } from '@elite-dangerous-almanac/core/ships/build-metrics';
import { getBlueprintCost } from '@elite-dangerous-almanac/core/ships/blueprint-costs';
import { defaultBuild } from '../outfitting/outfitting.fixtures';
import {
  CARGO_RACK,
  cargoRackBuild,
  mercenaryCargoRack,
  uncostableCargoRack,
} from './cost-materials.fixtures';

/**
 * The package contract these two blocks read.
 *
 * Narrow on purpose. This is not a characterization of the Almanac — that is
 * the package's own suite's job, and feature 002 already pins the recipe
 * boundary. What is pinned here is the handful of shapes feature 009 would
 * silently misread if they changed: the unified `BuildCost` and the cargo-rack
 * regression.
 */
describe('the Almanac contract for cost and materials', () => {
  describe('build cost', () => {
    it('publishes four credit numbers and an ordered unpriced list', () => {
      const retail = BuildMetrics.of(defaultBuild()).buildCost().credits;

      // Non-nullable numbers. If any of these ever became nullable, the `TOTAL`
      // row would quietly start producing `NaN` rather than failing here.
      expect(typeof retail.hull).toBe('number');
      expect(typeof retail.modules).toBe('number');
      expect(typeof retail.total).toBe('number');
      expect(typeof retail.rebuy).toBe('number');
      expect(Number.isFinite(retail.hull)).toBe(true);
      expect(Array.isArray(retail.unpriced)).toBe(true);
    });

    it('publishes consolidated materials for the complete build', () => {
      const build = defaultBuild();
      build.applyBlueprint('FrameShiftDrive', 'FSD_LongRange', { grade: 5 });

      expect(BuildMetrics.of(build).buildCost().materials.length).toBeGreaterThan(0);
    });

    it('returns zero for a build that buys nothing with it', () => {
      expect(BuildMetrics.of(defaultBuild()).buildCost().mercCoins).toBe(0);
    });

    it('includes a recognised Mercenary article in the build total', () => {
      const variant = mercenaryCargoRack();
      expect(variant.acquisition).toBe('mercenary');
      expect(variant.mercCoinCost).toBeGreaterThan(0);
      expect(BuildMetrics.of(cargoRackBuild(variant)).buildCost().mercCoins).toBe(
        variant.mercCoinCost,
      );
    });
  });

  describe('the cargo-rack regression', () => {
    it('publishes no ordinary cost for the reward recipe', () => {
      const reward = uncostableCargoRack();

      // The package has no cost to state for this article's recipe. The
      // application must not special-case the fdname, call it free, or
      // substitute another recipe — under ruling F it contributes no row and
      // says nothing.
      expect(getBlueprintCost(reward.blueprintSymbol, 5)).toBeNull();
    });

    it('keeps both of the mount’s articles identifiable', () => {
      expect(mercenaryCargoRack().symbol).toBe(CARGO_RACK.symbol);
      expect(uncostableCargoRack().symbol).toBe(CARGO_RACK.symbol);
      expect(uncostableCargoRack().acquisition).not.toBe('mercenary');
    });
  });
});
