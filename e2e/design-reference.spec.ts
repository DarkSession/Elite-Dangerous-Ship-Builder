import { expect, test, type Locator, type Page } from '@playwright/test';
import { buildStockHull, openFirstHullFromManifest, reachShellLink } from './shell';

/**
 * The interface still looks like the reference canvas.
 *
 * `scripts/check-interface-foundations.mjs` proves no component holds a visual
 * literal. It cannot prove the token layer holds the *right* values, and it
 * cannot prove a component composes them into the arrangement the reference
 * draws — a system of perfectly tokenised generic scales passes it completely.
 * That is exactly how this feature first shipped: the palette was taken from
 * `.design/Ship Builder.dc.html` and every other scale was invented beside it,
 * so the product used the reference's colours and none of its identity.
 *
 * So this suite reads what the browser actually computes and compares it with
 * what canvas 1a–1d actually sets. The values below are measurements, recorded
 * in `specs/011-interface-foundations/design/canvas-extraction.md`; each one is
 * cited where it is asserted.
 *
 * Where a value is deliberately not the canvas's, the assertion says so and
 * says why. There is one such family: the type ramp is lifted uniformly by
 * ~1.25× so its smallest rung is 11px rather than 7.5px, which is why sizes are
 * asserted as ratios and floors rather than as the canvas's own pixel values.
 */

/** The canvas `:root` colours these assertions refer to, as the browser reports them. */
const AMBER = 'rgb(255, 140, 26)';
const AMBER_3 = 'rgb(255, 176, 96)';
const PANEL_4 = 'rgb(22, 22, 21)';

/** One computed property of one element. */
async function style(target: Locator, property: string): Promise<string> {
  return await target.evaluate(
    (element, name) => getComputedStyle(element).getPropertyValue(name),
    property,
  );
}

/** Every computed font-size on the page, in CSS pixels. */
async function fontSizes(page: Page): Promise<number[]> {
  return await page.evaluate(() =>
    [...document.querySelectorAll('body *')]
      .filter((element) => (element as HTMLElement).offsetParent !== null)
      .map((element) => parseFloat(getComputedStyle(element).fontSize))
      .filter((size) => Number.isFinite(size)),
  );
}

