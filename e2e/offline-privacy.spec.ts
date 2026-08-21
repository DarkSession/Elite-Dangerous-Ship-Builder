import { expect, test, type Page } from '@playwright/test';

/**
 * Offline capability and the privacy promise (US1, US2, US3).
 *
 * Runs only against a production build, because a service worker only exists
 * there. Two things are under test and they are related: what this application
 * can still do with no network, and what it never sends when it has one.
 *
 * The rule the illustration journeys are about is that artwork is decoration
 * with a text equivalent. A hull whose picture cannot be fetched can still be
 * read, compared and built from — anything else would make a Commander's
 * connection a condition of using the shipyard (FR-006).
 */

/** Waits until a service worker is actually controlling the page. */
async function waitForController(page: Page): Promise<void> {
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, {
    timeout: 30_000,
  });
}

/** Loads a page twice, so the worker serves rather than merely installs. */
async function withWorker(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await expect(page.getByRole('main')).toBeVisible();
  await waitForController(page);
  await page.reload();
  await expect(page.getByRole('main')).toBeVisible();
}

/** Whether the hull illustration is currently painted. */
async function illustrationLoaded(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const image = document.querySelector<HTMLImageElement>('.artwork__image');
    return image !== null && image.complete && image.naturalWidth > 0;
  });
}

test.describe('offline capability', () => {
  test('reads the shell and bundled English with no network at all', async ({ page, context }) => {
    await withWorker(page, '/ships');

    await context.setOffline(true);
    await page.reload();

    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Shipyard' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    // The catalogue is installed with the package rather than fetched, so every
    // hull is still there.
    await expect(page.locator('[data-hull-symbol]:visible')).toHaveCount(48);

    await context.setOffline(false);
  });

  test('keeps an illustration that has been seen once', async ({ page, context }) => {
    await withWorker(page, '/ships/Anaconda');
    await expect.poll(() => illustrationLoaded(page), { timeout: 10_000 }).toBe(true);

    await context.setOffline(true);
    await page.reload();

    await expect(page.getByRole('heading', { level: 2, name: 'Anaconda' })).toBeVisible();
    await expect.poll(() => illustrationLoaded(page), { timeout: 10_000 }).toBe(true);

    await context.setOffline(false);
  });

  /*
   * Two more illustration journeys belong to this contract and live in
   * `hull-detail.spec.ts` instead: an illustration that cannot be fetched
   * blocking nothing, and recovering it on retry without a reload. Neither
   * needs a service worker, so keeping them there runs them in all ten layout
   * and engine projects rather than only in this production-only suite.
   */
});

test.describe('the privacy promise', () => {
  test('reaches no other origin and caches nothing of a build', async ({ page }) => {
    const foreign: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== new URL(page.url() || '/', 'http://x').origin) {
        foreign.push(request.url());
      }
    });

    await withWorker(page, '/ships');
    await page
      .locator('[data-hull-symbol]:visible')
      .first()
      .getByRole('button', { name: /View / })
      .click();
    await page.getByRole('button', { name: 'Build stock hull' }).click();
    await expect(page).toHaveURL(/\/build(#|$)/);
    await page.goto('/builds');

    const origin = new URL(page.url()).origin;
    expect(foreign.filter((url) => new URL(url).origin !== origin)).toEqual([]);

    const cached = await page.evaluate(async () => {
      const urls: string[] = [];
      for (const name of await caches.keys()) {
        const cache = await caches.open(name);
        for (const request of await cache.keys()) {
          urls.push(request.url);
        }
      }
      return urls;
    });

    // Only same-origin static assets, and never anything carrying a build.
    expect(cached.filter((url) => new URL(url).origin !== origin)).toEqual([]);
    expect(cached.filter((url) => url.includes('#b.') || url.includes('edsb:record'))).toEqual([]);
  });
});
