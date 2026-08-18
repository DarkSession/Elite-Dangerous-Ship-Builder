# Implementation Plan: Cost and Materials

**Branch**: `009-cost-and-materials` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-cost-and-materials/spec.md`

## Summary

Add one Cost and Materials capability inside the active `/build` workspace. A pure,
revision-stamped projector reads `ShipLoadout.retailCredits()` once, recognizes Mercenary purchases
only through each fitted module's `preEngineeredVariant`, reads `ShipLoadout.mercCoinCost()` once,
and obtains every engineering contribution through `getBlueprintCost()`,
`getExperimentalEffectCost()` and `sumMaterials()`. It preserves package values and the distinctions
between exact, lower-bound, unavailable, absent, fixed-not-crafted and incomplete results. A
signal-based store publishes one immutable snapshot; feature 003 consumes the same snapshot through
its `AssemblyRequirementsPort`, while feature 002 receives exact-slot intents.

Implementation is **blocked** on an Almanac release that removes the false ordinary route for the
fixed Expanded Cargo Rack reward. Beta.12 and current upstream `main` expose
`CargoRack_IncreasedCapacity` grade 5 as free ordinary engineering on a stock rack and return `[]`
for its cost. The defect is filed as
[Elite-Dangerous-Almanac #306](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/306).
No local fdname exception, substitute recipe or reinterpretation of `[]` is planned.

The `.design/Ship Builder.dc.html` 1c/1d cost-and-material hierarchy informs the wide and narrow
composition. Its invented combined credit total, authored material totals, truncated material list,
merged Merc Coin/material card and cross-origin material icons are excluded.

## Technical Context

**Language/Version**: TypeScript 6.0 in strict mode; HTML and SCSS; Node.js 24 per `.nvmrc` for
tooling

**Primary Dependencies**: Angular 22.1 standalone and zoneless APIs, Angular signals, RxJS 7.8,
`@elite-dangerous-almanac/core` 0.1.0-beta.12 leaf exports (upgrade required for #306), feature 001's
active-build/revision boundary, feature 002's normalized fitted engineering and exact-slot intent,
feature 003's `AssemblyRequirementsPort`, and feature 011's UI/localization/testing infrastructure

**Storage**: None owned by feature 009. Costs, material projections, expanded traces and capability
selection never enter local storage, history, URLs, build links or SLEF. Source-purchase values remain
owned by features 001/004 and are not copied into catalogue retail

**Testing**: Vitest through Angular's unit-test builder with 80% minimum coverage; Playwright with
`@axe-core/playwright` over desktop, tablet/mobile portrait and landscape in Chromium and Firefox.
The current suite lacks Firefox, landscape projects and automated accessibility checks, which
feature 011 must supply

**Target Platform**: Modern evergreen browsers on desktop, tablet and mobile; static client
application usable offline after first load

**Project Type**: Client-side Angular single-page application producing static files only

**Performance Goals**: One complete projection per settled build revision; every visible cost,
qualification and trace shares that revision; settled changes render within 100 ms at the mobile
viewport under Chromium 4x CPU slowdown

**Constraints**: No server, account, telemetry or cross-origin request; no application-owned price,
rebuy, Merc Coin, recipe, roll, consolidation or material-grade calculation; credits and Merc Coin
remain separate; `null`, `[]`, zero and absence stay distinct; no page horizontal scrolling; one dark
tokenized theme; all application text and figures localized; touch/screen-reader operation; WCAG 2.2
AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: One active build; 107 beta.12 blueprint cost records, 86 experimental-effect cost
records, 106 material identities used by those recipes, the 146-entry ship-material catalogue and 22
current Mercenary variants

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1c and 1d. Adopted hierarchy and
required departures are recorded in [design/reference-review.md](./design/reference-review.md)

## Constitution Check

_GATE: Passed for planning because the design waits for package truth and introduces no
constitutional exception. Implementation is gated on the released Almanac dependency and repository
prerequisites below. Re-check after Phase 1 and after the package upgrade._

| Principle                               | Design evidence                                                                                                                                                           | Status                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| I. Client-Side Only                     | All projections use the in-browser active build, static package data and same-origin messages; no persistence or network boundary is added.                               | PASS                       |
| II. Almanac Source of Truth             | Every quantity and recognition comes from named package APIs. #306 is a release gate; no fdname special case or substitute recipe is planned.                             | PASS; implementation gated |
| III. Domain Logic Outside UI            | A pure projector creates one immutable snapshot; a computed store coordinates revisions; components render localized inputs and emit intents.                             | PASS                       |
| IV. Lossless, Honest Builds             | Exact, lower-bound, unavailable, absent, fixed-not-crafted, known-empty and incomplete states remain distinct; source purchase is not relabelled as retail.               | PASS                       |
| V. Desktop, Tablet and Mobile           | One complete responsive surface stacks at narrow/zoomed widths, supports touch/screen reader/200% text/400% zoom/orientations and prevents document overflow.             | PASS                       |
| VI. Commander's Language                | Owned labels and figures use feature 011; material/module names use Almanac locale helpers with disclosed canonical fallback.                                             | PASS                       |
| VII. One Design System                  | The surface composes/extends feature 011 primitives and tokens; the HTML reference contributes hierarchy only.                                                            | PASS; prerequisite 011     |
| VIII. Tested Before It Ships            | Exact package equality, source traceability, dual-engine multi-viewport journeys and automated/manual accessibility coverage are specified without relaxing the 80% gate. | PASS; prerequisite 011     |
| IX. Specification Before Implementation | Every FR maps to a plan-time surface and interface contracts exist before task breakdown.                                                                                 | PASS                       |

### Required upstream and repository dependencies

1. [Almanac issue #306](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/306)
   must land in a released package. The minimal reproduction and required semantics are in
   [research.md](./research.md#expanded-cargo-rack--upstream-blocker).
2. Feature 001 must supply the single active `ShipLoadout`, atomic build revision and `/build`
   workspace.
3. Feature 002 must supply normalized fixed/ordinary engineering state, exact-slot selection and the
   shared per-selection cost classifier. Its upstream editing/import gates #291 and #292 remain
   applicable to the state feature 009 reads, but do not add a separate 009 calculation.
4. Feature 003 must accept feature 009's immutable `AssemblyRequirementsPort` projection without
   recomputing totals or qualifications.
5. Feature 011 must supply shared components/tokens, localization/formatting, Firefox/landscape
   projects and the automated accessibility harness.

Feature 009 may be tasked only after these contracts are accepted. It cannot be implemented or
shipped until #306 is released and consumed.

## Project Structure

### Documentation (this feature)

```text
specs/009-cost-and-materials/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── assembly-requirements-and-targeting.md
│   ├── engineering-materials.md
│   └── retail-and-merc-coin.md
└── design/
    ├── cost-and-materials-detail.md
    ├── reference-review.md
    └── screen-inventory.md
