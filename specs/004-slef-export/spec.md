# Feature Specification: SLEF Import and Export

**Feature Branch**: `004-slef-export`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Users should be able to export the ship into SLEF."

## Scope

This specification covers taking the active build out of the application as SLEF, and bringing a
build in from a SLEF payload or a journal `Loadout` event the Commander pastes.

Export always carries exactly one ship — the active build. Import always takes exactly one ship, by
paste, and is the one capability outside [feature 001](../001-ship-selection-and-loading/spec.md)
that may create an active build.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Export the active build to SLEF (Priority: P1)

A Commander finishes a build and takes it out of the application as SLEF, to paste into a Discord
channel or feed to another community tool.

**Why this priority**: SLEF is the community interchange format for Elite Dangerous loadouts. It is
the application's interoperability contract, and it works without any server.

**Independent Test**: Export a known build and confirm the produced SLEF is valid, carries every
fitted module and its engineering, and is accepted by a SLEF consumer.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander exports it, **Then** the application produces a
   valid SLEF payload for that build.
2. **Given** a SLEF payload has been produced, **When** the Commander chooses, **Then** they can
   copy it to the clipboard and download it as a file with a sensible filename derived from the ship
   and build name.
3. **Given** the exported payload, **When** it is inspected, **Then** it identifies this application
   and its version in the SLEF header, and carries a link that opens that same build in this
   application.
4. **Given** a build with engineered modules, **When** it is exported, **Then** every blueprint,
   grade and experimental effect is present in the payload, with engineering quality reported as
   100%.
5. **Given** a build with disabled modules and assigned power priorities, **When** it is exported,
   **Then** those states are carried in the payload.
6. **Given** a build assembled in the application rather than imported, **When** it is exported,
   **Then** the payload carries no credit figures at all, rather than catalogue retail ones.

---

### User Story 2 - Import SLEF back in (Priority: P2)

A Commander pastes a SLEF payload from a squadmate — or a `Loadout` event copied out of their own
journal — and gets that ship to inspect and modify, with any partial engineering quality treated as
a completed grade.

**Why this priority**: Export without import makes the application a dead end. Importing is what
lets a Commander bring their in-game ship in and plan changes against it. It is independently
testable and complements feature 001's URL import.

**Independent Test**: Paste a known SLEF payload, confirm the resulting build matches every modelled
field, confirm any partial engineering quality becomes 100%, and confirm re-exporting it produces an
equivalent payload under that rule.

**Acceptance Scenarios**:

1. **Given** a valid SLEF payload, **When** the Commander pastes it, **Then** the described build is
   loaded as the active build with every module and engineering entry intact.
2. **Given** a payload containing more than one ship, **When** it is imported, **Then** the
   application refuses it with a message saying it carries several ships, and the existing active
   build is left untouched.
3. **Given** a payload that is not valid JSON, or whose values fall outside what the format permits,
   **When** it is imported, **Then** the application reports what was wrong and where, and the
   existing active build is left untouched.
4. **Given** an imported build, **When** it is exported again without modification, **Then** the
   payload is equivalent to the original in every field the application models.
5. **Given** a payload recording what the ship actually cost, **When** it is imported and
   re-exported, **Then** that recorded price is preserved unprompted and kept distinct from
   catalogue retail pricing.
6. **Given** a journal capture carrying partial engineering rolls and ammunition state, **When** it
   is imported, **Then** the normalisation of those rolls to 100% is reported and the ammunition
   state is discarded without comment.

---

### Edge Cases

- A build that is incomplete or cannot fly: it is still exportable, and the export states that the
  build is incomplete rather than refusing or silently filling in the gaps.
- A slot whose module could not be resolved on import: the export does not invent a module for it,
  and the Commander is told the build carries an unresolved entry.
- A payload produced by a newer SLEF revision than the bundled package understands: the import
  reports the version problem instead of partially applying it.
- A payload larger than 64 KB pasted into the import: it is refused with a message naming the limit,
  without the application freezing and without the active build being touched.
- Clipboard access denied by the browser: the payload is still shown for manual selection and still
  downloadable.
- The build link for the export header cannot be produced: the payload is still produced and still
  valid, carrying the application's name and version without the link.
- Exporting immediately after an edit: the payload reflects the edit, never a stale build.
- An imported build edited before it is exported again: its recorded price narrows to what that
  price still describes rather than going stale. A slot whose module was replaced exports no price,
  and a recorded total is dropped once it covers an article no longer aboard. A recorded hull price
  stands, because it names no slot.
- A payload other community tools accept but the package rejects: the discrepancy is raised against
  the library and fixed there; this application does not sanitise the payload to make it parse.
