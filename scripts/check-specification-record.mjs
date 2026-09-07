#!/usr/bin/env node
/**
 * Repository policy checks that read the specification record.
 *
 * Four things in this repository are written down twice: once in
 * `openspec/`, where a requirement is accepted, and once in the code that has
 * to answer for it. Each pair is reconciled by a rule below, and each rule
 * fails the build rather than letting the two drift.
 *
 * | Reconciled                                                   | Rule |
 * | ------------------------------------------------------------ | ---- |
 * | A declared requirement and the ledger that evidences it        | `unregistered-requirement` |
 * | A help topic and the requirement or principle it answers from  | `unresolved-governing-reference` |
 * | A conformance claim in the record and its excluded criteria    | `unqualified-conformance-claim` |
 * | The help route ledger and the screen inventory it transcribes  | `screen-inventory` |
 *
 * They are here rather than in the checkers that used to hold them because of
 * what reads what. A rule that reads `openspec/` makes a change to a
 * specification able to fail the checker, the generated help artifacts, the
 * build that emits them and the end-to-end suite that runs against it. Held
 * here, the whole of that coupling is one script: the product policy, the
 * generated artifacts and the suites read the product alone, and a pull request
 * that touches only the record runs this and the formatter (`.github/workflows/
 * ci.yml`, the `Specification record` job).
 *
 * Nothing here loads a compiler except the TypeScript parser that reads the
 * coverage ledger, so the lane stays cheap enough to be the whole gate for a
 * specification change.
 *
 * Exit code 0 means every rule passed. Any violation prints its file, line and
 * the reason.
 */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { conformanceClaimViolations } from './conformance-claims.mjs';
import { HELP_TOPIC_DEFINITIONS } from './help-topic-definitions.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

/** Source of truth for what this checker reads, on both sides of every pair. */
export const SCOPE = {
  /** Where the capability specifications live. */
  specs: 'openspec/specs',
  /** Every document of the record, accepted and archived alike. */
  record: ['openspec/specs', 'openspec/changes'],
  /** The constitution, which declares the numbered principles. */
  constitution: 'CONSTITUTION.md',
  /** The end-to-end coverage ledger, which registers what evidences what. */
  ledger: 'e2e/coverage-ledger.ts',
  /** The screen inventory the help route ledger transcribes. */
  screenInventory: 'openspec/changes/archive/012-help-and-licences/design/screen-inventory.md',
};

const violations = [];

/** Every file under `directory` with one of the given extensions. */
async function walk(directory, extensions) {
  const absolute = resolve(ROOT, directory);
  if (!existsSync(absolute)) {
    return [];
  }
  const found = [];
  for (const entry of await readdir(absolute, { withFileTypes: true })) {
    const path = join(absolute, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      found.push(...(await walk(path, extensions)));
    } else if (extensions.includes(extname(entry.name))) {
      found.push(path);
    }
  }
  return found;
}

/** One repository-relative path, with forward slashes on every platform. */
function repoPath(file) {
  return relative(ROOT, file).split('\\').join('/');
}

/** Every capability specification, in a stable order. */
async function specificationFiles() {
  return (await walk(SCOPE.specs, ['.md']))
    .filter((file) => file.endsWith('spec.md'))
    .sort((left, right) => repoPath(left).localeCompare(repoPath(right)));
}

// ---------------------------------------------------------------------------
// Rule: every declared requirement is registered in the coverage ledger
// ---------------------------------------------------------------------------

/** The feature directories the ledger source declares it covers. */
function coveredFeatures(ledgerSource) {
  const match = ledgerSource.match(/COVERED_FEATURES[^=]*=\s*\[([^\]]*)\]/);
  return new Set([...(match?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]));
}

/**
 * Requirement ids a capability specification *declares*.
 *
 * A requirement states the feature and id it was accepted under on a trailing
 * `Source: 011/FR-011, 011/SC-003.` line, and that line is the declaration.
 * Matching the trace rather than a bare mention keeps the rule the same one it
 * has always been: a requirement quoted in passing does not register itself,
 * and a withdrawn id carries no trace, so it demands no evidence.
 */
function declaredRequirementIds(specSource) {
  return specSource
    .split('\n')
    .filter((line) => /^\s*Source:/.test(line))
    .flatMap((line) => [...line.matchAll(/\d{3}\/(?:FR|SC)-\d{3}/g)].map((match) => match[0]));
}

/**
 * Ids the ledger registers.
 *
 * Only ids inside a `requirements` array count. Scanning the whole file would
 * let an id mentioned in a comment register itself, which is exactly the silent
 * coverage the ledger exists to prevent.
 */
