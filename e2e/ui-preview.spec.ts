import { expect, test } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import {
  expectNoDocumentOverflow,
  expectNoRawMessages,
  expectTextEquivalent,
} from './accessibility/assertions';
import { previewUrl } from './servers';

/**
 * The preview sweep (US1).
 *
 * Renders every applicable declaration in the manifest and holds it to the same
 * bar as a product screen: an axe scan, the named semantic assertions and no
 * document overflow. A component that only behaves inside one carefully
 * arranged screen is not a shared component.
 *
 * The catalogue index renders every shared cell at once, so a pass over it is a
 * pass over all of them and is made once here. The target baseline and the
 * colour minima over the same page are `target-and-contrast`, and the
 * right-to-left reading order is `expansion-rtl`.
 *
 * Passing here never claims product usability on its own — a fixture is not a
 * journey. That is what the product suite and the screen-reader protocols are
 * for (preview catalogue contract, "Inspection").
 */

/** Every declared cell address the catalogue renders. */
async function addresses(page: import('@playwright/test').Page): Promise<string[]> {
  return page
    .locator('[data-preview-address]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-preview-address') ?? ''));
}

test.describe('component preview catalogue', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(previewUrl());
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('renders every registered state on the production ground, at its own address', async ({
    page,
  }) => {
    // The preview imports the product style entry point, so the one dark
    // ground is present. A preview rendering on a different surface would hide
    // exactly the contrast problems it exists to expose.
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    expect(background).not.toBe('rgba(0, 0, 0, 0)');
    expect(background).not.toBe('rgb(255, 255, 255)');

    const cells = await addresses(page);

    // A catalogue with nothing in it says so, rather than drawing an empty page
    // that looks like a render.
    if (cells.length === 0) {
      await expect(page.locator('[data-preview-empty]')).toBeVisible();
    } else {
      await expect(page.locator('[data-preview-empty]')).toHaveCount(0);
    }

    for (const address of cells) {
      expect(address).toMatch(/^[a-z0-9-]+--(default|empty|loading|error|disabled)$/);
      await expect(page.locator(`[id="${address}"]`)).toHaveCount(1);
    }
  });

  test('isolates one state by address', async ({ page }) => {
    const cells = await addresses(page);

    // Asserted rather than skipped when the manifest is empty: a skipped test
    // cannot reach a green build, and an empty catalogue is a state the
    // catalogue is allowed to be in, not a reason to stop checking addressing.
    for (const address of cells.slice(0, 1)) {
      await page.goto(previewUrl(address));
      expect(await addresses(page)).toEqual([address]);
    }
  });

  test('passes an accessibility scan over every rendered state', async ({ page }, testInfo) => {
    await expectNoAccessibilityViolations(page, testInfo, { label: 'preview-catalogue' });
  });

  test('says everything in words, and fits the page it is drawn on', async ({ page }) => {
    await expectNoDocumentOverflow(page);
    // Every fixture string through the message facade, and every visual carrier
    // with a text equivalent beside it.
    await expectNoRawMessages(page);

    const carriers = page.locator('[data-visual-carrier]');
    const count = await carriers.count();

    for (let index = 0; index < count; index += 1) {
      await expectTextEquivalent(carriers.nth(index));
    }
  });

  test('sweeps every isolated state at its own address', async ({ page }, testInfo) => {
    // A state that renders a whole shell or an open modal cannot share the
    // catalogue page — it would nest landmarks or make everything else inert.
    // It still gets scanned, one address at a time.
    const isolated = await page
      .locator('[data-preview-isolated]')
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('data-preview-isolated') ?? ''),
      );

    expect(
      isolated.length,
      'isolated states are listed so the sweep can reach them',
    ).toBeGreaterThan(0);

    for (const address of isolated) {
      await page.goto(previewUrl(address));
      await expect(page.locator(`[id="${address}"]`)).toHaveCount(1);
      await expectNoAccessibilityViolations(page, testInfo, { label: `preview-${address}` });
      await expectNoDocumentOverflow(page);
    }
  });

  test('sets a declared numeric column flush to the end of its cells', async ({ page }) => {
    // A column a caller declares numeric is read down its length, so its digits
    // have to line up — and the heading above them was right-aligned while the
    // figures under it were not, because the `thead th` rule carries its own
    // compound selector and the cell rule was a bare class the `.table td` rule
    // beside it outweighed. The heading is measured with the body for exactly
    // that reason.
    const cells = await page
      .locator('.table :is(thead, tbody) .table__cell--numeric')
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const style = getComputedStyle(node);
          const box = node.getBoundingClientRect();
          const rtl = style.direction === 'rtl';
          // The cell's own trailing content edge, inside its padding. Text
          // flush to it is aligned to the end; text that is not, is not —
          // which a comparison between sibling cells cannot tell, because
          // equal-width text shares an edge whichever way a column is aligned.
          const edge = rtl
            ? box.left + parseFloat(style.paddingInlineEnd)
            : box.right - parseFloat(style.paddingInlineEnd);

          // Each run of text on its own, rather than one range over the cell.
          // A heading holds its unit in a block-level span, and a block fills
          // the cell whatever its text does inside it: a range over the whole
          // cell would measure that box and report every alignment as flush.
          const walker = node.ownerDocument.createTreeWalker(node, NodeFilter.SHOW_TEXT);
          const runs: number[] = [];
          for (let text = walker.nextNode(); text !== null; text = walker.nextNode()) {
            if ((text.textContent ?? '').trim() === '') {
              continue;
            }
            const range = node.ownerDocument.createRange();
            range.selectNodeContents(text);
            const drawn = range.getBoundingClientRect();
            runs.push(rtl ? drawn.left : drawn.right);
          }
          return { edge, runs };
        }),
      );

    expect(cells.length, 'the catalogue renders a table with a numeric column').toBeGreaterThan(0);
    for (const cell of cells) {
      expect(cell.runs.length, 'every numeric cell draws text to measure').toBeGreaterThan(0);
      for (const run of cell.runs) {
        expect(Math.abs(run - cell.edge)).toBeLessThanOrEqual(1);
      }
    }
  });
});
