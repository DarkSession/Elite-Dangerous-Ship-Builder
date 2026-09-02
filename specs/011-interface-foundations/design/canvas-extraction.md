# Canvas Extraction

**Source**: `.design/Ship Builder.dc.html`, canvases 1a (wide shipyard), 1b (compact
shipyard), 1c (wide outfitting chrome) and 1d (compact outfitting chrome); and
`.design/Tool Navigation.dc.html`, canvases 4c and 4d (the tool tabs and a tool's own
command bar as two decks of one plate, wide and compact).

This file is the measured record of the reference canvases. Every value below was read
out of a canvas itself, not inferred from it. Features 001 and 011 build from this
table; [reference-review.md](./reference-review.md) records where the product must
diverge and why, and [token-evidence.md](./token-evidence.md) records the contrast
audit of the result.

The canvas is authored entirely in inline styles with a single `:root` block of 55
colour custom properties. The colour block is the design system it ships; every other
value is a literal repeated at each site. Extracting those literals into named scales
is this feature's job — the scales are named here, not invented.

## Scale of the artboards

Canvas 1b is 390 × 844 — an iPhone 14 Pro viewport at 1:1. Its search input is 44 px
tall, its rows are 46 px and its sort chips are 36 px, which are real touch sizes at
real scale. The canvas type ramp is therefore literal, not a thumbnail artefact: the
design genuinely sets uppercase tracked mono labels at 8–9.5 px.

## Colour

All 55 `:root` custom properties are adopted verbatim, names and values unchanged
apart from the `--ednb-palette-` prefix. They are the only part of the canvas that is
already a token layer.

| Family     | Steps                                                                                                                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ground     | `bg #0b0b0c`, `bg-deep #0a0a0b`                                                                                                                                                                |
| Panel      | `panel #101010`, `panel-0 #111111`, `panel-menu #121211`, `panel-1 #131313`, `panel-2 #141414`, `panel-3 #151514`, `panel-3b #151515`, `panel-4 #161615`, `panel-5 #1c1c1a`, `panel-6 #1e1d1b` |
| Amber      | `amber #ff8c1a`, `amber-2 #ffa54d`, `amber-3 #ffb060`, `amber-dim #c7893a`, `amber-deep #8a6a3a`                                                                                               |
| Amber wash | `a1 .10`, `a12 .12`, `a14 .14`, `a16 .16`, `a18 .18`, `a2 .20`, `a22 .22`, `a25 .25`, `a3 .30`, `a35 .35`, `a4 .40`, `a45 .45`, `a5 .50`, `a6 .60`, `a7 .70`                                   |
| Ink        | `ink #e8ded1`, `ink-2 #ddd3c6`                                                                                                                                                                 |
| Ink wash   | `18 .18`, `3 .30`, `32 .32`, `36 .36`, `38 .38`, `42 .42`, `45 .45`, `48 .48`, `5 .50`, `55 .55`, `62 .62`, `66 .66`, `7 .70`, `75 .75`, `8 .80`                                               |
| Status     | `hot #ff6b3d`, `hot-2 #ff9b78`, `good #8fd94a`, `good-2 #7fc46b`, `cool #5fd0e0`                                                                                                               |
| Hairline   | `hair rgba(255,255,255,.04)`                                                                                                                                                                   |

Two colours appear as literals rather than properties and are named here: the modal
scrim `rgba(6, 6, 7, 0.78)` (wide) / `0.8` (compact), and the dialog shadow
`0 24px 60px rgba(0, 0, 0, 0.6)`.

## Typeface roles

Three families, each with one job. This assignment is the design's strongest signal
and is adopted exactly.

| Family             | Role in the canvas                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| `Barlow Condensed` | Every heading, every button label, every tab and segment. Always uppercase, always tracked 0.07–0.26em.         |
| `JetBrains Mono`   | Every number, every micro-label, every unit, every status string, every caret and chevron. Tracked 0.04–0.18em. |
| `Barlow`           | Prose, notes, descriptions and manufacturer names. Weight 300 for prose, 400–500 for emphasis. Untracked.       |

## Type ramp

