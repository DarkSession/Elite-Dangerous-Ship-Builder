import { expect, test } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import {
  clippedText,
  expectLandmarks,
  expectNoDocumentOverflow,
  expectTargetSizes,
} from './accessibility/assertions';
import { reachShellAction } from './shell';

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
    // The same measurement expanded copy, mirrored direction and 400% zoom use:
    // truncation is one failure, and one detector keeps the engines' sub-pixel
    // disagreements in one place rather than four.
    expect(await clippedText(page), 'content is cut off with no way to reach it').toEqual([]);
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

  test('opens a compact layer at the top of the screen, not part-way down it', async ({ page }) => {
    // A sheet used to rise from the block end, sized by its content, so a short
    // one began part-way down the screen with scrim over everything above it —
    // `Import build` 449 pixels down an 844-pixel phone (Commander request
    // 2026-08-30). It starts where the screen starts now and grows down to its
    // bound (`design/canvas-extraction.md`, "Panel dialog").
    await reachShellAction(page, /^import build$/i);

    const layer = page.locator('dialog[open]');
    await expect(layer).toBeVisible();

    const measured = await layer.evaluate((node) => ({
      top: Math.round(node.getBoundingClientRect().top),
      height: Math.round(node.getBoundingClientRect().height),
      viewport: window.innerHeight,
      // A sheet takes the whole width of the screen; the centred dialog the
      // wide profiles draw is bounded by its own measure.
      sheet: Math.round(node.getBoundingClientRect().width) >= window.innerWidth - 1,
    }));

    if (!measured.sheet) {
      // The wide profiles centre the dialog instead, which is the canvas's own
      // treatment at that width and is not what this is about.
      return;
    }

    expect(measured.top).toBeLessThanOrEqual(1);
    // And it still leaves the screen behind it visible rather than taking the
    // whole of it: that is what parts a sheet from a full-height layer.
    expect(measured.height).toBeLessThanOrEqual(measured.viewport);
  });

  test('passes an accessibility scan at every profile', async ({ page }, testInfo) => {
    await expectNoAccessibilityViolations(page, testInfo, {
      label: `responsive-${testInfo.project.name}`,
    });
  });
});
