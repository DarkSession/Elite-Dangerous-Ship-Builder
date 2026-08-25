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
- Every task names every file it changes; there is no longer any exception. T022 was the one
  ledger-driven task whose targets were named by ledger row rather than by path, and it is withdrawn
  with the contextual entry

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
| Test-only expanded-copy and RTL pseudo locale providers                      | Feature 011 | T032, T052, T054             |
| Shared dialog/layer primitives and tokens under `src/app/ui/`                | Feature 011 | T019, T023, T028, T038       |
| `e2e/coverage-ledger.ts` — the shared machine-readable coverage ledger       | Feature 011 | T025, T063                   |
| Ten Chromium/Firefox viewport-orientation projects in `playwright.config.ts` | Feature 011 | T054, T055, T056, T057, T065 |
| Chromium CDP `Emulation.setCPUThrottlingRate(4)` throttled-timing harness    | Feature 003 | T057                         |
| Capability pages and layers in the Release coverage ledger                   | 001–011     | T025, T063                   |

The RTL and expanded-copy providers are test-only fixtures, not shipped locales: the shipped
application languages remain English and German. The throttled-timing harness is feature 003's, not
feature 011's — feature 011 supplies the viewport projects it runs over. `e2e/coverage-ledger.ts` is
feature 011's file, seeded by its own entries and appended to by every feature; this feature adds one
`helpRouteCoverage` export to it and owns no other row in it.

**Release automation is deliberately not a row above.** No workflow sets `SHIP_BUILDER_RELEASE_TAG`
(`ci.yml` gates `main` and pull requests and publishes successful `main` pushes to Pages;
`deploy.yml` can manually republish the same validated artifact), and
[contracts/distribution-artifacts.md](./contracts/distribution-artifacts.md) reads nothing else for
the decision — the patch `ci.yml` stamps into `package.json#version` before building is a version,
not release evidence. Every build produced today is therefore non-release with a `buildId` — the correct
outcome, not a gap. This feature implements and tests the classification without adding a release
workflow: because the decision is environment-driven, T010's release branch and T037's failure
branches are exercised by setting the variable in a generator fixture. No task here is blocked on
release automation existing.

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

- [x] T001 Add `help:manifest`, `help:manifest:check` and `legal:sync` script entries to `package.json`, chain manifest generation ahead of `start`, `build`, `watch`, `typecheck`, `test` and `e2e`, and chain its check command into `check`. **Amended 2026-08-25:** the check command is not what prevents staleness — see T008 — generation ahead of every command that reads the module is. `e2e:timing`, `e2e:offline`, `e2e:preview` and `ui:preview` are chained too, which the original list missed
- [x] T002 [P] Ignore the generated browser modules `src/app/platform/build/help-manifest.generated.ts` and `src/app/platform/build/help-topics.generated.ts` in `.gitignore` and `.prettierignore` while keeping `LICENSE` and `legal/` tracked
- [x] T003 [P] Create the byte-exact tracked mirror `legal/almanac/LICENSE` from the installed `@elite-dangerous-almanac/core` package artifact without editing a character
- [x] T004 [P] Create the byte-exact tracked mirror `legal/almanac/THIRD_PARTY_NOTICES.md` from the installed `@elite-dangerous-almanac/core` package artifact without editing a character
- [x] T005 [P] Record in `legal/almanac/README.md` that both files are byte-exact package mirrors, that ordinary builds never rewrite them, and that `pnpm run legal:sync` is the only maintainer path and requires review alongside the dependency update

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The immutable manifest contract, the build-time generator that produces it, the shared
modal instance and the one frame entry that satisfies FR-001, FR-002 and FR-011. The generator emits one
schema-complete `HelpManifestV1`, so its implementation is indivisible and lands here; each user story
owns its own failure fixtures, presenter projection, section rendering and journeys.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Manifest contract

