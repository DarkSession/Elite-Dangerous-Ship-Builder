import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import englishMessages from '../src/app/i18n/locales/en.json';
import germanMessages from '../src/app/i18n/locales/de.json';
import { sweepOutfittingState } from './accessibility';
import { expectNoDocumentOverflow, settled } from './accessibility/assertions';
import { DOUBLED_TEXT, withRootTextScale } from './accessibility/text-scale';
import { buildStockHull } from './shell';

/**
 * Defence analysis, end to end.
 *
 * The unit suites already prove what the projection selects and what each
 * sentinel means. What only a browser can show is the rest: that the mode strip
 * actually opens the layer, that the allocation the power dashboard is read at
 * is the allocation the pip column and the recovery are read at — while the
 * bare four columns beside them stand still — and that the whole panel survives a
 * phone, a doubled text size and a 400% zoom without losing a figure or
 * scrolling the document sideways.
 *
 * Nothing here writes down a megajoule. Every figure the suite checks is read
 * back out of the running page and compared with another part of the same page
 * that has to agree with it — a suite that pinned the Anaconda's shield pool
 * would fail the day the Almanac corrected it, which is not what it is for.
 */

const HULL = 'Anaconda';

/** Creates a stock build and opens the anatomy region's `DEFENCE` mode. */
async function openDefence(page: Page, messages = englishMessages): Promise<void> {
  await page.goto(`/ships/${HULL}`);
  await buildStockHull(page, messages['hullDetail.create']);
  await openMode(page, messages['anatomy.mode.defence']);
  await expect(page.locator('edsb-defence-analysis .defence')).toBeVisible();
}

/** Presses one segment of the anatomy mode strip. */
async function openMode(page: Page, label: string): Promise<void> {
  const segment = page
    .locator('edsb-hull-anatomy .anatomy__modes button')
    .filter({ hasText: label });
  await segment.click();
  await expect(segment).toHaveAttribute('aria-pressed', 'true');
  await settled(page);
}

/**
 * The damage rows of one card, cell by cell.
 *
 * The bar's own cell is left out: it holds no text at all, by design, and every
 * reading on the line is in the cells that do — four on the shield card since
 * the fifth column joined it, three on the hull, which pips do not reach.
 */
async function damageRows(page: Page, card: string): Promise<string[][]> {
  return page
    .locator(`edsb-defence-analysis .${card} .damage tbody tr`)
    .evaluateAll((nodes) =>
      nodes.map((node) =>
        [...node.querySelectorAll('th, td:not(.damage__bar)')].map((cell) =>
          (cell.textContent ?? '').trim(),
        ),
      ),
    );
}

/** Every digit in a string, so a locale's own grouping cannot change the value. */
function digits(text: string): string {
  return text.replace(/\D/gu, '');
}

/**
 * Upper case, for comparing a drawn label with the message it came from.
 *
 * The canvas sets its headings and tile labels in caps, and the design system
 * draws that in CSS rather than in the catalogue — the words a translator
 * writes stay sentence case. Comparing both ends in one case checks that the
 * right message reached the screen without asserting the treatment.
 */
function caps(text: string): string {
  return text.toLocaleUpperCase('en');
}

/** One card's headline figure, as drawn. */
function pool(page: Page, card: string): Locator {
  return page.locator(`edsb-defence-analysis .${card} .card__pool-value`);
}

/**
 * The shield card's two recovery phases, in seconds.
 *
 * Read back off the page and turned into a number so two allocations can be
 * compared without this suite writing down a duration of its own. Only the
 * `m:ss` readings are collected: the recharge rate on the same block is a rate
 * rather than a phase, and a phase under a minute is a plain count of seconds
 * that no drained allocation produces.
 */
async function recoveryDurations(page: Page): Promise<number[]> {
  const drawn = await page
    .locator('edsb-defence-analysis .card--shield .card__facts .metric__value')
    .allInnerTexts();

  return drawn.flatMap((text) => {
    const parts = /^(\d+):(\d+)/u.exec(text.trim());
    return parts === null ? [] : [Number(parts[1]) * 60 + Number(parts[2])];
  });
}

