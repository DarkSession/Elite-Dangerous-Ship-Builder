# Feature Specification: Ship Selection and Build Loading

**Feature Branch**: `001-ship-selection-and-loading`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Users should be able to select a ship or open an existing ship (either
from browser local storage, or import via URL query). This is a pure client side only application.
The user should be able to have a ship selector available, able to search for ships, show basic
stats and a preview."

## Scope

This specification covers how a Commander arrives at an active build: browsing the ship catalogue,
narrowing it, choosing a hull from it, reopening a build saved in this browser, and opening a build
someone shared as a link.

Figures here describe a **hull** as the catalogue records it, before a build exists. Figures for a
**build** belong to the statistics family, whose contract is
[feature 003](../003-ship-statistics/spec.md). Where a hull's mount layout is read from the hull's
own geometry rather than counted, [feature 010](../010-hull-anatomy/spec.md) owns that view.

The three capabilities this feature originally waited on — manufacturer and hull size, stock
configurations, and the ship illustrations — arrived in `@elite-dangerous-almanac/core@0.1.0-beta.4`.
One requirement added later, the catalogue version FR-044a asks for, waits on the package. See
"Upstream dependencies".

## Clarifications

### Session 2026-08-12

- Q: Should the shareable link carry a compressed copy of the full SLEF document, or a minimal
  description of the build that SLEF is rebuilt from when the link is opened? → A: A minimal build
  model — encode only non-derivable state and rebuild the SLEF via the library on load.
- Q: Should the compression and encoding codec be built inside `@elite-dangerous-almanac/core`, or
  as application code in the ship builder? → A: In the ship builder — the link format is owned by
  this application, not the library.
- Q: Should the encoded build ride in the URL's query string or in its fragment? → A: The fragment
  (`#…`), so the payload is never transmitted to any server. This supersedes "import via URL query"
  in the Input above.
- Q: What is the length target a build link must meet? → A: ≤500 characters for a fully engineered
  large ship (typical mid-size build well under 300), with under 100 characters as a stretch goal
  worth pursuing.
- Q: When the link format or the bundled catalogue changes, must links shared earlier still open? →
  A: Yes, permanently — the payload carries a format version, the decoder retains every published
  version's tables, and it refuses rather than guesses when it cannot decode faithfully.

### Session 2026-08-13

- Q: Until the library can produce a hull's as-delivered configuration, what should selecting a hull
  give the Commander? → A: An empty build, explicitly labelled as empty rather than stock. It
  becomes a stock build when the library delivers stock configurations; nothing is fitted on a
  guess in the meantime.
- Q: When a Commander reloads the page with an active build they never explicitly saved, should that
  build still be there? → A: Yes — the active build is autosaved to a working slot, separate from
  named saved builds and never listed among them. Saving under a name is about keeping a build, not
  about surviving a reload.
- Q: Is a saved build identified by its name, so two saved builds can never share one, or by an
  internal identity that lets duplicate names coexist? → A: An internal identity independent of the
  name. Duplicate names are permitted; the application warns that a name is already in use and lets
  the Commander proceed anyway.
- Q: When a second browser tab saves a build while this tab has the same build open, what should this
  tab do? → A: Detect the conflict at save time — before writing, check whether the stored build
  changed since this tab loaded it, and if so let the Commander overwrite, save as a copy, or
  cancel. No live storage watching.
- Q: With several tabs open on different builds, should they share one autosaved working build or
  should each tab keep its own? → A: Each tab keeps its own, identified by an internal ID. When the
  application is opened in a new tab or session, the existing autosaved working builds are offered
  for the Commander to select.

### Session 2026-08-14

- Q: The three capabilities this feature waited on landed in `@elite-dangerous-almanac/core@0.1.0-beta.4`
  — does selecting a hull still produce an empty build? → A: No. `ShipLoadout.default()` supplies the
  as-delivered configuration for all 48 hulls, so FR-011's stock configuration is what a Commander
  gets, and the empty-build fallback agreed on 2026-08-13 survives only as the drift case FR-011
  describes. Manufacturer, hull size and the ship illustrations are likewise available, so no story in
  this feature is blocked by those three.
- Q: Where must the link format version live, and should the minimal build model retain credit
  figures from an import? → A: The format version is the first field inside the decoded binary
  payload, before any table-dependent value, so it selects the decoder and pinned identifier tables.
  Credit figures — hull value, module values, aggregate modules value and rebuy — never appear in a
  build link. Catalogue pricing is derived again by the Almanac, while captured purchase provenance
  travels only in SLEF when it must be retained.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Start a new build from a ship (Priority: P1)

A Commander arrives at the application with nothing loaded, browses the list of Elite Dangerous
ships, picks a hull, and gets a build for that hull in its stock, as-delivered configuration, ready
to outfit.

**Why this priority**: Nothing else in the application can happen without a build in hand. This
story alone is a usable product: choose a ship and look at what it comes with.

**Independent Test**: Open the application with an empty browser profile and no URL parameters,
choose a ship from the list, and confirm a build for that hull becomes active with its stock modules
fitted.

**Acceptance Scenarios**:

1. **Given** no build has ever been created in this browser, **When** the Commander opens the
   application, **Then** they are offered the ship catalogue, which lists every ship with the
   information needed to tell them apart (name, manufacturer, size, core characteristics).
2. **Given** the catalogue is listed, **When** the Commander selects a hull, **Then** a build for
   that hull is created in its stock configuration and becomes the active build.
3. **Given** a build has been created from a hull, **When** the Commander examines it, **Then** it is
   fully editable, savable and shareable like any other build.
4. **Given** the catalogue is listed, **When** the Commander filters or searches by ship name,
   **Then** only matching ships remain listed, and matching ignores case and surrounding whitespace.
