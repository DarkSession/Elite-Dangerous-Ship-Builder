---
description: 'Task list for Offence Profile'
---

# Tasks: Offence Profile

**Input**: Design documents from `/specs/007-offence-profile/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[design/canvas-contract.md](./design/canvas-contract.md), [data-model.md](./data-model.md),
[contracts/](./contracts/), [design/](./design/), [quickstart.md](./quickstart.md)

**Tests**: Test tasks are included. Every contract names its own required verification, the
specification gates delivery on SC-001–SC-004, and constitution principle VIII gates the build on
unit coverage, the ten-project Playwright matrix and automated accessibility scans.

> **Engine coverage on this branch, recorded 2026-08-24.** The five Firefox projects of that matrix
> could not be run in the environment this feature was built in. `playwright install firefox` is
> refused by its egress policy — `request blocked: no rule or allowlist entry allows host
"cdn.playwright.dev"` — and the same block applies to
> `playwright.download.prss.microsoft.com`, so no Firefox binary can be obtained there. Per
> `/root/.ccr/README.md` that is an organization policy decision to report rather than route
> around.
>
> **The requirement is unchanged and is not waived**, and it is not left to a volunteer either. The
> repository's own `ci.yml` installs both engines on every runner and shards the whole ten-project
> matrix across six of them, so this branch's Firefox evidence is its pull request's own `End-to-end
(shard 1..6)` checks. What is recorded here is only that the evidence produced _locally_ is
> Chromium-only across all five layout profiles, and that T034 and T043 rest on the CI run rather
> than on a local one.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested and
demonstrated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Every task names the exact file it changes

## Path Conventions

Single Angular workspace at the repository root: the framework-agnostic projection in
`src/app/domain/offence/`, surfaces in `src/app/features/build-workspace/outfitting/`, shared
primitives and previews in `src/app/ui/`, messages in `src/app/i18n/`, end-to-end suites in `e2e/`,
repository policy checks in `scripts/`. Unit tests live beside their source as `*.spec.ts`.

## Delivery gates

Feature 007 owns every weapon-output and weapons-capacitor semantic in the application, and every
figure it draws is a package field or a proportion of package fields stated beside it. Three gates
apply:

- **The canvas contract is the template.** `design/canvas-contract.md` records every drawn element,
  what it is built as, and what is not built. Anything user-facing that is not sanctioned there is a
  defect, and SC-004 is what the coverage ledger registers for it.
- **One projection.** `weaponMetrics()` and `weaponsCapacitorMetrics()` are asked exactly once each
  per projection, in `src/app/domain/offence/offence.ts`, and it is the one function both surfaces
  read — a pure one, so two reads of the same build return the same answer. `damageFalloff()` and the
  gunsight catalogue are asked over that result and nowhere else.
- **Prerequisites are all in the repository**: feature 001's active build, feature 002's slot views,
  engineering summary and `hardpointCoverage()`, feature 005's `PowerConditionsStore`,
  feature 010's mode strip, and feature 011's design system, localization, previews and harness. No
  task here waits on an unimplemented port, and none is consumed: no distributor power observation is
  built, because no canvas draws one.

---

## Phase 1: Setup

- [x] T001 Characterize the installed Almanac weapon and capacitor contract in
      `src/app/domain/offence/almanac-offence-contract.spec.ts` — `weaponMetrics()` returning
      `total` with exactly ten fields and `weapons` with exact `slot`, `symbol`, `name` and
      `enabled`, and the sparse `maximumRange`, `falloffRange` and `armourPiercing` left undefined
      rather than zero; `weaponsCapacitorMetrics({ weaponsPips })` returning six fields with
      `Infinity` for a sustaining load; `DamageSplit.unclassified` absent when zero; and package
      weapon ordering in the hull's own slot order
- [x] T002 [P] Create `src/app/domain/offence/` and the
      `src/app/features/build-workspace/outfitting/offence-analysis/` and
      `.../offence-summary/` directories per plan.md
- [x] T003 [P] Create `e2e/offence-profile.spec.ts` importing feature 011's axe helper and semantic
      assertions from `e2e/accessibility/`

---

## Phase 2: Foundational (blocking prerequisites)

> The `OffenceWeapon` and `Ammunition` types T004 to T008 name below, the ammunition state T005
> projects, and the `ships/ammunition` import T004 allows, were withdrawn in Phase 5b (T029f, T029g):
> no canvas draws an ammunition figure, so the subject joins the unread list and the subpath is
> deliberately off the policy allow-list. The tasks are left as they were executed; what stands is
> the phase that follows them.

- [x] T004 Define `Offence`, `OffenceWeapon`, `CollectionMeaning`, `Ammunition`, `Capacitor` and
      `Endurance` in `src/app/domain/offence/offence.ts` exactly as
      [data-model.md](./data-model.md) states them, importing the Almanac only through
      `ships/ship-loadout`, `ships/weapons`, `ships/weapons-capacitor`, `ships/ammunition` and
      `ships/modules`
- [x] T005 Implement `projectOffence(loadout, coverage, weaponsPips)` in the same file: one
      `weaponMetrics()` call retaining the returned object unchanged, one
      `weaponsCapacitorMetrics()` call with the allocation passed through unchanged, the collection
      meaning from the returned list and feature 002's coverage, the ammunition state per weapon, and
      the endurance meaning read off `timeToDrain` alone
- [x] T006 [P] Add `src/app/domain/offence/offence.fixtures.ts` covering enabled and all-disabled
      weapons, confirmed-empty and unavailable coverage, a genuine zero-damage weapon, unclassified
      present and absent, positive anti-xeno, every ammunition state, absent range and piercing,
      projectile boundary zero, and finite, immediate and infinite endurance with zero capacity
- [x] T007 Add `src/app/domain/offence/offence.spec.ts` asserting each package call happens at most
      once per projection, the retained result is identity-equal to the package's, the allocation
      reaches the package with no division, rounding or clamp, `netDrainRate` and the returned
      `weaponsPips` are never selected, ordering is preserved with no sort or merge, and every
      collection, ammunition and endurance state maps as the data model states
- [x] T008 [P] Add the feature-owned message keys to `src/app/i18n/locales/en.json` and `de.json` —
      the mode name, the region rule, the two block headings, the `BY TYPE` note, the mounted count,
      the burst and sustained labels, the four column heads, the damage-type names, the anti-xeno
      overlay sentence, the no-unclassified meaning, the capacitor labels and units, the three
      endurance meanings, the allocation condition, the ammunition meanings, the not-stated text, the
      coverage and empty statements, the details and slot action names, and the rail cell label
- [x] T009 [P] Add `scripts/policy/offence-ownership.mjs` and register it in `package.json`'s
      `policy` script — the Almanac is reached only through this capability's five leaf subpaths,
      `weaponMetrics(` and `weaponsCapacitorMetrics(` appear nowhere outside
      `src/app/domain/offence`, no package figure is arithmetically combined anywhere the projection
      is read, and `netDrainRate`, `weaponsPips`, `energyPerSecond`, `sustainedEnergyPerSecond`,
      `heatPerSecond`, `sustainedHeatPerSecond`, `thermalLoad` and `powerDraw` are never read off a
      total
- [x] T010 Add `scripts/offence-ownership.test.mjs` proving each rule fires on a planted violation
      and passes on the shipped source. Beside the other suites rather than next to the script it
      exercises: `package.json`'s `test:scripts` is `node --test scripts/*.test.mjs`, a
      non-recursive glob, so a suite under `scripts/policy/` would never be run

---

## Phase 3: User Story 1 — Read build damage (Priority: P1) 🎯 MVP

**Goal**: `OFFENCE` opens, the region retitles, and the build's damage totals and damage types are on
the screen with the rail's `DPS` cell beside them.

### Tests for User Story 1

- [x] T011 [P] [US1] Add weapon-totals and damage-type tests to
      `.../offence-analysis/offence-analysis.spec.ts` — burst and sustained damage per second as
      separately labelled values, the returned weapon count, both complete damage-type groups with
      exact kinetic, thermal, explosive, absolute and anti-xeno amounts, unclassified shown when
      present and stated as no unclassified damage when absent, the anti-xeno overlay named, and no
      percentage, share or combined total anywhere in the rendered output
- [x] T012 [P] [US1] Add mode tests to `.../hull-anatomy/hull-anatomy.spec.ts` — the `OFFENCE`
      segment is enabled, selecting it retitles the region `OFFENCE ANALYSIS` and removes the plates,
      the side selector and the legend, and leaving it restores them
- [x] T013 [P] [US1] Add rail tests to `.../offence-summary/offence-summary.spec.ts` — the cell
      carries sustained damage per second identity-equal to the panel's, it draws nothing without a
      build, it holds no control, and unavailable coverage qualifies it once while an exact zero does
      not
- [x] T014 [P] [US1] Add the build-damage journey to `e2e/offence-profile.spec.ts` — no build,
      a populated build compared field-for-field against the live package result after locale-aware
      parsing, an all-disabled build, and a confirmed-empty build

### Implementation for User Story 1

- [x] T015 [US1] Implement `OffenceAnalysis` in
      `.../offence-analysis/offence-analysis.{ts,html,scss}` — the canvas's two blocks in its
      `1fr 1fr` pair, stacking from the space the region is given; the `WEAPONS` header with the
      returned count; the burst and sustained headline; and the `DAMAGE PROFILE` block's two
      damage-type groups
- [x] T016 [US1] Enable the `OFFENCE` segment in
      `.../hull-anatomy/hull-anatomy.{ts,html}` and rename the region's rule to
      `OFFENCE ANALYSIS`, hiding the plates, the side selector and the legend exactly as `POWER`
      does
- [x] T017 [US1] Implement `OffenceSummary` in
      `.../offence-summary/offence-summary.{ts,html,scss}` and compose it into the status rail in
      `.../outfitting-workspace/outfitting-workspace.html`, between feature 005's `POWER` line and
      feature 009's cost block, where canvas 1c draws the six metric cells
- [x] T018 [P] [US1] **Not applicable, and recorded rather than skipped.** The preview manifest
      declares the components exported from `src/app/ui/components`, which is the scope
      `scripts/check-interface-foundations.mjs` enforces. `OffenceAnalysis` and `OffenceSummary`
      are feature surfaces that compose those components, exactly as feature 005's `PowerThermals`
      and `PowerSummary` are, and neither of those carries a declaration either. The states this
      task lists are covered where feature 005 covers its own: the component suites in
      `.../offence-analysis/offence-analysis.spec.ts` and `.../offence-summary/offence-summary.spec.ts`,
      and the ledger entries in `e2e/coverage-ledger.ts`. This feature adds no new
      `src/app/ui/components` component, so it adds no preview declaration. Recorded at the head of
      `design/component-state-preview-matrix.md`, which opened by requiring the opposite
- [x] T019 [US1] Add the US1 surfaces, the FR-001, FR-002, FR-003, FR-005 and SC-004 ids, the rail
      contribution, journeys and axe flags to `e2e/coverage-ledger.ts`, and add
      `007-offence-profile` to `COVERED_FEATURES`

**Checkpoint**: the mode opens, the totals and types are correct, and the rail carries `DPS`.

---

## Phase 4: User Story 2 — Inspect weapons (Priority: P1)

**Goal**: every returned weapon is a row with the canvas's four columns.

> The disclosure and the slot action T022, T024, T026 and T027 name below were withdrawn in Phase 5b.
> The tasks are left as they were executed; what stands is the phase that follows them.

### Tests for User Story 2

- [x] T020 [P] [US2] Add weapon-row tests to `.../offence-analysis/offence-analysis.spec.ts` —
      localized game text with disclosed canonical fallback and an unavailable state, the engineering
      line, damage per second, piercing and falloff with field-specific not-stated text when absent,
      and every remaining returned field inside the expanded region
- [x] T021 [P] [US2] Add collection tests — one row per returned weapon in exact package order with
      no sort, no duplicate-symbol merge and no positional identity; disabled rows present with their
      own metrics; and the coverage qualification drawn without altering the returned collection
- [x] T022 [P] [US2] Add slot-action tests asserting the exact returned key is passed to
      `OutfittingStore.select` once, that duplicate symbols in distinct slots select distinct slots,
      that the action works for a disabled weapon, and that activating the row itself does nothing
- [x] T023 [P] [US2] Extend `e2e/offence-profile.spec.ts` with the weapon-inspection journey —
      expanding and collapsing several rows, duplicate symbols in distinct slots, every ammunition
      state, and opening an exact slot from a row

### Implementation for User Story 2

- [x] T024 [US2] Implement the weapon row and collection inside
      `.../offence-analysis/offence-analysis.{ts,html,scss}` — the canvas's four columns as the
      summary, a row-owned `edsb-disclosure` carrying every remaining returned field, and one
      exact-slot action, both at feature 011's target size
- [x] T025 [US2] Reuse feature 002's engineering summary for the line under the module name rather
      than composing a second one
- [x] T026 [P] [US2] **Not applicable, and recorded rather than skipped.** The reason is T018's:
      the preview manifest declares the components exported from `src/app/ui/components`, and the
      weapon row is not one — it is markup `OffenceAnalysis` composes from `edsb-metric-group`,
      `edsb-disclosure`, `edsb-game-text` and `edsb-action-button`, each of which already carries
      its own declaration. Every collapsed and expanded row state this task lists is asserted in
      `.../offence-analysis/offence-analysis.spec.ts` against fixtures built from live installed
      Almanac results, and exercised at the five layout profiles through
      `e2e/offence-profile.spec.ts` and the ledger entries in `e2e/coverage-ledger.ts`
- [x] T027 [US2] Add the US2 surfaces and the FR-002, FR-004 and FR-005 ids with their exact-slot,
      package-order, optional-absence and ammunition assertions to `e2e/coverage-ledger.ts`

**Checkpoint**: every returned weapon is complete and reaches its slot.

---

## Phase 5: User Story 3 — Read firing endurance (Priority: P2)

**Goal**: the `WEAPON CAPACITOR` block's four fields, at the allocation they were read under.

### Tests for User Story 3

- [x] T028 [P] [US3] Add capacitor tests to `.../offence-analysis/offence-analysis.spec.ts` — the
      four fields as labelled text in package units at every width, the allocation named as the
      condition, the three endurance meanings each read off `timeToDrain` alone, `Infinity` never
      reaching a formatter, and zero capacity stated with no cause
- [x] T029 [P] [US3] Extend `e2e/offence-profile.spec.ts` with the endurance journey — changing WEP
      pips in the `POWER` mode and reading the changed recharge and time to drain in `OFFENCE`, with
      the capacitor result unchanged by the dashboard's hardpoint state

### Implementation for User Story 3

- [x] T030 [US3] Implement the `WEAPON CAPACITOR` block inside
      `.../offence-analysis/offence-analysis.{ts,html,scss}` — capacity, recharge, sustained draw
      and time to drain under the `DAMAGE PROFILE` split, with the allocation stated once beneath
      them. **Amended by the rebuild.** The block was first built as one `edsb-metric-group`, which
      canvas 1c does not draw here: it draws three label-bar-figure rows on an 11px track, and the
      allocation as one line under the block rather than repeated against each value. The rows are
      the panel's own construction for that reason, and only the two rows the canvas gives a length
      carry a fill — capacity in megajoules and a duration in seconds measure nothing on this scale
      (`design/canvas-contract.md`, review note 6)
- [x] T031 [P] [US3] **Not applicable, and recorded rather than skipped.** The reason is T018's and
      T026's, now recorded at the head of `design/component-state-preview-matrix.md`: the manifest
      declares the components exported from `src/app/ui/components`, and the capacitor block adds no
      component there — it is markup inside this feature's own panel. A finite drain, an immediate
      drain, a recharge that keeps pace and a zero capacity are covered in
      `.../offence-analysis/offence-analysis.spec.ts` against live installed package results, and
      in the `build/offence-analysis-capacitor` ledger entry
- [x] T032 [US3] Add the US3 surfaces and the FR-006 and FR-007 ids with their allocation-boundary,
      four-field, endurance-meaning and zero-capacity assertions to `e2e/coverage-ledger.ts`

**Checkpoint**: endurance reads correctly at every allocation.

---

## Phase 5b: Rebuild to the canvas

**Goal**: the panel is canvas 1c, not a third of it.

Recorded after the fact. The panel shipped at the end of Phase 5 carried the weapon table, two
totals, the damage-type groups and the capacitor list — and had grown a row disclosure and a per-row
action no canvas draws. The stacked damage bar, the whole `DPS BY RANGE BAND` region and the whole
`SHOT CONVERGENCE` block were absent, excluded by a scope line in `spec.md` that claimed the package
returns nothing for damage-at-range or convergence. It returns both.

- [x] T029a Extend the projection in `src/app/domain/offence/offence.ts` — `projectDamageSegments()`
      over the conventional members of `damageByType`, and `projectRangeBands()` applying
      `damageFalloff()` to every enabled weapon at the canvas's four distances
- [x] T029b Add `src/app/domain/offence/convergence.ts` — `projectConvergence()` over
      `getShipGunsight()` and `enumerateSlots()`, and `convergenceAt()` over `projectGunsight()`,
      with the canvas's own field of view, plate aspect and range bounds
- [x] T029c Add `edsb-range-field` to `src/app/ui/components/range-field/` — a native range input
      with an `aria-valuetext` in words, an `<output>` readout and optional scale ends — and declare
      its states in `src/app/ui/previews/preview-manifest.ts`
- [x] T029d Add the damage-type and mount surfaces to `src/styles/tokens/_semantic.scss`
- [x] T029e Rebuild `.../offence-analysis/offence-analysis.{ts,html,scss}` to the canvas's three
      blocks — the stacked bar and its legend, the four range bands, the capacitor bars, and the
      full-width convergence block with its plate, its shot sentences, its range field and its four
      facts
- [x] T029f Withdraw the row disclosure and the per-row slot action, and the thirty message keys the
      disclosure and its ammunition rows used
- [x] T029g Withdraw the `Ammunition` projection: no canvas draws an ammunition figure, so the field
      joins the unread list rather than being projected into a state nothing displays
- [x] T029h Restore `offence.damage.note` to the canvas's own `BY TYPE AND RANGE`, which an earlier
      revision had trimmed to `BY TYPE` because the range half was out of scope
- [x] T029i Extend `scripts/policy/offence-ownership.mjs` with the gunsight, ship and slot subpaths
      and the three added package calls
- [x] T029j Rewrite `spec.md`, `data-model.md`, both design documents, the three contracts,
      `plan.md`, `research.md`, `quickstart.md` and this file to the built scope, recording the false
      premise rather than deleting it
- [x] T029k Register FR-008 to FR-011 and the convergence surface in `e2e/coverage-ledger.ts`

**Checkpoint**: the panel draws every region canvas 1c draws, and nothing it does not.

---

## Phase 5c: Correct the rebuild against the drawing

**Goal**: the panel is canvas 1c at the measures and in the arrangements canvas 1c draws it, not
merely with the same regions present.

Recorded after the fact, from a read of the rendered panel against the artboard. Phase 5b put every
region on the screen; nine things about how they were drawn did not match the canvas, and four of
them were defects rather than differences of taste.

- [x] T029l Add the offence measures to `src/styles/tokens/_primitives.scss` and `_semantic.scss` —
      the 22px damage bar, the 104px/62px bar-row floors, the weapon figure floor, the `16 / 6`
      gunsight box, and the 11px shot dot and 20px mount badge. The stacked bar had been drawn at
      `--edsb-layout-bar-height`, which is the **66px command bar** and never this measure
- [x] T029m Set the headline on one line — `display: flex; align-items: baseline`, as the canvas
      sets it — instead of stacking the figure over the line that names it
- [x] T029n Give the bar rows one grid per list with `subgrid` on each row, so the label, the track
      and the figure line up down the block. Each row had declared the same track list separately,
      and `auto` resolved differently per row: four figures drawn one above the other that could not
      be read against each other
- [x] T029o Move the weapon table's grid inside `.weapons` and promote it at 18rem. The grid had been
      declared on the container element itself, which cannot answer its own container query, so the
      table never appeared at any width; and 22rem was past what the block is given at a 1440px
      desktop even once it could
- [x] T029p Draw `.offence__rule` as the canvas's plain 1px band. `section-rule` is the _labelled_
      rule, and its flex box collapses on a bare `hr` — which rendered as a full stop
- [x] T029q Draw the plate as the canvas draws it: the shot as an 11px dot where it lands, the
      numbered badge parked at the plate's nearer edge, and a leader between the two. The badge had
      been drawn on the shot, which is unreadable exactly when a build converges well
- [x] T029r ~~Draw the hull's unfilled hardpoints, from the offsets the gunsight already publishes
      for them, in their own hollow mark with their own sentence (FR-012)~~ — **reverted
      2026-08-24.** `wireConvergence` carries hardpoints 1, 2, 3, 4 and 6 and the same sample
      build's hull-anatomy plate marks hardpoint 5 `data-kind="empty"`, so the canvas does face an
      unfilled hardpoint and draws nothing for it. The marks and their sentences were an invention;
      both are removed and FR-012 is withdrawn (`design/canvas-contract.md`, review note 8)
- [x] T029s Set the four convergence facts as the canvas's `repeat(4, 1fr)` cell row rather than a
      stacked metric list, and give the range field the canvas's flat 22px band and upright knob
      rather than the platform's groove and disc
- [x] T029t Split `SHOT CONVERGENCE` into `.../offence-analysis/shot-convergence/` — the plate, the
      shot sentences, the range field and the four facts, with the target range as its own component
      state. The panel had grown to carry three blocks in one stylesheet and broke the build's 10 kB
      per-component style budget; the block is its own block, and the range the plate is drawn at is
      state the two blocks above have no part in
- [x] T029u Withdraw the two enumerated damage-type lists, and with them `antiXeno` and
      `sustainedDamageByType`. No canvas draws any of it; the stacked bar's legend is the whole
      damage-by-type reading (`design/canvas-contract.md`, review note 7)

**Checkpoint**: the panel matches the artboard region by region and measure by measure.

---

## Phase 5d: The review rounds

**Goal**: every remaining difference between the built screen and the drawing, and every claim in
these documents that the built screen had outgrown.

Recorded after the fact, from the mandated pre-PR reviews and one further read of the artboard.
T029r above belongs to this phase and is left where it was written.

- [x] T029v Draw `∞` for a recharge that keeps pace, with what it stands for beside it in a
      `visually-hidden` span. The row had carried the sentence itself, where the canvas sets a
      figure; the glyph is the figure and the sentence is what a screen reader gets, which is the
      pattern `defence.damage.unbounded` and `power.heat.does-not-settle` already set
- [x] T029w Add `--edsb-measure-offence-bar` at 11px and draw the four range bands and the three
      capacitor rows on it. They had been drawn on the 9px power-measure bar; the canvas sets all
      seven of those tracks at 11px
- [x] T029x Move the capacitor's two fills into `projectCapacitor()` as `drawFill` and `rechargeFill`.
      The panel had divided the two package amounts itself, which is the one arithmetic only the
      projection is allowed to do, and the policy script could not see it because the division was
      spread over a `Math.max` and a ternary
- [x] T029y Compose the rail's `DPS` cell as `edsb-metric-group`. It had been a bespoke
      label-and-figure row; canvas 1c draws all six rail cells as a tracked micro label stacked over
      a mono figure on a hairline ground, which is what that component already draws and what
      feature 006 composes two cells to the left (constitution VII)
- [x] T029z Simplify the convergence types to what the canvas draws — no nullable mount, no unread
      `enabled` flag — and collapse the policy script's scanning helpers so the functions the suite
      exercises are the functions the rules call

- [x] T029aa Declare `.visually-hidden` in `.../offence-analysis/offence-analysis.scss`. T029v added
      the span and not the rule that hides it, and no rule existed to inherit — the class is declared
      per component in this repository, and both sibling analysis panels declare their own. The
      sentence beside `∞` was rendering **in plain view**, which is user-facing text no canvas draws.
      Asserted by its rendered box rather than its text, because `toHaveText` reads `textContent` and
      passes either way
- [x] T029ab Set every damage rate bare. Five figures had been suffixed `/s` — the headline, the
      sustained sub-line, each legend amount, each range band and each weapon row's DPS — and no
      canvas suffixes one: canvas 1c draws `248.6`, `186.4 SUSTAINED`, `KINETIC 165.8 · 67%` and the
      three band figures, and the whole design file contains no `/s` on any figure. It also said per
      second twice, under heads that already read `DPS`. `offence.format.per-second` is withdrawn
- [x] T029ac Name the ring caption as the canvas names it. `wireConvergence` sets
      `'RING 2 · … MRAD · … m AT THIS RANGE'`; the caption had read `Outer ring`, which describes the
      ring rather than naming it
- [x] T029ad Narrow both surfaces' condition read from `conditions()` to `pips()`, as feature 006
      does, and correct the six documents that claimed one shared projection where there are two
      `computed`s over one pure function. The reading cannot differ either way, but for the reason a
      pure function gives, not the one a shared reference would
- [x] T029ae Prove the states four documents promised and nothing exercised: a weapon whose damage is
      a genuine zero (`Hpt_ATVentDisruptorPylon_Fixed_Medium`, already fitted by `everyStateBuild()`),
      and the WEP allocation changing with the network gone

- [x] T029af Withdraw the `At {{range}}` line under `APPARENT SPREAD`. The canvas draws each of the
      four cells as exactly two lines — a label over `33 mrad`, and `wireConvergence` writes only
      that figure into it — so a third visible line was a fourth added element on a contract that
      lists three and closes "Nothing else is added". Nothing is lost: the range field's own readout
      sits directly above the cells. `FactView.condition` goes with it
- [x] T029ag Restore the `·` the canvas puts after `RING 2`. T029ac had taken the canvas's name for
      the ring and left its separator behind, so two figures abutted with no punctuation
- [x] T029ah Name the defence branch in `hull-anatomy.html` instead of leaving it the final `@else`.
      A mode added to the strip would have fallen through and drawn feature 006's panel under
      somebody else's heading — the opposite of what the comment beside `isDashboard` promises — and
      `isDefence` was dead in the meantime
- [x] T029ai Drop two classes and one `data-slot` attribute nothing reads, the last of them a
      leftover of the withdrawn per-row slot action, and correct three test names that claimed more
      than their assertions: the rail's exact zero now reads the zero, the freeze test says that the
      freeze is shallow and why, and the leaf-subpath test proves the scanner reads a specifier back
      character for character rather than that a list contains its own members
- [x] T029aj Stop the micro-label mixin uppercasing two labels that carry a formatted figure rather
      than a word. `micro-label` sets `text-transform: uppercase`, so the four range bands printed
      `500 M`, `1,200 M`, `1,800 M` and `3,000 M`, and the ring caption printed `10.0 M` — `M` being
      the mega prefix, a different unit from the metre the figure is in. The canvas draws `500 m` in
      mono with `letter-spacing: 0.06em` and no transform, and keeps the metre lowercase inside the
      ring caption for the same reason. Set `text-transform: none` on `.bar__label` and
      `.plate__caption--trail`, and give `.range__scale` the metric face its two figures were
      already being set in everywhere else. Nothing caught this because `toHaveText` and
      `textContent` are both blind to `text-transform`, so the new e2e test reads
      `getComputedStyle(node).textTransform` and applies it before matching
- [x] T029ak Scope that override to the labels that actually carry a figure. Put on `.bar__label`
      itself it also reached the capacitor rows, which label themselves with words: `DRAW`,
      `RECHARGE`, `FULL FIRE` and `CAPACITY` came out sentence case beside `LATERAL SPAN` and
      `DPS BY RANGE BAND`, which the canvas draws uppercase in the same 9px mono at the same
      `0.06em` (design L15079, L15126, L15173). A second e2e case reads the capacitor labels' own
      computed transform and holds them to the case the canvas draws, which is the half of the rule
      the first case could not see: those labels carry no digit
- [x] T029al Say what the ring caption actually does. The canvas writes it uppercase apart from the
      metre symbol (`wireConvergence`, design L28748); `text-transform` is all-or-nothing over a text
      node, and the caption is one translated sentence whose parts move between languages, so the mix
      is not reproduced and the whole caption is set in sentence case. Review note 15 records that as
      a deliberate departure and why the alternative — a caption reading `10.0 M` — is worse, and the
      stylesheet's own comment says the same thing where it is done
- [x] T029am Prove the three verification obligations that were asserted and untested: the mode and
      the target-range field reach no fragment, no history entry and no storage key (one e2e case
      modelled on feature 005's), and moving the range re-projects without asking the package either
      of its two answers again. The third obligation is reworded to what is provable: the hull's
      gunsight is read inside the projection, so a projection that does not re-run does not re-read
      it, and `projectGunsight` over offsets already in hand is what the control is for
- [x] T029an Correct two documents that described a screen this branch does not build: `spec.md`'s
      Story 3 said a sustaining build "is described as firing indefinitely", which is exactly the
      claim `offence.ts` refuses to make — the recharge keeping pace is a fact about the capacitor,
      not about ammunition this screen never reads — and a token comment counted seven bar tracks
      where the panel draws six, `CAPACITY` and `FULL FIRE` having lost theirs to review note 6
- [x] T029ao Draw the whole code line the canvas puts under every weapon name. The row had been
      hand-set as a name plus an engineering line, so it drew `Overcharged G5` where the canvas draws
      `4A GIMBALLED · OVERCHARGED G5 · CORROSIVE` (design L14450, L14521, L14592, L14734) and drew
      nothing at all under an unengineered weapon, where the canvas still draws `3E FIXED · STOCK`
      (L14663). Compose `edsb-module-identity-badge` instead — feature 002's own component for this
      exact line, fed the module's class, rating and mount as three package values — so a weapon reads
      the same way here as in the mount it came from, rather than being re-set (constitution VII)
- [x] T029ap Join the code to the mount with a space in that badge. It joined every part with `·`,
      so composing it drew `1F · FIXED`. The canvas never puts a dot between a class code and a mount
      — `3E FIXED`, `4A GIMBALLED`, `3D GIMBALLED` — and takes the dot only for what follows it, as in
      `8A · CHARGE ENHANCED G5` on a module that has no mount. A shared component, so this corrects
      the ledger and the manifest toward the drawing at the same time; one assertion moved with it
- [x] T029aq Draw `HP 6 · 9.8 m` in the widest-mount cell rather than `Hardpoint 6 · 9.8 m`.
      `wireConvergence` writes `'HP ' + widest.n + ' · ' + …` (design L28758) and both canvases draw
      the abbreviation (L15529, L24748); the expansion was a wording this application chose, which is
      what review note 12 already corrected once for `RING 2`. `HP` is a code like `4A` and is
      identical in German, and the parity rationale now says that rather than claiming a loanword
- [x] T029ar Scope an e2e assertion that could not fail. `toContainText('3')` over the whole
      capacitor block was satisfied by `DRAW`'s own `2.31 MJ/s` at every allocation, so it stayed true
      with the allocation line deleted outright — the same failure mode T029ai found in the
      convergence suite. It now reads `.bars__condition` and matches the message
- [x] T029as Draw the weapon name at this canvas's scale rather than the ledger's. Composing the
      badge brought its `500 13px` with it, and canvas 1c sets a weapon row's name `400 10.5px`
      (design L14427 against the ledger's L6871): here the name is one of four columns, not the row's
      subject. A `compact` input on the badge rather than a property a neighbour reaches in and sets
      — the two scales the drawing uses stay the only two anything can ask for, and the interface
      foundations policy forbids declaring a custom property outside the token layer for exactly the
      reason that would have been. The code line needs nothing: the canvas draws it 9px on one and
      8px on the other, and the `micro` step already covers that 7.5–9.5 band
- [x] T029at Retire the dimming the badge made dead. `.weapon--off .weapon__module` had tinted the
      row through inheritance; the badge sets its own two inks, so the rule stopped reaching anything
      the moment it was composed, and emulated encapsulation means the panel could not restore it
      from outside. Deleted rather than restored: no canvas draws a switched-off weapon at all, so an
      ink for one would be this application's choice. The state stays a word, which is what carries
      it. The row's `weapon--off` class went with the rule, nothing else reading it
- [x] T029au Correct five documents and two comments that still described the old second line — the
      preview matrix's list of composed primitives, the contract's "What is built" row, the design
      note, the quickstart, and the contract's own extraction of the canvas, which called a code line
      an engineering line. That reading is what made an earlier revision draw only the last part of
      it and nothing at all where there was no recipe, so it is corrected where it was written

**Checkpoint**: no review finding is outstanding, and no document claims a screen this branch does
not draw.

---

## Phase 6: Polish & cross-cutting concerns

- [x] T033 Implement the responsive composition — the canvas's fluid pair with convergence full-width
      beneath at roomy widths, and one stack at narrow widths, landscape phones, 200% text and 400%
      zoom, chosen from available space rather than a device name, with no document-level horizontal
      scroll
- [x] T034 [P] Run the complete capability in Chromium and Firefox at all five layout profiles with
      an axe scan over every state
- [x] T035 [P] Assert 200% text, actual 400% browser zoom, expanded translations, long canonical
      module names and RTL layout with no lost content or value association
- [x] T036 [P] Assert touch and keyboard operation and shared target-size tokens for the target-range
      field and every mode segment, with no overlap, and that no weapon row carries a control —
      the range field sizes its own control from `--edsb-target-size`, and the panel's one assertion
      about a row is that it carries no control at all
- [x] T037 [P] Add the locale sweep asserting owned strings come from messages and that damage rates,
      MJ, MJ/s, seconds, metres, milliradians, percentages, counts and ratings use active-locale
      formatters — carried by `scripts/check-interface-foundations.mjs` over both catalogues and by
      the expanded-translation journey, rather than by a sweep of this feature's own
- [x] T038 [P] Add the offline journey — load the workspace, go offline, open `OFFENCE`, move the
      convergence target range and change WEP pips, with no cross-origin request — folded into the
      repository's own `product/offline` and `product/offline-privacy` journeys, which cover the
      whole application and would fail on any request this panel made
- [x] T039 Reconcile the coverage ledger with the feature 007 surfaces, exported components, preview
      declarations and Playwright project names, and assert every conformance statement carries the
      constitutional exclusion
- [x] T040 Restore unit coverage to at least 80% statements, branches, functions and lines
- [x] T041 [P] Record the Offence Profile capability, and the target simulation that stays out of
      scope, in `AGENTS.md`.
      _Superseded 2026-08-25: `AGENTS.md` was cut back to a feature-ownership table, because its per-feature blocks duplicated these spec directories and went stale whenever the canvas moved. This feature's boundary and out-of-scope list live in its own `spec.md` and `design/`._
- [x] T042 Execute every section of `specs/007-offence-profile/quickstart.md` and fix each divergence
- [x] T043 Run `pnpm run check` and confirm formatting, compilation, policy checks, build, unit
      coverage, all ten Playwright projects and all axe scans pass with nothing skipped or focused

---

## Phase 7: The 2026-08-25 canvas revision

The canvas changed after this feature shipped. Every item below was a divergence between
`.design/Ship Builder.dc.html` and the built region, recorded in
`design/canvas-contract.md`, "Canvas revision, 2026-08-25". Nothing here was a new capability: the
package answers were all already in `src/app/domain/offence/`, and no new package call was added to
close any of it.

**Two things the revised drawing does that this phase deliberately did not build**, both recorded in
`design/canvas-contract.md` under the revision, and both arrangements rather than figures.

Canvas 1c stacks its four facts as label-left, value-right rows down the narrow column beside the
plate, where the built region keeps the `repeat(4, 1fr)` cells its own build table sanctions. Same
four labels, same four figures, arranged from the region's available space rather than from an
artboard's fixed width — which is the responsive composition T033 owns.

And the weapon list's aligned table is drawn only where five columns fit, which a 1440px desktop
does not give this block: the figure tracks take their own heads out of the module track, leaving it
83px in English and 40px in German, where a name renders one or two characters per line. The table
promotes at 26rem and the compact arrangement carries the same five figures with the word that names
each one below that. Nothing is dropped; what is lost is the alignment, at widths where alignment
would have cost the name instead.

_Phase 8 rebuilt those tracks and re-measured that threshold; the paragraph above is the record of
what Phase 7 built, and 26rem is superseded by the 31rem T053 sets._

The plate's **box** is not in that category and is built square, at the canvas's own width, with the
range and the four cells beside it. T045 first took the revision's square-in-angle mapping while
leaving the box `16 / 6`; that is a different diagram from either drawing, squashing every shot's
height by `16 / 6` and clipping both rings past the plate. The box went square with the mapping,
which is one change and not two.

- [x] T044 Add the weapon list's `RANGE` column between `PIERCE` and `FALLOFF` — `maximumRange`,
      already carried on `FittedWeaponMetrics` for `damageFalloff()`. Add `offence.column.range` to
      both catalogues, extend the head row and the per-row figure list, and keep an absent maximum
      range as not-stated text rather than a dash or a zero (FR-004)
- [x] T045 Re-derive `src/app/domain/offence/convergence.ts` from the revised `wireConvergence`:
      `FIELD_OF_VIEW_MILLIRADIANS = 40`, the plate square in angle with `PLATE_ASPECT` withdrawn,
      the rings sized from the box's own pixel aspect, and every dot clamped to the frame's `4%`–`96%`
      margin instead of leaving it. Update `convergence.spec.ts` to the new geometry, including a
      shot far enough off-axis to be clamped.
      _The box goes square with the mapping. Taking the square-in-angle mapping while leaving the
      plate's `16 / 6` box squashes every shot's height by exactly that proportion and pushes both
      rings past the top and bottom of the plate — a diagram belonging to neither drawing. The
      canvas's own box is `width: 172px; aspect-ratio: 1`, which is what makes its ring correction a
      no-op; the plate is built that way, in a wrapping row with the range and the four cells beside
      it (`design/canvas-contract.md`, "3. SHOT CONVERGENCE")._
- [x] T046 Replace the plate's badge column with the script's own numeral placement — one dot and one
      hardpoint numeral per armed mount, the numeral at whichever of `[7,-14]`, `[7,5]`, `[-13,-14]`,
      `[-13,5]` stands furthest from every other dot. Remove `plate__leader`, `badgeLeft`,
      `badgeTop`, `leaderLength` and `leaderAngle`, and the 1600×600 plate-space they were written in
- [x] T047 Move the ring caption onto the `SHOT CONVERGENCE` heading line, drop `AT THIS RANGE` from
      `offence.convergence.ring`, and withdraw `offence.convergence.note` and
      `offence.convergence.impact-plane` from both catalogues and from the template — neither is
      drawn any more. The caption stays in the shot sentences as well, because it is still the one
      plate figure the four cells do not repeat (FR-011)
- [x] T048 Re-lay the range field as the canvas draws it: `TARGET RANGE` and its value on the row
      above the track, the track's two end labels beneath it, then the four fact cells. Rename
      `offence.convergence.range` to `Target range` in both catalogues
- [x] T049 [P] Update `design/component-state-preview-matrix.md` and the convergence previews for the
      clamped-shot state, which replaces the clipped-shot state.
      _The matrix's convergence row already read `clamped`; what was still stale was its weapon row,
      which is now the canvas's four figure cells. There are no convergence previews to update: this
      feature declares none, for the reason T018, T026 and T031 record — neither block is exported
      from `src/app/ui/components`, so the `missing-preview` rule does not reach either. The one
      preview the manifest does carry for this feature is `edsb-range-field`, whose three states now
      name the canvas's own `Target range` (`design/component-state-preview-matrix.md`)._
- [x] T050 Re-run the feature's own e2e specs in all ten projects with the axe scan, then
      `pnpm run check`.
      _Run in the five Chromium projects — 42 journeys per profile, 210 in all, with the axe scan
      over every state, including one over the weapon list's promoted table, which no layout
      profile's own width reaches. The five Firefox projects could not be run for the reason recorded at the
      head of this document: `playwright install firefox` is still refused by this environment's
      egress policy, and Firefox evidence is this branch's pull request's own
      `End-to-end (shard 1..6)` checks. Locally `pnpm run check` was run as its parts — format check,
      typecheck, build, policy, unit tests with coverage and the Chromium journeys — all green._

---

## Phase 8: Every hardpoint, and the mount being worked on

Three things the maintainer asked for on 2026-08-26, after the region shipped. Two of them are
**sanctioned departures from the canvas** rather than readings of it — neither canvas draws an empty
mount on the gunsight, and neither relates the plate to the mount its ledger has open — so both are
recorded in `design/canvas-contract.md` (review notes 8 and 17) before they are built, which is what
SC-004 asks of anything user-facing the template does not contain. The third is a defect in what
Phase 7 built.

Nothing here adds a package call or a package figure. The gunsight already publishes an offset per
hardpoint rather than per weapon — that was the half of the withdrawn FR-012's reasoning the
withdrawal explicitly kept — and the selection is feature 002's own `selectedSlotKey`, already read
by the ledger row and by feature 010's hull schematics.

- [x] T051 Carry every placed hardpoint in the projection, armed or empty. `ConvergenceMount` gains a
      nested `weapon: ConvergenceWeapon | null` and loses the three flattened weapon fields, and
      `projectConvergence` walks the hull's enumerated hardpoints rather than the returned weapons,
      matching a weapon onto a mount by its slot key. Both spans, `widest` and
      `apparentSpreadMilliradians` are narrowed to the armed mounts, so no figure about the group
      counts a mount that fires nothing (`data-model.md`, "Convergence"; `spec.md` FR-012).
      _`src/app/domain/offence/convergence.ts`, `convergence.spec.ts`._
- [x] T052 Draw the three states on the plate and state each in words. An empty mount takes a hollow
      dot in the quiet ink the hull schematics give one, the selected mount takes a ring around
      whichever dot it is, and the four sentences beside the plate — armed, armed and selected,
      empty, empty and selected — are four whole catalogue entries rather than one with a state
      appended, because where each part falls moves between languages. The plate is handed the
      selection as an input; it does not reach for the store (`spec.md` FR-011, FR-012, FR-013).
      _`shot-convergence.{ts,html,scss}` and its suite, `offence-analysis.{ts,html}` and its suite,
      `src/styles/tokens/_semantic.scss`, both locale catalogues._
- [x] T053 Give the weapon table's five columns the canvas's own proportion. `minmax(0, 1fr)` beside
      four `auto` tracks gave every spare pixel to the module name and none to the figures — a name
      with a field of empty ground after it and four figures crushed against the trailing edge — so
      the five tracks are now `2fr` against `1fr` each above their floors. That changes what the
      block has to be given before the table is worth drawing: a figure column has to be at least as
      wide as the longer of its own head and its own figure, and `DURCHSCHLAG` is 73.3px, so the
      threshold moves from 26rem to **31rem** (`design/canvas-contract.md`, "Canvas revision,
      2026-08-25").
      _`offence-analysis.scss`, `src/styles/tokens/_primitives.scss`, `_semantic.scss`._
- [x] T054 Extend the end-to-end guards to what changed, and prove each fails on the regression it
      names. The convergence journeys count the hull's hardpoints off feature 002's ledger rather
      than off the weapon rows, classify every shot sentence against the catalogue template it was
      rendered from, and follow the ledger's selection onto the plate; the table guard asserts the
      four figure tracks are equal and every head fits on one line, and that the table is _not_
      promoted at a width where a head would not fit.
      _Reverting the track list to `minmax(0, 1fr) repeat(4, …auto)` fails the equal-track assertion
      at 10.4px in English and 33.3px in German; lowering the threshold back to 26rem fails the
      not-promoted-at-1780 assertion in both languages. `e2e/offence-profile.spec.ts`,
      `e2e/coverage-ledger.ts`._
- [x] T055 Re-run the feature's own e2e specs with the axe scan, and the checks the gate names.
      _215 offence journeys across the five Chromium layout profiles, green, with the axe scan over
      every state including the promoted table in both languages. The five Firefox projects rest on
      this branch's pull request's `End-to-end (shard 1..6)` checks, for the reason recorded at the
      head of this document._

---

## Phase 9: The plate's inks, its track and its size

Three more things the maintainer asked for on 2026-08-26, after seeing Phase 8 drawn. All three are
properties of the **drawing** rather than of any build: none changes a figure, and every reading the
block gives is still the package's own answer. All three are departures from the canvas and are
recorded as such before being built (`design/canvas-contract.md`, review notes 17 and 18).

- [x] T056 Spend the canvas's second ink on selection instead of on how a weapon aims. The plate had
      three things to separate — armed, empty, selected — where the canvas has one, and the cool ink
      was drawing `mount === 'GIMBALLED'`, which every mount's own sentence already names. The
      fixed-against-aimed distinction is withdrawn from the drawing, `--edsb-surface-mount-fixed`
      becomes `--edsb-surface-mount-armed`, `--edsb-surface-mount-aimed` is retired, and
      `--edsb-surface-mount-selected` takes the cool ink with its ring. Whether a mount is armed
      stays with the fill against the outline, so a selected empty hardpoint is still visibly empty
      (`spec.md` FR-011, FR-013).
      _`src/styles/tokens/_semantic.scss`, `shot-convergence.{ts,html,scss}` and its suite._
- [x] T057 Run the target-range track from 500 m to 5,000 m on a 100 m step, opening at 1,000 m. The
      canvas's own `100`–`2000` on a `25` step could not be moved to the distance a Commander is
      asking about: a Multi-Cannon on the reference hull states a maximum range of 3,000 m
      (`data-model.md`, "Convergence"; `design/canvas-contract.md`, review note 18).
      _`src/app/domain/offence/convergence.ts` and its suite, `e2e/offence-profile.spec.ts`._
- [x] T058 Draw the plate at `8rem` rather than the canvas's `172px`. It is decorative in full and
      was the tallest thing in the offence panel, setting the convergence block's whole height on its
      own — 230px, against 186px now. Squareness is the property that matters, and every mark is
      placed as a fraction of the plate, so it is the same diagram at either size; the numerals'
      reference width follows it.
      _`src/styles/tokens/_primitives.scss`, `shot-convergence.ts`._
- [x] T059 Re-run the feature's own e2e specs with the axe scan, and the checks the gate names.
      _The clamp assertions were the only ones the new track moved: at 500 m this hull runs out of
      plate on the vertical axis rather than the horizontal one, so the unit assertion that the
      clamp is reached now names either axis rather than the horizontal one alone. The five Firefox
      projects rest on this branch's pull request's `End-to-end (shard 1..6)` checks, for the reason
      recorded at the head of this document._

## Phase 10: One mark a mount, and the block's own width

Two more things the maintainer asked for on 2026-08-27, after seeing Phase 9 drawn. Both are
properties of the **drawing**: no figure moves and every reading the block gives is still the
package's own answer. The first is a departure recorded before it was built; the second is a canvas
bound this document's own reading had missed (`design/canvas-contract.md`, review note 20).

- [x] T060 Draw each hardpoint as one dot and nothing else. The numeral beside every mark goes, and
      with it `src/app/domain/offence/numeral-placement.ts` and its suite, the leaders, the ring a
      crowded plate sent them out on and the plate's own query container — a gunsight 172px across
      carrying a numeral for every hardpoint was a page of digits over a diagram, and each of them
      was already the first thing that mount's sentence says. The three states become three fills of
      one shape: the empty mount's outline goes with the numerals and
      `--edsb-surface-mount-empty` becomes the armed amber gone stale
      (`--edsb-palette-amber-deep`, 3.62:1 against the worst stripe of the plate's hatch) rather
      than a text ink, and the
      selection ink wins over it where a selected hardpoint is empty. Every fact stays in the
      mount's own sentence, unchanged (`spec.md` FR-011, FR-012, FR-013).
      _`src/styles/tokens/_semantic.scss`, `shot-convergence.{ts,html,scss}` and its suite,
      `offence-analysis.spec.ts`, `e2e/offence-profile.spec.ts`, `e2e/coverage-ledger.ts`._
- [x] T061 Stop the convergence block at the canvas's own `max-width: 508px`, at the leading edge of
      its row. The block was built across the full width beneath the pair, which stood a 172px plate
      in the middle of an 862px frame with the range field stretched out beside it. The bound is the
      canvas's (@660195); `--edsb-measure-convergence-block` carries it.
      _`src/styles/tokens/_{primitives,semantic}.scss`, `offence-analysis.scss`._
- [x] T062 Re-run the feature's own e2e specs with the axe scan, and the checks the gate names.
      _The selection assertion was the one that had to be rebuilt rather than trimmed: it read the
      selected mount's number off the numeral drawn beside its dot. It now ties the mark to its
      sentence by their shared place in one list rendered twice, and reads the hardpoint out of the
      catalogue template's own `{{hardpoint}}` slot._

## Phase 11: The plate a Commander actually reads

Four more from the same day, after seeing Phase 10 drawn, plus the findings a review of it raised.
All four are the drawing again; no figure moves (`design/canvas-contract.md`, review note 21).

- [x] T063 Draw the plate at `14rem` — 224px against the canvas's 172px. With the block bounded at
      508px the plate no longer sets the panel's height, and 172px inside that frame is a small
      drawing with air around it. 224px is half of what the bounded block holds: 508 less its two
      18px insets and its two hairlines is a 470px content box, and less the 22px gap that is 448px
      for the plate and the range column to share.
      _`src/styles/tokens/_primitives.scss`._
- [x] T064 Leave a shot outside the field of view **off the plate** instead of holding it at the
      frame. `PLATE_MARGIN_FRACTION` stops being a clamp and becomes the bound past which a mount is
      not drawn: `ConvergencePoint` gains `onPlate`, `horizontal` and `vertical` carry the shot's own
      unbounded fraction, and the template draws the marks that fit. Every mount keeps its sentence,
      which is now the only statement of a shot the plate cannot show — the first thing on this plate
      that is text-only (`spec.md` FR-011, FR-012).
      _`src/app/domain/offence/convergence.ts` and its suite, `shot-convergence.{ts,html}` and its
      suite, `e2e/offence-profile.spec.ts`, `e2e/coverage-ledger.ts`._
- [x] T065 Stop the target-range track at 3,000 m, and record the ceiling as the preference it is.
      Review note 18's 5,000 m reached past a weapon's maximum range; 3,000 m does not — a cannon
      states 4,500 m and a multi-cannon 4,000 m — so what is written down is that the steps past
      3,000 m move the marks least, not that no weapon reaches them.
      _`src/app/domain/offence/convergence.ts` and its suite._
- [x] T066 Withdraw the filled dot at the boresight's centre. The canvas draws one; on a plate whose
      only marks are dots it reads as a shot landing dead on the axis. The ring stays.
      _`shot-convergence.{html,scss}` and its suite, `e2e/offence-profile.spec.ts`._
- [x] T067 Close the review's findings on Phase 10: the empty ink's contrast is stated as measured
      (3.62:1 against the worst stripe of the plate's hatch, not the 4.08:1 first written down) and
      recorded in feature 011's `design/token-evidence.md` beside the other two mount inks; FR-011's
      "no distinction rests on colour alone" is withdrawn and replaced by what is actually true of
      this plate; the stale comments Phase 10 left in `_primitives.scss`, `shot-convergence.scss`
      and `hull-anatomy.scss` are corrected; the canvas's `13px 14px` inset for block 3 is recorded
      as deliberately not adopted; and the two layout numbers now have end-to-end guards — the
      block's own bound, and the empty mark being filled rather than outlined.
      _`spec.md`, `design/canvas-contract.md`, `specs/011-interface-foundations/design/token-evidence.md`,
      `specs/010-hull-anatomy/design/hull-anatomy.md`, `e2e/offence-profile.spec.ts`._
- [x] T068 Close the second review: the bounded block was sizing to its own contents, not to the
      bound. `justify-self: start` makes a grid item shrink-to-fit, so `max-inline-size` never bound
      anything and the block came out 203px wide with a 165px plate in it — a _smaller_ plate than
      the unbounded block drew, which is the opposite of what T063 asked for. An explicit
      `inline-size: 100%` is what asks for the row. The range column's flex basis goes from `15rem`
      to `14rem` in the same fix: a flex line breaks on the un-shrunk basis, so 240px asked of the
      224px left beside the plate dropped the range under it at exactly the width the canvas draws
      the two side by side. The end-to-end guard gains the lower bound, the plate's own rendered
      width and the range's position beside it — without them both defects were green.
      _`offence-analysis.scss`, `shot-convergence.scss`, `e2e/offence-profile.spec.ts`._
- [x] T069 Close the third review, which found no defect in the code and eight statements that were
      not true of it. The 3,000 m ceiling was written down as the longest range the package
      publishes for a weapon on this hull; measured against the pinned package a cannon states
      4,500 m and a multi-cannon 4,000 m, so the ceiling is recorded as the preference it is, in all
      eight places — including review note 18's own claim about a multi-cannon, corrected in note 21
      rather than edited where it was written. The block's inner width is 470px and not 472: the
      block is `border-box` and its two hairlines count, which makes the range column's share 224px
      exactly. Its flex basis becomes `13.5rem` so the arrangement is not one pixel of a hairline
      away from wrapping. `--edsb-measure-anatomy-plate`'s two bounds bite at different widths — the
      old from 1560, the new from about 1884 — and the design record says so. The plate's rendered
      block width is asserted against the row rather than unconditionally, and the selected-empty
      mark's fill, which rests on declaration order alone, is read off the rendered mark. Four more
      stale statements in `design/offence-profile.md` and `quickstart.md`, and the colour-alone rule
      cited to the constitution's principle V rather than to 011 FR-022, which is about the
      automated checks. _(The citation was only half corrected here: T070 finishes it, and 011's own
      requirement for the rule is FR-010.)_
      _`convergence.ts` and its suite, `shot-convergence.scss`, `e2e/offence-profile.spec.ts`,
      `spec.md`, `data-model.md`, `quickstart.md`, `design/{canvas-contract,offence-profile}.md`,
      `specs/010-hull-anatomy/design/hull-anatomy.md`,
      `specs/011-interface-foundations/design/token-evidence.md`._
- [x] T070 Close the fourth review, which found no code defect and five more statements that were
      not true — one of them a regression this phase introduced. The canvas's own track is
      `500`–`5000` on a `50` step opening at `1500`, which `wireConvergence` declares at offset
      1516348; `100`–`2000` on a `25` step is the 2026-08-25 drawing, moved by the revision of the
      26th, and T065's note had
      overwritten the one place that read the current one correctly. Only the **ceiling** departs
      from the canvas, and nine places said otherwise. `011 FR-022` is the automated-checks
      requirement; the colour-alone rule is `011 FR-010`, and every citation of it in this feature
      now says so. The plate's own stylesheet still said it takes the canvas's width, the panel
      template still said the block runs the full width, and the canvas contract's departures
      paragraph still had the four cells beside the plate. The dead
      `.offence__block--convergence .offence__note` rule and its fourteen-line comment about a ring
      caption withdrawn on 2026-08-26 are deleted, and the end-to-end test that asserts none of the
      four facts is drawn is no longer titled as though it names them.
      _`convergence.ts`, `offence-analysis.{html,scss}`, `shot-convergence.{ts,scss}` and its suite,
      `e2e/offence-profile.spec.ts`, `spec.md`, `data-model.md`, `quickstart.md`,
      `design/{canvas-contract,offence-profile}.md`._
- [x] T071 Close the fifth review, which found no code defect and four more statements out of step
      with what is around them. The track's move is dated to the 2026-08-26 canvas revision, not the
      25th's — `git show de44f1b` still declares `MIN = 100, MAX = 2000` and `2ae9838` is what
      changed it, which is also what this document's own §3 says. The end-to-end selection test
      compares a mark's place among the dots with its sentence's place in the list, and this phase
      broke the correspondence it rests on: the dots are the sentences filtered by `onPlate`, so at
      a short range the lists are different lengths. The test asserts they are equal before it
      compares a place, and says why. `ConvergencePoint.hardpoint` no longer calls itself the
      plate's numeral. The 508px bound is moved out of the departures list in `spec.md`, because
      review note 20 rules it a correction of a bound this application had missed rather than a
      departure from one. And the contract's "two things the built region deliberately does not do"
      is one thing: the four fact cells it named are drawn by neither side since 2026-08-26.
      _`convergence.ts`, `e2e/offence-profile.spec.ts`, `spec.md`, `design/canvas-contract.md`._
- [x] T072 Close the sixth review, which found no code defect and three statements the phase had left
      behind it. The departures paragraph in `spec.md` counted four and listed five — the 508px bound
      was never a clause of its own, so taking it out of the list did not take a clause with it.
      FR-012's one-line summary in `design/screen-inventory.md`, and the bullet that restates it in
      `design/offence-profile.md`, both still said every placed hardpoint is drawn, four bullets
      after the one that says a shot outside the field of view is not; both carry the condition now.
      And four rows of the canvas contract's build table still described the ring caption and the
      three span figures as built, in a table whose own next row records them withdrawn on
      2026-08-26; they take the same strikethrough.
      _`spec.md`, `design/{screen-inventory,offence-profile,canvas-contract}.md`._

---

## Dependencies & execution order

### Phase dependencies

- Phase 1 has no dependencies.
- Phase 2 depends on Phase 1 and blocks every user story: nothing can be drawn before the projection
  exists.
- Phase 3 (US1) depends on Phase 2 and is the MVP.
- Phase 4 (US2) depends on Phase 3, because the collection is drawn inside the `WEAPONS` block US1
  creates.
- Phase 5 (US3) depends on Phase 3, because the capacitor is drawn inside the `DAMAGE PROFILE` block
  US1 creates. It is independent of Phase 4.
- Phase 5b depends on Phases 3 to 5, and rebuilds what they drew.
- Phases 5c and 5d depend on Phase 5b, and correct what it drew.
- Phase 6 depends on every story it verifies, and on Phase 5d.
- Phase 7 depends on Phase 6 and re-verifies it. T045 blocks T046; T044, T047 and T048 are
  independent of both and of each other.
- Phase 8 depends on Phase 7 and changes what it drew. T051 blocks T052; T053 is independent of
  both; T054 depends on T052 and T053, and T055 on all four.
- Phase 9 depends on Phase 8 and retunes what it drew. T056, T057 and T058 are independent of each
  other; T059 depends on all three.
- Phase 10 depends on Phase 9 and withdraws part of what Phases 7 to 9 drew. T060 and T061 are
  independent of each other; T062 depends on both.
- Phase 11 depends on Phase 10. T063 to T066 are independent of each other; T067 answers a review of
  Phase 10 and touches what T060 and T061 wrote; T068 answers a review of T063 to T067 and corrects
  what T061 and T063 drew; T069 answers a review of T068 and corrects what the phase wrote down; T070 answers a review of
  T069 and does the same again; T071 answers a review of T070, which found no defect in the code; T072 answers a review of T071,
  which found none either.

### Parallel opportunities

- T002 and T003 together.
- T006, T008 and T009 together once T004 lands.
- Every `[P]` test task within a story, since each names its own file or its own region of a suite.
- T034 to T038 together.

## Implementation strategy

Deliver US1 first: the mode, the totals, the damage types and the rail cell are a complete, useful
capability on their own. US2 and US3 then fill the two blocks US1 framed, in either order.

Run focused end-to-end specs between phases and the full matrix at the end of each phase — the five
Chromium projects where this was built, and the ten the gate names wherever Firefox can be
installed, per the engine-coverage note at the head of this document.

## Constitutional guardrails

- No server, account, telemetry or cross-origin runtime request.
- No local damage, falloff, piercing-factor, target, mount-geometry, pip-scaling, recharge, drain or
  endurance calculation. What the application does compute is the returned weapon count, and
  proportions — a share, a bar fill — over package amounts stated on the same screen.
- No cause inferred from a zero or an infinity.
- Every owned string through the localization layer; every figure through an active-locale formatter.
- One tokenized dark theme; no colour literal outside the token layer.
- WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11, stated with the
  exclusion wherever conformance is claimed.
- Nothing user-facing that `design/canvas-contract.md` does not sanction.
