---
description: 'Task list for Defence Profile'
---

# Tasks: Defence Profile

> **Rewritten at implementation, 2026-08-24.** The original eighty tasks were written against a
> decomposition this build does not have: a `SemanticNumber` union, a `defence-projector` split
> across six files, an application presenter, a feature 003 `StatusProvider`, a workspace slot
> adapter, seven feature components and a preview registration. Feature 003 publishes no such
> provider, canvas 1c draws no action inside either card, and the surface it does draw is two cards
> and one rail block. The delivered tasks are below; the withdrawn ones are named at the foot with
> the reason each was dropped, so the original numbering stays traceable.

**Input**: Design documents from `/specs/006-defence-profile/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [design/](./design/),
[quickstart.md](./quickstart.md)

**Tests**: Test tasks are included. Every contract in this feature names its own required
verification, the specification gates delivery on SC-001–SC-003, and constitution principle VIII
gates the build on unit coverage, the ten-project Playwright matrix and automated accessibility
scans.

## Path Conventions

Single Angular workspace at the repository root: the framework-agnostic projection in
`src/app/domain/defence/`, the two surfaces in
`src/app/features/build-workspace/outfitting/defence-analysis/` and
`.../defence-summary/`, shared primitives in `src/app/ui/`, messages and formatters in
`src/app/i18n/`, the end-to-end suite in `e2e/`, repository policy checks in `scripts/`. Unit tests
live beside their source as `*.spec.ts`.

## Delivery gates

Feature 006 owns every shield, recovery, cell-bank, armour, hardness and module-protection semantic
in the application and adds no calculation of its own.

- **Repository prerequisite**: TypeScript and template `strict` settings, closed by feature 011.
- **Feature prerequisites**: feature 001 (one active `ShipLoadout`, atomic `buildRevision`, no-build
  state, `/build` workspace), feature 005 (the SYS pip allocation, already in the package's `[0, 4]`
  units), feature 010 (the anatomy mode strip and the space its plates leave) and feature 011
  (tokens, components, localization, formatters, game-text presenter, ten Playwright projects, axe
  helpers).
- **The reference is the template**: nothing user-facing is added that `.design/Ship Builder.dc.html`
  does not draw. Where the specification disagreed with it, the specification was corrected.

---

## Phase 1: Setup

- [x] T001 Characterize the installed Almanac defence contract this feature projects —
      `shieldMetricsResult(DefenceOptions)` and `shieldRecoveryResult(DefenceOptions)` returning
      `CalculationResult` with `complete`, the value and an ordered `CalculationIssue[]` carrying
      `field`, `reason`, optional `slot`/`symbol` and params; `ShieldMetrics`; `ShieldRecovery`;
      the frozen `CellBankSummary`; the non-nullable `armourMetrics()`; `getShipBySymbol().hardness`;
      and the leaf subpaths this feature may import — in
      `src/app/domain/defence/almanac-defence-contract.spec.ts`
- [x] T002 Create `src/app/domain/defence/` and the two feature block directories under
      `src/app/features/build-workspace/outfitting/`
- [x] T003 Create `e2e/defence.spec.ts` against the feature 011 axe and assertion helpers, and
      register the Defence surfaces from [design/screen-inventory.md](./design/screen-inventory.md)
      in `e2e/coverage-ledger.ts`

## Phase 2: The projection

- [x] T004 Define `CalculationView<T>` and `CalculationIssueView` over the package's own `field` and
      `reason` unions, retaining `slot`, `symbol`, `params` and the original issue, in
      `src/app/domain/defence/defence.ts`
- [x] T005 Define `DefenceRole`, `DefenceRoleGroup`, `FittedDefenceModule` and `ModuleIdentity`,
      documenting that no member carries a share of its group's aggregate, in
      `src/app/domain/defence/defence.ts`
- [x] T006 Define `Defence`, `DefenceConditions`, `ShieldSnapshot`, `RecoverySnapshot`,
      `DamageDefenceValue`, `DamageType`, `CellBankCollection`, `CellBankView` and `ArmourSnapshot`
      as specified in data-model.md, with no nullable armour variant, in
      `src/app/domain/defence/defence.ts`
- [x] T007 Implement `toCalculationView(result)`, copying a complete value whole and otherwise
      preserving every package issue in exact order, in `src/app/domain/defence/defence.ts`
- [x] T008 Implement `toDamageDefenceValues(resistances, effectiveHitPoints)` producing exactly four
      package-ordered rows pairing each same-key resistance with its same-key effective hit points,
      in `src/app/domain/defence/defence.ts`
- [x] T009 Implement `classifyRoles(slots)` deriving groups only from the actual armour slot or a
      package-resolved `engineeringGroup`, retaining exact `slotKey`/`symbol`, mapping
      `FittedModule.on` to `enabled` or `'unspecified'`, and emitting no member for unavailable role
      or stat data, in `src/app/domain/defence/defence.ts`
- [x] T010 Implement `projectDefence(loadout, conditions)` — one call each to
      `shieldMetricsResult`, `shieldRecoveryResult`, `cellBanks` and `armourMetrics`, the identical
      explicit pips on both shield calls, hardness through `getShipBySymbol(loadout.shipSymbol)` —
      in `src/app/domain/defence/defence.ts`
- [x] T011 Add the package-backed builders every suite reads from, in
      `src/app/domain/defence/defence.fixtures.ts`
- [x] T012 Add the projection suite: field-for-field equality with the real package results, ordered
      issues, role classification, bank states and non-finite values, in
      `src/app/domain/defence/defence.spec.ts`
- [x] T013 Add the feature 006 boundary rules — leaf subpaths only, one call site per package
      method, no arithmetic on a measured figure — in `scripts/policy/defence-ownership.mjs`, wired
      into the `policy` script in `package.json`

## Phase 3: User Story 1 — read shield and armour strength

- [x] T014 Add the `duration` formatter, rendering seconds under a minute and `m:ss` above it, with
      its suite, in `src/app/i18n/formatters/formatters.ts` and `formatters.spec.ts`
- [x] T015 Add every `defence.*` message key with its unit to `src/app/i18n/locales/en.json` and
      `de.json`, and record the reviewed identical German values in
      `scripts/check-interface-foundations.mjs`
- [x] T016 Implement the shield card — identity, headline pool, the four damage rows over the
      canvas's own scale, and the ordered unavailable state — in
      `src/app/features/build-workspace/outfitting/defence-analysis/defence-analysis.{ts,html,scss}`
- [x] T017 Implement the armour card — identity, headline pool, the four damage rows in hull points,
      and the three protection facts — in the same component
- [x] T018 Implement the role groups for both cards, each named by what the package resolved and
      closed by the package's own aggregate, with no action and no apportionment
- [x] T019 Add the component suite for both cards, their unavailable states, the negative
      resistance, the aggregates and the identities, in `defence-analysis.spec.ts`
- [x] T020 Open the `DEFENCE` segment of the anatomy mode strip, retitle the region and put the
      cards in the space the plates leave, in
      `src/app/features/build-workspace/outfitting/hull-anatomy/hull-anatomy.{ts,html}` and its suite

## Phase 4: User Story 2 — read recovery and cell banks

- [x] T021 Present the recharge rate and the two recovery phases as three separate readings, with a
      phase that does not finish reading as its own phrase, in `defence-analysis.{ts,html}`
- [x] T022 Present the cell-bank reserve as one line: the package total, every bank named in the
      detail beside it, and no line at all when none is fitted
- [x] T023 Add the recovery and reserve tests, including the drained allocation, the unpowered
      banks and the absent line, in `defence-analysis.spec.ts`

## Phase 5: User Story 3 — read hull and module protection

- [x] T024 Bind `HARDNESS`, `MODULE PROT.` and `INTEGRITY` to the hull's hardness, the
      module-protection fraction and the module armour, in `defence-analysis.{ts,html}`
- [x] T025 Keep the armour card whole under every shield state, and test it
- [x] T026 Add the status rail block carrying the same two pools, in
      `src/app/features/build-workspace/outfitting/defence-summary/defence-summary.{ts,html,scss}`
      and its suite, composed into `outfitting-workspace.{ts,html}`

## Phase 6: Polish and cross-cutting concerns

- [x] T027 Assert the complete stacked composition keeps every figure at 390×844 and 844×390 with no
      document horizontal scrolling, in `e2e/defence.spec.ts`
- [x] T028 Assert the peer-to-stack transition is decided by available inline size rather than a
      device-name breakpoint, and that 200% text and actual 400% zoom always use the complete stack
- [x] T029 Run the feature 011 axe helper over every Defence state and fail on every in-scope
      violation
- [x] T030 Assert doubled application copy, RTL document direction and long package identities lose
      no content, function or layout
- [x] T031 Assert `prefers-reduced-motion` changes no reading, order or meaning
- [x] T032 Complete the `e2e/coverage-ledger.ts` entries joining every Defence surface and state to
      FR-001–FR-009 and SC-001–SC-003, its journey, its axe flag and its named assertions
- [x] T033 Reconcile the specification with the reference: `spec.md`, `data-model.md`, `plan.md`,
      `quickstart.md`, `contracts/` and `design/` now describe the delivered surface
- [x] T034 Hold unit coverage at or above 80% statements, branches, functions and lines for
      `src/app/domain/defence/` and both feature blocks
- [x] T035 Run `pnpm run check` and resolve every format, strict type, build, script-test,
      unit-test, coverage, Playwright and axe failure with no skipped, quarantined or deleted test

---

## Withdrawn tasks

Each of these was in the original list and is not in the delivered one. The originals are named by
their old id.

| Original         | Reason                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| T004             | `SemanticNumber` was a second copy of the projection's numbers. The surface reads the raw fields and decides the phrase per field.     |
| T005, T026, T038 | The feature 003 `StatusProvider` and `DefenceStatusProjection` do not exist. The rail block reads the same projection the cards read.  |
| T013             | An application presenter holds state; there is none to hold. The projection is a `computed` over the active loadout.                   |
| T014, T035       | The workspace slot adapter and the slot actions in the source rows: canvas 1c draws no control inside either card.                     |
| T015             | The serialization-exclusion suite: nothing in this feature reaches a store, so there is no field to exclude.                           |
| T031–T034, T036  | The seven-component decomposition. The canvas draws two cards; they are one component composed of feature 011's primitives.            |
| T037             | Defence is a mode of feature 010's anatomy strip, not a peer workspace capability. There was never a route or a coordinator to change. |
| T041, T053, T064 | Preview registrations. The `missing-preview` rule scans `src/app/ui/`, and this feature adds nothing there.                            |
| T057, T060       | The module-reinforcement role. The package reports module armour as a figure and returns no group to classify.                         |
| T072             | The announcement policy. Neither canvas draws a live region here, and the mode strip already says which layer is open.                 |
| T073             | Feature 003's 100 ms provider criterion, which belongs to a provider this feature does not have.                                       |
| T077             | The manual protocol record, which is the release process's artefact rather than a code change.                                         |

---

## Review corrections

Found by reading the running surface against canvas 1c after T035, and corrected there and in the
specification. Each is a place the delivered surface had drifted from the reference rather than a
change to what the reference asks for.

| Correction                                                                                               | Where                                                           |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| The damage row is the type, its bar, its resistance and its pool across one line, not a bar under a name | `defence-analysis.html`, `.scss`, `design/defence-profile.md`   |
| One scale per table, both ends printed, with a zero mark a weakness runs back from                       | `defence-analysis.ts`, `design/reference-review.md`             |
| The rule between blocks runs across the card; the heading-and-rule mixin collapsed to a dot without one  | `defence-analysis.scss`                                         |
| Every bank aboard is listed under the reserve on its own canvas row, banks unlike each other apart       | `defence-analysis.ts`, `.html`, `contracts/cell-banks.md`, spec |
| A bank's row carries the canvas's `5A`, read from the fitted record under the slot key the summary gave  | `domain/defence/defence.ts`, `data-model.md`                    |

---

## Phase: the 2026-08-25 canvas revision

Recorded in `design/reference-review.md`, "Canvas revision, 2026-08-25".

- [x] T078 Read the shield twice in `src/app/domain/defence/defence.ts` — `shieldMetrics()` for the
      bare `RESIST` and `MJ` columns, `shieldCapacitorMetrics({ systemsPips })` for the new one — and
      carry both effective-hit-point sets on the projection, the second on its own `capacitor` view.
      Almanac 0.2.0 made these two leaves; no figure is scaled, blended or apportioned, and an
      unavailable result at either allocation stays unavailable rather than borrowing the other
- [x] T079 Draw the fifth column in `defence-analysis.html`, headed with the allocation it was read
      at, and leave the armour table at four columns. The bar keeps being drawn from the bare
      resistance beside it, and `∞` keeps its meaning in both pool columns (FR-005)
- [x] T080 [P] Add the column heading to both locale catalogues, formatted with the standing pip
      count through the active-locale number formatter
- [x] T081 Extend `defence.spec.ts` and `almanac-defence-contract.spec.ts` for the two-allocation
      read, including a build with no generator — where the package reports every pool as zero at
      both allocations and the pips only as `systemsResistance`
- [x] T082 Re-run the feature's e2e specs in all ten projects with the axe scan, then
      `pnpm run check`

---

## Phase: closing the 2026-08-25 revision's gaps

T078–T082 delivered the fifth column and its tests, but three artefacts were left describing the
four-column table the revision replaced, and one behaviour the contract states was never proven.
Found by reading the delivered surface back against `spec.md` and `design/defence-profile.md`.

- [x] T083 Reconcile [design/screen-inventory.md](./design/screen-inventory.md) with the revision:
      its FR-002 ownership row still had the resistances and pools read at the standing allocation,
      which spec.md FR-002 and the design now make the bare shield. The surface table gained the
      fifth column, and "Required states" gained the states it has of its own — the column at no
      pips, where it repeats the bare pool, and a capacitor refused while the bare shield stands
- [x] T084 Replace the stale assertion on `build/defence-analysis-shields` in
      `e2e/coverage-ledger.ts`, which claimed the cards are read at the standing allocation, with
      the two the revision actually asks for: the bare columns holding still under a moving pip, and
      the fifth column headed with the allocation it was read at. Both are already exercised by
      `e2e/defence.spec.ts`, "moves the pip column alone"
- [x] T085 Name `effectiveResistances` in the capacitor mapping in
      [contracts/shield-profile.md](./contracts/shield-profile.md) as carried and not drawn. It is
      the one carried field that would be a defect if drawn — the resistances with the pips folded
      in, on a table whose `RESIST` column is a base value — so its exclusion is stated rather than
      left to inference
- [x] T086 Prove the two results are independent in both directions, which the contract asserted and
      nothing verified: a refused capacitor withdraws the fifth column and leaves the four bare ones
      whole figure for figure, and a refused bare shield draws no table for the capacitor to sit
      beside. Both in `defence-analysis.spec.ts`, with the `afterEach` restore the `BuildMetrics`
      seam needs, matching `src/app/domain/defence/defence.spec.ts`. Extend the contract's own
      verification list to require both
- [x] T087 Give the fifth column the fence the other four answers have, in
      `scripts/policy/defence-ownership.mjs`: `shieldCapacitorMetricsResult(` joins `PACKAGE_CALLS`
      so a second call site cannot appear, and `effectiveResistances`, `capacity` and `rechargeRate`
      join `FIGURE_FIELDS` so arithmetic on the field T085 declared undrawable is caught by the
      build rather than by a reading of the contract
- [x] T088 Correct the two places the revision's own staleness survived in the suites: the unit
      test named for a pool read "at the standing allocation", which no allocation moves, and
      `e2e/defence.spec.ts`'s preamble and describe block, which still said the cards are read at
      the allocation when only the pip column and the recovery are
- [x] T089 Re-run the feature's e2e specs with the axe scan, then `pnpm run check`