5. **Given** an active build exists, **When** the Commander selects a different hull, **Then** they
   are warned that the current build will be replaced and the switch happens only after they
   confirm.
6. **Given** the catalogue is listed, **When** the Commander asks how current it is, **Then** the
   version of the bundled catalogue the figures come from is identifiable, so a Commander comparing
   the application against the live game can tell which game data they are reading — or reported as
   unavailable while the package reports no catalogue version.

---

### User Story 2 - Narrow the catalogue to the right hull (Priority: P1)

A Commander who knows they want something faster than their current ship, with at least four
hardpoints, narrows the catalogue on the figures that matter until the candidates are obvious.

**Why this priority**: Choosing the hull is the first and most consequential decision in any build,
and it would otherwise be made from a name and a size. Comparable figures turn the catalogue from a
list into the tool that decision deserves.

**Independent Test**: Open the catalogue with no build loaded, sort by a characteristic, narrow it
with a filter, and confirm the remaining hulls are exactly those that match and are ordered
correctly on that characteristic.

**Acceptance Scenarios**:

1. **Given** the catalogue is listed, **When** the Commander views it, **Then** every hull is shown
   with its comparable characteristics — mass, top speed, boost speed, base armour, base shield
   strength, crew seats, hull and retail cost, and its mount layout expressed as the hardpoints,
   utility mounts, core sizes and optional slots it carries.
2. **Given** the catalogue is listed, **When** the Commander sorts by a characteristic, **Then** the
   hulls are ordered by that characteristic, the ordering direction is apparent, and hulls for which
   the characteristic is unavailable are grouped rather than sorted as though they were zero.
3. **Given** the catalogue is listed, **When** the Commander filters by mount layout, cost or any
   listed characteristic, **Then** only hulls matching every active filter remain, and the active
   filters and the number of matches are visible.
4. **Given** filters and a search term are active, **When** no hull matches, **Then** the Commander
   is told nothing matched and can clear the filters in a single action.
5. **Given** the catalogue is listed, **When** the Commander looks for a figure that depends on
   fitted modules — a jump range, a shield strength for a fitted generator — **Then** it is not
   there, because no build exists for a hull the Commander has not chosen.

---

### User Story 3 - See the ship before choosing it (Priority: P2)

A Commander who knows Elite Dangerous ships by sight, not by name, recognises the hull they want
from a preview rather than reading down a list.

**Why this priority**: Recognition is faster than recall, and hull names are easy to confuse. It is
P2 because the narrowing in story 2 is what makes the decision; the preview makes finding the
candidate quicker.

**Independent Test**: Open the catalogue and confirm each hull carries a preview that identifies it,
that the preview is legible at every supported viewport, and that a hull without one is handled
without breaking the list.

**Acceptance Scenarios**:

1. **Given** the catalogue is listed, **When** the Commander views a hull, **Then** a preview of that
   hull is shown alongside its characteristics.
2. **Given** a hull whose preview is unavailable, **When** it is listed, **Then** the entry remains
   complete and usable and the missing preview is not presented as a defect in the hull.
3. **Given** the catalogue is used on a phone, **When** previews are shown, **Then** they remain
   legible and do not push the characteristics off the screen or force horizontal page scrolling.
4. **Given** illustrations are shown anywhere in the application, **When** the Commander looks for
   their provenance, **Then** Frontier Developments' media-usage notice is reachable, as the terms
   the artwork travels under require.
5. **Given** a Commander using a screen reader, **When** they reach a preview, **Then** the hull is
   identified in text; no information is carried by the preview alone.

---

### User Story 4 - Reopen a saved build (Priority: P2)

A Commander who built a ship yesterday returns to the application in the same browser and picks up
exactly where they left off — whether or not they remembered to save it under a name.

**Why this priority**: Loadout planning is iterative and spans sessions. Without persistence, every
visit starts from zero and long builds are lost to a refresh.

**Independent Test**: Create a build without saving it, reload the page, and confirm it is still the
active build; then save it under a name, open a different build, and confirm the named build is
offered and restores with the same hull, modules and engineering.

**Acceptance Scenarios**:

1. **Given** an active build the Commander has not saved under a name, **When** they reload that tab,
   **Then** that build is still the active build, complete in every field the application models,
   and it is still identified as unsaved.
2. **Given** an active build with unsaved changes, **When** the Commander saves it under a name,
   **Then** it is stored in browser local storage and appears in the list of saved builds with its
   name, ship and last-modified time.
3. **Given** saved builds exist, **When** the Commander opens the application, **Then** they can
   open any saved build, and the opened build matches what was saved (hull, every fitted module,
   engineering, module power priorities and enabled/disabled state, ship name and ident).
4. **Given** a saved build is open, **When** the Commander renames, duplicates or deletes it,
   **Then** the saved-build list reflects that change immediately, and deletion is confirmed before
   it happens.
5. **Given** a saved build already carries the name the Commander is about to use, **When** they
   save, rename or duplicate under that name, **Then** they are told the name is already in use and
   may proceed anyway, and proceeding creates or keeps a distinct build rather than overwriting the
   one that shares the name.
6. **Given** two saved builds share a name, **When** the Commander opens or deletes one of them,
   **Then** the action takes effect on the build they chose, and the list gives them enough to tell
   the two apart.
7. **Given** an autosaved working build is restored, **When** the Commander views the list of saved
   builds, **Then** the working build is not among them; it becomes a saved build only when the
   Commander saves it under a name.
8. **Given** working builds exist from earlier tabs or sessions, **When** the Commander opens the
   application in a new tab, **Then** those working builds are offered for selection alongside the
   saved builds, each identified as unsaved and distinguishable by its ship and last-modified time,
   and opening one makes it this tab's active build.