The canvas ramp, and the token step each rung maps to. **Ruled 2026-08-22 (wave 9),
reversing the uniform lift this table once recorded.** The ramp is the canvas's own
sizes at 1:1. The lift — approximately 1.25×, to put the smallest rung at 11 px —
preserved the ratios between rungs but not the sizes, and the sizes are also what the
design is: the canvas draws a 13 px module name over a 9 px detail line, and lifting
those to 16 px and 11 px changed the density of every surface built on them at once.
Nothing is scaled on the way in.

| Canvas px           | Token                    | rem       | Used for                                                  |
| ------------------- | ------------------------ | --------- | --------------------------------------------------------- |
| 7.5, 8, 8.5, 9, 9.5 | `--ednb-type-size-micro` | 0.5625rem | Mono micro-labels: `SPEED m/s`, `Mcr`, `6 BUILDS`, carets |
| 10                  | `--ednb-type-size-2xs`   | 0.625rem  | Button labels, segment labels, column headers             |
| 10.5, 11            | `--ednb-type-size-xs`    | 0.6875rem | Row secondary text, notes, mono values in dense rows      |
| 12                  | `--ednb-type-size-sm`    | 0.75rem   | Body prose, manufacturer, table numerics                  |
| 13                  | `--ednb-type-size-md`    | 0.8125rem | Dialog titles, name field input, ledger module names      |
| 14, 15              | `--ednb-type-size-lg`    | 0.875rem  | Compact row hull names, metric values                     |
| 16                  | `--ednb-type-size-xl`    | 1rem      | Wide manifest hull names, workspace build name            |
| 18                  | `--ednb-type-size-2xl`   | 1.125rem  | Command-bar title, hull price                             |
| 22                  | `--ednb-type-size-3xl`   | 1.375rem  | Inspector hull name                                       |

Weights: 300 prose, 400 mono default, 500 mono label / Barlow emphasis, 600 condensed
secondary control, 700 condensed heading and primary control.

Line heights: `1` for every single-line tracked label and number, `1.05` for the large
inspector name, `1.3`/`1.4` for two-line labels, `1.5`/`1.55`/`1.6` for prose.

## Tracking

The tracking ladder is the design's identity and is adopted at the exact values.

| Token                      | em   | Canvas use                                     |
| -------------------------- | ---- | ---------------------------------------------- |
| `--ednb-type-tracking-xs`  | 0.04 | Mono licence block                             |
| `--ednb-type-tracking-sm`  | 0.06 | Mono search placeholder, row secondary         |
| `--ednb-type-tracking-md`  | 0.07 | Condensed hull name in a row                   |
| `--ednb-type-tracking-lg`  | 0.09 | Condensed record title                         |
| `--ednb-type-tracking-xl`  | 0.10 | Mono counts, chevrons, undo/redo               |
| `--ednb-type-tracking-2xl` | 0.12 | Mono size codes, unit suffixes                 |
| `--ednb-type-tracking-3xl` | 0.14 | Mono field labels, metric labels               |
| `--ednb-type-tracking-4xl` | 0.16 | Column headers, segment labels, workspace name |
| `--ednb-type-tracking-5xl` | 0.18 | Button labels                                  |
| `--ednb-type-tracking-6xl` | 0.22 | Dialog titles, primary hull action             |
| `--ednb-type-tracking-7xl` | 0.26 | Command-bar product title                      |

## Spacing

The canvas repeats a narrow set of gaps and paddings. They are named as a bounded step
scale rather than reproduced per site.

| Token               | rem       | px  | Canvas sites                                          |
| ------------------- | --------- | --- | ----------------------------------------------------- |
| `--ednb-space-hair` | 0.0625rem | 1   | Grid gaps that render as hairlines over an amber wash |
| `--ednb-space-3xs`  | 0.125rem  | 2   | Row gap in the wide manifest, badge padding           |
| `--ednb-space-2xs`  | 0.25rem   | 4   | Label-to-value gap                                    |
| `--ednb-space-xs`   | 0.375rem  | 6   | Chip gap, hardpoint pill internals                    |
| `--ednb-space-sm`   | 0.5rem    | 8   | Button row gap, stack gap                             |
| `--ednb-space-md`   | 0.625rem  | 10  | Toolbar gap, row gap                                  |
| `--ednb-space-lg`   | 0.75rem   | 12  | Row padding, metric cell padding                      |
| `--ednb-space-xl`   | 0.875rem  | 14  | Compact screen inset, rail gap                        |
| `--ednb-space-2xl`  | 1rem      | 16  | Dialog body gap, wide row padding                     |
| `--ednb-space-3xl`  | 1.125rem  | 18  | Dialog padding, rail padding                          |
| `--ednb-space-4xl`  | 1.375rem  | 22  | Wide screen inset                                     |
| `--ednb-space-5xl`  | 2.125rem  | 34  | Empty-state padding                                   |

