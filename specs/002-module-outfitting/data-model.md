# Data Model: Module Outfitting and Engineering

Game-bearing values are current immutable projections of one committed
`@elite-dangerous-almanac/core` `ShipLoadout`. Application records below model workflow, exact
in-memory restoration, search and history; they never replace package facts or calculations.

## OutfittingState

Ephemeral application state layered over feature 001's active build.

| Field              | Type                                      | Rule                                                                       |
| ------------------ | ----------------------------------------- | -------------------------------------------------------------------------- |
| `buildRevision`    | non-negative integer                      | Changes once per committed edit/replacement; never game or persisted state |
| `selectedSlotKey`  | `string \| null`                          | Exact package/game slot key; view state only                               |
| `surface`          | `workspace \| replacement \| engineering` | In-document view state; never route/browser history                        |
| `candidateQuery`   | `CandidateQueryState \| null`             | Current chooser state for the selected exact revision                      |
| `engineeringDraft` | `EngineeringDraft \| null`                | Uncommitted selection state                                                |
| `history`          | `SessionHistoryState`                     | In-memory modelled snapshots only                                          |
| `lastEditFailure`  | `EditFailure \| null`                     | Latest package/application workflow refusal                                |

Invariants:

- Only feature 001 owns the committed `ShipLoadout`; this state contains no second live aggregate.
- A temporary transaction/preview candidate is scoped to one service call and never published.
- No active build clears selection, draft, query and history.
- Selection, category/anatomy/status mode, search, open/close and draft changes never change the
  revision or history.
- Active-build replacement clears editing state/history after ingress succeeds. Ingress refusal keeps
  all current state and separately publishes its refusal surface.

## SlotView

One current `LoadoutSlot`, identified by exact game key.

| Field             | Type                       | Source/rule                                                        |
| ----------------- | -------------------------- | ------------------------------------------------------------------ |
| `key`             | string                     | `LoadoutSlot.key`; identity and command argument                   |
| `canonicalName`   | string                     | `LoadoutSlot.name`; canonical package text, not assumed localized  |
| `displayName`     | `GameText`                 | `getLoadoutSlotName(slot, locale)` or disclosed canonical fallback |
| `kind`            | package `SlotKind`         | `LoadoutSlot.kind`                                                 |
| `size`            | number/unavailable         | Package slot value                                                 |
| `restriction`     | package value/unavailable  | Raw package restriction identity                                   |
| `restrictionText` | `GameText \| null`         | `getSlotRestrictionLabel()` or disclosed fallback/unavailable      |
| `module`          | `FittedModuleView \| null` | Current fitted snapshot or empty                                   |
| `removable`       | boolean                    | Exact `LoadoutSlot.removable`                                      |
| `immovableReason` | package reason/null        | `cargoHatch`, `moduleLimit`, `requiredSlot` or absent              |
| `capabilities`    | `SlotCapabilities`         | Derived only from current package operation/query evidence         |

`GameText` is feature 011's `{text, translationStatus}` presentation value. `SlotCapabilities`
separates `canOpenReplacement`, `canFitSelection`, `canRemove`, `canOpenEngineering`, `canSetEnabled`
and `canSetPriority`. A successful empty candidate query may open and show `packageEmpty`; it does not
make a fit action available. Cargo hatch exposes power controls only because its package menus are
empty and the mount is immutable.

## FittedModuleView

| Field              | Type                              | Source/rule                                          |
| ------------------ | --------------------------------- | ---------------------------------------------------- |
| `slotKey`          | string                            | `FittedModule.slot`, retained spelling               |
| `symbol`           | string                            | Package-resolved identity                            |
| `enabled`          | `boolean \| unspecified`          | `FittedModule.on`; absence is preserved              |
| `priority`         | `0..4 \| unspecified`             | Package value; UI displays localized `1..5`          |
| `raw`              | package `LoadoutModule`           | Frozen record for the resolved fitted module         |
| `article`          | `OutfittingModule \| unavailable` | `FittedModule.stats`                                 |
| `effectiveArticle` | `OutfittingModule \| unavailable` | `FittedModule.effectiveStats`                        |
| `engineering`      | `EngineeringView \| null`         | Current raw/package-resolved engineering             |
| `variant`          | `PreEngineeredVariant \| null`    | Only `FittedModule.preEngineeredVariant`             |
| `labels`           | readonly `AcquisitionLabel[]`     | Package entitlement and identified route projections |

