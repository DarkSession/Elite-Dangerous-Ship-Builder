# Data Model: Hull Anatomy and Hardpoint Geometry

Every game-bearing value is an immutable projection of one active
`@elite-dangerous-almanac/core` loadout and feature 005's package-backed power observation. SVG
geometry exists only in validated in-memory asset data. Nothing below enters a build snapshot,
storage record, URL, SLEF or edit history.

## AnatomySnapshot

One atomic view of one active hull/build/condition revision.

| Field                | Type                                | Rule                                                                 |
| -------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| `hullSymbol`         | string                              | Exact resolved package `Ship.symbol`; asset identity                 |
| `buildRevision`      | non-negative integer                | Exact active-build revision used for slots/fitted state              |
| `conditionsRevision` | non-negative integer                | Exact feature 003 revision used by the power observation             |
| `hardpointState`     | `deployed \| retracted`             | Settled feature 003 viewing condition                                |
| `selectedSlotKey`    | `string \| null`                    | Feature 002 selection; never a second anatomy-owned identity         |
| `sides`              | `Readonly<Record<Side, SideState>>` | Independent top/bottom asset state                                   |
| `hardpoints`         | `readonly HardpointItem[]`          | Every package hardpoint once, in package order                       |
| `defects`            | `readonly PackageAssetDefect[]`     | Invalid annotations/content for the current assets only              |
| `status`             | `loading \| ready \| partial`       | `partial` keeps all usable sides/items and names what is unavailable |

Invariants:

- Every `HardpointItem`, selected state and power observation carries this revision pair.
- A newer hull/build/condition revision invalidates pending publication from an older one.
- One unavailable side does not make the other side or canonical hardpoint list unavailable.
- No active build means no `AnatomySnapshot`; the owning workspace renders its shared no-build state.
- `hardpoints` contains no utility, core, optional, armour or cargo-hatch entry.

## Side and asset state

```ts
type Side = 'top' | 'bottom';

type SideState =
  | { kind: 'idle'; side: Side }
  | { kind: 'loading'; side: Side; requestId: string }
  | { kind: 'ready'; side: Side; document: ValidatedSchematic }
  | {
      kind: 'temporarilyUnavailable';
      side: Side;
      reason: 'offline' | 'http' | 'invalid';
      retry: 'available' | 'waitingForOnline';
    };
```

`requestId` is browser workflow identity only. A response may publish only when its request, hull
symbol and build revision remain current. `invalid` is still presented as unavailable while a
structured defect is retained for verification and deliberate reporting.

### ValidatedSchematic

| Field         | Type                             | Rule                                                                     |
| ------------- | -------------------------------- | ------------------------------------------------------------------------ |
| `side`        | `Side`                           | Asset filename side                                                      |
| `viewBox`     | readonly four-number tuple       | Exact validated package root value; presentation scale only              |
| `nodes`       | `readonly SafeSvgNode[]`         | Inert allowlisted artwork tree                                           |
| `occurrences` | `readonly HardpointOccurrence[]` | Only annotations accepted by the released package contract and slot join |

The document contains no source URL, markup string or executable DOM. It is retained only for the
active hull.

### SafeSvgNode

```ts
type SafeSvgNode =
  | {
      kind: 'group';
      hardpointSlotKey: string | null;
      children: readonly SafeSvgNode[];
    }
  | { kind: 'path'; d: string; presentation: SafeSvgPresentation }
  | { kind: 'circle'; cx: number; cy: number; r: number; presentation: SafeSvgPresentation };
```

The final allowlist follows the released #308 contract. `SafeSvgPresentation` carries only validated
inert package presentation attributes. Source ids, Inkscape metadata, styles, links, events, URLs and
foreign namespaces do not enter the type. Unexpected content rejects the side; the parser never
silently returns altered artwork.

## HardpointOccurrence

One package-annotated geometry instance on one side.

| Field     | Type    | Rule                                                                    |
| --------- | ------- | ----------------------------------------------------------------------- |
| `side`    | `Side`  | Containing schematic                                                    |
| `slotKey` | string  | Canonical package `LoadoutSlot.key` after case-insensitive exact lookup |
| `ordinal` | integer | In-memory renderer correlation only; never slot/order identity          |

Validation:

1. the released annotation contract classifies the source feature as `hardpoint`;
2. its `data-journal-slot` resolves to one current loadout slot;
3. the resolved slot's package kind is `hardpoint`;
4. every repeat follows the released #308 duplicate semantics and still references the same
   canonical item.

A repeated annotation produces multiple occurrences referencing one `HardpointItem`, whether the
released contract permits it across or within a side. `ordinal` may correlate a typed node with its
rendered occurrence for one parsed document; it is regenerated, never persisted and never accepted
by a slot intent.

## HardpointItem

One package hardpoint slot and the source for every visual occurrence and the always-present text
equivalent.

