# Module Replacement Surface

**Parent route**: `/build` application state  
**Requirements**: FR-002, FR-004–FR-008, FR-020–FR-024

## Purpose

Find and fit exactly one package-authorized stock or pre-engineered choice, or remove the current
module when the package permits. The surface is a draft/choice view; selection alone does not mutate
the build.

## Wide composition

- The mount's own heading, the search and `REMOVE MODULE` on **one line**, as canvas 1c draws the
  panel head (wave 5). A hardpoint is named by the number the ledger draws beside it and the class it
  takes — `Fitting · Hardpoint 1 · Huge`. The package's own slot name counts _huge_ hardpoints rather
  than hardpoints, so on a hull with several classes it names a different mount from the one the
  ledger marked (wave 6). Every other kind keeps the package's name.
- Visibly labeled `CandidateSearch` and clear action. The result count is drawn in canvas 1d's screen
  header only; canvas 1c's panel head carries no count, and the search announces it at both widths.
- A focus shortcut and its hint, as canvas 1c draws beside the field. **Ruled 2026-08-21: adopted as
  an unrequired affordance.** Constitution V puts the keyboard criteria out of scope and forbids any
  requirement in this repository from demanding them, so this MUST NOT become a normative
  requirement, an acceptance gate or the only route to the field: pointer and touch reach the search
  exactly as canvas 1d shows, with no hint. The hint is application-owned text, so it resolves through
  localization (constitution VI) and names the modifier for the Commander's platform — `⌘K` is
  macOS-only and MUST NOT ship as a literal on Windows or Linux.
  **Wired 2026-08-28 (Commander request).** The combination is handled and **cancelled**: `Ctrl + K`
  is the address-bar shortcut in both engines this application is tested in, so a hint drawn beside a
  field that never receives the key names a convenience that does not exist. Either modifier is
  accepted whichever hint is drawn, because a Mac keyboard on a PC has both. It stays unrequired: it
  moves the caret and nothing else, and everything the field offers is reachable without it.
- **A family rail beside a variant pane**, since the 2026-08-25 canvas revision — see "The wide
  manifest is a rail and a pane" below. The rail carries the package family name and the family's
  choice count; the pane carries the selected family's rows. There is no caret and no section
  heading above them: see "Module families".
- Responsive semantic manifest grouped by package family and ordered inside a family by localized
  module name, then class/rating.
- Rows expose explicit fitted/stock/variant state, class/rating/mount, acquisition and entitlement
  labels, and the credit and Merc Coin price. **The DPS, mass, power and weapon-draw columns are
  withdrawn at this width** by the same revision; they survive where canvas 1d draws them, on the
  compact row's own code line. An unavailable fact remains labeled unavailable rather than zero
  wherever it is drawn.
- **No fit and no cancel inline.** Canvas 1c draws neither: the panel is already open beside the
  ledger for the marked mount, so choosing a row _is_ the fit and there is nothing to leave. Both
  controls belong to canvas 1d's screen (wave 4). At wide width the foot those two controls sit on is
  not drawn at all — a ruled bar with nothing on it read as a divider between the manifest and the
  engineering panel under it, and canvas 1c has none (wave 8).
- An explicit remove action operates only when `LoadoutSlot.removable` is true, and **its place is
  closed up where it does not** (Commander request 2026-08-28, superseding wave 8). Wave 8 reserved
  the measure with `visibility: hidden` so the search field beside it would not grow and shrink as a
  Commander moved down the ledger. The head wraps at every width this panel is actually drawn at —
  474px inline, 390px in the layer — so the reserved control was never a gap beside the search but a
  blank row under it, 54px of nothing over most of an unfitted hull. The reason it was reserved is
  bought back by the arrangement instead: the search takes the row it is on whether or not the
  control is there, so it is the same width on a fitted mount and an empty one either way.
- **A second route to the removal, on the ledger row itself** (Commander request 2026-08-28). The
  secondary pointer button on a fitted row empties that mount. It is a shortcut and never the only
  route — `REMOVE MODULE` above is the drawn control at both widths — and it is deliberately not
  reachable by touch: a long press reports button 0 rather than 2, so it keeps the platform's own
  menu and no mount is emptied by a press that was meant to select it. A mount the package refuses to
  empty, and an empty one, keep the platform's menu too.

The region may scroll internally. It cannot cause page-level horizontal overflow.

## The wide manifest is a rail and a pane

**Ruled 2026-08-25, against the canvas revision of that date.** Canvas 1c no longer draws the wide
manifest as one accordion. It draws `#fit-table` as
`grid-template-columns: 216px minmax(0, 1fr); column-gap: 14px`, with:

- **column 1, row 2** — the family rail: every family in package order, one row each carrying the
  family's name and its choice count in a chip, bounded at the pane height below and scrolling on its
  own. The selected row takes the amber left rail (`border-left: 3px solid var(--amber)`) and the
  amber gradient ground, and the others take `var(--panel-2)` with a transparent border in the same
  place. **There is no caret**: `wireFamilies`' rail branch keeps its `.fam-car` update behind a
  null check, and the revised markup carries none;
