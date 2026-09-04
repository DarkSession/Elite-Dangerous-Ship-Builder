---
description: 'Task list for Equipment Builder'
---

# Tasks: Equipment Builder

**Input**: Design documents from `/specs/013-equipment-builder/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [design/](./design/),
[quickstart.md](./quickstart.md)

**Tests**: Test tasks are included. Constitution principle VIII gates the build on 80% unit
coverage, a Playwright journey per user story across ten viewport/engine projects, and an automated
accessibility check over every screen. [quickstart.md](./quickstart.md) defines the runnable
acceptance scenarios these tasks satisfy.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested and
demonstrated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Every task names every file it changes. A task spanning several files names all of them; no file
  is left to be inferred.

## Path Conventions

Single Angular workspace at the repository root: product source in `src/`, build tooling in
`scripts/`, end-to-end suite in `e2e/`, prose records in `docs/`. Unit tests live beside their
source as `*.spec.ts`; Node tooling tests live beside their script as `*.test.mjs`.

## Repository Dependencies

These exist and are not created by any task here. A task naming one assumes it is present.

| Prerequisite                                                                    | Owner            | Tasks gated on it                 |
| ------------------------------------------------------------------------------- | ---------------- | --------------------------------- |
| `src/app/ui/components/app-frame/` — the shell bar drawn from the tool registry | Feature 011      | T001, T002                        |
| `src/app/features/shared/app-navigation.ts` — the tool registry                 | Feature 011      | T001                              |
| `src/app/i18n/locales/en.json`, `de.json` and the fallback rule                 | Feature 011      | T004 and every UI task            |
| `src/app/i18n/game-text.presenter.ts` — the package-text boundary               | Feature 011      | T021                              |
| `src/app/ui/previews/preview-manifest.ts` — the component preview catalogue     | Feature 011      | T033, T045, T058                  |
| `src/app/ui/outfitting/` — slot, chooser, attribute and material primitives     | Features 002–009 | T030–T034, T043–T046              |
| `src/app/domain/build-link/` — Base70, CRC envelope, bit packer, error type     | Feature 004      | T007–T010                         |
| `src/app/platform/storage/` — record repository, migration, locks, tab claims   | Feature 001      | T049–T053                         |
| `src/app/application/build-library/` — save, conflict, open, retention          | Feature 001      | T052–T055                         |
| Ten Chromium/Firefox viewport-orientation projects in `playwright.config.ts`    | Feature 011      | T038, T048, T057, T067, T075–T079 |
| `e2e/coverage-ledger.ts` — the shared machine-readable coverage ledger          | Feature 011      | T074                              |

**Upstream**: `@elite-dangerous-almanac/core` **0.2.9 or later** is required — it publishes
`Suit.mounts`, `personalWeaponMetrics` and `equipment/tools`. The repository already pins it. No
upstream gap blocks any task below.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: give the bench an address, a name in the shell, and a message namespace.

- [x] T001 [P] Register the equipment tool in `src/app/features/shared/app-navigation.ts` — add
      `NAVIGATION_ROUTES.equipment`, a second `TOOLS` row with `labelKey: 'tools.equipment'` and the
      routes it owns — and cover the two-tool bar in
      `src/app/features/shared/app-navigation.spec.ts`
- [x] T002 [P] Add the lazy `/equipment` route in `src/app/app.routes.ts` with `title` and
      `data.description` message keys, and assert it in `src/app/app.spec.ts`
- [x] T003 Create the bench page shell in `src/app/features/equipment/equipment-bench.page.ts`,
      `.html`, `.scss` and `.spec.ts` — regions declared, no behaviour yet
- [x] T004 [P] Add the `equipment.*` and `tools.equipment` message keys to
      `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`

**Checkpoint**: `/equipment` answers, the shell names two tools, and nothing else works yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the loadout model, the readings every region states, and the link format that carries
them. Nothing in Phase 3 or later can begin until this is done.

**⚠️ CRITICAL**: T005–T010 change committed, passing code. They land together or not at all — the
model change breaks the codec's contract the moment it is made.

### The loadout, addressed by the game's own mount keys

- [x] T005 Rewrite `weapons` in `src/app/domain/equipment/loadout-link/equipment-loadout.ts` as one
      entry per catalogue mount in `PersonalMountKey` order, with held entries permitted, and
      replace the positional-index doc comment with the published-key rule
      ([contracts/equipment-loadout-link.md](./contracts/equipment-loadout-link.md))
- [x] T006 Emit `MOUNTS` (the distinct `PersonalMount.key` values across `SUITS`, in game order) and
      `MOUNT_SLOTS` from `scripts/generate-equipment-link-codec-tables.mjs`, keeping `SUIT_MOUNTS`
      as the per-suit membership the decoder checks against
- [x] T007 Regenerate `src/app/domain/equipment/loadout-link/equipment-link-table-1.json` with
      `node scripts/generate-equipment-link-codec-tables.mjs --overwrite` followed by `pnpm run codec:tables:equipment` and re-pin its content hash in
      `src/app/domain/equipment/loadout-link/equipment-link-codec.spec.ts`
- [x] T008 Write and read one mount field per `MOUNTS` entry in
      `src/app/domain/equipment/loadout-link/equipment-link-codec.ts`, checking each weapon against
      its **mount** rather than against the selected suit, so held content encodes
- [x] T009 Extend `src/app/domain/equipment/loadout-link/equipment-link-codec.spec.ts` with absolute
      encodings for a loadout holding a weapon on an unoffered mount and a modification in a locked
      slot, and keep the existing refusal cases passing
- [x] T010 [P] Update `docs/equipment-link-codec.md` for the mount-key addressing, the `MOUNTS`
      table entry, the revised size figures and the withdrawn constitution II departure

### Mounts and edits

- [x] T011 [P] Create `src/app/domain/equipment/loadout/loadout-mounts.ts` and `.spec.ts` — the
      catalogue mount set, and `offered` / `held` / `absent` per mount for a given suit
- [x] T012 [P] Create `src/app/domain/equipment/loadout/loadout-edit.ts` and `.spec.ts` — every
      choice as a pure transition over a loadout: select suit, set suit grade, fit weapon, set
      weapon grade, fit modification, clear slot

### Readings, each one a package call

- [x] T013 [P] Create `src/app/domain/equipment/readings/suit-readings.ts` and `.spec.ts` — shield
      strength, regeneration and the four resistances at the selected grade, folded through
      `applyPersonalModifiers` with the suit's **unlocked** modifiers only
- [x] T014 [P] Create `src/app/domain/equipment/readings/weapon-readings.ts` and `.spec.ts` — the
      catalogue attributes plus `personalWeaponMetrics(weapon, grade, modifiers, options)`, passing
      `options.reloadSpeed` when Reload Speed is fitted because that recipe carries no modifier, and
      folding the suit's Extra Ammo Capacity into the weapon's `reserveAmmo`
- [x] T015 [P] Create `src/app/domain/equipment/readings/tool-readings.ts` and `.spec.ts` — which
      `PERSONAL_TOOLS` the selected suit's `family` carries, and how many. Names and count only; no
      tool stat is read ([contracts/equipment-bench.md](./contracts/equipment-bench.md))
- [x] T016 [P] Create `src/app/domain/equipment/readings/material-requirement.ts` and `.spec.ts` —
      `getPersonalModificationCost` per fitted **unlocked** modification through
      `sumPersonalEngineeringIngredients`, with `resolvePersonalModificationForWeapon` settling the
      three-technology recipes
- [x] T017 Assert every derived figure against the package exhaustively in
      `src/app/domain/equipment/readings/almanac-acceptance.spec.ts` — every suit at every published
      grade, every weapon at every published grade, every modification on every item it is offered
      for (SC-002's off-screen half)

### Application layer

- [x] T018 Create `src/app/application/equipment/loadout.store.ts` and `.spec.ts` — the open
      loadout, the selected item, and the dispatch surface for T012's transitions
- [x] T019 Create `src/app/application/equipment/loadout-history.ts` and `.spec.ts` — undo and redo
      as a stack of committed loadouts, on the pattern of
      `src/app/application/outfitting/outfitting-history.spec.ts` (FR-022)
- [x] T020 Create `src/app/application/equipment/candidate-query.ts` and `.spec.ts` — what a mount
      accepts and what a modification slot accepts, including the once-per-item rule
- [x] T021 Register `getSuitName`, `getPersonalModificationName`, `getPersonalMountName` and
      `getPersonalToolName` in `src/app/i18n/game-text.presenter.ts` and its `.spec.ts`, so a mount
      name resolves `canonical` while the package carries English only
- [x] T022 [P] Extend `src/app/i18n/package-text.spec.ts` to pin the equipment leaves' locale
      coverage, including that a mount name is English-only in this release
- [x] T023 Create `src/app/application/equipment/loadout.presenter.ts` and `.spec.ts` — readings
      plus localisation into one view model, so no component reaches the package

**Checkpoint**: the whole bench is computable and round-trippable with nothing rendered.

---

## Phase 3: User Story 1 - Assemble a loadout and read what it is worth (Priority: P1) 🎯 MVP

**Goal**: pick a suit, set grades, fill mounts, and read the assembled Commander.

**Independent Test**: choose each suit at each available grade, fit a weapon in every mount it
offers, and confirm the shield, regeneration, resistance and firepower figures change with each
choice and match the equipment library.

### Tests for User Story 1

- [x] T024 [P] [US1] Write the US1 journey in `e2e/equipment-builder.spec.ts` — suit, grades,
      weapons per mount, and the stats restating — failing until the regions exist
- [x] T025 [P] [US1] Write the held-mount case in `e2e/equipment-builder.spec.ts`: switch from the
      Dominator to the Maverick and back, and confirm the second primary weapon returns intact

### Implementation for User Story 1

- [x] T026 [P] [US1] Create the resistance bar in `src/app/ui/equipment/resistance-bar.ts`, `.html`,
      `.scss` and `.spec.ts` — signed percentage as text beside the bar, the bar decorative
- [x] T027 [US1] Build the loadout ledger in
      `src/app/features/equipment/loadout-ledger/loadout-ledger.ts`, `.html`, `.scss` and
      `.spec.ts` — the suit row, one row per catalogue mount with its state, and the modification
      count per item
- [x] T028 [US1] Draw a held mount as unavailable **with its weapon still named**, in
      `src/app/features/equipment/loadout-ledger/loadout-ledger.html` and `.spec.ts` (FR-007)
- [x] T029 [US1] Add the `SUIT TOOLS` rows to
      `src/app/features/equipment/suit-tools/suit-tools.ts`, `.html`, `.scss` and `.spec.ts` — a
      badge, a name and a count, dimmed, never selectable, and no tool stat (FR-005a)
- [x] T030 [US1] Build the item view in `src/app/features/equipment/item-view/item-view.ts`,
      `.html`, `.scss` and `.spec.ts` — identity, the grade ladder composed from
      `src/app/ui/outfitting/grade-selector`, and the attribute list including damage per shot,
      headshot damage, DPS and sustained DPS
- [x] T031 [US1] Offer only a mount's own weapons (FR-003) — **relocated**: the chooser shipped as
      `weapon-chooser.ts` opening a layer over the bench, and the design-conformance pass withdrew
      it. Both artboards draw the alternatives inline under the modification slots — canvas 1a's
      `#pe-alt` two across in the item column, canvas 1b's in the drill-in it has already opened —
      and no artboard draws a layer for them. The list is
      `src/app/ui/equipment/choice-list` in the item view, filtered to the mount's own weapons by
      `src/app/application/equipment/candidate-query`; the component and its spec are deleted (013
      design/reference-review.md, "Left as built, after the fifth pass")
