import { SUITS, getSuitByFamily } from '@elite-dangerous-almanac/core/equipment/suits';
import type {
  PersonalMount,
  PersonalMountKey,
} from '@elite-dangerous-almanac/core/equipment/suits';
import type { EquipmentLoadout } from '../loadout-link/equipment-loadout';

/**
 * What one mount is to the suit a Commander is wearing.
 *
 * - `offered` — the suit carries the mount. Its weapon is fittable and counts
 *   in every stated figure and in the material requirement.
 * - `held` — the suit does not carry the mount and a weapon is on it anyway.
 *   The weapon is named, counted in nothing, and back in effect the moment a
 *   suit carrying the mount is worn again (FR-007).
 * - `absent` — the suit does not carry the mount and nothing is on it. Nothing
 *   is drawn.
 */
export type MountAvailability = 'offered' | 'held' | 'absent';

/**
 * Every mount the catalogue offers, in the game's own order.
 *
 * The order is merged from the suits' own mount lists rather than sorted, so it
 * is the order the game lists mounts in and this application invents no
 * comparator for it: a key already seen fixes where the next new one goes.
 *
 * This is the live catalogue. The codec's `MOUNTS` is the same set frozen at a
 * table version, because what an already-published link says must not change
 * with the release that happens to be installed.
 */
export const CATALOGUE_MOUNTS: readonly PersonalMount[] = (() => {
  const mounts: PersonalMount[] = [];
  for (const suit of SUITS) {
    let at = 0;
    for (const mount of suit.mounts) {
      const seen = mounts.findIndex((known) => known.key === mount.key);
      if (seen >= 0) {
        at = seen + 1;
        continue;
      }
      mounts.splice(at, 0, mount);
      at += 1;
    }
  }
  return mounts;
})();

/** Where one mount key sits in a loadout's `weapons`, or `-1` when it is not a mount. */
export function mountPosition(key: PersonalMountKey): number {
  return CATALOGUE_MOUNTS.findIndex((mount) => mount.key === key);
}

/** Whether the suit a loadout names carries this mount. */
export function offers(suitFamily: string, key: PersonalMountKey): boolean {
  return getSuitByFamily(suitFamily)?.mounts.some((mount) => mount.key === key) ?? false;
}

/** What each catalogue mount is to this loadout, in `CATALOGUE_MOUNTS` order. */
export function mountAvailability(loadout: EquipmentLoadout): readonly MountAvailability[] {
  return CATALOGUE_MOUNTS.map((mount, position) => {
    if (offers(loadout.suitFamily, mount.key)) return 'offered';
    return loadout.weapons[position] == null ? 'absent' : 'held';
  });
}
