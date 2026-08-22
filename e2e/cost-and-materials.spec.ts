import { expect, test, type Page } from '@playwright/test';
import englishMessages from '../src/app/i18n/locales/en.json';
import germanMessages from '../src/app/i18n/locales/de.json';
import { sweepOutfittingState } from './accessibility';
import { applyDraft, chooseRecipe, openEditor as bringEditorOnScreen } from './outfitting-surfaces';

/**
 * The cost and material blocks, end to end.
 *
 * What is checked here is mostly that these blocks say exactly what canvases 1c
 * and 1d draw and nothing more. Six spec-versus-canvas collisions were ruled in
 * the design's favour in wave 10, so the assertions that matter most are the
 * ones that fail if the withdrawn surface — traces, evidence lists, lower-bound
 * wording — comes back (`specs/009-cost-and-materials/design/reference-review.md`).
 */

const HULL = 'Anaconda';

/**
 * Creates a stock build and lands in the workspace with the rail rendered.
 *
 * The control is found by the message the active language actually draws, so
 * the same journey runs in German without a second copy of it.
 */
async function openStockBuild(page: Page, messages = englishMessages): Promise<void> {
  await page.goto(`/ships/${HULL}`);
  await page.getByRole('button', { name: messages['hullDetail.create'] }).click();
  await expect(page).toHaveURL(/\/build(#|$)/);
  await expect(page.locator('edsb-cost-materials .cost__row').first()).toBeVisible();
}

function digits(text: string): number {
  return Number(text.replaceAll(/\D/gu, ''));
}

/**
 * What the package says this hull's stock build costs.
 *
 * Asked of the installed Almanac rather than written down, so the assertion is
 * parity with the package and not a copy of it that a release could quietly
 * diverge from. Imported dynamically because the package is ESM-only and its
 * `exports` map has no CommonJS entry for the leaf subpath.
 */
async function packageRetail() {
  const core = await import('@elite-dangerous-almanac/core/ships/ship-loadout');
  return core.ShipLoadout.default(HULL).retailCredits();
}

test.describe('the COST block', () => {
  test('shows the package figures and the canvas’s four rows', async ({ page }) => {
    await openStockBuild(page);
    const retail = await packageRetail();

    const rows = page.locator('edsb-cost-materials .cost__row');
    await expect(rows).toHaveCount(4);

    const values = await page.locator('edsb-cost-materials .cost__value').allInnerTexts();
    expect(digits(values[0]!)).toBe(retail.hull);
    expect(digits(values[1]!)).toBe(retail.modules);
    // Ruling A: the canvas's anchor row, and the one credits figure the
    // application computes.
    expect(digits(values[2]!)).toBe(retail.hull + retail.modules);
    expect(digits(values[3]!)).toBe(retail.rebuy);
  });

  test('names every row, so no weight carries meaning alone', async ({ page }) => {
    await openStockBuild(page);

    const labels = await page.locator('edsb-cost-materials .cost__label').allInnerTexts();
    expect(labels).toHaveLength(4);
    for (const label of labels) {
      expect(label.trim().length).toBeGreaterThan(0);
    }
  });

  test('associates every figure with its label natively', async ({ page }) => {
    await openStockBuild(page);

    // A description list, so a screen reader reads "Total, 361,352,360" rather
    // than two unrelated strings that happen to sit next to each other.
    await expect(page.locator('edsb-cost-materials dl.cost')).toHaveCount(1);
    await expect(page.locator('edsb-cost-materials .cost dt')).toHaveCount(4);
    await expect(page.locator('edsb-cost-materials .cost dd')).toHaveCount(4);
  });
});

test.describe('the MATERIALS block', () => {
  test('is absent until something is engineered', async ({ page }) => {
    await openStockBuild(page);

    // A stock build crafts nothing. No heading over an empty list, and no
    // fabricated zero rows.
    await expect(page.locator('edsb-cost-materials .rail-materials')).toHaveCount(0);
  });

  test('lists every consolidated row once a recipe is applied', async ({ page }) => {
    await openStockBuild(page);
    await engineerTheDrive(page);

    const rows = page.locator('edsb-cost-materials .rail-material');
    await expect(rows.first()).toBeVisible();

    // Ruling E: the canvas draws five of eighteen, and the truncation did not
    // survive. Every row the package consolidated is on screen.
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    const footer = await page.locator('edsb-cost-materials .block__footer').innerText();
    expect(footer).toContain(String(count));
  });

  test('orders the rows commonest first', async ({ page }) => {
    await openStockBuild(page);
    await engineerTheDrive(page);

    // The order a Commander gathers a shopping list in, matching the Engineer
    // panel's list (ruling G). The marker each row carries is the package's own
    // grade, so the drawn order can be read straight off them.
    const grades = await page
      .locator('edsb-cost-materials .rail-material edsb-material-grade')
      .evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute('data-grade') ?? 0)));

    expect(grades.length).toBeGreaterThan(1);
    expect(grades).toEqual([...grades].sort((left, right) => left - right));
  });

  test('states the blueprint count and the type and unit totals', async ({ page }) => {
    await openStockBuild(page);
    await engineerTheDrive(page);

    // Ruling D: three counts the canvas draws and the package does not return.
    await expect(page.locator('edsb-cost-materials .block__note')).toHaveCount(1);
    await expect(page.locator('edsb-cost-materials .block__footer span')).toHaveCount(2);
  });

  test('rules the block the four times the canvas rules it', async ({ page }) => {
    await openStockBuild(page);
    await engineerTheDrive(page);

    // Above `TOTAL`, between the two blocks, above the counts, and above Merc
    // Coin where there is one. The rule over `TOTAL` is structural: it is what
    // makes that row read as the sum of the two above it.
    const ruled = await page
      .locator(
        'edsb-cost-materials .cost__row--total, edsb-cost-materials .block + .block, edsb-cost-materials .block__footer',
      )
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).borderBlockStartWidth));

    expect(ruled).toHaveLength(3);
    for (const width of ruled) {
      expect(width).not.toBe('0px');
    }
  });
});

