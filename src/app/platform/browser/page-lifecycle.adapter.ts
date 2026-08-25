import { DOCUMENT, Injectable, inject } from '@angular/core';

/**
 * The moments a page is put away and picked up again.
 *
 * A flush gets `pagehide` and a `visibilitychange` to hidden, and deliberately
 * not `beforeunload`: mobile browsers routinely discard a page without ever
 * firing it, and a save that only happens on desktop is not a save (research,
 * "Storage failures").
 *
 * Coming back is the other half of the same lifecycle. A tab left open for a
 * day is the ordinary case, not the exception, and returning to one is the
 * moment worth asking whether the version it is running is still the published
 * one.
 */
@Injectable({ providedIn: 'root' })
export class PageLifecycleAdapter {
  readonly #document = inject(DOCUMENT);

  /** Calls `flush` when the page is being hidden or discarded. */
  onFlush(flush: () => void): () => void {
    const view = this.#document.defaultView;
    if (!view) {
      return () => {};
    }

    const onHide = () => flush();
    const onVisibility = () => {
      if (this.#document.visibilityState === 'hidden') {
        flush();
      }
    };

    view.addEventListener('pagehide', onHide);
    this.#document.addEventListener('visibilitychange', onVisibility);

    return () => {
      view.removeEventListener('pagehide', onHide);
      this.#document.removeEventListener('visibilitychange', onVisibility);
    };
  }

  /** Calls `resumed` each time the page becomes visible again. */
  onVisible(resumed: () => void): () => void {
    const onVisibility = () => {
      if (this.#document.visibilityState === 'visible') {
        resumed();
      }
    };

    this.#document.addEventListener('visibilitychange', onVisibility);

    return () => this.#document.removeEventListener('visibilitychange', onVisibility);
  }
}
