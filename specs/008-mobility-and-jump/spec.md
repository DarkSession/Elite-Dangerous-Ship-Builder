# Feature Specification: Mobility, Mass and Jump

## Scope

This specification covers jump range, total range, speed, boost, rotation rates and the mass and
capacity values the Almanac exposes for the active build. It inherits the statistic rules and
viewing conditions in [Ship Statistics](../003-ship-statistics/spec.md).

It does not define route planning, neutron boosting, mass distribution or locally calculated mass
breakdowns and curve positions.

## User Scenarios & Testing

### User Story 1 - Read jump performance (Priority: P1)

A Commander can see single-jump and total-range performance for the Almanac's standard load states.

**Independent Test**: Load a reference build and compare the complete range summary with
`jumpRangeSummary()`.

**Acceptance Scenarios**:

1. **Given** a usable Frame Shift Drive, **When** jump performance is shown, **Then** maximum,
   unladen and laden single-jump ranges and their total ranges and jump counts are visible.
2. **Given** jump figures, **When** they are shown, **Then** the fitted drive, its engineering and
   the load represented by each result are identifiable.
3. **Given** no usable drive or an incomplete mass or capacity input, **When** jump performance is
   requested, **Then** it is unavailable with the Almanac reason.
4. **Given** a usable drive but no fuel, **When** range is shown, **Then** the package's genuine
   zero result is retained and explained.

### User Story 2 - Read mobility (Priority: P1)

A Commander can see speed, boost and rotation rates for the selected load and ENG pips.

**Independent Test**: Compare speed, boost, pitch, roll, yaw and both mass-curve multipliers with
`mobilityMetrics()` across loads and ENG allocations.

**Acceptance Scenarios**:

1. **Given** powered, resolved thrusters, **When** mobility is shown, **Then** speed, boost, pitch,
   roll, yaw, speed multiplier and rotation multiplier match the package result.
2. **Given** changed load or ENG pips, **When** the package recomputes mobility, **Then** every
   dependent value identifies the conditions used.
3. **Given** missing, disabled, unpowered or unresolved thrusters, **When** mobility is requested,
   **Then** build-specific values are unavailable with the applicable reason.
4. **Given** unavailable build mobility, **When** hull base values are also shown, **Then** they are
   clearly identified as hull catalogue values rather than estimates for the build.

### User Story 3 - Understand mass and capacity (Priority: P2)

A Commander can see the build's unladen mass, fuel capacity, cargo capacity and the mass of each
fitted module.

**Independent Test**: Compare mass and capacity results with the corresponding `ShipLoadout`
results and each fitted module's resolved post-engineering mass.

**Acceptance Scenarios**:

1. **Given** a complete build, **When** mass is shown, **Then** unladen mass, main and reserve fuel
   capacity and cargo capacity match the package results.
2. **Given** fitted modules, **When** their mass detail is shown, **Then** each package-resolved mass
   is identified by slot and may be ordered without changing it.
3. **Given** missing mass or capacity inputs, **When** the affected value is shown, **Then** the
   diagnostic result names every unresolved dependency.
4. **Given** fitted thrusters and a drive, **When** their mass information is shown, **Then** only
   catalogue thresholds and multipliers or factors returned by the package are displayed.

### Edge Cases

- No fuel produces a real zero range; no drive produces an unavailable range.
- No cargo capacity makes laden and unladen package results equal.
- Thrusters above their supported mass retain the package's zero-performance result.
- Unknown module mass makes dependent aggregate results unavailable; it is not counted as zero.
- Unpowered thrusters are distinct from absent thrusters.

## Requirements

### Functional Requirements

- **FR-001**: Every mobility, mass and jump value and calculation MUST come directly from
  `@elite-dangerous-almanac/core`.
- **FR-002**: Range presentation MUST use all fields returned by `jumpRangeSummary()` for maximum,
  unladen and laden states. The application MUST NOT reconstruct a jump formula or total-range
  iteration.
- **FR-003**: The three states MUST retain the Almanac's meanings: maximum is one jump's fuel with an
  empty hold; unladen is a full tank with an empty hold; laden is a full tank with a full hold.
- **FR-004**: The fitted Frame Shift Drive and its engineering MUST be identified from package data.
- **FR-005**: Mass-lock factor MAY be shown only as the hull value published by the Almanac.
- **FR-006**: Mobility presentation MUST use speed, boost, pitch, roll, yaw and both mass-curve
  multipliers returned by `mobilityMetrics()` for the selected load and ENG pips.
- **FR-007**: The application MUST NOT scale hull base mobility, evaluate a thruster curve or derive
  a missing build-specific mobility value.
- **FR-008**: Unladen mass, fuel capacity and cargo capacity MUST use their diagnostic
  `ShipLoadout` results so missing inputs remain distinguishable from zero.
- **FR-009**: Per-module mass MUST be the package-resolved post-engineering value and MUST retain the
  slot identity. Ordering these values is presentation only.
- **FR-010**: The application MUST NOT display a locally summed module mass, fuel mass, loaded mass,
  curve headroom or curve percentage. Such values require an Almanac result before entering scope.
- **FR-011**: Catalogue curve thresholds, `mobilityMetrics()` multipliers and
  `frameShiftDriveMassFactor()` MAY be shown as separate package values; the application MUST NOT
  combine them into another metric.
- **FR-012**: Mobility, mass and jump detail MUST remain operable and readable at every supported
  viewport without horizontal page scrolling.

### Verification Requirements

- **FR-013**: Unit tests MUST compare every range field with `jumpRangeSummary()` across normal,
  no-drive, no-fuel and no-cargo cases.
- **FR-014**: Unit tests MUST compare every mobility field with `mobilityMetrics()` across loads,
  ENG pips, unpowered thrusters and above-maximum mass.
- **FR-015**: Unit tests MUST compare mass and capacity results and their diagnostics with the
  corresponding `ShipLoadout` accessors and fail if a prohibited local aggregate appears.
- **FR-016**: Each primary journey MUST have end-to-end coverage at desktop, tablet and mobile
  viewports in Chromium and Firefox, including automated accessibility checks.

## Key Entities

- **Jump summary**: The package's three single-jump results and three total-range results.
- **Mobility profile**: Package-computed speed, boost, rotation rates and multipliers for stated
  load and ENG pips.
- **Mass and capacity**: Diagnostic unladen mass, fuel capacity, cargo capacity and per-module mass.

## Almanac Coverage

`ShipLoadout.jumpRangeSummary()` supplies all standard single-jump and total-range values.
`mobilityMetrics()` supplies complete speed, boost, rotation and curve-multiplier results.
`unladenMassResult`, `fuelCapacityResult` and `cargoCapacityResult` supply diagnostic aggregates,
while fitted modules supply post-engineering mass. Every required number is returned by the package.

## Success Criteria

- **SC-001**: Every displayed mobility, mass and jump value equals the corresponding Almanac field
  across the reference corpus.
- **SC-002**: No local jump, mobility, mass-total or curve calculation exists.
- **SC-003**: Zero, unavailable and incomplete results remain distinguishable and retain their
  reasons.
- **SC-004**: Load and ENG-pip changes update all dependent package results within 100 ms.
- **SC-005**: The full area passes the required viewport, browser and accessibility test matrix
  without horizontal page scrolling.