- [x] T032 [US1] Build the commander stats region in
      `src/app/features/equipment/commander-stats/commander-stats.ts`, `.html`, `.scss` and
      `.spec.ts` — armour and shield resistance groups, strength, regeneration, and one firepower
      row per fitted weapon
- [x] T033 [P] [US1] Register the resistance bar and each US1 region in
      `src/app/ui/previews/preview-manifest.ts`, with default, populated, empty and held states at
      three widths — **narrowed**: the two shared components (`resistance-bar`, `choice-list`) are
      registered; the four regions are not, because their inputs are presenter view models
      carrying package figures and a fixture for one would have to state a shield strength or a DPS
      no package call produced (constitution II). Those four are swept as the bench itself in
      `e2e/equipment-accessibility.spec.ts`, at every project width.
- [x] T034 [US1] Compose the ledger, item view, suit tools and stats into
      `src/app/features/equipment/equipment-bench.page.ts` and `.html`, wide as three columns and
      compact as the `LOADOUT` / `STATS` tabs of artboard `1b`
- [x] T035 [US1] Wire undo and redo controls into
      `src/app/features/equipment/equipment-bench.page.html` and `.spec.ts` (FR-022)
- [x] T036 [US1] State the Flight Suit honestly in
      `src/app/features/equipment/item-view/item-view.html` and `.spec.ts` — grade 1 only, no
      primary mount, and a modification region that says it cannot be upgraded rather than drawing
      four locked slots
