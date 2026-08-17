# Feature Specification: Cost and Materials

## Scope

This specification covers catalogue-retail hull, module and rebuy values and the engineering
materials required by the active build. It inherits the statistic rules in
[Ship Statistics](../003-ship-statistics/spec.md).

Captured purchase prices remain separate provenance handled by
[SLEF Import and Export](../004-slef-export/spec.md). Engineering choices are made in
[Module Outfitting and Engineering](../002-module-outfitting/spec.md).

## User Scenarios & Testing

### User Story 1 - Read credit costs (Priority: P1)

A Commander can see the build's catalogue-retail hull value, fitted-module value and rebuy.

**Independent Test**: Compare assembled and imported reference builds with `retailCredits()`,
including unpriced modules and an unknown hull.

**Acceptance Scenarios**:

1. **Given** an active build, **When** cost is shown, **Then** hull, module and rebuy values match
   the package's retail-credit result.
2. **Given** unpriced fitted modules, **When** cost is shown, **Then** every unpriced slot is named
   and the affected returned totals are identified as lower bounds.
3. **Given** captured purchase values, **When** cost is shown, **Then** they are clearly separate
   from catalogue retail and are never combined with it.
4. **Given** an unknown hull, **When** cost is shown, **Then** the null hull and rebuy values remain
   unavailable rather than becoming zero.

### User Story 2 - Read engineering materials (Priority: P1)

A Commander can see one consolidated shopping list for the selected blueprints and experimental
effects in the build.

**Independent Test**: Build a material list containing repeated blueprints, several grades, effects
and pre-engineered modules and compare it with the Almanac cost and material-summing functions.

**Acceptance Scenarios**:

1. **Given** engineered modules, **When** materials are shown, **Then** each material has its
   package identity, localized package name, grade and total required quantity.
2. **Given** a selected blueprint grade, **When** its cost is included, **Then** it uses the
   package's complete cost from unengineered to that grade.
3. **Given** an experimental effect, **When** its cost is included, **Then** the package's
   one-application cost contributes to the consolidated result.
4. **Given** a material entry, **When** its detail is opened, **Then** the fitted modules and
   engineering selections that supplied its input lists are identifiable.
5. **Given** an unknown recipe cost, **When** materials are shown, **Then** the affected blueprint
   or effect is named as unavailable and does not silently contribute zero.
6. **Given** no ordinary engineering, **When** materials are shown, **Then** the list is empty rather
   than unavailable. Pre-engineered modifications add no crafting cost.

### Edge Cases

- One or every module may be unpriced; package totals remain useful lower bounds.
- Repeated engineering selections contribute repeatedly before the package sums material lists.
- Partial imported engineering quality has already been normalized to a completed grade.
- A missing localized material name uses the package's canonical English name and is marked as
  untranslated; the application does not maintain a private game-text translation.

## Requirements

### Functional Requirements

- **FR-001**: Every credit and material quantity MUST come from
  `@elite-dangerous-almanac/core`. The application MUST NOT total catalogue prices, calculate rebuy
  or sum material quantities itself.
- **FR-002**: Credit presentation MUST use `ShipLoadout.retailCredits()` for hull, modules, rebuy and
  unpriced-module results.
- **FR-003**: `unpriced` entries MUST remain visible and the returned module and rebuy values MUST
  be labelled as lower bounds whenever that collection is non-empty.
- **FR-004**: Source purchase values MUST remain separate from retail values and retain their source
  meaning.
- **FR-005**: Each ordinary blueprint MUST use `getBlueprintCost()` for the complete cost to the
  selected grade. Each experimental effect MUST use `getExperimentalEffectCost()`.
- **FR-006**: The final material quantities MUST be produced by the package's `sumMaterials()` over
  those package-returned cost lists. The application MAY retain which fitted selections supplied
  each input list for traceability but MUST NOT alter the quantities.
- **FR-007**: A missing cost list MUST be reported against its blueprint or effect and MUST NOT be
  replaced with an empty list.
- **FR-008**: Pre-engineered modifications MUST contribute no craft cost unless the package returns
  a separately selected ordinary blueprint or experimental effect for the fitted module.
- **FR-009**: Material identity, grade and localized name MUST come from the Almanac material and
  localization catalogues.
- **FR-010**: Where the package has no name for the active locale, the package's canonical English
  name MUST remain visible and be marked as untranslated. The application MUST NOT translate
  material names privately.
- **FR-011**: Cost and material detail MUST remain operable and readable at every supported viewport
  without horizontal page scrolling.

### Verification Requirements

- **FR-012**: Unit tests MUST compare credit presentation with `retailCredits()` across assembled,
  imported, unpriced and unknown-hull cases.
- **FR-013**: Unit tests MUST compare every material quantity with the result of
  `getBlueprintCost()`, `getExperimentalEffectCost()` and `sumMaterials()` across repeated recipes,
  grades, effects, missing costs and pre-engineered modules.
- **FR-014**: Unit tests MUST verify material names originate in the package for every supported
  locale and that missing translations never create a missing material.
- **FR-015**: Each primary journey MUST have end-to-end coverage at desktop, tablet and mobile
  viewports in Chromium and Firefox, including automated accessibility checks.

## Key Entities

- **Retail cost summary**: The package's hull, module, rebuy and unpriced-module result.
- **Material requirement**: One package material and the summed quantity required by the build's
  selected ordinary engineering.
- **Material source**: A fitted module's selected blueprint grade or experimental effect that
  supplied a package cost list.

## Almanac Coverage

`ShipLoadout.retailCredits()` computes all required credit values and lower-bound state.
`getBlueprintCost()` computes cumulative grade costs, `getExperimentalEffectCost()` supplies effect
costs and `sumMaterials()` performs consolidation. Material identity, grade and localized names are
package data. No application-owned cost calculation is needed.

## Success Criteria

- **SC-001**: Every credit and material quantity equals the corresponding Almanac result across the
  reference corpus.
- **SC-002**: Every unpriced module and missing engineering cost remains visible; none silently
  contributes zero.
- **SC-003**: Every material is traceable to at least one fitted engineering selection.
- **SC-004**: No application-owned price, rebuy or material-total calculation exists.
- **SC-005**: The full area passes the required viewport, browser and accessibility test matrix
  without horizontal page scrolling.
