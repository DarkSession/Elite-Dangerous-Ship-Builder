# Feature Specification: Cost and Materials

## Scope

This specification covers catalogue-retail hull, module and rebuy values, the Merc Coin prices of
purchased pre-engineered modules, and the engineering materials required by the active build. It
inherits the statistic rules in [Ship Statistics](../003-ship-statistics/spec.md).

Captured purchase prices remain separate provenance handled by
[SLEF Import and Export](../004-slef-export/spec.md). Engineering choices are made in
[Module Outfitting and Engineering](../002-module-outfitting/spec.md).

## Clarifications

### Session 2026-08-17

- Q: Should the app add up Merc Coin itself to show a build total, or only show each module's Merc
  Coin price until the Almanac package supplies a total? → A: Show each module's Merc Coin price
  against its slot; no application-computed total. Request a package-computed total upstream and
  keep the build total unavailable until the package supplies it
- Q: When a Commander has upgraded a purchased Merc-Coin module beyond grade 1 at an engineer, should
  its Merc Coin price still be shown? → A: Yes, at any grade. The purchase grade is not craftable, so
  the Merc Coin price is owed regardless of the grade now fitted, and the crafted grades keep costing
  materials
- Q: When a build fits no Merc-Coin modules at all, should the Merc Coin figure be hidden entirely or
  shown as "none required"? → A: Hidden entirely; the figure appears only when at least one fitted
  module carries a Merc-Coin variant
- Q: Given the package will not confirm a fitted article was purchased, on what basis should the app
  decide that a fitted module was bought with Merc Coin? → A: Its selected engineering blueprint is
  one the package marks as a Mercenary-route recipe. Those recipes carry no grade-1 cost and are
  obtainable only by that purchase, so the inference holds for imported builds too; the
  identification is added to the upstream request
- Q: Should the credit and rebuy figures flag that a Merc-Coin module is being counted at the stock
  article's credit list price? → A: No. Credit and rebuy values are presented exactly as the package
  returns them, with no adjustment and no disclaimer or disclosure anywhere

## User Scenarios & Testing

### User Story 1 - Read credit and Merc Coin costs (Priority: P1)

A Commander can see the build's catalogue-retail hull value, fitted-module value and rebuy, and the
Merc Coin price of any module that can only be bought with it.

**Independent Test**: Compare assembled and imported reference builds with `retailCredits()`,
including unpriced modules, an unknown hull, and modules carrying Mercenary-route blueprints at and
above their purchase grade.

**Acceptance Scenarios**:

1. **Given** an active build, **When** cost is shown, **Then** hull, module and rebuy values match
   the package's retail-credit result.
2. **Given** unpriced fitted modules, **When** cost is shown, **Then** every unpriced slot is named
   and the affected returned totals are identified as lower bounds.
3. **Given** captured purchase values, **When** cost is shown, **Then** they are clearly separate
   from catalogue retail and are never combined with it.
4. **Given** an unknown hull, **When** cost is shown, **Then** the null hull and rebuy values remain
   unavailable rather than becoming zero.
5. **Given** a fitted module carrying a Mercenary-route blueprint, **When** cost is shown, **Then**
   the package's Merc Coin price for the matching variant appears against that slot, as its own
   currency and never combined with credits.
6. **Given** that module engineered above its purchase grade, **When** cost is shown, **Then** its
   Merc Coin price remains shown and the crafted grades still contribute their materials.
7. **Given** a build carrying no Mercenary-route blueprint, **When** cost is shown, **Then** no Merc
   Coin figure, empty state or zero appears.
8. **Given** a fitted Merc-Coin module, **When** credits are shown, **Then** the hull, module and
   rebuy values remain exactly the package's result, with no adjustment and no advisory.

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
- A Merc-Coin article shares its module symbol with the stock article, so the package cannot confirm
  which was purchased; the Mercenary-route blueprint is what recognizes it. Retail credits continue
  to price that slot as the stock article, and that figure stands unaltered and unremarked.
- A Merc-Coin module may be engineered to any grade above its purchase grade; the purchase is owed
  once regardless, and only the crafted grades add materials.
- No build-level Merc Coin total exists while the package supplies none, however many Merc-Coin
  modules are fitted.

## Requirements

### Functional Requirements

- **FR-001**: Every credit, Merc Coin and material quantity MUST come from
  `@elite-dangerous-almanac/core`. The application MUST NOT total catalogue prices, calculate rebuy
  or sum material or Merc Coin quantities itself.
- **FR-002**: Credit presentation MUST use `ShipLoadout.retailCredits()` for hull, modules, rebuy and
  unpriced-module results.
- **FR-003**: `unpriced` entries MUST remain visible and the returned module and rebuy values MUST
  be labelled as lower bounds whenever that collection is non-empty.
- **FR-004**: Source purchase values MUST remain separate from retail values and retain their source
  meaning.
