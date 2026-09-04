import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { EquipmentLoadout } from '../../domain/equipment/loadout-link/equipment-loadout';
import type { ActiveBuildState } from '../active-build/active-build.models';

/**
 * Everything the application knows that a build link must never carry.
 *
 * Named individually rather than described, so the guarantee is testable: each
 * of these is a field of the application's own state, and none of them
 * describes the build the codec encodes. A note is private to one browser, a
 * record id is meaningless in anyone else's, a validation snapshot is the
 * package's verdict at a past instant, and a save name is a label rather than
 * a part of the ship (build-link contract, "Payload boundary").
 */
export const FIELDS_EXCLUDED_FROM_LINKS = [
  'hullName',
  'provenance',
  'autosaveRecordId',
  'sourceNamed',
  'baselineFingerprint',
  'dirty',
  'persistence',
  'link',
  'qualityCompletionNotices',
] as const satisfies readonly (keyof ActiveBuildState)[];

/**
 * The only thing publication is allowed to see.
 *
 * Publication reads the build through this function and through nothing else,
 * which is what makes "a note edit does not change the link" true by
 * construction rather than by remembering: the note is not reachable from what
 * the encoder is given.
 */
export function linkPayloadSource(state: ActiveBuildState): ShipLoadout | null {
  return state.loadout;
}

/**
 * Everything the bench knows that a loadout link must never carry.
 *
 * The same guarantee as the build's, over a smaller store. Which item the item
 * view is showing is workflow, the record a loadout was opened from is
 * meaningless in anyone else's browser, and the undo tape is this session's
 * (013 contracts/equipment-loadout-link.md).
 */
export const FIELDS_EXCLUDED_FROM_EQUIPMENT_LINKS = [
  'selected',
  'source',
  'revision',
  'canUndo',
  'canRedo',
] as const;

/**
 * The only thing the bench's publication is allowed to see.
 *
 * The loadout itself: a suit, its grade, what is on each catalogue mount and
 * what is in each modification slot. Nothing the package can answer is carried,
 * because nothing the package can answer is reachable from here.
 */
export function equipmentLinkPayloadSource(
  loadout: EquipmentLoadout | null,
): EquipmentLoadout | null {
  return loadout;
}
