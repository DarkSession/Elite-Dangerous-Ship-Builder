# Contract: Localization and Formatting

## Ownership boundary

- Application-owned display text resolves through the typed message facade and active catalogue.
- Game nouns, descriptions and package diagnostics come from Almanac leaf helpers/records and never
  from application catalogues.
- Raw keys, blank values, unmatched interpolation placeholders, internal exceptions and raw package
  identities never become display fallback.
- Message values are plain text. Components do not treat catalogue values as trusted HTML.

## Production locale registry

The initial registry contains complete `en` and `de` catalogues. Each entry supplies canonical tag,
base language, direction, self-name key and same-origin asset path. English is the only fallback and
is imported into the initial bundle. German is selectable only when build-time key, nonblank,
placeholder and reviewed-wording gates pass.

Completeness is repository-wide and continuous, not a one-time bootstrap condition. Any downstream
capability that adds or changes an application-owned message must update both shipped catalogues in
the same change. The build accepts only identical non-empty key sets and matching interpolation
variables; an invalid candidate never replaces any part of the current snapshot.

Test-only expanded-copy and RTL providers are not production registry entries and cannot be stored.

Adding a locale requires:

1. reviewed application wording for every English key and matching interpolation set;
2. registry/self-name entries without a private game-text table;
3. browser match, explicit selection, persistence, cold/warm request, offline and fallback tests;
4. responsive, glyph and RTL coverage for any new direction/script/expansion behavior.

## Selection precedence and persistence

1. Read the versioned preference through the storage adapter. A current supported tag wins.
2. Otherwise inspect `navigator.languages` in order, canonicalizing each entry and matching exact
   shipped tag before base language.
3. Otherwise use bundled English.
4. An explicit selection creates a candidate. Persist its requested tag only after a complete ready
   snapshot commits with `effectiveLocale === requestedLocale`. A fallback retains the prior stored
   preference and offers retry. A failed write keeps the ready in-memory choice and reports
   non-persistence once.

Malformed JSON, unknown versions, removed locales, denied storage and failed reads/writes remain
bounded adapter outcomes. The full browser language list is never persisted or uploaded.

## Candidate validation and atomic publication

The locale store loads a candidate without changing the current snapshot. It validates locale
identity, catalogue shape, exact English key set, nonblank values and interpolation parameters. One
commit then publishes messages, effective locale, formatter cache, translated document title,
`<html lang>` and `dir` together.

If a secondary catalogue cannot load or validate, one commit publishes bundled English as the
effective fallback and a stable localized reason. It never publishes a partial/mixed catalogue.
English requires no runtime request. A cold secondary locale makes at most one same-origin request;
a warm/service-worker-cached switch makes none.

Locale publication may rebuild presentation/search projections. It cannot mutate an active build,
build revision, URL, SLEF, saved record or undo history.

## Message resolution

- English JSON defines the typed key and parameter schema.
- Production builds fail for missing, extra, blank or placeholder-incompatible German values.
- A runtime unknown key is an application defect and resolves to the bundled English generic
  unavailable message; it never echoes the key. The generic key is part of the same validated English
  schema, not a hard-coded component literal.
- Application-owned document title, metadata exposed to users and service-worker/offline messages use
  the same catalogue boundary.

## Named formatters

Components request named formatting operations and never construct `Intl` objects or call implicit
`toLocaleString()`:

- integer/count and decimal with declared precision;
- percentage whose input contract is a fraction;
- metres and kilometres with appropriate `Intl` unit formatting;
- credits and light years as localized whole-message/unit patterns containing an `Intl`-formatted
  number;
- named absolute date/time formats with an explicit timezone contract;
- collator, display-name and plural operations where a capability needs them.

The registry caches by effective locale, operation and options. Tests inspect parts and semantic
units rather than pinning complete environment-specific strings. Null, invalid, incomplete,
unavailable and semantic infinity states go to state components instead of numeric formatters.

## Almanac names and diagnostics

Use stable package identity and the matching installed-package leaf export:

- `i18n/modules`, `i18n/blueprints`, `i18n/experimental-effects`;
- `i18n/experimental-effect-descriptions`, `i18n/engineering-groups`;
- `i18n/materials`, `i18n/micro-resources`;
- `i18n/ships`, `i18n/slots`, `i18n/pre-engineered`;
- `i18n/diagnostics` for loadout, calculation, SLEF and edit diagnostics.

The caller must establish whether the identity/diagnostic is known from package data and pass any
package-owned canonical field. The presenter follows this order:

1. Query the helper with the effective locale.
2. If non-null, present it as localized package text.
3. If null for a known identity, query canonical English and then use a package-owned canonical field
   where that family defines one.
4. If canonical text exists, present it with its accurate `lang` plus visible and programmatically
   associated untranslated disclosure in the application locale.
5. If no canonical text exists—or the identity is unknown—present localized unavailable framing.

Do not translate diagnostic codes/parameters privately, parse English messages, expose raw symbols as
names or label canonical package text as localized.

## Offline and privacy boundary

Feature 011 owns the application's sole service-worker dependency, registration and base
configuration. The worker eagerly versions the application shell, same-origin fonts and bundled
English, and lazily versions secondary `/i18n/*.json` assets after use. Downstream features may add
static asset groups to this configuration but cannot register another worker or create another cache
owner. A production-mode offline test waits for a controlling worker, opens German once, takes the
context offline and verifies shell/English/German reload. No catalogue, browser-language list,
translated text, formatter cache or announcement history is stored as user data or uploaded.
