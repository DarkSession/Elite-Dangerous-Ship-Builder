import { parseLocalRecord, type RecordParseResult } from '../../records/local-record.parser';
import {
  LOCAL_RECORD_VERSION,
  type LocalRecord,
  type RecordTool,
} from '../../records/local-record';

/**
 * The migration registry.
 *
 * One published step: version 1 to version 2, which stamps the `tool` field
 * version 1 had no room for. Version 1 was written when the application had one
 * tool, so every record it wrote was a ship build and the absence of the field
 * means exactly that (013 contracts/loadout-persistence.md).
 *
 * Decoders are never removed, because a Commander's browser may hold a record
 * written years ago and every published version must still open (001/FR-014).
 * A migration is pure: it reads one canonical shape and returns the next, and
 * whether the result is *valid* is the parser's question, asked afterwards.
 */

/** One step from a published version to the next. */
export interface RecordMigration {
  readonly from: number;
  readonly to: number;
  /** Pure: it reads one canonical model and returns the next. */
  readonly migrate: (record: unknown) => unknown;
}

/** Every published migration, in order. */
export const RECORD_MIGRATIONS: readonly RecordMigration[] = [
  {
    from: 1,
    to: 2,
    migrate: (record) => ({
      ...(record as object),
      version: 2,
      // Stamped rather than inferred later: a record that goes through this
      // step comes out saying what it is, so nothing downstream has to know
      // that a missing field once meant something.
      tool: 'ship' satisfies RecordTool,
    }),
  },
];

/** The versions this build can open, newest last. */
export const SUPPORTED_RECORD_VERSIONS: readonly number[] = [1, LOCAL_RECORD_VERSION];

export type MigrationResult =
  | { readonly ok: true; readonly record: LocalRecord; readonly migrated: boolean }
  | {
      readonly ok: false;
      readonly reason: 'unsupported-version' | 'malformed';
      readonly detail: string;
      readonly tool: RecordTool | null;
      readonly hullSymbol: string | null;
      readonly suitFamily: string | null;
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
        tool: null,
        hullSymbol: null,
        suitFamily: null,
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
        tool: parsed.tool,
        hullSymbol: parsed.hullSymbol,
        suitFamily: parsed.suitFamily,
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