`stats === null` and missing fields remain unavailable. A fixed reward's `stats` is the resolved
article, not necessarily stock. Variant purchase grade remains separate from current ordinary grade.

## ModuleChoice

```ts
type ModuleChoice =
  | {
      kind: 'stock';
      key: string;
      module: OutfittingModule;
      sourceOrdinal: number;
      presentation: ChoicePresentation;
    }
  | {
      kind: 'variant';
      key: string;
      module: OutfittingModule;
      variant: PreEngineeredVariant;
      sourceOrdinal: number;
      variantOrdinal: number;
      presentation: ChoicePresentation;
    };
```

The UI key encodes kind, module symbol and, for a variant, blueprint fdname, grade, effect absence/id,
acquisition and package ordinal. It is view identity only. A fit passes the retained exact package
object from the matching build revision.

### ChoicePresentation

| Field           | Type                          | Rule                                                        |
| --------------- | ----------------------------- | ----------------------------------------------------------- |
| `name`          | `GameText`                    | Package localized module/variant name or disclosed fallback |
| `class`         | package number                | Never parsed from identity/text                             |
| `rating`        | package `ModuleRating`        | Exact package value                                         |
| `mount`         | package `ModuleMount \| null` | Exact package value; indexed when present                   |
| `familyId`      | package `OutfittingFamilyId`  | `module.familyId`; a variant takes its base module's        |
| `family`        | `GameText`                    | `getOutfittingFamilyName`, canonical fallback disclosed     |
| `section`       | `standard \| uniqueReward`    | Label input only; no longer a grouping or ordering level    |
| `labels`        | readonly `AcquisitionLabel[]` | Route and entitlement may stack                             |
| `purchaseGrade` | package grade/null            | Variant purchase state, not current grade                   |
| `facts`         | readonly package values       | Only in-scope values; unavailable remains explicit          |

## AcquisitionLabel

Application-localized explanations of exact package enum/token values.

| Field          | Type                                                                                                               | Rule                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `kind`         | `entitlement \| mercenary \| techBroker \| communityGoal \| eventReward \| uniqueReward \| notOrdinarilyAvailable` | Direct projection only                            |
| `packageValue` | string                                                                                                             | Exact package token/enum                          |
| `messageKey`   | localization key                                                                                                   | App-owned explanation, not private game-name data |
| `params`       | readonly scalar map                                                                                                | May include disclosed raw package token           |

## CandidateQueryState

| Field            | Type                                                                | Rule                                                     |
| ---------------- | ------------------------------------------------------------------- | -------------------------------------------------------- |
| `slotKey`        | string                                                              | Exact selected mount                                     |
| `buildRevision`  | integer                                                             | Invalidates every retained choice after edit/replacement |
| `locale`         | BCP 47 tag                                                          | Invalidates display/index                                |
| `query`          | string                                                              | Retained Commander input                                 |
| `choices`        | readonly `ModuleChoice[]`                                           | Full ordered package expansion                           |
| `index`          | readonly `CandidateSearchEntry[]`                                   | Four-field immutable index                               |
| `results`        | readonly `ModuleChoice[]`                                           | Current ordered matches                                  |
| `status`         | `loading \| ready \| noMatches \| packageEmpty \| stale \| refused` | Distinct observable state                                |
| `canClear`       | boolean                                                             | Whether there is a query to clear                        |
| `fittedFamilyId` | `OutfittingFamilyId \| null`                                        | The family the mount's own module is in; the FR-021 seed |
| `openFamilies`   | `ReadonlySet<OutfittingFamilyId>`                                   | Which families are open right now (FR-021, FR-023)       |

`openFamilies` is seeded, never accumulated. Opening a query seeds it with the fitted choice's family
and nothing else, or with nothing at all when no available family holds that exact choice. A query
that becomes or changes while non-empty replaces it with every family holding a match, or — where it
matched more than a screenful of choices — with nothing at all, the families then standing closed
with their counts; a query that returns to empty re-seeds the fitted-family default. A toggle adds or removes exactly one id. It is
view state: it never reaches the build, the snapshot, history, persistence or the fragment.

## CandidateFamilyView

The chooser's whole result tree, derived from the ordered results rather than stored beside them.

