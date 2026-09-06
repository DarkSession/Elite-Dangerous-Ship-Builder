# Implementation Plan: Prerendered Documents

**Branch**: `015-prerendered-documents` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/015-prerendered-documents/spec.md`

## Summary

Make the 50 content-bearing addresses answer with a document that already states
its subject. Today the head is right and the body is `<app-root></app-root>`, so a
reader that runs no script sees nothing.

The work is smaller than it looks, because a spike proved the hard part is already
solved. Angular's prerenderer, pointed at the address list the sitemap is built
from, renders the real application and produces documents carrying every figure
FR-002 names. On the three in-scope routes every composition switch is a media
query over markup that contains both alternatives, so one document is correct at
every viewport with no script — FR-010 needs no composition work at all.

What the feature actually costs is four things.

**Two files break the prerender pass.** `app.config.ts`'s retention sweep reaches
`UuidAdapter` through `TabOwnershipCoordinator`, which throws with no `crypto` and
kills every route. `sticky-banner.ts` reads bare `window` globals and serialises a
measurement it never made. Both are guarded, and the repository already contains
both fix patterns.

**The output layout is wrong for this host.** Angular writes
`<route>/index.html`; GitHub Pages answers a directory with a 301, which would
make every advertised address a redirect. A build step moves each document to
`<address>.html`, the layout `publish-static-routes.mjs` writes today for exactly
this reason.

**The service worker would hide the whole feature.** It answers navigations from
the cached `/index.html`, so only a first-ever visit would see a document. And
because the root's document must _be_ `index.html` — Pages resolves `/` to that
file and no other — prerendering the root would make a repeat visit to any hull
paint the start page first. The answer is to move the three things that used
`index.html` as a content-free shell onto `index.csr.html`: the worker's
navigation fallback, the `app-shell` prefetch list, and `404.html`. Settled in
[research.md](./research.md) decisions 8 and 9 and in
[contracts/address-set.md](./contracts/address-set.md) §2-§3, and together they
are the substance of FR-014.

**The publishing script would undo it.** `publish-static-routes.mjs` writes a
head-substituted copy of the built `index.html` to all 52 addresses. Run unchanged
against a prerendered build it would overwrite all 50 generated documents with a
content-free shell — a build that passes every head assertion and ships nothing.
Its contract changes in address-set.md §5.

**One capability genuinely conflicted** — the catalogue's stored session view
against FR-009. That was a spec-level question, not a plan one, and it went back
to the spec: it is answered in the Clarifications for 2026-09-06 and bounded by
FR-009a.

## Technical Context

**Language/Version**: TypeScript in strict mode; Angular 22 standalone, zoneless,
signal-based; SCSS; Node.js 24 per `.nvmrc` for the build and address scripts

**Primary Dependencies**: new — `@angular/ssr` and `@angular/platform-server`, at
the Angular pin, as dev dependencies and build-time only. Existing — feature 011's
published-address machinery (`scripts/search/published-addresses.mjs`), the
service worker, the design system and the localisation layer

**Storage**: none added. The feature writes files at build time and reads none at
runtime

**Testing**: Vitest at the existing 80% thresholds; `node --test` for the address
and document scripts; Playwright with `@axe-core/playwright` across the ten
configured projects

**Target Platform**: static files on any static host; GitHub Pages in production,
whose directory-redirect behaviour constrains the output layout

**Project Type**: client-side Angular single-page application producing static
files only. The server entry point added here is a build-time renderer; no server
bundle is emitted (`ignoreServer`, research decision 2) and none is deployed

**Performance Goals**: a content-bearing address paints its content in an earlier
frame than today on every layout profile (SC-004). No new timing gate. Measured
payload is about 20 KB compressed per document (research decision 10)

**Constraints**: no backend and no per-request rendering (constitution I and the
9.1.0 Technology Constraints); the build in the URL fragment and nowhere else; no
Commander data and no runtime environment configuration in any document; every
owned string localised; WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1,
2.4.1, 2.4.3, 2.4.7 and 2.4.11, applied to the first frame as to every other frame

**Scale/Scope**: 50 generated documents from 52 advertised addresses; 3 routes in
scope; 2 application files guarded; 1 service-worker setting; 1 new build step; 1
new registry export; ~14 MB raw and ~950 KB compressed added to the Pages artifact

## Constitution Check

_GATE: passed before Phase 0 research, re-checked after Phase 1. One divergence is
carried and is named below._

| Principle                          | Design evidence                                                                                                                                                                                                                                                                     | Status      |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| I. Client-side only                | No server is deployed. The server entry is a build-time renderer and no server bundle is emitted (research decision 2). Documents are static files. The build stays in the fragment (FR-017). No document carries Commander data (FR-007), enforced by `productionOutputViolations` | Pass        |
| II. Almanac is the source of truth | Every figure is rendered by the real component from the pinned package. The address set is derived from the installed package, never listed by hand (FR-006). FR-020 gates each document against the package                                                                        | Pass        |
| III. Domain logic outside the UI   | The browser/prerender distinction gets one injectable home in `platform/`, so no component reaches for `PLATFORM_ID`. The content-bearing registry is a data export, unit-testable without rendering                                                                                | Pass        |
| IV. Lossless, honest builds        | No build is read, written, imported or exported. `UuidAdapter` keeps throwing rather than fabricating an identity; the fix removes the call, not the honesty (research decision 5)                                                                                                  | Pass        |
| V. Desktop, tablet and mobile      | One document is correct at every viewport because both compositions are in the markup and CSS picks (research decision 7). The first frame is scanned by axe on all ten projects (FR-019)                                                                                           | Pass        |
| VI. Commander's language           | Documents are bundled English; the takeover replaces text in place with the committed locale (FR-011). No per-language address is introduced                                                                                                                                        | **Carried** |
| VII. One design system             | No new component, no new token, no new style. The documents are the existing screens rendered earlier                                                                                                                                                                               | Pass        |
| VIII. Tested before it ships       | Script tests in CI for the package comparison; end-to-end for the served body, the takeover and accessibility; coverage floor unchanged                                                                                                                                             | Pass        |
| IX. Specification first            | Spec written, clarified on 2026-09-06, both questions answered before this plan                                                                                                                                                                                                     | Pass        |

**The carried divergence.** Principle VI holds that nothing ships untranslatable
and that a Commander reads the application in their own language. A prerendered
document is English for everyone, because the build has no browser language to
read. It is not untranslatable — every string in it is a catalogue entry, and the
takeover replaces it with the committed locale. What diverges is that a Commander
whose locale is German reads English for the moment before the application starts.

This was put to the Commander on 2026-09-06 and ruled on: today that same moment
is a blank shell, so no Commander's first frame is worse than it is now, and every
Commander gains content in an earlier frame. The divergence is bounded to the
first frame and to text only — FR-011 requires the replacement to change words and
never layout. It introduces no per-language address (`hreflang` stays out of
scope, 011/FR-017) and licenses nothing else to ship in one language.

## Where the session-restore ruling went

Research decision 11 found a conflict the spec did not foresee: the catalogue
restores a Commander's filter, sort and anchor from `sessionStorage`, and a
generated `/ships` states the default view, so a returning Commander's takeover
can reorder and shorten a list that has already painted.

That is a question about what a Commander is entitled to, not about how to build
something, so it belongs to the spec rather than to this plan. It was put to the
Commander and answered on 2026-09-06: **the stored view wins, applied in the
takeover frame.** The spec's Clarifications record the reasoning and **FR-009a**
bounds it — the change lands in the takeover frame itself, a Commander with no
stored view sees no change at all, and nothing but the catalogue's stored view may
claim the exception.

Recorded here only so the trail from decision 11 is not lost. The requirement is
in [spec.md](./spec.md); do not re-derive it here.

## Project Structure

### Documentation (this feature)

```text
specs/015-prerendered-documents/
├── plan.md                      # This file
├── spec.md                      # The capability
├── research.md                  # Phase 0 — 14 decisions, from a spike
├── data-model.md                # Phase 1 — the entities and their rules
├── quickstart.md                # Phase 1 — how to validate it
├── contracts/
│   ├── prerendered-document.md  # What a generated document must contain
│   └── address-set.md           # Which addresses are generated, and the gate
├── design/
│   ├── screen-inventory.md      # Phase 1 — screens, states, requirement mapping
│   └── first-frame.md           # What each in-scope screen's first frame is
├── checklists/requirements.md
└── tasks.md                     # Phase 2 — /speckit-tasks, not created here
```

### Source Code (repository root)

```text
angular.json                     # build: server entry + prerender.routesFile
package.json                     # @angular/ssr, @angular/platform-server; e2e:offline spec list
ngsw-config.json                 # navigationRequestStrategy: freshness (FR-014)

