#!/usr/bin/env node
/**
 * Repository policy checks for feature 008's own source.
 *
 * How far a build jumps, how fast it flies and what it weighs are package
 * answers this application shows and does not have. Every rule here is about a
 * way that could stop being true without anything failing: a second call site
 * would still return a plausible range, a subtraction of two package masses
 * would still print a headroom, a withdrawn capacity would still format to a
 * tonnage, and a deep import would still compile. None of them can be a type or
 * a unit test — a rule proven by the absence of a line has no call site to
 * test. Exit code 0 means every rule passed; a violation prints its file, line
 * and reason.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

/** The one place that may ask the package about jump, mobility or mass. */
export const PROJECTION = 'src/app/domain/mobility-jump';

/** Feature 008's own source. The import rule applies inside these. */
export const OWNED = [
  PROJECTION,
  'src/app/features/build-workspace/outfitting/drives-mass',
  'src/app/features/build-workspace/outfitting/drives-summary',
];

/** Everything the rules read, so a new consumer is found wherever it is added. */
export const SCOPE = ['src/app'];

/**
 * The leaf subpaths this capability may import.
 *
 * The package publishes its data as one module per subject and the application
 * imports the leaf rather than a barrel, so a build carries the subjects this
 * screen reads instead of the whole almanac (constitution II).
 *
 * Only the subjects this capability actually reads. `ships/modules` is not
 * listed: the fitted drive and thruster records reach this feature through the
 * loadout it is handed, and a module catalogue import here would be the first
 * step of resolving a module by symbol — which is how a capability starts
 * inferring a capability flag from a name.
 */
export const ALLOWED_SUBPATHS = [
  '@elite-dangerous-almanac/core/ships/ship-loadout',
  // Almanac 0.2.0 moved every calculation off `ShipLoadout` and onto
  // `BuildMetrics`, which is a leaf of its own. The loadout subpath stays: it
  // is still what holds and edits the build.
  '@elite-dangerous-almanac/core/ships/build-metrics',
  '@elite-dangerous-almanac/core/ships/loadout-calculations',
  '@elite-dangerous-almanac/core/ships/jump-range',
  '@elite-dangerous-almanac/core/ships/mobility',
  '@elite-dangerous-almanac/core/ships/mobility-capacitor',
  '@elite-dangerous-almanac/core/ships/ships',
];

