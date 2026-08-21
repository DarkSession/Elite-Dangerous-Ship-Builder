import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { PRE_ENGINEERED_MODULES } from '@elite-dangerous-almanac/core/ships/pre-engineered';
import { FIXED_REWARD_REGRESSION, fixedRewardBuild } from '../outfitting/outfitting.fixtures';
import { reconstructFromSnapshot } from './build-snapshot.reconstructor';
import { toBuildSnapshotV1 } from './build-snapshot.serializer';

describe('build snapshot serializer', () => {
  it('captures the hull and every fitted module in package slot order', () => {
    const loadout = ShipLoadout.default('Anaconda');

    const snapshot = toBuildSnapshotV1(loadout);

    expect(snapshot.format).toBe('edsb.build');
    expect(snapshot.version).toBe(1);
    expect(snapshot.shipSymbol).toBe('Anaconda');
    expect(snapshot.modules.map((module) => module.slot)).toEqual(
      loadout
        .slots()
        .filter((slot) => slot.module !== null)
        .map((slot) => slot.key),
    );
  });

  it('keeps the package’s own identity spelling rather than normalising it', () => {
    const loadout = ShipLoadout.default('Empire_Trader');
    const snapshot = toBuildSnapshotV1(loadout);

    expect(snapshot.shipSymbol).toBe('Empire_Trader');
    // Exactly what the package returned, including the mixed casing a loadout
    // event would have lower-cased — and including the one catalogue entry the
    // package itself spells in lower case.
    expect(snapshot.modules.map((module) => module.symbol)).toEqual(
      loadout
        .slots()
        .filter((slot) => slot.module !== null)
        .map((slot) => slot.module!.symbol),
    );
    expect(snapshot.modules.some((module) => /[A-Z]/.test(module.symbol))).toBe(true);
  });

  it('emits no derived, calculated or catalogue field', () => {
    const snapshot = toBuildSnapshotV1(ShipLoadout.default('Anaconda'));
    const serialized = JSON.stringify(snapshot);

    for (const forbidden of [
      'HullValue',
      'ModulesValue',
      'Rebuy',
      'UnladenMass',
      'CargoCapacity',
      'MaxJumpRange',
      'FuelCapacity',
      'Health',
      'Value',
      'timestamp',
      'validation',
      'name',
      'note',
    ]) {
      expect(serialized).not.toContain(`"${forbidden}"`);
    }

    expect(Object.keys(snapshot).sort()).toEqual([
      'format',
      'modules',
      'shipIdent',
      'shipName',
      'shipSymbol',
      'version',
    ]);
    expect(Object.keys(snapshot.modules[0]!).sort()).toEqual([
      'enabled',
      'engineering',
      'preEngineered',
      'priority',
      'slot',
      'symbol',
    ]);
  });

  it('records an absent power field as absent and a false one as a decision', () => {
    const loadout = ShipLoadout.default('Anaconda');
    const fresh = toBuildSnapshotV1(loadout);
    expect(fresh.modules.every((module) => module.enabled === null)).toBe(true);

    loadout.setModuleEnabled('FrameShiftDrive', false);
    const edited = toBuildSnapshotV1(loadout);

    const drive = edited.modules.find((module) => module.slot === 'FrameShiftDrive');
    expect(drive?.enabled).toBe(false);
  });

  it('records a zero-based power priority as the package reports it', () => {
    const loadout = ShipLoadout.default('Anaconda');
    loadout.setModulePriority('FrameShiftDrive', 0);

    const drive = toBuildSnapshotV1(loadout).modules.find(
      (module) => module.slot === 'FrameShiftDrive',
    );

    expect(drive?.priority).toBe(0);
  });

  it('records ordinary engineering as identity and grade, never its modifiers', () => {
    const loadout = ShipLoadout.default('Anaconda');
    loadout.applyBlueprint('FrameShiftDrive', 'FSD_LongRange', {
      grade: 5,
      quality: 1,
      experimental: 'special_fsd_heavy',
    });

    const drive = toBuildSnapshotV1(loadout).modules.find(
      (module) => module.slot === 'FrameShiftDrive',
    );

    expect(drive?.engineering).toEqual({
      blueprint: 'FSD_LongRange',
      grade: 5,
      quality: 1,
      experimental: 'special_fsd_heavy',
    });
    expect(JSON.stringify(drive)).not.toContain('Modifiers');
    expect(JSON.stringify(drive)).not.toContain('OriginalValue');
  });

  it('records a pre-engineered article as its package identity tuple alone', () => {
    const variant = PRE_ENGINEERED_MODULES.find(
      (candidate) => candidate.acquisition !== 'mercenary',
    )!;
    const loadout = ShipLoadout.default('Anaconda');
    const slot = loadout
      .slots('hardpoint')
      .find((candidate) =>
        loadout.modulesForSlot(candidate.key).some((module) => module.symbol === variant.symbol),
      );
    expect(slot).toBeDefined();

    const module = loadout
      .modulesForSlot(slot!.key)
      .find((candidate) => candidate.symbol === variant.symbol)!;
    loadout.setModule(slot!.key, module);
    loadout.setPreEngineeredVariant(slot!.key, variant);

    const fitted = toBuildSnapshotV1(loadout).modules.find(
      (candidate) => candidate.slot === slot!.key,
    );

    expect(fitted?.preEngineered).toEqual({
      symbol: variant.symbol,
      blueprint: variant.blueprint,
      grade: variant.grade,
      acquisition: variant.acquisition,
      experimental: variant.experimental ?? null,
    });
    // The variant already says what its own engineering is, so the snapshot
    // does not repeat it as ordinary engineering.
    expect(fitted?.engineering).toBeNull();
  });

  it('carries a reward’s later experimental effect on its identity, not on top of it', () => {
    const build = fixedRewardBuild();
    const slot = FIXED_REWARD_REGRESSION.slot;
    const effect = build.availableExperimentalEffects(slot)[0]!;
    build.setExperimentalEffect(slot, effect);

    const fitted = toBuildSnapshotV1(build).modules.find((module) => module.slot === slot);

    expect(fitted?.preEngineered?.experimental).toBe(effect);
    // Not as ordinary engineering on top. The reward's blueprint is also an
    // ordinary recipe for this drive, so recording it there would rebuild as a
    // rolled blueprint rather than as the article the Commander owns.
    expect(fitted?.engineering).toBeNull();
  });

  it('rebuilds a reward that carries a later effect with its fixed block intact', () => {
    const build = fixedRewardBuild();
    const slot = FIXED_REWARD_REGRESSION.slot;
    const effect = build.availableExperimentalEffects(slot)[0]!;
    build.setExperimentalEffect(slot, effect);
    const edited = build.fittedModuleAt(slot);

    const rebuilt = reconstructFromSnapshot(toBuildSnapshotV1(build));

    expect(rebuilt.ok).toBe(true);
    const restored = rebuilt.ok ? rebuilt.loadout.fittedModuleAt(slot) : null;
    // All three at once, because losing any one of them is the same defect: the
    // article stops being the article (FR-012). Before this was recorded on the
    // identity, the round trip returned five package modifiers instead of six
    // and no `preEngineeredVariant` at all.
    expect(restored?.preEngineeredVariant?.acquisition).toBe(FIXED_REWARD_REGRESSION.acquisition);
    expect(restored?.engineering?.ExperimentalEffect).toBe(effect);
    expect(restored?.engineering?.Modifiers).toEqual(edited?.engineering?.Modifiers);
  });
});
