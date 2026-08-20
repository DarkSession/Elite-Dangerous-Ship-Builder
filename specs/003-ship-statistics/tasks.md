---
description: 'Task list for Ship Statistics and Status'
---

# Tasks: Ship Statistics and Status

**Input**: Design documents from `/specs/003-ship-statistics/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [design/](./design/),
[quickstart.md](./quickstart.md)

**Tests**: Test tasks are included. Every contract in this feature names its own verification, the
specification gates delivery on SC-001–SC-006, and constitution principle VIII gates the build on
unit coverage, the ten-project Playwright matrix and automated accessibility scans.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested and
demonstrated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Every task names the exact file it changes

## Path Conventions

Single Angular workspace at the repository root: framework-agnostic contracts in
`src/app/domain/statistics/`, signal stores and coordinators in `src/app/application/statistics/`,
surfaces in `src/app/features/build-workspace/status/`, shared primitives and previews in
`src/app/ui/`, messages in `src/app/i18n/`, end-to-end suites in `e2e/`, repository policy checks in
`scripts/`. Unit tests live beside their source as `*.spec.ts`.

## Delivery gates

Feature 003 adds no calculation and owns no area result semantics. Two gates apply and are named on
the tasks they block:

- **Repository prerequisites**: feature 001 (atomic active `{ loadout, buildRevision }` boundary,
  local records), feature 002 (committed-edit revision advance, exact-slot
  actions) and feature 011 (tokens, components, localization, formatters,
  game-text fallback disclosure, announcement primitives, preview manifest, ten Playwright projects,
  axe helper).
- **Contract-first stage 3**: features 005–009 export their exact status projection types and
  adapters over the generic envelope this feature publishes in Phase 2. T014 and every task that
  consumes a concrete provider value is blocked until those exports exist. An absent provider is a
  delivery dependency — never a reason to calculate, clamp or fabricate a value here.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Characterize the package contract this feature depends on and create the source and test
locations before any contract lands.

- [ ] T001 Characterize the installed Almanac status contract this feature composes — `ShipLoadout.validation` issue shape, order and `LoadoutIssueParams` including string arrays; `getLoadoutIssueMessage`/`getCalculationIssueMessage` returning canonical English and `null` outside English; `standardLoadResult('maximum'|'unladen'|'laden')`; the throwing `jumpRangeSummary()` prerequisite; `powerBudget()` deployed/retracted field sets; complete zero capacities; and `mercCoinCost()` absent versus zero — using leaf subpath imports in `src/app/domain/statistics/almanac-status-contract.spec.ts`
- [ ] T002 [P] Create the feature source skeleton `src/app/domain/statistics/`, `src/app/application/statistics/` and the `src/app/features/build-workspace/status/` subdirectories `assembly-requirements/`, `headline-set/`, `issue-list/`, `status-capability/`, `status-rail/` and `viewing-conditions/` per plan.md
- [ ] T003 [P] Create the three feature suites `e2e/ship-status.spec.ts`, `e2e/status-fixed-defaults.spec.ts` and `e2e/viewing-conditions.spec.ts` importing the feature 011 axe and assertion helpers, and register their surfaces in `e2e/coverage-ledger.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Publish the shared contracts that features 005–009 implement against, then the pure
composition transaction and the signal stores every surface reads.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Shared contracts (contract-first stage 2)

