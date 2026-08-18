# Data Model: Module Outfitting and Engineering

All game-bearing values are immutable projections of the active
`@elite-dangerous-almanac/core` `ShipLoadout`. Application records below represent editor workflow,
search and history only. `BuildSnapshotV1` is defined by feature 001 and is reused unchanged.

## OutfittingState

Ephemeral application state layered over the shared active build.

| Field              | Type                                      | Rule                                                                             |
| ------------------ | ----------------------------------------- | -------------------------------------------------------------------------------- |
| `buildRevision`    | non-negative integer                      | Increments once per committed edit or replacement; never persisted as game state |
| `selectedSlotKey`  | `string \| null`                          | Exact package/game slot key; selection only                                      |
| `surface`          | `workspace \| replacement \| engineering` | Responsive view state inside `/build`; not browser/edit history                  |
| `candidateQuery`   | `CandidateQueryState \| null`             | Present only for a replaceable selected slot                                     |
| `engineeringDraft` | `EngineeringDraft \| null`                | Present only while editing a supported fitted module                             |
| `history`          | `SessionHistoryState`                     | In-memory only                                                                   |
| `lastEditFailure`  | `EditFailure \| null`                     | Structured application/package refusal for the latest attempted decision         |

Invariants:

- `OutfittingState` cannot contain a second `ShipLoadout` or fitted-module collection.
- A missing active build clears selection, drafts and history and renders the no-build state.
- Selection/surface/query/draft changes never increment the active build revision.
- A build replacement clears all fields except the newly established build revision and its
  normalization notices.

## SlotProjection

One current package slot presented by exact game key.

| Field             | Type                              | Source/rule                                              |
| ----------------- | --------------------------------- | -------------------------------------------------------- |
| `key`             | string                            | `LoadoutSlot.key`; identity and command argument         |
| `name`            | package string/unavailable        | `LoadoutSlot.name`                                       |
| `kind`            | package `SlotKind`                | `LoadoutSlot.kind`                                       |
| `size`            | package number/unavailable        | `LoadoutSlot.size`                                       |
| `restriction`     | package value/unavailable         | `LoadoutSlot.restriction`                                |
| `module`          | `FittedModuleProjection \| null`  | Null only when package slot is empty                     |
| `removable`       | boolean                           | `LoadoutSlot.removable`                                  |
| `immovableReason` | package `ImmovableReason \| null` | `cargoHatch`, `moduleLimit`, `requiredSlot` or absent    |
| `capabilities`    | `SlotCapabilities`                | Presence of package results/menus, not symbol heuristics |

`SlotCapabilities` has explicit booleans for `replace`, `remove`, `engineer`, `setEnabled` and
`setPriority`. `replace` requires a non-empty successful `modulesForSlot()` query; `remove` mirrors
`removable`; engineering comes from package menus/current state; cargo hatch exposes only power
controls. Capability calculation never admits an operation the package did not offer.

## FittedModuleProjection

| Field               | Type                              | Source/rule                                                                             |
| ------------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| `slotKey`           | string                            | `FittedModule.slot`; retained spelling                                                  |
| `symbol`            | string                            | `FittedModule.symbol`; resolved or unresolved identity                                  |
| `enabled`           | `boolean \| unspecified`          | `FittedModule.on`; presenter may show package effective default without erasing absence |
| `priority`          | `0..4 \| unspecified`             | Package zero-based value; UI label is localized `1..5`                                  |
| `raw`               | package `LoadoutModule`           | Read-only lossless state; never mutated                                                 |
| `article`           | `OutfittingModule \| unavailable` | `FittedModule.stats`                                                                    |
| `effectiveArticle`  | `OutfittingModule \| unavailable` | `FittedModule.effectiveStats`                                                           |
| `engineering`       | `EngineeringProjection \| null`   | Current package engineering block                                                       |
| `variant`           | `VariantIdentity \| null`         | Only `FittedModule.preEngineeredVariant`                                                |
| `acquisitionLabels` | readonly `AcquisitionLabel[]`     | Projection of current package variant + entitlement                                     |

`stats === null` means unresolved and remains visible. For a fixed reward, `stats` describes the
resolved reward article; it must not be labeled universally as stock. `effectiveStats` is the
post-engineering source for current attributes.

## UnresolvedSlotProjection

An entry from `fittedModules()` whose original slot is not described by `slots()`.

| Field          | Type                                 | Rule                                                     |
| -------------- | ------------------------------------ | -------------------------------------------------------- |
| `slotKey`      | string                               | Original `FittedModule.slot` and spelling                |
| `symbol`       | string                               | Original module identity                                 |
| `raw`          | package `LoadoutModule`              | Lossless package snapshot                                |
| `packageIssue` | package validation issue/unavailable | Exact matching issue where supplied                      |
| `capabilities` | none                                 | No fit/edit operation is fabricated for an unknown mount |

These entries render in an unresolved group after package-described slots. They remain in
snapshot/save/link/SLEF boundaries as those formats permit.

## ModuleChoice

