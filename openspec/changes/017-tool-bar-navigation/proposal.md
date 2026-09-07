## Why

The bar's leading mark opens the shipyard, so the entry point that offers the two tools is
reachable only by editing the address. The tool a Commander is in is a word rather than a
control, so leaving a build for the ship list, or clearing the bench for a second loadout,
takes a route through another screen. Both are one press on the bar a Commander already
reads.

Clearing the bench costs work today, because the open loadout lives in memory and in the
address and nowhere else. The ship tool answered the same question five features ago: it
autosaves the active build into an unnamed record, which is what lets it replace a build
without asking. The bench gets the same record, so a new loadout costs nothing either.

## What Changes

- The mark on the leading edge of the bar opens the entry point, from every screen. It is
  a link everywhere, including the entry point itself, where activating it does nothing.
- The tool bar offers the tool a Commander is in as well as naming it. The tab keeps
  `aria-current`, so which tool is open is still stated rather than drawn.
- Activating the ship tool's tab opens the ship list. From a hull and from the outfitting
  workspace it leaves the screen; on the ship list itself it does nothing.
- Activating the equipment tool's tab starts an empty bench, ready for a suit. The loadout
  that was on it stays as the record it is autosaved to.
- The bench autosaves the open loadout into an unnamed record of its own, restores it after
  a reload, and reports a store that refuses a write. The rules are the ones the record
  store already carries: one working record per tool per page, a named record never written
  to, and the same seven-day expiry.
- **BREAKING** for the tool bar's shape: the current tool is a link rather than a word, and
  the mark leads to the entry point rather than to the shipyard. Every address answers as it
  did.

## Capabilities

### Modified Capabilities

- `platform/tool-navigation`: the shell carries one way to the entry point on every screen;
  the tool bar offers the open tool as well as identifying it, and states what activating it
  does.
- `equipment-builder/loadout-assembly`: starting an empty bench, and what happens to the
  loadout that was on it.
- `equipment-builder/loadout-persistence`: the open loadout is autosaved into an unnamed
  record, restored after a reload, and its persistence state is stated.
- `ship-builder/build-lifecycle`: a page's autosave target is one unnamed record per tool
  rather than one for the page, because two benches are now open at once.

## Impact

- `src/app/features/shared/app-navigation.ts` gains the entry point as the mark's
  destination and carries what re-entering a tool does.
- `src/app/ui/components/app-frame/` draws the current tool as a link carrying
  `aria-current`, and the mark as a link on every screen.
- `src/app/app.ts` dispatches a tool tab that re-enters its own tool instead of navigating.
- `src/app/application/build-library/autosave.service.ts` and
  `tab-ownership.coordinator.ts` serve both tools rather than the ship tool alone. The ship
  tool's records change in one way as a result: a record autosave was handed keeps the
  instant it says it was created, instead of being stamped with the moment of the write
  that followed a reload (001/FR-013).
  `src/app/platform/storage/tab-descriptor.repository.ts` holds one working record per tool.
  `src/app/platform/storage/local-record.repository.ts` matches an unnamed record by tool.
- `src/app/application/equipment/loadout.store.ts` gains the fields autosave reads: a
  fingerprint, a baseline, the record it writes to and a persistence state.
- `src/app/features/build-workspace/persistence-status.ts` reads whichever tool is open.
- `e2e/coverage-ledger.ts` gains `017-tool-bar-navigation` in `COVERED_FEATURES` and an
  entry for every requirement id this change declares. `e2e/design-reference.spec.ts` reads
  the mark as a control on every screen.
- Both message catalogues gain the mark's name at the entry point and the bench's
  persistence strings.
