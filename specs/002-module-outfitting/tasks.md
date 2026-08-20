---
description: 'Task list for Module Outfitting and Engineering'
---

# Tasks: Module Outfitting and Engineering

**Input**: Design documents from `/specs/002-module-outfitting/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [design/](./design/),
[quickstart.md](./quickstart.md)

**Tests**: Test tasks are included. Success criteria SC-001–SC-005 are verification statements, every
contract in [contracts/](./contracts/) closes with a mandatory verification list, and constitution
principle VIII gates the build on unit coverage, the full Playwright matrix and automated
accessibility scans.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested and
demonstrated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Every task names the exact file it changes

## Path Conventions

Single Angular workspace at the repository root: product source in `src/`, tooling-only preview
application in `projects/ui-preview/`, end-to-end suite in `e2e/`. Unit tests live beside their source
as `*.spec.ts`. Component preview declarations are registered only in feature 011's manifest registry
at `src/app/ui/previews/preview-manifest.ts`; `projects/ui-preview/` renders that registry and holds
no feature-owned declaration file. Feature 002 adds no route; every surface composes inside feature 001's `/build`.

## Delivery Prerequisites

Features 011 and 001 must have landed. Feature 002 extends their boundaries and never creates a
substitute shell, token set, locale catalogue, storage format or second observable build. Every
application-owned message change preserves feature 011's complete English/German key and
interpolation parity. Their absence is not permission to weaken this design.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the prerequisite boundaries and pin the package evidence every later task asserts
against. Feature 002 adds no dependency to `package.json`.

- [ ] T001 Record the prerequisite gate — feature 011 tokens, localization, shared components, preview catalogue, ten Playwright projects with `@axe-core/playwright`, and feature 001 `/build`, `ActiveBuildState`, canonical `BuildSnapshotV1` capture/reconstruct/atomic swap, replacement notification and autosave/fragment observers — in `specs/002-module-outfitting/design/prerequisite-gate.md`
- [ ] T002 [P] Add shared outfitting fixtures: default builds covering every mount kind; the installed package's largest slot-choice set; a package-identified fixed-reward engineering regression; route-distinct variants; omitted and unusable fixed-mount payloads; and supported and unsupported partial-quality payloads, in `src/app/domain/outfitting/outfitting.fixtures.ts`
- [ ] T003 [P] Characterize the installed `@elite-dangerous-almanac/core` acceptance contract — snapshot reconstruction of every modelled field including name/ident with recomputed retail cost, fixed-reward effect add/replace/remove preserving the package-reported fixed modifier block and `preEngineeredVariant`, unknown-hull refusal, every absent or unusable fixed mount populated from the hull default, and lossless partial-quality normalization with a stable `unsupported` result — in `src/app/domain/outfitting/almanac-acceptance.spec.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The checkpoint boundary, shared ingress pipeline, candidate-first transaction, package
diagnostic text and signal store that every user story composes.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Application state types

- [ ] T004 [P] Define `OutfittingState`, `surface`, `SlotCapabilities` and the selection/draft/failure field types in `src/app/application/outfitting/outfitting-state.ts`, and define the type-only `HardpointCoverage` contract leaf (`{ kind: 'confirmedEmpty' }`, `{ kind: 'complete'; occupiedSlots: readonly string[] }`, `{ kind: 'unavailable' }`) in `src/app/domain/outfitting/hardpoint-coverage.ts` (contract-first export: unblocks feature 007 T006)
- [ ] T005 [P] Define `BuildEditIntent`, `BuildEditResult` and `EditFailure` with its five categories in `src/app/application/outfitting/build-edit-intent.ts`

### Checkpoint and ingress domain

- [ ] T006 Implement `ModeledBuildCheckpoint` capture, package reconstruction and atomic install delegating to feature 001's `BuildSnapshotV1` boundary, retaining no purchase value, capture condition or package calculation, in `src/app/domain/build/modeled-build-checkpoint.ts`
- [ ] T007 Add unit tests proving exact modelled round trip including sparse power fields, name, ident, ordinary engineering and identified variants, recomputed current catalogue cost and a blocking failure on impossible restore, in `src/app/domain/build/modeled-build-checkpoint.spec.ts` (depends on T006)
- [ ] T008 [P] Define `SourcePartialEngineering`, the `qualityCompleted` `IngressNotice`, `PartialEngineeringFailure` and `IngressResult` in `src/app/domain/build/build-ingress-result.ts`
- [ ] T009 Implement the shared ingress pipeline — decode without touching the active build, construct through the package so fixed mounts are already populated, correlate `[0,1)` qualities by exact slot and symbol and call `completeEngineeringGrade`, then commit once without a fixed-mount repair pass — in `src/app/domain/build/build-ingress-normalizer.ts` (depends on T006, T008)
- [ ] T010 Add unit tests covering unknown-hull refusal, absent and unusable fixed entries receiving package defaults, `normalized` acceptance, atomic whole-candidate refusal on `unsupported`, package-contract failure on missing/mismatched/`unchanged`, never calling `completeEngineeringGrade` for absent quality or quality `1`, and the unchanged active build, revision, autosave, fragment and history after refusal, in `src/app/domain/build/build-ingress-normalizer.spec.ts` (depends on T009)

