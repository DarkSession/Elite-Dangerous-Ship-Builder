# Contract: Help, Provenance and Navigation

This contract defines the user-facing `/help` capability and every route into it.

## Route and availability

- `/help` is an eagerly imported top-level route in the initial Angular bundle.
- It requires no active build, storage availability, network, authentication or package lookup.
- Opening or closing help never changes active build state, named/working records, language choice,
  SLEF, history payloads or the canonical `/build#b.…` data.
- Browser Back returns to the source capability. The help route does not duplicate or append a build
  fragment.
- Once feature 001's app shell is installed, direct offline reload of `/help` exposes all help,
  identity and legal content without route-specific requests.

## Entry surfaces

1. The shared application shell exposes a visible, localised Help / data-and-licences action from
   every route and no-build state.
2. Standard full-screen/modal layer headers retain that action when they obscure the shell.
3. Package-backed artwork/value regions use a shared contextual provenance action when relevant.
   They point to the common help/provenance content and do not own duplicate legal text.

Every entry has a visible name matching its accessible name, meets the shared touch target, works by
pointer/touch and does not depend on hover. FR-011 permits a general help destination; contextual
entries may additionally target a stable local section.

## Required document order

The semantic reading order is:

1. page title and short localised purpose;
2. in-page section navigation;
3. help topics;
4. application and bundled-Almanac identity facts;
5. catalogue/calculation/artwork/data provenance and package-defect reporting;
6. legal coverage index;
7. complete application licence;
8. complete Almanac licence;
9. complete Almanac third-party notices.

Layout may place adjacent regions in columns only when that does not change DOM/reading order. Narrow,
zoomed and expanded-text layouts use one complete stack.

## Required help topics

The localised content describes only accepted current behavior:

- shared build-link fragment privacy and the consequence of deliberately sharing the URL;
- absence of accounts, uploads and telemetry;
- local/session browser persistence and what clearing site data removes;
- bundled offline content versus same-origin artwork cached after opening;
- completed 100% engineering grades and partial-import normalisation;
- catalogue hull facts versus fitted-build results/viewing conditions;
- Almanac ownership of catalogue values and calculations.

Raw message keys, empty content, future promises and private game-text translations are prohibited.

## Identity and provenance

- Show “Application version” and “Bundled Almanac version” as separate facts sourced from the
  generated manifest.
- A non-release build also shows a visible non-release label and build ID. It is never visually or
  textually presented as a release.
- Provenance says only that the bundled Almanac supplies catalogue data and calculations; it makes no
  claim about live-game or live-catalogue currency.
- Localised coverage descriptions distinguish application MIT terms, Almanac code terms, Frontier
  game-data/imagery terms and other upstream terms. No description says application MIT grants rights
  to package artwork/game data.

## Legal presentation

- Render every `LegalDocument.exactText` as text content in an English-language region; do not use
  `innerHTML`, a Markdown renderer, iframe or translated copy.
- Localised framing names the artifact owner, source artifact, covered material and that the legal
  text remains in its original English.
- Long documents may use native `details`/`summary`; all exact text is already in the DOM/bundle and
  expansion performs no fetch.
- Preformatted text wraps and long URLs/tokens break within the content area. Document-level
  horizontal overflow is prohibited at supported viewports, 200% text and 400% zoom.
- There is no runtime missing/loading/error legal state. Such input is a build failure. Component
  previews cover release/non-release, each document, collapsed/expanded, alternate locale, long
  expansion/RTL framing and all supported widths.

## External package-defect action

The only Almanac issue action is a native external link created from the generated exact
`package.json#bugs.url`:

```text
https://github.com/DarkSession/Elite-Dangerous-Almanac/issues
```

- Its visible and accessible text says it reports an Almanac package data/calculation defect and
  leaves the application.
- It uses `rel="noreferrer noopener"` and is inert until a Commander activates it.
- No programmatic open, prefetch, beacon or validation request is allowed.
- No query, fragment, build URL/payload, SLEF, ship/module identity, current route or local data is
  appended.
- Application behavior/translation/UI defects are not directed to this destination.

Tests intercept the navigation so they can prove the exact destination without requiring network.

## Accessibility and localisation

- One `main`, one visible `h1`, nested headings, semantic definition lists/articles and associated
  source/language/coverage descriptions define the screen-reader order.
- Meaning never depends on colour, icon, shape, placement, collapsed state or external-link ornament.
- The exact legal region has `lang="en"`; the active app language and direction apply only to framing
  and help text. Bundled English fallback prevents unreadable app labels offline.
- The page and entry actions survive translation expansion and RTL framing while preserving legal
  text direction/language.
- Automated axe and semantic/no-overflow checks run for overview and every expanded document in all
  Chromium/Firefox viewport/orientation projects. Manual screen-reader journeys verify navigation,
  identities, language disclosure, document expansion and the external-warning relationship.
- Any conformance statement names excluded criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and
  2.4.11.
