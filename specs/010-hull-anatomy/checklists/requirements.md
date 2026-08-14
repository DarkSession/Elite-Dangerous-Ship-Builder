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
- **Shot convergence moved out on 2026-08-14** (clarification session). Where a build's fire arrives
  is a property of what it fires rather than of where its mounts are drawn, so user story 3 and
  FR-019 to FR-023 were reassigned to [feature 007](../../007-offence-profile/spec.md), which
  consumes the positions this feature owns. Nothing in this specification now waits on upstream
  capability. The mount geometry in real units that convergence needs is still absent and still
  requested, but it is feature 007's dependency; what remains here is FR-003 and SC-006, which forbid
  this feature deriving any physical figure from the artwork.
- **The anatomy view requires an active build (FR-001a), decided on 2026-08-14.** It is a capability
  of outfitting, not a way to weigh up a hull before choosing one, so user story 4 and FR-024/FR-025
  are withdrawn with it. A hull's mount layout before a build exists is feature 001's FR-004, in the
  catalogue. This matches the precondition feature 003's FR-000 sets for the statistics family and
  feature 002's FR-000 sets for outfitting: no capability outside feature 001 — and feature 004's
  import — creates a build.
- **FR-026 (two hulls side by side) is withdrawn**, in keeping with feature 001's withdrawn FR-010.
  The anatomy view shows one hull.
- **Crowding is resolved by magnification, never by moving a marker** (FR-029, decided 2026-08-14).
  On the most crowded hull at phone width, FR-028 and FR-029 would otherwise contradict each other.
  Magnifying and panning separates mounts at their true positions, which leaves FR-003 intact, where
  offsetting or clustering markers would not. FR-029a keeps the keyboard and screen-reader route free
  of any zoom gesture.
- **Schematics never hold up outfitting** (FR-006a, decided 2026-08-14), mirroring feature 001's
  FR-021 for illustrations. Every slot stays readable and changeable while the plates arrive, and
  SC-009 makes that testable.
- **A schematic mismatch fails the build rather than reaching a Commander** (FR-015, decided
  2026-08-14). The schematics and the slot data ship from one bundled package version, so FR-032's
  catalogue-wide tests are the report; only a missing schematic has a Commander-facing state, under
  FR-014.
- **Accessibility is a functional requirement here, not a device concern.** A view whose whole
  premise is spatial is the case where "no information carried by colour or position alone"
  (FR-011) is hardest and most necessary, and FR-018 guarantees no Commander depends on the spatial
  route to reach a slot. Both are stated as functional requirements so that they gate the capability
  rather than trailing it.
