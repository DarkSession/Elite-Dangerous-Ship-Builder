# Feature Specification: Ship Selection and Build Loading

## Scope

This specification covers finding a hull, viewing its catalogue facts, creating its stock build,
reopening browser-stored builds and sharing a build through a URL. All build data remains in the
browser.

SLEF import and export belong to [SLEF Import and Export](../004-slef-export/spec.md). Detailed
build statistics belong to [Ship Statistics](../003-ship-statistics/spec.md).

## User Scenarios & Testing

### User Story 1 - Choose a hull and create a build (Priority: P1)

A Commander can find a hull, inspect the facts the Almanac records for it and explicitly create its
stock build.

**Independent Test**: Start with an empty browser profile, find a reference hull, open its detail
without creating a build, then create the stock build and compare it with the Almanac default
loadout.

**Acceptance Scenarios**:

1. **Given** no active build, **When** the application opens, **Then** the full Almanac ship
   catalogue is available.
2. **Given** the catalogue, **When** the Commander searches, filters or sorts by the displayed hull
   facts, **Then** the matching hulls and active constraints are clear.
3. **Given** a selected hull, **When** its detail opens, **Then** its catalogue facts and preview are
   available and no build has been created or changed.
4. **Given** a hull detail, **When** the Commander creates a build, **Then** the Almanac's stock
   loadout for that hull becomes the active build.
5. **Given** an active build with unsaved changes, **When** another build would replace it, **Then**
   replacement requires confirmation.

### User Story 2 - Resume browser-stored work (Priority: P2)

A Commander can resume an autosaved working build or manage named builds stored in this browser.

**Independent Test**: Create and edit an unnamed build, reload the tab, name it, duplicate it, open
another build and return to the first without losing modeled state.

**Acceptance Scenarios**:

1. **Given** an unnamed active build, **When** the tab reloads, **Then** its working copy is restored
   and remains identified as unsaved.
2. **Given** stored builds, **When** the Commander views them, **Then** named and working builds are
   available in one collection and distinguishable by hull and last-modified time.
3. **Given** a selected stored build, **When** the Commander opens, names, renames, duplicates or
   deletes it, **Then** the action affects that build's storage identity rather than another build
   with the same name.
4. **Given** the same named build changed in another tab, **When** the Commander saves, **Then** they
   can overwrite, keep both or cancel; neither version is silently discarded.
5. **Given** unavailable or full storage, **When** a write is attempted, **Then** the build remains
   editable and the risk of losing it on reload is stated.

### User Story 3 - Open a shared build link (Priority: P2)

A Commander can share the active build as a URL and open that URL in a fresh browser without an
account or server-side storage.

**Independent Test**: Encode the largest reference build, open its URL in a profile with empty
storage and compare all modeled fields and all Almanac-recomputed values with the source build.

**Acceptance Scenarios**:

1. **Given** an active build, **When** a share link is requested, **Then** the complete URL contains
   a versioned build payload in its fragment and no build data in its path or query.
2. **Given** a valid build link, **When** it is navigated to or pasted into the application, **Then**
   the same build becomes active without writing a named build.
3. **Given** an unsupported, malformed or truncated link, **When** it is opened, **Then** the
   application explains the failure and leaves any existing build unchanged.
4. **Given** a link from an earlier supported format version, **When** it is opened, **Then** it
   reconstructs the build against the identifier tables pinned to that version.

### Edge Cases

- A missing catalogue value is absent, never zero and never sorted as zero.
- A hull with no available preview remains identifiable, inspectable and buildable.
- A stock loadout the package cannot supply is reported as unavailable; the application does not
  invent one.
- A stored build containing unknown identities preserves and reports them rather than dropping them.
- Two tabs never write to the same working-build record.
- Duplicate build names are allowed after warning because identity does not depend on the name.
- A build link from a newer or unknown format is refused rather than decoded heuristically.
- A module can be a package-identified variant and separately engineered at the same time; a link
  that carried only the identity would quietly restore the purchase grade instead of the fitted one.