9. **Given** two tabs are open on different builds, **When** each is reloaded, **Then** each returns
   to the build it was showing, and neither tab's work has been overwritten by the other's.
10. **Given** local storage is unavailable or full, **When** the Commander tries to save, **Then**
    they are told saving failed and why, and the active build is left untouched and still editable.
11. **Given** saved builds exist for a particular hull, **When** the Commander views that hull in the
    catalogue, **Then** the builds saved against it are reachable from there and their number is
    visible, so returning to earlier work on a ship does not require reading the whole saved-build
    list.

---

### User Story 5 - Open a build shared as a URL (Priority: P2)

A Commander receives a link to a build from a squadmate, opens it, and sees that exact build —
without either of them having an account or the build ever touching a server.

**Why this priority**: Sharing is how loadouts circulate in the community, and it is the only
sharing mechanism available to a client-side-only application. It is independent of local storage:
the link works in a fresh browser.

**Independent Test**: Produce a build URL, open it in a browser profile with empty local storage,
and confirm the build loads identically.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander asks for a shareable link, **Then** the
   application produces a URL whose fragment encodes the entire build, copying it requires no server
   round-trip, and the link is at most 500 characters even for a fully engineered large ship.
2. **Given** a URL that carries a build, **When** it is opened in any browser, **Then** that build is
   loaded as the active build without needing anything from local storage.
3. **Given** a URL carrying a build is opened while a saved build with the same name exists, **Then**
   the imported build does not overwrite anything in local storage until the Commander explicitly
   saves it.
4. **Given** a URL whose build data is malformed, truncated or references unknown hulls or modules,
   **When** it is opened, **Then** the application reports that the link could not be read, says
   what was wrong, and leaves the Commander able to continue with ship selection or a saved build.
5. **Given** a link produced by an earlier release, under an earlier catalogue, **When** it is opened
   by the current release, **Then** it produces exactly the build it described when it was shared.
6. **Given** a link that cannot be decoded faithfully — unknown format version, identifier absent
   from the version it pins — **When** it is opened, **Then** the application refuses it and
   explains why, rather than opening a build that differs from the one the link describes.
7. **Given** a Commander who has a build link in a message rather than in their address bar, **When**
   they paste it into the application, **Then** it is honoured exactly as navigating to it would be,
   subject to every confirmation and refusal rule above.

---

### Edge Cases

- A hull whose characteristic the catalogue does not carry: the entry shows it as absent, the hull
  remains listed and selectable, and sorting groups it rather than treating the absence as zero.
- A search term matching no hull while filters are also active: the Commander is told which
  constraint eliminated the matches, not merely that the list is empty.
- Search terms with surrounding whitespace, mixed case, or a partial word: they match for the hull's
  name and for every other searchable attribute alike.
- Two hulls with identical values on the sort characteristic: the ordering between them is stable
  across re-sorts rather than shifting arbitrarily.
- The full catalogue with previews on a phone: the list stays scrollable and searchable, and
  previews never delay the list becoming usable.
- A preview asset that fails to load: the entry degrades to its text characteristics without a
  broken placeholder and without shifting the layout of the rows around it.
- A hull added to the catalogue before its illustration exists: the hull is listed, comparable and
  selectable without one, and the missing illustration is raised against the library rather than
  filled with a stand-in drawn here. The set covers every hull today, so this is a drift case
  between a catalogue update and the artwork that follows it.
- The Commander scrolling the catalogue faster than illustrations arrive: the list stays responsive
  and the rows do not reflow as each illustration lands.
- The application used offline after first load: previews already delivered remain available, and
  any not yet delivered are absent rather than rendering as failures.
- A hull whose stock configuration the package reports as unavailable: the build is empty and says
  so, and no module is fitted on an assumption about what the ship is delivered with. The package
  supplies a configuration for every hull today, so this is drift between a catalogue update and the
  configurations that follow it rather than a state the data produces now.
- A URL carries a build **and** a build was left active: the URL wins for this visit once the
  Commander has confirmed replacing unsaved work, and it becomes the working build; no named saved
  build is created or overwritten until the Commander saves under a name.
- Private browsing, a full quota, or storage blocked entirely, so the working build cannot be
  written: the Commander is told up front that this build will not survive a reload, rather than
  discovering it after a refresh.
- Two tabs open on different builds: each reloads into its own, and closing one does not disturb the
  other. A tab closed without saving leaves its working build behind, offered for selection the next
  time the application is opened.
- The same working build opened from a second tab while the first still holds it: the second tab
  gets a working build of its own rather than both tabs writing to one record.
- Working builds accumulating over many sessions: the retained set stays bounded and the Commander
  can discard any of them, and reaching the bound is reported rather than quietly dropping the
  oldest unsaved work.
- A saved build references a hull or module symbol that no longer exists in the current catalogue
  version (a data update removed or renamed it): the application reports which entries could not be
  resolved instead of dropping them silently, and does not lose the rest of the build.
- A link produced years ago, before several catalogue updates: it opens exactly as it did the day it
  was shared, because it is decoded against the tables its declared format version pins — not
  against today's catalogue.
- A link whose declared format version is newer than the running application understands (a
  Commander on a stale cached build): it is refused with a message saying the link is newer than
  this version, not decoded on a guess.
- A module removed from the catalogue that an old link still references: the link is refused or the
  slot reported as unresolved, never quietly swapped for a different module that now occupies that
  index.
- A build URL exceeds what a browser or chat client will carry: the Commander is warned that the
  link may be truncated in transit, and is offered the SLEF export (feature 004) as the alternative.
- A build whose encoded link would exceed the 500-character requirement: this is a defect in the
  codec, not an accepted outcome — the reference corpus is expected to catch it before release.