- [ ] T004 [P] Define `LoadState`, `HalfPips`, `ViewingConditions`, `ViewingConditionsDraft`, `ConditionDraftError` and the exported defaults — `unladen`, `4/4/4` integer half-pips and `deployed` — in `src/app/domain/statistics/viewing-conditions.ts`
- [ ] T005 [P] Define `SlotTarget`, `DetailTarget` over the five accepted capability names (`powerAndHeat`, `defenceProfile`, `offenceProfile`, `mobilityAndJump`, `costAndMaterials`) and the `WorkspaceTarget` union in `src/app/domain/statistics/workspace-target.ts`
- [ ] T006 Define `StatusSummaryId`, the revision-stamped `StatusProviderRead<T, I>` ready/pending envelope, `StatusProvider<T, I>`, the generic `AssemblyRequirementsPort<T>` and the generic `StatusProviders<P, D, O, M, A>` bundle in `src/app/domain/statistics/status-provider.ts` (depends on T005)
- [ ] T007 Implement `validateQualifiedSummaryIds` — the 006/007/008/009 identity ownership table, per-owner uniqueness, rejection of duplicate or foreign identities and concatenation in fixed provider/summary order — in `src/app/domain/statistics/status-provider.ts` with unit tests for every owner, an absent Merc Coin summary and each rejection case in `src/app/domain/statistics/status-provider.spec.ts` (depends on T006)
- [ ] T008 Implement `parseViewingConditionsDraft`, `applyViewingConditionsDraft` and `defaultViewingConditions` — finite parse, `0..4` range, half-step multiples, exact six-pip total, unchanged-tuple detection and localized-error data — in `src/app/domain/statistics/viewing-conditions.ts` with boundary, fractional, parse, range, step, total and unchanged unit tests in `src/app/domain/statistics/viewing-conditions.spec.ts` (depends on T004)
- [ ] T009 Define `StatusRevisionContext`, `StructuralProjection`, `StatusProjection<P, D, O, M, A>`, `StatusProjectionState<P, D, O, M, A>` and `StatusFailureMessageKey` in `src/app/domain/statistics/status-projection.ts` (depends on T004, T005, T006)
- [ ] T010 Implement `projectStructural(loadout)` reading `loadout.validation` exactly once and returning the unmodified `LoadoutValidation` with a positionally aligned target list that is `{ kind: 'slot', slotKey }` only where `issue.slot` exists, in `src/app/domain/statistics/status-projection.ts` (depends on T009)
- [ ] T011 Implement the synchronous `composeStatusProjection(context, providers)` transaction — one immutable context to all five ports, explicit pending short-circuit, `projectionFailed` on a ready revision mismatch or invalid identity, `providerUnavailable` on an unregistered provider, derived `issueCount`/`qualifiedSummaryIds`/`qualifiedSummaryCount`, and a final captured-revision recheck before returning — in `src/app/domain/statistics/status-projection.ts` (depends on T007, T010)
- [ ] T012 Add the composition contract suite with provider spies proving one identical context reaches every port, validation is read once with issue reference/order/params retained, an explicit pending port prevents ready publication, a ready mismatch and a duplicate/foreign identity both produce `projectionFailed`, owner projections pass through unchanged, a retracted hardpoint selection does not alter returned sustained DPS, an absent Merc Coin summary is not counted and a newer revision discards an older outcome, in `src/app/domain/statistics/status-projection.spec.ts` (depends on T011)

### Stores and coordinators

- [ ] T013 Implement `ViewingConditionsStore` — settled tuple, `conditionsRevision` incremented only for a changed valid Apply, draft signals, Reset to defaults in one settled revision, and reset on new document, active-build replacement and no-build transitions but not on edits, undo/redo or save — in `src/app/application/statistics/viewing-conditions.store.ts` with unit tests for every reset and non-reset trigger (depends on T008)
- [ ] T014 Define the concrete five-provider bundle from the feature 005–009 exported adapter types and the `STATUS_PROVIDERS` injection token in `src/app/application/statistics/status.store.ts` (contract-first stage 3 gate: blocked until all five owner exports exist; depends on T006)
- [ ] T015 Implement `StatusStore` — capture feature 001's atomic `{ loadout, buildRevision }` and the settled conditions pair once, invoke `composeStatusProjection` with the injected bundle and publish `noBuild`, `pending`, `ready` or `failure` in one computed signal assignment — in `src/app/application/statistics/status.store.ts` with unit tests for each state and for rapid interleaved build and condition changes (depends on T011, T013, T014)
- [ ] T016 [P] Implement `StatusAnnouncementCoordinator` — `lastSettledCounts` initially `null` and silent, comparison of `{ issueCount, qualifiedSummaryCount }` on ready projections only, coalescing of rapid ready revisions into one `statusCountsChanged` message carrying both current counts, and silence for pending, failure, unchanged and discarded projections — in `src/app/application/statistics/status-announcement-coordinator.ts` with unit tests for initial, changed, unchanged, coalesced and stale cases (depends on T009)
- [ ] T017 [P] Implement `WorkspaceTargetCoordinator` — memory-only selected capability, detail activation for the five capability names, slot activation through feature 002's exact-slot action, narrow-surface return intent and no route, query or fragment change — in `src/app/application/statistics/workspace-target-coordinator.ts` with unit tests including duplicate symbols in different slots (depends on T005)
- [ ] T018 Add the serialization exclusion suite proving `BuildSnapshotV1`, `LocalRecordV1`, undo/redo history, preferences, route/query/fragment, compact link payloads and SLEF export contain no `ViewingConditions`, draft or `conditionsRevision` field, in `src/app/application/statistics/viewing-conditions.serialization.spec.ts` (depends on T013)
- [ ] T019 [P] Add the feature-owned framing message keys — Status heading, structural fact labels, generic severity labels, application failure keys `providerUnavailable` and `projectionFailed`, and the `statusCountsChanged` announcement with plural forms — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T020 Add the feature 003 boundary rules to `scripts/check-interface-foundations.mjs` — no area feature imports a `src/app/features/build-workspace/status/` component or `src/app/application/statistics/` store, feature 003 imports only owner contract leaves and never an area calculator, and no persistence, link or SLEF module references a viewing-condition type — with positive and negative fixtures in `scripts/check-interface-foundations.test.mjs`