| Field      | Type                         | Rule                                                            |
| ---------- | ---------------------------- | --------------------------------------------------------------- |
| `familyId` | package `OutfittingFamilyId` | The package id; view identity and toggle argument               |
| `name`     | `GameText`                   | Package family name for the active locale or disclosed fallback |
| `count`    | integer                      | Choices currently in this family — matches only, when searching |
| `open`     | boolean                      | Membership of `openFamilies`                                    |
| `choices`  | readonly `ModuleChoice[]`    | This family's choices in contract order                         |

A family with no current choices is absent, not empty. The previous `CandidateSectionView` and
`CandidateGroup` shapes are withdrawn: there is no section level, and a name run is no longer a
structural level of its own.

Each `CandidateSearchEntry` contains folded displayed name, decimal class, rating and mount plus its
choice key. Every folded query term must occur in at least one of those fields. `noMatches` retains a
non-empty query and clear action; `packageEmpty` means a successful package query returned nothing.

## EngineeringView and EngineeringDraft

`EngineeringView` presents current package state:

| Field             | Type                          | Rule                                     |
| ----------------- | ----------------------------- | ---------------------------------------- |
| `blueprintFdname` | string/unavailable            | Current package raw identity             |
| `currentGrade`    | `1..5`/unavailable            | Current ordinary grade                   |
| `quality`         | literal `1`                   | Every active modeled grade after ingress |
| `effectFdname`    | `string \| null`              | Current effect identity                  |
| `modifiers`       | package modifiers/unavailable | Never locally reconstructed              |
| `purchaseVariant` | package variant/null          | Separate identified fixed purchase       |

`EngineeringDraft` is non-build state:

| Field                     | Type                                | Rule                                                                                                                                              |
| ------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slotKey`                 | string                              | Exact selected slot                                                                                                                               |
| `baseBuildRevision`       | integer                             | Apply refuses/rebuilds when stale                                                                                                                 |
| `blueprints`              | readonly `AvailableBlueprint[]`     | Exact current package menu                                                                                                                        |
| `selectedBlueprintFdname` | `string \| 'none' \| null`          | `null` is no draft selection; `'none'` is the Commander choosing the package's explicit no-blueprint entry, which clears all ordinary engineering |
| `selectedRoute`           | package route/null                  | From selected descriptor                                                                                                                          |
| `selectedGrade`           | package-offered grade/null          | Must occur in selected descriptor                                                                                                                 |
| `effects`                 | readonly fdname[]                   | Exact current package menu                                                                                                                        |
| `selectedEffectFdname`    | `string \| null`                    | Null explicitly means no effect                                                                                                                   |
| `preview`                 | detached package result/unavailable | Read from candidate `stats`/`effectiveStats`                                                                                                      |
| `cost`                    | `EngineeringCostView`               | Package cost results only                                                                                                                         |

`clearEngineering` remains a separate confirmed intent with its own package operation. It is reached
by selecting `'none'` and applying, and it MUST dispatch `clearEngineering(slotKey)` — never
`applyBlueprint` with a null or `'none'` fdname, which would blur package semantics. `null` and
`'none'` are therefore distinct states and MUST NOT be collapsed: the first means the Commander has
chosen nothing yet, the second means the Commander has chosen to remove the blueprint.
Opening/changing/canceling a draft creates no history. A rejected incoming partial build never
creates an editor draft.

## EngineeringCostView

| Field           | Type                                               | Rule                                                     |
| --------------- | -------------------------------------------------- | -------------------------------------------------------- |
| `blueprint`     | `known(materials[]) \| unavailable \| notSelected` | Complete climb for a selected package menu recipe        |
| `experimental`  | `known(materials[]) \| unavailable \| notSelected` | New selected effect; removal has no craft cost           |
| `combined`      | `known(materials[]) \| unavailable`                | `sumMaterials()` only when every selected input is known |
| `fixedPurchase` | `notCrafted \| null`                               | Baked reward is never priced from its identity           |
| `mercCoin`      | package number/null                                | Purchase currency, separate from materials/credits       |

`null` package cost maps to unavailable and `[]` to known zero. Same-recipe continuation passes the
current completed grade; a replacement recipe starts from zero. Names/numbers use package i18n and
active-locale formatters.

## ModeledBuildCheckpoint

An in-memory-only checkpoint containing feature 001's canonical `BuildSnapshotV1`. It records every
application-modelled identity and choice needed to reconstruct a detached `ShipLoadout`, including
ship name/ident, but contains no historical purchase price, package calculation or capture snapshot.

```ts
interface ModeledBuildCheckpoint {
  readonly snapshot: BuildSnapshotV1;
}
```

Feature 001's active-build boundary alone may capture a checkpoint, reconstruct a detached candidate
through `ShipLoadout`, or atomically install one in the active slot. Components and feature 002
services receive only immutable projections and capability methods. Raw overlays, captured purchase
fields and application-owned game calculations are prohibited.

## BuildEditIntent and BuildEditResult

```ts
type BuildEditIntent =
  | { kind: 'fitStock'; slotKey: string; choiceKey: string }
  | { kind: 'fitVariant'; slotKey: string; choiceKey: string }
  | { kind: 'remove'; slotKey: string }
  | {
      kind: 'applyEngineering';
      slotKey: string;
      blueprintFdname: string;
      grade: number;
      effectFdname: string | null;
    }
  | { kind: 'setExperimental'; slotKey: string; effectFdname: string | null }
  | { kind: 'clearEngineering'; slotKey: string }
  | { kind: 'setEnabled'; slotKey: string; enabled: boolean }
  | { kind: 'setPriority'; slotKey: string; priority: 0 | 1 | 2 | 3 | 4 }
  | { kind: 'setShipName'; value: string | null }
  | { kind: 'setShipIdent'; value: string | null };

