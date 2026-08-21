import { type Page } from '@playwright/test';

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
    // Compact composition: the actions are behind one named trigger. The
    // trigger carries visible text, so it is found the same way.
    await page
      .getByRole('button', { name: /^(menu|menü)$/i })
      .first()
      .click();
  }

  await action.first().click();
}
