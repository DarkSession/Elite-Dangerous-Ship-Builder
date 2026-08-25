# Data Model: Power and Heat

Every game-bearing value is an immutable projection of one
`@elite-dangerous-almanac/core` `ShipLoadout`. Feature 005 owns no build, no
persisted state, no game formula and no catalogue fallback.

> **Rewritten 2026-08-24 (wave 13).** The original model described a
> `PowerHeatProjectionState` store with revision keys, a snapshot, a failure
> state, feature 003's shared draft conditions, an owner-private
> `MountPowerObservationIndex`, a `PowerStatusProjection` provider envelope and a
> `MountPowerObservation` union for features 007 and 010. Feature 003's rulings
> withdrew the shared conditions and the provider; wave 13's reading of the
> artboard withdrew the mount overlay along with the plates it drew on, and with
> it the observation index. What is modelled here is what the code holds.

## Shape

One pure synchronous function over one loadout and the two conditions it is read
under:

```ts
function projectPowerHeat(loadout: ShipLoadout, conditions: PowerConditions): PowerAndHeat;
```

There is no store around it, no cache, no revision key, no pending state and no
failure state. The loadout is already in memory, the three `ShipLoadout` calls
are synchronous, and Angular's signal graph memoizes the result for every
surface that reads it. Package `null` is not a failure: a returned projection may
carry an unavailable distributor or an unavailable heat profile and still be a
complete answer for the build.

## PowerConditions

The two questions the dashboard asks about a build, neither of which changes it:

```ts
type HardpointState = 'deployed' | 'retracted';

interface DistributorPipAllocation {
  readonly systems: number;
  readonly engines: number;
  readonly weapons: number;
}

interface PowerConditions {
  readonly hardpoints: HardpointState;
  readonly pips: DistributorPipAllocation;
}
```

`PowerConditionsStore` holds both. Neither reaches the loadout, spends a build
revision, or is persisted — no storage, no history, no URL fragment, no build
link, no SLEF. Reopening the workspace opens on `deployed` and `2 · 2 · 2`.

Pips are `0`–`4` per bank on a half-pip step, six between the three. The package
accepts any fraction in range and imposes no total; the six are the ship's rule,
so setting one bank moves the other two — the remainder is split evenly between
them, and each lands on a half pip. There is no
draft, no Apply, no Reset, no running total and no validation.

## PowerAndHeat

| Field         | Type                       | Rule                                            |
| ------------- | -------------------------- | ----------------------------------------------- |
| `hardpoints`  | `HardpointState`           | The state every selected figure was read under  |
| `power`       | `PowerView`                | Selected fields of one `powerBudget()` result   |
| `modules`     | `readonly ModuleDrawRow[]` | `budget.consumers`, heaviest first              |
| `heat`        | `HeatView \| null`         | `null` exactly when `heatMetrics()` returned it |
| `distributor` | `DistributorView \| null`  | `null` exactly when `distributorMetrics()` did  |

The object is frozen. Nothing about it is serialized, persisted or placed in
history, a URL or SLEF.

## PowerView

```ts
interface PowerView {
  readonly available: number;
  readonly draw: number;
  readonly bands: readonly PowerBandView[];
  readonly poweredDraw: number;
  readonly unpowered: number;
  readonly bar: PowerDrawBar;
}
```

| Field         | Source/rule                                                        |
| ------------- | ------------------------------------------------------------------ |
| `available`   | Exact `PowerBudget.available`. `0` is a real zero                  |
| `draw`        | Exact selected `deployed` or `retracted` total                     |
| `bands`       | The groups this build puts something in, in package order          |
| `unpowered`   | The selected-state draw of every group the plant does not keep lit |
| `poweredDraw` | `draw` less `unpowered`                                            |
| `bar`         | Three lengths on one track, for the status rail                    |

`headroom`, `utilisation` and `withinBudget` are not read. Neither canvas draws
a headroom figure, a utilisation percentage or a within-budget verdict, so the
projection publishes none — nothing downstream can blank, dash or zero a field
it never receives, and the package's infinite utilisation on a plant of zero
never has to be worded. What such a build states instead is a plant of nothing
with the whole demand in `UNPOWERED`.

`poweredDraw` and `unpowered` are the canvas's `POWERED DRAW 29.64 MW` and
`UNPOWERED 7.80 MW` beside a module list totalling `37.44`: the same build, once
with the dark groups counted and once without. The package states each group's
draw and whether it is lit; which are dark and what they add to is this
projection's reading of that, and it is one of the readings
`scripts/policy/power-heat-ownership.mjs` allows only here.

