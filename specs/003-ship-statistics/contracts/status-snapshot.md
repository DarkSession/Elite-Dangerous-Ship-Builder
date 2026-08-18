# Status Snapshot Contract

## Ownership

Feature 003 coordinates but does not reimplement detailed calculations:

| Port                       | Owner | Supplied status content                                             |
| -------------------------- | ----- | ------------------------------------------------------------------- |
| `PowerHeadlinePort`        | 005   | selected draw/capacity, exact qualification and power detail target |
| `DefenceHeadlinePort`      | 006   | shield strength, armour, exact defence states and targets           |
| `OffenceHeadlinePort`      | 007   | sustained DPS, hardpoint observation and offence target             |
| `MobilityHeadlinePort`     | 008   | selected jump, top speed, mass, standard-load inputs and targets    |
| `AssemblyRequirementsPort` | 009   | credits, Merc Coin, materials, qualifications and targets           |

Each port accepts the same immutable `RevisionContext`. It returns values already classified into the
shared result union; feature 003 does not reclassify a numeric value based on private thresholds.

## Assembly transaction

1. Read the active build's `{ loadout, buildRevision }` atomically.
2. Read the settled `{ conditions, conditionsRevision }` atomically.
3. Capture feature 001 provenance associated with that active record revision.
4. Read `loadout.validation` once and project issues without reordering or deduplication.
5. Invoke every area port with the exact captured tuple.
6. Form counts from the completed visible projection.
7. Confirm the active build and condition revisions still match.
8. Publish the complete immutable `StatusSnapshot` in one signal assignment, or discard it.

Synchronous 0.1.1 reads still follow the transaction. If a port is lazy/asynchronous, all ports
settle under one request token. The UI may expose an updating state for the new context, never old
figures labelled with the new context.

## Package-source matrix

The owning ports use these direct 0.1.1 sources:

| Result                  | Package source                                                               |
| ----------------------- | ---------------------------------------------------------------------------- |
| Structural state/issues | `ShipLoadout.validation`                                                     |
| Selected power          | `powerBudget().deployed` or `.retracted`, plus `.available`                  |
| Shield strength         | completed `shieldMetricsResult({ systemsPips })` value                       |
| Armour                  | `armourMetrics().hitPoints`                                                  |
| Sustained DPS           | `weaponMetrics().total.sustainedDamagePerSecond`                             |
| Selected jump           | `jumpRangeSummary().max`, `.unladen` or `.laden`                             |
| Top speed               | completed `mobilityMetricsResult({ fuel, cargo, enginesPips })` value        |
| Unladen mass            | `unladenMassResult`                                                          |
| Credits                 | `retailCredits()`                                                            |
| Merc Coin               | recognized fitted variant fields and `mercCoinCost()`                        |
| Materials               | package blueprint/effect cost calls and `sumMaterials()` through feature 009 |

Only leaf subpath imports are permitted.

## Result semantics

- Exact zero is `available(0)`.
- Package `null` or a guarded/handled throw is `unavailable`; only directly observable prerequisites
  may accompany it.
- A failed `CalculationResult` is `incomplete` with every ordered package issue.
- A package numeric value missing unknown contributions is `lowerBound`; do not hide it.
- Package infinity uses `infinite` and the owning capability's semantic identity.
- No package-recognized Mercenary article is `absent`, not zero and not unavailable.
- A result can remain visible beside structural invalidity/incompleteness when the package returns it.
- No result state implies ready, flyable, working, good or optimal.

For `powerBudget().unknownDraws`, draw/utilisation can be identified as lower bounds. Headroom and
true boolean verdicts are qualified without falsely calling them lower bounds; false budget/powered
facts remain conclusive. Deployed-only summary fields do not appear under retracted conditions.

## Diagnostic preservation

Validation and calculation issues retain package order, code/field, severity where supplied, slot,
symbol, params and canonical message. The presenter never parses the message. Constraint data remains
where the package put it, including `params.constraint`.

Canonical package diagnostics can be accompanied by the shared untranslated disclosure. All
application labels, units, conditions and availability messages use localization identities and
locale-aware number/unit formatting.

## Failure and released regressions

An unexpected adapter exception produces a nonnumeric application failure state and leaves the last
settled snapshot associated only with its original revision; it is not relabelled as current.

Regression fixtures pin 0.1.1's [#296](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/296)
structured unavailable mobility/shield/recovery results and
[#297](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/297) unknown-hull construction
rejection. No adapter may locally gate, null, clamp or repair those package results.

## Verification

Contract tests supply spies for all ports and prove one identical revision tuple reaches each. They
cover stale synchronous/async work, exact package issue preservation, every discriminated state,
unknown-draw semantics and regression fixtures for the two released fixes.