- **FR-004a**: A fitted module MUST be recognized as a Merc-Coin purchase when its selected
  engineering blueprint is one the package marks as a Mercenary-route recipe, at whatever grade is
  fitted. Those recipes carry no purchase-grade cost and are obtainable only through that purchase.
  The package does not identify a fitted article as purchased, so this recognition is the
  application's and MUST be removed once
  [#285](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/285) lands.
- **FR-004b**: A recognized Merc-Coin purchase MUST show its Merc Coin price against its slot. Merc
  Coin MUST be presented as its own currency and MUST NOT be added to, converted into or compared
  with credits or rebuy.
- **FR-004c**: The Merc Coin price MUST be the package's `mercCoinCost` for the mercenary
  pre-engineered variant matching that module symbol and blueprint. The application MUST NOT carry a
  price of its own, and a recognized purchase the package does not price MUST be reported as
  unavailable rather than treated as free.
- **FR-004d**: The Merc Coin price MUST remain shown after the module is engineered above its
  purchase grade, and the crafted grades' material cost MUST continue to come from
  `getBlueprintCost()`.
- **FR-004e**: The application MUST NOT total Merc Coin across the build. A build-level Merc Coin
  total MUST come from `@elite-dangerous-almanac/core`, and MUST remain unavailable until
  [#286](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/286) lands.
- **FR-004f**: Merc Coin MUST be presented only when at least one fitted module is recognized as a
  Merc-Coin purchase. A build with none MUST NOT show a Merc Coin figure, empty state or zero.
- **FR-004g**: Credit and rebuy values MUST be presented exactly as `retailCredits()` returns them
  when a Merc-Coin module is fitted. The application MUST NOT exclude, adjust or re-derive them, and
  MUST NOT attach an advisory about that slot being priced as the stock article.
- **FR-005**: Each ordinary blueprint MUST use `getBlueprintCost()` for the complete cost to the
  selected grade. Each experimental effect MUST use `getExperimentalEffectCost()`.
- **FR-006**: The final material quantities MUST be produced by the package's `sumMaterials()` over
  those package-returned cost lists. The application MAY retain which fitted selections supplied
  each input list for traceability but MUST NOT alter the quantities.
- **FR-007**: A missing cost list MUST be reported against its blueprint or effect and MUST NOT be
  replaced with an empty list.
- **FR-008**: Pre-engineered modifications MUST contribute no craft cost unless the package returns
  a separately selected blueprint — ordinary or Mercenary-route — or experimental effect for the
  fitted module. A Merc Coin price is a purchase price, not a craft cost.
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
- **FR-012a**: Unit tests MUST cover every Mercenary-route recipe the package publishes, at the
  purchase grade and above it, and MUST verify that each shown price equals the package's
  `mercCoinCost`, that no build-level Merc Coin total is produced, that a build with no such module
  shows nothing, and that credit and rebuy values are unchanged and unannotated by the presence of a
  Merc-Coin module.
- **FR-013**: Unit tests MUST compare every material quantity with the result of
  `getBlueprintCost()`, `getExperimentalEffectCost()` and `sumMaterials()` across repeated recipes,
  grades, effects, missing costs and pre-engineered modules.
- **FR-014**: Unit tests MUST verify material names originate in the package for every supported
  locale and that missing translations never create a missing material.
- **FR-015**: Each primary journey MUST have end-to-end coverage at desktop, tablet and mobile
  viewports in Chromium and Firefox, including automated accessibility checks.

## Key Entities

- **Retail cost summary**: The package's hull, module, rebuy and unpriced-module result.
- **Merc Coin purchase**: A fitted module recognized by its Mercenary-route blueprint, paired with
  the package Merc Coin price of the matching pre-engineered variant.
- **Material requirement**: One package material and the summed quantity required by the build's
  selected ordinary engineering.
- **Material source**: A fitted module's selected blueprint grade or experimental effect that
  supplied a package cost list.

## Almanac Coverage

`ShipLoadout.retailCredits()` computes all required credit values and lower-bound state.
`getBlueprintCost()` computes cumulative grade costs, `getExperimentalEffectCost()` supplies effect
costs and `sumMaterials()` performs consolidation. Material identity, grade and localized names are
package data. No application-owned credit or material calculation is needed.

Merc Coin prices are package data on the mercenary pre-engineered variants, and the package marks
their bespoke recipes as Mercenary-route. Two capabilities are absent and are raised upstream:

- [#285](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/285) — the package does not
  identify a fitted article as a Merc-Coin purchase. A mercenary variant shares its symbol with the
  stock article and carries no modifier signature, so `preEngineeredVariant` resolves to `null` for
  every one of them. Until it lands, the application recognizes the purchase from the Mercenary-route
  blueprint, which is sound because those recipes have no purchase-grade cost and no other route
  grants them. FR-004a's recognition MUST be removed when it lands.
- [#286](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/286) — the package computes no
  build-level Merc Coin total. None is shown until it does; the application does not sum the prices
  itself.

## Success Criteria

- **SC-001**: Every credit and material quantity equals the corresponding Almanac result across the
  reference corpus.
- **SC-002**: Every unpriced module and missing engineering cost remains visible; none silently
  contributes zero.
- **SC-003**: Every material is traceable to at least one fitted engineering selection.
- **SC-004**: No application-owned price, rebuy, Merc Coin or material-total calculation exists.
- **SC-005**: The full area passes the required viewport, browser and accessibility test matrix
  without horizontal page scrolling.
- **SC-006**: Every shown Merc Coin price equals the package's value for the matching pre-engineered
  variant, and the credit and rebuy figures are exactly the package's result whether or not a
  Merc-Coin module is fitted.