src/
├── main.server.ts               # NEW — build-time render entry, BootstrapContext
├── app/
│   ├── app.config.server.ts     # NEW — appConfig + provideServerRendering
│   ├── app.config.ts            # retention sweep guarded (research decision 5)
│   ├── platform/browser/
│   │   └── rendering-target.ts  # NEW — the one statement of "is this a browser"
│   └── ui/components/app-frame/
│       └── sticky-banner.ts     # injected view + afterNextRender (decision 6)

.github/workflows/ci.yml         # NEW job e2e-production; deploy gates on it
                                 # preview: noindex across all 50; 404 from index.csr.html

scripts/
├── search/published-addresses.mjs   # + contentBearing registry (FR-021)
├── generate-prerender-routes.mjs    # NEW — routes file from the address list
├── publish-static-routes.mjs        # substitutes over generated documents (address-set.md §5)
├── check-prerendered-documents.mjs  # NEW — FR-020 package comparison
└── check-interface-foundations.mjs  # reconciles the content-bearing registry

e2e/
├── search-published.spec.ts     # + the body states the subject (US1)
├── prerendered-first-frame.spec.ts  # NEW — takeover, no shift, axe (US2)
│                                    #       and added to e2e:offline's spec list
└── coverage-ledger.ts           # + '015-prerendered-documents' and its rows
```

**Structure Decision**: No new application feature directory. This feature adds no
screen and no component; it changes when the existing screens are rendered. The
new application files are two build-time entry points and one platform statement.
Everything else is a build script or a test, which is where this feature's weight
actually sits.

## Phase 2 outline

`/speckit-tasks` will break these down. The dependency order that matters:

1. **Pin move first** — `@angular/ssr` and `@angular/platform-server` at the
   Angular version, peers met (research decision 12). Nothing else compiles first.
2. **Guards before configuration** — `app.config.ts` and `sticky-banner.ts`, with
   `rendering-target.ts` beneath them. A prerender configured before these is a
   build that fails on every route.
3. **Configuration and the routes file** — `angular.json`, the generator, the
   `<address>.html` placement step.
4. **The publishing script before anything is verified** — until
   `publish-static-routes.mjs` substitutes over the generated documents rather
   than over the shell, the build overwrites every document it just made and
   every body assertion tests a shell (address-set.md §5).
5. **FR-014 as one change** — `navigationRequestStrategy: freshness`, the worker's
   `index` and the `app-shell` list moving to `index.csr.html`, and `404.html`
   copying it. Any one alone leaves a wrong first frame, and the pinned service
   worker test is edited deliberately in the same change.
6. **The preview job with the same change** — `ng build` prerenders too, so a
   preview publishes 50 indexable near-duplicates unless the `noindex` rewrite
   covers every document, and answers unmatched addresses with the start page
   unless its `404.html` comes from `index.csr.html`
   ([quickstart.md](./quickstart.md), "What CI runs").
7. **Gates last** — the package comparison, the content-bearing reconciliation,
   the `navigationRequestStrategy` assertion, and the ledger rows.

## Complexity Tracking

| Violation                                                                     | Why needed                                                                                                                                          | Simpler alternative rejected because                                                                                                                                                                                  |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two new dependencies (`@angular/ssr`, `@angular/platform-server`)             | Angular's prerenderer renders the real application through the real router and DI graph, so a document cannot drift from what the application shows | A bespoke jsdom render step would be a second renderer to keep true to the first — the parallel-implementation problem constitution II exists to prevent, applied to behaviour rather than data (research decision 1) |
| A server entry point in a project whose constitution forbids servers          | The builder requires one for any prerender; it runs at build time and no server bundle is emitted                                                   | There is no prerender configuration without it. The honesty is preserved by `ignoreServer` and stated in 9.1.0: build-time rendering is permitted, per-request rendering is not (research decision 2)                 |
| `PLATFORM_ID` introduced to a repository that has never used it               | The prerender DOM emulation provides `defaultView` but not `crypto`, so every existing `defaultView` guard is the wrong test                        | Guarding on `defaultView` was tried in the spike and did not work (research decision 5). One injectable home keeps it out of components (constitution III)                                                            |
| A post-build move of every prerendered document                               | Angular emits `<route>/index.html`; GitHub Pages answers a directory with a 301                                                                     | Advertising `/ships/` would change addresses already published and already indexed; accepting the redirect re-creates the problem feature 011 fixed (research decision 4)                                             |
| `publish-static-routes.mjs` changes its template from one file to per-address | Its current contract — copy the shell to every address — silently destroys the feature's entire output                                              | Skipping the script for the 50 would split the head contract across two writers, so the 2 head-only addresses could drift from the 50 without any test seeing it (address-set.md §5)                                  |
| The service worker's navigation fallback moves off `index.html`               | `index.html` becomes a generated document, and a fallback carrying one address's content answers every other address with it                        | Writing the root's document elsewhere was tried on paper and cannot be built: Pages resolves `/` to `index.html` alone, so the root would answer with a shell (research decision 9)                                   |

## Post-Design Constitution Re-check

Re-checked after Phase 1. No gate moved.

The two designs that could have failed a gate did not. `contracts/address-set.md`
keeps a single derived address list, so principle II's ban on hand-maintained
package data holds through FR-021's new registry. `contracts/prerendered-document.md`
forbids the application version and any Commander data in a body, which
`productionOutputViolations` already enforces mechanically for cross-origin URLs
and which the new script test extends.

The carried divergence from principle VI is unchanged by the design work: it was
ruled on before this plan and the design does not widen it.

Two artefacts were added to satisfy constitution IX rather than to satisfy a
requirement: `design/screen-inventory.md`, which is the mapping the constitution
requires before tasks are broken down, and `contracts/address-set.md` §5, which
states the publishing pipeline the feature cannot work without.

One thing the design surfaced, and the change that answers it: the production
documents exist only under `e2e:offline`, which CI did not run, so SC-005's scan
would have rested on a contributor remembering. This feature therefore adds the
`e2e-production` job to `.github/workflows/ci.yml` and puts `deploy` behind it
(research decision 13). The suite is 23 tests and passes today; it is added as a
gate that is already green, not as one the feature has to make green.
