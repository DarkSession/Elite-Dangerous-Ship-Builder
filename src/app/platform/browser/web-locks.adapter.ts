import { DOCUMENT, Injectable, inject } from '@angular/core';

/**
 * Short exclusive locks around named-record writes.
 *
 * Web Storage has no compare-and-swap, so two pages saving the same named
 * record can interleave read and write and lose one version. A short exclusive
 * lock closes that window; the revision precondition inside it is what actually
 * decides the outcome.
 *
 * When the API is absent the adapter says so rather than pretending: an
 * unavailable lock makes in-place overwrite unavailable, and keep-both and
 * cancel remain (persistence contract, "Named operations and conflicts"). A
 * silent no-op lock would be worse than no lock, because the code above it
 * would believe it was protected.
 */
@Injectable({ providedIn: 'root' })
export class WebLocksAdapter {
  readonly #locks = inject(DOCUMENT).defaultView?.navigator?.locks ?? null;

  /** Whether exclusive locking is actually available in this browser. */
  get available(): boolean {
    return this.#locks !== null && typeof this.#locks.request === 'function';
  }

  /**
   * Runs `operation` while holding `name` exclusively.
   *
   * No dialog is ever shown inside one of these: a lock held across a
   * Commander's decision blocks every other page for as long as they take to
   * decide.
   */
  async request<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const locks = this.#locks;
    if (!locks) {
      throw new LocksUnavailableError();
    }
    return (await locks.request(name, { mode: 'exclusive' }, () => operation())) as T;
  }
}

/** Raised when an operation that requires a lock is attempted without one available. */
export class LocksUnavailableError extends Error {
  constructor() {
    super('Web Locks are unavailable, so this write cannot be made safely.');
    this.name = 'LocksUnavailableError';
  }
}
