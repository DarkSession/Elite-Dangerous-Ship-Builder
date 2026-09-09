import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import {
  NavigationCancel,
  NavigationCancellationCode,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationSkippedCode,
  NavigationStart,
  Router,
  type Event as RouterEvent,
} from '@angular/router';
import {
  NAVIGATION_WAITING_THRESHOLD_MS,
  NavigationWaitingStore,
} from './navigation-waiting.store';

/**
 * What the application says between asking for a screen and getting it.
 *
 * Driven by router events rather than by real navigations: the behaviour under
 * test is which ending means what and when the threshold has passed, and both
 * are exact where a real chunk fetch is not.
 */
describe('NavigationWaitingStore', () => {
  const events = new Subject<RouterEvent>();

  /** Every event the store reads, in the order the router publishes them. */
  const start = (id: number, url = '/outfitting') => events.next(new NavigationStart(id, url));
  const end = (id: number, url = '/outfitting') => events.next(new NavigationEnd(id, url, url));
  const cancel = (id: number, url = '/outfitting') =>
    events.next(new NavigationCancel(id, url, 'cancelled'));
  /**
   * The cancellation the router raises on its way to a replacement.
   *
   * It carries a code naming what takes over, and it comes *before* that
   * navigation's start: the router cancels the transition it is switching away
   * from as it switches. A test that drove the two the other way round would be
   * testing an order the router never publishes.
   */
  const supersede = (id: number, url = '/outfitting') =>
    events.next(
      new NavigationCancel(
        id,
        url,
        'superseded',
        NavigationCancellationCode.SupersededByNewNavigation,
      ),
    );
  /**
   * The answer the router gives a navigation to the address it is already at.
   *
   * It raises this instead of a start, and nothing else: no start, no ending.
   * Reached here the way the application reaches it — as the replacement in a
   * handover, where a Commander presses back to a screen still arriving and
   * then forward again.
   */
  const skip = (id: number, url = '/outfitting') =>
    events.next(
      new NavigationSkipped(id, url, 'same url', NavigationSkippedCode.IgnoredSameUrlNavigation),
    );
  const fail = (id: number, url = '/outfitting') =>
    events.next(new NavigationError(id, url, new Error('chunk')));

  /**
   * A store already past the arrival that started the session.
   *
   * Nothing is drawn over a session's first presentation, so most of what this
   * store does only happens from the second navigation onward.
   */
  function running(): NavigationWaitingStore {
    const store = TestBed.inject(NavigationWaitingStore);
    start(1, '/');
    end(1, '/');
    return store;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { events } as unknown as Router }],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('states nothing until the threshold has passed', () => {
    const store = running();

    start(2);
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS - 1);

    expect(store.waiting()).toBe(false);
  });

  it('states that it is waiting once the threshold has passed', () => {
    const store = running();

    start(2);
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS);

    expect(store.waiting()).toBe(true);
  });

  it('holds the threshold at ten milliseconds', () => {
    expect(NAVIGATION_WAITING_THRESHOLD_MS).toBe(10);
  });

  it('draws nothing for a navigation that ends inside the threshold', () => {
    const store = running();

    start(2);
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS - 1);
    end(2);
    vi.advanceTimersByTime(1_000);

    expect(store.waiting()).toBe(false);
  });

  it('takes the statement down when the screen opens', () => {
    const store = running();

    start(2);
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS);
    end(2);

    expect(store.waiting()).toBe(false);
  });

  it('takes the statement down when the navigation is cancelled', () => {
    const store = running();

    start(2);
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS);
    cancel(2);

    expect(store.waiting()).toBe(false);
  });

  it('takes the statement down when the code never arrives', () => {
    const store = running();

    start(2);
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS);
    fail(2);

    expect(store.waiting()).toBe(false);
  });

  it('leaves one statement standing when a second navigation replaces the first', () => {
    const store = running();

    start(2);
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS);
    expect(store.waiting()).toBe(true);

    // The handover, in the order the router publishes it. The statement never
    // goes down between the two: it is removed by the navigation that is still
    // going, not by the one it replaced (FR-005).
    supersede(2);
    expect(store.waiting()).toBe(true);

    start(3, '/equipment');
    expect(store.waiting()).toBe(true);

    end(3, '/equipment');
    expect(store.waiting()).toBe(false);
  });

  it('takes the statement down when the navigation taking over is skipped', () => {
    const store = running();

    start(2);
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS);
    expect(store.waiting()).toBe(true);

    // The handover has no navigation behind it: the address it hands over to is
    // the one the router is already at, so the router says it skipped it and
    // starts nothing. Nothing is going to end, so the skip is what takes the
    // statement down — it never outlives what raised it (FR-005).
    supersede(2);
    skip(3);

    expect(store.waiting()).toBe(false);
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS * 10);
    expect(store.waiting()).toBe(false);
    // A skip is not a failure: it presented no screen and asked for nothing.
    expect(store.failed()).toBe(false);
  });

  it('answers the navigation after a handover that was skipped', () => {
    const store = running();

    start(2);
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS);
    supersede(2);
    skip(3);

    // The session is still running, so the next navigation is stated like any
    // other: nothing stands until it has run for the threshold. A statement
    // still standing here would be the skipped handover's, adopted by a
    // navigation that never raised one.
    start(4, '/equipment');
    expect(store.waiting()).toBe(false);

    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS);
    expect(store.waiting()).toBe(true);

    end(4, '/equipment');
    expect(store.waiting()).toBe(false);
  });

  it('states a navigation that took over before the first was worth stating', () => {
    const store = running();

    // Handed over inside the threshold, so nothing was standing to carry. The
    // navigation that took over is measured like any other.
    start(2);
    supersede(2);
    start(3, '/equipment');
    expect(store.waiting()).toBe(false);

    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS);
    expect(store.waiting()).toBe(true);
  });

  it('draws nothing over a first presentation that was handed over', () => {
    const store = TestBed.inject(NavigationWaitingStore);

    // A first navigation replaced before it arrived is a first presentation
    // that has still not arrived. What takes over draws nothing over it
    // (FR-008).
    start(1);
    supersede(1);
    start(2, '/equipment');
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS * 10);

    expect(store.waiting()).toBe(false);
  });

  it('draws nothing over a first presentation whose handover was skipped', () => {
    const store = TestBed.inject(NavigationWaitingStore);

    // The same first presentation, where what took the handover over was the
    // address the router is already at. It presented nothing either, so the
    // session has still not started and the navigation after it is still the
    // one that will present first (FR-008).
    start(1);
    supersede(1);
    skip(2);
    start(3, '/equipment');
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS * 10);

    expect(store.waiting()).toBe(false);
  });

  it('measures a later navigation by the same threshold', () => {
    const store = running();

    start(2);
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS);
    end(2);
    start(3, '/equipment');
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS - 1);

    expect(store.waiting()).toBe(false);

    vi.advanceTimersByTime(1);

    expect(store.waiting()).toBe(true);
  });

  it('states a navigation that failed', () => {
    const store = running();

    start(2);
    fail(2);

    expect(store.failed()).toBe(true);
  });

  it('states nothing about a navigation that was cancelled', () => {
    const store = running();

    start(2);
    cancel(2);

    expect(store.failed()).toBe(false);
  });

  it('carries the statement to the navigation a redirect sends the Commander to', () => {
    const store = running();

    start(2);
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS);
    expect(store.waiting()).toBe(true);

    // The other handover. A guard answering with an address rather than a yes
    // or a no cancels the navigation it was asked about and the router starts
    // the one it named — the same shape as a second press, and the same
    // reading: one statement, standing until the navigation that took over
    // ends (FR-005).
    //
    // Driven here rather than in a browser because the route table declares no
    // guard that redirects, so the application cannot produce this cancellation
    // today. The router can, and the requirement covers it, so the store reads
    // it rather than waiting to be surprised.
    events.next(
      new NavigationCancel(2, '/outfitting', 'redirect', NavigationCancellationCode.Redirect),
    );
    expect(store.waiting()).toBe(true);

    start(3, '/equipment');
    expect(store.waiting()).toBe(true);

    end(3, '/equipment');
    expect(store.waiting()).toBe(false);
    expect(store.failed()).toBe(false);
  });

  it('takes the statement down on a navigation that was redirected, and states no failure', () => {
    const store = running();

    // A redirect the route table declares ends at the address it resolved to.
    // It is an ordinary ending: the statement comes down with it, and nothing
    // is said about it.
    //
    // This is where the redirect is read. The one redirect the application
    // declares is reached by typing an address, which makes it the navigation
    // that starts a session — so no journey in a browser can raise a statement
    // over it to take down.
    start(2, '/nowhere');
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS + 1);
    expect(store.waiting()).toBe(true);

    events.next(new NavigationEnd(2, '/nowhere', '/'));

    expect(store.waiting()).toBe(false);
    expect(store.failed()).toBe(false);
  });

  it('takes the failure down on the next navigation that presents a screen', () => {
    const store = running();

    start(2);
    fail(2);
    start(3, '/equipment');
    end(3, '/equipment');

    expect(store.failed()).toBe(false);
  });

  it('counts each failure, so a second one is a second event', () => {
    const store = running();

    // The count is what the shell announces by. Announcing is deduped on
    // `(kind, revision, urgency)`, and a boolean carries no revision — two
    // separate failures would be one event, and the second would be the
    // silence this requirement exists to remove (018/FR-007).
    start(2);
    fail(2);
    expect(store.failures()).toBe(1);

    start(3, '/equipment');
    end(3, '/equipment');
    expect(store.failed()).toBe(false);
    expect(store.failures()).toBe(1);

    start(4);
    fail(4);
    expect(store.failed()).toBe(true);
    expect(store.failures()).toBe(2);
  });

  it('carries no reason for the failure', () => {
    const store = running();

    start(2);
    fail(2);

    // Whether, and nothing else. The router reports a failed navigation, not a
    // diagnosis, and a reason the application does not have is one it may not
    // state (constitution IV).
    expect(store.failed()).toBe(true);
    // The closed list is the reading: whether, how many, and nothing that could
    // carry a reason. Sorted, because what the store exposes is the point and
    // the order it declares them in is not.
    expect(Object.keys(store).sort()).toEqual(['failed', 'failures', 'waiting']);
  });

  it('draws nothing over the arrival that starts the session', () => {
    const store = TestBed.inject(NavigationWaitingStore);

    start(1, '/');
    vi.advanceTimersByTime(10_000);

    expect(store.waiting()).toBe(false);
  });

  it('answers the navigation after that one', () => {
    const store = TestBed.inject(NavigationWaitingStore);

    start(1, '/');
    end(1, '/');
    start(2);
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS);

    expect(store.waiting()).toBe(true);
  });

  it('states a first navigation that fails, like any other', () => {
    const store = TestBed.inject(NavigationWaitingStore);

    start(1, '/outfitting');
    fail(1, '/outfitting');

    expect(store.waiting()).toBe(false);
    expect(store.failed()).toBe(true);
  });
});
