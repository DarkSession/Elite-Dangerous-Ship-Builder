import { Injectable, computed, signal } from '@angular/core';
import {
  CAPACITOR_KINDS,
  type CapacitorKind,
  type DistributorPipAllocation,
  type HardpointState,
  type PowerConditions,
} from '../../domain/power-heat/power-heat';

/** The fewest pips a bank can hold, and the most, as the artboard draws them. */
export const MIN_PIPS = 0;
export const MAX_PIPS = 4;

/**
 * The pips there are to go round, and the step they move in.
 *
 * Six between the three banks, four at most in any one of them, and half a pip
 * at a time — the game's own allocation, and the one both canvases draw: `2`,
 * `1` and `3` on 1c and `3 · 1 · 2 PIPS` on 1d both come to six.
 */
export const TOTAL_PIPS = 6;
export const PIP_STEP = 0.5;

/**
 * The allocation the dashboard opens on: even across the three banks.
 *
 * The artboard draws a different allocation in each canvas — two, one and three
 * on 1c, and another on 1d — so neither is *the* opening state. Even thirds are
 * the neutral one: it favours no bank, and it is the allocation the recharge
 * figures beside it are least surprising under.
 */
const OPENING_PIPS: DistributorPipAllocation = { systems: 2, engines: 2, weapons: 2 };

/**
 * The two conditions the power dashboard reads the package under.
 *
 * Both are questions about the build rather than changes to it: whether the
 * hardpoints are out, and how the pips are set. Neither reaches the loadout,
 * neither spends a revision, and neither is persisted — no storage, no history,
 * no URL fragment, no build link and no export. Reopening the workspace opens
 * on `deployed` and even pips again, because a Commander asking "what if the
 * hardpoints were out" is asking, not editing.
 *
 * There is no draft here, and no apply, reset, running total or error text.
 * Every change is immediate, and every allocation the control can reach is one
 * the package answers for — it takes any fraction from `0` to `4` per bank.
 * What it does not impose, and this does, is the six pips there are between the
 * three: setting one bank moves the other two, because that is what happens in
 * the ship.
 */
@Injectable({ providedIn: 'root' })
export class PowerConditionsStore {
  /**
   * Deployed, because that is the state the artboard opens both canvases in and
   * the only one the package publishes headroom, utilisation and a verdict for.
   */
  readonly #hardpoints = signal<HardpointState>('deployed');
  readonly #pips = signal<DistributorPipAllocation>(OPENING_PIPS);

  readonly hardpoints = this.#hardpoints.asReadonly();
  readonly pips = this.#pips.asReadonly();

  /** The pair the projection takes, so a reader never assembles it itself. */
  readonly conditions = computed<PowerConditions>(() => ({
    hardpoints: this.#hardpoints(),
    pips: this.#pips(),
  }));

  /** Reads the build with the hardpoints out, or stowed. */
  showHardpoints(state: HardpointState): void {
    this.#hardpoints.set(state);
  }

  /**
   * Sets one bank's pips, and takes them evenly from the other two.
   *
   * There are six pips and no more, so asking for a third in one bank takes one
   * from the rest: from `2 · 2 · 2`, three in systems leaves `1.5` in each of
   * the others. What is left over is split evenly between the two, which is the
   * rule as stated, and each lands on a half pip because that is the step the
   * ship moves in.
   *
   * Nothing here is a figure about the build: these are the pips the package is
   * then asked about, and it decides what they do to a recharge.
   */
  setPips(bank: CapacitorKind, pips: number): void {
    this.#pips.update((current) => {
      const target = toStep(pips);
      const [first, second] = CAPACITOR_KINDS.filter((kind) => kind !== bank);
      const spare = TOTAL_PIPS - target;

      // Half each, rounded to the step; the second takes the remainder, so the
      // three always come to six however the rounding fell. Both are held inside
      // the four a bank can hold, which the pair can always satisfy: the most
      // they are ever asked to carry between them is six.
      const held = Math.min(MAX_PIPS, Math.max(spare - MAX_PIPS, toStep(spare / 2)));

      return {
        ...current,
        [bank]: target,
        [first]: held,
        [second]: spare - held,
      };
    });
  }
}

/** A pip count on the half step the ship moves in, inside what a bank holds. */
function toStep(pips: number): number {
  const stepped = Math.round(pips / PIP_STEP) * PIP_STEP;
  return Math.min(MAX_PIPS, Math.max(MIN_PIPS, stepped));
}
