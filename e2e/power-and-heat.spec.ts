import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import englishMessages from '../src/app/i18n/locales/en.json';
import germanMessages from '../src/app/i18n/locales/de.json';
import { sweepOutfittingState } from './accessibility';
import { expectNoDocumentOverflow, expectTargetSizes, settled } from './accessibility/assertions';
import { DOUBLED_TEXT, withRootTextScale } from './accessibility/text-scale';
import { revealStatusRail } from './outfitting-surfaces';

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

/**
 * Brings the status rail on screen and returns the dashboard afterwards.
 *
 * Canvas 1c draws the rail as a third track beside the mode panel, so both are
 * on screen at once and this is a no-op. Canvas 1d has no third track: the rail
 * is the strip's `STATUS` segment and the dashboard is its `POWER` one, and a
 * segment that is not the open one is not on the page. A journey that presses
 * in the rail and reads in the dashboard therefore does it in two visits at
 * that width, which is what a Commander does too.
 */
async function inTheRail(
  page: Page,
  visit: () => Promise<void>,
  messages = englishMessages,
): Promise<void> {
  await revealStatusRail(page, exactly(messages['outfitting.status-rail.mode']));
  await visit();
  await openMode(page, messages['anatomy.mode.power']);
}

/** One drawn label, matched whole — a bare string is a substring match. */
function exactly(label: string): RegExp {
  return new RegExp(`^${label.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&')}$`, 'iu');
}

