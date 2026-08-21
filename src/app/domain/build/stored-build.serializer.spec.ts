import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { toBuildSnapshotV1 } from './build-snapshot.serializer';
import { parseLocalRecord } from './stored-build.parser';
import { serializeLocalRecord, toLocalRecord, type RecordDraft } from './stored-build.serializer';

function draft(overrides: Partial<RecordDraft> = {}): RecordDraft {
  return {
    id: 'record-1',
    kind: 'named',
    revisionId: 'revision-1',
    createdAt: '2026-01-02T03:04:05.000Z',
    modifiedAt: '2026-01-02T03:04:05.000Z',
    name: 'Anaconda explorer',
    note: 'Long-range fit.',
    validation: { valid: true, complete: true },
    build: toBuildSnapshotV1(ShipLoadout.default('Anaconda')),
    sourceNamed: null,
    ...overrides,
  };
}

describe('local record serializer', () => {
  it('produces exactly the envelope the parser reads back', () => {
    const result = parseLocalRecord(JSON.parse(serializeLocalRecord(draft())), 'record-1');

    expect(result.ok).toBe(true);
    expect(result.ok && result.record).toEqual(toLocalRecord(draft()));
  });

  it('takes the hull from the build, so the two cannot disagree', () => {
    const record = toLocalRecord(draft());

    expect(record.hullSymbol).toBe('Anaconda');
    expect(record.hullSymbol).toBe(record.build.shipSymbol);
  });

  it('stores only the envelope fields and the modelled build', () => {
    expect(Object.keys(toLocalRecord(draft())).sort()).toEqual(
      [
        'build',
        'createdAt',
        'hullSymbol',
        'id',
        'kind',
        'modifiedAt',
        'name',
        'note',
        'revisionId',
        'sourceNamed',
        'validation',
        'version',
        'format',
      ].sort(),
    );
  });

  it('cannot be made to store a calculated value, a price or a catalogue fact', () => {
    const contaminated = {
      ...toBuildSnapshotV1(ShipLoadout.default('Anaconda')),
      maxJumpRange: 42,
      hullValue: 146_969_450,
      manufacturer: 'Faulcon DeLacy',
    } as never;

    const stored = serializeLocalRecord(draft({ build: contaminated }));

    // The allowlist rebuilds the snapshot field by field, so nothing that
    // arrived alongside it survives.
    expect(stored).not.toContain('maxJumpRange');
    expect(stored).not.toContain('hullValue');
    expect(stored).not.toContain('manufacturer');
  });

  it('cannot be made to store an extra module field', () => {
    const build = toBuildSnapshotV1(ShipLoadout.default('Anaconda'));
    const contaminated = {
      ...build,
      modules: build.modules.map((module) => ({ ...module, health: 1, value: 12_345 })),
    } as never;

    const stored = serializeLocalRecord(draft({ build: contaminated }));

    expect(stored).not.toContain('"health"');
    expect(stored).not.toContain('"value"');
  });

  it('records the package’s verdict rather than recomputing one', () => {
    const record = toLocalRecord(draft({ validation: { valid: false, complete: false } }));

    expect(record.validation).toEqual({ valid: false, complete: false });
  });

  it('keeps the save provenance a fork leaves behind', () => {
    const record = toLocalRecord(
      draft({
        kind: 'working',
        name: null,
        sourceNamed: { recordId: 'named-1', baseRevisionId: 'revision-9' },
      }),
    );

    expect(record.sourceNamed).toEqual({ recordId: 'named-1', baseRevisionId: 'revision-9' });
  });
});
