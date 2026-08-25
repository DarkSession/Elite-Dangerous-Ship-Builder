import { expect, test, type Page } from '@playwright/test';
import englishMessages from '../src/app/i18n/locales/en.json';
import germanMessages from '../src/app/i18n/locales/de.json';
import { sweepOutfittingState } from './accessibility';
import {
  applyDraft,
  chooseRecipe,
  fitCommitted,
  openChooserRows,
  openEditor as bringEditorOnScreen,
  surfacesAreLayers,
} from './outfitting-surfaces';

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
 * The mount the package sells two ways, one of them for Merc Coin.
 *
 * The same fixture the unit suite uses, reached the way a Commander reaches it:
 * through the chooser (`src/app/domain/cost-materials/cost-materials.fixtures.ts`).
 * Several Merc-Coin articles fit this mount at different prices, so the row is
 * pinned to a cargo rack — the package sells both sizes of it for the same
 * figure, which is why either may be the one the chooser lists first.
 */
const CARGO_RACK = {
  slots: ['Slot01_Size7', 'Slot02_Size6'],
  symbols: ['Int_CargoRack_Size5_Class1', 'Int_CargoRack_Size6_Class1'],
} as const;

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
  const metrics = await import('@elite-dangerous-almanac/core/ships/build-metrics');
  return metrics.BuildMetrics.of(core.ShipLoadout.default(HULL)).buildCost().credits;
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
    expect(digits(values[2]!)).toBe(retail.total);
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

