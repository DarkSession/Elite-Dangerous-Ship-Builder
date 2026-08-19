# Implementation Plan: Hull Anatomy and Mount Geometry

**Branch**: `010-hull-anatomy` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-hull-anatomy/spec.md` and the responsive visual
reference in `.design/Ship Builder.dc.html`

## Summary

Add Hull Anatomy to the shared `/build` workspace. The application copies the installed Almanac
top and bottom schematics into same-origin static output, loads each side lazily and independently,
validates the package's safe-inline SVG contract into an inert typed tree, and resolves only
`data-feature="hardpoint|utility_mount"` groups whose exact `data-journal-slot` belongs to the active
hull with the matching package slot kind.

One revision-stamped mount projection owns fitted, empty, engineered, focused, priority and current
power state for both hardpoints and utilities. Top/bottom occurrences reference that canonical item,
so a slot drawn twice remains one build identity. Geometry, the unique text equivalent and feature
002's complete ledger all target the same exact selected slot. Missing or invalid artwork never
blocks the ledger or editing.

The composition follows `.design/Ship Builder.dc.html` canvases 1c and 1d: paired labelled views at
wide widths, one labelled side selector when constrained, a concise legend, synchronized ledger and
nearby selected facts. The mock's coordinates, numbered nodes, false utility classification, game
values, cross-capability modes and inline visual literals are rejected.

## Technical Context

**Language/Version**: TypeScript 6.0.3 resolved in the current lockfile; Angular HTML and SCSS; Node
24 for tooling per `.nvmrc`. Constitution-required TypeScript `strict` and Angular
`strictTemplates` are not yet enabled and are an implementation prerequisite

**Primary Dependencies**: Angular 22.1 standalone/zoneless APIs and signals; RxJS 7.8;
`@elite-dangerous-almanac/core@0.1.3` leaf exports; feature 001's active build, workspace, asset
coordinator and service worker; feature 002's complete ledger and exact-slot selection; feature
003's settled deployed/retracted condition and revision; a generalized feature 005 located-mount
power observation; feature 011's tokens, components, localization and verification harness; feature
012's in-place help/provenance modal

**Storage**: None. Parsed schematics, side choice, scroll position, asset state and selection/reveal
state are memory-only. Build state remains feature 001-owned. Same-origin response caching belongs to
feature 001's one versioned Angular service worker

**Testing**: Vitest through Angular's unit-test builder with the existing 80% statement, branch,
function and line gates; Node installed-package/output asset audits; Playwright with
`@axe-core/playwright` over desktop, tablet portrait/landscape and mobile portrait/landscape in
Chromium and Firefox; production-build service-worker/offline validation; manual screen-reader,
200%-text and actual 400%-zoom protocols

**Target Platform**: Static client-side application for current Chromium and Firefox on desktop,
tablet and mobile; pointer and touch; portrait and landscape; previously opened schematics usable
offline

**Project Type**: One client-side Angular single-page application producing static files only

**Performance Goals**: Fetch only the active hull's two schematics; publish cached selection and
mount-state changes for the matching revision within feature 003's 100 ms mobile baseline; keep
native panning responsive; never delay the complete slot ledger or module editor for artwork

**Constraints**: No server, account, telemetry, cross-origin fetch, checked-in package SVG copy,
private geometry catalogue, coordinate measurement, slot-name inference, raw/trusted markup sink,
reimplemented power verdict or persisted anatomy state; no page horizontal scroll; one tokenized
dark theme; translatable owned text and locale formatting; shared 44 CSS-pixel target baseline;
WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: Almanac 0.1.3 has 48 hulls and 96 side schematics totalling 8,987,603 bytes. They
contain 240 hardpoint occurrences for 234 unique hardpoints and 195 utility occurrences for 195
unique utilities. Six hardpoints intentionally repeat across sides; future utility repeats are
allowed by the package contract. Counts are regression evidence, never runtime constants

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1c and 1d. Adopted hierarchy and every
required correction are recorded in [design/reference-review.md](./design/reference-review.md)

## Constitution Check

_GATE: Planning and direct Almanac anatomy contracts pass. Complete implementation is blocked on
the prerequisite contracts listed below; no application-side workaround is permitted. Re-checked
after Phase 1 with the same result._

| Principle                               | Design evidence                                                                                                                                            | Status                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| I. Client-Side Only                     | Installed SVGs become lazy same-origin static assets under feature 001's single service worker; build data never leaves the browser.                       | PASS; prerequisite 001 |
| II. Almanac Source of Truth             | Hull symbol, slot kinds/keys/sizes, both mount geometries, fitted/engineering facts and power inputs remain package-owned.                                 | PASS                   |
| III. Domain Logic Outside UI            | A pure mount projector joins typed asset annotations, exact slot views and owner power observations; components only render and emit intents.              | PASS                   |
| IV. Lossless, Honest Builds             | Unknown modules normalize before projection; missing geometry, unavailable priority/power and package defects remain explicit; the ledger stays complete.  | PASS                   |
| V. Desktop, Tablet and Mobile           | Paired/single-side compositions, bounded native pan, 44-pixel targets and a unique text equivalent cover touch, screen reader, zoom and both orientations. | PASS; prerequisite 011 |
| VI. Commander's Language                | Owned labels and state text use feature 011; package names use Almanac localization with explicit canonical/unavailable handling.                          | PASS; prerequisite 011 |
| VII. One Design System                  | Anatomy extends shared schematic, legend, selector, notice, detail and list primitives/tokens with full previews; no mock CSS is copied.                   | PASS; prerequisite 011 |
| VIII. Tested Before It Ships            | Package-wide contracts, dual-engine five-layout E2E, axe, offline production checks and manual assistive protocols are required without weakening gates.   | PASS; prerequisite 011 |
| IX. Specification Before Implementation | The clarified hardpoint-and-utility scope maps to every plan-time surface before tasks.                                                                    | PASS                   |

### Blocking and sequencing dependencies

1. **Feature 001** must provide one active `ShipLoadout`, build revision, no-build state, `/build`
   workspace, shared same-origin asset coordinator and one Angular service worker. Feature 010
   extends its copied/lazy asset patterns; it does not add a second cache.
2. **Feature 002** must provide the complete ledger, one generic `selectedSlotKey`/exact-slot intent
   and narrow slot surface; feature 010 does not recreate that editor boundary.
3. **Feature 003** must provide settled deployed/retracted state and the build/condition revision
   context used by current-power observations.
4. **Feature 005** must generalize `HardpointPowerObservationPort` to a located-mount port covering
   exact hardpoint and utility keys. Almanac `PowerBudget.consumers` already supports both; this is an
   application-contract correction, not an Almanac defect. Feature 005's Almanac gate is resolved in
   0.1.3; the shared strictness and application-contract prerequisites remain.
5. **Feature 011** must deliver strict configuration, one design system, localization/game-text
   presentation, announcements, component previews, ten Playwright projects and the axe harness.
6. **Feature 012** must deliver its planned in-place modal contract. Feature 010 emits its contextual
   provenance/help intent rather than owning legal content or targeting a route.

The current repository implements only the Angular shell and feature 001's build-link codec. These
dependencies are explicit sequencing gates, not unresolved planning questions. Almanac 0.1.3's
direct schematic and per-consumer power contracts are present and need no upstream anatomy fix.

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

`tasks.md` is Phase 2 output and is intentionally not created while implementation prerequisites
remain blocked.

### Source Code (repository root)

```text
src/app/
├── domain/
│   └── anatomy/
│       ├── anatomy-model.ts
│       └── anatomy-projector.ts
├── application/
│   └── anatomy/
│       ├── anatomy.presenter.ts
│       └── anatomy.store.ts
├── platform/
│   └── assets/
│       ├── almanac-schematic-loader.ts
│       └── schematic-svg-parser.ts
├── i18n/                                  # feature 011 messages/game-text presentation
├── ui/
│   └── hull-schematic/                    # typed renderer, side selector, legend and previews
└── features/
    └── build-workspace/
        └── hull-anatomy/

