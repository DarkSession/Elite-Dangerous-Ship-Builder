# Build Library Screen

**Route**: `/builds`  
**Requirements**: FR-008–FR-014

## Composition

- Wide: canvas 1a's centered, route-backed saved-build modal over an inert originating screen. Narrow: canvas 1b's full-screen saved-build layer with a named return action. Direct navigation to `/builds` supplies an ordinary page background while keeping the same content/heading.
- No page heading and no count of its own: the command bar carries both, as it does on every screen (see [hull-catalogue, "Screen chrome and the command bar"](./hull-catalogue.md#screen-chrome-and-the-command-bar)). Create/select-hull action where appropriate, and the storage summary/status.
- Semantic `ResponsiveRecordList` divided by labeled working and named groups without changing one logical reading order.
- `SavedBuildCard` showing local name or working state, package hull text, locale-formatted last modification and recorded validation valid/complete state. Note presence/content is local and exposed through a named editor.
- Named actions: open, rename, duplicate and delete. Working actions: open, name/save as a named copy, duplicate as a newly named copy and explicit delete/discard. The tab working record remains separate when a named copy is created.
- `ConfirmDialog` for delete/discard, name dialog with duplicate warning, three-choice conflict dialog, and record manager for retention/quota recovery.
- `InlineNotice`/`ErrorSummary` for storage unavailability, malformed records, unsupported newer versions and failed operations.

The reference rows establish the compact name/note, hull, validation badge and modified-time hierarchy. Feature 001 adds a visible working-record group/state and the missing rename/duplicate/manage actions. The reference price column is optional feature 009 composition: it appears only from package-owned build cost state and is not copied into feature 001 record metadata or used as a persistence identity.

## States

| State                       | Required presentation and behavior                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Empty                       | Explain that no recoverable records exist; application may still hold an in-memory build if persistence is unavailable.  |
| Populated                   | Records are ordered by displayed modified instant with stable ID tie-breaker; ordering never implies deletion.           |
| Duplicate name              | Warning identifies existing matches; proceed remains allowed and creates/renames by local UUID.                          |
| Delete/discard confirmation | Identifies exact record/hull; cancel writes nothing; confirmation removes only that key.                                 |
| Named conflict              | Shows that another tab changed the record and offers overwrite, keep both and cancel. No lock is held while shown.       |
| Conflict changed again      | Refresh observed version and ask again; never overwrite a third version silently.                                        |
| Retention limit             | Twenty working records are listed for explicit selection; active memory remains usable and no automatic deletion occurs. |
| Quota full                  | Same manager permits explicit deletion and retry; named/working bytes remain until selected.                             |
| Unsupported newer           | Listed as unavailable and retained byte-for-byte; open is unavailable without guessing.                                  |
| Malformed                   | Isolated unavailable entry; valid siblings remain operable; never auto-repaired/deleted.                                 |
| Storage unavailable         | Persistent explanation and retry; no build interaction outside persistence is disabled.                                  |

## Operation rules

- Open first decodes/migrates/reconstructs a detached candidate; failure cannot replace active work.
- Opening copies into the current tab working record and establishes named `recordId/baseRevisionId` provenance when appropriate.
- Naming a working record creates a named copy with a fresh identity and retains the tab working record. Rename/duplicate preserve build and validation snapshot. Duplicate creates new record/revision IDs even when retaining the same display name.
- Notes stay in local record metadata and never appear in share/SLEF serializers.
- `storage`/BroadcastChannel invalidation causes a safe re-read; cards never assume cached bytes are current.
- A tab whose live working record was discarded elsewhere pauses autosave and requires explicit resume rather than silently recreating it.

## Responsive and accessibility notes

- Desktop uses the reference columnar modal; mobile retains the reference stacked records with the same named actions and semantic list order.
- Validation state includes explicit valid/incomplete/invalid wording and icon; never color alone.
- Dialog title, description and each choice are visible and programmatically associated. Conflict choices explain which versions survive.
- Record names/notes/symbols wrap without truncating identity or causing page overflow.
- While the route-backed modal is open, its background is inert and removed from the accessibility tree; close/back restores the originating route and session position.
- Previews cover empty, populated, duplicate, delete, conflict, changed-again, retention, quota, unsupported, malformed and unavailable states.

## Reference composition

Measured from canvas 1a's `SAVED BUILDS` modal and canvas 1b's `ssv-screen`.

| Part            | Canvas                                                                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wide surface    | A centred dialog on a near-opaque scrim: amber-hairline body, a darker title bar with the title tracked 0.22em and a monospace dismiss, and a committing footer on its own plate |
| Compact surface | The same content as a full-screen layer with a back arrow and a pinned footer                                                                                                    |
| Header row      | A search field beside a monospace record count                                                                                                                                   |
| Column headers  | Monospace, tracked 0.14em, on a slightly lighter plate                                                                                                                           |
| Record          | Title in condensed 600 tracked 0.09em, a one-line note beneath in Barlow 300, then hull, price and edited-at in monospace                                                        |
| Issue badge     | A monospace count on a translucent warm plate beside the title                                                                                                                   |
| Record marker   | A 3px leading edge that takes amber when the record is the current one                                                                                                           |
| Empty state     | Centred prose, no panel                                                                                                                                                          |
| Footer actions  | The destructive action bordered warm on the leading edge, the opening action filled amber on the trailing edge                                                                   |
