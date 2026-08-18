# Data Model: Mobility, Mass and Jump

This model is an immutable presentation projection over one active `ShipLoadout` and one settled
viewing-condition revision. It stores no build data and defines no game calculation.

## MobilityJumpSnapshot

One atomically published capability result.

| Field                | Type                              | Rules                                                            |
| -------------------- | --------------------------------- | ---------------------------------------------------------------- |
| `buildRevision`      | integer                           | Exact feature 001 revision captured with the loadout.            |
| `conditionsRevision` | integer                           | Exact feature 003 revision captured with selected load/ENG pips. |
| `conditions`         | `MobilityConditions`              | Settled package inputs; never a component draft.                 |
| `massAndCapacity`    | `MassAndCapacityProfile`          | Three exact diagnostic aggregate projections.                    |
| `jump`               | `JumpProjection`                  | Complete package summary or explicit unavailable state.          |
| `mobility`           | `MobilityProjection`              | Complete seven-field result or explicit unavailable state.       |
| `driveSource`        | `DriveSourceObservation`          | Exact fitted source and sparse package facts.                    |
| `thrusterSource`     | `ThrusterSourceObservation`       | Exact fitted/power state and sparse package facts.               |
| `moduleMasses`       | readonly `ModuleMassProjection[]` | One entry per fitted package snapshot.                           |

The object and nested collections are immutable. No region publishes independently.

## MobilityConditions

Feature 003 owns and validates this state.

| Field         | Type                          | Rules                                                                       |
| ------------- | ----------------------------- | --------------------------------------------------------------------------- |
| `load`        | `maximum \| unladen \| laden` | Shared semantic load identity.                                              |
| `fuel`        | number                        | Exact package-produced/diagnosed tonnes supplied to mobility when explicit. |
| `cargo`       | number                        | Exact package-produced/diagnosed tonnes.                                    |
| `enginesPips` | number                        | Settled package argument in `[0, 4]`, including half steps.                 |

For unladen/laden full main fuel may remain an omitted package argument rather than a duplicated
number. The projection records enough condition meaning to label the result but never creates a
second stored preference.

## DiagnosticResult

Generic projection of `CalculationResult<T>`.

### `complete`

| Field    | Rules                                       |
| -------- | ------------------------------------------- |
| `kind`   | Literal `complete`.                         |
| `value`  | Exact package value; numeric zero is valid. |
| `issues` | Empty readonly tuple.                       |

### `incomplete`

| Field    | Rules                                                      |
| -------- | ---------------------------------------------------------- |
| `kind`   | Literal `incomplete`.                                      |
| `value`  | Always `null`.                                             |
| `issues` | Non-empty ordered `CalculationIssueProjection` collection. |

## CalculationIssueProjection

| Field     | Type/rules                                                                                            |
| --------- | ----------------------------------------------------------------------------------------------------- |
| `field`   | Exact package identity: `hullMass`, `mass`, `cargoCapacity`, `fuelCapacity` or `reserveFuelCapacity`. |
| `slot`    | Exact package slot when present; absence stays absent.                                                |
| `symbol`  | Exact module symbol when present; absence stays absent.                                               |
| `message` | Canonical package diagnostic; never parsed.                                                           |
| `params`  | Exact readonly package params when present.                                                           |

## MassAndCapacityProfile

| Field           | Type                                       | Meaning                                                        |
| --------------- | ------------------------------------------ | -------------------------------------------------------------- |
| `unladenMass`   | `DiagnosticResult<number>`                 | Hull and fitted modules, empty main tank and no cargo, tonnes. |
| `fuelCapacity`  | `DiagnosticResult<FuelCapacityProjection>` | Main and reserve capacities, tonnes.                           |
| `cargoCapacity` | `DiagnosticResult<number>`                 | Total fitted cargo capacity, tonnes.                           |

### FuelCapacityProjection

| Field     | Rules                                                                    |
| --------- | ------------------------------------------------------------------------ |
| `main`    | Exact package main capacity; zero remains complete zero.                 |
| `reserve` | Exact package reserve capacity; never folded into main or mobility mass. |

