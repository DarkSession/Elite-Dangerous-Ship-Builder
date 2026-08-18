# Data Model: Defence Profile

Every game-bearing value is an immutable, memory-only projection of one
`@elite-dangerous-almanac/core` `ShipLoadout`. Feature 006 owns no fitted state, persisted metric,
power rule, defence formula or catalogue. Feature 001 owns the active build revision; feature 003
owns conditions, provider lifecycle and condition revision.

## DefenceProjection

One successful same-revision package read.

| Field               | Type                                | Rule                                                                  |
| ------------------- | ----------------------------------- | --------------------------------------------------------------------- |
| `revision`          | `StatusRevisionContext`             | Captured feature 003 build/condition revision                         |
| `systemsPips`       | number in `[0, 4]`                  | `revision.conditions.pips.systems / 2`, passed to both shield calls   |
| `shield`            | `CalculationView<ShieldSnapshot>`   | Complete value or all ordered package issues                          |
| `recovery`          | `CalculationView<RecoverySnapshot>` | Independent complete value or all ordered package issues              |
| `cellBanks`         | `CellBankCollection`                | Exact package collection and explicit empty/fitted distinction        |
| `bankPowerContext`  | `BankPowerContext`                  | Exact or globally qualified by package `unknownDraws`                 |
| `armour`            | `ArmourSnapshot`                    | Non-nullable package result copied exactly                            |
| `hardness`          | number                              | Active package hull's exact hardness rating                           |
| `shieldRoleRecords` | readonly `FittedDefenceRole[]`      | Resolved fitted shield-role/navigation records; no contribution claim |
| `armourRoleRecords` | readonly `FittedDefenceRole[]`      | Actual fitted armour/reinforcement navigation records                 |

Invariants:

- Every field belongs to the same captured revision; a stale projection is never published under a
  newer revision.
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
  readonly field:
    | 'mass'
    | 'cargoCapacity'
    | 'fuelCapacity'
    | 'frameShiftDrive'
    | 'powerCapacity'
    | 'powerDraw'
    | 'thrusters'
    | 'shieldGenerator';
  readonly reason: 'missing' | 'unresolved' | 'disabled' | 'shed' | 'invalid';
  readonly slot?: string;
  readonly symbol?: string;
  readonly params?: Readonly<Record<string, string | number>>;
  readonly packageIssue: CalculationIssue;
}
```

Rules:

- `reason: 'unresolved'` is an exact package calculation-issue reason for package-resolved build
  input; it never carries or authorizes an unknown module identity;
- `packageIssue` is retained for `getCalculationIssueMessage()`; application code does not parse its
  English `message`.
- `slot` and `symbol` remain exact package identities and may authorize a workspace slot target.
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

## SemanticNumber

The presentation boundary prevents generic formatting from erasing non-finite meaning:

```ts
type SemanticNumber =
  | { kind: 'finite'; value: number }
  | { kind: 'unboundedEffectiveHitPoints' }
  | { kind: 'cannotReachRecoveryThreshold' }
  | { kind: 'cannotRegenerateToFull' };
```

Only positive infinity in its owning field maps to a sentinel. Finite negative and zero values remain
`finite` with their exact values.

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
- `reinforcement` is MJ from one complete activation, not a rate.
- `powered` is the package's enabled-and-fed verdict with hardpoints deployed.

## BankPowerContext

```ts
type BankPowerContext =
  | { kind: 'complete' }
  | {
      kind: 'unknownDraws';
      slots: readonly string[];
    };
```

A non-empty `powerBudget().unknownDraws` selects `unknownDraws`. Its slots are package labels only;
they do not target a bank unless they are an exact bank slot. The qualification applies to the whole
bank result because any omitted enabled draw may change which lower-priority bands are powered. The
application does not change the returned bank booleans or totals.

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

## FittedDefenceRole

```ts
type DefenceRole =
  | 'shieldGenerator'
  | 'shieldBooster'
  | 'shieldReinforcement'
  | 'bulkhead'
  | 'hullReinforcement'
  | 'moduleReinforcement';

interface FittedDefenceRole {
  readonly role: DefenceRole;
  readonly slotKey: string;
  readonly symbol: string;
  readonly enabled: boolean | 'unspecified';
}
```

Classification uses the actual armour slot or a package-resolved `engineeringGroup`. Only resolved
modules enter this role list; unavailable role or stat data produces no guessed record. Exact package
calculation issues may separately use reason `unresolved`, but that is not a fitted identity state.
These are fitted-role/navigation records, not facade-input provenance:

- they carry no allocated contribution, resistance share or local power verdict;
- duplicate symbols remain distinct by `slotKey`;
- package slot order is preserved within stable role groups;
- a bank is not duplicated here because `CellBankView` already supplies its exact identity/action.

## DefenceStatusProjection

Feature 006 exports the area-owned value consumed by feature 003's generic provider envelope:

```ts
interface DefenceStatusProjection {
  readonly shieldStrength:
    | { kind: 'ready'; value: number }
    | { kind: 'unavailable'; issues: readonly CalculationIssueView[] };
  readonly armour: { kind: 'ready'; value: number };
  readonly detailTarget: { kind: 'detail'; capability: 'defenceProfile' };
  readonly qualifiedSummaryIds: readonly DefenceQualificationId[];
}

type DefenceQualificationId = 'defence.cellBanks.unknownPowerDraws';
```

The enclosing feature 003 provider adds the captured build/condition revisions. The qualification ID
is present only when the bank result is power-qualified; it is stable application identity, not a
translated message or package diagnosis.

## State transitions

```text
no active build
  -> feature 003 noBuild

new build or settled condition revision
  -> feature 003 pending(current revision; no stale payload)
  -> ready(DefenceProjection + DefenceStatusProjection)
  -> failure(current revision; no fabricated partial snapshot)

complete shield/recovery
  <-> unavailable(ordered package issues)

no banks
  <-> fitted banks
  <-> fitted/all-unpowered with zero totals

complete bank power context
  <-> unknown-draw-qualified package projection
```

Changing locale or selected surface re-presents the same projection and changes no build/condition
revision. Exact-slot activation changes workspace selection only and never changes the projection.
