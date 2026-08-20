---
description: 'Task list for Help, Licences and Provenance'
---

# Tasks: Help, Licences and Provenance

**Input**: Design documents from `/specs/012-help-and-licences/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [design/](./design/),
[quickstart.md](./quickstart.md)

**Tests**: Test tasks are included. FR-005 makes artifact verification a release gate, constitution
principle VIII gates the build on unit coverage, the Playwright matrix and automated accessibility
scans, and [quickstart.md](./quickstart.md) defines runnable acceptance scenarios.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested and
demonstrated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Every task names every file it changes. A task that spans several files names all of them; it is
  never left to the implementer to infer an unnamed file

## Path Conventions

Single Angular workspace at the repository root: product source in `src/`, build tooling in
`scripts/`, tracked source-distribution mirrors in `legal/`, end-to-end suite in `e2e/`. Unit tests
live beside their source as `*.spec.ts`; Node generator tests live beside their script as
`*.test.mjs`.

## Repository Dependencies

Feature 001 supplies the application frame, canonical build fragment and browser persistence.
Feature 011 supplies the sole service-worker/base app-shell caching, shared dialog layer, tokens,
complete English/German localisation, the preview catalogue and the ten-project Chromium/Firefox axe
harness. Tasks below extend those owning paths rather than duplicating them; a task that names an
011-owned file assumes that file exists.

**These are hard gates, not soft assumptions.** Before starting Phase 2, confirm each of the
following exists; none of them is created by a task in this feature, and a task that names one
cannot start until its owner has shipped it:

| Prerequisite                                                                 | Owner       | Tasks gated on it            |
| ---------------------------------------------------------------------------- | ----------- | ---------------------------- |
| `src/app/ui/components/app-frame/` — frame with wide and narrow action bar   | Feature 011 | T020, T024, T025             |
| `src/app/i18n/locales/en.json` and `de.json` — localisation with fallback    | Feature 011 | T016, T031, T041, T047       |
| `src/app/ui/previews/preview-manifest.ts` — component preview catalogue      | Feature 011 | T024, T032, T042, T052       |
| Shared dialog/layer primitives and tokens under `src/app/ui/`                | Feature 011 | T019, T021, T023, T028, T038 |
| Ten Chromium/Firefox viewport-orientation projects in `playwright.config.ts` | Feature 011 | T054, T055, T056, T057, T065 |
| Capability pages and layers named by `design/screen-inventory.md`            | 001–010     | T022, T025, T063             |

Phase 1 (T001–T005), the manifest contract and generator (T006–T015) and the ephemeral dialog store
(T017) depend on none of the above and can proceed while feature 011 is still in flight. T016 and
everything downstream of it is blocked until the rows it depends on are satisfied. The ten-project
matrix in particular is the minimum constitution principle VIII accepts: a suite that runs fewer
projects has not covered this feature's journeys, so T054–T057 and T065 fail rather than pass on a
narrower matrix.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the build commands, ignore rules and tracked source-distribution mirrors the
generator and modal need before any source lands.

- [ ] T001 Add `help:manifest`, `help:manifest:check` and `legal:sync` script entries to `package.json`, chain manifest generation ahead of `start`, `build`, `watch`, `typecheck` and `test`, and chain its check command into `check` so no Angular command runs against a stale generated manifest
- [ ] T002 [P] Ignore the generated browser modules `src/app/platform/build/help-manifest.generated.ts` and `src/app/platform/build/help-topics.generated.ts` in `.gitignore` and `.prettierignore` while keeping `LICENSE` and `legal/` tracked
- [ ] T003 [P] Create the byte-exact tracked mirror `legal/almanac/LICENSE` from the installed `@elite-dangerous-almanac/core` package artifact without editing a character
- [ ] T004 [P] Create the byte-exact tracked mirror `legal/almanac/THIRD_PARTY_NOTICES.md` from the installed `@elite-dangerous-almanac/core` package artifact without editing a character
- [ ] T005 [P] Record in `legal/almanac/README.md` that both files are byte-exact package mirrors, that ordinary builds never rewrite them, and that `pnpm run legal:sync` is the only maintainer path and requires review alongside the dependency update

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The immutable manifest contract, the build-time generator that produces it, the shared
modal instance and the entry surfaces that satisfy FR-001, FR-002 and FR-011. The generator emits one
schema-complete `HelpManifestV1`, so its implementation is indivisible and lands here; each user story
owns its own failure fixtures, presenter projection, section rendering and journeys.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Manifest contract

- [ ] T006 Define `HelpManifestV1`, `BuildIdentity`, `AlmanacIdentity`, `FrontierDisclaimer`, `ExternalDestination` and `SourceDistributionArtifact` plus `assertHelpManifest` in `src/app/domain/distribution/help-manifest.ts`; define `HelpTopicId`, the browser-safe ID/question/answer-key record and complete-catalogue invariant in `src/app/domain/help/help-topic.ts`, keeping topics explicitly outside `HelpManifestV1`
- [ ] T007 Unit test the manifest invariants — exactly one disclaimer, one destination per ID, `repositoryLicense` as the sole `completeLegalTerms` destination, 64-lowercase-hex `sha256`, positive `byteLength`, non-empty versions — in `src/app/domain/distribution/help-manifest.spec.ts`, and the separate exact-seven ordered topic-catalogue invariant in `src/app/domain/help/help-topic.spec.ts` (depends on T006)

### Build-time generator

- [ ] T008 Implement artifact resolution and strict UTF-8 reading of root `package.json`, root `LICENSE`, and the Almanac root located from `import.meta.resolve('@elite-dangerous-almanac/core/ships/ships')`, plus the `--check` and `--sync` CLI modes, in `scripts/generate-help-manifest.mjs`
- [ ] T009 Implement the disclaimer extraction in `scripts/generate-help-manifest.mjs`: locate the unique `Elite Dangerous game data and imagery (Frontier media-usage notice)` section, the unique `Under those rules:` marker, the immediately following non-empty indented block, strip exactly four structural leading spaces per line, and record `exactText`, `byteLength` and `sha256` (depends on T008)
- [ ] T010 Implement build-identity classification in `scripts/generate-help-manifest.mjs`: copy `applicationVersion` from root `package.json#version`; emit `kind: "release"` only for explicit version-matched evidence over a non-`0.0.0` version inside a declared release workflow; emit `kind: "nonRelease"` with a bounded CI identifier or abbreviated commit plus optional `dirty` marker when no release workflow is declared; fail instead of downgrading when a declared release workflow has missing, mismatched or placeholder evidence (depends on T008)
- [ ] T011 Implement Almanac identity and destination validation in `scripts/generate-help-manifest.mjs`: assert the installed package name is `@elite-dangerous-almanac/core`, copy its version, validate `bugs.url` as the exact credential/port/query/fragment-free HTTPS issues URL, and validate the audited constant `https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/blob/main/LICENSE` as the sole `completeLegalTerms` destination (depends on T008)
- [ ] T012 Implement source-distribution mirror verification in `scripts/generate-help-manifest.mjs`: assert both installed Almanac legal artifacts are valid non-whitespace UTF-8, assert byte-for-byte equality with the tracked `legal/almanac/` mirrors on every read-only run, and copy installed artifacts over the mirrors only under `--sync` (depends on T008)
- [ ] T013 Implement deterministic TypeScript emission of the complete `HelpManifestV1` to `src/app/platform/build/help-manifest.generated.ts` in `scripts/generate-help-manifest.mjs`, escaping only as needed so re-encoding `exactText` reproduces the extracted bytes and hash (depends on T009, T010, T011, T012)
- [ ] T014 Implement source-specific failure diagnostics in `scripts/generate-help-manifest.mjs`: name the offending artifact and rule, exit non-zero, write no partial output and expose no runtime fallback for any required-failure condition (depends on T013)
- [ ] T015 Add the baseline generator suite in `scripts/generate-help-manifest.test.mjs` covering happy-path emission, byte-identical output across repeated runs and independent re-extraction proving the emitted `exactText`, `byteLength` and `sha256` match a fresh read of root `LICENSE` (depends on T014)

