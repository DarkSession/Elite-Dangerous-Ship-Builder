import { expect, test } from '@playwright/test';
import englishMessages from '../src/app/i18n/locales/en.json';
import { openActionLayer, reachShellAction } from './shell';

/**
 * SC-005: help appears immediately, on a phone that is busy.
 *
 * The claim is that the modal is *already in the bundle* — no route to load, no
 * chunk to fetch, no artifact to read — so activating the frame's action is a
 * render and nothing else. A hundred milliseconds is the budget that makes that
 * claim falsifiable: it is long enough for one render of a text-forward dialog
 * and far too short for anything that has to go and get something first.
 *
 * Two things make the measurement honest, and they are the same two feature
 * 002's keystroke measurement relies on.
 *
 * The first is *what* is timed. Playwright's transport costs milliseconds per
 * call, and a measurement that included it would be measuring the test runner.
 * So the whole thing happens inside the page: the action is dispatched, and the
 * clock stops when the browser has actually presented a frame containing the
 * open modal — a double `requestAnimationFrame`, which is the first moment
 * after a paint.
 *
 * The second is *where*. This runs at the mobile viewport under Chromium's
 * DevTools Protocol with the CPU throttled fourfold, because "instant" on a
 * development machine is not a claim about a phone. CPU throttling is a
 * Chromium capability, so this file shares the timing project with feature
 * 002's measurement and `pnpm run e2e` excludes both: throttling the CPU
 * fourfold measures nothing if the other cores are running the rest of the
 * suite.
 *
 * The other half of SC-005 — that opening help fetches nothing at all — is not
 * here. It is a behavioural claim rather than a timing one, so it belongs in
 * the matrix and is asserted in all ten projects by `help-and-licences.spec.ts`
 * ("opening help makes no request of any kind").
 */

/** The contract's budget: activation to presented frame, in milliseconds. */
const BUDGET_MS = 100;

/** How many times the measurement is repeated; the worst one is the verdict. */
const ROUNDS = 5;

test.describe('help first-frame timing', () => {
  test('presents the modal within 100 ms on a throttled phone', async ({ page }) => {
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    // From a capability with a build open, which is the heaviest screen the
    // modal ever opens over: the ledger, the status rail and the anatomy plates
    // are all mounted behind it.
    await page.goto(`/ships/Anaconda`);
    await page.getByRole('button', { name: englishMessages['hullDetail.create'] }).click();
    await expect(page.locator('[data-slot-key]').first()).toBeVisible();
    await page.waitForLoadState('networkidle');

    const action = englishMessages['help.action.label'];
    const close = englishMessages['action.close'];
    const title = englishMessages['help.title'];

    // One untimed open first. A font face the workspace had not yet needed can
    // still arrive on the very first modal — the shell's own loading, arriving
    // late — and timing that would be timing the font, not the modal. Every
    // measured round below opens a modal whose every resource is already there,
    // which is the state SC-005 is a claim about.
    await reachShellAction(page, new RegExp(`^${action}$`, 'i'));
    await expect(page.getByRole('dialog', { name: new RegExp(title, 'i') })).toBeVisible();
    await page
      .getByRole('dialog', { name: new RegExp(title, 'i') })
      .getByRole('button', { name: new RegExp(`^${close}$`, 'i') })
      .click();
    await expect(page.getByRole('dialog', { name: new RegExp(title, 'i') })).toHaveCount(0);

    const measurements: number[] = [];
    for (let round = 0; round < ROUNDS; round += 1) {
      // At the timing project's mobile viewport the frame draws its actions in
      // the folded layer, so the layer is opened first and left open. What is
      // timed is the same thing at every width: activating the Help action and
      // waiting for the modal's first presented frame. Opening the menu is the
      // Commander's previous gesture, not part of this one.
      if (
        (await page.getByRole('button', { name: new RegExp(`^${action}$`, 'i') }).count()) === 0
      ) {
        await openActionLayer(page);
        await expect(
          page.getByRole('button', { name: new RegExp(`^${action}$`, 'i') }),
        ).toBeVisible();
      }

      const elapsed = await page.evaluate(
        async (labels: { action: string; title: string }) => {
          /** The frame's Help control, wherever this width draws it. */
          const entry = [...document.querySelectorAll('button')].find((button) => {
            const box = button.getBoundingClientRect();
            return (
              box.height > 0 &&
              (button.textContent ?? '').trim().toLowerCase().includes(labels.action.toLowerCase())
            );
          });
          if (entry === undefined) {
            throw new Error('the frame drew no Help action to activate');
          }

          /** The first moment after a paint, which is when a frame is presented. */
          const presented = (): Promise<void> =>
            new Promise((resolve) => {
              requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
            });

          const started = performance.now();
          entry.click();

          // Rendered, not merely instantiated: the loop waits for a dialog
          // carrying the modal's own title to be in the document and laid out.
          for (let frame = 0; frame < 60; frame += 1) {
            await presented();
            const dialog = document.querySelector('dialog[open]');
            if (
              dialog !== null &&
              (dialog.textContent ?? '').includes(labels.title) &&
              dialog.getBoundingClientRect().height > 0
            ) {
              return performance.now() - started;
            }
          }
          throw new Error('the modal never presented a frame');
        },
        { action, title },
      );

      measurements.push(elapsed);

      await page
        .getByRole('dialog', { name: new RegExp(title, 'i') })
        .getByRole('button', { name: new RegExp(`^${close}$`, 'i') })
        .click();
      await expect(page.getByRole('dialog', { name: new RegExp(title, 'i') })).toHaveCount(0);
    }

    const worst = Math.max(...measurements);
    expect(
      worst,
      `the slowest of ${ROUNDS} opens took ${worst.toFixed(1)} ms: ${measurements
        .map((value) => value.toFixed(1))
        .join(', ')}`,
    ).toBeLessThan(BUDGET_MS);
  });
});
