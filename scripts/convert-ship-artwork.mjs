#!/usr/bin/env node
// Rasterises the Almanac's hull illustrations and schematics to PNG.
//
// The package ships one `illustration.svg` and two `schematic-*.svg` per hull.
// Those files are large vector drawings — hundreds of kilobytes of path data
// each, with several hundred sub-pixel strokes — and the browser re-rasterises
// one on every resize of a fixed-ratio plate. A PNG at the plate's own
// resolution is a fraction of the work to draw, and the reference's own
// artboards use PNGs.
//
// **A schematic PNG is a rendering, not a geometry catalogue.** Every mount's
// identity and position comes out of the same SVG, through the application's
// own parser, in `scripts/extract-schematic-mounts.mts` — run that after this
// one, and after every package pin move. The PNG is drawn inside the `viewBox`
// that extract records, so the drawing and the marks over it stay in one
// coordinate space (feature 010, FR-003 and FR-009).
//
// The rasteriser is the browser, through the Playwright install this repository
// already carries. That is not incidental: the drawings are built from ~350
// strokes of 0.7 units in a 1200-unit viewBox, and a general-purpose SVG
// rasteriser drops them, which turns a shaded hull into a flat white silhouette
// — visibly brighter once the amber artwork filter is over it. Rendering in the
// same engine that draws the application keeps the hull looking the way the SVG
// looked.
//
// The render is then quantised to an 8-bit palette with ImageMagick, which
// takes a hull from ~240 kB to ~37 kB without moving its mean tone.
//
// The output is committed under `public/assets/ships/<symbol>/illustration.png`
// so the application build stays hermetic: this script is how the files are
// reproduced, not a step the build depends on. Re-run it after upgrading the
// package pin. It needs ImageMagick's `convert` on PATH; the application build
// does not.
//
//   node scripts/convert-ship-artwork.mjs

import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE_ROOT = 'node_modules/@elite-dangerous-almanac/core/assets/ships';
const TARGET_ROOT = 'public/assets/ships';

/** Wide enough for the inspector plate at 2x on the widest composition. */
const WIDTH = 900;
const HEIGHT = 600;

/**
 * The schematics, at their own 3:2 proportion.
 *
 * The plate turns a hull a quarter turn, so what ends up across the plate is
 * this height rather than this width. 1200 of them over a plate that is at most
 * ~700 CSS pixels wide is a comfortable 2x.
 */
const SCHEMATIC_WIDTH = 1800;
const SCHEMATIC_HEIGHT = 1200;

/** One SVG rendered at one size, quantised, written where the application looks. */
async function rasterise(page, source, target, width, height) {
  const svg = readFileSync(source, 'utf8');
  await page.setViewportSize({ width, height });
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:transparent}` +
      `svg{display:block;width:${width}px;height:${height}px}</style>${svg}`,
  );
  writeFileSync(target, await page.screenshot({ omitBackground: true }));
  execFileSync('convert', [target, '-strip', `PNG8:${target}`]);
}

const symbols = readdirSync(SOURCE_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
});

let converted = 0;
let schematics = 0;
for (const symbol of symbols) {
  const source = join(SOURCE_ROOT, symbol, 'illustration.svg');
  if (!existsSync(source)) {
    process.stderr.write(`no illustration for ${symbol}\n`);
    continue;
  }

  const directory = join(TARGET_ROOT, symbol);
  mkdirSync(directory, { recursive: true });
  await rasterise(page, source, join(directory, 'illustration.png'), WIDTH, HEIGHT);
  converted += 1;

  for (const side of ['top', 'bottom']) {
    const schematic = join(SOURCE_ROOT, symbol, `schematic-${side}.svg`);
    if (!existsSync(schematic)) {
      process.stderr.write(`no ${side} schematic for ${symbol}\n`);
      continue;
    }
    await rasterise(
      page,
      schematic,
      join(directory, `schematic-${side}.png`),
      SCHEMATIC_WIDTH,
      SCHEMATIC_HEIGHT,
    );
    schematics += 1;
  }
}

await browser.close();
process.stdout.write(
  `converted ${converted} of ${symbols.length} hull illustrations and ${schematics} schematics\n`,
);
