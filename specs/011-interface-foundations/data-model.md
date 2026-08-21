# Data Model: Interface Foundations

These are interface/application records, not Elite Dangerous build data. None is serialized into a
build link, SLEF payload, active build or saved-build record.

## Shipped Locale

| Field         | Type                    | Rules                                                                    |
| ------------- | ----------------------- | ------------------------------------------------------------------------ |
| `tag`         | canonical BCP 47 tag    | Unique production identity; initially `en` or `de`                       |
| `language`    | base language tag       | Used only after exact browser-tag matching                               |
| `direction`   | `ltr \| rtl`            | Published with the effective catalogue                                   |
| `assetPath`   | same-origin path        | Under `/i18n/`; English is additionally imported into the initial bundle |
| `selfNameKey` | application message key | Resolves through the catalogue, never component text                     |
| `fallback`    | boolean                 | Exactly one production locale (`en`)                                     |

Expanded-copy and RTL pseudo-locales are test providers, not shipped locale records. They are absent
from the production registry and reachable only from the tooling-only preview application.

There is no locale preference record: the browser language setting is the only input, read on every
start, so the application stores nothing about the language.

## Message Catalogue

| Field      | Type                         | Rules                                                                      |
| ---------- | ---------------------------- | -------------------------------------------------------------------------- |
| `locale`   | shipped locale tag           | Must match registry and asset identity                                     |
| `messages` | immutable key/string tree    | English defines the complete typed key and interpolation schema            |
| `revision` | build-generated content hash | Prevents a service-worker asset from mixing with another application build |

Both shipped catalogues have exactly the same key set and interpolation variables. Every production
value is nonblank, plain text and placeholder-compatible with English. Adding or changing an
application-owned message in any capability updates and validates both catalogues in the same
change; an incomplete candidate is never partially published. Application catalogues contain no
game noun or package diagnostic translation.

## Locale Candidate

| Field       | Type                          | Rules                                                       |
| ----------- | ----------------------------- | ----------------------------------------------------------- |
| `requested` | shipped locale tag            | Selected by startup precedence or explicit Commander intent |
| `catalogue` | validated catalogue or `null` | Never exposed before full validation                        |
| `source`    | `bundle \| asset \| cache`    | Diagnostic/test provenance only                             |
| `failure`   | stable failure code or `null` | No fetch/parser exception or URL becomes display text       |

A candidate is transient. It cannot partially update current messages, formatters, title, `lang` or
`dir`.

## Locale Snapshot

| Field             | Type                        | Rules                                                    |
| ----------------- | --------------------------- | -------------------------------------------------------- |
| `revision`        | monotonic integer           | Increments once per committed startup or fallback        |
| `requestedLocale` | shipped locale tag          | The browser/default intent                               |
| `effectiveLocale` | shipped locale tag          | Valid candidate tag or bundled `en` fallback             |
| `selectionSource` | `browser \| default`        | Does not retain the full browser language list           |
| `catalogue`       | immutable message catalogue | Complete and consistent with the effective locale        |
| `direction`       | `ltr \| rtl`                | From the effective locale                                |
| `status`          | `ready \| fallback`         | Both states are readable and usable                      |
| `fallbackReason`  | stable code or `null`       | Present only when the requested locale could not be used |

### Locale transitions

```text
startup
  -> first exact/base navigator.languages match
  -> bundled English default
candidate(en) -> validate bundled catalogue -> commit ready snapshot
candidate(non-en) -> load and validate -> commit ready snapshot
candidate(non-en) -> fail -> commit bundled-English fallback snapshot
```

The prior snapshot may stay visible during a secondary-locale load. No new root `lang` or translated
label appears until the whole candidate commits. The language is read from the browser on every
start and stored nowhere; domain/build revision and URL are not effects of a locale transition.

## Formatter Request

| Field     | Type                    | Rules                                                                      |
| --------- | ----------------------- | -------------------------------------------------------------------------- |
| `locale`  | effective locale tag    | Supplied by the committed snapshot                                         |
| `kind`    | named formatter id      | Integer, decimal, fraction-percent, date, unit, display name or collator   |
| `options` | immutable named options | Precision/timezone/unit behavior is declared centrally, not by a component |
| `value`   | compatible scalar/date  | Null/unavailable never reaches a numeric formatter                         |

The formatter registry caches one `Intl` instance per `(locale, kind, options)`. Credits and light
years resolve through a localized message pattern containing an already formatted number; they are
not fabricated `Intl` currencies/units.

## Game Text Request

