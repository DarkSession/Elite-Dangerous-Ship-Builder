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

/**
 * Which arrangement the outfitting region measured itself into.
 *
 * Read from the region's own published composition rather than from the
 * viewport: the arrangement is chosen from the space the region is *given*, so
 * a desktop window at 400% zoom or a doubled text size is compact too. A test
 * whose claim is canvas 1c's takes its other branch there rather than failing
 * on an arrangement it is not about (responsive composition, "Verification
 * matrix").
 */
export async function isCompactWorkspace(page: Page): Promise<boolean> {
  const region = page.locator('.outfitting').first();
  await expect(region).toBeVisible();
  return (await region.getAttribute('data-composition')) === 'compact';
}

/**
 * Brings the status rail on screen, however this width keeps it.
 *
 * Canvas 1c draws the rail as the third track of its grid, on screen whatever
 * else is: there is nothing to reveal. Canvas 1d has no third track, so the
 * same content is behind the strip's sixth segment, `STATUS`, and a journey
 * that reads a validation line, a cost row or a summary cell has to open it
 * first (Commander request 2026-08-26).
 *
 * Compact is not only a narrow phone: the composition is chosen from the space
 * the region is *given*, so a desktop window at 400% zoom or a doubled text
 * size takes this branch too. That is why every reader of the rail calls this
 * rather than testing the viewport.
 *
 * Named for the language the page is being read in, for the reason
 * `openChooser` gives.
 */
