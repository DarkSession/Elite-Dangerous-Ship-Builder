---
description: 'Task list for Start Page'
---

# Tasks: Start Page

**Input**: Design documents from `/specs/014-start-page/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [design/](./design/),
[quickstart.md](./quickstart.md)

**Tests**: Test tasks are included. Constitution principle VIII gates the build on 80% unit
coverage, a Playwright journey per user story across ten viewport/engine projects, and an
automated accessibility check over every screen. [quickstart.md](./quickstart.md) defines
the runnable acceptance scenarios these tasks satisfy.

**Organization**: Tasks are grouped by user story. Each story's checkpoint is a screen a
Commander could be shown.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Every task names every file it changes. A task spanning several files names all of them;
  no file is left to be inferred.

## Path Conventions

Single Angular workspace at the repository root: product source in `src/`, build tooling in
`scripts/`, end-to-end suite in `e2e/`. Unit tests live beside their source as `*.spec.ts`;
Node tooling tests live beside their script as `*.test.mjs`.

## Repository Dependencies

These exist and are not created by any task here. A task naming one assumes it is present.

| Prerequisite                                                                       | Owner       | Tasks gated on it |
| ---------------------------------------------------------------------------------- | ----------- | ----------------- |
| `src/app/features/shared/app-navigation.ts` — the tool registry                    | Feature 011 | T002, T012        |
| `src/app/ui/components/app-frame/` — the shell bar and action row                  | Feature 011 | T007, T009        |
| `src/app/i18n/locales/en.json`, `de.json`; `MessageKey` is `keyof` the English one | Feature 011 | T001, T011        |
| `src/app/ui/previews/preview-manifest.ts` — the component preview catalogue        | Feature 011 | T005              |
| `src/app/features/shared/route-title.strategy.ts` — title and description keys     | Feature 011 | T007              |
| `src/styles/_responsive.scss` — the three composition modes                        | Feature 011 | T014              |
| `src/app/ui/components/legal-excerpt/` — quoted text, marked in its own language   | Feature 012 | T017              |
| `src/app/platform/build/help-manifest.generated.ts` — `disclaimer.exactText`       | Feature 012 | T017              |
| `e2e/coverage-ledger.ts` — the verification ledger the policy checker reconciles   | Feature 011 | T025              |
| `scripts/search/published-addresses.mjs` and the two scripts that read it          | Feature 011 | T021, T022        |

---

## Phase 1: Setup

**Purpose**: the strings and the registry reading every later phase composes from.

- [x] T001 Add the five screen keys — `home.title`, `home.description`, `home.heading`,
      `home.tagline`, `home.tools.label` — to `src/app/i18n/locales/en.json` and
      `src/app/i18n/locales/de.json`. `MessageKey` is `keyof typeof englishCatalogue`, so the
      English catalogue is what widens the union; the German one keeps the catalogues at
      parity, which `src/app/i18n/catalogue-loader.spec.ts` asserts over `SHIPPED_LOCALES`.
      Sentence case in the catalogue, never shouted: the canvas's uppercase is the type
      ramp's `text-transform` (see [data-model.md](./data-model.md), "Message keys").
      **Shipped as two keys, not five** — see "What was built differently" at the foot.
- [x] T002 Add the `ToolCard` interface and the `catalogue()` reading to
      `src/app/features/shared/app-navigation.ts`, returning `{ id, name, href }` for every
      record in `TOOLS`, in registry order, resolved through `MessageService`. Leave
      `tools(currentPath)` and `ToolRecord` untouched — the copy fields arrive in US2
      (contract R5, R6, R7).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the design-system component and the registry's proof. Both user stories consume
these.

**⚠️ CRITICAL**: no user story work begins until this phase is complete.

- [x] T003 [P] Cover `catalogue()` in `src/app/features/shared/app-navigation.spec.ts`:
      every record is returned in registry order (R6), the result carries no notion of a
      current tool (R7), a record added to a copy of the registry reaches both readings with
      no other edit (R1, R4), every `href` matches a path `src/app/app.routes.ts` declares
      (R2), and committing a second locale changes the strings (R9).
- [x] T004 [P] Create `edsb-tool-card` in `src/app/ui/components/tool-card/tool-card.ts`,
      `tool-card.html` and `tool-card.scss`: an anchor whose accessible name is the tool's
      name, with `name` and `href` required and `subjects`, `summary` and `short` optional.
      Presentation only — no injected service, no output (constitution III,
      `src/app/ui/component-contract.ts`). Every colour, size, tracking and gap from tokens;
      the card's own stylesheet stays separate from the page's so neither approaches the 4kB
      `anyComponentStyle` warning (research decision 9).
- [x] T005 Cover the card in `src/app/ui/components/tool-card/tool-card.spec.ts` and declare
      it in `src/app/ui/previews/preview-manifest.ts` with all five component states — a
      fixture where the inputs can represent the state, a machine-readable `naReason` where
      they cannot (the card has no loading, error or disabled state; it renders what it is
      handed).

**Checkpoint**: the registry answers and the card renders in the preview app. No route has
changed yet.

---

## Phase 3: User Story 1 — Arrive and choose a tool (Priority: P1) 🎯 MVP

**Goal**: the product's own address is a screen offering the tools it carries, and activating
one opens it.

**Independent Test**: open `/`, confirm a choice of tools rather than a tool, activate one,
confirm the tool opens and that back returns to the choice. Delivers the entry point with no
other phase built — the spec's own reasoning is that the screen is navigable with names
alone.

### Implementation

- [x] T006 [US1] Create the screen in `src/app/features/start/start.page.ts`, `start.page.html` and
      `start.page.scss`: one `h1` from `home.heading`, the line from `home.tagline`, and a
      region named by `home.tools.label` holding one `edsb-tool-card` per entry from
      `catalogue()`. The selector grid is the page's own layout and nothing else visual is
      authored here ([design/start-page.md](./design/start-page.md)).
- [x] T007 [US1] Make `''` a screen in `src/app/app.routes.ts`: `loadComponent` for `StartPage`,
      `title: 'home.title'`, `data: { description: 'home.description' }`, and redirect `'**'`
      to `''` rather than to `'ships'`. Remove the redirect and the comment that explained
      why it replaced itself in history. Lazy-loaded like every other route (research
      decision 8), and update the file's own leading comment, which counts the screens.
- [x] T008 [US1] Cover the screen in `src/app/features/start/start.page.spec.ts`: one `h1`, one
      link per tool with the tool's name as its accessible name and the tool's `href` as its
      target, no current-tool marker anywhere on the screen (FR-010), and the region carrying
      its name.

### Verification

- [x] T009 [US1] Add `e2e/start-page.spec.ts` covering the journey across all ten projects:
      `/` shows the heading, the line and both tools and is not the shipyard (FR-001,
      FR-002); the bar marks neither tool current (FR-010); the action row still offers
      opening a saved record, importing and help, and nothing new beside them (FR-011);
      activating a tool opens it and back returns to `/` (FR-006, FR-007); `/nonsense` lands
      at `/` (FR-008); `/ships`, `/build`, `/equipment` and a `/build#…` link open directly
      (FR-009).
