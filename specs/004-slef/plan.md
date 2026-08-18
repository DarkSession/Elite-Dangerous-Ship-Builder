# Implementation Plan: SLEF Import and Export

**Branch**: `004-slef` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-slef/spec.md`

## Summary

Add a browser-only SLEF boundary around feature 001's single active `ShipLoadout`. Export asks the
Almanac for one SLEF entry with source-purchase credits, build-time application metadata and the
current build link when already publishable. Import rejects more than 64 KiB before parsing, gives
untouched text to `inspectSlef()`, accepts exactly one SLEF entry or bare journal `Loadout` event,
constructs and normalizes a detached candidate, then delegates the only state change to feature 001's
replacement coordinator. Browser delivery sits behind injected clipboard/download/share ports.

The `.design/Ship Builder.dc.html` layers establish the responsive hierarchy, but journal/Markdown
export, heuristic parsing and partial-roll retention are rejected. Almanac 0.1.1 supplies
`completeEngineeringGrade()` for structured 100%-quality normalization and `repairFixedMount()` for
package-owned immutable-mount repair with source-purchase semantics. The upstream gates are
satisfied.

## Technical Context

**Language/Version**: TypeScript 6.0 strict; HTML/SCSS; Node.js 24 tooling

**Primary Dependencies**: Angular 22.1 standalone/zoneless APIs, Angular signals, RxJS 7.8,
`@elite-dangerous-almanac/core` 0.1.1 leaf exports, feature 001 active-build/
replacement/build-link boundaries, and feature 011 design/localization/accessibility foundations

**Storage**: Drafts, artifacts and delivery status remain in memory. Accepted imports flow into
feature 001's tab-owned working record; feature 004 owns no storage key

**Testing**: Vitest through Angular's builder with 80% minimum coverage; Playwright and
`@axe-core/playwright` across desktop, tablet/mobile portrait/landscape in Chromium and Firefox

**Target Platform**: Modern evergreen desktop, tablet and mobile browsers; static/offline client app

**Project Type**: Client-side Angular single-page application producing static files only

**Performance Goals**: Reject oversized input before package parsing; import/export a fully fitted
39-slot reference hull with all supported modelled fields in under 500 ms; no network request

**Constraints**: Exactly one entry; 65,536 UTF-8 byte input limit; no server, telemetry, upload,
private parser, heuristic repair, app-owned calculation or retail fallback; failed import/cancel leaves
active and stored state untouched; one dark tokenized theme; translatable; touch-first; WCAG 2.2 AA
except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: One active build and one SLEF entry; 48 0.1.1 hulls; largest observed layouts are
39 slots (`Anaconda`, `Type9_Military`); input bounded at 64 KiB

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1a/1b provide shipyard import, canvas
1c provides wide workspace export, and canvas 1d provides narrow workspace import/export bottom
sheets. Reconciliation and the responsive escalation for constrained/zoomed viewports are in
[design/reference-review.md](./design/reference-review.md).

## Constitution Check

_GATE: Passed. Format/build behavior remains package-owned, 0.1.1 closes both normalization gaps and
no constitutional exception is proposed. The post-upgrade re-check is complete._

| Principle                               | Evidence                                                                                                                                            | Status                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| I. Client-Side Only                     | In-memory processing and user-triggered browser delivery make no request.                                                                           | PASS                   |
| II. Almanac Source of Truth             | Package inspection, construction, fixed-mount repair, quality normalization and serialization use released leaf APIs only.                          | PASS                   |
| III. Domain Logic Outside UI            | Pure coordinators and browser ports precede the signal store.                                                                                       | PASS                   |
| IV. Lossless, Honest Builds             | Candidate-first replacement, structured package outcomes, exact diagnostics/source credits and visible normalization prevent silent loss.           | PASS                   |
| V. Desktop, Tablet and Mobile           | Wide dialogs become narrow bottom sheets, escalating to full-height layers when space/zoom requires, with identical touch/screen-reader capability. | PASS                   |
| VI. Commander's Language                | App text uses feature 011; package diagnostics retain package ownership/disclosure.                                                                 | PASS                   |
| VII. One Design System                  | Screens compose feature 011 fields, notices, diagnostics, buttons and layers.                                                                       | PASS                   |
| VIII. Tested Before It Ships            | Dual-engine/multi-viewport unit, Playwright and axe coverage is specified.                                                                          | PASS, prerequisite 011 |
| IX. Specification Before Implementation | Every FR maps to a plan-time surface and contract.                                                                                                  | PASS                   |

Released upstream work consumed from 0.1.1:

1. [Almanac #292](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/292) ships
   `completeEngineeringGrade()` with structured refusal for unsupported state.
2. [Almanac #298](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/298) ships
   `repairFixedMount()` for exact hull-default repair and source-purchase invalidation.
3. [Almanac #293](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/293) makes
   construction restore a missing or unresolved cargo hatch from the known hull's package default.

## Project Structure

### Documentation (this feature)

```text
specs/004-slef/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── browser-delivery.md
│   ├── slef-export.md
│   ├── slef-import.md
│   └── routes-and-ui.md
└── design/
    ├── reference-review.md
    ├── screen-inventory.md
    ├── import-build.md
    └── export-build.md
