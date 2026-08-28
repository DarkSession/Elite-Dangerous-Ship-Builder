import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Driving the shell the way a Commander does.
 *
 * The same action lives in two compositions: on the banner where there is room,
 * and behind the named action layer where there is not. A journey should not
 * have to know which one it is looking at — it knows which action it wants — so
 * the reach happens here, once.
 *
 * The shell publishes no actions of its own; capability features supply them.
 */

/** Opens the folded action layer if the wanted action is not already visible. */
export async function reachShellAction(page: Page, name: RegExp): Promise<void> {
  const action = page.getByRole('button', { name });

  if ((await action.count()) === 0) {
    await openActionLayer(page);
  }

  await action.first().click();
}

/**
 * Follows one of the screens the bar offers, at whichever width.
 *
 * Canvas 1c puts them on the bar's trailing edge; canvas 1d puts them in the
 * same `⋮` menu as the actions, because the folded bar is one row. Same list,
 * two placements, and a journey knows only which screen it wants.
 */
export async function reachShellLink(page: Page, name: RegExp | string): Promise<void> {
  const link = page.getByRole('link', { name });

  if ((await link.count()) === 0) {
    await openActionLayer(page);
  }

  await link.first().click();
}

/**
 * Opens the compact menu.
 *
 * The trigger carries visible text rather than the reference's unlabelled
 * ellipsis, so it is found by name like everything else.
 */
export async function openActionLayer(page: Page): Promise<void> {
  await page
    .getByRole('button', { name: /^(menu|menü)$/i })
    .first()
    .click();
}

/**
 * Waits until the working build has been written to this browser.
 *
 * Read from the workspace's own state attribute rather than from a banner. No
 * canvas draws a "saved" notice — the reference reports problems and is silent
 * otherwise — so a journey that waited for one was waiting on a screen the
 * design does not have (canvas 1c, "Build status").
 */
/**
 * Opens a stored record from the library, as the surface now offers it.
 *
 * Since 2026-08-25 the library commits from a footer that acts on the row it
 * has chosen, so opening a record is two presses: choose the row, then open it.
 * Retried as one unit, because the listing re-reads storage after any write and
 * the row a press was aimed at can be replaced a frame later.
 *
 * Both presses are scoped to the library's own layer, and a retry that finds the
 * workspace already open simply stops. Without either, a retry after a
 * navigation that has already landed would press the workspace's own title —
 * which is a button too, and carries the same name as the row.
 */
export async function openRecordFromLibrary(page: Page, title: string): Promise<void> {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const surface = page.getByRole('dialog', { name: /^saved builds$/i });
  const row = surface.getByRole('button', { name: new RegExp(`^${escaped}\\b`, 'i') });
  // The footer's action is named for what it does rather than for the build it
  // does it to, as the canvas names it (canvas 1a, "SAVED BUILDS").
  const open = surface.getByRole('button', { name: 'Open in outfitting', exact: true });

  await expect(async () => {
    if (/\/build(#|$)/.test(page.url())) {
      return;
    }
    await row.click({ timeout: 5_000 });
    await open.click({ timeout: 5_000 });
    await expect(page).toHaveURL(/\/build(#|$)/, { timeout: 5_000 });
  }).toPass({ timeout: 30_000 });

  await expect(page).toHaveURL(/\/build(#|$)/);
}

export async function savedToBrowser(page: Page | Locator): Promise<void> {
  await expect(page.locator('edsb-build-workspace-page')).toHaveAttribute(
    'data-persistence',
    'saved',
  );
}

/**
 * Opens a hull's detail from the manifest, however this device does it.
 *
 * Where the manifest can be hovered, resting on a row is what shows the hull
 * and pressing it starts a stock build of it; where it cannot — a touch screen
 * has no resting — the press is still the way in. A journey wanting the detail
 * should not have to know which of the two it is looking at, so the question is
 * asked here, once, in the stylesheets' own words.
 */
export async function openHullFromManifest(page: Page, name: string): Promise<void> {
  await reachHull(
    page,
    page.getByRole('button', { name: new RegExp(`(view|build a stock) ${name}\\b`, 'i') }).first(),
  );
}

/** The same, for a journey that only needs a hull rather than a named one. */
export async function openFirstHullFromManifest(page: Page): Promise<void> {
  await reachHull(
    page,
    page
      .locator('[data-hull-symbol]:visible')
      .first()
      .getByRole('button', { name: /(view|build a stock) /i })
      .first(),
  );
}

async function reachHull(page: Page, row: Locator): Promise<void> {
  if (await page.evaluate(() => matchMedia('(hover: hover)').matches)) {
    await row.hover();
  } else {
    await row.click();
  }
}
