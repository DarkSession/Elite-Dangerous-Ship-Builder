# Implementation Plan: Ship Selection and Build Loading

**Branch**: `001-ship-selection-and-loading` | **Date**: 2026-08-17 | **Revised**: 2026-08-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-ship-selection-and-loading/spec.md`

## Summary

Deliver an Almanac-backed hull catalogue and detail flow, explicit creation of stock builds, a stored record for every build a Commander works on, named local saves with conflict-safe multi-tab writes, and the existing versioned fragment codec as the canonical share-link boundary. Pure TypeScript domain services own catalogue ordering, lossless persisted representations, the record lifecycle and its expiry, migrations and conflict decisions. Angular signal stores orchestrate those services; screens only render localized presentation models and dispatch intent. All runtime data remains in memory, same-origin static assets, `localStorage`, `sessionStorage` or the URL fragment.

Implementation of the shared design system, localization runtime and complete browser/accessibility harness defined by feature 011 is an architectural prerequisite. The SLEF fallback required when a link cannot represent a build integrates with feature 004. Feature 001 may define and test those boundaries, but cannot be declared complete until both integrations are present.

## Technical Context

_Revised 2026-08-25. The record model changed under three Commander rulings and a five-question
clarification session; the statements below are current, and what they replaced is recorded in
[Revision 2026-08-25](#revision-2026-08-25-a-record-for-every-build-and-a-clock-that-ends-it)._

**Language/Version**: TypeScript in strict mode; HTML and SCSS; Node.js per the repository tooling configuration

**Primary Dependencies**: Angular standalone and zoneless APIs, Angular Router, Angular service worker, RxJS, `@elite-dangerous-almanac/core` leaf exports, Web Storage, Web Locks, BroadcastChannel, History, URL and `Intl.RelativeTimeFormat` APIs, each reached through an injected port

**Storage**: In-memory `ShipLoadout` state; versioned, independently keyed JSON records in `localStorage`; tab identity and catalogue session state in `sessionStorage`; build payload only in the URL fragment; no backend or IndexedDB

**Testing**: Vitest through Angular's unit-test builder with 80% minimum coverage; Node tests for codec-table generation; Playwright with `@axe-core/playwright` over desktop, tablet and mobile portrait/landscape projects in Chromium and Firefox

**Target Platform**: Modern evergreen browsers on desktop, tablet and mobile; installable/static client application capable of offline use after first load

**Project Type**: Client-side Angular single-page application producing static files only

**Performance Goals**: Search/filter/sort the complete installed hull catalogue without perceptible delay; restore the working build before the workspace becomes interactive; coalesce autosaves without blocking interaction; retain the existing codec's sub-50 ms encode/decode target; import/export performance remains owned by feature 004

**Constraints**: No server, account, telemetry or cross-origin request; no game-data duplication or calculation; no page-level horizontal scrolling; 500-character codec value including `b.`; lossless storage of recognized modelled state after package reconstruction; unnamed records expire seven days after last modification and nothing else removes a record but a confirmed deletion or the manual save that consumes it; autosave never writes to a named record; one dark tokenized theme; all application text translatable; WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: The complete installed hull catalogue; four routes; no count limit on stored records, with unnamed ones bounded by a seven-day life and named ones by the browser storage quota alone; codec tables generated from each supported Almanac release

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1a–1d. The established dark/amber visual hierarchy and responsive composition are adopted through the shared design system, subject to the specification, Almanac and accessibility adaptations recorded in [design/reference-review.md](./design/reference-review.md).

## Constitution Check

_GATE: **PASS with no exception**. The package refuses an unknown hull and returns every fixed mount
populated on every reconstruction path. Unsupported module compatibility is out of scope and no
local replacement implementation is permitted._

| Principle                               | Design evidence                                                                                                                               | Status |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| I. Client-Side Only                     | Static Angular output, same-origin assets and service-worker cache; build data exists only in browser storage or a fragment.                  | PASS   |
| II. Almanac Source of Truth             | Hulls, facts, slots, defaults, artwork identity, validation and build construction all use documented leaf imports.                           | PASS   |
| III. Domain Logic Outside UI            | Pure domain services and injected platform ports precede signal stores and presentation-only components.                                      | PASS   |
| IV. Lossless, Honest Builds             | DTOs contain only resolved identities; unknown hulls refuse and package construction always populates fixed mounts before activation.         | PASS   |
| V. Desktop, Tablet and Mobile           | Four fluid screen contracts cover touch, screen readers, 200% text, 400% zoom, portrait/landscape and reduced motion.                         | PASS   |
| VI. Commander's Language                | Runtime locale store, bundled English fallback, `Intl` formatting and an untranslated marker for package text are defined.                    | PASS   |
| VII. One Design System                  | Every screen composes shared `src/app/ui/` components and tokens; required additions and preview states are inventoried.                      | PASS   |
| VIII. Tested Before It Ships            | Unit, dual-engine multi-viewport E2E, automated accessibility and screen-reader-semantic scenarios are specified without reducing thresholds. | PASS   |
| IX. Specification Before Implementation | The accepted capability spec is mapped to plan-time screen definitions before task generation.                                                | PASS   |

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
│   │   ├── replacement-policy.ts   # withdrawn 2026-08-25 with the confirmation
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
- A purpose-built `BuildSnapshotV1` preserves only recognized modelled state after package
  reconstruction; `ShipLoadout.toLoadoutEvent()` is not used wholesale because it adds
  derived fields and normalizes spelling.
- Each local record is an atomic, versioned `edsb:record:<uuid>` value. A 20-record working limit is enforced without eviction. _(Superseded 2026-08-25: the count limit is withdrawn for a seven-day expiry. `research.md` is left as it was written, being a dated record of what was decided at the time.)_
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
that could replace work is candidate-first, and since 2026-08-25 none of them needs confirming
because none of them loses anything; every persistence failure keeps the active build usable. The design remains constitutionally sound, and ingress, migration, persistence
and link reconstruction all rest on package reconstruction and validation results.

## Revision 2026-08-25: a record for every build, and a clock that ends it

Three Commander rulings and a five-question clarification session changed what this feature does with
storage. `spec.md` FR-008 to FR-013 carry the behaviour; this section carries the plan-level
consequences, and the statements above that they falsified are corrected in place rather than left
standing (constitution IX).

**What changed.** Autosave moved from one record per tab to one record per build, and never writes to
a named record. Opening a saved build writes nothing; its first modelled edit forks an unnamed
record. A manual save consumes the unnamed record it saved from. The twenty-record count limit and
its management dialog are withdrawn for a seven-day expiry that a name stops. The replacement
confirmation is withdrawn from every ingress path.

**What that costs the design.** Three things this plan did not previously need:

- **A clock port.** The deadline is `modifiedAt` plus seven days, derived at read time rather than
  stored. Under principle VIII the sweep has to be testable without waiting seven days, and under
  principle III a service may not read the wall clock directly. `src/app/platform/browser/clock.adapter.ts`
  joins the injected ports, and `AutosaveService.now` — today a public mutable field a test assigns —
  is replaced by it, so the one place that stamps time and the one that reads it share a seam.
- **A sweep with a defined place to run.** At application start and on every listing read, never on a
  timer: a row removed under a Commander reading the library is the one removal this design cannot
  make visible. It is not a background task and owns no scheduler.
- **A relative-time formatter.** The remaining life on a row is locale-formatted under principle VI,
  which means `Intl.RelativeTimeFormat` through the existing formatter layer rather than a count of
  days assembled in a template.

**What it removes.** `src/app/domain/build/replacement-policy.ts` and the `ReplacementConfirmer` seam
go with the confirmation, the `retention-limit` persistence status goes with the count limit it
reported, and the coordinator is renamed for what it now does: construct, commit once, notify.

### Constitution re-check

_GATE: **PASS with no exception.** Removing a Commander's stored work without their pressing anything
is new to this feature and is the only clause worth arguing, so it is argued rather than asserted._

| Principle                               | Evidence after the change                                                                                                                                                                                                                                                                                                                                                                                                                 | Status |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| I. Client-Side Only                     | Expiry is a local sweep over owned keys. Nothing is uploaded, nothing is requested and no further origin is contacted.                                                                                                                                                                                                                                                                                                                    | PASS   |
| II. Almanac Source of Truth             | Untouched. The sweep reads no game data and changes no calculation.                                                                                                                                                                                                                                                                                                                                                                       | PASS   |
| III. Domain Logic Outside UI            | The deadline rule and the sweep are application services behind the storage and clock ports; the library renders the remaining life it is handed.                                                                                                                                                                                                                                                                                         | PASS   |
| IV. Lossless, Honest Builds             | Principle IV binds what a build carries through import, edit and export, not how long a record is kept. Expiry invents no value, hides no diagnostic and leaves nothing half-written: a record is whole or absent. The honesty it does owe is paid before the removal rather than after — FR-010 puts the remaining life on the entry while a name can still stop it — and no named record and no record a live page holds is ever swept. | PASS   |
| V. Desktop, Tablet and Mobile           | The remaining life is text in a row and inherits that row's contrast, target and reader obligations. It is never the only thing distinguishing one record from another.                                                                                                                                                                                                                                                                   | PASS   |
| VI. Commander's Language                | The remaining life is formatted with `Intl.RelativeTimeFormat` through the formatter layer; no English count of days reaches a template.                                                                                                                                                                                                                                                                                                  | PASS   |
| VII. One Design System                  | The countdown, the expiring row and the derived title compose existing components and tokens and join the preview manifest with the other new states.                                                                                                                                                                                                                                                                                     | PASS   |
| VIII. Tested Before It Ships            | The clock port turns the seven-day boundary into a unit test rather than a wait, and the end-to-end suite seeds record ages through the storage port. Six, seven and eight days are three assertions, not three weeks.                                                                                                                                                                                                                    | PASS   |
| IX. Specification Before Implementation | The spec was revised and clarified first; this plan follows it, and every artifact it names was updated with it.                                                                                                                                                                                                                                                                                                                          | PASS   |

## Complexity Tracking

No constitutional violation requires justification. The versioned URL codec is application-owned
presentation of package identities rather than a second catalogue: it encodes and decodes
`symbol`/slot-key identities and supplies no game fact or calculation. The injected browser ports
(storage, history, BroadcastChannel, Web Locks, connectivity, lifecycle, UUID and, from 2026-08-25,
the clock) are the minimum boundary that keeps persistence and link behaviour render-free and
testable under principle III; each wraps one browser API and adds no rule of its own.

The expiry sweep is the only behaviour in this feature that removes a Commander's work without their
pressing anything, so it is deliberately the narrowest thing that can do that job: two call sites,
two exclusions evaluated at the moment it runs, no timer, no scheduler and no state of its own beyond
the deadline it derives from `modifiedAt`. The candidate-first ingress coordinator — `ReplacementCoordinator` until the confirmation it was
named for was withdrawn on 2026-08-25 — exists so that one commit path serves stock creation, record
open, link load and SLEF import: a single boundary rather than four, and the reason no ingress path
can half-replace active work. The
fixed-mount invariant in `reconstructFromSnapshot` consumes the package-returned defaults and is
composed by feature 002's shared ingress pipeline rather than duplicated in it.