- [x] T010 [P] [US1] Audit the nine `goto('/')` call sites in `e2e/app-shell.spec.ts`,
      `e2e/screen-reader.spec.ts` and `e2e/reflow.spec.ts`. Each is read and classified:
      indifferent to where it lands stays `/` and now exercises the entry point; meaning the
      shipyard becomes `/ships`. No find-and-replace — a swept test keeps passing while
      silently changing what it is about (research decision 6).
- [x] T011 [P] [US1] Audit the five `goto('/')` call sites in `e2e/offline.spec.ts` by the
      same rule. Proving the application starts without a network is indifferent and should
      now prove it about the screen a Commander actually opens first.
- [x] T012 [P] [US1] Audit the remaining seven `goto('/')` call sites, one file at a time:
      `e2e/target-and-contrast.spec.ts`, `e2e/responsive.spec.ts`,
      `e2e/reduced-motion.spec.ts`, `e2e/interface-foundations.spec.ts`,
      `e2e/help-and-licences.spec.ts`, `e2e/application-update.spec.ts` and
      `e2e/announcements.spec.ts`.

**Checkpoint**: `/` is a screen. Both tools are named and open. The suite is green. This is
the MVP and is demonstrable on its own.

---

## Phase 4: User Story 2 — Tell the tools apart before opening one (Priority: P2)

