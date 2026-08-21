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

  it('adds ship artwork as feature 001’s only asset group', () => {
    const names = config.assetGroups.map((group) => group.name);

    assert.deepEqual(names, [
      'app-shell',
      'fonts-and-bundled-english',
      'translations',
      'ship-artwork',
    ]);
  });

  it('leaves feature 011’s app-shell and locale groups untouched', () => {
    const byName = Object.fromEntries(config.assetGroups.map((group) => [group.name, group]));

    assert.deepEqual(byName['app-shell'].resources.files, ['/index.html', '/*.css', '/*.js']);
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
