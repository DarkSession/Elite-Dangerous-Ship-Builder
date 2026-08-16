# Feature Specification: Defence Profile

**Feature Branch**: `006-defence-profile`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "We want to show [...] shield and armour details, show resistances,
show module protection, shield recharge details, shield cell bank capacity."

## Scope

This specification covers everything the application reports about a build's **survivability**: how
much shield it carries and where that strength comes from, how it resists each damage type, how it
recovers once broken, how much punishment the hull absorbs after that, and how well the modules
inside are protected.

It is one area of the statistics family. [Feature 003](../003-ship-statistics/spec.md) is the
contract every figure here obeys — the requirement that a build be active at all (its FR-000),
provenance, units, the honesty rules for unavailable figures, the recompute obligation, and the
viewing conditions. Everything it states applies here without being restated, and nothing here
relaxes it. Nothing in this area is offered for a build whose hull the package cannot resolve:
armour, hardness and module protection are all measured from the hull, so an unresolved hull leaves
nothing to report. The pip allocation is a viewing condition owned by feature 003; this feature
specifies what SYS pips do to the figures.

How hard the build hits belongs to [feature 007](../007-offence-profile/spec.md). The two areas
divide armour penetration between them: the hull's hardness — what an attacker's fire is measured
against — is a property of the ship being built and is reported here, while a weapon's own piercing
rating is a property of what the build fires and is reported there. Neither repeats the other.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Read the full defence profile (Priority: P1)

A Commander weighing two shield fits, loading each in turn, needs more than a single strength
number: where the strength comes from, how it resists each damage type, and how much punishment the
hull takes once shields drop.

**Why this priority**: Defence is half of every combat build decision, and an aggregated figure
cannot answer "which of these two fits survives a plasma accelerator". The package already computes
the whole breakdown.

**Independent Test**: Load a shielded, engineered build and confirm the shield strength breakdown,
per-damage-type resistances and effective hit points, and the armour breakdown with its resistances,
are all shown and match the package's figures for that build.

**Acceptance Scenarios**:

1. **Given** a build with a shield generator, **When** the Commander views its defences, **Then**
   total shield strength is shown alongside the contributions that make it up — generator, boosters
   and reinforcement — together with the mass-curve and boost multipliers applied.
2. **Given** shield resistances, **When** the Commander views them, **Then** a resistance percentage
   and an effective hit-point figure are shown for each damage type the package reports, including
   caustic.
3. **Given** a build's armour, **When** the Commander views it, **Then** total armour hit points are
   shown with the bulkhead and hull-reinforcement contributions, plus a resistance percentage and
   effective hit points per damage type.
4. **Given** a build with no shield generator, **When** the Commander views the defence profile,
   **Then** the shield figures are reported as absent — not as zero strength — and the armour
   figures are still shown in full.
5. **Given** a pip allocation, **When** the Commander changes the SYS pips, **Then** shield
   resistances and effective hit points recompute for that allocation, and the figures state which
   allocation they assume.

---

### User Story 2 - Survive the gap: recovery and cell banks (Priority: P2)

A Commander who has lost their shields wants to know how long they will be without them, and how
much of that gap their shield cell banks can cover.

**Why this priority**: Recovery time decides whether a fight is survivable, and cell banks are the
standard answer to it.

**Independent Test**: Load a build with a shield generator and at least one cell bank and confirm
the regeneration rates, the time to recover from broken shields, and the total cell bank pool are
shown for that build.

**Acceptance Scenarios**:

1. **Given** a build with a shield generator, **When** the Commander views shield recovery, **Then**
   the regeneration rate, the broken-shield regeneration rate, the time from collapse to the
   threshold at which shields come back up, and the time from that threshold to full strength are
   each shown as their own figure, the two durations stating the SYS allocation they assume.
2. **Given** a build with shield cell banks fitted, **When** the Commander views them, **Then** the
   total restorable shield strength across the banks that are powered is shown on that basis,
   together with the number of cells available, and each bank's spin-up time, duration and heat cost
   whether or not it is powered.
