# Jump Performance Contract

## Inputs and call guard

The projector receives one captured active `ShipLoadout` and build revision. Before calling a jump
method it reads:

1. `unladenMassResult`;
2. `fuelCapacityResult`;
3. `cargoCapacityResult`;
4. the package fitted Frame Shift Drive source and its effective jump parameters.

`jumpRangeSummary()` is invoked exactly once only when all required diagnostics are complete and the
package source can supply a usable drive. A failed diagnostic result remains `incomplete` with all
ordered issues. Missing/unresolved drive state or a safely handled package throw remains
`unavailable`; no fallback value is passed.

## Ready result mapping

| Application load identity | Single range source | Total range source           | Jump-count source            |
| ------------------------- | ------------------- | ---------------------------- | ---------------------------- |
| maximum                   | `summary.max`       | `summary.totalMax.range`     | `summary.totalMax.jumps`     |
| unladen                   | `summary.unladen`   | `summary.totalUnladen.range` | `summary.totalUnladen.jumps` |
| laden                     | `summary.laden`     | `summary.totalLaden.range`   | `summary.totalLaden.jumps`   |

The complete `JumpRangeSummary` is projected at once. Every number is copied exactly and associated
with the exact fitted drive slot/symbol. Light-years and integer counts are formatted only in the
presenter for the active locale.

## Zero and unavailable semantics

- Complete zero main fuel remains a valid package input. Six zero range/count results remain ready
  numeric zero.
- Complete zero cargo capacity may make unladen and laden values equal. Both labelled profiles remain.
- Incomplete mass, fuel or cargo never becomes zero and prevents the summary call.
- No fitted or unresolved drive produces no numeric jump result.
- Drive enabled state is shown as a fitted fact when supplied, but feature 008 does not invent a
  power-readiness gate absent from the package jump contract.

## Fitted drive facts

The source projection may show only package-returned post-engineering facts relevant to the feature:
`optMass`, `maxFuel`, `fuelMul`, `fuelPower` and optional `jumpBoost`. Missing facts remain absent.
There is no application-owned optimal-mass headroom, fuel cap, mass factor, range, fuel-per-jump or
jump-count calculation.

## Selected-load integration

Feature 003 chooses which one of the three summary profiles supplies the status headline and shared
load context. Feature 008 does not own a second selector. It reuses feature 003's released
`standardLoadResult()` mapping and never recreates `min(mainCapacity, maxFuel)`.

## Revision and failure behavior

- The summary and drive source belong to the same captured build revision.
- A stale projection is discarded in full.
- An unexpected package exception produces a current-revision nonnumeric failure; prior figures
  remain associated only with their old revision.
- One settled result change contributes to the capability's single coalesced polite announcement.

## Verification

Contract tests prove call count/guards, exact field equality, ordered diagnostics, drive identity,
zero fuel, zero cargo, missing/unresolved drive, package failure and stale-revision rejection. Tests
must not contain a local jump, total-range, fuel-cap or count formula.
