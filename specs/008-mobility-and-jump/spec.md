# Feature Specification: Mobility, Mass and Jump

**Feature Branch**: `008-mobility-and-jump`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "ship speed, with/without boost, pitch/roll/yaw." Extended after a
design review on 2026-08-14 with the figures that explain those numbers: the mass the build carries,
where it sits against the thruster and Frame Shift Drive mass curves, and how range varies with load.

## Scope

This specification covers how a build **moves**: how far it jumps, how fast it flies, how it turns,
what it weighs, and how those four are bound together by the mass curves the thrusters and the Frame
Shift Drive are measured against.

It is one area of the statistics family. [Feature 003](../003-ship-statistics/spec.md) is the
contract every figure here obeys — the requirement that a build be active at all (its FR-000),
provenance, units, the honesty rules for unavailable figures, the recompute obligation, and the
viewing conditions. Everything it states applies here without being restated, and nothing here
relaxes it. Nothing in this area is offered before a hull is chosen. In particular, the cargo and
fuel assumptions and the ENG pip allocation are viewing conditions owned by feature 003; this
feature specifies what they do to the figures.

Mass matters to more than movement, so it is specified once here and read elsewhere: the shield mass
curve belongs to [feature 006](../006-defence-profile/spec.md), and the mass of an individual module
is a module attribute shown by [feature 002](../002-module-outfitting/spec.md).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Read the build's jump performance (Priority: P1)

A Commander planning an exploration refit wants to know how far this ship jumps, what each jump
costs in fuel, and how far a full tank takes them.

**Why this priority**: Jump range is the figure that decides more builds than any other outside
combat, and it is the first thing a Commander checks after changing a Frame Shift Drive or shedding
mass.

**Independent Test**: Load a build with a Frame Shift Drive fitted and confirm laden and unladen
jump range, fuel per jump and total range are shown and match the package's figures for that build.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views its jump statistics, **Then** maximum
   jump range, laden jump range, fuel per jump and total range are shown, each stating the load
   assumption it was computed under.
2. **Given** a build with a Frame Shift Drive fitted, **When** the Commander views the jump figures,
   **Then** the drive in force is identified — its class, rating and engineering as the catalogue
   records them — so the figures can be attributed to it.
3. **Given** a build with no Frame Shift Drive fitted, **When** the Commander views jump statistics,
   **Then** they are reported as unavailable with the reason, rather than shown as zero.
4. **Given** an active build, **When** the Commander views the jump figures, **Then** the hull's mass
   lock factor is shown alongside them.

---

### User Story 2 - Mobility: speed, boost and manoeuvrability (Priority: P1)

A Commander building a fast ship wants to see top speed, boost speed and how the ship turns, and to
judge what the mass they just added has cost them.

**Why this priority**: Speed and boost are headline figures in every comparable tool, and mobility is
the reason many builds exist.

**Independent Test**: Load a build and confirm speed, boost speed and pitch, roll and yaw rates are
shown for it, each stating whether it is the hull's base characteristic or a figure computed for this
build's thrusters, mass and pip allocation.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views mobility, **Then** top speed and boost
   speed are shown, distinguished from one another, with the load and pip assumptions they were
   computed under stated.
2. **Given** an active build, **When** the Commander views mobility, **Then** pitch, roll and yaw
   rates are shown.
3. **Given** a build whose thrusters the package cannot resolve, **When** the Commander views
   mobility, **Then** the hull's base characteristic is shown, explicitly labelled as the hull's base
   value rather than this build's, and the build-specific figure is reported as unavailable — never
   estimated.
4. **Given** the ENG pip allocation is changed, **When** the Commander views mobility, **Then** the
   figures that depend on it recompute and state the allocation they assume.

---

### User Story 3 - Judge the mass the build carries (Priority: P2)

A Commander whose jump range dropped after an refit wants to see where the mass went — hull, modules
or fuel — which modules are the heaviest, and whether the ship has drifted past what its thrusters
and drive were sized for.

**Why this priority**: Speed and jump range are outputs; mass is the input a Commander can actually
change. Without the breakdown and the curve thresholds, a Commander tunes a build by trial and error.

**Independent Test**: Load a build and confirm the mass is broken down by source, that the heaviest
modules are identifiable with their slots, and that the thruster and drive mass curves are shown with
the build's mass placed against them.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views mass, **Then** unladen mass, fuel capacity
   and cargo capacity are shown.
2. **Given** an active build, **When** the Commander views the mass breakdown, **Then** the hull's
   own mass, the mass contributed by fitted modules and the mass of fuel are shown as distinct
   figures, with the number of modules contributing stated.
