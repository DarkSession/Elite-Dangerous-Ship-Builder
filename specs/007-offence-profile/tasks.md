---
description: 'Task list for Offence Profile'
---

# Tasks: Offence Profile

**Input**: Design documents from `/specs/007-offence-profile/`

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
`src/app/domain/offence/`, signal stores and adapters in `src/app/application/offence/`, surfaces in
`src/app/features/build-workspace/offence-profile/`, shared primitives and previews in
`src/app/ui/`, messages and formatters in `src/app/i18n/`, end-to-end suites in `e2e/`, repository
policy checks in `scripts/`. Unit tests live beside their source as `*.spec.ts`.

## Delivery gates

Feature 007 owns every weapon-output and weapons-capacitor semantic in the application and adds no
calculation of its own. Four gates apply and are named on the tasks they block:

- **Repository prerequisite**: TypeScript `strict` and Angular `strictTemplates` must be enabled in
  the shared configuration and the existing project must pass under them (constitution technology
  requirement, closed by feature 011).
- **Feature prerequisites**: feature 001 (one active `{ loadout, buildRevision }`, no-build state,
  `/build` workspace), feature 002 (exact-slot reveal and editing, package-populated fixed mounts and
  ingress normalization), feature 003 (integer-half-pip `ViewingConditions`, settled
  `conditionsRevision`, `StatusRevisionContext`, generic `StatusProvider<T, I>`, the shared
  `WorkspaceTarget` union, the `offenceProfile` detail target and the shared condition control) and
  feature 011 (tokens, components, localization, formatters, game-text presenter, announcement
  primitives, preview manifest, ten Playwright projects, axe helpers).
- **Owner-held integration ports (scheduled)**: feature 002 T004 exports the type-only
  same-revision `HardpointCoverage` read and T025 derives it; feature 005 T006 exports the
  generalized `MountPowerObservationPort` accepting any package slot key and T034 implements it over
  its owner-authored `powerBudget()` semantics. Feature 007 reads the latter at the power
  distributor's exact core slot key. Feature 007 must not substitute feature 005's
  `DistributorView.ready | unavailable`, infer coverage from `weapons.length`, or infer a power cause
  from capacitor zero, `distributorMetrics() === null`, a symbol prefix, a priority band or a slot
  name. An absent port is a sequencing dependency, never a licence for a feature-local substitute.
- **Contract-first exports**: feature 003's provider bundle waits on this feature's Phase 2 type
  exports (T005). That task must land before feature 003 can compile against a concrete offence
  contract; feature 003 never calls the Almanac for sustained DPS itself.

The pinned `@elite-dangerous-almanac/core@0.1.4` has no remaining feature-007 API blocker: fitted
maximum/falloff range, projectile boundaries, armour piercing and documented weapon ordering are all
present in the installed release.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Pin the package behaviour this feature projects and create the source and test locations
before any contract lands.