A chooser item produced only from `modulesForSlot()` and package variants.

```ts
type ModuleChoice = StockChoice | VariantChoice;

interface StockChoice {
  kind: 'stock';
  key: string;
  module: OutfittingModule;
  sourceOrdinal: number;
  presentation: ChoicePresentation;
}

interface VariantChoice {
  kind: 'variant';
  key: string;
  module: OutfittingModule;
  variant: PreEngineeredVariant;
  sourceOrdinal: number;
  variantOrdinal: number;
  presentation: ChoicePresentation;
}
```

The stable key is a collision-safe encoding of `kind`, module symbol, and for a variant its blueprint
fdname, grade, optional effect, acquisition and variant ordinal. It is UI identity only; the exact
package object is passed to the edit transaction.

### ChoicePresentation

| Field           | Type                          | Rule                                                            |
| --------------- | ----------------------------- | --------------------------------------------------------------- |
| `displayedName` | string + translation status   | Package localized module name or canonical disclosed fallback   |
| `class`         | package number                | Never parsed from symbol/text                                   |
| `rating`        | package `ModuleRating`        | Never replaced with a private grade                             |
| `mount`         | package `ModuleMount \| null` | Search/display only when present                                |
| `section`       | `standard \| uniqueReward`    | Unique only for package community-goal/event-reward acquisition |
| `labels`        | readonly `AcquisitionLabel[]` | Entitlement and route labels may coexist                        |
| `purchaseGrade` | package grade or null         | Variant grade; never current ordinary grade                     |

## AcquisitionLabel

An application-owned localized explanation of package data, not a new game fact.

| Field          | Type                                                                                                               | Rule                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `kind`         | `entitlement \| mercenary \| techBroker \| communityGoal \| eventReward \| uniqueReward \| notOrdinarilyAvailable` | Derived only from package enum/presence                          |
| `packageValue` | string                                                                                                             | Entitlement token or acquisition enum                            |
| `messageKey`   | localization key                                                                                                   | Application phrasing                                             |
| `params`       | readonly scalar map                                                                                                | May include raw package token; no private entitlement-name table |

## CandidateQueryState

| Field           | Type                                           | Rule                                           |
| --------------- | ---------------------------------------------- | ---------------------------------------------- |
| `slotKey`       | string                                         | Exact selected game slot                       |
| `buildRevision` | integer                                        | Invalidates results after any edit             |
| `locale`        | BCP 47 tag                                     | Invalidates display/search index               |
| `query`         | string                                         | Commander input, retained verbatim for editing |
| `index`         | readonly `CandidateSearchEntry[]`              | Immutable projection over all choices          |
| `results`       | readonly `ModuleChoice[]`                      | Filtered in required section/group order       |
| `status`        | `ready \| noMatches \| unavailable \| refused` | Explicit, never inferred from blank DOM        |

### CandidateSearchEntry

| Field          | Type   | Rule                                        |
| -------------- | ------ | ------------------------------------------- |
| `choiceKey`    | string | Joins to exact `ModuleChoice`               |
| `foldedName`   | string | Locale-folded displayed package module name |
| `foldedClass`  | string | Folded decimal class                        |
| `foldedRating` | string | Folded package rating                       |
| `foldedMount`  | string | Folded package mount or empty               |

All non-empty folded query terms must match at least one field on one entry. Search never mutates or
creates choices.

## EngineeringProjection

| Field             | Type                                   | Source/rule                                                             |
| ----------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| `blueprintFdname` | string                                 | Current `Engineering.BlueprintName`                                     |
| `currentGrade`    | `1..5`                                 | Current `Engineering.Level`                                             |
| `quality`         | number                                 | Must be `1` after ingress; partial source value exists only in a notice |
| `effectFdname`    | `string \| null`                       | Current `Engineering.ExperimentalEffect`                                |
| `modifiers`       | readonly package modifiers/unavailable | Current package block; never recalculated in app                        |
| `purchaseVariant` | `VariantIdentity \| null`              | Separate `preEngineeredVariant`, including purchase grade               |
| `canClear`        | boolean                                | Package-supported current article state                                 |

Purchase grade and current ordinary grade are separate even when their blueprint fdname is the same.
Clearing a Mercenary recipe follows the package and can set `purchaseVariant` to null.

## EngineeringDraft

Non-build editor input. Opening/canceling/changing it has no history effect.

| Field                     | Type                            | Rule                                                        |
| ------------------------- | ------------------------------- | ----------------------------------------------------------- |
| `slotKey`                 | string                          | Exact selected slot                                         |
| `baseBuildRevision`       | integer                         | Apply is refused/rebased if active state changed underneath |
| `blueprints`              | readonly `AvailableBlueprint[]` | Exact package menu                                          |
| `selectedBlueprintFdname` | `string \| null`                | Package fdname or clear-all intent                          |
| `selectedRoute`           | `ordinary \| mercenary \| null` | From selected `AvailableBlueprint`                          |
| `selectedGrade`           | package-offered grade or null   | Must occur in that package descriptor                       |
| `effects`                 | readonly fdname[]               | Exact `availableExperimentalEffects()` result               |
| `selectedEffectFdname`    | `string \| null`                | Package fdname or no effect                                 |
| `quality`                 | literal `1`                     | Fixed invariant, not a user field                           |
| `attributes`              | before/after package values     | `stats`/candidate `effectiveStats`; unavailable preserved   |
| `cost`                    | `EngineeringCostProjection`     | Package material results only                               |

