import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
} from '@angular/router';

/**
 * How long a navigation runs before the application says it is waiting.
 *
 * Ten milliseconds, which `openspec/specs/platform/navigation-waiting/`, "A
 * navigation shorter than the threshold draws nothing", fixes. Every screen is
 * its own chunk, and one the browser already holds resolves without a request —
 * in the same task or the one after it — so this is longer than that and
 * shorter than anything a Commander reads as a delay.
 *
 * A navigation that ends just past it draws the mark and removes it a frame or
 * two later. There is no floor that would smooth that: a floor keeps the mark
 * standing after the screen is ready, which is a statement that is no longer
 * true.
 */
export const NAVIGATION_WAITING_THRESHOLD_MS = 10;

/**
 * Whether the application is waiting for a screen, and whether the last attempt
 * to open one failed.
 *
 * Every route is a `loadComponent`, so the router fetches a screen's code inside
 * the navigation that first asks for it. Nothing else in the application
 * observes those navigations, and without this a Commander who presses a tool
 * entry is left on the screen they pressed from with no answer for as long as
 * the chunk takes — a control that looks unpressed, and gets pressed again.
 *
 * It renders nothing and is tested without rendering (constitution III). The
 * overlay takes an input and draws.
 *
 * **Two signals, and they are not opposites.** `waiting` is about a navigation
 * in flight; `failed` is about one that is over. A navigation that fails lowers
 * the first and raises the second in the same event.
 *
 * **Endings are partitioned.** A navigation that is cancelled — including one
 * superseded by a second press — and one redirected to another address are
 * ordinary endings and are stated as nothing: an address that resolves to
 * nothing lands at the entry point rather than reporting a fault
 * (`openspec/specs/platform/tool-navigation/`). Only an error is a failure.
 *
 * **The session's first presentation is not covered.** A Commander opening an
 * address arrives at what that address serves, and a mark drawn over it would
 * hide content the first frame is required to show
 * (`openspec/specs/platform/published-addresses/`). So `waiting` answers from
 * the first navigation that ends onward. It suppresses that signal only:
 * a first navigation that fails is stated like any other.
 */
@Injectable({ providedIn: 'root' })
export class NavigationWaiting {
  readonly #router = inject(Router);

  readonly #waiting = signal(false);
  readonly #failed = signal(false);
  readonly #failures = signal(0);

  /** Whether a navigation is running for long enough to be worth stating. */
  readonly waiting = this.#waiting.asReadonly();

  /**
   * Whether the last navigation ended without presenting its screen.
   *
   * It carries no reason. The router reports a failed navigation, not a
   * diagnosis, and a reason the application does not have is one it may not
   * state (constitution IV).
   */
  readonly failed = this.#failed.asReadonly();

  /**
   * How many navigations have failed in this session.
   *
   * Which failure this is, so the shell can say it once. Announcing is deduped
   * by `(kind, revision, urgency)`, and a boolean carries no revision — two
   * separate failures would be one event, and the second would be the silence
   * this requirement exists to remove.
   */
  readonly failures = this.#failures.asReadonly();

  /**
   * The navigation the threshold is running for, or `null` between navigations.
   *
   * Held so an ending can be matched to the navigation it belongs to. Starting a
   * second navigation cancels the first, and the cancellation arrives *after*
   * the start it was caused by — so an ending taken at face value would take
   * down the statement the navigation that is still going had just raised.
   */
  #running: number | null = null;

  #threshold: ReturnType<typeof setTimeout> | null = null;

  /**
   * Whether one navigation has already ended in this session.
   *
   * What separates a navigation from the arrival that starts a session. The
   * browser-only mount keeps the overlay out of a generated document; in a
   * browser the first navigation is a navigation like any other, and this is
   * what makes it the one exception.
   */
  #sessionRunning = false;

  constructor() {
    const events = this.#router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.#started(event.id);
        return;
      }
      // `NavigationSkipped` is here for completeness rather than for a case
      // that arrives: the router raises it instead of starting a navigation at
      // all, so it never matches a running one and never takes a statement
      // down. Listing it says what the partition is, and a router that one day
      // raised it after a start would already be handled.
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationSkipped ||
        event instanceof NavigationError
      ) {
        this.#ended(event.id, event instanceof NavigationError, event instanceof NavigationEnd);
      }
    });

    inject(DestroyRef).onDestroy(() => {
      events.unsubscribe();
      this.#clearThreshold();
    });
  }

  #started(id: number): void {
    this.#clearThreshold();
    this.#running = id;
    if (!this.#sessionRunning) {
      // The arrival that starts the session. Nothing is drawn over it, however
      // long it takes.
      return;
    }
    this.#threshold = setTimeout(() => {
      this.#threshold = null;
      this.#waiting.set(true);
    }, NAVIGATION_WAITING_THRESHOLD_MS);
  }

  #ended(id: number, failed: boolean, presented: boolean): void {
    if (this.#running !== id) {
      // The ending of a navigation another one has already replaced. The
      // statement belongs to the navigation that is still going.
      return;
    }
    this.#running = null;
    this.#sessionRunning = true;
    this.#clearThreshold();
    this.#waiting.set(false);
    if (failed) {
      this.#failed.set(true);
      this.#failures.update((count) => count + 1);
      return;
    }
    if (presented) {
      // A screen a Commander can use is the answer to the failure before it.
      // A cancelled or redirected navigation presented nothing, so it leaves
      // whatever was said standing.
      this.#failed.set(false);
    }
  }

  #clearThreshold(): void {
    if (this.#threshold !== null) {
      clearTimeout(this.#threshold);
      this.#threshold = null;
    }
  }
}
