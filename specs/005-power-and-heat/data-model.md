# Data Model: Power and Heat

Every game-bearing value is an immutable projection of one
`@elite-dangerous-almanac/core` `ShipLoadout`. Feature 005 owns no build,
viewing-condition persistence, game formula or catalogue fallback.

The types below map the Almanac 0.1.3 result fields exactly. They do not add a local detector.

## PowerHeatProjectionState

```ts
type PowerHeatProjectionState =
  | { readonly state: 'noBuild' }
  | {
      readonly state: 'pending';
      readonly buildRevision: number;
      readonly conditionsRevision: number;
    }
  | { readonly state: 'ready'; readonly snapshot: PowerHeatSnapshot }
  | {
      readonly state: 'failure';
      readonly buildRevision: number;
      readonly conditionsRevision: number;
      readonly messageKey: 'projectionFailed';
    };
```

Package nulls are not application failures. A ready snapshot may contain an
unavailable distributor or unavailable heat. `failure` is
reserved for an unexpected exception, missing required `ShipLoadout` consumer
identity or revision-contract violation.

## PowerHeatSnapshot

| Field                | Type                    | Rule                                            |
| -------------------- | ----------------------- | ----------------------------------------------- |
| `buildRevision`      | non-negative integer    | Exact feature 001 active revision               |
| `conditionsRevision` | non-negative integer    | Exact settled feature 003 revision              |
| `hardpointState`     | `deployed \| retracted` | Exact settled feature 003 condition             |
| `power`              | `PowerBudgetView`       | Selected fields from one `powerBudget()` result |
| `modules`            | `ModulePowerCollection` | Exact participating `budget.consumers`          |
| `distributor`        | `DistributorView`       | Exact package result or unavailable             |
| `heat`               | `HeatProfileView`       | Exact package result or unavailable             |

Invariants:

- every field belongs to the same captured revision pair;
- a newer build or settled conditions revision invalidates the whole pending
  publication;
- selected hardpoints change only selected power presentation;
- pips change only the distributor call and its returned view;
- heat depends only on the build revision because `heatMetrics()` accepts no
  viewing options;
- no snapshot is serialized, persisted or placed in history, a URL or SLEF.

## Shared ViewingConditions input

Feature 005 imports feature 003's type instead of redefining it:

```ts
interface ViewingConditions {
  readonly load: 'maximumJump' | 'unladen' | 'laden';
  readonly pips: {
    readonly systems: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    readonly engines: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    readonly weapons: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  };
  readonly hardpoints: 'deployed' | 'retracted';
}
```

The three pip values total 12 integer half-pips and default to `4/4/4`.
Feature 005 divides them by two only while constructing
`DistributorOptions`. It neither validates nor stores a second tuple.
`load` is retained in the shared revision context but does not affect feature
005 package calls.

## Utilisation

```ts
type UtilisationValue =
  | { readonly kind: 'finite'; readonly value: number }
  | { readonly kind: 'drawWithZeroAvailableOutput' };
```

Every figure `powerBudget()` returns is exact, so no power value carries a qualification.

`drawWithZeroAvailableOutput` is the package meaning of infinite utilisation.
It does not assert why capacity is zero.

## PowerBudgetView

```ts
interface PowerBudgetView {
  readonly selectedState: 'deployed' | 'retracted';
  readonly available: number;
  readonly selectedDraw: number;
  readonly deployedSummary: DeployedPowerSummary | null;
  readonly bands: readonly PowerBandView[];
}
```

| Field             | Package source/rule                                                  |
| ----------------- | -------------------------------------------------------------------- |
| `available`       | Exact `PowerBudget.available`                                        |
| `selectedDraw`    | Exact selected `deployed` or `retracted` value                       |
| `deployedSummary` | Package `headroom`, `utilisation`, `withinBudget` only when deployed |
| `bands`           | All five package bands in returned order                             |

### DeployedPowerSummary

