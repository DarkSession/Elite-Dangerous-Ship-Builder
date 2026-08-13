# Feature Specification: Advanced Ship Statistics

**Feature Branch**: `005-advanced-ship-statistics`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "In the ship statistics, lets add power budget, specifically
for deployed + retracted hardpoints. We want to show damage detail, split by type, shield
and armour details, show resistances, show module protection, shield recharge details,
shield cell bank capacity, ship speed, with/without boost, pitch/roll/yaw, power
distributor capacity, especially for shields (SYS), thruster boost (ENG) and weapons
(WEP). We also want to show the ships heat and thermal load, the ships cost, rebuy
amount, material requirements."

## Scope relative to feature 003

This feature **extends** [feature 003](../003-ship-statistics/spec.md); it does not
replace it. Feature 003 fixes the headline set — jump, power totals, mass, capacity,
shields, armour, weapons, costs — and the honesty rules that govern every figure. This
feature adds the depth a Commander needs to judge a build in combat and to plan what it
will cost to assemble: the power budget split by hardpoint state, the full damage and
defence breakdowns, mobility, the power distributor and its pips, heat, and the credit
and material bill.

Everything in feature 003 continues to apply, in particular FR-001 (all statistics come
from `@elite-dangerous-almanac/core`), FR-011 (unavailable is shown as unavailable, with
a reason) and FR-015 (a wrong figure is fixed upstream, never locally). This feature also
resolves an obligation feature 003 states but cannot currently meet: see FR-030 and
"Upstream dependencies".

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Power budget with hardpoints deployed and retracted (Priority: P1)

A Commander whose build fits comfortably inside its power plant with hardpoints stowed
wants to know what happens the moment they deploy: whether the plant still covers
everything, and if not, which priority group drops offline.

**Why this priority**: Deploying hardpoints is the single largest step change in a
build's power draw, and a build that browns out on deployment is broken in exactly the
moment that matters. Feature 003 reports one power total, which cannot express this.

**Independent Test**: Load a build whose deployed draw exceeds its plant while its
retracted draw does not, and confirm both states are reported separately, each against
capacity, with the priority groups that stay online in each state identified.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views the power budget, **Then**
   retracted draw and deployed draw are both shown against the power plant's capacity,
   each with its own headroom or deficit and its utilisation.
2. **Given** the power budget, **When** the Commander examines it by priority group,
   **Then** each group shows its retracted and deployed draw, its cumulative total, and
   whether that group stays powered in each of the two states.
3. **Given** a build that is within budget retracted but over budget deployed, **When**
   the Commander views the power budget, **Then** the deficit is stated for the deployed
   state only, and the modules that would shut down on deployment are identified.
4. **Given** a fitted module whose power draw the catalogue does not carry, **When** the
   power budget is shown, **Then** that module is listed as an unknown draw and the
   totals are qualified accordingly, rather than treating the unknown as zero.

---

### User Story 2 - Read the full defence profile (Priority: P1)

A Commander compares two shield fits and needs more than a single strength number: where
the strength comes from, how it resists each damage type, how much punishment the hull
takes once shields drop, and how well the modules inside are protected.

**Why this priority**: Defence is half of every combat build decision, and the aggregated
figure in feature 003 cannot answer "which of these two fits survives a plasma
accelerator". The package already computes the whole breakdown.

**Independent Test**: Load a shielded, engineered build and confirm the shield strength
breakdown, per-damage-type resistances and effective hit points, the armour breakdown and
its resistances, and module armour and module protection are all shown and match the
package's figures for that build.

**Acceptance Scenarios**:

1. **Given** a build with a shield generator, **When** the Commander views its defences,
   **Then** total shield strength is shown alongside the contributions that make it up —
   generator, boosters and reinforcement — together with the mass-curve and boost
   multipliers applied.
2. **Given** shield resistances, **When** the Commander views them, **Then** a resistance
   percentage and an effective hit-point figure are shown for each damage type the
   package reports, including caustic.
