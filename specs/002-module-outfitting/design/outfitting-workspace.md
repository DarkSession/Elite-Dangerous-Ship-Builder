# Outfitting Workspace Surface

**Route**: `/build`  
**Requirements**: FR-001–FR-003, FR-006–FR-011, FR-015–FR-019

## Purpose

Inspect every package slot and its current module, select an editable slot, control module power, see
normalization/refusal state, and undo/redo Commander decisions. It extends feature 001's active-build
workspace and never creates or owns a second build.

## Wide composition

- Existing workspace identity/status/action header from feature 001, with feature 002's ship name and
  ident fields (FR-019) composed beside the build-identity display.
- Direct `UndoRedoActions` with programmatic disabled state and optional next-action summary.
- Persistent accepted-normalization/edit-refusal notices below the heading. Pre-activation ingress
  refusal belongs to the owning open/import flow and is not a workspace state for the rejected build.
- A fluid three-region layout inspired by canvas 1c:
  - grouped semantic slot ledger in package outfitting order;
  - selected-slot facts and outlet for replacement/engineering;
  - composition outlet for package validation and later calculation features.
- The replacement and engineering panels are **present, not opened**. Canvas 1c draws no control that
  reveals either: whichever row is marked in the ledger has its `FITTING · HARDPOINT 1` panel and its
  `ENGINEERING` panel below the anatomy, and a Commander changes what they are looking at by marking
  a different row. `Change module` and `Engineer` are canvas 1d's controls and appear only in the
  compact composition (reference review, "Opening controls for the two surfaces").
- Removal is drawn once, in the fitting panel's own header beside the search, exactly as canvas 1c
  draws `REMOVE MODULE` — and the mount's name is on that same line, not on a bench header above it
  (wave 5). Where no fitting panel is drawn at all — a mount the Almanac takes nothing else in — the
  bench keeps the name, so the region is never nameless.
- No screen is drawn for "nothing selected": an unset selection is the first mount, which is where
  both canvases open.
- Optional anatomy composition outlet owned by feature 010; the slot ledger remains complete without
  it.

Slot groups follow package kinds/layout and retain exact keys. Each row/card contains separate native
controls: a named select/edit button, and the power chip both canvases draw at the end of the row — a
switch and a one-based priority select, rendered as the chip's dot and its number. The number is the
whole visible label; neither canvas writes the word _group_. The row itself is not a clickable
container around nested controls.

The power chip is drawn **only on a module that draws power**. Armour and the power plant publish no
`powerDraw`, and a switch and a priority group on a module that has neither is a control over nothing
(wave 4). Where the package publishes no priority for a module, the chip holds a place for it with a
dash rather than spelling `Unavailable` across a row the canvas draws one digit in; the absence is
said in full in the control's own accessible name.

The engineered mark keeps its space whether or not a row has one, so the rows below it do not shift
as engineering is applied (wave 4).

**Ruled 2026-08-22 (wave 8).** The rail and the bench **abut**. Canvas 1c's `392px 1fr 306px` has no
gap in it, and a column gap put a stripe of the page ground down the middle of a screen the canvas
draws as one continuous surface. The seam between them is a single hairline, drawn once, by the rail
— the bench drops its own leading edge so the two do not stack into a two-pixel rule. The row gap
stays: it is what stands the notices above off the regions below them.

**Ruled 2026-08-25 — the two seams run the whole way down.** Canvas 1c draws the workspace as one
grid row, `392px 1fr 306px` over a `min-height: 880px`, whose three columns stretch to it: the
ledger's `border-right` and the status rail's `border-left` reach the foot of the screen whatever
either column holds. The build did not. The status rail was sized by its content, so on a build with
little to report its seam stopped less than half the way down while the ledger's ran on; and both
columns subtracted `2 x --edsb-space-region` from the viewport, which was the page inset the
application frame carried until wave 9 removed it, leaving the pair 36px short of the foot with
nothing to clear. Both are now the full height the bar leaves, and the status rail takes a definite
height rather than a cap so its seam is drawn whether or not the rail has that much to say
(Commander request 2026-08-25).

