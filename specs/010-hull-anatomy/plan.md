# Implementation Plan: Hull Anatomy and Hardpoint Geometry

**Branch**: `010-hull-anatomy` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-hull-anatomy/spec.md`

## Summary

Add an Almanac-backed Hull Anatomy capability inside the existing `/build` workspace. The installed
package's top and bottom SVGs are copied directly into same-origin build assets, loaded and cached
only when requested, validated into an inert typed SVG tree and joined to the active loadout solely
by canonical `data-journal-slot` keys that resolve to package hardpoints. One immutable projection per
build/condition revision owns fitted, empty, engineered, selected and current power state; multiple
SVG occurrences reference that one slot identity. A package-ordered text equivalent and feature
002's complete slot ledger remain fully usable when either schematic is absent.

Implementation is **blocked** on a released Almanac contract for schematic annotations and safe
inline content ([#308](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/308)) and on the
authoritative per-module power projection already requested in
[#299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299). No application-side
annotation promise or power reconstruction is permitted.

## Technical Context

**Language/Version**: TypeScript 6.0 in strict mode; HTML and SCSS; Node.js 24 per `.nvmrc` for
tooling

**Primary Dependencies**: Angular 22.1 standalone and zoneless APIs, Angular signals, RxJS 7.8,
Angular service worker, `@elite-dangerous-almanac/core` 0.1.0-beta.12 leaf exports (upgrade required
for #308 and #299), feature 001's active-build/artwork boundary, feature 002's exact slot selection,
feature 003's viewing conditions, feature 005's power observation, feature 011's design/i18n/test
foundations and feature 012's provenance/help target

**Storage**: No anatomy or geometry persistence. Parsed assets and selection/reveal state are
memory-only; same-origin SVG response caching is owned by feature 001's versioned Angular service
worker. Build state remains owned by feature 001

**Testing**: Vitest through Angular's unit-test builder with 80% minimum coverage; installed-package
and generated-output asset contract tests; Playwright with `@axe-core/playwright` over desktop,
tablet and mobile portrait/landscape projects in Chromium and Firefox; production-build service
worker validation

**Target Platform**: Modern evergreen browsers on desktop, tablet and mobile; installable/static
client application usable offline after an asset's first successful load

**Project Type**: Client-side Angular single-page application producing static files only

**Performance Goals**: Never fetch all schematics eagerly; publish cached selection and fitted-state
changes for the matching revision within 100 ms on the shared mobile baseline; keep panning native
and responsive; schematic loading never delays the complete slot ledger or module editing

**Constraints**: No server, account, telemetry, cross-origin fetch, private SVG/geometry catalogue,
coordinate measurement, slot inference, unsafe SVG insertion or reconstructed module-power verdict;
no document horizontal scrolling; one dark tokenized theme; all application text translatable;
44 CSS-pixel target baseline; WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3,
2.4.7 and 2.4.11

**Scale/Scope**: 48 pinned hull symbols; 96 side schematics (about 8.8 MB total); 234 unique package
hardpoints represented by 240 SVG occurrences; six intentional cross-side repeats; 195 package
utility occurrences deliberately excluded from anatomy interaction

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1c and 1d. Their paired wide views,
narrow side selector, legend and selection relationship are adapted through feature 011; fabricated
coordinates, utility nodes, mock values and cross-capability overlays are rejected in
[design/reference-review.md](./design/reference-review.md).

## Constitution Check

_GATE: Passed for planning because unresolved package contracts remain upstream gates and no
constitutional exception is introduced. Re-check required after Phase 1 and after package upgrades._

| Principle                               | Design evidence                                                                                                                                                                    | Status                     |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| I. Client-Side Only                     | Installed SVGs become same-origin static assets and use feature 001's lazy versioned cache/retry path; no build data or asset request leaves the origin.                           | PASS                       |
| II. Almanac Source of Truth             | Hull symbols, slots, geometry annotations, fitted state and power facts stay package-owned. Missing annotation and power contracts are #308/#299 gates, never local rules.         | PASS; implementation gated |
| III. Domain Logic Outside UI            | A pure projector joins validated annotations, one revision context and shared power observations; components render a typed inert tree and emit exact-slot intents.                | PASS                       |
| IV. Lossless, Honest Builds             | Missing/unresolved SVG annotations and unavailable module facts remain explicit; schema or fetch failure removes no slot and fabricates no geometry/value.                         | PASS                       |
| V. Desktop, Tablet and Mobile           | Paired/side-selected views, bounded native panning, 44-pixel geometry-derived hit areas and a complete text equivalent preserve touch/screen-reader/zoom use in both orientations. | PASS                       |
| VI. Commander's Language                | App labels use feature 011; module names use Almanac localization with disclosed canonical fallback; identifiers and unavailable states are never translated guesses.              | PASS                       |
| VII. One Design System                  | SVG state styling, hit width, layout, notices, tabs, details and list controls use shared components/tokens; package artwork is never restyled with local literals.                | PASS                       |
| VIII. Tested Before It Ships            | Package-contract, pure projection, dual-engine multi-viewport, production-cache and automated/manual accessibility scenarios are specified without threshold or matrix reduction.  | PASS, prerequisite 011     |
| IX. Specification Before Implementation | The complete capability and fallback surfaces map to FR-001–FR-012 in `design/` before task generation.                                                                            | PASS                       |

Required upstream and project work:

1. [Almanac #308](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/308) must publish and
   test the supported asset path, annotation, duplicate and inline-content contract.
2. [Almanac #299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299) must provide the
   per-module projection consumed by feature 005; feature 010 consumes feature 005's resulting
   current-power observation rather than reconstructing it.
3. Features 001, 002, 003, 005, 011 and 012 must supply the shared active revision, complete ledger
   and selection, viewing conditions, power observation, design/i18n/test system and provenance
   target. Feature 002's own #291/#292 gates are therefore transitive prerequisites.

No planning clarification marker remains. These are explicit implementation dependencies, not
ambiguities that permit assumptions.

## Project Structure

### Documentation (this feature)

```text
specs/010-hull-anatomy/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── schematic-assets.md
│   ├── anatomy-projection.md
│   └── slot-targeting.md
└── design/
    ├── screen-inventory.md
    ├── hull-anatomy.md
    └── reference-review.md
