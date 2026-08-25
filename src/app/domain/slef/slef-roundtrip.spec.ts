import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { generateSlefExportArtifact } from './slef-export';
import type { ActiveExportSnapshot } from './slef-export.models';
import { importSlef } from './slef-import';
import { maxSlotBuild, withNameAndIdent } from './testing/max-slot-fixture';

const METADATA = { appName: 'elite-dangerous-ship-builder', appVersion: '0.0.0' };

function snapshot(loadout: ShipLoadout, revision = 1): ActiveExportSnapshot {
  return { loadout, revision, canonicalLink: { kind: 'absent' } };
}

/** Everything the application models, including the state the export contract names. */
function modelled(build: ShipLoadout) {
  return {
    // The hull is compared exactly. The payload names it in journal case, the
    // ingress gate resolves it back to the package's own symbol, and a build
    // that came back spelling it any other way is a build whose artwork and
    // schematics point at a directory no host serves.
    ship: build.shipSymbol,
    name: build.shipName,
    ident: build.shipIdent,
    modules: build.fittedModules().map((module) => ({
      slot: module.slot,
      // Module identities stay case-insensitive here, unlike the hull: the
      // package's serializer lower-cases every `Item` on the way out and
      // nothing at the ingress gate resolves them back, so their casing is
      // outside what this round trip asserts. Not a statement that casing
      // never matters for a module — `isFittedChoice` does compare one
      // exactly, which is a separate defect this exclusion does not settle.
      symbol: module.symbol.toLowerCase(),
      on: module.on,
      priority: module.priority,

      engineering: module.engineering
        ? {
            blueprint: module.engineering.BlueprintName,
            level: module.engineering.Level,
            quality: module.engineering.Quality,
            effect: module.engineering.ExperimentalEffect ?? null,
          }
        : null,
      integrity: module.effectiveStats?.integrity ?? null,
    })),
    validation: build.validation(),
  };
}

/** Exports a build, imports the payload back, and returns what came back. */
function outAndBack(build: ShipLoadout): ShipLoadout {
  const artifact = generateSlefExportArtifact(snapshot(build), METADATA);
  const result = importSlef(artifact.payload, 1);
  if (!result.ok) {
    throw new Error(`the application refused its own export: ${result.failure.kind}`);
  }
  return result.candidate.loadout;
}

/**
 * Out through the export and back in through the import, with nothing lost.
 *
 * The export suite proves the payload reconstructs through the package. This
 * proves the whole capability closes on itself: what this application writes,
 * this application reads, through the same gate an EDSY or Coriolis payload
 * comes through — byte limit, inspector, cardinality rule, ingress normalizer
 * and all (SC-002).
 *
 * Every exclusion is stated rather than assumed. Module identity casing,
 * header text and whitespace belong to the package's serializer; completed
 * quality and package-defaulted fixed mounts are the two normalizations the
 * constitution names; capture-only fields are outside the application's model
 * entirely.
 *
 * The hull is not on that list. This trip re-enters through the ingress gate,
 * which resolves the payload's journal case back to the package's own symbol,
 * so it is compared exactly. The export suite reconstructs straight from the
 * payload and still folds it — the same fact seen from the other side.
 */
describe('the whole round trip', () => {
  it('reads its own export back as the same build', () => {
    const original = withNameAndIdent(maxSlotBuild());

    const rebuilt = outAndBack(original);

    expect(modelled(rebuilt)).toEqual(modelled(original));
  });

  it('is stable: the second trip changes nothing the first did not', () => {
    const original = withNameAndIdent(maxSlotBuild());

    const once = outAndBack(original);
    const twice = outAndBack(once);

    expect(generateSlefExportArtifact(snapshot(twice), METADATA).payload).toBe(
      generateSlefExportArtifact(snapshot(once), METADATA).payload,
    );
  });

  it('keeps a disabled module disabled and a zero priority at zero', () => {
    const original = withNameAndIdent(maxSlotBuild());
    const [first] = original.fittedModules();
    expect(first?.on).toBe(false);
    expect(first?.priority).toBe(0);

    const rebuilt = outAndBack(original);
    const returned = rebuilt.fittedModuleAt(first?.slot ?? '');

    // Both are falsy, and both are the sort of value a serializer drops if it
    // treats "false" and "0" as "absent".
    expect(returned?.on).toBe(false);
    expect(returned?.priority).toBe(0);
  });

  it('keeps the ship’s name and ident, which are the Commander’s own text', () => {
    const original = withNameAndIdent(maxSlotBuild());
    expect(original.shipName).not.toBeNull();

    const rebuilt = outAndBack(original);

    expect(rebuilt.shipName).toBe(original.shipName);
    expect(rebuilt.shipIdent).toBe(original.shipIdent);
  });

  it('keeps every engineered recipe, grade, quality and effect', () => {
    const original = withNameAndIdent(maxSlotBuild());
    const engineered = original.fittedModules().filter((module) => module.engineering !== null);
    expect(engineered.length).toBeGreaterThan(0);

    const rebuilt = outAndBack(original);

    for (const module of engineered) {
      expect(rebuilt.fittedModuleAt(module.slot)?.engineering).toEqual(module.engineering);
    }
  });

  it('fills a fixed mount the payload omitted, without inventing anything else', () => {
    const original = ShipLoadout.default('Anaconda');
    const artifact = generateSlefExportArtifact(snapshot(original), METADATA);
    // A payload with no modules at all: every fixed mount is absent from it.
    const stripped = artifact.payload.replace(/"Modules":\s*\[[\s\S]*?\n {6}\]/, '"Modules": []');

    const result = importSlef(stripped, 1);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    for (const slot of result.candidate.loadout.slots()) {
      if (!slot.removable) {
        expect(result.candidate.loadout.fittedModuleAt(slot.key)).not.toBeNull();
      }
    }
  });

  it('is unaffected by capture-only fields the payload happens to carry', () => {
    const original = withNameAndIdent(maxSlotBuild());
    const artifact = generateSlefExportArtifact(snapshot(original), METADATA);
    // A journal writes these; the application models none of them, so their
    // presence must change neither acceptance nor a single modelled field.
    const withCapture = artifact.payload.replace(
      '"event": "Loadout"',
      '"event": "Loadout", "timestamp": "3311-01-01T00:00:00Z", "ShipID": 7, "Hot": false',
    );

    const result = importSlef(withCapture, 1);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(modelled(result.candidate.loadout)).toEqual(modelled(original));
  });
});
