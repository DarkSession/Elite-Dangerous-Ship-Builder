# Feature Specification: Power and Heat

**Feature Branch**: `005-power-and-heat`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "In the ship statistics, lets add power budget, specifically for
deployed + retracted hardpoints. [...] power distributor capacity, especially for shields (SYS),
thruster boost (ENG) and weapons (WEP). We also want to show the ships heat and thermal load."

## Scope

This specification covers the build's **energy economy**: what the power plant makes, what the
modules draw in each hardpoint state, which of them stay online when the plant cannot cover
everything, what the distributor holds for systems, engines and weapons, and how hot the whole
arrangement runs.

It is one area of the statistics family. [Feature 003](../003-ship-statistics/spec.md) is the
contract every figure here obeys — the requirement that a build be active at all (its FR-000),
provenance, units, the honesty rules for unavailable figures, the recompute obligation, and the
viewing conditions (load, pips, hardpoint state). Everything it states applies here without being
restated, and nothing here relaxes it. Nothing in this area is offered before a hull is chosen.

Enabling a module and assigning its power priority group are build changes owned by
[feature 002](../002-module-outfitting/spec.md); this feature reports what those choices cost. The
energy a weapon draws from the WEP capacitor while firing, and how long the capacitor sustains it,
belong to [feature 007](../007-offence-profile/spec.md), which reads the capacities specified here.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Power budget with hardpoints deployed and retracted (Priority: P1)

A Commander whose build fits comfortably inside its power plant with hardpoints stowed wants to
know what happens the moment they deploy: whether the plant still covers everything, and if not,
which priority group drops offline.

**Why this priority**: Deploying hardpoints is the single largest step change in a build's power
draw, and a build that browns out on deployment is broken in exactly the moment that matters. A
single power total cannot express this.

**Independent Test**: Load a build whose deployed draw exceeds its plant while its retracted draw
does not, and confirm both states are reported separately, each against capacity, with the priority
groups that stay online in each state identified.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views the power budget, **Then** retracted
   draw and deployed draw are both shown against the power plant's capacity, each with its own
   headroom or deficit and its utilisation.
2. **Given** the power budget, **When** the Commander examines it by priority group, **Then** each
   group shows its retracted and deployed draw, its cumulative total, and whether that group stays
   powered in each of the two states.
3. **Given** a build that is within budget retracted but over budget deployed, **When** the
   Commander views the power budget, **Then** the deficit is stated for the deployed state only,
   and the modules that would shut down on deployment are identified by slot.
4. **Given** a fitted module whose power draw the catalogue does not carry, **When** the power
   budget is shown, **Then** that module is listed as an unknown draw and the totals are qualified
   accordingly, rather than treating the unknown as zero.
5. **Given** a build with modules left unpowered, **When** the Commander views the power budget,
   **Then** plant output, powered draw and unpowered draw are each shown as their own figure, so the
   size of what is switched off is legible without arithmetic.

---

### User Story 2 - Find the module to cut (Priority: P2)

A Commander who is 1.5 MW over their plant wants to know which module to drop, downgrade or
re-prioritise — and would rather see the draw ranked than read down thirty-four slots.

**Why this priority**: Knowing there is a deficit is story 1; resolving it is this one. Without a
ranked view the Commander compares modules by hand, which is exactly the arithmetic a planner exists
to remove.

**Independent Test**: Load an over-budget build and confirm every drawing module is listed with its
own draw, ordered by contribution, against the build's total, and that each entry identifies the
slot it belongs to.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views the power breakdown by module, **Then**
   every module that draws power is listed with its draw and its slot, ordered by contribution, with
   the build's total stated.
2. **Given** the breakdown by module, **When** a module draws only while hardpoints are deployed,
   **Then** it is identified as such, so a retracted-state total is not read as the whole story.
3. **Given** the breakdown by module, **When** a module is disabled or sits in an unpowered priority
   group, **Then** it is shown with that state rather than omitted from the list.
4. **Given** a module whose draw the package reports as unknown, **When** the breakdown is shown,
   **Then** it appears in the list as unknown rather than being sorted as though it drew nothing.

---

### User Story 3 - Distributor capacity for systems, engines and weapons (Priority: P2)

