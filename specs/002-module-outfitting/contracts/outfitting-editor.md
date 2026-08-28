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

| Intent                               | Required operation                                                                     | Success                                                                                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fit stock                            | `setModule(slotKey, exactModule)`, then the power carry below                          | Replacement carries no old module engineering; the mount's power state is set again                                                                              |
| Fit variant                          | `setPreEngineeredVariant(slotKey, exactVariant)`, then the power carry below           | Package fixed identity/stats retained; the mount's power state is set again                                                                                      |
| Remove                               | `removeModule(slotKey)`                                                                | Slot becomes empty only if package allows                                                                                                                        |
| Apply/replace blueprint/grade/effect | `applyBlueprint(..., { grade, quality: 1, experimental })`                             | Package recomputes modifiers/results                                                                                                                             |
| Change/remove only effect            | `setExperimentalEffect(slotKey, fdnameOrNull)`                                         | Blueprint/grade, fixed identity and base modifier block preserved; effective stats recompute                                                                     |
| Clear ordinary engineering           | `clearEngineering(slotKey)`                                                            | Package base state restored; Mercenary identity may disappear                                                                                                    |
| Restore purchase                     | `setPreEngineeredVariant(slotKey, ownVariant)`, then the power carry below             | The article as bought; the mount's power state is set again                                                                                                      |
| Enable/disable                       | `setModuleEnabled(slotKey, enabled)`                                                   | Package power-dependent results recompute                                                                                                                        |
| Priority                             | `setModulePriority(slotKey, priority0to4)`                                             | UI presents localized `1..5`                                                                                                                                     |
| Name/ident (FR-019)                  | Feature 002 control writing feature 001's snapshot fields, then package reconstruction | One shared modelled `shipName`/`shipIdent`; no second copy anywhere. All other modelled state exact; package results recomputed; clearing to absent is permitted |

Every successful changed command produces one active revision and one history decision.
Fit/replace/remove, engineering, enabled-state and priority changes all count. Failed, canceled,
stale-draft and no-op commands produce no revision or history change. Package-defaulted fixed state
has no auxiliary metadata lifecycle.

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
- Attribute values are package `stats`/`effectiveStats`/modifiers, and the package's own
  calculations over those two records; unavailable remains unavailable.
- Do not claim better/worse direction from `LessIsGood`, which the package documents as unreliable.
- Fixed/final articles expose only package-supported operations.

Material cost uses only `getBlueprintCost`, `getExperimentalEffectCost` and `sumMaterials`; no
surface breaks the requirement down per grade, so `getBlueprintGradeCost` is unused. Preserve `null` (unavailable) versus `[]` (known
zero). Baked fixed engineering has no craft cost. A Mercenary upgrade starts above its purchase grade;
Merc Coin is presented separately.

## Mandatory ingress normalization

Before any active-build replacement is presented or any calculation is read:

1. decode without changing the active build and retain only evidence needed for supported
   normalization/refusal outcomes;
2. resolve the hull the source named to the package's own `Ship.symbol` and construct on that
   symbol, so an accepted candidate's `shipSymbol` is a package identity. A hull the package does
   not carry is passed on exactly as it arrived, so the refusal is the package's own and names what
   the Commander sent. A candidate that arrives already built has nothing left to resolve — its hull
   cannot be renamed without rebuilding it — so the gate checks that identity instead and refuses a
   candidate reconstructed on anything else. Whoever reconstructs a snapshot owns getting it right;
3. pass the complete candidate through the released Almanac ingress boundary. An unknown hull
   refuses and every fixed mount returns populated with the hull default. Do not classify a slot,
   choose a replacement locally or run a second repair pass;
4. capture finite source quality in `[0,1)` only for supported modules the candidate resolves;
5. correlate those remaining partials by exact package slot/module identity, set aside the modules
   the package reports as final articles — its `preEngineeredVariant.engineeringLocked` — and call
   `completeEngineeringGrade(slotKey)` for the rest. Accept `normalized`, atomically refuse
   `unsupported`, and treat unexpected missing/mismatched/`unchanged` results as package-contract
   failures;
6. retain transient quality-completed notices only; persist no fixed-default history metadata;
7. commit once before history starts or resets, then allow validation/calculation reads.

