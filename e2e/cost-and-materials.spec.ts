import { expect, test, type Page } from '@playwright/test';
import englishMessages from '../src/app/i18n/locales/en.json';
import germanMessages from '../src/app/i18n/locales/de.json';
import { ZOOM_400, sweepOutfittingState } from './accessibility';
import { expectNoDocumentOverflow, settled } from './accessibility/assertions';
import { DOUBLED_TEXT, withRootTextScale } from './accessibility/text-scale';
import {
  applyDraft,
  chooseFirstRecipe,
  chooseRecipe,
  fitCommitted,
  openChooserRows,
  openEditor as bringEditorOnScreen,
  revealMount,
  revealStatusRail,
  surfacesAreLayers,
} from './outfitting-surfaces';
import { reachShellAction } from './shell';

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
  // Both blocks live in the status rail, which canvas 1d keeps behind its
  // `STATUS` segment rather than in the flow — so a compact run opens it, and a
  // wide one finds it already there.
  await revealStatusRail(page, exactly(messages['outfitting.status-rail.mode']));
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
    // Coin where there is one — the last of which now rules inside COST rather
    // than under the material list (ruling C, re-decided). The rule over
    // `TOTAL` is structural: it is what makes that row read as the sum of the
    // two above it.
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

  test('is named, and closes the cost block under rebuy', async ({ page }) => {
    await openStockBuild(page);
    await engineerTheDrive(page);
    await fitMercenaryCargoRack(page, CARGO_RACK.slots[0]);

    // Ruling C, re-decided 2026-08-26: the canvas draws this row inside COST,
    // ruled off under `REBUY 5%`, not at the foot of MATERIALS. A colour alone
    // would not say what it is, so the row carries its own label (WCAG 1.4.1).
    const coin = page.locator('edsb-cost-materials .rail-material--merc-coin');
    await expect(coin).toHaveCount(1);
    await expect(
      page.locator('edsb-cost-materials .block').first().locator('.rail-material--merc-coin'),
    ).toHaveCount(1);
    await expect(
      page.locator('edsb-cost-materials .materials-box .rail-material--merc-coin'),
    ).toHaveCount(0);
    await expect(coin).toContainText(/\p{L}/u);
  });

  test('bounds the material list and scrolls it rather than dropping a row', async ({ page }) => {
    await openStockBuild(page);
    await engineerTheDrive(page);

    // Ruling G: the canvas draws five rows against a footer counting eighteen
    // types, so the list is a box with a scroll. Ruling E still holds — every
    // consolidated row is present, none is truncated away.
    const list = page.locator('edsb-cost-materials .materials-box');
    await expect(list).toHaveCount(1);
    await expect(list).toHaveAttribute('tabindex', '0');

    // A scroll box needs a name; the block's own heading supplies it.
    const labelledBy = await list.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    await expect(page.locator(`#${labelledBy}`)).toHaveCount(1);

    // And the box is around the list, never the list itself: a `dl` given the
    // box's own role stops being a description list, and its terms and figures
    // stop being associated at all.
    await expect(list.locator('dl.rail-materials')).toHaveCount(1);
    await expect(list.locator('dl[role]')).toHaveCount(0);

    const bounded = await list.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        overflow: style.overflowY,
        capped: style.maxBlockSize !== 'none' && style.maxBlockSize !== '',
      };
    });
    expect(bounded.overflow).toBe('auto');
    expect(bounded.capped).toBe(true);
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
    // the rail is a column beside the bench or a stack under it. Named, not
    // counted: two headings in either order would satisfy a count, and the
    // order is the whole claim (detail design, "Purpose and semantic order").
    expect(await headingOrder(page)).toEqual(
      [
        englishMessages['cost-materials.cost.heading'],
        englishMessages['cost-materials.materials.heading'],
      ].map((heading) => heading.toLowerCase()),
    );
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