### Shared modal, state and entry surfaces

- [ ] T016 [P] Seed the shell and section-heading message keys — dialog title, purpose, close, `Help`, `Versions and data`, `Licence` — in `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T017 Implement the ephemeral `HelpDialogStore` signal store with `HelpInvocationContext`, `HelpDialogState` and the `closed → open → open(replace invocation) → closed` transitions in `src/app/application/help/help-dialog.store.ts`, with a spec proving it touches no Router, History, URL, storage or build state (depends on T006)
- [ ] T018 Implement the `HelpPresenter` shell composing the eagerly imported generated manifest with feature 011 localisation into `HelpDialogViewModel.title` and `purpose` in `src/app/application/help/help.presenter.ts`, with `src/app/application/help/help.presenter.spec.ts` asserting there is no loading, empty or legal-error view-model state (depends on T006, T016, T017)
- [ ] T019 Implement the shared modal shell in `src/app/features/help/help-dialog.component.ts`, `help-dialog.component.html` and `help-dialog.component.scss`: feature 011 dialog layer with `role="dialog"`, `aria-modal="true"`, a visible labelled `Help · About` title, purpose, always-visible close action, header pinned over a vertically scrolling body, centered bounded wide treatment and full-width narrow bottom sheet; add focused shell-semantic coverage in `src/app/features/help/help-dialog.component.spec.ts` (depends on T018)
- [ ] T020 Mount the single modal instance in feature 011's application frame and add the visible localised `Help · About` action to both the wide frame and the narrow action menu in `src/app/ui/components/app-frame/` so it is reachable from every capability and no-build state (depends on T016, T019)
- [ ] T021 [P] Implement the `ContextHelpLink` presentation component with a visible localised label, shared token-backed 44 CSS-pixel target and open-intent output, plus its focused co-located unit spec, in `src/app/ui/components/context-help-link/`
- [ ] T022 Wire `ContextHelpLink` into every package-backed artwork/value region and every full-screen layer enumerated by `specs/012-help-and-licences/design/screen-inventory.md`, including `src/app/features/hull-detail/hull-detail.page.html`, `src/app/features/build-workspace/build-workspace.page.html` and `src/app/ui/components/layer/layer.html`, so every surface required by FR-002 and FR-011 dispatches the shared open intent instead of embedding help copy (depends on T021)
- [ ] T023 [P] Implement the shared `WarnedExternalLink` presentation component in `src/app/ui/components/warned-external-link/` as a native anchor that is inert until activation, carries `rel="noreferrer noopener"`, states its destination purpose plus the leaving-application and possible-network warnings in visible and accessible text, meets the shared token-backed 44 CSS-pixel target and has a focused co-located unit spec
- [ ] T024 Register the closed-frame-entry, closed-contextual-entry and open-shell states in feature 011's preview catalogue `src/app/ui/previews/preview-manifest.ts` at desktop centered, tablet and mobile portrait, and tablet and mobile landscape sheet treatments, plus the shell-level reduced-motion and 400%-zoom reflow states required by [contracts/help-navigation.md](./contracts/help-navigation.md)'s component-preview list (depends on T016, T020, T021, T022)
- [ ] T025 Create the exhaustive FR-011 coverage set in `e2e/coverage-ledger.ts` and the journey harness in `e2e/help-and-licences.spec.ts`: enumerate and open help from every current capability, applicable package-backed artwork/value surface and obscuring layer in `specs/012-help-and-licences/design/screen-inventory.md`, including at least the wide frame action from a no-build capability, narrow menu action from an active workspace, package artwork entry and package value entry; assert exactly one dialog instance, unchanged pathname/query/fragment/history length/build revision/selected slot/stored records, no route chunk or cross-origin request on open, and an unchanged underlying capability after close (depends on T020, T022, T024)

**Checkpoint**: The shared modal opens and closes from every required surface over verified build artifacts. Story sections can now be added independently.

---

## Phase 3: User Story 1 - Read terms and attribution (Priority: P1) 🎯 MVP

**Goal**: The modal presents the exact project-specific Frontier disclaimer from root `LICENSE`,
attributes it, distinguishes it from the application MIT grant and offers one warned GitHub `LICENSE`
link as the destination for all remaining terms.

**Independent Test**: Open the modal from any capability, including on the first offline visit after
one completed online load, and confirm the disclaimer text is byte-identical to a fresh generator
extraction, that it is the only embedded legal body, and that exactly one action — the repository
`LICENSE` on GitHub — is described as the destination for remaining licence and third-party terms.

- [ ] T026 [US1] Add disclaimer failure fixtures to `scripts/generate-help-manifest.test.mjs` — absent, duplicated, malformed, empty, nested, section-crossing and boundary-crossing blocks, a missing `Under those rules:` marker, invalid UTF-8 and an emitted payload whose bytes, count or hash differ from fresh extraction — each asserting a named non-zero failure and no emitted output (depends on T015)
- [ ] T027 [US1] Add legal-boundary failure fixtures to `scripts/generate-help-manifest.test.mjs` — one-byte mirror drift, an absent or unreadable mirror, a root `LICENSE` that no longer distinguishes the MIT grant from package artwork and game data, a non-HTTPS, credentialed, ported, queried or fragmented licence URL, an unexpected host/repository/ref/path, and an emission carrying more or fewer than one `completeLegalTerms` destination (depends on T026)
- [ ] T028 [P] [US1] Implement the `LegalExcerpt` presentation component in `src/app/ui/components/legal-excerpt/` rendering the source and language framing plus a wrapping text-only `lang="en"` region bound with interpolation, never `innerHTML`, Markdown, an iframe or automatic linking, with a focused co-located unit spec
- [ ] T029 [US1] Extend `src/app/application/help/help.presenter.ts` with the `disclaimer`, `disclaimerLanguageNotice` and `repositoryLicense` projections, passing `exactText` through unchanged and taking the URL only from the generated manifest (depends on T018)
- [ ] T030 [US1] Render the Licence section — heading, attribution, original-English notice, `LegalExcerpt`, then the warned repository-`LICENSE` action — as the final block of `src/app/features/help/help-dialog.component.html`, preserving the invariant reading order (depends on T023, T028, T029)
- [ ] T031 [P] [US1] Add the localised licence framing messages naming Frontier, identifying root `LICENSE` as the excerpt source, stating the excerpt remains in original English and separating the MIT grant from Frontier and package rights, in `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T032 [US1] Register the exact-disclaimer, warned-external-action, RTL-framing-with-English-excerpt and expanded-text preview states in feature 011's preview catalogue `src/app/ui/previews/preview-manifest.ts` (depends on T030, T031)
- [ ] T033 [US1] Unit test in `src/app/features/help/help-dialog.component.spec.ts` that exactly one legal body renders, that it is text content inside a `lang="en"` region with no `innerHTML` binding, that no MIT, Almanac or third-party document body is embedded, and that exactly one action is labelled as the remaining-terms destination (depends on T030)
- [ ] T034 [US1] Extend `e2e/help-and-licences.spec.ts` with the legal-presentation journey comparing the rendered disclaimer against a fresh generator extraction of root `LICENSE`, asserting non-empty unchanged text, the visible original-English notice and localised attribution, and no horizontal overflow or clipping of the excerpt (depends on T030)
- [ ] T035 [US1] Extend `e2e/help-and-licences.spec.ts` with the external-navigation journey using request interception: assert no GitHub request or popup before activation, then that activation targets exactly `https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/blob/main/LICENSE` with `rel="noreferrer noopener"` and no query, fragment, route, build payload, SLEF, hull or module identity, locale or stored value (depends on T030)
- [ ] T036 [US1] Extend `e2e/help-and-licences.spec.ts` with the offline journey: complete one online production-app load, disable the network, reload a no-build capability, open the modal before any hull artwork, and assert the complete disclaimer and framing are present with no request and no loading, missing or stale state while the network warning remains visible (depends on T030)