## Geometry

Every product surface in the canvas is square. There is not one `border-radius` in any
of the four artboards — the only rounded corners in the file belong to the design
viewer's own chrome. Radius tokens collapse to a single `0` step.

Borders are `1px` everywhere except the command rule under the application bar, which
is `2px solid var(--amber)`, and the selection marker on a row, which is
`3px solid var(--amber)` on the inline start edge.

## Recurring compositions

These are the patterns 001 and 011 implement. Each is named once here and referenced
from the per-screen files.

### Command bar

`height: 56px` wide / `52px` compact, `background: var(--panel-4)`,
`border-bottom: 2px solid var(--amber)`. Leading edge carries the beacon mark
(`26px` square on the wide shipyard, `21` to `24px` elsewhere, drawn from
`.design/assets/nav-beacon-mark-header.svg`), then the screen title in condensed 700 uppercase
tracked 0.26em (wide) / 0.22em (compact) in `--amber-3`, then a mono count in `--ink-45`.
Trailing edge carries actions.

The product draws the insignia at one size, `26px` square, rather than the three
the canvases measure. The canvases' own spread is five pixels; a breakpoint to
reproduce it would be a responsive rule nobody could see, and the mark is a mark
rather than a measured element of the layout. This is the second recorded
deviation from the canvases, after the type ramp.

**The mark is a file, not a shape (canvas 6d).** The mark is a beacon — domed
cap, lit amber core, domed base, four antennas on 90° spacing, the whole rotated
10° counter-clockwise — and no clip path states that. It is drawn as `<img>`
rather than as a background so that the drawing has a box of its own: the
insignia is also the way home, and a control that stands on its own is held to
the 44px press baseline, which is paid by a box around the mark (011/FR-012).

One geometry in four fills, of which two are in use. Canvas 6d draws and names
the plain `nav-beacon-mark.svg`, with `-light` for a bone ground and `-mono` for
a single ink; `scripts/generate-brand-assets.mjs` renders every icon, the favicon
and the link card from the plain one, because those are drawn on the page ground
its domes are filled with. The bar takes `-header`, which is what every product
artboard draws in its own header — 1a, 1b, 1c, 1d, 4c, 4d and both equipment
artboards. Its domes are `#161615`, which is `--ednb-palette-panel-4`, the plate
the bar is painted on, so the bar's colour and that asset move together.

The press baseline is paid by a box **around** the mark, never by the mark
itself. Where the insignia is the way home it is a mark inside a link: the link
takes the 44px target, the mark keeps its own `26px` square, and the negative
inline margin takes the extra width back out of the bar so the press does not
open a gap beside the insignia. Held on the mark's own box instead, the target
minimum would beat the declared size, the mark would be drawn into a 44 × 44 box,
and the insignia would be half as large again on every screen that offers the way
home as on the shipyard that does not (Commander request 2026-08-28).

### Tool bar

Canvas 4c draws one bar with two decks rather than two bars. The plate is
`background: var(--panel-4)` closed by the command rule, on a `0 20px` inline inset; the tool deck
is `height: 30px` and the command deck `height: 40px`, and between them runs a `1px` line in
`--amber-a12` that starts where the decks start rather than under the insignia beside them. A tab
is `0 12px` of inline padding on condensed 700 uppercase tracked `0.16em` at `10.5px`, in
`--ink-48`; the current tab takes `--amber-3` ink, an `--amber-a14` wash and a
`2px solid var(--amber)` underline. The tabs are separated by `2px`.

Canvas 4d draws the same two decks at 390px: a `34px` tool deck over a `40px` command deck, a
`21px` mark inset `16px` from the plate edge with the decks starting at `48px` — `11px` past it —
and the tool's actions behind one `⋯` control. The product folds its actions at that width already, so what 4d settles is the compact
gutter pair and that the tool deck is drawn at every width.