### PowerBandView

| Field             | Type             | Source/rule                                         |
| ----------------- | ---------------- | --------------------------------------------------- |
| `priority`        | number           | Exact `PowerBand.priority`, `1`–`5`                 |
| `draw`            | number           | This group's own draw in the selected state         |
| `cumulativeDraw`  | number           | Its and every higher group's, in the selected state |
| `cumulativeShare` | `number \| null` | That over plant output; `null` with no output       |
| `powered`         | boolean          | The selected state's package verdict                |

The package always returns five bands, because five is what the game has. A
group nothing is assigned to is not a reading of _this_ build — it is an empty
row saying `0.00 MW` about a group that does not exist here — so groups with no
consumer in them are left out, and the drawn rows keep the package's ascending
order. No field is calculated from another; a plant of zero has no share to state
rather than an infinite one.

### PowerDrawBar

| Field       | Rule                                                   |
| ----------- | ------------------------------------------------------ |
| `powered`   | The lit draw as a share of the track, in `[0, 1]`      |
| `unpowered` | The dark draw, running on from where the lit draw ends |
| `plant`     | Where plant output falls on the same track             |

Canvas 1c draws the status rail's `POWER` figures over a bar of `79%`, `21%` and
a mark at `83.3%`, which are the artboard's own numbers over its own demand:
`29.64 / 37.44`, `7.80 / 37.44` and `31.20 / 37.44`. The track is therefore the
whole demand — scaled to whichever of demand and plant is larger, so a build the
plant covers marks the plant at the end of the track rather than off it. A build
with no plant and nothing fitted draws an empty track rather than a division by
nothing.

## ModuleDrawRow

| Field      | Type             | Source/rule                                                         |
| ---------- | ---------------- | ------------------------------------------------------------------- |
| `id`       | string           | The symbol, group and enabled state this row stands for             |
| `symbol`   | `string \| null` | Exact `consumer.symbol`; `null` where the package published none    |
| `slotKey`  | `string \| null` | Exact `consumer.label`; `null` where the row is more than one mount |
| `count`    | number           | How many mounts the row stands for                                  |
| `draw`     | number           | What those mounts draw _in the selected state_                      |
| `priority` | number           | Exact package `1`–`5`                                               |
| `offline`  | boolean          | Whether the plant leaves this row's group dark                      |
| `disabled` | boolean          | Whether every mount on the line is switched off                     |
| `share`    | number           | `draw` over the list's own total; decoration for the bar            |

Rules:

- `budget.consumers` is the sole per-module source;
- mounts carrying the same symbol in the same group and the same enabled state
  are one line with the canvas's `x2` count, which is what the artboard prints;
  a consumer with no symbol stands alone under its own ordinal, because two
  unnamed mounts are not known to be the same thing;
- `draw` is the selected state's own draw, so a stowed hardpoint and a
  switched-off module both read a real `0.00` and each state's list adds up to
  that state's own package total;
- a disabled consumer keeps its line rather than disappearing from it;
- passive and zero-draw fittings the package omits are never fabricated;
- rows are heaviest first, with source order as the tie break;
- the list carries no action: it is a reading, and feature 002's ledger is where
  a mount is selected.

## HeatView

`null` exactly when `heatMetrics()` returned `null`, with no hull or catalogue
figure standing in and no diagnosis of why.

| Field                 | Type                          | Source/rule                                   |
| --------------------- | ----------------------------- | --------------------------------------------- |
| `efficiency`          | number                        | Exact package figure                          |
| `hullHeatCapacity`    | number                        | Exact package figure                          |
| `hullHeatDissipation` | number                        | Exact package figure                          |
| `scenarios`           | `readonly HeatScenarioView[]` | The five package scenarios, in package order  |
| `thresholdAt`         | number                        | Where the damage threshold falls on the track |
| `shieldBankSpike`     | `HeatSpikeView \| null`       | The canvases' sixth bar, or no bank fitted    |
| `heatSinks`           | `HeatSinkView`                | What the build carries to drop its own heat   |

