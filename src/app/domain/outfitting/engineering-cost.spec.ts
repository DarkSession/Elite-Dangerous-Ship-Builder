import { getBlueprintCost } from '@elite-dangerous-almanac/core/ships/blueprint-costs';
import { sumMaterials } from '@elite-dangerous-almanac/core/ships/engineering';
import { getExperimentalEffectCost } from '@elite-dangerous-almanac/core/ships/experimental-effect-costs';
import { engineeringCost, type EngineeringSelection } from './engineering-cost';
import { fixedRewardVariant, mercenaryVariant } from './outfitting.fixtures';

/**
 * What an engineering job costs, checked against the package's own catalogues.
 *
 * Not one material name or count is written down here. Every expectation is the
 * package's own answer to the same question, so the suite proves this module
 * *asks* correctly rather than proving the Almanac's data has not changed —
 * which is the package's own business (constitution II, VIII).
 */

const ORDINARY_BLUEPRINT = 'FSD_LongRange';
const ORDINARY_EFFECT = 'special_fsd_heavy';

/**
 * One of the four ordinary recipes that bill Merc Coin as well as materials.
 *
 * Almanac 0.1.5 publishes the currency per grade (upstream #337); before it
 * there was only a Mercenary article's one fixed shop price, which is not this
 * figure. The expected amount is still the package's own answer, never a
 * literal.
 */
const MERC_COIN_BLUEPRINT = 'FuelScoop_Efficiency';

/** Nothing selected, nothing fitted. The starting point every case adds to. */
const NOTHING: EngineeringSelection = {
  blueprintFdname: null,
  grade: null,
  effectFdname: null,
  currentBlueprintFdname: null,
  currentGrade: null,
  currentEffectFdname: null,
  purchaseVariant: null,
};

