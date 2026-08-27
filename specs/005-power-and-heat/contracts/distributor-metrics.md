# Distributor Metrics Contract

> **Rewritten 2026-08-24 (wave 13).** Feature 003's ruling C withdrew the shared
> `ViewingConditions`, so there are no integer half-pips to halve and no shared
> draft to settle. Feature 005 owns the allocation itself, in pips, and the
> artboard's own four blocks are the control.

## Boundary

Feature 005 holds the allocation in `PowerConditionsStore` and calls:

```ts
const metrics = BuildMetrics.of(loadout);
const result = metrics.distributorMetrics({
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

- a **whole** `0`–`4` for the bank being set, six between the three;
- the opening allocation is an even `2 · 2 · 2`, which favours no bank. The
  artboard draws a different allocation in each canvas — `2 · 1 · 3` on 1c and
  `3 · 1 · 2` on 1d — so neither is _the_ opening state, and both come to six;
- **the other two pay half a pip each for every whole pip assigned** (owner's
  ruling, 2026-08-25): from `2 · 2 · 2`, three in `SYS` leaves `1.5` in each of
  the others. A bank with nothing left to give pays nothing and the other pays
  the whole of it, so from `1 · 4 · 1` four in `SYS` gives `4 · 2 · 0`. Taking
  pips back runs the same rule backwards, all of it going to one bank where the
  other is already full. Where the split will not divide on the half step — the
  bank being set was standing on a half — the odd half falls on whichever of the
  two can better afford it;
- the bank being set therefore always lands on a whole pip, and the two paying
  for it land on the half step, which is what a block filled from its leading
  edge draws;
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

### The units the four are written in

> **Ruled 2026-08-27 — capacity is written `MW`.** A bank's capacity is a stored
> pool and its SI unit is the megajoule, which is what this table used to write
> and what canvas 1c draws (`34.0 MJ`). The game does not: the outfitting panel
> a Commander cross-checks this table against writes `MW` after a bank's
> capacity, and a table that disagreed with that panel about the unit reads as a
> second, different figure rather than the same one. The owner's ruling is that
> the game's unit wins here, taken so the two readings a Commander holds side by
> side agree.
>
> It wins over three things, and the record names all of them. Over the canvas.
> Over SI. And over the package, which is the one that matters: the Almanac
> documents this very field as
> `/** Energy the capacitor holds when full, in megajoules. */`
> (`node_modules/@elite-dangerous-almanac/core/dist/ships/distributor.d.ts`,
> the module imported as `@elite-dangerous-almanac/core/ships/distributor`), and
> the constitution makes that package the source of truth. This is a departure
> from the source of truth's own documentation of the field being drawn.
>
> Nothing in this repository or in the package records what the outfitting panel
> writes. The whole of the evidence for `MW` is the owner's ruling, made against
> the stated alternative of keeping `MJ`.

Nothing about the figure changes: `capacity` is copied from the package exactly
as before, to the same one decimal place, and no conversion, scale or factor is
applied. Only the unit written after it moved, which is what keeps the departure
to a label. The two recharge columns keep
`MJ/s`, which is both the unit they are actually in and the unit the canvas
draws, so the pool and the two rates no longer share a unit — which is the
second thing the ruling buys, because `MJ` beside `MJ/s` invited the pool to be
read as a third rate.

| View field      | Unit written |
| --------------- | ------------ |
| capacity        | `MW`         |
| rated recharge  | `MJ/s`       |
| actual recharge | `MJ/s`       |

Feature 007's `WEAPON CAPACITOR` block states the same capacity, and the same
ruling reaches it: see `specs/007-offence-profile/contracts/capacitor-endurance.md`
and `specs/007-offence-profile/spec.md`, FR-006. The two blocks state one
quantity and must not state it in two units.

**They do still state it to two different decimal places**, and the ruling did
not change that. Each block writes all its energy figures to one precision, and
the two landed on different ones: this table took the single place its own
canvas draws, and feature 007's block took the two places canvas 1c gives its
`DRAW` and `RECHARGE` rates and applied them to the capacity as well. Two places
is a precision the artboard never uses for a capacity anywhere — it draws this
same WEP capacity as `38.4 MJ` in this very table, to one place, and chips it on
canvas 1d as `CAP 61 MJ`, whole. So one build's capacity reads `48.0 MW` here
and `48.00 MW` there, and if it is ever unified the artboard says which way.

That predates this ruling and is left standing rather than settled in passing:
changing it would move a drawn figure, which is the one thing this ruling
promised not to do, and it would do so under cover of a unit change. The two
blocks are in different anatomy modes and never appear together, so the
divergence costs a mode switch to notice rather than contradicting itself on one
screen. Unifying it is a design decision and should be made as one. It is
written down here so the next reader finds it recorded rather than discovering
it, and `contracts/capacitor-endurance.md` records the other half.

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
- MW, MJ/s and pip values use active-locale formatters.
- Zero and unavailable have distinct visual and programmatic meaning.
- Nothing here is announced: the control reports its own state and the figures it
  changes are on screen beside it.

## Required verification

- Exact SYS/ENG/WEP equality at zero, half and whole pip values.
- The three banks always come to six, however the halving fell, and no bank ever
  leaves `0`–`4`.
- The pips shown are the pips the result carries, not the ones pressed.
- Capacity and rated recharge never move with an allocation.
- Capacity is written `MW` and both recharge columns `MJ/s`, in every locale and
  at every width, including the narrow arrangement where the column labels
  itself.
- Zero-pip recharge remains numeric zero.
- Every package null renders unavailable without catalogue values or inferred
  cause, and power, heat and the conditions stay usable beside it.