**Ruled 2026-08-26 — and they run the whole way down on a short viewport too.** The 2026-08-25 rule
held only because every column carried the same definite height; the grid itself was aligned to
`start`, which had nothing to bite on while that was true. It bit where the bounded columns are
released — a short viewport, where the bar releases with them and the page scrolls instead. Each
column then takes its own content height, and the ledger stopped wherever its last row ended, taking
its ground and its seam with it while the bench beside it ran on down a page twice as long. The grid
stretches its columns to the row, which is what canvas 1c's one grid row does and what the definite
heights were already imitating (reported 2026-08-26).

**The bench's share, adjusted 2026-08-26: 1.25 to 1.1.** The manifest was taking 56% of the bench to
the editor's 44%. An engineering pass — a grade, an experimental effect and the attribute comparison
under them — is the taller of the two readings at the moment a Commander is making it, and the
editor was the pane being scrolled. Not an even split: the canvas does draw the manifest the taller
of the two, and this only narrows the margin (Commander request 2026-08-26).

**Ruled 2026-08-26 — a detail panel is not bounded by the column; the page carries it.** The middle
track is a column of a fixed height so the bench's manifest scrolls inside itself rather than growing
the page to two hundred rows, and the plates fit that column: they are drawn at the hull's own
proportions and ask for exactly the height they need. The four dashboard modes are not. Their height
is whatever the build has to say, and `POWER AND THERMALS` exceeds the column on any screen shorter
than 900px — at 1560 x 800 it was given 224px for 1053px of content. Wave 14 had it scroll that
inside itself, which put a second scrollbar in a column that already had one, with the distributor's
own pip blocks below the panel's fold and the page underneath refusing to move.

So the column releases while a dashboard is open — `position: static`, its own content height, the
bench released with it — and the page scrolls instead, exactly as a short viewport releases it. The
plates keep the bound: they are the arrangement it was written for and they fit it. Which of the two
is open is read off `edsb-hull-anatomy`'s own `anatomy--dashboard` host class rather than a flag
beside it, so a mode that lands next is bounded or released by what it draws rather than by a list
somebody remembered to add it to (Commander request 2026-08-26).

**Ruled 2026-08-26 — the status rail's last block may have the rest of the column.** The rail is a
column of a fixed height whose blocks are as tall as they are, and feature 009's material list closes
it. Bounded at five rows by that feature's ruling G, the list stopped a third of the way down and
left the foot of the track empty beside a scrollbar that was there to reach rows the column had room
to show. The rail is now a stack: what sits above the list is fixed, the list takes what is left and
scrolls only what will not fit, and it never falls below the measure ruling G set. Only where the
rail is the canvas's third track — below that step it is a band under the bench with the page's own
height to grow into, and a list that filled it there would run the whole shopping list down the
screen (Commander request 2026-08-26; `specs/009-cost-and-materials/spec.md`, FR-007a).

**What that height is, is measured, not declared.** `--edsb-layout-bar-height` is one row of controls
at the target baseline — what the bar comes to on every screen that draws a plain title. This screen
does not: FR-019's identity block is two 24px targets and a gap, so the workspace's bar is 74px, and
at any width where the bar wraps it is taller again. Subtracting the declared figure left the columns
past the foot of the screen by the difference, and freezing the ledger at it put the category strip
_behind_ the bar at tablet width — 62px of it, at 834px, once the page was scrolled. The frame
already measures its own bar to decide whether to release it; it now republishes that reading as the
token on its own host, so every region that clears the bar clears the bar that is there
(`app-frame.ts`, `sticky-banner.ts`; token layer, `edsb-app-frame`). This is feature 011's shell, and
the reading is shared: the change is recorded here because this screen is where the declared figure
stopped being true.