- [x] T037 [US1] Give every mount, slot and state an accessible name in
      `src/app/features/equipment/loadout-ledger/loadout-ledger.html`,
      `src/app/features/equipment/item-view/item-view.html`,
      `src/app/features/equipment/suit-tools/suit-tools.html` and
      `src/app/features/equipment/commander-stats/commander-stats.html`, so held and locked read as
      text rather than as dimming
- [x] T038 [US1] Run `e2e/equipment-builder.spec.ts` green across the ten projects and add the axe
      sweep over the bench in `e2e/accessibility/` for the US1 surfaces — the sweep is
      `e2e/equipment-accessibility.spec.ts`, beside `e2e/outfitting-accessibility.spec.ts` and
      calling the same `sweepOutfittingState`, because `e2e/accessibility/` holds the helpers rather
      than the suites

**Checkpoint**: a Commander can assemble a loadout and read every figure. Demoable.

---

## Phase 4: User Story 2 - Fit modifications and see what they cost (Priority: P2)

**Goal**: fit modifications within the slots a grade unlocks, and read the micro-resources.

**Independent Test**: fit modifications across a suit and three weapons, and confirm the material
requirement is the sum of every fitted, unlocked modification and changes as they are added and
removed.

### Tests for User Story 2

- [x] T039 [P] [US2] Write the US2 journey in `e2e/equipment-builder.spec.ts` — open slots, fit,
      read the materials, remove, and watch the total move
