import { expect, test, type Page } from '@playwright/test';
import { PRODUCT_URL } from './servers';
import englishMessages from '../src/app/i18n/locales/en.json';
import germanMessages from '../src/app/i18n/locales/de.json';
import { openFirstHullFromManifest } from './shell';

/**
 * What this application says about itself to something that is not a Commander.
 *
 * A search engine, and a chat client unfurling a pasted link, read the head and
 * never the screen. Both were previously served the same four sentences for
 * four different screens. This is the journey that holds the head to the route
 * (011/FR-027, 011/SC-008).
 *
 * The static half — `robots.txt`, `sitemap.xml`, the manifest and the head as
 * `index.html` ships it — is reconciled against the route table and against
 * `SITE_ORIGIN` by the policy checker, which can compare files a browser cannot
 * see at once. What only a browser can answer is the half covered here: that
 * the tags are actually rewritten as a Commander moves between screens, in the
 * language the page is in, with the build kept out of the address.
 */

const SITE_ORIGIN = 'https://sb.edct.dev';

/**
 * One head value, once it has settled.
 *
 * Polled rather than read once. The tags are rewritten on the navigation the
 * route completes, which is not ordered against the frame that first paints
 * `main`; a crawler waits for a page to settle and so does this. Reading once
 * is how a passing assertion becomes an intermittent one.
 */
function head(page: Page, selector: string, attribute: string) {
  return expect.poll(() => page.locator(selector).first().getAttribute(attribute));
}

const description = (page: Page) => head(page, 'head meta[name="description"]', 'content');
const canonical = (page: Page) => head(page, 'head link[rel="canonical"]', 'href');

test.describe('what the head says this page is', () => {
  test('names the screen, not the product, on each addressable route', async ({ page }) => {
    await page.goto(`${PRODUCT_URL}/ships`);
    await expect(page.getByRole('main')).toBeVisible();
    await description(page).toBe(englishMessages['catalogue.description']);

    await page.goto(`${PRODUCT_URL}/builds`);
    await expect(page.getByRole('main')).toBeVisible();
    await description(page).toBe(englishMessages['library.description']);

    expect(englishMessages['catalogue.description']).not.toBe(
      englishMessages['library.description'],
    );
  });

  test('carries the route into the canonical address and both cards', async ({ page }) => {
    await page.goto(`${PRODUCT_URL}/builds`);
    await expect(page.getByRole('main')).toBeVisible();

    await canonical(page).toBe(`${SITE_ORIGIN}/builds`);
    await head(page, 'head meta[property="og:url"]', 'content').toBe(`${SITE_ORIGIN}/builds`);
    await head(page, 'head meta[property="og:description"]', 'content').toBe(
      englishMessages['library.description'],
    );

    const title = await page.title();
    await head(page, 'head meta[property="og:title"]', 'content').toBe(title);
    await head(page, 'head meta[name="twitter:title"]', 'content').toBe(title);
    expect(title).toContain(englishMessages['library.title']);
  });

  test('names the production site rather than wherever it is being served from', async ({
    page,
  }) => {
    await page.goto(`${PRODUCT_URL}/ships`);
    await expect(page.getByRole('main')).toBeVisible();

    await canonical(page).toBe(`${SITE_ORIGIN}/ships`);
    await canonical(page).not.toContain('localhost');
  });

  test('lets an open hull inherit the screen it sits inside', async ({ page }) => {
    await page.goto(`${PRODUCT_URL}/ships`);
    await openFirstHullFromManifest(page);
    await expect(page).toHaveURL(/\/ships\/[^/]+$/);

    await description(page).toBe(englishMessages['catalogue.description']);
    await canonical(page).toMatch(new RegExp(`^${SITE_ORIGIN}/ships/[^/]+$`));
  });

  test('keeps the build out of the address, because that is where it lives', async ({ page }) => {
    await page.goto(`${PRODUCT_URL}/ships`);
    await openFirstHullFromManifest(page);
    await page.getByRole('button', { name: 'Build stock hull' }).click();
    await expect(page).toHaveURL(/\/build#./);

    await canonical(page).toBe(`${SITE_ORIGIN}/build`);
  });

  test('is in the language the page is in', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'de-DE' });
    const page = await context.newPage();

    await page.goto(`${PRODUCT_URL}/ships`);
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');

    await description(page).toBe(germanMessages['catalogue.description']);
    await head(page, 'head meta[property="og:locale"]', 'content').toBe('de');

    await context.close();
  });

  test('is already in the document before anything runs', async ({ page }) => {
    // The head a reader that executes no script is served. Fetched rather than
    // navigated to, so the bundle never gets the chance to rewrite it.
    const response = await page.request.get(`${PRODUCT_URL}/index.html`);
    const document = await response.text();

    expect(document).toContain('<link rel="canonical"');
    expect(document).toContain('name="description"');
    expect(document).toContain('property="og:title"');
    expect(document).toContain('name="twitter:card"');
    expect(document).toContain('application/ld+json');
    expect(document).toContain('rel="manifest"');
  });
});
