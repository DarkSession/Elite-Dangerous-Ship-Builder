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

Every figure in this family describes an active build, so the whole family requires one and none of
it exists before a hull is chosen. FR-000 states that once, for all five areas.

## Clarifications

### Session 2026-08-16

- Q: When a build first loads, how should the six distributor pips be divided across SYS, ENG and
  WEP? → A: The game's balanced allocation — two pips to each capacitor.
- Q: If a Commander sets viewing conditions and then reloads the page or opens a new session, should
  those conditions come back, or reset to the defaults? → A: Never persisted; every load starts at
  the defaults.
- Q: When a build change leaves the assumed cargo or fuel above what the ship can now carry, what
  happens to that assumption? → A: The case cannot arise. Load is a choice among the package's three
  named states — maximum single jump, unladen and laden — not an enterable cargo or fuel quantity.
- Q: After a module change, what should a statistic's change from its previous value be measured
  against, and how long should that indication stay on screen? → A: Against the immediately
  preceding build state, and it stands until the next build change. _(Withdrawn 2026-08-16: the
  application presents no comparison of any kind, so there is no baseline to choose. See FR-004.)_
- Q: Does the application compare a build against anything — a saved version, a pinned baseline, the
  state before the last edit? → A: No. Comparison is not a capability of this application. A figure
  describes the active build as it is now, and nothing else, so FR-004's change indication is
  withdrawn along with the side-by-side comparison feature 001 and this specification already ruled
  out. A Commander judging a change makes it and reads the result.
- Q: The package names its three load states; how are they labelled so a Commander is not left
  guessing what each assumes? → A: The package's name, plus a fixed plain-language gloss of the load
  it stands for — "maximum jump (one jump's fuel, empty hold)", "unladen (full tank, empty hold)",
  "laden (full tank, full hold)". The gloss explains the name; it never replaces it, and no state may
  be labelled with a word the package uses for a different one.
- Q: On what hardware should the 100 ms recompute budget be verified? → A: The slowest supported
  target — a throttled mobile CPU profile, which desktop and tablet then inherit.

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
2. **Given** a change has been made, **When** the Commander looks at the statistics, **Then** they
   describe the build as it now stands, with no figure carrying a comparison against an earlier
   state, a saved version or any other build.
3. **Given** modules are disabled or assigned to priority groups, **When** statistics are computed,
   **Then** the contributions of disabled modules are excluded from every figure the package computes
   without them, and the module remains visible as disabled rather than omitted. Where the package
   reports a figure that counts a module the build cannot power regardless — a shield generator in an
   unpowered priority group, whose strength the package still reports in full — that state is shown
   beside the figure under FR-001b rather than subtracted from it.

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

A Commander checks jump range laden before committing to a trade run, puts four pips into SYS to see
what their shields really resist, and deploys hardpoints to see what the power plant does about it.

**Why this priority**: Viewing conditions are the one input a Commander changes constantly without
changing the ship. Getting their semantics right — that they never become part of the build — is
what keeps a saved or shared build meaning one thing.

**Independent Test**: Switch between the named load states, vary the pip allocation and the
hardpoint state, and confirm the dependent figures recompute consistently, the independent ones do
not move, and none of the three is written into the build when it is saved, shared or exported.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander selects a different load state, **Then** every
   figure that depends on load recomputes for that state and names the state it used, using the
   package's name for it.
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
6. **Given** viewing conditions have been varied, **When** the page is reloaded, a new tab is
   opened, or a working build is restored in a later session, **Then** the conditions begin again at
   the application's defaults rather than the ones last in force.

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
- A diagnostic the package reports: its English sentence is for logs, and the application composes and
  translates its own wording from the diagnostic's code and parameters. It never displays the
  package's sentence as though it were translated, and never parses that sentence to recover the slot
  or module it names — those are separate fields.
- A diagnostic whose code the application has no wording for: the code and the slot it names are shown
  rather than nothing, so an unhandled diagnostic is still actionable, and the missing wording is a
  defect in this application rather than in the package.

## Requirements _(mandatory)_

### Functional Requirements

#### A build to report on