/**
 * Material names, read in German.
 *
 * `test.use` rather than a context built by hand: a hand-built context takes
 * Playwright's defaults for viewport and touch, so the same journey would run at
 * one desktop size in all ten projects and never meet the compact composition.
 */
test.describe('in German', () => {
  test.use({ locale: 'de-DE' });

  test('names every material through the shared game-text primitive', async ({ page }) => {
    await openStockBuild(page, germanMessages);
    await engineerTheDrive(page, germanMessages);

    const names = page.locator('edsb-cost-materials .rail-material__name edsb-game-text');
    const rows = await page
      .locator('edsb-cost-materials .rail-material:not(.rail-material--merc-coin)')
      .count();
    expect(rows).toBeGreaterThan(0);
    await expect(names).toHaveCount(rows);

    const drawn = await names.evaluateAll((nodes) =>
      nodes.map((node) => {
        const value = node.querySelector('.game-text__value');
        const disclosure = node.querySelector('.game-text__disclosure');
        return {
          text: (value?.textContent ?? '').trim(),
          language: value?.getAttribute('lang') ?? null,
          tagged: node.querySelector('.game-text__tag') !== null,
          describedBy: value?.getAttribute('aria-describedby') ?? null,
          disclosureId: disclosure?.getAttribute('id') ?? null,
        };
      }),
    );

    for (const row of drawn) {
      expect(row.text).not.toBe('');
      // The language the text is actually in, so a reader switches voice for a
      // canonical English name inside a German interface.
      expect(row.language).not.toBeNull();

      // The invariant that ties what is seen to what was resolved: the
      // presenter marks a row canonical exactly when it could not find the
      // active locale's name and fell back to the package's English entry, and
      // the primitive draws its tag exactly then
      // (`src/app/i18n/game-text.presenter.ts`, the `canonical` arm). A row
      // whose text is English and carries no tag is an untranslated name passed
      // off as a translated one.
      expect(row.tagged, `${row.text} is in ${row.language}`).toBe(row.language === 'en');

      // And the disclosure is bound to the name rather than left sitting beside
      // it, so a reader meets the two together.
      expect(row.describedBy).toBe(row.tagged ? row.disclosureId : null);
    }

    // The active locale reached the package: this recipe's ordinary elements
    // have German names, so a run that drew every row in English would mean the
    // presenter never asked for the chosen language at all — which every
    // assertion above would otherwise sit happily through.
    expect(drawn.some((row) => row.language === 'de')).toBe(true);
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

  test('puts no figure of its own into a link or an address the session visits', async ({
    page,
  }) => {
    // Every address this session produces, not just the one it ends on: the
    // build link is republished into the fragment on each edit, so the figures
    // would show up in the history entries rather than in `page.url()`.
    const visited: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        visited.push(frame.url());
      }
    });

    await openStockBuild(page);
    // The stock build already publishes a link, so waiting for one at all would
    // be satisfied before the edit this test is about. What has to be waited
    // for is the *re-encoded* fragment: the engineering goes into the link, so
    // the address changes, and inspecting the addresses before it does would
    // miss the only one that could carry a new figure.
    // The stock build's own link is published a moment after the workspace
    // opens, so it is waited for rather than read: `page.url()` at that instant
    // has no fragment at all.
    await expect(page).toHaveURL(/\/build#b\./);
    const stock = new URL(page.url()).hash;

    await engineerTheDrive(page);
    await expect.poll(() => new URL(page.url()).hash).not.toBe(stock);

    const figures = await ownFigures(page);
    expect(figures.length).toBeGreaterThan(0);
    visited.push(page.url());

    for (const address of visited) {
      for (const figure of figures) {
        expect(address, `${figure} reached ${address}`).not.toContain(String(figure));
      }
    }
  });

  test('adds nothing of its own to a SLEF export', async ({ page }) => {
    await openStockBuild(page);
    await engineerTheDrive(page);

    // The name itself, not the whole primitive: an untranslated row also draws
    // the disclosure tag, and that is the application's word rather than the
    // package's material.
    const materials = (
      await page
        .locator(
          'edsb-cost-materials .rail-material:not(.rail-material--merc-coin) .game-text__value',
        )
        .allInnerTexts()
    ).map((name) => name.trim());
    expect(materials.length).toBeGreaterThan(0);

    await reachShellAction(page, /^export$/i);
    const layer = page.getByRole('dialog', { name: /export build/i });
    await expect(layer).toBeVisible();
    await layer.getByRole('radio', { name: /slef json/i }).check();
    // Waited for rather than read once: the payload is generated after the
    // format is chosen, and `inputValue()` is a one-shot read that would
    // otherwise race it — the same guard `e2e/slef-export.spec.ts` puts on it.
    const field = layer.getByLabel(/slef payload/i);
    await expect(field).not.toHaveValue('');
    const payload = await field.inputValue();

    // No material, no shopping list and no count of one reaches the file: the
    // export is a fit, and what a fit would cost to craft is read from it rather
    // than carried by it.
    for (const material of materials) {
      expect(payload.toLowerCase()).not.toContain(material.toLowerCase());
    }
    expect(payload.toLowerCase()).not.toContain('merccoin');
    expect(payload.toLowerCase()).not.toContain('material');

    // What SLEF *does* carry is `HullValue`, `ModulesValue` and `Rebuy`: they
    // are fields of the format, written by feature 004 from the same package
    // call this block reads (`src/app/domain/slef/slef-export-pricing.spec.ts`).
    // Their presence is the format, not a figure this feature persisted.
    expect(payload).toContain('Rebuy');
  });
});

