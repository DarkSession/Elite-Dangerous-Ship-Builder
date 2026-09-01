import { parseLocalRecord, type RecordParseResult } from './stored-build.parser';
import { LOCAL_RECORD_VERSION, type LocalRecordV1 } from './stored-build';

/**
 * The migration registry.
 *
 * Version 1 is the first published version, so there is nothing to migrate
 * *from* yet — and deliberately no fictional version 0 to pretend otherwise. A
 * migration that exists only to be symmetrical is a migration nobody has ever
 * run against real bytes.
 *
 * When a version 2 lands, it arrives as one entry here: a frozen decoder for
 * version 1's shape and a pure function to the next canonical model. Decoders
 * are never removed, because a Commander's browser may hold a record written
 * years ago and every published version must still open (FR-014).
 */

/** One step from a published version to the next. */
export interface RecordMigration {
  readonly from: number;
  readonly to: number;
  /** Pure: it reads one canonical model and returns the next. */
  readonly migrate: (record: unknown) => unknown;
}

/** Every published migration, in order. Empty until a version 2 exists. */
export const RECORD_MIGRATIONS: readonly RecordMigration[] = [];

/** The versions this build can open, newest last. */
export const SUPPORTED_RECORD_VERSIONS: readonly number[] = [LOCAL_RECORD_VERSION];

export type MigrationResult =
  | { readonly ok: true; readonly record: LocalRecordV1; readonly migrated: boolean }
  | {
      readonly ok: false;
      readonly reason: 'unsupported-version' | 'malformed';
      readonly detail: string;
      readonly hullSymbol: string | null;
      readonly name: string | null;
    };

/**
 * Decodes a stored value, migrating it forward if it needs it.
 *
 * The result says whether anything was actually migrated, because that decides
 * whether the record's own key is rewritten — and a rewrite that was not
 * needed is a write that could fail for no reason.
 */
export function decodeAndMigrate(value: unknown, expectedId: string): MigrationResult {
  const version = readVersion(value);

  if (version !== null && version < LOCAL_RECORD_VERSION) {
    const migrated = applyMigrations(value, version);
    if (!migrated.ok) {
      return {
        ok: false,
        reason: 'malformed',
        detail: migrated.detail,
        hullSymbol: null,
        name: null,
      };
    }
    return finish(parseLocalRecord(migrated.value, expectedId), true);
  }

  return finish(parseLocalRecord(value, expectedId), false);
}

function finish(parsed: RecordParseResult, migrated: boolean): MigrationResult {
  return parsed.ok
    ? { ok: true, record: parsed.record, migrated }
    : {
        ok: false,
        reason: parsed.reason,
        detail: parsed.detail,
        hullSymbol: parsed.hullSymbol,
        name: parsed.name,
      };
}

function applyMigrations(
  value: unknown,
  from: number,
): { ok: true; value: unknown } | { ok: false; detail: string } {
  let current = value;
  let version = from;

  while (version < LOCAL_RECORD_VERSION) {
    const step = RECORD_MIGRATIONS.find((migration) => migration.from === version);
    if (step === undefined) {
      // A version between two published ones with no way forward is a gap in
      // the registry, not something to improvise around.
      return { ok: false, detail: `No migration is published from version ${version}.` };
    }
    try {
      current = step.migrate(current);
    } catch (error) {
      return {
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
    version = step.to;
  }

  return { ok: true, value: current };
}

function readVersion(value: unknown): number | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const version = (value as Record<string, unknown>)['version'];
  return typeof version === 'number' && Number.isInteger(version) ? version : null;
}
