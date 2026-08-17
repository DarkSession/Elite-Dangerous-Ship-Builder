# Power Budget Contract

## Boundary

The pure projector receives one active `ShipLoadout`, its immutable application
revision, and feature 003's selected hardpoint state. It calls
`ShipLoadout.powerBudget()` exactly once for that projection. Components never
call the package or retain a second budget.

The per-module portion is gated on
[Elite-Dangerous-Almanac #299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299)
and a released Almanac API that returns the package-authored module projections defined in
[data-model.md](../data-model.md#modulepowerview). Until that dependency exists,
FR-005 and FR-006 cannot be implemented and the feature does not ship.

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

Plant capacity is always `budget.available`. No subtraction, division, sum,
clamp or alternate verdict is permitted in the projector.

## Qualifications

- When `budget.unknownDraws` is empty, returned power values are complete.
- When it is non-empty, total and band numeric values are lower bounds, and
  powered/within-budget booleans describe known draws only.
- Every unknown consumer is named by the returned label. Missing labels remain
  visibly unnamed package entries rather than receiving an invented slot.
- A missing plant is not a missing power result: capacity remains package zero,
  module draw and bands remain visible, and package utilisation infinity uses
  its “draw with no plant output” meaning.
- A zero-draw band remains visible; the UI does not claim that a fitted module is
  powered merely because cumulative zero fits capacity zero.

## Module collection

The package projection must supply one entry per fitted module participating in
power presentation, including disabled and unavailable contributions. The UI:

1. keeps unavailable entries in a separate group;
2. optionally sorts known draws descending with source ordinal as tie break;
3. never merges identical symbols or names;
4. displays exact draw/unavailable, enabled, priority and deployed-only state;
5. labels a deployed-only entry inactive while retracted without calculating a
   replacement draw;
6. emits `openSlot` with the exact returned slot key.

Raw engineering modifiers, symbol prefixes, display names and aggregate
differences are prohibited inputs to this collection.

## UI intents

```ts
selectHardpointState('deployed' | 'retracted')
openSlot(slotKey: string)
```

The first delegates to feature 003 and creates only a condition revision. The
second delegates to feature 002 and reveals the exact slot in one interaction.
Neither mutates the build or edit history.

## Accessibility and localization

- The selector has a visible localized group label, two named choices and a
  programmatically exposed selected state; deployed is the shared default.
- Capacity and selected draw are a definition group. Bands use a semantic table
  at widths that support it and equivalent labelled cards when stacked.
- Draw, cumulative draw and powered state are text for every band. Bars, color
  and patterns are supplementary only.
- Lower-bound and known-draw-only qualifications are adjacent in reading order
  and included in accessible descriptions.
- Each slot action's visible and accessible name distinguishes both module and
  slot and meets the shared touch-target token.
- MW and percentages use feature 011 locale formatters. Application labels use
  message keys; module names use package localization with fallback disclosure.
- A settled state/qualification change is announced once politely without
  re-announcing the complete module collection.

## Required verification

- Exact field equality for both hardpoint states and all five bands.
- Retracted mode has no headroom, utilisation or within-budget field.
- Unknown consumers qualify all affected values/verdicts and never enter numeric
  ordering.
- Disabled and deployed-only module entries remain present.
- No-plant infinity has semantic text and no JSON-based loss.
- Every module action delivers its exact original slot key.
- Rapid build/condition changes never mix revisions.
