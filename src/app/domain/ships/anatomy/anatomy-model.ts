/**
 * What one hull schematic is, as far as this application is concerned.
 *
 * The Almanac ships two SVGs per hull, and neither is fetched at runtime. Each
 * is ninety kilobytes of sub-pixel path data whose *pixels* are rasterised into
 * a PNG by `scripts/convert-ship-artwork.mjs` and whose *mounts* are extracted
 * into a few hundred bytes of JSON by `scripts/extract-schematic-mounts.mts`.
 * Two scripts, both against the installed package, and both to be re-run when
 * the pin moves — the extract records the digest it was made from and the
 * rendering does not, so only the first of them is checked. What arrives on a
 * plate is those two files, and this is the shape of the second one: the
 * drawing's own box, the rectangle it draws in, and one record per annotated
 * feature saying which slot it names and where on the hull it is.
 *
 * The package contract — `svg`, `g`, `path`, `circle`, no script, no style, no
 * reference, no foreign element — is checked where the extract is made, so a
 * file outside it fails a build rather than reaching a Commander.
 */

/** Which of the hull's two schematics this is. */
export type SchematicSide = 'top' | 'bottom';

/** Both sides, in the order they are presented. */
export const SCHEMATIC_SIDES: readonly SchematicSide[] = ['top', 'bottom'];

/**
 * A rectangle in the drawing's own units.
 *
 * Read off the package's published coordinates by arithmetic, never off the
 * rendered document: there is no `getBBox` and no `getScreenCTM` anywhere in
 * the path from a file to the screen (FR-003).
 */
export interface SchematicExtent {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * One annotated feature group that names a journal slot.
 *
 * `feature` is the package's own `data-feature` word and `journalSlot` its own
 * `data-journal-slot`. Neither is interpreted here — whether this is a mount
 * the active hull actually has is a question about the build, and it is asked
 * by the projector against `ShipLoadout.slots()`, never against the spelling of
 * a key (FR-002, FR-003).
 */
export interface SchematicAnnotation {
  readonly feature: string;
  readonly journalSlot: string;
  /** The middle of everything this annotation draws, in package coordinates. */
  readonly centre: { readonly x: number; readonly y: number };
}

/** One side's validated document. */
export interface SchematicDocument {
  readonly side: SchematicSide;
  /** The hull `symbol` this was fetched for. Nothing reads it out of the file. */
  readonly symbol: string;
  /** The package's own `viewBox`, kept as written and never rewritten. */
  readonly viewBox: string;
  /**
   * What the file actually draws inside that `viewBox`.
   *
   * Every hull in the package is drawn nose-up and centred in a 1200x800 box,
   * so most of the `viewBox` is empty air: an Anaconda occupies 292 of the 1200
   * units across. Canvas 1c frames a plate at the hull's own proportions and
   * lays it on its side, which is this rectangle turned a quarter turn
   * (design/hull-anatomy.md, "Schematic regions").
   */
  readonly content: SchematicExtent;
  /** Every annotated feature, in package drawing order. */
  readonly annotations: readonly SchematicAnnotation[];
}

/**
 * Why a document is not on screen.
 *
 * The distinction that matters is whether asking again could help.
 * `temporarilyUnavailable` is a fetch that did not arrive — offline, a 404 from
 * a deployment still rolling out, a dropped connection — and a Commander can
 * retry it. `contractDefect` is a file that arrived and was not what this
 * application's own build produces, which no amount of retrying changes: a
 * deployment is serving something else, and until that is fixed this side has
 * no drawing.
 */
export type SideAssetState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly document: SchematicDocument }
  | { readonly kind: 'temporarilyUnavailable' }
  | { readonly kind: 'contractDefect' };

/** What the package says a located mount is. Utilities are not hardpoints. */
export type LocatedMountKind = 'hardpoint' | 'utility';

/**
 * The `data-feature` word the package uses for each kind.
 *
 * Held as a mapping in one direction only, and read only to compare an
 * annotation against a slot the package already resolved. It is not a slot-name
 * table and nothing is looked up by it (FR-003).
 */
export const MOUNT_FEATURE_OF: Readonly<Record<LocatedMountKind, string>> = {
  hardpoint: 'hardpoint',
  utility: 'utility_mount',
};

/**
 * One mount on the active hull, and everything the mounts view says about it.
 *
 * There is exactly one of these per package hardpoint or utility slot, in
 * `ShipLoadout.slots()` order, whether or not any schematic draws it. A mount
 * drawn on both sides is still one item with two occurrences, so a cross-side
 * repeat can never become two build identities (FR-007).
 *
 * What it does *not* carry is as deliberate as what it does. Priority and
 * current power belong to the anatomy panel's `POWER` mode, which is feature
 * 005's; the mounts mode draws kind, fitted state, engineering and selection,
 * which is what the reference's legend explains (design/hull-anatomy.md,
 * "Divergence from FR-005 and the legend").
 */
export interface MountItem {
  /** The exact game slot key. The only identity anything exchanges. */
  readonly key: string;
  /**
   * The mount as the ledger names it, in the Commander's language.
   *
   * The key is the identity and the name is what is read: a plate that spoke
   * `SmallHardpoint1` would be naming a mount with a string no canvas draws and
   * no ledger row shows. Feature 002 already resolves this through the package,
   * and this is the same value its row carries.
   */
  readonly name: string;
  readonly kind: LocatedMountKind;
  /**
   * The canvas's `NODE NO.` — the digit drawn in the mount's box on the plate
   * and in its row in the ledger. Feature 002's display ordinal, never an
   * identity.
   */
  readonly node: number;
  /** True when the package reports a module in this slot at this revision. */
  readonly fitted: boolean;
  /** True when the package reports engineering on the fitted module. */
  readonly engineered: boolean;
  /** The sides that draw this mount, in presentation order. */
  readonly sides: readonly SchematicSide[];
}

/**
 * One mount as one side draws it: the canonical item, plus where that side puts it.
 *
 * The canvas does not tint the drawn shape — it sets a small numbered box over
 * the hull at the mount's position. So what an occurrence carries is that
 * position and nothing else: the package's own shapes stay in the artwork,
 * inert, exactly as the package painted them.
 */
export interface MountOccurrence {
  readonly item: MountItem;
  readonly side: SchematicSide;
  /** The middle of this side's drawing of the mount, in package coordinates. */
  readonly centre: { readonly x: number; readonly y: number };
}
