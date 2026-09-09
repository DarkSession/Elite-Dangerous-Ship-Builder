## Context

See `proposal.md` — Why. This change introduces no screen. It changes the measure of two
regions that are already drawn, and adds one token.

**Two terms, used throughout this change.** The **grade ladder** is the control that draws the
grade choice, which is the name the accepted record gives it
(`openspec/changes/archive/013-equipment-builder/design/screen-inventory.md`, the Item view
row). The **ladder's track** is the space it occupies in the item column's header.

The bench's item column composes, from top to bottom on a wide column: a header row carrying
the item's identity and the grade ladder, then the list the item is chosen from, then the
attribute grid, the modification slots and the slot picker. The header is a wrapping row with
its items aligned to their shared bottom edge, so its height is the taller of the two things
in it.

The two heights are close and the ladder is the taller. The identity is the item name at
`--ednb-text-size-heading-item` over its subtitle at `--ednb-text-size-compact`, with
`--ednb-space-3xs` between them; the ladder is its label at `--ednb-text-size-micro` and
`--ednb-text-leading-control` over `--ednb-space-stack-tight` over a cell row at
`--ednb-layout-grade-step`. At the values those tokens hold, the identity reads about 47px and
the ladder about 54px. So a header with a ladder in it is about 7px taller than one without,
and everything below the header carries the difference. The item column draws the ladder only
where the item publishes a grade
(`src/app/features/equipment/item-view/item-view.html`), and the library publishes none for an
empty weapon mount (`src/app/application/equipment/loadout.presenter.ts`, `#weaponItem`),
which is where the 7px comes and goes.

The empty bench is a second case of the same thing, and a wide one. Wide, the suit gate stands
in the column the item will take and previews the ladder, so its header is the same height;
what differs is the seam under it, `--ednb-space-lg` against the item column's
`--ednb-space-2xl`. That is 4px. Narrow, the gate draws no preview and the bench answers the
choice with the loadout in place of the gate, so nothing is compared and nothing moves
(`openspec/changes/archive/013-equipment-builder/design/reference-review.md`, artboard `2b`).

Where the column is narrow the item column's header is not a row at all: it takes
`display: contents` and the ladder becomes a sibling of the list, ordered below it. Nothing
above the list appears with the ladder there, so the narrow column already holds the list
still.

## Goals / Non-Goals

**Goals:**

- The list a Commander chooses from keeps its place across the choice, in both journeys the
  specification names, and between one selected item and the next.
- The ladder's track measures the ladder it holds, and cannot drift from it unnoticed.
- The held track is empty and silent: no cells, no words, nothing announced, nothing to press.

**Non-Goals:**

- No preview of the ladder a chosen item will bring. The suit gate draws one because it is
  answering what a suit will give; an open weapon mount is not asking that.
- No held track where the ladder does not stand beside the identity. The narrow column has no
  movement to fix, and holding space there would cost a block of the column for nothing.
- No change to the grade ladder itself, to what any item publishes, or to any reading taken
  from the equipment library.

## Screens

No screen is introduced. Two regions already recorded change measure only:

- **The item column** — artboards `1a` and `1b`
  (`openspec/changes/archive/013-equipment-builder/design/equipment-bench.md`), with its
  surface and its states in
  `openspec/changes/archive/013-equipment-builder/design/screen-inventory.md`. It composes the
  game-text heading, the grade ladder, the choice list, the metric group, the modification
  slots and the slot picker. The item column draws the ladder's track whether or not the item
  publishes a grade. It satisfies `019/FR-001` and `019/FR-002`.
- **The suit gate** — artboards `2a` and `2b`
  (`openspec/changes/archive/013-equipment-builder/design/reference-review.md`, which is where
  the gate is recorded, together with
  `openspec/changes/archive/013-equipment-builder/design/screen-reader-record.md`; the screen
  inventory carries no row for it). Unchanged in what it composes. Its header seam becomes the
  item column's, which is what makes the two measure the same wide. It satisfies `019/FR-001`.

## Decisions

