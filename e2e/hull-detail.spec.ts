import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import {
  expectNoDocumentOverflow,
  expectNoRawMessages,
  expectOrderedHeadings,
  expectSingleVisibleH1,
} from './accessibility/assertions';
import { openHullFromManifest, reachShellLink, savedToBrowser } from './shell';

/**
 * Inspecting a hull, and asking for a stock build.
 *
 * The two things this journey is really about: that every figure the reference
 * inspector carries is shown with the unit it is measured in, and that nothing
 * is created until a Commander asks — and then only after anything unsaved has
 * been accounted for.
 *
 * The reference inspector carries eight figures, the mount classes and one
 * price. Four of the eight are drawn bare, because the reference gives them no
 * unit: hardness, crew, mass lock and armour.
 */

const ANACONDA = '/ships/Anaconda';

/** Every figure the reference inspector carries, with the unit it shows. */
const FACTS: readonly (readonly [label: string, unit: string])[] = [
  ['Speed', 'm/s'],
  ['Boost', 'm/s'],
  ['Shield', 'MJ'],
  ['Hull mass', 't'],
];

/** The figures the reference draws bare, with no unit beside them. */
const BARE_FACTS: readonly string[] = ['Armour', 'Hardness', 'Crew', 'Mass lock'];

const detail = (page: Page) => page.getByRole('article').first();

/**
 * The screen's text, folded for comparison.
 *
 * Several labels are presented in capitals by the design system, so a
 * case-sensitive assertion would be testing the stylesheet rather than the
 * content.
 */
async function readableText(page: Page): Promise<string> {
  return (await detail(page).innerText()).replace(/\s+/g, ' ').toLowerCase();
}

/**
 * The sheet's own identity, wherever this width draws it.
 *
 * At wide width the name and the `MANUFACTURER · <PAD> LANDING PAD` line are
 * the body's; at compact they are the command bar's title and the line under
 * it, and the body does not draw them a second time — the canvas puts them in
 * the bar and draws them once (`design/hull-detail.md`). The claim is that the
 * screen states both facts on one line, not which of the two places states it.
 */