/** Opens one segment of the anatomy strip, by the word it draws. */
async function openMode(page: Page, label: string): Promise<void> {
  await page.locator('edsb-hull-anatomy .anatomy__modes button').filter({ hasText: label }).click();
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

    // The row closing the list is the whole list added up, so the two readings
    // on this block have to agree without either being written down.
    const closing = await page.locator('.modules__total-draw').innerText();
    const total = Number((closing.match(/[\d.]+/u) ?? ['0'])[0]);
    const added = figures.reduce((sum, figure) => sum + figure, 0);
    expect(Math.abs(added - total)).toBeLessThan(0.05 * drawn);
  });

  test('heads the list and closes it in the canvas’s own words', async ({ page }) => {
    await openPower(page);

    // `MODULE` against `MW` over the tracks, and `TOTAL DRAW` under them. The
    // note that used to sit beside the heading is withdrawn with the revision.
    expect(caps(await page.locator('.modules__head-name').innerText())).toBe(
      caps(englishMessages['power.modules.column.name']),
    );
    expect(caps(await page.locator('.modules__head-draw').innerText())).toBe(
      caps(englishMessages['power.unit.megawatts']),
    );
    expect(caps(await page.locator('.modules__total-label').innerText())).toBe(
      caps(englishMessages['power.modules.total-draw']),
    );
    await expect(page.locator('.power__block--modules .power__note')).toHaveCount(0);
  });

  test('draws the heat bars the canvas names, its threshold and its four tiles', async ({
    page,
  }) => {
    await openPower(page);

    // The trigger's own text, which is the only thing the row draws. The gloss
    // behind it is the tooltip's and is asserted on its own below.
    const names = await page
      .locator('.power__block--heat .heat__name button')
      .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ''));
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

  test('sets every distributor figure flush to the end of its own column', async ({ page }) => {
    // Measured against each cell's own trailing content edge, not against the
    // figures beside it: this table's three banks draw equal-width figures down
    // every column, so siblings share an edge whichever way the column is
    // aligned and a comparison between them proves nothing.
    await openPower(page);

    // Only where the table is drawn as a table. Below 30rem the block has no
    // room for five columns and draws three lines a bank instead, each figure
    // beside the label that would have headed its column — so there is no
    // column for a figure to be flush to, and the arrangement is asserted by the
    // journey that owns it (`draws three lines to a bank` below).
    // Read from the per-figure labels rather than from the header row: the
    // header is hidden the accessible way when the columns go, which leaves it
    // a one-pixel box that still answers `visible`. The labels are drawn or they
    // are not.
    if (await page.locator('.distributor__label').first().isVisible()) {
      return;
    }

    const cells = await page
      .locator('.distributor tbody .distributor__cell--numeric')
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
          const range = node.ownerDocument.createRange();
          range.selectNodeContents(node);
          const drawn = range.getBoundingClientRect();
          return { edge, figure: rtl ? drawn.left : drawn.right };
        }),
      );
    expect(cells.length).toBeGreaterThan(0);
    for (const cell of cells) {
      expect(Math.abs(cell.figure - cell.edge)).toBeLessThanOrEqual(1);
    }
  });

  test('says what every scenario name is shorthand for, in a tooltip rather than a title', async ({
    page,
  }) => {
    await openPower(page);

    const bars = page.locator('.power__block--heat .heat__bar');
    const drawn = await bars.count();
    expect(drawn).toBeGreaterThanOrEqual(5);

    // One gloss per bar, related to the name it explains and in the document
    // rather than in a `title` or a `data-tip` — those are unreachable by touch
    // and unreliably announced (011 FR-006).
    const tips = bars.locator('.heat__description [role="tooltip"]');
    await expect(tips).toHaveCount(drawn);
    const texts = await tips.evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.trim() ?? ''),
    );
    for (const text of texts) {
      expect(text).not.toBe('');
    }
    expect(texts[0]).toBe(englishMessages['power.heat.scenario.idle.description']);
    await expect(bars.locator('[data-tip]')).toHaveCount(0);
    await expect(bars.locator('[title]')).toHaveCount(0);

    const first = bars.first();
    const trigger = first.locator('.heat__description button');
    const tip = first.locator('.heat__description [role="tooltip"]');

    // Related to its trigger whether or not it is drawn, so a reader who is
    // told the interface has the gloss without having to find a control. Which
    // is also why the closed state is asserted on the class and the trigger's
    // own `aria-expanded` rather than on visibility: undrawn here means the
    // same screen-reader-only text every other text equivalent in this
    // application is, not an element taken out of the page.
    expect(await trigger.getAttribute('aria-describedby')).toBe(await tip.getAttribute('id'));
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(tip).not.toHaveClass(/tooltip__tip--shown/);

    // Hover draws it: the reading the canvas hangs on its `data-tip`, and the
    // one a pointer expects.
    await trigger.hover();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(tip).toHaveClass(/tooltip__tip--shown/);
    const bubble = await tip.boundingBox();
    expect(bubble?.width ?? 0).toBeGreaterThan(1);

    // Drawn, it never pushes the document sideways.
    await expectNoDocumentOverflow(page);

    // And the pointer can travel from the name to the bubble to read it —
    // SC 1.4.13's "hoverable". The crossing is the interesting part: the bubble
    // stands off its trigger by a gap, and an unbridged gap collapses the tip
    // the instant the pointer enters it, which is a failure no amount of DOM
    // parentage prevents.
    const name = await trigger.boundingBox();
    expect(name).not.toBeNull();
    expect(bubble).not.toBeNull();
    for (const y of [(name?.y ?? 0) + (name?.height ?? 0) + 1, (bubble?.y ?? 0) + 1]) {
      await page.mouse.move((bubble?.x ?? 0) + (bubble?.width ?? 0) / 2, y);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    }

    // The pointer leaving takes it back.
    await page.mouse.move(0, 0);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // `Escape` puts away a tip a hover opened, with nothing inside it focused —
    // which is the case that criterion's dismissal exists for, and the case a
    // listener on the tooltip's own element would never hear.
    await trigger.hover();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // Dismissed, not disabled: the pointer leaving and coming back draws it again.
    await page.mouse.move(0, 0);
    await trigger.hover();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.mouse.move(0, 0);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // A press reaches the same gloss, because touch has no hover at all — a tap
    // where the profile has touch, a click where it does not. A press pins the
    // tip open whichever pointer it came from, and a press on a pinned tip puts
    // it away, so the control reads the same on a phone as on a desk.
    const touch = test.info().project.use.hasTouch === true;
    const press = async () => (touch ? trigger.tap() : trigger.click());

    await press();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await press();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
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
      // The capacity is `MW` and the two rates are `MJ/s`: the pool takes the
      // unit the game's own outfitting panel writes after it so the two panels
      // read as one figure, and the rates keep the unit they are actually in
      // (ruled 2026-08-27). The three columns no longer share a unit, which is
      // what stopped the pool reading as a third rate.
      expect(bank[1]).toMatch(/MW$/u);
      expect(bank[2]).toMatch(/MJ\/s$/u);
      expect(bank[4]).toMatch(/MJ\/s$/u);
    }
  });
});

