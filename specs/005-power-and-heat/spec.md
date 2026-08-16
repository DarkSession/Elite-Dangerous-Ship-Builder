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
restated, and nothing here relaxes it.

Enabling a module and assigning its power priority group are build changes owned by [feature
002](../002-module-outfitting/spec.md); this feature reports what those choices cost. The energy a
weapon draws from the WEP capacitor while firing, and how long the capacitor sustains it, belong to
[feature 007](../007-offence-profile/spec.md), which reads the capacities specified here.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Power budget in the hardpoint state being viewed (Priority: P1)

A Commander whose build fits comfortably inside its power plant with hardpoints stowed wants to know
what happens the moment they deploy: whether the plant still covers everything, and if not, which
priority group drops offline. They read the budget deployed, and switch to retracted to see the
other half of the picture.

**Why this priority**: Deploying hardpoints is the single largest step change in a build's power
draw, and a build that browns out on deployment is broken in exactly the moment that matters.

**Independent Test**: Load a build whose deployed draw exceeds its plant while its retracted draw
does not, and confirm the application opens on the deployed state, reports the deficit and the shed
priority groups there, and reports the same build within budget once the hardpoint state is switched
to retracted.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views the power budget, **Then** the draw in
   the hardpoint state in force is shown against the power plant's capacity, with its headroom or
   deficit and its utilisation, and the state it was computed under is stated. Until the Commander
   selects otherwise, that state is deployed.
2. **Given** the power budget, **When** the Commander examines it by priority group, **Then** each
   group shows its draw in the state in force, its cumulative total, and whether that group stays
   powered in that state.
3. **Given** a build that is within budget retracted but over budget deployed, **When** the
   Commander views the power budget deployed, **Then** the deficit is stated and the modules that
   would shut down are identified by slot; **When** they switch to retracted, **Then** the same
   build reports no deficit and its weapons are shown drawing nothing.
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
   every module that draws power is listed with its draw in the state in force and its slot, ordered
   by contribution, with the build's total stated.
2. **Given** the breakdown by module, **When** a module draws only while hardpoints are deployed,
   **Then** it is identified as such, so a retracted-state total is not read as the whole story.
3. **Given** the breakdown by module, **When** a module is disabled or sits in an unpowered priority
   group, **Then** it is shown with that state rather than omitted from the list.
4. **Given** a module whose draw the package reports as unknown, **When** the breakdown is shown,
   **Then** it appears above the ranked entries, marked as unknown, rather than being sorted among
   them at any position.

---

### User Story 3 - Distributor capacity for systems, engines and weapons (Priority: P2)

A Commander allocates pips across SYS, ENG and WEP and sees what each capacitor holds and how fast
it refills at the allocation they have set, engineering included.

**Why this priority**: The distributor decides how long a Commander can shoot, boost and hold
shields, and it is the module most often chosen on its recharge rate rather than its class.

**Independent Test**: Load a build with an engineered distributor and confirm capacity and recharge
rate are displayed for each of the three capacitors, reflecting that engineering, and that a change
to any one capacitor's pips moves that capacitor's recharge rate while leaving its capacity, and the
other two capacitors' figures, alone.

**Acceptance Scenarios**:

1. **Given** a build with a power distributor fitted, **When** the Commander views the distributor,
   **Then** capacity and the recharge rate at the pip allocation in force are shown separately for
   systems, engines and weapons, reflecting any engineering applied to that distributor.
2. **Given** a pip allocation, **When** the Commander views the distributor, **Then** each capacitor
   states the pips it holds against the four it can take, and every figure shown is the figure at
   that allocation, as feature 003's FR-015 requires.
3. **Given** the engines capacitor, **When** the Commander views the distributor, **Then** its
   recharge at the allocation in force is shown on the same terms as the systems and weapons rates,
   all three coming from the package's own pip-scaled calculation, and none of them shown as its
   four-pip maximum standing in for the rate in force.
4. **Given** no distributor is fitted, **When** the Commander views the distributor, **Then** the
   application says the build has no distributor rather than showing zero capacities.
5. **Given** a distributor that is fitted but switched off, or one the plant cannot power, **When**
   the Commander views the distributor, **Then** the capacities and rates are reported as
   unavailable naming that power state, rather than shown as though the capacitors were charging.

---

### User Story 4 - Heat and thermal load (Priority: P2)

