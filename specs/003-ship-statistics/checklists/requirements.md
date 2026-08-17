# Specification Quality Checklist: Ship Statistics

**Purpose**: Validate specification completeness and quality before proceeding to planning

**Created**: 2026-08-13

**Updated**: 2026-08-14

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
- **This specification is a contract, and the areas are capabilities.** The breakdowns live in five
  area specifications — 005 power and heat, 006 defence, 007 offence, 008 mobility and jump, 009
  cost and materials. This document retains what governs all of them: provenance, units, the honesty
  rules, the recompute obligation, the viewing conditions and the headline set. No behaviour has two
  owners, because the contract states rules and the areas state figures.
- **The family requires an active build** (FR-000), stated once for all five areas so that none of
  them restates it and none can relax it. It forbids the two failure modes the assumption otherwise
  hides: showing a hull's catalogue characteristics in place of a build's statistics, and creating a
  build in order to have something to report on.
- **No area is waiting on an upstream release.** Every figure the five areas present today is
  computed by `@elite-dangerous-almanac/core` at the pinned version. The one open question that
  could change that is feature 007's FR-016a, which would turn its three convergence figures into an
  upstream request if it is answered against composing them here. Feature 008 carries the family's
  other marker, but that one is a product decision rather than an upstream matter. Each area names
  what it composes under FR-001a in its own Upstream dependencies section.
- **Diagnostic wording belongs to this application, not to the package.** The package publishes a
  stable `code`, the `params` a message interpolates, the slot and module symbol a validation issue
  names, and the `constraint` behind an edit error — the last documented as carrying an English
  fallback suitable for logs. FR-007a requires the sentence to be composed here and translated;
  FR-025a tests it. Game _text_ still comes from the package; diagnostic _wording_ does not.
- **Naming the data package is deliberate, not an implementation leak.**
  `@elite-dangerous-almanac/core` is named in FR-001, FR-018, FR-019 and SC-001 because constitution
  principle II makes it the domain's source of truth.
