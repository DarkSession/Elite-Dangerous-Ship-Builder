#!/usr/bin/env node
// Renders the application's own marks: the icons a browser wants before it
// offers installation, and the image a link preview shows.
//
// One source drawing — `.design/assets/nav-beacon-mark.svg` — and one ground
// colour, read from the token layer rather than typed in again, because the
// policy checker holds `theme-color`, the manifest and the tokens to the same
// value and an asset drawn on a different black would be the one place the
// three agree and the picture does not (constitution VII).
//
// **The card carries no words.** A 1200x630 image with `SHIP BUILDER` baked
// into it is display text this application owns, in one language, in a file no
// translation can reach (constitution VI). The card is the mark on the ground;
// the words beside it in an unfurl are the title and the description, which are
// translated, and `og:image:alt` says what the picture is in the same language.
//
// The rasteriser is Chromium through the Playwright install this repository
// already carries, exactly as `convert-ship-artwork.mjs` rasterises the hulls.
// The output is committed, so the application build stays hermetic: this script
// is how the files are reproduced, not a step the build depends on. Re-run it
// when the mark or the ground changes.
//
//   node scripts/generate-brand-assets.mjs
//
// There is no `--check`, deliberately, and for the reason the schematic
// pipeline gives: a rendering carries no digest and is not compared. Two
// Chromium builds draw the same page into different bytes, so a byte comparison
// would fail a build for the browser it ran on rather than for the mark it drew.
// What is checked instead is what a wrong answer here actually costs — the
// policy checker refuses a manifest naming an icon that is not in `public/`.

import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * The drawing every asset here is a rendering of.
 *
 * The plain variant rather than `-header` or `-light`: its domes are filled
 * with `--ednb-palette-bg`, which is the ground every asset here is drawn on,
 * so the mark meets it without a seam (canvas 6d, "APPROVED MARK").
 */
export const MARK_SOURCE = '.design/assets/nav-beacon-mark.svg';

/** The one file permitted to state the colour the application is drawn on. */
export const TOKENS = 'src/styles/tokens/_primitives.scss';

/**
 * What is rendered, at what size, and how much of it the mark fills.
 *
 * `inset` is the share of the canvas the mark occupies. A plain icon fills most
 * of its square; a maskable one fills the middle 60%, because a platform may
 * crop it to a circle and everything outside that circle has to be ground it
 * can lose. The card is the same mark small on a wide field, which is what a
 * consumer scales down into a thumbnail.
 */
export const ASSETS = [
  { file: 'public/assets/icons/app-icon-192.png', width: 192, height: 192, inset: 0.86 },
  { file: 'public/assets/icons/app-icon-512.png', width: 512, height: 512, inset: 0.86 },
  {
    file: 'public/assets/icons/app-icon-maskable-512.png',
    width: 512,
    height: 512,
    inset: 0.6,
  },
  { file: 'public/assets/icons/apple-touch-icon.png', width: 180, height: 180, inset: 0.8 },
  { file: 'public/assets/link-card.png', width: 1200, height: 630, inset: 0.42 },
];

/**
 * The sizes packed into `public/favicon.ico`, largest first.
 *
 * An `.ico` rather than the `.svg` a modern browser would prefer, because the
 * manifest declares this file at `48x48` and the head links it as the one icon
 * every browser understands. The sizes are the three a browser picks between: a
 * tab, a bookmark bar and a shortcut. The mark fills more of these than it does
 * of an application icon — there is no launcher padding to leave at 16 pixels.
 */
export const ICO_SIZES = [48, 32, 16];
export const ICO_FILE = 'public/favicon.ico';
export const ICO_INSET = 0.92;

/**
 * The ground, taken from the token that draws it.
 *
 * Read rather than declared: `--ednb-palette-bg` is what the application is
 * painted on, what `theme-color` reports and what the manifest colours an
 * installed window with, and the checker already refuses those three drifting
 * apart. An asset rendered here joins that set.
 */
