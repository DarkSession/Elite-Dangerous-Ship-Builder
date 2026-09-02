import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { inspectSlef } from '@elite-dangerous-almanac/core/ships/slef';
import { generateSlefExportArtifact } from './slef-export';
import type { ActiveExportSnapshot } from './slef-export.models';
import { maxSlotBuild } from './testing/max-slot-fixture';

const METADATA = { appName: 'elite-dangerous-ship-builder', appVersion: '0.0.0' };

function snapshot(loadout: ShipLoadout, revision = 1): ActiveExportSnapshot {
  return { loadout, revision, canonicalLink: { kind: 'absent' } };
}

/** Everything the application models about a build, in one comparable shape. */
function modelledFields(build: ShipLoadout) {
  return {
    ship: build.shipSymbol.toLowerCase(),
    name: build.shipName,
    ident: build.shipIdent,
    modules: build.fittedModules().map((module) => ({
      slot: module.slot,
      symbol: module.symbol.toLowerCase(),
      engineering: module.engineering
        ? {
            blueprint: module.engineering.BlueprintName,
            level: module.engineering.Level,
            quality: module.engineering.Quality,
            effect: module.engineering.ExperimentalEffect ?? null,
          }
        : null,
      // Post-engineering integrity, which the package derives from the fitted
      // and engineered article rather than from any captured condition.
      integrity: module.effectiveStats?.integrity ?? null,
    })),
    validation: build.validation(),
  };
}

/**
 * Out and back, with nothing lost that the application models.
 *
 * The exclusions are the whole point of stating this as a contract rather than
 * a deep equality. Module order and identity, engineering identity and
 * completed quality, enabled state, priority, name, ident and the package's own
 * integrity figures must survive; identity casing, header text, whitespace and
 * recomputed top-level figures may be normalized by the package; and
 * capture-only fields are outside the application's model entirely
 * (export contract, "Round-trip contract").
 */
describe('export round trip', () => {
  it('reconstructs every modelled field from its own payload', () => {
    const original = maxSlotBuild();

    const first = generateSlefExportArtifact(snapshot(original), METADATA);
    const [entry] = inspectSlef(first.payload).entries;
    expect(entry).toBeDefined();
    if (entry === undefined) {
      return;
    }
    const rebuilt = ShipLoadout.fromLoadout(entry.data);

    expect(modelledFields(rebuilt)).toEqual(modelledFields(original));
  });

  it('is stable: a second export of the reconstruction is the same payload', () => {
    const original = maxSlotBuild();

    const first = generateSlefExportArtifact(snapshot(original), METADATA);
    const [entry] = inspectSlef(first.payload).entries;
    expect(entry).toBeDefined();
    if (entry === undefined) {
      return;
    }
    const second = generateSlefExportArtifact(
      snapshot(ShipLoadout.fromLoadout(entry.data)),
      METADATA,
    );

    expect(second.payload).toBe(first.payload);
    expect(second.moduleCount).toBe(first.moduleCount);
  });

  it('keeps module order, not just the module set', () => {
    const original = maxSlotBuild();
    const [entry] = inspectSlef(
      generateSlefExportArtifact(snapshot(original), METADATA).payload,
    ).entries;
    expect(entry).toBeDefined();
    if (entry === undefined) {
      return;
    }

    expect(entry.data.Modules.map((module) => module.Slot)).toEqual(
      original.fittedModules().map((module) => module.slot),
    );
  });

  it('keeps package-derived integrity, which is the fit and not a condition snapshot', () => {
    const original = ShipLoadout.fromLoadout({
      event: 'Loadout',
      Ship: 'Anaconda',
      // A capture that says this module is half broken. Integrity after the
      // round trip is what the fitted, engineered article gives — not this.
      Modules: [{ Slot: 'PowerPlant', Item: 'Int_Powerplant_Size8_Class1', Health: 0.5 }],
    });
    const [entry] = inspectSlef(
      generateSlefExportArtifact(snapshot(original), METADATA).payload,
    ).entries;
    expect(entry).toBeDefined();
    if (entry === undefined) {
      return;
    }

    const rebuilt = ShipLoadout.fromLoadout(entry.data);

    expect(rebuilt.fittedModuleAt('PowerPlant')?.effectiveStats?.integrity).toBe(
      original.fittedModuleAt('PowerPlant')?.effectiveStats?.integrity,
    );
  });

  it('carries no capture-only field into the application’s model', () => {
    const [entry] = inspectSlef(
      generateSlefExportArtifact(snapshot(maxSlotBuild()), METADATA).payload,
    ).entries;

    const data = entry?.data as unknown as Record<string, unknown> | undefined;
    expect(data?.['timestamp']).toBeUndefined();
    expect(data?.['ShipID']).toBeUndefined();
    expect(data?.['HullHealth']).toBeUndefined();
    expect(data?.['Hot']).toBeUndefined();
    for (const module of entry?.data.Modules ?? []) {
      const record = module as unknown as Record<string, unknown>;
      expect(record['AmmoInClip']).toBeUndefined();
      expect(record['AmmoInHopper']).toBeUndefined();
      expect(record['Engineer']).toBeUndefined();
      expect(record['EngineerID']).toBeUndefined();
      expect(record['BlueprintID']).toBeUndefined();
    }
  });
});
