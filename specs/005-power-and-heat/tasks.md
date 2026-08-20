---
description: 'Task list for Power and Heat'
---

# Tasks: Power and Heat

**Input**: Design documents from `/specs/005-power-and-heat/`

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
`src/app/domain/power-heat/`, signal stores and adapters in `src/app/application/power-heat/`,
surfaces in `src/app/features/build-workspace/power-and-heat/`, shared primitives and previews in
`src/app/ui/`, messages and formatters in `src/app/i18n/`, end-to-end suites in `e2e/`, repository
policy checks in `scripts/`. Unit tests live beside their source as `*.spec.ts`.

## Delivery gates

Feature 005 owns every power, distributor and heat semantic in the application and adds no
calculation of its own. Three gates apply and are named on the tasks they block:

- **Repository prerequisite**: TypeScript `strict` must be enabled in the shared configuration and
  the existing project must pass under it before this feature's implementation is complete
  (constitution technology requirement, closed by feature 011).
- **Feature prerequisites**: feature 001 (one active `ShipLoadout`, numeric build revision, no-build
  state, `/build` workspace), feature 002 (committed-edit revision advance, exact-slot reveal and
  editing), feature 003 (integer-half-pip `ViewingConditions`, draft/Apply/Reset, condition revision,
  `StatusProvider<T, I>`, `powerAndHeat` detail target and the shared condition control) and feature
  011 (tokens, components, localization, formatters, game-text presenter, announcement primitives,
  preview manifest, ten Playwright projects, axe helpers).
- **Contract-first exports**: feature 003's provider bundle, feature 007's distributor endurance and
  feature 010's anatomy wait on this feature's Phase 2 type exports (T005, T006). Those two tasks
  must land before a consumer can compile against a concrete power contract. An absent consumer is a
  sequencing dependency — never a reason to let features 003, 007 or 010 read raw power fields.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Characterize the package contract this feature projects and create the source and test locations
before any contract lands.

