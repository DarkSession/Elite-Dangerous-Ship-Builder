# Specification Quality Checklist: Ship Selection and Build Loading

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
- **Ownership.** This spec covers the catalogue, hull details, previews and how a build is loaded,
  saved and shared. Undo and redo belong to feature 002, with the changes they reverse; every figure
  about a build belongs to feature 003's family. Each behaviour has exactly one owner, as
  constitution principle IX requires.
- **Naming the data package is deliberate, not an implementation leak.** FR-002, FR-044, FR-045 and
  SC-003 name `@elite-dangerous-almanac/core` because constitution principle II makes it the domain's
  source of truth. Local storage is named for the same reason: principle I makes it the only place a
  build can live.
- **Two scope decisions are settled.** Side-by-side hull comparison is out of scope — the catalogue
  narrows to one hull, and a comparison surface would be a feature in its own right. FR-012a keeps
  jump range out of the catalogue entirely rather than admitting it as a labelled stock figure.
- **One version is unavailable and stays that way.** FR-044a requires the game catalogue version to
  be identifiable; the package exports no machine-readable one, so the requirement is satisfied by
  showing it as unavailable with its reason. Raising it upstream is deferred by decision — nothing
  depends on the value and no requirement is blocked.
- **Artwork weight is recorded in the spec so planning does not meet it late**: the installed tree is
  66 MB across 144 files, 57 MB of it the 48 illustrations this feature consumes, the largest single
  file 4.1 MB. The spec requires both optimised variants and per-hull runtime fetching, because
  neither alone closes a gap of that size, and leaves the mechanism to planning.
