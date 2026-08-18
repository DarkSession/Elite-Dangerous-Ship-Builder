# Data Model: SLEF Import and Export

Game-bearing values remain owned by `@elite-dangerous-almanac/core`. These application records model
workflow, delivery and disclosure only; none is a second SLEF schema or loadout representation.

## SlefImportDraft

| Field        | Type                                         | Rule                                                       |
| ------------ | -------------------------------------------- | ---------------------------------------------------------- |
| `text`       | string                                       | Exact Commander input; unchanged before package inspection |
| `utf8Bytes`  | non-negative integer                         | `TextEncoder` byte length                                  |
| `limitBytes` | literal `65536`                              | Displayed as locale-formatted 64 KiB                       |
| `state`      | `editing \| checking \| awaitingReplacement` | Never contains/changes the active build                    |

The draft remains after refusal and clears only explicitly or after accepted replacement.

## SlefPackageDiagnostic

The exact package `SlefDiagnostic`: `index`, `path`, `code`, `constraint`, optional `params` and
package-owned `message`. Fields are never renumbered, parsed or rewritten. Application framing is
localized; `SyntaxError` remains a separate failure and is not fabricated into this shape.

## SlefImportFailure

| Kind            | Data                        | Rule                                               |
| --------------- | --------------------------- | -------------------------------------------------- |
| `empty`         | none                        | Whitespace-only draft                              |
| `tooLarge`      | actual/limit bytes          | Before `inspectSlef()`                             |
| `syntax`        | none                        | Package threw `SyntaxError`; prose not parsed      |
| `cardinality`   | observed count, diagnostics | Zero or multiple entries; diagnostics retained     |
| `diagnostics`   | exact package records       | Sole entry rejected                                |
| `construction`  | stable package category     | Inspected entry did not construct; no repair       |
| `normalization` | package structured outcome  | Candidate cannot meet constitutional normalization |
| `superseded`    | request token               | Newer import/replacement won                       |

Every failure preserves active state, records, fragment and draft.

## FixedMountNormalization

| Field            | Type                                                                     | Rule                                         |
| ---------------- | ------------------------------------------------------------------------ | -------------------------------------------- |
| `slot`           | string                                                                   | Candidate spelling where present             |
| `reason`         | `requiredSlot \| cargoHatch`                                             | Exact package `immovableReason`              |
| `previousSymbol` | string or null                                                           | Null means absent                            |
| `defaultSymbol`  | string or null                                                           | Exact package default; null when unavailable |
| `outcome`        | `autoRestored \| repaired \| unchanged \| defaultUnavailable \| refused` | Exact package/construction outcome           |

Fills/replacements and purchase invalidation must be package-owned. Unavailable stays incomplete.

## EngineeringQualityNormalization

| Field             | Type                            | Rule                                |
| ----------------- | ------------------------------- | ----------------------------------- |
| `slot`            | string                          | Game slot key                       |
| `blueprintFdname` | string                          | Package identity                    |
| `grade`           | package grade                   | Imported grade retained             |
| `previousQuality` | number                          | Imported package value              |
| `quality`         | literal `1`                     | Package-recomputed completed grade  |
| `outcome`         | `normalized \| alreadyComplete` | Unsupported state is import failure |

No engineering modifier is stored or computed by the app.

## RetainedUnresolvedIdentity

Projection of an exact package validation issue: optional `slot`/`symbol`, package `code`, `severity`
and `params`. An unresolved non-fixed module remains fitted. An unresolved fixed module remains only
when the package has no default or its normalization refuses.

## SlefImportCandidate

| Field            | Type                    | Rule                          |
| ---------------- | ----------------------- | ----------------------------- |
| `loadout`        | `ShipLoadout`           | Detached; sole game aggregate |
| `source`         | `slef \| journal`       | Workflow display only         |
| `sourceApp`      | package header or null  | Never executable content      |
| `normalizations` | fixed/quality outcomes  | Local disclosure only         |
| `unresolved`     | retained package issues | No inferred identities        |
| `validation`     | `LoadoutValidation`     | Exact final package result    |
| `requestToken`   | opaque                  | Prevents late commit          |

```text
draft -> byte gate -> package inspect exactly one -> detached construction
      -> package fixed/quality normalization -> package validation/report
      -> replacement coordinator
           failure/cancel/stale -> discard; active/stored unchanged
           accept -> one replacement; autosave; local report
```

No calculation is read before fixed normalization.

## SlefImportReport

Contains fixed-mount outcomes, quality outcomes, retained unresolved issues and exact final
`valid`/`complete` booleans. It belongs to the accepted active revision but is excluded from build
snapshots, storage payload, URL and SLEF. Dismissal does not edit the build.

## SlefExportArtifact

| Field         | Type                              | Rule                                     |
| ------------- | --------------------------------- | ---------------------------------------- |
| `revision`    | opaque active revision            | Invalidated by modelled edit/replacement |
| `payload`     | string                            | Exact one-entry `toSlefString()` output  |
| `utf8Bytes`   | non-negative integer              | Display only; no output limit            |
| `moduleCount` | non-negative integer              | Package/current fitted count             |
| `filename`    | fixed safe `.slef.json` name      | No user/untrusted interpolation          |
| `mimeType`    | `application/json;charset=utf-8`  | Download/file share                      |
| `header`      | app identity/version/optional URL | URL names exact revision                 |
| `validation`  | `LoadoutValidation`               | Disclosure; never suppresses payload     |

It contains no report, record metadata, note or diagnostics. Link failure only omits `appURL`.

## DeliveryCapability and DeliveryResult

Capability has clipboard hint, always-available Blob download and share mode
`file | text | unavailable`. Result records `copy | download | share`, status
`working | succeeded | failed | cancelled`, and optional stable port reason. Capability/outcome never
changes the artifact; unavailable share is not rendered.
