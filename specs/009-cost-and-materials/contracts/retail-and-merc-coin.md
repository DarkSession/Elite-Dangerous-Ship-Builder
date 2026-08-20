# Retail Credits and Merc Coin Contract

## Boundary

The projector receives one captured `{ loadout, buildRevision }`. It imports `ShipLoadout` and
fitted types from `@elite-dangerous-almanac/core/ships/ship-loadout` and uses no package barrel.
Components never call the Almanac or calculate a price.

## Retail transaction

1. Call `loadout.retailCredits()` exactly once for the projection.
2. Preserve its numeric `hull`, `modules`, `rebuy` and returned-order
   `unpriced { slot, symbol }` entries.
3. Classify hull as exact.
4. When `unpriced` is empty, classify modules and rebuy as exact.
5. When `unpriced` is non-empty, classify the literal modules and rebuy values as lower bounds
   associated with every returned entry.
6. Do not add hull and modules, derive the rebuy percentage, sort evidence, or read individual module
   prices to repair the result.

A thrown/integration failure is a whole-projection failure, not a nullable hull/rebuy state. A valid
0.1.4 `RetailCredits` result contains no nullable numeric field.

For presentation, join each exact slot key to the captured `loadout.slots()` record before using
the package slot-name helper. Resolve module names through the package helper. If either lookup fails,
keep the exact raw slot/symbol visible and disclose unavailable game text; never invent a label.

`ShipLoadout.sourcePurchase` and fitted captured `value` fields are not application inputs, retail
fallbacks or presentation values.

## Mercenary transaction

1. Enumerate the captured fitted modules once and retain only entries whose
   `preEngineeredVariant.acquisition === 'mercenary'`.
2. Preserve exact slot, module symbol, variant identity, purchase grade, current engineering grade
   and optional variant `mercCoinCost`.
3. If no entry is recognized, return `absent`; omit the Merc Coin region/summary and do not call or
   present a numeric total.
4. If entries exist, call `loadout.mercCoinCost()` exactly once and preserve that number.
5. A defined per-entry price is exact. A missing optional price is unavailable, never free.
6. The package total is exact only when every recognized entry is priced. Otherwise it is a lower
   bound associated with every missing-price entry.

The purchase variant and its price remain authoritative after later purchase-route grades. Clearing
or replacing engineering follows the new package recognition; the application retains no hidden
purchase history.

## Currency separation

- Credits and Merc Coin use separate domain unions, semantic groups, headings and unit labels.
- No sum, exchange, comparison, percentage, rebuy or favourable/unfavourable relation crosses them.
- Both use active-locale number formatting and translated explicit unit labels; neither uses an
  invented ISO code or the ambiguous reference abbreviation `Mcr`.
- Exact zero is visible only for an applicable package value. It never means missing or absent.

## Verification

Contract tests spy on the captured loadout and prove one retail call, one fitted-module enumeration,
and at most one Merc total call. Fixtures cover fully priced retail, one/all unpriced entries,
returned evidence order, no Mercenary article, one/multiple articles, future missing Merc price,
later purchase-route grade, clearing engineering, exact zero and historical-price exclusion. Every
numeric expected value is the package result, not a hand-computed fixture.
