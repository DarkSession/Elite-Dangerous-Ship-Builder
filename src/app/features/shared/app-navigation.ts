import { Injectable, inject } from '@angular/core';
import type { NavigationEntry, ToolEntry } from '../../ui/components/app-frame/app-frame';
import type { MessageKey } from '../../i18n/locale-registry';
import { MessageService } from '../../i18n/message.service';

/** The routes the shell offers from every screen. */
export const NAVIGATION_ROUTES = {
  catalogue: '/ships',
  build: '/build',
  library: '/builds',
} as const;

/** One tool this application carries, as the shell reads it. */
interface ToolRecord {
  readonly id: string;
  /**
   * The short name the bar draws.
   *
   * Canvas 4c draws the tool's full name in the tab. The short one is what is
   * kept, and it is a departure the design record carries: the deck under the
   * tabs is on the same plate and already names the screen, and a plate that
   * says `SHIP BUILDER` twice on one line says it once
   * (`011/design/reference-review.md`).
   */
  readonly labelKey: MessageKey;
  /** The address the tool opens at. */
  readonly href: string;
  /**
   * The route prefixes the tool owns.
   *
   * What decides which tool is current, rather than the address it opens at: a
   * Commander outfitting a hull at `/build` is still in the ship tool, and a
   * bar that stopped naming it there would state something untrue.
   */
  readonly routes: readonly string[];
}

/**
 * The tools this application carries.
 *
 * One array, read by everything that names a tool. The canvas draws its tabs
 * and its tool grid off a single registry, so a tool the application gains is a
 * tool every chrome that names one gains at the same time.
 *
 * It holds the tools the application *serves*, not the ones it plans to. The
 * canvas names eight and `docs/navbeacon-migration.md` names two; what answers
 * an address is the ship builder, so that is what is here. A tab that opens
 * nothing is a control for a thing that does not exist (011/FR-028).
 */
const TOOLS: readonly ToolRecord[] = [
  {
    id: 'ship',
    labelKey: 'tools.ship',
    href: NAVIGATION_ROUTES.catalogue,
    routes: [NAVIGATION_ROUTES.catalogue, NAVIGATION_ROUTES.build, NAVIGATION_ROUTES.library],
  },
];

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

  /**
   * The tools the application carries, with the open route's own marked.
   *
   * The current tool is named rather than offered: `current` is what the frame
   * draws as text instead of a link, for the reason `home` is `null` on the
   * shipyard and `entries` drops the open screen. A link to the screen a
   * Commander is reading is not a way anywhere, and here it would be the second
   * control in one chrome opening the same address (011/FR-028).
   */
  tools(currentPath: string): readonly ToolEntry[] {
    return TOOLS.map((tool) => ({
      id: tool.id,
      label: this.#messages.message(tool.labelKey),
      href: tool.href,
      current: tool.routes.some(
        (route) => currentPath === route || currentPath.startsWith(`${route}/`),
      ),
    }));
  }
}
