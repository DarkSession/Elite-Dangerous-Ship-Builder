# Specification Quality Checklist: Defence Profile

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
- **This is an area of the statistics family.** [Feature 003](../../003-ship-statistics/spec.md) is
  the contract: provenance, units, the honesty rules for unavailable figures, the recompute
  obligation and the viewing conditions apply here without being restated.
- **No figure here is blocked, and nothing in this area composes one.** Every defence figure is the
  package's own, including the power-aware cell bank pool FR-009 presents directly.
- **Armour penetration is split with feature 007.** The hull's hardness is a property of the ship
  being built and is reported here (FR-013); a weapon's own piercing rating is a property of what the
  build fires and is reported there. Neither area repeats the other's figure.
- **An unresolved hull withholds the whole area, not just the armour group.** The package computes
  zero armour and zero resistances around a hull it cannot name, and those zeroes are an artefact
  rather than a defenceless ship. The shield, recovery and cell-bank figures remain computable and
  are withheld with the rest, because a defence profile assembled around an unnamed hull would
  mislead more than it informs.
- **Infinite is a verdict, not a missing figure.** Infinite effective hit points mean nothing of that
  damage type gets through; an infinite recovery duration means the shield does not come back at the
  allocation in force. Neither is presented as unavailable, a zero or a blank.
- **The recovery threshold is deliberately not quoted.** The package reports both recovery durations
  and both regeneration rates but no threshold field, so naming the proportion would mean stating a
  game rule from documentation rather than data. FR-006 requires the two phases and their governing
  rates instead.
- **Integrity is per module, never per build.** A build-level figure labelled "integrity" describes
  nothing; what this area reports is module protection (FR-012).
