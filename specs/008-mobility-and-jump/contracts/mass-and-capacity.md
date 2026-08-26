# Mass and Capacity Contract

> **Superseded in part.** This document was written before the design review and describes an
> arrangement and a package surface the design and the installed Almanac replaced. Three corrections
> govern anything read here:
>
> 1. **Getters that do not exist, and three aggregates that are not read.** `unladenMassResult`,
>    `fuelCapacityResult` and `cargoCapacityResult` are not in `@elite-dangerous-almanac/core`,
>    deliberately: the package documents those three aggregates as figures it can always state, with
>    `importOutcomes()` rather than a `CalculationResult` as the report. Of the three plain getters
>    that do exist, none is read. `fuelCapacity` was, while the fuel legend row named the tank it
>    stood for; the canvas revision of 2026-08-25 cut that qualifier to the bare word `TANK`, so no
>    canvas draws a capacity any more and by this project's own rule none is read. The build's mass
>    split comes from `buildMass(load)` and the thruster's curve from `BuildMetrics.thrusters()`.
>    See FR-006 in [spec.md](../spec.md).
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

## Aggregate package boundary

Read these package properties exactly once per captured build revision:

| Capability value | Package source        | Complete value                   |
| ---------------- | --------------------- | -------------------------------- |
| unladen mass     | `unladenMassResult`   | tonnes                           |
| fuel capacity    | `fuelCapacityResult`  | exact `{ main, reserve }` tonnes |
| cargo capacity   | `cargoCapacityResult` | tonnes                           |

Keep each exact `CalculationResult` independently. One incomplete result does not hide another
complete result. Complete numeric zero remains numeric zero.

## Diagnostic preservation

Every incomplete result retains the complete package issue object and order: required `field`,
`reason`, `message`, optional `slot`, `symbol` and `params`. The presenter requests Almanac's locale
message and uses feature 011's canonical fallback disclosure; it never parses, merges, deduplicates
or privately translates diagnostic prose.

Examples of valid complete zero include no cargo rack (`cargoCapacity: 0`), no main tank with known
hull reserve (`main: 0`) and a zero-mass fitted article.

## Per-module mass boundary

Map `fittedModules()` once. Every fitted snapshot creates one entry containing:

- exact original `slot` key;
- exact module `symbol`; and
- exact post-engineering `effectiveStats.mass`, or explicit unavailable when effective stats/mass
  are absent.

Resolve module and slot display text through Almanac locale helpers in the presenter. Do not treat
`effectiveStats.name` as localized text.

Duplicate symbols in different slots remain distinct. Package order is the default presentation
order. If a module row exposes navigation, it emits the unchanged slot key through the shared
workspace target and feature 002 owns the reveal/edit action.

## Aggregate/row independence

Never sum, group, subtract or reconcile module rows. `unladenMassResult` is the only aggregate source.
Raw journal modifiers and catalogue base mass are prohibited fallbacks.

An imported build may carry a complete package-trusted `UnladenMass` while a resolved fitted module
has unavailable row mass. Preserve both package outcomes. Unsupported module identities are
outside the supported ingress contract; the application never overrides a package-supplied complete
aggregate.

## Relationship to dependent calls

- All aggregate results remain visible whether or not another calculation can run.
- Jump is called only when all three aggregate and all three standard-load results are complete.
- Mobility is called only when unladen mass and its selected standard-load result are complete.
- No issue/result is changed to make a dependent method callable.

## Verification

Tests deep-compare the three package results and every issue/order, cover complete zero and incomplete
states, verify engineered/zero/unavailable row mass, duplicate symbols in distinct slots, package-
trusted aggregate plus unavailable row, and exact-slot intent. Static review rejects any module-mass
sum or raw modifier resolution in feature 008.