test.describe('the reference visual language', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ships');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('closes the command bar with the heavy amber rule', async ({ page }) => {
    // Canvas 1a/1b/1c: `background: var(--panel-4)`, `border-bottom: 2px solid
    // var(--amber)`. The rule is the single strongest mark in the reference and
    // is the same on all four canvases.
    //
    // The command bar, not the banner: the banner is the one plate and carries
    // the tool deck as well, and the rule closes the plate at the foot of the
    // command deck rather than around the pair.
    const bar = page.locator('.frame__bar');

    expect(await style(bar, 'background-color')).toBe(PANEL_4);
    expect(await style(bar, 'border-bottom-width')).toBe('2px');
    expect(await style(bar, 'border-bottom-color')).toBe(AMBER);

    // And it closes the whole plate. The rule is the strongest mark in the
    // reference and the canvas runs it edge to edge, outside the inset the
    // decks are drawn on; a deck that began after the insignia would stop it
    // short of the leading edge with the mark sitting over the gap.
    const spans = await page.evaluate(() => {
      const banner = (
        document.querySelector('.frame__banner') as HTMLElement
      ).getBoundingClientRect();
      const deck = (document.querySelector('.frame__bar') as HTMLElement).getBoundingClientRect();
      return { start: deck.left - banner.left, end: banner.right - deck.right };
    });

    expect(spans).toEqual({ start: 0, end: 0 });
  });

  test("draws the tool deck on the command bar's own plate", async ({ page }) => {
    // Canvas 4c draws one bar: the tabs and the identity are two decks of a
    // single `--panel-4` plate, divided by a hairline that runs the length of
    // what the decks hold (`canvas-extraction.md`, "Tool bar").
    const plate = await page.evaluate(() => {
      const deck = document.querySelector('.frame__tools') as HTMLElement;
      const bar = document.querySelector('.frame__bar') as HTMLElement;
      const deckStyle = getComputedStyle(deck);
      const divider = getComputedStyle(bar, '::before');
      const deckBox = deck.getBoundingClientRect();
      const barBox = bar.getBoundingClientRect();
      const indent = parseFloat(getComputedStyle(bar).paddingInlineStart);
      const trailing = parseFloat(getComputedStyle(bar).paddingInlineEnd);
      return {
        // Transparent, so what shows through is the banner's own plate.
        deckGround: deckStyle.backgroundColor,
        bannerGround: getComputedStyle(deck.parentElement as HTMLElement).backgroundColor,
        deckRule: parseFloat(deckStyle.borderBlockEndWidth),
        // The divider is placed on the lower deck rather than added to its box,
        // so the deck is the height it is drawn at.
        dividerHeight: parseFloat(divider.blockSize),
        dividerColour: divider.backgroundColor,
        // It sits where the decks meet, and runs from the indent the mark is
        // cleared by to the plate's trailing inset.
        dividerTop: parseFloat(divider.insetBlockStart),
        dividerStart: parseFloat(divider.insetInlineStart),
        dividerEnd: parseFloat(divider.insetInlineEnd),
        indent,
        trailing,
        // The decks share one indent and one plate.
        deckStart: deckBox.left,
        barStart: barBox.left,
      };
    });

    expect(plate.deckGround).toBe('rgba(0, 0, 0, 0)');
    expect(plate.bannerGround).toBe(PANEL_4);
    expect(plate.deckRule).toBe(0);
    expect(plate.dividerHeight).toBe(1);
    expect(plate.dividerColour).toMatch(/rgba\(255, 140, 26/);
    expect(plate.dividerTop).toBe(0);
    expect(plate.dividerStart).toBe(plate.indent);
    expect(plate.dividerEnd).toBe(plate.trailing);
    expect(plate.deckStart).toBe(plate.barStart);
  });

  test('centres the insignia across both decks of the bar', async ({ page }) => {
    // Canvas 4c puts one mark on the leading edge of the plate, centred on the
    // pair, with both decks indented past it. The shipyard draws the mark as a
    // bare span; either way it is the banner's own child rather than a part of
    // one deck (`application-shell.md`, "The tool bar").
    const placed = await page.evaluate(() => {
      const banner = document.querySelector('.frame__banner') as HTMLElement;
      const mark = banner.querySelector(':scope > .frame__flag, :scope > .frame__flag-home');
      if (!mark) {
        return null;
      }
      const box = mark.getBoundingClientRect();
      const tools = document.querySelector('.frame__tools') as HTMLElement;
      const deck = tools.getBoundingClientRect();
      const bar = (document.querySelector('.frame__bar') as HTMLElement).getBoundingClientRect();
      return {
        // Centred on the pair, not on either deck.
        offset: (box.top + box.bottom) / 2 - (deck.top + bar.bottom) / 2,
        // And what the deck holds starts after it, which is the indent the
        // canvas draws rather than the deck's own box edge.
        clear: deck.left + parseFloat(getComputedStyle(tools).paddingInlineStart) - box.right,
      };
    });

    expect(placed).not.toBeNull();
    expect(Math.abs(placed?.offset ?? Infinity)).toBeLessThanOrEqual(1);
    expect(placed?.clear ?? 0).toBeGreaterThan(0);
  });

  test('leaves the whole of the way home pressable', async ({ page }) => {
    // The mark stands over the decks rather than beside them, and the press box
    // around it overhangs into the plate's gutter. A deck painted over that
    // overhang would leave the link a 35px target while its own box still
    // measured 44 — which is what every other target assertion here reads
    // (`application-shell.md`, "The bar's leading edge"; 011/FR-012).
    await page.goto('/ships/Anaconda');
    await buildStockHull(page, 'Build');
    await expect(page.locator('[data-slot-key]').first()).toBeVisible();

    const covered = await page.locator('.frame__flag-home').evaluate((link) => {
      const box = link.getBoundingClientRect();
      const points = [0.02, 0.5, 0.98].flatMap((x) =>
        [0.02, 0.5, 0.98].map((y) => [box.left + box.width * x, box.top + box.height * y]),
      );
      return points.filter(([x, y]) => !link.contains(document.elementFromPoint(x!, y!))).length;
    });

    expect(covered).toBe(0);
  });

  test('carries the current tool in the accent wash, closed by the canvas underline', async ({
    page,
  }) => {
    // Canvas 4c: the tool a Commander is in takes an `--amber-a14` wash and a
    // `2px solid var(--amber)` underline, and the tab is the height of the deck
    // so that underline sits on the deck's own edge. A tab short of the deck
    // floats the underline above the divider it is meant to meet
    // (`canvas-extraction.md`, "Tool bar").
    const current = page.locator('.frame__tool--current');

    expect(await style(current, 'background-color')).toMatch(/^rgba\(255, 140, 26/);
    expect(await style(current, 'color')).toBe(AMBER_3);
    expect(await style(current, 'border-bottom-width')).toBe('2px');
    expect(await style(current, 'border-bottom-color')).toBe(AMBER);

    // The gap between the tab's underline and the deck's own edge, read in one
    // evaluation so both boxes describe the same moment.
    const met = await page.evaluate(() => {
      const deck = document.querySelector('.frame__tools') as HTMLElement;
      const tab = deck.querySelector('.frame__tool--current') as HTMLElement;
      return deck.getBoundingClientRect().bottom - tab.getBoundingClientRect().bottom;
    });

    expect(Math.abs(met)).toBeLessThanOrEqual(1);
  });

  test('opens the command bar with the amber wedge insignia', async ({ page }) => {
    // The resynced canvases replaced the plain amber block that opened the bar
    // with the wedge the app icon is cut from (canvas 3b): a clipped outline
    // closed by a lighter bar. Both are cut into the flag's own layers rather
    // than painted on its box, because an amber ground on the box would draw
    // an amber rectangle behind the mark rather than the mark
    // (`canvas-extraction.md`, "Command bar").
    const flag = page.locator('.frame__flag');

    const mark = await flag.evaluate((element) => {
      const wedge = getComputedStyle(element, '::before');
      const underbar = getComputedStyle(element, '::after');
      const box = getComputedStyle(element);
      return {
        wedge: wedge.backgroundColor,
        clip: wedge.clipPath,
        underbar: underbar.backgroundColor,
        width: parseFloat(box.inlineSize),
        height: parseFloat(box.blockSize),
      };
    });

    expect(mark.wedge).toBe(AMBER);
    // The mark is the clip, not the box. A wedge that lost its `clip-path`
    // would still be an amber rectangle of the right size and would pass every
    // other assertion here.
    expect(mark.clip).toMatch(/^polygon\(/);
    // The bar the canvas closes the mark with, in a wash of the same amber.
    expect(mark.underbar).toMatch(/^rgba\(255, 140, 26/);

    // `26 x 23`: the size canvas 3b draws the mark, near enough square.
    expect(mark.width).toBeGreaterThan(0);
    expect(Math.abs(mark.width - mark.height)).toBeLessThanOrEqual(4);
  });

  test('draws the insignia at one size whether or not it is the way home', async ({ page }) => {
    // The shipyard draws the mark as decoration; every other screen makes it
    // the way home, which is a control and is held to the 44px press baseline.
    // The baseline is paid by a box around the mark, so the mark is the size
    // canvas 3b draws it on both — a mark that took the target's own box would
    // be drawn half as large again on a build as on the shipyard
    // (`canvas-extraction.md`, "Command bar"; Commander request 2026-08-28).
    // Measured against the token the canvas's figure lives in rather than
    // against the other screen alone: a mark that grew on both would still
    // match itself.
    const measure = async () =>
      await page.locator('.frame__flag').evaluate((element) => {
        const box = element.getBoundingClientRect();
        // A custom property resolves as it was written, so the canvas's figure
        // comes back in `rem` and is turned into the pixels the box is
        // measured in.
        const root = getComputedStyle(document.documentElement);
        const rem = parseFloat(root.fontSize);
        const declared = (name: string): number => {
          const value = root.getPropertyValue(name).trim();
          return parseFloat(value) * (value.endsWith('rem') ? rem : 1);
        };
        return {
          width: box.width,
          height: box.height,
          declaredWidth: declared('--ednb-layout-insignia-width'),
          declaredHeight: declared('--ednb-layout-insignia-height'),
        };
      });

    const shipyard = await measure();
    expect(shipyard.width).toBe(shipyard.declaredWidth);
    expect(shipyard.height).toBe(shipyard.declaredHeight);
    expect(await page.locator('.frame__flag-home').count()).toBe(0);

    await page.goto('/ships/Anaconda');
    await buildStockHull(page, 'Build');
    await expect(page.locator('[data-slot-key]').first()).toBeVisible();

    const home = page.locator('.frame__flag-home');
    await expect(home).toHaveCount(1);
    expect(await measure()).toEqual(shipyard);

    // And the press around it is the baseline, which is the whole reason the
    // two are separate boxes.
    const target = await home.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return { width: box.width, height: box.height };
    });
    expect(target.width).toBeGreaterThanOrEqual(44);
    expect(target.height).toBeGreaterThanOrEqual(44);
  });

  test('sizes the command bar to the tallest identity it carries', async ({ page }) => {
    // The bar is drawn at one height, and the height is the workspace's
    // two-line build identity rather than the single row of controls every
    // other screen comes to. Sized to that row the bar was 66px on the
    // shipyard and 74px on a build, and the whole page under it moved as a
    // Commander opened one (`canvas-extraction.md`, "One bar height, on every
    // screen"; Commander request 2026-08-28).
    //
    // The bar carries its widest set on the workspace, and below the width
    // that set needs it folds into the named menu rather than wrapping, so
    // this holds at every layout profile and in both shipped languages. The
    // wrap is still measured rather than assumed: at a doubled text size and
    // at 400% zoom the bar does wrap, and it has to, or its own controls would
    // be cut off (011/FR-011).
    // Measured on the command bar itself. The banner around it is the two-deck
    // sticky region, and the height this test is about is the one the command
    // deck is drawn at.
    const commandBar = page.locator('.frame__bar');
    const bar = async () =>
      await commandBar.evaluate((node) => {
        const style = getComputedStyle(node);
        const box = node.getBoundingClientRect();
        const groups = [...node.children]
          .filter((child) => getComputedStyle(child).display !== 'none')
          .map((child) => child.getBoundingClientRect());
        // Whether the groups wrapped, read as the band they span against the
        // tallest of them. Their `top` values differ on one row as well —
        // the bar centres a 23px identity beside a 44px control — so a count
        // of distinct tops would report every bar as wrapped.
        const spanned =
          Math.max(...groups.map((group) => group.bottom)) -
          Math.min(...groups.map((group) => group.top));
        const tallest = Math.max(...groups.map((group) => group.height));
        return {
          drawn: box.height,
          floor: parseFloat(style.minBlockSize),
          // What the bar spends on itself, which the identity inside it does
          // not get: its own block padding and the amber rule that closes it.
          chrome:
            parseFloat(style.paddingBlockStart) +
            parseFloat(style.paddingBlockEnd) +
            parseFloat(style.borderBlockEndWidth),
          wrapped: spanned > tallest + 1,
        };
      });

    // A plain title is exactly the floor, at every width. This is the half
    // that was 66px.
    const shipyard = await bar();
    expect(shipyard.wrapped).toBe(false);
    expect(shipyard.drawn).toBe(shipyard.floor);

    await page.goto('/ships/Anaconda');
    await buildStockHull(page, 'Build');
    await expect(page.locator('[data-slot-key]').first()).toBeVisible();

    // The tallest identity fits inside the same floor, so the bar never grows
    // because a screen's own identity would not fit in it.
    const workspace = await bar();
    const identity = await page
      .locator('.frame__identity')
      .evaluate((node) => node.getBoundingClientRect().height);

    expect(identity + workspace.chrome).toBeLessThanOrEqual(workspace.floor);

    // And where the bar's controls fit on one row, opening a build moves
    // nothing: the same bar, at the same height, over the same page.
    if (!workspace.wrapped) {
      expect(workspace.drawn).toBe(shipyard.drawn);
      return;
    }

    // Where they do not, the bar is taller for the one reason a bar may be:
    // its own controls took another row, which is the enlarged-text case this
    // profile does not run at.
    expect(workspace.drawn).toBeGreaterThan(shipyard.drawn);
  });

  test('sets every heading in tracked uppercase condensed', async ({ page }) => {
    // Canvas: every heading and every control label is 'Barlow Condensed',
    // uppercase, tracked between 0.07em and 0.26em. Nothing in the reference is
    // a heading in the body face.
    const heading = page.getByRole('heading', { level: 1 });

    expect(await style(heading, 'font-family')).toContain('Barlow Condensed');
    expect(await style(heading, 'text-transform')).toBe('uppercase');

    const size = parseFloat(await style(heading, 'font-size'));
    const tracking = parseFloat(await style(heading, 'letter-spacing'));
    // Canvas 1a sets the command bar's title at 0.26em and canvas 1b, where
    // there is less room for it, at 0.22em. Both are steps on the same ladder.
    expect([0.26, 0.22].some((step) => Math.abs(tracking / size - step) < 0.005)).toBe(true);
  });

  test('sets every number and micro-label in monospace', async ({ page }) => {
    // Canvas: 'JetBrains Mono' carries every number, unit, count and code. The
    // hull count beside the screen title in the command bar is one of them.
    const count = page.locator('.frame__count');

    expect(await style(count, 'font-family')).toContain('JetBrains Mono');
    expect(await style(count, 'text-transform')).toBe('uppercase');
  });

  test('opens every record with a marker that only the current one fills', async ({ page }) => {
    // Canvas 1a/1b: `border-left: 3px solid transparent`, taking `var(--amber)`
    // on the selected record. Every record reserves it, so nothing shifts when
    // the selection moves.
    //
    // The manifest and the card list are two renderings of one list and exactly
    // one is on screen, so the marker is looked for wherever this width puts
    // it: on a row's first cell, or on the card itself.
    const marker = page
      .locator('tbody tr:visible > :first-child')
      .or(page.locator('.hull-card:visible'))
      .first();
    await expect(marker).toBeVisible();

    expect(await style(marker, 'border-left-width')).toBe('3px');
    expect(await style(marker, 'border-left-color')).toBe('rgba(0, 0, 0, 0)');
  });

  test('leaves every product surface square', async ({ page }) => {
    // Canvas 1a–1d contain no `border-radius` on any product surface. The only
    // rounded corners in the file belong to the design viewer's own chrome.
    const rounded = await page.evaluate(() =>
      [...document.querySelectorAll('body *')]
        .filter((element) => (element as HTMLElement).offsetParent !== null)
        .filter((element) => {
          const radius = getComputedStyle(element).borderRadius;
          return radius !== '' && radius !== '0px';
        })
        .map((element) => `${element.tagName.toLowerCase()}.${element.className}`)
        .slice(0, 10),
    );

    expect(rounded, 'a product surface is rounded; the reference is square').toEqual([]);
  });

  test('never renders text below the canvas ramp floor', async ({ page }) => {
    // The canvas ramp starts at 7.5px and is taken at 1:1: `micro` is 9px, which
    // covers the canvas's 7.5–9.5 rung and is the smallest step the system
    // offers. This once pinned an 11px floor, from a uniform ~1.25 lift over the
    // canvas — the lift is gone, because the design's sizes are as much the
    // design as its ratios are (wave 9).
    const sizes = await fontSizes(page);

    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(9);
  });

  test('fills the selected segment and quiets the rest', async ({ page }) => {
    // Canvas 1a/1b: the selected segment is `background: var(--amber)` with
    // `color: var(--bg)`; the rest are `var(--panel-3)`. The gaps between them
    // are one pixel of amber ground rather than borders.
    const large = page.getByRole('radio', { name: 'Large' });
    const label = page.locator(`label[for="${await large.getAttribute('id')}"]`);

    expect(await style(label, 'background-color')).not.toBe(AMBER);
    await large.check();
    await expect(large).toBeChecked();
    expect(await style(label, 'background-color')).toBe(AMBER);
  });

  // Canvas 1a draws the rail only with a hull in it: with none chosen there is
  // no ground and no hairline. The track it will occupy is reserved anyway, so
  // opening the first hull does not reflow the manifest under the cursor.
  test('draws nothing of the inspector until a hull is chosen, but keeps its track', async ({
    page,
  }) => {
    const rail = page.locator('.catalogue__inspector');
    const manifest = page.locator('.catalogue__manifest-region');
    await expect(rail).toBeHidden();

    const before = await manifest.boundingBox();
    expect(before, 'the manifest did not render').not.toBeNull();

    await openFirstHullFromManifest(page);
    await expect(rail).toBeVisible();

    // Below the rail width there is no second track and nothing to reserve;
    // the measurement is the same either way, because the manifest region keeps
    // the width it had.
    const after = await manifest.boundingBox();
    expect(after?.width).toBeCloseTo(before?.width ?? 0, 0);
  });

  test('sets the inspector name large in tracked amber over a monospace line', async ({ page }) => {
    // Canvas 1a: `font: 700 22px 'Barlow Condensed'`, `letter-spacing: .08em`,
    // `color: var(--amber-3)`, over the manufacturer and landing pad in mono.
    await openFirstHullFromManifest(page);

    const name = page.locator('.detail__name');
    await expect(name).toBeVisible();

    expect(await style(name, 'font-family')).toContain('Barlow Condensed');
    expect(await style(name, 'color')).toBe(AMBER_3);
    expect(await style(name, 'text-transform')).toBe('uppercase');
  });

  test('rules the metric grid with its gaps rather than with borders', async ({ page }) => {
    // Canvas 1a/1b: `display: grid; gap: 1px; background: var(--amber-a14)`
    // with each cell on `var(--panel-3)` — the amber ground showing through the
    // gaps is what draws the rules.
    await openFirstHullFromManifest(page);

    const grid = page.locator('.metric-group').first();
    await expect(grid).toBeVisible();

    expect(await style(grid, 'display')).toBe('grid');
    expect(await style(grid, 'row-gap')).toBe('1px');
    expect(await style(grid, 'background-color')).toBe('rgba(255, 140, 26, 0.14)');
  });
});

