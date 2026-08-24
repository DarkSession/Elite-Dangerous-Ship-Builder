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
4. `POWER DISTRIBUTOR & PIP ALLOCATION`.

Each of the four is a bounded plate on the panel ground, and they are all the same plate:
`1px solid var(--amber-a2)` over `var(--panel)` at `16px 18px`.

The arrangement is **not** a 2x2 grid. Canvas 1c draws 1 and 2 as a two-column row
(`grid-template-columns: 1fr 1fr; min-height: 328px; align-items: stretch`), then 3 across the full
width under it (`margin-top: 12px`), then 4 across the full width under that. The pair is stretched
so the two plates square up against each other, and no further: the canvas's `min-height` is a
measurement of its own sample build, and holding a real one to it rules a plate off around empty
ground (review note, wave 13). Canvas 1d stacks all
four. Which arrangement appears is decided in CSS from the space the region is given, so 400% zoom
and an expanded translation choose the stacked one for the same reason a phone does. The DOM order
is the list above at every width.

## The conditions

Two segments, `DEPLOYED` and `RETRACTED`, **inside the priority groups block** — the canvas sets
`PRIORITY GROUPS` against `CUMULATIVE DRAW` on the header line and puts the pair on the line below,
hard against the leading edge (`align-self: flex-start`). It is a small control that switches the
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

The `31.20 MW PLANT` marker the canvas sets across the bars is **not** drawn (review note 2).

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
The header carries `MW · TOTAL n`, the whole list's draw.

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

One box split down the middle: the bars and the caption belonging to them on one side, the four
tiles on the other in a column of equal width, the key across the foot of both. Every grid position is stated, because leaving
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

## Power distributor and pip allocation

The canvas's table, whole: a `BANK` column and `CAPACITY`, `MAX RCH`, `PIPS` and `RECHARGE` across
`SYS`, `ENG` and `WEP` in that order.

| Column     | Package field                                         |
| ---------- | ----------------------------------------------------- |
| `CAPACITY` | `capacity`                                            |
| `MAX RCH`  | `ratedRecharge`                                       |
| `PIPS`     | `pips.systems` / `.engines` / `.weapons`, as returned |
| `RECHARGE` | `rechargeRate`                                        |

The block's header carries the fitted distributor's identity beside the heading — the canvas's
`8A · CHARGE ENHANCED G5 · SUPER CONDUITS`. There is no table caption: the heading a few lines above
already says those words, and a table repeating its heading is the heading twice (review note 8).

The `PIPS` cell is the canvas's four blocks, and it is the control. The six pips are the ship's own
rule rather than three independent dials: six between the three banks, four at most in any one, half
a pip at a time. Setting one bank takes the pips out of the other two, split evenly between
them — from `2 · 2 · 2`, three in systems leaves `1.5` in each of the others (review
note 5 of the first pass). Pressing the block a bank already stands at gives the pip back. A block
is filled from its leading edge, so half a pip fills half a block, and no block stands for a bank at
1.5 pips.

Each block holds the 44px target baseline and no more than that: given the row's spare width the
four would take it all, and the recharge figures beside them would be wrapping two digits at a time
(review note 9). The table scrolls inside its own bounded scroller when the four no longer fit.

Displayed pips come from the result, not from what was pressed. Capacity and rated recharge are
properties of the fitted distributor and do not move. Zero pips is a genuine zero recharge and reads
as one.

`distributorMetrics()` returns `null` when the distributor is absent, switched off, unresolvable or
shed by the retracted power budget. That is one unavailable group, with no capacitor figures in it
and no diagnosis of which of those four it was. The rest of the dashboard stays usable.

The canvas's compact variant omits capacity and rated recharge, and its own filled blocks disagree
with its `3 · 1 · 2 PIPS` footer. Every width shows every field.

## The status rail

**Two** read-only contributions, between feature 003's validation issues and the six metric cells
features 006–008 own. The canvas prints two things in this block and no others.

| Contribution | Drawn when                            | Text                                                                                            |
| ------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| The sentence | any band has `poweredDeployed: false` | one per shed band: `Priority group 4 is unpowered — 7.80 MW of demand sits above plant output.` |
| `POWER`      | always, with a build                  | `29.64 / 31.20 MW · 7.80 OFF`, over a bar of the same four figures                              |

The first figure on the `POWER` line is the draw the plant keeps lit, not the whole demand: the
artboard sets `29.64` here against a module list that totals `37.44`, and the `7.80` after the
plant's output is the difference. A build with nothing dark has no remainder and drops the suffix
rather than printing a zero the artboard never draws.

The bar was ruled out in wave 12 as a ratio reverse-engineered from the artboard. It is not:
`79%`, `21%` and `83.3%` are `29.64`, `7.80` and `31.20` over the whole demand of `37.44`. The track
is scaled to whichever of the demand and the plant output is larger, so a build the plant covers
marks its plant at the end of the track rather than off it, and a build with a dark group reproduces
the artboard's own percentages.

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
established that visible content in this area is not live.

## Requirement mapping

The capability owns FR-001–FR-013. The priority groups and module rows own FR-002–FR-006 and
FR-012; the distributor owns FR-007 and FR-008; heat owns FR-009 and FR-010; FR-011 is the
sentinel behaviour across all three; FR-013 is the rail. FR-001's package boundary is the whole
surface's.
