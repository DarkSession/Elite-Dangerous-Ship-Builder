import type { BuildSnapshotV1 } from './build-snapshot';

/** The discriminator every local record carries. */
export const LOCAL_RECORD_FORMAT = 'edsb.local-record';

/** The only published record-envelope version. */
export const LOCAL_RECORD_VERSION = 1;

/**
 * What a record is for.
 *
 * A `working` record is a tab's autosave: it exists so a reload does not lose
 * an evening's work, and it is the Commander's only if they never name it. A
 * `named` record is a deliberate save. The two behave differently everywhere —
 * ownership, retention, conflict handling — which is why they are one field
 * rather than two record types (persistence contract, "Working records").
 */
export type LocalRecordKind = 'working' | 'named';

/** The package's own verdict at the moment a record was written. */
export interface RecordValidation {
  readonly valid: boolean;
  readonly complete: boolean;
}

/** The named record a working copy was opened from. */
export interface RecordSource {
  readonly recordId: string;
  readonly baseRevisionId: string;
}

/**
 * One stored build, as a complete value under one key.
 *
 * Everything a listing needs is in the envelope, so a library screen never has
 * to reconstruct a build through the package just to show a row — and a record
 * this build cannot open can still be listed honestly.
 *
 * The envelope is metadata about the save, not about the build: none of it
 * enters a build link or a SLEF export (persistence contract, "Boundary
 * exclusions").
 */
export interface LocalRecordV1 {
  readonly format: typeof LOCAL_RECORD_FORMAT;
  readonly version: typeof LOCAL_RECORD_VERSION;
  /** Immutable local identity. Always equals the key's suffix. */
  readonly id: string;
  readonly kind: LocalRecordKind;
  /** A fresh UUID after every successful write. Never derived from a clock. */
  readonly revisionId: string;
  readonly createdAt: string;
  readonly modifiedAt: string;
  /** `null` for a working record. Duplicates are allowed, after a warning. */
  readonly name: string | null;
  /** At most one local note. Never leaves this browser. */
  readonly note: string | null;
  /** Listing metadata. Always equals `build.shipSymbol`. */
  readonly hullSymbol: string;
  /** The package's verdict at this revision, not recomputed on read. */
  readonly validation: RecordValidation;
  readonly build: BuildSnapshotV1;
  /** Present only on a working record opened or forked from a named one. */
  readonly sourceNamed: RecordSource | null;
}

/** A record listed but not openable, and why. */
export type UnavailableReason = 'unsupported-version' | 'malformed';

/** One entry in a listing: either a record, or an honest account of one. */
export type StoredRecordEntry =
  | { readonly available: true; readonly record: LocalRecordV1 }
  | {
      readonly available: false;
      readonly id: string;
      readonly reason: UnavailableReason;
      /** The hull, when it can be read without guessing. */
      readonly hullSymbol: string | null;
      /** The name, when it can be read without guessing. */
      readonly name: string | null;
    };
