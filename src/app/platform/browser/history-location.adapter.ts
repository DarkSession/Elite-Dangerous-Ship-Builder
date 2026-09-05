import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';

/**
 * The application's only reader and writer of the URL fragment.
 *
 * The fragment is where a build link lives, and it is the one part of the URL
 * this application ever writes. Path and query belong to the router and carry
 * no build data (build-link contract, "Canonical form").
 *
 * Fragment replacement uses `history.replaceState` rather than assigning
 * `location.hash`, because an assignment pushes a history entry — and a build
 * being edited would then bury the Commander's actual navigation history under
 * one entry per keystroke (FR-020).
 */
@Injectable({ providedIn: 'root' })
export class HistoryLocationAdapter {
  readonly #window = inject(DOCUMENT).defaultView;
  readonly #fragment = signal(readFragment(this.#window?.location.hash ?? ''));

  /** The current fragment, without its leading `#`. Empty when there is none. */
  readonly fragment = this.#fragment.asReadonly();

  constructor() {
    const view = this.#window;
    if (!view) {
      return;
    }

    const onHashChange = () => this.#fragment.set(readFragment(view.location.hash));
    view.addEventListener('hashchange', onHashChange);
    effect((onCleanup) => {
      onCleanup(() => view.removeEventListener('hashchange', onHashChange));
    });
  }

  /**
   * The document the fragment would be written onto, as path and query.
   *
   * A build link belongs to the build it describes. Publishing is asynchronous,
   * so a Commander can leave `/outfitting` while an encoding is still running; a
   * caller compares this before and after to keep the finished fragment from
   * being stamped onto whatever screen they went to instead.
   */
  currentDocument(): string {
    const location = this.#window?.location;
    return location ? `${location.pathname}${location.search}` : '';
  }

  /** The canonical link for the current document with this fragment value. */
  urlWithFragment(value: string): string {
    const location = this.#window?.location;
    if (!location) {
      return `#${value}`;
    }
    return `${location.origin}${location.pathname}${location.search}#${value}`;
  }

  /**
   * Replaces the fragment in place, preserving origin, path and query.
   *
   * `null` removes the fragment entirely, which is what a refused encoding
   * needs: a stale build fragment left behind would decode into a build the
   * Commander is no longer editing (build-link contract, "Active-edit
   * synchronization").
   */
  replaceFragment(value: string | null): void {
    const view = this.#window;
    if (!view) {
      return;
    }

    const { pathname, search } = view.location;
    const url =
      value === null || value.length === 0
        ? `${pathname}${search}`
        : `${pathname}${search}#${value}`;
    view.history.replaceState(view.history.state, '', url);
    this.#fragment.set(value ?? '');
  }
}

/** Strips the leading `#`, which is punctuation rather than part of the value. */
function readFragment(hash: string): string {
  return hash.startsWith('#') ? hash.slice(1) : hash;
}