```

`tasks.md` is Phase 2 output and is intentionally not created by this command.

### Source Code (repository root)

```text
src/app/
├── domain/
│   └── anatomy/
│       ├── anatomy-projector.ts
│       └── anatomy-snapshot.ts
├── application/
│   └── anatomy/
│       ├── anatomy.presenter.ts
│       └── anatomy.store.ts
├── platform/
│   └── assets/
│       ├── almanac-schematic-loader.ts
│       └── safe-svg-parser.ts
├── i18n/                              # feature 011 messages/formatters
├── ui/
│   └── hull-schematic/                 # inert SVG renderer and shared previews
└── features/
    └── build-workspace/
        └── hull-anatomy/

e2e/
├── accessibility.ts
├── hull-anatomy.spec.ts
└── schematic-offline.spec.ts

scripts/
└── check-almanac-schematics.mjs
```

No package SVG is checked into `public/`. `angular.json` copies the installed package glob directly
to the output, while feature 001's service-worker configuration owns the versioned lazy asset group.

**Structure Decision**: Keep one Angular application, one active build and one selected-slot
identity. A platform adapter fetches and validates inert asset data; a framework-agnostic projector
joins annotations to one revision; a signal store coordinates current hull, side and selection; the
shared renderer receives immutable typed nodes and emits exact slot keys. Feature 002 remains the
only editor and complete slot ledger, feature 005 remains the only current-power presenter, and
feature 012 remains the only owner of legal content.

## Phase 0: Research Conclusions

All decisions, alternatives, audit evidence and blockers are recorded in
[research.md](./research.md). The decisive outcomes are:

- Beta.12 ships exactly three SVGs for each of 48 hull symbols. All 234 hardpoints resolve from 240
  annotated instances; six slots intentionally occur on both views and no side repeats a slot.
- The factual spec prose was corrected: the files also annotate all 195 utility slots. FR-002 still
  admits only annotations whose feature is `hardpoint` and whose canonical resolved slot kind is
  `hardpoint`; spelling such as `TinyHardpoint` is never classified locally.
- The package documents filenames but not annotation/safety/duplicate promises. #308 blocks inline
  consumption until a released public contract is available.
- Assets are copied from `node_modules`, loaded per active hull and lazily cached by feature 001's
  Angular service worker. Top and bottom fail/retry independently and never gate outfitting.
- Runtime SVG becomes a strictly validated inert typed tree rendered through Angular templates; no
  raw HTML sink, trusted-markup bypass, active document or foreign resource is allowed.
- Each slot owns one state object; side occurrences only reference it. The text equivalent follows
  `slots('hardpoint')`, not SVG order, ids, labels or coordinates.
- Exact geometry clones with a non-scaling tokenized hit stroke provide large targets without
  measuring or moving package geometry. Native internal scrolling provides pan; the canonical list
  remains a separate route to every hardpoint.
- FR-008's supplied/shed state comes through feature 005 after #299. Raw `on`/`priority` is not
  silently promoted into a complete power verdict.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines the revision-coherent anatomy snapshot, independent side
  asset states, inert SVG nodes, canonical hardpoint items, occurrences, power observations, package
  defect records and reveal state.
- [contracts/schematic-assets.md](./contracts/schematic-assets.md) freezes copy paths, same-origin
  loading, safe parsing, lazy caching, retry and installed-package/output verification.
- [contracts/anatomy-projection.md](./contracts/anatomy-projection.md) freezes exact-key resolution,
  hardpoint-only admission, unique-slot/duplicate rules, package order and complete text state.
- [contracts/slot-targeting.md](./contracts/slot-targeting.md) freezes feature 002 selection,
  deterministic side reveal, power observation, fallback and provenance intents.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every requirement to the anatomy,
  canonical list, selected detail, complete ledger, notices and provenance target.
- [design/hull-anatomy.md](./design/hull-anatomy.md) defines wide/narrow composition, information
  order, target behavior, every state and announcements.
- [design/reference-review.md](./design/reference-review.md) records which 1c/1d hierarchy survives
  and which unsupported mock details are rejected.
- [quickstart.md](./quickstart.md) provides runnable upstream, package, unit, end-to-end, offline,
  responsive and accessibility validation scenarios.

## Post-Design Constitution Re-check

Phase 1 introduces no server, second build, persisted geometry, private asset copy, local slot map,
measured coordinate, reconstructed power state, unsafe markup sink, hard-coded application string or
visual literal. SVG load/schema failures and unmatched keys remain visible package defects while the
complete slot ledger stays usable. Utility annotations are deliberately excluded by semantic package
kind, not name heuristics. Every FR has a surface owner and dual-engine responsive/accessibility path.

The planning gate remains **PASS with no exception**. Implementation remains **blocked upstream** by
Almanac #308 and #299 and sequenced behind features 001, 002, 003, 005, 011 and 012. After released
fixes and prerequisites land, rerun the package audit, verify the generated service-worker manifest,
re-evaluate this constitution table and only then generate or refresh tasks.

## Complexity Tracking

No constitutional exception is requested. The loader/parser/projector/store split is the minimum
structure that keeps untrusted markup out of templates, package geometry out of source, revision
state out of components and slot identity shared with outfitting. Upstream gaps remain gates rather
than application-owned contracts.
