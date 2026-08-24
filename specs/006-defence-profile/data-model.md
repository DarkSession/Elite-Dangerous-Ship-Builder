# Data Model: Defence Profile

> **Reconciled at implementation, 2026-08-24.** Three structures below described a shape the build
> does not have: a `revision` field feature 003 never published, a `SemanticNumber` presentation
> union and a `DefenceStatusProjection` envelope. Each is marked where it stands. The SYS pips are
> taken from feature 005's own store, which already publishes the package's `[0, 4]` units, so the
> halving this document specified is not applied.

Every game-bearing value is an immutable, memory-only projection of one
`@elite-dangerous-almanac/core` `ShipLoadout`. Feature 006 owns no fitted state, persisted metric,
power rule, defence formula or catalogue. Feature 001 owns the active build revision; feature 005
owns the SYS allocation this projection is read at.

## Defence

One synchronous package read, built from a `ShipLoadout` and one condition.

| Field         | Type                                | Rule                                                            |
| ------------- | ----------------------------------- | --------------------------------------------------------------- |
| `systemsPips` | number in `[0, 4]`                  | The standing allocation, passed to both shield calls            |
| `shield`      | `CalculationView<ShieldSnapshot>`   | Complete value or all ordered package issues                    |
| `recovery`    | `CalculationView<RecoverySnapshot>` | Independent complete value or all ordered package issues        |
| `cellBanks`   | `CellBankCollection`                | Exact package collection and explicit empty/fitted distinction  |
| `armour`      | `ArmourSnapshot`                    | Non-nullable package result copied exactly                      |
| `hardness`    | number                              | Active package hull's exact hardness rating                     |
| `shieldRoles` | readonly `DefenceRoleGroup[]`       | The package's own shield aggregates, each with what produced it |
| `armourRoles` | readonly `DefenceRoleGroup[]`       | The package's own armour aggregates, each with what produced it |

The one condition is the allocation:

```ts
interface DefenceConditions {
  readonly systemsPips: number;
}
```

Invariants:

- The projection is pure and synchronous: it is recomputed from the loadout at the revision its
  reader is on, and never held across one.
- Both shield calls receive the same explicit SYS pips despite their different package defaults.
- Shield and recovery completeness remain independent and retain their own issue order.
- Shield unavailability never suppresses banks, armour, hardness or module protection.
- No projection field enters persistence, history, preferences, routes, links or SLEF.
- Provider lifecycle (`noBuild`, `pending`, `ready`, `failure`) wraps this value and is not repeated
  inside it.

## CalculationView

```ts
type CalculationView<T> =
  { kind: 'complete'; value: T } | { kind: 'unavailable'; issues: readonly CalculationIssueView[] };

interface CalculationIssueView {
  readonly field: CalculationIssue['field'];
  readonly reason: CalculationIssue['reason'];
  readonly slot: string | undefined;
  readonly symbol: string | undefined;
  readonly params: CalculationIssue['params'];
  readonly packageIssue: CalculationIssue;
}
```

Rules:

- `reason: 'unresolved'` is an exact package calculation-issue reason for package-resolved build
  input; it accepts only package-resolved module identities;
- `packageIssue` is retained for `getCalculationIssueMessage()`; application code does not parse its
  English `message`.
- `field` and `reason` are the package's own unions rather than a copy of them, so a package that
  adds a field does not silently fall outside this view. The package's field list is `mass`,
  `fuelCapacity`, `frameShiftDrive`, `powerCapacity`, `powerDraw`, `thrusters` and
  `shieldGenerator`; it has no `cargoCapacity`.
- `slot` and `symbol` remain exact package identities.
- No issue is collapsed, reordered, deduplicated or relabeled.
- Incomplete shield/recovery is a valid package state, not a failed `DefenceProjection`.

## ShieldSnapshot

```ts
interface ShieldSnapshot {
  readonly strength: number;
  readonly generator: number;
  readonly boosters: number;
  readonly reinforcement: number;
  readonly massCurveMultiplier: number;
  readonly boostMultiplier: number;
  readonly systemsResistance: number;
  readonly damage: readonly DamageDefenceValue[];
}
```

All scalar values copy `ShieldMetrics`. `damage` has exactly one package-ordered presentation row for
`kinetic`, `thermal`, `explosive` and `caustic`, each pairing the same-key resistance with effective
hit points.

## RecoverySnapshot

```ts
interface RecoverySnapshot {
  readonly regenRate: number;
  readonly brokenRegenRate: number;
  readonly recoveryTime: number;
  readonly regenTime: number;
}
```

`recoveryTime` is collapse to the 50% raise threshold, including the package's delay. `regenTime` is
50% to full. They are never combined into one duration.

## DamageDefenceValue

```ts
type DamageType = 'kinetic' | 'thermal' | 'explosive' | 'caustic';

interface DamageDefenceValue {
  readonly type: DamageType;
  readonly resistance: number;
  readonly effectiveHitPoints: number;
}
```

Rules:

- Resistance remains a fraction, including zero and negative values.
- Shield effective hit points are in MJ; armour effective hit points are in hull points of raw
  damage capacity.
