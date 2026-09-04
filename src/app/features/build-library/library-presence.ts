import { DOCUMENT, Injectable, DestroyRef, inject, signal } from '@angular/core';
import { Location } from '@angular/common';

/**
 * Whether the saved-build layer is standing over the screen.
 *
 * The library is drawn on canvas 1a as a modal over an inert originating
 * screen, and a modal is only a modal if there is a screen behind it. Built as
 * a sibling route it was not: the router replaced the workspace with a page
 * whose whole body was the layer, so the scrim covered nothing and a Commander
 * glancing at their saved builds lost the ship they were working in. The design
 * has recorded that gap since it was built ("Scrim and modal frame over an
 * inert originating screen | An ordinary route page; nothing is behind it and
 * nothing is inert"); this closes it (Commander request 2026-08-28).
 *
 * It has no address of its own (Commander request 2026-09-04). It had one until
 * then — `/builds`, written without a navigation so the screen behind survived
 * — and an address is a promise this surface cannot keep: the records are held
 * on one device, so the address resolves to a different list for every
 * Commander who opens it and to an empty one for anybody else. What the layer
 * opens is a build, and a build has an address.
 *
 * A history entry is still pushed, at the address already showing, so the
 * browser's back closes the layer the way it closes every other one. The
 * address the entry carries is the screen's own, which is the address a
 * Commander would copy from the bar while the layer is up: the screen they were
 * on, which is where a reload puts them back.
 */
@Injectable({ providedIn: 'root' })
export class LibraryPresence {
  readonly #location = inject(Location);
  readonly #window = inject(DOCUMENT).defaultView;

  readonly #open = signal(false);

  /** Whether the layer is standing over a screen. */
  readonly open = this.#open.asReadonly();

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

  /** Raises the layer over whatever screen is showing. */
  raise(): boolean {
    if (this.#open()) {
      return false;
    }

    // The address stays the screen's own; the entry is pushed so back closes
    // the layer rather than leaving the screen underneath it.
    //
    // Read from the address bar and not from the router, fragment included. The
    // workspace publishes its build link over its own address with
    // `replaceState`, which the router never learns about — pushed from
    // `Router.url` the entry would drop the build a Commander is holding, and
    // the address they copied while glancing at their saved builds would open
    // an empty workspace (FR-020).
    this.#location.go(this.#location.path(true));
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
   * the layer rather than closing it: opening a record navigates, and a `back()`
   * racing that navigation would land somewhere neither of them chose.
   *
   * The entry `raise` pushed is left behind. It carries the address the
   * navigation came from, which is where back from the workspace should go
   * anyway — one duplicate of the screen a Commander was on, not a step into a
   * surface that no longer exists.
   */
  lowerForNavigation(): void {
    if (!this.#open()) {
      return;
    }
    this.#lower();
  }

  /** Closes the layer. */
  #lower(): void {
    this.#open.set(false);
  }
}
