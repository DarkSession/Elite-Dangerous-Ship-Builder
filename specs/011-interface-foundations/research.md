# Research: Interface Foundations

Research covered the accepted feature specification and constitution, the current Angular workspace,
the installed Almanac 0.1.3 declarations, existing feature plans and all four canvases in
`.design/Ship Builder.dc.html`. The design was also rendered and inspected. No production code was
changed during research.

## Reference design boundary

**Decision**: Use canvases 1a–1d as the visual hierarchy and responsive-composition source. Canvas 1a
defines wide Shipyard composition, 1b compact Shipyard, 1c wide Outfitting and 1d compact Outfitting.
Decompose their repeating shell, action, collection, field, tab, status, metric and adaptive-layer
patterns into feature 011 components. Domain composites and routes remain with features 001–010 and 012.

**Rationale**: The supplied design is the only finished product visual direction. It consistently
uses a dense dark surface, restrained amber emphasis, condensed headings, monospaced metrics and
wide-to-compact rearrangement. It contains no tablet, landscape, zoom or RTL canvas, so those cases
must be derived rather than guessed during implementation.

**Alternatives considered**: Ignoring `.design` would discard accepted hierarchy. Copying the HTML
would copy fixed 1320/1560/390 pixel canvases, mock game facts, hard-coded English, inline literals,
remote requests and nonsemantic interaction markup.

## Responsive modes and adaptive layers

**Decision**: Treat the reference widths as examples, not breakpoints. Define content-driven wide,
medium and compact composition modes. Synthesize medium/tablet behavior from the wide master-detail
and compact drill-in patterns. A simple task adapts from centered dialog to bottom sheet; a complex
collection/editor adapts to a full-height compact layer. Short landscape and 400% zoom may select the
compact composition without changing semantic order or capability.

**Rationale**: The constitution makes tablet, both mobile/tablet orientations, 200% text and 400%
zoom first-class. Stable DOM order, logical CSS properties and container/media queries allow the
same semantics to recompose without separate feature implementations.

**Alternatives considered**: Scaling/cropping a canvas, using fixed device breakpoints alone, hiding
wide panels on narrow screens and making mobile a reduced feature set all violate FR-011/014.

## Visual tokens, fonts and assets

**Decision**: Derive a compact primitive scale and one semantic dark token set from the reference,
then audit every intended text/background and meaningful non-text pair before accepting it. Retain
Barlow Condensed for headings, Barlow for body copy and JetBrains Mono for metrics by shipping
licensed WOFF2 subsets and their licence material from the fonts' upstream releases as same-origin
assets. Always declare complete system fallbacks and verify shipped-locale glyph coverage.

**Rationale**: The reference defines color variables but leaves spacing, type, radius, elevation and
motion in hundreds of inline values. Several small-text alpha combinations are below 4.5:1 and many
meaningful borders below 3:1; its tokens therefore cannot be copied. Runtime Google Fonts and remote
material icons also violate the outbound-request boundary. The type hierarchy is nevertheless a
recognizable part of the supplied design and can be retained locally under the fonts' OFL terms.

**Alternatives considered**: Runtime font CDNs and `edassets.org` icons were rejected. A system-only
stack was acceptable technically but needlessly discarded a strong design decision. Copying the
reference's many near-duplicate alpha tokens was rejected in favor of semantic state tokens.

## Initial shipped locales

**Decision**: Ship complete application-owned English (`en`) and German (`de`) catalogues. English is
the fallback. German becomes selectable only after every application message and interpolation has
reviewed wording. Expanded-copy and RTL pseudo-catalogues remain test fixtures and are never shipped
or persisted as Commander choices.

**Rationale**: The accepted story requires choosing another shipped language and SC-006 requires a
browser-language match, so one product locale does not satisfy this feature. Existing feature 007
preview planning already depends on English/German expansion fixtures. German is useful for text
expansion and for exercising canonical-game-text disclosure; it is not selected because Almanac has
complete German text. Local 0.1.3 probes found German for 0/48 ship names, 1120/1199 modules,
128/146 materials, 55/107 blueprints and 84/86 experimental effects. Those gaps are expected package
misses, not permission for application translations.

**Alternatives considered**: English-only conflicts with the accepted feature. Spanish has better
Almanac ship/material coverage and is a reasonable future locale, but changing the already referenced
English/German product set would require coordinated plan updates. A pseudo-locale cannot be offered
as a human language.

## Runtime localization and locale state

**Decision**: Add `@jsverse/transloco` 8.4 as the runtime message engine behind an application-owned
signal `LocaleStore` and message facade. Use Angular's app initializer to resolve the valid startup
snapshot before root content renders. Saved supported preference wins; otherwise match
`navigator.languages` by canonical exact tag then base language; otherwise use English. The store is
the only code that changes active messages, document title, root `lang`/`dir` and formatter locale.

