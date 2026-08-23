import type { SlotView } from '../../application/outfitting/slot-view';
import {
  MOUNT_FEATURE_OF,
  SCHEMATIC_SIDES,
  type LocatedMountKind,
  type MountItem,
  type MountOccurrence,
  type SchematicAnnotation,
  type SchematicDocument,
  type SchematicSide,
  type SideAssetState,
} from './anatomy-model';

/**
 * Joins the build's mounts to the geometry that draws them.
 *
 * Two rules carry the whole projection, and both run the same direction:
 *
 *   * **the build decides what exists.** One item per package `hardpoint` or
 *     `utility` slot, in `ShipLoadout.slots()` order, whether or not any
 *     schematic draws it and whether or not any schematic has arrived. An
 *     annotation never creates a mount, so a file naming a slot the hull does
 *     not have adds nothing (FR-002).
 *   * **the package decides where.** An annotation is admitted only when its
 *     `data-feature` word matches the kind the package already gave that exact
 *     slot key. Nothing is matched by drawing order, element order, position or
 *     the spelling of a key (FR-003).
 *
 * Everything here is a pure function over immutable inputs — no signals, no
 * injection, no `ShipLoadout` — so a projection can be asserted without
 * rendering anything (constitution III).
 */

/** The state of both sides, as the store currently holds them. */
export type SideStates = Readonly<Record<SchematicSide, SideAssetState>>;

/** Every mount the build has, and where each side draws them. */
export interface AnatomyProjection {
  /** One per package hardpoint and utility, in `ShipLoadout.slots()` order. */
  readonly items: readonly MountItem[];
  /** Each ready side's admitted occurrences, in package drawing order. */
  readonly occurrences: Readonly<Record<SchematicSide, readonly MountOccurrence[]>>;
}

/** The mount kinds this capability locates. Everything else is the ledger's. */
function locatedKind(slot: SlotView): LocatedMountKind | null {
  return slot.kind === 'hardpoint' || slot.kind === 'utility' ? slot.kind : null;
}

/**
 * The one projection, run once per build revision and side change.
 *
 * Admission happens before items are built, because `MountItem.sides` is a
 * statement about which occurrences were *admitted*: a wrong-kind annotation
 * that admission drops must not leave a side listed on the item it was dropped
 * from. Doing it the other way round would need the item list patched
 * afterwards, and a value that is built and then edited is one a reader has to
 * trace to trust.
 */
export function projectAnatomy(slots: readonly SlotView[], sides: SideStates): AnatomyProjection {
  // Keyed by the slot itself rather than by its kind alone, so building an item
  // is a read off the view that produced the entry. Looking the slot up again
  // by key would be the same list searched twice and a not-found branch nothing
  // can reach.
  const mounts = new Map<string, { slot: SlotView; kind: LocatedMountKind }>();
  for (const slot of slots) {
    const kind = locatedKind(slot);
    if (kind !== null) {
      mounts.set(slot.key, { slot, kind });
    }
  }

  const admitted: Record<SchematicSide, readonly SchematicAnnotation[]> = { top: [], bottom: [] };
  for (const side of SCHEMATIC_SIDES) {
    const state = sides[side];
    if (state.kind === 'ready') {
      admitted[side] = admit(state.document, mounts);
    }
  }

  const items = [...mounts].map(([key, { slot, kind }]) => {
    return {
      key,
      // Feature 002's resolved name, not a second one: the ledger row and the
      // mount on the plate are the same mount and say the same word. The
      // canonical name is the fallback the presenter already discloses; a raw
      // key is never promoted into a name.
      name: slot.displayName.text ?? slot.canonicalName,
      kind,
      // The canvas draws this digit in the mount's box. Feature 002 already
      // numbers the ledger rows with it, so the plate and the row agree by
      // sharing one value rather than by counting twice.
      node: slot.node,
      fitted: slot.module != null,
      engineered: slot.module?.engineering != null,
      sides: SCHEMATIC_SIDES.filter((side) =>
        admitted[side].some((annotation) => annotation.journalSlot === key),
      ),
    } satisfies MountItem;
  });

  const byKey = new Map(items.map((item) => [item.key, item]));
  const occurrences = {
    top: occurrencesOf('top', admitted.top, byKey),
    bottom: occurrencesOf('bottom', admitted.bottom, byKey),
  };

  return { items, occurrences };
}

/**
 * One side's annotations that name a mount this hull actually has, of the kind
 * the package already gave that key.
 *
 * A key drawn twice on one side is dropped from that side entirely rather than
 * resolved by taking the first: choosing between two drawings by their order in
 * the file is exactly the positional identity FR-003 refuses, and the mount is
 * still reachable through the ledger.
 */
function admit(
  document: SchematicDocument,
  mounts: ReadonlyMap<string, { slot: SlotView; kind: LocatedMountKind }>,
): readonly SchematicAnnotation[] {
  const counts = new Map<string, number>();
  for (const annotation of document.annotations) {
    counts.set(annotation.journalSlot, (counts.get(annotation.journalSlot) ?? 0) + 1);
  }

  return document.annotations.filter((annotation) => {
    const mount = mounts.get(annotation.journalSlot);
    // A `utility_mount` drawn over a hardpoint's key is a package defect, and
    // presenting it would state something about the hull nobody checked.
    return (
      mount !== undefined &&
      annotation.feature === MOUNT_FEATURE_OF[mount.kind] &&
      counts.get(annotation.journalSlot) === 1
    );
  });
}

/**
 * Admitted annotations, bound to the one item each of them draws.
 *
 * An occurrence carries its canonical item by reference, so both drawings of a
 * mount that appears on top and bottom show the same fitted, engineering and
 * selected state from one place — there is no second copy that could disagree
 * (FR-007).
 */
function occurrencesOf(
  side: SchematicSide,
  annotations: readonly SchematicAnnotation[],
  byKey: ReadonlyMap<string, MountItem>,
): readonly MountOccurrence[] {
  return annotations.flatMap((annotation) => {
    const item = byKey.get(annotation.journalSlot);
    return item === undefined ? [] : [{ item, side, centre: annotation.centre }];
  });
}