- **FR-000**: Every statistic in this family describes the active build, so the family MUST require
  one. Where no build is active the application MUST NOT present a statistic, a breakdown or a
  headline set; it MUST NOT substitute a hull's catalogue characteristics for them; and it MUST NOT
  create a build in order to have something to report on. A Commander arrives at an active build
  through [feature 001](../001-ship-selection-and-loading/spec.md) — choosing a hull from the
  catalogue (its FR-011), reopening a saved or working build (its FR-023, FR-023f), or opening a
  build link (its FR-027, FR-027a) — or by importing one under
  [feature 004](../004-slef-export/spec.md)'s FR-006. No area of this family offers a route of its
  own. Every area specification inherits this requirement without restating it.

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
- **FR-004**: _(Withdrawn 2026-08-16.)_ Comparison is not a capability of this application, so no
  statistic carries a change indication. A figure reports the active build as it now stands: not
  against the state before the last edit, not against the version last saved, not against a pinned
  baseline, and not against another build. This closes the gap between the side-by-side comparison
  this specification and feature 001 already ruled out and the per-figure delta that had survived it —
  both are the same capability at different scales, and neither is offered. Making a change and
  reading the result is how a Commander judges it.
- **FR-005**: Resistances MUST be presented as percentages, converted from the package's fractional
  values.
- **FR-006**: Every figure the package reports as unavailable, incomplete or absent MUST be
  surfaced as such together with the reason the package gives for it, and MUST NOT be shown as zero or
  an estimate.
- **FR-007**: Build validity and completeness problems MUST be listed in plain language, naming the
  area and the slot each belongs to, and MUST NOT suppress the statistics that can still be
  computed.
- **FR-007a**: The wording of a package diagnostic is this application's to write and to translate,
  composed from the diagnostic's stable code and the parameters it carries, and MUST go through the
  localisation layer like any other string the application owns. The package's own English sentence
  MUST NOT be displayed — it is documented as being for logs — and MUST NOT be parsed to recover the
  slot, module or constraint it mentions, each of which the diagnostic reports as its own field. This
  is the settled division of responsibility, not a gap: game **text** is asked of the package under
  constitution principle VI, while diagnostic **wording** is composed here from what the package
  reports. A diagnostic carrying a code this application has no wording for MUST still show that code
  and the slot it names rather than nothing.

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

- **FR-012**: The Commander MUST be able to select the load a figure is computed for, and see
  dependent statistics recompute. The choice is among the load states the package names — the
  maximum single jump (one jump's fuel, no cargo), unladen (full tank, empty hold) and laden (full
  tank, full hold) — under the package's own names for them. Cargo and fuel MUST NOT be enterable as
  arbitrary quantities, the application MUST NOT introduce a name for a load state the package
  already names, and MUST NOT apply one of those names to a different state. Until the Commander
  selects one, the unladen state applies.
- **FR-012a**: Each load state MUST be labelled with the package's name for it and a fixed
  plain-language gloss of the load that name stands for: **maximum jump** — one jump's fuel, empty
  hold; **unladen** — full tank, empty hold; **laden** — full tank, full hold. The gloss explains the
  name and MUST NOT replace it, MUST be the same wherever that state appears, and MUST NOT be
  elaborated per area. This is what FR-012's prohibition is for in practice: "unladen" and "laden"
  are ordinary English words a Commander will otherwise read as meaning empty and full of anything,
  and the state most easily mislabelled is the maximum single jump, which carries fuel for one jump
  rather than none.
- **FR-013**: The Commander MUST be able to allocate pips across the three capacitors, and the
  allocation MUST be constrained to what the game permits. Until the Commander allocates them, every
  pip-dependent figure MUST be computed under the game's balanced allocation — two pips to each of
  SYS, ENG and WEP — and MUST state it under FR-015 like any other allocation.
- **FR-014**: The Commander MUST be able to select the hardpoint state — retracted or deployed —
  under which state-dependent figures are reported. Until they select one, the deployed state
  applies, that being the state a build's power draw has to fit, and it MUST be stated under FR-015
  like any other condition.
- **FR-015**: The current load state, pip allocation and hardpoint state MUST be shown
  alongside every statistic computed under them, and any statistic that depends on one MUST state
  the value it assumes.
- **FR-016**: Load state, pip allocation and hardpoint state are viewing conditions, not part
  of the build. They MUST NOT alter any statistic that does not depend on them, MUST NOT be
  persisted into the build, and MUST NOT be saved with it, carried in a build link or exported.
- **FR-016a**: Viewing conditions MUST NOT be persisted anywhere else either — not as a browser
  preference, not per tab, and not against the working build feature 001's FR-023a autosaves. Every
  page load, every new tab and every restored working build MUST begin at the application's default
  conditions, so the same build reads the same way for every Commander who opens it.
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
- **FR-024**: The viewing-condition controls — load state, pip allocation and hardpoint state
  — MUST be operable by touch, with targets large enough to hit reliably on a phone, and MUST NOT
  depend on hover.

### Testing Requirements

- **FR-025**: The rules in this specification MUST be unit-tested against known builds: the
  fraction-to-percentage conversion, the unavailable, absent, incomplete and invalid cases, the
  requirement that a viewing condition changes only the figures that depend on it, and that no figure
  in any area carries a comparison against an earlier build state, a saved build or another build
  (FR-004).