- [ ] T001 Characterize the installed Almanac power, distributor and heat contract this feature projects — `powerBudget()` returning `available`, `deployed`, `retracted`, `headroom`, `utilisation`, `withinBudget`, five bands carrying `priority`, `deployed`, `retracted`, `deployedTotal`, `retractedTotal`, `poweredDeployed` and `poweredRetracted`, and `consumers` carrying `label`, `symbol`, `draw`, `enabled`, `priority` and `deployedOnly`; `distributorMetrics(DistributorOptions)` accepting independent `0..4` fractional pips, echoing `pips` and returning `null` versus SYS/ENG/WEP `capacity`, `ratedRecharge` and `rechargeRate`; `heatMetrics()` accepting no options and returning `null` versus `heatEfficiency`, `hullHeatCapacity`, `hullHeatDissipation` and exactly the five `HeatState` scenarios with `Infinity` heat level or gauge and `null` `secondsToOverheat`; and the leaf subpaths `ships/ship-loadout`, `ships/power`, `ships/distributor` and `ships/heat` — in `src/app/domain/power-heat/almanac-power-heat-contract.spec.ts`
- [ ] T002 [P] Create the feature source skeleton `src/app/domain/power-heat/`, `src/app/application/power-heat/` and the `src/app/features/build-workspace/power-and-heat/` subdirectories `power-and-heat-capability/`, `power-budget/`, `module-power-breakdown/`, `heat-profile/` and `distributor-performance/` per plan.md
- [ ] T003 [P] Create the feature suite `e2e/power-and-heat.spec.ts` importing the feature 011 axe helper from `e2e/accessibility/axe.ts` and the semantic assertions from `e2e/accessibility/assertions.ts`, and register the Power and Heat surfaces in `e2e/coverage-ledger.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Publish the cross-feature contracts features 003, 007 and 010 compile against, then the
pure revision-stamped projection and the store every surface reads.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Cross-feature contracts (contract-first exports)

- [ ] T004 [P] Define the semantic unions `PowerPriority`, `DeploymentState`, `CapacitorKind`, `HeatScenarioKey`, `UtilisationValue`, `HeatLevelValue` and `OverheatTime` with the pure constructors that map package `Infinity` utilisation to `drawWithZeroAvailableOutput`, `Infinity` heat level or gauge to `doesNotSettle` and `null` `secondsToOverheat` to `neverOverheats`, and unit tests covering finite, zero, negative, infinite and null inputs and the independence of the three sentinels, in `src/app/domain/power-heat/semantic-metric-value.ts` and `src/app/domain/power-heat/semantic-metric-value.spec.ts`
- [ ] T005 [P] Define `PowerStatusProjection` (`hardpointState`, `available`, `selectedDraw`) and `PowerStatusProvider extends StatusProvider<PowerStatusProjection, never>` over feature 003's type-only domain leaf, documenting the fixed `detailTarget: { kind: 'detail', capability: 'powerAndHeat' }` and the permanently empty `qualifiedSummaryIds`, in `src/app/domain/power-heat/power-status-projection.ts` (contract-first export: unblocks feature 003's provider bundle)
- [ ] T006 [P] Define the `MountPowerObservation` union (`notApplicable`, `disabled`, `inactiveRetracted`, `powered`, `shed`, `unavailable` with package-normalized one-based priority), `MountPowerObservationRead` carrying both revisions, the exact slot key and the explicit observed `deploymentState`, and `MountPowerObservationPort.observe(context, slotKey, deploymentState)` accepting any package slot key including hardpoint, utility and core-internal mounts plus an explicit `deployed | retracted` request, in `src/app/domain/power-heat/mount-power-observation.ts` (contract-first export: unblocks feature 007 T006 and feature 010 T012)

### Pure projection

- [ ] T007 Define `PowerHeatProjectionState`, `PowerHeatProjection`, `PowerHeatSnapshot`, the owner-private revision-keyed `MountPowerObservationIndex` and entry retaining exact slot/symbol, enabled, normalized priority, deployed-only and both package band verdicts, `PowerBudgetView`, `DeployedPowerSummary`, `PowerBandView`, `ModulePowerCollection`, `ModulePowerView`, `DistributorView`, `ReturnedPips`, `CapacitorView`, `HeatProfileView` and `HeatScenarioView` exactly as specified in data-model.md, with no retracted variant of `DeployedPowerSummary` and no observation index exposed through the published snapshot or consumer contract, in `src/app/domain/power-heat/power-heat-projection.ts` (depends on T004)
- [ ] T008 Implement `projectPowerBudget(budget, hardpointState)` selecting `deployed`/`retracted`, `deployedTotal`/`retractedTotal` and `poweredDeployed`/`poweredRetracted` per band, always copying `available`, and attaching `headroom`, `utilisation` and `withinBudget` only under `deployed`, with unit tests asserting field-for-field equality for both states, all five bands including a zero-draw band, and the absence of every retracted summary field, in `src/app/domain/power-heat/power-heat-projection.ts` and `src/app/domain/power-heat/power-heat-projection.spec.ts` (depends on T007)
- [ ] T009 Implement `projectModulePower(budget)` producing one row per `PowerConsumerResult` with exact `label`, `symbol`, `draw`, `enabled`, normalized priority, deployed-only state and source ordinal plus an owner-private observation index keyed by the exact label and retaining the matching band's exact `poweredDeployed` and `poweredRetracted` verdicts, retaining disabled consumers, never merging identical symbols and never fabricating an absent passive or zero-draw fitting, with unit tests for duplicate symbols in different slots, disabled rows, deployed-only rows, divergent deployed/retracted verdicts, and a missing label, symbol or matching priority band raising the projection-failure path, in `src/app/domain/power-heat/power-heat-projection.ts` and `src/app/domain/power-heat/power-heat-projection.spec.ts` (depends on T008 because they share both files)
- [ ] T010 Implement `projectDistributor(loadout, conditions)` dividing each integer half-pip by two exactly once while constructing `DistributorOptions`, calling `distributorMetrics()` once, mapping `null` to `unavailable` with no capacitor figures and mapping a ready result to returned pips plus SYS, ENG and WEP `capacity`, `ratedRecharge` and `rechargeRate` in that order, with unit tests for `4/4/4`, `8/0/4` and the fractional `1/4/7` half-pips, a genuine zero recharge, an echoed pip set and a null result carrying no inferred cause, in `src/app/domain/power-heat/power-heat-projection.ts` and `src/app/domain/power-heat/power-heat-projection.spec.ts` (depends on T009 because they share both files)
- [ ] T011 Implement `projectHeat(loadout)` calling `heatMetrics()` once per build revision, mapping `null` to `unavailable` and a ready result to `heatEfficiency`, `hullHeatCapacity`, `hullHeatDissipation` and exactly `idle`, `thrusters`, `fsdCharging`, `firingSustained` and `firingDrained` with all five `HeatState` fields, with unit tests for the fixed order, a no-weapons build retaining five scenarios, infinite heat level, infinite gauge, null seconds to overheat and a package null profile, in `src/app/domain/power-heat/power-heat-projection.ts` and `src/app/domain/power-heat/power-heat-projection.spec.ts` (depends on T010 because they share both files)
- [ ] T012 Implement `projectPowerHeat(context)` composing one immutable `PowerHeatProjection` from a single retained `powerBudget()` result — the published `PowerHeatSnapshot` plus its owner-private dual-band mount observation index — together with the distributor and heat projections, stamping the captured `buildRevision`/`conditionsRevision` pair, rechecking the pair before returning and emitting `failure` with `projectionFailed` only for an unexpected exception, a missing required consumer identity/band or a revision-contract violation, in `src/app/domain/power-heat/power-heat-projection.ts` (depends on T008, T009, T010, T011)
- [ ] T013 Add the projection contract suite asserting `powerBudget()` is called exactly once per revision context while the published selected view and private observation index use that identical result, the index retains opposite `poweredDeployed`/`poweredRetracted` verdicts for a divergent band, package `null` distributor and `null` heat remain data inside a `ready` snapshot rather than `failure`, heat is unchanged by a hardpoint or pip change, pips change only the distributor view, a newer revision discards an older outcome and no view field is derived from another, in `src/app/domain/power-heat/power-heat-projection.contract.spec.ts` (depends on T012)

### Store, presentation and repository policy

- [ ] T014 Implement `PowerHeatStore` capturing feature 001's atomic `{ loadout, buildRevision }` and feature 003's settled `{ conditions, conditionsRevision }`, memoizing the complete `PowerHeatProjection` by that revision pair in one computed signal, publishing only the snapshot as `noBuild`, `pending`, `ready` or `failure`, and exposing the matching owner-private observation index only to feature 005's adapter, with unit tests for each state, for rapid interleaved build and condition changes, for exact revision-keyed index access and for the refusal to publish or serve a stale pair, in `src/app/application/power-heat/power-heat.store.ts` and `src/app/application/power-heat/power-heat.store.spec.ts` (depends on T012)
- [ ] T015 Implement `PowerHeatPresenter` selecting message keys, active-locale formatters and the optional draw-descending module order with source ordinal as the stable tie break, performing no arithmetic on any package figure, with unit tests for tie-break stability, sentinel-to-message mapping and MW/MJ/MJ·s⁻¹/percentage/second unit selection, in `src/app/application/power-heat/power-heat.presenter.ts` and `src/app/application/power-heat/power-heat.presenter.spec.ts` (depends on T012)
- [ ] T016 Implement `PowerHeatAnnouncementCoordinator` emitting one coalesced polite message for a settled build or condition change that names the changed state, staying silent for pending, unchanged, discarded and invalid-draft transitions and using the shared prompt alert only for `failure`, with unit tests for initial silence, changed, unchanged, coalesced and stale cases, in `src/app/application/power-heat/power-heat-announcement-coordinator.ts` and `src/app/application/power-heat/power-heat-announcement-coordinator.spec.ts` (depends on T014)
- [ ] T017 [P] Add the feature-owned framing message keys — capability heading and description, the `projectionFailed` application-failure text, the distributor and heat unavailable statements, the retracted deployed-only-summary explanation, and the three semantic sentinel phrases “draw with zero available plant output”, “does not settle” and “never overheats” — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T018 [P] Add the feature 005 boundary rules to `scripts/check-interface-foundations.mjs` — production code imports the Almanac only through the four listed leaf subpaths, no file under `src/app/` outside `src/app/domain/power-heat/` calls `powerBudget`, `distributorMetrics` or `heatMetrics`, no arithmetic operator is applied to a package power/heat field outside the single half-pip division, and features 003, 007 and 010 import only the exported contract leaves and never a feature 005 component or store — with positive and negative fixtures in `scripts/check-interface-foundations.test.mjs`
- [ ] T019 Add the serialization-exclusion suite proving no `PowerHeatProjection`, owner-private observation index, `PowerHeatSnapshot`, view, sentinel or revision pair reaches local storage, saved records, undo/redo history, preferences, the route, query or fragment, a copied build link or a SLEF export, and that no projection object is JSON-cloned, in `src/app/application/power-heat/power-heat.serialization.spec.ts` (depends on T014)

**Checkpoint**: The cross-feature contracts, the pure projection, the store and the repository policy
exist — features 003, 007 and 010 can compile against this feature and user story work can begin.

---

## Phase 3: User Story 1 - Understand the power budget (Priority: P1) 🎯 MVP

**Goal**: The Power and Heat capability shows plant capacity and the selected hardpoint state's total
draw together, defaults to deployed, lets the Commander switch to retracted through feature 003's one
shared control, presents all five priority bands with their draw, cumulative draw and powered
verdict, lists every returned power consumer with its exact slot, enabled, priority and deployed-only
state, reaches that slot in one interaction, and supplies feature 003's compact power projection plus
feature 005's generalized exact-slot mount observation for feature 010's hardpoints/utilities and
feature 007's distributor core slot from the same result.

**Independent Test**: Load a fixture whose deployed draw sheds a lower band while its retracted draw
does not, then run the power-heat unit suite plus `pnpm run e2e -- power-and-heat.spec.ts`: capacity,
selected total, every band field and every consumer field equal the `powerBudget()` result for the
settled revision pair, retracted omits headroom, utilisation and within-budget with a localized
deployed-only explanation, a disabled consumer stays visible, a zero-capacity build with positive
draw reads as draw with zero available plant output, and one activation of a module row reveals its
exact returned slot.

### Tests for User Story 1

- [ ] T020 [P] [US1] Add power summary tests for adjacent capacity and selected draw, the deployed headroom, utilisation and within-budget group, the retracted omission with its localized explanation, exact zero capacity with zero draw as numeric zero and exact zero capacity with positive draw as the semantic sentinel, in `src/app/features/build-workspace/power-and-heat/power-budget/power-budget-summary.spec.ts`
- [ ] T021 [P] [US1] Add priority-band tests for all five bands in returned order, a retained zero-draw band, own draw, cumulative draw and textual powered verdict for both hardpoint states, and powered, shed and disabled meaning that never depends on colour, fill, pattern or position, in `src/app/features/build-workspace/power-and-heat/power-budget/priority-band-collection.spec.ts`
- [ ] T022 [P] [US1] Add module breakdown tests for one row per returned consumer, exact slot and symbol identity, localized package name with canonical-fallback disclosure and unavailable framing, exact draw, enabled, priority and deployed-only state, a deployed-only row labelled inactive under retracted without a substituted zero, unmerged identical symbols, draw-descending order with source-ordinal ties and one distinctly named exact-slot action per row, in `src/app/features/build-workspace/power-and-heat/module-power-breakdown/module-power-breakdown.spec.ts`
- [ ] T023 [P] [US1] Add capability lifecycle tests for `noBuild` deferring to feature 001's workspace empty state with no package call, `pending` showing no stale mixed values for the current revision pair, `ready` composition order and `failure` using the feature 011 prompt-error pattern while the active build stays intact and editable, in `src/app/features/build-workspace/power-and-heat/power-and-heat-capability/power-and-heat-capability.spec.ts`
- [ ] T024 [P] [US1] Add power status adapter tests asserting the returned `hardpointState`, `available` and `selectedDraw` equal the detail projection for the identical revision pair, `qualifiedSummaryIds` is empty, `detailTarget` is exactly `{ kind: 'detail', capability: 'powerAndHeat' }`, a retracted selection requires no deployed-only field, zero capacity and zero draw stay exact, an unavailable distributor or heat does not affect the provider and an unexpected exception propagates to feature 003's failure boundary, in `src/app/application/power-heat/power-status.adapter.spec.ts`
- [ ] T025 [P] [US1] Add mount power observation adapter tests covering hardpoint, utility and core-internal slot keys, a current revision whose private index is still pending as `unavailable`, an absent consumer in a ready exact-revision index as `notApplicable`, a failed projection propagating rather than being relabelled unavailable, a disabled consumer as `disabled`, requested retracted plus package `deployedOnly` as `inactiveRetracted`, the matching band's explicitly requested deployed/retracted boolean as `powered` or `shed`, and a divergent-band fixture where `poweredDeployed` and `poweredRetracted` differ and each request returns its own verdict, with package-normalized one-based priority on every carrying variant, the requested `deploymentState` and both revisions on every read, and the refusal to match by index, name, symbol prefix or display string, in `src/app/application/power-heat/mount-power-observation.adapter.spec.ts`
- [ ] T026 [P] [US1] Add the power journey — no build, pending, deployed default at `2/2/2`, every capacity, total, band and consumer field against the package result, a switch to retracted through the shared Apply, the omitted deployed-only summaries with their explanation, a disabled consumer, a zero-capacity build, a deployed-only row under retracted and one-interaction exact-slot reveal at wide widths and the selected-slot surface with a named return action at narrow widths — in `e2e/power-and-heat.spec.ts`

### Implementation for User Story 1

- [ ] T027 [US1] Implement `PowerBudgetSummary` as a semantic definition group of plant capacity and selected total draw, adding the deployed headroom, utilisation and within-budget definitions only under `deployed` and the localized deployed-only explanation under `retracted`, and rendering `drawWithZeroAvailableOutput` as its own message rather than a number, in `src/app/features/build-workspace/power-and-heat/power-budget/power-budget-summary.ts` and its template and styles (depends on T007, T015)
- [ ] T028 [US1] Implement `PriorityBandCollection` rendering all five bands as a semantic table where the inline size allows and equivalent labelled cards when stacked, each carrying own draw, cumulative draw and textual powered verdict with no derived field and any bar treated as a supplement to complete nearby text, in `src/app/features/build-workspace/power-and-heat/power-budget/priority-band-collection.ts` and its template and styles (depends on T007, T015)
- [ ] T029 [US1] Implement `ModulePowerBreakdown` rendering one row per returned consumer with the feature 011 game-text presenter for the module name, exact slot, draw, enabled, priority and deployed-only state, and one exact-slot action whose visible and accessible name distinguishes module and slot and uses the shared target-size token, in `src/app/features/build-workspace/power-and-heat/module-power-breakdown/module-power-breakdown.ts` and its template and styles (depends on T007, T015)
- [ ] T030 [US1] Implement `PowerHeatAnnouncer` as a visually hidden polite region bound to `PowerHeatAnnouncementCoordinator`, never `role="alert"` for a settled change, in `src/app/features/build-workspace/power-and-heat/power-and-heat-capability/power-heat-announcer.ts` (depends on T016)
- [ ] T031 [US1] Implement the `PowerAndHeatCapability` container — capability heading and concise active-build context, feature 003's shared viewing-condition group composed without a second draft or pip store, the power summary, the priority bands, the module breakdown and the four lifecycle states from `PowerHeatStore` — in `src/app/features/build-workspace/power-and-heat/power-and-heat-capability/power-and-heat-capability.ts` and its template and styles (depends on T014, T027, T028, T029, T030)
- [ ] T032 [US1] Register Power and Heat as the `powerAndHeat` detail capability in the desktop capability selector and the narrow capability navigation, selected in memory through feature 003's workspace target coordinator with no route, query, fragment, history or persistence change, in `src/app/features/build-workspace/build-workspace.ts` and its template (depends on T031)
- [ ] T033 [US1] Implement `PowerStatusAdapter` and its injection token, selecting the store's projection for the exact context and returning the revision-stamped `PowerStatusProjection` with the fixed detail target and empty qualified summaries, in `src/app/application/power-heat/power-status.adapter.ts` (depends on T005, T014)
- [ ] T034 [US1] Implement `MountPowerObservationAdapter` and its injection token over the store's owner-private observation index for the exact revision pair, resolving the exact slot key through the ordered selection rules for hardpoint, utility and core-internal keys alike, returning `unavailable` only while the current revision's index is pending, returning `notApplicable` for an exact key absent from a ready index, propagating a failed projection, and otherwise selecting the retained `poweredDeployed` or `poweredRetracted` verdict from the explicit requested `deploymentState` rather than the context's selected viewing state without calling `powerBudget()` again, then stamping the requested state plus both revisions on every read, in `src/app/application/power-heat/mount-power-observation.adapter.ts` (depends on T006, T014)
- [ ] T035 [US1] Wire both adapters through application composition so feature 003 receives the status provider and features 007 and 010 receive the same generalized `MountPowerObservationPort`, feature 007 requests `deployed` and feature 010 requests `context.conditions.hardpoints`, with no runtime circular dependency between domain modules, in `src/app/application/power-heat/power-heat.providers.ts` (depends on T033, T034)
- [ ] T036 [P] [US1] Add the US1 message keys — capability heading, plant capacity, selected draw, headroom, utilisation, within-budget and its verdicts, hardpoint state names, priority band and cumulative draw labels, powered, shed, disabled, deployed-only and inactive-retracted state text, module and slot column names and the exact-slot action pattern — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T037 [P] [US1] Add `PowerBudgetSummary`, `PriorityBandCollection`, `ModulePowerBreakdown`, `PowerHeatAnnouncer` and `PowerAndHeatCapability` preview declarations covering populated, retracted-omission, zero-output, disabled, deployed-only, no-consumer, pending and failure states at 1440, 834 and 390 CSS pixels with long and expanded text, RTL and high-zoom container fixtures, in `src/app/ui/previews/preview-manifest.ts`
- [ ] T038 [US1] Add the US1 surfaces, FR-001–FR-006 and FR-011 ids, the compact status and mount power observation contributions, journeys and axe flags to `e2e/coverage-ledger.ts`

**Checkpoint**: The power budget, priority shedding and module contributions are independently
demonstrable, and features 003, 007 and 010 receive owner-authored power semantics.

---

## Phase 4: User Story 2 - Read distributor performance (Priority: P2)

**Goal**: SYS, ENG and WEP each show the returned allocation, capacity, rated recharge and actual
recharge for the settled pips; a pip change alters only recharge; and a package `null` result stays
unavailable with no catalogue substitute or inferred cause.

**Independent Test**: Run the distributor unit suite plus `pnpm run e2e -- power-and-heat.spec.ts`:
every displayed field equals `distributorMetrics()` for the settled revision pair, integer half-pips
divide by two only at the package call, a zero-pip recharge reads as numeric zero, an invalid draft
retains the prior settled result without calling the package, and a null result renders one
unavailable group while power and heat stay usable.

### Tests for User Story 2

- [ ] T039 [P] [US2] Add distributor tests for SYS, ENG and WEP order, allocation used, capacity, rated recharge and actual recharge as labelled text at every width, displayed pips taken from the returned result rather than reconstructed from the draft, genuine zero recharge, unchanged capacity across pip changes and the single unavailable group with no capacitor figures, in `src/app/features/build-workspace/power-and-heat/distributor-performance/distributor-performance.spec.ts`
- [ ] T040 [P] [US2] Extend `e2e/power-and-heat.spec.ts` with the distributor journey — default `2/2/2` displayed pips, valid reallocations including zero for each capacitor, invalid range, step and total drafts retaining the prior settled result and exposing the shared localized error relationships, a package-null distributor including the retracted-shed case, and the coalesced polite announcement for one accepted change

### Implementation for User Story 2

- [ ] T041 [US2] Implement `DistributorPerformance` rendering the three capacitor groups as definitions of allocation, capacity, rated recharge and actual recharge with distinct visual and programmatic meaning for genuine zero and package unavailable, in `src/app/features/build-workspace/power-and-heat/distributor-performance/distributor-performance.ts` and its template and styles (depends on T010, T015)
- [ ] T042 [US2] Compose the distributor region after heat in the semantic order of `PowerAndHeatCapability`, placing the shared condition control beside or before the capacitor groups where inline space permits and stacking it above them otherwise, in `src/app/features/build-workspace/power-and-heat/power-and-heat-capability/power-and-heat-capability.ts` and its template and styles (depends on T031, T041)
- [ ] T043 [P] [US2] Add the US2 message keys — SYS, ENG and WEP capacitor names, allocation, capacity, rated recharge and actual recharge labels, the MJ and MJ per second unit patterns and the distributor unavailable statement — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T044 [P] [US2] Add `DistributorPerformance` preview declarations for the populated three-capacitor state, package unavailable, zero-pip recharge, pending and unexpected failure at all three widths with decimal-comma and expanded-label locale fixtures, in `src/app/ui/previews/preview-manifest.ts`
- [ ] T045 [US2] Add the US2 surfaces and FR-007 and FR-008 ids with their half-pip boundary, zero and unavailable assertions to `e2e/coverage-ledger.ts`

**Checkpoint**: Distributor performance is complete, exact and independently demonstrable while the
rest of the capability stays usable.

---

## Phase 5: User Story 3 - Understand heat (Priority: P2)

**Goal**: Plant heat efficiency and hull heat capacity and dissipation are identified, and the five
package heat scenarios each show thermal load, heat level, cockpit gauge, overheat state and time to
overheat with does-not-settle and never-overheats kept distinct.

**Independent Test**: Run the heat unit suite plus `pnpm run e2e -- power-and-heat.spec.ts`: the
three profile facts and all 25 scenario fields equal the `heatMetrics()` result, a no-weapons build
still shows five scenarios, an infinite heat level or gauge reads as does not settle, a null time to
overheat reads as never overheats, a package null profile renders one unavailable group, and the
result is unchanged by any hardpoint or pip change.

### Tests for User Story 3

- [ ] T046 [P] [US3] Add heat profile tests for the three plant and hull definitions, the fixed scenario order, all five fields per scenario, gauge presented as a percentage distinct from heat level, overheat state carried by text rather than bar length, fill, icon, colour or position, and the single unavailable group with no hull or catalogue fallback, in `src/app/features/build-workspace/power-and-heat/heat-profile/heat-profile.spec.ts`
- [ ] T047 [P] [US3] Add heat scenario tests for finite values, `doesNotSettle` on heat level and on gauge independently, `neverOverheats` on time to overheat, a no-weapons build whose scenario values coincide without any being hidden, and the absence of any raw `Infinity`, infinity glyph, `null` or clamped percentage in the rendered output, in `src/app/features/build-workspace/power-and-heat/heat-profile/heat-scenario-collection.spec.ts`
- [ ] T048 [P] [US3] Extend `e2e/power-and-heat.spec.ts` with the heat journey — a ready profile compared field-for-field, a no-weapons build, non-settling and never-overheating fields, a package-null profile from an absent or disabled plant, and confirmation that switching hardpoints or pips leaves every heat figure unchanged

### Implementation for User Story 3

- [ ] T049 [US3] Implement `HeatProfile` rendering plant heat efficiency, hull heat capacity and hull heat dissipation as distinct definitions and the unavailable group when the package returns null, adding no notice that qualifies a ready profile, in `src/app/features/build-workspace/power-and-heat/heat-profile/heat-profile.ts` and its template and styles (depends on T011, T015)
- [ ] T050 [US3] Implement `HeatScenarioCollection` rendering the five scenarios in fixed semantic order as labelled rows or cards, each giving thermal load, heat level, cockpit gauge, overheat state and time to overheat a complete textual value with the two semantic sentinels applied only to their own fields, in `src/app/features/build-workspace/power-and-heat/heat-profile/heat-scenario-collection.ts` and its template and styles (depends on T004, T049)
- [ ] T051 [US3] Compose the heat region after the module breakdown and before the distributor in `PowerAndHeatCapability`, pairing heat and distributor as fluid adjacent regions at wide widths and stacking them in semantic order otherwise, in `src/app/features/build-workspace/power-and-heat/power-and-heat-capability/power-and-heat-capability.ts` and its template and styles (depends on T031, T042, T049, T050)
- [ ] T052 [P] [US3] Add the US3 message keys — heat section heading, plant efficiency, hull heat capacity and hull heat dissipation labels, the five scenario names, thermal load, heat level, cockpit gauge, overheat state and time to overheat labels, the overheat verdicts and the heat unavailable statement — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T053 [P] [US3] Add `HeatProfile` and `HeatScenarioCollection` preview declarations for the complete finite profile, package unavailable, the no-weapons equal-scenario case, does-not-settle, never-overheats, pending and blocking failure at all three widths with semantic infinity phrases in every shipped locale, in `src/app/ui/previews/preview-manifest.ts`
- [ ] T054 [US3] Add the US3 surfaces and FR-009–FR-011 ids with their five-scenario, sentinel and unavailable assertions to `e2e/coverage-ledger.ts`

**Checkpoint**: All three stories are independently functional and the complete capability presents
one settled revision.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T055 Implement the responsive composition — fluid adjacent power/band and module regions then fluid adjacent heat and distributor regions at wide widths, chosen from available inline size rather than device-name branching, and one complete semantic single column at narrow widths, both landscape phone orientations, 200% text and 400% zoom with no shortened content — in `src/app/features/build-workspace/power-and-heat/power-and-heat-capability/power-and-heat-capability.ts` and its template and styles (depends on T051)
- [ ] T056 [P] Run the complete capability in Chromium and Firefox at desktop, tablet portrait and landscape and mobile portrait and landscape with an axe scan over every no-build, pending, ready, failure, retracted, zero-output, disabled, deployed-only, unavailable-distributor, unavailable-heat, does-not-settle and never-overheats state, in `e2e/power-and-heat.spec.ts`
- [ ] T057 [P] Assert 200% text, actual 400% browser zoom, expanded translations, long canonical module names and RTL layout with no lost content, function, identity or document horizontal scrolling, and that a semantic table scrolls only inside its own labelled container, in `e2e/power-and-heat.spec.ts`
- [ ] T058 [P] Assert touch operation and shared target-size tokens for every exact-slot action, condition control and capability navigation control with no overlap at mobile width, and that `prefers-reduced-motion` changes only transitions and never content, state or announcement timing, in `e2e/power-and-heat.spec.ts`
- [ ] T059 [P] Assert one coalesced polite announcement per settled build or condition change, no announcement for unchanged values, invalid draft feedback associated with its controls and a single prompt alert for unexpected failure, in `e2e/power-and-heat.spec.ts`
- [ ] T060 [P] Add the locale sweep asserting owned strings and semantic sentinels come from messages, MW, MJ, MJ per second, percentages, pips and durations use active-locale formatters, and module and slot text comes from the Almanac with disclosed canonical fallback or an unavailable state, across every shipped locale and the pseudo-locales in `src/app/i18n/testing/pseudo-locales.ts`, in `e2e/power-and-heat.spec.ts`
- [ ] T061 [P] Add the offline journey — load the workspace, go offline, open Power and Heat, switch hardpoint state and reallocate pips with no cross-origin request and no capability degradation — in `e2e/power-and-heat.spec.ts`
- [ ] T062 Add the in-page settled-status measurement under Chromium CDP `Emulation.setCPUThrottlingRate(4)` at the mobile viewport, asserting the feature 005 power provider keeps feature 003's 100 ms settled status update from a committed build or condition revision to rendered DOM carrying the same pair, then exercise feature 007's deployed distributor read and feature 010's selected-state hardpoint/utility read — including opposite verdicts from one divergent band — and prove the complete transaction performs exactly one `powerBudget()` call and no duplicate `distributorMetrics()` or `heatMetrics()` call, in `e2e/power-and-heat.spec.ts` (depends on T033, T034, T035)
- [ ] T063 [P] Write and run the versioned NVDA/Firefox desktop, TalkBack/Chromium mobile and tablet screen-reader protocols covering the three user stories — headings and regions, the shared condition group, capacity and draw definitions, the band table or cards, module rows and their slot actions, heat scenarios, capacitor groups and the settled announcement — with result records in `e2e/manual/screen-reader.protocol.md` and `e2e/manual/results/`
- [ ] T064 Reconcile the coverage ledger with the feature 005 surfaces, exported components, preview declarations and Playwright project names, and assert every conformance statement covering this capability names the constitutional exclusions “WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11”, in `scripts/check-interface-foundations.mjs` (depends on T038, T045, T054)
- [ ] T065 Restore unit coverage to at least 80% statements, branches, functions and lines for `src/app/domain/power-heat/`, `src/app/application/power-heat/` and `src/app/features/build-workspace/power-and-heat/` under the thresholds in `angular.json`
- [ ] T066 [P] Record the Power and Heat capability, its cross-feature ports and the retracted deployed-only-summary limit in `AGENTS.md` and `README.md`
- [ ] T067 Execute every section of `specs/005-power-and-heat/quickstart.md` against the reference corpus and fix each divergence
- [ ] T068 Run the `pnpm run check` pipeline declared in `package.json` and confirm formatting, strict compilation, policy checks, build, unit coverage, all ten Playwright projects and all axe scans pass with no skipped, focused or quarantined test

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: starts once the feature prerequisites in Delivery gates are available
- **Foundational (Phase 2)**: depends on Phase 1 and blocks every user story; T005 is
  contract-first for feature 003's provider bundle, and T006 defines the generalized
  `MountPowerObservationPort` that unblocks both feature 007 T006 and feature 010 T012
- **User stories (Phases 3–5)**: all depend on Phase 2 and can then proceed in parallel or in
  priority order US1 → US2 → US3
- **Polish (Phase 6)**: depends on every delivered story

### User story dependencies

- **US1 (P1)**: depends only on Phase 2. It also delivers feature 003's Status provider (T033) and
  the shared `MountPowerObservationAdapter` (T034) consumed by features 007 and 010, because all of
  them select the same `powerBudget()` result
- **US2 (P2)**: depends only on Phase 2. Its composition task T042 touches the capability container
  first created in T031
- **US3 (P2)**: depends only on Phase 2. Its composition task T051 touches the same container and
  therefore follows T042 rather than running beside it

### Within each user story

- Tests are written first and must fail before implementation
- Domain projection before store, store before adapters and components, components before workspace
  composition
- Message keys and preview declarations ship with their component, never as follow-up work

### Parallel opportunities

- Phase 1: T002 and T003 run together
- Phase 2: T004, T005 and T006 run together; after T007, T008 → T009 → T010 → T011 run
  sequentially because they share the projector source and spec; T017 and T018 run alongside
  T014–T016
- Phase 3: T020–T026 run together; T036 and T037 run together
- Phase 4: T039 and T040 run together; T043 and T044 run together
- Phase 5: T046–T048 run together; T052 and T053 run together
- Phase 6: T056–T061, T063 and T066 run together
- Across teams: once Phase 2 completes, one developer takes US1 while another takes US2 and US3;
  only the three capability-container composition tasks need serializing

## Parallel Example: User Story 1

```bash
# Launch the failing tests together:
Task: "Power summary tests in src/app/features/build-workspace/power-and-heat/power-budget/power-budget-summary.spec.ts"
Task: "Priority band tests in src/app/features/build-workspace/power-and-heat/power-budget/priority-band-collection.spec.ts"
Task: "Module breakdown tests in src/app/features/build-workspace/power-and-heat/module-power-breakdown/module-power-breakdown.spec.ts"
Task: "Capability lifecycle tests in src/app/features/build-workspace/power-and-heat/power-and-heat-capability/power-and-heat-capability.spec.ts"
Task: "Power status adapter tests in src/app/application/power-heat/power-status.adapter.spec.ts"
Task: "Mount power observation adapter tests in src/app/application/power-heat/mount-power-observation.adapter.spec.ts"
Task: "Power journey in e2e/power-and-heat.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — this blocks everything and unblocks features 003, 007 and 010
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: capacity, selected draw, all five bands and every returned consumer match
   `powerBudget()` by identity in both hardpoint states, retracted omits the three deployed-only
   summaries, and the capability passes axe in all ten projects
