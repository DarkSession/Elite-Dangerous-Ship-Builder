## Context

See `proposal.md` — Why. This change introduces no screen. It changes the measure of two
regions that are already drawn, and adds one token.

The bench's item column composes, from top to bottom on a wide column: a header row carrying
the item's identity and the grade ladder, then the list the item is chosen from, then the
attribute grid, the modification slots and the slot picker. The header is a wrapping row with
its items aligned to their shared bottom edge, so its height is the taller of the two things
in it.

The two heights are close and the ladder is the taller. The identity is a 26px name at a
1.05 leading over a 11px line at 1.6, about 47px with the 2px between them. The ladder is a
9px label at 1.3 over a 4px gap over a 38px cell row, about 54px. So a header with a ladder
in it is about 7px taller than one without, and everything below the header carries that
difference. The item column draws the ladder only where the item publishes a grade
(`item-view.html`), and an empty weapon mount publishes none (`loadout.presenter.ts`,
`#weaponItem`), which is where the 7px comes and goes.

The empty bench is a second case of the same thing. The suit gate stands in the column the
item will take and already previews the ladder, so its header is the same height. What
differs is the seam under it: the gate ends its header with `--ednb-space-lg` and the item
column ends its own with `--ednb-space-2xl`. That is the remaining 4px.

Where the column is narrow the header is not a row at all: it takes `display: contents` and
the ladder becomes a sibling of the list, ordered below it. Nothing above the list appears
with the ladder there, so the narrow column already satisfies the requirement.

## Goals / Non-Goals

**Goals:**

- The list a Commander chooses from keeps its place across the choice, in both journeys the
  specification names.
- The held space measures the ladder it holds, and cannot drift from it when the ladder
  changes.
- The held space is empty and silent: no cells, no words, nothing announced, nothing to
  press.

**Non-Goals:**

- No preview of the ladder a chosen item will bring. The suit gate draws one because it is
  answering "what will a suit give me"; an open weapon mount is not asking that.
- No held space where the ladder does not stand above the list. The narrow column has no
  movement to fix, and holding space there would cost a block of the column for nothing.
- No change to the grade control, to what any item publishes, or to any reading taken from
  the equipment library.

## Screens

No screen is introduced. Two regions already recorded change measure only:

- **The item column** (`openspec/changes/archive/013-equipment-builder/design/screen-inventory.md`,
  artboards `1a` and `1b`). It composes the game-text heading,
  the grade selector, the choice list, the metric group, the modification slots and the slot
  picker. It gains one state it did not distinguish before: _selected item, no grade
  published_ now draws the ladder's track empty instead of drawing no track. It satisfies
  `019/FR-001` and `019/FR-002`.
- **The suit gate** (the same inventory, artboards `2a` and `2b`). Unchanged in what it composes. Its
  header seam becomes the item column's, which is what makes the two measure the same. It
  satisfies `019/FR-001`.

## Decisions

**The track is held by an element in the flow, not by a minimum height on the header.**
A minimum height on the header would hold the space at ordinary text sizes and lose it at
large ones: the ladder's width is declared in `rem` and the column's breakpoint is a
container query in pixels, so at 200% text the row wraps, the ladder takes a line of its own,
and the header grows past any minimum. An element occupying the ladder's own track wraps when
the ladder would wrap and stays where the ladder would stay, so the two states measure the
same at every text size. The item column's template therefore always draws the track and
draws the control inside it only when there is a grade to choose.

**The held height is a token composed from the control's own parts.**
`--ednb-layout-grade-ladder-block` is the label's line, the stack gap and the step cell added
together, from the tokens the control itself uses. Declaring a flat figure would be a second
statement of the ladder's height that nothing keeps true; composed, a change to the step cell
moves the held space with it. The token layer already carries one composed measure of this
kind (`--ednb-layout-bar-height`), and the comment beside it is the pattern to follow. The
parts are all `rem`-based, so the held space scales with text size as the ladder does.

**The empty track carries nothing, rather than a flat preview of the ladder.**
A preview would have to draw a cell count, and an empty mount publishes no grades to count.
Drawing five would be this application stating something the equipment library did not
(constitution IV). The operator asked for empty space, and empty space needs no figure from
anywhere.

**The gate takes the item column's seam, not the other way round.**
The item column is the standing state and the gate stands in its place for as long as the
bench is empty. Moving the item column to the gate's 12px seam would move the seam on every
item a Commander ever opens to match a region they see once. The divergence from artboard `2a` is
4px of padding and is recorded here.

**The narrow column holds nothing.**
Stated as a container query on the same seam the column already uses to decide whether the
header is a row (`container-medium-up(item)`), so one condition decides both. The two cannot
disagree about which arrangement is being drawn.

**The held track is `aria-hidden` and `inert`.**
The same two attributes the gate puts on its own previews. `aria-hidden` keeps it out of the
accessibility tree and `inert` keeps it out of the focus order; the track holds no control, so
both are belt and braces, and both survive someone later putting something in it.

## Risks / Trade-offs

- **The composed token drifts from the control.** → The end-to-end journeys measure the list's
  position across the choice rather than the token's value, so a drift fails a test rather
  than shipping as a smaller version of the same defect.
- **A wide column at a very large text size wraps the header row.** → The track wraps with it,
  because it is the same box in the same row. The empty state then holds a wrapped line where
  the filled state draws one, which is the behaviour that keeps the list still.
- **Empty space beside a mount name reads as something missing.** → It does, and the mount's
  own subtitle already says the mount is empty. The operator chose empty space over a preview
  ladder for this state.
- **The gate's 4px seam is a recorded divergence from artboard `2a`.** → Recorded here, and the
  reason is that the gate and the item column must agree with each other before either agrees
  with its own artboard.
