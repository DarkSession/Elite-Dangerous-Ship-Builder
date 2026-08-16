# Feature Specification: Offence Profile

**Feature Branch**: `007-offence-profile`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "We want to show damage detail, split by type." Extended after a design
review on 2026-08-14 with the two figures a Commander needs to judge a loadout in a fight: output at
the range they engage at, and how long the weapons capacitor sustains it. Extended again on
2026-08-14 with shot convergence (user story 4, FR-016a to FR-016f), reassigned here from
[feature 010](../010-hull-anatomy/spec.md) during that feature's clarification: where a build's fire
arrives is a property of what it fires, while where each mount sits stays with feature 010.

## Scope

This specification covers everything the application reports about a build's **firepower**: how much
damage it puts out, of which types, what it sustains rather than bursts, what each weapon does on
its own, how that output falls away with range, and how long the weapons capacitor keeps it up.

It is one area of the statistics family. [Feature 003](../003-ship-statistics/spec.md) is the
contract every figure here obeys — the requirement that a build be active at all (its FR-000),
provenance, units, the honesty rules for unavailable figures, the recompute obligation, and the
viewing conditions. Everything it states applies here without being restated, and nothing here
relaxes it. Nothing in this area is offered before a hull is chosen.

The distributor's capacities and recharge rates belong to
[feature 005](../005-power-and-heat/spec.md), as does the heat that firing produces; what this
feature reports is how long that capacitor holds a build's fire up, which the package computes
whole. The hull hardness a weapon's piercing is measured against belongs to
[feature 006](../006-defence-profile/spec.md).

Where the build's fire physically converges belongs here, as a property of what the build fires.
Where a mount is drawn on a hull's schematic belongs to [feature 010](../010-hull-anatomy/spec.md),
and this feature states nothing about how a mount is drawn or located there. The two rest on
different records: feature 010 draws the schematics' own slot keys, while convergence reads the
package's separate catalogue of mount offsets in metres. Neither is derived from the other, and
nothing here measures artwork.

## Clarifications

### Session 2026-08-16

- Q: Now that the package computes weapons-capacitor endurance at any WEP pip allocation, should the
  endurance figure follow the pips the Commander has set rather than being reported only at the rated
  four-pip figure? → A: Follow the pips in force, at any allocation. The capability landed upstream:
  `weaponsCapacitorMetrics({ weaponsPips })` returns the actual recharge rate, the net drain and the
  seconds to drain at the allocation asked for, applying the pip curve the package owns. Endurance is
  therefore read from that accessor at the pips in force and states the allocation it assumes.
  FR-015's unavailability for allocations other than the rated one is withdrawn as satisfied
  upstream, and this area now matches [feature 005](../005-power-and-heat/spec.md), which reports
  every capacitor figure at the pips in force. Endurance also stops being a composition: the package
  computes it whole, so composing capacity against a shortfall here would reimplement a calculation
  it provides.
- Q: Should "the spread of the arriving shots" be how wide the fire looks from the cockpit at the
  chosen range — an angle that tightens with distance — rather than a distance in metres between the
  impact points? → A: Yes, angular, and illustrated with a plot. The package models fixed weapons as
  firing straight ahead from mounts offset in metres from the cockpit, so the metre gap between
  impacts is the same at 500 m as at 4 km; only the angle it subtends changes. Reporting metres would
  leave FR-016b recomputing a figure that cannot move. The spread is therefore reported as an angle
  at the chosen range, the fixed metre separation is presented as the geometry behind it rather than
  as a range-dependent figure, and FR-016f adds a plot of where each mount's fire arrives relative to
  the centre of the Commander's view — the figures remain readable without it, per principle V. This
  also closes the block: mount geometry in real units landed upstream at `0.1.0-beta.8` as a
  catalogue of cockpit-relative offsets, independent of the schematics feature 010 draws.
- Q: Should the target range a Commander picks for convergence be the same control that reports the
  build's damage at that range? → A: No — two controls, of two different kinds. Damage at range is a
  chart at five fixed ranges: 500 m, 1,000 m, 1,500 m, 2,000 m and 3,000 m, identical for every build
  so that two loadouts read against the same scale, replacing the per-build spanning set an earlier
  draft assumed. Convergence takes a slider the Commander sweeps continuously, because the question
  there is where the spread becomes acceptable rather than what happens at five stops. Both remain
  under principle V: the chart's figures are readable without the chart, and the slider works by
  touch and by keyboard.
