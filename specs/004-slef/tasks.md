---
description: 'Task list for SLEF Import and Export'
---

# Tasks: SLEF Import and Export

**Input**: Design documents from `/specs/004-slef/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [design/](./design/),
[quickstart.md](./quickstart.md)

**Tests**: Test tasks are included. Every contract in this feature names its own verification, the
specification gates delivery on SC-001–SC-004, and constitution principle VIII gates the build on
unit coverage, the ten-project Playwright matrix and automated accessibility scans.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested and
demonstrated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Every task names the exact file it changes

## Path Conventions

Single Angular workspace at the repository root: framework-agnostic import/export coordinators in
`src/app/domain/slef/`, signal store and coordinators in `src/app/application/slef/`, browser and
build-time adapters in `src/app/platform/`, surfaces in `src/app/features/slef/` and the feature 001
hosts that compose them, shared primitives and previews in `src/app/ui/`, messages in
`src/app/i18n/`, end-to-end suites in `e2e/`, repository policy checks in `scripts/`. Unit tests live
beside their source as `*.spec.ts`.

## Delivery gates

Feature 004 owns no format, no game calculation and no active-build transition. Three gates apply and
are named on the tasks they block:

- **Repository prerequisites**: feature 011 (strict compiler and template settings, tokens,
  localization, formatters, canonical game-text disclosure, announcement primitives, shared
  modal/sheet/field/notice/action components, preview manifest, ten Chromium/Firefox projects, axe
  helper), feature 001 (`/ships`, `/ships/:symbol`, `/build`, `/builds` hosts, `ActiveBuildStore`,
  `ReplacementCoordinator`, working-record autosave, fixed-mount provenance metadata, certified
  current-revision canonical link, `slef-fallback.port.ts`) and feature 002 (the shared
  `build-ingress-normalizer.ts` and its `SourcePartialEngineering`/`IngressResult` contract, plus the
  history reset on accepted ingress).
- **Pinned package**: `@elite-dangerous-almanac/core@0.1.3` leaf subpaths `ships/slef`,
  `ships/ship-loadout`, `ships/modules` and `i18n/diagnostics`. A package regression is raised
  upstream and waited on — never compensated for locally.
- **Release evidence**: SC-001 independent-consumer acceptance is a release gate recorded in
  `specs/004-slef/validation/consumer-compatibility.md`, not an implementation shortcut.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Pin the package behaviour this feature composes and create the source and test locations
before any coordinator lands.

- [ ] T001 Pin the Almanac 0.1.3 SLEF behaviour this feature composes — `inspectSlef` accepting one envelope, a one-element array and a bare journal `Loadout` as one valid entry, `[]` as zero, mixed input as one entry plus one indexed diagnostic and malformed JSON as a thrown `SyntaxError`; frozen `SlefDiagnostic` `index`/`path`/`code`/`constraint`/`params`/`message`; `getSlefDiagnosticMessage` returning canonical English and `null` outside English; `ShipLoadout.fromLoadout(entry.data)` unknown-hull refusal with structured empty/default outcomes for unresolved removable and fixed modules; `completeEngineeringGrade` returning `normalized`/`unsupported`/`unchanged`; `repairFixedMount` returning `repaired`/`defaultUnavailable`/`refused`; and `toSlefString({ moduleOrder, explicitPower, indent, header })` emitting exactly one entry — using leaf subpath imports in `src/app/domain/slef/almanac-slef-contract.spec.ts`
- [ ] T002 [P] Create the feature source skeleton `src/app/domain/slef/`, `src/app/application/slef/`, `src/app/platform/build/` and the `src/app/features/slef/` subdirectories `export-build-layer/`, `import-build-layer/` and `import-outcome/` per plan.md
- [ ] T003 [P] Create the two feature suites `e2e/slef-export.spec.ts` and `e2e/slef-import.spec.ts` importing the feature 011 axe and assertion helpers, and register the import layer, shared replacement confirmation, import outcome, export-unavailable host state and export layer surfaces from `specs/004-slef/design/screen-inventory.md` in `e2e/coverage-ledger.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Publish the workflow models, the store and presenter both layers read, the shared
technical-text primitives neither layer may invent locally, and the boundary rules that keep feature
004 out of feature 001 and 002 code.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define `SlefImportDraft`, the `SlefPackageDiagnostic` projection, the ten-member `SlefImportFailure` union (`tooLarge`, `empty`, `syntax`, `cardinality`, `diagnostics`, `unknownHull`, `construction`, `normalizationUnsupported`, `correlationFailure`, `packageContractFailure`), the terminal `superseded`/`cancelled` no-op outcomes, `SourceFixedMount`, `EngineeringQualityCompletion`, `FixedMountNormalizationOutcome`, `SlefImportCandidate` and `SlefImportOutcome` in `src/app/domain/slef/slef-import.models.ts`, importing `SourcePartialEngineering` from feature 002's `src/app/domain/build/build-ingress-result.ts` and `IngressIdentityNormalisationOutcome` from feature 001's `src/app/domain/build/ingress-normalisation.ts` and defining no second copy of either
- [ ] T005 [P] Define `ActiveExportSnapshot`, `SlefExportArtifact`, `DeliveryCapability` and the per-action `DeliveryOutcome` union in `src/app/domain/slef/slef-export.models.ts`, with the fixed safe `.slef.json` filename constant and the `application/json;charset=utf-8` MIME constant
- [ ] T006 [P] Implement the test fixture builder that discovers the pinned package's maximum-slot hull at test time and fits every slot with every supported modelled field — enabled state, zero-based priority, ordinary and identified pre-engineered blueprints with effects, ship name and ident — through package APIs only, in `src/app/domain/slef/testing/max-slot-fixture.ts`
- [ ] T007 Implement `SlefStore` — import draft, draft byte count, import status, request token, current export artifact, delivery capability, per-action delivery status and layer/mode state — owning no `ShipLoadout`, no committed build and no storage key, in `src/app/application/slef/slef.store.ts` with unit tests proving every field is session memory only (depends on T004, T005)
- [ ] T008 Implement `SlefPresenter` mapping store state to immutable localized view models and accepting only the typed intents named in `contracts/routes-and-ui.md` — edit draft, clear, submit, cancel/close, accept/cancel replacement, dismiss outcome, select mode, generate/retry, select payload, copy, download, share — in `src/app/application/slef/slef.presenter.ts` with unit tests (depends on T007)
- [ ] T009 [P] Register the `slef` message namespace with its canonical English seeds — layer headings and descriptions, byte/limit framing, app-owned syntax and cardinality framing, delivery statuses, outcome group headings, action names and announcement summaries — in `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T010 [P] Extend the shared library with the labelled monospaced multiline technical-text field supporting editable and readonly modes, programmatically associated description, byte/limit metadata and error relationship, and bounded internal wrapping/overflow, in `src/app/ui/technical/technical-text-field.ts` with unit tests and default/populated/empty/invalid/readonly/disabled preview declarations
- [ ] T011 [P] Extend the shared library with the semantic structured diagnostic list rendering entry index, direction-isolated path, code, constraint and reason as list semantics with no colour-only state, in `src/app/ui/technical/diagnostic-list.ts` with unit tests and empty/single/many/long-identity preview declarations
- [ ] T012 Add the feature 004 boundary rules to `scripts/check-interface-foundations.mjs` — no `src/app/domain/build/`, `src/app/application/active-build/`, `src/app/application/build-link/` or feature 001/002 component imports feature 004; no `src/app/features/slef/` component imports `@elite-dangerous-almanac/core`, `TextEncoder`, `navigator`, `Blob`, `URL` or a store/persistence module; Almanac access is restricted to the four pinned leaf subpaths with no broad barrel import; and feature 004 declares no storage key — with positive and negative fixtures in `scripts/check-interface-foundations.test.mjs`

**Checkpoint**: Models, store, presenter, shared technical primitives, messages and boundary rules
exist — both user stories can begin.

---

## Phase 3: User Story 1 - Export a build (Priority: P1) 🎯 MVP

**Goal**: An active build becomes exactly one current-catalogue-retail SLEF entry generated by the
package, bound to the exact active revision, disclosed with its package validation, and handed to the
Commander through selectable text, Download, Copy and capability-gated Share without any application
network request or fabricated success.

**Independent Test**: Open an active `/build` workspace, choose Export and select SLEF mode, then run
the export unit suite plus `pnpm run e2e -- slef-export.spec.ts`: the payload inspects as one entry
with zero diagnostics, credit figures match current package catalogue retail, `appURL` appears only
for a certified same-revision link, an invalid or incomplete build still exports with a visible
warning, a modelled edit invalidates the artifact before any delivery, Copy reports `copied` only
after the Clipboard promise resolves, Download reports dispatched rather than saved, Share is absent
when `navigator.share` is not callable, and no request leaves the origin.

### Tests for User Story 1

- [ ] T013 [P] [US1] Add export generation tests asserting exactly one `toSlefString` call with `moduleOrder: 'fitted'`, `explicitPower: false`, `indent: 2` and the build-time header; a payload that inspects as one entry with zero diagnostics; preserved false enabled state, priority zero, ship name and ident; and no application parsing, field deletion or substitution of package output, in `src/app/domain/slef/slef-export.spec.ts`
- [ ] T014 [P] [US1] Add current-retail credit tests proving hull and fitted-module credits, rebuy and totals come from the package's default catalogue-retail calculation after engineering, symbol replacement/removal and fixed repair, that unpriced entries remain absent or lower-bound exactly as reported, that `UnladenMass`, `CargoCapacity`, `FuelCapacity` and `MaxJumpRange` are package values rather than echoed source claims, and that no captured or historical purchase value is requested, read, retained or compared, in `src/app/domain/slef/slef-export-pricing.spec.ts`
- [ ] T015 [P] [US1] Add artifact lifecycle tests for revision keying, synchronous invalidation on a modelled edit or replacement, delivery refusal of a stale artifact, failure and cancellation never regenerating or clearing it, and invalid/incomplete package validation never disabling generation or delivery, in `src/app/application/slef/slef-export-artifact.spec.ts`
- [ ] T016 [P] [US1] Add delivery tests over fake ports proving `copy` returns `copied` only after Clipboard promise resolution and never calls `document.execCommand`; `download` produces the exact payload bytes with the fixed `.slef.json` filename and JSON UTF-8 type, revokes its object URL, removes any temporary anchor and reports `dispatched` or `setupFailed` but never saved; and `share` is offered only when `navigator.share` is callable, prefers a `File` only when `canShare({ files })` returns true, performs no asynchronous preparation before the call, maps `AbortError` to `cancelled` and never retries or selects a target, in `src/app/application/slef/slef-delivery.coordinator.spec.ts`
- [ ] T017 [P] [US1] Add the export round-trip contract test that inspects the generated string, reconstructs through the package, exports again and compares hull, slot/module identity and order, ordinary and identified pre-engineering, completed grade and effect, enabled state, priority, name/ident, current retail and package-derived module integrity — permitting identity casing, header/whitespace and derived-figure recomputation or omission, and excluding capture-only `timestamp`, `ShipID`, per-module `Health`, `Hot`, ammunition and engineer/blueprint provenance from application-model equality — in `src/app/domain/slef/slef-export-roundtrip.spec.ts` (depends on T006)
- [ ] T018 [P] [US1] Add export layer component tests covering generating, ready valid, ready invalid/incomplete, link included, link omitted, revision invalidated, copy working/copied/failed, download dispatched/setup failed and share hidden/file/text/working/shared/cancelled/failed, asserting the component emits intents only and calls no package, state or browser API, in `src/app/features/slef/export-build-layer/export-build-layer.spec.ts`
- [ ] T019 [P] [US1] Add the export journey covering an active build reaching the layer, SLEF mode selection, valid, invalid and incomplete builds, the always-present selectable payload and Download, a denied Clipboard followed by a successful Download of identical bytes, and every mocked Share outcome, in `e2e/slef-export.spec.ts`

### Implementation for User Story 1

- [ ] T020 [US1] Implement build-time application identity — stable application name and the root `package.json#version` resolved at build time with no runtime configuration request and no copied mock version — in `src/app/platform/build/application-metadata.ts`, wiring the value through the `angular.json` production and development configurations, with unit tests
- [ ] T021 [US1] Implement `generateSlefExportArtifact(snapshot)` making exactly one package `toSlefString` call with the frozen options and header and returning the immutable artifact with exact payload, `TextEncoder` byte count, package fitted-module count, fixed filename, MIME type and package validation snapshot, in `src/app/domain/slef/slef-export.ts` (depends on T005, T013, T020)
- [ ] T022 [US1] Implement the `appURL` rule including feature 001's certified same-origin canonical link only when it is present and certified for exactly this revision, omitting absent, pending, refused, stale and noncanonical link state, and invoking neither the build-link codec nor any base-URL construction, in `src/app/domain/slef/slef-export.ts` with unit tests for every omission reason (depends on T021)
- [ ] T023 [US1] Implement artifact ownership in the store — read feature 001's atomic `ActiveExportSnapshot`, hold at most one artifact, invalidate it synchronously when the active revision changes and refuse generation with no active build — in `src/app/application/slef/slef.store.ts` (depends on T007, T021)
- [ ] T024 [P] [US1] Define and implement the clipboard port and adapter exposing async `writeText` only, in `src/app/platform/browser/clipboard.port.ts` and `src/app/platform/browser/clipboard.adapter.ts` with unit tests
- [ ] T025 [P] [US1] Define and implement the download port and adapter creating the exact-bytes Blob, object URL and temporary anchor, triggering the download and revoking/removing both, in `src/app/platform/browser/download.port.ts` and `src/app/platform/browser/download.adapter.ts` with unit tests
- [ ] T026 [P] [US1] Define and implement the share port and adapter exposing callable-`navigator.share` detection, `canShare({ files })` detection and a direct in-activation `share` call, in `src/app/platform/browser/share.port.ts` and `src/app/platform/browser/share.adapter.ts` with unit tests
- [ ] T027 [US1] Implement `DeliveryCapability` detection returning clipboard available/unavailable, download always available and share `file`/`text`/`unavailable` from feature detection alone, never from viewport or user-agent, and never authorizing an automatic action, in `src/app/application/slef/delivery-capability.ts` with unit tests (depends on T024, T025, T026)
- [ ] T028 [US1] Implement `SlefDeliveryCoordinator` rechecking revision equality before every action, consuming the one artifact without regenerating it, and mapping each port result to the exact `DeliveryOutcome` status with a stable app-owned reason instead of raw DOM exception prose, in `src/app/application/slef/slef-delivery.coordinator.ts` (depends on T023, T027)
- [ ] T029 [US1] Implement the SLEF export layer content — layer heading and description, safe package hull/name summary, package validation summary with non-suppressing invalid/incomplete warning, labelled readonly selectable monospaced payload composed from `src/app/ui/technical/technical-text-field.ts`, localized one-entry/fitted-module/byte metadata, link included-or-omitted explanation, always-present Download and Copy and feature-detected Share — in `src/app/features/slef/export-build-layer/export-build-layer.ts` (depends on T010, T018, T028)
- [ ] T030 [US1] Implement the layer's available-space responsive presentation — contained dialog when content fits, ordinary narrow-portrait bottom sheet, and full-height vertically scrollable layer for short landscape, expanded/RTL copy, 200% text or 400% zoom — with wrapping/stacking action groups, bounded JSON overflow and no document horizontal overflow, in `src/app/features/slef/export-build-layer/export-build-layer.scss` (depends on T029)
- [ ] T031 [US1] Compose the accessible Share Link and SLEF mode selector over feature 001's link panel and this feature's SLEF content in `src/app/features/build-workspace/export.dialog.ts`, exposing selected mode state, adding no route or history entry and omitting the reference journal and Markdown modes (depends on T029)
- [ ] T032 [US1] Implement the export-unavailable `/build` host state explaining the active-build prerequisite and offering Import and Create recovery with no layer and no stale artifact, in `src/app/features/build-workspace/build-workspace.page.ts` with unit tests (depends on T023)
- [ ] T033 [US1] Implement feature 001's `slef-fallback.port.ts` contract as the adapter that opens the shared layer in SLEF mode after a link-publication refusal, keeping SLEF export available when link generation fails, in `src/app/application/slef/slef-fallback.adapter.ts` with unit tests (depends on T028, T031)
- [ ] T034 [US1] Implement concise revision-deduplicated delivery announcements that name the action and result and never announce JSON, a filename derived from user data or raw DOM error text, in `src/app/application/slef/slef-announcement.coordinator.ts` with unit tests (depends on T028)
- [ ] T035 [US1] Add the export heading, description, validation-warning, metadata, link-included/omitted, mode-selector, action-name and delivery-status message keys with named byte and count formatters to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json` (depends on T009)
- [ ] T036 [US1] Register the export layer and export-unavailable host preview declarations for generating, ready valid, ready invalid/incomplete, link included/omitted, revision invalidated and every copy, download and share outcome at desktop, tablet and mobile widths plus expanded, RTL and reduced-motion variants in `src/app/ui/previews/preview-manifest.ts` (depends on T029, T032)
- [ ] T037 [US1] Add the export layer, export-unavailable host and delivery-state entries with their FR-001–FR-006, FR-013 and FR-014 ids, journeys, axe flags and named assertions to `e2e/coverage-ledger.ts` (depends on T003, T029)
- [ ] T038 [US1] Add payload exclusion tests proving the artifact carries no local record identity, name or note, no import report, diagnostic, request token or fixed-mount normalization provenance, and that a fixed fill exports only the resulting package module, in `src/app/domain/slef/slef-export-exclusions.spec.ts` (depends on T021)
- [ ] T039 [US1] Add the revision-invalidation journey — generate, edit the build, then attempt Copy, Download and Share and assert each refuses the stale artifact and regeneration produces the new revision's payload — in `e2e/slef-export.spec.ts` (depends on T019, T023)
- [ ] T040 [US1] Assert in the export suite that no application request leaves the origin during generation or delivery, that no real clipboard or share target is invoked, and that mocked ports receive byte-identical payloads, in `e2e/slef-export.spec.ts` (depends on T019)

**Checkpoint**: A Commander can export the active build as one honest, current-retail SLEF entry and
deliver it by selection, download, clipboard or platform share — independently of import.

---

## Phase 4: User Story 2 - Import a build (Priority: P1)

**Goal**: Exactly one pasted SLEF entry or bare journal `Loadout` is measured, inspected, normalized
through the shared ingress boundary and committed by feature 001's single replacement path — or
refused whole with exact package diagnostics, leaving every existing byte of active, stored, linked
and history state unchanged.

**Independent Test**: Open Import from `/ships`, `/ships/:symbol`, `/build` with no build and
`/builds`, then run the import unit suite plus `pnpm run e2e -- slef-import.spec.ts`: a valid entry
becomes the active build at `/build` after the shared confirmation, an oversized payload is refused
before `inspectSlef` is called, zero/multiple/mixed input is refused whole with every diagnostic
retained, an unsupported partial refuses before activation, unknown modules leave no identity in the
build, every failure and cancellation compares byte-equal before and after while preserving the exact
draft, and the accepted revision's outcome reports identity, quality and fixed-mount normalization.

### Tests for User Story 2

- [ ] T041 [P] [US2] Add draft gate tests for 65,536 ASCII bytes accepted, 65,537 bytes rejected, multibyte strings straddling the boundary rejected, more than 65,536 bytes of whitespace returning `tooLarge` rather than `empty`, whitespace-only within limit returning `empty`, the exact untrimmed string reaching inspection, and `inspectSlef` never being called for an over-limit draft, in `src/app/domain/slef/slef-draft-gate.spec.ts`
- [ ] T042 [P] [US2] Add inspection and cardinality tests for one envelope, one-element array and bare journal event each accepted as one observed entry; `[]` as zero; two valid entries, mixed valid/invalid and a sole rejected entry each refused whole; observed count defined as entries plus diagnostics; index zero never silently selected; and a thrown `SyntaxError` classified without parsing its prose, in `src/app/domain/slef/slef-inspection.spec.ts`
- [ ] T043 [P] [US2] Add diagnostic tests proving exact `index`, `path`, `code`, `constraint`, `params` and canonical `message` are retained unrenumbered and unflattened, that text comes from `getSlefDiagnosticMessage(diagnostic, locale)`, that a `null` locale result uses feature 011's canonical-language disclosure, and that no code is privately translated and no package code, path or reason is invented for syntax, unknown-hull or construction failures, in `src/app/application/slef/slef-diagnostic.presenter.spec.ts`
- [ ] T044 [P] [US2] Add ingress ordering tests proving package identity normalization runs first and independently of attached engineering, that fields attached to an unknown module are discarded with it, that only remaining resolved source qualities in `[0, 1)` reach `completeEngineeringGrade`, that absent and quality-1 engineering is never passed to it, that all partials complete before any fixed-mount work, that only source-empty `requiredSlot`/`cargoHatch` mounts are repaired, that construction's cargo restoration is detected by exact before/after comparison and classified `autoRestored`, that `defaultUnavailable` retains an incomplete candidate, and that no calculated value is read before the fixed step completes, in `src/app/domain/slef/slef-import.spec.ts`
- [ ] T045 [P] [US2] Add failure classification tests covering `unknownHull` with exact source hull identity, generic `construction`, `normalizationUnsupported` carrying the exact package code/params and source slot/identity, app-owned `correlationFailure` with expected/observed context and no invented package code, and `packageContractFailure` retaining the structured package result including its `reason` when returned, in `src/app/domain/slef/slef-import-failures.spec.ts`
- [ ] T046 [P] [US2] Add atomicity tests comparing active package loadout and revision, provenance, dirty baseline, normalization metadata, tab working and named record bytes, fragment/history length, published-link state and the undo/redo tape equal before and after every failure, cancellation and supersession, and asserting the exact draft survives each one and that a stale token cannot commit after close, a new submit, a route change or a newer replacement decision, in `src/app/application/slef/slef-import.atomicity.spec.ts`
- [ ] T047 [P] [US2] Add import layer component tests covering empty, editing within limit, over limit, inspecting, syntax, zero/multiple/mixed cardinality, package diagnostic, unknown hull/construction, normalization unsupported, correlation/package failure, candidate ready, awaiting replacement, cancelled/superseded and committed transition, asserting the component owns no loadout, parser, byte counter, package call or replacement decision, in `src/app/features/slef/import-build-layer/import-build-layer.spec.ts`
- [ ] T048 [P] [US2] Add import outcome component tests for no modeled normalization, unknown module emptied/defaulted, quality completed, fixed auto-restored/repaired, default unavailable, retained incomplete/invalid, combined groups, dismissed and revision changed, asserting separately headed groups, dismissal changing presentation only and no source identity reaching build state, in `src/app/features/slef/import-outcome/import-outcome.spec.ts`
- [ ] T049 [P] [US2] Add the import journey covering a bare journal event and a one-entry envelope imported from `/ships`, `/ships/:symbol`, `/build` with no build and `/builds`, each requiring no prior hull and reaching `/build` as working provenance after commit, in `e2e/slef-import.spec.ts`

### Implementation for User Story 2

- [ ] T050 [US2] Implement the byte-first draft gate measuring `new TextEncoder().encode(text).byteLength` against the literal 65,536 limit, returning `tooLarge` with actual and limit bytes before any whitespace or package work, then returning `empty` for a whitespace-only within-limit string without transforming it, in `src/app/domain/slef/slef-draft-gate.ts` (depends on T004, T041)
- [ ] T051 [US2] Implement `inspectSlef(originalText)` invocation through the `ships/slef` leaf and classify a thrown `SyntaxError` into localized app-owned framing without parsing or displaying its prose, in `src/app/domain/slef/slef-inspection.ts` (depends on T050)
- [ ] T052 [US2] Implement the cardinality rule — observed count as `entries.length + diagnostics.length`, acceptance only of exactly one valid entry with zero diagnostics, whole refusal of zero, multiple and mixed input, and retention of every diagnostic beside a cardinality failure — in `src/app/domain/slef/slef-inspection.ts` (depends on T051)
- [ ] T053 [P] [US2] Implement the diagnostic projection retaining exact `index`, `path`, `code`, `constraint`, `params` and canonical `message` without renumbering or flattening, in `src/app/domain/slef/slef-diagnostics.ts` with unit tests (depends on T004)
- [ ] T054 [US2] Implement the diagnostic presenter asking `getSlefDiagnosticMessage(diagnostic, locale)` through feature 011's package-text presenter and falling back to the canonical message with the standard untranslated disclosure on a `null` result, in `src/app/application/slef/slef-diagnostic.presenter.ts` (depends on T053)
- [ ] T055 [US2] Implement source evidence capture recording remaining resolved `SourcePartialEngineering` with exact slot, module symbol, blueprint/experimental identities, grade and finite quality in `[0, 1)`, plus `SourceFixedMount` records for `requiredSlot` and `cargoHatch` slots with their source symbol and resolution — excluding `moduleLimit` — in `src/app/domain/slef/slef-source-evidence.ts` with unit tests (depends on T004, T052)
- [ ] T056 [US2] Implement the SLEF ingress coordinator passing the package-validated entry and captured evidence to feature 002's `src/app/domain/build/build-ingress-normalizer.ts`, constructing the detached candidate through `ShipLoadout.fromLoadout(entry.data)` and implementing no second normalization loop, in `src/app/domain/slef/slef-import.ts` (depends on T055)
- [ ] T057 [US2] Implement partial correlation to the constructed slot and exact module identity followed by `completeEngineeringGrade(slotKey)` for those partials only, treating every non-`normalized` result, missing or mismatched correlation and unexpected `unchanged` as a whole-import refusal before any fixed-mount work, in `src/app/domain/slef/slef-import.ts` (depends on T056)
- [ ] T058 [US2] Implement the source-empty fixed-mount step — detect construction's cargo restoration by exact before/after comparison and classify it `autoRestored`, otherwise call `repairFixedMount()` and retain `repaired`, keep `defaultUnavailable` as an incomplete candidate, and treat `refused` or an unexpected no-op as a package-contract failure — with no application default lookup or substitute fitting, in `src/app/domain/slef/slef-import.ts` (depends on T057)
- [ ] T059 [US2] Read final package validation and issues only after the fixed step completes and assemble the detached `SlefImportCandidate` with its identity outcomes, quality completions, fixed outcomes, validation issue projections, package-validated source attribution and request token, ignoring incoming `appCustomProperties` and `appURL` entirely, in `src/app/domain/slef/slef-import.ts` (depends on T058)
- [ ] T060 [US2] Implement the failure classification mapping for `unknownHull`, `construction`, `normalizationUnsupported`, `correlationFailure` and `packageContractFailure` with exact retained context and no fabricated package diagnostic, in `src/app/domain/slef/slef-import-failures.ts` (depends on T004, T045)
- [ ] T061 [US2] Implement request-token issue, comparison and supersession in the store so a newer submit, cancel, close or route change invalidates an in-flight inspection and a late candidate can never commit, in `src/app/application/slef/slef.store.ts` (depends on T007, T059)
- [ ] T062 [US2] Implement the handoff giving the candidate, token and successful fixed-mount provenance to feature 001's `ReplacementCoordinator`, performing no direct active-state, persistence, URL, provenance or history mutation, in `src/app/application/slef/slef-import.coordinator.ts` with unit tests (depends on T059, T061)
- [ ] T063 [US2] Add delegation tests proving acceptance produces exactly one feature 001 replacement, one working autosave, one link synchronization, one feature 002 history reset and the `/build` navigation only when the host is not already the workspace, and that feature 004 performs none of those effects itself, in `src/app/application/slef/slef-import.coordinator.spec.ts` (depends on T062)
- [ ] T064 [US2] Clear the draft only after feature 001 commits, retaining it through every failure, cancellation, supersession and ordinary layer close, in `src/app/application/slef/slef.store.ts` with unit tests (depends on T062)
- [ ] T065 [US2] Publish the revision-bound `SlefImportOutcome` after commit and drop it when the active revision no longer matches, keeping identity outcomes, quality completions, fixed outcomes and the detailed validation issue list out of `BuildSnapshotV1`, the fragment, SLEF and edit history, in `src/app/application/slef/slef.store.ts` with unit tests (depends on T062)
- [ ] T066 [US2] Project successful `autoRestored` and `repaired` outcomes onto feature 001's `FixedMountNormalisationProvenance` local-record metadata while unknown-module replacement feedback and quality completions persist nowhere, in `src/app/application/slef/slef-import.coordinator.ts` with unit tests asserting the split (depends on T062)
- [ ] T067 [US2] Implement the import layer content — heading, accepted-input and privacy description, named close, editable monospaced draft field composed from `src/app/ui/technical/technical-text-field.ts` with associated localized byte usage and 64-KiB limit state, concise status summary, the diagnostic list from `src/app/ui/technical/diagnostic-list.ts`, safe candidate hull/name/validation summary and Clear/Cancel/Import actions — in `src/app/features/slef/import-build-layer/import-build-layer.ts` (depends on T008, T010, T011, T047)
- [ ] T068 [US2] Implement the import layer's available-space responsive presentation — contained dialog, narrow-portrait bottom sheet and full-height scrollable layer for short landscape, expansion, RTL, 200% text or 400% zoom — with wrapping action groups, bounded field and diagnostic overflow and no document horizontal overflow, in `src/app/features/slef/import-build-layer/import-build-layer.scss` (depends on T067)
- [ ] T069 [US2] Wire the shared shell Import action into `src/app/features/shared/app-navigation.ts`, `src/app/features/ship-catalogue/ship-catalogue.page.ts`, `src/app/features/hull-detail/hull-detail.page.ts`, `src/app/features/build-library/build-library.page.ts` and `src/app/features/build-workspace/build-workspace.page.ts` — including the no-build workspace primary recovery action — adding no route or history entry and requiring no active build or selected hull (depends on T067)
- [ ] T070 [US2] Implement the import outcome as ordinary `/build` workspace content with separately headed identity, quality-completion and fixed-mount groups, the retained incomplete/invalid package issue list with locale/canonical disclosure, the final validation statement and a Dismiss action that changes presentation only, in `src/app/features/slef/import-outcome/import-outcome.ts` (depends on T048, T054, T065)
- [ ] T071 [US2] Compose the import outcome into the build workspace so it appears after commit and after the input layer transitions away, in `src/app/features/build-workspace/build-workspace.page.ts` (depends on T070)
- [ ] T072 [US2] Implement concise import announcements — bounded status and result summaries only, never the draft JSON, a whole diagnostic list or a stale revision — in `src/app/application/slef/slef-announcement.coordinator.ts` with unit tests (depends on T034, T065)
- [ ] T073 [US2] Add the import framing, byte/limit, syntax, cardinality, unknown-hull, construction, normalization-failure, candidate-summary, outcome-group and dismissal message keys with named count and byte formatters to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json` (depends on T009)
- [ ] T074 [US2] Register the import layer and import outcome preview declarations for every state in `specs/004-slef/design/import-build.md` and `specs/004-slef/design/import-outcome.md` at desktop, tablet and mobile widths plus expanded, RTL and reduced-motion variants in `src/app/ui/previews/preview-manifest.ts` (depends on T067, T070)
- [ ] T075 [US2] Add the import layer, shared replacement confirmation and import outcome entries with their FR-007–FR-012 ids, journeys, axe flags and named assertions to `e2e/coverage-ledger.ts` (depends on T003, T067, T070)
- [ ] T076 [US2] Add the byte-first, cardinality and diagnostic journey — 65,536 and 65,537 ASCII bytes, a multibyte string straddling the limit, oversized whitespace, malformed JSON, `[]`, two valid entries, mixed valid/invalid, duplicate slots and invalid fields — asserting exact index/path/code/constraint/params presentation, package locale text with canonical disclosure and that an over-limit draft never reaches `inspectSlef`, in `e2e/slef-import.spec.ts` (depends on T049, T067)
- [ ] T077 [US2] Add the atomic-rejection and replacement journey — seed dirty active state, revision, working and named record bytes, fragment/link, fixed provenance and undo/redo, then assert byte equality and a preserved draft after every failure, cancellation and supersession, and that cancelling a ready candidate changes nothing while accepting it performs exactly one replacement, autosave, link synchronization and history reset — in `e2e/slef-import.spec.ts` (depends on T049, T062)
- [ ] T078 [US2] Add the normalization-order and outcome journey — unknown removable, unknown fixed and unknown original-slot identities across every quality state, ordinary, Mercenary and identified partials on resolved modules, source-empty fixed mounts, resolved-but-invalid fixed state and a missing package default — asserting identity normalization first, quality completion next and source-empty repair last, whole refusal for unsupported partials, retained incompleteness for unavailable defaults, no unknown identity in active, saved, linked or exported state, and that dismissal edits nothing while feature 001 persists only fixed-fill provenance and the accepted revision's `valid`/`complete` booleans, in `e2e/slef-import.spec.ts` (depends on T049, T070)