The apply transaction reconstructs a detached candidate and invokes the package; the draft itself
does not contain modifier calculations.

## EngineeringCostProjection

| Field           | Type                                               | Rule                                                       |
| --------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| `blueprint`     | `known(materials[]) \| unavailable`                | `getBlueprintCost`; `[]` is known zero, `null` unavailable |
| `experimental`  | `known(materials[]) \| unavailable \| notSelected` | `getExperimentalEffectCost`                                |
| `combined`      | `known(materials[]) \| unavailable`                | `sumMaterials` only when every selected source is known    |
| `fixedPurchase` | literal `notCrafted` or null                       | Baked fixed reward adds no material list                   |
| `mercCoin`      | package number or null                             | Purchase currency, never combined with materials/credits   |

Material identity and name are package values. Formatting/localized lookup is a presentation concern.

## BuildEditIntent

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
```

All identities are package/game keys. An intent never carries a locally computed module, modifier or
cost. `setExperimental` binds directly to released `setExperimentalEffect()` for supported fixed
reward articles; no app-side special case is allowed.

## BuildEditResult

```ts
type BuildEditResult =
  | { kind: 'committed'; revision: number; snapshot: BuildSnapshotV1 }
  | { kind: 'unchanged'; revision: number }
  | { kind: 'refused'; failure: EditFailure; revision: number };
```

### EditFailure

| Field        | Type                                                                            | Rule                                             |
| ------------ | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| `kind`       | `packageEdit \| staleDraft \| unavailableOperation \| unexpectedPackageRefusal` | Stable app category                              |
| `code`       | package error code or app code                                                  | `LoadoutEditError.code` retained where available |
| `constraint` | package constraint or null                                                      | Never parsed from message                        |
| `params`     | language-neutral readonly map                                                   | Package params plus safe app context             |
| `slotKey`    | string or null                                                                  | Exact affected slot                              |
| `messageKey` | localization key                                                                | Presenter chooses from structured fields         |

Refusal never mutates the active build, revision, autosave, fragment or history.

## NormalizationResult

```ts
type NormalizationResult =
  | { kind: 'unchanged'; candidate: ShipLoadout }
  | { kind: 'normalized'; candidate: ShipLoadout; notices: NormalizationNotice[] }
  | { kind: 'blocked'; failure: NormalizationFailure };
```

### NormalizationNotice

| Field                 | Type                                                         | Rule                                                     |
| --------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| `kind`                | `fixedMountFilled \| fixedMountReplaced \| qualityCompleted` | Explicit sanctioned normalization                        |
| `slotKey`             | string                                                       | Original/package slot key                                |
| `originalIdentity`    | string or null                                               | Missing is null; unresolved identity retained for notice |
| `replacementIdentity` | string                                                       | Package default or same engineering identity             |
| `originalQuality`     | number or null                                               | Present only for quality normalization                   |
| `resultQuality`       | literal `1` or null                                          | Present only for quality normalization                   |

Notices are local provenance. They are not game fields and do not enter edit history, link or SLEF.
Feature 001's `LocalRecordV1.fixedMountNormalisation` retains fixed-mount entries until a successful
Commander edit changes the exact affected mount; feature 003 presents them separately from package
issues. Quality-completion notices remain transient unless a later accepted specification adds an
equally explicit persistence rule.

### NormalizationFailure

Structured failure returned when the package cannot satisfy a mandatory normalization without loss.
It identifies slot, original identity, normalization kind and package outcome. With the accepted spec,
such a path is an upstream blocker rather than a shippable retained-partial state.

## SessionHistoryState

```ts
interface HistoryFrame {
  snapshot: BuildSnapshotV1;
  intent: HistoryIntentSummary;
}

interface SessionHistoryState {
  past: readonly HistoryFrame[];
  future: readonly HistoryFrame[];
  capacity: 100;
}
```

`HistoryIntentSummary` contains only a localization key and safe package identities needed to label
the action. Restoration correctness depends solely on `snapshot`.

Transitions:

```text
commit changed intent:
  past = newest100(past + current checkpoint)
  future = []
  current = candidate

undo when past non-empty:
  future = [current checkpoint] + future
  current = last(past)
  past = past without last

redo when future non-empty:
  past = past + current checkpoint
  current = first(future)
  future = future without first

active-build replacement:
  past = []
  future = []
  current = normalized replacement
```

The history service exposes snapshots only to the build transaction/restoration adapter. Storage,
fragment, SLEF and browser-history interfaces accept no `SessionHistoryState`, making accidental
serialization a type-level boundary violation.