**Checkpoint**: User Story 1 is independently demonstrable — verified terms and attribution, offline, with one audited legal destination.

---

## Phase 4: User Story 2 - Identify shipped versions and data (Priority: P1)

**Goal**: The modal presents the shipped application and bundled Almanac versions as separate facts,
shows non-release builds as such with their build ID, bounds provenance to the package's
catalogue/calculation role and offers the Almanac issue tracker for package defects only.

**Independent Test**: Open the modal and confirm the displayed application version equals root
`package.json#version`, the bundled Almanac version equals the installed package version, the current
build is visibly Non-release with its generated build ID, no label claims live-game or live-catalogue
currency, and the issue action targets the Almanac issues page under a narrower, non-legal purpose.

- [ ] T037 [US2] Add identity fixtures to `scripts/generate-help-manifest.test.mjs`: prove that no declared release workflow emits a valid `nonRelease` identity, and that a declared release workflow with missing, mismatched or placeholder `0.0.0` evidence fails; also reject production optimisation as release evidence, a missing or unsafe non-release identifier containing whitespace, a URL, a slash, a branch, a person, a machine, a timestamp or a random value, an installed package name other than `@elite-dangerous-almanac/core`, an empty application or Almanac version, and an absent, changed or unsafe `bugs.url` (depends on T015)
- [ ] T038 [P] [US2] Implement the `VersionFacts` presentation component in `src/app/ui/components/version-facts/` rendering semantic term/definition pairs with separate application and bundled-Almanac labels and a textual release or non-release state that never relies on colour, position or styling alone, with a focused co-located unit spec
- [ ] T039 [US2] Extend `src/app/application/help/help.presenter.ts` with the `identityFacts`, `provenance` and `almanacIssues` projections, always exposing `buildId` for a non-release identity and taking every value from the generated manifest (depends on T018)
- [ ] T040 [US2] Render the Versions and data provenance section between the Help topics and the Licence section in `src/app/features/help/help-dialog.component.html`, composing `VersionFacts`, the provenance notice and the warned Almanac package-defect action (depends on T023, T038, T039)
- [ ] T041 [P] [US2] Add the localised version labels, release and non-release wording, bounded provenance statement — the bundled Almanac supplies catalogue data, validation and calculations, and Frontier owns the covered game data and imagery — and the narrow package-defect action wording to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`, with no live-game or live-catalogue currency claim
- [ ] T042 [US2] Register the open-release, open-non-release-with-build-ID and long-application/build/package-identifier preview states in feature 011's preview catalogue `src/app/ui/previews/preview-manifest.ts` (depends on T040, T041)
- [ ] T043 [US2] Unit test in `src/app/application/help/help.presenter.spec.ts` and `src/app/features/help/help-dialog.component.spec.ts` that the two versions are distinct labelled facts, that a non-release view model always carries a visible build ID, that release state is only shown for generator-classified release evidence, that provenance stays within its bounded statement and that the issue action is not described as legal detail (depends on T040)
- [ ] T044 [US2] Extend `e2e/help-and-licences.spec.ts` with the identity journey in two legs. Online: the displayed application and Almanac versions equal the shipped root and installed manifests, the current build shows Non-release plus its build ID, and neither value is labelled live game or live catalogue. Offline, completing SC-004's identity half: after one completed online production-app load, disable the network, reload a no-build capability and assert the same version facts, non-release state, build ID and bounded provenance are present and unchanged, with no request and no loading, missing or stale state (depends on T040)
- [ ] T045 [US2] Extend `e2e/help-and-licences.spec.ts` with the package-defect navigation assertion: no request before activation, then activation targeting exactly `https://github.com/DarkSession/Elite-Dangerous-Almanac/issues` with `rel="noreferrer noopener"`, the visible leaving-application and network warnings, and no query, fragment or build data (depends on T040)

