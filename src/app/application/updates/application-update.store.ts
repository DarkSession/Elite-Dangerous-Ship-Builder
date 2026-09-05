import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import {
  ApplicationUpdateAdapter,
  type VersionEvent,
} from '../../platform/browser/application-update.adapter';
import { ConnectivityAdapter } from '../../platform/browser/connectivity.adapter';
import { PageLifecycleAdapter } from '../../platform/browser/page-lifecycle.adapter';
import { EDNB_UPDATE_APPLIED_KEY } from '../../platform/storage/storage-keys';
import { SESSION_STORAGE_PORT } from '../../platform/storage/web-storage.port';

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
 * One second, which is the owner's decision of 2026-08-28: the overlay is the
 * announcement of a restart that is happening, not a passage to be read out
 * before one starts. Ten seconds of a page a Commander cannot touch, ahead of a
 * reload that takes a fraction of that, was ten seconds of nothing happening.
 *
 * Nothing on the overlay can call the restart off, so WCAG 2.2.1 sets no floor
 * here — the criterion is excluded by constitution V for this mechanism and
 * named as the cost. What the second buys is that the restart is never
 * unannounced: the sentence is on screen before the page goes, and the session
 * that comes up says the update was applied and names the version, which is the
 * half a Commander who looked away actually reads (FR-025).
 */
export const UPDATE_OVERLAY_MS = 1_000;

/**
 * How long the notice on the other side of the restart stands before it goes.
 *
 * Six seconds, which is the owner's decision of 2026-08-28. The notice says the
 * update was applied and names the version, and both are facts a Commander can
 * go and read again — the version is on Help · About, and the application is
 * already running it. Leaving it standing until it is pressed puts a modal in
 * front of the build a Commander came back to.
 *
 * It is a second time limit, and it is named as one. The layer keeps its own
 * `Continue`, so nothing here needs waiting out; what the clock takes away is
 * the reading time of someone who does not press it, which meets none of WCAG
 * 2.2.1's conditions. Constitution V is amended to cover this mechanism by name
 * rather than to be read as covering it.
 */