**Checkpoint**: The shared envelope, conditions, targets, composition transaction and stores exist —
features 005–009 can implement their adapters and user story work can begin.

---

## Phase 3: User Story 1 - Understand build status (Priority: P1) 🎯 MVP

**Goal**: The complete Status capability states exactly what Almanac validation reports, lists every
validation issue once with its package code, severity, structured context and exact-slot action,
and announces settled count changes once — with no readiness, flyability or quality claim anywhere.

**Independent Test**: Load fixtures covering every reachable `validation.valid`/`complete`
combination, then run the statistics unit suite plus `pnpm run e2e -- ship-status.spec.ts
status-fixed-defaults.spec.ts`: the visible facts and ordered issue items match `loadout.validation` by
identity, a targeted issue reaches its exact slot in one interaction, an untargeted issue exposes no
action, an empty report states that none were reported, and package-defaulted fixed modules remain
ordinary fitted state with no separate status region.

### Tests for User Story 1

- [ ] T021 [P] [US1] Add structural-fact tests asserting independent `valid` and `complete` rendering for all four combinations, text-only meaning and no readiness wording in `src/app/features/build-workspace/status/status-capability/structural-facts.spec.ts`
- [ ] T022 [P] [US1] Add issue-list tests for package order, visible `code` and `severity` text, full `LoadoutIssueParams` including string arrays, localized diagnostic through the feature 011 adapter, canonical fallback with the untranslated-game-text disclosure on a `null` helper result, exact-slot action only when `issue.slot` exists and no action otherwise, in `src/app/features/build-workspace/status/issue-list/issue-list.spec.ts`
- [ ] T023 [P] [US1] Add regression tests proving no normalization/provenance region is rendered for package-defaulted fixed modules and issue counts remain package-owned, in `src/app/features/build-workspace/status/status-capability/status-capability.spec.ts`
- [ ] T024 [P] [US1] Add Status capability lifecycle tests for `noBuild` deferring to the existing workspace empty state, `pending` showing no stale figures under the current revision pair, `ready` composition order and `failure` using the feature 011 prompt-error pattern while build editing stays available, in `src/app/features/build-workspace/status/status-capability/status-capability.spec.ts`
- [ ] T025 [P] [US1] Add the structural journey — no active build, each validity/completeness combination, one issue with a slot and one without, single-location issue records at desktop, the none-reported statement and the absence of readiness wording — in `e2e/ship-status.spec.ts`
- [ ] T026 [P] [US1] Add the fixed-default journey — ingest a build with omitted fixed entries, open/save/duplicate/reload its record, edit a fixed mount, undo, export SLEF and copy a build link, asserting the package defaults remain ordinary state with no provenance UI — in `e2e/status-fixed-defaults.spec.ts`

### Implementation for User Story 1

