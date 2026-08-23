# Implementation Plan: Cost and Materials

**Branch**: `009-cost-and-materials` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-cost-and-materials/spec.md`

## Summary

Draw the two blocks canvases 1c and 1d put in the outfitting status rail — `COST` and `MATERIALS` —
from one pure synchronous projection of the active `ShipLoadout`. The projection reads
`buildCost()` once and preserves its credits, Merc Coin and consolidated materials verbatim. It
reuses feature 002's `engineeringCost()` only to count contributing blueprints, then counts the
material types and units the canvas prints.

**Wave 10 ruling.** Six spec-versus-canvas collisions were surfaced before implementation and the
design won all six; see [design/reference-review.md](./design/reference-review.md). The combined
credit total, the `REBUY 5%` label, the Merc Coin row inside `MATERIALS` and the aggregate counts
are all built as drawn. Everything the canvas does not draw — material traces, unpriced evidence,
lower-bound, unavailable and missing-recipe wording, and the Assembly Requirements port that carried
them — is not built. The material list is complete rather than truncated, the one ruling that is not
purely the canvas.

The result is a substantially smaller feature than this plan originally described: two presentation
blocks over one projector function, with no revision cache, no port, no adapter and no new shared
primitive.

## Technical Context

**Language/Version**: TypeScript; Angular HTML and SCSS; Node.js per the repository tooling
configuration. Full TypeScript and template strictness is a constitutional/feature-011 prerequisite

**Primary Dependencies**: Angular standalone and zoneless target APIs; Angular signals;
`@elite-dangerous-almanac/core` leaf exports; feature 001 active build, feature 002
`engineeringCost()` / `materialRarity()` and the `edsb-material-grade` primitive, and feature 011
localization/UI/accessibility contracts. Feature 003 is **not** a dependency: its
`AssemblyRequirementsPort` is withdrawn with ruling F

**Storage**: None. These figures are derived and must not enter `localStorage`, history, build
links, URLs or SLEF. `ShipLoadout.sourcePurchase` and fitted captured `value` are ignored historical
inputs and never enter application state or backfill retail

**Testing**: Vitest through Angular's unit-test builder with the existing 80% thresholds; Playwright
and axe across desktop, tablet portrait/landscape and mobile portrait/landscape in Chromium and
Firefox after feature 011 supplies the missing matrix and accessibility harness

**Target Platform**: Static client-side application for evergreen desktop, tablet and mobile
browsers; offline after first load; pointer, touch and screen-reader use

**Project Type**: Client-side Angular single-page application; no backend or application API

**Performance Goals**: One synchronous projection per build change, memoized by the signal graph;
locale-only changes re-present without repeating package quantity calls

**Constraints**: No application-owned price, rebuy, Merc Coin, recipe or roll arithmetic, apart from
the three ruled canvas counts (blueprint count, material-type count, unit total); no
currency conversion/comparison; package `null`, `[]`, zero and conditional absence
remain distinct; exact game slot/symbol/fdname identities; leaf imports only; no cross-origin
requests; no document horizontal scrolling; token-only dark design system; all owned text and
figures localized; WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: One active build and every blueprint, effect, material and priced pre-engineered
variant supplied by the installed package. Catalogue counts are discovered by contract tests, never
application behavior

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1c and 1d. The canvas is the record of
what this capability presents; the six wave 10 rulings are in
[design/reference-review.md](./design/reference-review.md) and are binding

## Constitution Check

_GATE before Phase 0: PASS. The design introduces no constitutional exception. Implementation of
the integrated capability remains sequenced behind repository prerequisites listed below._

| Principle                               | Planning evidence                                                                                                                                                                         | Status                         |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| I. Client-Side Only                     | All inputs are the in-browser active loadout and static package/catalogue data; no persistence or network boundary is added.                                                              | PASS                           |
| II. Almanac Source of Truth             | Named package methods own every number and Mercenary decision; no fdname exception or consumer formula is planned.                                                                        | PASS                           |
| III. Domain Logic Outside UI            | A framework-agnostic projector returns an immutable result; components only render it. Classification is feature 002's, not duplicated.                                                   | PASS                           |
| IV. Lossless, Honest Builds             | Every presented figure is a package result or a ruled count over one; historical prices stay outside the model. Ruling F accepts that unpriced modules and uncostable recipes are silent. | PASS with ruled exception      |
| V. Desktop, Tablet and Mobile           | Complete content reflows for all orientations/zoom, uses touch and screen-reader semantics, and never relies on hover or colour.                                                          | PASS; feature 011 prerequisite |
| VI. Commander's Language                | App framing/figures use feature 011; game names use package locale helpers with disclosed canonical fallback.                                                                             | PASS; feature 011 prerequisite |
| VII. One Design System                  | The surfaces compose or extend `src/app/ui/`; `.design` supplies hierarchy only and no literal CSS/assets are copied blindly.                                                             | PASS; feature 011 prerequisite |
| VIII. Tested Before It Ships            | Package equality, dual-engine viewport journeys and axe/manual checks retain all existing gates.                                                                                          | PASS; feature 011 prerequisite |
| IX. Specification Before Implementation | Every FR maps to a planned surface and contract before task generation.                                                                                                                   | PASS                           |

### Implementation prerequisites

1. Feature 001 must implement the active `/build` workspace and an atomic `{ loadout,
buildRevision }` read boundary.
2. Feature 002 must expose its framework-agnostic engineering-cost classification and exact-slot
   target handling.
3. ~~Feature 003 must accept feature 009's exact projection type through its planned
   `AssemblyRequirementsPort`.~~ **Withdrawn (ruling F).** Feature 003 is no longer a prerequisite.
   Feature 009 contributes two sibling blocks into the status rail that feature 003 will own; when
   feature 003 lands it must not recompute these figures.
4. Feature 011 must implement the shared UI, localization/formatting, announcements, Firefox,
   landscape and automated accessibility infrastructure currently absent from the repository.
5. The installed Almanac package supplies feature 009's required data APIs and the Expanded Cargo Rack
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
│   ├── assembly-requirements-and-targeting.md   # WITHDRAWN by ruling F
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
│   │   └── engineering-cost.ts             # feature 002's boundary, consumed not duplicated
│   └── cost-materials/
│       └── cost-materials.ts               # the whole pure projection
├── features/build-workspace/outfitting/
│   └── cost-materials/                     # the two blocks the canvas draws
├── i18n/                                   # feature 011; extended with owned messages only
└── ui/                                     # feature 011; shared primitives only

e2e/
└── cost-and-materials.spec.ts
```

