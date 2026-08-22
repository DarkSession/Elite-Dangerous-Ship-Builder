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
  /** One application of a newly selected effect. Removal costs nothing. */
  readonly experimental: MaterialCost;
  /** Both together, summed only when every selected part is known. */
  readonly combined: CombinedCost;
  /**
   * Present when the module is a package-identified purchase.
   *
   * A reward article arrives already modified. Its baked engineering was never
   * crafted and pricing its recipe would quote a Commander for something they
   * cannot buy with materials, so this says so instead of showing a number
   * (FR-013, outfitting-editor contract "Engineering").
   */
  readonly fixedPurchase: 'notCrafted' | null;
  /**
   * The article's Merc Coin price, when it has one.
   *
   * Kept out of the material lists entirely. Merc Coin has no credit or
   * material equivalent, and folding it into a shopping list would invent an
   * exchange rate the game does not have.
   */
  readonly mercCoin: number | null;
}

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
 * The climb starts from where the module already is when the recipe is the one
 * it already carries, and from nothing when it is a different recipe. That one
 * rule is also what makes a Mercenary upgrade correct without a second branch:
 * the article was bought at grade 1, so its completed grade is 1, so upgrading
 * to grade 3 is charged for grades 2 and 3 (contract, "Engineering").
 */
export function engineeringCost(selection: EngineeringSelection): EngineeringCostView {
  const blueprint = blueprintCost(selection);
  const experimental = experimentalCost(selection);

  return {
    blueprint,
    experimental,
    combined: combine(blueprint, experimental),
    fixedPurchase: selection.purchaseVariant === null ? null : 'notCrafted',
    mercCoin: selection.purchaseVariant?.mercCoinCost ?? null,
  };
}

function blueprintCost(selection: EngineeringSelection): MaterialCost {
  const fdname = selection.blueprintFdname;
  const grade = selection.grade;
  if (fdname === null || grade === null) {
    return { kind: 'notSelected' };
  }
  if (!Number.isInteger(grade) || grade < 1 || grade > 5) {
    // The package throws for a grade outside its range. A grade that is not one
    // of the package's own is not a grade this application can price, and
    // guessing which one was meant would be worse than saying so.
    return { kind: 'unavailable' };
  }

  // Continuing the recipe the module already carries, or starting a new one.
  // A replacement recipe is climbed from nothing because the grades already
  // paid for belong to the recipe being replaced, not to this one.
  const from = sameRecipe(fdname, selection.currentBlueprintFdname)
    ? completedGrade(selection.currentGrade)
    : 0;

  const materials = getBlueprintCost(fdname, grade, from);
  return materials === null ? { kind: 'unavailable' } : { kind: 'known', materials };
}

function experimentalCost(selection: EngineeringSelection): MaterialCost {
  const fdname = selection.effectFdname;
  // Removing an effect is not a crafting job, and neither is keeping the one
  // that is already applied. Both are "nothing to buy", not "nothing costed".
  if (fdname === null || sameRecipe(fdname, selection.currentEffectFdname)) {
    return { kind: 'notSelected' };
  }

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

/** The grade the climb starts above. Absent engineering has climbed nothing. */
function completedGrade(grade: number | null): number {
  return grade !== null && Number.isInteger(grade) && grade >= 1 && grade <= 5 ? grade : 0;
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
