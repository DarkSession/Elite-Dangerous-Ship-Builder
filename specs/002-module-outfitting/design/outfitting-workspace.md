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
- **The bench is two columns where it has room for three. Ruled 2026-08-30, against the canvas
  revision of that date.** Canvas 1c draws the bench as `264px minmax(360px, 1fr) 396px`: the family
  rail, the module pane and the engineering editor, in one row under one numbered step strip. The
  first two of those tracks are the manifest's own and are drawn inside the fitting panel, so the
  bench itself is the two panels side by side — the fitting column taking what is left, the editor
  taking the canvas's 396px, and the two stretch to the same height.
  The mount's name, the search and `REMOVE MODULE` are the fitting column's head and stop where that
  column stops, which is how the canvas's `13px 430px 11px 20px` head is read here.
- **Under 67.875rem of bench the editor goes back under the manifest.** The figure is the manifest's
  own rail minimum of 638px, the canvas's 14px gap and its 396px editor track, and then the bench's
  18px inset and hairline on both edges: `638 + 14 + 396 + 38`. It is asked of the manifest's
  minimum rather than of the canvas's `264 + 360`, because a fitting column below that minimum draws
  the accordion instead of the rail, and the editor would then stand beside an accordion with no
  step ① or ② to line up with. A 1440 window has about 700px of bench once the ledger's 392px and the
  status rail's 306px are paid for. So the side-by-side arrangement is the one the
  canvas was drawn at — 2020px — and everything narrower keeps the stack, which is the same content
  in the same order. Asked of the bench's own container rather than of the window, so a doubled text
  size or 400% zoom takes the stack for the same reason a narrow window does.
- **The style ceiling is 11kB. Ruled 2026-08-30.** `angular.json` sets a
  per-component ceiling on emitted styles, and the answer to crossing it is to take the shared thing
  out rather than to raise the number (`specs/005-power-and-heat/design/power-and-heat-detail.md`).
  That was done first: canvas 1c's step strip and the three-column bench are stated once in
  `src/styles/_chrome.scss` instead of once per component, which put the chooser's stylesheet back
  under 10kB with room to spare. `outfitting-workspace.scss` is the whole outfitting screen — the
  ledger, the centre column, the status rail and the compact foot — measured 10,127 bytes of 10,240
  before this change and 10,414 after it, and it has no block left in it that is a component boundary
  rather than a piece of one screen. `anyComponentStyle` is one figure for every component in the
  build, so raising it raises the ceiling for all of them; the alternative is a per-file exception
  list, which is a worse record of the same decision. A global home was the other candidate and is
  rejected on the
  cascade: an emulated-encapsulation stylesheet appends an attribute to every compound selector, so a
  component's own `.outfitting__centre` outweighs a global rule of the same shape and the global one
  never takes effect. The ceiling is raised by 1kB and the reason is written here so the next raise
  has to argue with it.
- **The bench is bounded where it is three columns. Ruled 2026-08-30 (Commander request), narrowing
  the 2026-08-27 release.** The release below holds wherever the bench is one column under another:
  two panels sharing one screen's height leave the chooser a couple of hundred pixels and the
  attributes less, so the page is the better carrier. Side by side they are not sharing a height,
  they are each given one — which is what the artboard draws, a card of a fixed height with the list
  scrolling in one column and the attribute table in the other — and a column that ends where the
  window ends is what lets those two take the room that is left rather than leave it empty at the
  foot. The anatomy dashboard keeps its own release: it is a different arrangement, ruled separately,
  and its plates are what that column is bounded for.

  The bound is asked of the region rather than of the bench's own column, because the column is the
  container the three-column question is asked of and a container query cannot style its own
  container. `$bench-columns-region-min` is `$bench-columns-min` plus the two fixed rails either side
  of that column, and the two figures move together.

  It is asked of the window's height as well. A bounded bench divides one screen between a chooser
  that scrolls and an editor that mostly cannot: the three engineering controls are reserved room and
  the attribute table under them has a floor. A window shorter than the two of them together puts the
  editor past the bench, which clips it, and nothing scrolls to what is clipped. So the bound holds
  from `$bench-bounded-min-height` up, and below it the column is released and the page carries the
  bench, which is what every stacked arrangement does anyway. The figure is the sum of what the bench
  cannot fold at the largest hull, and it is written out where it is declared.

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

