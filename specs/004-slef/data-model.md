# Data Model: SLEF Import and Export

Game-bearing records and results remain owned by `@elite-dangerous-almanac/core`. The application
types below model workflow, atomic coordination, presentation and browser delivery; they are not a
second SLEF schema or loadout representation.

## SlefImportDraft

| Field          | Type                                           | Rules                                                                   |
| -------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| `text`         | string                                         | Exact Commander input; never trimmed, normalized or reparsed by the app |
| `utf8Bytes`    | non-negative integer                           | `TextEncoder` byte count over `text`                                    |
| `limitBytes`   | literal `65536`                                | Gate value; presented with localized count/unit framing                 |
| `status`       | `editing \| inspecting \| awaitingReplacement` | No state owns or mutates the active build                               |
| `requestToken` | opaque token or null                           | Current submit/confirmation identity; a newer operation supersedes it   |

The byte gate precedes the whitespace-only gate. Draft text survives failure, cancellation,
supersession and ordinary layer close; explicit Clear or accepted replacement may remove it.

## SlefPackageDiagnostic

The exact package `SlefDiagnostic` record:

| Field        | Type                              | Rules                                                    |
| ------------ | --------------------------------- | -------------------------------------------------------- |
| `index`      | non-negative integer              | Package top-level entry index; never renumbered          |
| `path`       | string                            | Exact package property path; rendered direction-isolated |
| `code`       | `SlefDiagnosticCode`              | Package machine identity; not privately translated       |
| `constraint` | `SlefConstraint`                  | Package field-level constraint                           |
| `params`     | readonly package record or absent | Preserved unchanged                                      |
| `message`    | string                            | Canonical package text retained for fallback/disclosure  |

Presentation requests text with `getSlefDiagnosticMessage(diagnostic, locale)`. A null locale result
uses feature 011's canonical-language disclosure. App-owned syntax framing is not fabricated into
this shape.

## SlefImportFailure

| Kind                       | Data                                                  | Rules                                                                                           |
| -------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `tooLarge`                 | actual and limit bytes                                | Returned before empty/package checks                                                            |
| `empty`                    | none                                                  | Original text contains only whitespace and is within the byte limit                             |
| `syntax`                   | none                                                  | Package inspection threw `SyntaxError`; exception prose is not parsed/displayed                 |
| `cardinality`              | observed count and exact diagnostics                  | Observed count is valid entries plus rejected entries; accept neither zero nor multiple         |
| `diagnostics`              | exact package diagnostics                             | Sole observed entry was rejected                                                                |
| `unknownHull`              | exact source hull identity                            | Package catalogue lookup/construction cannot resolve the hull; no invented package diagnostic   |
| `construction`             | generic app failure category                          | Unexpected package construction failure; raw exception remains logs-only                        |
| `normalizationUnsupported` | exact package code/params plus source slot/identity   | `completeEngineeringGrade()` returned structured package refusal                                |
| `packageContractFailure`   | source context and exact structured result if present | Unexpected unchanged/refused/result shape; retain package `reason` when that is what it returns |

`superseded` and `cancelled` are terminal no-op operation outcomes, not error presentations. Every
failure/no-op retains the draft and compares active loadout/revision, dirty baseline, working/named
bytes, fragment, normalization metadata and edit history equal before/after.

## IngressSourceEvidence

Transient exact evidence captured from the inspected package entry before construction.

### SourcePartialEngineering

| Field                | Type                              | Rules                                         |
| -------------------- | --------------------------------- | --------------------------------------------- |
| `slot`               | string                            | Exact source game slot key                    |
| `moduleSymbol`       | string                            | Exact source module identity                  |
| `blueprintFdname`    | string or absent                  | Exact source package identity; never inferred |
| `experimentalFdname` | string or absent                  | Exact source package identity                 |
| `grade`              | package-validated grade or absent | Preserved for context                         |
| `quality`            | finite number in `[0, 1)`         | Only source partials enter this collection    |

## EngineeringQualityCompletion

| Field                | Type                    | Rules                                             |
| -------------------- | ----------------------- | ------------------------------------------------- |
| `slot`               | string                  | Correlated candidate slot key                     |
| `moduleSymbol`       | string                  | Candidate/source identity after exact correlation |
| `blueprintFdname`    | string or absent        | Source package identity                           |
| `experimentalFdname` | string or absent        | Source package identity                           |
| `grade`              | package grade or absent | Source grade                                      |
| `previousQuality`    | number in `[0, 1)`      | Exact package `normalized` result/source evidence |
| `quality`            | literal `1`             | Package-recomputed result                         |

Only successful package `normalized` results enter the collection. Quality-1 or absent-quality
source modules are not passed to `completeEngineeringGrade()` and produce no completion notice.

## SlefImportCandidate