test.describe('the wide manifest', () => {
  // The column-header row exists only in the wide composition, so it is
  // asserted at a width that has one rather than at whichever width the project
  // happens to run. Every project still runs it: what the reference sets for a
  // manifest header does not change with the engine.
  test.use({ viewport: { width: 1320, height: 900 } });

  test('sets the column headers as tracked monospace over one rule', async ({ page }) => {
    // Canvas 1a: `font: 500 9px 'JetBrains Mono'`, `letter-spacing: .16em`,
    // over `border-bottom: 1px solid var(--amber-a16)`.
    await page.goto('/ships');
    const header = page.locator('thead th').first();
    await expect(header).toBeVisible();

    expect(await style(header, 'font-family')).toContain('JetBrains Mono');
    expect(await style(header, 'font-weight')).toBe('500');
    const size = parseFloat(await style(header, 'font-size'));
    expect(parseFloat(await style(header, 'letter-spacing')) / size).toBeCloseTo(0.16, 2);
    expect(await style(header, 'border-bottom-width')).toBe('1px');

    // The canvas writes the headers in capitals. They are sort controls, and no
    // engine inherits `text-transform` into a control on its own, so the words
    // reach the screen as capitals only because the base reset says they do.
    const sort = page.locator('.catalogue__sort').first();
    expect(await style(sort, 'text-transform')).toBe('uppercase');
    expect(await sort.evaluate((element: HTMLElement) => element.innerText)).toMatch(/^SHIP/);
  });

  test('marks the column the manifest is ordered by with amber and a caret', async ({ page }) => {
    // Canvas 1a `paintSort`: the active header takes `#ffb060` and a `▲`/`▼`
    // caret. The caret is decoration; `aria-sort` carries the same fact.
    await page.goto('/ships');
    const sorted = page.locator('thead th[aria-sort]');
    await expect(sorted).toHaveCount(1);

    expect(await style(sorted, 'color')).toBe(AMBER_3);
    await expect(sorted.locator('.catalogue__caret')).toHaveText(/[▲▼]/);
    await expect(sorted.locator('.catalogue__caret')).toHaveAttribute('aria-hidden', 'true');
  });

  test('sets the mount mix and the price against the trailing edge', async ({ page }) => {
    // Canvas 1a: `text-align: right` on the hardpoint and price columns, so a
    // digit lines up with the digit above it.
    await page.goto('/ships');
    const cells = page.locator('tbody tr').first().locator('td.catalogue__numeric');
    await expect(cells).toHaveCount(2);

    for (const cell of await cells.all()) {
      expect(await style(cell, 'text-align')).toBe('end');
    }
  });

  test('keeps the search, the size strip and the column headers in place', async ({ page }) => {
    // Not measured off an artboard: 48 hulls are several screenfuls, and a
    // figure whose column has scrolled away is a figure a Commander cannot
    // read. The offsets are derived from the bar and the toolbar, so the
    // assertion is that nothing ends up behind anything else.
    await page.goto('/ships');
    const header = page.locator('thead th').first();
    const toolbar = page.locator('edsb-collection-toolbar');
    await expect(header).toBeVisible();
    const resting = (await header.boundingBox())!;

    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(200);

    const bar = (await page.locator('.frame__banner').boundingBox())!;
    const strip = (await toolbar.boundingBox())!;
    const columns = (await header.boundingBox())!;

    expect(bar.y).toBeCloseTo(0, 0);
    expect(strip.y).toBeGreaterThanOrEqual(bar.y + bar.height - 1);
    expect(columns.y).toBeGreaterThanOrEqual(strip.y + strip.height - 1);
    await expect(header).toBeInViewport();
    // Freezing is not the same as staying put: the row gap the table draws
    // above its header rested it below where it freezes, and it hopped that far
    // up on the first scroll.
    expect(columns.y).toBeCloseTo(resting.y, 0);
  });

  // Canvas 1a draws the rail as a column of its own ground running from the
  // command bar's rule down. A column does not slide: it starts where it
  // freezes, so the first turn of the wheel moves the manifest and nothing else.
  test('holds the inspector rail still while the manifest scrolls', async ({ page }) => {
    await page.goto('/ships/Anaconda');
    const rail = page.locator('.catalogue__inspector');
    await expect(rail).toBeVisible();
    const resting = (await rail.boundingBox())!;

    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(200);

    expect((await rail.boundingBox())!.y).toBeCloseTo(resting.y, 0);
  });

  // Canvas 1a draws the manifest as a grid with one track list:
  // `22px 2.1fr 1.5fr 56px 104px 96px`, the same for the headers and for every
  // row. Narrowing the list must not re-measure it.
  test('holds the column track list while the manifest is narrowed', async ({ page }) => {
    await page.goto('/ships');
    await expect(page.locator('thead th').first()).toBeVisible();
    const widths = () =>
      page
        .locator('thead th')
        .evaluateAll((cells) =>
          cells.map((cell) => Math.round(cell.getBoundingClientRect().width)),
        );

    const before = await widths();
    expect(before).toHaveLength(6);

    await page.getByRole('searchbox', { name: 'Search ships or manufacturers' }).fill('federal');
    await expect(page.locator('[data-hull-symbol]:visible')).not.toHaveCount(48);
    expect(await widths()).toEqual(before);

    await page.getByRole('radio', { name: 'Large' }).check();
    expect(await widths()).toEqual(before);
  });

  // Canvas 1a: `padding: 12px` around a 16px name, so a row is a little over
  // forty pixels tall and every row is the same.
  test('sets every row to one height, close to the reference row', async ({ page }) => {
    await page.goto('/ships');
    await expect(page.locator('tbody tr').first()).toBeVisible();
    const heights = await page
      .locator('tbody tr')
      .evaluateAll((rows) => [
        ...new Set(rows.map((row) => Math.round(row.getBoundingClientRect().height))),
      ]);

    expect(heights).toHaveLength(1);
    expect(heights[0]).toBeLessThanOrEqual(48);
  });

  test('keeps the inspector with the hull it describes', async ({ page }) => {
    await page.goto('/ships/Anaconda');
    const rail = page.locator('.catalogue__inspector');
    await expect(rail).toBeVisible();

    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(200);

    await expect(page.locator('.detail__name')).toBeInViewport();
  });
});