**And a share is not a size. Ruled 2026-08-26 (Commander request).** The ratio divides whatever the
bench has, so on a shorter screen each panel is a smaller fraction of a smaller box: at 900px the
manifest drew four rows and at 700px it drew two, which is a glimpse of a list rather than a list.
Canvas 1c settles what one should be — it draws the workspace over a `min-height: 880px`, leaving the
bench 574px under the plates and giving the manifest 292 of it: the head, the column rule and five
rows. Each panel now states a floor of its own, on its own host, because how short a panel may get
before it stops being one is the panel's statement rather than the bench's; the manifest's is
measured against the editor's, so the two can never ask for more than the bench holds and neither
ends up in a box that clips it. Where the bench cannot give both, the editor's is the floor that
holds — it is the panel that can be read a line at a time. This costs the editor some of what the
ratio above gave it at 900px, which is the trade: five rows of manifest against forty pixels of a
comparison that scrolls either way.

**Five rows is still a glimpse. Ruled 2026-08-27 (Commander request).** The floor above was read off
the canvas's own arithmetic, and the canvas is 880px tall. On the screens this is actually drawn on
it was the floor doing the work rather than the share, and five rows of a 478-choice manifest is a
list a Commander pages through rather than reads. So the floor is a row count over the same head,
column rule and foot, and any of it is affordable only because the ruling below releases the column:
the manifest is no longer taking its height out of a fixed bench that the editor underneath has to
be left some of. The share and the guard that divided that bench are gone with it, and the floor
stands on its own, bounded only by what the screen itself leaves under the command bar so that it
can never be taller than the window it is in. What the count is, the ruling below settles.

**Seven rows, and the fitting panel about a tenth shorter. Ruled 2026-08-28 (Commander request).**
The fitting panel and the pane inside it are the tallest thing on the workspace, and the anatomy and
the status rail beside them are what a Commander scrolls to reach. So the floor is 23.375rem and the
pane's own bound comes down by the same one manifest row, because the two are the same list at two
widths. Seven rows over the same head, column rule and foot is still a list rather than the glimpse
five rows was. Nothing else changes height — the bench's own 26rem minimum, the plates and the rail
are all where they were.

**Six rows, and another tenth off. Ruled 2026-08-29 (Commander request).** The same reading, made a
second time against the built screen: still too tall to read past. It is answered the same way, and
in whole rows for the same reason — a manifest that ends halfway down a row is a list with a lid on
it rather than a shorter list. The floor is 20.75rem and the pane's bound 24.125rem, one manifest row
off each again, which is 11% off the panel and 10% off the pane. Six rows over the same head, column
rule and foot. Nothing else moves.

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

**Ruled 2026-08-27 — and a bench is not bounded by the column either.** The same reasoning reaches
the other thing this column holds. The engineering editor is drawn inline for whichever mount is
marked, and its height is whatever the article has to say: a weapon publishes around seventy
attribute rows, and the panel was being handed a share of a bench inside a column bounded to the
screen. Wave 11 answered that by scrolling each of the panel's two halves in its own column, which
put two more bars inside a column that already had one and left the reading four rows tall — the same
shape of answer wave 14 gave the dashboards, and wrong for the same reason
(`engineering-editor.md`, "Nothing here scrolls").

So the column releases while a mount is selected, exactly as it releases for a dashboard and by the
same three rules — `position: static`, its own content height, the bench released with it — and the
page carries the panel. Inline there is no case where a mount is selected and that panel is not
drawn: canvas 1c gives it no opening control, so it is simply there for the marked row, empty mount
or not. That is why the release is keyed on a mount being selected rather than on the panel being
present. The two describe the same frames, and the mount is the one the region already knows about.

