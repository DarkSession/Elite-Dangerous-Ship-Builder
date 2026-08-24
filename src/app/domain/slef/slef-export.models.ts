import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { PackageValidation } from './slef-import.models';

/**
 * The file an export downloads as.
 *
 * Fixed, and deliberately so. A name built from the hull, the ship name or the
 * ident would put untrusted text — a name a Commander typed, or one that
 * arrived in an imported payload — into a filesystem path (export contract,
 * "Artifact lifecycle").
 */
export const SLEF_EXPORT_FILENAME = 'build.slef.json';

/** What the payload is, for the Blob and for the share sheet. */
export const SLEF_EXPORT_MIME_TYPE = 'application/json;charset=utf-8';

/**
 * One atomic read of the active build, supplied by feature 001.
 *
 * Atomic because the three fields have to agree: a link certified for an older
 * revision must not reach an artifact generated for a newer loadout, and the
 * only way to guarantee that is to read all three at once. `null` means there
 * is no active build, which means no generation and no stale artifact.
 */
export interface ActiveExportSnapshot {
  readonly loadout: ShipLoadout;
  readonly revision: number;
  /** What feature 001 says about a link for exactly this revision. */
  readonly canonicalLink: CanonicalLink;
}

/**
 * Feature 001's answer about a link for the revision being exported.
 *
 * A union rather than a nullable string, because the four ways there can be no
 * link are four different things to tell a Commander — and because `certified`
 * has to be a claim somebody made, not a URL that happened to be lying around.
 * Feature 004 never encodes a build, constructs a base URL or decides for
 * itself that a published fragment still describes the current revision.
 */
export type CanonicalLink =
  { readonly kind: 'certified'; readonly url: string } | { readonly kind: LinkOmissionReason };

/** The producer metadata the SLEF envelope carries. */
export interface SlefExportHeader {
  readonly appName: string;
  readonly appVersion: string;
  readonly appURL?: string;
}

/** Why an export carries no `appURL`. Disclosure, never an export failure. */
export type LinkOmissionReason = 'absent' | 'pending' | 'refused' | 'stale';

/**
 * One immutable export, keyed to the revision it describes.
 *
 * Generated once and consumed by every delivery action. Delivery rechecks the
 * revision rather than regenerating, so what a Commander copies is exactly what
 * they read on screen (export contract, "Artifact lifecycle").
 */
export interface SlefExportArtifact {
  readonly revision: number;
  readonly payload: string;
  readonly utf8Bytes: number;
  readonly moduleCount: number;
  readonly filename: typeof SLEF_EXPORT_FILENAME;
  readonly mimeType: typeof SLEF_EXPORT_MIME_TYPE;
  readonly header: SlefExportHeader;
  /** Present when the header carries no `appURL`, saying why. */
  readonly linkOmission: LinkOmissionReason | null;
  /** Disclosure only. An invalid build still exports (FR-001, FR-004). */
  readonly validation: PackageValidation;
}

/**
 * What this browser can actually do with a payload.
 *
 * Feature detection only. Never a viewport measurement and never a user-agent
 * string: a narrow window is not a phone, and a phone is not a share target
 * (delivery contract, "Capability").
 */
export interface DeliveryCapability {
  readonly clipboard: 'available' | 'unavailable';
  /** Always available: an anchor and a Blob need no permission. */
  readonly download: 'available';
  readonly share: 'file' | 'text' | 'unavailable';
}

/**
 * A stable application-owned reason. Raw DOM exception prose is never UI.
 *
 * Two, not three. `unsupported` is a thing the application checked — there was
 * no artifact to deliver — and `failed` is everything the platform answered
 * with a bare no. There is deliberately no `permissionDenied`: a rejected
 * write, a denied permission and an insecure context are indistinguishable
 * through the ports, and naming one of them would state a cause nothing
 * observed.
 */
export type DeliveryFailureReason = 'unsupported' | 'failed';

/**
 * How one delivery attempt ended.
 *
 * `download` has no success state on purpose. Dispatching a download is
 * observable; whether a file reached a disk is not, and claiming it did would
 * be the sort of fabricated success FR-004 exists to forbid.
 */
export type DeliveryOutcome =
  | { readonly action: 'copy'; readonly status: 'working' }
  | { readonly action: 'copy'; readonly status: 'copied' }
  | { readonly action: 'copy'; readonly status: 'failed'; readonly reason: DeliveryFailureReason }
  | { readonly action: 'download'; readonly status: 'dispatched' }
  | {
      readonly action: 'download';
      readonly status: 'setupFailed';
      readonly reason: DeliveryFailureReason;
    }
  | { readonly action: 'share'; readonly status: 'working' }
  | { readonly action: 'share'; readonly status: 'shared' }
  /** The chooser was dismissed. Neutral: nothing failed and nothing happened. */
  | { readonly action: 'share'; readonly status: 'cancelled' }
  | { readonly action: 'share'; readonly status: 'failed'; readonly reason: DeliveryFailureReason };

/** One delivery action a Commander can start. */
export type DeliveryAction = DeliveryOutcome['action'];