- Import on a phone: pasting the payload is the only route and is sufficient on its own, and the
  paste target is usable at that viewport.
- A Commander with the payload in a file rather than on the clipboard: they open the file and paste
  its contents, which the import accepts exactly as any other paste. The application does not read
  files.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-000**: Export MUST require an active build. Where no build is active, the application MUST
  NOT offer an export and MUST NOT create a build in order to have something to export. Import is
  the one capability here that does not require a build, because it produces one — see FR-006a.
- **FR-001**: SLEF serialisation and parsing MUST be performed by `@elite-dangerous-almanac/core`.
  The application MUST NOT hand-roll the format.
- **FR-002**: The application MUST export the active build as a valid SLEF payload carrying exactly
  one entry. Exporting several builds in one payload is out of scope, matching the single-ship
  import FR-008 requires.
- **FR-003**: The export MUST include every fitted module with its engineering (blueprint, grade,
  experimental effect, and invariant 100% quality), enabled state and power priority, plus the
  ship's name and ident where set.
- **FR-004**: The exported SLEF header MUST identify this application by name and version, and MUST
  carry a link that opens the exported build in this application — the shareable build link [feature
  001](../001-ship-selection-and-loading/spec.md) produces. Where that link cannot be produced, the
  export MUST still proceed without it rather than failing.
- **FR-005**: The Commander MUST be able to copy the payload to the clipboard and download it as a
  file.
- **FR-006**: The application MUST accept a SLEF payload pasted by the Commander and load it as the
  active build. Pasting is the whole of the import surface: the application MUST NOT require a file
  to be chosen, and MUST NOT make any import capability reachable only through one.
- **FR-006a**: Import is a route to an active build in its own right, alongside the routes [feature
  001](../001-ship-selection-and-loading/spec.md) owns, and is the only capability outside that
  feature which may create one. It MUST therefore be reachable with no build active, and MUST NOT
  require a hull to be chosen first. Where a build is already active, a successful import replaces
  it and MUST require the confirmation feature 001's FR-025 requires of any replacement.
- **FR-007**: The application MUST accept a journal `Loadout` event as an import source in addition
  to SLEF.
- **FR-008**: Import MUST take exactly one ship. A payload carrying more than one entry MUST be
  refused with a message saying so, and MUST NOT be partially applied. Parsing MUST be strict: a
  payload is either wholly applied or wholly refused.
- **FR-008a**: Import MUST accept a payload of up to 64 KB and MUST refuse a larger one with a
  message naming the limit. The refusal MUST be reached without the interface locking up.
- **FR-009**: Import MUST validate before applying; a failed import MUST leave the existing active
  build unchanged.
- **FR-010**: Import → export MUST be lossless for every field the application models. Partial
  engineering quality is not a modelled field: imports MUST normalise it to 100%, and exports MUST
  report 100%.
- **FR-011**: A recorded source purchase price MUST be preserved unedited across import and export,
  and MUST remain distinct from catalogue retail pricing. An export MUST quote that recorded price
  and nothing else: catalogue retail pricing MUST NEVER be written into an export, and a build
  carrying no recorded price — one assembled in the application, or an import that stated none —
  MUST export no credit figure at all rather than substituting a derived one. No export-time choice
  governs this.
- **FR-012**: Incomplete or invalid builds MUST remain exportable, with their incompleteness
  reported to the Commander at export time.
- **FR-013**: All export and import MUST happen in the browser; no payload may be transmitted
  anywhere.
- **FR-014**: Import errors MUST identify the problem and where in the payload it occurred.
- **FR-014a**: A successful import MUST report what it changed about the build it produced — an
  engineering roll normalised from a partial quality to 100%, and any slot whose module could not be
  resolved. It MUST NOT report state that describes the moment of capture rather than the build;
  ammunition loaded, the engineer who applied a modification, capture timestamps, and ship instance
  and hull health are discarded without comment.
- **FR-015**: A SLEF defect — a payload the package rejects that other tools accept, or a field it
  drops — MUST be raised against `@elite-dangerous-almanac/core` and fixed there. This application
  MUST NOT pre-process, repair or post-process payloads to compensate.

### Device Requirements

- **FR-016**: Export and import MUST be fully usable on desktop, tablet and mobile, in both portrait
  and landscape.
- **FR-017**: Import MUST accept a payload by paste on touch devices as well as by pointer and
  keyboard, and the paste target MUST be usable at a phone viewport. A file picker is deliberately
  not offered (FR-006). Export MUST offer copy, download and the platform share affordance where
  available.
