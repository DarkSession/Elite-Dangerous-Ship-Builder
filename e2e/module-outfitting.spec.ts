import { expect, test, type Page } from '@playwright/test';
import { publishedSlotKeys, sweepOutfittingState } from './accessibility';

/**
 * Fitting modules, end to end (US1).
 *
 * The claim being checked is parity: what the ledger shows is what
 * `loadout.slots()` says is there, key for key, including the mounts a
 * Commander cannot change. Everything else in this file follows from that — a
 * fit, a replacement, a removal and a refusal are all checked by looking at the
 * ledger afterwards, because the ledger is the build.
 */

/** Creates a stock build and lands in the workspace with the ledger rendered. */
async function openStockBuild(page: Page, hull = 'Anaconda'): Promise<void> {
  await page.goto(`/ships/${hull}`);
  await page.getByRole('button', { name: 'Build stock hull' }).click();
  await expect(page).toHaveURL(/\/build(#|$)/);
  await expect(page.locator('[data-slot-key]').first()).toBeVisible();
}

/**
 * Selects one mount by its exact game slot key.
 *
 * Waits on the row's own pressed state rather than on the bench appearing. The
 * bench is already there when another mount is selected, so waiting for it
 * proves nothing and lets the next click land on a control that is still being
 * replaced.
 */
async function selectMount(page: Page, slotKey: string): Promise<void> {
  const row = page.locator(`[data-slot-key="${slotKey}"] button`).first();
  await row.click();
  await expect(row).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.outfitting__bench-title')).toBeVisible();
}

/**
 * What the ledger currently says is fitted in one mount.
 *
 * The whole identity, name and code line together, because a module name is not
 * unique: a build can carry four pulse lasers that differ only in their class
 * and rating, and comparing names alone would call a replacement a no-op.
 */
async function fittedIdentityAt(page: Page, slotKey: string): Promise<string | null> {
  return page
    .locator(`[data-slot-key="${slotKey}"]`)
    .evaluate((node) => node.querySelector('.identity')?.textContent?.trim() ?? null);
}

/** The text a sighted Commander actually reads, with hidden text removed. */
async function renderedText(page: Page, selector: string): Promise<string> {
  return page.locator(selector).evaluate((node) => {
    const clone = node.cloneNode(true) as HTMLElement;
    for (const hidden of clone.querySelectorAll('.visually-hidden')) {
      hidden.remove();
    }
    return clone.textContent ?? '';
  });
}

/**
 * Opens the chooser for the selected mount, picks one row and confirms.
 *
 * Returns what the chosen row read as, so a caller can assert the ledger now
 * says the same thing. The mount stays selected afterwards, which is what the
 * bench does after a fit — so a second call replaces rather than re-selecting.
 */
async function fitFromChooser(
  page: Page,
  pick: (identities: readonly string[]) => number,
): Promise<string> {
  await page.getByRole('button', { name: /change module/i }).click();
  const rows = page.locator('.candidate');
  await expect(rows.first()).toBeVisible();

  const identities = await rows.evaluateAll((nodes) =>
    nodes.map((node) => node.querySelector('.identity')?.textContent?.trim() ?? ''),
  );
  const index = pick(identities);
  expect(index, 'no choice matched what the test asked for').toBeGreaterThan(-1);

  // The row is the control. Its radio is a 1px box underneath the label's own
  // content, so a pointer — a Commander's or this one's — lands on the label
  // and the label activates the radio, which is the whole reason the row is a
  // label. Reaching past it to click the input asserts an interaction nobody
  // performs, and Firefox refuses it outright.
  const row = rows.nth(index);
  await row.click();
  await expect(row.locator('input[type="radio"]')).toBeChecked();
  await page.getByRole('button', { name: /fit module/i }).click();
  // The chooser closes on a committed fit; waiting for that is waiting for the
  // decision to have actually been taken.
  await expect(rows).toHaveCount(0);

  return identities[index] ?? '';
}

test.describe('the slot ledger', () => {
  test('renders every package mount, by exact key, including the cargo hatch', async ({ page }) => {
    await openStockBuild(page);

    const keys = await publishedSlotKeys(page);

    // The Anaconda's own layout, in the package's outfitting order. Asserted
    // against the game's spellings rather than against a count, because a count
    // would still pass if a mount were rendered under the wrong key.
    expect(keys).toContain('HugeHardpoint1');
    expect(keys).toContain('Armour');
    expect(keys).toContain('PowerPlant');
    expect(keys).toContain('CargoHatch');
    expect(keys).toContain('PlanetaryApproachSuite');
    // Every key is unique: two rows sharing one identity would be two views of
    // one mount, and an edit to either would be an edit to both.
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('never renders a game slot key as visible text', async ({ page }) => {
    await openStockBuild(page);

    const visible = await renderedText(page, '.outfitting__ledger');

    // The canvas draws `SIZE · NODE NO.`, not `Slot01_Size7`. The key stays the
    // identity and the assistive-technology text, and nothing else.
    expect(visible).not.toContain('Slot01_Size7');
    expect(visible).not.toContain('HugeHardpoint1');
    expect(visible).not.toContain('CargoHatch');
  });

  test('keeps empty removable mounts visible and selectable', async ({ page }) => {
    await openStockBuild(page);

    const empty = page.locator('[data-slot-key="MediumHardpoint1"]');
    await expect(empty).toContainText(/empty/i);
    await selectMount(page, 'MediumHardpoint1');

    await expect(page.getByRole('button', { name: /change module/i })).toBeVisible();
  });

  test('fits, replaces and removes a module, one decision at a time', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'MediumHardpoint1');

    // Fit.
    const first = await fitFromChooser(page, () => 0);
    await expect(page.locator('[data-slot-key="MediumHardpoint1"]')).not.toContainText(/empty/i);
    expect(await fittedIdentityAt(page, 'MediumHardpoint1')).toBe(first);

    // Replace. The choice is picked by what it reads as rather than by its
    // position, so the assertion cannot pass on two rows that happen to match.
    const second = await fitFromChooser(page, (identities) =>
      identities.findIndex((identity) => identity !== first),
    );
    expect(second).not.toBe(first);
    expect(await fittedIdentityAt(page, 'MediumHardpoint1')).toBe(second);

    // Remove. The mount empties and stays in the ledger to be fitted again.
    await page.getByRole('button', { name: /remove module/i }).click();
    await expect(page.locator('[data-slot-key="MediumHardpoint1"]')).toContainText(/empty/i);
  });

  test('offers no removal on a required mount, and says why', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'PowerPlant');

    await expect(page.getByRole('button', { name: /remove module/i })).toHaveCount(0);
    // A missing action with no reason reads as a defect. The Almanac's reason
    // is what makes it read as a rule of the game instead.
    await expect(page.locator('.outfitting__bench-reason')).toContainText(/required/i);
    // It stays replaceable, which is a different thing from removable.
    await expect(page.getByRole('button', { name: /change module/i })).toBeVisible();
  });

  test('gives the cargo hatch its facts and no replacement, search or engineering', async ({
    page,
  }) => {
    await openStockBuild(page);
    await selectMount(page, 'CargoHatch');

    await expect(page.getByRole('button', { name: /change module/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /remove module/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^engineer$/i })).toHaveCount(0);
    await expect(page.locator('.outfitting__bench-reason')).toContainText(/built in/i);
    // The hatch itself is still listed with its module, not hidden away.
    await expect(page.locator('[data-slot-key="CargoHatch"]')).toContainText(/cargo hatch/i);
  });

  test('stays editable while the build is incomplete', async ({ page }) => {
    await openStockBuild(page);

    // Emptying a mount leaves a build the Almanac calls incomplete. Every other
    // mount still offers everything it offered before.
    await selectMount(page, 'Slot03_Size6');
    await page.getByRole('button', { name: /remove module/i }).click();

    await selectMount(page, 'Slot02_Size6');
    await expect(page.getByRole('button', { name: /change module/i })).toBeVisible();
  });

  test('publishes only the exact game slot key as shared identity', async ({ page }) => {
    await openStockBuild(page);

    const keys = await publishedSlotKeys(page);

    // No positional index ever becomes an identity. The node number the canvas
    // draws is a label; nothing is selected or edited by it, which is why no
    // published identity is a bare ordinal (FR-002).
    for (const key of keys) {
      expect(key, 'a published identity is a bare position').not.toMatch(/^\d+$/);
    }
  });

  test('is accessible in every rendered ledger state', async ({ page }, testInfo) => {
    await openStockBuild(page);
    await sweepOutfittingState(page, testInfo, 'ledger');

    await selectMount(page, 'CargoHatch');
    await sweepOutfittingState(page, testInfo, 'ledger/cargo-hatch selected');

    await selectMount(page, 'MediumHardpoint1');
    await page.getByRole('button', { name: /change module/i }).click();
    await expect(page.getByRole('radio').first()).toBeVisible();
    await sweepOutfittingState(page, testInfo, 'ledger/chooser open');
  });
});

