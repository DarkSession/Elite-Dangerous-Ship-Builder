# Feature Specification: Ship Statistics

**Feature Branch**: `003-ship-statistics`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Users should be able to see a ship's statistics."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Read the build's headline statistics (Priority: P1)

A Commander looks at their build and sees what the ship actually does: how far
it jumps, whether it has enough power, how tough it is, and how hard it hits.

**Why this priority**: Statistics are the reason to use a shipbuilder at all.
Without them, outfitting is guesswork.

**Independent Test**: Load a known build and confirm the displayed jump range,
power, mass, shields, armour and weapon figures match the values
`@elite-dangerous-almanac/core` computes for that build.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views its statistics,
   **Then** the following are shown: maximum and laden jump range, total range,
   power draw against power plant capacity, unladen mass, fuel capacity, cargo
   capacity, shield strength and resistances, armour and hull resistances,
   weapon damage output, hull and modules value, and rebuy cost.
2. **Given** a statistic depends on load, **When** the Commander views it,
   **Then** the load assumption is stated (unladen, laden, current cargo) rather
   than left ambiguous.
3. **Given** the build has no shield generator, **When** the Commander views
   shield statistics, **Then** the application says the build has no shields
   instead of showing zero as though it were a computed strength.
4. **Given** resistances are shown, **When** the Commander reads them, **Then**
   they are presented as percentages against each damage type, derived from the
   package's fractional values.

---

### User Story 2 - See statistics respond to changes (Priority: P1)

A Commander swaps a Frame Shift Drive and immediately sees the jump range move,
so they can judge the trade against the mass and power they just spent.

**Why this priority**: The feedback loop is the product. Statistics that require
a manual refresh make outfitting decisions impossible to evaluate.

**Independent Test**: Change a module and confirm every affected statistic
updates without further interaction, and that unaffected statistics do not
flicker or change.

**Acceptance Scenarios**:

1. **Given** a displayed set of statistics, **When** any module is fitted,
   removed, engineered, disabled or re-prioritised, **Then** all affected
   statistics update immediately and consistently with each other.
2. **Given** a change has been made, **When** the Commander looks at a changed
   statistic, **Then** the direction and size of the change from the previous
   value is apparent.
3. **Given** modules are disabled or assigned to priority groups, **When**
   statistics are computed, **Then** the power figures account for those
   settings, and the contributions of disabled modules are excluded.

---

### User Story 3 - Understand incomplete or invalid builds (Priority: P2)

A Commander whose build is missing a mandatory module, or is drawing more power
than it makes, is told exactly what is wrong instead of being shown a confident
but meaningless number.

**Why this priority**: Honesty about unavailable values is a constitutional
requirement, and mid-build states are the normal case, not the exception.

**Independent Test**: Construct a build with a missing core module and an
over-budget power plant, and confirm the affected statistics are reported as
unavailable with a stated reason while the rest remain correct.

**Acceptance Scenarios**:

1. **Given** an aggregate that the package reports as unavailable or incomplete,
   **When** the Commander views it, **Then** the application shows it as
   unavailable with the diagnostic reason, and never substitutes zero or a
   guess.
2. **Given** a build the package reports as invalid, **When** the Commander
   views its statistics, **Then** the validity problems are listed in plain
   language, and every statistic that can still be computed is still shown.
3. **Given** total power draw exceeds the power plant's output, **When** the
   Commander views the power statistics, **Then** the deficit is stated and the
   modules that would shut down are identified by priority group.
4. **Given** a build is fully valid and complete, **When** the Commander views
   its statistics, **Then** no warnings are shown.

---

### User Story 4 - Explore statistics under different conditions (Priority: P3)

A Commander checks jump range with a full cargo hold and a half tank, and
inspects shield strength against a specific damage type.

**Why this priority**: A refinement for planning specific activities; the
headline figures cover most decisions.

**Independent Test**: Vary the cargo and fuel assumptions and confirm the
dependent figures recompute consistently.

**Acceptance Scenarios**:

1. **Given** jump statistics, **When** the Commander varies assumed cargo and
   fuel, **Then** jump range, fuel per jump and total range recompute for those
   assumptions.
2. **Given** defensive statistics, **When** the Commander examines a specific
   damage type, **Then** effective shield and hull values against that type are
   shown.
