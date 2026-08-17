# Weapon Output Contract

## Purpose

Define the read-only boundary between one active `ShipLoadout` revision, the Offence Profile domain
projection and exact-slot navigation. This contract owns no weapon calculation and no build mutation.

## Inputs

- one active `ShipLoadout` captured with feature 001's opaque `buildRevision`;
- feature 002's package-backed hardpoint occupancy/unresolved projection for the same build revision;
- a package version whose fitted-weapon result satisfies Almanac #300.

WEP pips and hardpoint viewing state do not alter `weaponMetrics()`. They are shown as surrounding
conditions only where relevant and never passed to this call.

## Package call

Call exactly once for a projection:

```text
loadout.weaponMetrics()
```

Retain the returned object until the complete revision-stamped snapshot is published. Do not call
the data-free weapon functions, read catalogue values, or join `fittedModuleAt()` to fill missing
offence fields.

## Whole-build mapping

Copy `total` field-for-field:

| Package field              | Presentation meaning                        |
| -------------------------- | ------------------------------------------- |
| `damagePerSecond`          | Damage per second while firing              |
| `sustainedDamagePerSecond` | Damage per second averaged over reloads     |
| `energyPerSecond`          | WEP draw per second while firing            |
| `sustainedEnergyPerSecond` | WEP draw per second averaged over reloads   |
| `heatPerSecond`            | Heat per second while firing                |
| `sustainedHeatPerSecond`   | Heat per second averaged over reloads       |
| `thermalLoad`              | Sum of returned weapon thermal-load stats   |
| `powerDraw`                | Deployed plant draw                         |
| `damageByType`             | Burst damage-per-second amounts by type     |
| `sustainedDamageByType`    | Sustained damage-per-second amounts by type |

No total is recalculated from `weapons`. The package total is explicitly scoped to enabled returned
weapons and must not be relabelled as powered firing output.

## Per-weapon mapping

Preserve every returned entry and its exact returned order. Each entry exposes:

- exact `slot`, `symbol`, package/localized `name` and `enabled` state;
- exact `ammunition` state;
- `damagePerShot`, `rateOfFire`, `sustainedRateOfFire` and `continuous`;
- burst/sustained damage, WEP draw and heat per second;
- `thermalLoad` and `powerDraw`;
- burst and sustained damage-type values;
- the released package's sparse effective maximum range, falloff range, projectile-boundary metadata
  and armour-piercing rating required by Almanac #300.

No entry is collapsed into a count. Identical symbols in different slots remain separate.

Beta.12 violates its declaration's promised slot order for reversed imports. Almanac
[#301](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/301) is non-blocking for feature
behavior because no requirement specifies an order. Until a released fix is consumed, preserve the
returned order; do not sort locally to make it look canonical.

## Damage types

For both burst and sustained splits:

- show kinetic, thermal, explosive, absolute and anti-xeno exact numbers;
- show unclassified when the member is present and an explicit not-returned state when the complete
  field inventory is expanded;
- state that anti-xeno is an overlay on conventional damage;
- never calculate percentages, shares, combined conventional-plus-AX damage, or target-adjusted
  damage;
- never let color, position or a bar segment be the only type label.

## Missing and zero semantics

| Source state                                      | Required projection/presentation                              |
| ------------------------------------------------- | ------------------------------------------------------------- |
| Numeric zero returned                             | Exact zero with its unit/meaning                              |
| Optional `unclassified` absent                    | Absent/not returned, not zero                                 |
| Range or piercing field absent after #300         | Unavailable/not returned for that field, not zero             |
| Package returns a genuine zero-damage weapon      | Weapon remains visible with every other returned field        |
| Occupied unresolved hardpoint omitted from result | Separate shared unresolved notice; no invented weapon or zero |
| No occupied hardpoints and empty returned list    | Explicit no-fitted-weapons state                              |
| Non-empty returned list and all totals zero       | Fitted-zero state; retain enabled/disabled text per entry     |
| All returned weapons disabled                     | Retain complete list; package total remains exact zero        |

The application must not claim “no fitted weapons” from `weapons.length === 0` alone. Feature 002's
same-revision hardpoint state distinguishes truly empty mounts from occupied unresolved entries that
the calculation cannot represent.

If a future package result makes damage itself optional, the projection must carry that absence;
zero substitution is prohibited.

## Range and piercing semantics

- `maximumRange` and `falloffRange` are locale-formatted metres only when returned.
- `projectileRange.maximumBoundary` and `.falloffBoundary` are separately labelled boundary
  parameters with no invented unit.
- `armourPiercing` is a rating. Feature 007 does not accept a target hardness and never calls
  `armourPiercingFactor`.
- No range attenuation, range-band aggregation, target simulation or comparison verdict is allowed.

Almanac #300 is a hard gate. A task must not implement a temporary `fittedModuleAt(slot)` join while
waiting for the released field.

## Ammunition semantics

| Package value                  | Required meaning                        |
| ------------------------------ | --------------------------------------- |
| `null`                         | Module carries no ammunition            |
| finite capacity                | Exact clip, hopper and total            |
| `unlimited: true`              | Hopper and total described as unlimited |
| `unlimited: false`, hopper `0` | Exact zero reserve, not unlimited       |

This is fully rearmed capacity, not current imported ammunition state. Do not calculate firing time,
reload count or synthesis requirements from it.

## Exact-slot intent

Each returned weapon exposes one distinct localized action whose payload is exactly:

```text
{ slot: fittedWeapon.slot }
```

Feature 002 receives the intent. Wide composition reveals/selects the inline slot; narrow composition
opens the existing selected-slot layer. The action is one interaction from the weapon entry, uses no
parsed number and remains available for disabled/zero-damage weapons.

Unresolved hardpoint notices use feature 002's own exact-slot actions rather than pretending those
entries came from `weaponMetrics()`.

## Revision and failure behavior

- Capture the active build and revision together.
- Discard a projection if the build revision changes before atomic publication.
- An unexpected method failure publishes one current-revision failure state and no previous numbers.
- An invalid/incomplete build does not suppress a successful package weapon result.
- Package validation and unresolved-slot notices remain separate from offence values.

## Verification

- Deep-equal every total and per-weapon field to one live package result.
- Prove disabled weapons remain and totals equal the package result without local summation.
- Cover truly empty, unresolved-only, mixed unresolved/resolved, genuine-zero and all-disabled states.
- Cover burst/sustained type splits with optional unclassified and anti-xeno overlay text.
- Cover no ammunition, finite, zero-reserve and unlimited capacities.
- After #300, cover Focused effective range/piercing plus absent range/piercing/projectile members.
- Retain the reverse-import regression for #301 and assert no local corrective sort.
- Assert every action sends the exact original slot key once.
