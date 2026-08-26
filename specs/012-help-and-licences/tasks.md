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
- [x] T019 Implement the shared modal shell in `src/app/features/help/help-dialog.component.ts`, `help-dialog.component.html` and `help-dialog.component.scss`: feature 011 dialog layer with `role="dialog"`, native modal semantics (a `dialog` opened with `showModal()`, whose `:modal` state is what the journey asserts rather than an `aria-modal` attribute the platform makes redundant), a visible labelled `Help · About` title, always-visible close action, header pinned over a vertically scrolling body, centered bounded wide treatment and full-width narrow bottom sheet, and the reference's three hairline-separated section slots in the order `ABOUT`, `FAQ`, `LICENCE`; add focused shell-semantic coverage in `src/app/features/help/help-dialog.component.spec.ts` (depends on T018)
- [x] T020 Mount the single modal instance beside the frame in `src/app/app.html` and `src/app/app.ts`, and publish the visible localised Help action as a shell action so the frame renders it in both the wide banner row and the compact action layer, reachable from every capability and no-build state (depends on T016, T019)
- [x] ~~T021 Implement the `ContextHelpLink` presentation component~~ — **withdrawn 2026-08-25.** The design reference draws no per-surface help control, so there is no contextual entry and no component for one
- [x] ~~T022 Wire `ContextHelpLink` into every row of the Release coverage ledger~~ — **withdrawn 2026-08-25** with T021. No feature 001–011 template is changed by this feature
- [x] ~~T023 [P] Implement the shared `WarnedExternalLink` presentation component~~ — **withdrawn 2026-08-25, design-conformance pass.** The reference draws no control in the modal other than its close, so the modal has no external navigation and nothing to warn about. The component and its spec are deleted with FR-003's link
- [x] T024 Register the closed-frame-entry and open-shell states in feature 011's preview catalogue `src/app/ui/previews/preview-manifest.ts` at desktop centered, tablet and mobile portrait, and tablet and mobile landscape sheet treatments, plus the shell-level reduced-motion and 400%-zoom reflow states required by [contracts/help-navigation.md](./contracts/help-navigation.md)'s component-preview list (depends on T016, T020)
- [x] T025 Transcribe the Release coverage ledger from [design/screen-inventory.md](./design/screen-inventory.md#release-coverage-ledger) one row at a time — transcribe, do not re-derive — into a single new `helpRouteCoverage` export appended to feature 011's shared `e2e/coverage-ledger.ts`, touching no entry another feature seeded there; and build the journey harness in `e2e/help-and-licences.spec.ts` that opens help from every transcribed row, including at least the wide frame action from a no-build capability, the compact action-layer item from an active workspace, hull detail as the package-artwork capability and the outfitting ledger as the package-value capability. For an obscured row, dismiss the layer and open help from the capability beneath, which is the route FR-011 now requires. Assert exactly one dialog instance, unchanged pathname/query/fragment/history length/build revision/selected slot/stored records, no route chunk or cross-origin request on open, an unchanged underlying capability after close, and — satisfying FR-002's prohibition rather than only its positive half — that the row's own surface embeds no legal body and offers no help control or legal destination of its own (depends on T020, T024)

**Checkpoint**: The shared modal opens and closes from every required surface over verified build artifacts. Story sections can now be added independently.

---

## Phase 3: User Story 1 - Read terms and attribution (Priority: P1) 🎯 MVP

**Goal**: The modal presents the reference's own three-line summary of what covers what, and beneath
it the exact project-specific Frontier disclaimer from root `LICENSE`, unchanged. **Amended 2026-08-25, design-conformance pass:** the
prose attribution and the warned GitHub `LICENSE` link are withdrawn; the reference draws neither.

**Independent Test**: Open the modal from any capability, including on the first offline visit after
one completed online load, and confirm the disclaimer text is byte-identical to a fresh generator
extraction, that it is the only embedded legal body, that the three summary lines sit above it, and
that the modal offers no way out of the application at all.

- [x] T026 [US1] Add disclaimer failure fixtures to `scripts/generate-help-manifest.test.mjs` — absent, duplicated, malformed, empty, nested, section-crossing and boundary-crossing blocks, a missing `Under those rules:` marker, invalid UTF-8 and an emitted payload whose bytes, count or hash differ from fresh extraction — each asserting a named non-zero failure and no emitted output (depends on T015)
- [x] T027 [US1] Add legal-boundary failure fixtures to `scripts/generate-help-manifest.test.mjs` — one-byte mirror drift, an absent or unreadable mirror, a root `LICENSE` that no longer distinguishes the MIT grant from package artwork and game data, a non-HTTPS, credentialed, ported, queried or fragmented licence URL, an unexpected host/repository/ref/path, and an emission carrying more or fewer than one `completeLegalTerms` destination (depends on T026)
- [x] T028 [P] [US1] Implement the `LegalExcerpt` presentation component in `src/app/ui/components/legal-excerpt/` rendering the source and language framing plus a wrapping text-only `lang="en"` region bound as text content, never `innerHTML`, Markdown, an iframe or automatic linking, with a focused co-located unit spec. **Amended 2026-08-25, design-conformance pass:** the source and language framing is withdrawn: the reference draws neither sentence, and the language is declared as the region's `lang` — the same fact as a property rather than as prose. The component is reduced to `text` and `language` inputs. **Also amended 2026-08-25:** the region binds `[textContent]` rather than an interpolation. Ahead-of-time compilation joins the newline of template indentation before a closing tag to the interpolated node and collapses it to a single space, which the Phase 3 journey caught as a byte the application had added to the notice; the property binding is text in exactly the same sense and carries the excerpt unaltered
- [x] T029 [US1] Extend `src/app/application/help/help.presenter.ts` with the licence projection, passing `exactText` through unchanged (depends on T018). **Amended 2026-08-25, design-conformance pass:** the `disclaimerLanguageNotice` and `repositoryLicense` projections are withdrawn. What replaces them is `licence.index` — the reference's own three-line summary of what covers what — plus the excerpt and its language. The audited URL is still validated by the generator and is projected nowhere
- [x] T030 [US1] Render the `LICENCE` section — heading, the three-line summary as a list, then `LegalExcerpt` — as the final block of `src/app/features/help/help-dialog.component.html`, preserving the invariant reading order (depends on T028, T029). **Amended 2026-08-25, design-conformance pass:** the prose attribution, the original-English notice and the warned repository-`LICENSE` action are withdrawn, and the T023 dependency with them. The section is what the reference draws: a summary, then the notice
- [x] T031 [P] [US1] Add the localised three-line licence summary — the application's own code under MIT, the game data and imagery under Frontier's media-usage rules, and the typefaces under the SIL Open Font Licence — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`. **Amended 2026-08-25, design-conformance pass:** the framing, source and language sentences this task originally added are withdrawn and removed from both catalogues. The summary is the reference's own, with its second line corrected: no CC BY-NC-SA grant for the icons is evidenced in this repository, and the ship art reaches this application from the Almanac under Frontier's rules
- [x] T032 [US1] Register the exact-disclaimer, RTL-with-English-excerpt and expanded-text preview states in feature 011's preview catalogue `src/app/ui/previews/preview-manifest.ts` (depends on T030, T031)
- [x] T033 [US1] Unit test in `src/app/features/help/help-dialog.component.spec.ts` that exactly one legal body renders, that it is text content inside a `lang="en"` region with no `innerHTML` binding, that no MIT, Almanac or third-party document body is embedded, and — amended 2026-08-25 — that the modal renders no anchor and no external destination at all (depends on T030)
- [x] T034 [US1] Extend `e2e/help-and-licences.spec.ts` with the legal-presentation journey comparing the rendered disclaimer against a fresh generator extraction of root `LICENSE`, asserting non-empty unchanged text, the three localised summary lines above it — amended 2026-08-25 in place of the withdrawn original-English notice and prose attribution — and no horizontal overflow or clipping of the excerpt (depends on T030)
- [x] T035 [US1] Extend `e2e/help-and-licences.spec.ts` with the no-external-navigation journey: assert the open modal contains no `a[href]`, no `target="_blank"` and nothing that navigates, and that no request or popup reaches GitHub or any other origin while it is open (depends on T030). **Amended 2026-08-25, design-conformance pass:** the journey originally asserted the properties of the one external action. There is no action; the assertion is now that there is none
- [x] T036 [US1] Extend `e2e/help-and-licences.spec.ts` with the offline journey: complete one online production-app load, disable the network, reload a no-build capability, open the modal before any hull artwork, and assert the complete disclaimer and the three summary lines are present with no request and no loading, missing or stale state — amended 2026-08-25: there is no network warning to remain visible, because there is no external action (depends on T030)

**Checkpoint**: User Story 1 is independently demonstrable — verified terms and attribution, offline, with one audited legal destination.

---

## Phase 4: User Story 2 - Identify shipped versions and data (Priority: P1)

**Goal**: The modal presents the shipped application and bundled Almanac versions as two separately
labelled facts, and nothing else in `ABOUT` beyond the purpose sentence. **Amended 2026-08-25, design-conformance pass:** the build-ID
display, the bounded provenance statement and the issue-tracker action are all withdrawn; the
reference draws two version facts and no third, no provenance paragraph and no such action.

**Independent Test**: Open the modal and confirm the displayed application version equals root
`package.json#version`, the bundled Almanac version equals the installed package version, the current
facts number exactly two, nothing in the modal names a release classification, and no label claims
live-game or live-catalogue currency.

- [x] T037 [US2] Add identity fixtures to `scripts/generate-help-manifest.test.mjs`: set `SHIP_BUILDER_RELEASE_TAG` and `GITHUB_RUN_ID` directly in the fixture environment — no workflow is required — to prove that an unset or empty tag emits a valid `nonRelease` identity, that a tag equal to `v${applicationVersion}` over a non-`0.0.0` version emits `release`, and that a mismatched, `v0.0.0`, `latest`, `HEAD`, `undefined` or otherwise placeholder tag fails rather than downgrading; also reject production optimisation as release evidence, a missing or unsafe non-release identifier containing whitespace, a URL, a slash, a branch, a person, a machine, a timestamp or a random value, an installed package name other than `@elite-dangerous-almanac/core`, and an empty application or Almanac version (depends on T015)
- [x] T038 [P] [US2] Implement the `VersionFacts` presentation component in `src/app/ui/components/version-facts/` rendering semantic term/definition pairs with separate application and bundled-Almanac labels, with a focused co-located unit spec. **Amended 2026-08-25, design-conformance pass:** the release/non-release state is withdrawn with FR-007's display half. The component renders the facts it is given and makes no claim about which kind of build produced them
- [x] T039 [US2] Extend `src/app/application/help/help.presenter.ts` with the `about` projection — exactly the application and Almanac version facts, taken from the generated manifest (depends on T018). **Amended 2026-08-25, design-conformance pass:** the build-kind fact, the `buildId` and the provenance projection are all withdrawn. The reference draws two version facts and no third and no provenance paragraph; the Almanac credit moves to the `almanacOwnership` topic
- [x] T040 [US2] Render the `ABOUT` section as the first block of the modal body in `src/app/features/help/help-dialog.component.html` — heading, localised purpose sentence, then `VersionFacts` where the reference draws its version line — preserving the reference's `ABOUT` → `FAQ` → `LICENCE` order (depends on T038, T039). **Amended 2026-08-25, design-conformance pass:** the provenance notice is withdrawn; `ABOUT` ends at the version facts, as the reference draws it
- [x] T041 [P] [US2] Add the localised purpose sentence and the two version labels to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`, with no live-game or live-catalogue currency claim. **Amended 2026-08-25, design-conformance pass:** the release and non-release wording and the provenance statement are withdrawn and removed from both catalogues. The purpose sentence is the reference's own
- [x] T042 [US2] Register the open-identity and long-identifier preview states in feature 011's preview catalogue `src/app/ui/previews/preview-manifest.ts` (depends on T040, T041). **Amended 2026-08-25:** the catalogue's state vocabulary is feature 011's fixed five — `default`, `empty`, `loading`, `error`, `disabled` — and holds one fixture per state name, so release and non-release cannot both be a `default`. The catalogue draws the identity every build this repository produces has, which is non-release with its build id, read from the generated manifest rather than typed in; long identifiers are covered by the existing `long-identity` variant. **Superseded 2026-08-25, design-conformance pass:** there is no release or non-release wording left to assert anywhere. The catalogue registers the two version facts the modal draws
- [x] T043 [US2] Unit test in `src/app/application/help/help.presenter.spec.ts` and `src/app/features/help/help-dialog.component.spec.ts` that the two versions are distinct labelled facts, that there is no third fact and no release wording anywhere in the view, and that the modal renders no external action (depends on T040). **Amended 2026-08-25, design-conformance pass:** each assertion is inverted from the one it replaces, because each of those was evidence for something the reference does not draw
- [x] T044 [US2] Extend `e2e/help-and-licences.spec.ts` with the identity journey in two legs. Online: the displayed application and Almanac versions equal the shipped root and installed manifests, there are exactly two facts, and neither value is labelled live game or live catalogue. Offline, completing SC-004's identity part: after one completed online production-app load, disable the network, reload a no-build capability and assert the same two version facts are present and unchanged, with no request and no loading, missing or stale state (depends on T040). **Amended 2026-08-25, design-conformance pass:** the non-release, build-ID and provenance legs are withdrawn with what they asserted
- [x] ~~T045 Extend `e2e/help-and-licences.spec.ts` with the package-defect navigation assertion~~ — **withdrawn 2026-08-25** with FR-009. T043 asserts instead that the modal renders no external action at all — the same design-conformance pass withdrew FR-003's repository-`LICENSE` link, so there is no destination left for this task to have asserted against (corrected 2026-08-26, which is when the stale wording was noticed)

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
- [x] T047 [P] [US3] Add the seven localised question and answer pairs matching the accepted wording in [contracts/help-navigation.md](./contracts/help-navigation.md) to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`, excluding the reference mock's import claim and its retained-partial-roll answer. **Amended 2026-08-25, design-conformance pass:** three of the seven are asked in the reference's own words, because the reference asks an equivalent question and the reference is this feature's template — `buildLinkPrivacy`, `browserPersistence` (with the reference's own answer) and `completedEngineeringGrades` (with an answer the reference's own cannot supply). The `almanacOwnership` answer also now carries the once-per-application Almanac credit the withdrawn `ABOUT` provenance statement used to carry. The contract is amended to match
- [x] T048 [US3] Implement `scripts/check-help-topics.mjs` and `scripts/check-help-topics.test.mjs` with generation and `--check` modes to reject a missing or duplicate required ID, changed order, empty or unresolved governing-reference set, unknown requirement/principle target, missing/blank shipped-locale question or answer and mismatched interpolation variables, then deterministically emit only the validated ID/question/answer-key records and no governing references to the separate `src/app/platform/build/help-topics.generated.ts` module; add `help:topics` and `help:topics:check` scripts to `package.json`, chain generation ahead of the same commands T001 chains — `start`, `build`, `watch`, `typecheck`, `test` and `e2e` — and the check into `pnpm run check` (depends on T046, T047)
- [x] T049 [US3] Extend `src/app/application/help/help.presenter.ts` with the ordered `topics: LocalisedHelpTopic[7]` projection from the separate generated topic catalogue and a defensive invariant that rejects a missing, duplicated, reordered or blank runtime topic without publishing a partial modal (depends on T048)
- [x] T050 [US3] Render the `FAQ` section between `ABOUT` and `LICENCE` in `src/app/features/help/help-dialog.component.html` as one reading sequence with a coherent heading hierarchy, matching the reference's question-then-answer pairs (depends on T049)
- [x] T051 [US3] Unit test in `src/app/application/help/help.presenter.spec.ts`, `src/app/domain/help/help-topic.spec.ts` and `scripts/check-help-topics.test.mjs` that all seven IDs resolve exactly once in order, no answer contains a raw key, blank value, unresolved interpolation or HTML, prohibited import/partial-roll wording is absent, and neither a governing reference nor a partial topic set enters the separate generated topic module (depends on T050)
- [x] T052 [US3] Register the all-seven-topics-populated, doubled/expanded-text and RTL-framing preview states in feature 011's preview catalogue `src/app/ui/previews/preview-manifest.ts` (depends on T050)
- [x] T053 [US3] Extend `e2e/help-and-licences.spec.ts` to assert all seven topics, in their declared order and each question a heading over its own answer, from the wide frame action and from the compact action layer; add the offline leg completing SC-004's help part — after one completed online production-app load, disable the network, reload a no-build capability and assert the same seven topics render in order with complete localised question and answer text, no request and no loading, missing or stale state; and record the required seven-topic content review against every governing source in `specs/012-help-and-licences/design/help-topic-review.md`, failing release for any unchecked, contradictory, unsupported or speculative claim (depends on T050, T051)

**Checkpoint**: All three user stories are independently functional over one shared modal instance.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: The accessibility, responsive, performance, purity and release gates that span every
story.

- [x] T054 Extend `e2e/help-and-licences.spec.ts` with the axe, semantic and no-overflow sweep (governed by feature 011 FR-012 and FR-021 and constitution principle V; baseline in [design/screen-inventory.md](./design/screen-inventory.md#accessibility-responsive-and-localisation-baseline)) over the closed background and every open state — default, alternate locale and long text; there is no release or non-release state left to sweep — across feature 011's ten Chromium and Firefox viewport and orientation projects (depends on T053). **Landed 2026-08-25:** one `sweep` helper applied to each state in the describe block "the floor beneath every open state", so a state added later gets the same six checks rather than four of them
- [x] T055 Assert the 200%-text and actual-400%-zoom reflow states (governed by feature 011 FR-011 and constitution principle V) in `e2e/help-and-licences.spec.ts`: every section and action stays reachable, the title and close stay available, the disclaimer is not clipped and the document has no horizontal overflow (depends on T054). **Landed 2026-08-25:** and it found a defect outside this feature: at 200% text on a phone the compact action layer's panel was taller than the space below the sticky banner it hangs from, putting the Help entry — FR-001's only route — at y 873 in an 844-pixel viewport with no way to scroll to it. The panel is now bounded to the viewport with its own scroller in `action-layer.scss`
- [x] T056 Assert, under feature 011 FR-011/FR-012 and constitution principle V, in `e2e/help-and-licences.spec.ts` that open and closed state remains immediate and textual under `prefers-reduced-motion` and that no meaning depends on motion, colour, icon, shape, dimming or placement (depends on T055). **Landed 2026-08-25:** open state is read as the dialog's own `:modal` match rather than as an `aria-modal` attribute, because the layer is a native `dialog` opened with `showModal()` and the attribute would duplicate what the platform already says
- [x] T057 Assert in `e2e/help-and-licences.spec.ts` that opening the already-loaded modal presents its first complete frame within 100 ms at the mobile viewport under 4× CPU slowdown, with no route load, same-origin asset request or cross-origin request — SC-005 in full. The no-request half also enforces FR-001 and runs in every project of feature 011's matrix; the timing half reuses feature 003's Chromium CDP `Emulation.setCPUThrottlingRate(4)` harness — the same baseline features 005, 009 and 010 measure against — and is therefore Chromium-only, which is a property of the harness rather than a narrowed matrix (depends on T056). **Landed 2026-08-25:** the measurement is `e2e/help-timing.spec.ts`, five rounds timed inside the page to the first frame after a paint, worst round the verdict. It joins feature 002's keystroke measurement in the one serial timing project, so `TIMING_SPEC` became `TIMING_SPECS`
- [x] T058 [P] Confirm the eagerly imported manifest and bundled English help catalogue stay within the existing production initial-bundle error budget in `angular.json`. The ceiling itself is already enforced by `ng build` under T065; this task exists for the response when it is exceeded — record the measured initial-bundle size and the overage as a defect in `specs/012-help-and-licences/design/help-and-licences.md` under a Bundle budget heading, and do not raise the budget within this feature. **Measured 2026-08-25:** 402.26 kB raw / 101.41 kB transfer against the 500 kB warning ceiling. Within budget, no defect, recorded under that heading
- [x] T059 Add the generated-output purity test to `scripts/generate-help-manifest.test.mjs` asserting the emitted module contains no absolute workspace path, personal, account, machine or environment identifier, timestamp, random value, build payload or unrequested complete legal document (depends on T037)
- [x] T060 Record the completed manual screen-reader protocol required by constitution principle V and feature 011 FR-011 — entry discovery from a no-build and an active capability, single labelled dialog, background isolation, heading and topic order, the two version facts as two distinct labelled facts, each question as a heading over its own answer, the licence summary as a list and the excerpt in its declared language, and the unchanged capability after close; there are no external warnings to hear, because the modal has no external action — in `specs/012-help-and-licences/design/screen-reader-record.md` (depends on T057). **Landed 2026-08-25:** the record is written and the protocol gains step 17, with result rows in `e2e/manual/results/screen-reader.md` and `zoom-400.md`. **The run itself has not been performed** — this container is Linux, `guidepup` needs a Windows or macOS runner and TalkBack has no driver at all — so the record states that plainly, lists what the automated suite covers in its place, and stays release-blocking. Filling those rows in from a suite that cannot hear anything would be the one thing the protocol forbids
- [x] T061 [P] Satisfy feature 011 FR-015 by stating the qualified conformance wording naming excluded criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11 wherever this feature's accessibility conformance is reported in `specs/012-help-and-licences/design/help-and-licences.md`
- [x] T062 [P] Document the `pnpm run legal:sync` maintainer path, its review requirement after an Almanac upgrade, the rule that ordinary builds never rewrite tracked mirrors, and the two distinct generated-artifact conventions now in the repository — the build-link codec table is committed and regenerated on demand, while `help-manifest.generated.ts` and `help-topics.generated.ts` are ignored and regenerated ahead of every Angular command — so a contributor is not left inferring which rule applies. _Relocated 2026-08-25: this was written into `AGENTS.md`, which has since been cut back to feature pointers. It now lives in `contracts/distribution-artifacts.md`, under "Source-distribution mirrors" and "Two generated-artifact conventions, and neither generalises"._
- [x] T063 Reconcile the `helpRouteCoverage` export in `e2e/coverage-ledger.ts` against the Release coverage ledger in [design/screen-inventory.md](./design/screen-inventory.md#release-coverage-ledger) in both directions and complete the frame-entry, modal, legal, identity and topic mappings with the live FR-001–FR-011 requirement IDs, excluding withdrawn FR-009; fail review on any row present in one and absent from the other, and on any capability, package-backed surface or obscuring layer that features 001–011 now ship but neither lists. The reconciliation is scoped to that one export: entries features 001–011 seeded elsewhere in the same file describe their own requirements and are neither expected in the Release coverage ledger nor a finding when absent from it. Feature 011's component preview application is the single recorded exclusion from the Release coverage ledger, which is why its preview-catalogue entries appear in the shared file but not here. Register the SC-001–SC-005 ids against the named assertions that evidence them in `e2e/coverage-ledger.ts`. (depends on T025). **Landed 2026-08-25:** the reconciliation reads the document's own table rather than restating it, and compares for equality in both directions. It found two wrong rows: the incoming-build normalisation refusal is reported inside the layer that provoked it, so the frame is obscured there, and the application frame's own row carried the Owner column's fact in the frame-entry column. Feature 012 joins `COVERED_FEATURES` with six coverage entries carrying FR-001–FR-011 and SC-001–SC-005; withdrawn FR-009 is unbolded in the specification, following feature 003's convention for an id that no longer declares anything
- [x] T064 Walk [quickstart.md](./quickstart.md) sections 1 through 8 against the built application and record any divergence as a defect rather than a documentation edit; quickstart section 9 is T065's gate, so the two tasks together cover the document (depends on T054, T055, T056, T057, T058, T059, T060, T061, T062, T063)
- [x] T065 Run the `pnpm run check` pipeline declared in `package.json` to green — quickstart section 9 — covering format, typecheck, production build, generator tests, unit coverage at or above the 80% thresholds and the complete Playwright and axe matrix, with no skipped browser, viewport, accessibility rule or test (depends on T054, T055, T056, T057, T058, T059, T060, T061, T062, T063, T064). **Run 2026-08-25 against `b305713`:** every stage green — `format:check`, `help:artifacts:check`, `typecheck`, `build` at 403.19 kB raw / 101.83 kB transfer, `build:preview`, seven policy checkers, the codec capacity table, 252 generator tests and 160 unit files / 2152 tests at 85.8 / 84.18 / 89.46 / 86.01 coverage. The five Chromium projects ran 2780 tests with 2775 passing; all five failures are 30-second timeouts under eight workers and all five pass on their own, 10 of 10 across every profile. Timing 2/2, offline 70/70. The five Firefox projects could not be run in this container — the engine is not installed and the download is blocked by the network policy — so nothing was skipped or narrowed in the configuration, but the matrix walked here is Chromium-complete rather than complete. Recorded in [design/quickstart-walk.md](./design/quickstart-walk.md#section-9s-gate-and-the-two-results-that-needed-a-baseline)

---

## Phase 7: The reference's own wording, 2026-08-26

**Purpose**: Two accepted departures from the design reference are withdrawn on the reference's own
terms, and the defect the first of them exposed is fixed. Recorded in
[design/reference-review.md](./design/reference-review.md#two-departures-withdrawn-on-2026-08-26).

**Independent Test**: At a wide viewport the command bar's help entry is drawn as `?` and answers to
the accessible name `Help`; in the compact action layer the same entry is drawn in words; the second
identity fact reads `Library version`; and at 200% text on a 390-pixel phone every entry of the
compact action layer is inside the viewport and can be pressed.

- [x] T066 Draw the frame's help entry as the reference's own `?` on the wide command bar. Add an optional `symbol` to `ShellAction` in `src/app/ui/components/app-frame/app-frame.ts` and to `ActionButton` in `src/app/ui/components/action/`, rendering the mark `aria-hidden` beside the action's name as text so the accessible name is unchanged at both widths; pass it from `src/app/app.ts` for the help action only, and leave `action-layer.html` drawing words, as canvas 1d does. The mark carries its own `--edsb-target-size` inline minimum, because one glyph is narrower than any label
- [x] T067 [P] Rename the action to `Help` and add `help.action.symbol` to `src/app/i18n/locales/en.json` and `de.json`, recording the `?` in `REVIEWED_IDENTICAL_VALUES` in `scripts/check-interface-foundations.mjs` with the reason it is the same in both languages
- [x] T068 [P] Rename the second identity fact to `Library version` — the reference's own term — in both shipped catalogues, leaving the message key, the fact id and the manifest source unchanged (depends on nothing; the label is the whole change)
- [x] T069 [P] Amend [contracts/help-navigation.md](./contracts/help-navigation.md), [design/reference-review.md](./design/reference-review.md), [design/help-and-licences.md](./design/help-and-licences.md), [design/screen-inventory.md](./design/screen-inventory.md), [design/quickstart-walk.md](./design/quickstart-walk.md), [plan.md](./plan.md) and [spec.md](./spec.md) so no accepted artifact still requires the withdrawn wording, and record both decisions as a dated clarification rather than as a silent edit
- [x] T070 Unit-test the mark in `src/app/ui/components/action/action.spec.ts` and `src/app/app.spec.ts`: the mark is drawn and hidden, the accessible name is the action's name and not the glyph, no other shell action carries a mark, and a button with no mark is unchanged. `accessibleName` in `src/app/ui/components/ui-component.spec-helpers.ts` now omits `aria-hidden` subtrees, because a name computed from one asserts something no reader is told (depends on T066)
- [x] T071 Fix the compact action layer defect the shorter label exposed, in feature 011's own `action-layer.scss` and `app-frame.scss`: bound `min-inline-size` by the same viewport expression `max-inline-size` uses, because a minimum wins over a maximum and `12.25rem` is 392 pixels on a 390-pixel screen at 200% text; and hold the wrapped action-layer trigger to the trailing edge of its row, because the panel hangs off that edge and a leading-edge trigger drags it off-screen. `e2e/help-and-licences.spec.ts`'s 200%-text sweep was passing only because `HELP & FAQ` was wide enough to poke about 53 pixels back into the viewport (depends on T067)
- [x] T072 Re-run the gate. **Run 2026-08-26:** `format:check`, `help:artifacts:check`, `typecheck`, `build` at 403.89 kB raw / 101.94 kB transfer, `build:preview`, seven policy checkers, `codec:capacity`, 252 generator tests, 160 unit files / 2176 tests at 85.83 / 84.37 / 89.44 / 86.05, and all five Chromium projects at 2790 of 2790. `e2e:offline` 70 of 70 in Chromium. `e2e:timing`: SC-005 passes; feature 002's keystroke budget fails here and fails identically with these changes stashed, so it is the container. Firefox remains unrunnable — the engine is absent and `playwright install firefox` still fails on the download. Recorded in [design/quickstart-walk.md](./design/quickstart-walk.md#re-run-of-2026-08-26-for-the-phase-7-wording-change) (depends on T066, T067, T068, T070, T071)

---

## Phase 8: The links a summary of real terms owes, 2026-08-26

**Purpose**: The `LICENCE` summary points at the two complete documents this repository can
evidence, from inside its own sentences. Recorded in
[design/reference-review.md](./design/reference-review.md#one-departure-accepted-on-2026-08-26-the-licence-links).

**Independent Test**: Open the modal and confirm the summary draws four lines; that the first two
carry a link to the repository `LICENSE` and to the bundled library's, both matching the audited
destinations in the generated manifest; that each link names GitHub in its visible words, carries
`rel="noopener noreferrer"` and draws no address as text; and that opening the modal still makes no
request of any origin.

- [x] T073 Emit a second audited destination from `scripts/generate-help-manifest.mjs`: `almanacLicense`, validated against its own expected path by the same parsed URL rules as `repositoryLicense` — HTTPS, no credentials, no port, no query, no fragment, `github.com`, exact pathname — with each id's expected path looked up rather than passed in, so a caller cannot audit a URL against itself. Extend `ExternalDestination` and `assertHelpManifest` in `src/app/domain/distribution/help-manifest.ts` to a closed pair, so a third destination is a type error
- [x] T074 [P] Implement the shared `InlineLink` presentation component in `src/app/ui/components/inline-link/`: a link inside a sentence rather than a control beside one — no target box, no padding, underlined, wrapping with its line — carrying `target="_blank"`, `rel="noopener noreferrer external"` and a reader-only detail that extends its accessible name. Register it in feature 011's preview catalogue. Its template is held on one line by `prettier-ignore`, because the whitespace around an inline element is content: a formatter's indentation becomes a real space and draws `GitHub , and`
- [x] T075 Cut each licence summary line around the link its own translation placed, in `src/app/application/help/help.presenter.ts`. The line resolves with a control-character marker standing in for the link and is split there, so where the link sits is the translator's decision rather than the template's; a line whose translation dropped the placeholder keeps its whole sentence and publishes the link after it rather than losing it (depends on T073)
- [x] T076 [P] Add the localised line and link messages to `src/app/i18n/locales/en.json` and `de.json` — `help.licence.index.library`, and a label and reader-only detail for each of the two links — and register the one line that is word-for-word English in `REVIEWED_IDENTICAL_VALUES`. Each label names GitHub in visible text; neither draws a URL (depends on T075)
- [x] T077 Render the four lines in `src/app/features/help/help-dialog.component.html`, each as `before`, the link, then `after`, held on one line by `prettier-ignore` for the reason T074 gives (depends on T074, T075)
- [x] T078 Teach `expectTargetSizes` in `e2e/accessibility/assertions.ts` SC 2.5.8's **Inline** exception: an element in a sentence is exempt from the 44-pixel baseline, and the exemption is proved rather than named — granted only where the element is measurably `display: inline` and measurably beside non-target text in the nearest non-inline ancestor, which is the block the sentence is in rather than the component host between them (depends on T077)
- [x] T078a Let a preview state declare the prose its stage puts around it, in `src/app/ui/previews/preview-manifest.ts` and `projects/ui-preview/src/app/preview-app.html`, and stage `InlineLink` inside a sentence. A stage that renders an inline component alone previews a shape the product never draws, and the catalogue's own target sweep then measures a link that is not in a sentence against the baseline SC 2.5.8 exempts sentences from (depends on T074, T078)
- [x] T079 Assert the whole shape. Unit: the manifest rejects one destination, three destinations, a swapped id, a non-terms purpose and an empty URL; the presenter takes both hrefs off the manifest, cuts each line at its placeholder, publishes no bare URL and gives the two links distinct reader detail; the component draws exactly two anchors, both `noopener noreferrer` and `_blank`, both naming GitHub, and draws a linked line's tail after its link rather than before it. Generator: both audited URLs are emitted, each id refuses the other's document, and the Almanac path refuses the same malformed shapes. End-to-end: two links matching a fresh read of the generator's own constants, no request or popup on open, no address in the rendered text, nothing about the session in it, and distinct accessible names (depends on T077, T078)
- [x] T080 [P] Amend [spec.md](./spec.md) (scope, two clarifications, Story 1, FR-003, FR-005, SC-001, the edge case and Almanac Coverage), [contracts/help-navigation.md](./contracts/help-navigation.md), [design/reference-review.md](./design/reference-review.md) and [design/help-and-licences.md](./design/help-and-licences.md) so the withdrawal of 2026-08-25 and its reversal are both on the record with the reasoning that separates a control from a linked word
- [x] T081 Re-run the gate. **Run 2026-08-26:** format, artifacts check, typecheck, `build` at 406.90 kB raw / 102.56 kB transfer, `build:preview`, eight policy checkers, 287 generator tests, 160 unit files / 2203 tests at 85.83 / 84.29 / 89.42 / 86.09, all five Chromium projects at 2889 of 2890, and `e2e:offline` 80 of 80 in Chromium. The one Chromium failure is feature 006's doubled-text reflow assertion, which passes 3 of 3 on its own and which nothing here touches; `e2e:timing` fails on feature 002's keystroke budget exactly as it did before this change. Firefox is still unrunnable here. Recorded in [design/quickstart-walk.md](./design/quickstart-walk.md#re-run-of-2026-08-26-for-the-licence-links) (depends on T073, T074, T075, T076, T077, T078, T078a, T079, T080)

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
   byte-identical to root `LICENSE`, the three summary lines sit above it, the modal offers no
   external navigation, and it all works on the first offline visit after one completed online load
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