A Commander checks whether their build cooks itself: what it runs at idle, what firing everything at
once does to it, and whether the hull can shed what the build makes.

**Why this priority**: Heat governs both weapon uptime and silent running, and a build that
overheats on its first alpha strike is unusable.

**Independent Test**: Load a build with weapons and confirm the idle and firing heat figures are
shown against the hull's heat dissipation, with the contributing sources identified.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views heat, **Then** the power plant's heat
   efficiency and the hull's heat dissipation are shown, with dissipation identified as the figure
   thermal load is judged against.
2. **Given** a build with weapons fitted, **When** the Commander views heat, **Then** the thermal
   load of firing them is shown, both for a single alpha strike and sustained, and the per-weapon
   contributions are reachable.
3. **Given** the build's heat figures, **When** the Commander reads them, **Then** the resting heat
   level at idle, under thrust, while charging the Frame Shift Drive and while firing is shown, each
   stating whether it overheats.
4. **Given** a state whose thermal load the hull cannot shed, **When** the Commander reads it,
   **Then** it is reported as never settling and climbing to an overheat, rather than as a figure
   the application could not produce.
5. **Given** a module whose heat contribution the package could not determine, **When** heat is
   shown, **Then** that module is named, every heat figure is marked as a projection rather than a
   bound, and the overheat verdict is marked as untrustworthy in either direction.

---

### Edge Cases

- A build with no power plant: the draw in the state in force is still reported. The package reports
  capacity as zero and utilisation as infinite for such a build; the application reads "no power
  plant fitted" from the build itself and presents utilisation as unavailable rather than rendering
  an infinity. That is presentation of the package's sentinel, not a substituted value.
- Every hardpoint empty: switching the hardpoint state changes nothing in the figures. That is
  correct rather than a fault — there is no deployment penalty to show.
- Hardpoints retracted on a build with weapons fitted: the weapons draw nothing and are shown
  drawing nothing, still listed with their slot and marked as deployed-only, rather than dropped
  from the breakdown as though the build did not carry them.
- A module the package reports with an unknown power draw: it appears in the unknown-draw list, the
  total for whichever hardpoint state is in force is qualified as a lower bound, and in the
  by-module breakdown it sits above the ranked entries rather than being ordered among them.
- Every module assigned to the same priority group: the group breakdown still reports that group's
  draw against capacity, and does not imply a shutdown order that does not exist.
- A priority group with no modules in it: the package reports every group whether or not anything
  occupies it, so an empty group and a zero-draw group look alike in its output. The application
  tells them apart by counting the modules assigned to each and reports an empty group as empty.
- A build whose deficit is resolved only by disabling a module the game does not allow to be
  disabled: the deficit stands and is reported, rather than being resolved on an assumption.
- A build with no power plant, or one whose plant is switched off: the package reports no heat
  metrics at all for it, so every heat figure is reported as unavailable with that reason. This is
  an ordinary mid-build state, not an error.
- A distributor fitted but disabled or unpowered: its capacities and rates are reported as
  unavailable in that state rather than shown as though the capacitors were charging. The package
  returns nothing for such a build, so this is its answer rather than a suppression applied here.
- A pip allocation of zero on a capacitor: the package returns a recharge of zero for it, which is a
  figure and is shown as one, with the capacity unchanged — not reported as unavailable.
- A build with no weapons: the firing heat figures are reported as absent rather than as zero
  thermal load, and the idle and thrust figures are still shown in full.
- A state whose thermal load exceeds the hull's dissipation: the package reports no settled heat
  level for it, because there is none. The application reports that the build never settles and
  climbs to an overheat — a verdict, not an unavailable figure, and never softened into a capped
  gauge reading.
- A state that never overheats: the package reports no time to overheat, and the application reads
  that as the state being safe indefinitely rather than as a figure it could not produce.
- A build carrying heat sinks: the heat figures are the same as they would be without them, because
  the package models no sink. The application neither reduces a figure for them nor attaches a
  caveat to every verdict about them.
- A build the package cannot resolve to a known hull: the hull's heat dissipation is reported as
  unavailable and the overheat assessment with it, rather than assumed safe. Every hull in the
  catalogue carries the figure, so this arises from an unresolved hull rather than from a gap in the
  catalogue.
- The priority-group table and the by-module breakdown on a phone: both stay legible and scroll
  within their own container rather than forcing the page sideways.

