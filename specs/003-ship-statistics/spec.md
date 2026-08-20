# Feature Specification: Ship Statistics and Status

## Scope

This capability presents the active build's structural status, Almanac issues, headline results,
assembly requirements and viewing conditions. Detailed calculations remain defined by
[005](../005-power-and-heat/spec.md), [006](../006-defence-profile/spec.md),
[007](../007-offence-profile/spec.md), [008](../008-mobility-and-jump/spec.md) and
[009](../009-cost-and-materials/spec.md).

## User Scenarios

### Story 1 — Understand build status (P1)

1. Structural validity and slot completeness state exactly what Almanac validation reports.
2. Every validation issue appears once with its package severity and structured context.
3. Qualified or unavailable headline results and the selected power-budget state remain visible.
4. Structural validation is never presented as flyability, readiness or quality.

### Story 2 — Read current results (P1)

1. The headline set shows power draw and capacity, shield strength, armour, sustained damage per
   second, jump range, top speed and unladen mass.
2. Every value identifies its unit, conditions and availability and reaches its detailed capability
   in one interaction.
3. A build edit or viewing-condition change updates status and results without refresh.
4. Zero, unavailable, incomplete, lower-bound and infinite results remain distinguishable.

### Story 3 — Compare conditions (P2)

1. A Commander can select maximum-jump, unladen or laden load state.
2. A Commander can allocate the game's six distributor pips in half-pip steps, with at most four in
   any capacitor.
3. A Commander can select retracted or deployed hardpoints.
4. Viewing conditions affect calculations but are not part of the build.

### Story 4 — Review requirements and act (P2)

1. Retail hull, module and rebuy credits, Merc Coin and engineering materials follow the headline
   results and summarize the package outputs.
2. Unpriced modules and missing recipe costs remain visible and qualify affected summaries.
3. An issue carrying a package slot reaches that slot in one interaction; an issue without one
   remains readable without an invented location.
4. Resolved package issues and qualifications disappear with the updated revision.

## Requirements

- **FR-001**: This capability MUST require an active build and MUST NOT create one.
- **FR-002**: Every game value, calculation, identity and verdict MUST come from
  `@elite-dangerous-almanac/core` for the current build and relevant conditions. The application
  MUST NOT derive, clamp, estimate, repair or reinterpret a package result.
- **FR-003**: Structural status MUST use only `ShipLoadout.validation.valid` and `.complete`, describe
  exactly those facts and never claim that the build is flyable, ready, working, good or optimal.
- **FR-004**: Every validation issue MUST appear once with its code, severity, parameters and any
  slot or constraint the package supplies. Package issue order MUST be preserved.
- **FR-005**: Package game text and diagnostic text MUST not be parsed or privately translated.
  Application-owned labels MUST use the localisation layer.
- **FR-006**: Every value MUST show its meaning, unit and relevant conditions. Numbers and units MUST
  use the active locale.
- **FR-007**: A package diagnostic MUST be preserved. A `null` or thrown unavailable result MUST be
  shown as unavailable; the application MAY state an observable prerequisite but MUST NOT invent a
  game diagnosis.
- **FR-008**: Validation, unavailable, incomplete and lower-bound states MUST remain visible without
  hiding results the package can still produce. A genuine zero and a semantically infinite result
  MUST retain their package meanings.
- **FR-009**: Power status and other hardpoint-sensitive headline results MUST show only the selected
  hardpoint state. The Commander MUST be able to switch between deployed and retracted.
- **FR-010**: The headline set MUST use the area-spec results for power draw and capacity, shield
  strength, armour, sustained damage per second, the selected jump load, top speed and unladen mass.
- **FR-011**: Retail credits, Merc Coin and engineering materials MUST follow
  [009](../009-cost-and-materials/spec.md). Merc Coin MUST remain separate and appear only when the
  package recognizes a Mercenary article.
- **FR-012**: A package-provided slot or detail target MUST be reachable in one interaction. The
  application MUST NOT infer a location or target the package does not supply.
- **FR-013**: Package-defaulted fixed modules MUST appear only as ordinary fitted build state and
  MUST NOT create a separate normalization or provenance region.
- **FR-014**: Status MUST NOT infer, persist or publish import/defaulting history from fixed-module
  state.
- **FR-015**: With no package issues or qualified results, the capability MUST state that none were
  reported without making a readiness or quality claim.
- **FR-016**: The default load state MUST be unladen: full main tank and empty cargo hold. Maximum
  jump and laden MUST use the package definitions.
- **FR-017**: The default pip allocation MUST be two each to SYS, ENG and WEP. Allocations MUST use
  half-pip steps, total six and not exceed four for one capacitor.
- **FR-018**: The default hardpoint state MUST be deployed.
- **FR-019**: Viewing conditions MUST NOT enter edit history, stored builds, preferences, links or
  SLEF.
- **FR-020**: Status, issues, assembly requirements and figures MUST represent one build revision;
  rapid edits MUST never mix revisions.
- **FR-021**: A settled change in issue or qualification counts MUST be announced once to assistive
  technology without re-announcing unchanged figures.
- **FR-022**: Issue kind and severity MUST be expressed as text and MUST NOT depend on colour, icon,
  shape or position.

## Edge Cases

- A build can be invalid and incomplete at once.
- A genuine zero remains distinct from unavailable. No recognized Mercenary article is the defined
  case where Merc Coin is absent rather than shown as zero.
- Infinite results use their package meaning rather than an unexplained numeric symbol.
- Rapid edits never mix status, figures or assembly requirements from different revisions.

## Almanac Coverage

`validation`, `powerBudget()`, the area metric/result methods, `standardLoadResult()`, diagnostic mass and capacity accessors,
`retailCredits()`, `mercCoinCost()` and engineering cost functions provide every required game
value, state and calculation. The application selects viewing conditions, consolidates returned
facts and owns no game calculation or readiness verdict.

## Current Almanac Limit

Diagnostic result objects exist for mass, fuel capacity, cargo capacity, standard loads, mobility,
shield strength and shield recovery. Heat and distributor methods still return `null` for some
unavailable states, and jump-summary methods throw when prerequisites are unavailable. Where the
package supplies no structured reason, the application can state only that the result is unavailable
and show directly observable build state.

## Success Criteria

- **SC-001**: Structural status and every validation issue match the Almanac result.
- **SC-002**: Every displayed value and quantity equals its Almanac result for the same build
  revision and conditions across the reference corpus.
- **SC-003**: Every affected status and result updates within 100 ms at the mobile viewport under 4×
  CPU slowdown.
- **SC-004**: No unavailable or qualified result becomes a fabricated number or application-owned
  game verdict.
- **SC-005**: Viewing conditions survive no reload, save, link or export.
- **SC-006**: Every package-targeted issue and summary item reaches its detail in one interaction.
