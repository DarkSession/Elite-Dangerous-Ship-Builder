# Data Model: Mobility, Mass and Jump

> **Superseded in part.** This document was written before the design review and describes an
> arrangement and a package surface the design and the installed Almanac replaced. Three corrections
> govern anything read here:
>
> 1. **Getters that do not exist, and three aggregates that are not read.** `unladenMassResult`,
>    `fuelCapacityResult` and
>    `cargoCapacityResult` are not in `@elite-dangerous-almanac/core`, deliberately: the package
>    documents those three aggregates as figures it can always state, with `importOutcomes()` rather
>    than a `CalculationResult` as the report. Of the three plain getters that do exist, none is
>    read: `fuelCapacity` was until the canvas revision of 2026-08-25 cut the fuel legend row's
>    qualifier to the bare word `TANK`. The build's mass split comes from `buildMass(load)` and the
>    thruster's curve from `BuildMetrics.thrusters()`. See FR-006 in [spec.md](./spec.md).
> 2. **Two cards, not five surfaces.** Canvases 1c and 1d draw `THRUSTER LOAD` and `FRAME SHIFT
DRIVE`; the five stacked components and the per-module mass list described below are not built.
>    See [design/reference-review.md](./design/reference-review.md) and
>    [design/mobility-and-jump-profile.md](./design/mobility-and-jump-profile.md).
> 3. **Only what the canvas draws.** The two mass-curve multipliers, a Guardian booster's jump bonus,
>    `unladenMass`, `cargoCapacity` and — since the revision of 2026-08-25 — `fuelCapacity` are real
>    package figures neither canvas has, so none is read or drawn. See FR-004 and FR-006 in
>    [spec.md](./spec.md).
>
> Where this document and those disagree, those decide. There is no snapshot, store, aggregate-result or
> module-mass model: the shape actually built is `src/app/domain/mobility-jump/mobility-jump.ts`.

Feature 008 owns immutable projections only. The active build, build revision, viewing conditions,
condition revision, selection and persistence remain in their owning features. Package result and
issue types are retained rather than redefined.

## Package types retained verbatim

```ts
import type {
  CalculationIssue,
  CalculationResult,
  FuelCapacity,
} from '@elite-dangerous-almanac/core/ships/loadout-calculations';
import type { MobilityMetrics } from '@elite-dangerous-almanac/core/ships/mobility';
import type { FrameShiftDriveParams } from '@elite-dangerous-almanac/core/ships/jump-range';
import type {
  JumpRangeSummary,
  StandardLoadInputs,
} from '@elite-dangerous-almanac/core/ships/ship-loadout';
```

`CalculationIssue` is not narrowed or copied. In the installed Almanac it contains required `field`,
`reason` and `message`, optional `slot`, `symbol` and `params`, and package ordering. A complete
`CalculationResult` may contain numeric zero; an incomplete result contains `value: null` and a
non-empty issue tuple.

## MobilityJumpSnapshot

One synchronous projector call returns:

```ts
interface MobilityJumpSnapshot {
  readonly buildRevision: number;
  readonly conditionsRevision: number;
  readonly selectedCondition: SelectedMobilityCondition;
  readonly aggregates: AggregateResults;
  readonly standardLoads: StandardLoadResults;
  readonly jump: GuardedJumpResult;
  readonly mobility: GuardedMobilityResult;
  readonly frameShiftDrive: CoreModuleSource<FrameShiftDriveFacts>;
  readonly thrusters: CoreModuleSource<ThrusterFacts>;
  readonly moduleMasses: readonly ModuleMass[];
}
```

The object and every nested collection are frozen. All fields describe the same captured revision
pair.

## SelectedMobilityCondition

Feature 003 owns the source `ViewingConditions`; feature 008 records only the exact context used:

```ts
interface SelectedMobilityCondition {
  readonly load: 'maximumJump' | 'unladen' | 'laden';
  readonly almanacLoad: 'maximum' | 'unladen' | 'laden';
  readonly enginesHalfPips: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  readonly enginesPips: number; // enginesHalfPips / 2 at the package boundary
}
```

The mapping is fixed: `maximumJump -> maximum`; other identities map verbatim. `enginesPips` is in
`[0, 4]` by the feature 003 contract. This is not another editable or persisted condition.

## AggregateResults