**The insignia stands on the plate, not on either deck.** Canvas 4c puts one mark on the leading
edge of the bar as a whole, centred across both decks, and indents the decks past it — `42px`
inside the plate's own inset at 1180px, `48px` at 390px. So the mark is the banner's own child, and
the tabs and the screen identity line up on one indent under it.

The divider is drawn in `--ednb-rule-section` (`--amber-a14`), which is the step this system
already draws a section rule at; the canvas's `--amber-a12` has no semantic name here, and adding
one for two hundredths of an alpha would be a token for a value that never varies.

Two values are departures, both of the kind
[reference-review.md](./reference-review.md) already rules.

`--ink-48` composites to `4.02:1` on `--panel-4`, under the `4.5:1` AA floor for text at this
size. The product draws a resting tab in `--ednb-text-faint` (`ink-a55`, `4.89:1` on the same
ground), which is the audited floor the token layer offers and the same substitution the muted-text
row of "Required departures" records (011/FR-012). The current tab keeps `--amber-3`, which measures
`7.99:1` on the `--amber-a14` wash over that ground.

The tabs are held to the 44px press baseline rather than to the canvas's 30px, and the deck carries
a floor rather than a fixed height, for the reason the command bar does: a doubled text size and a
long language both make a tab taller than the drawing, and a bar that could not grow would cut its
own controls off (011/FR-011, FR-012).

The canvas puts an `ALL TOOLS` control beside the tabs, and a `⌘K` hint and an avatar plate on the
trailing edge. None of the three is built (`design/application-shell.md`, "The tool bar"), so the
product's tool deck carries tabs and nothing else.

### One bar height, on every screen

The bar is drawn at `4.125rem`, which is the tallest identity it carries — the
workspace's build name over its hull and ID plate, 52px of 24px rows — inside the
bar's own 12px of block padding and the 2px amber rule that closes it, all of
which the border box counts. Sized to the single row of controls every other
screen comes to, it would stand shorter on the shipyard than on a build, and the
whole page under it would move as a Commander opened one.

The padding is the dense control figure rather than the loose one. Canvas 1a
draws 56px and canvas 1c 54px, both around a 40px block; taking the loose 10px
put 20px of air around a drawing that is 14px taller than the canvas's, and the
deck stood 74px — a bar that reads as having lost its contents (Commander
request 2026-09-02). With the tool deck over it the plate is 110px.

That is half of it. The other half is that the bar's own controls have to fit
on a row, or the bar wraps and is taller whatever its floor says. The
workspace's set is the widest the application has — six actions, a saved-build
chip and the two-line identity — and below `$mode-bar-folded-max` it does not
fit. There the bar draws canvas 1d's composition instead: one row, with the
actions and the screens it offers behind a single named control. So the bar is
one height at every layout profile and in both shipped languages, on the
shipyard and on a build alike.

The figure stays a floor rather than a fixed height. At a doubled text size and
at 400% zoom the bar still wraps and still grows, because a bar that could not
would cut its own controls off, which is what FR-011 forbids. What a region
below clears is the bar as it was measured, not this declaration.

### Panel dialog

Centred at wide widths over a `rgba(6,6,7,.78)` scrim; a sheet at compact widths
over `rgba(6,6,7,.8)`. A centred dialog is bounded at `82%` of the viewport and a sheet at `88%`:
each gives up a strip so the screen behind it still shows, and no more than that.

**The sheet is anchored at the block start, not the block end. Ruled 2026-08-30 (Commander
request).** The reference draws `align-items: flex-end` and sizes its compact modals by their
content, which puts a short screen's worth of scrim above every short one — `Import build` began 449
pixels down an 844-pixel phone. A sheet starts where the screen starts, grows down as its content
needs and stops at the bound.

