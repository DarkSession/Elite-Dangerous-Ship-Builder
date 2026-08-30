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
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ARITHMETIC, ROOT, filesUnder, runPolicy, runRules, scan } from './common.mjs';

/** The one place that may ask the package about power, heat or the distributor. */
export const PROJECTION = 'src/app/domain/power-heat';

/** Feature 005's own source. The import rule applies inside these. */
export const OWNED = [
  PROJECTION,
  'src/app/application/power-heat',
  'src/app/features/build-workspace/outfitting/power-thermals',
  'src/app/features/build-workspace/outfitting/power-summary',
  'src/app/features/build-workspace/outfitting/power-badge',
  'src/app/features/build-workspace/outfitting/distributor-block',
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

/**
 * The three package answers this capability is made of, in every spelling.
 *
 * The two names whose nullable twin 0.2.2 withdrew appear twice. The `…Result(`
 * form is the method on `BuildMetrics`, and is the only way to ask a build; the
 * bare `heatMetrics(` and `distributorMetrics(` are the standalone calculators,
 * which the package still exports from `ships/heat` and `ships/distributor`. A
 * name is matched with its bracket, which is why the shorter spelling does not
 * cover the longer one. `powerBudget(` needs no second entry: `ships/power`
 * spells its calculator exactly like the `BuildMetrics` method, so the one name
 * catches both.
 *
 * This list is about *where* an answer is asked for, so the projection is
 * exempt from it. What the projection may not do either is {@link
 * STANDALONE_CALLS}.
 */
export const PACKAGE_CALLS = [
  'powerBudget(',
  'distributorMetrics(',
  'distributorMetricsResult(',
  'heatMetrics(',
  'heatMetricsResult(',
];

/**
 * The calculators no file may call, the projection included.
 *
 * `ships/distributor` is on the allowed subpaths for its types and `ships/heat`
 * for `heatLevelAtTime` and `OVERHEAT_HEAT_LEVEL`, so the leaves' calculators
 * come with them — and the projection is the one directory in the repository
 * that reaches those leaves at all. Exempting it from {@link PACKAGE_CALLS} —
 * which it must be, since it is the one place that asks — would therefore leave
 * `heat-profile.md` and `distributor-metrics.md`'s refusal of the standalone
 * forms with nothing enforcing it anywhere. Assembling a calculator's inputs
 * here is the application deciding what a package figure is made of
 * (constitution II).
 *
 * Both contracts refuse a category rather than a name, so every calculator on
 * the two leaves is listed — except `heatLevelAtTime(`, which `heat-profile.md`
 * mandates for the cell-bank spike and the projection calls. `powerBudget(` has
 * no entry for the opposite reason to a missing one: `ships/power` exports a
 * calculator spelled exactly like the `BuildMetrics` method, so no name can tell
 * them apart and {@link PACKAGE_CALLS} catches the pair outside the projection
 * and neither inside it. `contracts/power-budget.md` refuses the standalone form
 * in prose, and nothing mechanical can hold it to that.
 *
 * The rule that reads this list walks all of `SCOPE`, not just the owned
 * directories: a standalone calculator is refused wherever it is written.
 */
export const STANDALONE_CALLS = [
  'distributorMetrics(',
  'heatMetrics(',
  'equilibriumHeatLevel(',
  'effectiveWeaponThermalLoad(',
  'secondsToHeatLevel(',
];

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

const isOwned = (name) => OWNED.some((owned) => name.startsWith(owned));
const isProjection = (name) => name.startsWith(PROJECTION);

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
    name: 'nobody calls the standalone calculator',
    async run(violations) {
      for (const name of await filesUnder(SCOPE, ['.ts', '.html'])) {
        const source = await readFile(resolve(ROOT, name), 'utf8');
        // A name this list shares with `PACKAGE_CALLS` is already reported by
        // the placement rule everywhere that rule looks, so it is passed over
        // here rather than said twice with two reasons. The skip belongs in the
        // predicate: `scan` yields one hit per line, so skipping the whole line
        // would lose a standalone-only name written beside a shared one.
        for (const { line, hit } of scan(source, (text) =>
          STANDALONE_CALLS.find(
            (call) => text.includes(call) && (isProjection(name) || !PACKAGE_CALLS.includes(call)),
          ),
        )) {
          violations.push({
            file: name,
            line,
            reason: `"${hit.slice(0, -1)}" is a standalone calculator, which no file may call — the projection included; the build-aware call reads the fit the package already holds, and assembling a calculator's inputs here is this application deciding what the figure is made of (constitution II)`,
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

export const check = () => runRules(RULES);

await runPolicy('power and heat ownership policy', check, import.meta.url);
