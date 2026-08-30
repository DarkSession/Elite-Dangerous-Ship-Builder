import { expect, test, type Page } from '@playwright/test';
import englishMessages from '../src/app/i18n/locales/en.json';
import { buildStockHull } from './shell';

/**
 * The hull schematics with no network (FR-009, FR-010).
 *
 * Runs only against a production build, because the thing under test is the
 * *generated* service worker: `ngsw-config.json` puts `/assets/ships/**` in a
 * lazy asset group, and whether that actually holds a side's picture and its
 * mount extract across a reload is not something a development server or a
 * route interception can answer. A test
 * that aborted the requests itself would prove the plate's failure wording and
 * nothing about the cache.
 *
 * What this spec covers is the cached half: a hull whose geometry has been seen
 * once comes back with it, and only that hull's own files are held.
 *
 * The **uncached** half is covered in `hull-anatomy.spec.ts`, across all ten
 * projects, by refusing the requests. That is deliberate and not a shortcut:
 * Playwright's offline emulation does not reach a Firefox service worker's own
 * fetches, so a hull nobody has opened loads perfectly well "offline" there —
 * an assertion that passed in Chromium and lied in Firefox would be worse than
 * no assertion. The behaviour under test is the application's, and refusing the
 * request is exactly what the network does.
 */

const SEEN = 'Anaconda';

async function waitForController(page: Page): Promise<void> {
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, {
    timeout: 30_000,
  });
}

async function openStockBuild(page: Page, hull: string): Promise<void> {
  await page.goto(`/ships/${hull}`);
  await buildStockHull(page, englishMessages['hullDetail.create']);
  await expect(page).toHaveURL(/\/build(#|$)/);
}

function plates(page: Page) {
  return page.locator('edsb-hull-anatomy .schematic');
}

test.describe('hull schematics offline', () => {
  test('come back from the versioned cache without a network', async ({ page, context }) => {
    await openStockBuild(page, SEEN);
    await expect(plates(page).first()).toHaveAttribute('data-state', 'ready');
    await waitForController(page);

    // A second load, so the worker serves rather than merely installs — in
    // Chromium it does not control the page it installed on.
    await page.reload();
    await waitForController(page);
    await openStockBuild(page, SEEN);
    await expect(plates(page).nth(1)).toHaveAttribute('data-state', 'ready');

    await context.setOffline(true);
    await openStockBuild(page, SEEN);

    // Both sides, from the cache, with nothing on the wire.
    await expect(plates(page)).toHaveCount(2);
    await expect(plates(page).nth(0)).toHaveAttribute('data-state', 'ready');
    await expect(plates(page).nth(1)).toHaveAttribute('data-state', 'ready');
    expect(await page.locator('edsb-hull-anatomy .schematic__mount').count()).toBeGreaterThan(0);

    await context.setOffline(false);
  });

  test('cache the schematics of the hull that was opened, and no other', async ({ page }) => {
    await openStockBuild(page, SEEN);
    await expect(plates(page).first()).toHaveAttribute('data-state', 'ready');
    await waitForController(page);
    await page.reload();
    await waitForController(page);
    await openStockBuild(page, SEEN);
    await expect(plates(page).nth(1)).toHaveAttribute('data-state', 'ready');

    const cached = await page.evaluate(async () => {
      const names = await caches.keys();
      const found: string[] = [];
      for (const name of names) {
        const cache = await caches.open(name);
        for (const request of await cache.keys()) {
          if (request.url.includes('/assets/ships/') && request.url.endsWith('.json')) {
            found.push(new URL(request.url).pathname);
          }
        }
      }
      return found;
    });

    // Lazy, so only what was asked for: one hull's two sides, never the
    // catalogue's ninety-six extracts fetched on the chance someone opens them.
    expect(cached.some((path) => path.includes(`/assets/ships/${SEEN}/`))).toBe(true);
    expect(cached.every((path) => path.includes(`/assets/ships/${SEEN}/`))).toBe(true);
  });
});