- **column 2, row 1** — the column head, over the pane alone;
- **column 2, row 2** — the selected family's rows, `border-left: 1px solid var(--amber-a16)`,
  bounded at the same height and scrolling on its own.

**The pane height is 428px, amended 2026-08-28 (Commander request).** The canvas draws 470px. One
manifest row comes off it, the same row the fitting panel's floor gives up, because the panel and the
pane are the same list at two widths and the panel is about a tenth shorter for the pair
(`design/outfitting-workspace.md`, "Seven rows, and the fitting panel about a tenth shorter").

**The rail's 216px is a floor and a share, amended 2026-08-26 (Commander request).** It is a quarter
of the canvas's own 862px centre column, and held at that one number it stopped being a quarter the
moment the column was wider: at 2560 the pane beside it ran 1595px of mostly empty row while
seventeen family names went on wrapping inside 216. The rail now takes a quarter of what it is
actually given, floored at the canvas's figure so nothing moves at the width the canvas was drawn at,
and bounded at 20rem — past the width a family name needs, the pixels belong to the rows. 216 at 1440
and 1560, 308 at 1920, 320 at 2560.

**Selection is exclusive.** The revised script's rail branch shows the chosen family's `.fam-v` and
hides every other, and returns before the accordion branch it replaced. Exactly one family is
selected at all times, and the pane is never empty.

**The rail scrolls to the family it was told to select. Ruled 2026-08-27 (Commander request).** The
pane already scrolled: opening a fitted mount brought the module in the mount to the middle of the
rows. The rail did not. Its own bound holds about nine of the seventy-seven families, so
selecting `Shield Generators` for a mount that carries one changed every row in the pane while the
rail went on showing `Armour` through `Bulkheads` — the answer was on screen and the question was
not, and the seam between them was the one control that says which family is being read.

So the rail brings the revealed row into its own visible box — and the rule has two halves, because
_who_ revealed it decides. **A family the application revealed is centred; a family the Commander
pressed is left exactly where they pressed it.** Centring on every selection would move the list
under the press that made it, which is the fault above drawn in the other direction.

**Corrected 2026-08-27: the rule is about who, not about where.** It was first written as "scroll it
unless the row is already in the box", on the reading that a Commander pressing a row must be looking
at it. They need not be: the rail is a bounded box of 44px rows, so the row at either edge is routinely
clipped, and pressing a clipped row is the ordinary case rather than the awkward one. The component
records its own press instead and the reveal weighs that, which is the rule FR-021 and SC-007 state.

The in-view test survives as _restraint_ and not as the rule: a family the application revealed that
is already whole in the box is left alone, because there is nothing to bring into view and moving it
would be motion with nothing to show for it. A row outside the box is centred, the same way and for
the same reason the pane centres the fitted module.

It scrolls the rail's own box rather than delegating to the platform's `scrollIntoView`, for the
reason the pane does: at a short viewport the region deliberately stops bounding itself and the page
is what scrolls, so walking every scrollable ancestor would carry the search field and the panel head
off the screen to bring a family row into it.

The accordion is not gone — canvas 1d still draws it, unchanged, with its badge, its variants
summary and its caret. So the two compositions now differ in kind and not only in arrangement: a
rail with one pane at wide, an accordion at compact. What that costs FR-021 to FR-023 is ruled in
"Module families" below.

## The manifest's own columns

**Ruled 2026-08-25.** The wide manifest is three columns, not seven:
`grid-template-columns: 2.6fr 70px 150px` — `MODULE`, `CLASS` and a right-aligned `COST` — on both
the head and every row of the pane. The canvas revision withdrew `DPS`, `MASS t`, `PWR MW` and
`DRAW WEP` from this width entirely.

They are not moved and not folded into a second line: canvas 1c draws a row as one line of three
cells. The facts survive only where canvas 1d draws them, in the compact row's own code line
(`GIMBALLED · 23.3 DPS · 4.46 MW · 16.0 t`), which that canvas did not change. A wide manifest that
kept them would be the screen not being the design.

**Superseded, kept for the record — ruled 2026-08-22 (wave 7, corrected wave 9).** The wide manifest
was canvas 1c's seven-column grid
at the canvas's own measures — `2.2fr 62px 74px 74px 78px 86px 128px` — and the columns **abut**.
There is no gap track between them: their measures already carry the space, and a gap laid on top of
them narrows every figure column below what the canvas gives it. The cost column is nearly twice a
mass or a power column because it holds nine digits and a unit. Wave 7 lifted these by the same ~1.25
the type ramp then carried; the lift is gone from both.

**Ruled 2026-08-22 (wave 9).** The table is **capped at the width canvas 1c gives it** — 1002 px less
its own side padding, the centre track of the canvas's `392px 1fr 306px` workspace. The cap exists
because the third track, live stats and export, is not built yet: the bench spans two columns instead
of three, and without a cap the whole 306 px that track will take is handed to the `2.2fr` name
column by the grid. The name took 58% of the table to hold a string that fits in a third of it, while
every figure column sat at its canvas measure beside it. Capped, the name is 436 px against 502 px of
figures — the canvas's own proportion. The cap comes out when the third column goes in.