/** Any import of the package, so a barrel or an unlisted subpath is caught too. */
export const ALMANAC_IMPORT = /from\s+(['"])(@elite-dangerous-almanac\/core[^'"]*)\1/;

/**
 * The package answers this capability is made of.
 *
 * All seven are calculations over a whole build rather than facts it carries,
 * so they are confined to the projection for one reason: the two cards and the
 * three rail cells are one reading of one build seen twice, and a second call
 * site is a second opinion nothing reconciles. FR-009 is the requirement that
 * makes this a gate rather than a preference — a rail cell asking the package
 * again could answer at a different load or a different allocation and put two
 * numbers for one quantity on one screen.
 */
export const PACKAGE_CALLS = [
  'jumpRangeSummary',
  'mobilityMetricsResult',
  'mobilityCapacitorMetricsResult',
  'standardLoadResult',
  'buildMass',
  'frameShiftDrive',
  'thrusters',
];

/**
 * One of those, called on something.
 *
 * The leading dot is what makes this a call site rather than a mention. Every
 * one of the seven is a method on `BuildMetrics`, so asking the package means
 * writing `metrics.buildMass(load)`; the same words in a sentence explaining
 * where a figure comes from — and these files explain themselves largely that
 * way — are not a second opinion about anything.
 */
const PACKAGE_CALL = new RegExp(`\\.(?:${PACKAGE_CALLS.join('|')})\\s*\\(`);

/**
 * The three aggregates the canvases do not draw.
 *
 * `unladenMass`, `fuelCapacity` and `cargoCapacity` are real package getters
 * that always answer, which is exactly why they need a rule: nothing fails if
 * one is read, and the reading formats to a plausible tonnage beside the ones
 * the canvas does draw. None is drawn — the last of them, the fuel legend row's
 * `TANK 32 T + RESERVE` qualifier, was cut to the bare word `TANK` by the
 * canvas revision of 2026-08-25 — and by this project's rule a package field no
 * canvas draws is not read at all (FR-006 in spec.md, and the amendment in
 * `design/reference-review.md`).
 *
 * The rule is on the read rather than on the word, so `fuelCapacity` in a
 * message key, a class name or the SLEF export's own `FuelCapacity` payload is
 * untouched: only `.fuelCapacity` off an object is a reading.
 */
export const WITHDRAWN_AGGREGATES = ['unladenMass', 'fuelCapacity', 'cargoCapacity'];

/** One of those aggregates, read off something. */
const WITHDRAWN_READ = new RegExp(`\\.(?:${WITHDRAWN_AGGREGATES.join('|')})\\b`);

/**
 * The package fields that are measured rather than counted.
 *
 * A slot key, a symbol and an enabled flag are identities. These are
 * measurements: light years, metres and degrees per second, tonnes and jump
 * counts. Combining any two of them makes a figure the Almanac did not
 * publish — a headroom, a fuel-per-jump, a mass margin or a reconciliation
 * delta — which is the one thing this application is never allowed to show
 * (constitution II and IV). The canvas's own `658 T HEADROOM` is exactly such a
 * figure, and is out of scope for exactly this reason.
 */
export const FIGURE_FIELDS = [
  'range',
  'jumps',
  'optMass',
  'maxMass',
  'maxFuel',
  'jumpBoost',
  'massLock',
  'speed',
  'boost',
  'pitch',
  'roll',
  'yaw',
  'loadedMass',
  'massCurveMultiplier',
  'rotationMassCurveMultiplier',
  'hull',
  'modules',
  'unladen',
  'fuel',
  'cargo',
  'total',
];

/** One of those fields, read off something. */
const FIGURE_READ = new RegExp(`\\.(?:${FIGURE_FIELDS.join('|')})\\b`);

/**
 * Arithmetic between two things, rather than a sign, a hyphen or a comment.
 *
 * The operator has to be spaced on both sides, which is how the formatter sets
 * every expression in this repository and is never how a kebab-cased class,
 * message key or data attribute is written.
 */
const ARITHMETIC = /[a-zA-Z0-9_$)\]] [+\-*/%] [a-zA-Z0-9_$(]/;

/**
 * Overcharge capability, inferred from an identity instead of read.
 *
 * `OutfittingModule.supercruiseOvercharge` is the catalogue's own flag and the
 * only thing the `SCO` badge may be drawn from. A symbol or a name tested for
 * the letters instead would badge whatever the game names that way next, which
 * is this application deciding a capability the package publishes (FR-008, and
 * the guardrails in tasks.md). Matched on the test rather than on the word, so
 * the flag itself and the prose about it are untouched.
 */
export const INFERRED_OVERCHARGE = new RegExp(
  [
    // `module.symbol.includes('overcharge')` — the identity, then the letters.
    `\\b(?:symbol|name)\\b[^\\n]*(?:includes|startsWith|endsWith|match|test|indexOf)\\s*\\(\\s*['"\`][^'"\`]*(?:sco|overcharge)`,
    // `/sco/i.test(fitted.name)` — the letters, then the identity. Same
    // decision written the other way round, and just as wrong.
    `(?:['"\`]|/)[^'"\`/\\n]*(?:sco|overcharge)[^'"\`/\\n]*(?:['"\`]|/[a-z]*)\\s*\\.\\s*(?:test|exec)\\s*\\([^\\n]*\\b(?:symbol|name)\\b`,
  ].join('|'),
  'i',
);

async function* walk(target) {
  const info = await stat(target).catch(() => null);
  if (info === null) {
    return;
  }
  if (!info.isDirectory()) {
    yield target;
    return;
  }
  for (const entry of await readdir(target)) {
    yield* walk(join(target, entry));
  }
}

/**
 * Every file under a set of paths, excluding suites and fixtures.
 *
 * A suite asks the package the same question this application asks, for the
 * same build, and compares the two answers — which is the whole point of the
 * contract suite and of every component suite that refuses to write a jump
 * range down. Holding them to the call-site rule would forbid the only test
 * that can prove the rule is being kept.
 */
async function filesUnder(paths, extensions) {
  const files = [];
  for (const path of paths) {
    for await (const found of walk(resolve(ROOT, path))) {
      const name = relative(ROOT, found);
      if (name.includes('.spec.') || name.includes('.fixtures.')) {
        continue;
      }
      if (extensions.includes(extname(found))) {
        files.push(name);
      }
    }
  }
  return [...new Set(files)].sort();
}

const isOwned = (name) => OWNED.some((owned) => name.startsWith(owned));
const isProjection = (name) => name.startsWith(PROJECTION);

/**
 * Reads a file line by line, skipping block documentation.
 *
 * A `/** … *\/` comment explains the code, and these files explain themselves
 * largely by naming what they refuse to do — a rule that read them would report
 * the sentence "no headroom is subtracted out of two masses" as a subtraction.
 * A `//` line beside code is not that: it is usually code somebody turned off,
 * which is exactly what these rules are for. `policy-allow:` covers the rest.
 */
export function scan(source, test) {
  const found = [];
  source.split('\n').forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('*') || trimmed.startsWith('/**') || line.includes('policy-allow:')) {
      return;
    }
    const hit = test(line);
    if (hit !== null && hit !== false && hit !== undefined) {
      found.push({ line: index + 1, hit });
    }
  });
  return found;
}

/**
 * The Almanac specifiers one source imports, with their line numbers.
 *
 * The rules below call this rather than re-deriving it, so the code the suite
 * exercises is the code the gate enforces.
 */
export function almanacImportSites(source) {
  return scan(source, (text) => ALMANAC_IMPORT.exec(text)?.[2] ?? null);
}

