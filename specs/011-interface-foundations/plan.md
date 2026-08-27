# Implementation Plan: Interface Foundations

**Branch**: `011-interface-foundations` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-interface-foundations/spec.md` and the four product
reference canvases in `.design/Ship Builder.dc.html`

## Summary

Build the shared interface layer every capability must use: the dark amber visual language shown in
the supplied Shipyard and Outfitting designs, rebuilt as contrast-audited design tokens and
presentation-only Angular components; a runtime English/German localization boundary with bundled
English fallback, locale-aware formatting and explicit Almanac text provenance; responsive shell,
layer and feedback semantics; and a development-only component catalogue that exercises every
component state.

The verification gate becomes an enforceable part of the foundation: strict TypeScript/templates,
AST-backed checks for untranslated application text and visual literals, preview-manifest coverage,
axe scans, and every primary journey in five viewport/orientation profiles in both Chromium and
Firefox. The product remains a static, zoneless, client-only application. Feature 011 adds no domain
route and no build state.

## Technical Context

**Language/Version**: TypeScript with `strict: true`; Angular standalone templates with
`strictTemplates: true`; SCSS; Node.js per the repository tooling configuration

**Primary Dependencies**: Angular and Router (zoneless), Angular service worker, RxJS,
`@jsverse/transloco` runtime localization, browser `Intl`, `@elite-dangerous-almanac/core` leaf i18n
exports, `@axe-core/playwright`, PostCSS and `postcss-scss`
_(Superseded 2026-08-26: Transloco was removed; `interpolate` in `src/app/i18n/locale-registry.ts` is the message engine. `research.md` is left as it was written, being a dated record of what was decided at the time.)_

**Storage**: None. The browser language setting is the only locale input and is read on every start.
Catalogues, formatter caches, preview fixtures and announcement history remain memory/static-asset
state and never enter builds, saved records, SLEF or build links.

**Testing**: Vitest through Angular's unit-test builder with the existing 80% statement/branch/
function/line thresholds; Node tests for repository policy checks; Playwright and axe across five
profiles in Chromium and Firefox; recorded screen-reader and actual-browser-zoom protocols

**Target Platform**: Modern evergreen desktop, tablet and mobile browsers; pointer, single touch and
screen reader; tablet/mobile portrait and landscape; LTR and RTL-safe layouts; same-origin static
deployment usable offline after first controlled load

**Project Type**: One production Angular SPA plus one development/test-only Angular component-preview
application. Both consume the same tokens, UI components and localization providers; the preview is
not a production route or output.

**Performance Goals**: Preserve the current 500 kB/1 MB initial and 4 kB/8 kB component-style
warning/error budgets; require no runtime request for English, at most one same-origin request for a
cold secondary locale and none for a warm switch; cache each named `Intl` formatter once per locale
and options; publish each locale change as one committed revision with no mixed-language frame

**Constraints**: No backend, accounts, telemetry, automatic cross-origin request, private game-text
translation, second theme, production preview surface or domain state inside UI components. English
must remain readable without a network. Every action and datum remains available at 200% text and
400% zoom without document horizontal scrolling. Touch targets use a 44 CSS-pixel design baseline.
Conformance is WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.

**Scale/Scope**: One application frame, locale store, formatter registry and announcement service;
initial complete application catalogues `en` and `de`; every exported `src/app/ui/` component and
applicable populated/default, empty, loading, error and disabled state; every product screen and
relevant state; ten browser/profile projects. Catalogue parity is an ongoing repository invariant:
every downstream capability that adds or changes application-owned messages updates both shipped
catalogues in the same change.

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1a–1d. Canvas decomposition, retained
visual decisions and required constitutional departures are recorded in
[design/reference-review.md](./design/reference-review.md); synthesized tablet/zoom behavior is in
[design/responsive-composition.md](./design/responsive-composition.md).

## Constitution Check

_GATE: Passed before Phase 0 research. No exception or justified violation is required._

| Principle                               | Design evidence                                                                                                                                                                         | Status |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| I. Client-Side Only                     | Locale/font assets and both Angular outputs are static; the preview is tooling-only; nothing is stored; service-worker requests are same-origin only.                                   | PASS   |
| II. Almanac Source of Truth             | Game nouns and diagnostics use installed-package leaf helpers; a locale miss becomes disclosed canonical package text or unavailable, never an application translation.                 | PASS   |
| III. Domain Logic Outside UI            | Locale startup, formatting and announcement policy live in stores/services/adapters; UI components accept immutable view state and emit typed intent.                                   | PASS   |
| IV. Lossless, Honest Builds             | Interface state never mutates a build; null/unavailable and untranslated boundaries stay explicit, and locale state is excluded from every build serialization.                         | PASS   |
| V. Desktop, Tablet and Mobile           | Wide, synthesized medium and compact compositions; ten browser/profile projects; axe, touch, reflow, text-size, reduced-motion and screen-reader/zoom protocols are specified.          | PASS   |
| VI. Commander's Language                | Browser-language startup, complete `en`/`de` assets, bundled English, atomic `lang`/`dir`, named `Intl` formatting and package-text disclosure are contracted.                          | PASS   |
| VII. One Design System                  | One audited dark token set and one `src/app/ui/` library supply product and preview; canvases inform hierarchy but none of their inline literals become production sources.             | PASS   |
| VIII. Tested Before It Ships            | Existing coverage thresholds remain; strict compilation, policy checks, ten Playwright projects, axe and versioned manual accessibility records join `pnpm run check`.                  | PASS   |
| IX. Specification Before Implementation | Every FR maps to a feature-owned surface or cross-feature contract; Phase 0 decisions resolve the locale, dependency, offline, preview, design and verification questions before tasks. | PASS   |

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
    ├── responsive-composition.md
    ├── screen-inventory.md
    └── search-visibility.md
```

