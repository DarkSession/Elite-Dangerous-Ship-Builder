import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';

/** The mounts the package populates on every hull, whatever else is fitted. */
const FIXED_KINDS = ['armour', 'core', 'cargoHatch'] as const;

/**
 * The fixed mounts a loadout arrived without, by slot key.
 *
 * Every path that produces a build — creating a stock one, opening a record,
 * decoding a link — gets its fixed mounts from the package's own construction
 * and checks them here. The check is not a repair: an empty fixed mount means
 * the released package stopped guaranteeing something this application relies
 * on, and the build is refused rather than patched up from a display index
 * (build-link contract, "Ingress pipeline", step 5).
 */
export function emptyFixedMounts(loadout: ShipLoadout): readonly string[] {
  return FIXED_KINDS.flatMap((kind) => loadout.slots(kind))
    .filter((slot) => slot.module === null)
    .map((slot) => slot.key);
}
