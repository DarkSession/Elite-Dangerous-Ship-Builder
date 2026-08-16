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

- [ ] No [NEEDS CLARIFICATION] markers remain
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
- **One marker is open.** FR-014 excludes the thruster mass curve's minimum mass, on the ground that
  the curve is read for two thresholds. Measurement reopens it: of the 1,144 valid hull-and-thruster
  combinations, 58 sit below the fitted thruster's minimum at unladen mass and 32 at the loaded mass
  FR-014a displays, so it is a threshold a Commander can reach and act on. Whether to show it is a
  product decision, and `/speckit-clarify` should settle it before planning.
- **This is an area of the statistics family.** [Feature 003](../../003-ship-statistics/spec.md) is
  the contract: provenance, units, the honesty rules for unavailable figures, the recompute
  obligation and the viewing conditions apply here without being restated.
- **Nothing here is blocked.** Three figures are composed under feature 003's FR-001a — mass by
  source, the loaded mass the thruster curve is evaluated at, and how the build's mass stands
  against a curve threshold — and the Upstream dependencies section names all three.
- **Two masses, deliberately kept apart** (FR-014a). The breakdown's total counts the reserve tank
  and no cargo; the mass the thruster curve is evaluated at excludes the reserve and counts a full
  hold. Neither is reliably the larger, so the relation must be stated wherever both appear.
- **A drive has no three-point curve**, so FR-015 shows optimal mass alone for it and forbids
  inventing a minimum or maximum. That is a property of the data, not a gap.
- **A zero the package reports is a figure, not an absence** (FR-006a, FR-017). A build with no fuel
  aboard reads as zero range with its reason; a build with no drive at all reads as unavailable.