**Ruled 2026-08-22 (wave 9).** The header row is **outside the scroller**, not frozen inside it. A
sticky box is placed at a rounded device pixel while the rows beneath it move at a fractional one, so
at any scale factor other than 1 a sliver of the row behind it shows in the seam above — and nothing
painted inside the scroller can cover that sliver, because the scroller clips its own top edge. Three
attempts to close that seam from inside (a shadow above the head, a negative offset, a negative
margin with the pixel paid back as padding) each left it visible at some scale factor. The manifest
is therefore a column of two: the head, which does not scroll, and the scroller under it, which holds
every row. Canvas 1c draws the head with no ground, no rule under it and no offset — `padding:
0 12px 7px` and nothing else — which is what it can be once it is not standing in front of anything.

**Ruled 2026-08-22 (wave 8).** Nothing in the manifest is picked out in the accent but the row a
Commander is on. `CLASS` carries the same ink as the figures beside it — canvas 1c gives `4A` no
colour of its own, and a class set in amber on every one of two hundred rows reads as two hundred
rows all marked. The class and the five figures share one rung of the ramp, the canvas's 11px mono,
which is a step _above_ the 8.5px the column headings take: at the heading's rung the figures stood
smaller than their own labels, and at the metric rung they stood taller than the module names beside
them.

## The group is this manifest's rows, and its checked row is the module in the mount

**Ruled 2026-08-26 (Commander request).** Three reported faults, all of them one thing: the radio
group was not saying what it is a group of.

**The group's name is the manifest's own, not a constant.** Every row's control used to be named
`module-choice`, so every radio in the document was one group. Two mounts of the same size are
offered the same modules under the same keys, so a Commander arrowing through one mount's rows
roamed into rows belonging to another. A group is the set of options a reader chooses _between_, and
that is this manifest's rows and no others.

**A pick is about a mount as well as about a build.** The surface used to drop a pick only when the
build moved under it. But selecting a different mount spends no revision — it changes what is being
looked at, not the build — so a pick made on one mount survived into the next, and because the row
is the same row on two mounts of a size, it was still the marked one there. The control the browser
had physically checked was never written back to unchecked, pressing it fired no `change` event, and
nothing happened: the reported case of a module that cannot be fitted to a second, empty hardpoint.
It is the mount, not the row, that has to be checked, because a binding that reads the same on both
mounts is a binding Angular never writes.

**The row already in the mount is the checked row.** Opening a fitted mount already opened the right
family and already scrolled the right row to the middle of the scroller. What it did not do was say
which row was chosen: every control in the group reported unchecked, and what is fitted was carried
by that row's own ground alone. A radio group's checked option is the option currently in force, and
a mount holding a module has one.

What is drawn and what is committed stay two different things. The mark is what the list draws; the
_pick_ is a decision a Commander made, and it is what canvas 1d's `FIT MODULE` commits. Folded
together, that control would arm itself on a mount nobody had touched, and pressing it would spend a
press re-fitting the module already there.

## The cost cell carries two prices, and they do not add up

**Ruled 2026-08-22 (wave 8, refined wave 9).** The column is headed `COST`, and every row writes its
unit after its own figure, in the quieter ink. The unit is set in the **figure's own type** — same
mono, same rung, same weight, no tracking and no capitals, exactly as canvas 1c sets it. Drawn as a
tracked uppercase micro-label it came out as `CR`: a column heading that had slipped down into the
row. Where the Almanac states a Merc Coin price for an article, that price
is drawn on a second line inside the same cell, in the Merc ink, with the coin beside it.

The two figures are never summed and never traded off against each other: Merc Coin has no credit
equivalent, so a single number in that cell would be an exchange rate the game does not have
(constitution IV). Both lines are laid out on the same two-column template — the figure, then a
column of one unit's width holding `cr` or the coin — which is what lines the credit figure up with
the coin figure under it.

A row with two prices is taller than a row with one, exactly as canvas 1c draws it. It therefore
takes its own height rather than the manifest's declared one, and is **never skipped**: see below.

**The coin is glossed like every other mark on the row, 2026-08-28 (Commander request).** The
acquisition marks beside a module's name carry the row's own sentence in the design system's tooltip;
the coin beside the second price did not, so the one mark on the row that says what a figure is
measured in was the one mark a Commander could not ask about. It hangs the same gloss on the same
component — drawn on hover, on focus and on a press, never a `title`, which no thumb can reach. It
stays presentational, because the row around it is a control and a button inside a button is
invalid; the unit is already beside it in words for a reader, so the tip is a way to _see_ what a
reader is told.

## The manifest is whole, and the scroller knows how tall it is

**Ruled 2026-08-22.** No paging, no growing window, no `Showing 60 of 478`: every row the package
offers is in the DOM from the first frame. At wide width each row is drawn at one fixed height, and
rows outside the scroller are skipped with `content-visibility: auto` over a **fixed**
`contain-intrinsic-block-size` — a declared figure, never `auto`, so the scroller's height is added
up before anything is laid out and its bar is right from the first frame rather than shrinking under
the Commander's thumb.

