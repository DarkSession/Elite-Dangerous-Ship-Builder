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
- **Damage at a range and capacitor endurance are composed, not blocked.** An earlier draft recorded
  both as waiting on upstream capability, reading constitution principle II to forbid combining two
  package figures into a third. That reading was too strict and was corrected on 2026-08-14: the
  prohibition is on reimplementing a calculation the package provides and on substituting a
  different value for one it computed, not on composing figures it does compute. `damageFalloff`
  reports how much damage still lands at a range, and `energyPerSecond` against the distributor's
  capacity and recharge is a comparison the package's own documentation invites. No game rule is
  restated here.
- **FR-009 and FR-014 bound the composition.** Each forbids modelling behaviour the package does not
  report — inventing a falloff curve, interpolating one, or modelling capacitor behaviour beyond the
  composition. SC-004 makes a game rule appearing in this application detectable by test rather than
  by review, which is the line that actually matters.
- **One gap remains: WEP pip scaling** (FR-015). The package is pip-aware for SYS and ENG but
  exposes `weaponsRecharge` as a single rated figure with no pip parameter and no hull endpoints to
  interpolate between. How recharge scales with WEP pips is a game rule, so endurance is reported at
  the rated allocation and other allocations read as unavailable until the scaling lands upstream.
- **User stories 2 and 3 came from a design review on 2026-08-14**, which found both figures present
  in the imported design and absent from every accepted specification.
- **Whole-build totals state an assumption rather than adjusting for it.** Whether a Commander can
  bring every mount to bear is a question about mount geometry, answered by
  [feature 010](../../010-hull-anatomy/spec.md). This specification records the assumption in its
  Assumptions section instead of discounting a total, which would be exactly the local correction
  principle II forbids.
