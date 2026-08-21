import { expect, test, type Page } from '@playwright/test';
import { PRODUCT_URL } from './servers';

/**
 * The offline journey (US3).
 *
 * Runs only against a production build, because a service worker only exists
 * there. What is under test is the promise FR-019 makes: complete English is
 * readable with no network at all, and a browser-matched language that has been
 * loaded once stays readable afterwards.
 *
 * Everything cached is a same-origin static asset. No build, saved record or
 * Commander datum is ever cached, because none of it is ever requested
 * (constitution I).
 */

/** Waits until a service worker is actually controlling the page. */
async function waitForController(page: Page): Promise<void> {
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, {
    timeout: 30_000,
  });
}

test.describe('offline', () => {
  test('reads completely with no network at all', async ({ page, context }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
    await waitForController(page);

    // A second load, so the worker serves rather than merely installs.
    await page.reload();
    await expect(page.getByRole('main')).toBeVisible();

    await context.setOffline(true);
    await page.reload();

    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await context.setOffline(false);
  });

  test('keeps a browser-matched language readable after one online load', async ({ browser }) => {
    // The browser language setting is the only locale input, so German is
    // reached by asking for a German browser rather than by choosing it.
    // `browser.newContext` inherits none of the project's test options, so the
    // base URL has to be handed over explicitly or `goto('/')` has nothing to
    // resolve against.
    const context = await browser.newContext({ baseURL: PRODUCT_URL, locale: 'de-DE' });
    const page = await context.newPage();

    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await waitForController(page);

    // A second load, so the worker serves rather than merely installs — in
    // Chromium it does not control the page it installed on.
    await page.reload();
    await expect(page.getByRole('main')).toBeVisible();

    await context.setOffline(true);
    await page.reload();

    // The German catalogue is in the lazy asset group's cache from the load
    // above, so the interface comes back in German rather than falling back.
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');

    await context.close();
  });

  test('owns exactly one service worker registration', async ({ page }) => {
    await page.goto('/');
    await waitForController(page);

    const registrations = await page.evaluate(async () => {
      const all = await navigator.serviceWorker.getRegistrations();
      return all.map((registration) => registration.scope);
    });

    expect(registrations.length).toBe(1);
  });

  test('caches nothing from another origin', async ({ page }) => {
    await page.goto('/');
    await waitForController(page);

    const foreign = await page.evaluate(async () => {
      const names = await caches.keys();
      const urls: string[] = [];
      for (const name of names) {
        const cache = await caches.open(name);
        for (const request of await cache.keys()) {
          urls.push(request.url);
        }
      }
      return urls.filter((url) => new URL(url).origin !== location.origin);
    });

    expect(foreign).toEqual([]);
  });
});
