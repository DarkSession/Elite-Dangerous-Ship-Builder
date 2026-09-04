import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import { expectNoDocumentOverflow } from './accessibility/assertions';

/**
 * The start page journey (014/US1–US3).
 *
 * The product's own address used to redirect into the ship tool, so a Commander
 * who opened NavBeacon landed in a shipyard and discovered the other tool from
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

  test('does not scroll the page sideways', async ({ page }) => {
    await expectNoDocumentOverflow(page);
  });

  test('passes an accessibility scan', async ({ page }, testInfo) => {
    await expectNoAccessibilityViolations(page, testInfo, { label: 'start-page' });
  });
});
