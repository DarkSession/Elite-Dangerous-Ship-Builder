import { expect, test, type Locator, type Page } from '@playwright/test';
import { sweepOutfittingState } from './accessibility';

/**
 * The bench's states, held to the same floor as every other surface.
 *
 * Three states nothing else reaches: a bench with nothing on it, a loadout with
 * a weapon on every mount the suit carries and one it does not, and a chooser
 * open over the item view. Each owes an axe pass, an ordered heading walk, a
 * target measurement, an overflow check and a clipping check — the same sweep
 * the ship tool's states take, because the floor is the application's rather
 * than the feature's (constitution V).
 */

const RIFLE_MOUNT = 'PrimaryWeapon1';

/** The rows of whichever chooser is open: both draw the same row. */
function choices(page: Page): Locator {
  return page.locator('dialog[open] .choice');
}

async function chooseSuit(page: Page, name: string): Promise<void> {
  const gate = page.locator('.gate__suits .choice');
  if ((await gate.count()) > 0) {
    await gate.filter({ hasText: name }).click();
    await expect(page.locator('.gate')).toHaveCount(0);
    return;
  }
  await page.locator('.item__swap').click();
  await choices(page).filter({ hasText: name }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
}

/** Selects a compact tab. The wide composition draws every region at once. */
async function showTab(page: Page, label: string): Promise<void> {
  const tab = page.getByRole('tab', { name: label });
  if ((await tab.count()) > 0) await tab.click();
}

async function openRow(page: Page, target: string): Promise<void> {
  await showTab(page, 'Loadout');
  if ((await page.locator('.bench__region--loadout').count()) === 0) {
    await page.locator('.item__back').click();
  }
  await page.locator(`.ledger__row[data-target="${target}"]`).click();
  await expect(page.locator('.item')).toBeVisible();
}

test.describe('every bench state', () => {
  test('a bench with nothing on it says so and stays sound', async ({ page }, testInfo) => {
    // Canvas 2a's gate: the ledger, the figures and the slots are all drawn,
    // and the previews among them are out of the reading order rather than
    // dimmed into it.
    await page.goto('/equipment');
    await expect(page.locator('.gate')).toBeVisible();

    await sweepOutfittingState(page, testInfo, 'empty bench');
  });

  test('a loadout, and a chooser open over it', async ({ page }, testInfo) => {
    await page.goto('/equipment');
    await expect(page.locator('.gate')).toBeVisible();
    await chooseSuit(page, 'Dominator Suit');
    await openRow(page, RIFLE_MOUNT);
    await page.locator('.item__swap').click();
    await choices(page).first().click();

    await sweepOutfittingState(page, testInfo, 'loadout');

    await openRow(page, RIFLE_MOUNT);
    await page.locator('.item__swap').click();
    await expect(choices(page).first()).toBeVisible();

    await sweepOutfittingState(page, testInfo, 'weapon chooser');
  });

  test('a fitted modification, and the slot chooser that fitted it', async ({ page }, testInfo) => {
    await page.goto('/equipment');
    await expect(page.locator('.gate')).toBeVisible();
    await chooseSuit(page, 'Dominator Suit');
    await openRow(page, 'suit');
    await page.locator('.grade').last().click();

    await openRow(page, 'suit');
    await page.locator('.slots__slot[data-slot="0"]').click();
    await expect(page.locator('.chooser__clear')).toBeVisible();

    await sweepOutfittingState(page, testInfo, 'modification chooser');

    await choices(page).first().click();
    await showTab(page, 'Materials');

    await sweepOutfittingState(page, testInfo, 'material requirements');
  });

  test('a mount the worn suit does not carry reads as held, in words', async ({
    page,
  }, testInfo) => {
    await page.goto('/equipment');
    await expect(page.locator('.gate')).toBeVisible();
    await chooseSuit(page, 'Dominator Suit');
    await openRow(page, 'PrimaryWeapon2');
    await page.locator('.item__swap').click();
    await choices(page).first().click();
    await openRow(page, 'suit');
    await chooseSuit(page, 'Maverick Suit');

    await sweepOutfittingState(page, testInfo, 'held mount');
  });
});