| Field          | Type               | Rule                            |
| -------------- | ------------------ | ------------------------------- |
| `headroom`     | number             | Exact package number            |
| `utilisation`  | `UtilisationValue` | Exact package fraction/sentinel |
| `withinBudget` | boolean            | Exact package verdict           |

This type has no retracted variant.

### PowerBandView

```ts
type PowerPriority = 1 | 2 | 3 | 4 | 5;
```

| Field            | Type            | Source                    |
| ---------------- | --------------- | ------------------------- |
| `priority`       | `PowerPriority` | `PowerBand.priority`      |
| `draw`           | number          | Selected own-band field   |
| `cumulativeDraw` | number          | Selected cumulative field |
| `powered`        | boolean         | Selected package verdict  |

No field is calculated from another. Zero-draw bands remain present.

## ModulePowerCollection

```ts
interface ModulePowerCollection {
  readonly rows: readonly ModulePowerView[];
}
```

Rules:

- one row corresponds to one `PowerConsumerResult`;
- rows may sort by draw descending with source ordinal as the stable tie break;
- disabled consumers remain visible;
- identical modules in different slots never merge;
- passive and zero-draw fittings absent from `budget.consumers` are not
  fabricated into this collection;
- each row's slot action emits the exact returned label.

### ModulePowerView

```ts
type DeploymentState = 'deployedOnly' | 'always';
```

| Field           | Type                 | Source/rule                                                  |
| --------------- | -------------------- | ------------------------------------------------------------ |
| `slotKey`       | string               | Exact `consumer.label`; required for this facade projection  |
| `symbol`        | string               | Exact `consumer.symbol`; required for game-text presentation |
| `displayName`   | `LocalizedGameText`  | Feature 011 Almanac module-name presentation                 |
| `draw`          | number               | Exact `consumer.draw`                                        |
| `enabled`       | boolean              | Exact `consumer.enabled`                                     |
| `priority`      | `PowerPriority`      | Exact normalized package priority                            |
| `deployedOnly`  | `DeploymentState`    | Exact package state                                          |
| `sourceOrdinal` | non-negative integer | Returned order; presentation tie break                       |

The row does not claim its own powered verdict. Band powered state belongs to
the priority-band result. Feature 010 receives the separately defined
observation adapter below.

## DistributorView

```ts
type DistributorView =
  | { readonly kind: 'unavailable' }
  | {
      readonly kind: 'ready';
      readonly pips: ReturnedPips;
      readonly capacitors: readonly [CapacitorView, CapacitorView, CapacitorView];
    };
```

`unavailable` maps exactly from package null and carries no inferred cause.
The tuple is SYS, ENG, WEP.

### ReturnedPips

| Field     | Type   | Source                            |
| --------- | ------ | --------------------------------- |
| `systems` | number | `DistributorMetrics.pips.systems` |
| `engines` | number | `DistributorMetrics.pips.engines` |
| `weapons` | number | `DistributorMetrics.pips.weapons` |

### CapacitorView

```ts
type CapacitorKind = 'systems' | 'engines' | 'weapons';
```

| Field           | Type            | Source                    |
| --------------- | --------------- | ------------------------- |
| `kind`          | `CapacitorKind` | Stable presentation key   |
| `capacity`      | number          | Matching `.capacity`      |
| `ratedRecharge` | number          | Matching `.ratedRecharge` |
| `rechargeRate`  | number          | Matching `.rechargeRate`  |
| `pips`          | number          | Matching returned pip     |

Zero recharge is ready numeric data.

## HeatProfileView

```ts
type HeatProfileView =
  | { readonly kind: 'unavailable' }
  | {
      readonly kind: 'ready';
      readonly heatEfficiency: number;
      readonly hullHeatCapacity: number;
      readonly hullHeatDissipation: number;
      readonly scenarios: readonly HeatScenarioView[];
    };
```

`unavailable` maps exactly from `heatMetrics() === null`. A ready profile is a complete answer for
the build: every scenario carries the package's own figures, and none is a bound or a projection.

