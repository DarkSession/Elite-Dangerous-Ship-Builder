import { Injectable, inject, signal } from '@angular/core';
import { ConnectivityAdapter } from '../../platform/browser/connectivity.adapter';

/** What is currently known about one hull's illustration. */
export type ArtworkState = 'loading' | 'available' | 'temporarily-unavailable';

/**
 * Hull illustrations, and what to do when one does not arrive.
 *
 * Artwork is decoration with a text equivalent, never a carrier of information,
 * so nothing here can block choosing a hull or creating a build (FR-006). The
 * one thing this coordinator adds beyond an `<img>` is recovery: an
 * illustration that could not be fetched while offline is retried when the
 * browser reports connectivity returning, rather than staying broken until the
 * Commander thinks to reload.
 *
 * Retrying is a new request rather than a cache bust: the asset is same-origin
 * and immutable, so the service worker's copy is exactly what we want if it has
 * one by then.
 */
@Injectable({ providedIn: 'root' })
export class ArtworkCoordinator {
  readonly #connectivity = inject(ConnectivityAdapter);

  readonly #states = signal<ReadonlyMap<string, ArtworkState>>(new Map());

  /** Bumped to force a fresh load attempt for everything unavailable. */
  readonly #attempt = signal(0);

  readonly attempt = this.#attempt.asReadonly();

  constructor() {
    this.#connectivity.onOnline(() => this.retryUnavailable());
  }

  /** The state of one hull's illustration. Unseen artwork is still loading. */
  stateOf(symbol: string): ArtworkState {
    return this.#states().get(symbol) ?? 'loading';
  }

  /** The whole map, as a signal, so a template recomputes when one changes. */
  readonly states = this.#states.asReadonly();

  markAvailable(symbol: string): void {
    this.#set(symbol, 'available');
  }

  /**
   * Records that an illustration did not arrive.
   *
   * "Temporarily": a same-origin asset that is missing right now is almost
   * always a network or cache state rather than a hull without artwork, and
   * saying "unavailable" flatly would be a stronger claim than we can make.
   */
  markUnavailable(symbol: string): void {
    this.#set(symbol, 'temporarily-unavailable');
  }

  /**
   * Tries every unavailable illustration again, without a page reload.
   *
   * Called on the browser's own `online` transition, and available as an
   * explicit action for a Commander who knows better than the browser does.
   */
  retryUnavailable(): void {
    const states = this.#states();
    const pending = [...states].filter(([, state]) => state === 'temporarily-unavailable');
    if (pending.length === 0) {
      return;
    }

    const next = new Map(states);
    for (const [symbol] of pending) {
      next.set(symbol, 'loading');
    }
    this.#states.set(next);
    this.#attempt.update((attempt) => attempt + 1);
  }

  #set(symbol: string, state: ArtworkState): void {
    const states = this.#states();
    if (states.get(symbol) === state) {
      return;
    }
    const next = new Map(states);
    next.set(symbol, state);
    this.#states.set(next);
  }
}
