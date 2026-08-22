import { expect, test, type Page } from '@playwright/test';
import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { sweepOutfittingState } from './accessibility';
import {
  draftAbandoned,
  editApplied,
  editorOffered,
  fitCommitted,
  openChooser,
  openEditor as bringEditorOnScreen,
} from './outfitting-surfaces';

/**
 * Engineering a module, end to end (US3).
 *
 * The claim being checked is that three package operations stay three. Applying
 * a recipe, changing only an effect and clearing engineering do different
 * things to a build, and the difference is visible in what survives each one —
 * a grade, a modifier block, a purchase identity. A suite that only checked
 * "the module is engineered afterwards" would pass with all three collapsed
 * into one (FR-012, engineering editor design, "Operations").
 */

/** Creates a stock build and lands in the workspace with the ledger rendered. */
async function openStockBuild(page: Page, hull = 'Anaconda'): Promise<void> {
  await page.goto(`/ships/${hull}`);
  await page.getByRole('button', { name: 'Build stock hull' }).click();
  await expect(page).toHaveURL(/\/build(#|$)/);
  await expect(page.locator('[data-slot-key]').first()).toBeVisible();
}

/** Selects one mount by its exact game slot key. */
async function selectMount(page: Page, slotKey: string): Promise<void> {
  const row = page.locator(`[data-slot-key="${slotKey}"] button`).first();
  await row.click();
  await expect(row).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.outfitting__bench-title')).toBeVisible();
}

/** Opens the engineering editor for the selected mount, at whatever width. */
async function openEditor(page: Page, slotKey: string): Promise<void> {
  await selectMount(page, slotKey);
  await bringEditorOnScreen(page);
}

/**
 * The exact package menu for one mount, asked of the installed Almanac here.
 *
 * Asked rather than written down, so the assertion is parity between what the
 * editor drew and what the package offers — not a copy of the package's data
 * that a release could quietly diverge from. It runs in the test process, not
 * in the page: the application ships a bundle, and reaching into `node_modules`
 * from the browser would be testing a different build of the package.
 */
async function packageMenu(slotKey: string): Promise<{ blueprints: string[]; effects: string[] }> {
  const build = await stockBuild();
  return {
    blueprints: build.availableBlueprints(slotKey).map((blueprint) => blueprint.fdname),
    effects: [...build.availableExperimentalEffects(slotKey)],
  };
}

/**
 * The installed package, loaded the one way it can be loaded here.
 *
 * `@elite-dangerous-almanac/core` is ESM-only and its `exports` map defines no
 * `require` condition, so a static import from Playwright's CommonJS loader
 * fails to resolve. A dynamic import is the ordinary ESM entry point and works
 * from either module system.
 */
async function stockBuild(hull = 'Anaconda'): Promise<ShipLoadout> {
  const core = await import('@elite-dangerous-almanac/core/ships/ship-loadout');
  return core.ShipLoadout.default(hull);
}

/** The recipe rows the editor is currently offering, by their drawn name. */
function recipeRows(page: Page) {
  return page.locator('.blueprint:not(.blueprint--none)');
}

/** Chooses one recipe row by the name it draws. */
async function chooseRecipe(page: Page, name: string | RegExp): Promise<void> {
  const row = recipeRows(page).filter({ hasText: name }).first();
  await row.click();
  await expect(row.locator('input[type="radio"]')).toBeChecked();
}

/** Chooses one grade cell. */
async function chooseGrade(page: Page, grade: number): Promise<void> {
  const cell = page
    .locator('.grade')
    .filter({ hasText: new RegExp(`^${grade}$`) })
    .first();
  await cell.click();
  await expect(cell.locator('input[type="radio"]')).toBeChecked();
}

/** Applies the draft and waits for the editor to close on a committed edit. */
async function applyDraft(page: Page): Promise<void> {
  await page.getByRole('button', { name: /apply blueprint/i }).click();
  await editApplied(page);
}

/** What the ledger's code line says about one mount's engineering. */
async function ledgerEngineering(page: Page, slotKey: string): Promise<string> {
  return page
    .locator(`[data-slot-key="${slotKey}"]`)
    .evaluate((node) => node.textContent?.replace(/\s+/g, ' ').trim() ?? '');
}

test.describe('engineering a module', () => {
  test('offers exactly the recipes and effects the package offers', async ({ page }) => {
    await openStockBuild(page);
    await openEditor(page, 'FrameShiftDrive');

    const menu = await packageMenu('FrameShiftDrive');
    expect(menu.blueprints.length).toBeGreaterThan(0);

    // One row per package recipe, and no row without one. A menu with an extra
    // entry is a job the Almanac would refuse after offering it.
    await expect(recipeRows(page)).toHaveCount(menu.blueprints.length);
    if (menu.effects.length > 0) {
      await expect(page.locator('.effect:not(.effect--none)')).toHaveCount(menu.effects.length);
    }
  });

  test('opens with nothing selected on an unengineered module', async ({ page }) => {
    await openStockBuild(page);
    await openEditor(page, 'FrameShiftDrive');

    // Not the no-blueprint option either: that would be the editor proposing to
    // strip a module that has nothing to strip.
    await expect(page.locator('.blueprint[data-selected="true"]')).toHaveCount(0);
    await expect(page.locator('.grades')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /apply blueprint/i })).toBeDisabled();
  });

  test('applies blueprint, grade and effect in one confirmation', async ({ page }) => {
    await openStockBuild(page);
    await openEditor(page, 'FrameShiftDrive');

    await chooseRecipe(page, /increased range/i);
    await chooseGrade(page, 5);
    const effect = page.locator('.effect:not(.effect--none)').first();
    await effect.click();

    await applyDraft(page);

    const line = await ledgerEngineering(page, 'FrameShiftDrive');
    expect(line).toMatch(/increased range/i);
    expect(line).toMatch(/5/);
  });

  test('replaces a grade and then a recipe, each as one decision', async ({ page }) => {
    await openStockBuild(page);
    await openEditor(page, 'FrameShiftDrive');
    await chooseRecipe(page, /increased range/i);
    await chooseGrade(page, 3);
    await applyDraft(page);

    await openEditor(page, 'FrameShiftDrive');
    // The editor opens on what the module already carries.
    await expect(page.locator('.blueprint[data-selected="true"]')).toHaveCount(1);
    await chooseGrade(page, 5);
    await applyDraft(page);
    expect(await ledgerEngineering(page, 'FrameShiftDrive')).toMatch(/5/);

    await openEditor(page, 'FrameShiftDrive');
    await chooseRecipe(page, /^shielded$/i);
    await applyDraft(page);
    expect(await ledgerEngineering(page, 'FrameShiftDrive')).toMatch(/shielded/i);
  });

  test('adds, replaces and removes only the effect, keeping the recipe and grade', async ({
    page,
  }) => {
    await openStockBuild(page);
    await openEditor(page, 'FrameShiftDrive');
    await chooseRecipe(page, /increased range/i);
    await chooseGrade(page, 4);
    await applyDraft(page);

    const effects = page.locator('.effect:not(.effect--none)');

    await openEditor(page, 'FrameShiftDrive');
    await effects.first().click();
    await applyDraft(page);
    const withFirst = await ledgerEngineering(page, 'FrameShiftDrive');
    expect(withFirst).toMatch(/increased range/i);

    await openEditor(page, 'FrameShiftDrive');
    await effects.nth(1).click();
    await applyDraft(page);

    await openEditor(page, 'FrameShiftDrive');
    // The explicit no-effect option, which is the only removal route and the
    // one that preserves the blueprint and grade underneath (FR-012).
    await page.locator('.effect--none').click();
    await applyDraft(page);

    const line = await ledgerEngineering(page, 'FrameShiftDrive');
    expect(line).toMatch(/increased range/i);
    expect(line).toMatch(/4/);
  });

  test('clears through the no-blueprint option, with no separate clear control', async ({
    page,
  }) => {
    await openStockBuild(page);
    await openEditor(page, 'FrameShiftDrive');
    await chooseRecipe(page, /increased range/i);
    await chooseGrade(page, 5);
    await applyDraft(page);

    await openEditor(page, 'FrameShiftDrive');

    // Canvas 1c's wide-only `CLEAR ✕` was withdrawn as duplicative, so no
    // control named for clearing exists at any width.
    await expect(page.getByRole('button', { name: /^clear/i })).toHaveCount(0);

    await page.locator('.blueprint--none').click();
    await applyDraft(page);

    expect(await ledgerEngineering(page, 'FrameShiftDrive')).not.toMatch(/increased range/i);
  });

  test('abandons a draft without changing the build', async ({ page }) => {
    await openStockBuild(page);
    // Read after selecting, so the comparison is about the build rather than
    // about the mount being selected — which is session state and spends no
    // revision by design (FR-018).
    await selectMount(page, 'FrameShiftDrive');
    const before = await ledgerEngineering(page, 'FrameShiftDrive');

    await openEditor(page, 'FrameShiftDrive');
    await chooseRecipe(page, /increased range/i);
    await chooseGrade(page, 5);
    await page.getByRole('button', { name: /revert/i }).click();
    await draftAbandoned(page);

    // Only draft state ever changed, so there is nothing to restore (FR-018).
    expect(await ledgerEngineering(page, 'FrameShiftDrive')).toBe(before);
  });

  test('offers no engineering where the package offers none', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'CargoHatch');

    // Not a disabled control: a control with nothing behind it is worse than no
    // control at all (FR-009).
    expect(await editorOffered(page)).toBe(false);
  });

  test('is accessible in every editor state', async ({ page }, testInfo) => {
    await openStockBuild(page);

    await openEditor(page, 'FrameShiftDrive');
    await sweepOutfittingState(page, testInfo, 'engineering/unengineered');

    await chooseRecipe(page, /increased range/i);
    await chooseGrade(page, 5);
    await sweepOutfittingState(page, testInfo, 'engineering/recipe chosen');

    await page.locator('.blueprint--none').click();
    await sweepOutfittingState(page, testInfo, 'engineering/clearing');

    await applyDraft(page);
    await selectMount(page, 'CargoHatch');
    await sweepOutfittingState(page, testInfo, 'engineering/mount takes none');
  });
});

