# Feature Specification: Power and Heat

## Scope

This specification covers power generation and draw, priority-group shutdown, distributor
capacitors and build heat. It inherits the statistic rules and viewing conditions in
[Ship Statistics](../003-ship-statistics/spec.md).

Changing a module's enabled state or power priority belongs to
[Module Outfitting and Engineering](../002-module-outfitting/spec.md). Weapon firing endurance is
specified by [Offence Profile](../007-offence-profile/spec.md).

## User Scenarios & Testing

### User Story 1 - Understand the power budget (Priority: P1)

A Commander can see what the plant produces, what the build draws with hardpoints retracted and
deployed, and which priority groups remain powered.

**Independent Test**: Load a build that fits while retracted but not while deployed and compare the
display with the Almanac power-budget result.

**Acceptance Scenarios**:

1. **Given** an active build, **When** power is shown, **Then** plant capacity and the Almanac's
   retracted and deployed draw totals are visible with their hardpoint states.
2. **Given** the package's priority bands, **When** either hardpoint state is inspected, **Then**
   each band shows its own draw, cumulative draw and powered state for that condition.
3. **Given** a module with unknown draw, **When** the budget is shown, **Then** it is named and the
   package's totals are identified as lower bounds.
4. **Given** a disabled module, **When** power is shown, **Then** it remains visible as disabled and
   contributes no draw.

### User Story 2 - Find large power consumers (Priority: P2)

A Commander can identify the fitted modules with the largest known power draws and reach their
slots.

**Independent Test**: Load an over-budget build and verify the module list uses post-engineering
Almanac draw values, keeps unknown draws separate and links each entry to the correct slot.

**Acceptance Scenarios**:

1. **Given** drawing modules, **When** their breakdown is shown, **Then** their package-reported
   draws are ordered by contribution and identified by slot.
2. **Given** a deployed-only module, **When** hardpoints are retracted, **Then** it remains listed
   with its package-reported draw and is identified as inactive in the selected state; no numeric
   current draw is invented.
3. **Given** an unknown draw, **When** modules are ordered, **Then** it is listed outside the numeric
   ordering rather than assigned an invented position.

### User Story 3 - Read distributor capacity (Priority: P2)

A Commander can see the capacity and pip-scaled recharge of SYS, ENG and WEP.

**Independent Test**: Change each pip allocation on an engineered distributor and compare all
capacities and recharge rates with the Almanac distributor result.

**Acceptance Scenarios**:

1. **Given** a powered distributor, **When** its statistics are shown, **Then** capacity and actual
   recharge rate are shown separately for SYS, ENG and WEP with the pips used.
2. **Given** a changed pip allocation, **When** the package recomputes distributor metrics, **Then**
   recharge changes and capacity does not.
3. **Given** no usable distributor, **When** distributor statistics are requested, **Then** the
   package's absent result is shown with the applicable missing, disabled or unpowered reason.

### User Story 4 - Understand heat (Priority: P2)

A Commander can see how hot the build runs in each heat scenario the Almanac models.

**Independent Test**: Load a build with a powered plant and weapons and compare all heat states,
overheat verdicts and unknown contributions with the Almanac heat result.

**Acceptance Scenarios**:

1. **Given** heat metrics, **When** they are shown, **Then** plant efficiency, hull heat capacity
   and dissipation are identified.
2. **Given** a reported heat scenario, **When** it is shown, **Then** thermal load, equilibrium heat
   or never-settles state, gauge level, overheat verdict and time-to-overheat result are presented
   without recalculation.
3. **Given** unresolved heat contributors, **When** heat is shown, **Then** they are named and the
   package's result is identified as a projection.

### Edge Cases

- With no plant, draw remains reportable but capacity is zero and heat is unavailable.
- With no weapons, weapon-firing heat states are identified as absent; other heat states remain.
- Zero-pip recharge is a genuine zero, not an unavailable value.
- A never-settles or never-overheats result is presented as a verdict, not a numeric infinity.

## Requirements

### Functional Requirements

- **FR-001**: All numeric values and power, distributor and heat calculations MUST come directly
  from `@elite-dangerous-almanac/core`.
- **FR-002**: Power presentation MUST show plant capacity plus both retracted and deployed total
  draw returned by the package. It MUST NOT calculate a second headroom, utilisation or
  powered-versus-unpowered total that the package does not return.
- **FR-003**: Every priority band MUST show the package's own draw, cumulative draw and powered flag
  for the relevant hardpoint state.
- **FR-004**: Unknown draws MUST be named and every result the package qualifies because of them
  MUST keep that qualification.
- **FR-005**: The per-module breakdown MUST use package-resolved, post-engineering draws. Ordering
  those values is presentation and MUST NOT alter them.
- **FR-006**: Each module entry MUST show its slot, enabled state, priority and whether its draw is
  deployed-only; it MUST link to that slot.
- **FR-007**: Distributor presentation MUST use the package's capacity, rated recharge, actual
  pip-scaled recharge and pip allocation for SYS, ENG and WEP. The application MUST NOT scale a
  recharge rate itself.
- **FR-008**: A missing, disabled, unresolved or unpowered distributor MUST be reported from the
  package's absent result and the build state; catalogue capacity MUST NOT be substituted.
- **FR-009**: Heat presentation MUST use only the scenarios and fields returned by the package:
  idle, thrusters, Frame Shift Drive charging, sustained firing and capacitor-drained firing.
- **FR-010**: Each heat state MUST preserve the package's thermal load, equilibrium availability,
  gauge level, overheat verdict and time-to-overheat result.
- **FR-011**: Unknown heat contributors MUST be named and the resulting heat profile MUST retain the
  package's projection warning.
- **FR-012**: Power, distributor and heat detail MUST remain operable and readable at every
  supported viewport without horizontal page scrolling.

### Verification Requirements

- **FR-013**: Unit tests MUST cover within-budget, retracted-only, over-budget, disabled-module and
  unknown-draw builds and compare every displayed field with `powerBudget()`.
- **FR-014**: Unit tests MUST compare all three capacitors with `distributorMetrics()` across pip
  allocations, including zero pips and unavailable distributors.
- **FR-015**: Unit tests MUST compare every heat field with `heatMetrics()` and cover no plant, no
  weapons, never settles, never overheats and unknown contributors.
- **FR-016**: Each primary journey MUST have end-to-end coverage at desktop, tablet and mobile
  viewports in Chromium and Firefox, including automated accessibility checks.

## Almanac Coverage

`ShipLoadout.powerBudget()` supplies plant capacity, retracted and deployed totals, deployed
headroom and utilisation, five priority bands and unknown draws. `distributorMetrics()` supplies
all three capacities and pip-scaled recharge rates. `heatMetrics()` supplies the complete heat
states and uncertainty information. These results cover every value required here; no local game
calculation is needed.

## Success Criteria

- **SC-001**: Every displayed value equals the corresponding Almanac field across the reference
  corpus.
- **SC-002**: A Commander can identify whether deployment changes the power state and which priority
  bands are shed without leaving the power detail.
- **SC-003**: Every unknown draw or heat contribution remains visible and correctly qualifies the
  affected results.
- **SC-004**: Pip changes update all three package-provided distributor rates within 100 ms.
- **SC-005**: The full area passes the required viewport, browser and accessibility test matrix
  without horizontal page scrolling.
