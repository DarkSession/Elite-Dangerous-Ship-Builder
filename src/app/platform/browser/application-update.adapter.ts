import { DOCUMENT, Injectable, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

/**
 * What the worker reported about the version this page is running.
 *
 * `ready` — a newer published version has been downloaded and is waiting.
 * `unusable` — the cached version serving this page is broken in a way the
 * worker cannot repair, and only a fresh start recovers it.
 */
export type VersionEvent = 'ready' | 'unusable';

/**
 * The one channel between the running page and the worker that caches it.
 *
 * The application is static files behind a service worker, so a Commander with
 * a tab open keeps the version that worker installed until the page starts
 * again. Without this port the only way to reach a newly published build is a
 * cache-defeating reload, which is a thing to know rather than a thing to do.
 *
 * It is a port and nothing more: it reports what the worker says, asks it to
 * look again, and starts the page over. What any of that means to a Commander
 * is decided above it, in `ApplicationUpdateStore`.
 *
 * `SwUpdate` is optional because it only exists where a worker was registered.
 * The development server registers none and neither does a unit test, and an
 * application that could not be constructed without one would be an application
 * that could not be tested (`src/app/app.config.ts`).
 */
@Injectable({ providedIn: 'root' })
export class ApplicationUpdateAdapter {
  readonly #updates = inject(SwUpdate, { optional: true });
  readonly #window = inject(DOCUMENT).defaultView;

  /** Whether a worker is actually there to be asked. */
  get available(): boolean {
    return this.#updates?.isEnabled === true;
  }

  /** Calls `listener` each time the worker reports on this page's version. */
  onVersionEvent(listener: (event: VersionEvent) => void): () => void {
    const updates = this.#updates;
    if (updates === null || !updates.isEnabled) {
      return () => {};
    }

    // `VERSION_DETECTED` and `VERSION_INSTALLATION_FAILED` are deliberately not
    // reported. A version that has been noticed is not yet a version that can
    // be used, and one that failed to install leaves this page working on the
    // version it already has — neither is something to tell a Commander about,
    // and the next check will say so again if it still matters.
    const ready = updates.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        listener('ready');
      }
    });
    const broken = updates.unrecoverable.subscribe(() => listener('unusable'));

    return () => {
      ready.unsubscribe();
      broken.unsubscribe();
    };
  }

  /**
   * Asks the worker to look for a newer published version.
   *
   * A check that could not be made is not an outcome: it happens whenever the
   * network is away, and a Commander who is offline is told that by the page
   * they are already reading. The worker publishes the result through
   * `onVersionEvent` when there is one.
   */
  async check(): Promise<void> {
    const updates = this.#updates;
    if (updates === null || !updates.isEnabled) {
      return;
    }
    try {
      await updates.checkForUpdate();
    } catch {
      return;
    }
  }

  /**
   * Makes the downloaded version the one this client is served.
   *
   * Always followed by `reload()`. Activating without starting the page over
   * leaves a shell from one version asking for lazy chunks from another, which
   * is the breakage Angular's own documentation warns about.
   */
  async activate(): Promise<void> {
    const updates = this.#updates;
    if (updates === null || !updates.isEnabled) {
      return;
    }
    try {
      await updates.activateUpdate();
    } catch {
      return;
    }
  }

  /**
   * Starts the page over, which is what actually puts a new version on screen.
   *
   * Returns whether there was a page to start over. A caller has no other way
   * to find out: the restart it asked for is the one operation whose success is
   * the caller ceasing to exist, so a silent no-op would leave a session
   * waiting forever for a page that was never going anywhere.
   */
  reload(): boolean {
    const view = this.#window;
    if (!view) {
      return false;
    }
    try {
      view.location.reload();
    } catch {
      // A frame that is not allowed to navigate itself raises rather than
      // refusing quietly. Either way the page is staying where it is, and the
      // caller has to hear the same answer for both.
      return false;
    }
    return true;
  }

  /** Runs `run` every `milliseconds`, until the returned function is called. */
  every(milliseconds: number, run: () => void): () => void {
    const view = this.#window;
    if (!view) {
      return () => {};
    }
    const handle = view.setInterval(run, milliseconds);
    return () => view.clearInterval(handle);
  }

  /**
   * Runs `run` once, `milliseconds` from now, until the returned function is
   * called.
   *
   * The same port as {@link every} and separate from it on purpose: what the
   * store schedules here is the one grace period between an overlay appearing
   * and the page restarting under it.
   *
   * Cancellable not because a Commander can call it off — nothing on that
   * overlay can, which is the cost constitution V records — but because the
   * store itself must: a period still pending when the restart begins, or when
   * the worker reports something other than a waiting version, would fire into
   * a page that has already moved on.
   */
  after(milliseconds: number, run: () => void): () => void {
    const view = this.#window;
    if (!view) {
      return () => {};
    }
    const handle = view.setTimeout(run, milliseconds);
    return () => view.clearTimeout(handle);
  }
}