```

`tasks.md` is Phase 2 output and is intentionally not created by this command.

### Source Code (repository root)

```text
src/app/
├── domain/
│   ├── engineering-cost/                    # shared package-cost classifier with feature 002
│   │   ├── engineering-cost-projector.ts
│   │   └── engineering-cost-source.ts
│   └── cost-materials/
│       ├── cost-materials-projector.ts      # pure whole-build projection
│       └── cost-materials-snapshot.ts       # immutable semantic result types
├── application/
│   └── cost-materials/
│       ├── assembly-requirements.adapter.ts # feature 003 port
│       ├── cost-materials.presenter.ts      # locale/package-name presentation
│       └── cost-materials.store.ts          # revision-coherent computed snapshot
├── i18n/                                    # feature 011 messages and formatters
├── ui/                                      # feature 011 shared/extended primitives
└── features/
    └── build-workspace/
        └── cost-and-materials/
            ├── cost-and-materials-detail/
            ├── engineering-materials/
            ├── material-trace/
            ├── merc-coin-purchases/
            └── retail-credits/

e2e/
└── cost-and-materials.spec.ts
```

Tests live beside each domain/application/component source. File names may be coalesced where a
shared component already supplies a primitive; no feature 009 copy of a feature 001/002/003/011
component is created.

**Structure Decision**: Keep one Angular application and one active build. A framework-agnostic
projector owns package reads and semantic classifications; one computed store binds the result to the
active build revision; one presenter adds locale and package-name resolution without changing domain
quantities. Feature 003 adapts the same snapshot, and exact slot keys target feature 002. No route,
storage adapter, calculation service, private catalogue or second `ShipLoadout` is added.

## Phase 0: Research Conclusions

All decisions, package probes, alternatives and the blocker are recorded in
[research.md](./research.md). The decisive outcomes are:

- `retailCredits()` is the only credit boundary. Hull, modules, rebuy and ordered unpriced entries
  are preserved; no hull-plus-modules total is invented.
- Mercenary entries are recognized only through `preEngineeredVariant.acquisition`. Per-slot price
  remains optional, and `mercCoinCost()` is the sole build total. No recognized entry means absence.
- Ordinary blueprint progression uses `getBlueprintCost`; each selected effect uses one
  `getExperimentalEffectCost`; recognized fixed/purchase baselines add no craft cost.
- `sumMaterials()` alone consolidates known package lists. Each consolidated symbol retains exact
  source-list contributors so traceability is a join, never a re-sum.
- `getMaterialBySymbol()` supplies grade/identity and `getMaterialName()` supplies active-locale text;
  canonical English remains visibly disclosed when localization returns `null`.
- Beta.12's only empty cumulative blueprint result is the false ordinary Expanded Cargo Rack route.
  #306 blocks implementation rather than permitting a consumer exception.
- The reference's glanceable order is retained after removing its unsupported combined totals,
  counts, truncation, cross-origin images and merged currency treatment.

No planning clarification marker remains. The unresolved work is an explicit external dependency,
not an ambiguity to solve by assumption.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines the revision-stamped snapshot, credit and currency states,
  engineering source costs, package-consolidated material rows and trace relationships.
- [contracts/retail-and-merc-coin.md](./contracts/retail-and-merc-coin.md) freezes the package calls,
  lower-bound/absence rules, currency separation and per-slot identity behavior.
- [contracts/engineering-materials.md](./contracts/engineering-materials.md) freezes fixed-versus-
  crafted classification, recipe calls, incomplete consolidation, package metadata and traces.
- [contracts/assembly-requirements-and-targeting.md](./contracts/assembly-requirements-and-targeting.md)
  freezes feature 003 adaptation, revision coherence and exact-slot/detail intents.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every FR to the `/build` capability
  surface and records cross-feature ownership.
- [design/cost-and-materials-detail.md](./design/cost-and-materials-detail.md) defines information
  order, wide/narrow composition, all states and announcements.
- [design/reference-review.md](./design/reference-review.md) records which 1c/1d hierarchy is adopted
  and which unsupported details are rejected.
- [quickstart.md](./quickstart.md) supplies runnable upstream, unit, end-to-end, responsive,
  localization, offline and accessibility validation scenarios.

## Post-Design Constitution Re-check

Phase 1 introduces no server, persisted projection, alternate build, private game catalogue, local
price/recipe/roll/consolidation formula, hard-coded display string or visual literal. Every optional,
absent, zero, lower-bound, known-empty and unavailable state remains distinguishable. Credits and
Merc Coin never share a total. Every FR has a surface owner and a dual-engine responsive/accessibility
validation path.

The planning gate remains **PASS with no exception**. Implementation remains **blocked upstream** by
Almanac #306 and sequenced behind features 001, 002, 003 and 011. After upgrading the pinned package
and completing those prerequisites, rerun the minimal reproduction, confirm the public leaf
contracts, re-evaluate this constitution table and then generate or refresh tasks.

## Complexity Tracking

No constitutional exception is requested. The projector/store/presenter split is the minimum
structure that keeps package projection testable without rendering, guarantees revision coherence
and prevents locale state from contaminating domain quantities. The shared selection-cost classifier
avoids duplication with feature 002. Upstream gaps remain blockers rather than application-side
rules.
