# Data Model: Ship Statistics and Status

All game-bearing values are immutable projections of one `ShipLoadout` revision or of a feature
005–009 area result. Application types add only viewing, coordination, presentation and local
provenance state.

## ViewingConditions

```ts
type HalfPips = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type LoadState = 'maximumJump' | 'unladen' | 'laden';

interface ViewingConditions {
  load: LoadState;
  pips: {
    systems: HalfPips;
    engines: HalfPips;
    weapons: HalfPips;
  };
  hardpoints: 'deployed' | 'retracted';
}
```

Invariant: the three half-pip values total 12. Defaults are `unladen`, `4/4/4` half-pips and
`deployed`. Package adapters divide accepted half-pips by two. The type is absent from all persisted,
history, URL and exchange models.

`ViewingConditionsDraft` carries localized input/control state separately. It becomes settled only
when all three values are half-step values from zero through four and total six; invalid drafts do not
increment the condition revision.

## RevisionContext

```ts
interface RevisionContext {
  loadout: ShipLoadout;
  buildRevision: number;
  conditions: ViewingConditions;
  conditionsRevision: number;
}
```

The assembler captures this record once. `buildRevision` increments for every committed edit,
undo/redo and active-build replacement. `conditionsRevision` increments for every accepted condition
change. Neither package-object identity nor timestamps substitute for a revision.

## StructuralStatus

| Field      | Type                             | Rule                                                   |
| ---------- | -------------------------------- | ------------------------------------------------------ |
| `valid`    | boolean                          | Exact `ShipLoadout.validation.valid`                   |
| `complete` | boolean                          | Exact `ShipLoadout.validation.complete`                |
| `issues`   | readonly `ValidationIssueView[]` | One view per returned package issue, in returned order |

`valid` and `complete` are independent. Presentation keys state only whether structural errors were
reported and whether the required/classified loadout is complete.

### ValidationIssueView

| Field      | Type                          | Rule                                                               |
| ---------- | ----------------------------- | ------------------------------------------------------------------ |
| `code`     | package issue code            | Preserved without regrouping                                       |
| `severity` | package severity              | Preserved; also rendered as localized text                         |
| `slot`     | string or null                | Exact package slot; sole authorization for a slot target           |
| `symbol`   | string or null                | Preserved package identity, not used to infer a slot               |
| `params`   | readonly language-neutral map | Preserved, including a package constraint when supplied            |
| `message`  | string                        | Canonical package diagnostic; never parsed or privately translated |
| `target`   | `WorkspaceTarget \| null`     | Exact slot target only when `slot` exists                          |

## ResultCondition

A localized presentation descriptor whose identity is application-owned but whose values come from
the settled `ViewingConditions`. Examples identify selected load, SYS/ENG/WEP pips and deployed or
retracted hardpoints. It never changes the underlying package result.

## ResultQualification

Structured evidence that an owning area says a result is bounded or provisional.

| Field     | Type                  | Rule                                                                 |
| --------- | --------------------- | -------------------------------------------------------------------- |
| `kind`    | stable area-owned key | Examples: unknown contribution, unpriced article, unavailable recipe |
| `slot`    | string or null        | Only when supplied by the package/area result                        |
| `symbol`  | string or null        | Preserved package identity                                           |
| `params`  | readonly map          | Structured values; never parsed from prose                           |
| `message` | string or null        | Package diagnostic when one exists                                   |

## HeadlineResult

```ts
type HeadlineResult<T> =
  | {
      state: 'available';
      value: T;
      unit: UnitIdentity;
      conditions: readonly ResultCondition[];
      target: WorkspaceTarget;
    }
  | {
      state: 'lowerBound';
      value: T;
      unit: UnitIdentity;
      conditions: readonly ResultCondition[];
      qualifications: readonly ResultQualification[];
      target: WorkspaceTarget;
    }
  | {
      state: 'incomplete';
      issues: readonly CalculationIssue[];
      conditions: readonly ResultCondition[];
      target: WorkspaceTarget;
    }
  | {
      state: 'unavailable';
      observableState: ObservableState | null;
      conditions: readonly ResultCondition[];
      target: WorkspaceTarget;
    }
  | {
      state: 'infinite';
      meaning: InfiniteMeaning;
      conditions: readonly ResultCondition[];
      target: WorkspaceTarget;
    }
  | { state: 'absent' };
```

