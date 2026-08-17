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

| Field                  | Type                                        | Rule                                                                                     |
| ---------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `loadout`              | `ShipLoadout \| null`                       | Only live source of build/game behavior                                                  |
| `provenance`           | `none \| stock \| working \| named \| link` | Application workflow origin, not exported                                                |
| `workingRecordId`      | UUID                                        | This tab's autosave target; local only                                                   |
| `sourceNamed`          | `{ recordId; baseRevisionId } \| null`      | Optimistic save baseline; local only                                                     |
| `baselineFingerprint`  | opaque string or null                       | Compares active modelled state with its explicit-save/open baseline; not a game identity |
| `dirty`                | boolean                                     | True for a new unnamed build or when modelled state differs from the named/open baseline |
| `persistence`          | `PersistenceStatus`                         | Does not determine whether the build is usable                                           |
| `link`                 | `LinkPublicationState`                      | Current fragment synchronization/refusal status                                          |
| `normalisationNotices` | readonly package-derived notice[]           | Local workflow disclosures; fixed-mount entries persist with the local record only       |

Replacement transition:

```text
source intent -> construct/decode candidate -> validate candidate
    failure -> explain; active state unchanged
    success + no unsaved work -> commit candidate
    success + unsaved work -> confirm
        cancel -> active state unchanged
        replace -> commit candidate
commit -> fork into this tab's working record -> autosave -> synchronize fragment
```

No loader mutates the active state before its candidate has completed parsing, construction and validation.

## BuildSnapshotV1

Lossless, non-derived application representation used by local persistence. It is not SLEF and is not the compact link body.

| Field        | Type                          | Rule                                                                  |
| ------------ | ----------------------------- | --------------------------------------------------------------------- |
| `format`     | literal `edsb.build`          | Discriminator                                                         |
| `version`    | literal `1`                   | Build snapshot decoder version                                        |
| `shipSymbol` | string                        | Package hull identity in retained spelling                            |
| `shipName`   | `string \| null`              | Null is absent; empty string, if accepted, remains distinct           |
| `shipIdent`  | `string \| null`              | Null is absent                                                        |
| `modules`    | readonly `SnapshotModuleV1[]` | One entry per fitted or unresolved source slot; source order retained |

### SnapshotModuleV1

| Field           | Type                              | Rule                                                                                                            |
| --------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `slot`          | string                            | Original game slot key and spelling; unique case-insensitively                                                  |
| `symbol`        | string                            | Original package/unresolved module identity and spelling                                                        |
| `enabled`       | `boolean \| null`                 | Null means the field was absent; false is never collapsed                                                       |
| `priority`      | `0..4 \| null`                    | Package/journal zero-based value; null means absent                                                             |
| `preEngineered` | `PreEngineeredIdentityV1 \| null` | Exact package-identified variant tuple, independent of later ordinary engineering                               |
| `engineering`   | `EngineeringSnapshotV1 \| null`   | Ordinary/current engineering, including unresolved names and retained raw modifiers required for reconstruction |

`PreEngineeredIdentityV1` contains base module `symbol`, blueprint `fdname`, grade, acquisition identity and nullable package experimental `fdname`. `EngineeringSnapshotV1` preserves nullable blueprint/effect identities, grade, completed quality and modifiers needed by the package adapter. The serializer takes package identity from `FittedModule.preEngineeredVariant` and retained raw state; it never guesses a variant from presentation text.

Validation:

- Decode JSON as untrusted input and validate every discriminant, scalar and collection bound before package construction.
- Reconstruct with `ShipLoadout.fromLoadout()` and package pre-engineered helpers already used by the codec.
- Duplicate slots make the snapshot malformed; unknown identities do not. They remain in their original entries and are reported by the package where supported.
- Calculated values, catalogue facts, local note/name, record IDs, validation snapshots and timestamps are forbidden.

## LocalRecordV1

One atomic value stored under `edsb:record:<id>`.

| Field                     | Type                                           | Rule                                                                                |
| ------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `format`                  | literal `edsb.local-record`                    | Reject other owned-looking values without deleting them                             |
| `version`                 | literal `1`                                    | Record-envelope version                                                             |
| `id`                      | UUID                                           | Immutable local identity; must equal key suffix                                     |
| `kind`                    | `working \| named`                             | Controls ownership and UI behavior                                                  |
| `revisionId`              | UUID                                           | Fresh after every successful write; never time-derived                              |
| `createdAt`               | ISO-8601 instant                               | Display metadata only                                                               |
| `modifiedAt`              | ISO-8601 instant                               | Locale-formatted display metadata only                                              |
| `name`                    | `string \| null`                               | Null for working; named duplicates allowed after warning                            |
| `note`                    | `string \| null`                               | At most one local note; excluded from link and SLEF                                 |
| `hullSymbol`              | string                                         | List metadata; must equal `build.shipSymbol`                                        |
| `validation`              | `{ valid: boolean; complete: boolean }`        | Exact package booleans at the snapshot revision                                     |
| `build`                   | `BuildSnapshotV1`                              | Lossless modelled state                                                             |
| `sourceNamed`             | `{ recordId; baseRevisionId } \| null`         | Present only on a working record opened/forked from a named record                  |
| `fixedMountNormalisation` | readonly `FixedMountNormalisationProvenance[]` | Local-only ingress provenance; excluded from modelled build, history, link and SLEF |

### FixedMountNormalisationProvenance

| Field                 | Type             | Rule                                                                 |
| --------------------- | ---------------- | -------------------------------------------------------------------- |
| `slotKey`             | string           | Exact game slot key affected by sanctioned fixed-mount normalisation |
| `originalIdentity`    | `string \| null` | Original missing/unresolved identity; null means absent              |
| `replacementIdentity` | string           | Package default identity installed by the normaliser                 |
| `normalisedAt`        | ISO-8601 instant | Display metadata only; never identity or conflict ordering           |

Feature 002 creates these entries during candidate ingress. Working autosave and named save/duplicate
copy them as record metadata. A successful Commander edit to the exact mount clears its entry;
refused/cancelled/no-op and viewing changes do not. Undo restores only `BuildSnapshotV1` and therefore
does not recreate cleared provenance. Opening/replacing loads only the incoming record metadata and
record deletion discards it. Link and SLEF adapters cannot accept this type.

State transitions:

```text
working --save with name--> new named copy + working provenance retained
working --duplicate--> new named copy + working retained
named --open--> copied into tab working
named --rename--> named (new revision)
named --duplicate--> new named ID/revision
named --delete confirmed--> removed
working --explicit discard confirmed--> removed
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

| Field                | Type                   | Rule                                                    |
| -------------------- | ---------------------- | ------------------------------------------------------- |
| `recordId`           | UUID                   | Conflicted named record                                 |
| `expectedRevisionId` | UUID                   | Baseline opened by this tab                             |
| `observedRevisionId` | UUID                   | Latest decoded stored revision                          |
| `attempted`          | candidate named record | This tab's version; retained in memory/working autosave |
| `observed`           | decoded named record   | Other tab's current version                             |

Transitions:

- `overwrite`: re-lock and write only if `observedRevisionId` still matches; otherwise emit a refreshed conflict.
- `keepBoth`: create a new named ID/revision and preserve `observed`.
- `cancel`: write no named value; active and working state remain.

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