## Requirements _(mandatory)_

### Functional Requirements

#### Power budget

- **FR-001**: The application MUST display the build's power draw in the hardpoint state in force —
  feature 003's FR-014 viewing condition — against the power plant's capacity, with its headroom or
  deficit and its utilisation, and MUST state the state it was computed under. The two states are
  not presented side by side: the Commander reads one and switches to the other. Until they select
  otherwise, every power figure in this area is reported with hardpoints **deployed**, that being
  the state which has to fit.
- **FR-002**: The application MUST display, per priority group, that group's draw in the state in
  force, the cumulative total at that group, and whether the group remains powered in that state.
- **FR-003**: The application MUST identify the modules that would shut down when the draw in the
  state in force exceeds capacity, naming them by slot.
- **FR-004**: Modules whose power draw the package reports as unknown MUST be listed as such, and
  totals that include them MUST be qualified rather than presented as complete.
- **FR-005**: Disabled modules MUST contribute no power draw and MUST be excluded from the power
  figures, while remaining visible as disabled rather than omitted. Whether a disabled module is
  excluded from a figure in another area is that area's to state, because it depends on what the
  package reports there.
- **FR-006**: The application MUST display plant output, powered draw and unpowered draw as distinct
  figures for the state in force, so that the magnitude of what the build is not running is legible
  without arithmetic.
- **FR-007**: The application MUST display each drawing module's own power draw in the state in
  force alongside its slot, ordered by contribution, against the build's stated total. A module that
  draws only while hardpoints are deployed MUST be shown drawing nothing while they are retracted —
  listed with its slot, never dropped — and MUST be identified as deployed-only in either state. A
  module whose draw is unknown MUST NOT be ordered among the known draws at all: such modules MUST
  be pinned above the ranked entries in a group of their own, marked as unknown, so that the
  ordering beneath them is legible as one over known draws only. An unknown draw could be the
  largest or the smallest on the build, so any position within the ranking would claim something the
  package has not.

#### Distributor

- **FR-008**: The application MUST display the fitted power distributor's capacity and recharge rate
  separately for the systems, engines and weapons capacitors, reflecting engineering applied to that
  distributor. Capacity does not vary with pips; the recharge rate MUST be the rate at the pip
  allocation in force, and each capacitor MUST show its own allocation as the pips selected against
  the four it can take. A rate the package reports only as a four-pip maximum MUST NOT stand in for
  the rate in force, and MUST NOT be scaled to the allocation here — the pip curve is a game rule,
  and feature 003's FR-001 reserves it to the package.
- **FR-008a**: All three capacitors' recharge at the selected pips MUST be obtained from the
  package's single distributor accessor, which performs the curve itself for systems, engines and
  weapons alike and returns the allocation it used alongside each rate. The curve MUST NOT be
  reimplemented here for any capacitor: it is not linear, and its exponent is a term the package has
  never reported as data. No rate may be composed from another capacitor's calculation, and none may
  be scaled, interpolated or inferred from a four-pip maximum. All three capacities are independent
  of the allocation and MUST be shown in full.
- **FR-009**: A build with no distributor fitted MUST be reported as having none, rather than shown
  with zero capacities. A distributor that is fitted but switched off, in a priority group the plant
  cannot power, or whose capacitor statistics the package cannot resolve MUST likewise be reported
  as unavailable naming that state — the package reports nothing for it, and the application MUST
  NOT present the catalogue figures in place of what a build in that state actually holds.

#### Heat

- **FR-010**: The application MUST display the power plant's heat efficiency and the hull's heat
  dissipation, identifying dissipation as the figure thermal load is judged against. The hull's heat
  **capacity** MUST NOT be presented: it is thermal inertia, governing how long a build takes to
  reach a temperature rather than whether it gets there, and with the time-to-overheat figures
  excluded under FR-012b there is nothing left on screen for it to qualify.
- **FR-011**: The application MUST display the thermal load of the build's weapons, for a single
  alpha strike and sustained, with per-weapon contributions reachable.
- **FR-011a**: A build with no power plant fitted, or whose plant is switched off, MUST have its
  heat figures reported as unavailable with that reason. The package reports none for such a build,
  and the application MUST NOT present a partial heat picture in their place.
