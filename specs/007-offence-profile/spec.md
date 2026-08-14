# Feature Specification: Offence Profile

**Feature Branch**: `007-offence-profile`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "We want to show damage detail, split by type." Extended after a design
review on 2026-08-14 with the two figures a Commander needs to judge a loadout in a fight: output at
the range they engage at, and how long the weapons capacitor sustains it.

## Scope

This specification covers everything the application reports about a build's **firepower**: how much
damage it puts out, of which types, what it sustains rather than bursts, what each weapon does on
its own, how that output falls away with range, and how long the weapons capacitor keeps it up.

It is one area of the statistics family. [Feature 003](../003-ship-statistics/spec.md) is the
contract every figure here obeys — provenance, units, the honesty rules for unavailable figures, the
recompute obligation, and the viewing conditions. Everything it states applies here without being
restated, and nothing here relaxes it.

The distributor's capacities and recharge rates belong to
[feature 005](../005-power-and-heat/spec.md), as does the heat that firing produces; this feature
composes them into what a Commander can actually sustain. The hull hardness a weapon's piercing is
measured against belongs to [feature 006](../006-defence-profile/spec.md). Where the build's fire
physically converges — a question about where the mounts sit rather than what they fire — belongs to
[feature 010](../010-hull-anatomy/spec.md).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Read the full offence profile, split by damage type (Priority: P1)

A Commander fitting a mixed loadout needs to see how much of their output is kinetic, thermal,
explosive, absolute and anti-xeno, what they can actually sustain, and what it costs in distributor
energy and heat.

**Why this priority**: A single damage-per-second number hides the decision. Damage type against a
target's resistances is what determines whether a loadout works, and it is the figure every
reference tool leads with.

**Independent Test**: Load a build with weapons of at least two damage types and confirm per-weapon
and whole-build figures are shown, each split by damage type, with burst and sustained values
distinguished and ammunition-limited sustained output stated.

**Acceptance Scenarios**:

1. **Given** a build with weapons fitted, **When** the Commander views its offence, **Then**
   whole-build damage per second is shown split by damage type, with burst and sustained figures
   distinguished and each labelled, and with anti-xeno damage shown under its own label as an overlay
   rather than as a slice of the conventional total.
2. **Given** the offence profile, **When** the Commander opens a single weapon, **Then** that
   weapon's damage per shot, rate of fire, sustained rate of fire, damage by type, energy per
   second, heat per second, power draw and ammunition capacity are shown.
3. **Given** a weapon with a limited magazine, **When** its sustained figures are shown, **Then**
   the ammunition limit is stated as the reason sustained output differs from burst output, and a
   weapon with unlimited ammunition says so.
4. **Given** a weapon whose catalogue entry carries range and armour-piercing figures, **When** the
   Commander views it, **Then** maximum range, falloff range and armour piercing are shown, and
   armour piercing is presented against the hull hardness of the ship being built.
5. **Given** a disabled weapon, **When** whole-build offence is computed, **Then** its contribution
   is excluded and it is shown as disabled rather than omitted.
6. **Given** the whole-build damage split, **When** the Commander reads it, **Then** each
   partitioning damage type's share of the total is legible directly, without the Commander
   performing any arithmetic, and anti-xeno is not among those shares.

---

### User Story 2 - Judge output at the range you actually fight at (Priority: P2)

A Commander choosing between a rail gun fit and a multi-cannon fit wants to know what each one does
at 500 m and at 2 km, because the answer reverses between the two.

**Why this priority**: Peak damage per second is quoted at point-blank range, which is not where most
engagements happen. A loadout that wins on paper and loses at engagement range is the specific
mistake this figure prevents. It is P2 because story 1's figures decide most builds; this one decides
the close ones.

**Independent Test**: Load a build with weapons of differing falloff characteristics and confirm the
build's output is reported at several ranges spanning those weapons, each figure stating the range it
assumes, with weapons beyond their maximum range identified as contributing nothing.

**Acceptance Scenarios**:

1. **Given** a build with weapons fitted, **When** the Commander views output by range, **Then**
   damage per second is shown at a set of ranges spanning the ranges the build's weapons cover, and
   each figure states the range it was computed at.
