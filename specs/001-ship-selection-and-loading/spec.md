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

Choosing a hull happens across two surfaces. The **listing** is five sortable, filterable columns —
name, manufacturer, hull size, hardpoints by size, price — and carries no artwork. Selecting a hull
opens its **detail**, which shows that hull's illustration and every characteristic the catalogue
records for it, and which is where the build is created. Selection alone changes no build.

Figures here describe a **hull** as the catalogue records it, before a build exists. Figures for a
**build** belong to the statistics family, whose contract is
[feature 003](../003-ship-statistics/spec.md). Where a hull's mount layout is read from the hull's
own geometry rather than counted, [feature 010](../010-hull-anatomy/spec.md) owns that view. The
application's versions, its licences and Frontier Developments' media-usage notice are presented by
[feature 012](../012-help-and-licences/spec.md).

The build is shared as a link whose payload rides in the URL **fragment**, so it is never
transmitted to any server. That supersedes "import via URL query" in the Input above.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Start a new build from a ship (Priority: P1)

A Commander arrives at the application with nothing loaded, browses the list of Elite Dangerous
ships, picks a hull, and gets a build for that hull in its stock, as-delivered configuration, ready
to outfit.

**Why this priority**: Nothing else in the application can happen without a build in hand. This
story alone is a usable product: choose a ship and look at what it comes with.

**Independent Test**: Open the application with an empty browser profile and no URL parameters,
choose a ship from the list, and confirm its detail opens without a build being created; then take
the create action from that detail and confirm a build for that hull becomes active with its stock
modules fitted.

**Acceptance Scenarios**:

1. **Given** no build has ever been created in this browser, **When** the Commander opens the
   application, **Then** they are offered the ship catalogue, which lists every ship with the
   information needed to tell them apart: name, manufacturer, hull size, hardpoints by size, and
   price.
2. **Given** the catalogue is listed, **When** the Commander selects a hull, **Then** that hull's
   detail opens and no build is created, replaced or modified by the selection alone.
3. **Given** a hull's detail is open, **When** the Commander takes the action to build that ship,
   **Then** a build for that hull is created in its stock configuration and becomes the active
   build.
4. **Given** a build has been created from a hull, **When** the Commander examines it, **Then** it is
   fully editable, savable and shareable like any other build.
5. **Given** the catalogue is listed, **When** the Commander filters or searches by ship name,
   **Then** only matching ships remain listed, and matching ignores case and surrounding whitespace.
6. **Given** an active build exists, **When** the Commander opens another hull's detail, **Then** no
   warning is needed because nothing has changed; and **When** they take the action to build that
   hull, **Then** they are warned that the current build will be replaced and it happens only after
   they confirm.
7. **Given** the catalogue is listed, **When** the Commander asks how current it is, **Then** the
   version of the bundled catalogue the figures come from is identifiable — or reported as
   unavailable while the package reports no catalogue version.

---

### User Story 2 - Narrow the catalogue to the right hull (Priority: P1)

A Commander who wants a large ship with at least four hardpoints, for a price they can afford,
narrows the catalogue on the columns it carries until the candidates are obvious, then opens the
survivors to read the rest of their figures.

**Why this priority**: Choosing the hull is the first and most consequential decision in any build,
and it would otherwise be made from a name alone. Five comparable columns turn the catalogue from a
list into the tool that decision deserves; the figures they leave out are one selection away in the
hull detail.

**Independent Test**: Open the catalogue with no build loaded, sort by a column, narrow it with a
filter, and confirm the remaining hulls are exactly those that match and are ordered correctly on
that column.

**Acceptance Scenarios**:

1. **Given** the catalogue is listed, **When** the Commander views it, **Then** every hull is shown
   as a row of five columns — name, manufacturer, hull size, hardpoints by size, and price — and no
   other characteristic occupies a column.
2. **Given** the catalogue is listed, **When** the Commander sorts by any of those five columns,
   **Then** the hulls are ordered by that column, the ordering direction is apparent, and hulls for
   which the value is unavailable are grouped rather than sorted as though they were zero.
3. **Given** the catalogue is sorted by hardpoints, **When** two hulls carry the same number of
   them, **Then** the one with the larger mounts is placed first, and hulls identical on every size
   keep a stable order between re-sorts.
4. **Given** the catalogue is listed, **When** the Commander filters by hardpoints, price or any
   other listed column, **Then** only hulls matching every active filter remain, and the active
   filters and the number of matches are visible.
5. **Given** the Commander wants a figure the listing does not carry — mass, speed, boost, armour,
   shields, crew or the other cost figure — **When** they look for it, **Then** they find it in the
   hull's detail, and they neither sort nor filter the catalogue by it.
6. **Given** filters and a search term are active, **When** no hull matches, **Then** the Commander
   is told nothing matched and can clear the filters in a single action.
7. **Given** the catalogue or a hull's detail is open, **When** the Commander looks for a figure that
   depends on fitted modules — a jump range, a shield strength for a fitted generator — **Then** it
   is not there, because no build exists for a hull the Commander has not chosen.

---

### User Story 3 - See the ship before choosing it (Priority: P2)

A Commander who knows Elite Dangerous ships by sight, not by name, opens a candidate hull's detail
and confirms from the picture that it is the ship they were thinking of before committing to build
it.