| Field           | Type                           | Rules                                                              |
| --------------- | ------------------------------ | ------------------------------------------------------------------ |
| `family`        | Almanac i18n helper family     | Selects one leaf import                                            |
| `identity`      | package stable identity/record | `symbol`, `fdname`, slot key or structured diagnostic              |
| `known`         | boolean                        | Established from package projection, not inferred from helper null |
| `canonicalText` | package-owned string or `null` | Optional canonical field; never application-authored               |

## Game Text Presentation

| Field              | Type                                    | Rules                                                              |
| ------------------ | --------------------------------------- | ------------------------------------------------------------------ |
| `text`             | package-returned string or `null`       | Null only in the explicit unavailable state                        |
| `language`         | BCP 47 tag or `null`                    | Accurate language for presented text                               |
| `translationState` | `localized \| canonical \| unavailable` | Canonical in non-English UI always has associated disclosure       |
| `disclosureKey`    | application key or `null`               | Frames provenance/unavailability without translating the game noun |

Unknown identity, active-locale miss and absent canonical source are distinct inputs even when a
helper returns `null`. A raw identity is not display fallback.

## Announcement Event

| Field        | Type                             | Rules                                             |
| ------------ | -------------------------------- | ------------------------------------------------- |
| `kind`       | stable application event id      | Never derived from translated text                |
| `revision`   | source/context revision          | Used to reject unchanged or stale events          |
| `urgency`    | `assertive \| polite`            | Blocking errors assertive; settled changes polite |
| `messageKey` | application message key          | Resolved against the current effective snapshot   |
| `params`     | language-neutral readonly record | Contains no preformatted locale-sensitive value   |

The dedupe identity is `(kind, revision, urgency)`. Initial content, unchanged identity, stale
revision and unaffected values produce no outlet update. Visible feedback is separate state.

## Design Token

| Field       | Type                                                            | Rules                                                  |
| ----------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| `name`      | namespaced CSS custom property/Sass symbol                      | Unique within its category                             |
| `category`  | color/type/spacing/radius/elevation/border/motion/target/layout | Determines policy and preview checks                   |
| `primitive` | literal                                                         | Appears only in primitive token/font sources           |
| `semantic`  | one or more use aliases                                         | Components consume semantic aliases, never raw palette |
| `evidence`  | contrast/size/motion record or N/A                              | Required where the token conveys meaning               |

There is one semantic dark set and no theme preference/state.

## UI Component Contract

| Field         | Type                                  | Rules                                                         |
| ------------- | ------------------------------------- | ------------------------------------------------------------- |
| `componentId` | stable UI-library id                  | One per exported `src/app/ui/` component                      |
| `inputs`      | immutable presentation model          | No domain store/catalogue reach-through                       |
| `intents`     | typed outputs                         | Components request work; they do not mutate domain state      |
| `semantics`   | role/name/state/relationship contract | Native semantics preferred; visible/accessibility names match |
| `states`      | required/applicable state set         | Populated/default, empty, loading, error, disabled            |

## Component Preview Declaration

| Field          | Type                                        | Rules                                                      |
| -------------- | ------------------------------------------- | ---------------------------------------------------------- |
| `componentId`  | UI component id                             | Exactly one declaration for each exported component        |
| `state`        | fixture or explicit N/A                     | Every required state accounted for                         |
| `fixture`      | immutable presentation inputs or `null`     | No mock game datum is presented as authoritative           |
| `naReason`     | stable nonblank reason or `null`            | Allowed only when the contract cannot represent that state |
| `variants`     | normal/expanded/RTL/reduced-motion/etc. set | Required where the component can expose the behavior       |
| `expectations` | semantic/visual behavior ids                | Shared by policy and Playwright                            |

Viewport/orientation comes from the global Playwright profile, so declarations do not duplicate five
copies of the same state.

## Verification Coverage Entry

| Field          | Type                               | Rules                                         |
| -------------- | ---------------------------------- | --------------------------------------------- |
| `surfaceId`    | product screen/state or preview id | Stable address                                |
| `requirements` | feature requirement ids            | Nonempty traceability set                     |
| `journey`      | primary/relevant-state id          | Primary journeys run in all ten projects      |
| `axe`          | boolean                            | True for every rendered product/preview state |
| `assertions`   | named semantic/responsive checks   | Names expected meaning beyond axe             |
| `manualRecord` | protocol id or `null`              | Required for primary AT/actual-zoom coverage  |

The coverage ledger is compared with routes, preview exports and project names so “every” cannot
silently drift as components and capabilities are added.
