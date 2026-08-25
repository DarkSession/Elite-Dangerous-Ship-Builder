---
description: 'Task list for Mobility, Mass and Jump'
---

# Tasks: Mobility, Mass and Jump

**Input**: Design documents from `/specs/008-mobility-and-jump/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [design/](./design/),
[quickstart.md](./quickstart.md)

**Tests**: Test tasks are included. Every contract in this feature names its own required
verification, the specification gates delivery on SC-001–SC-003, and constitution principle VIII
gates the build on unit coverage, the ten-project Playwright matrix and automated accessibility
scans.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested and
demonstrated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Every task names the exact file it changes

## Path Conventions

Single Angular workspace at the repository root: framework-agnostic projections and contracts in
`src/app/domain/mobility-jump/`, signal stores and adapters in `src/app/application/mobility-jump/`,
surfaces in `src/app/features/build-workspace/mobility-and-jump/`, shared primitives and previews in
`src/app/ui/`, messages and formatters in `src/app/i18n/`, end-to-end suites in `e2e/`, repository
policy checks in `scripts/`. Unit tests live beside their source as `*.spec.ts`.

## Reconciliation with the design (this branch)

The `.design` canvases are the template for this feature, and where they and this plan disagreed the
canvases decided. Six things changed as a result, and this section is the record of them so the
remaining tasks are read against the shape actually built rather than the one planned.

**One region, two cards — not five stacked surfaces.** Canvas 1c draws Drives & Mass as the `DRIVES`
mode of the hull anatomy region, with `THRUSTER LOAD` and `FRAME SHIFT DRIVE` side by side in the
space the plates leave; canvas 1d stacks the same two. The plan's five components
(`jump-performance/`, `mobility-performance/`, `mass-and-capacity/`, `module-mass-list/` and a
`drives-and-mass-capability/` container) and its separate condition-context block describe an
arrangement the canvases do not draw. What was built is `features/build-workspace/outfitting/
drives-mass/` reading one pure projector at `domain/mobility-jump/`, with the ENG context stated in
the speed envelope's own heading because that is the only group it qualifies. The design's
[reference review](./design/reference-review.md) and
[capability profile](./design/mobility-and-jump-profile.md) have been corrected to match.

**Four readings the Almanac now answers.** The canvas draws a headline loaded mass, a
hull/modules/fuel decomposition, a position on the thruster mass curve and an `SCO` badge. The
version of `@elite-dangerous-almanac/core` this feature started against published none of them, so
all four were raised against the library rather than cut: cutting them would have been resolving a
library gap by deleting a design element, and deriving them would have been this application
calculating game values. The library answered — `buildMass()`, `MobilityMetrics.loadedMass` and
`OutfittingModule.supercruiseOvercharge` — and all four are drawn as the ordinary package readings
they are. SC-004 in spec.md states the rule the mass split is held to.

**FR-006 named getters that do not exist.** `unladenMassResult`, `fuelCapacityResult` and
`cargoCapacityResult` are not in the installed package and their absence is deliberate. This was a
specification error rather than a library gap; spec.md carries the correction and it is not part of
the upstream issue.

**FR-006's aggregates are drawn only where the canvas draws them.** The requirement says how an
aggregate is obtained, never that it is drawn. A first pass read it as a licence to add a four-row
"Mass and capacity" group for `unladenMass`, both tanks and `cargoCapacity`; canvas 1c has no such
group, draws no unladen mass and no cargo capacity at all, and names both tanks only in the fuel
row's own qualifier — where that group also printed the main tank a third time on one card. The
group is gone, `cargoCapacity` is off the projection, and spec.md, the reference review and the
capability profile carry the narrowing.

**`RANGE BY LOAD` carries one figure a row, not three.** The package publishes a single jump, a
whole-tank total and a jump count for each of its three loads, and a first pass drew all nine. Canvas
1c draws three rows of one figure each — `UNLADEN 26.8 ly`, `FUELLED 23.5 ly`, `FULL CARGO 15.6 ly` —
and draws the whole tank once, as a `Total range` / `8 JUMPS ON A FULL TANK` row in the legend
underneath, beside `FSD optimal mass` and `Fuel per jump`. Six of those nine figures were readings
the template does not have, and the legend row it does have was missing. The rows now carry the
single jump alone and the legend carries `Total range`, mapped to the package's `totalUnladen`
because the canvas's qualifier names a full tank and no cargo, which is how the package words that
summary. The reference review's adopted-direction lines described the canvas wrongly and are
corrected.

**Feature 005 is a dependency after all.** The plan recorded that it was not, on the grounds that the
package's own mobility diagnostics own thruster power meaning. They do — but the speed envelope is
read at an ENG allocation, and feature 005 is what settles it. This capability reads the settled pips
read-only and publishes no distributor control of its own. The screen-inventory's ownership list and
its FR-004 row have been corrected, along with that row's claim that the load comes from feature 003:
the load is the canvas's own — the `unladen` profile the headline's three rows account for, per
the rename recorded in `design/reference-review.md`.

### What this branch delivered

- the pure projector and its unit suite (`domain/mobility-jump/`), covering the ground T006–T011 set
  out, in one function rather than a store-fed snapshot pipeline;
- the `DrivesMass` component, its template, its styles and its component suite — the ground
  T025–T029 set out, as the one region the canvases draw;
- the `DRIVES` mode in feature 010's anatomy region (T030's intent, at the place the canvas puts it);
- the feature's message keys in both locales, with locale parity and the reviewed-identical-value
  justifications the policy checker requires (T017, T031);
- `e2e/mobility-and-jump.spec.ts` and the four Drives & Mass entries in `e2e/coverage-ledger.ts`,
  with `008-mobility-and-jump` added to `COVERED_FEATURES` so every declared id must stay registered
  (T003, T033); and
- the responsive composition through a container query on the region rather than viewport media
  queries, so 400% zoom and a phone select the stacked arrangement for the same reason (T056).

### What the follow-up branch delivered

The 2026-08-25 canvas revision (T070) brought the rest of the feature's own gates with it, so these
landed beside it rather than waiting for a matrix run nobody had scheduled.

- the boundary rules, as `scripts/policy/mobility-jump-ownership.mjs` and its fixture suite
  `scripts/mobility-jump-ownership.test.mjs`, wired into `pnpm run policy` (T018). The task named
  `check-interface-foundations.mjs`; features 005, 006 and 007 each fence themselves with a
  `scripts/policy/*-ownership.mjs` of their own instead, and this feature follows them. Six rules:
  the leaf subpaths — seven of them rather than the five the task guessed, being what the owned
  files actually import; one call site for all seven `BuildMetrics` answers; the nullable
  `mobilityMetrics()` and `mobilityCapacitorMetrics()` forms and `powerBudget()` never asked at all;
  the three aggregates no canvas draws, checked over the whole of `src/app` rather than this
  feature's own directories, because a rail cell or an exporter putting `TANK 32 T` back on the
  screen is the failure FR-006 is about and it would come from outside; no arithmetic between two
  package figures, caught through a destructure as well as off a dot; and Overcharge read rather
  than inferred. Every division this feature draws carries a `policy-allow:` marker naming the
  SC-002 kind it belongs to — eight of them — so a ninth fails the build.

  Two clauses of T018 are **not** implemented, and are recorded here rather than closed quietly.
  The task asked that no source hard-code a `Thrusters` slot key or match a core module by symbol
  prefix or positional index: `mobility-jump.ts` does name `MainEngines`, `FrameShiftDrive` and
  `Armour` as constants, and those are the game's own slot keys, which AGENTS.md's identities rule
  requires rather than forbids — the clause was written against a `Thrusters` key the package does
  not use. And the task asked that feature 003 import only the exported status contract leaf, which
  has nothing to constrain until T005 and T016 land;

- the offline journey, as `reads Drives & Mass with no network at all` in
  `e2e/offline-privacy.spec.ts` (T062): both cards drawn with the network gone, and the ENG
  allocation changed through feature 005's own control and read back, still offline. It lives beside
  feature 007's identical journey rather than in `e2e/mobility-and-jump.spec.ts`, because a service
  worker is what makes the test mean anything and that file is where the worker fixture is. Two of
  the task's clauses have nothing left to exercise: there is no load to apply — the card reads the
  canvas's own `unladen` profile, not a viewing condition — and no exact slot to open, since neither
  canvas draws the per-module mass list the intent belonged to;
- the ENG-allocation journey the ledger already claimed but no browser test covered — the envelope
  re-read when the allocation moves, and boost unmoved, which is the 0.2.0 split FR-004 records;
- feature 008's rows in both manual records, and step 18 of the screen-reader protocol which they
  are rows against (T064, in part — see below);
- the ledger reconciled with the surfaces as they now stand, including the new offline surface and
  the two new assertions (T065); and
- unit coverage well above the 80% floor across the projector and the region (T066), and the README
  row corrected — it still promised capacities this screen no longer draws (T067).

### What remains

- the feature 003 contract-first exports and the concrete status provider (T004, T005, T016), which
  no canvas draws and which feature 003 still waits on;
- the store, presenter, workspace adapter and serialization-exclusion suite (T012–T014, T019) — the
  component reads the projector directly today;
- nothing for T015 or T060, and nothing for T023's `failure` clause: this region announces nothing
  and has no failure state. Changing a module or a pip changes visible content in place, the control
  reports its own state, and feature 003's ruling A already established that visible content here is
  not live; the projection is synchronous over a loadout already in memory, so a package exception is
  an application defect rather than a screen. Both are feature 005's ruling for the same region, now
  recorded in `design/mobility-and-jump-profile.md` and `design/screen-inventory.md`;
- nothing for T032: the preview manifest holds one declaration per exported `src/app/ui/` component,
  and `DrivesMass` is a feature region rather than a design-system component — the same reason the
  power dashboard has no declaration either. Its states are covered by the Playwright suite;
- the per-module mass list (T010, T044–T055), which neither canvas draws and which spec.md's FR-007
  note now scopes to feature 002's existing ledger;
- **the manual runs themselves (T064).** The protocol step and the rows exist now; every row still
  reads `not run`, because a screen-reader observation needs NVDA on Windows and TalkBack on
  Android and neither can be reached from this repository's Linux container. Features 005, 006 and
  007 are in the same position, and the rows are what makes that visible rather than absent; and
- the remaining polish tasks: the throttled measurement and the full ten-project matrix run
  (T057–T061, T063, T068, T069). The Firefox half of that matrix is CI's: Playwright's Firefox
  build cannot be downloaded from a sandboxed container, so the five Chromium projects are what a
  local run can prove.

Tasks below are marked `[X]` only where this branch delivered them in the design's shape. A task
whose subject the canvases do not draw is left unticked and named above rather than quietly closed.

---

## Delivery gates

Feature 008 owns every jump, mobility, mass and capacity semantic in the application and adds no
calculation of its own. Four gates apply and are named on the tasks they block:

- **Repository prerequisite**: TypeScript `strict` and Angular `strictTemplates` must be enabled in
  the shared configuration and the existing project must pass under them (constitution technology
  requirement, closed by feature 011).
- **Feature prerequisites**: feature 001 (one active `{ loadout, buildRevision }`, no-build state,
  `/build` workspace), feature 002 (exact-slot reveal and editing, package-populated fixed mounts and
  ingress normalization), feature 003 (integer-half-pip `ViewingConditions`, settled
  `conditionsRevision`, `StatusRevisionContext`, generic `StatusProvider<T, I>`, the shared
  `WorkspaceTarget` union, the `mobilityAndJump` detail target and the shared condition control) and
  feature 011 (tokens, components, localization, formatters, game-text presenter, diagnostic
  presenter, announcement primitives, preview manifest, ten Playwright projects, axe helpers).
- **Feature 005's ENG allocation, read-only, and nothing else of feature 005's**: the package's own
  `mobilityMetricsResult()` issues distinguish `thrusters/missing`, `thrusters/disabled`,
  `thrusters/shed`, `thrusters/unresolved` and `powerCapacity`/`powerDraw` failures, and that meaning
  stays the package's. Feature 008 reads the settled ENG pips from feature 005 and passes them to the
  package unchanged — the canvas states them above the speed envelope, so the reading cannot be taken
  without them — and publishes no distributor control of its own. It must not call `powerBudget()`,
  join feature 005's power observations, infer a power cause from a priority band, a plant rating, a
  slot name or a zero value, or pre-gate the mobility call with a locally computed power budget.

  > **Corrected.** This gate previously read "No feature 005 dependency". The prohibitions above are
  > the real ones and are unchanged; the settled pips are a dependency and always were.

- **Contract-first exports**: feature 003's provider bundle waits on this feature's Phase 2 type
  export (T005) and its concrete provider (T016). Those tasks must land before feature 003 can
  assemble the five-provider Status capability; feature 003 never interprets a raw Almanac jump,
  mobility, mass or capacity result itself.

The installed `@elite-dangerous-almanac/core` has no known feature-008 API blocker:
`standardLoadResult()`, `jumpRangeSummary()`, the diagnostic `mobilityMetricsResult()`, the plain
`unladenMass`, `fuelCapacity` and `cargoCapacity` getters — which carry no `CalculationResult` form,
and deliberately so; see FR-006's correction in spec.md — `slots('core')` discriminators and
post-engineering `effectiveStats` are all present in the installed release.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Characterize the package contract this feature projects and create the source and test locations
before any contract lands.

- [ ] T001 Characterize the installed Almanac mobility, jump, mass and slot contract this feature projects — `unladenMassResult`, `fuelCapacityResult` returning exact `{ main, reserve }` and `cargoCapacityResult` as `CalculationResult<T>` values whose incomplete form carries `value: null` and a non-empty ordered `CalculationIssue` tuple with required `field`, `reason` and `message` plus optional `slot`, `symbol` and `params`; `standardLoadResult('maximum' | 'unladen' | 'laden')` returning `CalculationResult<StandardLoadInputs>`; `jumpRangeSummary()` returning `max`, `unladen`, `laden`, `totalMax`, `totalUnladen` and `totalLaden` each with `range` and `jumps`; `frameShiftDrive` returning `FrameShiftDriveParams` including combined `jumpBoost`; `mobilityMetricsResult(StandardLoadInputs & { enginesPips })` returning all seven of `speed`, `boost`, `pitch`, `roll`, `yaw`, `massCurveMultiplier` and `rotationMassCurveMultiplier`; `slots('core')` exposing the `core` discriminators `frameShiftDrive` and `thrusters` with the exact game key `MainEngines` for thrusters; `fittedModules()` exposing exact `slot`, `symbol` and post-engineering `effectiveStats.mass`; and the leaf subpaths `ships/ship-loadout`, `ships/loadout-calculations`, `ships/mobility`, `ships/jump-range` and `ships/modules` — in `src/app/domain/mobility-jump/almanac-mobility-contract.spec.ts`
- [ ] T002 [P] Create the feature source skeleton `src/app/domain/mobility-jump/`, `src/app/application/mobility-jump/` and the `src/app/features/build-workspace/mobility-and-jump/` subdirectories `drives-and-mass-capability/`, `jump-performance/`, `mobility-performance/`, `mass-and-capacity/` and `module-mass-list/` per plan.md
- [x] T003 [P] Create the feature suite `e2e/mobility-and-jump.spec.ts` importing the feature 011 axe helper from `e2e/accessibility/axe.ts` and the semantic assertions from `e2e/accessibility/assertions.ts`, and register the Drives & Mass surfaces in `e2e/coverage-ledger.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Publish the cross-feature contract feature 003 compiles against, then build the pure
revision-stamped projection, the store, the presenter and the repository policy that every surface
reads.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Cross-feature contracts (contract-first exports)

- [ ] T004 [P] Define the snapshot contract — `MobilityJumpSnapshot`, `SelectedMobilityCondition`, `AggregateResults`, `StandardLoad`, `StandardLoadResults`, `GuardedJumpResult`, `MobilityBlocker`, `GuardedMobilityResult`, `CoreModuleSource<TFacts>`, `FrameShiftDriveFacts`, `ThrusterFacts`, `ModuleMass` and `MobilityJumpStoreState` — importing `CalculationIssue`, `CalculationResult`, `FuelCapacity`, `MobilityMetrics`, `FrameShiftDriveParams`, `JumpRangeSummary` and `StandardLoadInputs` verbatim from the installed Almanac leaf subpaths with no narrowed or re-declared package type, in `src/app/domain/mobility-jump/mobility-jump-snapshot.ts`
- [ ] T005 [P] Define `SemanticNumber`, `MobilityStatusProjection` (`selectedLoad`, `jumpRange`, `topSpeed`, `unladenMass`), `MobilityStatusSummaryId` and `MobilityStatusProvider extends StatusProvider<MobilityStatusProjection, 'jumpRange' | 'topSpeed' | 'unladenMass'>` over feature 003's type-only domain leaf `src/app/domain/statistics/status-provider.ts`, documenting the fixed `detailTarget: { kind: 'detail', capability: 'mobilityAndJump' }` and that each unavailable field contributes its own identity to `qualifiedSummaryIds` exactly once, in `src/app/domain/mobility-jump/mobility-status-projection.ts` (contract-first export: unblocks feature 003's provider bundle)

### Pure projection

- [ ] T006 Implement the aggregate and standard-load capture in `projectMobilityAndJump` — read `unladenMassResult`, `fuelCapacityResult`, `cargoCapacityResult`, `standardLoadResult('maximum')`, `standardLoadResult('unladen')` and `standardLoadResult('laden')` exactly once each for one captured `{ loadout, buildRevision }` and settled `{ conditions, conditionsRevision }`, retaining each exact `CalculationResult` with its issue objects, `params` references and package order untouched — with spy-backed unit tests proving one read per getter per projection, that a complete numeric zero stays zero, that an incomplete result keeps `value: null` and its non-empty issue tuple, and that one incomplete aggregate never erases another complete aggregate, in `src/app/domain/mobility-jump/mobility-jump-projector.ts` and `src/app/domain/mobility-jump/mobility-jump-projector.spec.ts` (depends on T004)
- [ ] T007 Implement the guarded jump projection — call `jumpRangeSummary()` exactly once only when all three aggregates and all three standard loads are complete, retain the whole `JumpRangeSummary` and the guarded `frameShiftDrive` record as `{ state: 'ready' }`, and otherwise return `{ state: 'blocked' }` naming each blocking aggregate and standard load in fixed presentation order without flattening, parsing, merging or deduplicating any issue — with unit tests proving no summary call when any single guard is incomplete, one call when all six complete, exact field equality for all six ranges and all three jump counts, a missing or package-incomplete Frame Shift Drive surfacing as the exact incomplete maximum-load issue, active-booster validation flowing through the maximum load, complete zero main fuel yielding package numeric zero, and complete zero cargo leaving laden and unladen equal but separately identified, in `src/app/domain/mobility-jump/mobility-jump-projector.ts` and `src/app/domain/mobility-jump/mobility-jump-projector.spec.ts` (depends on T006)
- [ ] T008 Implement the guarded mobility projection — map feature 003's `maximumJump` to package load `maximum` and `unladen`/`laden` verbatim, divide the settled ENG integer half-pips by two exactly once at the call boundary, and call `mobilityMetricsResult({ ...selectedStandardLoad.value, enginesPips })` exactly once only when `unladenMassResult` and the selected standard load are complete, otherwise returning `{ state: 'blocked', blockedBy }` — with unit tests at loads maximum, unladen and laden and displayed ENG 0, 0.5, 2 and 4 proving one call with the package's own fuel and cargo values, all seven returned fields retained unchanged, an incomplete result keeping `value: null` with its exact ordered issues, `thrusters/missing`, `thrusters/disabled`, `thrusters/shed`, `thrusters/unresolved`, `powerCapacity/*` and `powerDraw/invalid` remaining distinguishable, a complete all-zero result above supported thruster mass staying `result` and never becoming `blocked` or incomplete, and no `powerBudget()` call or hull-catalogue fallback anywhere in the path, in `src/app/domain/mobility-jump/mobility-jump-projector.ts` and `src/app/domain/mobility-jump/mobility-jump-projector.spec.ts` (depends on T006)
- [ ] T009 Implement the core source projection and sparse facts — locate the Frame Shift Drive and thrusters through `slots('core')` by the package `slot.core` discriminator, retain the exact `slot.key`, module `symbol` and optional `on`, emit `{ state: 'empty' }` for an unmounted required slot, and copy only present post-engineering `effectiveStats` fields into `FrameShiftDriveFacts` (`optMass`, `maxFuel`, `fuelMul`, `fuelPower`) and `ThrusterFacts` (`minMass`, `optMass`, `maxMass`, the shared multiplier triple and the optional speed and rotation multiplier triples) — with unit tests proving the thruster key is the package's `MainEngines` rather than a presumed `Thrusters`, that no positional index or symbol-prefix match is used, that absent optional fields stay absent rather than zero-filled, that `on === false` and `on === undefined` remain distinct, and that `jumpBoost` never appears in `FrameShiftDriveFacts`, in `src/app/domain/mobility-jump/mobility-jump-projector.ts` and `src/app/domain/mobility-jump/mobility-jump-projector.spec.ts` (depends on T006)
- [ ] T010 Implement the per-module mass projection — map `fittedModules()` exactly once into one `ModuleMass` per entry in package order carrying the exact original slot key, the exact module symbol and either `{ state: 'ready', value }` equal to `effectiveStats.mass` or `{ state: 'unavailable' }` when effective stats or mass are absent — with unit tests proving engineered mass equals `effectiveStats.mass`, that zero mass stays ready zero, that duplicate symbols in distinct slots remain separate rows, that an import carrying a package-trusted complete `unladenMassResult` beside an unavailable row leaves both package outcomes intact, and that no row is summed, grouped, reconciled or resolved from raw journal modifiers or catalogue base mass, in `src/app/domain/mobility-jump/mobility-jump-projector.ts` and `src/app/domain/mobility-jump/mobility-jump-projector.spec.ts` (depends on T006)
- [ ] T011 Assemble and deeply freeze the `MobilityJumpSnapshot` — stamp the captured `buildRevision` and `conditionsRevision`, record the exact `SelectedMobilityCondition` including both the half-pip and the divided pip value, and freeze the snapshot and every nested collection — with unit tests proving the stamped revisions equal the captured inputs, that every nested array and record is frozen, that no localized string, formatted number or presentation token appears anywhere in the snapshot, and that two projections of the same revision pair produce structurally equal results, in `src/app/domain/mobility-jump/mobility-jump-projector.ts` and `src/app/domain/mobility-jump/mobility-jump-projector.spec.ts` (depends on T007, T008, T009, T010)

### Store, presentation and repository policy

- [ ] T012 Implement `MobilityJumpStore` capturing feature 001's atomic `{ loadout, buildRevision }` and feature 003's settled conditions and `conditionsRevision`, projecting synchronously in a computed signal and publishing `noBuild`, `ready` or `failure` with both revisions on the failure state — with unit tests for each transition, committed edit, undo, redo and active-build replacement advancing the build revision, accepted Apply and Reset advancing the condition revision, invalid feature 003 drafts invoking no projection, locale, disclosure and capability selection changing no revision, and an old snapshot never being republished under new context, in `src/app/application/mobility-jump/mobility-jump.store.ts` and `src/app/application/mobility-jump/mobility-jump.store.spec.ts` (depends on T011)
- [ ] T013 Implement `MobilityJumpPresenter` selecting message keys and active-locale formatters for light-years, metres per second, degrees per second, tonnes, multipliers and integer jump counts, resolving module and slot display text through feature 011's game-text presenter by exact `symbol` and slot key, and rendering each `CalculationIssue` through Almanac's locale message helper with feature 011's disclosed canonical fallback — with unit tests proving no arithmetic, rounding, clamping or re-derivation is applied to any package figure, that issue text is never parsed, merged or privately translated, that ready zero, unavailable, blocked and failure map to four separate phrases, and that a locale change rebuilds presentation without advancing a revision, in `src/app/application/mobility-jump/mobility-jump.presenter.ts` and `src/app/application/mobility-jump/mobility-jump.presenter.spec.ts` (depends on T011)
- [ ] T014 Implement `MobilityWorkspaceAdapter` emitting feature 003's shared `{ kind: 'slot', slotKey }` target with the exact unchanged package key for a module-mass action and exposing the fixed `{ kind: 'detail', capability: 'mobilityAndJump' }` identity, owning no route, query, fragment, history or persisted view state — with unit tests for duplicate symbols in different slots targeting their own keys and for the absence of any route change, in `src/app/application/mobility-jump/mobility-workspace.adapter.ts` and `src/app/application/mobility-jump/mobility-workspace.adapter.spec.ts` (depends on T004)
- [ ] T015 Implement and test the announcement policy — one coalesced polite message per settled build or condition revision naming changed availability and the selected load and ENG context, silence for initial, unchanged, stale and locale-only transitions, no per-field or per-issue live-region burst, no duplicate announcement when feature 002 announces a slot opening, and one feature 011 assertive alert for a current-revision `failure` — in `src/app/application/mobility-jump/mobility-jump-announcements.ts` and `src/app/application/mobility-jump/mobility-jump-announcements.spec.ts` (depends on T012)
- [ ] T016 Implement `MobilityStatusProvider` as a synchronous provider over the exact `StatusRevisionContext` passed by feature 003, invoking the shared pure projector with that context rather than reading the settled store, mapping `jumpRange` from the selected load's single-jump summary field, `topSpeed` from the selected-load `mobility.speed` and `unladenMass` from the exact aggregate independent of load, stamping both input revisions unchanged and returning the fixed detail target — with unit tests proving the three mappings across all three loads, that ready zero stays ready and contributes no qualification, that each unavailable field contributes its identity exactly once and nested issues add no extra identity, that a ready envelope is returned for package-unavailable values, that the provider reads the passed context rather than a store snapshot from another revision, and that an unexpected projector throw propagates to feature 003's `projectionFailed` path, in `src/app/application/mobility-jump/mobility-status.provider.ts` and `src/app/application/mobility-jump/mobility-status.provider.spec.ts` (depends on T005, T011) (contract-first export: unblocks feature 003's provider bundle)
- [x] T017 [P] Add the feature-owned framing message keys — the “Drives” workspace mode label, the “Drives & Mass” capability heading, the read-only selected load and ENG context labels, the maximum, unladen and laden load identities, the total range label and its jump-count qualifier, the blocked-guard and unavailable framing, the ready-zero phrasing, the not-stated phrase for an absent sparse parameter, and the current-revision failure text — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [x] T018 [P] Add the feature 008 boundary rules to `scripts/check-interface-foundations.mjs` — production code imports the Almanac only through the five listed leaf subpaths and never a broad `ships` barrel; no file under `src/app/` outside `src/app/domain/mobility-jump/` calls `jumpRangeSummary`, `mobilityMetricsResult`, `mobilityCapacitorMetricsResult`, `standardLoadResult`, `unladenMass`, `fuelCapacity` or `cargoCapacity`; no arithmetic operator is applied to a package jump, range, count, mass, capacity or curve field outside the curve position's `loadedMass / optMass`, which `BuildMetrics.thrusters()` itself prescribes, and the `aria-hidden` bar lengths in the component; no source references the nullable `mobilityMetrics(` or `mobilityCapacitorMetrics(` convenience methods, or `powerBudget(`, from feature 008 — matched so that the guarded `…Result(` forms and each other are not caught by substring, and the only feature 005 surface it may reach is the settled ENG allocation; no source hard-codes a `Thrusters` slot key or matches a core module by symbol prefix or positional index; and feature 003 imports only the exported status contract leaf and never a feature 008 component, store or presenter — with positive and negative fixtures in `scripts/check-interface-foundations.test.mjs`
- [ ] T019 Add the serialization-exclusion suite proving no `MobilityJumpSnapshot`, package result, guarded jump or mobility state, selected capability, disclosure state or revision pair reaches local storage, saved records, undo/redo history, preferences, the route, query or fragment, a copied build link or a SLEF export, and that no projection object is JSON-cloned, in `src/app/application/mobility-jump/mobility-jump.serialization.spec.ts` (depends on T012)

**Checkpoint**: The status contract, the concrete provider, the pure projection, the store, the
presenter, the workspace adapter and the repository policy exist — feature 003 can compile against
this feature and user story work can begin.

---

## Phase 3: User Story 1 - Read jump performance (Priority: P1) 🎯 MVP

**Goal**: Drives & Mass shows maximum, unladen and laden single-jump range, total range and jump
count together from one guarded `jumpRangeSummary()` call, names the load state and the exact fitted
Frame Shift Drive beside them, keeps a no-usable-drive or package-incomplete input unavailable with
its exact issues, keeps zero main fuel a package numeric zero, and supplies feature 003's selected
jump headline from the same projector.

**Independent Test**: Load a complete build, then builds with an incomplete aggregate, an incomplete
standard load, a missing Frame Shift Drive, zero main fuel and zero cargo, and run the mobility-jump
unit suite plus `pnpm run e2e -- mobility-and-jump.spec.ts`: all nine summary fields equal
`jumpRangeSummary()` for the settled revision, any incomplete guard prevents the call and shows the
exact owning issues with no fabricated number, zero fuel renders as a locale-formatted zero rather
than an empty card, equal unladen and laden profiles remain separately labelled, and feature 003's
Status jump range is identity-equal to the selected detail value and opens the capability through the
`mobilityAndJump` detail target.

### Tests for User Story 1

- [ ] T020 [P] [US1] Add jump performance component tests for three labelled profile groups each naming single range, total range and jump count with units, exact numeric zero retained under zero main fuel, equal unladen and laden values remaining separately labelled, no summary number under any blocked guard, blocking aggregates and standard loads named in fixed order with their exact owning issues, and the absence of any mass factor, percentage-of-optimal, headroom, fuel-per-jump, saved-build delta, bar width or inferred SCO badge, in `src/app/features/build-workspace/mobility-and-jump/jump-performance/jump-performance.component.spec.ts`
- [ ] T021 [P] [US1] Add Frame Shift Drive source tests for the exact package slot key, localized module and slot text with disclosed canonical fallback, `empty`, `on === false` and `on === undefined` states presented distinctly, only present `optMass`, `maxFuel`, `fuelMul` and `fuelPower` rendered with absent facts stated as not present rather than zero, and combined `jumpBoost` labelled as an active-booster/build parameter separate from the fitted drive record, in `src/app/features/build-workspace/mobility-and-jump/jump-performance/frame-shift-drive-source.component.spec.ts`
- [ ] T022 [P] [US1] Add selected-condition context tests for read-only settled load identity and ENG pips rendered before the values they qualify, the absence of any Apply, Reset, draft field or second condition store in this capability, and an old snapshot never being relabelled with new load or pip text, in `src/app/features/build-workspace/mobility-and-jump/drives-and-mass-capability/selected-condition-context.component.spec.ts`
- [ ] T023 [P] [US1] Add capability lifecycle tests for `noBuild` deferring to feature 001's shared workspace state with no package call and no zero stand-ins, `ready` composing the ten-step semantic order of design/mobility-and-jump-profile.md, and `failure` showing feature 011's shared current-revision alert with no stale or estimated numeric value while the active build stays intact and editable, in `src/app/features/build-workspace/mobility-and-jump/drives-and-mass-capability/drives-and-mass-capability.component.spec.ts`
- [ ] T024 [P] [US1] Add the jump performance journey — no build, a complete build compared field-for-field against the live package summary after locale-aware parsing, an incomplete mass, fuel and cargo aggregate, each incomplete standard load, a missing and a package-incomplete drive, an active-booster validation failure, zero main fuel, zero cargo with equal profiles, and feature 003's Status jump headline opening the complete capability in one activation — in `e2e/mobility-and-jump.spec.ts`

### Implementation for User Story 1

- [ ] T025 [US1] Implement `JumpPerformanceComponent` as three labelled semantic definition groups — maximum (one-jump fuel, empty hold), unladen (full main tank, empty hold) and laden (full main tank, full hold) — each naming single range, total range and jump count with localized units, rendering package numeric zero as a number and never duplicating jump values into a second summary block, in `src/app/features/build-workspace/mobility-and-jump/jump-performance/jump-performance.component.ts` and its template and styles (depends on T012, T013)
- [ ] T026 [US1] Implement `FrameShiftDriveSourceComponent` rendering the exact core slot key, localized module and slot text and source state adjacent to the results it qualifies, followed by a sparse definition group of only the present post-engineering parameters and, when shown, the separately labelled combined booster parameter from the guarded record, in `src/app/features/build-workspace/mobility-and-jump/jump-performance/frame-shift-drive-source.component.ts` and its template and styles (depends on T013)
- [ ] T027 [US1] Implement the blocked-guard presentation — replace only the dependent numeric group with localized unavailable framing, associate each blocking aggregate and standard load with its own ordered package issues through the shared diagnostic presenter, and keep every independent available section visible, in `src/app/features/build-workspace/mobility-and-jump/jump-performance/jump-performance.component.ts` and its template (depends on T025)
- [ ] T028 [US1] Implement `SelectedConditionContextComponent` rendering the settled load identity and ENG pips as read-only context before the affected results, composing no feature 003 draft, Apply or Reset control, in `src/app/features/build-workspace/mobility-and-jump/drives-and-mass-capability/selected-condition-context.component.ts` and its template and styles (depends on T013)
- [ ] T029 [US1] Implement the `DrivesAndMassCapabilityComponent` container — capability heading and concise active-build identity, the selected-condition context, the jump region, the announcement region and the three lifecycle states from `MobilityJumpStore`, using nested headings and named regions under the workspace's single `main`/`h1` — in `src/app/features/build-workspace/mobility-and-jump/drives-and-mass-capability/drives-and-mass-capability.component.ts` and its template and styles (depends on T012, T015, T025, T026, T027, T028)
- [ ] T030 [US1] Register Drives & Mass as the `mobilityAndJump` detail capability in the desktop capability selector and the narrow capability navigation, selected in memory through feature 003's workspace target coordinator with no route, query, fragment, history or persistence change, in `src/app/features/build-workspace/build-workspace.ts` and its template (depends on T014, T029)
- [ ] T031 [P] [US1] Add the US1 message keys — the three load identities and their load-state descriptions, single range, total range and jump count labels, the light-year unit, the drive source and slot labels, the four sparse drive parameter labels, the combined booster parameter label, the zero-fuel and blocked-guard phrases and the Status jump headline label — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T032 [P] [US1] Add `JumpPerformanceComponent`, `FrameShiftDriveSourceComponent`, `SelectedConditionContextComponent` and `DrivesAndMassCapabilityComponent` preview declarations covering complete, zero-fuel, zero-cargo, each blocked guard, missing drive, package-incomplete drive, every sparse parameter present and absent, no-build and failure states at 1440×900, 834×1112, 1112×834, 390×844 and 844×390 with long and expanded text, RTL and high-zoom container fixtures, in `src/app/ui/previews/preview-manifest.ts`
- [x] T033 [US1] Add the US1 surfaces, the FR-001, FR-002, FR-003 and FR-008 ids, the Status jump contribution, journeys and axe flags to `e2e/coverage-ledger.ts`

**Checkpoint**: The complete three-profile jump summary, its guard behaviour and feature 003's
selected jump headline are independently demonstrable.

---

## Phase 4: User Story 2 - Read mobility (Priority: P1)

**Goal**: Drives & Mass shows speed, boost, pitch, roll, yaw and both mass-curve multipliers for the
settled load and ENG pips from one guarded `mobilityMetricsResult()` call, keeps missing, disabled,
shed, package-unresolved and power-input failures distinguishable through the package's own issues,
never substitutes hull catalogue values, and supplies feature 003's top-speed headline from the same
projector.

**Independent Test**: Apply each load and ENG 0, 0.5, 2 and 4 in feature 003's Status capability,
then load fixtures with missing, disabled, shed and package-incomplete thrusters, power-capacity and
power-draw issues and a build above the thruster maximum supported mass, and run the mobility-jump
unit suite plus `pnpm run e2e -- mobility-and-jump.spec.ts`: all seven fields equal
`mobilityMetricsResult()` for the settled revision, each unavailable cause is stated in text from the
package's own field and reason, a complete all-zero result above supported mass reads as a ready
package zero rather than unavailable, no hull base speed or rotation appears as a fallback, and
feature 003's Status top speed is identity-equal to the detail value.

### Tests for User Story 2

- [ ] T034 [P] [US2] Add mobility performance component tests for all seven fields rendered with localized units in the fixed semantic order speed, boost, pitch, roll, yaw, mass-curve multiplier and rotation mass-curve multiplier, a complete all-zero result above supported mass presented as ready zero in text and programmatic state, a blocked result naming its own blockers, and the absence of any hull-catalogue fallback, bar width, percentage, curve plot or locally drawn scale, in `src/app/features/build-workspace/mobility-and-jump/mobility-performance/mobility-performance.component.spec.ts`
- [ ] T035 [P] [US2] Add thruster source tests for the exact `MainEngines` package key, localized module and slot text, `empty`, switched-off and unspecified `on` states presented distinctly, and only present shared, speed and rotation multiplier triples plus `minMass`, `optMass` and `maxMass` rendered as a separate sparse definition group with absent facts stated as not present, in `src/app/features/build-workspace/mobility-and-jump/mobility-performance/thruster-source.component.spec.ts`
- [ ] T036 [P] [US2] Add unavailable-state tests proving `thrusters/missing`, `thrusters/disabled`, `thrusters/shed`, `thrusters/unresolved`, `powerCapacity/*` and `powerDraw/invalid` each render their own explicit phrase from the package field and reason in package order, that meaning never depends on colour, bar length, shape or position, and that no feature 005 join, `powerBudget()` call or locally inferred power cause appears in the surface path, in `src/app/features/build-workspace/mobility-and-jump/mobility-performance/mobility-performance.component.spec.ts`
- [ ] T037 [P] [US2] Add the mobility journey — every load at ENG 0, 0.5, 2 and 4 compared field-for-field against the live package result after locale-aware parsing, an invalid feature 003 draft changing no revision and no displayed value, missing, disabled, shed and package-incomplete thrusters, both power-input failures, a resolved build above supported thruster mass showing seven ready zeros, and feature 003's Status top speed matching the detail value — in `e2e/mobility-and-jump.spec.ts`

### Implementation for User Story 2

- [ ] T038 [US2] Implement `MobilityPerformanceComponent` as one semantic definition group presenting all seven returned fields with localized units in the fixed order, rendering package numeric zero as a number qualified only by adjacent source and result state, in `src/app/features/build-workspace/mobility-and-jump/mobility-performance/mobility-performance.component.ts` and its template and styles (depends on T012, T013)
- [ ] T039 [US2] Implement `ThrusterSourceComponent` rendering the exact core slot key, localized module and slot text and source state beside the result it qualifies, followed by the sparse post-engineering curve facts as their own definition group with no bar, scale or interpolated curve, in `src/app/features/build-workspace/mobility-and-jump/mobility-performance/thruster-source.component.ts` and its template and styles (depends on T013)
- [ ] T040 [US2] Implement the mobility unavailable presentation — render each package issue through the shared diagnostic presenter with its own explicit phrase for absent, switched-off, shed, package-unresolved and power-input causes, keep blocked and incomplete visibly distinct from ready zero, and add no hull-catalogue fallback value, in `src/app/features/build-workspace/mobility-and-jump/mobility-performance/mobility-performance.component.ts` and its template (depends on T038)
- [ ] T041 [US2] Compose the mobility region into the capability container after the jump region in the fixed semantic order, keeping one DOM and assistive order at every width, in `src/app/features/build-workspace/mobility-and-jump/drives-and-mass-capability/drives-and-mass-capability.component.ts` and its template (depends on T029, T038, T039, T040)
- [ ] T042 [P] [US2] Add the US2 message keys — speed, boost, pitch, roll, yaw and both multiplier labels, the metres-per-second and degrees-per-second units, the thruster source and slot labels, the twelve sparse curve parameter labels, the five unavailable-cause phrases and the ready-zero-above-supported-mass phrase — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T043 [P] [US2] Add `MobilityPerformanceComponent` and `ThrusterSourceComponent` preview declarations covering complete, ready all-zero, blocked, and each of missing, disabled, shed, package-unresolved, power-capacity and power-draw states, every sparse curve fact present and absent, and all three loads at ENG 0 and 4, at the five layout sizes with long and expanded text, RTL and high-zoom container fixtures, in `src/app/ui/previews/preview-manifest.ts`
- [ ] T044 [US2] Add the US2 surfaces, the FR-004, FR-005 and FR-008 ids, the Status top-speed contribution, journeys and axe flags to `e2e/coverage-ledger.ts`

**Checkpoint**: Selected-load mobility, every unavailable cause and the ready-zero distinction are
independently demonstrable alongside User Story 1.

---

## Phase 5: User Story 3 - Read mass and capacity (Priority: P2)

**Goal**: Drives & Mass shows unladen mass, main and reserve fuel capacity and cargo capacity as
three independent diagnostic results with their exact ordered issues, lists every fitted module's
package-resolved post-engineering mass by exact slot, keeps an unavailable row from becoming zero,
and supplies feature 003's unladen-mass headline from the same aggregate.

**Independent Test**: Load a complete build, a build with each aggregate incomplete independently, a
zero-cargo and zero-main-tank build, an import whose package-trusted aggregate stays complete beside
an unavailable row mass, and a build with duplicate module symbols in distinct slots, then run the
mobility-jump unit suite plus `pnpm run e2e -- mobility-and-jump.spec.ts`: the three aggregates equal
their package results with every issue attached in package order, one incomplete group never hides
another complete group, every `fittedModules()` entry appears exactly once in package order with
`effectiveStats.mass` or an explicit unavailable state, no subtotal, decomposition or reconciliation
delta exists anywhere in the surface, and a module action emits the exact unchanged slot key.

### Tests for User Story 3

- [ ] T045 [P] [US3] Add mass and capacity component tests for three independent labelled result groups with main and reserve fuel as separately labelled values, complete numeric zero staying a number, each incomplete group owning its full ordered issue list, one incomplete group not hiding another complete group, and the absence of any hull/modules/fuel stacked bar, mass-lock value or reconstructed total, in `src/app/features/build-workspace/mobility-and-jump/mass-and-capacity/mass-and-capacity.component.spec.ts`
- [ ] T046 [P] [US3] Add module mass list tests for one row per `fittedModules()` entry in package order with localized module and slot text, the exact slot key and symbol available for diagnosis, ready mass equal to `effectiveStats.mass` including zero, an explicit unavailable row that is never zero or base mass, duplicate symbols remaining distinct by slot, and the absence of any subtotal, group total or delta, in `src/app/features/build-workspace/mobility-and-jump/module-mass-list/module-mass-list.component.spec.ts`
- [ ] T047 [P] [US3] Add exact-slot intent tests proving a module row action emits feature 003's shared `{ kind: 'slot', slotKey }` target with the unchanged package key, that duplicate symbols target their own slots, that the action is a real semantic control with a visible name and the shared minimum touch target, and that feature 008 performs no reveal or edit of its own, in `src/app/features/build-workspace/mobility-and-jump/module-mass-list/module-mass-list.component.spec.ts`
- [ ] T048 [P] [US3] Add the mass and capacity journey — a complete build compared field-for-field against the three live package results after locale-aware parsing, each aggregate incomplete independently, combined issues, zero cargo, zero main tank with a known hull reserve, a package-trusted aggregate beside an unavailable row, duplicate symbols in distinct slots, an engineered row, a zero-mass row, and a module action opening the owning slot through feature 002 — in `e2e/mobility-and-jump.spec.ts`

### Implementation for User Story 3

- [ ] T049 [US3] Implement `MassAndCapacityComponent` as three independent semantic result groups — unladen mass, main and reserve fuel capacity and cargo capacity — each rendering its complete value with the tonne unit or its own localized unavailable framing with the full ordered issue list through the shared diagnostic presenter, in `src/app/features/build-workspace/mobility-and-jump/mass-and-capacity/mass-and-capacity.component.ts` and its template and styles (depends on T012, T013)
- [ ] T050 [US3] Implement `ModuleMassListComponent` as an accessible table or definition list rendering every projected row once in package order with localized module and slot text, exact slot key and symbol where useful for diagnosis, and post-engineering mass or an explicit unavailable state, adding no subtotal, decomposition, reconciliation delta, mass bubble or centre of mass, in `src/app/features/build-workspace/mobility-and-jump/module-mass-list/module-mass-list.component.ts` and its template and styles (depends on T012, T013)
- [ ] T051 [US3] Wire the module row action to `MobilityWorkspaceAdapter` so it emits the shared exact-slot target and feature 002 owns the resulting reveal and edit behaviour, with no duplicate announcement from this feature, in `src/app/features/build-workspace/mobility-and-jump/module-mass-list/module-mass-list.component.ts` and `src/app/application/mobility-jump/mobility-workspace.adapter.ts` (depends on T014, T050)
- [ ] T052 [US3] Compose the mass, capacity and module-mass regions into the capability container after the mobility region in the fixed semantic order, keeping one DOM and assistive order at every width, in `src/app/features/build-workspace/mobility-and-jump/drives-and-mass-capability/drives-and-mass-capability.component.ts` and its template (depends on T041, T049, T050)
- [ ] T053 [P] [US3] Add the US3 message keys — unladen mass, main fuel capacity, reserve fuel capacity and cargo capacity labels, the tonne unit, the module mass table caption and column labels, the slot and symbol diagnostic labels, the unavailable-row phrase and the module action name — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T054 [P] [US3] Add `MassAndCapacityComponent` and `ModuleMassListComponent` preview declarations covering complete, complete-zero, each incomplete aggregate, combined issues, engineered mass, zero mass, unavailable mass, duplicate symbols, a package-trusted aggregate beside an unavailable row and an empty build, at the five layout sizes with long canonical module names, expanded text, RTL and high-zoom container fixtures, in `src/app/ui/previews/preview-manifest.ts`
- [ ] T055 [US3] Add the US3 surfaces, the FR-006 and FR-007 ids, the Status unladen-mass contribution, journeys and axe flags to `e2e/coverage-ledger.ts`

**Checkpoint**: All three user stories are independently functional and feature 003 receives all
three owner-authored mobility summaries.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T056 Implement the responsive composition — canvas 1c's two cards side by side at roomy widths and canvas 1d's stacked pair at narrow ones, chosen from available inline size rather than device-name branching, from one DOM, holding at narrow widths, both landscape phone orientations, 200% text and 400% zoom with no shortened content, no omitted field, issue or sparse fact and no page-level horizontal scrolling — in `src/app/features/build-workspace/outfitting/drives-mass/drives-mass.ts` and its template and styles
- [ ] T057 [P] Run the complete capability in Chromium and Firefox at desktop, tablet portrait and landscape and mobile portrait and landscape with an axe scan over every no-build, ready, failure, blocked-guard, missing-drive, zero-fuel, zero-cargo, missing, disabled, shed, package-unresolved, power-capacity, power-draw, ready-all-zero, incomplete-aggregate, unavailable-row and duplicate-symbol state, in `e2e/mobility-and-jump.spec.ts`
- [ ] T058 [P] Assert 200% text, actual 400% browser zoom, expanded translations, long canonical module names and RTL layout with no lost content, function, result/issue/row association or document horizontal scrolling, and that a wide module-mass table becomes exact-slot cards or scrolls only inside its own labelled container with associations intact, in `e2e/mobility-and-jump.spec.ts`
- [ ] T059 [P] Assert touch operation and shared target-size tokens for every module action and capability navigation control with no overlap at mobile width, that nothing essential depends on hover or `title`, and that `prefers-reduced-motion` changes only transitions and never content, state or announcement timing, in `e2e/mobility-and-jump.spec.ts`
- [ ] T060 [P] Assert one coalesced polite announcement per settled build or condition revision, silence for initial, unchanged, locale-only and discarded stale transitions, no per-issue live-region burst, a single feature 002 announcement for slot opening with no duplicate, and one assertive alert for a current-revision projection failure, in `e2e/mobility-and-jump.spec.ts`
- [ ] T061 [P] Add the locale sweep asserting owned labels, load identities, state text and units come from messages, that light-years, metres per second, degrees per second, tonnes, multipliers, pips and integer jump counts use active-locale formatters, and that module and slot names and calculation issues come from the Almanac by exact symbol and key with disclosed canonical fallback, across every shipped locale and the pseudo-locales in `src/app/i18n/testing/pseudo-locales.ts`, in `e2e/mobility-and-jump.spec.ts`
- [x] T062 [P] Add the offline journey — load the workspace, go offline, open Drives & Mass, apply a new load and ENG allocation in Status, read every region and open an exact slot with no cross-origin request and no capability degradation — in `e2e/mobility-and-jump.spec.ts`
- [ ] T063 Add the in-page settled-status measurement under Chromium CDP `Emulation.setCPUThrottlingRate(4)` at the mobile viewport, asserting every visible jump, mobility, mass and capacity value is published atomically for the same revision pair before the next rendered frame, that one projection performs at most one `jumpRangeSummary()` and one `mobilityMetricsResult()` call and exactly one read of each aggregate and standard-load getter, and that the Status headline and the detail surface hold the identical projected values, in `e2e/mobility-and-jump.spec.ts` (depends on T016)
- [ ] T064 [P] Write and run the versioned NVDA/Firefox desktop, TalkBack/Chromium mobile and tablet screen-reader protocols covering the three user stories — headings and named regions, the read-only condition context, the three jump profile groups, the seven mobility fields, the sparse source definition groups, the three aggregate groups with their owning issues, the module-mass table associations and slot actions, and settled announcements — with result records in `e2e/manual/screen-reader.protocol.md` and `e2e/manual/results/`
- [x] T065 Reconcile the coverage ledger with the feature 008 surfaces, exported components, preview declarations and Playwright project names, and assert every conformance statement covering this capability names the constitutional exclusions "WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11", in `scripts/check-interface-foundations.mjs`. Register the SC-001–SC-003 ids against the named assertions that evidence them in `e2e/coverage-ledger.ts`. (depends on T033, T044, T055)
- [x] T066 Restore unit coverage to at least 80% statements, branches, functions and lines for `src/app/domain/mobility-jump/`, `src/app/application/mobility-jump/` and `src/app/features/build-workspace/mobility-and-jump/` under the thresholds in `angular.json`
- [x] T067 [P] Record the Drives & Mass capability, the absent feature 005 dependency and the out-of-scope route planning, neutron boosts, mass decomposition, headroom, mass lock and centre of mass in `README.md`. _Retargeted 2026-08-25: `AGENTS.md` was cut back to a feature-ownership table and no longer carries per-feature narrative, so this record belongs in `README.md` and in this feature's own `spec.md` and `design/reference-review.md`._
- [ ] T068 Execute every section of `specs/008-mobility-and-jump/quickstart.md` against the reference corpus and fix each divergence
- [ ] T069 Run `pnpm run check` and confirm formatting, strict compilation, policy checks, build, unit coverage, all ten Playwright projects and all axe scans pass with no skipped, focused or quarantined test

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: starts once the feature prerequisites in Delivery gates are available
- **Foundational (Phase 2)**: depends on Phase 1 and blocks every user story; T005 and T016 also
  unblock feature 003's provider bundle
- **User stories (Phases 3–5)**: all depend on Phase 2 and can then proceed in parallel or in
  priority order US1 → US2 → US3
- **Polish (Phase 6)**: depends on every delivered story

### User story dependencies

- **US1 (P1)**: depends only on Phase 2. It creates the capability container and registers the
  `mobilityAndJump` detail target that US2 and US3 compose into
- **US2 (P1)**: depends only on Phase 2 for its own components; its composition task T041 touches the
  container first created in T029
- **US3 (P2)**: depends only on Phase 2 for its own components; its composition task T052 touches the
  same container and therefore follows T041 rather than running beside it

### Within each user story

- Tests are written first and must fail before implementation
- Domain projection before store, store before presenter and adapters, components before workspace
  composition
- Message keys and preview declarations ship with their component, never as follow-up work

### Parallel opportunities

- Phase 1: T002 and T003 run together
- Phase 2: T004 and T005 run together; T007–T010 all extend the same projector file and therefore run
  sequentially after T006; T012, T013 and T014 run together once T011 lands; T017 and T018 run
  alongside them
- Phase 3: T020–T024 run together; T031 and T032 run together
- Phase 4: T034–T037 run together; T042 and T043 run together
- Phase 5: T045–T048 run together; T053 and T054 run together
- Phase 6: T057–T062, T064 and T067 run together
- Across teams: once Phase 2 completes, one developer takes US1 while another takes US2 and US3; only
  the three capability-container composition tasks need serializing

## Parallel Example: User Story 1

```bash
# Launch the failing tests together:
Task: "Jump performance tests in src/app/features/build-workspace/mobility-and-jump/jump-performance/jump-performance.component.spec.ts"
Task: "Frame Shift Drive source tests in src/app/features/build-workspace/mobility-and-jump/jump-performance/frame-shift-drive-source.component.spec.ts"
Task: "Selected condition context tests in src/app/features/build-workspace/mobility-and-jump/drives-and-mass-capability/selected-condition-context.component.spec.ts"
Task: "Capability lifecycle tests in src/app/features/build-workspace/mobility-and-jump/drives-and-mass-capability/drives-and-mass-capability.component.spec.ts"
Task: "Jump performance journey in e2e/mobility-and-jump.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — this blocks everything and unblocks feature 003
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: all nine summary fields match `jumpRangeSummary()` by identity, no summary
   call survives an incomplete guard, zero fuel renders as package zero, equal profiles stay
   separately labelled, feature 003's Status jump range equals the selected detail value, and the
   capability passes axe in all ten projects
5. A Commander can read complete jump performance and open the capability from Status at this point

### Incremental Delivery

1. Setup + Foundational → the status contract, the concrete provider, the pure projection, the store,
   the presenter, the workspace adapter and the repository policy
2. Add US1 → the three-profile jump summary, the drive source facts, the guard behaviour and feature
   003's jump headline (MVP)
3. Add US2 → the seven selected-load mobility fields, the thruster source and curve facts, every
   unavailable cause and feature 003's top-speed headline
4. Add US3 → the three aggregate diagnostics, every exact-slot module mass and feature 003's
   unladen-mass headline
5. Polish → the responsive, accessible, localized, offline and performance gates and a green
   `pnpm run check`

### Constitutional Guardrails

- No task calculates, sums, subtracts, divides, clamps, rounds, interpolates, re-derives or
  reclassifies a package jump, range, count, mass, capacity, standard-load, curve, multiplier or
  power figure; the single permitted arithmetic operation in this feature is dividing the settled
  integer ENG half-pips by two while constructing the mobility options
- No task creates an optimal-mass percentage, headroom, mass factor, fuel-per-jump figure, hull /
  modules / fuel decomposition, module subtotal, reconciliation delta, saved-build comparison, mass
  lock value, centre of mass or bar-derived value; those results are out of scope because the package
  does not return them for a build
- No task substitutes a hull catalogue speed, rotation or base mass, a raw journal modifier, a
  `mobilityMetrics()` nullable call, a `powerBudget()` check, a feature 005 join, a symbol or slot
  parse, a positional index or an inferred cause for a package result, and no package zero or `null`
  receives a local diagnosis
- No task narrows, flattens, merges, deduplicates, reorders or privately translates a
  `CalculationIssue`, drops its optional `slot`, `symbol` or `params`, or converts an incomplete
  result, an absent optional parameter or an unavailable row into zero
- No task infers SCO capability from a module name or symbol, attributes the combined `jumpBoost` to
  the fitted drive record, or hard-codes a `Thrusters` slot key in place of the package's own key
- No task adds a backend, account, telemetry, cross-origin runtime request, second `ShipLoadout`,
  extra route, persisted derived result, private game-text translation or viewing-condition store,
  draft or Apply/Reset control of its own
- No task lowers the 80% coverage thresholds, drops a browser, viewport or orientation project, or
  skips a test to reach a green build

## Notes

- [P] tasks touch different files and have no incomplete dependency
- Every component task includes its unit test, its required-state preview declarations and its
  message keys; none of the three is a follow-up
- Commit after each task or logical group; stop at a checkpoint to validate a story independently

---

## Phase: the 2026-08-25 canvas revision

Canvas 1d was redrawn as canvas 1c's two cards, which is what this feature already builds from one
DOM — so almost none of the revision reaches it. Two items do.

- [x] T070 Cut the fuel row's qualifier to the canvas's `TANK` and stop reading `fuelCapacity`
      altogether: it is no longer drawn anywhere, and a package field no canvas draws is not read
      (`design/reference-review.md`, amendment of 2026-08-25). Withdraw
      `drives.thrusters.fuel.tanks` from both catalogues. The row's own figure is untouched — it is
      the fuel part of the one `buildMass(load)` answer
- [ ] T071 Re-run the feature's e2e specs in all ten projects with the axe scan, then
      `pnpm run check`

### What the revision confirms rather than changes

Canvas 1d gained `ROLL`, the mass bar's `OPTIMAL 1,260 t` / `MAX 1,890 t` ticks, the hull/modules/fuel
legend with its qualifiers, the `JUMP LADEN` / `JUMP UNLADEN` / `MASS LOCK` trio, the `SCO` badge, the
fitted-drive identity, and the `FSD optimal mass` / `Fuel per jump` / `Total range` legend — every one
of them already built and already drawn at both widths from one DOM. `658 T HEADROOM` and the
`CURRENT` range row survive in the drawing and stay out of scope for the reason already recorded:
this application has no package result or viewing condition to state either.
