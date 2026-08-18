# Outfitting Editor Contract

## Boundary

The editor receives feature 001's immutable active-loadout projection, revision and package-backed
transaction capability. For every intent the active-build boundary captures the canonical modelled
snapshot, reconstructs a detached candidate through the package, invokes package operations, and
atomically installs it only on success. Components cannot call the Almanac or retain a mutable build.

## Slot and module reads

- Enumerate known mounts with `ShipLoadout.slots()` and identify them by `LoadoutSlot.key`.
- Read base/resolved article facts from `FittedModule.stats` and current post-engineering facts from
  `effectiveStats`.
- Read compatibility from `modulesForSlot`, removability/reason from `LoadoutSlot`, engineering menus
  from `availableBlueprints`/`availableExperimentalEffects`, and build validity from `validation`.
- Re-read every snapshot/result after commit. Never mutate a returned frozen object.

## Commands

| Intent                               | Required operation                                             | Success                                                                                      |
| ------------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Fit stock                            | `setModule(slotKey, exactModule)`                              | Replacement carries no old module engineering                                                |
| Fit variant                          | `setPreEngineeredVariant(slotKey, exactVariant)`               | Package fixed identity/stats retained                                                        |
| Remove                               | `removeModule(slotKey)`                                        | Slot becomes empty only if package allows                                                    |
| Apply/replace blueprint/grade/effect | `applyBlueprint(..., { grade, quality: 1, experimental })`     | Package recomputes modifiers/results                                                         |
| Change/remove only effect            | `setExperimentalEffect(slotKey, fdnameOrNull)`                 | Blueprint/grade, fixed identity and base modifier block preserved; effective stats recompute |
| Clear ordinary engineering           | `clearEngineering(slotKey)`                                    | Package base state restored; Mercenary identity may disappear                                |
| Enable/disable                       | `setModuleEnabled(slotKey, enabled)`                           | Package power-dependent results recompute                                                    |
| Priority                             | `setModulePriority(slotKey, priority0to4)`                     | UI presents localized `1..5`                                                                 |
| Name/ident                           | Snapshot update and package reconstruction through feature 001 | All other modelled state exact; package results recomputed                                   |

Every successful changed command produces one active revision and one history decision. It also
clears any feature 001 `fixedMountNormalisation` entry for the exact edited slot before autosave;
fit/replace/remove, engineering, enabled-state and priority changes all count. Failed, canceled,
stale-draft and no-op commands produce no revision/history and clear no provenance.

## Refusals

For `LoadoutEditError`, retain `code`, `constraint`, `params` and affected slot, and obtain package
diagnostic text from `getLoadoutEditErrorMessage(error, locale)`. On locale miss, use feature 011's
disclosed canonical/untranslated presentation; never privately translate or parse the package reason.
Application localization owns only workflow framing. Plain `TypeError`/`RangeError` after a
package-offered engineering action becomes an unexpected structured refusal; active state remains
unchanged and the option list is refreshed.

Branch explicitly on `setExperimentalEffect()` results: `updated` may commit, `unchanged` creates no
revision/history, and `unsupported` surfaces its package code/params without mutation.

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

1. decode without changing the active build and retain only the transient source evidence needed to
   present package normalization/refusal outcomes;
2. pass the complete candidate through the released Almanac ingress boundary. An unknown hull
   refuses; an unknown removable module becomes empty; an unknown fixed module and an empty fixed
   mount receive the hull's package default. Accept only the package's structured outcomes and do not
   classify a slot or choose a replacement locally;
3. discard each normalized unknown module's engineering with that source module. Capture finite
   source quality in `[0,1)` only for modules the normalized candidate still resolves;
4. correlate those remaining partials by exact package slot/module identity and call
   `completeEngineeringGrade(slotKey)`. Accept `normalized`, atomically refuse `unsupported`, and
   treat unexpected missing/mismatched/`unchanged` results as package-contract failures;
5. retain transient unknown-module emptied/defaulted and quality-completed notices. Persist fixed
   provenance only when the source fixed mount was empty; no unknown source identity persists;
6. commit once before history starts or resets, then allow validation/calculation reads.

Never call `completeEngineeringGrade()` for absent quality or quality `1`. No package default means
no substitute; retain package incompleteness. Refusal leaves the current build, revision, dirty
state, autosave, fragment, notices and history untouched.

## Power and recalculation

An enabled/priority command always leaves the module fitted. Mass remains in the build and current
catalogue cost is recomputed from the new `ShipLoadout`. All affected power and downstream figures
are re-read; the application does not add/remove contributions itself.

## Package acceptance

Cross-package tests must prove that the pinned Almanac version:

1. reconstructs every recognized application-modelled field from the canonical snapshot, including
   ship name/ident, engineering and identified variants, while recomputing retail cost;
2. changes/removes an experimental effect on re-engineerable fixed rewards while preserving the
   fixed base modifier block and `preEngineeredVariant` and recomputing effect-dependent stats;
3. refuses unknown hulls, returns structured empty/default outcomes for unknown modules, and
   normalizes supported imported partial-quality states losslessly with a stable unsupported result.

Historical purchase values are not acceptance inputs and are never restored.

## Persistence and publication

After any normal edit, undo or redo, feature 001 observes the newly committed active snapshot and
performs autosave/fragment synchronization. Fixed-mount provenance is record metadata, not a history
frame: undoing the model edit does not recreate a cleared entry. This contract adds no storage keys or
URL fields. Editor draft, selected slot, search, refusal and history state are excluded.
