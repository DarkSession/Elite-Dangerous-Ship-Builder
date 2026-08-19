# Weapon Output Contract

## Boundary

For one feature 001 active `{ loadout, buildRevision }`, call exactly once:

```ts
const result = loadout.weaponMetrics();
```

Retain the exact `BuildWeaponMetrics` object. Feature 007 must not call the data-free weapon
functions, rebuild totals, join catalogue/fitted-module data to fill optional offence fields or sort
the returned collection. A cache keyed by build revision may supply both detail and Status.

## Leaf imports

- `ShipLoadout`, `BuildWeaponMetrics`, `FittedWeaponMetrics`:
  `@elite-dangerous-almanac/core/ships/ship-loadout`
- `WeaponMetrics`, `WeaponTotals`, `DamageSplit`:
  `@elite-dangerous-almanac/core/ships/weapons`
- `AmmunitionCapacity`: `@elite-dangerous-almanac/core/ships/ammunition`
- `ProjectileRangeBoundaries`: `@elite-dangerous-almanac/core/ships/modules`

No broad `ships` barrel is used.

## Whole-build output

Present every `result.total` field with its package scope:

| Field                      | Required meaning                                |
| -------------------------- | ----------------------------------------------- |
| `damagePerSecond`          | Enabled returned weapons, reloads ignored       |
| `sustainedDamagePerSecond` | Enabled returned weapons, reload averaged       |
| `energyPerSecond`          | Enabled returned weapons' burst WEP draw        |
| `sustainedEnergyPerSecond` | Enabled returned weapons' sustained WEP draw    |
| `heatPerSecond`            | Enabled returned weapons' burst heat            |
| `sustainedHeatPerSecond`   | Enabled returned weapons' sustained heat        |
| `thermalLoad`              | Sum of included package thermal-load stats      |
| `powerDraw`                | Enabled returned weapons' deployed plant demand |
| `damageByType`             | Exact burst damage split                        |
| `sustainedDamageByType`    | Exact sustained damage split                    |

The total is package-authored and never re-summed from `result.weapons`. It is not relabelled as
powered firing output; capacitor powered draw has a different package scope.

## Per-weapon output

Every returned weapon remains a separate entry in returned order. Preserve:

- exact `slot`, `symbol`, canonical returned `name` and `enabled`;
- every required `WeaponMetrics` field: damage per shot; burst/sustained rates of fire; burst/
  sustained damage, WEP draw and heat; thermal load; plant draw; both damage splits; continuous-fire
  state;
- exact `AmmunitionCapacity | null`;
- optional effective maximum range, falloff range, projectile boundaries and armour piercing.

Known weapons arrive in hull-slot order; unknown/unmapped slots follow in source order. Do not parse
slot numbers, sort locally, merge duplicate symbols or collapse weapons into counts.

## Damage types

For burst and sustained damage:

- show exact kinetic, thermal, explosive, absolute and anti-xeno numbers;
- show optional unclassified when present; when absent, omit it or state no unclassified damage,
  because 0.1.3 omits the member exactly when zero;
- state that anti-xeno overlays conventional damage;
- create no share, percentage, conventional-plus-AX total, resistance result or color-only meaning.

Unclassified absence is not an unavailable result. Optional range/piercing absence is not-stated data
and remains distinct.

## Range and piercing

- `maximumRange` and `falloffRange` use localized metre formatting only when returned.
- `projectileRange.maximumBoundary` and `falloffBoundary` are separately named boundary parameters
  with no invented unit; numeric zero remains present.
- `armourPiercing` is a rating. There is no target hardness input or piercing factor.
- No range attenuation, range-band aggregation, target simulation or convergence result is allowed.

Almanac 0.1.3 contains the fitted projection tracked by issue #300. Do not implement a
`fittedModuleAt()` join or catalogue fallback.

## Ammunition

| Package value                                | Presentation meaning                       |
| -------------------------------------------- | ------------------------------------------ |
| `null`                                       | Weapon carries no ammunition               |
| finite capacity                              | Exact clip, hopper and total at full rearm |
| `unlimited: true` with infinite hopper/total | Localized unlimited wording                |
| `unlimited: false` with hopper `0`           | Exact zero reserve, not unlimited          |

Do not calculate current ammunition, reload count, synthesis requirements or firing duration.

## Coverage and zero states

Feature 002 supplies same-build-revision package-backed hardpoint coverage:

| Package weapon result / coverage        | Required presentation                                      |
| --------------------------------------- | ---------------------------------------------------------- |
| Empty list + confirmed-empty hardpoints | No fitted weapons                                          |
| Empty list + coverage unavailable       | No weapon result returned; no empty-build claim            |
| Non-empty list + zero total             | Populated zero-output collection                           |
| Non-empty list + all `enabled: false`   | Complete disabled entries and exact zero total             |
| Real returned zero-damage weapon        | Complete entry with exact zero and all other returned data |
| Optional range/piercing member absent   | Field not stated, never zero                               |

Unknown module identities never reach this boundary; ingress has already converted them to package
empty/default outcomes.

## Exact-slot target

Every returned entry exposes one distinct localized action carrying feature 003's shared target:

```ts
{ kind: 'slot', slotKey: weapon.slot }
```

Feature 002 owns reveal/edit behavior. Wide layout selects the existing inline outfitting context;
narrow layout opens the selected-slot layer with a named return. The action stays available for
disabled and zero-output weapons and never uses an index.

## Canonical and localized names

Preserve returned `name` and `symbol` in the snapshot. Presentation separately requests the module
name by symbol through feature 011's Almanac game-text presenter. A locale miss uses visibly disclosed
canonical package text; no private game translation is allowed.

## Revision and failure behavior

- Capture loadout and revision together.
- Reuse the exact cached object for detailed capability and Status projection.
- Discard a pending result if the active build revision changes.
- An unexpected package or integration exception publishes a current-revision application failure,
  not old figures or a game diagnosis.
- Package validation/incompleteness and unavailable coverage remain visible qualifications; a
  successful weapon result is not hidden merely because the build is incomplete.

## Verification

- Deep-equal the retained total, every weapon and every nested field to one live package result.
- Prove no local sum, sort, range/piercing join or positional identity exists.
- Cover enabled, some-disabled, all-disabled, confirmed-empty, unavailable-coverage and genuine-zero
  builds.
- Cover all damage types, optional-unclassified presence and absent-means-zero behavior.
- Cover finite, zero-reserve, unlimited and no-ammunition cases.
- Cover present/absent effective ranges, boundary value zero and absent piercing.
- Retain reverse-input and unknown-slot ordering regressions from Almanac #301.
- Assert every slot action emits the exact original key once.
