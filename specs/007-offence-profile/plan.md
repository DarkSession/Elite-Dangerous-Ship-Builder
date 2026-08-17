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

Implementation is **blocked** on an Almanac release that exposes authoritative post-engineering
range and armour-piercing values in the fitted-weapon projection returned by
`ShipLoadout.weaponMetrics()`. Beta.12 exposes those fields only through a separate
`fittedModuleAt(slot).effectiveStats` lookup, which cannot satisfy the feature's single per-weapon
source boundary without an application-owned join. The gap is filed as
[Elite-Dangerous-Almanac #300](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/300).
No local join or copied projection is planned.

The `.design/Ship Builder.dc.html` canvas 1c/1d offence hierarchy informs wide and narrow
composition. Its target-resistance simulation, damage-at-range aggregation, convergence model,
damage shares and inferred bar scales are excluded.

## Technical Context

**Language/Version**: TypeScript 6.0 in strict mode; HTML and SCSS; Node.js 24 per `.nvmrc` for
tooling

**Primary Dependencies**: Angular 22.1 standalone and zoneless APIs, Angular signals, RxJS 7.8,
`@elite-dangerous-almanac/core` 0.1.0-beta.12 leaf exports (upgrade required for the blocker),
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

**Scale/Scope**: 48 pinned hulls, at most 10 hardpoint slots on one hull, and 159 beta.12 hardpoint
catalogue records; one whole-build total, up to 10 complete weapon entries and one WEP-capacitor
result per active build

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1c and 1d. Adopted hierarchy and
required departures are recorded in [design/reference-review.md](./design/reference-review.md)

## Constitution Check

_GATE: Passed for planning because the design waits for package truth and introduces no
constitutional exception. Implementation is gated on the released Almanac dependency and
prerequisite features below. Re-check after Phase 1 and after the package upgrade._

| Principle                               | Design evidence                                                                                                                                               | Status                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| I. Client-Side Only                     | All projections run over the in-browser active build and installed static package; no persistence or network boundary is added.                               | PASS                       |
| II. Almanac Source of Truth             | Both aggregate calls are package facades. Missing fitted-weapon range/piercing is an upstream release gate; no join, formula or fallback is planned.          | PASS; implementation gated |
| III. Domain Logic Outside UI            | A pure projector creates one immutable snapshot; a computed signal facade coordinates revisions and conditions; components render inputs and emit intents.    | PASS                       |
| IV. Lossless, Honest Builds             | Optional members, exact zero, no weapons, disabled weapons, no ammunition, unlimited ammunition, zero capacity and infinity retain distinct model states.     | PASS                       |
| V. Desktop, Tablet and Mobile           | One complete responsive surface stacks at narrow/zoomed widths, supports touch/screen reader/200% text/400% zoom/orientations and prevents document overflow. | PASS                       |
| VI. Commander's Language                | Application labels, units and semantic sentinels use feature 011; weapon names use Almanac localization with disclosed canonical fallback.                    | PASS                       |
| VII. One Design System                  | The surface composes/extends feature 011 primitives and tokens; the HTML reference contributes hierarchy only.                                                | PASS; prerequisite 011     |
| VIII. Tested Before It Ships            | Exact field equality, dual-engine multi-viewport journeys and automated/manual accessibility coverage are specified without relaxing the 80% gate.            | PASS; prerequisite 011     |
| IX. Specification Before Implementation | Every FR maps to the plan-time Offence Profile surface and contracts exist before task breakdown.                                                             | PASS                       |

### Required upstream and repository dependencies

1. [Almanac issue #300](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/300) must land
   in a released package. The minimal reproduction and required semantics are in
   [research.md](./research.md#fitted-weapon-range-and-piercing--upstream-blocker).
2. Feature 001 must supply the single active `ShipLoadout`, atomic build revision and `/build`
   workspace.
3. Feature 002 must supply exact-slot selection and the authoritative fitted-module editor; its own
   Almanac normalization blockers remain applicable to builds feature 007 reads.
4. Feature 003 must supply the shared valid six-pip condition/revision contract and WEP selection.
5. Feature 005 must supply the package-backed distributor/power observation needed to distinguish a
   missing, disabled or power-shed distributor from the capacitor method's genuine zero-capacity
   result. Its upstream dependency
   [Almanac #299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299) remains
   applicable.
6. Feature 011 must supply shared components/tokens, localization/formatting, Firefox/landscape
   projects and the automated accessibility harness.

[Almanac #301](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/301) tracks a separate
beta.12 defect in the documented fitted-weapon slot ordering. It is non-blocking because feature 007
does not require canonical order; the application preserves returned order and never adds a local
repair.

Feature 007 may be tasked only after these contracts are accepted. It cannot be considered
implemented or shipped until the upstream gates are released and consumed.

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

All decisions, package probes, alternatives and the blocker are recorded in
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
- Beta.12's fitted-weapon projection omits effective range and piercing. Implementation waits for
  #300 rather than joining `fittedModuleAt()` locally.
- Beta.12 can return imported module order despite documenting slot order. #301 tracks the defect;
  the initial presentation preserves returned order without claiming or repairing canonical order.
- `weaponsCapacitorMetrics({ weaponsPips })` receives the shared selected value and supplies all
  capacity, recharge, draw, drain and duration fields. Context changes only the semantic wording of
  zero/infinity; it never changes the returned value.
- The reference's two-region information hierarchy is usable only after removing its calculated
  shares, range bands, target resistance, corrosion effects, convergence and inaccessible bars.

No planning clarification marker remains. The unresolved work is an explicit external dependency,
not an ambiguity to solve by assumption.

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
- [quickstart.md](./quickstart.md) supplies runnable upstream, unit, end-to-end, responsive and
  accessibility validation scenarios.

## Post-Design Constitution Re-check

Phase 1 introduces no server, persisted metric, alternate build, private game catalogue, local
weapon or capacitor formula, hard-coded display string or visual literal. The only missing
package-derived range/piercing projection is deliberately absent and blocked on a released Almanac
result. Every optional, absent, zero, disabled, unlimited and infinite state remains distinguishable.
Every FR has a surface owner and a dual-engine responsive/accessibility validation path.

The planning gate remains **PASS with no exception**. Implementation remains **blocked upstream** by
Almanac #300 and by the shared power-state dependency in #299, and is sequenced behind features 001,
002, 003, 005 and 011. After upgrading the pinned package and completing those prerequisites, rerun
the minimal reproductions, confirm the public leaf contracts, re-evaluate this constitution table and
then generate or refresh tasks.

## Complexity Tracking

No constitutional exception is requested. The projector/facade split is the minimum structure that
keeps package projection testable without rendering and guarantees revision coherence. Upstream gaps
remain blockers rather than application-side joins or calculations.
