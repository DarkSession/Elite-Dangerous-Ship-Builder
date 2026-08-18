# Data Model: Help, Licences and Provenance

Feature 012 owns immutable distribution metadata and application help presentation. It owns no build,
catalogue, locale preference or persisted UI state.

## BuildIdentity

Discriminated identity generated before browser compilation.

| Field                | Type                                          | Rules                                                                                                                   |
| -------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `kind`               | `'release' \| 'nonRelease'`                   | Production optimisation alone never selects `release`                                                                   |
| `applicationVersion` | non-empty string                              | Exact root `package.json#version`; `0.0.0` cannot be a release                                                          |
| `buildId`            | string for `nonRelease`; absent for `release` | Safe non-personal CI identifier or commit abbreviation with optional `dirty` suffix                                     |
| `releaseRef`         | string for `release`; absent for `nonRelease` | Build-time evidence; version component must equal `applicationVersion` and is not exposed as a separate product version |

Validation rejects missing/unsafe identifiers, mismatched release evidence and release classification
for a placeholder version. The view always labels non-release state and its build ID. A release still
shows the application version but is not called a game or catalogue release.

## AlmanacIdentity

| Field             | Type                                    | Rules                                                                                                   |
| ----------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `packageName`     | literal `@elite-dangerous-almanac/core` | Read from installed manifest and matched exactly                                                        |
| `version`         | non-empty string                        | Exact installed `package.json#version`                                                                  |
| `issueTrackerUrl` | absolute HTTPS URL                      | Exact installed `package.json#bugs.url`; expected Almanac issues origin/path, with no query or fragment |

The version is labelled “Bundled Almanac version.” It is never labelled live-game, live-data or
live-catalogue version.

## LegalDocument

| Field            | Type                                                                     | Rules                                                                  |
| ---------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `id`             | `'applicationLicense' \| 'almanacLicense' \| 'almanacThirdPartyNotices'` | Stable application identity, never array position                      |
| `owner`          | `'application' \| 'almanac'`                                             | Identifies the artifact owner                                          |
| `sourceArtifact` | repository/package-relative path                                         | `LICENSE` or `THIRD_PARTY_NOTICES.md`; no runtime filesystem path      |
| `sourceLanguage` | literal `'en'`                                                           | Legal content is English and untranslated                              |
| `exactText`      | non-empty string                                                         | Exact decoded UTF-8 artifact, including headings, URLs and line breaks |
| `byteLength`     | positive integer                                                         | UTF-8 source byte length                                               |
| `sha256`         | 64 lowercase hex characters                                              | SHA-256 of the exact source bytes                                      |

Validation re-encodes `exactText` and requires its byte count/hash to match. `exactText` never enters
the localisation layer and is rendered as text, not HTML. Localised labels describe owner, language
and coverage outside the exact text.

## LegalCoverage

Application-owned index explaining which complete document carries each term.

| Field            | Type                          | Rules                                                                                      |
| ---------------- | ----------------------------- | ------------------------------------------------------------------------------------------ |
| `id`             | stable coverage identity      | Application code, Almanac code, Frontier game data/imagery, or third-party data/algorithms |
| `labelKey`       | localisation key              | Visible/app-owned name                                                                     |
| `descriptionKey` | localisation key              | Scope; never states that MIT relicenses package/game content                               |
| `documentId`     | `LegalDocument.id`            | Target complete verbatim document                                                          |
| `sourceHeading`  | optional exact heading string | May identify the Frontier section without extracting or rewriting it                       |

Several coverage entries may point to one document. In particular, the Frontier and broader third-
party entries target the complete Almanac notice; the application-specific Frontier notice remains
inside the complete root `LICENSE`.

## ProvenanceFact

| Field              | Type                                                                                        | Rules                                       |
| ------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `id`               | `'application' \| 'almanac' \| 'catalogue' \| 'calculations' \| 'frontier' \| 'thirdParty'` | Stable semantic identity                    |
| `titleKey`         | localisation key                                                                            | Application-owned label                     |
| `bodyKey`          | localisation key                                                                            | Accepted ownership/currency statement       |
| `legalCoverageIds` | non-empty list of `LegalCoverage.id` where applicable                                       | Gives a local route to relevant exact terms |

Catalogue and calculation facts say the bundled Almanac supplies them; they do not claim live-game
currency. Package artwork/value regions refer to the same fact identities rather than maintaining
screen-specific provenance text.