- [ ] T001 Pin the Almanac 0.1.4 weapon and capacitor behaviour this feature projects — `weaponMetrics()` accepting no options and returning `total` with `damagePerSecond`, `sustainedDamagePerSecond`, `energyPerSecond`, `sustainedEnergyPerSecond`, `heatPerSecond`, `sustainedHeatPerSecond`, `thermalLoad`, `powerDraw`, `damageByType` and `sustainedDamageByType`, plus `weapons` carrying exact `slot`, `symbol`, canonical `name`, `enabled`, all 14 required `WeaponMetrics` fields, `AmmunitionCapacity | null` and the optional `maximumRange`, `falloffRange`, `projectileRange` and `armourPiercing` members; `DamageSplit` requiring `kinetic`, `thermal`, `explosive`, `absolute` and `antiXeno` while omitting `unclassified` exactly when zero; documented ordering of known weapons in hull-slot order with unknown/unmapped slots appended in source order; `weaponsCapacitorMetrics(WeaponsOptions)` accepting fractional `weaponsPips` from zero through four and returning `weaponsPips`, `capacity`, `rechargeRate`, `sustainedEnergyPerSecond`, `netDrainRate` and `timeToDrain` including positive `Infinity`; and the leaf subpaths `ships/ship-loadout`, `ships/weapons`, `ships/weapons-capacitor`, `ships/ammunition` and `ships/modules` — in `src/app/domain/offence/almanac-offence-contract.spec.ts`
- [ ] T002 [P] Create the feature source skeleton `src/app/domain/offence/`, `src/app/application/offence/` and the `src/app/features/build-workspace/offence-profile/` directory per plan.md
- [ ] T003 [P] Create the feature suite `e2e/offence-profile.spec.ts` importing the feature 011 axe helper from `e2e/accessibility/axe.ts` and the semantic assertions from `e2e/accessibility/assertions.ts`, and register the Offence Profile surfaces in `e2e/coverage-ledger.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Publish the cross-feature contract feature 003 compiles against, bind the two owner-held
integration ports, then build the pure revision-stamped projection and the store every surface reads.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Cross-feature contracts (contract-first exports)

- [ ] T004 [P] Define the semantic discriminants `AmmunitionMeaning` (`none`, `finite`, `unlimited`), `DurationMeaning` (`finite`, `immediate`, `sustainingPoweredLoad`, `noDrainingPoweredLoad`) and `NativeFiringCondition` (`enabledReturnedWeapons`, `noEnabledReturnedWeapons`, `noFittedWeapons`, `qualifiedCoverage`) as pure constructors over retained package members, with unit tests proving `null` ammunition, finite capacity, `unlimited: true` with infinite hopper/total and `unlimited: false` with hopper zero stay four distinct outcomes, that finite positive, zero and both infinite `timeToDrain` meanings are selected only from the returned duration and the returned sustained draw, and that no constructor recomputes or rounds a package number, in `src/app/domain/offence/offence-semantics.ts` and `src/app/domain/offence/offence-semantics.spec.ts`
- [ ] T005 [P] Define `OffenceStatusProjection` (`sustainedDamagePerSecond`, `firingCondition`) and `OffenceStatusProvider extends StatusProvider<OffenceStatusProjection, 'sustainedDps'>` over feature 003's type-only domain leaf, documenting the fixed `detailTarget: { kind: 'detail', capability: 'offenceProfile' }` and that `qualifiedSummaryIds` carries `'sustainedDps'` only for unavailable hardpoint coverage, in `src/app/domain/offence/offence-status-projection.ts` (contract-first export: unblocks feature 003's provider bundle)
- [ ] T006 [P] Bind the two owner-held integration ports as revision-stamped read tokens — feature 002's `HardpointCoverage` (`confirmedEmpty`, `complete` with `occupiedSlots`, `unavailable`) from `src/app/domain/outfitting/hardpoint-coverage.ts` and feature 005's `MountPowerObservation` (`notApplicable`, `disabled`, `inactiveRetracted`, `powered`, `shed`, `unavailable`) from `src/app/domain/power-heat/mount-power-observation.ts`, read at the power distributor's exact core slot key and presented as absent where the owner returns `notApplicable` — importing the owner leaves and declaring no local copy of either union, with type-level conformance tests that fail compilation if an owner contract drifts or if feature 007 widens either union, in `src/app/domain/offence/offence-integration-ports.ts` and `src/app/domain/offence/offence-integration-ports.spec.ts` (depends on feature 002 T004 and feature 005 T006)

### Pure projection

- [ ] T007 Define `OffenceProjectionState` (`noBuild`, `pending`, `ready`, `failure` with `projectionFailed | integrationUnavailable`), `OffenceSnapshot` (`buildRevision`, `conditionsRevision`, `weapons`, `hardpointCoverage`, `capacitor`, `distributorPower`) and `OffencePresentationState` exactly as specified in data-model.md, holding the package result objects by reference and defining no local numeric copy of any weapon or capacitor field, in `src/app/domain/offence/offence-projection.ts` (depends on T004, T006)
- [ ] T008 Implement `projectWeapons(loadout)` calling `loadout.weaponMetrics()` exactly once per build revision and retaining the returned `BuildWeaponMetrics` object unchanged, with unit tests asserting the total is identity-equal to the package result rather than re-summed from `weapons`, that all ten `WeaponTotals` fields survive including numeric zero, that returned order is preserved for a reverse-input Sidewinder and for appended unknown/unmapped slots, that no local sort, `fittedModuleAt()` join, catalogue fallback or duplicate-symbol merge exists and that `slot` is never replaced by an array index, in `src/app/domain/offence/offence-projector.ts` and `src/app/domain/offence/offence-projector.spec.ts` (depends on T007)
- [ ] T009 Implement `projectDamageSplits(total)` exposing burst and sustained `kinetic`, `thermal`, `explosive`, `absolute` and `antiXeno` as required values and optional `unclassified` as present-or-absent, with unit tests asserting absent `unclassified` resolves to no-unclassified-damage rather than unavailable, that a present non-zero `unclassified` is retained exactly, that anti-xeno is carried as an overlay flag and never folded into a conventional partition and that no share, percentage, combined total or target-adjusted figure is produced, in `src/app/domain/offence/offence-projector.ts` and `src/app/domain/offence/offence-projector.spec.ts` (depends on T007)
- [ ] T010 Implement `projectWeaponEntry(weapon)` retaining exact `slot`, `symbol`, canonical `name`, `enabled`, every required `WeaponMetrics` field, `AmmunitionCapacity | null` and the four optional range/piercing members, classifying ammunition through `AmmunitionMeaning`, with unit tests covering a genuine zero-damage weapon, a disabled weapon, a continuous-fire weapon, present and absent effective `maximumRange`/`falloffRange`, a `projectileRange` whose `maximumBoundary` is absent, a `maximumBoundary` of exact zero that stays present, absent `armourPiercing`, and the four ammunition outcomes, asserting that an absent optional member is never zero-filled and that no range attenuation, piercing factor or firing-duration value is derived, in `src/app/domain/offence/offence-projector.ts` and `src/app/domain/offence/offence-projector.spec.ts` (depends on T004, T007)
- [ ] T011 Implement `projectCapacitor(loadout, conditions)` dividing feature 003's integer half-pip `conditions.pips.weapons` by two exactly once while constructing `WeaponsOptions`, calling `loadout.weaponsCapacitorMetrics()` once and retaining all six returned fields with the returned `weaponsPips` as the displayed allocation, then selecting a `DurationMeaning`, with unit tests for displayed WEP 0, 0.5, 2 and 4, an integer half-pip that is divided once and never twice, the stock Sidewinder WEP 2 result, a finite positive duration, an exact zero duration, infinity with positive returned draw, infinity with zero returned draw and the refusal to call the standalone capacitor calculator or recompute recharge, net drain or time to drain, in `src/app/domain/offence/offence-projector.ts` and `src/app/domain/offence/offence-projector.spec.ts` (depends on T004, T007)
- [ ] T012 Implement `projectFiringCondition(weapons, coverage)` selecting `noFittedWeapons` only for an empty returned collection with feature 002 `confirmedEmpty` coverage, `qualifiedCoverage` for `unavailable` coverage, `noEnabledReturnedWeapons` when every returned weapon is disabled and `enabledReturnedWeapons` otherwise, with unit tests proving an empty collection with unavailable coverage never claims no fitted weapons, that a non-empty collection with a zero total stays populated, that a numeric zero alone never selects a condition and that only package-resolved identities reach this input, in `src/app/domain/offence/offence-projector.ts` and `src/app/domain/offence/offence-projector.spec.ts` (depends on T007, T008)
- [ ] T013 Implement `projectOffence(context)` composing one immutable `OffenceSnapshot` from the build-revision-cached weapon result, the same-revision hardpoint coverage, one capacitor result for the captured revision pair and the captured deployed distributor observation, rechecking every revision before returning, emitting `integrationUnavailable` for a missing or mismatched owner port and `projectionFailed` only for an unexpected package or projector exception, and never publishing a prior-revision figure under a current-revision state, in `src/app/domain/offence/offence-projector.ts` (depends on T008, T009, T010, T011, T012)
- [ ] T014 Add the projection contract suite asserting `weaponMetrics()` is called at most once per build projection and shared by detail and Status, `weaponsCapacitorMetrics()` is called once per projected revision pair, a WEP change reprojects only the capacitor while the weapon result and its cache identity are unchanged, package zero and package infinity remain `ready` data rather than `failure`, a newer revision discards an older transaction, a mismatched port read fails the current transaction instead of being relabelled, the weapon total's `sustainedEnergyPerSecond` and the capacitor's `sustainedEnergyPerSecond` are never compared or reconciled, and no `Infinity` value leaves the projection through a generic serializer, in `src/app/domain/offence/offence-projector.contract.spec.ts` (depends on T013)

### Store, presentation and repository policy

- [ ] T015 Implement `OffenceFacade` capturing feature 001's atomic `{ loadout, buildRevision }` and feature 003's settled `StatusRevisionContext`, memoizing the weapon projection by `buildRevision` and the full snapshot by the revision pair in computed signals, publishing `noBuild`, `pending`, `ready` or `failure`, and holding `expandedSlots` as memory-only presentation state that survives an ordinary edit only while its exact slot still exists and clears on active-build replacement, with unit tests for each state, rapid interleaved build and condition changes, the refusal to publish a stale pair and expansion clearing, in `src/app/application/offence/offence.facade.ts` and `src/app/application/offence/offence.facade.spec.ts` (depends on T013)
- [ ] T016 Implement `OffencePresenter` selecting message keys, active-locale formatters for damage rates, MW, MJ, MJ/s, seconds, metres, pips, counts and ratings, and feature 011's game-text presenter for module names by exact `symbol` with disclosed canonical fallback, performing no arithmetic on any package figure and routing every `DurationMeaning`, `AmmunitionMeaning`, absent optional member and anti-xeno overlay to its own phrase, with unit tests proving canonical `name` is retained beside localized text, that `Infinity` never reaches a number formatter and that a locale change rebuilds presentation without advancing a revision, in `src/app/application/offence/offence.presenter.ts` and `src/app/application/offence/offence.presenter.spec.ts` (depends on T013)
- [ ] T017 Implement `OffenceAnnouncementCoordinator` emitting one coalesced polite message per settled build, condition or coverage revision that names changed offence availability, returned weapon count or duration meaning, staying silent for initial, pending, unchanged and discarded stale transitions, delegating slot-opening announcements to feature 002 without repeating them, keeping detail expansion silent and using feature 011's assertive alert once for a `failure` state, with unit tests for each case, in `src/app/application/offence/offence-announcement-coordinator.ts` and `src/app/application/offence/offence-announcement-coordinator.spec.ts` (depends on T015)
- [ ] T018 [P] Add the feature-owned framing message keys — capability heading and description, the `projectionFailed` and `integrationUnavailable` application-failure text, the enabled-returned-weapon and powered-deployed-firing scope statements, the anti-xeno overlay explanation, the no-unclassified-damage and field-specific not-stated phrases, the four duration phrases and the coverage-unavailable qualification — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T019 [P] Add the feature 007 boundary rules to `scripts/check-interface-foundations.mjs` — production code imports the Almanac only through the five pinned leaf subpaths and never a broad `ships` barrel, no file under `src/app/` outside `src/app/domain/offence/` calls `weaponMetrics` or `weaponsCapacitorMetrics`, no arithmetic operator is applied to a package weapon, damage, range, piercing, ammunition or capacitor field outside the single WEP half-pip division, no source references `damageFalloff`, `armourPiercingFactor` or `fittedModuleAt` for offence data, and feature 003 imports only the exported status contract leaf and never a feature 007 component or facade — with positive and negative fixtures in `scripts/check-interface-foundations.test.mjs`
- [ ] T020 Add the serialization-exclusion suite proving no `OffenceSnapshot`, package result, semantic discriminant, expanded-slot set, selected capability or revision pair reaches local storage, saved records, undo/redo history, preferences, the route, query or fragment, a copied build link or a SLEF export, and that no projection object is JSON-cloned, in `src/app/application/offence/offence.serialization.spec.ts` (depends on T015)

**Checkpoint**: The status contract, the bound integration ports, the pure projection, the facade and
the repository policy exist — feature 003 can compile against this feature and user story work can
begin.

---

## Phase 3: User Story 1 - Read build damage (Priority: P1) 🎯 MVP

**Goal**: The Offence Profile capability shows every returned whole-build total with its package
scope, presents burst and sustained damage types field-for-field with anti-xeno kept as an overlay,
keeps disabled weapons contributing exactly as the package specifies, distinguishes no fitted weapons
from fitted weapons producing zero totals, and supplies feature 003's compact sustained-DPS Status
contribution from the same cached result.

**Independent Test**: Load a fixture with multiple enabled weapons, then a confirmed-empty build, an
unavailable-coverage build and an all-disabled build, and run the offence unit suite plus
`pnpm run e2e -- offence-profile.spec.ts`: all ten total fields and both damage splits equal the
`weaponMetrics()` result for the settled revision, absent `unclassified` reads as no unclassified
damage rather than unavailable, anti-xeno is stated as an overlay with no combined total, only
confirmed-empty coverage says no fitted weapons, unavailable coverage carries an explicit
qualification with no fabricated figures, and feature 003's Status sustained DPS is identity-equal to
the detail value with the `offenceProfile` detail target.

### Tests for User Story 1

- [ ] T021 [P] [US1] Add weapon totals tests for burst and sustained DPS as separately labelled leading values, burst and sustained WEP draw and heat, thermal load and deployed plant draw, the enabled-returned-weapons scope statement rather than a powered-firing label, exact numeric zero retained under an all-disabled build, a genuine zero-damage weapon and unavailable coverage, and the absence of any alpha, share, range-band, convergence or target-adjusted figure, in `src/app/features/build-workspace/offence-profile/weapon-totals.component.spec.ts`
- [ ] T022 [P] [US1] Add damage-type output tests for separate complete burst and sustained groups, exact kinetic, thermal, explosive, absolute and anti-xeno values, optional `unclassified` shown when present and omitted or stated as none when absent, the anti-xeno overlay statement, and meaning that never depends on colour, bar length, fill, shape or position, in `src/app/features/build-workspace/offence-profile/damage-type-output.component.spec.ts`
- [ ] T023 [P] [US1] Add capability lifecycle tests for `noBuild` deferring to feature 001's workspace state with no package call, `pending` showing no stale or relabelled prior-revision figures, `ready` composition in the semantic order of design/offence-profile.md, `failure` distinguishing `projectionFailed` from `integrationUnavailable` through feature 011's alert while the active build stays intact and editable, and the confirmed-empty versus unavailable-coverage distinction, in `src/app/features/build-workspace/offence-profile/offence-profile.component.spec.ts`
- [ ] T024 [P] [US1] Add offence status provider tests asserting the returned `sustainedDamagePerSecond` is identity-equal to `weaponMetrics().total.sustainedDamagePerSecond` from the same cached projection, the four `NativeFiringCondition` values, both captured revisions on every read, `detailTarget` exactly `{ kind: 'detail', capability: 'offenceProfile' }`, `qualifiedSummaryIds: ['sustainedDps']` only for unavailable coverage and `[]` for populated, confirmed-empty and all-disabled results, that a numeric zero alone never qualifies the summary, that a WEP or selected-hardpoint change leaves the number unchanged and that an unexpected exception propagates to feature 003's failure boundary, in `src/app/application/offence/offence-status.provider.spec.ts`
- [ ] T025 [P] [US1] Add the build damage journey — no build, pending, a populated build compared field-for-field against the live package result after locale-aware parsing, an all-disabled build with exact zero totals and retained entries, a confirmed-empty build, an unavailable-coverage build with its qualification, a genuine zero-damage weapon, unclassified present and absent, a positive anti-xeno overlay, and feature 003's sustained-DPS headline opening the complete capability in one activation — in `e2e/offence-profile.spec.ts`

### Implementation for User Story 1

- [ ] T026 [US1] Implement `WeaponTotalsComponent` as semantic definition groups leading with separately labelled burst and sustained DPS, then burst and sustained WEP draw and heat, then thermal load and deployed plant draw, each carrying its package scope statement, with numeric zero rendered as a number and qualified only by adjacent coverage or weapon state, in `src/app/features/build-workspace/offence-profile/weapon-totals.component.ts` and its template and styles (depends on T007, T016)
- [ ] T027 [US1] Implement `DamageTypeOutputComponent` rendering burst and sustained as two complete labelled groups with all required types as text, the optional unclassified row present only when the package returns it, the anti-xeno overlay statement wherever the relationship could be misunderstood, and no calculated percentage, stacked share, combined total or colour-only meaning, in `src/app/features/build-workspace/offence-profile/damage-type-output.component.ts` and its template and styles (depends on T007, T016)
- [ ] T028 [US1] Implement `OffenceAnnouncerComponent` as a visually hidden polite region bound to `OffenceAnnouncementCoordinator`, using feature 011's assertive alert only for a current-revision failure and never for a settled change, in `src/app/features/build-workspace/offence-profile/offence-announcer.component.ts` (depends on T017)
- [ ] T029 [US1] Implement the `OffenceProfileComponent` container — capability heading and concise active-build context, feature 003's shared viewing-condition group composed without a second draft or WEP store, settled WEP and deployed-firing context, the totals, the damage-type groups, the coverage-unavailable qualification and the four lifecycle states from `OffenceFacade` — in `src/app/features/build-workspace/offence-profile/offence-profile.component.ts` and its template and styles (depends on T015, T026, T027, T028)
- [ ] T030 [US1] Register Offence Profile as the `offenceProfile` detail capability in the desktop capability selector and the narrow capability navigation, selected in memory through feature 003's workspace target coordinator with no route, query, fragment, history or persistence change, in `src/app/features/build-workspace/build-workspace.ts` and its template (depends on T029)
- [ ] T031 [US1] Implement `OffenceStatusProvider`, selecting the facade's cached weapon projection for the exact captured context and returning the revision-stamped `OffenceStatusProjection` with the fixed detail target and the coverage-driven qualification, performing no second Almanac call and no recomputation, in `src/app/application/offence/offence-status.provider.ts` (depends on T005, T015)
- [ ] T032 [US1] Wire the status provider and the two consumed integration ports through application composition so feature 003 receives the provider and feature 007 receives the owner reads with no runtime circular dependency between domain modules, in `src/app/application/offence/offence.providers.ts` (depends on T006, T031)
- [ ] T033 [P] [US1] Add the US1 message keys — capability heading, burst and sustained DPS labels, WEP draw, heat, thermal load and deployed plant draw labels, the enabled-returned-weapons scope statement, damage-type names, the anti-xeno overlay phrase, the no-unclassified-damage phrase, the no-fitted-weapons statement and the coverage-unavailable qualification — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T034 [P] [US1] Add `WeaponTotalsComponent`, `DamageTypeOutputComponent`, `OffenceAnnouncerComponent` and `OffenceProfileComponent` preview declarations covering populated, confirmed-empty, unavailable-coverage, all-disabled, genuine-zero, unclassified-present, unclassified-absent, positive and zero anti-xeno, pending, `projectionFailed` and `integrationUnavailable` states at 1440×900, 834×1112, 1112×834, 390×844 and 844×390 with long and expanded text, RTL and high-zoom container fixtures, in `src/app/ui/previews/preview-manifest.ts`
- [ ] T035 [US1] Add the US1 surfaces, the FR-001, FR-002, FR-003 and FR-005 ids, the compact sustained-DPS Status contribution, journeys and axe flags to `e2e/coverage-ledger.ts`

**Checkpoint**: Whole-build damage, damage-type meaning and the empty-versus-zero distinction are
independently demonstrable, and feature 003 receives owner-authored offence semantics.

---

## Phase 4: User Story 2 - Inspect weapons (Priority: P1)

**Goal**: Every returned weapon appears as its own entry in package order with exact identity, slot,
enabled state and ammunition, exposes every returned output, operating-cost, range and piercing field
in a same-entry detail region, keeps every absent optional member not stated rather than zero, and
reaches its exact hardpoint slot in one interaction.

**Independent Test**: Load fixtures with duplicate module symbols in distinct slots, a disabled
weapon, a genuine zero-damage weapon, present and absent effective ranges, a projectile boundary of
zero, absent piercing and all four ammunition outcomes, then run the offence unit suite plus
`pnpm run e2e -- offence-profile.spec.ts`: every entry deep-equals its `FittedWeaponMetrics`,
returned order is preserved for reverse input and appended unknown slots, absent optional members
read as field-specific not stated, unlimited ammunition never reaches a number formatter, and every
slot action hands feature 002 the exact original key once at both wide and narrow layouts.

### Tests for User Story 2

- [ ] T036 [P] [US2] Add weapon output entry tests for localized game text with disclosed canonical fallback and an unavailable state, exact slot and enabled/disabled text, burst and sustained DPS, range and piercing availability, ammunition meaning, the collapsed summary and the expanded complete detail region carrying damage per shot, burst and sustained fire rate, continuous-fire state, burst and sustained damage, WEP draw and heat, thermal load, deployed plant draw, both full damage-type groups, effective maximum and falloff distance in metres, separately named unitless projectile boundaries including a boundary of exact zero, armour piercing as a rating, and full-rearm clip, hopper, total and unlimited state, with field-specific not-stated text for each absent optional member, in `src/app/features/build-workspace/offence-profile/weapon-output-entry.component.spec.ts`
- [ ] T037 [P] [US2] Add weapon output collection tests for one entry per returned weapon in exact package order with no local sort, no duplicate-symbol merge and no positional identity, retained disabled and genuine-zero entries, the confirmed-empty and unavailable-coverage collection states, and a distinct details control and exact-slot action per entry that are separate feature 011 target-sized controls where activating the card itself never navigates, in `src/app/features/build-workspace/offence-profile/weapon-output-list.component.spec.ts`
- [ ] T038 [P] [US2] Add offence workspace adapter tests asserting every emitted target is exactly `{ kind: 'slot', slotKey: weapon.slot }` carrying the original key once, that duplicate module symbols in distinct slots never target one another, that the action stays available for disabled and zero-output weapons, that expansion state never enters the target, and that slot or capability selection changes no build, revision, history, route, link or SLEF, in `src/app/application/offence/offence-workspace.adapter.spec.ts`
- [ ] T039 [P] [US2] Extend `e2e/offence-profile.spec.ts` with the weapon inspection journey — expanding and collapsing details for multiple entries, duplicate symbols in distinct slots, a disabled entry, a genuine zero entry, every ammunition and optional range/piercing outcome, wide-layout inline slot reveal and narrow-layout selected-slot layer with a named return, and confirmation that expansion is silent while slot opening is announced once by feature 002

### Implementation for User Story 2

- [ ] T040 [US2] Implement `WeaponOutputEntryComponent` rendering the always-available summary and the same-entry complete detail region for one `FittedWeaponMetrics`, with the feature 011 game-text presenter for the module name beside the retained canonical identity, field-specific not-stated text for each absent optional member and the unlimited ammunition phrase kept away from every number formatter, in `src/app/features/build-workspace/offence-profile/weapon-output-entry.component.ts` and its template and styles (depends on T010, T016)
- [ ] T041 [US2] Implement `WeaponOutputListComponent` rendering the returned collection in package order as row-owned disclosures where the inline size allows and equivalent labelled cards when stacked, carrying the confirmed-empty and unavailable-coverage states without inserting a non-package entry, in `src/app/features/build-workspace/offence-profile/weapon-output-list.component.ts` and its template and styles (depends on T040)
- [ ] T042 [US2] Implement `OffenceWorkspaceAdapter` emitting feature 003's shared `WorkspaceTarget` for the exact returned slot key and delegating reveal, selection and editing to feature 002, in `src/app/application/offence/offence-workspace.adapter.ts` (depends on T015)
- [ ] T043 [US2] Compose the weapon collection last in the semantic order of `OffenceProfileComponent`, after the coverage qualification, spanning the available width at roomy widths and stacking without omitting a field or action otherwise, and bind entry expansion to the facade's memory-only `expandedSlots`, in `src/app/features/build-workspace/offence-profile/offence-profile.component.ts` and its template and styles (depends on T029, T041, T042)
- [ ] T044 [P] [US2] Add the US2 message keys — weapon collection heading, slot and enabled/disabled labels, damage per shot, burst and sustained fire rate, continuous-fire, effective maximum and falloff range, projectile boundary names, armour piercing rating, clip, hopper, total and unlimited ammunition labels, the no-ammunition and zero-reserve phrases, the per-field not-stated phrases, the details disclosure name and the weapon-and-slot action name pattern — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T045 [P] [US2] Add `WeaponOutputEntryComponent` and `WeaponOutputListComponent` preview declarations for collapsed and expanded entries, finite, zero-reserve, unlimited and absent ammunition, present and absent effective range, projectile boundary zero, absent piercing, disabled, genuine-zero and continuous-fire entries, duplicate symbols in distinct slots, multiple entries in package order, confirmed-empty, unavailable coverage, pending and failure at all five viewports with long canonical module names and RTL fixtures, in `src/app/ui/previews/preview-manifest.ts`
- [ ] T046 [US2] Add the US2 surfaces and the FR-002, FR-004 and FR-005 ids with their exact-slot, package-order, optional-absence and ammunition assertions to `e2e/coverage-ledger.ts`

**Checkpoint**: Every returned weapon is completely inspectable and reachable in one interaction while
the totals and damage types stay unchanged.

---

## Phase 5: User Story 3 - Read firing endurance (Priority: P2)

**Goal**: WEP capacity, recharge, sustained draw, net drain and time to drain are shown for the
selected WEP pips, a sustaining build is described as firing indefinitely, and a build with no powered
distributor keeps the package's zero-capacity result beside the independent owner-supplied deployed
distributor observation without inferring a cause.

**Independent Test**: Apply feature 003 allocations at displayed WEP 0, 0.5, 2 and 4 plus an invalid
draft, across draining, immediate-drain, sustaining and no-draining-load fixtures and each deployed
distributor observation, then run the offence unit suite plus
`pnpm run e2e -- offence-profile.spec.ts`: all six fields deep-equal `weaponsCapacitorMetrics()` for
the settled revision pair, integer half-pips divide by two exactly once, an invalid draft calls no
feature 007 package boundary and advances no revision, each of the four duration meanings is stated
in text, zero capacity stays numeric beside a separate distributor fact, and aggregate weapon EPS is
never forced to equal the powered capacitor draw.

### Tests for User Story 3

- [ ] T047 [P] [US3] Add capacitor endurance tests for the returned allocation and all six exact fields as labelled text at every width, the displayed allocation taken from the returned `weaponsPips` rather than the draft or the integer half-pip value, localized finite seconds, the immediate-drain phrase for exact zero, the sustaining-powered-load phrase for infinity with positive returned draw, the no-draining-powered-load phrase for infinity with zero returned draw that makes no claim the weapons can fire, the explicit distinction between total weapon sustained WEP draw and powered capacitor draw, and the absence of any raw `Infinity`, infinity glyph or locally normalized bar, in `src/app/features/build-workspace/offence-profile/capacitor-endurance.component.spec.ts`
- [ ] T048 [P] [US3] Add distributor power context tests for the powered, disabled, shed, absent and unavailable observations rendered as a separate same-revision fact beside a zero or positive capacity, the missing-owner-port state rendering the blocking `integrationUnavailable` alert rather than a guess, and the absence of any wording that states one fact caused the other, in `src/app/features/build-workspace/offence-profile/distributor-power-context.component.spec.ts`
- [ ] T049 [P] [US3] Extend `e2e/offence-profile.spec.ts` with the endurance journey — displayed WEP 0, 0.5, 2 and 4 through feature 003's shared Apply, an invalid draft retaining the prior settled result, a draining load, positive-draw zero capacity, a sustaining positive draw, an all-disabled zero-draw infinity, a no-weapons build, each deployed distributor observation, confirmation that weapon totals and Status sustained DPS do not change merely because WEP changes, and one coalesced polite announcement per accepted change

### Implementation for User Story 3

- [ ] T050 [US3] Implement `CapacitorEnduranceComponent` rendering the returned allocation, capacity, recharge, powered deployed sustained draw, net drain and time to drain as labelled definitions with the selected `DurationMeaning` phrase visible and programmatically associated with its field, the two EPS scopes explicitly labelled, and no bar or normalized visual in the absence of a package-authored scale, in `src/app/features/build-workspace/offence-profile/capacitor-endurance.component.ts` and its template and styles (depends on T011, T016)
- [ ] T051 [US3] Implement `DistributorPowerContextComponent` rendering the owner-supplied deployed distributor observation as its own labelled fact adjacent to the capacitor group, with distinct text for powered, disabled, shed, absent and unavailable and no causal wording, in `src/app/features/build-workspace/offence-profile/distributor-power-context.component.ts` and its template and styles (depends on T006, T016)
- [ ] T052 [US3] Compose the capacitor and distributor regions after the damage-type groups and before the coverage qualification in `OffenceProfileComponent`, pairing them as fluid adjacent regions at roomy widths and stacking them in semantic order otherwise, in `src/app/features/build-workspace/offence-profile/offence-profile.component.ts` and its template and styles (depends on T029, T043, T050, T051)
- [ ] T053 [P] [US3] Add the US3 message keys — capacitor section heading, WEP allocation, capacity, recharge, sustained firing draw, net drain and time to drain labels, the MJ, MJ/s and second unit patterns, the immediate-drain, sustaining-powered-load and no-draining-powered-load phrases, the two EPS scope statements and the five distributor observation phrases — to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [ ] T054 [P] [US3] Add `CapacitorEnduranceComponent` and `DistributorPowerContextComponent` preview declarations for a finite draining result, immediate drain, positive-draw infinity, zero-draw infinity, zero capacity, displayed WEP 0 and 4, each of the five distributor observations, pending, `projectionFailed` and `integrationUnavailable` at all five viewports with decimal-comma and expanded-label locale fixtures, in `src/app/ui/previews/preview-manifest.ts`
- [ ] T055 [US3] Add the US3 surfaces and the FR-006 and FR-007 ids with their half-pip boundary, six-field, duration-meaning and distributor-observation assertions to `e2e/coverage-ledger.ts`

**Checkpoint**: All three stories are independently functional and the complete capability presents
one settled revision.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T056 Implement the responsive composition — fluid adjacent totals, damage-type and capacitor regions followed by a full-width weapon collection at roomy widths, chosen from available inline size rather than device-name branching, and one complete semantic single column in the order condition context, totals, damage types, capacitor, qualification, weapons at narrow widths, both landscape phone orientations, 200% text and 400% zoom with no shortened content and no omitted action — in `src/app/features/build-workspace/offence-profile/offence-profile.component.ts` and its template and styles (depends on T052)
- [ ] T057 [P] Run the complete capability in Chromium and Firefox at desktop, tablet portrait and landscape and mobile portrait and landscape with an axe scan over every no-build, pending, ready, `projectionFailed`, `integrationUnavailable`, confirmed-empty, unavailable-coverage, some-disabled, all-disabled, genuine-zero, unclassified-absent, absent-optional-field, no-ammunition, unlimited-ammunition, zero-capacity, immediate-drain and both-infinity state, in `e2e/offence-profile.spec.ts`
- [ ] T058 [P] Assert 200% text, actual 400% browser zoom, expanded translations, long canonical module names and RTL layout with no lost content, function, weapon/fact/action association or document horizontal scrolling, and that a wide weapon table scrolls only inside its own labelled container, in `e2e/offence-profile.spec.ts`
- [ ] T059 [P] Assert touch operation and shared target-size tokens for every details disclosure, exact-slot action, condition control and capability navigation control with no overlap at mobile width, that a card activation never silently navigates, and that `prefers-reduced-motion` changes only transitions and never content, state or announcement timing, in `e2e/offence-profile.spec.ts`
- [ ] T060 [P] Assert one coalesced polite announcement per settled build, condition or coverage change, silence for initial, unchanged, pending and discarded stale projections, silent detail expansion, a single feature 002 announcement for slot opening with no duplicate, and one assertive alert for a current-revision projection or integration failure, in `e2e/offence-profile.spec.ts`
- [ ] T061 [P] Add the locale sweep asserting owned strings and semantic phrases come from messages, damage rates, MW, MJ, MJ per second, seconds, metres, pips, counts and ratings use active-locale formatters, `Infinity` never appears in rendered output, and weapon names come from the Almanac by exact symbol with disclosed canonical fallback or an unavailable state, across every shipped locale and the pseudo-locales in `src/app/i18n/testing/pseudo-locales.ts`, in `e2e/offence-profile.spec.ts`
- [ ] T062 [P] Add the offline journey — load the workspace, go offline, open Offence, expand weapon details, reallocate WEP pips and open an exact slot with no cross-origin request and no capability degradation — in `e2e/offence-profile.spec.ts`
- [ ] T063 Add the in-page settled-status measurement under Chromium CDP `Emulation.setCPUThrottlingRate(4)` at the mobile viewport, asserting the feature 007 status provider keeps feature 003's settled status update from a committed build or condition revision to rendered DOM carrying the same pair, and that one projection performs no duplicate `weaponMetrics()` or `weaponsCapacitorMetrics()` call and that detail and Status hold the identical cached result object, in `e2e/offence-profile.spec.ts` (depends on T031)
- [ ] T064 [P] Write and run the versioned NVDA/Firefox desktop, TalkBack/Chromium mobile and tablet screen-reader protocols covering the three user stories — headings and regions, the shared condition group, the totals and damage-type definition groups, the capacitor fields with their duration phrases, the distributor fact, the coverage qualification, weapon summaries with their disclosures and exact-slot actions, and settled announcements — with result records in `e2e/manual/screen-reader.protocol.md` and `e2e/manual/results/`
- [ ] T065 Reconcile the coverage ledger with the feature 007 surfaces, exported components, preview declarations and Playwright project names, and assert every conformance statement covering this capability names the constitutional exclusions "WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11", in `scripts/check-interface-foundations.mjs` (depends on T035, T046, T055)
- [ ] T066 Restore unit coverage to at least 80% statements, branches, functions and lines for `src/app/domain/offence/`, `src/app/application/offence/` and `src/app/features/build-workspace/offence-profile/` under the thresholds in `angular.json`
- [ ] T067 [P] Record the Offence Profile capability, its two consumed integration ports and the out-of-scope target simulation, damage-at-range aggregation and shot convergence in `AGENTS.md` and `README.md`
- [ ] T068 Execute every section of `specs/007-offence-profile/quickstart.md` against the reference corpus and fix each divergence
- [ ] T069 Run `pnpm run check` and confirm formatting, strict compilation, policy checks, build, unit coverage, all ten Playwright projects and all axe scans pass with no skipped, focused or quarantined test

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: starts once the feature prerequisites in Delivery gates are available; the
  two owner-held integration ports are scheduled as feature 002 T004 and feature 005 T006
- **Foundational (Phase 2)**: depends on Phase 1 and blocks every user story; T005 also unblocks
  feature 003's provider bundle, and T006 cannot land before feature 002 T004 exports
  `HardpointCoverage` and feature 005 T006 exports `MountPowerObservationPort`
- **User stories (Phases 3–5)**: all depend on Phase 2 and can then proceed in parallel or in
  priority order US1 → US2 → US3
- **Polish (Phase 6)**: depends on every delivered story

### User story dependencies

- **US1 (P1)**: depends only on Phase 2. It also delivers feature 003's Status provider, because the
  Status contribution selects the same cached `weaponMetrics()` result as the detail surface
- **US2 (P1)**: depends only on Phase 2. Its composition task T043 touches the capability container
  first created in T029
- **US3 (P2)**: depends only on Phase 2. Its composition task T052 touches the same container and
  therefore follows T043 rather than running beside it

### Within each user story

- Tests are written first and must fail before implementation
- Domain projection before facade, facade before adapters and components, components before workspace
  composition
- Message keys and preview declarations ship with their component, never as follow-up work

### Parallel opportunities

- Phase 1: T002 and T003 run together
- Phase 2: T004, T005 and T006 run together; T008–T012 run together once T007 lands; T018 and T019
  run alongside T015–T017
- Phase 3: T021–T025 run together; T033 and T034 run together
- Phase 4: T036–T039 run together; T044 and T045 run together
- Phase 5: T047–T049 run together; T053 and T054 run together
- Phase 6: T057–T062, T064 and T067 run together
- Across teams: once Phase 2 completes, one developer takes US1 while another takes US2 and US3;
  only the three capability-container composition tasks need serializing

## Parallel Example: User Story 1

```bash
# Launch the failing tests together:
Task: "Weapon totals tests in src/app/features/build-workspace/offence-profile/weapon-totals.component.spec.ts"
Task: "Damage-type output tests in src/app/features/build-workspace/offence-profile/damage-type-output.component.spec.ts"
Task: "Capability lifecycle tests in src/app/features/build-workspace/offence-profile/offence-profile.component.spec.ts"
Task: "Offence status provider tests in src/app/application/offence/offence-status.provider.spec.ts"
Task: "Build damage journey in e2e/offence-profile.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — this blocks everything and unblocks feature 003
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: all ten totals and both damage splits match `weaponMetrics()` by identity,
   absent unclassified reads as none rather than unavailable, anti-xeno stays an overlay, only
   confirmed-empty coverage claims no fitted weapons, feature 003's sustained-DPS Status equals the
   detail value, and the capability passes axe in all ten projects