export async function revealStatusRail(
  page: Page,
  name: string | RegExp = /^status$/i,
): Promise<void> {
  const region = page.locator('.outfitting').first();
  const rail = page.locator('.outfitting__status-rail').first();
  const segment = page.locator('.anatomy__modes').getByRole('button', { name });

  // Read from the region's own published composition rather than from whether
  // the rail happens to be on screen yet. Only the widest arrangement draws the
  // rail as a column; every narrower one reaches it through the strip's
  // `STATUS` segment (`outfitting-workspace.ts`, `statusIsGuest`). The composition is measured after the
  // first paint, so a rail asked about too early answers for the arrangement it
  // is about to leave — and the branch taken on that answer is the wrong one at
  // both widths.
  //
  // Retried as a whole for the same reason `pressCommandBarAction` is: the
  // strip republishes its segments when the composition changes, so a control
  // located a moment ago can be gone by the time it is pressed.
  await expect(async () => {
    if ((await region.getAttribute('data-composition')) === 'wide') {
      await expect(rail).toBeVisible({ timeout: 2_000 });
      return;
    }
    await segment.click({ timeout: 2_000 });
    await expect(rail).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}

/**
 * Brings one mount's row into the ledger, whichever category holds it.
 *
 * Canvas 1d offers no `ALL`: at compact width the ledger draws one category at
 * a time and a Commander says which, so a mount in a category nobody has
 * pressed is not on the page rather than merely scrolled past (Commander
 * request 2026-08-26). At wide width `ALL` is the opening category and every
 * mount is already there, which is why this is a no-op on canvas 1c.
 *
 * The categories are pressed in turn rather than mapped from the slot key: the
 * mapping is the product's (`CATEGORY_KINDS` puts armour and the cargo hatch
 * under `CORE`), and a second copy of it here would be a copy that could
 * disagree with it.
 */
export async function revealMount(page: Page, slotKey: string): Promise<Locator> {
  const mount = page.locator(`[data-slot-key="${slotKey}"]`).first();

  // The ledger first: counting is an answer rather than a wait, and asked
  // before the region has drawn a row it answers that no category holds this
  // mount — which would send the search below through every category for
  // nothing.
  await expect(page.locator('[data-slot-key]').first()).toBeVisible();
  if ((await mount.count()) > 0) {
    return mount;
  }

  const categories = page.locator('.outfitting__category');
  const total = await categories.count();
  for (let index = 0; index < total; index += 1) {
    const category = categories.nth(index);
    // Retried as a whole, for the reason `pressEveryFamily` gives: pressing a
    // category rebuilds the ledger under it, and a press dispatched into a view
    // being rebuilt is answered by nobody.
    await expect(async () => {
      await category.click({ timeout: 2_000 });
      await expect(category).toHaveAttribute('aria-pressed', 'true', { timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
    if ((await mount.count()) > 0) {
      return mount;
    }
  }

  throw new Error(`No category in the ledger holds the mount ${slotKey}.`);
}

/** Whether the selected mount offers the chooser at all, at this width. */
export async function chooserOffered(page: Page): Promise<boolean> {
  return (
    (await page.getByRole('button', { name: /change module/i }).count()) > 0 ||
    (await page.locator('.replacement').count()) > 0
  );
}

/**
 * The English name of the action that opens the editor, as one place.
 *
 * Anchored at both ends so it cannot also match some other control that happens
 * to contain the word. Two helpers looked for `Engineer` and both stopped
 * finding the control when it was renamed, which at compact width is every test
 * that reaches the editor at all.
 */
const ENGINEER_ACTION = /^engineering and details$/i;

/** Whether the selected mount offers the engineering editor, at this width. */
export async function editorOffered(page: Page): Promise<boolean> {
  return (
    (await page.getByRole('button', { name: ENGINEER_ACTION }).count()) > 0 ||
    (await page.locator('.engineering').count()) > 0
  );
}

/**
 * Waits until the bench is drawn for the mount that is selected.
 *
 * Inline, the bench writes the mount over the fitting panel, so the head is
 * both the wait and the naming. At layer width the two panels are screens a
 * Commander opens, each carrying the mount in its own head, and the page behind
 * them names no mount at all — so what is waited on there is the action bar
 * that opens them, which is drawn for whichever mount is marked but reads the
 * same for every one of them.
 *
 * Which means this is a barrier and not an assertion, and at layer width it is
 * a weak one: the bar is already on screen from the previous selection. The
 * selection itself is gated by the caller, on the row's own `aria-pressed`; a
 * test whose claim is *which* mount the bench is open on has to open one of the
 * two surfaces and read the head there.
 */
export async function benchFollowedSelection(page: Page): Promise<void> {
  await expect(
    page
      .locator('.replacement__title, .outfitting__bench-title, .outfitting__bench-actions')
      .first(),
  ).toBeVisible();
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
 * Which of the chooser's two manifests this width is drawing.
 *
 * Canvas 1c draws a family rail beside a variant pane since the 2026-08-25
 * revision; canvas 1d still draws the accordion. They differ in kind and not
 * only in arrangement — a rail reveals exactly one family and has no closed
 * state at all — so a journey about families has to know which one it has.
 *
 * Read from the component's own published measurement rather than measured
 * again here: a second threshold in the suite would disagree with the product's
 * at exactly the widths that matter.
 */
export async function manifestOf(page: Page): Promise<'rail' | 'accordion'> {
  const drawn = await page.locator('edsb-candidate-list').first().getAttribute('data-manifest');
  return drawn === 'rail' ? 'rail' : 'accordion';
}

/**
 * The rows of whichever families are revealed, in either manifest.
 *
 * `candidates__choices` is on the accordion's `family__choices` and on the
 * rail's pane alike. Scoped to it rather than to `.candidate`, because canvas
 * 1d pins the fitted row a second time above the families and a count that
 * included it would be one too many.
 */
export function revealedRows(page: Page): Locator {
  return page.locator('.candidates__choices .candidate');
}

/** Every family control, whichever shape it is drawn in. */
export function familyControls(page: Page): Locator {
  return page.locator('.family');
}

/**
 * Which families are revealed right now, by their index in the list.
 *
 * *Revealed* is the accordion's open family and the rail's selected one, which
 * is the word the requirements are restated in. The two publish it differently
 * — `aria-expanded` on a disclosure, `aria-pressed` on a selection — and both
 * are read here so a journey can assert the rule rather than the attribute.
 */
export async function revealedFamilies(page: Page): Promise<readonly number[]> {
  const states = await familyControls(page).evaluateAll((nodes) =>
    nodes.map(
      (node) => node.getAttribute('aria-expanded') ?? node.getAttribute('aria-pressed') ?? 'false',
    ),
  );
  return states.flatMap((state, index) => (state === 'true' ? [index] : []));
}

/**
 * Brings every choice the chooser holds on screen, whichever manifest it is in.
 *
 * The accordion opens every family at once and the rail cannot: it draws one
 * family's rows at a time, so the only way to see them all is to select each
 * family in turn. `visit` is called once per family with its rows on screen.
 */
export async function acrossEveryFamily(
  page: Page,
  visit: (rows: Locator) => Promise<void>,
): Promise<void> {
  if ((await manifestOf(page)) === 'accordion') {
    await openAllFamilies(page);
    // One call per family, not one call with every row in it. The accordion
    // could hand over the whole list at once, but then a journey comparing
    // membership would be comparing one flat set at this width and a set per
    // family at the other — and the claim it is making is about *which family*
    // a choice is in, which a flattened reading cannot fail on.
    const regions = await page.locator('.family__choices').count();
    for (let index = 0; index < regions; index += 1) {
      await visit(page.locator('.family__choices').nth(index).locator('.candidate'));
    }
    return;
  }

  const ids = await familyControls(page).evaluateAll((nodes) => nodes.map((node) => node.id));
  for (const id of ids) {
    const control = page.locator(`#${id}`);
    await expect(async () => {
      await control.click();
      await expect(control).toHaveAttribute('aria-pressed', 'true', { timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
    await visit(revealedRows(page));
  }
}

/**
 * Brings the family holding a particular row on screen, in either manifest.
 *
 * A journey about one row — the reward with its route mark, say — should not
 * have to know which family the Almanac put it in, nor which manifest is
 * drawing. The accordion can simply open everything; the rail has to select
 * each family until the row appears, and stops on the one that has it.
 */
export async function revealFamilyHolding(page: Page, text: RegExp): Promise<void> {
  await openChooser(page);
  const row = page.locator('.candidates__choices .candidate').filter({ hasText: text });

  if ((await manifestOf(page)) === 'accordion') {
    await openAllFamilies(page);
    await expect(row.first()).toBeVisible();
    return;
  }

  const ids = await familyControls(page).evaluateAll((nodes) => nodes.map((node) => node.id));
  for (const id of ids) {
    const control = page.locator(`#${id}`);
    await expect(async () => {
      await control.click();
      await expect(control).toHaveAttribute('aria-pressed', 'true', { timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
    if ((await row.count()) > 0) {
      await expect(row.first()).toBeVisible();
      return;
    }
  }

  throw new Error(`No family in the chooser holds a row matching ${String(text)}.`);
}

/**
 * Opens every family the accordion is currently showing.
 *
 * The chooser opens with the fitted module's family alone, and with nothing at
 * all on a mount whose article the package does not offer back (FR-021). Every
 * test that is about a *row* therefore has to open the families first, or it is
 * asserting against a list that is deliberately not on screen. Tests that are
 * about the seeding itself do not call this.
 *
 * A no-op under the rail, which has no closed family to open: there, one family
 * is revealed at all times and `acrossEveryFamily` is how a journey reaches the
 * rest.
 */
export async function openAllFamilies(page: Page): Promise<void> {
  await pressEveryFamily(page, 'false');
}

/** Closes every family the accordion currently has open. */
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
export async function openEditor(
  page: Page,
  name: string | RegExp = ENGINEER_ACTION,
): Promise<void> {
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
    const cards = page.locator('.blueprint:not(.blueprint--none)');
    // The same guard the dropdown branch below carries: a mount the package
    // offers no recipe for should say so rather than wait out the timeout on a
    // card that is never going to appear.
    expect(await cards.count(), 'no blueprint is offered here').toBeGreaterThan(0);
    const row = cards.first();
    await row.click();
    await expect(row.locator('input[type="radio"]')).toBeChecked();
    return;
  }
  const select = page.locator('edsb-blueprint-choice-list select').first();
  const values = await select
    .locator('option')
    .evaluateAll((nodes) => nodes.map((node) => (node as HTMLOptionElement).value));
  // Index 1: the first option is the canvas's no-blueprint choice. Asserted
  // rather than defaulted, because a mount the package offers no recipe for
  // would otherwise select a value no option carries and wait out the timeout
  // instead of saying what went wrong.
  expect(values.length, `no blueprint is offered here: ${values.join(' | ')}`).toBeGreaterThan(1);
  await select.selectOption(values[1]!);
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
 * A layer closes on a committed fit. An inline panel stays exactly where it is —
 * there is nothing to close — and what changes is which row the manifest calls
 * the chosen one: it reseeds around the module now in the mount, so the pick and
 * the mount agree again.
 *
 * Read as the conjunction of the two, and it has to be. The fitted marker alone
 * is no proof: a stock record and its pre-engineered variants share a symbol, so
 * several rows can be the module in the mount. The mark alone is no proof
 * either, now that opening a mount marks what is already fitted in it — that
 * mark stands before any of this begins. What is only true afterwards is that
 * the *marked* row is a fitted one: the click that starts a fit moves the mark
 * onto a row that is not yet in the mount, and only the commit puts the two back
 * together.
 */
export async function fitCommitted(page: Page): Promise<void> {
  if (await surfacesAreLayers(page)) {
    await expect(page.locator('.candidate')).toHaveCount(0);
  } else {
    await expect(page.locator('.candidate[data-selected="true"].candidate--fitted')).toHaveCount(1);
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

  // The folded composition keeps them behind the menu. Whether it is open is
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
 * closes the folded bar's menu and the bar republishes its actions after every
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
 * nothing while that menu is closed. What is being read here is state,
 * and both placements carry the same state from the same list — so the row's
 * copy answers for the menu's, without opening anything a Commander did not.
 */
export function commandBarActionState(page: Page, name: RegExp): Locator {
  // The button itself, not the component around it: the invisible description
  // that says what the action would do is a sibling of the button, so the
  // component's own text is the label *and* that sentence.
  //
  // Matched on the label element rather than on the button's own text, because
  // the text is not only the label: canvas 1c draws `↶ UNDO` and `REDO ↷`, and
  // the mark beside the word is text in the button too — so an anchored name
  // matches nothing at all. The label element carries the word alone, whether
  // the button draws it (`action__label`) or draws a mark in its place and
  // keeps it for a reader (`visually-hidden`).
  return page
    .locator('.frame__actions button')
    .filter({ has: page.locator('.action__label, .visually-hidden').filter({ hasText: name }) });
}