- **FR-012**: The build-level heat figures — the resting heat level at idle, under thrust, while
  charging the Frame Shift Drive and while firing, and whether each overheats — MUST come from the
  package's build-level heat calculation. The application MUST NOT sum or model heat locally, and
  MUST NOT present a heat state the package does not itself report.
- **FR-012a**: The heat scenarios each carry their own hardpoint condition, as the package defines
  them — idle and under thrust with hardpoints stowed, the firing scenarios with them deployed. The
  hardpoint viewing condition of FR-001 MUST NOT be applied to them, MUST NOT filter which of them
  are shown, and MUST NOT be presented as though it governed them.
- **FR-012b**: A heat level the package reports as never settling MUST be presented as exactly that
  verdict — the build sheds less than it makes, so heat climbs until it overheats — with no settled
  level shown, because there is none. It MUST NOT be presented as unavailable, as a missing figure,
  or as a gauge reading capped to keep a number on screen. Where the package reports no time to
  overheat, that MUST read as the state not overheating at all, never as a figure it could not
  produce. The time to reach an overheat MUST NOT be shown: the package reports it, but a countdown
  in seconds reads as a budget a Commander can spend, when what it measures is a build that is
  already wrong. The unavailable presentation is reserved for figures the package genuinely does not
  report, such as FR-011a's absent plant.
- **FR-013**: Where the package could not determine some modules' contribution to heat, those
  modules MUST be named **and** every heat figure MUST be marked as a projection over the modules
  that did resolve — not as a bound in either direction — with the overheat verdict marked as
  untrustworthy. This is a stronger obligation than the power totals carry (FR-004), because an
  unknown draw makes a power total a lower bound but makes a heat figure wrong in either direction:
  a build can be reported as overheating when it would not, and as safe when it would not be.

### Device Requirements

- **FR-014**: The priority-group table, the by-module power breakdown and the heat figures MUST be
  fully readable on desktop, tablet and mobile, in both portrait and landscape, scrolling within
  their own container rather than widening the page.
- **FR-015**: Selecting a module in the power breakdown MUST take the Commander to that module's
  slot, by touch as well as by pointer and keyboard, so a deficit can be acted on where it is read.

### Testing Requirements

- **FR-016**: Power budget behaviour MUST be unit-tested across builds that are within budget in
  both hardpoint states, within budget only retracted, and over budget in both, including the
  unknown-draw and disabled-module cases, and MUST assert that switching the hardpoint state changes
  every figure that depends on it — the totals, the priority-group table and the by-module draws —
  and leaves the heat scenarios untouched.
- **FR-017**: The by-module breakdown MUST be unit-tested for ordering, for deployed-only draws, and
  for the unknown-draw entry, against the domain layer without rendering components, asserting that
  every unknown-draw entry precedes every ranked entry and that none is sorted among them.
- **FR-018**: Distributor and heat presentation MUST be unit-tested against known builds, including
  the no-distributor, no-weapons, no-power-plant, switched-off-plant, unresolved-hull and
  undetermined-contribution cases, asserting for the last of these that every heat figure is marked
  as a projection and the overheat verdict as untrustworthy. The pip-dependent case MUST be covered
  too: that each of the three recharge rates follows its own allocation while the capacities do not,
  that none matches a straight-line scaling of the four-pip figure, that a zero allocation yields a
  zero rate shown as a figure, and that the switched-off and unpowered distributor read as
  unavailable naming that state. Tests MUST assert that no rate is derived from another capacitor's
  calculation. The never-settles and never-overheats cases MUST each be asserted to produce their
  verdict rather than an unavailable figure, and MUST assert that the application produces no heat
  state the package does not itself report.
- **FR-019**: Each user story's primary journey MUST have a Playwright end-to-end test that runs
  against desktop, tablet and mobile viewports, in Chromium and in Firefox.

### Key Entities

- **Power budget**: Draw against capacity in the hardpoint state being viewed, broken down by module
  and priority group, accounting for disabled modules and unknown draws.
- **Power band**: One priority group's draw in the state being viewed, its cumulative total, and
  whether it stays powered in that state.
- **Module draw**: One module's own power draw, its slot, whether it draws only when hardpoints are
  deployed, and whether the package could determine it at all.
- **Distributor profile**: Capacity and recharge rate for each of the three capacitors, as
  engineered.