### Candidate-first transaction

- [ ] T011 Implement the candidate-first transaction — capture the modelled checkpoint, reconstruct a detached `ShipLoadout`, invoke one package operation, discard on refusal or no-op, and atomically install one revision on change while returning the prior checkpoint — in `src/app/domain/outfitting/build-edit-transaction.ts` (depends on T005, T006)
- [ ] T012 Add unit tests proving one revision per changed command, no partial commit after a thrown package operation, `unchanged` producing no revision, and `LoadoutEditError` `code`/`constraint`/`params` plus slot retained on refusal, in `src/app/domain/outfitting/build-edit-transaction.spec.ts` (depends on T011)

### Package text and messages

- [ ] T013 [P] Extend feature 011's package text presenter with `getLoadoutEditErrorMessage`, `getLoadoutSlotName`, slot restriction, blueprint, experimental effect, engineering group and material leaf lookups plus the disclosed untranslated canonical fallback in `src/app/i18n/package-text.ts`
- [ ] T014 Add unit tests proving no private game-text or entitlement-name table exists and that a `null` locale value renders canonical text with the untranslated disclosure, in `src/app/i18n/package-text.spec.ts` (depends on T013)
- [ ] T015 [P] Add the outfitting workflow framing, capability, unavailable, notice and refusal message keys with reviewed English/German wording and matching interpolation variables to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`

### Store and workspace composition

- [ ] T016 Implement the signal `OutfittingStore` owning revision, selected slot key, surface, `lastEditFailure` and intent dispatch through the transaction, clearing selection, draft and query on accepted active-build replacement and preserving them on refusal, in `src/app/application/outfitting/outfitting.store.ts` (depends on T004, T005, T011)
- [ ] T017 Add unit tests proving selection, surface, query and draft changes never change the revision, and that refused ingress leaves every editing field intact, in `src/app/application/outfitting/outfitting.store.spec.ts` (depends on T016)
- [ ] T018 Compose the outfitting workspace region and its shared anatomy, validation and calculation outlets into feature 001's workspace page in `src/app/features/build-workspace/build-workspace.page.ts` (depends on T016)
- [ ] T019 [P] Implement the shared unavailable-fact primitive that renders explicit localized unavailability for `null` and absent package values in `src/app/ui/outfitting/unavailable-fact.ts`
- [ ] T020 [P] Implement the shared outfitting notice primitive with polite status and alert modes, coalesced announcements and no colour-only state in `src/app/ui/outfitting/outfitting-notice.ts`

### Verification harness

- [ ] T021 [P] Add the shared outfitting end-to-end helper providing axe scans, semantic-order, 44 CSS px target, no-document-overflow, 200% text, 400% zoom, expanded/RTL and reduced-motion assertions across the ten projects in `e2e/accessibility.ts`
- [ ] T022 [P] Register the outfitting component preview group and its shared fixtures in feature 011's typed manifest registry in `src/app/ui/previews/preview-manifest.ts`, which feature 011 T023 already renders; add no second preview entry point or declaration file outside that registry

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Fit modules (Priority: P1) 🎯 MVP

**Goal**: Every Almanac slot is inspectable by exact game key after ingress normalization, each slot
offers exactly the package-fittable modules, and fitting, replacing or removing one updates the build
and every package result. Non-removable slots show the package reason and no removal action.

**Independent Test**: Open `/build` with a stock build, confirm the rendered ledger matches
`loadout.slots()` key for key including the cargo hatch, fit a stock module into an empty slot,
replace and remove it, watch every package result refresh once, load an omitted-fixed fixture and see
every fixed mount package-populated as ordinary fitted state, and confirm a required or module-limited
slot offers a reason instead of remove.

### Application projections

- [ ] T023 [P] [US1] Implement the `SlotView` projection — exact key, canonical and localized name, kind, size, restriction, removability and `immovableReason` — from `ShipLoadout.slots()` in `src/app/application/outfitting/slot-view.ts`
- [ ] T024 [P] [US1] Implement the `FittedModuleView` projection reading `FittedModule.stats`, `effectiveStats`, `on`, `priority`, engineering and `preEngineeredVariant` while preserving field absence in `src/app/application/outfitting/fitted-module-view.ts`
- [ ] T025 [US1] Derive `SlotCapabilities` from current package operation and query evidence only, keeping `packageEmpty` distinct from a fit capability and granting the cargo hatch power controls alone, and derive `HardpointCoverage` from the same-build-revision package-resolved slot views — `confirmedEmpty` only when every package hardpoint slot is empty, `unavailable` whenever the views cannot answer, and never inferred from `weapons.length` — in `src/app/application/outfitting/slot-capabilities.ts` and `src/app/application/outfitting/hardpoint-coverage.adapter.ts` (depends on T023, T024)
- [ ] T026 [US1] Implement exact candidate membership — one `modulesForSlot(slotKey)` call per source revision, one stock choice per record, every `getPreEngineeredVariants(symbol)` record emitted immediately after its stock choice, no `ALL_MODULES` query, no deduplication and no candidate retained across revisions — in `src/app/application/outfitting/candidate-membership.ts`
- [ ] T027 [US1] Add unit tests proving choice count equals stock results plus every package variant for representative core, optional, weapon, utility and cargo-hatch slots, and that a stale revision discards retained choices, in `src/app/application/outfitting/candidate-membership.spec.ts` (depends on T026)
- [ ] T028 [US1] Add unit tests proving empty and package-resolved slots stay visible, unknown identities never reach a view, unavailable facts never become zero, and cargo hatch reports `immovableReason: 'cargoHatch'`, in `src/app/application/outfitting/slot-view.spec.ts` (depends on T023, T024, T025)

### Edit dispatch

- [ ] T029 [US1] Add the `fitStock`, `fitVariant` and `remove` intents dispatching `setModule`, `setPreEngineeredVariant` and `removeModule` with the exact retained package object in `src/app/application/outfitting/outfitting.store.ts` (depends on T016, T026)
- [ ] T030 [US1] Add unit tests proving replacement inherits no previous engineering, remove is offered only when `removable` is true, and a structured refusal leaves the snapshot, autosave, fragment and revision unchanged, in `src/app/application/outfitting/outfitting.store.spec.ts` (depends on T029)

### Shared components

- [ ] T031 [P] [US1] Implement the semantic slot group list preserving package outfitting order and kind headings in `src/app/ui/outfitting/slot-group.ts`
- [ ] T032 [P] [US1] Implement the slot card with exact key, capacity facts, fitted module summary, engineering summary, removability reason and separate named controls — never a clickable container around nested controls — in `src/app/ui/outfitting/slot-card.ts`
- [ ] T033 [P] [US1] Implement the module identity badge showing package name, symbol where needed, class, rating and mount in `src/app/ui/outfitting/module-identity-badge.ts`
- [ ] T034 [P] [US1] Implement the import quality-completion notice for completed engineering quality; fixed defaults are ordinary package-returned build state and require no application-owned notice in `src/app/ui/outfitting/quality-completion-notice.ts`
- [ ] T035 [P] [US1] Implement the structured edit-refusal notice presenting package `code`, `constraint` and `params` through the diagnostic presenter with app-owned framing in `src/app/ui/outfitting/edit-refusal-notice.ts`

### Feature components

- [ ] T036 [US1] Implement the outfitting workspace component composing the wide three-region and compact card compositions, the no-build state that promises no action of its own, and the category controls that change visibility only, in `src/app/features/build-workspace/outfitting/outfitting-workspace/outfitting-workspace.ts` (depends on T025, T031, T032, T033)
- [ ] T037 [US1] Implement the minimal replacement surface — full ordered package membership, explicit fit action, remove when removable, cancel that changes nothing, and the wide inline versus compact full-screen layer with inert background — in `src/app/features/build-workspace/outfitting/module-replacement/module-replacement.ts` (depends on T026, T029)
- [ ] T038 [US1] Add the workspace and replacement preview declarations (default, populated, selected, empty slot, non-removable, cargo hatch, unavailable facts, quality-completion notice, refusal) at wide, tablet and compact widths with expanded and RTL text in `src/app/ui/previews/preview-manifest.ts` (depends on T022, T036, T037)

### Verification

- [ ] T039 [US1] Add the outfitting suite covering ledger parity with `loadout.slots()` by exact key, fit, replace, remove, package refusal, non-removable reason, invalid and incomplete builds remaining editable, and one result refresh per committed revision in `e2e/module-outfitting.spec.ts` (depends on T036, T037)
- [ ] T040 [US1] Add omitted and unusable fixed-mount ingress scenarios asserting package defaults exist before any calculation read, no repair provenance enters active, persisted, published or exported state, and undo is unavailable when package construction was the only change, in `e2e/module-outfitting.spec.ts` (depends on T009, T034, T039)

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Find a replacement (Priority: P1)

**Goal**: Replacement choices are grouped by module name and ordered class descending, rating
ascending, stock before variants, with unique rewards as a final section; four-field case- and
accent-insensitive AND search settles under 100 ms; no matches is explicit with a clear action; and
acquisition and entitlement labels stay visible before and after fitting.

**Independent Test**: Open the largest chooser, confirm grouping, ordering and the final unique-reward
section against the package records, search with mixed case, accents and multiple terms spanning name,
class, rating and mount, confirm symbol and stats never match, clear a no-match query, and measure
input-to-rendered-result below 100 ms for the installed package's largest slot-choice fixture at the
mobile viewport under 4× CPU slowdown.

### Ordering, search and labels

- [ ] T041 [P] [US2] Implement the exhaustive `ModuleRating` comparator that fails type checking and tests when the package introduces a new value, in `src/app/application/outfitting/rating-order.ts`
- [ ] T042 [P] [US2] Implement NFKD folding, combining-mark removal and locale lowercasing for indexed fields and query terms in `src/app/application/outfitting/text-folding.ts`
- [ ] T043 [US2] Implement `CandidateQueryState` — section split, name grouping via active-locale `Intl.Collator` with base sensitivity, class descending, rating ascending, stock before variants, package then variant ordinals, the four-field immutable index, whitespace term splitting, AND matching, and the `loading`/`ready`/`noMatches`/`packageEmpty`/`stale`/`refused` statuses — in `src/app/application/outfitting/candidate-query.ts` (depends on T026, T041, T042)
- [ ] T044 [US2] Implement stable choice keys encoding kind, module symbol and, for variants, blueprint fdname, purchase grade, effect fdname or absence, acquisition and package ordinal as view identity only, in `src/app/application/outfitting/choice-key.ts` (depends on T026)
- [ ] T045 [P] [US2] Implement `AcquisitionLabel` projection mapping exact package entitlement and acquisition tokens to app-localized explanations, stacking route with unique-reward for community-goal and event rewards and route with not-ordinarily-available for Mercenary and tech-broker, and reading `FittedModule.stats?.entitlement` plus `preEngineeredVariant` after fitting, in `src/app/application/outfitting/acquisition-labels.ts`
- [ ] T046 [US2] Add unit tests covering exact order across representative slots, route-distinct variants staying distinct, unique rewards last, multi-term case- and accent-insensitive search over exactly name, class, rating and mount, symbols, blueprint names, acquisition labels and stats never matching, index rebuild on slot, revision and locale change, and the `noMatches` payload with `canClear: true`, in `src/app/application/outfitting/candidate-query.spec.ts` (depends on T043, T044)
- [ ] T047 [US2] Add unit tests proving labels stack, disappear when the package no longer identifies a fitted variant after clearing engineering, and use no private entitlement-name data, in `src/app/application/outfitting/acquisition-labels.spec.ts` (depends on T045)

### Shared components

- [ ] T048 [P] [US2] Implement the visibly labelled candidate search with instructions, clear action and polite live result count in `src/app/ui/outfitting/candidate-search.ts`
- [ ] T049 [P] [US2] Implement the candidate list rendering the wide semantic manifest with a labelled overflow container and the compact cards that disclose the same in-scope facts progressively, with textual fitted/stock/pre-engineered state and no invented ranking, badge, delta or better-worse colour, in `src/app/ui/outfitting/candidate-list.ts`
- [ ] T050 [P] [US2] Implement the acquisition and entitlement badge rendering stacked labels as text plus programmatic state in `src/app/ui/outfitting/acquisition-badge.ts`

### Feature composition

- [ ] T051 [US2] Extend the replacement surface with sections, grouping, search, result count, the `noMatches`, `packageEmpty`, `loading`, `stale`, `notReplaceable` and `refused` states, and native radio or button choice selection with a separate full-width confirm, in `src/app/features/build-workspace/outfitting/module-replacement/module-replacement.ts` (depends on T043, T048, T049, T050)
- [ ] T052 [US2] Add the message keys for search labelling, result counts, no-match, empty package result, stale rebuild and every acquisition and entitlement label with reviewed English/German wording and matching interpolation variables to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json` (depends on T015, T045)
- [ ] T053 [US2] Add replacement preview declarations (full, searched, no-match, empty package result, stale, refusal, unique-reward section, stacked labels) at wide, tablet and compact widths in `src/app/ui/previews/preview-manifest.ts` (depends on T022, T051)

