import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';

/**
 * What a build carries.
 *
 * Two package figures, in the package's own units and unrounded: the hold in
 * tonnes and the fitted cabins' berths in passengers. Nothing here is derived
 * from the pair, because a figure made of two published figures is a figure the
 * Almanac did not publish (constitution II and IV).
 */
export interface BuildCapacity {
  /** The hold, in tonnes. */
  readonly cargoTonnes: number;
  /** The berths the fitted cabins hold, in passengers. */
  readonly passengerBerths: number;
}

/**
 * What the build in hand carries, read off the build.
 *
 * Both are facts a `ShipLoadout` already carries rather than calculations, so
 * they are properties rather than calls, and both always answer: no article the
 * catalogue cannot weigh reaches a build. A build with no rack and no cabin
 * carries `0` of each, which is the package's answer and not a substitute for
 * one (003/FR-023).
 *
 * A projection rather than two reads inside the component, so the package is
 * asked in one place and the answer is testable without rendering anything.
 */
export function projectCapacity(loadout: ShipLoadout): BuildCapacity {
  return {
    cargoTonnes: loadout.cargoCapacity,
    passengerBerths: loadout.passengerCapacity,
  };
}
