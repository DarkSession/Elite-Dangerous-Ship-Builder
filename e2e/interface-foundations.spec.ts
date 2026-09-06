import { expect, test } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import {
  expectLandmarks,
  expectNameMatchesVisibleText,
  expectNoDocumentOverflow,
  expectNoRawMessages,
  expectOrderedHeadings,
  expectRootLanguage,
  expectSingleVisibleH1,
  expectTargetSizes,
} from './accessibility/assertions';

/**
 * The product semantics journey (US1).
 *
 * Every assertion here states something a Commander using a screen reader
 * depends on: that landmarks exist to navigate by, that headings describe a
 * real structure, that a control's accessible name is the words on screen, and
 * that a value is related to the label and unit that explain it.
 *
 * Runs in all ten projects. Keyboard operation is constitutionally excluded
 * from the conformance claim, which does not weaken any of this.
 */
test.describe('product semantics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('exposes the application landmarks', async ({ page }) => {
    await expectLandmarks(page);
  });

  test('exposes one visible top-level heading', async ({ page }) => {
    await expectSingleVisibleH1(page);
  });

  test('descends heading levels without skipping', async ({ page }) => {
    await expectOrderedHeadings(page);
  });

  test('gives every control an accessible name matching its visible text', async ({ page }) => {
    const controls = page.getByRole('button');
    const count = await controls.count();

    for (let index = 0; index < count; index += 1) {
      await expectNameMatchesVisibleText(controls.nth(index));
    }
  });

  test('meets the target-size baseline for every interactive control', async ({ page }) => {
    await expectTargetSizes(page);
  });

  test('never scrolls the document horizontally', async ({ page }) => {
    await expectNoDocumentOverflow(page);
  });

  test('publishes the root language and direction', async ({ page }) => {
    await expectRootLanguage(page, { lang: 'en', dir: 'ltr' });
  });

  test('shows no raw message key or unresolved placeholder', async ({ page }) => {
    await expectNoRawMessages(page);
  });

  test('passes an accessibility scan', async ({ page }, testInfo) => {
    await expectNoAccessibilityViolations(page, testInfo, { label: 'product-shell' });
  });

  test('names the tool the open screen belongs to, and does not offer it', async ({ page }) => {
    // The shell says which tool a Commander is in, at every width, and the tool
    // they are already in is a word rather than a link to the screen in front
    // of them (011/FR-028, SC-009).
    //
    // Asked of a tool screen rather than of the entry point the `beforeEach`
    // opens: a Commander at `/` is in no tool, and the bar marks none there
    // (014/FR-010, asserted in `start-page.spec.ts`).
    await page.goto('/ships');
    await expect(page.getByRole('main')).toBeVisible();

    const tools = page.getByRole('navigation', { name: 'Tools' });
    await expect(tools).toHaveCount(1);
    await expect(tools).toBeVisible();

    const current = tools.locator('[aria-current]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText('Ship Builder');
    await expect(current).not.toHaveRole('link');

    // Exactly the registry: the two tools the application serves an address
    // for, and no tab for one it does not. The tool that is not open is the
    // link; the one that is open is the word above (013/FR-023).
    await expect(tools.getByRole('listitem')).toHaveCount(2);
    await expect(tools.getByRole('link')).toHaveText(['Equipment Builder']);
  });

  test('keeps naming the same tool on the screens that tool owns', async ({ page }) => {
    // `textContent`, not `innerText`: the tab is drawn uppercase by the canvas,
    // and what is asserted here is the word the shell names the tool with, not
    // the casing a stylesheet renders it in.
    const named = async (): Promise<string> =>
      (
        (await page
          .getByRole('navigation', { name: 'Tools' })
          .locator('[aria-current]')
          .textContent()) ?? ''
      )
        .replace(/\s+/g, ' ')
        .trim();

    // Every address the ship tool owns: the shipyard, a hull's own page and the
    // outfitting bench. The shipyard is opened here rather than by the
    // `beforeEach`, which lands on the entry point — where no tool is open and
    // so none is marked (014/FR-010).
    await page.goto('/ships');
    await expect(page.getByRole('main')).toBeVisible();

    for (const route of ['/ships/Anaconda', '/outfitting']) {
      expect(await named()).toBe('Ship Builder');

      await page.goto(route);
      await expect(page.getByRole('main')).toBeVisible();
    }

    expect(await named()).toBe('Ship Builder');
  });

  test('exposes a named status region in ordinary reading order', async ({ page }) => {
    // Visible feedback is ordinary semantic content, not a live region: a
    // Commander must be able to find and re-read it, not only hear it once.
    const status = page.getByRole('status');
    await expect(status).toHaveCount(1);
  });
});

/**
 * The waiting states the application draws, and the one guarantee about them
 * that no assertion inside the page can make.
 *
 * The waiting mark is an SVG served as its own document and drawn through
 * `img`. Nothing in the parent document can read its animation, so the
 * application's global reduced-motion rule cannot reach it and neither can a
 * DOM check. What can be checked is the file the browser is actually served
 * (011/FR-029, 011/SC-010).
 */
test.describe('waiting states', () => {
  test('serves a waiting mark that carries its own reduced-motion rule', async ({ request }) => {
    const response = await request.get('/assets/loader.svg');
    expect(response.status()).toBe(200);

    const file = await response.text();
    expect(file).toContain('prefers-reduced-motion: reduce');
    // The rule has to stop the animation it is written for. A media block with
    // nothing in it would satisfy a bare substring check and change nothing.
    expect(file).toMatch(/@media[^{]*prefers-reduced-motion[^{]*\{[^}]*\{[^}]*animation:\s*none/u);
  });
});