A Commander allocates pips across SYS, ENG and WEP and sees what each capacitor holds and how fast
it refills, engineering included.

**Why this priority**: The distributor decides how long a Commander can shoot, boost and hold
shields, and it is the module most often chosen on its recharge rate rather than its class.

**Independent Test**: Load a build with an engineered distributor and confirm capacity and recharge
rate are displayed for each of the three capacitors, reflecting that engineering.

**Acceptance Scenarios**:

1. **Given** a build with a power distributor fitted, **When** the Commander views the distributor,
   **Then** capacity and recharge rate are shown separately for systems, engines and weapons,
   reflecting any engineering applied to that distributor.
2. **Given** a pip allocation, **When** the Commander views the distributor, **Then** the allocation
   in force is shown alongside the capacities, as feature 003's FR-015 requires.
3. **Given** no distributor is fitted, **When** the Commander views the distributor, **Then** the
   application says the build has no distributor rather than showing zero capacities.

---

### User Story 4 - Heat and thermal load (Priority: P2)

A Commander checks whether their build cooks itself: what it runs at idle, what firing everything
at once does to it, and how much margin the hull has.

**Why this priority**: Heat governs both weapon uptime and silent running, and a build that
overheats on its first alpha strike is unusable.

**Independent Test**: Load a build with weapons and confirm idle and firing heat figures are shown
against the hull's heat dissipation, with the contributing sources identified.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views heat, **Then** the power plant's heat
   efficiency, the hull's heat dissipation and the hull's heat capacity are shown, with dissipation
   identified as the figure thermal load is judged against and capacity as thermal inertia.
2. **Given** a build with weapons fitted, **When** the Commander views heat, **Then** the thermal
   load of firing them is shown, both for a single alpha strike and sustained, and the per-weapon
   contributions are reachable.
3. **Given** the build's heat figures, **When** the Commander reads them, **Then** the resting heat
   level at idle, under thrust, while charging the Frame Shift Drive and while firing is shown, each
   stating whether it overheats and how long it takes to get there.
4. **Given** a module whose heat contribution the package could not determine, **When** heat is
   shown, **Then** that module is named, every heat figure is marked as a projection rather than a
   bound, and the overheat verdict is marked as untrustworthy in either direction.

---

### Edge Cases

- A build with no power plant: retracted and deployed draw are still reported. The package reports
  capacity as zero and utilisation as infinite for such a build; the application reads "no power
  plant fitted" from the build itself and presents utilisation as unavailable rather than rendering
  an infinity. That is presentation of the package's sentinel, not a substituted value.
- Every hardpoint empty: the deployed and retracted figures are equal, and the statistics say so
  rather than implying a deployment penalty that does not exist.
- A module the package reports with an unknown power draw: it appears in the unknown-draw list, both
  power totals are qualified as lower bounds, and it is not ordered in the by-module breakdown as
  though it drew nothing.
- Every module assigned to the same priority group: the group breakdown still reports that group's
  draw against capacity, and does not imply a shutdown order that does not exist.
- A priority group with no modules in it: the package reports every group whether or not anything
  occupies it, so an empty group and a zero-draw group look alike in its output. The application
  tells them apart by counting the modules assigned to each — composition #3 below — and reports an
  empty group as empty rather than as a group drawing zero.
- A build whose deficit is resolved only by disabling a module the game does not allow to be
  disabled: the deficit stands and is reported, rather than being resolved on an assumption.
- A build with no power plant, or one whose plant is switched off: the package reports no heat
  metrics at all for it, so every heat figure is reported as unavailable with that reason. This is an
  ordinary mid-build state, not an error.
- A distributor fitted but disabled or unpowered: its capacities are reported as unavailable in that
  state rather than shown as though the capacitors were charging.
- A build with no weapons: the firing heat figures are reported as absent rather than as zero
  thermal load, and the idle and thrust figures are still shown in full.
- A build the package cannot resolve to a known hull: the hull's heat dissipation and capacity are
  reported as unavailable and the overheat assessment with them, rather than assumed safe. Every hull
  in the catalogue carries both figures, so this arises from an unresolved hull rather than from a
  gap in the catalogue.
- The priority-group table and the by-module breakdown on a phone: both stay legible and scroll
  within their own container rather than forcing the page sideways.