**The track is held by an element in the flow, not by a minimum height on the header.**
A minimum height on the header would hold the space at ordinary text sizes and lose it at
large ones: the ladder's width is declared in `rem` and the column's breakpoint is a container
query in pixels, so at 200% text the row wraps, the ladder takes a line of its own, and the
header grows past any minimum. An element occupying the ladder's own track wraps when the
ladder would wrap and stays where the ladder would stay, so the two states measure the same at
every text size. The item column's template therefore always draws the track and draws the
ladder inside it only when there is a grade to choose.

**The held height is a token composed from the ladder's own parts.**
`--ednb-layout-grade-ladder-block` is the label's line, the stack gap and the step cell added
together, from the tokens the ladder itself uses. Declaring a flat figure would be a second
statement of the ladder's height that nothing keeps true; composed, a change to the step cell
moves the held track with it. The token layer already carries one composed measure of this
kind (`--ednb-layout-bar-height`), and the comment beside it is the pattern to follow. The
parts are all `rem`-based, so the held track scales with text size as the ladder does. Nothing
mechanical checks the figure, so the end-to-end journeys are what hold it true.

**The empty track carries nothing, rather than a flat preview of the ladder.**
A preview would have to draw a cell count, and the library publishes no grades for an empty
mount to count. Drawing five would be this application stating something the equipment library
did not (constitution IV).

**The gate takes the item column's seam, not the other way round.**
The item column is the standing state and the gate stands in its place for as long as the
bench is empty. Moving the item column to the gate's 12px seam would move the seam on every
item a Commander ever opens to match a region they see once. The divergence from artboard `2a`
is 4px of padding and is recorded here.

**The gate's seam is stated once, for both arrangements.**
The gate's header is taken out of flow where the column is narrow, so the seam under it is
drawn wide and nowhere else. One unconditional declaration is therefore the whole of it, and a
container query around it would state a condition the header already answers.

**The narrow column holds nothing.**
Stated as a container query, the same one the column already uses to decide whether the header
is a row (`container-medium-up(item)`), so one condition decides both. The two cannot disagree
about which arrangement is being drawn.

**The bench's composition is not the oracle.**
The held track is scoped to the item column's own container query, so what verifies the
scoping reads the item column. The bench's `data-composition` is a second threshold and a
different one: it answers `wide` only where the whole bench clears its three declared minimums
(`src/app/ui/equipment/bench-composition.ts`), while the column's query answers at
`$container-medium-min`. A compact bench draws the item view as a full-width drill-in, which
clears the column's seam while the bench's answer is `compact`, so the two cross. Keying the
check to the bench would fail a correct build there and pass a stylesheet scoped to the wrong
condition. The record rules on exactly this: behaviour keyed to a composition is stated at the
same step the stylesheets use, never at a second threshold of its own
(`openspec/changes/archive/011-interface-foundations/design/responsive-composition.md`).

**Every journey runs at all five layout profiles.**
No journey pins a viewport. `platform/accessible-responsive-operation`, "Journeys across the
five layout profiles in both engines" (011/FR-021), requires it, and the requirement these
journeys verify is stated at every width. The list holds its place at each of them, and the
arrangement around it differs, so each journey asserts the list and not the arrangement.

**The held track is `aria-hidden` and `inert`.**
The same two attributes the gate puts on its own previews. `aria-hidden` keeps it out of the
accessibility tree and `inert` keeps it out of the focus order. The track holds no control, so
either attribute alone would do; both keep it out if something is later put in it.

## Risks / Trade-offs

- **The composed token drifts from the ladder.** → The end-to-end journeys measure the list's
  position across the choice rather than the token's value, so a drift fails a test rather
  than shipping as a smaller version of the same defect.
- **A wide column at a very large text size wraps the header row.** → The track wraps with it,
  because it is the same box in the same row. The empty state then holds a wrapped line where
  the filled state draws one, which is the behaviour that keeps the list still.
- **Empty space beside a mount name reads as something missing.** → The mount's own subtitle
  says the mount is empty, and the library publishes no grade for the track to state.
- **The gate's 4px seam is a recorded divergence from artboard `2a`.** → Recorded here, and the
  reason is that the gate and the item column must agree with each other before either agrees
  with its own artboard.
