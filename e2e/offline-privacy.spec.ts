import { expect, test, type Page } from '@playwright/test';
import { applyDraft, chooseRecipe, openEditor } from './outfitting-surfaces';
import { openFirstHullFromManifest } from './shell';

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

  test('reads the offence analysis with no network at all', async ({ page, context }) => {
    await withWorker(page, '/ships/Anaconda');
    await page.getByRole('button', { name: 'Build stock hull' }).click();

    await context.setOffline(true);

    // The whole capability is a synchronous read of an in-memory loadout and an
    // installed package, so opening the mode, moving the target range and
    // changing the WEP allocation all work with the network gone.
    await page
      .locator('edsb-hull-anatomy .anatomy__modes button')
      .filter({ hasText: 'Offence' })
      .click();
    await expect(page.locator('edsb-offence-analysis .offence')).toBeVisible();

    const shots = page.locator('edsb-offence-analysis .shots__entry');
    const before = await shots.allInnerTexts();
    await page.locator('edsb-offence-analysis input[type="range"]').fill('2000');
    await expect.poll(() => shots.allInnerTexts()).not.toEqual(before);

    await expect(page.locator('edsb-offence-analysis .bars--range .bar')).toHaveCount(4);
    const capacitor = page.locator('edsb-offence-analysis .bars--capacitor .bar');
    await expect(capacitor).toHaveCount(4);

    // The one condition this panel reads from another feature's store. Setting
    // it goes through the `POWER` mode's own control and comes back, so the
    // whole round trip is proven to need no network either.
    const recharge = capacitor.nth(1).locator('.bar__value');
    const chargedAt = await recharge.innerText();
    await page
      .locator('edsb-hull-anatomy .anatomy__modes button')
      .filter({ hasText: 'Power' })
      .click();
    await expect(page.locator('edsb-power-thermals')).toBeVisible();
    await page.locator('.distributor tbody tr').nth(2).locator('.pips__step').first().click();
    await page
      .locator('edsb-hull-anatomy .anatomy__modes button')
      .filter({ hasText: 'Offence' })
      .click();
    await expect(page.locator('edsb-offence-analysis .offence')).toBeVisible();
    await expect.poll(() => recharge.innerText()).not.toBe(chargedAt);

    await context.setOffline(false);
  });

  test('reads the cost and material blocks with no network at all', async ({ page, context }) => {
    await withWorker(page, '/ships/Anaconda');
    await page.getByRole('button', { name: 'Build stock hull' }).click();
    await expect(page.locator('edsb-cost-materials .cost__row')).toHaveCount(4);

    await context.setOffline(true);

    // Both blocks are a synchronous read of an in-memory loadout and an
    // installed package, so they are not merely still painted with the network
    // gone — they still answer an edit. Engineering a mount is what proves it:
    // the materials block is absent for a build that crafts nothing, and it has
    // to be built from the package's consolidated result to appear at all
    // (feature 009, quickstart scenario 6).
    const credits = await page.locator('edsb-cost-materials .cost__value').allInnerTexts();
    await expect(page.locator('edsb-cost-materials .rail-material')).toHaveCount(0);

    const mount = page.locator('[data-slot-key="FrameShiftDrive"] button').first();
    await mount.click();
    await expect(mount).toHaveAttribute('aria-pressed', 'true');
    await openEditor(page);
    await chooseRecipe(page, /Increased Range/i);
    await applyDraft(page);

    const rows = page.locator('edsb-cost-materials .rail-material');
    await expect(rows.first()).toBeVisible();

    // The footer counts the rows beside it, and it counted them here, offline.
    const footer = await page.locator('edsb-cost-materials .block__footer span').allInnerTexts();
    expect(footer).toHaveLength(2);
    expect(Number(footer[0]?.replaceAll(/\D/gu, ''))).toBe(await rows.count());

    // The credit figures are expected *not* to move: a blueprint is paid for in
    // materials, and a module's catalogue price is what it is whether or not it
    // has been engineered. Stated rather than left implicit, because a reader
    // who assumed otherwise would read the line above as a bug.
    expect(await page.locator('edsb-cost-materials .cost__value').allInnerTexts()).toEqual(credits);

    // The material names and rarities came from the installed package, not from
    // a fetch: a rarity mark drawn from another origin is exactly what
    // constitution I forbids, and offline is where that would show.
    await expect(rows.locator('edsb-material-grade').first()).toHaveAttribute(
      'data-grade',
      /^[1-5]$/,
    );

    await context.setOffline(false);
  });

  test('reads Drives & Mass with no network at all', async ({ page, context }) => {
    await withWorker(page, '/ships/Anaconda');
    await page.getByRole('button', { name: 'Build stock hull' }).click();

    await context.setOffline(true);

    // Every figure on both cards is a synchronous read of an in-memory loadout
    // and an installed package, so opening the mode draws the whole region with
    // the network gone — the headline mass, the three-part split, the position
    // on the curve, the five-reading envelope and the three ranges.
    await page
      .locator('edsb-hull-anatomy .anatomy__modes button')
      .filter({ hasText: 'Drives' })
      .click();
    await expect(page.locator('edsb-drives-mass .drives')).toBeVisible();
    await expect(page.locator('edsb-drives-mass .drives__headline-mass')).toHaveText(/\d/u);
    await expect(page.locator('edsb-drives-mass .drives__curve-position')).toHaveText(/\d/u);
    // The thruster card's own legend, which is three rows whatever the build
    // carries. The drive card's legend beside it is not counted here: its total
    // range row is drawn only where the package states one, so a count over
    // both would turn this offline test red for a reason about the package.
    await expect(
      page.locator('edsb-drives-mass .drives__card:first-child .drives__legend-value'),
    ).toHaveCount(3);
    await expect(page.locator('edsb-drives-mass .drives__envelope-value')).toHaveCount(5);
    await expect(page.locator('edsb-drives-mass .drives__range')).toHaveCount(3);

    // The one condition these cards read from another feature's store. Setting
    // it goes through the `POWER` mode's own control and comes back, so the
    // whole round trip is proven to need no network either.
    const speed = page.locator('edsb-drives-mass .drives__envelope-value').first();
    const before = await speed.innerText();
    await page
      .locator('edsb-hull-anatomy .anatomy__modes button')
      .filter({ hasText: 'Power' })
      .click();
    await expect(page.locator('edsb-power-thermals')).toBeVisible();
    await page.locator('.distributor tbody tr').nth(1).locator('.pips__step').first().click();
    await page
      .locator('edsb-hull-anatomy .anatomy__modes button')
      .filter({ hasText: 'Drives' })
      .click();
    await expect(page.locator('edsb-drives-mass .drives')).toBeVisible();
    await expect.poll(() => speed.innerText()).not.toBe(before);

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
    await openFirstHullFromManifest(page);
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
