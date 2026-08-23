# Data Model: Hull Anatomy and Mount Geometry

Every game-bearing field is an immutable projection of one active
`@elite-dangerous-almanac/core` loadout and feature 002's exact slot views. Schematic data is
validated as it is fetched. Nothing here enters build state, storage, history, a URL, SLEF or edit
history.

Three groups of types this file planned were withdrawn when the reference canvases were read against
it, and the design record says why: mount power and priority (`PriorityState`, `MountPowerState`,
`hardpointState`) belong to the `POWER` mode feature 005 owns, `SelectedMountFacts` and
`MountLocationState` to a selected-facts block canvas 1c does not draw, and `SchematicDefect`'s
localized framing to a provenance control the canvas does not publish
(design/hull-anatomy.md, "Divergence from FR-005", "Divergence from FR-008", "Divergence from
FR-011"). They are not below, because they are not built.

## Store state

The store holds the two side lifecycles and the visible side, and nothing else. Everything a screen
reads is derived from those and from feature 002's slot views, so there is no snapshot to keep in
step with a revision:

```ts
type SideStates = Readonly<Record<SchematicSide, SideAssetState>>;
```

| Signal        | Type                | Rule                                                        |
| ------------- | ------------------- | ----------------------------------------------------------- |
| `symbol`      | `string \| null`    | The active build's exact package `Ship.symbol`, or no build |
| `sides`       | `SideStates`        | Independent top and bottom lifecycles                       |
| `projection`  | `AnatomyProjection` | Derived from feature 002's slots and `sides`                |
| `selectedKey` | `string \| null`    | Feature 002's one selected identity, read not held          |
| `visibleSide` | `top \| bottom`     | Narrow-only presentation choice; ignored by paired layout   |

Invariants:

- one hull at a time: a hull change aborts both requests and discards any completion whose request
  identity no longer matches;
- `projection.items` exists before either side settles and is never filtered by whether a schematic
  drew the mount;
- locale changes re-present text but change no mount identity;
- selection and visible side are presentation state only, and neither is persisted.

## SideAssetState

```ts
type SchematicSide = 'top' | 'bottom';

type SideAssetState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly document: SchematicDocument }
  | { readonly kind: 'temporarilyUnavailable' }
  | { readonly kind: 'contractDefect' };
```

Top and bottom transition independently:

```text
loading -> ready
        -> temporarilyUnavailable -> loading
        -> contractDefect
```

The distinction that matters is whether asking again could help. `temporarilyUnavailable` is a fetch
that did not arrive — offline, a 404 from a deployment still rolling out, a dropped connection, or a
rendering that failed to load — and a Commander can retry it. `contractDefect` is a file that
arrived and was not what this build produces, which retrying does not change. No `reason` or
`defectId` is carried: nothing on screen says which of the two it was, and a field only a log would
read is a field this projection does not need.

## SchematicDocument

What a plate fetches is not the package SVG but the extract
`scripts/extract-schematic-mounts.mts` wrote from it, and this is that file once the runtime
validator has accepted it.

```ts
interface SchematicDocument {
  readonly side: SchematicSide;
  readonly symbol: string;
  readonly viewBox: string;
  readonly content: SchematicExtent;
  readonly annotations: readonly SchematicAnnotation[];
}

interface SchematicExtent {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface SchematicAnnotation {
  readonly feature: string;
  readonly journalSlot: string;
  readonly centre: { readonly x: number; readonly y: number };
}
```

`viewBox` is the package's own, verbatim; `content` is the rectangle the file draws in, grown by half
its widest stroke; each `centre` is the middle of what one annotation draws. All three are in the
package's coordinate space, which is also the space the rasterised PNG is drawn in, so the picture
and the marks over it cannot drift apart.

The document that carries the package's paths, circles and validated static presentation attributes
exists only at build time, in `schematic-svg-parser.ts`. Nothing script, style, event, link,
reference, external-resource or CSS-URL shaped survives that parse, and the extract has no field
that could carry any of it. Source ids, labels, sockets, coordinates and drawing order never become
mount identity.

The validator refuses a file whose declared symbol or side is not the one asked for, whose `viewBox`
is not four numbers, whose content rectangle has no positive extent, or that carries a single
malformed mount. A bad mount refuses the whole document rather than being dropped: a plate missing
one mount looks exactly like a hull that has none there.

## MountItem

One canonical item exists for every package slot whose kind is `hardpoint` or `utility`.

```ts
type LocatedMountKind = 'hardpoint' | 'utility';

interface MountItem {
  readonly key: string;
  readonly name: string;
  readonly kind: LocatedMountKind;
  readonly node: number;
  readonly fitted: boolean;
  readonly engineered: boolean;
  readonly sides: readonly SchematicSide[];
}
```

The array follows the order of `ShipLoadout.slots()` filtered to hardpoint and utility. No consumer
sort, drawing order or translated name changes it.

`key` is the exact game slot key and the only identity anything exchanges; `name` is what feature
002's ledger row calls the mount, in the Commander's language, because a plate that spoke
`SmallHardpoint1` would name it with a string no canvas draws. `node` is the canvas's `NODE NO.`, a
display ordinal and never an identity. `fitted` and `engineered` are the two facts the canvas's
legend explains — a size, a module identity, a priority or a power state would be feature 002's
ledger row or feature 005's mode, and neither is here.

`sides` lists the sides that _admitted_ an occurrence, so a wrong-kind annotation dropped at
admission never leaves a side listed on the item it was dropped from.

## MountOccurrence

```ts
interface MountOccurrence {
  readonly item: MountItem;
  readonly side: SchematicSide;
  readonly centre: { readonly x: number; readonly y: number };
}
```

One mount as one side draws it. `centre` is the middle of everything that annotation draws, in the
package's own coordinates, read by arithmetic over published numbers and never off the rendered
document (FR-003). A mount drawn on both sides is one item with two occurrences, so a cross-side
repeat can never become two build identities (FR-007).

## AnatomyProjection

```ts
interface AnatomyProjection {
  readonly items: readonly MountItem[];
  readonly occurrences: Readonly<Record<SchematicSide, readonly MountOccurrence[]>>;
}
```

The whole projection, from feature 002's slot views and the two side states. A pure function of its
two arguments: no signals, no injection, no `ShipLoadout`, so it can be asserted without rendering
anything.

An annotation becomes an occurrence only when its exact `data-journal-slot` resolves to a slot the
active hull has, of the kind the package's own `data-feature` word names. An annotation that
resolves to nothing or resolves to the wrong kind is dropped. A key drawn twice on one side drops
_both_ of its drawings, not the second: choosing between them would have to be done by drawing
order, which is the positional identity FR-003 forbids. Nothing is guessed from a key's spelling, its position in the file or its drawing order.

## Package text

Feature 010 consumes feature 011's shared package-text presentation rather than defining one:

```ts
interface GameTextPresentation {
  readonly text: string | null;
  readonly language: string | null;
  readonly translationState: 'localized' | 'canonical' | 'unavailable';
  readonly disclosureKey: MessageKey | null;
}
```

Canonical fallback carries a visible localized disclosure and an accurate `lang`. Missing package
text stays unavailable; a raw identity is never promoted into a display name. In this capability the
only package text on screen is the mount's name, which feature 002 has already resolved this way and
which arrives on `MountItem.name`.
