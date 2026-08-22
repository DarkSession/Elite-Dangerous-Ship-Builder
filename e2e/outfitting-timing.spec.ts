import { expect, test } from '@playwright/test';

/**
 * SC-002: the chooser keeps up with typing, on the largest list there is.
 *
 * Two things make this measurement honest.
 *
 * The first is *what* is timed. Playwright's own transport costs milliseconds
 * per call, and a measurement that included it would be measuring the test
 * runner. So the whole thing happens inside the page: the value is set, the
 * `input` event dispatched, and the clock stopped when the browser has actually
 * rendered the new rows — a double `requestAnimationFrame`, which is the first
 * moment after a paint.
 *
 * The second is *where*. This runs at the mobile viewport under Chromium's
 * DevTools Protocol with the CPU throttled fourfold, because "fast enough" on a
 * development machine is not a claim about a phone. CPU throttling is a
 * Chromium capability, so this file has its own project — the search behaviour
 * itself is covered in all ten (module-catalogue contract, "Verification").
 *
 * It also has its own step, `pnpm run e2e:timing`, and `pnpm run e2e` excludes
 * it by title. Throttling the CPU fourfold measures nothing if the other cores
 * are running the rest of the suite: the same page settled in 75 ms alone and
 * 120 ms beside two thousand other tests. Folding this back into the matrix run
 * would not make the product faster, only the measurement meaningless.
 */

/** The contract's budget: input to rendered result, in milliseconds. */
const BUDGET_MS = 100;

/** The largest choice list the installed package offers, from the fixtures. */
const LARGEST = { hull: 'PantherMkII', slot: 'Slot01_Size8', atLeast: 400 } as const;

/** How many times the measurement is repeated; the worst one is the verdict. */
const TYPED = ['m', 'mu', 'mul', 'mult', 'multi'] as const;

test.describe('candidate search timing', () => {
  test('settles the largest choice list under 100 ms on a throttled phone', async ({
    page,
    browser,
  }) => {
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    await page.goto(`/ships/${LARGEST.hull}`);
    await page.getByRole('button', { name: 'Build stock hull' }).click();
    await expect(page).toHaveURL(/\/build(#|$)/);

    const row = page.locator(`[data-slot-key="${LARGEST.slot}"] button`).first();
    await row.click();
    await expect(row).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: /change module/i }).click();
    await expect(page.locator('.candidate').first()).toBeVisible();

    // The fixture's claim about which mount is largest, re-proved against the
    // count the surface publishes rather than taken on trust. The count is the
    // whole list; the rows are the page of it currently built, which is exactly
    // what makes the measurement below possible.
    const offered = Number(
      (await page.locator('.replacement__count').innerText()).replace(/\D+/gu, ''),
    );
    expect(
      offered,
      `${LARGEST.hull}/${LARGEST.slot} no longer offers the largest choice list; ` +
        'rediscover it and update the fixture rather than lowering this floor.',
    ).toBeGreaterThanOrEqual(LARGEST.atLeast);

    const timings = await page.evaluate(async (terms) => {
      const field = document.querySelector<HTMLInputElement>('input[type="search"]');
      if (field === null) {
        throw new Error('The chooser rendered no search field to measure.');
      }

      // The first moment after a paint: one frame to be scheduled in, a second
      // to be after the frame that painted.
      const painted = () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });

      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;

      const measured: number[] = [];
      for (const term of terms) {
        await painted();
        const started = performance.now();
        // The native setter, so the framework sees a real value change rather
        // than a property shadowed on the element.
        setValue.call(field, term);
        field.dispatchEvent(new Event('input', { bubbles: true }));
        await painted();
        measured.push(performance.now() - started);
      }
      return measured;
    }, TYPED);

    await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await session.detach();

    const worst = Math.max(...timings);
    expect(
      worst,
      `input-to-rendered-result took ${worst.toFixed(1)} ms over ${offered} choices ` +
        `in ${browser.browserType().name()} at 4x CPU throttling`,
    ).toBeLessThan(BUDGET_MS);
  });
});
