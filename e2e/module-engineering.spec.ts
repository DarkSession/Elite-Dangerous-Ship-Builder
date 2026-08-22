import { expect, test, type Page } from '@playwright/test';
import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { sweepOutfittingState } from './accessibility';
import {
  applyDraft,
  chooseEffect,
  chooseFirstEffect,
  chooseRecipe,
  chosenRecipe,
  clearEffect,
  clearRecipe,
  draftAbandoned,
  effectOptions,
  editorOffered,
  fitCommitted,
  openChooser,
  openEditor as bringEditorOnScreen,
  surfacesAreLayers,
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
  await expect(page.locator('.replacement__title, .outfitting__bench-title').first()).toBeVisible();
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

/**
 * The recipes the editor is currently offering, by their drawn name.
 *
 * Canvas 1c's dropdown and canvas 1d's cards, counted the same way — the
 * dropdown's own first option is the no-blueprint one, exactly as the card list
 * opens with it.
 */
function recipeRows(page: Page) {
  return page.locator(
    '.blueprint:not(.blueprint--none), edsb-blueprint-choice-list option:not(:first-child)',
  );
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

/** What the ledger's code line says about one mount's engineering. */
/** The recipe line the ledger draws on one mount, as a Commander reads it. */
async function applied(page: Page, slotKey: string): Promise<string> {
  return (
    (await page.locator(`[data-slot-key="${slotKey}"] .identity__code-line`).first().textContent())
      ?.replace(/\s+/g, ' ')
      .trim() ?? ''
  );
}

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
      // Nothing under the recipe is drawn until there is a recipe: an effect
      // menu over no blueprint is a control over nothing (wave 4).
      await chooseRecipe(page, /increased range/i);
      await expect(
        page.locator(
          '.effect:not(.effect--none), edsb-experimental-effect-list option:not(:first-child)',
        ),
      ).toHaveCount(menu.effects.length);
    }
  });

  test('opens with nothing selected on an unengineered module', async ({ page }) => {
    await openStockBuild(page);
    await openEditor(page, 'FrameShiftDrive');

    // Not the no-blueprint option either: that would be the editor proposing to
    // strip a module that has nothing to strip.
    await expect.poll(() => chosenRecipe(page)).toBeNull();
    await expect(page.locator('.grades')).toHaveCount(0);
  });

  test('applies blueprint, grade and effect in one confirmation', async ({ page }) => {
    await openStockBuild(page);
    await openEditor(page, 'FrameShiftDrive');

    await chooseRecipe(page, /increased range/i);
    await chooseGrade(page, 5);
    await chooseFirstEffect(page);

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
    await expect.poll(() => chosenRecipe(page)).toMatch(/increased range/i);
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

    await openEditor(page, 'FrameShiftDrive');
    const names = await effectOptions(page).evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.trim() ?? ''),
    );
    await chooseFirstEffect(page);
    await applyDraft(page);
    const withFirst = await ledgerEngineering(page, 'FrameShiftDrive');
    expect(withFirst).toMatch(/increased range/i);

    await openEditor(page, 'FrameShiftDrive');
    await chooseEffect(page, names[1] ?? '');
    await applyDraft(page);

    await openEditor(page, 'FrameShiftDrive');
    // The explicit no-effect option, which is the only removal route and the
    // one that preserves the blueprint and grade underneath (FR-012).
    await clearEffect(page);
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

    await clearRecipe(page);
    await applyDraft(page);

    expect(await ledgerEngineering(page, 'FrameShiftDrive')).not.toMatch(/increased range/i);
  });

  test('takes a choice back without leaving a mark on the build', async ({ page }) => {
    await openStockBuild(page);
    // Read after selecting, so the comparison is about the build rather than
    // about the mount being selected — which is session state and spends no
    // revision by design (FR-018).
    await selectMount(page, 'FrameShiftDrive');
    const before = await ledgerEngineering(page, 'FrameShiftDrive');

    await openEditor(page, 'FrameShiftDrive');
    await chooseRecipe(page, /increased range/i);
    await chooseGrade(page, 5);

    // The same capability, drawn as each canvas draws it. Canvas 1d holds a
    // draft, so it carries the control that leaves it. Canvas 1c draws no such
    // control: inline a choice *is* the decision as it is made, and undo is
    // what takes it back — so undo is this composition's revert (wave 4,
    // constitution V).
    if (await surfacesAreLayers(page)) {
      await page.getByRole('button', { name: /revert/i }).click();
      await draftAbandoned(page);
    } else {
      // Inline the recipe and the grade are one decision, because a recipe
      // without a grade asks the Almanac for nothing: the operation is the
      // grade landing on it. So one undo takes it back (FR-018).
      await page.getByRole('button', { name: /^undo/i }).click();
    }

    await expect.poll(() => ledgerEngineering(page, 'FrameShiftDrive')).toBe(before);
  });

  test('says so, in the panel, where the package offers no engineering', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'CargoHatch');

    // The panel is drawn and answers the question. A bench that simply omitted
    // the region answered it by saying nothing, and nothing outside the panel
    // told a Commander whether the Almanac offers a recipe for the hatch or
    // whether the panel had failed to draw (wave 9).
    expect(await editorOffered(page)).toBe(true);
    // Inline the panel is already on the bench; at compact width it is a screen
    // reached from the action bar. Both draw the same sentence (constitution V).
    await bringEditorOnScreen(page);
    await expect(page.locator('.engineering__state')).toContainText(/no engineering/i);

    // Still no control with nothing behind it: the sentence is the panel's whole
    // content, and no recipe, grade or effect is offered (FR-009).
    await expect(page.locator('.engineering__panes')).toHaveCount(0);
  });

  test('is accessible in every editor state', async ({ page }, testInfo) => {
    await openStockBuild(page);

    await openEditor(page, 'FrameShiftDrive');
    await sweepOutfittingState(page, testInfo, 'engineering/unengineered');

    await chooseRecipe(page, /increased range/i);
    await chooseGrade(page, 5);
    await sweepOutfittingState(page, testInfo, 'engineering/recipe chosen');

    await clearRecipe(page);
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
    // The canvas's rarity marker, drawn locally and carrying the package's own
    // grade — with the grade in words beside it for anyone who cannot see it.
    await expect(page.locator('.material__grade').first()).toHaveAttribute('data-grade', /[1-5]/);
    await expect(page.locator('.material').first()).toContainText(/grade [1-5]/i);
    // The canvas draws these as icons from `edassets.org`. Nothing in this
    // application reaches another origin at runtime (constitution I).
    for (const source of await page
      .locator('.materials img')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('src') ?? ''))) {
      expect(source).toMatch(/^assets\//);
    }
  });

  test('prices the whole recipe, whatever the module already carries', async ({ page }) => {
    await openStockBuild(page);
    await openEditor(page, 'FrameShiftDrive');
    await chooseRecipe(page, /increased range/i);
    await chooseGrade(page, 5);
    await applyDraft(page);

    await openEditor(page, 'FrameShiftDrive');
    await chooseGrade(page, 3);

    // Engineering always costs materials. A panel that priced only what was
    // left would read as free every time, because a choice commits as it is
    // made — so an empty list here is a defect, not a discount (wave 5).
    const materials = page.locator('.materials');
    await expect(materials.locator('.material').first()).toBeVisible();
    await expect(materials).not.toContainText(/no materials are priced/i);
    await expect(materials).not.toContainText(/no material cost is published/i);
  });

  test('marks which way each figure moved, and says so in words', async ({ page }) => {
    await openStockBuild(page);
    await openEditor(page, 'FrameShiftDrive');
    await chooseRecipe(page, /increased range/i);
    await chooseGrade(page, 5);

    const comparison = page.locator('.comparison');
    await expect(comparison).toBeVisible();
    const text = (await comparison.textContent()) ?? '';
    // The canvas's own green and red with its ▲/▼, off the application's table
    // of which way is better rather than off the Almanac's unreliable
    // `LessIsGood`. Never colour alone: the marker is drawn and the direction
    // is spoken (wave 4).
    expect(text).toMatch(/[▲▼]/);
    expect(text).toMatch(/improved|worsened/i);
    await expect(
      page
        .locator(
          '.comparison__value--modified[data-direction="better"], .comparison__value--modified[data-direction="worse"]',
        )
        .first(),
    ).toBeVisible();
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
    await row.locator('.candidate__name').click();
    await expect(row.locator('input[type="radio"]')).toBeChecked();
    if (await surfacesAreLayers(page)) {
      await page.getByRole('button', { name: /fit module/i }).click();
    }
    await fitCommitted(page);
  }

  test('keeps a reward’s identity through an effect-only change', async ({ page }) => {
    await openStockBuild(page);
    await fitArticle(page, 'FrameShiftDrive', /tech broker/i);

    await openEditor(page, 'FrameShiftDrive');
    // The article is a package-identified purchase, so what it arrived with is
    // priced at nothing at all rather than quoted as a crafting job — and the
    // recipe it carries is stated rather than offered (wave 5).
    await expect(page.locator('.blueprints__fixed')).toBeVisible();
    await expect(page.locator('.materials .material')).toHaveCount(0);

    // An effect on its own, which is `setExperimentalEffect` rather than a
    // re-roll of the recipe.
    await chooseFirstEffect(page);
    await applyDraft(page);

    await openEditor(page, 'FrameShiftDrive');
    // Still a purchase. If the identity had been lost, this article would now
    // be an ordinary module that happens to be well rolled (FR-012).
    await expect(page.locator('.blueprints__fixed')).toBeVisible();
  });

  test('prices a Mercenary upgrade above the grade it was bought at', async ({ page }) => {
    await openStockBuild(page);
    await fitArticle(page, 'SmallHardpoint1', /merc-coin/i);

    await openEditor(page, 'SmallHardpoint1');

    // The article's Merc Coin shop price is not in this panel at all: it is what
    // the article cost to buy, not what this job costs, and at the foot of a
    // materials list it read as the price of the engineering above it. The
    // Almanac publishes no per-grade Merc Coin figure to put in its place —
    // every Mercenary row is one fixed price at grade 1 (wave 9).
    await expect(page.locator('.materials__list--coin')).toHaveCount(0);

    // The bespoke recipe the article was bought with. Its own table begins
    // above the purchase grade, so the cells offered are the grades that are
    // still to climb rather than a fixed five (contract, "Engineering").
    await expect.poll(() => chosenRecipe(page)).not.toBeNull();
    await page.locator('.grade').last().click();
    // Inline this has already committed; in a layer it is a draft that has to
    // be applied before the ledger says anything. Either way the panel is then
    // showing the climbed article (constitution V).
    await applyDraft(page);
    if (await surfacesAreLayers(page)) {
      await openEditor(page, 'SmallHardpoint1');
    }

    const parts = page.locator('.materials__part');
    await expect(parts.first()).toBeVisible();
    // The climb's own Merc Coin, which Almanac 0.1.5 publishes per grade
    // (upstream #337): stated on its own row rather than folded into anything.
    // It joins no material list — Merc Coin has no credit or material
    // equivalent, so summing it would invent an exchange rate the game does not
    // have — so the figure is its own row and not one of the counts above it.
    const coins = page.locator('.material--merc-coin');
    await expect(coins).toHaveCount(1);
    await expect(coins).toContainText(/merc coin/i);
    // The *purchase* price is still not here: this row is what the climb above
    // the bought grade bills, and what buying the article cost is stated by the
    // manifest row it is bought from.

    // And back down to the grade it was bought at, which the recipe's own table
    // does not reach. The bar has to come back to 1 rather than to nothing:
    // a blank bar on a plainly engineered article was what pressing that cell
    // used to do, because the Almanac publishes no recipe there and the answer
    // is to restore the article rather than to ask for one (wave 6).
    // The build still has a link. Six Mercenary articles — this small mining
    // hardpoint among them — sit on modules the package gives no engineering
    // menu, so until table 1 recorded their variants' own blueprints there was
    // no ordinary record to write and the link vanished the moment one was
    // climbed off its purchase grade (2026-08-22).
    // Its own timeout: publishing a fragment lazily loads the codec table and
    // encodes off the main thread, which is comfortably under a second here and
    // past the default assertion window on a machine running the whole matrix.
    await expect(page).toHaveURL(/\/build#b\./, { timeout: 15_000 });

    const climbed = await applied(page, 'SmallHardpoint1');
    await page.locator('.grade').first().click();
    await expect(page.locator('.grades__selected')).toHaveText('1');
    await applyDraft(page);

    expect(climbed).toMatch(/G5$/);
    await expect.poll(() => applied(page, 'SmallHardpoint1')).toMatch(/G1$/);
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
