# Research: Mobility, Mass and Jump

Research used the installed `@elite-dangerous-almanac/core@0.1.0-beta.12`, its public leaf types,
runtime probes over detached `ShipLoadout` values, the accepted feature 003/005 contracts and the
`.design/Ship Builder.dc.html` Drives & Mass regions. No application formula or private game datum
was used.

## Decision 1: publish one guarded, revision-coherent projection

**Decision**: A pure `MobilityProjector` receives one active `ShipLoadout`, its immutable application
revision, feature 003's settled load/ENG condition and revision, and feature 005's package-authored
thruster power observation. It captures the three diagnostic aggregate results and fitted source
records first, then invokes the permitted jump and mobility boundaries only when their documented
inputs are available. One immutable `MobilityJumpSnapshot` is published atomically.

Components consume only the snapshot and emit optional exact-slot intents. A changed build or
condition revision invalidates the whole previous snapshot; stale values are never relabelled with a
new load or pip setting.

**Rationale**: `ShipLoadout` is mutable and carries no public revision. Guarding package methods at a
single boundary preserves their throwing/null semantics and prevents independently rendered regions
from describing different build revisions.

**Alternatives considered**:

- Per-component package calls can mix revisions and duplicate call guards.
- Persisting projections or load/ENG conditions creates stale derived data.
- Catching exceptions in components hides the distinction between package incompleteness and an
  unexpected application failure.

## Decision 2: diagnostic aggregates are the prerequisite boundary

**Decision**: Read and preserve `unladenMassResult`, `fuelCapacityResult` and
`cargoCapacityResult` before dependent calls. Each `CalculationResult<T>` remains either:

- `complete`, with its exact value and empty issues; or
- `incomplete`, with `value: null` and every package issue in original order.

Issue `field`, optional `slot`, optional `symbol`, canonical `message` and `params` remain attached.
The presenter does not parse the message. A complete numeric zero is never converted to incomplete or
unavailable.

**Rationale**: Beta.12 deliberately uses a discriminated result for aggregate completeness. Runtime
probes confirm that an unresolved hardpoint can make mass incomplete and that an unresolved optional
module can make mass, fuel and cargo incomplete because its role is unknown. Dependent jump/mobility
methods throw rather than guess, so the diagnostic results are the required safe gate.

**Alternatives considered**:

- Calling first and treating every throw alike would discard structured issues.
- Replacing missing inputs with zero fabricates a valid-looking build.
- Deduplicating issue messages can erase separate slot dependencies.

## Decision 3: preserve the complete standard jump summary

**Decision**: After mass, main/reserve fuel, cargo and a usable fitted Frame Shift Drive are
established, call `jumpRangeSummary()` exactly once. Preserve:

| Load identity | Single jump | Total result                               |
| ------------- | ----------- | ------------------------------------------ |
| maximum       | `max`       | `totalMax.range`, `totalMax.jumps`         |
| unladen       | `unladen`   | `totalUnladen.range`, `totalUnladen.jumps` |
| laden         | `laden`     | `totalLaden.range`, `totalLaden.jumps`     |

Every profile carries the same exact fitted-drive source reference. Missing or unresolved drive
facts produce an unavailable jump projection without calling the summary. A handled package throw
also remains generic unavailable beside directly observed prerequisites; it receives no inferred
diagnosis.

**Rationale**: The facade already owns the standard-load definitions and every jump/range
calculation. Runtime probes confirm zero main fuel yields zero for all three single ranges and all
three total `{ range, jumps }` results, while zero cargo can make laden and unladen results equal.
Those are valid package answers, not empty states.

**Alternatives considered**:

- Calling `maxJumpRange`, `jumpRange` and `totalRange` separately duplicates the required facade.
- Calculating jump count or totals locally violates FR-001/FR-002.
- Collapsing equal laden/unladen results loses their distinct load identities.

## Decision 4: reuse feature 003's package-only standard loads

**Decision**: Feature 008 creates no load selector. It consumes feature 003's settled mapping:

| Selected load | Jump field | Mobility arguments                                               |
| ------------- | ---------- | ---------------------------------------------------------------- |
| maximum       | `max`      | `cargo: 0`, `fuel: fuelPerJump(maxJumpRange())`                  |
| unladen       | `unladen`  | `cargo: 0`, package default full main tank                       |
| laden         | `laden`    | completed package cargo capacity, package default full main tank |

The maximum case is two package method calls, not an application formula. No consumer repeats
`min(mainCapacity, maxFuel)` or derives fuel from drive constants.

