#!/usr/bin/env node
/**
 * Repository policy checks for feature 002's own source.
 *
 * The interface-foundations checker governs what every screen owes a reader.
 * These are the rules that keep *this* feature on the right side of the two
 * boundaries it is most likely to cross quietly: the Almanac owns game facts,
 * and the session's edit tape leaves the session.
 *
 * Each rule is about something that must not appear anywhere, which is why none
 * of them can be a type or a unit test — a rule proven by the absence of a line
 * has no call site to test. Exit code 0 means every rule passed; a violation
 * prints its file, line and reason.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { ROOT, runPolicy, runRules } from './common.mjs';

/** Feature 002's own source. Every rule below applies inside these. */
export const OWNED = [
  'src/app/application/outfitting',
  'src/app/domain/ships/outfitting',
  'src/app/ui/outfitting',
  'src/app/features/build-workspace/outfitting',
];

/**
 * Modules that must never see a checkpoint or a tape.
 *
 * The edit-history contract names them: local records, the snapshot serializer,
 * the compact link codec, SLEF and the router. A checkpoint reaching any of
 * them is the whole boundary failing, and it fails silently — the value would
 * serialize perfectly well.
 */
export const SEALED = [
  'src/app/domain/ships/build/build-snapshot.serializer.ts',
  'src/app/domain/ships/build/stored-build.serializer.ts',
  'src/app/domain/ships/build-link',
  'src/app/platform',
];

/** What a checkpoint or tape is called, wherever it is imported from. */
const HISTORY_MODULES = ['session-edit-history', 'modeled-build-checkpoint'];

/**
 * Where the Almanac's family taxonomy may be *read*.
 *
 * Two places and no third: the presenter, which turns a family id into the
 * package's own name for the reading language, and the application layer that
 * orders and groups by it. A component that read it would be deciding what a
 * family is instead of rendering what it was handed, and anywhere else in the
 * repository is a second taxonomy by definition (FR-020).
 *
 * A type-only import is not a reading. `OutfittingFamilyId` is how a signature
 * says "this is the package's id and not a string of ours"; it carries no
 * names, no order and no membership, and forbidding it would push every
 * boundary between these files back to `string`. Specs and fixtures are
 * excluded for the reason every other rule here excludes them: their job is to
 * characterize the installed package.
 */
const FAMILY_MODULE = 'module-families';
const FAMILY_READERS = ['src/app/i18n/game-text.presenter.ts', 'src/app/application/outfitting/'];

/** Where a repository-wide rule looks. Specs and fixtures characterize the package. */
const SOURCE_ROOTS = ['src/app', 'scripts'];

/** How many family ids in one literal make it a table rather than a mention. */
const TABLE_THRESHOLD = 3;

/** What shortening game text looks like, whatever it is called. */
const SHORTENING = new Set([
  'slice',
  'substring',
  'substr',
  'charAt',
  'split',
  'match',
  'replace',
  'replaceAll',
]);

/** What an aggregate over a run of rows looks like. */
const AGGREGATING = new Set(['min', 'max', 'reduce', 'sort']);

/** The package's own module symbols. Application code never names one. */
const MODULE_SYMBOL = /^(?:Int_|Hpt_|Armour_)/i;