- [ ] T027 [US1] Implement `StructuralFacts` as a definition list of the two independent package facts with tokenized, text-only severity meaning in `src/app/features/build-workspace/status/status-capability/structural-facts.ts` and its template and styles (depends on T009)
- [ ] T028 [US1] Implement `IssueList` rendering one ordered semantic list item per `LoadoutValidation.issues` entry with visible code and severity text, the feature 011 game-text adapter over `getLoadoutIssueMessage`, structured params, optional symbol and the exact-slot action from the aligned target, in `src/app/features/build-workspace/status/issue-list/issue-list.ts` and its template and styles (depends on T010, T017)
- [ ] T029 [P] [US1] Add status projection tests proving package-defaulted fixed modules appear only as ordinary fitted state and produce no normalization/provenance region in `src/app/domain/statistics/status-projector.spec.ts`
- [ ] T030 [US1] Implement `StatusCountAnnouncer` as a visually hidden polite region bound to `StatusAnnouncementCoordinator`, never `role="alert"`, in `src/app/features/build-workspace/status/status-capability/status-count-announcer.ts` (depends on T016)
- [ ] T031 [US1] Implement the `StatusCapability` container — heading and build identity, structural facts, ordered issues or the none-reported statement, and the four lifecycle states from `StatusStore` — in `src/app/features/build-workspace/status/status-capability/status-capability.ts` and its template and styles (depends on T015, T027, T028, T029, T030)
- [ ] T032 [US1] Register Status as a peer central workspace capability in the desktop selector and the narrow capability navigation, selected in memory by `WorkspaceTargetCoordinator` with no route change, in `src/app/features/build-workspace/build-workspace.ts` and its template (depends on T017, T031)
- [ ] T033 [P] [US1] Add the US1 message keys — issue kind and severity framing, structured-context labels, and the separate empty statements for issues and qualifications with their combined form — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T034 [P] [US1] Add `StructuralFacts`, `IssueList`, `StatusCountAnnouncer` and `StatusCapability` preview declarations covering every required state in the component matrix at desktop, tablet and mobile widths, including long params, string arrays, canonical fallback and RTL, in `src/app/ui/previews/preview-manifest.ts`
- [ ] T035 [US1] Add the US1 surfaces, FR-001, FR-003–FR-005, FR-013–FR-015, FR-021, FR-022 ids, journeys and axe flags to `e2e/coverage-ledger.ts`

**Checkpoint**: Structural status, complete issue reporting and settled announcements are
independently demonstrable.

---

## Phase 4: User Story 2 - Read current results (Priority: P1)

**Goal**: The seven headline slots show their owning provider's exact values, states, units and
relevant conditions for one build and condition revision, each reaching its detail capability in one
interaction, mirrored compactly by the persistent wide rail and updated without refresh.

**Independent Test**: With the five adapters registered, run the headline and rail unit suites plus
`pnpm run e2e -- ship-status.spec.ts`: each displayed value equals its owner projection for the same
revision pair, zero, incomplete, unavailable, lower-bound and infinite states stay distinguishable,
every card and rail summary opens its named capability in one interaction, and a committed edit
renders the matching revision within 100 ms under 4× CPU throttling.

### Tests for User Story 2

- [ ] T036 [P] [US2] Add metric card tests for exact positive and exact zero, owner incomplete and unavailable states, owner infinity, visible unit, localized meaning, only relevant conditions and the single named detail action, in `src/app/features/build-workspace/status/headline-set/metric-headline-card.spec.ts`
- [ ] T037 [P] [US2] Add power headline tests proving the selected deployed or retracted owner projection is copied unchanged, deployed-only fields are omitted under retracted rather than derived, and no local headroom, utilisation or budget verdict is produced, in `src/app/features/build-workspace/status/headline-set/power-headline.spec.ts`
- [ ] T038 [P] [US2] Add headline-set tests for the fixed seven-slot order and content — power draw and capacity, shield strength, armour, sustained DPS with its native firing condition, selected jump, top speed and unladen mass — in `src/app/features/build-workspace/status/headline-set/headline-set.spec.ts`
- [ ] T039 [P] [US2] Add rail tests for the information order, counts without issue records, the always-labelled open-Status action, omission of a compact summary whose direct action cannot stay usable, current-revision pending replacing stale values and the application failure state, in `src/app/features/build-workspace/status/status-rail/status-rail.spec.ts`
- [ ] T040 [P] [US2] Extend `e2e/ship-status.spec.ts` with the results journey — every headline value, unit, condition and state against its owner projection, one-interaction detail activation from both the rail and the capability, and live update on a committed edit without refresh
- [ ] T041 [P] [US2] Add the in-page revision-to-render measurement under Chromium CDP `Emulation.setCPUThrottlingRate(4)` at the mobile viewport, asserting 100 ms from committed build or condition revision to rendered DOM carrying the same pair and excluding transport time, in `e2e/ship-status.spec.ts`

### Implementation for User Story 2

