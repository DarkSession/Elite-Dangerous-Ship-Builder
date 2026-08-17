# Outfitting Editor Contract

## Boundary

The editor receives feature 001's current `BuildSnapshotV1` and active revision. For every intent it
reconstructs a detached `ShipLoadout`, invokes package operations, and commits a new snapshot/loadout
only on success. Components receive immutable localized projections and emit intent; they cannot call
the Almanac or retain a mutable build.

## Slot and module reads

- Enumerate known mounts with `ShipLoadout.slots()` and identify them by `LoadoutSlot.key`.
- Append unresolved original-slot fitted records from `fittedModules()`; never infer their placement.
- Read base/resolved article facts from `FittedModule.stats` and current post-engineering facts from
  `effectiveStats`.
- Read compatibility from `modulesForSlot`, removability/reason from `LoadoutSlot`, engineering menus
  from `availableBlueprints`/`availableExperimentalEffects`, and build validity from `validation`.
- Re-read every snapshot/result after commit. Never mutate a returned frozen object.

## Commands

| Intent                               | Required operation                                         | Success                                                       |
| ------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------- |
| Fit stock                            | `setModule(slotKey, exactModule)`                          | Replacement carries no old module engineering                 |
| Fit variant                          | `setPreEngineeredVariant(slotKey, exactVariant)`           | Package fixed identity/stats retained                         |
| Remove                               | `removeModule(slotKey)`                                    | Slot becomes empty only if package allows                     |
| Apply/replace blueprint/grade/effect | `applyBlueprint(..., { grade, quality: 1, experimental })` | Package recomputes modifiers/results                          |
| Change/remove only effect            | Package effect-only operation required by upstream gate    | Blueprint/grade and fixed article identity/stats preserved    |
| Clear ordinary engineering           | `clearEngineering(slotKey)`                                | Package base state restored; Mercenary identity may disappear |
| Enable/disable                       | `setModuleEnabled(slotKey, enabled)`                       | Package power-dependent results recompute                     |
| Priority                             | `setModulePriority(slotKey, priority0to4)`                 | UI presents localized `1..5`                                  |
| Name/ident                           | Update canonical snapshot and reconstruct                  | All other modelled fields exact                               |

Every successful changed command produces one active revision and one history decision. It also
clears any feature 001 `fixedMountNormalisation` entry for the exact edited slot before autosave;
fit/replace/remove, engineering, enabled-state and priority changes all count. Failed, canceled,
stale-draft and no-op commands produce no revision/history and clear no provenance.

## Refusals

For `LoadoutEditError`, retain `code`, `constraint`, `params` and affected slot and map them to an
application localization key. Never parse its English message. Plain `TypeError`/`RangeError` after a
package-offered engineering action becomes an unexpected structured refusal; active state remains
unchanged and the option list is refreshed.

Invalid/incomplete builds remain editable wherever the package provides an operation. Missing values
remain unavailable. A refusal must not be converted into a local compatibility rule.

## Cargo hatch

The package cargo-hatch slot remains visible with facts and enabled/priority controls. Empty package
candidate/engineering menus plus `removable: false` mean no replace, search, engineer or remove
action. The reason is presented from `immovableReason: 'cargoHatch'`. No symbol-specific UI exception
is used.

## Engineering

- Blueprint/effect identity is package `fdname`.
- Offer exactly the grades in the selected `AvailableBlueprint` and effects returned for that slot.
- Quality is always explicitly `1` and is never editable/presented as a roll slider.
- Purchase variant grade and current `Engineering.Level` are separate.
- Attribute values are package `stats`/`effectiveStats`/modifiers; unavailable remains unavailable.
- Do not claim better/worse direction from `LessIsGood`, which the package documents as unreliable.
- Fixed/final articles expose only package-supported operations.

Material cost uses only `getBlueprintCost`, `getBlueprintGradeCost`,
`getExperimentalEffectCost` and `sumMaterials`. Preserve `null` (unavailable) versus `[]` (known
zero). Baked fixed engineering has no craft cost. A Mercenary upgrade starts above its purchase grade;
Merc Coin is presented separately.

## Mandatory ingress normalization

Before any active-build replacement is presented or any calculation is read:

1. inspect package slots without reading calculations;
2. find missing/unresolved mounts whose package reason is `requiredSlot` or `cargoHatch`;
3. replace/insert the exact case-insensitively matched package default identity in a detached DTO;
4. reconstruct through `ShipLoadout.fromLoadout()` (required for immutable cargo hatch);
5. use the released Almanac normalization operation to complete every partial engineering grade;
6. return candidate plus slot/identity/source-quality notices;
7. commit before history starts.

`moduleLimit` is not a fixed-mount reason. No package default means no substitute; retain the source
state and package incompleteness. A package inability to normalize a required supported state is a
release blocker, not permission to change raw modifiers or merely overwrite `Quality`.

## Power and recalculation

An enabled/priority command always leaves the module fitted. Mass and purchase cost therefore remain
in the build. All affected power and downstream figures are re-read from the new `ShipLoadout`; the
application does not add/remove contributions itself.

## Upstream acceptance gate

Implementation may proceed only after a released Almanac version:

1. changes/removes an experimental effect on re-engineerable fixed rewards while preserving fixed
   stats and `preEngineeredVariant`;
2. normalizes supported imported partial-quality states losslessly and returns a stable structured
   result for unsupported identities.

Cross-package tests must pin both minimal reproductions before UI implementation is considered
unblocked.

## Persistence and publication

After any normal edit, undo or redo, feature 001 observes the newly committed active snapshot and
performs autosave/fragment synchronization. Fixed-mount provenance is record metadata, not a history
frame: undoing the model edit does not recreate a cleared entry. This contract adds no storage keys or
URL fields. Editor draft, selected slot, search, refusal and history state are excluded.