/** Colour written as a value rather than taken from a token. */
const COLOUR_LITERAL = /(#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|color-mix)\s*\()/i;

/** A length in pixels. Every spacing and size step is a token here. */
const PIXEL_LITERAL = /(?<![\w-])-?\d*\.?\d+px\b/;

/** Every family id the installed package publishes, read from the package. */
const FAMILY_IDS = new Set(
  Object.keys(
    (await import('@elite-dangerous-almanac/core/ships/module-families')).OUTFITTING_FAMILIES,
  ),
);

async function* walk(directory) {
  let entries;
  try {
    entries = await readdir(directory);
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = join(directory, entry);
    const info = await stat(path);
    if (info.isDirectory()) {
      yield* walk(path);
    } else {
      yield path;
    }
  }
}

/** Every file under the owned directories, excluding specs and fixtures. */
async function ownedFiles(extensions) {
  const files = [];
  for (const directory of OWNED) {
    for await (const path of walk(resolve(ROOT, directory))) {
      const name = relative(ROOT, path);
      if (name.includes('.spec.') || name.includes('.fixtures.') || name.includes('spec-helpers')) {
        continue;
      }
      if (extensions.includes(extname(path))) {
        files.push(name);
      }
    }
  }
  return files.sort();
}

function parse(source, name) {
  return ts.createSourceFile(name, source, ts.ScriptTarget.ESNext, true);
}

/** Whether a token appears anywhere in the function or block a node sits in. */
function nearestScope(file, node) {
  let scope = node.parent;
  while (
    scope !== undefined &&
    !ts.isFunctionLike(scope) &&
    !ts.isClassDeclaration(scope) &&
    !ts.isSourceFile(scope)
  ) {
    scope = scope.parent;
  }
  return (scope ?? file).getText(file);
}

/** `family` named anywhere in the same function as an abbreviating call. */
function familyNear(file, node) {
  return /family/i.test(nearestScope(file, node));
}

function factsIn(text) {
  // `.facts` however it is reached: a property, an index, a destructure. The
  // dot is what makes it the projection's cell rather than a local named facts.
  return /presentation\.facts|\.facts\b/.test(text);
}

/**
 * The package's figures read anywhere in the same function as an aggregate.
 *
 * The two-step range is the natural way to write the thing this forbids —
 * `const dps = family.choices.map((c) => c.presentation.facts.damage)` and then
 * `Math.min(...dps)` — and neither half mentions both tokens on its own.
 */
function factsNear(file, node) {
  return factsIn(nearestScope(file, node));
}

function lineOf(file, node) {
  return file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1;
}

/** Every import declaration in one file, with its specifier and type-only flag. */
function imports(file) {
  return file.statements.filter(ts.isImportDeclaration).map((statement) => ({
    node: statement,
    specifier: statement.moduleSpecifier.text,
    typeOnly:
      statement.importClause?.isTypeOnly === true ||
      (statement.importClause?.namedBindings !== undefined &&
        ts.isNamedImports(statement.importClause.namedBindings) &&
        statement.importClause.namedBindings.elements.every((element) => element.isTypeOnly)),
  }));
}

/** Every `.ts` file under the repository's own source, specs included. */
async function sourceFiles() {
  const files = [];
  for (const directory of SOURCE_ROOTS) {
    for await (const path of walk(resolve(ROOT, directory))) {
      if (extname(path) === '.ts' || extname(path) === '.mts') {
        files.push(relative(ROOT, path));
      }
    }
  }
  return files.sort();
}

/** Every string literal directly inside one array or object literal. */
function literalStrings(node) {
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.filter(ts.isStringLiteral).map((element) => element.text);
  }
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.flatMap((property) => {
      const name = property.name;
      if (name === undefined) return [];
      if (ts.isIdentifier(name)) return [name.text];
      if (ts.isStringLiteral(name)) return [name.text];
      if (ts.isComputedPropertyName(name) && ts.isStringLiteral(name.expression)) {
        return [name.expression.text];
      }
      return [];
    });
  }
  return [];
}