### Verification

- [ ] T054 [US2] Add replacement scenarios covering membership parity with `modulesForSlot` plus every variant, section and group order, multi-term accent-insensitive search, no-match with clear restoring all choices, and a candidate list rebuilt after a fit reflecting new exclusive and count limits, in `e2e/module-outfitting.spec.ts` (depends on T051)
- [ ] T055 [US2] Add the in-page result-settle measurement under Chromium CDP `Emulation.setCPUThrottlingRate(4)` at the mobile viewport, proving input-to-rendered-result stays under 100 ms for the installed package's largest slot-choice fixture and excluding automation transport, in `e2e/module-outfitting.spec.ts` (depends on T002, T054)

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Engineer and power a module (Priority: P1)

**Goal**: Only package-supported blueprints, grades and effects are offered; apply, effect-only and
clear-all remain distinct; every grade is modelled at 100% quality with supported imports normalized
and unsupported imports refused before activation; and enabled state and priority update every
affected package calculation while the module stays fitted.

**Independent Test**: Open the engineering editor on an ordinary module, apply blueprint, grade and
effect in one confirmation, remove only the effect and confirm the blueprint and grade survive, clear
all engineering, verify package `null` versus `[]` material costs and separate Merc Coin, import a
supported partial quality and see the 100% notice, import an unsupported partial and see the
pre-activation refusal leave the build untouched, then toggle enabled and priority on the cargo hatch.

