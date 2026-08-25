# Data Model: Ship Statistics and Status

> **Superseded 2026-08-22 (wave 11). Nothing below is built.** Three collisions between the accepted
> specification and `.design/Ship Builder.dc.html` were surfaced before implementation and **the
> design won all three** ([design/reference-review.md](./design/reference-review.md)). `ViewingConditions`
> and its half-pip domain went to feature 005 with ruling C. The provider envelope, the revision
> context, the composition transaction and the status lifecycle were **withdrawn rather than
> reassigned**, and went nowhere: ruling B took the wide Status capability they were assembled for,
> and ruling C removed this feature's dependency on features 005–009, so there is no owner result
> left to compose and nothing for an envelope to carry. Feature 005 records the same withdrawal from
> its own side (`specs/005-power-and-heat/contracts/integration-ports.md`), and this feature's
> [tasks.md](./tasks.md#retired-tasks) retires them as withdrawn, not moved. The announcement state
> went with ruling A, which withdrew the counts it announced. Feature 003 adds no domain type, no store and no port: `ShipLoadout.validation()`
> is a call on the build feature 001 already holds in memory, and the one component reads it the way
> `edsb-cost-materials` reads its own projection.
>
> This file is retained as the record of what was ruled against, which is why it is left as it was
> written. The live design outputs are [design/reference-review.md](./design/reference-review.md),
> [design/status-rail.md](./design/status-rail.md),
> [design/screen-inventory.md](./design/screen-inventory.md) and
> [design/component-state-preview-matrix.md](./design/component-state-preview-matrix.md).

Feature 003 owns viewing, composition and feedback state. Game calculations and their semantic
result unions remain owned by features 005–009. The types below reference those contracts instead of
copying their fields.

## ViewingConditions

```ts
type HalfPips = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type LoadState = 'maximumJump' | 'unladen' | 'laden';

interface ViewingConditions {
  readonly load: LoadState;
  readonly pips: {
    readonly systems: HalfPips;
    readonly engines: HalfPips;
    readonly weapons: HalfPips;
  };
  readonly hardpoints: 'deployed' | 'retracted';
}
```

Validation and lifecycle:

- `systems + engines + weapons === 12` half-pips.
- Defaults are `unladen`, `4/4/4` half-pips and `deployed`.
- Providers receive pip values divided by two; no other conversion or redistribution occurs.
- The type is absent from every persistence, history, preference, route, link and SLEF model.

## ViewingConditionsDraft

```ts
interface ViewingConditionsDraft {
  readonly load: LoadState;
  readonly systemsText: string;
  readonly enginesText: string;
  readonly weaponsText: string;
  readonly hardpoints: 'deployed' | 'retracted';
  readonly errors: readonly ConditionDraftError[];
}

type ConditionDraftError =
  | { readonly kind: 'notHalfStep'; readonly bank: 'systems' | 'engines' | 'weapons' }
  | { readonly kind: 'outOfRange'; readonly bank: 'systems' | 'engines' | 'weapons' }
  | { readonly kind: 'wrongTotal'; readonly displayedTotal: number | null };
```

The draft is presentation input, not a partial settled condition. Apply creates a complete immutable
`ViewingConditions` only when each displayed value is `0..4` in 0.5 steps and the total is six.
Invalid Apply retains the prior settled tuple and condition revision.

## StatusRevisionContext

```ts
interface StatusRevisionContext {
  readonly loadout: ShipLoadout;
  readonly buildRevision: number;
  readonly conditions: ViewingConditions;
  readonly conditionsRevision: number;
}
```

`buildRevision` comes from feature 001's atomic active-build boundary. Feature 002 advances that
revision once for a committed edit or undo/redo; feature 001 advances it for active-build
replacement. It is not the persisted local-record UUID.
`conditionsRevision` increments once for each changed, valid settled condition tuple. Locale and
surface selection change neither revision.

## StructuralProjection

```ts
interface StructuralProjection {
  readonly validation: LoadoutValidation;
  readonly issueTargets: readonly (SlotTarget | null)[];
}
```

Rules:

- `validation` is the exact immutable object returned by `loadout.validation()` for the context.
- `issueTargets.length === validation.issues.length`.
- Entry `i` is `{ kind: 'slot', slotKey: issue.slot }` only when issue `i` supplies `slot`; otherwise
  it is `null`.
- The package issue is rendered directly, preserving `code`, `severity`, optional `slot`, optional
  `symbol`, optional `LoadoutIssueParams`, canonical message and package order.
- No local issue identifier, grouping, deduplication or readiness verdict is added.

## WorkspaceTarget

```ts
interface SlotTarget {
  readonly kind: 'slot';
  readonly slotKey: string;
}

interface DetailTarget {
  readonly kind: 'detail';
  readonly capability:
    'powerAndHeat' | 'defenceProfile' | 'offenceProfile' | 'mobilityAndJump' | 'costAndMaterials';
}

type WorkspaceTarget = SlotTarget | DetailTarget;
```

Exact package/build slot spelling is retained. A detail target names one accepted in-workspace
capability; it is not a route, fragment or free-form anchor. Headline and assembly summaries always
provide a detail target. An untargeted issue uses `null` outside this union and has no false action.

## StatusProviderRead

Feature 003 defines the envelope while each area owns `T`:

```ts
type StatusSummaryId =
  | 'shieldStrength'
  | 'sustainedDps'
  | 'jumpRange'
  | 'topSpeed'
  | 'unladenMass'
  | 'retailCredits'
  | 'mercCoin'
  | 'materials';

type StatusProviderRead<T, I extends StatusSummaryId> =
  | {
      readonly state: 'ready';
      readonly buildRevision: number;
      readonly conditionsRevision: number;
      readonly value: T;
      readonly qualifiedSummaryIds: readonly I[];
      readonly detailTarget: DetailTarget;
    }
  | {
      readonly state: 'pending';
      readonly buildRevision: number;
      readonly conditionsRevision: number;
    };

interface StatusProvider<T, I extends StatusSummaryId> {
  project(context: StatusRevisionContext): StatusProviderRead<T, I>;
}

type AssemblyRequirementsSummaryId = 'retailCredits' | 'mercCoin' | 'materials';

interface AssemblyRequirementsPort<T> extends StatusProvider<T, AssemblyRequirementsSummaryId> {}
```

Each owner includes an identity once when that visible Status summary is qualified, incomplete or
unavailable under its accepted contract. Nested issues do not add entries. Feature 003 validates
identity ownership and uniqueness, concatenates IDs in fixed provider/summary order and derives the
count without deciding which area state qualifies. Feature 009 omits `mercCoin` when its owner state
is `absent`.

### Provider bundle

```ts
interface StatusProviders<P, D, O, M, A> {
  readonly power: StatusProvider<P, never>;
  readonly defence: StatusProvider<D, 'shieldStrength'>;
  readonly offence: StatusProvider<O, 'sustainedDps'>;
  readonly mobility: StatusProvider<M, 'jumpRange' | 'topSpeed' | 'unladenMass'>;
  readonly assembly: AssemblyRequirementsPort<A>;
}
```

This generic bundle is defined only in the final feature 003 integration stage, after features
005–009 update their owning contracts to export exact adapter/projection types. The accepted feature
009 adapter name remains `AssemblyRequirementsPort`; feature 003 does not replace it with a second
assembly interface.

Owner exports provide exactly these status fields:

| Owner export | Status content                                              | Required detail target |
| ------------ | ----------------------------------------------------------- | ---------------------- |
| feature 005  | selected power draw and capacity                            | `powerAndHeat`         |
| feature 006  | shield strength and armour                                  | `defenceProfile`       |
| feature 007  | package sustained DPS and native firing condition           | `offenceProfile`       |
| feature 008  | selected jump, selected-load/ENG top speed and unladen mass | `mobilityAndJump`      |
| feature 009  | retail fields, conditional Merc Coin and materials          | `costAndMaterials`     |

Each owner type retains its own exact/zero/lower-bound/incomplete/unavailable/infinite/absent states.
Feature 003 has no parallel generic `HeadlineResult` union.

## StatusProjection

```ts
interface StatusProjection<P, D, O, M, A> {
  readonly buildRevision: number;
  readonly conditionsRevision: number;
  readonly conditions: ViewingConditions;
  readonly structural: StructuralProjection;
  readonly power: P;
  readonly defence: D;
  readonly offence: O;
  readonly mobility: M;
  readonly assembly: A;
  readonly issueCount: number;
  readonly qualifiedSummaryIds: readonly StatusSummaryId[];
  readonly qualifiedSummaryCount: number;
}
```

Projection invariants:

- all five ready provider envelopes match the captured build and condition revisions;
- `issueCount === structural.validation.issues.length`;
- `qualifiedSummaryIds` contains only unique owner-allocated identities in fixed provider/summary
  order;
- `qualifiedSummaryCount === qualifiedSummaryIds.length`;
- validation and provider values are published in one assignment;
- no active build means no `StatusProjection`.

## StatusProjectionState

```ts
type StatusProjectionState<P, D, O, M, A> =
  | { readonly state: 'noBuild' }
  | {
      readonly state: 'pending';
      readonly buildRevision: number;
      readonly conditionsRevision: number;
    }
  | { readonly state: 'ready'; readonly projection: StatusProjection<P, D, O, M, A> }
  | {
      readonly state: 'failure';
      readonly buildRevision: number;
      readonly conditionsRevision: number;
      readonly messageKey: StatusFailureMessageKey;
    };

type StatusFailureMessageKey = 'providerUnavailable' | 'projectionFailed';
```

`pending` identifies the requested current context and displays no stale values under its revision.
`failure` is an application integration failure, not a package calculation unavailable state and not
a game diagnosis. The active build remains intact.

State transitions:

```text
no active build -> noBuild
active/replaced/edited build or settled conditions -> evaluate one context
    any provider explicitly pending for the captured pair -> pending
    ready envelope with mismatched revision or invalid summary identity -> failure
    all providers ready and matching -> ready (one atomic publication)
    unexpected composition/provider failure -> failure
newer context during evaluation -> discard older outcome and evaluate newer context
```

## StatusRailView

The rail is a presentation-only compact selection from one ready `StatusProjection`:

```ts
interface StatusRailView {
  readonly revision: { readonly build: number; readonly conditions: number };
  readonly structuralFacts: StructuralFactView;
  readonly issueCount: number;
  readonly qualifiedSummaryCount: number;
  readonly power: PowerHeadlineCompactView;
  readonly headlineCards: readonly HeadlineCompactView[];
  readonly assembly: AssemblyCompactView;
  readonly openStatusTarget: { readonly kind: 'statusCapability' };
}
```

This view formats and selects owner-provided fields; it calculates no game value and contains no
validation issue record. The complete capability is the sole issue-record location.

## AnnouncementState

```ts
interface AnnouncementState {
  readonly lastSettledCounts: {
    readonly issues: number;
    readonly qualifiedSummaries: number;
  } | null;
  readonly pendingRevision: {
    readonly build: number;
    readonly conditions: number;
  } | null;
  readonly messageKey: StatusAnnouncementMessageKey | null;
}

type StatusAnnouncementMessageKey = 'statusCountsChanged';
```

Initial `null` suppresses a load announcement. Only a ready projection can update the state. One
coalesced localized message contains both current counts after either changes; pending, failure,
unchanged and discarded projections are silent.

## Non-persisted presentation state

The selected workspace capability, rail expansion, issue disclosure, focused detail, draft
conditions and announcement state are memory only. None enters `BuildSnapshotV1`, `LocalRecordV1`,
history, preferences, route/query/fragment, compact link or SLEF.
