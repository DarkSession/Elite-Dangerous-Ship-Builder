import { expect, test, type Page } from '@playwright/test';
import { expectNoClippedText, sweepOutfittingState } from './accessibility';
import { expectNoDocumentOverflow, expectTargetSizes } from './accessibility/assertions';
import {
  chooserOffered,
  editorOffered,
  isCompactWorkspace,
  openChooser,
  openChooserRows,
  openEditor,
  revealMount,
} from './outfitting-surfaces';

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
    await openChooserRows(page);
    await expect(page.locator('.candidate').first()).toBeVisible();
    await expectNoClippedText(page, `${drawn}/ledger and bench together`);
    await expectNoDocumentOverflow(page);
    await expectTargetSizes(page);
  });

  test('offers every capability at this width, whatever shape it is in', async ({ page }) => {
    await openStockBuild(page);
    await revealMount(page, 'Slot03_Size6');
    const row = page.locator('[data-slot-key="Slot03_Size6"] button').first();
    await row.click();
    // Waited for: the bench answers about the mount that is selected, and
    // reading it before the selection lands reads about the previous one.
    await expect(row).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.locator('.replacement__title, .outfitting__bench-title').first(),
    ).toContainText(/size 6/i);

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

  test('runs every frozen column from under the command bar to the foot of the screen', async ({
    page,
  }) => {
    await openStockBuild(page);
    const drawn = await composition(page).getAttribute('data-composition');

    // Canvas 1c draws the workspace as one grid row — `392px 1fr 306px` over a
    // `min-height: 880px` — whose columns stretch to it, so the ledger's
    // `border-right` and the status rail's `border-left` reach the foot of the
    // screen whatever either column holds. Where this width stacks the regions
    // instead, none of them is frozen and the page scrolls: that is the same
    // rule, and it is asserted here too so neither composition can drift into
    // the other's answer.
    const measured = await page.evaluate(() => {
      const frame = document.querySelector('edsb-app-frame')!;
      const columns = [
        '.outfitting__ledger-region',
        '.outfitting__centre',
        '.outfitting__status-rail',
      ].map((selector) => {
        const node = document.querySelector(selector)!;
        return {
          selector,
          frozen: getComputedStyle(node).position === 'sticky',
          height: node.getBoundingClientRect().height,
        };
      });

      return {
        columns,
        viewport: window.innerHeight,
        // What the token says a region has to clear, and what the bar it names
        // actually came to. The declared figure is one row of controls at the
        // target baseline; this screen's identity block is two 24px targets,
        // and at any width where the bar wraps it is taller again (workspace
        // design, "What that height is, is measured, not declared").
        cleared: parseFloat(getComputedStyle(frame).getPropertyValue('--edsb-layout-bar-height')),
        bar: document.querySelector('.frame__banner')!.getBoundingClientRect().height,
        released: frame.classList.contains('frame--released'),
      };
    });

    const drawnBar = measured.released ? 0 : measured.bar;
    expect(Math.abs(measured.cleared - drawnBar)).toBeLessThan(1);

    const frozen = measured.columns.filter((column) => column.frozen);
    if (drawn === 'compact') {
      expect(frozen).toEqual([]);
    } else {
      expect(frozen.length).toBeGreaterThanOrEqual(2);
    }

    for (const column of frozen) {
      expect(Math.abs(column.height - (measured.viewport - measured.cleared))).toBeLessThan(1);
    }

    // And what it clears is the bar that is drawn: a column offsetting by a
    // figure smaller than the bar freezes its own head behind it — 62px of the
    // ledger's category strip, at tablet width, before this was measured. Only
    // a column with somewhere to travel shows it: a sticky box cannot leave its
    // own containing block, so where the grid is exactly one column tall there
    // is no freeze to observe and the offset above is the whole claim.
    const slack = await page.evaluate(() => {
      const grid = document.querySelector('.outfitting')!.getBoundingClientRect().height;
      const column = document
        .querySelector('.outfitting__ledger-region')!
        .getBoundingClientRect().height;
      return Math.min(grid - column, document.documentElement.scrollHeight - window.innerHeight);
    });

    const ledgerFrozen = frozen.some((column) => column.selector === '.outfitting__ledger-region');

    if (ledgerFrozen && slack > 1) {
      await page.evaluate((distance) => window.scrollTo(0, distance), Math.min(slack, 200));

      const seam = await page.evaluate(() => ({
        bar: document.querySelector('.frame__banner')!.getBoundingClientRect().bottom,
        ledger: document.querySelector('.outfitting__ledger-region')!.getBoundingClientRect().top,
      }));

      expect(Math.round(seam.ledger)).toBeGreaterThanOrEqual(Math.round(seam.bar) - 1);
    }
  });

  test('keeps the same source order in every composition', async ({ page }) => {
    await openStockBuild(page);
    const compact = await isCompactWorkspace(page);
    // The two actions are drawn for whichever mount is marked, so at compact
    // width one is marked before the order is read.
    if (compact) {
      const row = page.locator('[data-slot-key] button').first();
      await row.click();
      await expect(row).toHaveAttribute('aria-pressed', 'true');
    }

    const order = await page
      .locator('.outfitting > *')
      .evaluateAll((nodes) =>
        nodes
          .map((node) => node.className.toString().trim().split(/\s+/)[0] ?? '')
          .filter((name) => name.length > 0),
      );

    // Feedback, then the ledger, then the middle track, then the status rail —
    // the same DOM at every width, arranged differently. A composition that
    // reordered the document would give a reader a different screen from the
    // one drawn.
    expect(order).toEqual([
      // The region's own heading, hidden because neither canvas draws one.
      'visually-hidden',
      // Two notices, not three. The import-completion notice left this stack on
      // 2026-08-26 (Commander request): what the Almanac completed while a build
      // was read in is a remark about the build a Commander now has, not a
      // reason they cannot have one, so it stands under `BUILD STATUS` in the
      // rail beside the package's other reading of the same build.
      'outfitting__feedback',
      'outfitting__feedback',
      'outfitting__ledger-region',
      // Canvas 1c's middle track and canvas 1d's middle band: the hull anatomy
      // over the selected mount's bench, in one column so the bench stays under
      // the plates (feature 010).
      'outfitting__centre',
      // Canvas 1d's six key readings and its two mount actions, drawn only at
      // that width: the strip goes above the tabs and the actions under the
      // ledger the canvas draws them under, and both are between the middle
      // track and the rail in the document
      // (`design/outfitting-workspace.md`, "The compact key figures").
      ...(compact ? ['outfitting__key-figures', 'outfitting__bench-actions'] : []),
      // Canvas 1c's third track, and canvas 1d's Status stack. It is last in
      // the document at every width: a band under the bench until there is
      // room for the full `392px 1fr 306px` grid, and the trailing column after
      // that (feature 009).
      'outfitting__status-rail',
    ]);

    const centre = await page
      .locator('.outfitting__centre > *')
      .evaluateAll((nodes) => nodes.map((node) => node.tagName.toLowerCase()));
    expect(centre).toEqual(['edsb-hull-anatomy', 'div']);
  });

  test('is accessible in the composition this width draws', async ({ page }, testInfo) => {
    await openStockBuild(page);
    const drawn = await composition(page).getAttribute('data-composition');

    await sweepOutfittingState(page, testInfo, `${drawn}/workspace`);

    // A mount with something in it: the region opens on the first mount, and
    // the Anaconda's first hardpoint is empty, so there is nothing to engineer.
    await revealMount(page, 'FrameShiftDrive');
    await page.locator('[data-slot-key="FrameShiftDrive"] button').first().click();
    await expect(
      page.locator('.replacement__title, .outfitting__bench-title').first(),
    ).toContainText(/frame shift/i);
    await openEditor(page);
    await sweepOutfittingState(page, testInfo, `${drawn}/engineering`);
  });
});
