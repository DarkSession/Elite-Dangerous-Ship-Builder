# Feature Specification: Power and Heat

## Scope

This capability presents power generation and draw, priority shedding, distributor capacitors and
the heat scenarios returned by the Almanac. Module power edits belong to
[002](../002-module-outfitting/spec.md); viewing conditions belong to
[003](../003-ship-statistics/spec.md).

## User Scenarios

### Story 1 — Understand the power budget (P1)

1. Plant capacity and draw for the selected hardpoint state are shown together.
2. Deployed is selected by default, and the Commander can switch between deployed and retracted.
3. Every priority band shows its draw, cumulative draw and powered state for the selected state.
4. Unknown draws remain named and qualify package totals as lower bounds.
5. Each module's contribution reaches the corresponding slot.

### Story 2 — Read distributor performance (P2)

1. SYS, ENG and WEP each show capacity, rated recharge and actual recharge at the selected pips.
2. Pip changes affect recharge but not capacity.
3. A missing, disabled, unresolved or shed distributor produces an unavailable result.

### Story 3 — Understand heat (P2)

1. Plant efficiency and hull heat capacity and dissipation are identified.
2. Idle, thruster, FSD-charging, sustained-fire and drained-capacitor scenarios show every package
   result.
3. Unknown contributors remain named and the profile is identified as a projection.

## Requirements

- **FR-001**: Every numeric value and calculation MUST come from
  `@elite-dangerous-almanac/core` without local recomputation.
- **FR-002**: Power MUST use `ShipLoadout.powerBudget()` for plant capacity, the selected hardpoint
  state's total draw, its per-band draw, cumulative draw and powered state, and unknown draws.
  Package `headroom`, `utilisation` and `withinBudget` MUST appear only for deployed hardpoints,
  whose state those fields describe; the application MUST NOT derive retracted equivalents.
- **FR-003**: The power budget MUST show only one hardpoint state at a time, default to deployed and
  allow the Commander to switch between deployed and retracted.
- **FR-004**: Unknown draws MUST remain visible and every affected total MUST be labeled a lower
  bound. Disabled modules MUST remain visible and contribute exactly as the package reports.
- **FR-005**: A per-module breakdown MUST use package-resolved post-engineering draw and MAY sort
  known values by contribution. Unknown values MUST remain outside numeric ordering.
- **FR-006**: Each module entry MUST show slot, enabled state, priority and deployed-only state and
  MUST reach that slot in one interaction.
- **FR-007**: Distributor values MUST use `ShipLoadout.distributorMetrics()` for capacity, rated
  recharge, pip-scaled recharge and the allocation used. The application MUST NOT scale recharge.
- **FR-008**: A `null` distributor result MUST remain unavailable; catalogue figures MUST NOT replace
  a build result.
- **FR-009**: Heat MUST use `ShipLoadout.heatMetrics()` and show the five returned scenarios, their
  thermal load, heat level, gauge level, overheat state and time to overheat.
- **FR-010**: `null` heat MUST remain unavailable. `unknownDraws` MUST remain visible and qualify the
  complete heat profile as a projection.
- **FR-011**: Infinity MUST be expressed by its package meaning, such as never settling or never
  overheating, rather than as an unexplained number.

## Edge Cases

- Without a plant, draw remains reportable, capacity is zero and heat is unavailable.
- Without weapons, firing scenarios remain package results; the UI does not invent an absent state.
- Zero-pip recharge is a genuine zero.
- A deployed-only module remains identifiable while hardpoints are retracted.

## Almanac Coverage

`powerBudget()`, `distributorMetrics()` and `heatMetrics()` provide every value, state and
qualification required here. The application only formats, orders and links returned data.

## Current Almanac Limit

`powerBudget()` supplies retracted draw and per-band powered state, but its `headroom`, `utilisation`
and `withinBudget` fields describe deployed hardpoints only. Retracted presentation therefore omits
those three summaries. Showing retracted equivalents would require new package results; the
application MUST NOT calculate them.

## Success Criteria

- **SC-001**: Every displayed value and state equals the corresponding Almanac field.
- **SC-002**: A Commander can switch hardpoint state and identify deployment-dependent power
  shedding without leaving the capability.
- **SC-003**: Every unknown contribution remains visible and correctly qualifies its result.
