# Feature Specification: Mobility, Mass and Jump

**Feature Branch**: `008-mobility-and-jump`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "ship speed, with/without boost, pitch/roll/yaw." Extended by design
review with the figures that explain those numbers: the mass the build carries, where it sits
against the thruster and Frame Shift Drive mass curves, and how range varies with load.

## Scope

This specification covers how a build **moves**: how far it jumps, how fast it flies, how it turns,
what it weighs, and how those four are bound together by the mass curves the thrusters and the Frame
Shift Drive are measured against.

It is one area of the statistics family. [Feature 003](../003-ship-statistics/spec.md) is the
contract every figure here obeys — the requirement that a build be active at all (its FR-000),
provenance, units, the honesty rules for unavailable figures, the recompute obligation, and the
viewing conditions. Everything it states applies here without being restated, and nothing here
relaxes it. In particular, the load state and the ENG pip allocation are viewing conditions owned by
feature 003; this feature specifies what they do to the figures.

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
4. **Given** an active build, **When** the Commander views the jump figures, **Then** the hull's
   mass lock factor is shown alongside them.

---

### User Story 2 - Mobility: speed, boost and manoeuvrability (Priority: P1)

A Commander building a fast ship wants to see top speed, boost speed and how the ship turns, and to
judge what the mass they just added has cost them.

**Why this priority**: Speed and boost are headline figures in every comparable tool, and mobility
is the reason many builds exist.

**Independent Test**: Load a build and confirm speed, boost speed and pitch, roll and yaw rates are
shown for it, each stating whether it is the hull's base characteristic or a figure computed for
this build's thrusters, mass and pip allocation.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views mobility, **Then** top speed and boost
   speed are shown, distinguished from one another, with the load and pip assumptions they were
   computed under stated.
2. **Given** an active build, **When** the Commander views mobility, **Then** pitch, roll and yaw
   rates are shown.
3. **Given** a build whose thrusters the package cannot resolve, **When** the Commander views
   mobility, **Then** the hull's base characteristic is shown, explicitly labelled as the hull's
   base value rather than this build's, and the build-specific figure is reported as unavailable —
   never estimated.
4. **Given** the ENG pip allocation is changed, **When** the Commander views mobility, **Then** the
   figures that depend on it recompute and state the allocation they assume.

---

### User Story 3 - Judge the mass the build carries (Priority: P2)

A Commander whose jump range dropped after a refit wants to see where the mass went — hull, modules
or fuel — which modules are the heaviest, and whether the ship has drifted past what its thrusters
and drive were sized for.

**Why this priority**: Speed and jump range are outputs; mass is the input a Commander can actually
change. Without the breakdown and the curve thresholds, a Commander tunes a build by trial and
error.

**Independent Test**: Load a build and confirm the mass is broken down by source, that the heaviest
modules are identifiable with their slots, and that the thruster and drive mass curves are shown
with the build's mass placed against them.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views mass, **Then** unladen mass, fuel
   capacity and cargo capacity are shown.
2. **Given** an active build, **When** the Commander views the mass breakdown, **Then** the hull's
   own mass, the mass contributed by fitted modules and the mass of fuel are shown as distinct
   figures, with the number of modules contributing stated.
3. **Given** the mass breakdown, **When** the Commander looks for what to remove, **Then** each
   fitted module's own mass is listed with its slot, ordered by contribution.
4. **Given** a build with thrusters fitted, **When** the Commander views the thruster mass curve,
   **Then** the curve's optimal and maximum mass are shown with the loaded mass the curve is
   evaluated at placed against them — labelled apart from the breakdown's total, and stating how the
   two differ — together with both performance multipliers in force at that mass, the one governing
   speed and the one governing rotation, and how far the build sits from those thresholds.
5. **Given** a build with a Frame Shift Drive fitted, **When** the Commander views the drive against
   its mass, **Then** the drive's optimal mass is shown with the build's mass placed against it and
   how the two stand in relation to one another, and no minimum or maximum curve mass is shown for
   the drive, because it has none.
