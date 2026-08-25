# Research: Mobility, Mass and Jump

> **Superseded in part.** This document was written before the design review and describes an
> arrangement and a package surface the design and the installed Almanac replaced. Three corrections
> govern anything read here:
>
> 1. **Getters that do not exist.** `unladenMassResult`, `fuelCapacityResult` and
>    `cargoCapacityResult` are not in `@elite-dangerous-almanac/core`, deliberately: the package
>    documents those three aggregates as figures it can always state, with `importOutcomes()` rather
>    than a `CalculationResult` as the report. Of those three only `fuelCapacity` is read; the
>    build's mass split comes from `buildMass(load)` and the thruster's curve from
>    `ShipLoadout.thrusters`. See FR-006 in [spec.md](./spec.md).
> 2. **Two cards, not five surfaces.** Canvases 1c and 1d draw `THRUSTER LOAD` and `FRAME SHIFT
DRIVE`; the five stacked components and the per-module mass list described below are not built.
>    See [design/reference-review.md](./design/reference-review.md) and
>    [design/mobility-and-jump-profile.md](./design/mobility-and-jump-profile.md).
> 3. **Only what the canvas draws.** The two mass-curve multipliers, a Guardian booster's jump bonus,
>    `unladenMass` and `cargoCapacity` are real package figures neither canvas has, so none is read
>    or drawn. See FR-004 and FR-006 in [spec.md](./spec.md).
>
> Where this document and those disagree, those decide.

Research used the installed `@elite-dangerous-almanac/core` declaration/runtime contracts,
the accepted feature 001/002/003/011 plans, and the wide/narrow Drives & Mass regions in
`.design/Ship Builder.dc.html`. No game value was independently calculated.

## Decision 1: publish one synchronous, revision-stamped projection

**Decision**: A pure projector accepts feature 003's captured `StatusRevisionContext`—one
`ShipLoadout`, `buildRevision`, settled viewing conditions and `conditionsRevision`. It reads all
package results and fitted snapshots synchronously and returns one deeply immutable
`MobilityJumpSnapshot`. The detailed capability store and feature 003 status provider share this
projector; they do not read independently settled derived state.

**Rationale**: `ShipLoadout` is mutable and has no package revision. One captured application
revision prevents jump, mobility and mass regions from describing different edits or conditions.

**Alternatives considered**:

- Package calls from components duplicate guards and can mix revisions.
- Persisted derived results become stale and wrongly enter build data.
- An asynchronous worker adds coordination without useful work; all package methods are synchronous.

## Decision 2: preserve package diagnostic results exactly

**Decision**: Keep `unladenMassResult`, `fuelCapacityResult`, `cargoCapacityResult`, each
`standardLoadResult()` and `mobilityMetricsResult()` as exact `CalculationResult<T>` values wherever
possible. Do not create a reduced issue type. An issue retains:

- `field`: `mass | cargoCapacity | fuelCapacity | frameShiftDrive | powerCapacity | powerDraw |
thrusters | shieldGenerator`;
- `reason`: `missing | unresolved | disabled | shed | invalid`;
- optional `slot` and `symbol`;
- required canonical `message`; and
- optional readonly `params`.

Issue order and the non-empty incomplete tuple are unchanged. Application presentation requests
`getCalculationIssueMessage(issue, locale)` through feature 011 and uses the established canonical
fallback disclosure when that helper returns `null`; it never parses `message`.

Here `unresolved` is an exact package calculation-issue reason for a package-resolved build input; it
does not authorize unsupported module identities. Ingress supplies only package-resolved identities.

**Rationale**: The old 008 artifacts incorrectly listed `hullMass` and `reserveFuelCapacity` and
omitted `reason`. Preserving the package type eliminates that drift and keeps all unavailable-state
evidence.

**Alternatives considered**:

- Mapping to prose-only issues loses stable fields/reasons.
- Deduplicating issues can erase separate slot dependencies.
- Replacing incomplete `null` with zero fabricates a complete result.

## Decision 3: guard the jump summary with all three standard loads

**Decision**: Cache:

```text
standardLoadResult('maximum')
standardLoadResult('unladen')
standardLoadResult('laden')
```

Call `jumpRangeSummary()` exactly once only when all three are complete. A complete summary is kept
whole and displayed as:

| Capability identity | Single jump | Total range          | Jump count           |
| ------------------- | ----------- | -------------------- | -------------------- |
| maximum             | `max`       | `totalMax.range`     | `totalMax.jumps`     |
| unladen             | `unladen`   | `totalUnladen.range` | `totalUnladen.jumps` |
| laden               | `laden`     | `totalLaden.range`   | `totalLaden.jumps`   |

Any incomplete standard load becomes the nonnumeric guarded result with its exact package issues.
Any throw after complete guards is an unexpected application/package failure, not an inferred game
diagnosis.

