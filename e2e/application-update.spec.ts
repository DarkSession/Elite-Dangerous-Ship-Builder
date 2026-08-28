import { expect, test, type Locator, type Page } from '@playwright/test';
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

/**
 * Where the page records what the restart overlay drew, for a reader after it.
 *
 * `sessionStorage` because the restart replaces this document and takes every
 * variable in it: the one store that survives a same-tab reload is the one the
 * application's own applied marker already uses.
 */
const OVERLAY_RECORD_KEY = 'e2e:restart-overlay';

/** What the overlay was, taken in the frame it was found in. */
interface RestartOverlayRecord {
  readonly name: string;
  readonly controls: number;
  readonly shellSaidItToo: boolean;
}

/**
 * Starts watching the page for the restart overlay, from inside it.
 *
 * The overlay stands for `UPDATE_OVERLAY_MS` — one second — and Playwright's
 * auto-retrying assertions settle to a one-second poll after their first few
 * tries. A window the same length as the sampling period is a coin toss, and
 * the toss it loses looks exactly like the overlay never being drawn. So the
 * page watches for itself, at animation-frame cadence, and writes down what it
 * saw; the assertions are made afterwards, on the record, from a session that
 * is no longer racing anything.
 *
 * Everything the journeys ask about the overlay is taken in the same frame:
 * its accessible name, how many controls it carries, and whether the shell
 * behind it said anything of its own. A question asked later would be a
 * question about the session that replaced it.
 */
async function watchForRestartOverlay(page: Page): Promise<void> {
  await page.evaluate(
    ([key, title, notice]) => {
      sessionStorage.removeItem(key);
      const look = (): void => {
        for (const dialog of document.querySelectorAll('dialog[open]')) {
          const labelled = dialog.getAttribute('aria-labelledby');
          const name = (
            labelled === null ? '' : (document.getElementById(labelled)?.textContent ?? '')
          ).trim();
          if (name !== title) {
            continue;
          }
          sessionStorage.setItem(
            key,
            JSON.stringify({
              name,
              controls: dialog.querySelectorAll(
                'button, a[href], input, select, textarea, [tabindex]',
              ).length,
              // The shell's own sentence about a waiting version, which is a
              // different sentence from the overlay's and must not be drawn
              // beside it.
              shellSaidItToo: (document.body.textContent ?? '').includes(notice),
            }),
          );
          return;
        }
        requestAnimationFrame(look);
      };
      requestAnimationFrame(look);
    },
    [OVERLAY_RECORD_KEY, UPDATE_OVERLAY_TITLE, UPDATE_NOTICE] as const,
  );
}

/**
 * What the watcher wrote down, once the page it wrote from has been replaced.
 *
 * Read after the restart rather than before it, because before it the read
 * itself races the reload — the whole reason the record exists.
 */
async function recordedRestartOverlay(page: Page): Promise<RestartOverlayRecord | null> {
  const raw = await page.evaluate((key) => sessionStorage.getItem(key), OVERLAY_RECORD_KEY);
  return raw === null ? null : (JSON.parse(raw) as RestartOverlayRecord);
}

/** What the arrival notice drew, taken in one round trip. */
interface AppliedNoticeRecord {
  readonly text: string;
  readonly controls: number;
}

/**
 * Reads the arrival notice, whole, in a single evaluation.
 *
 * It stands for `UPDATE_APPLIED_NOTICE_MS` — six seconds — and then takes
 * itself down. Six auto-retrying assertions against it are six chances for the
 * last of them to be a question about the page that replaced it, so everything
 * the journey asks is taken at once and asserted afterwards.
 */