**Checkpoint**: User Stories 1 and 2 are both independently demonstrable over the same shared modal.

---

## Phase 5: User Story 3 - Understand application behaviour (Priority: P2)

**Goal**: The modal answers the seven accepted questions about build-link privacy, accounts and
telemetry, browser persistence, offline assets, completed engineering grades, hull facts versus build
results and Almanac ownership.

**Independent Test**: Open the modal from a global and from a contextual entry and confirm all seven
topics appear in the required order with localised question and answer text, no raw message key, no
import promise and no retained-partial-roll wording, and that a topic hint changes only the initial
position while the complete modal stays available.

- [ ] T046 [P] [US3] Define exactly one ordered tooling-only `HelpTopicDefinition` for each required ID — `buildLinkPrivacy`, `accountsUploadsTelemetry`, `browserPersistence`, `offlineAssets`, `completedEngineeringGrades`, `hullFactsAndBuildResults`, `almanacOwnership` — with question/answer message keys and the non-empty governing-reference sets from `contracts/help-navigation.md` in `scripts/help-topic-definitions.mjs`; no governing reference may enter `src/` or the browser bundle
- [ ] T047 [P] [US3] Add the seven localised question and answer pairs matching the accepted wording in [contracts/help-navigation.md](./contracts/help-navigation.md) to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`, excluding the reference mock's import claim and its retained-partial-roll answer
- [ ] T048 [US3] Implement `scripts/check-help-topics.mjs` and `scripts/check-help-topics.test.mjs` with generation and `--check` modes to reject a missing or duplicate required ID, changed order, empty or unresolved governing-reference set, unknown requirement/principle target, missing/blank shipped-locale question or answer and mismatched interpolation variables, then deterministically emit only the validated ID/question/answer-key records and no governing references to the separate `src/app/platform/build/help-topics.generated.ts` module; add `help:topics` and `help:topics:check` scripts to `package.json`, chain generation ahead of Angular commands and the check into `pnpm run check` (depends on T046, T047)
- [ ] T049 [US3] Extend `src/app/application/help/help.presenter.ts` with the ordered `topics` projection from the separate generated topic catalogue and a defensive invariant that rejects a missing, duplicated, reordered or blank runtime topic without publishing a partial modal (depends on T048)
- [ ] T050 [US3] Render the Help topics section directly after the header in `src/app/features/help/help-dialog.component.html` as one reading sequence with a coherent heading hierarchy, and apply the optional invocation topic hint to the initial in-modal position only (depends on T049)
- [ ] T051 [US3] Unit test in `src/app/application/help/help.presenter.spec.ts`, `src/app/domain/help/help-topic.spec.ts` and `scripts/check-help-topics.test.mjs` that all seven IDs resolve exactly once in order, no answer contains a raw key, blank value, unresolved interpolation or HTML, prohibited import/partial-roll wording is absent, and neither a governing reference nor a partial topic set enters the separate generated topic module (depends on T050)
- [ ] T052 [US3] Register the all-seven-topics-populated, doubled/expanded-text and RTL-framing preview states in feature 011's preview catalogue `src/app/ui/previews/preview-manifest.ts` (depends on T050)
- [ ] T053 [US3] Extend `e2e/help-and-licences.spec.ts` to assert all seven topics from global and contextual entry and record the required seven-topic content review against every governing source in `specs/012-help-and-licences/design/help-topic-review.md`, failing release for any unchecked, contradictory, unsupported or speculative claim (depends on T050, T051)

**Checkpoint**: All three user stories are independently functional over one shared modal instance.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: The accessibility, responsive, performance, purity and release gates that span every
story.

- [ ] T054 Extend `e2e/help-and-licences.spec.ts` with the axe, semantic and no-overflow sweep over the closed background and every open state — release, non-release, global, contextual, alternate locale and long text — across feature 011's ten Chromium and Firefox viewport and orientation projects (depends on T053)
- [ ] T055 Assert the 200%-text and actual-400%-zoom reflow states in `e2e/help-and-licences.spec.ts`: every section and action stays reachable, the title and close stay available, the disclaimer is not clipped and the document has no horizontal overflow (depends on T054)
- [ ] T056 Assert in `e2e/help-and-licences.spec.ts` that open and closed state remains immediate and textual under `prefers-reduced-motion` and that no meaning depends on motion, colour, icon, shape, dimming or placement (depends on T055)
- [ ] T057 Assert in `e2e/help-and-licences.spec.ts` that opening the already-loaded modal presents its first complete frame within 100 ms under the shared mobile 4x-CPU profile with no route load, same-origin asset request or cross-origin request. The no-request half enforces FR-001; the 100 ms budget is a [plan.md](./plan.md) Performance Goals constraint rather than an accepted spec requirement, so a regression against it is a defect in this feature's plan compliance, not an FR failure (depends on T056)
- [ ] T058 [P] Confirm the eagerly imported manifest and bundled English help catalogue stay within the existing production initial-bundle error budget in `angular.json`; record a defect if the ceiling is exceeded and do not raise the budget within this feature
- [ ] T059 Add the generated-output purity test to `scripts/generate-help-manifest.test.mjs` asserting the emitted module contains no absolute workspace path, personal, account, machine or environment identifier, timestamp, random value, build payload or unrequested complete legal document (depends on T037)
- [ ] T060 Record the completed manual screen-reader protocol — entry discovery from a no-build and an active capability, single labelled dialog, background isolation, heading and topic order, version distinctions, disclaimer source and language, external warnings and the unchanged capability after close — in `specs/012-help-and-licences/design/screen-reader-record.md` (depends on T057)
- [ ] T061 [P] State the qualified conformance wording naming excluded criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11 wherever this feature's accessibility conformance is reported in `specs/012-help-and-licences/design/help-and-licences.md`
- [ ] T062 [P] Document in `AGENTS.md` the `pnpm run legal:sync` maintainer path, its review requirement after an Almanac upgrade, the rule that ordinary builds never rewrite tracked mirrors, and the two distinct generated-artifact conventions now in the repository — the build-link codec table is committed and regenerated on demand, while `help-manifest.generated.ts` and `help-topics.generated.ts` are ignored and regenerated ahead of every Angular command — so a contributor is not left inferring which rule applies
- [ ] T063 Audit and complete this feature's exhaustive capability/surface rows plus frame-entry, contextual-entry, modal, legal, identity and topic mappings with FR-001–FR-011 requirement IDs in `e2e/coverage-ledger.ts`; fail review if any current capability, applicable package-backed surface or obscuring layer from `specs/012-help-and-licences/design/screen-inventory.md` is absent
- [ ] T064 Walk [quickstart.md](./quickstart.md) sections 1 through 8 against the built application and record any divergence as a defect rather than a documentation edit; quickstart section 9 is T065's gate, so the two tasks together cover the document (depends on T054, T055, T056, T057, T058, T059, T060, T061, T062, T063)
- [ ] T065 Run the `pnpm run check` pipeline declared in `package.json` to green — quickstart section 9 — covering format, typecheck, production build, generator tests, unit coverage at or above the 80% thresholds and the complete Playwright and axe matrix, with no skipped browser, viewport, accessibility rule or test (depends on T054, T055, T056, T057, T058, T059, T060, T061, T062, T063, T064)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational only; the shared `WarnedExternalLink` is foundational T023
- **User Story 3 (Phase 5)**: Depends on Foundational only
- **Polish (Phase 6)**: Depends on every story that is being shipped

### User Story Dependencies

- **US1 (P1)**: Independent. Adds the Licence section, its generator fixtures and its journeys
- **US2 (P1)**: Independent. Adds the Versions and data provenance section, its generator fixtures and its journeys over the foundational warned-link primitive
- **US3 (P2)**: Independent. Adds the governed Help topics through a separate generated catalogue,
  modal section and journeys without bundling the governing references

### Within Each User Story

- Generator fixtures and the presenter projection precede section rendering
- Presentation components precede the template that composes them
- Section rendering precedes its unit tests and journeys
- Message entries land with the section that consumes them, never as a follow-up

### Sequential Files

- `scripts/generate-help-manifest.mjs`: T008 → T009 → T010 → T011 → T012 → T013 → T014
- `scripts/help-topic-definitions.mjs` and `scripts/check-help-topics.mjs`: T046 → T048
- `package.json`: T001 → T048
- `scripts/generate-help-manifest.test.mjs`: US1's T026 → T027 and US2's T037 each branch from T015 and merge one at a time; T059 follows T037
- `src/app/application/help/help.presenter.ts`: T018 → T029, T039, T049
- `src/app/features/help/help-dialog.component.html`: T019 → T030, T040, T050
- `src/app/ui/previews/preview-manifest.ts`: T024 → T032 → T042 → T052
- `src/app/i18n/locales/en.json` and `de.json`: T016 → T031, T041, T047
- `e2e/help-and-licences.spec.ts`: T025 → T034–T036, T044, T045, T053–T057

Six of these chains cross story boundaries: the presenter, the modal template, the preview
catalogue, the two locale files, the generator test suite and the E2E spec are each touched by US1,
US2 and US3. `[P]` on T031, T041 and T047 means they are parallel-safe **within their own phase**,
where each is the only task touching the locale files — it does not make them safe to run
concurrently with each other.

## Parallel Opportunities

- Phase 1: T002, T003, T004 and T005 run together after T001
- Phase 2: T016, T021 and T023 run together; T017 follows T006 and generator edits T009–T014 remain sequential
- Phase 3: T028, T029 and T031 run together after Foundational; T032 follows the rendered section and messages
- Phase 4: T038, T039 and T041 run together after Foundational; T042 follows the rendered section and messages
- Phase 5: T046 and T047 run together; T048–T053 then follow their declared dependencies
- Phase 6: T058, T061 and T062 can run together after the story phases; same-file E2E tasks T054–T057 remain sequential
- Across teams: once Phase 2 completes, one developer can take US1, another US2 and a third US3 — all shared primitives are already foundational. This is story-level independence, not conflict-free concurrency: the six chains named under [Sequential Files](#sequential-files) each pass through all three stories, so the presenter projection, the template section, the preview registration, the locale entries, the generator fixtures and the E2E additions merge one story at a time. Sequence those six by story priority (US1 → US2 → US3) and the rest of each story runs genuinely in parallel

## Parallel Example: User Story 1

```bash
# Launch the independent presentation components and content together:
Task: "Legal excerpt component in src/app/ui/components/legal-excerpt/"
Task: "Disclaimer presenter projection in src/app/application/help/help.presenter.ts"
Task: "Licence framing messages in src/app/i18n/locales/en.json and de.json"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — this blocks everything
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: the modal opens from every enumerated entry without navigation, the disclaimer is
   byte-identical to root `LICENSE`, one warned GitHub action carries all remaining terms, and it all
   works on the first offline visit after one completed online load
