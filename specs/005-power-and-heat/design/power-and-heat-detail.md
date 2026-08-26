# Screen Design: Power and Thermals

**Route**: existing `/build`
**Reference**: canvas 1c's `data-anat-detail="power"` and `data-anat-layer="power"`, canvas 1d's
`data-m-mode="power"`, and the `POWER` block of canvas 1c's 306 px status rail
**Rulings**: [reference-review.md](./reference-review.md), wave 12; feature 003's wave 11 A–C

> **Rewritten 2026-08-23 (wave 12).** The original screen assembled a `powerAndHeat` detail
> capability behind a workspace selector, reusing feature 003's viewing-condition control and
> publishing a `StatusProvider` bundle. Feature 003's rulings withdrew the selector, the target and
> the control, and reassigned the conditions here. What is left is the surface the canvases draw.
>
> **Rewritten again 2026-08-24 (wave 13).** The build that followed the wave 12 rewrite was
> rejected on review: it had drawn its own reading of the artboard rather than the artboard. This
> document now records what the canvas draws, block by block, and the repository owner's review
> notes where the two met. Where this document and `.design/Ship Builder.dc.html` disagree, the
> artboard is right and this document is the thing that is wrong.

## Where it lives

The anatomy region's mode strip already draws five segments. `MOUNTS` is feature 010's;
this feature enables `POWER`, which:

1. retitles the region `POWER & THERMALS` (canvas 1c's own `titles` map) — a title and nothing
   under it, because a title is all the switching script carries per mode;
2. replaces the plates with the dashboard.

The canvas's switching script sets `[data-anat-plates]` to `display: none` for every mode but
`mounts`, so the plates leave the region in this mode and their side selector and legend leave with
them. The artboard does author a `data-anat-layer="power"` overlay drawing `P1` and `OFF` on the
mounts, but the container holding it is hidden in this mode, so nothing ever reveals it: the
overlay is not built.

Nothing about the switch touches the route, the fragment, history, storage or the active build.

## Information order

The canvas's order, at every width:

1. `PRIORITY GROUPS` · `CUMULATIVE DRAW`, holding the `DEPLOYED` / `RETRACTED` conditions, the
   bands, and the plant/draw summary under them;
2. `DRAW BY MODULE`;
3. `HEAT PROFILE`;
4. `POWER DISTRIBUTOR & PIPS` (renamed from `POWER DISTRIBUTOR & PIP ALLOCATION` by the 2026-08-25
   canvas revision).

Each of the four is a bounded plate on the panel ground, and they are all the same plate:
`1px solid var(--amber-a2)` over `var(--panel)` at `16px 18px`.

The arrangement is **two rows of two, corrected 2026-08-26 (Commander request)**. Canvas 1c draws
two sibling two-column grids: 1 and 2 in the first
(`grid-template-columns: 1fr 1fr; min-height: 328px; align-items: stretch`), 3 and 4 in the second
on the same two columns (`grid-template-columns: 1fr 1fr; margin-top: 12px; align-items: stretch`).
This was read as a two-column row over two full-width blocks, and the `margin-top: 12px` quoted for
block 3 belongs to the second grid rather than to a full-width block. Built that way the distributor
stood a whole panel below the fold of a region bounded by the column it sits in — a Commander opening
`POWER` found the module list and nothing under it.

The pairing opens at the wide step rather than the medium one, because a pair is only a pair while
both halves can hold what is in them: at the tablet column's 442px each block came out at 209, which
is narrower than the medium minimum a single block is held to, and the distributor's five columns
and the heat scenarios' names were both wrapping a word at a time. Below the wide step all four
stack, which is canvas 1d's arrangement. Each pair is stretched so its two plates square
up against each other, and no further: the canvas's `min-height` is a measurement of its own sample
build, and holding a real one to it rules a plate off around empty ground (review note, wave 13).
Canvas 1d stacks all four.

The heat block measures itself rather than the panel around it, because half of a wide panel is not
a wide block: whether its bars and its tiles stand side by side is a question about that box, and
asking the panel's width instead split a plate too narrow to be split. Which arrangement appears is decided in CSS from the space the region is given, so 400% zoom
and an expanded translation choose the stacked one for the same reason a phone does. The DOM order
is the list above at every width.

**Its split opens at the wide step too, corrected 2026-08-26 (Commander request).** It opened at the
medium step, and 24rem is not a wide box: a 430-pixel phone hands this block about 25rem, so on a
large phone the bars stood beside the tiles — two columns of about 12rem each — while the four power
blocks around them, held to the wide step since wave 13, correctly stacked. Neither canvas draws it
split at that width, and canvas 1c does not draw it split at any width; the split is this
application's use of a genuinely wide box, so it is held to the width that makes it one. The same
correction applies to `DRIVES & MASS`, `DEFENCE` and `OFFENCE`, which paired at the medium step for
the same reason and are recorded with it in
`specs/002-module-outfitting/design/outfitting-workspace.md`.

## The conditions

Two segments, `DEPLOYED` and `RETRACTED`, **inside the priority groups block** — the canvas sets
`PRIORITY GROUPS` against `CUMULATIVE DRAW` on the header line and puts the pair on the line below,
hard against the leading edge (`align-self: flex-start`), behind a visible `H‑PTS` label.

**The label became visible on 2026-08-25.** The canvas revision of that date put `H‑PTS` in front of
the two segments on both canvases — a quiet mono micro-label, `500 9px`, the same rung the block's
own micro-labels take. It says what the pair switches, which two verbs on their own do not; the
group's accessible name is that label rather than a hidden string beside it. It is a small control that switches the
figures in that block, not a banner governing the panel. Operated as the design system's segmented
control; deployed is selected until a Commander chooses otherwise. There is no draft, no Apply, no
Reset and no error state: the artboard draws none, and a selection that takes effect immediately
needs none.

Pips belong to the distributor block, where the canvas draws them.

## Priority groups

A row per priority band **this build puts something in**, in the package's returned order. The game
has five groups and `powerBudget()` returns five whatever is fitted; a group nothing is assigned to
is not a reading of this build, and an empty row saying `0.00 MW` about it is a row about nothing.
Membership is where a mount sits, not what it happens to be drawing, so a group holding one weapon
keeps its row with the hardpoints stowed. `bandVerdicts` still carries all five, because a mount
asking which group it is in asks about the game's five.

| Column          | Package field                                                  |
| --------------- | -------------------------------------------------------------- |
| `GRP n`         | `bands[i].priority`                                            |
| own draw        | `bands[i].deployed` or `bands[i].retracted`, by selected state |
| cumulative draw | `bands[i].deployedTotal` or `bands[i].retractedTotal`          |
| powered verdict | `bands[i].poweredDeployed` or `bands[i].poweredRetracted`      |

The canvas's four columns are drawn as the canvas draws them: the group, its own draw, the track
the cumulative share fills, and the share itself. The columns belong to the **list**, not to each
row — the canvas fixes each one's width (`width: 78px; flex: none` on the draw, `74px` on the
reading) so that every track starts and ends on the same two lines. Here they are subgrid tracks
instead of pixel widths, which holds the same alignment while letting a longer figure or an expanded
translation size the column rather than be cut off by it. `DRAW BY MODULE` and the heat bars share
the same treatment, and the heat caption sits in the track's own column so its offset is a share of
the track it names. The share is `cumulativeDraw / available`, a
division the package does not publish, so it is worked out once in the projection and read from
there — the ownership policy holds every such combination to `src/app/domain/power-heat`. A plant of
zero has no share to state rather than an infinite one.

`OFFLINE` replaces the percentage on a shed row, which is what the canvas puts there. It is the
reading rather than the bar's colour, so a reader who cannot see the fill still gets it. The shed
row's bar is hatched at 135 degrees, exactly as the canvas hatches the shed length of its own
cumulative bar — a pattern rather than only a hue, so the two lengths are told apart by a reader who
cannot tell amber from red. `DRAW BY MODULE` hatches a line in a shed group the same way.

**The bars are additive, corrected 2026-08-26 (Commander request).** The column beside them says
`CUMULATIVE DRAW` and the percentages climb, so each row states its own draw and the running total
both. The build drew one solid length to the running total, which said the total twice and never
said what the row added. The canvas draws two lengths on one track instead: a wash to where the
groups above this one end, then this group's own draw solid on the end of it. Both are shares of the
whole demand rather than of plant output — which is why the bar and the percentage beside it
disagree, `GRP 1` being sixty per cent of the plant and half of the track — and the two shares are
published as `precedingShare` and `ownShare` rather than worked out in the component.

