# Feature Specification: Build Status Summary

## Scope

This specification covers the consolidated account of the active build's condition: a structural
verdict, every finding that explains it, the headline figures that describe the build's main
capabilities, and the credits, Merc Coin and engineering materials the build requires. It inherits
the statistic rules and viewing conditions in
[Ship Statistics](../003-ship-statistics/spec.md), which also defines the headline set this report
presents.

The rules for each figure belong to its area specification:
[Power and Heat](../005-power-and-heat/spec.md),
[Defence Profile](../006-defence-profile/spec.md),
[Offence Profile](../007-offence-profile/spec.md),
[Mobility, Mass and Jump](../008-mobility-and-jump/spec.md) and
[Cost and Materials](../009-cost-and-materials/spec.md). This specification governs how they are
gathered into one report, not what any of them means.

Making the change that resolves a finding belongs to
[Module Outfitting and Engineering](../002-module-outfitting/spec.md). Fixed-mount normalisation is
performed there and when a build is loaded by
[Ship Selection and Build Loading](../001-ship-selection-and-loading/spec.md); this report only
surfaces the resulting state. Import and export diagnostics belong to
[SLEF Import and Export](../004-slef-export/spec.md).

## Clarifications

### Session 2026-08-17

- Q: Should the status report's cost section include the build-level Merc Coin total, or leave Merc
  Coin entirely to the Cost and Materials detail? → A: Include `ShipLoadout.mercCoinCost()` as its
  own currency in the requirement summary, shown only when the build carries a recognized Mercenary
  article, never combined with credits — under the rules in
  [Cost and Materials](../009-cost-and-materials/spec.md)
- Q: When a build is reloaded in a new browser session, should the report still show which fixed
  mounts were auto-filled on the original load? → A: Yes. The record is persisted beside the build in
  the browser and cleared per mount when the Commander changes that mount; it is never included in a
  save payload, share link or SLEF export
- Q: When the findings change after an edit, what exactly should a screen reader announce? → A: A
  short summary of the new state — the count per kind, e.g. "2 blocking, 1 incomplete, 1 figure
  unavailable" — announced once per settled change
- Q: How should the 100 ms update budget in SC-006 be measured, given that "the supported mobile
  performance profile" is not defined anywhere in this repository? → A: End to end in the existing
  Playwright mobile project with Chromium CPU throttling at 4×, measured from the edit to the updated
  report
- Q: What should the verdict be called throughout the spec and the implementation, given that Key
  Entities names it "Readiness verdict" while FR-002a forbids presenting it as readiness? → A:
  "Structural verdict", described as the Almanac's structural validity and slot completeness, with
  "flyability" dropped

## User Scenarios & Testing

### User Story 1 - Know whether the build works (Priority: P1)

A Commander can tell at a glance what the Almanac reports about the active build's structure, and
read every finding that explains what would stop it working.

**Independent Test**: Load valid, invalid and incomplete reference builds and compare the verdict
and the complete finding list with the Almanac's validation result for the same build.

**Acceptance Scenarios**:

1. **Given** an active build, **When** its status is shown, **Then** one structural verdict is
   present, reflects the Almanac's valid and complete flags for that build, and is named as
   structural validity and completeness rather than as readiness to fly.
2. **Given** a build the package reports as valid and complete but outside its power budget, **When**
   its status is shown, **Then** the verdict still reports what those flags say, the power-budget
   state appears as a finding, and nothing describes the build as ready to fly.
3. **Given** a build the Almanac reports as invalid or incomplete, **When** status is shown, **Then**
   every issue the Almanac returned is listed with its own explanation.
4. **Given** a build the Almanac reports as valid and complete with no qualified results, **When**
   status is shown, **Then** the report states that there are no findings rather than showing an
   empty area.
5. **Given** any finding, **When** it is read, **Then** it identifies whether the build cannot be
   flown as described, is incomplete, or has a figure that is unavailable or a lower bound.
6. **Given** a build whose fixed mounts were filled on load, **When** the Commander returns to that
   build in a new session without having changed those mounts, **Then** the normalisation record is
   still shown, named as the application's own change rather than as a package finding.

### User Story 2 - Read the key numbers at a glance (Priority: P1)

A Commander can read the build's main capabilities in one place while outfitting, and reach the
detail behind any of them.

**Independent Test**: Load a reference build and compare every headline figure, its stated viewing
conditions and its unavailable states with the Almanac results for the same build and conditions.

