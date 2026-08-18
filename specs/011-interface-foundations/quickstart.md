# Quickstart: Validate Interface Foundations

This guide validates the implementation described by [plan.md](./plan.md). Commands for the new
preview/offline/policy targets become available during implementation; the contracts, not this guide,
remain authoritative.

## Prerequisites

- Node.js from `.nvmrc` and the `packageManager` pnpm version.
- Chromium and Firefox matching Playwright, or compatible executables in `E2E_CHROMIUM_PATH` and
  `E2E_FIREFOX_PATH`.
- A screen-reader environment for the manual protocols.

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
```

Expected: TypeScript `strict` and Angular `strictTemplates` pass for product, tests, E2E and preview.
Neither Angular application requires `zone.js`.

## Design and static policy

```bash
pnpm run test:scripts
pnpm run build
```

Expected:

- negative checker fixtures fail for a literal Angular display string, visible/accessibility
  attribute, governed SCSS literal and missing preview state;
- positive fixtures accept structural punctuation, token calculations and dynamic package text;
- English/German keys, nonblank values and interpolation sets match;
- every exported `src/app/ui/` component has required state fixtures or a valid N/A reason;
- strict production budgets remain unchanged and production output contains no preview route/chunk;
- no product stylesheet/font/SVG emits an automatic cross-origin request.

Visually compare the implemented foundation to `.design/Ship Builder.dc.html`: retain the dark amber
hierarchy, typography roles, density and wide-to-compact grouping while confirming the prototype's
tiny/faint/hover-only/nonsemantic mechanics are absent.

## Locale startup, switching and persistence

Run locale/store unit tests and start the product app:

```bash
pnpm run test
pnpm start
```

In clean browser contexts verify:

1. `navigator.languages` beginning with `de-DE` selects the reviewed German catalogue.
2. An unsupported browser language selects bundled English with no locale request.
3. An explicit English/German selection persists across reload and wins over browser language.
4. Malformed, unknown-version and removed-locale preference records are ignored safely.
5. Storage denial keeps the explicit locale for the session and reports non-persistence once.
6. A secondary-catalogue load/shape/blank/placeholder failure commits complete English once.
7. Messages, title, `lang`, `dir` and formatters change in one revision; no mixed frame/raw key flash.
8. Active build bytes/revision, URL, save state and undo history remain unchanged.

Expected request counts: English zero; cold German at most one same-origin `/i18n/` request; warm
German zero.

## Production offline behavior

```bash
pnpm run e2e:offline
```

Use a production configuration, wait for the service worker to control the page, open German once,
take the browser context offline and reload.

Expected: shell/fonts/English work offline after first controlled load; the previously opened German
catalogue also works; a never-opened unavailable locale falls back atomically to readable English;
no request targets another origin.

## Formatting

Run named formatter tests for English and German over integers, decimals, fraction-percent, metres,
kilometres, credits, light years, dates and collation.

Expected: tests inspect `formatToParts`/semantic units; fraction-percent and timezone contracts are
explicit; one `Intl` instance is cached per locale/operation/options; null/unavailable/incomplete do
not become zero; credits are not ISO currency and light years are not passed as an unsupported Intl
unit.

## Almanac text boundary

Use 0.1.2 fixtures for:

- a German-localized module/material/effect;
- a known hull/manufacturer/slot/diagnostic returning `null` for German but canonical English text;
- a known effect description with no canonical source text;
- an unknown identity.

Expected: localized package text appears normally; a locale miss shows canonical package text with
accurate `lang` and localized untranslated disclosure; absent/unknown canonical text shows
unavailable. No application catalogue contains a game name/diagnostic translation and no raw symbol
becomes fallback.

## Component preview catalogue

```bash
pnpm run ui:preview
pnpm run e2e -- ui-preview.spec.ts
```

Expected: each exported component/state id renders the production component and tokens. The global
projects cover desktop, tablet portrait/landscape and mobile portrait/landscape in both engines.
Relevant fixtures add doubled copy, RTL, reduced motion, German formats, canonical-untranslated,
unavailable, long identities and nested relationships. Axe/semantic/target/overflow assertions pass;
screenshots are evidence only.

## Product browser and accessibility matrix

```bash
pnpm run e2e
```

Expected project names cover:

- Chromium: desktop, tablet portrait, tablet landscape, mobile portrait, mobile landscape;
- Firefox: the same five profiles.

Every primary journey uses click on desktop and tap on touch projects. Every ledger state runs axe
plus named landmark/heading/name/state/relationship/text-equivalence/target/locale/overflow checks.
Repeat relevant states with 200% text, 320 CSS-pixel reflow, doubled copy, RTL and reduced motion.
There is no essential hover, multipointer path, document horizontal scrolling, hidden action or
meaning carried only by color/shape/position/motion.

Do not remove a project, state or scan to pass. A future axe exclusion must prove through installed
metadata that the rule maps only to a named constitutional keyboard exclusion; broad tag/region
suppression is prohibited.

## Announcement behavior

Exercise initial, unchanged, stale, blocking and settled nonblocking events.

Expected:

- initial/unchanged/stale/unaffected content is silent;
- one new blocking error publishes one assertive bounded summary;
- settled nonblocking changes coalesce to one polite summary for the owning revision;
- visible feedback remains ordinary semantic content;
- switching locale clears old outlet text without replay and the next new event uses the new locale.

## Manual screen-reader and zoom records

Run the versioned protocols for every primary capability with NVDA/Firefox desktop and
TalkBack/Chromium mobile; add tablet when composition differs. Record versions, orientation/state,
expected and actual speech/behavior, date and result. Verify landmarks/headings, visible/matching
names, state/errors, layer isolation, visual text equivalents, announcement urgency/deduplication,
language switching and untranslated disclosure.

Run the same primary journeys at actual 400% browser zoom in Chromium and Firefox, plus pointer and
touch in both tablet/mobile orientations. Expected: complete actions/content, no document horizontal
scroll, obscured content or truncated meaning; wide data scrolls only inside a labelled owning
component.

Any conformance statement reads “WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3,
2.4.7 and 2.4.11.”

## Full gate

```bash
pnpm run check
```

Expected: formatting, strict compilation, production/preview boundary, policy/catalogue tests,
production/offline build, at least 80% statements/branches/functions/lines, all ten Playwright
projects and all in-scope axe scans pass with no skip/focus/quarantine.
