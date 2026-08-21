import { expect, test } from '@playwright/test';
import { expectNonTextContrast, expectTextContrast } from './accessibility/contrast';
import { expectTargetSizes } from './accessibility/assertions';
import { COVERAGE_LEDGER } from './coverage-ledger';
import { previewUrl } from './servers';

/**
 * Target size and computed contrast over every covered state (US2).
 *
 * The ledger names the surfaces the suite claims to cover; this walks the
 * rendered ones and measures the two properties a screenshot cannot prove — a
 * pointer target big enough to hit, and a colour pair with enough separation to
 * read (FR-012).
 *
 * The target baseline applied is the project's 44 CSS-pixel design baseline,
 * which is deliberately stricter than SC 2.5.8's 24-pixel AA minimum, and the
 * measured region is the effective target including any label that activates
 * the control.
 */

/** Every address the preview catalogue renders, shared cells and isolated ones. */
async function previewAddresses(page: import('@playwright/test').Page): Promise<string[]> {
  await page.goto(previewUrl());
  const shared = await page
    .locator('[data-preview-address]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-preview-address') ?? ''));
  const isolated = await page
    .locator('[data-preview-isolated]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-preview-isolated') ?? ''));

  return [...shared, ...isolated].filter((address) => address.length > 0);
}

test.describe('target size and contrast', () => {
  test('the ledger claims coverage of the rendered surfaces', () => {
    // Guards the walk below: if the ledger stopped naming the product and
    // preview surfaces, this suite would still pass while measuring nothing
    // anyone had claimed to cover.
    const rendered = COVERAGE_LEDGER.filter((entry) => entry.axe);

    expect(rendered.length, 'no rendered surface is registered in the ledger').toBeGreaterThan(0);
    expect(
      rendered.some((entry) => entry.surfaceId.startsWith('preview/')),
      'the preview catalogue is not registered as a rendered surface',
    ).toBe(true);
  });

  test('meets the target baseline and contrast minima on the product surface', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();

    await expectTargetSizes(page);
    await expectTextContrast(page);
    await expectNonTextContrast(page);
  });

  test('meets the target baseline and contrast minima in every preview state', async ({ page }) => {
    // One navigation and three measurement passes per rendered state, and the
    // catalogue grows with every component that lands. This is the slowest test
    // in the suite by design: it is a sweep, not a sample.
    test.slow();

    const addresses = await previewAddresses(page);

    expect(addresses.length, 'the catalogue rendered no addressable state').toBeGreaterThan(0);

    // Stated per address rather than as one number, because the number would be
    // wrong again the next time a component lands. A state costs a navigation
    // and three passes over the rendered tree; a second of it is generous on an
    // idle machine and enough on one running the rest of the matrix beside it.
    test.setTimeout(30_000 + addresses.length * 1_000);

    for (const address of addresses) {
      await page.goto(previewUrl(address));
      await expect(page.locator(`[id="${address}"]`)).toHaveCount(1);

      await expectTargetSizes(page);
      await expectTextContrast(page);
      await expectNonTextContrast(page);
    }
  });

  test('keeps the target baseline when copy expands', async ({ page }) => {
    // Expansion moves controls and can shrink them against a fixed track; the
    // baseline is a floor at every copy length, not only at English width.
    await page.goto(previewUrl(undefined, 'expanded-copy'));
    await expect(page.getByRole('main')).toBeVisible();

    await expectTargetSizes(page);
  });
});