**A sheet is inset from the top of the screen. Ruled 2026-08-31 (Commander request), narrowing the
ruling above.** Flush against that edge the sheet began at pixel zero: its title bar met the top of
the screen, a phone's own status bar cut into it, and nothing said the sheet was a layer over the
screen behind it. The inset is `--ednb-space-sheet-inset`, one step of the space scale at 22px, and
it is taken out of the 88% bound rather than added to it, so a sheet gives up the same strip of
screen overall and the scrim below it is unchanged. A sheet therefore draws its hairline on all four
edges, where an anchored one left its block-start edge undrawn. A short viewport still promotes the
sheet to a full-height layer, and that layer owns the viewport with no inset: the promotion exists
because there is no room to give away. Body `background: var(--panel)`, `border: 1px solid var(--amber-a45)`,
`box-shadow: 0 24px 60px rgba(0,0,0,.6)`. Title bar `background: var(--panel-4)`,
`border-bottom: 1px solid var(--amber-a3)`, title condensed 700 tracked 0.22em in
`--amber-3`, trailing `CLOSE ✕` in mono. Footer bar `background: var(--panel-2)`,
`border-top: 1px solid var(--amber-a2)`, or an inline rule `border-top: 1px solid var(--amber-a14)`.

Width is a property of what the dialog holds, not of which dialog it is: the canvases draw
540 save, 560 import, 620 help and 760 export. A dialog of prose and a field takes the
middle step; the one that stands two regions side by side — canvas 1c's export dialog —
takes the widest, because two regions need the room. The canvas's fifth width, the 860px
`SAVED BUILDS` modal, has no step: the library is a route here rather than a dialog, so
nothing in this family sizes it.

### Step strip

Canvas 1c opens each column of the outfitting bench with a bar on `var(--panel-2)`,
`border: 1px solid var(--amber-a12)` and `border-left: 3px solid var(--amber)`, carrying a 16px solid
amber square with the step's number in `var(--bg)` and the step's name in mono 600 tracked 0.16em in
`var(--amber-2)`. A `›` hangs `right: -12px` off the end of every bar but the last, in the gap between
that column and the next. Two components draw a bar of it, so it is one declaration in the shared
chrome rather than a copy in each.

### Buttons

| Variant     | Canvas                                                                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary     | `background: var(--amber)`, `color: var(--bg)`, condensed 700, tracked 0.18em                                                                 |
| Secondary   | `background: var(--panel-6)` or `var(--panel-3)`, `border: 1px solid var(--amber-a4)`, `color: var(--amber-2)`, condensed 600, tracked 0.18em |
| Quiet       | `border: 1px solid var(--ink-18)`, `color: var(--ink-66)`, condensed 600, tracked 0.18em                                                      |
| Destructive | `border: 1px solid rgba(255,107,61,.4)`, `color: var(--hot-2)`, condensed 600, tracked 0.16em                                                 |
| Icon        | Square, `border: 1px solid var(--amber-a4)`, mono glyph in `--amber-2`                                                                        |

### Segmented choice

A flex row with `gap: 1px` over `background: var(--amber-a18)`, so the gap renders as a
hairline rule. Selected segment `background: var(--amber)`, `color: var(--bg)`,
condensed 700; unselected `background: var(--panel-3)`, `color: var(--ink-55)`,
condensed 600. Both tracked 0.12–0.16em.

### Choice cards

The list of formats down the leading edge of canvas 1c's export dialog, and the same
choices above the payload in canvas 1d.

Wide: a column with `gap: 6px`, each choice `padding: 11px 12px`,
`background: var(--panel-2)`, `border: 1px solid var(--amber-a14)`, carrying a condensed
600 title tracked 0.16em in `--ink-2` over a Barlow 300 10px description in `--ink-48`.
The chosen one takes `background: var(--amber-a14)`, `border-color: var(--amber-a5)` and
sets its title in `--amber-3`. The column is `236px` and is closed against the content
beside it by `border-right: 1px solid var(--amber-a16)`, which runs from under the title
bar to the foot of the panel — so the dialog's body carries no padding of its own and each
region carries its own. The first choice is the one the layer opens on.

Compact: the same choices as a `min-height: 38px` chip row with `gap: 6px` that scrolls
sideways rather than wrapping, each chip condensed 600 tracked 0.14em on `--panel-3` in
`--ink-62`, the chosen one `background: var(--amber)`, `color: var(--bg)`, condensed 700.
The description the wide plate carries is not drawn on a chip.

Three deviations, none of them extractions. The chip's `padding: 0 12px` and its
`min-height: 38px` are not adopted: it is a control, so it takes the shared control padding
and the 44px target baseline. And canvas 1c draws its export plates at condensed 600 with
no marker on either, chosen or not — which would make the wash and the amber title the
only thing separating them. FR-010 does not allow a state carried by tint, so the chosen
plate takes the reserved marker the canvas itself draws on the save dialog's chosen card,
and the wide arrangement joins the compact one in setting the chosen name in the heavier
weight. Colour is what makes the state obvious; it is never what carries it.

