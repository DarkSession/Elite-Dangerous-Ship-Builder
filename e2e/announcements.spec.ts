import { expect, test, type Page } from '@playwright/test';

/**
 * The announcement policy journey (US1).
 *
 * The contract is as much about silence as about speech. Announcing initial
 * content, an unchanged value or a result that no longer owns the presented
 * revision is not helpfulness — it is noise that a screen-reader user has to
 * sit through before they can reach what they were doing.
 */

/** Reads what each hidden outlet currently holds. */
async function outlets(page: Page): Promise<{ assertive: string; polite: string }> {
  return page.evaluate(() => ({
    assertive: document.querySelector('[data-announcement-outlet="assertive"]')?.textContent ?? '',
    polite: document.querySelector('[data-announcement-outlet="polite"]')?.textContent ?? '',
  }));
}

test.describe('announcement policy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('provides exactly one assertive and one polite outlet', async ({ page }) => {
    await expect(page.locator('[data-announcement-outlet="assertive"]')).toHaveCount(1);
    await expect(page.locator('[data-announcement-outlet="polite"]')).toHaveCount(1);
  });

  test('declares the outlets with the correct urgency', async ({ page }) => {
    await expect(page.locator('[data-announcement-outlet="assertive"]')).toHaveAttribute(
      'aria-live',
      'assertive',
    );
    await expect(page.locator('[data-announcement-outlet="polite"]')).toHaveAttribute(
      'aria-live',
      'polite',
    );
  });

  test('keeps the outlets out of the visible layout', async ({ page }) => {
    const box = await page.locator('[data-announcement-outlet="polite"]').boundingBox();

    // Visually hidden, but present in the accessibility tree — an outlet that
    // is `display: none` announces nothing at all.
    expect(box === null || box.width <= 1 || box.height <= 1).toBe(true);
    await expect(page.locator('[data-announcement-outlet="polite"]')).toBeAttached();
  });

  test('says nothing about initial content', async ({ page }) => {
    const initial = await outlets(page);

    expect(initial.assertive.trim()).toBe('');
    expect(initial.polite.trim()).toBe('');
  });

  test('never makes a whole region live', async ({ page }) => {
    // Only the two dedicated outlets are live. Marking a metrics panel live
    // would re-announce every unaffected value on every change.
    const live = await page.locator('[aria-live]').count();

    expect(live).toBe(2);
  });
});