test.describe('package-populated fixed mounts', () => {
  test('arrive fitted before any calculation is read, with no repair state', async ({ page }) => {
    await openStockBuild(page);

    // Every fixed mount carries a module. The application ran no repair pass —
    // this is what the package's own construction returned (FR-010).
    for (const key of ['Armour', 'PowerPlant', 'MainEngines', 'FrameShiftDrive', 'CargoHatch']) {
      await expect(page.locator(`[data-slot-key="${key}"]`), key).not.toContainText(/empty/i);
    }

    // The validation verdict is already published, which means the calculation
    // read happened after construction rather than before it.
    await expect(page.getByText(/the almanac reports this build as/i)).toBeVisible();
  });

  test('carry no repair provenance into anything the build is saved or shared as', async ({
    page,
  }) => {
    await openStockBuild(page);
    await expect(page.getByText('Saved in this browser')).toBeVisible();

    const stored = await page.evaluate(() =>
      Object.keys(localStorage)
        .filter((key) => key.startsWith('edsb:record:'))
        .map((key) => localStorage.getItem(key) ?? '')
        .join('\n'),
    );

    expect(stored.length).toBeGreaterThan(0);
    // A defaulted mount is ordinary build state. Nothing records that it was
    // defaulted, because there is nothing for a Commander to decide about it.
    expect(stored).not.toContain('defaulted');
    expect(stored).not.toContain('repair');
    expect(stored).not.toContain('sourceSymbol');
    expect(page.url()).not.toContain('defaulted');
  });
});

