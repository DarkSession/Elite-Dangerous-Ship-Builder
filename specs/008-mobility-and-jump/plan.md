# Implementation Plan: Mobility, Mass and Jump

**Branch**: `008-mobility-and-jump` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-mobility-and-jump/spec.md`

## Summary

Add one Mobility, Mass and Jump capability inside the active `/build` workspace. A pure,
revision-stamped projector first preserves `unladenMassResult`, `fuelCapacityResult` and
`cargoCapacityResult`, calls `jumpRangeSummary()` only when those dependencies and a usable fitted
drive are established, and calls `mobilityMetricsResult()` once with feature 003's selected package-owned
load inputs and ENG pips. The immutable snapshot also carries fitted drive/thruster records and every
fitted module's post-engineering mass by exact slot; it never re-sums, derives or repairs a package
value.

Almanac 0.1.1 closes the three package dependencies raised during planning:
`standardLoadResult()` supplies each standard fuel/cargo input (#295), `mobilityMetricsResult()`
withholds performance and reports structured issues for disabled or shed power (#296), and
`PowerBudget.consumers` plus the returned bands supply feature 005's exact-slot power observation
(#299). No local composition, power arithmetic or corrective gate remains.

The `.design/Ship Builder.dc.html` wide and narrow Drives & Mass hierarchy informs composition. Its
mass decomposition, percentages, arbitrary bars, deltas, headroom and mock figures are excluded.

## Technical Context

**Language/Version**: TypeScript 6.0 in strict mode; HTML and SCSS; Node.js 24 per `.nvmrc` for
tooling

**Primary Dependencies**: Angular 22.1 standalone and zoneless APIs, Angular signals, RxJS 7.8,
`@elite-dangerous-almanac/core` 0.1.1 leaf exports,
feature 001's active-build/revision boundary, feature 002's exact-slot intent, feature 003's shared
load/ENG conditions, feature 005's package-backed module power observation, and feature 011's
UI/localization/test infrastructure

**Storage**: None owned by feature 008. The active `ShipLoadout` remains in feature 001; selected load
and ENG pips remain in feature 003's memory-only conditions. Projected metrics, issues, source facts
and capability selection never enter local storage, edit history, build links or SLEF

**Testing**: Vitest through Angular's unit-test builder with 80% minimum statements, branches,
functions and lines; Playwright with `@axe-core/playwright` over desktop, tablet/mobile portrait and
landscape in Chromium and Firefox. The current suite lacks Firefox, landscape projects and automated
accessibility checks, which feature 011 must supply

**Target Platform**: Modern evergreen browsers on desktop, tablet and mobile; static client
application usable offline after first load

**Project Type**: Client-side Angular single-page application producing static files only

**Performance Goals**: One projection per settled build/condition revision; every visible jump,
mobility, mass and capacity fact shares one revision; settled changes render within 100 ms at the
mobile viewport under Chromium 4x CPU slowdown

**Constraints**: No server, account, telemetry or cross-origin request; no local jump, range, mass,
capacity, curve, power or standard-load formula; package zero, null, incomplete and diagnostic states
remain distinct; no document horizontal scrolling; one dark tokenized theme; all application text
and figures localized; touch/screen-reader operation; WCAG 2.2 AA except criteria 2.1.1, 2.1.2,
2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: One active build across 48 pinned hulls, each hull's full package slot set, three
standard jump/load states, seven mobility result fields, three diagnostic aggregate results and one
mass entry for every fitted module

**Design Reference**: `.design/Ship Builder.dc.html` wide `data-anat-detail="mass"` and narrow
`data-m-mode="mass"` regions. Adopted hierarchy and required departures are recorded in
[design/reference-review.md](./design/reference-review.md)

## Constitution Check

_GATE: Passed. Every value remains package-owned and the previously required package contracts are
present in the pinned Almanac 0.1.1 release. Re-check after Phase 1._

| Principle                               | Design evidence                                                                                                                                    | Status                 |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| I. Client-Side Only                     | All projections run over the in-browser active build and installed static package; no persistence or network boundary is added.                    | PASS                   |
| II. Almanac Source of Truth             | Aggregate calls, standard-load inputs, result diagnostics, source facts and module mass are package outputs from Almanac 0.1.1.                    | PASS                   |
| III. Domain Logic Outside UI            | A pure projector creates one immutable snapshot; a computed facade coordinates revisions/conditions; components render inputs and emit intents.    | PASS                   |
| IV. Lossless, Honest Builds             | Package zero, null, incomplete results, ordered issues, missing optional facts and unknown module masses remain distinct.                          | PASS                   |
| V. Desktop, Tablet and Mobile           | One complete surface stacks at narrow/zoomed widths, supports touch/screen reader/200% text/400% zoom/orientations and prevents document overflow. | PASS                   |
| VI. Commander's Language                | Application labels, units and sentinels use feature 011; game names/diagnostics use Almanac localization with disclosed canonical fallback.        | PASS                   |
| VII. One Design System                  | The surface composes/extends feature 011 primitives and tokens; the HTML reference contributes hierarchy only.                                     | PASS; prerequisite 011 |
| VIII. Tested Before It Ships            | Exact package equality, call guards, dual-engine multi-viewport journeys and automated/manual accessibility coverage retain the 80% gate.          | PASS; prerequisite 011 |
| IX. Specification Before Implementation | Every FR maps to the plan-time Mobility, Mass and Jump surface and contracts exist before task breakdown.                                          | PASS                   |

### Required released and repository dependencies

1. Almanac 0.1.1 supplies the released #295/#296/#299 contracts. Regression tests pin
   `standardLoadResult()`, `mobilityMetricsResult()` and `PowerBudget.consumers` directly.
2. Feature 001 must supply the single active `ShipLoadout`, atomic build revision and `/build`
   workspace.
3. Feature 002 must supply exact-slot selection and the authoritative fitted-module editor; its own
   Almanac normalization gates remain applicable to builds feature 008 reads.
4. Feature 003 must supply the shared valid load/ENG-pip condition and revision contracts, the
   Mobility headline port and detail intent.
5. Feature 005 must expose its projection of the package-owned consumer result.
6. Feature 011 must supply shared components/tokens, localization/formatting, Firefox/landscape
   projects and the automated accessibility harness.

Feature 008 may be tasked after these repository contracts are accepted. No unresolved Almanac
dependency or unfiled package gap remains.

## Project Structure

### Documentation (this feature)

```text
specs/008-mobility-and-jump/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── jump-performance.md
│   ├── mass-and-capacity.md
│   └── mobility-performance.md
└── design/
    ├── mobility-and-jump-profile.md
    ├── reference-review.md
    └── screen-inventory.md