**Acceptance Scenarios**:

1. **Given** an active build, **When** status is shown, **Then** every headline figure is present
   with its unit and every viewing condition that affects it.
2. **Given** a headline figure, **When** the Commander activates it, **Then** its detailed
   statistics are reached in one interaction.
3. **Given** a headline figure the Almanac cannot produce, **When** status is shown, **Then** it
   remains present, is identified as unavailable and a matching finding explains it.
4. **Given** a build change, **When** the Almanac recomputes it, **Then** the verdict, the findings
   and every affected figure update together without a manual refresh.

### User Story 3 - See what the build costs to assemble (Priority: P2)

A Commander can read what the build costs in credits and Merc Coin and what engineering materials it
needs, without leaving the status report.

**Independent Test**: Compare the report's credit, Merc Coin and material summary with the Almanac
retail, Merc Coin and material results for assembled, imported, unpriced, unengineered and
Mercenary-article reference builds.

**Acceptance Scenarios**:

1. **Given** an active build, **When** status is shown, **Then** the catalogue-retail hull value,
   fitted-module value, rebuy, the build's Merc Coin total where one applies and the consolidated
   engineering-material requirement follow the headline figures in that reading order.
2. **Given** unpriced fitted modules, **When** cost is shown, **Then** the affected totals are
   identified as lower bounds and a finding names the unpriced slots.
3. **Given** a build with no ordinary engineering, **When** materials are shown, **Then** the
   requirement is empty rather than unavailable.
4. **Given** a cost or material entry, **When** the Commander activates it, **Then** its detail is
   reached in one interaction.
5. **Given** a build carrying at least one recognized Mercenary article, **When** cost is shown,
   **Then** the build's Merc Coin total appears as its own currency, is never added to or compared
   with credits or rebuy, and reaches its per-slot detail in one interaction.
6. **Given** a build carrying no recognized Mercenary article, **When** cost is shown, **Then** no
   Merc Coin figure, empty state or zero appears at all.

### User Story 4 - Act on a finding (Priority: P2)

A Commander can go from a finding to the part of the build that caused it, change it and watch the
finding clear.

**Independent Test**: For each package issue that names a slot, follow the finding to that slot,
make the change that resolves it and verify the finding disappears and the verdict updates.

**Acceptance Scenarios**:

1. **Given** a finding the Almanac associates with a slot, **When** the Commander activates it,
   **Then** that slot is reached in one interaction.
2. **Given** a finding with no slot the Almanac names, **When** it is shown, **Then** it remains
   listed and readable without an invented location.
3. **Given** a resolved cause, **When** the Almanac revalidates the build, **Then** the finding is
   gone and the verdict reflects the new state.
4. **Given** findings of different kinds, **When** they are listed, **Then** the ones that stop the
   build being flown as described are reachable first.

### Edge Cases

- A build can be invalid and incomplete at once; both states are reported, neither hides the other.
- Power that fits with hardpoints retracted but not deployed is reported for both states, not only
  for the selected one.
- Every headline figure may be unavailable at once; each stays present with its reason rather than
  the report collapsing.
- A genuine zero — no cargo capacity, no engineering materials — is shown as zero or as an empty
  requirement, never as unavailable. A build carrying no Mercenary article is the exception the Merc
  Coin rules already make: the figure is absent entirely rather than shown as zero or empty.
- An infinite Almanac result is described by its meaning rather than shown as an unexplained number.
- Rapid edits never produce a report mixing a verdict, a finding and a figure from different build
  states.
- A finding cleared by an undone change returns when the change is redone.
- No active build means no status report and no side effect that creates a build.

## Requirements

### Verdict and Findings

- **FR-001**: The status report MUST require an active build and MUST NOT create one as a side
  effect.
- **FR-002**: The report MUST state one structural verdict derived solely from the Almanac's
  validation valid and complete flags for the active build, and MUST name it for what those flags
  mean — the build is structurally valid and its slots are complete. The application MUST NOT form a
  verdict of its own from statistic values.
