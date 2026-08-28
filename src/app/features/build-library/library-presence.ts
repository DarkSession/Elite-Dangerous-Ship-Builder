import { DOCUMENT, Injectable, DestroyRef, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { LocaleStore, type RouteIdentity } from '../../i18n/locale.store';
import { NAVIGATION_ROUTES } from '../shared/app-navigation';

/**
 * Whether the saved-build layer is standing over the screen, and at what address.
 *
 * `/builds` is drawn on canvas 1a as a modal over an inert originating screen,
 * and a modal is only a modal if there is a screen behind it. Built as a
 * sibling route it was not: the router replaced the workspace with a page whose
 * whole body was the layer, so the scrim covered nothing and a Commander
 * glancing at their saved builds lost the ship they were working in. The design
 * has recorded that gap since it was built ("Scrim and modal frame over an
 * inert originating screen | An ordinary route page; nothing is behind it and
 * nothing is inert"); this closes it (Commander request 2026-08-28).
 *
 * The address is kept without a navigation, which is the whole trick: a router
 * navigation to `/builds` would destroy the screen this layer needs behind it.
 * `Location.go` writes the address and pushes the entry, so the browser's back
 * still closes the layer and the address is still `/builds` to copy, bookmark
 * or reload — reloading lands on the route, which renders the library as an
 * ordinary page, exactly as the design says direct navigation should.
 *
 * While the layer is up the router's own URL is the screen behind it. Nothing
 * navigates from under a layer without closing it first, and closing restores
 * the address the router still believes in, so the two are never out of step
 * for longer than the layer is open.
 */
@Injectable({ providedIn: 'root' })
export class LibraryPresence {
  readonly #location = inject(Location);
  readonly #router = inject(Router);
  readonly #locale = inject(LocaleStore);
  readonly #window = inject(DOCUMENT).defaultView;

  readonly #open = signal(false);

  /** Whether the layer is standing over a screen. */
  readonly open = this.#open.asReadonly();

  /** What the screen behind was contributing to the document, to be given back. */
  #restoring: RouteIdentity | null = null;

  constructor() {
    const view = this.#window;
    if (!view) {
      return;
    }

    // The browser's own back is one of the two ways out of this layer, and the
    // canvas draws the other. Both end here.
    const onPopState = (): void => {
      if (this.#open()) {
        this.#lower();
      }
    };
    view.addEventListener('popstate', onPopState);
    inject(DestroyRef).onDestroy(() => view.removeEventListener('popstate', onPopState));
  }

  /**
   * Raises the layer over whatever screen is showing, and takes the address.
   *
   * Refused where the screen already *is* the library: a Commander who reloaded
   * on `/builds` has the page, and a layer over it would be the same list twice.
   */
  raise(): boolean {
    if (this.#open() || this.#onLibraryAddress()) {
      return false;
    }

    this.#restoring = this.#locale.route();
    this.#locale.setRoute({
      titleKey: 'library.title',
      descriptionKey: 'library.description',
      path: NAVIGATION_ROUTES.library,
    });
    this.#location.go(NAVIGATION_ROUTES.library);
    this.#open.set(true);
    return true;
  }

  /**
   * Lowers the layer and gives the address back.
   *
   * Back rather than a second forward entry, so a Commander who opened the
   * library and closed it again has not lengthened their history by two — and
   * so the fragment the workspace published on the entry they came from is
   * restored with it rather than dropped.
   */
  lower(): void {
    if (!this.#open()) {
      return;
    }
    this.#lower();
    this.#location.back();
  }

  /**
   * Lowers the layer without touching history, for a Commander leaving through
   * the layer rather than closing it — opening a record puts them in the
   * workspace, and the entry the layer added is the one that navigation
   * replaces.
   */
  lowerForNavigation(): void {
    if (!this.#open()) {
      return;
    }
    this.#lower();
    // The router still believes in the screen behind, so the address has to be
    // its own again before anything navigates from it: a navigation to a route
    // the router thinks it is already on writes no address at all, and `/builds`
    // would simply stay in the bar.
    this.#location.replaceState(this.#router.url);
  }

  /** Closes the layer and gives the document its identity back. */
  #lower(): void {
    const restoring = this.#restoring;
    this.#restoring = null;
    this.#open.set(false);
    if (restoring !== null) {
      this.#locale.setRoute(restoring);
    }
  }

  /**
   * Whether the address already is the library's.
   *
   * By whole first segment, never by prefix: `/builds` starts with `/build`,
   * and a prefix test answers both questions at once.
   */
  #onLibraryAddress(): boolean {
    const path = (this.#router.url.split('?')[0] ?? '').split('#')[0] ?? '';
    return `/${path.split('/')[1] ?? ''}` === NAVIGATION_ROUTES.library;
  }
}
