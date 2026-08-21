import { expect, test } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import {
  expectLandmarks,
  expectNoDocumentOverflow,
  expectTargetSizes,
} from './accessibility/assertions';

/**
 * The responsive journey (US2).
 *
 * The claim under test is availability, not appearance: every action and every
 * datum that exists on a desktop still exists on a phone in landscape. A layout
 * that drops a control at a narrow width has not adapted — it has removed a
 * capability from whoever is on that device.
 *
 * Runs in all ten projects, so each assertion is made at five viewport and
 * orientation profiles in both engines.
 */
test.describe('responsive availability', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('keeps the landmarks at every profile', async ({ page }) => {
    await expectLandmarks(page);
  });

  test('never scrolls the document horizontally', async ({ page }) => {
    await expectNoDocumentOverflow(page);
  });

  test('keeps every action reachable and named', async ({ page }) => {
    const controls = page.getByRole('button');
    const count = await controls.count();

    for (let index = 0; index < count; index += 1) {
      const control = controls.nth(index);

      // Present in the accessibility tree and not hidden from view: an action
      // that is merely off-screen is an action a Commander cannot take.
      await expect(control).toBeVisible();
      expect((await control.textContent())?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });

  test('keeps every datum readable rather than clipping it', async ({ page }) => {
    const clipped = await page.locator('main *').evaluateAll((nodes) =>
      nodes
        .filter((node) => {
          const element = node as HTMLElement;
          if (element.children.length > 0) {
            return false;
          }
          const style = getComputedStyle(element);
          if (style.overflow === 'auto' || style.overflow === 'scroll') {
            return false;
          }
          // Content wider than its own box, with no scroller to reach it.
          return element.scrollWidth > element.clientWidth + 1;
        })
        .map((node) => (node.textContent ?? '').trim().slice(0, 40)),
    );

    expect(clipped, 'content is cut off with no way to reach it').toEqual([]);
  });

  test('meets the target baseline at every profile', async ({ page }) => {
    await expectTargetSizes(page);
  });

  test('completes the primary journey by tap on touch profiles and click on desktop', async ({
    page,
  }, testInfo) => {
    const hasTouch = testInfo.project.use.hasTouch === true;
    const control = page.getByRole('button').first();

    if ((await page.getByRole('button').count()) > 0) {
      // Touch and pointer reach the same control; no hover is required first.
      if (hasTouch) {
        await control.tap();
      } else {
        await control.click();
      }
      await expect(page.getByRole('main')).toBeVisible();
    }
  });

  test('passes an accessibility scan at every profile', async ({ page }, testInfo) => {
    await expectNoAccessibilityViolations(page, testInfo, {
      label: `responsive-${testInfo.project.name}`,
    });
  });
});
