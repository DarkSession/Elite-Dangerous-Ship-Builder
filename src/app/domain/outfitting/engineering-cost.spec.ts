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
        materials: getBlueprintCost(ORDINARY_BLUEPRINT, 5),
      });
    });

    it('continues from the completed grade when the recipe is the one already applied', () => {
      const cost = engineeringCost({
        ...NOTHING,
        blueprintFdname: ORDINARY_BLUEPRINT,
        grade: 5,
        currentBlueprintFdname: ORDINARY_BLUEPRINT,
        currentGrade: 3,
      });

      expect(cost.blueprint).toEqual({
        kind: 'known',
        materials: getBlueprintCost(ORDINARY_BLUEPRINT, 5, 3),
      });
      // And that is genuinely less than starting over — otherwise the
      // continuation would be a rule with no effect.
      const whole = getBlueprintCost(ORDINARY_BLUEPRINT, 5)!;
      const remaining = getBlueprintCost(ORDINARY_BLUEPRINT, 5, 3)!;
      expect(total(remaining)).toBeLessThan(total(whole));
    });

    it('starts a replacement recipe from nothing, not from the old recipe’s grade', () => {
      const other = 'FSD_FastBoot';
      const cost = engineeringCost({
        ...NOTHING,
        blueprintFdname: other,
        grade: 5,
        // Grades already paid for belong to the recipe being replaced.
        currentBlueprintFdname: ORDINARY_BLUEPRINT,
        currentGrade: 4,
      });

      expect(cost.blueprint).toEqual({ kind: 'known', materials: getBlueprintCost(other, 5) });
    });

    it('matches the recipe identity the way the package matches it', () => {
      const cost = engineeringCost({
        ...NOTHING,
        blueprintFdname: ORDINARY_BLUEPRINT.toLowerCase(),
        grade: 5,
        currentBlueprintFdname: ORDINARY_BLUEPRINT.toUpperCase(),
        currentGrade: 4,
      });

      expect(cost.blueprint).toEqual({
        kind: 'known',
        materials: getBlueprintCost(ORDINARY_BLUEPRINT, 5, 4),
      });
    });

    it('shows a completed grade as a known zero rather than as unavailable', () => {
      const cost = engineeringCost({
        ...NOTHING,
        blueprintFdname: ORDINARY_BLUEPRINT,
        grade: 3,
        currentBlueprintFdname: ORDINARY_BLUEPRINT,
        currentGrade: 5,
      });

      // The package answers `[]`, and `[]` is "nothing left to buy". Rendering
      // that as unavailable would hide a finished job behind a shrug.
      expect(cost.blueprint).toEqual({ kind: 'known', materials: [] });
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

  describe('the experimental effect', () => {
    it('charges one application for an effect the module does not carry', () => {
      const cost = engineeringCost({ ...NOTHING, effectFdname: ORDINARY_EFFECT });

      expect(cost.experimental).toEqual({
        kind: 'known',
        materials: getExperimentalEffectCost(ORDINARY_EFFECT),
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

    it('charges nothing for the effect already applied', () => {
      const cost = engineeringCost({
        ...NOTHING,
        effectFdname: ORDINARY_EFFECT,
        currentEffectFdname: ORDINARY_EFFECT,
      });

      expect(cost.experimental).toEqual({ kind: 'notSelected' });
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
          getBlueprintCost(ORDINARY_BLUEPRINT, 5)!,
          getExperimentalEffectCost(ORDINARY_EFFECT)!,
        ),
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
      expect(engineeringCost(NOTHING).combined).toEqual({ kind: 'known', materials: [] });
    });
  });

  describe('purchased articles', () => {
    it('never prices a reward’s baked engineering', () => {
      const reward = fixedRewardVariant();

      const cost = engineeringCost({ ...NOTHING, purchaseVariant: reward });

      // The article arrived already modified. There is no shopping list for
      // what it came with, and quoting its recipe would quote for the wrong
      // thing entirely.
      expect(cost.fixedPurchase).toBe('notCrafted');
      expect(cost.blueprint).toEqual({ kind: 'notSelected' });
      expect(cost.combined).toEqual({ kind: 'known', materials: [] });
    });

    it('says nothing about a purchase for an ordinary module', () => {
      expect(engineeringCost(NOTHING).fixedPurchase).toBeNull();
      expect(engineeringCost(NOTHING).mercCoin).toBeNull();
    });

    it('keeps Merc Coin separate from every material list', () => {
      const merc = mercenaryVariant();

      const cost = engineeringCost({
        ...NOTHING,
        blueprintFdname: ORDINARY_BLUEPRINT,
        grade: 5,
        purchaseVariant: merc,
      });

      expect(cost.mercCoin).toBe(merc.mercCoinCost);
      expect(cost.mercCoin).not.toBeNull();
      // It is a currency with no material or credit equivalent, so it never
      // joins the shopping list.
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
        materials: getBlueprintCost(recipe, 5, merc.grade),
      });
      // A bespoke recipe's own table begins above the purchase, so the package
      // prices nothing at the grade the article arrived at. That is unavailable,
      // and it stays unavailable — writing a zero there would claim the article
      // is craftable from scratch when the Almanac says it is bought.
      expect(engineeringCost({ ...bought, grade: merc.grade }).blueprint).toEqual({
        kind: 'unavailable',
      });
      // And each grade already completed takes more off the bill, so the
      // continuation is a live rule rather than a comment.
      const fromPurchase = getBlueprintCost(recipe, 5, merc.grade)!;
      const fromFour = getBlueprintCost(recipe, 5, 4)!;
      expect(total(fromFour)).toBeLessThan(total(fromPurchase));
    });
  });
});

/** How many materials one list asks for, for comparing two climbs. */
function total(materials: readonly { readonly count: number }[]): number {
  return materials.reduce((sum, material) => sum + material.count, 0);
}
