# Data Model: Power and Heat

Every game-bearing field below is an immutable projection of one active
`@elite-dangerous-almanac/core` `ShipLoadout`. Feature 005 owns no fitted state,
calculation cache, persisted metric or game formula. Feature 001 owns the active
build and revision; feature 003 owns the ephemeral viewing conditions.

## PowerHeatSnapshot

One atomic view of one build revision under one set of conditions.

| Field                | Type                             | Rule                                                                       |
| -------------------- | -------------------------------- | -------------------------------------------------------------------------- |
| `buildRevision`      | non-negative integer             | Exact active-build revision used for every result                          |
| `conditionsRevision` | non-negative integer             | Exact feature 003 condition revision                                       |
| `hardpointState`     | `deployed \| retracted`          | Selected condition; defaults through feature 003 to deployed               |
| `pips`               | `PipAllocation`                  | Feature 003 input; the distributor view also carries returned package pips |
| `power`              | `PowerBudgetView`                | Always returned for an active build                                        |
| `modules`            | `ModulePowerCollection`          | Projects released 0.1.1 `PowerBudget.consumers`                            |
| `distributor`        | `DistributorView`                | Package result or explicit unavailable state                               |
| `heat`               | `HeatProfileView`                | Package result or explicit unavailable state                               |
| `status`             | `ready \| unavailable \| failed` | Whole-snapshot presentation state; never carries stale prior values        |

Invariants:

- All five views have the same `buildRevision` and `conditionsRevision`.
- A new build revision invalidates the whole prior snapshot before recalculation.
- A hardpoint change affects only the selected power fields; it does not alter
  the package heat profile.
- A pip change affects the distributor call and other feature consumers of
  feature 003 state; it does not alter capacitor capacity or feature 005 heat.
- The snapshot is in memory only and is never written to storage, edit history,
  a link or SLEF.

## PipAllocation

Shared feature 003 viewing state, not feature 005 build data.

| Field     | Type                | Validation           |
| --------- | ------------------- | -------------------- |
| `systems` | `0..4` in 0.5 steps | Finite; at most four |
| `engines` | `0..4` in 0.5 steps | Finite; at most four |
| `weapons` | `0..4` in 0.5 steps | Finite; at most four |

The three values total exactly six. The default is `{ systems: 2, engines: 2,
weapons: 2 }`. Feature 005 passes these as `systemsPips`, `enginesPips` and
`weaponsPips`, then displays `DistributorMetrics.pips` rather than assuming the
package used different names or defaults.

## PowerBudgetView

```ts
interface PowerBudgetView {
  selectedState: 'deployed' | 'retracted';
  available: number;
  selectedDraw: QualifiedValue<number>;
  deployedSummary: DeployedPowerSummary | null;
  bands: readonly PowerBandView[];
  unknowns: readonly UnknownPowerConsumerView[];
}
```

| Field             | Package source/rule                                                                     |
| ----------------- | --------------------------------------------------------------------------------------- |
| `available`       | `PowerBudget.available`                                                                 |
| `selectedDraw`    | `deployed` or `retracted`, selected directly                                            |
| `deployedSummary` | Exact `headroom`, `utilisation`, `withinBudget` only for deployed; `null` for retracted |
| `bands`           | All five `PowerBudget.bands`, in package order                                          |
| `unknowns`        | Every `PowerBudget.unknownDraws` entry, preserving package order and labels             |

`selectedDraw`, band values and band powered verdicts are `lowerBound` or
`knownDrawsOnly` whenever `unknowns` is non-empty. The package values themselves
are unchanged.

### DeployedPowerSummary

| Field          | Type                                 | Meaning                                              |
| -------------- | ------------------------------------ | ---------------------------------------------------- |
| `headroom`     | number                               | Exact deployed `available - deployed` package result |
| `utilisation`  | `FiniteNumber \| NoPlantUtilisation` | Exact package fraction; infinity has semantic state  |
| `withinBudget` | boolean                              | Exact known-draw deployed verdict                    |

