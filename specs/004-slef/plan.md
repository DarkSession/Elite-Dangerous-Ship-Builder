# Implementation Plan: SLEF Import and Export

**Branch**: `004-slef` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-slef/spec.md`; visual reference from
`.design/Ship Builder.dc.html`

## Summary

Add one browser-only SLEF interchange boundary around feature 001's active `ShipLoadout`. Import
keeps the Commander's exact text, rejects over-64-KiB and whitespace-only drafts before package work,
passes the untouched string to Almanac `inspectSlef()`, accepts exactly one observed entry, and then
runs the shared feature 002 ingress normalizer on a detached `ShipLoadout`. Partial-quality
engineering is resolved and completed before any fixed-mount repair so a package construction repair
cannot hide an unsupported partial roll. Feature 001's replacement coordinator is the only commit
point.

Export asks the active `ShipLoadout` for one current-catalogue-retail SLEF entry, captures the exact
string as an immutable active-revision artifact, and gives that same artifact to selectable text,
download, async clipboard and capability-gated Web Share adapters. Historical purchase values and
captured module-health snapshots are not application state. Package-derived engineered module
integrity remains part of the current build. Invalid or incomplete builds remain exportable after
package validation is disclosed. An unavailable or refused feature 001 link only omits the optional
SLEF `appURL`.

The `.design` import/export hierarchy is retained: focused wide dialogs, ordinary narrow bottom
sheets, monospaced payload fields and a clear action hierarchy. Its fixed widths, mock parser,
immediate mutation, fake delivery feedback, partial-roll retention, reduced mobile actions and
journal/Markdown modes are replaced by the accepted spec, package behavior and feature 011 shared
components. Short landscape, expanded/RTL text and zoom can promote a sheet to a full-height layer
without changing capability.

## Technical Context

**Language/Version**: TypeScript 6.0, Angular HTML and SCSS; Node.js 24.18.0 in the current reference
environment. Full TypeScript and Angular template strictness is a feature 011 prerequisite because
the current root configuration does not yet enable both

**Primary Dependencies**: Angular 22.1 standalone/zoneless APIs and signals; RxJS 7.8; currently
verified `@elite-dangerous-almanac/core` 0.1.2 leaf imports from `ships/slef`,
`ships/ship-loadout`, `ships/modules` and `i18n/diagnostics`; feature 001
active-build/replacement/link/persistence boundaries; feature 002 shared
build-ingress normalizer; feature 011 localization, announcements, shared UI and browser-test
foundations

**Storage**: Draft, candidate, export artifact and delivery status are session memory only. Accepted
imports become feature 001 tab-owned working records. Fixed-mount normalization provenance follows
feature 001 local-record metadata, which also records the accepted revision's `valid`/`complete`
booleans; detailed quality/issues/refusal/delivery state is never persisted. Feature 004 owns no
storage key

**Testing**: Vitest through Angular's unit-test builder with the existing 80% statement, branch,
function and line thresholds; Playwright 1.62 plus planned `@axe-core/playwright` over desktop,
tablet portrait/landscape and mobile portrait/landscape in Chromium and Firefox; package-generated
fixtures plus a hashed reference-export corpus and recorded Coriolis/EDSY acceptance protocol

**Target Platform**: Modern evergreen desktop, tablet and mobile browsers; pointer, touch and screen
reader; portrait and landscape; static same-origin deployment usable offline after first load

**Project Type**: Client-side Angular single-page application producing static files only

**Performance Goals**: Reject oversized input before package inspection; import and export the
package-discovered maximum-slot, fully fitted/all-supported-fields fixture in under 500 ms each;
generate/deliver without an application network request

**Constraints**: Exactly one observed entry; 65,536 original UTF-8 bytes maximum; no private parser,
schema, game-data copy, calculation, default-module lookup or historical-price retention; no server,
telemetry or automatic payload transmission; failed/cancelled/superseded import leaves active,
stored, URL and history state unchanged; one tokenized dark theme; all app text translatable; WCAG
2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: One draft, one candidate and one active-revision export artifact at a time; one
accepted SLEF entry; package catalogue size/maximum-slot fixture discovered at test runtime rather
than copied into application data; two route-preserving capability layers plus host/result states

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1a/1b supply wide/narrow shipyard
import, 1c supplies the wide workspace export hierarchy, and 1d supplies narrow workspace
import/export sheets and action-menu entry. Exact adoption and departures are recorded in
[design/reference-review.md](./design/reference-review.md).

## Constitution Check

_GATE: PASS after clarification. Captured per-module `Health` is outside application behavior whether
the package retains or omits it, while engineered module integrity remains package-derived build
state. Default package export supplies current catalogue-retail credits. No local field rewrite or
package exception is required._

| Principle                               | Design evidence                                                                                                                                                                     | Status                     |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| I. Client-Side Only                     | Inspection, normalization, serialization and delivery use installed code, memory and explicit browser APIs; unexpected requests fail tests.                                         | PASS                       |
| II. Almanac Source of Truth             | All format/game behavior stays on leaf APIs; package output is not rewritten, and integrity remains derived from the fitted package configuration.                                  | PASS                       |
| III. Domain Logic Outside UI            | Pure import/export coordinators and injected ports precede signal stores; components render immutable views and emit intent.                                                        | PASS                       |
| IV. Lossless, Honest Builds             | Atomic normalization preserves every modelled field; historical prices and condition snapshots are explicitly outside the model.                                                    | PASS                       |
| V. Desktop, Tablet and Mobile           | Identical capability reflows among dialog, sheet and full-height layer; touch, screen reader, zoom, orientation, RTL/expansion, reduced motion and no-overflow checks are required. | PASS; 011 prerequisite     |
| VI. Commander's Language                | Application framing uses feature 011; package diagnostics use `getSlefDiagnosticMessage` with the standard canonical-language disclosure on locale miss.                            | PASS; 011 prerequisite     |
| VII. One Design System                  | Every layer, notice, diagnostic, field, action and status composes or extends `src/app/ui/` and receives complete responsive state previews.                                        | PASS; 011 prerequisite     |
| VIII. Tested Before It Ships            | Unit/contract tests, ten Chromium/Firefox viewport-orientation projects, axe and manual screen-reader/zoom scripts are specified without weakening coverage.                        | PASS; harness prerequisite |
| IX. Specification Before Implementation | Every FR maps to a named plan-time surface/state; the clarified price, health-snapshot and integrity boundaries are explicit.                                                       | PASS                       |

Almanac 0.1.2 supplies the feature-specific package operations requested by
[#292](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/292),
[#293](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/293) and
[#298](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/298). Feature 004 constructs a
fresh detached import candidate and reuses feature 002's accepted ingress ordering and outcomes.
Neither captured purchase provenance nor per-module condition snapshots create an upstream gate.

## Delivery Prerequisites

The source tree currently contains only the application shell and build-link codec. Feature 004
implementation depends on these planned boundaries rather than creating temporary substitutes:

1. Feature 011: strict compiler/template settings, token/localization/announcement layers, shared
   modal/sheet/field/notice/diagnostic/actions, complete previews, Firefox/landscape projects and axe.
2. Feature 001: `/ships`, `/ships/:symbol` and `/build` hosts; one `ActiveBuildState`; current-revision
   link publication; replacement confirmation/coordinator; working-record autosave and fixed-mount
   provenance metadata.
3. Feature 002 shared ingress: source partial/fixed preflight, quality-first normalization,
   package-owned fixed repair and history-reset notification. Feature 004 calls this boundary once;
   it does not add a SLEF-specific normalization loop.
4. The pinned Almanac remains 0.1.2 until the relevant plans deliberately update and re-probe the
   package contract. No implementation may compensate for a package regression locally.

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
│   ├── routes-and-ui.md
│   ├── slef-export.md
│   └── slef-import.md
├── design/
    ├── export-build.md
    ├── import-build.md
    ├── import-outcome.md
    ├── reference-review.md
    └── screen-inventory.md
└── validation/
    └── consumer-compatibility.md          # implementation/release evidence
```

