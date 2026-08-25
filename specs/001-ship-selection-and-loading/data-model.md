# Data Model: Ship Selection and Build Loading

All game-bearing fields below are projections of `@elite-dangerous-almanac/core`. Application models add browser workflow metadata only; they do not redefine a hull, module, slot, validation rule or calculated value.

## HullCatalogueEntry

An immutable view over one package `Ship` record.

| Field              | Type                                      | Source and rule                                                 |
| ------------------ | ----------------------------------------- | --------------------------------------------------------------- |
| `symbol`           | string                                    | `Ship.symbol`; canonical identity and detail-route segment      |
| `sourceOrdinal`    | non-negative integer                      | Position in package `SHIPS`; final stable sort tie-breaker only |
| `name`             | present/unavailable string                | `Ship.name`; package-owned text                                 |
| `manufacturer`     | present/unavailable string                | `Ship.manufacturer`; package-owned text                         |
| `size`             | `small \| medium \| large \| unavailable` | `Ship.size`                                                     |
| `hardpoints`       | present/unavailable readonly layout       | `Ship.hardpoints`; never reconstructed from display text        |
| `retailPrice`      | present/unavailable credits               | `Ship.retailCost`; zero remains a present value                 |
| `detailFacts`      | immutable fact map                        | Remaining FR-004 `Ship` fields with package-documented units    |
| `slots`            | readonly `BuildSlot[]` or unavailable     | `enumerateSlots(getShipSlots(symbol))`                          |
| `artworkPath`      | same-origin relative URL                  | Base-href-safe path formed from the exact package symbol        |
| `defaultAvailable` | boolean                                   | `getDefaultLoadout(symbol) !== null`                            |

Validation:

- `symbol` must resolve to the same package record before a detail or creation candidate is accepted.
- Missing is represented independently of every valid scalar, including `0`.
- The application may format/order a field but may not change its value.

## CatalogueSessionState

Ephemeral per-tab browsing state; never part of a build, named record or link.

| Field              | Type                                           | Rule                                                                                                 |
| ------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `query`            | string                                         | User text; normalized only for matching                                                              |
| `manufacturers`    | readonly string[]                              | Package manufacturer values selected as facets                                                       |
| `sizes`            | readonly size[]                                | Selected package size values                                                                         |
| `hardpointClasses` | readonly integer[]                             | Required hardpoint classes present                                                                   |
| `price`            | `{ min: number \| null; max: number \| null }` | Inclusive credits interval; null means open bound                                                    |
| `sort`             | `{ field; direction }`                         | Field covers name, manufacturer, size, hardpoints or retail price; direction is ascending/descending |
| `resultAnchor`     | `{ symbol; offsetWithinItem } \| null`         | Restores the same result and relative visual position                                                |

Derived values: filtered/sorted result symbols, active constraint descriptions and match count. These are recomputed from package facts and active locale and are not persisted as build data.

## ActiveBuildState

Application state around one mutable package `ShipLoadout`.

| Field                      | Type                                        | Rule                                                                              |
| -------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| `loadout`                  | `ShipLoadout \| null`                       | Only live source of build/game behavior                                           |
| `provenance`               | `none \| stock \| working \| named \| link` | Application workflow origin, not exported                                         |
| `autosaveRecordId`         | `UUID \| null`                              | The unnamed record this page autosaves into; null until the first edit forks one  |
| `sourceNamed`              | `{ recordId; baseRevisionId } \| null`      | The record the build was opened from and the revision observed then; local only   |
| `baselineFingerprint`      | opaque string or null                       | Compares active modelled state with the last state written to a record            |
| `dirty`                    | boolean                                     | Modelled state has changed since the last successful write; also what forks       |
| `persistence`              | `PersistenceStatus`                         | Does not determine whether the build is usable                                    |
| `link`                     | `LinkPublicationState`                      | Current fragment synchronization/refusal status                                   |
| `qualityCompletionNotices` | readonly package-derived notice[]           | Transient workflow disclosures for completed partial engineering; never persisted |

Ingress transition:

```text
source intent -> construct/decode candidate -> validate candidate
    failure -> explain; active state unchanged
    success -> commit candidate
commit -> a candidate with no record of its own mints one and autosaves
       -> a candidate opened from a record holds it as sourceNamed and writes nothing
       -> synchronize fragment

first modelled edit with no autosave record -> fork an unnamed record -> autosave there
```