- [x] T040 [P] [US2] Write the locked-slot case in `e2e/equipment-builder.spec.ts`: fit in slot 4 at
      grade 5, drop to grade 3, and confirm the modification is held, uncounted, and returns

### Implementation for User Story 2

- [x] T041 [US2] Draw the four modification slots with their open and locked states in
      `src/app/features/equipment/item-view/modification-slots.ts`, `.html`, `.scss` and
      `.spec.ts` — locked slots present, never hidden, keeping their contents (FR-008, FR-011)
- [x] T042 [US2] Offer only the recipes a slot accepts, once per item, in
      `src/app/features/equipment/item-view/modification-chooser.ts`, `.html`, `.scss` and
      `.spec.ts`, with a clear-slot control in the chooser rather than on hover (FR-009, FR-012)
- [x] T043 [US2] Name the engineers who grant each modification in
      `src/app/features/equipment/item-view/modification-chooser.html` and `.spec.ts` (FR-010)
- [x] T044 [US2] State a recipe with no published magnitude as fitted with no numeric change — never
      a zero — in `src/app/features/equipment/item-view/modification-slots.html` and `.spec.ts`
- [x] T045 [US2] Build the material requirements region in
      `src/app/features/equipment/material-requirements/material-requirements.ts`, `.html`, `.scss`
      and `.spec.ts`, composed from `src/app/ui/outfitting/material-lines`, with the
      `n TYPES · n UNITS` summary
