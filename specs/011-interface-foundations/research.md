# Research: Interface Foundations

Research used the accepted feature specifications, the project constitution, all existing plan-time
screen definitions, `.design/Ship Builder.dc.html`, the installed Angular/Playwright toolchain,
package-registry peer metadata and `@elite-dangerous-almanac/core@0.1.1`. No production code
was changed during research.

## Initial shipped application locales

**Decision**: Ship complete application-owned catalogues for English (`en`, LTR) and German (`de`,
LTR). Keep Arabic-like RTL and doubled-copy catalogues as development/test fixtures only. A registry
defines each selectable locale's canonical tag, direction, self-name message and asset path.

**Rationale**: Story 3 requires a Commander to choose another shipped language and SC-006 requires a
matching browser language, so English-only is insufficient. German has broad 0.1.1 Almanac coverage
and usefully exercises longer application copy. Limiting the first release to one reviewed
non-English catalogue makes completeness and terminology auditable; the registry prevents this
choice from becoming an architectural ceiling.

**Alternatives considered**: English-only was rejected because no “another” language could be
selected. A pseudo-locale was rejected as a Commander-facing language. Shipping every Almanac locale
was rejected because Almanac game-name coverage is sparse and does not supply translations for
application-owned messages.

## Runtime message layer and atomic locale state

**Decision**: Use `@jsverse/transloco` 8.4 with a custom static-asset loader, wrapped by a signal-based
`LocaleStore`. A saved supported tag wins; otherwise inspect `navigator.languages` in order using
canonical exact then language matching; otherwise use `en`. Publish messages, formatter cache, root
`lang`, root `dir` and localized document title together. A locale change affects presentation only.

**Rationale**: Transloco's Angular 22-compatible peer range, runtime switching, interpolation and
fallback avoid building a message engine. The store keeps browser selection/persistence and atomic
document effects outside components. Angular `LOCALE_ID` and compile-time locale builds are static
and do not satisfy an in-session persisted selector.

**Alternatives considered**: Angular compile-time i18n was rejected for runtime switching. A custom
JSON interpolation/plural engine was rejected as unnecessary infrastructure. Binding components
directly to `navigator`, `document`, `localStorage` or Transloco mutable state was rejected as
untestable and non-atomic.

## Catalogue delivery, completeness and fallback

**Decision**: Keep canonical JSON sources under `src/app/i18n/locales/`. Import `en.json` into the
application bundle and copy the same directory to `/i18n/` as same-origin assets. The service worker
eagerly caches English/app-shell content and caches shipped catalogues under a versioned data group.
Build checks require all English keys and all selectable German keys to be present, nonblank and free
of placeholder markers. Unknown keys, blank values, invalid assets or failed loads never display;
the effective locale becomes bundled English and reports a localized fallback status once.

**Rationale**: English stays readable without a network and has one source. Same-origin assets permit
runtime selection without a server. Treating a failed catalogue as one atomic fallback avoids a
mixed-language document whose root `lang` would be wrong. Per-key fallback remains a defensive API,
but catalogue completeness makes it unreachable in accepted production assets.

**Alternatives considered**: Fetching English before bootstrap was rejected because first-run offline
must remain readable. Duplicating English in TypeScript and JSON was rejected as two sources.
Silently retaining a partially loaded requested locale was rejected for language semantics and raw
key risk.

## Locale-aware values and search helpers

**Decision**: Provide cached named helpers over `Intl.NumberFormat`, `Intl.DateTimeFormat`,
`Intl.PluralRules`, `Intl.DisplayNames` where supported and `Intl.Collator`. Named formatters cover
decimal/integer, percentage, credits, metres/kilometres/light years and dates. Credits and game units
without an appropriate `Intl` unit use localized message labels; no fictitious currency code is
introduced. Formatter caches are invalidated only by effective locale.

**Rationale**: Named functions make unit, rounding and availability semantics reviewable and avoid
Angular pipes bound to a static locale. `formatToParts` supports semantic tests without pinning whole
CLDR strings.

**Alternatives considered**: Implicit `toLocaleString()` was rejected because it can use the host
default rather than active locale. String concatenation inside components and treating credits as an
ISO currency were rejected.

## Almanac localization boundary

**Decision**: Call leaf helpers for module, blueprint, experimental-effect, material, ship,
manufacturer, slot, restriction, pre-engineered variant, engineering-group, effect description and
structured diagnostics. A known identity plus `null` means request canonical English/package text.
When present, show it with an application-localized, visible and programmatically associated
untranslated disclosure; when absent, show unavailable. Do not translate diagnostic codes/parameters
locally.