No loader mutates the active state before its candidate has completed parsing, construction and validation.

There is no confirmation step in that sequence, and `dirty` does not gate it. The build being replaced
is recoverable from a record the library still lists, so replacing it loses nothing there is anything
to ask about (FR-008, FR-009). `dirty` keeps two jobs instead: it says a write is owed, which the
coalescing timer and the lifecycle flush act on, and it is the first edit after an open that forks the
record autosave will write to.

Opening a record does **not** adopt it. A build opened from a record is already recoverable from that
record, so nothing is written until the Commander changes something — and when they do, the change
goes into an unnamed record of its own. Autosave never reaches a named record by any path, which is
what keeps naming a build a decision the Commander made rather than one the next keystroke can undo
(FR-008, ruled 2026-08-25).

## BuildSnapshotV1

Lossless, non-derived application representation used by local persistence. It is not SLEF and is not the compact link body.

| Field        | Type                          | Rule                                                                      |
| ------------ | ----------------------------- | ------------------------------------------------------------------------- |
| `format`     | literal `edsb.build`          | Discriminator                                                             |
| `version`    | literal `1`                   | Build snapshot decoder version                                            |
| `shipSymbol` | string                        | Package-resolved hull identity in retained spelling                       |
| `shipName`   | `string \| null`              | Null is absent; empty string, if accepted, remains distinct               |
| `shipIdent`  | `string \| null`              | Null is absent                                                            |
| `modules`    | readonly `SnapshotModuleV1[]` | One entry per fitted package-resolved module; package slot order retained |

### SnapshotModuleV1

| Field           | Type                              | Rule                                                                              |
| --------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| `slot`          | string                            | Original game slot key and spelling; unique case-insensitively                    |
| `symbol`        | string                            | Package-resolved module identity and spelling                                     |
| `enabled`       | `boolean \| null`                 | Null means the field was absent; false is never collapsed                         |
| `priority`      | `0..4 \| null`                    | Package/journal zero-based value; null means absent                               |
| `preEngineered` | `PreEngineeredIdentityV1 \| null` | Exact package-identified variant tuple, independent of later ordinary engineering |
| `engineering`   | `EngineeringSnapshotV1 \| null`   | Ordinary/current package-resolved engineering required for reconstruction         |

`PreEngineeredIdentityV1` contains base module `symbol`, blueprint `fdname`, grade, acquisition identity and nullable package experimental `fdname`. `EngineeringSnapshotV1` preserves nullable blueprint/effect identities, grade, completed quality and modifiers needed by the package adapter. The serializer takes package identity from `FittedModule.preEngineeredVariant` and retained raw state; it never guesses a variant from presentation text.

Validation:

- Decode JSON as untrusted input and validate every discriminant, scalar and collection bound before package construction.
- Reconstruct with `ShipLoadout.fromLoadout()` and package pre-engineered helpers already used by the codec.
- Duplicate slots and structurally invalid identity fields make a snapshot malformed. Unknown module
  identities are outside the supported migration contract. An unknown hull refuses reconstruction;
  fixed mounts are returned with package defaults before the latest snapshot is serialized.
- Calculated values, catalogue facts, local note/name, record IDs, validation snapshots and timestamps are forbidden.

## LocalRecordV1

One atomic value stored under `edsb:record:<id>`.

| Field         | Type                                    | Rule                                                                                          |
| ------------- | --------------------------------------- | --------------------------------------------------------------------------------------------- |
| `format`      | literal `edsb.local-record`             | Reject other owned-looking values without deleting them                                       |
| `version`     | literal `1`                             | Record-envelope version                                                                       |
| `id`          | UUID                                    | Immutable local identity; must equal key suffix                                               |
| `kind`        | `working \| named`                      | Whether the Commander has named this record; `working` is the stored spelling of unnamed      |
| `revisionId`  | UUID                                    | Fresh after every successful write; never time-derived                                        |
| `createdAt`   | ISO-8601 instant                        | Display metadata only                                                                         |
| `modifiedAt`  | ISO-8601 instant                        | Locale-formatted display metadata, and the instant an unnamed record's expiry is derived from |
| `name`        | `string \| null`                        | Null for working; named duplicates allowed after warning                                      |
| `note`        | `string \| null`                        | At most one local note; excluded from link and SLEF                                           |
| `hullSymbol`  | string                                  | List metadata; must equal `build.shipSymbol`                                                  |
| `validation`  | `{ valid: boolean; complete: boolean }` | Exact package booleans at the snapshot revision                                               |
| `build`       | `BuildSnapshotV1`                       | Lossless modelled state                                                                       |
| `sourceNamed` | `{ recordId; baseRevisionId } \| null`  | Present only on an unnamed record forked from another; identity and revision at the fork      |