- [x] T046 [P] [US2] Register the US2 regions and their states in
      `src/app/ui/previews/preview-manifest.ts` — **narrowed as T033 was**, and for the same
      reason: the three US2 surfaces are fed presenter view models carrying package figures. The row
      shape all three choosers share is registered as `choice-list`, whose `disabled` state is a
      recipe another slot holds, marked and refused; the regions themselves are swept as the bench
      in `e2e/equipment-accessibility.spec.ts`
- [x] T047 [US2] Add the `MATERIALS` tab to the compact layout in
      `src/app/features/equipment/equipment-bench.page.html` and `.spec.ts`
- [x] T048 [US2] Run the US2 journeys green across the ten projects and extend the axe sweep in
      `e2e/accessibility/` to the chooser and the materials region

**Checkpoint**: US1 and US2 both work independently.

---

## Phase 5: User Story 3 - Keep a loadout and come back to it (Priority: P3)

**Goal**: name, save, reopen and delete a loadout, in the one library that holds ship builds.

**Independent Test**: save several named loadouts, reload the application, and confirm each reopens
with the suit, grade, weapons, grades and modifications it was saved with.

### Tests for User Story 3

- [x] T049 [P] [US3] Write the US3 journey in `e2e/equipment-library.spec.ts` — save, reload, open
      from `/builds`, and delete
- [x] T050 [P] [US3] Write the migration and refusal cases in
      `src/app/domain/records/local-record.spec.ts`: a version 1 record opens as a ship build, and a
      loadout this version cannot rebuild is reported unopenable and left byte-for-byte alone

### Implementation for User Story 3

- [x] T051 [US3] Create the shared envelope in `src/app/domain/records/local-record.ts` and
      `.spec.ts` — version 2, the `tool` discriminator, and the fields both tools share
      ([contracts/loadout-persistence.md](./contracts/loadout-persistence.md))
- [x] T052 [US3] Move the ship variant onto it in `src/app/domain/ships/build/stored-build.ts`,
      `stored-build.parser.ts`, `stored-build.serializer.ts` and their `.spec.ts` files, leaving
      behaviour unchanged
- [x] T053 [US3] Migrate version 1 to version 2 on open — never on enumeration — in
      `src/app/domain/ships/build/record-migrations.ts` and `record-migrations.spec.ts`, stamping
      `tool: 'ship'` where the field is absent
- [x] T054 [US3] Create the equipment variant in
      `src/app/domain/equipment/loadout/stored-loadout.serializer.ts` and `.spec.ts`, built field by
      field so no stated figure or catalogue fact can reach storage
- [x] T055 [US3] Read the discriminator when listing in
      `src/app/application/build-library/build-library.store.ts` and
      `src/app/application/build-library/record-open.service.ts`, so a row is summarised without
      reconstructing a loadout
- [x] T056 [US3] Give a saved row its tool identity in
      `src/app/ui/components/saved-build-card/` — a hull for one tool, a suit for the other — with
      its preview states in `src/app/ui/previews/preview-manifest.ts`
- [x] T057 [US3] Wire naming, saving and the overwrite-or-keep-both question into
      `src/app/features/equipment/equipment-bench.page.ts` and `.spec.ts` through the existing
      `src/app/application/build-library/save-conflict.service.ts` (FR-016, FR-017)
- [x] T058 [US3] Run `e2e/equipment-library.spec.ts` green across the ten projects

**Checkpoint**: loadouts persist beside builds in one library.

---

## Phase 6: User Story 4 - Hand a loadout to someone else (Priority: P4)

**Goal**: export the open loadout as a link, a structured payload and a readable summary.

**Independent Test**: export a loadout by each offered means, and confirm the link reopens the same
loadout and the readable summary names every fitted item.

### Tests for User Story 4

- [x] T059 [P] [US4] Write the US4 journey in `e2e/equipment-link.spec.ts` — copy the link, open it,
      and confirm the loadout is restored including its held content
- [x] T060 [P] [US4] Write the refusal case in `e2e/equipment-link.spec.ts`: a link naming an
      unresolvable recipe says what failed, names the mount in words, and leaves the open loadout
      untouched

### Implementation for User Story 4

