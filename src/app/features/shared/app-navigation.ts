import { Injectable, inject } from '@angular/core';
import type { NavigationEntry } from '../../ui/components/app-frame/app-frame';
import { MessageService } from '../../i18n/message.service';

/** The routes the shell offers from every screen. */
export const NAVIGATION_ROUTES = {
  catalogue: '/ships',
  build: '/build',
  library: '/builds',
} as const;

/**
 * The application's primary navigation, in one place.
 *
 * Every screen composes the same entries in the same order, so a Commander who
 * has learned where "Saved builds" is finds it there on every screen. The
 * entries feature 004 and feature 012 own — importing a build and help — are
 * listed as they land; naming them here rather than in four route components is
 * what stops one screen quietly offering fewer than another.
 *
 * The screen a Commander is already on is left out: the reference's command
 * bar names it once, on the leading edge, and never repeats it as a control
 * (canvas 1a/1b/1c).
 *
 * The build screen is not listed. The reference reaches it by committing to a
 * hull or by opening a saved build, and draws no chip for it on any artboard.
 */
@Injectable({ providedIn: 'root' })
export class AppNavigation {
  readonly #messages = inject(MessageService);

  /** The navigation entries for a screen, with the current one marked. */
  entries(currentPath: string): readonly NavigationEntry[] {
    const entries: readonly NavigationEntry[] = [
      {
        id: 'library',
        label: this.#messages.message('navigation.library'),
        href: NAVIGATION_ROUTES.library,
        current: currentPath === NAVIGATION_ROUTES.library,
      },
    ];
    return entries.filter((entry) => entry.current !== true);
  }

  /**
   * The way back to the shipyard, carried by the bar's own insignia.
   *
   * No canvas draws a `SHIPYARD` chip on the outfitting bar. What every
   * artboard draws on the leading edge is the mark, and the 2026-08-26 revision
   * put it exactly where the word used to be — so the mark is the control, and
   * the word is not drawn twice. It keeps its `href`, so it can be opened in a
   * new tab and its address copied like any other link, and it carries the
   * screen name it goes to as its accessible name.
   *
   * Absent on the shipyard itself: a link to the screen a Commander is already
   * reading is not a way anywhere.
   */
  home(currentPath: string): NavigationEntry | null {
    if (currentPath.startsWith(NAVIGATION_ROUTES.catalogue)) {
      return null;
    }
    return {
      id: 'catalogue',
      label: this.#messages.message('navigation.catalogue'),
      href: NAVIGATION_ROUTES.catalogue,
      current: false,
    };
  }
}
