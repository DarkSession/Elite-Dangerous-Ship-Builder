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
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

/** Feature 002's own source. Every rule below applies inside these. */
export const OWNED = [
  'src/app/application/outfitting',
  'src/app/domain/outfitting',
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
  'src/app/domain/build/build-snapshot.serializer.ts',
  'src/app/domain/build/stored-build.serializer.ts',
  'src/app/domain/build-link',
  'src/app/platform',
];

/** What a checkpoint or tape is called, wherever it is imported from. */
const HISTORY_MODULES = ['session-edit-history', 'modeled-build-checkpoint'];

/** The package's own module symbols. Application code never names one. */
const MODULE_SYMBOL = /^(?:Int_|Hpt_|Armour_)/i;

/** Colour written as a value rather than taken from a token. */
const COLOUR_LITERAL = /(#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|color-mix)\s*\()/i;

/** A length in pixels. Every spacing and size step is a token here. */
const PIXEL_LITERAL = /(?<![\w-])-?\d*\.?\d+px\b/;

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

const RULES = [
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
      ? 'outfitting ownership policy: no violations'
      : `outfitting ownership policy: ${violations.length} violation(s)`,
  );
  process.exit(violations.length === 0 ? 0 : 1);
}
