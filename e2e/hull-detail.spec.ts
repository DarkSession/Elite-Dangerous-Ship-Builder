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
 * The two things this journey is really about: that every published figure is
 * shown with the unit it is measured in, and that nothing is created until a
 * Commander asks — and then only after anything unsaved has been accounted for.
 */

const ANACONDA = '/ships/Anaconda';

/** Every fact FR-004 names, with the unit each is expected to carry. */
const FACTS: readonly (readonly [label: string, unit: string])[] = [
  ['Speed', 'm/s'],
  ['Boost speed', 'm/s'],
  ['Base shield strength', 'MJ'],
  ['Base armour', 'hull points'],
  ['Hull mass', 't'],
  ['Hull hardness', 'rating, no unit'],
  ['Mass-lock factor', 'rating, no unit'],
  ['Crew seats', 'seats'],
  ['Heat capacity', 'rating, no unit'],
  ['Heat dissipation', 'thermal load per second'],
  ['Reserve fuel', 't'],
  ['Pitch rate', '°/s'],
  ['Roll rate', '°/s'],
  ['Yaw rate', '°/s'],
];

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
  await page.getByRole('navigation').getByRole('link', { name: 'Shipyard' }).click();
  await page.getByRole('searchbox', { name: 'Search hulls' }).fill(name);
  await page
    .getByRole('button', { name: new RegExp(`View ${name}`, 'i') })
    .first()
    .click();
  await expect(page.getByRole('button', { name: 'Create a stock build' })).toBeVisible();
}

test.describe('hull detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ANACONDA);
    await expect(page.getByRole('heading', { level: 2, name: 'Anaconda' })).toBeVisible();
  });

  test('shows every published fact with the unit it is measured in', async ({ page }) => {
    const text = await readableText(page);

    for (const [label, unit] of FACTS) {
      expect(text, `${label} is shown`).toContain(label.toLowerCase());
      expect(text, `${label} names its unit`).toContain(unit.toLowerCase());
    }
  });

  test('names the viewing condition of each endpoint pair', async ({ page }) => {
    const text = await readableText(page);

    expect(text).toContain('at 0 eng pips');
    expect(text).toContain('at 4 eng pips');
  });

  test('separates bare-hull figures from a build’s own results', async ({ page }) => {
    await expect(page.getByText(/bare-hull figures from the almanac/i)).toBeVisible();
    await expect(page.getByText(/do not include any fitted module/i)).toBeVisible();
  });

  test('splits the price into hull only and ready to fly', async ({ page }) => {
    const text = await readableText(page);

    expect(text).toContain('hull only');
    expect(text).toContain('ready to fly');
    expect(text).toMatch(/cr/);
  });

  test('shows the slot layout with the game’s own keys, irregular ones included', async ({
    page,
  }) => {
    const text = await readableText(page);

    expect(text).toContain('core internals');
    expect(text).toContain('powerplant');
    // The Anaconda's smallest optional; a derived key would read Slot12_Size1.
    expect(text).toContain('slot14_size1');
    expect(text).toContain('cargo hatch');
  });

  test('keeps every action usable when the illustration cannot be fetched', async ({ page }) => {
    await page.route('**/assets/ships/**', (route) => route.abort());
    await page.goto(ANACONDA);

    await expect(page.getByText(/illustration is not available right now/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Load the illustration again' })).toBeVisible();
    // The absence of a picture never gates creating a build (FR-006).
    await expect(page.getByRole('button', { name: 'Create a stock build' })).toBeEnabled();
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
    await expect(page.getByRole('button', { name: 'Create a stock build' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Back to the shipyard' })).toBeVisible();
  });

  test('creates the package’s own default build, and only when asked', async ({ page }) => {
    await expect(page).toHaveURL(/\/ships\/Anaconda$/);

    await page.getByRole('button', { name: 'Create a stock build' }).click();

    await expect(page).toHaveURL(/\/build(#|$)/);
    await expect(page.getByRole('heading', { level: 1, name: 'Build' })).toBeVisible();
    await expect(page.getByText('Anaconda')).toBeVisible();
    await expect(page.getByText('New stock build')).toBeVisible();
    await expect(page.getByText('Unsaved changes')).toBeVisible();
  });

  test('confirms before replacing unsaved work, and cancelling keeps it', async ({ page }) => {
    await page.getByRole('button', { name: 'Create a stock build' }).click();
    await expect(page.getByText('New stock build')).toBeVisible();

    await openHullInApp(page, 'Sidewinder');
    await page.getByRole('button', { name: 'Create a stock build' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/unsaved changes/i)).toBeVisible();

    await dialog.getByRole('button', { name: 'Keep what I have' }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole('navigation').getByRole('link', { name: 'Build', exact: true }).click();
    await expect(page.getByText('Anaconda')).toBeVisible();
  });

  test('replaces unsaved work once the Commander confirms', async ({ page }) => {
    await page.getByRole('button', { name: 'Create a stock build' }).click();
    await expect(page.getByText('New stock build')).toBeVisible();

    await openHullInApp(page, 'Sidewinder');
    await page.getByRole('button', { name: 'Create a stock build' }).click();
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
    await page.getByRole('button', { name: 'Create a stock build' }).click();
    await openHullInApp(page, 'Sidewinder');
    await page.getByRole('button', { name: 'Create a stock build' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expectNoAccessibilityViolations(page, testInfo, { label: 'hull-detail-replacement' });
  });
});
