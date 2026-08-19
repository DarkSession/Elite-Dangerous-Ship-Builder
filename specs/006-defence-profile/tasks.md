---
description: 'Task list for Defence Profile'
---

# Tasks: Defence Profile

**Input**: Design documents from `/specs/006-defence-profile/`

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
`src/app/domain/defence/`, signal presenters and adapters in `src/app/application/defence/`,
surfaces in `src/app/features/build-workspace/defence-profile/`, shared primitives and previews in
`src/app/ui/`, messages and formatters in `src/app/i18n/`, end-to-end suites in `e2e/`, repository
policy checks in `scripts/`. Unit tests live beside their source as `*.spec.ts`.

## Delivery gates

Feature 006 owns every shield, recovery, cell-bank, armour, hardness and module-protection semantic
in the application and adds no calculation of its own. Three gates apply and are named on the tasks
they block:

- **Repository prerequisite**: TypeScript and template `strict` settings must be enabled in the
  shared configuration and the existing project must pass under them (constitution technology
  requirement, closed by feature 011).
- **Feature prerequisites**: feature 001 (one active `ShipLoadout`, atomic `buildRevision`, no-build
  state, `/build` workspace), feature 002 (exact-slot reveal and editing through its accepted
  modelled-snapshot boundary), feature 003 (`StatusRevisionContext`, settled `ViewingConditions`
  with integer SYS half-pips, `StatusProvider<T, I>` envelope, `defenceProfile` detail target and
  the shared condition control) and feature 011 (tokens, components, localization, formatters,
  game-text presenter, announcement primitives, preview manifest, ten Playwright projects, axe
  helpers).
- **Contract-first exports**: feature 003's provider bundle waits on this feature's Phase 2 type
  exports (T005). That task must land before feature 003 can compile against a concrete defence
  contract. An absent consumer is a sequencing dependency — never a reason to let feature 003 read
  raw shield or armour fields.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Pin the package behaviour this feature projects and create the source and test locations
before any contract lands.

