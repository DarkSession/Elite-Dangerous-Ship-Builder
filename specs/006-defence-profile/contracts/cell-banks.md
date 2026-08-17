# Cell Banks Contract

## Boundary

For one active build revision call `ShipLoadout.cellBanks()` and auxiliary
`ShipLoadout.powerBudget()` exactly once and copy the frozen `CellBankSummary`. The budget is used
only to qualify returned bank power state when its `unknownDraws` names the same slot. The
application neither recalculates per-bank reinforcement nor totals the bank pool.

## Collection state

- `summary.banks.length === 0` maps to `noneFitted`.
- Any non-empty list maps to `fitted`, including when `totalRestorable === 0` and
  `totalCells === 0`.
- `fitted` copies `totalRestorable` and `totalCells` exactly.
- Package bank order is preserved; identical symbols are never grouped.

## Per-bank mapping

Every fitted bank remains visible and copies all returned fields:

| View field                   | `CellBankMetrics` source |
| ---------------------------- | ------------------------ |
| slot identity                | `slot`                   |
| module identity              | `symbol`                 |
| reinforcement per activation | `reinforcement`          |
| fully-rearmed cells          | `cells`                  |
| spin-up                      | `spinUp`                 |
| duration                     | `duration`               |
| heat                         | `heat`                   |
| powered state                | `powered`                |

The returned `reinforcement` may be shown per bank because the package provides it. No aggregate
shield contribution is divided or copied into a bank row.

## Power qualification

The package documents an unresolved bank draw as assumed powered consistently with `powerBudget()`.
When the budget names unknown draws, the collection carries an adjacent `unknownDraws`
qualification. The application leaves every bank verdict and total unchanged and does not claim that
the assumed state is conclusive.

## UI intent

```ts
openSlot(slotKey: string)
```

Each bank emits its exact returned `slot`. Feature 002 reveals that slot in one interaction. A symbol,
array index or normalized/reconstructed slot name is never used as identity.

## Accessibility and localization

- Totals form a labelled definition group; the list is a complete semantic collection.
- Every bank action's visible and accessible name distinguishes module and slot and meets the shared
  44 CSS-pixel touch-target token.
- Powered/unpowered and qualified states are textual and programmatic; color is supplemental.
- MJ, seconds, cell counts and package thermal-load heat use locale-aware formatting and localized
  unit labels.
- `noneFitted` and fitted-zero totals have different localized messages and accessible structure.
- A settled total/power-state change receives one coalesced polite announcement.

## Required verification

- Empty list plus zero totals maps only to `noneFitted`.
- A non-empty all-unpowered list plus zero totals remains `fitted`.
- Every field and both totals equal the package result exactly.
- Disabled and shed banks remain present.
- Unknown-draw qualification changes no package value or verdict.
- Every bank action delivers the exact returned slot key.
- No bank is filtered, grouped or locally apportioned.