test.describe('the conditions', () => {
  test('draws the hardpoint caption and names the pair by it', async ({ page }) => {
    await openPower(page);

    const caption = page.locator('edsb-power-thermals .power__hardpoints .tab-group__label');
    await expect(caption).toBeVisible();
    expect(caps(await caption.innerText())).toBe(caps(englishMessages['power.hardpoints.label']));

    // Named *by* the caption rather than by a string only a screen reader gets,
    // so the visible name and the accessible name are one string.
    const group = page.locator('edsb-power-thermals .power__hardpoints [role="group"]');
    await expect(group).toHaveAttribute(
      'aria-labelledby',
      (await caption.getAttribute('id')) ?? '',
    );
  });

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
    let figures = '';
    // Read in the rail and compared in the dashboard, in that order: canvas 1d
    // draws one segment at a time, so the two readings are two visits there.
    await inTheRail(page, async () => {
      await expect(line).toBeVisible();
      await expect(line.locator('.rail-power__label')).toHaveText(
        englishMessages['power.rail.label'],
      );
      figures = await line.locator('.rail-power__figures').innerText();
    });
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
    await revealStatusRail(page);

    const bar = page.locator('edsb-power-summary .rail-bar');
    await expect(bar).toBeVisible();
    // The lengths carry no reading the line above does not, so the bar says in
    // words what it is showing rather than leaving it to the amber.
    await expect(bar).toHaveAttribute('aria-label', /\d/u);
    await expect(bar.locator('.rail-bar__plant')).toBeVisible();
  });

  test('keeps the sentence, the figures and the bar read-only', async ({ page }) => {
    await openPower(page);

    // The pips under them are the block's only control; none of the three
    // readings above it is interactive, exactly as the canvas draws them.
    for (const selector of ['.statements', '.rail-power', '.rail-bar']) {
      await expect(
        page.locator(
          `edsb-power-summary ${selector} button, edsb-power-summary ${selector} a, edsb-power-summary ${selector} input`,
        ),
      ).toHaveCount(0);
    }
  });
});

