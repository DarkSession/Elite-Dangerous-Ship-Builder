# Implementation Plan: Module Outfitting and Engineering

**Branch**: `002-module-outfitting` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-module-outfitting/spec.md`

## Summary

Extend feature 001's single active-build boundary with package-authoritative slot inspection,
replacement candidates, ordinary and pre-engineered module fitting, engineering, power controls and
a session-only 100-decision undo/redo tape. Every Commander intent is evaluated against a detached
`ShipLoadout` candidate and committed atomically only after the Almanac accepts it. Candidate search
and ordering are pure presentation projections over `ShipLoadout.modulesForSlot()` plus
`getPreEngineeredVariants()`; calculations, compatibility, engineering state, costs and refusals stay
package-owned.

The `.design/Ship Builder.dc.html` canvases 1c and 1d define the responsive visual hierarchy: an
inline three-region outfitting workspace at wide widths and full-screen chooser/engineering layers at
narrow widths. They are adapted through feature 011's shared dark design system and localization
layer. Implementation is currently **blocked** on an Almanac release that can normalize every
supported partial engineering state and edit an experimental effect on a fixed reward without
destroying its hand-authored stats or identity. No application-side modifier rewrite is permitted.

## Technical Context

**Language/Version**: TypeScript 6.0 in strict mode; HTML and SCSS; Node.js 24 per `.nvmrc` for tooling

**Primary Dependencies**: Angular 22.1 standalone and zoneless APIs, Angular signals, RxJS 7.8,
`@elite-dangerous-almanac/core` 0.1.0-beta.12 leaf exports (upgrade required for the blockers below),
and feature 001's active-build/snapshot/replacement boundaries

**Storage**: Live `ShipLoadout` in memory; bounded edit history in memory only. Feature 001 continues
to own local persistence and fragments; history, selection, search and editor drafts never cross those
boundaries

**Testing**: Vitest through Angular's unit-test builder with 80% minimum coverage; Playwright with
`@axe-core/playwright` over desktop, tablet and mobile portrait/landscape projects in Chromium and
Firefox

**Target Platform**: Modern evergreen browsers on desktop, tablet and mobile; installable/static
client application usable offline after first load

**Project Type**: Client-side Angular single-page application producing static files only

**Performance Goals**: Search-to-render under 100 ms for the largest package candidate list; package
results refresh once per committed edit; one Commander decision commits as one observable revision;
undo/redo restores an exact snapshot without incremental drift

**Constraints**: No server, account, telemetry or cross-origin request; no application-owned fitting,
engineering, calculation or variant-recognition rule; no silent partial-quality retention; no page
horizontal scrolling; one dark tokenized theme; all application text translatable; touch-first
operation; WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: Every package slot on 48 pinned hulls; beta.12's largest observed chooser is 478
choices (470 stock records plus 8 package variants) for `PantherMkII` `Slot01_Size8`; 76 published
pre-engineered variants; at least the 100 most recent Commander decisions

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1c and 1d. Adopted and rejected details
are recorded in [design/reference-review.md](./design/reference-review.md).

## Constitution Check

_GATE: Passed for planning because the architecture waits for package truth and introduces no
constitutional exception. Implementation cannot begin until the two Almanac blockers are fixed and a
released package version is pinned. Re-check required after Phase 1 design and after that upgrade._

| Principle                               | Design evidence                                                                                                                                                                                        | Status                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| I. Client-Side Only                     | All editing, search and history run in-browser over installed package/static assets; no new persistence or network boundary.                                                                           | PASS                       |
| II. Almanac Source of Truth             | Slots, candidates, variants, mutations, costs, validation and calculations use leaf package APIs. Two missing lossless engineering operations are treated as upstream blockers, never app workarounds. | PASS; implementation gated |
| III. Domain Logic Outside UI            | Pure query, transaction, normalization, snapshot and history services precede the signal store; components receive immutable views and emit intents.                                                   | PASS                       |
| IV. Lossless, Honest Builds             | Detached candidate commits prevent partial edits; unavailable fields remain unavailable; fixed mounts and quality normalize before results/history. The latter awaits package support for every state. | PASS; implementation gated |
| V. Desktop, Tablet and Mobile           | Wide inline and narrow full-screen surfaces preserve every action for touch, screen reader, 200% text, 400% zoom, portrait and landscape.                                                              | PASS                       |
| VI. Commander's Language                | Package i18n leaf helpers provide game names where available; app labels and formatters use feature 011 localization with explicit untranslated fallback disclosure.                                   | PASS                       |
| VII. One Design System                  | Every surface composes feature 011 primitives/tokens; the HTML canvas supplies hierarchy only.                                                                                                         | PASS                       |
| VIII. Tested Before It Ships            | Domain tests plus dual-engine, multi-viewport Playwright and axe coverage are specified without lowering thresholds.                                                                                   | PASS, prerequisite 011     |
| IX. Specification Before Implementation | Every FR maps to a plan-time screen/surface before tasks are generated.                                                                                                                                | PASS                       |

Required upstream work:

1. [Almanac #291](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/291): add an operation that adds/replaces/removes an experimental effect on a re-engineerable
   fixed pre-engineered article while retaining its fixed modifiers and
   `FittedModule.preEngineeredVariant` identity.
2. [Almanac #292](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/292): add lossless package normalization for imported partial-quality engineering, including recognized
   fixed rewards with later effects and a structured outcome for unsupported identities.

The prospective missing-cargo validation case is tracked in
[Almanac #293](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/293), and the non-blocking
leaf type-export omission in
[Almanac #294](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/294).

The minimal reproductions and expected package contract are in [research.md](./research.md). Feature
002 must consume a released fix; editing raw engineering blocks or recomputing modifiers locally is
not an available fallback.

## Project Structure

### Documentation (this feature)

```text
specs/002-module-outfitting/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── edit-history.md
│   ├── module-catalogue.md
│   └── outfitting-editor.md
└── design/
    ├── reference-review.md
    ├── screen-inventory.md
    ├── outfitting-workspace.md
    ├── module-replacement.md
    └── engineering-editor.md
