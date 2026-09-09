## Why

On the equipment bench, the grade ladder is drawn beside the item's name. An item that
publishes no grade draws no ladder, so the column is shorter before an item is chosen than
after. A Commander opens an empty weapon mount, reads the list of weapons, presses one — and
the list they were reading moves down, because the ladder has appeared above it. The same
happens on the empty bench: choosing the first suit moves the list of suits the choice was
made from.

The movement is small in both cases. Fitting a weapon into an empty mount moves the list
about seven pixels, because the ladder appears above it. Choosing the first suit moves it
about four, because the empty bench and the chosen item disagree about the seam under the
heading. Either is enough to make a Commander lose their place in the list. On a second press
either is enough to put a different row under the pointer than the one that was there when the
press began.

## What Changes

- The ladder's track is held whether or not the selected item publishes a grade. Choosing an
  item fills the track rather than making it.
- The held track is empty. It draws nothing, is hidden from the accessibility tree and is not
  a control, so nobody is handed a grade control for an item that has no grade.
- The track is held where the ladder stands beside the item's name. Where the column is narrow
  the ladder stands below the list an item is chosen from, so nothing above the list moves and
  there is nothing to hold.
- The empty bench and the item that ends it are drawn to one measure. The seam under the
  heading is the same on both, so the list of suits does not move when a suit is chosen from
  it.
- The grade ladder's own composed height enters the token layer. Composed from the ladder's
  parts rather than declared as a figure, a drift between the ladder's track and the ladder
  becomes a test failure rather than a silent one.

The change declares requirements `019/FR-001` and `019/FR-002`:

- **FR-001** The list an item is chosen from holds its place — across the choice, and between
  one selected item and the next.
- **FR-002** Space held for an absent grade choice states nothing.

Two things this change does are not requirements of its own, because a standing requirement
already carries them:

- **The ladder's track is drawn at every supported width, orientation, text size and zoom.** That
  is `equipment-builder/loadout-assembly`, "Responsive and touch use across the equipment
  bench" (013/FR-023), and `platform/accessible-responsive-operation` (011/FR-011), which
  already cover every screen of the bench.
- **An empty mount offers no grade to press.** That is `equipment-builder/loadout-assembly`,
  "Weapon grades" (013/FR-002a): the grades on offer are the ones the library publishes for a
  fitted weapon, and an empty mount has none. FR-002 adds only what that requirement does not
  carry — that the ladder's track, held where the ladder would stand, is not announced and is
  not a control.

The change adds no string, so no message catalogue changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `equipment-builder/loadout-assembly`: gains two requirements. The first states that the list
  an item is chosen from holds its place — when a weapon is fitted into an empty mount, when
  the first suit is chosen at the empty bench and the bench still offers that list, and
  between one selected item and the next. The second states what the ladder's track may say
  where the item offers no grade, which is nothing.

## Impact

- `src/app/features/equipment/item-view/item-view.html` draws the ladder's track whether or
  not the item publishes a grade. The ladder itself is still drawn only where there is a grade
  to choose.
- `src/app/features/equipment/item-view/item-view.scss` gives the track its held size where
  it stands beside the name, and no size where it stands below the list.
- `src/app/features/equipment/suit-gate/suit-gate.scss` takes the item column's own seam under
  the heading, so the empty bench and the item it becomes measure the same.
- `src/styles/tokens/_semantic.scss` gains the grade ladder's composed height as a token,
  built from the ladder's own parts so that changing the ladder changes the track with
  it.
- `src/app/features/equipment/item-view/item-view.spec.ts` states that the empty track is
  drawn, that it carries no ladder, and that it is hidden from the accessibility tree and out
  of the focus order. `src/app/features/equipment/suit-gate/suit-gate.spec.ts` gains no case: the
  gate's seam is a computed style, which its existing cases re-run unchanged after the
  stylesheet edit.
- `e2e/equipment-builder.spec.ts` measures the journeys the requirements are about: fitting a
  weapon into an empty mount, choosing the first suit at the empty bench, and opening an empty
  mount after a fitted item. None pins a viewport, so each runs at all five layout profiles in
  both engines (011/FR-021).
- `e2e/equipment-accessibility.spec.ts` reads an empty weapon mount for what the held track
  says, which is nothing.
- The change is `019-held-grade-ladder`, so `COVERED_FEATURES` carries that name.
- `e2e/coverage-ledger.ts` gains `019-held-grade-ladder` in `COVERED_FEATURES` and an entry
  registering both requirement ids.
- No loadout data, no address, no catalogue reading and no stored record changes. Nothing new
  is fetched, and no component of the shared design system changes, so the preview manifest
  gains no declaration.