- [x] T006 Define `HelpManifestV1`, `BuildIdentity`, `AlmanacIdentity`, `FrontierDisclaimer`, `ExternalDestination` and `SourceDistributionArtifact` plus `assertHelpManifest` in `src/app/domain/distribution/help-manifest.ts`; define `HelpTopicId`, the browser-safe `BrowserHelpTopic` ID/question/answer-key record and complete-catalogue invariant in `src/app/domain/help/help-topic.ts`, keeping topics explicitly outside `HelpManifestV1`
- [x] T007 Unit test the manifest invariants — exactly one disclaimer, one destination per ID, `repositoryLicense` as the sole `completeLegalTerms` destination, 64-lowercase-hex `sha256`, positive `byteLength`, non-empty versions — in `src/app/domain/distribution/help-manifest.spec.ts`, and the separate exact-seven ordered topic-catalogue invariant in `src/app/domain/help/help-topic.spec.ts` (depends on T006)

### Build-time generator

- [x] T008 Implement artifact resolution and strict UTF-8 reading of root `package.json`, root `LICENSE`, and the Almanac root located from `import.meta.resolve('@elite-dangerous-almanac/core/ships/ships')`, plus the `--check` and `--sync` CLI modes, in `scripts/generate-help-manifest.mjs`. **Amended 2026-08-25:** `--check` validates the sources a manifest is derived from and emits nothing; it does not compare its render against the artifact on disk. The emitted module carries `buildId` — the abbreviated commit and whether the tree is dirty — so the same sources render different bytes after any commit, and the comparison failed `pnpm run check` for a change nobody had made. It could not have caught staleness either: the artifact is git-ignored and every command that reads it regenerates it first
- [x] T009 Implement the disclaimer extraction in `scripts/generate-help-manifest.mjs`: locate the unique `Elite Dangerous game data and imagery (Frontier media-usage notice)` section, the unique `Under those rules:` marker, the immediately following non-empty indented block, strip exactly four structural leading spaces per line, and record `exactText`, `byteLength` and `sha256` (depends on T008)
- [x] T010 Implement build-identity classification in `scripts/generate-help-manifest.mjs`: copy `applicationVersion` from root `package.json#version`; implement exactly the three-outcome rule in [contracts/distribution-artifacts.md](./contracts/distribution-artifacts.md)'s Release declaration — a non-empty trimmed `SHIP_BUILDER_RELEASE_TAG` declares a release workflow; `kind: "release"` only when it equals `v${applicationVersion}` byte-exactly over a non-`0.0.0` version; `kind: "nonRelease"` with `GITHUB_RUN_ID` or an abbreviated commit plus optional `dirty` marker when it is unset or empty; fail instead of downgrading for any other declared value. Read no other environment variable for this decision (depends on T008)
- [x] T011 Implement Almanac identity and destination validation in `scripts/generate-help-manifest.mjs`: assert the installed package name is `@elite-dangerous-almanac/core`, copy its version, and validate the audited constant `https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/blob/main/LICENSE` as the sole destination, whose purpose is `completeLegalTerms`. The package's `bugs.url` is not read: FR-009 is withdrawn (depends on T008)
- [x] T012 Implement source-distribution mirror verification in `scripts/generate-help-manifest.mjs`: assert both installed Almanac legal artifacts are valid non-whitespace UTF-8, assert byte-for-byte equality with the tracked `legal/almanac/` mirrors on every read-only run, fail when the installed package root gains an unmirrored top-level `LICENSE*`, `LICENCE*`, `COPYING*`, `NOTICE*` or `*THIRD_PARTY*` file so an Almanac upgrade adding one receives review, and copy installed artifacts over the mirrors only under `--sync` (depends on T008)
- [x] T013 Implement deterministic TypeScript emission of the complete `HelpManifestV1` to `src/app/platform/build/help-manifest.generated.ts` in `scripts/generate-help-manifest.mjs`, escaping only as needed so re-encoding `exactText` reproduces the extracted bytes and hash (depends on T009, T010, T011, T012)
- [x] T014 Implement source-specific failure diagnostics in `scripts/generate-help-manifest.mjs`: name the offending artifact and rule, exit non-zero, write no partial output and expose no runtime fallback for any required-failure condition (depends on T013)
- [x] T015 Add the baseline generator suite in `scripts/generate-help-manifest.test.mjs` covering happy-path emission, byte-identical output across repeated runs and independent re-extraction proving the emitted `exactText`, `byteLength` and `sha256` match a fresh read of root `LICENSE` (depends on T014)