- `Infinity` remains in the raw snapshot. The presenter maps it to a field-specific semantic state;
  it is never JSON-serialized, clamped or replaced.

## Non-finite values

> **Withdrawn at implementation.** A `SemanticNumber` union was specified here as a presentation
> boundary. It was a second copy of the projection's numbers, and the surface reads the raw fields
> instead: the projection keeps `Infinity` exactly as the package returned it, and the component
> decides, per field, which phrase stands in its place.

`Infinity` is never JSON-serialized, clamped or replaced. Only positive infinity in its owning field
reads as a sentinel; finite negative and zero values are drawn as themselves.

## CellBankCollection

```ts
type CellBankCollection =
  | { kind: 'noneFitted' }
  | {
      kind: 'fitted';
      totalRestorable: number;
      totalCells: number;
      banks: readonly CellBankView[];
    };

interface CellBankView {
  readonly slotKey: string;
  readonly symbol: string;
  readonly identity: ModuleIdentity | null;
  readonly reinforcement: number;
  readonly cells: number;
  readonly spinUp: number;
  readonly duration: number;
  readonly heat: number;
  readonly powered: boolean;
}
```

Rules:

- `noneFitted` is selected only by `summary.banks.length === 0`.
- A non-empty all-unpowered list remains `fitted`, even when both totals are zero.
- Bank order and every field come directly from `cellBanks()`.
- `identity` is the exception: the summary carries no class or rating, so the canvas's `5A` is read
  off the fitted record found under the exact `slotKey` the summary reported. It is `null` where the
  package resolved no effective stats for that mount.
- `reinforcement` is MJ from one complete activation, not a rate.
- `powered` is the package's enabled-and-fed verdict with hardpoints deployed.

## ArmourSnapshot

```ts
interface ArmourSnapshot {
  readonly hitPoints: number;
  readonly bulkheads: number;
  readonly reinforcement: number;
  readonly damage: readonly DamageDefenceValue[];
  readonly moduleArmour: number;
  readonly moduleProtection: number;
}
```

`armourMetrics()` is non-nullable for a successfully constructed active known hull. A thrown package
call or a failed exact hull lookup fails the enclosing provider projection. It does not produce an
`ArmourSnapshot.unavailable` state.

Separation invariants:

- `hitPoints`, `bulkheads` and `reinforcement` are hull points.
- `moduleArmour` is module-protection hit points and never enters `hitPoints`.
- `moduleProtection` is a fraction and never becomes hit points.
- `hardness` is stored beside, not inside, armour and is neither a percentage nor hit points.
- The package stock-armour calculation fallback does not create a fitted role record.

## DefenceRoleGroup

```ts
type DefenceRole =
  'shieldGenerator' | 'shieldBooster' | 'shieldReinforcement' | 'bulkhead' | 'hullReinforcement';

interface DefenceRoleGroup {
  readonly role: DefenceRole;
  readonly contribution: number;
  readonly modules: readonly FittedDefenceModule[];
}

interface FittedDefenceModule {
  readonly slotKey: string;
  readonly symbol: string;
  readonly enabled: boolean | 'unspecified';
  readonly identity: ModuleIdentity | null;
}
```

There is no `moduleReinforcement` role: the package reports module armour as a figure on
`ArmourMetrics` and returns no module-reinforcement group to classify. Guardian and ordinary hull
reinforcements are one group, because the package publishes one aggregate for the pair.

Classification uses the actual armour slot or a package-resolved `engineeringGroup`. Only resolved
modules enter a group; unavailable role or stat data produces no guessed record.

- `contribution` is the package's own aggregate for the role. It is never divided among `modules`;
- duplicate symbols remain distinct by `slotKey`;
- package slot order is preserved within stable role groups;
- a bank is not duplicated here because `CellBankView` already supplies its exact identity.

## The status rail block

> **Withdrawn at implementation.** The envelope below was specified against a feature 003 provider
> that does not exist. The rail block reads the same `Defence` projection the cards read and draws
> the two pools from it, which is what canvas 1c's Status rail holds. The original shape is kept
> here for the record:

```ts
interface DefenceStatusProjection {
  readonly shieldStrength:
    | { kind: 'ready'; value: number }
    | { kind: 'unavailable'; issues: readonly CalculationIssueView[] };
  readonly armour: { kind: 'ready'; value: number };
  readonly detailTarget: { kind: 'detail'; capability: 'defenceProfile' };
  readonly qualifiedSummaryIds: readonly 'shieldStrength'[];
}
```

What survives of it is the rule: a refused shield reads as unavailable in the rail exactly as it
does in the card, the armour figure is always present because the package armour result is
non-nullable, and the block adds no qualification of its own to an exact package value.

## State transitions

```text
no active build
  -> the workspace's own no-build state; no package read

a new build revision, or a new SYS allocation
  -> the projection is recomputed from the loadout at that revision

complete shield/recovery
  <-> unavailable(ordered package issues)

no banks
  <-> fitted banks
  <-> fitted/all-unpowered with zero totals
```

Changing locale or the open mode re-presents the same projection and changes no build revision. The
surface holds no control, so nothing in it can change the projection at all.