**SC-002 is not met at the compact composition, and this rule is why. Recorded 2026-08-22.** The
manifest being whole costs what it costs: on the Panther Mk II's 478-choice mount at 390 px, the
compact list lays out and paints 478 full cards, and a keystroke settles at about 113 ms against the
100 ms SC-002 allows. Two things were measured and rejected rather than assumed.

Skipping the offscreen cards the way the wide manifest does brings it to about 84 ms, and is not
honest here: a card is as tall as its own text, so `contain-intrinsic-block-size` can only be an
estimate, and an estimate is right at one width only. Measured at 834 px the scroller's height fell
from 59,246 px to 50,539 px as the list was scrolled — the bar shrinking under the Commander's thumb,
which is the exact thing this rule exists to prevent. `contain-intrinsic-block-size: auto` behaves
identically. The repository's own `renders the whole expansion, so the scroller knows how tall it is`
catches it in all four tablet projects.

Nor is the cost Angular's. Building the list from the _results_ and hiding the unmatched rows instead
— so a query destroys and creates no views at all — was implemented and measured at both
compositions and moved the figure by less than the run-to-run spread. What is expensive is the
browser laying out and painting hundreds of cards, not the framework making them.

**What would close it** is the one thing that makes an exact intrinsic size possible: a compact card
of one declared height. Canvas 1d draws exactly that — a `min-height: 64px` row with the facts on one
mono line rather than the wrapping block of labelled cells this composition grew — so the fix is a
return to the canvas, not a departure from it. Until then the criterion is unmet at this composition
and stated as unmet.

The one row that is not that height is the row with two prices in its cost cell. A declared figure
that is wrong for even a handful of rows moves the bar as those rows are reached, which is the whole
thing the figure exists to prevent — so those rows declare nothing and are never skipped. They are a
handful out of hundreds, and their real height is counted from the first frame like every card's.

## What the revision did to SC-002. Re-measured 2026-08-25

**The compact figure is unchanged, and that is the finding.** The revision did
not touch canvas 1d's composition, so the measurement was repeated to prove it
rather than assumed. On the same machine, on the Panther Mk II's 478-choice
mount at 390px under 4x CPU throttling, the worst keystroke measured **128.9 ms
before the revision and 131.9 ms after** — inside the run-to-run spread the
series itself shows (the same keystroke came out at 100.8 ms and 112.9 ms in the
two runs). Nothing about the compact list changed, and nothing about its figure
did.

**The wide figure improves, and by about what the rail predicts.** Measured the
same way at 1440px: **104.5 ms** worst against the accordion's 128.9 ms, and
`104.5, 74.6, 45.0, 43.7, 40.1` across `m, mu, mul, mult, multi`. The reason is
the one the rail was adopted for: the first broad term used to open every family
it matched and build their rows cold, and now it selects one family and paints
that family's rows whatever the match count. This figure is recorded rather than
asserted — the timing project is Chromium-mobile-only, because the criterion is
about a phone and CPU throttling has no equivalent in the other engine, and this
revision is not a reason to add a second one.

**Both were taken on a four-vCPU container that is slower than the machine wave
10 measured on, and both exceed the 100 ms budget there.** The absolute figures
are therefore evidence about this hardware and not about the criterion; what the
pair of them is evidence about is the _change_, which is what a re-measurement
is for. SC-002 stands as the design already records it: met where wave 10
measured it, and unmet at the compact composition on the largest mount, with the
fix still the same one — canvas 1d's own `min-height: 64px` row, which is a
return to the canvas rather than a departure from it, and which is not built.
The budget is not moved to meet the measurement.

## Which manifest is drawing, and who decides

**Ruled 2026-08-25, on implementation.** The two manifests differ in their
**reveal rule** and not only in their arrangement: a rail selects exactly one
family and an accordion opens any number. A rule cannot live in a stylesheet,
and it must not live in two places — a rail drawn while the accordion's rule is
seeding the set can be handed no family to select and paint an empty pane. So
the chooser measures its own box once, publishes `data-manifest` on its host,
and the stylesheet keys off that attribute instead of taking a container query
of its own. There is one threshold rather than two, and the arrangement and the
rule cannot disagree for a frame.

**The threshold is derived, not measured off the drawing.** The pane is a
candidate row, so it may not be narrowed below the content minimum a candidate
row already declares — 22.5rem, the same figure the workspace's own composition
observer uses — and the rail is canvas 1c's fixed 216px beside it with the
canvas's 14px between them: 36.875rem. **This is lower than the 44rem the
aligned manifest used to need**, and deliberately so: 44rem was the width seven
columns took, the revision cut them to three, and at 44rem exactly the desktop
profile came out one CSS pixel above the threshold, which is a coin toss between
two manifests rather than a threshold.

The two are genuinely different questions. At 1200px the workspace is already in
its three-column composition while the bench it leaves in the middle is nowhere
near wide enough for a rail beside a pane, so the chooser is still drawing
cards. Of the five layout profiles the suite runs, the desktop and
mobile-landscape ones draw the rail and the other three draw the accordion —
which is the rule working, not a device list: mobile landscape is 844px of
width, and the chooser takes the whole of it as a layer.

