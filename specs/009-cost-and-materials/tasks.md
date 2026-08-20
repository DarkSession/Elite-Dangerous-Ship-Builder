---
description: 'Task list for Cost and Materials'
---

# Tasks: Cost and Materials

**Input**: Design documents from `/specs/009-cost-and-materials/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [design/](./design/),
[quickstart.md](./quickstart.md)

**Tests**: Test tasks are included. Every contract in this feature names its own required
verification, the specification gates delivery on SC-001–SC-004, and constitution principle VIII
gates the build on unit coverage, the ten-project Playwright matrix and automated accessibility
scans.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested and
demonstrated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Every task names the exact file it changes

## Path Conventions

Single Angular workspace at the repository root: framework-agnostic projections and contracts in
`src/app/domain/cost-materials/`, the shared engineering-cost boundary in
`src/app/domain/outfitting/engineering-cost.ts`, signal stores, adapters and presenters in
`src/app/application/cost-materials/`, surfaces in
`src/app/features/build-workspace/cost-and-materials/`, shared primitives and previews in
`src/app/ui/`, messages and formatters in `src/app/i18n/`, end-to-end suites in `e2e/`, repository
policy checks in `scripts/`. Unit tests live beside their source as `*.spec.ts`.

## Delivery gates

Feature 009 owns every credit, Merc Coin and engineering-material semantic in the application and
adds no arithmetic of its own. Four gates apply and are named on the tasks they block:

- **Repository prerequisite**: TypeScript `strict` and Angular `strictTemplates` must be enabled in
  the shared configuration and the existing project must pass under them (constitution technology
  requirement, closed by feature 011).
- **Feature prerequisites**: feature 001 (one atomic active `{ loadout, buildRevision }` read
  boundary, no-build state, `/build` workspace), feature 002 (committed-edit revision advance,
  exact-slot actions and the framework-agnostic engineering-cost boundary in
  `src/app/domain/outfitting/engineering-cost.ts`), feature 003 (`StatusRevisionContext`, the
  generic `StatusProvider<T, I>` and `AssemblyRequirementsPort<T>`, the shared `WorkspaceTarget`
  union and the `costAndMaterials` detail target, and the accepted
  `retailCredits | mercCoin | materials` summary vocabulary) and feature 011 (tokens, components,
  localization, formatters, game-text presenter with untranslated disclosure, announcement
  primitives, preview manifest, ten Playwright projects, axe helpers).
- **Contract-first exports**: feature 003's concrete provider bundle waits on this feature's Phase 2
  type exports (T008). That task must land before feature 003 can compile against a concrete
  Assembly Requirements contract; feature 003 never calls the Almanac for a price, a Merc Coin total
  or a material quantity itself.
- **Shared classifier reuse**: feature 002's accepted cost boundary is consumed, never duplicated. If
  its implemented export lives at a different accepted path, this feature imports that export rather
  than creating a second fixed/Mercenary classifier.

The installed `@elite-dangerous-almanac/core` has no known feature-009 API blocker: numeric
`RetailCredits`, `mercCoinCost()`, `preEngineeredVariant` acquisition, `getBlueprintCost` with a
baseline grade, `getExperimentalEffectCost`, `sumMaterials`, `getMaterialBySymbol` and
`getMaterialName` are all present in the installed release, as is the Expanded Cargo Rack regression
fix.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Characterize the package contract this feature projects and create the source and test locations
before any contract lands.

- [ ] T001 Characterize the installed Almanac cost and material contract this feature projects — `retailCredits()` returning non-nullable numeric `hull`, `modules` and `rebuy` plus an ordered `unpriced` list of `{ slot, symbol }`; `mercCoinCost()` returning zero both for no recognized article and for a recognized article with no price; `PreEngineeredVariant` carrying `acquisition`, `grade`, `experimental` and optional `mercCoinCost`; `getBlueprintCost(fdname, level)` and `getBlueprintCost(fdname, level, baselineGrade)` returning cumulative lists, `null` and a genuine `[]` at or above target across every supplied mechanics identity and cost key; `getExperimentalEffectCost` covering every supplied identity and cost key; `sumMaterials` matching symbols case-insensitively and preserving first-seen order; `getMaterialBySymbol` resolving every recipe-referenced symbol in the material catalogue; `getMaterialName(symbol, locale)` returning `null` on a locale miss rather than falling back; and the leaf subpaths `ships/ship-loadout`, `ships/blueprint-costs`, `ships/experimental-effect-costs`, `ships/engineering`, `materials/materials` and `i18n/materials` — in `src/app/domain/cost-materials/almanac-cost-contract.spec.ts`
- [ ] T002 [P] Create the feature source skeleton `src/app/domain/cost-materials/`, `src/app/application/cost-materials/` and the `src/app/features/build-workspace/cost-and-materials/` subdirectories `cost-and-materials-detail/`, `engineering-materials/`, `material-trace/`, `mercenary-purchases/` and `retail-credits/` per plan.md
- [ ] T003 [P] Create the feature suite `e2e/cost-and-materials.spec.ts` importing the feature 011 axe and assertion helpers, and register its surfaces in `e2e/coverage-ledger.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Publish the immutable snapshot contract feature 003 compiles against, then the pure
projection transaction, the revision-keyed store, the port adapter and the presentation boundary
every surface reads.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Shared contracts (contract-first exports)

