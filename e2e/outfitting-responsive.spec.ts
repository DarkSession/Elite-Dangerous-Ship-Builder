import { expect, test, type Page } from '@playwright/test';
import { expectNoClippedText, sweepOutfittingState } from './accessibility';
import { expectNoDocumentOverflow, expectTargetSizes } from './accessibility/assertions';
import {
  benchFollowedSelection,
  chooserOffered,
  editorOffered,
  isCompactWorkspace,
  manifestOf,
  statusRailIsColumn,
  openChooser,
  openChooserRows,
  openEditor,
  revealMount,
} from './outfitting-surfaces';
import { buildStockHull } from './shell';

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

/**
 * The declared content minimums, in rem, as the observer holds them.
 *
 * `bench` is what a candidate row needs, which is what two panes are selected
 * on. `benchWide` is what the bench has to *keep* before a third region may be
 * taken out of it — the chooser's own rail-and-pane manifest plus the fitting
 * panel's inset — because the right rail is a fixed track cut out of the bench's
 * width (responsive composition, "The third region is taken from what is left
 * over").
 */
const MINIMUMS = { ledger: 24.5, bench: 22.5, benchWide: 42.25, rail: 19.125 } as const;

/** The height below which nothing stacks, as the stylesheets define it. */
const SHORT_VIEWPORT_REM = 30;