**Why this priority**: Recognition is faster than recall, and hull names are easy to confuse. It is
P2 because the narrowing in story 2 is what makes the decision; the preview is the check taken
before the build is created.

**Independent Test**: Open the catalogue, select hulls one after another, and confirm each detail
carries a preview that identifies it, that the preview is legible at every supported viewport, and
that a hull without one leaves the detail complete and its build action available.

**Acceptance Scenarios**:

1. **Given** the catalogue is listed, **When** the Commander selects a hull, **Then** its detail
   shows a preview of that hull alongside its characteristics.
2. **Given** a hull whose preview is unavailable, **When** its detail is opened, **Then** the detail
   remains complete and the hull remains buildable, and the missing preview is not presented as a
   defect in the hull.
3. **Given** a hull's detail is opened on a phone, **When** the preview is shown, **Then** it remains
   legible and does not push the characteristics off the screen or force horizontal page scrolling.
4. **Given** illustrations are shown anywhere in the application, **When** the Commander looks for
   their provenance, **Then** Frontier Developments' media-usage notice is reachable, as the terms
   the artwork travels under require — presented by
   [feature 012](../012-help-and-licences/spec.md), which owns that surface.
5. **Given** a Commander using a screen reader, **When** they reach a preview, **Then** the hull is
   identified in text; no information is carried by the preview alone.
6. **Given** the Commander opens one hull's detail after another, **When** they compare what they
   saw, **Then** every preview was presented through the same design-system treatment, none carried
   a colour from its own artwork, and no hull was set apart from the others by how its preview was
   treated.

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
7. **Given** an autosaved working build exists, **When** the Commander views the list of saved
   builds, **Then** the working build is listed among them, marked as unsaved and distinguishable
   from the named builds, and naming it turns that same record into a named saved build rather than
   creating a second one.
8. **Given** working builds exist from earlier tabs or sessions, **When** the Commander opens the
   application in a new tab, **Then** those working builds are in that one list too, each identified
   as unsaved and distinguishable by its ship and last-modified time, and opening one makes it this
   tab's active build.
9. **Given** two tabs are open on different builds, **When** each is reloaded, **Then** each returns
   to the build it was showing, and neither tab's work has been overwritten by the other's.
10. **Given** local storage is unavailable or full, **When** the Commander tries to save, **Then**
    they are told saving failed and why, and the active build is left untouched and still editable.
11. **Given** saved builds exist for a particular hull, **When** the Commander opens that hull's
    detail, **Then** the builds saved against it are reachable from there and their number is
    visible.
12. **Given** a build the Commander wants to say something about, **When** they save it, **Then**
    they can attach a note to it, and reopening the build brings the note back with it.
13. **Given** a saved build that had problems when it was saved, **When** the Commander views the
    build list, **Then** that build is flagged with how many problems it carries, without the build
    being opened or made active to find out.

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
- The full catalogue on a phone: the list stays scrollable, searchable and comparable, and it carries
  no artwork to wait on — no illustration is fetched for a hull the Commander has not selected.
- A preview asset that fails to load: the hull's detail degrades to its text characteristics without
  a broken placeholder and without shifting the layout around it, and the build action stays
  available.
- A hull added to the catalogue before its illustration exists: the hull is listed, comparable,
  selectable and buildable without one, and the missing illustration is raised against the library
  rather than filled with a stand-in drawn here.
- The Commander opening one hull's detail after another faster than the illustrations arrive: each
  detail is usable and its characteristics readable before its illustration lands, the layout does
  not shift as it lands, and a preview that arrives after the Commander has moved on is never shown
  against the wrong hull.
- The application used offline after first load: every hull the Commander has already opened keeps
  its preview, and one they have not is absent rather than rendering as a failure. Every capability
  — search, sort, filter, select, create, save, load and share — is unaffected.
- A hull opened for the first time with no network: its preview cannot arrive, so the detail states
  that it is unavailable offline rather than that the hull has no illustration, every characteristic
  and the build action stay available, and the preview appears when the network returns without a
  reload (FR-017b).
- An illustration whose own palette sits badly beside the rest of the application: it never reaches
  the screen in that palette, because every hull is presented through the one treatment FR-022a
  fixes. No hull is given a treatment of its own to make it fit, and none is left untreated.
- A hull whose illustration is dark, light or unusually saturated relative to the others: the
  treatment is unchanged for it, and it stays recognisable. An illustration that cannot survive the
  treatment is a defect in the treatment or in the artwork, resolved in the design system or raised
  upstream — never by exempting that one hull.
- A hull whose stock configuration the package reports as unavailable: the build is empty and says
  so, and no module is fitted on an assumption about what the ship is delivered with.
- A URL carries a build **and** a build was left active: the URL wins for this visit once the
  Commander has confirmed replacing unsaved work, and it becomes the working build; no named saved
  build is created or overwritten until the Commander saves under a name.
- Private browsing, a full quota, or storage blocked entirely, so the working build cannot be
  written: the Commander is told up front that this build will not survive a reload, rather than
  discovering it after a refresh.
- Two tabs open on different builds: each reloads into its own, and closing one does not disturb the
  other. A tab closed without saving leaves its working build behind, still listed among the builds
  the next time the application is opened.
- The same working build opened from a second tab while the first still holds it: the second tab
  gets a working build of its own rather than both tabs writing to one record.
