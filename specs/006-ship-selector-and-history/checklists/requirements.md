# Specification Quality Checklist: Ship Selector and Edit History

**Purpose**: Validate specification completeness and quality before proceeding to planning

**Created**: 2026-08-13

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

- **FR-015 resolved: previews are the Almanac's own ship illustrations.** The initial draft
  raised this as a clarification on the basis that the published npm package carries no
  imagery, which is true but was the wrong place to look. The library repository holds a
  complete set — one coloured three-quarter vector illustration per hull, 48 of 48, at
  `assets/ships/<symbol>/illustration.svg`, keyed by the same `symbol` this application
  already uses for hulls. FR-015 to FR-015d now cover source, delivery, attribution,
  performance and what may and may not be altered.
- **This spec extends features 001 and 002 rather than duplicating them.** Ship selection
  with name search is 001's (FR-002 to FR-004); undo and redo are 002's (FR-016). Restating
  them would have put the same behaviour under two owners, which constitution principle IX
  treats as a defect. The "Scope relative to features 001 and 002" section records what this
  feature adds and what it leaves in place.
- **Naming the data package is deliberate, not an implementation leak.** FR-009, FR-030 and
  SC-002 name `@elite-dangerous-almanac/core` because constitution principle II makes it the
  domain's source of truth, exactly as features 002 to 005 do.
- **Three requirement areas depend on upstream library work.** Manufacturer and hull size
  and a stock configuration are genuinely absent from
  `@elite-dangerous-almanac/core@0.1.0-beta.1`, the only published version. The
  illustrations are a different case: they exist and are complete, but are excluded from the
  published package by its `files` list, so the request upstream is to publish them rather
  than to create them. FR-015a forbids vendoring a copy here in the meantime.
- **Two properties of the illustration set are recorded in the spec so planning does not
  meet them late**: the raw set is roughly 56 MB across 48 files, and the imagery is
  Frontier Developments' property under media-usage terms whose notice this application must
  reproduce.
- **This spec records two defects in feature 001.** Its first acceptance scenario requires
  the selector to show manufacturer and size, and FR-003 requires selecting a hull to
  produce a stock configuration. The package provides neither. Feature 001 should be
  reconciled with the "Upstream dependencies" section here.
