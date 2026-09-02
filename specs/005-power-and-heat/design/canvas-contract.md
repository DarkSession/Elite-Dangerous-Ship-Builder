# Canvas contract — POWER & THERMALS

Extracted verbatim from `.design/Ship Builder.dc.html`, artboards `1c` (desktop
outfitting) and `1d` (mobile). Byte offsets are into that file. Nothing in this
document is inferred: every label below is a string the canvas draws, and every
behaviour is a statement the canvas's own script makes.

This file is the template. Anything user-facing that is not here is not built.

## Where the capability lives

`POWER` is one segment of the anatomy mode strip. The canvas's switching script
(`wireAnatomy`, @1249492) does four things on a mode click:

```js
scope.querySelectorAll('[data-anat-layer]').forEach((l) => {
  l.style.display = l.dataset.anatLayer === m ? '' : 'none';
});
scope.querySelectorAll('[data-anat-legend]').forEach((l) => {
  l.style.display = l.dataset.anatLegend === m ? 'flex' : 'none';
});
scope.querySelectorAll('[data-anat-plates]').forEach((l) => {
  l.style.display = m === 'mounts' ? 'grid' : 'none';
});
scope.querySelectorAll('[data-anat-detail]').forEach((l) => {
  l.style.display = l.dataset.anatDetail === m ? 'block' : 'none';
});
const title = document.getElementById(pre + 'anat-title');
if (title) title.textContent = titles[m];
```

Consequences, all binding:

- **The plates are hidden outside `mounts`.** `[data-anat-plates]` (@353359,
  spanning both plates to @414312) is `display: none` in POWER mode. The panel
  replaces them; it does not sit under them.
- **The legend is hidden too.** Only `data-anat-legend="mounts"` exists (@414312),
  so no legend is drawn in POWER mode.
- The card title becomes `POWER & THERMALS`. The desktop switching script carries
  a title per mode and nothing else; the `DRAW AGAINST PLANT OUTPUT` line in the
  mobile head map (@1221529) is not built (review note 1).
- The panel is `data-anat-detail="power"`, @416709–506383.

## Panel layout

**Two rows of two.** The panel is two sibling two-column grids: the first
(@416700) holds blocks 1 and 2
(`grid-template-columns: 1fr 1fr; gap: 12px; min-height: 328px; align-items: stretch`),
and the second (@465531) holds blocks 3 and 4 on the same two columns
(`grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; align-items: stretch`).

**Corrected 2026-08-26 (Commander request).** This section read "Not a 2×2 grid"
and put blocks 3 and 4 across the full width, one under the other. The
`margin-top: 12px` it quoted for block 3 belongs to the second grid, not to a
full-width block — the reference draws the heat profile and the distributor side
by side, and block 4 (@495234) is that grid's second child rather than a fifth
row of the panel. Built as read, the distributor sat a whole panel below the
fold of a region bounded by the column it sits in, where a Commander looking for
the pips found the module list and nothing under it.

All four blocks are the same plate: `border: 1px solid var(--amber-a2)`,
`background: var(--panel)`, `padding: 16px 18px`, `gap: 13px`.

### 1. PRIORITY GROUPS

- Header: `PRIORITY GROUPS` left, `CUMULATIVE DRAW` right.
- A small `DEPLOYED` / `RETRACTED` toggle sits on the line **below** that header,
  hard against the leading edge (`align-self: flex-start`). It is not in the
  header row, it is not a large separate control, and it is not labelled
  "Hardpoints".
  Canvas 1d does label it, as `H‑PTS`, and stands that caption in the same 40px
  column as its `GRP n` labels so the strip begins exactly where the bars begin.
  The application draws the caption too — spelled out rather than abbreviated,
  because the strip needs a name a reader can hear — and now shares the column
  with it, which is what makes the two line up (`--ednb-layout-band-name`;
  Commander request 2026-08-26).
- Four rows, each `GRP n` then the bar then the draw in MW then the cumulative
  percentage. **Corrected 2026-08-26 (Commander request):** the draw was drawn
  before the bar, which pushed every bar's leading edge past the mode strip above
  it and left the two unable to line up. Both artboards put the figure after the
  track.
- Four rows, each `GRP n` + draw in MW + cumulative percentage:
  `GRP 1  18.72 MW  60%` · `GRP 2  4.68 MW  75%` · `GRP 3  6.24 MW  95%` ·
  `GRP 4  7.80 MW  OFFLINE`
- Each row's bar is **two lengths on one track**, because the percentages are
  cumulative: a wash (`var(--amber-a18)`) from the leading edge to where the
  groups above this one end, then this group's own draw solid (`var(--amber)`)
  on the end of it. `GRP 2` is `left: 50%; width: 12.5%`, which is
  `4.68 / 37.44` starting where `GRP 1`'s `18.72 / 37.44` stopped.