- [ ] T004 [P] Define the shared semantic discriminants `Exact<T>`, `LowerBound<T, E>` and `Unavailable<E>`, with the documented rules that numeric zero is an exact value, package `[]` is a known empty list, package `null` is unavailable and conditional `absent` applies only where the concept does not apply, in `src/app/domain/cost-materials/cost-materials-snapshot.ts`
- [ ] T005 [P] Define `UnpricedCreditEntry` retaining the exact package `slot` and module `symbol`, and `RetailCreditsProjection` with `hull: Exact<number>`, `modules` and `rebuy` as `Exact<number> | LowerBound<number, UnpricedCreditEntry>` and the returned-order `unpriced` list, with no nullable numeric field, combined credit total, captured purchase value or derived percentage, in `src/app/domain/cost-materials/cost-materials-snapshot.ts`
- [ ] T006 [P] Define `MercenaryPurchaseEntry` with exact `slot`, `moduleSymbol`, package `variant` identity, `purchaseGrade`, `currentGrade` and `price: Exact<number> | Unavailable<'missingPackagePrice'>`, and the `MercenaryProjection` union `{ kind: 'absent' } | { kind: 'present'; entries; total: Exact<number> | LowerBound<number, MercenaryPurchaseEntry> }` with a non-empty `entries` invariant, in `src/app/domain/cost-materials/cost-materials-snapshot.ts`
- [ ] T007 [P] Define `EngineeringSelectionSource` with `sourceId`, exact `slot`, `moduleSymbol`, `kind`, `fdname`, `selectedGrade`, `baselineGrade` and `cost`, the `EngineeringSourceCost` union `known | unavailable('missingBlueprintCost' | 'missingEffectCost') | fixedNotCrafted | mercenaryPurchaseNotCrafted`, `MaterialContribution`, `MaterialRequirement`, `MaterialMetadataGap`, `ProjectionFailure` and the `EngineeringRequirementsProjection` union `none | complete | incomplete | failure`, in `src/app/domain/cost-materials/engineering-requirements.ts` (depends on T004)
- [ ] T008 Define the atomically published `CostAndMaterialsSnapshot` carrying `buildRevision`, `retail`, `mercenary` and `engineering`, and the `CostMaterialsTarget` union `{ kind: 'detail'; capability: 'costAndMaterials' } | { kind: 'slot'; slotKey } | { kind: 'materialTrace'; materialSymbol }`, and export both from `src/app/domain/cost-materials/cost-materials-snapshot.ts` as this feature's contract-first surface for feature 003 (depends on T005, T006, T007)

### Projection transaction

- [ ] T009 Implement the pure `projectCostAndMaterials({ loadout, buildRevision })` orchestration — capture the fitted-module snapshots once in package order, delegate to the retail, Mercenary and engineering projections, stamp the captured revision onto one immutable result, and convert any thrown package or integration error into an `engineering` `failure` evidence rather than a nullable retail field or a stale value — in `src/app/domain/cost-materials/cost-materials-projector.ts` (depends on T008)
- [ ] T010 Add the projection contract suite with a spied captured loadout proving exactly one `retailCredits()` call, exactly one fitted-module enumeration, at most one `mercCoinCost()` call and none when no entry is recognized, one `sumMaterials()` call per projection, a returned object frozen against mutation, the captured revision stamped on every child value, and `sourcePurchase` and fitted captured `value` never read, in `src/app/domain/cost-materials/cost-materials-projector.spec.ts` (depends on T009)

### Application boundary