6. **Given** a build whose mass exceeds its thrusters' maximum curve mass, **When** the Commander
   views mobility, **Then** the package's zero-performance result is shown as such, rather than a
   fabricated value read off the end of the curve.

---

### User Story 4 - Compare range across load states (Priority: P2)

A Commander deciding whether a trade run is worth it wants to see their best single jump, their
range with a full tank and an empty hold, and their range with the hold full — at the same time,
rather than one at a time.

**Why this priority**: Feature 003 lets a Commander select a load state and read the result. That
answers "what is my range at this load"; it does not answer "how much range does cargo cost me",
which is the question a trade or mining refit actually turns on.

**Independent Test**: Load a build and confirm jump range is reported for the maximum single jump,
the unladen state and the laden state together, each labelled with the load it assumes and named as
the package names it, each carrying its multi-jump total and jump count, with the Commander's
selected state marked among them.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views range by load, **Then** jump range is
   shown for three states together — the maximum single jump, unladen and laden — each labelled with
   the load it assumes, using the package's own names for those states.
2. **Given** a selected load state, **When** the Commander views range by load, **Then** the state
   the rest of the build's figures are computed under is marked among the three, so the Commander
   can see the others in relation to it.
3. **Given** the selected load state is changed, **When** the Commander views range by load,
   **Then** the mark moves to the newly selected state and no figure in the comparison changes
   value, because none of the three depends on which is selected.
4. **Given** a build with a full tank, **When** the Commander views range by load, **Then** each
   load state carries a multi-jump total — the distance the tank covers and the number of jumps it
   affords — beside its single-jump range.
5. **Given** the maximum single jump, **When** the Commander views its total, **Then** it is that
   one jump — the same distance as its single-jump figure, with a jump count of one — read from the
   package rather than inferred from the fact that one jump's fuel affords one jump.
6. **Given** a build with no cargo capacity, **When** the Commander views range by load, **Then**
   the laden state is reported as identical to the unladen state rather than implied to be worse.

---

### Edge Cases

- A build with no Frame Shift Drive fitted: jump statistics report as unavailable with the reason,
  rather than showing zero.
- A build with a Frame Shift Drive but no fuel tank fitted: the main tank is empty, so the package
  reports a zero range. That zero is shown as the figure with the reason that the ship carries no
  fuel, rather than reported as unavailable — it is the package's answer, not a missing one.
- A build with no thrusters fitted: the hull's base speed characteristics are shown, labelled as the
  hull's, and every build-specific mobility figure is reported as unavailable.
- A build whose thrusters are fitted but unpowered — switched off, or in a priority group the plant
  cannot keep lit: the package computes no mobility for it either, so the build-specific figures are
  unavailable, but the reason names the power state rather than reporting the thrusters as absent.
- A build whose unladen mass cannot be determined because a slot is unresolved: mass and every
  figure derived from it are marked unavailable, and the reason names the offending slot.
- An engineered thruster: its engineering feeds the package's mobility calculation, so the build's
  speed and handling already reflect it — the application never scales the hull's base speed by the
  engineering itself.
- A build sitting exactly on its thrusters' optimal mass: the multiplier is reported as the package
  gives it, with no special-casing at the boundary, and the build reads as at optimal rather than as
  a proportion that rounds to it.
- A build heavier than its thrusters' optimal mass: the headroom before the maximum is what remains,
  and it is stated as such rather than as a negative margin below optimal.
- A build above the thrusters' maximum curve mass: the package reports zero performance rather than
  a curve value, and the application shows that rather than extrapolating.
- A build the package cannot resolve to a known hull: the hull's mass lock and base rotation rates
  are reported as unavailable, never as zero, and never inferred from a similar hull. Every hull in
  the catalogue carries all of them, so this arises from an unresolved hull rather than from a gap
  in the catalogue.