## HelpTopic

| Field                  | Type                                        | Rules                                                                                                                                    |
| ---------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | stable topic identity                       | `buildLinkPrivacy`, `noAccountsOrTelemetry`, `browserStorage`, `offlineAssets`, `completedGrades`, `hullVersusBuild`, `almanacOwnership` |
| `titleKey`             | localisation key                            | Required, with bundled English fallback                                                                                                  |
| `bodyKeys`             | non-empty ordered list of localisation keys | Describes accepted current behavior only                                                                                                 |
| `relatedProvenanceIds` | list of `ProvenanceFact.id`                 | Optional local continuation                                                                                                              |

Topics contain no game names/diagnostics, package legal text, future behavior or persisted expansion
state.

## ExternalDestination

| Field                  | Type                                    | Rules                                                      |
| ---------------------- | --------------------------------------- | ---------------------------------------------------------- |
| `id`                   | literal `'almanacPackageDefect'`        | Stable action identity                                     |
| `url`                  | exact `AlmanacIdentity.issueTrackerUrl` | No added query, fragment, build link, SLEF or active route |
| `purposeKey`           | localisation key                        | Says package data/calculation defects only                 |
| `leavesApplicationKey` | localisation key                        | Visible and accessible external-navigation warning         |
| `rel`                  | literal `'noreferrer noopener'`         | Prevents opener/referrer coupling                          |

The destination is inert data until a Commander activates a native external link. It is never
fetched, prefetched or opened programmatically.

## DistributionManifest

| Field           | Type                                     | Rules                                                                                  |
| --------------- | ---------------------------------------- | -------------------------------------------------------------------------------------- |
| `schemaVersion` | literal `1`                              | Generated contract version                                                             |
| `build`         | `BuildIdentity`                          | Exactly one                                                                            |
| `almanac`       | `AlmanacIdentity`                        | Exactly one installed package                                                          |
| `documents`     | ordered readonly list of `LegalDocument` | Exactly one of every required ID; no duplicates                                        |
| `generatedFrom` | readonly source descriptors              | Build-time trace only; contains repository/package-relative paths, never machine paths |

The browser import is deeply immutable. Generation refuses extra/missing identities and stale source
copies. Runtime components cannot construct or mutate a manifest.

## HelpPageView

Presentation-only projection of `DistributionManifest`, feature 011 locale messages, `HelpTopic`,
`ProvenanceFact` and `LegalCoverage`.

| Field                      | Type                                      | Rules                                                               |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| `identityFacts`            | labelled application/Almanac/build values | Application and Almanac remain distinct; non-release status is text |
| `topics`                   | localised help topics                     | Current locale with bundled English fallback                        |
| `provenance`               | localised provenance facts                | Local links target coverage/documents                               |
| `packageDefectDestination` | labelled `ExternalDestination`            | Explicit leaving-app action                                         |
| `legalIndex`               | localised `LegalCoverage` entries         | Identifies owner/scope and target document                          |
| `documents`                | exact documents plus localised framing    | `sourceLanguage` is programmatically associated                     |

There is no loading, empty or recoverable error view: invalid distribution input prevents the build.
Release/non-release, alternative locale, collapsed/expanded documents and wide/narrow layout are the
supported presentation variants.

## Relationships

```text
DistributionManifest
├── BuildIdentity
├── AlmanacIdentity ── supplies ──> ExternalDestination.url
└── LegalDocument (3)

HelpPageView
├── HelpTopic (7)
├── ProvenanceFact ──> LegalCoverage ──> LegalDocument
├── DistributionManifest identities/documents
└── ExternalDestination
```

## State transitions

### Build-time artifact pipeline

```text
unresolved inputs
  ── all manifests/files/evidence valid ──> validated sources
  ── required input invalid/missing/empty ──> build failure

validated sources
  ── committed copies byte-equal + generation succeeds ──> immutable manifest
  ── copy drift/serialization/hash failure ──> build failure

immutable manifest
  ── Angular build + output verification succeeds ──> shippable static artifacts
  ── output absent/tampered/lazy-only ──> release failure
```

No failure transitions into a runtime placeholder.

### Legal disclosure

```text
collapsed ── Commander activates summary ──> expanded
expanded  ── Commander activates summary ──> collapsed
```

Changing disclosure state does not load content, alter the URL/build, persist state or change legal
text. Local internal navigation may expand/focus the targeted complete document without a network
request.
