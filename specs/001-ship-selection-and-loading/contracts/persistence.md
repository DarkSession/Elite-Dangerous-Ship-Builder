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
- If migration persistence fails, the original old-version bytes remain authoritative and opening
  continues from the in-memory candidate. The failure is not surfaced. The record stays readable in
  its older form, the next open migrates and rewrites it again, and a Commander opening a build can
  do nothing about a store that is full or blocked at that moment.
- A version greater than the latest supported value is listed as unsupported and left byte-for-byte unchanged.
- Each future published version adds frozen lossless round-trip and failed-write fixtures; supported decoders are not silently removed.

## Autosaved records

**Revised 2026-08-25 (Commander request, FR-008).** Every build a Commander works on is recoverable
from a record at all times, and the record autosave writes to is always one this page minted for
itself and the Commander has not named. There is no per-tab working record that the next build writes
over, which is why nothing has to be confirmed before a build is replaced — and there is no path by
which autosave reaches a named record, which is why naming one is still a decision that holds.

- `edsb:tab` supplies the autosave record ID this top-level browsing context is holding, across
  reload, together with the named record it was opened from where there is one.
- A build with no record yet — stock creation, a decoded link, a SLEF import — mints a fresh unnamed
  ID and is written to it before the Commander changes anything.
- Opening an existing record does **not** adopt it. The build is already recoverable from the record
  it was opened from, so opening writes nothing at all; the **first modelled edit** forks a fresh
  unnamed record, carrying `sourceNamed` where the origin was named, and every autosave from then on
  goes there. The record that was opened is not written by autosave, then or ever.
- Both of those moments — the mint at commit and the fork at first edit — first look for an unnamed
  record already holding identical modelled state, and take that record over instead of writing a
  second copy of it. The comparison is the serialized snapshot, the same value the baseline
  fingerprint uses. Records that already exist are never merged by a later edit that happens to make
  them alike.
- Ordinary new tabs mint different records. A duplicated tab clones `sessionStorage` and so claims an
  ID that is already live; the BroadcastChannel handshake forks the later claimant onto a fresh
  unnamed ID, with its current build copied into it, before either page next autosaves (FR-012). Two
  pages holding one named record open is not a collision, because neither writes to it.
- Autosave targets only the held unnamed record's key and is coalesced after modelled edits.
  Best-effort flush occurs on `pagehide` and when the document becomes hidden.
- A manual save consumes the held unnamed record. Naming it writes the name onto that same key and
  flips `kind` to `named` under the record's own lock — same ID, fresh `revisionId`, nothing left
  behind. Writing the build into an existing record instead writes that record under its lock and
  then `removeItem`s the unnamed one, in that order, so a failed write never loses the only copy.
  Either way the page holds a named record afterwards and autosave is idle until the next edit forks
  again. Saving a copy under another name is the separate operation that mints a record and leaves
  the original where it is.
- The autosave record removed elsewhere enters `record-deleted-externally`; autosave pauses until the
  Commander explicitly resumes. A named record removed elsewhere while a page holds it as
  `sourceNamed` makes that page's next save a fresh record rather than a silent recreation of it.
- Package-defaulted fixed modules persist as ordinary `BuildSnapshotV1` state with no source-empty,
  repair or defaulting provenance.

**Unnamed records expire after seven days** (FR-013, ruled 2026-08-25; this replaces the count limit
of twenty and the rule that only a Commander action removed a record):

- The deadline is `modifiedAt` plus seven days. It is derived, never stored — a written deadline
  outlives a clock change and a migration as a stale fact, and `modifiedAt` is already the instant the
  entry displays.
- The sweep runs when the application starts and whenever the listing is read. It is deliberately not
  a timer: a row vanishing under a Commander reading the library is the one removal this design
  cannot make visible, and seven days does not need that precision.
- The sweep never removes a named record, and never removes a record a live page has announced as its
  autosave target. Both exclusions are evaluated at the moment of the sweep rather than cached.
- The sweep calls `removeItem` once per expired key. A failure on one key stops neither the others nor
  the listing, and leaves no partial record behind.
- Taking a record over does not touch `modifiedAt` and so does not restart the seven days. Only a
  modelled edit does.
- Nothing is written or announced when the sweep runs. The remaining time each entry carries is the
  whole of the notice (FR-010, FR-013).
- Naming a record ends its expiry outright. Named records are bounded by storage quota alone.
- There is no count limit. Nothing refuses to store a record because many already exist, and no
  number evicts anything.
- The browser storage quota remains a separate bound with its own behaviour: no prior record is
  removed, the active build remains usable, and the Commander is offered explicit, individually
  selected, confirmed discard. An edit to a named build that cannot fork because the quota is full is
  exactly this case, and the named record it came from is untouched.

## Deliberate operations and conflicts

Naming, renaming, duplicating and deleting use `navigator.locks.request('edsb:record:<record-id>', {mode: 'exclusive'}, ...)` with an expected `revisionId`. Duplicate/keep-both creates a fresh UUID and lock target. The lock name was `edsb:named:<record-id>` while named records were the only ones written deliberately; it guards any record now, named or not, and is a Web Locks name rather than stored bytes, so nothing a Commander has saved changes with it.

Autosave does not take the lock. The claim handshake above guarantees this page is the only live writer of the record it holds, and a lock per coalesced edit would serialize writes against a contender that cannot exist.

Naming, renaming and duplicating are asked for on the build that is open rather than on a row of the
library (FR-009, ruled 2026-08-27). Nothing about the writes changes: the same lock, the same
`revisionId` precondition, the same consumption of the unnamed record the save came from. A record's
one local note is written by the same save, so a note reaches storage only through a deliberate write
and never through a coalesced edit.

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

The migration rewrite is an exception to these rows. It reports nothing, because a Commander opening
a build can do nothing about a full or blocked store at that moment, and the record stays readable in
its older form until a later open rewrites it.

`navigator.storage.estimate()` may be shown as advisory only. A successful private-browsing write is not described as durable beyond browser policy.

## Boundary exclusions

Local record ID, revision, display name, note, timestamps, page ownership, validation snapshot, save
provenance and persistence status never enter build links or
SLEF. The storage serializer and link/SLEF adapters consume the shared modelled snapshot through
separate allowlists; they do not delete forbidden fields after broad serialization.
