import type { EngineeringNormalizationCode } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { LoadoutIssueParams } from '@elite-dangerous-almanac/core/ships/loadout-validation';
import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';

/**
 * What a source said about one module's partial engineering.
 *
 * Recorded *before* construction, because construction is where the evidence
 * stops being available: the package normalizes what it can and the source's
 * own quality figure is no longer in the build. The record exists only so a
 * refusal can name what arrived — the exact slot, the exact article, the exact
 * roll — rather than saying that something somewhere was unsupported.
 *
 * Only finite qualities in `[0, 1)` are captured. A quality of `1` is already
 * complete, and an absent one is not a partial roll; calling the package's
 * completion operation for either would refuse a build that has nothing wrong
 * with it (outfitting-editor contract, "Mandatory ingress normalization").
 */
export interface SourcePartialEngineering {
  readonly slotKey: string;
  readonly moduleSymbol: string;
  readonly blueprintFdname: string | null;
  readonly effectFdname: string | null;
  readonly grade: number | null;
  /** Strictly between 0 and 1. Anything else never becomes one of these. */
  readonly quality: number;
}

/** One thing worth telling the Commander about an accepted build. */
export interface IngressNotice {
  readonly kind: 'qualityCompleted';
  readonly slotKey: string;
  readonly moduleSymbol: string;
  readonly blueprintFdname: string | null;
  readonly previousQuality: number;
  /** Always `1`. Named rather than implied, because it is the whole claim. */
  readonly quality: 1;
}

/**
 * Why one module's partial engineering could not be completed.
 *
 * `packageResult` carries the package's own refusal. `packageContract` is a
 * defect: the package answered a completion request in a way the released
 * contract says it cannot, which is worth surfacing as such rather than as an
 * ordinary "this build is unsupported".
 *
 * A partial whose module did not survive construction is neither. It is not
 * here at all: the module is gone, so there is no roll left to complete, and a
 * mount the package populated with the hull default is ordinary build state
 * (FR-010).
 */
export interface PartialEngineeringFailure {
  readonly source: SourcePartialEngineering;
  readonly reason: 'packageResult' | 'packageContract';
  /** The package's stable normalization code, when the package gave one. */
  readonly code: EngineeringNormalizationCode | null;
  readonly params: LoadoutIssueParams | null;
}

/**
 * How ingress ended.
 *
 * There is no partial outcome by design. A candidate is either wholly accepted
 * — every fixed mount populated by the package, every supported partial
 * completed to 100% — or wholly discarded with the current build untouched
 * (FR-013, SC-005).
 */
export type IngressResult =
  | {
      readonly kind: 'accepted';
      readonly candidate: ShipLoadout;
      readonly notices: readonly IngressNotice[];
    }
  | { readonly kind: 'refused'; readonly failures: readonly PartialEngineeringFailure[] }
  | { readonly kind: 'unusable'; readonly reason: string };
