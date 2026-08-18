# Quickstart: Interface Foundations Validation

This is a validation/run guide for the implementation described by [plan.md](./plan.md). It does not
replace the contracts or task breakdown.

## Prerequisites

- Node.js version from `.nvmrc` and pnpm from `packageManager`.
- Chromium and Firefox matching the installed Playwright version, or compatible executables set in
  `E2E_CHROMIUM_PATH` and `E2E_FIREFOX_PATH`.
- Installed dependencies from the committed lockfile.
- A screen-reader environment for the manual protocols.

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
```

Expected: full TypeScript and Angular template strictness pass. No `zone.js` is required by the
production or preview Angular targets.

## Locale selection and persistence

Run the locale-store unit/integration tests and start the application:

```bash
pnpm run test
pnpm start
```

Validate in clean browser contexts:

1. `navigator.languages` beginning with `de-DE` selects `de`; root `lang`, messages, document title,
   numbers and dates are German.
2. An unsupported language selects English.
3. Explicit English/German selection persists across a reload and wins over browser language.
4. Malformed, unknown-version and removed-locale preference records are ignored safely.
5. Storage refusal keeps the explicit locale active in memory and reports non-persistence once.
6. Locale switching changes presentation only: active build, build revision, URL and saved bytes are
   unchanged.

Expected: no raw key, placeholder or blank appears and old-locale values are never shown under a
new root `lang`.

## Catalogue fallback and offline behavior

Exercise tests that return a missing/invalid German asset and an invalid/blank message value.

Expected: the complete bundled English catalogue becomes effective atomically, root language/title
agree, one localized fallback status appears and the application stays usable. After one successful
load/service-worker activation, repeat offline and verify the app shell, English and previously
loaded German remain readable. No request targets another origin.

## Formatting

Run formatter tests in English and German over decimal, integer, percentages, credits, metres,
kilometres, light years and dates.

Expected: tests inspect `formatToParts`/semantic units rather than pinning an entire CLDR string;
null/unavailable/incomplete values remain states, not zero; credits are not mapped to an ISO
currency; collator/search helpers use the effective locale.

## Almanac game text

Use 0.1.1 examples with:

- one German-localized module/effect/material name;
- one known identity whose helper returns `null` for German;
- one known experimental effect with no description even in English;
- a hull, slot/restriction/reward label and structured diagnostic queried through the 0.1.1 leaves.

Expected: localized package text appears without disclosure; an explicit locale miss with canonical
text shows that text with the correct canonical `lang` plus the shared German untranslated
disclosure; absent canonical text shows unavailable. No application catalogue contains game text or
a diagnostic translation. Re-run the
minimal reproduction linked from
[Almanac #309](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/309) after any package
upgrade.

## Component previews and policy gate

Run the preview host and automated policy tests using the scripts established by implementation
tasks:

```bash
pnpm run ui:preview
pnpm run test:scripts
```

Expected: every exported UI component/state is addressable at desktop/tablet/mobile profiles with
expanded, RTL and reduced-motion fixtures where relevant. Negative policy fixtures prove failures for
an owned template literal, visual literal outside tokens and missing preview state/profile. The
production build contains no preview route or preview chunk.

## Browser, axe and responsive matrix

```bash
pnpm run e2e
```

Expected Playwright projects:

- Chromium: desktop, tablet portrait, tablet landscape, mobile portrait, mobile landscape;
- Firefox: the same five profiles.

For every product/relevant state and preview declaration, expect axe to report no in-scope violation,
no document horizontal overflow, correct landmarks/headings/names/states/errors/units, at least the
shared target size, correct `lang`/`dir`, visible text equivalence and no essential hover. Repeat with
200% text, doubled copy, RTL and reduced motion.

Do not remove a project, state or scan to pass. Any axe rule disabled for constitutional scope must
map only to an explicitly excluded criterion and retain the feature's semantic assertions.

## Announcement behavior

Exercise initial, unchanged, stale, blocking and settled nonblocking events.

Expected:

- initial/unchanged/stale/unaffected content is silent;
- one new blocking error is announced assertively once;
- settled nonblocking changes coalesce into one polite summary for the matching revision;
- visible feedback remains readable outside the live outlets;
- a locale change does not replay old events, and the next new event uses the new locale.

## Manual screen-reader and zoom protocols

Run the versioned primary-capability scripts with NVDA/Firefox desktop and TalkBack/Chromium mobile;
add a tablet run where composition differs. Verify landmarks/headings, matching names, states/errors,
dialog/layer isolation, text equivalents, announcement urgency/deduplication, language switching and
untranslated disclosure.

At actual 400% browser zoom in both engines and at 200% text size, complete the same journeys in
desktop, tablet/mobile portrait and landscape. Expected: no document horizontal scrolling, obscured
content, truncated meaning or missing action. Wide content may scroll only inside a labelled owning
component.

Record conformance as WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and
2.4.11—never as an unqualified claim.

## Full gate

```bash
pnpm run check
```

Expected: formatting, strict type/template checks, production/preview boundary checks, script tests,
catalogue/token/text/preview policies, production build, at least 80% statements/branches/functions/
lines, all ten Playwright projects and all axe scans pass.