5. SC-001 and SC-004's legal half are satisfied at this point

### Incremental Delivery

1. Setup + Foundational → verified manifest, one shared modal, every entry surface
2. Add US1 → exact terms and attribution (MVP, SC-001)
3. Add US2 → shipped identities and bounded provenance (SC-002, and SC-004's identity half)
4. Add US3 → the seven accepted behaviour answers (SC-003)
5. Polish → complete axe, reflow, performance, purity and manual gates, then a green `pnpm run check`

### Constitutional Guardrails

- No task adds a backend, account, telemetry, runtime legal fetch, runtime environment
  configuration, help route, Markdown renderer, second theme or automatic external navigation
- No task embeds a second legal body, a translated disclaimer, a hand-maintained copy of package
  wording or a second `completeLegalTerms` destination
- A missing, empty, ambiguous or drifted artifact fails generation; no task adds a runtime loading,
  missing or stale legal state
- No task lowers the 80% coverage thresholds, drops a browser or viewport project, or skips a test to
  reach a green build

## Notes

- [P] tasks touch different files and have no incomplete dependency **within their own phase**; see
  [Sequential Files](#sequential-files) for the chains that serialise across stories
- Every new presentation component is implemented with a focused co-located unit spec; shared locale
  and preview-catalogue edits are separate, explicitly sequenced tasks
- The generated module is rebuilt, never committed; the `legal/almanac/` mirrors are committed, never
  rewritten by an ordinary build
- Commit after each task or logical group; stop at a checkpoint to validate a story independently
