import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
  type Event as RouterEvent,
} from '@angular/router';
import { NAVIGATION_WAITING_THRESHOLD_MS, NavigationWaiting } from './navigation-waiting.store';

/**
 * What the application says between asking for a screen and getting it.
 *
 * Driven by router events rather than by real navigations: the behaviour under
 * test is which ending means what and when the threshold has passed, and both
 * are exact where a real chunk fetch is not.
 */
describe('NavigationWaiting', () => {
  const events = new Subject<RouterEvent>();

  /** Every event the store reads, in the order the router publishes them. */
  const start = (id: number, url = '/outfitting') => events.next(new NavigationStart(id, url));
  const end = (id: number, url = '/outfitting') => events.next(new NavigationEnd(id, url, url));
  const cancel = (id: number, url = '/outfitting') =>
    events.next(new NavigationCancel(id, url, 'cancelled'));
  const skip = (id: number, url = '/outfitting') =>
    events.next(new NavigationSkipped(id, url, 'skipped'));
  const fail = (id: number, url = '/outfitting') =>
    events.next(new NavigationError(id, url, new Error('chunk')));

  /**
   * A store already past the arrival that started the session.
   *
   * Nothing is drawn over a session's first presentation, so most of what this
   * store does only happens from the second navigation onward.
   */
  function running(): NavigationWaiting {
    const store = TestBed.inject(NavigationWaiting);
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

  it('takes the statement down when the navigation is skipped', () => {
    const store = running();

    start(2);
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS);
    skip(2);

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

    // The order the router publishes: the second navigation starts, and the
    // first is cancelled by it afterwards.
    start(2);
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS);
    start(3, '/equipment');
    cancel(2);
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS);

    expect(store.waiting()).toBe(true);

    end(3, '/equipment');

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

  it('carries no reason for the failure', () => {
    const store = running();

    start(2);
    fail(2);

    // Whether, and nothing else. The router reports a failed navigation, not a
    // diagnosis, and a reason the application does not have is one it may not
    // state (constitution IV).
    expect(store.failed()).toBe(true);
    expect(typeof store.failed()).toBe('boolean');
  });

  it('draws nothing over the arrival that starts the session', () => {
    const store = TestBed.inject(NavigationWaiting);

    start(1, '/');
    vi.advanceTimersByTime(10_000);

    expect(store.waiting()).toBe(false);
  });

  it('answers the navigation after that one', () => {
    const store = TestBed.inject(NavigationWaiting);

    start(1, '/');
    end(1, '/');
    start(2);
    vi.advanceTimersByTime(NAVIGATION_WAITING_THRESHOLD_MS);

    expect(store.waiting()).toBe(true);
  });

  it('states a first navigation that fails, like any other', () => {
    const store = TestBed.inject(NavigationWaiting);

    start(1, '/outfitting');
    fail(1, '/outfitting');

    expect(store.waiting()).toBe(false);
    expect(store.failed()).toBe(true);
  });
});
