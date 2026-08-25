import { expect, test } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import {
  expectNoDocumentOverflow,
  expectNoRawMessages,
  expectTargetSizes,
  expectTextEquivalent,
} from './accessibility/assertions';
import { previewUrl } from './servers';

/**
 * The preview sweep (US1).
 *
 * Renders every applicable declaration in the manifest and holds it to the same
 * bar as a product screen: an axe scan, the named semantic assertions, target
 * sizes and no document overflow. A component that only behaves inside one
 * carefully arranged screen is not a shared component.
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

  test('renders the catalogue against the production tokens', async ({ page }) => {
    // The preview imports the product style entry point, so the one dark
    // ground is present. A preview rendering on a different surface would hide
    // exactly the contrast problems it exists to expose.
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    expect(background).not.toBe('rgba(0, 0, 0, 0)');
    expect(background).not.toBe('rgb(255, 255, 255)');
  });

  test('states honestly when nothing is registered', async ({ page }) => {
    const cells = await addresses(page);

    if (cells.length === 0) {
      await expect(page.locator('[data-preview-empty]')).toBeVisible();
    } else {
      await expect(page.locator('[data-preview-empty]')).toHaveCount(0);
    }
  });

  test('gives every rendered state a stable address', async ({ page }) => {
    const cells = await addresses(page);

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

  test('meets the target-size baseline in every rendered state', async ({ page }) => {
    await expectTargetSizes(page);
  });

  test('never scrolls the document horizontally', async ({ page }) => {
    await expectNoDocumentOverflow(page);
  });

  test('resolves every fixture string through the message facade', async ({ page }) => {
    await expectNoRawMessages(page);
  });

  test('gives every visual carrier a text equivalent', async ({ page }) => {
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

    expect(cells.length, 'the catalogue renders a table with a numeric column').toBeGreaterThan(0);
    for (const cell of cells) {
      expect(Math.abs(cell.figure - cell.edge)).toBeLessThanOrEqual(1);
    }
  });

  test('renders right-to-left without changing semantic order', async ({ page }) => {
    const order = await page
      .locator('[data-preview-address]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-preview-address')));

    await page.goto(previewUrl(undefined, 'rtl'));
    await expect(page.getByRole('main')).toHaveAttribute('dir', 'rtl');

    const rtlOrder = await page
      .locator('[data-preview-address]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-preview-address')));

    expect(rtlOrder).toEqual(order);
  });
});