### Engineering domain and projections

- [ ] T056 [P] [US3] Implement the `EngineeringView` projection reading current blueprint fdname, grade, literal quality `1`, effect fdname, package modifiers and separate purchase variant in `src/app/application/outfitting/engineering-view.ts`
- [ ] T057 [US3] Implement `EngineeringDraft` holding selection only, with `baseBuildRevision` staleness, exact `availableBlueprints()` and `availableExperimentalEffects()` menus, explicit no-effect, and detached-candidate preview read from `stats` and `effectiveStats`, in `src/app/application/outfitting/engineering-draft.ts` (depends on T056)
- [ ] T058 [US3] Implement `EngineeringCostView` using only `getBlueprintCost`, `getBlueprintGradeCost`, `getExperimentalEffectCost` and `sumMaterials`, continuing the same recipe from the current completed grade and pricing a replacement recipe from zero, preserving `null` as unavailable and `[]` as known zero, charging nothing for baked fixed engineering or effect removal, and keeping Merc Coin separate, in `src/app/domain/outfitting/engineering-cost.ts`
- [ ] T059 [US3] Add unit tests for same-recipe continuation, replacement-recipe reset, Mercenary progression starting above purchase grade, `null` versus `[]`, no craft cost for baked rewards and `sumMaterials` used only when every input is known, in `src/app/domain/outfitting/engineering-cost.spec.ts` (depends on T058)
- [ ] T060 [US3] Add unit tests proving menus come only from package methods, quality is always explicitly `1` and never a roll control, purchase grade stays distinct from current grade, and a stale draft refuses apply and rebuilds, in `src/app/application/outfitting/engineering-draft.spec.ts` (depends on T057)

