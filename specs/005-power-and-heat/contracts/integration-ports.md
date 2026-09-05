# Integration Ports Contract

> **Rewritten 2026-08-23 (wave 12).** Feature 003's ruling B withdrew `StatusProvider<T, I>`, the
> provider envelope and the `powerAndHeat` detail target, and its ruling C withdrew
> `ViewingConditions` and the shared revision context these ports were written against. Feature 003
> composes nothing and receives nothing. See [reference-review.md](../design/reference-review.md),
> wave 12.
>
> **Rewritten again 2026-08-24 (wave 13).** The artboard's own switching script hides the plate
> container outside `mounts`, so there is no mount power overlay to feed: `POWER` replaces the
> plates rather than annotating them. `mountPowerState` and `MountPowerState` are withdrawn with it.
> See [reference-review.md](../design/reference-review.md), wave 13.

Feature 005 owns every power, distributor and heat semantic in the application. One other feature
draws something from that ownership, and it receives no service: it reads the same pure projection
this feature exports, exactly as feature 009's rail block reads its own.

## What is exported

```ts
// src/app/domain/ships/power-heat/power-heat.ts
export function projectPowerHeat(loadout: ShipLoadout, conditions: PowerConditions): PowerAndHeat;

export interface PowerConditions {
  readonly hardpoints: 'deployed' | 'retracted';
  /** Whole pips per bank, 0–4 each, as the artboard draws them. */
  readonly pips: DistributorPipAllocation;
}
```

`projectPowerHeat` is pure and synchronous. It calls `powerBudget()` once,
`distributorMetricsResult()` once and `heatMetricsResult()` once, and returns one frozen result.
There is no store, no cache, no revision key and no lifecycle: the loadout is already in memory,
and the signal graph memoises the call for the surfaces that read it.

## Feature 010 — the mode, and nothing on the plates

Feature 010 owns the plates, their side selector, their legend and the five-segment mode strip.
Feature 005 enables one of those segments, and takes the space the plates occupy:

- selecting `POWER` retitles the region `POWER & THERMALS` and removes the plate container, the side
  selector and the legend, exactly as the artboard's switching script does — it sets
  `[data-anat-plates]` to `display: none` for every mode but `mounts`;
- `ednb-power-thermals` is drawn in the space they leave;
- leaving the mode restores the mounts layer as it was, side selection included.

Nothing is drawn on a mount. There is no overlay, no per-mount priority mark and no observation of
any kind: the groups are read in `PRIORITY GROUPS` and the mounts in `DRAW BY MODULE`, both inside
the panel. Feature 010 joins no consumer to a band and reads no power field.

## Feature 003 — the status rail

Feature 003 owns the rail's heading and its validation issues, and nothing else in it. Feature 005's
three contributions are its own components mounted into that rail, reading `projectPowerHeat`
directly. Feature 003 passes nothing to them and receives nothing from them.

The rail's blocks and their order are recorded in
[`specs/003-ship-statistics/design/status-rail.md`](../../003-ship-statistics/design/status-rail.md).

## Feature 007 — the deployed distributor

Feature 007's weapon endurance uses `weaponsCapacitorMetrics()`, which applies the deployed power
budget itself. It needs nothing from this feature; the former deployed-distributor observation was
a consequence of the withdrawn shared-context design and is not built.

## Verification

- Selecting `POWER` leaves no plate, side selector or legend in the document, and leaving it
  restores all three unchanged.
- The dashboard and the rail read one `projectPowerHeat` result and agree for the same build; a band
  whose `poweredDeployed` and `poweredRetracted` differ reads its own verdict in each state.
- No consumer of the export calls `powerBudget`, `distributorMetricsResult` or `heatMetricsResult`,
  and only
  `src/app/domain/ships/power-heat` combines package figures arithmetically, which
  `scripts/policy/power-heat-ownership.mjs` enforces by path. The standalone `distributorMetrics`
  and `heatMetrics` calculators the same leaves export are refused everywhere, the projection
  included.