- Working builds accumulating over many sessions: the retained set stays bounded and the Commander
  can discard any of them, and reaching the bound is reported rather than quietly dropping the
  oldest unsaved work.
- A note longer than the bound: the Commander is told the limit as they reach it and keeps what they
  typed, rather than having it silently cut at save time.
- A build saved before a catalogue update, whose stored problem count no longer describes it: the
  count is shown as recorded when the build was saved, not as a current verdict, and opening the
  build is what produces a current one.
- A build with no problems when it was saved: it carries no flag at all, rather than a flag reading
  zero.
- A saved build references a hull or module symbol that no longer exists in the current catalogue
  version: the application reports which entries could not be resolved instead of dropping them
  silently, and does not lose the rest of the build.
- A link produced years ago, before several catalogue updates: it opens exactly as it did the day it
  was shared, because it is decoded against the tables its declared format version pins.
- A link whose declared format version is newer than the running application understands: it is
  refused with a message saying the link is newer than this version, not decoded on a guess.
- A module removed from the catalogue that an old link still references: the link is refused or the
  slot reported as unresolved, never quietly swapped for a different module.
- A build URL exceeds what a browser or chat client will carry: the Commander is warned that the
  link may be truncated in transit, and is offered the SLEF export (feature 004) as the alternative.
- A build whose encoded link would exceed the 500-character requirement: this is a defect in the
  codec, not an accepted outcome — the reference corpus catches it before release.
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
  client dropped: reported as arriving without a payload exactly as the navigated case is.
- Text pasted into the link import that is not a build link at all — a SLEF payload, a journal event,
  an unrelated URL: the Commander is told what was recognised instead, and a SLEF payload is offered
  to feature 004's import rather than rejected outright.
- The game updated since the bundled catalogue was built: the catalogue version is shown as it is,
  and the application claims no currency it cannot verify. While the package reports no catalogue
  version at all, the version is shown as unavailable rather than replaced by the application's own
  release number.
- A build payload arriving in the query string instead of the fragment: it is not honoured, because
  producing such a link would have leaked the build to the host. The Commander is told why.
- Two saved builds carrying the same name: both are kept, both are distinguishable in the list by
  ship and last-modified time, and opening, renaming or deleting one leaves the other untouched.
- A saved build renamed to a name another build already uses: permitted after the Commander is told,
  and it remains the same build it was.
- A saved-build list long enough to exceed a phone screen: it stays scrollable and searchable, and
  destructive actions stay hard to trigger by accident on touch.

## Requirements _(mandatory)_

### Functional Requirements

#### Client-side operation

- **FR-001**: The application MUST run entirely in the browser. It MUST NOT require any application
  server, and MUST NOT transmit build data anywhere.

#### Choosing a hull

- **FR-002**: The application MUST present the full ship catalogue from
  `@elite-dangerous-almanac/core` for selection, identified by the package's ship `symbol`.
- **FR-003**: The catalogue listing MUST show each hull as a row of exactly these columns: ship name,
  manufacturer, hull size, hardpoint layout (FR-004) and price. It MUST NOT carry further columns.
  The remaining catalogue-recorded characteristics — mass, top speed, boost speed, base armour, base
  shield strength, crew seats, the rest of the mount layout and the hull's other cost figure — belong
  to the hull detail (FR-011a).
- **FR-003a**: Hull size MUST be shown as the game's own small, medium or large. It is the same fact
  as the hull's landing-pad size and MUST be named consistently wherever it appears.
- **FR-003b**: Price MUST be the hull's retail cost — what the shipyard charges for the ship as
  delivered — identified as catalogue retail under FR-013. The hull's other cost figure belongs to
  the detail, and the listing MUST NOT show two cost columns.
- **FR-004**: The hardpoint column MUST show how many hardpoints of each size a hull carries — huge,
  large, medium and small — as comparable values rather than prose, with the size of each count
  identifiable. Utility mounts, core mount sizes and optional slots belong to the hull detail
  (FR-011a).
- **FR-004a**: Sorting by the hardpoint column MUST order hulls by their total number of hardpoints.
  Where two hulls carry the same total, the one carrying the larger mount MUST come first — compared
  on huge counts, then large, then medium, then small — and where every size matches, the ordering
  MUST be stable under FR-009a.
- **FR-004b**: Filtering by the hardpoint column MUST offer both handles the column carries: a total
  number of hardpoints, and a number of hardpoints of a stated size. "At least four hardpoints" and
  "at least one huge hardpoint" MUST both be expressible, and MUST be combinable with each other and
  with the other columns' filters under FR-007.
- **FR-005**: Search MUST match against the hull's name and every other textual value in the listing,
  ignoring case and surrounding whitespace.
- **FR-006**: Every column in the listing MUST be sortable, in either direction, and the active sort
  MUST be visible. A characteristic that appears only in the hull detail is not a sort key.
- **FR-007**: The Commander MUST be able to filter the catalogue by any listed column, and the active
  filters and the resulting match count MUST be visible. Filters are offered on the listed columns
  only.
- **FR-008**: The Commander MUST be able to clear all filters and search terms in a single action.
- **FR-009**: A characteristic the catalogue does not carry for a hull MUST be shown as absent, MUST
  NOT be shown as zero, and MUST NOT be ordered as zero when sorting.