3. **Given** a build with no cell banks, **When** the Commander views shield recovery, **Then** the
   application says the build carries no cell banks rather than showing a zero pool.
4. **Given** a cell bank that is disabled or sits in an unpowered priority group, **When** the
   Commander views the cell bank pool, **Then** the pool is shown as the package reports it —
   excluding that bank — and the bank is still listed and identified as not ready in the current
   power state.
5. **Given** a build whose cell banks are all disabled or unpowered, **When** the Commander views
   the cell bank pool, **Then** the pool reads as zero for a build that carries banks it cannot draw
   on, worded so it cannot be mistaken for scenario 3's build that carries none.

---

### User Story 3 - What protects the modules inside (Priority: P2)

A Commander who keeps losing their power plant to a well-aimed shot wants to see what stands between
incoming fire and the modules: how hard the hull is, how much module damage it soaks, and what
proportion of it reaches the module at all.

**Why this priority**: Hull hit points describe how long the ship survives; these figures describe
whether it is still able to fight while it does. A Commander cannot tell module reinforcement from
hull reinforcement without them.

**Independent Test**: Load a build with module reinforcement packages fitted and confirm hull
hardness and the build's module protection are each shown as their own figure, and that a build with
no module reinforcement says so rather than reporting no protection.

**Acceptance Scenarios**:

1. **Given** module reinforcement packages are fitted, **When** the Commander views the defence
   profile, **Then** the module protection they provide — the pool of module damage absorbed and the
   proportion of it stopped — is shown as its own figures, distinct from armour hit points and never
   labelled as the build's integrity.
2. **Given** a build with no module reinforcement, **When** the Commander views these figures,
   **Then** their absence is reported as absence rather than as zero protection.
3. **Given** an active build, **When** the Commander views the defence profile, **Then** the hull's
   hardness is shown, identified as the figure an attacker's armour piercing is measured against.
4. **Given** a build whose bulkheads have been changed, **When** the Commander views the profile,
   **Then** the bulkhead in force is identified alongside the armour it contributes.

---

### Edge Cases

- A build with shields but zero resistance to a damage type: shown as 0%, distinct from a build with
  no shields at all, where the figure is absent.
- A resistance the package reports as negative — a bulkhead that is worse than bare hull against a
  damage type: shown as the negative percentage it is, never clamped to zero.
- Pips allocated entirely to SYS on a build with no shield generator: the allocation is accepted,
  and the defence figures still report that there are no shields.
- A shield generator switched off: the package reports no shield metrics for it, so the figures are
  unavailable and say so. A generator that is enabled but sits in a priority group the plant cannot
  power is different — the package still reports full strength for it, so the application shows that
  figure with the unpowered state flagged beside it rather than overriding it, under feature 003's
  FR-001b.
- Shield recovery at a SYS allocation that cannot sustain regeneration — at zero SYS pips, for
  instance: the package still reports both regeneration rates normally, and reports both recovery
  durations as infinite. The rates are shown as usual; each infinite duration is stated as the
  verdict it is — the shield does not come back at this allocation — rather than as a zero, a blank,
  an infinite number, or a figure the package could not produce.
- A resistance of 100% or better against a damage type: the package reports the effective hit points
  for it as infinite. That is a verdict and not a missing figure — nothing of that type gets through
  — and it is stated as such rather than as a number, a blank or an unavailable figure.
- Cell banks of mixed classes and ratings fitted together: the pool is the total across those that
  are powered, on FR-009's basis, and every fitted bank's own figures remain individually
  inspectable whether or not it contributes to that total.
- A cell bank whose spin-up, duration or heat the catalogue does not carry: that bank is named as
  incomplete rather than contributing a silent zero to the pool.
- A build with a shield generator whose mass curve puts the hull outside its optimal range: the
  multiplier that results is shown as part of the strength breakdown rather than folded invisibly
  into the total.
- Guardian and reactive contributions that resist some damage types and worsen others: each
  contribution is shown with its own effect, not averaged into a single figure.
