import type { StoredLoadoutV1 } from '../equipment/loadout/stored-loadout.serializer';
import type { BuildSnapshotV1 } from '../ships/build/build-snapshot';

/** The discriminator every local record carries. */
export const LOCAL_RECORD_FORMAT = 'edsb.local-record';

/**
 * The published record-envelope version.
 *
 * Version 2 adds `tool`. A version 1 record has no such field and its absence
 * means `"ship"`, which is the whole of the migration: version 1 was written
 * when there was one tool, and every record it wrote was that tool's
 * (013 contracts/loadout-persistence.md).
 */
export const LOCAL_RECORD_VERSION = 2;

/** Which tool made a record, and therefore what its payload is. */
export type RecordTool = 'ship' | 'equipment';

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
 * What both tools' records carry.
 *
 * The envelope is metadata about the save, not about what was saved: none of it
 * enters a build link, a loadout link or a SLEF export (persistence contract,
 * "Boundary exclusions").
 */
interface LocalRecordEnvelope {
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
  /** Present only on a working record opened or forked from a named one. */
  readonly sourceNamed: RecordSource | null;
}

/** One stored ship build, as a complete value under one key. */
export interface ShipRecord extends LocalRecordEnvelope {
  readonly tool: 'ship';
  /** Listing metadata. Always equals `build.shipSymbol`. */
  readonly hullSymbol: string;
  /** The package's verdict at this revision, not recomputed on read. */
  readonly validation: RecordValidation;
  readonly build: BuildSnapshotV1;
}

/** One stored on-foot loadout, as a complete value under one key. */
export interface EquipmentRecord extends LocalRecordEnvelope {
  readonly tool: 'equipment';
  /** Listing metadata. Always equals `loadout.suitFamily`. */
  readonly suitFamily: string;
  readonly loadout: StoredLoadoutV1;
}

/**
 * One record, whichever tool wrote it.
 *
 * Both kinds live in one key space, under one prefix, with one retention rule
 * and one lock protocol. A second prefix would mean feature 001's quota,
 * expiry and cross-tab rules implemented twice (persistence contract, "What
 * this feature may not do").
 */
export type LocalRecord = ShipRecord | EquipmentRecord;

/** A record listed but not openable, and why. */
export type UnavailableReason = 'unsupported-version' | 'malformed';

/**
 * One entry in a listing: either a record, or an honest account of one.
 *
 * The unavailable variant carries what could be read **without guessing**. A
 * record whose envelope decoded far enough to name its tool says so; one that
 * did not says nothing rather than assuming the tool a reader is looking at.
 */
export type StoredRecordEntry =
  | { readonly available: true; readonly record: LocalRecord }
  | {
      readonly available: false;
      readonly id: string;
      readonly reason: UnavailableReason;
      /** The tool, when the envelope said which. */
      readonly tool: RecordTool | null;
      /** The hull, when it can be read without guessing. */
      readonly hullSymbol: string | null;
      /** The suit, when it can be read without guessing. */
      readonly suitFamily: string | null;
      /** The name, when it can be read without guessing. */
      readonly name: string | null;
    };

/** Narrows a record to the ship tool's, for code that reads a build. */
export function isShipRecord(record: LocalRecord): record is ShipRecord {
  return record.tool === 'ship';
}

/** Narrows a record to the bench's, for code that reads a loadout. */
export function isEquipmentRecord(record: LocalRecord): record is EquipmentRecord {
  return record.tool === 'equipment';
}
