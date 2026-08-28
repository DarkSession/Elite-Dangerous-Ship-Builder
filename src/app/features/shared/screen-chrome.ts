import { Injectable, computed, signal } from '@angular/core';
import type {
  ScreenIdentity,
  ScreenReturn,
  ShellAction,
} from '../../ui/components/app-frame/app-frame';
import type { IdentityCommit, IdentityField } from '../../ui/outfitting/ship-identity-fields';

/** The identity block one screen publishes, and what editing it does. */
export interface ScreenIdentityChannel {
  readonly identity: ScreenIdentity;
  readonly open: (field: IdentityField) => void;
  readonly close: () => void;
  readonly commit: (commit: IdentityCommit) => void;
}

/** One command-bar action, and what activating it does. */
export interface ScreenAction {
  readonly action: ShellAction;
  readonly perform: () => void;
}

/**
 * What the command bar shows for the screen that is open.
 *
 * The reference puts one number there and nowhere else — "48 SHIPS" on the
 * shipyard — so the screen that owns the number publishes it and the shell
 * renders it (canvas 1a/1b, "Command bar"). The screen's name itself is
 * already the page name the route title strategy publishes; this adds only
 * what the bar carries beside it.
 *
 * The actions are here for the same reason. The reference draws `↶ UNDO`,
 * `REDO ↷`, `EXPORT` and `SAVE` in the command bar at wide width and in the
 * folded bar's overflow menu — the frame already renders both
 * placements from one list, so a screen publishes its actions and the shell
 * places them. A second pair of buttons drawn inside the page would be the
 * same actions twice, in a place neither canvas puts them (canvas 1c's command
 * bar, canvas 1d's `⋮` menu).
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

  /**
   * What the open screen currently offers, in the order the canvas draws them.
   *
   * Two channels rather than one because two components publish into the same
   * bar: canvas 1c draws `↶ UNDO  REDO ↷` — the outfitting region's — and then
   * `EXPORT  SAVE`, which belong to the screen that owns the build. A single
   * list would let whichever effect ran last erase the other's.
   */
  readonly actions = computed(() => {
    const region = this.#regionActions().map((entry) => entry.action);
    const screen = this.#actions().map((entry, index) =>
      index === 0 && region.length > 0 ? { ...entry.action, startsGroup: true } : entry.action,
    );
    return [...region, ...screen];
  });

  setActions(actions: readonly ScreenAction[]): void {
    this.#actions.set(actions);
  }

  /** What a capability region composed into the screen offers, drawn first. */
  setRegionActions(actions: readonly ScreenAction[]): void {
    this.#regionActions.set(actions);
  }

  /**
   * Runs the published action with this id, and says whether there was one.
   *
   * The shell asks rather than deciding: it knows an action was activated and
   * nothing about what it means, which is what keeps navigation intents and a
   * screen's own actions from having to know about each other.
   */
  select(id: string): boolean {
    const entry = [...this.#regionActions(), ...this.#actions()].find(
      (candidate) => candidate.action.id === id,
    );
    entry?.perform();
    return entry !== undefined;
  }

  readonly #actions = signal<readonly ScreenAction[]>([]);
  readonly #regionActions = signal<readonly ScreenAction[]>([]);

  readonly #return = signal<ScreenReturn | null>(null);

  /**
   * The compact bar a screen opened over another one publishes, where one does.
   *
   * Only the hull sheet publishes it today: canvas 1b replaces the shipyard's
   * bar with the sheet's own while the sheet is up. It is presentation, like
   * the count and the actions beside it, and the frame decides at which width
   * it is drawn at all.
   */
  readonly return = this.#return.asReadonly();

  setReturn(layer: ScreenReturn | null): void {
    this.#return.set(layer);
  }

  readonly #identity = signal<ScreenIdentityChannel | null>(null);

  /** The open screen's identity block, for the frame to draw. */
  readonly identity = computed(() => this.#identity()?.identity ?? null);

  setIdentity(channel: ScreenIdentityChannel | null): void {
    this.#identity.set(channel);
  }

  openIdentity(field: IdentityField): void {
    this.#identity()?.open(field);
  }

  closeIdentity(): void {
    this.#identity()?.close();
  }

  commitIdentity(commit: IdentityCommit): void {
    this.#identity()?.commit(commit);
  }
}
