# Implementation Plan: Interface Foundations

**Branch**: `011-interface-foundations` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-interface-foundations/spec.md`

## Summary

Establish the one shared interface foundation every capability composes: a token-only dark design
system, presentation-only Angular components, a runtime locale store with complete bundled English
fallback and initial English/German catalogues, named `Intl` formatters, package-game-text
presentation, deduplicated live announcements, and a zoneless component-preview target. Extend the
build gate with policy checks, ten Chromium/Firefox viewport-orientation projects, axe scans and
screen-reader protocols. The product gains no new content route; the language selector is part of
the application frame and the preview catalogue is tooling-only.

Almanac beta.12 still has package-owned user-facing text without locale-result APIs. The complete
gap and minimal reproduction are filed as
[Elite-Dangerous-Almanac #309](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/309).
This does not block feature 011 because FR-020 requires the canonical package text plus a localized
untranslated disclosure until a released package supplies the requested locale.

## Technical Context

**Language/Version**: TypeScript 6.0 in full strict mode; Angular HTML and SCSS; Node.js 24 per
`.nvmrc` for tooling

**Primary Dependencies**: Angular 22.1 standalone, explicitly zoneless APIs; Angular Router and
service worker; RxJS 7.8; `@jsverse/transloco` 8.4 runtime localization; browser `Intl` APIs;
`@elite-dangerous-almanac/core` 0.1.0-beta.12 leaf i18n and catalogue exports;
`@axe-core/playwright` 4.13 and Playwright 1.62 for verification

**Storage**: One versioned locale-preference record in `localStorage` through an injected adapter;
message catalogues, preview state, announcement state and formatter caches are not persisted and
never enter build links, SLEF or saved builds

**Testing**: Vitest through Angular's unit-test builder with the existing 80% thresholds; Node script
tests for repository policy checks; Playwright/axe over desktop, tablet portrait/landscape and mobile
portrait/landscape in Chromium and Firefox; recorded manual screen-reader and actual-browser-zoom
protocols

**Target Platform**: Modern evergreen browsers on desktop, tablet and mobile; static client
application usable offline after first load; pointer, touch and screen reader; LTR and RTL-safe

**Project Type**: Client-side Angular single-page application plus a development/test-only zoneless
Angular component-preview target; static output only

**Performance Goals**: Locale selection publishes messages, root language/direction and formatters as
one state before the next rendered frame; a warm locale switch and a settled live announcement each
complete within 100 ms on the mobile viewport under Chromium 4x CPU slowdown; preserve current
production bundle budgets

**Constraints**: No backend, account, telemetry, third-party request, private game-text translation,
second theme or production preview route; English fallback must be readable with no network; German
catalogue must be complete before it is selectable; no document horizontal scrolling at 200% text or
400% zoom; 44 CSS-pixel target baseline; WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1,
2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: One global locale state and application frame; initial shipped locales `en` and
`de`; every exported `src/app/ui/` component and applicable populated, empty, loading, error and
disabled state; every product screen/relevant state; ten browser/viewport-orientation projects

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1a–1d. Adopted hierarchy and required
departures are recorded in [design/reference-review.md](./design/reference-review.md)

## Constitution Check

_GATE: Passed before research. Re-check after Phase 1. No constitutional exception is requested._

| Principle                               | Design evidence                                                                                                                                         | Status |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| I. Client-Side Only                     | Locale assets and preview output are static; only a local preference is persisted; no cross-origin runtime dependency is introduced.                    | PASS   |
| II. Almanac Source of Truth             | Game names use named leaf helpers; unavailable package text remains canonical and disclosed. Gap #309 is upstream with no local translation table.      | PASS   |
| III. Domain Logic Outside UI            | Locale, formatting, announcements and browser persistence sit in stores/services/adapters; components accept presentation state and emit intent.        | PASS   |
| IV. Lossless, Honest Builds             | Interface state never enters or changes a build; unavailable and untranslated values remain explicit instead of becoming empty text or estimates.       | PASS   |
| V. Desktop, Tablet and Mobile           | Fluid components, five size/orientation profiles per browser, axe, touch, zoom, text expansion, reduced motion and screen-reader protocols are planned. | PASS   |
| VI. Commander's Language                | Runtime selection, complete `en`/`de` catalogues, bundled English fallback, named formatters and root `lang`/`dir` publication are defined.             | PASS   |
| VII. One Design System                  | One token set and one shared UI library feed product and preview targets; the single dark theme has no control or stored preference.                    | PASS   |
| VIII. Tested Before It Ships            | Existing 80% gates remain; Firefox, landscape, axe, preview coverage and static policy checks join `pnpm run check`.                                    | PASS   |
| IX. Specification Before Implementation | Every FR maps to a plan-time surface/contract and all research questions are resolved before task generation.                                           | PASS   |

## Project Structure

### Documentation (this feature)

```text
specs/011-interface-foundations/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── design-system-and-previews.md
│   ├── feedback-and-semantics.md
│   ├── localization-and-formatting.md
│   └── responsive-accessibility-verification.md
└── design/
    ├── application-shell.md
    ├── component-preview-catalogue.md
    ├── reference-review.md
    └── screen-inventory.md
