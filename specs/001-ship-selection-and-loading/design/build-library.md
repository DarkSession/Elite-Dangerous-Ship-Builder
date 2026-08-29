# Build Library Screen

**Route**: `/builds`  
**Requirements**: FR-008–FR-014

## Composition

- Wide: canvas 1a's centered, route-backed saved-build modal over an inert originating screen — a scrim, an amber-hairline body, a darker title bar carrying `SAVED BUILDS` and a monospace dismiss, and a committing footer on its own plate. Narrow: canvas 1b's full-screen saved-build layer with a back arrow in its own bar and the same footer pinned. Direct navigation to `/builds` supplies an ordinary page background while keeping the same content and the same title.
- The modal's own title bar is this screen's heading, and the record count sits beside the search field in the header row under it, where the reference draws it. The title bar's dismiss is the shared `Close` every layer carries. The command bar behind the modal keeps naming the screen the modal was opened over.
- A header row: one search field over the records carrying its words in the placeholder rather than in a drawn label, and the count of records in monospace beside it on the same line.
- Column headers on their own lighter plate — `BUILD`, `SHIP`, `Mcr`, `EDITED` — over a scrolling body, as one semantic list rather than four unrelated columns.
- Semantic `ResponsiveRecordList` as one list in one order — newest first, with the record id breaking ties — with no group headings between named and unnamed records (FR-010, ruled 2026-08-27).
- `SavedBuildCard` showing the local name or that there is none, its note on one line, package hull text, how long ago it was last edited in the active locale's own words, and recorded validation valid/complete state. The instant itself stays as text beside the row's other read-not-drawn facts, so nothing is lost to a reader who needs it exactly. An unnamed record forked from a named one says which one, so unsaved edits to a saved build are distinguishable from a build that never had a name. Note presence/content is local, written with the build from the workspace's own `SAVE` (FR-011).
- An unnamed row is titled by the build's own ship name, or its ident, or the hull — read from the build each time it is drawn, never written onto the record, and set apart from a Commander-given name rather than passed off as one. The reference draws the name as the largest thing in a row, and a week of rows all reading one word would be a pile rather than a library. Ship name and ident are the Commander's own words and are not package text, so they carry no translation marker.
- A leading 3px marker on every row, filled amber with a wash running from the leading edge on the chosen row — which is the record the workspace holds until a Commander chooses another (revised 2026-08-28) — and a monospace issue count on a warm plate beside the title where the recorded validation has issues.
- Two actions on the record that was chosen, named or not: open it, and delete it. Naming, renaming and saving a copy are the workspace's own `SAVE` and are specified in [`build-workspace.md`](./build-workspace.md) — a library answers "which of these builds", and what should become of one is asked where a Commander is working in it (FR-009, ruled 2026-08-27).
- A committing footer: the destructive action bordered warm on the leading edge, the opening action filled amber on the trailing edge. Each is named for what it does — `DELETE`, `OPEN IN OUTFITTING` — and not for the build it does it to, which is the row the Commander pressed.
- Dismissing the layer returns to the screen it was opened over, address and fragment intact — a Commander who glanced at their saved builds and chose nothing is still in the build they were working in. Where it was reached by its own address there is no such screen, and the build in hand is the destination, or the shipyard where there is none (Commander request 2026-08-27).
- `ConfirmDialog` for delete, and record manager for quota recovery. The name dialog and the three-choice conflict dialog moved to the workspace with the save that raises them.
- The remaining life of every unnamed record, stated on its own row in words and in the active locale's relative time, and a name is what stops that clock — given from the workspace's `SAVE`, not from the row (FR-010, FR-013). Since the 2026-08-26 request that statement is read rather than drawn, together with the recorded validation and the current-build marker: the canvas draws none of the three, and each row's title, issue count, hull and edited time are what it does draw. See FR-010 and FR-013 for the amendment and its one real cost.
- `InlineNotice`/`ErrorSummary` for storage unavailability, malformed records, unsupported newer versions and failed operations.