function registeredRequirementIds(ledgerSource) {
  return new Set(
    [...ledgerSource.matchAll(/requirements\s*:\s*\[([^\]]*)\]/g)].flatMap((block) =>
      [...block[1].matchAll(/'(\d{3}\/(?:FR|SC)-\d{3})'/g)].map((match) => match[1]),
    ),
  );
}

/**
 * Compares declared ids against registered ones.
 *
 * `declared` is a list of `{ id, file }`. Ids are feature-qualified, so one
 * feature's coverage can never satisfy another's.
 */
function ledgerCoverageViolations(declared, ledgerSource, ledgerFile) {
  const registered = registeredRequirementIds(ledgerSource);
  const unregistered = [...new Map(declared.map((entry) => [entry.id, entry.file])).entries()]
    .filter(([id]) => !registered.has(id))
    .map(([id, file]) => `${id} (${file})`)
    .sort();

  if (unregistered.length === 0) {
    return [];
  }
  return [
    {
      file: ledgerFile,
      line: 1,
      rule: 'unregistered-requirement',
      message: `These declared ids are not registered in the coverage ledger: ${unregistered.join('; ')}.`,
    },
  ];
}

/** IO wrapper. */
async function checkLedgerCoverage() {
  const ledgerFile = SCOPE.ledger;
  const ledgerPath = resolve(ROOT, ledgerFile);
  const ledger = existsSync(ledgerPath) ? await readFile(ledgerPath, 'utf8') : '';

  const covered = coveredFeatures(ledger);
  if (covered.size === 0) {
    violations.push({
      file: ledgerFile,
      line: 1,
      rule: 'unregistered-requirement',
      message:
        'The coverage ledger declares no covered features, so no requirement can be verified as registered.',
    });
    return;
  }

  // The ledger names feature directories; a trace names the feature number.
  const coveredNumbers = new Set([...covered].map((directory) => directory.split('-')[0]));

  const declared = [];
  for (const file of await specificationFiles()) {
    const source = await readFile(file, 'utf8');
    for (const id of declaredRequirementIds(source)) {
      if (!coveredNumbers.has(id.split('/')[0])) {
        continue;
      }
      declared.push({ id, file: repoPath(file) });
    }
  }

  violations.push(...ledgerCoverageViolations(declared, ledger, ledgerFile));
}

// ---------------------------------------------------------------------------
// Rule: every help topic answers from something this repository accepted
// ---------------------------------------------------------------------------

/**
 * Resolves one governing reference against the artifact that declares it.
 *
 * A help answer is a claim this application makes about itself, and the only
 * thing separating a useful one from a confident invention is whether anything
 * accepted actually says it. A requirement is matched on its declaration form —
 * the trailing `Source: 001/FR-008.` line a capability requirement carries — and
 * not merely on the string appearing somewhere. A withdrawn id carries no trace,
 * and a paragraph that mentions one in passing is not a declaration, so neither
 * can govern a help answer.
 *
 * `specs` is `{ [file]: contents }`. Returns the artifact and anchor the
 * reference resolved to, or `null` with the reason it did not.
 */
export function resolveGoverningReference(reference, { constitution, specs }) {
  if (reference.kind === 'principle') {
    if (constitution === null) {
      return { resolved: null, reason: `${SCOPE.constitution} is missing.` };
    }
    if (!new RegExp(`^### ${reference.numeral}\\.\\s`, 'm').test(constitution)) {
      return {
        resolved: null,
        reason: `principle ${reference.numeral} is not declared in ${SCOPE.constitution}.`,
      };
    }
    return { resolved: `${SCOPE.constitution}#${reference.numeral}`, reason: null };
  }

  if (reference.kind !== 'requirement') {
    return { resolved: null, reason: `${reference.kind} is not a kind of governing reference.` };
  }

  const files = Object.keys(specs);
  if (files.length === 0) {
    return { resolved: null, reason: `${SCOPE.specs} declares no capability specification.` };
  }

  const trace = `${reference.feature.split('-')[0]}/${reference.id}`;
  // The id ends where the trace does. `002/FR-002` must not resolve against a
  // trace that carries only `002/FR-002a`, which is a different requirement.
  const declares = new RegExp(`${trace.replace('/', '\\/')}(?![0-9a-z])`);
  for (const file of files) {
    const declared = specs[file]
      .split('\n')
      .some((line) => /^\s*Source:/.test(line) && declares.test(line));
    if (declared) {
      return { resolved: `${file}#${trace}`, reason: null };
    }
  }
  return {
    resolved: null,
    reason: `${trace} is not a declared requirement. A withdrawn or reassigned id cannot govern a help answer.`,
  };
}