### Shared modal, state and entry surfaces

- [x] T016 [P] Seed the shell and section-heading message keys — the frame action's visible label, dialog title, purpose, close, and the reference's three section headings `About`, `FAQ` and `Licence` — in `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [x] T017 Implement the ephemeral `HelpDialogStore` signal store with `HelpInvocationContext`, `HelpDialogState` and the `closed → open → open(replace invocation) → closed` transitions in `src/app/application/help/help-dialog.store.ts`, with a spec proving it touches no Router, History, URL, storage or build state. `global` is the only invocation kind, because the frame action is the only entry (depends on T006)
- [x] T018 Implement the `HelpPresenter` shell composing the eagerly imported generated manifest with feature 011 localisation into `HelpDialogViewModel.title` and `purpose` in `src/app/application/help/help.presenter.ts`, with `src/app/application/help/help.presenter.spec.ts` asserting there is no loading, empty or legal-error view-model state (depends on T006, T016, T017)
- [x] T019 Implement the shared modal shell in `src/app/features/help/help-dialog.component.ts`, `help-dialog.component.html` and `help-dialog.component.scss`: feature 011 dialog layer with `role="dialog"`, `aria-modal="true"`, a visible labelled `Help · About` title, always-visible close action, header pinned over a vertically scrolling body, centered bounded wide treatment and full-width narrow bottom sheet, and the reference's three hairline-separated section slots in the order `ABOUT`, `FAQ`, `LICENCE`; add focused shell-semantic coverage in `src/app/features/help/help-dialog.component.spec.ts` (depends on T018)
- [x] T020 Mount the single modal instance beside the frame in `src/app/app.html` and `src/app/app.ts`, and publish the visible localised Help action as a shell action so the frame renders it in both the wide banner row and the compact action layer, reachable from every capability and no-build state (depends on T016, T019)
- [x] ~~T021 Implement the `ContextHelpLink` presentation component~~ — **withdrawn 2026-08-25.** The design reference draws no per-surface help control, so there is no contextual entry and no component for one
- [x] ~~T022 Wire `ContextHelpLink` into every row of the Release coverage ledger~~ — **withdrawn 2026-08-25** with T021. No feature 001–011 template is changed by this feature
- [x] T023 [P] Implement the shared `WarnedExternalLink` presentation component in `src/app/ui/components/warned-external-link/` as a native anchor that is inert until activation, carries `rel="noreferrer noopener"`, states its destination purpose plus the leaving-application and possible-network warnings in visible and accessible text, meets the shared token-backed 44 CSS-pixel target and has a focused co-located unit spec. The modal uses exactly one instance of it
- [x] T024 Register the closed-frame-entry and open-shell states in feature 011's preview catalogue `src/app/ui/previews/preview-manifest.ts` at desktop centered, tablet and mobile portrait, and tablet and mobile landscape sheet treatments, plus the shell-level reduced-motion and 400%-zoom reflow states required by [contracts/help-navigation.md](./contracts/help-navigation.md)'s component-preview list (depends on T016, T020)
- [x] T025 Transcribe the Release coverage ledger from [design/screen-inventory.md](./design/screen-inventory.md#release-coverage-ledger) one row at a time — transcribe, do not re-derive — into a single new `helpRouteCoverage` export appended to feature 011's shared `e2e/coverage-ledger.ts`, touching no entry another feature seeded there; and build the journey harness in `e2e/help-and-licences.spec.ts` that opens help from every transcribed row, including at least the wide frame action from a no-build capability, the compact action-layer item from an active workspace, hull detail as the package-artwork capability and the outfitting ledger as the package-value capability. For an obscured row, dismiss the layer and open help from the capability beneath, which is the route FR-011 now requires. Assert exactly one dialog instance, unchanged pathname/query/fragment/history length/build revision/selected slot/stored records, no route chunk or cross-origin request on open, an unchanged underlying capability after close, and — satisfying FR-002's prohibition rather than only its positive half — that the row's own surface embeds no legal body and offers no help control or legal destination of its own (depends on T020, T024)

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

- [x] T026 [US1] Add disclaimer failure fixtures to `scripts/generate-help-manifest.test.mjs` — absent, duplicated, malformed, empty, nested, section-crossing and boundary-crossing blocks, a missing `Under those rules:` marker, invalid UTF-8 and an emitted payload whose bytes, count or hash differ from fresh extraction — each asserting a named non-zero failure and no emitted output (depends on T015)
- [x] T027 [US1] Add legal-boundary failure fixtures to `scripts/generate-help-manifest.test.mjs` — one-byte mirror drift, an absent or unreadable mirror, a root `LICENSE` that no longer distinguishes the MIT grant from package artwork and game data, a non-HTTPS, credentialed, ported, queried or fragmented licence URL, an unexpected host/repository/ref/path, and an emission carrying more or fewer than one `completeLegalTerms` destination (depends on T026)
- [x] T028 [P] [US1] Implement the `LegalExcerpt` presentation component in `src/app/ui/components/legal-excerpt/` rendering the source and language framing plus a wrapping text-only `lang="en"` region bound as text content, never `innerHTML`, Markdown, an iframe or automatic linking, with a focused co-located unit spec. **Amended 2026-08-25:** the region binds `[textContent]` rather than an interpolation. Ahead-of-time compilation joins the newline of template indentation before a closing tag to the interpolated node and collapses it to a single space, which the Phase 3 journey caught as a byte the application had added to the notice; the property binding is text in exactly the same sense and carries the excerpt unaltered
- [x] T029 [US1] Extend `src/app/application/help/help.presenter.ts` with the `disclaimer`, `disclaimerLanguageNotice` and `repositoryLicense` projections, passing `exactText` through unchanged and taking the URL only from the generated manifest (depends on T018)
- [x] T030 [US1] Render the Licence section — heading, attribution, original-English notice, `LegalExcerpt`, then the warned repository-`LICENSE` action — as the final block of `src/app/features/help/help-dialog.component.html`, preserving the invariant reading order (depends on T023, T028, T029)
- [x] T031 [P] [US1] Add the localised licence framing messages naming Frontier, identifying root `LICENSE` as the excerpt source, stating the excerpt remains in original English and separating the MIT grant from Frontier and package rights, in `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [x] T032 [US1] Register the exact-disclaimer, warned-external-action, RTL-framing-with-English-excerpt and expanded-text preview states in feature 011's preview catalogue `src/app/ui/previews/preview-manifest.ts` (depends on T030, T031)
- [x] T033 [US1] Unit test in `src/app/features/help/help-dialog.component.spec.ts` that exactly one legal body renders, that it is text content inside a `lang="en"` region with no `innerHTML` binding, that no MIT, Almanac or third-party document body is embedded, and that exactly one action is labelled as the remaining-terms destination (depends on T030)
- [x] T034 [US1] Extend `e2e/help-and-licences.spec.ts` with the legal-presentation journey comparing the rendered disclaimer against a fresh generator extraction of root `LICENSE`, asserting non-empty unchanged text, the visible original-English notice and localised attribution, and no horizontal overflow or clipping of the excerpt (depends on T030)
- [x] T035 [US1] Extend `e2e/help-and-licences.spec.ts` with the external-navigation journey using request interception: assert no GitHub request or popup before activation, then that activation targets exactly `https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/blob/main/LICENSE` with `rel="noreferrer noopener"` and no query, fragment, route, build payload, SLEF, hull or module identity, locale or stored value (depends on T030)
- [x] T036 [US1] Extend `e2e/help-and-licences.spec.ts` with the offline journey: complete one online production-app load, disable the network, reload a no-build capability, open the modal before any hull artwork, and assert the complete disclaimer and framing are present with no request and no loading, missing or stale state while the network warning remains visible (depends on T030)

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

