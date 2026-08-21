import { expect, test } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import {
  clippedText,
  expectBannerReleasesShortViewport,
  expectLandmarks,
  expectNoDocumentOverflow,
  expectTargetSizes,
} from './accessibility/assertions';
import { DOUBLED_TEXT, withRootTextScale } from './accessibility/text-scale';
import { previewUrl } from './servers';

/**
 * The viewport WCAG 1.4.10 defines 400% zoom to be equivalent to: content at
 * 1280x1024 zoomed to 400% is content at 320x256 CSS pixels. Both axes matter —
 * the width is what wraps the layout, and the height is what makes a sticky
 * region intolerable. Testing the width alone leaves the failure that actual
 * zoom is most likely to produce untested.
 */
const ZOOM_400_EQUIVALENT = { width: 320, height: 256 } as const;

/**
 * Text-scale and reflow variants (US2).
 *
 * These are variants of the existing projects, not extra projects: the same
 * journeys re-run under a condition. A 390-pixel mobile project is not by
 * itself the WCAG 400%-zoom equivalent — 320x256 CSS pixels is — so that
 * viewport is exercised explicitly here in both engines.
 *
 * This is the normative measurement, not an approximation of one. Under actual
 * browser zoom every length scales with the CSS pixel, so the layout in CSS
 * pixels is the same layout; what a person still has to judge at real zoom is
 * whether the result remains usable, which no assertion decides.
 */

test.describe('200% text scale', () => {
  test.beforeEach(async ({ page }) => {
    await withRootTextScale(page, DOUBLED_TEXT);
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('doubles the rendered text size', async ({ page }) => {
    const rootSize = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).fontSize),
    );

    // 200% of a typical 16px root. Asserted loosely because the user agent's
    // own default is the thing being scaled, not a number we control.
    expect(rootSize).toBeGreaterThan(24);
  });

  test('keeps the document from scrolling horizontally', async ({ page }) => {
    await expectNoDocumentOverflow(page);
  });

  test('keeps every landmark and control', async ({ page }) => {
    await expectLandmarks(page);
    await expectTargetSizes(page);
  });

  test('keeps every action visible with its text', async ({ page }) => {
    const controls = page.getByRole('button');
    const count = await controls.count();

    for (let index = 0; index < count; index += 1) {
      await expect(controls.nth(index)).toBeVisible();
    }
  });

  test('passes an accessibility scan at doubled text', async ({ page }, testInfo) => {
    await expectNoAccessibilityViolations(page, testInfo, { label: 'text-scale-200' });
  });
});

test.describe('400% zoom equivalent (320x256 CSS pixels)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(ZOOM_400_EQUIVALENT);
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('keeps the document from scrolling horizontally', async ({ page }) => {
    await expectNoDocumentOverflow(page);
  });

  test('keeps every landmark', async ({ page }) => {
    await expectLandmarks(page);
  });

  test('keeps every action available with its text', async ({ page }) => {
    const controls = page.getByRole('button');
    const count = await controls.count();

    for (let index = 0; index < count; index += 1) {
      const control = controls.nth(index);
      await expect(control).toBeVisible();
      // An action that survives as an unlabelled glyph has not survived.
      expect((await control.textContent())?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });

  test('keeps every target reachable', async ({ page }) => {
    await expectTargetSizes(page);
  });

  test('releases the banner instead of occupying the viewport with it', async ({ page }) => {
    await expectBannerReleasesShortViewport(page);
  });

  test('cuts no meaning off', async ({ page }) => {
    expect(await clippedText(page), 'content is truncated with no way to read it').toEqual([]);
  });

  test('presents a layer at full height rather than as a clipped dialog', async ({ page }) => {
    // The product shell owns no layer yet, so the assertion runs against the
    // real component at its own isolated preview address rather than being
    // dropped: the adaptive presentation is resolved in CSS, so this viewport is
    // what decides it.
    await page.goto(previewUrl('layer--default'));

    const layer = page.getByRole('dialog');
    const fit = await layer.evaluate((node) => {
      const element = node as HTMLElement;
      return {
        overflowBlock: element.scrollHeight - element.clientHeight,
        scrolls: ['auto', 'scroll'].includes(getComputedStyle(element).overflowY),
        top: element.getBoundingClientRect().top,
      };
    });

    // Either it fits, or it owns a scroller to reach the rest. A centred dialog
    // whose content is simply cut off at a 256-pixel viewport is the failure.
    expect(fit.overflowBlock <= 1 || fit.scrolls, 'the layer clips its own content').toBe(true);
    expect(fit.top, 'the layer is pushed off the top of a short viewport').toBeGreaterThanOrEqual(
      -1,
    );

    await expectNoDocumentOverflow(page);
  });

  test('passes an accessibility scan', async ({ page }, testInfo) => {
    await expectNoAccessibilityViolations(page, testInfo, { label: 'reflow-320x256' });
  });
});

test.describe('400% zoom equivalent at 200% text', () => {
  test('survives both conditions at once', async ({ page }) => {
    // The hardest realistic case: a 400%-zoomed window and a Commander who has
    // also set larger text. Each condition alone passing does not imply the
    // pair does.
    await withRootTextScale(page, DOUBLED_TEXT);
    await page.setViewportSize(ZOOM_400_EQUIVALENT);
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();

    await expectNoDocumentOverflow(page);
    await expectLandmarks(page);
    await expectBannerReleasesShortViewport(page);
    expect(await clippedText(page), 'content is truncated with no way to read it').toEqual([]);
  });
});
