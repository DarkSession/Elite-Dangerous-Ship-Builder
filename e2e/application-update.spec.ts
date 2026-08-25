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

/** What the shell says when a newer version is waiting. */
const UPDATE_NOTICE = 'A newer version of this application has been published.';

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
  test('reaches an open session, and waits there to be applied', async ({ page }, testInfo) => {
    await openControlledSession(page);

    // Nothing has been published, so the session has nothing to say about the
    // version it is running.
    await expect(standingNotice(page)).toHaveCount(0);

    await publish(page);
    await returnToTheTab(page);

    await expect(standingNotice(page)).toBeVisible({ timeout: 30_000 });

    // The notice and the control it explains are a rendered product state like
    // any other, so they are scanned like any other.
    await expectNoAccessibilityViolations(page, testInfo, { label: 'update-available' });

    // It waits. A reload replaces everything on screen, and the session never
    // decides that for a Commander who is in the middle of something.
    const reloaded = page.waitForEvent('load', { timeout: 2_000 }).then(
      () => true,
      () => false,
    );
    expect(await reloaded).toBe(false);
    await expect(standingNotice(page)).toBeVisible();
  });

  test('is applied when the Commander asks for it, and not before', async ({ page }) => {
    await openControlledSession(page);

    await publish(page);
    await returnToTheTab(page);
    await expect(standingNotice(page)).toBeVisible({ timeout: 30_000 });

    await reachShellAction(page, /^update now$/i);

    // The application comes back with nothing left to say about its version —
    // no cache-defeating reload anywhere in that journey.
    await expect(page.getByRole('main')).toBeVisible();
    await waitForController(page);
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
    await expect(standingNotice(page)).toBeVisible({ timeout: 30_000 });
  });

  test('is what the next start is served, even when nobody asks for it', async ({ page }) => {
    await openControlledSession(page);

    await publish(page);
    await returnToTheTab(page);
    await expect(standingNotice(page)).toBeVisible({ timeout: 30_000 });

    // The Commander ignores the notice and comes back later. Ignoring it costs
    // nothing: the newer version is downloaded already, and a session that
    // starts again is served it (FR-025). Nothing was pressed, and the restart
    // still delivered — which is the whole of the promise.
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
    await expect(standingNotice(page)).toBeVisible({ timeout: 30_000 });
  });
});
