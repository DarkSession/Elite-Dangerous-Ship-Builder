# Implementation Plan: Module Outfitting and Engineering

**Branch**: `002-module-families-almanac-upgrade` | **Date**: 2026-08-21, revised 2026-08-23 |
**Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-module-outfitting/spec.md`

## Summary

Add package-authoritative outfitting to feature 001's single active build: enumerate every mount,
find and fit stock or package pre-engineered modules, apply supported engineering, edit module power,
name the loaded ship, and retain a session-only 100-decision undo/redo history. Ship name and ident
editing is owned here (FR-019): feature 001 supplies the modelled snapshot fields, feature 002 supplies
the control and routes it through the same transaction and history path as any other edit. Components render immutable presentation
models and dispatch intents. Pure TypeScript services query and edit package-owned detached
`ShipLoadout` candidates reconstructed from feature 001's modelled snapshot boundary; only a
successful, changed candidate atomically replaces the active build.

**Wave 10 (2026-08-23) adds module families to the chooser and withdraws its two sections.** Both
outfitting canvases were redrawn around collapsible families, and `@elite-dangerous-almanac/core`
0.1.7 — pinned in the same change — supplies the grouping they draw: every module now carries an
`OutfittingModuleIdentity.familyId`, and `getOutfittingFamilyName` names all 77 families in English
and 58 of them in each other supported language. Grouping is therefore a package read, not an
application taxonomy: FR-020 through FR-024 add a collapsible level keyed on that id, seeded open at
the fitted module's family, reseeded from search, and the standard/unique-reward sections come out
because neither canvas draws them any more. The work is confined to the replacement surface — one
presenter method, one grouping function, one piece of query state and the family control — and
touches no transaction, ingress, engineering, cost or history path.

The design follows `.design/Ship Builder.dc.html` canvases 1c and 1d: a dense wide workspace with an
inline fitting bench and responsive narrow full-screen replacement/engineering layers. The source's
1560px and 390px canvases are references, not breakpoints. Tablet portrait/landscape and zoomed
layouts are defined explicitly in [design/responsive-composition.md](./design/responsive-composition.md).
Mock game values, external assets, inferred comparison arrows and inaccessible interactions are not
copied.

Ingress runs before activation and before any calculation is read. Package-resolved partial grades
are completed through `completeEngineeringGrade()`. Any partial grade returning `unsupported`
rejects the whole candidate and leaves the current build intact, as required by the constitution
and clarified FR-013. Package construction returns every fixed mount populated with its hull default
under FR-010; unknown module identities are outside the supported contract.

## Technical Context

**Language/Version**: TypeScript, Angular HTML and SCSS; Node.js per the repository tooling
configuration. Full TypeScript/template strictness through the shared foundation is an
implementation prerequisite

**Primary Dependencies**: Angular standalone/zoneless APIs and signals; RxJS;
`@elite-dangerous-almanac/core` **0.1.7** (from 0.1.6: `OutfittingModuleIdentity.family: string | null`
is replaced by `familyId: OutfittingFamilyId`, `ships/module-families` and `i18n/module-families` are
new, and `GameLocale` gains `pt`; the repository referenced none of these, so the pin bump typechecks
clean); feature 001's active-build snapshot/reconstruction/swap
boundary; feature 011's UI, localization, announcement and verification foundations

**Storage**: One observable committed `ShipLoadout`; modelled `BuildSnapshotV1` checkpoints in session
memory only. Selection, queries, open family state, editor drafts, refusals and history are never
serialized. Historical purchase values are neither modelled nor retained

**Testing**: Vitest through Angular's unit-test builder with the existing 80% statement, branch,
function and line thresholds; Playwright with `@axe-core/playwright` scans across desktop, tablet
portrait/landscape and mobile portrait/landscape in Chromium and Firefox through feature 011's
shared harness

**Target Platform**: Modern evergreen desktop, tablet and mobile browsers; touch, pointer and screen
reader; portrait and landscape; static same-origin deployment usable offline after first load

**Project Type**: Client-side Angular single-page application producing static files only

**Performance Goals**: Search input to settled candidate results below 100 ms for the installed
package's largest list, measured in a dedicated Chromium-only Playwright project because CPU
throttling is a CDP capability with no Firefox equivalent; one active-build revision and one result refresh per accepted decision; exact
modelled-checkpoint restoration without cumulative mutation or stale catalogue cost

**Constraints**: No backend, account, telemetry or cross-origin runtime request; no private fitting,
variant, engineering or calculation rules; no page horizontal scrolling; one tokenized dark theme;
all application text translatable; all package game text/diagnostics remain package-owned; WCAG 2.2
AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: Every hull, slot and pre-engineered variant supplied by the installed package; the
package's largest discovered chooser; exactly the newest 100 Commander decisions; three product
surfaces composed within `/build`

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1c (1560px wide reference) and 1d
(390px, minimum 844px-high mobile reference), both redrawn 2026-08-23. Adoption and intentional
departures are recorded in [design/reference-review.md](./design/reference-review.md); the wave 10
family rulings, including the two withdrawals, are in
[design/module-replacement.md](./design/module-replacement.md).

## Constitution Check

_GATE: **PASS with no exception**. Historical purchase values remain outside the model, and package
construction always populates fixed mounts, so no local substitute is required. Implementation
remains sequenced behind features 001 and 011._

| Principle                               | Plan evidence                                                                                                                                                                                                                                                                                | Status                     |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| I. Client-Side Only                     | Queries, transactions and history use installed code and browser memory; no new network or persistence boundary.                                                                                                                                                                             | PASS                       |
| II. Almanac Source of Truth             | All game behavior and reconstruction remain package-owned, including fixed-mount defaults at import and the whole family taxonomy and its names; the badge and the DPS/power range the canvas draws are withdrawn rather than computed locally.                                              | PASS                       |
| III. Domain Logic Outside UI            | Query, ingress, transaction and history services are render-free; the signal store orchestrates them.                                                                                                                                                                                        | PASS                       |
| IV. Lossless, Honest Builds             | Resolved modelled fields restore; unknown hulls refuse and package construction always populates fixed mounts.                                                                                                                                                                               | PASS                       |
| V. Desktop, Tablet and Mobile           | Wide, tablet and narrow contracts retain every action; zoom, touch, orientation, screen reader and no-overflow verification are explicit.                                                                                                                                                    | PASS; 011 prerequisite     |
| VI. Commander's Language                | App prose uses feature 011; package nouns, slot labels and diagnostics use package i18n with disclosed canonical fallback.                                                                                                                                                                   | PASS; 011 prerequisite     |
| VII. One Design System                  | Screens compose/extend `src/app/ui/`; `.design` supplies hierarchy rather than CSS literals.                                                                                                                                                                                                 | PASS; 011 prerequisite     |
| VIII. Tested Before It Ships            | Domain tests and ten Playwright projects with axe are required without lowering coverage or omitting browsers.                                                                                                                                                                               | PASS; harness prerequisite |
| IX. Specification Before Implementation | The 2026-08-18, 2026-08-21 and 2026-08-23 clarifications resolve unsupported partial ingress, ship name/ident ownership, slot display, clear-all duplication, roll wording, the unrequired search shortcut and now the family definition and section withdrawal; every FR maps to a surface. | PASS                       |

Feature 001's canonical `BuildSnapshotV1` supplies detached reconstruction, its name/ident fields and
modelled session checkpoints; feature 002 owns the name/ident control that writes them. Reconstruction goes back through `ShipLoadout`; raw-module overlays,
local game rules and captured purchase fields remain prohibited. `completeEngineeringGrade()`
returning `unsupported` triggers atomic ingress refusal. Package construction always returns fixed
mounts populated with their hull defaults; feature 002 adds no missing-default outcome.

## Delivery Prerequisites

These contracts must exist before feature 002 UI implementation is complete:

1. Feature 011: strict TypeScript/templates, token and localization layers, shared components and
   announcements, preview catalogue, Firefox/landscape projects and axe scans.
2. Feature 001: `/build`, one `ActiveBuildState`, modelled snapshot/reconstruction/swap operations,
   atomic replacement notification and persistence/fragment observers.
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
│       ├── candidate-query.ts            # locale-dependent projection/search/family grouping
│       └── outfitting.store.ts
├── i18n/                                      # feature 011 package/app text presenter
├── ui/                                        # feature 011 primitives extended here
└── features/build-workspace/outfitting/
    ├── outfitting-workspace/
    ├── module-replacement/
    └── engineering-editor/

e2e/
├── accessibility.ts                        # feature 011 shared helper, extended here
├── coverage-ledger.ts                      # feature 011 registry, extended here
├── module-outfitting.spec.ts
├── module-engineering.spec.ts
├── outfitting-history.spec.ts
├── outfitting-responsive.spec.ts
├── outfitting-accessibility.spec.ts
└── outfitting-timing.spec.ts               # SC-002 only; Chromium-only Playwright project
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
- Ingress records source partial-engineering evidence before construction. Package construction
  supplies every fixed default, then ingress correlates only validated qualities in `[0,1)`, rejects
  resolution/construction mismatch or `unsupported`, and completes supported partials. Package
  construction and quality-completion feedback do not commit history.
- Package i18n leaves own module, variant, slot, restriction, blueprint, effect, engineering-group,
  material and diagnostic source text. App localization owns framing and controls only.
- In-memory `BuildSnapshotV1` checkpoints implement undo/redo through package reconstruction; inverse
  commands and captured `LoadoutEvent` snapshots are not used.
- The chooser groups on the package's `familyId` and labels with its family lookup; a displayed-name
  group cannot reproduce either canvas, and no local family table, abbreviation or aggregate is added
  (decisions 13 and 14).
- Open family state is one seeded set inside `CandidateQueryState`, replaced on every rebuild and
  every query change rather than remembered across them (decision 15).

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
history, hard-coded display string, visual literal or hidden unavailable value. The wave 10 family
work adds no local taxonomy: the grouping key, the family order and every family name are package
values, and the two canvas elements that would have needed a local rule — the two-letter badge and
the per-family DPS/power range — are withdrawn on the record rather than invented. Every FR, including
the FR-013 rejection path, has a surface owner and validation scenario. The direct feature gate is
**PASS**; implementation remains sequenced behind the planned 001/011 foundations.

## Complexity Tracking

No constitutional violation is accepted. A temporary reconstructed candidate is not a second
observable build. `openFamilies` is not a second build state: it is seeded from the build and
discarded with the query state it lives in, and it never reaches the snapshot, history, persistence
or the fragment. SC-002 is met at the compact composition as of
2026-08-23, which it had not been since the criterion was first measured: collapsed families alone did
not close the gap — they moved it, the first broad search term building the matching families' rows
cold at 539 ms — and the rule that closed it is that a search opens what it matched only up to a
screenful of twenty-five choices, above which every family stays closed with its own count. FR-023
and SC-008 are amended to that; the figures are in the module-replacement design under "Module
families". The tablet composition document closes a reference gap rather than introducing
another product surface. Historical purchase provenance remains outside the application model.