3. **Given** the mass breakdown, **When** the Commander looks for what to remove, **Then** each
   fitted module's own mass is listed with its slot, ordered by contribution.
4. **Given** a build with thrusters fitted, **When** the Commander views the thruster mass curve,
   **Then** the curve's optimal, minimum and maximum mass are shown with the build's mass placed
   against them, together with both performance multipliers in force at that mass — the one governing
   speed and the one governing rotation.
5. **Given** a build with a Frame Shift Drive fitted, **When** the Commander views the drive against
   its mass, **Then** the drive's optimal mass is shown with the build's mass placed against it, and
   no performance multiplier is shown, because the catalogue carries no mass curve for a drive.
6. **Given** a build whose mass exceeds its thrusters' maximum curve mass, **When** the Commander
   views mobility, **Then** the package's zero-performance result is shown as such, rather than a
   fabricated value read off the end of the curve.

---

### User Story 4 - Compare range across load states (Priority: P2)

A Commander deciding whether a trade run is worth it wants to see their best single jump, their range
with a full tank and an empty hold, their range at the cargo they intend to carry, and their range
with the hold full — at the same time, rather than one at a time.

**Why this priority**: Feature 003 lets a Commander vary the load assumption and read the result. That
answers "what is my range at this load"; it does not answer "how much range does cargo cost me",
which is the question a trade or mining refit actually turns on.

**Independent Test**: Load a build and confirm jump range is reported for the maximum single jump,
the unladen state, the current load assumption and the laden state together, each labelled with the
load it assumes and named as the package names it.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views range by load, **Then** jump range is
   shown for four states together — the maximum single jump, unladen, the current load assumption,
   and laden — each labelled with the load it assumes, using the package's own names for those
   states.
2. **Given** the currently assumed load is changed, **When** the Commander views range by load,
   **Then** the current figure moves and the other three stand, because they do not depend on it.
3. **Given** a build with a full tank, **When** the Commander views total range, **Then** the number
   of jumps that tank affords is shown alongside the distance it covers, or reported as unavailable
   while the package returns only the distance.
4. **Given** a build with no cargo capacity, **When** the Commander views range by load, **Then** the
   laden state is reported as identical to the unladen state rather than implied to be worse.

---

### Edge Cases

- A build with no Frame Shift Drive fitted: jump statistics report as unavailable with the reason,
  rather than showing zero.
- A build with no thrusters fitted: the hull's base speed characteristics are shown, labelled as the
  hull's, and every build-specific mobility figure is reported as unavailable.
- A build whose unladen mass cannot be determined because a slot is unresolved: mass and every figure
  derived from it are marked unavailable, and the reason names the offending slot.
- An engineered thruster: its engineering feeds the package's mobility calculation, so the build's
  speed and handling already reflect it — the application never scales the hull's base speed by the
  engineering itself.
- A build sitting exactly on its thrusters' optimal mass: the multiplier is reported as the package
  gives it, with no special-casing at the boundary.
- A build above the thrusters' maximum curve mass: the package reports zero performance rather than a
  curve value, and the application shows that rather than extrapolating.
- A build the package cannot resolve to a known hull: the hull's mass lock and base rotation rates
  are reported as unavailable, never as zero, and never inferred from a similar hull. Every hull in
  the catalogue carries all of them, so this arises from an unresolved hull rather than from a gap in
  the catalogue.
- A cargo hold larger than the fuel the drive can consume in one jump: the laden range is still
  reported, and a load at which the ship cannot jump at all is reported as such rather than as a
  range of zero.
- A build with no cargo capacity at all: the laden state equals the unladen state, and the figures
  say so rather than repeating a number without explanation.
- The mass breakdown and the per-module mass list on a phone: both stay legible and scroll within
  their own container rather than forcing the page sideways.

## Requirements _(mandatory)_

### Functional Requirements

#### Jump

- **FR-001**: The application MUST display jump statistics: maximum jump range, laden jump range,
  fuel per jump and total range.
- **FR-002**: The application MUST identify the Frame Shift Drive in force — its class, rating and
  engineering as the catalogue records them — alongside the figures attributed to it. Where the
  catalogue distinguishes a supercruise-overcharge variant from a plain drive, that distinction MUST
  be carried through rather than flattened.
