# Feature Specification: Ship Statistics

**Feature Branch**: `003-ship-statistics`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Users should be able to see a ship's statistics. In the ship
statistics, lets add power budget, specifically for deployed + retracted hardpoints. We want to show
damage detail, split by type, shield and armour details, show resistances, show module protection,
shield recharge details, shield cell bank capacity, ship speed, with/without boost, pitch/roll/yaw,
power distributor capacity, especially for shields (SYS), thruster boost (ENG) and weapons (WEP). We
also want to show the ships heat and thermal load, the ships cost, rebuy amount, material
requirements."

## Scope

This specification is the **contract every figure the application reports about the active build
obeys**: where a figure comes from, how it is labelled and qualified, what happens when it is
unavailable, when it recomputes, and the viewing conditions it is computed under. It also fixes the
**headline set** — the small group of figures a Commander reads at a glance without opening a
breakdown.

The breakdowns themselves are specified per area. Each area inherits everything in this
specification without restating it:

| Area                               | Feature                                                     |
| ---------------------------------- | ----------------------------------------------------------- |
| Power budget, distributor and heat | [005-power-and-heat](../005-power-and-heat/spec.md)         |
| Shields, armour and survivability  | [006-defence-profile](../006-defence-profile/spec.md)       |
| Weapons and damage                 | [007-offence-profile](../007-offence-profile/spec.md)       |
| Speed, handling, mass and jump     | [008-mobility-and-jump](../008-mobility-and-jump/spec.md)   |
| Credits and engineering materials  | [009-cost-and-materials](../009-cost-and-materials/spec.md) |

Where an area specification is more specific, it governs. Where it is silent, this one stands. An
area specification may not relax the honesty rules (FR-006, FR-007) or the prohibition on
implementing a game rule (FR-001); where it composes package figures under FR-001a, it says so.

Statistics for a **build** belong to this family. The catalogue characteristics of a **hull** the
Commander has not chosen yet belong to [feature 001](../001-ship-selection-and-loading/spec.md),
which owns ship selection. Where a build's figures are read off the hull's own geometry rather than
its catalogue entry, [feature 010](../010-hull-anatomy/spec.md) owns the spatial view they are read
from.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Read the build's headline statistics (Priority: P1)

A Commander looks at their build and sees what the ship actually does: how far it jumps, whether it
has enough power, how tough it is, and how hard it hits — without opening anything.

**Why this priority**: Statistics are the reason to use a shipbuilder at all. Without them,
outfitting is guesswork. The headline set is what makes a change legible the moment it is made.

**Independent Test**: Load a known build and confirm the headline figures match the values
`@elite-dangerous-almanac/core` computes for that build, and that each one leads to the area
breakdown behind it.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views it, **Then** the headline set is shown:
   power draw against power plant capacity, shield strength, armour, damage per second, jump range,
   top speed, mass, and the build's validity state.
2. **Given** a headline figure, **When** the Commander wants the detail behind it, **Then** that
   figure leads to the area breakdown that owns it, without the Commander having to know which area
   that is.
3. **Given** a statistic depends on load, pips or hardpoint state, **When** the Commander views it,
   **Then** the assumption it was computed under is stated rather than left ambiguous.
4. **Given** resistances are shown anywhere in the family, **When** the Commander reads them,
   **Then** they are presented as percentages against each damage type, derived from the package's
   fractional values.
5. **Given** a headline figure the package reports as unavailable, **When** the headline set is
   shown, **Then** that figure is shown as unavailable in the headline set itself rather than
   quietly omitted from it.

---

### User Story 2 - See statistics respond to changes (Priority: P1)

A Commander swaps a Frame Shift Drive and immediately sees the jump range move, so they can judge
the trade against the mass and power they just spent.

**Why this priority**: The feedback loop is the product. Statistics that require a manual refresh
make outfitting decisions impossible to evaluate.

**Independent Test**: Change a module and confirm every affected statistic updates without further
interaction, and that unaffected statistics do not flicker or change.

**Acceptance Scenarios**:

1. **Given** a displayed set of statistics, **When** any module is fitted, removed, engineered,
   disabled or re-prioritised, **Then** all affected statistics update immediately and consistently
   with each other, in every area.
2. **Given** a change has been made, **When** the Commander looks at a changed statistic, **Then**
   the direction and size of the change from the previous value is apparent.
3. **Given** modules are disabled or assigned to priority groups, **When** statistics are computed,
   **Then** the contributions of disabled modules are excluded from every figure the package computes
   without them, and the module remains visible as disabled rather than omitted. Where the package
   reports a figure that counts a disabled module regardless — the shield cell bank pool, under
   feature 006's FR-009 — that state is shown beside the figure under FR-001b rather than subtracted
   from it.

---