The reference rows establish the compact name/note, hull, validation badge and modified-time hierarchy. Feature 001 adds the unnamed-record state each row carries in its own title and the missing manage action; naming, renaming and duplicating are the workspace's `SAVE` (FR-009, ruled 2026-08-27). The reference price column is optional feature 009 composition: it appears only from package-owned build cost state and is not copied into feature 001 record metadata or used as a persistence identity.

### The library is not built to the canvas, recorded 2026-08-25 (Commander request)

`/builds` is drawn on both canvases as a **surface** — a framed modal at wide widths, a full-screen layer at narrow ones — with its own title bar, its own header row, column headers and a committing footer. What is built is a plain page: a stacked grid of `SavedBuildCard` panels, a quiet close button under them, and no frame of any kind. Every part below is a difference between the drawing and the build, not a difference of opinion about the drawing, and each is a task in phase 11.

| Reference part                                                               | Built today                                                                                                 |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Scrim and modal frame over an inert originating screen                       | Closed 2026-08-28: a layer over the screen it was opened from, which stays mounted and inert behind it      |
| Title bar reading `SAVED BUILDS` with a monospace `CLOSE ✕`                  | No title bar; the count goes to the command bar and the dismiss is a quiet button at the end of the content |
| Header row: a search field beside a monospace record count                   | Neither. There is no way to search a library holding a week of ordinary building                            |
| Column headers `BUILD` / `SHIP` / `Mcr` / `EDITED` on a lighter plate        | None; each card repeats its own field labels                                                                |
| Dense rows in one scrolling body under a fixed header                        | A responsive card grid, several columns wide, each card a definition list                                   |
| The 3px leading marker, amber with a wash on the current record              | No marker and no current-record treatment at all                                                            |
| The monospace issue badge beside the title                                   | A full `StatusNotice` inside every card                                                                     |
| Committing footer: `DELETE` bordered warm, `OPEN IN OUTFITTING` filled amber | Per-card action buttons, all of them quiet                                                                  |
| Compact: full-screen layer, back arrow, pinned footer                        | The same card grid, narrower                                                                                |

Two of these are more than visual. The absent search is a capability the reference carries and the build does not, and it is the one control that makes a week of ordinary building usable — every build now has a record (FR-008), so this is the surface that has to hold a real library rather than a handful of deliberate saves. And a library with no current-record marker cannot answer "which of these am I in?", which is the first question a Commander opening it has.

### Built to the canvas, and where it still differs, recorded 2026-08-25

Phase 11 built the surface above: the framed layer, the header row, the column
headers, the dense rows, the leading marker, the issue badge and the committing
footer. Three differences from the drawing remain, deliberately:

- **The `Mcr` column is not drawn.** Build cost is feature 009's package-owned
  state and is not record metadata; drawing the column with nothing in it would
  promise a value this surface cannot produce, and computing it would mean
  reconstructing every stored build through the package to draw a list. The
  column returns with the state that fills it.
- **The record's actions are the footer's.** The reference draws rows with no
  buttons and commits from the footer. Choosing a row is one press, committing
  is the next, and no action is hidden behind a row's hover state.

  Feature 001 put five actions there — open, delete, name-it, rename and
  duplicate. Since 2026-08-27 it puts the two the canvas draws, and the other
  three are the workspace's `SAVE`. See "The footer is the canvas's two
  actions" below.

- **The compact surface is the shared layer's sheet.** `edsb-layer`'s adaptive
  presentation resolves to a bottom sheet where the space is narrow and to a
  full-height layer where the viewport is also short. Feature 001 does not fork
  the shared component's responsive contract for one screen (constitution VII).

The remaining life of an unnamed record is stated on its own row. Naming it is
the workspace's `SAVE`, reached by opening the row — which is one press further
than the footer button that used to sit here, and is the same press a Commander
makes to look at the build before deciding to keep it.

