import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { inspectSlef } from '@elite-dangerous-almanac/core/ships/slef';
import { FIXTURE_HULL, FIXTURE_SLOTS } from '../outfitting/outfitting.fixtures';
import { exportHeader, generateSlefExportArtifact, linkOmissionReason } from './slef-export';
import {
  SLEF_EXPORT_FILENAME,
  SLEF_EXPORT_MIME_TYPE,
  type ActiveExportSnapshot,
  type CanonicalLink,
} from './slef-export.models';

const METADATA = { appName: 'elite-dangerous-ship-builder', appVersion: '0.0.0' };

function snapshot(
  loadout: ShipLoadout,
  canonicalLink: CanonicalLink = { kind: 'absent' },
  revision = 7,
): ActiveExportSnapshot {
  return { loadout, revision, canonicalLink };
}

/** A build carrying every supported modelled field a round trip must preserve. */
function fullyStatedBuild(): ShipLoadout {
  const build = ShipLoadout.fromLoadout({
    event: 'Loadout',
    Ship: FIXTURE_HULL,
    ShipName: 'Pacifier',
    ShipIdent: 'FD-11X',
    Modules: [],
  });
  build.applyBlueprint(FIXTURE_SLOTS.thrusters, 'Engine_Dirty', {
    grade: 5,
    quality: 1,
    experimental: 'special_engine_cooled',
  });
  build.setModuleEnabled(FIXTURE_SLOTS.cargoHatch, false);
  build.setModulePriority(FIXTURE_SLOTS.cargoHatch, 0);
  return build;
}

describe('generateSlefExportArtifact', () => {
  it('calls the package exactly once, with the frozen options and the build header', () => {
    const build = ShipLoadout.default(FIXTURE_HULL);
    const toSlefString = vi.spyOn(build, 'toSlefString');

    generateSlefExportArtifact(snapshot(build), METADATA);

    expect(toSlefString).toHaveBeenCalledTimes(1);
    expect(toSlefString).toHaveBeenCalledWith({
      moduleOrder: 'fitted',
      explicitPower: false,
      indent: 2,
      header: { appName: 'elite-dangerous-ship-builder', appVersion: '0.0.0' },
    });
  });

  it('produces a payload that inspects as exactly one entry with no diagnostics', () => {
    const artifact = generateSlefExportArtifact(snapshot(fullyStatedBuild()), METADATA);

    const inspected = inspectSlef(artifact.payload);
    expect(inspected.entries).toHaveLength(1);
    expect(inspected.diagnostics).toHaveLength(0);
  });

  it('preserves a false enabled state, priority zero, ship name and ident', () => {
    const artifact = generateSlefExportArtifact(snapshot(fullyStatedBuild()), METADATA);
    const [entry] = inspectSlef(artifact.payload).entries;

    const hatch = entry?.data.Modules.find((module) => module.Slot === FIXTURE_SLOTS.cargoHatch);
    expect(hatch?.On).toBe(false);
    expect(hatch?.Priority).toBe(0);
    expect(entry?.data.ShipName).toBe('Pacifier');
    expect(entry?.data.ShipIdent).toBe('FD-11X');
  });

  it('preserves ordinary pre-engineering with its effect', () => {
    const artifact = generateSlefExportArtifact(snapshot(fullyStatedBuild()), METADATA);
    const [entry] = inspectSlef(artifact.payload).entries;

    const thrusters = entry?.data.Modules.find((module) => module.Slot === FIXTURE_SLOTS.thrusters);
    expect(thrusters?.Engineering?.BlueprintName).toBe('Engine_Dirty');
    expect(thrusters?.Engineering?.Quality).toBe(1);
    expect(thrusters?.Engineering?.ExperimentalEffect).toBe('special_engine_cooled');
  });

  it('hands back the package string byte for byte', () => {
    const build = fullyStatedBuild();
    const expected = build.toSlefString({
      moduleOrder: 'fitted',
      explicitPower: false,
      indent: 2,
      header: { appName: METADATA.appName, appVersion: METADATA.appVersion },
    });

    expect(generateSlefExportArtifact(snapshot(build), METADATA).payload).toBe(expected);
  });

  it('measures its own bytes and counts the package’s own fitted modules', () => {
    const build = fullyStatedBuild();
    const artifact = generateSlefExportArtifact(snapshot(build), METADATA);

    expect(artifact.utf8Bytes).toBe(new TextEncoder().encode(artifact.payload).byteLength);
    expect(artifact.moduleCount).toBe(build.fittedModules().length);
  });

  it('carries the fixed filename, MIME type and the revision it describes', () => {
    const artifact = generateSlefExportArtifact(snapshot(fullyStatedBuild()), METADATA);

    expect(artifact.filename).toBe(SLEF_EXPORT_FILENAME);
    expect(artifact.mimeType).toBe(SLEF_EXPORT_MIME_TYPE);
    expect(artifact.revision).toBe(7);
    expect(artifact.filename).not.toContain('Pacifier');
    expect(artifact.filename).not.toContain(FIXTURE_HULL);
  });

  it('is immutable once generated', () => {
    expect(
      Object.isFrozen(generateSlefExportArtifact(snapshot(fullyStatedBuild()), METADATA)),
    ).toBe(true);
  });

  it('discloses an invalid or incomplete build without withholding the payload', () => {
    const build = ShipLoadout.default(FIXTURE_HULL);
    build.removeModule(FIXTURE_SLOTS.fittedOptional);

    const artifact = generateSlefExportArtifact(snapshot(build), METADATA);

    expect(artifact.validation).toEqual(build.validation);
    expect(artifact.payload.length).toBeGreaterThan(0);
  });
});

describe('the appURL rule', () => {
  it('includes a link certified for exactly this revision', () => {
    const link: CanonicalLink = { kind: 'certified', url: 'https://example.test/build#abc' };

    expect(exportHeader(link, METADATA).appURL).toBe('https://example.test/build#abc');
    expect(linkOmissionReason(link)).toBeNull();
  });

  it.each(['absent', 'pending', 'refused', 'stale'] as const)(
    'omits the link and says why when it is %s',
    (kind) => {
      const artifact = generateSlefExportArtifact(
        snapshot(ShipLoadout.default(FIXTURE_HULL), { kind }),
        METADATA,
      );

      expect(artifact.header.appURL).toBeUndefined();
      expect(artifact.linkOmission).toBe(kind);
      expect(inspectSlef(artifact.payload).entries[0]?.header.appURL).toBeUndefined();
    },
  );

  it('is still a complete export when the link is omitted', () => {
    const artifact = generateSlefExportArtifact(
      snapshot(fullyStatedBuild(), { kind: 'refused' }),
      METADATA,
    );

    const inspected = inspectSlef(artifact.payload);
    expect(inspected.entries).toHaveLength(1);
    expect(inspected.diagnostics).toHaveLength(0);
    expect(inspected.entries[0]?.data.ShipName).toBe('Pacifier');
  });
});