- [ ] T001 Pin the Almanac 0.1.3 defence behaviour this feature projects — `shieldMetricsResult(DefenceOptions)` and `shieldRecoveryResult(DefenceOptions)` returning `CalculationResult` with `complete`, the value and an ordered `CalculationIssue[]` carrying `field`, `reason`, optional `slot`/`symbol` and params; `ShieldMetrics` returning `strength`, `generator`, `boosters`, `reinforcement`, `massCurveMultiplier`, `boostMultiplier`, `systemsResistance`, `resistances` and `effectiveHitPoints` over `kinetic`/`thermal`/`explosive`/`caustic` with `Infinity` at 100% resistance; `ShieldRecovery` returning `regenRate`, `brokenRegenRate`, `recoveryTime` and `regenTime`; `cellBanks()` returning a frozen `CellBankSummary` with `totalRestorable`, `totalCells` and ordered banks carrying `slot`, `symbol`, `reinforcement`, `cells`, `spinUp`, `duration`, `heat` and `powered`; the non-nullable `armourMetrics()` returning `hitPoints`, `bulkheads`, `reinforcement`, both damage records, `moduleArmour` and `moduleProtection`; `getShipBySymbol().hardness`; and the leaf subpaths `ships/ship-loadout`, `ships/shields`, `ships/shield-recovery`, `ships/armour`, `ships/ships`, `ships/slots` and `i18n/diagnostics` — in `src/app/domain/defence/almanac-defence-contract.spec.ts`
- [ ] T002 [P] Create the feature source skeleton `src/app/domain/defence/`, `src/app/application/defence/` and `src/app/features/build-workspace/defence-profile/` per plan.md
- [ ] T003 [P] Create the feature suite `e2e/defence-profile.spec.ts` importing the feature 011 axe helper from `e2e/accessibility/axe.ts` and the semantic assertions from `e2e/accessibility/assertions.ts`, and register the Defence Profile surfaces from [design/screen-inventory.md](./design/screen-inventory.md) in `e2e/coverage-ledger.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Publish the cross-feature contract feature 003 compiles against, then the pure
revision-stamped projection, the presenter every surface reads and the repository policy that keeps
the package boundary enforceable.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Cross-feature contracts (contract-first exports)

- [ ] T004 [P] Define the `SemanticNumber` union (`finite`, `unboundedEffectiveHitPoints`, `cannotReachRecoveryThreshold`, `cannotRegenerateToFull`) with the three field-specific pure constructors mapping only positive infinity in its owning field to its own sentinel, and unit tests covering finite, zero, negative, positive-infinite and negative-infinite inputs plus the mutual independence of the three sentinels, in `src/app/domain/defence/semantic-number.ts` and `src/app/domain/defence/semantic-number.spec.ts`
- [ ] T005 [P] Define `DefenceStatusProjection` (`shieldStrength` ready/unavailable, always-ready `armour`, the fixed `detailTarget: { kind: 'detail', capability: 'defenceProfile' }` and `qualifiedSummaryIds: readonly 'shieldStrength'[]`) and `DefenceStatusProvider extends StatusProvider<DefenceStatusProjection, never>` over feature 003's type-only domain leaf, in `src/app/domain/defence/defence-status-projection.ts` (contract-first export: unblocks feature 003's provider bundle)
- [ ] T006 [P] Define the `DefenceRole` union (`shieldGenerator`, `shieldBooster`, `shieldReinforcement`, `bulkhead`, `hullReinforcement`, `moduleReinforcement`), `FittedDefenceRole` carrying `role`, `slotKey`, `symbol` and `enabled: boolean | 'unspecified'`, and `DefenceSlotIntent = { kind: 'slot'; slotKey: string }`, documenting that no record may carry an apportioned contribution, resistance share or local power verdict, in `src/app/domain/defence/defence-source-role.ts`
- [ ] T007 [P] Define `CalculationView<T>` and `CalculationIssueView` with the eight package `field` values, the five package `reason` values, optional `slot`/`symbol`/`params` and the retained `packageIssue`, in `src/app/domain/defence/calculation-view.ts`

### Pure projection

- [ ] T008 Define `DefenceProjection`, `ShieldSnapshot`, `RecoverySnapshot`, `DamageDefenceValue`, `DamageType`, `CellBankCollection`, `CellBankView` and `ArmourSnapshot` exactly as specified in data-model.md, with no nullable armour variant and no lifecycle state repeated inside the projection, in `src/app/domain/defence/defence-projection.ts` (depends on T004, T006, T007)
- [ ] T009 Implement `toCalculationView(result)` copying a complete value whole and otherwise preserving every package issue in exact order with exact `field`, `reason`, `slot`, `symbol`, params and retained `packageIssue`, with unit tests asserting no issue is collapsed, reordered, deduplicated, relabelled or parsed from its English `message`, in `src/app/domain/defence/calculation-view.ts` and `src/app/domain/defence/calculation-view.spec.ts` (depends on T007)
- [ ] T010 [P] Implement `toDamageDefenceValues(resistances, effectiveHitPoints)` producing exactly four package-ordered `kinetic`, `thermal`, `explosive` and `caustic` rows that pair each same-key resistance with its same-key effective hit points, with unit tests for signed negative, zero and `Infinity` values and for the rejection of any missing or extra damage key, in `src/app/domain/defence/damage-defence.ts` and `src/app/domain/defence/damage-defence.spec.ts` (depends on T008)
- [ ] T011 [P] Implement `classifyFittedDefenceRoles(slots)` deriving records only from the actual armour slot or a package-resolved `engineeringGroup`, retaining exact `slotKey`/`symbol`, mapping direct `FittedModule.on` to `enabled` or `'unspecified'`, preserving package slot order inside stable role groups and emitting no record for unavailable role or stat data, with unit tests for duplicate symbols in different slots, an absent armour module, an unresolved role and the absence of any symbol, name, slot-position or modifier inference, in `src/app/domain/defence/defence-source-role.ts` and `src/app/domain/defence/defence-source-role.spec.ts` (depends on T006)
- [ ] T012 Implement `projectDefence(loadout, revision)` — derive `systemsPips` once as `revision.conditions.pips.systems / 2`, pass that identical explicit value to both shield calls, call `shieldMetricsResult`, `shieldRecoveryResult`, `cellBanks` and `armourMetrics`, resolve hardness through `getShipBySymbol(loadout.shipSymbol)`, stamp the captured revision and return one immutable `DefenceProjection` — with unit tests asserting one call per facade method, identical pips on both shield calls, exact revision stamping and that a thrown call or failed exact hull lookup surfaces as a projection failure with no fallback hull, in `src/app/domain/defence/defence-projector.ts` and `src/app/domain/defence/defence-projector.spec.ts` (depends on T008, T009, T010, T011)

### Presenter, workspace adapter and repository policy

- [ ] T013 Implement the signal `DefencePresenter` reading feature 001's active loadout and feature 003's `StatusRevisionContext`, publishing a `ready` payload only under the same captured build and condition revision and never carrying a stale payload into a newer revision, with unit tests for rapid accepted edits, settled condition changes, no-build and projection failure, in `src/app/application/defence/defence.presenter.ts` and `src/app/application/defence/defence.presenter.spec.ts` (depends on T012)
- [ ] T014 [P] Implement `DefenceWorkspaceAdapter` translating a `DefenceSlotIntent` into feature 002's exact-slot reveal, using the inline ledger at wide widths and the existing selected-slot layer with return context at narrow widths, and changing no build, conditions, revision, persistence, history, route or SLEF, with unit tests including duplicate symbols in different slots, in `src/app/application/defence/defence-workspace.adapter.ts` and `src/app/application/defence/defence-workspace.adapter.spec.ts` (depends on T006)
- [ ] T015 [P] Add the serialization-exclusion suite proving no `DefenceProjection`, `SemanticNumber`, selected-capability or source-view field appears in the build snapshot, local record, undo/redo history, preferences, route, query, fragment, compact link payload or SLEF export, in `src/app/application/defence/defence.serialization.spec.ts`
- [ ] T016 [P] Add the feature 006 boundary rules to `scripts/check-interface-foundations.mjs` — no `src/app/features/build-workspace/defence-profile/` file imports `@elite-dangerous-almanac/core`, no `src/app/domain/defence/` or `src/app/application/defence/` file performs shield, resistance, effective-hit-point, recovery, bank or armour arithmetic beyond the single half-pip division, no feature 006 file declares an active-build or viewing-condition store, and no other area feature imports a `defence-profile` component — with positive and negative fixtures in `scripts/check-interface-foundations.test.mjs`

**Checkpoint**: The cross-feature contract, the pure revision-coherent projection, the presenter, the
slot adapter and the policy checker exist — user story work can begin.

---

## Phase 3: User Story 1 - Read shield and armour strength (Priority: P1) 🎯 MVP

**Goal**: The Defence capability shows total shield strength, the generator, booster and
reinforcement aggregates, both multipliers, SYS resistance and all four resistance/effective-MJ
pairs for the settled SYS pips, alongside total hull hit points, the bulkhead and reinforcement
aggregates and all four resistance/effective-hull-point pairs. An unavailable shield preserves every
ordered package issue with its exact reason and target and never hides armour. Feature 003's shield
and armour headlines read the same projection.

**Independent Test**: Load a package-backed build with a generator, boosters and shield
reinforcement, then run the shield and armour unit suites plus
`pnpm run e2e -- defence-profile.spec.ts`: every displayed shield and armour value equals the
same-revision `shieldMetricsResult({ systemsPips })` and `armourMetrics()` field at 0, fractional, 2
and 4 SYS pips; removing, disabling and shedding the generator each produce their own ordered
package issues while the complete armour region stays available; and the capability passes axe in all
ten projects.

### Tests for User Story 1

- [ ] T017 [P] [US1] Add shield equality tests comparing `strength`, `generator`, `boosters`, `reinforcement`, `massCurveMultiplier`, `boostMultiplier`, `systemsResistance` and all four resistance/effective-hit-point pairs field-for-field with real `shieldMetricsResult({ systemsPips })` results at 0, fractional, 2 and 4 SYS pips, in `src/app/domain/defence/defence-projector.shield.spec.ts`
- [ ] T018 [P] [US1] Add armour equality tests comparing `hitPoints`, `bulkheads`, `reinforcement` and all four resistance/effective-hit-point pairs field-for-field with a real `armourMetrics()` result, and asserting armour remains ready under missing, disabled and shed shields, in `src/app/domain/defence/defence-projector.armour.spec.ts`
- [ ] T019 [P] [US1] Add shield unavailability tests proving missing generator, disabled generator, shed generator, disabled plant and unresolved power draw remain distinct ordered package diagnoses with exact `field`, `reason`, `slot` and `symbol`, that a `powerCapacity` or `powerDraw` issue is never relabelled as a generator verdict, and that a retracted-powered generator stays package-complete even when deployed power would shed it, in `src/app/domain/defence/defence-projector.shield-issues.spec.ts`
- [ ] T020 [P] [US1] Add `DamageDefenceCollection` tests for the semantic table at roomy widths, the equivalent complete labelled cards when stacked, signed negative resistance with a visible weakness meaning, numeric zero, unbounded effective hit points and the absence of a bar in signed and non-finite cases, in `src/app/features/build-workspace/defence-profile/damage-defence-collection.component.spec.ts`
- [ ] T021 [P] [US1] Add `CalculationIssueList` tests for multiple ordered reasons, targeted and untargeted issues, exact-slot action emission, package-localized diagnostic text through `getCalculationIssueMessage()` and canonical-language disclosure, in `src/app/features/build-workspace/defence-profile/calculation-issue-list.component.spec.ts`
- [ ] T022 [P] [US1] Add `ShieldProfile` tests for the visible selected SYS pips, every scalar field with its unit, the four damage rows, each ordered unavailable issue state and the independence of shield from recovery, in `src/app/features/build-workspace/defence-profile/shield-profile.component.spec.ts`
- [ ] T023 [P] [US1] Add `ArmourProfile` tests for every hull scalar, the four damage rows formatted as hull points rather than MJ, and continued availability while shields are missing, disabled or shed, in `src/app/features/build-workspace/defence-profile/armour-profile.component.spec.ts`
- [ ] T024 [P] [US1] Add `DefenceSourceList` tests for resolved shield generator, booster and reinforcement records in package slot order, duplicate symbols retaining independent exact-slot actions, enabled/disabled/unspecified states, the absence of any contribution value or provenance claim and the absence of an action when no slot exists, in `src/app/features/build-workspace/defence-profile/defence-source-list.component.spec.ts`
- [ ] T025 [P] [US1] Add `DefenceProfile` capability tests for the semantic order of items 1–11 from [design/defence-profile.md](./design/defence-profile.md), the no-build, pending, ready and projection-failure states and the peer-to-stack transition when either column would truncate, in `src/app/features/build-workspace/defence-profile/defence-profile.component.spec.ts`
- [ ] T026 [P] [US1] Add `DefenceStatusProvider` and `DefenceStatusSummary` tests asserting identical captured revisions on the payload and the summary, shield/armour values equal to the detail projection, the exact `defenceProfile` detail target, `shieldStrength` exported in `qualifiedSummaryIds` exactly when that summary is unavailable and never for armour, in `src/app/application/defence/defence-status.provider.spec.ts` and `src/app/features/build-workspace/defence-profile/defence-status-summary.component.spec.ts`
- [ ] T027 [P] [US1] Add the shield and armour journey — open Defence from the workspace capability control and from the feature 003 shield/armour headline, compare every displayed value with the package result at each SYS setting, exercise missing/disabled/shed generators with armour still complete, and activate a slot-bearing issue and a shield-role record across the five layouts — in `e2e/defence-profile.spec.ts`

### Implementation for User Story 1

- [ ] T028 [US1] Implement `projectShield` copying every `ShieldMetrics` scalar unchanged and building the four damage rows through `toDamageDefenceValues`, wrapped by `toCalculationView`, in `src/app/domain/defence/defence-projector.ts` (depends on T012)
- [ ] T029 [US1] Implement `projectArmour` copying every `ArmourMetrics` scalar unchanged, building the four damage rows through `toDamageDefenceValues` and keeping `moduleArmour`, `moduleProtection` and hardness outside `hitPoints`, in `src/app/domain/defence/defence-projector.ts` (depends on T012, T028)
- [ ] T030 [US1] Populate `shieldRoleRecords` from `classifyFittedDefenceRoles` for the shield generator, booster and reinforcement roles, attaching no aggregate value to any record, in `src/app/domain/defence/defence-projector.ts` (depends on T011, T028)
- [ ] T031 [P] [US1] Implement `DamageDefenceCollection` over feature 011 table and card primitives, rendering a supplemental bar only with a declared truthful scale and complete text equivalent and omitting it for signed and non-finite values, in `src/app/features/build-workspace/defence-profile/damage-defence-collection.component.ts` and its template and styles
- [ ] T032 [P] [US1] Implement `CalculationIssueList` rendering every ordered issue with the package diagnostic from the `i18n/diagnostics` leaf through feature 011's game-text presenter and emitting `{ kind: 'slot', slotKey }` for slot-bearing issues, in `src/app/features/build-workspace/defence-profile/calculation-issue-list.component.ts` and its template and styles
- [ ] T033 [US1] Implement `ShieldProfile` presenting the selected SYS pips, labelled strength/contribution/multiplier definitions, the damage collection and the ordered unavailable issue state, calling no package method itself, in `src/app/features/build-workspace/defence-profile/shield-profile.component.ts` and its template and styles (depends on T031, T032)
- [ ] T034 [US1] Implement `ArmourProfile` presenting the hull total, both aggregates and the damage collection in hull points, remaining fully available under every shield state, in `src/app/features/build-workspace/defence-profile/armour-profile.component.ts` and its template and styles (depends on T031)
- [ ] T035 [US1] Implement `DefenceSourceList` rendering role-grouped fitted records with exact-slot actions at the feature 011 target-size token, describing them as fitted role records and carrying no contribution value, in `src/app/features/build-workspace/defence-profile/defence-source-list.component.ts` and its template and styles (depends on T014)
- [ ] T036 [US1] Implement the `DefenceProfile` capability container composing the shared feature 003 condition surface, shield, damage, issue and source regions and the armour region in the specified semantic order, using fluid tracks that fall back to one complete stack, and delegating no-build, pending and failure to the feature 003 envelope, in `src/app/features/build-workspace/defence-profile/defence-profile.component.ts` and its template and styles (depends on T013, T033, T034, T035)
- [ ] T037 [US1] Register Defence as a peer central workspace capability selected in memory through feature 003's workspace target coordinator with no route, query or fragment change, in `src/app/features/build-workspace/build-workspace.ts` and its template (depends on T036)
- [ ] T038 [US1] Implement `DefenceStatusProvider` producing the revision-stamped `DefenceStatusProjection` from the same presenter read, including `shieldStrength` in `qualifiedSummaryIds` exactly when it is unavailable, in `src/app/application/defence/defence-status.provider.ts` (depends on T005, T013)
- [ ] T039 [US1] Implement `DefenceStatusSummary` rendering the shield and armour headlines and the one-activation `defenceProfile` detail target for feature 003's headline set to compose, in `src/app/features/build-workspace/defence-profile/defence-status-summary.component.ts` and its template and styles (depends on T038)
- [ ] T040 [P] [US1] Add the shield, armour, damage-type, contribution, multiplier, SYS-resistance, weakness-meaning, unbounded-effective-hit-points and issue-heading message keys with their units to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T041 [P] [US1] Register `DefenceProfile`, `ShieldProfile`, `ArmourProfile`, `DamageDefenceCollection`, `CalculationIssueList`, `DefenceSourceList` and `DefenceStatusSummary` preview declarations for every populated, empty, loading, error and stress state named in [design/component-state-preview-matrix.md](./design/component-state-preview-matrix.md), in `src/app/ui/previews/preview-manifest.ts`

**Checkpoint**: A Commander can read every package shield and armour strength value for the settled
SYS pips, see exactly why an unavailable shield is unavailable and reach any shield-role slot, with
armour always present. Feature 003's headlines read the same projection.

---

## Phase 4: User Story 2 - Read recovery and cell banks (Priority: P2)

**Goal**: The raised and broken regeneration rates and the collapse-to-raise and raise-to-full
durations are shown as four separate facts with their own semantic meanings for the two
non-finishing phases. Every fitted cell bank stays visible with its exact returned fields and
powered state, and no banks is a different state from fitted banks whose powered totals are zero.

**Independent Test**: Run the recovery and cell-bank unit suites plus
`pnpm run e2e -- defence-profile.spec.ts`: all four recovery fields equal
`shieldRecoveryResult({ systemsPips })` at each SYS setting, a phase that cannot reach 50% and a
phase that cannot reach full receive two different localized phrases with no raw or clamped
infinity, a build with no banks shows the dedicated empty statement, an all-unpowered build keeps
every bank beside exact zero totals, and each bank action reveals its exact returned slot in one
interaction.

### Tests for User Story 2

- [ ] T042 [P] [US2] Add recovery equality tests comparing `regenRate`, `brokenRegenRate`, `recoveryTime` and `regenTime` independently with real `shieldRecoveryResult({ systemsPips })` results at 0, fractional, 2 and 4 SYS pips, asserting both rates and both durations never merge and that shield and recovery completeness remain independent with their own ordered issues, in `src/app/domain/defence/defence-projector.recovery.spec.ts`
- [ ] T043 [P] [US2] Add cell-bank projection tests asserting `noneFitted` only for an empty bank list, `fitted` for every non-empty list including one with zero totals, exact copies of `totalRestorable`, `totalCells` and every bank's `slot`, `symbol`, `reinforcement`, `cells`, `spinUp`, `duration`, `heat` and `powered`, preserved package order, retained duplicate symbols and the absence of any local sum, filter, grouping or apportionment, in `src/app/domain/defence/defence-projector.cell-banks.spec.ts`
- [ ] T044 [P] [US2] Add `ShieldRecovery` tests for the two labelled rates, the two labelled durations, the distinct threshold and full-regeneration semantic phrases, finite zero staying numeric and the parent pending and failure states, in `src/app/features/build-workspace/defence-profile/shield-recovery.component.spec.ts`
- [ ] T045 [P] [US2] Add `CellBankList` tests for the dedicated `noneFitted` statement, the fitted collection with both totals, the all-unpowered list beside exact zero totals, textual powered and unpowered meanings with colour and icon supplemental only, duplicate symbols keeping independent exact-slot actions and the 44 CSS-pixel target baseline, in `src/app/features/build-workspace/defence-profile/cell-bank-list.component.spec.ts`
- [ ] T046 [P] [US2] Add the recovery and cell-bank journey — compare all four recovery fields with the package result, render both non-finishing phases, and walk the no-banks, powered, mixed, all-unpowered and duplicate-symbol builds activating each bank's exact slot across the five layouts — in `e2e/defence-profile.spec.ts`

### Implementation for User Story 2

- [ ] T047 [US2] Implement `projectRecovery` copying all four `ShieldRecovery` fields unchanged and wrapping the result in `toCalculationView` independently of the shield result, in `src/app/domain/defence/defence-projector.ts` (depends on T012)
- [ ] T048 [US2] Implement `projectCellBanks` mapping an empty `cellBanks()` bank list to `noneFitted` and every non-empty list to `fitted` with both package totals and every bank field in package order, in `src/app/domain/defence/defence-projector.ts` (depends on T012, T047)
- [ ] T049 [P] [US2] Implement `ShieldRecovery` presenting the two rates and two durations as labelled definitions and rendering each infinite duration through its own `SemanticNumber` sentinel phrase, in `src/app/features/build-workspace/defence-profile/shield-recovery.component.ts` and its template and styles (depends on T004)
- [ ] T050 [P] [US2] Implement `CellBankList` presenting the labelled totals and a complete semantic bank collection with module and slot context, one-activation reinforcement in MJ, cells, spin-up, duration, heat, textual powered state and one exact-slot action per bank, in `src/app/features/build-workspace/defence-profile/cell-bank-list.component.ts` and its template and styles (depends on T014)
- [ ] T051 [US2] Compose `ShieldRecovery` and `CellBankList` into the capability at semantic positions 5 and 7 in `src/app/features/build-workspace/defence-profile/defence-profile.component.ts` and its template (depends on T036, T049, T050)
- [ ] T052 [P] [US2] Add the recovery rate, recovery duration, threshold-not-reached, full-regeneration-not-reached, bank total, bank field, powered-state and no-banks message keys with their units to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T053 [P] [US2] Register `ShieldRecovery` and `CellBankList` preview declarations for the populated, unavailable, both-infinite, both-zero, none-fitted, all-unpowered-zero-total, duplicate-symbol, large-list and long-identity states named in [design/component-state-preview-matrix.md](./design/component-state-preview-matrix.md), in `src/app/ui/previews/preview-manifest.ts`

**Checkpoint**: Recovery and cell banks read complete and honest beside the shield profile, with
User Story 1 still passing.

---

## Phase 5: User Story 3 - Read hull and module protection (Priority: P2)

**Goal**: Hull hardness is shown as the exact package hull rating with an explanation of the
armour-piercing comparison, and module armour and module protection remain distinct from hull hit
points. The actual fitted bulkhead and every hull and module reinforcement reach their exact slots
without any apportioned contribution.

**Independent Test**: Open a known hull with a non-stock bulkhead plus hull and module
reinforcements and run the armour unit suite plus `pnpm run e2e -- defence-profile.spec.ts`:
hardness equals `getShipBySymbol(loadout.shipSymbol).hardness`, module armour and module protection
are formatted as separate hit points and a fraction and never enter `hitPoints`, the actual bulkhead
row targets its exact slot, a stock-alloy build fabricates no bulkhead row, and the hardness
explanation states the comparison without any weapon matchup.

### Tests for User Story 3

- [ ] T054 [P] [US3] Add hardness and module-protection tests comparing `hardness` with the exact `getShipBySymbol(loadout.shipSymbol)` record and `moduleArmour`/`moduleProtection` with `armourMetrics()`, asserting hardness is stored beside and never inside armour, module armour never enters hull hit points and module protection never becomes hit points, in `src/app/domain/defence/defence-projector.hardness.spec.ts`
- [ ] T055 [P] [US3] Add armour role-record tests asserting the bulkhead record appears only when the armour `LoadoutSlot.module` exists, the stock lightweight-alloy calculation fallback fabricates no fitted bulkhead row, hull and module reinforcements are classified from a package-resolved `engineeringGroup`, package slot order is preserved and duplicate symbols keep independent exact-slot actions, in `src/app/domain/defence/defence-projector.armour-roles.spec.ts`
- [ ] T056 [P] [US3] Add `ArmourProfile` hardness tests for the three distinct labelled hardness, module-armour and module-protection facts, the visible armour-piercing explanation, the absence of the reference label “integrity” and the absence of any matchup, piercing factor, averaged attack or combined defence score, in `src/app/features/build-workspace/defence-profile/armour-profile.component.spec.ts`
- [ ] T057 [P] [US3] Add `DefenceSourceList` armour-role tests for the bulkhead, hull-reinforcement and module-reinforcement groups, the absent-record state when no role resolves and the retained exact-slot action at both wide and narrow layouts, in `src/app/features/build-workspace/defence-profile/defence-source-list.component.spec.ts`
- [ ] T058 [P] [US3] Add the hull and module-protection journey — verify hardness against the package hull record, verify the four separated armour facts and their units, activate the actual bulkhead and each reinforcement slot, and repeat on a stock-alloy hull across the five layouts — in `e2e/defence-profile.spec.ts`

### Implementation for User Story 3

- [ ] T059 [US3] Populate `hardness` from the exact `getShipBySymbol(loadout.shipSymbol)` record beside — never inside — the `ArmourSnapshot`, failing the projection rather than substituting a fallback hull when the lookup fails, in `src/app/domain/defence/defence-projector.ts` (depends on T029)
- [ ] T060 [US3] Populate `armourRoleRecords` from `classifyFittedDefenceRoles` for the actual bulkhead, hull-reinforcement and module-reinforcement roles, emitting no record from the stock-armour calculation fallback, in `src/app/domain/defence/defence-projector.ts` (depends on T011, T059)
- [ ] T061 [US3] Extend `ArmourProfile` with the separately labelled hardness, module-armour and module-protection group and the localized armour-piercing explanation, in `src/app/features/build-workspace/defence-profile/armour-profile.component.ts` and its template and styles (depends on T034, T059)
- [ ] T062 [US3] Extend `DefenceSourceList` with the armour role groups and bind the armour instance in the capability at semantic position 11, in `src/app/features/build-workspace/defence-profile/defence-source-list.component.ts` and `src/app/features/build-workspace/defence-profile/defence-profile.component.ts` and its template (depends on T035, T051, T060)
- [ ] T063 [P] [US3] Add the hardness label, hardness explanation, module-armour, module-protection, bulkhead, hull-reinforcement and module-reinforcement message keys with their units to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T064 [P] [US3] Register the `ArmourProfile` hardness and module-protection states and the `DefenceSourceList` armour-role, no-resolved-record, action-absent and long-explanation states in `src/app/ui/previews/preview-manifest.ts`

**Checkpoint**: All three stories are independently functional; every FR-001–FR-009 surface exists.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Close the responsive, accessible, localized, announcement, performance and repository
gates across every delivered story.

- [ ] T065 [P] Assert the complete stacked composition keeps every resistance percentage, multiplier, recovery field, bank field, hardness and protection value at 390×844 and 844×390 with no document horizontal scrolling, in `e2e/defence-profile.spec.ts`
- [ ] T066 [P] Assert the peer-to-stack transition is decided by available inline size rather than a device-name breakpoint, and that landscape phones, 200% text and actual 400% zoom always use the complete stack, in `e2e/defence-profile.spec.ts`
- [ ] T067 [P] Run the feature 011 axe helper over every Defence state in all ten Chromium and Firefox projects and fail on every in-scope violation, in `e2e/defence-profile.spec.ts`
- [ ] T068 [P] Assert landmark, heading, definition, table, card and collection relationships, accessible role/name/state for every action, visible text equivalents for every supplemental bar and icon, and the shared 44 CSS-pixel target baseline under pointer and touch, in `e2e/defence-profile.spec.ts`
- [ ] T069 [P] Assert doubled application copy, RTL document direction, long unbroken package identities and long localized diagnostics lose no content, function or layout, in `e2e/defence-profile.spec.ts`
- [ ] T070 [P] Assert `prefers-reduced-motion` changes no result timing, semantic order or meaning in `e2e/defence-profile.spec.ts`
- [ ] T071 [P] Add the localization boundary suite proving application labels, units and sentinels come from feature 011 messages, module, hull and slot names and calculation diagnostics come from Almanac leaf helpers with visible canonical-language disclosure, and no raw message key, blank placeholder, parsed English diagnostic or private game translation is displayed in any shipped locale, in `src/app/features/build-workspace/defence-profile/defence-profile.localization.spec.ts`
- [ ] T072 [P] Implement and test the announcement policy — one coalesced polite summary per settled revision covering changed defence availability, totals or qualifications; distinct no-banks, fitted-banks and all-unpowered messages; one assertive blocking message for a projection failure; silence for initial, unchanged, stale and unaffected content; and no duplicate announcement when feature 002 announces a slot selection — in `src/app/application/defence/defence-announcements.ts` and `src/app/application/defence/defence-announcements.spec.ts`
- [ ] T073 [P] Assert the Status-provider update satisfies feature 003's 100 ms settled-update criterion under the mobile-throttled profile and that no other performance target is introduced, in `e2e/defence-profile.spec.ts`
- [ ] T074 [P] Assert the capability functions offline after first load with no cross-origin runtime request, and that the production bundle budgets in `angular.json` still pass, in `e2e/defence-profile.spec.ts`
- [ ] T075 [P] Add the stale-revision journey proving rapid accepted module edits and settled SYS changes never publish or target a stale projection and never display an old payload under a new condition label, in `e2e/defence-profile.spec.ts`
- [ ] T076 Complete the `e2e/coverage-ledger.ts` entries joining every Defence surface and state to FR-001–FR-009, its journey, its axe flag, its named assertions and the manual NVDA/Firefox desktop and TalkBack/Chromium mobile protocol ids
- [ ] T077 Record the manual screen-reader and actual 400% zoom protocol results for the three stories and the qualified conformance statement “WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11” in `specs/006-defence-profile/quickstart.md`
- [ ] T078 Verify unit coverage stays at or above the 80% statement, branch, function and line thresholds for `src/app/domain/defence/`, `src/app/application/defence/` and `src/app/features/build-workspace/defence-profile/` in `vitest.config.ts`
- [ ] T079 Execute the full [quickstart.md](./quickstart.md) validation, sections 3–12, against the delivered feature
- [ ] T080 Run `pnpm run check` and resolve every format, strict type, build, script-test, unit-test, coverage, Playwright and axe failure with no skipped, quarantined or deleted test

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: starts once the feature prerequisites in Delivery gates are available
- **Foundational (Phase 2)**: depends on Phase 1 and blocks every user story; T005 also unblocks
  feature 003's provider bundle
- **User stories (Phases 3–5)**: all depend on Phase 2 and can then proceed in parallel or in
  priority order US1 → US2 → US3
- **Polish (Phase 6)**: depends on every delivered story

### User story dependencies

- **US1 (P1)**: depends only on Phase 2. It also delivers the capability container, the workspace
  registration and the feature 003 status adapter, because those read the same projection
- **US2 (P2)**: depends only on Phase 2 for its projection and components. Its composition task T051
  touches the capability container first created in T036
- **US3 (P2)**: depends only on Phase 2 for its projection. Its component tasks extend
  `ArmourProfile` from T034 and `DefenceSourceList` from T035, and its composition task T062
  touches the same container and therefore follows T051 rather than running beside it

### Within each user story

- Tests are written first and must fail before implementation
- Domain projection before presenter, presenter before adapters and components, components before
  workspace composition
- Message keys and preview declarations ship with their component, never as follow-up work

### Parallel opportunities

- Phase 1: T002 and T003 run together
- Phase 2: T004–T007 run together; T010 and T011 run together once T008 lands; T014, T015 and T016
  run alongside T013
- Phase 3: T017–T027 run together; T031 and T032 run together; T040 and T041 run together
- Phase 4: T042–T046 run together; T049 and T050 run together; T052 and T053 run together
- Phase 5: T054–T058 run together; T063 and T064 run together
- Phase 6: T065–T075 run together
- Across teams: once Phase 2 completes, one developer takes US1 while another takes US2 and US3;
  only the container composition tasks T036, T051 and T062 and the shared projector tasks in
  `defence-projector.ts` need serializing

---

## Parallel Example: User Story 1

```bash
# Launch the failing tests together:
Task: "Shield equality tests in src/app/domain/defence/defence-projector.shield.spec.ts"
Task: "Armour equality tests in src/app/domain/defence/defence-projector.armour.spec.ts"
Task: "Shield issue tests in src/app/domain/defence/defence-projector.shield-issues.spec.ts"
Task: "Damage collection tests in src/app/features/build-workspace/defence-profile/damage-defence-collection.component.spec.ts"
Task: "Issue list tests in src/app/features/build-workspace/defence-profile/calculation-issue-list.component.spec.ts"
Task: "Shield profile tests in src/app/features/build-workspace/defence-profile/shield-profile.component.spec.ts"
Task: "Armour profile tests in src/app/features/build-workspace/defence-profile/armour-profile.component.spec.ts"
Task: "Source list tests in src/app/features/build-workspace/defence-profile/defence-source-list.component.spec.ts"
Task: "Capability tests in src/app/features/build-workspace/defence-profile/defence-profile.component.spec.ts"
Task: "Status provider tests in src/app/application/defence/defence-status.provider.spec.ts"
Task: "Shield and armour journey in e2e/defence-profile.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — this blocks everything and unblocks feature 003's provider bundle
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: every shield and armour value matches `shieldMetricsResult()` and
   `armourMetrics()` by identity at 0, fractional, 2 and 4 SYS pips, every unavailable shield keeps
   its ordered package issues while armour stays complete, every shield-role and issue action reaches
   its exact slot, and the capability passes axe in all ten projects
