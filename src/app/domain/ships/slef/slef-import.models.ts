import type {
  EngineeringNormalizationCode,
  ShipLoadout,
} from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { LoadoutIssueParams } from '@elite-dangerous-almanac/core/ships/loadout-validation';
import type { SlefDiagnostic } from '@elite-dangerous-almanac/core/ships/slef';
import type { SourcePartialEngineering } from '../build/build-ingress-result';

export type { SourcePartialEngineering };

/**
 * The package's own verdict on a build.
 *
 * Taken off `ShipLoadout` rather than imported from a fifth leaf, so the type
 * this feature carries is by construction the one the package returns. Almanac
 * 0.2.0 made `validation` a method, so it is the method's return type now — the
 * verdict, not the call.
 */
export type PackageValidation = ReturnType<ShipLoadout['validation']>;

/** The one size gate, in original UTF-8 bytes. Named once, read everywhere. */
export const SLEF_IMPORT_LIMIT_BYTES = 65_536;

/** What the import workflow is currently doing. None of it owns a build. */
export type SlefImportStatus = 'editing' | 'inspecting' | 'awaitingReplacement';

/**
 * One submit's identity.
 *
 * Opaque on purpose: its only operations are "issue a new one" and "is this
 * still the current one". A slow inspection that finishes after a newer submit,
 * a close or a route change compares unequal and is discarded rather than
 * committed.
 */
export type SlefRequestToken = number;

/**
 * The Commander's text, exactly as typed, and what it measures.
 *
 * The text is never trimmed, re-serialized or reparsed by the application: the
 * bytes that are measured are the bytes the package is given, so a draft that
 * passes the gate is the draft that was inspected (import contract, "Pipeline").
 */
export interface SlefImportDraft {
  readonly text: string;
  readonly utf8Bytes: number;
  readonly limitBytes: typeof SLEF_IMPORT_LIMIT_BYTES;
}

/**
 * The package's own diagnostic, projected without alteration.
 *
 * A structural alias rather than a remapping. Renumbering an index, rewriting a
 * path or translating a code privately would make the application the author of
 * a package fact (FR-011).
 */
export type SlefPackageDiagnostic = SlefDiagnostic;

/**
 * Why an import did not happen.
 *
 * Nine kinds, because nine different things are worth telling a Commander apart
 * — and because collapsing them is how "something went wrong" screens happen.
 * The first five are the application's own workflow gates; the last four report
 * what the package said, carrying its structured result rather than its prose.
 */
export type SlefImportFailure =
  | { readonly kind: 'tooLarge'; readonly utf8Bytes: number; readonly limitBytes: number }
  | { readonly kind: 'empty' }
  | { readonly kind: 'syntax' }
  | {
      readonly kind: 'cardinality';
      /** Valid entries plus rejected ones: what the payload actually held. */
      readonly observed: number;
      readonly diagnostics: readonly SlefPackageDiagnostic[];
    }
  | { readonly kind: 'diagnostics'; readonly diagnostics: readonly SlefPackageDiagnostic[] }
  | { readonly kind: 'unknownHull'; readonly sourceHull: string }
  | { readonly kind: 'construction' }
  | {
      readonly kind: 'normalizationUnsupported';
      readonly failures: readonly NormalizationRefusal[];
    }
  | { readonly kind: 'packageContractFailure'; readonly failures: readonly NormalizationRefusal[] };

/** One refused partial roll: what arrived, and what the package said about it. */
export interface NormalizationRefusal {
  readonly source: SourcePartialEngineering;
  /** The package's stable code, when the package gave one. Never invented. */
  readonly code: EngineeringNormalizationCode | null;
  readonly params: LoadoutIssueParams | null;
}

/** One partial roll the package completed, for the post-commit outcome. */
export interface EngineeringQualityCompletion {
  readonly slotKey: string;
  readonly moduleSymbol: string;
  readonly blueprintFdname: string | null;
  readonly previousQuality: number;
  readonly quality: 1;
}

/**
 * A detached, fully normalized build that has not been made active.
 *
 * Everything here is read after construction and quality completion finished,
 * so no figure describes a build that was still being assembled (import
 * contract, step 10). It is handed to feature 001; nothing else commits.
 */
export interface SlefImportCandidate {
  readonly loadout: ShipLoadout;
  /** The producer the envelope named, when it named one. Plain text only. */
  readonly sourceAttribution: SlefSourceAttribution | null;
  readonly qualityCompletions: readonly EngineeringQualityCompletion[];
  readonly validation: PackageValidation;
  readonly requestToken: SlefRequestToken;
}

/** Who the envelope said produced the entry. Never executed, never followed. */
export interface SlefSourceAttribution {
  readonly appName: string;
  readonly appVersion: string;
}
