# Workspace, Status and Slot Integration Contract

## Ownership

- Feature 001 supplies one active `{ loadout, buildRevision }` and the `/build` workspace.
- Feature 002 supplies same-revision package hardpoint coverage and consumes exact-slot targets.
- Feature 003 supplies settled `ViewingConditions`, `conditionsRevision`, `StatusRevisionContext`,
  generic `StatusProvider<T, I>`, capability selection and the shared `WorkspaceTarget` union.
- Feature 005 owns deployed distributor power semantics and must export the observation consumed here.
- Feature 007 owns the exact weapon/capacitor projection, Status contribution and capability
  presentation.
- Feature 011 supplies shared components, tokens, localization/game text, announcements, previews and
  accessibility verification.

Feature 007 creates no route, build/condition/slot store, power calculation or persisted field.

## Revision transaction

For one projection:

1. Capture feature 003's exact `StatusRevisionContext`.
2. Obtain or compute the build-revision-cached `BuildWeaponMetrics` once.
3. Read feature 002's hardpoint coverage stamped with the same `buildRevision`.
4. Divide settled WEP half-pips by two once and call `weaponsCapacitorMetrics()`.
5. Read feature 005's deployed distributor power observation stamped with the captured context.
6. Confirm all revisions remain current and publish one immutable `OffenceSnapshot`.

A newer build/condition discards the older transaction. A mismatched read fails the current
transaction; it is never relabelled. The Status provider may select the cached weapon result without
waiting on detail expansion or recalculating the build.

## Required feature-002 boundary

Before tasks, feature 002 must accept a type-only read that supplies `HardpointCoverage` for one
captured build revision. The read:

- uses package slot/fitted views rather than parsed names or array positions;
- distinguishes empty, complete and unavailable coverage;
- provides no weapon metric and never receives an unknown module identity because ingress has already
  applied package empty/default normalization.

This accepted boundary does not yet exist by name in feature 002 and is a delivery blocker.

## Required feature-005 boundary

Before tasks, feature 005 must accept a deployed distributor power-observation port backed by its
authoritative `powerBudget()` interpretation and exact distributor slot state. The read returns the
captured revisions and one of powered, disabled, shed, absent or unavailable.

Feature 007 must not:

- infer the observation from capacitor capacity/recharge;
- interpret `distributorMetrics() === null` as a cause;
- join consumers to priority bands itself;
- parse a symbol, priority, validation message or slot name;
- substitute feature 005's current `DistributorView.ready | unavailable` for a cause-specific port.

The accepted feature-005 contracts currently expose no feature-007 observation, so the plan records
this as missing rather than pretending the dependency is delivered.

## Offence Status provider

Feature 007 exports:

```ts
interface OffenceStatusProjection {
  readonly sustainedDamagePerSecond: number;
  readonly firingCondition:
    'enabledReturnedWeapons' | 'noEnabledReturnedWeapons' | 'noFittedWeapons' | 'qualifiedCoverage';
}

interface OffenceStatusProvider extends StatusProvider<OffenceStatusProjection, 'sustainedDps'> {}
```

The provider:

1. selects exact `weaponMetrics().total.sustainedDamagePerSecond` from the shared build projection;
2. derives only the package-native presentation condition from returned entries and accepted
   hardpoint coverage;
3. returns the captured build and condition revisions;
4. returns `detailTarget: { kind: 'detail', capability: 'offenceProfile' }`;
5. returns `qualifiedSummaryIds: ['sustainedDps']` only for unavailable coverage; otherwise `[]`.

Numeric zero does not itself qualify the summary. Selected hardpoint state and WEP pips do not alter
sustained DPS because `weaponMetrics()` accepts neither input. Feature 003 copies the value,
condition and qualification unchanged and performs no Almanac call.

## Exact-slot handoff

```ts
type OffenceSlotTarget = { kind: 'slot'; slotKey: string };
```

Returned weapons use exact `FittedWeaponMetrics.slot`. Feature 002 reveals/selects the slot in one interaction: inline in roomy workspace
composition or in the existing selected-slot layer at narrow widths. Duplicate module symbols never
target one another.

Slot/capability selection changes no build, revision, persistence, history, route, link or SLEF.

## Presentation and announcements

- Feature 003's Offence headline opens the complete capability in one activation.
- The capability composes feature 003's shared viewing-condition control without owning parallel
  WEP state.
- Canonical package weapon names remain retained; feature 011 supplies localized game text by symbol
  and disclosed fallback.
- One settled build/condition/coverage change emits at most one concise localized polite summary.
- Detail expansion is silent unless it changes an explicitly announced state.
- Exact-slot opening delegates to feature 002's selection announcement and is not announced twice.
- A current projection/integration failure uses feature 011's blocking alert once.
- Initial, unchanged and discarded stale projections are silent.

## Verification

- One identical context reaches weapon, coverage, capacitor and deployed-power boundaries.
- Detail and Status use the same cached `BuildWeaponMetrics` object.
- Status sustained DPS deep-equals the package total and carries the required detail target.
- Qualification identity appears once only for incomplete/unavailable coverage.
- WEP/hardpoint selection does not alter the Status sustained-DPS number.
- Every returned-weapon slot target carries the exact original key once at wide and narrow layouts.
- Mismatched revisions/ports never publish or target stale data.
- Capability, expansion and slot selection never enter serialization.
- Announcements are localized, deduplicated and state-specific.
