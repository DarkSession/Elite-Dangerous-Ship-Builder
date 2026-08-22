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

/**
 * The addresses that cannot be measured on the catalogue page.
 *
 * A shared cell renders on the index alongside every other one, so a single
 * pass over that page measures all of them — in the catalogue grid, which
 * constrains a control's width more than its own address does, so the shared
 * measurement is the stricter of the two. An **isolated** state is the one that
 * cannot: it renders a whole shell or an open modal, which would nest landmarks
 * or make the rest of the page inert, so it is listed on the index and reached
 * by its own address instead.
 */
async function isolatedAddresses(page: import('@playwright/test').Page): Promise<string[]> {
  await page.goto(previewUrl());
  return (
    await page
      .locator('[data-preview-isolated]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-preview-isolated') ?? ''))
  ).filter((address) => address.length > 0);
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
    // A sweep, not a sample — but one that reaches each state the cheapest way
    // it can be reached rather than by its own address regardless.
    //
    // **Narrowed 2026-08-22.** This navigated to every address, shared cells
    // included, and re-bootstrapped the preview application ~55 times per
    // project because `previewUrl` addresses a state through a query parameter.
    // At 10 projects that was 11.4% of the whole end-to-end suite — the single
    // most expensive test in it — spent re-rendering components the catalogue
    // page had already rendered together. The three passes below measure the
    // rendered tree, so measuring the index once covers every shared cell on
    // it, in the grid that constrains them more tightly than isolation does.
    // Only the isolated states still cost a navigation each, because those are
    // exactly the states that cannot share the page.
    test.slow();

    await page.goto(previewUrl());
    await expect(page.locator('[data-preview-address]').first()).toBeVisible();

    await expectTargetSizes(page);
    await expectTextContrast(page);
    await expectNonTextContrast(page);

    const isolated = await isolatedAddresses(page);

    expect(
      isolated.length,
      'isolated states are listed so the sweep can reach them',
    ).toBeGreaterThan(0);

    // Stated per address rather than as one number, because the number would be
    // wrong again the next time a component lands. A state costs a navigation
    // and three passes over the rendered tree; a second of it is generous on an
    // idle machine and enough on one running the rest of the matrix beside it.
    test.setTimeout(30_000 + isolated.length * 1_000);

    for (const address of isolated) {
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