- [ ] T011 Implement `CostMaterialsStore` — a revision-keyed cache that projects once per requested active build revision, publishes the immutable snapshot only for a matching revision, discards a superseded projection instead of restamping it, and exposes the owning integration boundary's pending and failure states without labelling stale figures current — in `src/app/application/cost-materials/cost-materials.store.ts` (depends on T009)
- [ ] T012 Add store unit tests for one projection per revision, an identical cached object reaching two consumers, a mismatched requested context never publishing, a superseded revision discarded, a repeated identical revision not reprojecting, and a locale change invoking no domain projector call, in `src/app/application/cost-materials/cost-materials.store.spec.ts` (depends on T011)
- [ ] T013 Implement `CostMaterialsAssemblyRequirementsAdapter` satisfying feature 003's `AssemblyRequirementsPort<CostAndMaterialsSnapshot>` — publish the same cached snapshot object under the same revision, emit qualified summary ids only from the accepted `retailCredits | mercCoin | materials` vocabulary, omit `mercCoin` entirely while the owner state is `absent`, and expose the single `costAndMaterials` detail target — in `src/app/application/cost-materials/assembly-requirements.adapter.ts` (depends on T008, T011)
- [ ] T014 Add adapter tests proving detail and Status hold the identical snapshot object for one revision, a mismatched context yields pending rather than a stale ready read, `absent` Mercenary contributes no `mercCoin` id and no zero total, and the adapter exposes no combined credit total, total material unit count, blueprint count, currency comparison or readiness judgement, in `src/app/application/cost-materials/assembly-requirements.adapter.spec.ts` (depends on T013)
- [ ] T015 Implement `CostMaterialsPresenter` — the locale-only presentation boundary that joins each exact slot key back to the captured `loadout.slots()` record before calling the package slot-name helper, resolves module, variant, blueprint, effect and material names through package leaf helpers with feature 011's canonical-English untranslated disclosure on a `null` locale result, keeps the raw slot key or symbol visible when no package text resolves, applies feature 011 named number, credit, Merc Coin, quantity and grade formatters without changing any number, and holds memory-only trace disclosure state keyed by material symbol — in `src/app/application/cost-materials/cost-materials.presenter.ts` (depends on T008)
- [ ] T016 Add presenter tests for a translated name, a locale miss carrying visible and programmatic untranslated disclosure, an unresolvable slot key and module symbol left raw, formatting that never alters a package number, and rebuilding presentation on a locale change with no domain reprojection, in `src/app/application/cost-materials/cost-materials.presenter.spec.ts` (depends on T015)
- [ ] T017 Implement `CostMaterialsAnnouncementCoordinator` comparing the prior announced semantic summary — retail qualification, Mercenary applicability and total qualification, and engineering requirement state — on matching settled revisions only, coalescing rapid settled revisions into one polite localized announcement and staying silent for initial content, unchanged results, locale-only re-presentation, pending contexts and discarded stale work, with unit tests for each case, in `src/app/application/cost-materials/cost-materials-announcement-coordinator.ts` (depends on T011)
- [ ] T018 Add the repository policy check asserting no file under `src/app/domain/cost-materials/`, `src/app/application/cost-materials/` or `src/app/features/build-workspace/cost-and-materials/` contains a price, rebuy, Merc Coin, roll, grade-loop or material-total arithmetic operator over a package value, imports the Almanac barrel instead of a leaf subpath, declares a recipe, material grade, fixed or Mercenary fdname table or game-text translation, reads `sourcePurchase` or a fitted captured `value`, or writes a derived cost, trace or disclosure value to storage, history, a URL, a build link or SLEF, in `scripts/check-interface-foundations.mjs`

**Checkpoint**: The snapshot contract, projection transaction, revision-coherent store, feature 003
adapter and presentation boundary exist; feature 003 can compile against a concrete Assembly
Requirements contract and user story work can begin.

---

## Phase 3: User Story 1 - Read costs (Priority: P1) 🎯 MVP

**Goal**: A Commander reads hull, fitted-module and rebuy credits exactly as the package returns
them, sees every unpriced module named with its exact slot while the affected totals are labelled
lower bounds, and — only when the build contains a package-recognized Mercenary article — reads each
per-slot Merc Coin price and the one package Merc Coin total in a region that never mixes with
credits.

**Independent Test**: Open fully priced, one-unpriced and all-unpriced builds and builds with no,
one and several Mercenary articles plus a fixture whose recognized article has no price, then run the
cost unit suite plus `pnpm run e2e -- cost-and-materials.spec.ts`: hull, modules and rebuy deep-equal
one `retailCredits()` result and no combined total appears, every unpriced entry appears in returned
order and opens its exact feature 002 slot, the Mercenary region and the `mercCoin` Status summary
are absent with no recognized entry and never show a zero total, the present total equals one
`mercCoinCost()` result, a missing entry price reads unavailable rather than free while the total is
a lower bound naming the affected slot, and no credit and Merc Coin figure is summed, converted or
compared.

### Tests for User Story 1

- [ ] T019 [P] [US1] Add retail projection tests for an exact fully priced result, one and several `unpriced` entries making modules and rebuy lower bounds while hull stays exact, the returned evidence order and cardinality preserved without sorting, hull and modules never added, the rebuy percentage never derived, an exact zero staying visible, and `sourcePurchase` and fitted captured `value` never filling an unpriced entry, with every expected number taken from the package result rather than a hand-computed fixture, in `src/app/domain/cost-materials/cost-materials-projector.retail.spec.ts`
- [ ] T020 [P] [US1] Add Mercenary projection tests for zero recognized entries returning `absent` even when `mercCoinCost()` is zero, recognition only from `preEngineeredVariant.acquisition === 'mercenary'` and never from a symbol, blueprint or nonzero total, one and several recognized entries with exact slot, module symbol, variant identity, purchase grade and current grade, a defined price exact and a missing optional price unavailable, the literal package total exact only when every entry is priced and otherwise a lower bound naming every missing entry, a later purchase-route grade retaining the original variant price, and clearing or replacing engineering returning to `absent` with no retained purchase history, in `src/app/domain/cost-materials/cost-materials-projector.mercenary.spec.ts`
- [ ] T021 [P] [US1] Add retail credits surface tests for three separately labelled independent facts, the absence of any combined total or derived rebuy percentage, lower-bound qualification associated with both modules and rebuy, the complete returned-order evidence list with exact slot and module identity and a per-entry feature 002 slot action, a raw slot key or symbol shown when package text is unavailable with its disclosure, and locale-formatted credits with an explicit translated unit label, in `src/app/features/build-workspace/cost-and-materials/retail-credits/retail-credits.component.spec.ts`
- [ ] T022 [P] [US1] Add Mercenary purchases surface tests for the whole region rendering only in the `present` state, each entry exposing visible package-recognized acquisition, module and variant, exact slot, purchase grade, current grade when it differs and either an exact price or an unavailable state, the literal package total with lower-bound qualification naming every affected slot, and the absence of `Mcr`, any exchange, comparison or favourable-value wording, any credit or material figure inside the region and any meaning carried by a glyph alone, in `src/app/features/build-workspace/cost-and-materials/mercenary-purchases/mercenary-purchases.component.spec.ts`
- [ ] T023 [P] [US1] Add cost detail container tests for the fixed semantic order retail → conditional Mercenary → materials, the no-active-build state rendering no empty cost cards, a pending or mismatched integration context showing no stale facts labelled current, and a projection failure showing one localized prompt while the active build stays intact, in `src/app/features/build-workspace/cost-and-materials/cost-and-materials-detail/cost-and-materials-detail.component.spec.ts`
- [ ] T024 [P] [US1] Extend `e2e/cost-and-materials.spec.ts` with the cost journey — a fully priced build, a build with one and then several unpriced modules, opening an exact unpriced slot in feature 002, a build with no Mercenary article, one and several recognized articles, a recognized article with no price, a later purchase-route grade, and clearing engineering back to no recognition — asserting each rendered figure against the captured package result and one coalesced polite announcement per settled change

