---
description: 'Task list for Interface Foundations'
---

# Tasks: Interface Foundations

**Input**: Design documents from `/specs/011-interface-foundations/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [design/](./design/),
[quickstart.md](./quickstart.md)

**Tests**: Test tasks are included. The specification makes verification a requirement (FR-021–FR-024)
and constitution principle VIII gates the build on unit coverage, the Playwright matrix and automated
accessibility scans.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested and
demonstrated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Every task names the exact file it changes

## Path Conventions

Single Angular workspace at the repository root: product source in `src/`, tooling-only preview
application in `projects/ui-preview/`, end-to-end suite in `e2e/`, repository policy checks in
`scripts/`. Unit tests live beside their source as `*.spec.ts`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the dependencies, compiler strictness, assets and second Angular application the
foundation needs before any source lands.

- [ ] T001 Add `@jsverse/transloco` ^8.4.0 and `@angular/service-worker` ^22.1.0 to `dependencies` and `@axe-core/playwright` ^4.13.0, `postcss` ^8.5.0 and `postcss-scss` ^4.0.9 to `devDependencies` in `package.json`, then install and commit the updated `pnpm-lock.yaml`
- [ ] T002 Enable `"strict": true` in `compilerOptions` and `"strictTemplates": true` in `angularCompilerOptions` in `tsconfig.json`, and repair every resulting error in `src/`, `e2e/` and `playwright.config.ts`
- [ ] T003 [P] Add the `ui:preview`, `e2e:preview`, `e2e:offline` and `policy` script entries to `package.json` so the new preview, offline and policy targets are runnable
- [ ] T004 [P] Vendor licensed Barlow, Barlow Condensed and JetBrains Mono WOFF2 subsets with their OFL licence files under `public/fonts/`
- [ ] T005 Scaffold the tooling-only preview application in `projects/ui-preview/` (`src/main.ts`, `src/index.html`, `src/app/preview-app.ts`, `tsconfig.app.json`) and register its build and serve targets under `projects` in `angular.json`
- [ ] T006 [P] Copy `src/app/i18n/locales` to the same-origin `/i18n/` output through the build `assets` array in `angular.json` and keep `projects/ui-preview` out of the product build graph

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The single token set, localization core, shared component contract, preview manifest and
verification harness that every user story composes.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Design tokens and global styles

- [ ] T007 [P] Define the primitive token literals in `src/styles/tokens/_primitives.scss`: take the colour primitives from the 55 named custom properties in `.design/Ship Builder.dc.html` (`--amber-*`, `--ink-*`, `--panel-*`, `--bg-*`, `--hot`, `--good`, `--cool`, `--hair`), and author the type scale, spacing, radius, elevation, border, motion and target primitives here as bounded named step scales with the canvas as visual reference only — this repository is the record and the design tool is a preview (principle VII). The canvas `font-size` values of 8px and 9px are artboard-thumbnail artifacts and MUST NOT become a type scale, and its 78 `padding`, 18 `gap` and 15 `letter-spacing` literals MUST NOT be imported as a spacing system
- [ ] T008 Define the one contrast-audited semantic dark set consuming only primitives in `src/styles/tokens/_semantic.scss` (depends on T007)
- [ ] T009 [P] Record AA text and non-text contrast evidence for every intended semantic pair in `specs/011-interface-foundations/design/token-evidence.md`
- [ ] T010 [P] Declare the same-origin `@font-face` rules and complete fallback stacks in `src/styles/_fonts.scss`
- [ ] T011 [P] Set the dark surface, root typography, logical-property defaults and `prefers-reduced-motion` base rules in `src/styles/_base.scss`
- [ ] T012 [P] Define the named layout, container-query and wide/medium/compact composition primitives in `src/styles/_responsive.scss`
- [ ] T013 Compose the token, font, base and responsive partials in `src/styles.scss` (depends on T007–T012)

### Platform adapters

- [ ] T014 [P] Implement the document and navigator adapters with unit tests in `src/app/platform/browser/document.adapter.ts` and `src/app/platform/browser/navigator.adapter.ts`
- [ ] T015 [P] Implement the versioned locale-preference adapter in `src/app/platform/storage/locale-preference.repository.ts` with unit tests covering malformed JSON, unknown version, removed locale, denied storage and failed writes

### Localization core (bundled English)

- [ ] T016 [P] Define the `ShippedLocale`, `LocaleCandidate` and `LocaleSnapshot` types and the `en`/`de` registry entries in `src/app/i18n/locale-registry.ts`
- [ ] T017 Seed the canonical English catalogue with shell, action, status, error, unavailable, disclosure and generic-unknown-key messages in `src/app/i18n/locales/en.json`
- [ ] T018 Implement the signal `LocaleStore` that commits exactly one bundled-English ready snapshot per revision in `src/app/i18n/locale.store.ts` with unit tests (depends on T016, T017)
- [ ] T019 Implement the typed message facade over Transloco in `src/app/i18n/message.service.ts` and register the localization providers in `src/app/app.config.ts` (depends on T016–T018)
- [ ] T020 [P] Implement the cached named `Intl` formatter registry (integer, decimal, fraction-percent, metre/kilometre unit, named date, collator, display name, and credit/light-year message patterns) in `src/app/i18n/formatters/` with unit tests

### Shared component and preview infrastructure

- [ ] T021 [P] Define the shared component contract types (immutable inputs, typed intents, semantics, required state set) in `src/app/ui/component-contract.ts`
- [ ] T022 Define the typed preview declaration, required-state and N/A rationale rules and the manifest registry in `src/app/ui/previews/preview-manifest.ts` (depends on T021)
- [ ] T023 Render every manifest declaration at a stable component/state address in `projects/ui-preview/src/app/`, importing the production tokens, UI exports and localization providers (depends on T005, T013, T019, T022)
- [ ] T024 [P] Create the machine-readable coverage ledger joining surfaces, requirement ids, journeys, axe flags, named assertions and manual protocol ids, seeded with this feature's cross-cutting design-system (FR-001–FR-005) and verification (FR-021–FR-024) entries that no user story owns, in `e2e/coverage-ledger.ts`

### Verification harness

- [ ] T025 Generate the ten named projects (desktop, tablet portrait, tablet landscape, mobile portrait, mobile landscape × Chromium and Firefox) with explicit engine descriptors, `hasTouch` on the four touch profiles and `E2E_CHROMIUM_PATH`/`E2E_FIREFOX_PATH` escape hatches in `playwright.config.ts`
- [ ] T026 [P] Add the shared axe helper that scans WCAG A/AA through 2.2 with no disabled rules and attaches the full JSON result on failure in `e2e/accessibility/axe.ts`
- [ ] T027 [P] Add the landmark, heading, matching-name, state, relationship, text-equivalence, target-size and document-overflow assertion helpers in `e2e/accessibility/assertions.ts`
- [ ] T028 Implement the AST- and PostCSS-backed policy checker for owned literal display text, literal visible/accessibility attributes, governed visual literals outside token sources, uninspectable inline styles, missing preview declarations, skipped or focused interface tests, and every `FR-` id declared in any `specs/*/spec.md` appearing at least once in `e2e/coverage-ledger.ts` with the unregistered ids named on failure, in `scripts/check-interface-foundations.mjs`
- [ ] T029 Add positive and negative fixture tests for every checker rule in `scripts/check-interface-foundations.test.mjs` (depends on T028)
- [ ] T030 Invoke the policy checker, preview and offline targets from the `check` script in `package.json` so a violation fails the build (depends on T003, T028)

**Checkpoint**: Tokens, localization core, component contract, preview host and the ten-project axe-enabled harness exist — user story work can begin.

---

## Phase 3: User Story 1 - Use every capability with assistive technology (Priority: P1) 🎯 MVP

**Goal**: Deliver the shared component library and application frame whose controls expose matching
visible and accessible names, roles, states, errors and relationships, whose statistics carry meaning,
unit, availability and viewing conditions as text, whose visual carriers all have text equivalents, and
whose changes announce once without repeating unaffected content.

**Independent Test**: Run `pnpm run e2e -- interface-foundations.spec.ts announcements.spec.ts ui-preview.spec.ts`
and the unit suite; every rendered product and preview state passes axe plus the named semantic
assertions, and blocking, settled, initial, unchanged and stale events produce exactly the announcement
policy in the feedback contract.

### Tests for User Story 1

- [ ] T031 [P] [US1] Add the product semantics journey (banner, navigation, one `main`, one visible `h1`, ordered headings, matching names, roles, states, label/description/error/unit relationships) in `e2e/interface-foundations.spec.ts`
- [ ] T032 [P] [US1] Add the announcement policy journey (one assertive blocking summary, coalesced polite change, silence for initial, unchanged, stale and unaffected content) in `e2e/announcements.spec.ts`
- [ ] T033 [P] [US1] Add the preview sweep that renders every applicable declaration and runs axe plus the semantic and text-equivalence assertions in `e2e/ui-preview.spec.ts`

### Implementation for User Story 1

- [ ] T034 [P] [US1] Implement the announcement event record and `(kind, revision, urgency)` dedupe policy in `src/app/ui/announcements/announcement.service.ts` with unit tests
- [ ] T035 [US1] Implement the hidden assertive and polite outlet component in `src/app/ui/announcements/announcement-outlet.ts` (depends on T034)
- [ ] T036 [P] [US1] Implement the visually-hidden text and bidi-isolation utilities in `src/app/ui/a11y/text-equivalence.ts`
- [ ] T037 [P] [US1] Implement the action button and link components with visible/accessible name parity and busy, pressed and disabled state in `src/app/ui/components/action/`
- [ ] T038 [P] [US1] Implement the labelled text input and search field with associated label, description and error in `src/app/ui/components/text-field/`
- [ ] T039 [P] [US1] Implement the labelled select with associated label, description and error in `src/app/ui/components/select-field/`
- [ ] T040 [P] [US1] Implement the labelled textarea with associated label, description and error in `src/app/ui/components/textarea-field/`
- [ ] T041 [P] [US1] Implement the radio, checkbox and switch choice group exposing checked and invalid state in `src/app/ui/components/choice-group/`
- [ ] T042 [P] [US1] Implement the segmented and tab controls exposing selected and current state in `src/app/ui/components/tab-group/`
- [ ] T043 [P] [US1] Implement the panel and card containers with named regions in `src/app/ui/components/panel/`
- [ ] T044 [P] [US1] Implement the semantic collection (list) shell that never swallows nested controls in `src/app/ui/components/collection/`
- [ ] T045 [P] [US1] Implement the table shell with caption and associated row/column headers in `src/app/ui/components/table/`
- [ ] T046 [P] [US1] Implement the definition and metric group exposing value, unit, viewing condition and description relationships in `src/app/ui/components/metric-group/`
- [ ] T047 [P] [US1] Implement the status, notice and error pattern whose state is named in text rather than colour in `src/app/ui/components/status/`
- [ ] T048 [P] [US1] Implement the unavailable and incomplete value pattern that never substitutes zero or an estimate in `src/app/ui/components/unavailable-value/`
- [ ] T049 [P] [US1] Implement the disclosure component exposing expanded state and a persistent text alternative to hover in `src/app/ui/components/disclosure/`
- [ ] T050 [US1] Implement the layer component with visible associated title and description, inert and accessibility-tree-excluded background, dismissal and invoker restoration in `src/app/ui/components/layer/`
- [ ] T051 [US1] Implement the application frame (banner, product identity, navigation slot, route context group, named action group, route-owned `main`, visible status/error region and announcement outlets) in `src/app/ui/components/app-frame/` (depends on T035, T037, T047, T050)
- [ ] T052 [US1] Mount the frame and its route context/heading contract in `src/app/app.html`, `src/app/app.ts` and `src/app/app.routes.ts` (depends on T051)
- [ ] T053 [US1] Register the default/populated, empty, loading, error and disabled declarations — or a nonempty machine-readable N/A rationale — for every component added in this phase in `src/app/ui/previews/preview-manifest.ts`
- [ ] T054 [US1] Add the shell, layer, feedback and preview-catalogue entries with their FR-006–FR-010 requirement ids to `e2e/coverage-ledger.ts`

**Checkpoint**: The shared library and frame are screen-reader complete and every state is previewed, scanned and asserted.

---

## Phase 4: User Story 2 - Use every supported size (Priority: P1)

**Goal**: Every capability stays available on desktop, tablet and mobile in portrait and landscape, stays
complete at 200% text and 400% zoom without horizontal page scrolling, meets AA contrast and target size,
and honours `prefers-reduced-motion` without losing meaning.

**Independent Test**: Run `pnpm run e2e` — all ten projects plus the 200% text, 320 CSS-pixel reflow,
doubled-copy, RTL and reduced-motion variants pass with `documentElement.scrollWidth <= clientWidth`,
44 CSS-pixel targets and no meaning carried by colour, shape, position or motion alone.

### Tests for User Story 2

- [ ] T055 [P] [US2] Add the responsive journey asserting every action and datum remains available and the document never scrolls horizontally across all ten projects in `e2e/responsive.spec.ts`
- [ ] T056 [P] [US2] Add the 200% text-scale and 320 CSS-pixel reflow variants in `e2e/reflow.spec.ts`
- [ ] T057 [P] [US2] Add the `prefers-reduced-motion: reduce` emulation asserting state and feedback equivalence in `e2e/reduced-motion.spec.ts`
- [ ] T058 [P] [US2] Add the doubled-copy and RTL rendering assertions for stable semantic order and untruncated meaning in `e2e/expansion-rtl.spec.ts`
- [ ] T059 [P] [US2] Add the target-size and computed contrast assertions over every ledger state in `e2e/target-and-contrast.spec.ts`

### Implementation for User Story 2

- [ ] T060 [US2] Implement the wide, medium and compact shell composition with wrapping identity/action rows and reserved sticky space in `src/app/ui/components/app-frame/app-frame.scss`
- [ ] T061 [US2] Implement the compact named action layer in which every action keeps visible localized text, replacing the reference's unlabeled ellipsis, in `src/app/ui/components/app-frame/action-layer.ts`
- [ ] T062 [US2] Extend the layer component with the adaptive dialog, bottom-sheet and full-height presentations sharing one state and intent contract in `src/app/ui/components/layer/` (depends on T050)
- [ ] T063 [P] [US2] Apply container-query composition to the collection, table, panel and metric components in their `*.scss` files under `src/app/ui/components/`
- [ ] T064 [P] [US2] Apply the 44 CSS-pixel target baseline token to every interactive component style under `src/app/ui/components/`
- [ ] T065 [P] [US2] Apply the named duration and easing tokens and the reduced-motion removal of nonessential transitions across `src/app/ui/components/`
- [ ] T066 [P] [US2] Convert component styles to logical inline/block properties and apply bidi isolation to technical identifiers across `src/app/ui/components/`
- [ ] T067 [P] [US2] Add the test-only expanded-copy and RTL pseudo providers, excluded from the production registry, in `src/app/i18n/testing/pseudo-locales.ts`
- [ ] T068 [P] [US2] Add the test-only root text-scale provider applied before application render in `e2e/accessibility/text-scale.ts`
- [ ] T069 [US2] Add the expanded, RTL, reduced-motion, long unbroken identity and nested relationship variants to the affected declarations in `src/app/ui/previews/preview-manifest.ts`
- [ ] T070 [US2] Add the wide/medium/compact, orientation, zoom and reduced-motion states with their FR-011–FR-014 ids to `e2e/coverage-ledger.ts`
- [ ] T071 [P] [US2] Write the actual 400% browser zoom protocol for Chromium and Firefox with pointer and single-touch completion in both orientations in `e2e/manual/zoom-400.protocol.md`
- [ ] T072 [US2] Record the first versioned zoom run (versions, viewport/orientation, capability/state, expected, actual, date, result) in `e2e/manual/results/zoom-400.md` (depends on T071)

**Checkpoint**: The foundation is complete at every supported size, text scale, zoom level, direction and motion preference.

---

## Phase 5: User Story 3 - Read the appropriate language (Priority: P2)

**Goal**: Startup selects a shipped language from the saved preference, then the browser language, then
bundled English; a Commander can choose English or German and keep that choice; application text and
number, credit, distance, percentage and date formatting follow the active locale; a missing application
translation falls back to bundled English; and package game text that is unavailable in the active locale
becomes disclosed canonical text or an explicit unavailable value.

**Independent Test**: Run the locale unit suite plus `pnpm run e2e -- locale.spec.ts` and
`pnpm run e2e:offline`: a `de-DE` browser gets German, an unsupported language gets English with zero
locale requests, an explicit selection survives reload, a failed candidate commits complete English once,
and a previously opened German catalogue still loads offline.

### Tests for User Story 3

- [ ] T073 [P] [US3] Add startup precedence unit tests (saved supported tag, exact then base `navigator.languages` match, bundled English default) in `src/app/i18n/locale.store.spec.ts`
- [ ] T074 [P] [US3] Add candidate validation and atomic fallback unit tests (shape, key set, blank value, interpolation mismatch, single commit, no mixed frame) in `src/app/i18n/catalogue-loader.spec.ts`
- [ ] T075 [P] [US3] Add `formatToParts`-based English and German formatter tests for integers, decimals, fraction-percent, metres, kilometres, credits, light years, dates and collation in `src/app/i18n/formatters/formatters.spec.ts`
- [ ] T076 [P] [US3] Add game-text presenter tests over Almanac 0.1.3 fixtures (localized text, known identity with canonical-only text, known identity with no canonical source, unknown identity) in `src/app/i18n/game-text.presenter.spec.ts`
- [ ] T077 [P] [US3] Add the locale journey asserting browser match, explicit selection, persistence across reload, atomic `lang`/`dir`/title change, no raw-key flash and the zero/one/zero request counts in `e2e/locale.spec.ts`
- [ ] T078 [P] [US3] Add the production offline journey (controlled worker, open German once, go offline, reload shell, English and German) in `e2e/offline.spec.ts`

### Implementation for User Story 3

- [ ] T079 [US3] Implement the saved → browser → bundled-English startup precedence with canonical tag matching in `src/app/i18n/locale.store.ts` (depends on T015, T018)
- [ ] T080 [US3] Implement the candidate loader and validator for locale identity, catalogue shape, exact English key set, nonblank values and interpolation parity in `src/app/i18n/catalogue-loader.ts`
- [ ] T081 [US3] Implement the single atomic commit that publishes messages, effective locale, formatter locale, document title, `<html lang>` and `dir` together in `src/app/i18n/locale.store.ts` (depends on T080)
- [ ] T082 [US3] Implement the persistence policy — persist only when a ready snapshot commits with `effectiveLocale === requestedLocale`, retain the prior preference on fallback and report non-persistence once — in `src/app/i18n/locale.store.ts` (depends on T081)
- [ ] T083 [US3] Add the complete reviewed German catalogue with matching keys and interpolation sets in `src/app/i18n/locales/de.json`
- [ ] T084 [US3] Add the catalogue key, blank-value, interpolation-parity and reviewed-secondary-locale gate to `scripts/check-interface-foundations.mjs` with fixtures in `scripts/check-interface-foundations.test.mjs` (depends on T028, T083)
- [ ] T085 [P] [US3] Implement the Almanac leaf presenter (active locale → canonical package text → unavailable) over the 0.1.3 `i18n/modules`, `i18n/blueprints`, `i18n/experimental-effects`, `i18n/experimental-effect-descriptions`, `i18n/engineering-groups`, `i18n/materials`, `i18n/micro-resources`, `i18n/ships`, `i18n/slots`, `i18n/pre-engineered` and `i18n/diagnostics` exports in `src/app/i18n/game-text.presenter.ts`
- [ ] T086 [P] [US3] Implement the game-text component that renders package text with its accurate `lang` and a programmatically associated untranslated disclosure or unavailable framing in `src/app/ui/components/game-text/`
- [ ] T087 [US3] Implement the labelled language selector showing catalogue self-names with busy state, and the shell Language action opening it, in `src/app/ui/components/language-selector/` and `src/app/ui/components/app-frame/` (depends on T079–T082)
- [ ] T088 [US3] Add the service worker with eager shell, font and English asset groups and a lazy `/i18n/*.json` group in `ngsw-config.json`, and register it in `src/app/app.config.ts` and the production configuration in `angular.json`
- [ ] T089 [US3] Surface the locale fallback reason and non-persistence outcome as visible status plus one polite announcement in `src/app/ui/components/app-frame/app-frame.ts` (depends on T034, T082)
- [ ] T090 [US3] Resolve the application-owned document title through the message facade on every committed snapshot in `src/app/i18n/message.service.ts`
- [ ] T091 [US3] Add the language selector, game-text disclosure and unavailable declarations with German format, canonical-untranslated and absent-canonical fixtures in `src/app/ui/previews/preview-manifest.ts`
- [ ] T092 [US3] Add the locale selection, candidate loading, fallback, persistence-unavailable and offline states with their FR-016–FR-020 ids to `e2e/coverage-ledger.ts`

**Checkpoint**: All three stories are independently functional; the foundation ships English and German with an explicit package-text boundary.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T093 [P] Add the canonical qualified conformance message naming criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11 to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`, register the FR-015 id with those assertions in `e2e/coverage-ledger.ts`, and reject unqualified application claims in `scripts/check-interface-foundations.mjs`
- [ ] T094 Reconcile the coverage ledger with the route table, exported `src/app/ui/` components, preview declarations and Playwright project names in `scripts/check-interface-foundations.mjs` (depends on T024, T054, T070, T092)
- [ ] T095 Assert the production output contains no preview route or chunk and emits no cross-origin request in `scripts/check-interface-foundations.mjs`
- [ ] T096 [P] Write and run the versioned NVDA/Firefox desktop, TalkBack/Chromium mobile and tablet screen-reader protocols with their result records in `e2e/manual/screen-reader.protocol.md` and `e2e/manual/results/`
- [ ] T097 [P] Update the Playwright matrix and accessibility-gate statements in `AGENTS.md` and `README.md` to record the ten configured projects and the axe gate
- [ ] T098 Restore unit coverage to at least 80% statements, branches, functions and lines under the thresholds in `angular.json`
- [ ] T099 Execute every scenario in `specs/011-interface-foundations/quickstart.md` and fix each divergence
- [ ] T100 Run `pnpm run check` and confirm formatting, strict compilation, policy checks, build, unit coverage, all ten Playwright projects and all axe scans pass with no skipped, focused or quarantined test

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational
- **User Story 2 (Phase 4)**: Depends on Foundational; T060–T066 and T069 extend components created in US1
- **User Story 3 (Phase 5)**: Depends on Foundational; T087 and T089 extend the frame created in US1
- **Polish (Phase 6)**: Depends on every story whose ledger entries and messages it reconciles

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2. No dependency on another story.
- **US2 (P1)**: Starts after Phase 2. Its own layout, motion, direction and verification tasks are independent; the components it restyles come from US1, so run US1 first in a single-developer sequence.
- **US3 (P2)**: Starts after Phase 2. Fully independent of US2. Its selector and fallback status mount into the US1 frame.

### Within Each User Story

- Tests are written first and must fail before the implementation lands
- Types and services before components; components before the frame that composes them
- Preview declarations and ledger entries close each story so the policy checker stays green

---

## Parallel Opportunities

- Phase 1: T003, T004 and T006 run together after T001
- Phase 2: T007, T009–T012 run together; T014, T015, T016, T020, T021, T024, T026 and T027 run together
- Phase 3: T031–T033 run together; T036–T049 are separate component directories and run together
- Phase 4: T055–T059 run together; T063–T068 run together
- Phase 5: T073–T078 run together; T085 and T086 run together
- Across teams: once Phase 2 completes, one developer takes US1, another takes US3 immediately, and US2 follows US1's component work

## Parallel Example: User Story 1

```bash
# Launch the failing tests together:
Task: "Product semantics journey in e2e/interface-foundations.spec.ts"
Task: "Announcement policy journey in e2e/announcements.spec.ts"
Task: "Preview axe and semantics sweep in e2e/ui-preview.spec.ts"

# Launch the independent component directories together:
Task: "Action button and link in src/app/ui/components/action/"
Task: "Labelled text input and search in src/app/ui/components/text-field/"
Task: "Labelled select in src/app/ui/components/select-field/"
Task: "Metric group in src/app/ui/components/metric-group/"
Task: "Status, notice and error in src/app/ui/components/status/"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — this blocks everything
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: the shared library, frame and announcement policy pass axe, the semantic
   assertions and the preview sweep in all ten projects
5. The foundation is usable by a capability feature at this point

### Incremental Delivery

1. Setup + Foundational → tokens, localization core, component contract, preview host, ten-project harness
2. Add US1 → screen-reader-complete component library and frame (MVP)
3. Add US2 → every supported size, text scale, zoom, direction and motion preference
4. Add US3 → English and German with persistence, offline catalogues and the package-text boundary
5. Polish → conformance wording, ledger reconciliation, manual records and a green `pnpm run check`

### Constitutional Guardrails

- No task adds a backend, account, telemetry, cross-origin runtime request, light theme, production
  preview route or private game-text translation
- A blocked Almanac behaviour waits on an upstream fix; it is never clamped or re-derived here
- No task lowers the 80% coverage thresholds, drops a browser or viewport project, or skips a test to
  reach a green build

## Notes

- [P] tasks touch different files and have no incomplete dependency
- Every component task includes its unit test, its required-state preview declarations and its message
  keys; none of the three is a follow-up
- Commit after each task or logical group; stop at a checkpoint to validate a story independently
