/**
 * Feature-boundary regression: one service worker, one owner.
 *
 * Feature 011 registers the application's only worker and owns its app-shell
 * and locale asset groups. Feature 001 contributes exactly one thing to that
 * configuration — the lazy group for the hull illustrations it copies to the
 * application origin — and nothing else. A second registration, or a feature
 * quietly widening someone else's cache group, is what this catches.
 *
 * It reads the real repository rather than a fixture, because the rule is about
 * what this repository actually ships.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rules } from './check-interface-foundations.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

/** Every TypeScript source under `src/`, as `{ [path]: contents }`. */
async function productSources() {
  const contents = {};

  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(path);
      } else if (entry.name.endsWith('.ts')) {
        contents[relative(ROOT, path).split('\\').join('/')] = await readFile(path, 'utf8');
      }
    }
  }

  await walk(resolve(ROOT, 'src'));
  return contents;
}

const config = JSON.parse(await readFile(resolve(ROOT, 'ngsw-config.json'), 'utf8'));

describe('service-worker ownership across features', () => {
  it('keeps exactly one registration, in feature 011’s application config', async () => {
    const sources = await productSources();
    const registering = Object.keys(sources).filter((file) =>
      sources[file].includes('provideServiceWorker('),
    );

    assert.deepEqual(registering, ['src/app/app.config.ts']);
  });

  it('passes the repository’s own ownership rule', async () => {
    const found = rules.serviceWorkerOwnershipViolations(await productSources(), config);

    assert.deepEqual(found, []);
  });

  it('falls back to a document that states nothing, for every address', () => {
    // The clause feature 015 rests on, and the one this file exists to keep.
    //
    // The worker answers every navigation it cannot match from `index`. Before
    // 015 that was `/index.html` and it was harmless, because every body was an
    // empty `<app-root>`. `index.html` is now the start page's own rendered
    // document, so a fallback still pointing at it would paint the start page's
    // content on a repeat or offline visit to any hull — and Angular would then
    // replace it with the hull's, which is content changing after the first
    // frame (015/FR-009, `contracts/address-set.md` §3).
    assert.equal(config.index, '/index.csr.html');
  });

  it('answers a navigation from the network first, so a returning Commander gets the document', () => {
    // Nothing else asserts this, and without it the feature is invisible to
    // everyone who has visited before.
    //
    // The default is `performance`, which is cache-first: the first visit would
    // fetch the generated document from the network and every visit after it
    // would get the cached shell instead. That is legal, and it would hand back
    // today's empty first frame to precisely the people who use the application
    // most — silently, with no test failing and no line in a diff to notice
    // (015/FR-014).
    //
    // Offline is unaffected: `freshness` falls back to the cache when the
    // network does not answer, so every capability stays usable with no network
    // (constitution I, 015/FR-013).
    assert.equal(config.navigationRequestStrategy, 'freshness');
  });

  it('adds ship artwork as feature 001’s only asset group', () => {
    const names = config.assetGroups.map((group) => group.name);

    assert.deepEqual(names, [
      'app-shell',
      'fonts-and-bundled-english',
      'translations',
      'icons-and-marks',
      'ship-artwork',
    ]);
  });

  it('prefetches the marks and the loader with the shell they are drawn in', () => {
    // 56kB of icons, the artwork loader and the favicon. They are chrome rather
    // than content: an acquisition mark, a material grade, the engineered ring
    // — every screen draws some of them, so waiting to meet one before fetching
    // it is a request on the way in for a file already smaller than the fetch
    // (Commander request 2026-08-26). Prefetched, they are in the version's own
    // cache before anything is drawn and stay there until a version replaces it.
    const icons = config.assetGroups.find((group) => group.name === 'icons-and-marks');

    assert.equal(icons.installMode, 'prefetch');
    assert.equal(icons.updateMode, 'prefetch');
    assert.deepEqual(icons.resources.files, [
      '/assets/icons/**',
      '/assets/loader.svg',
      '/favicon.ico',
    ]);
  });

  it('caches every static asset the build ships, and nothing by response', () => {
    // The rule the Commander asked for: what is cached is cleared by a version
    // and by nothing else. Every group here is an `assetGroup`, which the worker
    // keys by the build's own hash manifest and drops only when a new version
    // takes over; a `dataGroup` would cache responses on a clock or a count
    // instead, and the ownership rule already refuses one.
    const files = config.assetGroups.flatMap((group) => group.resources.files);

    assert.ok(files.includes('/assets/icons/**'));
    assert.ok(files.includes('/assets/ships/**'));
    assert.ok(files.includes('/fonts/**'));
    assert.equal(config.dataGroups, undefined);
  });

  it('leaves feature 011’s app-shell and locale groups untouched', () => {
    const byName = Object.fromEntries(config.assetGroups.map((group) => [group.name, group]));

    // `/index.csr.html` rather than `/index.html` since feature 015. The shell
    // moved off `index.html` because `index.html` became the root's own
    // rendered document — Pages resolves `/` to that file and to no other, so
    // the content-free file had to be the one that moved.
    assert.deepEqual(byName['app-shell'].resources.files, [
      '/index.csr.html',
      '/manifest.webmanifest',
      '/*.css',
      '/*.js',
    ]);
    assert.deepEqual(byName['fonts-and-bundled-english'].resources.files, [
      '/fonts/**',
      '/i18n/en.json',
    ]);
    assert.deepEqual(byName['translations'].resources.files, ['/i18n/*.json']);
  });

  it('caches hull artwork lazily from the application’s own origin', () => {
    const artwork = config.assetGroups.find((group) => group.name === 'ship-artwork');

    assert.equal(artwork.installMode, 'lazy');
    assert.deepEqual(artwork.resources.files, ['/assets/ships/**']);
  });
});
