import type {
  LoadoutIssueParams,
  ModuleFitConstraint,
} from '@elite-dangerous-almanac/core/ships/loadout-validation';
import type { MessageKey } from '../../i18n/locale-registry';

/**
 * One thing a Commander asked for.
 *
 * Intents are data, not calls. A component emits one and is finished; whether
 * it happens, and what happens to the build if it does, belongs to the store
 * and the transaction beneath it (constitution III). That is what lets the same
 * slot card sit in a preview fixture and in `/build` without one of them
 * editing something.
 *
 * A choice is named by its view key rather than by a package object, because a
 * component never holds one. The store resolves the key back to the exact
 * package record it retained for the current build revision, and a key from a
 * stale revision resolves to nothing rather than to a plausible substitute
 * (module-catalogue contract, "Membership" item 5).
 */
export type BuildEditIntent =
  | { readonly kind: 'fitStock'; readonly slotKey: string; readonly choiceKey: string }
  | { readonly kind: 'fitVariant'; readonly slotKey: string; readonly choiceKey: string }
  | { readonly kind: 'remove'; readonly slotKey: string }
  | {
      readonly kind: 'applyEngineering';
      readonly slotKey: string;
      readonly blueprintFdname: string;
      readonly grade: number;
      /** `null` is an explicit "no effect", not an omission. */
      readonly effectFdname: string | null;
    }
  | {
      readonly kind: 'setExperimental';
      readonly slotKey: string;
      readonly effectFdname: string | null;
    }
  | { readonly kind: 'clearEngineering'; readonly slotKey: string }
  /**
   * Put a purchased article back to what it was bought as.
   *
   * A bespoke Mercenary recipe's own table starts at grade 2, so the grade an
   * article arrived at is a grade `applyBlueprint` cannot reach — the package
   * refuses it outright. Coming back down to it is not a crafting job at all:
   * it is the article again, which is what `setPreEngineeredVariant` restores.
   * The variant itself is read off the fitted module rather than carried here,
   * because an intent never holds a package record (wave 6).
   */
  | { readonly kind: 'restorePurchase'; readonly slotKey: string }
  | { readonly kind: 'setEnabled'; readonly slotKey: string; readonly enabled: boolean }
  | { readonly kind: 'setPriority'; readonly slotKey: string; readonly priority: PowerPriority }
  /** `null` clears the name to absence. An empty string is not the same thing. */
  | { readonly kind: 'setShipName'; readonly value: string | null }
  | { readonly kind: 'setShipIdent'; readonly value: string | null };

/** The package's zero-based power-priority groups. Presented as 1–5. */
export type PowerPriority = 0 | 1 | 2 | 3 | 4;

/**
 * Why an edit did not happen.
 *
 * Five categories, because they lead to five different things to say and five
 * different things to do next. A package refusal has a reason the package can
 * state; a stale draft needs rebuilding; an unavailable operation was never
 * offered; an unexpected refusal is a defect wearing a package error's clothes.
 */
export type EditFailureCategory =
  /** `LoadoutEditError` from an edit operation. Has a package code. */
  | 'packageEdit'
  /** A structured result the package returned, such as `unsupported`. */
  | 'packageResult'
  /** The draft was built against a build revision that no longer exists. */
  | 'staleDraft'
  /** The intent named an operation the package does not offer here. */
  | 'unavailableOperation'
  /** A plain `TypeError`/`RangeError` after a package-offered action. */
  | 'unexpectedPackageRefusal';

/**
 * A refusal, retained whole.
 *
 * The package's own `code`, `constraint` and `params` are kept as data and
 * never parsed, translated or turned into an application rule — a refusal is
 * evidence about one attempt, not a compatibility rule to remember
 * (outfitting-editor contract, "Refusals"). The application owns only the
 * framing sentence around it.
 */
export interface EditFailure {
  readonly category: EditFailureCategory;
  /** The exact package slot key, where the failure has one. */
  readonly slotKey: string | null;
  /** The package's stable code, for `LoadoutEditError` and structured results. */
  readonly code: string | null;
  /** The more specific fitting rule, when the package named one. */
  readonly constraint: ModuleFitConstraint | null;
  /** Language-neutral package values. Never rendered without package text. */
  readonly params: LoadoutIssueParams | null;
  /**
   * The package's own diagnostic, ready for the game-text presenter.
   *
   * Retained as the error object rather than as a string so the presenter can
   * resolve it for whichever locale is active when it is finally rendered.
   */
  readonly diagnostic: unknown;
  /** The application's framing. It frames the reason; it never states one. */
  readonly framingKey: MessageKey;
}

/** How an edit ended. Exactly one revision is spent, or none at all. */
export type BuildEditResult =
  | { readonly kind: 'committed'; readonly revision: number }
  | { readonly kind: 'unchanged'; readonly revision: number }
  | { readonly kind: 'refused'; readonly failure: EditFailure; readonly revision: number };