- [ ] T042 [US2] Implement `MetricHeadlineCard` rendering an owner projection's meaning, locale-formatted value with visible unit or owner semantic state text, relevant conditions and one detail action, with no reclassification of owner state, in `src/app/features/build-workspace/status/headline-set/metric-headline-card.ts` and its template and styles (depends on T006, T017)
- [ ] T043 [P] [US2] Implement `PowerHeadline` copying feature 005's selected projection verbatim for the chosen hardpoint state in `src/app/features/build-workspace/status/headline-set/power-headline.ts` and its template and styles
- [ ] T044 [US2] Implement the `HeadlineSet` container placing power first and the six metric cards in the accepted order, labelling sustained DPS as the package firing value under either hardpoint selection, in `src/app/features/build-workspace/status/headline-set/headline-set.ts` and its template and styles (depends on T042, T043)
- [ ] T045 [US2] Compose the headline set and the qualification-bearing states into `StatusCapability` between structural evidence and requirements in `src/app/features/build-workspace/status/status-capability/status-capability.ts` and its template (depends on T031, T044)
- [ ] T046 [US2] Implement `StatusRail` as a complementary region named by the visible Build Status heading, rendering facts, counts, the compact power projection, six compact headline cards and the open-Status action from one ready projection, in `src/app/features/build-workspace/status/status-rail/status-rail.ts` and its template and styles (depends on T015, T017)
- [ ] T047 [US2] Mount the rail in the desktop workspace with its fluid width limits and its omission at tablet, narrow and zoomed widths where content parity moves to the complete capability, in `src/app/features/build-workspace/build-workspace.ts`, its template and styles (depends on T032, T046)
- [ ] T048 [P] [US2] Add the US2 message keys and unit patterns — headline meanings, MW, MJ, hull points, damage per second, light years, metres per second and tonnes, native firing condition, selected load and pip condition labels — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T049 [P] [US2] Add `PowerHeadline`, `MetricHeadlineCard`, `HeadlineSet` and `StatusRail` preview declarations covering deployed and retracted, exact zero, incomplete, unavailable, infinite, pending and failure states at all three widths in `src/app/ui/previews/preview-manifest.ts`
- [ ] T050 [US2] Add the US2 surfaces, FR-002, FR-006–FR-010, FR-012, FR-020 ids, detail-target assertions and the throttled timing check to `e2e/coverage-ledger.ts`

**Checkpoint**: The headline set and rail present one coherent revision and every result reaches its
owning capability.

---

## Phase 5: User Story 3 - Compare conditions (Priority: P2)

**Goal**: One shared viewing-conditions control selects load state, a valid six-pip half-step
allocation and hardpoint state through an explicit draft and Apply, recomputes the whole status in
one revision, and never leaves the browser session.

**Independent Test**: Run the conditions unit suite plus `pnpm run e2e -- viewing-conditions.spec.ts`:
defaults are unladen, 2/2/2 and deployed; every valid tuple applies in one revision; every invalid
draft retains the prior settled results with localized guidance; edits, undo/redo and save keep
conditions while reload and replacement reset them; and no storage, history, preference, URL, link or
SLEF payload contains viewing state.

### Tests for User Story 3

- [ ] T051 [P] [US3] Add control tests for visible group and field labels, the displayed six-pip total, `0`/`4` boundaries, half-step values, per-field and total error text, Apply disabled for an unchanged or invalid draft, Reset restoring all defaults and 44 CSS-pixel targets, in `src/app/features/build-workspace/status/viewing-conditions/viewing-conditions-control.spec.ts`
- [ ] T052 [P] [US3] Add the conditions journey — defaults, all three loads, boundary allocations, nonnumeric, out-of-range, non-half-step and wrong-total drafts, hardpoint toggling with power and sustained DPS behaviour, and pointer plus touch operation across the five layouts — in `e2e/viewing-conditions.spec.ts`
- [ ] T053 [P] [US3] Add the persistence-exclusion journey — edit, undo, save and reload the same build, then replace it through catalogue creation, named and working open, build link and SLEF import, asserting retention, reset and the absence of viewing state in `localStorage`, the URL, the copied link and the SLEF export — in `e2e/viewing-conditions.spec.ts`

### Implementation for User Story 3

