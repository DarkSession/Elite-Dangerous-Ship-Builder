# Data Model: Offence Profile

Feature 007 owns no persisted entity. Every model below is an immutable, in-memory projection tied
to one active-build revision and one viewing-condition revision. Package result objects are never
mutated and numeric values are never recalculated.

## OffenceSnapshot

The single value published to the capability.

| Field                    | Type                                  | Rules                                                                                              |
| ------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `buildRevision`          | opaque feature 001 revision           | Identifies the exact active `ShipLoadout` read.                                                    |
| `conditionsRevision`     | opaque feature 003 revision           | Identifies the exact settled WEP-pip conditions read.                                              |
| `weaponProfile`          | `WeaponProfile`                       | One direct `weaponMetrics()` result plus honest hardpoint coverage context.                        |
| `capacitorProfile`       | `CapacitorProfile`                    | One direct `weaponsCapacitorMetrics({ weaponsPips })` result.                                      |
| `distributorObservation` | `DistributorObservation`              | Shared feature 005 package-backed fitted/power state; never inferred from capacitor numbers alone. |
| `qualification`          | `exact` or structured package failure | A projector exception never leaves stale or partial fields under the new revisions.                |

All child records are deeply immutable. Presentation expansion state is keyed by exact weapon slot
outside this model and is discarded on build replacement.

## WeaponProfile

| Field                 | Type                            | Rules                                                                                    |
| --------------------- | ------------------------------- | ---------------------------------------------------------------------------------------- |
| `total`               | `WeaponTotalsProjection`        | Exact package total across enabled returned weapons; never rebuilt from entries.         |
| `weapons`             | `readonly WeaponProjection[]`   | Exact returned collection and order; disabled entries remain.                            |
| `hardpointCoverage`   | `HardpointCoverage`             | Shared outfitting observation that prevents an empty result from becoming a false claim. |
| `returnedOrderDefect` | package-version gate/diagnostic | Beta.12 order is preserved; Almanac #301 tracks the documented slot-order mismatch.      |

### HardpointCoverage

This is identity/availability context supplied by feature 002's package-backed slot projection, not
an offence calculation.

- `empty`: every package hardpoint slot is empty and `weapons` is empty;
- `represented`: at least one returned weapon exists and no occupied unresolved hardpoint needs a
  separate notice;
- `partiallyUnresolved`: returned weapons exist and one or more occupied hardpoints have no resolved
  weapon result; exact unresolved slot/symbol records remain in the feature 002 view;
- `unresolvedOnly`: `weapons` is empty but at least one hardpoint is occupied by an unresolved entry;
- `unavailable`: the package slot view cannot establish occupancy, so the UI says no weapon result
  was returned and makes no no-fitted-weapons claim.

Unresolved occupied hardpoints are not inserted into `BuildWeaponMetrics` and receive no invented
weapon metric. They only qualify the empty/partial presentation.

## WeaponTotalsProjection

Every field maps one-to-one to `BuildWeaponMetrics.total`.

| Field                      | Unit/meaning                                  |
| -------------------------- | --------------------------------------------- |
| `damagePerSecond`          | burst damage per second                       |
| `sustainedDamagePerSecond` | reload-averaged damage per second             |
| `energyPerSecond`          | burst WEP-capacitor draw in MW                |
| `sustainedEnergyPerSecond` | reload-averaged WEP-capacitor draw in MW      |
| `heatPerSecond`            | burst heat per second                         |
| `sustainedHeatPerSecond`   | reload-averaged heat per second               |
| `thermalLoad`              | summed module thermal-load stats              |
| `powerDraw`                | deployed plant draw in MW                     |
| `damageByType`             | exact burst `DamageSplitProjection`           |
| `sustainedDamageByType`    | exact reload-averaged `DamageSplitProjection` |

Zero is always retained as a number. The surrounding `hardpointCoverage` and weapon entries carry
the distinction between empty, disabled and genuine-zero cases.

## WeaponProjection

One `FittedWeaponMetrics`, extended only by the sparse package result required from Almanac #300.