**Ruled 2026-08-22 (wave 9).** The **category strip** is drawn the way canvas 1c draws it and no
other way: `display: flex; gap: 1px; background: var(--amber-a14); border-bottom: 1px solid
var(--amber-a18)`. The amber ground showing through the one-pixel gaps is the strip's only rule —
there is **no box around it**, no line over the labels and none down its leading edge. Each segment
is `padding: 11px 5px`, centred, on one line, in condensed 10px at 0.1em over the panel ground; the
count inside it takes the segment's own face and size at half the weight rather than a mono face of
its own. The open segment takes the **page** ground, the bold weight, the amber ink and the canvas's
own `inset 0 -2px 0` amber underline — the underline is what marks it, not a wash behind the label.
One departure: each segment holds the 44 CSS-px target floor. The canvas lets the segments share the
strip by their content, which put the shortest label — `ALL 39` — at 42 px on a 320 px screen. The
floor is a rule about the product rather than a measurement off the drawing, and five 44 px segments
still share one line at every width the strip is drawn at.

**Ruled 2026-08-22 (wave 9).** The **size box is drawn the same on every row** — canvas 1c's
`background: var(--amber-a1); font: 700 11px/1 mono; color: var(--ink-7)`, unchanged by whether the
row is the marked one. Canvas 1c marks a row with a leading amber edge, a washed ground and an amber
module name and leaves the size box alone; a class number that changed colour with the row read as a
second state the mount had entered.

**The node badge is the exception, and takes the selected treatment the design draws for it.** The
canvas's own drawing of "this hardpoint number is the selected one" is the anatomy plate's selected
node: `background: var(--amber); color: var(--bg); font: 700 11px/1 mono; box-shadow: 0 0 0 4px
var(--amber-a22)` — the page's ground for ink on solid amber, with an amber ring. The plates that
carry those nodes are not built yet, so the ledger badge is the only hardpoint number the product
draws and the treatment belongs on it. It moves onto the plates with the numbers when they land.

It takes **every kind of mount, empty included**. The canvas paints a node from its `kind` — dashed
and withdrawn for `empty`, cyan for a utility, amber for a fitted hardpoint — but checks the
selected branch first and lets it take all of them: `color = on ? '#0b0b0c' : (util ? … : empty ? …
  : …)`. Our empty rule matched at the same specificity as the selected one and sat after it in the
sheet, so it won, and an empty mount was the one row whose marker never said it was the selected
one — the row a Commander is most often looking for. The empty treatment is now scoped to rows that
are not selected (wave 9).

**Ruled 2026-08-22 (wave 9).** The workspace is **flush to the window and to the bar above it** —
no page inset of any kind. Both wide canvases hold the top bar and the region grid as direct children
of the page ground with nothing between them, and every region inside carries its own padding. The
18px/22px the application frame set was ours: it stood the category strip and the ledger's leading
rule off the window edge and off the bar, which is a frame the design does not draw. This is a shell
rule, so it applies to every route (feature 011, `app-frame`).

**Ruled 2026-08-22 (wave 9).** Every scroller in the product draws **one scrollbar that does not
change under the pointer**: `scrollbar-width: thin` with both halves of `scrollbar-color` named. The
user agent's own bar lightens on hover and darkens on press, which made the ledger's bar the only
thing on the rail that reacted to a pointer without being a control.

## The rail is one ground

**Ruled 2026-08-22 (wave 7).** Canvas 1c draws the ledger as a single unbroken ground from the
category strip to the last row. A row carries no ground and no rule of its own: what separates one
row from the next is the space inside it — the canvas's `11px 16px` — and the only line drawn down
the rail is the group's own, the hairline running from a group's tracked label to its count. Giving
each row its own panel over a rail a shade darker put a divider under every entry, which is a
different interface from the one the canvas draws.