- [ ] T054 [US3] Implement `ViewingConditionsControl` over feature 011 semantic controls — load selector, three labelled pip fields with the visible total, hardpoint selector, Apply and Reset — binding one draft and committing through `ViewingConditionsStore` so every instance shares the same state, in `src/app/features/build-workspace/status/viewing-conditions/viewing-conditions-control.ts` and its template and styles (depends on T013)
- [ ] T055 [US3] Render localized field, step, range and total guidance from `ConditionDraftError` without automatic redistribution, retaining the prior settled tuple on invalid Apply, in `src/app/features/build-workspace/status/viewing-conditions/viewing-conditions-control.ts` and its template (depends on T054)
- [ ] T056 [US3] Place the control before the structural facts inside `StatusCapability`, stacking full-width Apply and Reset at narrow widths and 400% zoom, in `src/app/features/build-workspace/status/status-capability/status-capability.ts`, its template and styles (depends on T045, T054)
- [ ] T057 [US3] Export the control for an owning detail capability to compose the conditions it uses, documenting the single-owner rule in `specs/003-ship-statistics/contracts/viewing-conditions.md` and the shared import path in `src/app/features/build-workspace/status/viewing-conditions/viewing-conditions-control.ts` (depends on T054)
- [ ] T058 [US3] Wire the reset triggers — new top-level document, catalogue creation, named or working open, build link ingress, SLEF import and no-build transition — to `ViewingConditionsStore` at the feature 001 active-build boundary in `src/app/application/statistics/viewing-conditions.store.ts` (depends on T013)
- [ ] T059 [US3] Pass settled conditions to providers as the immutable context only, dividing integer half-pips by two at the provider call boundary and never composing standard loads or guarding jump methods here, in `src/app/application/statistics/status.store.ts` (depends on T015, T058)
- [ ] T060 [P] [US3] Add the US3 message keys — load state names, SYS/ENG/WEP field labels, total label, hardpoint state names, Apply and Reset actions and every draft error — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T061 [P] [US3] Add `ViewingConditionsControl` preview declarations for defaults, a changed valid draft, each invalid case, disabled Apply, both hardpoint states, all three loads and expanded or RTL labels in `src/app/ui/previews/preview-manifest.ts`
- [ ] T062 [US3] Add the US3 surfaces and FR-016–FR-019 ids with their reset, retention and exclusion assertions to `e2e/coverage-ledger.ts`

**Checkpoint**: Viewing conditions are complete, ephemeral and shared by one owner.

---

## Phase 6: User Story 4 - Review requirements and act (Priority: P2)

**Goal**: Assembly requirements follow the headline results with retail credits, separate conditional
Merc Coin and engineering materials from feature 009; qualified and unavailable summaries stay
visible with their owner semantics; and every package-supplied slot or detail target is reachable in
one interaction on every layout.

**Independent Test**: With feature 009's adapter registered, run the assembly unit suite plus
`pnpm run e2e -- ship-status.spec.ts`: retail, Merc Coin and material figures equal that one
immutable projection, an absent Merc Coin summary is neither shown as zero nor counted, unpriced
modules and missing recipe costs qualify their summaries, and each summary and issue reaches its
target in one interaction at desktop, tablet and mobile.

### Tests for User Story 4

- [ ] T063 [P] [US4] Add assembly tests for retail credit fields, Merc Coin present versus owner `absent`, materials, unpriced entries, missing recipe costs, long material names and the single `costAndMaterials` detail action, in `src/app/features/build-workspace/status/assembly-requirements/assembly-requirements.spec.ts`
- [ ] T064 [P] [US4] Add qualification summary tests asserting the visible list is derived only from owner-supplied identities in fixed order, the count matches, an absent Merc Coin summary is excluded and the none-reported statement makes no readiness claim, in `src/app/features/build-workspace/status/status-capability/qualification-summary.spec.ts`
- [ ] T065 [P] [US4] Extend `src/app/application/statistics/status-announcement-coordinator.spec.ts` with qualification-count changes, simultaneous issue and qualification changes and coalesced rapid revisions carrying both current counts
- [ ] T066 [P] [US4] Extend `e2e/ship-status.spec.ts` with the requirements journey — assembly figures and states, Merc Coin absence, qualification list, one-interaction detail and exact-slot activation at desktop, tablet portrait and mobile portrait, narrow return to Status, and resolved issues and qualifications disappearing with the updated revision

### Implementation for User Story 4

