# Data Model: Defence Profile

Every game-bearing value below is an immutable projection of one active
`@elite-dangerous-almanac/core` `ShipLoadout`. Feature 006 owns no fitted state, persisted metric,
game formula or private catalogue. Feature 001 owns the active build/revision; feature 003 owns the
ephemeral SYS-pip condition/revision.

## DefenceSnapshot

One atomic view of one active-build revision under one settled SYS-pip condition.

| Field                | Type                             | Rule                                                            |
| -------------------- | -------------------------------- | --------------------------------------------------------------- |
| `buildRevision`      | non-negative integer             | Exact active-build revision used by every read                  |
| `conditionsRevision` | non-negative integer             | Exact feature 003 condition revision                            |
| `systemsPips`        | number in `[0, 4]`               | Selected shared condition passed unchanged to both shield calls |
| `powerContext`       | `DefencePowerContext`            | Qualified auxiliary context from same-revision `powerBudget()`  |
| `shield`             | `ShieldProfileView`              | Exact package result or explicit unavailable state              |
| `recovery`           | `ShieldRecoveryView`             | Exact package result or explicit unavailable state              |
| `cellBanks`          | `CellBankCollection`             | Explicit no-bank/fitted distinction with package totals         |
| `armour`             | `ArmourProfileView`              | Exact package/hull result or explicit unavailable state         |
| `shieldSources`      | readonly `DefenceSourceView[]`   | Package-fitted generator/booster/reinforcement identities       |
| `armourSources`      | readonly `DefenceSourceView[]`   | Package-fitted bulkhead/hull/module reinforcement identities    |
| `status`             | `ready \| unavailable \| failed` | Whole-snapshot lifecycle; never retains stale prior values      |

Invariants:

- Every subview shares the same `buildRevision` and `conditionsRevision`.
- Both shield methods receive the same `systemsPips` value.
- Power context comes from one same-revision package budget and exposes no duplicate power UI.
- Shield unavailability does not remove or suppress armour, hardness or module protection.
- A new build/condition revision invalidates the whole prior snapshot before recomputation.
- The snapshot, source manifests and pips are never stored in `localStorage`, history, a build URL or
  SLEF.

## ShieldProfileView

```ts
type ShieldProfileView =
  | {
      kind: 'ready';
      generatorState: GeneratorState;
      strength: number;
      generator: number;
      boosters: number;
      reinforcement: number;
      massCurveMultiplier: number;
      boostMultiplier: number;
      systemsResistance: number;
      damage: readonly DamageDefenceRow[];
    }
  | {
      kind: 'unavailable';
      generatorState: GeneratorState;
    };
```

`ready` copies the complete `ShieldMetrics`. `unavailable` carries no strength, multiplier,
resistance or effective-hit-point placeholder.

### GeneratorState

```ts
type GeneratorState =
  | { kind: 'missing' }
  | { kind: 'disabled'; source: DefenceSourceView }
  | { kind: 'powered'; source: DefenceSourceView }
  | { kind: 'shed'; source: DefenceSourceView }
  | { kind: 'indeterminate'; source?: DefenceSourceView };
```

Rules:

- `missing` requires no package-resolved fitted generator source.
- `disabled` requires a resolved source with `on === false`.
- `powered`/`shed` require matching deployed/retracted verdicts from the generator's package priority
  band and agreement with the released #296 recovery behavior. A source named by `unknownDraws` is
  not conclusive.
- `indeterminate` preserves an unresolved identity, unknown draw or package availability that does
  not authorize a more specific statement.
- The state is context beside `ShieldMetrics`; it never changes its numbers.

## DefencePowerContext

```ts
interface DefencePowerContext {
  generator: 'powered' | 'shed' | 'disabled' | 'missing' | 'indeterminate';
  unknownSlotKeys: readonly string[];
}
```

This is a narrow projection of `ShipLoadout.powerBudget()` plus exact fitted state. A resolved
generator's absent priority selects package default group one; an explicit integer `0..4` selects the
corresponding returned one-based band. Any other raw priority remains indeterminate rather than
locally reproducing package clamping. Deployed/retracted verdicts must agree. `unknownSlotKeys`
copies the budget's returned labels and is used only to qualify matching generator/bank sources. No
draw, total or power calculation is exposed or repeated by feature 006.

## ShieldRecoveryView

```ts
type ShieldRecoveryView =
  | {
      kind: 'ready';
      regenRate: number;
      brokenRegenRate: number;
      recoveryTime: RecoveryDuration;
      regenTime: RegenerationDuration;
    }
  | { kind: 'unavailable'; generatorState: GeneratorState };
```

| Field             | Package source             | Semantic rule                              |
| ----------------- | -------------------------- | ------------------------------------------ |
| `regenRate`       | `ShieldRecovery.regenRate` | Finite MJ/s, including zero                |
| `brokenRegenRate` | `.brokenRegenRate`         | Finite MJ/s, including zero                |
| `recoveryTime`    | `.recoveryTime`            | finite seconds or `cannotRecover`          |
| `regenTime`       | `.regenTime`               | finite seconds or `cannotRegenerateToFull` |