- **FR-009a**: Where two hulls cannot be separated by the active sort, their order relative to one
  another MUST be stable across re-sorts rather than shifting arbitrarily.
- **FR-011**: Selecting a hull in the catalogue MUST open that hull's detail (FR-011a) rather than
  create a build. Browsing the catalogue and opening hull details MUST NOT create, replace or modify
  any build. Creating the build MUST be a separate, explicit action offered from the hull's detail,
  and it MUST create a build in that hull's stock, as-delivered configuration — the one
  `@elite-dangerous-almanac/core` supplies — and make it the active build. No module may be fitted on
  an assumption about what the ship ships with; where the package reports a hull's stock
  configuration as unavailable, the build MUST be created empty and identified as empty rather than
  presented as as-delivered. The build is otherwise a build like any other: editable, savable,
  shareable and exportable.
- **FR-011a**: A hull's detail MUST show, for that hull alone: its preview (FR-014), its name, its
  manufacturer, its hull size, its top speed and boost speed in metres per second, its base shield
  strength in megajoules, its base armour as hit points, its hull mass in tonnes, its full mount
  layout — the hardpoints by size that the listing also shows, plus the utility mounts, core mount
  sizes and optional slots the listing does not — its crew seats, and its cost figures. Hull mass is
  `Ship.hullMass`, the hull's own mass before anything is fitted; hull hardness is a different field
  and MUST NOT be shown. Every figure MUST carry its unit under FR-013. The detail MUST offer the
  action that creates the build (FR-011), and MUST make the builds already saved against that hull
  reachable under FR-023h. Every characteristic the catalogue records for a hull MUST be readable
  here even though it is neither a column, a sort key nor a filter.
- **FR-012**: Characteristics shown before a build exists describe a hull as the catalogue records
  it, not a build. This holds for the hull detail exactly as it holds for the listing: a hull the
  Commander has not built has no fitted modules, so any figure that depends on them MUST either be
  absent or be labelled with the configuration it assumes.
- **FR-012a**: Jump range MUST NOT appear in the catalogue listing, in the hull detail, in the
  characteristics the listing can be sorted by, or in its filters. Jump range exists only once a
  drive is fitted. A Commander who wants it selects the hull first and reads it from
  [feature 008](../008-mobility-and-jump/spec.md).
- **FR-013**: Every figure shown for a hull MUST carry its unit, and cost figures MUST be identified
  as catalogue retail.

#### Ship preview

- **FR-014**: A hull's detail MUST show a preview of that hull alongside its characteristics. The
  catalogue listing MUST NOT carry hull artwork: it is text and figures, so that it stays comparable
  and dense at every viewport and never waits on illustrations to become usable.
- **FR-015**: A hull without a preview MUST remain fully listed, comparable, selectable and
  buildable, its detail MUST remain complete, and the absence MUST NOT degrade the surrounding
  layout.
- **FR-016**: A preview MUST NOT be the sole carrier of any information. Every hull MUST be
  identifiable and comparable from text alone.
- **FR-017**: Previews MUST be served as static assets from the origin the application is served
  from. They MAY be fetched at runtime rather than bundled into the initial load, and MUST NOT be
  fetched from a third party or from any other origin — no host outside this application may learn
  which hulls a Commander opens (constitution principle I).
- **FR-017a**: A hull's preview MUST be fetched when that hull is opened and cached from then on,
  rather than precached for the catalogue.
- **FR-017b**: A preview that has not been fetched and cannot be — the hull is opened for the first
  time with no network — MUST leave the hull's detail complete in text under FR-015, MUST present its
  absence as a temporary one distinct from a hull that has no illustration at all, MUST NOT render as
  a broken image or a failure, and MUST arrive once the network returns without the Commander
  reloading the application. This is the treatment feature 010's FR-014a gives an uncached plate.
- **FR-018**: The preview for a hull MUST be the Almanac's own ship illustration for that hull,
  identified by the hull's `symbol`. The application MUST NOT redraw a hull, substitute artwork from
  elsewhere, or keep its own record of which illustration belongs to which hull.
- **FR-019**: Illustrations MUST reach this application as a published artefact of
  `@elite-dangerous-almanac/core`. Copying the library's asset directory into this repository is
  prohibited: a vendored copy is a parallel record of library-owned material and drifts from it
  exactly as a private catalogue would.
- **FR-020**: The application MUST reproduce Frontier Developments' media-usage notice, as the
  library's attribution terms require of any project that redistributes the imagery, and MUST keep
  it discoverable from wherever illustrations are shown. The notice is presented by
  [feature 012](../012-help-and-licences/spec.md); what this feature owes is that the route to it
  exists wherever a hull is shown.
- **FR-021**: Illustrations MUST NOT delay the catalogue becoming usable. The listing MUST be
  searchable, sortable, filterable and selectable without any illustration having been delivered,
  and a hull's detail MUST present its characteristics and its build action while its preview is
  still arriving. Every capability MUST remain usable offline after first load; the illustrations
  available offline are those of the hulls the Commander has already opened (FR-017a), and one that
  was never fetched is governed by FR-017b.
- **FR-022**: Preparing an illustration for delivery — compressing it, producing smaller variants,
  stripping editor metadata, and resolving the colours it shows to the design system's tokens under
  FR-022a — is presentation and is permitted. Altering what the illustration depicts is not: the
  hull's form, its markings and its proportions are the library's record of the ship, and MUST NOT
  be redrawn, retouched, cropped to a different subject, or composited with anything else. Colour is
  presentation; form is depiction.
