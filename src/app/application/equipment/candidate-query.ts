import { PERSONAL_WEAPONS } from '@elite-dangerous-almanac/core/equipment/weapons';
import { PERSONAL_MODIFICATIONS } from '@elite-dangerous-almanac/core/equipment/modifications';
import { SUITS } from '@elite-dangerous-almanac/core/equipment/suits';
import type { PersonalMountKey } from '@elite-dangerous-almanac/core/equipment/suits';
import type { EquipmentLoadout } from '../../domain/equipment/loadout-link/equipment-loadout';
import {
  MODIFICATION_SLOT_COUNT,
  resolveForWeapon,
  slotsOf,
  type EditTarget,
} from '../../domain/equipment/loadout/loadout-edit';
import { CATALOGUE_MOUNTS, mountPosition } from '../../domain/equipment/loadout/loadout-mounts';

/** One recipe a slot accepts, and whether this item already holds it. */
export interface ModificationCandidate {
  /** The recipe key `PERSONAL_MODIFICATIONS` is keyed by. */
  readonly symbol: string;
  /** True when another slot on this item already holds it (FR-009). */
  readonly fitted: boolean;
}

/**
 * What the bench may offer, so nothing it offers can produce an impossible
 * loadout.
 *
 * Every list is the package's own, filtered by the package's own facts: a
 * mount's kind, a recipe's target, and the pairing
 * `resolvePersonalModificationForWeapon` settles. Nothing here is a list this
 * repository keeps.
 */

/** Every suit the release publishes, by family, in catalogue order (FR-001). */
export function suitCandidates(): readonly string[] {
  return SUITS.map((suit) => suit.family);
}

/**
 * The weapons one mount accepts: those whose `slot` is the mount's kind.
 *
 * The mount's own kind and never the whole catalogue, so a rifle is never
 * offered for a sidearm mount (FR-003, FR-004).
 */
export function weaponCandidates(mount: PersonalMountKey): readonly string[] {
  const kind = CATALOGUE_MOUNTS[mountPosition(mount)]?.kind;
  if (kind === undefined) return [];
  return PERSONAL_WEAPONS.filter((weapon) => weapon.slot === kind).map((weapon) => weapon.symbol);
}

/**
 * The recipes one modification slot accepts, each marked if it is already on
 * this item.
 *
 * A three-technology recipe is offered as the one spelling this weapon takes,
 * never as three (FR-015). A recipe held in another slot of the same item is
 * offered and marked rather than hidden: it is why the slot cannot take it, and
 * a list that dropped it would leave a Commander looking for something the game
 * says they already have (FR-009).
 *
 * A slot the item's grade has not unlocked accepts nothing: it is drawn, it
 * keeps what it holds, and it does not open a chooser (FR-008, FR-011).
 */
export function modificationCandidates(
  loadout: EquipmentLoadout,
  target: EditTarget,
  slot: number,
): readonly ModificationCandidate[] {
  if (!Number.isInteger(slot) || slot < 0 || slot >= MODIFICATION_SLOT_COUNT) return [];
  const slots = slotsOf(loadout, target);
  if (slots === null) return [];

  const symbols = offered(loadout, target);
  return symbols.map((symbol) => ({
    symbol,
    fitted: slots.some((held, index) => held === symbol && index !== slot),
  }));
}

function offered(loadout: EquipmentLoadout, target: EditTarget): readonly string[] {
  const recipes = Object.entries(PERSONAL_MODIFICATIONS);
  if (target === 'suit') {
    return recipes.filter(([, recipe]) => recipe.target === 'suit').map(([symbol]) => symbol);
  }
  const fitted = loadout.weapons[mountPosition(target)];
  if (fitted == null) return [];
  return recipes
    .filter(([, recipe]) => recipe.target === 'weapon')
    .map(([symbol]) => symbol)
    .filter((symbol) => resolveForWeapon(fitted.symbol, symbol) === symbol);
}