`tasks.md` is Phase 2 output and is intentionally not created by this command.

### Source Code (repository root)

```text
src/
├── styles.scss
├── styles/
│   ├── tokens/
│   │   ├── _primitives.scss          # sole owner of governed visual literals
│   │   └── _semantic.scss            # one contrast-audited dark semantic set
│   ├── _fonts.scss                   # same-origin Barlow/JetBrains declarations and fallbacks
│   ├── _base.scss
│   └── _responsive.scss              # named layout/container primitives
└── app/
    ├── i18n/
    │   ├── locales/                   # canonical en.json and de.json
    │   ├── formatters/                # cached named Intl operations
    │   ├── game-text.presenter.ts
    │   ├── locale-registry.ts
    │   ├── locale.store.ts
    │   └── message.service.ts         # application facade over the message catalogue
    ├── application/
    │   └── updates/                   # what this session knows about its own version
    ├── platform/
    │   └── browser/                   # document/navigator/worker adapters
    └── ui/
        ├── announcements/
        ├── components/
        └── previews/                  # typed manifest; imported by preview app only

public/
└── fonts/                             # licensed WOFF2 subsets and licence material

projects/ui-preview/                   # tooling-only Angular application
├── src/
└── tsconfig.app.json

e2e/
├── accessibility/                     # axe, semantics, target and overflow helpers
├── manual/                            # screen-reader and actual-zoom protocols/results
├── application-update.spec.ts         # production-only; needs a real worker
├── interface-foundations.spec.ts
└── ui-preview.spec.ts

scripts/
├── check-interface-foundations.mjs
└── check-interface-foundations.test.mjs

ngsw-config.json
```

**Structure Decision**: Keep a single product application. A second Angular application renders
shared component fixtures only during development and testing, avoiding a production design-system
route and Storybook's zone-based runtime. Canonical locale JSON remains under `src/app/i18n/locales/`:
English is imported into the initial bundle, while Angular asset configuration copies all catalogues
to same-origin `/i18n/`. Feature 011 owns the application's single service-worker dependency,
registration and base configuration. It eagerly caches the shell and English and lazily caches a
secondary locale once requested. Downstream capabilities may extend that configuration with static
asset groups but must not register another worker or introduce another cache owner. It owns the
other side of that worker too: a session that keeps serving the version it installed is the cost of
being readable offline, so the same feature reports a newly published version, announces the restart
that applies it, and carries it out without asking. Product and
preview applications import the same UI source and token entry point.

## Phase 0: Research Conclusions

The complete decision records and alternatives are in [research.md](./research.md). The decisive
outcomes are:

- Treat canvases 1a/1c as wide and 1b/1d as compact composition evidence, not breakpoints. Add a
  synthesized medium/tablet mode and content-driven reflow while retaining every action and fact.
- Preserve the reference's dark amber hierarchy, condensed headings, body face and monospaced
  metrics through audited semantic tokens and same-origin licensed font subsets. Do not copy its
  inline CSS, fixed dimensions, remote requests, mock values or interaction markup.
- Retain complete English and German application catalogues. German stresses expansion and the
  canonical-game-text disclosure path; it is not claimed to have complete Almanac coverage. Their
  non-empty key sets and interpolation variables must remain identical across the whole application;
  every downstream message change updates both catalogues atomically.
- Add Transloco as a runtime message engine behind an application-owned signal store/facade. _(Superseded 2026-08-26: Transloco was removed; `interpolate` in `src/app/i18n/locale-registry.ts` is the message engine. `research.md` is left as it was written, being a dated record of what was decided at the time.)_ A
  browser-language match wins over bundled English; there is no third input. Locale publication is
  atomic and presentation-only.
- Add and register the application's one Angular service worker here: shell and English are eager
  assets, while another shipped locale is a lazy versioned asset available offline after it has been
  opened. Runtime never requests another origin. Feature 001 and later capabilities extend this
  feature-owned configuration for static assets without adding a registration or cache owner.
