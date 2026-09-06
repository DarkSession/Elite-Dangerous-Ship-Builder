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
 * Opens the saved builds, at whichever width.
 *
 * They have no address of their own: the library is a layer over whatever
 * screen a Commander is on, raised by a shell action. So a journey lands on a
 * screen first and presses the control, which is the only way in.
 */
export async function openLibrary(page: Page): Promise<void> {
  if (!page.url().startsWith('http')) {
    await page.goto('/ships');
  }
  // Named in whichever language the browser asked for.
  const layer = page.getByRole('dialog', {
    name: /^(Saved builds|Gespeicherte Aufbauten)/i,
  });
  // A journey that used to re-`goto` the address while the layer was already up
  // asked for the list it is looking at. Pressing the control again would reach
  // through the layer for a button the layer is covering.
  if (!(await layer.isVisible())) {
    await reachShellAction(page, /^(Open saved build|Gespeicherten Build öffnen)$/);
  }
  await expect(layer).toBeVisible();
  // The name alone is not the loaded library: while its chunk is on the wire
  // the shell stands a waiting layer here under the same name, holding a
  // skeleton. The search field is the library's own, so it says the layer a
  // journey means is the one on the screen.
  await expect(layer.locator('.library__search')).toBeVisible();
}

/**
 * Follows one of the tools the bar offers, at whichever width.
 *
 * Canvas 4c puts them on the tool deck; canvas 1d folds the bar's own controls
 * into the `⋮` menu beneath it. A journey knows only which tool it wants.
 */
export async function reachShellLink(page: Page, name: RegExp | string): Promise<void> {
  const link = page.getByRole('link', { name });

  if ((await link.count()) === 0) {
    await openActionLayer(page);
  }

  await link.first().click();
}

/**
 * Opens the folded bar's menu.
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
    // Already in the workspace with nothing standing over it. The address alone
    // no longer answers this: the library is a layer with no address of its own
    // (2026-09-04), so it can be open on top of `/outfitting` and the record has
    // still not been opened.
    if (/\/outfitting(#|$)/.test(page.url()) && !(await surface.isVisible())) {
      return;
    }
    await row.click({ timeout: 5_000 });
    await open.click({ timeout: 5_000 });
    await expect(page).toHaveURL(/\/outfitting(#|$)/, { timeout: 5_000 });
  }).toPass({ timeout: 30_000 });

  await expect(page).toHaveURL(/\/outfitting(#|$)/);
}

export async function savedToBrowser(page: Page | Locator): Promise<void> {
  await expect(page.locator('ednb-build-workspace-page')).toHaveAttribute(
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

/**
 * Starts a stock build for the hull the detail screen is showing.
 *
 * Canvas 1b's sheet pins a `Build` action to its footer plate. Canvas 1a's rail
 * draws none: the manifest is beside the inspector at that width and a row's own
 * press is the build, so a second control a centimetre away would be the same
 * transaction reached twice (`hull-detail.page.scss`, "The commitment"). The
 * rail keeps the action on a device that cannot hover, because there a row press
 * opens the detail rather than building.
 *
 * A journey wanting a build should not have to know which of the two it is
 * looking at, so the question is asked here, once, by looking for the action
 * rather than by measuring the viewport. Both candidates are waited for before
 * either is pressed: a journey reaches here straight off a `goto`, which
 * resolves on `load` — before the route's own chunk has drawn anything — and a
 * question asked then is answered "the sheet has no action" on a composition
 * where it has one.
 *
 * Which hull is asked for is taken from the screen rather than passed in, so no
 * journey has to spell a symbol twice and none of them has to spell it the
 * package's way.
 */
export async function buildStockHull(page: Page, label: string): Promise<void> {
  const action = page.getByRole('button', { name: label, exact: true });
  const row = manifestBuildControl(page);

  // Longer than the default, because the wait here spans a route's first paint:
  // every journey reaches this straight off a navigation.
  await expect(action.or(row).first()).toBeVisible({ timeout: 15_000 });

  // Asked again on every attempt, and answered in favour of the action.
  //
  // A journey arrives here mid-navigation, where the screen being left still
  // answers the question: the manifest row of the hull just opened is in the
  // document a moment longer than the route that is going. Asked once, the
  // answer can be that row — and by the time it is pressed the row is gone,
  // which is a thirty-second wait on a control that will never appear. The two
  // are not interchangeable either, so the pair cannot simply be pressed
  // together: a document holds both, and the first of them in document order is
  // the manifest's, not the screen's.
  await expect(async () => {
    const target = (await action.first().isVisible()) ? action.first() : row;
    await target.click({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
}

/**
 * The manifest's own control for the hull whose detail is open, which at a
 * hovering width is the build itself: a rested pointer opens a hull and the
 * press after it flies its stock loadout, so the row's button reads
 * `Build a stock <hull>` rather than `View <hull>`
 * (`responsive-catalogue-view.ts`, `openActionLabel`).
 *
 * Found by the hull's own hook rather than by the name on the control, which is
 * game text in the reader's language — `Federation_Corvette` is drawn `Federal
 * Corvette`, and the whole sentence is German on a German journey.
 *
 * Two ways to the same row, because a hull is reached two ways. A hull opened
 * from the manifest leaves its row marked current, and that mark is the answer
 * while the address is still catching up with the press that opened it. A hull
 * loaded at its own address marks no row, so there the address names it —
 * matched without regard to case, since the route accepts `Sidewinder` for a
 * hull the package calls `SideWinder`.
 *
 * `:visible` sits on the control rather than on the row, because the manifest is
 * drawn twice — a table and a card list, one of them hidden at any width.
 */
export function manifestBuildControl(page: Page): Locator {
  const symbol = decodeURIComponent(new URL(page.url()).pathname.split('/').pop() ?? '');
  return page
    .locator('[data-hull-symbol][aria-current="true"] button:visible')
    .or(page.locator(`[data-hull-symbol="${symbol}" i] button:visible`))
    .first();
}

/**
 * Whether resting a pointer on a manifest row reads the hull it names.
 *
 * The application's own question, asked the application's way: the device has
 * to be able to rest a pointer somewhere, and the rail that reading appears in
 * has to be drawn. Below the rail's width a rest reads nothing at every device,
 * so a journey that hovered there would wait on a navigation that never comes
 * (`src/app/ui/wide-composition.ts`, `observeRestingReads`).
 */
export function restsToRead(page: Page): Promise<boolean> {
  return page.evaluate(() => matchMedia('(hover: hover) and (min-width: 64rem)').matches);
}

async function reachHull(page: Page, row: Locator): Promise<void> {
  if (await restsToRead(page)) {
    await row.hover();
  } else {
    await row.click();
  }
}
