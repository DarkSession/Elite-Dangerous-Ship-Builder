# Weapon Output Contract

## Boundary

For one feature 001 active `{ loadout, revision }`, call exactly once:

```ts
const metrics = BuildMetrics.of(loadout);
const result = metrics.weaponMetrics();
```

Retain the exact `BuildWeaponMetrics` object. Feature 007 must not rebuild totals, join
catalogue/fitted-module data to fill optional offence fields or sort the returned collection. One
projection supplies both the panel and the status rail cell.

One data-free package function is called, and only over the retained result: `damageFalloff()`, for
the range bands (see "Range bands" below). It is the package's own falloff rule, applied to the
package's own returned fields.

## Leaf imports

- `ShipLoadout`, `BuildWeaponMetrics`, `FittedWeaponMetrics`:
  `@elite-dangerous-almanac/core/ships/ship-loadout`
- `WeaponMetrics`, `WeaponTotals`, `DamageSplit`:
  `@elite-dangerous-almanac/core/ships/weapons`
- `damageFalloff`: `@elite-dangerous-almanac/core/ships/weapons`
- `ModuleMount`, `getModuleBySymbol`: `@elite-dangerous-almanac/core/ships/modules`
- `getShipGunsight`, `projectGunsight`, `GunsightOffset`:
  `@elite-dangerous-almanac/core/ships/gunsights`
- `getShipSlots`: `@elite-dangerous-almanac/core/ships/ships`
- `enumerateSlots`: `@elite-dangerous-almanac/core/ships/slots`

No broad `ships` barrel is used.

## Whole-build output

Canvas 1c's `WEAPONS` headline draws two figures and both are damage. Those two, and the two damage
splits the `DAMAGE PROFILE` block draws, are what is read from `result.total`:

| Field                      | Required meaning                          | Drawn as                             |
| -------------------------- | ----------------------------------------- | ------------------------------------ |
| `damagePerSecond`          | Enabled returned weapons, reloads ignored | Canvas 1c's `248.6` / `DPS BURST`    |
| `sustainedDamagePerSecond` | Enabled returned weapons, reload averaged | `186.4 SUSTAINED`, and the rail cell |
| `damageByType`             | Exact burst damage split                  | The stacked bar and its legend       |
| `sustainedDamageByType`    | Exact sustained damage split              | **Not read** — no canvas draws it    |

The stacked bar partitions `damageByType`'s **conventional** members only, and its legend is the
whole damage-by-type reading. Each segment's width is its own amount over the sum of those amounts,
and the amount and the share are both written in the legend beside it. A conventional member the
build does not deal has no segment and no legend line, which is what both canvases do with one.

`antiXeno` is **not read**, and neither is `sustainedDamageByType`. Neither canvas draws an
anti-xeno figure or a second damage split, so both join the fields a canvas omits and this feature
therefore does not select — the rule feature 005 set, and the reason an earlier revision's
enumerated type lists were withdrawn (`design/canvas-contract.md`, review note 7).

The total is package-authored and never re-summed from `result.weapons`. It is not relabelled as
powered firing output.

`energyPerSecond`, `sustainedEnergyPerSecond`, `heatPerSecond`, `sustainedHeatPerSecond`,
`thermalLoad` and `powerDraw` are the whole-build firing cost, which no canvas draws, and are
therefore **not read** — the rule feature 005 set for the package fields its canvases omit. The
capacitor block's `DRAW` row is the capacitor result's own field and has a different scope
(`capacitor-endurance.md`, "Scope separation").

The count of entries in `result.weapons` is the canvas's `5 MOUNTED`. It is the one figure this
feature works out that the package does not publish, it is a count rather than a measurement, and it
is recorded as ruled exception 1 in `design/canvas-contract.md`.

## Per-weapon output

Every returned weapon remains a separate entry in returned order. Canvas 1c draws five columns —
`MODULE`, `DPS`, `PIERCE`, `RANGE`, `FALLOFF` — and draws the row **inert**. Preserve and present:

- exact `slot`, `symbol`, canonical returned `name` and `enabled`;
- `metrics.damagePerSecond`, `armourPiercing`, `maximumRange` and `falloffRange`.

`maximumRange` gained its column in the 2026-08-25 canvas revision. It is the same field the falloff
call already reads, presented as the package returns it: nothing derives it and nothing caps it, and
a weapon the package gives none keeps the not-stated text an absent falloff gets. Every other
`WeaponMetrics` field, `projectileRange`, and the weapon's `AmmunitionCapacity | null` are **not
read at all**: no canvas draws them, and the row the canvas draws has nowhere to put them. The
package's `ships/ammunition` subpath is deliberately absent from
`scripts/policy/offence-ownership.mjs`'s allow-list, so importing it fails the gate rather than
passing quietly. An earlier revision added a row-owned disclosure and a per-row slot action to carry
those fields; both are withdrawn (`design/canvas-contract.md`, review note 5).

Known weapons arrive in hull-slot order; the package documents unknown or unmapped slots as appended
in source order after them, which is the package's own guarantee and not something a build this
application can make will reach. Do not parse slot numbers, sort locally, merge duplicate symbols or
collapse weapons into counts.

## Damage types

For `damageByType`, and for that result alone:

- draw the conventional members the build deals as one stacked bar, in the package's own field
  order;
- state each segment's exact amount **and** its share in words beside the bar, so nothing is carried
  by a length or a colour;
- give a member the build does not deal — including an `unclassified` the package omits, which is
  how it says zero — no segment, no line and no stated zero, as both canvases do;