### Implementation for User Story 1

- [ ] T025 [US1] Implement `projectRetailCredits(loadout)` calling `retailCredits()` exactly once, preserving the numeric `hull`, `modules` and `rebuy` and the returned-order `unpriced` entries, classifying hull as exact, classifying modules and rebuy as exact when `unpriced` is empty and as lower bounds associated with every returned entry otherwise, and never adding fields, deriving a percentage, sorting evidence or reading an individual module price to repair the result, in `src/app/domain/cost-materials/cost-materials-projector.ts` (depends on T009)
- [ ] T026 [US1] Implement `projectMercenary(fittedModules, loadout)` retaining only entries whose `preEngineeredVariant.acquisition` is `mercenary`, preserving exact slot, module symbol, variant identity, purchase grade, current grade and the optional variant `mercCoinCost`, returning `absent` without calling or presenting a total when no entry is recognized, otherwise calling `mercCoinCost()` exactly once and qualifying that literal number as a lower bound naming every missing-price entry, in `src/app/domain/cost-materials/cost-materials-projector.ts` (depends on T009)
- [ ] T027 [US1] Extend `CostMaterialsPresenter` with the retail and Mercenary presentation — slot and module names for every unpriced and Mercenary entry through the captured slot join and package helpers, separate credit and Merc Coin unit labels with no shared heading, group or total, and named locale formatters for both currencies — in `src/app/application/cost-materials/cost-materials.presenter.ts` (depends on T015, T025, T026)
- [ ] T028 [US1] Implement `RetailCreditsComponent` composing the shared section, fact-list and qualification primitives to render hull, fitted modules and rebuy as three independent facts with the lower-bound qualification programmatically associated with the two affected facts and the complete evidence list carrying exact-slot actions, in `src/app/features/build-workspace/cost-and-materials/retail-credits/retail-credits.component.ts` and its template and styles (depends on T027)
- [ ] T029 [US1] Implement `MercenaryPurchasesComponent` rendering the conditional region, its per-entry facts, its unavailable price state and the literal package total with lower-bound evidence, using only shared primitives, text-carried meaning and the localized Merc Coin unit label, in `src/app/features/build-workspace/cost-and-materials/mercenary-purchases/mercenary-purchases.component.ts` and its template and styles (depends on T027)
- [ ] T030 [US1] Implement `CostAndMaterialsDetailComponent` as the capability container reading one store snapshot per revision and composing retail credits then conditional Mercenary purchases in fixed semantic order, with the no-build, pending, mismatched-context and failure treatments and the `detail` target entry point that adds no route or URL fragment, in `src/app/features/build-workspace/cost-and-materials/cost-and-materials-detail/cost-and-materials-detail.component.ts` and its template and styles (depends on T011, T028, T029)
- [ ] T031 [US1] Emit the `retailCredits` and `mercCoin` qualified summary ids and the compact retail and Mercenary summary fields from `CostMaterialsAssemblyRequirementsAdapter`, preserving their semantic states and the unpriced evidence count and targets for feature 003's Assembly Requirements, in `src/app/application/cost-materials/assembly-requirements.adapter.ts` (depends on T013, T025, T026)
- [ ] T032 [P] [US1] Add the US1 message keys — the capability and section headings, hull, fitted modules and rebuy labels, the credit and Merc Coin unit patterns, the lower-bound and unavailable-price qualifications, the recognized-acquisition wording, purchase and current grade labels, the unpriced-evidence heading, the exact-slot action name and the no-build, pending and projection-failure prompts — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T033 [P] [US1] Add `RetailCreditsComponent`, `MercenaryPurchasesComponent` and `CostAndMaterialsDetailComponent` preview declarations for exact retail, one and all modules unpriced, Mercenary absent, present and missing-price, unresolvable game text, no active build, pending and failure at all five viewports with decimal-comma and expanded-label locale fixtures, in `src/app/ui/previews/preview-manifest.ts`
- [ ] T034 [US1] Add the US1 surfaces and the FR-001 through FR-006 ids with their package-equality, returned-evidence-order, currency-separation and Mercenary-applicability assertions to `e2e/coverage-ledger.ts`

**Checkpoint**: User Story 1 is independently functional — a Commander reads complete current
catalogue credits and applicable Merc Coin costs, and feature 003's Assembly Requirements shows the
same figures for the same revision.