type BuildEditResult =
  | { kind: 'committed'; revision: number }
  | { kind: 'unchanged'; revision: number }
  | { kind: 'refused'; failure: EditFailure; revision: number };
```

`EditFailure` retains category (`packageEdit`, `packageResult`, `staleDraft`, `unavailableOperation`,
`unexpectedPackageRefusal`), exact slot, package code/constraint/params where present and an
app-localized framing key. Package `LoadoutEditError` text comes through the package diagnostic
presenter, never a private translation. Refusal changes no active state, persistence, fragment or
history.

## Ingress records and outcomes

### SourcePartialEngineering

Captured from validated input before package construction.

| Field             | Type                    | Rule                                   |
| ----------------- | ----------------------- | -------------------------------------- |
| `slotKey`         | string                  | Exact source slot                      |
| `moduleSymbol`    | string                  | Exact source identity                  |
| `blueprintFdname` | string/unavailable      | Source engineering identity            |
| `effectFdname`    | string/null/unavailable | Source effect identity                 |
| `grade`           | number/unavailable      | Source grade                           |
| `quality`         | number in `[0,1)`       | Only validated partials enter this set |

### IngressResult

```ts
type IngressResult =
  | { kind: 'accepted'; candidate: ShipLoadout; notices: IngressNotice[] }
  | { kind: 'refused'; failures: PartialEngineeringFailure[] };
```

`IngressNotice` is one of:

- `qualityCompleted`: exact slot/identity, source quality and result quality `1`;

`PartialEngineeringFailure` contains exact source slot/module/engineering identity and either package
construction/correlation mismatch or `EngineeringNormalizationResult` code/params. It never contains a
partially mutated candidate. If any partial fails, discard the whole candidate and publish the
pre-activation refusal; successful earlier normalizations create no notice on the active build.

Package-defaulted fixed mounts are ordinary candidate state and carry no application notice or
provenance. Quality-completion and refusal records are workflow feedback, never build, history, link
or SLEF state.

## SessionHistoryState

```ts
interface HistoryFrame {
  checkpoint: ModeledBuildCheckpoint;
  intent: HistoryIntentSummary; // unformatted message key + scalar params
}

interface SessionHistoryState {
  past: readonly HistoryFrame[];
  future: readonly HistoryFrame[];
  capacity: 100;
}
```

Transitions:

```text
changed Commander edit:
  previous = captureModeledCheckpoint(current)
  candidate = reconstructThroughPackage(previous)
  apply intent to candidate
  past = newest100(past + previous)
  future = []
  current = committed candidate

undo:
  future = [captureModeledCheckpoint(current)] + future
  current = reconstructThroughPackage(last(past)); past = past without last

redo:
  past = newest100(past + captureModeledCheckpoint(current))
  current = reconstructThroughPackage(first(future)); future = future without first

successful active-build replacement:
  past = []; future = []; current = accepted candidate
```

Reconstruction and validation are package-owned and the active swap is atomic. A reconstruction
failure leaves current/history unchanged and reports a blocking internal/package failure. Current
catalogue cost is recomputed; no historical purchase value is restored. Storage, fragment, SLEF and
browser-navigation APIs accept no `SessionHistoryState` or `ModeledBuildCheckpoint`.