5. A Commander can understand the power budget and reach any contributing slot at this point

### Incremental Delivery

1. Setup + Foundational → the semantic unions, the cross-feature contracts, the pure projection, the
   store and the repository policy
2. Add US1 → the power budget, priority shedding, module contributions and both integration ports
   (MVP)
3. Add US2 → complete distributor performance with exact half-pip handling
4. Add US3 → the complete package heat profile with its distinct semantic sentinels
5. Polish → the responsive, accessible, localized, offline and performance gates and a green
   `pnpm run check`

### Constitutional Guardrails

- No task calculates, sums, subtracts, divides, clamps, rounds, re-derives or reclassifies a package
  power, distributor or heat figure; the single permitted arithmetic operation in this feature is
  dividing integer half-pips by two while constructing `DistributorOptions`
- No task derives a retracted headroom, utilisation or within-budget value; the package supplies
  those three summaries for deployed hardpoints only, and the omission is disclosed rather than
  filled
- No task substitutes a catalogue figure, effective-stat join, fitted-module scan, journal modifier,
  symbol or slot parse, positional index or inferred cause for a package result, and no package
  `null` receives a diagnosis
- No task fabricates a passive or zero-draw fitting into the consumer manifest, merges identical
  module symbols or hides a heat scenario whose values coincide
- No task adds a backend, account, telemetry, cross-origin runtime request, second `ShipLoadout`,
  extra route, persisted metric, private game-text translation or viewing-condition store of its own
- No task lowers the 80% coverage thresholds, drops a browser, viewport or orientation project, or
  skips a test to reach a green build

## Notes

- [P] tasks touch different files and have no incomplete dependency
- Every component task includes its unit test, its required-state preview declarations and its
  message keys; none of the three is a follow-up
- Commit after each task or logical group; stop at a checkpoint to validate a story independently
