# Feature Specification: SLEF Export

**Feature Branch**: `004-slef-export`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Users should be able to export the ship into SLEF."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Export the active build to SLEF (Priority: P1)

A Commander finishes a build and takes it out of the application as SLEF, to
paste into a Discord channel or feed to another community tool.

**Why this priority**: SLEF is the community interchange format for Elite
Dangerous loadouts. It is the application's interoperability contract, and it
works without any server.

**Independent Test**: Export a known build and confirm the produced SLEF is
valid, carries every fitted module and its engineering, and is accepted by a
SLEF consumer.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander exports it, **Then** the
   application produces a valid SLEF payload for that build.
2. **Given** a SLEF payload has been produced, **When** the Commander chooses,
   **Then** they can copy it to the clipboard and download it as a file with a
   sensible filename derived from the ship and build name.
3. **Given** the exported payload, **When** it is inspected, **Then** it
   identifies this application and its version in the SLEF header.
4. **Given** a build with engineered modules, **When** it is exported, **Then**
   every blueprint, grade and experimental effect is present in the payload,
   with engineering quality reported as 100%.
5. **Given** a build with disabled modules and assigned power priorities,
   **When** it is exported, **Then** those states are carried in the payload.

---

### User Story 2 - Import SLEF back in (Priority: P2)

A Commander pastes a SLEF payload from a squadmate — or a `Loadout` event copied
out of their own journal — and gets that ship to inspect and modify, with any
partial engineering quality treated as a completed grade.

**Why this priority**: Export without import makes the application a dead end.
Importing is what lets a Commander bring their in-game ship in and plan changes
against it. It is independently testable and complements feature 001's URL
import.

**Independent Test**: Paste a known SLEF payload, confirm the resulting build
matches every modelled field, confirm any partial engineering quality becomes
100%, and confirm re-exporting it produces an equivalent payload under that rule.

**Acceptance Scenarios**:

1. **Given** a valid SLEF payload, **When** the Commander pastes or uploads it,
   **Then** the described build is loaded as the active build with every module
   and engineering entry intact.
2. **Given** a payload containing several builds, **When** it is imported,
   **Then** the Commander chooses which build to open, and entries that could
   not be read are reported individually rather than failing the whole import.
3. **Given** a payload that is not valid JSON, or whose values fall outside what
   the format permits, **When** it is imported, **Then** the application reports
   what was wrong and where, and the existing active build is left untouched.
4. **Given** an imported build, **When** it is exported again without
   modification, **Then** the payload is equivalent to the original in every
   field the application models.
5. **Given** a payload recording what the ship actually cost, **When** it is
   imported and re-exported, **Then** that recorded price is preserved and kept
   distinct from catalogue retail pricing.

---

### Edge Cases

- A build that is incomplete or cannot fly: it is still exportable, and the
  export states that the build is incomplete rather than refusing or silently
  filling in the gaps.
- A slot whose module could not be resolved on import: the export does not
  invent a module for it, and the Commander is told the build carries an
  unresolved entry.
- A payload produced by a newer SLEF revision than the bundled package
  understands: the import reports the version problem instead of partially
  applying it.
- A very large payload pasted into the import: it is handled without freezing
  the application.
- Clipboard access denied by the browser: the payload is still shown for manual
  selection and still downloadable.
- Exporting immediately after an edit: the payload reflects the edit, never a
  stale build.
- A payload other community tools accept but the package rejects: the
  discrepancy is raised against the library and fixed there; this application
  does not sanitise the payload to make it parse.
- Import on a phone with no file picker access: pasting the payload is
  sufficient on its own, and the paste target is usable at that viewport.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-000**: Export MUST require an active build. Where no build is active,
  the application MUST NOT offer an export and MUST NOT create a build in order
  to have something to export. Import is the one capability here that does not
  require a build, because it produces one — see FR-006a.
- **FR-001**: SLEF serialisation and parsing MUST be performed by
  `@elite-dangerous-almanac/core`. The application MUST NOT hand-roll the
  format.
- **FR-002**: The application MUST export the active build as a valid SLEF
  payload.
- **FR-003**: The export MUST include every fitted module with its engineering
  (blueprint, grade, experimental effect, and invariant 100% quality), enabled state and power
  priority, plus the ship's name and ident where set.
- **FR-004**: The exported SLEF header MUST identify this application by name
  and version.
- **FR-005**: The Commander MUST be able to copy the payload to the clipboard
  and download it as a file.