5. A Commander can read complete build damage and open the capability from Status at this point

### Incremental Delivery

1. Setup + Foundational → the semantic discriminants, the status contract, the bound integration
   ports, the pure projection, the facade and the repository policy
2. Add US1 → whole-build totals, damage-type meaning, the empty-versus-zero distinction and feature
   003's Status contribution (MVP)
3. Add US2 → the complete returned weapon collection with exact per-weapon fields and one-interaction
   slot reach
4. Add US3 → the six exact capacitor fields, the four duration meanings and the independent
   distributor observation
5. Polish → the responsive, accessible, localized, offline and performance gates and a green
   `pnpm run check`

### Constitutional Guardrails

- No task calculates, sums, subtracts, divides, clamps, rounds, re-derives or reclassifies a package
  weapon, damage, range, piercing, ammunition or capacitor figure; the single permitted arithmetic
  operation in this feature is dividing the settled integer WEP half-pips by two while constructing
  `WeaponsOptions`
- No task creates a damage share, percentage, conventional-plus-anti-xeno total, range attenuation,
  range-band aggregation, target resistance, alpha, convergence, shot-spread, reload-count,
  synthesis or firing-duration value; those results are out of scope because the package does not
  return them for a build
- No task substitutes a catalogue figure, `fittedModuleAt()` join, `damageFalloff()` or
  `armourPiercingFactor()` call, symbol or slot parse, positional index or inferred cause for a
  package result, and no package zero, `null` or `Infinity` receives a diagnosis
- No task hides a disabled or genuine-zero weapon, merges identical module symbols, sorts the
  returned collection, inserts a non-package entry, zero-fills an absent optional member or calls an
  absent optional member unavailable
- No task lets `Infinity` reach a generic number formatter, JSON boundary or visual label
- No task adds a backend, account, telemetry, cross-origin runtime request, second `ShipLoadout`,
  extra route, persisted metric, private game-text translation or viewing-condition store of its own
- No task lowers the 80% coverage thresholds, drops a browser, viewport or orientation project, or
  skips a test to reach a green build

## Notes

- [P] tasks touch different files and have no incomplete dependency
- Every component task includes its unit test, its required-state preview declarations and its
  message keys; none of the three is a follow-up
- Commit after each task or logical group; stop at a checkpoint to validate a story independently
