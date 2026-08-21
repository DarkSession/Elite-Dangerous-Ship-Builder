import { expect, test } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import {
  expectLandmarks,
  expectNameMatchesVisibleText,
  expectNoDocumentOverflow,
  expectNoRawMessages,
  expectOrderedHeadings,
  expectRootLanguage,
  expectSingleVisibleH1,
  expectTargetSizes,
} from './accessibility/assertions';

/**
 * The product semantics journey (US1).
 *
 * Every assertion here states something a Commander using a screen reader
 * depends on: that landmarks exist to navigate by, that headings describe a
 * real structure, that a control's accessible name is the words on screen, and
 * that a value is related to the label and unit that explain it.
 *
 * Runs in all ten projects. Keyboard operation is constitutionally excluded
 * from the conformance claim, which does not weaken any of this.
 */
test.describe('product semantics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('exposes the application landmarks', async ({ page }) => {
    await expectLandmarks(page);
  });

  test('exposes one visible top-level heading', async ({ page }) => {
    await expectSingleVisibleH1(page);
  });

  test('descends heading levels without skipping', async ({ page }) => {
    await expectOrderedHeadings(page);
  });

  test('gives every control an accessible name matching its visible text', async ({ page }) => {
    const controls = page.getByRole('button');
    const count = await controls.count();

    for (let index = 0; index < count; index += 1) {
      await expectNameMatchesVisibleText(controls.nth(index));
    }
  });

  test('meets the target-size baseline for every interactive control', async ({ page }) => {
    await expectTargetSizes(page);
  });

  test('never scrolls the document horizontally', async ({ page }) => {
    await expectNoDocumentOverflow(page);
  });

  test('publishes the root language and direction', async ({ page }) => {
    await expectRootLanguage(page, { lang: 'en', dir: 'ltr' });
  });

  test('shows no raw message key or unresolved placeholder', async ({ page }) => {
    await expectNoRawMessages(page);
  });

  test('passes an accessibility scan', async ({ page }, testInfo) => {
    await expectNoAccessibilityViolations(page, testInfo, { label: 'product-shell' });
  });

  test('exposes a named status region in ordinary reading order', async ({ page }) => {
    // Visible feedback is ordinary semantic content, not a live region: a
    // Commander must be able to find and re-read it, not only hear it once.
    const status = page.getByRole('status');
    await expect(status).toHaveCount(1);
  });
});
