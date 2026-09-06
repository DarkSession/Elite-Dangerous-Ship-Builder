## Purpose

This capability presents the package's jump ranges, speed, boost, rotation, mass and capacity for the
active build. Route planning, neutron boosts and application-calculated mass or curve breakdowns are
out of scope.

## Requirements

### Requirement: Package ownership of mobility, mass and jump values

Every mobility, mass and jump value MUST come from `@elite-dangerous-almanac/core`. The application
MUST NOT implement a jump, range, mobility, mass or curve calculation.

A division of package figures is not such a calculation, and three kinds are drawn:

- the position on the thruster mass curve, which is the loaded mass over the module's own `optMass`
  — the comparison the package's `thrusters` getter prescribes rather than one this side invented;
- the length of a bar;
- the position of a mark on a bar, which is `optMass` over the thrusters' `maxMass`.

The last two are decoration beside the package's own number and are readings of nothing. Every
division this feature draws MUST carry a marker naming this rule, and
`scripts/policy/mobility-jump-ownership.mjs` MUST fail the build on any other arithmetic between two
package figures.

Source: 008/FR-001, 008/SC-001, 008/SC-002.

#### Scenario: A drawn value equals its package field

- **WHEN** the screen draws a mobility, mass or jump value
- **THEN** the value equals its Almanac field

#### Scenario: A fourth kind of division

- **WHEN** a file of this feature divides two package figures outside the three kinds named above
- **THEN** the ownership policy fails the build

### Requirement: Jump values from the package summary

Standard jump values MUST use `BuildMetrics.jumpRangeSummary()` for maximum, unladen and laden single
and total ranges and jump counts.

Source: 008/FR-002.

#### Scenario: Jump performance read together

- **WHEN** the build carries a usable Frame Shift Drive and the loads resolve
- **THEN** maximum, unladen and laden single-jump range, total range and jump count are shown
  together
- **AND** each value identifies its load state and its fitted Frame Shift Drive

#### Scenario: A build with no fuel

- **WHEN** the build carries no fuel
- **THEN** the package reports a zero range and the screen states that zero

#### Scenario: A build with no cargo capacity

- **WHEN** the build has no cargo capacity
- **THEN** the laden and unladen package results are equal

### Requirement: Complete diagnostics before a jump call

The application MUST call package jump functions only after the required diagnostic mass and capacity
results are complete. Failure MUST remain unavailable without a guessed value.

The guard MUST cover all three standard loads. `jumpRangeSummary()` resolves the `maximum`, `unladen`
and `laden` loads in turn and throws a `TypeError` on the first it cannot, so all three MUST be asked
before it is called. A guard on one load lets the other two throw out of the projector and take the
whole anatomy region down, which is the failure this requirement prevents. The issues shown MUST be
those of the loads that failed, in the package's own order.

Source: 008/FR-003.

#### Scenario: One standard load does not resolve

- **WHEN** any of the maximum, unladen and laden loads cannot be resolved
- **THEN** `jumpRangeSummary()` is not called
- **AND** the jump output is unavailable and carries the issues of the loads that failed, in the
  package's own order

#### Scenario: No usable drive

- **WHEN** the build has no usable Frame Shift Drive
- **THEN** the jump output is unavailable rather than zero

### Requirement: Speed envelope from the two mobility results

Mobility MUST use `BuildMetrics.mobilityMetricsResult()` for the selected fuel and cargo and
`BuildMetrics.mobilityCapacitorMetricsResult()` for the same load at the settled ENG pips, and every
speed, boost and rotation field the canvas draws MUST come from whichever of those two results owns
it.

`mobilityMetricsResult(load)` takes no pips and owns `boost`, which the package states independently
of the allocation. `mobilityCapacitorMetricsResult({ ...load, enginesPips })` owns `speed`, `pitch`,
`roll` and `yaw`. Both MUST be read from the same completed standard load. The allocation MUST be
passed explicitly, because the package's own default is four pips. Neither result MAY borrow a figure
from the other: if either is unavailable the envelope is unavailable, with that result's own issues.

This requirement states how a reading is obtained if it is drawn, never that it is drawn. The two
mass-curve multipliers and the ENG allocation itself are not drawn. `MobilityMetrics.loadedMass` is
not drawn as a figure either; it is what the position on the thruster mass curve is measured against.

Source: 008/FR-004.

#### Scenario: Both results resolve

- **WHEN** both mobility results resolve at the selected load and the settled ENG pips
- **THEN** speed, boost, pitch, roll and yaw are shown, each from the result that owns it

#### Scenario: One result is unavailable

- **WHEN** either mobility result is unavailable
- **THEN** the whole envelope is unavailable with that result's own issues
- **AND** no field is taken from the other result

#### Scenario: Thrusters above their supported mass

- **WHEN** the build loads the thrusters above the mass they support
- **THEN** the package's zero-performance result is retained

### Requirement: Unavailable mobility is never substituted

