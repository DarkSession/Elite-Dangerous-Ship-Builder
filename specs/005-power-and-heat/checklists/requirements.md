# Specification Quality Checklist: Power and Heat

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
- **Nothing here is blocked.** Three figures are composed under feature 003's FR-001a — the retracted
  headroom and utilisation, the powered and unpowered shares of the draw, and the modules a shed
  priority group takes offline — and the Upstream dependencies section names all three. No heat
  figure is composed: every heat state shown is one the package reports whole.
- **The power figures follow the hardpoint viewing condition, one state at a time** (FR-001),
  defaulting to deployed because that is the state a build's draw has to fit. The heat scenarios are
  exempt (FR-012a): each carries its own hardpoint condition from the package.
- **Heat capacity is not a budget.** Heat capacity is thermal inertia, governing how long a build
  takes to reach a temperature, while thermal load against hull heat dissipation is what decides
  whether it overheats. FR-010 requires dissipation and excludes capacity, and FR-012b excludes the
  time to reach an overheat for the same reason.
- **An unknown heat contribution is more dangerous than an unknown power draw.** An unknown draw
  makes a power total a lower bound (FR-004); an unknown heat contribution makes every heat figure a
  projection that is wrong in either direction, including the overheat verdict. FR-013 carries the
  stronger obligation for that reason.
- **Heat sinks are outside the model**, because the package expresses no negative thermal load. The
  boundary is recorded in the Assumptions rather than repeated beside every verdict, where it made a
  sound verdict look doubtful.
