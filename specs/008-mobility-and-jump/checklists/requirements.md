# Specification Quality Checklist: Mobility, Mass and Jump

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
  obligation and the viewing conditions apply here without being restated. The cargo, fuel and ENG
  pip controls are feature 003's; what they do to these figures is specified here.
- **Mass by source composes; the jump count does not.** An earlier draft recorded both as blocked,
  reading constitution principle II to forbid combining package figures at all — too strict, and
  corrected on 2026-08-14. Mass by source (FR-011) composes cleanly from hull mass, unladen mass and
  each module's own mass, under feature 003's FR-001a. The jump count (FR-004) does not: `totalRange`
  already iterates the jumps and returns only the distance, so counting them here would reproduce a
  library algorithm rather than combine library figures. FR-001a covers the operations it lists — not
  re-running a loop. FR-004
  therefore stands as an upstream request, and it is a small one.
- **The Frame Shift Drive has no mass curve** (FR-015). An earlier draft claimed the curve was
  exposed "for thrusters and the Frame Shift Drive alike"; that is false. All 40 thrusters carry the
  three curve masses and their multipliers, and no drive does — all 72 expose `optMass` alone. So the
  drive's optimal mass is shown against the build's mass and no multiplier is, because deriving one
  from their ratio is the game rule FR-016 forbids. This is the second of the two upstream requests in this spec.
- **FR-013 (mass distribution) is withdrawn, not deferred.** Elite Dangerous models no centre of
  mass and no mass distribution affecting handling, and the package reports none. It reached the
  first draft from a design panel rather than from the game. Specifying it would have obliged this
  application to invent a figure, which is the failure constitution principle IV exists to prevent —
  a reminder that a design is a proposal about presentation, never a source of domain truth.
- **FR-016 is the boundary that remains.** A mass-curve relationship is expressed by the multiplier
  the package computes, never by a percentage-of-optimal assembled here. The imported design showed
  one; SC-005 makes its reappearance detectable by test.
- **Mass is specified here and read elsewhere.** The shield mass curve belongs to feature 006 and a
  single module's mass to feature 002. Only the build-level breakdown and the thruster and drive
  curves are owned here, so no figure has two owners.