const RULES = [
  {
    name: 'the family taxonomy is read in two places',
    async run(violations) {
      for (const name of await sourceFiles()) {
        if (name.includes('.spec.') || name.includes('.fixtures.')) {
          continue;
        }
        const source = await readFile(resolve(ROOT, name), 'utf8');
        if (!source.includes(FAMILY_MODULE)) {
          continue;
        }
        const file = parse(source, name);
        // A reader may read. What no file may do — a reader least of all, since
        // it is the one holding the taxonomy — is pass it on: one re-export
        // from here would hand it to any component through a specifier the
        // import rule below never looks at, and `await import(…)` is not an
        // import declaration at all. So this walk runs everywhere.
        const reach = (node) => {
          const escaped =
            (ts.isExportDeclaration(node) &&
              node.moduleSpecifier !== undefined &&
              node.moduleSpecifier.getText(file).includes(FAMILY_MODULE) &&
              node.isTypeOnly !== true) ||
            (ts.isCallExpression(node) &&
              node.expression.kind === ts.SyntaxKind.ImportKeyword &&
              node.getText(file).includes(FAMILY_MODULE));
          if (escaped) {
            violations.push({
              file: name,
              line: lineOf(file, node),
              reason:
                `passes the family taxonomy on from "${FAMILY_MODULE}"; re-exporting it or ` +
                'importing it dynamically is the same reading through a different door, and a ' +
                'reader doing it hands the taxonomy to every file that imports the reader',
            });
          }
          ts.forEachChild(node, reach);
        };
        ts.forEachChild(file, reach);

        if (FAMILY_READERS.some((reader) => name.startsWith(reader))) {
          continue;
        }
        for (const entry of imports(file)) {
          if (entry.specifier.includes(FAMILY_MODULE) && !entry.typeOnly) {
            violations.push({
              file: name,
              line: lineOf(file, entry.node),
              reason:
                `imports "${entry.specifier}" outside ${FAMILY_READERS.join(' and ')}; ` +
                'the family taxonomy is read where it is presented and where it is grouped, nowhere else',
            });
          }
        }
      }
    },
  },
  {
    name: 'no local family-id table',
    async run(violations) {
      for (const name of await ownedFiles(['.ts'])) {
        const file = parse(await readFile(resolve(ROOT, name), 'utf8'), name);
        const visit = (node) => {
          const named = literalStrings(node).filter((value) => FAMILY_IDS.has(value));
          if (named.length >= TABLE_THRESHOLD) {
            violations.push({
              file: name,
              line: lineOf(file, node),
              reason:
                `writes ${named.length} Almanac family ids into a literal; the taxonomy is the ` +
                "package's 77 ids and this repository does not copy, extend or abbreviate it",
            });
          }
          ts.forEachChild(node, visit);
        };
        ts.forEachChild(file, visit);
      }
    },
  },
  {
    name: 'no derived family abbreviation and no per-family aggregate',
    async run(violations) {
      for (const name of await ownedFiles(['.ts'])) {
        const file = parse(await readFile(resolve(ROOT, name), 'utf8'), name);
        const visit = (node) => {
          if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
            const method = node.expression.name.text;
            const receiver = node.expression.expression.getText(file);
            const whole = node.getText(file);

            // Canvas 1d's `MC` chip. The Almanac publishes no abbreviation, so
            // any rule that produces one is this application shortening game
            // text — and it has no answer at all for the 19 families whose only
            // name is English (module-replacement design, "Withdrawn").
            //
            // Matched on the enclosing statement rather than on the receiver
            // alone, because one alias would otherwise defeat it: `const label =
            // family.name.text; label.slice(0, 2)` produces exactly the chip
            // this exists to stop and mentions no family anywhere near the call.
            if (SHORTENING.has(method) && (/family/i.test(receiver) || familyNear(file, node))) {
              violations.push({
                file: name,
                line: lineOf(file, node),
                reason: `derives a family abbreviation with "${method}"; the package's own family name ships whole`,
              });
            }

            // Canvas 1d's `15.1–28.4 DPS`. A min-max across a family is an
            // aggregate the Almanac does not publish, over figures that are
            // null for any choice it has no stats for (constitution IV).
            if (AGGREGATING.has(method) && (factsIn(whole) || factsNear(file, node))) {
              violations.push({
                file: name,
                line: lineOf(file, node),
                reason: `aggregates package figures with "${method}"; a range across a family is a value nobody published`,
              });
            }
          }

          if (
            ts.isCallExpression(node) &&
            ts.isPropertyAccessExpression(node.expression) &&
            node.expression.expression.getText(file) === 'Math' &&
            AGGREGATING.has(node.expression.name.text) &&
            (factsIn(node.getText(file)) || factsNear(file, node))
          ) {
            violations.push({
              file: name,
              line: lineOf(file, node),
              reason: `aggregates package figures with "Math.${node.expression.name.text}"; a range across a family is a value nobody published`,
            });
          }

          ts.forEachChild(node, visit);
        };
        ts.forEachChild(file, visit);
      }
    },
  },
  {
    name: 'Almanac subpath imports',
    async run(violations) {
      for (const name of await ownedFiles(['.ts'])) {
        const file = parse(await readFile(resolve(ROOT, name), 'utf8'), name);
        for (const entry of imports(file)) {
          if (!entry.specifier.startsWith('@elite-dangerous-almanac/core')) {
            continue;
          }
          const segments = entry.specifier.split('/').slice(2);
          if (segments.length < 2) {
            violations.push({
              file: name,
              line: lineOf(file, entry.node),
              reason: `imports the Almanac barrel "${entry.specifier}"; import the leaf subpath instead`,
            });
          }
        }
      }
    },
  },
  {
    name: 'no Almanac values inside components',
    async run(violations) {
      for (const name of await ownedFiles(['.ts'])) {
        const source = await readFile(resolve(ROOT, name), 'utf8');
        if (!source.includes('@Component')) {
          continue;
        }
        const file = parse(source, name);
        for (const entry of imports(file)) {
          if (entry.specifier.startsWith('@elite-dangerous-almanac/') && !entry.typeOnly) {
            violations.push({
              file: name,
              line: lineOf(file, entry.node),
              reason:
                'a component imports an Almanac value; components receive package results, they do not call the package',
            });
          }
        }
      }
    },
  },
  {
    name: 'no colour or pixel literals',
    async run(violations) {
      for (const name of await ownedFiles(['.scss'])) {
        const lines = (await readFile(resolve(ROOT, name), 'utf8')).split('\n');
        lines.forEach((line, index) => {
          const code = line.replace(/\/\/.*$/, '');
          if (COLOUR_LITERAL.test(code)) {
            violations.push({
              file: name,
              line: index + 1,
              reason: 'a colour written as a value; every colour comes from a token',
            });
          }
          if (PIXEL_LITERAL.test(code)) {
            violations.push({
              file: name,
              line: index + 1,
              reason: 'a length in pixels; every spacing and size step comes from a token',
            });
          }
        });
      }
    },
  },
  {
    name: 'no package module symbol in application source',
    async run(violations) {
      for (const name of await ownedFiles(['.ts'])) {
        const file = parse(await readFile(resolve(ROOT, name), 'utf8'), name);
        const visit = (node) => {
          if (ts.isStringLiteral(node) && MODULE_SYMBOL.test(node.text)) {
            violations.push({
              file: name,
              line: lineOf(file, node),
              reason: `names the package module symbol "${node.text}"; identities come from the package, never from a literal here`,
            });
          }
          ts.forEachChild(node, visit);
        };
        ts.forEachChild(file, visit);
      }
    },
  },
  {
    name: 'no raw modifier rewriting',
    async run(violations) {
      for (const name of await ownedFiles(['.ts'])) {
        const file = parse(await readFile(resolve(ROOT, name), 'utf8'), name);
        const visit = (node) => {
          if (
            ts.isBinaryExpression(node) &&
            node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
            ts.isPropertyAccessExpression(node.left) &&
            ['Modifiers', 'ExperimentalEffect', 'BlueprintName', 'Level', 'Quality'].includes(
              node.left.name.text,
            )
          ) {
            violations.push({
              file: name,
              line: lineOf(file, node),
              reason: `writes "${node.left.name.text}" directly; engineering is applied through the package's own operations`,
            });
          }
          ts.forEachChild(node, visit);
        };
        ts.forEachChild(file, visit);
      }
    },
  },
  {
    name: 'the tape reaches no serializer, codec or platform adapter',
    async run(violations) {
      for (const sealed of SEALED) {
        const target = resolve(ROOT, sealed);
        const info = await stat(target).catch(() => null);
        const files =
          info?.isDirectory() === true
            ? (await Array.fromAsync(walk(target))).map((path) => relative(ROOT, path))
            : info === null
              ? []
              : [sealed];
        for (const name of files) {
          if (extname(name) !== '.ts' || name.includes('.spec.')) {
            continue;
          }
          const file = parse(await readFile(resolve(ROOT, name), 'utf8'), name);
          for (const entry of imports(file)) {
            if (HISTORY_MODULES.some((module) => entry.specifier.includes(module))) {
              violations.push({
                file: name,
                line: lineOf(file, entry.node),
                reason:
                  'imports the session tape or a modelled checkpoint; storage, links and adapters observe the active build and never its history',
              });
            }
          }
        }
      }
    },
  },
];

export const check = () => runRules(RULES);

await runPolicy('outfitting ownership policy', check, import.meta.url);