3. **Given** a build's armour, **When** the Commander views it, **Then** total armour hit
   points are shown with the bulkhead and hull-reinforcement contributions, plus a
   resistance percentage and effective hit points per damage type.
4. **Given** module reinforcement packages are fitted, **When** the Commander views the
   defence profile, **Then** module armour and module protection are shown as their own
   figures, and a build with none says so rather than showing them as zero protection.
5. **Given** a build with no shield generator, **When** the Commander views the defence
   profile, **Then** the shield figures are reported as absent, and the armour figures
   are still shown in full.

---

### User Story 3 - Read the full offence profile, split by damage type (Priority: P1)

A Commander fitting a mixed loadout needs to see how much of their output is kinetic,
thermal, explosive, absolute and anti-xeno, what they can actually sustain, and what it
costs in distributor energy and heat.

**Why this priority**: A single damage-per-second number hides the decision. Damage type
against a target's resistances is what determines whether a loadout works, and it is the
figure every reference tool leads with.

**Independent Test**: Load a build with weapons of at least two damage types and confirm
per-weapon and whole-build figures are shown, each split by damage type, with burst and
sustained values distinguished and ammunition-limited sustained output stated.

**Acceptance Scenarios**:

1. **Given** a build with weapons fitted, **When** the Commander views its offence,
   **Then** whole-build damage per second is shown split by damage type, with burst and
   sustained figures distinguished and each labelled.
2. **Given** the offence profile, **When** the Commander opens a single weapon, **Then**
   that weapon's damage per shot, rate of fire, sustained rate of fire, damage by type,
   energy per second, heat per second, power draw and ammunition capacity are shown.
3. **Given** a weapon with a limited magazine, **When** its sustained figures are shown,
   **Then** the ammunition limit is stated as the reason sustained output differs from
   burst output, and a weapon with unlimited ammunition says so.
4. **Given** a weapon whose catalogue entry carries range and armour-piercing figures,
   **When** the Commander views it, **Then** maximum range, falloff range and armour
   piercing are shown, and armour piercing is presented against the hull hardness of the
   ship being built.
5. **Given** a disabled weapon, **When** whole-build offence is computed, **Then** its
   contribution is excluded and it is shown as disabled rather than omitted.

---

### User Story 4 - Distributor capacity and pip allocation (Priority: P2)

A Commander allocates pips to SYS, ENG and WEP and sees what each capacitor holds and how
fast it refills — and watches their shield resistances move as SYS pips go in.

**Why this priority**: Pips are the one build input a Commander changes constantly in
flight, and SYS pips change the defence profile materially. The package already accepts a
SYS pip count when computing shield metrics, so the defence half of this is deliverable
now.

**Independent Test**: Change the SYS pip allocation and confirm shield resistances and
effective hit points recompute, and that the fitted distributor's capacity and recharge
rate for each of the three capacitors are displayed, engineering included.

**Acceptance Scenarios**:

1. **Given** a build with a power distributor fitted, **When** the Commander views the
   distributor, **Then** capacity and recharge rate are shown separately for systems,
   engines and weapons, reflecting any engineering applied to that distributor.
2. **Given** the statistics view, **When** the Commander allocates pips across the three
   capacitors, **Then** the allocation is constrained to the game's rule and the current
   allocation is shown alongside every figure that depends on it.
3. **Given** a pip allocation, **When** the Commander changes the SYS pips, **Then**
   shield resistances and effective hit points recompute for that allocation, and the
   figures state which allocation they assume.
4. **Given** no distributor is fitted, **When** the Commander views the distributor,
   **Then** the application says the build has no distributor rather than showing zero
   capacities.

---

### User Story 5 - Mobility: speed, boost and manoeuvrability (Priority: P2)

A Commander building a fast ship wants to see top speed, boost speed and how the ship
turns, and to judge what the mass they just added has cost them.