- read neither `antiXeno` nor `sustainedDamageByType` at all;
- create no conventional-plus-AX total, resistance result, target adjustment or colour-only meaning.

Optional range/piercing absence is a different thing entirely: it is not-stated data on a weapon
row, it is drawn as such, and it remains distinct from a zero.

## Range and piercing

- `maximumRange` and `falloffRange` use localized metre formatting only when returned.
- `armourPiercing` is a rating. There is no target hardness input or piercing factor.
- No local range attenuation, target simulation or ballistic model is allowed.

The installed Almanac contains the fitted projection previously tracked upstream. Do not implement a
`fittedModuleAt()` join or catalogue fallback.

## Range bands

The canvas's four distances are 500 m, 1,200 m, 1,800 m and 3,000 m. At each, for every **enabled**
returned weapon:

```ts
weapon.metrics.damagePerSecond *
  damageFalloff({ maximumRange: weapon.maximumRange, falloffRange: weapon.falloffRange }, metres);
```

and the results are added. The multiplier is the package's own; the addition is the same addition the
package performs for `total`, over the same set of weapons. Each band's bar is filled against the
strongest band, and every band's own figure is written beside it whether or not it is filled.

Do not model attenuation, hardness, resistance, a target or a projectile path. A weapon the package
returns no range fields for is passed to `damageFalloff()` exactly as the package returned it, and
the package decides what that means.

## Shot convergence

`getShipGunsight(shipSymbol)` publishes the hull's hardpoint offsets from the cockpit, in metres, in
the hull's own hardpoint order. The offsets are per **hardpoint**, not per weapon, so every one of a
hull's mounts is placed and a returned weapon is matched onto one by its `slot` through
`enumerateSlots(getShipSlots(shipSymbol))`, never by parsing a number out of the key.

- A hull with no published gunsight, or one whose gunsight length does not equal its hardpoint count,
  is `unavailable`. A convergence drawn from part of the mounts is a spread nobody has.
- `projectGunsight(offsets, metres)` places the shots at a range. No projectile path, convergence
  point or spread formula is written locally.
- The spans, the widest mount and the apparent spread are measured across the mounts a returned
  weapon claimed and no others. The spans and the widest are distances between published offsets,
  and are recorded as ruled exception 3 in `design/canvas-contract.md`.
- A hardpoint no returned weapon claimed is placed with no weapon on it. That is a sanctioned
  departure from the canvas rather than a package reading (`design/canvas-contract.md`, review
  note 8); the offset it is drawn at is still the package's own.
- `getModuleBySymbol(symbol)?.mount` names how a weapon is aimed. A symbol the module catalogue does
  not carry keeps a `null` mount and stays on the plate: the geometry does not depend on it.

## Coverage and zero states

Feature 002 supplies same-build-revision package-backed hardpoint coverage:

| Package weapon result / coverage        | Required presentation                                |
| --------------------------------------- | ---------------------------------------------------- |
| Empty list + confirmed-empty hardpoints | No fitted weapons                                    |
| Empty list + coverage unavailable       | No weapon result returned; no empty-build claim      |
| Non-empty list + zero total             | Populated zero-output collection                     |
| Non-empty list + all `enabled: false`   | Complete disabled entries and exact zero total       |
| Real returned zero-damage weapon        | Complete entry with exact zero in every drawn column |
| Optional range/piercing member absent   | Field not stated, never zero                         |

Unsupported module identities are outside this boundary; ingress provides package-resolved state.

## Inert rows

A weapon row carries no control. It does not navigate, disclose or select, and activating it does
nothing. The canvas draws the rows inert and the mount control lives in `HULL ANATOMY`, which is
where the canvas puts it.

## Canonical and localized names

Preserve returned `name` and `symbol` in the snapshot. Presentation separately requests the module
name by symbol through feature 011's Almanac game-text presenter. A locale miss uses visibly disclosed
canonical package text; no private game translation is allowed.

## Revision and failure behavior

- Read the revision before the loadout, because the loadout signal holds one mutable package object
  and an edit changes its contents without changing the reference.
- One projection serves the panel and the rail cell, so the two can never disagree.
- The projection is a pure synchronous read of an in-memory loadout: there is nothing to wait for,
  no stale result to discard and no asynchronous failure to publish.
- Package validation, incompleteness and unavailable coverage remain visible qualifications; a
  successful weapon result is not hidden merely because the build is incomplete.

## Verification

- Deep-equal the retained total, every weapon and every nested field to one live package result.
- Prove no local sum, sort, range/piercing join or positional identity exists.
- Prove the six unread `WeaponTotals` fields appear in no projection, template or message.
- Prove no ammunition figure and no unread `WeaponMetrics` field reaches a template or a message.
- Cover enabled, some-disabled, all-disabled, confirmed-empty, unavailable-coverage and genuine-zero
  builds.
- Cover all damage types, optional-unclassified presence and absent-means-zero behavior.
- Prove the segments partition conventional damage only, that their shares sum to one, and that a
  build dealing none produces no segments rather than zero-width ones.
- Prove each band applies `damageFalloff()` to each enabled weapon, that the bands weaken with
  distance for a falloff-carrying build, and that a zero strongest band fills nothing.
- Cover present/absent effective ranges and absent piercing.
- Prove convergence resolves slots through the hull layout, rejects a mismatched gunsight whole, and
  moves every shot — and no span — when the target range moves.
- Prove a shot outside the plate's field of view is left off the plate rather than held at its
  margin, that it keeps its sentence, and that the sentence states the angle the shot actually
  makes rather than any drawn approximation of it.
- Prove no weapon row carries a control.