The group rule stands clear of the first row under it by the canvas's own 8px, is inset to the same
edge its rows are, and one group is separated from the next by 18px.

A row's second line is **one line in one ink**: `4A GIMBALLED · OVERCHARGED G5 · CORROSIVE`, joined
with the canvas's own separator and set in the faint ink the canvas sets it in. It is not a row of
chips that wrap onto lines of their own, and the recipe in it is not written in the row's amber —
the canvas gives the amber to the name of a selected row and to nothing else in the row.

Canvas 1d rules its own ledger rows apart with a hairline, because at that width the ledger is the
whole screen rather than a rail. That hairline is **not** adopted: one ground with no per-row rule is
what the wide rail was asked for, and a rule that appears only below a width threshold is the
divider-per-entry problem back again on a phone. Revisit only if the compact ledger is reported as
hard to read.

## Narrow and 400%-zoom composition

**Restated 2026-08-26 against canvas 1d.** The compact artboard is not the wide one stacked, and the
implementation had been reading it as though it were: the three regions came down the page in the
wide composition's order, so the ledger opened the screen, the anatomy sat under it and the status
rail closed it. Canvas 1d's own order is the list below, and these four corrections are what it asks
for (Commander request 2026-08-26).

In canvas 1d's order:

1. Notices, unchanged: an accepted normalisation or a refused edit is above everything else.
2. **The mode strip and whatever it has open.** `MOUNTS · POWER · DRIVES · DEFENCE · OFFENCE ·
STATUS`. Five of the six are the anatomy region's own; see "The status segment" below for the
   sixth.
3. **The six key readings** — `DPS`, `SHIELD`, `ARMOUR`, `JUMP`, `SPEED`, `MASS` — on one strip,
   closed by a hairline. See "The compact key figures" below.
4. Category tabs, then the ledger. The tabs are four, not five; see "No `ALL` at compact width".
5. **The sticky foot**: `CHANGE MODULE` filled and `ENGINEER` outlined, for whichever mount is marked
   in the ledger above, `position: sticky; bottom: 0` on its own plate. Each opens its full-screen
   feature layer; back or cancel changes no build. It is drawn after the ledger rather than under the
   anatomy, which is where the artboard puts it and why it is not inside the bench — at this width
   the bench is the layer these two open.

The DOM stays in the wide composition's order, which is the reading order the three regions were
written in; the compact arrangement asks for the artboard's order in CSS. Undo and redo keep their
place in the shell's own action menu with identical accessible names and state, and package
validation and later calculation details remain available through their owning outlets — no
capability is removed in landscape.

### The status segment

