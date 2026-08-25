import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import englishMessages from '../src/app/i18n/locales/en.json';
import germanMessages from '../src/app/i18n/locales/de.json';
import { sweepOutfittingState } from './accessibility';
import { expectNoDocumentOverflow, settled } from './accessibility/assertions';
import { DOUBLED_TEXT, withRootTextScale } from './accessibility/text-scale';

/**
 * Power and thermals, end to end.
 *
 * The unit suites already prove what the projection selects and what each
 * sentinel means. What only a browser can show is the rest: that the mode strip
 * actually opens the layer, that a condition moves every figure it should and
 * nothing it should not, and that the whole panel survives a phone, a doubled
 * text size and a 400% zoom without losing a figure or scrolling the document
 * sideways.
 *
 * Nothing here writes down a megawatt. Every figure the suite checks is read
 * back out of the running page and compared with another part of the same page
 * that has to agree with it — a suite that pinned the Anaconda's plant output
 * would fail the day the Almanac corrected it, which is not what it is for.
 */

const HULL = 'Anaconda';

/** Creates a stock build and opens the anatomy region's `POWER` mode. */
async function openPower(page: Page, messages = englishMessages): Promise<void> {
  await page.goto(`/ships/${HULL}`);
  await page.getByRole('button', { name: messages['hullDetail.create'] }).click();

  await page
    .locator('edsb-hull-anatomy .anatomy__modes button')
    .filter({ hasText: messages['anatomy.mode.power'] })
    .click();
  await expect(page.locator('edsb-power-thermals .power')).toBeVisible();
}