- Local storage contains data written by a newer version of the application: the application refuses
  to misread it rather than partially loading it.
- Two tabs edit the same saved build concurrently: the second tab to save is told the stored build
  changed since it loaded it, and chooses to overwrite, keep both, or cancel. Neither version is
  discarded without the Commander saying so. The conflict is caught at the moment of saving; a tab
  is not expected to notice the other's save as it happens.
- Private browsing or a browser configured to block storage: ship selection and URL import still
  work; only saving is unavailable, and it says so up front.
- A mobile browser opening a long build link: the link is honoured up to whatever the browser
  delivered, and a truncated link is reported as such rather than partially applied.
- A chat client that strips or mangles the fragment when linkifying a URL: the Commander is told the
  link arrived without a payload rather than being shown an empty build, and is offered SLEF export
  (feature 004) as the alternative.
- A build link pasted into the application rather than navigated to, whose fragment the sending
  client dropped: reported as arriving without a payload exactly as the navigated case is, never
  opened as an empty build.
- Text pasted into the link import that is not a build link at all — a SLEF payload, a journal event,
  an unrelated URL: the Commander is told what was recognised instead, and a SLEF payload is offered
  to feature 004's import rather than rejected outright.
- The game updated since the bundled catalogue was built: the catalogue version is shown as it is,
  and the application claims no currency it cannot verify. Catching up is a release, not a runtime
  lookup. While the package reports no catalogue version at all, the version is shown as unavailable
  rather than replaced by the application's own release number.
- A build payload arriving in the query string instead of the fragment: it is not honoured, because
  producing such a link would have leaked the build to the host. The Commander is told why.
- Two saved builds carrying the same name: both are kept, both are distinguishable in the list by
  ship and last-modified time, and opening, renaming or deleting one leaves the other untouched.
- A saved build renamed to a name another build already uses: permitted after the Commander is told,
  and it remains the same build it was — renaming never merges two builds or swaps their identities.
- A saved-build list long enough to exceed a phone screen: it stays scrollable and searchable, and
  destructive actions (delete) stay hard to trigger by accident on touch.

## Requirements _(mandatory)_

### Functional Requirements

#### Client-side operation

- **FR-001**: The application MUST run entirely in the browser. It MUST NOT require any application
  server, and MUST NOT transmit build data anywhere.

#### Choosing a hull

- **FR-002**: The application MUST present the full ship catalogue from
  `@elite-dangerous-almanac/core` for selection, identified by the package's ship `symbol`.
- **FR-003**: The catalogue MUST list every hull with its comparable characteristics: mass, top
  speed, boost speed, base armour, base shield strength, crew seats, hull cost and retail cost.
- **FR-004**: The catalogue MUST show each hull's mount layout — the number and size of its
  hardpoints, its utility mounts, its core mount sizes and its optional slots — as comparable values
  rather than prose.
- **FR-005**: Search MUST match against the hull's name and every other listed textual attribute,
  ignoring case and surrounding whitespace.
- **FR-006**: The Commander MUST be able to sort the catalogue by any listed characteristic, in
  either direction, and the active sort MUST be visible.
- **FR-007**: The Commander MUST be able to filter the catalogue by any listed characteristic, and
  the active filters and the resulting match count MUST be visible.
- **FR-008**: The Commander MUST be able to clear all filters and search terms in a single action.
- **FR-009**: A characteristic the catalogue does not carry for a hull MUST be shown as absent, MUST
  NOT be shown as zero, and MUST NOT be ordered as zero when sorting.
- **FR-010**: _(Withdrawn 2026-08-14.)_ Comparing two or more hulls side by side is out of scope.
  The catalogue's job is to narrow to one hull, which FR-005 to FR-009 provide; a dedicated
  comparison surface is not part of this feature.
- **FR-011**: Selecting a hull MUST create a build in that hull's stock, as-delivered configuration
  — the one `@elite-dangerous-almanac/core` supplies — and make it the active build. No module may
  be fitted on an assumption about what the ship ships with; where the package reports a hull's stock
  configuration as unavailable, the build MUST be created empty and identified as empty rather than
  presented as as-delivered. The package supplies a valid, complete configuration for every hull in
  the catalogue today, so the empty case is drift between a catalogue update and the configurations
  that follow it rather than a state the data produces now. The build is otherwise a build like any
  other: editable, savable, shareable and exportable.
- **FR-012**: Characteristics shown before a build exists describe a hull as the catalogue records
  it, not a build. Any figure that depends on fitted modules MUST either be absent from the
  catalogue listing or be labelled with the configuration it assumes.
- **FR-012a**: Jump range MUST NOT appear in the catalogue listing, in the characteristics it can be
  sorted by, or in its filters. Jump range exists only once a drive is fitted, so quoting one for a
  hull would describe a build the Commander has not made. A Commander who wants it selects the hull
  first and reads it from [feature 008](../008-mobility-and-jump/spec.md).
- **FR-013**: Every figure shown for a hull MUST carry its unit, and cost figures MUST be identified
  as catalogue retail.

#### Ship preview

- **FR-014**: The catalogue MUST show a preview of each hull alongside its characteristics.
- **FR-015**: A hull without a preview MUST remain fully listed, comparable and selectable, and the
  absence MUST NOT degrade the surrounding layout.
- **FR-016**: A preview MUST NOT be the sole carrier of any information. Every hull MUST be
  identifiable and comparable from text alone.
- **FR-017**: Previews MUST be served as static assets bundled with the application. No preview may
  be fetched from a third party at runtime, in keeping with the client-side-only principle.
