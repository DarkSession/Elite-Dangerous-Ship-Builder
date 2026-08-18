# Contract: Localization and Formatting

## Ownership boundary

- Application-owned text resolves through message keys and the active catalogue.
- Game text and package diagnostics come from Almanac leaf APIs/fields and never from application
  catalogues.
- Raw message keys, blank values, interpolation placeholders and raw internal exceptions never reach
  a Commander.

## Shipped registry

The initial production registry contains complete `en` and `de` catalogues. Each entry owns a
canonical tag, language, direction, self-name key and same-origin asset path. Test-only expanded and
RTL catalogues are excluded from selection and persistence.

Adding a shipped locale requires:

1. a complete reviewed catalogue matching every English key and parameter;
2. a registry entry and self-name in both English and the new locale;
3. browser-match, explicit-selection, persistence, offline and fallback tests;
4. responsive/RTL tests when its direction or expansion characteristics add a new case.

## Selection precedence

1. Read the versioned preference through the storage adapter. A supported saved tag wins.
2. Otherwise inspect `navigator.languages` in order. Canonicalize each tag; match exact shipped tag,
   then its base language.
3. If none matches, select `en`.
4. An explicit selection becomes the requested tag and is persisted only after the candidate
   catalogue has resolved to a valid effective state.

Malformed/unsupported saved data is ignored safely. Storage/fetch failure does not block the app.

## Atomic publication

Commit the effective catalogue, formatter registry, translated document title, `<html lang>` and
`dir` together. Do not publish a partial catalogue or relabel old values with a new locale.
Presentation/search projections may refresh; build state, revision, URL, SLEF and persistence do not.

If a requested non-English asset fails validation/load, commit bundled English as the effective
locale, retain enough local state to explain the fallback once, and never show a mixed-language raw
catalogue. A later explicit retry may load the requested locale.

## Message resolution

- English is imported from its canonical JSON source into the initial bundle.
- Every shipped production catalogue is complete at build time.
- Defensive missing-key/blank/parameter mismatch handling resolves the English entry.
- If the English key itself is absent/invalid, return a bounded localized generic application error
  from a separately compiled invariant, never the key or placeholder.
- Message values are text, not trusted HTML.

## Named formatters

Components request named formatting operations rather than constructing `Intl` objects or calling
implicit `toLocaleString()`:

- decimal/integer/count with contract-specific precision;
- percentage from a documented fraction/percentage input contract;
- credits as locale number plus localized credit unit;
- distance with metres, kilometres or light years selected by the calling capability contract, not
  guessed by the formatter;
- dates/instants with named absolute formats; relative dates only when explicitly required;
- collator/display-name/plural helpers for locale-aware ordering and grammar.

Null, unavailable, incomplete and semantic-infinity states are passed to localized state components,
not coerced into formatted numbers.

## Almanac names and diagnostics

Call the relevant leaf helper by stable package identity. A non-null result is localized for the
requested locale. A `null` result for a known record uses package canonical text, gives that text its
canonical language boundary and attaches the shared visible/programmatic untranslated disclosure.

Package-owned text without a beta.12 locale helper follows the canonical/disclosed path. This
includes the families filed in [Almanac #309](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/309).
Do not map diagnostic codes/params to private application translations. After a released upstream
fix, consume its leaf result and retain the same explicit-miss behavior.

## Persistence and privacy

Only `{ version: 1, locale }` is stored under the namespaced locale-preference key. No browser
language list, translated text, game data, preview state or announcement history is persisted or
uploaded.
