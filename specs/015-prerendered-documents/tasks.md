---
description: 'Task list for feature 015 — prerendered documents'
---

# Tasks: Prerendered Documents

**Input**: Design documents from `/specs/015-prerendered-documents/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [design/](./design/),
[quickstart.md](./quickstart.md)

**Tests**: Test tasks are included and are **not** optional here. Constitution VIII
makes verification a condition on shipping, and FR-019, FR-020 and FR-021 are
requirements _about_ gates — a task list without them would leave three
requirements unimplemented.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel — different files, no dependency on an incomplete task
- **[Story]**: US1, US2, US3 from [spec.md](./spec.md); Setup, Foundational and Polish carry none

## Path Conventions

Single project at the repository root: `src/` for the application, `scripts/` for
build and gate scripts, `e2e/` for Playwright, configuration at the root. Paths
below are exactly as [plan.md](./plan.md) "Source Code" lays them out.

## Read before starting

Three facts decide most of the ordering below, and each has cost someone a wrong
answer already:

1. **`index.html` is the root's document.** GitHub Pages resolves `/` to it and to
   no other file. The content-free shell moves to `index.csr.html` and takes the
   service worker fallback, the prefetch list and `404.html` with it
   ([contracts/address-set.md](./contracts/address-set.md) §2–§3).
2. **`publish-static-routes.mjs` will destroy the feature's output** if it runs
   unchanged: it copies the shell over all 52 addresses (address-set.md §5). Until
   T018 lands, every body assertion is testing a shell.
3. **`ng build` prerenders**, so the PR preview job publishes 50 documents too, and
   its `noindex` rewrite and `404.html` copy are both wrong for that
   ([quickstart.md](./quickstart.md), "What CI runs").

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Get the toolchain able to prerender at all. Nothing else compiles first.

- [x] T001 Add `@angular/ssr` and `@angular/platform-server` as dev dependencies at the Angular pin in `package.json`, moving the Angular pin itself if peers demand it, and refresh `pnpm-lock.yaml` (research decision 12)
- [x] T002 Create the build-time render entry `src/main.server.ts`, exporting a default that takes `BootstrapContext` and passes it to `bootstrapApplication` — omitting it raises NG0401 and kills the build (research decision 3)
- [x] T003 Create `src/app/app.config.server.ts` merging `appConfig` with `provideServerRendering()`, per research decision 2

**Checkpoint**: `pnpm install` succeeds and the two entries typecheck. Nothing renders yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The two files that make a prerender pass fail, and the one place that
states what a prerender pass is. Every user story depends on all of it.

**⚠️ CRITICAL**: A prerender configured before T004–T006 is a build that fails on
every one of the 50 routes.

- [x] T004 Create `src/app/platform/browser/rendering-target.ts` as the single injectable statement of "is this a browser", wrapping `isPlatformBrowser(inject(PLATFORM_ID))` — **not** a `DOCUMENT.defaultView` check, which the spike proved wrong because the emulation supplies `defaultView` but no `crypto` (research decision 5, constitution III)
- [x] T005 Guard the retention sweep in `src/app/app.config.ts` behind `rendering-target.ts`, so `provideAppInitializer` → `RetentionService` → `TabOwnershipCoordinator` → `UuidAdapter.create()` is not reached at build time. `UuidAdapter` keeps throwing rather than fabricating an identity; the call is removed, not the honesty (research decision 5, constitution IV)
- [x] T006 Give `observeBanner` in `src/app/ui/components/app-frame/sticky-banner.ts` a `DOCUMENT`-injected view and defer its first `measure()` to `afterNextRender`, following `element-size.adapter.ts:28` and `bench-composition.ts:91-94`. The document must carry neither `frame--released` nor `--ednb-layout-bar-height` (`app-frame.ts:185-186`), and the pass must log no `getBoundingClientRect` error (research decision 6)
- [x] T006a Guard `restoreWhenSettled` in `src/app/features/ship-catalogue/catalogue-anchor.restorer.ts` behind `rendering-target.ts`. **Found during implementation, not by the spike**: the build tears the catalogue down at the end of every hull route, and the emulation supplies a `defaultView` with no `requestAnimationFrame`, so the existing guard passes and the next line throws. A third instance of the wrong question research decision 5 names
- [x] T006b Add `provideClientHydration(withEventReplay())` to `src/app/app.config.ts`. **Found during implementation, not by the spike, and the largest defect this feature had**: without it Angular treats a generated document as debris — it empties `<app-root>` and renders from nothing. Measured on `/ships/Anaconda`: the hull's figures painted at 39ms, gone at 181ms, back at 1236ms. A second of blank page in the middle of what a Commander was already reading, which is exactly the content that "disappears and returns" FR-009 forbids and SC-003 measures. `withEventReplay()` is the other half: a generated document paints every control before any script has run, so a press in that window would otherwise land on markup with no listener behind it (FR-009, FR-010, SC-003)
- [x] T006c Add `waitForTakeover` to `e2e/shell.ts` and wait on it in `reachShellAction`, `reachShellLink`, `openActionLayer`, `reachHull` and `buildStockHull`. **Found during implementation**: T006b's replay holds a press made in the first frame until the takeover reaches that node, and the takeover of `/ships` completes about two seconds after `load` — so a journey that pressed at 600ms opened the layer at 2.6s, and under eight parallel workers past its own five-second assertion. `help-offline` failed one run in three on the feature branch and three runs in three on `e3b8a36`, the tree before it. A journey about the _running_ application now says so and waits; what the first frame itself offers is T026's question, not one every other journey answers by accident
- [x] T007 [P] Add unit tests for `rendering-target.ts` in `src/app/platform/browser/rendering-target.spec.ts`, covering both platforms
- [x] T008 [P] Extend the `sticky-banner` unit tests to assert that no measurement is taken before the first render, so T006's deferral cannot be undone silently
- [x] T009 Add the `contentBearing` registry to `scripts/search/published-addresses.mjs` beside the list it qualifies: one record per advertised address, `reason` required when `false`, 50 true and 2 false ([data-model.md](./data-model.md) `ContentBearing`, FR-021)
- [x] T010 [P] Add script tests for the registry in `scripts/search/published-addresses.test.mjs`: every advertised address appears exactly once, `reason` is present wherever `contentBearing` is `false`, and the counts are 52 / 50 / 2
- [x] T011 Create `scripts/generate-prerender-routes.mjs`, deriving the routes file from `publishedAddresses(...)` filtered by `contentBearing` — one leading-slash line each, 50 lines, written to the build directory and never committed (address-set.md §4, FR-006)
- [x] T012 [P] Add script tests for the generator in `scripts/generate-prerender-routes.test.mjs`: exactly 50 lines, every line a content-bearing address, no bench, and no hand-listed hull
- [x] T013 Configure the build in `angular.json`: `server`, `ssr.entry`, `prerender.routesFile` and `discoverRoutes: false`, **without** `outputMode` — setting `outputMode` makes the builder ignore `prerender` entirely and warn about it (`@angular/build/src/builders/application/options.js:116-126`, research decision 2)
- [x] T014 Wire `generate-prerender-routes.mjs` into `pnpm run build` in `package.json`, ahead of `ng build`, so the routes file exists when the builder reads it
- [x] T015 Add the post-build placement step that moves each prerendered `<route>/index.html` to `<address>.html` and leaves no `ships/index.html` behind, keeping the root at `index.html` (address-set.md §2, research decision 4)
- [x] T016 [P] Add script tests for the placement step: `ships.html` and `ships/Anaconda.html` exist, `ships/index.html` does not, `index.html` does, and no address resolves to a directory

**Checkpoint**: `pnpm run build` produces 50 documents with bodies plus
`index.csr.html`. They are about to be overwritten — that is T018.

---

## Phase 3: User Story 1 — A reader that runs no script can read a hull (P1) 🎯 MVP

**Goal**: Every content-bearing address answers with a body that states its
subject, matching the pinned package exactly.

**Independent Test**: Fetch each of the 50 addresses with script execution
disabled and confirm the body states the address's subject; for a hull, confirm
every FR-002 figure is present and matches the package. Delivers the whole
search-visibility gain with neither other story built.

### The pipeline that makes the documents survive

- [x] T017 [US1] Change `scripts/publish-static-routes.mjs` so `404.html` is a byte copy of `index.csr.html` rather than of `index.html`, written before any substitution — after this feature `index.html` carries the start page, and an unchanged copy would answer every unmatched address with it (address-set.md §3, §5)
- [x] T018 [US1] Change `publish-static-routes.mjs`'s template from one file to per-address: substitute each address's head over **that address's generated document**, and over `index.csr.html` for the two head-only addresses. A content-bearing address whose document is missing MUST fail the build rather than fall back to the shell (address-set.md §5, FR-005, FR-021)
- [x] T019 [US1] Extend `scripts/publish-static-routes.test.mjs`: the 50 keep their bodies after publishing, the 2 get the shell, `404.html` matches `index.csr.html`, and a missing generated document is a failure rather than a silent shell

### The gates FR-020 and FR-021 are

- [x] T020 [US1] Create `scripts/check-prerendered-documents.mjs` asserting the five things [contracts/prerendered-document.md](./contracts/prerendered-document.md) lists: every content-bearing address has a document; each hull's document carries that hull's figures as the package reports them; no document carries a prohibited item; every head still matches `documentHead`; and every document's first `<h1>` names its subject with no body left as an empty `<app-root>` (FR-020)
- [x] T021 [US1] Register `check-prerendered-documents.mjs` in `pnpm run test:scripts` in `package.json`, so CI runs it (`ci.yml:122-123`)
- [x] T022 [P] [US1] Add `scripts/check-prerendered-documents.test.mjs` proving each assertion **fails** on a document doctored to break it — a gate that has never been seen to fail is a gate nobody has tested
- [x] T023 [US1] Extend `scripts/check-interface-foundations.mjs` to reconcile the content-bearing registry against the advertised address set and the generated output, failing the build by name for any address that is neither generated nor recorded content-free (FR-021)
- [x] T024 [P] [US1] Extend `scripts/check-interface-foundations.test.mjs` with the unreconciled-address case, asserting the failure names the address

### The journey

- [x] T025 [US1] Extend `e2e/search-published.spec.ts` so every `<loc>` that is content-bearing also asserts its body states its subject, keeping `page.request.get(..., { maxRedirects: 0 })` so the assertion is about the files on disk rather than about the service worker (FR-001, FR-003, SC-001)

**Checkpoint**: A crawler running no script can read all 48 hulls. SC-001 and
SC-002 are met. Story 1 is shippable alone.

---

## Phase 4: User Story 2 — A Commander's first frame is better, never worse (P1)

**Goal**: The takeover is invisible. No content moves, blanks, or re-composes, on
any of the five layout profiles.

**Independent Test**: Open each content-bearing address on each layout profile,
record from first paint to interactive, and confirm nothing moves, changes or
blanks across the takeover. Testable without story 3.

**Note on ordering**: this story shares P1 with story 1 because it is the
condition on shipping it, not because it can be deferred. Story 1 without story 2
trades a visible regression for an invisible gain.

- [ ] T026 [US2] Create `e2e/prerendered-first-frame.spec.ts`: for each of the three screens, assert the first painted frame carries the address's subject, that cumulative layout shift across the takeover is 0, and that no frame between first paint and interactive is emptier than the one before (FR-008, FR-009, FR-010, SC-003, SC-004)
- [ ] T027 [US2] **Add `prerendered-first-frame.spec.ts` to the `e2e:offline` script's explicit spec list in `package.json:27`.** That script names its files rather than globbing, so without this edit CI runs the new job and never runs the new test
- [ ] T028 [P] [US2] Add the FR-009a case to `prerendered-first-frame.spec.ts`: with a stored catalogue view the reorder lands **in the takeover frame** and not a frame later; with no stored view the list does not change at all. `CatalogueAnchorRestorer` must not fire on a cold load ([design/first-frame.md](./design/first-frame.md))
- [ ] T029 [P] [US2] Add the FR-011 case: the committed locale replaces the document's text without adding, removing or reordering anything on the page, and reflow is permitted because a translation is not the same length as its source
- [ ] T030 [P] [US2] Add the FR-012 case: with the bundle blocked, the Commander is left with the readable document rather than an empty page
- [ ] T031 [US2] Add the axe scan over the generated first frame, with script execution disabled, across all ten Playwright projects — WCAG 2.2 AA less criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11, the same eight the rest of the suite excludes (FR-019, SC-005)
- [ ] T032 [P] [US2] Guard `e2e/offline-privacy.spec.ts:61` against the double-count hazard its exact-48 `[data-hull-symbol]` assertion now carries — a prerendered catalogue and a hydrated one across the takeover (design/first-frame.md, "Watch")

**Checkpoint**: SC-003, SC-004 and SC-005 are met on all ten projects. Stories 1
and 2 are both shippable.

---

## Phase 5: User Story 3 — Nothing a Commander already relies on is lost (P2)

**Goal**: Offline, unknown addresses, and the fragment-addressed build all behave
exactly as they do today.

**Independent Test**: Run the existing offline journeys unchanged; request an
address with no generated document; inspect every generated document for
Commander data.

**FR-014 is one change.** T033 through T036 land together — `freshness` without
the fallback move, or the fallback move without `freshness`, each leaves a wrong
first frame.

- [x] T033 [US3] Set `"navigationRequestStrategy": "freshness"` in `ngsw-config.json`, so an online navigation reaches the network and gets the real document while an offline one still falls back to the cached shell (research decision 8, FR-013, FR-014)
- [x] T034 [US3] Point the worker's `index` at `/index.csr.html` and replace `/index.html` with `/index.csr.html` in the `app-shell` asset group's file list in `ngsw-config.json` (address-set.md §3)
- [x] T035 [US3] Update `scripts/check-service-worker-ownership.test.mjs`'s pinned `app-shell` file list (`:105-110`) for T034 — a deliberate edit to a test that exists to catch undeliberate ones
- [x] T036 [US3] Add two new assertions to `check-service-worker-ownership.test.mjs`: `config.index` is `/index.csr.html`, and `config.navigationRequestStrategy` is `freshness`. **Nothing asserts the second today**, so without it a later edit could restore the cache-first default and every returning Commander would silently go back to today's empty first frame with no test failing (FR-014)
- [ ] T037 [P] [US3] Extend `e2e/offline-privacy.spec.ts` with the repeat-visit case: online, a second visit to `/ships/Anaconda` gets the hull document and never paints the start page's content
- [ ] T038 [P] [US3] Extend `e2e/offline.spec.ts` with the unmatched-address case: `/ships/NotAShip` offline gets the shell and the application's own handling, never the start page (FR-015, FR-016)
- [ ] T039 [P] [US3] Add the FR-007 assertions to `check-prerendered-documents.mjs`'s prohibition check: no build, no saved record, no Commander data, no runtime environment configuration, and no application version — the version is stamped in CI immediately before `ng build`, so a body carrying it would bake a CI-only value into static HTML (research decision 14, SC-008)
- [ ] T040 [P] [US3] Assert FR-017 explicitly in the end-to-end suite: a shared build's payload is in the fragment, and no part of it is in the path or query

**Checkpoint**: SC-006, SC-007 and SC-008 are met. All three stories work.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T041 Fix the PR preview job's `noindex` step in `.github/workflows/ci.yml:533-540`: rewrite the robots tag across **every** generated document rather than `index.html` alone, and make the verification count them. 49 documents keeping `content="index,follow"` would publish full near-duplicates of production on another host — the exact duplicate that step exists to prevent
- [x] T042 Fix the preview job's `404.html` copy in `.github/workflows/ci.yml:542-544` to copy `index.csr.html` rather than `index.html`, for the same reason as T017
- [ ] T043 [P] Register feature 015's rows in `e2e/coverage-ledger.ts` and add `'015-prerendered-documents'` to `COVERED_FEATURES`, which immediately requires every requirement id the spec declares — FR-001 through FR-021, FR-009a included (constitution VIII)
- [ ] T044 [P] Update `README.md`'s deployment section for the new output shape: 50 documents, `index.csr.html` as the shell, and `404.html` copied from it
- [ ] T045 [P] Record the measured document sizes and the CI cost of the `e2e-production` job in `research.md`, replacing the spike figures with the shipped ones
- [ ] T046 Run `pnpm run check` — format, help artifacts, sitemap check, typecheck, build, preview build, policy, codec capacity, script tests, unit tests at the 80% floor, Playwright, timing and offline — and confirm it is green before proposing the change
- [ ] T047 Walk [quickstart.md](./quickstart.md) end to end, including the manual service-worker protocol in section 7, and correct anything the implementation moved

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (T001–T003)**: no dependencies. T002 and T003 both need T001.
- **Foundational (T004–T016)**: needs Setup. **Blocks every story.** Within it,
  T005 needs T004; T006c needs T006b; T013 needs T011; T014 needs T011 and T013;
  T015 needs T013.
- **US1 (T017–T025)**: needs Foundational. T018 needs T017 (ordering inside the
  script is load-bearing). T020 needs T018 — a gate run before the pipeline is
  fixed reports 50 failures that are all one defect. T021 needs T020. T023 needs
  T009.
- **US2 (T026–T032)**: needs Foundational, and needs T018 in practice — a takeover
  test against a shell is testing today's behaviour.
- **US3 (T033–T040)**: needs Foundational. T034 needs T033 conceptually and lands
  with it; T035 and T036 need T034.
- **Polish (T041–T047)**: needs every story. T046 needs everything.

### Story dependencies

- **US1 (P1)** — independent once Foundational is done. The MVP.
- **US2 (P1)** — independent of US1's gates, but shares T018's pipeline fix. Ship
  with US1, not after it: it is the condition on US1 rather than a follow-on.
- **US3 (P2)** — independent of both. Its work is the service worker and the
  standing guarantees, which neither other story touches.

### Parallel opportunities

- **Phase 2**: T007, T008, T010, T012 and T016 are all `[P]` — four test files and
  a unit spec, no shared file among them. T009 and T011 are sequential only
  because T011 reads T009's export.
- **Phase 3**: T022 and T024 run in parallel with each other; both are test files
  for scripts written earlier in the phase.
- **Phase 4**: T028, T029, T030 and T032 are `[P]` — three add cases to a file
  T026 created, so they parallelise against each other only after T026 lands, and
  T032 is a different file entirely.
- **Phase 5**: T037, T038, T039 and T040 are `[P]`, all different files.
- **Phase 6**: T043, T044 and T045 are `[P]`. T041 and T042 touch the same
  workflow file and are not.
- **Across stories**: once Phase 2 is done, US3 can be worked entirely in parallel
  with US1 and US2 by someone else — it shares no file with either.

### Parallel example: Phase 2's tests

```bash
Task: "Unit tests for rendering-target.ts in src/app/platform/browser/rendering-target.spec.ts"
Task: "Deferral assertions in the sticky-banner unit tests"
Task: "Registry tests in scripts/search/published-addresses.test.mjs"
Task: "Generator tests in scripts/generate-prerender-routes.test.mjs"
Task: "Placement tests for the post-build move"
```

---

## Implementation Strategy

### MVP: Setup + Foundational + US1 (T001–T025)

Twenty-five tasks. At the end, all 48 hulls, the catalogue and the root answer a
scriptless reader with their content, gated against the package. That is the whole
reason the feature exists.

**Do not deploy the MVP alone.** US2 is priority P1 alongside US1 precisely
because a document that reaches a crawler while costing a Commander a visible
flash trades a regression they can see for a gain they cannot. The MVP is a
checkpoint to validate at, not a release.

### Incremental delivery

1. Setup + Foundational → the build prerenders; nothing is published yet
2. **+ US1** → validate SC-001, SC-002, SC-009 → checkpoint
3. **+ US2** → validate SC-003, SC-004, SC-005 → **releasable**
4. **+ US3** → validate SC-006, SC-007, SC-008 → complete
5. Polish → the preview job, the ledger, the full gate

### Parallel team strategy

Setup and Foundational are one person's work — thirteen tasks, most of them
sequential on each other. After that: one person on US1 + US2 (they share T018),
one on US3, and they do not meet until Polish.

---

## Notes

- 47 tasks. Every one names a file. Every user-story task carries its label.
- `[P]` means a different file and no incomplete dependency, nothing more.
- Commit at each checkpoint at least. `pnpm run check` before proposing (T046).
- The three facts in "Read before starting" are the ones most likely to be
  rediscovered the hard way. T017, T018, T027, T036, T041 and T042 exist only
  because of them.
