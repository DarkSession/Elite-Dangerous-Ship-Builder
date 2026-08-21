import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

/**
 * Whether the browser believes it has a network.
 *
 * Used for one thing: retrying a hull illustration that could not be fetched
 * while offline, without making the Commander reload the page (FR-006). It is
 * advisory — `navigator.onLine` reports a link, not a working route — so
 * nothing depends on it being right, only on it being a reasonable moment to
 * try again.
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityAdapter {
  readonly #window = inject(DOCUMENT).defaultView;
  readonly #online = signal(this.#window?.navigator?.onLine ?? true);

  readonly online = this.#online.asReadonly();

  constructor() {
    const view = this.#window;
    if (!view) {
      return;
    }
    view.addEventListener('online', () => this.#online.set(true));
    view.addEventListener('offline', () => this.#online.set(false));
  }

  /** Calls `listener` each time the browser reports connectivity returning. */
  onOnline(listener: () => void): () => void {
    const view = this.#window;
    if (!view) {
      return () => {};
    }
    const handler = () => listener();
    view.addEventListener('online', handler);
    return () => view.removeEventListener('online', handler);
  }
}
