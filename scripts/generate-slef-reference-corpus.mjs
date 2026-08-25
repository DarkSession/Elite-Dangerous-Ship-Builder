import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { inspectSlef } from '@elite-dangerous-almanac/core/ships/slef';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/**
 * The reference corpus: what this application says a build looks like.
 *
 * Every artifact is produced by the same package call the application makes, so
 * the corpus is evidence about the shipped export rather than about a fixture
 * somebody wrote to look like one. An independent consumer that reads all of it
 * has read everything this application can emit.
 *
 * Nothing here reads a Commander's data or contacts another origin. The builds
 * are constructed from the installed Almanac release, the ship names are the
 * package's own identities, and the ship name and ident are literals chosen to
 * be obviously synthetic. The manifest hashes each artifact and the set, so a
 * compatibility record can name exactly what was tested (FR-006, SC-004).
 */

const CORPUS_VERSION = 1;

/** The same options the application freezes. A corpus of something else proves nothing. */
const SERIALIZATION = { moduleOrder: 'fitted', explicitPower: false, indent: 2 };

const defaultOutputDirectory = fileURLToPath(
  new URL('../specs/004-slef/validation/reference-corpus/', import.meta.url),
);
const outputDirectory = process.env.SLEF_CORPUS_OUTPUT_PATH ?? defaultOutputDirectory;

const applicationPackage = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const almanacPackage = JSON.parse(
  await readFile(
    new URL('../../package.json', import.meta.resolve('@elite-dangerous-almanac/core/ships/slef')),
    'utf8',
  ),
);

const header = {
  appName: applicationPackage.name,
  appVersion: applicationPackage.version,
};

const firstEngineerable = (loadout) =>
  loadout
    .fittedModules()
    .map((module) => module.slot)
    .find((slotKey) => loadout.availableBlueprints(slotKey).length > 0) ?? null;

/**
 * Each case is one property a consumer has to get right.
 *
 * They are deliberately small and deliberately boring: a consumer that fails on
 * one of these fails on every build a Commander would ever paste it.
 */
const CASES = [
  {
    id: 'stock-small-hull',
    describes: 'A stock hull, every fixed mount populated by the Almanac.',
    build: () => ShipLoadout.default('Sidewinder'),
  },
  {
    id: 'stock-large-hull',
    describes: 'The largest ordinary hull, stock, for a consumer’s slot handling.',
    build: () => ShipLoadout.default('Anaconda'),
  },
  {
    id: 'named-and-identified',
    describes: 'A ship name and ident, as a producer would carry them.',
    build: () => {
      // Both are set at construction, which is the only place the package
      // takes them. Obviously synthetic on purpose: a corpus carries no name
      // a person would recognise as theirs.
      const stock = ShipLoadout.default('Python').toLoadoutEvent();
      return ShipLoadout.fromLoadout({
        ...stock,
        ShipName: 'Reference Build',
        ShipIdent: 'REF-001',
      });
    },
  },
  {
    id: 'disabled-and-prioritised',
    describes: 'A module switched off and another at priority zero.',
    build: () => {
      const loadout = ShipLoadout.default('Anaconda');
      const [first, second] = loadout.fittedModules().map((module) => module.slot);
      if (first !== undefined) {
        loadout.setModuleEnabled(first, false);
      }
      if (second !== undefined) {
        loadout.setModulePriority(second, 0);
      }
      return loadout;
    },
  },
  {
    id: 'engineered-grade-five',
    describes: 'A completed grade-five roll, with the Almanac’s own modifiers.',
    build: () => {
      const loadout = ShipLoadout.default('Anaconda');
      const slotKey = firstEngineerable(loadout);
      if (slotKey === null) {
        throw new Error('The installed Almanac offers no blueprint for any fitted module.');
      }
      const [blueprint] = loadout.availableBlueprints(slotKey);
      loadout.applyBlueprint(slotKey, blueprint.blueprintSymbol, { grade: 5, quality: 1 });
      return loadout;
    },
  },
  {
    id: 'emptied-optional-mounts',
    describes: 'Every optional mount left empty, exported exactly as it is.',
    build: () => {
      const loadout = ShipLoadout.default('Anaconda');
      for (const slot of loadout.slots()) {
        if (slot.removable && slot.kind === 'optional') {
          loadout.removeModule(slot.key);
        }
      }
      return loadout;
    },
  },
];

const sha256 = (text) => createHash('sha256').update(text).digest('hex');

const artifacts = CASES.map((entry) => {
  const loadout = entry.build();
  const payload = loadout.toSlefString({ ...SERIALIZATION, header });

  // Generated and read back with the same package, so a corpus that this
  // application could not itself import never reaches disk.
  const inspection = inspectSlef(payload);
  if (inspection.entries.length !== 1 || inspection.diagnostics.length > 0) {
    throw new Error(`${entry.id} did not produce exactly one acceptable entry.`);
  }

  return {
    id: entry.id,
    describes: entry.describes,
    filename: `${entry.id}.slef.json`,
    ship: loadout.shipSymbol,
    modules: loadout.fittedModules().length,
    utf8Bytes: Buffer.byteLength(payload, 'utf8'),
    valid: loadout.validation().valid,
    complete: loadout.validation().complete,
    sha256: sha256(payload),
    payload,
  };
});

const manifest = {
  corpusVersion: CORPUS_VERSION,
  producer: header,
  almanacVersion: almanacPackage.version,
  serialization: SERIALIZATION,
  artifacts: artifacts.map(({ payload: _payload, ...rest }) => rest),
};
// The set's identity is the artifacts' identities, in a fixed order. A record
// that names this hash names exactly the bytes that were tested.
manifest.corpusHash = sha256(artifacts.map((artifact) => artifact.sha256).join('\n'));

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
for (const artifact of artifacts) {
  await writeFile(join(outputDirectory, artifact.filename), `${artifact.payload}\n`, 'utf8');
}
await writeFile(
  join(outputDirectory, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

const written = (await readdir(outputDirectory)).length;
process.stdout.write(
  `Wrote ${written} files to ${outputDirectory}\ncorpus ${CORPUS_VERSION} · ${manifest.corpusHash}\n`,
);
