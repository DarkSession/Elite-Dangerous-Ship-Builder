import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import {
  expectLandmarks,
  expectNoDocumentOverflow,
  expectNoRawMessages,
  expectOrderedHeadings,
  expectSingleVisibleH1,
} from './accessibility/assertions';

/**
 * The shipyard journey: find a hull among all of them.
 *
 * Everything asserted here is something a Commander does — type a search,
 * choose a size, flip a sort, come back and find the list as they left it. The
 * one structural assertion is the negative: none of that browsing state may
 * escape into the route, the fragment or anything stored, because none of it is
 * part of a build (FR-003).
 *
 * Counts are read from the visible hulls rather than from one composition, so
 * the same journey holds at every width: the manifest and the card list are two
 * renderings of one list and exactly one of them is on screen.
 */

/** Every hull currently on screen, in the order it is presented. */
function visibleHulls(page: Page) {
  return page.locator('[data-hull-symbol]:visible');
}

const search = (page: Page) =>
  page.getByRole('searchbox', { name: 'Search ships or manufacturers' });

/** The command bar, where the reference puts the screen's one count. */
const commandBar = (page: Page) => page.getByRole('banner');

/**
 * The control that orders the manifest: a column header where the manifest is
 * a table, a sort chip where it is a card list. The reference draws one or the
 * other, never both, so the journey asks for the action rather than the widget.
 */
const sortControl = (page: Page, field: string) =>
  page.getByRole('button', { name: new RegExp(`^Sort by ${field}, `) }).first();

test.beforeEach(async ({ page }) => {
  await page.goto('/ships');
  await expect(page.getByRole('heading', { level: 1, name: /shipyard/i })).toBeVisible();
  await expect(visibleHulls(page)).toHaveCount(48);
});

test.describe('hull catalogue', () => {
  // The reference carries the manifest's count in the command bar beside the
  // screen's own name, and nowhere else (canvas 1a, canvas 1b).
  test('lists every installed hull before anything is narrowed', async ({ page }) => {
    await expect(commandBar(page).getByText(/48 ships/)).toBeVisible();
  });

  test('states the match count as text, and updates it', async ({ page }) => {
    await search(page).fill('anaconda');

    await expect(visibleHulls(page)).not.toHaveCount(48);
    await expect(commandBar(page).getByText(/1 of 48 ships/)).toBeVisible();
  });

  // The reference toolbar narrows by search and landing-pad size. Filtering by
  // manufacturer, hardpoint class and price is FR-002 capability the reference
  // draws no control for; it is covered at the facade rather than here.
  // The reference's strip is exclusive: `ALL` or one pad class, never two.
  test('narrows by search and by landing-pad size', async ({ page }) => {
    await page.getByRole('radio', { name: 'Large' }).check();
    await expect(visibleHulls(page)).not.toHaveCount(48);

    await page.getByRole('radio', { name: 'Medium' }).check();
    await expect(page.getByRole('radio', { name: 'Large' })).not.toBeChecked();

    await page.getByRole('radio', { name: 'All', exact: true }).check();
    await expect(visibleHulls(page)).toHaveCount(48);

    await search(page).fill('type');
    await expect(visibleHulls(page)).not.toHaveCount(48);
  });

  test('says why a constrained list is empty', async ({ page }) => {
    await search(page).fill('no such hull anywhere');

    await expect(visibleHulls(page)).toHaveCount(0);
    // Two renderings of one list, one of them on screen: the empty statement
    // belongs to whichever composition this width is showing.
    await expect(page.locator('.catalogue__empty:visible')).toHaveText(
      /no hull in the catalogue matches that filter/i,
    );
    await expect(commandBar(page).getByText(/0 of 48 ships/)).toBeVisible();
  });

  test('sorts in both directions on every field, and says which way', async ({ page }) => {
    for (const field of ['Ship', 'Manufacturer', 'Size', 'Hardpoints', 'Price Mcr']) {
      const control = sortControl(page, field);
      const before = await control.getAttribute('aria-label');

      await control.click();
      await expect(control).not.toHaveAttribute('aria-label', before!);
      await expect(control).toHaveAttribute('aria-label', /ascending|descending/);

      await control.click();
      await expect(control).toHaveAttribute('aria-label', before!);
    }
  });

  test('keeps every hull, and its order stable, when the direction flips', async ({ page }) => {
    const size = sortControl(page, 'Size');
    await size.click();
    const ascending = await visibleHulls(page).evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-hull-symbol')),
    );

    await size.click();
    const descending = await visibleHulls(page).evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-hull-symbol')),
    );

    expect(ascending).toHaveLength(48);
    expect(new Set(ascending)).toEqual(new Set(descending));
    // Ties keep the package's own order, so reversing is not a mirror image.
    expect(descending).not.toEqual([...ascending].reverse());
  });

  test('keeps browsing state out of the route, the fragment and storage', async ({ page }) => {
    await search(page).fill('anaconda');
    await page.getByRole('radio', { name: 'Large' }).check();
    await expect(visibleHulls(page)).toHaveCount(1);

    const url = new URL(page.url());
    expect(url.search).toBe('');
    expect(url.hash).toBe('');

    const stored = await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    }));
    expect(stored.local).toEqual([]);
    // Browsing state is this tab's, and lives under exactly one owned key.
    expect(stored.session).toEqual(['edsb:catalogue']);
  });

  test('restores constraints, order and place after a trip to hull detail', async ({ page }) => {
    await search(page).fill('type');
    await sortControl(page, 'Price Mcr').click();
    await expect(sortControl(page, 'Price Mcr')).toHaveAttribute(
      'aria-label',
      'Sort by Price Mcr, descending',
    );
    const before = await visibleHulls(page).evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-hull-symbol')),
    );

    await page.getByRole('button', { name: /View / }).first().click();
    await expect(page).toHaveURL(/\/ships\/[^/]+$/);
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/ships$/);

    await expect(search(page)).toHaveValue('type');
    await expect(sortControl(page, 'Price Mcr')).toHaveAttribute(
      'aria-label',
      'Sort by Price Mcr, descending',
    );
    expect(
      await visibleHulls(page).evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('data-hull-symbol')),
      ),
    ).toEqual(before);
  });

  test('never renders a missing fact as a zero', async ({ page }) => {
    // Every installed hull publishes every catalogue fact, so the assertion is
    // the negative: nothing is being substituted for an absence.
    await expect(page.getByText('0.00', { exact: true })).toHaveCount(0);
  });

  test('never scrolls the document sideways', async ({ page }) => {
    await expectNoDocumentOverflow(page);

    await search(page).fill('type');
    await expect(visibleHulls(page)).not.toHaveCount(48);
    await expectNoDocumentOverflow(page);
  });

  test('is structurally sound and free of accessibility violations', async ({ page }, testInfo) => {
    await expectLandmarks(page);
    await expectSingleVisibleH1(page);
    await expectOrderedHeadings(page);
    await expectNoRawMessages(page);
    await expectNoAccessibilityViolations(page, testInfo, { label: 'catalogue-populated' });

    await search(page).fill('no such hull anywhere');
    await expect(visibleHulls(page)).toHaveCount(0);
    await expectNoAccessibilityViolations(page, testInfo, { label: 'catalogue-no-matches' });
  });
});
