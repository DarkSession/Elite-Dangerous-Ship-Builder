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
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ARITHMETIC, ROOT, filesUnder, runPolicy, runRules, scan } from './common.mjs';

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

/**
 * Package calls this capability must never make at all.
 *
 * `mobilityMetrics()` and `mobilityCapacitorMetrics()` were the nullable
 * convenience forms of the two results this feature reads. They answered or they
 * returned `null`, and a `null` carries no reason — so a card built on them could
 * only say "unavailable" with nothing after it, where FR-005 requires the
 * package's own issues. Almanac 0.2.2 removed both, leaving the `…Result` form as
 * the only spelling; they stay named here so the rule keeps standing on the near
 * miss the result forms are, rather than being reintroduced by a wrapper of this
 * application's own. `powerBudget()` is feature 005's question: the package's
 * own mobility diagnostics already distinguish a shed thruster from a missing
 * one, and a budget checked here would be this feature deciding a power meaning
 * that is not its to decide (the Delivery gate in tasks.md names all three).
 */
export const FORBIDDEN_CALLS = ['mobilityMetrics', 'mobilityCapacitorMetrics', 'powerBudget'];

/**
 * One of those, called on something.
 *
 * Requiring the bracket is what keeps `mobilityMetricsResult(` — the
 * diagnostic form this feature does read — from matching the withdrawn
 * `mobilityMetrics(` it is named after.
 */
const FORBIDDEN_CALL = new RegExp(`\\.(?:${FORBIDDEN_CALLS.join('|')})\\s*\\(`);

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
 * publish — a fuel-per-jump, a mass margin or a reconciliation delta — which is
 * the one thing this application is never allowed to show (constitution II
 * and IV).
 *
 * **The canvas's two comparisons are the exception, ruled 2026-08-26 (FR-008).**
 * `91% OF OPTIMAL MASS` and `658 T OF HEADROOM` are not figures worked out on
 * the game's behalf: nothing is modelled, nothing is fitted to a curve, and
 * neither would survive being asked of anything but the two package answers it
 * stands between. This rule does not try to tell those two apart from an
 * invented figure — no regular expression can — so it goes on reporting every
 * combination, and the two that were ruled on carry a `policy-allow:` marker
 * naming the ruling. That is the point of the marker: a crossing that was
 * decided leaves a record at the place it happens, and a crossing that was not
 * decided still stops the build.
 *
 * Which is also why the fields are named after the package rather than after
 * whatever a local was called. A rule watching for these words is a rule a
 * differently-named local walks straight past, and a fence got past quietly is
 * worse than no fence at all.
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

/**
 * One of those fields, read off something — or standing on its own.
 *
 * The leading dot is not required, because a figure that arrived through a
 * destructure or a parameter has lost it. `massSegments` already destructures
 * (`const { mass, fittedModuleCount } = view.thrusters`), so a headroom written
 * `const { maxMass } = curve; const spare = maxMass - total;` is the idiom this
 * file is most likely to grow, and a rule that only saw `.maxMass` would let it
 * through. The names are specific enough to carry the meaning on their own:
 * nothing in this feature is called `optMass` or `rotationMassCurveMultiplier`
 * except the package figure of that name.
 */
const FIGURE_READ = new RegExp(`(?:\\.|\\b)(?:${FIGURE_FIELDS.join('|')})\\b`);

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
/**
 * The letters, delimited so an unrelated word is not one of them.
 *
 * `sco` on its own would flag a fuel scoop, which is squarely in this feature's
 * subject matter and has nothing to do with Overcharge — the rule would fail a
 * legitimate `symbol.includes('FuelScoop')` with a diagnosis that is simply
 * wrong, and the only way past it would be a marker silencing every rule on
 * that line. So the three letters must stand alone or be delimited the way the
 * game's own symbols delimit them.
 */
const LETTERS = String.raw`(?:overcharge|(?<![a-z])sco(?![a-z]))`;

export const INFERRED_OVERCHARGE = new RegExp(
  [
    // `module.symbol.includes('overcharge')` — the identity, then the letters.
    `\\b(?:symbol|name)\\b[^\\n]*(?:includes|startsWith|endsWith|match|test|indexOf)\\s*\\(\\s*['"\`][^'"\`]*${LETTERS}`,
    // `/sco/i.test(fitted.name)` — the letters, then the identity. Same
    // decision written the other way round, and just as wrong.
    `(?:['"\`]|/)[^'"\`/\\n]*${LETTERS}[^'"\`/\\n]*(?:['"\`]|/[a-z]*)\\s*\\.\\s*(?:test|exec)\\s*\\([^\\n]*\\b(?:symbol|name)\\b`,
  ].join('|'),
  'i',
);

const isOwned = (name) => OWNED.some((owned) => name.startsWith(owned));
const isProjection = (name) => name.startsWith(PROJECTION);

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

/** The lines where one source makes a call this capability may never make. */
export function forbiddenCallSites(source) {
  return scan(
    source,
    (text) =>
      FORBIDDEN_CALL.exec(text)?.[0]
        ?.slice(1)
        .replace(/\s*\($/, '') ?? null,
  );
}

/** Just the calls, for a caller that does not need the lines. */
export function forbiddenCalls(source) {
  return forbiddenCallSites(source).map(({ hit }) => hit);
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
    name: 'the nullable forms and feature 005’s own question are never asked',
    async run(violations) {
      for (const name of await filesUnder(OWNED, ['.ts', '.html'])) {
        const source = await readFile(resolve(ROOT, name), 'utf8');
        for (const { line, hit } of forbiddenCallSites(source)) {
          violations.push({
            file: name,
            line,
            reason: `"${hit}" is asked; the nullable mobility forms answer with a bare null that carries no reason where FR-005 requires the package's own issues, and a power budget checked here is feature 005's meaning decided by this feature (FR-004, FR-005)`,
          });
        }
      }
    },
  },
  {
    name: 'no aggregate the canvases dropped is read back',
    async run(violations) {
      // Every file, not just this feature's own. FR-006's rule is about the
      // application rather than about one region: a rail cell, an exporter or
      // a ledger row printing `TANK 32 T` puts back on the screen exactly what
      // the `DRIVES` card just stopped drawing, and it would do it from outside
      // the directories this feature owns.
      for (const name of await filesUnder(SCOPE, ['.ts', '.html'])) {
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
              'a package figure is arithmetically combined; a mass margin, a fuel-per-jump or a reconciliation delta this application worked out is this application claiming a value the Almanac did not publish (FR-001, SC-002). The two comparisons FR-008 ruled on carry a `policy-allow:` marker naming the ruling; anything else is a figure nobody decided to show',
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

/** Re-exported for this feature's own suite, which asserts the reading directly. */
export { scan };

export const check = () => runRules(RULES);

await runPolicy('mobility and jump ownership policy', check, import.meta.url);