## Requirements _(mandatory)_

### Functional Requirements

#### Power budget

- **FR-001**: The application MUST display the build's power draw in both hardpoint states —
  retracted and deployed — each against the power plant's capacity, with its own headroom or
  deficit and utilisation.
- **FR-002**: The application MUST display, per priority group, the retracted and deployed draw, the
  cumulative total at that group, and whether the group remains powered in each state.
- **FR-003**: The application MUST identify the modules that would shut down in a state whose draw
  exceeds capacity, naming them by slot.
- **FR-004**: Modules whose power draw the package reports as unknown MUST be listed as such, and
  totals that include them MUST be qualified rather than presented as complete.
- **FR-005**: Disabled modules MUST contribute no power draw and MUST be excluded from the power
  figures, while remaining visible as disabled rather than omitted. Whether a disabled module is
  excluded from a figure in another area is that area's to state, because it depends on what the
  package reports there.
- **FR-006**: The application MUST display plant output, powered draw and unpowered draw as distinct
  figures, so that the magnitude of what the build is not running is legible without arithmetic.
- **FR-007**: The application MUST display each drawing module's own power draw alongside its slot,
  ordered by contribution, against the build's stated total. Modules that draw only while hardpoints
  are deployed MUST be identified as such, and a module whose draw is unknown MUST be shown as
  unknown rather than ordered as though it drew nothing.

#### Distributor

- **FR-008**: The application MUST display the fitted power distributor's capacity and recharge rate
  separately for the systems, engines and weapons capacitors, reflecting engineering applied to that
  distributor.
- **FR-009**: A build with no distributor fitted MUST be reported as having none, rather than shown
  with zero capacities.

#### Heat

- **FR-010**: The application MUST display the power plant's heat efficiency, the hull's heat
  dissipation and the hull's heat capacity, and MUST distinguish their roles: dissipation is what
  thermal load is judged against, while capacity is thermal inertia — it governs how long a build
  takes to reach a temperature, not whether it gets there.
- **FR-011**: The application MUST display the thermal load of the build's weapons, for a single
  alpha strike and sustained, with per-weapon contributions reachable.
- **FR-011a**: A build with no power plant fitted, or whose plant is switched off, MUST have its heat
  figures reported as unavailable with that reason. The package reports none for such a build, and
  the application MUST NOT present a partial heat picture in their place.
- **FR-012**: The build-level heat figures — the resting heat level at idle, under thrust, while
  charging the Frame Shift Drive and while firing, whether each overheats, and how long it takes to
  reach that point — MUST come from the package's build-level heat calculation. The application MUST
  NOT sum or model heat locally.
- **FR-013**: Where the package could not determine some modules' contribution to heat, those modules
  MUST be named **and** every heat figure MUST be marked as a projection over the modules that did
  resolve — not as a bound in either direction — with the overheat verdict marked as untrustworthy.
  This is a stronger obligation than the power totals carry (FR-004), because an unknown draw makes a
  power total a lower bound but makes a heat figure wrong in either direction: a build can be
  reported as overheating when it would not, and as safe when it would not be.

### Device Requirements

- **FR-014**: The priority-group table, the by-module power breakdown and the heat figures MUST be
  fully readable on desktop, tablet and mobile, in both portrait and landscape, scrolling within
  their own container rather than widening the page.
- **FR-015**: Selecting a module in the power breakdown MUST take the Commander to that module's
  slot, by touch as well as by pointer and keyboard, so a deficit can be acted on where it is read.

### Testing Requirements

- **FR-016**: Power budget behaviour MUST be unit-tested across builds that are within budget in
  both hardpoint states, within budget only retracted, and over budget in both, including the
  unknown-draw and disabled-module cases.
- **FR-017**: The by-module breakdown MUST be unit-tested for ordering, for deployed-only draws, and
  for the unknown-draw entry, against the domain layer without rendering components.
- **FR-018**: Distributor and heat presentation MUST be unit-tested against known builds, including
  the no-distributor, no-weapons, no-power-plant, switched-off-plant, unresolved-hull and
  undetermined-contribution cases, asserting for the last of these that every heat figure is marked
  as a projection and the overheat verdict as untrustworthy.
