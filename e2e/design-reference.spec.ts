import { expect, test, type Locator, type Page } from '@playwright/test';

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
    const banner = page.getByRole('banner');

    expect(await style(banner, 'background-color')).toBe(PANEL_4);
    expect(await style(banner, 'border-bottom-width')).toBe('2px');
    expect(await style(banner, 'border-bottom-color')).toBe(AMBER);
  });

  test('opens the command bar with the solid amber flag', async ({ page }) => {
    // Canvas 1a: a 10 × 26px amber block before the title; canvas 1b: 8 × 22px.
    const flag = page.locator('.frame__flag');

    expect(await style(flag, 'background-color')).toBe(AMBER);
    const box = await flag.boundingBox();
    expect(box, 'the command flag is rendered').not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(box!.width);
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
    // 0.26em, the product title's step.
    expect(tracking / size).toBeCloseTo(0.26, 2);
  });

  test('sets every number and micro-label in monospace', async ({ page }) => {
    // Canvas: 'JetBrains Mono' carries every number, unit, count and code. The
    // hull count beside the screen title is one of them.
    const count = page.locator('.catalogue__total');

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

  test('never renders text below the lifted ramp floor', async ({ page }) => {
    // The one deliberate departure. The canvas ramp starts at 7.5px; it is
    // lifted uniformly so the smallest rung is 11px, which is what
    // `--edsb-type-size-micro` resolves to at a 16px root.
    const sizes = await fontSizes(page);

    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(11);
  });

  test('fills the selected segment and quiets the rest', async ({ page }) => {
    // Canvas 1a/1b: the selected segment is `background: var(--amber)` with
    // `color: var(--bg)`; the rest are `var(--panel-3)`. The gaps between them
    // are one pixel of amber ground rather than borders.
    const large = page.getByRole('checkbox', { name: 'Large' });
    const label = page.locator(`label[for="${await large.getAttribute('id')}"]`);

    expect(await style(label, 'background-color')).not.toBe(AMBER);
    await large.check();
    await expect(large).toBeChecked();
    expect(await style(label, 'background-color')).toBe(AMBER);
  });

  test('sets the inspector name large in tracked amber over a monospace line', async ({ page }) => {
    // Canvas 1a: `font: 700 22px 'Barlow Condensed'`, `letter-spacing: .08em`,
    // `color: var(--amber-3)`, over the manufacturer and landing pad in mono.
    await page.locator('[data-hull-symbol]:visible').first().getByRole('button').first().click();

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
    await page.locator('[data-hull-symbol]:visible').first().getByRole('button').first().click();

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
    const size = parseFloat(await style(header, 'font-size'));
    expect(parseFloat(await style(header, 'letter-spacing')) / size).toBeCloseTo(0.16, 2);
    expect(await style(header, 'border-bottom-width')).toBe('1px');
  });
});
