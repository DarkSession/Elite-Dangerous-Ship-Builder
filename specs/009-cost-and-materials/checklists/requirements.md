# Specification Quality Checklist: Cost and Materials

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
- **Nothing here is blocked, text included.** `retailCredits()` supplies costs for a build assembled
  in the application as well as an imported capture, and `getMaterialName(symbol, locale)` supplies
  material names per locale. One figure is composed under feature 003's FR-001a: the count of
  distinct materials FR-007 requires.
- **The material list is composed, not summed.** The package's per-blueprint cost is already
  cumulative across the grades that must be rolled, and merging lists across modules is the package's
  operation. Walking the build's fitted modules to feed those functions is application code; the
  arithmetic is not.
- **Unpriced modules make the totals lower bounds, not unavailable figures** (FR-003). The package's
  modules sum is documented as a floor whenever its unpriced list is non-empty and its rebuy is taken
  from that same floor, so both inherit the bound. A floor is a true and useful statement where
  "unavailable" would discard the prices the catalogue does carry.
- **Sparse locale coverage is the case FR-005b is written for.** Of the 146 materials, English,
  Spanish and Russian cover all of them, Portuguese and French 140, German 128, Georgian 28, and
  Hungarian, Italian and both Chinese tags none. The package never substitutes English silently, so
  one list in one locale will mix translated and untranslated names — which is why the fallback is
  marked per material and why FR-015a tests that case rather than only the happy path.
- **A grand total of material units is deliberately excluded.** A single number adding units of
  selenium to units of iron describes nothing a Commander can act on, so FR-007 requires the count of
  distinct materials instead. No count of rolls, grades or engineering jobs is presented either:
  those describe the process rather than what has to be gathered.
- **Material inventory is out of scope by assumption, not oversight.** The list is what the build
  requires, not what remains to be gathered.
