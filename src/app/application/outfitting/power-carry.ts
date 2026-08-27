import type { FittedModule, ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';

/**
 * A mount's power assignment, carried across an edit that resets it.
 *
 * Its own file because two operations need it and neither may import the other:
 * the chooser's fit lives in the store and the engineering panel's restore
 * lives in `engineering-draft.ts`, which the store already imports from.
 * Putting the pair in one place is also what stops the two answering
 * differently, which is how the restore came to reset a group the fit had
 * learned to keep (reported in review, 2026-08-27).
 */

/**
 * What a mount's power assignment is, as the two fields a Commander set.
 *
 * `undefined` on either means the build says nothing there, which is not the
 * same as saying the default: the package answers an absent priority as group 1
 * and an absent `on` as on, and writing either down would put a field in the
 * build nobody chose (FR-015).
 */
export interface CarriedPowerState {
  readonly on: boolean | undefined;
  readonly priority: number | undefined;
}

/** The mount's power assignment before a fit replaces what is in it. */
export function powerStateOf(fitted: FittedModule | null): CarriedPowerState {
  return { on: fitted?.on, priority: fitted?.priority };
}

/**
 * Puts a mount's power assignment back onto whatever was just fitted into it.
 *
 * `setModule` and `setPreEngineeredVariant` document a fit as a fresh mount —
 * "the slot's `On`, `Priority` and `Health` are reset. Set them again if your
 * screen keeps a priority group across a swap." This screen does: a Commander
 * who put their shield generator in group 3 and switched a heat sink off has
 * made a decision about the mount, not about the article that happened to be in
 * it, and a size upgrade is not a reason to undo it (Commander request
 * 2026-08-27). Engineering deliberately does not carry, and the difference is
 * the point: a blueprint is a job done to an article, and a priority group is
 * where a Commander decided that mount sits in the shed order.
 *
 * Called inside the fit's own operation, so the carry is the same package edit,
 * the same revision and the same history decision as the fit it belongs to.
 *
 * Nothing unstated is written. `health` is the third field the package resets
 * and the only one of the three no surface here reads or writes, so there is
 * nothing of a Commander's to carry.
 */
export function carryPower(
  candidate: ShipLoadout,
  slotKey: string,
  carried: CarriedPowerState,
): void {
  // The setter's own documented domain, and the reason this is a condition
  // rather than a straight call: it throws a `RangeError` outside `0`-`4`, and
  // a group the package does not recognize is not a group there is anything to
  // carry. Dropping it leaves the fit standing; passing it would refuse the fit
  // over a value no Commander here set.
  if (
    carried.priority !== undefined &&
    Number.isInteger(carried.priority) &&
    carried.priority >= 0 &&
    carried.priority <= 4
  ) {
    candidate.setModulePriority(slotKey, carried.priority);
  }

  // Only an explicit off. An absent or `true` `on` already reads as on, so
  // writing `true` would add a field rather than preserve a state.
  if (carried.on === false) {
    candidate.setModuleEnabled(slotKey, false);
  }
}