### Three corrections to the drawing, 2026-08-26 (Commander request)

The surface was the canvas's; the rows were not measured against it.

- **The row's tracks are the canvas's own.** `1fr 150px 84px`, which is what
  canvas 1a draws once the `Mcr` column between them is taken out. They were
  three fluid parts, so the hull and the edited-at each held a third of the row
  — two short monospace readings taking as much width as the name and the note
  beside them — and the columns drifted with the surface, so no two sizes lined
  the rows up the same way. The tracks are bounded rather than fixed, so a long
  hull name or a doubled text size takes what it has instead of overflowing.
- **`EDITED` sits against the trailing edge**, heading and figure alike, where
  the canvas sets it: a column of dates is read down, and read down it should be
  a column rather than a ragged edge.
- **The header row closes with a hairline**, which is what separates the row that
  searches the library from the rows that are the library.

The **group headings** — unnamed working records above named saves — were kept
here on 2026-08-26 as a divergence not to close. They went on 2026-08-27; see
below.

### Four corrections to the surface, 2026-08-28 (Commander request)

The rows were measured against the canvas; the panel around them was not.

- **860px, and every region edge to edge.** The layer takes the widest of its
  named width steps, which is what canvas 1a draws, and its body is flush. Each
  region carries its own inset instead: the hairline under the search, the plate
  the column headers sit on and the footer's own plate all reach the panel's
  sides, and a row is inset once rather than by the surface and then by itself.
- **The search carries its words in its placeholder**, with no label drawn above
  it, exactly as the shipyard's search does and as canvas 1a draws both. The
  label stays a real one, bound to the control and read aloud: a placeholder goes
  the moment somebody types, so it can never be the only name a field has.
- **The count is `N builds`, on the search's own line.** `N builds stored` said a
  word the surface's title already says, and the drawn label above the field was
  what pushed the count onto a line of its own.
- **A row's own words are its whole accessible name.** `Choose <build>` was added
  after them; the canvas draws no such verb, and the row is a button, which
  already says that pressing it does something.

### Three corrections to the rows, 2026-08-27 (Commander request)

The surface was the canvas's and the row's tracks were; three things inside them
were not.

- **One list, not two groups.** `Unnamed builds` and `Named builds` are gone, and
  the records are one list ordered by last modification with the record id
  breaking ties. The headings were kept in 2026-08-26's review on the argument
  that this library holds a record for every build rather than the canvas's six
  deliberate saves, so which of them a Commander named was worth drawing. It is
  worth _stating_, and every row already states it: a name a Commander typed is
  set in the title's own weight and colour, and a title read from the build is
  set apart from one. The heading said it a second time and cost the thing a
  library is read for — the most recently edited build being the row at the top,
  which two groups make untrue for one of them. What the change costs is that a
  Commander scanning for their deliberate saves reads past their working records;
  the search above the list answers that, and narrows over the title either way.
- **`EDITED` is how long ago, not when.** `19 Aug 2026, 14:32` became `3 weeks
ago`, in the active locale's own words through `Intl.RelativeTimeFormat`, which
  is what the canvas draws in that column at every row (`2 d ago`, `1 w ago`,
  `1 mo ago`). The column is read to tell the recent build from the old one, and
  a column of absolute instants makes a reader do that arithmetic on every row.
  The instant is not lost: it stays as text with the row's other read-not-drawn
  facts, for the reader who needs it exactly.
- **The footer is the canvas's two actions.** `DELETE` and `OPEN IN OUTFITTING`,
  and nothing else. `Save <build> under a name`, `Rename <build>` and
  `Duplicate <build>` are the workspace's `SAVE` now (FR-009, ruled 2026-08-27),
  which is where the build they act on is. Nothing a Commander could do is gone —
  a record is renamed by opening it and saving it over the save it came from, and
  copied by opening it and saving it as a new build.

### The column is `SHIP`, 2026-08-28

