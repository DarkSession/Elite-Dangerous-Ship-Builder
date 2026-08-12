# Feature Specification: Ship Selection and Build Loading

**Feature Branch**: `001-ship-selection-and-loading`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Users should be able to select a ship or open an existing ship (either from browser local storage, or import via URL query). This is a pure client side only application."

## Clarifications

### Session 2026-08-12

- Q: Should the shareable link carry a compressed copy of the full SLEF document, or a minimal description of the build that SLEF is rebuilt from when the link is opened? → A: A minimal build model — encode only non-derivable state and rebuild the SLEF via the library on load.
- Q: Should the compression and encoding codec be built inside `@elite-dangerous-almanac/core`, or as application code in the ship builder? → A: In the ship builder — the link format is owned by this application, not the library.
- Q: Should the encoded build ride in the URL's query string or in its fragment? → A: The fragment (`#…`), so the payload is never transmitted to any server. This supersedes "import via URL query" in the Input above.
- Q: What is the length target a build link must meet? → A: ≤500 characters for a fully engineered large ship (typical mid-size build well under 300), with under 100 characters as a stretch goal worth pursuing.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Start a new build from a ship (Priority: P1)

A Commander arrives at the application with nothing loaded, browses the list of
Elite Dangerous ships, picks a hull, and gets a build for that hull in its
stock, as-delivered configuration, ready to outfit.

**Why this priority**: Nothing else in the application can happen without a
build in hand. This story alone is a usable product: choose a ship and look at
what it comes with.

**Independent Test**: Open the application with an empty browser profile and no
URL parameters, choose a ship from the list, and confirm a build for that hull
appears with its stock modules fitted.

**Acceptance Scenarios**:

1. **Given** no build has ever been created in this browser, **When** the
   Commander opens the application, **Then** they are offered the ship
   selection, and the selection lists every ship in the catalogue with the
   information needed to tell them apart (name, manufacturer, size, core
   characteristics).
2. **Given** the ship selection is open, **When** the Commander selects a hull,
   **Then** a build for that hull is created in its stock configuration and
   becomes the active build.
3. **Given** the ship selection is open, **When** the Commander filters or
   searches by ship name, **Then** only matching ships remain listed, and
   matching ignores case and surrounding whitespace.
4. **Given** an active build exists, **When** the Commander selects a different
   hull, **Then** they are warned that the current build will be replaced and
   the switch happens only after they confirm.

---

### User Story 2 - Reopen a saved build (Priority: P2)

A Commander who built a ship yesterday returns to the application in the same
browser and picks up exactly where they left off.

**Why this priority**: Loadout planning is iterative and spans sessions. Without
persistence, every visit starts from zero and long builds are lost to a
refresh.

**Independent Test**: Create a build, reload the page, and confirm the build is
offered and restores with the same hull, modules and engineering.

**Acceptance Scenarios**:

1. **Given** an active build with unsaved changes, **When** the Commander saves
   it under a name, **Then** it is stored in browser local storage and appears
   in the list of saved builds with its name, ship and last-modified time.
2. **Given** saved builds exist, **When** the Commander opens the application,
   **Then** they can open any saved build, and the opened build matches what was
   saved (hull, every fitted module, engineering, module power priorities and
   enabled/disabled state, ship name and ident).
3. **Given** a saved build is open, **When** the Commander renames, duplicates
   or deletes it, **Then** the saved-build list reflects that change
   immediately, and deletion is confirmed before it happens.
4. **Given** local storage is unavailable or full, **When** the Commander tries
   to save, **Then** they are told saving failed and why, and the active build
   is left untouched and still editable.

---

### User Story 3 - Open a build shared as a URL (Priority: P2)

A Commander receives a link to a build from a squadmate, opens it, and sees that
exact build — without either of them having an account or the build ever
touching a server.

**Why this priority**: Sharing is how loadouts circulate in the community, and
it is the only sharing mechanism available to a client-side-only application.
It is independent of local storage: the link works in a fresh browser.

**Independent Test**: Produce a build URL, open it in a browser profile with
empty local storage, and confirm the build loads identically.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander asks for a shareable link,
   **Then** the application produces a URL that encodes the entire build in the
   URL itself, and copying it requires no server round-trip.
2. **Given** a URL that carries a build, **When** it is opened in any browser,
   **Then** that build is loaded as the active build without needing anything
   from local storage.
3. **Given** a URL carrying a build is opened while a saved build with the same
   name exists, **Then** the imported build does not overwrite anything in local
   storage until the Commander explicitly saves it.
4. **Given** a URL whose build data is malformed, truncated or references
   unknown hulls or modules, **When** it is opened, **Then** the application
   reports that the link could not be read, says what was wrong, and leaves the
   Commander able to continue with ship selection or a saved build.

---

### Edge Cases

- A URL carries a build **and** a saved build was left active: the URL wins for
  this visit, but nothing is written to local storage until the Commander saves.