### Edit dispatch

- [ ] T061 [US3] Add the `applyEngineering`, `setExperimental` and `clearEngineering` intents calling `applyBlueprint(slotKey, fdname, { grade, quality: 1, experimental })` with the effect property omitted when none, branching explicitly on `setExperimentalEffect`'s `updated`, `unchanged` and `unsupported` results, and treating a plain `TypeError` or `RangeError` after a package-offered action as an unexpected structured refusal, in `src/app/application/outfitting/outfitting.store.ts` (depends on T016, T057)
- [ ] T062 [US3] Add the `setEnabled` and `setPriority` intents calling `setModuleEnabled` and `setModulePriority` with zero-based package values, leaving the module fitted so mass and current catalogue cost remain, in `src/app/application/outfitting/outfitting.store.ts` (depends on T016)
- [ ] T063 [US3] Add unit tests proving effect-only removal preserves blueprint, grade, fixed modifier block and `preEngineeredVariant`; clear-all differs and may erase package Mercenary identification; `unchanged` creates no revision; `unsupported` surfaces package code and params without mutation; and one-based UI priority maps to package `0..4` without fabricating an absent value, in `src/app/application/outfitting/outfitting-engineering.spec.ts` (depends on T061, T062)

### Shared components

- [ ] T064 [P] [US3] Implement the blueprint choice list with native list semantics, localized or disclosed canonical names and route text in `src/app/ui/outfitting/blueprint-choice-list.ts`
- [ ] T065 [P] [US3] Implement the named grade radio group containing exactly the selected descriptor's grades in `src/app/ui/outfitting/grade-selector.ts`
- [ ] T066 [P] [US3] Implement the experimental effect list including an explicit no-effect option in `src/app/ui/outfitting/experimental-effect-list.ts`
- [ ] T067 [P] [US3] Implement the material cost list separating blueprint progression, effect, combined, unavailable and Merc Coin with localized number and unit labels associated to material names in `src/app/ui/outfitting/material-cost-list.ts`
- [ ] T068 [P] [US3] Implement the attribute comparison list presenting package current versus candidate values through header and definition relationships with no arrows, percentages or better-worse colour in `src/app/ui/outfitting/attribute-comparison.ts`
- [ ] T069 [P] [US3] Implement the named power controls — an enabled switch and a one-based priority select whose accessible names include the slot and module — in `src/app/ui/outfitting/power-controls.ts`
- [ ] T070 [P] [US3] Implement the incoming-build refusal notice naming every affected exact slot, source module and engineering identity, original quality and package reason, stating that activation did not occur and announcing once as an alert, in `src/app/ui/outfitting/ingress-refusal-notice.ts`

### Feature composition