- A handful of mercenary articles sit on modules the pinned table records no ordinary blueprint for.
  Engineered above their purchase grade they cannot be spelled, and the link is refused rather than
  made lossy. A later table closes this; the refusal is not a licence to approximate.

## Requirements

### Hull Catalogue

- **FR-001**: Hull records, identities, facts, slot layouts, stock loadouts and previews MUST come
  from `@elite-dangerous-almanac/core`; a hull MUST be identified by its package `symbol`.
- **FR-002**: The catalogue MUST expose name, manufacturer, size, hardpoint layout and catalogue
  retail price for comparison. The Commander MUST be able to search textual fields, filter the
  exposed facts and sort each exposed fact in either direction.
- **FR-003**: Active search, filters, sort, match count and the ability to clear all constraints MUST
  be visible. Ties MUST be stable and missing values MUST remain distinct from zero.
- **FR-004**: Catalogue working state, including scroll position, MUST survive navigation to a hull
  and back for the browser session but MUST NOT become build or URL state.
- **FR-005**: Hull detail MUST expose every relevant package fact not used for catalogue comparison:
  base speed and boost, base shield and armour, hull mass, complete mount layout, crew seats and
  catalogue cost fields, with units and clear catalogue provenance.
- **FR-006**: A hull detail MUST have a URL identified by the hull `symbol`. Opening it directly MUST
  not create a build; an unknown symbol MUST produce a useful error.
- **FR-007**: A hull without a fitted build MUST NOT be given module-dependent values such as jump
  range. Hull facts and build statistics MUST remain distinct.
- **FR-008**: Creating a build MUST be an explicit action and MUST use the package's stock loadout.
  Browsing a hull MUST NOT create, replace or modify a build.
- **FR-009**: Hull previews MUST be published Almanac assets associated by hull `symbol`, served
  from the application's origin and never used as the only source of information.
- **FR-010**: Preview loading or absence MUST NOT block catalogue use, hull detail or build creation.
  Previously loaded previews MAY remain available offline; an uncached offline preview MUST be
  identified as temporarily unavailable.
- **FR-011**: Artwork provenance and the applicable media-usage notice MUST be reachable wherever a
  preview appears.

### Browser Storage

- **FR-012**: The active build MUST be autosaved as a tab-owned working build and restored after a
  reload. Working builds MUST appear with named builds and remain explicitly unsaved until named.
- **FR-013**: Named and working builds MUST use storage-local identities independent of their names.
  Duplicate names MUST be allowed after warning.
- **FR-014**: The Commander MUST be able to list, open, name, rename, duplicate and delete stored
  builds. Destructive actions and replacement of unsaved work MUST require confirmation.
- **FR-015**: Each stored entry MUST show at least its name or unsaved state, hull and last-modified
  time. A build MUST support one optional local note. The list MUST show a clearly timestamped
  validation summary recorded when the build was written without presenting it as a live result.
- **FR-016**: A note and storage identity MUST remain local. Neither may appear in a build link or
  SLEF export.
- **FR-017**: Opening one working build in another live tab MUST create a distinct working record.
  Concurrent writes to the same named build MUST present overwrite, keep-both and cancel choices.
- **FR-018**: Working-build retention MUST be bounded without silently deleting work. At the bound
  or storage quota, the Commander MUST be told and allowed to discard selected working builds.
- **FR-019**: Browser persistence MUST preserve every application-modeled build field. Unknown
  package identities MUST remain reported in place.
- **FR-020**: If browser storage is unavailable, selection, outfitting, statistics, links and SLEF
  MUST continue to work; only persistence is unavailable.

### Build Links

- **FR-021**: A build link MUST carry its payload only in the URL fragment and MUST never transmit
  build data to the host or any other origin.
- **FR-022**: The link payload MUST contain only non-derivable modeled state: hull and module
  identities, game slot keys, engineering identities and grade, package-identified pre-engineered
  and decorative variants, applicable enabled states and power priorities, ship name and ident.
