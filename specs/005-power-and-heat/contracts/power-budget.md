# Power Budget Contract

## Boundary

For one captured build revision, the feature 005 projector calls
`ShipLoadout.powerBudget()` once and retains that immutable result while
selecting the settled hardpoint state. Components, feature 003 and feature 010
do not call the package or reconstruct a second budget; feature 007 likewise
uses the owner observation port for its distributor core slot.

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

| View field      | Deployed               | Retracted               |
| --------------- | ---------------------- | ----------------------- |
| total draw      | `budget.deployed`      | `budget.retracted`      |
| band draw       | `band.deployed`        | `band.retracted`        |
| cumulative draw | `band.deployedTotal`   | `band.retractedTotal`   |
| powered state   | `band.poweredDeployed` | `band.poweredRetracted` |
| headroom        | `budget.headroom`      | omitted                 |
| utilisation     | `budget.utilisation`   | omitted                 |
| within budget   | `budget.withinBudget`  | omitted                 |

`budget.available` is always the exact plant capacity returned by the
package. No sum, subtraction, division, clamp or alternate verdict is permitted
in the projector.

## Exactness

Every consumer the package returns carries a resolved draw, so selected, band and cumulative values,
the deployed summary fields, and the powered and within-budget verdicts are all exact. The
application attaches no bound, projection or qualification to any of them.

## No or unavailable plant output

The power result remains present when the package returns zero capacity. Draw,
bands and consumers remain visible. Infinite utilisation receives the
field-specific text “draw with zero available plant output”; it does not claim
whether the plant is absent, disabled or unresolved. If draw and capacity are
both zero, package utilisation remains numeric zero.

## Module collection

`budget.consumers` is the sole per-module source:

1. require the exact returned `label` and `symbol` from the
   `ShipLoadout` facade contract;
2. preserve one row per returned consumer and its source ordinal;
3. show exact draw, enabled, normalized one-based priority and deployed-only;
4. optionally sort by draw descending with source ordinal as the tie break;
5. retain disabled consumers;
6. never add passive or zero-draw fittings omitted by the package;
7. never merge identical module symbols or names;
8. emit `openSlot` with the exact returned label.

Raw journal modifiers, effective-stat joins, symbol/slot parsing, aggregate
differences and positional indices are prohibited inputs.

## UI intents

```ts
type PowerBudgetIntent =
  | { readonly kind: 'editViewingConditions' }
  | { readonly kind: 'applyViewingConditions' }
  | { readonly kind: 'resetViewingConditions' }
  | { readonly kind: 'openSlot'; readonly slotKey: string };
```

Viewing intents delegate to feature 003. Slot intent delegates to feature 002.
None mutates the loadout directly or enters edit history.

## Accessibility and localization

- The shared condition group exposes visible localized hardpoint state, pip
  drafts, errors and Apply/Reset state.
- Capacity and selected draw form a semantic definition group.
- All five bands use a semantic table where it fits and equivalent labelled
  cards when stacked.
- Every numeric/bar relationship has nearby text. Powered, shed, disabled and
  deployed-only do not depend on color, pattern or position.
- Every slot action's visible and accessible name distinguishes module and
  exact slot and uses the shared target-size token.
- MW/percentages use active-locale formatters. Application text uses messages;
  module/slot text uses Almanac localization and canonical fallback disclosure.

## Required verification

- Exact field equality for both states and all five bands.
- No retracted headroom, utilisation or within-budget field.
- Disabled consumers stay visible and contribute exactly as the package reports.
- No/zero plant output preserves exact numbers and semantic infinity.
- Every consumer row and action preserves original package identities.
- Missing label/symbol, unexpected exception and stale revision publish failure,
  never partial/stale figures.
