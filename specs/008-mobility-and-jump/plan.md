# Implementation Plan: Mobility, Mass and Jump

**Branch**: `008-mobility-and-jump` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-mobility-and-jump/spec.md`

## Summary

Add one Mobility, Mass and Jump capability inside the active `/build` workspace. A pure,
revision-stamped projector first preserves `unladenMassResult`, `fuelCapacityResult` and
`cargoCapacityResult`, calls `jumpRangeSummary()` only when those dependencies and a usable fitted
drive are established, and calls `mobilityMetrics()` once with feature 003's selected package-owned
load inputs and ENG pips. The immutable snapshot also carries fitted drive/thruster records and every
fitted module's post-engineering mass by exact slot; it never re-sums, derives or repairs a package
value.

Implementation is **blocked** on released Almanac work already raised upstream:

- [#296](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/296) must make
  `mobilityMetrics()` return `null` for power-shed thrusters instead of finite performance.
- [#299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299), consumed through feature
  005's shared exact-slot power observation, must authoritatively distinguish an unpowered thruster
  from an absent, disabled or unresolved one without application inference.

[Almanac #295](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/295) tracks a direct
standard-load result. It is not a functional blocker because feature 003's accepted contract uses
only package methods (`maxJumpRange()` and `fuelPerJump()`) to obtain maximum-jump fuel, with no local
formula.

The `.design/Ship Builder.dc.html` wide and narrow Drives & Mass hierarchy informs composition. Its
mass decomposition, percentages, arbitrary bars, deltas, headroom and mock figures are excluded.

## Technical Context

**Language/Version**: TypeScript 6.0 in strict mode; HTML and SCSS; Node.js 24 per `.nvmrc` for
tooling

**Primary Dependencies**: Angular 22.1 standalone and zoneless APIs, Angular signals, RxJS 7.8,
`@elite-dangerous-almanac/core` 0.1.0-beta.12 leaf exports (upgrade required for the blockers),
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

_GATE: Passed for planning because every value remains package-owned and the design waits for
released dependencies rather than introducing a workaround. Re-check after Phase 1 and after the
Almanac upgrade._

| Principle                               | Design evidence                                                                                                                                               | Status                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| I. Client-Side Only                     | All projections run over the in-browser active build and installed static package; no persistence or network boundary is added.                               | PASS                       |
| II. Almanac Source of Truth             | Aggregate calls, standard-load composition, source facts and module mass are package outputs. #296/#299 remain release gates; no local correction is planned. | PASS; implementation gated |
| III. Domain Logic Outside UI            | A pure projector creates one immutable snapshot; a computed facade coordinates revisions/conditions; components render inputs and emit intents.               | PASS                       |
| IV. Lossless, Honest Builds             | Package zero, null, incomplete results, ordered issues, missing optional facts and unknown module masses remain distinct.                                     | PASS                       |
| V. Desktop, Tablet and Mobile           | One complete surface stacks at narrow/zoomed widths, supports touch/screen reader/200% text/400% zoom/orientations and prevents document overflow.            | PASS                       |
| VI. Commander's Language                | Application labels, units and sentinels use feature 011; game names/diagnostics use Almanac localization with disclosed canonical fallback.                   | PASS                       |
| VII. One Design System                  | The surface composes/extends feature 011 primitives and tokens; the HTML reference contributes hierarchy only.                                                | PASS; prerequisite 011     |
| VIII. Tested Before It Ships            | Exact package equality, call guards, dual-engine multi-viewport journeys and automated/manual accessibility coverage retain the 80% gate.                     | PASS; prerequisite 011     |
| IX. Specification Before Implementation | Every FR maps to the plan-time Mobility, Mass and Jump surface and contracts exist before task breakdown.                                                     | PASS                       |

### Required upstream and repository dependencies

1. [Almanac #296](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/296) must land in a
   released package. Its minimal reproduction proves beta.12 returns finite mobility when the power
   budget has shed the thrusters. Feature 008 must not null or reinterpret that result locally.
2. [Almanac #299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299) must land in a
   released package and feature 005 must expose its shared exact-slot power observation. Feature 008
   consumes that observation only to name unpowered thrusters; it does not reconstruct power bands.
3. [Almanac #295](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/295) remains open as
   a non-blocking API improvement. Until released, the accepted feature 003 package-method
   composition is used without local `min`, fuel-cap or load arithmetic.
4. Feature 001 must supply the single active `ShipLoadout`, atomic build revision and `/build`
   workspace.
5. Feature 002 must supply exact-slot selection and the authoritative fitted-module editor; its own
   Almanac normalization gates remain applicable to builds feature 008 reads.
6. Feature 003 must supply the shared valid load/ENG-pip condition and revision contracts, the
   Mobility headline port and detail intent.
7. Feature 011 must supply shared components/tokens, localization/formatting, Firefox/landscape
   projects and the automated accessibility harness.

Feature 008 may be tasked only after these contracts are accepted. It cannot be considered
implemented or shipped until #296 and #299 are released and consumed. All unresolved Almanac work
identified during planning is represented by an upstream issue; no new unfiled package gap remains.

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
- Feature 003's maximum/unladen/laden mapping is reused. Maximum-load fuel remains the package-only
  `fuelPerJump(maxJumpRange())` composition tracked by non-blocking #295.
- `mobilityMetrics({ fuel, cargo, enginesPips })` is called once for the selected settled conditions;
  all seven fields are copied. `null` and above-supported-mass zero performance remain distinct.
- Beta.12 violates its documented powered-thruster contract. #296 blocks mobility presentation; no
  local power gate is allowed.
- Unpowered attribution comes from feature 005 after #299; absence, disabled state and unresolved
  fitted stats come directly from fitted package snapshots.
- Aggregate result issues retain order and structured fields. Every fitted module receives one exact
  slot-keyed mass projection from `effectiveStats.mass`; the application never re-sums it.
- FSD/thruster thresholds, factors and multipliers appear only when their fitted package records or
  mobility result contain them. Missing fields remain absent.
- The reference's paired hierarchy is useful only after removing authored mass totals, percentage
  bars, comparisons, headroom, unsupported facts and narrow-layout omissions.

No planning clarification marker remains. The unresolved work is represented by upstream release
gates, not ambiguity to solve by assumption.

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
The incorrect beta.12 powered-thruster result and missing module power projection remain explicit
released-package gates. Every package zero, null, incomplete result, diagnostic issue, absent optional
fact and unresolved module mass remains distinguishable. Every FR has a surface owner and a
dual-engine responsive/accessibility validation path.

The planning gate remains **PASS with no exception**. Implementation remains **blocked upstream** by
Almanac #296 and #299 and is sequenced behind features 001, 002, 003, 005 and 011. After upgrading
the pinned package and completing those prerequisites, rerun the minimal reproductions, confirm the
public leaf contracts, re-evaluate this constitution table and then generate or refresh tasks.

## Complexity Tracking

No constitutional exception is requested. The projector/facade split is the minimum structure that
keeps package projection testable without rendering and guarantees revision coherence. Upstream gaps
remain blockers rather than application-side verdicts, joins or calculations.
