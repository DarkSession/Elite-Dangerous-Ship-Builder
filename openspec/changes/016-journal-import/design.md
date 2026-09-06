## Context

See `proposal.md` for the motivation.

Three constraints shape the approach.

- The Almanac reads payloads and publishes no journal-file reader. `ships/slef`
  exposes `inspectSlef`, which takes a JSON string, a SLEF array or a bare
  `Loadout` event. `equipment/suit-loadout` exposes `parseSuitLoadout`, which takes
  one `SuitLoadout`, `SwitchSuitLoadout` or `CreateSuitLoadout` event object. A
  journal file is neither: it is a log of one JSON object per line, which is not
  valid JSON as a whole.
- The ship import path already exists and is deliberately narrow.
  `src/app/domain/ships/slef/slef-import.ts` measures the bytes first, hands the
  exact string to the package, and states that the application reads no format. The
  Equipment Builder has no import path at all.
- Both canvases draw the same panel. `.design/Ship Builder.dc.html` (`#imp-*`,
  `#simp-*`, `#mimp-*`) and `.design/Equipment Builder.dc.html` (`#ge-imp-*`,
  `#me-i*`) carry one anatomy: a description line, a dashed drop zone, a scanned-file
  line, a selection list, an `OR PASTE` divider, the paste box, a status line and a
  two-button footer.

## Goals / Non-Goals

**Goals:**

- One journal reader for both tools, with the payload left entirely to the package.
- The panel the canvases draw, in both tools, at every layout profile.
- A batch import that costs the Commander one action and one decision.

**Non-Goals:**

- Reading any journal event other than a ship `Loadout` and the three suit loadout
  events. Materials, cargo, market and rank events are outside this change.
- Watching a journal directory, or reading a file the Commander did not choose. The
  browser gives no such access, and the constitution forbids the server that would.
- A structured payload route into the Equipment Builder. A journal event and a link
  are the two ways in; an exported payload still leaves for other tools only.

## Screens

### Import build layer — Ship Builder

`src/app/features/slef/import-build-layer/`. Canvas `#imp-modal` (wide),
`#simp-modal` (compact) and `#mimp-modal` (mobile). It keeps its frame, its
description line, its paste box, its status line, its refusal disclosure and its
footer, and gains three parts above the paste box.

Composed from: `ednb-layer`, the new `ednb-file-drop`, `ednb-choice-group`
(`kind="checkbox"`, `layout="marked-cards"`), `ednb-textarea-field`,
`ednb-disclosure`, `ednb-diagnostic-list`, `ednb-action-button`.

States:

1. **Idle** — drop zone, divider, empty paste box. No list.
2. **Scanning** — the drop zone states how many files it is reading. The footer
   action is busy.
3. **One event found** — the scanned-file line names the file and the count. No
   list; loading imports that event.
4. **Several events found** — the list is shown, the first row selected, and the
   label states the count found and the count selected. The footer action reads
   `LOAD BUILD` for one selection and `LOAD n BUILDS` for more.
5. **Refused** — the status line carries the refusal, and the disclosure carries the
   package diagnostics as it does today.

Satisfies 016/FR-001 to 016/FR-011.

### Import loadout layer — Equipment Builder

New, at `src/app/features/equipment/import-loadout-layer/`. Canvas `#ge-imp-modal`
and the compact `#me-i*` panel. Same anatomy and the same five states, with
`LOAD LOADOUT` / `LOAD n LOADOUTS` in the footer and the suit facts on each row.

Satisfies 016/FR-001 to 016/FR-006 and 016/FR-014 to 016/FR-017.

### Saved builds layer, saved loadouts layer

`src/app/features/build-library/` and the Equipment Builder's saved loadouts panel.
Neither changes its composition. Each gains one state: **opened by an import**, in
which the layer opens on its own and the outcome states how many records were
stored. The rows themselves are the rows they already are.

Satisfies 016/FR-010 and 016/FR-017.

### Components

- `ednb-file-drop` (new, `src/app/ui/components/file-drop/`) — the dashed target,
  the labelled file control inside it, and the scanned-file line. Preview states:
  idle, dragging, scanned one file, scanned several files, refused.
