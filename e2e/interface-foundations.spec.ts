import { expect, test } from '@playwright/test';
import {
  expectLandmarks,
  expectNameMatchesVisibleText,
  expectNoRawMessages,
  expectOrderedHeadings,
  expectRootLanguage,
  expectSingleVisibleH1,
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
 *
 * **One claim, one owner.** The entry point is one document, and every suite
 * that opens it renders the same tree, so a measurement made here is a
 * measurement nobody else needs to repeat. This suite owns the semantics of
 * that tree. `responsive` owns how it holds its width, `target-and-contrast`
 * owns the target baseline and the colour minima, and `start-page` owns the
 * screen's own content and its scan.
 */
test.describe('product semantics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('presents the landmarks, headings and language a reader navigates by', async ({ page }) => {
    await expectLandmarks(page);
    await expectSingleVisibleH1(page);
    await expectOrderedHeadings(page);
    await expectRootLanguage(page, { lang: 'en', dir: 'ltr' });
    await expectNoRawMessages(page);

    // Visible feedback is ordinary semantic content, not a live region: a
    // Commander must be able to find and re-read it, not only hear it once.
    await expect(page.getByRole('status')).toHaveCount(1);
  });

  test('gives every control an accessible name matching its visible text', async ({ page }) => {
    const controls = page.getByRole('button');
    const count = await controls.count();

    for (let index = 0; index < count; index += 1) {
      const control = controls.nth(index);

      // Present in the accessibility tree and not hidden from view: an action
      // that is merely off-screen is an action a Commander cannot take, and one
      // that survives as an unlabelled glyph has not survived either.
      await expect(control).toBeVisible();
      expect((await control.textContent())?.trim().length ?? 0).toBeGreaterThan(0);
      await expectNameMatchesVisibleText(control);
    }
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
});
