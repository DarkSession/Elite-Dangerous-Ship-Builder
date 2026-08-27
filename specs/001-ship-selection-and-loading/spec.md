# Feature Specification: Ship Selection and Build Loading

## Scope

Commanders can browse the Almanac hull catalogue, create a stock build, resume builds stored in the
browser and share builds by URL. SLEF import and export are specified in
[004](../004-slef/spec.md); build statistics are specified in
[003](../003-ship-statistics/spec.md).

## Clarifications

### Session 2026-08-25

- Q: When a Commander creates or loads a build whose modelled state is identical to an unnamed record
  they already have, should the application reuse that record instead of storing a second copy of
  it? → A: Reuse — an ingress whose modelled state matches an existing unnamed record takes that
  record over instead of minting one.
- Q: How many unnamed records should a Commander accumulate before the application stops storing new
  ones and asks them to choose? → A: None — the limit is time, not count. An unnamed record expires
  seven days after its last modification and is then removed; naming it stops the clock.
- Q: What should the library show as the title of an unnamed record? → A: The build's own ship name if
  it has one, else its ident, else the hull name — marked as not a name the Commander gave the
  record.
- Q: What should happen when a Commander deletes the record the workspace is currently working in? →
  A: The workspace clears to its no-build state. The record is gone and so is the build in it. A
  deletion in another page keeps its existing behaviour.
- Q: When expired records are swept, should the application tell the Commander afterwards that builds
  were removed? → A: No. The remaining time on each entry is the notice, given while there is still
  something to do about it; nothing is said after the fact.

### Session 2026-08-27

- Q: Should the library keep unnamed builds and named builds in two labelled groups? → A: No. One
  list in one order. The distinction is on the row itself — a name a Commander gave, or a title read
  from the build — and a heading above a group says a second time what every row already says.
- Q: Should a row state when it was last edited as an instant, or as how long ago that was? → A: How
  long ago, in the active locale's own words. The instant stays as text for a reader, because "3
  weeks ago" is the answer to "which of these is the recent one" and not to "when exactly".
- Q: Where does a Commander name, rename or duplicate a build, now that the library commits only
  opening and deleting? → A: On the build itself. The workspace saves the build that is open — under
  a new name, or over the save it was opened from — and the library is where saved builds are found
  again rather than where they are named.
- Q: Where does dismissing the library go? → A: Back to the screen it was opened over. It is drawn
  as a layer over an inert originating screen, and sending every dismissal to the shipyard took a
  Commander who glanced at their saved builds out of a build they had chosen nothing to leave. A
  library reached by its own address has no such screen behind it: then it is the build in hand, and
  the shipyard where there is no build.
- Q: Should the command bar's link to the library react to the pointer the way the bar's buttons do?
  → A: Yes. A link and a button sitting in one row and reacting differently reads as one of them
  being inert, and the reference draws no such distinction between the bar's controls.

## User Scenarios

### Story 1 — Create a stock build (P1)

1. Searching, filtering and sorting use the displayed catalogue facts and show the active
   constraints and match count.
2. Opening hull detail shows catalogue facts and artwork without creating or replacing a build.
3. Creating a build uses the Almanac default loadout for the selected hull.
4. Creating a build never asks about the build already open: that one is already stored, and creating
   another leaves it where it is.

### Story 2 — Resume local work (P1)

1. Reloading restores the build the tab was working on.
2. Every build worked on is listed, named or not, in one list. From the list a build is opened or
   deleted; from the build that is open it is named, renamed under another name, or kept beside the
   save it came from. Editing a named build never moves it; the edits are their own entry until they
   are saved.
3. A conflicting save from another tab offers overwrite, keep both and cancel; neither version is
   silently lost.
4. An unnamed build clears itself seven days after it was last changed. The entry says how long it
   has, and naming it keeps it for good.
5. If storage is unavailable or full, the build remains usable and the persistence failure is clear.