- Q: Should the spread and the plot be built from fixed weapons only, with gimballed and turreted
  mounts listed as tracking the target instead of being given an arrival point? → A: No — every
  weapon is treated as fixed. A fitted, enabled weapon contributes its mount's offset whatever its
  type, and none is excluded, re-aimed or discounted for tracking. The consequence is recorded rather
  than hidden: a gimballed or turreted weapon does track a locked target in game, so such a build
  spreads less in practice than the figures say, and FR-016c requires the fixed-geometry assumption
  to be stated with them. That keeps the figures inside what the package models — its geometry is
  fixed, ship-forward and models no tracking — where excluding those mounts or drawing them converged
  would not.
- Q: When a build has no distributor — none fitted, or one the power plant has shed — should
  endurance read as a verdict rather than as an unavailable figure? → A: As a verdict, matching
  [feature 005](../005-power-and-heat/spec.md) and
  [feature 006](../006-defence-profile/spec.md). The package answers this case definitively — with no
  powered distributor, capacity and recharge are zero and it returns zero seconds — so the figure
  reads as no sustained fire at all, with the reason, and "unavailable" stays reserved for figures
  the package cannot produce. The clarification also settles what FR-016 never covered: endurance
  follows the deployed power state the package applies, so a shed distributor or a shed weapon is
  accounted for the same way, and a module whose draw the package could not resolve is assumed
  powered and said to be.

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
   Commander views it, **Then** maximum range, falloff range and armour piercing are shown, with
   piercing identified as the rating measured against a target's hull hardness.
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
build's output is charted at 500 m, 1,000 m, 1,500 m, 2,000 m and 3,000 m, each figure stating the
range it assumes, with weapons beyond their maximum range identified as contributing nothing.

**Acceptance Scenarios**:

1. **Given** a build with weapons fitted, **When** the Commander views output by range, **Then**
   damage per second is charted at 500 m, 1,000 m, 1,500 m, 2,000 m and 3,000 m, and each figure
   states the range it was computed at.
2. **Given** output by range, **When** a weapon is beyond its maximum range at the range shown,
   **Then** it is identified as contributing nothing at that range rather than silently dropping out
   of the total.
3. **Given** a weapon whose catalogue entry carries no range or falloff data, **When** output by
   range is shown, **Then** that weapon is named and the totals are qualified rather than treating
   its output as constant at every range.
4. **Given** a build whose weapons all share one falloff profile, **When** output by range is shown,
   **Then** the figures still state their ranges rather than collapsing to a single unlabelled
   number.
5. **Given** a build whose weapons reach well beyond 3,000 m, **When** output by range is shown,
   **Then** the chart still stops at 3,000 m, and the reach the chart does not cover is evident from
   each weapon's stated maximum range rather than being implied to be zero.

---

### User Story 3 - Know how long you can hold the trigger (Priority: P2)

A Commander with four beam lasers wants to know whether their distributor sustains them, and if not,
how many seconds of continuous fire they get before the weapons capacitor runs dry.

**Why this priority**: Sustained damage per second assumes the capacitor keeps up. When it does not
— which is the normal case for energy weapons — the figure a Commander actually plans around is how
long they can fire, and no other statistic expresses it.

**Independent Test**: Load a build whose weapons draw more than the distributor's weapons recharge
and confirm the endurance figure is reported for it at the WEP allocation in force and changes when
that allocation does, that a build which sustains its fire indefinitely is identified as such rather
than given a duration, and that a build with no powered distributor reads as no sustained fire at
all.

**Acceptance Scenarios**:

1. **Given** a build whose weapons draw more from the weapons capacitor than it recharges, **When**
   the Commander views the offence profile, **Then** the duration of continuous fire the capacitor
   supports is shown, together with the draw and the recharge that produce it.
2. **Given** a build whose weapons draw no more than the capacitor recharges, **When** the Commander
   views the same figure, **Then** the build is identified as able to fire indefinitely rather than
   being given a duration.
3. **Given** a pip allocation, **When** the Commander changes the WEP pips, **Then** the endurance
   figure recomputes at that allocation and states the allocation it assumes, together with the
   recharge rate the allocation produces.
4. **Given** a build with no distributor fitted, or one the power plant has shed, **When** the
   Commander views endurance, **Then** it reads as no sustained fire at all, with that reason, rather
   than as an unavailable figure.

---

### User Story 4 - Read where the build's fire converges (Priority: P2)

