import { Injectable, computed, inject, signal } from '@angular/core';
import {
  ApplicationUpdateAdapter,
  type VersionEvent,
} from '../../platform/browser/application-update.adapter';
import { ConnectivityAdapter } from '../../platform/browser/connectivity.adapter';
import { PageLifecycleAdapter } from '../../platform/browser/page-lifecycle.adapter';

/**
 * What this session knows about the version it is running.
 *
 * `current` — nothing newer has been published, or nothing newer has been seen
 * yet. It is the state a session spends nearly all its time in and the only one
 * that says nothing on screen.
 * `ready` — a newer published version is downloaded and waiting for the page to
 * start again.
 * `unusable` — the cached version serving this page is broken beyond repair and
 * only a fresh start recovers it.
 */
export type ApplicationVersionState = 'current' | 'ready' | 'unusable';

/** The state and the revision that carries it, published together. */
export interface ApplicationVersionSnapshot {
  readonly state: ApplicationVersionState;
  /**
   * Which change this is. It only moves when the state does, so a second
   * report of something already on screen is not a second thing to say.
   */
  readonly revision: number;
}

/**
 * How often an open session asks whether a newer version has been published.
 *
 * Fifteen minutes is short enough that a Commander who leaves a tab open across
 * a deployment learns about it in the same sitting, and long enough that a day
 * at the same tab is a few dozen conditional requests for one small manifest.
 * It is a floor, not the only trigger: returning to the tab and regaining a
 * network each ask immediately, which is what actually catches the long
 * overnight case.
 */
export const UPDATE_CHECK_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Whether the version a Commander is reading is the version that was published.
 *
 * The application is static files served from behind a service worker, which is
 * what makes it readable with no network at all. The same worker is why a tab
 * that was opened before a deployment keeps serving the build it installed:
 * nothing about a newer version reaches a page that never starts again. Left
 * alone, that is a Commander sitting on last week's build with no way of
 * knowing, and a cache-defeating reload as the only cure.
 *
 * So the session asks, and when the answer is yes it says so and offers to
 * restart. It never restarts on its own. A reload replaces everything on
 * screen, and deciding that for someone in the middle of outfitting a hull is
 * the one thing this must not do — the same rule that keeps shell navigation
 * from reloading the page (`src/app/app.ts`, `navigateFromShell`). A Commander
 * who never presses it loses nothing either: the worker has already downloaded
 * the newer version, and the next start of the application is served it.
 *
 * The store owns the policy and holds no view state; the adapter beneath it
 * owns the browser and knows nothing about what any of it means
 * (constitution III).
 */
@Injectable({ providedIn: 'root' })
export class ApplicationUpdateStore {
  readonly #updates = inject(ApplicationUpdateAdapter);
  readonly #lifecycle = inject(PageLifecycleAdapter);
  readonly #connectivity = inject(ConnectivityAdapter);

  readonly #state = signal<ApplicationVersionState>('current');
  readonly #revision = signal(0);
  readonly #applying = signal(false);

  readonly state = this.#state.asReadonly();

  /** Whether a restart has been asked for and is on its way. */
  readonly applying = this.#applying.asReadonly();

  readonly snapshot = computed<ApplicationVersionSnapshot>(() => ({
    state: this.#state(),
    revision: this.#revision(),
  }));

  constructor() {
    if (!this.#updates.available) {
      // No worker, nothing caching this page, nothing that can be stale. The
      // development server and the unit tests are both here, and neither should
      // be told about a version that cannot exist.
      return;
    }

    this.#updates.onVersionEvent((event) => this.#record(event));

    // The moments worth asking. The interval covers a session left running, the
    // return covers a tab put away for a night, and connectivity covers the one
    // that was asleep or on a train while a deployment happened.
    this.#updates.every(UPDATE_CHECK_INTERVAL_MS, () => void this.#updates.check());
    this.#lifecycle.onVisible(() => void this.#updates.check());
    this.#connectivity.onOnline(() => void this.#updates.check());

    void this.#updates.check();
  }

  /**
   * Starts the application over on the newer version.
   *
   * Activation first, then the reload that actually puts it on screen. A page
   * that activated a new version without starting over would be a shell from
   * one build asking for chunks from another. A broken cached version has
   * nothing to activate — the fresh start is the whole repair.
   *
   * The flag is released again when there was no page to start over. Ordinarily
   * nothing releases it, because the page it belongs to is on its way out; a
   * restart that could not happen must not leave the one control that recovers
   * this session disabled for the rest of it.
   */
  async apply(): Promise<void> {
    if (this.#state() === 'current' || this.#applying()) {
      return;
    }

    this.#applying.set(true);

    if (this.#state() === 'ready') {
      await this.#updates.activate();
    }

    if (!this.#updates.reload()) {
      this.#applying.set(false);
    }
  }

  /**
   * Records what the worker reported, if it changes what a Commander is told.
   *
   * A second `ready` is a third published version arriving behind the second:
   * the sentence on screen is already the true one and the action already does
   * the right thing, so repeating it would only interrupt a reader to say
   * nothing new. A broken cached version supersedes a waiting one, because it
   * is the more urgent of the two and the restart it asks for delivers both.
   */
  #record(event: VersionEvent): void {
    const state: ApplicationVersionState = event === 'ready' ? 'ready' : 'unusable';
    if (this.#state() === state) {
      return;
    }
    if (state === 'ready' && this.#state() === 'unusable') {
      return;
    }

    this.#state.set(state);
    this.#revision.update((revision) => revision + 1);
  }
}