**Goal**: each tool states the subjects it covers and what a Commander does with it, so the
choice is made before the click.

**Independent Test**: open `/` and read each entry — name, subjects and a description — with
no tool opened. Narrow past the compact fold and confirm the shorter form replaces the
fuller one.

**Extends US1**: this phase adds content to the card and the registry US1 built. US1 remains
demonstrable throughout.

### Implementation

- [x] T013 [US2] Add the six copy keys — `tools.ship.summary`, `tools.ship.short`,
      `tools.ship.subjects`, `tools.equipment.summary`, `tools.equipment.short`,
      `tools.equipment.subjects` — to `src/app/i18n/locales/en.json` and
      `src/app/i18n/locales/de.json`. The subject list is one already-joined string per
      locale, not a list, so a translator writes their language's own series punctuation
      rather than being handed a middle dot ([data-model.md](./data-model.md), "Tool"). The
      English wording is the canvas's, in sentence case.
- [x] T014 [US2] Extend `ToolRecord` with `summaryKey`, `shortSummaryKey` and `subjectsKey` in
      `src/app/features/shared/app-navigation.ts`, wire the values into both `TOOLS` records,
      and have `catalogue()` resolve all three onto every `ToolCard`. Both descriptions go on
      every entry — choosing between them is not this reading's job (contract R3, R8).
- [x] T015 [US2] Render the new content in `src/app/ui/components/tool-card/tool-card.html`: the
      subject list, both descriptions, and the compact `→` mark hidden from readers. Both
      description forms are in the document at every width; the hidden one is
      `display: none`, never the `visually-hidden` mixin, so a reader does not hear each tool
      described twice (research decision 3).
- [x] T016 [US2] Fold the two forms by the existing composition modes in
      `src/app/ui/components/tool-card/tool-card.scss` and
      `src/app/features/start/start.page.scss` — compact draws the short description with no
      subjects and the `→` mark in a row; medium and wide draw the subjects, the fuller
      description and the two-column grid. Media queries, not a measured width, and no new
      threshold (FR-018, [design/screen-inventory.md](./design/screen-inventory.md),
      "Composition").

### Verification

- [x] T017 [P] [US2] Extend `src/app/features/shared/app-navigation.spec.ts` and
      `src/app/ui/components/tool-card/tool-card.spec.ts`: every entry carries a non-empty
      `summary` and `short` that differ from each other and a non-empty `subjects` (R8); the
      card puts both forms in the document; the subjects and the descriptions sit inside the
      link so the tool's name is what a link list reports.
- [x] T018 [US2] Extend `e2e/start-page.spec.ts`: each tool is named, its subjects listed and
      a description read (FR-005); and at each of the ten projects exactly one of the two
      description forms is visible per tool — never both, never neither — and the choice is
      the same for every tool on the screen (FR-019, SC-008).

**Checkpoint**: a Commander who has never seen NavBeacon can choose between the two tools
from the entry point alone, at every viewport.

---

## Phase 5: User Story 3 — See whose material this is (Priority: P3)

**Goal**: the entry point carries the Frontier attribution at its foot.