| Field                | Type                                          | Rules                                                                                              |
| -------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `loadout`            | `ShipLoadout`                                 | Detached package aggregate; sole game-bearing candidate                                            |
| `sourceAttribution`  | package-validated app name/version or null    | Plain-text presentation only; empty synthetic/bare and empty-header envelope are not guessed apart |
| `qualityCompletions` | readonly completion records                   | Transient report data                                                                              |
| `validationIssues`   | readonly package validation issue projections | Incomplete/invalid resolved state                                                                  |
| `validation`         | package `LoadoutValidation`                   | Final result after accepted normalization                                                          |
| `requestToken`       | opaque token                                  | Must still match when feature 001 commits                                                          |

```text
exact draft
  -> UTF-8 size gate -> empty gate -> inspectSlef(exact text)
  -> exactly one valid entry -> package construction with fixed defaults
  -> capture supported source evidence
  -> correlate/complete source partials
  -> final package validation -> detached candidate
  -> feature 001 replacement coordinator
       failure/cancel/stale -> discard; all existing state unchanged
       accept -> one active replacement -> working autosave/link sync/history reset
```

No calculated value is read before ingress construction and quality normalization finish.

Incoming `appCustomProperties` and `appURL` are neither executed nor carried into candidate
presentation. Empty header values simply produce no attribution; they are not used to classify the
input as journal or envelope.

## No import outcome model

There is none. The design canvas draws no feature-004 report of an accepted import, and both facts
one would have carried are already modelled and drawn elsewhere
([design/import-outcome.md](./design/import-outcome.md), "Divergence").

The candidate's `qualityCompletions` become feature 001's own `qualityNotices` on the candidate it
hands over, which is what feature 002's revision-bound, dismissible completion notice reads. The
package verdict is `loadout.validation()`, which feature 003's build-status rail already renders for
whatever build is active. Feature 004 holds neither after the handoff.

Quality completions and the detailed validation issue list stay transient: neither enters
`BuildSnapshotV1`, the fragment, SLEF or edit history. Feature 001 independently persists the
accepted revision's existing `valid`/`complete` summary booleans.

## ActiveExportSnapshot | null

An atomic read supplied by feature 001. A null snapshot means export is unavailable and no artifact
may be generated:

| Field           | Type                    | Rules                                                                                         |
| --------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| `loadout`       | `ShipLoadout`           | Current active aggregate                                                                      |
| `revision`      | opaque revision         | Identity for artifact validity                                                                |
| `canonicalLink` | same-origin URL or null | Certified by feature 001 to represent exactly `revision`; feature 004 never builds/encodes it |

The snapshot prevents a stale published fragment from entering an artifact for a newer loadout.

## SlefExportArtifact

| Field         | Type                                    | Rules                                              |
| ------------- | --------------------------------------- | -------------------------------------------------- |
| `revision`    | opaque active revision                  | Must still match before any delivery action        |
| `payload`     | string                                  | Exact one-entry `toSlefString()` output            |
| `utf8Bytes`   | non-negative integer                    | Exact payload bytes; display only, no export limit |
| `moduleCount` | non-negative integer                    | Package fitted-module count for metadata only      |
| `filename`    | fixed safe `.slef.json` name            | Contains no hull/name/ident/untrusted text         |
| `mimeType`    | `application/json;charset=utf-8`        | Blob/File content type                             |
| `header`      | app identity/version/optional exact URL | Newly supplied producer metadata                   |
| `validation`  | package `LoadoutValidation`             | Disclosure only; never suppresses payload          |

The artifact contains no local record identity/name/note, report, diagnostic, request token or
application normalization metadata. Active revision change invalidates it synchronously before delivery.

## DeliveryCapability

| Field       | Type                          | Rules                                                                     |
| ----------- | ----------------------------- | ------------------------------------------------------------------------- |
| `clipboard` | `available \| unavailable`    | Hint only; invocation may still fail                                      |
| `download`  | literal `available`           | Blob/anchor adapter; setup may still fail                                 |
| `share`     | `file \| text \| unavailable` | File only after `canShare({ files })`; otherwise text when `share` exists |

Capability detection never authorizes automatic action and never changes the artifact.

## DeliveryOutcome

| Action     | Status                                     | Rules                                                                 |
| ---------- | ------------------------------------------ | --------------------------------------------------------------------- |
| `copy`     | `working \| copied \| failed`              | `copied` only after Clipboard promise resolution                      |
| `download` | `dispatched \| setupFailed`                | Never claims disk persistence/completion                              |
| `share`    | `working \| shared \| cancelled \| failed` | Cancellation is neutral; share starts only within explicit activation |

An optional stable application reason may accompany failures; raw DOM exception prose is not UI.
Outcomes never clear/regenerate the artifact and are invalidated with its revision.