```

`tasks.md` is Phase 2 output and is intentionally not created by this command.

### Source Code (repository root)

```text
src/app/
├── domain/
│   ├── build/                              # feature 001 active-build revision boundary
│   └── mobility/
│       ├── mobility-projector.ts           # pure guarded package-result projection
│       ├── mobility-snapshot.ts            # immutable semantic result types
│       └── semantic-mobility-value.ts      # zero/null/incomplete discriminants only
├── application/
│   ├── viewing-conditions/                 # feature 003 shared load/ENG conditions
│   └── mobility/
│       ├── mobility.facade.ts              # revision-coherent computed snapshot
│       └── mobility.presenter.ts           # localized component view models
├── i18n/                                   # feature 011 messages and formatters
├── ui/                                     # feature 011 shared/extended components
└── features/
    └── build-workspace/
        └── mobility-and-jump/
            ├── mobility-and-jump-profile/
            ├── jump-performance/
            ├── mobility-performance/
            ├── mass-and-capacity/
            └── module-mass-list/

e2e/
├── accessibility.ts                       # feature 011 shared helper
└── mobility-and-jump.spec.ts
```

Tests live beside each domain/application/component source. The checked-in application is still a
shell, so these are target paths sequenced behind features 001, 003 and 011 rather than temporary
parallel infrastructure.

**Structure Decision**: Keep one Angular application and one active build. A framework-agnostic
projector guards and copies package results without changing numeric values. One computed facade
combines active-build and shared-condition revisions with feature 005's power observation atomically.
Workspace components receive localized views and emit only exact-slot intents. No route, storage
adapter, calculation service, second `ShipLoadout`, separate load selector or ENG-pip store is added.

## Phase 0: Research Conclusions

All decisions, package probes, alternatives and upstream dependencies are recorded in
[research.md](./research.md). The decisive outcomes are:

- `jumpRangeSummary()` is called once only after mass, fuel and cargo diagnostics complete and the
  fitted drive record is usable; every single range, total range and jump count is preserved.
- Feature 003's maximum/unladen/laden mapping is reused from `standardLoadResult()`.
- `mobilityMetricsResult({ fuel, cargo, enginesPips })` is called once for the selected settled conditions;
  all seven fields are copied. `null` and above-supported-mass zero performance remain distinct.
- Disabled and shed power produce structured incomplete results; no local power gate is allowed.
- Unpowered attribution comes from feature 005's shared projection of each `PowerBudget.consumers`
  entry with its matching returned band verdict; absence, disabled state and unresolved fitted stats
  come directly from fitted package snapshots.
- Aggregate result issues retain order and structured fields. Every fitted module receives one exact
  slot-keyed mass projection from `effectiveStats.mass`; the application never re-sums it.
- FSD/thruster thresholds, factors and multipliers appear only when their fitted package records or
  mobility result contain them. Missing fields remain absent.
- The reference's paired hierarchy is useful only after removing authored mass totals, percentage
  bars, comparisons, headroom, unsupported facts and narrow-layout omissions.

No planning clarification marker or unresolved Almanac release gate remains.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines the revision-stamped snapshot, diagnostic aggregate
  results, standard jump profiles, selected mobility result, fitted source facts, exact-slot module
  masses and semantic unavailable/zero states.
- [contracts/jump-performance.md](./contracts/jump-performance.md) freezes diagnostic call guards,
  the one-call summary boundary, all six range results/jump counts, drive identity and zero-fuel
  meaning.
- [contracts/mobility-performance.md](./contracts/mobility-performance.md) freezes shared load/ENG
  inputs, every returned mobility field, source/power-state boundaries and null-versus-zero meaning.
- [contracts/mass-and-capacity.md](./contracts/mass-and-capacity.md) freezes all three diagnostic
  aggregates, ordered package issues and per-module post-engineering mass by exact slot.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every FR to the `/build` capability
  surface and records cross-feature ownership.
- [design/mobility-and-jump-profile.md](./design/mobility-and-jump-profile.md) defines semantic order,
  wide/narrow composition, states and announcements.
- [design/reference-review.md](./design/reference-review.md) records which Drives & Mass hierarchy is
  adopted and which unsupported values/visuals are rejected.
- [quickstart.md](./quickstart.md) supplies runnable upstream, unit, end-to-end, responsive and
  accessibility validation scenarios.

## Post-Design Constitution Re-check

Phase 1 introduces no server, persisted metric, alternate build, private game catalogue, local jump,
mass, capacity, curve, standard-load or power formula, hard-coded display string or visual literal.
The released structured mobility and module-consumer results remain the only calculation and power
sources. Every package zero, null, incomplete result, diagnostic issue, absent optional
fact and unresolved module mass remains distinguishable. Every FR has a surface owner and a
dual-engine responsive/accessibility validation path.

The planning gate remains **PASS with no exception**. The Almanac gate is satisfied; implementation
is sequenced behind features 001, 002, 003, 005 and 011. After completing those prerequisites,
generate or refresh tasks.

## Complexity Tracking

No constitutional exception is requested. The projector/facade split is the minimum structure that
keeps package projection testable without rendering and guarantees revision coherence.
