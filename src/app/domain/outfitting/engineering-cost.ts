import { getMaterialBySymbol } from '@elite-dangerous-almanac/core/materials/materials';
import { getBlueprintCost } from '@elite-dangerous-almanac/core/ships/blueprint-costs';
import {
  sumMaterials,
  type EngineeringMaterial,
} from '@elite-dangerous-almanac/core/ships/engineering';
import { getExperimentalEffectCost } from '@elite-dangerous-almanac/core/ships/experimental-effect-costs';
import type { PreEngineeredVariant } from '@elite-dangerous-almanac/core/ships/pre-engineered';

/**
 * What one part of an engineering job costs, or why there is no figure.
 *
 * Three states, because the package answers in three ways and collapsing any
 * two of them tells a Commander something untrue. `known` with an empty list is
 * the package saying "nothing more is needed"; `unavailable` is the package
 * having no recipe to price at all. Showing the second as a zero would promise
 * a free upgrade the Almanac never costed (FR-013, constitution VI).
 */
export type MaterialCost =
  | { readonly kind: 'known'; readonly materials: readonly EngineeringMaterial[] }
  | { readonly kind: 'unavailable' }
  /** Nothing is selected that this part could cost. Not zero, not missing. */
  | { readonly kind: 'notSelected' };

/** The combined figure, which is either summable or not stateable. */
export type CombinedCost =
  | { readonly kind: 'known'; readonly materials: readonly EngineeringMaterial[] }
  | { readonly kind: 'unavailable' };

/** What one draft would cost to craft, entirely from package results. */
export interface EngineeringCostView {
  /** The complete climb to the selected grade, from where the module already is. */
  readonly blueprint: MaterialCost;
  /** One application of the selected effect. Removal costs nothing. */
  readonly experimental: MaterialCost;
  /** Both together, summed only when every selected part is known. */
  readonly combined: CombinedCost;
}

// The article's Merc Coin shop price is deliberately **not** here. It is the
// price of buying the module, which the manifest row it is bought from already
// states; standing at the foot of a job's shopping list it read as the price of
// that job instead. Nor is there a per-grade figure to put in its place: the
// Almanac publishes one fixed `mercCoinCost` per Mercenary article and says the
// current grade does not change it, so a Merc Coin figure beside a grade-5 climb
// would be one the game does not have (wave 9, constitution IV).

/** What the Commander has chosen, against what the module already carries. */
export interface EngineeringSelection {
  /** The recipe being applied. `null` when nothing is selected. */
  readonly blueprintFdname: string | null;
  /** The grade being applied. `null` when none is chosen yet. */
  readonly grade: number | null;
  /** The effect being applied. `null` is an explicit no-effect. */
  readonly effectFdname: string | null;
  readonly currentBlueprintFdname: string | null;
  /** The completed grade the module already carries, 1–5, or `null`. */
  readonly currentGrade: number | null;
  readonly currentEffectFdname: string | null;
  readonly purchaseVariant: PreEngineeredVariant | null;
}

/**
 * Prices one engineering draft, using only the package's own cost catalogues.
 *
 * Three package calls and nothing else: `getBlueprintCost` for the climb,
 * `getExperimentalEffectCost` for the effect, `sumMaterials` to fold them
 * together. There is deliberately no per-grade breakdown and no call to
 * `getBlueprintGradeCost`, because a per-roll figure is a figure about *rolling*
 * — and this application models completed grades, never rolls. A surface that
 * showed "5 rolls at grade 5" would be describing a mechanic the rest of the
 * feature refuses to model (FR-013, contract "Engineering").
 *
 * The climb is the whole recipe: stock to the selected grade, every time. It is
 * what a job costs rather than what is left of one, because a choice commits as
 * it is made and "what is left" is nothing by the time anybody reads it. A Merc
 * Coin article's own purchase price stays out of it altogether
 * (wave 5, wave 9; supersedes the incremental climb this once carried).
 */
export function engineeringCost(selection: EngineeringSelection): EngineeringCostView {
  const blueprint = blueprintCost(selection);
  const experimental = experimentalCost(selection);

  return {
    blueprint,
    experimental,
    combined: combine(blueprint, experimental),
  };
}

