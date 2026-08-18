# Implementation Plan: Module Outfitting and Engineering

**Branch**: `002-module-outfitting` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-module-outfitting/spec.md`

## Summary

Add package-authoritative outfitting to feature 001's single active build: enumerate every mount,
find and fit stock or package pre-engineered modules, apply supported engineering, edit module power,
and retain a session-only 100-decision undo/redo history. Components render immutable presentation
models and dispatch intents. Pure TypeScript services query and edit package-owned detached
`ShipLoadout` candidates reconstructed from feature 001's modelled snapshot boundary; only a
successful, changed candidate atomically replaces the active build.

The design follows `.design/Ship Builder.dc.html` canvases 1c and 1d: a dense wide workspace with an
inline fitting bench and responsive narrow full-screen replacement/engineering layers. The source's
1560px and 390px canvases are references, not breakpoints. Tablet portrait/landscape and zoomed
layouts are defined explicitly in [design/responsive-composition.md](./design/responsive-composition.md).
Mock game values, external assets, inferred comparison arrows and inaccessible interactions are not
copied.

Ingress runs before activation and before any calculation is read. Package-resolved partial grades
are completed through `completeEngineeringGrade()`. Any partial grade returning `unsupported`
rejects the whole candidate and leaves the current build intact, as required by Constitution 5.0.0
and clarified FR-013. Missing package defaults instead retain an incomplete candidate under FR-010.

## Technical Context

**Language/Version**: TypeScript 6.0.3, Angular HTML and SCSS; Node.js 24.18.0 in the reference
environment. Full TypeScript/template strictness is the constitutional target but is not enabled in
the current root configuration; enabling it through the shared foundation is an implementation
prerequisite

**Primary Dependencies**: Angular 22.1 standalone/zoneless APIs and signals; RxJS 7.8; pinned
`@elite-dangerous-almanac/core@0.1.2`; feature 001's planned active-build snapshot/reconstruction/swap
boundary; feature 011's planned UI, localization, announcement and verification foundations

**Storage**: One observable committed `ShipLoadout`; modelled `BuildSnapshotV1` checkpoints in session
memory only. Selection, queries, editor drafts, refusals and history are never serialized. Historical
purchase values are neither modelled nor retained

**Testing**: Vitest through Angular's unit-test builder with the existing 80% statement, branch,
function and line thresholds; Playwright 1.62 with planned `@axe-core/playwright` scans across
desktop, tablet portrait/landscape and mobile portrait/landscape in Chromium and Firefox. The current
repository has only three Chromium projects and no axe integration; feature 011 must close that gap
before feature 002 can pass its gate

**Target Platform**: Modern evergreen desktop, tablet and mobile browsers; touch, pointer and screen
reader; portrait and landscape; static same-origin deployment usable offline after first load

**Project Type**: Client-side Angular single-page application producing static files only

**Performance Goals**: Search input to settled candidate results below 100 ms for the largest pinned
package list; one active-build revision and one result refresh per accepted decision; exact
modelled-checkpoint restoration without cumulative mutation or stale catalogue cost

**Constraints**: No backend, account, telemetry or cross-origin runtime request; no private fitting,
variant, engineering or calculation rules; no page horizontal scrolling; one tokenized dark theme;
all application text translatable; all package game text/diagnostics remain package-owned; WCAG 2.2
AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: 48 package hulls and every package slot; 76 pre-engineered variants; largest probed
chooser 481 choices (`PantherMkII` `Slot01_Size8`: 473 stock plus 8 variants); at least the newest
100 Commander decisions; three product surfaces composed within `/build`

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1c (1560px wide reference) and 1d
(390px, minimum 844px-high mobile reference). Adoption and intentional departures are recorded in
[design/reference-review.md](./design/reference-review.md).

## Constitution Check

_GATE: **BLOCKED after constitution 6.0.0 review**. Historical purchase values remain outside the
model, but pinned Almanac 0.1.2 still retains unknown modules. Task generation and implementation
must wait for the released structured empty/default normalization contract; no local substitute is
permitted._

| Principle                               | Plan evidence                                                                                                                                  | Status                     |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| I. Client-Side Only                     | Queries, transactions and history use installed code and browser memory; no new network or persistence boundary.                               | PASS                       |
| II. Almanac Source of Truth             | All game behavior and reconstruction remain package-owned; unknown-module empty/default normalization waits for its released package contract. | BLOCKED upstream           |
| III. Domain Logic Outside UI            | Query, ingress, transaction and history services are render-free; the signal store orchestrates them.                                          | PASS                       |
| IV. Lossless, Honest Builds             | Resolved modelled fields restore; unknown hulls refuse and unknown modules receive package empty/default outcomes with no retained identity.   | PASS after release         |
| V. Desktop, Tablet and Mobile           | Wide, tablet and narrow contracts retain every action; zoom, touch, orientation, screen reader and no-overflow verification are explicit.      | PASS; 011 prerequisite     |
| VI. Commander's Language                | App prose uses feature 011; package nouns, slot labels and diagnostics use package i18n with disclosed canonical fallback.                     | PASS; 011 prerequisite     |
| VII. One Design System                  | Screens compose/extend `src/app/ui/`; `.design` supplies hierarchy rather than CSS literals.                                                   | PASS; 011 prerequisite     |
| VIII. Tested Before It Ships            | Domain tests and ten Playwright projects with axe are required without lowering coverage or omitting browsers.                                 | PASS; harness prerequisite |
| IX. Specification Before Implementation | The 2026-08-18 clarification resolves unsupported partial ingress before this redesign; every FR maps to a surface.                            | PASS                       |

Feature 001's canonical `BuildSnapshotV1` supplies detached reconstruction, name/ident updates and
modelled session checkpoints. Reconstruction goes back through `ShipLoadout`; raw-module overlays,
local game rules and captured purchase fields remain prohibited. `completeEngineeringGrade()`
returning `unsupported` triggers atomic ingress refusal;
The released package identity-normalization contract may report that a fixed default is unavailable;
that remains a nonblocking FR-010 incomplete-build outcome.

## Delivery Prerequisites

The source tree currently contains only the application shell and build-link codec. These planned
contracts must exist before feature 002 UI implementation is complete:

1. Feature 011: strict TypeScript/templates, token and localization layers, shared components and
   announcements, preview catalogue, Firefox/landscape projects and axe scans.
2. Feature 001: `/build`, one `ActiveBuildState`, modelled snapshot/reconstruction/swap operations,
   atomic replacement notification, persistence/fragment observers and normalization provenance.
   Its `BuildSnapshotV1` also supplies the in-memory history checkpoint shape; history itself remains
   session-only.
3. Feature 002 then extends those boundaries; it does not create temporary substitute shells,
   styles, locale messages or persistence formats.

Task generation must express these dependencies. Their current absence is not permission to weaken
the design or claim a partial feature complete.

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
    ├── screen-inventory.md
    ├── reference-review.md
    ├── responsive-composition.md
    ├── outfitting-workspace.md
    ├── module-replacement.md
    └── engineering-editor.md
```

