# Heat Profile Contract

## Boundary

For one active build revision, call `ShipLoadout.heatMetrics()` exactly once.
Hardpoint and pip viewing-condition changes do not become options to this call;
the five scenarios are the package's fixed build profile.

## Ready result

Copy these profile facts directly:

- `heatEfficiency`;
- `hullHeatCapacity`;
- `hullHeatDissipation`;
- `unknownDraws`.

Render exactly these scenario keys and package objects in order:

1. `idle`
2. `thrusters`
3. `fsdCharging`
4. `firingSustained`
5. `firingDrained`

Every scenario exposes all five fields:

| View field          | Package source      |
| ------------------- | ------------------- |
| thermal load        | `thermalLoad`       |
| heat level          | `heatLevel`         |
| cockpit gauge level | `gauge`             |
| overheat state      | `overheats`         |
| time to overheat    | `secondsToOverheat` |

Finite `gauge` is a fraction and is locale-formatted as a percentage. It is not
the same quantity as `heatLevel`. No peak, threshold, heat-sink count, cell-bank
scenario or combined summary is calculated.

## Availability and projection

- `heatMetrics() === null` maps to a whole-profile `unavailable` state with no
  catalogue/hull fallback.
- A non-empty `unknownDraws` list makes every fact and overheat verdict a
  projection over resolved modules. It is neither an upper nor a lower bound.
- Every returned unknown slot key is named. The UI does not parse or privately
  translate it.
- With no weapons, all five returned scenarios still render even when firing
  states equal other states.

## Semantic non-finite values

The projector recognizes package sentinel meanings before numeric formatting or
serialization:

| Package value                | Semantic output  |
| ---------------------------- | ---------------- |
| `heatLevel === Infinity`     | `doesNotSettle`  |
| `gauge === Infinity`         | `doesNotSettle`  |
| `secondsToOverheat === null` | `neverOverheats` |

The localized UI phrases describe those meanings. It must not emit raw
`Infinity`, `∞`, `null`, a clamped percentage or generic unavailable text.
A scenario that does not settle can still have a finite time to overheat; these
fields remain independent.

## Accessibility and localization

- Plant/hull facts use a semantic definition group.
- Scenario content uses a semantic list/table with a heading and textual label
  for every field and state; any gauge/bar is supplemental.
- Overheat and projection meaning never depend on color, fill length, icon or
  position.
- Thermal load, heat level, percentage and duration use active-locale
  formatters. Scenario labels, qualifications and sentinel phrases use bundled
  application message keys.
- Unknown game slot/module text remains package-owned and carries the feature
  011 canonical-language disclosure where required.
- A settled transition into or out of unavailable/projection status is
  announced once politely.

## Required verification

- Exact equality for all profile facts and all 25 scenario fields.
- No-plant and unknown-hull package null results remain unavailable.
- No-weapons builds keep five scenarios.
- Unknown contributors qualify the entire profile and do not qualify it as a
  bound.
- Non-settling and never-overheating meanings are distinct and localized.
- Charts add no game value absent from the package result.
