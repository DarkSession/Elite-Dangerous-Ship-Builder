# Feature Specification: Mobility, Mass and Jump

## Scope

This capability presents package jump ranges, speed, boost, rotation, mass and capacity for the
active build. Route planning, neutron boosts and application-calculated mass or curve breakdowns are
out of scope.

## User Scenarios

### Story 1 — Read jump performance (P1)

1. Maximum, unladen and laden single-jump range, total range and jump count are shown together.
2. Each value identifies its load state and fitted Frame Shift Drive.
3. No usable drive or unresolved input produces unavailable output; no fuel produces package zero.

### Story 2 — Read mobility (P1)

1. Speed, boost, pitch, roll, yaw and both mass-curve multipliers use selected load and ENG pips.
2. Missing, disabled, unpowered or unresolved thrusters produce unavailable build mobility.
3. Hull base values, when shown, are explicitly catalogue facts rather than build estimates.

### Story 3 — Read mass and capacity (P2)

1. Unladen mass, main and reserve fuel capacity and cargo capacity retain package diagnostics.
2. Every fitted module's package-resolved post-engineering mass is shown by slot.
3. Unknown module mass makes dependent aggregates unavailable, never zero.

## Requirements

- **FR-001**: Every mobility, mass and jump value MUST come from
  `@elite-dangerous-almanac/core`; the application MUST NOT implement a jump, range, mobility, mass
  or curve calculation.
- **FR-002**: Standard jump values MUST use `ShipLoadout.jumpRangeSummary()` for maximum, unladen and
  laden single and total ranges and jump counts.
- **FR-003**: The application MUST call package jump functions only after required diagnostic mass
  and capacity results are complete. Failure MUST remain unavailable without a guessed value.
- **FR-004**: Mobility MUST use `ShipLoadout.mobilityMetrics()` for selected fuel, cargo and ENG pips
  and show every returned speed, boost, rotation and multiplier field.
- **FR-005**: A `null` mobility result MUST remain unavailable. Hull base values MUST NOT be
  substituted for it.
- **FR-006**: Aggregate mass and capacity MUST use `unladenMassResult`, `fuelCapacityResult` and
  `cargoCapacityResult`; all package issues MUST remain attached.
- **FR-007**: Per-module mass MUST use package-resolved post-engineering stats and MAY be ordered for
  presentation without being re-summed.
- **FR-008**: Frame Shift Drive and thruster thresholds, factors and multipliers MUST be shown only
  when returned by package records or results.

## Edge Cases

- No fuel is a real zero range; no usable drive is unavailable.
- No cargo capacity makes laden and unladen package results equal.
- Thrusters above supported mass retain the package's zero-performance result.
- Unpowered thrusters remain distinct from absent thrusters.

## Almanac Coverage

`jumpRangeSummary()`, `mobilityMetrics()`, `unladenMassResult`, `fuelCapacityResult` and
`cargoCapacityResult` provide every aggregate. Fitted modules provide their resolved mass.

## Success Criteria

- **SC-001**: Every displayed value equals its Almanac field.
- **SC-002**: No local jump, mobility, mass-total or curve calculation exists.
- **SC-003**: Zero, unavailable and incomplete results remain distinguishable with package issues.
