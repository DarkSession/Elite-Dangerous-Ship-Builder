import type { EngineeringModifier } from '@elite-dangerous-almanac/core/ships/slef';
import type { PreEngineeredVariant } from '@elite-dangerous-almanac/core/ships/pre-engineered';
import type { FittedModuleView } from './fitted-module-view';

/**
 * What one fitted module is currently engineered with, as a screen sees it.
 *
 * Everything here is read from the package's own engineering block and its
 * `preEngineeredVariant`; nothing is derived, recognised or reconstructed. A
 * module the package says nothing about projects to `null` fields, which the
 * editor renders as unavailable rather than as unengineered — the two are
 * different claims and only the package can tell them apart.
 *
 * `quality` is the literal `1` rather than the block's own number. Every grade
 * this application models is a completed grade: a supported partial roll is
 * normalized to 100% at ingress before anything reads it, an unsupported one
 * never becomes a build at all, and nothing here can produce a fractional roll
 * because every apply passes `quality: 1` explicitly. Carrying the block's
 * figure instead would let a screen show a roll this application does not model
 * and cannot edit (FR-013, data model "EngineeringView").
 */
export interface EngineeringView {
  /** The package's own recipe identity. `null` when the module carries none. */
  readonly blueprintFdname: string | null;
  /** The grade currently applied, 1–5. `null` when there is no engineering. */
  readonly currentGrade: number | null;
  /** Always `1`. Named rather than implied, because it is the whole claim. */
  readonly quality: 1;
  /** The experimental effect currently applied. `null` means none. */
  readonly effectFdname: string | null;
  /**
   * The package's own modifier block, exactly as it published it.
   *
   * `null` is "the package did not state them", which SLEF explicitly permits
   * and which is not the same as "this engineering changes nothing". Nothing
   * here fills the gap in.
   */
  readonly modifiers: readonly EngineeringModifier[] | null;
  /**
   * The article this was *bought* as, when the package identifies one.
   *
   * Kept beside the current engineering rather than merged into it, because the
   * two disagree the moment a Mercenary article is crafted up a grade: the
   * purchase is still grade 1, the module is now grade 3, and a surface that
   * showed one number would be wrong about the other (FR-007).
   */
  readonly purchaseVariant: PreEngineeredVariant | null;
}

/** Nothing is engineered, and the package says so rather than staying silent. */
export const UNENGINEERED: EngineeringView = {
  blueprintFdname: null,
  currentGrade: null,
  quality: 1,
  effectFdname: null,
  modifiers: null,
  purchaseVariant: null,
};

/**
 * Projects one fitted module's current engineering.
 *
 * Takes the view rather than the package's `FittedModule` so the projection is
 * built from the same retained record the rest of the workspace reads, and so a
 * caller cannot accidentally hand it a module from a previous revision.
 */
export function engineeringView(module: FittedModuleView): EngineeringView {
  const engineering = module.engineering;

  if (engineering === null) {
    // An unengineered module still has its purchase identity: a Mercenary
    // article whose engineering was cleared keeps nothing, but a stock module
    // fitted from a reward row never had an engineering block to begin with.
    return { ...UNENGINEERED, purchaseVariant: module.variant };
  }

  return {
    blueprintFdname: engineering.BlueprintName,
    currentGrade: engineering.Level,
    quality: 1,
    effectFdname: engineering.ExperimentalEffect ?? null,
    modifiers: engineering.Modifiers ?? null,
    purchaseVariant: module.variant,
  };
}