/**
 * The block's own figures, as the digits a leak would have to carry.
 *
 * Only the long ones. A material count of `12` or a type count of `10` would
 * match a substring of almost any address or payload by coincidence, so an
 * assertion built on them proves nothing; the credit figures run to eight and
 * nine digits, where a match is a leak rather than an accident.
 */
async function ownFigures(page: Page): Promise<number[]> {
  const values = await page.locator('edsb-cost-materials .cost__value').allInnerTexts();
  return values.map(digits).filter((figure) => String(figure).length >= 5);
}

/** The elements in either block that carry a reading a Commander has to be able to take. */
const READINGS = [
  '.block__heading',
  '.block__note',
  // The row that sets the heading and the blueprint count at opposite ends.
  // Listed as well as its two children: a collision between them moves the
  // child boxes without moving either one's text outside itself, so only the
  // row they share can see it.
  '.block__head',
  '.block__footer',
  '.cost__label',
  '.cost__value',
  '.rail-material__name',
  '.rail-material__count',
  // The rows and blocks that hold them. A reading can sit tidily inside its own
  // box while the box itself is pushed out past the rail — mirrored, or widened
  // by a long name — and only the container can see that.
  '.rail-material',
  '.block',
]
  .map((part) => `edsb-cost-materials ${part}`)
  .join(', ');

/**
 * Every reading whose painted text runs outside the box it was given.
 *
 * The instrument matters more than it looks, and two things it must not be.
 *
 * Not a comparison of the label's box with the figure's: both blocks are
 * non-wrapping flex rows, so those boxes are laid side by side and can never
 * intersect however long the text grows. That assertion cannot fail, and would
 * call these blocks sound at any text size whatsoever.
 *
 * Not `scrollWidth - clientWidth` either. These boxes are all `overflow:
 * visible`, and the engines disagree about what `scrollWidth` means for one of
 * those: Blink counts the overflowing content, Gecko reports the padding box
 * and so would answer "nothing overflows" however far the text ran — leaving
 * the assertion inert on half the matrix.
 *
 * What is measured is where the text is actually painted, from a range over
 * each text node, which both engines answer the same way. Text that is painted
 * nowhere is left out: the accessibility-only equivalents this application sets
 * beside a figure — the `credits` unit, among others — are positioned out of
 * the flow and clipped to a pixel, and counting them would report every row as
 * broken. Under two pixels is sub-pixel rounding, which the engines do
 * differently; two is text that genuinely does not fit.
 */
