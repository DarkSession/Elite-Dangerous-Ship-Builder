#!/usr/bin/env node
/**
 * Repository policy checks for feature 004's own source.
 *
 * SLEF is a boundary onto somebody else's format, and every rule below is about
 * a line that would quietly move that boundary. A second parser still parses. A
 * surface reaching `navigator` still copies. A feature 001 file importing this
 * one still compiles — and turns "feature 004 composes into feature 001" into a
 * cycle nobody meant to write.
 *
 * None of these can be a type or a unit test: a rule proven by the absence of a
 * line has no call site to test. Exit code 0 means every rule passed; a
 * violation prints its file, line and reason.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

/** Feature 004's own source. Every rule below applies inside these. */
export const OWNED = [
  'src/app/domain/slef',
  'src/app/application/slef',
  'src/app/features/slef',
  'src/app/platform/build',
];

/** The surfaces. They render an immutable view and emit intents; that is all. */
export const OWNED_SURFACES = ['src/app/features/slef'];

/**
 * The directories that must not depend on feature 004.
 *
 * Feature 004 composes into feature 001's hosts, reads feature 001's snapshot
 * and calls feature 002's ingress gate. All three arrows point one way. An
 * import back the other way makes the two features one, and the next person to
 * read either has to hold both (plan, "Delivery Prerequisites").
 */
export const UPSTREAM = [
  'src/app/domain/build',
  'src/app/application/active-build',
  'src/app/application/build-link',
  'src/app/features/build-workspace',
  'src/app/features/ship-catalogue',
  'src/app/features/hull-detail',
  'src/app/features/build-library',
];

/**
 * The Almanac leaves this feature composes.
 *
 * Named rather than left open, because "import what you need" is how a
 * calculation leaf ends up in a bundle that only needed a record shape — and
 * how the whole barrel ends up in a bundle that needed one function
 * (constitution II, AGENTS.md).
 */
export const ALLOWED_ALMANAC_LEAVES = [
  '@elite-dangerous-almanac/core/ships/slef',
  '@elite-dangerous-almanac/core/ships/ship-loadout',
  '@elite-dangerous-almanac/core/ships/modules',
  '@elite-dangerous-almanac/core/i18n/diagnostics',
  // Type-only. `LoadoutIssueParams` and the validation record are shapes the two
  // leaves above return; a `import type` emits nothing, so the bundle rule in
  // the suite still sees only the four runtime leaves.
  '@elite-dangerous-almanac/core/ships/loadout-validation',
  // Test fixtures only, and never reached from a product path: discovering the
  // package's own largest hull is what keeps SC-004 from measuring a hull
  // somebody wrote down.
  '@elite-dangerous-almanac/core/ships/ships',
];

/** Every Almanac import, so the specifier can be checked against the list. */
export const ALMANAC_IMPORT = /from\s+'(@elite-dangerous-almanac\/core[^']*)'/g;

/**
 * Browser and package reach a surface may not have.
 *
 * A component that can measure bytes, build a Blob or ask the package anything
 * is a component that can disagree with the coordinator about what was
 * exported. The ports exist so exactly one place does each of these
 * (routes-and-ui contract, "Intent boundary").
 */
export const SURFACE_FORBIDDEN = [
  '@elite-dangerous-almanac/core',
  'TextEncoder',
  'navigator',
  'Blob',
  'URL.createObjectURL',
  '.store',
  'localStorage',
  'sessionStorage',
];

/** Anything that would outlive the session. Feature 004 owns no storage key. */
export const PERSISTENCE = [
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'document.cookie',
  'history.pushState',
  'history.replaceState',
];

/**
 * A second reader of the format.
 *
 * The package inspects; the application does not. `JSON.parse` on a draft is
 * the exact "mock parser" the reference review rejected, and a trim is the
 * heuristic that makes the bytes measured differ from the bytes inspected
 * (import contract, "Package boundary").
 */
export const PRIVATE_PARSER = ['JSON.parse', 'JSON.stringify'];

/**
 * The deprecated clipboard path.
 *
 * `document.execCommand('copy')` works by selecting and mutating the document,
 * reports success for a call the browser may have done nothing with, and is
 * removed from the platform. A copy that "succeeded" without anything reaching
 * the clipboard is the fabricated success FR-004 exists to forbid, so there is
 * no fallback to it (browser-delivery contract, "Clipboard").
 */
export const DEPRECATED_CLIPBOARD = ['execCommand'];

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

/** Every file under a set of paths, excluding specs, fixtures and test helpers. */
export async function filesUnder(paths, extensions, { includeTests = false } = {}) {
  const files = [];
  for (const owned of paths) {
    for await (const path of walk(resolve(ROOT, owned))) {
      const name = relative(ROOT, path);
      if (!includeTests && (name.includes('.spec.') || name.includes('/testing/'))) {
        continue;
      }
      if (extensions.includes(extname(path))) {
        files.push(name);
      }
    }
  }
  return [...new Set(files)].sort();
}