test.describe('opening the layer', () => {
  test('retitles the region and replaces the plates with the two cards', async ({ page }) => {
    await openDefence(page);

    await expect(page.locator('edsb-hull-anatomy .anatomy__heading')).toHaveText(
      englishMessages['defence.heading'],
    );
    // A title and nothing under it, which is all the canvas's switching script
    // carries per mode.
    await expect(page.locator('edsb-hull-anatomy .anatomy__title p')).toHaveCount(0);

    await expect(page.locator('edsb-defence-analysis')).toBeVisible();
    await expect(page.locator('edsb-hull-anatomy .anatomy__plates')).toHaveCount(0);
    await expect(page.locator('edsb-hull-anatomy .anatomy__legend')).toHaveCount(0);
    await expect(page.locator('edsb-power-thermals')).toHaveCount(0);
  });

  test('leaves the mounts layer exactly as it was when the mode is closed', async ({ page }) => {
    await openDefence(page);
    await openMode(page, englishMessages['anatomy.mode.mounts']);

    await expect(page.locator('edsb-defence-analysis')).toHaveCount(0);
    await expect(page.locator('edsb-hull-anatomy .anatomy__heading')).toHaveText(
      englishMessages['anatomy.heading'],
    );
    await expect(page.locator('edsb-hull-anatomy .anatomy__plates')).toBeVisible();
    await expect(page.locator('edsb-hull-anatomy .schematic__mount[data-power]')).toHaveCount(0);
  });
});

