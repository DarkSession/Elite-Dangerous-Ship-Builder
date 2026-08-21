import type {
  ImmovableReason,
  LoadoutSlot,
  ShipLoadout,
} from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { SlotKind, SlotRestriction } from '@elite-dangerous-almanac/core/ships/slots';
import type { GameTextPresentation } from '../../i18n/game-text.presenter';
import {
  fittedModuleView,
  type FittedModuleView,
  type ModuleTextResolver,
} from './fitted-module-view';

/**
 * One mount, as a screen sees it.
 *
 * Two names, deliberately. `canonicalName` is `LoadoutSlot.name`, which the
 * package documents as canonical English and *not* the active-locale label;
 * `displayName` is what `getLoadoutSlotName` returns for the Commander's
 * language, with the untranslated disclosure where the package has no
 * translation. Rendering the first as though it were the second would quietly
 * ship English into a German screen (research, "Decision 3").
 *
 * `key` is the exact game slot key and is the only identity anything uses. It
 * is not visible text — the canvas draws `SIZE · NODE NO.` in the ledger and
 * `FITTING · HARDPOINT 1` at the bench — but it is what the anatomy and the
 * ledger exchange, and it is available to assistive technology beside the drawn
 * label (reference review, "Visible slot key").
 */
export interface SlotView {
  readonly key: string;
  readonly canonicalName: string;
  readonly displayName: GameTextPresentation;
  readonly kind: SlotKind;
  /** The package's own number. `null` where the package publishes none. */
  readonly size: number | null;
  readonly restriction: SlotRestriction | null;
  readonly restrictionText: GameTextPresentation | null;
  readonly module: FittedModuleView | null;
  readonly removable: boolean;
  readonly immovableReason: ImmovableReason | null;
  /**
   * The mount's position within its kind, one-based.
   *
   * The canvas's `NODE NO.` — a hardpoint's number on the hull anatomy. It is a
   * *display* ordinal for the label the design draws, and it is never an
   * identity: nothing is looked up, selected or edited by it, because on ten
   * hulls the game's own numbering does not follow position (FR-002).
   */
  readonly node: number;
}

/**
 * How package text is resolved for the active locale.
 *
 * One resolver rather than two, because a slot view is not complete without its
 * module's name and splitting the two would mean every caller passing the same
 * presenter twice. `GameTextPresenter` satisfies it as it stands.
 */
export interface SlotTextResolver extends ModuleTextResolver {
  slotName(slot: LoadoutSlot): GameTextPresentation;
  slotRestrictionLabel(restriction: SlotRestriction): GameTextPresentation;
}

/**
 * Every mount on the build, in the package's own outfitting order.
 *
 * Order comes from `slots()` and is not re-sorted. The package groups hardpoints
 * before utility before armour before core before optional before the cargo
 * hatch, which is the order the outfitting screen uses, and reordering it here
 * would make the ledger disagree with the game for no reason.
 */
export function slotViews(loadout: ShipLoadout, text: SlotTextResolver): readonly SlotView[] {
  const nodes = new Map<SlotKind, number>();

  return loadout.slots().map((slot) => {
    const node = (nodes.get(slot.kind) ?? 0) + 1;
    nodes.set(slot.kind, node);
    return slotView(slot, text, node);
  });
}

/** One mount's view. */
export function slotView(slot: LoadoutSlot, text: SlotTextResolver, node: number): SlotView {
  const restriction = restrictionOf(slot);

  return {
    key: slot.key,
    canonicalName: slot.name,
    displayName: text.slotName(slot),
    kind: slot.kind,
    // Utility and armour mounts publish `0` as a placeholder because their fit
    // rules are not size-based. A zero drawn as a size would be a fact nobody
    // stated, so it becomes an absence instead.
    size: slot.size > 0 ? slot.size : null,
    restriction,
    restrictionText: restriction === null ? null : text.slotRestrictionLabel(restriction),
    module: slot.module === null ? null : fittedModuleView(slot.module, text),
    removable: slot.removable,
    immovableReason: slot.immovableReason ?? null,
    node,
  };
}

/**
 * The family a mount is limited to, when it is limited to one.
 *
 * Read off the package's discriminated slot rather than off the key: the
 * journal spells `vesselHangar` as `FighterBay01`, and a rule derived from the
 * spelling would be an application-owned fitting rule (constitution II).
 */
function restrictionOf(slot: LoadoutSlot): SlotRestriction | null {
  if (slot.kind === 'hardpoint' || slot.kind === 'optional') {
    return slot.restriction ?? null;
  }
  return null;
}