/**
 * Every topic resolves every reference it cites.
 *
 * `definitions` is the tooling-only declaration in
 * `scripts/help-topic-definitions.mjs`. The emitter checks that a topic cites
 * something; this rule checks that what it cites exists.
 */
export function governingReferenceViolations(definitions, sources) {
  const found = [];
  for (const definition of definitions) {
    for (const reference of definition.governedBy ?? []) {
      const { reason } = resolveGoverningReference(reference, sources);
      if (reason !== null) {
        found.push({
          file: 'scripts/help-topic-definitions.mjs',
          line: 1,
          rule: 'unresolved-governing-reference',
          message: `Help topic "${definition.id}" answers from something nothing declares: ${reason}`,
        });
      }
    }
  }
  return found;
}

/** IO wrapper. */
async function checkGoverningReferences() {
  const constitutionPath = resolve(ROOT, SCOPE.constitution);
  const constitution = existsSync(constitutionPath)
    ? await readFile(constitutionPath, 'utf8')
    : null;

  const specs = {};
  for (const file of await specificationFiles()) {
    specs[repoPath(file)] = await readFile(file, 'utf8');
  }

  violations.push(...governingReferenceViolations(HELP_TOPIC_DEFINITIONS, { constitution, specs }));
}

// ---------------------------------------------------------------------------
// Rule: no unqualified WCAG 2.2 AA claim anywhere in the record
// ---------------------------------------------------------------------------

/**
 * The whole record, deliberately.
 *
 * A specification that claims the target for its own surfaces is a statement
 * about those surfaces, and an unqualified one there is as strong a claim as an
 * unqualified one in the README. A per-feature list is a rule that does not
 * point at the files most likely to break it: an amendment to the excluded set
 * is carried through the guarded directories and silently missed everywhere
 * else, which leaves the constitution asserting one number and three dozen
 * documents enumerating another.
 */
async function checkConformanceClaims() {
  const contents = {};
  for (const directory of SCOPE.record) {
    for (const file of await walk(directory, ['.md'])) {
      contents[repoPath(file)] = await readFile(file, 'utf8');
    }
  }

  violations.push(...conformanceClaimViolations(contents));
}

// ---------------------------------------------------------------------------
// Rule: the help route ledger and the screen inventory agree, both ways
// ---------------------------------------------------------------------------

/** One literal node as the value it is. Anything else is left out. */
function literalValue(node) {
  if (ts.isStringLiteralLike(node)) {
    return node.text;
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map(literalValue).filter((value) => value !== undefined);
  }
  return undefined;
}

/**
 * The `helpRouteCoverage` rows, read from the ledger's own syntax tree.
 *
 * Parsed rather than matched, because a row carries comments between its
 * properties and a regular expression that survived those would be a parser
 * written badly.
 */
