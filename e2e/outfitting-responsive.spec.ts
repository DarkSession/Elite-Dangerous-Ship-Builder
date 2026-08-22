import { expect, test, type Page } from '@playwright/test';
import { expectNoClippedText, sweepOutfittingState } from './accessibility';
import { expectNoDocumentOverflow, expectTargetSizes } from './accessibility/assertions';
import { chooserOffered, editorOffered, openChooser, openEditor } from './outfitting-surfaces';

/**
 * One region, every width it is given.
 *
 * The ten-project matrix already runs this file at 1440×900, 834×1112,
 * 1112×834, 390×844 and 844×390 under Chromium and Firefox, so nothing here
 * loops over viewports: each run asserts what *this* width must produce. The
 * claim being checked is the rule rather than the numbers — the composition
 * follows from the space the region was actually given, at the text size it was
 * given it, which is why 400% zoom and expanded copy select the compact
 * composition for the same reason a phone does (responsive composition,
 * "Reference and selection rule").
 */

/** The declared content minimums, in rem, as the observer holds them. */
const MINIMUMS = { ledger: 20, bench: 22.5, rail: 17.5 } as const;

/** The height below which nothing stacks, as the stylesheets define it. */
const SHORT_VIEWPORT_REM = 30;

async function openStockBuild(page: Page, hull = 'Anaconda'): Promise<void> {
  await page.goto(`/ships/${hull}`);
  await page.getByRole('button', { name: 'Build stock hull' }).click();
  await expect(page).toHaveURL(/\/build(#|$)/);
  await expect(page.locator('[data-slot-key]').first()).toBeVisible();
}

/** What the rule says this width should produce, measured rather than assumed. */
async function expectedComposition(page: Page): Promise<'wide' | 'two-pane' | 'compact'> {
  const measured = await page.locator('.outfitting').evaluate((node) => ({
    inline: node.getBoundingClientRect().width,
    rem: parseFloat(getComputedStyle(document.documentElement).fontSize) || 16,
    height: window.innerHeight,
  }));

  const rems = measured.inline / measured.rem;
  if (measured.height / measured.rem <= SHORT_VIEWPORT_REM) {
    return 'compact';
  }
  if (rems >= MINIMUMS.ledger + MINIMUMS.bench + MINIMUMS.rail) {
    return 'wide';
  }
  return rems >= MINIMUMS.ledger + MINIMUMS.bench ? 'two-pane' : 'compact';
}

const composition = (page: Page) => page.locator('.outfitting');

test.describe('the composition this width has room for', () => {
  test('follows the declared minimums rather than a device label', async ({ page }) => {
    await openStockBuild(page);

    await expect(composition(page)).toHaveAttribute(
      'data-composition',
      await expectedComposition(page),
    );
  });

  test('holds its content at its declared minimum, in whatever it draws', async ({ page }) => {
    await openStockBuild(page);
    const drawn = await composition(page).getAttribute('data-composition');

    // Whatever this width composes — two panes side by side or one screen at a
    // time — each region has to hold its own content, or the composition should
    // have stepped down instead of narrowing below its minimum.
    await openChooser(page);
    await expect(page.locator('.candidate').first()).toBeVisible();
    await expectNoClippedText(page, `${drawn}/ledger and bench together`);
    await expectNoDocumentOverflow(page);
    await expectTargetSizes(page);
  });

  test('offers every capability at this width, whatever shape it is in', async ({ page }) => {
    await openStockBuild(page);
    const row = page.locator('[data-slot-key="Slot03_Size6"] button').first();
    await row.click();
    // Waited for: the bench answers about the mount that is selected, and
    // reading it before the selection lands reads about the previous one.
    await expect(row).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.outfitting__bench-title')).toContainText(/size 6/i);

    // The same four operations, wherever this width keeps them: fit, empty,
    // engineer and power. A width that quietly offered fewer would be a
    // different application on a smaller screen (constitution V).
    expect(await chooserOffered(page)).toBe(true);
    expect(await editorOffered(page)).toBe(true);
    await openChooser(page);
    await expect(page.getByRole('button', { name: /remove module/i })).toBeVisible();
    await expect(page.locator('[data-slot-key="Slot03_Size6"] .power__priority')).toHaveCount(1);
  });

  test('steps down to the compact composition at 400% zoom', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 256 });
    await openStockBuild(page);

    // Not a device: the same region with less room, which is the whole point of
    // measuring the region rather than the window (FR-011).
    await expect(composition(page)).toHaveAttribute('data-composition', 'compact');
    await expectNoDocumentOverflow(page);
  });

  test('keeps the same source order in every composition', async ({ page }) => {
    await openStockBuild(page);

    const order = await page
      .locator('.outfitting > *')
      .evaluateAll((nodes) =>
        nodes
          .map((node) => node.className.toString().trim().split(/\s+/)[0] ?? '')
          .filter((name) => name.length > 0),
      );

    // Feedback, then the ledger, then the selected mount's bench — the same DOM
    // at every width, arranged differently. A composition that reordered the
    // document would give a reader a different screen from the one drawn.
    expect(order).toEqual([
      // The region's own heading, hidden because neither canvas draws one.
      'visually-hidden',
      'outfitting__feedback',
      'outfitting__feedback',
      'outfitting__feedback',
      'outfitting__ledger-region',
      'outfitting__bench',
    ]);
  });

  test('is accessible in the composition this width draws', async ({ page }, testInfo) => {
    await openStockBuild(page);
    const drawn = await composition(page).getAttribute('data-composition');

    await sweepOutfittingState(page, testInfo, `${drawn}/workspace`);

    // A mount with something in it: the region opens on the first mount, and
    // the Anaconda's first hardpoint is empty, so there is nothing to engineer.
    await page.locator('[data-slot-key="FrameShiftDrive"] button').first().click();
    await expect(page.locator('.outfitting__bench-title')).toContainText(/frame shift/i);
    await openEditor(page);
    await sweepOutfittingState(page, testInfo, `${drawn}/engineering`);
  });
});