`tasks.md` is Phase 2 output and is intentionally not created here.

### Source Code (repository root)

```text
src/app/
├── domain/
│   ├── build/
│   │   └── build-ingress-normalizer.ts       # feature 002, reused
│   └── slef/
│       ├── slef-import.ts                    # byte/cardinality/package coordinator
│       └── slef-export.ts                    # exact-revision artifact generator
├── application/
│   ├── active-build/                         # feature 001, reused
│   └── slef/
│       ├── slef.presenter.ts
│       └── slef.store.ts                     # draft/layer/artifact/delivery state only
├── platform/
│   ├── browser/
│   │   ├── clipboard.port.ts
│   │   ├── download.port.ts
│   │   └── share.port.ts
│   └── build/application-metadata.ts         # build-time app name/version
├── i18n/                                     # feature 011
├── ui/                                       # feature 011/shared extensions
└── features/slef/
    ├── export-build-layer/
    ├── import-build-layer/
    └── import-outcome/

e2e/
├── accessibility.ts
├── slef-export.spec.ts
└── slef-import.spec.ts
```

Unit tests live beside sources. Keep one Angular application and one active build. Import/export
domain code is render-free; the signal store owns no committed `ShipLoadout` and only coordinates an
uncommitted candidate transaction. Browser ports isolate permission/capability effects. The layers
add no route or history entry and integrate into feature 001 hosts.