export function groundColour(tokens) {
  const declared = /--ednb-palette-bg:\s*(#[0-9a-f]{3,8})\b/i.exec(tokens);
  if (declared === null) {
    throw new Error(`${TOKENS} declares no --ednb-palette-bg to draw the marks on.`);
  }
  return declared[1];
}

/**
 * The document one asset is a screenshot of.
 *
 * Written as one page per asset rather than one page cropped several ways: a
 * browser scales a 512-pixel drawing down to 192 far better than a screenshot
 * of a screenshot does, so every size is rendered from the source drawing.
 */
export function markup({ width, height, inset, ground, mark }) {
  const size = Math.round(Math.min(width, height) * inset);
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; padding: 0; }
      body {
        width: ${width}px;
        height: ${height}px;
        background: ${ground};
        display: flex;
        align-items: center;
        justify-content: center;
      }
      img { width: ${size}px; height: ${size}px; image-rendering: auto; }
    </style>
  </head>
  <body><img src="${mark}" alt="" /></body>
</html>`;
}

/** Renders every asset, returning the bytes rather than writing them. */
async function render() {
  const tokens = await readFile(join(ROOT, TOKENS), 'utf8');
  const ground = groundColour(tokens);

  const markPath = join(ROOT, MARK_SOURCE);
  if (!existsSync(markPath)) {
    throw new Error(`${MARK_SOURCE} is missing; there is no mark to render.`);
  }
  const type = MARK_SOURCE.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  const mark = `data:${type};base64,${(await readFile(markPath)).toString('base64')}`;

  // The same escape hatch the end-to-end suite has, for the same reason: an
  // environment whose preinstalled browser is not the build Playwright pins is
  // pointed at its executable rather than made to download a second one
  // (README, "If your environment already ships a browser").
  const executablePath = process.env['E2E_CHROMIUM_PATH'];
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  try {
    const rendered = new Map();
    const icon = [];
    const wanted = [
      ...ASSETS,
      ...ICO_SIZES.map((size) => ({ width: size, height: size, inset: ICO_INSET })),
    ];
    for (const asset of wanted) {
      const page = await browser.newPage({
        viewport: { width: asset.width, height: asset.height },
        deviceScaleFactor: 1,
      });
      await page.setContent(markup({ ...asset, ground, mark }), { waitUntil: 'load' });
      // The drawing is a data URI, so it is decoded rather than fetched — but
      // decoding is still asynchronous, and a screenshot taken before it lands
      // is a rectangle of ground with nothing on it.
      await page
        .locator('img')
        .evaluate((image) => (image instanceof HTMLImageElement ? image.decode() : null));
      const bytes = await page.screenshot({ type: 'png' });
      if (asset.file === undefined) icon.push({ size: asset.width, bytes });
      else rendered.set(asset.file, bytes);
      await page.close();
    }
    rendered.set(ICO_FILE, packIcon(icon));
    return rendered;
  } finally {
    await browser.close();
  }
}

/**
 * The `.ico` container: a six-byte header, one sixteen-byte entry per size, and
 * the PNG renderings themselves.
 *
 * PNG payloads rather than the format's own bitmaps — every browser that is
 * offered this application reads them, and a 48-pixel bitmap with its own
 * palette and mask is a second encoder to get wrong. A size of 256 would be
 * written as `0`; nothing here is that large.
 */
export function packIcon(entries) {
  const header = Buffer.alloc(6 + entries.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  let offset = header.length;
  entries.forEach(({ size, bytes }, index) => {
    const at = 6 + index * 16;
    header.writeUInt8(size === 256 ? 0 : size, at);
    header.writeUInt8(size === 256 ? 0 : size, at + 1);
    header.writeUInt8(0, at + 2);
    header.writeUInt8(0, at + 3);
    header.writeUInt16LE(1, at + 4);
    header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(bytes.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += bytes.length;
  });

  return Buffer.concat([header, ...entries.map(({ bytes }) => bytes)]);
}

async function main() {
  const rendered = await render();

  for (const [file, bytes] of rendered) {
    const path = join(ROOT, file);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
    console.log(`${file} (${bytes.length} bytes)`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