/**
 * Finds every line carrying one of a set of forbidden strings.
 *
 * Block documentation is skipped and nothing else is, for the same reason
 * feature 010's checker skips it: these files explain themselves largely by
 * naming what they refuse to do, and a rule that read the prose would report
 * the sentence about `navigator` as a use of `navigator`. `policy-allow:` on a
 * line covers anything else.
 */
export function lines(source, matches) {
  const found = [];
  source.split('\n').forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('*') || trimmed.startsWith('/**') || line.includes('policy-allow:')) {
      return;
    }
    for (const match of matches) {
      const hit = typeof match === 'string' ? line.includes(match) : match.test(line);
      if (hit) {
        found.push({ line: index + 1, match: typeof match === 'string' ? match : String(match) });
      }
    }
  });
  return found;
}

/** Every feature-004 import found in a source file, with its line. */
export function featureImports(source) {
  const found = [];
  source.split('\n').forEach((line, index) => {
    // A path segment named `slef`, which the package's own leaf — which ends
    // at `.../ships/slef` with no trailing segment — deliberately is not.
    if (/from\s+'[^']*slef\/[^']*'/.test(line)) {
      found.push({ line: index + 1 });
    }
  });
  return found;
}

/** Every Almanac specifier a source imports, with its line. */
export function almanacImports(source) {
  const found = [];
  source.split('\n').forEach((line, index) => {
    for (const match of line.matchAll(new RegExp(ALMANAC_IMPORT.source, 'g'))) {
      found.push({ line: index + 1, specifier: match[1] });
    }
  });
  return found;
}

const RULES = [
  {
    name: 'nothing upstream imports feature 004',
    async run(violations) {
      for (const name of await filesUnder(UPSTREAM, ['.ts'], { includeTests: true })) {
        const source = await readFile(resolve(ROOT, name), 'utf8');
        for (const hit of featureImports(source)) {
          violations.push({
            file: name,
            line: hit.line,
            reason:
              'feature 001 or 002 imports feature 004; the exchange layers compose into those hosts, and an import the other way makes the two one feature',
          });
        }
      }
    },
  },
  {
    name: 'the Almanac is reached only through its named leaves',
    async run(violations) {
      for (const name of await filesUnder(OWNED, ['.ts'], { includeTests: true })) {
        const source = await readFile(resolve(ROOT, name), 'utf8');
        for (const hit of almanacImports(source)) {
          if (ALLOWED_ALMANAC_LEAVES.includes(hit.specifier)) {
            continue;
          }
          violations.push({
            file: name,
            line: hit.line,
            reason: `"${hit.specifier}" is not one of the leaves this feature composes; a barrel or a calculation leaf pulls in code this boundary does not need`,
          });
        }
      }
    },
  },
  {
    name: 'no surface reaches the package, the browser or a store',
    async run(violations) {
      for (const name of await filesUnder(OWNED_SURFACES, ['.ts', '.html'])) {
        const source = await readFile(resolve(ROOT, name), 'utf8');
        for (const hit of lines(source, SURFACE_FORBIDDEN)) {
          violations.push({
            file: name,
            line: hit.line,
            reason: `"${hit.match}" reaches past the surface; a component renders an immutable view and emits intents, and every package, byte, blob and state effect belongs to the coordinator behind it`,
          });
        }
      }
    },
  },
  {
    name: 'feature 004 declares no storage key',
    async run(violations) {
      for (const name of await filesUnder(OWNED, ['.ts'])) {
        const source = await readFile(resolve(ROOT, name), 'utf8');
        for (const hit of lines(source, PERSISTENCE)) {
          violations.push({
            file: name,
            line: hit.line,
            reason: `"${hit.match}" outlives the session; a draft, a candidate and an artifact describe an exchange in progress and are never restored`,
          });
        }
      }
    },
  },
  {
    name: 'no deprecated clipboard fallback',
    async run(violations) {
      for (const name of await filesUnder([...OWNED, 'src/app/platform/browser'], ['.ts'])) {
        if (name.endsWith('.spec.ts')) {
          continue;
        }
        const source = await readFile(resolve(ROOT, name), 'utf8');
        for (const hit of lines(source, DEPRECATED_CLIPBOARD)) {
          violations.push({
            file: name,
            line: hit.line,
            reason: `"${hit.match}" is the deprecated clipboard path; it reports a success the browser may not have performed, and a copy that cannot be observed is not a copy that can be announced`,
          });
        }
      }
    },
  },
  {
    name: 'no private reader of the format',
    async run(violations) {
      for (const name of await filesUnder(OWNED, ['.ts'])) {
        const source = await readFile(resolve(ROOT, name), 'utf8');
        for (const hit of lines(source, PRIVATE_PARSER)) {
          violations.push({
            file: name,
            line: hit.line,
            reason: `"${hit.match}" reads or writes the format here; inspection and serialization belong to the package, and a second reader is what makes the bytes measured differ from the bytes inspected`,
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
      ? 'slef ownership policy: no violations'
      : `slef ownership policy: ${violations.length} violation(s)`,
  );
  process.exit(violations.length === 0 ? 0 : 1);
}