- [x] T037 [US2] Add identity fixtures to `scripts/generate-help-manifest.test.mjs`: set `SHIP_BUILDER_RELEASE_TAG` and `GITHUB_RUN_ID` directly in the fixture environment — no workflow is required — to prove that an unset or empty tag emits a valid `nonRelease` identity, that a tag equal to `v${applicationVersion}` over a non-`0.0.0` version emits `release`, and that a mismatched, `v0.0.0`, `latest`, `HEAD`, `undefined` or otherwise placeholder tag fails rather than downgrading; also reject production optimisation as release evidence, a missing or unsafe non-release identifier containing whitespace, a URL, a slash, a branch, a person, a machine, a timestamp or a random value, an installed package name other than `@elite-dangerous-almanac/core`, and an empty application or Almanac version (depends on T015)
- [x] T038 [P] [US2] Implement the `VersionFacts` presentation component in `src/app/ui/components/version-facts/` rendering semantic term/definition pairs with separate application and bundled-Almanac labels and a textual release or non-release state that never relies on colour, position or styling alone, with a focused co-located unit spec
- [x] T039 [US2] Extend `src/app/application/help/help.presenter.ts` with the `identityFacts` and `provenance` projections, always exposing `buildId` for a non-release identity and taking every value from the generated manifest (depends on T018)
- [x] T040 [US2] Render the `ABOUT` section as the first block of the modal body in `src/app/features/help/help-dialog.component.html` — heading, localised purpose sentence, then `VersionFacts` where the reference draws its version line, then the provenance notice — preserving the reference's `ABOUT` → `FAQ` → `LICENCE` order (depends on T038, T039)
- [x] T041 [P] [US2] Add the localised purpose sentence, version labels, release and non-release wording and bounded provenance statement — the bundled Almanac supplies catalogue data, validation and calculations, and Frontier owns the covered game data and imagery — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`, with no live-game or live-catalogue currency claim
- [x] T042 [US2] Register the open-release, open-non-release-with-build-ID and long-application/build/package-identifier preview states in feature 011's preview catalogue `src/app/ui/previews/preview-manifest.ts` (depends on T040, T041). **Amended 2026-08-25:** the catalogue's state vocabulary is feature 011's fixed five — `default`, `empty`, `loading`, `error`, `disabled` — and holds one fixture per state name, so release and non-release cannot both be a `default`. The catalogue draws the identity every build this repository produces has, which is non-release with its build id, read from the generated manifest rather than typed in; long identifiers are covered by the existing `long-identity` variant. The release wording is asserted where the substitution is made, in `help.presenter.spec.ts` and `help-dialog.component.spec.ts` under T043
- [x] T043 [US2] Unit test in `src/app/application/help/help.presenter.spec.ts` and `src/app/features/help/help-dialog.component.spec.ts` that the two versions are distinct labelled facts, that a non-release view model always carries a visible build ID, that release state is only shown for generator-classified release evidence, that provenance stays within its bounded statement, and that the modal renders exactly one external action (depends on T040)
- [x] T044 [US2] Extend `e2e/help-and-licences.spec.ts` with the identity journey in two legs. Online: the displayed application and Almanac versions equal the shipped root and installed manifests, the current build shows Non-release plus its build ID, and neither value is labelled live game or live catalogue. Offline, completing SC-004's identity part: after one completed online production-app load, disable the network, reload a no-build capability and assert the same version facts, non-release state, build ID and bounded provenance are present and unchanged, with no request and no loading, missing or stale state (depends on T040)
- [x] ~~T045 Extend `e2e/help-and-licences.spec.ts` with the package-defect navigation assertion~~ — **withdrawn 2026-08-25** with FR-009. T043 asserts instead that the modal renders exactly one external action

**Checkpoint**: User Stories 1 and 2 are both independently demonstrable over the same shared modal.

---

## Phase 5: User Story 3 - Understand application behaviour (Priority: P2)

**Goal**: The modal answers the seven accepted questions about build-link privacy, accounts and
telemetry, browser persistence, offline assets, completed engineering grades, hull facts versus build
results and Almanac ownership.

**Independent Test**: Open the modal from the wide frame action and from the compact action layer and
confirm all seven topics appear in the required order with localised question and answer text, no raw
message key, no import promise and no retained-partial-roll wording, and that the same complete `FAQ`
section is presented from either.

- [x] T046 [P] [US3] Define exactly one ordered tooling-only `HelpTopicDefinition` for each required ID — `buildLinkPrivacy`, `accountsUploadsTelemetry`, `browserPersistence`, `offlineAssets`, `completedEngineeringGrades`, `hullFactsAndBuildResults`, `almanacOwnership` — with question/answer message keys and the non-empty governing-reference sets from `contracts/help-navigation.md` in `scripts/help-topic-definitions.mjs`; no governing reference may enter `src/` or the browser bundle
- [ ] T047 [P] [US3] Add the seven localised question and answer pairs matching the accepted wording in [contracts/help-navigation.md](./contracts/help-navigation.md) to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`, excluding the reference mock's import claim and its retained-partial-roll answer
- [ ] T048 [US3] Implement `scripts/check-help-topics.mjs` and `scripts/check-help-topics.test.mjs` with generation and `--check` modes to reject a missing or duplicate required ID, changed order, empty or unresolved governing-reference set, unknown requirement/principle target, missing/blank shipped-locale question or answer and mismatched interpolation variables, then deterministically emit only the validated ID/question/answer-key records and no governing references to the separate `src/app/platform/build/help-topics.generated.ts` module; add `help:topics` and `help:topics:check` scripts to `package.json`, chain generation ahead of the same commands T001 chains — `start`, `build`, `watch`, `typecheck`, `test` and `e2e` — and the check into `pnpm run check` (depends on T046, T047)
- [ ] T049 [US3] Extend `src/app/application/help/help.presenter.ts` with the ordered `topics: LocalisedHelpTopic[7]` projection from the separate generated topic catalogue and a defensive invariant that rejects a missing, duplicated, reordered or blank runtime topic without publishing a partial modal (depends on T048)
- [ ] T050 [US3] Render the `FAQ` section between `ABOUT` and `LICENCE` in `src/app/features/help/help-dialog.component.html` as one reading sequence with a coherent heading hierarchy, matching the reference's question-then-answer pairs (depends on T049)
- [ ] T051 [US3] Unit test in `src/app/application/help/help.presenter.spec.ts`, `src/app/domain/help/help-topic.spec.ts` and `scripts/check-help-topics.test.mjs` that all seven IDs resolve exactly once in order, no answer contains a raw key, blank value, unresolved interpolation or HTML, prohibited import/partial-roll wording is absent, and neither a governing reference nor a partial topic set enters the separate generated topic module (depends on T050)
- [ ] T052 [US3] Register the all-seven-topics-populated, doubled/expanded-text and RTL-framing preview states in feature 011's preview catalogue `src/app/ui/previews/preview-manifest.ts` (depends on T050)
- [ ] T053 [US3] Extend `e2e/help-and-licences.spec.ts` to assert all seven topics from the wide frame action and from the compact action layer; add the offline leg completing SC-004's help part — after one completed online production-app load, disable the network, reload a no-build capability and assert the same seven topics render in order with complete localised question and answer text, no request and no loading, missing or stale state; and record the required seven-topic content review against every governing source in `specs/012-help-and-licences/design/help-topic-review.md`, failing release for any unchecked, contradictory, unsupported or speculative claim (depends on T050, T051)