The type has no retracted variant. `NoPlantUtilisation` preserves package
`Infinity` as “draw with no available plant output,” never as a serialized null
or unexplained number.

## PowerBandView

| Field            | Type                        | Source/rule                                      |
| ---------------- | --------------------------- | ------------------------------------------------ |
| `priority`       | `1 \| 2 \| 3 \| 4 \| 5`     | `PowerBand.priority`                             |
| `draw`           | `QualifiedValue<number>`    | Selected `deployed` or `retracted`               |
| `cumulativeDraw` | `QualifiedValue<number>`    | Selected `deployedTotal` or `retractedTotal`     |
| `powered`        | `QualifiedVerdict<boolean>` | Selected `poweredDeployed` or `poweredRetracted` |

No field is calculated from another. A zero-draw band remains present.

## ModulePowerCollection

This collection projects 0.1.1's `PowerBudget.consumers` and selects the matching returned
`PowerBudget.bands` verdict for the active hardpoint state. It does not join raw modifiers or use
aggregate subtraction.

```ts
interface ModulePowerCollection {
  unknown: readonly ModulePowerView[];
  known: readonly ModulePowerView[];
}
```

Rules:

- One entry represents one exact fitted slot; identical modules are never
  combined.
- Unknown entries remain in package/source order and always precede the known
  numeric group.
- Known entries may sort by descending package draw, with package/source ordinal
  as the stable tie break.
- Disabled entries remain present even though the package excludes them from
  aggregate draw.
- Selecting an entry emits its exact `slotKey`; no index or display name is an
  identity.

### ModulePowerView

| Field           | Type                           | Source/rule                                                     |
| --------------- | ------------------------------ | --------------------------------------------------------------- |
| `slotKey`       | string                         | Exact package/game slot identity                                |
| `symbol`        | string                         | Exact package module identity                                   |
| `displayName`   | `LocalizedGameText`            | Almanac localized name or disclosed canonical fallback          |
| `draw`          | `known(number) \| unavailable` | Package-resolved post-engineering draw; never parsed or derived |
| `enabled`       | boolean                        | Package-effective state, including default behavior             |
| `priority`      | `1..5`                         | Package-effective outfitting group                              |
| `deployedOnly`  | `true \| false \| unavailable` | Package-authored state; unknown remains unknown                 |
| `selectedPower` | `ModulePowerState`             | Consumer state plus the matching returned band verdict          |
| `sourceOrdinal` | non-negative integer           | Stable package order, presentation only                         |

`draw` is the module's package-rated contribution. The selected-state text may
say disabled or inactive while retracted; the application does not replace the
draw with a locally calculated zero. Aggregate selected draw continues to come
only from `powerBudget()`.

```ts
type ModulePowerState =
  | { kind: 'disabled' }
  | { kind: 'inactiveRetracted' }
  | { kind: 'verdict'; powered: QualifiedVerdict<boolean> }
  | { kind: 'indeterminate' };
```

`disabled` comes directly from `consumer.enabled === false`; `inactiveRetracted` requires the
retracted condition and `consumer.deployedOnly === true`. An enabled consumer with known draw and
deployment classification receives the selected `poweredDeployed`/`poweredRetracted` value from the
returned band matching its package priority, with the same known-draw qualification as that band.
Missing draw, deployment classification or matching band is `indeterminate`. This is field
selection over one package result, not locally reconstructed shedding arithmetic.

## DistributorView

```ts
type DistributorView =
  { kind: 'ready'; pips: ReturnedPips; capacitors: CapacitorViews } | { kind: 'unavailable' };
```

`unavailable` corresponds exactly to `distributorMetrics() === null`. It does
not carry catalogue fallback values or an inferred game diagnosis.

### ReturnedPips

| Field     | Type   | Source                            |
| --------- | ------ | --------------------------------- |
| `systems` | number | `DistributorMetrics.pips.systems` |
| `engines` | number | `DistributorMetrics.pips.engines` |
| `weapons` | number | `DistributorMetrics.pips.weapons` |

### CapacitorView

