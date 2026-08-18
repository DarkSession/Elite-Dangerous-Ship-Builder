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
- `hullHeatDissipation`;
- the released structured unknown-contributor qualification.

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

## Availability and projection

- `heatMetrics() === null` maps to one unavailable profile with no hull,
  catalogue or inferred fallback.
- A non-empty released unknown-contributor list makes the whole ready profile a
  projection, neither upper nor lower bound.
- Every returned contributor identity remains visible.
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

## Blocking release acceptance

Installed 0.1.1 fails this required case:

1. Start with a SideWinder default loadout.
2. Replace `SmallHardpoint1` with a catalogue-unknown item.
3. Supply journal modifiers for `PowerDraw`, `ThermalLoad` and
   `DistributorDraw`.
4. Confirm power consumers contain the exact recovered draw and
   `powerBudget().unknownDraws` is empty.
5. Change the supplied thermal modifier.

In 0.1.1, firing heat does not change and `heatMetrics().unknownDraws` remains
empty, so the profile incorrectly appears complete. Before implementation:

- raise this minimal reproduction upstream;
- consume a released package correction;
- verify the result names/qualifies the unresolved heat contributor;
- update this contract to the exact released structured field if its public
  shape changes.

The application must not inspect loadout validation, slot kind, module symbol or
journal modifiers to add its own qualification, and must not suppress all heat
for every incomplete build.

## Unsupported design-reference content

Feature 005 does not add or derive `.design`'s cruise, weapons-alpha,
shield-cell-bank, resting/peak heat, heat-sink count, WEP-net or “100% module
damage” figures. Those may appear only if another accepted capability owns an
exact package result.

## Accessibility and localization

- Plant/hull facts use a definition structure.
- Scenario content uses semantic labelled rows/cards and gives every field and
  state a textual value.
- Projection and overheat never depend on bar length, fill, icon, color or
  position.
- Thermal load, heat level, percentage and duration use active-locale
  formatters. Scenario labels, qualifications and sentinels use application
  message keys.
- Unknown game identities stay package-owned and use feature 011's canonical
  fallback disclosure.
- A settled unavailable/projection transition is announced once.

## Required verification

- Exact equality for all profile facts and all 25 scenario fields.
- Missing/disabled/unavailable plant package null remains unavailable.
- No-weapons builds retain five scenarios.
- Every package-reported unknown qualifies the entire profile, not as a bound.
- The blocking unresolved-weapon regression passes on the pinned fixed release.
- Does-not-settle and never-overheats remain distinct and localized.