**And the centre column is not one of the frozen ones while it is released.** The two seams this
region draws are the ledger's `border-right` and the status rail's `border-left`; the column between
them draws neither, because the bench drops its own leading edge so the pair do not stack into a
two-pixel rule. Releasing it therefore costs no seam — the ledger stays frozen at the full height the
command bar leaves, and follows the page down, which is what keeps its rule against the screen
however long the bench below it grows.

It is worth writing down because a journey was counting rather than naming: it asked for two frozen
columns at any non-compact width, which the ledger and the centre satisfied together until the centre
released. At the two-pane width the status rail draws no vertical seam at all, so the count came to
one and read the release as a lost seam. The rule is that every region drawing a seam is frozen — the
ledger always, the status rail wherever this width gives it a column of its own
(`e2e/outfitting-responsive.spec.ts`, corrected 2026-08-27).

**The status rail is a segment wherever it has no column. Ruled 2026-08-30 (Commander request).**
Only the widest arrangement draws it as canvas 1c's third track. Below that the region has two
columns and the rail had neither: it ran the full width under the bench, a tall band of readings
squeezed beneath the module a Commander was working on. Canvas 1d already answers this — the rail is
the strip's `STATUS` segment there — and the answer is the same wherever there is no column for it,
so the segment is offered from the compact artboard up to the width the third track appears at. The
panel it opens is drawn where the strip's own panels are drawn, under the strip: placed at the end of
the grid instead it opened 1,304px below the segment that opened it, on a page the segment did not
move, so pressing `STATUS` did nothing a Commander could see.

The width the third track appears at is the three tracks added up rather than a rounded figure, and
the region and the grid read the same sum (`composition.ts`, `MINIMUMS`;
`outfitting-workspace.scss`). Stated apart they disagreed by 1.625rem, and in that band the region
was a two-column grid that believed it had a rail.

**What the release takes with it.** The bench's `1.1 : 1` share and the manifest's floor-against-the
-editor's-floor guard both existed to divide a fixed box between two panels. There is no fixed box to
divide any more, so both are gone: each panel takes the height its own content asks for, the manifest
keeps its own bound so a 478-choice list still scrolls inside a screenful rather than running the page
down two hundred rows, and the editor keeps only its floor, so an article with nothing to engineer is
still a panel rather than a strip.

**Ruled 2026-08-26 — the status rail's last block may have the rest of the column.** The rail is a
column of a fixed height whose blocks are as tall as they are, and feature 009's material list closes
it. Bounded at five rows by that feature's ruling G, the list stopped a third of the way down and
left the foot of the track empty beside a scrollbar that was there to reach rows the column had room
to show. The rail is now a stack: what sits above the list is fixed, the list takes what is left and
scrolls only what will not fit, and it never falls below the measure ruling G set. Only where the
rail is the canvas's third track — below that step it is a band under the bench with the page's own
height to grow into, and a list that filled it there would run the whole shopping list down the
screen (Commander request 2026-08-26; `specs/009-cost-and-materials/spec.md`, FR-007a).

**What that height is, is measured, not declared.** `--edsb-layout-bar-height` is the one height the
bar is drawn at — what it comes to at every width where it does not wrap. At any width where it does
wrap it is taller, by however many rows a longer language, a narrower window or a larger text size
cost it. Subtracting the declared figure left the columns past the foot of the screen by the
difference, and freezing the ledger at it put the category strip _behind_ the bar at tablet width —
62px of it, at 834px, once the page was scrolled. The frame
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

The group rule stands clear of the first row under it by the canvas's own 8px and is inset to the
same edge its rows are.

**Ruled 2026-08-28 (Commander request).** The rail is drawn in a **tighter measure than the canvas's
own**, in three places and no others. A row is the project's 44-pixel target baseline: with the
canvas's block padding taken off, two lines of identity come to 33px, so the baseline is what the row
is — a row carrying that padding as well comes out at 52px, and eight pixels over thirty-nine mounts
is most of a screen of ledger. One group is separated from the next by 12px rather than 18, and the
rail closes 8px after its last row rather than 22. Nothing else about the rail moves: the inset, the
group rule, the size box and the node badge are the canvas's. The three numbers that changed are air
a Commander scrolls past rather than reads, and an Anaconda is thirty-nine rows of it.