- Centralize named `Intl` formatters. Credits and light years use localized whole-message/unit
  patterns because neither is an appropriate ISO currency/standard `Intl` unit.
- Use the installed Almanac leaf locale helpers. A known identity returning `null` is retried at the canonical
  package language and visibly disclosed; no canonical text becomes unavailable.
- Build a first-party tooling-only Angular preview app and typed manifest. Every exported component
  accounts for required states and profiles; expanded, RTL, reduced-motion, untranslated and
  unavailable variants are first-class fixtures.
- Use one assertive and one polite announcement outlet with stable event/revision deduplication.
  Visible feedback remains ordinary semantic content.
- Generate ten Playwright projects from five profiles and two engines. Add axe and explicit semantic,
  touch-target, overflow, text-equivalence and locale assertions. Automate 200% text and a 320 CSS-px
  reflow proxy; record actual 400% zoom and screen-reader runs as manual gates.
- Add an AST-backed repository policy checker. Angular/TypeScript parsers inspect display text and
  template metadata; direct PostCSS dependencies inspect SCSS; a typed ledger reconciles UI exports
  and preview states. Duplicated visual patterns remain an architecture/review gate, not a claim the
  static checker can infer.
- Preserve structural performance guarantees and existing bundle budgets instead of inventing a
  wall-clock threshold absent from the specification.

No planning clarification marker remains.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines locale/catalogue state, formatter requests,
  package-text presentation, announcements, tokens, component previews and verification coverage.
- [contracts/localization-and-formatting.md](./contracts/localization-and-formatting.md) freezes
  selection precedence, atomic fallback, `Intl` boundaries and exact Almanac behavior.
- [contracts/design-system-and-previews.md](./contracts/design-system-and-previews.md) freezes token
  ownership, reference adaptation, component boundaries and complete preview declarations.
- [contracts/feedback-and-semantics.md](./contracts/feedback-and-semantics.md) freezes landmarks,
  visible/matching names, relationships, text equivalence and deduplicated announcements.
- [contracts/responsive-accessibility-verification.md](./contracts/responsive-accessibility-verification.md)
  freezes the ten-project matrix, axe/static gates, 200%/320px automation and manual 400%/AT records.
- [design/screen-inventory.md](./design/screen-inventory.md) maps all FRs to the embedded application
  frame, product surfaces that consume the foundation and the tooling-only preview catalogue.
- [design/application-shell.md](./design/application-shell.md) defines semantic order, language entry,
  contextual actions, feedback outlets and adaptive layer composition.
- [design/responsive-composition.md](./design/responsive-composition.md) derives wide, medium and
  compact rules from the four reference canvases and defines tablet, landscape, zoom and RTL cases.
- [design/component-preview-catalogue.md](./design/component-preview-catalogue.md) defines stable
  fixture addressing and the required state/profile/variant ledger.
- [design/reference-review.md](./design/reference-review.md) records the exact 1a–1d patterns retained
  and the fixed-layout, remote-asset, contrast, target, semantics and localization mechanics rejected.
- [design/search-visibility.md](./design/search-visibility.md) records the 2026-08-27 search-engine
  analysis: what a crawler was previously served on all four routes, the six findings that were
  acted on, the three assets and one build step the remaining omissions wait on, and what was
  deliberately not done and why (FR-027).
- [quickstart.md](./quickstart.md) provides runnable validation scenarios for strict compilation,
  catalogues, offline fallback, formatting, package text, previews, policy checks, browsers, axe,
  screen readers and zoom.

## Post-Design Constitution Re-check

Phase 1 introduces no server, account, external runtime service, build-persistence field, private
game-data table, light theme, production preview route or component-owned domain rule. Locale changes
cannot alter the active build. Bundled English keeps the application readable; a validated German
catalogue is published only as a complete snapshot. Build validation enforces identical non-empty
keys and interpolation variables for both shipped catalogues after every downstream capability
change. Almanac text remains package-owned. Feature 011 owns the sole service-worker registration
and base configuration; downstream static assets only extend it. The four reference canvases are
decomposed into shared semantics and adaptive layouts rather than copied.

Every requirement has a surface owner and verification path. Product and preview applications share
the exact token, component and localization sources. The post-design gate remains **PASS with no
constitutional exception**.

## Complexity Tracking

No constitutional violation requires justification. The tooling-only Angular preview application is
the minimum reliable way to render the real zoneless component library in both browser engines
without adding product surface or a separate zone-based component runtime. Transloco supplies the
message engine; the application store owns only startup selection and atomic document state that
the library cannot own. _(Superseded 2026-08-26: Transloco was removed; `interpolate` in `src/app/i18n/locale-registry.ts` is the message engine. `research.md` is left as it was written, being a dated record of what was decided at the time.)_ The service worker supplies the constitutional offline boundary for
static locale assets.
