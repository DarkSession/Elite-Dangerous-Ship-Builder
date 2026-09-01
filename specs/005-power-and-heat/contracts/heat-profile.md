# Heat Profile Contract

> **Amended 2026-08-24 (wave 13).** The canvases draw `RESTING HEAT`,
> `PEAK SUSTAINED`, `DISSIPATION`, `HEAT SINKS` and a `Shield cell bank` bar, so
> the blanket refusal of "design-reference content" below was overturned: each of
> those is now stated, and each is stated from a package result or from
> `fittedModules()`. What stays refused is anything with no such source.

## Boundary

For one captured build, call `BuildMetrics.heatMetricsResult()` once and read its
`value`. The method accepts no hardpoint or pip options; feature 005 never
changes the result for a viewing condition.

Import `HeatMetrics` and `HeatState` from
`@elite-dangerous-almanac/core/ships/heat`. Do not call the standalone heat
functions or assemble their inputs in the application.

## Ready mapping

Copy these profile facts:

- `heatEfficiency`;
- `hullHeatCapacity`;
- `hullHeatDissipation`.

Render exactly these scenario objects in order:

1. `idle`
2. `thrusters`
3. `fsdCharging`
4. `firingDrained`
5. `firingSustained`

Every scenario exposes:

| View field       | Package source      |
| ---------------- | ------------------- |
| thermal load     | `thermalLoad`       |
| heat level       | `heatLevel`         |
| cockpit gauge    | `gauge`             |
| overheat state   | `overheats`         |
| time to overheat | `secondsToOverheat` |

Finite gauge is a fraction formatted as a percentage. It is not the same
quantity as heat level.

## Availability

- `heatMetricsResult().value === null` maps to one unavailable profile with no
  hull, catalogue or inferred fallback.
- A ready profile is a complete answer for the build. Every scenario carries the package's own
  figures, and the application adds no bound, projection or qualification of its own.
- With no weapons, all five scenarios remain present even when values coincide.

## Semantic non-finite values

| Package value                | Presentation state | Drawn as              |
| ---------------------------- | ------------------ | --------------------- |
| `heatLevel === Infinity`     | `doesNotSettle`    | `∞`, worded beside it |
| `gauge === Infinity`         | `doesNotSettle`    | `∞`, worded beside it |
| `secondsToOverheat === null` | `neverOverheats`   | Its own sentence      |

These states remain independent. The UI does not emit raw `Infinity`, `null`, a
clamped percentage or generic unavailable text. The infinity symbol is drawn for
the two levels that never settle, and it is never _unexplained_: the sentence it
stands for is carried with it, in a text equivalent tied to the same reading, so
no state rests on a glyph a reader has to already know. Projection objects are not JSON-cloned or persisted.

Every module in a build resolves, because import normalization admits no other kind. The application
must not inspect loadout validation, slot kind, module symbol or journal modifiers to add a
qualification of its own, and must not suppress heat for an incomplete build.

## The canvases' tiles, and the sixth bar

Four tiles stand beside the bars, and each is stated from a source rather than
invented:

| Tile             | Source                                                                     |
| ---------------- | -------------------------------------------------------------------------- |
| `RESTING HEAT`   | The `idle` scenario's own gauge                                            |
| `PEAK SUSTAINED` | The hottest of the bars drawn beside it, picked out rather than worked out |
| `DISSIPATION`    | Exact `hullHeatDissipation`                                                |
| `HEAT SINKS`     | Launchers and charges from `fittedModules()`, over the canvas's `2 x 3`    |

`HEAT SINKS` comes from the build rather than from `heatMetricsResult()`, which
models no sink at all: a sink removes heat, and every load the package accepts
is non-negative. Its `2 x 3` breakdown is absent where the fitted launchers do not
all carry the same charges, because two unlike launchers are not one product.

The canvases also draw a sixth bar, `Shield cell bank`. The package publishes five
scenarios and states outright that this is not one of them: a bank's heat is per
_activation_, and the package's own remedy is to divide it by the bank's spin-up,
add it to the build's thermal load and run it for the spin-up's duration with
`heatLevelAtTime`. That is done once, in `src/app/domain/ships/power-heat`, which is the
only module `scripts/policy/power-heat-ownership.mjs` permits to combine package
figures. With no bank fitted the bar is absent, not zero.

Nothing else from `.design` is added or derived. The cruise, weapons-alpha and
WEP-net figures have no package result behind them and are not drawn.

## Bar geometry

Canvas 1c puts the module-damage threshold at 62.5% of its track, which is a
track running to 160% of the threshold, and every bar it draws fits inside that.
The track grows to hold a hotter bar instead of letting it run off the end. A
level that never settles is not a length: it fills the track to the end, because
the package says it climbs without stopping and a bar that stopped somewhere
would name a level nobody named. Every bar is decoration; the gauge reading
beside it is what is read.

## Accessibility and localization

- Plant/hull facts use a definition structure.
- Scenario content uses semantic labelled rows/cards and gives every field and
  state a textual value.
- Overheat state never depends on bar length, fill, icon, color or position.
- Thermal load, heat level, percentage and duration use active-locale
  formatters. Scenario labels and sentinels use application message keys.
- A settled unavailable transition is announced once.

## Required verification

- Exact equality for all profile facts and all 25 scenario fields.
- `RESTING HEAT` equals the `idle` gauge, `PEAK SUSTAINED` equals the hottest
  drawn bar's own reading, and `HEAT SINKS` equals the fitted launchers' charges.
- A build with no shield cell bank draws five bars, not six with a zero.
- Missing/disabled/unavailable plant package null remains unavailable.
- No-weapons builds retain five scenarios.
- Does-not-settle and never-overheats remain distinct and localized.