test.describe('the rail’s pip control', () => {
  test('draws the canvas’s three banks over four blocks each', async ({ page }) => {
    await openPower(page);

    const sets = page.locator('edsb-power-summary .pipset');
    await expect(sets).toHaveCount(3);
    await expect(page.locator('edsb-power-summary .pips__step')).toHaveCount(12);

    // Each group is named with the allocation it stands at, which is the
    // reading for anyone who cannot see four rectangles.
    for (const bank of ['systems', 'engines', 'weapons']) {
      await expect(
        page.locator(`edsb-power-summary .pipset[data-bank="${bank}"] .pips`),
      ).toHaveAttribute('aria-label', /\d/u);
    }
  });

  test('moves the same allocation the distributor table reads', async ({ page }) => {
    await openPower(page);
    const before = await rows(page, '.distributor');

    // Pressed in the rail, read back in the dashboard: one condition, drawn in
    // two places, rather than a second allocation of the rail's own.
    await inTheRail(page, () =>
      pressPip(
        page,
        page.locator('edsb-power-summary .pipset').first().locator('.pips__step').nth(3),
      ),
    );

    const after = await rows(page, '.distributor');
    expect(after[0][4]).not.toBe(before[0][4]);
    // The table's own blocks stand at the allocation the rail set, which is the
    // reading its group carries — the cell itself holds buttons and no text.
    await expect(page.locator('.distributor tbody tr').first().locator('.pips')).toHaveAttribute(
      'aria-label',
      /4/u,
    );
    // The other two paid for it, so their recharges moved as well.
    expect(after[1][4]).not.toBe(before[1][4]);
    expect(after[2][4]).not.toBe(before[2][4]);
    // Capacity is a property of the fitted distributor, and no allocation
    // moves it — from either surface.
    expect(after[0][1]).toBe(before[0][1]);
  });

  test('draws three lines to a bank where five columns do not fit', async ({ page }) => {
    await openPower(page);

    const labels = page.locator('.distributor__label');
    if (!(await labels.first().isVisible())) {
      // The block has room for its five columns here, and the header row heads
      // them. Nothing to check: this journey is about what it does when it has
      // not.
      await expect(page.locator('.distributor thead th')).toHaveCount(5);
      return;
    }

    // Every field the table would have carried is still carried, each beside the
    // label that would have headed its column — the bank, its capacity, its
    // rated recharge, its pips and its recharge at the allocation standing.
    const banks = page.locator('.distributor tbody tr');
    await expect(banks).toHaveCount(3);
    for (let index = 0; index < 3; index += 1) {
      const bank = banks.nth(index);
      await expect(bank.locator('.distributor__label')).toHaveCount(2);
      await expect(bank.locator('.distributor__cell--capacity')).toHaveCount(1);
      await expect(bank.locator('.distributor__cell--rated')).toHaveCount(1);
      await expect(bank.locator('.distributor__cell--recharge')).toHaveCount(1);
      await expect(bank.locator('.pips__step')).toHaveCount(4);
    }

    // And it is still a table to a reader: the columns are an arrangement, not
    // the association between a figure and what it is a figure of.
    await expect(page.locator('.distributor')).toHaveAttribute('role', 'table');
    await expect(page.locator('.distributor tbody th[role="rowheader"]')).toHaveCount(3);
  });

  test('redraws from an allocation the distributor table set', async ({ page }) => {
    await openPower(page);
    const rail = page.locator('edsb-power-summary .pipset').first().locator('.pips');
    const standing = await rail.getAttribute('aria-label');

    // The reverse direction. Both surfaces call the same action, so neither can
    // hold a reading the other does not have.
    await pressPip(
      page,
      page.locator('.distributor tbody tr').first().locator('.pips__step').nth(3),
    );

    await expect(rail).not.toHaveAttribute('aria-label', standing ?? '');
  });

  test('is on screen in every anatomy mode, which is why it is here', async ({ page }) => {
    await openPower(page);
    await expect(page.locator('edsb-power-summary .pipset')).toHaveCount(3);

    // The distributor table is only in `POWER`; the rail is everywhere. Leaving
    // the mode must not take the control with it.
    await page
      .locator('edsb-hull-anatomy .anatomy__modes button')
      .filter({ hasText: englishMessages['anatomy.mode.mounts'] })
      .click();

    await expect(page.locator('edsb-power-thermals .power')).toHaveCount(0);
    await expect(page.locator('edsb-power-summary .pipset')).toHaveCount(3);
  });

  test('holds the target floor on every block, at this project’s layout', async ({ page }) => {
    await openPower(page);

    // Counted before it is measured. `expectTargetSizes` asserts that nothing
    // it found is undersized, which a selector matching nothing satisfies just
    // as well — so without this the sweep would go green on a rail that drew no
    // control at all.
    await expect(page.locator('edsb-power-summary .pips__step')).toHaveCount(12);

    // Each project in the matrix is one of the five layout profiles, so this
    // measures the twelve blocks at all of them across the run. A pip block is
    // one of a row of four chips — the canvas draws it at 14 CSS pixels square
    // — so it is held to SC 2.5.8's 24-pixel floor rather than to the project's
    // stricter 44, which is what `DENSE_TARGETS` records. The distributor
    // cell's blocks hold the same size, and the sweep below measures those.
    await expectTargetSizes(page, 'edsb-power-summary .pips__step');
    await expectTargetSizes(page, 'edsb-power-thermals .pips__step');
  });

  test('offers no draft, no running total and no half-pip block', async ({ page }) => {
    await openPower(page);

    const block = page.locator('edsb-power-summary');
    await expect(block).not.toContainText('Apply');
    await expect(block).not.toContainText('Reset');
    // Four blocks a bank and no more: a fifth for none, or a half-pip block,
    // would be a control the canvas does not draw.
    await expect(block.locator('.pipset').first().locator('.pips__step')).toHaveCount(4);
  });

  test('stands on the same inset as the cells it heads', async ({ page }) => {
    await openPower(page);
    await revealStatusRail(page);

    // Canvas 1c draws this block and the six metric cells under it inside one
    // padded block, which the workspace owns. So the figures start where the
    // cells start: an inset of this block's own would be a second one inside
    // that padding, and the reading would stand further in than the cells it
    // heads (`specs/003-ship-statistics/design/status-rail.md`, "Items 3 to 5
    // are one block").
    const line = page.locator('edsb-power-summary .rail-power');
    const cells = page.locator('.outfitting__status-cells .metric');
    await expect(line).toBeVisible();

    if ((await cells.count()) === 0) {
      // Canvas 1d draws the same six readings above the category tabs instead,
      // so the rail has no cell band at this width and there is nothing here for
      // the block to head. What the claim reduces to is the same one either way:
      // the block stands on the rail's own inset and adds none of its own, which
      // is the inset the heading above it stands on.
      const [start, headStart] = await line.evaluate((node) => [
        (node as HTMLElement).getBoundingClientRect().left,
        document.querySelector('.outfitting__status-heading')?.getBoundingClientRect().left ?? -1,
      ]);
      expect(Math.round(start)).toBe(Math.round(headStart));
      return;
    }

    await expect(cells).toHaveCount(6);

    // The leading edge of the grid, not of its first cell in DOM order: the
    // cells are two to a row, so mirrored the first of them is the one in the
    // trailing column and its own edge is a column in from the block's.
    // Both edges are read in the page, in one call: mixing Playwright's own
    // box with an in-page rect would round two independently-derived numbers
    // and leave a sub-pixel difference to land on.
    const [lineStart, gridStart] = await line.evaluate((node, selector) => {
      const cellStarts = [...document.querySelectorAll(selector)].map(
        (cell) => cell.getBoundingClientRect().left,
      );
      return [(node as HTMLElement).getBoundingClientRect().left, Math.min(...cellStarts)];
    }, '.outfitting__status-cells .metric');

    expect(Math.round(lineStart)).toBe(Math.round(gridStart));
  });
});