test.describe('what the canvas does not draw', () => {
  test('offers no control in either block', async ({ page }) => {
    await openStockBuild(page);
    await engineerTheDrive(page);

    // Ruling F. No trace disclosure, no evidence list, no slot action — the
    // canvas draws none of them, so there is nothing here to operate.
    await expect(
      page.locator(
        'edsb-cost-materials button, edsb-cost-materials a, edsb-cost-materials [aria-expanded]',
      ),
    ).toHaveCount(0);
  });

  test('sets the cost rows in the canvas’s mono face, with TOTAL larger', async ({ page }) => {
    await openStockBuild(page);

    // Canvas 1c puts the label and its figure in one JetBrains Mono face, and
    // steps `TOTAL` up from 11px to 13px in a heavier weight. The material
    // names below are Barlow prose, which is the contrast worth keeping.
    const rows = await page.locator('edsb-cost-materials .cost__row').evaluateAll((nodes) =>
      nodes.map((node) => {
        const label = node.querySelector('.cost__label');
        const style = getComputedStyle(label as Element);
        return { family: style.fontFamily, size: Number.parseFloat(style.fontSize) };
      }),
    );

    for (const row of rows) {
      expect(row.family).toMatch(/JetBrains Mono/i);
    }
    // hull, modules, total, rebuy — the total is the largest of the four.
    expect(rows[2]!.size).toBeGreaterThan(rows[0]!.size);
    expect(rows[3]!.size).toBeLessThan(rows[0]!.size);
  });

  test('shows no Merc Coin row for a build that buys none', async ({ page }) => {
    await openStockBuild(page);
    await engineerTheDrive(page);

    await expect(page.locator('edsb-cost-materials .rail-material--merc-coin')).toHaveCount(0);
  });
});

