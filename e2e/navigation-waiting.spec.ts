import { expect, test, type Locator, type Page } from '@playwright/test';
import englishMessages from '../src/app/i18n/locales/en.json';
import { expectNoDocumentOverflow } from './accessibility/assertions';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import {
  buildStockHull,
  holdEveryChunk,
  openLibrary,
  savedToBrowser,
  waitForTakeover,
  waitingStatement,
  watchForTheStatement,
} from './shell';

/**
 * What a Commander is told between asking for a screen and getting it
 * (018/US1).
 *
 * Every screen is its own chunk, fetched on the navigation that first asks for
 * it. These journeys hold that fetch, so the wait a Commander meets on a slow
 * connection is a wait the suite can read, and then let it go, refuse it, or
 * replace it with a second navigation.
 *
 * Runs in all ten projects: the statement is the same one at every width, and
 * the screen behind it is unusable at every width, by touch as well as by
 * pointer.
 */

/** The statement, while it stands. */
const overlay = waitingStatement;

/** The mark it draws. */
const mark = (page: Page): Locator => overlay(page).locator('img');

/** The two entries on the start page, each of which opens a tool. */
const tools = (page: Page): Locator => page.getByRole('main').getByRole('link');

/**
 * The failure as visible text, which is the projection that stays to be re-read.
 *
 * Scoped to the status region, because the same sentence is also published to
 * the polite announcement outlet beside it. They are two projections of one
 * event, and a locator that matched both would be asserting about neither.
 */
const failureNotice = (page: Page): Locator =>
  page.locator('.frame__status').getByText(englishMessages['navigation.failed.notice']);

/** The outlets a reader hears: the one that waits its turn, and the one that cuts in. */
const politeOutlet = (page: Page): Locator => page.locator('[data-announcement-outlet="polite"]');
const assertiveOutlet = (page: Page): Locator =>
  page.locator('[data-announcement-outlet="assertive"]');

/** Waits until the statement is standing, which the threshold makes a moment. */
async function stands(page: Page): Promise<void> {
  await expect(overlay(page)).toBeVisible({ timeout: 15_000 });
}

/** The alpha of an element's own background colour, as the browser computes it. */
function groundAlpha(dialog: Locator): Promise<number> {
  return dialog.evaluate((element) => {
    const parts = getComputedStyle(element).backgroundColor.match(/[\d.]+/g) ?? [];
    // `rgb(r g b)` is opaque; `rgb(r g b / a)` and `rgba(…)` state the alpha.
    return parts.length < 4 ? 1 : Number(parts[3]);
  });
}