- **FR-003**: The application MUST display jump range for four load states together, each labelled
  with the load it assumes and each named as the package names it: the maximum single jump (one
  jump's fuel, no cargo), the unladen range (full tank, empty hold), the range at the Commander's
  current load assumption, and the laden range (full tank, full hold). The application MUST NOT
  introduce its own name for a load state the package already names, and MUST NOT apply one of the
  package's names to a different state.
- **FR-004**: The application MUST display the number of jumps a full tank affords alongside the
  total range it covers. That count MUST come from the package. The package's total-range calculation
  already iterates the jumps as the tank drains but returns only the distance; re-running that
  iteration here is the reimplementation feature 003's FR-001 forbids, so until the count is returned
  the figure is
  reported as unavailable.
- **FR-005**: The application MUST display the hull's mass lock factor.
- **FR-006**: A build with no Frame Shift Drive MUST have its jump statistics reported as unavailable
  with the reason, rather than shown as zero.

#### Mobility

- **FR-007**: The application MUST display top speed and boost speed as distinct figures, and pitch,
  roll and yaw rates.
- **FR-008**: Every mobility figure MUST state whether it is the hull's base characteristic or a
  figure computed for this build's thrusters, mass and pip allocation.
- **FR-009**: Build mobility MUST come from the package's calculation for this build's thrusters,
  mass and ENG pip allocation. The application MUST NOT scale, interpolate or otherwise derive the
  build's speed or handling from the hull's base values. Where the package reports a build-specific
  figure as unavailable, the application MUST show the hull's base characteristic labelled as such
  and report the build-specific figure as unavailable.

#### Mass

- **FR-010**: The application MUST display mass and capacity figures: unladen mass, fuel capacity and
  cargo capacity.
- **FR-011**: The application MUST display the build's mass broken down by source — the hull's own
  mass, the mass contributed by fitted modules, and the mass of fuel — with the number of modules
  contributing stated.
- **FR-012**: The application MUST display each fitted module's own mass alongside its slot, ordered
  by contribution, so the heaviest modules are identifiable without reading every slot.
- **FR-013**: _(Withdrawn 2026-08-14.)_ Mass distribution across the hull is not a property Elite
  Dangerous models — no centre of mass affects handling, and the package reports none. It was drawn
  from a design panel rather than from the game, and specifying it would have required this
  application to invent a figure.

#### Mass curves

- **FR-014**: The application MUST display, for the fitted thrusters, the mass curve's optimal,
  minimum and maximum mass, the build's mass placed against them, and **both** performance
  multipliers the package reports at that mass — the one governing speed and the one governing
  rotation — as distinct figures. They diverge on thrusters carrying separate speed and rotation
  curves, so showing one in place of both would misattribute the build's handling.
- **FR-015**: The application MUST display, for the fitted Frame Shift Drive, its optimal mass with
  the build's mass placed against it. The drive carries no mass curve in the catalogue — only its
  optimal mass — so no performance multiplier MUST be shown for it, and none may be derived from the
  ratio of the two. Where the package later reports a drive multiplier, it is shown as FR-014 shows
  the thrusters'.
- **FR-016**: Every mass-curve figure MUST be a value the package reports. The application MUST NOT
  compute a proportion of optimal mass, a percentage of headroom, or any other ratio between the
  build's mass and a curve threshold — the multiplier the package computes is the figure that
  expresses that relationship.
- **FR-017**: A build whose mass exceeds the thrusters' maximum curve mass MUST show the package's
  zero-performance result as such, rather than a value extrapolated beyond the curve.

### Device Requirements

- **FR-018**: The jump, mobility, mass-breakdown and mass-curve figures MUST be fully readable on
  desktop, tablet and mobile, in both portrait and landscape, scrolling within their own container
  rather than widening the page.
- **FR-019**: A module in the per-module mass list MUST lead to the slot it is fitted in, by touch as
  well as by pointer and keyboard.

### Testing Requirements

- **FR-020**: Jump, mobility and mass presentation MUST be unit-tested against known builds,
  including the no-drive, no-thrusters, unresolved-slot, unresolved-hull and
  above-maximum-curve-mass cases, and asserting that no performance multiplier is produced for a
  Frame Shift Drive.
- **FR-021**: Range by load MUST be unit-tested across builds with and without cargo capacity,
  asserting that changing the current load assumption moves only the current figure.
- **FR-022**: Mass-curve presentation MUST be unit-tested to assert that no ratio between the build's
  mass and a curve threshold is computed locally.
- **FR-023**: Each user story's primary journey MUST have a Playwright end-to-end test that runs
  against desktop, tablet and mobile viewports.

### Key Entities

- **Jump profile**: Maximum and laden jump range, fuel per jump, total range and the jumps a tank
  affords, each for a stated load.
- **Range by load**: One jump range per load state — the maximum single jump, unladen, the current
  load assumption, and laden — presented together for comparison, under the package's own names.
- **Mobility profile**: Speed, boost speed, pitch, roll and yaw, each marked as a hull base
  characteristic or a build-specific figure, for a stated ENG allocation.
- **Mass breakdown**: The build's mass apportioned to the hull, its fitted modules and its fuel, with
  each module's own contribution and slot.
- **Mass curve position**: A fitted module's curve thresholds, the build's mass against them, and the
  performance multipliers in force — speed and rotation.

## Upstream dependencies

Most of this specification is satisfied by `@elite-dangerous-almanac/core@0.1.0-beta.4`, verified
against the installed package on 2026-08-14. Build mobility arrived in that release:
`mobilityMetrics` computes speed, boost, pitch, roll and yaw from the build's thrusters, mass and ENG
pip allocation, applying the thruster mass curves, and reports zero performance above the curve
rather than a fabricated value. Jump range, fuel per jump and total range are computed for any load,
which satisfies FR-001 and FR-003. Hull mass, unladen mass, fuel capacity, cargo capacity, mass lock
and each module's own post-engineering mass are all available, which satisfies FR-010 and FR-012.

**Composed under feature 003's FR-001a**, naming what is combined and from which package figures:

1. **Mass by source (FR-011)** — the hull's mass, the build's unladen mass and every module's own
   post-engineering mass are all reported; the modules' combined contribution is their sum. No game
   rule is restated.

**Two gaps are raised upstream.**

**The jump count (FR-004).** `totalRange` iterates successive jumps as the tank drains and returns
only the summed distance. Counting those jumps here would mean re-running that loop with
`fuelPerJump` and `singleJumpRange` — an iteration the package already performs, which feature 003's
FR-001 places outside what its FR-001a permits. The composition allowance covers the operations
FR-001a lists; it does not cover reproducing a library algorithm. Returning the count alongside the
distance would close this.

**The Frame Shift Drive's mass curve (FR-015).** `MassCurveStats` — three
curve masses with their multipliers — is carried by thrusters (40 of 40) and shield generators, but
by no drive: all 72 frame shift drives expose `optMass` alone, with no `minMass`, `maxMass` or
multipliers. So the drive's optimal mass can be shown against the build's mass, but the performance
multiplier at that mass cannot, and dividing one by the other would supply a curve the package does
not report, which feature 003's FR-001 forbids.
FR-015 states the consequence.

FR-016 remains the boundary for the thrusters: a mass-curve relationship is expressed by the
multiplier the package computes, never by a ratio assembled here.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Every jump, mobility and mass figure matches the value
  `@elite-dangerous-almanac/core` computes for the same build and the same load and pip assumptions
  — zero divergence across the reference corpus.
- **SC-002**: A Commander can tell how much jump range a full cargo hold costs them without changing
  a viewing condition or performing any arithmetic.
- **SC-003**: A Commander can identify the three heaviest modules in a build in one interaction.
- **SC-004**: Every mobility figure is attributable to the hull or to the build — zero figures shown
  without stating which, across the corpus.
- **SC-005**: No mass curve, jump-range formula or fuel-consumption rule is implemented in this
  application — every figure composes package values only, asserted by tests that fail if a game rule
  appears here.
- **SC-006**: For every build with no drive, no thrusters or an unresolved slot, the dependent
  figures read as unavailable with a reason — zero fabricated zeroes across the corpus.
- **SC-007**: Jump, mobility, mass and the curve figures are readable on desktop, tablet and mobile
  viewports — the same end-to-end suite passes on all three, with no horizontal page scrolling at any
  of them.

## Assumptions

- The mass curves are the package's; the application places the build's mass against them and shows
  the multiplier the package computed. It does not reproduce the curve or interpolate along it.
- "Laden" and "unladen" mean what the package means by them. The application does not introduce a
  third load convention of its own.
- Fuel mass counts the main tank and the reserve as the package reports them; the application does
  not model consumption over a route.
- Route planning, system-to-system plotting and neutron boosting are out of scope. This feature
  reports what one jump and one tank achieve, not where they reach.
- Mass distribution across the hull is not modelled, because Elite Dangerous does not model it:
  there is no centre of mass affecting handling, and the package reports none. A design panel
  suggesting otherwise describes nothing the game does.
- Which figures are prominent and how the mass breakdown and curve figures are laid out are decided
  at plan time against the design system, per constitution principle VII.