```

`tasks.md` is Phase 2 output and is intentionally not created by this command.

### Source Code (repository root)

```text
src/app/
├── domain/
│   ├── build/                         # feature 001 shared snapshot/reconstruction boundary
│   └── outfitting/
│       ├── build-edit-transaction.ts
│       ├── candidate-query.ts
│       ├── engineering-cost.ts
│       ├── fixed-mount-normalizer.ts
│       └── session-edit-history.ts
├── application/
│   ├── active-build/                  # feature 001; extended, never duplicated
│   └── outfitting/
│       ├── outfitting-presenter.ts
│       └── outfitting.store.ts
├── i18n/                              # supplied by feature 011
├── ui/                                # supplied/extended through feature 011
└── features/
    └── build-workspace/
        └── outfitting/
            ├── outfitting-workspace/
            ├── module-replacement/
            └── engineering-editor/

e2e/
├── accessibility.ts
├── module-engineering.spec.ts
├── module-outfitting.spec.ts
└── outfitting-history.spec.ts
```

**Structure Decision**: Keep one Angular application and one active build. Package-facing domain
adapters and pure query/history services are render-free; one application store coordinates selected
slot/editor state with the shared active build; route components render presentation models only.
All feature surfaces stay within `/build`. Wide layouts compose the chooser and engineering editor
inline; narrow layouts present the same states as full-screen layers without encoding edits or history
in browser navigation.

## Phase 0: Research Conclusions

All decisions, package probes, alternatives and blockers are recorded in
[research.md](./research.md). The decisive outcomes are:

- `ShipLoadout.slots()`, `fittedModules()`, `validation` and `modulesForSlot()` are the sole slot,
  fitted-state, removability and compatibility boundary.
- Each stock result expands with every package `getPreEngineeredVariants(symbol)` record. Stock fits
  call `setModule`; variant fits call `setPreEngineeredVariant`.
- Search uses a cached locale-folded projection of package display name, class, rating and mount;
  every whitespace term must match. Ordering changes presentation only.
- Fixed mounts are recognized from package `immovableReason` values, repaired from
  `getDefaultLoadout`, and reconstructed before any calculation because cargo hatch is immutable to
  editor operations.
- Every Commander edit is a detached snapshot transaction. Successful edits push one pre-edit
  checkpoint; failed/no-op edits do not. The tape retains 100 decisions and is reset on build
  replacement.
- Material lists come only from `getBlueprintCost`, `getBlueprintGradeCost`,
  `getExperimentalEffectCost` and `sumMaterials`; `null` remains unavailable and fixed reward
  engineering adds no craft cost.
- Beta.12 cannot meet the fixed-reward effect-only and universal partial-quality requirements. Those
  are release-blocking upstream API gaps.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines slot/fitted views, candidates, search indexes,
  engineering drafts/costs, normalization results, edit transactions and the bounded history tape.
- [contracts/module-catalogue.md](./contracts/module-catalogue.md) freezes exact candidate expansion,
  section/group order, multi-term search and acquisition/entitlement presentation.
- [contracts/outfitting-editor.md](./contracts/outfitting-editor.md) defines package reads and atomic
  fit/remove/engineering/power/normalization command outcomes.
- [contracts/edit-history.md](./contracts/edit-history.md) defines one-decision checkpoints,
  undo/redo/reset/exclusion rules and boundary isolation.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every requirement to a surface; the
  adjacent design files define wide/narrow composition and state coverage.
- [design/reference-review.md](./design/reference-review.md) records the accepted 1c/1d hierarchy and
  the package, scope, localization and accessibility adaptations.
- [quickstart.md](./quickstart.md) provides the end-to-end acceptance scenarios and upstream gate.

## Post-Design Constitution Re-check

Phase 1 introduces no server, private catalogue, alternate calculation, component-owned build,
persisted history, hard-coded display text or visual literal. Unresolved package values remain
visible; every mutation and restoration reconstructs through the package. Design-reference deltas and
direction arrows are omitted where no authoritative package result supplies them. All FRs have a
screen/surface owner and a dual-engine accessibility path.

The planning gate therefore remains **PASS** with no exception. Implementation remains **blocked
upstream** until a released Almanac API satisfies the two engineering cases above. After upgrading the
pinned package, rerun the minimal reproductions and the full constitution check before task generation
or implementation.

## Complexity Tracking

No constitutional exception is requested. The upstream block is intentionally not converted into an
application-side exception or workaround.
