# Data Model: Hull Anatomy and Mount Geometry

Every game-bearing field is an immutable projection of one active
`@elite-dangerous-almanac/core` loadout, feature 002's exact slot views and feature 005's generalized
mount-power observation. SVG data is validated in memory. Nothing here enters build state, storage,
history, a URL, SLEF or edit history.

## AnatomyState

```ts
type AnatomyState =
  | { readonly state: 'noBuild' }
  | {
      readonly state: 'loading';
      readonly hullSymbol: string;
      readonly buildRevision: number;
      readonly conditionsRevision: number;
      readonly sides: Readonly<Record<SchematicSide, SideAssetState>>;
      readonly mounts: readonly MountItem[];
    }
  | { readonly state: 'ready'; readonly snapshot: AnatomySnapshot }
  | {
      readonly state: 'failure';
      readonly hullSymbol: string;
      readonly buildRevision: number;
      readonly conditionsRevision: number;
      readonly messageKey: 'anatomyProjectionFailed';
    };
```

`failure` is reserved for an unexpected projection/revision failure. Individual fetch, schema and
annotation problems stay side-local in a usable snapshot. A ready snapshot may have neither side
available.

## AnatomySnapshot

| Field                | Type                                              | Rule                                                       |
| -------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| `hullSymbol`         | string                                            | Exact resolved package `Ship.symbol`; asset identity       |
| `buildRevision`      | non-negative integer                              | Feature 001 revision used for every slot/fitted fact       |
| `conditionsRevision` | non-negative integer                              | Feature 003 revision used for every power observation      |
| `hardpointState`     | `deployed \| retracted`                           | Exact settled viewing condition                            |
| `selectedSlotKey`    | `string \| null`                                  | Feature 002's one selected identity                        |
| `visibleSide`        | `top \| bottom`                                   | Narrow-only presentation choice; ignored by paired layout  |
| `sides`              | `Readonly<Record<SchematicSide, SideAssetState>>` | Independent top/bottom lifecycles                          |
| `mounts`             | `readonly MountItem[]`                            | Every package hardpoint and utility once, in package order |
| `defects`            | `readonly SchematicDefect[]`                      | Exact package/asset contract failures without guesses      |

Invariants:

- one snapshot contains one hull and one build/condition revision pair;
- stale asset or observation completion is discarded rather than relabelled;
- locale changes re-present text but do not alter either revision or mount identity;
- `mounts` exists before assets settle and is never filtered by geometry availability;
- a new hull clears prior SVG and reveal state before any result is published;
- selection/side/scroll are presentation state only.

## SideAssetState

```ts
type SchematicSide = 'top' | 'bottom';

type SideAssetState =
  | { readonly state: 'notRequested' }
  | { readonly state: 'loading'; readonly requestId: string }
  | { readonly state: 'ready'; readonly document: SchematicDocument }
  | {
      readonly state: 'temporarilyUnavailable';
      readonly reason: 'offlineUncached' | 'httpFailure' | 'networkFailure';
      readonly retry: 'manualAndOnline';
    }
  | {
      readonly state: 'contractDefect';
      readonly defectIds: readonly string[];
      readonly retry: 'afterPackageUpdate';
    };
```

Top and bottom transition independently:

```text
notRequested -> loading -> ready
                       -> temporarilyUnavailable -> loading
                       -> contractDefect
```

An active failed side retries on explicit intent or once when connectivity returns. A package schema
defect is not repeatedly fetched during the same package/app version. Changing hull aborts/discards
both prior request identities.

## SchematicDocument and inert SVG nodes

```ts
interface SchematicDocument {
  readonly side: SchematicSide;
  readonly hullSymbol: string;
  readonly viewBox: readonly [number, number, number, number];
  readonly width: number | null;
  readonly height: number | null;
  readonly root: SvgGroupNode;
  readonly occurrences: readonly MountOccurrence[];
}

type SafeSvgNode = SvgGroupNode | SvgPathNode | SvgCircleNode;

interface SvgGroupNode {
  readonly kind: 'group';
  readonly presentation: SafeSvgPresentation;
  readonly feature: string | null;
  readonly journalSlot: string | null;
  readonly children: readonly SafeSvgNode[];
}

interface SvgPathNode {
  readonly kind: 'path';
  readonly d: string;
  readonly presentation: SafeSvgPresentation;
}

interface SvgCircleNode {
  readonly kind: 'circle';
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly presentation: SafeSvgPresentation;
}
```

`SafeSvgPresentation` contains only validated static attributes required to reproduce the unmodified
package drawing. It cannot contain script/style/event content, links, references, external resources
or CSS URLs. Source ids, labels, sockets, coordinates and drawing order never become mount identity.

## MountItem

One canonical item exists for every package slot whose kind is `hardpoint` or `utility`.

```ts
type LocatedMountKind = 'hardpoint' | 'utility';

interface MountItem {
  readonly slotKey: string;
  readonly kind: LocatedMountKind;
  readonly size: MountSize;
  readonly fitted: FittedMountState;
  readonly engineering: EngineeringState;
  readonly focused: boolean;
  readonly priority: PriorityState;
  readonly power: MountPowerState;
  readonly occurrences: readonly MountOccurrence[];
  readonly location: MountLocationState;
}
```

The array follows the order of `ShipLoadout.slots()` filtered to hardpoint and utility. No consumer
sort, SVG traversal or translated name changes it.

### MountSize

```ts
type MountSize =
  | { readonly kind: 'class'; readonly value: 1 | 2 | 3 | 4 }
  | { readonly kind: 'notClassSized' }
  | { readonly kind: 'unavailable' };
```