- **FR-018**: The preview for a hull MUST be the Almanac's own ship illustration for that hull,
  identified by the hull's `symbol`. The application MUST NOT redraw a hull, substitute artwork from
  elsewhere, or keep its own record of which illustration belongs to which hull — the symbol is the
  link, as it is for every other identity.
- **FR-019**: Illustrations MUST reach this application as a published artefact of
  `@elite-dangerous-almanac/core`. Copying the library's asset directory into this repository is
  prohibited: a vendored copy is a parallel record of library-owned material and drifts from it
  exactly as a private catalogue would.
- **FR-020**: The application MUST reproduce Frontier Developments' media-usage notice, as the
  library's attribution terms require of any project that redistributes the imagery, and MUST keep
  it discoverable from wherever illustrations are shown.
- **FR-021**: Illustrations MUST NOT delay the catalogue becoming usable. The Commander MUST be able
  to search, sort, filter and select while previews are still arriving, and the application MUST
  remain usable offline after first load with previews included.
- **FR-022**: Preparing an illustration for delivery — compressing it, producing smaller variants,
  stripping editor metadata — is presentation and is permitted. Altering what the illustration
  depicts is not.

#### Saving and reopening builds

- **FR-023**: The application MUST be able to persist named builds to browser local storage, and
  MUST list, open, rename, duplicate and delete them.
- **FR-023a**: The active build MUST be autosaved to browser local storage as a **working build**,
  and MUST be restored as the active build when that tab is reloaded. Each tab owns exactly one
  working build, identified by an internal identity, so that tabs editing different builds never
  overwrite one another's work. A working build is distinct from a named saved build: it MUST NOT
  appear in the saved-build list, writing it MUST NOT create, overwrite or touch any named saved
  build, and a build restored from it MUST still be identified as unsaved.
- **FR-023b**: A saved build MUST be identified by an internal identity that is independent of its
  name. Renaming a build MUST NOT change which build it is, saving MUST update the build being
  edited rather than any other build that happens to share its name, and two saved builds MAY carry
  the same name. Where a name is already in use, the application MUST say so before saving, renaming
  or duplicating, and MUST let the Commander proceed with the duplicate name rather than refusing
  it.
- **FR-023c**: The saved-build list MUST show enough alongside each name — at minimum the ship and
  the last-modified time — for a Commander to tell same-named builds apart, and every action on the
  list MUST act on the build the Commander chose rather than on the first match by name.
- **FR-023d**: A saved build's internal identity is local to this browser's storage. It is not part
  of the build, MUST NOT be carried in a build link, and MUST NOT be exported.
- **FR-023e**: Before writing a named saved build, the application MUST detect whether that build
  changed in storage since this tab loaded it — as another tab of the same browser may have saved
  it. Where it did, the application MUST report the conflict and offer the Commander a choice:
  overwrite the stored build, keep both by saving theirs as a separate build, or cancel. It MUST NOT
  discard either version without the Commander choosing.
- **FR-023f**: When the application is opened in a new tab or a new session, the working builds
  already in storage MUST be offered for selection alongside the Commander's saved builds, each
  distinguishable by its ship and last-modified time and identified as unsaved. Opening one MUST
  make it that tab's active build. Where the working build being opened is still owned by another
  live tab, the application MUST give this tab a distinct working build of its own rather than
  letting two tabs write to the same record.
- **FR-023g**: A working build MUST be retained until the Commander saves it under a name or
  discards it, and the Commander MUST be able to discard one they no longer want. The retained set
  MUST be bounded; where the bound or the storage quota is reached, the application MUST say so and
  let the Commander discard working builds they no longer need, rather than dropping one silently.
- **FR-023h**: The saved builds and working builds that belong to a given hull MUST be reachable from
  that hull in the catalogue, with their number visible, in addition to the complete list FR-023
  requires. Reaching a build this way MUST open the same build the complete list would, and MUST
  apply the confirmation FR-025 requires when it replaces an active build.
- **FR-024**: Persistence MUST be lossless for everything the application models — hull, every
  slot's fitted module, engineering (blueprint, grade, quality, experimental effect), module enabled
  state and power priority, ship name and ident — for the working slot as well as for named saved
  builds.
- **FR-025**: Replacing or discarding an active build with unsaved changes MUST require explicit
  confirmation. The working slot does not make a build saved: a build that has never been saved
  under a name, or that has changed since it was, still counts as having unsaved changes.
- **FR-026**: When storage is unavailable, the application MUST remain fully functional for
  building, sharing and exporting, and MUST state that saving is unavailable. Where the working
  build cannot be written either, the application MUST say that the active build will not survive a
  reload, rather than implying it is being kept.

#### Build links

- **FR-027**: The application MUST be able to encode the active build into a URL and MUST load a
  build from such a URL on startup.
- **FR-027a**: The Commander MUST also be able to hand the application a build link directly — by
  pasting it — without navigating to it. A link supplied this way MUST be treated exactly as one
  opened from the address bar: the same validation, the same refusals (FR-038), the same
  confirmation before replacing unsaved work (FR-025, FR-040). A link whose payload was stripped in
  transit MUST be reported as arriving without one rather than opening an empty build.
- **FR-028**: A build link MUST encode a **minimal build model** — only the state that cannot be
  derived from the catalogue: hull symbol, the module symbol fitted in each occupied slot,
  engineering (blueprint `fdname`, grade, quality, experimental effect `fdname`), each module's
  package-identified fixed pre-engineered variant, decorative modification `fdname`, enabled state
  and power priority for each outfittable or fixed module whose catalogue power draw is greater
  than zero (including the cargo hatch), and the ship's name and ident. Passive modules with absent
  or zero power draw have no power state in the minimal model; redundant `On` or `Priority` fields
  supplied for them MUST NOT be carried in the link. Fixed-variant and decorative modifier values
  MUST be rebuilt from those identities through the package. Fields that
  `@elite-dangerous-almanac/core` can recompute from those inputs (module names, mass, power draw,
  catalogue costs, rebuy and metrics) MUST NOT appear in the link. Captured purchase values —
  including per-module values — MUST NOT appear either; SLEF is the lossless interchange when that
  provenance must travel.