**Both scrollers keep their rows' own height.** A bounded flex column gives its
items' height up before it scrolls, and the rail is exactly that. Reading the
screen in German is what showed it: `Unterflächenverdrängungsraketen` wraps to
three lines, seventeen families no longer fit in the pane's own bound, and every
row was squeezed until the names printed over one another. A scroller is what a
list does when it has more than it can show; shrinking its rows is not.

## The fieldset needs a height of its own, and the released column is how we found out

**Ruled 2026-08-27.** The manifest's scroller sits inside the `fieldset` that
carries the radio group's legend, and a fieldset lays its children out in an
anonymous box no stylesheet here can name. That box takes the fieldset's height
only when the fieldset has a **definite** one. A `flex: 1` share of a definite
parent is definite; a `max-block-size` on an ancestor whose own height comes
from its content is not.

Until 2026-08-27 the chain was definite all the way down — the bench divided a
fixed column between two panels — so nothing showed. Releasing the column for a
selected mount made the panel's height a maximum rather than a share, and the
scroller inside the fieldset stopped scrolling and simply grew: measured at
1112x834, a 680px fieldset with 1100px of rows laid out inside it.

It was invisible for one more step, because the bench clipped what overflowed
it. The release stopped the clipping too, and then the rows were painted
straight over the engineering panel below — where they answered a press meant
for a family control. So the fieldset states `block-size: 100%`, which is the
definite height its anonymous box needs, and every box in the chain is back to
the height it resolved to.

## Room under the command bar for anything scrolled to

**Ruled 2026-08-27.** The command bar is sticky over the page, and since the
workspace column releases for a selected mount, the page is what scrolls. A
family control or a candidate row brought into view by anything other than a
Commander's own thumb — the platform's `scrollIntoView`, moving focus, an
assistive technology — then landed flush against the top of the window, which is
behind the bar: measured at 1112x834, a family control at 0-44px under a bar
reaching 74px, with the bar answering the press meant for the control.

Both carry `scroll-margin-block-start: var(--edsb-layout-bar-height)`, which is
the reservation `.frame__main` already makes for an in-page link, made here for
the two things in this list that get scrolled to.

`scroll-margin` cannot be told which scroller it is for, so the reservation is
paid inside the manifest's own scroller as well — where nothing stands over the
row, because the sticky family bar went with the accordion's seam in wave 9. The
price is a lead-in of the bar's height on a scroll nobody made with a thumb, set
against a control that would otherwise be behind the bar and unpressable. It is
worth stating as a trade rather than dressing up as a second bar.

## The scroller is a containing block, or it clips nothing

**Ruled 2026-08-25.** Every manifest row carries text drawn only for a reader, positioned out of the
page the standard way. An absolutely positioned box resolves against the nearest _positioned_
ancestor, so in a scroller that is not one the box's containing block is whatever is positioned above
the bench — the bench's own clipping never reaches it, and four hundred of them run the document down
past the screen with nothing visible on it. Measured at 1112x834: a workspace whose three columns each
end at the foot of the window, inside a document 1623 px tall that scrolled 789 px through blank
ground. The ledger's rail already states this rule in its own stylesheet; the manifest's scroller and
the engineering editor's now state it too.

Two dozen pixels of that document survive it, and are not this: at that viewport the middle column
has 760 px for plates that ask for 349 and a bench that will not go under its own declared 26rem
minimum. That is the column being asked to hold more than it has, which is a composition question
and not a clipping one.

## Module families

**Ruled 2026-08-23 (wave 10), amended 2026-08-25.** Both canvases were redrawn around families, and
both are adopted. Canvas 1d draws them as an accordion under a `FAMILIES` heading with its own
`5 · 24 FIT` counter, a fitted-module block pinned above it under `FITTED HERE`, and one family
open. **Canvas 1c no longer draws an accordion**: since the 2026-08-25 revision it draws a family
rail beside a variant pane, with exactly one family selected and no caret at all — see "The wide
manifest is a rail and a pane" above.

### What exclusive selection does to FR-021, FR-022 and FR-023

**Ruled 2026-08-25.** The three requirements were written when both canvases drew an accordion, so
all three are worded in "open" and "closed". A rail has neither: it has one selected family, always,
and a pane that is never empty. The requirements are restated in terms both compositions satisfy —
_revealed_ is the accordion's open family and the rail's selected one — and one consequence follows
that has to be written down rather than smoothed over:

- **FR-021's "every other family closed" has no rail form, and needs none.** Revealing exactly one
  is what a rail does by construction.
- **Where no available family holds the fitted choice, the rail selects the first family in package
  order and the accordion opens none.** This is not a substitute chosen by this application: the
  canvas's rail always has a selection and always paints a pane, and an empty pane beside a full
  rail is a state it does not draw. The accordion's "all closed" is unchanged, because the compact
  canvas does draw that.
