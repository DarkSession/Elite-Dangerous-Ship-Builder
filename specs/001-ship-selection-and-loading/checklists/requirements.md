# Specification Quality Checklist: Ship Selection and Build Loading

**Purpose**: Validate specification completeness and quality before proceeding to planning

**Created**: 2026-08-13

**Updated**: 2026-08-14

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
  source, delivery, attribution, performance and what may and may not be altered.
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
- **Two properties of the illustration set are recorded in the spec so planning does not meet them
  late**: the installed set is 64 MB across 144 files with the largest illustration at 4.1 MB, and
  the imagery is Frontier Developments' property under media-usage terms whose notice this
  application must reproduce.
