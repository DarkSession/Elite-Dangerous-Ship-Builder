import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import { reachShellAction } from './shell';

/**
 * The update journey (US4).
 *
 * Runs only against a production build, because the thing under test only
 * exists there: the service worker that makes the application readable offline
 * is the same worker that keeps serving the version it installed. A tab opened
 * before a deployment stays on the old build until the page starts again, and
 * nothing on screen would say so.
 *
 * The deployment is stood in for by the test server, which re-stamps the
 * worker's manifest on request — the manifest's own bytes are what the worker
 * hashes into a version, so this is the same thing a rebuilt application does
 * to it without spending a second build to do it.
 */

/** What the shell says when a newer version is waiting to be applied. */
const UPDATE_NOTICE = 'A newer version of this application has been published.';

/** The overlay's own name, which is how a reader finds it. */
const UPDATE_OVERLAY_TITLE = 'Updating';

/**
 * The overlay a newer version puts up before it restarts the page under it.
 *
 * Found as the named modal rather than by its sentence, and both halves of that
 * matter. The sentence is also published to the polite outlet, so text alone
 * matches twice; and the layer is mounted beside the frame whether it is open or
 * not, so a text match inside it finds a closed layer as readily as an open one.
 * A dialog that is not open is not in the accessibility tree at all, which is
 * what makes this the same locator for "it is up" and for "there is none".
 */
function restartWarning(page: Page): Locator {
  return page.getByRole('dialog', { name: UPDATE_OVERLAY_TITLE });
}

/**
 * The notice as visible content, not as the announcement of it.
 *
 * The same sentence is published to the polite outlet, and the two are separate
 * projections of the same event: one stays on the page to be re-read, the other
 * interrupts once. This journey is about the first of them.
 */
function standingNotice(page: Page): Locator {
  return page.getByLabel('Status').getByText(UPDATE_NOTICE);
}

/**
 * A deployment, as far as this browser is concerned.
 *
 * Asked for from the page rather than from a separate request context, so the
 * server records it against the same browser the session is running in — one
 * server serves every project in the run, and one project's deployment must not
 * turn up in another's session.
 */
async function publish(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await fetch('/__publish', { method: 'POST' });
  });
}

/**
 * The moments a session asks again, both of them.
 *
 * Returning to the tab and regaining a network are two of the three triggers —
 * the third is a fifteen-minute interval no test should wait on. Both are
 * raised rather than one, so the journey does not rest on a single engine's
 * treatment of a synthesized event.
 */
async function returnToTheTab(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('online'));
  });
}

/**
 * Asserts the notice does not turn up, over a window long enough for it to.
 *
 * `toHaveCount(0)` resolves on its first poll, which for anything the session
 * has to ask the worker about is before the answer could have arrived. An
 * absence is only worth asserting where the presence had time to happen.
 *
 * Sized against measurement rather than a guess, and then against this config's
 * own stated multipliers. Locally the notice lands 0.5-1.1 s after the session
 * asks, across three Chromium profiles. A CI runner puts the same work at two
 * to three times that wall clock, and Firefox at about 1.7x Chromium — see the
 * notes on `workers` and on the engine matrix in `playwright.config.ts` — which
 * takes the worst documented case to roughly five and a half seconds. Ten,
 * then: the one failure this cannot afford is passing early, because that is
 * indistinguishable from the version being right. Firefox is not installed in
 * the container this was measured in, so its figure is the config's stated
 * ratio rather than an observation; a real one belongs here when there is one.
 */
async function staysAbsent(page: Page): Promise<void> {
  const raised = await standingNotice(page)
    .waitFor({ state: 'visible', timeout: 10_000 })
    .then(
      () => true,
      () => false,
    );

  expect(raised).toBe(false);
}

/**
 * The same assertion, for the warning a postponed session must not see again.
 *
 * Sized past the grace period rather than against the poll above: what would
 * falsify "asked once" is the countdown coming back, and a window shorter than
 * the countdown could not have caught it.
 */
async function staysAbsentAsAWarning(page: Page): Promise<void> {
  const raised = await restartWarning(page)
    .waitFor({ state: 'visible', timeout: 25_000 })
    .then(
      () => true,
      () => false,
    );

  expect(raised).toBe(false);
}

/** Waits until a service worker is actually controlling the page. */
async function waitForController(page: Page): Promise<void> {
  await page.waitForFunction(
    () => navigator.serviceWorker !== undefined && navigator.serviceWorker.controller !== null,
    undefined,
    { timeout: 30_000 },
  );
}

/**
 * Opens the application with its worker in control.
 *
 * The second load is not ceremony: in Chromium a worker does not control the
 * page it installed on, so a session that never reloads is a session with no
 * worker in front of it and nothing to go stale.
 */
async function openControlledSession(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('main')).toBeVisible();
  await waitForController(page);

  await page.reload();
  await expect(page.getByRole('main')).toBeVisible();
  await waitForController(page);
}