- A build the package cannot resolve to a known hull: no defence profile is presented for it at all.
  The package reports the unresolved hull as a validity problem and computes zero armour hit points
  and zero resistances around it, and those zeroes are an artefact of the unresolved hull rather
  than a defenceless ship. The area is withheld entire — the shield, recovery and cell-bank figures
  included, computable though they remain — because a defence profile assembled around a hull the
  application cannot name would mislead more than it informs. The Commander is told the hull is
  unresolved, with the package's reason, instead.
- A per-damage-type table on a phone: it stays legible and scrolls within its own container rather
  than forcing the page sideways.

## Requirements _(mandatory)_

### Functional Requirements

#### Shields

- **FR-001**: The application MUST display total shield strength together with its generator,
  booster and reinforcement contributions and the mass-curve and boost multipliers applied.
- **FR-002**: The application MUST display shield resistance as a percentage and effective hit
  points for every damage type the package reports, including caustic. Where the package reports a
  damage type's effective hit points as infinite — its answer at a resistance of 100% or better —
  the application MUST state that as the verdict it is, that nothing of that type gets through, and
  MUST NOT present it as a number, a blank or an unavailable figure.
- **FR-003**: A build with no shield generator MUST have its shield figures reported as absent, not
  as zero strength, and MUST still show its armour figures in full.
- **FR-004**: Changing the SYS pip allocation MUST recompute shield resistances, effective hit
  points and the recovery durations FR-006 requires, and every figure so computed MUST state the
  allocation it assumes.
- **FR-005**: A resistance the package reports as negative MUST be displayed as negative. The
  application MUST NOT clamp, floor or otherwise adjust a resistance value.

#### Shield recovery and cell banks

- **FR-006**: The application MUST display the shield regeneration rate, the broken-shield
  regeneration rate, and the two recovery phases the package reports as the distinct figures they
  are: the time from collapse to the threshold at which the shield comes back up, and the time from
  that threshold to full strength. Each phase MUST identify the rate that governs it — the broken
  rate up to the threshold, the ordinary rate beyond it. The threshold itself MUST NOT be quoted as
  a proportion of the shield: the package reports the two durations and the two rates but not the
  fraction at which protection returns, and naming one here would be a game rule this application
  does not own. The application MUST NOT present the two durations' sum as a single collapse-to-full
  figure: the package does not report it, and it would bury the figure that matters — when
  protection comes back. Where the package reports a recovery duration as infinite, regeneration
  being unsustainable at the allocation in force, the application MUST state that as the verdict it
  is — the shield does not come back at this allocation — and MUST NOT present it as a zero, a
  blank, an infinite number or an unavailable figure.
- **FR-007**: The application MUST display shield cell bank capacity for the build — the total
  restorable shield strength and the number of cells available, both counting the banks that are
  powered, on the basis FR-009 states — together with each fitted bank's spin-up time, duration and
  heat cost, which are properties of the bank and are shown whether or not it is powered.
- **FR-008**: A build with no cell banks MUST be reported as carrying none, rather than shown with a
  zero pool.
- **FR-008a**: A build that carries cell banks of which none are powered MUST NOT be reported as
  carrying none. Its pool is a zero the package computed, not an absence, and the two states are
  distinguishable in the package's own report — one lists no banks at all, the other lists banks
  that are not ready. The application MUST distinguish them, so that a Commander who has fitted a
  bank and cannot draw on it is told which of the two situations they are in.
- **FR-009**: A cell bank that is disabled or unpowered in the current power state MUST be shown as
  such alongside the pool. The package's pool counts only the banks that are powered in the deployed
  state, and reports every fitted bank individually with its own power state, so the application
  MUST present both: the pool as reported, and each fitted bank that is not contributing to it. It
  MUST NOT recompute the pool in either direction — neither adding an unpowered bank's strength back
  into it nor removing a powered bank's — because either would be a total the package did not
  compute.

#### Armour and the modules behind it

- **FR-010**: The application MUST display total armour hit points together with the bulkhead and
  hull-reinforcement contributions, and armour resistance as a percentage and effective hit points
  per damage type, under FR-002's rule for an effective hit-point figure the package reports as
  infinite.
