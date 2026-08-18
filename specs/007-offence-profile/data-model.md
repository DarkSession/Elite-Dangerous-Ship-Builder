# Data Model: Offence Profile

Feature 007 owns no persisted entity. Every value is an immutable in-memory read of one active-build
revision and, where WEP pips matter, one settled viewing-condition revision. Package result objects
remain intact; presentation discriminants never replace their numeric fields.

## OffenceProjectionState

```ts
type OffenceProjectionState =
  | { readonly state: 'noBuild' }
  | {
      readonly state: 'pending';
      readonly buildRevision: number;
      readonly conditionsRevision: number;
    }
  | { readonly state: 'ready'; readonly snapshot: OffenceSnapshot }
  | {
      readonly state: 'failure';
      readonly buildRevision: number;
      readonly conditionsRevision: number;
      readonly messageKey: 'projectionFailed' | 'integrationUnavailable';
    };
```

Package zero, infinity or optional absence is not an application failure. `failure` is reserved for
an unexpected package exception, a required same-revision integration mismatch or a missing accepted
port. A current-revision failure never displays prior-revision figures.

## OffenceSnapshot

```ts
interface OffenceSnapshot {
  readonly buildRevision: number;
  readonly conditionsRevision: number;
  readonly weapons: BuildWeaponMetrics;
  readonly hardpointCoverage: HardpointCoverage;
  readonly capacitor: WeaponsCapacitorMetrics;
  readonly distributorPower: DeployedDistributorPowerObservation;
}
```

| Field                | Source/rule                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| `buildRevision`      | Exact feature 001 active-build revision                                                             |
| `conditionsRevision` | Exact feature 003 settled-condition revision                                                        |
| `weapons`            | Exact object returned by one `weaponMetrics()` call for the build revision                          |
| `hardpointCoverage`  | Feature 002 package-backed slot coverage for the same build revision                                |
| `capacitor`          | Exact object returned by one `weaponsCapacitorMetrics()` call for the revision pair                 |
| `distributorPower`   | Feature 005 owner-authored deployed distributor observation for the same captured context/revisions |

The weapon result may be cached by build revision because pips do not affect it. The capacitor and
cross-feature observations are published only with the current revision pair. A locale change
rebuilds presentation only and advances neither revision.

## Exact package weapon result

`BuildWeaponMetrics` and `FittedWeaponMetrics` are imported from
`@elite-dangerous-almanac/core/ships/ship-loadout`. The snapshot does not define local numeric copies.

### `BuildWeaponMetrics.total`

The exact `WeaponTotals` fields are:

| Field                      | Package meaning                                      |
| -------------------------- | ---------------------------------------------------- |
| `damagePerSecond`          | Enabled returned weapons, while firing               |
| `sustainedDamagePerSecond` | Enabled returned weapons, averaged over reloads      |
| `energyPerSecond`          | Enabled returned weapons' burst WEP draw             |
| `sustainedEnergyPerSecond` | Enabled returned weapons' reload-averaged WEP draw   |
| `heatPerSecond`            | Enabled returned weapons' burst heat                 |
| `sustainedHeatPerSecond`   | Enabled returned weapons' reload-averaged heat       |
| `thermalLoad`              | Sum of included modules' package thermal-load fields |
| `powerDraw`                | Enabled returned weapons' deployed plant demand      |
| `damageByType`             | Exact burst `DamageSplit`                            |
| `sustainedDamageByType`    | Exact sustained `DamageSplit`                        |

The total is never reconstructed from the fitted entries. Every numeric zero remains numeric.

### Each `FittedWeaponMetrics`

Each entry retains:

- exact `slot`, `symbol`, canonical package `name` and `enabled`;
- exact nested `WeaponMetrics`, including all required damage, cadence, WEP, heat, thermal-load,
  plant-draw, damage-split and continuous-fire fields;
- exact `AmmunitionCapacity | null`;
- optional effective `maximumRange`, `falloffRange`, `projectileRange` and `armourPiercing`.

Returned order is identity-bearing presentation order: known weapons in hull-slot order, followed by
unknown/unmapped slots in source order. The application neither sorts nor replaces slot with an
array index.

### `DamageSplit`

`kinetic`, `thermal`, `explosive`, `absolute` and `antiXeno` are required numeric values.
`unclassified` is optional and absent exactly when zero under the 0.1.2 contract. Presentation may
omit the optional row or state that no unclassified damage exists; it must not call the absence
unknown. Anti-xeno remains an overlay on conventional damage and is not included in a locally created
partition or total.