test.describe('a newly published version', () => {
  test('reaches an open session, and says so before it restarts it', async ({ page }, testInfo) => {
    await openControlledSession(page);

    // Nothing has been published, so the session has nothing to say about the
    // version it is running.
    await expect(restartWarning(page)).toHaveCount(0);
    await expect(standingNotice(page)).toHaveCount(0);

    await publish(page);
    await returnToTheTab(page);

    await expect(restartWarning(page)).toBeVisible({ timeout: 30_000 });

    // Everything below runs against a page with a countdown on it, so it runs
    // in order of how long it takes: the sweep first, while the whole grace
    // period is still ahead of it, and the short waits after. A scan that
    // started late enough would be scanning the reload.
    //
    // The overlay and the controls on it are a rendered product state like any
    // other, so they are scanned like any other.
    await expectNoAccessibilityViolations(page, testInfo, { label: 'update-applying' });

    // The warning stands before anything is replaced. A restart on a clock is
    // only allowed where there was time to read the warning and call it off
    // (WCAG 2.2.1), so the seconds after it appears are seconds in which the
    // page is still the page the Commander was on.
    const reloaded = page.waitForEvent('load', { timeout: 2_000 }).then(
      () => true,
      () => false,
    );
    expect(await reloaded).toBe(false);
    await expect(restartWarning(page)).toBeVisible();

    // And the shell behind it says nothing of its own. One sentence, in one
    // place, is the whole of what a Commander is being told.
    await expect(standingNotice(page)).toHaveCount(0);
  });

  test('restarts the session on its own when the warning is left standing', async ({ page }) => {
    // Slow because of what it does, not because of the machine: the grace
    // period it waits out is twenty seconds of product behaviour, and two
    // controlled loads bracket it. The default budget is calibrated on a test
    // that does not wait for a clock (`playwright.config.ts`).
    test.setTimeout(150_000);

    await openControlledSession(page);

    await publish(page);
    await returnToTheTab(page);
    await expect(restartWarning(page)).toBeVisible({ timeout: 30_000 });

    // Nothing is pressed. The grace period runs out and the page starts over on
    // the newer version by itself (FR-025) — no cache-defeating reload anywhere
    // in that journey.
    await page.waitForEvent('load', { timeout: 60_000 });
    await expect(page.getByRole('main')).toBeVisible();
    await waitForController(page);
    await expect(restartWarning(page)).toHaveCount(0);
    await expect(standingNotice(page)).toHaveCount(0);

    // What this cannot show is that activation happened: the stood-in
    // deployment changes only the manifest's stamp, so no asset URL moves and
    // the worker hands a *new* client the newest version either way. That the
    // waiting version is activated before the page starts over is a sequence,
    // and it is asserted where sequences can be — over the port, in
    // `application-update.store.spec.ts`.
    //
    // What it can show is that the restarted session is a working one that is
    // still watching: the next deployment reaches it exactly like the first.
    await publish(page);
    await returnToTheTab(page);
    await expect(restartWarning(page)).toBeVisible({ timeout: 30_000 });
  });

  test('is held back, and applied later, when the Commander says not now', async ({
    page,
  }, testInfo) => {
    // Slow for the same reason, from the other side: proving the warning does
    // not come back means outliving the countdown that would have brought it.
    test.setTimeout(150_000);

    await openControlledSession(page);

    await publish(page);
    await returnToTheTab(page);
    await expect(restartWarning(page)).toBeVisible({ timeout: 30_000 });

    // The simple action the rule asks for. Taking it puts the session back
    // exactly where it stood, with the version still waiting and the sentence
    // that says so back on the shell.
    await page.getByRole('button', { name: /^not now$/i }).click();
    await expect(restartWarning(page)).toHaveCount(0);
    await expect(standingNotice(page)).toBeVisible();

    await expectNoAccessibilityViolations(page, testInfo, { label: 'update-available' });

    // And it stays held back. A Commander who has answered once is not asked
    // again for the same version.
    await staysAbsentAsAWarning(page);

    await reachShellAction(page, /^update now$/i);

    await expect(page.getByRole('main')).toBeVisible();
    await waitForController(page);
    await expect(standingNotice(page)).toHaveCount(0);
  });

  test('is what the next start is served, even when nobody applies it', async ({ page }) => {
    // Two controlled loads and a ten-second absence window, on top of a warning
    // that has to be answered before either.
    test.setTimeout(120_000);

    await openControlledSession(page);

    await publish(page);
    await returnToTheTab(page);
    await expect(restartWarning(page)).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: /^not now$/i }).click();
    await expect(standingNotice(page)).toBeVisible();

    // The Commander leaves the notice alone and comes back later. Leaving it
    // costs nothing: the newer version is downloaded already, and a session
    // that starts again is served it (FR-025). Nothing was pressed, and the
    // restart still delivered — which is the whole of the promise.
    //
    // Which version a fresh client is handed is exactly what this clause is
    // about, so the absence gets a window: a session served the superseded
    // version would ask, find the newer manifest and say so within it.
    await page.reload();
    await expect(page.getByRole('main')).toBeVisible();
    await waitForController(page);
    await returnToTheTab(page);
    await staysAbsent(page);

    // And it is watching again from there: a further deployment is noticed.
    await publish(page);
    await returnToTheTab(page);
    await expect(restartWarning(page)).toBeVisible({ timeout: 30_000 });
  });
});
