# Retail Credits and Merc Coin Contract

## Boundary

The projector accepts one captured `ShipLoadout` and revision. It imports `ShipLoadout` types from
`@elite-dangerous-almanac/core/ships/ship-loadout` and does not import a package barrel. Components do
not call package methods.

## Retail transaction

1. Call `retailCredits()` exactly once.
2. Preserve `hull`, `modules`, `rebuy` and every ordered `unpriced { slot, symbol }` record.
3. `hull: null` and `rebuy: null` are unavailable, never zero.
4. With no unpriced modules, non-null modules/rebuy values are exact.
5. With any unpriced module, modules and non-null rebuy are lower bounds naming every unpriced record.
6. Do not calculate a hull-plus-modules total or recalculate rebuy.

The presenter may resolve package slot/module names. If a module name cannot be resolved, it keeps the
exact symbol visible. It never substitutes a captured `value` or `sourcePurchase` field.

## Mercenary transaction

1. Enumerate current fitted modules and retain only
   `preEngineeredVariant.acquisition === 'mercenary'`.
2. Preserve exact slot, symbol, variant blueprint/grade and optional `mercCoinCost` for each.
3. If the collection is empty, return `absent`; do not present a zero, heading or empty state and do
   not use blueprint/module inference to create an entry.
4. If present, call `mercCoinCost()` exactly once and preserve its number.
5. Each defined variant price is exact. Each missing price is unavailable, never free.
6. The total is exact only when every entry is priced; otherwise it is a lower bound with every
   unpriced entry.

The current ordinary grade cannot change the purchase price. Package recognition after an edit is
authoritative: when it disappears, so does the entry.

## Currency separation

- Credits and Merc Coin occupy separate semantic groups and result types.
- No sum, exchange, comparison, percentage, rebuy or favorable/unfavorable relation crosses them.
- Both use active-locale numeric formatting and separate translated unit labels; neither is mapped to
  an invented ISO currency.
- Exact numeric zero remains visible only for an applicable package value. It never stands for
  absence or missing price.

## Failure behavior

An unexpected package exception makes the current projection unavailable and cannot relabel the last
settled snapshot as current. A later successful matching revision replaces it atomically. There is no
local clamp, fallback price or repair.

## Verification

Contract tests spy on the captured loadout and prove one call per method. Fixtures cover fully priced,
one/all unpriced, unknown hull, no Mercenary article, multiple recognized articles, future missing
Merc price, later grade, clearing engineering, exact zero and source-purchase separation. Every numeric
assertion deep-equals the package result.