async function overflowingReadings(page: Page): Promise<string[]> {
  await laidOut(page);

  return page.locator(READINGS).evaluateAll((nodes) =>
    nodes
      .map((node) => {
        const element = node as HTMLElement;
        // Deliberately not skipped when the box has no width. `.cost__label` and
        // `.rail-material__name` are `flex: 1` with `min-inline-size: 0`, so the
        // way they fail is by being squeezed to nothing while their text goes on
        // painting across the figure beside them — the exact case this exists to
        // catch. An element that draws no text at all falls out below instead,
        // on having no painted range.
        const box = element.getBoundingClientRect();

        let left = Number.POSITIVE_INFINITY;
        let right = Number.NEGATIVE_INFINITY;
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        for (let text = walker.nextNode(); text !== null; text = walker.nextNode()) {
          if ((text.textContent ?? '').trim() === '') {
            continue;
          }

          let painted = true;
          for (
            let parent = text.parentElement;
            parent !== null && parent !== element.parentElement;
            parent = parent.parentElement
          ) {
            const style = getComputedStyle(parent);
            if (
              style.position === 'absolute' ||
              style.visibility === 'hidden' ||
              style.display === 'none'
            ) {
              painted = false;
              break;
            }
          }
          if (!painted) {
            continue;
          }

          const range = document.createRange();
          range.selectNode(text);
          const rect = range.getBoundingClientRect();
          if (rect.width === 0) {
            continue;
          }
          left = Math.min(left, rect.left);
          right = Math.max(right, rect.right);
        }

        if (right === Number.NEGATIVE_INFINITY) {
          return null;
        }

        // Thresholded before rounding. Rounding first would make the real
        // tolerance a pixel and a half, so sub-pixel layout noise at 200% text
        // would report a phantom overflow of exactly two.
        const over = Math.max(right - box.right, box.left - left, 0);
        return over >= 2
          ? `${(element.textContent ?? '').trim().slice(0, 40)} (+${Math.round(over)}px)`
          : null;
      })
      .filter((entry): entry is string => entry !== null),
  );
}

/**
 * Waits until the page has stopped moving and is drawn in its real typefaces.
 *
 * Every measurement below is a one-shot read of a box, and two things move
 * boxes after the DOM is ready: a running transition, and a webfont arriving.
 * The faces here are `font-display: swap` and not preloaded, so a swap landing
 * mid-measurement would either invent an overflow or hide one.
 */
async function laidOut(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await settled(page);
}

/** Where each material row's name and count sit, so a mirrored layout can be told from an unmoved one. */
async function rowEdges(page: Page): Promise<{ name: number; count: number }[]> {
  await laidOut(page);

  return page.locator('edsb-cost-materials .rail-material').evaluateAll((rows) =>
    rows.flatMap((row) => {
      const name = row.querySelector('.rail-material__name');
      const count = row.querySelector('.rail-material__count');
      return name === null || count === null
        ? []
        : [
            {
              name: Math.round(name.getBoundingClientRect().left),
              count: Math.round(count.getBoundingClientRect().left),
            },
          ];
    }),
  );
}

/**
 * The two block headings, in the order the document holds them, case-folded.
 *
 * The canvas uppercases these through `text-transform`, and whether that reaches
 * `innerText` is the engine's business rather than this feature's. Both sides of
 * every comparison are folded, so the assertion is about the order and the
 * words, which is what it claims to be about.
 */
async function headingOrder(page: Page): Promise<string[]> {
  return (await page.locator('edsb-cost-materials .block__heading').allInnerTexts()).map(
    (heading) => heading.trim().toLowerCase(),
  );
}

/**
 * A Commander's own text size, and a reading direction that runs the other way.
 *
 * Both blocks are label/figure rows in a narrow column, which is the shape that
 * fails first when text grows: the label takes the width it needs and the
 * figure has nowhere left to go. The assertion is not that the layout looks the
 * same — it will not — but that nothing is lost, which is the in-scope
 * requirement (feature 011, FR-014; quickstart scenario 7).
 */