test.describe('the saved-build surface', () => {
  // The framed modal exists in the wide composition, so it is asserted at a
  // width that draws one. Every project still runs it: what the reference sets
  // for this surface does not change with the engine.
  test.use({ viewport: { width: 1320, height: 900 } });

  /**
   * A build, and the library opened over the workspace holding it.
   *
   * Reached in the application rather than by address, because the marker names
   * the record the workspace is holding — and a cold load of `/builds` has no
   * workspace behind it and so, honestly, no current record.
   */
  async function withOneBuild(page: Page): Promise<void> {
    await page.goto('/ships/Anaconda');
    await buildStockHull(page, 'Build');
    // Waited for by the record itself rather than by the status line: autosave
    // coalesces, and a status still reading "ready" is a write that is owed
    // rather than one that failed.
    await expect
      .poll(
        () =>
          page.evaluate(
            () => Object.keys(localStorage).filter((key) => key.startsWith('edsb:record:')).length,
          ),
        { timeout: 10_000 },
      )
      .toBe(1);
    await reachShellLink(page, 'Open saved build');
    await expect(page.locator('[data-record-id]').first()).toBeVisible();
  }

  /** The library's own framed layer, of the several a page may hold. */
  const surface = (page: Page) => page.getByRole('dialog', { name: 'Saved builds' });

  test('frames the library as a dialog with its own title bar', async ({ page }) => {
    // Canvas 1a: the saved-build list is a centred dialog on a near-opaque
    // scrim, opened by a darker title bar with the title tracked 0.22em and a
    // monospace dismiss beside it.
    await withOneBuild(page);
    const dialog = surface(page);
    await expect(dialog).toBeVisible();

    const title = dialog.locator('.layer__title').first();
    const size = parseFloat(await style(title, 'font-size'));
    expect(parseFloat(await style(title, 'letter-spacing')) / size).toBeGreaterThan(0.15);
    expect(await style(title, 'text-transform')).toBe('uppercase');
    expect(await style(dialog.locator('.layer__dismiss'), 'font-family')).toContain(
      'JetBrains Mono',
    );
  });

  test('draws the surface at the width the canvas sets, with nothing inset twice', async ({
    page,
  }) => {
    // Canvas 1a draws the saved-build modal at 860px, and runs every region in
    // it edge to edge: the hairline under the search, the plate the column
    // headers sit on and the footer's own plate all reach the panel's sides.
    await withOneBuild(page);
    const dialog = surface(page);

    const box = await dialog.boundingBox();
    expect(box?.width).toBeCloseTo(860, 0);

    const body = dialog.locator('.layer__body').first();
    expect(await style(body, 'padding-inline-start')).toBe('0px');
    const columns = page.locator('.records__columns');
    const columnsBox = await columns.boundingBox();
    // Inside the panel's own hairline, and nothing further.
    expect((columnsBox?.width ?? 0) + 2).toBeCloseTo(box?.width ?? 0, 0);
  });

  test('searches from a placeholder, with the count on the same line', async ({ page }) => {
    // Canvas 1a puts the search field's words in its placeholder and the count
    // in monospace beside it, on one row. The label stays a real one, bound to
    // the control and read aloud, because a placeholder goes as soon as
    // somebody types.
    await withOneBuild(page);

    const search = page.getByRole('searchbox', { name: 'Search saved builds' });
    await expect(search).toHaveAttribute('placeholder', 'Search saved builds');
    const label = await page.locator('.library__search .field__label').boundingBox();
    expect(label?.height ?? 0).toBeLessThanOrEqual(1);

    // One line: the field and the count share a horizontal band.
    const field = await search.boundingBox();
    const count = await page.locator('.library__count').boundingBox();
    expect(count?.y).toBeGreaterThan((field?.y ?? 0) - (field?.height ?? 0));
    expect(count?.y).toBeLessThan((field?.y ?? 0) + (field?.height ?? 0));
    await expect(page.locator('.library__count')).toHaveText('1 builds');
  });

  test('sets the record count and the column headers in tracked monospace', async ({ page }) => {
    // Canvas 1a's header row — a search field beside a monospace count — over
    // column headers on a slightly lighter plate.
    await withOneBuild(page);

    const count = page.locator('.library__count');
    await expect(count).toBeVisible();
    expect(await style(count, 'font-family')).toContain('JetBrains Mono');

    const header = page.locator('.records__columns span').first();
    await expect(header).toBeVisible();
    expect(await style(header, 'font-family')).toContain('JetBrains Mono');
    expect(await style(header, 'text-transform')).toBe('uppercase');
    const size = parseFloat(await style(header, 'font-size'));
    expect(parseFloat(await style(header, 'letter-spacing')) / size).toBeGreaterThan(0.1);
  });

  test('opens every row with a 3px marker and fills the current one amber', async ({ page }) => {
    // Canvas 1a: a 3px leading edge on every row, taking amber on the record
    // the workspace is holding.
    await withOneBuild(page);
    const current = page.locator('.record[aria-current="true"]').first();
    await expect(current).toBeVisible();

    expect(await style(current, 'border-inline-start-width')).toBe('3px');
    expect(await style(current, 'border-inline-start-color')).toBe(AMBER);
    // Never the only carrier: the row says so, and so does aria-current.
    await expect(current).toContainText('Current build');
  });

  test('commits from a footer, destructive first and opening last', async ({ page }) => {
    // Canvas 1a and 1b both close the surface with a committing footer: the
    // destructive action bordered warm on the leading edge, the opening action
    // filled amber on the trailing edge.
    await withOneBuild(page);
    const footer = page.locator('.library__footer');
    await expect(footer).toBeVisible();

    // Two, since 2026-08-27: the canvas draws no naming or duplicating here,
    // and both are reached from the save of the build in hand instead (FR-009).
    const labels = await footer.locator('button').allInnerTexts();
    expect(labels).toHaveLength(2);
    expect(labels[0]).toMatch(/^DELETE/i);
    expect(labels[labels.length - 1]).toMatch(/^OPEN/i);

    const open = footer.locator('button').last();
    expect(await style(open, 'background-color')).toBe(AMBER);
    const remove = footer.locator('button').first();
    expect(await style(remove, 'background-color')).toBe('rgba(0, 0, 0, 0)');
    expect(await style(remove, 'border-inline-start-width')).toBe('1px');
  });

  test('reacts to the pointer on the bar’s link exactly as it does on its buttons', async ({
    page,
  }) => {
    // A link and a button sitting in one command bar and reacting differently
    // to the pointer reads as one of them being inert, and the reference draws
    // no such distinction (Commander request 2026-08-27).
    //
    // Read out of the cascade rather than by putting a pointer on each control.
    // A headless engine has no input device, so a synthesised move never puts
    // an element into `:hover` at all — an assertion on the computed ground
    // would pass by reading the resting one. What both controls declare is the
    // claim, and it is the thing a regression would change.
    await page.goto('/ships/Anaconda');
    await buildStockHull(page, 'Build');
    await expect(
      page.getByRole('banner').getByRole('link', { name: 'Open saved build' }),
    ).toBeVisible();

    const hoverGrounds = await page.evaluate(() => {
      const declared: Record<string, string> = {};
      const walk = (rules: CSSRuleList) => {
        for (const rule of [...rules]) {
          const group = rule as CSSMediaRule;
          if (group.cssRules && group.conditionText !== undefined) {
            walk(group.cssRules);
            continue;
          }
          const styled = rule as CSSStyleRule;
          if (typeof styled.selectorText !== 'string' || !styled.selectorText.includes(':hover')) {
            continue;
          }
          const ground = styled.style.getPropertyValue('background-color');
          if (ground === '') {
            continue;
          }
          // The encapsulation attribute sits between the class and the
          // pseudo-class, so the class is matched on its own.
          if (/\.frame__navigation-link\[[^\]]*\]:hover$/.test(styled.selectorText)) {
            declared['link'] = ground;
          }
          if (/\.action-layer__link\[[^\]]*\]:hover$/.test(styled.selectorText)) {
            declared['foldedLink'] = ground;
          }
          if (/^\.action\[[^\]]*\]:hover/.test(styled.selectorText)) {
            declared['button'] = ground;
          }
        }
      };
      for (const sheet of [...document.styleSheets]) {
        try {
          walk(sheet.cssRules);
        } catch {
          // A stylesheet this document may not read is not one this application
          // wrote.
        }
      }
      return declared;
    });

    expect(hoverGrounds['button']).toBeTruthy();
    expect(hoverGrounds['link']).toBe(hoverGrounds['button']);
    // The same control in the folded bar's menu, which is where a Commander reaches
    // it at narrow widths and where the complaint was first made.
    expect(hoverGrounds['foldedLink']).toBe(hoverGrounds['button']);
  });
});

