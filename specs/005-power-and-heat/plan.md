# Implementation Plan: Power and Heat

**Branch**: `005-power-and-heat` | **Date**: 2026-08-18 | **Spec**:
[spec.md](./spec.md)

**Input**: Feature specification from `specs/005-power-and-heat/spec.md` and the
responsive visual reference in `.design/Ship Builder.dc.html`.

## Summary

Add a Power and Heat capability inside the shared `/build` workspace. A pure,
revision-stamped projector reads `ShipLoadout.powerBudget()`,
`distributorMetrics()` and `heatMetrics()`; selects only package fields for
the settled viewing conditions; and preserves null, unknown, lower-bound,
projection, zero and non-finite meanings. Thin adapters supply the detailed
capability, feature 003's compact power status provider and feature 010's
per-hardpoint power observation without creating a second calculation model.

The visual hierarchy follows the Power and Thermals areas in `.design`
canvases 1c and 1d: selected power state, priority bands, module contributions,
heat and distributor. The design's sample numbers, four-band/mobile
abbreviations, inferred charts, whole-pip controls and extra heat scenarios are
not game-data contracts and are not copied.

Planning exposed an Almanac 0.1.1 defect: a catalogue-unresolved hardpoint with a journal-resolved
`PowerDraw` contributed to the power budget while its unknown weapon heat was omitted and
`HeatMetrics.unknownDraws` remained empty. Almanac 0.1.2 resolves
[#329](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/329) with the distinct
`HeatMetrics.unknownWeaponHeat` slot list. The pinned release and reproduction now satisfy the
feature contract without an application workaround.

## Technical Context

**Language/Version**: TypeScript 6.0.2, Angular HTML and SCSS; Node.js 24 for
tooling. TypeScript strict mode is required by the constitution but is not
enabled in the current repository configuration; that repository gap must close
before implementation

**Primary Dependencies**: Angular 22.1 standalone and zoneless APIs, Angular
signals, RxJS 7.8, `@elite-dangerous-almanac/core@0.1.2` leaf exports, feature
001's active-build/revision boundary, feature 002's exact-slot selection,
feature 003's viewing-condition and status-provider contracts, feature 010's
hardpoint observation port, and feature 011's design/localization/accessibility
foundation

**Storage**: None. Feature 005 projections, selected capability and viewing
conditions are in memory only; no metric or condition enters local storage,
history, a URL, a saved build or SLEF

**Testing**: Vitest through Angular's unit-test builder with the existing 80%
statement/branch/function/line gates; Playwright in the feature 011 ten-project
Chromium/Firefox desktop, tablet portrait/landscape and mobile
portrait/landscape matrix; `@axe-core/playwright` plus manual screen-reader,
200%-text and actual 400%-zoom protocols. The current repository has only three
Chromium projects and no axe harness

**Target Platform**: Static client-side application for current Chromium and
Firefox on desktop, tablet and mobile, pointer and touch, portrait and
landscape; usable offline after first load

**Project Type**: One client-side Angular single-page application; no backend

**Performance Goals**: Keep projections synchronous and memoized by the active
build/condition revision so the feature 005 power provider fits feature 003's
100 ms settled status-update budget at the mobile viewport under 4x CPU
slowdown; do not duplicate calls inside one projection

**Constraints**: No server, account, telemetry, cross-origin runtime request,
local power/distributor/heat formula, raw-modifier interpretation, inferred
null diagnosis or catalogue fallback; exact package identities; no stale mixed
revisions; no page horizontal scrolling; one tokenized dark theme; localized
owned text/numbers/units; touch and screen-reader operation; WCAG 2.2 AA except
criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: One active loadout; five priority bands; one entry per
package-returned positive or unknown power consumer; three distributor
capacitors; five heat scenarios; one compact status projection and
per-hardpoint observations derived from the same package result

**Design Reference**: `.design/Ship Builder.dc.html`, canvases 1c and 1d.
Adopted hierarchy and required departures are recorded in
[design/reference-review.md](./design/reference-review.md).

## Constitution Check

_GATE: **PASS after the Almanac 0.1.2 verification**. The released
`unknownWeaponHeat` field truthfully qualifies unresolved hardpoints without an application
workaround. Repository implementation remains sequenced behind feature 011's strict-mode and shared
foundation work._

| Principle                               | Design evidence                                                                                                                                            | Status                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| I. Client-Side Only                     | All results use the in-browser active build and installed static package; feature 005 adds no storage or network boundary.                                 | PASS                   |
| II. Almanac Source of Truth             | All planned values come from the three `ShipLoadout` methods; 0.1.2 supplies `unknownWeaponHeat` for the reproduced unresolved-hardpoint case.             | PASS                   |
| III. Domain Logic Outside UI            | Pure projectors and typed integration adapters precede signal orchestration; components render inputs and emit intents.                                    | PASS                   |
| IV. Lossless, Honest Builds             | Null, unknown, lower-bound, projection, zero and field-specific infinity states remain explicit; no stale or guessed heat result is presented as complete. | PASS                   |
| V. Desktop, Tablet and Mobile           | Complete content is defined for five viewport/orientation profiles, touch, screen reader, 200% text and 400% zoom.                                         | PASS; prerequisite 011 |
| VI. Commander's Language                | Owned text/units use feature 011; module and slot text use Almanac helpers with disclosed canonical fallback.                                              | PASS; prerequisite 011 |
| VII. One Design System                  | The capability composes/extends `src/app/ui/`; `.design` contributes hierarchy only.                                                                       | PASS; prerequisite 011 |
| VIII. Tested Before It Ships            | Exact projection tests, two engines, five layouts, axe and manual assistive checks are retained without lowering coverage.                                 | PASS; prerequisite 011 |
| IX. Specification Before Implementation | The screen inventory maps every requirement; the released regression and remaining contract reconciliation are recorded explicitly.                        | PASS                   |

**Technology prerequisite**: Feature 011 must enable `strict` in the shared TypeScript configuration
and make the existing project pass under it before feature 005 implementation is complete.

### Blocking and sequencing dependencies

1. Keep the verified Almanac 0.1.2 regression for
   [#329](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/329):
   `unknownWeaponHeat` names the unresolved slot while `unknownDraws` remains reserved for unknown
   power contributions. This application does not inspect validation or journal heat modifiers to
   reproduce either list.
2. Enable the repository's required TypeScript strict mode.
3. Feature 001 supplies one active `ShipLoadout`, numeric build revision,
   no-build state and `/build` workspace. Feature 002 supplies committed-edit
   revision advancement and exact-slot reveal/editing.
4. Feature 003 supplies integer-half-pip viewing state, Apply/Reset behavior,
   condition revision, `StatusProvider<T, I>` and `powerAndHeat` target.
   Its “complete Status is the sole location for viewing controls” wording must
   be reconciled with feature 005 FR-003: feature 005 reuses the shared scoped
   hardpoint/pip controls without owning parallel state.
5. Feature 005 exports the compact power provider required by feature 003 and
   the power-observation port required by feature 010. Feature 010 never joins
   consumers to bands itself.
6. Feature 011 supplies the shared controls, tokens, localized messages and
   formatters, game-text presenter, previews, ten-project browser matrix and axe
   harness.

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
│   ├── integration-ports.md
│   └── power-budget.md
└── design/
    ├── component-state-preview-matrix.md
    ├── power-and-heat-detail.md
    ├── reference-review.md
    └── screen-inventory.md
```

`tasks.md` is Phase 2 output and has not yet been generated. Its dependency graph must retain the
feature 001/002/003/011 sequencing and the viewing-control contract reconciliation above.

### Source Code (repository root)

```text
src/app/
├── domain/
│   └── power-heat/
│       ├── power-heat-projection.ts
│       ├── power-status-projection.ts
│       ├── hardpoint-power-observation.ts
│       └── semantic-metric-value.ts
├── application/
│   └── power-heat/
│       ├── power-heat.store.ts
│       ├── power-heat.presenter.ts
│       ├── power-status.adapter.ts
│       └── hardpoint-power-observation.adapter.ts
├── i18n/                                  # feature 011 messages/formatters
├── ui/                                    # feature 011 primitives/previews
└── features/
    └── build-workspace/
        └── power-and-heat/
            ├── power-and-heat-capability/
            ├── power-budget/
            ├── module-power-breakdown/
            ├── heat-profile/
            └── distributor-performance/

e2e/
├── accessibility.ts                       # feature 011 shared helper
└── power-and-heat.spec.ts
```

Tests live beside source. The compact Status UI remains owned by feature 003
and anatomy UI by feature 010; feature 005 exports projections/adapters rather
than duplicate components.

**Structure Decision**: Keep one Angular application and one active loadout. A
pure projector maps one immutable revision context to package-authored values.
One feature store exposes a no-build/pending/ready/failure lifecycle for the
detail surface. Type-only contracts and thin synchronous adapters expose the
same owner-authored power semantics to features 003 and 010. No second
`ShipLoadout`, persisted cache, worker, calculation service or route is added.

## Phase 0: Research Conclusions

Detailed decisions, evidence and rejected alternatives are in
[research.md](./research.md). The decisive outcomes are:

- Use only the three `ShipLoadout` facade methods and their leaf result types.
- Select deployed/retracted fields directly. Retracted omits
  `headroom`, `utilisation` and `withinBudget`.
- `PowerBudget.consumers` is the complete package power-participant list;
  disabled unavailable draws remain visible, while only enabled
  `unknownDraws` qualify aggregate results.
- Feature 003 stores pips as integer half-pips. Feature 005 divides each by two
  only at the `distributorMetrics()` call boundary and displays returned pips.
- Scenario terminology follows normative results: disabled power participants
  are the disabled entries returned in `consumers`, and distributor
  unavailability is exactly package null rather than catalogue identity alone.
- Heat shows exactly the five package scenarios and all five fields. Null,
  non-settling and never-overheating are distinct.
- The installed heat result can incorrectly appear complete for an unresolved
  weapon with known journal power draw. That upstream defect blocks
  implementation.
- Canvas 1c/1d hierarchy is useful; its sample data, truncation and interaction
  markup are not authoritative.

No planning ambiguity remains. The unresolved item is a concrete upstream
dependency, not an unanswered product question.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines the outer lifecycle, revision-stamped
  detail snapshot, qualified power fields, returned consumer identities,
  distributor/heat unions, status summary and hardpoint observations.
- [contracts/power-budget.md](./contracts/power-budget.md) freezes
  selected-state mapping, field-specific unknown qualification, module
  ordering and exact-slot intent.
- [contracts/distributor-metrics.md](./contracts/distributor-metrics.md) freezes
  half-pip conversion at the package boundary, exact result mapping and null/
  zero behavior.
- [contracts/heat-profile.md](./contracts/heat-profile.md) freezes the five
  scenarios, all returned fields, projection/null/non-finite meanings and the
  upstream acceptance regression.
- [contracts/integration-ports.md](./contracts/integration-ports.md) freezes
  feature 003's `PowerStatusProvider` and feature 010's
  `HardpointPowerObservationPort`.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every FR to
  the Power and Heat capability and its cross-feature contributions.
- [design/power-and-heat-detail.md](./design/power-and-heat-detail.md) defines
  information order, responsive composition, states and announcements.
- [design/component-state-preview-matrix.md](./design/component-state-preview-matrix.md)
  defines required shared-component preview states and widths.
- [design/reference-review.md](./design/reference-review.md) records the exact
  1c/1d ideas retained and every unsupported departure.
- [quickstart.md](./quickstart.md) supplies the blocking package probe and
  runnable acceptance scenarios for after the release.

## Post-Design Constitution Re-check

Phase 1 adds no server, second build, private game catalogue, power/heat
formula, persisted metric, inferred null diagnosis, hard-coded display string
or visual literal. Every required surface and consumer port has an owner, every
package sentinel remains distinguishable and all responsive/accessibility paths
are explicit.

The post-design gate is **PASS** after pinning Almanac 0.1.2 and verifying that
`unknownWeaponHeat` names the unresolved hardpoint omitted from the firing scenarios. The plan
contains no validation-based or modifier-parsing workaround. Shared TypeScript strictness and the
feature dependencies above remain implementation sequencing prerequisites and must be represented in
the task graph.

## Complexity Tracking

No constitutional exception is requested. The detail/status/anatomy adapters
are required cross-feature contracts over one owner projection, not alternate
calculation paths.