- **FR-023's screenful rule is compact-only, and always was in effect.** Its purpose is to keep a
  broad search from painting several hundred cards in one keystroke; the rail cannot do that at any
  match count, because it paints one family's rows whatever the search matched. At wide, a search
  narrows the rail to the families holding matches and selects the first of them. At compact, the
  twenty-five-choice rule stands exactly as measured.
- **A family holding a match is never absent at either composition.** That is the part of FR-023
  that mattered, and neither composition weakens it.

**The family is the Almanac's, not ours.** `@elite-dangerous-almanac/core` 0.1.7 gives every module
an `OutfittingModuleIdentity.familyId` and publishes a localized name for each of the 77. That is the
grouping, and it is the only thing that reproduces the canvas: canvas 1c's Plasma Accelerator family
holds both `Plasma Accelerator · Fixed` and `Plasma Accelerator · Advanced`, and the second is a
pre-engineered variant with a different package name of its own. Grouping by displayed name — which
is what the shipped `CandidateGroup` does — splits that family in two.

**The package's own words ship, including where they read oddly.** The Almanac writes families in the
plural, `Multi-cannons`, where the canvas letters them `Multi-Cannon`. The canvas's casing is a
mock-up of a value the package now supplies, and constitution II settles which one is on screen. The
19 of 77 families the package has not yet named outside English fall to the canonical English name
with the untranslated disclosure module names already use; there is no local table for them.

**Withdrawn: the standard and unique-reward sections.** Neither canvas draws them any more. A reward
is marked where it sits — canvas 1c puts a `REWARD ONLY` chip on `Plasma Accelerator · Advanced`
directly under the ordinary article it is built on — so the heading has nothing left to say that the
row does not. Every FR-006 label survives unchanged; only the level of the tree that carried them is
gone. Sorting no longer has a section key, and `CandidateSection` narrows to being the input the
`uniqueReward` label is projected from.

**Withdrawn: the two-letter family badge.** Canvas 1d draws `MC`, `PA`, `BL`, `CN`, `FC` in a filled
square beside each family name. The Almanac publishes no abbreviation, and any rule that produces
`MC` from `Multi-cannons` is this application shortening game text — a private naming rule in a two
character box, and one with no answer at all for the 19 families whose only name is English. The
square is not drawn. The family name, count and caret carry the row.

**Withdrawn: the family summary line.** Canvas 1d writes `6 VARIANTS · 15.1–28.4 DPS · 4.46 MW`
beneath each family name. The count survives — it is a count of package records. The DPS and power
ranges do not: a min–max across a family is an aggregate the Almanac does not publish, drawn from
figures that are `null` for any choice the package has no stats for, and a range whose ends come from
two different articles invites a comparison neither of them supports. The count stands alone.

**What this does to SC-002. Measured 2026-08-23, and with one rule added it is met at last.** With
one family open the compact composition lays out that family's rows and one control per family
instead of all 478 cards. On its own that was not enough: opening every family a search matched moved
the cost rather than removing it, because the first letter of a broad term matches nearly everything
and built several hundred cards cold in one keystroke — 538.7 ms on the Panther Mk II's 478-choice
mount at 390 px under 4x CPU throttling, against the 113 ms the sectioned list recorded on
2026-08-22 and the 100 ms the criterion allows.

**Ruled: a search opens what it matched only up to a screenful, twenty-five choices.** Above that
every family stays closed, each still stating how many of the matches it holds. A search that matched
three hundred choices has not answered anything a Commander can read; what they can read is which
families hold them and how many, which is the same information the closed list already carries. So
the rows are not drawn, and the Commander narrows the term or opens the family they meant. FR-023 and
SC-008 are amended to this rather than the rule being bent around them: a family holding a match is
never absent at either size, which is the part that mattered.

**Scoped to the compact composition on 2026-08-25.** The wide manifest is a rail with one pane and
cannot paint hundreds of cards at any match count, so the twenty-five-choice rule is the compact
composition's and the measurement above is the measurement that matters for it.

Measured with that rule, `m mu mul mult multi` settles at **50.4, 56.8, 33.0, 33.6, 33.5 ms** —
three consecutive runs at 59 ms worst or better, against a 100 ms budget. **SC-002 is met at the
compact composition.**

The diagnosis recorded above is unchanged and still the reason this works: what is expensive is the
browser laying out and painting hundreds of compact cards, so the fix that counts is painting fewer
of them. The one declared compact card height canvas 1d draws is still what a list of _open_ rows
would need, and is still not built. The rule above is unchanged too: whatever is open is whole — no
paging, no growing window — and the scroller still knows its own height.

## Acquisition icons

**Ruled 2026-08-23 (wave 10).** Canvas 1c was redrawn again and the `REWARD ONLY` chip is gone from
it: where a row carried that chip it now carries a small icon naming the _route_ the article is
earned through — `community-goal.svg` on `Beam Laser · Gimballed`, `powerplay.svg` on
`Plasma Accelerator · Advanced`. The icon is adopted and the chip is withdrawn with it. "You cannot
buy this" is the smaller half of what "this is a community goal reward" already says, and the chip
was only ever short for a sentence that is still beside it.