2. **Given** output by range, **When** a weapon is beyond its maximum range at the range shown,
   **Then** it is identified as contributing nothing at that range rather than silently dropping out
   of the total.
3. **Given** a weapon whose catalogue entry carries no range or falloff data, **When** output by
   range is shown, **Then** that weapon is named and the totals are qualified rather than treating
   its output as constant at every range.
4. **Given** a build whose weapons all share one falloff profile, **When** output by range is shown,
   **Then** the figures still state their ranges rather than collapsing to a single unlabelled
   number.

---

### User Story 3 - Know how long you can hold the trigger (Priority: P2)

A Commander with four beam lasers wants to know whether their distributor sustains them, and if not,
how many seconds of continuous fire they get before the weapons capacitor runs dry.

**Why this priority**: Sustained damage per second assumes the capacitor keeps up. When it does not
— which is the normal case for energy weapons — the figure a Commander actually plans around is how
long they can fire, and no other statistic expresses it.

**Independent Test**: Load a build whose weapons draw more than the distributor's weapons recharge
and confirm the endurance figure is reported for it, and that a build which sustains its fire
indefinitely is identified as such rather than given a duration.

**Acceptance Scenarios**:

1. **Given** a build whose weapons draw more from the weapons capacitor than it recharges, **When**
   the Commander views the offence profile, **Then** the duration of continuous fire the capacitor
   supports is shown, together with the draw and the recharge that produce it.
2. **Given** a build whose weapons draw no more than the capacitor recharges, **When** the Commander
   views the same figure, **Then** the build is identified as able to fire indefinitely rather than
   being given a duration.
3. **Given** a pip allocation, **When** the Commander changes the WEP pips, **Then** the endurance
   figure states the allocation it assumes, and is reported as unavailable for any allocation other
   than the distributor's rated one while the package exposes no pip-to-recharge scaling.
4. **Given** a build with no distributor fitted, **When** the Commander views endurance, **Then** it
   is reported as unavailable with that reason rather than computed against a zero capacitor.

---

### Edge Cases

- Guardian and anti-xeno weapons whose damage falls outside the four standard types: the anti-xeno
  and unclassified components are shown under their own labels rather than folded into absolute
  damage. Anti-xeno is an overlay on conventional damage rather than a partition of it, so a build's
  shares can be read without them summing to include it.
- A weapon with fractional or continuous fire (beam lasers): burst and sustained figures are still
  distinguished, and the continuous nature of the weapon is stated.
- A build with no weapons at all: the offence figures are reported as absent rather than as zero
  damage, and the build is not described as having a damage profile.
- Every weapon disabled: the whole-build totals report zero output with the reason, distinct from a
  build carrying no weapons.
- A weapon whose armour piercing exceeds the hull's hardness: the figure shows that it pierces
  fully, rather than being reported as a ratio above one.
- A build the package cannot resolve to a known hull: armour piercing is shown as the weapon's own
  rating with the comparison reported as unavailable, never scaled against an assumed hardness. Every
  hull in the catalogue carries a hardness, so this arises from an unresolved hull rather than from a
  gap in the catalogue.
- Mixed gimballed, fixed and turreted mounts: each weapon's own figures stand, and the whole-build
  total does not assume every weapon is on target at once — the assumption it does make is stated.
- A weapon whose ammunition is exhausted in the sustained calculation: the sustained figure states
  the magazine and reload behind it rather than presenting an average with no explanation.
- The per-weapon table on a phone: it stays legible and scrolls within its own container rather than
  forcing the page sideways.

## Requirements _(mandatory)_

### Functional Requirements

#### Whole-build and per-weapon output

- **FR-001**: The application MUST display whole-build damage per second split by damage type —
  kinetic, thermal, explosive, absolute and, where the package reports it, unclassified — with burst
  and sustained figures distinguished and labelled. Anti-xeno damage MUST also be displayed, under
  its own label and identified as an overlay.
- **FR-002**: The application MUST display each damage type's share of the whole-build total, so the
  balance of a mixed loadout is readable without arithmetic. Shares MUST be taken over the
  partitioning types only. Anti-xeno damage overlays conventional damage rather than partitioning it,
  so it MUST NOT be given a share of a total it is not part of; it is shown as its own figure
  alongside the split.
