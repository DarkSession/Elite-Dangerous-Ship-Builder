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
relaxes it. Nothing in this area is offered before a hull is chosen. In particular, the pip
allocation is a viewing condition owned by feature 003; this feature specifies what SYS pips do to
the figures.

How hard the build hits belongs to [feature 007](../007-offence-profile/spec.md), which reads the
hull hardness specified here when it presents armour piercing.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Read the full defence profile (Priority: P1)

A Commander compares two shield fits and needs more than a single strength number: where the
strength comes from, how it resists each damage type, and how much punishment the hull takes once
shields drop.

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
2. **Given** shield resistances, **When** the Commander views them, **Then** a resistance
   percentage and an effective hit-point figure are shown for each damage type the package reports,
   including caustic.
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
   total restorable shield strength across all banks is shown, together with the number of cells
   available, and each bank's spin-up time, duration and heat cost.
3. **Given** a build with no cell banks, **When** the Commander views shield recovery, **Then** the
   application says the build carries no cell banks rather than showing a zero pool.
4. **Given** a cell bank that is disabled or sits in an unpowered priority group, **When** the
   Commander views the cell bank pool, **Then** the pool is shown as the package reports it, and that
   bank is identified within it as not ready in the current power state.

---

### User Story 3 - What protects the modules inside (Priority: P2)

A Commander who keeps losing their power plant to a well-aimed shot wants to see what stands between
incoming fire and the modules: how hard the hull is, how much module damage it soaks, and what
proportion of it reaches the module at all.

**Why this priority**: Hull hit points describe how long the ship survives; these three figures
describe whether it is still able to fight while it does. A Commander cannot tell module
reinforcement from hull reinforcement without them.

**Independent Test**: Load a build with module reinforcement packages fitted and confirm hull
hardness, the module-damage pool and module protection are each shown as their own figure, and that
a build with no module reinforcement says so rather than reporting no protection.

**Acceptance Scenarios**:

1. **Given** module reinforcement packages are fitted, **When** the Commander views the defence
   profile, **Then** the module-damage pool and module protection are shown as their own figures,
   distinct from armour hit points.
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
  figure with the unpowered state flagged beside it rather than overriding it, exactly as FR-009
  requires for cell banks.
- Shield recovery at a SYS allocation that cannot sustain regeneration — the default state at zero
  SYS pips: the package still reports both regeneration rates normally, and reports both recovery
  durations as infinite. The rates are shown as usual; the two durations are reported as unavailable
  for that allocation, with the reason, rather than as zero, as a blank, or as an infinite number.
- Cell banks of mixed classes and ratings fitted together: the pool is the total across all of them,
  and per-bank figures remain individually inspectable.
- A cell bank whose spin-up, duration or heat the catalogue does not carry: that bank is named as
  incomplete rather than contributing a silent zero to the pool.
- A build with a shield generator whose mass curve puts the hull outside its optimal range: the
  multiplier that results is shown as part of the strength breakdown rather than folded invisibly
  into the total.
- Guardian and reactive contributions that resist some damage types and worsen others: each
  contribution is shown with its own effect, not averaged into a single figure.
- A build the package cannot resolve to a known hull: the package reports zero armour hit points and
  zero resistances for it, and hardness has no value at all. Those zeroes are an artefact of the
  unresolved hull, not a defenceless ship, so the armour figures are reported as unavailable with
  that reason rather than displayed as zeroes.
- A per-damage-type table on a phone: it stays legible and scrolls within its own container rather
  than forcing the page sideways.

## Requirements _(mandatory)_

### Functional Requirements

#### Shields

- **FR-001**: The application MUST display total shield strength together with its generator,
  booster and reinforcement contributions and the mass-curve and boost multipliers applied.
- **FR-002**: The application MUST display shield resistance as a percentage and effective hit
  points for every damage type the package reports, including caustic.
- **FR-003**: A build with no shield generator MUST have its shield figures reported as absent, not
  as zero strength, and MUST still show its armour figures in full.
- **FR-004**: Changing the SYS pip allocation MUST recompute shield resistances, effective hit points
  and the recovery durations FR-006 requires, and every figure so computed MUST state the allocation
  it assumes.
- **FR-005**: A resistance the package reports as negative MUST be displayed as negative. The
  application MUST NOT clamp, floor or otherwise adjust a resistance value.

#### Shield recovery and cell banks

- **FR-006**: The application MUST display the shield regeneration rate, the broken-shield
  regeneration rate, and the two recovery phases the package reports as the distinct figures they
  are: the time from collapse to the threshold at which the shield comes back up, and the time from
  that threshold to full strength. The application MUST NOT present their sum as a single
  collapse-to-full figure, which the package does not report and which would obscure the moment a
  Commander actually regains protection.
- **FR-007**: The application MUST display shield cell bank capacity for the build — the total
  restorable shield strength and the number of cells available — together with each bank's spin-up
  time, duration and heat cost.
- **FR-008**: A build with no cell banks MUST be reported as carrying none, rather than shown with a
  zero pool.
