import { DOCUMENT, Injectable, inject } from '@angular/core';

/**
 * The moments a best-effort autosave flush gets.
 *
 * `pagehide` and a `visibilitychange` to hidden, and deliberately not
 * `beforeunload`: mobile browsers routinely discard a page without ever firing
 * it, and a save that only happens on desktop is not a save (research,
 * "Storage failures").
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
}
