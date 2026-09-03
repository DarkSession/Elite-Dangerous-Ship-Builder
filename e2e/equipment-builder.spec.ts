import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * The on-foot outfitting bench.
 *
 * Feature 013's journeys: assembling a loadout and reading what it is worth
 * (US1), and fitting modifications and reading what they cost (US2).
 */

test.describe('the bench has an address of its own', () => {
  test('opens at /equipment without going through another screen', async ({ page }) => {
    // Directly, not by clicking through the ship tool: an address a Commander
    // can bookmark and return to (013/FR-027).
    await page.goto('/equipment');

    await expect(page.locator('main .bench')).toBeVisible();
  });

  test('names both tools in the shell, and marks the one that is open', async ({ page }) => {
    await page.goto('/equipment');

    const tools = page.locator('.frame__tools .frame__tool');
    await expect(tools).toHaveText(['Ship Builder', 'Equipment Builder']);
    await expect(page.locator('.frame__tool--current')).toHaveText('Equipment Builder');

    await page.goto('/ships');
    await expect(page.locator('.frame__tool--current')).toHaveText('Ship Builder');
  });
});

/**
 * Assembling a loadout and reading what it is worth (US1).
 *
 * Written to be true at every width. Wide is artboard `1a` — three columns at
 * once — and compact is `1b`, where the item view replaces the ledger and the
 * stats are a tab; the helpers below say which of the two is in front of them
 * rather than pinning either.
 */

/**
 * The rows of whichever chooser is open.
 *
 * Both choosers draw the same row and a closed layer keeps its content in the
 * document, so an unscoped `.choice` resolves to the suit list whatever is in
 * front of a Commander.
 */
function choices(page: Page): Locator {
  return page.locator('dialog[open] .choice');
}

/** Opens the bench and waits for it: it always opens on the gate (canvas 2a). */
async function openBench(page: Page): Promise<void> {
  await page.goto('/equipment');
  await expect(page.locator('.gate')).toBeVisible();
}

/**
 * Wears a suit: from the gate on an empty bench, or from the suit's own chooser.
 *
 * The gate's cards are the same rows the chooser draws, so the two paths differ
 * only in where the list stands.
 */
async function chooseSuit(page: Page, name: string): Promise<void> {
  const gate = page.locator('.gate__suits .choice');
  if ((await gate.count()) > 0) {
    await gate.filter({ hasText: name }).click();
    await expect(page.locator('.gate')).toHaveCount(0);
    return;
  }
  await openRow(page, 'suit');
  await page.locator('.item__swap').click();
  await choices(page).filter({ hasText: name }).click();
  // The layer keeps its content in the document; what closes is the dialog.
  await expect(page.locator('dialog[open]')).toHaveCount(0);
}

/** Opens one ledger row in the item view, at either composition. */
async function openRow(page: Page, target: string): Promise<void> {
  await showTab(page, 'Loadout');
  if ((await page.locator('.bench__region--loadout').count()) === 0) {
    await page.locator('.item__back').click();
  }
  await page.locator(`.ledger__row[data-target="${target}"]`).click();
  await expect(page.locator('.item')).toBeVisible();
}

/** Selects a compact tab. The wide composition draws every region at once. */
async function showTab(page: Page, label: string): Promise<void> {
  const tab = page.getByRole('tab', { name: label });
  if ((await tab.count()) > 0) {
    await tab.click();
  }
}

async function ledgerRow(page: Page, target: string): Promise<Locator> {
  await showTab(page, 'Loadout');
  if ((await page.locator('.bench__region--loadout').count()) === 0) {
    await page.locator('.item__back').click();
  }
  return page.locator(`.ledger__row[data-target="${target}"]`);
}

test.describe('assembling a loadout', () => {
  test.beforeEach(async ({ page }) => {
    await openBench(page);
  });

  test('offers the mounts the chosen suit carries, and states its figures', async ({ page }) => {
    await chooseSuit(page, 'Dominator Suit');

    // The catalogue's three mounts, all of them offered by this suit.
    await expect(await ledgerRow(page, 'PrimaryWeapon1')).toBeEnabled();
    await expect(await ledgerRow(page, 'PrimaryWeapon2')).toBeEnabled();
    await expect(await ledgerRow(page, 'SecondaryWeapon')).toBeEnabled();

    await showTab(page, 'Stats');
    await expect(page.locator('.bench__region--stats .metric')).toHaveCount(2);
    await expect(page.locator('.bench__region--stats edsb-resistance-bar')).toHaveCount(4);
  });

  test('restates the shields when the suit’s grade is raised', async ({ page }) => {
    await chooseSuit(page, 'Dominator Suit');
    await openRow(page, 'suit');
    await page.locator('.grade').first().click();

    await showTab(page, 'Stats');
    const strength = page.locator('.bench__region--stats .metric__number').first();
    const atGradeOne = await strength.textContent();

    await openRow(page, 'suit');
    await page.locator('.grade').last().click();
    await showTab(page, 'Stats');

    await expect(strength).not.toHaveText(atGradeOne ?? '');
  });

  test('fits a weapon on a mount and counts it in the firepower', async ({ page }) => {
    await chooseSuit(page, 'Dominator Suit');
    await openRow(page, 'PrimaryWeapon1');
    await page.locator('.item__swap').click();
    const chosen =
      (await choices(page).first().locator('.choice__name').textContent())?.trim() ?? '';
    await choices(page).first().click();

    await expect(await ledgerRow(page, 'PrimaryWeapon1')).toContainText(chosen);

    await showTab(page, 'Stats');
    const firepower = page.locator('.bench__region--stats .stats__row');
    await expect(firepower).toHaveCount(1);
    await expect(firepower).toContainText(chosen);
  });

  test('offers the Flight Suit one grade, and says it takes no modification', async ({ page }) => {
    await chooseSuit(page, 'Flight Suit');
    await openRow(page, 'suit');

    await expect(page.locator('.grade')).toHaveCount(1);
    await expect(page.locator('.item__notice')).toBeVisible();
  });
});