### Story 3 — Share a build link (P2)

1. The fragment contains a versioned payload; the path and query contain no build data.
2. A valid link restores the modelled build without creating a named save.
3. Invalid, truncated or unsupported payloads leave the current build unchanged and explain the
   failure.
4. Every published payload version remains decodable.

## Requirements

- **FR-001**: Hull identities, facts, slots and default loadouts MUST come from
  `@elite-dangerous-almanac/core`; hulls MUST use the package `symbol`.
- **FR-002**: The catalogue MUST show name, manufacturer, size, hardpoint layout and retail price,
  and MUST support bidirectional sorting over those facts. It MUST narrow in exactly the two ways the
  reference toolbar draws: one text search matching every fact a hull shows, where each word of the
  search may land on a different fact, and one exclusive landing-pad size strip led by `ALL`. Missing
  values MUST remain distinct from zero and sort ties MUST be stable.
- **FR-003**: Catalogue search, filters, sort and scroll position MUST survive a trip to hull detail
  and back during the browser session. They MUST NOT become build or link state.
- **FR-004**: Hull detail MUST show the package name, manufacturer, size, speed and boost, base
  shield and armour, hull mass, hardness, crew, mass-lock factor, the hardpoint mix, the hull price
  and the illustration, with units for every measured value that has one. Hull facts MUST be
  distinguished from module-dependent build results.

  Heat capacity and dissipation, reserve fuel, rotation rates and the slot layout are deliberately
  out of scope for this feature: the reference draws none of them on the shipyard, and the slot
  layout belongs to the outfitting ledger (canvas 1c), not to hull selection. Hardness, crew and
  mass lock replaced them on the reference's metric grid on 2026-08-21.

- **FR-005**: Hull detail URLs MUST use the hull `symbol`. An unknown symbol MUST show an error and
  MUST NOT create a build.
- **FR-006**: Hull artwork MUST come from the Almanac package assets, be served from the
  application's origin and never carry information without a text equivalent. Missing or uncached
  artwork MUST NOT block hull selection or build creation.
- **FR-007**: Build creation MUST be explicit and MUST use the package default loadout. If no default
  is available, creation MUST be unavailable; the application MUST NOT invent one.
- **FR-008**: The active build MUST be recoverable from a stored record at all times, without being
  asked for and without a Commander action, and MUST be restored after reload. A build that has no
  record yet MUST be autosaved to an unnamed record of its own from the moment it becomes active. A
  build opened from an existing record MUST be autosaved to an unnamed record of its own from its
  first modelled edit. Wherever a record is taken for a build — at either of those two moments — an
  unnamed record already holding identical modelled state MUST be taken over rather than a second
  copy of it stored. Autosave MUST NEVER
  write to a named record. Creating, opening or loading another build MUST NOT overwrite or discard
  the record of the build before it. Records MUST use local identities independent of their display
  names.

  **Ruled 2026-08-25 (Commander request).** Autosave used to target one record per tab, which every
  new build wrote over — so the application had to ask before replacing work, and what stood behind
  "replace the build you are working on?" was a build a Commander could not get back. A record per
  build withdraws the question rather than answering it better: nothing worked on is lost, so nothing
  has to be confirmed away.

  Autosave stops at the named record deliberately. A Commander who names a build has said which
  version of it they want kept, and letting the next edit flow into that record would take the
  decision back off them — the loss the old confirmation existed to prevent, arriving silently
  instead. So editing a named build forks an unnamed record and every write goes there, and the
  named record moves only when the Commander saves. What this costs is that ordinary browsing and
  ordinary editing leave records behind, and FR-009 and FR-013 carry that cost: an unnamed record
  clears itself after seven days, and a name is what keeps a build indefinitely.

