# Feature Specification: Ship Selection and Build Loading

## Scope

Commanders can browse the Almanac hull catalogue, create a stock build, resume builds stored in the
browser and share builds by URL. SLEF import and export are specified in
[004](../004-slef/spec.md); build statistics are specified in
[003](../003-ship-statistics/spec.md).

## User Scenarios

### Story 1 — Create a stock build (P1)

1. Searching, filtering and sorting use the displayed catalogue facts and show the active
   constraints and match count.
2. Opening hull detail shows catalogue facts and artwork without creating or replacing a build.
3. Creating a build uses the Almanac default loadout for the selected hull.
4. Replacing unsaved work requires confirmation.

### Story 2 — Resume local work (P1)

1. Reloading restores the tab's working build.
2. Named and working builds can be listed, opened, named, renamed, duplicated and deleted.
3. A conflicting save from another tab offers overwrite, keep both and cancel; neither version is
   silently lost.
4. If storage is unavailable or full, the build remains usable and the persistence failure is clear.

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
  and MUST support search, filtering and bidirectional sorting over those facts. Missing values MUST
  remain distinct from zero and sort ties MUST be stable.
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
- **FR-008**: The active build MUST be autosaved to a tab-owned working record and restored after
  reload. Working and named records MUST use local identities independent of their display names.
- **FR-009**: Duplicate names MUST be allowed after warning. Deletion and replacement of unsaved
  work MUST require confirmation.
- **FR-010**: Stored entries MUST show name or working state, hull, last-modified time and the
  validation state recorded at that time. A build MAY have one local note.
- **FR-011**: Notes and storage identities MUST remain local and MUST NOT enter a build link or SLEF
  export.
- **FR-012**: Separate tabs MUST NOT share a working record. Concurrent writes to one named record
  MUST offer overwrite, keep both and cancel.
- **FR-013**: Working-record retention MUST have a finite documented limit and MUST NOT delete work
  automatically. At that limit or the browser storage quota, the Commander MUST be able to choose
  records to discard while the active in-memory build remains usable.
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
  implicit in a payload because reconstruction always restores them.
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
  fixed mounts with package defaults, and never allow one tab to silently overwrite another tab's
  work.
- **SC-003**: Every published link reconstructs an equivalent build and remains decodable.
- **SC-004**: No automatic request sends build data or contacts another origin.