- [ ] T071 [US3] Implement the engineering editor with wide inline and compact full-screen layers, explicit apply, distinct confirmable clear-all, cancel that restores nothing because only draft state changed, and the unengineered, ordinary, Mercenary, fixed re-engineerable, final, no-menu, known-zero, unavailable-cost, stale-draft and package-refusal states, in `src/app/features/build-workspace/outfitting/engineering-editor/engineering-editor.ts` (depends on T057, T058, T064, T065, T066, T067, T068)
- [ ] T072 [US3] Compose the power controls and cargo-hatch presentation into the slot card and workspace so enabled and priority are editable wherever the package supplies the operation in `src/app/ui/outfitting/slot-card.ts` (depends on T032, T069)
- [ ] T073 [US3] Publish the accepted quality-completion notice and compose the pre-activation refusal surface into feature 001's open, link and reload flows and feature 004's import flow in `src/app/features/build-workspace/outfitting/outfitting-workspace/outfitting-workspace.ts` (depends on T009, T034, T070)
- [ ] T074 [US3] Add the engineering, material, power, quality-completion and ingress-refusal message keys with reviewed English/German wording and matching interpolation variables to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json` (depends on T015)
- [ ] T075 [US3] Add engineering editor preview declarations for every row of the states table plus power controls at wide, tablet and compact widths with expanded and RTL text in `src/app/ui/previews/preview-manifest.ts` (depends on T022, T071)

### Verification

- [ ] T076 [US3] Add the engineering suite covering menu parity with package methods, one-confirmation blueprint plus grade plus effect, grade and blueprint replacement, effect add, replace and remove-only, clear-all, the Mercenary upgrade and clear path, and the final-article restriction with no unsupported actions, in `e2e/module-engineering.spec.ts` (depends on T071)
- [ ] T077 [US3] Add fixed-reward and cost scenarios covering the tech-broker FSD effect regression preserving fixed modifiers and variant identity, no craft cost for baked engineering, Mercenary progression above purchase grade, separate Merc Coin, and `[]` shown as known zero versus `null` shown as unavailable, in `e2e/module-engineering.spec.ts` (depends on T003, T076)
- [ ] T078 [US3] Add quality-normalization scenarios proving supported partials become true quality-1 computed states with notices naming original quality, slot and result, that saved, shared and exported state represents quality 1, that unsupported partials are atomically refused before activation with the exact package reason while the current build, storage, fragment, notices and history stay unchanged, and that the editor never opens for a rejected candidate, in `e2e/module-engineering.spec.ts` (depends on T009, T073, T076)
- [ ] T079 [US3] Add cargo-hatch and power scenarios proving facts, enabled and priority are available while replace, search, engineer and remove are absent with the package reason, that UI `1..5` maps to package `0..4`, and that power-dependent package results refresh while mass and cost remain, in `e2e/module-outfitting.spec.ts` (depends on T072)

**Checkpoint**: All three P1 stories are independently functional.

---

## Phase 6: User Story 4 - Undo and redo (Priority: P2)

**Goal**: Every Commander-authored build edit can be undone and redone during the session, a new edit
after undo discards the redo path, one decision creates one step, at least the newest 100 decisions
are retained, and the tape never reaches storage, links, SLEF or browser navigation.

**Independent Test**: Perform a mixed sequence of fits, removals, engineering, effect, power, name and
ident edits, undo and redo each intermediate state comparing modelled fields and recomputed package
results, undo several and make a new edit to see redo cleared, run 101 decisions and traverse the
retained tape, and open a replacement build to see both directions reset.

### History domain

- [ ] T080 [US4] Implement the framework-agnostic `SessionEditHistory<ModeledBuildCheckpoint>` tape with `past`, `future`, capacity exactly 100, the changed-edit, undo and redo transitions and reset on accepted replacement, storing an unformatted intent message key with scalar params only, in `src/app/domain/outfitting/session-edit-history.ts` (depends on T006)
- [ ] T081 [US4] Add unit tests proving 101 successful decisions retain decisions 2–101 and restore all 100, moving frames never grows the retained path beyond 100, undo then a new edit discards the future, an empty stack is a no-op, and an impossible restore is a blocking failure consuming neither frame, in `src/app/domain/outfitting/session-edit-history.spec.ts` (depends on T080)

### Store wiring

- [ ] T082 [US4] Wire history capture into the store so exactly one frame is recorded per successful changed decision — stock or variant fit, removal, blueprint plus grade plus effect, effect-only, clear, enabled, priority, ship name and ship ident — and expose `canUndo`, `canRedo` and localized next-action summaries, in `src/app/application/outfitting/outfitting.store.ts` (depends on T016, T080)
- [ ] T083 [US4] Route feature 001's ship name and ident edits through the modelled snapshot update, package reconstruction and history-recorded decision path in `src/app/application/outfitting/outfitting.store.ts` (depends on T082)
- [ ] T084 [US4] Add unit tests proving slot selection, category, anatomy and status mode, chooser search, editor draft, open, close, cancel, failed, stale, refused and no-op commands, calculation reads, autosave, link publication and transient quality-completion notices create no frame, in `src/app/application/outfitting/outfitting-history.spec.ts` (depends on T082)
- [ ] T085 [US4] Add unit tests proving undo and redo reproduce every modelled field exactly, recompute current catalogue cost and every package result over one revision, and never restore a historical purchase value, in `src/app/application/outfitting/outfitting-history.spec.ts` (depends on T082, T084)
- [ ] T086 [US4] Add regression coverage proving a successful fixed-mount edit records exactly one ordinary history frame and undo restores the previous package-populated module without auxiliary metadata, in `src/app/application/outfitting/outfitting-history.spec.ts` (depends on T082, T085)

### Components

- [ ] T087 [P] [US4] Implement the undo and redo actions with programmatic disabled state, optional next-action summary and identical accessible names in the wide direct and compact overflow placements in `src/app/ui/outfitting/undo-redo-actions.ts`
- [ ] T088 [US4] Compose the undo and redo actions into the wide header and the compact named overflow action region in `src/app/features/build-workspace/outfitting/outfitting-workspace/outfitting-workspace.ts` (depends on T036, T087)
- [ ] T089 [P] [US4] Add the history action, summary and disabled-state message keys with reviewed English/German wording and matching interpolation variables to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T090 [US4] Add history preview declarations covering available, unavailable, cleared redo branch and the 100-decision boundary at wide, tablet and compact widths in `src/app/ui/previews/preview-manifest.ts` (depends on T022, T087)

### Verification

- [ ] T091 [US4] Add the history suite covering a mixed decision sequence, exact intermediate restoration with recomputed package results, redo cleared by a new edit, 101 decisions retaining the newest 100, and both directions reset by stock creation, record open, URL load, SLEF import and reload restoration while refused ingress preserves them, in `e2e/outfitting-history.spec.ts` (depends on T082, T088)
- [ ] T092 [US4] Assert boundary isolation — no history tape, checkpoint or summary reaches local records, the `BuildSnapshotV1` serializer, the build-link codec, SLEF or Angular Router and History, and autosave and fragment publication observe the active build after undo and redo exactly as after a normal edit, in `e2e/outfitting-history.spec.ts` (depends on T091)

**Checkpoint**: All four user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: The complete responsive, localization and accessibility matrix, package-ownership policy
proof, coverage registration and the documented validation run.

- [ ] T093 [P] Add the responsive composition suite asserting the wide three-region, roomy-landscape two-pane and compact compositions at 1440×900, 834×1112, 1112×834, 390×844 and 844×390 in Chromium and Firefox, with identical capability at every width, both declared pane minimums proven by content rather than viewport label, and the compact anatomy-before-ledger source order, in `e2e/outfitting-responsive.spec.ts`
- [ ] T094 [P] Add the accessibility suite running axe over the workspace, chooser, engineering, no-build, empty, no-match, unavailable, refusal, normalization and history-disabled states, asserting role, name, selected, expanded, checked, invalid and live relationships, associated layer titles with inert background, coalesced announcements, and slot and module context in every switch and priority name, in `e2e/outfitting-accessibility.spec.ts` (depends on T021)
- [ ] T095 [P] Add touch-only interaction, 44 CSS px target, no-document-horizontal-overflow, 200% text, 400% zoom selecting the compact composition, expanded-message, RTL and reduced-motion assertions for every feature 002 surface in `e2e/outfitting-accessibility.spec.ts` (depends on T094)
- [ ] T096 [P] Assert that anatomy and ledger exchange only the exact game slot key and that no positional node index becomes shared identity in `e2e/module-outfitting.spec.ts`
- [ ] T097 Register the FR-001–FR-018 and SC-001–SC-005 surfaces, journeys, axe flags and named assertions for feature 002 in the coverage ledger in `e2e/coverage-ledger.ts` (depends on T093, T094, T095)
- [ ] T098 [P] Add the repository policy check rejecting broad Almanac barrel imports, Almanac imports inside components, colour and spacing literals outside tokens, hard-coded application strings, history serialization, raw modifier rewrites and local fit, variant or compatibility rules in feature 002 source, in `scripts/policy/outfitting-ownership.mjs`
- [ ] T099 [P] Document the outfitting edit, ingress normalization and session-history boundaries, including what is deliberately not persisted, in `docs/outfitting-and-history.md`
- [ ] T100 Confirm the built asset tree contains no `.design/` mock module, price, stat, modifier or material value and record the reconciliation outcome in `specs/002-module-outfitting/design/reference-review.md`
- [ ] T101 Run `pnpm run check` and execute every scenario in `specs/002-module-outfitting/quickstart.md`, confirming at least 80% statements, branches, functions and lines, every Playwright project and axe scan running, and no skipped or quarantined test (depends on all prior tasks)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Depends on features 011 and 001 having landed; can start immediately after that
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all four user stories. T009 composes
  feature 001 T021's package reconstruction boundary, so that task must land first; T004 is
  contract-first and unblocks feature 007 T006
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational and on US1's candidate membership (T026) and replacement surface (T037)
- **User Story 3 (Phase 5)**: Depends on Foundational only; T072 edits the same slot card as T032, so sequence those two if US1 and US3 run concurrently
- **User Story 4 (Phase 6)**: Depends on Foundational only; it records whichever decisions the completed stories dispatch
- **Polish (Phase 7)**: Depends on the user stories being complete

### User Story Dependencies

- **US1 (P1)**: Independent. Slot enumeration, membership and atomic fit, replace and remove need no ordering, search, engineering or history.
- **US2 (P1)**: Builds on US1's membership and replacement shell. Ordering, search, labels and performance add no requirement to US1 and are demonstrable with US1 alone in place.
- **US3 (P1)**: Independent. Engineering, power and quality normalization operate on any fitted module, including one placed by a test harness.
- **US4 (P2)**: Independent. The tape records any successful changed decision the store dispatches, so it is testable with a single edit kind.

### Within Each User Story

- Domain before application; application before shared components; shared components before feature composition
- Message keys land with the surface that consumes them
- Preview states land with the component they cover
- Unit tests accompany the file they cover; the end-to-end suite closes each story

### Cross-Feature Contracts

- **Consumed**: feature 001 T021/T022 (`reconstructFromSnapshot` and its package-fixed invariant) →
  this feature's T009 shared ingress pipeline
- **Exported**: T004 defines the type-only `HardpointCoverage` leaf and T025 derives it → feature
  007 T006. T004 must land before feature 007's Phase 2 can compile

### Shared-File Sequencing

- `src/app/application/outfitting/outfitting.store.ts`: T016 → T029 (US1) → T061, T062 (US3) → T082, T083 (US4)
- `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`: T015 → T052, T074, T089
- `src/app/ui/outfitting/slot-card.ts`: T032 → T072
- `HardpointCoverage`: T004 (type) → T025 (adapter)
- `src/app/features/.../outfitting-workspace/outfitting-workspace.ts`: T036 → T073 → T088
- `src/app/features/.../module-replacement/module-replacement.ts`: T037 → T051
- `e2e/module-outfitting.spec.ts`: T039 → T040, T054, T055, T079, T096

### Parallel Opportunities

- Setup: T002 and T003 in parallel
- Foundational: T004, T005, T008, T013, T015 in parallel; then T019, T020, T021, T022 in parallel
- US1: projections T023 and T024 in parallel; the five shared components T031–T035 in parallel
- US2: T041, T042, T045 in parallel; the three shared components T048–T050 in parallel
- US3: the seven shared components T064–T070 in parallel; T056 alongside T058
- US4: T087 and T089 in parallel with the domain tape work
- Polish: T093, T094, T095, T096, T098 and T099 in parallel
- After Foundational completes, US1, US3 and US4 can be staffed concurrently, with US2 following US1's membership

---

## Parallel Example: User Story 1

```bash
# Launch the two application projections together:
Task: "Implement the SlotView projection in src/app/application/outfitting/slot-view.ts"
Task: "Implement the FittedModuleView projection in src/app/application/outfitting/fitted-module-view.ts"