A one-pixel mark stands on every row where the plant runs out, at the same place on each: the
projection measures the rows and the rail's own bar on one track, so `PowerDrawBar.plant` is that
position and the group whose length crosses it is the group the plant ran out on. It carries no
words — the labelled `31.20 MW PLANT` line the canvas sets across the bars is still **not** drawn
(review note 2), and the tile beneath says the figure.

### The summary under it

The canvas sets three tiles under the bands, and those three are what is drawn: `PLANT OUTPUT`,
`POWERED DRAW`, `UNPOWERED`.

| Tile           | Figure                                                        |
| -------------- | ------------------------------------------------------------- |
| `PLANT OUTPUT` | `available`                                                   |
| `POWERED DRAW` | the selected state's total less what the dark groups draw     |
| `UNPOWERED`    | what the dark groups draw between them, in the selected state |

The last two are readings of the package's own fields rather than fields, and both are worked out
in the projection. No condition is printed under them: the control that decides which state they
were read in stands a few lines above them in the same plate.

`headroom`, `utilisation`, `withinBudget` and any verdict drawn from them are **not** tiles here.
The canvas draws three and names none of those three that way.

Since none of the three is drawn, none is read: the projection does not take them, so nothing
downstream can blank, dash or zero one, and there is no retracted equivalent to explain the absence
of. The package's `Infinity` utilisation on a build drawing with no plant output goes with them —
that build states a plant of `0.00 MW`, the whole demand in `UNPOWERED`, and no percentage at all.

## Draw by module

One line per **kind** of consumer, heaviest draw first, exactly as the canvas lists it: the name,
a bar drawn to that line's share of the heaviest line, and the draw hard against the trailing edge.
**Re-laid on 2026-08-25.** The header carries the block name alone. The list is headed by its own
column row — `MODULE` against `MW`, over the same tracks the rows use, with the bar column unheaded
because it holds no figure — and closed by a `TOTAL DRAW` row carrying the whole list's draw. The
`MW · TOTAL n` note that used to sit in the block header is withdrawn: the unit moved to the column
head and the total moved to the foot, which is where a total that a reader adds up to belongs.

Canvas 1d writes the same two figures as a footer pair, `TOTAL 37.44 MW` and `POWERED 29.64 MW`.
Only the total is built. `POWERED` is already the priority-group block's own `POWERED DRAW` cell,
three blocks up the same stack, and drawing it twice states one package figure as two readings.

The canvas aggregates identical weapons into `Large Beam Laser ×2`, and that **is** built: the
canvas writes one line per kind and the count after the name. Mounts of the same module in
different priority groups stay apart, because the group is part of what the line says, and a
consumer the package gave no symbol keeps its own line because it cannot be told apart from another.
The canvas's compact `TOP DRAW` truncation to five rows is not built: every line is drawn at every
width.

Every line states what it draws **in the state being read**:

- a `deployedOnly` mount reads `0.00 MW` with the hardpoints stowed (review note 6);
- a mount switched off in the outfitting panel reads `0.00 MW` and says `· Off` (review note 7).

Both stay on the list, because a mount that vanishes when a condition changes is the one case a
reader cannot account for. Both read zero because zero is what the package counts them as, and so
each state's list adds up to that state's own total rather than to the deployed one twice.

A line whose group the plant leaves dark is dimmed, its bar hatched, and its group named on the line
as `· GRP n` — the canvas carries that state by dimming alone, and a state carried by opacity is a
state carried by nothing a reader can name.

## Heat profile

One box split down the middle: the bars and the caption belonging to them on one side, and on the
other the key **over** the four tiles in a column of equal width. **The key moved on 2026-08-25**:
the canvas revision of that date lifted `WITHIN LIMIT` / `OVER THRESHOLD` out of the foot and put it
at the head of the tile column, so the two fills are named before the bars beside them are read
rather than after. Every grid position is stated, because leaving
the tiles to auto-placement puts them under the bars the moment the left column takes two rows
(review note 5).

The bars are the canvas's own, in its order — `Idle · retracted`, `Cruise · full throttle`,
`FSD charging`, `Weapons alpha`, `Sustained weapon fire`, and the shield-bank spike. The first five
are the package's `idle`, `thrusters`, `fsdCharging`, `firingDrained` and `firingSustained`; the
alpha-strike case is `firingDrained` by the package's own words rather than by the artboard's
figures.

