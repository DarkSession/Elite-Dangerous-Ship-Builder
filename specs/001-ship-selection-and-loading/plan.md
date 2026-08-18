# Implementation Plan: Ship Selection and Build Loading

**Branch**: `001-ship-selection-and-loading` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-ship-selection-and-loading/spec.md`

## Summary

Deliver an Almanac-backed hull catalogue and detail flow, explicit creation of stock builds, tab-owned working recovery, named local saves with conflict-safe multi-tab writes, and the existing versioned fragment codec as the canonical share-link boundary. Pure TypeScript domain services own catalogue ordering, lossless persisted representations, replacement policy, migrations and conflict decisions. Angular signal stores orchestrate those services; screens only render localized presentation models and dispatch intent. All runtime data remains in memory, same-origin static assets, `localStorage`, `sessionStorage` or the URL fragment.

Implementation of the shared design system, localization runtime and complete browser/accessibility harness defined by feature 011 is an architectural prerequisite. The SLEF fallback required when a link cannot represent a build integrates with feature 004. Feature 001 may define and test those boundaries, but cannot be declared complete until both integrations are present.

## Technical Context

**Language/Version**: TypeScript 6.0 in strict mode; HTML and SCSS; Node.js 24 per `.nvmrc` for tooling

**Primary Dependencies**: Angular 22.1 standalone and zoneless APIs, Angular Router, Angular service worker, RxJS 7.8, `@elite-dangerous-almanac/core` 0.1.2 leaf exports, Web Storage, Web Locks, BroadcastChannel, History and URL APIs

**Storage**: In-memory `ShipLoadout` state; versioned, independently keyed JSON records in `localStorage`; tab identity and catalogue session state in `sessionStorage`; build payload only in the URL fragment; no backend or IndexedDB

**Testing**: Vitest through Angular's unit-test builder with 80% minimum coverage; Node tests for codec-table generation; Playwright with `@axe-core/playwright` over desktop, tablet and mobile portrait/landscape projects in Chromium and Firefox

**Target Platform**: Modern evergreen browsers on desktop, tablet and mobile; installable/static client application capable of offline use after first load

**Project Type**: Client-side Angular single-page application producing static files only

**Performance Goals**: Search/filter/sort all 48 pinned hulls without perceptible delay; restore the working build before the workspace becomes interactive; coalesce autosaves without blocking interaction; retain the existing codec's sub-50 ms encode/decode target; import/export performance remains owned by feature 004

**Constraints**: No server, account, telemetry or cross-origin request; no game-data duplication or calculation; no page-level horizontal scrolling; 500-character codec value including `b.`; lossless storage of recognized modelled state after package-owned unknown-module normalization; no automatic working-record deletion; one dark tokenized theme; all application text translatable; WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: 48 hulls in the pinned Almanac release; four routes; 20 recoverable working records before explicit management is required; named records limited only by browser storage quota; codec tables generated from and pinned to each supported Almanac release

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1a–1d. The established dark/amber visual hierarchy and responsive composition are adopted through the shared design system, subject to the specification, Almanac and accessibility adaptations recorded in [design/reference-review.md](./design/reference-review.md).

## Constitution Check

_GATE: **BLOCKED after constitution 6.0.0 review** on
[Almanac #332](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/332), which requests
structured unknown-module empty/default normalization for every reconstruction path. Unknown hull
refusal is already available in 0.1.2. No local replacement implementation is permitted._

| Principle                               | Design evidence                                                                                                                                                             | Status             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| I. Client-Side Only                     | Static Angular output, same-origin assets and service-worker cache; build data exists only in browser storage or a fragment.                                                | PASS               |
| II. Almanac Source of Truth             | Hulls, facts, slots, defaults, artwork identity, validation and build construction use documented leaf imports; unknown-module normalization waits for its package release. | BLOCKED upstream   |
| III. Domain Logic Outside UI            | Pure domain services and injected platform ports precede signal stores and presentation-only components.                                                                    | PASS               |
| IV. Lossless, Honest Builds             | DTOs contain only resolved identities; unknown hulls refuse and package-owned unknown modules empty/default with transient feedback before activation.                      | PASS after release |
| V. Desktop, Tablet and Mobile           | Four fluid screen contracts cover touch, screen readers, 200% text, 400% zoom, portrait/landscape and reduced motion.                                                       | PASS               |
| VI. Commander's Language                | Runtime locale store, bundled English fallback, `Intl` formatting and an untranslated marker for package text are defined.                                                  | PASS               |
| VII. One Design System                  | Every screen composes shared `src/app/ui/` components and tokens; required additions and preview states are inventoried.                                                    | PASS               |
| VIII. Tested Before It Ships            | Unit, dual-engine multi-viewport E2E, automated accessibility and screen-reader-semantic scenarios are specified without reducing thresholds.                               | PASS               |
| IX. Specification Before Implementation | The accepted capability spec is mapped to plan-time screen definitions before task generation.                                                                              | PASS               |

There are no constitutional exceptions. Feature 011 must land first (or its complete shared foundational subset must be delivered as part of feature 001); bypassing it with local styles, strings or a partial test matrix is not an allowed shortcut.

## Project Structure

### Documentation (this feature)

```text
specs/001-ship-selection-and-loading/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── build-link.md
│   ├── persistence.md
│   └── routes-and-ui.md
└── design/
    ├── reference-review.md
    ├── screen-inventory.md
    ├── hull-catalogue.md
    ├── hull-detail.md
    ├── build-workspace.md
    └── build-library.md