- A cargo hold larger than the fuel the drive can consume in one jump: the laden range is still
  reported, because mass alone shortens a jump rather than preventing it. Where the package does
  return a zero range, it is the no-fuel case FR-006a governs.
- A build with no cargo capacity at all: the laden state equals the unladen state, and the figures
  say so rather than repeating a number without explanation.
- The mass breakdown and the per-module mass list on a phone: both stay legible and scroll within
  their own container rather than forcing the page sideways.

## Requirements _(mandatory)_

### Functional Requirements

#### Jump

- **FR-001**: The application MUST display jump statistics: maximum jump range, laden jump range,
  fuel per jump, and the multi-jump total range a tank affords.
- **FR-002**: The application MUST identify the Frame Shift Drive in force — its class, rating and
  engineering as the catalogue records them — alongside the figures attributed to it. Where the
  catalogue distinguishes a supercruise-overcharge variant from a plain drive, that distinction MUST
  be carried through rather than flattened.
- **FR-003**: The application MUST display jump range for the three load states together, each named
  as the package names it and each carrying the fixed gloss feature 003's FR-012a sets for that
  name: **maximum jump** (one jump's fuel, empty hold), **unladen** (full tank, empty hold) and
  **laden** (full tank, full hold). The application MUST NOT introduce its own name for a load state
  the package already names, and MUST NOT apply one of the package's names to a different state — in
  particular, the maximum single jump MUST NOT be labelled "unladen", which names the state beside
  it.
- **FR-003a**: The load state the Commander has selected under feature 003's FR-012 MUST be marked
  among the three, so the comparison is read in relation to the state the build's other figures are
  computed under. That selection is exactly one of these three states, so it MUST NOT be reported as
  a fourth figure alongside them; changing it moves the mark and MUST NOT change any of the three
  values.
- **FR-004**: The application MUST display a multi-jump total for each of FR-003's three load states
  — the distance covered and the number of jumps afforded — so that a total stands beside every
  single-jump figure. Both halves of every total MUST come from the package, which reports all three
  directly. The application MUST NOT assemble the drive's post-engineering constants to reach any of
  them: doing so omits a fitted Guardian FSD Booster's contribution, which lives on the booster
  rather than on the drive, and would diverge from the build's own single-jump figure against
  SC-001.
- **FR-005**: The application MUST display the hull's mass lock factor.
- **FR-006**: A build with no Frame Shift Drive MUST have its jump statistics reported as
  unavailable with the reason, rather than shown as zero.
- **FR-006a**: A build that has a Frame Shift Drive but no fuel aboard MUST show the zero range the
  package reports as the figure, stating that the ship carries no fuel. That zero is the package's
  own answer rather than a substitute for a missing one, so FR-006 does not apply to it and it MUST
  NOT be presented as unavailable. This is the treatment FR-017 gives the thrusters' zero.

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
- **FR-009a**: The package computes no mobility for a build whose thrusters are fitted but not
  powered — switched off, or in a priority group the plant cannot keep lit. The reason reported for
  those unavailable figures MUST name the power state, distinctly from the reason given for a build
  with no thrusters fitted, because the two ask the Commander for different fixes. The hull's base
  characteristics are still shown labelled as the hull's, under FR-009.

#### Mass

- **FR-010**: The application MUST display mass and capacity figures: unladen mass, fuel capacity
  and cargo capacity.
- **FR-011**: The application MUST display the build's mass broken down by source — the hull's own
  mass, the mass contributed by fitted modules, and the mass of fuel — with the number of modules
  contributing stated.
- **FR-012**: The application MUST display each fitted module's own mass alongside its slot, ordered
  by contribution, so the heaviest modules are identifiable without reading every slot.

#### Mass curves

- **FR-014**: The application MUST display, for the fitted thrusters, the mass curve's **optimal and
  maximum** mass, the build's mass placed against them, and **both** performance multipliers the
  package reports at that mass — the one governing speed and the one governing rotation — as
  distinct figures. They diverge on thrusters carrying separate speed and rotation curves, so
  showing one in place of both would misattribute the build's handling. The curve's minimum mass
  MUST NOT be shown: two thresholds are what the curve is read for — what to stay near, and what not
  to pass. [NEEDS CLARIFICATION: a build can sit below the minimum, so it is a threshold a Commander
  can both reach and act on — below it the multiplier stops improving. Of the 1,144 valid
  hull-and-thruster combinations, 58 sit below the fitted thruster's minimum at unladen mass and 32
  at the loaded mass FR-014a displays. Should the minimum be shown after all?]
- **FR-014a**: The mass placed against the thruster curve MUST be the loaded mass the package
  evaluates that curve at — the build's unladen mass, its main-tank fuel and its cargo capacity. It
  is not the total FR-011 breaks down, and it MUST be labelled distinctly enough that the two are
  not read as the same number. The two differ in both directions and neither is reliably the larger:
  this figure excludes the reserve tank FR-011 counts, and includes a full cargo hold FR-011 does
  not, so it is the lighter on a build with no cargo capacity and the heavier as soon as the hold
  outweighs the reserve. The relation MUST be stated where both appear rather than left for a
  Commander to reconcile. The multiplier in force is the one at this mass; placing any other mass
  against the curve would show the Commander a position their handling was not computed at.
- **FR-015**: The application MUST display, for the fitted Frame Shift Drive, its optimal mass with
  the build's mass placed against it — the same loaded mass FR-014a defines, the drive's own
  calculation counting the main tank and leaving the reserve out exactly as the thruster curve does,
  so that one mass figure serves both. A drive has no minimum or maximum curve mass and no
  three-point performance curve, so the application MUST NOT show either for it. How the build's
  mass stands against that optimal mass MAY be expressed directly, under FR-016; where it is, it
  MUST be labelled as the drive's and MUST NOT be presentable as one of the thruster multipliers
  FR-014 shows, which measure something else entirely.
- **FR-016**: Every mass-curve figure MUST be a value the package reports or a comparison between
  two such values. Expressing the build's mass against a curve threshold — as a proportion of the
  optimal mass, or as the tonnes of headroom before a maximum — is permitted: both terms are the
  package's, and feature 003's FR-001a allows comparing two of its figures and stating that
  comparison as a difference or a quotient — which is usually the clearest form of the answer, since
  a proportion of optimal or a headroom in tonnes is what a Commander reads two masses side by side
  to find. What remains prohibited is what FR-001 prohibits everywhere: reproducing the curve,
  interpolating along it, deriving a multiplier rather than reading the one the package computed, or
  supplying any term the package did not report. A figure the package reports whole MUST be taken
  from it rather than reassembled.
- **FR-017**: A build whose mass exceeds the thrusters' maximum curve mass MUST show the package's
  zero-performance result as such, rather than a value extrapolated beyond the curve.

### Device Requirements

- **FR-018**: The jump, mobility, mass-breakdown and mass-curve figures MUST be fully readable on
  desktop, tablet and mobile, in both portrait and landscape, scrolling within their own container
  rather than widening the page.
- **FR-019**: A module in the per-module mass list MUST lead to the slot it is fitted in, by touch
  as well as by pointer and keyboard.

### Testing Requirements

- **FR-020**: Jump, mobility and mass presentation MUST be unit-tested against known builds,
  including the no-drive, no-fuel, no-thrusters, unpowered-thrusters, unresolved-slot,
  unresolved-hull and above-maximum-curve-mass cases, asserting that the no-thrusters and
  unpowered-thrusters reasons differ, that no curve mass other than optimal and maximum reaches the
  thruster presentation and neither reaches the drive's, and that a zero the package reports is
  shown as a figure while an absent figure is reported as unavailable.
- **FR-021**: Range by load MUST be unit-tested across builds with and without cargo capacity,
  asserting that changing the selected load state moves only the mark and leaves all three ranges
  and their multi-jump totals unchanged.
- **FR-022**: Mass-curve presentation MUST be unit-tested to assert that every mass and every
  multiplier displayed is one the package reported, that any proportion or headroom shown is a
  comparison of two such figures and no curve is evaluated locally, and that the mass placed against
  the thruster curve is the loaded mass the package evaluates the curve at rather than the
  breakdown's total — excluding the reserve tank and including cargo capacity — asserted on a build
  with a reserve and no hold, where it is the lighter of the two, and on a build with a hold large
  enough to outweigh the reserve, where it is the heavier.
- **FR-023**: Each user story's primary journey MUST have a Playwright end-to-end test that runs
  against desktop, tablet and mobile viewports, in Chromium and in Firefox.

### Key Entities

- **Jump profile**: Maximum and laden jump range, fuel per jump, and the total range and jump count
  a tank affords, each for a stated load.
- **Range by load**: One jump range and one multi-jump total per load state — the maximum single
  jump, unladen and laden — presented together for comparison under the package's own names, with
  the Commander's selected state marked among them.
- **Mobility profile**: Speed, boost speed, pitch, roll and yaw, each marked as a hull base
  characteristic or a build-specific figure, for a stated ENG allocation.
- **Mass breakdown**: The build's mass apportioned to the hull, its fitted modules and its fuel,
  with each module's own contribution and slot.
- **Mass curve position**: A fitted module's curve thresholds — optimal and, for thrusters, maximum
  — the build's mass against them and how far it stands from each, and the performance multipliers
  in force where the module has them: speed and rotation.

## Upstream dependencies

**Nothing in this area is blocked.** `mobilityMetrics` computes speed, boost, pitch, roll and yaw
from the build's thrusters, mass and ENG pip allocation, applying the thruster mass curves, and
reports zero performance above the curve rather than a fabricated value. Jump range and fuel per
jump are computed for any load, and `jumpRangeSummary` returns the three single-jump figures
together with all three multi-jump totals (`totalMax`, `totalUnladen`, `totalLaden`), which
satisfies FR-001, FR-003 and FR-004. Both routes read the total off the build, so a Guardian FSD
Booster's contribution is included — fitting one moves the maximum jump's total exactly as it moves
the single-jump range, where assembling the drive's own constants outside the loadout would have
omitted it. Hull mass, unladen mass, fuel capacity, cargo capacity, mass lock and each module's own
post-engineering mass are all available, which satisfies FR-010 and FR-012.

Two boundaries of `totalRange`'s fuel option are worth recording: a fuel load of zero returns a
total of zero range and zero jumps, which is a figure rather than an absent one and is presented
under FR-006a; and a fuel load large enough to require more than 100,000 jumps is refused rather
than iterated, which no load a build can actually carry reaches.

**The Frame Shift Drive has no three-point curve, and that is a property of the data rather than a
gap.** `MassCurveStats` — three curve masses with their multipliers — is carried by thrusters
(40 of 40) and shield generators, but by no drive: all 72 frame shift drives expose `optMass` alone.
What
the package does compute is `frameShiftDriveMassFactor`, the dimensionless `optMass / loadedMass`
the jump equation uses. How the drive is presented is therefore a product decision, which FR-015
takes.

**The thrusters' minimum curve mass is available and deliberately unused.** All 40 thrusters carry
`minMass` alongside `optMass` and `maxMass`, and FR-014 shows two of the three. Measured across the
1,144 valid hull-and-thruster combinations, 58 sit below the fitted thruster's minimum at unladen
mass — across 24 hulls and 21 of the 40 thrusters — and 32 across 12 hulls remain below it at the
loaded mass FR-014a displays. The minimum is therefore reachable, which is what the open question on
FR-014 reopens.

FR-016 is the boundary for all of it: every mass and every multiplier is the package's own, and
where the application states how one stands against another it is comparing two reported figures
rather than evaluating the curve itself.

**Composed under feature 003's FR-001a**, naming what is combined and from which package figures:

1. **Mass by source (FR-011)** — the hull's mass, the build's unladen mass and every module's own
   post-engineering mass are all reported, and fuel capacity is reported as a main and a reserve
   figure; the modules' combined contribution is their sum, and the fuel aboard is the sum of the
   two tanks. No game rule is restated.
2. **The curve's loaded mass (FR-014a)** — the build's unladen mass, its main-tank fuel capacity and
   its cargo capacity are each reported; the mass the package evaluates the thruster curve at is
   their sum, with the reserve tank left out because the package leaves it out. The curve itself is
   not reproduced, and the multiplier at that mass is read from the package rather than
   interpolated.
3. **The build's mass against a curve threshold (FR-016)** — the loaded mass of item 2 and the
   threshold it is read against are both figures the package reports, so stating their difference
   (headroom in tonnes) or their quotient (a proportion of optimal mass) is the comparison FR-001a
   permits.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Every jump, mobility and mass figure matches the value `@elite-dangerous-almanac/core`
  computes for the same build and the same load and pip assumptions — zero divergence across the
  reference corpus.
- **SC-002**: A Commander can tell how much jump range a full cargo hold costs them without changing
  a viewing condition or performing any arithmetic.
- **SC-003**: A Commander can identify the three heaviest modules in a build in one interaction.
- **SC-004**: Every mobility figure is attributable to the hull or to the build — zero figures shown
  without stating which, across the corpus.
- **SC-005**: No mass curve, jump-range formula or fuel-consumption rule is implemented in this
  application — every figure composes package values only, asserted by tests that fail if a game
  rule appears here.
- **SC-006**: For every build with no drive, no thrusters or an unresolved slot, the dependent
  figures read as unavailable with a reason — zero fabricated zeroes across the corpus — while every
  zero the package itself reports is shown as a figure with its reason, never as unavailable.
- **SC-007**: Jump, mobility, mass and the curve figures are readable on desktop, tablet and mobile
  viewports — the same end-to-end suite passes on all three, with no horizontal page scrolling at
  any of them.

## Assumptions

- The mass curves are the package's; the application places the build's mass against them and shows
  the multiplier the package computed. It does not reproduce the curve or interpolate along it.
  Saying how far the build sits from a threshold is arithmetic on two reported figures, not an
  evaluation of the curve, and FR-016 permits it.
- "Laden" and "unladen" mean what the package means by them. The application does not introduce a
  third load convention of its own. What it adds is a fixed gloss of each name (feature 003's
  FR-012a), because the two words are ordinary English that a Commander will otherwise read as empty
  and full of anything, and because the state most easily mislabelled — the maximum single jump —
  carries one jump's fuel rather than none.
- The load state the Commander selects is one of the three states this comparison already shows, so
  it is marked among them rather than reported as a fourth figure.
- Fuel mass counts the main tank and the reserve as the package reports them; the application does
  not model consumption over a route. The reserve counts towards the mass breakdown and not towards
  the mass the thruster curve is evaluated at, which is the package's own distinction rather than a
  choice made here: the reserve is included in the mass the game's statistics panel displays, and
  excluded from the flight model that reproduces the observed rotation rates. FR-014a keeps the two
  figures apart.
- Route planning, system-to-system plotting and neutron boosting are out of scope. This feature
  reports what one jump and one tank achieve, not where they reach.
- Mass distribution across the hull is not modelled, because Elite Dangerous does not model it and
  the package reports nothing about it. Mass is a single figure for the build; where it sits on the
  ship affects nothing, so nothing is reported about it.
- Which figures are prominent and how the mass breakdown and curve figures are laid out are decided
  at plan time against the design system, per constitution principle VII.
