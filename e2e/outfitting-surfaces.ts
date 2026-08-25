import { expect, type Locator, type Page } from '@playwright/test';

/**
 * The two editing surfaces, opened the way this width actually offers them.
 *
 * Canvas 1c draws the fitting panel and the engineering panel under the
 * anatomy, for whichever row is marked in the ledger, with no control that
 * reveals either: at wide widths they are simply there. Canvas 1d is where
 * `CHANGE MODULE` and `ENGINEER` exist, because at that width each panel is a
 * screen of its own over an inert background.
 *
 * The ten-project matrix runs both compositions, so every test that reaches a
 * surface has to reach it either way. These helpers are the one place that
 * knows the difference; nothing else in the suite presses a button that only
 * one width draws.
 */

/**
 * True where the surfaces are full-screen layers rather than inline panels.
 *
 * Read from the action bar itself rather than from one of its buttons: the bar
 * is canvas 1d's and is drawn at that width whatever the selected mount offers,
 * so this stays right on a mount that offers neither action.
 */
export async function surfacesAreLayers(page: Page): Promise<boolean> {
  return (await page.locator('.outfitting__bench-actions').count()) > 0;
}

/** Whether the selected mount offers the chooser at all, at this width. */
export async function chooserOffered(page: Page): Promise<boolean> {
  return (
    (await page.getByRole('button', { name: /change module/i }).count()) > 0 ||
    (await page.locator('.replacement').count()) > 0
  );
}

/** Whether the selected mount offers the engineering editor, at this width. */
export async function editorOffered(page: Page): Promise<boolean> {
  return (
    (await page.getByRole('button', { name: /^engineer$/i }).count()) > 0 ||
    (await page.locator('.engineering').count()) > 0
  );
}

/**
 * Brings the chooser for the selected mount on screen and waits for it.
 *
 * The control is named in whatever language the page is being read in, so a
 * test running a non-English context passes that language's word for it rather
 * than expecting the English one to be there.
 */
export async function openChooser(
  page: Page,
  name: string | RegExp = /change module/i,
): Promise<void> {
  const open = page.getByRole('button', { name });
  const chooser = page.locator('.replacement').first();

  // Whichever of the two this width offers has to be on screen before it is
  // counted. Selecting a mount renders its fitting afterwards, and counting is
  // an answer rather than a wait: asked in the gap, it answers that there is no
  // control here, and the wait that follows is then a wait for a chooser that
  // nothing opened.
  await expect(open.or(chooser).first()).toBeVisible();
  if ((await open.count()) > 0) {
    await open.click();
  }
  await expect(chooser).toBeVisible();
}

/**
 * Opens every family the chooser is currently showing.
 *
 * The chooser opens with the fitted module's family alone, and with nothing at
 * all on a mount whose article the package does not offer back (FR-021). Every
 * test that is about a *row* therefore has to open the families first, or it is
 * asserting against a list that is deliberately not on screen. Tests that are
 * about the seeding itself do not call this.
 */
export async function openAllFamilies(page: Page): Promise<void> {
  await pressEveryFamily(page, 'false');
}

/** Closes every family the chooser currently has open. */
export async function closeAllFamilies(page: Page): Promise<void> {
  await pressEveryFamily(page, 'true');
}

/**
 * Presses every family control in one state until none is left in it.
 *
 * Three things make this less obvious than it looks. The set is read again
 * after every press rather than walked by index, because clearing a query
 * rebuilds the whole list and reseeds it — a set of controls taken before that
 * settles is a set that no longer exists. Each press is waited out on the
 * control it landed on, by id: a click resolves when the event is dispatched,
 * not when the framework has rendered the answer, so a loop that only re-counts
 * will press a control that is already answered and then wait out the timeout
 * on a locator that matches nothing.
 *
 * Nothing in the loop may auto-wait on the pending set. `count()` is a
 * snapshot; every locator call after it waits. So a set that empties between
 * the count and the read — the list reseeding, the last press settling late —
 * used to leave `first()` waiting for an element that was never coming, and it
 * waited out the whole test timeout to say so. `evaluateAll` resolves against
 * whatever matches right now and returns nothing when nothing does, which ends
 * the loop instead of hanging it. A set that is genuinely stuck still fails, on
 * the count assertion below, which says how many are left rather than pointing
 * at line one of the body.
 *
 * And a press can be lost. Opening or closing one family rewrites the list
 * under all the others, and a click dispatched into a view being rebuilt is
 * answered by nobody: the bar keeps the state it had, with nothing to say the
 * press did not land. It is made again until the control answers rather than
 * made once and asserted after — the same shape the build library's own
 * `openRecord` takes, and for the same reason. A bar that never answers still
 * fails, on the state it is stuck in.
 */