### Optional range and piercing

- Effective `maximumRange` and `falloffRange` are metres only when present.
- `projectileRange.maximumBoundary` is optional; zero remains present.
- `projectileRange.falloffBoundary` is required when the parent exists.
- Projectile boundaries have no invented unit and never drive a range calculation.
- `armourPiercing` is an optional rating, not a percentage or target factor.

Absent optional range/piercing members remain not stated; they are never zero-filled.

### Ammunition

```ts
type AmmunitionMeaning =
  | { readonly kind: 'none'; readonly source: null }
  | { readonly kind: 'finite'; readonly source: AmmunitionCapacity }
  | { readonly kind: 'unlimited'; readonly source: AmmunitionCapacity };
```

This is a presentation discriminator over the retained package member:

- `null` means the weapon carries no ammunition;
- finite capacity keeps exact `clipSize`, `hopper`, `total` and `unlimited: false`;
- unlimited requires exact `unlimited: true`, retains the package object, and prevents its infinite
  hopper/total from reaching a generic formatter;
- finite hopper zero remains exact zero and is not unlimited.

The capacity describes full rearm, not current loaded rounds.

## HardpointCoverage

This proposed feature-002 type-only port qualifies what the weapon facade could represent. It owns
no offence metric.

```ts
type HardpointCoverage =
  | { readonly kind: 'confirmedEmpty' }
  | { readonly kind: 'complete'; readonly occupiedSlots: readonly string[] }
  | {
      readonly kind: 'partial';
      readonly occupiedSlots: readonly string[];
      readonly unresolved: readonly UnresolvedHardpoint[];
    }
  | { readonly kind: 'unresolvedOnly'; readonly unresolved: readonly UnresolvedHardpoint[] }
  | { readonly kind: 'unavailable' };

interface UnresolvedHardpoint {
  readonly slotKey: string;
  readonly symbol: string;
}
```

Rules:

- every identity comes from feature 002's same-build-revision package slot/fitted views;
- `confirmedEmpty` is valid only when all package hardpoint slots are empty and `weapons` is empty;
- unresolved entries are never inserted into `BuildWeaponMetrics` and receive no invented value;
- each unresolved entry may emit the shared exact-slot target;
- `unavailable` prevents a no-fitted-weapons claim.

## Capacitor result and semantic duration

The package `WeaponsCapacitorMetrics` is retained with all six fields:

| Field                      | Package meaning                                  |
| -------------------------- | ------------------------------------------------ |
| `weaponsPips`              | Package allocation used, from zero through four  |
| `capacity`                 | Powered deployed WEP capacity in MJ              |
| `rechargeRate`             | Actual selected-pip recharge in MJ/s             |
| `sustainedEnergyPerSecond` | Powered, enabled, deployed sustained firing draw |
| `netDrainRate`             | Package loss after recharge, floored at zero     |
| `timeToDrain`              | Seconds from full to empty, or positive infinity |

Feature 003 stores integer half-pips. Feature 007 passes
`conditions.pips.weapons / 2` exactly once and displays returned `weaponsPips`.

```ts
type DurationMeaning =
  | { readonly kind: 'finite'; readonly seconds: number }
  | { readonly kind: 'immediate'; readonly seconds: 0 }
  | { readonly kind: 'sustainingPoweredLoad' }
  | { readonly kind: 'noDrainingPoweredLoad' };
```

The presenter selects:

- finite positive `timeToDrain` -> `finite`;
- zero -> `immediate`;
- infinity with positive returned sustained draw -> `sustainingPoweredLoad`;
- infinity with zero returned sustained draw -> `noDrainingPoweredLoad`.

This classification does not recalculate drain or replace the package result. No generic formatter or
serializer receives infinity.

## DeployedDistributorPowerObservation

Feature 005 must own and export this accepted deployed-state observation before feature 007 tasks.
The final type name may follow feature 005 naming, but its semantics must remain:

