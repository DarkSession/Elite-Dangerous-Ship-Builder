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
- **The cargo hatch is the boundary case, and it settled where the view's boundary sits** (FR-003a,
  decided 2026-08-16). It is a real slot, it is marked on all 48 bottom plates and no top plate, and it
  carries no slot key. Presenting it would put a shape on the plate that a Commander would reasonably
  try to select and that FR-013 forbids resolving to the slot it plainly is. The view therefore
  presents hardpoints and utility mounts only — the two categories of nine that carry slot keys — so
  everything on the plate is reachable and nothing on it is a dead end. FR-012's coverage figure
  remains what tells the Commander the plate does not account for every slot.
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
- **Crowding is resolved by the plate's fixed scale, never by moving a marker** (FR-029, decided
  2026-08-16, superseding the magnification answer of 2026-08-14). On the most crowded hull at phone
  width, FR-028 and FR-029 would otherwise contradict each other. The application offers no
  magnification control, so the plate is drawn at one scale set by exactly that hull's closest pair of
  mounts — which leaves FR-003 intact, where offsetting or clustering markers would not. A viewport
  smaller than the plate pans it (FR-029a) rather than scaling it down (FR-030), and the keyboard and
  screen-reader route needs no panning at all. FR-037 makes the scale a tested property rather than an
  assumed one.
- **Schematics never hold up outfitting** (FR-006a, decided 2026-08-14), mirroring feature 001's
  FR-021 for illustrations. Every slot stays readable and changeable while the plates arrive, and
  SC-009 makes that testable.
- **A schematic mismatch fails the build rather than reaching a Commander** (FR-015, decided
  2026-08-14). The schematics and the slot data ship from one bundled package version, so FR-032's
  catalogue-wide tests are the report; only a missing schematic has a Commander-facing state, under
  FR-014.
- **The plate is a raster produced at build time, not the library's SVG** (FR-006 and FR-006b to
  FR-006d, decided 2026-08-16). The 96 plates total 9.0 MB — 3.1 MB gzipped, and up to 323 KB for a
  single plate — so they are converted at build time, with the design system's colours applied in place
  of the artwork's fixed palette. Two consequences are requirements rather than plan-time choices:
  rasterising destroys the schematic's per-mount elements, so positions and slot keys are extracted at
  build time and the mounts are drawn over the raster at runtime (FR-002a, FR-002b); and the raster's
  resolution is set by the fixed scale of FR-029, which is knowable precisely because no magnification
  control exists. The converted plates are build output and are never committed, or FR-004's
  prohibition on a vendored copy would be defeated by another route.
- **The plate carries three states, not everything a mount knows** (FR-007a, decided 2026-08-16).
  Fitted or empty, engineered, and whether the mount is the focused slot are readable at a glance; the
  slot's identity, size and kind, the module, its priority group and whether it is powered are read at
  the focused slot after selecting the mount. This keeps a crowded hull legible at phone width and
  keeps FR-011's text equivalent to a size a screen-reader user can actually move through. The
  unpowered-mount edge case changed with it: the plate now claims nothing about power rather than
  distinguishing a powered mount from an unpowered one.
- **Offline coverage is what the Commander has opened, not the catalogue** (FR-006a and FR-014a,
  decided 2026-08-16). Precaching 48 hulls of artwork is a download nobody asked for, and FR-018
  guarantees no Commander depends on the plate. What this costs is a distinct offline-unavailable
  state, kept worded apart from FR-014's "no schematic exists for this hull" so a temporary absence is
  never read as a permanent one.
- **That decision was ahead of the constitution until 2026-08-16.** Principle I guaranteed an
  unqualified offline application and required an amendment for any outbound request, so FR-006a and
  FR-014a — which fetch a hull's plates when the hull is opened — described something the governing
  document did not permit, and this feature's own Assumptions section still claimed the plates were
  "bundled at build time". The constitution was amended (principle I, 3.0.0) to permit runtime
  fetching from the application's own origin and to restate the offline guarantee as one about
  capabilities rather than artwork. Nothing in this feature's requirements changed as a result: the
  assumption was corrected to match them, FR-006a now names the origin restriction explicitly, and
  FR-036a makes the behaviour testable. Feature 001's illustrations moved to the same model in the
  same change.
- **Accessibility is a functional requirement here, not a device concern.** A view whose whole
  premise is spatial is the case where "no information carried by colour or position alone"
  (FR-011) is hardest and most necessary, and FR-018 guarantees no Commander depends on the spatial
  route to reach a slot. Both are stated as functional requirements so that they gate the capability
  rather than trailing it.

## Amended 2026-08-16 (upstream re-verification)

- **The mount geometry note above is superseded: nothing is requested, and nothing needs to be.** The
  note said the real-unit geometry shot convergence needs was "still absent and still requested" as
  feature 007's dependency. Neither half held. No such issue was ever filed against
  `@elite-dangerous-almanac/core`, and the need itself was answered at `0.1.0-beta.8`, which publishes
  `SHIP_GUNSIGHTS` — each hardpoint's horizontal and vertical offset from the cockpit in metres,
  observed in-game across all 48 hulls and 234 hardpoints. Feature 007 reads convergence from that
  catalogue and says so in its own Upstream dependencies section.
- **What the note was right about survives, and is now stated as a property rather than a request.**
  The schematics still carry no scale metadata of any kind — re-verified across all 96 plates at
  `0.1.0-beta.9`. That is what keeps FR-003 and SC-006 load-bearing, because it is what makes deriving
  a physical figure from the artwork impossible rather than merely discouraged. The Upstream
  dependencies section was rewritten accordingly, and records the withdrawal so a later reader does not
  go looking for an issue that was never opened.
- **This was the third "raised upstream" claim in the specs with no issue behind it**, after the two
  corrected earlier the same day. The pattern is worth naming: a capability recorded as requested is
  only true once the issue exists, and the constitution's requirement to raise a gap upstream is not
  discharged by writing in a specification that it was raised.