- **FR-009**: A cell bank that is disabled or unpowered in the current power state MUST be shown as
  such alongside the pool. The package's cell bank pool counts every fitted bank regardless of its
  power state, so the application MUST NOT recompute a reduced pool by removing that bank — a total
  the package did not compute. It MUST instead present the package's pool together with the fact that
  a bank within it is not ready, so the Commander is not misled about what they can actually draw on.

#### Armour and the modules behind it

- **FR-010**: The application MUST display total armour hit points together with the bulkhead and
  hull-reinforcement contributions, and armour resistance as a percentage and effective hit points
  per damage type.
- **FR-011**: The application MUST identify the bulkhead in force alongside the armour it
  contributes.
- **FR-012**: The application MUST display the module-damage pool and module protection as distinct
  figures, separate from armour hit points, and MUST report their absence as absence rather than as
  zero protection.
- **FR-013**: The application MUST display the hull's hardness, identified as the figure an
  attacker's armour piercing is measured against — the same figure feature 007 presents a weapon's
  piercing against.

### Device Requirements

- **FR-014**: The per-damage-type tables for shields and armour, and the per-bank cell figures, MUST
  be fully readable on desktop, tablet and mobile, in both portrait and landscape, scrolling within
  their own container rather than widening the page.
- **FR-015**: A contribution behind an aggregate — a booster, a reinforcement package, a cell bank —
  MUST lead to the slot it is fitted in, by touch as well as by pointer and keyboard.

### Testing Requirements

- **FR-016**: Shield and armour presentation MUST be unit-tested against known builds, including the
  no-shield, no-cell-bank, negative-resistance, switched-off-generator, unpowered-generator,
  unpowered-cell-bank, unresolved-hull and no-recovery-at-this-allocation cases, asserting for the
  last of these that the regeneration rates are still shown and that neither infinite duration is
  rendered as a number or a zero.
- **FR-017**: The pip-dependent shield figures MUST be unit-tested at several SYS allocations,
  asserting that every figure states the allocation it was computed under.
- **FR-018**: Contribution breakdowns MUST be unit-tested to sum to the totals the package reports,
  so a contribution can never be shown that the total does not account for.
- **FR-019**: Each user story's primary journey MUST have a Playwright end-to-end test that runs
  against desktop, tablet and mobile viewports.

### Key Entities

- **Defence profile**: Shield strength with its contributions, armour with its contributions,
  resistances and effective hit points per damage type, the module-damage pool and module
  protection, regeneration rates and cell bank capacity.
- **Shield contribution**: One source of shield strength — the generator, a booster, a reinforcement
  — with the amount it adds and the slot it comes from.
- **Resistance**: One damage type's resistance percentage and the effective hit points that follow
  from it, for a stated pip allocation.
- **Cell bank**: One fitted shield cell bank, with its restorable strength, cell count, spin-up
  time, duration, heat cost and current power state.

## Upstream dependencies

Verified against the installed `@elite-dangerous-almanac/core@0.1.0-beta.4` on 2026-08-14.

The shield and armour breakdowns, per-damage-type resistances, module protection and hull hardness
were available from the outset. Shield recovery and cell banks arrived in `0.1.0-beta.4`: the package
reports the regeneration rate, the broken-shield regeneration rate and the two recovery phases FR-006
requires, and aggregates the cell banks into a total restorable strength and cell count while keeping
each bank's reinforcement, spin-up, duration and heat individually inspectable.

**One gap is raised upstream: a power-aware cell bank pool (FR-009).** The package's cell bank
aggregate counts every fitted bank whether or not it is enabled or powered — unlike its shield
metrics, which already account for a generator that is switched off. So a build whose cell bank sits
in an unpowered priority group reports the same restorable pool as one whose bank is ready. Removing
that bank's contribution here would mean producing a total the package did not compute, which
feature 003's FR-001a does not permit, so FR-009 requires the bank to be flagged within the package's
pool instead. A power-aware pool upstream would let the figure itself tell the truth.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Every defence figure matches the value `@elite-dangerous-almanac/core` computes for
  the same build and the same pip allocation — zero divergence across the reference corpus.
- **SC-002**: A Commander can determine which of two shield fits survives longer against a stated
  damage type without performing any arithmetic.
- **SC-003**: Shield strength equals the sum of the contributions displayed for it, for every build
  in the corpus — zero unexplained strength and zero contribution the total does not account for.
- **SC-004**: For every build with no shields, no cell banks or no module reinforcement, the
  affected figures read as absent — zero fabricated zeroes across the corpus.
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
- The module-damage pool is the figure the package calls **module armour**. A design or a community
  tool may label it "integrity"; it is one figure under two names, not two figures, and the
  application MUST NOT present both.
- Module integrity as a per-module property — how much damage an individual module absorbs before it
  fails — is a module attribute, shown with that module under feature 002's FR-002 as one of "the
  attributes relevant to its module type", not a build-level defence figure.
- Modelling damage against another ship's specific defences — time to kill, engagement simulation —
  is out of scope, as it is in feature 007.
- Which figures are prominent and how the per-damage-type tables are laid out are decided at plan
  time against the design system, per constitution principle VII.