```

`tasks.md` is Phase 2 output and is intentionally not created by this command.

### Source Code (repository root)

```text
src/app/
├── domain/
│   ├── build/
│   │   ├── build-snapshot.ts
│   │   ├── replacement-policy.ts
│   │   └── stored-build.ts
│   ├── build-link/                 # existing versioned codec and immutable tables
│   └── catalogue/
│       ├── catalogue-query.ts
│       └── hull-catalogue.ts
├── application/
│   ├── active-build/
│   ├── build-library/
│   ├── build-link/
│   └── catalogue/
├── platform/
│   ├── assets/
│   ├── browser/
│   └── storage/
├── i18n/                           # supplied by feature 011
├── ui/                             # supplied/extended through feature 011
└── features/
    ├── build-library/
    ├── build-workspace/
    ├── hull-detail/
    └── ship-catalogue/

public/
├── i18n/
└── manifest.webmanifest

e2e/
├── accessibility.ts
├── build-library.spec.ts
├── build-link.spec.ts
├── build-working-state.spec.ts
└── ship-catalogue.spec.ts

scripts/
├── build-link-codec-capacity.mjs
└── generate-build-link-codec-tables.mjs
```

**Structure Decision**: Keep one Angular application. Framework-agnostic domain objects and injected browser ports make persistence, URL and replacement behavior render-free; application signal stores coordinate them; route features consume presentation facades; reusable visual behavior lives only in `src/app/ui/`. Almanac illustrations are copied from the installed package by the Angular asset pipeline and are not duplicated in source.

At wide widths, the ship routes use the design's master-detail manifest and inspector rail; at narrow widths, the same detail route becomes a full-screen layer. The build-library route renders as a modal over the originating wide screen and as a full-screen view on narrow screens. These are responsive presentations of stable route/screen contracts, not separate capabilities or component implementations copied from `.design`.

## Phase 0: Research Conclusions

All technical unknowns are resolved in [research.md](./research.md). The decisive outcomes are:

- `SHIPS`, `getShipBySymbol`, `getShipSlots`/`enumerateSlots`, `getDefaultLoadout` and `ShipLoadout.default` are the authoritative catalogue/detail/creation APIs.
- A purpose-built `BuildSnapshotV1` preserves only recognized modelled state after package-owned
  unknown-module normalization; `ShipLoadout.toLoadoutEvent()` is not used wholesale because it adds
  derived fields and normalizes spelling.
- Each local record is an atomic, versioned `edsb:record:<uuid>` value. A 20-record working limit is enforced without eviction.
- A `sessionStorage` tab record plus BroadcastChannel collision negotiation prevents duplicated tabs from sharing one working record. Named saves use revision UUIDs and short Web Locks.
- Existing `b.` codec tables remain immutable. Initial and navigated fragments use one candidate-first replacement pipeline; edits use `history.replaceState`.
- Feature 011 supplies the shared token, localization and test foundations; feature 004 supplies the SLEF alternative.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines catalogue session state, active build provenance, lossless snapshots, stored records, conflicts, persistence status and fragment state transitions.
- [contracts/persistence.md](./contracts/persistence.md) freezes local key ownership, version/migration behavior, tab collision handling, retention, failure and conflict semantics.
- [contracts/build-link.md](./contracts/build-link.md) defines canonical URL shape, ingress/replacement, edit synchronization and refusal behavior around the existing codec.
- [contracts/routes-and-ui.md](./contracts/routes-and-ui.md) defines route-visible states, intent boundaries, localization, accessibility and design-system interfaces.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every FR to a plan-time screen; the adjacent design files define composition and states for each screen.
- [design/reference-review.md](./design/reference-review.md) records which parts of `.design/Ship Builder.dc.html` are adopted and which must change to satisfy the accepted specification and constitution.
- [quickstart.md](./quickstart.md) gives end-to-end validation scenarios and expected results.

## Post-Design Constitution Re-check

The Phase 1 artifacts introduce no server, private game catalogue, derived game calculation,
component-owned domain state, hard-coded display text, visual literal or silent fallback value.
Local notes and record identities are excluded explicitly from link/SLEF boundaries. Every mutation
that could replace work is candidate-first and confirmable; every persistence failure keeps the
active build usable. The design remains constitutionally sound, but implementation and task
generation for ingress, migration, persistence and link reconstruction remain **BLOCKED** until the
Almanac unknown-module normalization release is pinned and its structured outcomes are accepted.