- [x] T061 [US4] Create `src/app/application/equipment/loadout-link.coordinator.ts` and `.spec.ts` —
      fragment in and out on feature 001's `src/app/application/build-link/fragment-publisher.ts`,
      refusing atomically before activation
- [x] T062 [US4] Add the equipment payload allowlist to
      `src/app/application/build-link/link-payload.allowlist.ts` and its `.spec.ts`, so nothing but
      chosen identities can enter a fragment
- [x] T063 [US4] Select refusal wording by the codec that refused in
      `src/app/application/build-link/link-error.mapper.ts` and `.spec.ts`, and add the
      equipment-worded `link.error.*` entries to `src/app/i18n/locales/en.json` and `de.json`
      ([contracts/equipment-loadout-link.md](./contracts/equipment-loadout-link.md))
- [x] T064 [US4] Name the mount a refusal is about through `getPersonalMountName` in
      `src/app/features/equipment/equipment-bench.page.ts` and `.spec.ts` — `PrimaryWeapon1` never
      reaches a screen (FR-021)
- [x] T065 [US4] Build the export layer in
      `src/app/features/equipment/export-loadout-layer/export-loadout.dialog.ts`, `.html`, `.scss`
      and `.spec.ts` — share link, loadout JSON and plain text, composed from
      `src/app/ui/components/share-link-panel`
- [x] T066 [US4] Write the readable summary in
      `src/app/application/equipment/loadout-summary.ts` and `.spec.ts` — the suit and its grade,
      each weapon with its grade, and each fitted modification, every name localised
- [x] T067 [US4] Run `e2e/equipment-link.spec.ts` green across the ten projects and add the axe
      sweep for the export layer in `e2e/accessibility/`

**Checkpoint**: all four stories work independently.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T068 [P] Record envelope version 2 and the `tool` discriminator in
      `docs/persistence-and-links.md`
- [x] T069 [P] Update the Status section of `docs/equipment-link-codec.md` — the codec has a
      consumer, and table 1's overwrite rule ends at the first published link
- [x] T070 [P] Add `scripts/policy/equipment-ownership.mjs` and its `.test.mjs`, asserting that no
      file outside `src/app/domain/equipment/readings/` states an equipment figure, and register it
      in the `policy` script in `package.json`
- [x] T071 [P] Add the German strings for every `equipment.*` key to
      `src/app/i18n/locales/de.json`
- [x] T072 Confirm no horizontal page scrolling at any supported viewport in
      `e2e/reflow.spec.ts` and `e2e/responsive.spec.ts` for the bench
- [x] T073 Confirm the bench works offline after first load in `e2e/offline.spec.ts` and
      `e2e/offline-privacy.spec.ts`, and that it makes no outbound request (FR-026, SC-006)
- [x] T074 Add the bench's surfaces to `e2e/coverage-ledger.ts`
- [x] T075 [P] Confirm text expansion and RTL survive the bench layout in
      `e2e/expansion-rtl.spec.ts`
- [x] T076 [P] Confirm reduced motion is respected in `e2e/reduced-motion.spec.ts`
- [x] T077 Record the manual screen-reader protocol in
      `specs/013-equipment-builder/design/screen-reader-record.md`
- [x] T078 Walk every scenario in [quickstart.md](./quickstart.md) against a running build
- [x] T079 Run `pnpm run check` green — format, typecheck, build, unit coverage at the 80% floor,
      the policy scripts, and the full ten-project Playwright matrix

---

## Phase 8: Answering the review (2026-09-04)

Six findings from the first pass over the built bench, and one from CI. Each is recorded here
because each changed shipped behaviour rather than only the bench's own files.

- [x] T080 Give every control a pointer cursor. The ledger's rows and every `choice` declare it —
      not the shared `layout.selectable-row`, whose other callers are an `<li>` and a `<div>`
      wrapping a button. The rename control keeps `cursor: text`, which all three canvases set on
      it
- [x] T081 Name the engineers on a fitted modification slot, not only on the rows the picker offers
      (FR-010, revised)
- [x] T082 Mark the open tool on the first paint. The shell seeded its path from `Router.url`,
      which is `/` until the first navigation finishes, so a direct load of `/equipment` drew
      `Equipment Builder` as a link to the page a Commander was already on