test.describe('a screen that has to be fetched', () => {
  test('states the wait, over the screen the Commander pressed from (018/FR-001, FR-002, FR-005)', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForTakeover(page);
    const held = await holdEveryChunk(page);

    await tools(page).filter({ hasText: 'Ship Builder' }).click({ noWaitAfter: true });
    await stands(page);

    // One statement, and it says only that the application is working.
    await expect(overlay(page)).toHaveCount(1);
    await expect(overlay(page)).toHaveAccessibleName(englishMessages['navigation.waiting.notice']);
    await expect(overlay(page).getByRole('button')).toHaveCount(0);

    // The mark is centred in the viewport, whatever shape the profile is.
    const box = await mark(page).boundingBox();
    const view = page.viewportSize();
    expect(box, 'the mark was drawn').not.toBeNull();
    expect(view, 'the profile has a viewport').not.toBeNull();
    if (box !== null && view !== null) {
      expect(Math.abs(box.x + box.width / 2 - view.width / 2)).toBeLessThanOrEqual(2);
      expect(Math.abs(box.y + box.height / 2 - view.height / 2)).toBeLessThanOrEqual(2);
    }

    // A ground the screen behind stays visible through, rather than one that
    // takes it out of the reading. What the step should be is a judgment, and
    // the reference reading in `e2e/manual/` settles it; what a journey can
    // hold is that the ground is translucent at all (018/FR-002).
    const alpha = await groundAlpha(overlay(page));
    expect(alpha).toBeGreaterThan(0);
    expect(alpha).toBeLessThan(1);

    // Nothing to sit through, either way. A statement that arrives late is
    // late, and one that lingers is a statement that is no longer true. Read
    // from a real engine, where a duration a stylesheet never set and one it
    // set to zero are told apart (011/FR-011).
    expect(
      await overlay(page).evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.transitionDuration, style.animationDuration];
      }),
    ).toEqual(['0s', '0s']);

    // The screen behind it is still on the page, and is not reachable.
    await expect(page.locator('main')).toBeAttached();
    const covered = await tools(page)
      .first()
      .evaluate((card) => {
        const box = card.getBoundingClientRect();
        const at = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        return at === null || !card.contains(at);
      });
    expect(covered, 'the screen behind the statement is covered').toBe(true);

    await expectNoDocumentOverflow(page);

    held.release();
    await expect(page).toHaveURL(/\/ships$/);
    await expect(overlay(page)).toHaveCount(0);
  });

  test('draws the same statement whichever screen was asked for (018/FR-001)', async ({ page }) => {
    // One answer a Commander learns, rather than one per screen. The ship list
    // is already on screen; what is held here is a hull's own code.
    await page.goto('/ships');
    await waitForTakeover(page);

    // Found and brought into view before the gate is armed, and pressed on its
    // own terms, for the reason the superseding journey below gives.
    const hull = page.locator('[data-hull-symbol] button:visible').first();
    await expect(hull).toBeVisible();
    await hull.scrollIntoViewIfNeeded();

    const held = await holdEveryChunk(page);
    await hull.click({ noWaitAfter: true });
    await stands(page);

    await expect(overlay(page)).toHaveAccessibleName(englishMessages['navigation.waiting.notice']);
    await expect(overlay(page).getByRole('button')).toHaveCount(0);

    held.release();
    await expect(overlay(page)).toHaveCount(0);
  });

  test('draws nothing for a screen whose code the browser already holds (018/FR-004)', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForTakeover(page);

    // Fetched once…
    await tools(page).filter({ hasText: 'Ship Builder' }).click();
    await expect(page).toHaveURL(/\/ships$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // …and asked for again, which the browser answers without a request. The
    // threshold is what keeps that from flashing a statement nobody can read.
    //
    // Watched every frame across the navigation rather than read once at the
    // end. A reading taken after the screen has arrived is a reading a
    // statement that stood and came down would pass, which is the whole of
    // what the threshold is for.
    const watch = await watchForTheStatement(page);
    await tools(page).filter({ hasText: 'Ship Builder' }).click();
    await expect(page).toHaveURL(/\/ships$/);
    await expect(page.getByRole('main')).toBeVisible();
    expect(await watch.wasDrawn(), 'a statement was drawn').toBe(false);
    await expect(overlay(page)).toHaveCount(0);
  });

  test('leaves one statement when a second navigation supersedes the first (018/FR-005)', async ({
    page,
  }) => {
    // From a screen there is something behind, so the browser's own way back is
    // a navigation rather than a step out of the application. The screen behind
    // the statement cannot be pressed, so the browser is the only place a
    // second navigation can come from — which is the point of the requirement.
    await page.goto('/');
    await waitForTakeover(page);
    await tools(page).filter({ hasText: 'Ship Builder' }).click();
    await expect(page).toHaveURL(/\/ships$/);
    await expect(page.getByRole('main')).toBeVisible();

    // The row is found and brought into view before the gate is armed, and
    // pressed without forcing it.
    //
    // The gate holds every script from the moment it is armed, so a screen
    // still arriving never finishes, and a forced press lands wherever the
    // element's centre is whether or not anything covers it — on a short
    // viewport that is the bar rather than the row. Either way the press starts
    // no navigation, and there is nothing to state. Playwright's own
    // actionability wait is what makes the press a press.
    const hull = page.locator('[data-hull-symbol] button:visible').first();
    await expect(hull).toBeVisible();
    await hull.scrollIntoViewIfNeeded();

    const held = await holdEveryChunk(page);
    await hull.click({ noWaitAfter: true });
    await stands(page);
    await expect(overlay(page)).toHaveCount(1);

    // Back to the entry point, whose code the browser already holds. One
    // statement stood, not two, and it is removed by the navigation that is
    // still going rather than by the one it replaced.
    await page.goBack();
    await expect(page).toHaveURL(/\/(\?.*)?$/);
    await expect(overlay(page)).toHaveCount(0);
    // A cancelled navigation is an ordinary ending, stated as nothing.
    await expect(failureNotice(page)).toHaveCount(0);

    held.release();
  });

  test('states nothing about an address that resolves to nothing (018/FR-007)', async ({
    page,
  }) => {
    // The one redirect the route table declares. It is reached by typing an
    // address, so it is the navigation that starts a session — which draws no
    // statement — and it lands at the entry point rather than reporting a fault
    // (`platform/tool-navigation`).
    await page.goto('/not-an-address');
    await waitForTakeover(page);

    await expect(page).toHaveURL(/\/(\?.*)?$/);
    await expect(overlay(page)).toHaveCount(0);
    await expect(failureNotice(page)).toHaveCount(0);
  });
});

