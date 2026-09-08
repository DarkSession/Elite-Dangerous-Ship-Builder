## 1. Journal reading, in the domain

- [x] 1.1 Add `src/app/domain/journal/journal-lines.ts`: frame a file's text into
      candidate lines, pre-filter by event name, and hand each line to a reader the
      caller supplies. Verify with unit tests covering a `Journal.*.log`, a file
      holding one whole payload, a truncated last line, CRLF line endings and a
      file with no matching event.
- [x] 1.2 Add the size bound and the file loop: refuse a file over 25 MB before it
      is read, naming the file and the bound; scan the rest one at a time and keep
      only the events found. Verify with unit tests over a selection mixing an
      over-bound file with valid ones.
- [x] 1.3 Add deduplication and newest-first ordering by the line's `timestamp`.
      Verify with a unit test scanning two overlapping journal files and asserting
      one entry per distinct loadout, newest first.
- [x] 1.4 Add the scan-progress report — files read, events found — as a value the
      application layer states. Verify with a unit test asserting the report for one
      file and for several.

## 2. Ship loadouts from a journal

- [x] 2.1 Read each candidate line with `inspectSlef` and build the row facts: ship
      name, ident, hull name from the package's ship catalogue, module count and
      time. Verify with unit tests asserting no hull name is derived from the file's
      symbol.
- [x] 2.2 Extend `slef-import.coordinator.ts` with the selection: several events
      listed, one or more selected, loading refused with none selected. Verify with
      coordinator unit tests over each case.
- [x] 2.3 Import one selected event through the existing paste path, unchanged, and
      assert in a unit test that no named record is created for it.
- [x] 2.4 Import several selected events as named records — ship name, else ident,
      else hull name — without asking about a clash, and leave the active build
      alone. Verify with a unit test asserting record count, names and the untouched
      active build.
- [x] 2.5 Keep a refused entry from costing the others: name it with its package
      diagnostics, store the rest, leave no partial record. Verify with a unit test
      importing four entries with the second refused.
- [x] 2.6 Open the saved builds layer after a batch import and state the count.
      Verify with a unit test on the coordinator and, later, the end-to-end journey.

## 3. Suit loadouts from a journal

- [x] 3.1 Add `src/app/domain/equipment/loadout/suit-loadout-import.ts` reading an
      event with `parseSuitLoadout`, and build the row facts: loadout name, suit name
      from the package, grade, weapon count, modification count and time. Verify with
      unit tests over the package's own example event.
- [x] 3.2 Report `SuitLoadout.importOutcomes` as what was left out, substituting
      nothing, and refuse an unknown suit whole. Verify with unit tests for an
      unknown weapon, an unknown mount, an out-of-range grade, an unresolvable
      modification and an unknown suit.
- [x] 3.3 Add `src/app/application/equipment/loadout-import.coordinator.ts`: one
      selection opens on the bench, several are saved and open the saved loadouts
      layer, and the bench is untouched until an import succeeds. Verify with
      coordinator unit tests over each case.
- [x] 3.4 Name an imported loadout from the event's loadout name, else the suit's
      name, carry the journal note, and keep both copies on a clash without asking.
      Verify with a unit test over a batch whose names are already saved.

## 4. The design system's two parts

- [x] 4.1 Add `ednb-file-drop` to `src/app/ui/components/file-drop/` — dashed target,
      labelled multiple-file control accepting `.log`, `.json` and `.txt`, drag state
      and scanned-file line — built to the canvas `#imp-drop`. Verify with component
      tests for pointer drop, keyboard operation of the file control and the drag
      state, at desktop, tablet and mobile profiles.
- [x] 4.2 Extend `Choice` with the optional right-aligned `meta` and draw it on
      `marked-cards`, to canvas `.imp-row`. Verify with a component test and by the
      existing choice-group tests staying green.
- [x] 4.3 Register preview states for both components in `src/app/ui/previews/`, or
      `pnpm run policy` fails on a component with no preview. Verify by running
      `pnpm run policy`.

## 5. The two layers

- [x] 5.1 Rebuild the ship import layer's template to the canvas: description,
      `ednb-file-drop`, the selection list, the `OR PASTE` divider, the paste box,
      the status line, the disclosure and the footer whose label counts the
      selection. Verify with component tests over the five states named in
      `design.md`.
- [x] 5.2 Add the Equipment Builder's import layer with the same anatomy and its own
      row facts, and reach it from the bench's existing import action. Verify with
      component tests over the same five states.
- [x] 5.3 Route every string through the localisation layer and add them to both
      catalogues, including the refusals, the scan report, the counted button labels
      and the journal note. Verify with `pnpm run policy`, which fails on a
      hard-coded label and on a catalogue mismatch.
- [x] 5.4 Give the scan report and the outcome a live region so a screen reader hears
      them, and label the selection list as a group. Verify with component tests and
      the end-to-end accessibility scan.

## 6. Evidence

- [x] 6.1 Add journal fixtures under `e2e/fixtures/` built from package identities —
      a multi-event ship journal, a multi-event suit journal, two overlapping files,
      a file with no loadout event and an over-bound file. Do not mine the `.dump`
      corpus; its hulls and slot keys are fabricated.
- [x] 6.2 Add the end-to-end journeys for both tools: select several files, choose
      one event and load it, choose several and land in the saved records layer, and
      the two refusals. Run them across all ten Playwright projects.
- [x] 6.3 Add `016-journal-import` to `COVERED_FEATURES` in `e2e/coverage-ledger.ts`
      and register every `016/FR-*` and `016/SC-*` id against a test. Verify with
      `pnpm run policy`, which fails on an unregistered id.
- [x] 6.4 Assert no network request is made during an import, in the offline
      end-to-end project. Verify by running that project.
- [x] 6.5 Measure the 25 MB scan against the 5-second budget in the `.devcontainer/`
      reference environment, as a timing test beside the existing SLEF performance
      test.
- [x] 6.6 Update the `slef-exchange` capability's `## Purpose`, which states that
      import takes exactly one entry. Verify with
      `OPENSPEC_TELEMETRY=0 pnpm exec openspec validate --specs --strict`.
- [x] 6.7 Run `pnpm run check` end to end and keep unit coverage at or above 80%.