- **FR-011**: The application MUST identify the bulkhead in force alongside the armour it
  contributes.
- **FR-012**: The application MUST display the build-level module protection the package reports —
  the pool of module damage the build's reinforcement absorbs, and the proportion of incoming module
  damage it stops — as figures distinct from armour hit points, and MUST report their absence as
  absence rather than as zero protection. The application MUST NOT label either "integrity":
  integrity is an individual module's own health, shown with that module under [feature
  002](../002-module-outfitting/spec.md)'s FR-002, and a build carries no single integrity figure.
- **FR-013**: The application MUST display the hull's hardness, identified as the figure an
  attacker's armour piercing is measured against. Hardness is a property of the ship being built and
  belongs here; a weapon's own piercing rating is a property of what the build fires and belongs to
  [feature 007](../007-offence-profile/spec.md)'s FR-005. Neither area repeats the other's figure.

### Device Requirements

- **FR-014**: The per-damage-type tables for shields and armour, and the per-bank cell figures, MUST
  be fully readable on desktop, tablet and mobile, in both portrait and landscape, scrolling within
  their own container rather than widening the page.
- **FR-015**: A contribution behind an aggregate — a booster, a reinforcement package, a cell bank —
  MUST be a route to the slot it is fitted in, taking the Commander to that slot in [feature
  002](../002-module-outfitting/spec.md)'s slot enumeration ready to edit, by touch as well as by
  pointer and keyboard. Naming the slot without offering the route does not satisfy this
  requirement.

### Testing Requirements

- **FR-016**: Shield and armour presentation MUST be unit-tested against known builds, including the
  no-shield, no-cell-bank, negative-resistance, total-resistance, switched-off-generator,
  unpowered-generator, unpowered-cell-bank, all-banks-unpowered, unresolved-hull and
  no-recovery-at-this-allocation cases, asserting for the all-banks-unpowered case that its zero
  pool is presented distinctly from the no-cell-bank build's absent one (FR-008a), asserting that no
  recovery figure states the threshold as a proportion of shield strength (FR-006), asserting for
  the unresolved-hull case that no defence figure of any kind is presented — not the armour group
  alone — and for the two infinite cases, total resistance and no recovery at this allocation, that
  each infinite figure reads as a verdict rather than as a number, a zero, a blank or an unavailable
  figure, the regeneration rates still being shown alongside the latter.
- **FR-017**: The pip-dependent shield figures MUST be unit-tested at several SYS allocations,
  asserting that every figure states the allocation it was computed under.
- **FR-018**: Contribution breakdowns MUST be unit-tested to sum to the totals the package reports,
  so a contribution can never be shown that the total does not account for.
- **FR-019**: Each user story's primary journey MUST have a Playwright end-to-end test that runs
  against desktop, tablet and mobile viewports, in Chromium and in Firefox.

### Key Entities

- **Defence profile**: Shield strength with its contributions, armour with its contributions,
  resistances and effective hit points per damage type, the build's module protection, regeneration
  rates and cell bank capacity.
- **Shield contribution**: One source of shield strength — the generator, a booster, a reinforcement
  — with the amount it adds and the slot it comes from.
- **Resistance**: One damage type's resistance percentage and the effective hit points that follow
  from it, for a stated pip allocation.
- **Cell bank**: One fitted shield cell bank, with its restorable strength, cell count, spin-up
  time, duration, heat cost and current power state.

## Upstream dependencies

**No figure this area presents is blocked.** `@elite-dangerous-almanac/core` computes the shield and
armour breakdowns, per-damage-type resistances and effective hit points, module protection and hull
hardness. `shieldRecovery` reports the regeneration rate, the broken-shield regeneration rate and
the two recovery phases FR-006 requires, and `cellBanks` aggregates the fitted banks into a total
restorable strength and cell count while keeping each bank's reinforcement, spin-up, duration, heat
and power state individually inspectable.