export function transcribedHelpRoutes(ledgerSource) {
  const file = ts.createSourceFile(
    'coverage-ledger.ts',
    ledgerSource,
    ts.ScriptTarget.Latest,
    true,
  );

  let rows = null;
  const visit = (node) => {
    if (
      rows === null &&
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'helpRouteCoverage' &&
      node.initializer !== undefined &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      rows = node.initializer.elements.filter(ts.isObjectLiteralExpression).map((element) => {
        const row = {};
        for (const property of element.properties) {
          if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) {
            continue;
          }
          const value = literalValue(property.initializer);
          if (value !== undefined) {
            row[property.name.text] = value;
          }
        }
        return row;
      });
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(file);

  return rows ?? [];
}

/**
 * The Release coverage ledger table, as the screen inventory writes it.
 *
 * The document is the record and the export transcribes it, so this reads the
 * document rather than restating it: a copy here would be a third thing to keep
 * in step, and it would agree with whichever of the other two it was last
 * edited beside.
 */
export function documentedHelpRoutes(inventorySource) {
  const heading = inventorySource.indexOf('## Release coverage ledger');
  if (heading < 0) {
    return [];
  }
  const section = inventorySource.slice(heading);
  const start = section.indexOf('| Capability / surface');
  if (start < 0) {
    return [];
  }

  return section
    .slice(start)
    .split('\n')
    .filter((line) => line.startsWith('|'))
    .map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim()),
    )
    .filter((cells) => cells.length === 4 && !/^-+$/.test(cells[0] ?? ''))
    .slice(1)
    .map(([surface, owner, frameEntry, applies]) => ({
      // Backticks are the document's code formatting around a route, not part
      // of the surface's name.
      surface: (surface ?? '').replace(/`/g, ''),
      owner: owner ?? '',
      frameEntry: frameEntry ?? '',
      applies: [...(applies ?? '').matchAll(/FR-\d{3}/g)].map((match) => match[0]).sort(),
    }));
}

/**
 * Compares the two in both directions.
 *
 * The export transcribes the ledger; it does not re-derive it. So the check is
 * equality rather than containment: a row in the document and not in the code is
 * an untested claim, and a row in the code and not in the document is a claim
 * nobody wrote down. Both are the drift the ledger exists to prevent.
 */
export function screenInventoryViolations(transcribed, documented, { file, document }) {
  const fail = (message) => [{ file, line: 1, rule: 'screen-inventory', message }];

  if (documented.length === 0) {
    return fail(`The Release coverage ledger table was not found in ${document}.`);
  }

  const normalise = (rows) =>
    rows
      .map((row) => JSON.stringify(row))
      .sort()
      .map((entry) => JSON.parse(entry));

  const fromCode = normalise(
    transcribed.map((row) => ({
      surface: row.surface,
      owner: row.owner,
      // The document writes the dismissible half of the state in prose; the
      // export carries the state alone, because the dismissal is a property of
      // every layer rather than of this ledger.
      frameEntry: row.frameEntry === 'obscured' ? 'obscured, dismissible' : row.frameEntry,
      applies: [...(row.requirements ?? [])].map((id) => id.replace('012/', '')).sort(),
    })),
  );
  const fromDocument = normalise(documented);

  const key = (row) => JSON.stringify(row);
  const documentedKeys = new Set(fromDocument.map(key));
  const codeKeys = new Set(fromCode.map(key));

  const untested = fromDocument.filter((row) => !codeKeys.has(key(row)));
  const unwritten = fromCode.filter((row) => !documentedKeys.has(key(row)));
  if (untested.length === 0 && unwritten.length === 0) {
    return [];
  }

  const name = (row) =>
    `${row.surface} (${row.owner}, ${row.frameEntry}, ${row.applies.join(' ')})`;
  const parts = [];
  if (untested.length > 0) {
    parts.push(`only in ${document}: ${untested.map(name).join('; ')}`);
  }
  if (unwritten.length > 0) {
    parts.push(`only in helpRouteCoverage: ${unwritten.map(name).join('; ')}`);
  }
  return fail(`The two disagree — ${parts.join(', and ')}.`);
}

/** IO wrapper. */
async function checkScreenInventory() {
  const ledgerPath = resolve(ROOT, SCOPE.ledger);
  const documentPath = resolve(ROOT, SCOPE.screenInventory);
  if (!existsSync(ledgerPath) || !existsSync(documentPath)) {
    violations.push({
      file: existsSync(ledgerPath) ? SCOPE.screenInventory : SCOPE.ledger,
      line: 1,
      rule: 'screen-inventory',
      message: 'One side of the reconciliation is missing, so nothing was compared.',
    });
    return;
  }

  violations.push(
    ...screenInventoryViolations(
      transcribedHelpRoutes(await readFile(ledgerPath, 'utf8')),
      documentedHelpRoutes(await readFile(documentPath, 'utf8')),
      { file: SCOPE.ledger, document: SCOPE.screenInventory },
    ),
  );
}

// ---------------------------------------------------------------------------

/** Runs every rule and returns the violations found. */
export async function runChecks() {
  violations.length = 0;

  await checkLedgerCoverage();
  await checkGoverningReferences();
  await checkConformanceClaims();
  await checkScreenInventory();

  return [...violations];
}

/** The rules as pure functions, so fixtures can drive them without a filesystem. */
export const rules = {
  ledgerCoverageViolations,
  declaredRequirementIds,
  registeredRequirementIds,
  coveredFeatures,
  resolveGoverningReference,
  governingReferenceViolations,
  transcribedHelpRoutes,
  documentedHelpRoutes,
  screenInventoryViolations,
};

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const found = await runChecks();
  if (found.length === 0) {
    process.stdout.write('specification record policy: no violations\n');
    process.exit(0);
  }

  process.stderr.write(`specification record policy: ${found.length} violation(s)\n\n`);
  for (const violation of found) {
    process.stderr.write(
      `  ${violation.file}:${violation.line}  [${violation.rule}]\n    ${violation.message}\n`,
    );
  }
  process.stderr.write('\n');
  process.exit(1);
}
