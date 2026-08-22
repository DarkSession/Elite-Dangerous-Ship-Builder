import { expect, test, type Page } from '@playwright/test';
import { programmaticState, sweepOutfittingState } from './accessibility';
import {
  expectNameMatchesVisibleText,
  expectNoDocumentOverflow,
  expectTargetSizes,
  settled,
} from './accessibility/assertions';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import { DOUBLED_TEXT, withRootTextScale } from './accessibility/text-scale';
import { openChooser, openEditor, surfacesAreLayers } from './outfitting-surfaces';

/**
 * The states this feature can be in, held to the same floor.
 *
 * The other suites sweep the states they pass through on their way to proving
 * something else. This one exists for the states nothing else reaches — an
 * empty workspace, a refusal, a build with no history — and for the conditions
 * that break a layout rather than a journey: doubled text, 400% zoom, expanded
 * copy, a mirrored direction and no motion at all.
 *
 * Every check here is a floor rather than a judgement. Whether a name means
 * anything is decided by a person, in the manual protocols; this proves the
 * name exists, says what the control does, and survives the conditions
 * (constitution V).
 */

async function openStockBuild(page: Page, hull = 'Anaconda'): Promise<void> {
  await page.goto(`/ships/${hull}`);
  await page.getByRole('button', { name: 'Build stock hull' }).click();
  await expect(page).toHaveURL(/\/build(#|$)/);
  await expect(page.locator('[data-slot-key]').first()).toBeVisible();
}

async function selectMount(page: Page, slotKey: string): Promise<void> {
  const row = page.locator(`[data-slot-key="${slotKey}"] button`).first();
  await row.click();
  await expect(row).toHaveAttribute('aria-pressed', 'true');
}

test.describe('every outfitting state', () => {
  test('an empty workspace says why it is empty and stays sound', async ({ page }, testInfo) => {
    await page.goto('/build');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await sweepOutfittingState(page, testInfo, 'no build');
  });

  test('a refusal is published without breaking the screen', async ({ page }, testInfo) => {
    await openStockBuild(page);
    await selectMount(page, 'CargoHatch');

    // The Almanac refuses to empty the hatch. The reason is the state under
    // test, and it is a state a Commander lands in, not an error page.
    await expect(page.locator('.outfitting__bench-reason')).toBeVisible();
    await sweepOutfittingState(page, testInfo, 'refusal/cargo hatch');
  });

  test('a build with nothing to undo offers both controls, disabled', async ({
    page,
  }, testInfo) => {
    await openStockBuild(page);

    await sweepOutfittingState(page, testInfo, 'history/disabled');
  });

  test('a mount the Almanac offers nothing for says so', async ({ page }, testInfo) => {
    await openStockBuild(page);
    await selectMount(page, 'CargoHatch');
    await sweepOutfittingState(page, testInfo, 'engineering/package empty');
  });
});

test.describe('what every control exposes', () => {
  test('names both power controls by module and by mount', async ({ page }) => {
    await openStockBuild(page);
    const mount = page.locator('[data-slot-key="SmallHardpoint1"]');

    // Forty rows of a ledger are forty controls with the same job. The name is
    // what tells a reader which row they are on.
    const toggle = await mount.locator('.power__toggle').getAttribute('aria-label');
    const priority = await mount
      .locator('.power__priority')
      .evaluate((node) =>
        document.getElementById(node.getAttribute('aria-labelledby') ?? '')?.textContent?.trim(),
      );

    for (const name of [toggle, priority]) {
      expect(name).toBeTruthy();
      expect(name?.toLowerCase()).toContain('pulse laser');
      expect(name?.toLowerCase()).toContain('hardpoint');
    }
  });

  test('exposes selection, checked and disabled programmatically', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'FrameShiftDrive');

    expect(
      (await programmaticState(page, '[data-slot-key="FrameShiftDrive"] .slot__select'))['pressed'],
    ).toBe('true');

    await openEditor(page);
    const blueprint = page.locator('.blueprint input[type="radio"]').first();
    await expect(blueprint).not.toBeChecked();

    // Nothing is carried by colour alone: the state a border shows is the state
    // the control itself reports.
    await page.locator('.blueprint__name').first().click();
    await expect(blueprint).toBeChecked();
  });

  test('gives every drawn control a name that contains what it says', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'FrameShiftDrive');
    await openChooser(page);

    const controls = page.locator('.replacement button, .outfitting__bench button');
    const total = await controls.count();
    expect(total).toBeGreaterThan(0);
    for (let index = 0; index < total; index += 1) {
      await expectNameMatchesVisibleText(controls.nth(index));
    }
  });

  test('names the surface it draws, and makes a layer inert behind it', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'FrameShiftDrive');
    await openChooser(page);

    if (await surfacesAreLayers(page)) {
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      // A native modal dialog: the background is genuinely inert rather than
      // merely covered, so nothing behind it can be reached or read.
      expect(await dialog.evaluate((node) => (node as HTMLDialogElement).matches(':modal'))).toBe(
        true,
      );
      await expect(dialog).toHaveAccessibleName(/frame shift/i);
      return;
    }

    // Inline, there is nothing to be inert behind: the panel is part of the
    // page, and what it owes a reader is its own name.
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.replacement')).toHaveAttribute('aria-label', /frame shift/i);
  });
});

