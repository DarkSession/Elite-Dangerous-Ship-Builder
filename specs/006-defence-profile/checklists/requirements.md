# Specification Quality Checklist: Defence Profile

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
  obligation and the viewing conditions apply here without being restated. The pip allocation is
  feature 003's control; what SYS pips do to these figures is FR-004 here.
- **One gap: a power-aware cell bank pool** (FR-009). The package's cell bank aggregate counts every
  fitted bank regardless of whether it is enabled or powered, unlike its shield metrics, which do
  account for a generator switched off. FR-009 therefore requires the unready bank to be flagged
  within the package's pool rather than subtracted from it — subtracting would produce a total the
  package did not compute. Everything else was verified against the installed
  `@elite-dangerous-almanac/core@0.1.0-beta.4` on 2026-08-14.
- **Shield recovery is two phases, not one.** The package reports the time from collapse to the
  threshold at which shields come back up, and separately the time from that threshold to full. An
  earlier draft asked for "empty to full", which is their sum and is not a figure the package
  reports; FR-006 now requires both phases as distinct figures, which is also the more useful pair —
  the first is when a Commander regains protection.
- **"Integrity" and "module armour" are one figure, not two.** A design review on 2026-08-14 read an
  `INTEGRITY` label beside hardness and module protection and asked whether a figure was missing. It
  is the module-damage pool the package calls module armour, which FR-012 already requires. The
  Assumptions section records this so the label cannot be specified twice under two names. Per-module
  integrity — a module's own hit points — is a module attribute belonging to feature 002.
- **Negative resistances are a requirement, not an edge case only.** FR-005 forbids clamping because
  reactive bulkheads genuinely produce a negative thermal resistance, and a clamped zero would be the
  fabricated value constitution principle IV prohibits.