- **FR-029**: Opening a build link MUST reconstruct the build — and, on demand, an equivalent SLEF
  document — from the minimal model via the package. The reconstructed build MUST be equivalent to
  the source build in every field the link models, and calculated fields MUST be rebuilt by the
  package. Credit provenance deliberately excluded by FR-028 is not part of link equivalence.
- **FR-030**: The link codec — the minimal build model's serialisation, its compression and its
  URL-safe encoding — is owned by this application, not by `@elite-dangerous-almanac/core`. It MUST
  live in a self-contained, framework-agnostic module with no dependency on the UI.
- **FR-031**: The codec MUST identify hulls, modules, blueprints and experimental effects by the
  package's own identities (`symbol` and `fdname`) and the game's slot keys. It MUST NOT introduce a
  private catalogue, re-derive any value the package computes, or embed a copy of game data; compact
  identifier tables built from the package's catalogues at build time are permitted, provided they
  are generated rather than hand-maintained.
- **FR-032**: The encoded build MUST be carried in the URL **fragment**, never in the query string
  or the path, so that the payload is never transmitted to the host, a CDN or any intermediary. The
  application MUST NOT copy the payload into the query string, and MUST NOT include it in any
  outbound request.
- **FR-033**: Reading a build from the fragment and updating the fragment as the build changes MUST
  NOT add browser history entries per keystroke or per module change; the Commander's Back button
  MUST remain useful.
- **FR-034**: A complete build link — the whole URL, not just its payload — MUST be at most **500
  characters** for a fully engineered large ship with every slot filled, and a typical mid-size
  build SHOULD come in well under 300. Shorter is better: under 100 characters is a stretch goal,
  and techniques that approach it (catalogue index tables, bit-packing, shared dictionaries) are
  encouraged where they do not compromise FR-031, the compatibility rules or losslessness.
- **FR-035**: The encoded length of a fixed corpus of reference builds — at minimum an empty hull, a
  typical mid-size build and a fully engineered large ship — MUST be asserted by tests, so that a
  change which lengthens links fails the build rather than passing unnoticed.
- **FR-036**: Every build link MUST carry a format version identifying the encoding and the
  identifier tables used to produce it. The version MUST be the first field inside the decoded
  binary payload, before any table-dependent value, rather than existing only in an outer textual
  prefix. Any identifier table derived from a catalogue MUST be pinned to that version rather than
  to whichever catalogue happens to be bundled at decode time.
- **FR-037**: A build link MUST keep opening correctly, forever, in every later release of the
  application. The decoder MUST retain the tables and rules for every format version ever published,
  and MUST decode a link using the version the link declares — never the current one.
- **FR-038**: When a link cannot be decoded faithfully — an unknown format version, a missing table,
  an identifier absent from the pinned catalogue — the application MUST refuse it and say so. It
  MUST NOT fall back to a different version, guess an identifier, or produce a build that differs
  from the one the link describes. Decoding to the wrong ship is a defect of the highest order;
  refusing to decode is the correct outcome.
- **FR-039**: A regression corpus of previously published links — at least one per published format
  version, stored as literal strings — MUST be decoded by tests on every build, asserting each still
  produces its expected build. A format change that breaks an existing link MUST fail the build.
- **FR-040**: A build carried in a URL MUST take effect for that visit without being written to any
  named saved build until the Commander explicitly saves it under a name. As the active build it
  occupies the working slot like any other (FR-023a), and replacing an active build that has unsaved
  changes still requires the confirmation FR-025 demands.

#### Loading and integrity

- **FR-041**: The application MUST validate all imported data — from local storage or from a URL —
  before applying it, and MUST reject malformed, truncated or unresolvable input with a message
  identifying the problem.
- **FR-042**: A failed load MUST leave any existing active build unchanged and the application
  usable.
- **FR-043**: Persisted and URL-encoded builds MUST carry a format version so that data written by a
  different application version is detected rather than misread. For build links this obligation is
  permanent and one-directional: see FR-036 to FR-039.

#### Honesty and provenance

- **FR-044**: Every hull characteristic shown MUST come from `@elite-dangerous-almanac/core`. The
  application MUST NOT derive, estimate or supplement a hull characteristic, and MUST NOT maintain
  its own record of one.
- **FR-044a**: The application MUST identify the version of the bundled catalogue its game data comes
  from, and MUST keep that identification reachable from wherever catalogue figures are shown. The
  version MUST be the one the package reports for the build it was compiled against — never a value
  this application maintains, and never the application's own release version standing in for it.
  Until the package reports one, the version MUST be shown as unavailable.
- **FR-045**: Where a characteristic or capability this feature requires is not available from
  `@elite-dangerous-almanac/core`, it MUST be raised against the package and delivered there. The
  requirement waits on the released fix; it is not satisfied by a value maintained in this
  application.

### Device Requirements

- **FR-046**: Ship selection with its search, sort and filters, the saved-build list and URL import
  MUST be fully usable on desktop, tablet and mobile, in both portrait and landscape.
- **FR-047**: The catalogue MUST remain browsable, searchable, sortable and filterable on a phone
  viewport without horizontal page scrolling; a listing wider than the viewport scrolls within its
  own container, and selection MUST work by touch.
- **FR-048**: Sort and filter controls MUST be operable by touch with targets large enough to hit
  reliably on a phone, and MUST NOT depend on hover.
