import type { EngineeringMaterial } from '@elite-dangerous-almanac/core/ships/engineering';
import type {
  BuildCost,
  FittedModule,
  ShipLoadout,
} from '@elite-dangerous-almanac/core/ships/ship-loadout';
import {
  engineeringCost,
  materialRarity,
  type EngineeringSelection,
} from '../outfitting/engineering-cost';

/**
 * What the build costs and what engineering it needs, as canvases 1c and 1d
 * draw it in the outfitting status rail.
 *
 * The canvas is the record of what this presents. Six collisions between the
 * feature specification and the canvas were surfaced and ruled on in wave 10,
 * and the design won all six — so the combined `TOTAL`, the `REBUY 5%` label,
 * the three aggregate counts and the Merc Coin row inside the materials block
 * are all here, and the trace disclosures, unpriced evidence and lower-bound
 * wording the specification once asked for are not
 * (`specs/009-cost-and-materials/design/reference-review.md`).
 */
export interface CostAndMaterials {
  readonly credits: CreditsView;
  /** `null` when no fitted module contributes a cost list: the block is absent. */
  readonly materials: MaterialsView | null;
  /** `null` when the package recognises no Mercenary article. Never `0` for absence. */
  readonly mercCoin: number | null;
}

/** The four rows of the canvas's `COST` block. */
export interface CreditsView {
  readonly hull: number;
  readonly modules: number;
  /** Package catalogue total for the hull and fitted modules. */
  readonly total: number;
  readonly rebuy: number;
}

/** The canvas's `MATERIALS` block: a count, the rows, and the footer's two counts. */
export interface MaterialsView {
  /** Fitted modules that contributed a cost list. The canvas's `14 BLUEPRINTS`. */
  readonly blueprints: number;
  readonly rows: readonly MaterialRow[];
  /** `rows.length`. The canvas's `18 MATERIAL TYPES`. */
  readonly types: number;
  /** The sum of every row's package count. The canvas's `412 UNITS TOTAL`. */
  readonly units: number;
}

export interface MaterialRow {
  readonly symbol: string;
  readonly count: number;
  /** The package's rarity, 1–5. `null` where it publishes none, and no marker is drawn. */
  readonly grade: number | null;
}

/**
 * Reads one active loadout into the two blocks.
 *
 * Pure and synchronous, because the package's cost calls are. There is no
 * revision key and no cache: with one consumer there is no second surface to
 * disagree with, so there is nothing for a cache to keep coherent, and the
 * signal graph memoises the call for free.
 */
export function projectCostAndMaterials(loadout: ShipLoadout): CostAndMaterials {
  const fitted = loadout.fittedModules();
  const cost = loadout.buildCost();

  return Object.freeze({
    credits: projectCredits(cost),
    materials: projectMaterials(fitted, cost.materials),
    mercCoin: projectMercCoin(cost),
  });
}

/**
 * The `COST` block, from one `buildCost()` result.
 *
 * The returned `unpriced` list is deliberately not read. The canvas draws no
 * evidence for it and ruling F declined to invent any, which means an unpriced
 * module lowers `modules` silently — a cost accepted with that ruling.
 */
export function projectCredits(cost: BuildCost): CreditsView {
  const retail = cost.credits;

  return {
    hull: retail.hull,
    modules: retail.modules,
    total: retail.total,
    rebuy: retail.rebuy,
  };
}

/**
 * The build's Merc Coin cost, or `null` when no article was bought with it.
 *
 * `buildCost()` includes both Mercenary articles and ordinary engineering-menu
 * recipes that charge this currency. Zero means the package reports no charge,
 * so the canvas row is absent rather than displaying a fabricated absence.
 */
export function projectMercCoin(cost: BuildCost): number | null {
  return cost.mercCoins > 0 ? cost.mercCoins : null;
}

/**
 * The `MATERIALS` block, from the package's consolidated build-cost result.
 *
 * That boundary already rules the Mercenary purchase baseline, the fixed reward
 * baseline, the baked effect and the cumulative climb (waves 5 and 9). Asking
 * it once per module identifies the contributing blueprints the canvas asks us
 * to count; a second classifier would be a second opinion about game rules this
 * application does not own (constitution II). Material identities and quantities
 * remain the package's already-consolidated answer.
 */
export function projectMaterials(
  fitted: readonly FittedModule[],
  consolidated: readonly EngineeringMaterial[],
): MaterialsView | null {
  let blueprints = 0;

  for (const module of fitted) {
    const cost = engineeringCost(committedSelection(module));
    // `unavailable` is the package having no recipe to price, and a `known`
    // empty list is it saying nothing more is needed. Neither contributes a
    // row, and neither is named: the canvas draws no missing-recipe wording
    // and ruling F declined to add any.
    if (cost.combined.kind === 'known' && cost.combined.materials.length > 0) {
      blueprints += 1;
    }
  }

  if (consolidated.length === 0) {
    return null;
  }

  const rows = consolidated.map((material) => ({
    symbol: material.symbol,
    count: material.count,
    grade: materialRarity(material.symbol),
  }));

  return {
    blueprints,
    rows,
    types: rows.length,
    units: rows.reduce((running, row) => running + row.count, 0),
  };
}

/**
 * What one fitted module already carries, in the shape feature 002 prices.
 *
 * A committed module's "selection" is its current state: there is no draft
 * here, so the selected and current fields are the same values. Feature 002's
 * boundary compares them against `purchaseVariant` to tell a bought article
 * from a crafted one, which is why the variant travels with them.
 */
function committedSelection(module: FittedModule): EngineeringSelection {
  const engineering = module.engineering ?? null;
  const blueprintFdname = engineering?.BlueprintName ?? null;
  const grade = engineering?.Level ?? null;
  const effectFdname = engineering?.ExperimentalEffect ?? null;

  return {
    blueprintFdname,
    grade,
    effectFdname,
    currentBlueprintFdname: blueprintFdname,
    currentGrade: grade,
    currentEffectFdname: effectFdname,
    purchaseVariant: module.preEngineeredVariant,
  };
}
