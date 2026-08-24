# Cell Banks Contract

> **Reconciled at implementation, 2026-08-24.** Canvas 1c draws one line for the reserve, not a
> per-bank collection with an action apiece. The projection still copies every returned field. The
> reserve carries the package total, and every bank aboard is listed under it on the canvas's own
> row; the fields the canvas does not write — spin-up, duration and activation heat — are carried by
> the projection and not drawn.

## Boundary

For the captured active-build revision call:

```ts
const summary = loadout.cellBanks();
```

`cellBanks()` owns every bank value, bank ordering, powered verdict and total. No band, draw or
shedding arithmetic is reproduced.

## Collection states

- `summary.banks.length === 0` maps to `noneFitted`, and no reserve line is drawn at all.
- Every non-empty bank list maps to `fitted`, including a list with `totalRestorable === 0` and
  `totalCells === 0`.
- `fitted` copies both totals unchanged and preserves package bank order.
- Identical module symbols remain separate entries by exact slot. Two entries are drawn as one row
  only where every field the canvas writes for them matches, and that row then carries its count.

## Per-bank mapping

| Projection field             | `CellBankMetrics` source | Meaning                                 | Drawn |
| ---------------------------- | ------------------------ | --------------------------------------- | ----- |
| slot                         | `slot`                   | exact game slot key                     | no    |
| module identity              | `symbol`                 | package module identity                 | no    |
| class and rating             | fitted record at `slot`  | the canvas's `5A`                       | yes   |
| one activation reinforcement | `reinforcement`          | MJ, not MJ/s                            | yes   |
| fully rearmed cells          | `cells`                  | count                                   | yes   |
| spin-up                      | `spinUp`                 | seconds                                 | no    |
| reinforcement duration       | `duration`               | seconds                                 | no    |
| activation heat              | `heat`                   | package thermal-load units              | no    |
| powered                      | `powered`                | switched on and fed with hardpoints out | yes   |

The totals are the exact package `totalRestorable` and `totalCells`, which include powered banks
only. The application neither derives a per-bank activation value nor sums totals.

The class and rating are the exception to the table above: `CellBankMetrics` carries neither, so the
row's `5A` is read from the fitted record found under the exact `slot` the summary reported. It is a
lookup by package key, not a value derived from one.

## Actions

There are none. The canvas draws a reading, and the reserve line is one of its readings.

## Localization and accessibility

- The reserve is a labelled figure with every bank behind it listed under it, each stating what one
  activation of it restores. Every bar in the block is drawn against the largest of those figures,
  and each length is stated beside it.
- Powered and unpowered are text on the bank's own line, which is where the canvas writes them and
  the only thing that carries them; the reserve's own hatch is supplemental to its line.
- MJ and counts use the active locale and application-localized unit labels.
- `noneFitted` draws nothing, so it can never be read as a reserve of zero.

## Verification

- Empty list plus zero totals maps only to `noneFitted`, and draws no line.
- A non-empty all-unpowered list remains `fitted` with exact zero totals and keeps its line.
- Every field, order and both totals equal `cellBanks()` exactly.
- Disabled and shed banks remain present with their returned `powered` state.
- Duplicate symbols stay separate entries, and are drawn as one counted row only where every drawn
  field matches.
- Banks differing in module, cells, reinforcement or powered state are drawn on separate rows.
- No bank is filtered, summed or locally apportioned; the figure is the package total, and no row
  carries a share of it.