**Checkpoint**: Both stories are independently functional — a Commander can export a build and import
one, with every refusal leaving current work untouched.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Prove the round trip, the performance budget, the responsive and accessible capability,
the independent-consumer acceptance and the network contract across both stories, then close the
build gates.

- [ ] T079 [P] Add the stable round-trip suite — false enabled, priority zero, name and ident, ordinary and identified pre-engineering with effects, and unknown optional and fixed source identities — asserting those identities normalize away and that package-modelled state compares equal after export/import/export under completed quality, fixed fill, identity casing and package-derived-field recomputation or omission, while capture-only `Health`, `timestamp`, ammunition, engineer identity and historical purchase values do not affect equality and package-derived module integrity remains equal, in `src/app/domain/slef/slef-roundtrip.spec.ts` (depends on T017, T059)
- [ ] T080 [P] Add the performance suite discovering the maximum-slot hull from the pinned package at test time, populating every supported modelled field through package APIs and measuring domain import and export with `performance.now()` below 500 ms each with no network request, in `src/app/domain/slef/slef-performance.spec.ts` (depends on T006, T021, T059)
- [ ] T081 [P] Run every import layer, replacement confirmation, import outcome, export-unavailable host and export layer state across the ten Chromium/Firefox viewport-orientation projects with the shared axe helper and no disabled rules, in `e2e/slef-import.spec.ts` and `e2e/slef-export.spec.ts` (depends on T037, T075)
- [ ] T082 [P] Assert landmark, heading, dialog name/description, modal semantics, inert and accessibility-tree-hidden background, visible field labels and instructions, programmatic byte/error and diagnostic relationships, mode-selector selected state and announcement dedupe across both suites, in `e2e/slef-import.spec.ts` and `e2e/slef-export.spec.ts` (depends on T081)
- [ ] T083 [P] Assert doubled-copy expansion, RTL direction isolation of JSON, paths, codes, identities and URLs, 200% text, reduced motion, the 44-CSS-pixel target baseline, textual state equivalents with no colour-only meaning and no page horizontal overflow in every layer and outcome state, in `e2e/slef-import.spec.ts` and `e2e/slef-export.spec.ts` (depends on T081)
- [ ] T084 [P] Add the offline journey loading the application, going offline and completing a full import and export with unchanged capability and no cross-origin request, in `e2e/slef-export.spec.ts` (depends on T040)
- [ ] T085 Assert across both suites that every unexpected application request fails the test, that untrusted producer, hull, name and ident values render as text and never as HTML, and that no real clipboard, share target or remote consumer is contacted, in `e2e/slef-import.spec.ts` and `e2e/slef-export.spec.ts` (depends on T040, T077)
- [ ] T086 [P] Write and run the versioned manual protocols for actual 400% browser zoom, NVDA with Firefox, TalkBack with Chromium and a tablet screen reader where composition materially differs — covering headings, dialog and description relationships, field/error/diagnostic association, mode state, announcement dedupe, technical bidi isolation and complete actions — with result records in `e2e/manual/screen-reader.protocol.md` and `e2e/manual/results/`
- [ ] T087 Add the reference-export corpus generator producing a versioned, hashed set of artifacts from the current application using synthetic, non-personal package fixtures and contacting no other origin, in `scripts/generate-slef-reference-corpus.mjs` with tests in `scripts/generate-slef-reference-corpus.test.mjs` (depends on T021)
- [ ] T088 Record independent-consumer acceptance in `specs/004-slef/validation/consumer-compatibility.md` — every corpus artifact successfully imported by both Coriolis and EDSY, each consumer's exact release or build identifier, the corpus hash, the date and the result, using locally pinned releases where distributable and the documented deliberate manual protocol otherwise (depends on T087)
- [ ] T089 Assert the production bundle imports the Almanac only from the `ships/slef`, `ships/ship-loadout`, `ships/modules` and `i18n/diagnostics` leaves with no broad barrel import, and contains no `.design/` mock parser, fixed-width panel or journal/Markdown mode remnant, in `scripts/check-interface-foundations.mjs` (depends on T012)
- [ ] T090 Reconcile the coverage ledger with the feature 004 surfaces, exported components, preview declarations and Playwright project names in `scripts/check-interface-foundations.mjs` (depends on T037, T075)
- [ ] T091 Assert every conformance statement covering the import and export layers names the seven constitutional keyboard exclusions and that no owned string, unit, byte label or visual literal bypasses the token and message layers, in `scripts/check-interface-foundations.mjs` (depends on T035, T073)
- [ ] T092 [P] Record the adopted, adapted and rejected `.design` behaviours — retained exchange hierarchy and sheet composition against removed fixed widths, mock parser, immediate mutation, fake delivery feedback, partial-roll retention, reduced mobile actions and journal/Markdown modes — in `specs/004-slef/design/reference-review.md` (depends on T029, T067)
- [ ] T093 [P] Document the SLEF interchange boundary — the 64-KiB and one-entry rules, what the package owns, the two constitutional ingress normalizations, what is deliberately not modelled or persisted, and the delivery honesty rules — in `docs/slef-interchange.md`
- [ ] T094 Restore unit coverage to at least 80% statements, branches, functions and lines for `src/app/domain/slef/`, `src/app/application/slef/`, `src/app/platform/browser/` delivery ports and `src/app/features/slef/` under the thresholds in `angular.json`
- [ ] T095 Execute every section of `specs/004-slef/quickstart.md` against the reference corpus and fix each divergence (depends on T088)
- [ ] T096 Run `pnpm run check` and confirm formatting, strict compilation, policy checks, build, unit coverage, all ten Playwright projects and all axe scans pass with no skipped, focused or quarantined test

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS both user stories
- **User Story 1 (Phase 3)**: Depends on Foundational and on feature 001's active snapshot, certified
  current-revision link and `slef-fallback.port.ts`