```ts
type DeployedDistributorPowerObservation =
  | { readonly kind: 'powered'; readonly slotKey: string; readonly symbol: string }
  | { readonly kind: 'disabled'; readonly slotKey: string; readonly symbol: string }
  | { readonly kind: 'shed'; readonly slotKey: string; readonly symbol: string }
  | { readonly kind: 'absent'; readonly slotKey: string }
  | { readonly kind: 'unresolved'; readonly slotKey: string; readonly symbol: string }
  | {
      readonly kind: 'qualified';
      readonly slotKey: string;
      readonly symbol: string | null;
      readonly reason:
        'unknownDraw' | 'unknownDeployment' | 'knownDrawsOnlyVerdict' | 'packageUnavailable';
    };
```

Feature 005 derives this only from exact slot/fitted state and its package-owned deployed power-budget
semantics. Feature 007 displays it adjacent to capacitor zero/unavailability but never states that one
fact caused the other. Until feature 005 accepts the port, this is a delivery blocker rather than an
implemented contract.

## OffenceStatusProjection

```ts
type NativeFiringCondition =
  'enabledReturnedWeapons' | 'noEnabledReturnedWeapons' | 'noFittedWeapons' | 'qualifiedCoverage';

interface OffenceStatusProjection {
  readonly sustainedDamagePerSecond: number;
  readonly firingCondition: NativeFiringCondition;
}

interface OffenceStatusProvider extends StatusProvider<OffenceStatusProjection, 'sustainedDps'> {}
```

The provider selects exact `weapons.total.sustainedDamagePerSecond`. It returns the captured
revisions, `detailTarget: { kind: 'detail', capability: 'offenceProfile' }`, and:

- `qualifiedSummaryIds: []` for complete populated, confirmed-empty and all-disabled results;
- `qualifiedSummaryIds: ['sustainedDps']` for partial, unresolved-only or unavailable coverage.

Hardpoint deployment selection does not suppress or alter this number because `weaponMetrics()` has
no hardpoint-state input. A numeric zero alone never qualifies the summary.

## Presentation state and intents

```ts
interface OffencePresentationState {
  readonly expandedSlots: ReadonlySet<string>;
}

type OffenceIntent =
  | { readonly kind: 'openSlot'; readonly target: { kind: 'slot'; slotKey: string } }
  | { readonly kind: 'editViewingConditions' }
  | { readonly kind: 'applyViewingConditions' }
  | { readonly kind: 'resetViewingConditions' };
```

Expanded state is keyed by exact returned slot, exists only in memory and clears on build
replacement. Viewing-condition intents delegate to feature 003. Slot intent uses feature 003's shared
`WorkspaceTarget` shape and delegates reveal/edit behavior to feature 002.

Canonical `FittedWeaponMetrics.name` remains in the domain snapshot. The presenter obtains localized
game text by exact symbol through feature 011 and the Almanac i18n helper, retaining disclosed
canonical fallback separately.

## Relationships

```text
feature 001 active build/revision ──> weaponMetrics() ──> exact BuildWeaponMetrics
              │                              │
              │                              ├──> OffenceStatusProvider ──> feature 003 Status
              │                              └──> exact slot targets ─────> feature 002
              ├──> feature 002 coverage ────────> honest empty/qualified context
              └──> feature 005 deployed port ──> distributor power observation

feature 003 settled WEP half-pips / revision
              └── divide by two once ──> weaponsCapacitorMetrics()

all current inputs ──atomic publication──> OffenceSnapshot
```

## Validation invariants

- Snapshot revisions match the captured active build and settled conditions at publication.
- `weaponMetrics()` is called at most once per build projection; detail and Status share it.
- `weaponsCapacitorMetrics()` is called once per projected revision pair with WEP half-pips divided
  by two exactly once.
- Every package result object, field, weapon and returned order remains intact.
- No unresolved hardpoint enters package results or receives offence values.
- Optional unclassified absence means zero unclassified damage; optional range/piercing absence
  remains not stated.
- No infinity reaches generic serialization/formatting.
- Weapon total EPS and capacitor draw remain independent package scopes.
- Every slot action carries the exact source key once.
- Any mismatched/stale integration read is discarded or fails the current revision; it is never
  relabelled.

## State transitions

```text
no active build -> noBuild
activate/replace/edit build or settle conditions -> pending(captured revisions)
  required port absent/mismatched -> failure(current revisions)
  package/projector exception -> failure(current revisions)
  newer revision appears -> discard and project newer context
  all reads current -> ready(one immutable snapshot)
active build removed -> noBuild
```

Expansion may survive an ordinary edit only while its exact slot still exists. It never survives an
active-build replacement and never changes a build or revision.
