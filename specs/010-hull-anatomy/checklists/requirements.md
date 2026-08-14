# Specification Quality Checklist: Hull Anatomy and Mount Geometry

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
- **This specification came from a design review on 2026-08-14.** The imported design read and
  navigated a build on the hull's own schematics and projected the mounts forward to show shot
  convergence. Neither capability appeared in any accepted specification.
- **The mount map is backed by published library data, not by anything this application records.**
  The package ships `schematic-top.svg` and `schematic-bottom.svg` for all 48 hulls, and every mount
  in them carries the game's own journal slot key. FR-002 and FR-003 depend on that: without it, a
  slot-to-position mapping would be exactly the private record of library-owned material that
  constitution principle II prohibits, and this feature could not be specified at all.
- **Partial coverage is a designed property, not a gap.** Slot keys appear on hardpoints and utility
  mounts only — 16 located mounts against the 39 slots the package reports for an Anaconda. An
  internal has no single external position to draw, so FR-012 requires the coverage to be stated and
  FR-013 forbids inventing one. This is deliberately not raised upstream as a defect.
- **The cargo hatch is the boundary case.** It is a real slot, it is drawn on all 48 bottom plates and no top plate, and it
  carries no slot key — so it is drawn but not located, and FR-013 applies. Getting this wrong in
  either direction (navigating to it, or omitting it from the drawing) would misrepresent the data.
- **Shot convergence is blocked on upstream library capability** (FR-019 to FR-022), and the capability is
  requested upstream as of 2026-08-14. The schematics carry no scale metadata, so every spatial
  figure user story 3 needs would have to be measured off the artwork against an assumed scale.
  FR-023 prohibits that and states the interim: the figures read as unavailable. What is needed is
  mount geometry in real units. This is the only requirement group in this specification that waits,
  and user stories 1, 2 and 4 are deliverable without it.
- **FR-026 (two hulls side by side) is withdrawn**, in keeping with feature 001's withdrawn FR-010.
  The anatomy view shows one hull.
- **Accessibility is a functional requirement here, not a device concern.** A view whose whole
  premise is spatial is the case where "no information carried by colour or position alone"
  (FR-011) is hardest and most necessary, and FR-018 guarantees no Commander depends on the spatial
  route to reach a slot. Both are stated as functional requirements so that they gate the capability
  rather than trailing it.