e2e/
├── accessibility.ts                       # feature 011 shared helper
├── hull-anatomy.spec.ts
└── schematic-offline.spec.ts

scripts/
└── check-almanac-schematics.mjs
```

Tests live beside source. `angular.json` copies the installed package schematic glob directly into
the build output; generated package SVGs are not committed under `public/`.

**Structure Decision**: Keep one Angular application, one active build and one selected slot. A
platform adapter loads and validates inert package SVG data; a framework-agnostic projector joins
exact annotations to immutable slot and power views; a signal store rejects stale hull/revision
results and coordinates side reveal; shared UI components render typed geometry and emit exact slot
intents. Feature 002 remains the editor/complete ledger owner, feature 005 remains the power-semantics
owner and feature 012 remains the provenance/legal owner.

## Phase 0: Research Conclusions

Detailed decisions, rationale and rejected alternatives are in [research.md](./research.md). The
decisive results are:

- Almanac 0.1.3 publicly contracts both `hardpoint` and `utility_mount` annotations, exact journal
  keys, complete coverage, cross-side duplicate identity and safe static inline SVG content.
- An exhaustive audit found all 429 current package mounts represented correctly by 435 occurrences,
  with no missing, wrong-kind, bad-key or same-side duplicate annotations.
- Schematics are copied from the installed package, fetched per hull/side, parsed into a strict inert
  `svg/g/path/circle` tree and cached only by feature 001's service worker.
- One package-ordered item per hardpoint or utility owns all state; top/bottom occurrences are
  references. Feature 002's ledger remains the complete fallback and navigation anchor.
- Feature 005 must broaden its owner projection to utilities. Raw `on`/`priority`, symbol patterns,
  consumer/band joins and application power formulas are not accepted substitutes.
- The `.design` hierarchy is retained, but its manually positioned/numbered nodes—including falsely
  relabelled utility nodes—are never implementation data.

No planning clarification remains.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines the revision-coherent anatomy lifecycle, independent side
  assets, inert SVG tree, canonical hardpoint/utility items, occurrences, selected facts, defect
  records and reveal state.
- [contracts/schematic-assets.md](./contracts/schematic-assets.md) freezes installed-package copy
  paths, same-origin loading, safe parsing, lazy caching, independent recovery and output audits.
- [contracts/anatomy-projection.md](./contracts/anatomy-projection.md) freezes exact-key/kind
  admission, one-to-many occurrence identity, package order and complete textual state.
- [contracts/slot-targeting.md](./contracts/slot-targeting.md) freezes shared selection, deterministic
  side reveal, generalized power observation, ledger fallback and modal provenance intents.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every requirement to the anatomy,
  selected facts, unique located-mount text equivalent, complete ledger, notices and provenance.
- [design/hull-anatomy.md](./design/hull-anatomy.md) defines wide/narrow information order,
  interaction, all states, responsive behavior and announcements.
- [design/reference-review.md](./design/reference-review.md) records the exact 1c/1d hierarchy retained
  and every mock-only or inaccessible detail rejected.
- [quickstart.md](./quickstart.md) provides runnable package, unit, output, E2E, offline, responsive
  and accessibility validation scenarios plus prerequisite gates.

## Post-Design Constitution Re-check

Phase 1 introduces no server, second build, persisted geometry, checked-in package art, coordinate
catalogue, inferred slot kind, reconstructed power verdict, raw-markup sink, hard-coded application
string or screen-local visual literal. Both mount kinds follow the same exact package identity and
state pipeline. Side failures and annotation defects remain visible while the unique text route and
complete ledger stay operable. Every requirement has a surface owner and a dual-engine responsive/
accessibility path.

The direct feature gate remains **PASS with no exception**. Complete implementation remains
**BLOCKED on features 001, 002, 003, 005, 011 and 012**, including the feature 005 utility-port
generalization and the shared strictness/test-infrastructure work above.

## Complexity Tracking

No constitutional exception is requested. The loader/parser/projector/store split is the minimum
boundary that keeps package files out of source, raw markup out of Angular sinks, geometry out of
domain identity, revision state out of components and power semantics in their owning feature.
