import { expect, test, type Page } from '@playwright/test';
import { reachShellAction, reachShellLink } from './shell';

/**
 * Keeping a loadout and coming back to it (US3).
 *
 * One library holds both tools' records, so this journey never leaves the
 * application's own surfaces: the bench saves, `/builds` lists what this
 * browser is holding, and opening a loadout row lands back on the bench with
 * the suit, grade, weapons and modifications it was saved with (FR-016,
 * FR-018).
 */

/** Wears a suit from the gate, which is what an empty bench offers. */
async function wearSuit(page: Page, name: string): Promise<void> {
  await page.goto('/equipment');
  await page.locator('.gate__suits .choice').filter({ hasText: name }).click();
  await expect(page.locator('.gate')).toHaveCount(0);
}

/** Opens one ledger row in the item view, at either composition. */
async function openRow(page: Page, target: string): Promise<void> {
  const tab = page.getByRole('tab', { name: 'Loadout' });
  if ((await tab.count()) > 0) await tab.click();
  if ((await page.locator('.bench__region--loadout').count()) === 0) {
    await page.locator('.item__back').click();
  }
  await page.locator(`.ledger__row[data-target="${target}"]`).click();
  await expect(page.locator('.item')).toBeVisible();
}

/** Saves the loadout on the bench, through the shell's own `SAVE`. */
async function saveLoadout(
  page: Page,
  name: string,
  mode: 'new' | 'overwrite' = 'new',
): Promise<void> {
  await reachShellAction(page, /^Save$/);
  const dialog = page.getByRole('dialog', { name: 'Save build' });
  await dialog.getByRole('textbox', { name: 'Build name' }).fill(name);
  const asNew = dialog.getByRole('radio', { name: 'Save as a new build' });
  if (mode === 'overwrite') {
    await dialog.getByRole('radio', { name: /^Overwrite/ }).check();
  } else if ((await asNew.count()) > 0) {
    await asNew.check();
  }
  await dialog.getByRole('button', { name: 'Save build' }).click();
  await expect(dialog).toBeHidden();
}

const library = (page: Page) => page.getByRole('dialog', { name: 'Saved builds' });

/** Chooses a row in the library, which is what its footer acts on. */
async function chooseRecord(page: Page, title: string): Promise<void> {
  const row = library(page).getByRole('button', { name: new RegExp(`^${title}\\b`, 'i') });
  await expect(async () => {
    await row.click({ timeout: 2_000 });
    await expect(row).toHaveAttribute('aria-pressed', 'true', { timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
}

/** How many records this browser is holding, whatever their tool. */
async function recordCount(page: Page): Promise<number> {
  return page.evaluate(
    () => Object.keys(localStorage).filter((key) => key.startsWith('edsb:record:')).length,
  );
}

test.describe('keeping a loadout', () => {
  test('saves it, finds it in the one library, and opens it back onto the bench', async ({
    page,
  }) => {
    await wearSuit(page, 'Dominator Suit');
    await openRow(page, 'suit');
    await page.locator('.grade').last().click();
    await saveLoadout(page, 'Silent Entry');

    // Reloaded, so what is opened is what this browser is holding rather than
    // anything the page kept in memory (FR-018).
    await page.reload();
    await page.goto('/builds');
    await expect(library(page)).toBeVisible();

    // One list, both tools: the row names the suit where a build would name a
    // hull, and says which tool made it.
    const row = library(page).getByRole('button', { name: /^Silent Entry\b/i });
    await expect(row).toContainText('Dominator Suit');
    await expect(row).toContainText('Equipment Builder');

    await chooseRecord(page, 'Silent Entry');
    await library(page).getByRole('button', { name: 'Open in outfitting', exact: true }).click();

    await expect(page).toHaveURL(/\/equipment(#|$)/);
    await expect(page.locator('.gate')).toHaveCount(0);
    await openRow(page, 'suit');
    await expect(page.locator('.item__name')).toContainText('Dominator Suit');
    await expect(page.locator('.grade[data-selected="true"]')).toHaveText('5');
  });

  test('deletes one, and leaves the browser holding nothing', async ({ page }) => {
    await wearSuit(page, 'Maverick Suit');
    await saveLoadout(page, 'Salvage run');
    expect(await recordCount(page)).toBe(1);

    await page.goto('/builds');
    await chooseRecord(page, 'Salvage run');
    await library(page).getByRole('button', { name: 'Delete', exact: true }).click();
    // Destructive, so it is confirmed and the confirmation names what it removes.
    const confirmation = page.getByRole('dialog', { name: /delete/i });
    await expect(confirmation).toContainText('Salvage run');
    await confirmation.getByRole('button', { name: /^Delete/ }).click();

    await expect(library(page).getByRole('button', { name: /^Salvage run\b/i })).toHaveCount(0);
    expect(await recordCount(page)).toBe(0);
  });

  test('asks which version survives when a name is already taken (FR-017)', async ({ page }) => {
    await wearSuit(page, 'Artemis Suit');
    await saveLoadout(page, 'Survey kit');

    // Saving again from the loadout that save produced is the question the
    // layer exists to ask: replace what it came from, or keep both.
    await reachShellAction(page, /^Save$/);
    const dialog = page.getByRole('dialog', { name: 'Save build' });
    await expect(dialog.getByRole('radio', { name: /^Overwrite “Survey kit”/ })).toBeVisible();
    await expect(dialog.getByRole('radio', { name: 'Save as a new build' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).click();

    // A different loadout typed into the same name is never a silent
    // replacement: it says the name is taken and writes a separate record.
    await wearSuit(page, 'Maverick Suit');
    await reachShellAction(page, /^Save$/);
    const second = page.getByRole('dialog', { name: 'Save build' });
    await second.getByRole('textbox', { name: 'Build name' }).fill('Survey kit');

    await expect(second).toContainText(/already use[s]? this name/i);
    await second.getByRole('button', { name: 'Save build' }).click();
    expect(await recordCount(page)).toBe(2);
  });

  test('offers the library from the gate, before a suit is chosen', async ({ page }) => {
    await page.goto('/equipment');

    await page.locator('.gate__link').click();

    await expect(page).toHaveURL(/\/builds(#|$)/);
    await expect(library(page)).toBeVisible();
  });
});

test.describe('a record this version cannot open', () => {
  test('says so, keeps the bench as it was, and leaves the record stored', async ({ page }) => {
    // A loadout naming a suit the installed Almanac no longer carries. Nothing
    // partial is opened and nothing is repaired (FR-019).
    await page.addInitScript(() => {
      localStorage.setItem(
        'edsb:record:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        JSON.stringify({
          format: 'edsb.local-record',
          version: 2,
          tool: 'equipment',
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          kind: 'named',
          revisionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          createdAt: '2026-01-02T03:04:05.000Z',
          modifiedAt: '2026-01-02T03:04:05.000Z',
          name: 'A suit that is not carried',
          note: null,
          suitFamily: 'nonexistentsuit',
          loadout: {
            format: 'edsb.loadout',
            version: 1,
            suitFamily: 'nonexistentsuit',
            suitGrade: 1,
            suitModifications: [null, null, null, null],
            weapons: [null, null, null],
          },
        }),
      );
    });

    await page.goto('/builds');
    await chooseRecord(page, 'A suit that is not carried');
    await library(page).getByRole('button', { name: 'Open in outfitting', exact: true }).click();

    await expect(library(page)).toContainText(/could not be opened|nonexistentsuit/i);
    expect(await recordCount(page)).toBe(1);
  });
});
