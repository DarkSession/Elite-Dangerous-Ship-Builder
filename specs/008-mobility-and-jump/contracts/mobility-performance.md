# Mobility Performance Contract

> **Superseded in part.** This document was written before the design review and describes an
> arrangement and a package surface the design and the installed Almanac replaced. Three corrections
> govern anything read here:
>
> 1. **Getters that do not exist.** `unladenMassResult`, `fuelCapacityResult` and
>    `cargoCapacityResult` are not in `@elite-dangerous-almanac/core`, deliberately: the package
>    documents those three aggregates as figures it can always state, with `importOutcomes()` rather
>    than a `CalculationResult` as the report. Of those three only `fuelCapacity` is read; the
>    build's mass split comes from `buildMass(load)` and the thruster's curve from
>    `ShipLoadout.thrusters`. See FR-006 in [spec.md](../spec.md).
> 2. **Two cards, not five surfaces.** Canvases 1c and 1d draw `THRUSTER LOAD` and `FRAME SHIFT
DRIVE`; the five stacked components and the per-module mass list described below are not built.
>    See [design/reference-review.md](../design/reference-review.md) and
>    [design/mobility-and-jump-profile.md](../design/mobility-and-jump-profile.md).
> 3. **Only what the canvas draws.** The two mass-curve multipliers, a Guardian booster's jump bonus,
>    `unladenMass` and `cargoCapacity` are real package figures neither canvas has, so none is read
>    or drawn. See FR-004 and FR-006 in [spec.md](../spec.md).
>
> Where this document and those disagree, those decide.

## Inputs and call guard

Consume the captured feature 003 condition exactly:

- map `maximumJump` to package load `maximum`; map `unladen`/`laden` verbatim;
- read the cached `standardLoadResult(mappedLoad)`;
- read `unladenMassResult`; and
- divide the settled ENG integer half-pips by two once.

Call `mobilityMetricsResult({ ...standardLoad.value, enginesPips })` exactly once only when the
selected standard load and unladen mass are complete. Invalid feature 003 drafts do not settle a
revision and therefore invoke nothing.

If either guard is incomplete, do not call mobility; retain the exact owning result/issues. A throw
after complete package inputs is an application failure, not an unavailable game value.

## Exact result mapping

A complete package result retains every field unchanged:

- `speed` and `boost` in metres per second;
- `pitch`, `roll` and `yaw` in degrees per second;
- `massCurveMultiplier`; and
- `rotationMassCurveMultiplier`.

An incomplete result retains `value: null` and its exact ordered issues. This contract uses the
diagnostic result facade; it does not describe the result object itself as nullable. The separate
`mobilityMetrics()` convenience method is nullable but is not used.

## Thruster and power meanings

The package result directly supplies the required distinctions:

| Issue field/reason                       | Meaning                                            |
| ---------------------------------------- | -------------------------------------------------- |
| `thrusters/missing`                      | no fitted thrusters                                |
| `thrusters/disabled`                     | fitted thrusters switched off                      |
| `thrusters/shed`                         | thrusters not powered with hardpoints retracted    |
| `thrusters/unresolved`                   | package-resolved fitted performance unavailable    |
| `powerCapacity/*` or `powerDraw/invalid` | exact package power dependency unavailable/invalid |

Feature 008 preserves those issue objects and performs no separate `powerBudget()` check or feature
005 join. Source provenance and package calculation availability stay separate.

A complete all-zero result above the thruster maximum supported mass is ready zero, including both
multipliers. It is never converted to incomplete. This capability does not show hull base mobility
as a fallback; if another capability shows hull base values, it must label them as catalogue facts.

## Thruster identity and sparse parameters

Locate the source through `slots('core')` where `core === 'thrusters'`; retain the exact game key
(`MainEngines` in current layouts), symbol and optional `on`. Only present post-engineering
`effectiveStats` fields may be shown:

- shared `minMass`, `optMass`, `maxMass`, `minMultiplier`, `optMultiplier`, `maxMultiplier`;
- optional speed `min/opt/maxSpeedMultiplier`; and
- optional rotation `min/opt/maxRotationMultiplier`.

The two selected-load multipliers come from the complete mobility result. No threshold becomes a
bar width, curve, percentage-of-optimal or headroom value.

## Viewing and revision behavior

- Drives & Mass shows the settled load and ENG pips as read-only context.
- Apply/Reset controls remain solely in feature 003's Status capability.
- Build or accepted condition changes create a new captured revision pair.
- The detailed capability and Status adapter use the same projector/context.
- An old snapshot is never relabelled with new load/pip text.

## Verification

Tests compare all seven fields with one live package call at maximum, unladen and laden loads and ENG
0, 0.5, 2 and 4. They prove the call guard, distinguish missing/disabled/shed/package-issue-unresolved/power issues
from ready all-zero performance, verify no hull fallback or power reconstruction, retain exact issue
order and test sparse source facts by exact slot key.
