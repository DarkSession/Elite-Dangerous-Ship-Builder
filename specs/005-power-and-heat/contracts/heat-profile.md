# Heat Profile Contract

## Boundary

For one captured build revision, call `ShipLoadout.heatMetrics()` once. The
method accepts no hardpoint or pip options; feature 005 never changes the result
for a viewing condition.

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
4. `firingSustained`
5. `firingDrained`

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

- `heatMetrics() === null` maps to one unavailable profile with no hull,
  catalogue or inferred fallback.
- A ready profile is a complete answer for the build. Every scenario carries the package's own
  figures, and the application adds no bound, projection or qualification of its own.
- With no weapons, all five scenarios remain present even when values coincide.

## Semantic non-finite values

| Package value                | Presentation state |
| ---------------------------- | ------------------ |
| `heatLevel === Infinity`     | `doesNotSettle`    |
| `gauge === Infinity`         | `doesNotSettle`    |
| `secondsToOverheat === null` | `neverOverheats`   |

These states remain independent. The UI does not emit raw `Infinity`, an
unexplained infinity glyph, `null`, a clamped percentage or generic
unavailable text. Projection objects are not JSON-cloned or persisted.

Every module in a build resolves, because import normalization admits no other kind. The application
must not inspect loadout validation, slot kind, module symbol or journal modifiers to add a
qualification of its own, and must not suppress heat for an incomplete build.

## Unsupported design-reference content

Feature 005 does not add or derive `.design`'s cruise, weapons-alpha,
shield-cell-bank, resting/peak heat, heat-sink count, WEP-net or “100% module
damage” figures. Those may appear only if another accepted capability owns an
exact package result.

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
- Missing/disabled/unavailable plant package null remains unavailable.
- No-weapons builds retain five scenarios.
- Does-not-settle and never-overheats remain distinct and localized.