### HeatScenarioView

```ts
type HeatScenarioKey = 'idle' | 'thrusters' | 'fsdCharging' | 'firingSustained' | 'firingDrained';
type HeatLevelValue =
  { readonly kind: 'finite'; readonly value: number } | { readonly kind: 'doesNotSettle' };
type OverheatTime =
  { readonly kind: 'seconds'; readonly value: number } | { readonly kind: 'neverOverheats' };
```

| Field            | Type              | Source/rule                                |
| ---------------- | ----------------- | ------------------------------------------ |
| `key`            | `HeatScenarioKey` | Fixed semantic order                       |
| `thermalLoad`    | number            | Exact `HeatState.thermalLoad`              |
| `heatLevel`      | `HeatLevelValue`  | Exact finite value or infinite sentinel    |
| `gauge`          | `HeatLevelValue`  | Exact finite fraction or infinite sentinel |
| `overheats`      | boolean           | Exact package verdict                      |
| `timeToOverheat` | `OverheatTime`    | Exact number or null sentinel              |

The five scenarios always exist in a ready profile, including with no weapons.

## PowerStatusProjection

Feature 005's feature 003 contribution:

```ts
interface PowerStatusProjection {
  readonly hardpointState: 'deployed' | 'retracted';
  readonly available: number;
  readonly selectedDraw: number;
}
```

The provider envelope is ready for the captured revision pair, targets
`powerAndHeat` and returns an empty `qualifiedSummaryIds`, because every figure
`powerBudget()` returns is exact. Feature 003 does not reinterpret the value.

## MountPowerObservation

Feature 005's contribution to features 007 and 010, defined once over any
package slot key — hardpoint, utility or core internal:

```ts
type MountPowerObservation =
  | { readonly kind: 'notApplicable' }
  | { readonly kind: 'disabled'; readonly priority: PowerPriority }
  | { readonly kind: 'inactiveRetracted'; readonly priority: PowerPriority }
  | { readonly kind: 'powered'; readonly priority: PowerPriority }
  | { readonly kind: 'shed'; readonly priority: PowerPriority }
  | { readonly kind: 'unavailable' };
```

Selection rules use only one budget:

1. no returned power consumer for the exact slot → `notApplicable`;
2. disabled consumer → `disabled`;
3. retracted plus `deployedOnly === true` → `inactiveRetracted`;
4. otherwise select the matching package band's selected powered boolean;
5. the budget cannot answer for the requested key → `unavailable`.

`inactiveRetracted` is reachable only for a mount the package reports as
`deployedOnly`, so a core internal never selects it. Consumers state their own
vocabulary over this union — feature 007 presents `notApplicable` as absent —
and none widens or narrows it.

The port stamps every observation with build and condition revisions outside
this union. Consumers accept no stale pair.

## LocalizedGameText

```ts
type LocalizedGameText =
  | {
      readonly kind: 'text';
      readonly text: string;
      readonly translation: 'localized' | 'canonicalFallback';
    }
  | { readonly kind: 'unavailable' };
```

Canonical fallback triggers a localized untranslated disclosure. If the package
supplies neither localized nor canonical text, the name is unavailable. No
private game translation or raw application fallback is added.

## Intents and transitions

Feature 005 emits only shared viewing/navigation intent:

```ts
type PowerHeatIntent =
  | { readonly kind: 'editViewingConditions' }
  | { readonly kind: 'applyViewingConditions' }
  | { readonly kind: 'resetViewingConditions' }
  | { readonly kind: 'openSlot'; readonly slotKey: string };
```

- Viewing intents delegate to feature 003's one draft/Apply/Reset state machine.
- `openSlot` delegates the exact returned key to feature 002.
- A changed accepted condition advances `conditionsRevision` once and
  reprojects atomically.
- A committed edit/replacement advances `buildRevision`; no part of the old
  snapshot is relabelled.
- Loss of the active build discards the snapshot and renders `noBuild`.
