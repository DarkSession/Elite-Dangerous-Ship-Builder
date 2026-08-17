# Feature Specification: Cost and Materials

## Scope

This capability presents catalogue-retail credits, Merc Coin purchases and engineering materials.
Captured purchase provenance belongs to [004](../004-slef/spec.md).

## User Scenarios

### Story 1 — Read costs (P1)

1. Hull, fitted-module and rebuy credits match the package retail result.
2. Unpriced modules remain named and affected totals are lower bounds.
3. Each package-recognized Mercenary article shows its Merc Coin price by slot and the package build
   total; Merc Coin is never combined with credits.
4. An unpriced recognized article remains unavailable and makes the package total a lower bound.
5. Builds with no recognized Mercenary article show no Merc Coin value or empty state.

### Story 2 — Read engineering materials (P1)

1. One consolidated list shows material identity, package-localised name, grade and quantity.
2. Blueprint cost is cumulative through the selected grade; each experimental effect contributes
   one application.
3. Each material traces to the fitted engineering selections that supplied its package cost lists.
4. Missing recipe cost remains unavailable; no ordinary engineering produces an empty list.

## Requirements

- **FR-001**: Every credit, Merc Coin and material quantity MUST come from
  `@elite-dangerous-almanac/core`. The application MUST NOT calculate price, rebuy, Merc Coin or
  material totals.
- **FR-002**: Credits MUST use `ShipLoadout.retailCredits()` for hull, modules, rebuy and unpriced
  slots. Non-empty `unpriced` MUST qualify module and rebuy totals as lower bounds.
- **FR-003**: Source-purchase values MUST remain separate from catalogue retail and retain their
  source meaning.
- **FR-004**: A Mercenary purchase MUST be recognized only when
  `FittedModule.preEngineeredVariant` reports acquisition `mercenary`.
- **FR-005**: Per-slot Merc Coin price MUST use the resolved variant's `mercCoinCost`; build total
  MUST use `ShipLoadout.mercCoinCost()`. Merc Coin MUST NOT be added to, converted into or compared
  with credits or rebuy. A recognized article without `mercCoinCost` MUST be unavailable rather than
  free; the package total MUST be labelled a lower bound and MUST name every unpriced slot.
- **FR-006**: Merc Coin presentation MUST appear only while at least one fitted module is recognized
  as a Mercenary article. Current ordinary grade MUST NOT change the package purchase price.
- **FR-007**: Blueprint costs MUST use `getBlueprintCost()` through the selected grade; effect costs
  MUST use `getExperimentalEffectCost()`; consolidation MUST use `sumMaterials()`.
- **FR-008**: Missing blueprint or effect cost MUST be named and MUST NOT become an empty list.
- **FR-009**: Fixed pre-engineering MUST contribute no craft cost. A Mercenary purchase grade is a
  purchase, not ordinary crafted engineering; later ordinary grades retain their package material
  cost.
- **FR-010**: Material identity, grade and localised name MUST come from the Almanac. If the package
  lacks the active locale, its canonical English name MUST remain visible and be identified as
  untranslated; the application MUST NOT maintain game-text translations.

## Edge Cases

- One or every fitted module may be unpriced; package lower bounds remain useful.
- Repeated engineering selections contribute repeatedly before package consolidation.
- Clearing engineering may make a Mercenary variant unrecognizable; Merc Coin presentation follows
  the resulting package state.
- A recognized Mercenary article without a package price remains unavailable and makes the package
  total a lower bound.
- A package Merc Coin total of zero is hidden when no Mercenary article is recognized.

## Almanac Coverage

The package supplies `retailCredits()`, `mercCoinCost()`, fitted Mercenary recognition, blueprint
and effect costs, `sumMaterials()` and localised material names. Every required quantity and
recognition decision is package-owned.

## Success Criteria

- **SC-001**: Every price and material quantity equals its Almanac result.
- **SC-002**: Every unpriced credit or Merc Coin entry and every missing recipe cost remains visible.
- **SC-003**: Every material traces to at least one fitted engineering selection.
- **SC-004**: No application-owned price, total or Mercenary-recognition rule exists.