**Both icons ship. Powerplay is keyed on the entitlement, not on a route.** The Almanac publishes
four acquisition routes — `mercenary`, `communityGoal`, `techBroker`, `eventReward` — and Powerplay is
not among them, which is why an earlier pass here recorded the icon as undrawable. That was looking
in one place only. Powerplay is published, on the other axis: an `OutfittingModule.entitlement` of
`ELITE_SPECIFIC_V_POWER_*` names it, and 0.1.7 carries twelve of them — `Advanced Plasma Accelerator`
among them, which is the article the canvas draws the icon on. The rule is the token's own prefix and
no table of game data: the application decides nothing about which articles are Powerplay rewards, it
reads the entitlement the package already states. A Powerplay entitlement takes the icon and its own
sentence; every other entitlement keeps the generic sentence with the raw token, unchanged.

**`techBroker` has a mark too, and it was missed.** Canvas 1c draws
`edassets.org/static/img/misc/tech_broker.svg` beside `Cannon · Gimballed`, at the same 14px and in
the same place as the other two route icons. An earlier pass here read only the files under
`.design/assets/icons/` — where the community-goal and Powerplay marks live — and concluded the route
had none, then wrote down the consequence as the canvas's to accept: that a tech-broker row stands in
its family beside the stock article it was built on with nothing to tell them apart, and reads as
absent. The row was never absent — every package variant is emitted and counted — but it was
unreadable, and the fix was in the reference all along. The file is vendored under the reference
review's **Icons** ruling; see there for the origin and the canvas's own recolouring filter.

**`eventReward` alone is marked in words only.** It has no mark anywhere in the reference, so it gets
none here; its sentence is unchanged and is what a reader is given either way. `mercenary` already
had its own mark, the Merc Coin, and keeps it. This is the same floor the rest of this component
works to: the drawn markers are a subset of the spoken ones, never the other way round.

**The 2026-08-25 revision hung a description on each mark, and it confirms the words already
shipping.** Every acquisition icon in the revised canvas carries a `data-tip` — `Merc Coin purchase`,
`Tech Broker unlock`, `Powerplay module`, `Community goal reward` — shown on hover. Nothing changes
here: hover-only meaning is unreachable by touch (011 FR-006), and this component has carried the
same four routes as spoken sentences beside the mark since wave 10. The revision is evidence that
those sentences are the right words, not a new element to build. The drawn markers stay a subset of
the spoken ones.

**Amended 2026-08-26 (Commander request): the tip is drawn after all, as the sentence itself.** The
2026-08-25 reading is still right about what a tip may not be — the only carrier of a meaning — and
that is exactly why it can now be added. Neither the ledger row nor the manifest row draws the
sentence, so on those rows the mark stands alone with no way to ask what it is; a Commander who can
see the icon and cannot see the words had a mark and no question. Each mark now carries the row's own
sentence as its `title`, so hovering shows the same words a reader is already given. It is the
sentence and not a shorter phrase beside it: one restriction, one wording, whether it is drawn,
hovered or read. The mark stays presentational with its `alt` empty, so the tip adds a way to see the
sentence and never a second announcement of it, and the sentence stays in the accessibility tree
whether or not a pointer ever reaches the icon — which is what 011 FR-006 asks and what the hover
adds nothing to.

**Amended 2026-08-27: the tip is the design system's own, and a short gloss rather than the
sentence.** See the acquisition-badge component for the wording of each; the sentence stays beside
the mark for a reader, and the tip says what the _icon_ is for an eye that has just landed on an
unfamiliar one.

**Corrected 2026-08-29 (Commander request): the bubble is raised into the top layer, because a
manifest row cuts everything drawn inside it.** The gloss was built, hung on the right mark, opened
by hover, focus and press — and on the fitting manifest not one pixel of it reached the screen.
Three boxes cut it, and each on its own is enough: the row declares `content-visibility: auto` so
the rows a Commander has not reached are not laid out, which is paint containment and clips every
descendant to the row whatever its `z-index`; the identity cell hides its overflow to cut a name too
long for its column, and cuts the bubble with it; the pane is a scroller and cuts what reaches its
edges. Measured at 1440x900: a bubble at full size, at the right coordinates, painted under the row
below it.

None of the three is wrong. A manifest that lays out four hundred rows it is not showing is the
defect the containment exists to prevent, a name that wraps is the defect the cut exists to prevent,
and a list that is longer than its pane is what a scroller is for. So the bubble is raised out of all
three instead, into the platform's own top layer, for as long as it is drawn — it does not move in
the document, so it stays this host's child, `aria-describedby` still resolves to it, and a pointer
travelling from the mark to the bubble still has not left the host, which is what keeps SC 1.4.13's
"hoverable" true. The placement is set from the trigger's own box; the distance it stands off by, and
the inset that keeps it inside the viewport, stay in the token layer. Where the platform has no top
layer the bubble is drawn where it is written, which is what every placement outside a cutting box
had anyway.

The mark's gloss is now asserted as _painted_ rather than as present: `toBeVisible` reports a box
with a size and a position, which is exactly what a clipped bubble has.