- **Heat profile**: Heat efficiency, the hull's dissipation, and the build's thermal load in each
  state the package reports, with the sources that contribute to each and whether the state
  overheats.

## Upstream dependencies

**Nothing in this area is blocked.** `@elite-dangerous-almanac/core` computes the deployed and
retracted power budget, the priority-group breakdown, the distributor's capacities and pip-scaled
recharge, and the build's heat.

The distributor's catalogue recharge figures are each a maximum at four pips, and the curve that
turns one of them into the rate at a given allocation is a game rule the package owns, applies and
documents — `rated × (pips / 4)^1.1`, measured rather than published by the game, and materially not
linear: on the catalogue's highest rated recharge of 10.1 MJ/s, one pip yields 2.20 MJ/s where a
straight line would say 2.53. `ShipLoadout.distributorMetrics({ systemsPips, enginesPips,
weaponsPips })` applies that curve to all three capacitors and returns each one's capacity, its
rated four-pip recharge and its actual rate at the allocation given, together with the allocation it
used. Each allocation defaults independently to four pips and the three need not sum to six, so a
Commander's allocation and a comparison of maxima are both expressible without the application
scaling anything. The accessor returns nothing at all when no distributor is fitted, when it is
switched off, when the retracted power budget sheds it, or when its six capacitor statistics cannot
be resolved, which is what FR-009 reports.

Feature 007 reads firing endurance from `weaponsCapacitorMetrics`, which additionally applies the
deployed power budget; the two accessors agree on the WEP recharge rate at the same allocation.

`heatMetrics()` computes the resting heat level at idle, under thrust, while charging the Frame
Shift Drive and while firing (both sustained and with the weapons capacitor drained), reports
whether each state overheats and how long it takes to get there, reports the hull's heat dissipation
and capacity separately, and names the modules whose draw it could not determine.

**Composed under feature 003's FR-001a**, naming what is combined and from which package figures:

1. **Headroom and utilisation in the retracted state (FR-001)** — the package's power budget carries
   one headroom and one utilisation, both computed for the deployed state. When the Commander views
   the retracted state, that pair is the same comparison against the same reported capacity, applied
   to the retracted draw the package also reports.
2. **Powered and unpowered draw (FR-006)** — a state's total includes priority groups that are not
   powered in it, and the per-group draw and powered flag are both reported for both states, so the
   powered and unpowered shares are the sum of the groups on each side of that flag in the state in
   force. The package computes the powered-only draw internally for its heat calculation but does
   not expose it.
3. **The modules in each priority group (FR-002, FR-003)** — the package reports which groups stay
   powered in each hardpoint state, and each fitted module carries its own priority group. Naming
   the modules a shed group takes offline, and telling an empty group from a zero-draw one, both
   count the modules assigned to each group. Neither restates a rule about how power is shed.

No heat figure is composed: every heat state shown is one the package reports whole. Exposing the
retracted headroom and utilisation, and the powered and unpowered draw, on the package's power
budget would remove the first two compositions; each is a welcome simplification upstream rather
than a blocker.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A Commander can determine whether a build has a power deficit in either hardpoint
  state, and which modules would shut down in it, switching between the two states without leaving
  the power statistics.
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
- Heat is presented as the package's own discrete states — idle, under thrust, charging the Frame
  Shift Drive, and firing — rather than as a continuous thermal simulation. No state is composed
  here, and modelling heat over a Commander-defined timeline is out of scope. A shield cell bank
  activation is therefore not shown as a heat state of its own; a bank's own activation heat is
  shown with that bank under [feature 006](../006-defence-profile/spec.md)'s FR-007.
- Heat sinks are outside the model, because the package expresses no negative thermal load and the
  states it reports do not account for one. This is stated here rather than beside every overheat
  verdict: it bounds what the game data covers, and repeating it on screen made a sound verdict look
  doubtful.
- The hull's heat capacity is deliberately not shown, and neither is the time a state takes to reach
  an overheat. Both are figures the package reports; both describe how quickly a build gets
  somewhere rather than whether it should be going there, and the question this area answers is
  whether a state overheats at all.
- The WEP capacitor's capacity and recharge belong here; how fast a particular loadout drains it
  belongs to feature 007, which composes it with the weapons' energy draw.
- Which figures are prominent and how the priority-group and by-module breakdowns are laid out are
  decided at plan time against the design system, per constitution principle VII.
