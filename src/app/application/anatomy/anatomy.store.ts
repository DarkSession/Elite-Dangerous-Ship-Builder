import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import {
  SCHEMATIC_SIDES,
  type SchematicSide,
  type SideAssetState,
} from '../../domain/ships/anatomy/anatomy-model';
import { projectAnatomy, type SideStates } from '../../domain/ships/anatomy/anatomy-projector';
import { AlmanacSchematicLoader } from '../../platform/assets/almanac-schematic-loader';
import { ConnectivityAdapter } from '../../platform/browser/connectivity.adapter';
import { ActiveBuildStore } from '../active-build/active-build.store';
import { OutfittingStore } from '../outfitting/outfitting.store';

/** Both sides, before anything has been asked for. */
const UNREQUESTED: SideStates = { top: { kind: 'loading' }, bottom: { kind: 'loading' } };

/**
 * The two schematics the active hull is drawn on, and which of them is shown.
 *
 * This store owns three things and no more: the state of each side's asset, the
 * side a constrained layout is currently showing, and the projection joining
 * the two to feature 002's mounts. It holds no build, no selection and no
 * geometry of its own — selection is `OutfittingStore.selectedSlotKey`, and a
 * second one would be a second answer to "which mount is open".
 *
 * Nothing it owns is persisted. A side choice and an asset state are what this
 * session is looking at, not part of the build: none of it reaches storage,
 * history, the URL fragment, a build link or a SLEF export (FR-004 of feature
 * 004 and this feature's privacy assertions).
 */
@Injectable({ providedIn: 'root' })
export class AnatomyStore {
  readonly #active = inject(ActiveBuildStore);
  readonly #outfitting = inject(OutfittingStore);
  readonly #loader = inject(AlmanacSchematicLoader);
  readonly #connectivity = inject(ConnectivityAdapter);

  readonly #sides = signal<SideStates>(UNREQUESTED);
  readonly #shownSide = signal<SchematicSide>('top');

  /**
   * Which request each side's published state belongs to.
   *
   * One counter per side rather than one for the hull, because a retry of the
   * bottom side must not discard a top side still in flight. A completion whose
   * counter has moved on describes a hull, or an attempt, that is no longer the
   * one on screen, and is dropped rather than relabelled.
   */
  readonly #requests: Record<SchematicSide, number> = { top: 0, bottom: 0 };

  #inFlight: AbortController | null = null;

  /** The last selected key the reveal rule acted on, once it has a start. */
  #revealed: string | null = null;

  /**
   * Whether the reveal rule has a selection to compare against yet.
   *
   * A freshly opened build has a selected mount nobody chose — feature 002
   * opens on the first one — so revealing it would flip the shown side on
   * every hull whose first hardpoint happens to be underneath. The first
   * selection a hull sees is recorded rather than acted on.
   */
  #seeded = false;

  /**
   * The hull the schematics are for.
   *
   * Read off the loadout object rather than off a revision: an edit does not
   * change which hull this is, and re-fetching two schematics because a module
   * was fitted would be two requests for files already on screen.
   */
  readonly symbol = computed<string | null>(() => this.#active.loadout()?.shipSymbol ?? null);

  readonly sides = this.#sides.asReadonly();

  /** Every mount, and the occurrences each ready side draws. */
  readonly projection = computed(() => projectAnatomy(this.#outfitting.slots(), this.#sides()));

  /** The one selected identity, published by feature 002 and never a second one. */
  readonly selectedKey = this.#outfitting.selectedSlotKey;

  /** The side a single-plate layout shows. */
  readonly visibleSide = this.#shownSide.asReadonly();

  constructor() {
    // A new hull is a new pair of files. The previous hull's requests are
    // aborted rather than left to land, because a response that arrives after
    // the hull changed would draw the wrong ship.
    effect(() => {
      const symbol = this.symbol();
      untracked(() => this.#startBoth(symbol));
    });

    // Selecting a mount the shown side does not draw moves to a side that
    // does — the current one if it already does, otherwise top before bottom —
    // so activating a ledger row always reveals the mount it selected (FR-006).
    //
    // An effect rather than a derived value, because the shown side is also a
    // Commander's own choice. Recomputing it from the selection on every read
    // would snap the selector back the moment they pressed it, which is a
    // control that looks broken. A mount no side draws moves nothing: there is
    // no side to choose, and changing to one would suggest the mount is there.
    effect(() => {
      const key = this.selectedKey();
      const items = this.projection().items;

      untracked(() => {
        if (!this.#seeded) {
          this.#seeded = true;
          this.#revealed = key;
          return;
        }
        // Once per selection, not once per projection. A side finishing its
        // load changes the projection, and re-deciding the shown side there
        // would undo a choice the Commander made while it was loading.
        if (key === this.#revealed) {
          return;
        }
        const item = items.find((candidate) => candidate.key === key);
        // Not recorded as revealed: there is nowhere to reveal it *yet*, and
        // the side that draws it may still be on its way.
        if (item === undefined || item.sides.length === 0) {
          return;
        }
        this.#revealed = key;
        if (!item.sides.includes(this.#shownSide())) {
          this.#shownSide.set(item.sides[0]);
        }
      });
    });

    this.#connectivity.onOnline(() => this.retryUnavailable());
  }

  /** Chooses which side a single-plate layout shows. Spends no revision. */
  showSide(side: SchematicSide): void {
    this.#shownSide.set(side);
  }

  /**
   * Asks for one side again, after a failure a Commander can see.
   *
   * On the hull's own abort signal, like the first request: a retry left
   * running past a hull change is a request for a ship nobody is looking at.
   * Its result could not be published either way — the per-side counter has
   * already moved on — but not cancelling it spends the connection anyway.
   */
  retry(side: SchematicSide): void {
    const symbol = this.symbol();
    if (symbol !== null) {
      void this.#load(symbol, side, this.#inFlight?.signal);
    }
  }

  /**
   * Asks again for every side that did not arrive.
   *
   * Called on the browser's own `online` transition. A side rejected as a
   * package defect is deliberately not among them: the file arrived and was
   * wrong, and asking for it again returns the same wrong file.
   */
  retryUnavailable(): void {
    const sides = this.#sides();
    for (const side of SCHEMATIC_SIDES) {
      if (sides[side].kind === 'temporarilyUnavailable') {
        this.retry(side);
      }
    }
  }

  #startBoth(symbol: string | null): void {
    this.#inFlight?.abort();
    this.#inFlight = null;
    this.#sides.set(UNREQUESTED);
    this.#revealed = null;
    this.#seeded = false;

    // No build, no request. The capability is not on screen without one, and
    // fetching artwork for a hull nobody opened would be work nobody asked for.
    if (symbol === null) {
      for (const side of SCHEMATIC_SIDES) {
        this.#requests[side] += 1;
      }
      return;
    }

    this.#inFlight = new AbortController();
    for (const side of SCHEMATIC_SIDES) {
      void this.#load(symbol, side, this.#inFlight.signal);
    }
  }

  async #load(symbol: string, side: SchematicSide, signal?: AbortSignal): Promise<void> {
    const request = (this.#requests[side] += 1);
    this.#publish(side, { kind: 'loading' });

    const state = await this.#loader.load(symbol, side, signal);

    if (this.#requests[side] === request) {
      this.#publish(side, state);
    }
  }

  #publish(side: SchematicSide, state: SideAssetState): void {
    this.#sides.update((sides) => ({ ...sides, [side]: state }));
  }
}
