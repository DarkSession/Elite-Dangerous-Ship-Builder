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
`scripts/`. Unit tests live beside their source as `*.spec.ts`. Feature 011 owns the application's
sole service-worker dependency, registration and base configuration; downstream capabilities may
only extend its static asset groups. It also owns the repository-wide invariant that every
application message change updates the complete English and German catalogues together.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the dependencies, compiler strictness, assets and second Angular application the
foundation needs before any source lands.

- [x] T001 Add lockfile-compatible `@jsverse/transloco` and `@angular/service-worker` dependencies and `@axe-core/playwright`, `postcss` and `postcss-scss` development dependencies in `package.json`, then install and commit the updated `pnpm-lock.yaml` _(Superseded 2026-08-26: Transloco was removed; the application owns interpolation in `src/app/i18n/locale-registry.ts`.)_
- [x] T002 Enable `"strict": true` in `compilerOptions` and `"strictTemplates": true` in `angularCompilerOptions` in `tsconfig.json`, and repair every resulting error in `src/`, `e2e/` and `playwright.config.ts`
- [x] T003 [P] Add the `ui:preview`, `e2e:preview`, `e2e:offline` and `policy` script entries to `package.json` so the new preview, offline and policy targets are runnable
- [x] T004 [P] Vendor licensed Barlow, Barlow Condensed and JetBrains Mono WOFF2 subsets with their OFL licence files under `public/fonts/`
- [x] T005 Scaffold the tooling-only preview application in `projects/ui-preview/` (`src/main.ts`, `src/index.html`, `src/app/preview-app.ts`, `tsconfig.app.json`) and register its build and serve targets under `projects` in `angular.json`
- [x] T006 [P] Copy `src/app/i18n/locales` to the same-origin `/i18n/` output through the build `assets` array in `angular.json` and keep `projects/ui-preview` out of the product build graph

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The single token set, localization core, shared component contract, preview manifest and
verification harness that every user story composes.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Design tokens and global styles

- [x] T007 [P] Define the primitive token literals in `src/styles/tokens/_primitives.scss`: take the colour primitives from the 55 named custom properties in `.design/Ship Builder.dc.html` (`--amber-*`, `--ink-*`, `--panel-*`, `--bg-*`, `--hot`, `--good`, `--cool`, `--hair`), and author the type scale, spacing, radius, elevation, border, motion and target primitives here as bounded named step scales with the canvas as visual reference only — this repository is the record and the design tool is a preview (principle VII). The canvas `font-size` values of 8px and 9px are artboard-thumbnail artifacts and MUST NOT become a type scale, and its 78 `padding`, 18 `gap` and 15 `letter-spacing` literals MUST NOT be imported as a spacing system
- [x] T008 Define the one contrast-audited semantic dark set consuming only primitives in `src/styles/tokens/_semantic.scss` (depends on T007)
- [x] T009 [P] Record AA text and non-text contrast evidence for every intended semantic pair in `specs/011-interface-foundations/design/token-evidence.md`
- [x] T010 [P] Declare the same-origin `@font-face` rules and complete fallback stacks in `src/styles/_fonts.scss`
- [x] T011 [P] Set the dark surface, root typography, logical-property defaults and `prefers-reduced-motion` base rules in `src/styles/_base.scss`
- [x] T012 [P] Define the named layout, container-query and wide/medium/compact composition primitives in `src/styles/_responsive.scss`
- [x] T013 Compose the token, font, base and responsive partials in `src/styles.scss` (depends on T007–T012)

### Platform adapters

- [x] T014 [P] Implement the document and navigator adapters with unit tests in `src/app/platform/browser/document.adapter.ts` and `src/app/platform/browser/navigator.adapter.ts`
- [x] T015 [P] Store nothing: the browser language setting is the only locale input, so no preference adapter exists

### Localization core (bundled English)