```ts
interface AggregateResults {
  readonly unladenMass: CalculationResult<number>;
  readonly fuelCapacity: CalculationResult<FuelCapacity>;
  readonly cargoCapacity: CalculationResult<number>;
}
```

Each value is the exact package getter result for the captured build. Results are independent: one
incomplete aggregate does not erase another complete result. A complete imported aggregate stays
complete even if a per-module mass row is unavailable, because the package may trust the supplied
aggregate rather than recompute it.

## StandardLoadResults

```ts
type StandardLoad = 'maximum' | 'unladen' | 'laden';

type StandardLoadResults = Readonly<Record<StandardLoad, CalculationResult<StandardLoadInputs>>>;
```

All three are captured exactly once. They are both the package definitions of the load identities
and the complete guard for `jumpRangeSummary()`.

## GuardedJumpResult

```ts
type GuardedJumpResult =
  | {
      readonly state: 'ready';
      readonly value: JumpRangeSummary;
      readonly effectiveDrive: FrameShiftDriveParams;
    }
  | {
      readonly state: 'blocked';
      readonly blockedAggregates: readonly (keyof AggregateResults)[];
      readonly blockedLoads: readonly StandardLoad[];
    };
```

Rules:

- `ready` exists only after all three aggregates and all three `standardLoads` are complete.
- `value` is the whole exact `JumpRangeSummary`; no range or count is recomputed.
- `effectiveDrive` is the package's guarded post-engineering FSD parameter record. Its optional
  `jumpBoost` is the combined active-booster contribution and is not attributed to the fitted FSD.
- `blockedAggregates` and `blockedLoads` name each incomplete result in fixed presentation order.
  Exact issues live on the owning package results; there is no reduced or deduplicated collection.
- An unexpected throw after complete guards produces the outer store's `failure`, not another game
  result variant.

Presentation maps the complete summary without changing it:

| Profile | Single    | Total                | Count                |
| ------- | --------- | -------------------- | -------------------- |
| maximum | `max`     | `totalMax.range`     | `totalMax.jumps`     |
| unladen | `unladen` | `totalUnladen.range` | `totalUnladen.jumps` |
| laden   | `laden`   | `totalLaden.range`   | `totalLaden.jumps`   |

Every number may be zero; equal profiles remain separate.

## GuardedMobilityResult

```ts
type MobilityBlocker = 'unladenMass' | 'selectedStandardLoad';

type GuardedMobilityResult =
  | {
      readonly state: 'result';
      readonly value: CalculationResult<MobilityMetrics>;
    }
  | {
      readonly state: 'blocked';
      readonly blockedBy: readonly MobilityBlocker[];
    };
```

`result` means the package method was called with the selected standard load and exact ENG pips. Its
complete value contains all seven package fields; its incomplete value contains package power/
thruster issues. `blocked` means the method was intentionally not called because mass or selected
standard-load input was incomplete; the exact owning results remain in `aggregates` and
`standardLoads`.

A complete result whose seven fields are zero is ready zero above supported mass. It never becomes
`blocked` or incomplete.

## CoreModuleSource

```ts
type CoreModuleSource<TFacts> =
  | {
      readonly state: 'empty';
      readonly slotKey: string;
    }
  | {
      readonly state: 'resolved';
      readonly slotKey: string;
      readonly symbol: string;
      readonly on: boolean | undefined;
      readonly facts: TFacts;
    };
```

The projection receives only package-resolved identities from supported ingress. Required mounts are
already populated with their package defaults.

The source slot is found through `slots('core')` and `slot.core`, then retains the package's exact
`slot.key`. `on === false` is explicitly switched off; `undefined` remains unspecified and is not
relabeled disabled. Display names are not domain fields: the presenter requests module/slot text
from Almanac for the active locale.

Source state supplies identity/provenance only. Numeric availability comes from the guarded package
result and its issues; the source does not override it.

## FrameShiftDriveFacts

Sparse fields copied from the fitted FSD's post-engineering `effectiveStats` only when present:

```ts
interface FrameShiftDriveFacts {
  readonly optMass?: number;
  readonly maxFuel?: number;
  readonly fuelMul?: number;
  readonly fuelPower?: number;
}
```

`jumpBoost` is deliberately absent here. When shown, it comes from
`GuardedJumpResult.effectiveDrive.jumpBoost` and is labelled as a combined build/booster parameter.
No mass factor, headroom, percentage, fuel use or SCO capability is inferred.