- [x] T083 Take the address off the saved builds. The library is a layer over the screen a
      Commander is on and nothing else: the `/builds` route, its sitemap entry, its published
      document and the shell's primary-navigation row are all gone, and the control that raises it
      is a shell action beside `IMPORT BUILD`
- [x] T084 Hold the export layer to one height across its three formats. The payload asked for
      fourteen rows against a floor sized for twelve, so choosing `Share link` moved the panel
      under the hand that chose
- [x] T085 Split the resistances into the canvas's two blocks, `ARMOUR` over `SHIELDS`, both read
      from the one set the library publishes on the suit's grade, and pair the item grid's cells
      `ARMOUR · KINETIC` / `SHIELD · KINETIC` as the canvas pairs them. Neither block states a
      figure the package does not publish (FR-006, revised)
- [x] T086 Widen the CI shard axis from ten to sixteen and lift the job cap to 30 minutes. A shard
      is a slice of the test count and not of the time: the equipment suite pushed the
      firefox-heavy shards to 24 minutes against the quickest shard's 13, and the slowest was
      cancelled on the 25-minute cap with the rest of the run green

## Phase 9: The second 2026-09-04 canvas revision, and the reviews of it (2026-09-04)

The canvas was refined again, and a design pass and an implementation pass over the result each
returned findings. Everything below changed shipped behaviour.

- [x] T087 Follow the revision through the item column: the swap block above the figures and
      renamed, the fitted item listed among the alternatives and marked, the gate's suits drawn as
      the swap block's rows, the picker filtering out a recipe another slot holds, `SHIELD` for
      `SP`, the mount counts onto the swap row's code line, and the `WEAPON SLOTS` cell gone
- [x] T088 Order the item column compact as the revision orders it — the swap block opens the
      scrolling body, above the grade ladder — while wide keeps the ladder in the header row
- [x] T089 Fill the marked row. The canvas draws the fitted alternative on
      `rgba(255,140,26,.14)` behind its amber edge; only the edge had shipped, and a pointer took
      the row's own wash off it
- [x] T090 Refuse a weapon fitted to the mount it is already on. Listing the fitted weapon among
      the alternatives made its row a live control, and `fitWeapon` rebuilt the mount on empty
      slots — pressing the row a Commander already had discarded its four modifications
- [x] T091 Replace, rather than stack, the history entry the library layer raises. Opening a record
      from the layer left one back press that did nothing, once per visit
- [x] T092 Take the ship tool's name out of the shared help copy. The revision rewrote
      `help.purpose` and the completed-grades answer to name the application, because one help
      dialog now opens over both benches
- [x] T093 Sweep what the revision orphaned: the `unavailable` state and its marker across the
      shared list, its stylesheet and its preview contract, the `equipment.value.mounts` and
      `library.description` messages, two entries in the reviewed-identical register, and the
      comments that described the behaviour before any of it
- [x] T094 Reach the token layer from three stylesheets that named `--ednb-font-mono`, which is
      declared nowhere — the mono face fell back to the body face on the slot marks, the material
      figures and the candidate search
- [x] T095a Match the tool tabs on the address alone. `Router` reports `urlAfterRedirects`, which
      carries the query and the fragment, so `/equipment#e.…` and `/build#s.…` — every shared
      loadout and every shared build — marked no tool at all, on the one screen a Commander most
      often arrives at from outside (Commander request 2026-09-04)
- [x] T095 Cover what shipped untested: the fitted slot's engineers, the export layer's counted
      meta line, and the refused refit

## Phase 10: Two overrides and a package upgrade (2026-09-04)

- [x] T096 Draw no row for a mount the worn suit does not carry, in the ledger or in
      `FIREPOWER`, and fall the item column back to the suit when the mount it was on stops
      being carried. The weapon is retained and returns with a suit that carries the mount
      (FR-007 revised)
- [x] T097 Name no engineer anywhere. The package records them and no artboard draws one, so the
      picker row is the recipe's name alone and the fitted slot draws its status and nothing more
      (FR-010 reversed)