`UnitIdentity`, `ObservableState` and `InfiniteMeaning` are stable localization/formatting identities,
not game formulas. Exact numeric zero uses `available`. `unavailable` never receives a fabricated
number. `absent` is for a summary that does not apply, not a failed result.

## HeadlineSet

```ts
interface HeadlineSet {
  power: PowerHeadline;
  shieldStrength: HeadlineResult<number>;
  armour: HeadlineResult<number>;
  sustainedDps: HeadlineResult<number>;
  jumpRange: HeadlineResult<number>;
  topSpeed: HeadlineResult<number>;
  unladenMass: HeadlineResult<number>;
}
```

`PowerHeadline` keeps selected draw and capacity in one area-owned presentation because their meaning
depends on their relationship. It does not synthesize a retracted utilisation/headroom verdict that
the package does not supply.

## AssemblyRequirementsSummary

Feature 009 owns this projection. Feature 003 treats it as opaque except for standard result-state,
target and count metadata.

| Field       | Type                           | Rule                                                                |
| ----------- | ------------------------------ | ------------------------------------------------------------------- |
| `retail`    | area-owned credit summary      | Hull, module and rebuy package fields; unpriced identities retained |
| `mercCoin`  | area-owned result or `absent`  | Separate and present only for package-recognized Mercenary articles |
| `materials` | area-owned requirement summary | Exact package recipe aggregation and unavailable entries            |
| `targets`   | readonly `WorkspaceTarget[]`   | Supplied by feature 009, never inferred here                        |

## FixedMountNormalisationProvenance

Local workflow metadata defined with feature 001 persistence:

| Field                 | Type             | Rule                                                      |
| --------------------- | ---------------- | --------------------------------------------------------- |
| `slotKey`             | string           | Exact affected game slot key                              |
| `originalIdentity`    | string or null   | Original missing/unresolved module identity               |
| `replacementIdentity` | string           | Package default identity used by sanctioned normalisation |
| `normalisedAt`        | ISO-8601 instant | Display metadata only; never revision/ordering authority  |

The entry is outside `BuildSnapshotV1`. It is created by feature 002 ingress normalisation and removed
after a successful Commander edit to that slot. It is not restored by undo and cannot be serialized
by link or SLEF codecs.

## WorkspaceTarget

```ts
type WorkspaceTarget =
  | { kind: 'slot'; slotKey: string }
  | {
      kind: 'detail';
      capability: 'power' | 'defence' | 'offence' | 'mobility' | 'cost';
      anchor: string;
    }
  | null;
```

Targets are package/area supplied. `anchor` is an application identity exposed by the owning detailed
capability, not a URL fragment and not an inferred game location.

## StatusSnapshot

```ts
interface StatusSnapshot {
  buildRevision: number;
  conditionsRevision: number;
  conditions: ViewingConditions;
  structural: StructuralStatus;
  normalisationProvenance: readonly FixedMountNormalisationProvenance[];
  headlines: HeadlineSet;
  assembly: AssemblyRequirementsSummary;
  issueCount: number;
  qualificationCount: number;
}
```

Validation:

- every field comes from one captured `RevisionContext` and the active record metadata associated
  with its build revision;
- `issueCount` equals the visible package validation issue count;
- `qualificationCount` counts each visible qualified/incomplete summary once, not each phrase or
  package issue inside it;
- no snapshot is published if either revision has become stale;
- no active build means no `StatusSnapshot`.

## AnnouncementState

| Field               | Type                                 | Rule                                                |
| ------------------- | ------------------------------------ | --------------------------------------------------- |
| `lastSettledCounts` | `{ issues; qualifications } \| null` | Initial null suppresses redundant load announcement |
| `pendingRevision`   | revision pair or null                | Replaced/coalesced by a newer pending snapshot      |
| `message`           | localized message identity or null   | Contains both current counts after a settled change |

The state carries no diagnostic prose and is not persisted.
