import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { IngressNotice } from '../../domain/ships/build/build-ingress-result';
import type { BuildLinkCodecErrorCode } from '../../domain/build-link/build-link-codec-error';

/**
 * Where the active build came from, as a workflow fact.
 *
 * This is application state, not build state: it decides what the workspace
 * says and which actions make sense, and it is never exported, encoded or
 * stored inside a build (persistence contract, "Boundary exclusions").
 */
export type BuildProvenance = 'none' | 'stock' | 'working' | 'named' | 'link';

/** The named record an active build was opened from, and the revision it saw. */
export interface NamedSource {
  readonly recordId: string;
  readonly baseRevisionId: string;
}

/**
 * What persistence is currently doing, or currently unable to do.
 *
 * None of these states makes the build unusable. That is the point of naming
 * them separately from the build: editing, calculating, sharing and exporting
 * all continue while persistence is unavailable, full or failing (FR-014).
 */
export type PersistenceStatus =
  | 'ready'
  | 'saving'
  | 'saved'
  | 'quota-full'
  | 'unavailable'
  | 'write-failed'
  | 'record-deleted-externally';

/**
 * Why a build link could not be used.
 *
 * The codec's own seven codes, plus the one refusal the application makes
 * without it: a value longer than the published bound is rejected before a
 * decoder is ever built, so no codec code describes it.
 */
export type LinkFailureCode = BuildLinkCodecErrorCode | 'tooLong';

/** How the current build is represented in the URL fragment. */
export type LinkPublicationState =
  | { readonly kind: 'absent' }
  | { readonly kind: 'encoding' }
  | {
      readonly kind: 'published';
      readonly fragment: string;
      /**
       * The revision this fragment encodes.
       *
       * Recorded at publication so a later reader can tell "the link for this
       * build" from "the link for the build this one used to be". Publication
       * is asynchronous: a modelled edit bumps the revision before the encode
       * that follows it has run, and for that moment the published fragment is
       * a correct link to a build nobody is looking at any more. A SLEF export
       * has to omit it rather than point a consumer at it (export contract,
       * "Package invocation").
       */
      readonly revision: number;
    }
  | {
      readonly kind: 'refused';
      readonly code: LinkFailureCode;
      /** The slot the codec named, when it could name one. */
      readonly slot: string | null;
    };

/**
 * A detached build, complete and validated, that has not been made active.
 *
 * Every path that can replace the active build — stock creation, opening a
 * record, loading a link — produces one of these first and hands it to the one
 * coordinator that commits. A candidate that fails to construct never reaches
 * the store, so a failure cannot half-replace a Commander's work.
 */
export interface BuildCandidate {
  readonly loadout: ShipLoadout;
  /**
   * The hull's name, in the Commander's language, resolved by whoever built
   * the candidate.
   *
   * It travels with the candidate rather than being looked up when it is
   * displayed, because the package's game-text leaves are half a megabyte and
   * the surfaces that show this name — the command bar, the library's rows —
   * are mounted on screens that never open a build.
   */
  readonly hullName: string;
  readonly provenance: BuildProvenance;
  /**
   * What the Almanac completed while this candidate was being read in.
   *
   * Travels with the candidate rather than being published separately, because
   * a notice about a build that was not committed is a notice about nothing —
   * and one published after the commit would race the commit that clears them.
   */
  readonly qualityNotices: readonly IngressNotice[];
  /** The named record this candidate came from, when it came from one. */
  readonly sourceNamed: NamedSource | null;
  /**
   * The unnamed record this candidate already lives in, when it came from one.
   *
   * Only an unnamed record can be one: autosave has no path to a named record,
   * so a build opened from a named save arrives with `null` here and forks its
   * own record at the first modelled edit (FR-008).
   */
  readonly autosaveRecordId: string | null;
  /**
   * The fingerprint this candidate is already saved against, or `null`.
   *
   * A candidate opened from a named record arrives clean; a freshly created
   * stock build or a decoded link arrives dirty, because neither exists
   * anywhere the Commander could get it back from.
   */
  readonly baseline: string | null;
}

/**
 * One transient notice the package produced while completing a partial roll.
 *
 * The ingress gate's own record, carried through rather than copied into a
 * second shape. Two shapes for one notice is two places for the slot key to be
 * spelled differently (build-ingress result, "IngressNotice").
 */
export type QualityCompletionNotice = IngressNotice;

/** The whole of the application's state around one live build. */
export interface ActiveBuildState {
  readonly loadout: ShipLoadout | null;
  readonly hullName: string | null;
  readonly provenance: BuildProvenance;
  readonly autosaveRecordId: string | null;
  readonly sourceNamed: NamedSource | null;
  readonly baselineFingerprint: string | null;
  readonly dirty: boolean;
  readonly persistence: PersistenceStatus;
  readonly link: LinkPublicationState;
  readonly qualityCompletionNotices: readonly QualityCompletionNotice[];
}
