import {
  FIXTURE_IDS,
  LOADOUT_RECORD_V2,
  MALFORMED_RECORD,
  NAMED_RECORD_V2,
  UNKNOWN_SUIT_RECORD,
  UNSUPPORTED_NEWER_RECORD,
} from './fixtures/records';
import { isEquipmentRecord, isShipRecord } from './local-record';
import { parseLocalRecord } from './local-record.parser';

/**
 * The parser reads the current version and nothing else.
 *
 * A version 1 record reaches it through `decodeAndMigrate`, which is where the
 * frozen version 1 fixtures are exercised (`local-record.spec.ts`). Here every
 * fixture is version 2, so a failure is about the bytes rather than about which
 * version wrote them.
 */

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
    const result = parse(NAMED_RECORD_V2, FIXTURE_IDS.named);

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
    expect(result.ok && isShipRecord(result.record) && result.record.build.modules).toHaveLength(1);
  });

  it('reads a loadout record, and says which tool wrote it', () => {
    const result = parse(LOADOUT_RECORD_V2, FIXTURE_IDS.loadout);

    expect(result.ok).toBe(true);
    if (!result.ok || !isEquipmentRecord(result.record)) {
      throw new Error('The loadout fixture did not read back as a loadout record.');
    }
    expect(result.record).toMatchObject({
      tool: 'equipment',
      name: 'Silent Entry',
      suitFamily: 'utilitysuit',
    });
    // Held content: a Maverick carries one primary, and the second is retained.
    expect(result.record.loadout.weapons[1]).toEqual({
      symbol: 'wpn_m_sniper_plasma_charged',
      grade: 2,
      modifications: [null, null, null, null],
    });
  });

  it('refuses a loadout record whose envelope suit disagrees with its loadout', () => {
    const record = JSON.parse(LOADOUT_RECORD_V2) as Record<string, unknown>;
    record['suitFamily'] = 'tacticalsuit';

    expect(parseLocalRecord(record, FIXTURE_IDS.loadout)).toMatchObject({
      ok: false,
      reason: 'malformed',
    });
  });

  it('refuses a record that does not say which tool wrote it', () => {
    const record = JSON.parse(NAMED_RECORD_V2) as Record<string, unknown>;
    record['tool'] = 'telescope';

    expect(parseLocalRecord(record, FIXTURE_IDS.named)).toMatchObject({
      ok: false,
      reason: 'malformed',
    });
  });

  it('reads a version 2 record with no tool field as the ship tool', () => {
    // Version 1 had one tool, and a hand-edited version 2 that dropped the
    // field means what version 1 meant rather than nothing.
    const record = JSON.parse(NAMED_RECORD_V2) as Record<string, unknown>;
    delete record['tool'];

    const result = parseLocalRecord(record, FIXTURE_IDS.named);
    expect(result.ok && result.record.tool).toBe('ship');
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
    const result = parse(NAMED_RECORD_V2, 'a-different-identity');

    expect(result).toMatchObject({ ok: false, reason: 'malformed' });
    expect(result.ok === false && result.detail).toContain('does not match the key');
  });

  it('refuses a value that carries another application’s format marker', () => {
    expect(parseLocalRecord({ format: 'someone.else', version: 2 }, 'id')).toMatchObject({
      ok: false,
      reason: 'malformed',
    });
  });

  it('refuses a record whose envelope hull disagrees with its build', () => {
    const record = JSON.parse(NAMED_RECORD_V2) as Record<string, unknown>;
    record['hullSymbol'] = 'SideWinder';

    expect(parseLocalRecord(record, FIXTURE_IDS.named)).toMatchObject({
      ok: false,
      reason: 'malformed',
    });
  });

  it('refuses a record with no kind, revision or validation result', () => {
    for (const field of ['kind', 'revisionId', 'validation']) {
      const record = JSON.parse(NAMED_RECORD_V2) as Record<string, unknown>;
      delete record[field];

      expect(parseLocalRecord(record, FIXTURE_IDS.named), field).toMatchObject({ ok: false });
    }
  });

  it('refuses an unreadable timestamp rather than substituting one', () => {
    const record = JSON.parse(NAMED_RECORD_V2) as Record<string, unknown>;
    record['modifiedAt'] = 'the day before yesterday';

    expect(parseLocalRecord(record, FIXTURE_IDS.named)).toMatchObject({ ok: false });
  });

  it('refuses a foreign value in the name, note or provenance', () => {
    for (const [field, value] of [
      ['name', 7],
      ['note', {}],
      ['sourceNamed', { recordId: 1 }],
    ] as const) {
      const record = JSON.parse(NAMED_RECORD_V2) as Record<string, unknown>;
      record[field] = value;

      expect(parseLocalRecord(record, FIXTURE_IDS.named), field).toMatchObject({ ok: false });
    }
  });

  it('accepts a record naming a suit the package does not carry, and leaves the refusal to reconstruction', () => {
    // Whether the Almanac carries the suit is not a question about the bytes.
    // The record decodes; opening it is what refuses (FR-019).
    expect(parse(UNKNOWN_SUIT_RECORD, FIXTURE_IDS.unknownSuit).ok).toBe(true);
  });

  it('requires the exact package validation booleans', () => {
    const record = JSON.parse(NAMED_RECORD_V2) as Record<string, unknown>;
    record['validation'] = { valid: 'yes', complete: true };

    expect(parseLocalRecord(record, FIXTURE_IDS.named)).toMatchObject({ ok: false });
  });
});