**Rationale**: Transloco supports Angular 22/RxJS 7, runtime loading/switching and fallback without a
zone peer. A facade prevents components from coupling to library mutable state and lets publication
be one testable revision. Angular compile-time localized builds do not satisfy a persisted in-session
switch. See the official [Transloco configuration](https://jsverse.gitbook.io/transloco/getting-started/config-options)
and [language API](https://jsverse.gitbook.io/transloco/core-concepts/language-api).

**Alternatives considered**: Angular compile-time-only i18n cannot switch in session. A custom
interpolation/plural engine would reimplement solved message behavior. Transloco's persistence plugin
does not provide the required versioned, injected, failure-tolerant storage boundary.

## Catalogue delivery, completeness and offline behavior

**Decision**: Keep canonical JSON catalogues under `src/app/i18n/locales/`. Import English into the
initial JavaScript bundle and copy all catalogues to same-origin `/i18n/`. Add the version-matched
Angular service worker: eager asset groups cache shell/fonts/English; a lazy asset group caches a
secondary locale after first request. Preload and validate a requested catalogue before publishing
it. A load, shape, blank-value or interpolation mismatch atomically publishes bundled English and
one localized fallback status.

**Rationale**: English must be readable without a network and the application must work offline after
its first controlled load. A previously opened locale must also remain available offline. Angular's
asset groups are versioned build assets, not a data/API cache. Build checks can enforce exact key and
placeholder parity; runtime validation protects against a stale/corrupt asset. See Angular's
[service-worker setup](https://angular.dev/ecosystem/service-workers/getting-started) and
[configuration](https://angular.dev/ecosystem/service-workers/config).

**Alternatives considered**: Fetching English before rendering risks a raw/blank first frame.
Duplicating English in TypeScript and JSON creates two sources. Publishing a partial secondary
catalogue creates a mixed-language document with a false root language.

## Locale-aware formatting

**Decision**: Provide cached named operations over `Intl.NumberFormat`, `Intl.DateTimeFormat`,
`Intl.PluralRules`, `Intl.DisplayNames` and `Intl.Collator`. Define fraction input for percentages and
explicit timezone/precision per date/number contract. Use `Intl` units for metres/kilometres. Credits
and light years use a localized whole-message/unit pattern around an `Intl`-formatted number because
credits are not ISO currency and `light-year` is not a supported `Intl.NumberFormat` unit.

**Rationale**: Named operations make rounding, units and null handling reviewable and follow the
effective runtime locale. `formatToParts` supports stable semantic tests without pinning an entire
CLDR string.

**Alternatives considered**: Angular pipes bound to a static `LOCALE_ID`, implicit
`toLocaleString()`, component string concatenation and a fictitious credit currency were rejected.

## Almanac localization boundary

**Decision**: Import the relevant 0.1.3 leaf helper for module, blueprint, effect, effect description,
engineering group, material, micro-resource, ship/manufacturer, slot/restriction, pre-engineered
variant and structured diagnostic text. A request carries a known package identity and any canonical
package field. Query the active locale first; on `null`, query canonical English or use the package's
canonical field. Render found canonical text with associated untranslated disclosure and an accurate
`lang`; render no canonical value as unavailable.

**Rationale**: The helper contracts return `string | null`; `null` can mean an unsupported locale,
unknown identity or absent source text. The presenter therefore needs identity provenance from the
calling package projection rather than guessing from null. Diagnostics, slots, manufacturers and
effect descriptions are currently English-only or sparse. This is exactly the FR-020 boundary.

**Alternatives considered**: A local game/diagnostic table, parsing canonical English, displaying raw
identities and presenting canonical text as translated would all fork or misrepresent package data.

## Component and token architecture

**Decision**: Put primitive and semantic tokens under `src/styles/tokens/`; every other stylesheet
uses semantic variables and named layout primitives. Put reusable presentation components under
`src/app/ui/`. Feature 011 initially supplies shell/heading/action, labelled fields, choice/tab
groups, panel/card, semantic collection, metric/status/unavailable, dialog/sheet/layer, language,
game-text disclosure and announcement primitives. Capability-specific composites extend this same
library before use.

**Rationale**: These are the patterns actually repeated in canvases 1a–1d and required by accepted
feature designs. Immutable inputs and typed intents keep domain state outside components. One library
also makes semantics, target size, contrast and preview states enforceable.

**Alternatives considered**: Screen-local visual primitives, domain services inside shared UI, a
speculative full component suite and a second theme were rejected.

## Component preview catalogue

**Decision**: Add a second, tooling-only Angular application that imports the production UI library,
tokens and localization providers. A typed manifest gives every exported component stable component/
state ids and accounts for populated/default, empty, loading, error and disabled with a fixture or
nonempty N/A rationale. Cross-cutting fixtures cover expanded text, RTL, reduced motion, localized
formats, canonical-untranslated, unavailable and long unbroken content.

**Rationale**: The host renders the exact zoneless Angular components in both Playwright engines and
keeps FR-004/024 machine-auditable. Angular 22 is zoneless by default. Storybook's Angular runtime
would add zone, platform-dynamic, animation and alternate build configuration dependencies that this
repository otherwise does not need. See Angular's [zoneless guide](https://angular.dev/guide/zoneless).

**Alternatives considered**: A production `/design-system` route expands product surface. Static
screenshots cannot prove semantics or interactions. Storybook adds a second runtime for no required
capability.

## Feedback and announcements

**Decision**: Render visible feedback as ordinary semantic content and maintain one hidden assertive
outlet and one polite outlet in the application frame. Blocking errors publish one assertive bounded
summary. Other settled changes coalesce to one polite summary. Stable event kind and source revision
deduplicate re-renders, stale outcomes and unaffected values. Locale changes clear old outlet text
without replaying events.

**Rationale**: Making entire panels live repeats unrelated statistics and interrupts current speech.
Visible feedback must remain available to every user, while a small event record makes urgency and
deduplication independently testable.

**Alternatives considered**: Whole-panel live regions, announcing each signal update and feedback
that exists only in a hidden outlet were rejected.

## Browser, accessibility and responsive verification

**Decision**: Generate five profiles—1440×900 desktop, 834×1112 tablet portrait, 1112×834 tablet
landscape, 390×844 mobile portrait and 844×390 mobile landscape—for Chromium and Firefox. Every
primary journey runs in all ten projects; desktop uses click and the eight touch profiles use tap.
Every relevant product state and preview declaration runs axe plus explicit landmark, heading, name,
state, relationship, text-equivalence, target-size, locale and document-overflow assertions.

Automate 200% root text and a 320 CSS-pixel reflow proxy in both engines. Emulate RTL, expanded copy
and reduced motion. Keep actual 400% browser zoom and NVDA/Firefox, TalkBack/Chromium, and materially
different tablet screen-reader runs as versioned manual records. Axe remains a floor, as the official
[Playwright accessibility guide](https://playwright.dev/docs/accessibility-testing) states.

**Rationale**: Ten projects close the current Firefox and orientation gaps without inventing a
desktop orientation pair. A 390-pixel mobile viewport is not the WCAG 400%-reflow proxy. CSS zoom is
not equivalent to actual browser zoom, and Playwright cannot automate real assistive-technology
speech. The 320-pixel relationship follows WCAG 2.2
[Reflow](https://www.w3.org/TR/WCAG22/#reflow).

**Alternatives considered**: Chromium-only, portrait-only, axe-only, screenshot-only, CSS zoom and
removing a project to control suite time were rejected. CI may shard the unchanged matrix.

## Repository policy enforcement

**Decision**: Add a fixture-tested Node checker. Use TypeScript ASTs and Angular `parseTemplate` for
owned literal text, visible/accessibility attributes, inline templates and formatter display paths.
Add direct PostCSS and `postcss-scss` dependencies for property-aware checks of color, typography,
spacing, radius, elevation, border and motion values outside token sources. Reconcile exported UI
components with the typed preview manifest and required state rationale. Validate catalogue key,
blank and interpolation parity and reject skipped/focused tests.

**Rationale**: FR-024 spans several syntaxes. The current workspace has TypeScript/Angular parsers but
no direct SCSS parser; claiming otherwise would make the plan non-runnable. AST scopes can allow
tests, catalogues, package text bindings, structural punctuation and documented geometry without a
blanket path exclusion.

**Alternatives considered**: Review-only and regex-only checks are weak. Generic lint packages alone
cannot reconcile exported components with preview declarations. Detecting visual-pattern duplication
automatically is not credible; FR-005 remains a documented architecture/review gate.

## Performance validation

**Decision**: Gate structural behavior: existing bundle/style budgets remain, English makes zero
locale requests, a cold secondary locale makes at most one same-origin request, a warm switch makes
none, formatter construction is cached by locale/options and each switch produces one committed
snapshot. Do not add a wall-clock threshold.

**Rationale**: The specification supplies no latency SLO. The previous 100 ms/4×-CPU target was an
invented, environment-sensitive requirement. Request counts, cache construction and atomic revision
behavior are deterministic and directly protect the intended experience.

**Alternatives considered**: A cross-browser stopwatch gate was rejected as flaky until product
requirements define a measurable latency target.

## Planning resolution

All dependency, locale, design, offline, responsive, preview, accessibility and enforcement choices
are resolved. English/German is the initial application locale set; changing it is a coordinated
product-plan revision, not an implementation-time choice.
