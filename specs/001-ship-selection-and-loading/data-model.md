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
| `recordId`                 | UUID                                        | The record this page autosaves into, named or not; local only                     |
| `sourceNamed`              | `{ recordId; baseRevisionId } \| null`      | The record this one was forked from and the revision observed then; local only    |
| `baselineFingerprint`      | opaque string or null                       | Compares active modelled state with the last state written to its record          |
| `dirty`                    | boolean                                     | Modelled state has changed since the last successful write to its record          |
| `persistence`              | `PersistenceStatus`                         | Does not determine whether the build is usable                                    |
| `link`                     | `LinkPublicationState`                      | Current fragment synchronization/refusal status                                   |
| `qualityCompletionNotices` | readonly package-derived notice[]           | Transient workflow disclosures for completed partial engineering; never persisted |

Ingress transition:

```text
source intent -> construct/decode candidate -> validate candidate
    failure -> explain; active state unchanged
    success -> commit candidate
commit -> adopt the candidate's record, or mint one for it -> autosave -> synchronize fragment
```

No loader mutates the active state before its candidate has completed parsing, construction and validation.

There is no confirmation step in that sequence, and `dirty` is not consulted by it. The build being
replaced is a record of its own that the library still lists, so replacing it loses nothing there is
anything to ask about (FR-008, FR-009). `dirty` survives as a persistence fact: it says a write is
owed, which is what the coalescing timer and the lifecycle flush act on.

Opening a record adopts it — the page autosaves into that record rather than into a copy of it.
Creating a stock build, decoding a link and importing a SLEF file each mint a record instead, because
there is no existing one to adopt.

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

| Field         | Type                                    | Rule                                                                                     |
| ------------- | --------------------------------------- | ---------------------------------------------------------------------------------------- |
| `format`      | literal `edsb.local-record`             | Reject other owned-looking values without deleting them                                  |
| `version`     | literal `1`                             | Record-envelope version                                                                  |
| `id`          | UUID                                    | Immutable local identity; must equal key suffix                                          |
| `kind`        | `working \| named`                      | Whether the Commander has named this record; `working` is the stored spelling of unnamed |
| `revisionId`  | UUID                                    | Fresh after every successful write; never time-derived                                   |
| `createdAt`   | ISO-8601 instant                        | Display metadata only                                                                    |
| `modifiedAt`  | ISO-8601 instant                        | Locale-formatted display metadata only                                                   |
| `name`        | `string \| null`                        | Null for working; named duplicates allowed after warning                                 |
| `note`        | `string \| null`                        | At most one local note; excluded from link and SLEF                                      |
| `hullSymbol`  | string                                  | List metadata; must equal `build.shipSymbol`                                             |
| `validation`  | `{ valid: boolean; complete: boolean }` | Exact package booleans at the snapshot revision                                          |
| `build`       | `BuildSnapshotV1`                       | Lossless modelled state                                                                  |
| `sourceNamed` | `{ recordId; baseRevisionId } \| null`  | Present only on a record forked from another; identity and revision observed at the fork |

Package construction owns fixed-mount defaulting. Autosave, naming and duplication store only the
resulting modelled build; no empty-source or defaulting provenance is retained.

`kind` is not a lifecycle. An unnamed record is a whole record — autosaved, listed, openable and
permanent — and is not a draft of a real one somewhere else. It is `working` in the stored bytes
because that is the discriminant version 1 published and those bytes are already saved; everywhere
else it is read as "has no name yet". Naming flips the discriminant in place and mints no second
record (FR-009).

State transitions:

```text
unnamed --named--> named, same ID, fresh revision; nothing left behind
unnamed --saved as a copy--> new named ID/revision; the original stays unnamed
named --open--> adopted by this page; its edits autosave into it
named --rename--> named (new revision)
named --duplicate--> new named ID/revision
any --delete confirmed--> removed
any --claimed by a second live page--> the later page forks an unnamed copy and writes there
supported old version --lossless migration succeeds--> current version, same ID
unsupported newer/malformed --open--> unavailable listing; bytes unchanged
```

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

`ready`, `saving`, `saved`, `retention-limit`, `quota-full`, `unavailable`, `write-failed`, or `record-deleted-externally`.

- Status always carries a localized-message key and safe structured parameters, never a hard-coded message.
- Every failure state leaves the active build editable.
- `record-deleted-externally` pauses autosave until an explicit resume; it does not recreate work the Commander deliberately discarded.

## LinkPublicationState

`absent`, `encoding`, `published(fragment)`, or `refused(code, slot?, params?)`.

- `published` contains only a codec value beginning `b.` and at most 500 characters.
- `refused` clears any stale build fragment before it is exposed and retains enough structured data to explain the affected slot/reason and offer SLEF.
- Codec exception messages are internal; presentation maps stable codes/params through localization.