- [x] T098 Pin Almanac 0.2.10 and read both published resistance sets. `SuitGrade` now carries
      `armour*Resistance` and `Suit` carries `shield*Resistance`, so the `ARMOUR` block and the
      `SHIELDS` block each read their own rather than repeating one; Damage Resistance folds into
      the armour's four, which is where the package points it. Both codec tables were regenerated
      — the ship table came out byte-identical (`f9f977a6ebda…`) (FR-006 revised)
- [x] T099 Navigate before lowering the library layer. Closing it first uncovers a screen that is
      still live under the pointer the press left resting on it, and the shipyard writes its own
      address whenever a pointer rests on a hull row — that write landed after the navigation and
      stranded the Commander on `/ships/<hull>` with the build never opened. Only reachable since
      the library became a layer over the shipyard rather than its own route, and only visible on
      the static build CI serves, which is why a run against `ng serve` could not see it (CI
      firefox shards 9 and 10, 2026-09-04)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup. **Blocks every user story.**
- **US1 (Phase 3)**: depends on Phase 2 only.
- **US2 (Phase 4)**: depends on Phase 2; shares the item view with US1, so it follows US1 in
  practice rather than by rule.
- **US3 (Phase 5)**: depends on Phase 2 only. Independent of US2.
- **US4 (Phase 6)**: depends on Phase 2 only. Independent of US2 and US3.
- **Polish (Phase 7)**: depends on the stories being delivered.

### Inside Phase 2

T005 → T006 → T007 → T008 → T009 is a chain: the model, the generator, the table, the codec, its
proof. T010 documents the result. T011–T016 are independent of that chain and of each other.
T017 needs T013–T016. T018 needs T012. T019 and T020 need T018. T023 needs T013–T016 and T021.

### Inside each story

Tests first, then domain-facing components, then composition into the page, then the matrix run.

### Parallel Opportunities

- Phase 1: T001, T002 and T004 together.
- Phase 2: T011, T012, T013, T014, T015, T016 together, alongside the T005–T009 chain. T022 with any
  of them.
- Phase 3: T024 and T025 together; T026 and T033 alongside the region work.
- Phase 5 and Phase 6 can be built at the same time as Phase 4 by different people — none of the
  three touches the others' files, except that T057 and T065 both add a control to
  `equipment-bench.page.html`.
- Phase 7: T068, T069, T070, T071, T075 and T076 together.

---

## Parallel Example: Phase 2 readings

```bash
Task: "Create suit-readings.ts and .spec.ts in src/app/domain/equipment/readings/"
Task: "Create weapon-readings.ts and .spec.ts in src/app/domain/equipment/readings/"
Task: "Create tool-readings.ts and .spec.ts in src/app/domain/equipment/readings/"
Task: "Create material-requirement.ts and .spec.ts in src/app/domain/equipment/readings/"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1: Setup — the bench has an address and a name in the shell.
2. Phase 2: Foundational — **the critical path**, and the only phase that touches committed,
   passing code.
3. Phase 3: US1 — a Commander assembles a loadout and reads what it is worth.
4. **Stop and validate** against US1's independent test.

### Incremental Delivery

1. Setup + Foundational → the bench is computable.
2. - US1 → assembling and reading works. **MVP, demoable.**
3. - US2 → modifications and their cost.
4. - US3 → loadouts persist beside builds.
5. - US4 → loadouts can be handed to someone else.

Each increment stands on its own, and none breaks the one before it.

---

## Notes

- **T005–T009 are one landing.** They change committed, passing code, and the model change breaks
  the codec's contract the moment it is made. Do not split them across commits that are expected to
  be green.
- **Table 1 is regenerated in place**, which is sound only until the first link is published. That
  is why T007 comes before any task that can produce a link.
- Every figure a task states is a package call. A task that computes one locally is wrong, whatever
  it says here.
- Tool stats are published and deliberately not drawn: T015 and T029 read and render names and a
  count only.
- `[P]` means different files and no dependency on an incomplete task.
- Commit after each task or logical group; stop at any checkpoint to validate a story on its own.