3. **Given** weapon statistics, **When** the Commander views them, **Then** both
   per-weapon and whole-build figures are available, including sustained output
   and the limits imposed by ammunition.

---

### Edge Cases

- A build with no Frame Shift Drive fitted: jump statistics report as
  unavailable with the reason, rather than showing zero.
- A build whose unladen mass cannot be determined because a slot is unresolved:
  mass and every figure derived from it are marked unavailable, and the reason
  names the offending slot.
- Values the catalogue simply does not carry: reported as absent, never as zero.
- A rebuy figure where the build's source purchase price differs from catalogue
  retail: the retail-based figure is shown, and the recorded source price is
  presented as a distinct value rather than mixed into it.
- Statistics requested while a build is mid-edit across several rapid changes:
  the displayed set is always internally consistent, never a mix of old and new.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: All statistics MUST be computed by
  `@elite-dangerous-almanac/core`. The application MUST NOT reimplement any
  calculation the package provides.
- **FR-002**: The application MUST display jump statistics: maximum jump range,
  laden jump range, fuel per jump and total range.
- **FR-003**: The application MUST display the power budget: total draw against
  power plant capacity, headroom or deficit, and per-priority-group draw.
- **FR-004**: The application MUST display mass and capacity figures: unladen
  mass, fuel capacity and cargo capacity.
- **FR-005**: The application MUST display defensive statistics: shield strength
  and resistances, armour and hull resistances.
- **FR-006**: The application MUST display offensive statistics: whole-build
  weapon damage output and per-weapon figures, including ammunition-limited
  sustained output.
- **FR-007**: The application MUST display cost figures: hull value, modules
  value and rebuy cost, quoted at catalogue retail, keeping any recorded source
  purchase price distinct.
- **FR-008**: Resistances MUST be presented as percentages, converted from the
  package's fractional values.
- **FR-009**: Every statistic that depends on load MUST state its load
  assumption.
- **FR-010**: Statistics MUST recompute automatically on every build change, and
  the displayed set MUST always be internally consistent.
- **FR-011**: Where the package reports a value as unavailable or incomplete,
  the application MUST show it as unavailable together with the package's
  diagnostic reason, and MUST NOT substitute zero or an estimate.
- **FR-012**: Build validity and completeness problems MUST be listed in plain
  language, and MUST NOT suppress the statistics that can still be computed.
- **FR-013**: The Commander MUST be able to vary cargo and fuel assumptions and
  see dependent statistics recompute.
- **FR-014**: The change in each statistic relative to its previous value MUST
  be discernible after a build change.

### Key Entities

- **Statistic**: A named, computed figure about the build, with a unit, a load
  assumption where relevant, and either a value or a reason it is unavailable.
- **Power budget**: Draw against capacity, broken down by module and priority
  group, accounting for disabled modules.
- **Defence profile**: Shield and hull strength with resistances per damage
  type.
- **Offence profile**: Damage output for the build and per weapon, with
  ammunition-limited sustained figures.
- **Validation report**: The package's assessment of whether the build is valid
  and operationally complete, and what is missing.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Every displayed statistic matches the value computed by
  `@elite-dangerous-almanac/core` for the same build — zero divergence across a
  test corpus of reference builds.
- **SC-002**: Statistics reflect a build change within 100 ms, with no manual
  refresh.
- **SC-003**: For every build state in which the package reports a value as
  unavailable, the application shows it as unavailable with a reason — zero
  fabricated zeroes.
- **SC-004**: A Commander can determine whether a build has a power deficit, and
  which modules would shut down, without leaving the statistics view.
- **SC-005**: Every statistic carries its unit and, where applicable, its load
  assumption — no unlabelled numbers.

## Assumptions

- Statistic definitions, units and edge-case semantics are the package's; this
  application presents them rather than reinterpreting them.
- Comparison between two builds side by side is a plausible follow-up but is out
  of scope here; this feature covers the active build.
- Time-to-kill modelling, thermal simulation and detailed manoeuvrability
  figures are out of scope unless the package provides them.
- Which statistics are prominent and how they are grouped visually is deferred
  to the UI workstream; this spec fixes what must be available and how it must
  be qualified.