test.describe('a screen that never arrives', () => {
  test('is stated, on a screen the Commander can still use (018/FR-005, FR-007)', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForTakeover(page);
    const held = await holdEveryChunk(page);

    await tools(page).filter({ hasText: 'Ship Builder' }).click({ noWaitAfter: true });
    await stands(page);
    held.refuse();

    // The statement comes down with the navigation, whatever the outcome.
    await expect(overlay(page)).toHaveCount(0);

    // The words stay on the page to be re-read, rather than being spoken and
    // gone, and they state no reason the application does not have.
    await expect(failureNotice(page)).toBeVisible();
    await expect(
      page.locator('.frame__status').getByText(englishMessages['navigation.failed.detail']),
    ).toBeVisible();

    // Said once as well, politely: nothing is blocked, so nothing interrupts.
    //
    // The outlets are not the only live region on the page. A notice drawn at
    // error tone carries `role="alert"`, which a reader speaks over whatever it
    // was saying — so an empty assertive outlet proves nothing by itself. Both
    // channels are read here, because one event announced twice is what the
    // requirement forbids, whichever region carried the second of them.
    await expect(politeOutlet(page)).toHaveText(englishMessages['navigation.failed.notice']);
    await expect(assertiveOutlet(page)).toHaveText('');
    await expect(page.locator('.frame__status [role]')).toHaveAttribute('role', 'status');

    // And the Commander is on a screen they can use, rather than back where
    // they pressed with no answer.
    await expect(page.getByRole('main').getByRole('heading').first()).toBeVisible();
    held.release();
    await tools(page).filter({ hasText: 'Equipment Builder' }).click();
    await expect(page).toHaveURL(/\/equipment$/);
    // The next screen that opens takes the failure down with it.
    await expect(failureNotice(page)).toHaveCount(0);
  });

  test('is stated on the navigation that starts a session too (018/FR-007, FR-008)', async ({
    page,
  }) => {
    // No statement is drawn over a session's first presentation, whatever
    // happens to it — but a first navigation that fails is stated like any
    // other, and the Commander is left with whatever that address served them
    // rather than with nothing.
    //
    // The screen's own code is refused and the application's is not. They are
    // told apart by asking for the screen once and remembering what that
    // fetched, because both are chunks and only the address distinguishes them.
    // What the Commander is left on in this lane is the application's own
    // shell; where the build generated a document for the address it is that
    // document, which `prerendered-first-frame.spec.ts` reads in the lane that
    // has one.
    const screenChunks = new Set<string>();
    await page.goto('/');
    await waitForTakeover(page);
    page.on('request', (request) => {
      if (request.resourceType() === 'script') {
        screenChunks.add(request.url());
      }
    });
    await tools(page).filter({ hasText: 'Ship Builder' }).click();
    await expect(page).toHaveURL(/\/ships$/);
    await expect(page.getByRole('main')).toBeVisible();

    const fresh = await page.context().newPage();
    await fresh.route('**/*', async (route) => {
      if (screenChunks.has(route.request().url())) {
        await route.abort('failed').catch(() => {});
        return;
      }
      await route.continue().catch(() => {});
    });

    await fresh.goto('/ships');

    await expect(
      fresh.locator('.frame__status').getByText(englishMessages['navigation.failed.notice']),
    ).toBeVisible({ timeout: 30_000 });
    await expect(fresh.locator('ednb-waiting-overlay dialog[open]')).toHaveCount(0);
    // Something readable, rather than a blank page.
    await expect(fresh.getByRole('banner')).toBeVisible();
    await fresh.close();
  });
});

