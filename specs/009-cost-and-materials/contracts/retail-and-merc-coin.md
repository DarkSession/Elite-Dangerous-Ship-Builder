# Retail Credits and Merc Coin Contract

Binding ruling: [../design/reference-review.md](../design/reference-review.md), wave 10.

## Boundary

The projector receives the active `ShipLoadout`. It imports from
`@elite-dangerous-almanac/core/ships/ship-loadout` by leaf subpath and uses no package barrel.
Components never call the Almanac and never calculate a price.

## Retail transaction

1. Call `loadout.retailCredits()` exactly once per projection.
2. Preserve its numeric `hull`, `modules` and `rebuy` verbatim.
3. Compute `total` as `hull + modules`. This is the one permitted credits derivation, ruled A.
4. Do not derive the rebuy percentage from the numbers. `REBUY 5%` is fixed label text taken from the
   canvas.
5. Do not project the returned `unpriced` list, sort it, present it, or read individual module prices
   to repair the result. The canvas draws no evidence for it (ruled F).

`ShipLoadout.sourcePurchase` and fitted captured `value` fields are not application inputs, retail
fallbacks or presentation values.

## Mercenary transaction

1. Enumerate the captured fitted modules once and test each for
   `preEngineeredVariant.acquisition === 'mercenary'`.
2. If none is recognized, the Merc Coin figure is `null`: do not call `mercCoinCost()` and draw no
   row.
3. If any is recognized, call `loadout.mercCoinCost()` exactly once and preserve that number
   literally.

Per-slot Merc Coin pricing, purchase grade and current grade are not projected (ruled C). The
application retains no purchase history: clearing or replacing engineering follows the new package
recognition on the next projection.

## Currency separation

- Credits and Merc Coin are separate fields with separate labels and separate formatters.
- No sum, exchange, comparison, percentage or rebuy relation crosses them. The Merc Coin figure is
  excluded from the material-type and unit counts.
- Neither uses an invented ISO code nor the canvas's `Mcr` abbreviation.
- Exact zero is visible only for an applicable package value. It never stands in for absence — an
  unrecognized Mercenary state omits the row rather than showing `0`.

## Verification

Contract tests spy on the loadout and prove exactly one `retailCredits()` call, one fitted-module
enumeration, and `mercCoinCost()` called once when an article is recognized and never when none is.
Fixtures cover fully priced retail, unpriced modules, no Mercenary article, one and several
articles, a package total of zero with no recognition, and historical-price exclusion. `total` is
asserted against the package `hull` plus the package `modules`, never a hand-computed literal.
