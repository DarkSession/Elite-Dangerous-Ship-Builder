#!/usr/bin/env node
// Extracts the mount geometry out of the Almanac's hull schematics.
//
// The plates need three things from a schematic: the box the file declares, the
// rectangle it actually draws in, and the middle of every annotated feature
// that names a journal slot. That is a few hundred bytes. The file it comes out
// of is ninety kilobytes of sub-pixel path data, and fetching all of it in a
// Commander's browser to read sixteen coordinates is ninety kilobytes spent on
// nothing — the drawing itself is served as the PNG that
// `scripts/convert-ship-artwork.mjs` renders.
//
// So the package contract is checked here, once, against the installed package,
// and what ships is the extract. A file outside the contract fails this script
// rather than reaching anyone: `parseSchematic` refuses it and this exits
// non-zero naming the hull and the side.
//
// The parser is the application's own — imported directly, not reimplemented —
// so the promise being checked and the geometry being written can never drift.
// It wants a DOM, which node does not have, so jsdom supplies one.
//
// The output is committed under `public/assets/ships/<symbol>/schematic-*.json`
// beside the rasterised drawing, so the application build stays hermetic: this
// script is how the files are reproduced, not a step the build depends on.
// Re-run it after moving the package pin; `pnpm run policy` fails if the
// committed extract was made from a different file than the installed one.
//
//   node scripts/extract-schematic-mounts.mts

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
(globalThis as unknown as { DOMParser: unknown }).DOMParser = dom.window.DOMParser;

const { parseSchematic } = await import('../src/app/platform/assets/schematic-svg-parser.ts');

const SOURCE_ROOT = 'node_modules/@elite-dangerous-almanac/core/assets/ships';
const TARGET_ROOT = 'public/assets/ships';
const SIDES = ['top', 'bottom'] as const;

/**
 * Three decimals.
 *
 * The package's own coordinates carry four, and halving them leaves a tail of
 * binary noise that would otherwise be written out as twenty digits per number.
 * A thousandth of a drawing unit is a ten-thousandth of a hull.
 */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

const symbols = readdirSync(SOURCE_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const refused: string[] = [];
let written = 0;

for (const symbol of symbols) {
  for (const side of SIDES) {
    const file = join(SOURCE_ROOT, symbol, `schematic-${side}.svg`);
    if (!existsSync(file)) {
      refused.push(`${symbol}/${side}: no schematic in the installed package`);
      continue;
    }

    const svg = readFileSync(file, 'utf8');
    const parsed = parseSchematic(svg, side, symbol);
    if (parsed === null) {
      refused.push(`${symbol}/${side}: outside the package contract`);
      continue;
    }

    const directory = join(TARGET_ROOT, symbol);
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      join(directory, `schematic-${side}.json`),
      `${JSON.stringify(
        {
          symbol,
          side,
          viewBox: parsed.viewBox,
          // The installed file this was made from. `pnpm run policy` recomputes
          // it, so an extract left behind by a package upgrade is a failed
          // check rather than a hull whose mounts are quietly in the wrong
          // place.
          source: createHash('sha256').update(svg).digest('hex'),
          content: {
            x: round(parsed.content.x),
            y: round(parsed.content.y),
            width: round(parsed.content.width),
            height: round(parsed.content.height),
          },
          mounts: parsed.annotations.map((annotation) => ({
            feature: annotation.feature,
            slot: annotation.journalSlot,
            x: round(annotation.centre.x),
            y: round(annotation.centre.y),
          })),
        },
        null,
        1,
      )}\n`,
      'utf8',
    );
    written += 1;
  }
}

if (refused.length > 0) {
  for (const line of refused) {
    process.stderr.write(`${line}\n`);
  }
  process.stderr.write(
    `\n${refused.length} schematic(s) were not extracted. A package file outside the ` +
      `contract is a library defect and is fixed in the library.\n`,
  );
  process.exit(1);
}

process.stdout.write(`extracted ${written} schematics from ${symbols.length} hulls\n`);