| Field              | Type                         | Rules                                                                  |
| ------------------ | ---------------------------- | ---------------------------------------------------------------------- |
| `slot`             | string                       | Exact game slot key; identity and slot-navigation target.              |
| `symbol`           | string                       | Exact module symbol.                                                   |
| `name`             | package/localized game text  | Never privately translated.                                            |
| `enabled`          | boolean                      | Exact returned state; disabled entry remains present.                  |
| `metrics`          | `WeaponMetricsProjection`    | Every returned numeric/boolean result.                                 |
| `ammunition`       | `AmmunitionState`            | Exact `null`/capacity semantics.                                       |
| `rangeAndPiercing` | `RangeAndPiercingProjection` | Required future package-owned sparse result; implementation gate #300. |

`slot` is unique within one returned build projection and is never replaced by an array index.

## WeaponMetricsProjection

| Field                      | Unit/meaning                                          |
| -------------------------- | ----------------------------------------------------- |
| `damagePerShot`            | damage per discharge                                  |
| `rateOfFire`               | shots per second while firing                         |
| `sustainedRateOfFire`      | reload-averaged shots per second                      |
| `damagePerSecond`          | burst damage per second                               |
| `sustainedDamagePerSecond` | reload-averaged damage per second                     |
| `energyPerSecond`          | burst WEP draw in MW                                  |
| `sustainedEnergyPerSecond` | reload-averaged WEP draw in MW                        |
| `heatPerSecond`            | burst heat per second                                 |
| `sustainedHeatPerSecond`   | reload-averaged heat per second                       |
| `thermalLoad`              | per-discharge or continuous package thermal-load stat |
| `powerDraw`                | deployed power-plant draw in MW                       |
| `damageByType`             | exact burst `DamageSplitProjection`                   |
| `sustainedDamageByType`    | exact reload-averaged `DamageSplitProjection`         |
| `continuous`               | exact continuous-fire flag                            |

No display field divides, sums, normalizes or compares these values.

## DamageSplitProjection

| Field          | Presence | Meaning                                                                |
| -------------- | -------- | ---------------------------------------------------------------------- |
| `kinetic`      | required | Exact package amount.                                                  |
| `thermal`      | required | Exact package amount.                                                  |
| `explosive`    | required | Exact package amount.                                                  |
| `absolute`     | required | Exact package amount not reduced by resistance.                        |
| `unclassified` | optional | Exact amount when returned; absence remains absence, not numeric zero. |
| `antiXeno`     | required | Exact Thargoid-effective overlay, not a conventional partition member. |

Burst and sustained splits are separate instances. Anti-xeno is labelled as an overlay every time
it is presented; no local share or combined damage member exists.

## RangeAndPiercingProjection

This model cannot be implemented until Almanac #300 is released. It records the semantic contract
the application will consume, not a beta.12 local adapter.

| Field                             | Presence                    | Rules                                                                     |
| --------------------------------- | --------------------------- | ------------------------------------------------------------------------- |
| `maximumRange`                    | optional                    | Effective post-engineering distance in metres; absence stays absent.      |
| `falloffRange`                    | optional                    | Effective post-engineering distance in metres; absence stays absent.      |
| `projectileRange`                 | optional                    | Exact `ProjectileRangeBoundaries`; never labelled or formatted as metres. |
| `projectileRange.maximumBoundary` | optional                    | Boundary parameter; no distance/falloff calculation.                      |
| `projectileRange.falloffBoundary` | required when parent exists | Boundary parameter; no invented unit.                                     |
| `armourPiercing`                  | optional                    | Rating only; absence stays absent and no target factor is calculated.     |

The final field location and type name follow the released package. Tasks must refresh this model if
the upstream API shape differs while preserving these semantics.

## AmmunitionState

A discriminated projection of `FittedWeaponMetrics.ammunition`.

### `none`

- Source is package `null`.
- Means this module carries no ammunition.
- No clip, hopper or total value is fabricated.

### `capacity`