The latest canvas revision renames the second column head from `HULL` to `SHIP`, and the record's own
label follows it. The column holds the package's ship text — `Krait Mk II`, `Python` — which is what
a Commander calls the thing they built on; `HULL` is what the application calls it internally and
what the package's own type is named. The row's other words are unchanged, and so is what the column
holds.

## States

| State                   | Required presentation and behavior                                                                                                                                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty                   | Explain that no recoverable records exist; application may still hold an in-memory build if persistence is unavailable.                                                                                                                                  |
| Populated               | One list. Records are ordered by modified instant with stable ID tie-breaker; ordering never implies deletion. The record the workspace holds is marked as the current one.                                                                              |
| Unsaved edits to a save | An unnamed record naming the record it forked from, listed beside it. The named record shows its own saved state and is not marked edited.                                                                                                               |
| Searched                | The search narrows the listed records over the fields a row shows and announces the count politely; it changes no record and no order.                                                                                                                   |
| No match                | One centred sentence on the body's own ground saying nothing matched; every control stays reachable so widening the search needs no separate action.                                                                                                     |
| Duplicate name          | Raised by the workspace's save, not here. See [`build-workspace.md`](./build-workspace.md).                                                                                                                                                              |
| Delete confirmation     | Identifies exact record/hull; cancel writes nothing; confirmation removes only that key.                                                                                                                                                                 |
| Conflict                | Raised by the workspace's save, not here. See [`build-workspace.md`](./build-workspace.md).                                                                                                                                                              |
| Conflict changed again  | Raised by the workspace's save, not here. See [`build-workspace.md`](./build-workspace.md).                                                                                                                                                              |
| Expiring                | Every unnamed row states its remaining life; the nearest to running out is not reordered to the top, because ordering means modified instant. Naming it is the workspace's save, reached by opening the row.                                             |
| Expired                 | Swept before the listing is drawn, so no row is removed under a Commander reading it. The entry is simply not there, and nothing announces it: the countdown was the notice, and a message about a build already gone offers nothing to act on (FR-013). |
| Quota full              | The record manager permits explicit deletion and retry; every record's bytes remain until selected. Expiry is not offered as a way out of a full quota.                                                                                                  |
| Unsupported newer       | Listed as unavailable and retained byte-for-byte; open is unavailable without guessing.                                                                                                                                                                  |
| Malformed               | Isolated unavailable entry; valid siblings remain operable; never auto-repaired/deleted.                                                                                                                                                                 |
| Storage unavailable     | Persistent explanation and retry; no build interaction outside persistence is disabled.                                                                                                                                                                  |

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
- Naming, renaming and saving a copy are not this surface's operations since 2026-08-27. They are
  the workspace's save, on the build that is open, and their rules are in
  [`build-workspace.md`](./build-workspace.md). What they do to a record is unchanged: naming an
  unnamed record writes the name onto that record — same identity, fresh revision, nothing left
  behind and nothing removed — and a copy takes new record and revision IDs even when it keeps the
  same display name.
- Deleting the record the workspace is holding clears the workspace to its no-build state, and the
  library stays open on the rest of the list. The current-record marker simply has nowhere to sit.
  The same delete performed in another page leaves that page's build alone and pauses its autosave
  instead (FR-012).
- Two things remove a record and no third: a confirmed deletion, and the manual save that writes an
  unnamed record's build into the record it came from, which removes the unnamed one once that write
  has succeeded. A third removes one without a Commander pressing anything: the seven-day expiry of
  an unnamed record, which every unnamed row states beforehand and any name stops (FR-013).
- Notes stay in local record metadata and never appear in share/SLEF serializers.
- `storage`/BroadcastChannel invalidation causes a safe re-read; rows never assume cached bytes are
  current.
- A page whose autosave record was discarded elsewhere pauses autosave and requires explicit resume
  rather than silently recreating it.

### Standing over a screen rather than replacing one, 2026-08-28 (Commander request)