test.describe('accessibility and reflow', () => {
  test('scans clean with both blocks rendered', async ({ page }, testInfo) => {
    await openStockBuild(page);
    await engineerTheDrive(page);

    await sweepOutfittingState(page, testInfo, 'cost-and-materials');
  });

  test('never scrolls the document sideways', async ({ page }) => {
    await openStockBuild(page);
    await engineerTheDrive(page);

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows).toBe(false);
  });

  test('keeps both blocks in canvas order at every width', async ({ page }) => {
    await openStockBuild(page);
    await engineerTheDrive(page);

    // DOM order is the read order, and it is `COST` then `MATERIALS` whether
    // the rail is a column beside the bench or a stack under it.
    const headings = await page.locator('edsb-cost-materials .block__heading').allInnerTexts();
    expect(headings).toHaveLength(2);
  });
});

test.describe('language and formatting', () => {
  test('draws every owned label from messages, with no raw key or blank', async ({ page }) => {
    await openStockBuild(page);
    await engineerTheDrive(page);

    const owned = await page
      .locator('edsb-cost-materials .block__heading, edsb-cost-materials .cost__label')
      .allInnerTexts();
    expect(owned.length).toBeGreaterThan(0);
    for (const label of owned) {
      expect(label.trim()).not.toBe('');
      // A message key that reached the screen is a missing translation
      // presented as content.
      expect(label).not.toMatch(/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/u);
    }
  });

  test('formats every figure for the active locale', async ({ browser, baseURL }) => {
    // Reached the only way a Commander can reach a language: by asking for it
    // with their browser.
    const context = await browser.newContext({ baseURL, locale: 'de-DE' });
    const page = await context.newPage();

    await openStockBuild(page, germanMessages);
    const retail = await packageRetail();
    const values = await page.locator('edsb-cost-materials .cost__value').allInnerTexts();

    // German groups with dots. The digits are unchanged — formatting never
    // alters a package number.
    expect(digits(values[0]!)).toBe(retail.hull);
    expect(values[0]!).not.toBe(String(retail.hull));

    await context.close();
  });
});

test.describe('the privacy boundary', () => {
  test('reaches no other origin to draw either block', async ({ page, baseURL }) => {
    const foreign: string[] = [];
    page.on('request', (request) => {
      if (baseURL !== undefined && !request.url().startsWith(baseURL)) {
        foreign.push(request.url());
      }
    });

    await openStockBuild(page);
    await engineerTheDrive(page);

    // In particular the canvas's `edassets.org` rarity icons and its Google
    // Fonts link, both of which are replaced rather than fetched.
    expect(foreign).toEqual([]);
  });

  test('writes no cost or material value anywhere it could be read back', async ({ page }) => {
    await openStockBuild(page);
    await engineerTheDrive(page);

    const total = digits(
      await page.locator('edsb-cost-materials .cost__row--total .cost__value').innerText(),
    );
    const stored = await page.evaluate(() => JSON.stringify(window.localStorage));

    // These figures are derived from the build every time they are shown. A
    // stored copy would be a second, staleable source of the same fact.
    expect(stored).not.toContain(String(total));
    expect(page.url()).not.toContain(String(total));
  });
});

/**
 * Applies an ordinary, fully costed recipe so the materials block has content.
 *
 * The mount is confirmed selected before the editor is asked for: at mobile
 * width the bench is a layer reached by an `ENGINEER` action that only exists
 * once a mount is marked, so clicking the row and asking immediately races it.
 */
async function engineerTheDrive(page: Page): Promise<void> {
  const row = page.locator('[data-slot-key="FrameShiftDrive"] button').first();
  await row.click();
  await expect(row).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.replacement__title, .outfitting__bench-title').first()).toBeVisible();

  await bringEditorOnScreen(page);
  await chooseRecipe(page, /Increased Range/i);
  await applyDraft(page);
  await expect(page.locator('edsb-cost-materials .rail-material').first()).toBeVisible();
}