---

## Phase 4: User Story 2 - Read engineering materials (Priority: P1)

**Goal**: A Commander reads one consolidated material list carrying package identity, localized or
canonically disclosed name, grade and quantity, traces every row back to the exact fitted engineering
selections that supplied it, sees purchase and fixed baselines stated as non-crafted rather than
free-looking zero rows, and sees a missing recipe named while the known rows stay visible as an
explicit lower bound.

**Independent Test**: Build fixtures with repeated ordinary blueprints at several grades, overlapping
materials, a separately applied effect, a baked effect, a removed effect, a Mercenary purchase
baseline, the same purchase route at a later grade, a fixed non-Mercenary reward, an injected `null`
cost, a genuine `[]` cost and an injected material-metadata miss, then run the materials unit suite
plus `pnpm run e2e -- cost-and-materials.spec.ts`: every consolidated row deep-equals the literal
`sumMaterials(...knownLists)` output in first-seen order, every row has at least one contributor and
repeated equal selections stay repeated, purchase and fixed baselines produce no recipe call and no
material row, a `null` cost never becomes `[]` while a real `[]` stays known empty, an incomplete
projection keeps known rows and names every missing source, and a metadata miss keeps the symbol,
quantity and trace while name and grade read unavailable.

### Tests for User Story 2

- [ ] T035 [P] [US2] Add committed-source classification tests for an ordinary blueprint calling `getBlueprintCost(fdname, level)`, a recognized Mercenary article at its purchase grade classified `mercenaryPurchaseNotCrafted` with no cost lookup, the same article above its purchase grade calling `getBlueprintCost(fdname, level, variant.grade)`, a recognized non-Mercenary variant classified `fixedNotCrafted`, a current effect equal to `variant.experimental` classified `fixedNotCrafted`, a current effect differing from it calling `getExperimentalEffectCost` exactly once, an absent or removed effect contributing no source, a helper `null` becoming an unavailable source that retains exact slot, module, kind, fdname and grade, and a helper `[]` remaining a known empty result, in `src/app/domain/cost-materials/engineering-requirements.classification.spec.ts`
- [ ] T036 [P] [US2] Add consolidation and trace tests for one `sumMaterials(...knownLists)` call preserving literal first-seen order, symbols and counts with no local reducer, sorting, deduplication or addition, a case-insensitive contributor join that retains each source item's package count and exact selection identity, every consolidated row having at least one contributor, repeated fitted selections remaining separate traces, the `none` state producing no fabricated zero rows, the `complete` state, and the `incomplete` state consolidating only known lists as a named lower bound, in `src/app/domain/cost-materials/engineering-requirements.consolidation.spec.ts`
- [ ] T037 [P] [US2] Add a cross-package regression test asserting the installed Almanac reports no ordinary stock route for `CargoRack_IncreasedCapacity`, `getBlueprintCost(..., 5)` returns `null`, the authored fixed variants stay package-identifiable, and the application neither special-cases the fdname, calls it free nor substitutes another recipe, in `src/app/domain/cost-materials/almanac-cost-contract.spec.ts`
- [ ] T038 [P] [US2] Add engineering materials surface tests for every consolidated row rendered in package order with symbol-aware name, textual package grade, locale-formatted quantity and a named trace control, no truncation or top-N cut, the `none` state stating that no ordinary craft requirement applies with optional non-crafted explanations, the `incomplete` state marking known rows a lower bound and listing every missing blueprint and effect source, a metadata gap retaining symbol, quantity and trace while name and grade read unavailable, and a canonical package name carrying the shared untranslated disclosure on a locale miss, in `src/app/features/build-workspace/cost-and-materials/engineering-materials/engineering-materials.component.spec.ts`
- [ ] T039 [P] [US2] Add material trace surface tests for a disclosure named by its material and exposing expanded state programmatically, an expanded trace listing every contributing source with localized module name, exact slot, blueprint or effect identity, selected or current grade where relevant and that source item's package count, a separate exact-slot action to feature 002, no derived share, percentage or allocation anywhere in the trace, and expansion mutating no build state, in `src/app/features/build-workspace/cost-and-materials/material-trace/material-trace.component.spec.ts`
- [ ] T040 [P] [US2] Extend `e2e/cost-and-materials.spec.ts` with the materials journey — repeated blueprints at several grades with overlapping materials, a separately applied effect, a baked effect, a removed effect, a Mercenary purchase baseline and a later purchase-route grade, a fixed reward, an injected missing recipe, a metadata miss, expanding and collapsing traces and opening an exact contributing slot — asserting consolidated values against the captured package result

### Implementation for User Story 2