- **FR-022a**: A hull illustration MUST be presented through the design system's own hull-art
  treatment, so that every colour it shows on screen comes from the design system's tokens rather
  than from the artwork. The treatment MUST be defined once, in the design system, and applied
  wherever an illustration appears, per constitution principle VII. Resolving the treatment when the
  illustration is prepared for delivery is a permitted way to meet this, as is applying it at
  presentation time; the application ships one theme, so exactly one resolved form of the treatment
  exists either way. This is the obligation [feature 010](../010-hull-anatomy/spec.md)'s FR-006c
  places on the hull schematics, discharged here for the illustrations.
- **FR-022b**: The treatment MUST be the same for every hull. It MUST NOT be varied per hull, per
  manufacturer or per ship size, and it MUST NOT carry information: a hull that is unavailable or
  already carrying saved builds MUST be distinguished by something other than how its illustration
  is treated, consistent with FR-016. A hull MUST remain recognisable under the treatment at every
  supported viewport.

#### Saving and reopening builds

- **FR-023**: The application MUST be able to persist named builds to browser local storage, and
  MUST list, open, rename, duplicate and delete them. That list is the application's one list of
  builds: it carries the working builds FR-023a describes alongside the named ones.
- **FR-023a**: The active build MUST be autosaved to browser local storage as a **working build**,
  and MUST be restored as the active build when that tab is reloaded. Each tab owns exactly one
  working build, identified by an internal identity, so that tabs editing different builds never
  overwrite one another's work. A working build MUST be marked as unsaved wherever it is listed,
  writing it MUST NOT create, overwrite or touch any named saved build, and a build restored from it
  MUST still be identified as unsaved. Naming a working build MUST turn that record into a named
  saved build rather than leaving a duplicate behind.
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
  changed in storage since this tab loaded it. Where it did, the application MUST report the conflict
  and offer the Commander a choice: overwrite the stored build, keep both by saving theirs as a
  separate build, or cancel. It MUST NOT discard either version without the Commander choosing.
- **FR-023f**: The working builds already in storage MUST appear in the build list of FR-023 —
  including when the application is opened in a new tab or a new session — each distinguishable by
  its ship and last-modified time and identified as unsaved. Opening one MUST make it that tab's
  active build. Where the working build being opened is still owned by another live tab, the
  application MUST give this tab a distinct working build of its own rather than letting two tabs
  write to the same record.
- **FR-023g**: A working build MUST be retained until the Commander saves it under a name or
  discards it, and the Commander MUST be able to discard one they no longer want. The retained set
  MUST be bounded; where the bound or the storage quota is reached, the application MUST say so and
  let the Commander discard working builds they no longer need, rather than dropping one silently.
- **FR-023h**: The saved builds and working builds that belong to a given hull MUST be reachable from
  that hull's detail, with their number visible, in addition to the complete list FR-023 requires.
  Reaching a build this way MUST open the same build the complete list would, and MUST apply the
  confirmation FR-025 requires when it replaces an active build.
- **FR-023i**: A build MUST be able to carry one free-text **note** — the Commander's own words about
  what the build is for. The note MUST be editable wherever a build is saved and MUST come back with
  the build when it is reopened, for a working build as well as a named one. It is storage-local: it
  MUST NOT be carried in a build link (FR-028), and it MUST NOT be written into a SLEF export. A note
  MUST NOT be required, and its length MUST be bounded, with the bound stated rather than silently
  truncating what the Commander typed.
- **FR-023j**: A stored build MUST carry the validity and completeness summary the package reported
  for it when it was written — at minimum the number of problems — so the build list can show which
  stored builds have problems without opening or activating any of them. The summary MUST be
  refreshed every time the build is written, MUST be identified as recorded at that moment rather
  than as a live figure, and a stored build whose summary predates a catalogue update MUST NOT be
  presented as verified against the current catalogue. This is a stored property of the record, not a
  statistic: [feature 003](../003-ship-statistics/spec.md)'s FR-000 still forbids computing a
  statistic without an active build, and nothing here computes one.
- **FR-024**: Persistence MUST be lossless for everything the application models — hull, every
  slot's fitted module, engineering (blueprint, grade, experimental effect), module enabled
  state and power priority, ship name and ident, and the note of FR-023i — for the working slot as
  well as for named saved builds.
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
  engineering (blueprint `fdname`, grade, experimental effect `fdname`), each module's
  package-identified fixed pre-engineered variant, decorative modification `fdname`, enabled state
  and power priority for each outfittable or fixed module whose catalogue power draw is greater
  than zero (including the cargo hatch), and the ship's name and ident. Passive modules with absent
  or zero power draw have no power state in the minimal model; redundant `On` or `Priority` fields
  supplied for them MUST NOT be carried in the link. Fixed-variant and decorative modifier values
  MUST be rebuilt from those identities through the package. Fields that
  `@elite-dangerous-almanac/core` can recompute from those inputs (module names, mass, power draw,
  catalogue costs, rebuy and metrics) MUST NOT appear in the link. Credit figures — hull value,
  module values, aggregate modules value and rebuy — MUST NOT appear either; SLEF is the lossless
  interchange when captured purchase provenance must travel. The build note (FR-023i) is likewise
  not part of the minimal model.
