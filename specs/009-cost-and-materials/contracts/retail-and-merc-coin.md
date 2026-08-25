# Retail Credits and Merc Coin Contract

Binding ruling: [../design/reference-review.md](../design/reference-review.md), wave 10.

## Boundary

The projector receives the active `ShipLoadout`. It imports from
`@elite-dangerous-almanac/core/ships/ship-loadout` by leaf subpath and uses no package barrel.
Components never call the Almanac and never calculate a price.

## Retail transaction

1. Call `metrics.buildCost()` exactly once per projection.
2. Preserve its numeric `credits.hull`, `credits.modules`, `credits.total` and `credits.rebuy`
   verbatim.
3. Do not derive the rebuy percentage from the numbers. `REBUY 5%` is fixed label text taken from the
   canvas.
4. Do not project the returned `unpriced` list, sort it, present it, or read individual module prices
   to repair the result. The canvas draws no evidence for it (ruled F).

`ShipLoadout.sourcePurchase` and fitted captured `value` fields are not application inputs, retail
fallbacks or presentation values.

## Merc Coin transaction

1. Read `mercCoins` from that same `buildCost()` result; do not inspect module or engineering
   identities to recognize a charge.
2. If `mercCoins` is zero, project `null` and draw no row.
3. If `mercCoins` is greater than zero, preserve that number literally.

Per-slot Merc Coin pricing, purchase grade and current grade are not projected (ruled C). The
application retains no purchase history: clearing or replacing engineering follows the new package
total on the next projection.

## Currency separation

- Credits and Merc Coin are separate fields with separate labels and separate formatters.
- No sum, exchange, comparison, percentage or rebuy relation crosses them. The Merc Coin figure is
  excluded from the material-type and unit counts.
- Neither uses an invented ISO code nor the canvas's `Mcr` abbreviation.
- A zero package total stands for absence and omits the row rather than showing `0`.

## Verification

Contract tests prove exactly one `buildCost()` call and literal projection of its four credit fields
and Merc Coin total. Fixtures cover fully priced retail, unpriced modules, zero and non-zero Merc
Coin totals, and historical-price exclusion.