export const UPDATE_APPLIED_NOTICE_MS = 6 * 1000;

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
 * says what is happening, stands for {@link UPDATE_OVERLAY_MS}, and the page
 * restarts on the newer version under it. The session that comes up says the
 * update was applied, and which version it landed on, for
 * {@link UPDATE_APPLIED_NOTICE_MS} or until it is pressed.
 *
 * **Nothing here asks, and that is the point.** Waiting for a Commander to
 * press a control produces a fleet of sessions sitting on old builds behind a
 * notice nobody presses, which is the failure this whole mechanism exists to
 * prevent — and the reload costs less than it appears to, because what a
 * Commander is working on is in the link in the address bar and in this
 * browser's own store, and both survive it (owner's decision, recorded in
 * 011/FR-025's amendment history).
 *
 * **What that costs, stated rather than buried.** A restart on a clock with no
 * way to stop it is a time limit that meets none of WCAG 2.2.1's conditions,
 * and so is a notice that takes itself down. The criterion is named in the
 * constitution's excluded list for these two mechanisms and for no others. A
 * Commander who looks up mid-sentence cannot hold either of them.
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
  readonly #session = inject(SESSION_STORAGE_PORT);

  readonly #state = signal<ApplicationVersionState>('current');
  readonly #revision = signal(0);
  readonly #applying = signal(false);
  readonly #overlay = signal(false);
  readonly #applied = signal(false);

  /** Calls off the scheduled restart. `null` when none is scheduled. */
  #countdown: (() => void) | null = null;

  /** Calls off the applied notice's own clock. `null` when none is running. */
  #noticeClock: (() => void) | null = null;

  readonly state = this.#state.asReadonly();

  /** Whether a restart has been asked for and is on its way. */
  readonly applying = this.#applying.asReadonly();

  /**
   * Whether the overlay is standing over the page.
   *
   * Up from the moment a newer version is ready until the page restarts under
   * it. It is what makes the restart something that is announced before it
   * happens rather than something that happens.
   */
  readonly overlay = this.#overlay.asReadonly();

  /**
   * Whether this session is the one that came up after a restart.
   *
   * The other half of the announcement. The overlay before the reload says what
   * is about to happen and is gone with the page that drew it; this says it
   * happened, on the version it happened onto, and it is the only half a
   * Commander who looked away is certain to read.
   *
   * Read once at construction and cleared as it is read, so a second navigation
   * in the same tab does not repeat it (011/FR-025). It stands for
   * {@link UPDATE_APPLIED_NOTICE_MS} and then takes itself down, by the same
   * route its own control takes.
   */
  readonly applied = this.#applied.asReadonly();

  readonly snapshot = computed<ApplicationVersionSnapshot>(() => ({
    state: this.#state(),
    revision: this.#revision(),
  }));

  constructor() {
    // Both clocks reach out of this store and into the page: one replaces it,
    // the other takes a layer down. A pending one firing into a torn-down
    // injector would be acting on a session nobody is running any more.
    // Registered before anything can start one, including the notice clock the
    // marker below starts in a session with no worker at all.
    inject(DestroyRef).onDestroy(() => {
      this.#stopCountdown();
      this.#stopNoticeClock();
    });

    this.#takeAppliedMarker();

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

    const applyingNewVersion = this.#state() === 'ready';
    if (applyingNewVersion) {
      await this.#updates.activate();
      // Written before the reload rather than after it, because after it there
      // is no code here to write anything. A repair of an unusable cache leaves
      // no marker: it restarts onto the version this session was already
      // supposed to be running, which is not an update to announce.
      this.#session.write(EDNB_UPDATE_APPLIED_KEY, '1');
    }

    if (!this.#updates.reload()) {
      // Nothing to start over — a frame that may not navigate itself, or no
      // window at all. The marker would otherwise greet the next session with
      // news of a restart that never happened.
      this.#session.remove(EDNB_UPDATE_APPLIED_KEY);
      this.#applying.set(false);
      this.#lowerOverlay();
    }
  }

  /**
   * Takes the notice down, having been read.
   *
   * The one control this mechanism still offers, and it acts on a sentence
   * rather than on the update: the version is already running by the time
   * anything can be pressed.
   */
  acknowledgeApplied(): void {
    this.#stopNoticeClock();
    this.#applied.set(false);
  }

  /**
   * Reads the marker the restart left, and clears it in the same breath.
   *
   * Cleared whether or not it was set, so a store that cannot read the session
   * area still cannot leave one behind, and so the notice is shown by the first
   * session after the restart rather than by every session in that tab.
   */
  #takeAppliedMarker(): void {
    const marker = this.#session.read(EDNB_UPDATE_APPLIED_KEY);
    this.#session.remove(EDNB_UPDATE_APPLIED_KEY);
    if (marker.ok && marker.value !== null) {
      this.#applied.set(true);
      // The same route the control takes, so a notice that went by itself and
      // one that was pressed leave the session in the same state.
      this.#noticeClock = this.#updates.after(UPDATE_APPLIED_NOTICE_MS, () =>
        this.acknowledgeApplied(),
      );
    }
  }

  /** Takes the notice down and stops the clock, wanting nothing else. */
  #lowerOverlay(): void {
    this.#stopCountdown();
    this.#overlay.set(false);
  }

  #stopCountdown(): void {
    this.#countdown?.();
    this.#countdown = null;
  }

  #stopNoticeClock(): void {
    this.#noticeClock?.();
    this.#noticeClock = null;
  }

  /** Puts the notice up and starts the clock under it. */
  #announceBeforeRestarting(): void {
    this.#overlay.set(true);
    this.#stopCountdown();
    this.#countdown = this.#updates.after(UPDATE_OVERLAY_MS, () => void this.apply());
  }

  /**
   * Records what the worker reported, and acts on it.
   *
   * Two different questions, which used to be one and were wrong together.
   *
   * *What is said* changes only when the state does. A second `ready` is a
   * third published version arriving behind the second: the sentence on screen
   * is already the true one and the action already does the right thing, so
   * repeating it would only interrupt a reader to say nothing new. That is what
   * the revision counts, and it is why it does not move here.
   *
   * *What is done* is per version. Each `ready` the worker reports is a version
   * that was not there before, and each one is announced and restarted onto.
   * Collapsing the two into the sentence would leave a session that had been
   * told once sitting on the version it was running for the rest of its life,
   * however many were published behind it — the stale session this mechanism
   * exists to prevent. The separation is what makes a third version behind a
   * second reach a page whose restart of the second could not happen.
   *
   * A broken cached version supersedes a waiting one, because it is the more
   * urgent of the two and the restart it asks for delivers both. It is never
   * put on a clock, so a report of one takes the overlay down rather than up.
   */
  #record(event: VersionEvent): void {
    const state: ApplicationVersionState = event === 'ready' ? 'ready' : 'unusable';
    if (state === 'ready' && this.#state() === 'unusable') {
      return;
    }

    if (this.#state() !== state) {
      this.#state.set(state);
      this.#revision.update((revision) => revision + 1);
    }

    if (state === 'ready') {
      this.#announceBeforeRestarting();
    } else {
      // The notice comes down, but a restart already under way is left alone:
      // it is on its way to a fresh copy of the application, which is what an
      // unrepairable cache needs too.
      this.#lowerOverlay();
    }
  }
}