### User Story 3 - Understand incomplete or invalid builds (Priority: P2)

A Commander whose build is missing a mandatory module, or is drawing more power than it makes, is
told exactly what is wrong instead of being shown a confident but meaningless number.

**Why this priority**: Honesty about unavailable values is a constitutional requirement, and
mid-build states are the normal case, not the exception.

**Independent Test**: Construct a build with a missing core module and an over-budget power plant,
and confirm the affected statistics are reported as unavailable with a stated reason while the rest
remain correct.

**Acceptance Scenarios**:

1. **Given** an aggregate that the package reports as unavailable or incomplete, **When** the
   Commander views it, **Then** the application shows it as unavailable with the diagnostic reason,
   and never substitutes zero or a guess.
2. **Given** a build the package reports as invalid, **When** the Commander views its statistics,
   **Then** the validity problems are listed in plain language, and every statistic that can still
   be computed is still shown.
3. **Given** a build is fully valid and complete, **When** the Commander views its statistics,
   **Then** no warnings are shown.
4. **Given** a build with problems in more than one area, **When** the Commander reads the validity
   state, **Then** each problem names the area and the slot it belongs to, so it is actionable
   without hunting for it.

---

### User Story 4 - Explore statistics under different viewing conditions (Priority: P2)

A Commander checks jump range with a full cargo hold and a half tank before committing to a trade
run, puts four pips into SYS to see what their shields really resist, and deploys hardpoints to see
what the power plant does about it.

**Why this priority**: Viewing conditions are the one input a Commander changes constantly without
changing the ship. Getting their semantics right — that they never become part of the build — is
what keeps a saved or shared build meaning one thing.

**Independent Test**: Vary the cargo and fuel assumptions, the pip allocation and the hardpoint
state, and confirm the dependent figures recompute consistently, the independent ones do not move,
and none of the three is written into the build when it is saved, shared or exported.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander varies assumed cargo and fuel, **Then** every
   figure that depends on load recomputes for those assumptions and states the assumption it used.
2. **Given** an active build, **When** the Commander allocates pips across the three capacitors,
   **Then** the allocation is constrained to the game's rule and is shown alongside every figure
   computed under it.
3. **Given** an active build, **When** the Commander switches between retracted and deployed
   hardpoints, **Then** every figure that depends on that state recomputes and states which state it
   assumes.
4. **Given** a viewing condition has been varied, **When** the Commander reads a figure that does
   not depend on it, **Then** that figure is unchanged.
5. **Given** viewing conditions have been varied, **When** the build is saved, shared as a link or
   exported, **Then** none of the three is carried with it, and reopening the build restores the
   application's default conditions rather than the ones in force when it was saved.

---

### Edge Cases

- Values the catalogue simply does not carry: reported as absent, never as zero.
- An aggregate whose inputs are partly unknown: qualified as a lower bound or reported unavailable
  according to what the package says about it, never presented as complete.
- A hull characteristic the catalogue does not carry: reported as absent, never as zero, and never
  inferred from a similar hull.
- A pip allocation that the game would not permit: it cannot be entered.
- Statistics requested while a build is mid-edit across several rapid changes, or while pips, load
  or hardpoint state change rapidly: the displayed set is always internally consistent for one
  state, never a mixture of two.
- A statistic that disagrees with what the game shows: this is a library defect, raised upstream and
  fixed there — never patched in the presentation layer.
- A figure that belongs to no area specification yet: it is not shown. A new figure gets a
  requirement in the area that owns it before it reaches a Commander.
- The full statistics set on a phone: every breakdown stays reachable and legible at increased text
  sizes, no figure is truncated to the point of ambiguity, and no per-damage-type table forces the
  page to scroll horizontally.
- A diagnostic the package emits only in English: the application says the wording is the library's
  rather than presenting an untranslated string as a translation, and the gap is raised upstream.

## Requirements _(mandatory)_

### Functional Requirements

#### Statistics in general

- **FR-001**: Every statistic MUST originate in `@elite-dangerous-almanac/core`. The application MUST
  NOT implement a game rule — a curve, a formula, a scaling law, a resistance or falloff model, or an
  iteration the package already performs — and MUST NOT clamp, round or otherwise adjust a figure the
  package computed. A figure that would require a game rule this application does not have waits on
  the upstream release rather than being approximated here.
- **FR-001a**: The application MAY combine figures the package computes, where doing so restates no
  game rule. The permitted operations are: adding contributions it reports; comparing two of its
  figures, including expressing that comparison as their difference; counting entries in a collection
  it returns; applying a factor it reports to a figure it reports; and dividing one of its figures by
  another. What remains forbidden under FR-001 is
  supplying any term the package did not report, and reproducing an algorithm it already performs —
  a curve, a formula, a scaling law, or an iteration. Every input MUST remain the package's own, and
  where the package reports the combined figure itself, that figure MUST be used rather than
  reassembled from its parts. An area specification that relies on this allowance MUST say so in its
  "Upstream dependencies" section, naming what it composes and from which package figures.
