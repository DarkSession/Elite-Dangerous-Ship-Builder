#!/usr/bin/env node
/**
 * Repository policy checks for feature 007's own source.
 *
 * Weapon output and the weapons capacitor are two package answers this
 * application shows and does not have. Every rule here is about a way that
 * could stop being true without anything failing: a second call site would
 * still return a plausible damage figure, a division of two package amounts
 * would still print a percentage, an `Infinity` handed to a formatter would
 * still render something, and a deep import would still compile. None of them
 * can be a type or a unit test — a rule proven by the absence of a line has no
 * call site to test. Exit code 0 means every rule passed; a violation prints
 * its file, line and reason.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

/** The one place that may ask the package about weapons or the capacitor. */
export const PROJECTION = 'src/app/domain/offence';

/** Feature 007's own source. The import rule applies inside these. */
export const OWNED = [
  PROJECTION,
  'src/app/features/build-workspace/outfitting/offence-analysis',
  'src/app/features/build-workspace/outfitting/offence-summary',
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
 * Only the subjects this capability actually reads. `ships/ammunition` was
 * listed before and is not: every ammunition field is on the list no canvas
 * draws, so allowing the subpath here would pre-authorise the one import this
 * rule exists to catch.
 */
export const ALLOWED_SUBPATHS = [
  '@elite-dangerous-almanac/core/ships/ship-loadout',
  '@elite-dangerous-almanac/core/ships/weapons',
  '@elite-dangerous-almanac/core/ships/weapons-capacitor',
  '@elite-dangerous-almanac/core/ships/modules',
  '@elite-dangerous-almanac/core/ships/gunsights',
  '@elite-dangerous-almanac/core/ships/ships',
  '@elite-dangerous-almanac/core/ships/slots',
];

/** Any import of the package, so a barrel or an unlisted subpath is caught too. */
export const ALMANAC_IMPORT = /from\s+(['"])(@elite-dangerous-almanac\/core[^'"]*)\1/;

/**
 * The package answers this capability is made of.
 *
 * Damage at range and shot convergence are package calculations like the other
 * two — `damageFalloff` attenuates one weapon's damage and `projectGunsight`
 * places one hull's hardpoints — so they are confined to the projection for the
 * same reason: a second call site is a second opinion nothing reconciles.
 */
export const PACKAGE_CALLS = [
  'weaponMetrics(',
  'weaponsCapacitorMetrics(',
  'damageFalloff(',
  'projectGunsight(',
  'getShipGunsight(',
];

/**
 * The package fields that are measured rather than counted.
 *
 * A slot key, a symbol and an enabled flag are identities. These are
 * measurements: damage, energy, heat, distance, piercing, megajoules and
 * seconds. Combining any two of them makes a figure the Almanac did not
 * publish — a share, a percentage, an alpha strike or a target result — which
 * is the one thing this application is never allowed to show (constitution II
 * and IV), and is exactly what the canvas's own `· 67%` legend is.
 *
 * `clipSize` and `hopper` are on the list although this capability's allow-list
 * excludes the ammunition subject: the import rule covers this feature's own
 * source, and this rule also reads every file elsewhere that consumes the
 * projection, where an ammunition figure could arrive by another route.
 */
export const FIGURE_FIELDS = [
  'damagePerShot',
  'damagePerSecond',
  'sustainedDamagePerSecond',
  'energyPerSecond',
  'sustainedEnergyPerSecond',
  'heatPerSecond',
  'sustainedHeatPerSecond',
  'thermalLoad',
  'powerDraw',
  'rateOfFire',
  'sustainedRateOfFire',
  'kinetic',
  'thermal',
  'explosive',
  'absolute',
  'antiXeno',
  'unclassified',
  'maximumRange',
  'falloffRange',
  'armourPiercing',
  'maximumBoundary',
  'falloffBoundary',
  'capacity',
  'rechargeRate',
  'clipSize',
  'hopper',
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
 * The package sentinel, named literally outside the projection.
 *
 * `Infinity` is what the weapons capacitor's `timeToDrain` returns where the
 * recharge keeps pace, and it means something a number cannot say. The
 * projection turns it into a named state; a surface that tested for the
 * sentinel itself would be re-deciding, in a template, a meaning the projection
 * already settled — and a surface that handed it to a formatter would print a
 * raw `Infinity` where the canvas's own glyph belongs (FR-007,
 * `data-model.md`). Both spellings are matched, because the second is the same
 * value written the long way.
 */
export const SENTINEL = /(?<![.\w])Infinity\b|Number\.POSITIVE_INFINITY/;

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
 * contract suite and of every component suite that refuses to write a damage
 * figure down. Holding them to the call-site rule would forbid the only test
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
 * the sentence "no share is divided out of two figures" as a division. A `//`
 * line beside code is not that: it is usually code somebody turned off, which
 * is exactly what these rules are for. `policy-allow:` covers the rest.
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
  return scan(source, (text) => PACKAGE_CALLS.find((call) => text.includes(call)));
}

/** Just the calls, for a caller that does not need the lines. */
export function packageCalls(source) {
  return packageCallSites(source).map(({ hit }) => hit);
}

/** The lines where one source combines two package figures. */
export function combinedFigures(source) {
  return scan(source, (text) => FIGURE_READ.test(text) && ARITHMETIC.test(text));
}

/** The lines where one source names a package sentinel itself. */
export function sentinelReads(source) {
  return scan(source, (text) => SENTINEL.test(text));
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
            reason: `"${hit.slice(0, -1)}" is asked outside ${PROJECTION}; both surfaces read one projection of one answer, and a second call site is a second opinion nothing reconciles (FR-001)`,
          });
        }
      }
    },
  },
  {
    name: 'no figure is combined with another',
    async run(violations) {
      for (const name of await filesUnder(SCOPE, ['.ts', '.html'])) {
        if (isProjection(name)) {
          continue;
        }
        const source = await readFile(resolve(ROOT, name), 'utf8');
        if (!isOwned(name) && !source.includes('domain/offence')) {
          continue;
        }
        for (const { line } of combinedFigures(source)) {
          violations.push({
            file: name,
            line,
            reason:
              'a package figure is arithmetically combined; a damage share, a percentage, an alpha strike or a target result this application worked out is this application claiming a value the Almanac did not publish (FR-001, FR-002, FR-003)',
          });
        }
      }
    },
  },
  {
    name: 'no surface reads a package sentinel itself',
    async run(violations) {
      for (const name of await filesUnder(OWNED, ['.ts', '.html'])) {
        if (isProjection(name)) {
          continue;
        }
        const source = await readFile(resolve(ROOT, name), 'utf8');
        for (const { line } of sentinelReads(source)) {
          violations.push({
            file: name,
            line,
            reason: `an infinity is named outside ${PROJECTION}; a recharge that keeps pace is a state the projection already decided, and a surface that re-decides it can print a raw "Infinity" where the canvas's glyph belongs (FR-007)`,
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
      ? 'offence ownership policy: no violations'
      : `offence ownership policy: ${violations.length} violation(s)`,
  );
  process.exit(violations.length === 0 ? 0 : 1);
}