**Ruled 2026-08-28 (Commander request).** A row's **module name is cut with an ellipsis rather than
wrapped**, and the row does not wrap around it. A ledger is forty rows read as a column, and a long
name that took a second line made its own row taller than its neighbours and pushed the marks at the
end of it — the acquisition icons, the power chip, the engineered mark — off the line they belong on.
Those marks keep their places and the name gives way, which is the order the request asked for: the
icon first, the text cut earlier to keep it.

**Revised 2026-08-28 (Commander request: "remove the 'Nicht übersetzt' or similar chips").** The
`UNTRANSLATED` tag used to be one of those marks, and it is gone. A screen of the Almanac's nouns
read in German is a screen of chips — one on nearly every row of this ledger — and the state they
marked is the ordinary state of game text in a language the package does not ship. What a row
carries instead is the `lang` attribute on the name and the disclosure tied to it, spoken rather than
drawn, which is where the sentence already was (011/FR-020). The whole name stays in the DOM, so
a reader is read the whole name and only the drawing is short; and where two long names would read
alike, the row leads with its own size box and node badge and the fitting panel opened on the marked
mount writes the module's name in full.

**The ellipsis is a control, not a painted glyph.** `text-overflow` draws a mark no pointer and no
thumb can ask anything of, and a name that is only half drawn is content the surface has lost. So
where — and only where — the row is actually cutting a name, the badge replaces the browser's
ellipsis with the design system's own tooltip carrying the whole name: the same presentational mark
the acquisition icons on that line already are, a `span` rather than a button because the row around
it is itself a control, and hidden from the accessibility tree because the whole name is in the DOM
beside it and is read out whole. Whether the name is cut is measured through the platform's element
size adapter, so a row whose name fits carries no mark at all and the ledger is the only surface that
pays for the measurement. It is projected into the game text itself, beside the value, so it lands
against the words it abbreviates. And **no box above it hides its overflow**: a bubble is hung off
its trigger, so any ancestor of that trigger which clips takes the whole gloss with it, and the
ledger's own line boxes were doing exactly that to the acquisition marks' tips as well. The value
clips itself and nothing above it does.

That makes the truncation a fold rather than a loss, which is what SC 1.4.4 is about: the assertion
`clippedText` stops reporting an element whose owner has marked it `data-text-reachable`, and the
attribute appears only alongside the control that produces the whole text on the same screen. A
surface that sets it without drawing that control is lying, and `never loses a module name the row is
too narrow to draw` is what holds it to that — run in German, because English is the one language
where this row never overflows.

**Three things the cut does not reach, and one condition on it.**

- **The code line is not cut.** `4A GIMBALLED · OVERCHARGED G5 · CORROSIVE` is the only place a row
  writes its engineering in words, and the marker beside it is a glyph rather than a substitute
  (FR-010). It wraps where it must and the row grows with it, which is why the 44px measure is a
  floor rather than a fixed height.
- **Nor a mark.** The tag and the acquisition icons are `flex: none`; only the name shrinks.
- **The cut applies only while a line will hold a name**, asked as a container query in `em` on the
  row itself — `em` there is the row's own font size, so `20em` is "twenty characters' worth of
  line". A rail that cannot give that much — a narrow one, or one whose Commander has doubled their
  text size — wraps and grows instead. It is the line that decides and not the text size: a rail
  still twenty characters wide at 200% goes on cutting, and owes the same reachable name for it.
  `never loses a module name the row is too narrow to draw` and `keeps the whole name reachable at
doubled text` hold the obligation that comes with the cut — a cut row and a reachable whole name
  are the same state, at every width and both text sizes — and they have to be tests of their own:
  `clippedText` cannot watch this, because the `data-text-reachable` exemption that makes a cut
  acceptable is set by the same rule that cuts, so a lapse would exempt the sweep from noticing it.
  The threshold itself is the stylesheet's, and nothing asserts where it falls.

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
4. **Nothing.** Canvas 1d writes the marked mount's own rule — `FITTING · HARDPOINT 1` — between
   the key readings and the categories, and the application drew it there until 2026-08-28. It is
   **withdrawn at this width** (Commander request 2026-08-28): the two panels the rule heads are
   full-screen layers here, each carrying the mount in its own head, so the rule on the page behind
   them named a mount with nothing under it over a ledger that already marks the row. The bench that
   carried it draws nothing else at this width either, so it takes `display: contents` — the box
   goes and everything in it stays, which matters because the withdrawn sentences saying why a mount
   cannot be emptied live there. An outlined empty panel between the key figures and the tabs read
   as a region that had failed to load.

   The mount is still named at this width, on the screen that acts on it: the fitting panel writes
   it in its own head, and the engineering layer carries it in its title bar under the module. That
   is the rule the end-to-end suite reads — `benchFollowedSelection` waits on whichever of the two
   heads this width draws, and the action bar where it draws neither.

