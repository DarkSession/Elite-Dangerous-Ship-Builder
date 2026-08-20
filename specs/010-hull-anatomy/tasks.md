---
description: 'Task list for Hull Anatomy and Mount Geometry'
---

# Tasks: Hull Anatomy and Mount Geometry

**Input**: Design documents from `/specs/010-hull-anatomy/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [design/](./design/),
[quickstart.md](./quickstart.md)

**Tests**: Test tasks are included. Each of the three contracts in this feature names its own
required verification, the specification gates delivery on SC-001–SC-004, and constitution principle
VIII gates the build on unit coverage, the ten-project Playwright matrix and automated accessibility
scans.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested and
demonstrated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Every task names the exact file it changes

## Path Conventions

Single Angular workspace at the repository root: framework-agnostic anatomy models and the pure
projector in `src/app/domain/anatomy/`, the generalized located-mount power boundary in
`src/app/domain/power-heat/`, the asset loader and safe SVG parser in `src/app/platform/assets/`,
signal store, presenter and announcement coordination in `src/app/application/anatomy/`, shared
presentation primitives and previews in `src/app/ui/hull-schematic/` and `src/app/ui/previews/`,
the capability surface in `src/app/features/build-workspace/hull-anatomy/`, messages and formatters
in `src/app/i18n/`, end-to-end suites in `e2e/`, repository and package audits in `scripts/`. Unit
tests live beside their source as `*.spec.ts`.

## Delivery gates

Feature 010 owns validated schematic presentation, mount occurrence grouping, the unique text
equivalent and deterministic side reveal only. It owns no editor, no power semantics, no cache, no
legal content and no geometry of its own. Four gates apply and are named on the tasks they block:

- **Repository prerequisite**: TypeScript `strict` and Angular `strictTemplates` must be enabled in
  the shared configuration and the existing project must pass under them (constitution technology
  requirement, closed by feature 011).
- **Feature prerequisites**: feature 001 (one active `ShipLoadout` with `buildRevision`, no-build
  state, the `/build` workspace page, the `angular.json` package-asset copy pattern and the single
  versioned `ngsw-config.json` service worker), feature 002 (the `SlotView` projection over
  `ShipLoadout.slots()`, the complete ledger, one `selectedSlotKey` and the exact-slot open intent
  in `src/app/application/outfitting/outfitting.store.ts`), feature 003 (`StatusRevisionContext` and
  the settled deployed/retracted viewing condition with its `conditionsRevision`), feature 011
  (tokens, primitives, localization, game-text presenter with untranslated disclosure, announcement
  primitives, preview manifest, ten Playwright projects and the axe helpers in `e2e/accessibility/`)
  and feature 012 (the accepted in-place help/provenance modal reached by contextual intent).
- **Contract-first dependency**: feature 005 must replace its hardpoint-only
  `MountPowerObservationPort` accepting any package slot key, which feature 010 consumes (T012). No feature-010 task
  may join `PowerBudget.consumers` to bands, read raw `FittedModule.on` or zero-based `priority`, or
  reconstruct a power verdict while that port is still hardpoint-only.
- **Package pin**: `@elite-dangerous-almanac/core@0.1.4` already contracts both `hardpoint` and
  `utility_mount` annotations, exact journal keys, complete top/bottom coverage, cross-side duplicate
  identity, the static inline `svg/g/path/circle` guarantee and per-consumer utility power. No
  upstream anatomy fix is outstanding; the audits in Phase 2 gate every later package upgrade.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Pin the package behaviour this feature projects and create the asset pipeline, source
locations and test suites before any contract lands.

- [ ] T001 Pin the Almanac 0.1.4 anatomy behaviour this feature consumes — `assets/ships/<Ship.symbol>/schematic-top.svg` and `schematic-bottom.svg` present for every catalogued hull; only `svg`, `g`, `path` and `circle` elements in unmodified files; `data-feature="hardpoint"` and `data-feature="utility_mount"` groups each carrying an exact journal-compatible `data-journal-slot`; `ShipLoadout.slots()` reporting package kinds `hardpoint` and `utility` with hardpoint class sizes and the documented size-`0` utility placeholder; and `powerBudget().consumers` containing both always-powered and deployed-only utility consumers — using leaf subpath imports in `src/app/domain/anatomy/almanac-anatomy-contract.spec.ts`
- [ ] T002 [P] Add an `assets` entry copying `node_modules/@elite-dangerous-almanac/core/assets/ships/**/schematic-top.svg` and `**/schematic-bottom.svg` unchanged to the same-origin output path `assets/ships/` in the build target options in `angular.json`
- [ ] T003 [P] Extend feature 001's lazy `assets/ships/**` performance cache group so both schematic filenames are cached by the single versioned service worker with no second cache owner, in `ngsw-config.json`
- [ ] T004 [P] Create the feature source skeleton `src/app/domain/anatomy/`, `src/app/application/anatomy/`, `src/app/ui/hull-schematic/` and `src/app/features/build-workspace/hull-anatomy/` per plan.md
- [ ] T005 [P] Create the feature suites `e2e/hull-anatomy.spec.ts` and `e2e/schematic-offline.spec.ts` importing feature 011's axe and assertion helpers from `e2e/accessibility/axe.ts` and `e2e/accessibility/assertions.ts`, and register their surfaces in `e2e/coverage-ledger.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Audit the installed and generated artwork, publish the immutable anatomy contract,
generalize the located-mount power boundary, and land the safe parser, same-origin loader, pure
projector, revision-keyed store and presentation boundary every surface reads.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Package and output audits

- [ ] T006 Implement the installed-package schematic audit — enumerate every catalogued hull, resolve both asset paths inside the package asset root and refuse a path escaping it, parse XML, reject a non-SVG root or wrong namespace, enforce the released `svg`/`g`/`path`/`circle` static-content guarantee, reject every event, script, style, link, reference, media, foreign element and CSS `url()` value, require `data-journal-slot` on every `hardpoint` and `utility_mount` feature, resolve each key against the exact hull slot catalogue and matching package kind, reject a key repeated on one side, and report any package hardpoint or utility with no occurrence across both sides — in `scripts/check-almanac-schematics.mjs`
- [ ] T007 [P] Add the audit regression suite pinning the 0.1.4 fixture evidence — 48 hulls with 48 matching asset directories, 96 side schematics, 234 unique hardpoints across 240 occurrences, 195 unique utilities across 195 occurrences, the six accepted cross-side repeats `MediumHardpoint1`/`MediumHardpoint2` on `Federation_Corvette` and `MediumHardpoint1`–`MediumHardpoint4` on `MediumTransport01`, and zero missing, unknown-key, wrong-kind or same-side-duplicate annotations — as fixture expectations that are never encoded as runtime constants or upper bounds for a future release, in `scripts/check-almanac-schematics.test.mjs`
- [ ] T008 Extend the audit with the generated-output pass comparing built asset paths, file counts and content hashes byte for byte against the installed package files and asserting that no generated package SVG is tracked under `public/` or `src/`, in `scripts/check-almanac-schematics.mjs` (depends on T006)

### Shared contract types

- [ ] T009 [P] Define the inert SVG boundary — `SchematicSide`, `SafeSvgPresentation` limited to validated static drawing attributes, `SvgGroupNode` carrying only `feature` and `journalSlot` annotations, `SvgPathNode`, `SvgCircleNode`, the `SafeSvgNode` union, `SchematicDocument` with side, hull symbol, package `viewBox` and optional width/height, and `MountOccurrence` keyed by `(slotKey, side)` with exact package shapes and no stored bounds or centre — in `src/app/domain/anatomy/anatomy-model.ts`
- [ ] T010 Define the canonical mount family — `LocatedMountKind`, `MountSize` as `class 1–4 | notClassSized | unavailable` with no class zero or estimated size, `FittedMountState` as `empty | resolved` carrying the exact `FittedModule.symbol` and a `LocalizedGameText` name, `EngineeringState` as presence-only `stock | engineered | unavailable`, `MountLocationState` as `pending | located | temporarilyUnavailable | packageDefect`, `MountItem` referencing its occurrences, and `SelectedMountFacts` containing no weapon metric, direction, distance, convergence or coordinate — in `src/app/domain/anatomy/anatomy-model.ts` (depends on T009)
- [ ] T011 Define the lifecycle and evidence types — `SideAssetState` as `notRequested | loading | ready | temporarilyUnavailable | contractDefect` with its `offlineUncached | httpFailure | networkFailure` reasons and `manualAndOnline` / `afterPackageUpdate` retry rules, `SchematicDefect` as `unsafeOrInvalidDocument | unknownSlot | wrongSlotKind | sameSideDuplicate | missingContractGeometry` with language-neutral evidence and no build payload, `AnatomySnapshot` carrying hull symbol, both revisions, settled hardpoint state, selected key, visible side, both side states, ordered mounts and defects, `AnatomyState` as `noBuild | loading | ready | failure`, and `RevealState` with its `geometry | locatedList | completeLedger | null` source — in `src/app/domain/anatomy/anatomy-model.ts` (depends on T010)

### Generalized located-mount power boundary (feature 005 contract update)

- [ ] T012 Consume feature 005's generalized `MountPowerObservationPort` for exact hardpoint and utility keys, importing `MountPowerObservation`, `MountPowerObservationRead` and the owner's injection token from the contract leaf `src/app/domain/power-heat/mount-power-observation.ts` and declaring no local copy, narrowed variant or second adapter of that union in feature 010
- [ ] T013 Add the utility-observation conformance tests proving feature 005's adapter derives every utility observation from one `ShipLoadout.powerBudget()` consumer and matching band result, that an always-powered utility and a deployed-only utility yield distinct current states, that a utility absent from the consumers list reads `notApplicable` rather than powered or zero, that priority is normalized to one-based or reported unavailable, and that both revisions are stamped on every read, in `src/app/application/power-heat/mount-power-observation.adapter.spec.ts` (depends on T012)

### Safe parsing and same-origin loading

- [ ] T014 Implement the safe schematic parser — parse the response as XML, reject malformed documents, a doctype, a non-SVG root or wrong namespace, any element outside `svg`/`g`/`path`/`circle`, any script, style, event, link, reference, media or foreign content and any CSS `url()` value, emit only typed root, group, path and circle records with validated static presentation fields, retain `data-feature` and `data-journal-slot` verbatim, discard editor metadata not needed to render or identify a mount, and refuse rather than silently sanitize a contract violation — in `src/app/platform/assets/schematic-svg-parser.ts` (depends on T009)
- [ ] T015 Add parser tests covering malformed XML, a doctype, a wrong root and namespace, every disallowed element, attribute, reference and CSS `url()` case, the complete set of contract-valid static presentation attributes, retained annotations, an unannotated decorative group left inert, and the assertion that no code path produces markup for `innerHTML`, `bypassSecurityTrustHtml`, `<object>` or `<iframe>`, in `src/app/platform/assets/schematic-svg-parser.spec.ts` (depends on T014)
- [ ] T016 Implement the schematic loader — accept only a resolved hull symbol and side, choose the fixed side filename, URI-encode the symbol as one path segment, resolve the relative asset URL against the application base, refuse a resolved origin other than the document origin, fetch with ordinary same-origin credentials and referrer policy under an abort signal tied to the hull request, classify offline, HTTP and network failures as temporary with retry and a parser rejection as a contract defect that is not refetched within the same app and package version, and start and publish top and bottom independently — in `src/app/platform/assets/almanac-schematic-loader.ts` (depends on T011, T014)
- [ ] T017 Add loader tests covering base-href-safe URL construction, exact symbol casing and encoding, cross-origin refusal, no user string, slot key, build name or module identity reaching a path, aborted and discarded stale completions after a hull change, side-local retry on explicit intent and once on a connectivity event for the still-active side, and the absence of a repeated fetch after a contract defect, in `src/app/platform/assets/almanac-schematic-loader.spec.ts` (depends on T016)

### Pure projection

- [ ] T018 Implement the canonical item projection — read `ShipLoadout.slots()` once for the captured build revision, keep exactly the entries whose package kind is `hardpoint` or `utility` in returned outfitting order, and build one `MountItem` per package slot key carrying exact kind and size semantics, feature 002's empty or resolved fitted state, the exact module symbol, package engineering presence, focused state from the one selected key and feature 005's copied priority and current power observation, creating no item from an SVG annotation and removing no package item because geometry is pending, unavailable or defective — in `src/app/domain/anatomy/anatomy-projector.ts` (depends on T011, T012)
- [ ] T019 Implement annotation admission and location — admit a validated group only when `data-feature="hardpoint"` resolves to a canonical `hardpoint` item or `data-feature="utility_mount"` resolves to a canonical `utility` item on the active hull, leave every other feature inert artwork even when malformed content adds a journal key, omit and record unknown keys, feature/kind mismatches and same-side repeats without choosing an occurrence by drawing order, attach at most one occurrence per side to its canonical item, and resolve `MountLocationState` so a ready side locates immediately, an unsettled or unavailable side leaves absence pending, and only a mount with no occurrence after both valid sides settle becomes a `missingContractGeometry` defect — in `src/app/domain/anatomy/anatomy-projector.ts` (depends on T018)
- [ ] T020 Add the projection contract suite covering both mount kinds, empty removable and resolved articles, package-populated fixed mounts, engineering presence, every power state including `notApplicable` for a non-participating mount, every location state, package order preserved against consumer sort and translated names, the real `Federation_Corvette` and `MediumTransport01` cross-side repeats resolving to one item with two synchronized occurrences, at least one always-powered and one deployed-only utility, unknown-key, wrong-kind and same-side-duplicate defects, partial side readiness, hull and revision mismatch refusing publication, and a locale change altering no identity or revision, in `src/app/domain/anatomy/anatomy-projector.spec.ts` (depends on T019)

### Application boundary

- [ ] T021 Implement `AnatomyStore` — publish `noBuild` with no asset request when no build is active, clear prior geometry, occurrences and reveal state and start both side loads on a new active hull while creating current package items immediately, reproject item state on a same-hull build edit without refetching a valid cached document, refresh only the power observations and revision-stamped presentation on a condition change, apply a side completion only when hull and request identity still match, reproject focused state on a selection change with no build revision, hold visible side and scroll position as memory-only presentation state, and publish `failure` for an unexpected projector error without a stale prior-hull snapshot — in `src/app/application/anatomy/anatomy.store.ts` (depends on T016, T019)
- [ ] T022 Add store tests proving one snapshot carries one hull and one build/condition revision pair, that a stale asset or observation completion is discarded rather than relabelled, that mounts exist before assets settle and are never filtered by geometry availability, that a ready snapshot with neither side available is valid, that selection, side and scroll changes create no build or history revision, and that nothing the store owns is written to storage, history, a URL, a build link or SLEF, in `src/app/application/anatomy/anatomy.store.spec.ts` (depends on T021)
- [ ] T023 Implement `AnatomyPresenter` — the locale-only presentation boundary resolving package slot and module names through Almanac leaf helpers with feature 011's canonical-fallback and unavailable disclosure, keeping exact slot keys visible as identifiers, producing the localized kind, size, fitted, engineering, focused, priority, power and location text for every mount, naming the settled deployed or retracted condition, and applying feature 011 formatters without changing any package number — in `src/app/application/anatomy/anatomy.presenter.ts` (depends on T011)
- [ ] T024 Add presenter tests for a localized package name, a locale miss carrying visible and programmatic canonical-fallback disclosure, an unresolvable name left unavailable rather than promoted from a raw identity, `notClassSized` presented as the documented utility state rather than class zero, and a locale change re-presenting text without a domain reprojection, in `src/app/application/anatomy/anatomy.presenter.spec.ts` (depends on T023)
- [ ] T025 Implement `AnatomyAnnouncementCoordinator` comparing the prior announced semantic summary on matching settled revisions only — side availability and recovery, package defects and the settled selected mount and its state — coalescing rapid settled revisions into one polite localized announcement, announcing a cross-side repeat once rather than per occurrence, and staying silent for initial and unchanged availability, locale-only re-presentation, pending contexts and discarded stale work, with unit tests for each case, in `src/app/application/anatomy/anatomy-announcement-coordinator.ts` (depends on T021)

### Repository policy and messages

- [ ] T026 Add the repository policy check asserting no file under `src/app/domain/anatomy/`, `src/app/application/anatomy/`, `src/app/platform/assets/` or `src/app/features/build-workspace/hull-anatomy/` uses `innerHTML`, `bypassSecurityTrustHtml`, `<object>`, `<iframe>` or any other raw or trusted markup sink, reads `getBBox`, `getScreenCTM` or another geometry measurement, declares a coordinate, node-number, slot-name or key-prefix mapping table, imports the Almanac barrel instead of a leaf subpath, joins `PowerBudget.consumers` to bands or reads raw `on` or zero-based `priority`, calls a `ShipLoadout` mutation method, hard-codes a `/help` route or a parameterized issue URL, contains a colour, size, spacing, radius, elevation or motion literal outside the token layer, or writes anatomy side, scroll, selection or defect state to storage, history, a URL, a build link or SLEF, in `scripts/check-interface-foundations.mjs`
- [ ] T027 [P] Register the feature 010 `anatomy` message namespace with its English fallback seeds and the German catalogue entries for the capability heading, side names, availability, defect, legend, facts and list scaffolding in `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`

**Checkpoint**: The audited asset pipeline, the immutable anatomy contract, the generalized power
port, the safe parser and same-origin loader, the pure projector, the revision-coherent store and the
presentation boundary all exist; user story work can begin.

---

## Phase 3: User Story 1 - Locate hardpoints and utility mounts (Priority: P1) 🎯 MVP

**Goal**: A Commander sees the active hull's top and bottom Almanac schematics, every package
hardpoint and utility mount in its fitted, empty, engineered and focused state both visually and as
text, and the exact slot key, size, fitted module, priority and current power state of the selected
mount — while every slot without schematic geometry stays reachable through feature 002's complete
ledger.

**Independent Test**: Open `/build` with a build containing fitted, empty and engineered hardpoints
and utilities. Confirm both schematics render from package geometry, that every admitted mount
carries text-equivalent state, that the unique list holds every package hardpoint and utility exactly
once in `ShipLoadout.slots()` order including cross-side repeats and unlocated mounts, that the
selected mount's facts match the package slot, and that failing or removing either schematic leaves
the list, ledger and editor fully usable.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T028 [P] [US1] Add schematic renderer tests asserting the typed tree renders at the package `viewBox` with geometry unchanged, that only admitted occurrences receive interaction while every other annotated feature stays inert artwork, that each occurrence renders its exact package shapes plus a transparent non-scaling exact-shape hit clone from the shared target-size token, and that no element is positioned, translated or measured, in `src/app/ui/hull-schematic/schematic-canvas.spec.ts`
- [ ] T029 [P] [US1] Add side selector and side status tests covering the labelled top/bottom controls, the `notRequested`, `loading`, `ready`, `temporarilyUnavailable` and `contractDefect` presentations, side-local retry, and the rule that a failing side replaces only itself while its peer, the facts, the list and the ledger remain, in `src/app/ui/hull-schematic/side-selector.spec.ts` and `src/app/ui/hull-schematic/side-status.spec.ts`
- [ ] T030 [P] [US1] Add legend tests proving every entry — hardpoint and utility kind, fitted and empty, engineered and stock, focused, and disabled, inactive-retracted, powered, shed and not-applicable power — uses the same localized text as the items it explains and that no meaning is carried by colour, fill, stroke, dash, opacity, shape, icon or animation alone, in `src/app/ui/hull-schematic/mount-legend.spec.ts`
- [ ] T031 [P] [US1] Add selected mount facts tests covering exact slot key and localized kind, class size, `notClassSized` and unavailable size, empty and resolved module state, engineered, stock and unavailable engineering, focused state, one-based priority and unavailable, every current power state under the named deployed or retracted condition, top, bottom, both, pending, temporarily-unavailable and defect location, and the absence of any weapon statistic, direction, distance, convergence, mass, cost or coordinate, in `src/app/ui/hull-schematic/selected-mount-facts.spec.ts`
- [ ] T032 [P] [US1] Add located-mount list tests proving one semantic item exists for every package hardpoint and utility in filtered `ShipLoadout.slots()` order before geometry loads, that a cross-side repeat stays one item reading "top and bottom", that each item repeats every selected fact plus location and exposes an independent action, and that visible kind grouping changes neither the underlying package order nor assistive access to either kind, in `src/app/ui/hull-schematic/located-mount-list.spec.ts`
- [ ] T033 [P] [US1] Add hull anatomy container tests asserting the fixed semantic order heading and provenance action, side availability and selector, schematic regions, legend, selected facts and unique list, that the capability is absent with no active build and issues no asset request, and that an unexpected projection failure shows a bounded alert with no stale previous-hull geometry, in `src/app/features/build-workspace/hull-anatomy/hull-anatomy.component.spec.ts`
- [ ] T034 [P] [US1] Add the locate journey covering both schematics rendering for a real hull, mixed fitted, empty and engineered hardpoints and utilities, the complete unique list, the selected facts, a fixture hull with an unknown key, a wrong-kind annotation, a same-side duplicate, a missing mount and an unsafe document, and the complete ledger remaining operable in every one of those cases, in `e2e/hull-anatomy.spec.ts`

### Implementation for User Story 1

- [ ] T035 [US1] Implement the typed schematic canvas rendering the validated `SchematicDocument` tree through Angular SVG templates at the package `viewBox`, adding application interaction and state markup with design tokens only, exposing a localized image description naming hull and orientation, and providing bounded native overflow panning with a visible affordance and no custom zoom, drag matrix, coordinate read or stored pan model, in `src/app/ui/hull-schematic/schematic-canvas.ts` and its template and styles (depends on T028)
- [ ] T036 [US1] Implement the mount occurrence rendering — the tokenized state treatment driven by the canonical `MountItem`, the exact-shape transparent non-scaling hit clone sized to feature 011's 44 CSS-pixel baseline, the accessible name carrying localized mount name, kind, side, focused state and complete current state, and identical fitted, engineering, focused and power state on both occurrences of a cross-side repeat with side-specific names — in `src/app/ui/hull-schematic/mount-occurrence.ts` and its template and styles (depends on T035)
- [ ] T037 [P] [US1] Implement the labelled side selector with 44-pixel controls choosing top or bottom for the constrained composition, emitting a presentation-only side change that creates no build or history revision, in `src/app/ui/hull-schematic/side-selector.ts` and its template and styles (depends on T029)
- [ ] T038 [P] [US1] Implement the side asset status surface presenting `loading`, `temporarilyUnavailable` with its offline, HTTP and network wording and retry action, and `contractDefect` with its package-defect wording and provenance route, never claiming the hull lacks geometry and never replacing the peer side, facts, list or ledger, in `src/app/ui/hull-schematic/side-status.ts` and its template and styles (depends on T029)
- [ ] T039 [P] [US1] Implement the mount state legend covering kind, fitted and empty, engineered and stock, focused and all six power states including `unavailable` with the same localized text used by the items, and never applying powered or shed treatment to a not-applicable mount, in `src/app/ui/hull-schematic/mount-legend.ts` and its template and styles (depends on T030)
- [ ] T040 [US1] Implement the selected mount facts summary rendering the exact `SelectedMountFacts` view with the named viewing condition, as a read-only summary and not a second editor, in `src/app/ui/hull-schematic/selected-mount-facts.ts` and its template and styles (depends on T031)
- [ ] T041 [US1] Implement the unique located-mount list with one native semantic item per package hardpoint and utility in canonical order, each carrying full state and location text and an independent 44-pixel action, including pending, temporarily-unavailable and package-defect location named without guessing, in `src/app/ui/hull-schematic/located-mount-list.ts` and its template and styles (depends on T032, T040)
- [ ] T042 [US1] Implement `HullAnatomyComponent` composing the localized heading, active hull context, feature 012 provenance action, side availability and selector, the labelled schematic regions, the legend, the selected facts and the unique list in that fixed semantic order, reading only the presented store state and emitting typed intents, in `src/app/features/build-workspace/hull-anatomy/hull-anatomy.component.ts` and its template and styles (depends on T023, T036, T037, T038, T039, T041)
- [ ] T043 [US1] Emit the contextual `openHelpModal` provenance intent with context `packageArtworkAndData` from the anatomy heading to feature 012's in-place modal, preserving the current anatomy and build state and hard-coding no route, in `src/app/features/build-workspace/hull-anatomy/hull-anatomy.component.ts` (depends on T042)
- [ ] T044 [US1] Compose the Hull Anatomy capability into feature 001's workspace page beside feature 002's complete ledger, keeping the compact anatomy-before-ledger source order and adding no route, in `src/app/features/build-workspace/build-workspace.page.ts` and its template (depends on T042)
- [ ] T045 [P] [US1] Add the US1 message keys — the capability heading, hull and orientation descriptions, side names and selector labels, the loading, temporarily-unavailable, offline, HTTP, network, retry and package-defect wording, every legend entry, the mount kind, size, `notClassSized`, unavailable, empty, resolved, engineered, stock, focused, priority and six power state labels including `unavailable`, the deployed and retracted condition names, the top, bottom, both, pending, unavailable and defect location wording, the provenance action and the untranslated-text disclosure — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T046 [P] [US1] Add preview declarations for the schematic canvas, mount occurrence, side selector, side status, legend, selected mount facts and located-mount list covering no build, both sides loading, one ready and one loading, both ready, one and both sides temporarily unavailable, uncached offline, invalid document, unknown key, wrong-kind annotation, same-side duplicate, missing geometry, all-empty, all-fitted and mixed mounts, stock, engineered and unavailable engineering, no selection, hardpoint selection, utility selection, cross-side repeat, all five power states, canonical-fallback and unavailable game text and long expanded and RTL text at all five viewports, in `src/app/ui/previews/preview-manifest.ts`
- [ ] T047 [P] [US1] Register the US1 surfaces and the FR-001–FR-005, FR-008, FR-009, FR-010, FR-011 and FR-012 ids with their package-identity, complete-state, unique-order, defect and ledger-fallback assertions in `e2e/coverage-ledger.ts`

**Checkpoint**: Every package hardpoint and utility is located, stated and inspectable, artwork
failure degrades to text without loss, and the capability passes axe in all ten projects.

---

## Phase 4: User Story 2 - Move between geometry and outfitting (Priority: P1)

**Goal**: Activating a schematic mount or its text item reaches the matching feature 002 slot in one
interaction, selecting a located slot in the ledger identifies and reveals a containing schematic,
and a mount drawn on both sides remains one build identity with identical state.

**Independent Test**: Activate a top hardpoint, a bottom utility, a cross-side repeated hardpoint and
each unique list item, then select those slots plus an internal slot from the complete ledger. Confirm
one interaction reaches the exact slot each way, that narrow layout keeps a containing current side
and otherwise chooses top then bottom, that every occurrence of a repeated slot shows identical
selected state while the list keeps one item, that an internal or unlocated selection creates no false
geometry, and that the URL fragment, build revision, persistence and undo history never change.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T048 [P] [US2] Add reveal coordinator tests covering wide composition identifying every occurrence, narrow composition keeping a containing current side, otherwise choosing top then bottom, keeping the current side and stating that location cannot be revealed when the slot is pending, unavailable or defective, nearest `scrollIntoView` on the rendered occurrence, and smooth movement disabled under `prefers-reduced-motion`, in `src/app/application/anatomy/anatomy-reveal-coordinator.spec.ts`
- [ ] T049 [P] [US2] Add slot targeting tests proving geometry and list activation emit one `OpenSlotIntent` carrying only the canonical slot key with source `anatomyGeometry` or `anatomyList`, that no SVG id, element order, module identity, node label or coordinate forms a target, that feature 010 calls no `ShipLoadout` mutation method, and that a stale or missing key refused by feature 002 refreshes anatomy from the current revision and presents the owner-localized failure without redirecting to a similarly named slot, in `src/app/application/anatomy/anatomy.store.spec.ts`
- [ ] T050 [P] [US2] Add the two-way movement journey covering geometry to ledger and ledger to geometry for both mount kinds, a cross-side repeat, an internal slot, narrow deterministic reveal, stale-key refusal and unchanged fragment, revision, persistence and undo history, in `e2e/hull-anatomy.spec.ts`

### Implementation for User Story 2

- [ ] T051 [US2] Define and emit the shared `OpenSlotIntent` with its `anatomyGeometry` and `anatomyList` sources and route it to feature 002's existing exact-slot open intent in `src/app/application/outfitting/outfitting.store.ts`, adding no second selection owner, in `src/app/application/anatomy/anatomy-slot-targeting.ts` (depends on T021)
- [ ] T052 [US2] Wire geometry activation so an admitted occurrence emits exactly one intent for its canonical item key, ignoring drawing order, element identity and pointer position, in `src/app/ui/hull-schematic/mount-occurrence.ts` (depends on T036, T051)
- [ ] T053 [US2] Wire unique-list activation so every item, including pending, temporarily-unavailable and package-defect locations, emits the same intent through its independent action, in `src/app/ui/hull-schematic/located-mount-list.ts` (depends on T041, T051)
- [ ] T054 [US2] Implement `AnatomyRevealCoordinator` applying the deterministic side rule, marking every occurrence of the selected key as focused, revealing the nearest rendered occurrence with native `scrollIntoView`, honouring reduced motion, keeping side choice and scroll position memory-only, and clearing selected anatomy facts without changing the ledger selection when an internal or unlocated slot is selected, in `src/app/application/anatomy/anatomy-reveal-coordinator.ts` (depends on T021, T048)
- [ ] T055 [US2] Consume feature 002's published `selectedSlotKey` as the single focused identity so geometry, selected facts, the unique list and the ledger always agree, and reproject focused state on selection without advancing a build revision, in `src/app/application/anatomy/anatomy.store.ts` (depends on T021, T054)
- [ ] T056 [US2] Handle a refused stale or missing key by refreshing from the current revision and surfacing feature 002's localized failure, never selecting a similarly named slot, in `src/app/application/anatomy/anatomy-slot-targeting.ts` (depends on T051)
- [ ] T057 [US2] Emit one coalesced revision-keyed selected-slot announcement for geometry and list activation, with no second announcement for a repeated occurrence and none for a locale change or an unchanged selection, in `src/app/application/anatomy/anatomy-announcement-coordinator.ts` (depends on T025, T054)
- [ ] T058 [P] [US2] Add the US2 message keys — the exact-slot actions for geometry and list items, the focused and selected state names, the "location cannot currently be revealed" wording, the named return preserving anatomy context on narrow layouts and the refused-slot failure framing — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T059 [P] [US2] Add preview declarations for selected hardpoint, selected utility, synchronized cross-side repeat, selected internal or unlocated slot, selected slot on a temporarily unavailable side and refused stale selection at all five viewports, in `src/app/ui/previews/preview-manifest.ts`
- [ ] T060 [P] [US2] Register the US2 surfaces and the FR-006 and FR-007 ids with their one-interaction, deterministic-reveal, single-identity and no-revision assertions in `e2e/coverage-ledger.ts`

**Checkpoint**: Both stories are independently functional, one selected key drives geometry, text,
facts and ledger, and no navigation mutates the build.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T061 Implement the responsive composition — paired labelled top and bottom columns only when the available inline size accommodates both without shrinking targets or text, the labelled single-side selector otherwise, container queries rather than device-name breakpoints, and one complete semantic column at narrow widths, both landscape phone orientations, 200% text and 400% zoom with no lost content or action — in `src/app/features/build-workspace/hull-anatomy/hull-anatomy.component.ts` and its template and styles (depends on T044)
- [ ] T062 [P] Run the complete capability in Chromium and Firefox at 1440×900, 834×1112, 1112×834, 390×844 and 844×390 with an axe scan over every no-build, both-loading, one-ready, both-ready, one and both temporarily unavailable, uncached offline, invalid document, unknown key, wrong-kind, same-side duplicate, missing geometry, no-selection, hardpoint-selected, utility-selected, cross-side repeat, internal-selected, every power state and projection-failure state, in `e2e/hull-anatomy.spec.ts`
- [ ] T063 [P] Assert 200% text, actual 400% browser zoom, expanded translations, long canonical module and slot names and RTL layout with no lost content, function or geometry-to-facts association, no mirrored package geometry, no changed slot identity, no document horizontal scrolling and horizontal panning confined to the labelled schematic container, in `e2e/hull-anatomy.spec.ts`
- [ ] T064 [P] Assert touch operation and the shared 44-pixel target token for every occurrence hit clone, list action, side selector control, retry and provenance action, that nearby and overlapping mounts stay separately operable through their independent list actions, that no state meaning depends on colour, shape, position, icon, title or hover, that no multipointer gesture or custom drag is essential, and that `prefers-reduced-motion` changes only transitions and never content, state or announcement timing, in `e2e/hull-anatomy.spec.ts`
- [ ] T065 [P] Assert one coalesced polite announcement per settled revision for side failure, recovery, package defect and settled selection, silence for initial and unchanged availability, locale-only re-presentation, pending contexts and discarded stale completions, and no duplicate announcement from a cross-side repeat, in `e2e/hull-anatomy.spec.ts`
- [ ] T066 [P] Add the locale sweep asserting every owned heading, label, state, location and accessible name comes from application messages with active-locale formatters, that no raw message key or blank label appears, that Almanac slot and module names come from package helpers by exact identity with disclosed canonical fallback or an unavailable state and never a private translation or raw-id display fallback, that exact slot keys remain unchanged identifiers, and that the bundled English fallback works offline, across every shipped locale and the pseudo-locales in `src/app/i18n/testing/pseudo-locales.ts`, in `e2e/hull-anatomy.spec.ts`
- [ ] T067 Add the production offline journey against the built output and the real generated service worker — open one hull online and wait for both sides, reload offline and confirm both schematics reload from the versioned cache, select a different uncached hull offline and confirm both sides read temporarily unavailable while the list, ledger and editor stay usable, restore connectivity without reloading and confirm the still-active sides load, fail and retry only one side, and confirm a response from a prior hull never replaces current geometry — with development request interception explicitly not accepted as proof, in `e2e/schematic-offline.spec.ts` (depends on T016)
- [ ] T068 [P] Assert that no anatomy side, scroll, selection, occurrence or defect value appears in local storage, browser history, a URL fragment, a build link or a SLEF export, that geometry and ledger exchange only the exact game slot key with no positional node index, and that any external licence or issue navigation is deliberate, labelled as leaving the app and carries no hull, slot, module, build or storage data, in `e2e/hull-anatomy.spec.ts`
- [ ] T069 Add the in-page settled measurement under Chromium CDP `Emulation.setCPUThrottlingRate(4)` at the mobile viewport asserting at most 100 ms from a committed build or condition revision to matching rendered geometry, facts and list DOM carrying the same revision, that only the active hull's two schematics are fetched, that a valid cached document is not refetched on a same-hull edit, and that a locale switch renders new text without reparsing a document or reprojecting the domain, in `e2e/hull-anatomy.spec.ts` (depends on T022)
- [ ] T070 [P] Write and run the versioned NVDA/Firefox desktop, TalkBack/Chromium mobile and tablet screen-reader protocols covering the anatomy heading, side image descriptions, side status and retry, occurrence names with kind, side, focused and full state, the unique list order and location text, the selected facts relationship, cross-side repeat non-duplication, two-way movement and recovery announcements, with result records in `e2e/manual/screen-reader.protocol.md` and `e2e/manual/results/`
- [ ] T071 Reconcile the coverage ledger with the feature 010 surfaces, exported components, preview declarations and Playwright project names, and assert every conformance statement covering this capability names the constitutional exclusions "WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11", in `scripts/check-interface-foundations.mjs` (depends on T047, T060)
- [ ] T072 Restore unit coverage to at least 80% statements, branches, functions and lines for `src/app/domain/anatomy/`, `src/app/application/anatomy/`, `src/app/platform/assets/` and `src/app/features/build-workspace/hull-anatomy/` under the thresholds in `angular.json`
- [ ] T073 [P] Record the Hull Anatomy capability, the installed-package schematic copy and audit, the generalized located-mount power port and the out-of-scope internal-slot geometry, weapon metrics, mount direction, convergence and coordinate data in `AGENTS.md` and `README.md`
- [ ] T074 Execute every section of `specs/010-hull-anatomy/quickstart.md`, including the prerequisite gates and the package-pin check, and fix each divergence
- [ ] T075 Run `pnpm run check` and confirm formatting, strict compilation, policy checks, both schematic audits, build, unit coverage, all ten Playwright projects and all axe scans pass with no skipped, focused or quarantined test

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: starts once the feature prerequisites in Delivery gates are available
- **Foundational (Phase 2)**: depends on Phase 1 and blocks both user stories; T012 binds feature
  005's `MountPowerObservationPort`, so feature 005 T006 must land before it and before any task
  reads a power state, and T006 must pass before the loader is trusted against a package upgrade
- **User stories (Phases 3–4)**: both depend on Phase 2; US2 extends surfaces first created in US1,
  so it follows US1 rather than running fully beside it
- **Polish (Phase 5)**: depends on both delivered stories

### User story dependencies

- **US1 (P1)**: depends only on Phase 2. It delivers every presentation surface and the complete text
  equivalent, and is demonstrable with feature 002 selection observed read-only
- **US2 (P1)**: depends on Phase 2 and on the US1 components it wires — T052 extends the occurrence
  component from T036, T053 extends the list from T041 and T057 extends the coordinator from T025 —
  so those pairs must be serialized even when the stories run concurrently

### Within each user story

- Tests are written first and must fail before implementation
- Domain projection before store, store before presenter, presenter before components, components
  before container composition and workspace wiring
- Message keys and preview declarations ship with their component, never as follow-up work

### Parallel opportunities

- Phase 1: T002, T003, T004 and T005 run together
- Phase 2: T007 runs beside T006's implementation; T009 and T012 run together; T014 and T016 follow
  the types and run in sequence with their tests; T023 runs beside T021 once T011 lands; T026 and
  T027 run together
- Phase 3: T028–T034 run together; T037, T038 and T039 run together once their tests land; T045,
  T046 and T047 run together
- Phase 4: T048, T049 and T050 run together; T058, T059 and T060 run together
- Phase 5: T062–T066, T068, T070 and T073 run together
- Across teams: once Phase 2 completes, one developer takes the US1 presentation components while
  another takes the US2 targeting and reveal application code; only the occurrence, list and
  coordinator files need serializing

## Parallel Example: User Story 1

```bash
# Launch the failing tests together:
Task: "Schematic renderer tests in src/app/ui/hull-schematic/schematic-canvas.spec.ts"
Task: "Side selector and status tests in src/app/ui/hull-schematic/side-selector.spec.ts"
Task: "Legend tests in src/app/ui/hull-schematic/mount-legend.spec.ts"
Task: "Selected mount facts tests in src/app/ui/hull-schematic/selected-mount-facts.spec.ts"
Task: "Located-mount list tests in src/app/ui/hull-schematic/located-mount-list.spec.ts"
Task: "Hull anatomy container tests in src/app/features/build-workspace/hull-anatomy/hull-anatomy.component.spec.ts"
Task: "Locate journey in e2e/hull-anatomy.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — this blocks everything and includes the feature 005 port
   generalization
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: both schematics render unmodified package geometry, only exact
   `hardpoint` and `utility_mount` annotations resolving to the matching package kind are
   interactive, every package hardpoint and utility appears exactly once in the unique list in
   `ShipLoadout.slots()` order, every state has a text equivalent, a failed or defective side removes
   nothing but itself, and the capability passes axe in all ten projects
5. A Commander can locate and inspect every hardpoint and utility mount at this point

### Incremental Delivery

1. Setup + Foundational → the audited asset pipeline, the anatomy contract, the generalized power
   port, the safe parser, the same-origin loader, the pure projector, the revision-coherent store,
   the presentation boundary and the repository policy
2. Add US1 → both schematics, mount state, the legend, selected facts and the complete unique text
   equivalent (MVP)
3. Add US2 → one-interaction movement to the exact slot, deterministic ledger-to-geometry reveal,
   synchronized cross-side repeats and coalesced selection announcements
4. Polish → the responsive, accessible, localized, offline, privacy and performance gates and a green
   `pnpm run check`

### Constitutional Guardrails

- No task measures, moves, scales, re-draws or stores schematic geometry, reads `getBBox` or a screen
  matrix, or derives a centre, bounds, distance, direction or convergence from package artwork
- No task identifies a mount from an SVG id, label, model socket, drawing order, node number, key
  prefix, coordinate, module symbol or translated name; identity is the exact `data-journal-slot`
  resolved to a package slot of the matching kind
- No task invents geometry for a core, optional, armour or cargo-hatch slot, hides a package mount
  because its artwork is pending, unavailable or defective, or resolves a same-side duplicate by
  drawing order
- No task commits, imports, renames or fetches a package SVG from anywhere but the installed package
  copied by `angular.json`, and no task adds a second cache owner beside feature 001's service worker
- No task passes package markup through `innerHTML`, `bypassSecurityTrustHtml`, `<object>`,
  `<iframe>` or another active document, and no task silently sanitizes a contract violation instead
  of rejecting the side
- No task reads raw `FittedModule.on` or zero-based `priority`, joins consumers to bands, inspects
  modifiers or module families, or presents empty as disabled, not-applicable as powered or a missing
  observation as zero
- No task creates a second selected slot, calls a `ShipLoadout` mutation method, or persists anatomy
  side, scroll, selection or defect state to storage, history, a URL, a build link, SLEF or undo
  history
- No task hard-codes an owned string, a `/help` route, a parameterized issue URL or a colour, size,
  spacing, radius, elevation or motion literal outside the token layer, and no external URL carries
  hull, slot, module, build or storage data
- No task lowers the 80% coverage thresholds, drops a browser, viewport or orientation project, or
  skips a test to reach a green build

## Notes

- [P] tasks touch different files and have no incomplete dependency
- Every component task includes its unit test, its required-state preview declarations and its
  message keys; none of the three is a follow-up
- Current package counts are regression fixtures for the pinned 0.1.4 release, never runtime
  constants or limits on a future release
- Commit after each task or logical group; stop at a checkpoint to validate a story independently
