import { expect, test } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import {
  clippedText,
  expectLandmarks,
  expectNoDocumentOverflow,
  expectTargetSizes,
} from './accessibility/assertions';
import { BENCH_WIDE_MINIMUM_REM } from '../src/app/ui/equipment/bench-composition';
import { STACKABLE_MINIMUM_REM } from '../src/app/ui/short-viewport';
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
/**
 * The bench at every profile.
 *
 * The shell's own journey above opens on the catalogue. The bench is the second
 * tool and lays itself out on its own container rather than on the window, so
 * the same claim is made of it directly: no capability is dropped and nothing
 * is cut off at any of the ten profiles (013/FR-025).
 */
test.describe('the equipment bench, responsively', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/equipment');
    await expect(page.locator('.bench')).toBeVisible();
    // A suit on the bench, so what is measured is the loaded arrangement rather
    // than the gate.
    await page.locator('.gate__suits .choice').first().click();
    await expect(page.locator('.gate')).toHaveCount(0);
  });

  test('never scrolls the document horizontally', async ({ page }) => {
    await expectNoDocumentOverflow(page);
  });

  test('keeps every datum readable rather than clipping it', async ({ page }) => {
    expect(await clippedText(page), 'content is cut off with no way to reach it').toEqual([]);
  });

  test('meets the target baseline at every profile', async ({ page }) => {
    await expectTargetSizes(page);
  });

  test('keeps the landmarks at every profile', async ({ page }) => {
    await expectLandmarks(page);
  });

  test('takes the arrangement its own width has room for', async ({ page }) => {
    // The one decision the stylesheets cannot make, pinned against the width it
    // is made from rather than against a profile name, so it holds in all ten.
    //
    // Both halves are asserted because both have failed: the composition read
    // `compact` at 1440px while its host was an inline box, which is one
    // `ResizeObserver` reports nothing at all for; and the three-column rule was
    // a container query written against the same element that declared the
    // container, which an element never matches.
    const seen = await page.evaluate(
      ([wideMinimum, stackableMinimum]) => {
        const bench = document.querySelector('.bench') as HTMLElement;
        const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        return {
          roomForWide:
            bench.getBoundingClientRect().width / rem >= wideMinimum &&
            !matchMedia(`(max-height: ${stackableMinimum}rem)`).matches,
          composition: bench.dataset['composition'],
          columns: getComputedStyle(bench).gridTemplateColumns.split(' ').length,
          tabs: document.querySelectorAll('.bench__tabs').length,
        };
      },
      [BENCH_WIDE_MINIMUM_REM, STACKABLE_MINIMUM_REM] as const,
    );

    expect(seen.composition).toBe(seen.roomForWide ? 'wide' : 'compact');
    // Wide is canvas 1a's three tracks and no tab strip; compact is one track
    // and the strip that names the region standing in it.
    expect(seen.columns).toBe(seen.roomForWide ? 3 : 1);
    expect(seen.tabs).toBe(seen.roomForWide ? 0 : 1);
  });
});

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

  test('opens a compact layer near the top of the screen, not part-way down it', async ({
    page,
  }) => {
    // A sheet starts near the top of the screen and grows down to its bound
    // (`design/canvas-extraction.md`, "Panel dialog"). Risen from the block end
    // and sized by its content instead, a short one begins part-way down the
    // screen with scrim over everything above it — `Import build` 449 pixels
    // down an 844-pixel phone (Commander request 2026-08-30). Flush against the
    // top instead, its title bar met the edge of the screen with nothing above
    // it to say the sheet was a layer over anything (Commander request
    // 2026-08-31), so it keeps one step of the space scale there.
    await reachShellAction(page, /^import build$/i);

    const layer = page.locator('dialog[open]');
    await expect(layer).toBeVisible();
    // The import layer's own body, not any open dialog: while the layer's chunk
    // is on the wire the shell stands a waiting layer here at the same width,
    // and a skeleton panel is shorter than the bound this test exists to hold.
    await expect(layer.locator('.slef-import')).toBeVisible();

    const measured = await layer.evaluate((node) => ({
      top: Math.round(node.getBoundingClientRect().top),
      height: Math.round(node.getBoundingClientRect().height),
      viewport: window.innerHeight,
      // A sheet takes the whole width of the screen; the centred dialog the
      // wide profiles draw is bounded by its own measure.
      sheet: Math.round(node.getBoundingClientRect().width) >= window.innerWidth - 1,
      // A screen too short to divide promotes the sheet to a full-height layer,
      // which is a different presentation with a different bound. Asked as the
      // stylesheet's own query, so a Commander's larger root text moves both
      // together.
      short: window.matchMedia('(max-height: 30rem)').matches,
      // The inset the sheet declares, read off the layer rather than restated
      // here: the token is the design system's to set, and this test is about
      // where the sheet lands rather than about how far the token reaches.
      inset: Math.round(Number.parseFloat(getComputedStyle(node).marginBlockStart)),
    }));

    if (!measured.sheet) {
      // The wide profiles centre the dialog instead, which is the canvas's own
      // treatment at that width and is not what this is about.
      return;
    }

    if (measured.short) {
      // Promoted: the layer owns the screen and scrolls, which is what keeps a
      // landscape phone and a 400% zoom readable at all (FR-011). There is no
      // room to give away, so a promoted layer takes no inset.
      expect(measured.top).toBeLessThanOrEqual(1);
      expect(measured.height).toBe(measured.viewport);
      return;
    }

    // Off the edge of the screen, and only just: the sheet begins at its own
    // inset and nowhere else.
    expect(measured.inset).toBeGreaterThan(0);
    expect(measured.top).toBe(measured.inset);
    expect(measured.top).toBeLessThan(measured.viewport / 8);

    // The inset is taken out of the 88% bound rather than added to it, so a
    // sheet gives up the same strip of screen it always did and the scrim below
    // it is unchanged. Without this the bound could go back to a plain `88svh`
    // and only the strip below would shrink, which nothing above would notice.
    expect(measured.top + measured.height).toBeLessThanOrEqual(
      Math.round(0.88 * measured.viewport) + 1,
    );

    // And it still leaves the screen behind it visible rather than taking the
    // whole of it: that is what parts a sheet from a full-height layer, and a
    // bound equal to the screen would not.
    expect(measured.height).toBeLessThan(measured.viewport);
  });

  test('passes an accessibility scan at every profile', async ({ page }, testInfo) => {
    await expectNoAccessibilityViolations(page, testInfo, {
      label: `responsive-${testInfo.project.name}`,
    });
  });
});
