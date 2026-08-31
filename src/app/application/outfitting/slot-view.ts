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
 * Every mount the ledger draws, in the order it draws them.
 *
 * The package groups hardpoints before utility before armour before core before
 * optional, and puts the cargo hatch last of all. Two things are this
 * application's, and both are stated in FR-002a rather than left to a reader of
 * this file. The hatch is drawn where its own category already puts it — after
 * the core internals and before the optional ones — because `CORE` counts it as
 * a core internal at both widths, and the complete list was the one place that
 * stood every optional mount between the two. The planetary approach mount is
 * not drawn at all.
 *
 * Node numbers are counted over the package's whole list, before either rule
 * applies. The number is a mount's position within its kind, so a mount the
 * ledger withholds must not renumber the ones after it.
 */
export function slotViews(loadout: ShipLoadout, text: SlotTextResolver): readonly SlotView[] {
  const nodes = new Map<SlotKind, number>();
  const drawn: SlotView[] = [];

  for (const slot of loadout.slots()) {
    const node = (nodes.get(slot.kind) ?? 0) + 1;
    nodes.set(slot.kind, node);
    if (restrictionOf(slot) === WITHHELD_RESTRICTION) {
      continue;
    }
    drawn.push(slotView(slot, text, node));
  }

  return withCargoHatchAboveTheOptionalMounts(drawn);
}

/**
 * The one mount the ledger does not draw.
 *
 * Every hull the package publishes carries exactly one, and the two suites it
 * takes carry the same class, mass, draw and cost with no engineering group on
 * either — so the row offered a choice between two names and no reading. Hull
 * detail leaves the same mount out of its capacity statement (001/FR-022).
 *
 * The row was the only place the plain suite, an empty approach mount and that
 * mount's power controls were offered, so withholding it withholds all three.
 * FR-002a rules on them rather than leaving them here. Nothing else changes:
 * the suite stays fitted, and every calculation, export and build link still
 * carries it.
 *
 * Matched on the package's own restriction rather than on the key, because the
 * key is a spelling and the restriction is the identity (FR-002a).
 */
const WITHHELD_RESTRICTION: SlotRestriction = 'planetaryApproachSuite';

/**
 * The cargo hatch, moved to the head of the optional mounts.
 *
 * A copy with one entry moved, not a sort: everything else keeps the package's
 * own order. A build with no optional mount, or none after the hatch, is
 * returned as it arrived rather than being rearranged into an order nothing
 * asked for.
 */
function withCargoHatchAboveTheOptionalMounts(slots: readonly SlotView[]): readonly SlotView[] {
  const hatchAt = slots.findIndex((slot) => slot.kind === 'cargoHatch');
  const firstOptionalAt = slots.findIndex((slot) => slot.kind === 'optional');

  if (hatchAt === -1 || firstOptionalAt === -1 || hatchAt < firstOptionalAt) {
    return slots;
  }

  return [
    ...slots.slice(0, firstOptionalAt),
    slots[hatchAt]!,
    ...slots.slice(firstOptionalAt, hatchAt),
    ...slots.slice(hatchAt + 1),
  ];
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