- `ednb-choice-group` (extended) — `Choice` gains an optional `meta` string, drawn
  right-aligned on a `marked-cards` row. The canvas puts the event's time there, and
  the design system is extended rather than a second list component written.

## Decisions

**The application frames the log; the package reads the payload.** A journal file is
JSON Lines. The application splits on line breaks and hands each candidate line to
the package unchanged. It reads two fields of its own — the line's `event` name and
its `timestamp` — because the package itself states that both name the journal line
rather than the loadout, and drops them on import. Nothing else in a line is read
here, and nothing is repaired.

_Alternative considered:_ asking the Almanac for a journal-file reader and waiting
for the release. Rejected because framing a log is file handling rather than game
data or a build calculation, so principle II does not reach it, and the package
would gain a browser-file concern it has no other reason to carry.

**Lines are pre-filtered by substring before they are parsed.** A 25 MB journal holds
tens of thousands of lines and a handful of loadout events. A line is handed to the
package only when it starts with `{` and contains the event name the tool is looking
for. The test is on the container's text, not on a parsed field, so no format is read
by it.

**Scanning stays on the main thread.** With the pre-filter, the cost is a string scan
plus a few `JSON.parse` calls per file. Files are read one at a time and the surface
states its progress. A worker would add a build target and a message protocol for
work that is measured in hundreds of milliseconds.

**One selection loads; several selections save.** The Commander's ruling of
2026-09-06. It also removes the question a mixed outcome raises — which of the
selected builds deserves the workspace — and it leaves the build already open
untouched, which no other import route does.

**Records imported in a batch are named.** Named by the build's ship name, its ident
where there is none, or its hull name where there is neither. A batch of unnamed
records would run out on the seven-day clock a Commander never saw, having asked for
an import rather than for a browse. The hull-name case is the one place the
application supplies a record name, and the modified requirement in
`ship-builder/build-lifecycle` fences it to this route.

**The equipment side reuses the ship side's shape, not its code.** The two payloads
have nothing in common below the file: `inspectSlef` returns entries and
diagnostics, `parseSuitLoadout` returns one frozen loadout and throws on a bad suit.
What is shared is the file work — selection, drop, the bound, the framing, the
listing — and that is what `platform/journal-files` specifies and one domain module
implements.

## Divergences from the canvases

The canvases are the record, and this change departs from them in two places. Both
are Commander rulings of 2026-09-06, recorded here rather than argued again.

**Divergence from the batch outcome.** Both canvases load the first selected event
into the yard or onto the bench and add the rest to the saved records, ending with a
status line reading `3 BUILDS IMPORTED · VIPER IN THE YARD · 2 ADDED TO SAVED
BUILDS`. What is built loads nothing when several events are selected: all of them
are saved, the workspace is left as it was, and the saved records layer opens. What
survives from the canvas is everything drawn — the panel, the list, the row, the
footer label counting the selection — and the status line, which states the count
imported without naming a build in the workspace.

**Divergence from the record naming.** The canvases store an imported record without
saying what names it. The ruling names it, including the hull-name fallback, and that
fallback contradicts `build-lifecycle`'s rule against an application-supplied name.
The requirement is modified rather than read around.

## Wording carried from the canvases

The description line reads `Upload journal files, or paste …`. Nothing is uploaded:
the file is read in the browser and no request is made. The word is the canvas's, the
guarantee is 016/FR-001, and no sentence is added beside the drawn one to explain it.

## Risks / Trade-offs

- A very large journal on a low-powered phone misses the 5-second budget →
  the files are read one at a time with progress stated, so a slow scan is visible
  rather than a frozen screen. If the budget is missed on the mobile profiles, the
  scan moves to a worker; the domain module is already free of the DOM.
- A journal holds dozens of loadout events, so the list is long → the events are
  deduplicated and ordered newest first, and the list scrolls inside the panel as the
  canvas draws it.
- A Commander selects twenty events and fills browser storage → the existing
  storage-full path applies unchanged: the failure is stated, and what could not be
  stored is named.
- Two names collide in a batch, and the Commander cannot tell the records apart →
  the row already carries the hull and the time it was edited, which is what tells
  two records of one name apart today.
