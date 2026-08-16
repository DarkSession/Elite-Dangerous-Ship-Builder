# Specification Quality Checklist: Offence Profile

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
  obligation and the viewing conditions apply here without being restated.
- **Damage at a range is composed; endurance is not.** An earlier draft recorded both as waiting on
  upstream capability, reading constitution principle II to forbid combining two package figures into
  a third. That reading was too strict and was corrected on 2026-08-14: the prohibition is on
  reimplementing a calculation the package provides and on substituting a different value for one it
  computed, not on composing figures it does compute. `damageFalloff` reports how much damage still
  lands at a range, so output at range composes it with the damage figures the package computes and
  restates no game rule. Endurance stopped being a composition on 2026-08-16, when
  `weaponsCapacitorMetrics` began returning the whole figure — composing it now would reimplement a
  calculation the package provides.
- **FR-009 and FR-014 bound what the application may do.** FR-009 forbids modelling falloff the
  package does not report — inventing a curve or interpolating one. FR-014 forbids composing
  endurance at all. SC-004 makes a game rule appearing in this application detectable by test rather
  than by review, which is the line that actually matters.
- **Both gaps closed at `0.1.0-beta.5`**, verified against the installed package on 2026-08-16.
  **WEP pip scaling**: `ShipLoadout.weaponsCapacitorMetrics({ weaponsPips })` returns the actual
  recharge, net drain and seconds to drain at any allocation, applying the package's own pip curve, so
  FR-015 now reports endurance at the pips in force and nothing reads as unavailable.
  **Mount geometry in real units**: `ships/gunsights` publishes each hardpoint's horizontal and
  vertical offset from the cockpit in metres for all 48 hulls and 234 hardpoints, plus
  `projectGunsight` — an observed catalogue, independent of the schematics feature 010 draws, so
  FR-016e's prohibition on measuring artwork stands unweakened. Nothing in this feature waits on an
  upstream release.
- **The clarification session on 2026-08-16 settled four further decisions**: the spread is angular
  and tightens with range while the metre separation between mounts is fixed geometry (FR-016a,
  FR-016b); damage at range is a chart at five fixed ranges — 500 m, 1,000 m, 1,500 m, 2,000 m,
  3,000 m — while convergence takes its own continuous slider (FR-008, FR-016b); a plot shows where
  each mount's fire arrives (FR-016f); and every mount is treated as fixed, ship-forward geometry
  whatever its type, so a tracking build's reported spread is the untracked worst case and says so
  (FR-016c). Each new visual is required not to be the only route to its figures, per principle V.
- **User stories 2 and 3 came from a design review on 2026-08-14**, which found both figures present
  in the imported design and absent from every accepted specification.
- **User story 4 (shot convergence) was reassigned here from
  [feature 010](../../010-hull-anatomy/spec.md) on 2026-08-14**, during that feature's clarification.
  Where a build's fire arrives is a property of what the build fires and belongs to the offence
  profile; where each mount sits stays with feature 010, which owns the positions and publishes them.
  FR-016a to FR-016e and FR-021a are lettered so that the existing FR-017 to FR-022 keep their
  numbers.
- **Whole-build totals state an assumption rather than adjusting for it.** Whether a Commander can
  bring every mount to bear is a question about mount geometry, answered by
  [feature 010](../../010-hull-anatomy/spec.md). This specification records the assumption in its
  Assumptions section instead of discounting a total, which would be exactly the local correction
  principle II forbids.

## Amended 2026-08-16 (`0.1.0-beta.9` upgrade)

- **Re-verified against the installed `0.1.0-beta.9`.** Both gaps stay closed and nothing in this
  feature waits on an upstream release; the note above records the check at beta.8.
- **A second distributor accessor appeared and endurance deliberately ignores it.** `0.1.0-beta.9`
  adds `ShipLoadout.distributorMetrics`, which reports all three capacitors' capacity and pip-scaled
  recharge for [feature 005](../../005-power-and-heat/spec.md). Endurance here still comes whole from
  `weaponsCapacitorMetrics`, which also applies the deployed power budget. The two agree on the WEP
  rate at the same allocation, verified — so FR-014's prohibition now has a specific temptation to
  name: reassembling endurance from the distributor's capacity and rate would be the composition it
  forbids, and would additionally drop the power-budget term.