async function identityText(page: Page): Promise<string> {
  const bar = page.locator('.frame__return-detail');
  const line = (await bar.count()) > 0 ? await bar.first().innerText() : '';
  const title = await page.getByRole('heading', { level: 1 }).first().innerText();
  return `${await readableText(page)} ${title} ${line}`.replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Opens a hull the way a Commander does, without reloading the application.
 *
 * A full navigation would discard the in-memory build, and the replacement
 * question this journey is about would then never be asked.
 */
async function openHullInApp(page: Page, name: string): Promise<void> {
  // The command bar names the screen it is on and offers only the others, so
  // this link is the way back from anywhere but the shipyard. Waiting for it is
  // what keeps the journey behind the navigation that brought us here: without
  // it the search below can be typed into a manifest that is already leaving.
  await reachShellLink(page, 'Ship Builder');
  await expect(page).toHaveURL(/\/ships$/);
  await page.getByRole('searchbox', { name: 'Search ships or manufacturers' }).fill(name);
  await openHullFromManifest(page, name);
  await expect(page.getByRole('button', { name: 'Build', exact: true })).toBeVisible();
}

test.describe('hull detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ANACONDA);
    await expect(page.getByRole('heading', { level: 2, name: 'Anaconda' })).toBeVisible();
  });

  test('shows every published fact with the unit it is measured in', async ({ page }) => {
    const text = await readableText(page);

    for (const label of BARE_FACTS) {
      expect(text, `${label} is shown`).toContain(label.toLowerCase());
    }

    for (const [label, unit] of FACTS) {
      expect(text, `${label} is shown`).toContain(label.toLowerCase());
      expect(text, `${label} names its unit`).toContain(unit.toLowerCase());
    }
  });

  // Canvas 1a/1b: `FAULCON DELACY · LARGE LANDING PAD`. The pad class is a
  // pad class, and the line says so rather than leaving a bare `LARGE`.
  test('names the manufacturer and the pad class on one identity line', async ({ page }) => {
    const text = await identityText(page);

    expect(text).toContain('faulcon delacy');
    expect(text).toContain('large landing pad');
  });

  // The reference draws every figure in the metric grid whole: `400`, not
  // `400.0` (canvas 1a `sy-mass`).
  test('draws every figure in the metric grid whole', async ({ page }) => {
    const grid = detail(page).locator('.metric-group');
    await expect(grid.first()).toBeVisible();

    for (const value of await grid.locator('.metric__number').allInnerTexts()) {
      expect(value.trim(), 'a metric grid figure carries no fraction').not.toMatch(/[.,]\d/);
    }
  });

  test('counts the mount classes the hull carries, largest first', async ({ page }) => {
    const mounts = await detail(page).locator('.detail__mount').allInnerTexts();

    // The design system sets the class names in capitals; the assertion is
    // about the counts and their order, not about the stylesheet.
    expect(mounts.map((mount) => mount.replace(/\s+/g, ' ').trim().toLowerCase())).toEqual([
      '1 huge',
      '3 large',
      '2 medium',
      '2 small',
    ]);
  });

  test('shows the hull price as one headline figure in credits', async ({ page }) => {
    const text = await readableText(page);

    expect(text).toContain('hull price');
    expect(text).toMatch(/146,969,451\s*cr/);
  });

  // The plate carries the loader alone: the hull that was there is not the
  // hull being asked for, and holding the old picture up until the new one
  // decodes shows the wrong ship.
  test('shows the loader alone while an illustration is on its way', async ({ page }) => {
    // The picture is held until this test lets it go, rather than for a fixed
    // stretch: a stretch has to be guessed long enough to outlast the slowest
    // start-up, and whatever is guessed the picture can still arrive before the
    // state it hides has been read. Held this way the state lasts exactly as
    // long as the reading takes. Only the illustration is held, because only
    // the illustration is what the plate is waiting for.
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/assets/ships/**/illustration.png', async (route) => {
      await held;
      await route.continue();
    });
    // `commit` rather than the default: waiting for load would wait for the
    // very request being held, and the state under test would be over.
    await page.goto(ANACONDA, { waitUntil: 'commit' });

    // Committing gets the document, not the running application, so this first
    // reading also waits out the start-up. It can afford to: the picture is
    // held until the line below lets it go, so the loader cannot slip away
    // while the wait is on.
    const image = page.locator('.artwork__image');
    await expect(page.locator('.artwork__loader')).toBeVisible({ timeout: 15_000 });
    await expect(image).toBeHidden();

    // Letting go here, rather than dropping the interception: taking the
    // pattern away releases the request that is still being held, and the hold
    // then finishes onto a route the run has already dealt with.
    release();
    await expect(image).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.artwork__loader')).toHaveCount(0);
  });

  test('keeps every action usable when the illustration cannot be fetched', async ({ page }) => {
    await page.route('**/assets/ships/**', (route) => route.abort());
    await page.goto(ANACONDA);

    await expect(page.getByText(/illustration is not available right now/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Load the illustration again' })).toBeVisible();
    // The absence of a picture never gates creating a build (FR-006).
    await expect(page.getByRole('button', { name: 'Build', exact: true })).toBeEnabled();
  });

  test('recovers the illustration on retry, without reloading the page', async ({ page }) => {
    await page.route('**/assets/ships/**', (route) => route.abort());
    await page.goto(ANACONDA);
    const retry = page.getByRole('button', { name: 'Load the illustration again' });
    await expect(retry).toBeVisible();

    await page.unroute('**/assets/ships/**');
    await retry.click();

    // The same page, the same route, the same state: only the illustration
    // changed, and nothing had to be loaded again to get it.
    await expect(retry).toHaveCount(0);
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const image = document.querySelector<HTMLImageElement>('.artwork__image');
            return image !== null && image.complete && image.naturalWidth > 0;
          }),
        { timeout: 10_000 },
      )
      .toBe(true);
    await expect(page).toHaveURL(/\/ships\/Anaconda$/);
  });

  test('says nothing was created when the symbol is not a hull', async ({ page }) => {
    await page.goto('/ships/Nonexistent_Hull');

    await expect(page.getByRole('heading', { name: 'No such hull' })).toBeVisible();
    await expect(page.getByText(/Nonexistent_Hull/)).toBeVisible();
    await expect(page.getByText(/nothing has been created or changed/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Build', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Back to Ship Builder' })).toBeVisible();
  });

  test('creates the package’s own default build, and only when asked', async ({ page }) => {
    await expect(page).toHaveURL(/\/ships\/Anaconda$/);

    await page.getByRole('button', { name: 'Build', exact: true }).click();

    await expect(page).toHaveURL(/\/build(#|$)/);
    await expect(page.getByRole('heading', { level: 1, name: /anaconda/i })).toBeVisible();
    // The hull is the command bar's identity line, as canvas 1c draws it, and
    // the build itself is the ledger under it. A hull line, a provenance line
    // and a saved-state line in the page were none of them on the canvas.
    await expect(page.getByRole('banner').getByText('Anaconda').first()).toBeVisible();
    await expect(page.locator('[data-slot-key]').first()).toBeVisible();
  });

  test('replaces the build on screen without asking, and keeps the one it replaced', async ({
    page,
  }) => {
    // Withdrawn on 2026-08-25: the build being replaced has a record of its own,
    // so nothing is lost and nothing is asked. What is asserted instead is that
    // the first build is still there afterwards (FR-008, FR-009).
    await page.getByRole('button', { name: 'Build', exact: true }).click();
    await expect(page.locator('[data-slot-key]').first()).toBeVisible();
    await savedToBrowser(page);

    await openHullInApp(page, 'Sidewinder');
    await page.getByRole('button', { name: 'Build', exact: true }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/\/build(#|$)/);
    await expect(page.getByRole('banner').getByText('Sidewinder').first()).toBeVisible();

    // Two builds, two records: the Anaconda is on the library's list rather than
    // gone. Polled rather than read once, because the second build's own write
    // is coalesced and the status still reads "saved" from the first one.
    await expect
      .poll(
        () =>
          page.evaluate(
            () => Object.keys(localStorage).filter((key) => key.startsWith('edsb:record:')).length,
          ),
        { timeout: 5_000 },
      )
      .toBe(2);
  });

  test('never scrolls the document sideways', async ({ page }) => {
    await expectNoDocumentOverflow(page);
  });

  test('is structurally sound and free of accessibility violations', async ({ page }, testInfo) => {
    await expectSingleVisibleH1(page);
    await expectOrderedHeadings(page);
    await expectNoRawMessages(page);
    await expectNoAccessibilityViolations(page, testInfo, { label: 'hull-detail-populated' });

    await page.goto('/ships/Nonexistent_Hull');
    await expect(page.getByRole('heading', { name: 'No such hull' })).toBeVisible();
    await expectNoAccessibilityViolations(page, testInfo, { label: 'hull-detail-unknown' });

    await page.goto(ANACONDA);
    await page.getByRole('button', { name: 'Build', exact: true }).click();
    await expect(page.locator('[data-slot-key]').first()).toBeVisible();
    await openHullInApp(page, 'Sidewinder');
    await page.getByRole('button', { name: 'Build', exact: true }).click();
    await expect(page.locator('[data-slot-key]').first()).toBeVisible();
    await expectNoAccessibilityViolations(page, testInfo, { label: 'hull-detail-second-build' });
  });
});
