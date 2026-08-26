---
description: 'Task list for Ship Selection and Build Loading'
---

# Tasks: Ship Selection and Build Loading

**Input**: Design documents from `/specs/001-ship-selection-and-loading/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [design/](./design/),
[quickstart.md](./quickstart.md)

**Upstream features**: Feature [011](../011-interface-foundations/tasks.md) supplies the token set,
`AppShell`, complete English/German localization runtime, the application's sole service-worker
registration/base configuration, preview manifest and the ten-project Playwright/axe harness.
Feature [004](../004-slef/spec.md) supplies the SLEF export action reached from link refusal. Feature
001 defines and tests both seams but cannot be declared complete until both integrations are present.

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
`e2e/`; build tooling in `scripts/`. Unit tests live beside their source as `*.spec.ts`. Component
preview declarations are registered only in feature 011's manifest registry at
`src/app/ui/previews/preview-manifest.ts`, which feature 011 T023 renders; this feature adds no
separate preview entry point or declaration file.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Asset delivery, offline caching, owned key space and tooling entry points that the
feature's source depends on.

- [x] T001 Add an `assets` entry copying `node_modules/@elite-dangerous-almanac/core/assets/ships/**/illustration.svg` to the same-origin output path `assets/ships/` in the build target options in `angular.json`
- [x] T002 [P] Extend feature 011's existing `ngsw-config.json` with a versioned lazy `assets/ships/**` performance asset group for copied Almanac illustrations, without changing its app-shell/locale groups or registering another worker, and retain the production reference in `angular.json`
- [x] T003 Add the feature-boundary regression asserting exactly one `provideServiceWorker` registration remains feature 011-owned and feature 001 contributes only the ship-artwork asset group in `scripts/check-service-worker-ownership.test.mjs` (depends on T002 and feature 011's worker setup)
- [x] T004 [P] Add the `codec:capacity` script invoking `node scripts/build-link-codec-capacity.mjs` and include it in the `check` pipeline in `package.json`
- [x] T005 [P] Declare the owned key space constants `EDSB_RECORD_KEY_PREFIX = 'edsb:record:'`, `EDSB_TAB_KEY = 'edsb:tab'` and `EDSB_BROADCAST_CHANNEL = 'edsb.persistence.v1'` with the `edsb:named:<recordId>` lock-name builder in `src/app/platform/storage/storage-keys.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Route contracts, injected browser ports, the lossless snapshot, the candidate-first
replacement coordinator and the shared dialog primitives that all three stories build on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Routes and workspace shell

- [x] T006 Define the `/` replace-redirect to `/ships`, the lazy `/ships`, `/ships/:symbol`, `/build` and `/builds` route records with their localized titles in `src/app/app.routes.ts`
- [x] T007 Implement the minimal workspace route shell composing feature 011's `AppShell`, one `h1`, the active hull/provenance summary and the capability outlet in `src/app/features/build-workspace/build-workspace.page.ts`, `.html` and `.scss` (depends on T006)
- [x] T008 [P] Add the `routes-and-ui` navigation entry points (saved builds, feature 004 import, feature 012 help) to the shared shell usage in `src/app/features/shared/app-navigation.ts`

### Browser and storage ports

- [x] T009 [P] Define the `WebStoragePort` interface and `LOCAL_STORAGE_PORT`/`SESSION_STORAGE_PORT` injection tokens covering storage-object acquisition, key enumeration, `getItem`, `setItem` and `removeItem` in `src/app/platform/storage/web-storage.port.ts`
- [x] T010 Implement the `WebStoragePort` adapters with a total exception boundary distinguishing access-blocked, quota-exceeded and generic write failures in `src/app/platform/storage/web-storage.adapter.ts`, with unit tests for `SecurityError`, `QuotaExceededError` and enumeration of only owned keys (depends on T005, T009)
- [x] T011 [P] Define and implement the history/location port exposing current fragment reads, `history.replaceState` fragment replacement and a `hashchange` stream in `src/app/platform/browser/history-location.port.ts` and `src/app/platform/browser/history-location.adapter.ts` with unit tests
- [x] T012 [P] Define and implement the BroadcastChannel port over `EDSB_BROADCAST_CHANNEL` with a no-op fallback when the API is absent in `src/app/platform/browser/broadcast-channel.port.ts` and `src/app/platform/browser/broadcast-channel.adapter.ts` with unit tests
- [x] T013 [P] Define and implement the Web Locks port exposing `request(name, { mode: 'exclusive' }, fn)` and an explicit `unavailable` capability signal in `src/app/platform/browser/web-locks.port.ts` and `src/app/platform/browser/web-locks.adapter.ts` with unit tests
- [x] T014 [P] Implement the page-lifecycle adapter emitting `pagehide` and `visibilitychange`-to-hidden flush signals in `src/app/platform/browser/page-lifecycle.adapter.ts` with unit tests
- [x] T015 [P] Implement the connectivity adapter emitting browser `online` transitions for artwork retry in `src/app/platform/browser/connectivity.adapter.ts` with unit tests
- [x] T016 [P] Implement the base-href-safe hull artwork path builder producing `assets/ships/<exact package symbol>/illustration.svg` in `src/app/platform/assets/hull-artwork-path.ts` with unit tests covering deployment sub-paths and exact symbol casing
- [x] T017 [P] Implement the crypto-backed UUID factory port used for record, revision and page-nonce identities in `src/app/platform/browser/uuid.port.ts` and `src/app/platform/browser/uuid.adapter.ts` with unit tests

### Lossless snapshot and reconstruction domain

- [x] T018 [P] Define the `BuildSnapshotV1`, `SnapshotModuleV1`, `PreEngineeredIdentityV1` and `EngineeringSnapshotV1` types with their literal discriminators in `src/app/domain/build/build-snapshot.ts`
- [x] T019 Implement `toBuildSnapshotV1(loadout)` reading hull symbol, nullable ship name/ident and per-slot module symbol, absent-vs-false `enabled`, nullable zero-based `priority`, `FittedModule.preEngineeredVariant` identity tuple and ordinary engineering from `ShipLoadout` getters in `src/app/domain/build/build-snapshot.serializer.ts` with unit tests asserting no derived, calculated or lowercased field is emitted (depends on T018)
- [x] T020 Implement `parseBuildSnapshotV1(value: unknown)` validating every discriminant, scalar, bound and case-insensitive slot uniqueness as untrusted input in `src/app/domain/build/build-snapshot.parser.ts` with unit tests for malformed, duplicate-slot and out-of-range fixtures (depends on T018)
- [x] T021 Implement `reconstructFromSnapshot(snapshot)` by calling `ShipLoadout.fromLoadout()` and the package pre-engineered helpers, refusing an unknown hull and accepting the package-returned fixed defaults without a repair pass or provenance model, in `src/app/domain/build/build-snapshot.reconstructor.ts` with unit tests covering omitted and unusable fixed entries plus unknown-hull refusal (depends on T020)
- [x] T022 [P] Add reconstruction contract tests proving every accepted snapshot has package-populated armour, core internals and cargo hatch before activation and that this package defaulting is never attached to the snapshot or edit history in `src/app/domain/build/build-snapshot.reconstructor.spec.ts`
- [x] T023 [P] Implement the modelled-state `baselineFingerprint` derived only from a serialized snapshot, plus the `dirty` predicate, in `src/app/domain/build/replacement-policy.ts` with unit tests covering new-unnamed, equal-to-baseline and diverged states

### Active build and replacement coordination

- [x] T024 [P] Define `ActiveBuildState`, `BuildProvenance`, `PersistenceStatus` and `LinkPublicationState` as application models in `src/app/application/active-build/active-build.models.ts`
- [x] T025 Implement the signal `ActiveBuildStore` owning the single live `ShipLoadout`, provenance, working record id, named source baseline, dirty state, persistence status, link state and transient quality-completion notices in `src/app/application/active-build/active-build.store.ts` with unit tests (depends on T023, T024)
- [x] T026 Implement the shared `ReplacementCoordinator` executing construct-candidate → validate → confirm-if-dirty → commit-once, with an async request token that discards a late candidate, in `src/app/application/active-build/replacement-coordinator.ts` with unit tests proving failure and cancel never mutate active state (depends on T025)
- [x] T027 Define the persistence sink and SLEF-fallback seam interfaces the coordinator publishes to, so stock creation, record open and link load share one commit path, in `src/app/application/active-build/commit-sinks.port.ts` (depends on T026)

### Shared UI primitives added by this feature

- [x] T028 [P] Implement the `UnavailableValue` component rendering the localized unavailable state distinctly from `0` in `src/app/ui/value/unavailable-value.ts` with its preview declaration in `src/app/ui/previews/preview-manifest.ts`
- [x] T029 [P] Implement `ConfirmDialog` with associated title/description, named confirm/cancel actions, focus management and inert background in `src/app/ui/dialog/confirm-dialog.ts` with unit tests and preview declarations in `src/app/ui/previews/preview-manifest.ts`
- [x] T030 [P] Implement the three-choice `ChoiceDialog` whose choices each carry visible text explaining which version survives in `src/app/ui/dialog/choice-dialog.ts` with unit tests and preview declarations in `src/app/ui/previews/preview-manifest.ts`
- [x] T031 Register the feature 001 message namespaces (`catalogue`, `hullDetail`, `workspace`, `library`, `link`) with complete reviewed messages and exact key/interpolation parity in `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`

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

- [x] T032 [P] [US1] Implement the `HullCatalogueEntry` projection over package `SHIPS` with `symbol`, `sourceOrdinal`, name, manufacturer, size, hardpoints, `retailPrice`, `slots` from `enumerateSlots(getShipSlots(symbol))`, `artworkPath` and `defaultAvailable` from `getDefaultLoadout(symbol) !== null` in `src/app/domain/catalogue/hull-catalogue.ts` with unit tests asserting 48 unique entries and missing distinct from zero
- [x] T033 [P] [US1] Implement the FR-004 `detailFacts` map — manufacturer, size, minimum/four-pip speed and boost, base shield and armour, hull mass, hardness, mass-lock factor, crew seats, heat capacity and dissipation, reserve fuel, min/four-pip pitch, roll and yaw, hull-only and retail cost — with each entry carrying its package-documented unit or explicit rating-without-unit marker in `src/app/domain/catalogue/hull-facts.ts` with unit tests
- [x] T034 [US1] Implement `CatalogueQuery` filtering (text over displayed localized values, manufacturer, size, hardpoint class, inclusive price interval with open bounds) in `src/app/domain/catalogue/catalogue-query.ts` with unit tests (depends on T032)
- [x] T035 [US1] Implement bidirectional sorting by name, manufacturer, semantic small/medium/large size, huge-to-small hardpoint tuple and retail price using `Intl.Collator`, missing-last in both directions and `sourceOrdinal` as the final stable tie-breaker in `src/app/domain/catalogue/catalogue-sort.ts` with unit tests for equal-value ties, missing values and zero (depends on T032)
- [x] T036 [US1] Implement the active-constraint description and match-count derivation in `src/app/domain/catalogue/catalogue-constraints.ts` with unit tests (depends on T034, T035) — **superseded by T135**: the constraint description went with the controls the reference never drew, and the count is now a plain derivation on `CatalogueFacade`

### Application

- [x] T037 [US1] Implement the signal `CatalogueSessionStore` holding query, facets, sort and `resultAnchor` with a versioned `sessionStorage` cache, and no build, record, query-parameter or fragment write, in `src/app/application/catalogue/catalogue-session.store.ts` with unit tests (depends on T009, T036)
- [x] T038 [P] [US1] Implement the artwork coordinator exposing loading/available/temporarily-unavailable state and retrying a failed uncached request on the connectivity port's `online` transition without a reload in `src/app/application/catalogue/artwork.coordinator.ts` with unit tests (depends on T015, T016)
- [x] T039 [US1] Implement the catalogue page facade exposing immutable localized view models and the change-search/facet/sort and open-hull intents in `src/app/application/catalogue/catalogue.facade.ts` with unit tests (depends on T037)
- [x] T040 [US1] Implement the hull detail facade resolving the route symbol through `getShipBySymbol`, exposing populated/unknown-symbol states and the back-to-catalogue intent in `src/app/application/catalogue/hull-detail.facade.ts` with unit tests (depends on T032, T033)
- [x] T041 [US1] Implement the stock creation transaction — resolve symbol, confirm `getDefaultLoadout(symbol)`, construct `ShipLoadout.default(symbol)` as a detached candidate, confirm every fixed mount is populated, read package validation, then hand the candidate to `ReplacementCoordinator` — in `src/app/application/active-build/stock-build.creator.ts` with unit tests proving no image state participates and a package factory failure leaves route and build unchanged (depends on T026, T040)

### Shared components

- [x] T042 [P] [US1] Implement `CollectionToolbar` with prominent search, segmented size choices, manufacturer/hardpoint/price facets, named bidirectional sort control, removable active constraints and textual match count in `src/app/ui/catalogue/collection-toolbar.ts` with unit tests and default/constrained/no-match preview declarations in `src/app/ui/previews/preview-manifest.ts`
- [x] T043 [P] [US1] Implement `ResponsiveCatalogueView` rendering a real table with named bidirectional sort-button headers at wide widths and semantic stacked definition-list cards at narrow widths, owning its own internal overflow, in `src/app/ui/catalogue/responsive-catalogue-view.ts` with unit tests and preview declarations for both variants in `src/app/ui/previews/preview-manifest.ts`
- [x] T044 [P] [US1] Implement `HullSummaryCard` exposing textual and programmatic selected state alongside the amber marker in `src/app/ui/catalogue/hull-summary-card.ts` with unit tests and preview declarations in `src/app/ui/previews/preview-manifest.ts`
- [x] T045 [P] [US1] Implement `FactList` rendering label/value/unit definition semantics with `UnavailableValue` fallback in `src/app/ui/hull/fact-list.ts` with unit tests and preview declarations in `src/app/ui/previews/preview-manifest.ts` (depends on T028)
- [x] T046 [P] [US1] Implement `HullArtwork` with a reserved 3:2 area, text equivalent, and loading/temporarily-unavailable text status that never disables an action in `src/app/ui/hull/hull-artwork.ts` with unit tests and preview declarations in `src/app/ui/previews/preview-manifest.ts`
- [x] T047 [P] [US1] Implement `SlotLayout` grouping package-enumerated slots semantically by armour, core, hardpoint, utility, optional and cargo hatch with their game keys, sizes and restrictions in `src/app/ui/hull/slot-layout.ts` with unit tests and preview declarations in `src/app/ui/previews/preview-manifest.ts`

### Routes

- [x] T048 [US1] Implement the catalogue route composing `AppShell`, the "Shipyard" heading, package hull count, `CollectionToolbar`, `ResponsiveCatalogueView`, no-match `EmptyState` and unavailable-fact `InlineNotice`, with the match count preceding results and announced through one polite live region, in `src/app/features/ship-catalogue/ship-catalogue.page.ts`, `.html` and `.scss` (depends on T039, T042, T043, T044)
- [x] T049 [US1] Implement the hull detail route as a wide inspector beside the manifest and a narrow full-screen layer with a named back action, rendering the "Hull specifications" `FactList`, `SlotLayout`, `HullArtwork` and the creation `ActionButton` present only when a package default exists, in `src/app/features/hull-detail/hull-detail.page.ts`, `.html` and `.scss` (depends on T040, T045, T046, T047)
- [x] T050 [US1] Implement the unknown-symbol error state with a named catalogue-return action, no guessed facts and no creation action in `src/app/features/hull-detail/hull-detail-unknown-symbol.ts` with unit tests (depends on T049)
- [x] T051 [US1] Restore catalogue constraints, order and the anchored result offset after detail back navigation once cards have stabilized in `src/app/features/ship-catalogue/catalogue-anchor.restorer.ts` with unit tests (depends on T037, T048)
- [x] T052 [US1] Add the catalogue, hull-detail, unavailable-fact, unknown-symbol and replacement-confirmation message keys with reviewed English/German wording and matching interpolation variables to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json` (depends on T031)

### Verification

- [x] T053 [US1] Add the catalogue journey suite covering search, every facet, both directions of every sort field, stable ties, missing-versus-zero, no-match, session restoration and the absence of catalogue state from route query, fragment and storage in `e2e/ship-catalogue.spec.ts`
- [x] T054 [US1] Add the hull-detail and creation journey suite covering every FR-004 fact with units, aborted artwork, unknown symbol, cancel-then-confirm replacement and the resulting exact `ShipLoadout.default(symbol)` state with every fixed mount populated, with axe scans of each state across all ten projects, in `e2e/hull-detail.spec.ts`

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

- [x] T055 [P] [US2] Define `LocalRecordV1` and the `working`/`named` kinds with their literal `format`/`version` discriminators in `src/app/domain/build/stored-build.ts`
- [x] T056 [US2] Implement the strict `LocalRecordV1` decoder validating format, version, `id`-equals-key-suffix, kind, revision, instants, nullable name/note, `hullSymbol`-equals-`build.shipSymbol` and the exact package validation booleans in `src/app/domain/build/stored-build.parser.ts` with unit tests for malformed, mismatched-id and foreign-value fixtures (depends on T020, T055)
- [x] T057 [US2] Implement the frozen decoder and sequential-migration registry producing a canonical intermediate model, with version 1 as the first published version and no fictional version 0, in `src/app/domain/build/record-migrations.ts` with unit tests (depends on T056)
- [x] T058 [P] [US2] Add frozen immutable round-trip fixtures for every published record version under `src/app/domain/build/fixtures/` including unsupported-newer, malformed and unknown-identity cases
- [x] T059 [US2] Implement the storage serializer allowlist emitting only `LocalRecordV1` envelope metadata plus `BuildSnapshotV1`, with unit tests proving calculated values, catalogue facts and prices cannot be serialized, in `src/app/domain/build/stored-build.serializer.ts` (depends on T019, T055)

### Storage repositories

- [x] T060 [US2] Implement the `LocalRecordRepository` performing serialize-then-single-`setItem` atomic writes, owned-key enumeration with independent per-record validation, no global index, and delete via one `removeItem`, in `src/app/platform/storage/local-record.repository.ts` with unit tests covering failed writes retaining prior bytes (depends on T010, T056, T059)
- [x] T061 [US2] Implement migration-on-open that replaces a record's own key only after decode, migration, package reconstruction and latest-version serialization all succeed, leaving original bytes authoritative on reconstruction or persistence failure, in `src/app/platform/storage/record-migration.service.ts` with unit tests (depends on T057, T060)
- [x] T062 [P] [US2] Implement the versioned `TabDescriptorV1` repository over `edsb:tab` in `src/app/platform/storage/tab-descriptor.repository.ts` with unit tests for absent, malformed and unsupported-version descriptors (depends on T010)

### Working ownership, autosave and retention

- [x] T063 [US2] Implement the tab ownership coordinator broadcasting a `{ workingRecordId, pageNonce }` claim and forking a collided live id into a new record before either page next autosaves in `src/app/application/build-library/tab-ownership.coordinator.ts` with unit tests (depends on T012, T017, T062)
- [x] T064 [US2] Implement coalesced autosave to the tab working key with best-effort `pagehide`/visibility-hidden flush and a `record-deleted-externally` pause requiring explicit resume in `src/app/application/build-library/autosave.service.ts` with unit tests (depends on T014, T060, T063)
- [x] T065 [US2] Implement the 20-record working retention rule where existing records always update, record 21 performs no write and no deletion, and named records are excluded from the count, in `src/app/application/build-library/retention.service.ts` with unit tests asserting no age, count, LRU or tab-closure eviction path exists (depends on T060)
- [x] T066 [US2] Add persistence tests proving package-defaulted fixed modules are stored as ordinary build state with no source-empty, repair or defaulting provenance in `src/app/application/build-library/autosave.service.spec.ts` (depends on T055, T064)

### Named operations and conflicts

- [x] T067 [US2] Implement named save, rename and delete under `navigator.locks.request('edsb:named:<recordId>', { mode: 'exclusive' })` with an expected-`revisionId` precondition and a fresh revision UUID per successful write in `src/app/application/build-library/named-record.service.ts` with unit tests (depends on T013, T017, T060)
- [x] T068 [US2] Implement the `SaveConflict` model and the overwrite, keep-both and cancel transitions, releasing the lock before the dialog is shown, re-locking and re-checking on overwrite, and refreshing the conflict when a third revision appeared, in `src/app/application/build-library/save-conflict.service.ts` with unit tests (depends on T067)
- [x] T069 [US2] Disable unsafe in-place named overwrite while keeping keep-both, cancel and the tab working copy available when the Web Locks port reports unavailable, in `src/app/application/build-library/named-record.service.ts` with unit tests (depends on T067)
- [x] T070 [US2] Implement `storage`-event and BroadcastChannel invalidation that always re-reads authoritative storage rather than trusting a cached listing or baseline in `src/app/application/build-library/record-invalidation.service.ts` with unit tests (depends on T012, T060)
- [x] T071 [US2] Implement duplicate, keep-both and name-a-working-record operations creating fresh record and revision UUIDs while preserving the source record and its validation snapshot in `src/app/application/build-library/record-duplication.service.ts` with unit tests (depends on T067)

### Library store and screen

- [x] T072 [US2] Implement the `BuildLibraryStore` exposing working/named groups ordered by modified instant with a stable id tie-breaker, unavailable entries, storage summary and the open/name/rename/duplicate/delete/resolve/manage/retry intents in `src/app/application/build-library/build-library.store.ts` with unit tests (depends on T061, T065, T068, T070, T071)
- [x] T073 [US2] Implement record open as a detached candidate that decodes, migrates and reconstructs before reaching `ReplacementCoordinator`, then copies into this tab's working record and sets named `recordId`/`baseRevisionId` provenance, in `src/app/application/build-library/record-open.service.ts` with unit tests proving failure cannot replace active work (depends on T026, T061, T063)
- [x] T074 [P] [US2] Implement `SavedBuildCard` showing local name or working state, package hull text, locale-formatted modified instant, recorded valid/complete state with text plus icon, and the named open/rename/duplicate/delete actions in `src/app/ui/library/saved-build-card.ts` with unit tests and preview declarations in `src/app/ui/previews/preview-manifest.ts`
- [x] T075 [P] [US2] Implement `ResponsiveRecordList` with labeled working and named groups in one logical reading order, columnar at wide widths and stacked at narrow widths, in `src/app/ui/library/responsive-record-list.ts` with unit tests and preview declarations in `src/app/ui/previews/preview-manifest.ts`
- [x] T076 [P] [US2] Implement the record manager surface listing records for explicit individual selection under retention-limit and quota-full conditions in `src/app/ui/library/record-manager.ts` with unit tests and preview declarations in `src/app/ui/previews/preview-manifest.ts`
- [x] T077 [P] [US2] Implement the local note editor bound to record metadata only in `src/app/ui/library/record-note-editor.ts` with unit tests and preview declarations in `src/app/ui/previews/preview-manifest.ts`
- [x] T078 [US2] Implement the library route as a route-backed wide modal over an inert, accessibility-tree-removed background and a narrow full-screen layer, with an ordinary page background on direct navigation, in `src/app/features/build-library/build-library.page.ts`, `.html` and `.scss` (depends on T072, T074, T075, T076)
- [x] T079 [US2] Implement the save/name dialog with duplicate-name warning and the overwrite-existing versus save-as-new choice resolved against record UUID and revision rather than display name in `src/app/features/build-library/save-build.dialog.ts` with unit tests (depends on T029, T067)
- [x] T080 [US2] Wire the three-choice conflict dialog and the delete/discard confirmation into the library screen in `src/app/features/build-library/build-library.page.ts` (depends on T029, T030, T068, T078)
- [x] T081 [US2] Render persistence status — saving, saved, retention-limit, quota-full, unavailable, write-failed and record-deleted-externally — as visible localized text with an icon in the workspace, keeping editing available in every failure state, in `src/app/features/build-workspace/persistence-status.ts` with unit tests (depends on T007, T024, T064)
- [x] T082 [US2] Add the library, save-dialog, conflict, retention, quota, migration and persistence-failure message keys with reviewed English/German wording and matching interpolation variables to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json` (depends on T031)

### Verification

- [x] T083 [US2] Add the tab-owned working state suite covering reload restoration, two independent pages, a duplicated-tab collision fork, blocked storage and quota failure while editing continues in `e2e/build-working-state.spec.ts`
- [x] T084 [US2] Add the library suite covering name, open, rename, duplicate, duplicate-name warning, cancel-and-confirm deletion, a real two-page named conflict across cancel, keep-both, overwrite and third-revision refresh, seeded 20-record retention, and seeded unsupported-newer and malformed records, with axe scans of every dialog and error state, in `e2e/build-library.spec.ts`

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

- [x] T085 [US3] Implement the fragment recognizer that accepts only a `b.` value, leaves unrelated fragments uninterpreted and rejects a value longer than 500 characters before any decoding in `src/app/application/build-link/fragment-recognizer.ts` with unit tests (depends on T011)
- [x] T086 [US3] Implement the single ingress coordinator invoked identically by initial app start, address-bar paste, browser navigation and in-app `hashchange`, decoding to a detached candidate through `decodeBuildLinkFragment` behind an async request token so a late decode cannot replace a newer navigation, in `src/app/application/build-link/build-link.coordinator.ts` with unit tests (depends on T026, T085)
- [x] T087 [US3] Route the decoded candidate through the released package construction boundary — refusing an unknown hull and accepting its package-populated fixed modules without a second repair pass or provenance feedback — in `src/app/application/build-link/build-link.coordinator.ts` with unit tests asserting fixed mounts are populated before acceptance (depends on T022, T086)
- [x] T088 [US3] Implement fragment publication encoding the latest active build after each modelled edit and replacing only the fragment with `history.replaceState`, preserving origin, base path and query and adding no history entry per edit, in `src/app/application/build-link/fragment-publisher.ts` with unit tests (depends on T011, T025)
- [x] T089 [US3] Implement encode refusal that clears a stale `b.` fragment with `replaceState`, retains the active build, and exposes the structured code with the affected slot and reason in `src/app/application/build-link/fragment-publisher.ts` with unit tests (depends on T088)
- [x] T090 [US3] Ensure note, name, record and tab metadata edits neither enter nor perturb the payload by routing publication solely through the modelled snapshot allowlist in `src/app/application/build-link/link-payload.allowlist.ts` with unit tests naming every forbidden field (depends on T088)

### Presentation and SLEF seam

- [x] T091 [P] [US3] Map every `BuildLinkCodecError.code` — `invalidEncoding`, `integrityCheckFailed`, `unsupportedEnvelope`, `unsupportedTableVersion`, `invalidPayload`, `unknownIdentity` and `reconstructionFailed` — plus its structured parameters to localization keys, rendering no internal English exception message, in `src/app/application/build-link/link-error.mapper.ts` with unit tests covering every code (depends on T031)
- [x] T092 [P] [US3] Implement `ShareLinkPanel` rendering the selectable canonical `/build#b.…` text with a labeled internal scroll container, copy/share feedback, encoding and refusal states, and the feature 004 SLEF alternative, keeping the text selectable after clipboard or platform-share failure, in `src/app/ui/link/share-link-panel.ts` with unit tests and preview declarations for published, encoding, refused and copy-failed states in `src/app/ui/previews/preview-manifest.ts`
- [x] T093 [US3] Define the SLEF fallback port feature 004 implements, with a documented no-op-plus-notice default until that feature lands, in `src/app/application/build-link/slef-fallback.port.ts` with unit tests (depends on T027)
- [x] T094 [US3] Compose the share-link panel into the workspace export surface and wire the copy/share, retry and SLEF intents in `src/app/features/build-workspace/build-workspace.page.ts` and `src/app/features/build-workspace/export.dialog.ts` (depends on T007, T092, T093)
- [x] T095 [US3] Order workspace startup so this tab's working record restores before an initial recognized fragment is processed as an incoming candidate in `src/app/features/build-workspace/build-workspace.page.ts` (depends on T064, T086)
- [x] T096 [US3] Add the link publication, refusal, copy-feedback and per-code error message keys with reviewed English/German wording and matching interpolation variables to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json` (depends on T031, T091)

### Verification

- [x] T097 [US3] Add the link suite covering publication shape, the 500-character bound including `b.`, no build data in path or query, no history growth per edit, cross-tab restoration as working/link provenance without a named save, and malformed, truncated, over-limit and unsupported-version fragments arriving while a dirty build is active in `e2e/build-link.spec.ts`
- [x] T098 [US3] Assert in the link suite that no request URL contains `b.` build data and no automatic cross-origin request occurs during catalogue, detail, storage and share flows in `e2e/build-link.spec.ts` (depends on T097)
- [x] T099 [US3] Add unknown-hull and omitted-fixed-mount link fixtures asserting hull refusal, package defaulting before activation and canonical re-encoding with no application repair feedback in `e2e/build-link.spec.ts` (depends on T087, T097)

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Offline behavior, cross-story accessibility and localization proof, capacity evidence,
integration closure and the documented validation run.

- [x] T100 [P] Add the offline and privacy suite covering shell and bundled-English readability offline, a previously opened illustration remaining available, an uncached illustration not blocking capability, and recovery on reconnection without a reload in `e2e/offline-privacy.spec.ts`
- [x] T101 [P] Add the cross-route accessibility suite asserting one `main`, one visible `h1`, consistent heading nesting, matching visible and accessible names, selected/expanded/invalid relationships, one polite live region for match count, one prompt alert per new blocking condition, 44 CSS px targets and no document horizontal overflow across all ten projects in `e2e/interface-conformance.spec.ts`
- [x] T102 [P] Add 200% text, 400% zoom, reduced-motion, expanded-message and RTL fixture assertions for all four screens in `e2e/interface-conformance.spec.ts`
- [x] T103 [P] Assert package hull, manufacturer and diagnostic text resolves through the installed package's i18n leaves and renders canonical text with the untranslated disclosure on `null`, with no private game-text translation added, in `src/app/i18n/package-text.spec.ts`
- [x] T104 Register the FR-001–FR-021 and SC-001–SC-004 surfaces, journeys, axe flags and named assertions in the feature 011 coverage ledger in `e2e/coverage-ledger.ts`
- [x] T105 [P] Extend `scripts/build-link-codec-capacity.mjs` coverage to the installed package hull with the most slots, every slot fitted and every supported modelled field populated, asserting the produced value stays within 500 characters including `b.`, in `scripts/build-link-codec-capacity.test.mjs`
- [x] T106 [P] Verify search, filter and sort over the complete installed hull catalogue, working-build restoration before interactivity, autosave coalescing and sub-50 ms codec encode/decode against the plan's performance goals in `e2e/performance.spec.ts`
- [x] T107 Confirm the built asset tree contains no `.design/` mock data or assets, no Google Fonts request and no `/b/<name>#h=…` sample link, and record the reconciliation outcome in `specs/001-ship-selection-and-loading/design/reference-review.md`
- [x] T108 [P] Document the working-record retention limit, owned key space, supported record versions and published link versions in `docs/persistence-and-links.md`
- [x] T109 Close the feature 004 SLEF integration by replacing the placeholder fallback with the delivered export action in `src/app/application/build-link/slef-fallback.port.ts` and its workspace wiring (depends on T093, feature 004) — delivered by `src/app/application/slef/slef-fallback.adapter.ts` and provided as `SLEF_FALLBACK_PROVIDER` in `app.config.ts` — superseded 2026-08-26: the "not available yet" default was retired once feature 004 shipped, because the shell it existed for cannot be built (there is one `ApplicationConfig`), so the token is simply provided at the root
- [x] T110 Run `pnpm run check` and execute every scenario in `specs/001-ship-selection-and-loading/quickstart.md`, confirming at least 80% statements, branches, functions and lines with no skipped or quarantined test

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies beyond feature 011 having landed; can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all three user stories. T021/T022 establish
  and test package-populated fixed mounts for feature 002 T009 to consume without another repair
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
3. Coordinate only on `src/app/i18n/locales/en.json`, `src/app/i18n/locales/de.json` and `src/app/features/build-workspace/build-workspace.page.ts`, which US2 and US3 both touch

---

## Phase 7: Reference Composition

**Goal**: each screen composes the reference canvas's arrangement, not merely its palette. Raised
with feature 011's Phase 7, which supplies the extracted vocabulary these tasks assemble.

- [x] T111 Record each screen's canvas parts — chrome, region split, toolbar, headers, rows, markers, facts, actions and empty state — in the "Reference composition" section of `design/hull-catalogue.md`, `design/hull-detail.md`, `design/build-library.md` and `design/build-workspace.md` (depends on 011 T101)
- [x] T112 Compose canvas 1a's wide shipyard in `src/app/features/ship-catalogue/`: the manifest region against a fixed inspector rail carrying its own ground behind an amber hairline (depends on T111, 011 T106)
- [x] T113 Compose canvas 1a/1b's manifest rows in `src/app/ui/components/catalogue-view/` and `src/app/ui/components/hull-summary-card/`: row plates, the leading marker, tracked condensed hull names and monospace facts (depends on T111, 011 T106)
- [x] T114 Compose canvas 1a's inspector and canvas 1b's detail screen in `src/app/features/hull-detail/`: artwork plate, display identity, ruled metric grid, section rules and the filled hull action (depends on T111, 011 T106)
- [x] T115 Compose canvas 1a's library modal and canvas 1b's library screen in `src/app/features/build-library/` and `src/app/ui/components/saved-build-card/` (depends on T111, 011 T106)
- [x] T116 Compose canvas 1c's command identity and its save and export dialogs in `src/app/features/build-workspace/` and `src/app/ui/components/share-link-panel/` (depends on T111, 011 T106)
- [x] T117 Replace the negative-only reconciliation in `design/reference-review.md` with both halves of quickstart Scenario 10: the built-output checks and a part-by-part composition table (depends on T112, T113, T114, T115, T116)
- [x] T118 Run `pnpm run check` and fix every divergence across the ten Playwright projects (depends on T117)

### Phase 8: Nothing the design does not draw

**Goal**: the screens carry what the reference draws and nothing else. Phase 7 composed the
reference's arrangement but kept additions beside it — a folded facet panel, a second page heading,
a back link, spelled-out codes, a labelled selection — and those additions were rejected on
2026-08-21. Every removal that collides with a stated requirement is recorded in the screen's own
design file rather than made silently.

- [x] T119 Strip `src/app/ui/components/collection-toolbar/` to canvas 1a's search field and size strip, add canvas 1b's compact sort chips, and remove the manufacturer, hardpoint, price, order and constraint controls with the facade's constraint-view surface (`constraints`, `removeConstraint`, `clearConstraints`)
- [x] T120 Record the FR-002 collision in `design/hull-catalogue.md` — what the reference draws, what was withdrawn, what remains on the facade and what is left open (depends on T119)
- [x] T121 Move the screen's name and its one count into the command bar in `src/app/ui/components/app-frame/`, publish them through `LocaleStore.page()` and the new `ScreenChrome`, drop `AppFrame`'s product name and the current screen's own navigation entry, and remove the duplicate `h1`, description and count from all four routes
- [x] T122 Strip `src/app/features/hull-detail/` to canvas 1a's rail: artwork, identity line, five figures, mount chips, one price, the hull action and canvas 1b's back arrow — no disclosures, no framing prose, no slot layout
- [x] T123 Record the FR-004 collision in `design/hull-detail.md`, including what `hullDetailFacts` still computes and where `SlotLayout` is likely to land (depends on T122)
- [x] T124 Draw canvas 1a/1b's manifest values as the reference draws them: the amber lozenge in its own marker column, `LRG`/`MED`/`SML`, `2H 2L 1M 2S`, prices in Mcr — each shortened code carrying its spelled-out form for readers, and the selection marked rather than labelled
- [x] T125 Run `pnpm run check` and fix every divergence across the ten Playwright projects (depends on T119, T121, T122, T124)

---

## Phase 9: Second design pass — the reference's own words and figures

**Goal**: close the twelve differences raised on 2026-08-21 after the canvas was updated. Phase 8
composed what the reference draws; this phase makes the screen use the reference's own strings,
figures, controls, indicators and assets rather than paraphrases of them, and narrows FR-004 to
what the drawing carries.

- [x] T126 Narrow FR-004 in `spec.md` and rewrite `src/app/domain/catalogue/hull-facts.ts` to the reference's eight figures — dropping heat capacity and dissipation, reserve fuel, the rotation rates, the zero-pip endpoints and the viewing condition, and adding hardness, crew and mass lock to the metric grid
- [x] T127 [P] Delete `src/app/ui/components/slot-layout/` with its preview and tests, and the slot ledger from `HullDetailFacade`: the reference puts a slot layout in canvas 1c's outfitting ledger, not on hull selection (depends on T126)
- [x] T128 Replace every invented string in `src/app/i18n/locales/{en,de}.json` with the reference's own — `48 SHIPS`/`8 OF 48 SHIPS`, the search placeholder, `SIZE`, `SPEED`, `SHIELD`, `ARMOUR`, `BUILD STOCK HULL` — and remove the drawn search label, the drawn size legend, the "hull points" unit and the `Build` navigation chip the reference draws on no artboard
- [x] T129 [P] Add canvas 1a's `ALL` segment and make the strip exclusive, so a pad class replaces the one in force rather than adding to it
- [x] T130 [P] Paint canvas 1a's `▲`/`▼` caret and amber on the column the manifest is ordered by, and set the mount mix and the price hard against the trailing edge
- [x] T131 Freeze the command bar, the toolbar and the column headers while the manifest scrolls, and keep the inspector rail with the hull it describes — offsets derived from the target baseline and the region's own padding, released on a short viewport
- [x] T132 [P] Let a placement colour a game noun: `GameText` inherits its colour so the hull name takes canvas 1a's amber on the inspector and on a selected row
- [x] T133 Rasterise the package illustrations to PNG with `scripts/convert-ship-artwork.mjs`, commit them under `public/assets/ships/`, and draw the loading mark inside the artwork plate from a same-origin copy of EDAssets' loader rather than as a line of prose under it
- [x] T134 Run `pnpm run check` and fix every divergence across the ten Playwright projects (depends on T126, T128, T129, T130, T131, T133)

---

## Phase 10: Third design pass — narrowing FR-002 and settling the manifest

**Goal**: close the nine differences raised on 2026-08-21 after the second pass. FR-002 is narrowed
to the two controls the reference toolbar draws and everything behind the withdrawn facets is
deleted; the manifest stops re-measuring itself; and the remaining figures, strings and states are
brought to the drawing.

- [x] T135 Narrow FR-002 in `spec.md` and delete the withdrawn facets: `CatalogueFilters` becomes `{ query, sizes }`, and `PriceRange`, `manufacturersIn`, `ActiveConstraint`, `withoutConstraint` and `src/app/domain/catalogue/catalogue-constraints.ts` go with the controls that were never drawn
- [x] T136 Match each word of a search separately across the facts a hull shows, so `lakon asp` finds the hull that is both, in `src/app/domain/catalogue/catalogue-query.ts` with unit and journey tests (depends on T135)
- [x] T137 [P] Carry the shipyard's own size in the command bar — canvas 1a's `48 SHIPS`, narrowed or not — and leave the match count to the polite live region
- [x] T138 Hold canvas 1a's column track list: `table-layout: fixed` with the reference's shares on the header cells, so narrowing the manifest cannot shuffle the headings sideways
- [x] T139 [P] Bring the row to the reference's height by paying its block padding once, on the open action, rather than twice; and stop `HARDPOINTS` wrapping by dropping the second helping of inline padding inside the sort control (depends on T138)
- [x] T140 [P] Paint over the sticky seam between the toolbar and the column headers, which a fractional device pixel ratio rounds apart
- [x] T141 [P] Name the pad class as a pad class on the identity line — `LARGE LANDING PAD` — through a new `hullDetail.landing-pad` message
- [x] T142 [P] Draw every figure in the metric grid whole: `400`, not `400.0`, and delete `HullFact.fractionDigits`
- [x] T143 [P] Hide the illustration while the next one is on its way, so the plate carries the loader alone rather than the previous hull
- [x] T144 Run `pnpm run check` and fix every divergence across the ten Playwright projects (depends on T135, T136, T137, T138, T139, T141, T142, T143)
- [x] T145 Stop the frozen chrome travelling: start the manifest one row gap early so its header rests where it freezes, and run the inspector rail's ground up to the command bar so it does the same
- [x] T146 [P] Draw the manifest's column headers in the reference's capitals — no engine inherits `text-transform` into a control, so the base reset states it — in the canvas's own 0.52 ink
- [x] T147 Reserve the inspector's track at the wide composition, so opening the first hull does not reflow the manifest under the cursor. The empty inspector is still not drawn (hull-catalogue design, "The inspector's track is reserved"; Commander request 2026-08-25)

---

## Phase 11: A record for every build, and the library the canvas draws

**Goal**: close the two Commander corrections raised on 2026-08-25 after the reserved-track ruling.
Autosave stops being one record per tab that the next build writes over and becomes one record per
build, minted by the page that writes it and never a named one, which withdraws the replacement
question from every ingress path while leaving a named save exactly where its Commander put it; and
`/builds` stops being a grid of cards on a plain page and becomes the surface both canvases draw.

`spec.md` (FR-008 to FR-013), `contracts/persistence.md`, `contracts/build-link.md`,
`contracts/routes-and-ui.md`, `data-model.md`, `quickstart.md` and the four design records were
revised on 2026-08-25 and are the specification these tasks build to. The clarification session of
the same date settled two of them: an ingress identical to a stored unnamed record takes it over
rather than duplicating it, and the twenty-record count limit is replaced by a seven-day expiry that
a name stops. No requirement id is minted:
the coverage ledger registers ids against journeys that exist, so the change is amendments inside
FR-008, FR-009, FR-010, FR-012 and FR-013.

### A record for every build (FR-008, FR-009)

- [x] T148 Mint a record per build rather than per tab, reusing rather than duplicating: wherever a record is taken for a build, at commit or at the first edit that forks one, an unnamed record already holding identical modelled state is taken over instead of a second copy being written. The comparison is the serialized snapshot, taking a record over does not touch `modifiedAt`, and records that already exist are never merged by a later edit (clarification 2026-08-25). `commit` in `src/app/application/active-build/active-build.store.ts` mints a fresh unnamed record identity for a candidate that has none, `src/app/application/build-library/autosave.service.ts` writes only to that identity, and `TabDescriptorV1` carries it alongside the record the build was opened from (data model, "ActiveBuildState"; persistence contract, "Autosaved records")
- [x] T149 Fork on first edit, not on open, in `src/app/application/build-library/record-open.service.ts` and `autosave.service.ts`: opening a record writes nothing and holds it as `sourceNamed`, and the first modelled edit mints an unnamed record and directs every write there. Assert in a unit test that a named record's bytes are unchanged by opening it and unchanged by editing it (depends on T148)
- [x] T149a Refuse a named record as an autosave target in `src/app/application/build-library/autosave.service.ts`, whatever the page is holding, so a record named in another tab or arriving from before this ruling cannot be written by a coalesced edit (depends on T149)
- [x] T150 Consume the unnamed record on manual save in `src/app/application/build-library/named-record.service.ts`: naming it writes `name` onto that same key and flips `kind` under its own lock — same id, fresh `revisionId`, nothing left behind — while writing the build into the record it came from writes that record under its lock and only then `removeItem`s the unnamed one, so a failed write never leaves the build without a copy. "Save as a copy" mints a record and leaves the original where it is (depends on T148)
- [x] T150a Say what the save choices now do in `src/app/features/build-library/save-build.dialog.*` and both locale catalogues: "overwrite existing" replaces the saved version and discards the unsaved entry these edits were in, "save as new" keeps both (depends on T150)
- [x] T151 Withdraw the replacement question: delete `ReplacementConfirmer`, the `dirty()` gate and the `setConfirmer` seam from `src/app/application/active-build/replacement-coordinator.ts`, its dialog wiring in `src/app/app.ts`, and `workspace.replace.*` from both locale catalogues. Rename the coordinator for what it now does — construct, commit once, notify — and delete `src/app/domain/build/replacement-policy.ts` if nothing reads the fingerprint after T148 (depends on T148, T149)
- [x] T152 [P] Announce each newly minted autosave record from `src/app/application/build-library/tab-ownership.coordinator.ts`, not only the one claimed at start, so a cloned `sessionStorage` still forks before either page writes. Two pages holding one named record open is no longer a collision and must not fork (FR-012) (depends on T149)
- [x] T152a [P] Add the clock port `src/app/platform/browser/clock.adapter.ts` with its unit tests, and replace `AutosaveService.now` — a public mutable field a test assigns — with it, so the one place that stamps an instant and the one that reads a deadline share a seam. Every other injected browser API already has one (plan, "Revision 2026-08-25")
- [x] T153 Replace the count limit with the seven-day expiry in `src/app/application/build-library/retention.service.ts`: the deadline is `modifiedAt` plus seven days read through the clock port and derived rather than stored, the sweep runs at application start and on every listing read, it skips named records and any record a live page announces as its autosave target, and it says nothing when it has run. Delete the `retention-limit` persistence status with the limit it reported (FR-013, clarification 2026-08-25) (depends on T150, T152a)
- [x] T153a State an unnamed record's remaining life on its own row, with naming offered from the row, so the one removal a Commander did not press is the one they can see coming (FR-010, FR-013) (depends on T153, T159)
- [x] T153a1 [P] Add the relative-time formatter the countdown needs to `src/app/i18n/formatters/formatters.ts` with unit tests: `Intl.RelativeTimeFormat` in the committed locale, with its unit label translated where `Intl` has none. The layer has an absolute date formatter and no relative one, and a count of days assembled in a template would be the untranslatable string principle VI forbids (depends on T153)
- [x] T153c [P] Clear the workspace to its no-build state when the Commander deletes the record this page is autosaving into, in `src/app/features/build-library/build-library.page.ts` and `src/app/application/active-build/active-build.store.ts`, and keep `record-deleted-externally` for a deletion another page made — the build stays, autosave pauses, resuming is explicit (FR-009, FR-012, clarification 2026-08-25) (depends on T148)
- [x] T153b [P] Keep the quota path and separate it from expiry in `src/app/ui/components/record-manager/`: a full quota still removes nothing until the Commander selects records, and expiry is never offered as a way out of one. An edit that cannot fork because the quota is full leaves the named record it came from untouched (depends on T153)
- [x] T154 [P] Rename the deliberate-write lock from `edsb:named:<record-id>` to `edsb:record:<record-id>` in the lock-name builder in `src/app/platform/storage/storage-keys.ts`, its callers in `src/app/application/build-library/`, and their tests: it guards any record now, and a Web Locks name is not stored bytes
- [x] T155 Say "unnamed", not "working", in `src/app/i18n/locales/{en,de}.json` and in every view model that carries the word to a Commander, and name the record an unnamed one was forked from on its library row, so unsaved edits to a saved build read as what they are (depends on T150)
- [x] T155a [P] Title an unnamed row from the build rather than from a word: its ship name, else its ident, else the hull, read each time the row is drawn, never written onto the record, and set apart from a Commander-given name (FR-010, clarification 2026-08-25). The workspace command bar titles an unnamed build the same way (depends on T155, T159)
- [x] T156 Rewrite `e2e/build-working-state.spec.ts` and the `001/FR-007`, `001/FR-008` and `001/FR-009` assertion lines in `e2e/coverage-ledger.ts` around the new behaviour — four builds in a row leave four records, no ingress asks anything, opening a save writes nothing to it, editing one forks, naming leaves the count unchanged and overwriting returns it to where it was — and move `001/FR-009` off the `ships/:symbol/create-stock-build` surface, which no longer carries a dialog (depends on T151, T150a)

### The library the canvas draws (FR-010, FR-013)

- [x] T157 Give `/builds` the reference's frame: compose `src/app/ui/components/layer/` in `src/app/features/build-library/build-library.page.html` as canvas 1a's centred dialog over an inert originating screen and canvas 1b's full-screen layer, with the title bar's `SAVED BUILDS` and monospace dismiss, and keep the route addressable and in history
- [x] T158 Add the header row the reference draws — one search field over the records beside a monospace record count — with the count leaving the command bar for it, and narrow the listing over the fields a row shows, announced politely (depends on T157)
- [x] T159 Replace the card grid with the reference's rows: `BUILD` / `HULL` / `Mcr` / `EDITED` column headers on their own plate over one scrolling body, the name over a one-line note, and the hull, cost and edited-at in monospace, in `src/app/ui/components/record-list/` and `src/app/ui/components/saved-build-card/` (depends on T157)
- [x] T160 [P] Draw the 3px leading marker on every row and fill it amber with the leading-edge wash on the record the workspace holds, carried in words and in `aria-current` as well as in the wash (depends on T159)
- [x] T161 [P] Replace the per-row `StatusNotice` with the reference's monospace issue count on its warm plate, keeping the recorded validation state in words (depends on T159)
- [x] T162 [P] Give the surface the committing footer both canvases draw — the destructive action bordered warm on the leading edge, the opening action filled amber on the trailing edge — pinned at the compact composition (depends on T157)
- [x] T163 Register the library surface's search, no-match, current-record and expiring states in `e2e/coverage-ledger.ts`, restate the `001/FR-013` assertion lines around expiry rather than a count, and assert the frame, header, columns, marker, badge and footer in `e2e/design-reference.spec.ts` and `e2e/build-library.spec.ts`. Seed record ages through the storage port rather than waiting (depends on T158, T159, T160, T161, T162, T153a)
- [x] T164a [P] Bring `docs/persistence-and-links.md` to the new record model: it still documents `edsb:tab` as the working record a tab owns and a `WORKING_RECORD_LIMIT` of twenty with what happens at the twenty-first. Replace both with the record-per-build model, the three removal causes and the seven-day expiry; the owned key space and the published record and link versions are unchanged (depends on T153)
- [x] T164 Cover every new and changed state in `src/app/ui/previews/preview-manifest.ts` — current record, unsaved edits to a saved build, searched, no match, issue badge, retention with naming offered — at desktop, tablet and mobile widths (depends on T159, T163)
- [x] T165 Run `pnpm run check` and fix every divergence across the ten Playwright projects, then walk `quickstart.md` scenarios 2, 3, 4, 5, 7 and 10 (depends on T148, T149, T149a, T150, T150a, T151, T152, T152a, T153, T153a, T153a1, T153b, T153c, T155, T155a, T156, T157, T158, T159, T163, T164, T164a)

Two parts of that gate could not be answered in the development container, and
both were checked far enough to say why rather than left as a pass:

- The five Firefox projects cannot run: `npx playwright install firefox` fails
  against the proxy and no binary is present. The five Chromium projects run
  clean (2843 passed), and the offline suite runs clean on all five Chromium
  projects (75 passed). CI is where the Firefox half is answered.
- `e2e:timing`'s candidate-search budget fails here on the first two keystrokes
  (194.9, 201.2 ms against 100 ms) and fails the same way on this feature's
  merge base (193.9, 229.4 ms), so it measures this container rather than
  anything in this feature. The keystrokes after the cold render are inside the
  budget in both.

---

## Notes

- [P] tasks touch different files and have no dependency on incomplete work
- Every game-bearing value comes from `@elite-dangerous-almanac/core`; no task adds a local hull fact, calculation or replacement rule
- Every browser API is reached through an injected port so domain behavior stays render-free and testable
- Candidate-first is absolute: no loader mutates active state before its candidate has parsed, constructed and validated
- Since 2026-08-25 exactly three things remove a record — a confirmed deletion, the manual save that consumes the unnamed record it saved from, and the seven-day expiry of an unnamed record that its own row stated beforehand — and autosave never writes to a named record at all
- Qualified WCAG 2.2 AA conformance wording (naming the excluded criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11) is enforced repository-wide by feature 011 T093; this feature adds no separate assertion
- T151 kept the fingerprint module rather than deleting it, and renamed it: `isDirty` is what T148
  made autosave's own trigger, so `src/app/domain/build/replacement-policy.ts` is now
  `src/app/domain/build/build-fingerprint.ts`. `ReplacementCoordinator` became
  `BuildIngressCoordinator`, and the layer ledger row for the withdrawn confirmation was removed from
  `e2e/coverage-ledger.ts` and from feature 012's screen inventory, which transcribes it
- Commit after each task or logical group; stop at any checkpoint to validate a story independently