A Commander with mounts spread across a large hull wants to know how far apart their shots arrive at
the range they engage at, because a wide spread is what makes a fixed loadout miss.

**Why this priority**: Convergence is the one offence property that is a consequence of where the
mounts sit rather than what they fire, and it is invisible in every list-based view. It is P2 because
it refines a loadout rather than deciding it.

**Independent Test**: Load a build with hardpoints on opposite extremes of the hull and confirm the
spread is reported as an angle at a chosen target range, alongside a plot of where each mount's fire
arrives, that both tighten as the range is increased, and that every figure states the range it
assumes.

**Acceptance Scenarios**:

1. **Given** a build with weapons fitted, **When** the Commander views convergence at a chosen target
   range, **Then** how wide the fire spreads at that range is reported as an angle, together with the
   mount that sits furthest from the centre line, and every figure states the range it assumes.
2. **Given** the convergence figures, **When** the Commander increases the target range, **Then** the
   angular figures tighten and continue to state the range they assume, while the separation in
   metres between the mounts is unchanged and is presented as the fixed geometry it is.
3. **Given** the convergence figures, **When** the Commander reads them, **Then** a plot shows where
   each included mount's fire arrives relative to the centre of the Commander's view at that range,
   and it recomputes with the target range.
4. **Given** a build with gimballed, turreted and fixed mounts, **When** the Commander views
   convergence, **Then** every one of them contributes its offset to the spread and to the plot, each
   point shows the mount type it belongs to, and the figures state that they assume fixed,
   ship-forward fire.
5. **Given** an empty hardpoint or a disabled weapon, **When** convergence is computed, **Then** it
   contributes nothing and is identified as excluded rather than silently omitted.
6. **Given** a hull the mount-geometry catalogue does not cover, **When** the Commander views
   convergence, **Then** the figures and the plot are reported as unavailable with that reason, and
   no figure is measured off a schematic.

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
- A build the package cannot resolve to a known hull: every weapon's armour piercing is still shown,
  because it is the weapon's own rating and does not depend on the hull. What is unavailable is the
  build's own hardness, which feature 006 reports and withholds for an unresolved hull.
- Mixed gimballed, fixed and turreted mounts: each weapon's own figures stand, and the whole-build
  total does not assume every weapon is on target at once — the assumption it does make is stated.
- A build whose weapons are all gimballed or turreted: convergence still reports a spread, computed
  as though every mount fired straight ahead, and says so — it is the worst case before any tracking,
  not a claim that these weapons miss by that much.
- A weapon whose ammunition is exhausted in the sustained calculation: the sustained figure states
  the magazine and reload behind it rather than presenting an average with no explanation.
- The per-weapon table on a phone: it stays legible and scrolls within its own container rather than
  forcing the page sideways.
- Convergence requested on a build with a single weapon: the spread is reported as zero with that
  reason, distinct from a build whose spread could not be computed. How far that one mount sits from
  the centre line is still reported, because a lone off-centre mount still misses.
- Convergence requested on a build with no weapons: reported as absent rather than as a zero spread.
- The convergence plot on a phone: it stays legible at the same target ranges as on desktop rather
  than being dropped or reduced to a decoration, and the figures behind it remain readable on their
  own.

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
  piercing where the catalogue carries them. Armour piercing MUST be identified as the rating that is
  measured against a target's hull hardness, and MUST be shown as the weapon's own rating — the
  figure the catalogue carries — rather than as a comparison. The hardness of the ship being built is
  reported by [feature 006](../006-defence-profile/spec.md)'s FR-013, where it describes that ship's
  own defence; this area MUST NOT restate it beside every weapon. The two figures answer different
  questions, and a Commander reading their build's offence is not reading it against their own hull.
- **FR-006**: Disabled weapons MUST be excluded from whole-build offence totals and shown as
  disabled rather than omitted from the per-weapon list.
- **FR-007**: A build carrying no weapons MUST have its offence figures reported as absent rather
  than as zero damage.

#### Output at range

- **FR-008**: The application MUST display the build's damage per second at a fixed set of five
  ranges — 500 m, 1,000 m, 1,500 m, 2,000 m and 3,000 m — as a chart, with each figure stating the
  range it was computed at. The set does not vary with the build. The chart MUST NOT be the only
  route to the figures: each range's damage MUST also be readable as a stated figure for a Commander
  who cannot use the chart.
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
- **FR-012a**: Endurance MUST be reported under the deployed power state, as the package computes
  it: a weapon or distributor the plant sheds contributes nothing. Where a fitted module's power draw
  is unresolved, the package assumes it powered, and the endurance figure MUST say so rather than
  presenting the result as settled.