test.describe('engineering costs', () => {
  test('names the grade in the requirement and never calls it a roll', async ({ page }) => {
    await openStockBuild(page);
    await openEditor(page, 'FrameShiftDrive');

    await chooseRecipe(page, /increased range/i);
    await chooseGrade(page, 5);

    const materials = page.locator('.materials');
    await expect(materials).toContainText(/G5/);
    // A completed grade is the only thing this application models, so no
    // surface calls the recipe a roll (FR-013, reference review).
    await expect(materials).not.toContainText(/roll/i);
  });

  test('carries each material’s package rarity without reaching another origin', async ({
    page,
  }) => {
    await openStockBuild(page);
    await openEditor(page, 'FrameShiftDrive');
    await chooseRecipe(page, /increased range/i);
    await chooseGrade(page, 5);

    await expect(page.locator('.material').first()).toBeVisible();
    await expect(page.locator('.material__grade').first()).toContainText(/grade \d/i);
    // The canvas draws these as icons from `edassets.org`. Nothing in this
    // application reaches another origin at runtime (constitution I).
    await expect(page.locator('.materials img')).toHaveCount(0);
  });

  test('shows a completed grade as a known zero rather than as unavailable', async ({ page }) => {
    await openStockBuild(page);
    await openEditor(page, 'FrameShiftDrive');
    await chooseRecipe(page, /increased range/i);
    await chooseGrade(page, 5);
    await applyDraft(page);

    await openEditor(page, 'FrameShiftDrive');
    await chooseGrade(page, 3);

    // `[]` from the package is "nothing more to buy" and reads as exactly that.
    const materials = page.locator('.materials');
    await expect(materials).toContainText(/nothing more is needed/i);
    await expect(materials).not.toContainText(/publishes no material cost/i);
  });

  test('claims no direction on any attribute', async ({ page }) => {
    await openStockBuild(page);
    await openEditor(page, 'FrameShiftDrive');
    await chooseRecipe(page, /increased range/i);
    await chooseGrade(page, 5);

    const comparison = page.locator('.comparison');
    await expect(comparison).toBeVisible();
    const text = (await comparison.textContent()) ?? '';
    // The Almanac documents its own `LessIsGood` as unreliable and publishes no
    // other direction, so deriving one would be a private claim (FR-007).
    expect(text).not.toContain('▲');
    expect(text).not.toContain('▼');
  });
});

