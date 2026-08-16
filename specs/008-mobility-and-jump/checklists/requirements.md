# Specification Quality Checklist: Mobility, Mass and Jump

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
  obligation and the viewing conditions apply here without being restated. The load-state and ENG
  pip controls are feature 003's; what they do to these figures is specified here.
- **Mass by source composes; the jump count does not.** An earlier draft recorded both as blocked,
  reading constitution principle II to forbid combining package figures at all — too strict, and
  corrected on 2026-08-14. Mass by source (FR-011) composes cleanly from hull mass, unladen mass and
  each module's own mass, under feature 003's FR-001a. The jump count (FR-004) does not: `totalRange`
  already iterates the jumps and returns only the distance, so counting them here would reproduce a
  library algorithm rather than combine library figures. FR-001a covers the operations it lists — not
  re-running a loop. **That gap closed at beta.8**, verified 2026-08-16: `totalRange` now returns
  `{ range, jumps }` and `jumpRangeSummary` carries the pair for the unladen and laden states. FR-004
  now requires a total per load state, and what remains upstream is only that the loadout accessor
  takes a cargo load and no fuel load, so the lightest state's total cannot be asked for.
- **The Frame Shift Drive has no mass curve** (FR-015). An earlier draft claimed the curve was
  exposed "for thrusters and the Frame Shift Drive alike"; that is false. All 40 thrusters carry the
  three curve masses and their multipliers, and no drive does — all 72 expose `optMass` alone. So the
  drive's optimal mass is shown against the build's mass and no minimum or maximum mass is. **It is
  not an upstream request**, which an earlier draft called it: the package does compute the drive's
  dimensionless mass factor (`optMass / loadedMass`), so nothing is missing. Not showing it is a
  product decision taken on 2026-08-16, so that no dimensionless figure sits beside a drive to be
  mistaken for a thruster multiplier.
- **FR-013 (mass distribution) is withdrawn, not deferred.** Elite Dangerous models no centre of
  mass and no mass distribution affecting handling, and the package reports none. It reached the
  first draft from a design panel rather than from the game. Specifying it would have obliged this
  application to invent a figure, which is the failure constitution principle IV exists to prevent —
  a reminder that a design is a proposal about presentation, never a source of domain truth.
- **FR-016 is the boundary that remains.** A mass-curve relationship is expressed by the multiplier
  the package computes, never by a percentage-of-optimal assembled here. The imported design showed
  one; SC-005 makes its reappearance detectable by test.
- **Range by load compares three states, not four** (FR-003, FR-003a). Until 2026-08-16 it listed a
  fourth — "the range at the Commander's current load assumption" — written while that assumption was
  thought to be a cargo and fuel quantity the Commander typed in. Feature 003's clarification session
  settled it as a choice among the package's three named states, which made the fourth column a
  guaranteed duplicate of one of its neighbours. The selection is now marked among the three instead,
  so the comparison still answers "how much does cargo cost me" from where the Commander actually
  stands.
- **Mass is specified here and read elsewhere.** The shield mass curve belongs to feature 006 and a
  single module's mass to feature 002. Only the build-level breakdown and the thruster and drive
  curves are owned here, so no figure has two owners.

## Amended 2026-08-16 (design review)

Two notes above are superseded by decisions taken on 2026-08-16:

- **FR-016's blanket prohibition on ratios is narrowed.** Stating how the build's mass sits against a
  curve threshold — a proportion of optimal mass, or headroom in tonnes — is a comparison of two
  figures the package reports, which feature 003's FR-001a already permits. It is declared as
  composition 3 in the Upstream dependencies section. Reproducing the curve remains prohibited.
- **FR-014 shows two curve masses, not three.** The thrusters' minimum curve mass is carried by the
  package and deliberately not presented: it sits below the unladen mass of every hull the thruster
  fits, so it marks a position no build occupies. The drive still shows optimal mass alone.

## Amended 2026-08-16 (`0.1.0-beta.9` upgrade)

- **The last of the jump gaps is closed.** The note above ends by recording that the loadout accessor
  took a cargo load and no fuel load, so the lightest state's total could not be asked for.
  `0.1.0-beta.9` gives `ShipLoadout.totalRange` the same `{ fuel, cargo }` options as `jumpRange` and
  adds `totalMax` to `jumpRangeSummary`. FR-004 now reports all three totals, none of them
  unavailable, and this area has no blocked figure. That closes
  [Elite-Dangerous-Almanac#273](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/273).
- **The reason it had to be closed upstream is now demonstrable.** Reaching the total through the pure
  `totalRange(mass, fuel, fsd)` would have omitted a fitted Guardian FSD Booster, whose `jumpBoost`
  lives on the booster module and not on the drive record. Verified against the installed package:
  fitting one moves the maximum jump's total in step with the single-jump range, which is what
  SC-001 requires and what assembling the drive's constants locally would have broken.
