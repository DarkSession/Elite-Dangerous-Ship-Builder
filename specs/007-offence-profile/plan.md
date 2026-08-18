# Implementation Plan: Offence Profile

**Branch**: `007-offence-profile` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-offence-profile/spec.md`

## Summary

Add one Offence Profile capability inside the active `/build` workspace. A pure,
revision-stamped projector calls `ShipLoadout.weaponMetrics()` once and
`ShipLoadout.weaponsCapacitorMetrics()` once for the selected WEP pips, then preserves every
returned field, optional member, zero and infinity in an immutable presentation snapshot. Feature
003 owns WEP-pip conditions, feature 002 owns exact-slot navigation, feature 005 owns the shared
power/distributor observation, and feature 011 supplies the responsive, accessible design system and
localization layer.

Almanac 0.1.1 exposes authoritative post-engineering range, projectile-boundary and armour-piercing
values directly in each fitted-weapon projection returned by `ShipLoadout.weaponMetrics()`. The
released work is recorded as
[Elite-Dangerous-Almanac #300](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/300).
No local join or copied projection is planned.

The `.design/Ship Builder.dc.html` canvas 1c/1d offence hierarchy informs wide and narrow
composition. Its target-resistance simulation, damage-at-range aggregation, convergence model,
damage shares and inferred bar scales are excluded.

## Technical Context

**Language/Version**: TypeScript 6.0 in strict mode; HTML and SCSS; Node.js 24 per `.nvmrc` for
tooling

**Primary Dependencies**: Angular 22.1 standalone and zoneless APIs, Angular signals, RxJS 7.8,
`@elite-dangerous-almanac/core` 0.1.1 leaf exports,
feature 001's active-build/revision boundary, feature 002's exact-slot intent, feature 003's viewing
conditions, feature 005's package-backed power observation, and feature 011's UI/localization
infrastructure

**Storage**: None owned by feature 007. The active `ShipLoadout` remains in feature 001; selected WEP
pips remain in feature 003's memory-only conditions. Metrics, expanded weapon details and capability
selection never enter local storage, edit history, build links or SLEF

**Testing**: Vitest through Angular's unit-test builder with 80% minimum coverage; Playwright with
`@axe-core/playwright` over desktop, tablet/mobile portrait and landscape in Chromium and Firefox.
The current suite lacks Firefox, landscape projects and automated accessibility checks, which
feature 011 must supply

**Target Platform**: Modern evergreen browsers on desktop, tablet and mobile; static client
application usable offline after first load

**Project Type**: Client-side Angular single-page application producing static files only

**Performance Goals**: One projection per settled build/condition revision; every visible offence
value shares one revision; settled changes render within 100 ms at the mobile viewport under
Chromium 4x CPU slowdown

**Constraints**: No server, account, telemetry or cross-origin request; no local weapon total,
damage share, falloff, piercing, target, convergence, pip-scaling or endurance calculation; missing,
zero, disabled, absent and infinite states remain distinct; no page horizontal scrolling; one dark
tokenized theme; all application text and figures localized; touch/screen-reader operation; WCAG 2.2
AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: 48 pinned hulls, at most 10 hardpoint slots on one hull, and 159 0.1.1 hardpoint
catalogue records; one whole-build total, up to 10 complete weapon entries and one WEP-capacitor
result per active build

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1c and 1d. Adopted hierarchy and
required departures are recorded in [design/reference-review.md](./design/reference-review.md)

## Constitution Check

_GATE: Passed. The design consumes package truth and introduces no constitutional exception. The
Almanac dependency is satisfied; repository prerequisite features remain._

| Principle                               | Design evidence                                                                                                                                               | Status                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| I. Client-Side Only                     | All projections run over the in-browser active build and installed static package; no persistence or network boundary is added.                               | PASS                   |
| II. Almanac Source of Truth             | Both aggregate calls are package facades. Fitted-weapon range/piercing and canonical order come directly from 0.1.1; no join, formula or fallback is planned. | PASS                   |
| III. Domain Logic Outside UI            | A pure projector creates one immutable snapshot; a computed signal facade coordinates revisions and conditions; components render inputs and emit intents.    | PASS                   |
| IV. Lossless, Honest Builds             | Optional members, exact zero, no weapons, disabled weapons, no ammunition, unlimited ammunition, zero capacity and infinity retain distinct model states.     | PASS                   |
| V. Desktop, Tablet and Mobile           | One complete responsive surface stacks at narrow/zoomed widths, supports touch/screen reader/200% text/400% zoom/orientations and prevents document overflow. | PASS                   |
| VI. Commander's Language                | Application labels, units and semantic sentinels use feature 011; weapon names use Almanac localization with disclosed canonical fallback.                    | PASS                   |
| VII. One Design System                  | The surface composes/extends feature 011 primitives and tokens; the HTML reference contributes hierarchy only.                                                | PASS; prerequisite 011 |
| VIII. Tested Before It Ships            | Exact field equality, dual-engine multi-viewport journeys and automated/manual accessibility coverage are specified without relaxing the 80% gate.            | PASS; prerequisite 011 |
| IX. Specification Before Implementation | Every FR maps to the plan-time Offence Profile surface and contracts exist before task breakdown.                                                             | PASS                   |

### Required released and repository dependencies

1. [Almanac issue #300](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/300) is released
   in 0.1.1. The regression and semantics are in
   [research.md](./research.md#fitted-weapon-range-and-piercing--released-in-011).
2. Feature 001 must supply the single active `ShipLoadout`, atomic build revision and `/build`
   workspace.
3. Feature 002 must supply exact-slot selection and the authoritative fitted-module editor; its
   released Almanac normalization behavior remains applicable to builds feature 007 reads.
4. Feature 003 must supply the shared valid six-pip condition/revision contract and WEP selection.
5. Feature 005 must supply the package-backed distributor/power observation needed to distinguish a
   missing, disabled or power-shed distributor from the capacitor method's genuine zero-capacity
   result. Its dependency [Almanac #299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299)
   is also released in 0.1.1.
6. Feature 011 must supply shared components/tokens, localization/formatting, Firefox/landscape
   projects and the automated accessibility harness.

[Almanac #301](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/301) is released in
0.1.1: known weapons use hull-slot order, followed by unknown/unmapped slots in source order. The
application preserves that returned order and adds no local repair.

Feature 007 may be tasked only after these contracts are accepted. It cannot be considered
implemented or shipped until the repository prerequisites are consumed.

## Project Structure

### Documentation (this feature)

```text
specs/007-offence-profile/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── capacitor-endurance.md
│   └── weapon-output.md
└── design/
    ├── offence-profile.md
    ├── reference-review.md
    └── screen-inventory.md