async function drawnAppliedNotice(page: Page): Promise<AppliedNoticeRecord | null> {
  const handle = await page.waitForFunction(
    (title) => {
      for (const dialog of document.querySelectorAll('dialog[open]')) {
        const labelled = dialog.getAttribute('aria-labelledby');
        const name = (
          labelled === null ? '' : (document.getElementById(labelled)?.textContent ?? '')
        ).trim();
        if (name !== title) {
          continue;
        }
        return JSON.stringify({
          text: (dialog.textContent ?? '').replace(/\s+/gu, ' ').trim(),
          controls: dialog.querySelectorAll('button').length,
        });
      }
      return null;
    },
    UPDATE_APPLIED_TITLE,
    // Animation-frame cadence, for the reason `watchForRestartOverlay` gives:
    // a state that stands for seconds cannot be found by a poll that settles to
    // one second.
    { polling: 'raf', timeout: 30_000 },
  );
  const raw = (await handle.jsonValue()) as string | null;
  return raw === null ? null : (JSON.parse(raw) as AppliedNoticeRecord);
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
  test('reaches an open session, says so, and offers nothing to press', async ({ page }) => {
    // Two claims about one second, so they are made about the same second: the
    // overlay is drawn before anything is replaced, and it carries nothing to
    // answer with. The layer has no dismiss label, which takes its control, its
    // Escape and its ground together — a time limit a Commander cannot hold,
    // which is why constitution V names WCAG 2.2.1 among the excluded criteria
    // for this mechanism.
    //
    // Split across two journeys they were two races against the same window,
    // and the loser of either looked exactly like an overlay that was never
    // drawn (`watchForRestartOverlay`).
    test.setTimeout(150_000);

    await openControlledSession(page);

    // Nothing has been published, so the session has nothing to say about the
    // version it is running.
    await expect(restartWarning(page)).toHaveCount(0);
    await expect(standingNotice(page)).toHaveCount(0);

    await watchForRestartOverlay(page);
    await publish(page);
    await returnToTheTab(page);

    // The restart is what proves the overlay stood *before* anything was
    // replaced: the record is written by the document that is about to go.
    await page.waitForEvent('load', { timeout: 60_000 });
    await expect(page.getByRole('main')).toBeVisible();

    const drawn = await recordedRestartOverlay(page);
    expect(drawn).not.toBeNull();
    expect(drawn?.name).toBe(UPDATE_OVERLAY_TITLE);
    expect(drawn?.controls).toBe(0);
    // And the shell behind it said nothing of its own. One sentence, in one
    // place, is the whole of what a Commander is being told.
    expect(drawn?.shellSaidItToo).toBe(false);
  });

  test('restarts by itself, and says on arrival that it did', async ({ page }) => {
    // Slow because of what it does, not because of the machine: two controlled
    // loads bracket a deployment the worker has to notice and download. The
    // default budget is calibrated on a test that does not wait for a worker
    // (`playwright.config.ts`).
    test.setTimeout(150_000);

    await openControlledSession(page);

    await publish(page);
    await returnToTheTab(page);

    // Nothing is pressed, because there is nothing to press. The grace period
    // runs out and the page starts over on the newer version by itself
    // (FR-025) — no cache-defeating reload anywhere in that journey. The
    // overlay is not waited for on the way: that it was drawn first is the
    // journey above, which records it rather than racing it.
    await page.waitForEvent('load', { timeout: 60_000 });
    await expect(page.getByRole('main')).toBeVisible();
    await waitForController(page);
    await expect(restartWarning(page)).toHaveCount(0);
    await expect(standingNotice(page)).toHaveCount(0);

    // The other half of the announcement. The overlay went with the page that
    // drew it, and this is the half a Commander who looked away is certain to
    // read. Everything asked of it is asked at once, and in one round trip:
    // it stands for `UPDATE_APPLIED_NOTICE_MS`, so a second assertion behind a
    // second poll would be a question about the page after it.
    const drawn = await drawnAppliedNotice(page);
    expect(drawn).not.toBeNull();
    expect(drawn?.text).toContain(UPDATE_APPLIED_NOTICE);
    // And which version it landed on, which is the half that tells a Commander
    // the restart delivered something rather than merely happened. Read from
    // the manifest this build was made with rather than written here, so a
    // stamped patch number does not have to be kept in step by hand.
    expect(drawn?.text).toContain(HELP_MANIFEST.build.applicationVersion);

    // It carries its one named control, which is the way out for a Commander
    // who does not want to wait its six seconds out. That pressing it takes the
    // notice down is asserted over the port, in `app.spec.ts`: here the control
    // is left alone, because the clause under test below is that the notice
    // goes whether or not anyone presses it.
    expect(drawn?.controls).toBe(1);

    // And it goes by itself, without anything having been pressed (owner's
    // decision, 2026-08-28). Gone for good, too: a later navigation in the same
    // session does not meet it again.
    await expect(appliedNotice(page)).toHaveCount(0, { timeout: 30_000 });

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
    // still watching: the next deployment reaches it, and reaches it the same
    // way — by restarting the page under an overlay nobody pressed.
    await watchForRestartOverlay(page);
    await publish(page);
    await returnToTheTab(page);
    await page.waitForEvent('load', { timeout: 60_000 });
    expect((await recordedRestartOverlay(page))?.name).toBe(UPDATE_OVERLAY_TITLE);
  });

  test('serves the newer version to the next start, however that start happened', async ({
    page,
  }) => {
    // Two controlled loads and a ten-second absence window.
    test.setTimeout(120_000);

    await openControlledSession(page);

    // Published, and applied by the session itself — which with the restart on a
    // one-second clock is the only order a journey can hold. A hand-started
    // reload cannot reliably get there first, and one that did would be started
    // before the worker had finished downloading: it would be served the
    // version it already had, correctly, and would then find the newer one.
    // Measured, both engines, 2026-08-28.
    //
    // The clause about a session that never applies it at all is reachable only
    // where the reload itself fails, which is asserted over the port in
    // `application-update.store.spec.ts` and noted on the ledger. What is left
    // for a journey, and what this asserts, is the half that can be reached:
    // starting the application again by hand is served the published version,
    // needs no cache-defeating reload to get it, and announces nothing.
    await publish(page);
    await returnToTheTab(page);
    await page.waitForEvent('load', { timeout: 60_000 });
    await expect(page.getByRole('main')).toBeVisible();
    await waitForController(page);

    await page.reload();
    await expect(page.getByRole('main')).toBeVisible();
    await waitForController(page);

    // Started again by hand rather than restarted onto anything, so it has
    // nothing to announce: the marker the restart left was read and cleared by
    // the session that came up on it (FR-025).
    await expect(appliedNotice(page)).toHaveCount(0);

    // Nothing may restart this session from here. A page served the superseded
    // version would ask, find the newer manifest, and start over under an
    // overlay — which is a load, and this is watching for one.
    let restartedAgain = false;
    page.on('load', () => {
      restartedAgain = true;
    });

    await returnToTheTab(page);

    // A fresh client is handed the newest version, so there is nothing newer
    // for it to find. The absence gets a window: a session served the
    // superseded version would ask, find the newer manifest and say so within
    // it.
    await staysAbsent(page);
    expect(restartedAgain).toBe(false);

    // It is watching again from there: a further deployment is noticed and
    // restarts it exactly like the first one did.
    await watchForRestartOverlay(page);
    await publish(page);
    await returnToTheTab(page);
    await page.waitForEvent('load', { timeout: 60_000 });
    expect((await recordedRestartOverlay(page))?.name).toBe(UPDATE_OVERLAY_TITLE);
  });
});
