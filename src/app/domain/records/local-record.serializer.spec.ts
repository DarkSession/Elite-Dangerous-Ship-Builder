import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { EquipmentLoadout } from '../equipment/loadout-link/equipment-loadout';
import { toBuildSnapshotV1 } from '../ships/build/build-snapshot.serializer';
import { isEquipmentRecord, isShipRecord } from './local-record';
import { parseLocalRecord } from './local-record.parser';
import {
  serializeLocalRecord,
  toLocalRecord,
  type RecordDraft,
  type RecordPayload,
} from './local-record.serializer';

const SHIP: RecordPayload = {
  tool: 'ship',
  validation: { valid: true, complete: true },
  build: toBuildSnapshotV1(ShipLoadout.default('Anaconda')),
};

const LOADOUT: EquipmentLoadout = {
  suitFamily: 'tacticalsuit',
  suitGrade: 5,
  suitModifications: ['suit_increasedshieldregen', null, null, null],
  weapons: [
    {
      symbol: 'wpn_m_assaultrifle_plasma_fauto',
      grade: 3,
      modifications: [null, null, null, null],
    },
    null,
    null,
  ],
};

function draft(overrides: Partial<RecordDraft> = {}): RecordDraft {
  return {
    id: 'record-1',
    kind: 'named',
    revisionId: 'revision-1',
    createdAt: '2026-01-02T03:04:05.000Z',
    modifiedAt: '2026-01-02T03:04:05.000Z',
    name: 'Anaconda explorer',
    note: 'Long-range fit.',
    sourceNamed: null,
    payload: SHIP,
    ...overrides,
  };
}

/** The ship record a `draft()` writes, narrowed for the fields it owns. */
function shipRecord(overrides: Partial<RecordDraft> = {}) {
  const record = toLocalRecord(draft(overrides));
  if (!isShipRecord(record)) throw new Error('The draft did not produce a ship record.');
  return record;
}

describe('local record serializer', () => {
  it('produces exactly the envelope the parser reads back', () => {
    const result = parseLocalRecord(JSON.parse(serializeLocalRecord(draft())), 'record-1');

    expect(result.ok).toBe(true);
    expect(result.ok && result.record).toEqual(toLocalRecord(draft()));
  });

  it('takes the hull from the build, so the two cannot disagree', () => {
    const record = shipRecord();

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
        'tool',
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

    const stored = serializeLocalRecord(draft({ payload: { ...SHIP, build: contaminated } }));

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

    const stored = serializeLocalRecord(draft({ payload: { ...SHIP, build: contaminated } }));

    expect(stored).not.toContain('"health"');
    expect(stored).not.toContain('"value"');
  });

  it('records the package’s verdict rather than recomputing one', () => {
    const record = shipRecord({
      payload: { ...SHIP, validation: { valid: false, complete: false } },
    });

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

describe('a loadout in the same envelope', () => {
  const loadoutDraft = (overrides: Partial<RecordDraft> = {}): RecordDraft =>
    draft({
      name: 'Groundpounder',
      payload: { tool: 'equipment', loadout: LOADOUT },
      ...overrides,
    });

  it('says which tool wrote it, and carries the loadout instead of a build', () => {
    const record = toLocalRecord(loadoutDraft());
    if (!isEquipmentRecord(record)) throw new Error('The draft did not produce a loadout record.');

    expect(record.tool).toBe('equipment');
    expect(record.suitFamily).toBe('tacticalsuit');
    expect(record.loadout.suitGrade).toBe(5);
    expect(Object.keys(record).sort()).toEqual(
      [
        'createdAt',
        'format',
        'id',
        'kind',
        'loadout',
        'modifiedAt',
        'name',
        'note',
        'revisionId',
        'sourceNamed',
        'suitFamily',
        'tool',
        'version',
      ].sort(),
    );
  });

  it('keeps held content, because saving is not a way to lose a choice (FR-018a)', () => {
    // A weapon on the Dominator's second primary, saved while a Maverick is worn.
    const held: EquipmentLoadout = {
      ...LOADOUT,
      suitFamily: 'utilitysuit',
      suitGrade: 4,
      weapons: [
        null,
        {
          symbol: 'wpn_m_sniper_plasma_charged',
          grade: 2,
          modifications: [null, null, null, null],
        },
        null,
      ],
    };
    const stored = parseLocalRecord(
      JSON.parse(
        serializeLocalRecord(loadoutDraft({ payload: { tool: 'equipment', loadout: held } })),
      ),
      'record-1',
    );

    expect(stored.ok).toBe(true);
    expect(
      stored.ok && isEquipmentRecord(stored.record) && stored.record.loadout.weapons[1],
    ).toEqual({
      symbol: 'wpn_m_sniper_plasma_charged',
      grade: 2,
      modifications: [null, null, null, null],
    });
  });

  it('produces exactly the envelope the parser reads back', () => {
    const result = parseLocalRecord(JSON.parse(serializeLocalRecord(loadoutDraft())), 'record-1');

    expect(result.ok).toBe(true);
    expect(result.ok && result.record).toEqual(toLocalRecord(loadoutDraft()));
  });

  it('cannot be made to store a stated figure alongside the loadout', () => {
    const contaminated = { ...LOADOUT, shieldStrength: 33.8, materialUnits: 12 } as never;

    const stored = serializeLocalRecord(
      loadoutDraft({ payload: { tool: 'equipment', loadout: contaminated } }),
    );

    expect(stored).not.toContain('shieldStrength');
    expect(stored).not.toContain('materialUnits');
  });
});