- **FR-013**: A build whose weapons draw no more than the weapons capacitor recharges MUST be
  identified as able to fire indefinitely, rather than shown with a duration.
- **FR-014**: The endurance figure MUST be the one `@elite-dangerous-almanac/core` computes for the
  build at the allocation asked for. The application MUST NOT compose it from a capacity and a
  shortfall of its own, substitute a draw or a recharge rate, or model capacitor behaviour the
  package does not report.
- **FR-015**: The endurance figure MUST be reported at the WEP pip allocation in force, MUST state
  that allocation, and MUST recompute when the Commander changes it. The pip-to-recharge curve is
  the package's, applied by it; the application MUST NOT scale a recharge rate itself.
- **FR-016**: A build with no powered distributor — none fitted, or one the power plant has shed —
  MUST have its endurance reported as a verdict: no sustained fire at all, with the reason. It MUST
  NOT be reported as unavailable, which is reserved for figures the package cannot produce.

#### Shot convergence

- **FR-016a**: The application MUST display, for the weapons of the active build at a chosen target
  range, how widely the build's fire spreads at that range — as an angle — and which mount sits
  furthest from the centre line, each figure stating the range it assumes.
- **FR-016b**: The Commander MUST be able to sweep the target range continuously — a slider, not a
  fixed set of stops — across the ranges the build's weapons reach, and every angular convergence
  figure and the plot MUST recompute as it moves. Convergence's range is its own; it is independent
  of FR-008's fixed chart ranges. The separation between the mounts themselves is fixed geometry and
  does not vary with range; where it is shown, it MUST be presented as such rather than as a figure
  the slider moves.
- **FR-016c**: Convergence MUST treat every mount as fixed, ship-forward geometry: a fitted, enabled
  weapon contributes its mount's offset to the spread and to the plot whatever its mount type. No
  mount is excluded, re-aimed or discounted for gimbal or turret tracking. Each mount's type MUST
  still be shown alongside its point, and the assumption MUST be stated with the figures in both its
  parts: that the geometry is this hull's own — each hardpoint's offset from this ship's cockpit,
  which is why the same loadout converges differently on a different hull — and that every weapon is
  treated as firing straight ahead, which is why a gimballed build's spread reads as the untracked
  worst case rather than as what a Commander will see on a locked target.
- **FR-016d**: An empty hardpoint, a disabled weapon or a mount carrying no weapon MUST be excluded
  from convergence and identified as excluded rather than silently omitted.
- **FR-016e**: Every convergence figure, and every point on the plot, MUST come from the mount
  geometry `@elite-dangerous-almanac/core` publishes in real units and from the projection it
  performs onto a target range. The application MUST NOT measure a schematic, assume a scale, convert
  drawing units into metres, or otherwise derive a physical dimension from the artwork
  [feature 010](../010-hull-anatomy/spec.md) draws. Where the catalogue does not cover the build's
  hull, every convergence figure and the plot MUST be reported as unavailable with that reason.
- **FR-016f**: The application MUST plot where each included mount's fire arrives at the chosen
  target range, relative to the centre of the Commander's view, and the plot MUST recompute with the
  range. The plot MUST NOT be the only route to the convergence figures: the same information MUST
  be readable as stated figures for a Commander who cannot use it.

### Device Requirements

- **FR-017**: The per-weapon table, the damage-type split, the output-by-range chart, the convergence
  slider and the convergence plot MUST be fully usable on desktop, tablet and mobile, in both
  portrait and landscape, scrolling within their own container rather than widening the page. The
  slider MUST be operable by touch and by keyboard, not by pointer alone.
- **FR-018**: A weapon in the offence profile MUST lead to the hardpoint it is fitted in, by touch
  as well as by pointer and keyboard.

### Testing Requirements

- **FR-019**: Whole-build and per-weapon presentation MUST be unit-tested against known builds,
  including mixed damage types, anti-xeno and unclassified components, continuous-fire weapons,
  disabled weapons, a build with no weapons, and the unresolved-hull case. The damage-share test MUST
  assert that the partitioning types sum to the whole and that anti-xeno is excluded from that sum.
- **FR-020**: Output by range MUST be unit-tested across weapons with differing falloff profiles,
  including the beyond-maximum-range and missing-range-data cases, asserting that the five charted
  ranges are the ones FR-008 fixes and that every attenuation applied is one the package reported.
