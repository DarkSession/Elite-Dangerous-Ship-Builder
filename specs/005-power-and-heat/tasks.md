---
description: 'Task list for Power and Heat'
---

# Tasks: Power and Heat

**Input**: Design documents from `/specs/005-power-and-heat/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [design/](./design/),
[quickstart.md](./quickstart.md)

> **Rewritten 2026-08-23 (wave 12).** The original 68 tasks built a `powerAndHeat` detail capability
> behind a workspace selector, a revision-stamped store with a four-state lifecycle, a
> `StatusProvider` bundle for feature 003, an announcement coordinator, a half-pip domain and a
> preview matrix. Feature 003's wave 11 rulings A–C withdrew the selector, the target, the provider
> envelope and the shared condition control, and reassigned the hardpoint and pip conditions here.
> See [Retired tasks](#retired-tasks) for where each group went, and
> [design/reference-review.md](./design/reference-review.md), wave 12, for the rulings.
>
> **Amended 2026-08-24 (wave 13).** Wave 12's build was read against the artboard and rejected. The
> plates are hidden in `POWER` mode by the artboard's own switching script, so the overlay (T004,
> T012, T018) is withdrawn; headroom, utilisation, within-budget, the subtitle, the plant-marker
> line, the severity words, the heat statement and the module-row action are withdrawn with it,
> because neither canvas draws any of them. The tasks below are amended in place to describe what
> shipped, and Phase 10 records the rebuild. See
> [design/reference-review.md](./design/reference-review.md), wave 13.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Every task names the exact file it changes

## Path Conventions

The projection lives in `src/app/domain/power-heat/`, the two conditions in
`src/app/application/power-heat/`, and the surfaces are siblings of `hull-anatomy/` and
`cost-materials/` inside `src/app/features/build-workspace/outfitting/` — not a parallel
`power-and-heat/` tree, because the dashboard is a mode of the anatomy region and the rail blocks
are blocks of the rail. Unit tests live beside their source as `*.spec.ts`; end-to-end suites are in
`e2e/`.

## Delivery gates

Features 001, 002, 003, 010 and 011 are prerequisites and are all delivered. **No gate remains.**
Nothing in this feature is a contract another unbuilt feature waits on: features 006 to 008 own the
metric cells beside this one's rail line, and neither reads a power field.

---

## Phase 1: Contract

- [x] T001 Characterize the installed Almanac power, distributor and heat contract this feature
      projects — `powerBudget()` returning `available`, `deployed`, `retracted`, `headroom`,
      `utilisation`, `withinBudget`, five `bands` carrying `priority`, `deployed`, `retracted`,
      `deployedTotal`, `retractedTotal`, `poweredDeployed` and `poweredRetracted`, and `consumers`
      carrying `label`, `symbol`, `draw`, `enabled`, `priority` and `deployedOnly`;
      `distributorMetrics(DistributorOptions)` accepting independent `0`–`4` pips, echoing `pips`
      and returning `null` versus SYS/ENG/WEP `capacity`, `ratedRecharge` and `rechargeRate`; and
      `heatMetrics()` taking no options and returning `null` versus `heatEfficiency`,
      `hullHeatCapacity`, `hullHeatDissipation` and exactly the five `HeatState` scenarios with
      `Infinity` heat level or gauge and `null` `secondsToOverheat` — using the leaf subpaths
      `ships/ship-loadout`, `ships/power`, `ships/distributor` and `ships/heat`, in
      `src/app/domain/power-heat/almanac-power-heat-contract.spec.ts`

## Phase 2: The projection

- [x] T002 Define `PowerConditions`, `HardpointState`, `DistributorPipAllocation` and the semantic
      unions `HeatLevelValue` and `OverheatTime`, with the pure constructors mapping `Infinity` heat
      level or gauge to `doesNotSettle` and `null` `secondsToOverheat` to `neverOverheats`, in
      `src/app/domain/power-heat/power-heat.ts` (depends on T001)
- [x] T003 Implement `projectPowerHeat(loadout, conditions)` — one `powerBudget()` call selecting
      `deployed`/`retracted`, `deployedTotal`/`retractedTotal` and
      `poweredDeployed`/`poweredRetracted` for the groups the build uses, and reading no headroom,
      utilisation or within-budget field at all; one line per kind of `PowerConsumerResult`
      retaining exact `label`, `symbol`, `draw`, `enabled`, `priority` and `deployedOnly`, carrying
      the selected state's own draw and never fabricating an absent fitting; one
      `distributorMetrics()` call mapping `null` to unavailable and a result to the returned pips
      and the three capacitors in SYS/ENG/WEP order; and one `heatMetrics()` call mapping `null` to
      unavailable and a result to the three profile facts and exactly the five scenarios — in
      `src/app/domain/power-heat/power-heat.ts` (depends on T002)
- [x] ~~T004 Implement `mountPowerState(power, slotKey, hardpoints)`.~~ **Withdrawn in wave 13**:
      the artboard hides the plates outside `mounts`, so there is no mount to draw a state on
- [x] T005 [P] Add the projection fixtures — a within-budget build, a build shedding group 4, a
      build whose band verdicts differ between deployed and retracted, a zero-output build with
      positive draw, a build with a disabled and a deployed-only consumer, a null distributor and a
      null heat profile — in `src/app/domain/power-heat/power-heat.fixtures.ts`

## Phase 3: The conditions

- [x] T006 Implement `PowerConditionsStore` holding the selected hardpoint state, defaulted to
      `deployed`, and whole `0`–`4` pips per bank, with no draft, apply, reset, validation or
      persistence, in `src/app/application/power-heat/power-conditions.store.ts`

## Phase 4: The dashboard (US1, US2, US3)

- [x] T007 [US1] Implement `PowerThermals` — the `DEPLOYED`/`RETRACTED` segments on their own line
      under the `PRIORITY GROUPS` heading, one row per group the build uses with its own draw and
      either its cumulative share or the canvas's `OFFLINE`, and the canvas's three tiles
      `PLANT OUTPUT`, `POWERED DRAW` and `UNPOWERED` — in
      `src/app/features/build-workspace/outfitting/power-thermals/power-thermals.ts` and its
      template and styles (depends on T003, T006)
- [x] T008 [US1] Implement the `DRAW BY MODULE` collection inside `PowerThermals` — the canvas's
      `MW · TOTAL n` note, one line per kind of consumer with the feature 011 game-text presenter
      for the module name, the canvas's `x2` count where a line stands for more than one mount, its
      `· GRP 4` where the plant leaves the group dark and `· Off` where the mounts are switched off,
      each carrying the selected state's own draw and ordered by draw — in the same component and
      template (depends on T007)
- [x] T009 [US3] Implement the `HEAT PROFILE` block as one plate with two sides — the five scenario
      bars in package order and the shield bank's sixth, the threshold caption on the line they are
      measured against, the canvas's `RESTING HEAT`, `PEAK SUSTAINED`, `DISSIPATION` and
      `HEAT SINKS` tiles beside them, the two-key legend under both, `doesNotSettle` and
      `neverOverheats` on their own fields only, and one unavailable group for a package `null` — in
      the same component and template (depends on T007)
- [x] T010 [US2] Implement the `POWER DISTRIBUTOR & PIP ALLOCATION` block — the block's heading
      once and no table caption repeating it, SYS, ENG and WEP with capacity, rated recharge, the
      four-block pip control that moves the other two banks to pay for it, and actual recharge,
      displaying the returned pips, with the figures keeping their columns and the blocks taking
      only the space they need, and one unavailable group for a package `null` — in the same
      component and template (depends on T007, T006)
- [x] T011 Style the dashboard from canvas 1c's four plates — `PRIORITY GROUPS` beside
      `DRAW BY MODULE`, then `HEAT PROFILE`, then the distributor, each on the panel ground inside
      its own hairline — and canvas 1d's single column, choosing the arrangement from the region's
      own inline size and using only design tokens, in
      `src/app/features/build-workspace/outfitting/power-thermals/power-thermals.scss` (depends on
      T010)

## Phase 5: The plates and the mode strip

- [x] ~~T012 Extend `HullSchematicView` with a per-mount power state and draw canvas 1c's
      `data-anat-layer="power"` marks.~~ **Withdrawn in wave 13**: that layer is dead markup the
      artboard's own switching script never shows, because it hides `[data-anat-plates]` for every
      mode but `mounts`
- [x] T013 Enable the `POWER` segment of the mode strip, retitle the region `POWER & THERMALS` while
      it is selected, remove the plates, their side selector and their legend as the artboard's
      switching script does, and draw `edsb-power-thermals` in the space they leave, in
      `src/app/features/build-workspace/outfitting/hull-anatomy/hull-anatomy.ts` and its template
      and styles (depends on T011)

## Phase 6: The status rail

- [x] T014 Implement `PowerSummary` — one sentence per group the package reports unpowered with the
      hardpoints deployed, naming its group and its own deployed draw and carrying no severity word;
      the canvas's `POWER` line carrying the lit draw against `available` with its `· 7.80 OFF`
      suffix only where something is dark; and the canvas's bar under it, the same figures over the
      whole demand with a mark where the plant runs out — with nothing in the block interactive and
      no heat sentence, in
      `src/app/features/build-workspace/outfitting/power-summary/power-summary.ts` and its template
      and styles (depends on T003)
- [x] T015 Mount `edsb-power-summary` between `edsb-build-status` and `edsb-cost-materials` in
      `src/app/features/build-workspace/outfitting/outfitting-workspace/outfitting-workspace.html`
      (depends on T014)

## Phase 7: Language

- [x] T016 [P] Add this feature's message keys — the mode title, the two hardpoint state names, the
      priority group, cumulative-draw and `OFFLINE` labels, the three summary tile labels, the
      module list's total, count, group and off markers, the heat heading, four tile labels and the
      sink breakdown, six scenario names, the threshold caption and the two legend keys, the
      distributor heading, three bank names, four column names and the pip control's labels, the two
      unavailable statements, the two sentinel phrases, the rail's shed sentence, its two figure
      patterns, its bar label and its `POWER` label — and the
      `MW`, `MJ`, `MJ/s` and seconds unit patterns, to `src/app/i18n/locales/en.json` and
      `src/app/i18n/locales/de.json`

## Phase 8: Tests

- [x] T017 [P] Add projection tests for field-for-field equality in both hardpoint states, the
      groups the build uses in ascending order with empty groups left out, the absence of any
      headroom, utilisation or within-budget field, aggregated and unaggregated lines, disabled and
      stowed rows reading a real zero, each state's lines totalling that state's own package figure,
      the rail bar's three lengths, a genuine zero-pip recharge, unchanged
      capacity across pip changes, a `null` distributor and a `null` heat profile carrying no
      inferred cause, the five scenarios in fixed order, infinite heat level, infinite gauge and
      `null` seconds to overheat, and exactly one call to each of the three package methods per
      projection, in `src/app/domain/power-heat/power-heat.spec.ts` (depends on T003, T005)
- [x] ~~T018 Add `mountPowerState` tests.~~ **Withdrawn in wave 13** with T004. The divergent-band
      fixture is asserted in T017 instead, where each state reads its own verdict
- [x] T019 [P] Add dashboard tests for the groups the build uses in returned order, powered and shed
      meaning carried by words rather than colour, fill, pattern or position, the three tiles in
      both states, zero plant output with positive draw, the module lines with their count, group
      and off markers and their state-relative draw, the heat bars with both sentinels on their own
      fields and the four tiles beside them, and the three capacitors with their returned pips and a
      genuine zero, in
      `src/app/features/build-workspace/outfitting/power-thermals/power-thermals.spec.ts` (depends
      on T011)
- [x] T020 [P] Add rail tests for one sentence per shed group, no sentence when every group is
      powered, no heat sentence however hot the build gets, no severity word, the `POWER` line's
      figures with and without the `OFF` suffix, the bar's three lengths and its name, and the
      absence of any control in the block, in
      `src/app/features/build-workspace/outfitting/power-summary/power-summary.spec.ts` (depends on
      T014)
- [x] T021 Extend `src/app/features/build-workspace/outfitting/hull-anatomy/hull-anatomy.spec.ts`
      with the `POWER` mode — the retitled region with no line under its rule, the enabled segment,
      the plates, side selector and legend gone, the dashboard in their place, and the mounts layer
      restored on the way back (depends on T013)
- [x] T022 Add the journey — open a build, switch to `POWER`, read every group, module line, heat
      scenario and capacitor against the package result, switch to `RETRACTED` and see the stowed
      hardpoints read zero, set a bank's pips and see the other two move to pay for it, and read the
      rail's sentence, figures and bar — in `e2e/power-and-heat.spec.ts`
- [x] T023 [P] Extend `e2e/power-and-heat.spec.ts` with the responsive and accessibility sweep: axe
      over every state at all five layout profiles in both engines, 200% text, actual 400% zoom,
      expanded translations and RTL with no lost content and no document horizontal scrolling, touch
      target sizes for the hardpoint segments and every one of the twelve pip blocks, and
      `prefers-reduced-motion` changing only transitions (depends on T022)
- [x] T024 Add `005-power-and-heat` to `COVERED_FEATURES` and register the Power and Thermals
      dashboard and the rail's power block as surfaces carrying every id `spec.md` declares, in
      `e2e/coverage-ledger.ts` (depends on T022)

## Phase 9: Policy and gate

- [x] T025 Add the feature 005 boundary rules to `scripts/policy/power-heat-ownership.mjs` — the
      Almanac is imported only through the four listed leaf subpaths, no file outside
      `src/app/domain/power-heat/` calls `powerBudget`, `distributorMetrics` or `heatMetrics`, and
      no power, distributor or heat figure is arithmetically combined outside that file — with the
      script registered in `package.json`'s `policy` script (depends on T003)
- [x] T026 Record the Power and Thermals mode and the rail's power block in `AGENTS.md`.
      _Superseded 2026-08-25: `AGENTS.md` was cut back to a feature-ownership table, because its per-feature blocks duplicated these spec directories and went stale whenever the canvas moved. This feature's boundary and out-of-scope list live in its own `spec.md` and `design/`._
      (depends on T024)
- [x] T027 Restore unit coverage to at least 80% statements, branches, functions and lines for the
      new source under the thresholds in `angular.json` (depends on T019, T020)
- [x] T028 Execute every section of [quickstart.md](./quickstart.md) against the reference corpus
      and fix each divergence (depends on T024)
- [x] T029 Run `pnpm run check` and confirm formatting, strict compilation, policy checks, build,
      unit coverage, all ten Playwright projects and all axe scans pass with no skipped, focused or
      quarantined test (depends on T024, T025, T027)

## Phase 10: The wave 13 rebuild

Each of these was read off `.design/Ship Builder.dc.html` after the wave 12 build was rejected. They
change the surfaces above rather than adding new ones, and the amended task text is what shipped.

- [x] T030 Hide the plates, their side selector and their legend in `POWER` mode and draw the
      dashboard in their place, and delete the `data-anat-layer="power"` overlay and its selector,
      in `hull-anatomy.html`, `hull-schematic.*` and `src/app/domain/power-heat/power-heat.ts`
- [x] T031 Draw the four blocks as the artboard's four plates — panel ground, hairline border,
      `PRIORITY GROUPS` beside `DRAW BY MODULE`, then heat, then the distributor — and move the
      `DEPLOYED`/`RETRACTED` control onto its own line, in `power-thermals.html` and
      `power-thermals.scss`
- [x] T032 Replace the deployed-only summaries with the canvas's three tiles, drop the subtitle, the
      plant-marker line and the `power.subtitle`, `power.bands.plant-marker`, `power.rail.overheat`
      and severity keys, and leave out the priority groups this build puts nothing in, in
      `power-heat.ts`, `power-thermals.*`, `hull-anatomy.*` and both locale files
- [x] T033 State each module line's draw in the selected state, aggregate the mounts of one kind
      into the canvas's `x2` line, and mark a switched-off line `· Off`, in `power-heat.ts` and
      `power-thermals.*`
- [x] T034 Lay the heat block out as one plate with the bars and the threshold caption on one side
      and the four tiles on the other, and fix the caption's RTL overflow with
      `:host-context([dir='rtl'])`, in `power-thermals.scss`
- [x] T035 Give the distributor one heading, hold the pip blocks to the space they need at the
      shared target size and keep the figures in their columns, in `power-thermals.html` and
      `power-thermals.scss`
- [x] T036 Draw the rail's segmented bar — the lit draw, the dark remainder and the plant mark over
      the whole demand — with its own name, and state the `· n off` suffix only where something is
      dark, in `power-heat.ts`, `power-summary.*` and both locale files
- [x] T037 Remove the `deployedSummary`, `bandVerdicts` and `UtilisationValue` the rebuilt surfaces
      no longer read, in `src/app/domain/power-heat/power-heat.ts` and its suite
- [x] T038 Update the specs the rebuild overtook — `quickstart.md`, `plan.md`, `data-model.md`, the
      four `contracts/`, and this file — against the design, which wins

---

## Retired tasks

| Original                     | Subject                                                                  | Where it went                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| T005, T024, T033             | `PowerStatusProjection`, `PowerStatusProvider`, `PowerStatusAdapter`     | **Withdrawn** — ruling B: feature 003 composes nothing. The rail block reads the projection directly, as feature 009's does               |
| T032                         | Capability registration in the workspace selector                        | **Withdrawn** — ruling B: canvas 1c draws five anatomy modes and no capability selector. `POWER` is one of those five                     |
| T006, T025, T034, T035       | `MountPowerObservationPort`, its adapter, its index and the wiring       | Reduced in wave 12 to T004's `mountPowerState`, then **withdrawn** in wave 13 with the plates it drew on                                  |
| T014, T019                   | `PowerHeatStore`, its four-state lifecycle and the serialization suite   | **Withdrawn** — one synchronous projection over a loadout already in memory has no lifecycle, and nothing it makes is serialized anywhere |
| T016, T030, T059             | `PowerHeatAnnouncementCoordinator`, `PowerHeatAnnouncer`, its assertions | **Withdrawn** — ruling A: visible content in this area is not live, and both controls report their own state                              |
| T015                         | `PowerHeatPresenter`                                                     | Folded into the components, which is where the active locale and the message keys already are                                             |
| T007, T012, T013             | The revision-stamped projection state and its contract suite             | Reduced to T003 and T017. There is no revision pair to stamp or recheck                                                                   |
| T027–T029, T041, T049, T050  | The five separate surface components                                     | Reduced to T007–T010: one dashboard component, because canvas 1c draws one panel                                                          |
| T031, T042, T051, T055       | `PowerAndHeatCapability` and its compositions                            | Reduced to T011 and T013                                                                                                                  |
| T037, T044, T053             | Preview declarations                                                     | **Withdrawn** — every component here is a feature block, not a shared primitive (`design/component-state-preview-matrix.md`)              |
| T010's half-pip conversion   | Integer half-pips divided at the package boundary                        | **Withdrawn** — ruling C: the artboard draws four whole steps per bank, and no half-pip exists to convert                                 |
| T062                         | The 100 ms settled status-update measurement under CPU throttling        | **Withdrawn** with the provider it measured. There is no status transaction left to time                                                  |
| T017, T036, T043, T052       | Message keys for the surfaces above                                      | Reduced to T016                                                                                                                           |
| T002, T003, T038, T045, T054 | Skeletons and per-story ledger registrations                             | Folded into T024                                                                                                                          |
| T018, T064                   | Boundary rules and ledger reconciliation                                 | Folded into T024 and T025                                                                                                                 |
| T020–T023, T039, T046, T047  | Per-component test files                                                 | Folded into T017–T021                                                                                                                     |
| T026, T040, T048, T056–T061  | Per-story and per-sweep end-to-end suites                                | Folded into T022 and T023                                                                                                                 |
| T063                         | The versioned screen-reader protocols                                    | The existing `e2e/manual/screen-reader.protocol.md` gains this surface rather than a second protocol                                      |
| T065–T068                    | Coverage, documentation, quickstart and the `pnpm run check` gate        | T026–T029, unchanged in substance                                                                                                         |

---

## Dependencies & Execution Order

T001 → T002 → T003. T005 and T006 are independent of the projection body. T007 needs T003 and T006;
T008, T009 and T010 build on T007; T011 closes the dashboard. T013 needs T011. T014 → T015. T016 is
independent of everything but the tests. T017–T021 follow their subjects; T022 → T023 → T024 → T028.
T025 follows T003. T027 follows the component suites, and T029 is last. Phase 10 follows all of
them: T030 → T031 → T032 → T033 → T034 → T035 → T036 → T037 → T038, each re-running the suites its
surface owns, with the full browser matrix at the end of the phase.

---

## Phase: the 2026-08-25 canvas revision

Recorded in `design/power-and-heat-detail.md`, "Canvas revision, 2026-08-25". Nothing here is a new
package call: every figure is one the projection already returns.

> **Ruled 2026-08-25 (the owner), before T074 was built.** The specs disagreed with each other about
> the pip step: `spec.md` FR-007 and wave 12's ruling C said whole pips, while `design/` and the
> store said "half a pip at a time". The ruling settles it and is now FR-007's own block: **a
> Commander assigns a whole pip, and the other two banks pay half a pip each** — or one of them pays
> the whole of it where the other has nothing left to give, and the same rule runs backwards when
> pips come back out. `PowerConditionsStore.setPips` was rebuilt to it (it had been redistributing
> the _remainder_ evenly, which does not preserve where the other two stood), and `spec.md`,
> `data-model.md`, `contracts/distributor-metrics.md`, `quickstart.md` and
> `design/power-and-heat-detail.md` were corrected together.

- [x] T069 Draw the `H‑PTS` label in front of the two condition segments, and make it the group's
      accessible name rather than a hidden string beside them.
      _Built through a new `labelVisible` input on the shared `edsb-tab-group` (feature 011's
      layer), which swaps `aria-label` for `aria-labelledby` on the caption, so the visible name and
      the accessible name are one string by construction. Drawn as the whole word rather than the
      canvas's abbreviation, which is what this application already does with `GRP 1` and its column
      heads — see `design/power-and-heat-detail.md`, "One departure from the drawing"._
- [x] T070 Re-lay `DRAW BY MODULE`: withdraw the header's `MW · TOTAL n` note and
      `power.modules.total` with it, head the list `MODULE` against `MW` over the row tracks with
      the bar column unheaded, and close it with a `TOTAL DRAW` row carrying the same total. Canvas
      1d's second footer figure, `POWERED`, is not built — the priority-group block already draws it
- [x] T071 Move the heat key above the four tiles
- [x] T072 Add a description under each of the six heat scenario names, drawn rather than hovered
      (011 FR-006), through the localization layer in both catalogues. The canvas's six `data-tip`
      strings are quoted in `design/power-and-heat-detail.md`, "Heat profile"
- [x] T073 Rename `power.distributor.heading` to `Power distributor and pips` in both catalogues, and
      withdraw `distributorIdentity()` and its template line — the canvas no longer draws the fitted
      distributor beside the heading.
      _`DistributorView.identity`, the `DistributorIdentity` type and the projection helper behind
      them are withdrawn with it, on T037's precedent: nothing read them once the template line
      went. `power.distributor.module` and its separator are gone from both catalogues and from the
      translation-review ledger._
- [x] T074 Build the rail's pip control (FR-013's 2026-08-25 extension): three bank groups under
      the `POWER` bar, four blocks each, filled from the leading edge, editing the one condition through the same store
      action the distributor cell uses. No half-pip block, no running total, no draft. Each group is
      named with the allocation it stands at
- [x] T075 [P] Extend `power-summary.spec.ts` for the rail control and assert the two surfaces move
      one condition — setting from the rail changes what the distributor table reads, and the reverse
- [x] T076 [P] Assert the rail control's target size and touch operation at all five layout
      profiles, on the same `--edsb-target-size` baseline the distributor cell holds
- [x] T077 Re-run the feature's e2e specs in all ten projects with the axe scan, then
      `pnpm run check`
