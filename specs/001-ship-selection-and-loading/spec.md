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
2. Every build worked on is listed, named or not, and can be opened, named, renamed, duplicated and
   deleted. Editing a named build never moves it; the edits are their own entry until they are saved.
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
  record yet MUST be autosaved to an unnamed record of its own from the moment it becomes active,
  unless its modelled state is identical to an unnamed record already stored, in which case it MUST
  take that record over rather than store a second copy of it. A build opened from an existing record
  MUST be autosaved to an unnamed record of its own from its first modelled edit. Autosave MUST NEVER
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
  ordinary editing leave records behind, and FR-009 and FR-013 carry that cost: a name is what keeps
  a record past the retention limit, and a save or a confirmed deletion is the only thing that
  removes one.

- **FR-009**: Duplicate names MUST be allowed after warning. Removing a record MUST require either a
  confirmed deletion or the manual save that consumes it, and nothing else may remove one. A manual
  save MUST consume the unnamed record it saved from and MUST leave no copy of it behind: naming an
  unnamed record MUST name that same local identity, and writing the build into an existing record
  MUST delete the unnamed record afterwards. Saving a copy under another name MUST create a further
  record and leave the original where it is. Replacing the active build MUST NOT be confirmed,
  because FR-008 leaves nothing to lose.
- **FR-010**: Stored entries MUST show their name or that they have none, hull, last-modified time
  and the validation state recorded at that time. A build MAY have one local note.
- **FR-011**: Notes and storage identities MUST remain local and MUST NOT enter a build link or SLEF
  export.
- **FR-012**: Two live pages MUST NOT autosave to one record. Each page's autosave target is an
  unnamed record it minted or took over for itself; a page that finds another live page claiming that
  identity MUST fork under a fresh one before either page next writes. Two pages MAY hold the same named record open,
  because neither autosaves into it; concurrent manual writes to one record MUST offer overwrite,
  keep both and cancel.
- **FR-013**: Retention of unnamed records MUST have a finite documented limit and MUST NOT delete
  work automatically. Naming a record releases its slot, and named records are bounded only by the
  browser storage quota. At that limit or at the quota, the Commander MUST be able to choose records
  to discard while the active in-memory build remains usable.
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
- A build replaced in the workspace is not gone: it is the record it was being autosaved to, and the
  library still lists it.
- Creating the same stock hull twice, or opening one link twice, leaves one record rather than two:
  an ingress identical to an unnamed record already stored takes that record over. The FR-013 limit
  therefore counts builds a Commander has, not actions they took.
- Editing a build opened from a named record changes nothing in that record. The edits are an
  unnamed record of their own, listed as such, until the Commander saves them somewhere.
- Opening a named build and not editing it writes nothing at all.
- The retention limit is reached by ordinary browsing rather than exceptionally, so it is an
  ordinary surface: it asks which unnamed records to discard, and offers naming one as the other way
  forward.
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
  and lose no build a Commander has worked on except to an explicit, confirmed deletion or to the
  manual save that consumes it.
- **SC-003**: Every published link reconstructs an equivalent build and remains decodable.
- **SC-004**: No automatic request sends build data or contacts another origin.
