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
- **No figure here is blocked; one piece of text is.** Material names carry no locale in the package
  — its i18n surface covers modules, blueprints and experimental effects only — so under constitution
  principle VI the names appear in the language the package provides and the application says so. A
  materials locale is requested upstream, mirroring how feature 003 handles the English-only
  diagnostics.
- Costs for a build assembled in the application arrived in
  `@elite-dangerous-almanac/core@0.1.0-beta.4`, verified against the installed package on
  2026-08-14. `retailCredits()` is the accessor that supplies them; the older `hullValue`,
  `modulesValue` and `rebuy` getters stay null for an assembled build, which is why the Upstream
  dependencies section names the distinction.
- **The material list is composed, not summed.** The package's per-blueprint cost is already
  cumulative across the grades that must be rolled, and merging lists across modules is the
  package's operation. Walking the build's fitted modules to feed those functions is application
  code; the arithmetic is not. This is the same reasoning feature 003 applied before the split.
- **A grand total of material units is deliberately excluded.** The imported design displayed one. A
  single number adding units of selenium to units of iron describes nothing a Commander can act on,
  so FR-007 requires the count of distinct materials and of contributing operations instead. This is
  a considered omission, not a gap.
- **Material inventory is out of scope by assumption, not oversight.** The list is what the build
  requires, not what remains to be gathered; tracking what a Commander holds would need state this
  application does not keep.