- **FR-021**: Capacitor endurance MUST be unit-tested for the sustaining, non-sustaining,
  no-distributor and shed-distributor cases, and across WEP pip allocations, asserting that every
  recharge rate and duration displayed is one the package returned for that allocation, and that
  neither the zero-seconds verdict nor the fires-indefinitely verdict is presented as unavailable.
- **FR-021a**: Convergence MUST be unit-tested including the single-weapon, no-weapon,
  disabled-weapon and uncovered-hull cases, MUST assert that every fitted and enabled weapon
  contributes whatever its mount type, MUST assert that the angular figures and the plotted points
  tighten as the target range grows while the metre separation between mounts does not, and MUST
  assert that no figure is derived from a schematic's drawing units.
- **FR-022**: Each user story's primary journey MUST have a Playwright end-to-end test that runs
  against desktop, tablet and mobile viewports, in Chromium and in Firefox.

### Key Entities

- **Offence profile**: Whole-build and per-weapon output split by damage type, with burst and
  sustained figures, energy and heat cost, ammunition, range and armour piercing.
- **Damage split**: One build's or one weapon's output apportioned across the damage types the
  package reports, each with its share of the total.
- **Range point**: One range, and the build's output at it, with the weapons that contribute nothing
  at that range identified.
- **Capacitor endurance**: How long the build sustains continuous fire at a stated WEP pip
  allocation, or the fact that it sustains indefinitely, or that it cannot sustain fire at all.
- **Convergence profile**: Where the build's fire arrives at a stated target range — the angular
  spread it forms, the mount furthest from the centre line, the fixed separation between the mounts,
  and the arrival point of each included mount's fire.

## Upstream dependencies

Everything this specification requires is available from `@elite-dangerous-almanac/core@0.1.0-beta.9`
today, verified against the installed package on 2026-08-16. Nothing in this feature waits on an
upstream release. The two exceptions an earlier draft recorded against `0.1.0-beta.4` — WEP pip
scaling and mount geometry in real units — both landed in the intervening betas and are described
below as closed.

User story 1 is directly supported: whole-build and per-weapon metrics, the damage split by type,
burst and sustained output, ammunition limits, range and falloff data, and armour piercing against a
hull's hardness.

**Composed under feature 003's FR-001a**, naming what is combined, from which package figures, and
under which of that requirement's permitted operations.

Each damage type's **share** (FR-002) divides that type's reported amount by the sum of the
partitioning amounts the package reports — it publishes the amounts, not the proportions. **Output at
range** (FR-008) applies a factor the package reports to a figure it reports, then adds the results:
`damageFalloff(weapon, metres)` reports how much of a weapon's damage still lands at a range, and
combining it with the damage figures the package already computes restates no game rule. Both are
operations FR-001a permits; neither supplies a term the package did not report, and neither
reproduces an algorithm it performs. FR-009 bounds what that composition may do, forbidding any
falloff behaviour the package does not report.

**Endurance** (FR-012) is not composed. `weaponsCapacitorMetrics({ weaponsPips })` returns the whole
figure — recharge at the allocation, sustained draw, net drain and seconds to drain — so composing it
from a capacity and a shortfall here would reimplement a calculation the package provides, which
principle II prohibits.

**Shot convergence has landed and is no longer blocked.** An earlier draft recorded it as waiting
upstream, because the only mount data the package published was the schematics feature 010 draws, and
those carry no scale metadata — no metres-per-unit, no hull dimension, no coordinates in real units.
`0.1.0-beta.8` publishes a separate catalogue: `SHIP_GUNSIGHTS` gives each hardpoint's horizontal and
vertical offset from the cockpit in metres, observed in-game rather than measured off artwork,
covering all 48 hulls and 234 hardpoints, and `projectGunsight(gunsight, targetRangeMetres)` turns
those offsets into the angular figures user story 4 reports. The prohibition in FR-016e is unchanged
and still load-bearing: the offsets come from that catalogue, never from the drawings.

**WEP pip scaling has landed and no longer constrains this feature.** An earlier draft recorded it as
a gap: at `0.1.0-beta.4` the distributor exposed `weaponsRecharge` as a single rated figure with no
pip parameter, so how recharge scales with WEP pips was a game rule this application would have had
to invent. `0.1.0-beta.8` publishes `ShipLoadout.weaponsCapacitorMetrics({ weaponsPips })`, which
returns the actual recharge rate, the sustained draw, the net drain and the seconds to drain at any
allocation in `[0, 4]`, applying the package's own curve. Endurance is therefore read whole from that
accessor rather than composed here, which is why FR-014 forbids the composition an earlier draft
permitted, and no allocation is reported as unavailable.