**Rationale**: This mapping is already frozen by
`specs/003-ship-statistics/contracts/viewing-conditions.md`. It keeps the headline and detail on one
condition revision. [Almanac #295](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/295)
requests a direct standard-load result, but its existing package-only composition is exact and
non-blocking.

**Alternatives considered**:

- A second load store/control can diverge from the status headline.
- Treating maximum as empty fuel gives the package's real zero-fuel result, not maximum jump.
- Recreating the drive/tank cap is a prohibited parallel calculation.

## Decision 5: map all mobility fields exactly once

**Decision**: Call `mobilityMetrics({ fuel, cargo, enginesPips })` exactly once for the selected
settled load and feature 003 ENG pips. A ready result copies all seven fields:

| Field                         | Meaning/unit                               |
| ----------------------------- | ------------------------------------------ |
| `speed`                       | selected-pip top speed, m/s                |
| `boost`                       | boost speed at selected load, m/s          |
| `pitch`                       | pitch rate, degrees/s                      |
| `roll`                        | roll rate, degrees/s                       |
| `yaw`                         | yaw rate, degrees/s                        |
| `massCurveMultiplier`         | speed-curve multiplier at selected load    |
| `rotationMassCurveMultiplier` | rotation-curve multiplier at selected load |

`null` remains unavailable. A non-null result with all numeric zeroes because loaded mass exceeds the
thruster maximum remains ready zero performance.

**Rationale**: Beta.12 accepts finite non-negative fuel/cargo and ENG pips from 0 through 4,
including half steps. The returned object is already the complete package projection. Above supported
mass is explicitly documented and observed as zero performance rather than null.

**Alternatives considered**:

- Re-running the data-free curve functions would create a second build calculation path.
- Treating a falsy speed as unavailable collapses package zero into null.
- Hiding the multipliers would violate FR-004.

## Decision 6: wait for package-authored powered-thruster behavior

**Decision**: Feature 008 is blocked until a released fix for
[Almanac #296](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/296) is pinned. Beta.12's
documented contract says mobility is null without powered, fully described thrusters, but the method
ignores priority shedding:

```js
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';

const build = ShipLoadout.default('SideWinder').setModuleEnabled('PowerPlant', false);

console.log(build.powerBudget().available); // 0
console.log(build.powerBudget().bands[0].poweredRetracted); // false
console.log(build.mobilityMetrics()); // beta.12: finite, should be null
```

After #296, feature 005's package-backed exact-slot observation supplies the textual distinction
between present-but-unpowered and absent/disabled/unresolved thrusters. That observation depends on
the public module consumer projection requested by
[Almanac #299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299). Feature 008 neither
copies priority rules nor infers “unpowered” merely because other known states were excluded.

**Rationale**: The spec explicitly requires unpowered thrusters to remain distinct. Nulling the
finite beta.12 result or reverse-engineering power bands in feature 008 would be a local correction
of package behavior. #296 and #299 both contain minimal upstream reproductions and requested
contracts, so no duplicate issue is needed.

**Alternatives considered**:

- A local `powerBudget()` gate changes the result before the library fix lands.
- Inferring power state from a nullable mobility result invents a diagnosis the result does not
  carry.
- Copying feature 005's consumer logic creates divergent power ownership.

## Decision 7: fitted source facts are sparse package records

**Decision**: Identify Frame Shift Drive and thruster sources from package slot snapshots and
post-engineering `FittedModule.effectiveStats`. Each source carries exact slot, symbol, package game
text, enabled state and only the relevant facts actually present.

FSD facts may include `optMass`, `maxFuel`, `fuelMul`, `fuelPower` and `jumpBoost`. Thruster facts may
include `minMass`, `optMass`, `maxMass`, the shared `min/opt/maxMultiplier` triple and optional
speed/rotation multiplier triples. Actual selected-load multipliers remain the two
`MobilityMetrics` result fields. No fact is derived from another and absent optional members remain
absent.

**Rationale**: Beta.12 exposes post-engineering drive parameters and thruster curve records through
public leaf contracts. Showing identity beside results satisfies provenance without maintaining a
private catalogue or turning thresholds into a locally calculated graph.

**Alternatives considered**:

- Name/symbol prefix matching is not a package identity contract.
- Calculating headroom, percentage-of-optimal or a curve plot adds values the package did not return.
- Showing hull catalogue speed as a fallback for null mobility violates FR-005.

## Decision 8: module mass is one exact slot-keyed projection

**Decision**: Enumerate fitted package snapshots once. For every fitted module, emit its exact
`slot`, `symbol`, package game text and `effectiveStats.mass` when present; otherwise emit an
unavailable mass for that module. Preserve package order unless presentation sorting is explicitly
chosen, and never re-sum the list.

**Rationale**: Runtime probing of a Grade 5 Lightweight sensor changed its fitted mass from 1.3 t to
0.26 t and changed `unladenMassResult` consistently, confirming that `effectiveStats.mass` is the
required post-engineering source. Slot is the stable identity even when symbols repeat.

**Alternatives considered**:

- Catalogue base mass ignores engineering.
- Reading raw journal modifiers duplicates package modifier resolution.
- Comparing or summing module rows into an aggregate would create a second mass result.

## Decision 9: preserve semantic result states without changing values

**Decision**: Presentation unions retain:

- `ready`, including exact zero;
- `incomplete`, with ordered `CalculationIssue` projections;
- `unavailable`, for package null or safely handled dependency failure;
- source observations `absent`, `disabled`, `unpowered`, `unresolved` and `present` only when their
  owning package snapshots/feature 005 observation establish them;
- `failure`, for an unexpected current-revision exception, with no stale numeric value.

These are view semantics over package discriminants and directly observed facts. No state supplies a
replacement number.

**Rationale**: The accepted spec and constitution require zero, unavailable and incomplete to remain
distinguishable. Separate source observations let the UI explain why a package result is unavailable
without pretending the explanation is itself a calculated mobility value.

**Alternatives considered**:

- A single placeholder for every non-ready state hides actionable package evidence.
- Truthiness and nullish defaults erase real zeroes.
- Keeping stale metrics visible under new conditions creates a false result.

## Decision 10: compose existing workspace and design-system boundaries

**Decision**: Add no route. Mobility, Mass and Jump composes inside feature 001's `/build` workspace,
opens from feature 003's Mobility headline/capability navigation, consumes feature 003's shared
conditions and feature 005's power observation, emits exact-slot intents to feature 002, and uses
feature 011's tokens, components, locale formatters, announcements and accessibility harness.

The reference's adjacent thruster and drive regions, prominent load context and wide-to-stacked
direction are useful. Its authored bars, mass decomposition, comparisons, arbitrary scales,
headroom, mass-lock value and incomplete narrow result set are rejected.

**Rationale**: This keeps one active build, one condition store, one navigation model and one design
system while presenting every required field at every width.

**Alternatives considered**:

- A separate route or persisted capability selection fragments the shared workspace.
- Feature-owned controls can disagree with the status headline.
- Copying the reference literally would omit required fields and introduce unsupported calculations.

## Decision 11: validate direct package equality across the full product matrix

**Decision**: Unit tests use real package-backed builds and compare every projection field directly
with the live facade results and fitted snapshots. Spies prove incomplete dependencies prevent jump
or mobility calls. Synthetic result-state fixtures are limited to presenter/component boundaries for
states difficult to produce without the released dependencies.

Playwright covers the three user stories and meaningful states in ten projects: Chromium and Firefox
at desktop, tablet portrait/landscape and mobile portrait/landscape. Every state receives an automated
accessibility scan plus semantic, overflow, zoom, touch-target, expanded/RTL text, reduced-motion and
announcement assertions. A settled revision reaches matching DOM within 100 ms at mobile Chromium
under 4x CPU slowdown.

**Rationale**: Exact result comparison detects package drift without hand-maintained golden game
figures. The matrix and accessibility scan are constitutional release gates.

**Alternatives considered**:

- Mock-only tests cannot prove SC-001.
- Hand-calculated expected values recreate Almanac logic.
- Chromium-only, portrait-only or axe-only coverage is incomplete.

## Almanac dependencies and release gates

Every unresolved Almanac dependency identified by this plan is already raised in the Almanac
repository:

1. [#296](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/296) is the direct blocking
   defect for feature 008: beta.12 returns finite mobility for power-shed thrusters.
2. [#299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299) supplies feature 005's
   package-authored per-module power observation, required to name the unpowered state without local
   consumer reconstruction.
3. [#295](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/295) is a non-blocking API
   improvement for first-class standard-load inputs/results.

No additional package defect or missing direct mobility/jump/mass/capacity API was established.
Implementation waits for released #296/#299 contracts, pins the released package, reruns both
minimal reproductions and updates these type projections if the released API shape differs. No local
workaround is planned.
