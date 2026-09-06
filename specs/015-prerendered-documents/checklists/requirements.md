# Specification Quality Checklist: Prerendered Documents

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-06
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

All checklist items pass. Both open questions were answered in the clarification
session of 2026-09-06 and are recorded in the spec:

- **Q1 (FR-011)** — the first frame is bundled English for every Commander, and
  the takeover replaces the text with the committed locale in place. A Commander
  whose locale is not English reads English where today they read a blank shell,
  so no Commander's first frame is worse than it is now.
- **Q2 (FR-018, FR-021)** — the 50 content-bearing addresses are generated: the
  root, the hull catalogue and the 48 hulls. `/outfitting` and `/equipment` are
  advertised but state nothing until a Commander acts, so they keep today's
  behaviour and today's head.
- **Q3 (FR-009a)** — the catalogue's stored session view wins over the document's
  default view, applied in the takeover frame. Raised by research decision 11
  during planning and returned to the spec, because what a Commander is entitled
  to is a spec question rather than a plan one.

**Re-validated 2026-09-06** after an adversarial review of the whole artifact set.
All items still pass. What changed in the spec, and why each was a real defect:

- **FR-009 carried two exceptions in prose.** The catalogue's stored view is now
  its own requirement, FR-009a, so it can be tested and so nothing else can claim
  it by reading the Clarifications loosely.
- **FR-002 read as a closed list**, which would have made a document stating the
  hull's price a violation. It is a floor now, with FR-004 governing everything a
  document states.
- **SC-004 was not measurable** — "a measurably earlier frame" names no
  measurement. It is now the frame index of the first paint containing the
  subject: 0 after, greater than 0 before.
- **SC-005 and FR-019 claimed the scan covers all 52 addresses.** Two of them get
  no generated first frame, so the claim was untestable as written. Both now name
  the 50.
- **The assumptions named `HullDetailFacade`**, a class — the one genuine
  implementation-detail leak in the spec. It now states the property (no
  per-request variance) rather than the code that has it.

Named exceptions to "no implementation details", each deliberate:

- The spec names `@elite-dangerous-almanac/core`, the sitemap, and the feature
  011 scripts. Constitution II makes the package a governing constraint rather
  than an implementation choice, and the address list is an existing contract
  this feature extends rather than a technology it selects.
- The spec names the five layout profiles and the ten Playwright projects.
  Constitution V and VIII fix both as requirements, so they are not free choices.

The spec names no screen and pins no component, as the Development Workflow
section of the constitution requires. Screens are settled at plan time in
`design/`.