A `null` mobility result MUST remain unavailable. Hull base values MUST NOT be substituted for it.
Hull base values, where they are shown, MUST be identified as catalogue facts rather than build
estimates.

Source: 008/FR-005, 008/SC-003.

#### Scenario: No mobility result

- **WHEN** thrusters are missing, disabled or unpowered, or the load is incomplete
- **THEN** build mobility is unavailable and no hull base value stands in for it

#### Scenario: Unpowered against absent thrusters

- **WHEN** the thrusters are unpowered
- **THEN** that state stays distinguishable from absent thrusters

#### Scenario: Three package states stay apart

- **WHEN** a package result is zero, unavailable or incomplete
- **THEN** the three states remain distinguishable and the package issues are shown

### Requirement: Aggregate mass and capacity from the package getters

Aggregate mass and capacity MUST use the package's `unladenMass`, `fuelCapacity` and `cargoCapacity`
getters, and MUST NOT be recomputed, re-summed or reconciled locally. The package states these three
aggregates as figures it can always give, so none of them carries a `CalculationResult` and no issues
attach to them.

This feature's own files MUST NOT read `unladenMass` or `fuelCapacity`, which its cards do not draw,
and `scripts/policy/mobility-jump-ownership.mjs` MUST withhold those two alone. The status rail draws
`cargoCapacity` as feature 003's own cell (003/FR-023), so that getter is not withheld across the
application; reading it in this feature's own files is still wrong.

The mass bar's track MUST run to the thrusters' own maximum supported mass, which is the only maximum
the package gives that bar. A build whose thruster publishes no curve MUST have no track rather than
a substitute one.

The headline mass and the hull, modules and fuel split beneath it MUST come from one `buildMass(load)`
answer read at the load the card names. No part of either may be summed, inferred or reconciled on
this side of the boundary.

Source: 008/FR-006, 008/SC-004.

#### Scenario: What the build weighs

- **WHEN** the card states what the build weighs at a load
- **THEN** the figure and the hull, modules and fuel split beneath it come from one `buildMass(load)`
  answer read at that load
- **AND** every part of the answer retains the package's diagnostics

#### Scenario: A thruster with no published curve

- **WHEN** the fitted thruster publishes no mass curve
- **THEN** the mass bar has no track rather than a substitute maximum

### Requirement: Per-module mass from resolved package stats

Per-module mass MUST use package-resolved post-engineering stats and MAY be ordered for presentation
without being re-summed. A resolved module whose package mass is unavailable MUST make the dependent
aggregates unavailable, never zero.

The modules segment of the hull, modules and fuel bar MUST be `buildMass(load).modules`, the
package's own split, rather than a total summed from the fitted modules.

Source: 008/FR-007.

#### Scenario: Mass by slot

- **WHEN** the fitted modules' masses are shown by slot
- **THEN** each value is that module's package-resolved post-engineering mass
- **AND** the values are ordered for presentation without being re-summed

#### Scenario: One module has no package mass

- **WHEN** a resolved module's package mass is unavailable
- **THEN** every dependent aggregate is unavailable rather than zero

### Requirement: Drive and thruster parameters and the two comparisons

Frame Shift Drive and thruster thresholds, factors and multipliers MUST be shown only when returned
by package records or results. A parameter the canvas does not draw MUST NOT be shown at all; the
rule bounds what may appear, never what must.

Two of the drawn readings are comparisons of two package parameters rather than parameters
themselves: the loaded mass against the thrusters' `optMass`, and the drive's `optMass` less that
same loaded mass. Both MUST be guarded on both operands. A load the package could not settle MUST
leave the comparison undrawn rather than measured against a mass that was assumed (constitution IV).

Source: 008/FR-008.

#### Scenario: A parameter the package does not return

- **WHEN** the package returns no value for a threshold, factor or multiplier
- **THEN** the screen shows no such parameter

#### Scenario: A comparison whose load does not settle

- **WHEN** the load behind one of the two comparisons cannot be settled
- **THEN** the comparison is not drawn

### Requirement: Status rail cells agree with the drive cards

The `JUMP`, `SPEED` and `MASS` cells of the status rail MUST be drawn, and each MUST carry the same
figure, read at the same load and the same ENG allocation and printed at the same precision, as the
card in the `DRIVES` mode that already states it.

The rail carries a grid of cells — `SHIELD`, `ARMOUR`, `DPS`, `JUMP`, `SPEED` and `MASS`, and then
feature 003's `CARGO` and `PASSENGERS`. Features 006 and 007 own the first three; `JUMP`, `SPEED` and
`MASS` belong to this capability. The rail and the two cards are one reading of one build seen twice:
a rail cell that weighed the hold, read a different allocation or rounded to different digits would
put two different numbers for one quantity on one screen, and both would look like answers.

Source: 008/FR-009.

#### Scenario: The rail and the cards on one screen

- **WHEN** the status rail and the `DRIVES` mode cards state the same quantity
- **THEN** the `JUMP`, `SPEED` and `MASS` cells carry the card's figure at the card's precision
- **AND** both readings use the same load and the same ENG allocation