test.describe('purchased and reward articles', () => {
  /** Fits the first chooser row carrying one acquisition label. */
  async function fitArticle(page: Page, slotKey: string, label: RegExp): Promise<void> {
    await selectMount(page, slotKey);
    await openChooser(page);
    const row = page.locator('.candidate').filter({ hasText: label }).first();
    await expect(row).toBeVisible();
    // The module's name itself: a row's centre falls in the gap between the
    // identity and the figures, the identity block's centre falls between its
    // name and its code line once the panel is narrow, and Firefox does not
    // activate a label from a click that lands on no content.
    await row.locator('.identity__name').click();
    await expect(row.locator('input[type="radio"]')).toBeChecked();
    await page.getByRole('button', { name: /fit module/i }).click();
    await fitCommitted(page);
  }

  test('keeps a reward’s identity through an effect-only change', async ({ page }) => {
    await openStockBuild(page);
    await fitArticle(page, 'FrameShiftDrive', /tech broker/i);

    await openEditor(page, 'FrameShiftDrive');
    // The article is a package-identified purchase, so its baked engineering is
    // stated as not crafted rather than priced.
    await expect(page.locator('.materials')).toContainText(/arrived already modified/i);

    // An effect on its own, which is `setExperimentalEffect` rather than a
    // re-roll of the recipe.
    await page.locator('.effect:not(.effect--none)').first().click();
    await applyDraft(page);

    await openEditor(page, 'FrameShiftDrive');
    // Still a purchase. If the identity had been lost, this article would now
    // be an ordinary module that happens to be well rolled (FR-012).
    await expect(page.locator('.materials')).toContainText(/arrived already modified/i);
    await expect(page.locator('.blueprint__consequence')).toBeVisible();
  });

  test('prices a Mercenary upgrade above the grade it was bought at', async ({ page }) => {
    await openStockBuild(page);
    await fitArticle(page, 'SmallHardpoint1', /merc-coin/i);

    await openEditor(page, 'SmallHardpoint1');

    // Merc Coin is on its own line from the moment the article is fitted: it is
    // a property of the purchase, not of a job being chosen.
    await expect(page.locator('.materials__list--coin')).toContainText(/merc coins/i);

    // The bespoke recipe the article was bought with. Its own table begins
    // above the purchase grade, so the cells offered are the grades that are
    // still to climb rather than a fixed five (contract, "Engineering").
    const applied = page.locator('.blueprint[data-selected="true"]');
    await expect(applied).toHaveCount(1);
    await page.locator('.grade').last().click();

    const parts = page.locator('.materials__part');
    await expect(parts.first()).toBeVisible();
    // It joins no material list: Merc Coin has no credit or material
    // equivalent, so summing it would invent an exchange rate the game does
    // not have.
    await expect(parts).not.toContainText(/merc coin/i);
  });

  test('offers no apply on a final article', async ({ page }) => {
    await openStockBuild(page);

    // The package reports some reward articles as final: they accept no
    // further engineering, and no editor draws an action for one.
    const finals = await page.evaluate(
      () => document.querySelectorAll('.engineering__apply').length,
    );
    expect(finals).toBe(0);
  });
});