test.describe('reading at another text size and direction', () => {
  test('a doubled text size loses no reading', async ({ page }) => {
    await withRootTextScale(page, DOUBLED_TEXT);
    await openStockBuild(page);
    await engineerTheDrive(page);

    await expect(page.locator('edsb-cost-materials .cost__row')).toHaveCount(4);
    await expect(page.locator('edsb-cost-materials .rail-material').first()).toBeVisible();
    await expect(page.locator('edsb-cost-materials .block__footer span')).toHaveCount(2);

    expect(await overflowingReadings(page), 'a reading wider than its own box').toEqual([]);
    // The page-level check stays, because horizontal page scrolling is a whole-
    // document property that a rail full of long rows is a plausible cause of,
    // and nothing else asserts it for `/build` at this text size. A clipping
    // scan does not: `clippedText` reads every element under `main`, and text
    // cut off in the ledger or the bench is not this feature's to fail on.
    await expectNoDocumentOverflow(page);
  });

  test('a long material name wraps inside its row instead of widening it', async ({ page }) => {
    await withRootTextScale(page, DOUBLED_TEXT);
    await openStockBuild(page);
    await engineerTheDrive(page);

    // The names this recipe draws run past thirty characters — `Eccentric
    // Hyperspace Trajectories`, `Atypical Disrupted Wake Echoes` — and a name
    // that does not fit is not a cosmetic problem here: a Commander shops from
    // these rows, and two materials can differ only in their tail. The
    // catalogue holds a few longer ones still; this is the longest a build
    // reaches through the journey, not the longest that exists.
    const names = (
      await page.locator('edsb-cost-materials .rail-material .game-text__value').allInnerTexts()
    ).map((name) => name.trim());
    expect(names.length).toBeGreaterThan(0);
    // A guard on the fixture rather than an assertion about the product: if the
    // catalogue ever stopped drawing a long name here, the assertions below
    // would pass without having tested anything.
    expect(Math.max(...names.map((name) => name.length))).toBeGreaterThan(20);

    // What is asserted is where the name goes, not that it is complete: these
    // blocks set no `text-overflow` and `.game-text__value` sets `overflow-wrap:
    // anywhere`, so a name that does not fit re-wraps mid-word rather than being
    // cut — it is read whole at any width, and a test claiming to prove that
    // would be proving a property of the stylesheet. What can go wrong is where
    // the wrapping puts it: a row widened past the rail, or a name grown into
    // the count beside it.
    expect(await overflowingReadings(page)).toEqual([]);
    await expectNoDocumentOverflow(page);
  });

  test('right to left mirrors the blocks without reordering them', async ({ page }) => {
    await openStockBuild(page);
    await engineerTheDrive(page);
    const before = await rowEdges(page);
    expect(before.length).toBeGreaterThan(0);
    // Left to right, the name opens each row and the count closes it.
    expect(before.every((row) => row.name < row.count)).toBe(true);

    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));

    // The direction actually took. Without this the whole test would pass
    // against a document that never turned around — and `DocumentAdapter`
    // considers itself the sole writer of this attribute, so a future commit
    // that reasserts it would silently make everything below vacuous.
    await expect(page.locator('edsb-cost-materials .block').first()).toHaveCSS('direction', 'rtl');

    // Mirrored: every count that closed its row on the right now opens it on
    // the left. This is the half a DOM comparison cannot make — Playwright
    // returns document order whichever way the page runs, so comparing the
    // headings before and after would compare document order with itself.
    const after = await rowEdges(page);
    expect(after).toHaveLength(before.length);
    expect(after.every((row) => row.count < row.name)).toBe(true);

    // Nothing here re-asserts the document order: Playwright returns document
    // order whichever way the page runs, so comparing it with the copy taken
    // before the flip would be comparing it with itself. That the order is
    // `COST` then `MATERIALS` is asserted where it can fail, in "keeps both
    // blocks in canvas order at every width".
    await expect(page.locator('edsb-cost-materials .cost__row')).toHaveCount(4);
    await expect(page.locator('edsb-cost-materials .block__footer span')).toHaveCount(2);
    // Scoped to these two blocks rather than to the document. The application
    // ships no right-to-left locale — feature 011's pseudo-locale sweep is what
    // covers the frame — so a document-wide assertion here would redden a
    // feature-009 test for a defect somewhere else entirely.
    expect(await overflowingReadings(page)).toEqual([]);
  });
});

