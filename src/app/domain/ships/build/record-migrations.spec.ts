import {
  FIXTURE_IDS,
  LOADOUT_RECORD_V2,
  MALFORMED_RECORD,
  NAMED_RECORD_V1,
  NAMED_RECORD_V2,
  UNSUPPORTED_NEWER_RECORD,
  WORKING_RECORD_V1,
} from '../../records/fixtures/records';
import { isShipRecord } from '../../records/local-record';
import {
  RECORD_MIGRATIONS,
  SUPPORTED_RECORD_VERSIONS,
  decodeAndMigrate,
} from './record-migrations';

const decode = (raw: string, id: string) => {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    value = undefined;
  }
  return decodeAndMigrate(value, id);
};

describe('record migration registry', () => {
  it('publishes one step, version 1 to version 2, and no fictional version 0', () => {
    expect(SUPPORTED_RECORD_VERSIONS).toEqual([1, 2]);
    expect(RECORD_MIGRATIONS.map((migration) => [migration.from, migration.to])).toEqual([[1, 2]]);
    expect(RECORD_MIGRATIONS.some((migration) => migration.from === 0)).toBe(false);
  });

  it('opens a current record without migrating it', () => {
    expect(decode(NAMED_RECORD_V2, FIXTURE_IDS.named)).toMatchObject({ ok: true, migrated: false });
    expect(decode(LOADOUT_RECORD_V2, FIXTURE_IDS.loadout)).toMatchObject({
      ok: true,
      migrated: false,
    });
  });

  it('opens a version 1 record as a ship build, and says it was migrated', () => {
    const result = decode(NAMED_RECORD_V1, FIXTURE_IDS.named);

    expect(result).toMatchObject({ ok: true, migrated: true });
    if (!result.ok || !isShipRecord(result.record)) {
      throw new Error('A version 1 record did not migrate to a ship record.');
    }
    // The build is the build it always was. Nothing but the envelope moved.
    expect(result.record.tool).toBe('ship');
    expect(result.record.hullSymbol).toBe('Anaconda');
    expect(result.record.build.modules).toHaveLength(1);
    expect(result.record.name).toBe('Anaconda explorer');
  });

  it('carries a version 1 working record’s provenance through the migration', () => {
    const result = decode(WORKING_RECORD_V1, FIXTURE_IDS.working);

    expect(result).toMatchObject({ ok: true, migrated: true });
    expect(result.ok && result.record.kind).toBe('working');
    expect(result.ok && result.record.sourceNamed).toEqual({
      recordId: FIXTURE_IDS.named,
      baseRevisionId: '22222222-2222-4222-8222-222222222222',
    });
  });

  it('refuses a newer version rather than guessing at it', () => {
    expect(decode(UNSUPPORTED_NEWER_RECORD, FIXTURE_IDS.unsupported)).toMatchObject({
      ok: false,
      reason: 'unsupported-version',
    });
  });

  it('reports unreadable bytes as malformed', () => {
    expect(decode(MALFORMED_RECORD, FIXTURE_IDS.named)).toMatchObject({
      ok: false,
      reason: 'malformed',
    });
  });

  it('refuses an older version with no published way forward', () => {
    const older = { ...(JSON.parse(NAMED_RECORD_V1) as object), version: 0 };

    const result = decodeAndMigrate(older, FIXTURE_IDS.named);

    expect(result).toMatchObject({ ok: false, reason: 'malformed' });
    expect(result.ok === false && result.detail).toContain('No migration is published');
  });

  it('leaves a record it cannot migrate to be reported rather than rewritten', () => {
    // The step is pure and the parser decides afterwards: a version 1 record
    // whose build is malformed migrates to a version 2 shape and then fails to
    // parse, which is a refusal and not a rewrite.
    const broken = { ...(JSON.parse(NAMED_RECORD_V1) as object), build: { format: 'nonsense' } };

    expect(decodeAndMigrate(broken, FIXTURE_IDS.named)).toMatchObject({
      ok: false,
      reason: 'malformed',
    });
  });
});
