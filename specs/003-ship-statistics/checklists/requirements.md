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
- **This specification is a contract, and the areas are capabilities.** It previously carried every
  figure about a build. On 2026-08-14 the breakdowns moved into five area specifications — 005
  power and heat, 006 defence, 007 offence, 008 mobility and jump, 009 cost and materials — and this
  document retained what governs all of them: provenance, units, the honesty rules, the recompute
  obligation, the viewing conditions and the headline set.

  This supersedes the earlier note that "one specification owns every figure about a build". That
  note was written to reject a split by _depth_ — the withdrawn `005-advanced-ship-statistics`, which
  extended this feature rather than owning a capability — and it was right to. A split by _area_ is
  the opposite: each area is a capability a Commander recognises and can be delivered on its own,
  which is what the constitution's Development Workflow asks for. No behaviour has two owners,
  because the contract states rules and the areas state figures.

- **Naming the data package is deliberate, not an implementation leak.**
  `@elite-dangerous-almanac/core` is named in FR-001, FR-018, FR-019, SC-001 and the "Upstream
  dependencies" section because constitution principle II makes it the domain's source of truth:
  "every statistic comes from the package, and a gap waits on an upstream fix" is a behavioural
  constraint, not a technology choice. Every specification in this family names it for the same
  reason.
- **The four requirement groups this document once listed as blocked are all delivered.** Build
  mobility, shield recovery and cell banks, build heat, and costs for an assembled build arrived in
  `@elite-dangerous-almanac/core@0.1.0-beta.4`, verified against the installed package on
  2026-08-14. The earlier note recorded them as blocked at `0.1.0-beta.1`; that is stale. The area
  specifications carry their own upstream sections and are the current record.
- **One gap remains against this contract**: the package's validity and completeness diagnostics are
  English-only, which collides with constitution principle VI. FR-006 and FR-007 surface them, so
  the gap is recorded here rather than in an area specification, and is raised upstream.
- **The family requires an active build, stated once as FR-000 on 2026-08-14.** Every area assumed it
  — each acceptance scenario opens "Given an active build" — but no requirement said so, which left
  it unenforceable and left the empty state undefined. FR-000 states it for all five areas, so none
  of them restates it and none of them can relax it. It also forbids the two failure modes the
  assumption hid: showing a hull's catalogue characteristics in place of a build's statistics, and
  creating a build in order to have something to report on. Feature 002's FR-000 and feature 010's
  FR-001a say the same for outfitting and hull anatomy; feature 001 owns every route to a build,
  with feature 004's import the single exception, which FR-006a there records.