```ts
type HeatScenarioKey = 'idle' | 'thrusters' | 'fsdCharging' | 'firingDrained' | 'firingSustained';

type HeatLevelValue =
  { readonly kind: 'level'; readonly value: number } | { readonly kind: 'doesNotSettle' };

type OverheatTime =
  { readonly kind: 'seconds'; readonly value: number } | { readonly kind: 'neverOverheats' };
```

`Infinity` means the load exceeds what the hull can shed, so heat settles
nowhere. It is its own statement, distinct from a high number and from an absent
profile, and a bar for it fills the track to the end because the package says it
climbs without stopping. `null` seconds means the gauge never reaches 100% under
that scenario: a fact about the build, never a zero and never unavailable.

### HeatScenarioView

| Field             | Type              | Source/rule                                           |
| ----------------- | ----------------- | ----------------------------------------------------- |
| `key`             | `HeatScenarioKey` | Package order                                         |
| `thermalLoad`     | number            | Exact `HeatState.thermalLoad`                         |
| `heatLevel`       | `HeatLevelValue`  | Exact level or the non-settling statement             |
| `gauge`           | `HeatLevelValue`  | Exact gauge or the non-settling statement             |
| `overheats`       | boolean           | Exact package verdict                                 |
| `timeToOverheat`  | `OverheatTime`    | Exact seconds or the never statement                  |
| `within` / `over` | number            | Bar lengths either side of the threshold, in `[0, 1]` |

All five scenarios exist in a ready profile, including on a build with no
weapons.

### HeatSpikeView

The canvases draw a sixth bar, `Shield cell bank`. `heatMetrics()` publishes five
scenarios and says outright that this is not one of them: a bank states heat per
_activation_ rather than per second, and the package's own remedy is to divide
that by the bank's spin-up, add it to the build's load and run it for the
spin-up's duration — with the package's own `heatLevelAtTime` doing the running.
That is one of the readings the ownership policy allows only in this module. The
bar is absent, not zero, where no bank is fitted.

### HeatSinkView

| Field       | Type             | Rule                                                        |
| ----------- | ---------------- | ----------------------------------------------------------- |
| `launchers` | number           | Fitted launchers. `0` is a real answer and the tile says it |
| `charges`   | `number \| null` | Charges one launcher carries, or `null` where they differ   |
| `total`     | number           | Charges carried between them                                |

The canvases' `HEAT SINKS 6` over `2 x 3`. It comes from `fittedModules()` rather
than from `heatMetrics()`, which models no sink at all: a sink removes heat, and
every load the package accepts is non-negative. The `2 x 3` breakdown is absent
where the launchers do not all carry the same number, because two unlike
launchers are not one multiplication.

## DistributorView

`null` exactly when `distributorMetrics()` returned `null` — an absent,
switched-off, unresolvable or retracted-shed distributor — carrying no inferred
cause and no catalogue figure. Power, heat and the conditions stay usable.

| Field        | Type                          | Rule                                     |
| ------------ | ----------------------------- | ---------------------------------------- |
| `capacitors` | `readonly CapacitorView[]`    | `SYS`, `ENG`, `WEP`, in the canvas order |
| `identity`   | `DistributorIdentity \| null` | What the fitted distributor is           |

### CapacitorView

| Field           | Type            | Source                                                 |
| --------------- | --------------- | ------------------------------------------------------ |
| `kind`          | `CapacitorKind` | Stable presentation key                                |
| `capacity`      | number          | Matching `.capacity`                                   |
| `ratedRecharge` | number          | Matching `.ratedRecharge`                              |
| `pips`          | number          | The allocation the **result** carries, not the request |
| `rechargeRate`  | number          | Matching `.rechargeRate`                               |

Zero recharge is ready numeric data, not an unavailable one. Capacity and rated
recharge are properties of the fitted distributor and do not move with pips.

### DistributorIdentity — withdrawn 2026-08-25

`8A · CHARGE ENHANCED G5 · SUPER CONDUITS` was drawn beside the distributor
heading: a size, a grade letter, the applied recipe's journal name and grade, and
the experimental effect's journal name.

**The canvas revision of 2026-08-25 removed it from the drawing**, so it comes off
the screen and out of this model. It was an identity rather than a figure, so
nothing is lost from what the panel reads about the build; the fitted distributor
is still named where feature 002's ledger names it.

## Text

Owned application text comes from feature 011's messages; module, blueprint and
effect names come from the Almanac through its game-text presenter, with its own
canonical-fallback disclosure. No private game translation and no raw application
fallback is added. Numbers and units use active-locale formatters.