- **FR-029**: Opening a build link MUST reconstruct the build — and, on demand, an equivalent SLEF
  document — from the minimal model via the package. The reconstructed build MUST be equivalent to
  the source build in every field the link models, and calculated fields MUST be rebuilt by the
  package. Credit provenance deliberately excluded by FR-028 and partial engineering quality
  normalised under the application-wide rule are not part of link equivalence.
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
  from the one the link describes.
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
- **FR-044a**: The application MUST identify **two** versions, distinctly named, and MUST keep both
  reachable from wherever catalogue figures are shown: its own release version, and the version of
  `@elite-dangerous-almanac/core` bundled with it. Both MUST be taken from the artefacts themselves
  at build time rather than maintained by hand. Neither MUST be labelled as the version of the game
  data. That third version — the game catalogue version — MUST be shown as unavailable while the
  package reports none, and MUST NOT be represented by either of the other two.
  [Feature 012](../012-help-and-licences/spec.md) presents all three; this feature requires that they
  exist and that catalogue figures lead to them.
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
  restore and per-tab isolation, their appearance among the named builds marked as unsaved, the
  conversion of a working build into a named one without leaving a duplicate, and the concurrent-save
  conflict path with each of its three outcomes.
- **FR-051**: Sorting, filtering, searching and absent-characteristic handling MUST be unit-tested
  against the domain layer without rendering components, including ties, empty results and every
  absent-value case. The hardpoint column's ordering rule (FR-004a) MUST be covered explicitly:
  hulls separated by total count, hulls tied on total and separated by mount size, and hulls
  identical on every size holding a stable order across re-sorts.
- **FR-051a**: The hull-art treatment MUST be tested across every hull in the catalogue: that no
  illustration is presented untreated, that the treatment applied is the design system's own rather
  than a value held on a screen or a component, and that it is identical for all 48 hulls.
- **FR-051b**: The build note and the stored validity summary MUST be unit-tested: that a note
  survives save, reload and reopen for a working build as well as a named one, that it never appears
  in a build link or a SLEF export, that the bound on its length is enforced with the Commander told
  rather than by silent truncation, and that the stored summary is rewritten on every save and is
  never computed by activating a build.
- **FR-051c**: Preview delivery MUST be tested end to end: that opening the catalogue requests no
  hull artwork (FR-014, SC-006), that opening a hull requests only that hull's illustration
  (FR-017a), that every request the application makes goes to the origin it was served from and to no
  other (FR-017, SC-008), that a hull opened once keeps its illustration with the network disabled
  while one never opened shows the temporary-absence state rather than a broken image (FR-017b), and
  that the illustration arrives when the network returns without a reload.
- **FR-052**: Each user story's primary journey MUST have a Playwright end-to-end test that runs
  against desktop, tablet and mobile viewports, in Chromium and in Firefox.

### Key Entities

- **Ship (hull)**: A selectable Elite Dangerous ship from the Almanac catalogue, identified by its
  `symbol`, carrying the slot layout a build is fitted into.
- **Hull characteristic**: One comparable, catalogue-recorded property of a ship, with a unit and
  either a value or the fact that the catalogue does not carry it. Five of them are listed columns —
  name, manufacturer, hull size, hardpoints by size, price — and the rest are read in the hull
  detail.
- **Catalogue view**: The Commander's current search term, filters and sort over the hull catalogue,
  together with the resulting match count. Its sorts and filters range over the listed columns only.
- **Hull detail**: What a Commander sees when they select a hull and before any build exists: that
  hull's preview, every characteristic the catalogue records for it, and the action that creates the
  build. Opening one changes no build.
- **Hull preview**: A static representation of a hull shown in that hull's detail alongside its
  characteristics, never in the catalogue listing and never the sole carrier of information.
- **Build**: The active working state — a hull plus its fitted, engineered modules, with an optional
  ship name and ident and an optional note. The unit that is saved, shared and exported.
- **Saved build**: A build stored in browser local storage, identified by an internal, storage-local
  identity and carrying a Commander-chosen name — which need not be unique — a last-modified
  timestamp, its note, and the validity summary recorded when it was written.
- **Working build**: An autosaved, unnamed build owned by one tab and identified by an internal
  identity. It survives a reload, is listed among the saved builds marked as unsaved, and remains
  unsaved until the Commander names it — at which point that same record becomes a named saved build.
- **Build note**: One free text passage the Commander attaches to a build, bounded in length, stored
  with it and never carried in a build link or a SLEF export.
- **Stored validity summary**: The count and substance of the problems the package reported for a
  build at the moment it was written, kept with the record so the build list can flag it without
  activating it.
- **Build link**: A URL whose **fragment** carries a complete build, requiring no server to resolve.
  Its payload is the compressed, URL-safe encoding of the minimal build model.
- **Minimal build model**: The non-derivable state of a build — hull, per-slot module symbols,
  engineering, enabled state and power priority for power-drawing outfittable and fixed modules
  (including the cargo hatch), ship name and ident. Passive modules have no link power state.
  Everything else about the build is recomputed from the catalogue on load; no catalogue or
  captured purchase value is carried.

## Upstream dependencies

`@elite-dangerous-almanac/core` supplies everything this feature reads:

