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
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ROOT, filesUnder, lines, runPolicy, runRules } from './common.mjs';

/** Feature 010's own source. Every rule below applies inside these. */
export const OWNED = [
  'src/app/domain/ships/anatomy',
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

const RULES = [
  {
    name: 'no raw markup sink',
    async run(violations) {
      for (const name of await filesUnder(OWNED, ['.ts', '.html'])) {
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
      for (const name of await filesUnder(OWNED, ['.ts', '.html'])) {
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
      for (const name of await filesUnder(OWNED, ['.ts', '.html'])) {
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
      for (const name of await filesUnder(OWNED, ['.ts'])) {
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
      for (const name of await filesUnder(OWNED, ['.ts', '.html'])) {
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

export const check = () => runRules(RULES);

await runPolicy('anatomy ownership policy', check, import.meta.url);