test.describe('reading the build', () => {
  test('heads both cards with a pool and names what each is read from', async ({ page }) => {
    await openDefence(page);

    for (const card of ['card--shield', 'card--armour'] as const) {
      await expect(pool(page, card)).toHaveText(/\d/u);
    }
    const headings = await page.locator('edsb-defence-analysis .card__heading').allInnerTexts();
    expect(headings.map((heading) => caps(heading.trim()))).toEqual([
      caps(englishMessages['defence.shield.heading']),
      caps(englishMessages['defence.armour.heading']),
    ]);
    // The canvas names the fitted article beside each heading.
    await expect(page.locator('edsb-defence-analysis .card--shield .card__identity')).toContainText(
      /\S/u,
    );
  });

  test('sets every figure flush to the end of its own column', async ({ page }) => {
    // A column of figures is read down its length, so the digits have to line
    // up. Measured against each cell's own trailing content edge rather than
    // against the figures beside it: `32.0` over `32.0` shares an edge whether
    // the column is aligned to its start or its end, so a test that only
    // compares siblings cannot see the thing it is named for.
    //
    // Measured at all — rather than asserted on a style — because the rule that
    // draws this was present and outweighed for as long as the table has
    // existed: the cell rule beside it carries a type selector, and a bare
    // class does not beat one.
    await openDefence(page);

    for (const card of ['card--shield', 'card--armour'] as const) {
      const cells = await page
        .locator(`edsb-defence-analysis .${card} .damage tbody .damage__cell--numeric`)
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const style = getComputedStyle(node);
            const box = node.getBoundingClientRect();
            const rtl = style.direction === 'rtl';
            // The cell's own trailing content edge, inside its padding. A
            // figure flush to it is aligned to the end; one that is not, is
            // not — which a comparison between sibling figures cannot tell,
            // because equal-width figures share an edge whichever way the
            // column is aligned.
            const edge = rtl
              ? box.left + parseFloat(style.paddingInlineEnd)
              : box.right - parseFloat(style.paddingInlineEnd);
            // The figure itself, not the cell's contents: a weakness and an
            // unbounded pool each carry a word for a screen reader, positioned
            // out of sight, and a range over the whole cell would union that
            // box in and measure something nobody sees.
            const figure = [...node.childNodes].find(
              (child) => child.nodeType === 3 && (child.textContent ?? '').trim() !== '',
            );
            if (figure === undefined) {
              throw new Error(`no figure text node in ${node.className}`);
            }
            const range = node.ownerDocument.createRange();
            range.selectNodeContents(figure);
            const drawn = range.getBoundingClientRect();
            return { edge, figure: rtl ? drawn.left : drawn.right };
          }),
        );
      expect(cells.length).toBeGreaterThan(0);
      for (const cell of cells) {
        expect(Math.abs(cell.figure - cell.edge)).toBeLessThanOrEqual(1);
      }
    }
  });

  test('keeps the danger ink on a weakness figure, not only the hatch on its bar', async ({
    page,
  }) => {
    // The selector that right-aligns these cells carries a type, so the rule
    // that reddens a weakness has to carry one too or it loses the colour to
    // the numeric ink. The two facts live on the same cell and a regression in
    // either is invisible from the other, so they are asserted together.
    //
    // Compared against the token rather than a literal: this suite may not
    // write down a colour any more than it may write down a megajoule.
    await openDefence(page);

    const ink = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const swatch = document.createElement('span');
      swatch.style.color = root.getPropertyValue('--edsb-text-danger');
      document.body.append(swatch);
      const resolved = getComputedStyle(swatch).color;
      swatch.remove();

      const weak = [...document.querySelectorAll('.damage__row--weak .damage__cell--numeric')];
      return {
        danger: resolved,
        drawn: [...new Set(weak.map((cell) => getComputedStyle(cell).color))],
        aligned: [...new Set(weak.map((cell) => getComputedStyle(cell).textAlign))],
        count: weak.length,
      };
    });

    expect(ink.count, 'the stock hull draws at least one weakness').toBeGreaterThan(0);
    expect(ink.drawn).toEqual([ink.danger]);
    expect(ink.aligned).toEqual(['end']);
  });

  test('draws the four damage types with a resistance and a pool apiece', async ({ page }) => {
    await openDefence(page);

    for (const card of ['card--shield', 'card--armour'] as const) {
      const rows = await damageRows(page, card);
      expect(rows.map((row) => row[0])).toEqual([
        englishMessages['defence.damage.kinetic'],
        englishMessages['defence.damage.thermal'],
        englishMessages['defence.damage.explosive'],
        englishMessages['defence.damage.caustic'],
      ]);
      for (const row of rows) {
        // Every line states both of its figures beside the bar, so nothing on
        // this block is carried by the length of a fill alone. The resistance
        // leads its cell; a negative one is followed by the word the hatch
        // stands for, which is read out rather than seen.
        expect(row[1]).toMatch(/^-?[\d.,]+%/u);
        expect(row[2].trim()).not.toBe('');
      }
    }

    // The hull's caustic line has no resistance on a stock build, so its pool is
    // the headline pool: the two readings on the card have to agree without
    // either being written down here.
    const armour = await damageRows(page, 'card--armour');
    const caustic = armour.find((row) => row[1].replace(/\D/gu, '') === '0');
    if (caustic !== undefined) {
      expect(digits(caustic[2])).toBe(digits(await pool(page, 'card--armour').innerText()));
    }
  });

  test('states the hull’s three protection facts and no fourth', async ({ page }) => {
    await openDefence(page);

    const facts = caps(
      await page.locator('edsb-defence-analysis .card--armour .card__facts').innerText(),
    );
    expect(facts).toContain(caps(englishMessages['defence.armour.hardness']));
    expect(facts).toContain(caps(englishMessages['defence.armour.module-protection']));
    expect(facts).toContain(caps(englishMessages['defence.armour.integrity']));
    await expect(
      page.locator('edsb-defence-analysis .card--armour .card__facts .metric'),
    ).toHaveCount(3);
  });

  test('states the recharge rate and both recovery durations', async ({ page }) => {
    await openDefence(page);

    const recovery = caps(
      await page.locator('edsb-defence-analysis .card--shield .card__facts').innerText(),
    );
    expect(recovery).toContain(caps(englishMessages['defence.recovery.rate']));
    expect(recovery).toContain(caps(englishMessages['defence.recovery.full']));
    expect(recovery).toContain(caps(englishMessages['defence.recovery.broken']));
    await expect(
      page.locator('edsb-defence-analysis .card--shield .card__facts .metric'),
    ).toHaveCount(3);
  });

  test('names every source row and closes it with the package aggregate', async ({ page }) => {
    await openDefence(page);

    const rows = page.locator('edsb-defence-analysis .sources .source');
    expect(await rows.count()).toBeGreaterThan(0);
    for (const row of await rows.all()) {
      await expect(row.locator('.source__name')).toContainText(/\S/u);
      await expect(row.locator('.source__value')).toContainText(/\d/u);
    }

    // The rows carry aggregates, not shares: no row offers a per-module figure
    // and none of them is a control, because the package publishes no split and
    // the canvas draws no action here.
    await expect(page.locator('edsb-defence-analysis .sources button')).toHaveCount(0);
    await expect(page.locator('edsb-defence-analysis .sources a')).toHaveCount(0);
  });

  test('draws a weakness back from the zero mark the scale states', async ({ page }) => {
    await openDefence(page);

    // The stock hull is kinetically weak, so the armour table reaches below
    // zero and carries the mark. Measured rather than read off a style, because
    // the thing worth guarding is where the ink lands.
    const zero = page.locator('edsb-defence-analysis .card--armour .damage__zero').first();
    await expect(zero).toBeAttached();
    const mark = (await zero.boundingBox())!.x;

    const weak = page.locator('edsb-defence-analysis .card--armour .damage__row--weak').first();
    await expect(weak).toBeAttached();
    const fill = (await weak.locator('.damage__fill').boundingBox())!;

    // It ends where zero is and starts before it, rather than running the other
    // way from the leading edge as though the hull resisted what it is worst
    // against. A pixel of slack, because a hairline mark has width of its own.
    expect(fill.x).toBeLessThan(mark);
    expect(Math.abs(fill.x + fill.width - mark)).toBeLessThanOrEqual(1);
  });

  test('lines the scale up with the bars and prints zero at the mark', async ({ page }) => {
    await openDefence(page);

    const track = (await page
      .locator('edsb-defence-analysis .card--armour .damage__track')
      .first()
      .boundingBox())!;
    const scale = (await page.locator('edsb-defence-analysis .card--armour .scale').boundingBox())!;

    // A scale a length above it cannot be read off is measuring something else,
    // so it is the bar column's own width rather than the card's.
    expect(Math.abs(scale.x - track.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(scale.width - track.width)).toBeLessThanOrEqual(1);

    const mark = (await page
      .locator('edsb-defence-analysis .card--armour .damage__zero')
      .first()
      .boundingBox())!;
    const label = (await page
      .locator('edsb-defence-analysis .card--armour .scale__mark--zero .scale__label')
      .boundingBox())!;

    // And zero is named where the mark stands, not only at the ends: it is what
    // says which of the bars above are resistances and which are weaknesses.
    await expect(
      page.locator('edsb-defence-analysis .card--armour .scale__mark--zero'),
    ).toContainText(/\d/u);
    expect(Math.abs(label.x + label.width / 2 - (mark.x + mark.width / 2))).toBeLessThanOrEqual(2);
  });

  test('sets the metric cells apart with their gaps and no box around them', async ({ page }) => {
    await openDefence(page);

    // Canvas 1c builds its metric grids as cells on a panel fill with the amber
    // ground showing through one-pixel gaps. The ground is the rule; a border
    // around the whole grid is a box the canvas does not draw.
    const grid = page.locator('edsb-defence-analysis .card--armour .card__facts .metric-group');
    const box = await grid.evaluate((node) => {
      const style = getComputedStyle(node);
      return { width: style.borderTopWidth, gap: style.rowGap, padding: style.paddingTop };
    });

    expect(box).toEqual({ width: '0px', gap: '1px', padding: '0px' });
  });

  test('rules each block off across the whole card', async ({ page }) => {
    await openDefence(page);

    const rules = page.locator('edsb-defence-analysis .card--shield .card__rule');
    expect(await rules.count()).toBeGreaterThan(0);

    const card = await page
      .locator('edsb-defence-analysis .card--shield')
      .evaluate((node) => node.getBoundingClientRect().width);

    // A rule that separates two blocks has to reach across them. Measured
    // rather than asserted on a class, because the canvas's own separator is a
    // line and the thing that made it a dot was a style, not a missing element.
    for (const rule of await rules.all()) {
      const width = await rule.evaluate((node) => node.getBoundingClientRect().width);
      expect(width).toBeGreaterThan(card / 2);
    }
  });
});