- **User Story 2 (Phase 4)**: Depends on Foundational, on feature 001's `ReplacementCoordinator` and
  local-record provenance metadata, and on feature 002's shared `build-ingress-normalizer.ts`
- **Polish (Phase 5)**: Depends on both stories; T079, T080, T085 and T095 need import and export
  together

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2. No dependency on US2 — export needs only an active build, which
  feature 001 supplies. It is the MVP.
- **US2 (P1)**: Starts after Phase 2. Independent of US1's artifact and delivery work; only the
  shared store, presenter, technical-text primitives and message namespace are common. The
  export-unavailable host state (T032) and the import recovery action (T069) touch the same workspace
  page, so sequence those two in a single-developer run.

### Within Each User Story

- Tests are written first and must fail before the implementation lands
- Domain coordinators before stores, stores before components, components before the feature 001
  hosts that compose them
- Ports before capability detection, capability detection before the delivery coordinator
- Message keys, preview declarations and ledger entries close each story so the policy checker stays
  green

---

## Parallel Opportunities

- Phase 1: T002 and T003 run together after T001
- Phase 2: T004, T005 and T006 run together; T009, T010 and T011 run together after T008
- Phase 3: T013–T019 run together; T024, T025 and T026 run together after T023
- Phase 4: T041–T049 run together; T053 runs alongside T050–T052
- Phase 5: T079, T080, T081, T084, T086, T092 and T093 run together
- Across teams: once Phase 2 completes, one developer takes US1 and one takes US2 immediately; they
  meet only at the workspace page and the shared message catalogue

