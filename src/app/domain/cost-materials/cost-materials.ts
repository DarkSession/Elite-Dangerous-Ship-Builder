import {
  sumMaterials,
  type EngineeringMaterial,
} from '@elite-dangerous-almanac/core/ships/engineering';
import type { FittedModule, ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
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
  /**
   * `hull + modules`. The one credits figure the package does not return.
   *
   * `RetailCredits` has no combined field, so this is the application's own
   * addition — permitted by ruling A because it is arithmetic over two package
   * results and owns no game rule. Nothing else about credits is derived: the
   * `5%` in the rebuy label is the canvas's fixed text, not this number's
   * relationship to that one.
   */
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
  // Enumerated once and passed down, so both projections below describe the
  // same fitted state even if the caller mutates the loadout between them.
  const fitted = loadout.fittedModules();

  return Object.freeze({
    credits: projectCredits(loadout),
    materials: projectMaterials(fitted),
    mercCoin: projectMercCoin(fitted, loadout),
  });
}

/**
 * The `COST` block, from one `retailCredits()` call.
 *
 * The returned `unpriced` list is deliberately not read. The canvas draws no
 * evidence for it and ruling F declined to invent any, which means an unpriced
 * module lowers `modules` silently — a cost accepted with that ruling.
 */
export function projectCredits(loadout: ShipLoadout): CreditsView {
  const retail = loadout.retailCredits();

  return {
    hull: retail.hull,
    modules: retail.modules,
    total: retail.hull + retail.modules,
    rebuy: retail.rebuy,
  };
}

/**
 * The build's Merc Coin cost, or `null` when no article was bought with it.
 *
 * Recognition comes only from the package's own `acquisition`, never from a
 * symbol, a blueprint or a non-zero total — `mercCoinCost()` returns `0` both
 * for a build with no Mercenary article and for one whose article has no
 * published price, so the total cannot tell those apart and is not asked.
 */
export function projectMercCoin(
  fitted: readonly FittedModule[],
  loadout: ShipLoadout,
): number | null {
  const recognised = fitted.some(
    (module) => module.preEngineeredVariant?.acquisition === 'mercenary',
  );

  return recognised ? loadout.mercCoinCost() : null;
}

/**
 * The `MATERIALS` block, folded from feature 002's per-module cost boundary.
 *
 * That boundary already rules the Mercenary purchase baseline, the fixed reward
 * baseline, the baked effect and the cumulative climb (waves 5 and 9). Asking
 * it once per module and summing the answers is the whole job here; a second
 * classifier would be a second opinion about game rules this application does
 * not own (constitution II).
 */
export function projectMaterials(fitted: readonly FittedModule[]): MaterialsView | null {
  const lists: EngineeringMaterial[][] = [];

  for (const module of fitted) {
    const cost = engineeringCost(committedSelection(module));
    // `unavailable` is the package having no recipe to price, and a `known`
    // empty list is it saying nothing more is needed. Neither contributes a
    // row, and neither is named: the canvas draws no missing-recipe wording
    // and ruling F declined to add any.
    if (cost.combined.kind === 'known' && cost.combined.materials.length > 0) {
      lists.push([...cost.combined.materials]);
    }
  }

  if (lists.length === 0) {
    return null;
  }

  // One package call. Its order, symbols and counts are the answer — nothing
  // here sorts, deduplicates or adds.
  const consolidated = sumMaterials(...lists);
  const rows = consolidated.map((material) => ({
    symbol: material.symbol,
    count: material.count,
    grade: materialRarity(material.symbol),
  }));

  return {
    blueprints: lists.length,
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
