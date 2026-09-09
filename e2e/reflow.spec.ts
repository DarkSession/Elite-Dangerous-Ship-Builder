import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import {
  clippedText,
  expectBannerLeavesAViewport,
  expectBannerReleasesShortViewport,
  expectLandmarks,
  expectNoDocumentOverflow,
  expectTargetSizes,
} from './accessibility/assertions';
import { DOUBLED_TEXT, withRootTextScale } from './accessibility/text-scale';
import { previewUrl } from './servers';
import { holdEveryChunk, waitForTakeover, waitingStatement } from './shell';

/**
 * Actual 400% browser zoom, emulated exactly.
 *
 * WCAG 1.4.10 defines 400% zoom by equivalence: content at 1280x1024 zoomed to
 * 400% is content at 320x256 CSS pixels. Both axes matter — the width wraps the
 * layout, the height is what makes a sticky region intolerable.
 *
 * Pairing that viewport with a device scale factor of 4 reproduces the rest of
 * what zoom does: `devicePixelRatio` is 4, resolution media queries report a
 * high-density surface, and images resolve as they would on a zoomed page. What
 * is left over is the browser's own chrome and the operating system's toolbars,
 * which take physical space — a smaller height, not a behaviour no test can
 * reach.
 */
const ZOOM_400 = { viewport: { width: 320, height: 256 }, deviceScaleFactor: 4 } as const;

/**
 * Text-scale and reflow variants (US2).
 *
 * These are variants of the existing projects, not extra projects: the same
 * journeys re-run under a condition. A 390-pixel mobile project is not by
 * itself 400% zoom — 320x256 CSS pixels at a device scale factor of 4 is — so
 * that condition is exercised explicitly here in both engines.
 *
 * What a person still has to judge at real zoom is whether the result remains
 * usable, which no assertion decides. Everything measurable is measured here.
 *
 * A condition costs a page: applying it, loading the entry point and letting it
 * settle. So a condition is set up once and everything measurable under it is
 * measured on that one page, rather than a page per measurement.
 */

/** Every action still on screen, still carrying the words that name it. */
async function expectEveryActionSurvives(page: Page): Promise<void> {
  const controls = page.getByRole('button');
  const count = await controls.count();

  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    await expect(control).toBeVisible();
    // An action that survives as an unlabelled glyph has not survived.
    expect((await control.textContent())?.trim().length ?? 0).toBeGreaterThan(0);
  }
}

/**
 * The waiting statement, read where a condition could break it.
 *
 * The mark is the whole of what is drawn, so what has to hold at a doubled text
 * size and at 400% zoom is that it is still centred, still whole and still
 * inside the viewport — a mark half off the screen states nothing.
 */
async function expectTheWaitingStatementHoldsUp(page: Page): Promise<void> {
  const held = await holdEveryChunk(page);
  try {
    await page
      .getByRole('main')
      .getByRole('link')
      .filter({ hasText: 'Ship Builder' })
      .click({ noWaitAfter: true });
    await expect(waitingStatement(page)).toBeVisible({ timeout: 15_000 });

    const box = await waitingStatement(page).locator('img').boundingBox();
    const view = page.viewportSize();
    expect(box, 'the mark was drawn').not.toBeNull();
    expect(view, 'the profile has a viewport').not.toBeNull();
    if (box === null || view === null) {
      return;
    }
    expect(box.width, 'the mark has a width').toBeGreaterThan(0);
    expect(box.height, 'the mark has a height').toBeGreaterThan(0);
    expect(box.x, 'the mark starts inside the viewport').toBeGreaterThanOrEqual(0);
    expect(box.y, 'the mark starts inside the viewport').toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, 'the mark ends inside the viewport').toBeLessThanOrEqual(view.width);
    expect(box.y + box.height, 'the mark ends inside the viewport').toBeLessThanOrEqual(
      view.height,
    );
    expect(Math.abs(box.x + box.width / 2 - view.width / 2)).toBeLessThanOrEqual(2);
    expect(Math.abs(box.y + box.height / 2 - view.height / 2)).toBeLessThanOrEqual(2);

    await expectNoDocumentOverflow(page);
  } finally {
    held.release();
  }
}

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

  test('keeps every landmark, action and target at doubled text', async ({ page }) => {
    await expectNoDocumentOverflow(page);
    await expectLandmarks(page);
    await expectTargetSizes(page);
    await expectEveryActionSurvives(page);
  });

  test('leaves a screen under the banner rather than freezing over it', async ({ page }) => {
    // The condition the shell's own rule is written for. At a doubled text size
    // the command bar wraps — five rows of it in German — and a bar that keeps
    // the top of the window while it is that tall is chrome the page is read
    // through: on a tablet held in landscape it took more than half the screen,
    // and the anatomy region's mode strip was behind it.
    await expectBannerLeavesAViewport(page);
  });

  test('holds the waiting statement whole at doubled text (018/FR-002)', async ({ page }) => {
    await waitForTakeover(page);
    await expectTheWaitingStatementHoldsUp(page);
  });

  test('passes an accessibility scan at doubled text', async ({ page }, testInfo) => {
    await expectNoAccessibilityViolations(page, testInfo, { label: 'text-scale-200' });
  });
});

test.describe('400% browser zoom', () => {
  test.use(ZOOM_400);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('keeps the whole entry point at the zoom-equivalent viewport', async ({ page }) => {
    await expectNoDocumentOverflow(page);
    await expectLandmarks(page);
    await expectEveryActionSurvives(page);
    await expectTargetSizes(page);
    await expectBannerReleasesShortViewport(page);
    expect(await clippedText(page), 'content is truncated with no way to read it').toEqual([]);
  });

  test('holds the whole bench in view, with the choice that fills it', async ({ page }) => {
    // The bench is the one screen with three regions side by side, so 400% zoom
    // is where its arrangement has to give way rather than scroll sideways
    // (013/FR-025).
    await page.goto('/equipment');
    await expect(page.locator('.bench')).toBeVisible();
    await page.locator('.gate__suits .choice').first().click();
    await expect(page.locator('.gate')).toHaveCount(0);

    await expectNoDocumentOverflow(page);
    await expectTargetSizes(page);
    expect(await clippedText(page), 'the bench is truncated with no way to read it').toEqual([]);
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

  test('holds the waiting statement whole at the zoom-equivalent viewport (018/FR-002)', async ({
    page,
  }) => {
    await waitForTakeover(page);
    await expectTheWaitingStatementHoldsUp(page);
  });

  test('passes an accessibility scan', async ({ page }, testInfo) => {
    await expectNoAccessibilityViolations(page, testInfo, { label: 'reflow-320x256' });
  });
});

test.describe('400% browser zoom at 200% text', () => {
  test.use(ZOOM_400);

  test('survives both conditions at once', async ({ page }) => {
    // The hardest realistic case: a 400%-zoomed window and a Commander who has
    // also set larger text. Each condition alone passing does not imply the
    // pair does.
    await withRootTextScale(page, DOUBLED_TEXT);
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();

    await expectNoDocumentOverflow(page);
    await expectLandmarks(page);
    await expectBannerReleasesShortViewport(page);
    expect(await clippedText(page), 'content is truncated with no way to read it').toEqual([]);
  });
});
