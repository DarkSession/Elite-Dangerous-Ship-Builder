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

/** One recipe a slot accepts. */
export interface ModificationCandidate {
  /** The recipe key `PERSONAL_MODIFICATIONS` is keyed by. */
  readonly symbol: string;
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
 * The recipes one modification slot accepts.
 *
 * A three-technology recipe is offered as the one spelling this weapon takes,
 * never as three (FR-015). A recipe already held in another slot of the same
 * item is not offered at all: the canvas listed it dimmed and marked `FITTED`
 * until its 2026-09-04 revision, which filters it out
 * (`lib.filter(m => !(list.indexOf(m[0]) > -1 && list.indexOf(m[0]) !== st.pick))`).
 * A list of things that cannot be chosen is a list a Commander reads twice, and
 * where the recipe went is a question the slot holding it already answers.
 * FR-009 is satisfied either way: it asks that no modification be offered twice
 * on one item.
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

  return offered(loadout, target)
    .filter((symbol) => !slots.some((held, index) => held === symbol && index !== slot))
    .map((symbol) => ({ symbol }));
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