- [x] T016 [P] Define the `ShippedLocale`, `LocaleCandidate` and `LocaleSnapshot` types and the `en`/`de` registry entries in `src/app/i18n/locale-registry.ts`
- [x] T017 Seed the canonical English and German catalogues with reviewed shell, action, status, error, unavailable, disclosure and generic-unknown-key messages using identical key and interpolation-variable sets in `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [x] T018 Implement the signal `LocaleStore` that commits exactly one bundled-English ready snapshot per revision in `src/app/i18n/locale.store.ts` with unit tests (depends on T016, T017)
- [x] T019 Implement the typed message facade over Transloco in `src/app/i18n/message.service.ts` and register the localization providers in `src/app/app.config.ts` (depends on T016–T018) _(Superseded 2026-08-26: the facade interpolates with the repository's own `interpolate`, not Transloco.)_
- [x] T020 [P] Implement the cached named `Intl` formatter registry (integer, decimal, fraction-percent, metre/kilometre unit, named date, collator, display name, and credit/light-year message patterns) in `src/app/i18n/formatters/` with unit tests

### Shared component and preview infrastructure

- [x] T021 [P] Define the shared component contract types (immutable inputs, typed intents, semantics, required state set) in `src/app/ui/component-contract.ts`
- [x] T022 Define the typed preview declaration, required-state and N/A rationale rules and the manifest registry in `src/app/ui/previews/preview-manifest.ts` (depends on T021)
- [x] T023 Render every manifest declaration at a stable component/state address in `projects/ui-preview/src/app/`, importing the production tokens, UI exports and localization providers (depends on T005, T013, T019, T022)
- [x] T024 [P] Create the machine-readable coverage ledger joining surfaces, requirement ids, journeys, axe flags, named assertions and manual protocol ids, seeded with this feature's cross-cutting design-system (FR-001–FR-005) and verification (FR-021–FR-024) entries that no user story owns, in `e2e/coverage-ledger.ts`

### Verification harness

- [x] T025 Generate the ten named projects (desktop, tablet portrait, tablet landscape, mobile portrait, mobile landscape × Chromium and Firefox) with explicit engine descriptors, `hasTouch` on the four touch profiles and `E2E_CHROMIUM_PATH`/`E2E_FIREFOX_PATH` escape hatches in `playwright.config.ts`
- [x] T026 [P] Add the shared axe helper that scans WCAG A/AA through 2.2 with no disabled rules and attaches the full JSON result on failure in `e2e/accessibility/axe.ts`
- [x] T027 [P] Add the landmark, heading, matching-name, state, relationship, text-equivalence, target-size and document-overflow assertion helpers in `e2e/accessibility/assertions.ts`
- [x] T028 Implement the AST- and PostCSS-backed policy checker for owned literal display text, literal visible/accessibility attributes, governed visual literals outside token sources, uninspectable inline styles, missing preview declarations, skipped or focused interface tests, and every `FR-` and `SC-` id declared in any `specs/*/spec.md` appearing at least once in `e2e/coverage-ledger.ts` with the unregistered ids named on failure, in `scripts/check-interface-foundations.mjs`
- [x] T029 Add positive and negative fixture tests for every checker rule in `scripts/check-interface-foundations.test.mjs` (depends on T028)
- [x] T030 Invoke the policy checker, preview and offline targets from the `check` script in `package.json` so a violation fails the build (depends on T003, T028)

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

- [x] T031 [P] [US1] Add the product semantics journey (banner, navigation, one `main`, one visible `h1`, ordered headings, matching names, roles, states, label/description/error/unit relationships) in `e2e/interface-foundations.spec.ts`
- [x] T032 [P] [US1] Add the announcement policy journey (one assertive blocking summary, coalesced polite change, silence for initial, unchanged, stale and unaffected content) in `e2e/announcements.spec.ts`
- [x] T033 [P] [US1] Add the preview sweep that renders every applicable declaration and runs axe plus the semantic and text-equivalence assertions in `e2e/ui-preview.spec.ts`

### Implementation for User Story 1

- [x] T034 [P] [US1] Implement the announcement event record and `(kind, revision, urgency)` dedupe policy in `src/app/ui/announcements/announcement.service.ts` with unit tests
- [x] T035 [US1] Implement the hidden assertive and polite outlet component in `src/app/ui/announcements/announcement-outlet.ts` (depends on T034)
- [x] T036 [P] [US1] Implement the visually-hidden text and bidi-isolation utilities in `src/app/ui/a11y/text-equivalence.ts`
- [x] T037 [P] [US1] Implement the action button and link components with visible/accessible name parity and busy, pressed and disabled state in `src/app/ui/components/action/`
- [x] T038 [P] [US1] Implement the labelled text input and search field with associated label, description and error in `src/app/ui/components/text-field/`
- [x] T039 [P] [US1] Implement the labelled select with associated label, description and error in `src/app/ui/components/select-field/`
- [x] T040 [P] [US1] Implement the labelled textarea with associated label, description and error in `src/app/ui/components/textarea-field/`
- [x] T041 [P] [US1] Implement the radio, checkbox and switch choice group exposing checked and invalid state in `src/app/ui/components/choice-group/`
- [x] T042 [P] [US1] Implement the segmented and tab controls exposing selected and current state in `src/app/ui/components/tab-group/`
- [x] T043 [P] [US1] Implement the panel and card containers with named regions in `src/app/ui/components/panel/`
- [x] T044 [P] [US1] Implement the semantic collection (list) shell that never swallows nested controls in `src/app/ui/components/collection/`
- [x] T045 [P] [US1] Implement the table shell with caption and associated row/column headers in `src/app/ui/components/table/`
- [x] T046 [P] [US1] Implement the definition and metric group exposing value, unit, viewing condition and description relationships in `src/app/ui/components/metric-group/`
- [x] T047 [P] [US1] Implement the status, notice and error pattern whose state is named in text rather than colour in `src/app/ui/components/status/`
- [x] T048 [P] [US1] Implement the unavailable and incomplete value pattern that never substitutes zero or an estimate in `src/app/ui/components/unavailable-value/`
- [x] T049 [P] [US1] Implement the disclosure component exposing expanded state and a persistent text alternative to hover in `src/app/ui/components/disclosure/`
- [x] T050 [US1] Implement the layer component with visible associated title and description, inert and accessibility-tree-excluded background, dismissal and invoker restoration in `src/app/ui/components/layer/`
- [x] T051 [US1] Implement the application frame (banner, product identity, navigation slot, route context group, named action group, route-owned `main`, visible status/error region and announcement outlets) in `src/app/ui/components/app-frame/` (depends on T035, T037, T047, T050)
- [x] T052 [US1] Mount the frame and its route context/heading contract in `src/app/app.html`, `src/app/app.ts` and `src/app/app.routes.ts` (depends on T051)
- [x] T053 [US1] Register the default/populated, empty, loading, error and disabled declarations — or a nonempty machine-readable N/A rationale — for every component added in this phase in `src/app/ui/previews/preview-manifest.ts`
- [x] T054 [US1] Add the shell, layer, feedback and preview-catalogue entries with their FR-006–FR-010 requirement ids to `e2e/coverage-ledger.ts`

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

- [x] T055 [P] [US2] Add the responsive journey asserting every action and datum remains available and the document never scrolls horizontally across all ten projects in `e2e/responsive.spec.ts`
- [x] T056 [P] [US2] Add the 200% text-scale and 320 CSS-pixel reflow variants in `e2e/reflow.spec.ts`
- [x] T057 [P] [US2] Add the `prefers-reduced-motion: reduce` emulation asserting state and feedback equivalence in `e2e/reduced-motion.spec.ts`
- [x] T058 [P] [US2] Add the doubled-copy and RTL rendering assertions for stable semantic order and untruncated meaning in `e2e/expansion-rtl.spec.ts`
- [x] T059 [P] [US2] Add the target-size and computed contrast assertions over every ledger state in `e2e/target-and-contrast.spec.ts`

### Implementation for User Story 2

- [x] T060 [US2] Implement the wide, medium and compact shell composition with wrapping identity/action rows and reserved sticky space in `src/app/ui/components/app-frame/app-frame.scss`
- [x] T061 [US2] Implement the compact named action layer in which every action keeps visible localized text, replacing the reference's unlabeled ellipsis, in `src/app/ui/components/app-frame/action-layer.ts`
- [x] T062 [US2] Extend the layer component with the adaptive dialog, bottom-sheet and full-height presentations sharing one state and intent contract in `src/app/ui/components/layer/` (depends on T050)
- [x] T063 [P] [US2] Apply container-query composition to the collection, table, panel and metric components in their `*.scss` files under `src/app/ui/components/`
- [x] T064 [P] [US2] Apply the 44 CSS-pixel target baseline token to every interactive component style under `src/app/ui/components/`
- [x] T065 [P] [US2] Apply the named duration and easing tokens and the reduced-motion removal of nonessential transitions across `src/app/ui/components/`
- [x] T066 [P] [US2] Convert component styles to logical inline/block properties and apply bidi isolation to technical identifiers across `src/app/ui/components/`
- [x] T067 [P] [US2] Add the test-only expanded-copy and RTL pseudo providers, excluded from the production registry, in `src/app/i18n/testing/pseudo-locales.ts`
- [x] T068 [P] [US2] Add the test-only root text-scale provider applied before application render in `e2e/accessibility/text-scale.ts`
- [x] T069 [US2] Add the expanded, RTL, reduced-motion, long unbroken identity and nested relationship variants to the affected declarations in `src/app/ui/previews/preview-manifest.ts`
- [x] T070 [US2] Add the wide/medium/compact, orientation, zoom and reduced-motion states with their FR-011–FR-014 ids to `e2e/coverage-ledger.ts`
- [x] T071 [P] [US2] Write the actual 400% browser zoom protocol for Chromium and Firefox with pointer and single-touch completion in both orientations in `e2e/manual/zoom-400.protocol.md`
- [x] T072 [US2] Run 400% zoom automatically — the 320x256 viewport at a device scale factor of 4, in both engines across all ten projects — in `e2e/reflow.spec.ts`, leaving `e2e/manual/results/zoom-400.md` for the usability judgment a measurement cannot make (depends on T071)

**Checkpoint**: The foundation is complete at every supported size, text scale, zoom level, direction and motion preference.

---

## Phase 5: User Story 3 - Read the appropriate language (Priority: P2)

**Goal**: Startup selects a shipped language from the browser language, then bundled English, with no
in-application language control and nothing stored; application text and number, credit, distance,
percentage and date formatting follow the active locale; a missing application translation falls back to
bundled English; and package game text that is unavailable in the active locale becomes disclosed
canonical text or an explicit unavailable value.

**Independent Test**: Run the locale unit suite plus `pnpm run e2e:offline`: a `de-DE` browser gets
German, an unsupported language gets English with zero locale requests, a failed candidate commits
complete English once, and a German catalogue loaded once still loads offline.

### Tests for User Story 3

- [x] T073 [P] [US3] Add startup precedence unit tests (exact then base `navigator.languages` match, bundled English default) in `src/app/i18n/locale.store.spec.ts`
- [x] T074 [P] [US3] Add candidate validation and atomic fallback unit tests covering locale identity, shape, missing and extra keys, blank values, interpolation-variable mismatch, one complete commit, retained prior snapshot during loading and no partial or mixed-language frame in `src/app/i18n/catalogue-loader.spec.ts`
- [x] T075 [P] [US3] Add `formatToParts`-based English and German formatter tests for integers, decimals, fraction-percent, metres, kilometres, credits, light years, dates and collation in `src/app/i18n/formatters/formatters.spec.ts`
- [x] T076 [P] [US3] Add game-text presenter tests over installed Almanac fixtures (localized text, known identity with canonical-only text, known identity with no canonical source, unknown identity) in `src/app/i18n/game-text.presenter.spec.ts`
- [x] T077 [P] [US3] Cover browser match, atomic `lang`/`dir`/title change and the zero/one request counts through the offline journey and the locale unit suite; no product journey exists for switching because the interface offers no language control
- [x] T078 [P] [US3] Add the production offline journey (controlled worker, a German browser context loading German once, go offline, reload shell in both languages) in `e2e/offline.spec.ts`

### Implementation for User Story 3

- [x] T079 [US3] Implement the browser → bundled-English startup precedence with canonical tag matching in `src/app/i18n/locale.store.ts` (depends on T018)
- [x] T080 [US3] Implement the candidate loader and validator for locale identity, catalogue shape, exact English key set, nonblank values and interpolation parity in `src/app/i18n/catalogue-loader.ts`
- [x] T081 [US3] Implement the single atomic commit that publishes messages, effective locale, formatter locale, document title, `<html lang>` and `dir` together in `src/app/i18n/locale.store.ts` (depends on T080)
- [x] T082 [US3] Keep the locale entirely derived: no language control, no stored preference and no storage adapter, so a changed browser setting takes effect on the next start with nothing to invalidate (depends on T081)
- [x] T083 [US3] Complete the reviewed English and German catalogues for every application-owned message currently present in the repository, preserving identical non-empty key sets and interpolation variables in `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [x] T084 [US3] Add the repository-wide English/German exact-key, nonblank-value, interpolation-variable and reviewed-wording gate to `scripts/check-interface-foundations.mjs`, requiring every downstream capability message change to update both catalogues in the same change and naming every mismatch in positive and negative fixtures in `scripts/check-interface-foundations.test.mjs` (depends on T028, T083)
- [x] T085 [P] [US3] Implement the Almanac leaf presenter (active locale → canonical package text → unavailable) over the installed package's `i18n/modules`, `i18n/blueprints`, `i18n/experimental-effects`, `i18n/experimental-effect-descriptions`, `i18n/engineering-groups`, `i18n/materials`, `i18n/micro-resources`, `i18n/ships`, `i18n/slots`, `i18n/pre-engineered` and `i18n/diagnostics` exports in `src/app/i18n/game-text.presenter.ts`
- [x] T086 [P] [US3] Implement the game-text component that renders package text with its accurate `lang` and a programmatically associated untranslated disclosure or unavailable framing in `src/app/ui/components/game-text/`
- [x] T087 [US3] Publish no language control: the shell contributes no Language action and the application ships no selector component (depends on T079–T082)
- [x] T088 [US3] Install and register the application's sole service worker with eager shell, font and bundled-English asset groups plus a lazy `/i18n/*.json` group in `ngsw-config.json`, `src/app/app.config.ts` and `angular.json`; add ownership fixtures to `scripts/check-interface-foundations.test.mjs` proving downstream features may extend static asset groups but cannot add another registration, worker dependency or cache owner
- [x] T089 [US3] Surface the locale fallback reason as visible status plus one polite announcement in `src/app/ui/components/app-frame/app-frame.ts` (depends on T034, T082)
- [x] T090 [US3] Resolve the application-owned document title through the message facade on every committed snapshot in `src/app/i18n/message.service.ts`
- [x] T091 [US3] Add the game-text disclosure and unavailable declarations with German format, canonical-untranslated and absent-canonical fixtures in `src/app/ui/previews/preview-manifest.ts`
- [x] T092 [US3] Add the locale startup, candidate loading, fallback and offline states with their FR-016–FR-020 ids to `e2e/coverage-ledger.ts`

**Checkpoint**: All three stories are independently functional; the foundation ships English and German with an explicit package-text boundary.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T093 [P] Keep the interface free of any conformance statement, register the FR-015 id in `e2e/coverage-ledger.ts` against the prohibition it actually states, and reject unqualified application claims in `scripts/check-interface-foundations.mjs`
- [x] T094 Reconcile the coverage ledger with the route table, exported `src/app/ui/` components, preview declarations and Playwright project names in `scripts/check-interface-foundations.mjs`. Register the SC-001–SC-006 ids against the named assertions that evidence them in `e2e/coverage-ledger.ts`. (depends on T024, T054, T070, T092)
- [x] T095 Assert the production output contains no preview route or chunk and emits no cross-origin request in `scripts/check-interface-foundations.mjs`
- [x] T096 [P] Assert the accessibility tree itself — shell structure and order, named live regions, dialog ownership, group state and field/error association — in `e2e/screen-reader.spec.ts`, and record in `e2e/manual/screen-reader.protocol.md` which layers remain manual: NVDA speech capture needs a Windows runner, TalkBack has no driver, and comprehension is a judgment
- [x] T097 [P] Update the Playwright matrix and accessibility-gate statements in `AGENTS.md` and `README.md` to record the ten configured projects and the axe gate
- [x] T098 Restore unit coverage to at least 80% statements, branches, functions and lines under the thresholds in `angular.json`
- [x] T099 Execute every scenario in `specs/011-interface-foundations/quickstart.md` and fix each divergence
- [x] T100 Run the `pnpm run check` pipeline declared in `package.json` and confirm formatting, strict compilation, policy checks, build, unit coverage, all ten Playwright projects and all axe scans pass with no skipped, focused or quarantined test

---

## Phase 7: Reference Extraction

**Goal**: the token layer is the measured reference canvas rather than a palette taken from it and
generic scales authored beside it. Raised after review found the first implementation had adopted the
55 colour properties and invented every other scale, losing the reference's identity — which lives
almost entirely in the non-colour decisions.

- [x] T101 Measure `.design/Ship Builder.dc.html` canvases 1a–1d and record every governed value — colour, families, type ramp, tracking ladder, spacing, geometry, elevation, textures and the recurring chrome — in `specs/011-interface-foundations/design/canvas-extraction.md`
- [x] T102 Carry all 55 canvas colour properties into `src/styles/tokens/_primitives.scss`, plus the five the canvas leaves as literals (rail ground, both scrims, the overlay shadow and the hull-artwork filter) (depends on T101)
- [x] T103 Replace the authored type, tracking, spacing, radius, border and elevation scales in `src/styles/tokens/_primitives.scss` with the measured ones, lifting only the type ramp and only uniformly (depends on T101)
- [x] T104 Re-audit every text role against the nine grounds the canvas uses, shift the ink label ladder so its lowest rung clears 4.5:1, and record the outcome in `specs/011-interface-foundations/design/token-evidence.md` (depends on T103)
- [x] T105 Express the canvas's use of the primitives as roles in `src/styles/tokens/_semantic.scss` — bar, rail, footer, field and row surfaces, the grid and command rules, the selection marker, the tracking ladder by job (depends on T104)
- [x] T106 Name the recurring chrome once as mixins in `src/styles/_responsive.scss`: command bar, command flag, display title, micro label, metric value, the five control variants, ruled group, field surface, selectable row, section rule and artwork plate (depends on T105)
- [x] T107 Compose those mixins across `src/app/ui/` so no component restates the chrome: frame, action, panel, layer, field, choice group, table, catalogue view, record list, metric group, artwork, tabs, disclosure, collection, toolbar, status and the game-text markers (depends on T106)
- [x] T108 Add the segmented arrangement to `src/app/ui/components/choice-group/choice-group.ts` — native inputs, labels styled as the strip, focus visible on the label — and use it for the catalogue's size choices (depends on T106)
- [x] T109 Bound both tracks of `region-pair` to the reference's `1fr` plus fixed rail in `src/styles/_responsive.scss` (depends on T106)
- [x] T110 Record the extraction outcome, the one deliberate transform and what the first implementation discarded in `specs/011-interface-foundations/design/reference-review.md` (depends on T101)
- [x] T111 Run `pnpm run check` and fix every divergence the ten Playwright projects, the axe scans and the computed contrast assertions report against the extracted tokens (depends on T107, T108, T109)
- [x] T112 Give the shell the reference's command bar: the screen's own name as the document's one `h1`, the screen's count beside it, no product name, and no navigation entry for the screen already showing (`src/app/ui/components/app-frame/`, `src/app/features/shared/screen-chrome.ts`, `src/app/features/shared/app-navigation.ts`)
- [x] T113 Add the container step below `medium` that the reference's 340px rail needs for a two-column metric grid, and span a lone trailing cell across the row (`src/styles/_responsive.scss`, `src/app/ui/components/metric-group/metric-group.scss`)
- [x] T114 Stop the shared clipping scan reporting visually hidden content as cut off, and exclude `aria-hidden` decoration from the visible-text half of the name-matches-visible-text assertion (`e2e/accessibility/assertions.ts`)

---

## Phase 8: User Story 4 - Read the version that was published (Priority: P2)

**Goal**: a session already open when a newer version is published says so and offers the restart
that applies it, without ever applying one by itself; a session that is never asked is served the
newer version the next time the application starts; and a cached application the worker cannot repair
states that and offers the recovery. Raised after the service worker installed in US3 turned out to
have a second face: the same worker that makes the application readable offline keeps serving the
version it installed, and nothing on screen said so.

**Independent Test**: Run `pnpm run e2e:offline`: with the worker in control, a deployment stood in
for by the test server produces a visible notice and a named restart, nothing on screen is replaced
until that control is used, and using it brings the application back on the published version.

### Tests for User Story 4

- [x] T115 [P] [US4] Add version-channel unit tests over a driveable worker port — a downloaded version, an unrepairable cache, a repeated report, a released listener, a check that could not be made and a document with no window — in `src/app/platform/browser/application-update.adapter.spec.ts`
- [x] T116 [P] [US4] Add version-policy unit tests — the moments a session asks, one event per state change, `unusable` superseding `ready`, no restart without being asked, the activate-then-restart order as a recorded sequence rather than two counts, the restart offered again when there was no page to start over, and silence where no worker caches the application — in `src/app/application/updates/application-update.store.spec.ts`
- [x] T117 [P] [US4] Add the shell wiring tests — notice, named action, polite and assertive announcements, and the committed locale that must not republish an event that already happened — in `src/app/app.spec.ts`, and the two-standing-notices assertion in `src/app/ui/components/feedback.spec.ts`
- [x] T118 [US4] Add the production update journey (controlled worker, a stood-in deployment, the notice and its axe sweep, no reload until asked, the restart, and the next start of a session that never asks) in `e2e/application-update.spec.ts`, and let the test server stand in for a deployment per browser in `scripts/serve-production.mjs` (depends on T088)

### Implementation for User Story 4

- [x] T119 [US4] Implement the worker port — version events, check, activate, restart and the repeating check — in `src/app/platform/browser/application-update.adapter.ts`, injecting `SwUpdate` optionally so a build with no worker is still constructible (depends on T088)
- [x] T120 [US4] Add the returning-to-the-page half of the lifecycle port in `src/app/platform/browser/page-lifecycle.adapter.ts`
- [x] T121 [US4] Implement the version policy — what a session knows, when it asks, what changes what a Commander is told, and the activate-then-restart that applies it — in `src/app/application/updates/application-update.store.ts` (depends on T119, T120)
- [x] T122 [US4] Publish the notice and the named restart from the shell root in `src/app/app.ts` and `src/app/app.html`, with one polite event per waiting version and one assertive event for an unrepairable cache (depends on T121)
- [x] T123 [US4] Carry every standing notice in the frame's status region rather than the first of them in `src/app/ui/components/app-frame/` (depends on T089)
- [x] T124 [P] [US4] Add the reviewed English and German notice, detail and action messages to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [x] T125 [US4] Add the update states with their FR-025, FR-026 and SC-007 ids to `e2e/coverage-ledger.ts`, and register `application-update.spec.ts` in the production run in `package.json` and `playwright.config.ts` (depends on T118, T122)
- [x] T126 [US4] Render the unrepairable composition — the named error and the control that recovers it — as the frame's `error` declaration in `src/app/ui/previews/preview-manifest.ts`, so the one update state no journey can provoke is still scanned (depends on T122)
- [x] T127 [US4] Keep both announcement effects dependent on their own source only, by resolving the message outside the tracking context in `src/app/app.ts` and `src/app/ui/components/app-frame/app-frame.ts`; a committed catalogue must not republish an event that already happened

**Checkpoint**: the worker no longer strands a session on the build it installed.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational
- **User Story 2 (Phase 4)**: Depends on Foundational; T060–T066 and T069 extend components created in US1
- **User Story 3 (Phase 5)**: Depends on Foundational; T087 and T089 extend the frame created in US1
- **Polish (Phase 6)**: Depends on every story whose ledger entries and messages it reconciles
- **User Story 4 (Phase 8)**: Depends on US3's registered worker (T088) and mounts into the US1 frame

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2. No dependency on another story.
- **US2 (P1)**: Starts after Phase 2. Its own layout, motion, direction and verification tasks are independent; the components it restyles come from US1, so run US1 first in a single-developer sequence.
- **US3 (P2)**: Starts after Phase 2. Fully independent of US2. Its selector and fallback status mount into the US1 frame.
- **US4 (P2)**: Starts after US3 registers the worker. Its notice and restart mount into the US1 frame beside US3's fallback status.

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
- Phase 8: T115–T117 run together; T124 runs alongside them
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
6. Reference extraction → the measured canvas as the token layer, composed by every component
7. Add US4 → a newly published version reaches a session that is already open

### Constitutional Guardrails

- No task adds a backend, account, telemetry, cross-origin runtime request, light theme, production
  preview route or private game-text translation
- A blocked Almanac behaviour waits on an upstream fix; it is never clamped or re-derived here
- No task lowers the 80% coverage thresholds, drops a browser or viewport project, or skips a test to
  reach a green build

## Phase 9: The restart stops asking, 2026-08-27

> The overlay the 2026-08-26 reversal introduced still put a question on screen — `Restart now` or
> `Not now` — and the owner's decision is that a published update is applied, not offered. The
> Commander is told what is happening, and told again on the other side of the restart.

- [x] T131 Take the two controls off the overlay. `Layer` gains a `dismissLabel` of `null`, which is
      what leaves a layer with no control, no Escape and no ground to click; `update.applying.now`
      and `update.applying.postpone` go with them, and `ApplicationUpdateStore.postpone()` goes with
      the countdown-cancellation it existed for.
      _One input rather than two: a label and a separate "is it dismissible" flag can disagree, and
      a layer that offers no way out has no control to name._
- [x] T132 Draw the other half. The restart writes a marker to `sessionStorage` immediately before
      the reload, the session that comes up reads it, clears it and opens a layer saying the update
      was applied and naming the version it is running. `sessionStorage` because the restart
      replaces one tab: a Commander with four open should be told in the one that restarted.
      The marker is taken back where `reload()` reports there was no page to start over, and it is
      never written by the repair of an unusable cache.
- [x] T133 Set the grace period to ten seconds. Twenty was WCAG 2.2.1's floor for the control that
      called the restart off; with no such control the floor does not apply, and what sets the
      number is how long the overlay's two sentences take to read.
- [x] T134 Amend the constitution to 8.0.0: 2.2.1 Timing Adjustable joins the excluded criteria,
      scoped by name to this restart and to nothing else, with the Sync Impact Report and the
      "wherever conformance is stated" rule both saying eight rather than seven.
      _A second time limit anywhere in the application needs an amendment rather than a reading of
      this one._
- [x] T135 Carry the eighth criterion through: `EXCLUDED_CRITERIA` in
      `scripts/check-interface-foundations.mjs`, the conformance statements in `AGENTS.md` and
      `specs/004-slef/plan.md` that the checker guards, this feature's own scope, story 2 item 3,
      FR-012 and FR-015, and the ledger line that counts them. A statement naming only the seven
      keyboard criteria now fails the checker, and a test asserts that it does.
- [x] T136 Amend FR-025 and SC-007 to the announced restart, rewrite story 4 items 2 and 3, and
      bring `design/application-shell.md`, `quickstart.md` and `plan.md` with them.
- [x] T137 [P] Cover it: the layer with no way out in `containers.spec.ts`, the marker and its three
      absences in `application-update.store.spec.ts`, the empty overlay and the arriving notice in
      `app.spec.ts`, and the whole journey in `e2e/application-update.spec.ts` — where the two
      postponement journeys are replaced by one that presses nothing and one that never waits the
      overlay out. Reconcile `e2e/coverage-ledger.ts` with all of it.

## Phase 10: The application says what it is, 2026-08-27

> "Analyse the application and propose ways to optimize for search engines." Four routes were served
> one title, no description, no canonical and no card, and the analysis in
> `design/search-visibility.md` is the first deliverable rather than a by-product of the second.

- [x] T138 Write the analysis. What a crawler is served on each of the four routes today, six
      findings ranked by what they cost, and — named rather than buried — the three omissions that
      wait on an asset or a build step: no card image, no hull pages in the sitemap, no installable
      icon. Record what was considered and deliberately not done, prerendering first.
      _Proposing without saying what the proposal leaves out is how a follow-up becomes a surprise._
- [x] T139 Give a route an identity. `SITE_ORIGIN` and `canonicalAddress` in
      `src/app/platform/browser/site-address.ts`; routes declare a `description` message key beside
      their title key; `RouteTitleStrategy` resolves both and hands the store the route's path with
      them. A child with no description of its own inherits the nearest ancestor's, walked rather
      than configured, so `paramsInheritanceStrategy` does not change what every other consumer of
      `data` sees.
      _The canonical is built from a constant rather than from `location`: a preview canonical to
      itself is exactly the duplicate a canonical exists to collapse._
- [x] T140 Widen the one commit. `DocumentAdapter.commitRootState` takes a `RootDocumentState` and
      publishes description, `og:*`, `twitter:*` and the canonical link alongside `lang`, `dir` and
      the title; the locale store publishes it from its single commit point, so a description can
      never be left in the language the title has just moved out of.
- [x] T141 [P] Ship the static half. The English defaults in `src/index.html`, plus
      `public/robots.txt`, `public/sitemap.xml`, `public/manifest.webmanifest` and a JSON-LD
      `WebApplication` node. Relative `start_url`, `scope` and icon paths, for the same reason the
      locale catalogues' paths are relative. Prefetch the manifest in `ngsw-config.json`.
- [x] T142 Gate the drift. `searchMetadataViolations` reconciles the four files against `SITE_ORIGIN`
      and against the route table, and the cross-origin rule stops reporting a `rel="canonical"` as
      a request — a declared relationship opens no connection, while `preconnect`, `manifest` and
      `stylesheet` still do and stay caught.
      _Four files now repeat the origin and the route list. A route added with no sitemap entry
      fails nothing at runtime; it fails months later in a search result nobody is looking at._
- [x] T143 [P] Cover it: `site-address.spec.ts`, the head writes in `document.adapter.spec.ts`, the
      key resolution and inheritance in `route-title.strategy.spec.ts`, the widened commit in
      `locale.store.spec.ts`, both directions of the new rule in
      `check-interface-foundations.test.mjs`, and the journey in `e2e/search-visibility.spec.ts`.
      Reconcile `e2e/coverage-ledger.ts` with FR-027 and SC-008.

## Phase 11: Less on screen, 2026-08-28

> Two Commander requests about text that is drawn and does not earn its place: the restart overlay
> standing for ten seconds ahead of a reload that takes a fraction of one, and the untranslated chip
> beside every game noun a German reader meets.

- [x] T144 Shorten the restart announcement. `UPDATE_OVERLAY_MS` is one second, and
      `update.applying.detail` — the sentence about the build surviving in the link and in this
      browser — goes with the wait that existed to read it. FR-025, SC-007's journey,
      `design/application-shell.md`, `quickstart.md` and the manual screen-reader protocol are
      amended together; the store's own unit test asserts the new bound rather than the old floor.
      _The overlay is not a passage to finish. The half written to be read is the `Updated` notice
      the restarted session draws, and it carries no clock at all._
- [x] T145 Record what that costs, and stop the journeys racing the clocks. Neither update layer is
      swept by axe any more — the overlay stands for one second and the arrival notice for six, and
      one axe pass is 2.5 s locally and about twice that on a runner, so a sweep would as often be
      scanning the page that replaced it. `e2e/coverage-ledger.ts` carries `axe: false` and the
      reason in place rather than leaving the surface looking scanned.
      The journeys stopped waiting on the layers too. Playwright's auto-retrying assertions settle to
      a one-second poll, which against a one-second state is a coin toss whose losing side looks
      exactly like the overlay never being drawn; `watchForRestartOverlay` has the page record what
      it drew, at animation-frame cadence, into the `sessionStorage` that survives the restart, and
      the assertions are made afterwards. The two overlay journeys become one, because they were two
      races against the same second.
      _A gap named on the ledger is a decision; a gap nobody wrote down is a claim — and a test that
      is green half the time for reasons of sampling is neither._
- [x] T147 Let the arrival notice go by itself. `UPDATE_APPLIED_NOTICE_MS` is six seconds, run on
      the same one-shot port as the restart's grace and stopped when the notice's own control is
      pressed or the store is destroyed. It is a second time limit, so constitution V is amended to
      9.0.0 to cover applying an update rather than the restart alone, and `AGENTS.md`, FR-025,
      SC-007, `design/application-shell.md` and the manual protocol say the same thing. The journey
      leaves the control alone and waits the notice out; `app.spec.ts` is where pressing it is
      asserted, because a journey that waited to press it would be pressing a layer that had gone.
      _The version it names is on Help · About and the application is already running it. A modal in
      front of the build a Commander came back to is not where either fact belongs._
- [x] T146 Take the untranslated chip off `edsb-game-text`. The badge, its message key in both
      catalogues and its rules in `game-text.scss` and `slot-card.scss` go; the `lang` attribute and
      the `aria-describedby` disclosure stay, and they are what FR-020 now names. The German material
      journey in `e2e/cost-and-materials.spec.ts` asserts the disclosure where it asserted the badge.
      _A marker on nearly every row marks nothing. Untranslated game text is the ordinary state of a
      package locale this application does not own._
- [x] T148 Carry it into feature 002's record and re-measure what it held up.
      `design/outfitting-workspace.md` said the ledger row keeps its `UNTRANSLATED` tag; it does not,
      and the revision says why. The tag was also the seventy-odd pixels that made the ledger's
      longest German name overflow — measured again, `Advanced Planetary Approach Suite` now fits at
      205 against 205 at all five layout profiles, at 100% text and at 200%, so the two German
      journeys in `e2e/module-outfitting.spec.ts` assert the fits-whole branch and say so rather than
      passing while measuring nothing. The cut-and-reach path is proved over the port in
      `outfitting-components.spec.ts`, where the overflow is declared instead of waited for.
      _A test that quietly stops exercising the thing it is named after is worse than no test._

## Notes

- [P] tasks touch different files and have no incomplete dependency
- Every component task includes its unit test, its required-state preview declarations and its message
  keys; none of the three is a follow-up
- Commit after each task or logical group; stop at a checkpoint to validate a story independently

- [x] T149 Inset a sheet from the top of the screen. Add `--ednb-space-sheet-inset` to the token
      layer, take it out of the sheet's 88% bound in `src/app/ui/components/layer/layer.scss` so the
      scrim below is unchanged, and hold the layer to it in `e2e/responsive.spec.ts`. Flush against
      the edge, a sheet's title bar met the top of the screen with nothing above it and a phone's own
      status bar cut into it (`design/canvas-extraction.md`, "Panel dialog")

- [x] T150 Take the repeated screen furniture into the library. `ednb-empty-state` for the three
      screens that state an absence, `ednb-layer-footer` for the three layers that close with a row of
      answers, `ednb-format-layer` for the two export layers that draw a format list beside the chosen
      format, and `ednb-pip-control` for the two regions that set one bank's pips. Each carries its own
      unit test, and each but the pip blocks is declared in `preview-manifest.ts` with all five
      states. Recorded in `design/shared-patterns.md`, with the rule that decides component from mixin
      _An agreement kept by hand between two copies is not an agreement._
- [x] T151 Name the declaration bodies the stylesheets repeated. `panel-plate`, `panel-plate-head`,
      `toned-block`, `block-tone`, `prose-note`, `panel-foot`, `bare-list`, `section-heading` and
      `section-line` join `src/styles/_responsive.scss` and replace seventy-odd hand-written copies. A
      repeated body on markup that differs is a mixin, because a component there would only put the
      caller's own children behind a projection boundary
      _A mixin nothing calls is dead code; every one of these is applied where it was found._
- [x] T152 Draw the waits. `ednb-waiting-mark` holds the mark and the path to it; `ednb-skeleton`
      holds the room the content will take, with a sentence a reader gets and bars that do not move.
      The frame draws a skeleton for a route chunk it has to fetch, each deferred block draws one
      after 200ms and holds it for 400, the catalogue's inspector draws one for the hull-detail chunk,
      and the workspace draws one while the build link is being read. FR-029, SC-010 and
      `design/waiting-states.md` state the rule and account for every wait, including the ones that
      draw nothing (`011/FR-029`, `011/SC-010` in `e2e/coverage-ledger.ts`)
      _A screen that cannot draw its content yet must not claim the content is absent._
- [x] T153 Let the schematic's plate wait for both of its requests. The mount geometry and the hull
      drawing arrive separately, so the plate holds the waiting mark until the picture has loaded and
      hides the marks and their leaders behind `visibility` until then. Drawn over an empty plate they
      say the hull has no drawing rather than that one is on its way
      (`specs/010-hull-anatomy/design/hull-anatomy.md`)
      _Hidden rather than absent: the marks are placed from the drawing's own coordinates._
- [x] T154 Give the waiting mark its own reduced-motion rule. It is an SVG loaded through `img`, so
      it is a separate document and `_base.scss` cannot reach it. The rule goes inside
      `public/assets/loader.svg`, and root `LICENSE` records the adaptation of the EDAssets mark
      _A global rule that cannot reach a document is not a rule that document follows._
- [x] T155 Announce the wait once. The skeleton's region is a `status` and carries no `aria-busy`: an
      assistive technology holds a live region marked busy until the flag drops, and this region only
      exists while the wait is on, so the flag would suppress the one announcement it exists to make
      _A busy flag on the region that only exists while it is busy says nothing and costs the notice._