The three aggregate results are independent. An incomplete cargo result does not erase a complete
mass result from presentation, although it prevents calls that require cargo.

## JumpProjection

### `ready`

| Field       | Type                          | Rules                                     |
| ----------- | ----------------------------- | ----------------------------------------- |
| `kind`      | Literal `ready`.              |
| `profiles`  | Fixed `JumpLoadProfile` tuple | Exactly maximum, unladen and laden.       |
| `driveSlot` | string                        | Exact fitted source slot; never an index. |

### `unavailable`

| Field    | Type                                                                           | Rules                                                                     |
| -------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `kind`   | Literal `unavailable`.                                                         |
| `reason` | `dependencyIncomplete \| driveAbsent \| driveUnresolved \| packageUnavailable` | Used only when directly established.                                      |
| `issues` | readonly `CalculationIssueProjection[]`                                        | Ordered union of owning failed diagnostic results, without deduplication. |

No numeric field exists on an unavailable projection. A fitted drive's `on` state may be shown as a
source fact, but feature 008 does not override a package summary merely because `on === false`; the
0.1.1 jump contract is not documented as a power-readiness verdict.

## JumpLoadProfile

| Field         | Type                          | Rules                                                          |
| ------------- | ----------------------------- | -------------------------------------------------------------- |
| `load`        | `maximum \| unladen \| laden` | Fixed semantic identity.                                       |
| `singleRange` | number                        | Exact `max`, `unladen` or `laden`, light-years.                |
| `totalRange`  | number                        | Exact owning `TotalRangeDetails.range`, light-years.           |
| `jumps`       | number                        | Exact owning `TotalRangeDetails.jumps`; never locally counted. |

All values may be zero. Equal load profiles remain separate entries.

## MobilityProjection

### `ready`

| Field                         | Type             | Meaning                                     |
| ----------------------------- | ---------------- | ------------------------------------------- |
| `kind`                        | Literal `ready`. |                                             |
| `speed`                       | number           | Exact package m/s.                          |
| `boost`                       | number           | Exact package m/s.                          |
| `pitch`                       | number           | Exact package degrees/s.                    |
| `roll`                        | number           | Exact package degrees/s.                    |
| `yaw`                         | number           | Exact package degrees/s.                    |
| `massCurveMultiplier`         | number           | Exact selected-load speed-curve multiplier. |
| `rotationMassCurveMultiplier` | number           | Exact selected-load rotation multiplier.    |

A ready projection containing zeroes is the package's supported semantic result for mass above the
thruster maximum; it is not unavailable.

### `unavailable`

| Field    | Type                                                                                                                              | Rules                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `kind`   | Literal `unavailable`.                                                                                                            |
| `reason` | `dependencyIncomplete \| thrustersAbsent \| thrustersDisabled \| thrustersUnpowered \| thrustersUnresolved \| packageUnavailable` | Only directly observed package/shared states are named. |
| `issues` | readonly `CalculationIssueProjection[]`                                                                                           | Owning diagnostic issues, if any.                       |

### `failure`

An unexpected current-revision package/presenter failure with no numeric values. Localized display
text is created outside the domain model.

## DriveSourceObservation

### `absent`

The package slot collection establishes no fitted Frame Shift Drive.

### `unresolved`

An occupied package drive slot has no post-engineering effective stats or lacks the jump parameters
needed by the facade. It carries exact slot and symbol but no invented facts.

### `present`

| Field    | Type/rules                                         |
| -------- | -------------------------------------------------- |
| `slot`   | Exact game slot key.                               |
| `symbol` | Exact module symbol.                               |
| `name`   | Package/localized game text.                       |
| `on`     | Exact optional fitted enabled flag.                |
| `facts`  | Sparse `DriveFacts`; only package-present members. |

## DriveFacts

Sparse post-engineering package facts:

- `optMass` in tonnes;
- `maxFuel` in tonnes;
- `fuelMul` and `fuelPower` package factors;
- optional `jumpBoost` in light-years.

