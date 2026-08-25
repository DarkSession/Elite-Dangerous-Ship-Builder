# Build Library Screen

**Route**: `/builds`  
**Requirements**: FR-008–FR-014

## Composition

- Wide: canvas 1a's centered, route-backed saved-build modal over an inert originating screen — a scrim, an amber-hairline body, a darker title bar carrying `SAVED BUILDS` and a monospace dismiss, and a committing footer on its own plate. Narrow: canvas 1b's full-screen saved-build layer with a back arrow in its own bar and the same footer pinned. Direct navigation to `/builds` supplies an ordinary page background while keeping the same content and the same title.
- The modal's own title bar is this screen's heading, and the record count sits beside the search field in the header row under it, where the reference draws it. The command bar behind the modal keeps naming the screen the modal was opened over.
- A header row: one search field over the records, and the count of records in monospace beside it.
- Column headers on their own lighter plate — `BUILD`, `HULL`, `Mcr`, `EDITED` — over a scrolling body, as one semantic list rather than four unrelated columns.
- Semantic `ResponsiveRecordList` divided by labeled unnamed and named groups without changing one logical reading order.
- `SavedBuildCard` showing the local name or that there is none, its note on one line, package hull text, locale-formatted last modification and recorded validation valid/complete state. An unnamed record forked from a named one says which one, so unsaved edits to a saved build are distinguishable from a build that never had a name. Note presence/content is local and exposed through a named editor.
- An unnamed row is titled by the build's own ship name, or its ident, or the hull — read from the build each time it is drawn, never written onto the record, and set apart from a Commander-given name rather than passed off as one. The reference draws the name as the largest thing in a row, and a week of rows all reading one word would be a pile rather than a library. Ship name and ident are the Commander's own words and are not package text, so they carry no translation marker.
- A leading 3px marker on every row, filled amber with a wash running from the leading edge on the record the workspace currently holds, and a monospace issue count on a warm plate beside the title where the recorded validation has issues.
- Actions on a named record: open, rename, duplicate and delete. On an unnamed one: open, name it, duplicate it under a new name, and delete. Naming acts on the record itself and leaves nothing behind (persistence contract, "Autosaved records").
- A committing footer: the destructive action bordered warm on the leading edge, the opening action filled amber on the trailing edge.
- `ConfirmDialog` for delete, name dialog with duplicate warning, three-choice conflict dialog, and record manager for quota recovery.
- The remaining life of every unnamed record, stated on its own row in words and in the active locale's relative time, with naming offered from the row that is about to run out (FR-010, FR-013).
- `InlineNotice`/`ErrorSummary` for storage unavailability, malformed records, unsupported newer versions and failed operations.

The reference rows establish the compact name/note, hull, validation badge and modified-time hierarchy. Feature 001 adds a visible unnamed-record group/state and the missing rename/duplicate/manage actions. The reference price column is optional feature 009 composition: it appears only from package-owned build cost state and is not copied into feature 001 record metadata or used as a persistence identity.

### The library is not built to the canvas, recorded 2026-08-25 (Commander request)

`/builds` is drawn on both canvases as a **surface** — a framed modal at wide widths, a full-screen layer at narrow ones — with its own title bar, its own header row, column headers and a committing footer. What is built is a plain page: a stacked grid of `SavedBuildCard` panels, a quiet close button under them, and no frame of any kind. Every part below is a difference between the drawing and the build, not a difference of opinion about the drawing, and each is a task in phase 11.

| Reference part                                                               | Built today                                                                                                 |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Scrim and modal frame over an inert originating screen                       | An ordinary route page; nothing is behind it and nothing is inert                                           |
| Title bar reading `SAVED BUILDS` with a monospace `CLOSE ✕`                  | No title bar; the count goes to the command bar and the dismiss is a quiet button at the end of the content |
| Header row: a search field beside a monospace record count                   | Neither. There is no way to search a library holding a week of ordinary building                            |
| Column headers `BUILD` / `HULL` / `Mcr` / `EDITED` on a lighter plate        | None; each card repeats its own field labels                                                                |
| Dense rows in one scrolling body under a fixed header                        | A responsive card grid, several columns wide, each card a definition list                                   |
| The 3px leading marker, amber with a wash on the current record              | No marker and no current-record treatment at all                                                            |
| The monospace issue badge beside the title                                   | A full `StatusNotice` inside every card                                                                     |
| Committing footer: `DELETE` bordered warm, `OPEN IN OUTFITTING` filled amber | Per-card action buttons, all of them quiet                                                                  |
| Compact: full-screen layer, back arrow, pinned footer                        | The same card grid, narrower                                                                                |