- [ ] T067 [US4] Implement `AssemblyRequirements` rendering feature 009's immutable projection — retail hull, module and rebuy credits, conditional Merc Coin kept separate from credits, and engineering materials with their owner qualifications — in `src/app/features/build-workspace/status/assembly-requirements/assembly-requirements.ts` and its template and styles (depends on T014, T017)
- [ ] T068 [US4] Implement the qualification summary section listing `qualifiedSummaryIds` with their owning capability action, or the none-reported statement, in `src/app/features/build-workspace/status/status-capability/qualification-summary.ts` and its template and styles (depends on T007, T031)
- [ ] T069 [US4] Compose assembly requirements after the headline set and the qualification summary into `StatusCapability` in `src/app/features/build-workspace/status/status-capability/status-capability.ts` and its template (depends on T045, T067, T068)
- [ ] T070 [US4] Add the compact retail, conditional Merc Coin and material summaries with their direct detail actions to `StatusRail`, omitting any summary whose action cannot stay perceivable at the available width, in `src/app/features/build-workspace/status/status-rail/status-rail.ts` and its template (depends on T046, T067)
- [ ] T071 [US4] Implement narrow-surface targeting — active Status suppresses the duplicate quick dock and slot ledger, an exact-slot action switches to the slot surface and leaving it returns to Status — in `src/app/features/build-workspace/build-workspace.ts`, its template and styles (depends on T032, T017)
- [ ] T072 [US4] Add integration coverage proving successful, refused, stale, cancelled, no-op and undo outcomes never create fixed-default provenance or a status region (depends on T029)
- [ ] T073 [P] [US4] Add the US4 message keys — assembly section and field names, credit and Merc Coin separation, material framing, unpriced and missing-recipe qualification labels and the qualification summary names — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T074 [P] [US4] Add `AssemblyRequirements` and qualification summary preview declarations for present, absent Merc Coin, empty materials, unpriced, missing-recipe, pending and failure states with long names and currency separation in `src/app/ui/previews/preview-manifest.ts`
- [ ] T075 [US4] Add the US4 surfaces and FR-011, FR-012, FR-021 ids with their one-interaction and announcement assertions to `e2e/coverage-ledger.ts`

**Checkpoint**: All four stories are independently functional across the rail and the complete Status
capability.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T076 [P] Run the complete primary journey in Chromium and Firefox at desktop, tablet portrait and landscape and mobile portrait and landscape with an axe scan over every ready, empty, pending, failure, issue, qualified, unavailable, infinite and absent state, in `e2e/ship-status.spec.ts`
- [ ] T077 [P] Assert 200% text, actual 400% browser zoom, long canonical diagnostics, expanded translations and RTL layout with no lost content, function or document horizontal scrolling, in `e2e/ship-status.spec.ts` and `e2e/viewing-conditions.spec.ts`
- [ ] T078 [P] Assert `prefers-reduced-motion` changes no settlement timing, condition revision or state in `e2e/viewing-conditions.spec.ts`
- [ ] T079 [P] Assert touch operation and 44 CSS-pixel targets for every rail action, issue slot action, detail action and condition control on the four touch projects in `e2e/ship-status.spec.ts`
- [ ] T080 [P] Add the offline journey — load the workspace, go offline, revisit Status and repeat condition and target navigation with no cross-origin request and no capability degradation — in `e2e/ship-status.spec.ts`
- [ ] T081 [P] Write and run the versioned NVDA/Firefox desktop, TalkBack/Chromium mobile and tablet screen-reader protocols for headings, regions, condition controls, structural facts, issues, headlines, requirements and the single count announcement, with result records in `e2e/manual/screen-reader.protocol.md` and `e2e/manual/results/`
- [ ] T082 Reconcile the coverage ledger with the feature 003 surfaces, exported components, preview declarations and Playwright project names in `scripts/check-interface-foundations.mjs`. Register the SC-001–SC-006 ids against the named assertions that evidence them in `e2e/coverage-ledger.ts`. (depends on T035, T050, T062, T075)
- [ ] T083 Assert every conformance statement covering Status names the constitutional keyboard exclusions and that no owned string, unit or visual literal bypasses the token and message layers, in `scripts/check-interface-foundations.mjs`
- [ ] T084 Restore unit coverage to at least 80% statements, branches, functions and lines for `src/app/domain/statistics/`, `src/app/application/statistics/` and `src/app/features/build-workspace/status/` under the thresholds in `angular.json`
- [ ] T085 Execute every section of `specs/003-ship-statistics/quickstart.md` against the reference corpus and fix each divergence
- [ ] T086 Run `pnpm run check` and confirm formatting, strict compilation, policy checks, build, unit coverage, all ten Playwright projects and all axe scans pass with no skipped, focused or quarantined test

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories. T014 additionally waits on the feature 005–009 adapter exports
- **User Story 1 (Phase 3)**: Depends on Foundational
- **User Story 2 (Phase 4)**: Depends on Foundational and on the five registered adapters; T045 and T047 extend surfaces created in US1
- **User Story 3 (Phase 5)**: Depends on Foundational; T056 extends the capability created in US1
- **User Story 4 (Phase 6)**: Depends on Foundational and feature 009's adapter; T069–T071 extend surfaces created in US1 and US2
- **Polish (Phase 7)**: Depends on every story whose ledger entries, surfaces and messages it reconciles

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2. No dependency on another story and no dependency on a provider value.
- **US2 (P1)**: Starts after Phase 2. Independent of US1's issue work, but its cards and rail mount into the capability and workspace created in US1, so run US1 first in a single-developer sequence.
- **US3 (P2)**: Starts after Phase 2. Its store, control and exclusion tests are independent of US1, US2 and US4; only its placement task touches the US1 capability.
- **US4 (P2)**: Starts after Phase 2. Independent of US3. Its qualification summary and rail summaries extend US1 and US2 surfaces, and its announcement extension builds on T016.

