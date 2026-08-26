#!/usr/bin/env node
/**
 * Repository policy checks for feature 006's own source.
 *
 * Shield strength, what a SYS allocation makes of it, recovery, cell banks and
 * armour are five package answers this application shows and does not have. Every rule here is about a way that
 * could stop being true without anything failing: a second call site would
 * still return a plausible pool, a subtraction of two package figures would
 * still print a number, and a deep import would still compile. None of them can
 * be a type or a unit test — a rule proven by the absence of a line has no call
 * site to test. Exit code 0 means every rule passed; a violation prints its
 * file, line and reason.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ARITHMETIC, ROOT, filesUnder, runPolicy, runRules, scan } from './common.mjs';

/** The one place that may ask the package about shields, banks or armour. */
export const PROJECTION = 'src/app/domain/defence';

/** Feature 006's own source. The import rule applies inside these. */
export const OWNED = [
  PROJECTION,
  'src/app/features/build-workspace/outfitting/defence-analysis',
  'src/app/features/build-workspace/outfitting/defence-summary',
];

/** Everything the rules read, so a new consumer is found wherever it is added. */
export const SCOPE = ['src/app'];

/**
 * The leaf subpaths this capability may import.
 *
 * The package publishes its data as one module per subject and the application
 * imports the leaf rather than a barrel, so a build carries the subjects this
 * screen reads instead of the whole almanac (constitution II).
 */
export const ALLOWED_SUBPATHS = [
  '@elite-dangerous-almanac/core/ships/ship-loadout',
  // Almanac 0.2.0 moved every calculation off `ShipLoadout` and onto
  // `BuildMetrics`, which is a leaf of its own. The loadout subpath stays: it
  // is still what holds and edits the build.
  '@elite-dangerous-almanac/core/ships/build-metrics',
  '@elite-dangerous-almanac/core/ships/ships',
  '@elite-dangerous-almanac/core/ships/shields',
  // The bare shield and what a SYS allocation makes of it are two leaves
  // since Almanac 0.2.0, and this capability draws both (FR-002).
  '@elite-dangerous-almanac/core/ships/shield-capacitor',
  '@elite-dangerous-almanac/core/ships/shield-recovery',
  '@elite-dangerous-almanac/core/ships/armour',
  '@elite-dangerous-almanac/core/ships/engineering-options',
  '@elite-dangerous-almanac/core/ships/loadout-calculations',
];

/** Any import of the package, so a barrel or an unlisted subject is caught too. */
export const ALMANAC_IMPORT = /from\s+(['"])(@elite-dangerous-almanac\/core[^'"]*)\1/;

/**
 * The five build answers this capability is made of.
 *
 * The bare shield and what a SYS allocation makes of it became two calls in
 * Almanac 0.2.0, and the second draws the damage table's fifth column (FR-002).
 * It is fenced like the other four: a second call site would return a plausible
 * pool at a plausible allocation and nothing would fail.
 */
export const PACKAGE_CALLS = [
  'shieldMetricsResult(',
  'shieldCapacitorMetricsResult(',
  'shieldRecoveryResult(',
  'cellBanks(',
  'armourMetrics(',
];

/**
 * The package fields that are figures rather than identities.
 *
 * A slot key, a symbol and a cell count are named and counted. These are
 * measured: megajoules, hull points, resistances, multipliers, rates and
 * seconds. Combining any two of them makes a figure the Almanac did not
 * publish — a per-module share of an aggregate, a total of two pools, a
 * remainder — which is the one thing this application is never allowed to show
 * (constitution II and IV, FR-001).
 */
export const FIGURE_FIELDS = [
  'strength',
  'generator',
  'boosters',
  'reinforcement',
  'massCurveMultiplier',
  'boostMultiplier',
  'systemsResistance',
  'resistance',
  'resistances',
  // The capacitor's own measured fields. `effectiveResistances` is the one this
  // application must never draw — the resistances with the pips folded in, on a
  // table whose `RESIST` column is a base value — so combining it with anything
  // is caught here rather than left to a reading of the contract.
  'effectiveResistances',
  'capacity',
  'rechargeRate',
  'effectiveHitPoints',
  'regenRate',
  'brokenRegenRate',
  'recoveryTime',
  'regenTime',
  'totalRestorable',
  'hitPoints',
  'bulkheads',
  'moduleArmour',
  'moduleProtection',
  'hardness',
  'contribution',
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
        if (!isOwned(name) && !source.includes('domain/defence')) {
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
              'a package figure is arithmetically combined; a per-module share, a total of two pools or a remainder this application worked out is this application claiming a value the Almanac did not publish (FR-001, FR-004)',
          });
        }
      }
    },
  },
];

export const check = () => runRules(RULES);

await runPolicy('defence ownership policy', check, import.meta.url);
