---
description: 'Task list for Ship Selection and Build Loading'
---

# Tasks: Ship Selection and Build Loading

**Input**: Design documents from `/specs/001-ship-selection-and-loading/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [design/](./design/),
[quickstart.md](./quickstart.md)

**Upstream features**: Feature [011](../011-interface-foundations/tasks.md) supplies the token set,
`AppShell`, localization runtime, preview manifest and the ten-project Playwright/axe harness. Feature
[004](../004-slef/spec.md) supplies the SLEF export action reached from link refusal. Feature 001
defines and tests both seams but cannot be declared complete until both integrations are present.

**Tests**: Test tasks are included. Constitution principle VIII gates the build on 80% unit coverage,
the dual-engine multi-viewport Playwright matrix and automated accessibility scans, and the
specification's success criteria are stated as verifiable outcomes.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested and
demonstrated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Every task names the exact file it changes

## Path Conventions

Single Angular workspace at the repository root: product source in `src/app/` split into `domain/`,
`application/`, `platform/`, `ui/` and `features/`; static assets in `public/`; end-to-end suite in
`e2e/`; build tooling in `scripts/`. Unit tests live beside their source as `*.spec.ts`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Asset delivery, offline caching, owned key space and tooling entry points that the
feature's source depends on.

- [ ] T001 Add an `assets` entry copying `node_modules/@elite-dangerous-almanac/core/assets/ships/**/illustration.svg` to the same-origin output path `assets/ships/` in the build target options in `angular.json`
- [ ] T002 [P] Create `ngsw-config.json` with an eager app-shell/bundled-message asset group and a lazy `assets/ships/**` performance cache group, and reference it from the production build configuration in `angular.json`
- [ ] T003 Register `provideServiceWorker('ngsw-worker.js', { enabled: isDevMode() === false, registrationStrategy: 'registerWhenStable:30000' })` in `src/app/app.config.ts` (depends on T002)
- [ ] T004 [P] Add the `codec:capacity` script invoking `node scripts/build-link-codec-capacity.mjs` and include it in the `check` pipeline in `package.json`
- [ ] T005 [P] Declare the owned key space constants `EDSB_RECORD_KEY_PREFIX = 'edsb:record:'`, `EDSB_TAB_KEY = 'edsb:tab'` and `EDSB_BROADCAST_CHANNEL = 'edsb.persistence.v1'` with the `edsb:named:<recordId>` lock-name builder in `src/app/platform/storage/storage-keys.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Route contracts, injected browser ports, the lossless snapshot, the candidate-first
replacement coordinator and the shared dialog primitives that all three stories build on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Routes and workspace shell

- [ ] T006 Define the `/` replace-redirect to `/ships`, the lazy `/ships`, `/ships/:symbol`, `/build` and `/builds` route records with their localized titles in `src/app/app.routes.ts`
- [ ] T007 Implement the minimal workspace route shell composing feature 011's `AppShell`, one `h1`, the active hull/provenance summary and the capability outlet in `src/app/features/build-workspace/build-workspace.page.ts`, `.html` and `.scss` (depends on T006)
- [ ] T008 [P] Add the `routes-and-ui` navigation entry points (saved builds, feature 004 import, feature 012 help) to the shared shell usage in `src/app/features/shared/app-navigation.ts`

### Browser and storage ports

- [ ] T009 [P] Define the `WebStoragePort` interface and `LOCAL_STORAGE_PORT`/`SESSION_STORAGE_PORT` injection tokens covering storage-object acquisition, key enumeration, `getItem`, `setItem` and `removeItem` in `src/app/platform/storage/web-storage.port.ts`
- [ ] T010 Implement the `WebStoragePort` adapters with a total exception boundary distinguishing access-blocked, quota-exceeded and generic write failures in `src/app/platform/storage/web-storage.adapter.ts`, with unit tests for `SecurityError`, `QuotaExceededError` and enumeration of only owned keys (depends on T005, T009)
- [ ] T011 [P] Define and implement the history/location port exposing current fragment reads, `history.replaceState` fragment replacement and a `hashchange` stream in `src/app/platform/browser/history-location.port.ts` and `src/app/platform/browser/history-location.adapter.ts` with unit tests
- [ ] T012 [P] Define and implement the BroadcastChannel port over `EDSB_BROADCAST_CHANNEL` with a no-op fallback when the API is absent in `src/app/platform/browser/broadcast-channel.port.ts` and `src/app/platform/browser/broadcast-channel.adapter.ts` with unit tests
- [ ] T013 [P] Define and implement the Web Locks port exposing `request(name, { mode: 'exclusive' }, fn)` and an explicit `unavailable` capability signal in `src/app/platform/browser/web-locks.port.ts` and `src/app/platform/browser/web-locks.adapter.ts` with unit tests
- [ ] T014 [P] Implement the page-lifecycle adapter emitting `pagehide` and `visibilitychange`-to-hidden flush signals in `src/app/platform/browser/page-lifecycle.adapter.ts` with unit tests
- [ ] T015 [P] Implement the connectivity adapter emitting browser `online` transitions for artwork retry in `src/app/platform/browser/connectivity.adapter.ts` with unit tests
- [ ] T016 [P] Implement the base-href-safe hull artwork path builder producing `assets/ships/<exact package symbol>/illustration.svg` in `src/app/platform/assets/hull-artwork-path.ts` with unit tests covering deployment sub-paths and exact symbol casing
- [ ] T017 [P] Implement the crypto-backed UUID factory port used for record, revision and page-nonce identities in `src/app/platform/browser/uuid.port.ts` and `src/app/platform/browser/uuid.adapter.ts` with unit tests

### Lossless snapshot and normalization domain

- [ ] T018 [P] Define the `BuildSnapshotV1`, `SnapshotModuleV1`, `PreEngineeredIdentityV1` and `EngineeringSnapshotV1` types with their literal discriminators in `src/app/domain/build/build-snapshot.ts`
- [ ] T019 Implement `toBuildSnapshotV1(loadout)` reading hull symbol, nullable ship name/ident and per-slot module symbol, absent-vs-false `enabled`, nullable zero-based `priority`, `FittedModule.preEngineeredVariant` identity tuple and ordinary engineering from `ShipLoadout` getters in `src/app/domain/build/build-snapshot.serializer.ts` with unit tests asserting no derived, calculated or lowercased field is emitted (depends on T018)
- [ ] T020 Implement `parseBuildSnapshotV1(value: unknown)` validating every discriminant, scalar, bound and case-insensitive slot uniqueness as untrusted input in `src/app/domain/build/build-snapshot.parser.ts` with unit tests for malformed, duplicate-slot and out-of-range fixtures (depends on T018)
- [ ] T021 Implement `reconstructFromSnapshot(snapshot)` calling `ShipLoadout.fromLoadout()` and the package pre-engineered helpers, refusing an unknown hull, reading `ShipLoadout.importOutcomes` for the package unknown-module empty/default results, then calling `repairFixedMount(slotKey)` for every armour, core-internal and cargo-hatch mount the snapshot left empty and retaining a `defaultUnavailable` result as an incomplete build, in `src/app/domain/build/build-snapshot.reconstructor.ts` with unit tests covering `emptied`, `defaulted`, source-empty `repaired`, `defaultUnavailable` and `refused` outcomes (depends on T020)
- [ ] T022 [P] Define `IngressIdentityNormalisationOutcome` and the mapper from the package `LoadoutImportOutcome` entries and `FixedMountRepairResult` values to `{ slotKey, sourceIdentity, action, replacementIdentity }`, where `action` covers `emptied`, `defaulted`, `repaired` and `defaultUnavailable`, in `src/app/domain/build/ingress-normalisation.ts` with unit tests asserting the collection is never attached to a snapshot
- [ ] T023 [P] Implement the modelled-state `baselineFingerprint` derived only from a serialized snapshot, plus the `dirty` predicate, in `src/app/domain/build/replacement-policy.ts` with unit tests covering new-unnamed, equal-to-baseline and diverged states

### Active build and replacement coordination

- [ ] T024 [P] Define `ActiveBuildState`, `BuildProvenance`, `PersistenceStatus` and `LinkPublicationState` as application models in `src/app/application/active-build/active-build.models.ts`
- [ ] T025 Implement the signal `ActiveBuildStore` owning the single live `ShipLoadout`, provenance, working record id, named source baseline, dirty state, persistence status, link state and transient normalisation notices in `src/app/application/active-build/active-build.store.ts` with unit tests (depends on T023, T024)
- [ ] T026 Implement the shared `ReplacementCoordinator` executing construct-candidate → validate → confirm-if-dirty → commit-once, with an async request token that discards a late candidate, in `src/app/application/active-build/replacement-coordinator.ts` with unit tests proving failure and cancel never mutate active state (depends on T025)
- [ ] T027 Define the persistence sink and SLEF-fallback seam interfaces the coordinator publishes to, so stock creation, record open and link load share one commit path, in `src/app/application/active-build/commit-sinks.port.ts` (depends on T026)

### Shared UI primitives added by this feature

- [ ] T028 [P] Implement the `UnavailableValue` component rendering the localized unavailable state distinctly from `0` in `src/app/ui/value/unavailable-value.ts` with its preview declaration
- [ ] T029 [P] Implement `ConfirmDialog` with associated title/description, named confirm/cancel actions, focus management and inert background in `src/app/ui/dialog/confirm-dialog.ts` with unit tests and previews
- [ ] T030 [P] Implement the three-choice `ChoiceDialog` whose choices each carry visible text explaining which version survives in `src/app/ui/dialog/choice-dialog.ts` with unit tests and previews
- [ ] T031 Register the feature 001 message namespaces (`catalogue`, `hullDetail`, `workspace`, `library`, `link`) with their English fallback seeds in `src/app/i18n/locales/en.json`

**Checkpoint**: Routes resolve, every browser API is injected behind a port, a build can be committed
candidate-first, and shared dialogs exist. User story work can begin.

---

## Phase 3: User Story 1 - Create a stock build (Priority: P1) 🎯 MVP

**Goal**: A Commander browses the Almanac hull catalogue with search, filters and bidirectional
sorting, inspects authoritative hull facts and artwork, and explicitly creates a package default
build without ever losing unsaved work.

**Independent Test**: With storage and links out of scope, open `/ships`, constrain and sort the
catalogue, open `/ships/:symbol`, return with session state intact, and create a stock build for a
known symbol — verifying an unknown symbol errors without creating anything and that a replacement
of unsaved work requires confirmation.

### Domain

- [ ] T032 [P] [US1] Implement the `HullCatalogueEntry` projection over package `SHIPS` with `symbol`, `sourceOrdinal`, name, manufacturer, size, hardpoints, `retailPrice`, `slots` from `enumerateSlots(getShipSlots(symbol))`, `artworkPath` and `defaultAvailable` from `getDefaultLoadout(symbol) !== null` in `src/app/domain/catalogue/hull-catalogue.ts` with unit tests asserting 48 unique entries and missing distinct from zero
- [ ] T033 [P] [US1] Implement the FR-004 `detailFacts` map — manufacturer, size, minimum/four-pip speed and boost, base shield and armour, hull mass, hardness, mass-lock factor, crew seats, heat capacity and dissipation, reserve fuel, min/four-pip pitch, roll and yaw, hull-only and retail cost — with each entry carrying its package-documented unit or explicit rating-without-unit marker in `src/app/domain/catalogue/hull-facts.ts` with unit tests
- [ ] T034 [US1] Implement `CatalogueQuery` filtering (text over displayed localized values, manufacturer, size, hardpoint class, inclusive price interval with open bounds) in `src/app/domain/catalogue/catalogue-query.ts` with unit tests (depends on T032)
- [ ] T035 [US1] Implement bidirectional sorting by name, manufacturer, semantic small/medium/large size, huge-to-small hardpoint tuple and retail price using `Intl.Collator`, missing-last in both directions and `sourceOrdinal` as the final stable tie-breaker in `src/app/domain/catalogue/catalogue-sort.ts` with unit tests for equal-value ties, missing values and zero (depends on T032)
- [ ] T036 [US1] Implement the active-constraint description and match-count derivation in `src/app/domain/catalogue/catalogue-constraints.ts` with unit tests (depends on T034, T035)

### Application

- [ ] T037 [US1] Implement the signal `CatalogueSessionStore` holding query, facets, sort and `resultAnchor` with a versioned `sessionStorage` cache, and no build, record, query-parameter or fragment write, in `src/app/application/catalogue/catalogue-session.store.ts` with unit tests (depends on T009, T036)
- [ ] T038 [P] [US1] Implement the artwork coordinator exposing loading/available/temporarily-unavailable state and retrying a failed uncached request on the connectivity port's `online` transition without a reload in `src/app/application/catalogue/artwork.coordinator.ts` with unit tests (depends on T015, T016)
- [ ] T039 [US1] Implement the catalogue page facade exposing immutable localized view models and the change-search/facet/sort and open-hull intents in `src/app/application/catalogue/catalogue.facade.ts` with unit tests (depends on T037)
- [ ] T040 [US1] Implement the hull detail facade resolving the route symbol through `getShipBySymbol`, exposing populated/unknown-symbol/default-unavailable states and the back-to-catalogue intent in `src/app/application/catalogue/hull-detail.facade.ts` with unit tests (depends on T032, T033)
- [ ] T041 [US1] Implement the stock creation transaction — resolve symbol, confirm `getDefaultLoadout(symbol)`, construct `ShipLoadout.default(symbol)` as a detached candidate, read package validation and normalization disclosure, then hand the candidate to `ReplacementCoordinator` — in `src/app/application/active-build/stock-build.creator.ts` with unit tests proving no image state participates and a package factory failure leaves route and build unchanged (depends on T026, T040)

### Shared components

- [ ] T042 [P] [US1] Implement `CollectionToolbar` with prominent search, segmented size choices, manufacturer/hardpoint/price facets, named bidirectional sort control, removable active constraints and textual match count in `src/app/ui/catalogue/collection-toolbar.ts` with unit tests and default/constrained/no-match previews
- [ ] T043 [P] [US1] Implement `ResponsiveCatalogueView` rendering a real table with named bidirectional sort-button headers at wide widths and semantic stacked definition-list cards at narrow widths, owning its own internal overflow, in `src/app/ui/catalogue/responsive-catalogue-view.ts` with unit tests and previews for both variants
- [ ] T044 [P] [US1] Implement `HullSummaryCard` exposing textual and programmatic selected state alongside the amber marker in `src/app/ui/catalogue/hull-summary-card.ts` with unit tests and previews
- [ ] T045 [P] [US1] Implement `FactList` rendering label/value/unit definition semantics with `UnavailableValue` fallback in `src/app/ui/hull/fact-list.ts` with unit tests and previews (depends on T028)
- [ ] T046 [P] [US1] Implement `HullArtwork` with a reserved 3:2 area, text equivalent, and loading/temporarily-unavailable text status that never disables an action in `src/app/ui/hull/hull-artwork.ts` with unit tests and previews
- [ ] T047 [P] [US1] Implement `SlotLayout` grouping package-enumerated slots semantically by armour, core, hardpoint, utility, optional and cargo hatch with their game keys, sizes and restrictions in `src/app/ui/hull/slot-layout.ts` with unit tests and previews

### Routes

- [ ] T048 [US1] Implement the catalogue route composing `AppShell`, the "Shipyard" heading, package hull count, `CollectionToolbar`, `ResponsiveCatalogueView`, no-match `EmptyState` and unavailable-fact `InlineNotice`, with the match count preceding results and announced through one polite live region, in `src/app/features/ship-catalogue/ship-catalogue.page.ts`, `.html` and `.scss` (depends on T039, T042, T043, T044)
- [ ] T049 [US1] Implement the hull detail route as a wide inspector beside the manifest and a narrow full-screen layer with a named back action, rendering the "Hull specifications" `FactList`, `SlotLayout`, `HullArtwork` and the creation `ActionButton` present only when a package default exists, in `src/app/features/hull-detail/hull-detail.page.ts`, `.html` and `.scss` (depends on T040, T045, T046, T047)
- [ ] T050 [US1] Implement the unknown-symbol error state with a named catalogue-return action, no guessed facts and no creation action in `src/app/features/hull-detail/hull-detail-unknown-symbol.ts` with unit tests (depends on T049)
- [ ] T051 [US1] Restore catalogue constraints, order and the anchored result offset after detail back navigation once cards have stabilized in `src/app/features/ship-catalogue/catalogue-anchor.restorer.ts` with unit tests (depends on T037, T048)
- [ ] T052 [US1] Add the catalogue, hull-detail, unavailable-fact, unknown-symbol and replacement-confirmation message keys to `src/app/i18n/locales/en.json` (depends on T031)

### Verification

- [ ] T053 [US1] Add the catalogue journey suite covering search, every facet, both directions of every sort field, stable ties, missing-versus-zero, no-match, session restoration and the absence of catalogue state from route query, fragment and storage in `e2e/ship-catalogue.spec.ts`
- [ ] T054 [US1] Add the hull-detail and creation journey suite covering every FR-004 fact with units, aborted artwork, unknown symbol, default-unavailable, cancel-then-confirm replacement and the resulting exact `ShipLoadout.default(symbol)` state, with axe scans of each state across all ten projects, in `e2e/hull-detail.spec.ts`

**Checkpoint**: A Commander can find, inspect and create any package hull build. User Story 1 is
independently demonstrable.

---

## Phase 4: User Story 2 - Resume local work (Priority: P1)

**Goal**: The tab's working build survives reload, named and working records can be listed, opened,
named, renamed, duplicated and deleted, concurrent tabs never silently lose a version, and every
storage failure leaves the build usable.

**Independent Test**: Edit a build and reload to see it restored; create, name, rename, duplicate and
delete records in `/builds`; drive two pages in one browser context into a real named conflict and
exercise overwrite, keep both and cancel; block storage and exceed quota and confirm editing
continues.

### Record domain

- [ ] T055 [P] [US2] Define `LocalRecordV1`, `FixedMountNormalisationProvenance` and the `working`/`named` kinds with their literal `format`/`version` discriminators in `src/app/domain/build/stored-build.ts`
- [ ] T056 [US2] Implement the strict `LocalRecordV1` decoder validating format, version, `id`-equals-key-suffix, kind, revision, instants, nullable name/note, `hullSymbol`-equals-`build.shipSymbol` and the exact package validation booleans in `src/app/domain/build/stored-build.parser.ts` with unit tests for malformed, mismatched-id and foreign-value fixtures (depends on T020, T055)
- [ ] T057 [US2] Implement the frozen decoder and sequential-migration registry producing a canonical intermediate model, with version 1 as the first published version and no fictional version 0, in `src/app/domain/build/record-migrations.ts` with unit tests (depends on T056)
- [ ] T058 [P] [US2] Add frozen immutable round-trip fixtures for every published record version under `src/app/domain/build/fixtures/` including unsupported-newer, malformed and unknown-identity cases
- [ ] T059 [US2] Implement the storage serializer allowlist emitting only `LocalRecordV1` envelope metadata plus `BuildSnapshotV1`, with unit tests proving calculated values, catalogue facts and prices cannot be serialized, in `src/app/domain/build/stored-build.serializer.ts` (depends on T019, T055)

### Storage repositories

- [ ] T060 [US2] Implement the `LocalRecordRepository` performing serialize-then-single-`setItem` atomic writes, owned-key enumeration with independent per-record validation, no global index, and delete via one `removeItem`, in `src/app/platform/storage/local-record.repository.ts` with unit tests covering failed writes retaining prior bytes (depends on T010, T056, T059)
- [ ] T061 [US2] Implement migration-on-open that replaces a record's own key only after decode, migration, package reconstruction, normalization and latest-version serialization all succeed, leaving original bytes authoritative on persistence failure, in `src/app/platform/storage/record-migration.service.ts` with unit tests (depends on T057, T060)
- [ ] T062 [P] [US2] Implement the versioned `TabDescriptorV1` repository over `edsb:tab` in `src/app/platform/storage/tab-descriptor.repository.ts` with unit tests for absent, malformed and unsupported-version descriptors (depends on T010)

### Working ownership, autosave and retention

- [ ] T063 [US2] Implement the tab ownership coordinator broadcasting a `{ workingRecordId, pageNonce }` claim and forking a collided live id into a new record before either page next autosaves in `src/app/application/build-library/tab-ownership.coordinator.ts` with unit tests (depends on T012, T017, T062)
- [ ] T064 [US2] Implement coalesced autosave to the tab working key with best-effort `pagehide`/visibility-hidden flush and a `record-deleted-externally` pause requiring explicit resume in `src/app/application/build-library/autosave.service.ts` with unit tests (depends on T014, T060, T063)
- [ ] T065 [US2] Implement the 20-record working retention rule where existing records always update, record 21 performs no write and no deletion, and named records are excluded from the count, in `src/app/application/build-library/retention.service.ts` with unit tests asserting no age, count, LRU or tab-closure eviction path exists (depends on T060)
- [ ] T066 [US2] Implement fixed-mount normalisation provenance carry-through — autosave and named copy retain entries, a successful Commander edit to the exact slot clears one before the next write, and undo does not recreate it — in `src/app/application/build-library/fixed-mount-provenance.service.ts` with unit tests (depends on T055, T064)

### Named operations and conflicts

- [ ] T067 [US2] Implement named save, rename and delete under `navigator.locks.request('edsb:named:<recordId>', { mode: 'exclusive' })` with an expected-`revisionId` precondition and a fresh revision UUID per successful write in `src/app/application/build-library/named-record.service.ts` with unit tests (depends on T013, T017, T060)
- [ ] T068 [US2] Implement the `SaveConflict` model and the overwrite, keep-both and cancel transitions, releasing the lock before the dialog is shown, re-locking and re-checking on overwrite, and refreshing the conflict when a third revision appeared, in `src/app/application/build-library/save-conflict.service.ts` with unit tests (depends on T067)
- [ ] T069 [US2] Disable unsafe in-place named overwrite while keeping keep-both, cancel and the tab working copy available when the Web Locks port reports unavailable, in `src/app/application/build-library/named-record.service.ts` with unit tests (depends on T067)
- [ ] T070 [US2] Implement `storage`-event and BroadcastChannel invalidation that always re-reads authoritative storage rather than trusting a cached listing or baseline in `src/app/application/build-library/record-invalidation.service.ts` with unit tests (depends on T012, T060)
- [ ] T071 [US2] Implement duplicate, keep-both and name-a-working-record operations creating fresh record and revision UUIDs while preserving the source record and its validation snapshot in `src/app/application/build-library/record-duplication.service.ts` with unit tests (depends on T067)

### Library store and screen

- [ ] T072 [US2] Implement the `BuildLibraryStore` exposing working/named groups ordered by modified instant with a stable id tie-breaker, unavailable entries, storage summary and the open/name/rename/duplicate/delete/resolve/manage/retry intents in `src/app/application/build-library/build-library.store.ts` with unit tests (depends on T061, T065, T068, T070, T071)
- [ ] T073 [US2] Implement record open as a detached candidate that decodes, migrates and reconstructs before reaching `ReplacementCoordinator`, then copies into this tab's working record and sets named `recordId`/`baseRevisionId` provenance, in `src/app/application/build-library/record-open.service.ts` with unit tests proving failure cannot replace active work (depends on T026, T061, T063)
- [ ] T074 [P] [US2] Implement `SavedBuildCard` showing local name or working state, package hull text, locale-formatted modified instant, recorded valid/complete state with text plus icon, and the named open/rename/duplicate/delete actions in `src/app/ui/library/saved-build-card.ts` with unit tests and previews
- [ ] T075 [P] [US2] Implement `ResponsiveRecordList` with labeled working and named groups in one logical reading order, columnar at wide widths and stacked at narrow widths, in `src/app/ui/library/responsive-record-list.ts` with unit tests and previews
- [ ] T076 [P] [US2] Implement the record manager surface listing records for explicit individual selection under retention-limit and quota-full conditions in `src/app/ui/library/record-manager.ts` with unit tests and previews
- [ ] T077 [P] [US2] Implement the local note editor bound to record metadata only in `src/app/ui/library/record-note-editor.ts` with unit tests and previews
- [ ] T078 [US2] Implement the library route as a route-backed wide modal over an inert, accessibility-tree-removed background and a narrow full-screen layer, with an ordinary page background on direct navigation, in `src/app/features/build-library/build-library.page.ts`, `.html` and `.scss` (depends on T072, T074, T075, T076)
- [ ] T079 [US2] Implement the save/name dialog with duplicate-name warning and the overwrite-existing versus save-as-new choice resolved against record UUID and revision rather than display name in `src/app/features/build-library/save-build.dialog.ts` with unit tests (depends on T029, T067)
- [ ] T080 [US2] Wire the three-choice conflict dialog and the delete/discard confirmation into the library screen in `src/app/features/build-library/build-library.page.ts` (depends on T029, T030, T068, T078)
- [ ] T081 [US2] Render persistence status — saving, saved, retention-limit, quota-full, unavailable, write-failed and record-deleted-externally — as visible localized text with an icon in the workspace, keeping editing available in every failure state, in `src/app/features/build-workspace/persistence-status.ts` with unit tests (depends on T007, T024, T064)
- [ ] T082 [US2] Add the library, save-dialog, conflict, retention, quota, migration and persistence-failure message keys to `src/app/i18n/locales/en.json` (depends on T031)

### Verification

- [ ] T083 [US2] Add the tab-owned working state suite covering reload restoration, two independent pages, a duplicated-tab collision fork, blocked storage and quota failure while editing continues in `e2e/build-working-state.spec.ts`
- [ ] T084 [US2] Add the library suite covering name, open, rename, duplicate, duplicate-name warning, cancel-and-confirm deletion, a real two-page named conflict across cancel, keep-both, overwrite and third-revision refresh, seeded 20-record retention, and seeded unsupported-newer and malformed records, with axe scans of every dialog and error state, in `e2e/build-library.spec.ts`

**Checkpoint**: Work survives reload, is manageable and is never silently lost across tabs. User
Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Share a build link (Priority: P2)

**Goal**: A build is shared as a same-origin `/build#b.…` link whose payload carries only modelled
package identities, restores an equivalent build without a named save, and refuses anything invalid,
truncated, over-limit or unsupported without touching current work.

**Independent Test**: Create a build, copy the published link, verify the value starts `b.` and is at
most 500 characters with no build data in path or query, load it in another tab as working/link
provenance, and paste malformed, truncated, over-limit and unsupported-version fragments while a
dirty build is active.

### Ingress and publication

- [ ] T085 [US3] Implement the fragment recognizer that accepts only a `b.` value, leaves unrelated fragments uninterpreted and rejects a value longer than 500 characters before any decoding in `src/app/application/build-link/fragment-recognizer.ts` with unit tests (depends on T011)
- [ ] T086 [US3] Implement the single ingress coordinator invoked identically by initial app start, address-bar paste, browser navigation and in-app `hashchange`, decoding to a detached candidate through `decodeBuildLinkFragment` behind an async request token so a late decode cannot replace a newer navigation, in `src/app/application/build-link/build-link.coordinator.ts` with unit tests (depends on T026, T085)
- [ ] T087 [US3] Route the decoded candidate through the released package normalization boundary — refusing an unknown hull, emptying an unknown removable module, defaulting an unknown fixed module, repairing a fixed mount the payload left empty through `repairFixedMount(slotKey)` and retaining only transient `IngressIdentityNormalisationOutcome` feedback — in `src/app/application/build-link/build-link.coordinator.ts` with unit tests asserting no unknown identity survives into the accepted build (depends on T022, T086)
- [ ] T088 [US3] Implement fragment publication encoding the latest active build after each modelled edit and replacing only the fragment with `history.replaceState`, preserving origin, base path and query and adding no history entry per edit, in `src/app/application/build-link/fragment-publisher.ts` with unit tests (depends on T011, T025)
- [ ] T089 [US3] Implement encode refusal that clears a stale `b.` fragment with `replaceState`, retains the active build, and exposes the structured code with the affected slot and reason in `src/app/application/build-link/fragment-publisher.ts` with unit tests (depends on T088)
- [ ] T090 [US3] Ensure note, name, record and tab metadata edits neither enter nor perturb the payload by routing publication solely through the modelled snapshot allowlist in `src/app/application/build-link/link-payload.allowlist.ts` with unit tests naming every forbidden field (depends on T088)

### Presentation and SLEF seam

- [ ] T091 [P] [US3] Map every `BuildLinkCodecError.code` — `invalidEncoding`, `integrityCheckFailed`, `unsupportedEnvelope`, `unsupportedTableVersion`, `invalidPayload`, `unknownIdentity` and `reconstructionFailed` — plus its structured parameters to localization keys, rendering no internal English exception message, in `src/app/application/build-link/link-error.mapper.ts` with unit tests covering every code (depends on T031)
- [ ] T092 [P] [US3] Implement `ShareLinkPanel` rendering the selectable canonical `/build#b.…` text with a labeled internal scroll container, copy/share feedback, encoding and refusal states, and the feature 004 SLEF alternative, keeping the text selectable after clipboard or platform-share failure, in `src/app/ui/link/share-link-panel.ts` with unit tests and previews for published, encoding, refused and copy-failed states
- [ ] T093 [US3] Define the SLEF fallback port feature 004 implements, with a documented no-op-plus-notice default until that feature lands, in `src/app/application/build-link/slef-fallback.port.ts` with unit tests (depends on T027)
- [ ] T094 [US3] Compose the share-link panel into the workspace export surface and wire the copy/share, retry and SLEF intents in `src/app/features/build-workspace/build-workspace.page.ts` and `src/app/features/build-workspace/export.dialog.ts` (depends on T007, T092, T093)
- [ ] T095 [US3] Order workspace startup so this tab's working record restores before an initial recognized fragment is processed as an incoming candidate in `src/app/features/build-workspace/build-workspace.page.ts` (depends on T064, T086)
- [ ] T096 [US3] Add the link publication, refusal, copy-feedback and per-code error message keys to `src/app/i18n/locales/en.json` (depends on T031, T091)

### Verification

- [ ] T097 [US3] Add the link suite covering publication shape, the 500-character bound including `b.`, no build data in path or query, no history growth per edit, cross-tab restoration as working/link provenance without a named save, and malformed, truncated, over-limit and unsupported-version fragments arriving while a dirty build is active in `e2e/build-link.spec.ts`
- [ ] T098 [US3] Assert in the link suite that no request URL contains `b.` build data and no automatic cross-origin request occurs during catalogue, detail, storage and share flows in `e2e/build-link.spec.ts` (depends on T097)
- [ ] T099 [US3] Add unknown-hull, unknown-removable-module, unknown-fixed-module and source-empty-fixed-mount link fixtures asserting refusal, emptying, defaulting and repair with transient slot/source feedback and a normalized link containing neither unknown identity in `e2e/build-link.spec.ts` (depends on T087, T097)

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Offline behavior, cross-story accessibility and localization proof, capacity evidence,
integration closure and the documented validation run.

- [ ] T100 [P] Add the offline and privacy suite covering shell and bundled-English readability offline, a previously opened illustration remaining available, an uncached illustration not blocking capability, and recovery on reconnection without a reload in `e2e/offline-privacy.spec.ts`
- [ ] T101 [P] Add the cross-route accessibility suite asserting one `main`, one visible `h1`, consistent heading nesting, matching visible and accessible names, selected/expanded/invalid relationships, one polite live region for match count, one prompt alert per new blocking condition, 44 CSS px targets and no document horizontal overflow across all ten projects in `e2e/interface-conformance.spec.ts`
- [ ] T102 [P] Add 200% text, 400% zoom, reduced-motion, expanded-message and RTL fixture assertions for all four screens in `e2e/interface-conformance.spec.ts`
- [ ] T103 [P] Assert package hull, manufacturer and diagnostic text resolves through the 0.1.3 i18n leaves and renders canonical text with the untranslated disclosure on `null`, with no private game-text translation added, in `src/app/i18n/package-text.spec.ts`
- [ ] T104 Register the FR-001–FR-021 surfaces, journeys, axe flags and named assertions in the feature 011 coverage ledger in `e2e/coverage-ledger.ts`
- [ ] T105 [P] Extend `scripts/build-link-codec-capacity.mjs` coverage to the pinned package hull with the most slots, every slot fitted and every supported modelled field populated, asserting the produced value stays within 500 characters including `b.`, in `scripts/build-link-codec-capacity.test.mjs`
- [ ] T106 [P] Verify search, filter and sort over all 48 pinned hulls, working-build restoration before interactivity, autosave coalescing and sub-50 ms codec encode/decode against the plan's performance goals in `e2e/performance.spec.ts`
- [ ] T107 Confirm the built asset tree contains no `.design/` mock data or assets, no Google Fonts request and no `/b/<name>#h=…` sample link, and record the reconciliation outcome in `specs/001-ship-selection-and-loading/design/reference-review.md`
- [ ] T108 [P] Document the working-record retention limit, owned key space, supported record versions and published link versions in `docs/persistence-and-links.md`
- [ ] T109 Close the feature 004 SLEF integration by replacing the placeholder fallback with the delivered export action in `src/app/application/build-link/slef-fallback.port.ts` and its workspace wiring (depends on T093, feature 004)
- [ ] T110 Run `pnpm run check` and execute every scenario in `specs/001-ship-selection-and-loading/quickstart.md`, confirming at least 80% statements, branches, functions and lines with no skipped or quarantined test

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies beyond feature 011 having landed; can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all three user stories. T021's package
  fixed-mount repair step and T022's `IngressIdentityNormalisationOutcome` are contract-first for
  feature 002 T009, which composes them rather than re-implementing the rule
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational only; shares the workspace shell with US1 and US3 but adds no requirement to US1
- **User Story 3 (Phase 5)**: Depends on Foundational only; T095 touches the same workspace startup file as T081, so sequence those two if US2 and US3 run concurrently
- **Polish (Phase 6)**: Depends on the user stories being complete; T109 additionally waits on feature 004

### User Story Dependencies

- **US1 (P1)**: Independent. Catalogue, detail and creation need no persistence and no link behavior.
- **US2 (P1)**: Independent. Records, autosave and conflicts operate on any active build, including one created by hand in a test harness.
- **US3 (P2)**: Independent. Link ingress and publication operate on the active build store without requiring the catalogue or any stored record.

### Within Each User Story

- Domain before application; application before components; components before routes
- Message keys land with the screen that consumes them
- Unit tests accompany the file they cover; end-to-end suites close each story

### Parallel Opportunities

- Setup: T002, T004 and T005 in parallel
- Foundational: the eight ports T009, T011–T017 in parallel; T018, T022, T023 in parallel; the three UI primitives T028–T030 in parallel
- US1: domain T032, T033 in parallel; the six components T042–T047 in parallel
- US2: the four library components T074–T077 in parallel; fixtures T058 alongside the decoder work
- US3: T091 and T092 in parallel
- Polish: T100–T103, T105, T106 and T108 in parallel
- After Foundational completes, US1, US2 and US3 can be staffed concurrently

---

## Parallel Example: User Story 1

```bash
# Launch the catalogue domain projections together:
Task: "Implement the HullCatalogueEntry projection in src/app/domain/catalogue/hull-catalogue.ts"
Task: "Implement the FR-004 detailFacts map in src/app/domain/catalogue/hull-facts.ts"

# Launch all six shared components together:
Task: "Implement CollectionToolbar in src/app/ui/catalogue/collection-toolbar.ts"
Task: "Implement ResponsiveCatalogueView in src/app/ui/catalogue/responsive-catalogue-view.ts"
Task: "Implement HullSummaryCard in src/app/ui/catalogue/hull-summary-card.ts"
Task: "Implement FactList in src/app/ui/hull/fact-list.ts"
Task: "Implement HullArtwork in src/app/ui/hull/hull-artwork.ts"
Task: "Implement SlotLayout in src/app/ui/hull/slot-layout.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — this blocks everything
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run quickstart Scenarios 1 and 2 plus `e2e/ship-catalogue.spec.ts` and `e2e/hull-detail.spec.ts`
5. Demo the catalogue, hull detail and stock creation

### Incremental Delivery

1. Setup + Foundational → routes, ports and candidate-first commit exist
2. Add US1 → find, inspect and create → validate → demo (MVP)
3. Add US2 → work survives reload and multi-tab editing → validate Scenarios 3–6 → demo
4. Add US3 → shareable links → validate Scenarios 7–8 → demo
5. Polish → Scenarios 9–10, capacity evidence and the feature 004 seam closure

### Parallel Team Strategy

1. The team completes Setup and Foundational together
2. Then: Developer A takes US1, Developer B takes US2, Developer C takes US3
3. Coordinate only on `src/app/i18n/locales/en.json` and `src/app/features/build-workspace/build-workspace.page.ts`, which US2 and US3 both touch

---

## Notes

- [P] tasks touch different files and have no dependency on incomplete work
- Every game-bearing value comes from `@elite-dangerous-almanac/core`; no task adds a local hull fact, calculation or replacement rule
- Every browser API is reached through an injected port so domain behavior stays render-free and testable
- Candidate-first is absolute: no loader mutates active state before its candidate has parsed, constructed and validated
- No record is ever deleted, repaired or overwritten except by an explicit, individually confirmed Commander action
- Qualified WCAG 2.2 AA conformance wording (naming the excluded criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11) is enforced repository-wide by feature 011 T093; this feature adds no separate assertion
- Commit after each task or logical group; stop at any checkpoint to validate a story independently
