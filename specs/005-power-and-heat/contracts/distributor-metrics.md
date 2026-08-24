# Distributor Metrics Contract

> **Rewritten 2026-08-24 (wave 13).** Feature 003's ruling C withdrew the shared
> `ViewingConditions`, so there are no integer half-pips to halve and no shared
> draft to settle. Feature 005 owns the allocation itself, in pips, and the
> artboard's own four blocks are the control.

## Boundary

Feature 005 holds the allocation in `PowerConditionsStore` and calls:

```ts
const result = loadout.distributorMetrics({
  systemsPips: conditions.pips.systems,
  enginesPips: conditions.pips.engines,
  weaponsPips: conditions.pips.weapons,
});
```

Use `DistributorOptions` from
`@elite-dangerous-almanac/core/ships/ship-loadout` and result types from
`@elite-dangerous-almanac/core/ships/distributor`. The application never
calls the standalone calculator or recharge scaler.

## Input ownership

The package takes any fraction from `0` to `4` per bank and asks for no total, so
what it does not impose, the store does — because it is what happens in the ship:

- `0`–`4` per bank on a half-pip step, six between the three;
- the opening allocation is an even `2 · 2 · 2`, which favours no bank. The
  artboard draws a different allocation in each canvas — `2 · 1 · 3` on 1c and
  `3 · 1 · 2` on 1d — so neither is _the_ opening state, and both come to six;
- setting one bank moves the other two to pay for it: from `2 · 2 · 2`, three in
  `SYS` leaves `1.5` in each of the others. The remainder is split in the
  evenly between them, and each lands on a half pip;
- pressing the block a bank already stands on steps it back one, which is the only
  way down to none through four blocks that each name a count.

There is no draft, no Apply, no Reset, no running total, no validation and no
error state: every change takes effect immediately, and every allocation the
control can reach is one the package answers for. Nothing is persisted.

## Ready mapping

When the package returns a result, present SYS, ENG and WEP in that order:

| View field      | Package source                      |
| --------------- | ----------------------------------- |
| capacity        | matching capacitor `.capacity`      |
| rated recharge  | matching capacitor `.ratedRecharge` |
| actual recharge | matching capacitor `.rechargeRate`  |
| allocation used | matching `result.pips` field        |

All figures are copied. A pip change may alter actual recharge; the application
does not compute or assert a capacity transformation.

## Availability and zero

`null` maps to one `unavailable` result with no capacitor figures. Null alone
does not authorize a cause-specific diagnosis: it may reflect an absent,
disabled, package-incomplete or retracted-shed distributor. Unknown catalogue identities have
no supported ingress representation and never reach this boundary.

Prohibited fallbacks:

- catalogue capacity or recharge;
- fitted effective stats presented as the build result;
- local pip scaling;
- symbol/diagnostic parsing;
- substituted zeros.

A returned zero capacity or recharge is genuine ready data.

## UI intent

One intent: set a bank to a pip count. The store moves the other two and the
package decides what that does to a recharge. No condition enters persistence,
history, URL, a build link or SLEF.

## Accessibility and localization

- Each bank's four blocks form one named group carrying the allocation the bank
  stands at in words, so the reading is there for anyone who cannot see four
  rectangles; each block names its bank and the count it asks for.
- Every block meets the shared target-size token at every width, and the figures
  keep their columns beside them: the blocks take the space they need and no more.
- The table's rows and columns expose capacity, rated recharge, returned pips and
  recharge rate as labelled text at every size. The block's heading names it once;
  the table adds no caption repeating it.
- MJ, MJ/s and pip values use active-locale formatters.
- Zero and unavailable have distinct visual and programmatic meaning.
- Nothing here is announced: the control reports its own state and the figures it
  changes are on screen beside it.

## Required verification

- Exact SYS/ENG/WEP equality at zero, half and whole pip values.
- The three banks always come to six, however the halving fell, and no bank ever
  leaves `0`–`4`.
- The pips shown are the pips the result carries, not the ones pressed.
- Capacity and rated recharge never move with an allocation.
- Zero-pip recharge remains numeric zero.
- Every package null renders unavailable without catalogue values or inferred
  cause, and power, heat and the conditions stay usable beside it.