- **FR-001b**: Presenting a build's own state alongside a figure — that a module is disabled, sits in
  a priority group the plant cannot power, or is unresolved — is not a composition and needs no
  declaration under FR-001a. The build's state and the package's figures are both read as reported;
  no new value is produced. This is the mechanism by which a figure the package computes without
  regard to power state is shown honestly rather than overridden.
- **FR-002**: Every figure MUST carry its unit and, where applicable, the load, pip and
  hardpoint-state assumptions it was computed under.
- **FR-003**: Every statistic MUST recompute automatically on every build change and on every change
  to a viewing condition, and the displayed set MUST always be internally consistent for one state.
- **FR-004**: The change in each statistic relative to its previous value MUST be discernible after
  a build change.
- **FR-005**: Resistances MUST be presented as percentages, converted from the package's fractional
  values.
- **FR-006**: Every figure the package reports as unavailable, incomplete or absent MUST be
  surfaced as such together with the package's diagnostic reason, and MUST NOT be shown as zero or
  an estimate.
- **FR-007**: Build validity and completeness problems MUST be listed in plain language, naming the
  area and the slot each belongs to, and MUST NOT suppress the statistics that can still be
  computed.

#### The headline set

- **FR-008**: The application MUST present a headline set of figures for the active build,
  containing at minimum: power draw against power plant capacity, shield strength, armour, damage
  per second, jump range, top speed, mass, and the build's validity state.
- **FR-009**: Every headline figure MUST be a route to the area breakdown that owns it, so a
  Commander reaches the detail without knowing which area specification it lives in.
- **FR-010**: A headline figure the package reports as unavailable MUST appear in the headline set
  as unavailable. It MUST NOT be omitted, and its absence MUST NOT be represented by a zero or a
  blank that reads as one.
- **FR-011**: The headline set MUST remain available to the Commander while they are outfitting, so
  a change can be judged without navigating away from the slot in hand.

#### Viewing conditions

- **FR-012**: The Commander MUST be able to vary the assumed cargo and fuel load and see dependent
  statistics recompute.
- **FR-013**: The Commander MUST be able to allocate pips across the three capacitors, and the
  allocation MUST be constrained to what the game permits.
- **FR-014**: The Commander MUST be able to select the hardpoint state — retracted or deployed —
  under which state-dependent figures are reported.
- **FR-015**: The current load assumptions, pip allocation and hardpoint state MUST be shown
  alongside every statistic computed under them, and any statistic that depends on one MUST state
  the value it assumes.
- **FR-016**: Load assumptions, pip allocation and hardpoint state are viewing conditions, not part
  of the build. They MUST NOT alter any statistic that does not depend on them, MUST NOT be
  persisted into the build, and MUST NOT be saved with it, carried in a build link or exported.
- **FR-017**: Changing a viewing condition MUST NOT enter the edit history, consistent with feature
  002's FR-019, because it does not change the build.

#### Upstream defects and gaps

- **FR-018**: A statistic that disagrees with the game MUST be raised against
  `@elite-dangerous-almanac/core` and corrected there. This application MUST NOT adjust, clamp or
  re-derive a figure the package computed.
- **FR-019**: A capability any specification in this family needs that the package does not provide
  MUST be raised against `@elite-dangerous-almanac/core` and delivered there. The requirement waits
  on the released fix; it is not satisfied by an approximation in this application.

### Device Requirements

- **FR-020**: The full set of statistics and every breakdown, in every area, MUST be available on
  desktop, tablet and mobile. No figure and no breakdown may be desktop-only.
- **FR-021**: On narrow viewports, statistics MUST remain readable without horizontal page
  scrolling; wide content — per-damage-type tables, per-weapon detail, the material list — scrolls
  within its own container.
- **FR-022**: Statistics MUST be reachable while outfitting on a phone, so a Commander can judge a
  change without losing the module they are working on.
- **FR-023**: Detail behind an aggregate — per-module contributions, per-weapon figures, per-bank
  cell figures, per-material contributions and diagnostic reasons — MUST be reachable by touch as
  well as by pointer and keyboard, never by hover alone.
- **FR-024**: The viewing-condition controls — load assumptions, pip allocation and hardpoint state
  — MUST be operable by touch, with targets large enough to hit reliably on a phone, and MUST NOT
  depend on hover.

### Testing Requirements

- **FR-025**: The rules in this specification MUST be unit-tested against known builds: the
  fraction-to-percentage conversion, the unavailable, absent, incomplete and invalid cases, and the
  requirement that a viewing condition changes only the figures that depend on it.