- **FR-018**: The payload and any import diagnostics MUST remain readable on a phone without
  horizontal page scrolling; the payload itself scrolls within its own container.

### Testing Requirements

- **FR-019**: Export, import and round-trip fidelity MUST be unit-tested against a corpus of
  reference payloads, including every malformed-input case in this spec.
- **FR-020**: Each user story's primary journey MUST have a Playwright end-to-end test that runs
  against desktop, tablet and mobile viewports, in Chromium and in Firefox.

### Key Entities

- **SLEF payload**: The community interchange representation of one or more ship loadouts, carrying
  a header identifying the producing application. This application writes and reads exactly one
  (FR-002, FR-008).
- **Loadout event**: The journal event the game itself writes, accepted as an alternative import
  source.
- **Export options**: The choices made at export time. Pricing is not among them — an export quotes
  a recorded source purchase price where one exists and no credit figure at all otherwise (FR-011).
- **Import diagnostic**: A report of what could not be read, where in the payload, and why.

## Upstream dependencies

`@elite-dangerous-almanac/core` performs SLEF serialisation and parsing, reads journal `Loadout`
events, and carries the source purchase record that FR-011 preserves. Nothing in this feature is
blocked.

The 64 KB limit FR-008a sets is several times the largest payload the format produces. An Anaconda
with every slot filled and a top-grade blueprint on all 32 engineerable slots serialises to 11.8 KB
compact, against 1.6 KB stock, and that is a floor — it carries no experimental effects, and the
modifier arrays are what dominate. A game journal capture of such a build, carrying engineer names,
blueprint ids, ammunition counts and module health, runs larger again.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Exported payloads are accepted by SLEF-consuming community tools for 100% of valid
  builds in the test corpus.
- **SC-002**: Import → export round-trips preserve every modelled field exactly, across a corpus
  covering every ship in the catalogue and a range of engineering states; every partial input
  quality is 100% in the exported result.
- **SC-003**: A Commander can get a SLEF payload onto their clipboard in no more than two
  interactions from viewing a build.
- **SC-004**: Every malformed-input case produces a specific diagnostic naming the problem and where
  in the payload it occurred — zero silent drops and zero unhandled failures.
- **SC-005**: Export and import of a fully outfitted large ship complete within 500 ms.
- **SC-006**: Export and import both succeed on desktop, tablet and mobile viewports — the same
  end-to-end suite passes on all three, with no horizontal page scrolling at any of them.
- **SC-007**: Every import that normalises a partial engineering roll or produces an unresolved slot
  reports it, and no import reports discarded capture state — measured across the reference corpus,
  including game journal captures.
- **SC-008**: The link carried in an exported header opens a build identical to the one exported,
  across the round-trip corpus.
- **SC-009**: A payload of 64 KB or less imports within the SC-005 budget, and every larger one is
  refused with a message naming the limit — no freeze, no partial application.

## Assumptions

- SLEF semantics, strictness and version support are whatever `@elite-dangerous-almanac/core`
  implements; this application does not extend the format.
- "Lossless" is bounded by what the application models: fields the application does not understand
  are out of scope for round-trip guarantees. FR-014a fixes which side of that boundary the
  Commander is told about.
- A whole-collection backup — every saved build in one payload — is out of scope here. Saved builds
  belong to [feature 001](../001-ship-selection-and-loading/spec.md), and that feature would own
  such a capability if it is ever wanted.
- Reading journal files directly from disk, or watching a live journal directory, is out of scope —
  the client-side-only constraint means the Commander pastes the payload, and FR-006 makes pasting
  the whole of the import surface. A file picker would be a second path to test, to make accessible
  and to keep working on a phone, for no case the paste does not already cover.
- Exporting to other tools' proprietary formats or link schemes is out of scope. The one link an
  export carries is this application's own, and it belongs to [feature
  001](../001-ship-selection-and-loading/spec.md) — this feature consumes that codec rather than
  defining a second link format.
- Two further export formats are wanted and deliberately deferred: a journal `Loadout` event, and a
  Markdown table of the build for forum and Discord posts. Neither is specified here and neither
  ships with this feature; they are recorded so the export surface is planned as one that will carry
  more than one format rather than as a single SLEF button.
- A build's note (feature 001's FR-023i) is not exported. It is the Commander's own words about
  their plan rather than a property of the ship, and SLEF carries the ship.
- Responsiveness, touch support and accessibility are behavioural requirements in scope now, and how
  they are met is fixed by [feature 011](../011-interface-foundations/spec.md), which every feature
  inherits as it inherits the constitution.
- How the export and import surfaces look is decided at plan time against the design system, per
  constitution principle VII.
