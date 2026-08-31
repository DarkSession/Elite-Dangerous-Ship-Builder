---
description: 'Task list for Ship Statistics and Status'
---

# Tasks: Ship Statistics and Status

**Input**: Design documents from `/specs/003-ship-statistics/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[design/reference-review.md](./design/reference-review.md), [design/status-rail.md](./design/status-rail.md)

> **Rewritten 2026-08-22 (wave 11).** The original 86 tasks assembled a five-provider status
> projection, a wide Status capability, a viewing-conditions control and a count announcer. The three
> design rulings withdrew or reassigned all of it; see
> [Retired tasks](#retired-tasks) for where each group went. What is left is the surface the canvas
> actually draws.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Every task names the exact file it changes

## Path Conventions

The status rail is feature 009's existing region inside
`src/app/features/build-workspace/outfitting/`, and this feature's block is a sibling of
`cost-materials/` there — not a parallel `status/` tree, and not a `domain/statistics/` module, because
there is no calculation, no composition and no port to put in one. Unit tests live beside their source
as `*.spec.ts`; end-to-end suites are in `e2e/`.

## Delivery gates

Features 001, 002 and 011 are prerequisites and are delivered. **No gate remains**: ruling C removed
this feature's dependency on features 005–009, because it no longer composes their results.

---

## Phase 1: Contract

- [x] T001 Characterize the installed Almanac validation contract — `LoadoutIssue` shape, `severity`
      values, package `issues` order, `LoadoutIssueParams` including string-array values, and
      `getLoadoutIssueMessage` returning canonical English and `null` outside English — using leaf
      subpath imports in
      `src/app/features/build-workspace/outfitting/build-status/almanac-validation-contract.spec.ts`

## Phase 2: The block

- [x] T002 Implement `BuildStatus` — one list item per `loadout.validation.issue` in package order,
      each with its severity in words and its diagnostic through feature 011's `GameTextPresenter`
      and `edsb-game-text`, absent entirely when the package reports none — in
      `src/app/features/build-workspace/outfitting/build-status/build-status.ts` and its template
      (depends on T001)
- [x] T003 Style the two severity treatments from the canvas's tiers 1 and 3 using only design
      tokens, with the marker colour repeating the severity word rather than carrying it, in
      `src/app/features/build-workspace/outfitting/build-status/build-status.scss` (depends on T002)
- [x] T004 [P] Add the feature's message keys — the two package severity names, and nothing else,
      because the list sits directly under the rail's own visible heading and needs no second name —
      to `src/app/i18n/locales/en.json` and `src/app/i18n/locales/de.json`
- [x] T005 Make the rail's `BUILD STATUS` heading visible, name the rail region by it instead of by
      the invisible label, and mount `edsb-build-status` above `edsb-cost-materials`, in
      `src/app/features/build-workspace/outfitting/outfitting-workspace/outfitting-workspace.html`
      and its styles and component (depends on T002)

## Phase 3: Tests

- [x] T006 Add unit tests for package order, both severities as visible text, full
      `LoadoutIssueParams` including string arrays, the canonical fallback with its untranslated
      disclosure on a `null` helper result, and the absence of the whole block when the package
      reports no issues, in
      `src/app/features/build-workspace/outfitting/build-status/build-status.spec.ts` (depends on T002)
- [x] T007 Add the structural journey — a build with issues, a build with none, both severities,
      package order, no interactive element in the block, and the withdrawn surface staying withdrawn
      (no counts, no structural-facts list, no slot action, no wide Status tab) — in
      `e2e/ship-status.spec.ts`
- [x] T008 Add `003-ship-statistics` to `COVERED_FEATURES` and register a `build/validation-issues`
      surface carrying every id `spec.md` declares, in `e2e/coverage-ledger.ts` (depends on T007)

## Phase 4: Gate

- [x] T009 Restore unit coverage to at least 80% statements, branches, functions and lines for the
      new source under the thresholds in `angular.json` (depends on T006)
- [x] T010 Run `pnpm run check` and confirm formatting, strict compilation, policy checks, build,
      unit coverage, all ten Playwright projects and all axe scans pass with no skipped, focused or
      quarantined test (depends on T008, T009)

- [x] T011 State what the build carries. Add `projectCapacity` in
      `src/app/domain/build-capacity/build-capacity.ts`, reading `cargoCapacity` and
      `passengerCapacity` off the build, and draw the two cells as `edsb-capacity-summary` in
      `src/app/features/build-workspace/outfitting/capacity-summary/`, flowing into the rail's own
      grid the way features 006 to 008 do. Message keys in both shipped locales, unit tests beside
      both files, and the rail journey in `e2e/ship-status.spec.ts` (FR-023, SC-007)
- [x] T012 Draw the rail's cell band wherever the rail is drawn, and stand the workspace's compact
      strip of key readings down while the rail is open, in
      `src/app/features/build-workspace/outfitting/outfitting-workspace/`. Register
      `build/capacity-cells` in `e2e/coverage-ledger.ts` beside the journey that exercises it
      (FR-024)
- [x] T013 Narrow feature 008's withdrawn-aggregate rule to `unladenMass` and `fuelCapacity` in
      `scripts/policy/mobility-jump-ownership.mjs`, and fence `cargoCapacity` inside that feature's
      own files instead, so a figure this rail draws is not one no file may read (FR-023)

---

## Retired tasks

| Original                                 | Subject                                                                             | Where it went                                                                                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| T004, T008, T013, T018, T051–T062        | Viewing conditions: domain, store, control, reset triggers, serialization exclusion | **Feature 005** — ruling C puts the pip and hardpoint controls in the Power capability                                                         |
| T005, T017                               | `WorkspaceTarget`, `DetailTarget`, target coordinator                               | **Withdrawn** — ruling A: nothing in the block is interactive                                                                                  |
| T006, T007, T014                         | Provider envelope, identity table, five-provider bundle                             | **Withdrawn** — nothing is composed. Feature 009 already ships its block by calling one pure projection directly, and 005–008 will do the same |
| T009–T012, T015                          | Status projection types, composition transaction, `StatusStore`                     | **Withdrawn** with the envelope. `ShipLoadout.validation` is a field on the build already in memory                                            |
| T016, T030, T065                         | Announcement coordinator and count announcer                                        | **Withdrawn** — ruling A: there are no counts, and visible content is not live                                                                 |
| T021, T027                               | `StructuralFacts` definition list                                                   | **Withdrawn** — ruling A: no canvas draws an all-clear state                                                                                   |
| T024, T031, T032, T045, T056, T069, T071 | `StatusCapability`, its registration and its compositions                           | **Withdrawn** — ruling B: canvas 1c draws five tabs and no Status mode                                                                         |
| T036–T050                                | Metric cards, power headline, headline set, rail mounting                           | **Features 005–008** — they own the cells the canvas draws                                                                                     |
| T063, T064, T067, T068, T070, T073, T074 | Assembly requirements and qualification summary                                     | **Feature 009** (built) and **withdrawn** (qualification summary, ruling A)                                                                    |
| T019, T033, T048, T060                   | Message keys for withdrawn surfaces                                                 | Reduced to T004                                                                                                                                |
| T034, T049, T061, T074                   | Preview declarations                                                                | **Withdrawn** — the one surviving component is a feature block, not a shared primitive                                                         |
| T041, T072, T076–T085                    | Timing budget, provenance integration, polish sweeps                                | Their subjects moved with the surfaces above; what remains is folded into T007 and T010                                                        |
| T002, T003, T020, T029, T035, T082, T083 | Skeletons, boundary rules, ledger reconciliation                                    | Folded into T005, T007 and T008                                                                                                                |

---

## Dependencies & Execution Order

T001 → T002 → T003/T005/T006 → T007 → T008 → T009 → T010. T004 is independent of everything but T006.