test.describe('the allocation the pip column and the recovery are read at', () => {
  test('moves the pip column alone, and leaves the bare shield where it is', async ({ page }) => {
    await openDefence(page);
    const heading = page.locator('edsb-defence-analysis .card--shield .damage thead th').last();
    const before = await damageRows(page, 'card--shield');
    const column = await heading.innerText();
    const strength = await pool(page, 'card--shield').innerText();

    // The pips live on the power dashboard, and one ship has one allocation:
    // moving them there is what the pip column and the recovery are read at.
    await openMode(page, englishMessages['anatomy.mode.power']);
    await page.locator('.distributor tbody tr').first().locator('.pips__step').nth(3).click();
    await settled(page);
    await openMode(page, englishMessages['anatomy.mode.defence']);

    const after = await damageRows(page, 'card--shield');
    // `RESIST` and `MJ` are the bare shield, which no allocation moves — the
    // package's own call for them takes none — so a pip moving on the dashboard
    // leaves every figure in them exactly where it was (FR-002).
    expect(after.map((row) => row.slice(0, 3))).toEqual(before.map((row) => row.slice(0, 3)));
    // What the allocation buys is a column of its own, headed with the count it
    // was read at, and it is the only thing on the table that follows the pips.
    expect(after.map((row) => row[3])).not.toEqual(before.map((row) => row[3]));
    expect(await heading.innerText()).not.toEqual(column);
    // Named, not merely moved. The fourth block on systems is four pips, and
    // the heading says so: a figure that follows the allocation is never drawn
    // without the allocation it was read at (FR-002).
    // The unit and the allocation are two lines of one heading, so the words are
    // compared with the whitespace between them collapsed.
    expect(caps(await heading.innerText()).replace(/\s+/g, ' ')).toBe(
      caps(
        `${englishMessages['defence.damage.column.megajoules']} ${englishMessages['defence.damage.column.at-pips'].replace('{{pips}}', '4')}`,
      ),
    );
    // The pool itself is not a function of the allocation, and the package says
    // so by returning the same strength.
    expect(digits(await pool(page, 'card--shield').innerText())).toBe(digits(strength));
  });

  test('lengthens the recovery the shields need as the systems bank is drained', async ({
    page,
  }) => {
    await openDefence(page);
    const before = await recoveryDurations(page);

    // The control never empties a bank outright — six pips between three banks
    // leaves one in systems once another holds four — so this is the slowest
    // recharge the dashboard can be set to. The phase that does not finish at
    // all is the package answering `Infinity`, which the unit suite reads
    // directly because no allocation the strip can reach produces it.
    await openMode(page, englishMessages['anatomy.mode.power']);
    await page.locator('.distributor tbody tr').nth(2).locator('.pips__step').nth(3).click();
    await settled(page);
    await openMode(page, englishMessages['anatomy.mode.defence']);

    // Slower, and no phase quicker for having less to run on. Which of the two
    // moves is the package's own reading of the allocation, not this suite's.
    const after = await recoveryDurations(page);
    expect(after.length).toBe(before.length);
    expect(after).not.toEqual(before);
    for (const [index, seconds] of after.entries()) {
      expect(seconds).toBeGreaterThanOrEqual(before[index]);
    }
  });
});

