import { PRE_ENGINEERED_MODULES } from '@elite-dangerous-almanac/core/ships/pre-engineered';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { SHIPS } from '@elite-dangerous-almanac/core/ships/ships';
import type { BuildSnapshotV1, SnapshotModuleV1 } from './build-snapshot';
import { reconstructFromSnapshot } from './build-snapshot.reconstructor';
import { toBuildSnapshotV1 } from './build-snapshot.serializer';

/** The mounts the package always populates, whatever a snapshot said about them. */
const FIXED_KINDS = ['armour', 'core', 'cargoHatch'] as const;

function fixedMountsPopulated(loadout: ShipLoadout): boolean {
  return FIXED_KINDS.every((kind) => loadout.slots(kind).every((slot) => slot.module !== null));
}

function withoutSlots(snapshot: BuildSnapshotV1, keys: readonly string[]): BuildSnapshotV1 {
  const excluded = new Set(keys.map((key) => key.toLowerCase()));
  return {
    ...snapshot,
    modules: snapshot.modules.filter((module) => !excluded.has(module.slot.toLowerCase())),
  };
}

describe('snapshot reconstruction', () => {
  it('round-trips a stock build back to the same modelled state', () => {
    const original = toBuildSnapshotV1(ShipLoadout.default('Anaconda'));

    const result = reconstructFromSnapshot(original);

    expect(result.ok).toBe(true);
    expect(result.ok && toBuildSnapshotV1(result.loadout)).toEqual(original);
  });

  it('round-trips ordinary engineering, ship name and ident', () => {
    const loadout = ShipLoadout.default('Anaconda');
    loadout.applyBlueprint('FrameShiftDrive', 'FSD_LongRange', {
      grade: 5,
      quality: 1,
      experimentalEffectSymbol: 'special_fsd_heavy',
    });
    loadout.setModuleEnabled('Radar', false);
    loadout.setModulePriority('Radar', 3);
    const original = toBuildSnapshotV1(loadout);

    const result = reconstructFromSnapshot(original);

    expect(result.ok && toBuildSnapshotV1(result.loadout)).toEqual(original);
  });

  it('round-trips a pre-engineered article from its identity alone', () => {
    const variant = PRE_ENGINEERED_MODULES.find((candidate) => candidate.experimentalEffectSymbol)!;
    const loadout = ShipLoadout.default('Anaconda');
    const slot = loadout
      .slots('hardpoint')
      .find((candidate) =>
        loadout.modulesForSlot(candidate.key).some((module) => module.symbol === variant.symbol),
      )!;
    const module = loadout
      .modulesForSlot(slot.key)
      .find((candidate) => candidate.symbol === variant.symbol)!;
    loadout.setModule(slot.key, module);
    loadout.setPreEngineeredVariant(slot.key, variant);
    const original = toBuildSnapshotV1(loadout);

    const result = reconstructFromSnapshot(original);

    expect(result.ok).toBe(true);
    expect(result.ok && toBuildSnapshotV1(result.loadout)).toEqual(original);
    expect(
      result.ok && result.loadout.fittedModuleAt(slot.key)?.preEngineeredVariant,
    ).not.toBeNull();
  });

  it('refuses an unknown hull without constructing anything', () => {
    const result = reconstructFromSnapshot({
      format: 'edsb.build',
      version: 1,
      shipSymbol: 'Nonexistent_Hull',
      shipName: null,
      shipIdent: null,
      modules: [],
    });

    expect(result).toMatchObject({ ok: false, failure: 'unknown-hull' });
    expect(result.ok === false && result.reason).toContain('Nonexistent_Hull');
  });

  it('refuses a pre-engineered identity the installed package does not carry', () => {
    const module: SnapshotModuleV1 = {
      slot: 'LargeHardpoint1',
      symbol: 'Hpt_PulseLaser_Fixed_Large',
      enabled: null,
      priority: null,
      preEngineered: {
        symbol: 'Hpt_PulseLaser_Fixed_Large',
        blueprint: 'Invented_Blueprint',
        grade: 5,
        acquisition: 'techBroker',
        experimental: null,
      },
      engineering: null,
    };

    const result = reconstructFromSnapshot({
      format: 'edsb.build',
      version: 1,
      shipSymbol: 'Anaconda',
      shipName: null,
      shipIdent: null,
      modules: [module],
    });

    expect(result).toMatchObject({ ok: false, failure: 'unknown-identity' });
  });

  it('refuses an ordinary blueprint the installed package does not carry', () => {
    const snapshot = toBuildSnapshotV1(ShipLoadout.default('Anaconda'));
    const broken: BuildSnapshotV1 = {
      ...snapshot,
      modules: snapshot.modules.map((module) =>
        module.slot === 'FrameShiftDrive'
          ? {
              ...module,
              engineering: {
                blueprint: 'Invented_Blueprint',
                grade: 5,
                quality: 1,
                experimental: null,
              },
            }
          : module,
      ),
    };

    expect(reconstructFromSnapshot(broken)).toMatchObject({ ok: false });
  });
});

describe('fixed mounts are the package’s to populate', () => {
  it('returns every fixed mount populated for a stock build of every installed hull', () => {
    for (const ship of SHIPS) {
      const result = reconstructFromSnapshot(toBuildSnapshotV1(ShipLoadout.default(ship.symbol)));

      expect(result.ok).toBe(true);
      expect(result.ok && fixedMountsPopulated(result.loadout)).toBe(true);
    }
  });

  it('populates a fixed mount the snapshot omitted, before the build is usable', () => {
    const complete = toBuildSnapshotV1(ShipLoadout.default('Anaconda'));
    const omitted = withoutSlots(complete, ['Armour', 'PowerPlant', 'CargoHatch']);
    expect(omitted.modules.length).toBeLessThan(complete.modules.length);

    const result = reconstructFromSnapshot(omitted);

    expect(result.ok).toBe(true);
    expect(result.ok && fixedMountsPopulated(result.loadout)).toBe(true);
  });

  it('populates a fixed mount whose stored entry is unusable', () => {
    const complete = toBuildSnapshotV1(ShipLoadout.default('Anaconda'));
    const unusable: BuildSnapshotV1 = {
      ...complete,
      modules: complete.modules.map((module) =>
        module.slot === 'Armour' ? { ...module, symbol: 'Sidewinder_Armour_Grade1' } : module,
      ),
    };

    const result = reconstructFromSnapshot(unusable);

    expect(result.ok).toBe(true);
    expect(result.ok && fixedMountsPopulated(result.loadout)).toBe(true);
  });

  it('attaches no repair or defaulting provenance to the resulting snapshot', () => {
    const omitted = withoutSlots(toBuildSnapshotV1(ShipLoadout.default('Anaconda')), ['Armour']);

    const result = reconstructFromSnapshot(omitted);
    const reserialized = result.ok ? toBuildSnapshotV1(result.loadout) : null;

    // The defaulted armour comes back as ordinary build state — no marker
    // saying it was ever missing, because that is not something the build
    // carries (FR-014).
    expect(JSON.stringify(reserialized)).not.toMatch(/repair|defaulted|sourceEmpty|provenance/i);
    expect(reserialized?.modules.some((module) => module.slot === 'Armour')).toBe(true);
    expect(Object.keys(reserialized!.modules[0]!).sort()).toEqual([
      'enabled',
      'engineering',
      'preEngineered',
      'priority',
      'slot',
      'symbol',
    ]);
  });
});
