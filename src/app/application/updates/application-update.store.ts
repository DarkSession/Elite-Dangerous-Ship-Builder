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
 * How long the overlay stands before the page restarts under it.
 *
 * Twenty seconds, and the number is a requirement rather than a taste. A
 * restart that happens on a clock is a time limit, and WCAG 2.2.1 lets one
 * stand only where a Commander can turn it off, adjust it, or is warned before
 * it expires and given **at least twenty seconds** to extend it by a simple
 * action. The overlay is that warning and `postpone()` is that action, so the
 * grace period cannot be shorter than the rule's own floor — and it is not
 * padding either: a Commander who looks up mid-outfitting has to read one
 * sentence and find one control in it.
 */
export const UPDATE_OVERLAY_MS = 20 * 1000;

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
 * So the session asks, and when the answer is yes it applies it: an overlay
 * says what is about to happen, stands for {@link UPDATE_OVERLAY_MS}, and the
 * page restarts on the newer version under it (Commander request 2026-08-26).
 *
 * **Reversed from "never on its own".** Until that request this waited for a
 * Commander to press a control, on the reading that a reload replaces
 * everything on screen and deciding that for someone mid-outfitting is the one
 * thing it must not do. What that produced in practice is a fleet of sessions
 * sitting on old builds behind a notice nobody presses, which is the failure
 * the whole mechanism exists to prevent. The reload is no longer the loss it
 * was reasoned against, either: what a Commander is working on is in the link
 * in the address bar and in this browser's own store, and both survive it.
 *
 * What does not change is that nothing happens without warning and nothing
 * happens that cannot be stopped. The overlay is the warning; `postpone()` is
 * the way out of it, and taking it puts the session back exactly where it was —
 * a notice on the shell and a control that applies the update whenever the
 * Commander is ready. A session that postpones and never comes back loses
 * nothing: the worker has the newer version downloaded, and the next start of
 * the application is served it.
 *
 * A cached version the worker cannot repair is **not** applied on a clock. It
 * is an error rather than an improvement, its restart is a repair a Commander
 * asks for, and there is no working page under an overlay to protect.
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
  readonly #overlay = signal(false);

  /** Calls off the scheduled restart. `null` when none is scheduled. */
  #countdown: (() => void) | null = null;

  readonly state = this.#state.asReadonly();

  /** Whether a restart has been asked for and is on its way. */
  readonly applying = this.#applying.asReadonly();

  /**
   * Whether the overlay is standing over the page.
   *
   * Up from the moment a newer version is ready until the page restarts under
   * it or a Commander postpones it. It is what makes the restart something that
   * is announced before it happens rather than something that happens.
   */
  readonly overlay = this.#overlay.asReadonly();

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

    this.#stopCountdown();
    this.#applying.set(true);

    if (this.#state() === 'ready') {
      await this.#updates.activate();
    }

    if (!this.#updates.reload()) {
      this.#applying.set(false);
      this.#overlay.set(false);
    }
  }

  /**
   * Calls off the restart and puts the session back where it was.
   *
   * The way out of the one time limit this application has, and the reason the
   * limit is allowed to exist at all (WCAG 2.2.1). It leaves the version state
   * alone: the newer version is still ready, the shell still says so, and the
   * control beside that sentence still applies it — so postponing is deferring
   * rather than declining.
   *
   * Nothing schedules the overlay a second time for the same version. A
   * Commander who has said "not now" once has answered, and asking again twenty
   * seconds later would be the interruption this was supposed to replace.
   */
  postpone(): void {
    this.#stopCountdown();
    this.#overlay.set(false);
  }

  #stopCountdown(): void {
    this.#countdown?.();
    this.#countdown = null;
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

    // A newer version applies itself; a broken one waits to be repaired. The
    // overlay goes up first and the restart is scheduled behind it, so there is
    // always a warning and always a way out of it before anything is replaced.
    if (state === 'ready') {
      this.#overlay.set(true);
      this.#stopCountdown();
      this.#countdown = this.#updates.after(UPDATE_OVERLAY_MS, () => void this.apply());
    } else {
      this.postpone();
    }
  }
}