test.describe('the conditions that break layouts', () => {
  test('survives doubled text with nothing cut off and nothing sideways', async ({
    page,
  }, testInfo) => {
    await withRootTextScale(page, DOUBLED_TEXT);
    await openStockBuild(page);
    await selectMount(page, 'FrameShiftDrive');
    await openEditor(page);

    await sweepOutfittingState(page, testInfo, '200% text/engineering');
  });

  test('reflows at 400% zoom rather than scrolling sideways', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 256 });
    await openStockBuild(page);

    await expect(page.locator('.outfitting')).toHaveAttribute('data-composition', 'compact');
    await expectNoDocumentOverflow(page);
    await expectTargetSizes(page);
  });

  test('loses nothing with motion removed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openStockBuild(page);
    await selectMount(page, 'FrameShiftDrive');
    await openEditor(page);

    // The requirement is not less animation: it is that no state was ever only
    // reachable through one.
    await expect(page.locator('.blueprints')).toBeVisible();
    await expectTargetSizes(page);
    await page.emulateMedia({ reducedMotion: null });
  });

  test('mirrors without reordering the ledger', async ({ page }) => {
    await openStockBuild(page);
    const before = await page
      .locator('[data-slot-key]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-slot-key')));

    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    await settled(page);

    const after = await page
      .locator('[data-slot-key]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-slot-key')));

    // The visual direction flips; the package's own outfitting order does not.
    expect(after).toEqual(before);
    await expectNoDocumentOverflow(page);
  });

  test('is operable by the pointer this profile has, with no keyboard', async ({ page }) => {
    await openStockBuild(page);
    // A tap where the profile has touch, a click where it does not: every
    // capability has to be reachable without a keyboard and without a hover
    // state, whichever pointer a Commander is using (constitution V).
    const touch = test.info().project.use.hasTouch === true;
    const press = async (selector: string) => {
      const control = page.locator(selector).first();
      await (touch ? control.tap() : control.click());
    };

    await press('[data-slot-key="FrameShiftDrive"] button');
    await expect(page.locator('[data-slot-key="FrameShiftDrive"] button').first()).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await press('[data-slot-key="SmallHardpoint1"] .power__switch');
    await expect(
      page.locator('[data-slot-key="SmallHardpoint1"] .power__toggle'),
    ).not.toBeChecked();
  });

  test('passes an accessibility scan with the editor open in every layer', async ({
    page,
  }, testInfo) => {
    await openStockBuild(page);
    await selectMount(page, 'FrameShiftDrive');
    await openChooser(page);
    await expectNoAccessibilityViolations(page, testInfo, { label: 'chooser open' });

    await page.locator('.replacement__cancel').click();
    await openEditor(page);
    await expectNoAccessibilityViolations(page, testInfo, { label: 'engineering open' });
  });
});