Canvas 1d's strip has a sixth segment, `STATUS`, and what it opens is the status rail — `BUILD
STATUS`, the power line, cost and materials. That rail is not the anatomy region's and is not drawn
inside it, so the strip carries the segment, reports which one is open, and draws nothing for it; the
workspace puts the rail where the panel would have been (`hull-anatomy.ts`, `AnatomyGuestMode`). A
panel that is not the open one is removed from the page rather than hidden visually — it is a tab.

The segment is offered only at compact width. At wide width the rail is the third track of canvas
1c's grid and is on screen whatever the strip has open, so there is nothing for a segment to reveal.

### The foot is drawn, not pinned

Canvas 1d draws `CHANGE MODULE` and `ENGINEER` on a plate at the foot of the screen, and the artboard
pins that plate: it is drawn over the ledger, not after it. **The application draws it in the flow**,
at the end of the stack where the artboard puts it, and does not pin it.

The reason is measured rather than argued. An opaque plate 76px tall over a page-length ledger of
52px rows covers between half and the whole of whichever row falls at the foot of the viewport, and
it does so at every scroll position there is — there is no scroll offset at which nothing is behind
it. On an Anaconda's hardpoints that left a mount row 350×20.4px against a 24px floor
(`target-size`, `wcag22aa`, measured 2026-08-26). The mount rows are this screen's primary targets; a
plate that permanently covers one of them cannot be pinned over them.

Pinning it correctly means bounding the scroll rather than floating the plate: the stack above scrolls
inside a box of its own and the plate sits below that box, which is how a phone's action bar is built
and what the artboard is actually drawing. That is a different arrangement from the single page-length
column this region composes at compact width — the mode strip, the plates, the key figures and the
ledger all scroll together today — so it is recorded here as the follow-up rather than half-built.

### The compact key figures

The strip sets all six across, which at 390px is 55px a cell once its own 14px inside and the five
gaps are paid for. That is a **track floor, not a column count**: six tracks of `minmax(0, 1fr)` hold
their number at any text size and let the figure inside hang over the edge of the screen instead, and
a doubled text size ran the page 34px wide of the glass on exactly that (found 2026-08-26). The
tracks are `repeat(auto-fit, minmax(3.25rem, 1fr))`, so the six stay on one row where they fit and
become three on two rows where they do not.

Canvas 1d draws the same six readings twice: once in the strip above the category tabs and again
inside the `STATUS` panel's cell band. **The application draws them once**, in the strip, and the rail
omits its cell band at this width. Both are on screen together whenever `STATUS` is open, and a
reader meeting the same six figures twice on one screen has no way to tell which copy is the reading
— the strip is the one that is always there, so it is the one that is kept.

### The bands run to the glass

Canvas 1d has no page inset. Every band paints to both edges of the screen and carries its own inside
it — the anatomy's header row, the key figures, the mode panels and the sticky foot at 14px, the
ledger rows at the 16px canvas 1c gives them, the category strip full-bleed with its segments padded
— each closed by a hairline that runs the full width. The application frame gives its compact pages a
14px gutter, which is right for a page whose own blocks have no inset; this one's do, so **the
workspace takes that gutter back** with a negative inline margin and each band pays for itself.

The take-back is scoped to the compact _width_, not to the compact composition. The two are not the
same: `composition()` also answers `compact` on a short viewport at any width, and the frame draws
its gutter at the width alone — so a landscape phone would have had 14px pulled off each edge with no
gutter to cancel, and `overflow-x: hidden` would have clipped it rather than showing it. The same
block resets the wide grid for the same reason: the arrangement the composition decides in the
template has to be the arrangement the stylesheet draws, or the two bands that exist only here are
auto-placed into a second column beside the ledger.

The ledger's rows keep canvas 1c's 16px, so a reading in them stands two pixels further in than one
in the anatomy above. That is the artboards disagreeing with each other, not the double inset this
section is about, and it is left where the roomy canvas puts it.

Built the other way round the two insets added up: every band's closing hairline stopped 14px short
of the glass, every reading inside one stood 28px in, and the anatomy — still on canvas 1c's roomier
22px — stood 8px further in again, so the figures in `POWER & THERMALS` did not line up with the
mount names in the ledger below them. That is the misalignment reported on 2026-08-26. Two things
keep their inset, because they are not bands: the import notices, which are a labelled rule over
prose and take it as padding, and the empty state, which is a bordered plate and takes it as margin
so its border does not sit against the glass.

The anatomy's own inset is stated with the arrangement rather than with a width: one plate takes the
narrow canvas's 14px, two plates take the roomy canvas's 22px, and the threshold between them is the
one the second plate already opens at (`specs/010-hull-anatomy`).

### A pair is only a pair when both halves have room

Four regions inside the anatomy draw two boxes side by side when they have the width for it:
`DRIVES & MASS`, `DEFENCE`, `OFFENCE` and, inside `POWER & THERMALS`, the heat block's own split.
All four now open at the **wide** container step, which is where the power dashboard's four blocks
have always opened. Three of them opened at the medium step, and the medium step is 24rem: a
430-pixel phone hands these regions about 25rem, so on a large phone `THRUSTER LOAD` sat beside
`FRAME SHIFT DRIVE` and the heat bars sat beside their tiles, while the power blocks on the same
screen correctly stacked. Both canvases draw all four as one column at the narrow width, and canvas
1c draws the heat block as one column at _either_ width. Two cards of figures at 24rem are 12rem
each once the gap is taken off, which is narrower than the readings they hold; the labels wrapped a
word at a time and the pair was harder to read side by side than stacked (reported 2026-08-26).

### No `ALL` at compact width

Canvas 1d's tab strip is `HARDPOINTS · CORE · OPTIONAL · UTILITY`, with no `ALL` and no counts on the
tabs. The `ALL` chip is canvas 1c's: at compact width the ledger is one category at a time and a
Commander says which, rather than being handed thirty-four mounts to scroll. A window narrowing while
`ALL` is chosen lands on the first tab, which is the one the artboard draws selected.

**Which category is shown is a choice, not a memory (corrected 2026-08-26).** The shown category was
first written as the last value that is still offered, falling back to the offering's own first. That
reads correctly and is wrong, because of _when_ it is first read: the region reports the compact
composition until its observer has measured it, so the first offering any width sees is canvas 1d's
four tabs — and `HARDPOINTS`, latched a frame before `ALL` existed, is offered at both widths and
therefore never let go of. Canvas 1c's ledger opened on eight of an Anaconda's thirty-nine mounts
with `ALL` beside it unpressed, and every mount outside the hardpoints was unreachable without
pressing a tab the artboard does not draw selected.

So what is held is the category a Commander **asked** for, and nothing is held where nobody has
asked. The shown category is that choice where the width still offers it and the offering's own first
where it does not: `ALL` at wide, `HARDPOINTS` at compact. A choice survives a resize that keeps
offering it; `ALL`, which nobody chose away from, comes back when the width offers it again.

`CORE` lists three of the package's slot kinds. Canvas 1c counts `CORE 8` on an Anaconda whose seven
core internals are followed by its cargo hatch, and canvas 1d's `CORE` panel draws that hatch as its
last row — so the hatch is a core internal as far as both artboards are concerned, whatever
`SlotKind` calls it. Armour joins it for the same reason and one more: with no `ALL` there is no other
tab it could be reached from. The rule is the same at both widths, so a Commander who found armour
under `CORE` on a phone finds it there on a desktop.

## Slot presentation

Every package slot shows:

- the slot label the canvas draws — kind, size and, for hardpoints, the node number, as in
  `SIZE · NODE NO.`. On an **empty** row that label is not drawn as prose either: the canvas draws
  the size box, the node box and the word `Empty`, and `Size 4 · Node 1` written out beside them is
  text neither canvas has (wave 5). It stays as `visually-hidden` text, as the complete game slot key
  does (see the accessibility contract below);
- an **empty mount is drawn as an outline rather than a fill** (wave 8). The size box loses its amber
  ground for a dashed amber edge, the node badge's solid edge goes dashed with it, and `Empty` is set
  in the same face and size as a fitted module's name, in italic and a rung quieter. Both boxes keep
  their measure, so an empty row still lines up with the fitted rows above and below it. Canvas 1c
  also dims the whole row to 0.62; that is the one part **not** taken, because it puts every ink on
  the row under the contrast floor and an empty mount is exactly the row a Commander is looking for
  (FR-010);
- on the fitting panel's own head, a hardpoint is named `Fitting · Hardpoint 1 · Huge` — the node
  number the ledger draws beside the row, then the class. The package's slot name counts _huge_
  hardpoints rather than hardpoints, so it names a different mount from the one the ledger marked
  (wave 6);
- where a mount takes no other module — the cargo hatch — the fitting panel's head carries no chip.
  The Almanac's full sentence is the whole of what is published, on the bench, as text
  (**revised 2026-08-25**: see "The `FIXED` chip is withdrawn" in the reference review);
- kind/size/restriction when available;
- empty or package-resolved state;
- fitted package module name, symbol where needed to distinguish, class/rating/mount;
- current ordinary engineering and experimental effect when identified;
- current pre-engineered route/purchase grade separately from ordinary current grade;
- all package acquisition and entitlement labels;
- removability or package reason;
- enabled and localized priority state where package operation exists.

Unsupported identities are outside the workspace contract. Package construction has already
populated fixed mounts. Unavailable facts for resolved package entries have explicit localized text.

## Cargo hatch

Show cargo-hatch facts, enabled switch and priority selector. Present the
package immovable reason. Do not make the card open replacement or engineering and do not show remove.

## States

| State                             | Required presentation and behavior                                                                                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No active build                   | Explain that outfitting requires a build. Compose feature 001 create/open/navigation and feature 004 import only when those owners supply them; feature 002 promises no action itself. |
| Valid or invalid/incomplete build | Every available package slot remains inspectable/editable; validation stays visible.                                                                                                   |
| Empty slot                        | Canvas slot label, capacity facts and replace action; remove absent/no-op is not promoted.                                                                                             |
| Unsupported module ingress        | Outside the supported application import contract.                                                                                                                                     |
| Non-removable                     | Localized package reason and no remove action.                                                                                                                                         |
| Cargo hatch                       | Facts and power only.                                                                                                                                                                  |
| Accepted normalized ingress       | Notice reports quality completion; package-returned fixed defaults have no separate repair/provenance state; undo excludes normalization.                                              |
| Refused incoming normalization    | Not rendered as the rejected workspace. Owning ingress surface names every partial slot/identity/package reason and states that the current build/history are unchanged.               |
| Edit refusal                      | Structured localized notice; active build, calculations and history unchanged.                                                                                                         |
| History available/unavailable     | Direct or menu actions reflect `canUndo`/`canRedo`; new branch clears redo immediately.                                                                                                |
| Ship named / unnamed              | Both fields are optional and independently labelled. Unnamed shows an empty field, never a hull-derived placeholder presented as a value; clearing sets absence, not an empty string.  |

## Accessibility and responsive contract

- `main` and one workspace `h1` come from the owning route; slot group headings nest consistently.
- Groups use semantic lists; facts use definition lists. Exact slot keys are never visible text; they
  are always available to assistive technology through `visually-hidden` text beside the drawn label,
  which is the accessibility floor rather than an addition to the design.
- **A notice names a mount the way the ledger does, whatever the source called it.** The ingress
  notices carry the slot key the file, the link or the journal event used, and the package matches
  slot keys without regard to case — so `slot08_size4` names the mount the ledger lists as
  `Slot08_Size4`, and looking the label up by exact key missed and printed the raw key as visible
  text (reported 2026-08-26). The lookup compares the way the package compares. A key with no label
  at all still falls back to itself: a notice naming no mount would be worse than one naming it
  awkwardly.
- Switch and priority select names include the slot/module. One-based priority labels include the word
  “priority”; enabled state is not a colored dot alone.
- Selection, invalid/incomplete/disabled/engineered/acquisition state includes text and programmatic
  state, never only color, opacity, icon or anatomy position.
- Status/refusal/normalization announcements are coalesced; one Commander edit does not re-announce
  the entire ledger.
- Anatomy and ledger publish/select the same exact game slot key; no positional node index becomes
  shared identity.
- All targets meet 44 CSS px; hover is optional; touch/pointer work in both orientations.
- At 400% zoom use the narrow composition. Long names, symbols, translated labels and ident wrap;
  there is no document horizontal scrolling.
- Reduced motion removes ledger/layer transitions without delaying state. Expanded/RTL text preserves
  semantic reading order.

Preview/test states cover all rows above, 100-history boundary, undo branch, no-build and every
normalization/refusal state across core widths.
