---
description: 'Task list for Cost and Materials'
---

# Tasks: Cost and Materials

**Input**: Design documents from `/specs/009-cost-and-materials/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [design/](./design/),
[quickstart.md](./quickstart.md)

**Binding ruling**: [design/reference-review.md](./design/reference-review.md), wave 10. Six
spec-versus-canvas collisions were surfaced before implementation and the design won all six. This
task list is the post-ruling list; it replaces a 68-task list that built roughly twice this surface.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Every task names the exact file it changes

## Path Conventions

Single Angular workspace at the repository root: the pure projection in
`src/app/domain/cost-materials/`, the surface in
`src/app/features/build-workspace/outfitting/cost-materials/`, shared primitives and previews in
`src/app/ui/`, messages in `src/app/i18n/`, end-to-end suites in `e2e/`. Unit tests live beside
their source as `*.spec.ts`.

## Delivery gates

- **Feature prerequisites**: feature 001 (active build and `/build` workspace), feature 002
  (`engineeringCost()`, `materialRarity()`, `edsb-material-grade`, `edsb-game-text` row composition)
  and feature 011 (tokens, primitives, localization, formatters, preview manifest, ten Playwright
  projects, axe helpers). All three are **present in the repository**.
- **Feature 003 is not a prerequisite.** Its `AssemblyRequirementsPort` is withdrawn with ruling F.
  Feature 009's blocks mount directly into the outfitting workspace; when feature 003 lands it
  takes ownership of the surrounding rail and must not recompute these figures.
- **Shared classifier reuse**: feature 002's cost boundary is consumed, never duplicated.
- **Design fidelity**: no user-facing text, control, row or state exists that canvases 1c/1d do not
  draw, except the invisible accessibility floor and the constitutional substitutions already
  recorded in the reference review.

---

## Phase 1: Setup

- [x] T001 Characterize the installed Almanac contract this feature reads — `retailCredits()`
      returning non-nullable numeric `hull`, `modules` and `rebuy`; `mercCoinCost()` returning a
      number; `PreEngineeredVariant.acquisition`; `sumMaterials` matching symbols case-insensitively
      and preserving first-seen order; and the leaf subpaths `ships/ship-loadout` and
      `ships/engineering` — in `src/app/domain/cost-materials/almanac-cost-contract.spec.ts`
- [x] T002 [P] Add the cargo-rack regression assertion — the installed Almanac reports no ordinary
      stock route for `CargoRack_IncreasedCapacity`, `getBlueprintCost(..., 5)` returns `null`, and
      the application neither special-cases the fdname nor substitutes another recipe — in
      `src/app/domain/cost-materials/almanac-cost-contract.spec.ts`

---

## Phase 2: Foundational — the projection

**⚠️ Blocks both user stories.**

- [x] T003 Define `CostAndMaterials`, `CreditsView`, `MaterialsView` and `MaterialRow` per
      [data-model.md](./data-model.md), with no `Exact`/`LowerBound`/`Unavailable` discriminants and
      no trace, evidence or qualification field, in `src/app/domain/cost-materials/cost-materials.ts`
- [x] T004 Implement `projectCostAndMaterials(loadout)` as one pure synchronous function returning a
      frozen `CostAndMaterials`, in `src/app/domain/cost-materials/cost-materials.ts` (depends on
      T003)

**Checkpoint**: the projection exists and both stories can be built on it.

---

## Phase 3: User Story 1 — Read costs (P1) 🎯 MVP

**Goal**: The `COST` block as canvases 1c and 1d draw it — Hull, Modules, `TOTAL`, `REBUY 5%` — plus
the conditional Merc Coin row at the foot of the materials block.

**Independent Test**: Open a build and compare each rendered figure to a captured
`retailCredits()` result; confirm `TOTAL` equals `hull + modules`; open builds with no, one and
several Mercenary articles and confirm the row is absent, present and carries one `mercCoinCost()`
result, and that `mercCoinCost()` is never called when nothing is recognized.

### Tests for User Story 1

- [x] T005 [P] [US1] Add credits projection tests — literal `hull`, `modules` and `rebuy`, `total`
      equal to the package `hull` plus the package `modules` and never a hand-computed literal,
      exactly one `retailCredits()` call, `unpriced` never read, and `sourcePurchase` and fitted
      captured `value` never read — in `src/app/domain/cost-materials/cost-materials.credits.spec.ts`
- [x] T006 [P] [US1] Add Merc Coin projection tests — `null` and no `mercCoinCost()` call when no
      fitted variant reports acquisition `mercenary`, recognition never taken from a symbol,
      blueprint or nonzero total, exactly one `mercCoinCost()` call when one or more are recognized,
      the literal package number preserved, and a package total of zero with no recognition still
      yielding `null` — in `src/app/domain/cost-materials/cost-materials.mercenary.spec.ts`
- [x] T007 [P] [US1] Add `COST` block surface tests — the four canvas rows in canvas order with
      their labels, `TOTAL` carrying the accent treatment and a text label rather than colour alone,
      `REBUY 5%` as fixed label text, locale-formatted numbers, and the absence of any evidence
      list, qualification or slot action — in
      `src/app/features/build-workspace/outfitting/cost-materials/cost-materials.spec.ts`

### Implementation for User Story 1

- [x] T008 [US1] Implement `projectCredits(loadout)` calling `retailCredits()` exactly once,
      preserving `hull`, `modules` and `rebuy`, computing `total` as `hull + modules`, and reading
      neither `unpriced` nor any captured purchase value, in
      `src/app/domain/cost-materials/cost-materials.ts` (depends on T004)
- [x] T009 [US1] Implement `projectMercCoin(fittedModules, loadout)` returning `null` without
      calling the package when no fitted `preEngineeredVariant.acquisition` is `mercenary`, and the
      literal single `mercCoinCost()` result otherwise, in
      `src/app/domain/cost-materials/cost-materials.ts` (depends on T004)
- [x] T010 [US1] Implement `CostMaterials` with the `COST` block — a labelled region and a
      description list of the four canvas rows — composing shared section, description-list and
      micro-label primitives with no screen-local colours, sizes, spacing, radii, elevation or
      motion, in `src/app/features/build-workspace/outfitting/cost-materials/cost-materials.ts` and
      its template and styles (depends on T008)
- [x] T011 [US1] Mount the component in the outfitting workspace status-rail position for canvas 1c
      and the Status stack position for canvas 1d, drawn only while a build is active, in
      `src/app/features/build-workspace/outfitting/outfitting-workspace/outfitting-workspace.html`
      and its styles (depends on T010)
- [x] T012 [P] [US1] Add the US1 message keys — the `COST` heading, the Hull, Modules, `TOTAL` and
      `REBUY 5%` labels and the Merc Coin row label — to `src/app/i18n/locales/en.json` and
      `src/app/i18n/locales/de.json`
- [x] T013 [P] [US1] ~~Add `CostMaterials` preview declarations…~~ **Not applicable.** The preview
      manifest and its policy rule scope to `src/app/ui/components`; `CostMaterials` is a feature
      component, and neither `EngineeringEditor` nor `ModuleReplacement` is declared there either.
      Registering only this one would invent a precedent the repository does not have. Its states
      are covered by `cost-materials.spec.ts` and the ten-project e2e matrix instead.

**Checkpoint**: the `COST` block renders the canvas's four rows from package results.

---

## Phase 4: User Story 2 — Read engineering materials (P1)

**Goal**: The `MATERIALS` block as canvases 1c and 1d draw it — heading with blueprint count, every
consolidated row, the type/unit footer, and the conditional Merc Coin row last.

**Independent Test**: Build fixtures with repeated blueprints at several grades, overlapping
materials, a separately applied effect, a baked effect, a Mercenary purchase baseline, the same
route at a later grade, a fixed reward and an uncostable recipe; confirm the rows deep-equal the
literal `sumMaterials(...)` output in first-seen order, that the three counts match that result,
that purchase and fixed baselines produce no rows, that an uncostable recipe contributes nothing and
is not named, and that a build with no engineering draws no materials block at all.

### Tests for User Story 2

- [x] T014 [P] [US2] Add consolidation tests — one `sumMaterials(...)` call preserving literal
      first-seen order, symbols and counts with no local reducer, sorting, deduplication or
      addition; `engineeringCost()` called once per fitted module and no second classifier present;
      a purchase baseline and a fixed reward contributing no rows; an `unavailable` combined cost
      contributing nothing and not counted; a `known` empty list contributing nothing and not
      counted — in `src/app/domain/cost-materials/cost-materials.materials.spec.ts`
- [x] T015 [P] [US2] Add ruled-count tests — `blueprints` equal to the number of fitted modules that
      contributed a list, `types` equal to the consolidated row count, `units` equal to the sum of
      the package counts, the Merc Coin figure excluded from both counts, and a `null` materials
      view when nothing contributes — in
      `src/app/domain/cost-materials/cost-materials.materials.spec.ts`
- [x] T016 [P] [US2] Add `MATERIALS` block surface tests — the blueprint count opposite the heading,
      every consolidated row in package order with rarity marker, name and quantity and no
      truncation or top-N cut, the type/unit footer, the Merc Coin row rendering last and only when
      recognized, the whole block absent when nothing contributes, and the absence of any trace
      control, disclosure, missing-recipe wording or metadata-gap wording — in
      `src/app/features/build-workspace/outfitting/cost-materials/cost-materials.spec.ts`

### Implementation for User Story 2

- [x] T017 [US2] Implement `projectMaterials(fittedModules)` building each module's committed
      `EngineeringSelection`, calling feature 002's `engineeringCost()` once per module, folding
      every contributing list through one `sumMaterials(...)` call, resolving each row's rarity
      through `materialRarity()`, and counting `blueprints`, `types` and `units`, in
      `src/app/domain/cost-materials/cost-materials.ts` (depends on T004)
- [x] T018 [US2] Add the `MATERIALS` block to `CostMaterials` — heading with blueprint count, the
      complete row list reusing the row composition of `edsb-material-cost-list`, the type/unit
      footer, and the Merc Coin row last — in
      `src/app/features/build-workspace/outfitting/cost-materials/cost-materials.ts` and its
      template and styles (depends on T010, T017)
- [x] T019 [P] [US2] Add the US2 message keys — the `MATERIALS` heading, the blueprint-count,
      material-type and unit-total patterns — to `src/app/i18n/locales/en.json` and
      `src/app/i18n/locales/de.json`
- [x] T020 [P] [US2] ~~Extend the `CostMaterials` preview declarations…~~ **Not applicable**, for
      the reason recorded on T013.

**Checkpoint**: both blocks render the canvas's content for the active build.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T021 Implement the responsive composition — the two blocks in the status rail at roomy widths
      and the same two blocks in one semantic column in the Status stack at narrow widths, both
      landscape phone orientations, 200% text and 400% zoom, with no truncated row, label or count
      and no document horizontal scrolling — chosen from available inline size rather than
      device-name branching, in
      `src/app/features/build-workspace/outfitting/cost-materials/cost-materials.scss` (depends on
      T018)
- [x] T022 Add the feature suite `e2e/cost-and-materials.spec.ts` covering the cost and materials
      journeys against captured package results, and register its surfaces in
      `e2e/coverage-ledger.ts`
- [x] T023 [P] Run the capability in Chromium and Firefox at all five viewports with an axe scan
      over the no-build, active-build, no-engineering, Mercenary-absent and Mercenary-present
      states, in `e2e/cost-and-materials.spec.ts` (depends on T022)
- [x] T024 [P] Assert 200% text, actual 400% browser zoom, expanded translations, long canonical
      material names and RTL layout with no lost content, no lost label-to-value association and no
      document horizontal scrolling, in `e2e/cost-and-materials.spec.ts` (depends on T022)
- [x] T025 [P] Assert that no figure, label or state in either block depends on colour, icon, title
      or position alone — `TOTAL` and the Merc Coin row are named as well as accented — and that
      nothing essential depends on hover, in `e2e/cost-and-materials.spec.ts` (depends on T022)
- [x] T026 [P] Add the locale sweep asserting every owned heading and label comes from application
      messages, every number uses an active-locale named formatter, no raw message key or blank
      label appears, material names come from package helpers by exact symbol with the shared
      untranslated disclosure, and the bundled English fallback works offline — across every shipped
      locale and the pseudo-locales in `src/app/i18n/testing/pseudo-locales.ts`, in
      `e2e/cost-and-materials.spec.ts` (depends on T022)
- [x] T027 [P] Add the offline journey — load the workspace, go offline, read both blocks with no
      cross-origin request — and assert no cost or material value appears in local storage, browser
      history, a URL, a build link or a SLEF export, in `e2e/cost-and-materials.spec.ts` (depends on
      T022)
- [x] T028 Add the design-fidelity check asserting the rendered blocks carry exactly the canvas's
      rows and no others — no trace control, disclosure, evidence list, lower-bound, unavailable or
      missing-recipe text — in `e2e/cost-and-materials.spec.ts` (depends on T022)
- [x] T029 [P] Write (**not** run — see below) the versioned NVDA/Firefox desktop and TalkBack/Chromium mobile
      screen-reader protocols covering both blocks — region headings, the four cost rows with their
      labels, every material's name, rarity and quantity, the three counts and the Merc Coin row —
      with result records in `e2e/manual/screen-reader.protocol.md` and `e2e/manual/results/`.
      The protocol gains step 13 for these two blocks. **No screen-reader run has been performed**:
      the repository's result record has stood at "not yet executed" since feature 011 and this
      feature does not change that. The row ranges are widened to 1–13 so the outstanding work is
      visible rather than silently narrowed.
- [x] T030 Reconcile the coverage ledger with the feature 009 surfaces, exported components, preview
      declarations and Playwright project names, and register SC-001–SC-004 against the named
      assertions that evidence them, in `e2e/coverage-ledger.ts` (depends on T022)
- [x] T031 Restore unit coverage to at least 80% statements, branches, functions and lines for
      `src/app/domain/cost-materials/` and
      `src/app/features/build-workspace/outfitting/cost-materials/` under the thresholds in
      `angular.json`
- [x] T032 [P] Record the Cost and Materials capability, its reuse of feature 002's engineering-cost
      boundary, the four ruled application-owned figures, and the out-of-scope historical purchase
      values, currency conversion, material traces and unpriced evidence in `AGENTS.md` and
      `README.md`
- [x] T033 Execute every section of `specs/009-cost-and-materials/quickstart.md`, including the
      cargo-rack stop condition and the package-pin check, and fix each divergence
- [x] T034 Run the `pnpm run check` pipeline declared in `package.json` and confirm formatting,
      strict compilation, policy checks, build, unit coverage, all ten Playwright projects and all
      axe scans pass with no skipped, focused or quarantined test. The ten matrix projects pass
      (2940) and so do `e2e:offline` (70) and every axe sweep. The eleventh project,
      `chromium-mobile-timing`, is flaky on this machine **at `main`** — five isolated runs of
      `e2e:timing` on a clean `main` worktree gave 111.4, 135.5, pass, 133.0 and 129.6 ms against a
      100 ms budget, no better than this branch. It is feature 002's SC-002 gate and a pre-existing
      environment problem, not a feature 009 regression; nothing here raises the budget.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: starts immediately; all feature prerequisites are present
- **Foundational (Phase 2)**: depends on Phase 1 and blocks both user stories
- **User stories (Phases 3–4)**: both depend on Phase 2; US2's surface work depends on US1's
  component existing (T018 depends on T010)
- **Polish (Phase 5)**: depends on both delivered stories

### Parallel opportunities

T005, T006 and T007 are independent test files. T014, T015 and T016 likewise. The message-key and
preview tasks (T012, T013, T019, T020) touch different files from the component work. The Phase 5
end-to-end assertions (T023–T027) all extend one spec file created by T022 and are marked `[P]`
only because they are independent assertions, not independent files — land T022 first.

### Withdrawn tasks

The pre-ruling list's T004–T008 (discriminant tower), T013–T017 (store, adapter, presenter,
announcement coordinator), T021–T022 and T029 (separate Mercenary region), T031 and T050 (Assembly
Requirements summary emission), T035–T045 (second classifier, source extraction, trace
consolidation, metadata gaps, projection states), T039 and T048 (`MaterialTraceComponent`), T054's
trace and evidence clauses, T058 (announcement coalescing), T061 (contextual editor boundary) and
T062 (revision-coherence measurement) are all withdrawn. Each existed to serve surface that
canvases 1c and 1d do not draw, or a two-consumer coherence problem that no longer exists.