test.describe('the conditions that break layouts', () => {
  test('lays the four blocks out in two rows of the same width, whatever it has', async ({
    page,
  }) => {
    await openPower(page);

    // The reference draws the dashboard as two rows of two — the groups beside
    // the module list, the heat profile beside the distributor — and stacks all
    // four where there is no room for that. Whichever it picks, it picks it for
    // both rows: this counts the columns each pair is drawn in and compares
    // them, so a lower pair left running the full width under a paired upper
    // one fails at every profile wide enough to pair anything. That is what
    // stood the distributor a whole panel below the fold of a region bounded by
    // the column it sits in.
    // The distributor is a component of its own — its five columns needed more
    // stylesheet than the panel's budget allowed — so the fourth block carries
    // that component's class rather than the panel's (`distributor-block`).
    const columns = await page
      .locator('edsb-power-thermals .power__block, edsb-power-thermals edsb-distributor-block')
      .evaluateAll((blocks) =>
        blocks.map((block) => Math.round(block.getBoundingClientRect().left)),
      );

    expect(columns).toHaveLength(4);
    expect(new Set(columns.slice(2)).size).toBe(new Set(columns.slice(0, 2)).size);
  });

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
    expect(banks[0][1]).toMatch(/MW$/u);
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

  test('holds a drawn gloss inside the page at a doubled text size and mirrored', async ({
    page,
  }) => {
    // The bubble is capped against the viewport and hung off the leading edge
    // of its trigger, and both of those are the kind of measurement a text
    // scale or a mirrored direction breaks. Neither is exercised by the tip
    // being closed, so each is checked with one open.
    await withRootTextScale(page, DOUBLED_TEXT);
    await openPower(page);

    const trigger = page.locator('.power__block--heat .heat__description button').first();
    await trigger.hover();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expectNoDocumentOverflow(page);

    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    await settled(page);
    await page.mouse.move(0, 0);
    await trigger.hover();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expectNoDocumentOverflow(page);
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