**The mark sits on the name's own line, in the ledger as in the manifest.** Canvas 1c draws the
fitted `Advanced Plasma Accelerator` with its Powerplay mark 7px after the name and the
`FIXED · 51.7 DPS · 1.97 MW · 24.0 t` code line under both. The ledger row therefore projects the
marker into the identity badge rather than placing it after the badge, where it fell under the code
line and made a third line the canvas does not have.

## Narrow and 400%-zoom composition

- Full-screen layer inspired by canvas 1d with associated title/slot description and back/cancel.
- Sticky or persistent labeled search and textual result count.
- Choices become semantic cards preserving family order and every label, beneath **the accordion
  canvas 1d still draws**. Since the 2026-08-25 revision the wide composition's family control is a
  rail rather than a disclosure, so the two are no longer the same control: this is the composition
  that keeps the caret, the open/closed state and the screenful rule.
- The DPS, mass and power figures the wide manifest no longer draws survive here, on canvas 1d's own
  code line under the module name — which that canvas did not change.
- Canvas 1d's `FITTED HERE` block stands above the family list, showing the module currently in the
  mount. It is the same fitted row the family list marks `FITTED`, drawn twice on purpose: at 390 px
  the family holding it may be scrolled far below the fold.
- A choice expands/selects with native radio/button semantics; a separate full-width fit action
  confirms the decision.
- Background workspace is inert while the layer is open. Closing it returns to the same selected slot
  without build/history change.

## States

| State                | Required presentation and behavior                                                                                                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading/rebuilding   | Existing committed build remains visible; chooser is busy and cannot fit stale records.                                                                                                                                    |
| Ready                | All and only current package choices, ordered and labeled.                                                                                                                                                                 |
| Search results       | Every term matched against name/class/rating/mount; result count announced politely. Every family holding a match is present and counted, open where the match set is within a screenful; families without one are absent. |
| Family toggled       | One family opens or closes. No build revision, no history step, no rebuilt index.                                                                                                                                          |
| No matches           | Retain query, explain no match, expose clear action; no empty-slot ambiguity.                                                                                                                                              |
| Empty package result | Explain no replacement offered; this is distinct from search no-match.                                                                                                                                                     |
| Stale revision       | Discard selection, rebuild from current loadout and explain that choices changed.                                                                                                                                          |
| Fit success          | Commit once, close/return to selected slot, refresh every package result, add one history step.                                                                                                                            |
| Structured refusal   | Localized code/constraint/params; keep active build/history; rebuild choices.                                                                                                                                              |
| Removable            | Explicit remove action and package consequences; one successful decision.                                                                                                                                                  |
| Non-removable        | Reason visible; remove absent.                                                                                                                                                                                             |

## Candidate facts and labels

- Stock/variant status is textual.
- Package localized module name is primary; class, rating and mount are separate values.
- Variant purchase grade is never labeled as current ordinary grade.
- A fitted row is matched on the **whole variant** — name, blueprint and grade — not on the module
  symbol alone. A stock article and its pre-engineered variant share a symbol, and two rewards can
  share a variant name, so anything less marks two rows fitted for one fitted module (wave 4).
- Community-goal/event-reward choices sit in the family of the module they are built on, marked on their own row.
- Mercenary/tech-broker variants show route plus not-ordinarily-available.
- Entitlement adds another label and does not replace acquisition.
- Missing translation uses canonical package text plus untranslated disclosure.
- Search still covers only the package-localized module name, class, rating and mount. A family name
  is not a fifth search field: a term that matches a family but no row inside it would open a control
  in front of nothing.

Do not show invented suitability rankings, “recommended” badges, inferred compatibility, local
comparison deltas or design-mock purchase labels. Choosing a package record is not proof it can still
fit after another tab/component edit; the detached transaction remains final authority.

## Accessibility and performance

- Search has visible label/instructions; result count is a polite live region; no-match is a status,
  not just blank content.
- Family controls describe list structure: each publishes its name, its current choice count and its
  revealed state programmatically, not by glyph or ground alone — `aria-expanded` on the compact
  accordion's disclosure, and the selected-state attribute on the wide rail's row, whose amber ground
  and left rule are otherwise the whole difference between it and its neighbours. Selected state and
  acquisition restrictions are text/programmatic, not border/icon/color only.
- A family control is a real control at every width: at least 44 CSS px of target, operable by touch
  and pointer, and not part of the `DENSE_TARGETS` exemption.
- Candidate action names include module form and class/rating context needed to distinguish choices.
- Targets are at least 44 CSS px, except the dense inline chips the canvas itself draws small — a
  ledger row's power cell is 20px there, and forty rows of a 44px chip is a different interface.
  Those clear the WCAG 2.2 Target Size (Minimum) floor of 24 CSS px instead, and the exemption is a
  named list
  (`DENSE_TARGETS`), never a loosened baseline (wave 4).
- Browser input-to-result DOM update stays below 100 ms for the installed package's largest choice set.
- Axe/semantic/no-overflow tests cover full, searched, no-match, empty, stale and refusal states at all
  browser/viewport combinations.