**A second distributor accessor exists as of `0.1.0-beta.9`, and endurance does not use it.**
`ShipLoadout.distributorMetrics({ systemsPips, enginesPips, weaponsPips })` reports all three
capacitors' capacity and pip-scaled recharge, which is what [feature 005](../005-power-and-heat/spec.md)
presents. Endurance here still comes from `weaponsCapacitorMetrics`, which additionally applies the
deployed power budget and returns the sustained draw, net drain and seconds to drain that FR-012
needs. The two agree on the WEP recharge rate at the same allocation, verified against the installed
package, so there is one figure and two accessors rather than two figures — but the endurance
calculation must not be reassembled from the distributor accessor's capacity and rate, which would be
exactly the composition FR-014 forbids.

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
  application — every damage-at-range figure composes package figures only, and every endurance
  figure is the package's own, asserted by tests that fail if a game rule appears here.
- **SC-005**: Every weapon the package reports as contributing nothing — disabled, out of range, out
  of ammunition — is visible with its reason rather than absent from the list, across the corpus.
- **SC-006**: The full offence profile is readable and every per-weapon breakdown reachable on
  desktop, tablet and mobile viewports — the same end-to-end suite passes on all three, with no
  horizontal page scrolling at any of them.
- **SC-007**: No convergence figure and no plotted point is ever derived from a schematic's drawing
  units — zero measured figures, asserted by tests that fail if one appears.

## Assumptions

- Damage-type coverage is whatever the package reports. Unclassified damage is a partitioning
  component the package reports only when non-zero; anti-xeno overlays conventional damage instead of
  partitioning it, which is why FR-002 keeps it out of the shares. Neither is folded into an existing
  type.
- Armour piercing is the weapon's own rating, shown here as the catalogue carries it. Hardness is a
  property of a target, and the only target this application knows about is the ship being built,
  whose hardness feature 006 reports in its own area. Pairing every weapon with the build's own
  hardness would describe a ship shooting itself. Modelling damage against another ship's specific
  defences — time to kill, engagement simulation — is out of scope.
- Whole-build totals assume every weapon is firing and on target. Convergence (user story 4) reports
  how far apart the shots arrive; it does not adjust the totals for it, and whether a Commander can
  bring every mount to bear against a manoeuvring target is not modelled.
- Convergence describes where shots arrive, not what they hit. Modelling a target's silhouette, hit
  probability or time to kill is out of scope, as it is for armour piercing above.
- Mount geometry is the package's own catalogue of offsets in metres, observed in-game and
  independent of the schematics feature 010 draws. It is consumed as published; where an offset
  disagrees with the game, that is a library defect raised upstream under principle II, never
  corrected here.
- The geometry describes fixed, ship-forward fire. Projectile travel, target motion, the Commander's
  head-look and gimbal or turret tracking are not modelled, because the package does not model them.
- Every mount is read as fixed, whatever it carries. A gimballed or turreted weapon does track a
  locked target in game, so a build carrying them spreads less in practice than the figures say: the
  reported spread is the untracked worst case, and FR-016c requires it to be labelled as such. The
  alternative — excluding tracking mounts, or drawing them converged — would have the application
  model tracking behaviour the package explicitly does not, which principle II forbids. Reporting one
  honest, stated assumption is the deliberate trade.
- The five ranges output is charted at are fixed and identical for every build, so two loadouts can
  be read against the same scale. The trade is deliberate: a weapon that reaches past 3,000 m is not
  characterised beyond it, and a weapon that reaches none of the five is charted as contributing
  nothing at all of them under FR-010 rather than being dropped. Its own maximum range and falloff
  range are still stated per weapon under FR-005, which is where a fit outside this band is read.
- Convergence's slider spans the ranges the build's own weapons reach, since a spread at a range no
  weapon covers describes nothing. Where that span begins and ends, and what it defaults to, is
  settled at plan time against the design system.
- Ammunition and reload behaviour are the package's; the application does not model a magazine
  cycle of its own.
- Which figures are prominent, and how the per-weapon table, the range chart, the convergence plot
  and its slider are drawn and placed, are decided at plan time against the design system, per
  constitution principle VII. What this specification fixes is that those three exist, what they
  convey, and that none of them is the only route to its figures.
