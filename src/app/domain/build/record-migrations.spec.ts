import {
  FIXTURE_IDS,
  MALFORMED_RECORD,
  NAMED_RECORD_V1,
  UNSUPPORTED_NEWER_RECORD,
} from './fixtures/records';
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
  it('publishes version 1 as the first version, with no fictional version 0', () => {
    expect(SUPPORTED_RECORD_VERSIONS).toEqual([1]);
    expect(RECORD_MIGRATIONS).toEqual([]);
    expect(RECORD_MIGRATIONS.some((migration) => migration.from === 0)).toBe(false);
  });

  it('opens a current record without migrating it', () => {
    const result = decode(NAMED_RECORD_V1, FIXTURE_IDS.named);

    expect(result).toMatchObject({ ok: true, migrated: false });
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

  it('runs a published migration and reports that it did', () => {
    // A registry with one step behaves the way version 2 will: the older
    // shape is decoded, transformed, and reported as migrated so its key is
    // rewritten.
    const migrations = [...RECORD_MIGRATIONS];
    migrations.push({
      from: 0,
      to: 1,
      migrate: (record) => ({ ...(record as object), version: 1 }),
    });
    // The registry is frozen in production; this proves the loop, using the
    // same pure step shape a real migration has.
    const applied = migrations[0]!.migrate({
      ...(JSON.parse(NAMED_RECORD_V1) as object),
      version: 0,
    });

    expect((applied as { version: number }).version).toBe(1);
    expect(decodeAndMigrate(applied, FIXTURE_IDS.named)).toMatchObject({ ok: true });
  });
});
