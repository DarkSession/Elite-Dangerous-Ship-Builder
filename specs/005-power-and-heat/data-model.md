# Data Model: Power and Heat

Every game-bearing value is an immutable projection of one
`@elite-dangerous-almanac/core` `ShipLoadout`. Feature 005 owns no build,
viewing-condition persistence, game formula or catalogue fallback.

The types below describe the target contract after the blocking Almanac heat
qualification fix is released. If that release changes the package's structured
qualification field, update only the exact package-to-view mapping before
tasks; do not add a local detector.

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
unavailable distributor, unavailable heat or qualified power. `failure` is
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

## Qualified values

```ts
type Qualification = 'exact' | 'lowerBound' | 'knownDrawsOnly';

interface QualifiedValue<T> {
  readonly value: T;
  readonly qualification: Qualification;
}

type UtilisationValue =
  | { readonly kind: 'finite'; readonly value: number }
  | { readonly kind: 'drawWithZeroAvailableOutput' };
```

Allowed qualifications are field-specific:

- selected/band/cumulative draw and finite utilisation:
  `exact | lowerBound`;
- headroom and powered/within-budget verdicts:
  `exact | knownDrawsOnly`;
- plant capacity: always exact and therefore unwrapped.

`drawWithZeroAvailableOutput` is the package meaning of infinite utilisation.
It does not assert why capacity is zero.

## PowerBudgetView

```ts
interface PowerBudgetView {
  readonly selectedState: 'deployed' | 'retracted';
  readonly available: number;
  readonly selectedDraw: QualifiedValue<number>;
  readonly deployedSummary: DeployedPowerSummary | null;
  readonly bands: readonly PowerBandView[];
  readonly unknownDraws: readonly UnknownPowerConsumerView[];
}
```

| Field             | Package source/rule                                                  |
| ----------------- | -------------------------------------------------------------------- |
| `available`       | Exact `PowerBudget.available`                                        |
| `selectedDraw`    | Exact selected `deployed` or `retracted` value plus qualification    |
| `deployedSummary` | Package `headroom`, `utilisation`, `withinBudget` only when deployed |
| `bands`           | All five package bands in returned order                             |
| `unknownDraws`    | Every enabled `PowerBudget.unknownDraws` entry in returned order     |

### DeployedPowerSummary

| Field          | Type                               | Rule                                                                  |
| -------------- | ---------------------------------- | --------------------------------------------------------------------- |
| `headroom`     | `QualifiedValue<number>`           | Exact package number; `knownDrawsOnly` when unknown draws exist       |
| `utilisation`  | `QualifiedValue<UtilisationValue>` | Exact package fraction/sentinel; lower bound when unknown draws exist |
| `withinBudget` | `QualifiedValue<boolean>`          | Exact or known-draw-only package verdict                              |

This type has no retracted variant.

### PowerBandView

```ts
type PowerPriority = 1 | 2 | 3 | 4 | 5;
```

| Field            | Type                      | Source                    |
| ---------------- | ------------------------- | ------------------------- |
| `priority`       | `PowerPriority`           | `PowerBand.priority`      |
| `draw`           | `QualifiedValue<number>`  | Selected own-band field   |
| `cumulativeDraw` | `QualifiedValue<number>`  | Selected cumulative field |
| `powered`        | `QualifiedValue<boolean>` | Selected package verdict  |

No field is calculated from another. Zero-draw bands remain present.

### UnknownPowerConsumerView

| Field     | Type        | Rule                                                                            |
| --------- | ----------- | ------------------------------------------------------------------------------- |
| `slotKey` | string      | Exact returned label; missing label fails the `ShipLoadout` projection contract |
| `symbol`  | string/null | Exact returned symbol when supplied; never inferred                             |

## ModulePowerCollection

```ts
interface ModulePowerCollection {
  readonly unavailableDraw: readonly ModulePowerView[];
  readonly knownDraw: readonly ModulePowerView[];
}
```

Rules:

- one row corresponds to one `PowerConsumerResult`;
- null draws precede the numeric group and retain source order;
- known draws may sort descending with source ordinal as the stable tie break;
- disabled consumers remain visible;
- identical modules in different slots never merge;
- passive and zero-draw fittings absent from `budget.consumers` are not
  fabricated into this collection;
- each row's slot action emits the exact returned label.

### ModulePowerView

```ts
type ModuleDraw =
  { readonly kind: 'known'; readonly value: number } | { readonly kind: 'unavailable' };
type DeploymentState = 'deployedOnly' | 'always' | 'unavailable';
```

| Field           | Type                 | Source/rule                                                  |
| --------------- | -------------------- | ------------------------------------------------------------ |
| `slotKey`       | string               | Exact `consumer.label`; required for this facade projection  |
| `symbol`        | string               | Exact `consumer.symbol`; required for game-text presentation |
| `displayName`   | `LocalizedGameText`  | Feature 011 Almanac module-name presentation                 |
| `draw`          | `ModuleDraw`         | Exact `consumer.draw`                                        |
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
      readonly qualification: 'complete' | 'projection';
      readonly heatEfficiency: number;
      readonly hullHeatCapacity: number;
      readonly hullHeatDissipation: number;
      readonly scenarios: readonly HeatScenarioView[];
      readonly unknownContributors: readonly string[];
    };
```

`unavailable` maps exactly from `heatMetrics() === null`. A ready result is a
projection exactly when the fixed released package result says it has unknown
contributors. The current 0.1.1 field is `unknownDraws`, but implementation
does not proceed until its known qualification defect is corrected.

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
  readonly selectedDraw: QualifiedValue<number>;
}
```

The provider envelope is ready for the captured revision pair, targets
`powerAndHeat` and returns `qualifiedSummaryIds: ['power']` exactly when
`selectedDraw.qualification !== 'exact'`; otherwise it returns an empty list.
Feature 003 does not reinterpret the value.

## HardpointPowerObservation

Feature 005's feature 010 contribution:

```ts
type PriorityState =
  | { readonly kind: 'available'; readonly value: 1 | 2 | 3 | 4 | 5 }
  | { readonly kind: 'unavailable' };

type HardpointPowerObservation =
  | { readonly kind: 'notApplicable' }
  | { readonly kind: 'disabled'; readonly priority: PriorityState }
  | { readonly kind: 'inactiveRetracted'; readonly priority: PriorityState }
  | { readonly kind: 'powered'; readonly priority: PriorityState }
  | { readonly kind: 'shed'; readonly priority: PriorityState }
  | {
      readonly kind: 'qualified';
      readonly priority: PriorityState;
      readonly reason:
        'unknownDraw' | 'unknownDeployment' | 'knownDrawsOnlyVerdict' | 'packageUnavailable';
    };
```

Selection rules use only one budget:

1. no returned power consumer for the exact slot → `notApplicable`;
2. disabled consumer → `disabled`;
3. retracted plus `deployedOnly === true` → `inactiveRetracted`;
4. null draw/deployment, a missing matching band or enabled unknown draw →
   `qualified`;
5. any global unknown draw makes an otherwise active band verdict
   `knownDrawsOnlyVerdict`, not powered/shed;
6. otherwise select the matching package band's selected powered boolean.

The port stamps every observation with build and condition revisions outside
this union. Feature 010 accepts no stale pair.

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