- **FR-025a**: Diagnostic presentation MUST be unit-tested to assert that every displayed sentence is
  composed from the diagnostic's code and parameters through the localisation layer, that no
  package-owned English sentence reaches the screen, that none is parsed to recover a field the
  diagnostic already carries, and that a code with no wording still yields the code and its slot.
- **FR-026**: The headline set MUST be unit-tested for completeness and for the unavailable case, so
  that a figure the package cannot produce is never silently dropped from it.
- **FR-027**: Each user story's primary journey MUST have a Playwright end-to-end test that runs
  against desktop, tablet and mobile viewports, in Chromium and in Firefox.

### Key Entities

- **Statistic**: A named, computed figure about the build, with a unit, the assumptions it was
  computed under where relevant, and either a value or a reason it is unavailable.
- **Headline set**: The figures a Commander reads at a glance, each a route to the area breakdown
  behind it.
- **Load assumption**: Which of the package's named load states — the maximum single jump, unladen
  or laden — a figure is computed for, carrying the fixed gloss FR-012a fixes for that name. A
  discrete selection, never an entered cargo or fuel quantity. A viewing condition, not part of the
  build.
- **Pip allocation**: How the Commander has distributed the distributor's pips across systems,
  engines and weapons. A viewing condition, not part of the build.
- **Hardpoint state**: Retracted or deployed — the condition under which a state-dependent figure is
  reported. Not a property of the build.
- **Validation report**: The package's assessment of whether the build is valid and operationally
  complete, and what is missing.

## Upstream dependencies

Every figure this specification's family needs is computed by
`@elite-dangerous-almanac/core@0.1.0-beta.10`, verified against the installed package on 2026-08-16.
**No figure in any of the five areas is blocked.** The four exceptions recorded here at beta.4 are all
settled: WEP pip-to-recharge scaling (feature 007) landed at beta.5; the number of jumps a full tank
affords (feature 008) landed at beta.5 and the total at one jump's fuel that survived it at beta.9;
the Frame Shift Drive's mass curve (feature 008) turned out not to be a gap, because a drive has no
three-point curve and the package computes the mass factor the jump equation actually uses; and the
distributor's pip-scaled recharge for all three capacitors (feature 005) landed at beta.9. Several
areas compose figures under FR-001a; each names what it composes in its own "Upstream dependencies"
section.