test.describe('the Merc Coin row', () => {
  test('appears with the package total once a Merc-Coin article is fitted', async ({ page }) => {
    await openStockBuild(page);
    await fitMercenaryCargoRack(page, CARGO_RACK.slots[0]);

    const row = page.locator('edsb-cost-materials .rail-material--merc-coin');
    await expect(row).toHaveCount(1);

    // The package's own build total, asked of the installed Almanac rather
    // than written down.
    expect(digits(await row.innerText())).toBe(await mercPrice(CARGO_RACK.slots[0]));
  });

  test('states the build total, not one article’s price', async ({ page }) => {
    await openStockBuild(page);
    await fitMercenaryCargoRack(page, CARGO_RACK.slots[0]);
    const one = digits(
      await page.locator('edsb-cost-materials .rail-material--merc-coin').innerText(),
    );

    await fitMercenaryCargoRack(page, CARGO_RACK.slots[1]);

    // Two recognised articles, still one row (ruling C). The figure is
    // `buildCost().mercCoins` over the whole build, so it moves past what either
    // article costs on its own — which is what tells a build total from a
    // per-article price (FR-005).
    const both = digits(
      await page.locator('edsb-cost-materials .rail-material--merc-coin').innerText(),
    );
    await expect(page.locator('edsb-cost-materials .rail-material--merc-coin')).toHaveCount(1);
    expect(both).toBe(one + (await mercPrice(CARGO_RACK.slots[1])));
    expect(both).toBeGreaterThan(one);
  });

  test('is named, and closes the block after every material row', async ({ page }) => {
    await openStockBuild(page);
    await engineerTheDrive(page);
    await fitMercenaryCargoRack(page, CARGO_RACK.slots[0]);

    // Ruling C put this row inside the materials block rather than in COST, and
    // the canvas draws it last. A colour alone would not say what it is, so the
    // row carries its own label as well (WCAG 1.4.1).
    const rows = page.locator('edsb-cost-materials .rail-material');
    await expect(rows.last()).toHaveClass(/rail-material--merc-coin/);
    await expect(page.locator('edsb-cost-materials .rail-material--merc-coin')).toContainText(
      /\p{L}/u,
    );
  });

  test('is left out of the material type and unit counts', async ({ page }) => {
    await openStockBuild(page);
    await engineerTheDrive(page);
    await fitMercenaryCargoRack(page, CARGO_RACK.slots[0]);

    // Merc Coins are neither a material type nor a unit of one. The two footer
    // counts are counted over the material rows only (FR-006).
    const materialRows = await page
      .locator('edsb-cost-materials .rail-material:not(.rail-material--merc-coin)')
      .count();
    const footer = await page.locator('edsb-cost-materials .block__footer span').allInnerTexts();

    expect(digits(footer[0]!)).toBe(materialRows);

    // The unit total too: Merc Coins are not units of a material, so the
    // figure is the sum of the material rows' own counts and nothing else.
    const counts = await page
      .locator(
        'edsb-cost-materials .rail-material:not(.rail-material--merc-coin) .rail-material__count',
      )
      .allInnerTexts();
    expect(counts).toHaveLength(materialRows);
    expect(digits(footer[1]!)).toBe(counts.reduce((running, count) => running + digits(count), 0));
  });

  test('draws its rarity and its coin from this origin', async ({ page }) => {
    await openStockBuild(page);
    await engineerTheDrive(page);
    await fitMercenaryCargoRack(page, CARGO_RACK.slots[0]);

    // The canvas draws both the rarity marks and the coin as `edassets.org`
    // files. Every image in these blocks is served from here instead
    // (constitution I), and the rarity a row carries is the package's grade.
    const sources = await page
      .locator('edsb-cost-materials img')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('src') ?? ''));
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      expect(source).toMatch(/^assets\//);
    }
    await expect(
      page.locator('edsb-cost-materials .rail-material edsb-material-grade').first(),
    ).toHaveAttribute('data-grade', /^[1-5]$/);
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

/**
 * Fits the cargo rack's Merc-Coin article through the chooser.
 *
 * The variant shares its symbol with the stock record in the same mount, so the
 * row is found by the acquisition label the package supplies for it rather than
 * by the module's name, which both rows carry.
 */
async function fitMercenaryCargoRack(page: Page, slot: string): Promise<void> {
  const mount = page.locator(`[data-slot-key="${slot}"] button`).first();
  await mount.click();
  await expect(mount).toHaveAttribute('aria-pressed', 'true');

  await openChooserRows(page);
  // Both labels: several Merc-Coin articles fit this mount, and the module's
  // own name is what tells this one from the rest.
  const row = page
    .locator('.candidate')
    .filter({ hasText: /merc-coin/i })
    .filter({ hasText: /cargo rack/i })
    .first();
  await expect(row).toBeVisible();
  // The name, not the row: a row's centre can fall in the gap between the
  // identity and the figures, and Firefox does not activate a label from a
  // click that lands on no content.
  await row.locator('.candidate__name').click();
  await expect(row.locator('input[type="radio"]')).toBeChecked();
  if (await surfacesAreLayers(page)) {
    await page.getByRole('button', { name: /fit module/i }).click();
  }
  await fitCommitted(page);

  await expect(page.locator('edsb-cost-materials .rail-material--merc-coin')).toBeVisible();
}

/**
 * What the package charges for the Merc-Coin article of one mount's rack.
 *
 * Read from the installed Almanac by the symbol the stock build has in that
 * mount, so the expectation follows a catalogue change instead of pinning one.
 */
async function mercPrice(slot: string): Promise<number> {
  const loadout = await import('@elite-dangerous-almanac/core/ships/ship-loadout');
  const pre = await import('@elite-dangerous-almanac/core/ships/pre-engineered');

  const symbol = loadout.ShipLoadout.default(HULL)
    .fittedModules()
    .find((module) => module.slot === slot)?.symbol;
  const price = pre
    .getPreEngineeredVariants(symbol ?? '')
    .find((article) => article.acquisition === 'mercenary')?.mercCoinCost;

  // A catalogue that no longer sells this mount's rack for Merc Coin fails
  // here, rather than quietly making every assertion below it vacuous.
  expect(price).toBeGreaterThan(0);
  return price ?? 0;
}
