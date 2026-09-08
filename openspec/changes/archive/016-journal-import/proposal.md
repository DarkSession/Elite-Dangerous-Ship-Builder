## Why

A Commander's own game journal already holds the builds they fly. Today the
application reads one loadout at a time, from a payload the Commander has to find
and paste. Almanac 0.2.11 publishes `equipment/suit-loadout`, so a suit loadout can
be read the same way a ship loadout already is, and both design canvases now draw
journal file upload on their import panels.

## What Changes

- Both import panels take journal files. The Commander selects or drops one or
  more files, and the application scans them in the browser. Nothing is sent
  anywhere.
- A source holding several loadout events lists them. The Commander selects one or
  more from that list.
- One selection loads as it does today: the build opens in the outfitting
  workspace, the loadout opens on the bench.
- Several selections are saved instead of opened. Every selected event becomes a
  saved record, nothing is loaded, and the saved records layer opens so the
  Commander chooses what to open.
- The Equipment Builder gains an import route. Until now a link was the only way a
  loadout came in.
- A ship build imported this way is a **named** record, named by the build's ship
  name, its ident where there is no ship name, or its hull name where there is
  neither. A suit loadout is named by the event's loadout name, or by the suit's
  name where the event states none.
- Paste keeps its place and its limits. The 64 KiB paste bound and the one-entry
  rule for a pasted payload do not move.

## Capabilities

### New Capabilities

- `platform/journal-files`: reading Elite Dangerous journal files a Commander
  selects — file selection and drop, accepted types, the size bound, framing the
  log's lines, listing the loadout events found, and reporting what was scanned.
  Both tools read journals the same way, so the behaviour is stated once.

### Modified Capabilities

- `ship-builder/slef-exchange`: import accepts a journal source holding several
  `Loadout` events, the Commander selects one or more, and several selections are
  saved as records rather than loaded.
- `ship-builder/build-lifecycle`: a journal import creates named records, and names
  one from the hull where the build carries neither ship name nor ident. This is
  the one route on which the application supplies a record name.
- `equipment-builder/loadout-persistence`: a journal `SuitLoadout`,
  `SwitchSuitLoadout` or `CreateSuitLoadout` event opens on the bench or saves as a
  loadout, and a batch import keeps both copies on a name clash rather than asking
  once per clash.

## Impact

- `src/app/features/slef/import-build-layer/` gains the drop zone, the scanned-file
  line and the selection list drawn on canvases 1c, 1d and the compact sheet.
- `src/app/features/equipment/` gains an import layer it does not have.
- `src/app/ui/components/` gains the file drop control and the selection list the
  two layers share, each with preview states, because the policy checker requires a
  preview for every exported component.
- `@elite-dangerous-almanac/core` 0.2.11 is already pinned. `ships/slef`
  (`inspectSlef`) reads a ship entry; `equipment/suit-loadout` (`parseSuitLoadout`)
  reads a suit event. The package publishes no journal-file reader, so the
  application frames the log's lines and reads no payload field.
- `e2e/coverage-ledger.ts` gains `016-journal-import` in `COVERED_FEATURES` and an
  entry for every requirement id this change declares.
- Both message catalogues gain the strings the two layers own.