- **FR-009**: Duplicate names MUST be allowed after warning. Removing a record MUST require a
  confirmed deletion, the manual save that consumes it, or the expiry FR-013 defines, and nothing
  else may remove one. Deleting the record this page is autosaving into MUST clear the active build
  to the no-build state rather than leave it on screen with nowhere to write: the Commander asked for
  that build to go, and the confirmation named it. A manual
  save MUST consume the unnamed record it saved from and MUST leave no copy of it behind: naming an
  unnamed record MUST name that same local identity, and writing the build into an existing record
  MUST delete the unnamed record afterwards. Saving a copy under another name MUST create a further
  record and leave the original where it is. Replacing the active build MUST NOT be confirmed,
  because FR-008 leaves nothing to lose.

  **Ruled 2026-08-27 (Commander request).** Naming, renaming and saving a copy MUST be offered on the
  build that is open, and MUST NOT be offered as actions on a row of the library. The library MUST
  commit exactly two: open the record that was chosen, and delete it. Every one of the operations
  above survives the move — a record is renamed by opening it and saving it under another name over
  the save it came from, and copied by opening it and saving it as a new build — so this changes
  where a Commander goes to do them and not what they can do.

  The reason is that the two lists of actions were never one list. Open and delete answer "which of
  these builds", and a library is the surface that asks that question; name, rename and duplicate
  answer "what should become of this build", which is a question about the build a Commander is
  working in and is answered where they are working. Five buttons under a list made the fourth and
  fifth act on a build the Commander had not opened and could not see, and made the first three read
  as though they were the same kind of thing.

  A save that writes nothing MUST say so, and MUST leave what the Commander typed on screen for
  them to try again with. A build looks the same whether its save landed or not, so a layer that
  closes over a full store, a lock it could not take or a record removed in another tab is the one
  way an edit is lost without anyone being told. The same holds for an answer to a save conflict,
  which fails for the same reasons and just as invisibly.

- **FR-010**: Stored entries MUST state their name or that they have none, hull, last-modified time
  and the validation state recorded at that time. An unnamed entry MUST also state how long it has
  before it expires, and MUST be titled by the build's own ship name, by its ident where there is no
  ship name, or by the hull name where there is neither.

  Entries MUST be listed as one list in one order, and MUST NOT be divided into a group of named
  records and a group of unnamed ones. The last-modified time MUST be stated as how long ago the
  entry was edited, in the active locale's own words; the instant itself MUST remain available as
  text, so that nothing is lost to a reader who needs it exactly.

  **Ruled 2026-08-26 (Commander request).** "State" rather than "show": the recorded validation, the
  remaining life and the marker on the record the workspace holds are all read but not drawn. The
  canvas draws a row of four columns — build, hull, price, edited — with a count of the build's
  issues on a warm plate beside its title and nothing else beneath it, and three further lines of
  chrome on every row is not that row. Two of the three lose nothing: the row the workspace holds is
  the one on the amber edge and carries `aria-current`, and a build with issues carries their count
  where the canvas puts it, while a build with none carries nothing, which is what a clean build
  looks like.

  **Amended 2026-08-27 (Commander request).** The groups went the same way and for the same reason.
  `Unnamed builds` and `Named builds` were two headings saying what each row beneath them already
  said in its own title — a name a Commander typed, or a title read from the build and set apart from
  one — and they split one order into two, so the build edited most recently was not reliably the row
  at the top. One list restores that. What it costs is that a Commander scanning for their saves
  reads past their working records to find them; the search above the list is what answers that, and
  it narrows over the title either way.

  The remaining life is the one that costs something, and FR-013 below records what. That title MUST be read from the build
  rather than stored on the record, MUST NOT be a name the application invented, and MUST be
  distinguished from a name the Commander gave the record. A build MAY have one local note.

- **FR-011**: Notes and storage identities MUST remain local and MUST NOT enter a build link or SLEF
  export.
