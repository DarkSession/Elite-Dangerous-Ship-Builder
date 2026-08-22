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

/** Opens the compact action layer if the wanted action is not already visible. */
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
 * same `⋮` menu as the actions, because the compact bar is one row. Same list,
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
export async function savedToBrowser(page: Page | Locator): Promise<void> {
  await expect(page.locator('edsb-build-workspace-page')).toHaveAttribute(
    'data-persistence',
    'saved',
  );
}
