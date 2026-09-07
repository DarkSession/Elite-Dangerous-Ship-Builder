import { expect, test } from '@playwright/test';

/**
 * Smoke coverage for the application shell.
 *
 * One load, and the three facts every other journey rests on: the document is
 * the product's, the application owns it, and nothing failed on the way.
 *
 * The rest of what this document owes is owed once. Its landmarks and names are
 * `interface-foundations`, its scan is `start-page`, and the width it holds is
 * `responsive`. A second pass here would read the same tree again in all ten
 * projects.
 */
test.describe('application shell', () => {
  test('boots the application without reporting an error', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');

    await expect(page).toHaveTitle(/Nav Beacon/i);
    await expect(page.locator('app-root')).toBeAttached();
    expect(errors).toEqual([]);
  });
});