test.describe('the save-build surface', () => {
  // Canvas 1c draws it at 540px over the workspace, so it is asserted at a
  // width that draws the framed composition.
  test.use({ viewport: { width: 1320, height: 900 } });

  /**
   * A stock build, with canvas 1c's `SAVE BUILD` opened over it and named.
   *
   * Named, because the reference draws the commit filled: an unnamed build has
   * nothing to save under and the control is natively disabled, which is a
   * different thing for the canvas to draw.
   */
  async function withSaveOpen(page: Page): Promise<Locator> {
    await page.goto('/ships/Anaconda');
    await buildStockHull(page, 'Build');
    await page.getByRole('banner').getByRole('button', { name: 'Save' }).click();
    const layer = page.getByRole('dialog', { name: 'Save build' });
    await expect(layer).toBeVisible();
    await layer.getByRole('textbox', { name: 'Build name' }).fill('Anaconda explorer');
    return layer;
  }

  /**
   * The same layer over a build that was opened from a save.
   *
   * The modes are drawn only where both apply, so the state the canvas draws
   * them in is a build with something to replace: saved once, then reopened
   * from its own `SAVE`.
   */
  async function withBothModes(page: Page): Promise<Locator> {
    const first = await withSaveOpen(page);
    await first.getByRole('button', { name: 'Save build' }).click();
    await expect(first).toBeHidden();

    await page.getByRole('banner').getByRole('button', { name: 'Save' }).click();
    const layer = page.getByRole('dialog', { name: 'Save build' });
    await expect(layer.locator('.save__modes .choice')).toHaveCount(2);
    return layer;
  }

  test('titles the layer in tracked uppercase over a monospace dismiss', async ({ page }) => {
    const layer = await withSaveOpen(page);

    const title = layer.locator('.layer__title').first();
    const size = parseFloat(await style(title, 'font-size'));
    expect(parseFloat(await style(title, 'letter-spacing')) / size).toBeGreaterThan(0.15);
    expect(await style(title, 'text-transform')).toBe('uppercase');
    expect(await style(layer.locator('.layer__dismiss'), 'font-family')).toContain(
      'JetBrains Mono',
    );
  });

  test('draws the modes as bordered cards, washing and marking only the selected one', async ({
    page,
  }) => {
    // Canvas 1c: two bordered cards, each led by a 12px square, the selected
    // one washed amber with its square filled and the other left on the panel
    // ground with its square open.
    const layer = await withBothModes(page);
    const cards = layer.locator('.save__modes .choice');

    const chosen = cards.first();
    const other = cards.last();
    expect(await style(chosen, 'border-block-start-width')).toBe('1px');
    expect(await style(other, 'border-block-start-width')).toBe('1px');
    expect(await style(chosen, 'background-color')).not.toBe(
      await style(other, 'background-color'),
    );

    // The mark, on both cards and filled on one. A wash the eye reads as
    // selection is colour alone; the fill is what survives without it.
    const marks = layer.locator('.save__modes .choice__marker');
    await expect(marks).toHaveCount(2);
    expect(await style(marks.first(), 'background-color')).toBe(AMBER);
    expect(await style(marks.last(), 'background-color')).toBe('rgba(0, 0, 0, 0)');
    expect((await marks.first().boundingBox())?.width).toBeCloseTo(12, 0);

    // Beside the title, not above it. The card restates `display: grid` over
    // the shared plate's `flex` and leans on the base choice's own two tracks
    // for the columns, which is the sort of thing that keeps working until
    // somebody moves a declaration — so it is measured rather than assumed.
    const mark = await marks.first().boundingBox();
    const title = await cards.first().locator('.choice__label').boundingBox();
    expect(mark!.x + mark!.width).toBeLessThanOrEqual(title!.x + 1);
    expect(mark!.y).toBeLessThan(title!.y + title!.height);
    expect(title!.y).toBeLessThan(mark!.y + mark!.height);

    // The legend is read, not drawn: the canvas puts the cards straight under
    // the note field with no heading over them. Still in the accessibility
    // tree, so it takes a box of a pixel rather than none.
    const legend = await layer.locator('.choice-group__legend').boundingBox();
    expect(legend?.height ?? 0).toBeLessThanOrEqual(1);
  });

  test('draws no mode at all where there is nothing to replace', async ({ page }) => {
    // A choice of one is not a choice: a build that came from nowhere has one
    // thing SAVE BUILD can do, and the canvas draws the pair or neither.
    const layer = await withSaveOpen(page);

    await expect(layer.locator('.save__modes .choice')).toHaveCount(0);
  });

  test('closes the layer with a hairline over a monospace message line', async ({ page }) => {
    // Canvas 1c: a rule, then the message on the leading edge and the two
    // commitments on the trailing one, cancel bordered and save filled amber.
    const layer = await withSaveOpen(page);

    const footer = layer.locator('.save__footer');
    expect(await style(footer, 'border-block-start-width')).toBe('1px');
    expect(await style(layer.locator('.save__message'), 'font-family')).toContain('JetBrains Mono');

    const labels = await layer.locator('.save__actions button').allInnerTexts();
    expect(labels).toHaveLength(2);
    expect(labels[0]).toMatch(/^CANCEL/i);
    expect(labels[1]).toMatch(/^SAVE BUILD/i);

    // Polled, because the control fades from its disabled ground to the filled
    // one as the build takes a name.
    const commit = layer.locator('.save__actions button').last();
    await expect.poll(() => style(commit, 'background-color')).toBe(AMBER);
  });
});