/** The cells of one table in the dashboard, row by row. */
async function rows(page: Page, selector: string): Promise<string[][]> {
  return page
    .locator(`${selector} tbody tr`)
    .evaluateAll((nodes) =>
      nodes.map((node) =>
        [...node.querySelectorAll('th, td')].map((cell) => (cell.textContent ?? '').trim()),
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
 * The canvas sets its tile and column labels in caps, and the design system
 * draws that in CSS rather than in the catalogue — the words a translator
 * writes stay sentence case. Comparing both ends in one case checks that the
 * right message reached the screen without asserting the treatment.
 */
function caps(text: string): string {
  return text.toLocaleUpperCase('en');
}

/**
 * Presses one segment of a segmented control and waits for it to say so.
 *
 * `settled` waits for animations to stop, which is not the same as waiting for
 * a redraw: with nothing animating it returns at once, and a zoneless
 * application can still be a frame short of having drawn the press. A table
 * read in that frame is the table from before it. The control publishes its own
 * pressed state from the same signal as the figures beside it, so once that
 * reads true those figures have been drawn again too.
 */
async function press(page: Page, segment: Locator): Promise<void> {
  await segment.click();
  await expect(segment).toHaveAttribute('aria-pressed', 'true');
  await settled(page);
}

/**
 * Presses one of a bank's four pip blocks and waits for the bank to say so.
 *
 * Not `press`: a block is not a toggle with a pressed state. The six pips are
 * shared, so asking for three in one bank can leave another at a pip and a half,
 * and no block stands for that. What the bank does publish is the name of the
 * group the blocks sit in — the allocation it stands at — drawn from the same
 * signal as the recharge in the cell beside it, so once that name has moved the
 * figures in the row have been drawn again too.
 *
 * `settled` is not enough on its own here, for the reason given over `press`
 * and measurably so: in a loop that presses and reads, better than a third of
 * the reads come back as the allocation from before the press. It stays,
 * because a press the panel has answered may still be animating.
 */
async function pressPip(page: Page, block: Locator): Promise<void> {
  const bank = block.locator('xpath=..');
  const standing = await bank.getAttribute('aria-label');
  expect(standing, 'the pip group is named with the allocation it stands at').not.toBeNull();

  await block.click();
  await expect(bank).not.toHaveAttribute('aria-label', standing ?? '');
  await settled(page);
}

/** Puts the dashboard into its retracted condition. */
async function retractHardpoints(page: Page): Promise<void> {
  await press(
    page,
    page
      .locator('edsb-power-thermals .power__hardpoints button')
      .filter({ hasText: englishMessages['power.hardpoints.retracted'] }),
  );
}

test.describe('opening the layer', () => {
  test('retitles the region and replaces the plates with the panel', async ({ page }) => {
    await openPower(page);

    await expect(page.locator('edsb-hull-anatomy .anatomy__heading')).toHaveText(
      englishMessages['power.heading'],
    );
    // A title and nothing under it, which is all the canvas's switching script
    // carries per mode.
    await expect(page.locator('edsb-hull-anatomy .anatomy__title p')).toHaveCount(0);

    // The plates go with the mode. The canvas's switching script hides the
    // plate container outside `mounts`, so the side selector and the legend
    // that belong to the plates leave with them and the panel has the region to
    // itself (design/canvas-contract.md).
    await expect(page.locator('edsb-power-thermals')).toBeVisible();
    await expect(page.locator('edsb-hull-anatomy .anatomy__plates')).toHaveCount(0);
    await expect(page.locator('edsb-hull-anatomy .anatomy__sides')).toHaveCount(0);
    await expect(page.locator('edsb-hull-anatomy .anatomy__legend')).toHaveCount(0);
    await expect(page.locator('edsb-hull-anatomy .schematic__mount')).toHaveCount(0);
  });

  test('leaves the mounts layer exactly as it was when the mode is closed', async ({ page }) => {
    await openPower(page);
    await page
      .locator('edsb-hull-anatomy .anatomy__modes button')
      .filter({ hasText: englishMessages['anatomy.mode.mounts'] })
      .click();

    await expect(page.locator('edsb-power-thermals')).toHaveCount(0);
    await expect(page.locator('edsb-hull-anatomy .anatomy__heading')).toHaveText(
      englishMessages['anatomy.heading'],
    );
    // The plates are back, drawing their node numbers and carrying no trace of
    // the mode that replaced them.
    await expect(page.locator('edsb-hull-anatomy .anatomy__plates')).toBeVisible();
    await expect(page.locator('edsb-hull-anatomy .schematic__mount[data-power]')).toHaveCount(0);
  });
});

/**
 * The priority-group rows as the canvas draws them: a group, a draw, and either
 * a cumulative percentage or the word that replaces it.
 */
async function bandRows(page: Page): Promise<{ group: string; draw: string; tail: string }[]> {
  return page.locator('.power__block--bands .power__band').evaluateAll((nodes) =>
    nodes.map((node) => ({
      group: node.querySelector('.power__band-group')?.textContent?.trim() ?? '',
      draw: node.querySelector('.power__band-draw')?.textContent?.trim() ?? '',
      tail:
        node.querySelector('.power__band-share')?.textContent?.trim() ??
        node.querySelector('.power__band-state')?.textContent?.trim() ??
        '',
    })),
  );
}

test.describe('reading the build', () => {
  test('draws every group the build uses, each stating its own verdict', async ({ page }) => {
    await openPower(page);

    const bands = await bandRows(page);
    // The groups this build puts something in, in the package's order. The game
    // has five; a group nothing is assigned to is not a reading of this build.
    expect(bands.length).toBeGreaterThan(0);
    expect(bands.length).toBeLessThanOrEqual(5);
    const numbers = bands.map((band) => Number(digits(band.group)));
    expect(numbers).toEqual([...numbers].sort((left, right) => left - right));
    for (const band of bands) {
      expect(band.group).toMatch(/^Group [1-5]$/u);
      expect(band.draw).toMatch(/MW$/u);
      // A lit group states its share of plant output; a shed one states the
      // word the canvas puts in that column instead.
      expect(band.tail).toMatch(
        new RegExp(`^(\\d+%|${englishMessages['power.bands.offline']})$`, 'u'),
      );
    }
    expect(bands.some((band) => band.tail.endsWith('%'))).toBe(true);
  });

  test('lists the drawing modules against a total that they add up to', async ({ page }) => {
    await openPower(page);

    const list = page.locator('edsb-power-thermals .module');
    const drawn = await list.count();
    expect(drawn).toBeGreaterThan(0);

    const draws = await list.locator('.module__draw').allInnerTexts();
    const figures = draws.map((text) => Number(text.replace(/[^\d.]/gu, '')));
    // Heaviest first, as the canvas orders its list.
    expect(figures).toEqual([...figures].sort((left, right) => right - left));

    // The note beside the heading is the whole list added up, so the two
    // readings on this block have to agree without either being written down.
    const note = await page.locator('.power__block--modules .power__note').innerText();
    const total = Number((note.match(/[\d.]+/u) ?? ['0'])[0]);
    const added = figures.reduce((sum, figure) => sum + figure, 0);
    expect(Math.abs(added - total)).toBeLessThan(0.05 * drawn);
  });

  test('draws the heat bars the canvas names, its threshold and its four tiles', async ({
    page,
  }) => {
    await openPower(page);

    const names = await page.locator('.power__block--heat .heat__name').allInnerTexts();
    expect(names.slice(0, 5)).toEqual([
      englishMessages['power.heat.scenario.idle'],
      englishMessages['power.heat.scenario.thrusters'],
      englishMessages['power.heat.scenario.fsd-charging'],
      englishMessages['power.heat.scenario.firing-drained'],
      englishMessages['power.heat.scenario.firing-sustained'],
    ]);

    // Every bar states its own reading beside itself, so nothing on this block
    // is carried by the length of a fill alone.
    const levels = await page.locator('.power__block--heat .heat__level').allInnerTexts();
    expect(levels).toHaveLength(names.length);
    for (const level of levels) {
      expect(level.trim()).not.toBe('');
    }

    // Read through `caps` because the design system sets these in capitals: the
    // assertion is about the words, not about the stylesheet.
    expect(caps(await page.locator('.heat__threshold-label').innerText())).toBe(
      caps(englishMessages['power.heat.threshold']),
    );
    const keys = await page.locator('.power__block--heat .heat__key').allInnerTexts();
    expect(keys.map((key) => caps(key.trim()))).toEqual([
      caps(englishMessages['power.heat.within']),
      caps(englishMessages['power.heat.over']),
    ]);

    const facts = caps(await page.locator('.power__block--heat .power__facts').innerText());
    expect(facts).toContain(caps(englishMessages['power.heat.resting']));
    expect(facts).toContain(caps(englishMessages['power.heat.peak']));
    expect(facts).toContain(caps(englishMessages['power.heat.dissipation']));
    expect(facts).toContain(caps(englishMessages['power.heat.sinks']));
  });

  test('draws the three capacitors with their own figures', async ({ page }) => {
    await openPower(page);

    const banks = await rows(page, '.distributor');
    expect(banks.map((row) => row[0])).toEqual([
      englishMessages['power.distributor.bank.systems'],
      englishMessages['power.distributor.bank.engines'],
      englishMessages['power.distributor.bank.weapons'],
    ]);
    for (const bank of banks) {
      expect(bank[1]).toMatch(/MJ$/u);
      expect(bank[2]).toMatch(/MJ\/s$/u);
      expect(bank[4]).toMatch(/MJ\/s$/u);
    }
  });
});

test.describe('the conditions', () => {
  test('stowing the hardpoints moves every figure and states what is missing', async ({ page }) => {
    await openPower(page);
    const bands = page.locator('.power__block--bands .power__band');
    const deployed = await bands.first().innerText();
    const summary = page.locator('edsb-power-thermals .power__summary');

    // The canvas's three tiles, and only those three: no headroom, no
    // utilisation and no verdict.
    const shown = caps(await summary.innerText());
    expect(shown).toContain(caps(englishMessages['power.summary.plant']));
    expect(shown).toContain(caps(englishMessages['power.summary.draw']));
    expect(shown).toContain(caps(englishMessages['power.summary.unpowered']));

    await retractHardpoints(page);

    // Stowing moves the figures rather than removing any: all three tiles hold
    // in either state, which is why the canvas draws no sentence about what is
    // missing and neither does this.
    expect(await bands.first().innerText()).not.toBe(deployed);
    const stowed = caps(await summary.innerText());
    expect(stowed).toContain(caps(englishMessages['power.summary.plant']));
    expect(stowed).toContain(caps(englishMessages['power.summary.unpowered']));
  });

  test('setting a bank’s pips takes them out of the other two', async ({ page }) => {
    await openPower(page);
    const before = await rows(page, '.distributor');

    // The fourth block on systems: four pips there, and there are only six.
    const systems = page.locator('.distributor tbody tr').first().locator('.pips__step');
    await pressPip(page, systems.nth(3));

    const after = await rows(page, '.distributor');
    expect(after[0][4]).not.toBe(before[0][4]);
    // Capacity and rated recharge are properties of the fitted distributor, and
    // no allocation moves them.
    expect(after[0][1]).toBe(before[0][1]);
    expect(after[0][2]).toBe(before[0][2]);
    expect(after[1][1]).toBe(before[1][1]);
    expect(after[2][1]).toBe(before[2][1]);
    // The other two paid for it, so their recharges moved as well.
    expect(after[1][4]).not.toBe(before[1][4]);
    expect(after[2][4]).not.toBe(before[2][4]);
  });

  test('offers no draft, no apply, no reset and no error text', async ({ page }) => {
    await openPower(page);

    const panel = page.locator('edsb-power-thermals');
    await expect(panel).not.toContainText('Apply');
    await expect(panel).not.toContainText('Reset');
    await expect(panel.locator('.field__error')).toHaveCount(0);
  });

  test('changes no build, no history, no fragment and nothing stored', async ({ page }) => {
    await openPower(page);
    // Read after the link is published, not just after the route resolves:
    // feature 002 writes the fragment a moment behind the build landing, and a
    // value captured before then would make that arrival look like a change
    // this capability made. Only this test reads the URL, so only this test
    // waits for it.
    await expect(page).toHaveURL(/\/build#b\./);
    const fragment = new URL(page.url()).hash;

    await retractHardpoints(page);
    await pressPip(
      page,
      page.locator('.distributor tbody tr').first().locator('.pips__step').first(),
    );

    expect(new URL(page.url()).hash).toBe(fragment);
    // Neither condition is part of the build, so neither reaches storage: a
    // reload opens on the state the panel opens on.
    const stored = await page.evaluate(() => JSON.stringify(Object.entries(window.localStorage)));
    expect(stored).not.toContain('retracted');
    expect(stored).not.toContain('pips');
  });
});

test.describe('the status rail', () => {
  test('states the plant against the draw, and the remainder the canvas states', async ({
    page,
  }) => {
    await openPower(page);

    const line = page.locator('edsb-power-summary .rail-power');
    await expect(line).toBeVisible();
    await expect(line.locator('.rail-power__label')).toHaveText(
      englishMessages['power.rail.label'],
    );

    const figures = await line.locator('.rail-power__figures').innerText();
    expect(figures).toMatch(/MW/u);

    // The rail's draw is the same figure the dashboard's summary carries.
    const summary = await page.locator('edsb-power-thermals .power__summary').innerText();
    expect(digits(summary)).toContain(digits(figures.split('of')[0]));

    // The canvas's `· 7.80 OFF` suffix stands exactly where there is a
    // remainder to state, which is where the dashboard draws a dark group.
    const dark = await page.locator('edsb-power-thermals .power__band--offline').count();
    expect(caps(figures).includes('OFF')).toBe(dark > 0);
  });

  test('draws the bar of the same figures, named rather than left a shape', async ({ page }) => {
    await openPower(page);

    const bar = page.locator('edsb-power-summary .rail-bar');
    await expect(bar).toBeVisible();
    // The lengths carry no reading the line above does not, so the bar says in
    // words what it is showing rather than leaving it to the amber.
    await expect(bar).toHaveAttribute('aria-label', /\d/u);
    await expect(bar.locator('.rail-bar__plant')).toBeVisible();
  });

  test('holds no control in the block', async ({ page }) => {
    await openPower(page);

    await expect(
      page.locator('edsb-power-summary button, edsb-power-summary a, edsb-power-summary input'),
    ).toHaveCount(0);
  });

  test('stands on the same inset as the cells it heads', async ({ page }) => {
    await openPower(page);

    // Canvas 1c draws this block and the six metric cells under it inside one
    // padded block, which the workspace owns. So the figures start where the
    // cells start: an inset of this block's own would be a second one inside
    // that padding, and the reading would stand further in than the cells it
    // heads (`specs/003-ship-statistics/design/status-rail.md`, "Items 3 to 5
    // are one block").
    const line = page.locator('edsb-power-summary .rail-power');
    const cells = page.locator('.outfitting__status-cells .metric');
    await expect(line).toBeVisible();
    await expect(cells).toHaveCount(6);

    // The leading edge of the grid, not of its first cell in DOM order: the
    // cells are two to a row, so mirrored the first of them is the one in the
    // trailing column and its own edge is a column in from the block's.
    const starts = await cells.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLElement).getBoundingClientRect().left),
    );
    const lineBox = (await line.boundingBox())!;
    expect(Math.round(lineBox.x)).toBe(Math.round(Math.min(...starts)));
  });
});

test.describe('the conditions that break layouts', () => {
  test('keeps every figure at doubled text without scrolling the document', async ({ page }) => {
    await withRootTextScale(page, DOUBLED_TEXT);
    await openPower(page);

    expect((await bandRows(page)).length).toBeGreaterThan(0);
    expect(await rows(page, '.distributor')).toHaveLength(3);
    await expectNoDocumentOverflow(page);
  });

  test('stacks its blocks at 400% zoom rather than scrolling sideways', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 256 });
    await openPower(page);

    // Every block, at the narrowest width the matrix runs: the compact canvas
    // truncates the module list to five rows under a `TOP DRAW` heading and
    // drops the distributor's capacity and rated recharge. Neither is built.
    expect((await bandRows(page)).length).toBeGreaterThan(0);
    expect(await page.locator('.heat__bar').count()).toBeGreaterThanOrEqual(5);
    const banks = await rows(page, '.distributor');
    expect(banks[0][1]).toMatch(/MJ$/u);
    await expectNoDocumentOverflow(page);
  });

  test('loses no figure in an expanded translation', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, locale: 'de-DE' });
    const page = await context.newPage();
    await openPower(page, germanMessages);

    const bands = await bandRows(page);
    expect(bands.length).toBeGreaterThan(0);
    expect(bands[0].group).toBe('Gruppe 1');
    // German groups its decimals with a comma. The digits are unchanged:
    // formatting never alters a package number.
    expect(bands[0].draw).toMatch(/MW$/u);
    await expectNoDocumentOverflow(page);

    await context.close();
  });

  test('mirrors the layout without losing a figure', async ({ page }) => {
    await openPower(page);
    const before = await rows(page, '.distributor');

    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    await settled(page);

    expect(await rows(page, '.distributor')).toEqual(before);
    await expectNoDocumentOverflow(page);
  });

  test('loses no state with motion removed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openPower(page);

    await retractHardpoints(page);

    // The requirement is not less animation: it is that no state was ever only
    // reachable through one. The bars are the part a transition could have been
    // carrying, so the figures beside them are what is read back.
    await expect(page.locator('.power__block--bands .power__band').first()).toContainText(
      englishMessages['power.unit.megawatts'],
    );
    await page.emulateMedia({ reducedMotion: null });
  });
});

test.describe('accessibility', () => {
  test('the dashboard passes a scan in both hardpoint states', async ({
    page,
  }, testInfo: TestInfo) => {
    await openPower(page);
    await sweepOutfittingState(page, testInfo, 'power-thermals/deployed');

    await retractHardpoints(page);
    await sweepOutfittingState(page, testInfo, 'power-thermals/retracted');
  });
});
