## Why

On the equipment bench, the grade choice is drawn beside the item's name. An item that
publishes no grade draws no grade choice, so the column is shorter before an item is chosen
than after. A Commander opens an empty weapon mount, reads the list of weapons, presses one —
and the list they were reading moves down, because the grade choice has appeared above it.
The same happens on the empty bench: choosing the first suit moves the list of suits the
choice was made from.

The movement is small, about seven pixels for the grade choice and four more where the empty
bench and the chosen item disagree about the seam under the heading. It is enough to make a
Commander lose their place in the list, and on a second press it is enough to put a different
row under the pointer than the one that was there when the press began.

## What Changes

- The space the grade choice takes is held whether or not the selected item publishes a
  grade. Choosing an item for an empty mount fills that space rather than making it.
- The held space is empty. It draws nothing, states nothing, is not announced and cannot be
  reached, so nobody is handed a grade control for an item that has no grade.
- The space is held where the grade choice stands beside the item's name. Where the column is
  narrow the grade choice stands below the list an item is chosen from, so nothing above it
  moves and there is nothing to hold.
- The empty bench and the item that ends it are drawn to one measure. The seam under the
  heading is the same on both, so the list of suits does not move when a suit is chosen from
  it.
- The grade control's own composed height enters the token layer, so the held space and the
  control it holds cannot drift apart.

The change declares requirements `019/FR-001` and `019/FR-002`:

- **FR-001** Choosing an item does not move what already stood in the item's statement.
- **FR-002** Space held for a grade choice an item does not offer states nothing.

Two things this change does are not requirements of its own, because a standing requirement
already carries them:

- **The held space is drawn at every supported width, orientation, text size and zoom.** That
  is `equipment-builder/loadout-assembly`, "Responsive and touch use across the equipment
  bench" (013/FR-023), which already covers every screen of the bench.
- **The held space adds no string.** It carries no words at all, so
  `platform/localisation` has nothing to hold and no catalogue changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `equipment-builder/loadout-assembly`: gains two requirements. The first states that
  choosing an item does not move the statement that already stood — for a weapon fitted into
  an empty mount, and for the first suit chosen at the empty bench. The second states what
  the space held for an absent grade choice may say, which is nothing.

## Impact

- `src/app/features/equipment/item-view/item-view.html` draws the grade choice's track
  whether or not the item publishes a grade. The control itself is still drawn only where
  there is a grade to choose.
- `src/app/features/equipment/item-view/item-view.scss` gives that track its held size where
  the track stands beside the name, and no size where it stands below the list.
- `src/app/features/equipment/suit-gate/suit-gate.scss` takes the item column's own seam
  under the heading, so the empty bench and the item it becomes measure the same.
- `src/styles/tokens/_semantic.scss` gains the grade control's composed height as a token,
  built from the control's own parts so that changing the control changes the held space with
  it.
- `src/app/features/equipment/item-view/item-view.spec.ts` and
  `src/app/features/equipment/suit-gate/suit-gate.spec.ts` state that the empty track is
  drawn, that it carries no control, and that it is out of the accessibility tree and the
  focus order.
- `e2e/equipment-builder.spec.ts` measures the journeys the requirement is about: fitting a
  weapon into an empty mount, and choosing the first suit at the empty bench.
- `e2e/coverage-ledger.ts` gains `019-reserved-grade-ladder` in `COVERED_FEATURES` and an
  entry registering both requirement ids.
- No loadout data, no address, no catalogue reading and no stored record changes. Nothing new
  is fetched, and no component of the shared design system changes, so the preview manifest
  gains no declaration.