- **FR-012**: A record deleted by another live page MUST NOT clear that page's active build. The
  build MUST remain usable, autosave MUST pause, and resuming MUST be an explicit Commander action,
  because nobody at this page decided anything.

  Two live pages MUST NOT autosave to one record. Each page's autosave target is an
  unnamed record it minted or took over for itself; a page that finds another live page claiming that
  identity MUST fork under a fresh one before either page next writes. Two pages MAY hold the same named record open,
  because neither autosaves into it; concurrent manual writes to one record MUST offer overwrite,
  keep both and cancel.

- **FR-013**: An unnamed record MUST expire seven days after it was last modified, and MUST then be
  removed. The seven days MUST run from last modification, so a build a Commander keeps working on
  never expires under them. Naming a record MUST stop the clock: a named record MUST NOT expire, and
  is bounded only by the browser storage quota. A record a live page is autosaving into MUST NOT
  expire while that page holds it. There MUST be no limit on how many records may exist inside the
  seven days.

  The sweep MUST NOT be announced after it has run. FR-010's remaining time on the entry is the
  notice, given while there is still something a Commander can do about it; a message about builds
  that are already gone offers nothing to act on and no way back.

  **Amended 2026-08-26 (Commander request).** That notice is now read rather than drawn — see
  FR-010. It is still on the entry, still given while the record is there to save, and still the
  only warning; what changed is that a Commander who does not use a screen reader meets it only by
  going to the record. The trade was made deliberately and is stated here rather than left for
  somebody to discover: an unnamed record can now run out without any drawn warning that it was
  going to.

  Expiry is not a storage bound and MUST NOT be presented as one: at the browser storage quota the
  Commander MUST still be able to choose records to discard while the active in-memory build remains
  usable.

  **Ruled 2026-08-25 (Commander request).** This reverses both the count limit and the rule that
  nothing but a Commander's own action removes a record. A cap that stops storing and asks which
  records to discard puts a dialog in front of ordinary work, and the records it asks about are
  usually ones nobody wanted — a stock hull built while browsing, a link opened once. A clock clears
  those without asking and keeps the ones a Commander returns to, and naming is what makes a build
  permanent, which is the decision the save already was.

  What it costs is that a build can be gone when a Commander comes back to it without their having
  pressed anything. So the removal is never silent: FR-010 puts the remaining time on the entry, and
  a name stops the clock at any moment before it runs out.

- **FR-014**: Browser persistence MUST use a versioned format and migrate every supported older
  version without losing recognized modelled state. During reconstruction, an unknown hull MUST
  leave the record stored but unopened. Package reconstruction MUST populate every fixed mount from
  the hull default whenever its source entry is absent or unusable, before the build becomes active;
  the application MUST NOT run a separate repair or preserve empty-mount provenance. Unknown module
  identities are outside the supported persistence contract. Unsupported newer versions MUST remain
  stored but unopened. Storage failure MUST disable only persistence.
- **FR-015**: A build link MUST keep its payload entirely in the URL fragment and MUST cause no
  transmission of build data.
- **FR-016**: The payload MUST contain only non-derived modelled state: package-resolved identities,
  game slot keys, ordinary and package-identified pre-engineering, grade, enabled state, priority,
  ship name and ident. Every encoded identity MUST resolve in the installed package. A module's package
  variant and later ordinary engineering MUST both survive. Package-defaulted fixed modules MAY be
  implicit in a payload because reconstruction always restores them. Enabled state and priority MUST
  be carried for every fitted module except those the package prices at no power draw at all: a
  module whose draw the package does not publish MUST keep its state, because an unpublished figure
  is not a zero. That is the rule the outfitting mount card applies when it decides whether to draw
  a power chip, and a chip a Commander can set is a value a link has to carry.
- **FR-017**: Calculated values, catalogue facts, prices, purchase provenance, notes and storage
  identities MUST NOT enter the payload.
- **FR-018**: The application-owned codec MUST be versioned, use package identities and preserve all
  published versions. Any compact identifier table MUST be generated from the installed package
  and used only to encode or decode identities; it MUST NOT supply game facts or calculations.