# Launch all five shared components together:
Task: "Implement the semantic slot group list in src/app/ui/outfitting/slot-group.ts"
Task: "Implement the slot card in src/app/ui/outfitting/slot-card.ts"
Task: "Implement the module identity badge in src/app/ui/outfitting/module-identity-badge.ts"
Task: "Implement the quality-completion notice in src/app/ui/outfitting/quality-completion-notice.ts"
Task: "Implement the structured edit-refusal notice in src/app/ui/outfitting/edit-refusal-notice.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — this blocks everything
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run quickstart Scenarios 2, 3 and 5 plus `e2e/module-outfitting.spec.ts`
5. Demo slot inspection, fitting, replacement, removal and package-populated fixed construction

### Incremental Delivery

1. Setup + Foundational → checkpoint, ingress and candidate-first transaction exist
2. Add US1 → inspect and fit every slot → validate Scenarios 2, 3, 5 → demo (MVP)
3. Add US2 → ordered, labelled, searchable choices under 100 ms → validate Scenario 4 → demo
4. Add US3 → engineering, power and quality normalization → validate Scenarios 6–9 → demo
5. Add US4 → 100-decision undo and redo → validate Scenario 10 → demo
6. Polish → Scenarios 11–12, policy proof and coverage registration

### Parallel Team Strategy

1. The team completes Setup and Foundational together
2. Then: Developer A takes US1 and hands membership to Developer B for US2, Developer C takes US3,
   Developer D takes US4
3. Coordinate on `src/app/application/outfitting/outfitting.store.ts`,
   `src/app/i18n/locales/en.json`, `src/app/i18n/locales/de.json` and
   `e2e/module-outfitting.spec.ts`, which several stories touch; follow the shared-file sequencing
   above

---

## Notes

- [P] tasks touch different files and have no dependency on incomplete work
- Every game value, fitting rule, variant recognition, engineering menu, cost and diagnostic comes from `@elite-dangerous-almanac/core`; no task adds a local substitute
- Candidate-first is absolute: no component holds a mutable build, and a refused or no-op operation changes nothing
- Package construction with populated fixed mounts precedes partial-quality completion, and both
  precede any calculation read
- `null` remains unavailable and `[]` remains known zero everywhere a package result is presented
- Historical purchase values are never modelled, restored or displayed; current catalogue cost is recomputed after every revision
- Qualified WCAG 2.2 AA conformance wording (naming the excluded criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11) is enforced repository-wide by feature 011 T093; this feature adds no separate assertion
- Commit after each task or logical group; stop at any checkpoint to validate a story independently
