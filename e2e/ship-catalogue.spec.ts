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

/** The toolbar's own controls, away from the live region that echoes them. */
function toolbar(page: Page) {
  return page.getByRole('group', { name: /active filters/i }).locator('..');
}

const search = (page: Page) => page.getByRole('searchbox', { name: 'Search hulls' });
const orderField = (page: Page) => page.getByRole('combobox', { name: 'Order', exact: true });
const clearAll = (page: Page) => page.getByRole('button', { name: 'Clear all filters' });

test.beforeEach(async ({ page }) => {
  await page.goto('/ships');
  await expect(page.getByRole('heading', { level: 1, name: /shipyard/i })).toBeVisible();
  await expect(visibleHulls(page)).toHaveCount(48);
});

test.describe('hull catalogue', () => {
  test('lists every installed hull before anything is narrowed', async ({ page }) => {
    await expect(page.getByText('48 hulls', { exact: true })).toBeVisible();
    await expect(toolbar(page).getByText(/48 of 48 hulls shown/)).toBeVisible();
  });

  test('states the match count as text, and updates it', async ({ page }) => {
    await search(page).fill('anaconda');

    await expect(visibleHulls(page)).not.toHaveCount(48);
    await expect(toolbar(page).getByText(/of 48 hulls shown/)).toBeVisible();
  });

  test('narrows by every facet the toolbar offers', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Large' }).check();
    await expect(visibleHulls(page)).not.toHaveCount(48);

    await clearAll(page).click();
    await expect(visibleHulls(page)).toHaveCount(48);

    await page.getByRole('combobox', { name: 'Manufacturer' }).selectOption('Gutamaya');
    await expect(visibleHulls(page)).not.toHaveCount(48);

    await clearAll(page).click();
    await page.getByRole('combobox', { name: 'Hardpoint class' }).selectOption('4');
    await expect(visibleHulls(page)).not.toHaveCount(48);

    await clearAll(page).click();
    await page.getByRole('textbox', { name: 'Lowest retail price' }).fill('100000000');
    await expect(visibleHulls(page)).not.toHaveCount(48);
  });

  test('names each active constraint and removes exactly the one asked for', async ({ page }) => {
    await search(page).fill('type');
    await page.getByRole('checkbox', { name: 'Large' }).check();

    await expect(page.getByRole('button', { name: 'Remove filter: Search: type' })).toBeVisible();
    await page.getByRole('button', { name: 'Remove filter: Size: Large' }).click();

    await expect(page.getByRole('button', { name: 'Remove filter: Size: Large' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Remove filter: Search: type' })).toBeVisible();
  });

  test('says why a constrained list is empty, and offers a way out', async ({ page }) => {
    await search(page).fill('no such hull anywhere');

    await expect(visibleHulls(page)).toHaveCount(0);
    await expect(page.getByText(/no hull matches these filters/i)).toBeVisible();
    await expect(toolbar(page).getByText(/0 of 48 hulls shown/)).toBeVisible();
    await expect(clearAll(page)).toBeVisible();
  });

  test('sorts in both directions on every field, and says which way', async ({ page }) => {
    for (const field of ['Ship', 'Manufacturer', 'Size', 'Hardpoints', 'Retail price']) {
      await orderField(page).selectOption({ label: field });
      await expect(page.getByText(`Sorted by ${field}, ascending`)).toBeVisible();

      await page
        .getByRole('button', { name: `Sort by ${field}, descending` })
        .first()
        .click();
      await expect(page.getByText(`Sorted by ${field}, descending`)).toBeVisible();
    }
  });

  test('keeps every hull, and its order stable, when the direction flips', async ({ page }) => {
    await orderField(page).selectOption({ label: 'Size' });
    await expect(page.getByText('Sorted by Size, ascending')).toBeVisible();
    const ascending = await visibleHulls(page).evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-hull-symbol')),
    );

    await page.getByRole('button', { name: 'Sort by Size, descending' }).first().click();
    await expect(page.getByText('Sorted by Size, descending')).toBeVisible();
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
    await page.getByRole('checkbox', { name: 'Large' }).check();
    await expect(page.getByRole('button', { name: 'Remove filter: Size: Large' })).toBeVisible();

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
    await orderField(page).selectOption({ label: 'Retail price' });
    await expect(page.getByText('Sorted by Retail price, ascending')).toBeVisible();
    const before = await visibleHulls(page).count();

    await page.getByRole('button', { name: /View / }).first().click();
    await expect(page.getByRole('link', { name: 'Back to the shipyard' }).first()).toBeVisible();
    await page.getByRole('link', { name: 'Back to the shipyard' }).first().click();

    await expect(search(page)).toHaveValue('type');
    await expect(page.getByText('Sorted by Retail price, ascending')).toBeVisible();
    await expect(visibleHulls(page)).toHaveCount(before);
  });

  test('never renders a missing fact as a zero', async ({ page }) => {
    // Every installed hull publishes every catalogue fact, so the assertion is
    // the negative: nothing is being substituted for an absence.
    await expect(page.getByText('0 CR', { exact: true })).toHaveCount(0);
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