There is no `application/cost-materials/` layer. With one synchronous projection and one consumer
there is nothing for a store, adapter or presenter to mediate; the component reads the projection
through a computed signal over the active build, as feature 002's surfaces already do.

Tests live beside domain, application and component sources. If feature 002's implemented shared
classifier has a different accepted location, feature 009 consumes that export rather than creating
a second classifier.

**Structure Decision**: One pure domain function owns every package read; one component draws the
two blocks. No route, store, adapter, presenter, port, serializer, storage adapter, private
catalogue, new shared primitive or second `ShipLoadout` is added.

## Phase 0: Research Conclusions

[research.md](./research.md) records the decisions and rejected alternatives. After the wave 10
ruling the operative conclusions are:

- `buildCost().credits` is fully numeric. `hull`, `modules`, `total` and `rebuy` are drawn literally;
  `unpriced` is not read.
- Merc Coin is absent when `buildCost().mercCoins` is zero. Otherwise that literal build total is
  drawn as the last row of `MATERIALS`.
- Feature 002's `engineeringCost()` already rules the Mercenary purchase baseline, the fixed reward
  baseline, the baked effect and the cumulative climb. Feature 009 folds its per-module results and
  adds no classifier.
- `buildCost().materials` owns consolidation, order, symbols and quantities. The blueprint, type and
  unit counts are counted over package results.
- Reading order is the surface's, through the shared `sortMaterialLines` in
  `ui/outfitting/material-lines.ts` that feature 002's Engineer panel also calls: commonest
  rarity first, ties by active-locale name, ungraded last (ruling G). One comparator, because the
  two lists show the same materials for the same build.
- Material rarity comes from `materialRarity()`; names come from the package through feature 011's
  game-text presenter, which supplies the untranslated disclosure the whole application uses.
- The canvas's cross-origin rarity icons, `Mcr` abbreviation and unsemantic `div` controls remain
  replaced on constitutional grounds, exactly as feature 002 already replaced them.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines the projection: `CreditsView`, the optional
  `MaterialsView` and its rows, and the optional Merc Coin figure.
- [contracts/retail-and-merc-coin.md](./contracts/retail-and-merc-coin.md) freezes the retail and
  Mercenary transactions and currency separation.
- [contracts/engineering-materials.md](./contracts/engineering-materials.md) freezes consolidation
  through feature 002's boundary, the three ruled counts and the metadata rules.
- [contracts/assembly-requirements-and-targeting.md](./contracts/assembly-requirements-and-targeting.md)
  is **withdrawn** by ruling F and retained only as a record.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every FR to the two rail blocks.
- [design/cost-and-materials-detail.md](./design/cost-and-materials-detail.md) defines the rows,
  order, responsive composition and accessible semantics.
- [design/reference-review.md](./design/reference-review.md) records what the canvas draws and the
  six binding wave 10 rulings.
- [quickstart.md](./quickstart.md) provides runnable package, unit, responsive, localization,
  offline and accessibility validation.

## Post-Design Constitution Re-check

Phase 1 adds no server, persistence field, alternate build, private game data, local recipe formula,
cross-origin asset, hard-coded application string or screen-local visual literal.

Three application-owned counts remain where the original plan permitted none — blueprint count,
material-type count and unit total. Each counts package results, each is drawn by the canvas, and
each is ruled (D). Almanac 0.1.6 retired ruling A's temporary arithmetic by supplying `TOTAL`
directly. Constitution II is satisfied because the application does not price, rebuy, cost,
recognize or consolidate anything. Nothing else is derived.

Ruling F accepts a real cost: an unpriced module lowers the `modules` figure silently, and a recipe
the package cannot cost is silently absent from the list. This was surfaced with the ruling and
accepted. Constitution IV is therefore marked "PASS with ruled exception" above rather than plain
PASS, and the exception is not to be widened.

Any feature-owned or repository conformance statement uses the qualified form: WCAG 2.2 AA except
criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11. Neither automated nor manual evidence
may shorten that exclusion list.

## Complexity Tracking

No constitutional violation requires justification. The projector/store/presenter split the original
plan described is withdrawn: with one synchronous projection and one consumer it separated nothing.
One pure function and one component is the whole shape. Reusing feature 002's `engineeringCost()`
avoids a second fixed/Mercenary classifier.