test.describe('a mount the worn suit does not carry', () => {
  test('keeps the weapon, and says the mount is held rather than dropping it', async ({ page }) => {
    await openBench(page);
    await chooseSuit(page, 'Dominator Suit');

    // The Dominator's second primary, filled.
    await openRow(page, 'PrimaryWeapon2');
    await page.locator('.item__swap').click();
    const held = (await choices(page).first().locator('.choice__name').textContent())?.trim() ?? '';
    await choices(page).first().click();

    // The Maverick carries one primary. The second is not lost (FR-007).
    await chooseSuit(page, 'Maverick Suit');
    const row = await ledgerRow(page, 'PrimaryWeapon2');
    await expect(row).toHaveAttribute('aria-disabled', 'true');
    await expect(row).toContainText(held);

    // And it comes back intact on a suit that carries the mount again.
    await chooseSuit(page, 'Dominator Suit');
    const returned = await ledgerRow(page, 'PrimaryWeapon2');
    await expect(returned).not.toHaveAttribute('aria-disabled', 'true');
    await expect(returned).toContainText(held);
  });
});

/**
 * Fitting modifications and reading what they cost (US2).
 *
 * The claim is the same one the ship tool's cost rail makes: the shopping list
 * is the sum of what is fitted and unlocked, and it moves as choices are made.
 * A modification in a locked slot is held, counted nowhere, and returns intact
 * when the grade that opened its slot comes back (FR-011, FR-014).
 */

/** Opens one of the selected item's four modification slots. */
async function openSlot(page: Page, slot: number): Promise<void> {
  await page.locator(`.slots__slot[data-slot="${slot}"]`).click();
  await expect(page.locator('.chooser__clear')).toBeVisible();
}

/** What the materials region lists, at either composition. */
async function materials(page: Page): Promise<Locator> {
  await showTab(page, 'Materials');
  return page.locator('.bench__region--materials');
}

test.describe('fitting modifications', () => {
  test.beforeEach(async ({ page }) => {
    await openBench(page);
    await chooseSuit(page, 'Dominator Suit');
    await openRow(page, 'suit');
    await page.locator('.grade').last().click();
  });

  test('fits a modification, counts its materials, and gives them back on removal', async ({
    page,
  }) => {
    await expect((await materials(page)).locator('.materials__empty')).toBeVisible();

    await openRow(page, 'suit');
    await openSlot(page, 0);
    const fitted =
      (await choices(page).first().locator('.choice__name').textContent())?.trim() ?? '';
    await choices(page).first().click();

    await openRow(page, 'suit');
    await expect(page.locator('.slots__slot[data-slot="0"]')).toContainText(fitted);
    const listed = await materials(page);
    await expect(listed.locator('.materials__row').first()).toBeVisible();
    await expect(listed.locator('.materials__summary')).toBeVisible();

    // Cleared from the chooser rather than from a control that appears on hover.
    await openRow(page, 'suit');
    await openSlot(page, 0);
    await page.locator('.chooser__clear').click();

    await expect((await materials(page)).locator('.materials__empty')).toBeVisible();
  });

  test('refuses a recipe another slot holds, and still shows it (FR-009)', async ({ page }) => {
    await openRow(page, 'suit');
    await openSlot(page, 0);
    const taken =
      (await choices(page).first().locator('.choice__name').textContent())?.trim() ?? '';
    await choices(page).first().click();

    await openRow(page, 'suit');
    await openSlot(page, 1);
    const held = choices(page).filter({ hasText: taken });

    await expect(held).toBeVisible();
    await expect(held).toHaveAttribute('aria-disabled', 'true');
  });
});

test.describe('a slot the grade no longer opens', () => {
  test('holds what is in it, counts nothing for it, and gives it back (FR-011)', async ({
    page,
  }) => {
    await openBench(page);
    await chooseSuit(page, 'Dominator Suit');
    await openRow(page, 'suit');
    await page.locator('.grade').last().click();

    await openRow(page, 'suit');
    await openSlot(page, 3);
    const held = (await choices(page).first().locator('.choice__name').textContent())?.trim() ?? '';
    await choices(page).first().click();

    await expect((await materials(page)).locator('.materials__row').first()).toBeVisible();

    // Grade 2 closes the fourth slot.
    await openRow(page, 'suit');
    await page.locator('.grade').nth(1).click();

    const slot = page.locator('.slots__slot[data-slot="3"]');
    await expect(slot).toHaveAttribute('aria-disabled', 'true');
    await expect(slot).toContainText(held);
    await expect((await materials(page)).locator('.materials__empty')).toBeVisible();

    // And back at grade 5 it is fitted again, uncleared.
    await openRow(page, 'suit');
    await page.locator('.grade').last().click();

    await expect(page.locator('.slots__slot[data-slot="3"]')).toContainText(held);
    await expect((await materials(page)).locator('.materials__row').first()).toBeVisible();
  });
});