The track runs past 100%: the canvas draws its threshold line at `left: 62.5%`, which puts the scale
at 160%. Amber to the threshold, hatched beyond it — the hatch is what tells the two fills apart for
a reader who cannot tell amber from red, and the key names both in words as well. A build hotter
than 160% widens the scale rather than overflowing the track.

The four tiles are `RESTING HEAT`, `PEAK SUSTAINED`, `DISSIPATION` and `HEAT SINKS`, with the
canvas's `2 x 3` under the count where the launchers all carry the same number. `100% MODULE DAMAGE`
captions the threshold line, and `WITHIN LIMIT` / `OVER THRESHOLD` are the key.

**Each bar carries a description, added on 2026-08-25.** The canvas revision gave every scenario row
a `data-tip`, and the six read: `Hardpoints stowed, no throttle` · `Full throttle, hardpoints
stowed` · `Heat while spooling the frame shift drive` · `Every weapon fired at once in a single
volley` · `Trigger held down continuously` · `Heat spike from activating a cell bank`. They say what
the package's five scenario names are shorthand for, which is the one thing a scenario name does not.

The canvas hangs them on hover. This application does not: hover-only meaning is unreachable by
touch (011 FR-006), and a scenario is not something a Commander should have to point at to
understand. Each description is drawn beside its own scenario name, in the quieter ink, and read
with it. They are this application's own strings — the package names its scenarios and does not
gloss them — so they go through the localization layer like every other owned string.

Each bar carries all five `HeatState` fields' meaning: `thermalLoad`, `heatLevel`, `gauge`,
`overheats` and `secondsToOverheat`.

Two package sentinels, each only ever on its own field:

- `heatLevel` or `gauge` of `Infinity` — the load never settles. It reads as `∞`, the symbol for
  the level it has, with the sentence it stands for carried beside it for a reader who is told the
  value rather than shown it (owner's ruling, wave 13);
- `secondsToOverheat` of `null` — it never overheats.

Each is read off its own field and neither is inferred from the other: a scenario that settles
carries a finite heat level and, in the profiles observed, `null` seconds to overheat, while one
that does not settle carries `Infinity` and a finite climb. The screen states what each field says
rather than deriving one from the other. Neither is drawn as a number, a glyph or a clamped
percentage.

`heatMetrics()` returns `null` for a build with no powered plant. That is one unavailable group. No
hull figure and no catalogue figure stands in for it.

## Power distributor and pips

Headed `POWER DISTRIBUTOR & PIPS` since the 2026-08-25 canvas revision, which shortened the name.

The canvas's table, whole: a `BANK` column and `CAPACITY`, `MAX RCH`, `PIPS` and `RECHARGE` across
`SYS`, `ENG` and `WEP` in that order.

| Column     | Package field                                         |
| ---------- | ----------------------------------------------------- |
| `CAPACITY` | `capacity`                                            |
| `MAX RCH`  | `ratedRecharge`                                       |
| `PIPS`     | `pips.systems` / `.engines` / `.weapons`, as returned |
| `RECHARGE` | `rechargeRate`                                        |

The block's header carries the heading and nothing else. **The fitted distributor's identity —
the canvas's `8A · CHARGE ENHANCED G5 · SUPER CONDUITS` — is withdrawn**, because the 2026-08-25
canvas revision removed it from the drawing. There is no table caption either: the heading a few
lines above already says those words, and a table repeating its heading is the heading twice
(review note 8).

The `PIPS` cell is the canvas's four blocks, and it is the control. The six pips are the ship's own
rule rather than three independent dials: six between the three banks, four at most in any one, and
a **whole** pip assigned at a time. Setting one bank takes the pips out of the other two at half a
pip each — from `2 · 2 · 2`, three in systems leaves `1.5` in each of the others (review note 5 of
the first pass, and the owner's ruling of 2026-08-25). A bank with nothing left to give pays nothing
and the other pays the whole of it, so from `1 · 4 · 1` four in systems gives `4 · 2 · 0`; taking
pips back runs the same rule backwards, all of it going to one bank where the other is already full.
Pressing the block a bank already stands at gives the pip back. A block is filled from its leading
edge, so a bank standing on a half fills half a block, and no block stands for a bank at 1.5 pips.

**Each block holds the 24px target floor, corrected 2026-08-26 (Commander request).** The canvas
draws one at `flex: 1` by `height: 16px` — a chip in a row of four, not a button standing on its
own — and four at the project's 44px design baseline came out a strip wider than the rest of the
table's figures put together. `.pips__step` is recorded on `DENSE_TARGETS` in
`e2e/accessibility/assertions.ts` beside the ledger's power chip and the segmented strip, which
holds it to WCAG 2.2 SC 2.5.8's floor: the floor, not a waiver, and the canvas's own 16 pixels stay
unbuilt. The blocks share the cell between them and no more of the row than that, so the recharge
figures beside them keep their room (review note 9), and the table scrolls inside its own bounded
scroller if even the floor no longer fits.

Displayed pips come from the result, not from what was pressed. Capacity and rated recharge are
properties of the fitted distributor and do not move. Zero pips is a genuine zero recharge and reads
as one.

### Three lines to a bank where five columns do not fit (2026-08-26)

Five columns do not fit a phone. `SYS`, a capacity, a rated recharge, four pip blocks at their
24-pixel floor and a recharge come to about 380 pixels before the text is scaled at all, and a
430-pixel phone gives this block about 400 — a 390-pixel one about 360. Built as one table at every
width it met a Commander sideways in its own bounded scroller, with the control they came for off the
end of it, and the screen inventory's long-standing promise of "the same five fields per bank,
stacked" had never been built. That is the report of 2026-08-26.

Canvas 1d does not draw a table here. It gives each bank the bank's name against its recharge, the
four blocks across the full width below them, and stacks the three banks. **The narrow arrangement is
that, plus the two readings the artboard drops**: `CAPACITY` and `MAX RCH` go on a third line, each
beside its own column name, because this application keeps every field at every width and a figure
whose header row is off screen has to name itself. The extra names are `aria-hidden` — the header row
is still in the accessibility tree, so a reader who met both would meet the column name twice.

**Every table role is written out.** The narrow arrangement lays a row out as a grid, and a `display`
other than the table ones takes the implicit roles with it: the rows, the cells and the row headers
would all leave the accessibility tree, and with them the column each figure belongs to. `role="table"`,
`role="row"`, `role="columnheader"`, `role="rowheader"` and `role="cell"` are stated, so the table is a
table at both widths and only its drawing changes.

**Which arrangement appears is asked of the block, not of the device.** The threshold is 30rem — the
width five columns need at a size they can be read at — so a doubled text size steps down to the
stacked arrangement for the same reason a phone does, and a half-panel too cramped for five columns
takes it at any screen size. The canvas's own table fits its half-panel because the canvas draws a pip
block 16 pixels wide; this application draws it at SC 2.5.8's 24-pixel floor, which is 38 more pixels
across the four, and that is the difference between a table that fits a cramped column and one that
does not.

**The block is its own component** (`outfitting/distributor-block`). The table, the four pip blocks
and the arrangement that stacks them were a third of the dashboard's stylesheet — enough of it that
the panel crossed the project's 10kB per-component style ceiling when the stacked arrangement was
added — and none of the panel's other three blocks touch any of it. It is presentation only: the rows
arrive already formatted and a press leaves as intent, so the one pip condition stays where it lives.
It is feature 005's own source and is fenced as such in `scripts/policy/power-heat-ownership.mjs`.

Canvas 1d heads this block `PIP ALLOCATION` and sets `DISTRIBUTOR 8A` beside it. Neither is built.
The name was settled by the 2026-08-25 revision at `POWER DISTRIBUTOR & PIPS`, and one block with two
names across two widths is worse than either name; the identity was withdrawn by that same revision
and 1d's short form does not reopen it. Canvas 1d's foot line — `3 · 1 · 2 PIPS` and
`WEP DRAIN 6.4 MJ/s · NET −0.6` — is also unbuilt: the pip triple is the three rows read across, and
the weapon drain is feature 007's reading of the weapon capacitor, which the power and heat ownership
fence keeps out of this block. Recorded rather than built.

`distributorMetrics()` returns `null` when the distributor is absent, switched off, unresolvable or
shed by the retracted power budget. That is one unavailable group, with no capacitor figures in it
and no diagnosis of which of those four it was. The rest of the dashboard stays usable.

The canvas's compact variant omits capacity and rated recharge, and its own filled blocks disagree
with its `3 · 1 · 2 PIPS` footer. Every width shows every field.

## The status rail

**Three** contributions, between feature 003's validation issues and the six metric cells features
006–008 own. The canvas prints three things in this block and no others. The first two are
read-only; the third is a control, added by the 2026-08-25 canvas revision.

| Contribution | Drawn when                            | Text                                                                                            |
| ------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| The sentence | any band has `poweredDeployed: false` | one per shed band: `Priority group 4 is unpowered — 7.80 MW of demand sits above plant output.` |
| `POWER`      | always, with a build                  | `29.64 / 31.20 MW · 7.80 OFF`, over a bar of the same four figures                              |
| The pips     | always, with a build                  | `SYS` · `ENG` · `WEP`, each over four blocks filled to that bank's allocation                   |

### The rail's pip control (2026-08-25)

Canvas 1c draws three `.pipset` groups under the `POWER` bar — a bank name in that bank's own ink
over four `.pipbar` blocks, the filled ones solid and the rest at `0.14` alpha — and gives each
`cursor: pointer`. The artboard does not wire them, so the drawing says what they are and not what
pressing one does.

They are **the same control the distributor table carries, in a second place**, not a second state:
the allocation is one viewing condition, this application already makes it editable, and both
surfaces call the same store action, so neither can hold a reading the other does not have. Nothing
about the six-pip rule changes — six between the three banks, four at most in any one, a whole pip
assigned and half a pip taken from each of the other two — and both surfaces show the pips the
package returned rather than the ones that were pressed.

Two things make the second placement worth its own control rather than a read-out. The rail is on
screen in every anatomy mode, and the distributor table is only in `POWER`; and since the 2026-08-25
revision two other regions read figures at an allocation — feature 006's `MJ × N SYS PIPS` column
and feature 007's `CAP 61 MJ · WEP 3 PIPS` — which a Commander would otherwise have to leave the
region to change.

**The blocks hold the 24px target floor, corrected 2026-08-26 (Commander request).** Canvas 1c
stands the three groups side by side with the name over the blocks, each block about 21 CSS pixels
wide in a 306-pixel rail. Built at the project's 44px design baseline the three groups were 564
pixels of blocks in a 306-pixel column, and the row scrolled sideways inside itself to hold them.
At the floor they are 108 pixels a group, which the rail wraps the way it has always wrapped them.
Same size as the distributor cell's blocks, so the two places a Commander can set the pips are the
same to press.

The rail draws no half-pip block and no running total: four blocks a bank, exactly as the
distributor's cell draws them, filled from the leading edge so a bank standing on a half fills half
a block. Each group is named with the allocation it stands at, which is the reading for anyone who
cannot see the blocks, and each block is named with the bank and the count pressing it asks for.

The blocks draw **the pips the package returned**, exactly as the distributor cell draws them
(FR-013): the projection reads them back out of `distributorMetrics()` rather than echoing the
request, so a package that ever normalised an allocation would move both surfaces rather than leave
the rail showing what was pressed.

The standing condition stands in only where the package returned nothing to read — a distributor
absent, switched off, unresolvable or shed by the retracted budget. The rail is on screen for those
builds and the table is not, and the pips are still a question worth asking about them, so the
control keeps working. Nothing is fabricated by that: the blocks show the condition being asked
about, not a capacitor figure standing in for one the package declined to give, and what an
allocation _does_ to a recharge is the distributor table's reading — which is where the `null` is
stated and stays stated.

Canvas 1d draws no pip control in its own rail. The application builds one DOM at both widths, and
the control is the rail's; withdrawing it at one width would be the capability going missing at that
width (constitution V).

The first figure on the `POWER` line is the draw the plant keeps lit, not the whole demand: the
artboard sets `29.64` here against a module list that totals `37.44`, and the `7.80` after the
plant's output is the difference. A build with nothing dark has no remainder and drops the suffix
rather than printing a zero the artboard never draws.

The bar was ruled out in wave 12 as a ratio reverse-engineered from the artboard. It is not:
`79%`, `21%` and `83.3%` are `29.64`, `7.80` and `31.20` over the whole demand of `37.44`. The track
is scaled to whichever of the demand and the plant output is larger, so a build the plant covers
marks its plant at the end of the track rather than off it, and a build with a dark group reproduces
the artboard's own percentages.

This block carries **no inset of its own**. Canvas 1c draws it and the six metric cells under it
inside one padded block closed by one amber rule, so the workspace owns that block
(`.outfitting__status-band`) because three other features draw into it too, and this block sits in it
with no padding — two insets stacked would stand these figures a block's padding further in than the
cells they head (`specs/003-ship-statistics/design/status-rail.md`, "Items 3 to 5 are one block").

There is **no heat sentence and no severity word** here (review note: "Where in the design is
`Verdict`?"). The sentence says the group is unpowered; a word standing beside it to grade that is a
word the design does not draw. The sentence is this application's own rather than a package
diagnostic, so it does not go through `edsb-game-text` and is translated like every other string it
owns.

## State behaviour

| State                   | Presentation                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------- |
| No build                | Nothing. The workspace's own empty state already says why, and no package call is made |
| Ready                   | Exact package values and states                                                        |
| Disabled consumer       | The line stays visible, reads `0.00 MW` and says `· Off`                               |
| Retracted               | Retracted totals and bands; stowed hardpoints listed at `0.00 MW`                      |
| Zero plant output       | Plant reads `0.00 MW`, the draw stays exact and the whole demand is `UNPOWERED`        |
| Distributor unavailable | One unavailable group; power, heat and the conditions stay usable                      |
| Heat unavailable        | One unavailable group; power and the distributor stay usable                           |

There is no pending state and no failure state. The projection is synchronous over a loadout that is
already in memory, exactly as feature 009's is: there is no moment at which it is on its way, and a
package exception is an application defect rather than a screen.

## Announcements

Selecting a hardpoint state or setting a pip changes visible content in place. Neither is announced:
the control reports its own state, the region is on screen, and feature 003's ruling A already
established that visible content in this area is not live. Setting a pip from the rail is the same
edit to the same condition and is announced the same way — which is to say, not.

## Canvas revision, 2026-08-25

| Change                                                                            | Status against the build                                      |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Visible `H‑PTS` label in front of the two condition segments                      | **Built.** Drawn, and the group's own accessible name.        |
| `DRAW BY MODULE` header note `MW · TOTAL n` withdrawn                             | **Built.** `power.modules.total` is gone with it.             |
| `MODULE` / `MW` column head row over the module list                              | **Built.** On the list's own tracks; the bar column unheaded. |
| `TOTAL DRAW` row closing the module list                                          | **Built.** Carrying the figure the header note carried.       |
| Heat key moved above the four tiles                                               | **Built.**                                                    |
| A description under each of the six heat scenario names                           | **Built.** Drawn beside the name, never hovered.              |
| `POWER DISTRIBUTOR & PIP ALLOCATION` → `POWER DISTRIBUTOR & PIPS`                 | **Built.** In both catalogues.                                |
| The distributor's fitted-module identity withdrawn                                | **Built.** Off the screen and out of the projection.          |
| `SYS` · `ENG` · `WEP` pip control in the status rail                              | **Built.** Editing the same one allocation.                   |
| Canvas 1d's priority groups gain the condition toggle and a share column          | **Already built.** One DOM at both widths.                    |
| Canvas 1d's `TOP DRAW` becomes `DRAW BY MODULE`, five rows become every row       | **Already built.**                                            |
| Canvas 1d's `THERMALS` becomes `HEAT PROFILE`, with all six scenarios and the key | **Already built.**                                            |
| Canvas 1d's footer becomes `PLANT OUTPUT` / `POWERED DRAW` / `UNPOWERED`          | **Already built.** It is the summary group.                   |

Every "already built" row is canvas 1d catching up to canvas 1c. That half of the revision changes
nothing here: one DOM at both widths was this feature's answer, and the drawing now agrees.

**One departure from the drawing, in the caption's wording.** The canvas abbreviates the condition's
label to `H‑PTS` to save the line. This draws the full word and lets the design system set it in
capitals, which is what this application already does everywhere the canvas abbreviates a label it
owns — `GRP 1` is drawn from `Group {{group}}`, and the column heads are drawn from whole words too.
The caption is now the group's accessible name rather than a hidden string beside it, so the
abbreviation would have been the announced name as well. The bank names stay `SYS`, `ENG` and `WEP`:
those are the game's own marks on the pip display, not this application's shorthand for a word.

## Requirement mapping

The capability owns FR-001–FR-013. The priority groups and module rows own FR-002–FR-006 and
FR-012; the distributor owns FR-007 and FR-008; heat owns FR-009 and FR-010; FR-011 is the
sentinel behaviour across all three; FR-013 is the whole rail block — its three read-only
contributions and, since 2026-08-25, its pip control. FR-001's package boundary is the whole
surface's.
