# Specification Quality Checklist: Power and Heat

**Purpose**: Validate specification completeness and quality before proceeding to planning

**Created**: 2026-08-14

**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`.
- **This is an area of the statistics family.** [Feature 003](../../003-ship-statistics/spec.md) is
  the contract: provenance, units, the honesty rules for unavailable figures, the recompute
  obligation and the viewing conditions apply here without being restated. This document adds only
  what is specific to power, the distributor and heat.
- **One figure is blocked.** Every figure was re-verified against the installed
  `@elite-dangerous-almanac/core@0.1.0-beta.8` on 2026-08-16. Only the engines capacitor's recharge
  at the pip allocation in force is unavailable: the package applies its non-linear pip curve for
  the weapons capacitor and states that the systems capacitor shares it, but says nothing about ENG,
  and FR-008a declines to assert a game rule the package has not stated. Four figures are composed
  under feature 003's FR-001a — the retracted headroom and utilisation, the powered and unpowered
  shares of the draw, the modules a shed priority group takes offline, and the cell bank activation
  heat state — and the Upstream dependencies section names all four.
- **Heat capacity is not a budget.** The package is explicit that heat capacity is thermal inertia,
  governing how long a build takes to reach a temperature, while thermal load against hull heat
  dissipation is what decides whether it overheats. An earlier draft framed the heat figures against
  capacity and never required dissipation at all; FR-010 now requires both and states which does
  what.
- **An unknown heat contribution is more dangerous than an unknown power draw.** An unknown draw
  makes a power total a lower bound (FR-004); an unknown heat contribution makes every heat figure a
  projection that is wrong in either direction, including the overheat verdict. FR-013 carries the
  stronger obligation for that reason.
- **User story 2 is new to this family.** The ranked by-module power breakdown was implicit in
  feature 003's requirement that per-module draw be reachable. It is stated as its own story here
  because resolving a deficit is a distinct Commander need from detecting one, and because every
  figure it needs — each module's own draw — is already a package value, so no arithmetic is
  involved.
- **The WEP capacitor is deliberately split across two specifications.** Its capacity and recharge
  are the distributor's, specified here; how quickly a given loadout drains it belongs to
  [feature 007](../../007-offence-profile/spec.md), which composes them with the weapons' draw. That
  composition was blocked on WEP pip scaling; `0.1.0-beta.8` closes it, so feature 007's own
  Upstream dependencies section needs re-checking against the installed version.
- **The cell bank activation heat state crosses into feature 006.** FR-011b models the worst
  activation a build can perform as a heat state of its own. Each bank's own heat cost, spin-up and
  duration remain [feature 006](../../006-defence-profile/spec.md)'s to present; what is specified
  here is only what an activation does to the build's temperature. Heat sinks are excluded outright
  under FR-011c — the package models no negative load — and the exclusion is stated on screen rather
  than left for a Commander to discover.

## Amended 2026-08-16 (design review)

The notes above describe the specification as it stood on 2026-08-14. Four heat requirements were
withdrawn or narrowed on 2026-08-16 and the notes that rest on them no longer hold:

- **FR-011b is withdrawn**, so there is no composed cell bank activation heat state. The fourth
  composition named above is gone, and nothing in this area composes a heat figure at all. A bank's
  own activation heat remains feature 006's to present.
- **FR-011c is withdrawn**, so the heat-sink exclusion is recorded in the specification's Assumptions
  rather than stated beside every overheat verdict.
- **FR-010 no longer requires the hull's heat capacity.** The note above is still true about what
  capacity means; the requirement now shows dissipation alone, because with the time-to-overheat
  figures dropped there is nothing left for capacity to qualify.
- **FR-012 and FR-012b no longer show the time to reach an overheat.** Whether a state overheats is
  the verdict; when it does is not presented.

## Amended 2026-08-16 (`0.1.0-beta.9` upgrade)

- **Nothing in this area is blocked any more.** The note above headed "One figure is blocked" is
  superseded. `0.1.0-beta.9` publishes
  `ShipLoadout.distributorMetrics({ systemsPips, enginesPips, weaponsPips })`, which applies the
  package's own pip curve to all three capacitors and returns each one's capacity, rated four-pip
  recharge and actual rate at the allocation given. The engines rate FR-008a reported as unavailable
  is now shown on the same terms as the other two, and the systems rate no longer has to be obtained
  by handing the SYS rating to the weapons-capacitor calculation. That closes
  [Elite-Dangerous-Almanac#271](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/271).
- **Two compositions remain, not four.** The count in the superseded note was already stale — the
  cell bank activation state went with FR-011b, and the ENG rate was never a composition but a
  blocked figure. What this area composes under feature 003's FR-001a is the retracted headroom and
  utilisation, the powered and unpowered shares of the draw, and the modules a shed priority group
  takes offline; the Upstream dependencies section names those three.
- **FR-009 now covers the powered state as well as the absent one.** The package returns no
  distributor metrics for a build whose distributor is switched off, shed by the retracted power
  budget, or unresolvable, so those states are reported as unavailable naming the state rather than
  shown with catalogue capacities.
- **Feature 007's re-check is done.** The note above asked for it. Both accessors agree on the WEP
  recharge rate at the same allocation, verified against the installed package; feature 007 continues
  to read firing endurance from `weaponsCapacitorMetrics`, which additionally applies the deployed
  power budget.