**Checkpoint**: All three user stories are independently functional over one shared modal instance.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: The accessibility, responsive, performance, purity and release gates that span every
story.

- [ ] T054 Extend `e2e/help-and-licences.spec.ts` with the axe, semantic and no-overflow sweep (governed by feature 011 FR-012 and FR-021 and constitution principle V; baseline in [design/screen-inventory.md](./design/screen-inventory.md#accessibility-responsive-and-localisation-baseline)) over the closed background and every open state — release, non-release, alternate locale and long text — across feature 011's ten Chromium and Firefox viewport and orientation projects (depends on T053)
- [ ] T055 Assert the 200%-text and actual-400%-zoom reflow states (governed by feature 011 FR-011 and constitution principle V) in `e2e/help-and-licences.spec.ts`: every section and action stays reachable, the title and close stay available, the disclaimer is not clipped and the document has no horizontal overflow (depends on T054)
- [ ] T056 Assert, under feature 011 FR-011/FR-012 and constitution principle V, in `e2e/help-and-licences.spec.ts` that open and closed state remains immediate and textual under `prefers-reduced-motion` and that no meaning depends on motion, colour, icon, shape, dimming or placement (depends on T055)
- [ ] T057 Assert in `e2e/help-and-licences.spec.ts` that opening the already-loaded modal presents its first complete frame within 100 ms at the mobile viewport under 4× CPU slowdown, with no route load, same-origin asset request or cross-origin request — SC-005 in full. The no-request half also enforces FR-001 and runs in every project of feature 011's matrix; the timing half reuses feature 003's Chromium CDP `Emulation.setCPUThrottlingRate(4)` harness — the same baseline features 005, 009 and 010 measure against — and is therefore Chromium-only, which is a property of the harness rather than a narrowed matrix (depends on T056)
- [ ] T058 [P] Confirm the eagerly imported manifest and bundled English help catalogue stay within the existing production initial-bundle error budget in `angular.json`. The ceiling itself is already enforced by `ng build` under T065; this task exists for the response when it is exceeded — record the measured initial-bundle size and the overage as a defect in `specs/012-help-and-licences/design/help-and-licences.md` under a Bundle budget heading, and do not raise the budget within this feature
- [x] T059 Add the generated-output purity test to `scripts/generate-help-manifest.test.mjs` asserting the emitted module contains no absolute workspace path, personal, account, machine or environment identifier, timestamp, random value, build payload or unrequested complete legal document (depends on T037)
- [ ] T060 Record the completed manual screen-reader protocol required by constitution principle V and feature 011 FR-011 — entry discovery from a no-build and an active capability, single labelled dialog, background isolation, heading and topic order, version distinctions, disclaimer source and language, external warnings and the unchanged capability after close — in `specs/012-help-and-licences/design/screen-reader-record.md` (depends on T057)
- [x] T061 [P] Satisfy feature 011 FR-015 by stating the qualified conformance wording naming excluded criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11 wherever this feature's accessibility conformance is reported in `specs/012-help-and-licences/design/help-and-licences.md`
- [x] T062 [P] Document in `AGENTS.md` the `pnpm run legal:sync` maintainer path, its review requirement after an Almanac upgrade, the rule that ordinary builds never rewrite tracked mirrors, and the two distinct generated-artifact conventions now in the repository — the build-link codec table is committed and regenerated on demand, while `help-manifest.generated.ts` and `help-topics.generated.ts` are ignored and regenerated ahead of every Angular command — so a contributor is not left inferring which rule applies
- [ ] T063 Reconcile the `helpRouteCoverage` export in `e2e/coverage-ledger.ts` against the Release coverage ledger in [design/screen-inventory.md](./design/screen-inventory.md#release-coverage-ledger) in both directions and complete the frame-entry, modal, legal, identity and topic mappings with the live FR-001–FR-011 requirement IDs, excluding withdrawn FR-009; fail review on any row present in one and absent from the other, and on any capability, package-backed surface or obscuring layer that features 001–011 now ship but neither lists. The reconciliation is scoped to that one export: entries features 001–011 seeded elsewhere in the same file describe their own requirements and are neither expected in the Release coverage ledger nor a finding when absent from it. Feature 011's component preview application is the single recorded exclusion from the Release coverage ledger, which is why its preview-catalogue entries appear in the shared file but not here. Register the SC-001–SC-005 ids against the named assertions that evidence them in `e2e/coverage-ledger.ts`. (depends on T025)
- [ ] T064 Walk [quickstart.md](./quickstart.md) sections 1 through 8 against the built application and record any divergence as a defect rather than a documentation edit; quickstart section 9 is T065's gate, so the two tasks together cover the document (depends on T054, T055, T056, T057, T058, T059, T060, T061, T062, T063)
- [ ] T065 Run the `pnpm run check` pipeline declared in `package.json` to green — quickstart section 9 — covering format, typecheck, production build, generator tests, unit coverage at or above the 80% thresholds and the complete Playwright and axe matrix, with no skipped browser, viewport, accessibility rule or test (depends on T054, T055, T056, T057, T058, T059, T060, T061, T062, T063, T064)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational only
- **User Story 3 (Phase 5)**: Depends on Foundational only
- **Polish (Phase 6)**: Depends on every story that is being shipped

### User Story Dependencies

- **US1 (P1)**: Independent. Adds the Licence section, its generator fixtures and its journeys
- **US2 (P1)**: Independent. Adds the `ABOUT` section's identity facts and provenance, its generator fixtures and its journeys
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
- `e2e/help-and-licences.spec.ts`: T025 → T034–T036, T044, T053–T057
- `e2e/coverage-ledger.ts` (feature 011-owned, shared): T025 → T063, both confined to the
  `helpRouteCoverage` export

Six of these chains cross story boundaries: the presenter, the modal template, the preview
catalogue, the two locale files, the generator test suite and the E2E spec are each touched by US1,
US2 and US3. `[P]` on T031, T041 and T047 means they are parallel-safe **within their own phase**,
where each is the only task touching the locale files — it does not make them safe to run
concurrently with each other.

## Parallel Opportunities

- Phase 1: T002, T003, T004 and T005 run together after T001
- Phase 2: T016 and T023 run together; T017 follows T006 and generator edits T009–T014 remain sequential
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
4. **STOP and VALIDATE**: the modal opens from the frame action without navigation, the disclaimer is
   byte-identical to root `LICENSE`, one warned GitHub action carries all remaining terms, and it all
   works on the first offline visit after one completed online load
5. SC-001 and SC-004's disclaimer part are satisfied at this point. SC-004 names three things —
   help, version information and the disclaimer — so it closes only after US2 and US3 land

### Incremental Delivery

1. Setup + Foundational → verified manifest, one shared modal, the one frame entry
2. Add US1 → the `LICENCE` section's exact terms and attribution (MVP, SC-001)
3. Add US2 → the `ABOUT` section's shipped identities and bounded provenance (SC-002, and SC-004's identity part)
4. Add US3 → the `FAQ` section's seven accepted behaviour answers (SC-003, and SC-004's help part, which completes it)
5. Polish → complete axe, reflow, performance, purity and manual gates, then a green `pnpm run check`

### Constitutional Guardrails

- No task adds a backend, account, telemetry, runtime legal fetch, runtime environment
  configuration, help route, Markdown renderer, second theme, automatic external navigation or
  user-facing element the design reference does not draw
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
- The generated modules are rebuilt, never committed; the `legal/almanac/` mirrors are committed,
  never rewritten by an ordinary build
- There is exactly one enumeration of capabilities, package-backed surfaces and obscuring layers —
  the Release coverage ledger in [design/screen-inventory.md](./design/screen-inventory.md#release-coverage-ledger).
  T025 transcribes it into the `helpRouteCoverage` export of feature 011's shared
  `e2e/coverage-ledger.ts`, and T063 reconciles that export against it in both directions. Never
  re-derive it, and never widen the reconciliation to the rows other features own in the same file
- T036, T044 and T053 each perform their own online-load-then-offline bootstrap for their third of
  SC-004. The repetition is the price of story independence and is deliberate; if all three ship,
  extracting one shared offline fixture is a safe follow-up, not a prerequisite
- Commit after each task or logical group; stop at a checkpoint to validate a story independently