**Why this priority**: Speed and boost are headline figures in every comparable tool, and
mobility is the reason many builds exist. It is P2 rather than P1 because the figures for
a specific build depend on package capability that does not exist yet (see "Upstream
dependencies"), while the hull's own characteristics can be shown immediately.

**Independent Test**: Load a build and confirm speed, boost speed and pitch, roll and yaw
rates are shown for it, each stating whether it is the hull's base characteristic or a
figure computed for this build's thrusters, mass and pip allocation.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views mobility, **Then** top speed
   and boost speed are shown, distinguished from one another, with the load and pip
   assumptions they were computed under stated.
2. **Given** an active build, **When** the Commander views mobility, **Then** pitch, roll
   and yaw rates are shown, together with the hull's mass lock factor.
3. **Given** the package cannot yet compute a mobility figure for this build's thrusters,
   mass and pips, **When** the Commander views mobility, **Then** the hull's base
   characteristic is shown, explicitly labelled as the hull's base value rather than this
   build's, and the build-specific figure is reported as unavailable — never estimated.

---

### User Story 6 - Shield recharge and cell bank capacity (Priority: P2)

A Commander who has lost their shields wants to know how long they will be without them,
and how much of that gap their shield cell banks can cover.

**Why this priority**: Recovery time decides whether a fight is survivable, and cell banks
are the standard answer to it. Depends on package capability that does not exist yet.

**Independent Test**: Load a build with a shield generator and at least one cell bank and
confirm the regeneration rates, the time to recover from broken shields, and the total
cell bank pool are shown for that build.

**Acceptance Scenarios**:

1. **Given** a build with a shield generator, **When** the Commander views shield
   recovery, **Then** the regeneration rate, the broken-shield regeneration rate and the
   time to bring shields back from broken are shown.
2. **Given** a build with shield cell banks fitted, **When** the Commander views them,
   **Then** the total restorable shield strength across all banks is shown, together with
   the number of cells available, and each bank's spin-up time, duration and heat cost.
3. **Given** a build with no cell banks, **When** the Commander views shield recovery,
   **Then** the application says the build carries no cell banks rather than showing a
   zero pool.

---

### User Story 7 - Heat and thermal load (Priority: P2)

A Commander checks whether their build cooks itself: what it runs at idle, what firing
everything at once does to it, and how much margin the hull has.

**Why this priority**: Heat governs both weapon uptime and silent running, and a build
that overheats on its first alpha strike is unusable. Depends on package capability that
does not exist yet.

**Independent Test**: Load a build with weapons and confirm idle and firing heat figures
are shown against the hull's heat capacity, with the contributing sources identified.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views heat, **Then** the power
   plant's heat efficiency and the hull's heat capacity are shown.
2. **Given** a build with weapons fitted, **When** the Commander views heat, **Then** the
   thermal load of firing them is shown, both for a single alpha strike and sustained,
   and the per-weapon contributions are reachable.
3. **Given** a build whose thermal load the package cannot yet aggregate, **When** the
   Commander views heat, **Then** the per-module and per-weapon thermal figures the
   package does carry are shown, and the build-level heat figure is reported as
   unavailable rather than summed locally.

---

### User Story 8 - What the build costs, in credits and materials (Priority: P3)

A Commander who has finished planning wants the bill: what the hull and modules cost,
what the rebuy will be, and which engineering materials they need to gather before they
can actually build it.

**Why this priority**: This is planning for after the decision rather than input to it,
but it is the step that turns a plan into a shopping trip — and the material list is
what a Commander takes to the engineers.

**Independent Test**: Load an engineered build and confirm the hull value, modules value
and rebuy are shown, and that a consolidated list of the materials required for every
blueprint and experimental effect in the build is produced with per-material totals.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views its costs, **Then** hull value,
   total modules value and rebuy are shown at catalogue retail, with any recorded source
   purchase price kept distinct from them.
2. **Given** an engineered build, **When** the Commander views its material requirements,
   **Then** every blueprint grade and experimental effect in the build contributes its
   materials to a single consolidated list, with each material named and totalled.
3. **Given** a module engineered to grade 5, **When** its materials are listed, **Then**
   the list accounts for the grades that must be rolled to reach grade 5, not grade 5
   alone.
4. **Given** a build assembled in the application rather than imported, **When** the
   package cannot supply a credit figure for it, **Then** the figure is reported as
   unavailable with its reason, and no total is assembled locally from catalogue prices.
5. **Given** a blueprint whose material costs the catalogue does not carry, **When** the
   material list is shown, **Then** that blueprint is named as missing from the list
   rather than silently contributing nothing.

---

### Edge Cases

- A build with no power plant: retracted and deployed draw are still reported, and
  capacity is reported as absent rather than zero, so utilisation is unavailable rather
  than infinite.
- A module the package reports with an unknown power draw: it appears in the unknown-draw
  list, and both power totals are qualified as lower bounds rather than presented as
  complete.
- Every hardpoint empty: the deployed and retracted figures are equal, and the view says
  so rather than implying a deployment penalty that does not exist.
- A build with shields but zero resistance to a damage type: shown as 0%, distinct from a
  build with no shields at all, where the figure is absent.
- Guardian and anti-xeno weapons whose damage falls outside the four standard types: the
  anti-xeno and unclassified components are shown under their own labels rather than
  folded into absolute damage.
- A weapon with fractional or continuous fire (beam lasers): burst and sustained figures
  are still distinguished, and the continuous nature of the weapon is stated.
- Pips allocated entirely to SYS on a build with no shield generator: the allocation is
  accepted, and the defence view still reports that there are no shields.
- A pip allocation that the game would not permit: it cannot be entered.
- A hull characteristic the catalogue does not carry (heat capacity, mass lock, pip
  speed): reported as absent, never as zero, and never inferred from a similar hull.
- An engineered thruster on a build whose speed the package cannot yet compute: the
  engineering is visible on the module itself, and the build's speed is unavailable — the
  application does not scale the hull's base speed by the engineering itself.
- A build whose material requirements include a pre-engineered module: the pre-applied
  engineering contributes no material cost, because the Commander does not roll it, and
  the list says why that module is absent.
- Cell banks of mixed classes and ratings fitted together: the pool is the total across
  all of them, and per-bank figures remain individually inspectable.
- Rapidly changing pips or hardpoint state while statistics are on screen: the displayed
  set is always internally consistent for one state, never a mixture of two.
- The full detail set on a phone: every breakdown stays reachable and legible at increased
  text sizes, and no per-damage-type table forces the page to scroll horizontally.

## Requirements _(mandatory)_

### Functional Requirements

#### Power budget

- **FR-001**: The application MUST display the build's power draw in both hardpoint
  states — retracted and deployed — each against the power plant's capacity, with its own
  headroom or deficit and utilisation.
- **FR-002**: The application MUST display, per priority group, the retracted and deployed
  draw, the cumulative total at that group, and whether the group remains powered in each
  state.
- **FR-003**: The application MUST identify the modules that would shut down in a state
  whose draw exceeds capacity, naming them by slot.
- **FR-004**: Modules whose power draw the package reports as unknown MUST be listed as
  such, and totals that include them MUST be qualified rather than presented as complete.

#### Defence

- **FR-005**: The application MUST display total shield strength together with its
  generator, booster and reinforcement contributions and the mass-curve and boost
  multipliers applied.
- **FR-006**: The application MUST display shield resistance as a percentage and effective
  hit points for every damage type the package reports, including caustic.
- **FR-007**: The application MUST display total armour hit points together with the
  bulkhead and hull-reinforcement contributions, and armour resistance as a percentage and
  effective hit points per damage type.
- **FR-008**: The application MUST display module armour and module protection as distinct
  figures, and MUST report their absence as absence rather than as zero protection.
- **FR-009**: The application MUST display the shield regeneration rate, the broken-shield
  regeneration rate and the time to restore shields from broken.
- **FR-010**: The application MUST display shield cell bank capacity for the build — the
  total restorable shield strength and the number of cells available — together with each
  bank's spin-up time, duration and heat cost.

#### Offence

- **FR-011**: The application MUST display whole-build damage per second split by damage
  type — kinetic, thermal, explosive, absolute and anti-xeno — with burst and sustained
  figures distinguished and labelled.
- **FR-012**: The application MUST display, per weapon, damage per shot, rate of fire,
  sustained rate of fire, damage by type, energy per second, heat per second, power draw
  and ammunition capacity.
- **FR-013**: The application MUST state, for each weapon, whether sustained output is
  limited by ammunition and MUST identify weapons with unlimited ammunition as such.
- **FR-014**: The application MUST display each weapon's maximum range, falloff range and
  armour piercing where the catalogue carries them, and MUST present armour piercing
  against the hull hardness of the ship being built.
- **FR-015**: Disabled weapons MUST be excluded from whole-build offence totals and shown
  as disabled rather than omitted from the per-weapon list.

#### Distributor and pips

- **FR-016**: The application MUST display the fitted power distributor's capacity and
  recharge rate separately for the systems, engines and weapons capacitors, reflecting
  engineering applied to that distributor.
- **FR-017**: The Commander MUST be able to allocate pips across the three capacitors, and
  the allocation MUST be constrained to what the game permits.
- **FR-018**: The current pip allocation MUST be shown alongside every statistic computed
  under it, and any statistic that depends on pips MUST state the allocation it assumes.
- **FR-019**: Changing the SYS pip allocation MUST recompute shield resistances and
  effective hit points for that allocation.
- **FR-020**: The pip allocation MUST NOT alter any statistic that does not depend on it,
  and MUST NOT be persisted into the build itself — it is a viewing condition, like the
  cargo and fuel assumptions of feature 003, not part of the build.

#### Mobility

- **FR-021**: The application MUST display top speed and boost speed as distinct figures,
  and pitch, roll and yaw rates, together with the hull's mass lock factor.
- **FR-022**: Every mobility figure MUST state whether it is the hull's base
  characteristic or a figure computed for this build's thrusters, mass and pip allocation.
- **FR-023**: Where the package cannot compute a build-specific mobility figure, the
  application MUST show the hull's base characteristic labelled as such and report the
  build-specific figure as unavailable. It MUST NOT scale, interpolate or otherwise derive
  the build's speed or handling from the hull's base values.

#### Heat

- **FR-024**: The application MUST display the power plant's heat efficiency and the
  hull's heat capacity.
- **FR-025**: The application MUST display the thermal load of the build's weapons, for a
  single alpha strike and sustained, with per-weapon contributions reachable.
- **FR-026**: Where the package cannot aggregate a build-level heat figure, the
  application MUST show the per-module and per-weapon thermal figures it does carry and
  report the build-level figure as unavailable. It MUST NOT sum or model heat locally.

#### Costs and materials

- **FR-027**: The application MUST display hull value, total modules value and rebuy at
  catalogue retail, keeping any recorded source purchase price distinct from them.
- **FR-028**: The application MUST display a consolidated list of the engineering
  materials the build requires, aggregating every blueprint grade and experimental effect
  across every engineered module, with each material named and totalled.
- **FR-029**: The material list MUST account for every grade that must be rolled to reach
  a module's applied grade, not the applied grade alone.
- **FR-030**: Where the package cannot supply a credit figure for a build — notably a
  build assembled in the application rather than imported from a capture — the application
  MUST report that figure as unavailable with its reason. It MUST NOT assemble a total
  from catalogue prices or compute a rebuy percentage locally.
- **FR-031**: Blueprints or effects whose material costs the catalogue does not carry MUST
  be named as missing from the material list rather than contributing nothing silently.
- **FR-032**: Pre-engineered modifications MUST NOT contribute material costs, and their
  exclusion MUST be stated.

#### Honesty and provenance

- **FR-033**: Every statistic in this feature MUST be computed by
  `@elite-dangerous-almanac/core`. The application MUST NOT reimplement, sum, scale,
  clamp or otherwise derive a game figure locally, including for the figures the package
  does not yet provide.
- **FR-034**: Every figure the package reports as unavailable, incomplete or absent MUST
  be surfaced as such with the package's diagnostic reason, and MUST NOT be shown as zero
  or an estimate.
- **FR-035**: Every figure MUST carry its unit and, where applicable, the load, pip and
  hardpoint-state assumptions it was computed under.
- **FR-036**: Every statistic in this feature MUST recompute automatically on every build
  change and on every change to a viewing condition, and the displayed set MUST always be
  internally consistent for one state.
- **FR-037**: A capability this feature needs that the package does not provide MUST be
  raised against `@elite-dangerous-almanac/core` and delivered there. The requirement
  waits on the released fix; it is not satisfied by an approximation in this application.

### Device Requirements

- **FR-038**: Every breakdown in this feature MUST be available on desktop, tablet and
  mobile. No breakdown may be desktop-only.
- **FR-039**: Per-damage-type tables, per-weapon detail and the material list MUST remain
  readable on narrow viewports without horizontal page scrolling; wide content scrolls
  within its own container.
- **FR-040**: Pip allocation and the hardpoint-state view MUST be operable by touch, with
  targets large enough to hit reliably on a phone, and MUST NOT depend on hover.
- **FR-041**: Detail behind an aggregate — per-module power draw, per-weapon figures,
  per-bank cell figures, per-material contributions and diagnostic reasons — MUST be
  reachable by touch as well as by pointer and keyboard.

### Testing Requirements

- **FR-042**: Every statistic in this feature MUST be unit-tested against known builds,
  including the unavailable, absent and incomplete cases, the fraction-to-percentage
  conversion, and the pip-dependent defence figures at several allocations.
- **FR-043**: Power budget behaviour MUST be unit-tested across builds that are within
  budget in both states, within budget only retracted, and over budget in both.
- **FR-044**: Material aggregation MUST be unit-tested against builds with repeated
  blueprints, multi-grade rolls and pre-engineered modules.
- **FR-045**: Each user story's primary journey MUST have a Playwright end-to-end test
  that runs against desktop, tablet and mobile viewports.

### Key Entities

- **Hardpoint state**: Retracted or deployed — the condition under which a power figure is
  reported. Not a property of the build.
- **Pip allocation**: How the Commander has distributed the distributor's pips across
  systems, engines and weapons. A viewing condition, not part of the build.
- **Power band**: One priority group's draw in each hardpoint state, its cumulative total,
  and whether it stays powered in each state.
- **Defence profile**: Shield strength with its contributions, armour with its
  contributions, resistances and effective hit points per damage type, module armour and
  module protection, regeneration rates and cell bank capacity.
- **Offence profile**: Whole-build and per-weapon output split by damage type, with burst
  and sustained figures, energy and heat cost, ammunition, range and armour piercing.
- **Distributor profile**: Capacity and recharge rate for each of the three capacitors, as
  engineered.
- **Mobility profile**: Speed, boost speed, pitch, roll, yaw and mass lock, each marked as
  a hull base characteristic or a build-specific figure.
- **Heat profile**: Heat efficiency, hull heat capacity and the build's thermal load, with
  the sources that contribute to it.
- **Cost summary**: Hull value, modules value and rebuy at catalogue retail, distinct from
  any recorded source purchase price.
- **Material requirement**: One material and the total quantity the build's engineering
  needs, traceable to the modules and grades that require it.

## Upstream dependencies

Four groups of figures in this specification cannot be satisfied by
`@elite-dangerous-almanac/core` today. Under constitution principle II each is raised
against the library and delivered there; none may be approximated in this application,
and the requirements that depend on them stay unmet until the released fix lands. Each
affected user story is written so that what the package already carries is shown
immediately and the missing figure is reported as unavailable in the meantime.

1. **Build mobility (FR-021 to FR-023)** — the catalogue carries the hull's base speed,
   boost, pitch, roll, yaw, minimum thrust and pip speed, and thruster modules carry their
   own mass curves, but there is no calculation that produces a build's speed and handling
   from its thrusters, mass and ENG pips.
2. **Shield recovery and cell banks (FR-009, FR-010)** — regeneration rates and cell bank
   reinforcement, spin-up, duration and heat exist as module statistics, but there is no
   build-level aggregate for recovery time or total cell bank pool.
3. **Build heat (FR-024 to FR-026)** — heat efficiency, hull heat capacity, engine and FSD
   heat rates and per-weapon thermal load all exist, but there is no build-level heat
   aggregate.
4. **Costs for an assembled build (FR-027, FR-030)** — hull value, modules value and rebuy
   are reported only as an imported capture stated them; a build assembled from the ship
   picker has none. The catalogue carries hull and module prices, but there is no
   calculation that produces a build's retail value or its rebuy. This is also why feature
   003's FR-007 cannot currently be met for builds created in the application, which this
   feature records rather than works around.

The remaining figures — the deployed and retracted power budget, the shield and armour
breakdowns with resistances and module protection, the damage split by type, distributor
capacities, SYS pip effects on shields, and engineering material costs — are all available
from the package today.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Every displayed figure matches the value computed by
  `@elite-dangerous-almanac/core` for the same build and the same viewing conditions —
  zero divergence across a corpus of reference builds.
- **SC-002**: A Commander can determine, without leaving the statistics view, whether
  deploying hardpoints puts the build over its power budget and which modules would drop
  offline if it does.
- **SC-003**: For a build with weapons of more than one damage type, the share of output
  contributed by each damage type is readable directly, without the Commander performing
  any arithmetic.
- **SC-004**: Changing the pip allocation updates every dependent figure within 100 ms,
  and leaves every independent figure unchanged.
- **SC-005**: Every figure carries its unit and its load, pip and hardpoint-state
  assumptions — no unlabelled numbers.
- **SC-006**: For every figure the package reports as unavailable, absent or incomplete,
  the application shows it as such with a reason — zero fabricated zeroes and zero locally
  derived substitutes, verified for every figure listed under "Upstream dependencies".
- **SC-007**: The consolidated material list for a build equals the sum of the materials
  the package reports for each of its blueprint grades and experimental effects — verified
  across a corpus including repeated blueprints, multi-grade rolls and pre-engineered
  modules.
- **SC-008**: Every breakdown is readable and every detail reachable on desktop, tablet
  and mobile viewports — the same end-to-end suite passes on all three, with no horizontal
  page scrolling at any of them.

## Assumptions

- This feature extends feature 003 rather than replacing it. Feature 003's honesty rules,
  device requirements and testing requirements apply here unchanged, and the two features'
  statistics are presented as one coherent set to the Commander.
- Pips and hardpoint state are viewing conditions, in the same way feature 003 treats
  cargo and fuel assumptions. They are not part of the build, are not saved with it, are
  not carried in a build link and are not exported.
- The default pip allocation puts no pips into SYS, so the headline shield figures match
  what an outfitting screen shows and remain comparable with feature 003's figures. The
  Commander allocates pips deliberately.
- Constraining pip entry to the game's rule — six pips across three capacitors, at most
  four to any one, in half-pip steps — is input validation on a control, not a game
  calculation. If the package later exposes the rule, the application defers to it.
- Damage-type coverage is whatever the package reports. Anti-xeno and unclassified damage
  components are presented under their own labels rather than folded into an existing type.
- Armour piercing is presented against the hull hardness of the ship being built.
  Modelling damage against another ship's specific defences — time to kill, engagement
  simulation — remains out of scope, as it is in feature 003.
- Material requirements cover engineering blueprints and experimental effects. Where a
  material is required, the application names and totals it; sourcing information — where
  a material is found, or trader exchange rates — is out of scope for this feature even
  where the package's materials catalogue carries it.
- Credit costs are quoted at catalogue retail. Shipyard and module discounts, and a
  configurable insurance rate, are out of scope here; they would be a further upstream
  capability request rather than local arithmetic.
- Comparing two builds side by side remains out of scope, as it is in feature 003. This
  feature deepens the figures for the active build.
- Responsiveness, touch support and accessibility are behavioural requirements in scope
  now; only visual styling is deferred.
- Which figures are prominent, how the breakdowns are grouped, and how a pip control looks
  are deferred to the UI workstream; this spec fixes what must be available, how it must be
  qualified, and that it must be reachable on every form factor.