```

`tasks.md` is Phase 2 output and is intentionally not created by this command.

### Source Code (repository root)

```text
src/
├── styles.scss                         # imports the token and base layers only
├── styles/
│   ├── tokens/
│   │   ├── _primitives.scss            # only permitted visual literals
│   │   └── _semantic.scss              # one dark semantic token set
│   ├── _base.scss                      # token-consuming document defaults
│   └── _responsive.scss                # named size/orientation/container tokens
└── app/
    ├── i18n/
    │   ├── formatters/                  # cached named Intl formatters
    │   ├── locales/                     # canonical en.json and de.json sources
    │   ├── game-text.presenter.ts       # Almanac locale/canonical disclosure
    │   ├── locale-registry.ts           # shipped tags/direction/asset metadata
    │   └── locale.store.ts              # atomic requested/effective locale state
    ├── platform/
    │   ├── browser/                     # navigator/document adapters
    │   └── storage/locale-preference.repository.ts
    └── ui/
        ├── announcements/               # assertive/polite deduplicated outlet
        ├── components/                  # shared presentation primitives
        └── previews/                    # typed preview declarations and manifest

projects/ui-preview/                     # dev/test-only zoneless Angular host
├── src/
└── tsconfig.app.json

scripts/
├── check-interface-foundations.mjs      # text/token/preview policy gate
└── check-interface-foundations.test.mjs

e2e/
├── accessibility.ts                     # shared axe/semantic/overflow assertions
├── interface-foundations.spec.ts
└── ui-previews.spec.ts
```

Tests live beside their TypeScript/component source where possible. Preview-host code imports the
same `src/app/ui/`, tokens, localization providers and zoneless configuration; it contains no second
component implementation.

**Structure Decision**: Keep one production Angular application. Add one Angular workspace target
solely to render typed shared-component previews under Playwright; it is not a product route and is
not built into production. Cross-cutting state remains in application services/adapters, while
`src/app/ui/` stays presentation-only. Locale JSON has one source under `src/app/i18n/locales/`: the
English file is imported into the fallback bundle and the asset rule copies all catalogues to the
same-origin `/i18n/` path.

## Phase 0: Research Conclusions

All decisions, dependency probes, alternatives and the upstream reproduction are recorded in
[research.md](./research.md). The decisive outcomes are:

- Ship complete English and German application catalogues. A real second language is required by
  Story 3/SC-006; a pseudo-locale is test-only. Registry-driven tags keep later additions ordinary.
- Use Transloco for runtime message lookup/fallback and an application-owned signal store for locale
  selection/publication. Angular compile-time i18n cannot satisfy an in-session persisted switch.
- Eagerly bundle English from the canonical JSON source; serve/cache all catalogues as same-origin
  static assets. Failed or invalid non-English loads resolve atomically to English.
- Use cached named `Intl` formatters rather than static `LOCALE_ID` pipes. Credits and unsupported
  game units use translated unit labels around locale-formatted numbers.
- Use a first-party zoneless Angular preview target. Storybook 10.5.8 supports Angular 22 but requires
  `zone.js` and a second runtime/configuration, neither needed for this repository.
- Expand Playwright to five size/orientation profiles in each of Chromium and Firefox; scan every
  product and preview state with axe and retain manual screen-reader/actual-400%-zoom protocols.
- Add one repository policy checker for application text, visual literals and preview completeness;
  generic lint configuration cannot prove all three FR-024 boundaries.
- Beta.12's localized module/blueprint/effect/material helpers return `null` on a locale miss.
  Remaining package text has no locale result; #309 tracks it. Canonical disclosure is the planned
  interim, not a local translation.

No planning clarification marker remains.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines locale/catalogue/preference state, formatted values,
  package-text presentation, announcements, component previews and token-policy records.
- [contracts/localization-and-formatting.md](./contracts/localization-and-formatting.md) freezes
  locale precedence, atomic publication, fallback, persistence, formatter and Almanac boundaries.
- [contracts/design-system-and-previews.md](./contracts/design-system-and-previews.md) freezes token
  ownership, presentation-only components, extension rules and complete preview declarations.
- [contracts/feedback-and-semantics.md](./contracts/feedback-and-semantics.md) freezes names,
  relationships, landmarks, text equivalence and deduplicated announcement behavior.
- [contracts/responsive-accessibility-verification.md](./contracts/responsive-accessibility-verification.md)
  freezes the ten-project matrix, axe/static gates, responsive cases and manual protocols.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every FR to the application frame,
  embedded language chooser, product capability surfaces and tooling-only preview catalogue.
- [design/application-shell.md](./design/application-shell.md) defines semantic order, responsive
  composition, locale control and feedback outlets.
- [design/component-preview-catalogue.md](./design/component-preview-catalogue.md) defines the state,
  viewport, expansion, RTL and reduced-motion preview matrix.
- [design/reference-review.md](./design/reference-review.md) records which hierarchy is retained from
  canvases 1a–1d and which literals, external assets and inaccessible interactions are rejected.
- [quickstart.md](./quickstart.md) supplies runnable locale, fallback, offline, token, preview,
  responsive, dual-engine, axe and screen-reader validation scenarios.

## Post-Design Constitution Re-check

Phase 1 introduces no server, account, cross-origin runtime request, build persistence field, local
game-text translation, second theme, production preview surface or component-owned domain state.
Every requirement has a surface owner and validation path. English remains readable without a
network; the German catalogue is selectable only while complete; locale changes cannot mutate a
build. Product and preview targets consume the same tokens/components/providers. #309 remains an
upstream enhancement, while the accepted canonical/disclosed state lets feature 011 proceed.

The post-design gate remains **PASS with no exception**. Before task generation, retain `en` and `de`
as the accepted initial locale set; changing that product set requires a deliberate spec/plan update,
not an implementation-time substitution.

## Complexity Tracking

No constitutional violation requires justification. The tooling-only preview target is the minimum
reliable way to render every component/state under both browser engines without adding a production
route or Storybook's zone-based runtime. Transloco replaces a custom message engine; the small locale
store owns only selection, persistence and atomic document publication that the library does not.