The cell bank pool is power-aware: it counts only the banks that are powered with hardpoints
deployed, and carries each fitted bank's own power state. On an Anaconda with one class 5, C-rated
bank, the pool reports 714 restorable across 4 cells while the bank is powered and 0 across 0 once
it is disabled, with the bank still listed and marked as unpowered; switching the power plant off
instead produces the same zero pool with the bank likewise marked. That is what FR-009 presents
directly and what FR-008a keeps distinct from a build carrying no banks.

**Composed under feature 003's FR-001a**, naming what is combined and from which package figures:

1. **Telling a build with no cell banks from one whose banks are all unpowered (FR-008, FR-008a)** —
   the package reports the same zero pool and zero cells for both, and the difference is whether its
   list of fitted banks is empty. Counting entries in a collection it returns is what FR-001a
   permits; no total is recomputed, which FR-009 forbids in both directions. Reporting an absent
   module protection as absent rather than as the zero the package computes (FR-012) is **not** on
   that list: the package reports the figure as a scalar with no collection behind it, so the
   absence is read from the build's own fitted modules. That is feature 003's FR-001b, which needs
   no declaration.

**The recovery threshold is not published, and FR-006 is written around that.** `shieldRecovery`
carries `regenRate`, `brokenRegenRate`, `recoveryTime` and `regenTime` and no threshold field, and
no export or constant carries the fraction of shield strength at which protection returns; the 50%
the package applies internally is documented in its prose only. Quoting the figure from
documentation rather than from data would be stating a game rule, which constitution principle II
forbids. FR-006 therefore requires the two phases and their governing rates, and forbids quoting the
proportion at all. Raising it upstream is left open deliberately: nothing here is blocked by the
absence, the durations carry the information a Commander acts on, and no request is open for it.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Every defence figure matches the value `@elite-dangerous-almanac/core` computes for
  the same build and the same pip allocation — zero divergence across the reference corpus.
- **SC-002**: A Commander can read the active build's survivability against any stated damage type —
  its resistance and the effective hit points that follow from it — directly from the displayed
  figures, without performing any arithmetic.
- **SC-003**: Shield strength equals the sum of the contributions displayed for it, for every build
  in the corpus — zero unexplained strength and zero contribution the total does not account for.
- **SC-004**: For every build with no shields, no cell banks or no module reinforcement, the
  affected figures read as absent — zero fabricated zeroes across the corpus. For every build that
  carries cell banks none of which are powered, the pool reads as a zero the build earned rather
  than as an absence — zero builds across the corpus where the two are worded the same way.
- **SC-005**: Changing SYS pips updates every pip-dependent defence figure within 100 ms, and each
  updated figure states the allocation it assumes.
- **SC-006**: The full defence profile is readable and every breakdown reachable on desktop, tablet
  and mobile viewports — the same end-to-end suite passes on all three, with no horizontal page
  scrolling at any of them.

## Assumptions

- Resistance stacking, diminishing returns and the mass curve are the package's calculations. The
  application shows the multipliers the package applied; it does not reproduce the curve.
- "Effective hit points" is the package's figure for a damage type, not a local product of strength
  and resistance.
- Module protection is the build-level figure, and it is what module reinforcement buys. The package
  reports it as a pool of absorbed module damage together with the proportion of incoming module
  damage it stops; both are shown, because they answer different questions — how much, and how much
  of it.
- **Integrity is per module, never per build.** How much damage one module absorbs before it fails
  is an attribute of that module, shown with it under feature 002's FR-002. A build-level figure
  labelled "integrity" describes nothing: there is no pool of integrity, and using the word for the
  module-protection pool invites a Commander to read a module attribute as a ship-wide one.
- Modelling damage against another ship's specific defences — time to kill, engagement simulation —
  is out of scope, as it is in feature 007.
- Comparing two builds side by side is out of scope here exactly as it is in feature 003. This
  feature is answerable for figures a Commander needs no arithmetic to weigh, not for a surface that
  weighs two builds for them.
- Which figures are prominent and how the per-damage-type tables are laid out are decided at plan
  time against the design system, per constitution principle VII.
