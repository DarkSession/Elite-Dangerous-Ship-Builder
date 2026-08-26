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
import {
  chooseRecipe,
  chosenRecipe,
  closeAllFamilies,
  manifestOf,
  openAllFamilies,
  openChooser,
  openEditor,
  surfacesAreLayers,
} from './outfitting-surfaces';

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
    expect(await chosenRecipe(page)).toBeNull();

    // Nothing is carried by colour alone: the state a fill or a border shows is
    // the state the control itself reports — a checked radio on the card list,
    // a selected option in the dropdown.
    await chooseRecipe(page, /increased range/i);
    await expect.poll(() => chosenRecipe(page)).toMatch(/increased range/i);
  });

  test('gives every drawn control a name that contains what it says', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'FrameShiftDrive');
    await openChooser(page);

    // Every control the bench draws, not only its buttons: canvas 1c's panels
    // carry dropdowns and a search field and, on a required mount, no button at
    // all (wave 4).
    const controls = page.locator(
      '.outfitting__bench button, .outfitting__bench select, .outfitting__bench a[href]',
    );
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

    // And with a family open, which is the state the chooser is actually read
    // in: the widest thing on the screen becomes a row rather than a bar.
    await selectMount(page, 'SmallHardpoint1');
    await openChooser(page);
    await openAllFamilies(page);
    await settled(page);

    await expectNoDocumentOverflow(page);
    await expectTargetSizes(page, '.family');
  });

  test('loses nothing with motion removed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openStockBuild(page);
    await selectMount(page, 'FrameShiftDrive');
    await openEditor(page);

    // The requirement is not less animation: it is that no state was ever only
    // reachable through one.
    await expect(page.locator('.engineering').first()).toBeVisible();
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

  /**
   * The family list, in each of the three states it can be in.
   *
   * The chooser opens with one family open and the rest closed, a search opens
   * every family it matched, and a Commander can close every one of them. All
   * three are on screen states with their own structure, and a scan of only the
   * first would be a scan of the state the product happens to start in
   * (FR-020–FR-023).
   */
  test('passes an accessibility scan in every family state', async ({ page }, testInfo) => {
    // Four whole-page scans of the fullest screen the product draws, in one
    // test. Each one alone costs a good part of the default budget on an
    // unloaded machine, and the ten-project matrix never runs one test alone.
    // The budget is what gives way, not the coverage: dropping a state would
    // leave a state unscanned, which is the thing this test exists to prevent.
    test.slow();

    await openStockBuild(page);
    await selectMount(page, 'SmallHardpoint1');
    await openChooser(page);

    await expect(page.locator('.family').first()).toBeVisible();
    await expectNoAccessibilityViolations(page, testInfo, { label: 'families seeded' });

    await openAllFamilies(page);
    await expectNoAccessibilityViolations(page, testInfo, { label: 'families open' });

    await page.locator('input[type="search"]').fill('multi');
    await expect(page.locator('.family').first()).toBeVisible();
    await expectNoAccessibilityViolations(page, testInfo, { label: 'families searched' });

    await page.locator('input[type="search"]').fill('');
    await closeAllFamilies(page);
    await expectNoAccessibilityViolations(page, testInfo, { label: 'families all closed' });
  });

  test('gives a family control its name, its count and its revealed state', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'SmallHardpoint1');
    await openChooser(page);

    const controls = page.locator('.family');
    const total = await controls.count();
    expect(total).toBeGreaterThan(1);

    for (let index = 0; index < total; index += 1) {
      const control = controls.nth(index);
      const state = await programmaticState(page, `.family >> nth=${index}`);

      // The revealed state is published rather than drawn, in whichever word the
      // control's own shape calls for: `expanded` on the accordion's disclosure,
      // `pressed` on the rail's selection. What is not allowed is neither — a
      // caret, or an amber edge, carrying it alone (FR-022).
      expect(
        state['expanded'] ?? state['pressed'],
        'a family control publishes no revealed state',
      ).not.toBeNull();
      expect(await control.getAttribute('aria-controls')).not.toBeNull();

      // Its name is the Almanac's family name and the count as a sentence, and
      // not the caret. The count chip beside the name is `aria-hidden`, so the
      // figure reaches a reader only through that sentence — read from the
      // computed name rather than from the control's own text, which would
      // contain the chip whether or not anyone could hear it.
      // The computed name: the control's text with its `aria-hidden` decoration
      // removed, which is what a reader is given.
      const name = (
        await control.evaluate((node) => {
          const clone = node.cloneNode(true) as HTMLElement;
          for (const hidden of clone.querySelectorAll('[aria-hidden="true"]')) {
            hidden.remove();
          }
          return clone.textContent ?? '';
        })
      )
        .replace(/\s+/gu, ' ')
        .trim();
      const drawn = (await control.locator('.family__count').innerText()).replace(/\D+/gu, '');
      const spoken = await control.locator('.visually-hidden').innerText();

      expect(name.length).toBeGreaterThan(0);
      expect(spoken).toContain(drawn);
      expect(name).toContain(spoken.trim());
      expect(name).not.toContain('\u25be');
      expect(name).not.toContain('\u203a');
    }

    // Nothing about a family is carried by the caret alone — where one is drawn
    // at all. Canvas 1c's rail has none: there is nothing to expand at that
    // width, because the rows are in the pane beside the names.
    const carets = page.locator('.family__caret');
    if ((await carets.count()) > 0) {
      await expect(carets.first()).toHaveAttribute('aria-hidden', 'true');
    } else {
      expect(await manifestOf(page)).toBe('rail');
    }
  });

  test('keeps the family control a full-size target at this width', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'SmallHardpoint1');
    await openChooser(page);

    // A real control at every width, and deliberately not in the dense
    // exemption: one bar per family is a handful of controls, not forty inline
    // chips (module-replacement design, "Accessibility"). The ten-project
    // matrix runs this at every layout profile, touch ones included, so this is
    // the assertion at all five widths rather than at a chosen one.
    await expectTargetSizes(page, '.family');

    await openAllFamilies(page);
    await settled(page);
    await expectNoDocumentOverflow(page);
    await expectTargetSizes(page, '.family');
  });

  test('passes an accessibility scan with the editor open in every layer', async ({
    page,
  }, testInfo) => {
    await openStockBuild(page);
    await selectMount(page, 'FrameShiftDrive');
    await openChooser(page);
    await expectNoAccessibilityViolations(page, testInfo, { label: 'chooser open' });

    // Canvas 1d's chooser is a screen over the bench, so it is left before the
    // editor is reached. Canvas 1c draws both panels at once and has no such
    // control (design-canvas rule).
    if (await surfacesAreLayers(page)) {
      await page.locator('.replacement__cancel').click();
    }
    await openEditor(page);
    await expectNoAccessibilityViolations(page, testInfo, { label: 'engineering open' });
  });
});