Two of these are more than visual. The absent search is a capability the reference carries and the build does not, and it is the one control that makes a week of ordinary building usable — every build now has a record (FR-008), so this is the surface that has to hold a real library rather than a handful of deliberate saves. And a library with no current-record marker cannot answer "which of these am I in?", which is the first question a Commander opening it has.

## States

| State                   | Required presentation and behavior                                                                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty                   | Explain that no recoverable records exist; application may still hold an in-memory build if persistence is unavailable.                                                      |
| Populated               | Records are ordered by displayed modified instant with stable ID tie-breaker; ordering never implies deletion. The record the workspace holds is marked as the current one.  |
| Unsaved edits to a save | An unnamed record naming the record it forked from, listed beside it. The named record shows its own saved state and is not marked edited.                                   |
| Searched                | The search narrows the listed records over the fields a row shows and announces the count politely; it changes no record and no order.                                       |
| No match                | One centred sentence on the body's own ground saying nothing matched; every control stays reachable so widening the search needs no separate action.                         |
| Duplicate name          | Warning identifies existing matches; proceed remains allowed and creates/renames by local UUID.                                                                              |
| Delete confirmation     | Identifies exact record/hull; cancel writes nothing; confirmation removes only that key.                                                                                     |
| Conflict                | Shows that another page changed the record and offers overwrite, keep both and cancel. No lock is held while shown.                                                          |
| Conflict changed again  | Refresh observed version and ask again; never overwrite a third version silently.                                                                                            |
| Expiring                | Every unnamed row states its remaining life and offers naming from the row; the nearest to running out is not reordered to the top, because ordering means modified instant. |
| Expired                 | Swept before the listing is drawn, so no row is removed under a Commander reading it; the entry is simply not there, and nothing announces a deletion they did not make.     |
| Quota full              | The record manager permits explicit deletion and retry; every record's bytes remain until selected. Expiry is not offered as a way out of a full quota.                      |
| Unsupported newer       | Listed as unavailable and retained byte-for-byte; open is unavailable without guessing.                                                                                      |
| Malformed               | Isolated unavailable entry; valid siblings remain operable; never auto-repaired/deleted.                                                                                     |
| Storage unavailable     | Persistent explanation and retry; no build interaction outside persistence is disabled.                                                                                      |

## Operation rules

**Revised 2026-08-25 (Commander request, FR-008/FR-009).**

- Open first decodes/migrates/reconstructs a detached candidate; failure cannot replace active work.
  Success holds that record and writes nothing: the build is already recoverable from it. Nothing is
  asked before the current build is replaced either, because that one is on this same list.
- Opening does **not** adopt. The first modelled edit forks an unnamed record carrying `sourceNamed`,
  and every autosave goes there. The record that was opened is never an autosave target, so a
  Commander who opens a saved build and changes their mind still has the version they saved.
- Two pages may hold one named record open, because neither writes to it. Only self-minted autosave
  records can collide, and only where `sessionStorage` was cloned, which the claim handshake forks
  (FR-012).
- Naming an unnamed record writes the name onto that record: same identity, fresh revision, nothing
  left behind and nothing removed. Rename/duplicate preserve build and validation snapshot. Duplicate
  creates new record/revision IDs even when retaining the same display name.
- Two things remove a record and no third: a confirmed deletion, and the manual save that writes an
  unnamed record's build into the record it came from, which removes the unnamed one once that write
  has succeeded. A third removes one without a Commander pressing anything: the seven-day expiry of
  an unnamed record, which every unnamed row states beforehand and any name stops (FR-013).
- Notes stay in local record metadata and never appear in share/SLEF serializers.
- `storage`/BroadcastChannel invalidation causes a safe re-read; rows never assume cached bytes are
  current.
- A page whose autosave record was discarded elsewhere pauses autosave and requires explicit resume
  rather than silently recreating it.

## Responsive and accessibility notes

- Desktop uses the reference columnar modal; mobile retains the reference stacked records with the same named actions and semantic list order.
- The current-record marker is drawn as the reference draws it and is also stated in words and in
  `aria-current`; the amber wash is never the only thing carrying it.
- The issue badge is a count with its own words, not a colour: a row with issues says so.
- Validation state includes explicit valid/incomplete/invalid wording and icon; never color alone.
- Dialog title, description and each choice are visible and programmatically associated. Conflict choices explain which versions survive.
- Record names/notes/symbols wrap without truncating identity or causing page overflow.
- While the route-backed modal is open, its background is inert and removed from the accessibility tree; close/back restores the originating route and session position.
- Previews cover empty, populated, current-record, searched, no-match, duplicate, delete, conflict, changed-again, expiring, quota, unsupported, malformed and unavailable states.

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