- **FR-019**: Each user story's primary journey MUST have a Playwright end-to-end test that runs
  against desktop, tablet and mobile viewports.

### Key Entities

- **Power budget**: Draw against capacity in each hardpoint state, broken down by module and
  priority group, accounting for disabled modules and unknown draws.
- **Power band**: One priority group's draw in each hardpoint state, its cumulative total, and
  whether it stays powered in each state.
- **Module draw**: One module's own power draw, its slot, whether it draws only when hardpoints are
  deployed, and whether the package could determine it at all.
- **Distributor profile**: Capacity and recharge rate for each of the three capacitors, as
  engineered.
- **Heat profile**: Heat efficiency, hull heat capacity and the build's thermal load in each of the
  states the package reports, with the sources that contribute to it.

## Upstream dependencies

Verified against the installed `@elite-dangerous-almanac/core@0.1.0-beta.4` on 2026-08-14. Nothing
here is blocked.

The deployed and retracted power budget, the priority-group breakdown and the distributor capacities
were available from the outset. Build heat arrived in `0.1.0-beta.4`: the package computes the
resting heat level at idle, under thrust, while charging the Frame Shift Drive and while firing
(both sustained and with the weapons capacitor drained), reports whether each state overheats and
how long it takes to get there, reports the hull's heat dissipation and capacity separately, and
names the modules whose draw it could not determine.

**Composed under feature 003's FR-001a**, naming what is combined and from which package figures:

1. **Retracted headroom and utilisation (FR-001)** — the package's power budget carries one headroom
   and one utilisation, both computed for the deployed state. The retracted pair is the same
   comparison against the same reported capacity, applied to the retracted draw the package also
   reports.
2. **Powered and unpowered draw (FR-006)** — the deployed total includes priority groups that are
   not powered, and the per-group draw and powered flag are both reported, so the powered and
   unpowered shares are the sum of the groups on each side of that flag. The package computes the
   powered-only draw internally for its heat calculation but does not expose it.
3. **The modules in each priority group (FR-002, FR-003)** — the package reports which groups stay
   powered in each hardpoint state, and each fitted module carries its own priority group. Naming the
   modules a shed group takes offline, and telling an empty group from a zero-draw one, both count
   the modules assigned to each group. Neither restates a rule about how power is shed.

Exposing the retracted headroom and utilisation, and the powered and unpowered draw, on the package's
power budget would remove both compositions. That is a welcome simplification upstream rather than a
blocker.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A Commander can determine whether a build has a power deficit in either hardpoint
  state, and which modules would shut down, without leaving the power statistics.
- **SC-002**: A Commander who is over budget can identify the largest single draw they could remove
  in one interaction from the power budget.
- **SC-003**: Every power figure matches the value `@elite-dangerous-almanac/core` computes for the
  same build and hardpoint state, or composes its figures under feature 003's FR-001a — zero
  divergence across the reference corpus, and zero figures the package contradicts. A sentinel the
  package returns for an absent plant is presented as unavailable rather than as a number.
- **SC-004**: For every build in a corpus covering within-budget, retracted-only and over-budget
  states, the set of modules reported as shutting down is exactly the set occupying the priority
  groups the package reports as unpowered — zero missing and zero invented.
- **SC-005**: A build containing a module with an unknown draw never reports a complete total —
  every such total is qualified, across the whole corpus.
- **SC-006**: The power budget, the by-module breakdown, the distributor and the heat figures are
  all readable on desktop, tablet and mobile viewports — the same end-to-end suite passes on all
  three, with no horizontal page scrolling at any of them.

## Assumptions

- Which modules draw only while hardpoints are deployed is the package's classification, not a rule
  this application adds.
- The priority-group shutdown order is the game's, as the package reports it. The application shows
  which groups survive; it does not model a different rationing scheme.
- Heat is presented as the package's discrete states — idle, under thrust, charging the Frame Shift
  Drive, firing — rather than as a continuous thermal simulation. Modelling heat over a timeline is
  out of scope.
- The WEP capacitor's capacity and recharge belong here; how fast a particular loadout drains it
  belongs to feature 007, which composes it with the weapons' energy draw.
- Which figures are prominent and how the priority-group and by-module breakdowns are laid out are
  decided at plan time against the design system, per constitution principle VII.