- Both lengths are shares of the **whole demand** (`37.44 MW`), not of plant
  output — which is why the percentage column and the bar disagree: `GRP 1` is
  `60%` of the plant and half of the track.
- A one-pixel `var(--ink-62)` mark stands on every row at the same place, `83.33%`
  — `31.20 / 37.44`, where the plant runs out. The words `31.20 MW PLANT` are
  not in the canvas (see "Not in the canvas" below), and the tile beneath says
  the figure.
- **A second mark, and an axis under the list — added by the latest canvas
  revision.** A one-pixel broken line
  (`repeating-linear-gradient(to bottom, var(--ink-45) 0 2px, transparent 2px 5px)`)
  stands on every row at `left: 50%`, and a row under the bars carries `50%` at
  `left: 50%` and `100%` at `left: 83.33%`, both `8px` and centred on their mark
  by `translateX(-50%)`. The row is in the track's own column: an empty
  `52px` box before it and the `78px` and `74px` figure columns after it.
- The two marks and the two labels do not agree. `100%` stands on the plant
  mark, where the track's own `83.33%` is `31.20 / 37.44` — so the axis those
  labels are on is plant output, and half of it is `41.67%` of the track rather
  than `50%`. The label is what is built (see `power-and-heat-detail.md`,
  "Priority groups").
- Three tiles: `PLANT OUTPUT 31.20 MW` · `POWERED DRAW 29.64 MW` · `UNPOWERED 7.80 MW`,
  and no condition printed under them.

### 2. DRAW BY MODULE

- Header: `DRAW BY MODULE`, alone. **Re-laid by the 2026-08-25 canvas revision**, which withdrew the
  header's `MW · TOTAL 37.44` note, put a `MODULE` / `MW` column head over the list (the bar column
  unheaded), and closed the list with a `TOTAL DRAW 37.44` row. Canvas 1d writes the same total as a
  footer pair with `POWERED 29.64 MW` beside it.
- A horizontal bar per module, descending by draw, name + figure:
  `Thrusters 7A 9.48` · `Bi-Weave Shield Gen 7C 5.51` · `Frame Shift Drive 6A 4.72` ·
  `Large Beam Laser ×2 3.24` · `Power Distributor 8A 2.60` · `Multi-Cannons ×3 2.49` ·
  `Sensors 8A 1.02` · `Life Support 5D 0.58` ·
  `Shield Cell Bank 5A · GRP 4 4.30` · `Fuel Scoop 6A · GRP 4 3.50`
- A module in an unpowered group is suffixed `· GRP n`, dimmed, and its bar
  hatched.
- Each bar is filled to the line's draw over the **heaviest line's** draw, not
  over plant output: `5.51 / 9.48` is drawn at 58.1%.
- The canvas has no state for a stowed hardpoint or a switched-off module. Both
  are listed at `0.00 MW`, the second saying `· Off` (review notes 6 and 7), so
  each state's list adds up to that state's own total.

### 3. HEAT PROFILE

- Six scenario bars, in this order, each a label and a percentage:
  `Idle · retracted 21%` · `Cruise · full throttle 34%` · `FSD charging 68%` ·
  `Weapons alpha 94%` · `Sustained weapon fire 118%` · `Shield cell bank 131%`
- The track runs to 160%: the threshold line sits at `left: 62.5%`, amber to it
  and hatched beyond.
- **No threshold caption.** The revision before the latest drew
  `100% MODULE DAMAGE` under the bars at `left: 62.5%`; canvas 1c no longer has
  it. Canvas 1d still draws it, and it is built at neither width
  (`power-and-heat-detail.md`, "Heat profile").
- The rows are `9px` apart on a `14px` track.
- One box, laid out left and right: bars and their caption down the left column,
  the four tiles beside them at `1.35fr / 1fr`, the key across the foot
  (review note 5).
- Four tiles: `RESTING HEAT 21%` · `PEAK SUSTAINED 131%` · `DISSIPATION 1.42 /s` ·
  `HEAT SINKS 6` with sub-label `2 × 3`.
- Legend: `WITHIN LIMIT` / `OVER THRESHOLD`.

Package mapping (`@elite-dangerous-almanac/core/ships/heat`): `idle`, `thrusters`,
`fsdCharging`, `firingDrained`, `firingSustained` cover the first five in order.
The sixth is the shield-cell-bank spike the module documentation states outright:
`shieldBankHeat / shieldBankSpinUp` added to the build's load — "which is what an
outfitting screen means by a cell bank's heat spike".

### 4. POWER DISTRIBUTOR & PIPS

- Header `POWER DISTRIBUTOR & PIPS`, alone. **Renamed and stripped by the 2026-08-25 canvas
  revision**, which shortened `POWER DISTRIBUTOR & PIP ALLOCATION` and removed the subtitle that
  carried the fitted distributor and its engineering (`8A · CHARGE ENHANCED G5 · SUPER CONDUITS`).
