# Jump Performance Contract

> **Superseded in part.** This document was written before the design review and describes an
> arrangement and a package surface the design and the installed Almanac replaced. Three corrections
> govern anything read here:
>
> 1. **Getters that do not exist, and three aggregates that are not read.** `unladenMassResult`,
>    `fuelCapacityResult` and
>    `cargoCapacityResult` are not in `@elite-dangerous-almanac/core`, deliberately: the package
>    documents those three aggregates as figures it can always state, with `importOutcomes()` rather
>    than a `CalculationResult` as the report. Of the three plain getters that do exist, none is
>    read. `fuelCapacity` was, while the fuel legend row named the tank it stood for; the canvas
>    revision of 2026-08-25 cut that qualifier to the bare word `TANK`, so no canvas draws a capacity
>    any more and by this project's rule none is read. The build's mass split comes from
>    `buildMass(load)` and the thruster's curve from `BuildMetrics.thrusters()`. See FR-006 in
>    [spec.md](../spec.md).
> 2. **Two cards, not five surfaces.** Canvases 1c and 1d draw `THRUSTER LOAD` and `FRAME SHIFT
DRIVE`; the five stacked components and the per-module mass list described below are not built.
>    See [design/reference-review.md](../design/reference-review.md) and
>    [design/mobility-and-jump-profile.md](../design/mobility-and-jump-profile.md).
> 3. **Only what the canvas draws.** The two mass-curve multipliers, a Guardian booster's jump bonus,
>    `unladenMass`, `cargoCapacity` and — since the revision of 2026-08-25 — `fuelCapacity` are real
>    package figures neither canvas has, so none is read or drawn. See FR-004 and FR-006 in
>    [spec.md](../spec.md).
>
> Where this document and those disagree, those decide.

## Inputs and complete-result guard

For one captured `ShipLoadout`, read exactly once:

1. `unladenMassResult`;
2. `fuelCapacityResult`;
3. `cargoCapacityResult`;
4. `standardLoadResult('maximum')`;
5. `standardLoadResult('unladen')`; and
6. `standardLoadResult('laden')`.

Call `jumpRangeSummary()` exactly once only when every aggregate and standard-load result is
complete. This explicitly satisfies the diagnostic mass/capacity gate and uses the package's
FSD-aware maximum-load validation, including any active Guardian booster. Never use fitted-record
inspection as the call guard.

When any guard is incomplete, do not call the summary. Keep each exact `CalculationResult` and its
ordered issues; identify the blocking result(s) without flattening, parsing or deduplicating issues.

An exception after all guards complete is an unexpected application/package failure. It supplies no
local game diagnosis and exposes no prior numeric result under the new revision.

## Ready mapping

The whole `JumpRangeSummary` is retained and displayed as:

| Load identity | Single range | Total range          | Jump count           |
| ------------- | ------------ | -------------------- | -------------------- |
| maximum       | `max`        | `totalMax.range`     | `totalMax.jumps`     |
| unladen       | `unladen`    | `totalUnladen.range` | `totalUnladen.jumps` |
| laden         | `laden`      | `totalLaden.range`   | `totalLaden.jumps`   |

All range fields are light-years; counts are package integers. Presentation formats but never
round-trips or changes the underlying numbers. Equal load profiles remain separately labelled.

## Zero and unavailable semantics

- Usable FSD plus complete zero main fuel yields package numeric zero range/count results; show zero.
- Complete zero cargo may make laden and unladen values equal; show both identities.
- Incomplete mass/fuel/cargo or maximum-load FSD validation yields no summary number.
- A missing or package-incomplete FSD is represented by the exact incomplete maximum-load issue, including
  `field`, `reason`, optional slot/symbol, message and params.
- Fitted `on` state is source provenance only. The jump facade does not document it as a power gate,
  so feature 008 does not add one.

## FSD identity and parameters

Locate the fitted source through `slots('core')` where `core === 'frameShiftDrive'`, retaining the
exact `key`, symbol and optional `on`. Only present post-engineering `effectiveStats` fields may be
shown: `optMass`, `maxFuel`, `fuelMul` and `fuelPower`.

After the standard-load guards complete, `BuildMetrics.frameShiftDrive()` may supply the combined
effective parameter record. Its `jumpBoost` is an active-booster/build parameter, not a field of the
fitted FSD record. Label it accordingly and preserve zero when no booster contributes.

Do not calculate or display optimal-mass percentage, headroom, mass factor, per-jump fuel, range,
total or count outside the package facades. Do not infer SCO from a symbol/name.

## Selected-load integration

Feature 003 state maps `maximumJump -> maximum`, `unladen -> unladen`, `laden -> laden`. The Drives &
Mass capability always shows all three jump profiles; the selected profile supplies feature 003's
Status headline and read-only context. Feature 008 creates no second selector.

## Verification

Tests prove all six guards, no summary call when any guard is incomplete, one summary call when all
complete, exact field equality, issue identity/order, missing/package-incomplete FSD, active booster, zero
fuel, zero cargo, equal profiles, exact slot identity and current-revision failure behavior. Tests
contain no jump, fuel-cap or count formula.
