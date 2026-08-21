import { Injectable, computed, inject } from '@angular/core';
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
 */
@Injectable({ providedIn: 'root' })
export class AppNavigation {
  readonly #messages = inject(MessageService);

  /** The navigation entries for a screen, with the current one marked. */
  entries(currentPath: string): readonly NavigationEntry[] {
    return [
      {
        id: 'catalogue',
        label: this.#messages.message('navigation.catalogue'),
        href: NAVIGATION_ROUTES.catalogue,
        current: currentPath.startsWith(NAVIGATION_ROUTES.catalogue),
      },
      {
        id: 'build',
        label: this.#messages.message('navigation.build'),
        href: NAVIGATION_ROUTES.build,
        current: currentPath === NAVIGATION_ROUTES.build,
      },
      {
        id: 'library',
        label: this.#messages.message('navigation.library'),
        href: NAVIGATION_ROUTES.library,
        current: currentPath === NAVIGATION_ROUTES.library,
      },
    ];
  }

  /** The library entry point every screen offers as a shell action. */
  readonly libraryAction = computed(() => ({
    id: 'library',
    label: this.#messages.message('navigation.library'),
    emphasis: 'secondary' as const,
  }));
}