- **FR-049**: Sharing a build link MUST work on touch devices, including the platform share
  affordance where available, with a manually selectable fallback when clipboard access is denied.

### Testing Requirements

- **FR-050**: Build encoding and decoding, storage persistence and their failure paths MUST be
  unit-tested, including every malformed-input case in this spec, the working builds' autosave,
  restore, per-tab isolation and separation from named saved builds, and the concurrent-save
  conflict path with each of its three outcomes.
- **FR-051**: Sorting, filtering, searching and absent-characteristic handling MUST be unit-tested
  against the domain layer without rendering components, including ties, empty results and every
  absent-value case.
- **FR-052**: Each user story's primary journey MUST have a Playwright end-to-end test that runs
  against desktop, tablet and mobile viewports.

### Key Entities

- **Ship (hull)**: A selectable Elite Dangerous ship from the Almanac catalogue, identified by its
  `symbol`, carrying the slot layout a build is fitted into.
- **Hull characteristic**: One comparable, catalogue-recorded property of a ship, with a unit and
  either a value or the fact that the catalogue does not carry it.
- **Catalogue view**: The Commander's current search term, filters and sort over the hull catalogue,
  together with the resulting match count.
- **Hull preview**: A bundled, static representation of a hull shown alongside its characteristics,
  never the sole carrier of information.
- **Build**: The active working state — a hull plus its fitted, engineered modules, with an optional
  ship name and ident. The unit that is saved, shared and exported.
- **Saved build**: A build stored in browser local storage, identified by an internal, storage-local
  identity and carrying a Commander-chosen name — which need not be unique — and a last-modified
  timestamp.
- **Working build**: An autosaved, unnamed build owned by one tab and identified by an internal
  identity. It survives a reload, is offered for selection when the application is opened in a new
  tab or session, never appears in the saved-build list, and remains unsaved until the Commander
  saves it under a name.
- **Build link**: A URL whose **fragment** carries a complete build, requiring no server to resolve.
  Its payload is the compressed, URL-safe encoding of the minimal build model — never a full SLEF
  document, and never sent to a server.
- **Minimal build model**: The non-derivable state of a build — hull, per-slot module symbols,
  engineering, enabled state and power priority for power-drawing outfittable and fixed modules
  (including the cargo hatch), ship name and ident. Passive modules have no link power state.
  Everything else about the build is recomputed from the catalogue on load; no catalogue or
  captured purchase value is carried.

## Upstream dependencies

The three capabilities this feature originally waited on were delivered in
`@elite-dangerous-almanac/core@0.1.0-beta.4` and verified against the installed package on
2026-08-14. One requirement added on 2026-08-14 is blocked.

**The catalogue version (FR-044a) is raised upstream.** The package exports no machine-readable
version of the game data it carries: only its own release number, which is a library version rather
than a game one, and a game version recorded as prose in its provenance files. FR-044a asks a
Commander to be able to tell which game data they are reading, which a library release number does
not answer. Until the package reports a catalogue version, FR-044a waits — the application MUST NOT
substitute its own release version for it.

1. **Manufacturer and hull size** — `Ship.manufacturer` and `Ship.size` are carried for all 48
   hulls, so the catalogue shows both and can filter and group on them (FR-003, FR-007).
2. **Stock configuration** — `ShipLoadout.default(symbol)` produces the as-delivered build for all
   48 hulls, each reported valid and complete, which satisfies FR-011 unconditionally. FR-012 still
   confines the catalogue listing to hull characteristics: a hull the Commander has not chosen has
   no build, so no figure that depends on fitted modules is quoted for it.
3. **Ship illustrations (FR-014 to FR-022)** — the package now installs them, at
   `assets/ships/<symbol>/illustration.svg` with top and bottom schematics alongside, keyed by the
   same `symbol` this application already uses. All 48 hulls are covered. They are static package
   files rather than JavaScript subpath exports, so the build copies them out of the installed
   package into this application's own assets — which is consumption of a published artefact, not
   the vendored copy FR-019 prohibits.

   Two properties of the set shape planning. The installed set is **64 MB across 144 files**, the
   largest single illustration **4.1 MB**, which no client-side-only application can ship wholesale
   to a phone; delivery therefore needs optimised variants, which FR-022 permits and FR-021
   constrains. And the imagery is Frontier Developments' property under their media-usage terms,
   carrying a notice this application must reproduce (FR-020) — the package ships that notice in its
   `LICENSE` and `THIRD_PARTY_NOTICES.md`.

The characteristics FR-003 and FR-004 require — mass, speed, boost, base armour, base shield
strength, crew, costs and the full mount layout — are all available today.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A Commander can go from opening the application to an active build of their chosen
  ship in under 30 seconds and no more than three interactions.
- **SC-002**: A Commander can narrow the full ship catalogue to the hulls meeting a concrete
  requirement — a minimum number of hardpoints, a maximum cost — and identify the best candidate on
  a chosen characteristic, in under 30 seconds.
- **SC-003**: Every characteristic shown for a hull matches the value
  `@elite-dangerous-almanac/core` records for it — zero divergence across the whole catalogue.
- **SC-004**: Sorting and filtering the full catalogue produce a result within 100 ms, so the list
  stays responsive while a Commander explores.
- **SC-005**: For every hull and characteristic the catalogue does not carry, the absence is shown —
  zero fabricated zeroes across the whole catalogue.
- **SC-006**: The catalogue is searchable, sortable and selectable before any illustration has
  arrived, and every hull carries its own illustration — 48 of 48 hulls,
  with zero hulls showing another hull's artwork.
- **SC-007**: A build saved, reloaded, exported to a link and reopened in a different browser is
  byte-for-byte equivalent in every modelled field — 100% round-trip fidelity across saved builds
  and build links.