- **FR-002a**: That verdict MUST NOT be presented as the build being flyable, ready or working.
  Those flags are structural: a build whose power plant is disabled reports `valid` and `complete`
  while `powerBudget()` reports `withinBudget: false`, and the package returns no validation issue
  for it. The report MUST NOT imply such a build is ready, and MUST NOT compensate by inventing a
  readiness rule of its own — the power-budget state reaches the Commander as a finding under FR-003
  and FR-007, classified by FR-006, and it is the findings taken together that describe whether the
  build works. A single package-owned readiness result MUST be requested against
  [Elite-Dangerous-Almanac](https://github.com/DarkSession/Elite-Dangerous-Almanac) and MUST replace
  this arrangement when it lands; until then no application-owned verdict fills the gap.
- **FR-003**: Every finding MUST trace to a fact `@elite-dangerous-almanac/core` reported for the
  active build — a returned validation issue, an absent or qualified result, or a state flag the
  package returns. The application MUST NOT diagnose a build from its numbers, and MUST NOT raise a
  finding the package's results do not support. Fixed-mount normalisation provenance under FR-009 is
  the single exemption, because it records a change the application itself made to the build; it is
  not a package finding and MUST NOT be presented as one.
- **FR-004**: Each validation issue the package returns MUST appear as a finding carrying that
  issue's code, parameters and, where the package supplies them, its severity, affected slot and
  constraint. The application MUST NOT drop, merge or re-rank an issue the package returned.
- **FR-005**: Finding wording MUST be composed by the application from the package's
  machine-readable code and parameters and MUST resolve through the localisation layer. Game
  nouns inside a finding — ship, module, blueprint, effect and material names — MUST come from the
  Almanac. The application MUST NOT parse the package's English fallback text and MUST NOT
  privately translate game text.
- **FR-006**: Findings MUST be classified as the build cannot be flown as described, the build is
  incomplete, or a reported figure is unavailable or a lower bound. Classification MUST follow the
  package's reported severity and availability, never an application judgement about whether a
  figure is good.
- **FR-007**: A finding whose meaning depends on a viewing condition MUST name that condition.
  Findings about the power budget MUST be reported for both retracted and deployed hardpoint states,
  because the package returns both, rather than only for the selected state.
- **FR-008**: A finding the package associates with a slot MUST lead to that slot in one
  interaction. A finding with no package-named slot MUST remain listed without an invented location.
- **FR-009**: Where the active build was changed by fixed-mount normalisation, the report MUST keep
  that change visible until those mounts are changed by the Commander, naming the mounts filled and
  the identities replaced. This is the application's own record of what it did on load, not a
  package result: it MUST be presented as normalisation provenance, distinctly from the
  package-reported findings FR-003 governs, and MUST NOT be classified under FR-006 or ordered among
  them under FR-010. It persists after the package stops reporting anything about those mounts,
  which is the point of keeping it.
- **FR-009a**: That provenance MUST survive a reload and a new browser session, because a reload
  restores an already-normalised build and nothing re-triggers normalisation — a record that expired
  with the tab would leave the Commander unaware of a mount they never chose. It MUST therefore be
  stored beside the active build in the browser, and MUST be cleared one mount at a time as the
  Commander changes each mount rather than all at once. It is application provenance rather than
  build data: it MUST NOT be written into a save payload, a share link or a SLEF export, so a
  recipient receives the build without it. Replacing the active build with another MUST discard the
  record along with the build it describes.
- **FR-010**: Findings MUST be ordered so that those stopping the build being flown as described
  come first. Ordering is presentation and MUST NOT alter, combine or suppress any package result.
- **FR-011**: With no findings, the report MUST state that the Almanac reported none rather than
  showing an empty area, and MUST NOT describe the build as optimal, correct or complete beyond the
  validation flags.

### Headline Figures

- **FR-012**: The report MUST present the headline set defined by
  [Ship Statistics](../003-ship-statistics/spec.md) — power draw against plant capacity, shield
  strength, armour, damage per second, jump range, top speed and mass — each with its unit and every
  viewing condition that affects it.
- **FR-013**: Every figure MUST be the Almanac result for the active build under the selected
  viewing conditions. The report MUST NOT derive, combine or re-sum a figure the package does not
  return, and MUST NOT show a figure taken from a different build state.
- **FR-014**: The power figure MUST show the package's total draw for the selected hardpoint state
  alongside plant capacity, and MUST identify that state.
- **FR-015**: The damage figure MUST be the package's sustained whole-build damage per second and
  MUST identify itself as sustained.
- **FR-016**: The jump-range figure MUST be the package's range for the selected load state — a
  fuelled tank by default — and MUST identify that state.
- **FR-017**: An unavailable, absent, incomplete or lower-bound figure MUST remain present, retain
  that state with any Almanac diagnostic, and carry a matching finding.
- **FR-018**: Each figure MUST lead to its detailed statistics in one interaction, and the report
  MUST remain available while the Commander outfits the build.
- **FR-019**: The verdict, the findings and every figure MUST update after a build change or a
  relevant viewing-condition change without a manual refresh, and MUST represent one internally
  consistent build state.

### Credits and Materials

- **FR-020**: The report MUST present the catalogue-retail hull value, fitted-module value, rebuy,
  the build's Merc Coin total where FR-020a requires one, and the consolidated engineering-material
  requirement, after the headline figures in that reading order, under the rules in
  [Cost and Materials](../009-cost-and-materials/spec.md).
- **FR-020a**: The Merc Coin total MUST be `ShipLoadout.mercCoinCost()` and MUST be presented as its
  own currency, never added to, converted into or compared with credits or rebuy. It MUST appear only
  when the package recognizes at least one fitted Mercenary article; a build with none MUST show no
  Merc Coin figure, empty state or zero. The application MUST NOT sum, adjust or re-derive the total,
  and MUST NOT carry a recognition rule of its own.
- **FR-021**: Where the package reports unpriced fitted modules, the affected totals MUST be
  identified as lower bounds and a matching finding MUST name the unpriced slots. Where a recognized
  Mercenary article is unpriced, the Merc Coin total MUST be identified as a lower bound on the same
  terms.
- **FR-022**: A build with no ordinary engineering MUST show an empty material requirement rather
  than an unavailable one.
- **FR-023**: Credit, Merc Coin and material entries MUST lead to their detail in one interaction.

### Presentation and Operation

- **FR-024**: The kind and severity of a finding MUST be conveyed by text as well as by any colour,
  icon, shape or position used to distinguish it.
- **FR-025**: A change in the findings MUST be announced once to assistive technology, without
  re-announcing unchanged figures. The announcement MUST be a short summary of the new finding state
  — the count of findings per kind under FR-006 — rather than the finding list or only the findings
  that newly appeared, so that findings clearing is announced as plainly as findings appearing.
  Successive rapid edits MUST settle into one announcement describing the final state, and the
  announcement MUST NOT interrupt what the Commander is reading. Its wording MUST resolve through the
  localisation layer under FR-005.
- **FR-026**: The whole report MUST remain readable and operable at every supported viewport. A long
  finding list or requirement table MAY scroll inside its own container but MUST NOT widen the page.

### Verification Requirements

- **FR-027**: Unit tests MUST compare the verdict with the Almanac validation flags across valid,
  invalid, incomplete and simultaneously invalid-and-incomplete builds.
- **FR-028**: Unit tests MUST prove every finding traces to a package-reported fact, that every
  returned validation issue reaches the report with its code, parameters, severity, slot and
  constraint intact, and MUST fail if a finding is produced without a package fact behind it.
- **FR-028a**: Unit tests MUST prove normalisation provenance survives a reload, clears only for the
  mount the Commander changed, is discarded when the active build is replaced, is absent from every
  save payload, share link and SLEF export, and is never presented as a package finding.
- **FR-029**: Unit tests MUST compare every headline figure with its Almanac result for the selected
  viewing conditions and cover zero, absent, incomplete, invalid, lower-bound and infinite outcomes.
- **FR-030**: Unit tests MUST verify finding wording resolves through the localisation layer for
  every supported locale, that game nouns originate in the package, and that no package English
  fallback text is parsed or rewritten.
- **FR-031**: Unit tests MUST compare the credit, Merc Coin and material summary with the Almanac
  retail, Merc Coin, blueprint-cost, effect-cost and material-summing results, including unpriced
  lower bounds, the empty requirement, a build carrying Mercenary articles and a build carrying none.
- **FR-032**: Unit tests MUST prove that power findings cover both hardpoint states and that a
  viewing-condition change alters only dependent figures and findings.
- **FR-033**: Each primary journey MUST have end-to-end coverage at desktop, tablet and mobile
  viewports in Chromium and Firefox, including automated accessibility checks and an assertion that a
  findings change produces exactly one announcement carrying the new per-kind counts, whether a
  finding appeared or cleared.
- **FR-034**: The SC-006 update budget MUST be asserted end to end in the mobile viewport project
  under 4× CPU throttling, timed from the edit to the updated verdict, findings and figures. CPU
  throttling is available in Chromium only, so the timing assertion runs there while the journey
  itself still runs in both engines under FR-033; the budget MUST NOT be verified by an unthrottled
  run.

## Key Entities

- **Structural verdict**: What the Almanac's valid and complete flags state about the build's
  structure — that it is structurally valid and that its slots are complete. It is not a statement
  about flyability or readiness, which FR-002a reserves for the package-owned result that will
  replace this arrangement. "Structural verdict" is the canonical term across this specification and
  its implementation.
- **Finding**: One package-reported fact about the build, with its kind, the localized wording the
  application composes from the package's code and parameters, and the slot the package associates
  with it.
- **Headline figure**: One Almanac result in the summary set, with its unit, availability state and
  the viewing conditions that affect it.
- **Requirement summary**: The build's catalogue-retail credit values, its Merc Coin total where the
  build carries a recognized Mercenary article, and its consolidated engineering materials. The two
  currencies stay separate results as well as separate presentations.

## Almanac Coverage

`ShipLoadout.validation` supplies the valid and complete flags and the issue collection, each issue
carrying a machine-readable code and parameters and, where the package defines them, a severity, an
affected slot and a constraint. `powerBudget()`, `shieldMetrics()`, `armourMetrics()`,
`weaponMetrics()`, `jumpRangeSummary()`, `mobilityMetrics()` and `unladenMassResult` supply the
headline figures and their availability states; `retailCredits()`, `mercCoinCost()`,
`getBlueprintCost()`, `getExperimentalEffectCost()` and `sumMaterials()` supply the credit, Merc Coin
and material summary, with `FittedModule.preEngineeredVariant` supplying the Mercenary recognition
that decides whether a Merc Coin total is presented at all. The package documents its English issue
text as a log fallback rather than display text, so composing and translating a finding's wording
from the code and parameters is the intended use; game nouns inside that wording remain package text.
No status value in scope requires an application-owned game calculation.

## Assumptions

- "Power consumption / power production" is read as the package's total draw for the selected
  hardpoint state shown against plant capacity. Both hardpoint states remain in the power detail.
- "Shield MJ total" and "Armour total" are read as the package's shield strength and armour
  hit-point totals. Resistances and effective hit points remain in the defence detail.
- "DPS" is read as the package's sustained whole-build damage per second, because it describes
  output the build can hold. Burst output remains in the offence detail.
- "Fuelled jump range" is read as the range for the selected load state, which defaults to unladen —
  a full tank with an empty hold. The maximum-jump figure remains in the mobility detail.
- "Mass (t)" is read as the package's diagnostic unladen mass result, so a missing input stays
  distinguishable from zero.
- "Cost" is catalogue retail — hull, modules and rebuy — alongside the build's Merc Coin total as a
  separate currency. Captured purchase provenance stays with SLEF import and export and is never
  combined with retail.
- "Materials required" is the consolidated requirement for the build's selected blueprints and
  experimental effects, with per-material detail reached from it.
- This is one capability and may be presented on more than one screen; which screens compose it is
  decided at plan time.
- No new `@elite-dangerous-almanac/core` capability is required. Every value and flag named here is
  returned by the installed package.

## Success Criteria

- **SC-001**: The verdict matches the Almanac validation state for every build in the reference
  corpus.
- **SC-002**: Every finding traces to a package-reported fact, and no build produces a finding the
  package's results do not support.
- **SC-003**: Every displayed figure, credit value, Merc Coin value and material quantity equals the
  corresponding Almanac result for the same build and viewing conditions, and no build mixes the two
  currencies into one figure.
- **SC-004**: Every unavailable, incomplete or lower-bound result keeps its reason and is explained
  by a finding; no fabricated zero, estimate or local substitute appears.
- **SC-005**: Every finding the Almanac associates with a slot reaches that slot, and every headline
  figure reaches its detail, in one interaction.
- **SC-006**: A build change updates the verdict, the findings and every affected figure within
  100 ms measured from the edit to the updated report in the mobile end-to-end project under 4× CPU
  throttling in Chromium, with no state mixed from a previous build.
- **SC-007**: No finding's kind or severity is carried by colour, icon, shape or position alone.
- **SC-008**: The complete report passes the required viewport, browser and accessibility test
  matrix without horizontal page scrolling.
