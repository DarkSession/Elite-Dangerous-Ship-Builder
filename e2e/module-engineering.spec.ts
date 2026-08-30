import { expect, test, type Page } from '@playwright/test';
import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import englishMessages from '../src/app/i18n/locales/en.json';
import { sweepOutfittingState } from './accessibility';
import {
  applyDraft,
  benchFollowedSelection,
  chooseEffect,
  chooseFirstEffect,
  chooseRecipe,
  chosenRecipe,
  clearEffect,
  clearRecipe,
  draftAbandoned,
  editorOffered,
  effectOptions,
  fitCommitted,
  openEditor as bringEditorOnScreen,
  revealFamilyHolding,
  revealMount,
  surfacesAreLayers,
} from './outfitting-surfaces';
import { buildStockHull, reachShellAction } from './shell';

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
  await buildStockHull(page, 'Build');
  await expect(page).toHaveURL(/\/build(#|$)/);
  await expect(page.locator('[data-slot-key]').first()).toBeVisible();
}

/** Selects one mount by its exact game slot key. */
async function selectMount(page: Page, slotKey: string): Promise<void> {
  await revealMount(page, slotKey);
  const row = page.locator(`[data-slot-key="${slotKey}"] button`).first();
  await row.click();
  await expect(row).toHaveAttribute('aria-pressed', 'true');
  await benchFollowedSelection(page);
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
    blueprints: build.availableBlueprints(slotKey).map((blueprint) => blueprint.blueprintSymbol),
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
  // The row, not this screenful: at compact width the ledger draws one category
  // at a time, so a mount read after a journey that left another tab open is
  // not on the page until its own is pressed.
  await revealMount(page, slotKey);
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
      //
      // Reached through the shell rather than pressed on the banner: the bar
      // draws its actions on the row only where they fit, and holds them in the
      // named menu everywhere else, so a journey that wants an action asks for
      // it by name rather than for the composition it is in.
      await reachShellAction(page, /^undo/i);
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

    // Still no control with nothing behind it: no recipe, grade or effect is
    // offered (FR-009). The details half stays — the hatch has the attributes
    // it was catalogued with whether or not anything will ever engineer them,
    // and FR-009 requires its facts to be exposed (wave 11).
    await expect(page.locator('edsb-blueprint-choice-list')).toHaveCount(0);
    await expect(page.locator('edsb-grade-selector')).toHaveCount(0);
    await expect(page.locator('edsb-experimental-effect-list')).toHaveCount(0);
    await expect(page.locator('.engineering__attributes')).toBeVisible();

    // And the panel keeps its shape: the sentence takes the half the controls
    // would have taken and the attributes stay in the half they are in on
    // every other article, rather than the table sliding under the sentence
    // into a one-column panel of its own (wave 11, Commander request).
    await expect(page.locator('.engineering__choices .engineering__state')).toContainText(
      /no engineering/i,
    );
    await expect(page.locator('.engineering__result .engineering__attributes')).toBeVisible();
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
  test('prices no job of its own — the rail states the build’s materials', async ({ page }) => {
    await openStockBuild(page);
    await openEditor(page, 'FrameShiftDrive');
    await chooseRecipe(page, /increased range/i);
    await chooseGrade(page, 5);

    // Neither canvas draws a materials list inside the editor: it holds the
    // article's attributes, and the recipe, the grade and the effect, and the
    // only `MATERIALS` block on either canvas is the build-wide one in the
    // rail (wave 11, Commander
    // request, reversing waves 5 and 9). Its rarity marks, its ordering, its
    // counts and its Merc Coin row are covered where it lives, in
    // `cost-and-materials.spec.ts`.
    const editor = page.locator('.engineering').first();
    await expect(editor.locator('.materials, edsb-material-cost-list')).toHaveCount(0);
    await expect(editor).not.toContainText(/materials/i);
    // A completed grade is the only thing this application models, so no
    // surface calls the recipe a roll (FR-013, reference review).
    await expect(editor).not.toContainText(/roll/i);

    // Gone from the panel, not from the build: once the job is on the module,
    // the rail states its materials. Counted rather than seen — at compact
    // width the editor is a screen over the workspace and the rail is behind
    // it, so this is read after leaving the editor, and the rail's own block
    // may sit inside the Status stack there (feature 009).
    await applyDraft(page);
    await expect
      .poll(() => page.locator('edsb-cost-materials .rail-material').count())
      .toBeGreaterThan(0);
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

  test('states an absent figure as a value, and lists what the package calculates', async ({
    page,
  }, testInfo) => {
    await openStockBuild(page);
    await openEditor(page, 'SmallHardpoint1');
    await chooseRecipe(page, /rapid fire/i);
    await chooseGrade(page, 5);

    const comparison = page.locator('.comparison');
    await expect(comparison).toBeVisible();

    // Rapid fire gives a pulse laser a jitter the catalogue never gave it, so
    // the stock side of that row has no figure. It is a number that is absent,
    // not a name the catalogue lost, and the cell says so.
    const jitter = comparison.locator('tr', { has: page.getByText(/^Jitter/) });
    await expect(jitter.locator('.comparison__value .unavailable')).toBeVisible();
    await expect(comparison).not.toContainText(/name unavailable/i);

    // Damage per second is what the recipe is chosen for, and the Almanac
    // calculates it. Both readings are drawn, after the stats they come from.
    const dps = comparison.locator('tr', {
      has: page.getByText(englishMessages['outfitting.engineering.attribute.damagePerSecond'], {
        exact: true,
      }),
    });
    await expect(dps).toBeVisible();
    await expect(dps.locator('.comparison__value').first()).toHaveText(/\d/);
    await expect(dps.locator('.comparison__value--modified')).toHaveText(/\d/);

    // A pulse laser never stops to reload, so it sustains what it starts with,
    // and it fires one round a shot. Both rows would be a row above them
    // written twice, and both are left off.
    for (const key of [
      'outfitting.engineering.attribute.sustainedDamagePerSecond',
      'outfitting.engineering.attribute.damagePerShot',
    ] as const) {
      await expect(comparison).not.toContainText(englishMessages[key]);
    }

    // The drive every other swept state opens has no one-sided row and no
    // calculated figure, so this is the only state that renders either. It
    // carries the table's longest label, in a column that does not wrap.
    await sweepOutfittingState(page, testInfo, 'engineering/weapon figures');
  });

  test('reserves the room the three controls take, before any is used', async ({ page }) => {
    // The grade and the effect follow from a recipe, so an unengineered module
    // opened a column shorter than an engineered one by both of them — and the
    // panel under the hand that was reading it moved when a recipe was chosen
    // (Commander requests 2026-08-28 and 2026-08-29). Nothing is drawn that is
    // not there: what is reserved is the room, as the column's own floor.
    await openStockBuild(page);
    await openEditor(page, 'FrameShiftDrive');

    const editor = page.locator('.engineering').first();
    const choices = page.locator('.engineering__choices');
    await expect(choices).toBeVisible();

    if (await surfacesAreLayers(page)) {
      // The full-screen composition stacks the three down a screen that
      // scrolls, with nothing beside them to be moved, so it keeps no floor.
      // Asserted rather than passed over: what it must do is offer the same
      // three controls, which is the whole of what this width owes.
      await expect(editor).toHaveClass(/engineering--layer/);
      await chooseRecipe(page, /increased range/i);
      await expect(page.locator('edsb-grade-selector')).toBeVisible();
      return;
    }

    // Read from the token rather than written down again: the floor is one
    // measure, and a test carrying its own copy would pass a change to it.
    const floorOf = async () =>
      await choices.evaluate((node) => {
        const reserved = getComputedStyle(document.documentElement).getPropertyValue(
          '--edsb-layout-engineering-choices',
        );
        const probe = document.createElement('div');
        probe.style.blockSize = reserved.trim();
        document.body.append(probe);
        const floor = probe.getBoundingClientRect().height;
        probe.remove();
        return { column: node.getBoundingClientRect().height, floor };
      });

    const before = await floorOf();
    expect(before.floor).toBeGreaterThan(0);
    expect(before.column).toBeGreaterThanOrEqual(before.floor);

    /*
     * And the panel is the height it will be, which is the whole point of the
     * floor and the half that was not being checked.
     *
     * The floor used to be stated inside the wide composition's own block, and
     * the wide composition is the one place it does nothing: two columns
     * stretched to the taller of them, with an attribute table beside these
     * controls that is taller than the floor on all but the shortest article.
     * So a floor that was never consulted read as a floor that held, and the
     * growth went on at every other inline width — measured at 834x1112, the
     * editor grew from 499px to 623px as a recipe was taken (Commander request
     * 2026-08-29).
     */
    const settled = await editor.evaluate((node) => node.getBoundingClientRect().height);
    await chooseRecipe(page, /increased range/i);
    await expect(page.locator('edsb-grade-selector')).toBeVisible();

    const after = await floorOf();
    expect(after.column).toBeGreaterThanOrEqual(after.floor);

    // Within a pixel, not to the pixel: the table beside the controls gains a
    // `MODIFIED` column as a recipe is taken, and a column changes where its
    // rows round to by a fraction of one. What this refuses is a panel that
    // moves, which is the two controls' own height and is measured in tens.
    const drawn = await editor.evaluate((node) => node.getBoundingClientRect().height);
    expect(Math.abs(drawn - settled)).toBeLessThan(1);
  });

  test('expands the details and the engineering instead of scrolling either', async ({ page }) => {
    await openStockBuild(page);
    await openEditor(page, 'FrameShiftDrive');
    await chooseRecipe(page, /increased range/i);
    await chooseGrade(page, 5);

    const panes = page.locator('.engineering__panes');
    await expect(panes).toBeVisible();
    if (await surfacesAreLayers(page)) {
      // The full-screen composition owns the viewport and has no page to grow
      // into: the layer around it is what scrolls, and the column this asserts
      // on releases only for the inline placement
      // (`design/engineering-editor.md`, "Nothing here scrolls").
      return;
    }

    // Nothing inside the panel is a scroller, and nothing inside it is hidden.
    // Wave 11 gave each half its own, inside a panel bounded to a share of a
    // column that was itself bounded to the screen — three nested boxes, and a
    // weapon's seventy attribute rows read four at a time in the innermost of
    // them (FR-012b; Commander request 2026-08-27).
    const measured = await panes.evaluate((node) => {
      const box = (element: Element) => ({
        overflow: getComputedStyle(element).overflowY,
        hidden: element.scrollHeight - element.clientHeight,
        height: element.getBoundingClientRect().height,
      });

      const choices = node.querySelector('.engineering__choices')!;
      const result = node.querySelector('.engineering__result')!;

      return {
        choices: box(choices),
        result: box(result),
        body: box(node.closest('.engineering__body')!),
        panel: box(node.closest('.engineering')!),
        // The column that used to bound the panel releases while a mount is
        // selected, exactly as it releases for an anatomy dashboard
        // (`design/outfitting-workspace.md`).
        centre: getComputedStyle(document.querySelector('.outfitting__centre')!).position,
      };
    });

    for (const region of [measured.choices, measured.result, measured.body, measured.panel]) {
      expect(region.overflow).toBe('visible');
      // A box that is not a scroller and has something outside it is a box
      // hiding content outright, which is the one outcome worse than scrolling.
      expect(region.hidden).toBeLessThanOrEqual(1);
    }

    // The panel holds both cards whole, which is what "expands" means once
    // neither of them can give way.
    expect(measured.panel.height + 1).toBeGreaterThanOrEqual(
      measured.choices.height + measured.result.height,
    );
    expect(measured.centre).toBe('static');
  });
});

test.describe('purchased and reward articles', () => {
  /** Fits the first chooser row carrying one acquisition label. */
  async function fitArticle(page: Page, slotKey: string, label: RegExp): Promise<void> {
    await selectMount(page, slotKey);
    // Whichever family holds it, and whichever manifest is drawing: the rail
    // draws one family's rows at a time, so the article a test names may be in
    // a family it has not revealed yet.
    await revealFamilyHolding(page, label);
    const row = page.locator('.candidates__choices .candidate').filter({ hasText: label }).first();
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
    // The recipe the article arrived with is stated rather than offered
    // (wave 5).
    await expect(page.locator('.blueprints__fixed')).toBeVisible();

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

    // The bespoke recipe the article was bought with. Its own table begins
    // above the purchase grade, so the cells offered are the grades that are
    // still to climb rather than a fixed five (contract, "Engineering").
    await expect.poll(() => chosenRecipe(page)).not.toBeNull();
    await page.locator('.grade').last().click();
    // Waited out before applying, the way the climb back down below is. A
    // click resolves when the event is dispatched, and applying a draft the
    // panel has not finished answering commits the grade that was there
    // before it — which is the article's purchase grade, and reads as a climb
    // that never happened.
    //
    // Read off the chosen cell rather than the figure beside the legend: only
    // canvas 1c draws that figure, and canvas 1d needs none because its cells
    // carry their own numbers. The cell marked as chosen is the one thing both
    // drawings of this control state, so it is what a journey that runs at
    // every width is allowed to ask.
    await expect(page.locator('.grade[data-selected="true"] .grade__number')).toHaveText('5');
    // Inline this has already committed; in a layer it is a draft that has to
    // be applied before the ledger says anything. Either way the panel is then
    // showing the climbed article (constitution V).
    await applyDraft(page);
    if (await surfacesAreLayers(page)) {
      await openEditor(page, 'SmallHardpoint1');
    }

    // The climb's own Merc Coin, which Almanac 0.1.5 publishes per grade
    // (upstream #337). The editor prices no job of its own any more, so the
    // figure is read where the build's costs are: `buildCost()` folds the
    // climb's coins in with the purchase's, and the rail's one row states the
    // total. It joins no material list even there — Merc Coin has no credit or
    // material equivalent, so summing it into one would invent an exchange rate
    // the game does not have (wave 11).
    const coins = page.locator('edsb-cost-materials .rail-material--merc-coin');
    await expect(coins).toHaveCount(1);
    await expect(coins).toContainText(/merc coin/i);

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
    await expect(page.locator('.grade[data-selected="true"] .grade__number')).toHaveText('1');
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

/**
 * Canvas 1c's three-stage flow, and the width it needs.
 *
 * The bench draws the family rail, the module pane and the engineering editor
 * side by side under one numbered strip. Three tracks need more than the
 * desktop project's 1440 leaves once the ledger and the status rail are paid
 * for, so the arrangement is asked for at the width the artboard was drawn at
 * and the fallback is asserted at the project's own
 * (`design/outfitting-workspace.md`, "The bench is two columns where it has
 * room for three").
 */
test.describe('the bench’s three columns', () => {
  /** The top edge of each numbered bar, in document order. */
  async function stripTops(page: Page): Promise<number[]> {
    return await page.evaluate(() =>
      [...document.querySelectorAll('.candidates__step, .engineering__step')].map((bar) =>
        Math.round(bar.getBoundingClientRect().top),
      ),
    );
  }

  test('draws the editor beside the manifest, on the step strip’s own line', async ({ page }) => {
    await page.setViewportSize({ width: 2020, height: 1100 });
    await openStockBuild(page);
    await selectMount(page, 'FrameShiftDrive');

    const manifest = page.locator('edsb-module-replacement');
    const editor = page.locator('edsb-engineering-editor');
    await expect(manifest).toBeVisible();
    await expect(editor).toBeVisible();

    const [manifestBox, editorBox] = await Promise.all([
      manifest.boundingBox(),
      editor.boundingBox(),
    ]);

    // Beside, not under: the editor starts after the manifest ends across, and
    // the two share the bench's own row.
    expect(editorBox!.x).toBeGreaterThanOrEqual(manifestBox!.x + manifestBox!.width);

    // One strip, three bars, one line. Steps ① and ② are the chooser's; step ③
    // is the editor's, and it pays the fitting panel's head so that it lands on
    // their line rather than on the head's.
    const tops = await stripTops(page);
    expect(tops).toHaveLength(3);
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(1);
  });

  test('stacks the editor under the manifest where three columns do not fit', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'FrameShiftDrive');

    if (await surfacesAreLayers(page)) {
      // Canvas 1d opens each surface as a screen of its own, so there is no
      // bench to arrange. What that width owes is asserted where the layers are.
      return;
    }

    const manifest = page.locator('edsb-module-replacement');
    const editor = page.locator('edsb-engineering-editor');
    const [manifestBox, editorBox] = await Promise.all([
      manifest.boundingBox(),
      editor.boundingBox(),
    ]);

    expect(editorBox!.y).toBeGreaterThanOrEqual(manifestBox!.y + manifestBox!.height - 1);
  });
});

/**
 * The grade bar says the same thing twice, on purpose.
 *
 * Canvas 1c fills the bar up to the chosen grade and numbers every cell, so a
 * cell past the choice is both unfilled and dimmed. Neither is the only carrier
 * — each cell names its own grade to a reader (`design/engineering-editor.md`).
 */
test('numbers every grade cell and dims the ones past the choice', async ({ page }) => {
  await openStockBuild(page);
  await openEditor(page, 'FrameShiftDrive');
  await chooseRecipe(page, /increased range/i);
  await chooseGrade(page, 2);

  const cells = page.locator('edsb-grade-selector .grade');
  await expect(cells).toHaveCount(5);

  const drawn = await cells.evaluateAll((nodes) =>
    nodes.map((node) => ({
      filled: node.getAttribute('data-filled') === 'true',
      number: node.querySelector('.grade__number')?.textContent?.trim() ?? '',
      colour: getComputedStyle(node.querySelector('.grade__number')!).color,
    })),
  );

  expect(drawn.map((cell) => cell.number)).toEqual(['1', '2', '3', '4', '5']);

  // Canvas 1c fills the bar up to the choice, so grade 2 reads as two. Canvas
  // 1d fills the chosen button alone, because a numbered button filled for
  // being *below* the choice is four buttons claiming to be the one that is
  // pressed. Both number every cell, which is the part this is about.
  const steps = await page
    .locator('edsb-grade-selector .grades')
    .first()
    .evaluate((node) => node.classList.contains('grades--steps'));
  expect(drawn.map((cell) => cell.filled)).toEqual(
    steps ? [false, true, false, false, false] : [true, true, false, false, false],
  );

  // The two states are drawn in different inks. Which ink is the stylesheet's
  // business; that they differ is the claim.
  const filled = new Set(drawn.filter((cell) => cell.filled).map((cell) => cell.colour));
  const unfilled = new Set(drawn.filter((cell) => !cell.filled).map((cell) => cell.colour));
  expect(filled.size).toBe(1);
  expect(unfilled.size).toBe(1);
  expect([...filled][0]).not.toBe([...unfilled][0]);
});
