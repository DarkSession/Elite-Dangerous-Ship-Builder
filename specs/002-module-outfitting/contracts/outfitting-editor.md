# Outfitting Editor Contract

## Boundary

The editor receives feature 001's immutable active-loadout projection, revision and package-backed
transaction capability. For every intent the active-build boundary creates a lossless detached
package clone, invokes package operations, and atomically installs it only on success. Components
cannot call the Almanac or retain a mutable build. This boundary is upstream-blocked until Almanac
releases the clone/checkpoint API defined in [edit-history.md](./edit-history.md).

## Slot and module reads

- Enumerate known mounts with `ShipLoadout.slots()` and identify them by `LoadoutSlot.key`.
- Append unresolved original-slot fitted records from `fittedModules()`; never infer their placement.
- Read base/resolved article facts from `FittedModule.stats` and current post-engineering facts from
  `effectiveStats`.
- Read compatibility from `modulesForSlot`, removability/reason from `LoadoutSlot`, engineering menus
  from `availableBlueprints`/`availableExperimentalEffects`, and build validity from `validation`.
- Re-read every snapshot/result after commit. Never mutate a returned frozen object.

## Commands

| Intent                               | Required operation                                         | Success                                                                                      |
| ------------------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Fit stock                            | `setModule(slotKey, exactModule)`                          | Replacement carries no old module engineering                                                |
| Fit variant                          | `setPreEngineeredVariant(slotKey, exactVariant)`           | Package fixed identity/stats retained                                                        |
| Remove                               | `removeModule(slotKey)`                                    | Slot becomes empty only if package allows                                                    |
| Apply/replace blueprint/grade/effect | `applyBlueprint(..., { grade, quality: 1, experimental })` | Package recomputes modifiers/results                                                         |
| Change/remove only effect            | `setExperimentalEffect(slotKey, fdnameOrNull)`             | Blueprint/grade, fixed identity and base modifier block preserved; effective stats recompute |
| Clear ordinary engineering           | `clearEngineering(slotKey)`                                | Package base state restored; Mercenary identity may disappear                                |
| Enable/disable                       | `setModuleEnabled(slotKey, enabled)`                       | Package power-dependent results recompute                                                    |
| Priority                             | `setModulePriority(slotKey, priority0to4)`                 | UI presents localized `1..5`                                                                 |
| Name/ident                           | Package-backed clone/update through feature 001 boundary   | All other package-owned state/provenance exact                                               |

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

1. decode without changing the active build; capture every source module whose validated finite
   `Engineering.Quality` is in `[0,1)`, plus source fixed-mount identities;
2. resolve each captured partial identity through `getModuleBySymbol()`; any unresolved identity
   refuses the whole incoming candidate with exact slot/module/engineering context;
3. construct the detached `ShipLoadout`, then correlate every captured partial by case-insensitive
   source slot and exact module symbol; missing/replaced/mismatched records (including automatic cargo
   repair) refuse the candidate;
4. call `completeEngineeringGrade(slotKey)` only for those correlated source partials; accept
   `normalized`, atomically refuse `unsupported`, and treat `unchanged` as a package-contract failure;
5. only after all partials succeed, call `repairFixedMount()` for mounts that were missing/unresolved
   in the source and whose package reason is `requiredSlot` or `cargoHatch`;
6. retain `repaired` notices; retain an incomplete candidate for `defaultUnavailable`; treat
   package-derived `refused` as an internal/package failure;
7. commit once before history starts or resets, then allow validation/calculation reads.

Never call `completeEngineeringGrade()` for absent quality or quality `1`; fully rolled or
unengineered unresolved entries remain supported. `moduleLimit` is not a fixed-mount reason. No
package default means no substitute; retain package incompleteness. Atomic partial-quality refusal is
an expected ingress outcome, not the clone/checkpoint release blocker. Refusal leaves the current
build, revision, dirty state, autosave, fragment, notices and history untouched.

## Power and recalculation

An enabled/priority command always leaves the module fitted. Mass and purchase cost therefore remain
in the build. All affected power and downstream figures are re-read from the new `ShipLoadout`; the
application does not add/remove contributions itself.

## Released API acceptance

Before feature implementation, a released Almanac version must prove that it:

1. losslessly clones/checkpoints a loadout after source-credit provenance becomes temporarily invalid
   and restores it when later valid again, including provenance-preserving ship name/ident edits;
2. changes/removes an experimental effect on re-engineerable fixed rewards while preserving the
   fixed base modifier block and `preEngineeredVariant` and recomputing effect-dependent stats;
3. normalizes supported imported partial-quality states losslessly and returns a stable structured
   result for unsupported identities.

Cross-package tests must pin all three minimal reproductions before UI implementation proceeds.

## Persistence and publication

After any normal edit, undo or redo, feature 001 observes the newly committed active snapshot and
performs autosave/fragment synchronization. Fixed-mount provenance is record metadata, not a history
frame: undoing the model edit does not recreate a cleared entry. This contract adds no storage keys or
URL fields. Editor draft, selected slot, search, refusal and history state are excluded.