| Field         | Type                                      | Source/rule                                                |
| ------------- | ----------------------------------------- | ---------------------------------------------------------- |
| `slotKey`     | string                                    | Exact canonical `LoadoutSlot.key`; sole identity           |
| `size`        | `number \| unavailable`                   | Exact package hardpoint size                               |
| `fitted`      | `HardpointFit`                            | Package slot/module projection                             |
| `engineering` | `stock \| engineered \| unavailable`      | Package engineering presence; no modifier inference        |
| `power`       | `HardpointPowerObservation`               | Shared feature 005 result for the same revision/conditions |
| `selected`    | boolean                                   | Case-insensitive equality to feature 002 `selectedSlotKey` |
| `location`    | `HardpointLocationState`                  | Geometry membership/availability without guessing          |
| `occurrences` | `readonly HardpointOccurrenceReference[]` | Zero or more validated instances                           |

The collection follows all of `ShipLoadout.slots('hardpoint')` in returned order. SVG group order,
element id, label, physical position and key number never filter or order it.

### HardpointLocationState

```ts
type HardpointLocationState =
  | { kind: 'pending' }
  | { kind: 'located'; sides: readonly Side[] }
  | { kind: 'temporarilyUnavailable'; sides: readonly Side[] }
  | { kind: 'packageDefect' };
```

`pending` applies while a side that might contain the key is loading. `temporarilyUnavailable`
means one or both necessary asset results are absent, so the application makes no missing-geometry
claim. `packageDefect` is possible only after the released #308 coverage contract can be evaluated
against successfully validated assets. The text item and slot action exist in every state.

### HardpointFit

```ts
type HardpointFit =
  | { kind: 'empty' }
  | {
      kind: 'resolved';
      symbol: string;
      displayName: LocalizedGameText;
    }
  | {
      kind: 'unresolved';
      symbol: string;
      displayName: 'unavailable';
    };
```

Empty is exact package absence. An unresolved article keeps its package symbol and never receives a
guessed class, name or power value. `LocalizedGameText` is an Almanac localized name or a canonical
fallback carrying feature 011's untranslated disclosure.

## HardpointPowerObservation

Feature 005 supplies this opaque, revision-stamped presentation port after a released #299 result.
Feature 010 never reads raw modifiers, applies defaults or joins priority bands itself.

```ts
type HardpointPowerObservation =
  | { kind: 'notApplicable' } // empty hardpoint
  | { kind: 'disabled'; priority: PriorityState }
  | { kind: 'inactiveRetracted'; priority: PriorityState }
  | { kind: 'powered'; priority: PriorityState }
  | { kind: 'shed'; priority: PriorityState }
  | {
      kind: 'qualified';
      priority: PriorityState;
      reason: 'unknownDraw' | 'unresolvedModule' | 'packageUnavailable';
    };

type PriorityState = { kind: 'available'; value: 1 | 2 | 3 | 4 | 5 } | { kind: 'unavailable' };
```

`inactiveRetracted` is possible only under the shared retracted condition for a package-classified
deployed-only consumer. `qualified` never carries a plausible verdict. The port's exact final shape
may follow the released feature 005 contract; these semantic states are the anatomy requirement.

## RevealState

Ephemeral responsive presentation state.

| Field                  | Type         | Rule                                                          |
| ---------------------- | ------------ | ------------------------------------------------------------- |
| `visibleSide`          | `Side`       | Used where only one side is presented; defaults to `top`      |
| `pendingRevealSlotKey` | string/null  | Exact selected located key awaiting ready rendered occurrence |
| `announcement`         | message/null | Localized semantic change; never package/game prose           |

Reveal transition for a located selected slot:

```text
current side contains slot -> retain side
else top contains slot      -> top
else bottom contains slot   -> bottom
else                        -> no anatomy reveal; ledger remains selected
```

Once the chosen side is ready, `scrollIntoView(nearest)` targets its rendered occurrence without
reading or storing coordinates. Every occurrence sharing the selected slot key renders selected.

## PackageAssetDefect

| Field     | Type                                                                            | Rule                                     |
| --------- | ------------------------------------------------------------------------------- | ---------------------------------------- |
| `side`    | `Side`                                                                          | Asset containing the defect              |
| `kind`    | `unsafeContent \| malformedSvg \| unknownSlot \| wrongKind \| contractMismatch` | Stable app diagnostic category           |
| `slotKey` | string/null                                                                     | Exact source value when safely available |

Defects are in-memory operational evidence, not build state or telemetry. The UI gives a localized
summary and feature 012's deliberate package-defect link; no hull, slot, module or build data is
placed in the URL.

## State transitions

```text
no build --activate build--> load both sides + project ledger immediately
loading --side success--> side ready; publish matching revision
loading --side failure--> that side temporarily unavailable; ledger unchanged
unavailable --retry/online--> loading
any state --hull changes--> abort old requests; clear parsed tree; load new sides
any state --build changes same hull--> reuse ready asset; reproject all unique slot state
any state --conditions change--> reuse geometry; replace only matching power observations
slot selected --located--> reveal deterministic side + synchronize all occurrences
slot selected --no ready occurrence--> text item/feature 002 selection remain; no geometry reveal
```
