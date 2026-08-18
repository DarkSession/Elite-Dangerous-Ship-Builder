# Implementation Plan: Power and Heat

**Branch**: `005-power-and-heat` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-power-and-heat/spec.md`

## Summary

Add one Power and Heat capability inside the active `/build` workspace. A pure,
revision-stamped projector reads `ShipLoadout.powerBudget()`,
`distributorMetrics()` and `heatMetrics()` once, preserves null/unknown/infinite
semantics, and maps only the selected package fields into localized immutable
views. Feature 003 owns deployed/retracted and pip conditions; feature 002 owns
exact-slot navigation and power edits; feature 011 supplies the responsive,
accessible design system.

Almanac 0.1.1 exposes authoritative per-module power projections through
`PowerBudget.consumers`, including exact draw/unavailable, enabled, priority and deployed-only
state. Feature 005 pairs each consumer with its corresponding returned `PowerBudget.bands` verdict
for the selected hardpoint state; it never recreates shedding arithmetic. The released work is recorded as
[Elite-Dangerous-Almanac #299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299)
and tracked in
[ship-builder issue #13](https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/issues/13).

The `.design/Ship Builder.dc.html` canvas 1c/1d power hierarchy informs wide and
narrow composition. Its abbreviated module lists, inferred charts, whole-pip
controls and non-package heat summaries are not adopted.

## Technical Context

**Language/Version**: TypeScript 6.0 in strict mode; HTML and SCSS; Node.js 24
per `.nvmrc` for tooling

**Primary Dependencies**: Angular 22.1 standalone and zoneless APIs, Angular
signals, RxJS 7.8, `@elite-dangerous-almanac/core` 0.1.1 leaf exports,
feature 001 active-build/revision boundary,
feature 002 slot-selection intent, feature 003 viewing conditions, and feature
011 UI/localization infrastructure

**Storage**: None owned by feature 005. Active `ShipLoadout` remains in feature
001 memory/persistence; conditions and projected metrics are in memory only and
never enter storage, edit history, links or SLEF

**Testing**: Vitest through Angular's unit-test builder with 80% minimum coverage;
Playwright with `@axe-core/playwright` over desktop, tablet/mobile portrait and
landscape in Chromium and Firefox. The current suite lacks Firefox, landscape
projects and automated accessibility checks, which feature 011 must supply

**Target Platform**: Modern evergreen browsers on desktop, tablet and mobile;
static client application usable offline after first load

**Project Type**: Client-side Angular single-page application producing static
files only

**Performance Goals**: One recomputation per settled build/condition revision;
all visible results share one revision; settled update within 100 ms at the
mobile viewport under 4x CPU slowdown

**Constraints**: No server, account, telemetry or cross-origin request; no local
power, distributor or heat formula; no raw-modifier parsing or consumer-rule
reconstruction; unavailable and unknown results stay explicit; no page
horizontal scrolling; one dark tokenized theme; all application text and
numbers localized; touch/screen-reader operation; WCAG 2.2 AA except criteria
2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: 48 pinned hulls, at most 39 package slots on a known hull and 21
fitted modules on a stock default; five power bands, three capacitors and five
heat scenarios per ready build. Imported unresolved entries remain unbounded by
catalogue assumptions and are presented by exact package identity

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1c and 1d. Adopted
hierarchy and required departures are recorded in
[design/reference-review.md](./design/reference-review.md)

## Constitution Check

_GATE: Passed. The design consumes package truth and introduces no constitutional exception. The
Almanac dependency is satisfied; repository prerequisite features remain._

| Principle                               | Design evidence                                                                                                                                                    | Status                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| I. Client-Side Only                     | All calculations and conditions run over the in-browser active build and installed static package; no new persistence or network boundary.                         | PASS                   |
| II. Almanac Source of Truth             | Aggregate results call the three `ShipLoadout` methods and per-module output reads `PowerBudget.consumers`; raw modifiers and copied private rules are prohibited. | PASS                   |
| III. Domain Logic Outside UI            | A pure projector creates one immutable snapshot; a computed signal facade coordinates revisions/conditions; components render inputs and emit intent.              | PASS                   |
| IV. Lossless, Honest Builds             | Null, unknown, lower-bound, projection, genuine zero and semantic infinity remain distinct. Feature 005 never mutates or repairs a build.                          | PASS                   |
| V. Desktop, Tablet and Mobile           | One complete responsive surface stacks at narrow/zoomed widths, supports touch/screen reader/200% text/400% zoom/orientations and has no document overflow.        | PASS                   |
| VI. Commander's Language                | App labels, units, qualifications and sentinels use feature 011; module names use Almanac localization and disclosed canonical fallback.                           | PASS                   |
| VII. One Design System                  | The surface composes/extends feature 011 primitives and tokens; the HTML reference contributes hierarchy only.                                                     | PASS; prerequisite 011 |
| VIII. Tested Before It Ships            | Exact unit equality, dual-engine multi-viewport journeys and axe/screen-reader coverage are specified without relaxing the 80% gate.                               | PASS; prerequisite 011 |
| IX. Specification Before Implementation | Every FR maps to a plan-time surface and contracts exist before tasks.                                                                                             | PASS                   |

### Required released and repository dependencies

1. [Almanac issue #299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299)
   is released in 0.1.1 as `PowerBudget.consumers`; the open
   [ship-builder issue #13](https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/issues/13)
   tracks downstream consumption. The minimal reproduction and public fields are
   in [research.md](./research.md#per-module-power-projection--released-in-011).
2. Feature 001 must supply the single active `ShipLoadout`, atomic build revision
   and `/build` workspace.
3. Feature 002 must supply exact-slot selection and module enabled/priority
   mutations; its released Almanac normalization behavior remains applicable to the
   builds feature 005 reads.
4. Feature 003 must freeze and implement the shared condition/revision contract,
   deployed and 2/2/2 defaults, valid half-pip allocation and headline-to-detail
   intent.
5. Feature 011 must supply the shared components/tokens, localization/formatting,
   Firefox/landscape project matrix and automated accessibility harness.

Feature 005 may be tasked after the repository dependency contracts are accepted. It cannot be
considered implemented or shipped until those prerequisite features are satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/005-power-and-heat/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── distributor-metrics.md
│   ├── heat-profile.md
│   └── power-budget.md
└── design/
    ├── power-and-heat-detail.md
    ├── reference-review.md
    └── screen-inventory.md
```