- **FR-026**: The headline set MUST be unit-tested for completeness and for the unavailable case, so
  that a figure the package cannot produce is never silently dropped from it.
- **FR-027**: Each user story's primary journey MUST have a Playwright end-to-end test that runs
  against desktop, tablet and mobile viewports.

### Key Entities

- **Statistic**: A named, computed figure about the build, with a unit, the assumptions it was
  computed under where relevant, and either a value or a reason it is unavailable.
- **Headline set**: The figures a Commander reads at a glance, each a route to the area breakdown
  behind it.
- **Load assumption**: The cargo and fuel a figure is computed for. A viewing condition, not part of
  the build.
- **Pip allocation**: How the Commander has distributed the distributor's pips across systems,
  engines and weapons. A viewing condition, not part of the build.
- **Hardpoint state**: Retracted or deployed — the condition under which a state-dependent figure is
  reported. Not a property of the build.
- **Validation report**: The package's assessment of whether the build is valid and operationally
  complete, and what is missing.

## Upstream dependencies

The figures this specification's family needs are computed by
`@elite-dangerous-almanac/core@0.1.0-beta.4` today, with four exceptions, each raised in the area
specification that needs it: WEP pip-to-recharge scaling (feature 007), the Frame Shift Drive's mass
curve and the number of jumps a full tank affords (feature 008), and a power-aware shield cell bank
pool (feature 006). Several areas also compose figures under FR-001a; each names what it composes in
its own "Upstream dependencies" section.

One thing this contract needs from the package is a **locale for its diagnostics**: the validity,
completeness and edit-error messages FR-006 and FR-007 surface are English-only. Each carries a
machine-readable code and parameters, so the application could render the wording itself, but under
the constitution's "ask for a locale there" rule the wording of game diagnostics belongs to the
library. This is raised upstream rather than settled here.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Every displayed figure, in every area, matches the value computed by
  `@elite-dangerous-almanac/core` for the same build and the same viewing conditions — zero
  divergence across a corpus of reference builds.
- **SC-002**: Statistics reflect a build change within 100 ms, with no manual refresh.
- **SC-003**: Changing the pip allocation, the load assumptions or the hardpoint state updates every
  dependent figure within 100 ms, and leaves every independent figure unchanged.
- **SC-004**: For every figure the package reports as unavailable, absent or incomplete, the
  application shows it as such with a reason — zero fabricated zeroes and zero locally derived
  substitutes, verified across a corpus covering each kind of gap the package can report: an
  unresolved slot, an unknown power draw, an unpriced module and a build missing a mandatory module.
- **SC-005**: Every figure carries its unit and its load, pip and hardpoint-state assumptions — no
  unlabelled numbers, in any area.
- **SC-006**: A Commander can reach the breakdown behind any headline figure in one interaction.
- **SC-007**: No viewing condition survives a save, a build link or a SLEF export — zero leakage
  into the build across the round-trip corpus.
- **SC-008**: Every statistic is readable, every breakdown reachable and every diagnostic legible on
  desktop, tablet and mobile viewports — the same end-to-end suite passes on all three, with no
  horizontal page scrolling at any of them.

## Assumptions

- Statistic definitions, units and edge-case semantics are the package's; this application presents
  them rather than reinterpreting them.
- This specification is a contract, not a screen. It fixes what every figure must obey and what the
  headline set must contain; which figures are prominent and how the areas are laid out are decided
  at plan time against the design system, per constitution principle VII.
- The area specifications are independently deliverable. A Commander with only this specification
  and one area has a coherent product; the contract does not require all five areas to exist before
  any of them is useful.
- The default pip allocation puts no pips into SYS, so the pip-dependent shield figures —
  resistances, effective hit points and the recovery durations feature 006 reports — match what an
  outfitting screen shows. The Commander allocates pips deliberately from there. Shield strength
  itself does not depend on the allocation, so it carries no such convention.
- The default load assumption is a full fuel tank and an empty cargo hold, which is the state a ship
  leaves a station in and the one feature 008 calls unladen.
- The default hardpoint state is retracted, so the headline power figure matches the state a ship
  spends most of its time in, and the deployed state is something the Commander asks for.
- Constraining pip entry to the game's rule — six pips across three capacitors, at most four to any
  one, in half-pip steps — is input validation on a control, not a game calculation. If the package
  later exposes the rule, the application defers to it.
- Comparison between two builds side by side is out of scope; this family covers the active build.
  Comparing two _hulls_ before a build exists is out of scope too, under feature 001's withdrawn
  FR-010.
- Responsiveness, touch support, accessibility and translatability are behavioural requirements in
  scope now; only visual styling is deferred.
