# Feature Specification: Ship Statistics

## Scope

This specification defines the rules for every statistic shown for the active build and the small
headline set shown while outfitting. Detailed statistics are defined by:

- [Power and Heat](../005-power-and-heat/spec.md)
- [Defence Profile](../006-defence-profile/spec.md)
- [Offence Profile](../007-offence-profile/spec.md)
- [Mobility, Mass and Jump](../008-mobility-and-jump/spec.md)
- [Cost and Materials](../009-cost-and-materials/spec.md)

Hull catalogue facts shown before a build exists belong to
[Ship Selection and Build Loading](../001-ship-selection-and-loading/spec.md).

## User Scenarios & Testing

### User Story 1 - Read headline statistics (Priority: P1)

A Commander can see the build's main capabilities while outfitting and open the detail behind any
headline figure.

**Independent Test**: Load a reference build and verify every headline value and unavailable state
against the Almanac result for the same build.

**Acceptance Scenarios**:

1. **Given** an active build, **When** its summary is shown, **Then** it includes power draw and
   capacity, shield strength, armour, damage per second, jump range, top speed, mass and validation
   state.
2. **Given** a headline statistic, **When** the Commander activates it, **Then** the corresponding
   detailed statistics are reached in one interaction.
3. **Given** a headline value the Almanac cannot produce, **When** the summary is shown, **Then**
   that item remains present, is identified as unavailable and includes any diagnostic the Almanac
   returned.

### User Story 2 - See current, honest results (Priority: P1)

A Commander changes the build and immediately sees a consistent set of statistics for its new
state.

**Independent Test**: Change a fitted module, engineering, power state and viewing condition; verify
that affected values update, unaffected values do not, and no stale or invented value appears.

**Acceptance Scenarios**:

1. **Given** a build change, **When** the Almanac recomputes the build, **Then** all affected
   statistics update without a manual refresh.
2. **Given** an invalid or incomplete build, **When** statistics are shown, **Then** each available
   value remains visible and each unavailable value retains any diagnostic the Almanac returned.
3. **Given** an absent value, **When** it is presented, **Then** it is not replaced with zero, an
   estimate or a value from another build.

### User Story 3 - Change viewing conditions (Priority: P2)

A Commander can inspect the same build under supported load, pip and hardpoint conditions without
changing the build itself.

**Independent Test**: Change each viewing condition and verify only dependent Almanac results
change; then save, share and reload the build and verify the conditions were not persisted.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander selects maximum-jump, unladen or laden load,
   **Then** load-dependent values use that named Almanac state.
2. **Given** an active build, **When** the Commander changes SYS, ENG and WEP pips within the game's
   valid allocation, **Then** pip-dependent values use and identify that allocation.
3. **Given** an active build, **When** the Commander selects retracted or deployed hardpoints,
   **Then** state-dependent values use and identify that state.
4. **Given** changed viewing conditions, **When** the build is saved, shared, exported or reloaded,
   **Then** those conditions are not carried with it.

### Edge Cases

- A genuine zero is shown as zero; absent and incomplete results are not.
- An infinite Almanac result is described by its meaning, such as “sustains indefinitely,” rather
  than rendered as an unexplained number.
- Rapid edits never produce a display containing values from different build states.
- No build means no build statistics and no side-effect that creates a build.

## Requirements

### Functional Requirements

- **FR-001**: Build statistics MUST require an active build.
- **FR-002**: Every game value and calculation MUST be obtained from
  `@elite-dangerous-almanac/core`. The application MUST NOT reproduce a game formula, combine
  package values into a new game metric, correct a package result or substitute a value the package
  did not return.
- **FR-003**: Locale-aware unit conversion, number formatting, percentage formatting, ordering and
  labelling MAY be applied without changing the underlying Almanac value.
- **FR-004**: Every statistic MUST identify what it measures, its unit and every viewing condition
  that affects it.
- **FR-005**: Statistics MUST update automatically after a build change or relevant viewing-condition
  change and MUST represent one internally consistent state.
- **FR-006**: An unavailable, absent, incomplete or lower-bound result MUST retain that state and any
  accompanying Almanac diagnostic. When an accessor returns only `null`, localized application text
  MUST identify the value as unavailable and MAY name a directly observable missing, disabled or
  unpowered prerequisite; it MUST NOT invent a game diagnosis, value or calculation.
- **FR-007**: Validation and completeness findings MUST remain visible and actionable without hiding
  statistics the Almanac can still produce.
- **FR-008**: Package-owned diagnostics and game text MUST be displayed from the Almanac. The
  application MUST NOT parse, rewrite or privately translate them. Application-owned surrounding
  text MUST use the localisation layer.
- **FR-009**: The headline set MUST contain power draw and capacity, shield strength, armour, damage
  per second, jump range, top speed, mass and validation state.
- **FR-010**: Each headline item MUST lead to its detailed statistics and remain available while the
  Commander outfits the build.
- **FR-011**: Supported load states MUST be maximum jump (one jump's fuel, empty hold), unladen (full
  tank, empty hold) and laden (full tank, full hold), using the Almanac's meanings. The default MUST
  be unladen.
- **FR-012**: Pip allocation MUST follow the game's six-pip rule, in half-pip steps with no more than
  four pips in one capacitor. The default MUST be two pips each to SYS, ENG and WEP.
- **FR-013**: Hardpoint state MUST be retracted or deployed. The default MUST be deployed.
- **FR-014**: Viewing conditions MUST NOT be build state, edit-history state, stored preferences or
  shared/exported data.
- **FR-015**: Statistics and their detail MUST remain readable and operable at every supported
  viewport. Wide tables MAY scroll inside their own container but MUST NOT widen the page.

### Verification Requirements

- **FR-016**: Unit tests MUST compare every displayed statistic with the corresponding Almanac
  result and cover zero, absent, incomplete, invalid, lower-bound and infinite outcomes.
- **FR-017**: Unit tests MUST prove that each viewing condition changes only dependent values and is
  absent from saved builds, build links and SLEF exports.
- **FR-018**: Each primary journey MUST have end-to-end coverage at desktop, tablet and mobile
  viewports in Chromium and Firefox, including automated accessibility checks.

## Key Entities

- **Statistic**: An Almanac result plus its label, unit, applicable viewing conditions and
  availability state.
- **Headline set**: The build summary whose entries lead to detailed statistics.
- **Viewing conditions**: Load state, pip allocation and hardpoint state; temporary inputs to
  presentation, not properties of the build.

## Almanac Coverage

The Almanac supplies build validation, nullable and diagnostic calculation results, power, heat,
shield, armour, weapon, distributor, mobility, jump, credit and engineering-material calculations.
The area specifications name the exact package result used for each displayed value. No statistic
in scope requires an application-owned game calculation.

## Success Criteria

- **SC-001**: Every displayed game value equals the Almanac result for the same build and conditions
  across the reference corpus.
- **SC-002**: A build or viewing-condition change updates the visible values within 100 ms on the
  supported mobile performance profile.
- **SC-003**: Every unavailable or qualified result retains its reason; no fabricated zero or local
  substitute appears.
- **SC-004**: Every headline detail is reachable in one interaction.
- **SC-005**: Viewing conditions survive no save, link, export, reload or new session.
- **SC-006**: The complete statistics experience passes the required viewport, browser and
  accessibility test matrix without horizontal page scrolling.
