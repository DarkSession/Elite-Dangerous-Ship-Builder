import { expect, test } from '@playwright/test';

/**
 * Smoke coverage for the application shell. Feature specs add their own suites
 * under e2e/; this one guards the baseline every form factor must satisfy.
 */
test.describe('application shell', () => {
  test('boots and renders the app root', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Nav Beacon/i);
    await expect(page.locator('app-root')).toBeAttached();
  });

  test('does not scroll horizontally', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('app-root')).toBeAttached();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

  test('reports no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');
    await expect(page.locator('app-root')).toBeAttached();

    expect(errors).toEqual([]);
  });
});
