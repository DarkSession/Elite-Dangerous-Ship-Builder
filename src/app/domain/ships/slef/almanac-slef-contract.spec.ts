import { getSlefDiagnosticMessage } from '@elite-dangerous-almanac/core/i18n/diagnostics';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { inspectSlef } from '@elite-dangerous-almanac/core/ships/slef';
import type { LoadoutEvent, SlefEntry } from '@elite-dangerous-almanac/core/ships/slef';
import {
  FIXTURE_HULL,
  FIXTURE_SLOTS,
  SUPPORTED_PARTIAL_QUALITY,
  SUPPORTED_PARTIAL_SOURCE_QUALITY,
  UNSUPPORTED_PARTIAL_QUALITY,
} from '../outfitting/outfitting.fixtures';

/**
 * What the installed Almanac promises the SLEF boundary, written down.
 *
 * This suite tests the *package*, not this application. Everything feature 004
 * composes — tolerant inspection, entry cardinality, the exact diagnostic
 * shape, unknown-hull refusal, package-populated fixed mounts, quality
 * completion and one-entry serialization — is a promise the package makes, and
 * constitution II says a broken promise is fixed upstream rather than patched
 * here. Characterizing them means a release that changes one fails *here*, by
 * name, instead of surfacing as a symptom three layers downstream.
 */

/** A minimal well-formed entry the package accepts whole. */
function validEntry(): SlefEntry {
  return {
    header: { appName: 'Reference', appVersion: '1.0.0' },
    data: { event: 'Loadout', Ship: 'sidewinder', Modules: [] },
  };
}

/** An entry the package rejects, for the diagnostic shape. */
const REJECTED_ENTRY = { header: {}, data: {} };

