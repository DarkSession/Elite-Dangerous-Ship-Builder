# Canvas Extraction

**Source**: `.design/Ship Builder.dc.html`, canvases 1a (wide shipyard), 1b (compact
shipyard), 1c (wide outfitting chrome) and 1d (compact outfitting chrome).

This file is the measured record of the reference canvas. Every value below was read
out of the canvas itself, not inferred from it. Features 001 and 011 build from this
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
apart from the `--edsb-palette-` prefix. They are the only part of the canvas that is
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

The canvas ramp, and the token step each rung maps to. A single uniform lift of
approximately 1.25× puts the smallest rung at 11 px; the ratios between rungs, which
are what the hierarchy is made of, are preserved.

| Canvas px           | Token                    | rem       | Used for                                                  |
| ------------------- | ------------------------ | --------- | --------------------------------------------------------- |
| 7.5, 8, 8.5, 9, 9.5 | `--edsb-type-size-micro` | 0.6875rem | Mono micro-labels: `SPEED m/s`, `Mcr`, `6 BUILDS`, carets |
| 10                  | `--edsb-type-size-2xs`   | 0.75rem   | Button labels, segment labels, column headers             |
| 10.5, 11            | `--edsb-type-size-xs`    | 0.8125rem | Row secondary text, notes, mono values in dense rows      |
| 12                  | `--edsb-type-size-sm`    | 0.875rem  | Body prose, manufacturer, table numerics                  |
| 13                  | `--edsb-type-size-md`    | 1rem      | Dialog titles, name field input                           |
| 14, 15              | `--edsb-type-size-lg`    | 1.125rem  | Compact row hull names, metric values                     |
| 16                  | `--edsb-type-size-xl`    | 1.25rem   | Wide manifest hull names, workspace build name            |
| 18                  | `--edsb-type-size-2xl`   | 1.5rem    | Command-bar title, hull price                             |
| 22                  | `--edsb-type-size-3xl`   | 1.75rem   | Inspector hull name                                       |

Weights: 300 prose, 400 mono default, 500 mono label / Barlow emphasis, 600 condensed
secondary control, 700 condensed heading and primary control.

Line heights: `1` for every single-line tracked label and number, `1.05` for the large
inspector name, `1.3`/`1.4` for two-line labels, `1.5`/`1.55`/`1.6` for prose.

## Tracking

The tracking ladder is the design's identity and is adopted at the exact values.

| Token                      | em   | Canvas use                                     |
| -------------------------- | ---- | ---------------------------------------------- |
| `--edsb-type-tracking-xs`  | 0.04 | Mono licence block                             |
| `--edsb-type-tracking-sm`  | 0.06 | Mono search placeholder, row secondary         |
| `--edsb-type-tracking-md`  | 0.07 | Condensed hull name in a row                   |
| `--edsb-type-tracking-lg`  | 0.09 | Condensed record title                         |
| `--edsb-type-tracking-xl`  | 0.10 | Mono counts, chevrons, undo/redo               |
| `--edsb-type-tracking-2xl` | 0.12 | Mono size codes, unit suffixes                 |
| `--edsb-type-tracking-3xl` | 0.14 | Mono field labels, metric labels               |
| `--edsb-type-tracking-4xl` | 0.16 | Column headers, segment labels, workspace name |
| `--edsb-type-tracking-5xl` | 0.18 | Button labels                                  |
| `--edsb-type-tracking-6xl` | 0.22 | Dialog titles, primary hull action             |
| `--edsb-type-tracking-7xl` | 0.26 | Command-bar product title                      |

## Spacing

The canvas repeats a narrow set of gaps and paddings. They are named as a bounded step
scale rather than reproduced per site.

| Token               | rem       | px  | Canvas sites                                          |
| ------------------- | --------- | --- | ----------------------------------------------------- |
| `--edsb-space-hair` | 0.0625rem | 1   | Grid gaps that render as hairlines over an amber wash |
| `--edsb-space-3xs`  | 0.125rem  | 2   | Row gap in the wide manifest, badge padding           |
| `--edsb-space-2xs`  | 0.25rem   | 4   | Label-to-value gap                                    |
| `--edsb-space-xs`   | 0.375rem  | 6   | Chip gap, hardpoint pill internals                    |
| `--edsb-space-sm`   | 0.5rem    | 8   | Button row gap, stack gap                             |
| `--edsb-space-md`   | 0.625rem  | 10  | Toolbar gap, row gap                                  |
| `--edsb-space-lg`   | 0.75rem   | 12  | Row padding, metric cell padding                      |
| `--edsb-space-xl`   | 0.875rem  | 14  | Compact screen inset, rail gap                        |
| `--edsb-space-2xl`  | 1rem      | 16  | Dialog body gap, wide row padding                     |
| `--edsb-space-3xl`  | 1.125rem  | 18  | Dialog padding, rail padding                          |
| `--edsb-space-4xl`  | 1.375rem  | 22  | Wide screen inset                                     |
| `--edsb-space-5xl`  | 2.125rem  | 34  | Empty-state padding                                   |

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
`border-bottom: 2px solid var(--amber)`. Leading edge carries the amber wedge
insignia (`26 × 24px` wide, `22 × 20px` compact, cut by
`clip-path: polygon(50% 0, 100% 100%, 50% 74%, 0 100%)` — the same shape the app icon
is drawn from, canvas 3b), then the screen title in condensed 700
uppercase tracked 0.26em (wide) / 0.22em (compact) in `--amber-3`, then a mono count in
`--ink-45`. Trailing edge carries actions.

The product draws the insignia at one size, `22 × 22px`, rather than the two the
canvases measure. The canvas's own difference between them is four pixels on
each axis; a breakpoint to reproduce it would be a responsive rule nobody could
see, and the wedge is a mark rather than a measured element of the layout. This
is the second recorded deviation from the canvases, after the type ramp.

### Panel dialog

Centred at wide widths over a `rgba(6,6,7,.78)` scrim; bottom sheet at compact widths
over `rgba(6,6,7,.8)`. Body `background: var(--panel)`, `border: 1px solid var(--amber-a45)`,
`box-shadow: 0 24px 60px rgba(0,0,0,.6)`. Title bar `background: var(--panel-4)`,
`border-bottom: 1px solid var(--amber-a3)`, title condensed 700 tracked 0.22em in
`--amber-3`, trailing `CLOSE ✕` in mono. Footer bar `background: var(--panel-2)`,
`border-top: 1px solid var(--amber-a2)`, or an inline rule `border-top: 1px solid var(--amber-a14)`.

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
`border-left: 1px solid var(--amber-a18)`, `background: #0f0f0f`, `padding: 18px`,
stacking artwork, name block, metric grid, hardpoint section, price row and the two
hull actions.

## Compact shipyard layout (1b)

A column: command bar, a filter block on `--bg-deep` holding the search field, the
size segments and a horizontally scrolling sort chip row, then a full-width
`OPEN SAVED BUILD` bar, then the list. Detail and library are full-screen layers with
their own back-arrow command bar and a pinned bottom action block on `--panel-2`.