### Within Each User Story

- Tests are written first and must fail before the implementation lands
- Contracts before stores, stores before components, components before the workspace that composes them
- Message keys, preview declarations and ledger entries close each story so the policy checker stays green

---

## Parallel Opportunities

- Phase 1: T002 and T003 run together after T001
- Phase 2: T004 and T005 run together; T008 runs alongside T006 and T007; T016, T017 and T019 run together after their contracts land
- Phase 3: T021–T026 run together; T029, T033 and T034 run together
- Phase 4: T036–T041 run together; T043, T048 and T049 run together
- Phase 5: T051–T053 run together; T060 and T061 run together
- Phase 6: T063–T066 run together; T073 and T074 run together
- Phase 7: T076–T081 run together
- Across teams: once Phase 2 completes, one developer takes US1 and one takes US3 immediately; US2 follows US1's capability shell and US4 follows US2's headline set

## Parallel Example: User Story 1

```bash
# Launch the failing tests together:
Task: "Structural facts unit tests in src/app/features/build-workspace/status/status-capability/structural-facts.spec.ts"
Task: "Issue list unit tests in src/app/features/build-workspace/status/issue-list/issue-list.spec.ts"
Task: "Fixed-default regression tests in src/app/features/build-workspace/status/status-capability/status-capability.spec.ts"
Task: "Capability lifecycle tests in src/app/features/build-workspace/status/status-capability/status-capability.spec.ts"
Task: "Structural journey in e2e/ship-status.spec.ts"
Task: "Fixed-default journey in e2e/status-fixed-defaults.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — this blocks everything and unblocks features 005–009
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: structural facts, ordered issues and the single settled
   announcement match `loadout.validation` by identity and pass axe in all ten projects
5. A Commander can understand exactly what the package reports about the build at this point

### Incremental Delivery

1. Setup + Foundational → conditions, targets, the provider envelope, composition and the stores
2. Add US1 → complete, honest build status (MVP)
3. Add US2 → the seven headline results, the wide rail and one-interaction detail navigation
4. Add US3 → load, pip and hardpoint viewing conditions that never persist
5. Add US4 → assembly requirements, qualification summaries and complete targeting on every layout
6. Polish → the responsive, accessible, offline, screen-reader and performance gates and a green
   `pnpm run check`

### Constitutional Guardrails

- No task calculates, clamps, re-derives, rounds or reclassifies a package or provider result; a
  missing adapter waits on its owning feature and never authorizes a local fallback
- No task adds a backend, account, telemetry, cross-origin runtime request, private game-text
  translation, second loadout, extra route or persisted viewing state
- No task presents structural validity as flyability, readiness, quality or optimality, converts an
  absent Merc Coin summary into zero, or replaces sustained DPS under a retracted selection
- No task lowers the 80% coverage thresholds, drops a browser, viewport or orientation project, or
  skips a test to reach a green build

## Notes

- [P] tasks touch different files and have no incomplete dependency
- Every component task includes its unit test, its required-state preview declarations and its
  message keys; none of the three is a follow-up
- Commit after each task or logical group; stop at a checkpoint to validate a story independently
