import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { parseBuildSnapshotV1 } from './build-snapshot.parser';
import { toBuildSnapshotV1 } from './build-snapshot.serializer';

function stored(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    format: 'ednb.build',
    version: 1,
    shipSymbol: 'Anaconda',
    shipName: null,
    shipIdent: null,
    modules: [],
    ...overrides,
  };
}

function moduleEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    slot: 'FrameShiftDrive',
    symbol: 'Int_Hyperdrive_Size5_Class5',
    enabled: null,
    priority: null,
    preEngineered: null,
    engineering: null,
    ...overrides,
  };
}

describe('build snapshot parser', () => {
  it('accepts what the serializer produced, unchanged', () => {
    const snapshot = toBuildSnapshotV1(ShipLoadout.default('Anaconda'));

    const result = parseBuildSnapshotV1(JSON.parse(JSON.stringify(snapshot)));

    expect(result.ok).toBe(true);
    expect(result.ok && result.snapshot).toEqual(snapshot);
  });

  it('refuses a value that is not an object', () => {
    for (const value of [null, undefined, 42, 'ednb.build', []]) {
      expect(parseBuildSnapshotV1(value)).toMatchObject({ ok: false, failure: 'malformed' });
    }
  });

  it('refuses a value carrying another format marker', () => {
    expect(parseBuildSnapshotV1(stored({ format: 'someone.else' }))).toMatchObject({
      ok: false,
      failure: 'malformed',
    });
  });

  it('distinguishes a newer version from a malformed one', () => {
    expect(parseBuildSnapshotV1(stored({ version: 2 }))).toMatchObject({
      ok: false,
      failure: 'unsupported-version',
    });
    expect(parseBuildSnapshotV1(stored({ version: 'one' }))).toMatchObject({
      ok: false,
      failure: 'malformed',
    });
  });

  it('refuses a snapshot naming no hull', () => {
    expect(parseBuildSnapshotV1(stored({ shipSymbol: '' }))).toMatchObject({ ok: false });
    expect(parseBuildSnapshotV1(stored({ shipSymbol: 7 }))).toMatchObject({ ok: false });
  });

  it('refuses a ship label that is neither a string nor absent', () => {
    expect(parseBuildSnapshotV1(stored({ shipName: 7 }))).toMatchObject({ ok: false });
  });

  it('keeps an empty ship name distinct from an absent one', () => {
    const empty = parseBuildSnapshotV1(stored({ shipName: '' }));
    const absent = parseBuildSnapshotV1(stored({ shipName: null }));

    expect(empty.ok && empty.snapshot.shipName).toBe('');
    expect(absent.ok && absent.snapshot.shipName).toBeNull();
  });

  it('refuses a missing module list', () => {
    expect(parseBuildSnapshotV1(stored({ modules: 'none' }))).toMatchObject({ ok: false });
  });

  it('refuses two modules claiming the same slot, whatever the casing', () => {
    const result = parseBuildSnapshotV1(
      stored({
        modules: [moduleEntry(), moduleEntry({ slot: 'frameshiftdrive' })],
      }),
    );

    expect(result).toMatchObject({ ok: false, failure: 'malformed' });
    expect(result.ok === false && result.reason).toContain('frameshiftdrive');
  });

  it('refuses a power priority outside the game’s own range', () => {
    for (const priority of [-1, 5, 1.5, '2']) {
      expect(parseBuildSnapshotV1(stored({ modules: [moduleEntry({ priority })] }))).toMatchObject({
        ok: false,
      });
    }
    expect(parseBuildSnapshotV1(stored({ modules: [moduleEntry({ priority: 0 })] })).ok).toBe(true);
    expect(parseBuildSnapshotV1(stored({ modules: [moduleEntry({ priority: 4 })] })).ok).toBe(true);
  });

  it('refuses an enabled state that is not a boolean or absent', () => {
    expect(
      parseBuildSnapshotV1(stored({ modules: [moduleEntry({ enabled: 'on' })] })),
    ).toMatchObject({ ok: false });
    expect(parseBuildSnapshotV1(stored({ modules: [moduleEntry({ enabled: false })] })).ok).toBe(
      true,
    );
  });

  it('refuses an incomplete pre-engineered identity', () => {
    const identity = {
      symbol: 'Hpt_Railgun_Fixed_Medium',
      blueprint: 'RailGun_LongShot',
      grade: 1,
      acquisition: 'techBroker',
      experimental: null,
    };

    expect(
      parseBuildSnapshotV1(stored({ modules: [moduleEntry({ preEngineered: identity })] })).ok,
    ).toBe(true);

    for (const broken of [
      { ...identity, symbol: '' },
      { ...identity, blueprint: 7 },
      { ...identity, acquisition: null },
      { ...identity, grade: 0 },
      { ...identity, grade: 6 },
      { ...identity, experimental: 7 },
      'not an object',
    ]) {
      expect(
        parseBuildSnapshotV1(stored({ modules: [moduleEntry({ preEngineered: broken })] })),
      ).toMatchObject({ ok: false });
    }
  });

  it('refuses engineering outside the grade and quality bounds', () => {
    const engineering = {
      blueprint: 'FSD_LongRange',
      grade: 5,
      quality: 1,
      experimental: null,
    };

    expect(parseBuildSnapshotV1(stored({ modules: [moduleEntry({ engineering })] })).ok).toBe(true);

    for (const broken of [
      { ...engineering, grade: 6 },
      { ...engineering, grade: 0 },
      { ...engineering, quality: 1.5 },
      { ...engineering, quality: -0.1 },
      { ...engineering, quality: Number.NaN },
      { ...engineering, blueprint: 7 },
      { ...engineering, experimental: 7 },
      42,
    ]) {
      expect(
        parseBuildSnapshotV1(stored({ modules: [moduleEntry({ engineering: broken })] })),
      ).toMatchObject({ ok: false });
    }
  });

  it('refuses a module entry with no slot or no symbol', () => {
    expect(parseBuildSnapshotV1(stored({ modules: [{ symbol: 'x' }] }))).toMatchObject({
      ok: false,
    });
    expect(parseBuildSnapshotV1(stored({ modules: [{ slot: 'PowerPlant' }] }))).toMatchObject({
      ok: false,
    });
    expect(parseBuildSnapshotV1(stored({ modules: ['PowerPlant'] }))).toMatchObject({ ok: false });
  });
});