**Independent Test**: open `/`, reach the foot, confirm the statement is present in full and
legible at desktop, tablet and mobile widths.

### Implementation

- [x] T019 [US3] Add the attribution band to `src/app/features/start/start.page.html`,
      `start.page.ts` and `start.page.scss`: `edsb-legal-excerpt` fed
      `helpManifest.disclaimer.exactText` and `disclaimer.language` from
      `src/app/platform/build/help-manifest.generated.ts`, in a band closed at the top by a
      1px rule. No new message key and no re-typed sentence — the text is a quoted notice,
      and translating or restating it would be this application editing something it only
      carries (research decision 4).

### Verification

- [x] T020 [P] [US3] Extend `src/app/features/start/start.page.spec.ts`: the band renders the
      manifest's exact text, character for character including the closing "of it.", and
      carries the manifest's `lang` rather than the interface's.
- [x] T021 [P] [US3] Extend `e2e/start-page.spec.ts`: the statement is present at the foot,
      untruncated, at the desktop, tablet and mobile projects (FR-012, SC-003's foot).

**Checkpoint**: all three stories are independently demonstrable.

---

## Phase 6: The published root address

**Purpose**: the root stops being a redirect, so it becomes an address the deployment
publishes and the gate reconciles. Nothing a Commander sees changes here; what a crawler and
a link preview are served does (FR-016,
[contracts/published-root.md](./contracts/published-root.md)).

- [x] T022 **Nothing to reword.** `src/index.html`'s committed `<title>`, `description`,
      `og:title`, `og:description`, `twitter:title` and `twitter:description` are already
      bound to `app.name` and `app.description`, and the root address names those two keys — the file's own comment states that every
      phrase in it is the default for the screen the application opens on, and that screen
      changed. Leave the canonical, `og:url`, `robots`, the manifest link and the structured
      data exactly as they are (P5, P7).
- [x] T023 Make the root an address: add
      `{ path: '', titleKey: 'home.title', descriptionKey: 'home.description' }` first in
      `STATIC_ADDRESSES` in `scripts/search/published-addresses.mjs`, and drop `''` from
      `UNLISTABLE_ROUTES` in `scripts/check-interface-foundations.mjs` — `'**'` stays, a
      wildcard is not an address (P2, P3).
- [x] T024 Map the root to its document: `fileFor` in `scripts/publish-static-routes.mjs`
      returns `index.html` for the empty route, every other address keeping `<route>.html`,
      with a case for it in `scripts/publish-static-routes.test.mjs` and a case in
      `scripts/check-interface-foundations.test.mjs` for the route now being reconciled (P4).
- [x] T025 Regenerate `public/sitemap.xml` with `pnpm run search:sitemap` and confirm the
      diff is exactly one added `<loc>`, `https://navbeacon.app/`, ahead of the tool
      addresses (P6).
- [x] T026 Extend `e2e/search-published.spec.ts` and `e2e/search-visibility.spec.ts` to the
      root address: the document it answers with carries the entry point's title and
      description, and the running application publishes the same pair a moment later.

**Checkpoint**: the product's own address is advertised, and says what the product is.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T027 Register the feature in `e2e/coverage-ledger.ts`: add `'014-start-page'` to
      `COVERED_FEATURES` and add entries covering every id the spec declares — FR-001 through
      FR-019 and SC-001 through SC-008. Adding the directory immediately requires every id,
      and the policy checker names the unregistered ones on failure. The new route and the
      new exported component are reconciled here too, so an entry is not optional.
- [x] T028 [P] Extend the accessibility sweep to the screen: `/` in
      `e2e/target-and-contrast.spec.ts` (the `--ink-62`, `--ink-55` and `--ink-32` washes and
      the full-card target size), `e2e/reflow.spec.ts` at 400% zoom, and
      `e2e/expansion-rtl.spec.ts` for text expansion and right-to-left with no horizontal
      page scrolling (FR-013, FR-014, FR-015).
- [ ] T029 [P] **Not done — needs a person and a real screen reader.** Add the screen to `e2e/manual/screen-reader.protocol.md` and record the run in
      `specs/014-start-page/design/screen-reader-record.md`: the outline, the link list
      reporting two tool names, the hidden description form being genuinely absent rather
      than doubly announced, and the attribution read in its own language.
- [x] T030 Walk [quickstart.md](./quickstart.md) end to end — all nine hand steps and the
      published-root proof — and correct any step the implementation moved.
- [x] T031 **Ran; 7,659 passed and one contention flake — see the note below.** Run
      `pnpm run check` in full: format, help artefacts, sitemap check, typecheck,
      both builds, policy, codec capacity, script tests, unit tests with coverage, and the
      Playwright suite across all ten projects plus the timing and offline runs.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: needs T001 and T002. Blocks every user story.
- **US1 (Phase 3)**: needs Phase 2. Independently demonstrable.
- **US2 (Phase 4)**: needs Phase 2, and extends the files US1 created — so it follows US1
  rather than running beside it.
- **US3 (Phase 5)**: needs T006 (the screen exists). Otherwise independent of US2; it can be
  built before US2 if the attribution is wanted sooner.
- **Published root (Phase 6)**: needs T007, because there is no address to publish until the
  route is a screen. Independent of US2 and US3.
- **Polish (Phase 7)**: T027 needs every requirement to have a surface, so it follows all
  three stories. T028–T029 need the screen. T031 is last.

### Within Each Story

- Implementation before its verification tasks, because there is nothing to assert against
  until the screen renders. This repository's TDD rule binds bug fixes — a fix starts with a
  failing test — and this is new capability.
- T013 before T014 (a key must exist before a record can name it), T014 before T015 (the card
  cannot render what it is not handed), T015 before T016 (the fold hides forms that must be
  in the document first).

### Parallel Opportunities

- T003 and T004 are different files with no shared dependency.
- T010, T011 and T012 are three disjoint sets of end-to-end files.
- T017, T020 and T021 touch different specs.
- T028 and T029 are independent of each other.
- Phase 6 can run beside Phase 4 and Phase 5 once T007 has landed: it touches
  `src/index.html`, three scripts and the sitemap, and no file any story phase touches.

---

## Parallel Example: User Story 1

```bash
# After T009 lands, the three audits are disjoint file sets:
Task: "Audit the nine goto('/') sites in e2e/app-shell.spec.ts, screen-reader.spec.ts, reflow.spec.ts"
Task: "Audit the five goto('/') sites in e2e/offline.spec.ts"
Task: "Audit the seven remaining goto('/') sites across six files"
```

```bash
# Phase 2, before any story:
Task: "Cover catalogue() in src/app/features/shared/app-navigation.spec.ts"
Task: "Create edsb-tool-card in src/app/ui/components/tool-card/"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 — the five screen keys and `catalogue()`.
2. Phase 2 — the card and the registry's proof.
3. Phase 3 — the screen, the route, the audit.
4. **Stop and validate**: `/` offers both tools, opens either, and the suite is green.

That is a shippable entry point. The tools are named and reachable, which is what the spec
says the screen needs to be navigable.

### Incremental Delivery

1. MVP as above → demo.
2. US2 → each tool is described and the fold works → demo.
3. US3 → the attribution → demo.
4. Phase 6 → the product's address is advertised. Invisible to a Commander, visible to a
   search result.
5. Phase 7 → the ledger, the sweeps, the manual record, the full gate.

### Notes

- Commit after each task or logical group.
- The `[P]` marker means different files and no dependency on an incomplete task, not
  "unimportant".
- Nothing here adds a token, a breakpoint, a dependency or a build step. A task that finds
  itself wanting one has drifted from [plan.md](./plan.md).
- The standing rule holds through implementation: if it is not on `.design/Home.dc.html`, it
  does not go on the screen. [design/start-page.md](./design/start-page.md) lists the things
  a start page plausibly wants and this one does not have.

---

## What was built differently, and why

Recorded here rather than left for the next reader to discover.

- **T001 shipped two screen keys, not five.** `home.title` and `home.description` were
  dropped: the route names `app.name` and `app.description`, two keys that already existed
  and already describe the product. So the bar names the product as the canvas draws it
  (`NAV BEACON`), the tab says `NavBeacon` once, and `src/index.html`'s head is unchanged —
  it was already bound to those two keys, which `e2e/search-visibility.spec.ts` asserts in
  all ten projects. An earlier pass rewrote that head to the screen's own masthead and
  tagline and broke the binding everywhere; the full gate caught it and it is reverted. `home.tools.label` was dropped
  with them — the canvas draws no named region around the tool entries, and two links do not
  need one. Adding it would have been an invisible addition beside the design rather than at
  the accessibility floor.
- **The masthead is an `h2`, not the `h1`.** The shell's bar owns the page's `h1` and names
  the screen; a page that drew its own would be two `h1`s saying two different things, which
  `expectSingleVisibleH1` and the ledger's own rule both forbid. The canvas draws the
  masthead as its artboard's `h1` and `NAV BEACON` as a plain div — the same visible text,
  a different outline. This is the one place the implementation inverts the canvas, and it
  is a shell-consistency decision rather than a content one.
- **`resolveDocumentTitle` gained a rule.** The start page's own name is the product's name,
  so `NavBeacon · NavBeacon` would have been the tab. The product is now stated once, in
  both the runtime function and the script copy that `documentTitleParity` holds to it.
- **Three tokens were added, against the plan's "no new token".** The canvas's masthead is
  46px at 1440px and 28px at 390px, and the ramp — which is the canvas's own sizes, unscaled
  — carried nothing above 26px. `--ednb-type-size-5xl`/`-6xl` and their two semantic names
  are that. `--ednb-measure-content-narrow` (67.5rem) is the canvas's own `max-width: 1080px`
  on the start page's middle, against the 90rem a screen full of columns is given. Extending
  the system is what constitution VII asks for; the plan's claim was simply wrong.
- **Two tests in `e2e/interface-foundations.spec.ts` were retargeted, not swept.** Both open
  `/` and assert the current tool is Ship Builder, which is exactly the behaviour FR-010
  changes. They now open `/ships` first. The other nine call sites in that file and the
  eighteen elsewhere were left on `/` deliberately: each is about the shell — landmarks,
  contrast, reflow, announcements, the service worker — and now exercises the screen a
  Commander actually opens first.
- **The full gate ends on one flaky failure, and it is not this feature's.**
  `e2e/module-engineering.spec.ts:159` failed on two consecutive full runs — a _different
  project each time_, `chromium-tablet-portrait` then `chromium-desktop` — while 7,649 and
  then 7,659 tests passed around it. Run alone it passes in all ten projects in 16 seconds.
  The spec navigates to the outfitting bench and never to `/`, and nothing this feature
  changed is on its path. It is the contention artefact this repository already knows about,
  and it is a pre-existing defect worth its own fix rather than something to mute here.
- **A real defect the full gate caught, and it was mine.** `search-visibility.spec.ts:170`
  failed in all ten projects on the first full run: `src/index.html`'s head is bound to
  `app.name` and `app.description`, and an earlier pass had rewritten it to the screen's
  masthead and tagline. Reverted — the head's wording is unchanged by this feature, and the
  root address names those two existing keys.
- **A real defect the design review caught**: at 320px with 200% text and 400% zoom the tool
  cards forced their grid track wider than the viewport and the document scrolled sideways.
  Fixed with `minmax(0, 1fr)` on the track and `min-inline-size: 0` on the card host.