- **FR-006**: The application MUST accept a SLEF payload pasted or uploaded by
  the Commander and load it as the active build.
- **FR-006a**: Import is a route to an active build in its own right, alongside
  the routes [feature 001](../001-ship-selection-and-loading/spec.md) owns, and
  is the only capability outside that feature which may create one. It MUST
  therefore be reachable with no build active, and MUST NOT require a hull to
  be chosen first. Where a build is already active, a successful import
  replaces it and MUST require the confirmation feature 001's FR-025 requires
  of any replacement.
- **FR-007**: The application MUST accept a journal `Loadout` event as an import
  source in addition to SLEF.
- **FR-008**: Import MUST use the tolerant reading path for multi-entry or mixed
  payloads, reporting per-entry diagnostics rather than discarding entries
  silently.
- **FR-009**: Import MUST validate before applying; a failed import MUST leave
  the existing active build unchanged.
- **FR-010**: Import → export MUST be lossless for every field the application
  models. Partial engineering quality is not a modelled field: imports MUST
  normalise it to 100%, and exports MUST report 100%.
- **FR-011**: A recorded source purchase price MUST be preserved unedited across
  import and export, and MUST remain distinct from catalogue retail pricing;
  it MUST be exported only when explicitly requested.
- **FR-012**: Incomplete or invalid builds MUST remain exportable, with their
  incompleteness reported to the Commander at export time.
- **FR-013**: All export and import MUST happen in the browser; no payload may
  be transmitted anywhere.
- **FR-014**: Import errors MUST identify the problem and, for multi-entry
  payloads, the entry index at which it occurred.
- **FR-015**: A SLEF defect — a payload the package rejects that other tools
  accept, or a field it drops — MUST be raised against
  `@elite-dangerous-almanac/core` and fixed there. This application MUST NOT
  pre-process, repair or post-process payloads to compensate.

### Device Requirements

- **FR-016**: Export and import MUST be fully usable on desktop, tablet and
  mobile, in both portrait and landscape.
- **FR-017**: Import MUST accept a payload by paste and by file upload on touch
  devices, and export MUST offer copy, download and the platform share
  affordance where available.
- **FR-018**: The payload and any import diagnostics MUST remain readable on a
  phone without horizontal page scrolling; the payload itself scrolls within its
  own container.

### Testing Requirements

- **FR-019**: Export, import and round-trip fidelity MUST be unit-tested against
  a corpus of reference payloads, including every malformed-input case in this
  spec.
- **FR-020**: Each user story's primary journey MUST have a Playwright
  end-to-end test that runs against desktop, tablet and mobile viewports.

### Key Entities

- **SLEF payload**: The community interchange representation of one or more ship
  loadouts, carrying a header identifying the producing application.
- **Loadout event**: The journal event the game itself writes, accepted as an
  alternative import source.
- **Export options**: The choices made at export time — notably whether to
  include a recorded source purchase price rather than catalogue retail.
- **Import diagnostic**: A per-entry report of what could not be read and why.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Exported payloads are accepted by SLEF-consuming community tools
  for 100% of valid builds in the test corpus.
- **SC-002**: Import → export round-trips preserve every modelled field exactly,
  across a corpus covering every ship in the catalogue and a range of
  engineering states; every partial input quality is 100% in the exported result.
- **SC-003**: A Commander can get a SLEF payload onto their clipboard in no more
  than two interactions from viewing a build.
- **SC-004**: Every malformed-input case produces a specific diagnostic naming
  the problem and, where applicable, the entry index — zero silent drops and
  zero unhandled failures.
- **SC-005**: Export and import of a fully outfitted large ship complete within
  500 ms.
- **SC-006**: Export and import both succeed on desktop, tablet and mobile
  viewports — the same end-to-end suite passes on all three, with no horizontal
  page scrolling at any of them.

## Assumptions

- SLEF semantics, strictness and version support are whatever
  `@elite-dangerous-almanac/core` implements; this application does not extend
  the format.
- "Lossless" is bounded by what the application models: fields the application
  does not understand are out of scope for round-trip guarantees, and this
  boundary is stated to the Commander when it matters.
- Reading journal files directly from disk, or watching a live journal
  directory, is out of scope — the client-side-only constraint means the
  Commander pastes or uploads the payload.
- Exporting to other tools' proprietary formats or link schemes is out of scope
  for this feature.
- Responsiveness, touch support and accessibility are behavioural requirements
  in scope now; only visual styling is deferred.
- Presentation of the export and import surfaces is deferred to the UI
  workstream.
