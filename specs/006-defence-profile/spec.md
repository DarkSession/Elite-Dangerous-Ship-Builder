# Feature Specification: Defence Profile

## Scope

This specification covers shields, shield recovery, shield cell banks, armour, resistances, hull
hardness and module protection for the active build. It inherits the statistic rules and viewing
conditions in [Ship Statistics](../003-ship-statistics/spec.md).

Weapon damage and armour piercing belong to
[Offence Profile](../007-offence-profile/spec.md).

## User Scenarios & Testing

### User Story 1 - Read shield and armour strength (Priority: P1)

A Commander can see the build's shield and armour strength, their contributors, resistances and
effective hit points by damage type.

**Independent Test**: Load a shielded, engineered reference build and compare the complete shield
and armour display with the Almanac results.

**Acceptance Scenarios**:

1. **Given** a powered shield generator, **When** defence is shown, **Then** shield strength,
   generator, booster and reinforcement contributions, mass multiplier, boost multiplier,
   resistances and effective hit points are visible.
2. **Given** an active build, **When** armour is shown, **Then** total armour, bulkhead and
   reinforcement contributions, resistances and effective hit points are visible.
3. **Given** a changed SYS allocation, **When** the package recomputes shield metrics, **Then** the
   affected resistances and effective hit points identify that allocation.
4. **Given** no usable shield generator, **When** defence is shown, **Then** shield results are
   absent with the applicable reason and armour remains available.

### User Story 2 - Read shield recovery and cell banks (Priority: P2)

A Commander can see how shields recover and how much powered cell-bank reinforcement is available.

**Independent Test**: Load a build with a shield generator and multiple powered and unpowered cell
banks; compare every recovery and bank value with the Almanac results.

**Acceptance Scenarios**:

1. **Given** a usable shield generator, **When** recovery is shown, **Then** normal and broken
   regeneration rates plus recovery and regeneration durations are shown for the selected SYS pips.
2. **Given** fitted cell banks, **When** they are shown, **Then** total restorable strength and cell
   count match the package and every bank shows its reinforcement, cells, spin-up, duration, heat
   and powered state.
3. **Given** no cell banks, **When** the bank summary is shown, **Then** it says none are fitted.
4. **Given** fitted banks with none powered, **When** the bank summary is shown, **Then** its genuine
   zero totals remain distinct from the absence of banks.

### User Story 3 - Understand hull and module protection (Priority: P2)

A Commander can see the hull's hardness and the protection supplied by module reinforcement.

**Independent Test**: Compare builds with and without module reinforcement and verify all values and
absence states against the Almanac armour result.

**Acceptance Scenarios**:

1. **Given** module reinforcement, **When** defence is shown, **Then** the package's module armour
   pool and module-protection fraction are shown separately from hull hit points.
2. **Given** no module reinforcement, **When** defence is shown, **Then** module protection is
   identified as absent rather than presented as an unexplained zero.
3. **Given** a known hull, **When** defence is shown, **Then** hull hardness is identified as the
   value against which an attacker's armour piercing is measured.

### Edge Cases

- Negative resistance remains negative; it is never clamped.
- A resistance that produces infinite effective hit points is described as no damage getting
  through, not shown as a raw infinity.
- A recovery duration of infinity is described as shields not recovering at that SYS allocation.
- A disabled generator is distinct from no generator; an unpowered generator keeps any Almanac
  strength result but visibly carries its power state.
- An unresolved hull withholds hull-dependent defence results and preserves the Almanac diagnostic.

## Requirements

### Functional Requirements

- **FR-001**: Every defence value and calculation MUST come directly from
  `@elite-dangerous-almanac/core`.
- **FR-002**: Shield presentation MUST show every field returned by `shieldMetrics()` that explains
  strength, contribution, resistance and effective hit points.
- **FR-003**: Shield resistance and effective hit points MUST use the selected SYS allocation and
  identify it. Values MUST NOT be recalculated, clamped or combined locally.
- **FR-004**: A missing or disabled shield generator MUST preserve the package's absent result and
  the build-state reason.
- **FR-005**: Shield recovery MUST show the package's normal rate, broken rate, recovery time and
  regeneration time as distinct values. The application MUST NOT add the durations or state an
  unpublished recovery threshold.
- **FR-006**: Infinite recovery and effective-hit-point results MUST be presented as their semantic
  verdicts without changing the Almanac result.
- **FR-007**: Cell-bank totals and per-bank fields MUST be displayed exactly as returned by
  `cellBanks()`. Disabled and unpowered banks MUST remain visible and MUST NOT be added back into
  the package totals.
- **FR-008**: The absence of banks MUST be determined from the returned bank collection; it MUST
  remain distinct from fitted banks whose returned totals are zero.
- **FR-009**: Armour presentation MUST show total hit points, bulkhead and reinforcement
  contributions, resistances, effective hit points, module armour and module protection returned by
  `armourMetrics()`.
- **FR-010**: The fitted bulkhead and hull hardness MUST be identified from Almanac data.
- **FR-011**: A fitted generator, booster, bulkhead, reinforcement or bank shown as a source MUST
  link to its fitted slot. Package aggregate contributions MUST remain aggregates and MUST NOT be
  apportioned to slots unless the package returns that mapping.
- **FR-012**: Defence tables and bank details MUST remain operable and readable at every supported
  viewport without horizontal page scrolling.

### Verification Requirements

- **FR-013**: Unit tests MUST compare every displayed shield, recovery, bank and armour value with
  its Almanac result across ordinary, absent, negative, zero and infinite cases.
- **FR-014**: Tests MUST distinguish no banks from all banks unpowered and no generator from a
  disabled or unpowered generator.
- **FR-015**: Tests MUST verify that no recovery threshold, combined recovery duration or locally
  calculated effective hit points reach the display.
- **FR-016**: Each primary journey MUST have end-to-end coverage at desktop, tablet and mobile
  viewports in Chromium and Firefox, including automated accessibility checks.

## Key Entities

- **Shield profile**: Strength, contributions, resistances and effective hit points for stated SYS
  pips.
- **Recovery profile**: Normal and broken regeneration rates and their two durations.
- **Cell-bank summary**: The package's powered-bank totals plus every fitted bank and its state.
- **Armour profile**: Hull hit points, contributions, resistances, effective hit points, hardness
  and module protection.

## Almanac Coverage

`ShipLoadout.shieldMetrics()`, `shieldRecovery()`, `cellBanks()` and `armourMetrics()` return every
numeric result required here, including contribution breakdowns, pip-dependent values, infinity
sentinels and per-bank power state. Hull hardness is catalogue data. No defence number requires a
local calculation.

## Success Criteria

- **SC-001**: Every defence value equals the corresponding Almanac field across the reference
  corpus.
- **SC-002**: Every absent, zero, negative and infinite result is distinguishable and retains its
  correct meaning.
- **SC-003**: Changing SYS pips updates all dependent package results within 100 ms.
- **SC-004**: Every fitted source module and bank is reachable by slot in one interaction, while
  package aggregate contributions remain unapportioned.
- **SC-005**: The full area passes the required viewport, browser and accessibility test matrix
  without horizontal page scrolling.
