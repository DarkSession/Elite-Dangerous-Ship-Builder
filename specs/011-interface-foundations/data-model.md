# Data Model: Interface Foundations

These records are application/interface state, not Elite Dangerous build data. None enters a build,
URL fragment, SLEF payload or saved-build record.

## Locale Definition

| Field         | Type                    | Rules                                                            |
| ------------- | ----------------------- | ---------------------------------------------------------------- |
| `tag`         | canonical BCP 47 tag    | Unique shipped identity; initially `en` or `de`                  |
| `language`    | base language tag       | Used only after exact browser-tag matching                       |
| `direction`   | `ltr \| rtl`            | Published to the root document with the catalogue                |
| `assetPath`   | same-origin path        | Must be under the static `/i18n/` boundary                       |
| `selfNameKey` | application message key | Resolves in the locale itself; never a hard-coded selector label |
| `fallback`    | boolean                 | Exactly one definition (`en`) is true                            |

Test-only expanded/RTL definitions are not selectable, persisted or included in the production
registry.

## Locale Preference

| Field     | Type        | Rules                                                  |
| --------- | ----------- | ------------------------------------------------------ |
| `version` | literal `1` | Unknown versions are ignored, not migrated by guessing |
| `locale`  | locale tag  | Must resolve through the current shipped registry      |

The record uses one namespaced key. Storage unavailable, malformed JSON, a removed locale or a write
failure leaves the application usable and reports a non-blocking localized status once.

## Message Catalogue

| Field      | Type                         | Rules                                      |
| ---------- | ---------------------------- | ------------------------------------------ |
| `locale`   | shipped locale tag           | Agrees with the registry/asset identity    |
| `messages` | readonly key/string tree     | English defines the complete key schema    |
| `revision` | build-generated content hash | Prevents stale service-worker/cache mixing |

Values must be nonblank, contain no raw placeholder markers and match the expected interpolation
parameter names. Application messages contain no game-data translations.

## Locale State

| Field             | Type                                      | Rules                                              |
| ----------------- | ----------------------------------------- | -------------------------------------------------- |
| `requestedLocale` | shipped locale tag                        | Saved selection or matched browser/default choice  |
| `effectiveLocale` | shipped locale tag                        | Requested tag after valid load, otherwise `en`     |
| `source`          | `saved \| browser \| default \| explicit` | Explains selection without exposing browser values |
| `direction`       | `ltr \| rtl`                              | From the effective locale definition               |
| `catalogue`       | immutable resolved catalogue              | Never partially published                          |
| `status`          | `initializing \| ready \| fallback`       | `fallback` remains readable English                |
| `fallbackReason`  | stable application code or `null`         | No raw fetch/parser exception reaches UI           |

### State transitions

```text
startup -> valid saved tag -> load -> ready | English fallback
startup -> no valid save -> first browser match -> load -> ready | English fallback
startup -> no match -> bundled English -> ready
ready/fallback -> explicit shipped tag -> load candidate -> atomic ready/fallback -> persist intent
```

The previous presentation may remain visible while a candidate catalogue loads, but messages,
formatters, title, `lang` and `dir` switch only as one committed state. Domain/build state is never
recomputed solely because locale changed; presenters/search indexes may refresh.

## Formatter Registry

| Field       | Type                            | Rules                                                             |
| ----------- | ------------------------------- | ----------------------------------------------------------------- |
| `locale`    | effective locale tag            | Cache identity                                                    |
| `kind`      | named formatter id              | Decimal, integer, percent, credits, distance/unit, date, collator |
| `options`   | frozen Intl options             | Owned centrally, not supplied ad hoc by components                |
| `formatter` | matching cached `Intl` instance | Recreated on effective-locale change                              |

Formatted output never substitutes zero for null/unavailable input. Credits are numbers plus a
localized game-unit label, not an ISO currency.

## Game Text Presentation

| Field              | Type                                         | Rules                                                          |
| ------------------ | -------------------------------------------- | -------------------------------------------------------------- |
| `identity`         | package stable identity                      | Symbol, fdname, code/constraint or exact package slot identity |
| `text`             | package-returned localized or canonical text | Never application-authored game translation                    |
| `language`         | BCP 47 tag for displayed text                | Used on the textual boundary when it differs from root         |
| `translationState` | `localized \| canonical \| unavailable`      | `canonical` in non-English UI requires disclosure              |
| `disclosureKey`    | app key or `null`                            | Present for canonical/unavailable state                        |

An unknown identity and a known identity with no locale value are distinct. The presenter requests
canonical English through the package helper where available; otherwise it uses the package's
canonical field. No raw key or empty display text is emitted.

## Announcement Event

| Field        | Type                             | Rules                                                   |
| ------------ | -------------------------------- | ------------------------------------------------------- |
| `kind`       | stable application event id      | Never derived from translated text                      |
| `revision`   | stable source/context revision   | Prevents stale or repeated announcements                |
| `urgency`    | `assertive \| polite`            | Blocking errors assertive; other settled changes polite |
| `messageKey` | application message key          | Resolved at publication in effective locale             |
| `params`     | language-neutral readonly record | Contains no preformatted locale-sensitive number        |

Derived dedupe identity is `(kind, revision, urgency)`. Initial content, unchanged identity and a
stale revision produce no outlet update. Visible feedback is stored/rendered separately.

## UI Component Contract

| Field         | Type                                  | Rules                                                                |
| ------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `componentId` | stable UI-library id                  | One per exported `src/app/ui/` component                             |
| `inputs`      | immutable presentation model          | No domain service or build-store reach-through                       |
| `intents`     | typed outputs                         | Describe user intent; component does not mutate domain state         |
| `semantics`   | role/name/state/relationship contract | Native semantics preferred                                           |
| `states`      | applicable state set                  | Populated, empty, loading, error, disabled; default where meaningful |

## Component Preview Declaration

| Field          | Type                                     | Rules                                                    |
| -------------- | ---------------------------------------- | -------------------------------------------------------- |
| `componentId`  | UI component id                          | Must join exactly one exported component contract        |
| `state`        | supported state or explicit N/A record   | Every required state accounted for                       |
| `fixture`      | immutable presentation inputs            | Contains no game facts presented as authoritative        |
| `profiles`     | desktop/tablet/mobile set                | All three required; orientations exercised by Playwright |
| `variants`     | normal/expanded/RTL/reduced-motion flags | Cross-cutting variants applied where relevant            |
| `expectations` | semantic/visual behavior ids             | Reused by preview policy and Playwright                  |

An exported component without a declaration, a missing state rationale or a missing profile fails
the static gate.

## Design Token Record

| Field          | Type                                                            | Rules                                               |
| -------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| `name`         | namespaced custom property/Sass token                           | Unique and category-specific                        |
| `category`     | color/type/spacing/radius/elevation/border/motion/target/layout | Determines policy checks                            |
| `primitive`    | literal value                                                   | May appear only in the primitive token layer        |
| `semanticUses` | one or more semantic aliases                                    | Components consume semantic aliases, not primitives |

There is one semantic dark set. No state, storage field or selector represents theme choice.
