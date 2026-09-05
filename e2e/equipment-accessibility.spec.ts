import { expect, test, type Locator, type Page } from '@playwright/test';
import germanMessages from '../src/app/i18n/locales/de.json';
import { sweepOutfittingState } from './accessibility';
import { expectNoDocumentOverflow, settled } from './accessibility/assertions';
import { DOUBLED_TEXT, withRootTextScale } from './accessibility/text-scale';

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
  return page.locator('.chooser__choices .choice');
}

/**
 * The rows a Commander swaps from, wherever the composition draws them.
 *
 * Canvas 1a lists them inline under the modification slots, always on screen;
 * canvas 1b opens the same rows in a sheet over the drill-in.
 */
function swapList(page: Page): Locator {
  return page.locator('.item__alternatives .choice');
}

/** Chooses one of them. */
async function pickSwap(row: Locator): Promise<void> {
  await row.click();
}

async function chooseSuit(page: Page, name: string): Promise<void> {
  const gate = page.locator('.gate__suits .choice');
  if ((await gate.count()) > 0) {
    await gate.filter({ hasText: name }).click();
    await expect(page.locator('.gate')).toHaveCount(0);
    return;
  }
  const list = swapList(page);
  await pickSwap(list.filter({ hasText: name }));
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
  // Wide keeps the item column on screen while its contents change, so waiting
  // for the column says nothing. Wait for it to be about this row.
  await expect(page.locator(`.item[data-target="${target}"]`)).toBeVisible();
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
    await pickSwap(swapList(page).first());

    await sweepOutfittingState(page, testInfo, 'loadout');

    // Wide keeps the alternatives on the page; compact opens them over it.
    // Either way this is the state where both lists are readable at once.
    await openRow(page, RIFLE_MOUNT);
    await expect(swapList(page).first()).toBeVisible();

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

  test('a bench whose suit carries fewer mounts than the catalogue', async ({ page }, testInfo) => {
    await page.goto('/equipment');
    await expect(page.locator('.gate')).toBeVisible();
    await chooseSuit(page, 'Dominator Suit');
    await openRow(page, 'PrimaryWeapon2');
    await pickSwap(swapList(page).first());
    await openRow(page, 'suit');
    await chooseSuit(page, 'Maverick Suit');

    await expect(page.locator('.ledger__row[data-target="PrimaryWeapon2"]')).toHaveCount(0);
    await sweepOutfittingState(page, testInfo, 'fewer mounts');
  });
});

/** Opens the bench and waits for the gate, which is what it opens on. */
async function openBench(page: Page): Promise<void> {
  await page.goto('/equipment');
  await expect(page.locator('.gate')).toBeVisible();
}

/**
 * The figures the commander column states, whatever language it states them in.
 *
 * The compact composition puts them behind a tab, and that tab is named in the
 * reading language — so the label is passed in rather than assumed.
 */
async function figures(page: Page, statsTab = 'Stats'): Promise<string[]> {
  await showTab(page, statsTab);
  const stated = page.locator('.bench__region--stats .metric__number');
  // The shields block states two figures for a worn suit. Waited for rather
  // than read straight away: an empty list would compare equal to another one.
  await expect(stated).toHaveCount(2);
  return stated.allTextContents();
}

/** The digits of a figure, with the locale's own grouping taken out. */
const digits = (value: string): string => value.replace(/\D/g, '');

test.describe('the conditions that break layouts', () => {
  test('mirrors the bench without mirroring a figure', async ({ page }) => {
    await openBench(page);
    await chooseSuit(page, 'Dominator Suit');
    const before = await figures(page);

    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    await settled(page);

    expect(await figures(page)).toEqual(before);
    await expectNoDocumentOverflow(page);
  });

  test('an expanded translation keeps every reading and moves no package digit', async ({
    browser,
    baseURL,
    page,
  }) => {
    // The first suit the chooser offers, in both languages: the order is the
    // package's, and the name it is drawn under is the package's too — which is
    // the library's own translation where it has one (constitution VI).
    const wearFirst = async (target: Page): Promise<void> => {
      await target.locator('.gate__suits .choice').first().click();
      await expect(target.locator('.gate')).toHaveCount(0);
    };

    await openBench(page);
    await wearFirst(page);
    const before = await figures(page);

    const context = await browser.newContext({ baseURL, locale: 'de-DE' });
    const german = await context.newPage();
    await openBench(german);
    await wearFirst(german);

    const after = await figures(german, germanMessages['equipment.tab.stats']);
    expect(after).toHaveLength(before.length);
    // German groups and separates its decimals differently. The digits are the
    // package's and do not move because the words around them did.
    for (const [index, value] of after.entries()) {
      expect(digits(value)).toBe(digits(before[index] ?? ''));
    }

    await expectNoDocumentOverflow(german);
    await context.close();
  });

  test('loses no reading at a doubled text size', async ({ page }) => {
    await withRootTextScale(page, DOUBLED_TEXT);
    await openBench(page);
    await chooseSuit(page, 'Dominator Suit');

    // Doubled text takes the bench to its compact arrangement, where the
    // figures stand behind their own tab: the reading survives the size, in
    // whichever arrangement the room allows.
    expect(await figures(page)).toHaveLength(2);
    // Four in the `ARMOUR` block and four in `SHIELDS`, both read from the one
    // set the package publishes on the suit's grade.
    await expect(page.locator('.bench__region--stats ednb-resistance-bar')).toHaveCount(8);
    await expectNoDocumentOverflow(page);
  });

  test('loses no reading with motion removed', async ({ page }) => {
    // The requirement is not less animation: it is that no reading was ever
    // only reachable through one. The resistance bars are the part a transition
    // could have been carrying, so the figures beside them are what is read.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openBench(page);
    await chooseSuit(page, 'Dominator Suit');

    await showTab(page, 'Stats');
    await expect(page.locator('.bench__region--stats .metric__number')).toHaveCount(2);
    await expect(page.locator('.bench__region--stats ednb-resistance-bar')).toHaveCount(8);
    await page.emulateMedia({ reducedMotion: null });
  });
});
