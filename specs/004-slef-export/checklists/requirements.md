# Specification Quality Checklist: SLEF Import and Export

**Purpose**: Validate specification completeness and quality before proceeding to planning

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
- **One ship in, one ship out.** Export carries exactly one entry (FR-002) and import takes exactly
  one (FR-008); parsing is strict, so a payload is either wholly applied or wholly refused. A
  whole-collection backup would belong to feature 001, which owns saved builds.
- **Import is the one route to an active build outside feature 001.** FR-006a here is what records
  that: it is why import is reachable with no build active, and why replacing an existing build
  requires feature 001's confirmation.
- **Pricing is not an export-time choice** (FR-011). An export quotes a recorded source purchase
  price where one exists and no credit figure at all otherwise; catalogue retail is never written
  into an export.
- **Partial engineering quality is not a modelled field.** Import normalises it to 100%, export
  reports 100%, and every other modelled field remains lossless.
- **Pasting is the whole of the import surface** (FR-006). Both sources a Commander actually has —
  a SLEF payload from a squadmate and a `Loadout` line from their own journal — arrive as text they
  have already selected, so a file picker adds a second path to test and to keep accessible for no
  case the paste does not cover.