```

`tasks.md` is Phase 2 output and is intentionally not created by this command.

### Source Code (repository root)

```text
src/app/
├── domain/
│   ├── build/                              # feature 001 active-build revision boundary
│   └── offence/
│       ├── offence-projector.ts            # pure package-result projection
│       └── offence-result.ts               # semantic absent/zero/infinite unions
├── application/
│   ├── viewing-conditions/                 # feature 003 shared WEP-pip conditions
│   └── offence/
│       ├── offence.facade.ts               # revision-coherent computed snapshot
│       └── offence.presenter.ts             # localized component view models
├── i18n/                                   # feature 011 messages and formatters
├── ui/                                     # feature 011 shared/extended components
└── features/
    └── build-workspace/
        └── offence-profile/
            ├── build-weapon-summary/
            ├── capacitor-endurance/
            ├── damage-type-output/
            └── weapon-output-list/

e2e/
├── accessibility.ts                       # feature 011 shared helper
└── offence-profile.spec.ts
```

Tests live beside each domain/application/component source. File names may be coalesced where a
shared component already supplies a primitive; no feature 007 copy of a feature 002/003/005/011
component is created.

**Structure Decision**: Keep one Angular application and one active build. A framework-agnostic
projector reads the two package results and creates semantic discriminants without changing numeric
values. One computed facade combines the active-build revision, shared condition revision and shared
distributor observation atomically. Route/workspace components receive localized views and emit only
detail-expansion and exact-slot intents. No top-level route, storage adapter, calculation service or
second `ShipLoadout` is added.

## Phase 0: Research Conclusions

All decisions, package probes, alternatives and released regressions are recorded in
[research.md](./research.md). The decisive outcomes are:

- `weaponMetrics()` is the sole build/weapon output boundary. Every `WeaponTotals`,
  `FittedWeaponMetrics`, `WeaponMetrics` and returned damage-split field is preserved exactly.
- Weapon collection cardinality distinguishes no fitted weapons from fitted weapons whose package
  total is zero, after shared hardpoint occupancy rules out an omitted unresolved entry. Disabled
  entries remain in returned order and package totals are never re-summed.
- Conventional damage amounts remain separate; optional unclassified stays optional and anti-xeno
  is labelled as an overlay. No share, percentage or partition is calculated.
- Ammunition keeps `null`, finite capacity, zero reserve and `unlimited` distinct; numeric infinity
  is never passed through generic JSON or number formatting.
- 0.1.1's fitted-weapon projection includes sparse effective range, projectile boundaries and
  piercing, satisfying #300 without a `fittedModuleAt()` join.
- 0.1.1 returns known weapons in hull-slot order and appends unknown/unmapped slots in source order,
  satisfying #301; presentation preserves that package order.
- `weaponsCapacitorMetrics({ weaponsPips })` receives the shared selected value and supplies all
  capacity, recharge, draw, drain and duration fields. Context changes only the semantic wording of
  zero/infinity; it never changes the returned value.
- The reference's two-region information hierarchy is usable only after removing its calculated
  shares, range bands, target resistance, corrosion effects, convergence and inaccessible bars.

No planning clarification marker or upstream dependency remains.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines the revision-stamped snapshot, exact build totals,
  complete fitted-weapon projection, damage/ammunition/range states, capacitor output and shared
  distributor observation.
- [contracts/weapon-output.md](./contracts/weapon-output.md) freezes the one-call package boundary,
  every aggregate/per-weapon field, damage-type semantics, missing-value behavior and exact-slot
  intent.
- [contracts/capacitor-endurance.md](./contracts/capacitor-endurance.md) freezes selected WEP-pip
  input, every returned capacitor field, context-aware zero/infinity wording and the shared power
  observation boundary.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every FR to the `/build` capability
  surface and records cross-feature ownership.
- [design/offence-profile.md](./design/offence-profile.md) defines information order, wide/narrow
  composition, complete weapon details, states and announcements.
- [design/reference-review.md](./design/reference-review.md) records which 1c/1d hierarchy is adopted
  and which unsupported details are rejected.
- [quickstart.md](./quickstart.md) supplies runnable released-API, unit, end-to-end, responsive and
  accessibility validation scenarios.

## Post-Design Constitution Re-check

Phase 1 introduces no server, persisted metric, alternate build, private game catalogue, local
weapon or capacitor formula, hard-coded display string or visual literal. Range/piercing comes from
the released fitted-weapon projection. Every optional, absent, zero, disabled, unlimited and infinite state remains distinguishable.
Every FR has a surface owner and a dual-engine responsive/accessibility validation path.

The planning gate remains **PASS with no exception**. Almanac 0.1.1 satisfies #299–#301;
implementation is sequenced behind features 001, 002, 003, 005 and 011. Rerun the regressions,
confirm the public leaf contracts and re-evaluate this constitution table when generating tasks.

## Complexity Tracking

No constitutional exception is requested. The projector/facade split is the minimum structure that
keeps package projection testable without rendering and guarantees revision coherence. Upstream gaps
remain package-owned rather than application-side joins or calculations.