function blueprintCost(selection: EngineeringSelection): MaterialCost {
  const fdname = selection.blueprintFdname;
  const grade = selection.grade;
  if (fdname === null || grade === null) {
    return { kind: 'notSelected' };
  }
  const purchase = selection.purchaseVariant;
  if (purchase !== null && grade === purchase.grade && sameRecipe(fdname, purchase.blueprint)) {
    // The article as it arrived. A reward is bought, not crafted: there is no
    // shopping list for what it came with, and pricing its recipe would quote a
    // Commander for something no engineer will do. Its price is the Merc Coin
    // line beside this one. Engineering it *further* costs materials like any
    // other job, which is the branch below (wave 5).
    return { kind: 'notSelected' };
  }
  if (!Number.isInteger(grade) || grade < 1 || grade > 5) {
    // The package throws for a grade outside its range. A grade that is not one
    // of the package's own is not a grade this application can price, and
    // guessing which one was meant would be worse than saying so.
    return { kind: 'unavailable' };
  }

  // The whole recipe, from stock to the selected grade. What the panel answers
  // is "what does this engineering cost", which is a property of the recipe and
  // the grade rather than of how far along the module happens to be — and since
  // a choice commits as it is made, a figure for what is *left* would be zero
  // every time it was read (wave 5, canvas 1c `MATERIALS · G5 · REQUIRED`).
  const materials = getBlueprintCost(fdname, grade, 0);
  return materials === null ? { kind: 'unavailable' } : { kind: 'known', materials };
}

function experimentalCost(selection: EngineeringSelection): MaterialCost {
  const fdname = selection.effectFdname;
  // Removing an effect is not a crafting job. That is "nothing to buy", not
  // "nothing costed".
  if (fdname === null) {
    return { kind: 'notSelected' };
  }

  const purchase = selection.purchaseVariant;
  if (purchase !== null && sameRecipe(fdname, purchase.experimental ?? null)) {
    // The article as it arrived, exactly as the blueprint branch above treats
    // the recipe it came with. A reward is bought, not crafted, and pricing the
    // effect baked into it would quote a Commander for a job no engineer will
    // do.
    return { kind: 'notSelected' };
  }

  // What the effect costs, whether or not it is on the module already — the
  // same rule the climb above follows, and for the same reason. Inline, a
  // choice commits as it is made, so by the time anybody reads this figure the
  // effect is always "already applied"; a cost that fell to nothing on being
  // chosen was a list that never changed no matter what was picked (wave 9,
  // canvas 1c `MATERIALS · G5 · REQUIRED`).
  const materials = getExperimentalEffectCost(fdname);
  return materials === null ? { kind: 'unavailable' } : { kind: 'known', materials };
}

/**
 * Folds the parts together, only when every selected part has a figure.
 *
 * One unavailable part makes the total unavailable rather than making it the
 * other part's figure. A total that silently omitted a cost the package could
 * not state would be an understatement presented as a total.
 */
function combine(blueprint: MaterialCost, experimental: MaterialCost): CombinedCost {
  if (blueprint.kind === 'unavailable' || experimental.kind === 'unavailable') {
    return { kind: 'unavailable' };
  }

  const lists = [blueprint, experimental]
    .filter(
      (part): part is { kind: 'known'; materials: readonly EngineeringMaterial[] } =>
        part.kind === 'known',
    )
    .map((part) => part.materials);

  return { kind: 'known', materials: lists.length === 0 ? [] : sumMaterials(...lists) };
}

/** Package identities are compared the way the package matches them. */
function sameRecipe(left: string | null, right: string | null): boolean {
  if (left === null || right === null) {
    return left === right;
  }
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

/**
 * One material's rarity, as the package grades it.
 *
 * Both canvases draw the rarity as an icon fetched from `edassets.org`, which
 * constitution I forbids; the grade is the same fact from the package we
 * already depend on. It is resolved here rather than in the component that
 * draws it, because reading a catalogue is not a presentation concern
 * (constitution III).
 */
export function materialRarity(symbol: string): number | null {
  return getMaterialBySymbol(symbol)?.grade ?? null;
}