1. **Hull characteristics** — `Ship.manufacturer`, `Ship.size`, `Ship.hullMass`, speed, boost, base
   armour and shield strength, crew seats, the full mount layout and both cost figures, for all 48
   hulls (FR-003, FR-004, FR-011a).
2. **Stock configuration** — `ShipLoadout.default(symbol)` produces the as-delivered build for all 48
   hulls, each reported valid and complete, which satisfies FR-011.
3. **Ship illustrations** — installed at `assets/ships/<symbol>/illustration.svg`, keyed by the same
   `symbol` this application uses, covering all 48 hulls (FR-014 to FR-022). They are static package
   files rather than JavaScript subpath exports, so the build copies them out of the installed
   package into this application's own assets, which is consumption of a published artefact rather
   than the vendored copy FR-019 prohibits. The imagery is Frontier Developments' property under
   their media-usage terms, and the package ships that notice in its `LICENSE` and
   `THIRD_PARTY_NOTICES.md` (FR-020).

The 48 illustrations are **57 MB**, the largest single one **4.1 MB**, part of a **66 MB, 144-file**
artwork tree whose remaining 9.0 MB is the 96 schematic plates
[feature 010](../010-hull-anatomy/spec.md) draws. Figures are decimal (10⁶ bytes to the megabyte).
Delivery therefore needs both optimised variants, which FR-022 permits and FR-021 constrains, and
per-hull fetching at runtime, which FR-017 and FR-017a require: optimisation alone does not reduce
57 MB to a first-load budget, and fetching unoptimised 4.1 MB artwork per hull would make opening a
hull detail slow on the connections a Commander actually has.

**The game catalogue version is the one thing the package does not report.** It exports no
machine-readable version of the game data it carries: only its own release number, which is a library
version, and a game version recorded as prose in `PROVENANCE/ships/SOURCES.md`. FR-044a is satisfied
by showing that version as unavailable with its reason. Raising it upstream is deferred by decision
rather than pending: nothing in any feature depends on the value, so no issue is open for it.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A Commander can go from opening the application to an active build of their chosen
  ship in under 30 seconds and no more than three interactions.
- **SC-002**: A Commander can narrow the full ship catalogue to the hulls meeting a concrete
  requirement — a minimum number of hardpoints, a maximum price, a hull size — and identify the best
  candidate on any of the five listed columns, in under 30 seconds. Reading a figure the listing does
  not carry costs one further step: opening that hull's detail.
- **SC-003**: Every characteristic shown for a hull matches the value
  `@elite-dangerous-almanac/core` records for it — zero divergence across the whole catalogue.
- **SC-004**: Sorting and filtering the full catalogue produce a result within 100 ms.
- **SC-005**: For every hull and characteristic the catalogue does not carry, the absence is shown —
  zero fabricated zeroes across the whole catalogue.
- **SC-006**: The catalogue is fully searchable, sortable and selectable with zero illustrations
  delivered — no hull artwork is requested until a hull is selected — and every hull's detail
  carries its own illustration, 48 of 48 hulls, with zero hulls showing another hull's artwork.
- **SC-006a**: Every colour an illustration shows on screen comes from the design system — zero
  hulls presented in the artwork's own palette, across all 48. The treatment is identical for all 48
  hulls, so zero hulls are distinguishable from one another by their treatment alone, and every hull
  remains recognisable under it at every supported viewport.
- **SC-007**: A build saved, reloaded, exported to a link and reopened in a different browser is
  equivalent in every modelled field — 100% round-trip fidelity across saved builds and build links,
  with engineering quality fixed at 100% rather than stored as a modelled field.
- **SC-008**: Every capability operates with the network disabled after first load — search, sort,
  filter, select, create, save, load, export and open a link — and the only thing missing is the
  artwork of hulls the Commander has not opened, which reads as unavailable rather than as a fault.
  No build data leaves the browser under any interaction: no outbound request ever carries a build
  payload, and every request the application makes goes to the origin it was served from, verified by
  inspecting every request made while producing and opening a build link and while opening a hull.
- **SC-009**: Every malformed-input case (corrupt storage entry, truncated link, unknown symbol,
  version mismatch) produces a specific, actionable message — zero silent data loss and zero
  unhandled failures.
- **SC-010**: Opening a saved build restores the interactive application within 1 second on a
  mid-range machine.
- **SC-010a**: An active build that was never saved under a name survives a page reload with every
  modelled field intact, and each of several tabs returns to the build it was showing — zero lost
  work across a reload.
- **SC-010b**: No saved build is ever replaced by another tab's version without the Commander
  choosing that outcome — zero silent overwrites across concurrent-tab scenarios.
- **SC-010c**: A Commander finds every build they have — named and unsaved alike — in one list, with
  the unsaved ones always distinguishable; and every build that had problems when it was written is
  identifiable from that list without opening it. Zero builds reachable only from a second list, and
  zero builds activated in order to flag them.
- **SC-010d**: A note survives save, reload, reopen, rename and duplicate for every build in the
  round-trip corpus, and appears in zero build links and zero SLEF exports.
- **SC-011**: A build link for a fully engineered large ship with every slot filled is at most 500
  characters end to end, and a typical mid-size build is under 300 — measured across a reference
  corpus covering every hull in the catalogue, with the longest link in the corpus reported.
- **SC-012**: Encoding and decoding a build link each complete within 50 ms for the largest build in
  the corpus.