- **FR-019**: A build the codec cannot represent losslessly MUST be refused with the affected slot
  and reason, and SLEF MUST remain available.
- **FR-020**: Navigated and pasted links MUST use the same validation and replacement rules. Build
  edits MUST replace the fragment without adding a history entry for each edit.
- **FR-021**: A codec value for the package hull with the most slots, with every slot fitted and
  every supported modelled field populated, MUST not exceed 500 characters, its `b.` prefix counted
  among them. The bound is on the value the codec produces, not on the URL carrying it: the origin,
  path and `#` belong to the deployment, so a bound stated over them could not be enforced by the
  codec that has to satisfy it. Builds that cannot meet the limit MUST use SLEF instead.

## Edge Cases

- An unknown hull is refused atomically. Unknown module identities are not a supported migration
  input and receive no application-owned compatibility behavior.
- A build replaced in the workspace is not gone: it is the record it was being autosaved to, and the
  library still lists it.
- Creating the same stock hull twice, or opening one link twice, leaves one record rather than two:
  a build taking a record finds the unnamed record already holding that state and takes it over.
  Editing two saved builds into the same first change behaves the same way.
- Two records that already exist are never merged, however alike their builds later become. The
  take-over happens only at the moment a record is taken for a build, never on a later edit.
- Taking a record over is not modifying it, so it does not restart the seven days. Editing does. A
  Commander who remakes a build they made six days ago and changes nothing still loses it tomorrow,
  and the entry says so.
- Editing a build opened from a named record changes nothing in that record. The edits are an
  unnamed record of their own, listed as such, until the Commander saves them somewhere.
- Opening a named build and not editing it writes nothing at all.
- An unnamed record a Commander keeps returning to does not expire: the seven days run from the last
  modification, not from when the build was first made.
- A tab left open for longer than seven days does not lose the build in it. A record a live page is
  autosaving into is not swept while that page holds it.
- Unsaved edits to a named build expire on the same clock as any other unnamed record. The named
  record they were forked from does not expire at all.
- Naming a record at any point before it runs out keeps it indefinitely, and there is no count at
  which naming becomes necessary.
- An unnamed entry's title follows the build: renaming the ship retitles the entry, because the title
  is read from the build rather than written onto the record.
- Deleting the record the workspace is working in clears the workspace. Deleting the same record from
  another page does not: there the build stays, autosave pauses, and the Commander resumes it. The
  difference is who decided, not what was deleted.
- A cleared workspace is the ordinary no-build state, not an error. It explains how to select a hull,
  open a save or paste a link, exactly as it does before a Commander has built anything.
- Two unnamed entries may carry the same title, because two ships may share a name. Hull,
  last-modified time and remaining life still tell them apart, and neither is treated as a duplicate
  of the other.
- Preview absence is temporary, not a catalogue failure.
- A newer payload version is refused rather than guessed.
- A build-link payload longer than the published 500-character limit is refused before decoding.
- A fixed mount omitted or unusable at package reconstruction is returned with its hull default.

## Almanac Coverage

The package supplies hulls and their canonical names, slot layouts, default loadouts, illustrations,
validation and all derived build values. The application owns catalogue presentation, browser
storage and the versioned URL codec; none calculates an Elite Dangerous value.

## Success Criteria

- **SC-001**: Every hull fact and stock build matches the installed Almanac package.
- **SC-002**: Stored and linked builds preserve every recognized modelled field, always reconstruct
  fixed mounts with package defaults, never allow one tab to silently overwrite another tab's work,
  and lose no build a Commander has worked on except to an explicit, confirmed deletion, to the
  manual save that consumes it, or to the seven-day expiry it displayed beforehand.
- **SC-003**: Every published link reconstructs an equivalent build and remains decodable.
- **SC-004**: No automatic request sends build data or contacts another origin.