- **FR-003**: The application MUST display, per weapon, damage per shot, rate of fire, sustained
  rate of fire, damage by type, energy per second, heat per second, power draw and ammunition
  capacity.
- **FR-004**: The application MUST state, for each weapon, whether sustained output is limited by
  ammunition and MUST identify weapons with unlimited ammunition as such.
- **FR-005**: The application MUST display each weapon's maximum range, falloff range and armour
  piercing where the catalogue carries them, and MUST present armour piercing against the hull
  hardness of the ship being built.
- **FR-006**: Disabled weapons MUST be excluded from whole-build offence totals and shown as
  disabled rather than omitted from the per-weapon list.
- **FR-007**: A build carrying no weapons MUST have its offence figures reported as absent rather
  than as zero damage.

#### Output at range

- **FR-008**: The application MUST display the build's damage per second at a set of ranges spanning
  the ranges its weapons cover, each figure stating the range it was computed at.
- **FR-009**: Damage at a range MUST be composed from the package's own figures — a weapon's damage
  and the attenuation the package reports for that weapon at that range. The application MUST NOT
  model falloff itself, interpolate a curve of its own, or apply an attenuation to a weapon the
  package reports no falloff data for.
- **FR-010**: A weapon that contributes nothing at a given range, because it is beyond its maximum
  range, MUST be identified as such at that range rather than silently dropping out of the total.
- **FR-011**: A weapon whose range or falloff data the catalogue does not carry MUST be named, and
  totals that include it MUST be qualified rather than assuming its output is constant with range.

#### Weapons capacitor endurance

- **FR-012**: The application MUST display how long the build can fire continuously before the
  weapons capacitor is exhausted, together with the capacitor draw and the recharge rate that
  produce it.
- **FR-013**: A build whose weapons draw no more than the weapons capacitor recharges MUST be
  identified as able to fire indefinitely, rather than shown with a duration.
- **FR-014**: The endurance figure MUST be composed from the package's own figures — the weapons'
  capacitor draw and the distributor's weapons capacity and recharge rate. The application MUST NOT
  substitute a draw or a recharge rate of its own, and MUST NOT model capacitor behaviour beyond
  that composition.
- **FR-015**: The endurance figure MUST state the WEP pip allocation it assumes. Recomputing it for
  an allocation other than the distributor's rated one requires the pip-to-recharge scaling, which
  is a game rule the application MUST NOT infer. Until the package exposes that scaling, endurance
  is reported at the rated allocation and other allocations are reported as unavailable.
- **FR-016**: A build with no distributor fitted MUST have its endurance reported as unavailable
  with that reason, rather than computed against a zero capacitor.

### Device Requirements

- **FR-017**: The per-weapon table, the damage-type split and the output-by-range figures MUST be
  fully readable on desktop, tablet and mobile, in both portrait and landscape, scrolling within
  their own container rather than widening the page.
- **FR-018**: A weapon in the offence profile MUST lead to the hardpoint it is fitted in, by touch
  as well as by pointer and keyboard.

### Testing Requirements

- **FR-019**: Whole-build and per-weapon presentation MUST be unit-tested against known builds,
  including mixed damage types, anti-xeno and unclassified components, continuous-fire weapons,
  disabled weapons, a build with no weapons, and the unresolved-hull case. The damage-share test MUST
  assert that the partitioning types sum to the whole and that anti-xeno is excluded from that sum.
- **FR-020**: Output by range MUST be unit-tested across weapons with differing falloff profiles,
  including the beyond-maximum-range and missing-range-data cases, asserting that every attenuation
  applied is one the package reported.
- **FR-021**: Capacitor endurance MUST be unit-tested for the sustaining, non-sustaining and
  no-distributor cases, and for the unavailability of allocations other than the rated one.
- **FR-022**: Each user story's primary journey MUST have a Playwright end-to-end test that runs
  against desktop, tablet and mobile viewports.

### Key Entities

- **Offence profile**: Whole-build and per-weapon output split by damage type, with burst and
  sustained figures, energy and heat cost, ammunition, range and armour piercing.
- **Damage split**: One build's or one weapon's output apportioned across the damage types the
  package reports, each with its share of the total.
- **Range point**: One range, and the build's output at it, with the weapons that contribute nothing
  at that range identified.