- [ ] T041 [US2] Implement `extractEngineeringSources(fittedModules)` walking the captured fitted snapshots in package order, taking engineering identity only from `FittedModule.engineering` and fixed or purchase identity only from `FittedModule.preEngineeredVariant`, and emitting one `EngineeringSelectionSource` per committed selection with a snapshot-local stable `sourceId` built from the exact slot, kind and fdname, in `src/app/domain/cost-materials/engineering-requirements.ts` (depends on T007)
- [ ] T042 [US2] Implement `classifySourceCost` delegating to feature 002's accepted engineering-cost boundary in `src/app/domain/outfitting/engineering-cost.ts` and applying the seven contract rules in order — classifying the Mercenary purchase baseline before any blueprint lookup, using `baselineGrade` above it, treating fixed blueprints and baked effects as non-crafted, costing a differing current effect once, and preserving a helper `null` as unavailable and `[]` as known empty — without creating a second fdname or acquisition classifier, in `src/app/domain/cost-materials/engineering-requirements.ts` (depends on T041)
- [ ] T043 [US2] Implement `consolidateRequirements(sources)` passing every known source list to `sumMaterials(...)` exactly once, preserving the literal returned order, symbols and counts, and case-insensitively joining each consolidated symbol back to every matching retained source item to build its non-empty `contributors` trace with no derived total, share or allocation, in `src/app/domain/cost-materials/engineering-requirements.ts` (depends on T042)
- [ ] T044 [US2] Implement consolidated metadata resolution through `getMaterialBySymbol()` alone, recording a `MaterialMetadataGap` and marking name and grade unavailable while retaining the package symbol, quantity and trace when the record is absent, and never inferring identity, grade, category or line from a symbol, icon or colour, in `src/app/domain/cost-materials/engineering-requirements.ts` (depends on T043)
- [ ] T045 [US2] Implement the `EngineeringRequirementsProjection` state selection — `none` with its non-crafted sources when no crafted source exists, `complete` when every crafted cost is known, `incomplete` naming every missing source beside the known-list consolidation, and `failure` for an unexpected package or integration error with no stale figures relabelled current — and wire it into `projectCostAndMaterials`, in `src/app/domain/cost-materials/engineering-requirements.ts` and `src/app/domain/cost-materials/cost-materials-projector.ts` (depends on T044, T009)
- [ ] T046 [US2] Extend `CostMaterialsPresenter` with material presentation — `getMaterialName(symbol, activeLocale)` with canonical package text plus feature 011's visible and programmatic untranslated disclosure on `null`, textual grade and category text from the resolved package record, localized quantity formatting, and localized source-kind, non-crafted and missing-source wording — in `src/app/application/cost-materials/cost-materials.presenter.ts` (depends on T015, T045)
- [ ] T047 [US2] Implement `EngineeringMaterialsComponent` rendering every consolidated row as a labelled responsive list entry with name, textual grade, quantity and trace control, plus the `none`, `incomplete` and metadata-gap treatments, using shared section, fact, qualification and responsive-list primitives and no screen-local colours, sizes, spacing, radii, elevation or motion, in `src/app/features/build-workspace/cost-and-materials/engineering-materials/engineering-materials.component.ts` and its template and styles (depends on T046)
- [ ] T048 [US2] Implement `MaterialTraceComponent` as the row-owned disclosure listing every contributing fitted selection with its exact slot action, extending `src/app/ui/` with a row-to-many-sources disclosure primitive and previewing all of its states if no shared primitive fits, in `src/app/features/build-workspace/cost-and-materials/material-trace/material-trace.component.ts` and its template and styles (depends on T046)
- [ ] T049 [US2] Compose the engineering materials region after the conditional Mercenary region in `CostAndMaterialsDetailComponent`, keeping the full semantic order retail → Mercenary → materials at every width and reserving the available central or full width for the complete material list, in `src/app/features/build-workspace/cost-and-materials/cost-and-materials-detail/cost-and-materials-detail.component.ts` and its template and styles (depends on T030, T047, T048)
- [ ] T050 [US2] Emit the `materials` qualified summary id and the compact `none`, complete, incomplete and failure material state with its detail target from `CostMaterialsAssemblyRequirementsAdapter`, exposing no total material unit count, blueprint count or readiness judgement, in `src/app/application/cost-materials/assembly-requirements.adapter.ts` (depends on T031, T045)
- [ ] T051 [P] [US2] Add the US2 message keys — the materials heading, material name, grade and quantity labels, the trace control and its expanded-state name, the source-kind labels for blueprint and experimental effect, the non-crafted purchase and fixed-reward explanations, the incomplete lower-bound qualification, the missing blueprint and effect source wording, the metadata-unavailable wording and the untranslated-text disclosure — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T052 [P] [US2] Add `EngineeringMaterialsComponent` and `MaterialTraceComponent` preview declarations for complete, repeated-source, `none`, purchase-baseline-only, fixed-only, incomplete, metadata-gap, untranslated-name, trace-collapsed, trace-expanded, pending and failure states at all five viewports with long canonical material names and expanded-label locale fixtures, in `src/app/ui/previews/preview-manifest.ts`
- [ ] T053 [US2] Add the US2 surfaces and the FR-007 through FR-010 ids with their consolidation-order, traceability, non-crafted, missing-recipe and metadata assertions to `e2e/coverage-ledger.ts`

