# Cell Banks Contract

## Boundary

For the captured active-build revision call:

```ts
const summary = loadout.cellBanks();
const power = loadout.powerBudget();
```

`cellBanks()` owns every bank value, bank ordering, powered verdict and total. `powerBudget()` is read
only for `unknownDraws` qualification; no band, draw or shedding arithmetic is reproduced.

## Collection states

- `summary.banks.length === 0` maps to `noneFitted` and displays a dedicated empty statement.
- Every non-empty bank list maps to `fitted`, including a list with `totalRestorable === 0` and
  `totalCells === 0`.
- `fitted` copies both totals unchanged and preserves package bank order.
- Identical module symbols remain separate entries by exact slot.

## Per-bank mapping

| Presentation fact            | `CellBankMetrics` source | Meaning                                 |
| ---------------------------- | ------------------------ | --------------------------------------- |
| slot action                  | `slot`                   | exact game slot key                     |
| module identity              | `symbol`                 | package module identity                 |
| one activation reinforcement | `reinforcement`          | MJ, not MJ/s                            |
| fully rearmed cells          | `cells`                  | count                                   |
| spin-up                      | `spinUp`                 | seconds                                 |
| reinforcement duration       | `duration`               | seconds                                 |
| activation heat              | `heat`                   | package thermal-load units              |
| powered                      | `powered`                | switched on and fed with hardpoints out |

The totals are the exact package `totalRestorable` and `totalCells`, which include powered banks
only. The application neither derives a per-bank activation value nor sums totals.

## Unknown-power qualification

When `power.unknownDraws` is empty, present the bank result without qualification. When it is
non-empty:

- retain every returned bank value, powered boolean and total unchanged;
- state that the package result assumes incomplete enabled power draws according to its contract;
- list package-provided unknown slot labels without inventing bank identity;
- qualify the complete bank collection, because any omitted draw may change whether a lower-priority
  bank group is fed;
- export the stable owner qualification `defence.cellBanks.unknownPowerDraws` to feature 003.

The qualification is not called a lower bound: unknown consumption can make an assumed-powered bank
unpowered and reduce the usable bank totals.

## Exact-slot intent

```ts
{ kind: 'slot', slotKey: bank.slot }
```

One activation hands the exact returned key to feature 002. No symbol, array position, normalized key
or reconstructed spelling may target a bank.

## Localization and accessibility

- Totals use labelled definitions and banks form a complete semantic collection.
- Each action's visible and accessible name distinguishes module and slot and uses the feature 011
  target-size token.
- Powered/unpowered and unknown-power meanings are text and programmatic state; color/icon is
  supplemental.
- MJ, seconds, counts and heat use the active locale and application-localized unit labels.
- Module and slot game text use Almanac leaf i18n helpers with shared fallback disclosure.
- `noneFitted` and fitted-zero have different text, structure and announcements.

## Verification

- Empty list plus zero totals maps only to `noneFitted`.
- A non-empty all-unpowered list remains `fitted` with exact zero totals.
- Every field, order and both totals equal `cellBanks()` exactly.
- Disabled and shed banks remain present with their returned `powered` state.
- Any unknown enabled draw qualifies the collection but changes no returned value.
- Duplicate symbols keep independent exact-slot actions.
- No bank is filtered, grouped, summed or locally apportioned.
