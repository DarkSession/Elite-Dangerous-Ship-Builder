import { Injectable, signal } from '@angular/core';

/**
 * The count the command bar shows beside the screen's own name.
 *
 * The reference puts one number there and nowhere else — "48 SHIPS" on the
 * shipyard — so the screen that owns the number publishes it and the shell
 * renders it (canvas 1a/1b, "Command bar"). The screen's name itself is
 * already the page name the route title strategy publishes; this adds only
 * what the bar carries beside it.
 *
 * Pure presentation. Nothing here is build state and nothing is persisted.
 */
@Injectable({ providedIn: 'root' })
export class ScreenChrome {
  readonly #count = signal<string | null>(null);

  /** The current screen's count, already a localized string, or none. */
  readonly count = this.#count.asReadonly();

  setCount(count: string | null): void {
    this.#count.set(count);
  }
}