async function openStockBuild(page: Page, hull = 'Anaconda'): Promise<void> {
  await page.goto(`/ships/${hull}`);
  await buildStockHull(page, 'Build');
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
  if (rems >= MINIMUMS.ledger + MINIMUMS.benchWide + MINIMUMS.rail) {
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
    await benchFollowedSelection(page);

    // The same four operations, wherever this width keeps them: fit, empty,
    // engineer and power. A width that quietly offered fewer would be a
    // different application on a smaller screen (constitution V).
    expect(await chooserOffered(page)).toBe(true);
    expect(await editorOffered(page)).toBe(true);
    await openChooser(page);
    // The fitting panel names the mount it is open on at both widths: inline
    // that head is the bench's, and at layer width it is the screen's own.
    await expect(page.locator('.replacement__title').first()).toContainText(/size 6/i);
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

  test('never loses the aligned manifest to the third region', async ({ page }) => {
    // The reported case (Commander request 2026-08-31): the chooser drew canvas
    // 1d's stacked cards inside canvas 1c's workspace, because the right rail
    // is a fixed 306px track cut out of the bench's width and a wide
    // composition selected on the bench's own floor folds the middle column to
    // one candidate row to pay for it. The bench now keeps what the aligned
    // manifest needs, and the third region waits for the width that leaves it.
    //
    // Stated at explicit widths across the step, because the step falls between
    // two profiles: canvas 1c's three regions begin at 1374px, over the 1112px
    // tablet in landscape and under the 1440px desktop, so neither profile
    // stands either side of it.
    await page.setViewportSize({ width: 1200, height: 950 });
    await openStockBuild(page);
    await openChooser(page);

    // Below the step: two panes, and the whole of what is left over is the
    // bench's, so the family rail is drawn beside the variant pane.
    await expect(composition(page)).toHaveAttribute('data-composition', 'two-pane');
    expect(await manifestOf(page)).toBe('rail');
    await expectNoDocumentOverflow(page);

    // Above it: canvas 1c's three tracks, and the bench still draws the rail.
    // Crossing the step may not cost the manifest — that is the whole of what
    // the step is for.
    await page.setViewportSize({ width: 1500, height: 950 });
    await expect(composition(page)).toHaveAttribute('data-composition', 'wide');
    expect(await manifestOf(page)).toBe('rail');
    expect(await statusRailIsColumn(page)).toBe(true);
    await expect(page.locator('.outfitting__status-rail')).toBeVisible();
    await expectNoDocumentOverflow(page);
  });

  test('draws the chooser rail wherever the region has the width for it', async ({ page }) => {
    // Asserted at whatever this profile is, in both directions, and against the
    // **region's** own width rather than the chooser's: what the chooser
    // measures is what the workspace left it, so comparing the chooser's box to
    // the chooser's own threshold asks the observer whether it agrees with
    // itself. The claim is about the composition above it.
    //
    // A tablet in landscape is the screen the report was made from: 1112px is
    // over the 1068px step, so the whole of what is left beside the ledger is
    // the bench's, and that holds the family rail beside the variant pane with
    // the editor under them — steps ① and ② side by side, and ③ below
    // (Commander request 2026-08-31).
    await openStockBuild(page);
    await openChooser(page);

    const region = await composition(page).evaluate((node) => node.getBoundingClientRect().width);
    const rem = await page.evaluate(
      () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16,
    );

    // 24.5rem of ledger and the 42.25rem the bench keeps: below the step the
    // region is a single flow and the layer is what the chooser measures, so
    // only the rail half is claimed of the region's width.
    if (region / rem >= 66.75) {
      expect(await manifestOf(page)).toBe('rail');
    }

    // And the chooser's own answer agrees with the box it was actually given,
    // which is what makes the step above a statement about the composition
    // rather than about the observer.
    const bench = await page
      .locator('edsb-candidate-list')
      .first()
      .evaluate((node) => node.getBoundingClientRect().width);
    expect(await manifestOf(page)).toBe(bench / rem >= 39.875 ? 'rail' : 'accordion');
  });

  test('takes the third region at the pixel the bench stops holding its manifest', async ({
    page,
  }) => {
    // The step has a pixel of margin in it: at 1374px the bench box is 676px and
    // the chooser measures 639px against the 638px it needs. A change to the
    // fitting panel's 18px inset or its hairlines closes that margin and puts
    // the stacked cards back inside canvas 1c's workspace, which is the reported
    // defect. Both sides of the pixel are asserted so that closing it fails
    // here.
    await page.setViewportSize({ width: 1373, height: 950 });
    await openStockBuild(page);
    await openChooser(page);
    await expect(composition(page)).toHaveAttribute('data-composition', 'two-pane');
    expect(await manifestOf(page)).toBe('rail');

    await page.setViewportSize({ width: 1374, height: 950 });
    await expect(composition(page)).toHaveAttribute('data-composition', 'wide');
    expect(await manifestOf(page)).toBe('rail');
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
        const style = getComputedStyle(node);
        return {
          selector,
          frozen: style.position === 'sticky',
          // A region is a column of this grid only if it is an item of it. The
          // status rail is one at the widest arrangement and nowhere else: below
          // that it is the anatomy strip's `STATUS` panel, drawn inside the
          // centre column, and a panel draws no vertical seam.
          column: node.parentElement?.classList.contains('outfitting') === true,
          height: node.getBoundingClientRect().height,
        };
      });

      return {
        columns,
        viewport: window.innerHeight,
        // What the token says a region has to clear, and what the bar it names
        // actually came to. The declared figure is the one height the bar is
        // drawn at, and at any width where the bar wraps it is taller again
        // (workspace design, "What that height is, is measured, not
        // declared").
        cleared: parseFloat(getComputedStyle(frame).getPropertyValue('--edsb-layout-bar-height')),
        bar: document.querySelector('.frame__banner')!.getBoundingClientRect().height,
        released: frame.classList.contains('frame--released'),
      };
    });

    const drawnBar = measured.released ? 0 : measured.bar;
    expect(Math.abs(measured.cleared - drawnBar)).toBeLessThan(1);

    const frozen = measured.columns.filter((column) => column.frozen);
    const seams = measured.columns.filter(
      (column) => column.selector !== '.outfitting__centre' && column.column,
    );

    if (drawn === 'compact') {
      expect(frozen).toEqual([]);
    } else {
      // Named rather than counted, because the count was standing in for the
      // rule and the two have come apart. The seams are the ledger's
      // `border-right` and the status rail's `border-left`; the centre column
      // between them draws neither — the bench drops its own leading edge so
      // the two do not stack into a two-pixel rule — and since 2026-08-27 it
      // releases whenever a mount is selected, so the page can carry a bench
      // that is as tall as the article has to say. A count of two was reading
      // that release as a lost seam (`design/outfitting-workspace.md`, "a bench
      // is not bounded by the column either").
      //
      // So: every region that draws a seam is frozen, and the status rail is
      // exempt exactly when this width draws it as a panel rather than a column.
      expect(seams.length).toBeGreaterThanOrEqual(1);
      expect(seams.every((column) => column.frozen)).toBe(true);
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

  test('reads in the order it is drawn, in every composition', async ({ page }) => {
    await openStockBuild(page);
    const compact = await isCompactWorkspace(page);
    const railIsColumn = await statusRailIsColumn(page);
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

    // Feedback, then the ledger, then the middle track — the same three at
    // every width, in the same order. What follows them is what that width
    // draws: a reader meets the regions in the order they are on the screen,
    // and a composition that put them in the document in some other order would
    // give a reader a different screen from the one drawn.
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
      // Canvas 1d's two mount actions, drawn only at that width, under the
      // ledger the canvas draws them under.
      ...(compact ? ['outfitting__bench-actions'] : []),
      // Canvas 1c's third track, and only where there is room for the full
      // `392px 1fr 306px` grid. Below that the rail has no column: it is the
      // strip's `STATUS` panel, inside the middle track above (feature 009).
      ...(railIsColumn ? ['outfitting__status-rail'] : []),
    ]);

    const centre = await page
      .locator('.outfitting__centre > *')
      .evaluateAll((nodes) =>
        nodes.map(
          (node) => node.className.toString().trim().split(/\s+/)[0] || node.tagName.toLowerCase(),
        ),
      );

    // Inside that track, the strip first and the bench last, with the two
    // regions the strip draws as guests between them: the panel `STATUS` opens
    // and canvas 1d's six key readings under it. Both are drawn where the strip
    // that opens them is, which is the only place at those widths that is on the
    // same screen as it (`design/outfitting-workspace.md`, "The status rail is a
    // segment wherever it has no column").
    expect(centre).toEqual([
      'edsb-hull-anatomy',
      ...(railIsColumn ? [] : ['outfitting__status-rail', 'outfitting__key-figures']),
      'outfitting__bench',
    ]);
  });

  test('is accessible in the composition this width draws', async ({ page }, testInfo) => {
    await openStockBuild(page);
    const drawn = await composition(page).getAttribute('data-composition');

    await sweepOutfittingState(page, testInfo, `${drawn}/workspace`);

    // A mount with something in it: the region opens on the first mount, and
    // the Anaconda's first hardpoint is empty, so there is nothing to engineer.
    await revealMount(page, 'FrameShiftDrive');
    const drive = page.locator('[data-slot-key="FrameShiftDrive"] button').first();
    await drive.click();
    // The row's own pressed state first. `benchFollowedSelection` is satisfied
    // by a bench that is already on screen from the mount before this one, so
    // without this the editor below can be opened on the previous selection.
    await expect(drive).toHaveAttribute('aria-pressed', 'true');
    await benchFollowedSelection(page);
    await openEditor(page);
    await sweepOutfittingState(page, testInfo, `${drawn}/engineering`);
  });
});