test.describe('the status rail', () => {
  test('carries the same shield and hull figures the cards carry', async ({ page }) => {
    await openDefence(page);

    const rail = page.locator('edsb-defence-summary');
    await expect(rail).toBeVisible();
    const cells = await rail.locator('.metric').allInnerTexts();
    expect(cells).toHaveLength(2);
    expect(caps(cells[0])).toContain(caps(englishMessages['defence.rail.shield']));
    expect(caps(cells[1])).toContain(caps(englishMessages['defence.rail.armour']));

    // One projection, read twice: the rail and the card have to agree without
    // either figure being written down here.
    expect(digits(cells[0])).toContain(digits(await pool(page, 'card--shield').innerText()));
    expect(digits(cells[1])).toContain(digits(await pool(page, 'card--armour').innerText()));
  });

  test('holds no control in the block', async ({ page }) => {
    await openDefence(page);

    await expect(
      page.locator(
        'edsb-defence-summary button, edsb-defence-summary a, edsb-defence-summary input',
      ),
    ).toHaveCount(0);
  });
});

test.describe('the conditions that break layouts', () => {
  test('keeps every figure at doubled text without scrolling the document', async ({ page }) => {
    await withRootTextScale(page, DOUBLED_TEXT);
    await openDefence(page);

    expect(await damageRows(page, 'card--shield')).toHaveLength(4);
    expect(await damageRows(page, 'card--armour')).toHaveLength(4);
    await expectNoDocumentOverflow(page);
  });

  test('stacks the two cards at 400% zoom rather than scrolling sideways', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 256 });
    await openDefence(page);

    // Both cards whole at the narrowest width the matrix runs: the compact
    // canvas drops the resistances, the facts and the sources. None of that is
    // built — a separate abbreviated mobile data model is prohibited.
    expect(await damageRows(page, 'card--shield')).toHaveLength(4);
    expect(await damageRows(page, 'card--armour')).toHaveLength(4);
    await expect(
      page.locator('edsb-defence-analysis .card--armour .card__facts .metric'),
    ).toHaveCount(3);
    expect(await page.locator('edsb-defence-analysis .sources .source').count()).toBeGreaterThan(0);
    await expectNoDocumentOverflow(page);
  });

  test('loses no figure in an expanded translation', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, locale: 'de-DE' });
    const page = await context.newPage();
    await openDefence(page, germanMessages);

    const rows = await damageRows(page, 'card--shield');
    expect(rows.map((row) => row[0])).toEqual([
      germanMessages['defence.damage.kinetic'],
      germanMessages['defence.damage.thermal'],
      germanMessages['defence.damage.explosive'],
      germanMessages['defence.damage.caustic'],
    ]);
    await expectNoDocumentOverflow(page);

    await context.close();
  });

  test('mirrors the layout without losing a figure', async ({ page }) => {
    await openDefence(page);
    const before = await damageRows(page, 'card--armour');

    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    await settled(page);

    expect(await damageRows(page, 'card--armour')).toEqual(before);
    await expectNoDocumentOverflow(page);
  });

  test('loses no state with motion removed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openDefence(page);

    // The requirement is not less animation: it is that no state was ever only
    // reachable through one. The bars are the part a transition could have been
    // carrying, so the figures beside them are what is read back.
    expect(await damageRows(page, 'card--shield')).toHaveLength(4);
    await expect(pool(page, 'card--armour')).toHaveText(/\d/u);
    await page.emulateMedia({ reducedMotion: null });
  });
});

test.describe('accessibility', () => {
  test('the panel passes a scan at the standing and the drained allocation', async ({
    page,
  }, testInfo: TestInfo) => {
    await openDefence(page);
    await sweepOutfittingState(page, testInfo, 'defence-analysis/balanced');

    await openMode(page, englishMessages['anatomy.mode.power']);
    await page.locator('.distributor tbody tr').nth(2).locator('.pips__step').nth(3).click();
    await settled(page);
    await openMode(page, englishMessages['anatomy.mode.defence']);
    await sweepOutfittingState(page, testInfo, 'defence-analysis/weapons');
  });
});