```ts
type RecoveryDuration = { kind: 'seconds'; value: number } | { kind: 'cannotRecover' };
type RegenerationDuration = { kind: 'seconds'; value: number } | { kind: 'cannotRegenerateToFull' };
```

The semantic variants preserve package `Infinity`; they do not replace it with another number.

## CellBankCollection

```ts
type CellBankCollection =
  | { kind: 'noneFitted' }
  | {
      kind: 'fitted';
      totalRestorable: number;
      totalCells: number;
      banks: readonly CellBankView[];
      powerQualification: 'complete' | 'unknownDraws';
    };
```

`noneFitted` corresponds exactly to an empty `CellBankSummary.banks`. A non-empty list always maps to
`fitted`, even when both package totals are zero.

### CellBankView

| Field           | Type                | Package source/rule                                    |
| --------------- | ------------------- | ------------------------------------------------------ |
| `slotKey`       | string              | exact `bank.slot` identity                             |
| `symbol`        | string              | exact `bank.symbol` identity                           |
| `displayName`   | `LocalizedGameText` | Almanac localized name or disclosed canonical fallback |
| `reinforcement` | number              | exact per-activation `bank.reinforcement`, MJ          |
| `cells`         | number              | exact fully-rearmed `bank.cells`                       |
| `spinUp`        | number              | exact seconds                                          |
| `duration`      | number              | exact seconds                                          |
| `heat`          | number              | exact package thermal-load quantity                    |
| `powered`       | boolean             | exact package verdict                                  |

`powerQualification` records that the package documents unknown draws as assumed powered. It never
changes a bank verdict or total. Package order is preserved; identical symbols remain separate.

## ArmourProfileView

```ts
type ArmourProfileView =
  | {
      kind: 'ready';
      hitPoints: number;
      bulkheads: number;
      reinforcement: number;
      damage: readonly DamageDefenceRow[];
      moduleArmour: number;
      moduleProtection: number;
      hullHardness: number;
    }
  | { kind: 'unavailable' };
```

The current beta.12 `armourMetrics()` signature is non-nullable, but the #297 release must provide an
authoritative unavailable/diagnostic outcome for unresolved hull facts. The application boundary is
intentionally discriminated without assuming whether the released package uses `null` or a result
object.

`moduleArmour` and `moduleProtection` never contribute to `hitPoints`. `hullHardness` is the exact
`Ship.hardness` value and is not a weapon-damage result.

## DamageDefenceRow

Exactly four rows exist in this stable semantic order.

```ts
interface DamageDefenceRow {
  type: 'kinetic' | 'thermal' | 'explosive' | 'caustic';
  resistance: number;
  effectiveHitPoints: EffectiveHitPoints;
}

type EffectiveHitPoints = { kind: 'finite'; value: number } | { kind: 'unbounded' };
```

Rules:

- `resistance` is copied unchanged and may be zero or negative.
- `finite.value` is copied unchanged.
- `unbounded` preserves package `Infinity` at/above complete resistance and receives a localized,
  field-specific explanation.
- Rows are presentation fan-out over returned named fields, not a calculation.

## DefenceSourceView

```ts
interface DefenceSourceView {
  role:
    | 'shieldGenerator'
    | 'shieldBooster'
    | 'shieldReinforcement'
    | 'bulkhead'
    | 'hullReinforcement'
    | 'moduleReinforcement';
  slotKey: string;
  symbol: string;
  displayName: LocalizedGameText;
  enabled: boolean | 'unspecified';
  power: 'powered' | 'shed' | 'disabled' | 'unknown' | 'notApplicable';
  sourceOrdinal: number;
}
```

Source classification reads only resolved package fields/capabilities. Symbols, names and slot
positions are never parsed. The manifest carries no contribution field: aggregate package results
remain aggregate. `sourceOrdinal` is package/fitted order and is used only for stable presentation.

Activating a source emits:

```ts
{
  kind: 'openSlot';
  slotKey: string;
}
```

The exact original key is passed to feature 002; display name, symbol and ordinal are never used as
navigation identity.

## LocalizedGameText

| Field         | Type                                                   | Rule                                                  |
| ------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| `text`        | string                                                 | Almanac localized text, or its canonical/raw identity |
| `translation` | `localized \| canonicalFallback \| unresolvedIdentity` | Drives disclosure; never a private translation table  |

## State transitions

1. An active-build edit/replacement increments feature 001's revision and requests a new whole
   snapshot. The prior snapshot cannot be relabelled or partially reused.
2. A valid SYS-pip change increments feature 003's condition revision and recomputes shield/recovery
   together. It creates no build edit or undo/history entry.
3. `openSlot` delegates the exact package key to feature 002 and changes no metric.
4. Loss of the active build discards the snapshot and renders the workspace no-build state.
5. A package failure maps to the whole-snapshot failure state; no prior values or locally substituted
   values remain visible as current.