**Rationale**: The maximum standard-load result validates mass, fuel and the complete fitted FSD
path, including an active Guardian booster; laden adds cargo. Manually inspecting the fitted FSD's
effective stats cannot validate the booster and is therefore not a safe call guard. The three
standard results are the package-owned definitions required by feature 003's load mapping.

**Alternatives considered**:

- Guarding only with aggregate results misses a missing/package-incomplete FSD.
- Guarding with fitted FSD fields can miss an incomplete active booster or invalid package input.
- Calling individual range functions or counting jumps locally duplicates Almanac logic.

## Decision 4: use feature 003's selected load without redefining it

**Decision**: Consume feature 003's `LoadState` exactly:

| Feature 003 state | Almanac standard load | Selected jump field        |
| ----------------- | --------------------- | -------------------------- |
| `maximumJump`     | `maximum`             | `max` / `totalMax`         |
| `unladen`         | `unladen`             | `unladen` / `totalUnladen` |
| `laden`           | `laden`               | `laden` / `totalLaden`     |

Feature 008 owns the package calls. Feature 003 owns only the condition identity, integer half-pips,
draft validation and revision. ENG half-pips are divided by two once at the mobility call boundary.

**Rationale**: The accepted feature 003 contract explicitly says it does not compose fuel/cargo or
guard jump methods. Reusing its state prevents a second selector and keeps the detail and Status
headline on one condition revision.

**Alternatives considered**:

- An 008-owned load/ENG store can diverge from Status.
- Renaming `maximumJump` to a second domain value weakens the shared contract.
- Computing one-jump fuel with `min(capacity, maxFuel)` is a prohibited package reimplementation.

## Decision 5: call diagnostic mobility once for the selected standard load

**Decision**: When `unladenMassResult` and the selected cached standard-load result are complete,
call:

```text
mobilityMetricsResult({
  ...selectedStandardLoad.value,
  enginesPips: conditions.pips.engines / 2
})
```

Call it once and retain all seven fields from a complete value: `speed`, `boost`, `pitch`, `roll`,
`yaw`, `massCurveMultiplier` and `rotationMassCurveMultiplier`. An incomplete result retains its
exact issues. A residual exception after valid package inputs is an application failure.

**Rationale**: Explicit package-produced fuel/cargo prevents default-capacity ambiguity; the mass
result guards the remaining throwing dependency. The diagnostic facade is already the complete
package answer for speed, rotation, curve and power readiness.

**Alternatives considered**:

- Calling `mobilityMetrics()` loses structured reasons by returning bare `null`.
- Calling data-free curve helpers duplicates the build facade.
- Interpolating ENG pips or mass curves locally violates FR-001.

## Decision 6: use mobility issues—not feature 005—to distinguish thruster states

**Decision**: Treat the incomplete `mobilityMetricsResult()` issues as authoritative:

| Observed issue                         | Presented meaning                                         |
| -------------------------------------- | --------------------------------------------------------- |
| `field: thrusters, reason: missing`    | no fitted thrusters                                       |
| `field: thrusters, reason: disabled`   | fitted thrusters switched off                             |
| `field: thrusters, reason: shed`       | fitted thrusters not powered with hardpoints retracted    |
| `field: thrusters, reason: unresolved` | package-resolved thruster performance unavailable         |
| `field: powerCapacity \| powerDraw`    | the exact package power dependency is unavailable/invalid |

Do not pre-gate the call with a power budget or reinterpret these issues. A complete all-zero
`MobilityMetrics` above maximum supported thruster mass remains ready zero.

**Rationale**: The installed Almanac package directly returns every distinction required by the spec. Feature 005's
accepted observation contract is hardpoint-specific and is not a core-thruster API. Removing the old
feature 005 dependency avoids duplicate power classification and an integration cycle.

**Alternatives considered**:

- Joining `PowerBudget.consumers` and bands locally recreates package/provider logic.
- Inferring cause from nullable `mobilityMetrics()` throws away exact issues.
- Treating zero speed as unavailable collapses a documented package result.

## Decision 7: resolve FSD and thruster sources through package slot discriminators

**Decision**: Locate each core source from `loadout.slots('core')` by the package's `slot.core`
discriminator (`frameShiftDrive` or `thrusters`) and retain its exact `slot.key`, module `symbol`,
`on` state and `effectiveStats`. Do not hard-code a presumed key or search symbol prefixes. The game
key for thrusters is `MainEngines`, not `Thrusters`.

Module and slot display text is resolved in the presenter with Almanac locale helpers. The domain
snapshot does not store `effectiveStats.name` as localized text.

**Rationale**: `BuildSlot.core` is the package identity for a core function while `BuildSlot.key` is
the exact journal-compatible target. Package construction populates every required mount, and this
projection receives only package-resolved identities from supported ingress.

**Alternatives considered**:

- Positional lookup violates the identity rule.
- Symbol/name prefix matching is not a public identity contract.
- Hard-coded English names bypass package localization.

## Decision 8: keep source facts sparse and correctly attributed