- **SC-013**: Every link in the published-link regression corpus — one or more per format version
  ever released — decodes to its expected build on every build of the application. Zero links are
  ever retired, and zero decode to a build other than the one they describe.
- **SC-014**: Narrowing the catalogue to a hull, saving a build, reopening it and importing a build
  link all succeed on desktop, tablet and mobile viewports — the same end-to-end suite passes on all
  three, with no horizontal page scrolling at any of them.
- **SC-015**: No figure that depends on a fitted module appears anywhere in the catalogue — not in
  the listing, not in a hull's detail, not among the characteristics it sorts by, not in its
  filters.
- **SC-016**: A build link is honoured identically whether it is navigated to or pasted in — the same
  builds load, and the same malformed inputs are refused with the same messages, across the whole
  malformed-input corpus.

## Assumptions

- Commanders use a modern evergreen browser with `localStorage` available under normal
  (non-private) settings.
- Storage is per-browser and per-origin; builds do not follow a Commander between devices, and the
  application does not pretend otherwise.
- "Basic stats" for a hull means the hull's own catalogue-recorded characteristics. Figures that
  depend on fitted modules describe a build, and a hull the Commander has not chosen has no build.
  Jump range is the case this matters most for: it is the characteristic Commanders most want to sort
  a catalogue by, the one most easily mistaken for a property of the hull, and the one a stock figure
  would mislead on most, because nobody flies the ship the shipyard hands them. FR-012a keeps it out.
- Comparing hulls side by side is out of scope, as is comparing two complete builds. What the
  catalogue provides is comparable figures and the means to narrow on them, which is what choosing
  one hull out of forty-eight requires. A dedicated comparison surface would be a feature of its own.
- Ship and manufacturer names are game text the library owns under constitution principle VI, and the
  package carries no locale for them. This is deliberate rather than a gap: Elite Dangerous does not
  localise ship names, so a hull's name is the same in every language the game ships. `Ship.name` is
  therefore correct as it stands, no locale is requested upstream, and the application shows no
  untranslated-text disclaimer for a hull name.
- Previews are the Almanac's ship illustrations, consumed from the library rather than held here.
  They are the application's own static assets under the client-side-only principle — prepared at
  build time from the installed package, served from the application's own origin, and fetched from
  it per hull at runtime. What the principle forbids is a request to anyone else, not a request at
  all.
- The illustration set covers every hull in the catalogue, so a hull without a preview is a temporary
  gap to be raised upstream rather than an expected state — while FR-015 still requires the catalogue
  to work when one is missing.
- How illustrations are optimised, and by what mechanism they are fetched and cached, is a plan-time
  decision constrained by FR-017a, FR-021 and FR-022.
- The design system owns how a hull illustration looks, exactly as it owns how a schematic looks
  under feature 010's FR-006c. Whether the treatment is resolved when the illustration is prepared
  for delivery or applied at presentation time is a plan-time decision; the application ships one
  theme, so there is one resolved treatment either way. Tinting is not the alteration FR-022
  prohibits: it changes the palette a hull is drawn in, not the hull that is drawn.
- The two kinds of hull artwork are treated on the same terms but not by the same mechanism. The
  schematics are rasterised at build time because they are too heavy to ship as SVG (feature 010's
  FR-006), which is where their colours are resolved; an illustration carries no such constraint.
- The link payload is a minimal build model rather than a SLEF document, so link fidelity is bounded
  by what the application models — the same bound that already applies to saved builds and to SLEF
  round-trips (feature 004).
- Build links are permanent public artefacts: once shared, a link lives in chat history and forum
  posts indefinitely, so the format is append-only. Retiring a format version is not an option, and
  every format change carries the cost of keeping its predecessors decodable.
- Identifier tables pinned to a format version are generated from the package's catalogues and
  committed, so an old version's tables survive a catalogue update. They are build artefacts, not
  hand-maintained game data (FR-031).
- The link format is this application's own, so other community tools cannot read a build link, and
  accepting links produced by other tools is out of scope. SLEF (feature 004) is the interoperability
  path.
- Owning the codec here is not a workaround under constitution principle II: the package has no link
  format to defer to. The prohibition still applies in full to anything the package does provide —
  the codec composes the package's data, it never re-derives or corrects it.
- Importing a SLEF payload or a journal `Loadout` event pasted by the Commander is specified
  alongside export in feature 004.
- The ship catalogue is the version bundled with the deployed `@elite-dangerous-almanac/core`;
  catalogue currency is a release concern, not a runtime lookup.
- Responsiveness, touch support, accessibility and translatability are behavioural requirements in
  scope now, and how they are met is fixed by
  [feature 011](../011-interface-foundations/spec.md), which every feature inherits as it inherits
  the constitution.
- Which characteristics the catalogue lists, and which are read only in a hull's detail, is settled
  here rather than at plan time: five columns, and the rest one selection away. How those columns and
  that detail are composed, sized and ordered on screen remains a plan-time decision against the
  design system, as does how the saved-build list is presented.
- Splitting the catalogue this way trades breadth of narrowing for a listing that stays readable on a
  phone. A Commander cannot filter the catalogue to hulls above a given speed; they narrow on size,
  hardpoints and price, then read speed, boost, armour, shields, mass and crew in the details of the
  few hulls that survive.
