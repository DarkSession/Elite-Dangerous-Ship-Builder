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

- Existing compact build identity/actions header, including the same ship name and ident fields.
- Undo/redo in a clearly named action region or overflow menu with identical accessible names/state.
- Complete accepted-normalization/edit-refusal notice.
- Shared anatomy/status outlet and concise metric/power strip, then slot-kind/category controls and
  semantic slot cards. This intentionally follows canvas 1d's source order. Categories change the
  visible list but not build/history.
- Selected slot exposes explicit `Change module` and `Engineer` actions. Each opens its full-screen
  feature layer. Back/cancel changes no build.
- Package validation and later calculation details remain available through their owning shared
  outlets; no functionality is removed in landscape.

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
- where a mount takes no other module — the cargo hatch — the fitting panel's
  head carries canvas 1d's own hairline `FIXED` chip after its rule. The full reason stays
  as text for a reader, but a sentence is not what the canvas draws and, drawn only for a reader, the
  bench for that mount was a title over an empty panel (wave 7);
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