describe('engineering cost', () => {
  describe('the blueprint climb', () => {
    it('charges the whole climb for a recipe the module does not carry', () => {
      const cost = engineeringCost({
        ...NOTHING,
        blueprintFdname: ORDINARY_BLUEPRINT,
        grade: 5,
      });

      expect(cost.blueprint).toEqual({
        kind: 'known',
        ...getBlueprintCost(ORDINARY_BLUEPRINT, 5)!,
      });
    });

    it('prices the whole recipe, not what is left of it', () => {
      const cost = engineeringCost({
        ...NOTHING,
        blueprintFdname: ORDINARY_BLUEPRINT,
        grade: 5,
        currentBlueprintFdname: ORDINARY_BLUEPRINT,
        currentGrade: 3,
      });

      // What the panel answers is what this engineering costs. A choice commits
      // as it is made, so a figure for what remained would be nothing every
      // time a Commander read it (wave 5).
      expect(cost.blueprint).toEqual({
        kind: 'known',
        ...getBlueprintCost(ORDINARY_BLUEPRINT, 5)!,
      });
      expect(
        (cost.blueprint as { materials: readonly unknown[] }).materials.length,
      ).toBeGreaterThan(0);
    });

    it('prices a recipe the same whatever the module already carries', () => {
      const other = 'FSD_FastBoot';
      const cost = engineeringCost({
        ...NOTHING,
        blueprintFdname: other,
        grade: 5,
        currentBlueprintFdname: ORDINARY_BLUEPRINT,
        currentGrade: 4,
      });

      expect(cost.blueprint).toEqual({ kind: 'known', ...getBlueprintCost(other, 5)! });
    });

    it('prices a completed grade at what that grade costs, never at nothing', () => {
      const cost = engineeringCost({
        ...NOTHING,
        blueprintFdname: ORDINARY_BLUEPRINT,
        grade: 3,
        currentBlueprintFdname: ORDINARY_BLUEPRINT,
        currentGrade: 5,
      });

      // Engineering always costs materials. An empty list from the package is
      // the package failing to price a job, not a free one (wave 5).
      expect(cost.blueprint).toEqual({
        kind: 'known',
        ...getBlueprintCost(ORDINARY_BLUEPRINT, 3)!,
      });
    });

    it('is not selected until both a recipe and a grade are chosen', () => {
      expect(engineeringCost(NOTHING).blueprint).toEqual({ kind: 'notSelected' });
      expect(
        engineeringCost({ ...NOTHING, blueprintFdname: ORDINARY_BLUEPRINT }).blueprint,
      ).toEqual({ kind: 'notSelected' });
    });

    it('is unavailable for a recipe the package prices nothing for', () => {
      // A fixed reward identity: mechanics, but no ordinary craft route. The
      // package answers `null`, and `null` is not zero.
      const decorative = 'Decorative_Red';
      expect(getBlueprintCost(decorative, 5)).toBeNull();

      const cost = engineeringCost({ ...NOTHING, blueprintFdname: decorative, grade: 5 });

      expect(cost.blueprint).toEqual({ kind: 'unavailable' });
    });

    it('is unavailable for a grade outside the package’s own range', () => {
      // The package throws for one of these. An unpriceable grade is stated as
      // unpriceable rather than guessed at or allowed to escape as a crash.
      expect(
        engineeringCost({ ...NOTHING, blueprintFdname: ORDINARY_BLUEPRINT, grade: 0 }).blueprint,
      ).toEqual({ kind: 'unavailable' });
      expect(
        engineeringCost({ ...NOTHING, blueprintFdname: ORDINARY_BLUEPRINT, grade: 6 }).blueprint,
      ).toEqual({ kind: 'unavailable' });
    });
  });

  describe('the Merc Coin a climb bills', () => {
    it('carries the package’s per-grade figure beside the materials', () => {
      const expected = getBlueprintCost(MERC_COIN_BLUEPRINT, 5, 0)!;
      // The package is what makes this case worth having: a recipe that bills
      // no currency would pass the same assertion with both halves at zero.
      expect(expected.mercCoins).toBeGreaterThan(0);

      expect(
        engineeringCost({ ...NOTHING, blueprintFdname: MERC_COIN_BLUEPRINT, grade: 5 }).blueprint,
      ).toEqual({ kind: 'known', ...expected });
    });

    it('is the whole job’s figure, since an effect bills none', () => {
      const cost = engineeringCost({
        ...NOTHING,
        blueprintFdname: MERC_COIN_BLUEPRINT,
        grade: 5,
        effectFdname: ORDINARY_EFFECT,
      });

      expect(cost.experimental).toMatchObject({ mercCoins: 0 });
      expect(cost.combined).toMatchObject({
        mercCoins: getBlueprintCost(MERC_COIN_BLUEPRINT, 5, 0)!.mercCoins,
      });
    });

    it('is nothing at all on a recipe the package charges no currency for', () => {
      expect(
        engineeringCost({ ...NOTHING, blueprintFdname: ORDINARY_BLUEPRINT, grade: 5 }).blueprint,
      ).toMatchObject({ mercCoins: 0 });
    });
  });

  describe('the experimental effect', () => {
    it('charges one application for an effect the module does not carry', () => {
      const cost = engineeringCost({ ...NOTHING, effectFdname: ORDINARY_EFFECT });

      expect(cost.experimental).toEqual({
        kind: 'known',
        materials: getExperimentalEffectCost(ORDINARY_EFFECT),
        // An effect charges materials alone; the package says so outright.
        mercCoins: 0,
      });
    });

    it('charges nothing to remove an effect', () => {
      const cost = engineeringCost({
        ...NOTHING,
        effectFdname: null,
        currentEffectFdname: ORDINARY_EFFECT,
      });

      expect(cost.experimental).toEqual({ kind: 'notSelected' });
    });

    it('charges the effect whether or not the module already carries it', () => {
      // The same rule the climb follows: what the panel answers is what this
      // effect costs, not what is left of applying it. Inline a choice commits
      // as it is made, so "what is left" is nothing every time it is read —
      // which made the material list unchanging whatever was picked (wave 9).
      const cost = engineeringCost({
        ...NOTHING,
        effectFdname: ORDINARY_EFFECT,
        currentEffectFdname: ORDINARY_EFFECT,
      });

      expect(cost.experimental).toEqual({
        kind: 'known',
        materials: getExperimentalEffectCost(ORDINARY_EFFECT),
        // An effect charges materials alone; the package says so outright.
        mercCoins: 0,
      });
    });

    it('is unavailable for an effect the package prices nothing for', () => {
      const unknown = 'special_no_such_effect';
      expect(getExperimentalEffectCost(unknown)).toBeNull();

      expect(engineeringCost({ ...NOTHING, effectFdname: unknown }).experimental).toEqual({
        kind: 'unavailable',
      });
    });
  });

  describe('the combined total', () => {
    it('sums the parts through the package’s own fold', () => {
      const cost = engineeringCost({
        ...NOTHING,
        blueprintFdname: ORDINARY_BLUEPRINT,
        grade: 5,
        effectFdname: ORDINARY_EFFECT,
      });

      expect(cost.combined).toEqual({
        kind: 'known',
        materials: sumMaterials(
          getBlueprintCost(ORDINARY_BLUEPRINT, 5)!.materials,
          getExperimentalEffectCost(ORDINARY_EFFECT)!,
        ),
        // An effect bills no currency, so the total is the climb's own figure.
        mercCoins: getBlueprintCost(ORDINARY_BLUEPRINT, 5)!.mercCoins,
      });
    });

    it('is unavailable when either part is, rather than quietly being the other part', () => {
      const cost = engineeringCost({
        ...NOTHING,
        blueprintFdname: ORDINARY_BLUEPRINT,
        grade: 5,
        effectFdname: 'special_no_such_effect',
      });

      // A total that dropped the part it could not price would be an
      // understatement presented as a total.
      expect(cost.combined).toEqual({ kind: 'unavailable' });
    });

    it('is a known zero when nothing is selected', () => {
      expect(engineeringCost(NOTHING).combined).toEqual({
        kind: 'known',
        materials: [],
        mercCoins: 0,
      });
    });
  });

  describe('purchased articles', () => {
    it('never prices a reward’s baked engineering', () => {
      const reward = fixedRewardVariant();

      const cost = engineeringCost({
        ...NOTHING,
        purchaseVariant: reward,
        blueprintFdname: reward.blueprint,
        grade: reward.grade,
        currentBlueprintFdname: reward.blueprint,
        currentGrade: reward.grade,
      });

      // The article arrived already modified. There is no shopping list for
      // what it came with, and quoting its recipe would quote for the wrong
      // thing entirely.
      expect(cost.blueprint).toEqual({ kind: 'notSelected' });
      expect(cost.combined).toEqual({ kind: 'known', materials: [], mercCoins: 0 });
    });

    it('prices engineering a reward further, like any other job', () => {
      const merc = mercenaryVariant();

      const cost = engineeringCost({
        ...NOTHING,
        purchaseVariant: merc,
        blueprintFdname: merc.blueprint,
        grade: 5,
        currentBlueprintFdname: merc.blueprint,
        currentGrade: merc.grade,
      });

      // Arriving modified is not a discount on the climb above it, and it stays
      // priced once that climb is applied: what a job costs is a property of
      // the recipe, not of how far along the article happens to be (wave 5).
      expect(cost.blueprint.kind).toBe('known');
      expect(
        engineeringCost({
          ...NOTHING,
          purchaseVariant: merc,
          blueprintFdname: merc.blueprint,
          grade: 5,
          currentBlueprintFdname: merc.blueprint,
          currentGrade: 5,
        }).blueprint.kind,
      ).toBe('known');
    });

    it('says nothing about a purchase price at all', () => {
      const merc = mercenaryVariant();

      // What the article cost to buy is not what this job costs. Its price is
      // stated on the manifest row it is bought from, where it is the price of
      // buying the module; at the foot of a shopping list it read as the price
      // of the engineering above it (wave 9).
      expect(
        engineeringCost({
          ...NOTHING,
          blueprintFdname: merc.blueprint,
          grade: merc.grade,
          currentBlueprintFdname: merc.blueprint,
          currentGrade: merc.grade,
          purchaseVariant: merc,
        }),
      ).not.toHaveProperty('mercCoin');
      // And there is no per-grade figure to put there instead: the package
      // publishes one fixed shop price per article and says the current grade
      // does not change it, so a figure beside a grade-5 climb would be one the
      // game does not have (constitution IV).
      expect(merc.mercCoinCost).toBeDefined();
    });

    it('never lets the currency reach a material list', () => {
      const merc = mercenaryVariant();

      const cost = engineeringCost({
        ...NOTHING,
        blueprintFdname: ORDINARY_BLUEPRINT,
        grade: 5,
        purchaseVariant: merc,
      });

      // Merc Coin has no material or credit equivalent, so summing it into a
      // total would invent an exchange rate the game does not have.
      const combined = cost.combined;
      expect(combined.kind).toBe('known');
      expect(
        combined.kind === 'known' &&
          combined.materials.some((material) => /merc/i.test(material.symbol)),
      ).toBe(false);
    });

    it('starts a Mercenary progression above the grade the article was bought at', () => {
      const merc = mercenaryVariant();
      const recipe = merc.blueprint;
      // The purchase *is* the completed grade: the article arrived engineered.
      const bought = {
        ...NOTHING,
        blueprintFdname: recipe,
        currentBlueprintFdname: recipe,
        currentGrade: merc.grade,
        purchaseVariant: merc,
      };

      expect(engineeringCost({ ...bought, grade: 5 }).blueprint).toEqual({
        kind: 'known',
        ...getBlueprintCost(recipe, 5, merc.grade)!,
      });
      // At the grade it arrived at there is no job at all: the article was
      // bought, not crafted, and its price is the Merc Coin line. Pricing its
      // own recipe there would quote a Commander for something no engineer
      // will do (wave 5).
      expect(engineeringCost({ ...bought, grade: merc.grade }).blueprint).toEqual({
        kind: 'notSelected',
      });
      // And each grade already completed takes more off the bill, so the
      // continuation is a live rule rather than a comment.
      const fromPurchase = getBlueprintCost(recipe, 5, merc.grade)!;
      const fromFour = getBlueprintCost(recipe, 5, 4)!;
      expect(total(fromFour.materials)).toBeLessThan(total(fromPurchase.materials));
    });
  });
});

/** How many materials one list asks for, for comparing two climbs. */
function total(materials: readonly { readonly count: number }[]): number {
  return materials.reduce((sum, material) => sum + material.count, 0);
}