**Rationale**: 0.1.1 closes [#309](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/309).
Helpers accept BCP 47 locale strings and return `null` when text is unavailable rather than silently
falling back. Diagnostic helpers currently provide English results and explicitly return `null` for
other locales. Some experimental effects have no source description even in English, so FR-020 must
also preserve a true unavailable state.

**Alternatives considered**: Private game/diagnostic tables, parsing English messages, treating
canonical text as translated and replacing missing values with app text were rejected as forks of
package truth.

## Token architecture and dark theme

**Decision**: Define primitives and semantic CSS custom properties in `src/styles/tokens/`, with
Sass-only breakpoint/container constants there. All other styles consume tokens. Ship one dark token
set; no preference, media-selected light theme or theme storage exists. Use logical properties and
fluid/container layouts; preserve the existing component-style budget.

**Rationale**: CSS variables let the production and preview targets share exactly one source while
Sass constants cover compile-time media queries. Semantic tokens keep a component independent of a
raw palette. Logical properties serve RTL without a second layout.

**Alternatives considered**: Per-component Sass variables, copied canvas CSS, utility classes with
literal values and a light-theme scaffold were rejected because they create alternate visual
sources or unsupported preferences.

## Shared components and extension rule

**Decision**: Start `src/app/ui/` with application frame/heading/navigation, action/link, labelled
field/select/search, toggle/radio/segmented control, panel/card, definition/metric group,
status/notice/error/unavailable, disclosure, responsive collection, dialog/layer, language selector,
game-text disclosure and announcement outlet primitives. Components accept immutable presentation
inputs and emit typed intents. Capability work adds a reusable primitive here before consuming it.

**Rationale**: Existing feature designs already depend on these patterns. Centralizing semantics,
touch size, localization and states prevents every capability from rebuilding them. Presentation
inputs keep build/domain state out of the component library.

**Alternatives considered**: A complete speculative component suite was rejected in favor of the
patterns already required by accepted designs. Screen-local components and services injected into
shared UI were rejected.

## Component previews

**Decision**: Add a development/test-only zoneless Angular target that renders typed preview
declarations from `src/app/ui/previews/`. Every exported component declares each applicable
populated, empty, loading, error and disabled state (or an explicit inapplicable rationale), at
desktop, tablet and mobile widths. Cross-cutting doubled-copy, RTL, reduced-motion and long-token
fixtures apply to every relevant declaration. The preview target is absent from production routes
and output.

**Rationale**: A first-party target runs the exact providers, signals, tokens and Playwright checks
used by the application. Storybook 10.5.8 currently accepts Angular 22 but requires `zone.js`; this
application is zoneless. A typed manifest also gives FR-024 a complete machine-readable inventory.

**Alternatives considered**: Storybook was rejected because it adds a zone-based runtime and a
second viewport/accessibility configuration. Screenshot-only fixtures were rejected because they do
not expose semantics and interactions. A production `/design-system` route was rejected as product
surface and bundle leakage.

## Announcements and semantic feedback

**Decision**: Keep visible feedback in ordinary semantic content and use one visually hidden
assertive outlet plus one polite outlet. A blocking error is announced assertively once. Other
settled changes are coalesced into one polite localized summary keyed by event kind and revision.
Initial, unchanged, stale and unaffected content is silent. Components supply stable event identity;
the announcement service owns deduplication.

**Rationale**: Re-rendering visible regions as live content repeats unaffected values. Separate
outlets preserve urgency without interrupting ordinary changes. Stable revision keys make behavior
unit-testable.

**Alternatives considered**: Making whole panels live, announcing every signal update and hiding all
feedback exclusively in a live region were rejected.

## Responsive, accessible and browser verification

**Decision**: Configure five explicit profiles—1440×900 desktop, 834×1112 tablet portrait,
1112×834 tablet landscape, 390×844 mobile portrait and 844×390 mobile landscape—in Chromium and
Firefox. Add `@axe-core/playwright`; scan every product screen/relevant state and every preview state.
Also assert document overflow, landmarks/headings, names/states/errors, text alternatives, target
size and `lang`/`dir`. Exercise 200% text, equivalent narrow layouts, RTL, doubled copy and reduced
motion in both engines. Keep actual 400% browser zoom and screen-reader scripts as recorded manual
gates, including NVDA/Firefox desktop and TalkBack/Chromium mobile.

**Rationale**: Ten projects close the current Firefox and orientation gaps. Axe is a floor, not a
screen-reader proof, and browser zoom cannot be faithfully emulated cross-engine by CSS zoom.
Environment variables may point each engine to a compatible installed executable.

**Alternatives considered**: Chromium-only, portrait-only, axe-only, CSS `zoom` as browser zoom,
snapshot-only checks and disabling broad WCAG tag sets were rejected.

## Repository policy enforcement

**Decision**: Add `scripts/check-interface-foundations.mjs` with fixture-backed Node tests. Use the
installed Angular and TypeScript parsers to reject owned template/metadata display literals and
inline component styles; parse SCSS/CSS to reject colors and token-governed visual values outside
`src/styles/tokens/`; compare exported UI components with typed preview declarations and required
states/widths. Add catalogue completeness/placeholder checks. Run the checker and its tests inside
`pnpm run check`.

**Rationale**: FR-024 spans Angular templates, TypeScript metadata, styles and a preview manifest.
One repository-aware checker can name exact violations and test false-positive/negative fixtures.

**Alternatives considered**: Review-only enforcement was rejected as non-automated. Generic ESLint
or Stylelint alone was rejected because neither can join all four repository contracts. Regex-only
source scanning was rejected for parser-backed checks.

## Reference adaptation

**Decision**: Retain the reference's dense dark hierarchy, clear section grouping, wide-to-stacked
composition and restrained accent through semantic tokens. Replace inline literals, Google Font
requests, fixed pixel canvases, hover-only behavior, clickable `div`s, icon-only meaning, hard-coded
English and mobile omissions. Use system font stacks unless licensed same-origin font assets are
added and attributed through feature 012.

**Rationale**: The canvas is a hierarchy reference, not source code or a contrast/interaction
contract. Same-origin assets and tokens preserve the constitutional boundaries.

**Alternatives considered**: Copying canvas CSS/assets, runtime font CDNs and treating mobile as a
reduced card set were rejected.

## Planning resolution

No planning ambiguity remains. English and German are the accepted initial product locale set;
changing it is a product-plan revision. Almanac #309 is closed and consumed through its leaf APIs.