No headroom, percentage, derived factor or fuel-per-jump value is added. If a released package result
directly returns another FR-008 drive fact, the model may add that sparse field without deriving it.

## ThrusterSourceObservation

Discriminated states:

- `absent`: package slots establish no fitted thrusters;
- `disabled`: fitted snapshot explicitly has `on === false`;
- `unpowered`: feature 005's package-authored exact-slot observation establishes shedding;
- `unresolved`: the slot is occupied but effective thruster facts/power state are incomplete;
- `present`: resolved enabled/powered source with exact identity and sparse `ThrusterFacts`.

Every non-absent state carrying a module uses exact slot and symbol. Source state and
`MobilityProjection` are separate: the source explains observed context but never replaces or
changes the package mobility value.

## ThrusterFacts

Sparse post-engineering record fields:

| Group          | Fields                                                                             |
| -------------- | ---------------------------------------------------------------------------------- |
| Shared curve   | `minMass`, `optMass`, `maxMass`, `minMultiplier`, `optMultiplier`, `maxMultiplier` |
| Speed curve    | optional `minSpeedMultiplier`, `optSpeedMultiplier`, `maxSpeedMultiplier`          |
| Rotation curve | optional `minRotationMultiplier`, `optRotationMultiplier`, `maxRotationMultiplier` |

Missing optional fields remain absent. Values are not converted into percentages or bars.

## ModuleMassProjection

| Field    | Type/rules                                                                  |
| -------- | --------------------------------------------------------------------------- |
| `slot`   | Exact game slot key; unique identity within one build.                      |
| `symbol` | Exact module symbol; duplicates across slots are permitted.                 |
| `name`   | Package/localized game text.                                                |
| `mass`   | `ready(number)` from `effectiveStats.mass` or `unavailable`; zero is ready. |

The collection may be presentation-ordered without changing entries. It is never summed, grouped
into an invented subtotal or used to reconstruct unladen mass.

## Relationships

```text
Active build revision
  ├──> aggregate *Result getters ──guards──> jumpRangeSummary()
  ├──> fitted drive record ────────────────> drive identity/facts
  ├──> fitted thruster record ─────────────> thruster identity/facts
  ├──> fitted module snapshots ────────────> exact-slot module masses
  └──> feature 005 power observation ──────> thruster source state

Viewing-condition revision
  ├──> selected standard load inputs
  └──> selected ENG pips
             └─────────────────────────────> mobilityMetricsResult()

All inputs/results ──atomic publication──> MobilityJumpSnapshot
```

## Validation invariants

- Snapshot build and condition revisions match the active contexts at publication.
- Each diagnostic aggregate is read once and retains every ordered issue.
- `jumpRangeSummary()` is called at most once and only after all required diagnostics and drive facts
  are complete.
- `mobilityMetricsResult()` is called at most once with the exact shared fuel/cargo/ENG inputs.
- Every returned jump and mobility field is copied unchanged.
- No null, missing optional field or incomplete aggregate becomes numeric zero.
- A non-null package zero mobility result never becomes unavailable.
- Every fitted module appears once by exact slot; mass is never re-summed.
- Source identities never use positional indices or symbol/name matching.
- No source observation changes a package numeric result.

## State transitions

```text
no active build
  └─ activate/replace build ─> projecting(current build revision, current conditions revision)

current snapshot
  ├─ module edit/undo/redo ─> projecting(new build revision, same conditions revision)
  ├─ accepted load/pip change ─> projecting(same build revision, new conditions revision)
  └─ build removed ─> no active build

projecting
  ├─ dependencies incomplete ─> publish incomplete/unavailable snapshot with issues
  ├─ revisions still current ─> publish complete immutable snapshot once
  ├─ either revision stale ─> discard without rendering
  └─ unexpected package error ─> publish failure for current revisions, no stale figures
```

Capability selection and disclosure expansion are presentation state. They do not enter storage,
links, SLEF or edit history.
