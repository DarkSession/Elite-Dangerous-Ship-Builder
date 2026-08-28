import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import { reachShellLink } from './shell';
import { HELP_MANIFEST } from '../src/app/platform/build/help-manifest.generated';

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

/** The name of the notice the session that came up after the restart draws. */
const UPDATE_APPLIED_TITLE = 'Updated';

/** What that notice says. Neither title is a substring of the other. */
const UPDATE_APPLIED_NOTICE = 'This session restarted on the newer version that was published.';

/**
 * The overlay a newer version puts up before it restarts the page under it.
 *
 * Found as the named modal rather than by its sentence, because the layer is
 * mounted beside the frame whether it is open or not: a text match inside it
 * finds a closed layer as readily as an open one. A dialog that is not open is
 * not in the accessibility tree at all, which is what makes this the same
 * locator for "it is up" and for "there is none".
 */
function restartWarning(page: Page): Locator {
  return page.getByRole('dialog', { name: UPDATE_OVERLAY_TITLE });
}

/** The other half of the announcement, drawn by the session that came up. */
function appliedNotice(page: Page): Locator {
  return page.getByRole('dialog', { name: UPDATE_APPLIED_TITLE });
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
    // The overlay is a rendered product state like any other, so it is scanned
    // like any other.
    await expectNoAccessibilityViolations(page, testInfo, { label: 'update-applying' });
  });

  test('offers nothing to press, because the restart is not a question', async ({ page }) => {
    // The overlay says what is happening rather than asking anything, so it
    // carries nothing to answer with: the layer is drawn with no dismiss label,
    // which takes its control, its Escape and its ground together. That is a
    // time limit a Commander cannot hold, and constitution V names WCAG 2.2.1
    // among the excluded criteria for this one mechanism.
    await openControlledSession(page);

    await publish(page);
    await returnToTheTab(page);
    const overlay = restartWarning(page);
    await expect(overlay).toBeVisible({ timeout: 30_000 });

    await expect(overlay.getByRole('button')).toHaveCount(0);

    // The page under it is still the page the Commander was on: the overlay
    // stands before anything is replaced.
    const reloaded = page.waitForEvent('load', { timeout: 2_000 }).then(
      () => true,
      () => false,
    );
    expect(await reloaded).toBe(false);
    await expect(overlay).toBeVisible();

    // And the shell behind it says nothing of its own. One sentence, in one
    // place, is the whole of what a Commander is being told.
    await expect(standingNotice(page)).toHaveCount(0);
  });

  test('restarts by itself, and says on arrival that it did', async ({ page }, testInfo) => {
    // Slow because of what it does, not because of the machine: the grace
    // period it waits out is ten seconds of product behaviour, and two
    // controlled loads bracket it. The default budget is calibrated on a test
    // that does not wait for a clock (`playwright.config.ts`).
    test.setTimeout(150_000);

    await openControlledSession(page);

    await publish(page);
    await returnToTheTab(page);
    await expect(restartWarning(page)).toBeVisible({ timeout: 30_000 });

    // Nothing is pressed, because there is nothing to press. The grace period
    // runs out and the page starts over on the newer version by itself
    // (FR-025) — no cache-defeating reload anywhere in that journey.
    await page.waitForEvent('load', { timeout: 60_000 });
    await expect(page.getByRole('main')).toBeVisible();
    await waitForController(page);
    await expect(restartWarning(page)).toHaveCount(0);
    await expect(standingNotice(page)).toHaveCount(0);

    // The other half of the announcement. The overlay went with the page that
    // drew it, and this is the half a Commander who looked away is certain to
    // read.
    const applied = appliedNotice(page);
    await expect(applied).toBeVisible();
    await expect(applied).toContainText(UPDATE_APPLIED_NOTICE);
    // And which version it landed on, which is the half that tells a Commander
    // the restart delivered something rather than merely happened. Read from
    // the manifest this build was made with rather than written here, so a
    // stamped patch number does not have to be kept in step by hand.
    await expect(applied).toContainText(HELP_MANIFEST.build.applicationVersion);
    await expectNoAccessibilityViolations(page, testInfo, { label: 'update-applied' });

    // Dismissed by its own named control, and gone for good: a later navigation
    // in the same session does not meet it again.
    await applied.getByRole('button').first().click();
    await expect(applied).toHaveCount(0);

    await reachShellLink(page, /^open saved build$/i);
    await expect(page).toHaveURL(/\/builds/);
    await expect(appliedNotice(page)).toHaveCount(0);

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

  test('is what the next start is served, even when nobody waits the overlay out', async ({
    page,
  }) => {
    // Two controlled loads and a ten-second absence window.
    test.setTimeout(120_000);

    await openControlledSession(page);

    // Published and noticed, so the worker has the newer version downloaded and
    // the overlay is up. Then the page is started again from under it, well
    // inside the ten seconds the overlay stands: nobody waits the restart out,
    // and the session never applies it. What that session is served next is
    // the clause under test (FR-025).
    await publish(page);
    await returnToTheTab(page);
    await expect(restartWarning(page)).toBeVisible({ timeout: 30_000 });

    await page.reload();
    await expect(page.getByRole('main')).toBeVisible();
    await waitForController(page);
    await returnToTheTab(page);

    // A fresh client is handed the newest version, so there is nothing newer
    // for it to find. The absence gets a window: a session served the
    // superseded version would ask, find the newer manifest and say so within
    // it.
    await staysAbsent(page);
    // And it was started again by hand rather than restarted onto anything, so
    // it has nothing to announce.
    await expect(appliedNotice(page)).toHaveCount(0);

    // It is watching again from there: a further deployment is noticed.
    await publish(page);
    await returnToTheTab(page);
    await expect(restartWarning(page)).toBeVisible({ timeout: 30_000 });
  });
});