**Checkpoint**: Both stories are independently functional and the complete capability presents one
settled revision.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T054 Implement the responsive composition — fluid grouping of the retail and Mercenary regions above a full-width material list at roomy widths, at most two columns while full labels and evidence fit, chosen from available inline size rather than device-name branching, and one complete semantic single column in the order retail → Mercenary → materials at narrow widths, both landscape phone orientations, 200% text and 400% zoom with no truncated row, qualification or trace and no omitted action — in `src/app/features/build-workspace/cost-and-materials/cost-and-materials-detail/cost-and-materials-detail.component.ts` and its template and styles (depends on T049)
- [ ] T055 [P] Run the complete capability in Chromium and Firefox at desktop, tablet portrait and landscape and mobile portrait and landscape with an axe scan over every no-build, pending, failure, exact-retail, one-unpriced, all-unpriced, Mercenary absent, present and missing-price, materials `none`, complete, repeated, incomplete, metadata-gap, untranslated and trace-expanded state, in `e2e/cost-and-materials.spec.ts`
- [ ] T056 [P] Assert 200% text, actual 400% browser zoom, expanded translations, long canonical material and module names and RTL layout with no lost content, function, fact-to-qualification or row-to-trace association and no document horizontal scrolling, and that a wide material list scrolls only inside its own labelled container, in `e2e/cost-and-materials.spec.ts`
- [ ] T057 [P] Assert touch operation and shared target-size tokens for every trace disclosure, exact-slot action and capability navigation control with no overlap at mobile width, that no state, grade, acquisition or qualification meaning depends on colour, icon, title or position, that nothing essential depends on hover, and that `prefers-reduced-motion` changes only transitions and never content, state or announcement timing, in `e2e/cost-and-materials.spec.ts`
- [ ] T058 [P] Assert one coalesced polite announcement per settled revision whose retail qualification, Mercenary applicability or requirement state changed, silence for initial content, unchanged results, locale-only re-presentation, pending contexts, discarded stale projections and trace expansion, a single feature 002 announcement when an exact slot opens with no duplicate, and one prompt error treatment for a current-revision projection failure, in `e2e/cost-and-materials.spec.ts`
- [ ] T059 [P] Add the locale sweep asserting every owned heading, label, qualification, unit and accessible name comes from application messages, credits, Merc Coin, quantities and grades use active-locale named formatters, no raw message key, blank label or invented slot label appears, module, slot, variant, blueprint, effect and material names come from package helpers by exact identity with disclosed canonical fallback, and the bundled English fallback works offline, across every shipped locale and the pseudo-locales in `src/app/i18n/testing/pseudo-locales.ts`, in `e2e/cost-and-materials.spec.ts`
- [ ] T060 [P] Add the offline journey — load the workspace, go offline, open Cost and Materials, expand a material trace and open an exact slot with no cross-origin request and no capability degradation — and assert no cost snapshot, trace or disclosure value appears in local storage, browser history, a URL, a build link or a SLEF export, in `e2e/cost-and-materials.spec.ts`
- [ ] T061 [P] Add the contextual editor boundary journey asserting that changing blueprint, grade or effect drafts in feature 002's Engineer surface updates only contextual selection facts while committed detail, the Status summary, the active revision, storage and the URL are unchanged, that a successful Apply advances one revision and settles both committed surfaces to the same new snapshot, and that Cancel and no-op changes settle neither, in `e2e/cost-and-materials.spec.ts`
- [ ] T062 Add the in-page settled measurement under Chromium CDP `Emulation.setCPUThrottlingRate(4)` at the mobile viewport asserting at most 100 ms from a committed build revision to matching rendered detail and Status DOM carrying the same revision, that one projection performs no duplicate `retailCredits()`, `mercCoinCost()` or `sumMaterials()` call, that detail and Status hold the identical cached snapshot object, and that a locale switch renders new text without invoking the domain projector, in `e2e/cost-and-materials.spec.ts` (depends on T012)
- [ ] T063 [P] Write and run the versioned NVDA/Firefox desktop, TalkBack/Chromium mobile and tablet screen-reader protocols covering both user stories — region headings, the three retail facts with their lower-bound qualification and evidence, the conditional Mercenary entries and total, every material's quantity and all of its contributing fitted selections, the trace control name and expanded state, exact-slot actions and settled announcements — with result records in `e2e/manual/screen-reader.protocol.md` and `e2e/manual/results/`
- [ ] T064 Reconcile the coverage ledger with the feature 009 surfaces, exported components, preview declarations and Playwright project names, and make `scripts/check-interface-foundations.mjs` reject every shorter or unqualified conformance claim while accepting only "WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11" for this capability (depends on T034, T053)
- [ ] T065 Restore unit coverage to at least 80% statements, branches, functions and lines for `src/app/domain/cost-materials/`, `src/app/application/cost-materials/` and `src/app/features/build-workspace/cost-and-materials/` under the thresholds in `angular.json`
- [ ] T066 [P] Record the Cost and Materials capability, its reuse of feature 002's engineering-cost boundary, its feature 003 Assembly Requirements adapter, and the out-of-scope historical purchase values, currency conversion, combined credit totals and material-acquisition guidance in `AGENTS.md` and `README.md`
- [ ] T067 Execute every section of `specs/009-cost-and-materials/quickstart.md`, including the cargo-rack stop condition and the package-pin check, and fix each divergence
- [ ] T068 Run the `pnpm run check` pipeline declared in `package.json` and confirm formatting, strict compilation, policy checks, build, unit coverage, all ten Playwright projects and all axe scans pass with no skipped, focused or quarantined test

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: starts once the feature prerequisites in Delivery gates are available
- **Foundational (Phase 2)**: depends on Phase 1 and blocks both user stories; T008 also unblocks
  feature 003's concrete provider bundle, and T009's engineering delegation cannot land before
  feature 002 exports its cost boundary