```

`tasks.md` is Phase 2 output and is intentionally not created here.

### Source Code (repository root)

```text
src/app/
├── domain/
│   ├── build/fixed-mount-normalizer.ts
│   └── slef/
│       ├── slef-import.ts
│       └── slef-export.ts
├── application/
│   ├── active-build/                    # feature 001, reused
│   └── slef/
│       ├── slef-presenter.ts
│       └── slef.store.ts
├── platform/
│   ├── browser/
│   │   ├── clipboard.port.ts
│   │   ├── download.port.ts
│   │   └── share.port.ts
│   └── build/application-metadata.ts
├── i18n/                                # feature 011
├── ui/                                  # feature 011/shared extensions
└── features/slef/
    ├── import-build/
    └── export-build/

e2e/
├── accessibility.ts
├── slef-export.spec.ts
└── slef-import.spec.ts
```

Unit tests live beside sources. Keep one application and one active build. Package-facing services are
framework-agnostic; browser ports isolate DOM capability/side effects; one store owns only open layer,
draft, artifact and delivery status. The layers add no route/history entry. Import remains available
without a build; export requires the current active loadout.

## Phase 0: Research Conclusions

See [research.md](./research.md). Key decisions:

- Send raw text to `inspectSlef()`; measure UTF-8 bytes first and accept only one observed entry with
  zero diagnostics.
- Construct/normalize a detached candidate and commit only through feature 001's coordinator.
- Use `toSlefString()` with source credits, fitted order, sparse power state, build metadata and an
  optional already-published exact-revision link.
- Keep one immutable artifact for selectable text, download, clipboard and capability-gated share.
- Imported partial quality remains unchanged until the app deliberately calls
  `completeEngineeringGrade()`; supported states then normalize losslessly and unsupported states
  remain structured package outcomes.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md): drafts/results, diagnostics, normalization reports, candidates,
  artifacts and delivery state.
- [contracts/slef-import.md](./contracts/slef-import.md): size/cardinality/package/atomic pipeline.
- [contracts/slef-export.md](./contracts/slef-export.md): package options, source provenance and links.
- [contracts/browser-delivery.md](./contracts/browser-delivery.md): copy/download/share behavior.
- [contracts/routes-and-ui.md](./contracts/routes-and-ui.md): entry points, i18n, a11y and UI boundary.
- [design/screen-inventory.md](./design/screen-inventory.md) and adjacent design files: requirement
  mapping, responsive composition and reference reconciliation.
- [quickstart.md](./quickstart.md): acceptance/performance scenarios and released-API verification.

## Post-Design Constitution Re-check

Phase 1 introduces no server, private parser, alternate calculation, component-owned build, hidden
normalization, retail fallback, hard-coded display string or visual literal. Input cannot mutate active
state until a fully normalized candidate is accepted; export cannot be disabled by link or clipboard
failure. Every FR has a responsive surface and dual-engine accessibility path.

The gate remains **PASS with no exception**. Almanac 0.1.1 satisfies universal quality normalization
and immutable fixed-mount repair with source-purchase semantics. Re-run those regressions during task
generation and implementation.

## Complexity Tracking

No constitutional exception is requested. Released APIs replace the former upstream blocks;
application-side format, engineering, fixed-mount or purchase-provenance workarounds remain
prohibited.
