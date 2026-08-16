# Specification Quality Checklist: Offence Profile

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
- **Nothing here is blocked.** Two figures are composed under feature 003's FR-001a — each damage
  type's share, and output at a range — and the Upstream dependencies section names both. Endurance
  is not composed: the package computes it whole, so reassembling it from a capacity and a rate would
  reimplement a calculation it provides (FR-014).
- **Anti-xeno damage is an overlay, not a partition** (FR-002). It is shown under its own label and
  excluded from the shares, so a build's shares still sum to the whole.
- **Convergence reads the package's cockpit-offset catalogue, never the schematics.** Feature 010's
  plates carry no scale of any kind, so FR-016e's prohibition on deriving a physical dimension from
  artwork is load-bearing and SC-007 tests it.
- **That catalogue is published positionally, and FR-016g is what keeps it honest.** It carries one
  offset per hardpoint in the package's own slot-enumeration order, and the package warns that the
  number in a journal slot key is not the array index. Binding an offset by parsing that number would
  draw a build's fire from the wrong mount on the hulls that skip or reorder them, so FR-021b tests
  the binding on such a hull rather than only on a well-behaved one.
- **The package projects to tangents, not angles.** FR-016a states the conversion explicitly and
  declares it under FR-001a, on the same terms feature 003's FR-005 sets for resistances, so that no
  reader assumes an angle arrives ready-made.
- **Every mount is treated as fixed, ship-forward geometry** (FR-016c). A gimballed or turreted build
  spreads less in practice than the figures say, so the assumption is stated with the figures rather
  than hidden; excluding tracking mounts or drawing them converged would model behaviour the package
  explicitly does not.
- **Two range controls, of two different kinds.** Damage at range is charted at five fixed ranges
  identical for every build, so two loadouts read against one scale; convergence varies continuously,
  because the question there is where the spread becomes acceptable. Neither chart nor plot may be
  the only route to its figures.