5. Category tabs, then the ledger. The tabs are four, not five; see "No `ALL` at compact width".
6. **The sticky foot**: `CHANGE MODULE` filled and `ENGINEER` outlined, for whichever mount is marked
   in the ledger above, `position: sticky; bottom: 0` on its own plate. Each opens its full-screen
   feature layer; back or cancel changes no build. It is drawn after the ledger rather than under the
   anatomy, which is where the artboard puts it and why it is not inside the bench — at this width
   the bench is the layer these two open.

The three regions keep one order in the document — the notices, the ledger, the middle track — and
the compact arrangement asks for the artboard's own order of them in CSS. What moves in the document
is the two regions the anatomy strip draws as guests: where the rail has no column of its own, it and
the six key readings are inside the middle track, beside the strip that opens them. There is no CSS
that moves a box between parents, and every other home for them at those widths is a band under a
column a screen tall — which is a panel opened a screen below the segment that opened it. Undo and redo keep their
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

**The seam between the strip and the rail is the anatomy region's own (2026-08-28, Commander
request).** The rail is the next band of this workspace, so it arrived with the band gap under a
region that had also kept the inset under the panel it was not drawing — a band of empty ground above
`BUILD STATUS` that no other segment opens with. The region marks a guest segment on its own host and
closes against it (`specs/010-hull-anatomy/design/hull-anatomy.md`, "The region closes against a
guest's panel"), so what stands between the strip and the rail is the spacing every other segment
opens with. Nothing about which region draws what changes: the workspace still puts the rail there,
and the anatomy still draws nothing for that segment.

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

**Tried, and reverted, on 2026-08-27.** A Commander asked for the plate to be on screen wherever they
had scrolled to, and `position: sticky; inset-block-end: 0` was fitted with the ledger carrying the
plate's height as end padding. The padding clears the _last_ rows only; at every other scroll
position the plate still covered whichever row was at the foot of the viewport, and axe reported
`target-size` (serious) against that row's `.slot__select` in both engines, across eight specs at
mobile portrait. The criterion is **SC 2.5.8**, which is in scope — not SC 2.4.11, which is one of
the seven the constitution excludes and which the reverted note wrongly cited. The follow-up above
is the way in; there is no version of this that floats an opaque plate over the rows.

**Asked again, and declined, on 2026-08-28.** A Commander asked for the plate to slide in from the
foot as the first mounts come into view. The answer is the same and the reason is unchanged: there is
no version of this that floats an opaque plate over the rows, and the bounded-scroll arrangement above
is a different composition from the single page-length column this region has. What was taken instead
is the complaint underneath the request — the run of empty space between the last mount and the plate.
The rail now closes 8px after its last row rather than 22 (see "The rail is one ground"), and the
empty bench panel that used to stand between the key figures and the tabs is gone with the head it
carried, so the plate arrives where the ledger ends.

**And it is also what was asked for (2026-08-26).** The Commander's own words for this were that the
two actions should not appear until the modules do. Drawn in the flow they cannot: the plate is the
last thing in the stack, under the ledger it acts on, so it comes into view with the end of that list
and never before it. The pinned plate showed both actions over the hull plates, before there was a
list on screen to have marked a mount in. Whatever the follow-up above builds has to keep that.

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
