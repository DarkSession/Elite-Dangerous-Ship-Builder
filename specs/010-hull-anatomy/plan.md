# Implementation Plan: Hull Anatomy and Mount Geometry

**Branch**: `010-hull-anatomy` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-hull-anatomy/spec.md` and the responsive visual
reference in `.design/Ship Builder.dc.html`

## Summary

Add Hull Anatomy to the shared `/build` workspace. Two build-time scripts turn each installed Almanac
schematic into a rendering and a small mount extract; at run time the application fetches each side's
extract lazily and independently, and resolves only `data-feature="hardpoint|utility_mount"`
annotations whose exact `data-journal-slot` belongs to the active hull with the matching package slot
kind. The package SVG is never fetched, never served and never committed.

One projection owns kind, fitted, empty, engineered and selected state for both hardpoints and
utilities, derived from feature 002's slot views rather than snapshotted against a revision.
Top/bottom occurrences reference that canonical item, so a slot drawn twice remains one build
identity. Geometry and feature 002's complete ledger target the same one selected slot. Missing or
invalid artwork never blocks the ledger or editing.

The composition follows `.design/Ship Builder.dc.html` canvases 1c and 1d: the `HULL ANATOMY` rule
with its five-segment mode strip, paired labelled plates at wide widths, one plate and a `TOP`/
`BOTTOM` selector when constrained, and the legend. The mock's coordinates, its manually placed and
numbered nodes, its false utility classification, its game values and its inline visual literals are
rejected. Three surfaces the specification planned are not built, because the canvases do not draw
them: a second located-mount list, a selected-mount facts block and a provenance control
(design/hull-anatomy.md).

## Technical Context

**Language/Version**: TypeScript resolved by the lockfile; Angular HTML and SCSS; Node for tooling
per the repository configuration. Constitution-required TypeScript `strict` and Angular
`strictTemplates` are implementation prerequisites

**Primary Dependencies**: Angular standalone/zoneless APIs and signals; RxJS;
`@elite-dangerous-almanac/core` leaf exports; feature 001's active build, workspace, asset
coordinator and service-worker configuration extension for ship assets; feature 002's complete
ledger and exact-slot selection; feature 011's sole service-worker registration/base configuration,
tokens, components, localization and verification harness. Feature 003's condition revision and
feature 005's located-mount power observation are read by the `POWER` mode, which feature 005 owns
and this feature does not build; feature 012 owns provenance, and this feature publishes no control
that reaches it

**Storage**: None. Side choice, asset state and the shown side are memory-only; nothing scrolls or
pans, so there is no scroll position to hold either. Build state remains feature 001-owned.
Same-origin response caching belongs to feature 011's one versioned Angular service worker, through
feature 001's existing `/assets/ships/**` group; this feature changes no worker configuration

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
mount-state changes within feature 002's SC-002 100 ms mobile baseline; reserve each plate's box
before anything is fetched, so a late schematic never moves the bench; never delay the complete slot
ledger or module editor for artwork

**Constraints**: No server, account, telemetry, cross-origin fetch, checked-in package SVG copy,
private geometry catalogue, coordinate measurement, slot-name inference, raw/trusted markup sink,
reimplemented power verdict or persisted anatomy state; no page horizontal scroll; one tokenized
dark theme; translatable owned text and locale formatting; shared 44 CSS-pixel target baseline;
WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: Every hull, side schematic, hardpoint and utility mount supplied by the installed
package. Catalogue counts and asset sizes are discovered during the package audit and are never
application limits

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1c and 1d. Adopted hierarchy and every
required correction are recorded in [design/reference-review.md](./design/reference-review.md)

## Constitution Check

_GATE: Planning and direct Almanac anatomy contracts pass. Complete implementation is blocked on
the prerequisite contracts listed below; no application-side workaround is permitted. Re-checked
after Phase 1 with the same result._

| Principle                               | Design evidence                                                                                                                                                                                                                                                                                                                                            | Status                      |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| I. Client-Side Only                     | Installed SVGs become a rendering and a mount extract at build time, served as lazy same-origin static assets through feature 001's asset extension to feature 011's single service worker; build data stays local.                                                                                                                                        | PASS; prerequisites 001/011 |
| II. Almanac Source of Truth             | Hull symbol, slot kinds/keys/sizes, both mount geometries, fitted/engineering facts and power inputs remain package-owned.                                                                                                                                                                                                                                 | PASS                        |
| III. Domain Logic Outside UI            | A pure mount projector joins each side's extracted annotations to exact slot views; components only render and emit intents. Power observations belong to feature 005's mode over the same plates.                                                                                                                                                         | PASS                        |
| IV. Lossless, Honest Builds             | Only package-resolved modules reach projection; missing geometry, unavailable priority/power and package defects remain explicit; the ledger stays complete.                                                                                                                                                                                               | PASS                        |
| V. Desktop, Tablet and Mobile           | Paired and single-side compositions cover touch, screen reader, zoom and both orientations. Nothing pans; the marks take SC 2.5.8's Equivalent exception through feature 002's ledger, not a 44-pixel target of their own, and that ledger is the text equivalent (design/hull-anatomy.md, "Divergence from FR-012", "Divergence from FR-004 and SC-003"). | PASS; prerequisite 011      |
| VI. Commander's Language                | Owned labels and state text use feature 011; package names use Almanac localization with explicit canonical/unavailable handling.                                                                                                                                                                                                                          | PASS; prerequisite 011      |
| VII. One Design System                  | Anatomy adds one previewed component — the plate — and takes the segmented strip and the action button from feature 011. The legend is five rows in its own template; there is no notice, detail or list primitive, because none of those surfaces is drawn. No mock CSS is copied.                                                                        | PASS; prerequisite 011      |
| VIII. Tested Before It Ships            | Package-wide contracts, dual-engine five-layout E2E, axe, offline production checks and manual assistive protocols are required without weakening gates.                                                                                                                                                                                                   | PASS; prerequisite 011      |
| IX. Specification Before Implementation | The clarified hardpoint-and-utility scope maps to every plan-time surface before tasks.                                                                                                                                                                                                                                                                    | PASS                        |

### Blocking and sequencing dependencies

1. **Feature 001** must provide one active `ShipLoadout`, no-build state, the `/build` workspace and
   the ship-asset boundary — the `public/assets/ships/` output path and the lazy `/assets/ships/**`
   worker group that already covers it. Feature 010 writes two more files into that path and changes
   no configuration; it adds neither a registration nor a cache owner.
2. **Feature 002** must provide the complete ledger, one generic `selectedSlotKey`/exact-slot intent
   and narrow slot surface; feature 010 does not recreate that editor boundary.
3. **Feature 003** owns the settled deployed/retracted state and the condition revision. The
   `MOUNTS` mode reads neither, so this is a gate on feature 005's mode rather than on this one.
4. **Feature 005** owns the `POWER` mode over these same plates, and with it every priority and
   current-power reading. Feature 010 builds the `MOUNTS` mode only and consumes no power boundary,
   so no port is required for it to ship; the strip's other four segments are drawn disabled until
   their owning features land.
5. **Feature 011** must deliver strict configuration, the application's sole service-worker
   dependency/registration/base configuration, one design system, localization/game-text
   presentation, announcements, component previews, ten Playwright projects and the axe harness.
6. **Feature 012** owns provenance and where the application says what its data is made of. Neither
   canvas draws a provenance control on the anatomy, so feature 010 publishes none and this is not a
   gate on it shipping.

These dependencies are explicit sequencing gates, not unresolved planning questions. The installed
Almanac package's direct schematic and per-consumer power contracts need no upstream anatomy fix.

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

`tasks.md` is Phase 2 output and was created by `/speckit-tasks` once the prerequisites cleared.

### Source Code (repository root)

```text
src/app/
├── domain/
│   └── anatomy/
│       ├── almanac-anatomy-contract.spec.ts   # the installed package, characterized
│       ├── anatomy-model.ts
│       └── anatomy-projector.ts
├── application/
│   └── anatomy/
│       └── anatomy.store.ts
├── platform/
│   └── assets/
│       ├── almanac-schematic-loader.ts        # fetches and validates one side's extract
│       ├── schematic-mounts.ts                # the extract's own contract, at run time
│       └── schematic-svg-parser.ts            # the package's contract, at build time
├── i18n/                                      # feature 011 messages/game-text presentation
├── ui/
│   └── outfitting/
│       └── hull-schematic.*                   # one plate: the drawing and its marks
└── features/
    └── build-workspace/
        └── outfitting/
            └── hull-anatomy/                  # the region: heading, mode strip, plates, legend

e2e/
├── accessibility/                             # feature 011 shared helpers
├── hull-anatomy.spec.ts
└── schematic-offline.spec.ts

scripts/
├── convert-ship-artwork.mjs                   # renders each schematic to a PNG
├── extract-schematic-mounts.mts               # writes each side's mount extract
├── check-interface-foundations.mjs            # audits both against the pinned package
└── policy/
    └── anatomy-ownership.mjs
```

Tests live beside source. Two reproduction scripts write each installed schematic's rendering and
mount extract into `public/assets/ships/`, which the existing asset glob carries to the output; no
package SVG is committed under `public/` or `src/`.

**Structure Decision**: Keep one Angular application, one active build and one selected slot. A
platform adapter loads and validates each side's build-time mount extract; a framework-agnostic
projector joins exact annotations to immutable slot views; a signal store drops stale side results
and coordinates side reveal; shared UI components render typed geometry and select feature 002's one
slot key. Feature 002 remains the editor/complete ledger owner, feature 005 remains the
power-semantics owner and feature 012 remains the provenance owner.

## Phase 0: Research Conclusions

Detailed decisions, rationale and rejected alternatives are in [research.md](./research.md). The
decisive results are:

- The installed Almanac package contracts both `hardpoint` and `utility_mount` annotations, exact journal
  keys, complete coverage, cross-side duplicate identity and safe static inline SVG content.
- The exhaustive audit requires every installed package mount to be represented, with no missing,
  wrong-kind, bad-key or same-side duplicate annotations.
- Each installed schematic becomes a PNG and a mount extract at build time, in a strict inert
  `svg/g/path/circle` grammar checked where the extract is made; the extract is what the browser
  fetches per hull and side, cached only by feature 011's service worker through feature 001's
  ship-asset configuration extension.
- One package-ordered item per hardpoint or utility owns all state; top/bottom occurrences are
  references. Feature 002's ledger remains the complete fallback and navigation anchor.
- Power belongs to feature 005's mode over the same plates. Raw `on`/`priority`, symbol patterns,
  consumer/band joins and application power formulas are not accepted substitutes for it here or
  there.
- The `.design` hierarchy is retained, but its manually positioned/numbered nodes—including falsely
  relabelled utility nodes—are never implementation data.

No planning clarification remains.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines the store's two side lifecycles, the validated extract,
  canonical hardpoint/utility items, occurrences and the projection derived from them.
- [contracts/schematic-assets.md](./contracts/schematic-assets.md) freezes installed-package copy
  paths, same-origin loading, safe parsing, lazy caching, independent recovery and output audits.
- [contracts/anatomy-projection.md](./contracts/anatomy-projection.md) freezes exact-key/kind
  admission, one-to-many occurrence identity, package order and complete textual state.
- [contracts/slot-targeting.md](./contracts/slot-targeting.md) freezes shared selection, the bounded
  deterministic side reveal and the complete-ledger fallback.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every requirement to the anatomy,
  the mode strip, the legend and feature 002's complete ledger, and records the three planned
  surfaces the canvases do not draw.
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

The direct feature gate remains **PASS with no exception**. Implementation was unblocked by features
001, 002 and 011; features 003, 005 and 012 gate only the modes and surfaces this feature does not
build, and their segments ship disabled.

## Complexity Tracking

No constitutional exception is requested. The loader/parser/projector/store split is the minimum
boundary that keeps package files out of source, raw markup out of Angular sinks, geometry out of
domain identity, asset state out of components and power semantics in their owning feature.