/**
 * 400% browser zoom, as WCAG 1.4.10 defines it by equivalence.
 *
 * 1280x1024 zoomed to 400% is 320x256 CSS pixels, and the device scale factor
 * is what makes `devicePixelRatio` agree with a genuinely zoomed page. This is
 * the width at which the rail stops being a column beside the bench and becomes
 * the Status stack, so it is where the responsive composition is actually
 * decided.
 */
test.describe('at 400% browser zoom', () => {
  test.use(ZOOM_400);

  test('draws both blocks, in canvas order, with nothing cut off', async ({ page }) => {
    await openStockBuild(page);
    await engineerTheDrive(page);

    // Named in order, not counted: 320 CSS pixels is exactly where the rail
    // stops being a column and becomes the Status stack, so it is the width at
    // which a reordering would actually happen.
    expect(await headingOrder(page)).toEqual(
      [
        englishMessages['cost-materials.cost.heading'],
        englishMessages['cost-materials.materials.heading'],
      ].map((heading) => heading.toLowerCase()),
    );
    await expect(page.locator('edsb-cost-materials .cost__row')).toHaveCount(4);
    await expect(page.locator('edsb-cost-materials .rail-material').first()).toBeVisible();
    expect(await overflowingReadings(page)).toEqual([]);
    // Page-level scrolling only, for the reason the doubled-text test gives:
    // a clipping scan reads the whole of `main`, and this feature owns two
    // blocks of it.
    await expectNoDocumentOverflow(page);
  });
});

/**
 * German at a doubled text size, on this project's own device.
 *
 * `test.use` rather than a context built by hand: a hand-built context takes
 * Playwright's defaults for everything it is not given, and this layout is
 * decided by the viewport and touch profile the project sets.
 *
 * Each condition alone is fine. Together they are the pair that breaks a
 * label/figure row: `Materialarten` and `Einheiten insgesamt` are set at
 * opposite ends of one footer, and at twice the size there is not obviously
 * room for both.
 */
test.describe('in German, at a doubled text size', () => {
  test.use({ locale: 'de-DE' });

  test('draws its own labels and lets none reach into its figure', async ({ page }) => {
    await withRootTextScale(page, DOUBLED_TEXT);
    await openStockBuild(page, germanMessages);
    await engineerTheDrive(page, germanMessages);

    // The canvas uppercases two of the four rows, so the drawn text is compared
    // case-insensitively against the message the catalogue actually holds.
    const drawn = (await page.locator('edsb-cost-materials .cost__label').allInnerTexts()).map(
      (label) => label.trim().toLocaleLowerCase('de'),
    );
    expect(drawn).toEqual(
      [
        germanMessages['cost-materials.cost.hull'],
        germanMessages['cost-materials.cost.modules'],
        germanMessages['cost-materials.cost.total'],
        germanMessages['cost-materials.cost.rebuy'],
      ].map((label) => label.toLocaleLowerCase('de')),
    );

    expect(await overflowingReadings(page)).toEqual([]);
    // Page-level scrolling only, for the reason the doubled-text test gives:
    // a clipping scan reads the whole of `main`, and this feature owns two
    // blocks of it.
    await expectNoDocumentOverflow(page);
  });
});

/**
 * The axe sweep, over each state the capability actually has.
 *
 * The detail design names five, and they differ in what is on screen rather
 * than in how it is styled: a scan of the populated block says nothing about
 * the build that crafts nothing, whose materials block is absent altogether.
 */
