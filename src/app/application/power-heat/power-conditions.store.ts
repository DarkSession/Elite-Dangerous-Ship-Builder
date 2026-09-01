import { Injectable, computed, signal } from '@angular/core';
import {
  CAPACITOR_KINDS,
  type CapacitorKind,
  type DistributorPipAllocation,
  type HardpointState,
  type PowerConditions,
} from '../../domain/ships/power-heat/power-heat';

/** The fewest pips a bank can hold, and the most, as the artboard draws them. */
export const MIN_PIPS = 0;
export const MAX_PIPS = 4;

/**
 * The pips there are to go round, and the step the other two banks move in.
 *
 * Six between the three banks and four at most in any one of them — the game's
 * own allocation, and the one both canvases draw: `2`, `1` and `3` on 1c and
 * `3 · 1 · 2 PIPS` on 1d both come to six.
 *
 * A Commander assigns a **whole** pip to the bank being set. The other two pay
 * for it half a pip at a time, which is why the step exists at all: it is the
 * grid the two paying banks land on, never a value the control asks for.
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
   * Sets one bank to a whole pip count, and charges the other two for it.
   *
   * The ship's own rule, and the owner's ruling of 2026-08-25: a Commander
   * assigns whole pips, and each whole pip that moves into a bank costs the
   * other two **half a pip each**. A bank with nothing left to give pays
   * nothing and the other pays the lot, which is what makes `4 · 2 · 0` reachable
   * from `4 · 1 · 1` without a bank ever going negative. Taking pips back out of
   * a bank runs the same rule backwards: half a pip to each of the other two,
   * and all of it to one where the other is already full.
   *
   * The bank being set therefore always lands on a whole pip, and the two
   * paying for it land on the half step — which is exactly what the four blocks
   * draw, a filled block for a whole pip and a half-filled one for a half.
   *
   * Nothing here is a figure about the build: these are the pips the package is
   * then asked about, and it decides what they do to a recharge.
   */
  setPips(bank: CapacitorKind, pips: number): void {
    this.#pips.update((current) => {
      const target = toWholePip(pips);
      const [first, second] = CAPACITOR_KINDS.filter((kind) => kind !== bank);
      const [fromFirst, fromSecond] = share(
        target - current[bank],
        current[first],
        current[second],
      );

      return {
        ...current,
        [bank]: target,
        [first]: current[first] - fromFirst,
        [second]: current[second] - fromSecond,
      };
    });
  }
}

/**
 * What each of the other two banks gives up so one of them can move.
 *
 * `moved` is what the bank being set gains, so a positive figure is the two of
 * them paying and a negative one is the two of them being paid. Both are
 * returned in that same direction, so a caller subtracts either way.
 */
function share(
  moved: number,
  firstHas: number,
  secondHas: number,
): readonly [first: number, second: number] {
  const direction = Math.sign(moved);
  const owed = Math.abs(moved);

  // What each can actually part with in this direction: everything it holds
  // when it is paying, and everything it has room for when it is being paid.
  const firstCan = direction > 0 ? firstHas : MAX_PIPS - firstHas;
  const secondCan = direction > 0 ? secondHas : MAX_PIPS - secondHas;

  let first = toStep(owed / 2);
  let second = owed - first;

  // Half each will not divide on the step when the bank being set was standing
  // on a half, and one of the two has to carry the odd half. It falls on
  // whichever can better afford it rather than on whichever is named first.
  if (first !== second && firstCan < secondCan) {
    [first, second] = [second, first];
  }

  // A bank with less than its share gives what it has, and the other covers the
  // rest. It always can: six pips between three banks that hold four each leave
  // no allocation where neither of the two could.
  if (first > firstCan) {
    [first, second] = [firstCan, owed - firstCan];
  } else if (second > secondCan) {
    [first, second] = [owed - secondCan, secondCan];
  }

  return [direction * first, direction * second];
}

/** The whole pip a Commander assigns, inside what a bank can hold. */
function toWholePip(pips: number): number {
  return Math.min(MAX_PIPS, Math.max(MIN_PIPS, Math.round(pips)));
}

/** A pip count on the half step the two paying banks land on. */
function toStep(pips: number): number {
  return Math.round(pips / PIP_STEP) * PIP_STEP;
}
