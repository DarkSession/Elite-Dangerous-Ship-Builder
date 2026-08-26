# Feature Specification: Cost and Materials

## Scope

This capability presents current catalogue-retail credits, the current Merc Coin cost and
engineering materials, as canvases 1c and 1d draw them. Historical purchase values are outside the
application model.

## Design ruling (wave 10, 2026-08-22)

Six collisions between this specification and `.design/Ship Builder.dc.html` were surfaced and ruled
on. **The design won all six.** The rulings are recorded in
[design/reference-review.md](./design/reference-review.md) under "Ruled divergences" and are binding
on every requirement below. Do not re-derive them.

In summary: the canvas's `TOTAL` and `REBUY 5%` rows are drawn, the canvas's aggregate counts are
drawn, Merc Coin stays one row at the foot of `MATERIALS`, the material list shows every
consolidated row, and every state the canvas does not draw — material traces, unpriced evidence,
lower-bound, unavailable and missing-recipe wording — is **not built**.

## User Scenarios

### Story 1 — Read costs (P1)

1. Hull, fitted-module, total and rebuy credits match the package build-cost result.
2. When the package reports a Merc Coin charge for the current build, it appears as one row at the
   foot of the materials block.
3. Builds with no package-reported Merc Coin charge show no Merc Coin row.

### Story 2 — Read engineering materials (P1)

1. One consolidated list shows every material's package-localised name, rarity grade and quantity,
   ordered commonest first and then by name.
2. Blueprint cost is cumulative through the selected grade; each experimental effect contributes
   one application.
3. The block states how many blueprints contributed, and closes with the number of material types
   and the total number of units, set at opposite ends of the closing row.

## Requirements

- **FR-001**: Every credit, Merc Coin and material quantity MUST come from
  `@elite-dangerous-almanac/core`. The application MUST NOT calculate a price, a rebuy, a Merc Coin
  cost or a material quantity.

  Ruled exception (wave 10, reconciled with Almanac 0.1.6): the three counts the canvas draws that
  the package does not return — the blueprint count, material-type count and unit total — ARE
  computed by the application by counting package results only. No other derived figure is
  permitted; `TOTAL` is now a package result.

- **FR-002**: Credits MUST use one `BuildMetrics.buildCost().credits` result for hull, modules, total
  and rebuy. The returned `unpriced` list is not presented; the canvas draws no evidence list and
  none is built.
- **FR-003**: Captured or historical purchase values MUST NOT enter build state or cost
  presentation. Catalogue retail MUST remain the sole credits estimate for the current fitted build.
- **FR-004**: Whether the current build has a Merc Coin charge MUST come only from
  `BuildMetrics.buildCost().mercCoins`; the application MUST NOT infer it from module identity,
  acquisition route, blueprint or experimental effect.
- **FR-005**: The Merc Coin figure MUST be the literal `BuildMetrics.buildCost().mercCoins` total,
  presented as one row at the foot of the materials block when greater than zero. Merc Coin MUST NOT
  be added to, converted into or compared with credits or rebuy, and MUST NOT be folded into the
  material-type or unit totals. Per-slot Merc Coin pricing is not presented.
- **FR-006**: The Merc Coin row MUST be absent when the package total is zero. Fitting, removing or
  engineering modules MUST update the row to the package's current build total without retained
  purchase history.
- **FR-007**: The consolidated material identities and quantities MUST be the literal
  `BuildMetrics.buildCost().materials` result. This feature reuses feature 002's `engineeringCost()`
  boundary only to count fitted modules that contribute a cost list and MUST NOT add a second cost
  classifier or consolidation path.
- **FR-008**: A blueprint or effect the package cannot cost contributes nothing to the list. The
  canvas draws no missing-recipe wording and none is built.
- **FR-009**: Fixed pre-engineering MUST contribute no craft cost. A Mercenary purchase grade is a
  purchase, not ordinary crafted engineering; later ordinary grades retain their package material
  cost.
- **FR-010**: Material identity, rarity grade and localised name MUST come from the Almanac.
  Material names are rendered through feature 011's shared game-text primitive, which carries the
  application's own canonical-text fallback and untranslated disclosure; this feature adds no
  game-text handling of its own and MUST NOT maintain game-text translations. (This clause named
  feature 002's material rows as the example to follow. Feature 002 withdrew that list in wave 11 —
  neither canvas draws one — so these rows are now the application's only material list, rendered
  the same way every other game name in it is.)

## Edge Cases

- A build with no engineering shows no material rows and no blueprint count.
- Repeated engineering selections contribute repeatedly before package consolidation.
- Clearing or changing engineering can change the package Merc Coin total; the row follows the
  resulting package state.
- A package Merc Coin total of zero is hidden.
- Unpriced modules lower the package `modules` figure. The canvas draws no qualification for this
  and none is built (ruled, wave 10).

## Almanac Coverage

The package supplies `buildCost()` with credits, Merc Coin and consolidated materials, plus material
rarity and localised material names. Every quantity except the three ruled canvas counts is
package-owned.

## Success Criteria

- **SC-001**: Every price and material quantity, including `TOTAL`, equals its Almanac `buildCost()`
  result.
- **SC-002**: The blueprint count, material-type count and unit total are counted over the package
  result and match it.
- **SC-003**: The rendered blocks match canvases 1c and 1d in content, order and rules: `COST` with
  Hull, Modules, a ruled `TOTAL` and `REBUY 5%`; then, over a rule, `MATERIALS` with its blueprint
  count, every consolidated row in ascending rarity, a ruled type/unit footer and the conditional
  ruled Merc Coin row behind its coin.
- **SC-004**: No application-owned price, rebuy, Merc Coin, recognition or material-consolidation
  rule exists.
