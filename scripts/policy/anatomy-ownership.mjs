#!/usr/bin/env node
/**
 * Repository policy checks for feature 010's own source.
 *
 * This capability renders a file the application did not write, at coordinates
 * the application must not read, for a hull whose mounts belong to somebody
 * else's model. Three boundaries, each of which fails silently if it is
 * crossed: markup injected instead of parsed still renders, a measured
 * coordinate still positions something, and a hand-written slot-key table still
 * matches the pinned package until it does not.
 *
 * Every rule here is about something that must not appear anywhere, which is
 * why none of them can be a type or a unit test — a rule proven by the absence
 * of a line has no call site to test. Exit code 0 means every rule passed; a
 * violation prints its file, line and reason.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

/** Feature 010's own source. Every rule below applies inside these. */
export const OWNED = [
  'src/app/domain/anatomy',
  'src/app/application/anatomy',
  'src/app/platform/assets',
  'src/app/features/build-workspace/outfitting/hull-anatomy',
  'src/app/ui/outfitting/hull-schematic.ts',
  'src/app/ui/outfitting/hull-schematic.html',
];

/**
 * Ways a string can become markup instead of being parsed into a tree.
 *
 * The parser exists so a package file is admitted element by element against an
 * allowlist. Every sink below skips it: the browser builds the tree from the
 * string, and whatever the file contained is what renders.
 */
export const MARKUP_SINKS = [
  'innerHTML',
  'outerHTML',
  'insertAdjacentHTML',
  'bypassSecurityTrustHtml',
  'document.write',
  '<object',
  '<iframe',
  '<embed',
  '<foreignObject',
];

/**
 * Ways to read a coordinate off the drawing.
 *
 * FR-003 says identity and geometry come from the package and the application
 * measures nothing. A measurement is how an offset icon, a convergence line or
 * a stored centre gets built — each of which is a game assertion the drawing
 * was never asked to make.
 */
export const MEASUREMENTS = [
  'getBBox',
  'getScreenCTM',
  'getCTM',
  'getBoundingClientRect',
  'getComputedTextLength',
  'getTotalLength',
  'getPointAtLength',
];

/** A package slot key written down. The package is what enumerates these. */
export const SLOT_KEY_LITERAL =
  /(['"`])(?:Tiny|Small|Medium|Large|Huge)Hardpoint\d+\1|(['"`])Slot\d{2}_Size\d\2/;

/** Anything that would outlive the session. Side, selection and scroll are memory. */
export const PERSISTENCE = [
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'history.pushState',
  'history.replaceState',
  'document.cookie',
];

/**
 * A hard-coded destination. Routes and help live where their features own them.
 *
 * The W3C namespace URIs are the one exception, and they are not destinations:
 * `http://www.w3.org/2000/svg` is the name of the SVG language, compared
 * against and never fetched. Refusing it would mean the parser could not tell
 * an SVG document from anything else with the same root element.
 */
export const HARDCODED_LOCATION = /(['"`])(?:https?:\/\/(?!www\.w3\.org\/)|\/help\b)/;

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

/** Every file under the owned paths, excluding specs and fixtures. */
async function ownedFiles(extensions) {
  const files = [];
  for (const owned of OWNED) {
    for await (const path of walk(resolve(ROOT, owned))) {
      const name = relative(ROOT, path);
      if (name.includes('.spec.') || name.includes('.fixtures.')) {
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
 * Block documentation is skipped and nothing else is. A `/** … *\/` comment
 * explains the code, and this feature's files explain themselves largely by
 * naming what they refuse to do — a rule that read them would report the
 * sentence "there is no `innerHTML` here" as an `innerHTML`. A `//` line beside
 * code is not that: it is usually code somebody turned off, which is exactly
 * what these rules are for. `policy-allow:` on a line covers anything else.
 */
function lines(source, matches) {
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

const RULES = [
  {
    name: 'no raw markup sink',
    async run(violations) {
      for (const name of await ownedFiles(['.ts', '.html'])) {
        const source = await readFile(resolve(ROOT, name), 'utf8');
        for (const hit of lines(source, MARKUP_SINKS)) {
          violations.push({
            file: name,
            line: hit.line,
            reason: `"${hit.match}" builds a tree from a string; the package document is parsed against an allowlist and refused, never injected`,
          });
        }
      }
    },
  },
  {
    name: 'no geometry measurement',
    async run(violations) {
      for (const name of await ownedFiles(['.ts', '.html'])) {
        const source = await readFile(resolve(ROOT, name), 'utf8');
        for (const hit of lines(source, MEASUREMENTS)) {
          violations.push({
            file: name,
            line: hit.line,
            reason: `"${hit.match}" measures the drawing; identity and geometry come from the package and nothing is derived from it (FR-003)`,
          });
        }
      }
    },
  },
  {
    name: 'no slot-key table',
    async run(violations) {
      for (const name of await ownedFiles(['.ts', '.html'])) {
        const source = await readFile(resolve(ROOT, name), 'utf8');
        for (const hit of lines(source, [SLOT_KEY_LITERAL])) {
          violations.push({
            file: name,
            line: hit.line,
            reason:
              'a package slot key is written down; the hull enumerates its own mounts and a hand-maintained mapping stops tracking the package (FR-003)',
          });
        }
      }
    },
  },
  {
    name: 'nothing anatomy owns is persisted',
    async run(violations) {
      for (const name of await ownedFiles(['.ts'])) {
        const source = await readFile(resolve(ROOT, name), 'utf8');
        for (const hit of lines(source, PERSISTENCE)) {
          violations.push({
            file: name,
            line: hit.line,
            reason: `"${hit.match}" outlives the session; the shown side, the selection and the scroll position are presentation memory and nothing else`,
          });
        }
      }
    },
  },
  {
    name: 'no hard-coded destination',
    async run(violations) {
      for (const name of await ownedFiles(['.ts', '.html'])) {
        const source = await readFile(resolve(ROOT, name), 'utf8');
        for (const hit of lines(source, [HARDCODED_LOCATION])) {
          violations.push({
            file: name,
            line: hit.line,
            reason:
              'a route or another origin is written down; artwork provenance belongs to the help capability and the application reaches no other origin',
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
      ? 'anatomy ownership policy: no violations'
      : `anatomy ownership policy: ${violations.length} violation(s)`,
  );
  process.exit(violations.length === 0 ? 0 : 1);
}