**Decision**: The fitted FSD record may expose only present post-engineering `optMass`, `maxFuel`,
`fuelMul` and `fuelPower`. The fitted thruster record may expose only present `minMass`, `optMass`,
`maxMass`, the shared multiplier triple and optional speed/rotation multiplier triples. The selected
load's two actual multipliers come only from the complete mobility result.

If the combined effective jump parameters are shown, use the guarded `ShipLoadout.frameShiftDrive`
record and label its `jumpBoost` as a build/booster parameter. Do not claim `jumpBoost` belongs to the
fitted FSD's `effectiveStats`; it comes from a separate active booster and the facade reports `0`
when none contributes.

**Rationale**: FR-008 permits package records/results, not inferred thresholds. Sparse display makes
absence honest and avoids turning parameters into a locally calculated chart.

**Alternatives considered**:

- Headroom, percentage-of-optimal, range bars and curve plots derive new values.
- An SCO badge inferred from symbol/name is not a package capability field.
- Folding booster output into the fitted-drive record misstates provenance.

## Decision 9: project every fitted module mass independently

**Decision**: Map `loadout.fittedModules()` once. Each entry retains exact `slot`, `symbol` and
`effectiveStats.mass` when present; absent mass becomes an explicit unavailable row. Presentation may
use package slot order but never sum, group, reconcile or substitute raw journal modifiers/base
catalogue mass.

An imported loadout may carry a complete authoritative `UnladenMass` even while one fitted module's
mass is unavailable. In that case the aggregate remains the package's complete value and the row
remains unavailable; feature 008 does not force one package result to match a local dependency model.

**Rationale**: `effectiveStats.mass` is the package-resolved post-engineering mass required by
FR-007. `unladenMassResult` is separately authoritative and may trust supplied import data.

**Alternatives considered**:

- Base mass ignores engineering.
- Reading journal modifiers reimplements effective-stat resolution.
- Re-summing rows creates an unauthorized competing aggregate.

## Decision 10: implement the feature 003 status provider in feature 008

**Decision**: Export `MobilityStatusProjection` and a synchronous provider implementing feature
003's generic envelope for `jumpRange`, `topSpeed` and `unladenMass`. It selects the settled jump
profile, selected-load mobility speed and fixed unladen aggregate from the same projector/context,
stamps both revisions and returns detail target `mobilityAndJump`. Feature 008, not feature 003, owns
which of those three identities is qualified/unavailable.

Delivery is staged: feature 003 first exports generic conditions/context/target/provider contracts;
feature 008 exports its concrete provider; feature 003 then assembles the complete provider bundle.

**Rationale**: This is the accepted cross-feature ownership and avoids a cycle where each completed
feature waits for the other.

**Alternatives considered**:

- Making 003 interpret 008's package results transfers domain ownership to the summary feature.
- Reading an independently settled 008 store can mix revisions in the Status transaction.
- Omitting the adapter leaves feature 003's required mobility headlines unimplemented.

## Decision 11: translate the design reference as hierarchy only

**Decision**: Keep the reference's “Drives” workspace mode, “Drives & Mass” heading, adjacent
mobility/jump regions, nearby source identities and complete narrow stack. Reject the mock's authored
numbers, inline design literals, mass decomposition, arbitrary bars, deltas, headroom, mass-lock,
centre-of-mass and abbreviated mobile result set. No anatomy artwork is required.

**Rationale**: The design is useful information architecture but is neither a data source nor the
repository design system. The spec requires more content on mobile than the mock contains.

**Alternatives considered**:

- Copying the mock would fabricate values and fail information parity.
- Creating a separate route would fragment the existing workspace/navigation contract.
- Preserving hover titles or tiny mass nodes would fail touch and screen-reader requirements.

## Decision 12: verify equality and semantics rather than golden game figures

**Decision**: Unit tests construct real package-backed builds and compare every snapshot value/result
directly with the same revision's Almanac output. Spies prove the three-load jump guard and selected
mobility guard. Presenter/component fixtures cover rare semantic states without hand-calculated
numbers. Playwright covers the three stories and meaningful states in ten feature 011 projects,
running axe on each surface/state and manual screen-reader/actual-zoom protocols.

**Rationale**: Direct equality detects mapping drift without copying game data or formulas. The
complete responsive/accessibility matrix is a constitutional release gate.

**Alternatives considered**:

- Mock-only projection tests cannot prove SC-001.
- Hand-maintained expected ship numbers become a second data source.
- Chromium-only or portrait-only coverage is constitutionally incomplete.

## Resolved questions and delivery blockers

All planning questions are resolved and no missing Almanac API or defect blocks this feature.
The installed Almanac package supplies all required standard-load, jump, mobility, aggregate, fitted-slot and
effective-stat contracts.

Repository delivery still requires the shared TypeScript strict-mode migration and feature 011's
complete localization/design-system/dual-engine accessibility foundation. Those are project gates,
not reasons to ship an 008-local substitute.