**Where that marker is drawn, corrected 2026-08-26 (Commander request).** It was a border
on the plate's leading edge, which meant it replaced the plate's own hairline on that one
side: an unchosen plate reserved the marker's width in `transparent` and so was closed on
three sides and open on the fourth, and the export dialog's second format read as
unfinished beside its first. The canvas draws both plates as complete boxes. The plate now
carries its hairline on all four sides in both states and the chosen one draws the marker
just inside its leading edge, laid against the padding box — so the hairline stays where it
is, nothing shifts when the choice moves, and the marker still says what tint alone may
not.

The alphas and inks resolve to the nearest named role rather than to steps of their own.
The plate's edge takes `--ednb-border-region` (`amber-a18`) against the drawn `amber-a14`,
the chosen plate's takes `--ednb-border-control` (`amber-a40`) against the drawn `amber-a5`,
the column's rule takes `--ednb-rule-grid` (`amber-a14`) against the drawn `amber-a16`, and
the unchosen title takes `--ednb-text-secondary` (ink 0.80) against the drawn solid
`--ink-2`. Four more amber hairlines and a fifth ink would be a second scale rather than a
finer one.

The fifth is not a rounding. The description takes `--ednb-text-subtle` (ink 0.62) against
the drawn `--ink-48`, which sits inside the 0.32–0.50 band this system rejects for anything
that is text rather than decoration — the same lift the type floor is, made for the same
reason.

### Manifest row

Wide: `grid-template-columns: 22px 2.1fr 1.5fr 56px 104px 96px`, `padding: 12px`,
`background: var(--panel)`, `border-left: 3px solid transparent`, rows separated by a
`2px` gap. Selected row takes the amber left border and a
`linear-gradient(90deg, var(--amber-a16), transparent)` wash. First column is the
selection marker in mono amber.

Compact: a flex row, `min-height: 46px`, a fixed 26px mono size code in `--amber-2`, a
growing name/meta column, and a trailing mono price with a `Mcr` suffix.

### Metric grid

`display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--amber-a14)`
with each cell `background: var(--panel-3); padding: 11px 12px` — the gap is the rule.
Label mono 8.5px tracked 0.14em in `--ink-48`; value mono 15px, no tracking, 7px below.
A final full-width cell spans both columns.

### Section rule

A label row: mono tracked label, a `1px` flex-filling rule in `--amber-a14`, and an
optional trailing mono total in `--ink-38`.

### Text input

`background: var(--bg)`, `border: 1px solid var(--amber-a22)`, square, `color: var(--ink)`,
`height: 36–44px`, `padding: 0 12px`. Textareas use mono for payload content and Barlow
for prose notes.

### Hull artwork frame

`background: repeating-linear-gradient(135deg, #161616 0 6px, var(--panel-0) 6px 12px)`,
`border: 1px solid var(--amber-a18)`, fixed block size (210px wide rail, 180px compact),
image `object-fit: contain` under
`filter: grayscale(1) sepia(1) hue-rotate(-18deg) saturate(1.6) brightness(.95) contrast(1.05)`.
The filter is what makes package line art read as amber; it is adopted as a token.

## Wide shipyard layout (1a)

`grid-template-columns: 1fr 340px`. Left region padded `18px 22px`, stacking the
toolbar, the column-header row and the manifest. Right rail
`border-left: 1px solid var(--amber-a18)` with `border-bottom` of the same
hairline and `align-self: start`, `background: #0f0f0f`, `padding: 18px`,
stacking artwork, name block, metric grid, hardpoint section, the three slot
groups, the restricted-slot group and the price row. It carries no action: the
2026-08-29 revision withdrew both hull buttons from this rail, and canvas 1b's
sheet keeps them.

## Compact shipyard layout (1b)

A column: command bar, a filter block on `--bg-deep` holding the search field, the
size segments and a horizontally scrolling sort chip row, then a full-width
`OPEN SAVED BUILD` bar, then the list. Detail and library are full-screen layers with
their own back-arrow command bar and a pinned bottom action block on `--panel-2`.
