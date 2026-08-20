# Implementation Plan: Cost and Materials

**Branch**: `009-cost-and-materials` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-cost-and-materials/spec.md`

## Summary

Project the active `ShipLoadout` into one revision-keyed cost-and-material snapshot. The projector
preserves `retailCredits()` verbatim, recognizes Mercenary purchases only through fitted
`preEngineeredVariant` records, reads the one package `mercCoinCost()` total, classifies committed
engineering selections before calling package recipe helpers, and consolidates known recipe lists
only with `sumMaterials()`. Detail presentation and feature 003's Assembly Requirements summary
consume the same snapshot, so credits, Merc Coin, material quantities, lower bounds and missing
recipes cannot disagree.

The `.design/Ship Builder.dc.html` wide 1c rail, contextual engineering panel and mobile 1d Status /
Engineer compositions establish hierarchy, not data rules. The implementation retains their
glanceable cost-first order and narrow stack, while removing the invented combined credit total,
truncated material list, authored aggregate counts, merged Merc Coin/material treatment,
cross-origin icons and inaccessible interaction patterns.

## Technical Context

**Language/Version**: TypeScript 6.0; Angular HTML and SCSS; Node.js 24 tooling. Full TypeScript and
template strictness is a constitutional/feature-011 target and is not yet enabled in the current
shell repository

**Primary Dependencies**: Angular 22.1 standalone and zoneless target APIs; Angular signals; RxJS
7.8; pinned `@elite-dangerous-almanac/core` 0.1.4 leaf exports; planned feature 001 active-build
revision boundary, feature 002 shared engineering-cost classifier and exact-slot actions, feature
003 `AssemblyRequirementsPort`, and feature 011 localization/UI/accessibility contracts

**Storage**: None. Cost projections, material traces and disclosure state are derived and must not
enter `localStorage`, history, build links, URLs or SLEF. `ShipLoadout.sourcePurchase` and fitted
captured `value` are ignored historical inputs and never enter application state or backfill retail

**Testing**: Vitest through Angular's unit-test builder with the existing 80% thresholds; Playwright
and axe across desktop, tablet portrait/landscape and mobile portrait/landscape in Chromium and
Firefox after feature 011 supplies the missing matrix and accessibility harness

**Target Platform**: Static client-side application for evergreen desktop, tablet and mobile
browsers; offline after first load; pointer, touch and screen-reader use

**Project Type**: Client-side Angular single-page application; no backend or application API

**Performance Goals**: One synchronous projection for each requested active-build revision; matching
detail and Status output visible within 100 ms of a settled build change under mobile Chromium 4x
CPU slowdown; locale-only changes re-present without repeating package quantity calls

**Constraints**: No application-owned price, rebuy, Merc Coin, recipe, roll or material-total
arithmetic; no currency conversion/comparison; package `null`, `[]`, zero and conditional absence
remain distinct; exact game slot/symbol/fdname identities; leaf imports only; no cross-origin
requests; no document horizontal scrolling; token-only dark design system; all owned text and
figures localized; WCAG 2.2 AA except the constitution's named keyboard criteria

**Scale/Scope**: One active build. Pinned-package regression scope is 107 blueprint mechanics
records/106 cost records, 86 effect/cost records, 146 material records, and 22 currently priced
Mercenary variants; those counts are tests, never application behavior

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1c and 1d; adoption and departures are
recorded in [design/reference-review.md](./design/reference-review.md)

## Constitution Check

_GATE before Phase 0: PASS. The design introduces no constitutional exception. Implementation of
the integrated capability remains sequenced behind repository prerequisites listed below._

| Principle                               | Planning evidence                                                                                                                      | Status                         |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| I. Client-Side Only                     | All inputs are the in-browser active loadout and static package/catalogue data; no persistence or network boundary is added.           | PASS                           |
| II. Almanac Source of Truth             | Named package methods own every number and Mercenary decision; no fdname exception or consumer formula is planned.                     | PASS                           |
| III. Domain Logic Outside UI            | A framework-agnostic projector/classifier creates immutable semantic results; components only render and emit intents.                 | PASS                           |
| IV. Lossless, Honest Builds             | Exact, lower-bound, absent, unavailable, known-empty and non-crafted states stay distinct; historical prices remain outside the model. | PASS                           |
| V. Desktop, Tablet and Mobile           | Complete content reflows for all orientations/zoom, uses touch and screen-reader semantics, and never relies on hover or colour.       | PASS; feature 011 prerequisite |
| VI. Commander's Language                | App framing/figures use feature 011; game names use package locale helpers with disclosed canonical fallback.                          | PASS; feature 011 prerequisite |
| VII. One Design System                  | The surfaces compose or extend `src/app/ui/`; `.design` supplies hierarchy only and no literal CSS/assets are copied blindly.          | PASS; feature 011 prerequisite |
| VIII. Tested Before It Ships            | Package equality, traceability, dual-engine viewport journeys and axe/manual checks retain all existing gates.                         | PASS; feature 011 prerequisite |
| IX. Specification Before Implementation | Every FR maps to a planned surface and contract before task generation.                                                                | PASS                           |

### Implementation prerequisites

1. Feature 001 must implement the active `/build` workspace and an atomic `{ loadout,
buildRevision }` read boundary.
2. Feature 002 must expose its framework-agnostic engineering-cost classification and exact-slot
   target handling.
3. Feature 003 must accept feature 009's exact projection type through its planned
   `AssemblyRequirementsPort` without recomputing or reclassifying it.
4. Feature 011 must implement the shared UI, localization/formatting, announcements, Firefox,
   landscape and automated accessibility infrastructure currently absent from the repository.
5. Almanac 0.1.4 already supplies feature 009's required data APIs and the Expanded Cargo Rack
   regression fix; no direct Almanac blocker remains.

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
│   ├── outfitting/
│   │   └── engineering-cost.ts             # feature 002 shared package-cost boundary
│   └── cost-materials/
│       ├── cost-materials-projector.ts      # pure whole-build package projection
│       ├── cost-materials-snapshot.ts       # immutable semantic states
│       └── engineering-requirements.ts      # committed sources, consolidation and traces
├── application/
│   └── cost-materials/
│       ├── assembly-requirements.adapter.ts # feature 003 port implementation
│       ├── cost-materials.presenter.ts      # app i18n + Almanac game-name presentation
│       └── cost-materials.store.ts          # active-revision cache/publication
├── features/build-workspace/
│   └── cost-and-materials/
│       ├── cost-and-materials-detail/
│       ├── engineering-materials/
│       ├── material-trace/
│       ├── mercenary-purchases/
│       └── retail-credits/
├── i18n/                                    # feature 011; extended with owned messages only
└── ui/                                      # feature 011; shared primitives only

e2e/
└── cost-and-materials.spec.ts
```

