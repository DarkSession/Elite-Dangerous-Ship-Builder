#!/usr/bin/env node
/**
 * Repository policy checks for feature 005's own source.
 *
 * Power, heat and the distributor are three package answers this application
 * shows and does not have. Every rule here is about a way that could stop being
 * true without anything failing: a second call site would still return a
 * plausible budget, a subtraction of two package figures would still print a
 * number, and a deep import would still compile. None of them can be a type or
 * a unit test — a rule proven by the absence of a line has no call site to
 * test. Exit code 0 means every rule passed; a violation prints its file, line
 * and reason.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

/** The one place that may ask the package about power, heat or the distributor. */
export const PROJECTION = 'src/app/domain/power-heat';

/** Feature 005's own source. The import rule applies inside these. */
export const OWNED = [
  PROJECTION,
  'src/app/application/power-heat',
  'src/app/features/build-workspace/outfitting/power-thermals',
  'src/app/features/build-workspace/outfitting/power-summary',
];

/** Everything the rules read, so a new consumer is found wherever it is added. */
export const SCOPE = ['src/app'];

/**
 * The leaf subpaths this capability may import.
 *
 * The package publishes its data as one module per subject and the application
 * imports the leaf rather than a barrel, so a build carries the three subjects
 * this screen reads instead of the whole almanac (constitution II).
 */
export const ALLOWED_SUBPATHS = [
  '@elite-dangerous-almanac/core/ships/ship-loadout',
  // Almanac 0.2.0 moved every calculation off `ShipLoadout` and onto
  // `BuildMetrics`, which is a leaf of its own. The loadout subpath stays: it
  // is still what holds and edits the build.
  '@elite-dangerous-almanac/core/ships/build-metrics',
  '@elite-dangerous-almanac/core/ships/power',
  '@elite-dangerous-almanac/core/ships/distributor',
  '@elite-dangerous-almanac/core/ships/heat',
];

/** Any import of the package, so a barrel or a fifth subpath is caught too. */
export const ALMANAC_IMPORT = /from\s+(['"])(@elite-dangerous-almanac\/core[^'"]*)\1/;

/** The three package answers this capability is made of. */
export const PACKAGE_CALLS = ['powerBudget(', 'distributorMetrics(', 'heatMetrics('];

/**
 * The package fields that are figures rather than identities.
 *
 * A group number, an ordinal and a pip count are counted and compared. These
 * are measured: megawatts, megajoules, seconds and the two ratios. Combining
 * any two of them makes a figure the Almanac did not publish, which is the one
 * thing this application is never allowed to show (constitution II and IV).
 */
export const FIGURE_FIELDS = [
  'available',
  'retracted',
  'deployed',
  'retractedTotal',
  'deployedTotal',
  'headroom',
  'utilisation',
  'draw',
  'capacity',
  'ratedRecharge',
  'rechargeRate',
  'thermalLoad',
  'heatLevel',
  'gauge',
  'secondsToOverheat',
  'heatEfficiency',
  'hullHeatCapacity',
  'hullHeatDissipation',
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
 * contract suite and of every component suite that refuses to write a megawatt
 * down. Holding them to the call-site rule would forbid the only test that can
 * prove the rule is being kept.
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
 * the sentence "nothing here divides one figure by another" as a division. A
 * `//` line beside code is not that: it is usually code somebody turned off,
 * which is exactly what these rules are for. `policy-allow:` covers the rest.
 */
function scan(source, test) {
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

const RULES = [
  {
    name: 'the Almanac is reached through its leaf subpaths',
    async run(violations) {
      for (const name of await filesUnder(OWNED, ['.ts'])) {
        const source = await readFile(resolve(ROOT, name), 'utf8');
        for (const { line, hit } of scan(
          source,
          (text) => ALMANAC_IMPORT.exec(text)?.[2] ?? null,
        )) {
          if (ALLOWED_SUBPATHS.includes(hit)) {
            continue;
          }
          violations.push({
            file: name,
            line,
            reason: `"${hit}" is not one of this capability's four leaf subpaths; a barrel import pulls the whole almanac into the bundle and a fifth subject is a capability nobody specified`,
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
        for (const { line, hit } of scan(source, (text) =>
          PACKAGE_CALLS.find((call) => text.includes(call)),
        )) {
          violations.push({
            file: name,
            line,
            reason: `"${hit.slice(0, -1)}" is asked outside ${PROJECTION}; every screen reads one projection of one answer, and a second call site is a second opinion nothing reconciles (FR-001)`,
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
        if (!isOwned(name) && !source.includes('domain/power-heat')) {
          continue;
        }
        for (const { line } of scan(
          source,
          (text) => FIGURE_READ.test(text) && ARITHMETIC.test(text),
        )) {
          violations.push({
            file: name,
            line,
            reason:
              'a package figure is arithmetically combined; a headroom, a percentage or a remainder this application worked out is this application claiming a value the Almanac did not publish (FR-001, FR-002)',
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
      ? 'power and heat ownership policy: no violations'
      : `power and heat ownership policy: ${violations.length} violation(s)`,
  );
  process.exit(violations.length === 0 ? 0 : 1);
}
