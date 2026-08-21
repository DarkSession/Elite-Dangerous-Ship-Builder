import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { NO_SLOT_CAPABILITIES, type SlotCapabilities } from './outfitting-state';
import type { SlotView } from './slot-view';

/**
 * What the package currently permits on one mount.
 *
 * Every answer is read from the package, now — not remembered from when the
 * ledger was drawn, and not derived from anything about the slot's name or its
 * module's symbol. There is no cargo-hatch branch in this file: the hatch ends
 * up with power controls and nothing else because `modulesForSlot` comes back
 * empty, `availableBlueprints` comes back empty and `removable` is false, which
 * is the package saying so (FR-009, research "Decision 4").
 *
 * `packageEmpty` and `canFitSelection` are kept apart on purpose. A chooser
 * that opened and found the package offers nothing is a successful, worthwhile
 * answer; it is not a fit action, and offering one would be an action with
 * nothing behind it (module-catalogue contract, "Membership").
 */
export function slotCapabilities(loadout: ShipLoadout, slot: SlotView): SlotCapabilities {
  const candidates = loadout.modulesForSlot(slot.key);
  const packageEmpty = candidates.length === 0;
  const fitted = slot.module !== null;

  return {
    ...NO_SLOT_CAPABILITIES,
    canOpenReplacement: !packageEmpty,
    canFitSelection: !packageEmpty,
    canRemove: slot.removable && fitted,
    // Engineering needs a fitted module *and* a menu. A mount the package
    // offers no blueprint for opens no editor, rather than opening an empty one.
    canOpenEngineering: fitted && loadout.availableBlueprints(slot.key).length > 0,
    // Power belongs to whatever is fitted, including the cargo hatch — which is
    // exactly what the canvas draws for it.
    canSetEnabled: fitted,
    canSetPriority: fitted,
    packageEmpty,
  };
}