Package construction owns fixed-mount defaulting. Autosave, naming and duplication store only the
resulting modelled build; no empty-source or defaulting provenance is retained.

`kind` is not a lifecycle. An unnamed record is a whole record — autosaved, listed, openable and
permanent — and is not a draft of a real one somewhere else. It is `working` in the stored bytes
because that is the discriminant version 1 published and those bytes are already saved; everywhere
else it is read as "has no name yet". Naming flips the discriminant in place and mints no second
record (FR-009).

It is also the only thing autosave looks at. A record with `kind: 'named'` is never an autosave
target, whatever a page is holding, so the invariant survives a migrated record, a record named in
another tab and a record whose bytes arrived before this ruling.

State transitions:

```text
any --open--> held; nothing written
held --first modelled edit--> a fresh unnamed record, sourceNamed set where the origin was named
unnamed --named--> named, same ID, fresh revision; nothing left behind
unnamed --written into its sourceNamed record--> that record takes a fresh revision; the unnamed one is removed
unnamed --saved as a copy--> new named ID/revision; the original stays unnamed
named --rename--> named (new revision)
named --duplicate--> new named ID/revision
any --delete confirmed--> removed
unnamed --seven days past modifiedAt, not held by a live page--> removed
autosave ID --claimed by a second live page--> the later page forks and writes there
supported old version --lossless migration succeeds--> current version, same ID
unsupported newer/malformed --open--> unavailable listing; bytes unchanged
```

Removal appears three times in that list and nowhere else. A confirmed deletion. The manual save that
writes an unnamed record's build into the record it came from, which is a removal the Commander asked
for by choosing to overwrite, and which happens after that write succeeds and never before. And the
seven-day expiry of an unnamed record, which is the one removal no Commander pressed — so the entry
carries its remaining time (FR-010) and a name stops it at any moment (FR-013).

## TabDescriptorV1

Stored in this top-level browsing context's `sessionStorage` under `edsb:tab`.

| Field             | Type        | Rule                                   |
| ----------------- | ----------- | -------------------------------------- |
| `version`         | literal `1` | Descriptor version                     |
| `workingRecordId` | UUID        | Autosave record restored across reload |

A fresh in-memory `pageNonce` participates in a BroadcastChannel claim. If another live page owns the same working ID, the later claimant generates a new ID and copies its candidate to a new working record. The nonce is ephemeral and never a record identity.

## SaveConflict

| Field                | Type                  | Rule                                                          |
| -------------------- | --------------------- | ------------------------------------------------------------- |
| `recordId`           | UUID                  | The conflicted record                                         |
| `expectedRevisionId` | UUID                  | Baseline opened by this tab                                   |
| `observedRevisionId` | UUID                  | Latest decoded stored revision                                |
| `attempted`          | candidate record      | This page's version; retained in memory and in its own record |
| `observed`           | decoded stored record | The other page's current version                              |

Transitions:

- `overwrite`: re-lock and write only if `observedRevisionId` still matches; otherwise emit a refreshed conflict.
- `keepBoth`: create a new named ID/revision and preserve `observed`.
- `cancel`: write nothing to the conflicted record; the active build and this page's own record remain.

## PersistenceStatus

`ready`, `saving`, `saved`, `quota-full`, `unavailable`, `write-failed`, or `record-deleted-externally`.

There is no `retention-limit`: FR-013 replaced the count limit with a seven-day expiry, and expiry is
not a persistence status. It is a property of a stored record, derived from `modifiedAt`, shown on
the entry rather than on the workspace.

- Status always carries a localized-message key and safe structured parameters, never a hard-coded message.
- Every failure state leaves the active build editable.
- `record-deleted-externally` pauses autosave until an explicit resume; it does not recreate work the Commander deliberately discarded.

## LinkPublicationState

`absent`, `encoding`, `published(fragment)`, or `refused(code, slot?, params?)`.

- `published` contains only a codec value beginning `b.` and at most 500 characters.
- `refused` clears any stale build fragment before it is exposed and retains enough structured data to explain the affected slot/reason and offer SLEF.
- Codec exception messages are internal; presentation maps stable codes/params through localization.
