# Specification Quality Checklist: Advanced Ship Statistics

**Purpose**: Validate specification completeness and quality before proceeding to planning

**Created**: 2026-08-13

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

- Items marked incomplete require spec updates before `/speckit-clarify` or
  `/speckit-plan`.
- **Naming the data package is deliberate, not an implementation leak.**
  `@elite-dangerous-almanac/core` is named in FR-033, FR-037, SC-001 and the "Upstream
  dependencies" section because constitution principle II makes it the domain's source of
  truth: "every statistic comes from the package, and a gap waits on an upstream fix" is a
  behavioural constraint on this feature, not a technology choice. Features 002, 003 and
  004 name it in their requirements for the same reason.
- **Four requirement groups are blocked on upstream library capability** — build mobility
  (FR-021 to FR-023), shield recovery and cell banks (FR-009, FR-010), build heat (FR-024
  to FR-026) and costs for an assembled build (FR-027, FR-030). They are specified rather
  than deferred because each user story states what is shown in the meantime, and FR-023,
  FR-026 and FR-030 forbid closing the gap locally. The gaps were verified against
  `@elite-dangerous-almanac/core@0.1.0-beta.1`, the version pinned in `package.json`.
- **This spec records a defect in feature 003.** FR-007 of feature 003 requires cost
  figures at catalogue retail, which the package cannot supply for a build assembled in
  the application. Feature 003's spec should be reconciled with FR-030 here — either by
  referencing this feature's upstream dependency or by qualifying its own requirement.