Never call `completeEngineeringGrade()` for absent quality, quality `1`, or a final article. A final
article's quality is a figure the game writes for a finished module, not a roll: the package bakes the
article's fixed modifiers in during construction and locks it against further engineering, so it
answers `finalArticle` and the whole build would be refused over a module with nothing wrong with it.
Whether an article is final is read from the package, never recognised from a symbol or a blueprint.

Never keep a hull symbol a source spelled its own way. A journal `Loadout` event writes the hull in
lower case, package lookups match without regard to case, and `ShipLoadout` keeps whatever string it
was handed — so an unresolved symbol reaches storage and records intact and is only noticed where the
application compares one itself or spells one into a path. Feature 010's schematics are directories
named the package's way, and it draws none of them for a build that spells its hull differently. The
build-link coordinator's own "is this the same build?" comparison folds module symbols and not the
hull's, so an imported build and its own link disagreed on nothing but case and every reload of one
asked the Commander to confirm a replacement. Resolving the identity at ingress settles both.
Reconstruction from a snapshot resolves it the same way, so a record written before the identity was
resolved at ingress gets it back when it is opened. A build link never lost it: the codec stores an index into a
table of the package's own symbols, so a decoded link has always named the hull the package's way.

Refusal leaves the current build, revision, dirty state, autosave, fragment, notices and history
untouched.

## Power and recalculation

An enabled/priority command always leaves the module fitted. Mass remains in the build and current
catalogue cost is recomputed from the new `ShipLoadout`. All affected power and downstream figures
are re-read; the application does not add/remove contributions itself.

**The power carry, on any operation the package treats as a fresh mount.** `setModule` and
`setPreEngineeredVariant` document a fit as a fresh mount whose `On`, `Priority` and `Health` are
reset, and direct a screen that keeps a priority group across a swap to set them again. Three
operations here reach one of those two calls — a stock fit, a variant fit, and restoring a purchase,
which re-applies the article's own variant — and all three carry. No other operation needs it:
`applyBlueprint`, `setExperimentalEffect` and `clearEngineering` preserve both fields, and
`removeModule` empties the mount on purpose. So before the call, read the outgoing `FittedModule`'s
`on` and `priority`; after it, inside the same operation on the same candidate:

- where `priority` was an integer the setter's own `0`–`4` domain accepts, call
  `setModulePriority(slotKey, priority)`. A value outside that domain is not a group the package
  recognizes, so there is nothing to carry and the fit proceeds without it rather than being refused
  by a `RangeError` over a value no Commander set;
- where `on` was stated at all, call `setModuleEnabled(slotKey, on)`. Carrying only an explicit
  `false` loses a stated `true`, which every journal and SLEF loadout states on every module —
  writing it back preserves a field the source had rather than adding one, exactly as carrying a
  stated group 0 does.

Nothing else is written. An unstated group and an unstated on-state stay unstated: the package
already answers both — an absent priority is group 1 and an absent `on` is on — so writing either
would put a field in the build that no Commander set, which is the same rule the priority chip
follows (FR-015). `health` is not carried because no surface here reads or writes it.

The carry is part of the operation it belongs to, so it is one package edit, one revision and one
history decision, undone and redone with that edit rather than beside it.

## Package acceptance

Cross-package tests must prove that the installed Almanac package:

1. reconstructs every recognized application-modelled field from the canonical snapshot, including
   ship name/ident, engineering and identified variants, while recomputing retail cost;
2. changes/removes an experimental effect on re-engineerable fixed rewards while preserving the
   fixed base modifier block and `preEngineeredVariant` and recomputing effect-dependent stats;
3. refuses unknown hulls, always populates fixed mounts, and normalizes supported imported
   partial-quality states losslessly with a stable unsupported result;
4. identifies a final article from the recipe and quality a producer states beside it, applies its
   fixed modifiers, and answers `finalArticle` rather than completing a grade it has locked.

Historical purchase values are not acceptance inputs and are never restored.

## Persistence and publication

After any normal edit, undo or redo, feature 001 observes the newly committed active snapshot and
performs autosave/fragment synchronization. Package-defaulted fixed state is ordinary build data, not
a history frame of its own. This contract adds no storage keys or URL fields. Editor draft, selected
slot, search, refusal and history state are excluded.
