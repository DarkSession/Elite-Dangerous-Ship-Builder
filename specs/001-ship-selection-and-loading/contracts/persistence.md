# Persistence Contract

## Ownership and key space

- The application owns only `localStorage` keys beginning `edsb:record:` and the `sessionStorage` key `edsb:tab`.
- A local record key is `edsb:record:<record-id>`, where the suffix is the record's UUID and equals its embedded `id`.
- Listing enumerates owned keys and validates records independently. There is no mutable global index.
- Unknown, malformed and unsupported-version values are never repaired, overwritten or removed merely by listing/opening them.

The current schemas are [LocalRecordV1 and BuildSnapshotV1](../data-model.md). Browser bytes are untrusted input even when this application originally wrote them.

## Atomic read/write behavior

1. Serialize a complete candidate before accessing storage.
2. For updates requiring concurrency protection, acquire the applicable short Web Lock.
3. Re-read and strictly decode the current value.
4. Verify ID, kind and revision preconditions.
5. Call exactly one `setItem(key, completeJson)` for the record.
6. Treat any thrown exception as a failed write; retain the prior active and stored state.
7. Re-read the successful value when a caller needs authoritative returned state.

No operation writes an index plus a record. Delete calls one `removeItem` only after explicit confirmation.

## Version and migration behavior

- `format` selects the record family; `version` selects a frozen decoder.
- Version 1 is the first published version. No fictional version 0 migration exists.
- Every supported older decoder produces a canonical intermediate model. Pure sequential migrations then produce the latest model.
- A migrated record replaces its own key only after decode, migration, package reconstruction and
  latest-version serialization all succeed. An unknown hull refuses
  opening and leaves the original bytes unchanged. A record containing an unsupported module
  identity likewise refuses migration and opening atomically; its original bytes remain unchanged.
- If migration persistence fails, the original old-version bytes remain authoritative and opening may continue from the in-memory candidate with a visible persistence warning.
- A version greater than the latest supported value is listed as unsupported and left byte-for-byte unchanged.
- Each future published version adds frozen lossless round-trip and failed-write fixtures; supported decoders are not silently removed.

## Autosaved records

**Revised 2026-08-25 (Commander request, FR-008).** Every build a Commander works on is a record of
its own, from the moment it becomes active. A record either carries a name or does not; both are
autosaved the same way, both are listed, and neither is a draft of the other. There is no per-tab
working record that the next build writes over, which is why nothing has to be confirmed before a
build is replaced.

- `edsb:tab` supplies the record ID this top-level browsing context is holding, across reload.
- A build with no record yet — stock creation, a decoded link, a SLEF import — mints a fresh ID and
  is written to it before the Commander changes anything. Opening an existing record **adopts** its
  ID: the page autosaves into that record. Nothing is copied and no working duplicate is made.
- Ordinary new tabs hold different records. A BroadcastChannel claim collision — a duplicated tab, or
  a second page opening the record this one holds — forks the later claimant onto a fresh unnamed ID,
  with its current build copied into it, before either page next autosaves (FR-012).
- Autosave targets only the held record's key and is coalesced after modelled edits. Best-effort
  flush occurs on `pagehide` and when the document becomes hidden.
- Naming writes the name onto the held record and flips its `kind` to `named` under that record's own
  lock: same key, same ID, fresh `revisionId`. No second record is created and none is removed.
  Saving a copy under another name is the separate operation that mints one, and it leaves the
  original where it is.
- A held record removed elsewhere enters `record-deleted-externally`; autosave pauses until the
  Commander explicitly resumes.
- Package-defaulted fixed modules persist as ordinary `BuildSnapshotV1` state with no source-empty,
  repair or defaulting provenance.

At most 20 unnamed records may exist:

- Existing records may always be updated, named or not.
- Minting unnamed record 21 performs no write and no deletion. The active build remains in memory and
  the library opens record management, which offers two ways forward: discard records, or name one of
  them.
- Naming a record releases its slot. Named records do not consume this count and are bounded by
  storage quota alone.
- Only explicit, individually selected, confirmed discard removes a record. Sort order never implies
  eviction, and reaching the limit never evicts anything.

## Deliberate operations and conflicts

Naming, renaming, duplicating and deleting use `navigator.locks.request('edsb:record:<record-id>', {mode: 'exclusive'}, ...)` with an expected `revisionId`. Duplicate/keep-both creates a fresh UUID and lock target. The lock name was `edsb:named:<record-id>` while named records were the only ones written deliberately; it guards any record now, named or not, and is a Web Locks name rather than stored bytes, so nothing a Commander has saved changes with it.

Autosave does not take the lock. The claim handshake above guarantees this page is the only live writer of the record it holds, and a lock per coalesced edit would serialize writes against a contender that cannot exist.

On a stale revision, return a conflict without writing and offer exactly:

- **Overwrite**: reacquire the lock and replace only the observed revision shown to the Commander. A newer third revision produces another conflict.
- **Keep both**: create a new named record with a fresh record/revision ID; preserve the original; duplicate names remain permitted after their warning.
- **Cancel**: write nothing to the conflicted record. The active build and this page's own record remain available.

No lock is held while a dialog is displayed. `storage` events and BroadcastChannel messages invalidate cached listings/baselines; handlers always re-read storage. If Web Locks are unavailable, unsafe in-place overwrite is unavailable, but keep-both/cancel and this page's own record remain.

## Failure behavior

All storage access, including obtaining the storage object, enumeration, `getItem`, `setItem` and `removeItem`, is behind an injected port and exception boundary.

| Failure                          | Required result                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| Access blocked / `SecurityError` | Persistence becomes unavailable; active build and non-storage features remain usable. |
| Quota exceeded                   | No prior record is removed; active build remains; offer management and retry.         |
| Malformed owned record           | Isolate/list as unavailable; do not prevent other records opening.                    |
| Unsupported newer record         | Retain unchanged; show hull/name metadata only if safely available without guessing.  |
| Generic write/remove failure     | Report failure and retain prior bytes plus active in-memory candidate.                |
| Site data cleared externally     | Report loss honestly; no fabricated recovery or value.                                |

`navigator.storage.estimate()` may be shown as advisory only. A successful private-browsing write is not described as durable beyond browser policy.

## Boundary exclusions

Local record ID, revision, display name, note, timestamps, page ownership, validation snapshot, save
provenance and persistence status never enter build links or
SLEF. The storage serializer and link/SLEF adapters consume the shared modelled snapshot through
separate allowlists; they do not delete forbidden fields after broad serialization.