Reported as a navigation that should not be one: opening the saved builds took the Commander out of
the ship they were working in. It did. `/builds` was a sibling route to `/build`, so the router
destroyed the workspace and rendered a page whose whole body was the layer — the scrim covered
nothing, and the modal frame framed an empty background. That is the gap the table above recorded
from the day it was built, and this closes it.

The layer is mounted in the shell now, beside the help and update layers, for the same reason those
are: a list of stored builds belongs to no screen in particular. It is raised over whatever screen is
showing, and `<dialog>`'s own modality makes that screen inert and absent from the accessibility tree
while it stands.

The address survives, because it is taken without a navigation. `Location.go` writes `/builds` and
pushes the entry, so the browser's back still closes the layer, and the address is still one to copy,
bookmark or reload. Reloading lands on the route, which renders the library as an ordinary page —
which is what this document already said direct navigation should supply. The document's title and
canonical address follow the layer up and back down, so what the address says and what the page
claims to be do not disagree.

Two consequences worth stating. While the layer is up, the router's own URL is the screen behind it:
nothing navigates from under the layer without lowering it first, and lowering restores the address
the router still believes in. And the document's `h1` stays the screen's — the ship a Commander is in
— with the layer's own name on the dialog, which is where a modal's name belongs; on the page
composition the `h1` is the library's, as before.

## Responsive and accessibility notes

- Desktop uses the reference columnar modal; mobile retains the reference stacked records with the same two actions and the same semantic list order.
- One row carries the drawn marker: the row the footer would act on. The library opens with the
  record the workspace holds already chosen, so opening it still answers "which of these am I in?"
  without a Commander pressing anything. Choosing another record moves the marker rather than adding
  a second one (reported 2026-08-28: two rows were drawn alike, and a marker on two rows marks
  nothing).
- The record the workspace holds keeps saying so whether or not it is the marked row — in
  `aria-current` and in its own words among the row's read facts — so what the marker stopped drawing
  is not lost. The amber wash was never the only thing carrying it, which is why it could be moved.
- The issue badge is a count with its own words, not a colour: a row with issues says so.
- Validation state includes explicit valid/incomplete/invalid wording and icon; never color alone.
- Dialog title, description and each choice are visible and programmatically associated. Conflict choices explain which versions survive.
- Record names/notes/symbols wrap without truncating identity or causing page overflow.
- While the layer is open, the screen behind it is inert and removed from the accessibility tree — genuinely, by `<dialog>`, rather than by a scrim over a page that replaced it; close and back both restore the originating route, its fragment and its session position.
- Previews cover empty, populated, current-record, searched, no-match, delete, expiring, quota, unsupported, malformed and unavailable states. The duplicate-name warning and the failed write are previewed with the workspace's save layer that raises them, and the conflict with the three-choice dialog that asks it.

## Reference composition

Measured from canvas 1a's `SAVED BUILDS` modal and canvas 1b's `ssv-screen`.

| Part            | Canvas                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wide surface    | An 860px centred dialog on a near-opaque scrim: amber-hairline body, a darker title bar with the title tracked 0.22em and a monospace dismiss, and a committing footer on its own plate |
| Compact surface | The same content as a full-screen layer with a back arrow and a pinned footer                                                                                                           |
| Header row      | A search field carrying its words in the placeholder, beside a monospace record count on the same line                                                                                  |
| Column headers  | Monospace, tracked 0.14em, on a slightly lighter plate                                                                                                                                  |
| Record          | Title in condensed 600 tracked 0.09em, a one-line note beneath in Barlow 300, then hull, price and how long ago it was edited in monospace                                              |
| Issue badge     | A monospace count on a translucent warm plate beside the title                                                                                                                          |
| Record marker   | A 3px leading edge that takes amber when the record is the current one                                                                                                                  |
| Empty state     | Centred prose, no panel                                                                                                                                                                 |
| Footer actions  | The destructive action bordered warm on the leading edge, the opening action filled amber on the trailing edge                                                                          |