/** Just the specifiers, for a caller that does not need the lines. */
export function almanacImports(source) {
  return almanacImportSites(source).map(({ hit }) => hit);
}

/** The package call sites in one source, with their line numbers. */
export function packageCallSites(source) {
  return scan(
    source,
    (text) =>
      PACKAGE_CALL.exec(text)?.[0]
        ?.slice(1)
        .replace(/\s*\($/, '') ?? null,
  );
}

/** Just the calls, for a caller that does not need the lines. */
export function packageCalls(source) {
  return packageCallSites(source).map(({ hit }) => hit);
}

/** The lines where one source reads an aggregate no canvas draws. */
export function withdrawnReads(source) {
  return scan(source, (text) => WITHDRAWN_READ.exec(text)?.[0]?.slice(1) ?? null);
}

/** The lines where one source combines two package figures. */
export function combinedFigures(source) {
  return scan(source, (text) => FIGURE_READ.test(text) && ARITHMETIC.test(text));
}

/** The lines where one source decides Overcharge from an identity. */
export function inferredOvercharge(source) {
  return scan(source, (text) => INFERRED_OVERCHARGE.test(text));
}

const RULES = [
  {
    name: 'the Almanac is reached through its leaf subpaths',
    async run(violations) {
      for (const name of await filesUnder(OWNED, ['.ts'])) {
        const source = await readFile(resolve(ROOT, name), 'utf8');
        for (const { line, hit } of almanacImportSites(source)) {
          if (ALLOWED_SUBPATHS.includes(hit)) {
            continue;
          }
          violations.push({
            file: name,
            line,
            reason: `"${hit}" is not one of this capability's leaf subpaths; a barrel import pulls the whole almanac into the bundle and an unlisted subject is a capability nobody specified`,
          });
        }
      }
    },
  },
  {
    name: 'one place asks the package',
    async run(violations) {
      for (const name of await filesUnder(SCOPE, ['.ts', '.html'])) {
        if (isProjection(name)) {
          continue;
        }
        const source = await readFile(resolve(ROOT, name), 'utf8');
        for (const { line, hit } of packageCallSites(source)) {
          violations.push({
            file: name,
            line,
            reason: `"${hit}" is asked outside ${PROJECTION}; the two cards and the three rail cells read one projection of one answer, and a second call site could answer at another load or another allocation and put two numbers for one quantity on one screen (FR-001, FR-009)`,
          });
        }
      }
    },
  },
  {
    name: 'no aggregate the canvases dropped is read back',
    async run(violations) {
      for (const name of await filesUnder(OWNED, ['.ts', '.html'])) {
        const source = await readFile(resolve(ROOT, name), 'utf8');
        for (const { line, hit } of withdrawnReads(source)) {
          violations.push({
            file: name,
            line,
            reason: `"${hit}" is read; neither canvas draws an unladen mass, a tank capacity or a cargo capacity, and a package field no canvas draws is not read at all — the fuel row's qualifier is the bare word "TANK" (FR-006)`,
          });
        }
      }
    },
  },
  {
    name: 'no figure is combined with another',
    async run(violations) {
      for (const name of await filesUnder(SCOPE, ['.ts', '.html'])) {
        const source = await readFile(resolve(ROOT, name), 'utf8');
        if (!isOwned(name) && !source.includes('domain/mobility-jump')) {
          continue;
        }
        for (const { line } of combinedFigures(source)) {
          violations.push({
            file: name,
            line,
            reason:
              'a package figure is arithmetically combined; a headroom, a mass margin, a fuel-per-jump or a reconciliation delta this application worked out is this application claiming a value the Almanac did not publish (FR-001, SC-002)',
          });
        }
      }
    },
  },
  {
    name: 'Overcharge is read, never inferred',
    async run(violations) {
      for (const name of await filesUnder(SCOPE, ['.ts', '.html'])) {
        const source = await readFile(resolve(ROOT, name), 'utf8');
        if (!isOwned(name) && !source.includes('domain/mobility-jump')) {
          continue;
        }
        for (const { line } of inferredOvercharge(source)) {
          violations.push({
            file: name,
            line,
            reason:
              'Overcharge capability is decided from a symbol or a name; the SCO badge is drawn from the catalogue’s own supercruiseOvercharge flag and nothing else, or the next module the game names that way is badged by this application rather than by the package (FR-008)',
          });
        }
      }
    },
  },
];

export async function check() {
  const violations = [];
  for (const rule of RULES) {
    await rule.run(violations);
  }
  return violations;
}

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const violations = await check();
  for (const violation of violations) {
    console.error(`${violation.file}:${violation.line}: ${violation.reason}`);
  }
  console.log(
    violations.length === 0
      ? 'mobility and jump ownership policy: no violations'
      : `mobility and jump ownership policy: ${violations.length} violation(s)`,
  );
  process.exit(violations.length === 0 ? 0 : 1);
}
