import { parseBuildSnapshotV1 } from './build-snapshot.parser';
import {
  LOCAL_RECORD_FORMAT,
  LOCAL_RECORD_VERSION,
  type LocalRecordKind,
  type LocalRecordV1,
  type RecordSource,
  type RecordValidation,
  type UnavailableReason,
} from './stored-build';

export type RecordParseResult =
  | { readonly ok: true; readonly record: LocalRecordV1 }
  | {
      readonly ok: false;
      readonly reason: UnavailableReason;
      /** What went wrong, for a diagnostic rather than for a Commander. */
      readonly detail: string;
      /** Metadata safe to show without guessing, when there is any. */
      readonly hullSymbol: string | null;
      readonly name: string | null;
    };

/**
 * Reads one stored value as untrusted input.
 *
 * Bytes in a browser store are untrusted even when this application wrote
 * them: another version wrote some of them, another tab may be mid-write, and
 * a Commander can edit them by hand. Every field is checked before any of it
 * is believed.
 *
 * `expectedId` is the key's own suffix. A record whose embedded id disagrees
 * with the key it is stored under is not merely odd — it is the state a
 * half-finished rename or a hand edit leaves behind, and opening it would give
 * two keys the same identity.
 */
export function parseLocalRecord(value: unknown, expectedId: string): RecordParseResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return malformed('The stored value is not an object.');
  }

  const stored = value as Record<string, unknown>;

  if (stored['format'] !== LOCAL_RECORD_FORMAT) {
    return malformed('The value does not carry the local-record format marker.');
  }

  const version = stored['version'];
  if (version !== LOCAL_RECORD_VERSION) {
    if (typeof version === 'number' && version > LOCAL_RECORD_VERSION) {
      // Retained byte-for-byte and listed with whatever metadata reads safely,
      // because a newer version is a record this build is too old for — not a
      // broken one (persistence contract, "Version and migration behavior").
      return {
        ok: false,
        reason: 'unsupported-version',
        detail: `The record was written by version ${String(version)}.`,
        hullSymbol: readString(stored['hullSymbol']),
        name: readString(stored['name']),
      };
    }
    return malformed('The record version is not a supported value.');
  }

  const id = stored['id'];
  if (typeof id !== 'string' || id.length === 0) {
    return malformed('The record carries no identity.');
  }
  if (id !== expectedId) {
    return malformed(`The record's identity "${id}" does not match the key it is stored under.`);
  }

  const kind = stored['kind'];
  if (!isKind(kind)) {
    return malformed('The record does not say whether it is a working or a named save.');
  }

  const revisionId = stored['revisionId'];
  if (typeof revisionId !== 'string' || revisionId.length === 0) {
    return malformed('The record carries no revision.');
  }

  const createdAt = readInstant(stored['createdAt']);
  const modifiedAt = readInstant(stored['modifiedAt']);
  if (createdAt === null || modifiedAt === null) {
    return malformed('The record carries an unreadable timestamp.');
  }

  const name = stored['name'];
  const note = stored['note'];
  if (!isNullableString(name) || !isNullableString(note)) {
    return malformed('The record name or note is neither text nor absent.');
  }

  const validation = readValidation(stored['validation']);
  if (validation === null) {
    return malformed('The record carries no package validation result.');
  }

  const sourceNamed = readSource(stored['sourceNamed']);
  if (sourceNamed === undefined) {
    return malformed('The record’s save provenance is malformed.');
  }

  const snapshot = parseBuildSnapshotV1(stored['build']);
  if (!snapshot.ok) {
    return snapshot.failure === 'unsupported-version'
      ? {
          ok: false,
          reason: 'unsupported-version',
          detail: snapshot.reason,
          hullSymbol: readString(stored['hullSymbol']),
          name: readString(name),
        }
      : malformed(snapshot.reason);
  }

  const hullSymbol = stored['hullSymbol'];
  if (typeof hullSymbol !== 'string' || hullSymbol !== snapshot.snapshot.shipSymbol) {
    // The envelope's hull is what a listing shows without reconstructing the
    // build. If it disagrees with the build, one of them is a lie.
    return malformed('The record’s hull does not match the build it stores.');
  }

  return {
    ok: true,
    record: {
      format: LOCAL_RECORD_FORMAT,
      version: LOCAL_RECORD_VERSION,
      id,
      kind,
      revisionId,
      createdAt,
      modifiedAt,
      name: (name as string | null | undefined) ?? null,
      note: (note as string | null | undefined) ?? null,
      hullSymbol,
      validation,
      build: snapshot.snapshot,
      sourceNamed,
    },
  };
}

function malformed(detail: string): RecordParseResult {
  return { ok: false, reason: 'malformed', detail, hullSymbol: null, name: null };
}

function isKind(value: unknown): value is LocalRecordKind {
  return value === 'working' || value === 'named';
}

function isNullableString(value: unknown): boolean {
  return value === null || value === undefined || typeof value === 'string';
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** An instant is kept as its own text, and only if it actually parses. */
function readInstant(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }
  return Number.isNaN(Date.parse(value)) ? null : value;
}

function readValidation(value: unknown): RecordValidation | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const validation = value as Record<string, unknown>;
  if (typeof validation['valid'] !== 'boolean' || typeof validation['complete'] !== 'boolean') {
    return null;
  }
  return { valid: validation['valid'], complete: validation['complete'] };
}

/** `undefined` means malformed; `null` means genuinely absent. */
function readSource(value: unknown): RecordSource | null | undefined {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'object') {
    return undefined;
  }
  const source = value as Record<string, unknown>;
  if (typeof source['recordId'] !== 'string' || typeof source['baseRevisionId'] !== 'string') {
    return undefined;
  }
  return { recordId: source['recordId'], baseRevisionId: source['baseRevisionId'] };
}
