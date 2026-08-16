# Specification Quality Checklist: Ship Selection and Build Loading

**Purpose**: Validate specification completeness and quality before proceeding to planning

**Created**: 2026-08-13

**Updated**: 2026-08-16

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
- **Ship selection and the changes made after it are owned separately.** This spec covers the
  catalogue, previews and how a build is loaded, saved and shared; undo and redo belong to feature
  002, with the changes they reverse. Each behaviour has exactly one owner, as constitution
  principle IX requires.
- **Two scope decisions taken on 2026-08-14.** FR-010 (side-by-side hull comparison) is withdrawn:
  the catalogue narrows to one hull rather than laying two out together, and a comparison surface
  would be a feature in its own right. FR-012a keeps jump range out of the catalogue entirely
  instead of admitting it as a labelled stock-configuration figure — it exists only once a drive is
  fitted, and a labelled build figure in a hull listing is still a build figure.
- **Previews are the Almanac's own ship illustrations, and they now ship with the package.** One
  coloured three-quarter vector illustration per hull, 48 of 48, at
  `assets/ships/<symbol>/illustration.svg`, keyed by the same `symbol` this application already uses,
  with top and bottom schematics alongside (which feature 010 consumes). FR-014 to FR-022 cover
  source, delivery, attribution, performance and what may and may not be altered. FR-017's original
  requirement that they be bundled was overturned on 2026-08-16 — see the amendment note below.
- **Naming the data package is deliberate, not an implementation leak.** FR-002, FR-044, FR-045 and
  SC-003 name `@elite-dangerous-almanac/core` because constitution principle II makes it the
  domain's source of truth, exactly as features 002, 003 and 004 do.
- **Storage requirements name the browser deliberately too.** FR-023a to FR-023g describe working
  builds, saved-build identity and concurrent tabs in terms a Commander experiences — work that
  survives a reload, builds that can share a name, and a save that never silently discards another
  tab's. Local storage is named because constitution principle I makes it the only place a build can
  live.
- **The three requirement areas this checklist once recorded as blocked are all delivered.**
  Manufacturer and hull size, `ShipLoadout.default()` for a stock configuration, and the published
  illustrations all arrived in `@elite-dangerous-almanac/core@0.1.0-beta.4`, verified against the
  installed package on 2026-08-14. The earlier note described `0.1.0-beta.1`; the spec's "Upstream
  dependencies" section is the current record.
- **One requirement area still depends on upstream library work.** FR-044a requires the catalogue
  version the game data comes from to be identifiable. The package exports no machine-readable
  game-data version — only its own release number, and a game version recorded as prose in its
  provenance files — so a catalogue version is requested upstream and FR-044a waits on it.
- **Two properties of the artwork are recorded in the spec so planning does not meet them
  late**: the installed tree is 66 MB across 144 files — 57 MB of it the 48 illustrations this
  feature consumes, with the largest at 4.1 MB, the rest feature 010's plates — and
  the imagery is Frontier Developments' property under media-usage terms whose notice this
  application must reproduce.
- **Engineering quality was removed from the application model on 2026-08-16.** FR-024, FR-028,
  FR-029 and SC-007 now treat every selected or imported grade as complete at 100% and no longer
  require persistence or links to carry an invariant field.

## Amended 2026-08-16 (`0.1.0-beta.9` upgrade)

- **Re-verified against the installed `0.1.0-beta.9`.** Manufacturer and size on 48 of 48 hulls, a
  stock loadout for 48 of 48 that the package reports valid and complete, and an illustration set that
  is byte-for-byte identical to beta.8 — so the size figures recorded above still describe the
  installed package and need no restatement. _(Restated 2026-08-16: those figures were then given as
  64 MB across 144 files, mixing a binary megabyte with the decimal ones used elsewhere and
  attributing the whole artwork tree to the illustration set. On one decimal basis the tree is 66 MB
  across 144 files, of which the 48 illustrations are 57 MB.)_
- **FR-044a still has no catalogue version, and raising one is deferred by decision.** The note above
  says a catalogue version "is requested upstream". Re-checked at beta.9: the package still carries
  the game version only as prose in `PROVENANCE/ships/SOURCES.md` (`4.4.0.3`), with no export,
  constant or field for it — and no issue upstream covers it, so that note was inaccurate. The
  position taken on 2026-08-16 is not to file one yet: FR-044a is satisfied by showing the version as
  unavailable with its reason, nothing else depends on the value, and no requirement is blocked.
  Recorded so the choice stays visible.
- **Illustrations are now fetched at runtime, not bundled (constitution 3.0.0).** The original FR-017
  required every preview to be a bundled static asset and prohibited fetching one at runtime; against
  a 57 MB illustration set that made the first load pay for 47 hulls the Commander did not look at. FR-017 now
  permits the fetch and confines it to the application's own origin, FR-017a fixes it at one hull at a
  time cached as that hull is opened, and FR-017b gives an unfetched preview the same
  temporary-absence treatment feature 010's FR-014a already gives an uncached plate. FR-021, SC-008
  and the offline edge cases are amended to match. This needed a constitutional amendment rather than
  a spec decision, because principle I both guaranteed an unqualified offline application and required
  an amendment for any outbound request; it is recorded as 3.0.0 in
  [the constitution](../../../.specify/memory/constitution.md).
- **The delivery gap is closed at the spec level, not the plan level.** Two facts settle it together:
  optimisation alone does not bring 57 MB into a first-load budget, and fetching unoptimised 4.1 MB
  artwork per hull would make opening a hull detail slow. The spec therefore requires both, and leaves
  the mechanism (which variants, what cache) to planning.
