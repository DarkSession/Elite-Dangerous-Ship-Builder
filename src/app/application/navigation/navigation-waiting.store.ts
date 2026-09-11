import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationCancellationCode,
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
 * Whether a cancellation is a handover to a replacement the router has taken on.
 *
 * Both codes name a replacement that is already on its way: one press
 * superseding another, and a guard sending the Commander somewhere else. Every
 * other cancellation is an ending with nothing behind it.
 *
 * What the router does with that replacement is a separate answer. It usually
 * runs it; where the address is the one it is already at, it skips it instead.
 */
function handsOver(event: NavigationCancel): boolean {
  return (
    event.code === NavigationCancellationCode.SupersededByNewNavigation ||
    event.code === NavigationCancellationCode.Redirect
  );
}

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
 * **Outcomes are partitioned, and only one of them is a failure.** A navigation
 * that is cancelled with nothing taking over is over, and is stated as nothing:
 * an address that resolves to nothing lands at the entry point rather than
 * reporting a fault (`openspec/specs/platform/tool-navigation/`). Only an error
 * raises `failed`. The two outcomes below are not endings at all.
 *
 * A press on the address a Commander is already at is not an ending, because it
 * is not a navigation: the router says it skipped it and starts nothing, so on
 * its own there is nothing to raise a statement over and nothing to take down.
 *
 * A cancellation that names its replacement — one press superseding another, or
 * a guard sending the Commander elsewhere — is not an ending either. It is the
 * handover itself, raised before the replacement starts, so the statement it
 * carries stays standing and comes down with the navigation still going. Where
 * that replacement is the address the router is already at, the skip is all
 * that follows the handover, and it is what takes the statement down: nothing
 * else would, and a statement is never left standing over nothing (FR-005).
 *
 * **The session's first presentation is not covered.** A Commander opening an
 * address arrives at what that address serves, and a mark drawn over it would
 * hide content the first frame is required to show
 * (`openspec/specs/platform/published-addresses/`). So `waiting` answers from
 * the first navigation that ends onward. It suppresses that signal only:
 * a first navigation that fails is stated like any other.
 */
@Injectable({ providedIn: 'root' })
export class NavigationWaitingStore {
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
   * Which failure this is, so the shell has an event to announce on. A boolean
   * does not move when a second navigation fails, so the effect watching it
   * would not run and the second failure would be the silence this requirement
   * exists to remove.
   *
   * Being published is half of it. Both failures say the same sentence,
   * and a live region announces a change to what it holds rather than a
   * decision to publish, so the outlet is what carries the second of them to a
   * reader: `src/app/ui/announcements/` renders what it holds by the event
   * rather than by its words (011/FR-009).
   */
  readonly failures = this.#failures.asReadonly();

  /**
   * The navigation the threshold is running for, or `null` between navigations.
   *
   * Held so an ending can be matched to the navigation it belongs to.
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
      if (event instanceof NavigationCancel && handsOver(event)) {
        this.#handedOver(event.id);
        return;
      }
      if (event instanceof NavigationSkipped) {
        this.#skipped();
        return;
      }
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
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
    if (this.#waiting()) {
      // A navigation taking over from one that was replaced mid-flight. The
      // statement standing is already this Commander's answer, so it is adopted
      // rather than taken down and drawn again — a threshold started here would
      // blink it off and on (FR-005).
      return;
    }
    this.#threshold = setTimeout(() => {
      this.#threshold = null;
      this.#waiting.set(true);
    }, NAVIGATION_WAITING_THRESHOLD_MS);
  }

  /**
   * A navigation replaced by one the router is about to start.
   *
   * Not an ending. The router raises this cancellation on its way to the
   * navigation that takes over — before that navigation's start, because the
   * cancellation is what the handover consists of — so the statement it raised
   * belongs to what takes over and stays standing (FR-005). What takes over is
   * a navigation, or the router skipping one; `#skipped` closes the handover in
   * the second case.
   *
   * The session is not started by it either: a first navigation handed over is
   * a first presentation that has still not arrived, and the navigation that
   * takes over must draw nothing over it (FR-008).
   */
  #handedOver(id: number): void {
    if (this.#running !== id) {
      return;
    }
    this.#running = null;
    this.#clearThreshold();
  }

  /**
   * A navigation the router answered without running one.
   *
   * The address asked for is the one it is already at, so it says so and starts
   * nothing. Read for one case: the navigation that takes over a handover can
   * be this, and then the handover is over with nothing running. Whatever the
   * cancelled navigation raised is taken down here, because nothing else will.
   *
   * The session is not started by it and no failure is stated: a skip presented
   * no screen and asked for nothing (FR-007). Where a navigation is running,
   * this is not its ending and is left to it.
   */
  #skipped(): void {
    if (this.#running !== null) {
      return;
    }
    this.#clearThreshold();
    this.#waiting.set(false);
  }

  #ended(id: number, failed: boolean, presented: boolean): void {
    if (this.#running !== id) {
      // An ending for a navigation this store is no longer following. The
      // statement belongs to whichever navigation is running now.
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