- Columns: `BANK` · `CAPACITY` · `MAX RCH` · `PIPS` · `RECHARGE`.
- Rows `SYS` (cool), `ENG` (good), `WEP` (amber). Each `PIPS` cell is **four equal
  bars** at `height: 16px`, filled ones in the bank's colour and empty ones at 14%
  of it.
- No table caption: the block header above already carries these words
  (review note 8).
- The four blocks take the width they need and no more, so the figures beside them
  keep their room (review note 9).
- Each block is `flex: 1` at `height: 16px` across the `PIPS` column, with a 4px
  gap — a chip in a row of four, not a button standing on its own. **Built at the
  24-pixel target floor rather than at the project's 44-pixel baseline**
  (2026-08-26, Commander request): four at 44 are a strip wider than the rest of
  the table's figures put together. `.pips__step` is on `DENSE_TARGETS` in
  `e2e/accessibility/assertions.ts`, which is the floor and not a waiver.
- The canvas shows SYS 2 / ENG 1 / WEP 3 on desktop and `3 · 1 · 2 PIPS` on mobile
  (@986916) — both totalling six.

Pip rules, as stated by the repository owner:

- Six pips in total, at most four to any one bank.
- The allocation starts at `2 / 2 / 2`.
- A Commander assigns a **whole** pip to one bank, and the other two pay **half a
  pip each**: moving SYS to 3 gives `3 / 1.5 / 1.5`. Where only one of the two
  has pips left to give it pays the whole of it — from `1 / 4 / 1`, SYS to 4
  gives `4 / 2 / 0`. Taking pips back runs the same rule backwards, all of it to
  one bank where the other is already at four. (Restated 2026-08-25; the earlier
  wording said only "evenly, in half-pip steps", which the build had read as
  redistributing the remainder rather than charging each of the other two.)

The package accepts fractional pips in `[0, 4]` per bank and computes
`ratedRecharge * (pips / 4) ^ 1.1`, so every allocation above is answerable.

## Status rail

- A warning band, hot, 3px left border:
  `Priority group 4 is unpowered — 7.80 MW of demand sits above plant output.`
- A `POWER` tile reading `29.64 / 31.20 MW · 7.80 OFF`, over its bar.
- **Since the 2026-08-25 canvas revision**, three `.pipset` groups under that bar:
  `SYS`, `ENG` and `WEP`, each a bank name in that bank's own ink over four
  `.pipbar` blocks — the filled ones solid, the rest at `0.14` alpha — and each
  carrying `cursor: pointer`. The artboard leaves them unwired, so the drawing
  says what they are and not what pressing one does; they are ruled the same
  control the distributor cell carries, in a second place
  (`power-and-heat-detail.md`, "The rail's pip control").
- Each `.pipbar` is `flex: 1` at `height: 14px` — about 21 CSS pixels wide in a
  306-pixel rail. **Built at the 24-pixel target floor** (2026-08-26, Commander
  request), like the distributor cell's blocks and for the same reason. Three
  groups of four at that size do not share a 306-pixel line, so they wrap, which
  is what this rail has always done with them.

Nothing else in the rail belongs to this capability. The canvas draws no heat
sentence in the rail.

## The plates' power layer — authored but never shown

`data-anat-layer="power"` exists on both plates (@363008 top, @396402 bottom).
It draws exactly what was built: a `P1`…`P5` or `OFF` chip over each mount, on
the amber ground, titled `Priority 1 · 0.61 MW` and `Unpowered · 0.00 MW`.

It is nonetheless dead markup. Its container `[data-anat-plates]` is set to
`display: none` for every mode except `mounts`, so the switcher never reveals
this layer, and the mobile artboard agrees — `1d` swaps whole panels per mode and
the plates live in the `mounts` panel only.

The canvas therefore contradicts itself here. The repository owner has settled
it: the hull anatomy is not visible while POWER is active. The layer stays
unbuilt, and the plates are hidden — not because the marks were invented, but
because nothing draws the plates they sit on.

## Not in the canvas

These were built and are being removed. None of them appears anywhere in
`.design/Ship Builder.dc.html`:

- `Verdict`, in the summary and in the heat table.
- `Headroom` and `Utilisation`.
- The heat sentence in the status rail and its `Danger` / `Caution` severities.
- A `Hardpoints` label on the deployed/retracted control.
- Table presentations of the group, module and heat readings; the canvas draws
  bars for all three.
- A subtitle under the region's title.
- A `31.20 MW PLANT` marker line under the priority groups. The canvas marks the
  plant on each row's own track, unlabelled, which is drawn; a labelled line
  under the block is not in it.
- A hardpoint-state condition printed under the summary tiles.
- A caption on the distributor table repeating its own heading.
- A priority group this build puts nothing in. The game has five and the package
  returns five; an empty one is a row about nothing (review note 3).
