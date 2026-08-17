# Specification Quality Checklist: Help, Licences and Provenance

**Purpose**: Validate specification completeness and quality before proceeding to planning

**Created**: 2026-08-16

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
- **One marker is open, and it is the most consequential in the repository.** FR-005b records that
  Frontier's media-usage rules — under which the package attributes and redistributes the artwork —
  may not sit with this application's own licence, and the answer governs what this surface must
  state and possibly whether the artwork can ship at all. It is a licensing question rather than a
  product one, so `/speckit-clarify` cannot settle it — it needs an answer from outside. Features
  001 and 010 point at it from their assumptions, because they are the features that show the
  artwork.
- **Reproducing a notice is a legal obligation, not a courtesy**, which is why FR-005a puts a
  failing build behind a missing notice file rather than degrading gracefully.
- **Licence text is generated, never authored here** (FR-005a). A hand-maintained copy is the same
  class of mistake as a hand-maintained catalogue, except that this one misstates the terms of
  software a Commander is running.
- **This surface is bundled in full and needs no network** (FR-001), precisely because it is the one
  that explains what does and does not work offline. A page a Commander could not read without a
  network would be unreadable exactly when they went looking for that explanation.
- **Two versions are real and one is not.** The application's own release version and the bundled
  library version are taken from the built artefacts; the game catalogue version is shown as
  unavailable with its reason, because the package records it only as prose in its provenance files.
  Feature 001's FR-044a owns that gap.
- **The answers are held to current behaviour** (FR-009). An answer that outlives the behaviour it
  describes is a defect in this feature, which is why SC-004 verifies them against the accepted
  specifications rather than by eye.