## ThrusterFacts

Sparse fields copied from the fitted thruster's post-engineering `effectiveStats` only when present:

```ts
interface ThrusterFacts {
  readonly minMass?: number;
  readonly optMass?: number;
  readonly maxMass?: number;
  readonly minMultiplier?: number;
  readonly optMultiplier?: number;
  readonly maxMultiplier?: number;
  readonly minSpeedMultiplier?: number;
  readonly optSpeedMultiplier?: number;
  readonly maxSpeedMultiplier?: number;
  readonly minRotationMultiplier?: number;
  readonly optRotationMultiplier?: number;
  readonly maxRotationMultiplier?: number;
}
```

Missing optional fields remain absent. The selected-load `massCurveMultiplier` and
`rotationMassCurveMultiplier` remain on the package mobility result, not this source record.

## ModuleMass

```ts
interface ModuleMass {
  readonly slotKey: string;
  readonly symbol: string;
  readonly mass:
    { readonly state: 'ready'; readonly value: number } | { readonly state: 'unavailable' };
}
```

There is exactly one entry per `fittedModules()` snapshot in package order. `ready.value` is exactly
`effectiveStats.mass`, including zero. Missing effective stats or mass is unavailable. Duplicate
symbols remain separate by exact slot key. The collection is never summed or used to validate the
aggregate.

## MobilityStatusProjection

Feature 008 implements feature 003's generic provider contract:

```ts
type SemanticNumber =
  | { readonly state: 'ready'; readonly value: number }
  | { readonly state: 'unavailable'; readonly issues: readonly CalculationIssue[] };

interface MobilityStatusProjection {
  readonly selectedLoad: 'maximumJump' | 'unladen' | 'laden';
  readonly jumpRange: SemanticNumber;
  readonly topSpeed: SemanticNumber;
  readonly unladenMass: SemanticNumber;
}

type MobilityStatusSummaryId = 'jumpRange' | 'topSpeed' | 'unladenMass';
```

Mapping:

- `jumpRange` selects the matching single-jump field from the ready summary; otherwise it is
  unavailable with the exact issues from incomplete standard-load guards.
- `topSpeed` uses the same selected-load/ENG `mobility.speed`; a blocked/incomplete result is
  unavailable with its exact owning issues.
- `unladenMass` maps the exact aggregate and never changes meaning with selected load.
- Ready zero remains ready and does not qualify the summary.
- Each unavailable summary contributes only its own ID once to feature 003's qualification list.

The provider stamps the input revisions and returns `{ kind: 'detail', capability:
'mobilityAndJump' }`. It is synchronously ready even when package values are unavailable; only an
unexpected exception propagates to feature 003's `projectionFailed` handling.

## Store lifecycle

```ts
type MobilityJumpStoreState =
  | { readonly state: 'noBuild' }
  | { readonly state: 'ready'; readonly snapshot: MobilityJumpSnapshot }
  | {
      readonly state: 'failure';
      readonly buildRevision: number;
      readonly conditionsRevision: number;
    };
```

Transitions:

```text
noBuild
  └─ activate build ─> synchronous project ─> ready | failure

ready
  ├─ committed edit/undo/redo/replacement ─> project new build revision
  ├─ accepted load/pip Apply or Reset ─> project new condition revision
  └─ remove build ─> noBuild
```

Locale, disclosure and capability selection changes do not change either domain revision. Invalid
feature 003 drafts do not invoke the projector. Old snapshots are never relabelled with new context.

## Invariants

- Snapshot revisions equal the captured input revisions.
- Each aggregate and each standard load is read once per projection.
- `jumpRangeSummary()` and `frameShiftDrive` are read only after all three aggregates and all three
  standard loads complete.
- `mobilityMetricsResult()` and `mobilityCapacitorMetricsResult()` are each called at most once,
  only after unladen mass and selected load complete, with exact package load values and ENG
  half-pips divided once.
- Every jump/mobility field and issue remains package-equal.
- No `null`, missing field or unavailable row becomes zero; no ready zero becomes unavailable.
- Core sources use `BuildSlot.core` for function and exact `BuildSlot.key` for identity.
- Every fitted module appears once; per-module masses are never re-summed.
- No localized string, formatted number or presentation token enters the domain snapshot.