5. A Commander can read shield and armour strength and reach any contributing slot at this point

### Incremental Delivery

1. Setup + Foundational → the semantic sentinels, the cross-feature status contract, the pure
   projection, the presenter, the slot adapter and the repository policy
2. Add US1 → shield strength, armour strength, ordered issues, shield-role navigation and the
   feature 003 status adapter (MVP)
3. Add US2 → both recovery rates, both recovery durations with their distinct sentinels, and the
   complete cell-bank collection with its three states
4. Add US3 → hull hardness, module armour, module protection and the armour-role navigation records
5. Polish → the responsive, accessible, localized, announcement, offline and performance gates and a
   green `pnpm run check`

### Constitutional Guardrails

- No task calculates, sums, subtracts, divides, clamps, rounds, re-derives or reclassifies a package
  shield, recovery, cell-bank, armour or hardness figure; the single permitted arithmetic operation
  in this feature is dividing integer SYS half-pips by two while constructing the shared
  `systemsPips` value
- No task reconstructs a generator state from `powerBudget()`, compares deployed with retracted power
  bands, relabels a `powerCapacity` or `powerDraw` issue as a generator verdict, or collapses,
  reorders, deduplicates or parses a package calculation issue
- No task substitutes a fallback hull, an invented armour-unavailable state, a catalogue figure, a
  symbol, name or slot-position parse or an inferred cause for a package result
- No task divides an aggregate shield or armour contribution among fitted rows, attaches a numeric
  share or provenance claim to a role record, or fabricates a fitted bulkhead from the stock-armour
  calculation fallback
- No task clamps, absolutizes, generically labels or replaces an infinite effective hit-point value
  or either infinite recovery duration, and no task treats zero or a negative resistance as absence
- No task filters, groups, sums or merges cell banks, and no task collapses no-banks and
  fitted-all-unpowered into one state
- No task adds a backend, account, telemetry, cross-origin runtime request, second `ShipLoadout`,
  extra route, persisted defence field, private game-text translation or viewing-condition store of
  its own
- No task lowers the 80% coverage thresholds, drops a browser, viewport or orientation project, or
  skips a test to reach a green build

## Notes

- [P] tasks touch different files and have no incomplete dependency
- Every component task includes its unit test, its required-state preview declarations and its
  message keys; none of the three is a follow-up
- Commit after each task or logical group; stop at a checkpoint to validate a story independently