- **Capacitor endurance**: How long the build sustains continuous fire for a stated WEP pip
  allocation, or the fact that it sustains indefinitely.

## Upstream dependencies

Everything this specification requires is available from `@elite-dangerous-almanac/core@0.1.0-beta.4`
today, verified against the installed package on 2026-08-14, with one exception noted below.

User story 1 is directly supported: whole-build and per-weapon metrics, the damage split by type,
burst and sustained output, ammunition limits, range and falloff data, and armour piercing against a
hull's hardness.

**Composed under feature 003's FR-001a**, naming what is combined, from which package figures, and
under which of that requirement's permitted operations.

Each damage type's **share** (FR-002) divides that type's reported amount by the sum of the
partitioning amounts the package reports — it publishes the amounts, not the proportions. **Output at
range** (FR-008) applies a factor the package reports to a figure it reports, then adds the results.
**Endurance** (FR-012) compares the weapons' reported draw against the distributor's reported
recharge, and divides the reported capacity by the shortfall between them. All of these are operations
FR-001a permits; none supplies a term the package did not report, and none reproduces an algorithm it
performs. For the two range and endurance figures:
`damageFalloff(weapon, metres)` reports how much of a weapon's damage still lands at a range, and
`energyPerSecond(weapon)` reports its capacitor draw against the distributor's weapons capacity and
recharge — a comparison the package's own documentation invites. Combining those with the damage and
capacity figures the package already computes restates no game rule, and every input remains the
package's. FR-009 and FR-014 bound what that composition may do, and both forbid modelling any
behaviour the package does not report.

**One gap remains and is raised upstream: WEP pip scaling.** The package is pip-aware for SYS
(`shieldRecovery` takes `systemsPips`) and for ENG (`mobilityMetrics` interpolates between the hull's
zero-pip and four-pip endpoints), but the distributor exposes `weaponsRecharge` as a single rated
figure with no pip parameter, and no hull endpoints exist for it. How recharge scales with WEP pips is
therefore a game rule this application would have to invent. FR-015 states the consequence: endurance
is reported at the rated allocation, and other allocations are reported as unavailable under feature
003's FR-006 until the scaling lands.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Every offence figure matches the value `@elite-dangerous-almanac/core` computes for the
  same build — zero divergence across the reference corpus.
- **SC-002**: For a build with weapons of more than one damage type, the share of output contributed
  by each partitioning damage type is readable directly, without the Commander performing any
  arithmetic, and those shares sum to the whole — anti-xeno never appears among them.
- **SC-003**: A Commander can determine which of two loadouts does more damage at a stated range in
  one interaction.
- **SC-004**: No falloff curve, capacitor model or pip-scaling rule is implemented in this
  application — every damage-at-range and endurance figure composes package figures only, asserted
  by tests that fail if a game rule appears here.
- **SC-005**: Every weapon the package reports as contributing nothing — disabled, out of range, out
  of ammunition — is visible with its reason rather than absent from the list, across the corpus.
- **SC-006**: The full offence profile is readable and every per-weapon breakdown reachable on
  desktop, tablet and mobile viewports — the same end-to-end suite passes on all three, with no
  horizontal page scrolling at any of them.

## Assumptions

- Damage-type coverage is whatever the package reports. Unclassified damage is a partitioning
  component the package reports only when non-zero; anti-xeno overlays conventional damage instead of
  partitioning it, which is why FR-002 keeps it out of the shares. Neither is folded into an existing
  type.
- Armour piercing is presented against the hull hardness of the ship being built. Modelling damage
  against another ship's specific defences — time to kill, engagement simulation — is out of scope.
- Whole-build totals assume every weapon is firing. Whether a Commander can actually bring every
  mount to bear is a question about mount geometry, which feature 010 answers; this feature states
  the assumption rather than adjusting the total for it.
- The set of ranges output is reported at is chosen to span the build's own weapons rather than
  being a fixed list, so a short-range fit is not reported entirely at ranges none of its weapons
  reach.
- Ammunition and reload behaviour are the package's; the application does not model a magazine
  cycle of its own.
- Which figures are prominent and how the per-weapon table and the range figures are laid out are
  decided at plan time against the design system, per constitution principle VII.