- A saved build references a hull or module symbol that no longer exists in the
  current catalogue version (a data update removed or renamed it): the
  application reports which entries could not be resolved instead of dropping
  them silently, and does not lose the rest of the build.
- A build URL exceeds what a browser or chat client will carry: the Commander is
  warned that the link may be truncated in transit, and is offered the SLEF
  export (feature 004) as the alternative.
- A build whose encoded link would exceed the 500-character requirement: this is
  a defect in the codec, not an accepted outcome — the reference corpus is
  expected to catch it before release.
- Local storage contains data written by a newer version of the application:
  the application refuses to misread it rather than partially loading it.
- Two tabs edit builds concurrently: a save in one tab must not silently discard
  a save made in the other; the Commander is told when stored data changed
  underneath them.
- Private browsing or a browser configured to block storage: ship selection and
  URL import still work; only saving is unavailable, and it says so up front.
- A mobile browser opening a long build link: the link is honoured up to
  whatever the browser delivered, and a truncated link is reported as such
  rather than partially applied.
- A chat client that strips or mangles the fragment when linkifying a URL: the
  Commander is told the link arrived without a payload rather than being shown
  an empty build, and is offered SLEF export (feature 004) as the alternative.
- A build payload arriving in the query string instead of the fragment: it is
  not honoured, because producing such a link would have leaked the build to
  the host. The Commander is told why.
- A saved-build list long enough to exceed a phone screen: it stays scrollable
  and searchable, and destructive actions (delete) stay hard to trigger by
  accident on touch.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The application MUST run entirely in the browser. It MUST NOT
  require any application server, and MUST NOT transmit build data anywhere.
- **FR-002**: The application MUST present the full ship catalogue from
  `@elite-dangerous-almanac/core` for selection, identified by the package's
  ship `symbol`.
- **FR-003**: Selecting a hull MUST create a build in that hull's stock
  configuration and make it the active build.
- **FR-004**: The Commander MUST be able to search and filter the ship list by
  name, ignoring case and surrounding whitespace.
- **FR-005**: The application MUST be able to persist named builds to browser
  local storage, and MUST list, open, rename, duplicate and delete them.
- **FR-006**: Persistence MUST be lossless for everything the application
  models: hull, every slot's fitted module, engineering (blueprint, grade,
  quality, experimental effect), module enabled state and power priority, ship
  name and ident.
- **FR-007**: The application MUST be able to encode the active build into a URL
  and MUST load a build from such a URL on startup.
- **FR-007a**: A build link MUST encode a **minimal build model** — only the
  state that cannot be derived from the catalogue: hull symbol, the module
  symbol fitted in each occupied slot, engineering (blueprint `fdname`, grade,
  quality, experimental effect `fdname`), each module's enabled state and power
  priority, the ship's name and ident, and any recorded source purchase price.
  Fields that `@elite-dangerous-almanac/core` can recompute from those inputs
  (module names, mass, power draw, costs, metrics) MUST NOT appear in the link.
- **FR-007b**: Opening a build link MUST reconstruct the build — and, on demand,
  an equivalent SLEF document — from the minimal model via the package. The
  reconstructed build MUST be equivalent to the source build in every field the
  application models.
- **FR-007c**: The link codec — the minimal build model's serialisation, its
  compression and its URL-safe encoding — is owned by this application, not by
  `@elite-dangerous-almanac/core`. It MUST live in a self-contained,
  framework-agnostic module with no dependency on the UI.
- **FR-007e**: The encoded build MUST be carried in the URL **fragment**, never
  in the query string or the path, so that the payload is never transmitted to
  the host, a CDN or any intermediary. The application MUST NOT copy the payload
  into the query string, and MUST NOT include it in any outbound request.
- **FR-007f**: Reading a build from the fragment and updating the fragment as
  the build changes MUST NOT add browser history entries per keystroke or per
  module change; the Commander's Back button MUST remain useful.
- **FR-007g**: A complete build link — the whole URL, not just its payload —
  MUST be at most **500 characters** for a fully engineered large ship with
  every slot filled, and a typical mid-size build SHOULD come in well under 300. Shorter is better: under 100 characters is a stretch goal, and
  techniques that approach it (catalogue index tables, bit-packing, shared
  dictionaries) are encouraged where they do not compromise FR-007d, the
  compatibility rules or losslessness.
- **FR-007h**: The encoded length of a fixed corpus of reference builds — at
  minimum an empty hull, a typical mid-size build and a fully engineered large
  ship — MUST be asserted by tests, so that a change which lengthens links
  fails the build rather than passing unnoticed.
- **FR-007d**: The codec MUST identify hulls, modules, blueprints and
  experimental effects by the package's own identities (`symbol` and `fdname`)
  and the game's slot keys. It MUST NOT introduce a private catalogue,
  re-derive any value the package computes, or embed a copy of game data;
  compact identifier tables built from the package's catalogues at build time
  are permitted, provided they are generated rather than hand-maintained.
- **FR-008**: A build carried in a URL MUST take effect for that visit without
  being written to local storage until the Commander explicitly saves it.