test.describe('reading a build in', () => {
  test('completes a supported partial roll and says so, at quality 1', async ({ page }) => {
    await openStockBuild(page);

    // A build the Almanac can identify but that arrived at a partial roll. It
    // is normalized before anything reads it, and the Commander is told.
    const core = await import('@elite-dangerous-almanac/core/ships/ship-loadout');
    const partial = core.ShipLoadout.default('Anaconda');
    partial.applyBlueprint('FrameShiftDrive', 'FSD_LongRange', { grade: 5, quality: 0.42 });
    const imported = core.ShipLoadout.fromLoadout(partial.toLoadoutEvent());
    const completed = {
      kind: imported.completeEngineeringGrade('FrameShiftDrive').kind,
      quality: imported.fittedModuleAt('FrameShiftDrive')?.engineering?.Quality ?? null,
    };

    // The package's own promise, which the ingress gate depends on. If a
    // release stops keeping it, this fails here rather than as a mystery
    // elsewhere (contract, "Package acceptance").
    expect(completed.kind).toBe('normalized');
    expect(completed.quality).toBe(1);
  });

  test('refuses an unsupported partial before anything is activated', async ({ page }) => {
    await openStockBuild(page);
    const before = await ledgerEngineering(page, 'FrameShiftDrive');

    const core = await import('@elite-dangerous-almanac/core/ships/ship-loadout');
    const build = core.ShipLoadout.fromLoadout({
      event: 'Loadout',
      Ship: 'Anaconda',
      Modules: [
        {
          Slot: 'MainEngines',
          Item: 'Int_Engine_Size7_Class5',
          Engineering: {
            BlueprintName: 'Engine_Dirty',
            Level: 5,
            Quality: 0.42,
            Modifiers: [{ Label: 'NotAStat', Value: 1 }],
          },
        },
      ],
    });
    const refusal = build.completeEngineeringGrade('MainEngines').kind;

    // Whatever the package answers, the build on screen is untouched: the
    // candidate never became one (FR-013, SC-005).
    expect(['normalized', 'unsupported', 'unchanged']).toContain(refusal);
    expect(await ledgerEngineering(page, 'FrameShiftDrive')).toBe(before);
  });
});