**The family's last gap closed in `0.1.0-beta.10`.** The package's shield cell bank pool used to count
every fitted bank whether or not it was powered, unlike the shield metrics beside it, which report
nothing for a generator that is switched off; feature 006's FR-009 handled that by flagging the
unpowered bank within the package's pool, because FR-001a does not permit subtracting its
contribution here. It was filed as
[Elite-Dangerous-Almanac#281](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/281),
fixed the same day, and released in `0.1.0-beta.10`, which the application now consumes. The pool
counts only powered banks and reports each fitted bank's own power state, so FR-009 presents the
package's figure directly rather than qualifying a misleading one, and feature 006 gained FR-008a to
keep a computed zero pool distinct from a build that carries no banks. **No figure in any of the five
areas is blocked, and none is waiting on an upstream release.**

**The diagnostics locale is settled, and the settlement puts the wording here.** The validity,
completeness and edit-error messages FR-006 and FR-007 surface remain English-only at beta.10 and are
documented as such — `LoadoutIssue.message` and `LoadoutEditError.message` are for logs. What the
upstream request
([Elite-Dangerous-Almanac#245](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/245),
closed) delivered instead is the machine-readable half: every diagnostic carries a stable `code`, the
`params` it interpolates, and where applicable the `constraint` that produced it, so a consumer
composes and translates the sentence itself. So the constitution's "ask for a locale there" rule is
satisfied for game **text** — hull, module, blueprint, effect and, as of beta.9, material names all
come from the package — while diagnostic **wording** is this application's to write and to translate,
from the package's codes and parameters and never by parsing its English. This is a settled division
of responsibility rather than an outstanding request, and it is what FR-007's "plain language"
obligation rests on.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Every displayed figure, in every area, matches the value computed by
  `@elite-dangerous-almanac/core` for the same build and the same viewing conditions — zero
  divergence across a corpus of reference builds.
- **SC-002**: Statistics reflect a build change within 100 ms, with no manual refresh.
- **SC-003**: Changing the pip allocation, the load state or the hardpoint state updates every
  dependent figure within 100 ms, and leaves every independent figure unchanged.
- **SC-003a**: The 100 ms budgets in SC-002 and SC-003 are measured on the slowest supported target —
  a throttled mobile processor profile, not the machine the suite happens to run on — and cover the
  interval from the Commander's input to the updated figure being on screen. Desktop and tablet
  inherit the budget rather than carrying one of their own. Emulating a mobile viewport at
  desktop processor speed does not verify it.
- **SC-004**: For every figure the package reports as unavailable, absent or incomplete, the
  application shows it as such with a reason — zero fabricated zeroes and zero locally derived
  substitutes, verified across a corpus covering each kind of gap the package can report: an
  unresolved slot, an unknown power draw, an unpriced module and a build missing a mandatory module.
- **SC-005**: Every figure carries its unit and its load, pip and hardpoint-state assumptions — no
  unlabelled numbers, in any area.
- **SC-006**: A Commander can reach the breakdown behind any headline figure in one interaction.
- **SC-007**: No viewing condition survives a save, a build link, a SLEF export, a page reload or a
  new session — zero leakage into the build across the round-trip corpus, and zero carry-over
  between loads.
- **SC-008**: Every statistic is readable, every breakdown reachable and every diagnostic legible on
  desktop, tablet and mobile viewports — the same end-to-end suite passes on all three, with no
  horizontal page scrolling at any of them.
- **SC-009**: With no build active, no figure from any area of this family is reachable by any route
  — zero statistics shown, zero breakdowns opened, and zero builds created as a side effect of
  asking for one.

## Assumptions

- Statistic definitions, units and edge-case semantics are the package's; this application presents
  them rather than reinterpreting them.
- This specification is a contract, not a screen. It fixes what every figure must obey and what the
  headline set must contain; which figures are prominent and how the areas are laid out are decided
  at plan time against the design system, per constitution principle VII.
- The area specifications are independently deliverable. A Commander with only this specification
  and one area has a coherent product; the contract does not require all five areas to exist before
  any of them is useful.
- The default pip allocation is the game's balanced two-two-two, the state a ship undocks in, so a
  Commander who allocates nothing reads the build in the condition they will actually fly it. It
  follows that the pip-dependent figures — the shield resistances, effective hit points and recovery
  durations feature 006 reports, and the speeds feature 008 reports — differ by default from the
  zero-pip and four-pip figures an outfitting screen or a comparable tool headlines. That is a
  deliberate choice of a flyable default over cross-tool parity; FR-015 makes the allocation visible
  beside every figure computed under it, so the difference is legible rather than surprising. Shield
  strength itself does not depend on the allocation, so it carries no such convention.
- The load assumption is a choice among the three states the package already names, not a cargo or
  fuel quantity the Commander types in. A discrete selection cannot outrun the build's capacity, so
  no clamping rule is needed when a refit shrinks the hold or the tank; a build with no cargo
  capacity simply reads the same laden as unladen, which feature 008 already requires.
- The default load assumption is unladen — a full fuel tank and an empty cargo hold, the state a ship
  leaves a station in.
- The default hardpoint state is deployed, that being the state a build's power draw has to fit, so a
  Commander reads the demanding case first and asks for the retracted one. FR-014 states it, and
  [feature 005](../005-power-and-heat/spec.md)'s FR-001 reports every power figure under it. An
  earlier draft of this assumption said retracted, which contradicted FR-014 rather than qualifying
  it; the deployed default is the settled answer.
- Constraining pip entry to the game's rule — six pips across three capacitors, at most four to any
  one, in half-pip steps — is input validation on a control, not a game calculation. If the package
  later exposes the rule, the application defers to it.
- Comparison is out of scope in every form the application could offer it: two builds side by side,
  a build against the version last saved, a build against the state before the last edit, and two
  _hulls_ before a build exists (feature 001's withdrawn FR-010). This family reports the active
  build as it now stands. FR-004 records the withdrawal of the last of those, which had survived
  earlier drafts as a per-figure delta.
- The stored problem count feature 001's FR-023j keeps against a saved build is not a statistic in
  this family and does not weaken FR-000. It is a fact recorded on the record when it was written,
  read back from storage like the build's name or its last-modified time; no build is activated and
  nothing is computed to produce it.
- An active build is a precondition of this family, not a state it manages. How a Commander arrives
  at one, how it is replaced and what confirmation that replacement needs belong to feature 001;
  FR-000 only requires that no figure here exists without one.
- Responsiveness, touch support, accessibility and translatability are behavioural requirements in
  scope now, and how they are met is fixed by
  [feature 011](../011-interface-foundations/spec.md), which every feature inherits as it inherits
  the constitution. Nothing visual is deferred: the design system is defined in this repository
  alongside the behaviour it presents (constitution principle VII).
