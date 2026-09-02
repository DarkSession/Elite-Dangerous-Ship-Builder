# Specification Quality Checklist: Equipment Builder

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-01
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

Passed on the first iteration. Three judgements are recorded rather than left implicit,
because each one is a place where a stricter reading of the checklist would have failed
the spec and the house convention says otherwise.

**Naming the package in Dependencies is deliberate, not a leak.** Constitution II makes
`@elite-dangerous-almanac/core` a governing constraint rather than an implementation
choice, and every spec from 001 onward records it the same way. The functional
requirements themselves say "the equipment library" and name no package, no subpath and
no function; the package, its leaves and the two calculations it owns appear only under
Dependencies, which is what that section is for.

**SC-004 names the two rendering engines.** That is closer to an implementation detail
than a success criterion would normally sit, and it stays because the constitution's
testing principle fixes the matrix — a criterion saying only "passes an accessibility
check" would be weaker than the gate the build actually enforces.

**Zero clarification markers is a claim about the design, not about certainty.** Three
questions had no answer in the feature description — whether the bench carries its own
chrome, whether saved loadouts share one library with ship builds, and what becomes of
the suit tools the canvas draws. Each had a defensible default in
`.design/Tool Navigation.dc.html` or in constitution II, so each was resolved as a
documented assumption rather than spent as one of the three permitted markers. The first
of them is a genuine collision between two canvases and is flagged in Assumptions as a
ruling to record during planning.

**One dependency blocks implementation and is not a spec defect.** The equipment
catalogue publishes no localised names, so FR-025 cannot be satisfied by any
implementation until the library gains them. The spec is complete and ready to plan; it
is the build that waits.
