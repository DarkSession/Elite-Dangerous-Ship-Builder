#!/usr/bin/env node
/**
 * Repository policy checks for feature 013's own source.
 *
 * Shields, resistances, weapon output and what a modification costs are four
 * package answers the bench shows and does not have. Every rule here is about a
 * way that could stop being true without anything failing: a second call site
 * would still return a plausible shield figure, a sum of two published costs
 * would still print a number, and a barrel import would still compile. None of
 * them can be a type or a unit test — a rule proven by the absence of a line has
 * no call site to test. Exit code 0 means every rule passed; a violation prints
 * its file, line and reason.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ARITHMETIC, ROOT, filesUnder, runPolicy, runRules, scan } from './common.mjs';

/** The one place that may ask the package what a loadout is worth. */
export const PROJECTION = 'src/app/domain/equipment/readings';

/** Feature 013's own source. The import rule applies inside these. */
export const OWNED = [
  'src/app/domain/equipment',
  'src/app/application/equipment',
  'src/app/features/equipment',
];

/** Everything the rules read, so a new consumer is found wherever it is added. */
export const SCOPE = ['src/app'];

/**
 * The leaf subpaths this capability may import.
 *
 * The package publishes its data as one module per subject and the application
 * imports the leaf rather than a barrel, so a build carries the subjects this
 * tool reads instead of the whole almanac (constitution II).
 */
export const ALLOWED_SUBPATHS = [
  '@elite-dangerous-almanac/core/equipment/suits',
  '@elite-dangerous-almanac/core/equipment/weapons',
  '@elite-dangerous-almanac/core/equipment/modifications',
  '@elite-dangerous-almanac/core/equipment/modification-costs',
  '@elite-dangerous-almanac/core/equipment/upgrade-costs',
  '@elite-dangerous-almanac/core/equipment/modification-journal',
  '@elite-dangerous-almanac/core/equipment/engineering',
  '@elite-dangerous-almanac/core/equipment/tools',
];

/** Any import of the package, so a barrel or an unlisted subject is caught too. */
export const ALMANAC_IMPORT = /from\s+(['"])(@elite-dangerous-almanac\/core[^'"]*)\1/;

/**
 * The package answers this capability is made of.
 *
 * Identity lookups are deliberately absent: `getSuitByFamily`,
 * `getPersonalWeaponBySymbol` and `getPersonalModification` answer *what a
 * thing is*, and a chooser, a codec table and a link reconstructor all have to
 * ask that. The rest answer *what it is worth*, which is the question one place
 * asks — a second call site is a second opinion nothing reconciles. That covers
 * the two upgrade calls: what a grade costs to reach is part of one total, and a
 * screen asking for it directly would be a second answer to the material
 * requirement (FR-014).
 *
 * `getSuitGrade` and `getPersonalWeaponGrade` are on the list because the
 * record each returns carries every figure of that grade: reading one outside
 * the projection is asking the same question through a different door.
 */
export const PACKAGE_CALLS = [
  'applyPersonalModifiers(',
  'personalWeaponMetrics(',
  'getPersonalModificationCost(',
  'getSuitUpgradeCost(',
  'getPersonalWeaponUpgradeCost(',
  'sumPersonalEngineeringIngredients(',
  'getSuitGrade(',
  'getPersonalWeaponGrade(',
];

/**
 * The package fields that are figures rather than identities.
 *
 * A suit family, a weapon symbol, a mount key and a recipe name are named.
 * These are measured: shield points, points per second, resistance fractions,
 * damage, rates, ranges and counts of micro resources. Combining any two of
 * them makes a figure the Almanac did not publish — a sum of two weapons'
 * output, a per-mount share, an average — which is the one thing this
 * application is never allowed to show (constitution II and IV, FR-006).
 */
export const FIGURE_FIELDS = [
  'shieldStrength',
  'shieldRegeneration',
  'kineticResistance',
  'thermalResistance',
  'plasmaResistance',
  'explosiveResistance',
  'damagePerShot',
  'damagePerSecond',
  'sustainedDamagePerSecond',
  'headshotDamagePerShot',
  'headshotMultiplier',
  'rateOfFire',
  'magazineSize',
  'reserveAmmo',
  'effectiveRange',
  'reloadTime',
  'scopeMagnification',
];

/** One of those fields, read off something. */
const FIGURE_READ = new RegExp(`\\.(?:${FIGURE_FIELDS.join('|')})\\b`);

const isProjection = (name) => name.startsWith(PROJECTION);
const isOwned = (name) => OWNED.some((owned) => name.startsWith(owned));

export function almanacImportSites(source) {
  return [...scan(source, (text) => ALMANAC_IMPORT.exec(text)?.[2] ?? null)];
}

export function almanacImports(source) {
  return almanacImportSites(source).map(({ hit }) => hit);
}

export function packageCallSites(source) {
  return [...scan(source, (text) => PACKAGE_CALLS.find((call) => text.includes(call)))];
}

export function packageCalls(source) {
  return packageCallSites(source).map(({ hit }) => hit);
}

export function combinedFigures(source) {
  return [...scan(source, (text) => FIGURE_READ.test(text) && ARITHMETIC.test(text))];
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
    name: 'one place asks the package what a loadout is worth',
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
            reason: `"${hit.slice(0, -1)}" is asked outside ${PROJECTION}; every surface reads one projection of one answer, and a second call site is a second opinion nothing reconciles (constitution III)`,
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
        // The ship tool measures some of the same things under some of the same
        // names, and its own policy fences those. This rule is about the
        // bench's figures: the files that are this capability's, and the files
        // that read its projection.
        if (!isOwned(name) && !source.includes('domain/equipment/readings')) {
          continue;
        }
        for (const { line } of combinedFigures(source)) {
          violations.push({
            file: name,
            line,
            reason:
              'a package figure is arithmetically combined; a total of two weapons’ output, a per-mount share or an average this application worked out is this application claiming a value the Almanac did not publish (constitution IV)',
          });
        }
      }
    },
  },
];

export { scan };

export const check = () => runRules(RULES);

await runPolicy('equipment ownership policy', check, import.meta.url);