test.describe('the accessibility sweep, state by state', () => {
  test('with no build open, neither block is drawn', async ({ page }) => {
    await page.goto('/build');
    // The route is lazy, so waiting for the shell's `main` alone would assert
    // the absence of a block against a screen that had not drawn yet — and
    // would go on passing if `shown()` ever started drawing one. Waited for by
    // the empty state the page draws in place of the workspace, since
    // `edsb-outfitting-workspace` is exactly what is not rendered here.
    await expect(page.locator('.workspace__empty')).toBeVisible();

    // The state is asserted, not swept: `sweepOutfittingState` scans the whole
    // document, and this exact state is already swept by
    // `e2e/outfitting-accessibility.spec.ts` ("an empty workspace says why it is
    // empty"). A second full scan of the same screen buys nothing and costs a
    // sweep in every project.
    await expect(page.locator('edsb-cost-materials .block')).toHaveCount(0);
  });

  test('with a build that has crafted nothing, only the cost block is drawn', async ({ page }) => {
    await openStockBuild(page);

    // Swept already by `e2e/module-outfitting.spec.ts` ("is accessible in every
    // rendered ledger state"), which opens the same stock build.
    await expect(page.locator('edsb-cost-materials .cost__row')).toHaveCount(4);
    await expect(page.locator('edsb-cost-materials .rail-material')).toHaveCount(0);
  });

  test('with a Merc-Coin article bought', async ({ page }, testInfo) => {
    await openStockBuild(page);
    await engineerTheDrive(page);
    await fitMercenaryCargoRack(page, CARGO_RACK.slots[0]);

    await expect(page.locator('edsb-cost-materials .rail-material--merc-coin')).toHaveCount(1);
    await sweepOutfittingState(page, testInfo, 'cost and materials, merc coin');
  });
});

/**
 * Applies an ordinary, fully costed recipe so the materials block has content.
 *
 * The mount is confirmed selected before the editor is asked for: at mobile
 * width the bench is a layer reached by an `ENGINEER` action that only exists
 * once a mount is marked, so clicking the row and asking immediately races it.
 */
async function engineerTheDrive(page: Page, messages = englishMessages): Promise<void> {
  await revealMount(page, 'FrameShiftDrive');
  const row = page.locator('[data-slot-key="FrameShiftDrive"] button').first();
  await row.click();
  await expect(row).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.replacement__title, .outfitting__bench-title').first()).toBeVisible();

  await bringEditorOnScreen(page, exactly(messages['outfitting.capability.engineer']));
  // Dispatched on the language actually being read, not on which object was
  // passed: an equal-but-distinct English catalogue would otherwise take the
  // other branch and quietly change which recipe every assertion downstream
  // measures.
  if (messages['hullDetail.create'] === englishMessages['hullDetail.create']) {
    await chooseRecipe(page, /Increased Range/i);
  } else {
    // Blueprint names are the Almanac's game text, so a run in another language
    // takes whichever recipe the package offers first rather than pinning this
    // catalogue's English wording.
    await chooseFirstRecipe(page);
  }
  await applyDraft(page, exactly(messages['outfitting.engineering.apply']));
  await expect(page.locator('edsb-cost-materials .rail-material').first()).toBeVisible();
}

/**
 * One drawn label, matched whole.
 *
 * A bare string is a substring match on the accessible name, which would let
 * `Engineer` find `Engineering for …` and press the wrong thing.
 */
function exactly(label: string): RegExp {
  return new RegExp(`^${label.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&')}$`, 'iu');
}

/**
 * Fits the cargo rack's Merc-Coin article through the chooser.
 *
 * The variant shares its symbol with the stock record in the same mount, so the
 * row is found by the acquisition label the package supplies for it rather than
 * by the module's name, which both rows carry.
 */
async function fitMercenaryCargoRack(page: Page, slot: string): Promise<void> {
  await revealMount(page, slot);
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
