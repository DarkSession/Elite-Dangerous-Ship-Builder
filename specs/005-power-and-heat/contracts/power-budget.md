# Power Budget Contract

> **Rewritten 2026-08-24 (wave 13).** The observation index and the mount overlay
> it fed are withdrawn: the artboard's switching script hides the plates outside
> `mounts`, so nothing is drawn on a mount. Headroom, utilisation and
> within-budget are withdrawn with them — neither canvas prints any of the three,
> so the projection does not read them. What the canvas does draw, and this now
> states, is the powered/unpowered split of the draw and each group's share of
> plant output.

## Boundary

The feature 005 projector calls `BuildMetrics.powerBudget()` once per read and
selects from that one immutable result. Components do not call the package or
reconstruct a second budget. There is no store, no cache and no revision key: the
call is synchronous and the signal graph memoizes it.

Production imports:

```ts
import type { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type {
  PowerBand,
  PowerBudget,
  PowerConsumerResult,
} from '@elite-dangerous-almanac/core/ships/power';
```

The standalone `powerBudget` calculator is not an application calculation
boundary.

## Selected-state mapping

| View field      | Deployed                                                                 | Retracted               |
| --------------- | ------------------------------------------------------------------------ | ----------------------- |
| total draw      | `budget.deployed`                                                        | `budget.retracted`      |
| band draw       | `band.deployed`                                                          | `band.retracted`        |
| cumulative draw | `band.deployedTotal`                                                     | `band.retractedTotal`   |
| powered state   | `band.poweredDeployed`                                                   | `band.poweredRetracted` |
| module draw     | `consumer.draw`, or a real `0` where the mount is stowed or switched off |

`budget.available` is always the exact plant capacity returned by the package.

`budget.headroom`, `budget.utilisation` and `budget.withinBudget` are not read at
all. Neither canvas draws a headroom figure, a utilisation percentage or a
within-budget verdict, so nothing downstream can print, blank, dash or zero one —
and the package's infinite utilisation on a plant of zero never has to be worded.

Three readings the canvas draws are not package fields, and
`scripts/policy/power-heat-ownership.mjs` permits them only inside
`src/app/domain/power-heat`:

| Reading           | Rule                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| `unpowered`       | The selected state's draw of every group the plant does not keep lit |
| `poweredDraw`     | The selected total less `unpowered`                                  |
| `cumulativeShare` | A group's cumulative draw over plant output; `null` with no output   |

No other sum, subtraction, division, clamp or alternate verdict is permitted.

## Exactness

Every consumer the package returns carries a resolved draw, so the selected total, each group's own
and cumulative draw and each group's powered verdict are all exact. The application attaches no
bound, projection or qualification to any of them.

## No or unavailable plant output

The power result remains present when the package returns zero capacity. Draw,
groups and consumers remain visible. A plant of zero has no share to state rather
than an infinite one, so a group's `cumulativeShare` is `null` and its percentage
column is not drawn. Nothing claims whether the plant is absent, disabled or
unresolved. What such a build states is a plant of `0.00 MW` with the whole demand
in `UNPOWERED`.

## Module collection

`budget.consumers` is the sole per-module source:

1. take the exact returned `label`, `symbol`, `draw`, `enabled`, `priority` and
   `deployedOnly`, and nothing else;
2. draw the mounts carrying the same symbol in the same group and the same
   enabled state as one line with the canvas's `x2` count — a consumer with no
   symbol stands alone under its own ordinal, because two unnamed mounts are not
   known to be the same thing;
3. state each line's draw _in the selected state_, so a stowed hardpoint and a
   switched-off module each read a real `0.00` and every state's list adds up to
   that state's own package total;
4. sort by draw descending with source ordinal as the tie break;
5. retain disabled consumers, marked as such;
6. never add passive or zero-draw fittings omitted by the package;
7. carry no action: the list is a reading, and feature 002's ledger is where a
   mount is selected.

Raw journal modifiers, effective-stat joins, symbol/slot parsing, aggregate
differences and positional indices are prohibited inputs.

## UI intents

One intent: read the build with the hardpoints out, or stowed. It changes no
build, spends no revision, is not persisted, and reaches neither history nor a
URL, a build link or SLEF.

## Accessibility and localization

- The hardpoint control names both of its states in words and reports which is
  selected; it stands on its own line under the block's heading, where the canvas
  puts it.
- `PLANT OUTPUT`, `POWERED DRAW` and `UNPOWERED` form a semantic definition group.
- Every group is a labelled row carrying its own draw and either its cumulative
  share or the canvas's `OFFLINE`; every bar is decoration with the figures beside
  it as its text equivalent.
- Powered, shed, disabled and stowed never depend on colour, pattern or position:
  each is worded on the line it belongs to.
- MW and percentages use active-locale formatters. Application text uses messages;
  module text uses Almanac localization with canonical-fallback disclosure.

## Required verification

- Exact field equality for both states, and for every group the build uses.
- One row per group this build puts something in, in ascending order; a group with
  no consumer is left out rather than drawn empty.
- No headroom, utilisation or within-budget field is read or published at all.
- A disabled consumer keeps its line and reads the nothing it draws; a stowed
  hardpoint reads a real zero while retracted.
- Each state's module lines add up to that state's own package total.
- No/zero plant output preserves exact numbers with no infinity to word.
- A band whose `poweredDeployed` and `poweredRetracted` differ reads its own
  verdict in each state.
- Every consumer row preserves the package's own identities: no match by index,
  by name, by symbol prefix or by display string.