Tests live beside domain, application and component sources. If feature 002's implemented shared
classifier has a different accepted location, feature 009 consumes that export rather than creating
a second classifier.

**Structure Decision**: Keep one Angular application and one active build. A pure domain projector
owns package reads and semantic classification; a revision-keyed application store exposes the same
immutable snapshot to detail and feature 003; a presenter adds locale-specific text without changing
quantities. No route, serializer, storage adapter, private catalogue or second `ShipLoadout` is added.

## Phase 0: Research Conclusions

[research.md](./research.md) records the decisions and rejected alternatives. In summary:

- `RetailCredits` is fully numeric in 0.1.4. Hull is exact; modules and rebuy become lower bounds
  only when the returned ordered `unpriced` list is non-empty. No combined credit total is created.
- Merc Coin is absent when no fitted variant is package-recognized. Otherwise per-slot optional
  prices and the literal `mercCoinCost()` result are shown; missing prices qualify that result as a
  lower bound.
- Mercenary grade 1 is a non-crafted purchase baseline. Later purchase-route grades call
  `getBlueprintCost(fdname, target, purchaseGrade)`; fixed reward engineering remains non-crafted;
  a separately selected effect costs one package application.
- Only `sumMaterials()` consolidates known source lists. Case-insensitive trace joins retain source
  counts/identities without recalculating consolidated quantities or changing first-seen order.
- Material metadata and names come from package leaf helpers; canonical English remains visible with
  the shared untranslated disclosure on locale miss.
- The reference's wide rail/context and mobile Status/Engineer hierarchy is retained after removing
  unsupported totals, truncation, merged currencies, remote assets and inaccessible interaction.

All planning questions are resolved and no direct Almanac dependency remains.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines the revision snapshot, exact/lower-bound/absent states,
  source costs, package-consolidated rows and non-arithmetic traces.
- [contracts/retail-and-merc-coin.md](./contracts/retail-and-merc-coin.md) freezes retail fields,
  recognition, missing-price evidence and currency separation.
- [contracts/engineering-materials.md](./contracts/engineering-materials.md) freezes committed-source
  classification, package recipe calls, consolidation, metadata and trace behavior.
- [contracts/assembly-requirements-and-targeting.md](./contracts/assembly-requirements-and-targeting.md)
  freezes revision coherence, feature 003 adaptation and exact-slot/detail intents.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every FR to the build workspace,
  Status summary, contextual editor integration and detail states.
- [design/cost-and-materials-detail.md](./design/cost-and-materials-detail.md) defines content order,
  responsive composition, state handling and accessible interaction.
- [design/reference-review.md](./design/reference-review.md) records what canvases 1c/1d contribute
  and every constitution/spec-driven departure.
- [quickstart.md](./quickstart.md) provides runnable package, unit, integration, responsive,
  localization, offline, performance and accessibility validation.

## Post-Design Constitution Re-check

Phase 1 adds no server, persistence field, alternate build, private game data, local price/recipe
formula, cross-origin asset, hard-coded application string or screen-local visual literal. Every
spec requirement has a surface owner and validation path. Numeric zero, conditional absence,
package `null`, `[]`, lower bounds and non-crafted baselines remain distinguishable; credits and Merc
Coin never share a total.

The post-design gate remains **PASS with no exception**. Integrated implementation is blocked only
by the repository prerequisites above, not by an unresolved feature-009 design or Almanac gap.

## Complexity Tracking

No constitutional violation requires justification. The projector/store/presenter split is the
minimum separation that keeps package projection testable, prevents mixed revisions and avoids
re-running domain quantities on locale changes. Reusing feature 002's cost boundary avoids a second
fixed/Mercenary classifier.
