import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import { expectNoDocumentOverflow } from './accessibility/assertions';
import englishMessages from '../src/app/i18n/locales/en.json';

/**
 * The start page journey (014/US1–US3).
 *
 * The product's own address used to redirect into the ship tool, so a Commander
 * who opened Nav Beacon landed in a shipyard and discovered the other tool from
 * a tab. It is a screen now, and these assertions are what makes it one: the
 * choice is offered, either tool opens, back returns, and an address that
 * resolves to nothing lands here rather than inside a tool nobody asked for.
 *
 * Runs in all ten projects, which is also what proves the fold: the wide
 * artboard states each tool one way and the compact artboard another, and
 * exactly one of the two is on screen wherever the suite looks.
 */

/** Each tool's card, addressed by the link the whole plate is. */
const cards = (page: Page) => page.getByRole('main').getByRole('link');

test.describe('start page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('offers the tools rather than opening one', async ({ page }) => {
    // The masthead and the line beneath it, and one entry per tool. Not the
    // shipyard: the address stays at the product's own (014/FR-001, FR-002).
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('main').getByRole('heading')).toHaveText('Tools for Commanders');
    await expect(page.getByText('A growing set of tools for the galaxy.')).toBeVisible();

    await expect(cards(page)).toHaveCount(2);
    await expect(cards(page).nth(0)).toContainText('Ship Builder');
    await expect(cards(page).nth(1)).toContainText('Equipment Builder');
  });

  test('marks no tool as the one being read', async ({ page }) => {
    // A Commander here is in none of the tools, so the bar names none of them
    // as current and offers both as links (014/FR-010).
    const tools = page.getByRole('navigation', { name: 'Tools' });

    await expect(tools.locator('[aria-current]')).toHaveCount(0);
    await expect(tools.getByRole('link')).toHaveText(['Ship Builder', 'Equipment Builder']);
  });

  test('keeps the shell actions it always carries, and adds none', async ({ page }) => {
    // Opening a saved record, importing and help are the shell's, on every
    // screen. This one publishes no action of its own (014/FR-011).
    const banner = page.getByRole('banner');

    await expect(banner).toBeVisible();
    await expect(page.getByRole('main').getByRole('button')).toHaveCount(0);
  });

  for (const [tool, address] of [
    ['Ship Builder', '/ships'],
    ['Equipment Builder', '/equipment'],
  ] as const) {
    test(`opens ${tool}, and back returns to the choice`, async ({ page }) => {
      // The entry point is a screen rather than a redirect that replaced
      // itself, which is what leaves something to come back to (014/FR-006,
      // FR-007).
      await cards(page).filter({ hasText: tool }).click();
      await expect(page).toHaveURL(new RegExp(`${address}$`));

      await page.goBack();
      await expect(page).toHaveURL(/\/$/);
      await expect(cards(page)).toHaveCount(2);

      // The tab as well as the screen. Asserted after coming back rather than
      // on the first load, because the served document already carries this
      // title: only a title the application has written over `<tool> · Nav
      // Beacon` proves `resolveDocumentTitle` chose it (014/FR-016).
      await expect.poll(() => page.title()).toBe(englishMessages['app.document-title.default']);
    });
  }

  test('is where an address that resolves to nothing lands', async ({ page }) => {
    // Not the shipyard: a Commander who mistyped is shown what the product
    // carries rather than dropped into one tool of it (014/FR-008).
    await page.goto('/nonsense');
    await expect(page.getByRole('main')).toBeVisible();

    await expect(page).toHaveURL(/\/$/);
    await expect(cards(page)).toHaveCount(2);
  });

  test('leaves every address that does resolve alone', async ({ page }) => {
    // The entry point is never interposed. A shared build opens its build
    // (014/FR-009).
    for (const address of ['/ships', '/equipment', '/outfitting']) {
      await page.goto(address);
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`${address}$`));
    }
  });

  test('states each tool once, in the form this width has room for', async ({ page }) => {
    // The wide artboard gives a tool a subject strip and a full description;
    // the compact one gives it a shorter line and a go mark. Exactly one form
    // is on screen — never both, never neither — and the same one for every
    // tool (014/FR-017, FR-019, SC-008).
    const wide = page.locator('.tool-card__summary:visible');
    const compact = page.locator('.tool-card__short:visible');

    const wideCount = await wide.count();
    const compactCount = await compact.count();

    expect(wideCount + compactCount).toBe(2);
    expect(wideCount === 2 || compactCount === 2).toBe(true);

    // The subject strip travels with the fuller form and the mark with the
    // shorter one, as each artboard draws them.
    await expect(page.locator('.tool-card__subjects:visible')).toHaveCount(wideCount);
    await expect(page.locator('.tool-card__mark:visible')).toHaveCount(compactCount);
  });

  test('carries the licence notice at its foot', async ({ page }) => {
    // The manifest's exact words, in the language they were written in. Not
    // restated and not translated (014/FR-012).
    const notice = page.locator('.start__legal blockquote');

    await expect(notice).toBeVisible();
    await expect(notice).toContainText('with the permission of Frontier Developments plc');
    await expect(notice).toContainText('was involved in the making of it.');
    await expect(notice).toHaveAttribute('lang', 'en');
  });

  test('gives the licence notice the width of the band rather than a measure', async ({ page }) => {
    // The band is small print closing the page, so nothing holds the notice to
    // a prose column: it takes the room the band has, and it wraps only where
    // its own line runs out. On the wide artboard that is one line
    // (014/FR-013).
    const geometry = await page.evaluate(() => {
      const band = document.querySelector('.start__legal')!;
      const notice = band.querySelector('blockquote')!;
      const bandBox = getComputedStyle(band);
      const room =
        band.getBoundingClientRect().width -
        parseFloat(bandBox.paddingInlineStart) -
        parseFloat(bandBox.paddingInlineEnd);

      // The box the notice takes with nothing to wrap it. Measured rather than
      // written down, because it is a property of the text and the face, and
      // its height is what one line of this notice is in this engine.
      const probe = notice.cloneNode(true) as HTMLElement;
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      probe.style.whiteSpace = 'nowrap';
      probe.style.maxInlineSize = 'none';
      band.append(probe);
      const unwrapped = probe.getBoundingClientRect();
      probe.remove();

      const box = notice.getBoundingClientRect();
      return {
        room,
        unwrappedWidth: unwrapped.width,
        oneLineHeight: unwrapped.height,
        width: box.width,
        height: box.height,
      };
    });

    // A pixel of slack throughout: a fractional layout box is not a measure.
    expect(geometry.width).toBeGreaterThanOrEqual(
      Math.min(geometry.room, geometry.unwrappedWidth) - 1,
    );

    if (geometry.unwrappedWidth <= geometry.room) {
      expect(geometry.height).toBeLessThanOrEqual(geometry.oneLineHeight + 1);
    }
  });

  test('does not scroll the page sideways', async ({ page }) => {
    await expectNoDocumentOverflow(page);
  });

  test('passes an accessibility scan', async ({ page }, testInfo) => {
    await expectNoAccessibilityViolations(page, testInfo, { label: 'start-page' });
  });
});