/**
 * Finding a replacement, end to end (US2).
 *
 * The chooser's order and its four-field search are proved against the package
 * in `candidate-query.spec.ts`. What is checked here is that a Commander
 * actually gets them: that the sections are announced, that a term with the
 * wrong case still finds the module, that nothing matched is a sentence rather
 * than a blank region, and that the list is read again after a fit instead of
 * being remembered.
 */

/** Opens the chooser for the selected mount and waits for its rows. */
async function openChooser(page: Page): Promise<void> {
  await page.getByRole('button', { name: /change module/i }).click();
  await expect(page.locator('.candidate').first()).toBeVisible();
}

/** The number the surface draws beside the search — canvas 1d's `24 FIT`. */
async function drawnCount(page: Page): Promise<number> {
  const text = await page.locator('.replacement__count').innerText();
  return Number(text.replace(/\D+/gu, ''));
}

async function search(page: Page, query: string): Promise<void> {
  await page.locator('input[type="search"]').fill(query);
}

test.describe('finding a replacement', () => {
  test('offers every choice the Almanac has for the mount, and says how many', async ({ page }) => {
    await openStockBuild(page);
    // A small hardpoint's whole list is short enough to be built in one page, so
    // the drawn count and the rendered rows are the same number here.
    await selectMount(page, 'SmallHardpoint1');
    await openChooser(page);

    const drawn = await drawnCount(page);
    const rendered = await page.locator('.candidate').count();

    // The count is the list, not a separate claim about it.
    expect(drawn).toBe(rendered);
    expect(drawn).toBeGreaterThan(1);

    // The expansion is stock records *plus* their pre-engineered variants, so a
    // list that offered only stock rows would be missing a whole kind of choice.
    await expect(page.getByText('Pre-engineered', { exact: true }).first()).toBeVisible();
  });

  test('builds a long list a page at a time, and says how much is built', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'MediumHardpoint1');
    await openChooser(page);

    const drawn = await drawnCount(page);
    const firstPage = await page.locator('.candidate').count();

    // The whole list is longer than the page that was built for it, and the
    // surface says so rather than letting the shortfall pass as the answer.
    expect(drawn).toBeGreaterThan(firstPage);
    await expect(page.locator('.replacement__built')).toContainText(String(drawn));

    await page.getByRole('button', { name: /show more modules/i }).click();
    await expect(page.locator('.candidate')).not.toHaveCount(firstPage);
  });

  test('names its sections and puts the unique rewards last', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'SmallHardpoint1');
    await openChooser(page);

    const headings = await page
      .locator('.candidates__section > h3')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ''));

    // Neither canvas draws these; they are the structure, named for a reader.
    expect(headings[0]).toMatch(/standard/i);
    expect(headings.at(-1)).toMatch(/unique reward/i);

    const rewardRow = page.locator('.candidates__section').last().locator('.candidate').first();
    await expect(rewardRow).toContainText(/reward only/i);
  });

  test('matches every term, whatever case or accents it is typed in', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'MediumHardpoint1');
    await openChooser(page);

    // Two terms across two different indexed fields: the module's name and its
    // mount type. Both have to match, and neither is typed the way it is drawn.
    await search(page, 'MULTI-CANNON gimballed');
    await expect(page.locator('.candidate').first()).toBeVisible();

    const identities = await page
      .locator('.candidate .identity')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent ?? ''));

    expect(identities.length).toBeGreaterThan(0);
    for (const identity of identities) {
      expect(identity.toLowerCase()).toContain('multi-cannon');
      expect(identity.toLowerCase()).toContain('gimballed');
    }
  });

  test('never matches a package symbol, however exactly it is typed', async ({ page }) => {
    await openStockBuild(page);
    await selectMount(page, 'MediumHardpoint1');
    await openChooser(page);

    await search(page, 'Hpt_MultiCannon_Gimbal_Medium');

    // The symbol is the identity a fit is carried out with; it is not something
    // a Commander searches by, and a search that quietly matched it would find
    // rows whose visible text does not contain the query.
    await expect(page.locator('.replacement__no-matches')).toBeVisible();
  });

  test('explains a search that found nothing, and clears back to the whole list', async ({
    page,
  }) => {
    await openStockBuild(page);
    await selectMount(page, 'MediumHardpoint1');
    await openChooser(page);

    const all = await drawnCount(page);

    await search(page, 'zzzz nothing');
    await expect(page.locator('.replacement__no-matches')).toContainText(/zzzz nothing/);
    await expect(page.locator('.candidate')).toHaveCount(0);

    await page.locator('.replacement__clear').click();
    await expect(page.locator('.candidate').first()).toBeVisible();
    expect(await drawnCount(page)).toBe(all);
  });

  test('reads the list again after a fit rather than remembering it', async ({ page }) => {
    await openStockBuild(page);

    // A docking computer is one of the Almanac's exclusive families: fitting one
    // takes the rest of that family out of every other optional mount.
    await selectMount(page, 'Slot02_Size6');
    await openChooser(page);
    await search(page, 'docking computer');
    const before = await page.locator('.candidate').count();
    expect(before).toBeGreaterThan(0);
    await page.getByRole('button', { name: /cancel/i }).click();

    await selectMount(page, 'Slot01_Size7');
    await fitFromChooser(page, (identities) =>
      identities.findIndex((identity) => /docking computer/i.test(identity)),
    );

    await selectMount(page, 'Slot02_Size6');
    await openChooser(page);
    await search(page, 'docking computer');

    // Fewer, because the Almanac now says so. Nothing here knows what an
    // exclusive family is; it asked again and rendered the answer.
    expect(await page.locator('.candidate').count()).toBeLessThan(before);
  });

  test('is accessible in every chooser state', async ({ page }, testInfo) => {
    await openStockBuild(page);
    await selectMount(page, 'MediumHardpoint1');
    await openChooser(page);
    await sweepOutfittingState(page, testInfo, 'chooser/full');

    await search(page, 'multi');
    await expect(page.locator('.candidate').first()).toBeVisible();
    await sweepOutfittingState(page, testInfo, 'chooser/searched');

    await search(page, 'zzzz nothing');
    await expect(page.locator('.replacement__no-matches')).toBeVisible();
    await sweepOutfittingState(page, testInfo, 'chooser/no matches');

    await page.getByRole('button', { name: /cancel/i }).click();
    await selectMount(page, 'CargoHatch');
    await sweepOutfittingState(page, testInfo, 'chooser/mount takes nothing');
  });
});
