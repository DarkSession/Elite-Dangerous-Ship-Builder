import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { FIXTURE_SLOTS, defaultBuild, fixedRewardVariant } from '../outfitting/outfitting.fixtures';
import { captureCheckpoint, restoreCheckpoint, sameCheckpoint } from './modeled-build-checkpoint';

/**
 * A checkpoint restores decisions, and only decisions.
 *
 * The two properties that make undo trustworthy are proved here: what goes in
 * comes back exactly, and what was never a decision — a price, a calculated
 * figure — does not come back at all because it was never carried.
 */

describe('modelled build checkpoint', () => {
  it('round-trips every modelled field, including sparse power state', () => {
    const build = defaultBuild();
    build.setModulePriority(FIXTURE_SLOTS.core, 4);
    build.setModuleEnabled(FIXTURE_SLOTS.cargoHatch, false);
    // `LifeSupport` is left entirely alone, so its power fields stay absent.
    // Absence is a modelled state of its own and has to survive the trip.
    build.applyBlueprint(FIXTURE_SLOTS.thrusters, 'Engine_Dirty', { grade: 4, quality: 1 });
    build.setPreEngineeredVariant(FIXTURE_SLOTS.frameShiftDrive, fixedRewardVariant());

    const checkpoint = captureCheckpoint(build);
    const restored = restoreCheckpoint(checkpoint);

    expect(restored.ok).toBe(true);
    if (!restored.ok) {
      return;
    }
    expect(sameCheckpoint(captureCheckpoint(restored.loadout), checkpoint)).toBe(true);

    const lifeSupport = checkpoint.snapshot.modules.find((module) => module.slot === 'LifeSupport');
    expect(lifeSupport?.enabled).toBeNull();
    expect(lifeSupport?.priority).toBeNull();

    const hatch = restored.loadout.fittedModuleAt(FIXTURE_SLOTS.cargoHatch);
    expect(hatch?.on).toBe(false);
    expect(restored.loadout.fittedModuleAt(FIXTURE_SLOTS.core)?.priority).toBe(4);
  });

  it('restores the ship name and ident, and their absence', () => {
    const named = ShipLoadout.fromLoadout({
      event: 'Loadout',
      Ship: 'Anaconda',
      ShipName: 'Pacifier',
      ShipIdent: 'FD-11X',
      Modules: [],
    });

    const restored = restoreCheckpoint(captureCheckpoint(named));
    expect(restored.ok).toBe(true);
    if (!restored.ok) {
      return;
    }
    expect(restored.loadout.shipName).toBe('Pacifier');
    expect(restored.loadout.shipIdent).toBe('FD-11X');

    const anonymous = restoreCheckpoint({
      snapshot: { ...captureCheckpoint(named).snapshot, shipName: null, shipIdent: null },
    });
    expect(anonymous.ok).toBe(true);
    if (!anonymous.ok) {
      return;
    }
    // Cleared to absence, not to an empty string: the two are different builds.
    expect(anonymous.loadout.shipName).toBeNull();
    expect(anonymous.loadout.shipIdent).toBeNull();
  });

  it('keeps ordinary engineering and an identified variant apart', () => {
    const build = defaultBuild();
    build.setPreEngineeredVariant(FIXTURE_SLOTS.frameShiftDrive, fixedRewardVariant());

    const checkpoint = captureCheckpoint(build);
    const drive = checkpoint.snapshot.modules.find(
      (module) => module.slot === FIXTURE_SLOTS.frameShiftDrive,
    );

    // The variant identity is recorded; its implied blueprint and grade are not
    // recorded a second time as ordinary engineering.
    expect(drive?.preEngineered?.acquisition).toBe('techBroker');
    expect(drive?.engineering).toBeNull();

    const restored = restoreCheckpoint(checkpoint);
    expect(restored.ok).toBe(true);
    if (!restored.ok) {
      return;
    }
    expect(
      restored.loadout.fittedModuleAt(FIXTURE_SLOTS.frameShiftDrive)?.preEngineeredVariant
        ?.acquisition,
    ).toBe('techBroker');
  });

  it('carries no purchase value and recomputes the current catalogue cost', () => {
    const build = defaultBuild();
    const checkpoint = captureCheckpoint(build);

    const serialized = JSON.stringify(checkpoint);
    expect(serialized).not.toContain('"Value"');
    expect(serialized).not.toContain('sourcePurchase');

    const restored = restoreCheckpoint(checkpoint);
    expect(restored.ok).toBe(true);
    if (!restored.ok) {
      return;
    }
    expect(restored.loadout.buildCost().credits).toEqual(build.buildCost().credits);
  });

  it('blocks on an impossible restore rather than returning a near miss', () => {
    const checkpoint = captureCheckpoint(defaultBuild());
    const impossible = restoreCheckpoint({
      snapshot: { ...checkpoint.snapshot, shipSymbol: 'Nonexistent_Hull' },
    });

    expect(impossible.ok).toBe(false);
    if (impossible.ok) {
      return;
    }
    expect(impossible.failure).toBe('unknown-hull');
    expect(impossible.reason).toContain('Nonexistent_Hull');
  });
});