test.describe('the statement and a surface that is already open', () => {
  test('stands in front of a layer the Commander opened (018/FR-002)', async ({ page }) => {
    await page.goto('/ships/Anaconda');
    await buildStockHull(page, 'Build');
    await expect(page).toHaveURL(/\/outfitting(#|$)/);
    await savedToBrowser(page);

    // A fresh session, so the workspace's code is a fetch rather than something
    // the browser already holds.
    await page.goto('/');
    await waitForTakeover(page);
    await openLibrary(page);

    const held = await holdEveryChunk(page);
    const library = page.getByRole('dialog', { name: /^saved builds$/i });
    const row = library.getByRole('button', { name: /^Anaconda\b/i }).first();
    await expect(async () => {
      await row.click({ timeout: 2_000 });
      await expect(row).toHaveAttribute('aria-pressed', 'true', { timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await page
      .locator('.library__footer')
      .getByRole('button', { name: 'Open in outfitting', exact: true })
      .click({ noWaitAfter: true });
    await stands(page);

    // The top layer stacks them in the order they were opened, so the statement
    // is in front — and it is the statement, not the layer, that a press at the
    // middle of the screen reaches.
    const inFront = await overlay(page).evaluate((dialog) => {
      const box = dialog.getBoundingClientRect();
      const at = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return at !== null && dialog.contains(at);
    });
    expect(inFront, 'the statement is in front of the layer').toBe(true);

    held.release();
    await expect(overlay(page)).toHaveCount(0);
  });
});

test.describe('accessibility', () => {
  test('scans the standing statement and the failure it can end in (018/FR-003, 011/FR-012)', async ({
    page,
  }, testInfo) => {
    await page.goto('/');
    await waitForTakeover(page);
    const held = await holdEveryChunk(page);

    await tools(page).filter({ hasText: 'Ship Builder' }).click({ noWaitAfter: true });
    await stands(page);

    // The screen behind is inert because the statement is a *modal* dialog:
    // that is what takes the rest of the document out of the accessibility
    // tree, and it is a platform guarantee rather than something a query can
    // read off the markup.
    expect(
      await overlay(page).evaluate((dialog) => (dialog as HTMLDialogElement).matches(':modal')),
      'the statement is a modal dialog',
    ).toBe(true);

    // Which shows in what a keyboard can reach: nothing behind it takes focus.
    const reachable = await page.evaluate(() => {
      const behind = document.querySelector<HTMLElement>('main a, main button');
      behind?.focus();
      return behind !== null && document.activeElement === behind;
    });
    expect(reachable, 'a control behind the statement took focus').toBe(false);

    await expectNoAccessibilityViolations(page, testInfo, { label: 'navigation waiting' });

    held.refuse();
    await expect(failureNotice(page)).toBeVisible();

    await expectNoAccessibilityViolations(page, testInfo, { label: 'navigation failed' });
  });
});