## Phase 0: Research Conclusions

See [research.md](./research.md). The decisive outcomes are:

- Measure the untouched string with `TextEncoder`, pass it to `inspectSlef`, and accept only one
  observed top-level entry with zero package diagnostics.
- Preflight source partial-quality and fixed-mount identities, construct a detached loadout, complete
  every correlated source partial, then repair only source-missing/unresolved fixed mounts. Any
  unsupported partial refuses the whole import before fixed repair or activation.
- Commit solely through feature 001; accepted imports become working provenance, reset edit history,
  autosave after commit and carry fixed-mount provenance plus feature 001's ordinary
  `valid`/`complete` summary in local-record metadata.
- Export through one default-retail `toSlefString` call with fitted order, sparse power fields,
  readable indentation, honest build-time metadata and an optional exact-revision canonical link.
- Preserve one immutable artifact for selectable text, download, clipboard and capability-gated
  share. Download reports dispatch/setup, not an unverifiable disk-save success.
- Treat `.design` as hierarchy/interaction reference. The complete surface inventory includes the
  import layer, shared replacement state, post-layer import outcome, export-unavailable host state
  and active-build export layer.

All planning questions are resolved and no feature-004 Almanac blocker remains.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines exact drafts, inspection/failure state, normalized
  candidates, revision-bound reports/artifacts and delivery outcomes.
- [contracts/slef-import.md](./contracts/slef-import.md) freezes the byte, cardinality, package,
  normalization-order and atomic replacement pipeline.
- [contracts/slef-export.md](./contracts/slef-export.md) freezes serialization options, current-retail
  and exact-link boundaries, artifact invalidation and round-trip checks.
- [contracts/browser-delivery.md](./contracts/browser-delivery.md) freezes copy/download/share
  capability, transient-activation and honest-result behavior.
- [contracts/routes-and-ui.md](./contracts/routes-and-ui.md) freezes host entry points, intent
  boundaries, integrated feature 001 share-link mode, semantics, localization and verification.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every requirement to a named
  surface/state; adjacent files define import, outcome and export composition.
- [design/reference-review.md](./design/reference-review.md) records `.design` evidence and every
  adopted, adapted and rejected behavior.
- [quickstart.md](./quickstart.md) provides runnable package, atomicity, round-trip, delivery,
  performance, responsive and accessibility validation scenarios.

## Post-Design Constitution Re-check

Phase 1 introduces no server, cross-origin request, private format schema, local game calculation,
component-owned build, historical-price retention, hidden normalization, hard-coded
display string, visual literal or reduced mobile capability. The shared ingress order prevents cargo
or fixed repair from hiding a partial state that must refuse. Exact diagnostics and unavailable
defaults remain visible. Only the accepted candidate is committed; every other terminal state keeps
active loadout, revision, dirty baseline, working/named bytes, fragment and edit history unchanged.

Every FR has a route-preserving surface and validation path. The post-design feature gate is **PASS**;
implementation remains sequenced behind planned 001/002/011 prerequisites. No constitutional
exception or local workaround is accepted.

## Complexity Tracking

No constitutional violation requires justification.