Hardpoint values are exact package sizes. `notClassSized` is the package-documented meaning of a
utility slot's size-0 placeholder. No class zero or estimated size is displayed.

### FittedMountState

```ts
type FittedMountState =
  | { readonly kind: 'empty' }
  | {
      readonly kind: 'resolved';
      readonly symbol: string;
      readonly name: LocalizedGameText;
    };
```

`symbol` is the exact package-resolved fitted-module identity. `empty` applies only to a removable
mount with no fitted module. Required mounts are already package-populated, and unsupported module
identities are outside the anatomy projection contract.

### EngineeringState

```ts
type EngineeringState =
  { readonly kind: 'stock' } | { readonly kind: 'engineered' } | { readonly kind: 'unavailable' };
```

This is presence only, from the package/feature 002 fitted article. It does not re-read modifiers,
quality, blueprint ids or effects.

### PriorityState and MountPowerState

These are imported from feature 005's generalized located-mount observation contract:

```ts
type PriorityState =
  | { readonly kind: 'available'; readonly value: 1 | 2 | 3 | 4 | 5 }
  | { readonly kind: 'unavailable' };

type MountPowerState =
  | { readonly kind: 'notApplicable' }
  | { readonly kind: 'disabled' }
  | { readonly kind: 'inactiveRetracted' }
  | { readonly kind: 'powered' }
  | { readonly kind: 'shed' };
```

Feature 010 copies these states and the observation's revision pair. It does not join consumers to
bands or inspect raw `on`, zero-based `priority`, module stats or modifiers.

## MountOccurrence

```ts
interface MountOccurrence {
  readonly slotKey: string;
  readonly kind: LocatedMountKind;
  readonly side: SchematicSide;
  readonly geometry: readonly (SvgPathNode | SvgCircleNode)[];
}
```

Identity is `(canonical slotKey, side)`, which the package contract limits to one per side. A valid
cross-side repeat creates two occurrences referencing one `MountItem`. Same-side repeats are a
contract defect; ambiguous occurrences are omitted rather than selected by order. Geometry is copied
unchanged into presentation plus an exact-shape hit clone; no bounds or centre are stored.

## MountLocationState

```ts
type MountLocationState =
  | { readonly kind: 'pending' }
  | { readonly kind: 'located'; readonly sides: readonly SchematicSide[] }
  | { readonly kind: 'temporarilyUnavailable'; readonly sides: readonly SchematicSide[] }
  | { readonly kind: 'packageDefect'; readonly defectIds: readonly string[] };
```

Rules:

- until both sides settle, absence from a ready side does not prove missing geometry;
- one ready occurrence is immediately `located` even while the other side is pending;
- a side failure preserves known ready-side locations and identifies unresolved side availability;
- after both valid documents settle, a canonical hardpoint/utility with no occurrence is a package
  defect because the published contract promises complete coverage;
- location state never removes the item or feature 002 ledger row.

## SelectedMountFacts

```ts
interface SelectedMountFacts {
  readonly slotKey: string;
  readonly kind: LocatedMountKind;
  readonly size: MountSize;
  readonly fitted: FittedMountState;
  readonly engineering: EngineeringState;
  readonly priority: PriorityState;
  readonly power: MountPowerState;
  readonly hardpointState: 'deployed' | 'retracted';
  readonly location: MountLocationState;
}
```

This is an exact view of the selected canonical item, not a second editor. It contains no weapon
metric, mount direction, distance, convergence, coordinate or inferred placement.

## SchematicDefect

```ts
type SchematicDefect =
  | {
      readonly id: string;
      readonly kind: 'unsafeOrInvalidDocument';
      readonly side: SchematicSide;
    }
  | {
      readonly id: string;
      readonly kind: 'unknownSlot' | 'wrongSlotKind' | 'sameSideDuplicate';
      readonly side: SchematicSide;
      readonly slotKey: string;
      readonly feature: string;
    }
  | {
      readonly id: string;
      readonly kind: 'missingContractGeometry';
      readonly slotKey: string;
      readonly expectedKind: LocatedMountKind;
    };
```

Defects retain language-neutral evidence for logs/tests. UI framing is localized and points to
feature 012's data/provenance modal. No defect record includes build payload, module details or local
storage data in an external URL.

## RevealState and transitions

```ts
interface RevealState {
  readonly selectedSlotKey: string | null;
  readonly visibleSide: SchematicSide;
  readonly source: 'geometry' | 'locatedList' | 'completeLedger' | null;
}
```

Transitions:

1. geometry or unique-list activation delegates the exact key to feature 002;
2. feature 002 publishes that one selected key for ledger, editor and anatomy;
3. on narrow layout, keep the visible side if it contains the selected slot; otherwise choose top,
   then bottom; if no ready side contains it, keep the current side and expose location state;
4. every occurrence for the selected key receives focused state and the nearest rendered instance
   is revealed with native scrolling;
5. selecting an internal/unlocated slot clears selected anatomy facts without changing the ledger
   selection;
6. active-build replacement resets side/reveal state and rejects all stale completions.

No selection or reveal transition mutates the loadout or produces a build/history revision.

## LocalizedGameText

Feature 010 consumes feature 011's shared package-text presentation:

```ts
type LocalizedGameText =
  | {
      readonly kind: 'text';
      readonly text: string;
      readonly translation: 'localized' | 'canonicalFallback';
    }
  | { readonly kind: 'unavailable' };
```

Canonical fallback receives a visible localized disclosure. Missing package text remains
unavailable; raw identities are not silently promoted into display names.
