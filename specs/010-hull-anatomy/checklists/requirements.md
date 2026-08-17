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
- **This feature owns one thing: where on the ship a mount is.** Reading and changing a slot belongs
  to feature 002, which stays a complete route to every slot (FR-018); the figures a build produces
  belong to feature 003's family; the catalogue illustration belongs to feature 001. Shot
  convergence belongs to feature 007 and reads the package's own cockpit-offset catalogue, not
  anything drawn here.
- **The anatomy view requires an active build** (FR-001a), so seeing where a hull's mounts sit
  before choosing it is out of scope; feature 001's catalogue carries each hull's mount layout
  instead.
- **Only mounts are located.** Slot keys appear on hardpoints and utility mounts alone, so an
  Anaconda's plates locate 16 of its 39 slots. FR-012 requires the coverage to be stated and FR-013
  forbids inventing a position, because an internal has no single external position to draw.
- **Seven of the nine schematic feature categories are deliberately not presented** (FR-003a). The
  cargo hatch is why the line falls there: it is a real slot, marked on all 48 bottom plates, and it
  carries no slot key, so drawing it would put a shape on the plate that looks selectable and is
  not.
- **The plate has one mode and three states** (FR-007a, FR-007b). It is not a canvas other areas
  draw their figures onto; a plate whose meaning changed under a mode control would force a
  Commander to check which mode was in force before trusting what they saw.
- **There is no magnification control** (FR-029). The plate is drawn at one fixed scale, set by the
  closest pair of mounts on the most crowded hull so that both carry a full touch target at their
  true positions, and it pans within its container where the viewport is smaller. FR-037 makes the
  test identify that hull rather than assume it.
- **The schematics carry no scale, and nothing here needs one.** A physical figure could only be
  obtained by measuring artwork against an assumed scale, which constitution principle II forbids;
  FR-003 and SC-006 hold the line, and no request for scale metadata is open upstream.
- **A mismatch between a schematic's slot keys and the hull's slots fails the build** (FR-015,
  FR-032). Both ship from the same bundled package version, so a mismatch is caught before release
  rather than shown to a Commander.