describe('installed Almanac SLEF contract', () => {
  describe('inspectSlef cardinality', () => {
    it('reads one envelope object as one observed entry', () => {
      const result = inspectSlef(validEntry());

      expect(result.entries).toHaveLength(1);
      expect(result.diagnostics).toHaveLength(0);
    });

    it('reads a one-element array as one observed entry', () => {
      const result = inspectSlef([validEntry()]);

      expect(result.entries).toHaveLength(1);
      expect(result.diagnostics).toHaveLength(0);
    });

    it('reads a bare journal Loadout event as one entry with a synthetic header', () => {
      const result = inspectSlef(validEntry().data);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]?.header).toEqual({ appName: '', appVersion: '' });
    });

    it('reads a JSON string exactly as it reads the parsed value', () => {
      const result = inspectSlef(JSON.stringify([validEntry()]));

      expect(result.entries).toHaveLength(1);
      expect(result.diagnostics).toHaveLength(0);
    });

    it('reads an empty array as zero observed entries', () => {
      const result = inspectSlef([]);

      expect(result.entries).toHaveLength(0);
      expect(result.diagnostics).toHaveLength(0);
    });

    it('reads mixed input as one valid entry plus one indexed diagnostic', () => {
      const result = inspectSlef([validEntry(), REJECTED_ENTRY]);

      expect(result.entries).toHaveLength(1);
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0]?.index).toBe(1);
    });

    it('throws a SyntaxError for a string that is not JSON', () => {
      expect(() => inspectSlef('{ not json')).toThrow(SyntaxError);
    });
  });

  describe('diagnostics', () => {
    it('carries a frozen index, path, code, constraint, message and params', () => {
      const [diagnostic] = inspectSlef([REJECTED_ENTRY]).diagnostics;

      expect(diagnostic).toBeDefined();
      if (diagnostic === undefined) {
        return;
      }
      expect(Object.isFrozen(diagnostic)).toBe(true);
      expect(diagnostic.index).toBe(0);
      expect(typeof diagnostic.path).toBe('string');
      expect(diagnostic.path.length).toBeGreaterThan(0);
      expect(typeof diagnostic.code).toBe('string');
      expect(typeof diagnostic.constraint).toBe('string');
      expect(typeof diagnostic.message).toBe('string');
      expect(diagnostic.params).toBeDefined();
    });

    it('answers English canonically and every other locale with null', () => {
      const [diagnostic] = inspectSlef([REJECTED_ENTRY]).diagnostics;

      expect(diagnostic).toBeDefined();
      if (diagnostic === undefined) {
        return;
      }
      expect(getSlefDiagnosticMessage(diagnostic, 'en')).toBe(diagnostic.message);
      expect(getSlefDiagnosticMessage(diagnostic, 'de')).toBeNull();
    });
  });

  describe('construction from an inspected entry', () => {
    it('refuses an unknown hull', () => {
      expect(() => ShipLoadout.fromLoadout({ Ship: 'Nonexistent_Hull', Modules: [] })).toThrow(
        TypeError,
      );
    });

    it('returns every fixed mount populated when the source named none', () => {
      const built = ShipLoadout.fromLoadout({ event: 'Loadout', Ship: FIXTURE_HULL, Modules: [] });

      for (const slot of built.slots()) {
        if (slot.removable) {
          continue;
        }
        expect(built.fittedModuleAt(slot.key)).not.toBeNull();
      }
    });
  });

  describe('completeEngineeringGrade', () => {
    it('normalizes a partial roll the package can identify', () => {
      const built = ShipLoadout.fromLoadout(SUPPORTED_PARTIAL_QUALITY);

      const result = built.completeEngineeringGrade(FIXTURE_SLOTS.thrusters);

      expect(result.kind).toBe('normalized');
      if (result.kind !== 'normalized') {
        return;
      }
      expect(result.previousQuality).toBeCloseTo(SUPPORTED_PARTIAL_SOURCE_QUALITY, 5);
      expect(result.quality).toBe(1);
    });

    it('refuses a partial roll it cannot identify, with a stable code', () => {
      const built = ShipLoadout.fromLoadout(UNSUPPORTED_PARTIAL_QUALITY);

      const result = built.completeEngineeringGrade(FIXTURE_SLOTS.frameShiftDrive);

      expect(result.kind).toBe('unsupported');
      if (result.kind !== 'unsupported') {
        return;
      }
      expect(typeof result.code).toBe('string');
      expect(result.params).toBeDefined();
    });

    it('refuses an unengineered module rather than answering unchanged', () => {
      // Why the ingress gate asks only about rolls it actually read a partial
      // quality from: a stock module is `unsupported`/`notEngineered`, and
      // asking about one would refuse a build with nothing wrong with it.
      const result = ShipLoadout.default(FIXTURE_HULL).completeEngineeringGrade(
        FIXTURE_SLOTS.thrusters,
      );

      expect(result.kind).toBe('unsupported');
      if (result.kind !== 'unsupported') {
        return;
      }
      expect(result.code).toBe('notEngineered');
    });
  });

  describe('toSlefString', () => {
    it('emits exactly one entry that inspects back with no diagnostics', () => {
      const built = ShipLoadout.default(FIXTURE_HULL);

      const payload = built.toSlefString({
        header: { appName: 'Reference', appVersion: '1.0.0' },
        moduleOrder: 'fitted',
        explicitPower: false,
        indent: 2,
      });

      const inspected = inspectSlef(payload);
      expect(inspected.entries).toHaveLength(1);
      expect(inspected.diagnostics).toHaveLength(0);
      expect(inspected.entries[0]?.header).toMatchObject({
        appName: 'Reference',
        appVersion: '1.0.0',
      });
    });

    it('writes the header appURL only when one is given', () => {
      const built = ShipLoadout.default(FIXTURE_HULL);

      const without = inspectSlef(
        built.toSlefString({ header: { appName: 'Reference', appVersion: '1.0.0' }, indent: 2 }),
      );
      const with_ = inspectSlef(
        built.toSlefString({
          header: { appName: 'Reference', appVersion: '1.0.0', appURL: 'https://example.test/#a' },
          indent: 2,
        }),
      );

      expect(without.entries[0]?.header.appURL).toBeUndefined();
      expect(with_.entries[0]?.header.appURL).toBe('https://example.test/#a');
    });

    it('quotes current catalogue retail rather than any captured purchase value', () => {
      const captured: LoadoutEvent = {
        event: 'Loadout',
        Ship: FIXTURE_HULL,
        HullValue: 1,
        ModulesValue: 2,
        Rebuy: 3,
        Modules: [{ Slot: FIXTURE_SLOTS.core, Item: 'Int_Powerplant_Size8_Class1', Value: 4 }],
      };
      const built = ShipLoadout.fromLoadout(captured);

      const entry = inspectSlef(
        built.toSlefString({ header: { appName: 'Reference', appVersion: '1.0.0' }, indent: 2 }),
      ).entries[0];

      expect(entry?.data.HullValue).not.toBe(1);
      expect(entry?.data.ModulesValue).not.toBe(2);
      expect(entry?.data.Rebuy).not.toBe(3);
      expect(built.sourcePurchase?.hullValue).toBe(1);
    });

    it('drops the capture-only timestamp and ship instance, and carries Health through', () => {
      const built = ShipLoadout.fromLoadout({
        event: 'Loadout',
        Ship: FIXTURE_HULL,
        Modules: [{ Slot: FIXTURE_SLOTS.core, Item: 'Int_Powerplant_Size8_Class1', Health: 0.5 }],
      } as LoadoutEvent);

      const entry = inspectSlef(
        built.toSlefString({ header: { appName: 'Reference', appVersion: '1.0.0' }, indent: 2 }),
      ).entries[0];

      const data = entry?.data as unknown as Record<string, unknown> | undefined;
      expect(data?.['timestamp']).toBeUndefined();
      expect(data?.['ShipID']).toBeUndefined();
      // The package *does* carry a per-module `Health` through. The
      // application models nothing from it either way, which is why its
      // presence or omission cannot change acceptance or round-trip equality
      // (spec, "Edge Cases").
      expect(entry?.data.Modules.find((module) => module.Slot === FIXTURE_SLOTS.core)?.Health).toBe(
        0.5,
      );
    });

    it('preserves a false enabled state, priority zero, name and ident', () => {
      const built = ShipLoadout.fromLoadout({
        event: 'Loadout',
        Ship: FIXTURE_HULL,
        ShipName: 'Pacifier',
        ShipIdent: 'FD-11X',
        Modules: [],
      });
      built.setModuleEnabled(FIXTURE_SLOTS.cargoHatch, false);
      built.setModulePriority(FIXTURE_SLOTS.cargoHatch, 0);

      const entry = inspectSlef(
        built.toSlefString({
          header: { appName: 'Reference', appVersion: '1.0.0' },
          moduleOrder: 'fitted',
          explicitPower: false,
          indent: 2,
        }),
      ).entries[0];

      const hatch = entry?.data.Modules.find((module) => module.Slot === FIXTURE_SLOTS.cargoHatch);
      expect(hatch?.On).toBe(false);
      expect(hatch?.Priority).toBe(0);
      expect(entry?.data.ShipName).toBe('Pacifier');
      expect(entry?.data.ShipIdent).toBe('FD-11X');
    });
  });
});