- **SC-008**: The application loads and operates with the network disabled after first load, and no
  build data leaves the browser under any interaction. No outbound request — document, asset or
  otherwise — ever carries a build payload, verified by inspecting every request made while
  producing and opening a build link.
- **SC-009**: Every malformed-input case (corrupt storage entry, truncated link, unknown symbol,
  version mismatch) produces a specific, actionable message — zero silent data loss and zero
  unhandled failures.
- **SC-010**: Opening a saved build restores the interactive application within 1 second on a
  mid-range machine.
- **SC-010a**: An active build that was never saved under a name survives a page reload with every
  modelled field intact, and each of several tabs returns to the build it was showing — zero lost
  work across a reload, in every state a build can be in.
- **SC-010b**: No saved build is ever replaced by another tab's version without the Commander
  choosing that outcome — zero silent overwrites across concurrent-tab scenarios.
- **SC-011**: A build link for a fully engineered large ship with every slot filled is at most 500
  characters end to end, and a typical mid-size build is under 300 — measured across a reference
  corpus covering every hull in the catalogue, with the longest link in the corpus reported.
- **SC-012**: Encoding and decoding a build link each complete within 50 ms for the largest build in
  the corpus, so sharing feels instant on a phone.
- **SC-013**: Every link in the published-link regression corpus — one or more per format version
  ever released — decodes to its expected build on every build of the application. Zero links are
  ever retired, and zero decode to a build other than the one they describe.
- **SC-014**: Narrowing the catalogue to a hull, saving a build, reopening it and importing a build
  link all succeed on desktop, tablet and mobile viewports — the same end-to-end suite passes on all
  three, with no horizontal page scrolling at any of them.
- **SC-015**: No figure that depends on a fitted module appears anywhere in the catalogue — not in
  the listing, not among the characteristics it sorts by, not in its filters. Zero build-dependent
  figures quoted for a hull.
- **SC-016**: A build link is honoured identically whether it is navigated to or pasted in — the same
  builds load, and the same malformed inputs are refused with the same messages, across the whole
  malformed-input corpus.

## Assumptions

- Commanders use a modern evergreen browser with `localStorage` available under normal
  (non-private) settings.
- Storage is per-browser and per-origin; builds do not follow a Commander between devices, and the
  application does not pretend otherwise.
- "Basic stats" for a hull means the hull's own catalogue-recorded characteristics. Figures that
  depend on fitted modules belong to the statistics family, which describes a build; a hull the
  Commander has not chosen has no build, so no jump range is quoted for it even though the package
  can produce a stock configuration on selection. Jump range is the case this matters most for: it
  is the characteristic Commanders most want to sort a catalogue by, and the one most easily
  mistaken for a property of the hull. FR-012a keeps it out.
- Comparing hulls side by side is out of scope (FR-010, withdrawn), as is comparing two complete
  builds. What the catalogue provides is comparable figures and the means to narrow on them —
  search, sort and filters — which is what choosing one hull out of forty-eight actually requires.
  A dedicated comparison surface would be a feature of its own.
- Ship and manufacturer names are game text the library owns under constitution principle VI, and the
  package carries no locale for them — its translations cover modules, blueprints and experimental
  effects. This is a deliberate absence rather than a gap: Elite Dangerous does not localise ship
  names, so a hull's name is the same in every language the game ships. `Ship.name` is therefore
  correct as it stands, no locale is requested upstream, and the application shows no
  untranslated-text disclaimer for a hull name. Search and sort (FR-005, FR-006) operate on those
  names directly.
- Previews are the Almanac's ship illustrations, consumed from the library rather than held here.
  They are static assets under the client-side-only principle: bundled at build time, never fetched
  from a third party at runtime.
- The illustration set covers every hull in the catalogue today, so a hull without a preview is
  treated as a temporary gap to be raised upstream rather than an expected state — while FR-015
  still requires the catalogue to work when one is missing.
- How illustrations are optimised and delivered is a plan-time decision constrained by FR-021 and
  FR-022, not a spec-time one. What this specification fixes is that the catalogue never waits on
  them and that their content is never altered.
- The link payload is a minimal build model rather than a SLEF document, so link fidelity is bounded
  by what the application models — the same bound that already applies to saved builds and to SLEF
  round-trips (feature 004).
- Build links are treated as permanent public artefacts: once a link has been shared it lives in
  chat history and forum posts indefinitely, so the format is append-only. Retiring a format version
  is not an option available to a later release, and every format change carries the cost of keeping
  its predecessors decodable.
- Identifier tables pinned to a format version are generated from the package's catalogues and
  committed, so an old version's tables survive a catalogue update. They are build artefacts, not
  hand-maintained game data (FR-031).
- The link format is this application's own, so other community tools cannot read a build link, and
  accepting links produced by other tools is out of scope for this feature. SLEF (feature 004)
  remains the interoperability path.
- Owning the codec here is not a workaround under constitution principle II: the package has no link
  format to defer to. The prohibition still applies in full to anything the package does provide —
  the codec composes the package's data, it never re-derives or corrects it.
- Importing a SLEF payload or a journal `Loadout` event pasted by the Commander is a natural
  companion to this feature but is specified alongside export in feature 004.
- The ship catalogue is the version bundled with the deployed `@elite-dangerous-almanac/core`;
  catalogue currency is a release concern, not a runtime lookup.
- Responsiveness, touch support, accessibility and translatability are behavioural requirements in
  scope now; only visual styling is deferred.
- Which characteristics are prominent, how the catalogue is laid out and how the saved-build list
  is presented are decided at plan time against the design system, per constitution principle VII;
  this spec constrains behaviour and the information shown, not layout.
