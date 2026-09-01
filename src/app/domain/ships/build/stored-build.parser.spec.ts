import {
  FIXTURE_IDS,
  MALFORMED_RECORD,
  NAMED_RECORD_V1,
  UNKNOWN_HULL_RECORD,
  UNSUPPORTED_NEWER_RECORD,
  WORKING_RECORD_V1,
} from './fixtures/records';
import { parseLocalRecord } from './stored-build.parser';

const parse = (raw: string, id: string) => {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    value = undefined;
  }
  return parseLocalRecord(value, id);
};

describe('local record parser', () => {
  it('reads a complete named record written by this version', () => {
    const result = parse(NAMED_RECORD_V1, FIXTURE_IDS.named);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.record).toMatchObject({
      id: FIXTURE_IDS.named,
      kind: 'named',
      name: 'Anaconda explorer',
      note: 'Long-range fit.',
      hullSymbol: 'Anaconda',
      validation: { valid: true, complete: true },
      sourceNamed: null,
    });
    expect(result.record.build.modules).toHaveLength(1);
  });

  it('reads a working record, including the provenance a fork leaves', () => {
    const result = parse(WORKING_RECORD_V1, FIXTURE_IDS.working);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.record.kind).toBe('working');
    expect(result.record.name).toBeNull();
    expect(result.record.sourceNamed).toEqual({
      recordId: FIXTURE_IDS.named,
      baseRevisionId: '22222222-2222-4222-8222-222222222222',
    });
  });

  it('keeps a newer version distinct from a broken one', () => {
    const newer = parse(UNSUPPORTED_NEWER_RECORD, FIXTURE_IDS.unsupported);

    expect(newer).toMatchObject({ ok: false, reason: 'unsupported-version' });
    // Metadata that reads safely is offered so a listing can name it, without
    // guessing at anything the newer format holds.
    expect(newer.ok === false && newer.hullSymbol).toBe('Anaconda');
    expect(newer.ok === false && newer.name).toBe('From the future');
  });

  it('reports unreadable bytes as malformed', () => {
    expect(parse(MALFORMED_RECORD, FIXTURE_IDS.named)).toMatchObject({
      ok: false,
      reason: 'malformed',
    });
  });

  it('refuses a record stored under a key it does not match', () => {
    const result = parse(NAMED_RECORD_V1, 'a-different-identity');

    expect(result).toMatchObject({ ok: false, reason: 'malformed' });
    expect(result.ok === false && result.detail).toContain('does not match the key');
  });

  it('refuses a value that carries another application’s format marker', () => {
    expect(parseLocalRecord({ format: 'someone.else', version: 1 }, 'id')).toMatchObject({
      ok: false,
      reason: 'malformed',
    });
  });

  it('refuses a record whose envelope hull disagrees with its build', () => {
    const record = JSON.parse(NAMED_RECORD_V1) as Record<string, unknown>;
    record['hullSymbol'] = 'SideWinder';

    expect(parseLocalRecord(record, FIXTURE_IDS.named)).toMatchObject({
      ok: false,
      reason: 'malformed',
    });
  });

  it('refuses a record with no kind, revision or validation result', () => {
    for (const field of ['kind', 'revisionId', 'validation']) {
      const record = JSON.parse(NAMED_RECORD_V1) as Record<string, unknown>;
      delete record[field];

      expect(parseLocalRecord(record, FIXTURE_IDS.named), field).toMatchObject({ ok: false });
    }
  });

  it('refuses an unreadable timestamp rather than substituting one', () => {
    const record = JSON.parse(NAMED_RECORD_V1) as Record<string, unknown>;
    record['modifiedAt'] = 'the day before yesterday';

    expect(parseLocalRecord(record, FIXTURE_IDS.named)).toMatchObject({ ok: false });
  });

  it('refuses a foreign value in the name, note or provenance', () => {
    for (const [field, value] of [
      ['name', 7],
      ['note', {}],
      ['sourceNamed', { recordId: 1 }],
    ] as const) {
      const record = JSON.parse(NAMED_RECORD_V1) as Record<string, unknown>;
      record[field] = value;

      expect(parseLocalRecord(record, FIXTURE_IDS.named), field).toMatchObject({ ok: false });
    }
  });

  it('accepts a record naming a hull the package does not carry, and leaves the refusal to reconstruction', () => {
    // Whether the Almanac carries the hull is not a question about the bytes.
    // The record decodes; opening it is what refuses (FR-014).
    expect(parse(UNKNOWN_HULL_RECORD, FIXTURE_IDS.unknownHull).ok).toBe(true);
  });

  it('requires the exact package validation booleans', () => {
    const record = JSON.parse(NAMED_RECORD_V1) as Record<string, unknown>;
    record['validation'] = { valid: 'yes', complete: true };

    expect(parseLocalRecord(record, FIXTURE_IDS.named)).toMatchObject({ ok: false });
  });
});