- **FR-009**: The application MUST validate all imported data — from local
  storage or from a URL — before applying it, and MUST reject malformed,
  truncated or unresolvable input with a message identifying the problem.
- **FR-010**: A failed load MUST leave any existing active build unchanged and
  the application usable.
- **FR-011**: Persisted and URL-encoded builds MUST carry a format version so
  that data written by a different application version is detected rather than
  misread.
- **FR-012**: Replacing or discarding an active build with unsaved changes MUST
  require explicit confirmation.
- **FR-013**: When storage is unavailable, the application MUST remain fully
  functional for building, sharing and exporting, and MUST state that saving is
  unavailable.

### Device Requirements

- **FR-014**: Ship selection, the saved-build list and URL import MUST be fully
  usable on desktop, tablet and mobile, in both portrait and landscape.
- **FR-015**: The ship list MUST remain browsable and searchable on a phone
  viewport without horizontal page scrolling, and selection MUST work by touch.
- **FR-016**: Sharing a build link MUST work on touch devices, including the
  platform share affordance where available, with a manually selectable fallback
  when clipboard access is denied.

### Testing Requirements

- **FR-017**: Build encoding and decoding, storage persistence and their failure
  paths MUST be unit-tested, including every malformed-input case in this spec.
- **FR-018**: Each user story's primary journey MUST have a Playwright
  end-to-end test that runs against desktop, tablet and mobile viewports.

### Key Entities

- **Ship (hull)**: A selectable Elite Dangerous ship from the Almanac catalogue,
  identified by its `symbol`, carrying the slot layout a build is fitted into.
- **Build**: The active working state — a hull plus its fitted, engineered
  modules, with an optional ship name and ident. The unit that is saved, shared
  and exported.
- **Saved build**: A build stored in browser local storage under a
  Commander-chosen name, with a last-modified timestamp.
- **Build link**: A URL whose **fragment** carries a complete build, requiring
  no server to resolve. Its payload is the compressed, URL-safe encoding of the
  minimal build model — never a full SLEF document, and never sent to a server.
- **Minimal build model**: The non-derivable state of a build — hull, per-slot
  module symbols, engineering, enabled state and power priority, ship name and
  ident, recorded source purchase price. Everything else about the build is
  recomputed from the catalogue on load.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A Commander can go from opening the application to an active build
  of their chosen ship in under 30 seconds and no more than three interactions.
- **SC-002**: A build saved, reloaded, exported to a link and reopened in a
  different browser is byte-for-byte equivalent in every modelled field —
  100% round-trip fidelity across saved builds and build links.
- **SC-003**: The application loads and operates with the network disabled after
  first load, and no build data leaves the browser under any interaction. No
  outbound request — document, asset or otherwise — ever carries a build
  payload, verified by inspecting every request made while producing and opening
  a build link.
- **SC-004**: Every malformed-input case (corrupt storage entry, truncated link,
  unknown symbol, version mismatch) produces a specific, actionable message —
  zero silent data loss and zero unhandled failures.
- **SC-005**: Opening a saved build restores the interactive application within
  1 second on a mid-range machine.
- **SC-006**: Selecting a ship, saving a build, reopening it and importing a
  build link all succeed on desktop, tablet and mobile viewports — the same
  end-to-end suite passes on all three, with no horizontal page scrolling at any
  of them.
- **SC-007**: A build link for a fully engineered large ship with every slot
  filled is at most 500 characters end to end, and a typical mid-size build is
  under 300 — measured across a reference corpus covering every hull in the
  catalogue, with the longest link in the corpus reported.
- **SC-008**: Encoding and decoding a build link each complete within 50 ms for
  the largest build in the corpus, so sharing feels instant on a phone.

## Assumptions

- Commanders use a modern evergreen browser with `localStorage` available under
  normal (non-private) settings.
- Storage is per-browser and per-origin; builds do not follow a Commander
  between devices, and the application does not pretend otherwise.
- The link payload is a minimal build model rather than a SLEF document, so link
  fidelity is bounded by what the application models — the same bound that
  already applies to saved builds and to SLEF round-trips (feature 004).
- The link format is this application's own, so other community tools cannot
  read a build link, and accepting links produced by other tools is out of scope
  for this feature. SLEF (feature 004) remains the interoperability path.
- Owning the codec here is not a workaround under constitution principle II: the
  package has no link format to defer to. The prohibition still applies in full
  to anything the package does provide — the codec composes the package's data,
  it never re-derives or corrects it.
- Importing a SLEF payload or a journal `Loadout` event pasted by the Commander
  is a natural companion to this feature but is specified alongside export in
  feature 004.
- The ship catalogue is the version bundled with the deployed
  `@elite-dangerous-almanac/core`; catalogue currency is a release concern, not
  a runtime lookup.
- Responsiveness, touch support and accessibility are behavioural requirements
  in scope now; only visual styling is deferred.
- Visual design of the ship picker and build manager is deferred to the UI
  workstream; this spec constrains behaviour and the information shown, not
  layout.