- **User stories (Phases 3–4)**: both depend on Phase 2 and can then proceed in parallel or in the
  order US1 → US2
- **Polish (Phase 5)**: depends on both delivered stories

### User story dependencies

- **US1 (P1)**: depends only on Phase 2. It also delivers feature 003's `retailCredits` and
  `mercCoin` summary contributions, because the Status summary selects the same cached snapshot as
  the detail surface
- **US2 (P1)**: depends only on Phase 2. Its composition task T049 extends the capability container
  first created in T030, and its adapter task T050 extends the adapter surface first emitted in T031,
  so those two tasks follow US1 rather than running beside it

### Within each user story

- Tests are written first and must fail before implementation
- Domain projection before presenter, presenter before components, components before container
  composition and the Status adapter contribution
- Message keys and preview declarations ship with their component, never as follow-up work

### Parallel opportunities

- Phase 1: T002 and T003 run together
- Phase 2: T004, T005, T006 and T007 run together; T011 and T015 run together once T009 lands;
  T012, T014, T016 and T018 run together once their sources land
- Phase 3: T019–T024 run together; T032 and T033 run together
- Phase 4: T035–T040 run together; T051 and T052 run together
- Phase 5: T055–T061, T063 and T066 run together
- Across teams: once Phase 2 completes, one developer takes US1 while another takes US2's domain
  tasks T041–T046; only the container and adapter composition tasks need serializing

## Parallel Example: User Story 1

```bash
# Launch the failing tests together:
Task: "Retail projection tests in src/app/domain/cost-materials/cost-materials-projector.retail.spec.ts"
Task: "Mercenary projection tests in src/app/domain/cost-materials/cost-materials-projector.mercenary.spec.ts"
Task: "Retail credits surface tests in src/app/features/build-workspace/cost-and-materials/retail-credits/retail-credits.component.spec.ts"
Task: "Mercenary purchases surface tests in src/app/features/build-workspace/cost-and-materials/mercenary-purchases/mercenary-purchases.component.spec.ts"
Task: "Cost detail container tests in src/app/features/build-workspace/cost-and-materials/cost-and-materials-detail/cost-and-materials-detail.component.spec.ts"
Task: "Cost journey in e2e/cost-and-materials.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — this blocks everything and unblocks feature 003
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: hull, modules and rebuy deep-equal one `retailCredits()` result with no
   combined total, every unpriced entry stays named in returned order and reaches its exact slot, the
   Mercenary region and `mercCoin` summary are absent with no recognized article and never show a
   zero total, a missing entry price reads unavailable while the package total is a lower bound, and
   the capability passes axe in all ten projects
5. A Commander can read complete current catalogue costs and open the capability from Status at this
   point

### Incremental Delivery

1. Setup + Foundational → the semantic discriminants, the snapshot contract, the revision-coherent
   projection and store, the feature 003 adapter, the presentation boundary and the repository policy
2. Add US1 → catalogue retail credits, unpriced lower bounds with complete evidence, conditional
   Merc Coin purchases and the two Status summary contributions (MVP)
3. Add US2 → committed engineering source classification, package consolidation, per-row traces,
   non-crafted baselines, missing-recipe and metadata states and the materials Status contribution
4. Polish → the responsive, accessible, localized, offline, editor-boundary and performance gates and
   a green `pnpm run check`

### Constitutional Guardrails

- No task adds, subtracts, multiplies, divides, rounds, clamps, re-derives or reclassifies a package
  credit, rebuy, Merc Coin, recipe, roll or material figure; `sumMaterials()` is the only permitted
  consolidation and the package owns every cumulative grade climb
- No task creates a combined hull-plus-modules total, a locally derived rebuy percentage, a total
  material unit count, a blueprint or type aggregate, a trace share or percentage, a currency
  conversion or any favourable-value comparison between credits and Merc Coin
- No task reads or presents `ShipLoadout.sourcePurchase`, a fitted captured `value` or any other
  historical purchase provenance, and none of them ever fills an unpriced catalogue entry
- No task recognizes a Mercenary article from a symbol, blueprint, priority band, slot name or
  nonzero total instead of `preEngineeredVariant.acquisition`, and no task turns Mercenary absence
  into a zero total or a missing price into a free one
- No task recasts a package `null` as `[]` or a package `[]` as `null`, truncates or sorts the
  consolidated material list, hides known rows because one recipe is missing, or fabricates a
  material row for a fixed or purchase baseline
- No task maintains a local recipe, roll multiplier, material grade, fixed or Mercenary fdname table
  or private game-text translation, special-cases `CargoRack_IncreasedCapacity`, or infers a slot
  label, material grade or acquisition from an icon, colour or position
- No task adds a backend, account, telemetry, cross-origin runtime request or remote asset, a second
  `ShipLoadout`, an extra route or URL fragment, or a persisted cost, trace or disclosure value in
  storage, history, a build link or SLEF
- No task lowers the 80% coverage thresholds, drops a browser, viewport or orientation project, or
  skips a test to reach a green build

## Notes

- [P] tasks touch different files and have no incomplete dependency
- Every component task includes its unit test, its required-state preview declarations and its
  message keys; none of the three is a follow-up
- Commit after each task or logical group; stop at a checkpoint to validate a story independently
