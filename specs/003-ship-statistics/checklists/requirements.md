# Specification Quality Checklist: Ship Statistics

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
- **This specification is a contract, and the areas are capabilities.** It previously carried every
  figure about a build. On 2026-08-14 the breakdowns moved into five area specifications — 005
  power and heat, 006 defence, 007 offence, 008 mobility and jump, 009 cost and materials — and this
  document retained what governs all of them: provenance, units, the honesty rules, the recompute
  obligation, the viewing conditions and the headline set.

  This supersedes the earlier note that "one specification owns every figure about a build". That
  note was written to reject a split by _depth_ — the withdrawn `005-advanced-ship-statistics`, which
  extended this feature rather than owning a capability — and it was right to. A split by _area_ is
  the opposite: each area is a capability a Commander recognises and can be delivered on its own,
  which is what the constitution's Development Workflow asks for. No behaviour has two owners,
  because the contract states rules and the areas state figures.

- **Naming the data package is deliberate, not an implementation leak.**
  `@elite-dangerous-almanac/core` is named in FR-001, FR-018, FR-019, SC-001 and the "Upstream
  dependencies" section because constitution principle II makes it the domain's source of truth:
  "every statistic comes from the package, and a gap waits on an upstream fix" is a behavioural
  constraint, not a technology choice. Every specification in this family names it for the same
  reason.
- **The four requirement groups this document once listed as blocked are all delivered.** Build
  mobility, shield recovery and cell banks, build heat, and costs for an assembled build arrived in
  `@elite-dangerous-almanac/core@0.1.0-beta.4`, verified against the installed package on
  2026-08-14. The earlier note recorded them as blocked at `0.1.0-beta.1`; that is stale. The area
  specifications carry their own upstream sections and are the current record.
- **One gap remains against this contract**: the package's validity and completeness diagnostics are
  English-only, which collides with constitution principle VI. FR-006 and FR-007 surface them, so
  the gap is recorded here rather than in an area specification, and is raised upstream.
- **The family requires an active build, stated once as FR-000 on 2026-08-14.** Every area assumed it
  — each acceptance scenario opens "Given an active build" — but no requirement said so, which left
  it unenforceable and left the empty state undefined. FR-000 states it for all five areas, so none
  of them restates it and none of them can relax it. It also forbids the two failure modes the
  assumption hid: showing a hull's catalogue characteristics in place of a build's statistics, and
  creating a build in order to have something to report on. Feature 002's FR-000 and feature 010's
  FR-001a say the same for outfitting and hull anatomy; feature 001 owns every route to a build,
  with feature 004's import the single exception, which FR-006a there records.

## Amended 2026-08-16 (`0.1.0-beta.9` upgrade)

- **No figure in the family is blocked.** Re-verified against the installed
  `@elite-dangerous-almanac/core@0.1.0-beta.9`. The four exceptions the Upstream dependencies section
  recorded at beta.4 are all settled: WEP pip scaling and the jump count at beta.5, the distributor's
  three pip-scaled recharge rates and the maximum jump's total at beta.9, and the Frame Shift Drive's
  "mass curve" resolved as a non-gap because a drive has no three-point curve.
- **The diagnostics note above is superseded.** It records the English-only diagnostics as a gap
  "raised upstream". That request
  ([Elite-Dangerous-Almanac#245](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/245))
  is closed, and what it delivered was the machine-readable half — a stable `code`, the `params` a
  message interpolates, and the `constraint` behind an edit error — with the English sentence
  documented as being for logs. The wording is therefore this application's to compose and translate,
  which new **FR-007a** states and new **FR-025a** tests. Game _text_ still comes from the package;
  diagnostic _wording_ does not. This is a settled division, not an outstanding request.
- **One gap does remain, and it belongs to feature 006**: the cell bank pool counts unpowered banks.
  Re-verified unchanged at beta.9. It is recorded in the Upstream dependencies section here because
  the contract's honesty rules are what it bears on, and in feature 006's FR-009 where it is handled.

## Amended 2026-08-16 (upstream re-verification)

- **The family's last gap is fixed upstream, and nothing here now awaits an upstream decision.** The
  cell bank pool was filed as
  [Elite-Dangerous-Almanac#281](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/281) and
  closed the same day, but the fix merged after `0.1.0-beta.9` was published, so no released version
  carries it. The note above therefore stands as written for the installed package — the pool is
  unchanged when a bank is disabled — while what remains outstanding is a release to upgrade to rather
  than a question to be answered. Feature 006 owns that upgrade and records what it will change.
- **The distinction is worth keeping in the contract's terms.** A figure blocked on an upstream
  decision is one this application may not present at all; a figure blocked on an upstream release is
  one it presents under FR-001b today and will present more simply later. The cell bank pool has moved
  from the first category to the second, and no figure in any of the five areas is in the first.

## Amended 2026-08-16 (`0.1.0-beta.10` upgrade)

- **The family has no gaps left.** `0.1.0-beta.10` released the power-aware cell bank pool and the
  application consumes it, so the last figure presented under FR-001b as a package figure plus a
  qualification is now simply the package's figure. Every claim in the Upstream dependencies section
  was re-verified against the installed beta.10 rather than carried forward: the distributor's three
  pip-scaled rates, the three multi-jump totals, the heat states, the retail credits with their
  unpriced list, the localized material names, and the diagnostics contract's `code`, `params` and
  `constraint`.
- **The catalogue did not move, which is what let the upgrade be routine.** `ALL_MODULES` is 1199 on
  both sides, the `assets/ships` tree is byte-identical across beta.8, beta.9 and beta.10 (same
  SHA-256 over 144 files), and regenerating the build-link codec table reproduced every pinned array
  byte for byte, with only the recorded Almanac version moving. A release that changed one calculation
  and no data is the cheapest kind to take, and verifying that it was one is what made it cheap.