| Field       | Rules                                                                      |
| ----------- | -------------------------------------------------------------------------- |
| `clipSize`  | Exact finite package round count; zero remains zero.                       |
| `hopper`    | Exact package reserve; infinity is rendered semantically, not numerically. |
| `total`     | Exact package full-rearm capacity; never recomputed as clip plus hopper.   |
| `unlimited` | Exact flag; when true, hopper/total receive localized unlimited wording.   |

A finite capacity with hopper zero remains distinct from unlimited and from `none`.

## CapacitorProfile

Every field maps one-to-one to `WeaponsCapacitorMetrics`.

| Field                      | Unit/meaning                                                         |
| -------------------------- | -------------------------------------------------------------------- |
| `weaponsPips`              | Exact package-returned pips in `[0,4]`.                              |
| `capacity`                 | WEP capacity in MJ; zero remains zero.                               |
| `rechargeRate`             | Selected-pip recharge in MJ/s.                                       |
| `sustainedEnergyPerSecond` | Powered, enabled, deployed firing-load draw in MJ/s.                 |
| `netDrainRate`             | Package net drain in MJ/s.                                           |
| `timeToDrain`              | Seconds or positive infinity.                                        |
| `durationMeaning`          | `finite`, `immediate`, `sustainingFire`, or `noDrainingPoweredLoad`. |

`durationMeaning` selects localized wording without changing the value:

- finite positive `timeToDrain` -> `finite`;
- zero `timeToDrain` -> `immediate`;
- infinite `timeToDrain` with positive returned sustained draw -> `sustainingFire`;
- infinite `timeToDrain` with zero returned sustained draw -> `noDrainingPoweredLoad`.

The projector branches on returned discriminants only. It does not recalculate net drain or compare
capacity and rates.

## DistributorObservation

Feature 005 supplies this shared, package-backed context after Almanac #299. It stays independent of
the capacitor result.

- `present`: exact slot/symbol plus enabled and deployed powered state;
- `absent`: the package-backed slot state contains no fitted distributor;
- `unresolved`: an occupied distributor slot cannot supply authoritative package facts;
- `unavailable`: the shared power projection cannot establish state.

The UI may state zero capacity and the observation together. It must not claim that one caused the
other unless the package result explicitly says so.

## Relationships

```text
Active build revision ──> weaponMetrics() ──> WeaponProfile
         │                       │
         │                       └──> WeaponProjection[] ──slot intent──> feature 002
         │
         ├──> feature 002 hardpoint coverage ──> honest empty/unresolved context
         │
         └──> feature 005 distributor observation ──> zero/power context

Viewing-condition revision (WEP pips)
         └──> weaponsCapacitorMetrics() ──> CapacitorProfile

All four inputs ──atomic publication──> OffenceSnapshot
```

## Validation invariants

- Snapshot build and condition revisions match the currently active contexts at publication.
- `weaponMetrics()` and `weaponsCapacitorMetrics()` are each called exactly once per projection.
- `capacitorProfile.weaponsPips` equals the package-returned value; the application does not retain
  a divergent numeric copy.
- Every returned weapon and field is preserved; no disabled weapon is removed.
- No unresolved hardpoint receives invented weapon fields or enters package totals.
- No optional range, piercing or unclassified field is converted to zero.
- No numeric infinity crosses generic serialization or number-formatting boundaries.
- Every weapon slot action carries the exact returned slot string.
- Returned weapon order remains unchanged until Almanac #301 is released and consumed.

## State transitions

```text
no active build
  └─ activate/replace build ─> projecting(current build revision, current conditions revision)

current snapshot
  ├─ module edit/undo/redo ─> projecting(new build revision, same conditions revision)
  ├─ accepted pip change   ─> projecting(same build revision, new conditions revision)
  └─ build removed         ─> no active build

projecting
  ├─ revisions still current ─> publish complete immutable snapshot once
  ├─ either revision stale    ─> discard without rendering
  └─ unexpected package error ─> publish failure for current revisions, no stale values
```

Expansion state may survive an ordinary edit only while its exact slot still exists; build
replacement clears it. Expansion and capability selection are presentation state and are not
persisted.
