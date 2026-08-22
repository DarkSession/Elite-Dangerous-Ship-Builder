import { getBlueprintCost } from '@elite-dangerous-almanac/core/ships/blueprint-costs';
import { sumMaterials } from '@elite-dangerous-almanac/core/ships/engineering';
import { defaultBuild } from '../outfitting/outfitting.fixtures';
import { CARGO_RACK, mercenaryCargoRack, uncostableCargoRack } from './cost-materials.fixtures';

/**
 * The package contract these two blocks read.
 *
 * Narrow on purpose. This is not a characterization of the Almanac — that is
 * the package's own suite's job, and feature 002 already pins the recipe
 * boundary. What is pinned here is the handful of shapes feature 009 would
 * silently misread if they changed: a numeric `RetailCredits`, a `mercCoinCost`
 * that cannot distinguish absence from a missing price, `sumMaterials` order,
 * and the cargo-rack regression.
 */
describe('the Almanac contract for cost and materials', () => {
  describe('retail credits', () => {
    it('publishes three numbers and an ordered unpriced list', () => {
      const retail = defaultBuild().retailCredits();

      // Non-nullable numbers. If any of these ever became nullable, the `TOTAL`
      // row would quietly start producing `NaN` rather than failing here.
      expect(typeof retail.hull).toBe('number');
      expect(typeof retail.modules).toBe('number');
      expect(typeof retail.rebuy).toBe('number');
      expect(Number.isFinite(retail.hull)).toBe(true);
      expect(Array.isArray(retail.unpriced)).toBe(true);
    });

    it('publishes no combined total of its own', () => {
      const retail = defaultBuild().retailCredits();

      // The reason ruling A had to be a ruling: there is no field to read, so
      // the canvas's `TOTAL` row can only be the application's own addition.
      expect(Object.keys(retail)).not.toContain('total');
    });
  });

  describe('Merc Coin', () => {
    it('returns zero for a build that buys nothing with it', () => {
      expect(defaultBuild().mercCoinCost()).toBe(0);
    });

    it('cannot itself say whether an article is recognised', () => {
      // Zero from a build with no Mercenary article, and zero from one whose
      // article has no published price, are the same number. Recognition has
      // to come from the fitted variant, which is why `projectMercCoin` asks
      // the modules before it asks the total.
      expect(defaultBuild().mercCoinCost()).toBe(0);
      expect(mercenaryCargoRack().acquisition).toBe('mercenary');
      expect(mercenaryCargoRack().mercCoinCost).toBeGreaterThan(0);
    });
  });

  describe('consolidation', () => {
    it('preserves first-seen order and folds equal symbols', () => {
      const first = { symbol: 'Iron', name: 'Iron', count: 2 };
      const second = { symbol: 'Nickel', name: 'Nickel', count: 1 };

      const folded = sumMaterials([first, second], [{ ...first, count: 3 }]);

      expect(folded.map((material) => material.symbol)).toEqual(['Iron', 'Nickel']);
      expect(folded[0]?.count).toBe(5);
    });

    it('matches symbols the way the package spells them', () => {
      const folded = sumMaterials(
        [{ symbol: 'Iron', name: 'Iron', count: 1 }],
        [{ symbol: 'iron', name: 'Iron', count: 1 }],
      );

      // Case-insensitive, which is why nothing here normalises symbols first.
      expect(folded).toHaveLength(1);
      expect(folded[0]?.count).toBe(2);
    });
  });

  describe('the cargo-rack regression', () => {
    it('publishes no ordinary cost for the reward recipe', () => {
      const reward = uncostableCargoRack();

      // The package has no cost to state for this article's recipe. The
      // application must not special-case the fdname, call it free, or
      // substitute another recipe — under ruling F it contributes no row and
      // says nothing.
      expect(getBlueprintCost(reward.blueprint, 5)).toBeNull();
    });

    it('keeps both of the mount’s articles identifiable', () => {
      expect(mercenaryCargoRack().symbol).toBe(CARGO_RACK.symbol);
      expect(uncostableCargoRack().symbol).toBe(CARGO_RACK.symbol);
      expect(uncostableCargoRack().acquisition).not.toBe('mercenary');
    });
  });
});