`tasks.md` is Phase 2 output and is intentionally not created by this command.

### Source Code (repository root)

```text
src/app/
├── domain/
│   ├── build/
│   │   ├── build-ingress-normalizer.ts   # shared by every feature-001 replacement path
│   │   └── modeled-build-checkpoint.ts   # feature-001 snapshot/reconstruction boundary
│   └── outfitting/
│       ├── build-edit-transaction.ts
│       ├── engineering-cost.ts
│       └── session-edit-history.ts
├── application/
│   ├── active-build/                       # feature 001; integrated, not duplicated
│   └── outfitting/
│       ├── candidate-query.ts            # locale-dependent projection/search
│       ├── outfitting.presenter.ts
│       └── outfitting.store.ts
├── i18n/                                      # feature 011 package/app text presenter
├── ui/                                        # feature 011 primitives extended here
└── features/build-workspace/outfitting/
    ├── outfitting-workspace/
    ├── module-replacement/
    └── engineering-editor/

e2e/
├── accessibility.ts
├── module-outfitting.spec.ts
├── module-engineering.spec.ts
└── outfitting-history.spec.ts
```

**Structure Decision**: Keep one Angular application, one committed active loadout and no new route.
Cross-feature ingress normalization belongs with the shared build domain. Outfitting query,
transaction, cost and history code is framework-agnostic; one signal store owns only ephemeral
selection/editor state and coordinates feature 001. Presentational components consume immutable
views and emit intents. Wide and tablet layouts compose inline regions where content fits; narrow
and 400%-zoom layouts use in-document application layers, not browser navigation.