`tasks.md` is Phase 2 output and is intentionally not created by this command.

### Source Code (repository root)

```text
src/app/
├── domain/
│   ├── build/                              # feature 001 active-build revision boundary
│   └── power-heat/
│       ├── power-heat-projector.ts         # pure package-result projection
│       └── semantic-metric-value.ts        # null/unknown/infinity discriminants only
├── application/
│   ├── viewing-conditions/                 # feature 003 shared conditions
│   └── power-heat/
│       ├── power-heat.facade.ts            # computed revision-coherent snapshot
│       └── power-heat.presenter.ts          # localized component view models
├── i18n/                                   # feature 011 messages and formatters
├── ui/                                     # feature 011 shared/extended components
└── features/
    └── build-workspace/
        └── power-and-heat/
            ├── power-and-heat-detail/
            ├── power-budget/
            ├── module-power-breakdown/
            ├── distributor-performance/
            └── heat-profile/

e2e/
├── accessibility.ts                       # feature 011 shared helper
└── power-and-heat.spec.ts
```

Tests live beside each domain/application/component source. File names may be
coalesced where a shared component already supplies a primitive; no feature 005
copy of a feature 002/003/011 component is created.

**Structure Decision**: Keep one Angular application and one active build. A
framework-agnostic projector reads package results and creates semantic
discriminants without changing numeric values. One computed facade combines the
active-build revision with shared conditions atomically. Route/workspace
components receive localized views and emit only hardpoint, pip and exact-slot
intents. No top-level route, storage adapter, calculation service or second
`ShipLoadout` is added.

## Phase 0: Research Conclusions

All decisions, package probes, alternatives and the released dependency are recorded in
[research.md](./research.md). The decisive outcomes are:

- `powerBudget()` is selected field-for-field for one hardpoint state; deployed
  summaries never appear in retracted mode.
- `PowerBudget.consumers` is the lossless public per-module power result. It includes unresolved
  modifier contributions even while `effectiveStats` is null.
- Unknown power makes all aggregates lower bounds and booleans known-draw-only;
  heat unknowns make the whole profile a projection in neither direction.
- Feature 003 owns valid six-pip state. Feature 005 passes those pips directly
  and displays the package's returned capacity/rated/actual recharge.
- Heat renders exactly five scenarios and all five fields. Package null remains
  unavailable; infinity/null receive field-specific meanings before formatting.
- Exact package/game slot keys are the only module action identity.
- The wide/narrow visual hierarchy is usable only after removing abbreviated,
  inferred, non-package, inaccessible and unlocalizable reference details.

No planning clarification marker remains. Remaining work is repository implementation and accepted
feature prerequisites, not an unresolved Almanac dependency.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines the revision-stamped snapshot,
  selected power/bands, released module projection, distributor/heat
  unions, qualification/sentinel states and viewing intents.
- [contracts/power-budget.md](./contracts/power-budget.md) freezes direct
  selected-state mapping, deployed-only summaries, unknown qualification,
  module ordering and exact-slot intent.
- [contracts/distributor-metrics.md](./contracts/distributor-metrics.md) freezes
  valid shared pip input, exact capacitor fields, zero semantics and null/no-
  fallback behavior.
- [contracts/heat-profile.md](./contracts/heat-profile.md) freezes the five
  scenarios, every returned field, whole-profile projection and field-specific
  non-finite meanings.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every FR to the
  `/build` capability surface and records cross-feature ownership.
- [design/power-and-heat-detail.md](./design/power-and-heat-detail.md) defines
  information order, wide/narrow composition, states and announcements.
- [design/reference-review.md](./design/reference-review.md) records which 1c/1d
  hierarchy is adopted and which unsupported details are rejected.
- [quickstart.md](./quickstart.md) supplies runnable released-API checks and end-to-end
  validation scenarios.

## Post-Design Constitution Re-check

Phase 1 introduces no server, persisted metric, alternate build, private game
catalogue, calculation formula, hard-coded display string or visual literal.
Per-module logic reads the released Almanac result directly. All unavailable, unknown, lower-bound,
projection, zero and infinite states remain distinguishable. Every FR has a
surface owner and a dual-engine responsive/accessibility validation path.

The planning gate remains **PASS with no exception**. Almanac issue #299 is satisfied in 0.1.1 and
remains tracked downstream by ship-builder issue #13; implementation is sequenced behind features
001, 002, 003 and 011. Rerun the minimal reproduction, confirm the public leaf contract and
re-evaluate this constitution table when generating tasks.

## Complexity Tracking

No constitutional exception is requested. The package dependency is not
converted into an application-side workaround. The projector/facade split is
the minimum structure that keeps package projection testable without rendering
and guarantees revision coherence.
