import { Injectable, computed, signal } from '@angular/core';

/**
 * Where an open request came from.
 *
 * There is one entry — the frame's own action — so `global` is the only kind
 * the application can currently produce. It stays a discriminated union rather
 * than becoming a bare flag because the shape is what a second entry would
 * extend, and a union with one member costs nothing to keep honest.
 *
 * It never reaches the route, the fragment, history, storage or a build.
 */
export type HelpInvocationContext = { readonly kind: 'global' };

/** Whether the shared modal is on screen, and what asked for it. */
export type HelpDialogState =
  | { readonly status: 'closed' }
  | { readonly status: 'open'; readonly invocation: HelpInvocationContext };

const CLOSED: HelpDialogState = { status: 'closed' };

/**
 * Whether help is open. That is the whole of this store's state.
 *
 * Help is a view of build-time facts: there is nothing to load, nothing to
 * save and nothing to recover. So the store holds one signal and touches
 * nothing else — no Router, no History, no URL, no storage, no build. Opening
 * help in the middle of outfitting a ship has to leave the ship exactly as it
 * was, and the cheapest way to guarantee that is to have no way to change it.
 *
 * It is deliberately not routed. A help address would put the modal in history,
 * make Back close it and make a shared link open it over a screen the sender
 * never saw — three behaviours the reference draws none of.
 */
@Injectable({ providedIn: 'root' })
export class HelpDialogStore {
  readonly #state = signal<HelpDialogState>(CLOSED);

  readonly state = this.#state.asReadonly();

  readonly open = computed(() => this.#state().status === 'open');

  /** What asked for the open modal, or `null` while it is closed. */
  readonly invocation = computed(() => {
    const state = this.#state();
    return state.status === 'open' ? state.invocation : null;
  });

  /**
   * Opens the modal, or replaces the invocation of an already-open one.
   *
   * Replacing rather than refusing means a second request while open is not an
   * error state to design for: the modal is already showing everything either
   * request would have shown.
   */
  openDialog(invocation: HelpInvocationContext = { kind: 'global' }): void {
    this.#state.set({ status: 'open', invocation });
  }

  /**
   * Closes the modal. Closing a closed modal is not an event.
   *
   * It takes no reason. The data model's transition once carried one, and
   * nothing on either side of it could use it: the modal looks the same
   * whichever way it was closed, and a reason that reaches no reader, no
   * record and no branch is a field kept for its own sake.
   */
  closeDialog(): void {
    if (this.#state().status === 'closed') {
      return;
    }
    this.#state.set(CLOSED);
  }
}