## Phase 0: Research Conclusions

The full decisions and alternatives are in [research.md](./research.md):

- `ShipLoadout.slots()`, `fittedModules()`, `modulesForSlot()`, engineering menus and structured edit
  methods are the only game-domain boundary.
- Candidate membership is each exact `modulesForSlot()` record plus all
  `getPreEngineeredVariants(symbol)` rows. Search/order are immutable presentation projections.
- Every edit starts from a detached candidate reconstructed through feature 001's canonical modelled
  snapshot, invokes a package operation and commits that candidate or nothing. Current catalogue cost
  is recomputed and historical purchase values never enter the snapshot.
- Ingress records partial/fixed source identities before construction, correlates only validated
  qualities in `[0,1)`, rejects resolution/construction mismatch or `unsupported`, then repairs only
  package-normalizes unknown modules first, then completes supported partials and repairs source-empty
  fixed mounts; none of these automatic ingress outcomes commits history.
- Package i18n leaves own module, variant, slot, restriction, blueprint, effect, engineering-group,
  material and diagnostic source text. App localization owns framing and controls only.
- In-memory `BuildSnapshotV1` checkpoints implement undo/redo through package reconstruction; inverse
  commands and captured `LoadoutEvent` snapshots are not used.

No `NEEDS CLARIFICATION` marker remains.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md): active presentation state, exact slot/candidate/engineering views,
  ingress results, atomic edits and bounded history.
- [contracts/module-catalogue.md](./contracts/module-catalogue.md): candidate membership, identity,
  required order, four-field AND search, labels and performance.
- [contracts/outfitting-editor.md](./contracts/outfitting-editor.md): package reads/commands, ingress,
  atomic refusal, power and persistence boundaries.
- [contracts/edit-history.md](./contracts/edit-history.md): one-decision checkpoints, capacity,
  restoration, reset and serialization exclusions.
- [design/screen-inventory.md](./design/screen-inventory.md): complete surface-to-FR mapping.
- [design/reference-review.md](./design/reference-review.md): `.design` adoption and departures.
- [design/responsive-composition.md](./design/responsive-composition.md): explicit wide, tablet,
  narrow, orientation and zoom composition absent from the source reference.
- Adjacent workspace, replacement and engineering definitions specify every required state.
- [quickstart.md](./quickstart.md): runnable validation order and expected outcomes.

## Post-Design Constitution Re-check

Phase 1 adds no server, private catalogue, local game calculation, component-owned build, persisted
history, hard-coded display string, visual literal or hidden unavailable value. Every FR, including
the FR-013 rejection path, has a surface owner and validation scenario. The direct feature gate is
**PASS**; implementation remains sequenced behind the planned 001/011 foundations.

## Complexity Tracking

No constitutional violation is accepted. A temporary reconstructed candidate is not a second
observable build. The tablet composition document closes a reference gap rather than introducing
another product surface. Historical purchase provenance remains outside the application model.
