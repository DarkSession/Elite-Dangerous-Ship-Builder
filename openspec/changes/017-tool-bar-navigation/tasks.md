## 1. The bar reaches the entry point

- [x] 1.1 Add the mark's destination to both message catalogues — the name a reader
      hears for the way to the entry point — and verify with `pnpm run policy`, which
      fails on a key missing from either catalogue.
- [x] 1.2 Make `AppNavigation.home()` answer with the entry point from every screen,
      the entry point included. Verify with unit tests over the entry point, the ship
      list, a hull, the workspace and the bench, including a fragment-carrying
      address.
- [x] 1.3 Draw the mark as a link on every screen in `app-frame.html`, keeping the
      insignia at the size its token declares and the press box at the 44px baseline.
      Verify with component tests at desktop, tablet and mobile profiles.
- [x] 1.4 Return from `App.navigateFromShell` without navigating when the entry's
      address is the address already open, after the modified-click guard. Verify
      with unit tests asserting no router call and no history entry for a plain
      click, and an untouched event for a modified one.

## 2. The bar re-enters the open tool

- [x] 2.1 Add the re-entry to `ToolRecord` — the tool's own address by default, or a
      named action — and carry it on the entry `tools()` returns. Verify with unit
      tests asserting the ship tool declares none and the equipment tool declares its
      action.
- [x] 2.2 Draw every tab as a link in `app-frame.html`, with `aria-current="true"` on
      the open tool's tab and the amber wash, underline and deck height unchanged.
      Verify with component tests over both states and by the existing frame tests
      staying green.
- [x] 2.3 Dispatch a tab that declares an action through the shell instead of
      navigating, and navigate the rest. Verify with unit tests over the ship tool
      from a hull, from the workspace and from the ship list, and over the equipment
      tool from the bench and from elsewhere.
- [x] 2.4 Update `e2e/design-reference.spec.ts`, which reads the mark as decoration on
      the shipyard and the current tool as a word. Verify by running the design
      reference project.

## 3. One autosave, two tools

- [x] 3.1 Introduce the port `AutosaveService` and `TabOwnershipCoordinator` read —
      revision, fingerprint, dirty, record id, named source, persistence and the
      record body — and implement it for `ActiveBuildStore` with no behaviour change.
      Verify with the existing autosave, ownership and workspace unit tests staying
      green.
- [x] 3.2 Give `LocalRecordRepository.findUnnamedMatching` the tool it is matching, so
      a loadout never takes over a build's record. Verify with unit tests over a store
      holding an unnamed record of each tool with the same fingerprint.
- [x] 3.3 Move `TabDescriptorRepository` to version 2 — one working record id per tool
      — reading a version 1 descriptor as the ship's. Verify with unit tests over a
      version 1 value, a version 2 value, an unknown version and a malformed one.
- [x] 3.4 Let `TabOwnershipCoordinator` claim, announce and fork one identity per tool,
      and keep every live page's claims in the retention sweep's protected set. Verify
      with unit tests over a duplicated tab claiming one tool's identity and leaving
      the other's alone.

## 4. The bench keeps its loadout

- [x] 4.1 Add to `LoadoutStore` what autosave reads: a fingerprint over
      `toStoredLoadout`, a baseline, dirty, the record id it writes to, the named
      source it forked from and a persistence state. Verify with unit tests asserting
      a fresh loadout is dirty, an opened record is not, and one change makes it so.
- [x] 4.2 Add the equipment adapter for the autosave port in
      `src/app/application/equipment/`, writing an `EquipmentRecord` whose
      `suitFamily` is the loadout's. Verify with unit tests over a first write, a
      take-over of an identical unnamed record, a refused write to a named record and
      a full store.
- [x] 4.3 Start ownership, restoration, ingress, publication and autosave on the bench
      in the workspace's order, and stop them all when the bench is destroyed. Verify
      with page unit tests asserting a restored loadout, an address that outranks it,
      a refused link that leaves the restored loadout alone, and a flush on the way
      out.
- [x] 4.4 Pause autosave and keep the loadout usable when another page deletes the
      record this bench writes to, resuming on an explicit action. Verify with a unit
      test over the deletion broadcast.
- [x] 4.5 Give `ednb-persistence-status` its state and paused flag as inputs, report
      the pressed action, and draw it on the bench where the workspace draws it. Verify
      with component tests over all six states in both screens.
- [x] 4.6 Confirm `pnpm run policy` still passes `equipment-ownership.mjs` with the new
      files under `src/app/application/equipment/`, which may import no package
      subpath the capability does not already own.

## 5. Starting an empty bench

- [x] 5.1 Add the application-layer action that empties the bench: clear the loadout,
      the name, the record it belongs to and the undo tape, and leave the record it
      was autosaved to where it is. Verify with unit tests over a loadout with unsaved
      changes, a loadout opened from a named record and an already-empty bench.
- [x] 5.2 Clear the loadout from the address when the bench empties, replacing the
      fragment rather than adding a history entry. Verify with a unit test over the
      publisher with no loadout on the bench.
- [x] 5.3 Wire the equipment tool's re-entry action to it in `App.selectAction`, so the
      shell reaches the bench through the application layer and imports no bench
      component. Verify with a unit test and by `pnpm run typecheck`.

## 6. Evidence

- [x] 6.1 Add the end-to-end journey for the mark: reach the entry point from a hull,
      the workspace and the bench, and press it on the entry point with nothing
      happening. Run it across all ten Playwright projects.
- [x] 6.2 Add the end-to-end journey for the tabs: the ship tool's tab from a hull and
      from the workspace opens the ship list, on the ship list it changes nothing, and
      the equipment tool's tab on the bench leaves an empty bench with the suit gate
      standing.
- [x] 6.3 Add the end-to-end journey for the bench's autosave: assemble a loadout,
      reload, and find it restored; then start an empty bench and open the loadout
      again from the saved records layer.
- [x] 6.4 Add `017-tool-bar-navigation` to `COVERED_FEATURES` in
      `e2e/coverage-ledger.ts` and register every `017/FR-*` and `017/SC-*` id against
      a test. Verify with `pnpm run policy`, which fails on an unregistered id.
- [x] 6.5 Scan the bar and the bench with axe at all five layout profiles in both
      engines, with the open tool drawn as a control, and assert zero violations of
      the in-scope criteria.
- [x] 6.6 Record a screen-reader pass over the bar in `e2e/manual/results/`, covering
      the mark's name, the current tool's state and a tab that answers with nothing.
- [ ] 6.7 Run `pnpm run check` end to end and keep unit coverage at or above 80%.
