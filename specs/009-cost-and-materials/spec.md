# Feature Specification: Cost and Materials

## Scope

This specification covers catalogue-retail hull, module and rebuy values, the Merc Coin prices of
purchased pre-engineered modules, and the engineering materials required by the active build. It
inherits the statistic rules in [Ship Statistics](../003-ship-statistics/spec.md).

Captured purchase prices remain separate provenance handled by
[SLEF Import and Export](../004-slef-export/spec.md). Engineering choices are made in
[Module Outfitting and Engineering](../002-module-outfitting/spec.md).

## Clarifications

### Session 2026-08-17 — Almanac 0.1.0-beta.11

Recorded while the package neither identified a fitted Mercenary article nor totalled Merc Coin. The
first and fourth answers below are superseded by the beta.12 session that follows; the rest stand.

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

### Session 2026-08-17 — Almanac 0.1.0-beta.12

Both upstream requests this area was waiting on landed in `0.1.0-beta.12`, which retires the two
decisions above that existed only because they were open.

- Q: [#285](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/285) has landed — the
  package now resolves a fitted Mercenary article to its variant. Does the application keep its own
  recognition rule? → A: No. It is removed exactly as FR-004a required. Recognition is
  `FittedModule.preEngineeredVariant` reporting an acquisition of `mercenary`, and the application
  infers nothing from the blueprint itself
- Q: [#286](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/286) has landed as
  `ShipLoadout.mercCoinCost()` rather than a `mercCoin` field on `retailCredits()`. Is a build total
  now shown? → A: Yes, from that method. `retailCredits()` is unchanged and still carries credits
  only, so the two currencies stay separate results as well as separate presentations
- Q: The package reports the purchase grade on the variant while the fitted module keeps its current
  grade. Which grade does the Merc Coin price belong to? → A: The purchase grade on the variant. The
  price is what the article cost in the shop and does not move with later engineering, which is the
  same answer the earlier session gave for its own reasons
- Q: Clearing a Mercenary article's engineering removes its identity in the package, so its
  `preEngineeredVariant` reads `null`. Should the application still show the price? → A: No. With no
  package identity there is no recognized purchase, and the figure disappears with it

## User Scenarios & Testing

### User Story 1 - Read credit and Merc Coin costs (Priority: P1)

A Commander can see the build's catalogue-retail hull value, fitted-module value and rebuy, the Merc
Coin price of any module that can only be bought with it, and what the build's Mercenary purchases
cost in total.

**Independent Test**: Compare assembled and imported reference builds with `retailCredits()` and
`mercCoinCost()`, including unpriced modules, an unknown hull, and Mercenary articles at and above
their purchase grade.

**Acceptance Scenarios**:

1. **Given** an active build, **When** cost is shown, **Then** hull, module and rebuy values match
   the package's retail-credit result.
2. **Given** unpriced fitted modules, **When** cost is shown, **Then** every unpriced slot is named
   and the affected returned totals are identified as lower bounds.
3. **Given** captured purchase values, **When** cost is shown, **Then** they are clearly separate
   from catalogue retail and are never combined with it.
4. **Given** an unknown hull, **When** cost is shown, **Then** the null hull and rebuy values remain
   unavailable rather than becoming zero.
5. **Given** a fitted module the package identifies as a Mercenary article, **When** cost is shown,
   **Then** that variant's Merc Coin price appears against its slot, as its own currency and never
   combined with credits.
6. **Given** that module engineered above its purchase grade, **When** cost is shown, **Then** its
   Merc Coin price remains shown unchanged and the crafted grades still contribute their materials.
7. **Given** a build carrying no Mercenary article, **When** cost is shown, **Then** no Merc Coin
   figure, empty state or zero appears.
8. **Given** a fitted Merc-Coin module, **When** credits are shown, **Then** the hull, module and
   rebuy values remain exactly the package's result, with no adjustment and no advisory.
9. **Given** one or more Mercenary articles, **When** cost is shown, **Then** the build's Merc Coin
   total is the package's `mercCoinCost()` and is never added to or compared with any credit figure.
10. **Given** a Mercenary article whose engineering is then cleared, **When** cost is shown, **Then**
    the package no longer identifies it, and its price leaves both its slot and the build total.

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
- A Merc-Coin article shares its module symbol with the stock article, so the package identifies it
  from the purchase-exclusive blueprint rather than from a modifier signature. Retail credits
  continue to price that slot as the stock article, and that figure stands unaltered and unremarked.
- A Merc-Coin module may be engineered to any grade above its purchase grade; the purchase is owed
  once regardless, and only the crafted grades add materials. The variant the package returns carries
  the purchase grade even while the module sits at a higher fitted grade.
- Clearing a Mercenary article's engineering removes the package's identification of it, so its
  price stops being shown and stops counting toward the build total.
- A build with no Mercenary article has a package total of zero. Zero is not a figure to show; the
  Merc Coin presentation is absent instead.

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
- **FR-004a**: A fitted module MUST be recognized as a Merc-Coin purchase from the package alone:
  `FittedModule.preEngineeredVariant` resolves and reports an acquisition of `mercenary`. The
  application MUST NOT infer the purchase from the blueprint, the module symbol or anything else, and
  MUST NOT keep a recognition rule of its own.
- **FR-004b**: A recognized Merc-Coin purchase MUST show its Merc Coin price against its slot. Merc
  Coin MUST be presented as its own currency and MUST NOT be added to, converted into or compared
  with credits or rebuy.
- **FR-004c**: The Merc Coin price MUST be the `mercCoinCost` on the variant the package resolved for
  that fitted module. The application MUST NOT carry a price of its own, and a recognized purchase
  the package does not price MUST be reported as unavailable rather than treated as free.
- **FR-004d**: The Merc Coin price MUST remain shown, and unchanged, after the module is engineered
  above its purchase grade. The variant reports the purchase grade rather than the fitted grade, and
  the crafted grades' material cost MUST continue to come from `getBlueprintCost()`.
- **FR-004e**: A build-level Merc Coin total MUST be `ShipLoadout.mercCoinCost()`. The application
  MUST NOT sum, adjust or re-derive it. `retailCredits()` carries no Merc Coin figure, so the two
  currencies MUST stay separate results as well as separate presentations.
- **FR-004e-i**: The package's total counts an unpriced purchase as zero, which FR-004c will not let
  the application present as a price. Where any recognized purchase in the build is unpriced, the
  total MUST be labelled a lower bound and the unpriced slots named, exactly as FR-003 requires of
  credits. The application MUST NOT substitute its own total, and MUST NOT show the figure as
  complete. Every published variant is currently priced, so this is a guard rather than a live case.
- **FR-004f**: Merc Coin MUST be presented only when at least one fitted module is recognized as a
  Merc-Coin purchase. A build with none MUST NOT show a Merc Coin figure, empty state or zero, and
  the package's total of zero MUST NOT be presented as a value.
- **FR-004g**: Credit and rebuy values MUST be presented exactly as `retailCredits()` returns them
  when a Merc-Coin module is fitted. The application MUST NOT exclude, adjust or re-derive them, and
  MUST NOT attach an advisory about that slot being priced as the stock article.
- **FR-004h**: Where the package stops identifying a fitted module as a Mercenary article — clearing
  its engineering does exactly this — its Merc Coin price MUST stop being shown and MUST stop
  counting toward the build total. The application MUST NOT retain a purchase the package no longer
  reports.
- **FR-005**: Each ordinary blueprint MUST use `getBlueprintCost()` for the complete cost to the
  selected grade. Each experimental effect MUST use `getExperimentalEffectCost()`.
- **FR-006**: The final material quantities MUST be produced by the package's `sumMaterials()` over
  those package-returned cost lists. The application MAY retain which fitted selections supplied
  each input list for traceability but MUST NOT alter the quantities.
- **FR-007**: A missing cost list MUST be reported against its blueprint or effect and MUST NOT be
  replaced with an empty list.
- **FR-008**: Pre-engineered modifications MUST contribute no craft cost unless the package returns a
  separately selected blueprint or experimental effect for the fitted module. A Merc Coin price is a
  purchase price, not a craft cost.
- **FR-008a**: A Mercenary article's own purchase grade MUST contribute no material cost and MUST NOT
  be reported as a missing cost list under FR-007. The package publishes no cost for it because it is
  bought rather than crafted, and its blueprint offers the crafted grades above it. Only those
  crafted grades MUST draw on `getBlueprintCost()`.
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
- **FR-012a**: Unit tests MUST cover every Mercenary article the package publishes, at the purchase
  grade and — for every article whose blueprint offers a grade above it — above it too. Three
  articles have no craftable grade at all, because the package reports no blueprint for their module;
  covering those at the purchase grade alone satisfies this. The tests MUST verify that each shown
  price equals the resolved variant's `mercCoinCost`, that the build total equals `mercCoinCost()`,
  that clearing the engineering removes both, that a build with no such module shows nothing rather
  than zero, and that credit and rebuy values are unchanged and unannotated by the presence of a
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
- **Merc Coin purchase**: A fitted module whose package-resolved pre-engineered variant has an
  acquisition of `mercenary`, paired with that variant's Merc Coin price and purchase grade.
- **Material requirement**: One package material and the summed quantity required by the build's
  selected ordinary engineering.
- **Material source**: A fitted module's selected blueprint grade or experimental effect that
  supplied a package cost list.

## Almanac Coverage

`ShipLoadout.retailCredits()` computes all required credit values and lower-bound state.
`getBlueprintCost()` computes cumulative grade costs, `getExperimentalEffectCost()` supplies effect
costs and `sumMaterials()` performs consolidation. Material identity, grade and localized names are
package data. No application-owned credit or material calculation is needed.

Merc Coin is package data throughout, and `0.1.0-beta.12` closed the two gaps this area was waiting
on. `FittedModule.preEngineeredVariant` now resolves for a Mercenary article — identified by the
blueprint available only to that purchase, and surviving a later grade upgrade — and carries the
purchase grade and its `mercCoinCost`. `ShipLoadout.mercCoinCost()` totals those prices across the
build. The application-owned recognition rule that stood in for the first is gone, and no Merc Coin
calculation is application-owned.

`retailCredits()` is unchanged by that release: it still returns hull, module, rebuy and unpriced
results in credits only. The build's Merc Coin total is a separate package result, which is what
keeps the two currencies from meeting.

## Success Criteria

- **SC-001**: Every credit and material quantity equals the corresponding Almanac result across the
  reference corpus.
- **SC-002**: Every unpriced module and missing engineering cost remains visible; none silently
  contributes zero.
- **SC-003**: Every material is traceable to at least one fitted engineering selection.
- **SC-004**: No application-owned price, rebuy, Merc Coin or material-total calculation exists, and
  no application-owned rule decides that a fitted module was a Mercenary purchase.
- **SC-005**: The full area passes the required viewport, browser and accessibility test matrix
  without horizontal page scrolling.
- **SC-006**: Every shown Merc Coin price equals the resolved variant's value, the build total equals
  `mercCoinCost()`, and the credit and rebuy figures are exactly the package's result whether or not
  a Merc-Coin module is fitted.