async function pressEveryFamily(page: Page, from: 'true' | 'false'): Promise<void> {
  const pending = page.locator(`.family[aria-expanded="${from}"]`);
  const answered = from === 'true' ? 'false' : 'true';

  for (let guard = 0; guard < 200; guard += 1) {
    const ids = await pending.evaluateAll((controls) => controls.map((control) => control.id));
    if (ids.length === 0) {
      break;
    }
    const control = page.locator(`#${ids[0]}`);
    await expect(async () => {
      await control.click();
      await expect(control).toHaveAttribute('aria-expanded', answered, { timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
  }

  await expect(pending).toHaveCount(0);
}

/** Brings the chooser on screen with every family open, for a test about rows. */
export async function openChooserRows(page: Page): Promise<void> {
  await openChooser(page);
  await openAllFamilies(page);
}

/**
 * Brings the engineering editor for the selected mount on screen.
 *
 * Named for the language the page is being read in, for the reason `openChooser`
 * gives: at compact width the editor is behind an action, and that action is
 * drawn in the active language rather than in English.
 */
export async function openEditor(page: Page, name: string | RegExp = /^engineer$/i): Promise<void> {
  const open = page.getByRole('button', { name });
  const editor = page.locator('.engineering').first();

  // Waited for before it is counted, for the reason `openChooser` gives.
  await expect(open.or(editor).first()).toBeVisible();
  if ((await open.count()) > 0) {
    await open.click();
  }
  await expect(editor).toBeVisible();
}

/**
 * Takes one option from a `<select>` by the text it draws.
 *
 * Playwright's own `selectOption({ label })` is an exact match, and the
 * canvas's option labels carry more than the name — the route a recipe needs,
 * the description an effect publishes — so the label is found first and matched
 * whole afterwards.
 */
async function chooseFromSelect(select: Locator, name: string | RegExp): Promise<void> {
  const labels = await select
    .locator('option')
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ''));
  const match = labels.find((label) =>
    typeof name === 'string' ? label.includes(name) : name.test(label),
  );
  expect(match, `no option matched ${String(name)} in ${labels.join(' | ')}`).toBeDefined();
  await select.selectOption({ label: match });
}

/**
 * Chooses one recipe, however this width offers them.
 *
 * Canvas 1c draws a dropdown and canvas 1d a list of cards, so this is where
 * the difference lives. Both carry the same recipes in the same order and both
 * commit the same way; only the control differs.
 */
export async function chooseRecipe(page: Page, name: string | RegExp): Promise<void> {
  if (await surfacesAreLayers(page)) {
    const row = page.locator('.blueprint:not(.blueprint--none)').filter({ hasText: name }).first();
    await row.click();
    await expect(row.locator('input[type="radio"]')).toBeChecked();
    return;
  }
  await chooseFromSelect(page.locator('edsb-blueprint-choice-list select').first(), name);
}

/**
 * The first recipe the package offers here, whatever it is called.
 *
 * The sibling of `chooseFirstEffect`, and it exists for the same reason: a
 * blueprint name is the Almanac's game text, so a test running in another
 * language cannot name one without pinning that language's catalogue.
 */
export async function chooseFirstRecipe(page: Page): Promise<void> {
  if (await surfacesAreLayers(page)) {
    const row = page.locator('.blueprint:not(.blueprint--none)').first();
    await row.click();
    await expect(row.locator('input[type="radio"]')).toBeChecked();
    return;
  }
  const select = page.locator('edsb-blueprint-choice-list select').first();
  const values = await select
    .locator('option')
    .evaluateAll((nodes) => nodes.map((node) => (node as HTMLOptionElement).value));
  await select.selectOption(values[1] ?? '');
}

/** Chooses one experimental effect, however this width offers them. */
export async function chooseEffect(page: Page, name: string | RegExp): Promise<void> {
  if (await surfacesAreLayers(page)) {
    const row = page.locator('.effect:not(.effect--none)').filter({ hasText: name }).first();
    await row.click();
    await expect(row.locator('input[type="radio"]')).toBeChecked();
    return;
  }
  await chooseFromSelect(page.locator('edsb-experimental-effect-list select').first(), name);
}

/** The first effect the package offers here, whatever it is called. */
export async function chooseFirstEffect(page: Page): Promise<void> {
  if (await surfacesAreLayers(page)) {
    await page.locator('.effect:not(.effect--none)').first().click();
    return;
  }
  const select = page.locator('edsb-experimental-effect-list select').first();
  const values = await select
    .locator('option')
    .evaluateAll((nodes) => nodes.map((node) => (node as HTMLOptionElement).value));
  await select.selectOption(values[1] ?? '');
}

/** Takes the no-blueprint option, however this width offers it. */
export async function clearRecipe(page: Page): Promise<void> {
  if (await surfacesAreLayers(page)) {
    await page.locator('.blueprint--none').click();
    return;
  }
  await page.locator('edsb-blueprint-choice-list select').first().selectOption('none');
}

/** Takes the no-effect option, however this width offers it. */
export async function clearEffect(page: Page): Promise<void> {
  if (await surfacesAreLayers(page)) {
    await page.locator('.effect--none').click();
    return;
  }
  await page.locator('edsb-experimental-effect-list select').first().selectOption('');
}

/**
 * The recipe the editor currently has chosen, by the name it draws.
 *
 * `null` where that is the no-blueprint option — which is what "nothing is
 * chosen" looks like at both widths, because both open the list with it.
 */
export async function chosenRecipe(page: Page): Promise<string | null> {
  // A purchase's recipe is stated, not chosen: the article arrived with it and
  // there is no other recipe it could carry, so neither composition draws a
  // control for it (wave 5).
  const fixed = page.locator('.blueprints__fixed');
  if ((await fixed.count()) > 0) {
    return (await fixed.first().textContent())?.trim() ?? null;
  }
  if (await surfacesAreLayers(page)) {
    const chosen = page.locator('.blueprint[data-selected="true"]:not(.blueprint--none)');
    return (await chosen.count()) === 0
      ? null
      : ((await chosen.first().textContent())?.trim() ?? null);
  }
  const select = page.locator('edsb-blueprint-choice-list select').first();
  const value = await select.inputValue();
  if (value === 'none' || value === '') {
    return null;
  }
  return (await select.locator('option:checked').textContent())?.trim() ?? null;
}

/** The effects the editor is currently offering, however this width draws them. */
export function effectOptions(page: Page): Locator {
  return page.locator(
    '.effect:not(.effect--none), edsb-experimental-effect-list option:not(:first-child)',
  );
}

/**
 * Commits the draft, wherever this width keeps the control that commits it.
 *
 * Canvas 1d pins it to the foot of its own screen; canvas 1c puts it in the
 * panel head. Same control, same decision, one place that knows the difference.
 */
export async function applyDraft(
  page: Page,
  name: string | RegExp = /apply blueprint/i,
): Promise<void> {
  if (!(await surfacesAreLayers(page))) {
    // Canvas 1c draws no apply and no revert: inline the choice is the
    // decision, and it has already been taken by the time this is called.
    return;
  }
  await page.getByRole('button', { name }).click();
  await editApplied(page);
}

/**
 * Waits for a fit to have been committed, whichever surface took it.
 *
 * A layer closes on a committed fit. An inline panel stays exactly where it is
 * — there is nothing to close — and what changes is the pick: the store clears
 * it, so the confirm control goes back to having nothing to confirm.
 */
export async function fitCommitted(page: Page): Promise<void> {
  if (await surfacesAreLayers(page)) {
    await expect(page.locator('.candidate')).toHaveCount(0);
  } else {
    // The pick, cleared. Not the fitted marker: a stock record and its
    // pre-engineered variants share a symbol, so more than one row can be the
    // module that is in the mount.
    await expect(page.locator('.candidate[data-selected="true"]')).toHaveCount(0);
    await expect(page.locator('.candidate--fitted').first()).toBeVisible();
  }
}

/**
 * Waits for an applied engineering draft, whichever surface took it.
 *
 * Same split as a fit: a layer closes, and an inline editor rebuilds its
 * choices from what the module now carries — so the confirm control goes back
 * to having nothing to confirm.
 */
export async function editApplied(page: Page): Promise<void> {
  if (await surfacesAreLayers(page)) {
    await expect(page.locator('.blueprints')).toHaveCount(0);
  } else {
    // Inline there is no control to go quiet: the choice was the decision, and
    // the editor is showing what the module now carries.
    await expect(page.locator('.engineering').first()).toBeVisible();
  }
}

/**
 * Waits for an abandoned draft, whichever surface held it.
 *
 * A layer closes. An inline editor has nothing to close, so what it does is
 * rebuild its choices from the module as it actually stands — which is the
 * whole meaning of reverting: no recipe is picked and there is nothing to
 * apply.
 */
export async function draftAbandoned(page: Page): Promise<void> {
  if (await surfacesAreLayers(page)) {
    await expect(page.locator('.blueprints')).toHaveCount(0);
  } else {
    // Polled: reverting is a signal write, and the control it resets is
    // repainted on the next frame rather than under the click.
    await expect.poll(() => chosenRecipe(page)).toBeNull();
  }
}

/**
 * One command-bar action, wherever this width keeps it.
 *
 * Canvas 1c draws `↶ UNDO` and `REDO ↷` directly in the bar; canvas 1d puts the
 * same two behind the `⋮` menu. The shell renders both placements and hides the
 * one this width does not use, so a test that only ever pressed the visible row
 * would be testing one width and passing everywhere.
 *
 * The menu closes when an action is chosen, which is what a Commander sees, so
 * this opens it again each time rather than assuming it stayed open.
 */
export async function commandBarAction(page: Page, name: RegExp): Promise<Locator> {
  const direct = page.locator('.frame__actions').getByRole('button', { name });
  if (await direct.isVisible()) {
    return direct;
  }

  // The compact composition keeps them behind the menu. Whether it is open is
  // read from the control's own state rather than from its label, which changes
  // when it opens, or from whether a button inside it can be seen, which races
  // the re-render that follows the last press.
  const trigger = page.locator('.action-layer__trigger');
  if ((await trigger.getAttribute('aria-expanded')) !== 'true') {
    await trigger.click();
  }
  return page.locator('.action-layer__panel').getByRole('button', { name });
}

/**
 * Presses one command-bar action, wherever this width keeps it.
 *
 * The press is retried as a whole rather than aimed once. Choosing an action
 * closes the compact menu and the bar republishes its actions after every
 * decision, so a control located a moment ago can be gone by the time it is
 * pressed — and the answer a Commander would give is to open the menu again.
 * The retry is safe because the block ends with the press: nothing after it can
 * fail and press it twice.
 */
export async function pressCommandBarAction(page: Page, name: RegExp): Promise<void> {
  await expect(async () => {
    await (await commandBarAction(page, name)).click({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}

/**
 * One command-bar action, for reading its state rather than pressing it.
 *
 * Deliberately a CSS locator rather than a role lookup: the frame renders both
 * placements and hides the one this width does not use, so a role lookup finds
 * nothing while the compact menu is closed. What is being read here is state,
 * and both placements carry the same state from the same list — so the row's
 * copy answers for the menu's, without opening anything a Commander did not.
 */
export function commandBarActionState(page: Page, name: RegExp): Locator {
  // The button itself, not the component around it: the invisible description
  // that says what the action would do is a sibling of the button, so the
  // component's own text is the label *and* that sentence.
  return page.locator('.frame__actions button', { hasText: name });
}
