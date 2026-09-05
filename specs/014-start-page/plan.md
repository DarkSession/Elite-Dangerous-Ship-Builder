# Implementation Plan: Start Page

**Branch**: `014-start-page` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/014-start-page/spec.md`

## Summary

Give Nav Beacon's own address a page. Today `''` is a redirect into `/ships`, so a Commander
who opens the product lands in one of its tools and discovers the other from a tab. This
feature makes the root a screen: the product's name and line, the tools it carries as
activatable entries, and the Frontier attribution at the foot.

Almost all of it is composition. The tool bar above is unchanged, the shell actions carry
over untouched, the attribution text is the help manifest's `exactText` rendered through
the `LegalExcerpt` component that already exists to reproduce it. The domain work is one
extension: the tool registry in `app-navigation.ts` gains two descriptions and a subject
list per tool, and gains a reading that returns every tool rather than only marking the
current one.

Three things make this more than a new component.

**The root becomes an address.** `''` sits in the checker's `UNLISTABLE_ROUTES` because a
redirect is not an address; it stops being one. It joins `STATIC_ADDRESSES`, the sitemap
advertises it for the first time, and `src/index.html` — which already carries the root's
canonical and card — becomes the document that address answers with rather than a host
document describing the shipyard.

**Two descriptions per tool, and the gate has to know which one is on screen.** The
Commander's 2026-09-04 ruling builds both artboards literally, so each tool carries a
fuller description with a subject list and a shorter one without. Which appears follows
the composition modes already in `_responsive.scss` — nothing new is introduced — and
FR-019 asks the end-to-end suite to prove exactly one of the two is present at every
viewport it covers.

**Twenty-one end-to-end call sites open `/`.** Eleven spec files navigate to the root, and
each one is either indifferent to where it lands or means the shipyard. They are audited
one at a time; the ones that mean the shipyard say `/ships`.

## Technical Context

**Language/Version**: TypeScript in strict mode; Angular standalone, zoneless, signal-based;
SCSS; Node.js per the repository tooling configuration for the address scripts

**Primary Dependencies**: feature 011's design system, application shell, localisation and
route title strategy; feature 012's help manifest for the attribution text; the tool
registry in `src/app/features/shared/app-navigation.ts`. No new package, and nothing from
`@elite-dangerous-almanac/core` — this screen states no game datum

**Storage**: none. The entry point holds no state, reads no build and writes nothing

**Testing**: Vitest through the Angular unit-test builder at the existing 80% thresholds;
`node --test` for the address scripts; Playwright with `@axe-core/playwright` across the
ten configured projects

**Target Platform**: Modern evergreen browsers on desktop, tablet and mobile; static client
application, usable offline after first load

**Project Type**: Client-side Angular single-page application producing static files only

**Performance Goals**: No new timing gate. The screen draws two cards and a paragraph; the
route is lazy-loaded like every other, so the 500kB initial budget is unmoved (research
decision 8). It is the first screen a Commander sees, so nothing on it may wait on a fetch:
its strings are catalogue entries, its attribution a compiled constant, its tool list a
source literal

**Constraints**: No backend, no account, no telemetry, no request to any origin but this
one; every owned string localised; one dark theme from tokens; no horizontal page scrolling
at any viewport; WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3,
2.4.7 and 2.4.11

**Scale/Scope**: one route, one screen, one new UI component, two tools in the registry,
two descriptions and one subject list each; one new published address; three new tokens;
eleven end-to-end files audited

**Design Reference**: `.design/Home.dc.html`, artboards `1a` (1440px, "Desktop — merged
toolbar, tool selector in the middle") and `1b` (390px, "Mobile — stacked selector"), and
it governs. What it draws, what is withdrawn from it and what the two artboards disagree
about is recorded in [design/reference-review.md](./design/reference-review.md).

## Constitution Check

_GATE: passed before Phase 0 research, re-checked after Phase 1. One divergence is carried,
it is from a spec-level ruling rather than a constitutional exception, and it is named
below._

| Principle                          | Design evidence                                                                                                                                                                                                                    | Status  |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| I. Client-side only                | The screen fetches nothing, stores nothing and sends nothing. Its only outbound reference is the attribution text, which is bundled. No account: the canvas's `CH` chip is not built and is not added (research decision 5)        | Pass    |
| II. Almanac is the source of truth | The screen states no game datum. Tool names and descriptions are the product's own words about its own tools, not game text, so they are this application's strings to own and translate                                           | Pass    |
| III. Domain logic outside the UI   | The tool registry stays in `features/shared/app-navigation.ts` and is unit-testable without rendering. The page renders what it is handed; the card component takes inputs and emits nothing                                       | Pass    |
| IV. Lossless, honest builds        | No build is read, written, imported or exported. The attribution is the manifest's `exactText`, passed through untouched by a component that renders it as text and never as markup                                                | Pass    |
| V. Desktop, tablet and mobile      | Both artboards are built; the fold is the existing composition modes. **One divergence**: the subject list and the fuller description are absent in the compact mode, ruled on 2026-09-04 and bounded in the spec's Clarifications | Carried |
| VI. Commander's language           | Every string is a message key: the product line, both descriptions and the subject list per tool, and the document title and description. The attribution is `lang`-marked in the language it was written in, not translated       | Pass    |
| VII. One design system             | `edsb-tool-card` is a new component in `src/app/ui/components/`, declared in the preview manifest with its states, built from tokens. No style is authored inside the page beyond its own layout grid                              | Pass    |
| VIII. Tested before it ships       | Unit tests for the registry reading and the card; end-to-end for the journey, the fold, the published document and accessibility, across the ten projects. `pnpm run check` is the gate                                            | Pass    |
| IX. Specification first            | Spec written and clarified before this plan; the one open question was ruled on and folded in                                                                                                                                      | Pass    |

**The carried divergence.** Principle V holds that a capability present on one form factor
and absent on another is incomplete. A tool's subject list is drawn at 1440px and not at
390px. The Commander ruled on 2026-09-04 that a subject list is orientation for a choice
rather than the choice itself, and that every word needed to choose between the tools is
present at both widths. It is not a constitutional exception and does not amend principle
V: it is a statement that the absent content is not a capability. FR-018 and FR-019 hold it
to that — neither form may be the sole home of any fact needed to choose, and exactly one
form is on screen at every viewport. It binds this content and nothing else.

## Project Structure

### Documentation (this feature)

```text
specs/014-start-page/
├── plan.md                       # This file
├── research.md                   # Phase 0
├── data-model.md                 # Phase 1
├── quickstart.md                 # Phase 1
├── contracts/
│   ├── tool-registry.md          # What a tool record carries and who reads it
│   └── published-root.md         # The document the root address answers with
├── design/
│   ├── reference-review.md       # What the canvas draws, and what is withdrawn
│   ├── screen-inventory.md       # Every requirement, on a screen
│   └── start-page.md             # The screen definition
├── checklists/
│   └── requirements.md
└── tasks.md                      # Phase 2 (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
src/
├── index.html                                  # CHANGED: root document describes the entry point
├── app/
│   ├── app.routes.ts                           # CHANGED: '' is a screen; '**' lands on it
│   ├── features/
│   │   ├── start/                              # NEW
│   │   │   ├── start.page.ts
│   │   │   ├── start.page.html
│   │   │   ├── start.page.scss
│   │   │   └── start.page.spec.ts
│   │   └── shared/
│   │       ├── app-navigation.ts               # CHANGED: descriptions, subjects, catalogue()
│   │       └── app-navigation.spec.ts          # CHANGED
│   ├── ui/
│   │   ├── components/tool-card/               # NEW
│   │   │   ├── tool-card.ts
│   │   │   ├── tool-card.html
│   │   │   ├── tool-card.scss
│   │   │   └── tool-card.spec.ts
│   │   └── previews/preview-manifest.ts        # CHANGED: the new component's states
│   └── i18n/locales/
│       ├── en.json                             # CHANGED: home.* and tools.*.summary keys
│       └── de.json                             # CHANGED
├── styles/                                     # UNCHANGED: no new token, no new breakpoint
scripts/
├── search/published-addresses.mjs              # CHANGED: the root is an address
├── publish-static-routes.mjs                   # CHANGED: the root's document is index.html
└── check-interface-foundations.mjs             # CHANGED: '' leaves UNLISTABLE_ROUTES
public/sitemap.xml                              # REGENERATED: gains the root
e2e/
├── start-page.spec.ts                          # NEW: the journey, the fold, accessibility
└── (eleven files audited)                      # CHANGED where '/' meant the shipyard
```

**Structure Decision**: the existing single-project Angular layout, unchanged. One feature
directory (`features/start/`), one design-system component (`ui/components/tool-card/`), and
edits to the shared registry, the route table, the locale catalogues, the three address
scripts and the end-to-end suite. No new directory level, no new build step, no new
dependency.

The feature directory is `start/` rather than `home/` because the canvas titles its artboard
`START PAGE — TOOL SELECTOR`, and because in a suite with a tool registry a directory called
`home` reads as a tool.

## Post-Design Constitution Re-check

Re-run after Phase 1, against the artefacts rather than the intent.

| Principle                          | What Phase 1 produced                                                                                                                                                                               | Status  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| I. Client-side only                | `data-model.md` has a "What has no model" section and no storage shape; research decision 8 confirms nothing on the screen fetches                                                                  | Pass    |
| II. Almanac is the source of truth | No artefact names a package import. The screen states no game datum                                                                                                                                 | Pass    |
| III. Domain logic outside the UI   | `contracts/tool-registry.md` puts both readings on the registry service, verified by unit tests that render nothing                                                                                 | Pass    |
| IV. Lossless, honest builds        | Research decision 4 keeps the attribution the manifest's exact text and rejects both a translated copy and a loose quotation                                                                        | Pass    |
| V. Desktop, tablet and mobile      | `design/screen-inventory.md` composes all three modes; the one divergence is bounded by FR-018/FR-019 and recorded in `design/reference-review.md`                                                  | Carried |
| VI. Commander's language           | `data-model.md` lists eleven new keys, all `MessageKey`-typed; the subject list is one string per locale so a translator writes their own series punctuation                                        | Pass    |
| VII. One design system             | One new component with a preview declaration; research decision 9 keeps both stylesheets under the `anyComponentStyle` ceiling; three tokens added rather than values hard-coded; no new breakpoint | Pass    |
| VIII. Tested before it ships       | `quickstart.md` maps all eight success criteria to a check; both contracts carry a verification table                                                                                               | Pass    |
| IX. Specification first            | Spec, clarification, plan, then artefacts. No requirement was invented in this phase                                                                                                                | Pass    |

Nothing in Phase 1 changed a gate's answer, and no constitutional exception is requested.

## Complexity Tracking

No constitutional violation is requested, so this section carries nothing. The one carried
divergence is recorded under Constitution Check above; it is a spec-level ruling with its
own bounds and testable consequences, not added complexity asking to be justified.
