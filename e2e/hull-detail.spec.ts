import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import {
  expectNoDocumentOverflow,
  expectNoRawMessages,
  expectOrderedHeadings,
  expectSingleVisibleH1,
} from './accessibility/assertions';

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
  await page.getByRole('navigation').getByRole('link', { name: 'Shipyard' }).click();
  await expect(page).toHaveURL(/\/ships$/);
  await page.getByRole('searchbox', { name: 'Search ships or manufacturers' }).fill(name);
  await page
    .getByRole('button', { name: new RegExp(`View ${name}`, 'i') })
    .first()
    .click();
  await expect(page.getByRole('button', { name: 'Build stock hull' })).toBeVisible();
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

  test('names the manufacturer and the pad class on one identity line', async ({ page }) => {
    const text = await readableText(page);

    expect(text).toContain('faulcon delacy');
    expect(text).toContain('large');
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

  test('keeps every action usable when the illustration cannot be fetched', async ({ page }) => {
    await page.route('**/assets/ships/**', (route) => route.abort());
    await page.goto(ANACONDA);

    await expect(page.getByText(/illustration is not available right now/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Load the illustration again' })).toBeVisible();
    // The absence of a picture never gates creating a build (FR-006).
    await expect(page.getByRole('button', { name: 'Build stock hull' })).toBeEnabled();
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
    await expect(page.getByRole('button', { name: 'Build stock hull' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Back to the shipyard' })).toBeVisible();
  });

  test('creates the package’s own default build, and only when asked', async ({ page }) => {
    await expect(page).toHaveURL(/\/ships\/Anaconda$/);

    await page.getByRole('button', { name: 'Build stock hull' }).click();

    await expect(page).toHaveURL(/\/build(#|$)/);
    await expect(page.getByRole('heading', { level: 1, name: 'Build' })).toBeVisible();
    await expect(page.getByText('Anaconda')).toBeVisible();
    await expect(page.getByText('New stock build')).toBeVisible();
    await expect(page.getByText('Unsaved changes')).toBeVisible();
  });

  test('confirms before replacing unsaved work, and cancelling keeps it', async ({ page }) => {
    await page.getByRole('button', { name: 'Build stock hull' }).click();
    await expect(page.getByText('New stock build')).toBeVisible();

    await openHullInApp(page, 'Sidewinder');
    await page.getByRole('button', { name: 'Build stock hull' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/unsaved changes/i)).toBeVisible();

    await dialog.getByRole('button', { name: 'Keep what I have' }).click();
    await expect(dialog).toBeHidden();

    // The reference's command bar offers no chip for the build screen, so the
    // way back to it is its own address. The working record is what has to have
    // survived, and a fresh load is the strictest way to ask.
    await page.goto('/build');
    await expect(page.getByRole('heading', { level: 1, name: 'Build' })).toBeVisible();
    await expect(page.getByText('Anaconda')).toBeVisible();
  });

  test('replaces unsaved work once the Commander confirms', async ({ page }) => {
    await page.getByRole('button', { name: 'Build stock hull' }).click();
    await expect(page.getByText('New stock build')).toBeVisible();

    await openHullInApp(page, 'Sidewinder');
    await page.getByRole('button', { name: 'Build stock hull' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Discard and open' }).click();

    await expect(page).toHaveURL(/\/build(#|$)/);
    await expect(page.getByText('Sidewinder')).toBeVisible();
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
    await page.getByRole('button', { name: 'Build stock hull' }).click();
    await expect(page.getByText('New stock build')).toBeVisible();
    await openHullInApp(page, 'Sidewinder');
    await page.getByRole('button', { name: 'Build stock hull' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expectNoAccessibilityViolations(page, testInfo, { label: 'hull-detail-replacement' });
  });
});