## Parallel Example: User Story 1

```bash
# Launch the failing tests together:
Task: "Export generation unit tests in src/app/domain/slef/slef-export.spec.ts"
Task: "Current-retail credit tests in src/app/domain/slef/slef-export-pricing.spec.ts"
Task: "Artifact lifecycle tests in src/app/application/slef/slef-export-artifact.spec.ts"
Task: "Delivery port tests in src/app/application/slef/slef-delivery.coordinator.spec.ts"
Task: "Export round-trip contract test in src/app/domain/slef/slef-export-roundtrip.spec.ts"
Task: "Export layer component tests in src/app/features/slef/export-build-layer/export-build-layer.spec.ts"
Task: "Export journey in e2e/slef-export.spec.ts"
```

## Parallel Example: User Story 2

```bash
# Launch the failing tests together:
Task: "Draft gate tests in src/app/domain/slef/slef-draft-gate.spec.ts"
Task: "Inspection and cardinality tests in src/app/domain/slef/slef-inspection.spec.ts"
Task: "Diagnostic presentation tests in src/app/application/slef/slef-diagnostic.presenter.spec.ts"
Task: "Ingress ordering tests in src/app/domain/slef/slef-import.spec.ts"
Task: "Failure classification tests in src/app/domain/slef/slef-import-failures.spec.ts"
Task: "Atomicity tests in src/app/application/slef/slef-import.atomicity.spec.ts"
Task: "Import layer component tests in src/app/features/slef/import-build-layer/import-build-layer.spec.ts"
Task: "Import outcome component tests in src/app/features/slef/import-outcome/import-outcome.spec.ts"
Task: "Import journey in e2e/slef-import.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — this blocks both stories
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: the payload inspects as one entry with zero diagnostics, credits are
   current catalogue retail, `appURL` appears only for a certified same-revision link, invalid and
   incomplete builds still export, a revision change invalidates the artifact and every delivery
   state passes axe in all ten projects
5. A Commander can hand a build to another tool at this point

### Incremental Delivery

1. Setup + Foundational → models, store, presenter, shared technical primitives and boundary rules
2. Add US1 → one honest current-retail SLEF artifact with selectable text, Download, Copy and
   capability-gated Share (MVP)
3. Add US2 → strict one-entry import, exact diagnostics, shared ingress normalization and one atomic
   feature 001 replacement
4. Polish → round trip, the 500 ms budget, the responsive, accessible and offline gates, the recorded
   Coriolis/EDSY acceptance and a green `pnpm run check`

### Constitutional Guardrails

- No task adds a private parser, schema, game-data copy, calculation, default-module lookup, identity
  classification, modifier merge or scalar quality edit; the package owns every format and game
  behaviour and a package regression waits on a released fix
- No task retains, displays, requests or rewrites a captured purchase value or a per-module `Health`
  snapshot, and no task infers module integrity from one
- No task lets an unknown module identity reach active, saved, linked, exported or history state, and
  no task fabricates a package diagnostic code, path or reason
- No task commits, autosaves, publishes a fragment or resets history directly; feature 001 owns the
  single replacement path and feature 002 owns the ingress ordering
- No task adds a backend, account, telemetry, cross-origin request, automatic payload transmission,
  route, history entry or feature-owned storage key
- No task claims a file was saved, fabricates a clipboard or share success, or hides an action on a
  narrow layout
- No task lowers the 80% coverage thresholds, drops a browser, viewport or orientation project, or
  skips a test to reach a green build

## Notes

- [P] tasks touch different files and have no incomplete dependency
- Every component task includes its unit test, its required-state preview declarations and its
  message keys; none of the three is a follow-up
- Commit after each task or logical group; stop at a checkpoint to validate a story independently
