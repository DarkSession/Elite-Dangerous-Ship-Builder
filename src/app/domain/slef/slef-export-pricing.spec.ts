import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { inspectSlef } from '@elite-dangerous-almanac/core/ships/slef';
import type { LoadoutEvent } from '@elite-dangerous-almanac/core/ships/slef';
import { FIXTURE_HULL, FIXTURE_SLOTS } from '../outfitting/outfitting.fixtures';
import { generateSlefExportArtifact } from './slef-export';
import type { ActiveExportSnapshot } from './slef-export.models';

const METADATA = { appName: 'elite-dangerous-ship-builder', appVersion: '0.0.0' };

function snapshot(loadout: ShipLoadout): ActiveExportSnapshot {
  return { loadout, revision: 1, canonicalLink: { kind: 'absent' } };
}

function exported(loadout: ShipLoadout): LoadoutEvent | undefined {
  return inspectSlef(generateSlefExportArtifact(snapshot(loadout), METADATA).payload).entries[0]
    ?.data;
}

/**
 * A capture stating what its owner paid, which is never what an export quotes.
 *
 * The figures are deliberately absurd — a hull for one credit — so a test
 * asserting "not the captured value" cannot pass by coincidence.
 */
const CAPTURED_PURCHASE: LoadoutEvent = {
  event: 'Loadout',
  Ship: FIXTURE_HULL,
  HullValue: 1,
  ModulesValue: 2,
  Rebuy: 3,
  UnladenMass: 4,
  CargoCapacity: 5,
  MaxJumpRange: 6,
  FuelCapacity: { Main: 7, Reserve: 8 },
  Modules: [{ Slot: FIXTURE_SLOTS.core, Item: 'Int_Powerplant_Size8_Class1', Value: 9 }],
};

describe('export credit figures', () => {
  it('quotes the package’s current catalogue retail, not the capture’s purchase', () => {
    const captured = ShipLoadout.fromLoadout(CAPTURED_PURCHASE);
    // The same fit, with nothing said about what anybody paid for it. If the
    // export quoted the capture, these two would differ.
    const unpriced = ShipLoadout.fromLoadout({
      event: 'Loadout',
      Ship: FIXTURE_HULL,
      Modules: [{ Slot: FIXTURE_SLOTS.core, Item: 'Int_Powerplant_Size8_Class1' }],
    });

    const fromCapture = exported(captured);
    const fromNothing = exported(unpriced);

    expect(fromCapture?.HullValue).toBe(fromNothing?.HullValue);
    expect(fromCapture?.ModulesValue).toBe(fromNothing?.ModulesValue);
    expect(fromCapture?.Rebuy).toBe(fromNothing?.Rebuy);
    expect(fromCapture?.HullValue).not.toBe(1);
    expect(fromCapture?.ModulesValue).not.toBe(2);
    expect(fromCapture?.Rebuy).not.toBe(3);
    // The package still holds what the capture said; nothing here reads it as a
    // price (FR-005).
    expect(captured.hullValue).toBe(1);
  });

  it('leaves the package’s own source-purchase record untouched and unexported', () => {
    const build = ShipLoadout.fromLoadout(CAPTURED_PURCHASE);

    const data = exported(build);

    // The package still knows what the capture said. The export does not quote
    // it, and no application code reads it (FR-005).
    expect(build.sourcePurchase?.hullValue).toBe(1);
    expect(data?.Modules.find((module) => module.Slot === FIXTURE_SLOTS.core)?.Value).not.toBe(9);
  });

  it('reprices after an edit rather than staling on the capture', () => {
    const build = ShipLoadout.fromLoadout(CAPTURED_PURCHASE);
    const before = exported(build)?.ModulesValue;

    const [replacement] = build.modulesForSlot(FIXTURE_SLOTS.core).slice(-1);
    expect(replacement).toBeDefined();
    if (replacement === undefined) {
      return;
    }
    build.setModule(FIXTURE_SLOTS.core, replacement);

    expect(exported(build)?.ModulesValue).not.toBe(before);
  });

  it('prices a package-defaulted fixed mount as part of the resulting build', () => {
    // The source named no modules at all; every fixed mount is the package's
    // own default, and every one of them is priced in the export.
    const build = ShipLoadout.fromLoadout({ event: 'Loadout', Ship: FIXTURE_HULL, Modules: [] });

    const data = exported(build);

    expect(data?.Modules.length).toBe(build.fittedModules().length);
    expect(data?.ModulesValue).toBeGreaterThan(0);
  });

  it('recomputes the derived figures rather than echoing the source claims', () => {
    const build = ShipLoadout.fromLoadout(CAPTURED_PURCHASE);

    const data = exported(build);

    expect(data?.CargoCapacity).toBe(build.cargoCapacity);
    expect(data?.FuelCapacity).toEqual({
      Main: build.fuelCapacity.main,
      Reserve: build.fuelCapacity.reserve,
    });
    expect(data?.UnladenMass).not.toBe(4);
    expect(data?.CargoCapacity).not.toBe(5);
    expect(data?.MaxJumpRange).not.toBe(6);
  });

  it('reports an unavailable figure as absent, never as zero', () => {
    const build = ShipLoadout.default(FIXTURE_HULL);

    const data = exported(build);

    for (const [key, value] of Object.entries(data ?? {})) {
      if (value === 0) {
        // A real zero — an empty cargo hold — is a figure, not an absence. What
        // must never happen is an *unavailable* figure arriving as one, which
        // is what the package's own null-versus-zero contract decides.
        expect(['CargoCapacity']).toContain(key);
      }
    }
  });
});