There is exactly one each for `systems`, `engines` and `weapons`.

| Field           | Type                            | Source                                   |
| --------------- | ------------------------------- | ---------------------------------------- |
| `kind`          | `systems \| engines \| weapons` | Stable semantic key                      |
| `capacity`      | number                          | `DistributorCapacitorMetrics.capacity`   |
| `ratedRecharge` | number                          | `.ratedRecharge`                         |
| `rechargeRate`  | number                          | `.rechargeRate`                          |
| `pips`          | number                          | Matching `DistributorMetrics.pips` field |

A zero `rechargeRate` is ready numeric data, not unavailable. Capacity is copied
unchanged across pip conditions.

## HeatProfileView

```ts
type HeatProfileView =
  | { kind: 'unavailable' }
  | {
      kind: 'ready';
      qualification: 'complete' | 'projection';
      heatEfficiency: number;
      hullHeatCapacity: number;
      hullHeatDissipation: number;
      scenarios: readonly HeatScenarioView[];
      unknownSlotKeys: readonly string[];
    };
```

`unavailable` corresponds exactly to `heatMetrics() === null`. A ready profile
is a projection whenever `HeatMetrics.unknownDraws` is non-empty. That
qualification applies to every field and verdict; it is not a numeric bound.

## HeatScenarioView

| Field            | Type                                                                   | Source/rule                                        |
| ---------------- | ---------------------------------------------------------------------- | -------------------------------------------------- |
| `key`            | `idle \| thrusters \| fsdCharging \| firingSustained \| firingDrained` | Stable semantic key in this order                  |
| `thermalLoad`    | number                                                                 | `HeatState.thermalLoad`                            |
| `heatLevel`      | `finite(number) \| doesNotSettle`                                      | `HeatState.heatLevel`                              |
| `gauge`          | `finite(number) \| doesNotSettle`                                      | `HeatState.gauge`; finite value is a fraction      |
| `overheats`      | boolean                                                                | `HeatState.overheats`                              |
| `timeToOverheat` | `seconds(number) \| neverOverheats`                                    | `secondsToOverheat`; `null` maps to semantic state |

All five scenarios exist whenever the profile is ready, including when no
weapon is fitted and scenario values coincide. `doesNotSettle` and
`neverOverheats` are separate states.

## Qualified values

```ts
type QualifiedValue<T> =
  { qualification: 'complete'; value: T } | { qualification: 'lowerBound'; value: T };

type QualifiedVerdict<T> =
  { qualification: 'complete'; value: T } | { qualification: 'knownDrawsOnly'; value: T };
```

These wrappers add presentation truthfulness only. They never adjust the
package value. Heat uses its distinct whole-profile `projection`
qualification.

## LocalizedGameText

| Field         | Type                                                   | Rule                                                          |
| ------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| `text`        | string                                                 | Package localized name or canonical/raw package identity      |
| `translation` | `localized \| canonicalFallback \| unresolvedIdentity` | Drives a localized disclosure, not a private game translation |

## Intents and transitions

Feature 005 emits only viewing/navigation intent:

```ts
type PowerHeatIntent =
  | { kind: 'selectHardpointState'; value: 'deployed' | 'retracted' }
  | { kind: 'setPips'; value: PipAllocation }
  | { kind: 'openSlot'; slotKey: string };
```

Transitions:

1. `selectHardpointState` delegates to feature 003, increments the condition
   revision and atomically selects different fields from a fresh package power
   result. It creates no build edit or history entry.
2. `setPips` is accepted only when feature 003's half-step/sum/max invariants
   hold. It increments the condition revision and calls `distributorMetrics`
   once. Capacity remains the package-returned value.
3. `openSlot` delegates the exact key to feature 002's selection intent and
   exposes that slot in one interaction. It changes no build metric.
4. Any active-build edit/replacement increments the build revision and causes a
   whole-snapshot recomputation. The old snapshot is not partially patched.
5. Loss of the active build discards the snapshot and renders the feature 001
   no-build state; feature 005 never constructs a replacement.