- **FR-022a**: Where a module carries both a package-identified variant and engineering the
  Commander chose, the payload MUST carry enough to restore both. A mercenary article is the case
  that exists: the package identifies it from a blueprint the Commander can then engineer to a
  higher grade. Recording the variant MUST NOT stand in for that grade, and a link MUST NOT
  reconstruct a module at a grade the Commander did not leave it at.
- **FR-022b**: A build the codec cannot spell completely MUST be refused when the link is made, with
  the reason named, and with the slot named wherever the refusal is attributable to a fitted module.
  Encoding a build to something the Commander did not build is never the answer, and SLEF remains
  available for it.
- **FR-023**: Calculated statistics, catalogue records, prices, source-purchase provenance, notes and
  storage identities MUST NOT appear in a build link. They MUST be reconstructed or remain absent
  according to their source.
- **FR-024**: The application-owned codec MUST use package identities and package-generated
  catalogue tables. It MUST NOT contain hand-maintained game data or calculate a game value.
- **FR-025**: Every payload MUST declare its format version before table-dependent data. Published
  versions and their pinned identifier tables MUST remain decodable.
- **FR-026**: An undecodable link MUST be refused with a specific reason and MUST leave the current
  build and stored builds unchanged.
- **FR-027**: Navigated and pasted links MUST use identical validation, confirmation and decoding
  rules. Build changes MUST replace the current fragment without adding browser-history entries per
  edit.
- **FR-028**: A complete link for the largest fully engineered reference build MUST not exceed 500
  characters. When a link cannot meet that limit, SLEF MUST be offered instead.

### Verification Requirements

- **FR-029**: Catalogue tests MUST cover every package hull, missing fields, all search/filter/sort
  behavior, stock creation and navigation-state restoration.
- **FR-030**: Storage tests MUST cover full modeled-state round trips, working and named builds,
  duplicate names, multiple tabs, write conflicts, quota failure and unknown identities.
- **FR-031**: Link tests MUST cover the reference build corpus, the 500-character limit, every
  published format version, malformed input and equivalence after Almanac reconstruction. They MUST
  also cover every package-identified variant that can carry a Commander-chosen grade, at each grade
  that variant's blueprint offers, and MUST assert the refusal wherever the pinned table cannot spell
  one. An Almanac upgrade MUST re-run this corpus against the frozen link literals, which MUST NOT be
  regenerated to make an upgrade pass.
- **FR-032**: Each primary journey MUST have end-to-end coverage at desktop, tablet and mobile
  viewports in Chromium and Firefox, including automated accessibility checks.

## Key Entities

- **Hull**: A package ship record identified by `symbol`.
- **Build**: A hull plus fitted and engineered module state, ship name and ident.
- **Working build**: A tab-owned autosaved build that has not been named.
- **Named build**: A browser-stored build with a storage identity and Commander-chosen name.
- **Build link**: A versioned fragment encoding of the minimal non-derivable build state.

## Almanac Coverage

The Almanac supplies the complete ship catalogue, hull facts, slot layouts, stock loadouts,
illustrations, build validation and every value recomputed after a stored build or link is loaded.
The application owns only catalogue presentation, browser persistence and the versioned link codec;
none of those computes an Elite Dangerous game value.

## Success Criteria

- **SC-001**: Every displayed hull fact and every stock build matches the bundled Almanac.
- **SC-002**: A Commander can reach an active stock build within 30 seconds and three interactions.
- **SC-003**: A stored build round trip preserves every modeled field, and no tab silently
  overwrites another tab's work.
- **SC-004**: Every published link reconstructs an equivalent build and every calculated value is
  rebuilt by the Almanac.
- **SC-005**: The largest reference link is at most 500 characters and every published format stays
  decodable.
- **SC-006**: No request contains build data and no automatic or programmatic request is sent to
  another origin.
- **SC-007**: The complete feature passes the required viewport, browser and accessibility test
  matrix without horizontal page scrolling.
