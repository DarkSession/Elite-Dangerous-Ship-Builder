# Canvas contract — OFFENCE ANALYSIS

Extracted verbatim from `.design/Ship Builder.dc.html`, artboards `1c` (desktop
outfitting) and `1d` (mobile). Byte offsets are into that file. Nothing in this
document is inferred: every label below is a string the canvas draws, and every
behaviour is a statement the canvas's own script makes.

This file is the template. Anything user-facing that is not here is not built.

Feature 005's [canvas contract](../../005-power-and-heat/design/canvas-contract.md)
established the form and the rules this one follows; where the two capabilities
share a mechanism — the mode strip, the hidden plates, the retitled region — this
document states the offence half and does not restate the mechanism.

## Where the capability lives

`OFFENCE` is the fifth segment of the anatomy mode strip (@352532 desktop,
@926562 mobile). The canvas's switching script (`wireAnatomy`, @1249142) does
four things on a mode click, and all four bind here exactly as they bind for
`POWER`:

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

- **The plates are hidden outside `mounts`.** The panel replaces them; it does
  not sit under them.
- **The legend is hidden too.** Only `data-anat-legend="mounts"` exists.
- The card title becomes `OFFENCE ANALYSIS` (@1249591). The desktop switching
  script carries a title per mode and nothing else; the
  `OUTPUT, RANGE, CONVERGENCE` line in the mobile head map (@1221719) is not
  built, for the same reason feature 005 did not build `DRAW AGAINST PLANT
OUTPUT`: it is a mobile head-map sub-line the switching script never sets. All
  three of the regions it names are built.
- The panel is `data-anat-detail="offence"`, @608667–@662552.

## Panel layout

A two-column row holding blocks 1 and 2
(`grid-template-columns: 1fr 1fr; gap: 12px; min-height: 300px; align-items: stretch`),
then block 3 on its own row beneath it (`margin-top: 12px`) — **bounded, not full
width**: `max-width: 508px; align-self: flex-start` (@660195), with the plate and
the range inside it under a further `max-width: 480px` (@661329). Block 3 also
takes a tighter inset than the two above it, `13px 14px` against their
`16px 18px`. Canvas 1d, stacking one band the width of the screen, gives its own
copy the same `13px 14px` and no bound at all. The bound was missed until
2026-08-27 and the block was built across the panel's whole width; see review
note 20.

Both drawn blocks are the same plate: `border: 1px solid var(--amber-a2)`,
`background: var(--panel)`, `padding: 16px 18px`, `gap: 13px`.

### 1. WEAPONS

- Header: `WEAPONS` left, `5 MOUNTED` right (@610707).
- A headline pair on the line below: `248.6` at 30px against
  `DPS BURST · 186.4 SUSTAINED` at 10px.
- A five-column list. The column head is
  `MODULE` (`flex: 1`) · `DPS` (46px) · `PIERCE` (44px) · `RANGE` (62px) ·
  `FALLOFF` (60px), the last four `text-align: right`. **`RANGE` was added by the
  2026-08-25 canvas revision**; before it the list was four columns ending at
  `FALLOFF`.
- Five rows. Each row's `MODULE` cell is two lines: the module name in Barlow
  10.5px, and a code line in mono 8px beneath it — the module's class and rating,
  its mount, then whatever else is true of it, as
  `4A GIMBALLED · OVERCHARGED G5 · CORROSIVE`. Reading that second line as an
  engineering line is what made an earlier revision draw only its last part, and
  nothing at all under `3E FIXED · STOCK`. The four figure cells are one line
  each.

The five rows, verbatim:

| MODULE                                                           | DPS  | PIERCE | RANGE   | FALLOFF |
| ---------------------------------------------------------------- | ---- | ------ | ------- | ------- |
| Huge Multi-Cannon<br>`4A GIMBALLED · OVERCHARGED G5 · CORROSIVE` | 78.9 | 68     | 4,000 m | 1,800 m |
| Large Beam Laser<br>`3D GIMBALLED · LONG RANGE G5`               | 41.4 | 52     | 3,000 m | 1,200 m |
| Large Beam Laser<br>`3D GIMBALLED · LONG RANGE G5`               | 41.4 | 52     | 3,000 m | 1,200 m |
| Large Multi-Cannon<br>`3E FIXED · STOCK`                         | 50.1 | 55     | 4,000 m | 1,800 m |
| Medium Multi-Cannon<br>`2F GIMBALLED · OVERCHARGED G5`           | 36.8 | 45     | 4,000 m | 1,600 m |

Two rows carry the same module name in different mounts, and the canvas neither
merges nor de-duplicates them. `PIERCE` is drawn in `--hot-2` on two rows and
`--ink-7` on three; the canvas gives no rule for the difference and none is
built (review note 3).

**The rows are inert.** They carry no disclosure, no action and no slot.

### 2. DAMAGE PROFILE

Header: `DAMAGE PROFILE` left, `BY TYPE AND RANGE` right (@630535). Then six
children, hairlines (`height: 1px; background: var(--amber-a14)`) between the
three groups:

1. a two-segment stacked bar with `title` tooltips `Kinetic 165.8 DPS` and
   `Thermal 82.8 DPS`, under a legend line reading `KINETIC 165.8 · 67%` and
   `THERMAL 82.8 · 33%`;
2. `DPS BY RANGE BAND` (@633215) — four rows, each a distance, a bar and a
   figure: `500 m 248.6` · `1,000 m 215.9` · `2,000 m 118.4` · `3,000 m 47.2`;
3. `WEAPON CAPACITOR` (@642341) — three rows, each a label, a bar and a figure:
   `DRAW 5.61 MW` · `RECHARGE 3.90 MW` · `FULL FIRE 14.2 s`.

### 3. SHOT CONVERGENCE

**Redrawn again by the 2026-08-26 canvas revision.** What that revision changed,
against the 2026-08-25 reading recorded below it:

- **The ring caption is gone.** There is no `#cv-slabel` and no
  `RING 2 · … MRAD · … m` anywhere in the file. The block is headed
  `SHOT CONVERGENCE` with nothing beside it (1c @15454, 1d @31679).
- **The four fact cells are gone.** `LATERAL SPAN`, `VERTICAL SPAN`,
  `APPARENT SPREAD` and `WIDEST MOUNT` appear nowhere in the canvas. The column
  beside the plate carries the range and nothing else.
- **A boresight is added**: a hairline ring on the axis with a filled dot at its
  centre — 20px and 3px in 1c (@15526-15548), 18px and 3px in 1d
  (@31743-31766). It marks where the hull points, which is what every shot is
  offset from.
- **The plate is larger**: 172px in 1c (@15467), 132px in 1d (@31685), against
  the 8rem this application drew. The product's plate became `10.75rem`, 1c's
  172px exactly — and `14rem` from 2026-08-27, which is review note 21's.
- **The track opens at 1,500 m and steps by 50 m**, between 500 m and 5,000 m,
  with `500 m` and `5,000 m` set under its ends in 1c. `wireConvergence` declares
  `MIN = 500, MAX = 5000`, defaults `R` to `1500` and quantises to `50`.
  _(The built track takes three of those four and departs on the ceiling alone,
  which is 3,000 m from 2026-08-27 — review notes 18 and 21.)_

The 2026-08-25 reading, kept as the record of what it replaced:

Header `SHOT CONVERGENCE` left and the ring caption right, on the header line
itself — `#cv-slabel`, which `wireConvergence` writes as
`RING 2 · 27 MRAD · 16.0 m`. The `GUNSIGHT VIEW AT TARGET RANGE` note and the
`IMPACT PLANE` rule are both **gone**: the note is replaced by the caption, and
the rule is not drawn at all.

Beneath it, the plate (`#cv-ring1`, `#cv-ring2`, `#cv-dots`) beside a column
holding, in order: a `TARGET RANGE` label with the value `600 m` beside it, the
draggable track from `100 m` to `2,000 m`, the track's own two end labels, and
the four facts — `LATERAL SPAN 18.8 m` · `VERTICAL SPAN 6.5 m` ·
`APPARENT SPREAD 33 mrad` · `WIDEST MOUNT HP 6 · 9.8 m`. The slider's label and
value are one row above the track rather than flanking it.

The plate's geometry changed with it, and this is the substantive half:

- **`FOV = 40`, not `115`.** `wireConvergence` halved the field of view nearly
  threefold, so the same offsets subtend nearly three times as much of the plate.
- **The plate is square in milliradians, and its box is square too.**
  `ASPECT = 6 / 16` is gone; the script now maps both axes over `±FOV` and
  corrects only the _rings_ for the box's pixel aspect
  (`aspect = box.offsetWidth / box.offsetHeight`). The box the canvas gives it is
  `width: 172px; aspect-ratio: 1` (@15395), so that correction is one and a ring
  is a circle in pixels as well as in angle.

  The two halves are one change. A mapping square in angle over a box that is
  not squashes every shot's height in exactly the box's own proportion, and
  sends a ring past the top and bottom of the plate it is drawn on — which is why
  the earlier drawing paired its `16 / 6` box with the narrower vertical field
  that levelled it. Taking the mapping without the box is not half the revision;
  it is a different diagram from either.

- **A shot outside the field of view is clamped, not clipped.** Every dot is
  `clamp(50 ± mrad / FOV × 50, 4, 96)` — it stops at the frame's own margin
  instead of leaving it. Nothing disappears.
- **The edge badge and its leader are gone.** Each mount is one small dot plus a
  small numeral placed beside it, at whichever of four candidate offsets
  (`[7,-14]`, `[7,5]`, `[-13,-14]`, `[-13,5]`) is furthest from every other dot.
  There is no badge column and no leader line.
- The ring caption drops `AT THIS RANGE`: it is now
  `RING 2 · <FOV × 2/3 mrad> · <that angle at the chosen range>`.

## Canvas 1d — the mobile OFFENCE panel

`data-m-mode="offence"`. **Rewritten by the 2026-08-25 canvas revision, and it
is now canvas 1c stacked.** Four blocks, in canvas 1c's own order and wording:

1. `WEAPONS` / `5 MOUNTED`, carrying the same five figures in four columns —
   `MODULE` · `DPS` · `PRC` · `RANGE`, the range cell carrying `4,000 m` over
   `FALL 1,800`, which is how the compact drawing keeps an aligned table;
2. `DAMAGE PROFILE` / `BY TYPE AND RANGE` — `248.6` over
   `DPS BURST · 186.4 SUSTAINED`, the kinetic/thermal bar with a legend that now
   carries the percentages (`KINETIC 165.8 · 67%`, `THERMAL 82.8 · 33%`), and
   `DPS BY RANGE BAND` with the same four rows;
3. `WEAPON CAPACITOR` / `DISTRIBUTOR 8A` — `DRAW 5.61 MW` · `RECHARGE 3.90 MW` ·
   `FULL FIRE 14.2 s`, over two chips: `CAP 61 MJ · WEP 3 PIPS` and
   `CORROSIVE +30%`;
4. `SHOT CONVERGENCE`, redrawn exactly as canvas 1c redraws it above.

The mobile head map still titles it `OFFENCE`, not `OFFENCE ANALYSIS`.

**What this settles.** The old canvas 1d was a different panel from canvas 1c,
and building one DOM for both widths was a judgement this document had to
defend. The revision removes the disagreement: the compact panel is now the wide
panel's own blocks in the wide panel's own order, which is what the built region
already is.

**`VS 45% RESIST` is gone from the drawing.** The `ALPHA` · `BURST DPS` ·
`VS SHIELD` · `VS HULL` block that only canvas 1d ever carried is no longer
drawn anywhere, so the exclusion below stands on the drawing rather than on a
judgement about target simulation. `CORROSIVE +30%` survives, on canvas 1d
alone, and stays excluded for its own reason: no package field publishes it.

## The status rail cell

Canvas 1c's status rail (@749242) draws six metric cells under feature 005's
`POWER` line: `SHIELD 1,842 MJ` · `ARMOUR 3,914` · `DPS 248.6` · `JUMP 21.4 ly` ·
`SPEED 200 m/s` · `MASS 1,142 t`. Canvas 1d draws the same six.

`DPS` is this feature's cell and the only one it may add. It is a label and a
bare figure: the canvas gives it no unit, no second figure and no condition.

## What is built

| Canvas element                                         | Built as                                                                                                                                                                                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OFFENCE` strip segment, `OFFENCE ANALYSIS` title      | The mode, enabled; the region's rule renamed exactly as the script renames it.                                                                                                                                                                         |
| `WEAPONS` header and `5 MOUNTED`                       | The block heading and the count of weapons the package returned (ruled exception 1).                                                                                                                                                                   |
| `248.6` / `DPS BURST · 186.4 SUSTAINED`                | `total.damagePerSecond` at headline size, `total.sustainedDamagePerSecond` on the note beside it.                                                                                                                                                      |
| `MODULE` / `DPS` / `PIERCE` / `RANGE` / `FALLOFF`      | One row per returned weapon in package order: name, `damagePerSecond`, `armourPiercing`, `maximumRange`, `falloffRange`.                                                                                                                               |
| The code line under a module name                      | `4A GIMBALLED · OVERCHARGED G5`, drawn by the same badge feature 002 draws on a ledger row.                                                                                                                                                            |
| Inert rows                                             | Inert rows. No disclosure, no action, no navigation (review note 5).                                                                                                                                                                                   |
| `DAMAGE PROFILE` / `BY TYPE AND RANGE`                 | The block heading and its note, both verbatim: the block now carries both halves.                                                                                                                                                                      |
| The stacked kinetic/thermal bar                        | One segment per conventional type the build deals, each sized by its share of the conventional total.                                                                                                                                                  |
| `KINETIC 165.8 · 67%` legend                           | Every conventional amount from `damageByType`, each with its share, as the legend line under the bar.                                                                                                                                                  |
| `DPS BY RANGE BAND` and its four rows                  | `damageFalloff()` applied to every enabled weapon at 500 m, 1,000 m, 2,000 m and 3,000 m.                                                                                                                                                              |
| The four range-band bars                               | Each band filled against the strongest band — one scale, and every figure is stated (review note 6).                                                                                                                                                   |
| `WEAPON CAPACITOR` `DRAW` / `RECHARGE` / `FULL FIRE`   | `sustainedEnergyPerSecond`, `rechargeRate` and `timeToDrain`, in package units.                                                                                                                                                                        |
| Canvas 1d's `WEP CAP 61 MJ`                            | `capacity`, as a fourth row of the same block, written `MW` (ruled 2026-08-27).                                                                                                                                                                        |
| The capacitor bars                                     | `DRAW` and `RECHARGE` only: those two share MJ/s. `CAPACITY` and `FULL FIRE` do not (review note 6).                                                                                                                                                   |
| `SHOT CONVERGENCE`                                     | The third block's heading, alone on its line, on a row of its own bounded at the canvas's own 508px. The ring caption is withdrawn with the 2026-08-26 revision, which draws none.                                                                     |
| `#cv-ring1`, `#cv-ring2`, `#cv-dots`                   | A square gunsight plate over the canvas's own **40 mrad** field of view, drawn at `14rem`. A shot outside that field is left off the plate rather than clamped to it (review note 21).                                                                 |
| ~~The canvas's dot and numeral per mount~~             | **One mark, 2026-08-27**: the dot where the shot lands, and nothing beside it. The numerals, their placement and their leaders are withdrawn, and the plate draws no text at all (review note 20).                                                     |
| The canvas's boresight ring                            | Where the hull points, drawn as a proportion of the plate so it holds at every size. No build state, and no sentence of its own. **The canvas's filled dot at its centre is withdrawn, 2026-08-27**: on a plate of dots it read as a shot on the axis. |
| ~~The canvas's four fact cells~~                       | **Withdrawn 2026-08-26**: the two spans, the widest mount and the apparent spread are drawn nowhere in the canvas any more.                                                                                                                            |
| ~~The `RING 2 · 27 MRAD · 16.0 m` caption~~            | **Withdrawn 2026-08-26**: there is no `#cv-slabel` and no caption anywhere in the canvas, and the block is headed `SHOT CONVERGENCE` with nothing beside it.                                                                                           |
| The `TARGET RANGE` track, `500 m`–`5,000 m`, `1,500 m` | A range field, its label and value above the track, over the canvas's own minimum, step and initial value; the ceiling alone departs, at `3000` (review notes 18 and 21).                                                                              |
| ~~`LATERAL SPAN` / `VERTICAL SPAN`~~                   | **Withdrawn 2026-08-26** with the four cells above. The projection still computes both, and nothing reads them.                                                                                                                                        |
| ~~`APPARENT SPREAD 33 mrad`~~                          | **Withdrawn 2026-08-26** with the four cells above. The projection still computes it, and nothing reads it.                                                                                                                                            |
| ~~`WIDEST MOUNT HP 6 · 9.8 m`~~                        | **Withdrawn 2026-08-26** with the four cells above. The projection still computes it, and nothing reads it.                                                                                                                                            |
| Status rail `DPS 248.6`                                | One rail cell carrying `total.sustainedDamagePerSecond` (review note 2).                                                                                                                                                                               |

Three things are added, and all three are required by the drawing rather than
chosen:

1. **Every mark on the plate is also a sentence.** The plate is a diagram; it is
   hidden from assistive technology and each mark is restated beside it as text
   naming the weapon, its hardpoint, its mount and where its shot goes. The ring
   caption was stated with them, as the one figure the plate drew that nothing
   beside it repeated; the 2026-08-26 revision draws no caption, so there is
   nothing extra to state and the sentences are exactly the marks. Since the
   2026-08-25 revision
   the plate mapped a far-off-axis shot to its frame rather than clipping it; from
   2026-08-27 it draws no mark for one at all, so for that mount the sentence is
   the only carrier there is. It is required for every mount either way, because
   the plate is a diagram (`spec.md` FR-011).
2. **The capacitor block names its WEP allocation**, as one line of text beneath
   the four rows. Two of the four figures move when the allocation moves, and a
   figure that changes with a condition shown without that condition is the
   misleading number constitution IV forbids. An earlier revision of this
   paragraph justified it as the condition line `edsb-metric-group` already
   draws under a value; the panel composes no metric group, and the line is its
   own element — the addition is the sentence, not a component. It is not a
   control: the canvas draws the pip control in `POWER`, and it stays there.
3. **Two lists are given accessible names**, because the canvas's own grouping
   is spatial and a spatial group has no name to read. The stacked bar's legend
   is announced as the damage-by-type list it is, and the shot sentences beside
   the plate are announced as the plate's reading. Neither adds a visible
   element, neither is a figure, and both are exactly what the canvas's layout
   already says to a reader who can see it.

Nothing else is added.

## What is not built, and why

| Canvas element                                   | Why not                                                                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The stacked bar's `title` tooltips               | Hover-only meaning, unreachable by touch (011 FR-006). The legend beside the bar states both figures.                                                         |
| A damage-type list with a figure for each type   | No canvas draws one. The bar and its legend are the whole reading (review note 7).                                                                            |
| `VS 45% RESIST`, `ALPHA`, `VS SHIELD`, `VS HULL` | **No canvas draws them any more** (2026-08-25 revision). They were target simulation while they were drawn.                                                   |
| `CORROSIVE +30%`                                 | An effect bonus no package field publishes.                                                                                                                   |
| `MW` on `DRAW` and `RECHARGE`                    | The package returns MJ/s for both. Package units win. `CAPACITY` is the one row that takes `MW`, and from the game rather than the canvas (ruled 2026-08-27). |
| `OUTPUT, RANGE, CONVERGENCE`                     | A mobile-only sub-line the desktop switching script does not carry.                                                                                           |
| `PIERCE` drawn in two colours                    | The canvas states no rule for the difference, so there is nothing to build (review note 3).                                                                   |
| Every sample figure                              | Non-authoritative. Desktop calls 248.6 burst and 186.4 sustained; mobile calls 248.6 sustained and 318.4 burst.                                               |

## Fields the package returns and no canvas draws

Feature 005 established the rule: a package field no canvas draws is not read at
all, so nothing downstream can blank, dash or zero one. For this capability that
leaves unread:

- `WeaponTotals.energyPerSecond`, `sustainedEnergyPerSecond`, `heatPerSecond`,
  `sustainedHeatPerSecond`, `thermalLoad` and `powerDraw` — the whole-build
  firing cost. Canvas 1c's `WEAPONS` card draws two figures and both are damage;
  the capacitor's `DRAW` row is the capacitor result's own field, not this one.
- `WeaponsCapacitorMetrics.netDrainRate` and `weaponsPips` — neither canvas draws
  a net drain or prints the allocation back. The allocation is set in `POWER`,
  where the canvas draws it.
- The per-weapon `WeaponMetrics` fields beyond the row's **five** columns, and
  every ammunition field. The canvas draws its weapon rows inert and gives them
  nowhere else to go (review note 5). `maximumRange` left this list on
  2026-08-25, when the canvas gave it a column.
- `DamageSplit.antiXeno`, and `sustainedDamageByType` whole. Neither canvas draws
  an anti-xeno figure or a second damage split; the stacked bar and its legend
  are one set of conventional amounts, and that is the set both canvases draw
  (review note 7).

## Ruled exceptions

Figures a canvas draws that the package does not publish as a field. Each is
worked out once, in the projection:

1. `5 MOUNTED` — the number of entries in `weaponMetrics().weapons`. Feature 009
   took the same exception for its blueprint and material-type counts.
2. The damage shares and the range-band and capacitor bar fills. Each is one
   package amount over another package amount, both of them stated on the same
   screen, and none of them is a new measurement: the share is what the canvas's
   legend draws as `· 67%`, and a bar is that same ratio drawn instead of
   written. Feature 006 established the form. All three are computed in
   `src/app/domain/offence/offence.ts` and nowhere else, which is what "once, in
   the projection" above means literally: a fill worked out in a component would
   be two package figures divided on a screen, and the ownership policy's
   one-line arithmetic scan cannot see that when the two are bound to a local
   first.
3. The spans, the apparent spread and the widest mount. Each is a distance
   between two offsets the package published, or the largest of those distances.
   The offsets are the package's, the projection at range is the package's
   (`projectGunsight`), and no ballistics are modelled.
4. The four range-band **figures** themselves — not only their fills. Each is
   the package's `damageFalloff()` at that distance multiplied by that weapon's
   returned `damagePerSecond`, added across the enabled weapons. Both halves are
   package answers and the addition is the same one the package performs for
   `total` over the same weapons; what the exception covers is that this file
   performs it, once, in the projection. `DPS BY RANGE BAND` cannot be drawn any
   other way — the package publishes a multiplier per weapon per distance and no
   build figure at a distance (FR-008).
5. Nothing else. In particular the legend adds nothing up: every amount in it is
   a `DamageSplit` member read straight off the package result, and the share
   beside it is that member over the sum of the members drawn with it. No
   target, resistance, alpha strike or hardness result is worked out anywhere.

## Review notes

1. **`BY TYPE AND RANGE` is kept whole.** An earlier revision trimmed it to
   `BY TYPE`, because the range half of the block had been placed out of scope.
   The range half is built, so the canvas's own words go back on the screen
   unchanged.
2. **The rail cell carries sustained DPS.** The canvas cannot settle which of the
   two the cell means — its value, `248.6`, is 1c's burst figure and 1d's
   sustained figure, from a canvas whose own two panels disagree. The
   specification does settle it: the Status contribution is sustained DPS
   (`spec.md`, "Almanac Coverage"; `design/offence-profile.md`, "Status
   contribution"). The label stays the canvas's bare `DPS`.
3. **`PIERCE` colour.** Two rows draw the figure in `--hot-2` and three in
   `--ink-7`, with no stated rule and no legend. A colour with no rule is not a
   reading, and colour alone could not carry one in any case (011 FR-010).
4. **No prose the canvas does not have.** Re-traced against the design
   2026-08-24, element by element. Two strings had been written into the panel
   with no counterpart anywhere in either canvas and have been withdrawn: a
   scope sentence under the burst and sustained totals, and a sentence attached
   to the anti-xeno damage row naming it an overlay. Both explained rather than
   reported, and the canvas draws its totals and its damage types as a label and
   a figure each and nothing more. Removing them takes no figure off the screen.

   Statements with no canvas counterpart are kept only where the alternative is
   hiding a fact or inventing one: the empty and unavailable-coverage statements
   for the collection, the unavailable-gunsight statement for a hull the
   catalogue does not place, and the shot sentences beside the plate. All are
   states no canvas draws (below), or the text half of a diagram, not commentary
   on a state one does.

   A type the build does not deal gets no statement at all. An earlier revision
   drew a no-unclassified-damage sentence where its figure would be; the legend
   is a list of what the build deals, both canvases leave an undealt type out of
   it entirely, and a sentence saying a type is absent is commentary on a state
   no canvas draws.

5. **The row disclosure and the per-row slot action are withdrawn.** An earlier
   revision added both to every weapon row, on the reading that FR-004 required
   every returned field of every returned weapon on the screen and the canvas
   offered nowhere else to put them. The canvas draws the rows inert, and the
   contract's own extraction says so in as many words. Two invented controls on
   every row is a larger departure than the omission they were meant to cure, so
   the requirement moved instead: FR-004 now asks for the columns the canvas
   draws — four then, five since the 2026-08-25 revision added `RANGE` — and the
   fields beyond them join the unread list above. Nothing that was
   on the screen and package-backed has been taken off it — the withdrawn
   disclosure carried fields no canvas ever drew.

6. **A bar only where a scale exists.** The canvas draws seven bars: four range
   bands and three capacitor rows. The four bands share one scale — damage per
   second at four distances — and are drawn. `DRAW` and `RECHARGE` are both MJ/s
   and share one, and are drawn. `CAPACITY` is a stored pool and `FULL FIRE` is a
   duration; neither shares a scale with anything beside it, so both keep their
   figure and lose their bar. The 2026-08-27 ruling writes `CAPACITY` in `MW`,
   which changes the unit after the figure and not what it is: a pool is still
   not a rate, and still has nothing here to be measured against. This is
   feature 006's established rule, and it takes no figure off the screen: every
   capacitor value is stated in words either way.

7. **The damage-type enumeration is withdrawn.** An earlier revision drew two
   `edsb-metric-group` lists — burst by type and sustained by type — with a line
   for every member of `DamageSplit`, including a stated zero for each type the
   build does not deal and a row for `antiXeno`. **No canvas draws any of it.**
   Canvas 1c draws one stacked bar and writes the types it has segments for
   beside it (`KINETIC 165.8 · 67%` · `THERMAL 82.8 · 33%`); canvas 1d draws the
   same bar and the same two figures. A type the build does not deal has no
   segment and no line, which is what the canvas does with it.

   The lists went because they were an invention, not because they were long:
   the whole of `sustainedDamageByType` and the `antiXeno` member of both splits
   are drawn by neither canvas and therefore join the unread list above, which
   is the rule feature 005 set. What stays on the screen is every conventional
   amount the build actually deals, each with its share — the canvas's own
   reading, and the same figures the withdrawn lists carried for those types.

8. **A hardpoint the build has not filled is drawn — withdrawn 2026-08-24,
   reinstated 2026-08-26 as a sanctioned departure.**
   An earlier revision of this note drew an empty mount on the plate in hollow
   ink with its own sentence beside it, and justified it on the ground that
   "the canvas's sample data fills every hardpoint, so the canvas never faces
   one that is empty and states nothing about them". That premise is false, and
   the design says so twice:

   - `wireConvergence`'s own `mounts` array carries hardpoints **1, 2, 3, 4 and
     6**. There is no entry for hardpoint 5.
   - The same sample build's hull-anatomy plate draws
     `data-hp="5" data-kind="empty" title="Hardpoint 5"` — five of the hull's
     six hardpoints armed, which is the `5 MOUNTED` the `WEAPONS` header shows.
   - The mobile canvas's static `LATERAL SPAN 15.8 m` is `6.4 − (−9.4)` over
     exactly those five armed mounts, so the array is the design's real model of
     this build rather than an abbreviation of it.

   So the canvas does face an unfilled hardpoint on the gunsight, and draws
   nothing at all for it: `dots.innerHTML` is mapped off the armed mounts alone,
   and so are both spans and the widest. The hollow marks and their sentences
   were a user-facing element the template does not contain, which is the one
   thing this contract exists to prevent. Both are removed, and `spec.md`'s
   FR-012 is withdrawn with them.

   What is not withdrawn is the reasoning's other half — that the gunsight
   publishes an offset per hardpoint rather than per weapon. That remains true;
   it is simply not something either canvas draws.

   **Reinstated 2026-08-26, on a ground the canvas does not decide.** The
   maintainer asked for every hardpoint on the plate, the empty ones in an ink
   of their own. Everything the withdrawal established about the drawing still
   holds — `wireConvergence` really does map its marks off the armed mounts
   alone, and hardpoint 5 really is missing from its array — so this is not a
   re-reading of the canvas. It is a decision that the plate answers a question
   the canvas's own sample never asked: a Commander who has not fitted a weapon
   yet is looking at the plate to find out where a shot from that mount _would_
   go, and a plate that shows only what is already fitted has nothing to say to
   them. The offsets it needs are the package's own, published per hardpoint,
   so nothing is derived to draw them.

   It is recorded here rather than settled in a stylesheet, because it is a
   user-facing element the template does not contain, which is what SC-004 asks
   this file to hold. Three things bound it:

   - **Nothing about the group moves.** Both spans, the widest mount and the
     apparent spread stay measured across the armed mounts alone, exactly as the
     canvas measures them. An empty hardpoint fires nothing, and a span reaching
     one would be a separation between a shot and no shot.
   - **The ink is never the reading.** Each empty mount carries its own sentence
     beside the plate, in the catalogue's own words, saying it is empty — the
     same rule every other mark on this plate is held to (011 FR-010).
   - **The mark is the hull's, not the weapon's.** It says where a mount is
     pointed, and no figure is attached to it that a fitted weapon would supply.

9. **A build that has armed nothing is still placed.** An earlier revision
   returned the unavailable state for it, which draws the sentence "the game
   data package does not publish gunsight geometry for this hull". For a hull
   the catalogue does place, that sentence is false. The two are separate
   answers: a hull the catalogue does not place is unavailable; a placed hull
   nobody has armed keeps the plate with its axes and its rings and is given
   none of the four figures beneath it, all of which are about a group of armed
   mounts.

   What such a plate carries changed with note 8's reinstatement on 2026-08-26.
   It took no mark at all while the plate drew the armed mounts alone — which is
   what `wireConvergence` draws when its array is empty — and now carries every
   one of the hull's mounts in the empty ink. The distinction this note exists
   for is untouched: the plate is drawn either way, and the unavailable sentence
   stays false for a hull the catalogue places.

10. **`FULL FIRE` draws `∞` where the recharge keeps pace.** The symbol is what
    a Commander reads; what it stands for is said beside it and kept out of
    sight, which is the form `defence.damage.unbounded` and
    `power.heat.does-not-settle` already take. A glyph nobody can read aloud is
    not a reading on its own, and the package's own `Infinity` still never
    leaves the projection as a number.

    The sentence has to be _actually_ out of sight, and for one revision it was
    not: the span was added and the `.visually-hidden` rule that hides it was
    not, so `∞ Recharge keeps pace` rendered in plain view — words no canvas
    draws, on screen. The class is declared per component in this repository and
    there is no global one to inherit. It is asserted now by the rendered box
    rather than by the text, because a text assertion passes either way.

11. **No damage figure carries a unit.** Five of them briefly did — the headline,
    the sustained sub-line, each legend amount, each range band and each weapon
    row — suffixed `/s`. No canvas suffixes one: 1c draws `248.6`,
    `DPS BURST · 186.4 SUSTAINED`, `KINETIC 165.8 · 67%` and the three band
    figures bare, 1d draws `SUSTAINED DPS · 248.6` and `KINETIC 165.8` bare, and
    the design file contains no `/s` on any figure anywhere. The suffix also
    said per second twice, under heads that already read `DPS`. It is not on the
    departures list above, because it was never a departure anyone ruled — it
    was an addition, and it is withdrawn.

12. **The ring caption is `Ring 2 · …`, not `Outer ring …`.** `wireConvergence`
    sets `'RING 2 · ' + mrad + ' MRAD · ' + metres + ' m AT THIS RANGE'`. The
    plate draws two rings, so the number names which one; describing it instead
    is a wording this application chose. The separator after the name is the
    canvas's too, and was missing for one revision after the name was fixed.

13. **The four cells under the plate are two lines each.** `APPARENT SPREAD`
    once carried a third, naming the range the spread was read at. The canvas
    draws a label and `#cv-mrad` and nothing else, and `wireConvergence` writes
    only the figure into it, so the line was a fourth added element against a
    list of three. The range field's readout above the cells already says what
    range the plate is drawn at, so withdrawing it loses no reading.

14. **A unit symbol is a symbol, not a case the label wanted.** The micro-label
    mixin uppercases, which is right for a word and wrong for a metre: the range
    bands read `500 M` and the ring caption `10.0 M`, and `M` is the mega prefix.
    The canvas draws `500 m` in `400 9px/1.3 'JetBrains Mono'` with
    `letter-spacing: 0.06em` and no `text-transform`, so the four band labels
    take `text-transform: none`. It is scoped to those four and not to the class
    they share: the capacitor rows beside them label themselves with words, and
    the canvas draws `DRAW`, `RECHARGE` and `FULL FIRE` uppercase in the same
    face at the same tracking (design L15079, L15126, L15173).

    Worth recording because of how it survived: `toHaveText` and `textContent`
    read the DOM's text, which `text-transform` never touches, so every
    assertion on these labels passed whichever case was drawn. The e2e test that
    now guards it reads `getComputedStyle(node).textTransform` and applies it
    before matching.

15. **The ring caption drops its case, and the canvas's own mix is not
    reproduced.** `wireConvergence` writes
    `'RING 2 · ' + mrad + ' MRAD · ' + metres + ' m AT THIS RANGE'` (design
    L28748, drawn statically at L15341): uppercase throughout, with the metre
    symbol alone left lowercase. `text-transform` is all-or-nothing over a text
    node, so reproducing that mix means splitting the caption into transformed
    and untransformed spans — and the caption is one sentence in the Commander's
    language whose parts move relative to each other between languages
    (`Ring 2 · {{angle}} · {{distance}} at this range` against
    `… auf dieser Entfernung`). Splitting it would fix English word order into
    the markup.

    So the whole caption takes `text-transform: none` and is drawn in sentence
    case. This is a departure, and it is deliberate: of the two available, a
    caption whose words are lowercase is a typographic difference, while a
    caption reading `10.0 M` states the mega prefix and is a different unit. The
    sibling `IMPACT PLANE` caption stayed uppercase, because it was words and
    carried no unit at all — the same rule as note 14, applied to a caption
    rather than a label. The 2026-08-25 revision removed that caption from the
    drawing; this half of the note is history. The unit rule for the ring caption
    is unchanged, and the caption now sits on the block's heading line.

16. **The weapon row's code line is the ledger's badge, not a second rendering.**
    The canvas draws every row's module cell as a name over
    `4A GIMBALLED · OVERCHARGED G5 · CORROSIVE` (design L14450), and gives an
    unengineered weapon `3E FIXED · STOCK` (L14663) rather than no line at all.
    This panel had been drawing only the engineering fragment, and nothing where
    there was no recipe. `edsb-module-identity-badge` already draws exactly this
    line for the same module on a ledger row, from the module's class, rating and
    mount as three separate package values, so it is composed here rather than
    re-set (constitution VII).

    Two consequences worth naming. The badge joined every part with `·`, which
    drew `1F · FIXED`; the canvas never puts a dot between a class code and a
    mount and always does for what follows one (`8A · CHARGE ENHANCED G5` on a
    module with no mount), so the join is now a space there and the dot after.
    That is a shared component, so it moves the ledger and the manifest to the
    drawing too. And the badge draws no `STOCK` where the package published no
    recipe: that is feature 002's decision about its own line, unchanged here,
    and the alternative — this feature inventing a placeholder word for a shared
    component — is the thing the template rule forbids.

    The badge draws the name at two scales, and asking for the right one is part
    of composing it. Canvas 1c sets a ledger row's module name `500 13px`
    (L6871) and this panel's weapon name `400 10.5px` (L14427), the name here
    being one of the row's columns rather than its subject; the badge takes a
    `compact` input for the smaller. Its code line needs no such choice — the
    canvas draws it 9px on the one and 8px on the other, and the type scale's
    `micro` step is mapped to that whole 7.5–9.5 band.

17. **The mount the workspace has selected is ringed — a sanctioned departure,
    2026-08-26.** Neither canvas draws a selection on the gunsight; canvas 1c's
    plate has no relationship to the mount its ledger has open. The maintainer
    asked for one, and the workspace already has the state: feature 002's ledger
    and feature 010's hull schematics both mark the selected slot, from the same
    `selectedSlotKey`, so a plate that ignored it was the odd one out among the
    three drawings of the same hull.

    **It takes the canvas's second ink, and that ink stops meaning what the
    canvas spends it on.** `wireConvergence` colours a mark by
    `mount === 'GIMBALLED'` and nothing finer — one hue for an aimed mount, one
    for everything else. This plate has three things to separate where the
    canvas had one: a mount with a weapon on it, a mount with none, and the
    mount being worked on. Asked on 2026-08-26 which of them the second hue
    should say, the maintainer's answer was selection, and the fixed-against-
    aimed distinction is withdrawn from the drawing with it.

    Nothing is lost by that. A colour was never a reading here — how each weapon
    aims has always been named in that mount's own sentence beside the plate,
    and it still is, now as the only place it is said rather than as the
    reinforcement of an ink. What is gained is that the one fact about this
    diagram no other mark could carry — which mount a Commander currently has
    open — is carried.

    Whether the mount is armed stays with the fill against the outline rather
    than with the hue, so a selected empty hardpoint is still visibly empty: a
    mark that filled itself in to say "selected" would be reporting a weapon
    that is not there.

    **The ring around that mark is withdrawn, 2026-08-26 (Commander request).**
    It was drawn in the same ink beside the fill, so the selected mark would
    still stand out to a reader who cannot tell the two hues apart. Review note
    19's second revision is what unseats it: a crowded plate now draws every
    numeral out on a ring of its own with a leader back to each dot, and a
    second circle around one dot in the middle of that reads as a third kind of
    mark rather than as emphasis of the first. The mark keeps the ink, and the
    fact keeps the place it always had to be carried anyway — the mount's own
    sentence beside the plate names it as the selected one, which is what
    satisfies 011 FR-010 with or without a ring.

18. **The target-range track and the plate's size are the maintainer's, not the
    canvas's — 2026-08-26.** Two numbers, both properties of the drawing rather
    than of any build, and neither changes a figure: every reading the block
    gives is the package's own answer at whatever distance the track is set to,
    drawn at whatever size the plate is.

    `wireConvergence`'s track ran `100`–`2000` on a `25` step and opened at
    `600` when this note was written; the same 2026-08-26 revision this note
    records took it to `500`–`5000` on a `50` step opening at `1500`, which is
    what the file declares today. The built track now runs **`500`–`3000` on a `50` step and
    opens at `1500`** — the ceiling was `5000` between 2026-08-26 and
    2026-08-27, and the step and the
    initial value are the ones the code has carried throughout. The
    canvas's own sample never had to reach a real weapon's maximum range; a
    Multi-Cannon on this application's reference hull states `3,000 m`, and a
    track stopping at 2,000 m could not be moved to the distance a Commander was
    asking about. The step follows the span — 25 m over 4,500 m is a finer
    increment than a gunsight can be read at.

    The plate is drawn at **`8rem`** rather than the canvas's `172px`. It is
    decorative in full, and at the canvas's width it was the tallest thing in the
    offence panel: it set the whole convergence block's height on its own, at
    230px against the 186px it takes now. Squareness is the property that matters
    on this plate — it is what makes a mapping that is square in angle level in
    pixels — and every mark is placed as a fraction of the plate rather than in
    pixels, so it is the same diagram at either size. The one pixel constant that
    has to follow it is the reference width the hardpoint numerals' four corner
    offsets are chosen against, which carries no reading: every mark on this
    plate is stated in words beside it.

19. **The numerals may not collide, and the plate gains a boresight
    (2026-08-26).** The canvas's own rule picks, for each mount, whichever of
    four corners stands furthest from every other **dot**. That reads the wrong
    thing. Two mounts far enough apart both score their inward corner well and
    each aims its numeral straight at the other's: the dots stay apart and the
    numerals land on the same few pixels. The Caspian Explorer at 1,000 m is
    the reported case — hardpoint 1 sits a thousandth of a metre off the
    centreline between the mirrored pair 6 and 7, its four candidates tie to
    within a five-thousandth of a pixel, and whichever way the tie falls its
    numeral is drawn over one of them, 2.72px apart at a 7px text size.

    What is built measures what actually overlaps: a numeral's own ink box
    against every dot on the plate and against every numeral already placed. A
    corner that clears them all is taken, in the canvas's own order, so a plate
    with room everywhere is drawn exactly as the canvas draws it and this rule
    only shows itself where marks would have collided.

    **Where any numeral has no clear corner, every numeral leaves — 2026-08-26,
    Commander request.** The first build pushed out only the numeral that
    failed, along the line from the plate's centre through its own dot. That
    left the plate read two ways at once: most numerals tucked against their
    dots, one of them out on a leader, and nothing on the drawing to say the odd
    one out was the same kind of mark as the rest. So the plate takes one
    arrangement or the other whole. The moment one numeral cannot be placed,
    all of them go to a ring just inside the frame, each with its own leader
    back to its own dot.

    On that ring each numeral keeps the direction its own dot lies in. The ring
    is walked in the dots' own angular order about the plate's centre, and each
    numeral is set as near its own bearing as a minimum spacing allows — so a
    mount on the left of the plate keeps a numeral on the left, no two leaders
    cross, and a numeral is moved only as far round as the crowd forces it to
    be. The spacing is the chord that keeps two boxes apart at that radius,
    measured on the box's diagonal rather than its widest side, because two
    boxes standing corner to corner overlap at a distance where two standing
    square to each other do not.

    **The dot does not move.** On a hull schematic the mark _is_ the mount and
    may be walked to where there is room; here the dot is the reading, because
    it is where the shot lands. Only the numeral travels, and a numeral carries
    no reading of its own — every mark is stated in words beside the plate,
    with the offset and angle that shot really has — so where it sits changes
    nothing a Commander is told (FR-011).

    Measured over the package's own gunsights: 48 hulls at every 500 m step the
    track reaches, 2,574 marks in all, no two numerals overlapping anywhere and
    none stepped off the plate. Roughly a quarter of the marks are displaced,
    almost all of them at the long ranges where every shot converges on the
    middle of the plate — and since the 2026-08-26 revision every plate that
    displaces one displaces all of its own.

    **The numeral is offset from its dot as a share of the plate, not in
    pixels.** The plate is `min(100%, …)`, so a narrow column draws it below the
    reference width the corner offsets are chosen at. Held in pixels, the
    numeral's box stayed the same size while the dot it hangs off moved with the
    plate, and the leader — which is drawn in the plate's own percentage
    coordinates — ended somewhere the numeral was not. That is the reported case
    of a leader that is slightly off (2026-08-26). The box is drawn at exactly
    the size the placement measured, in the same shares, so the collision
    arithmetic, the ink a reader sees and the line that reaches it cannot
    disagree at any plate width.

    The same revision adds the **boresight** — the ring and centre dot the
    canvas draws on the axis (1c @15526-15548, 1d @31743-31766). It is where
    the hull points, and therefore what every shot is offset _from_. It is a
    property of the drawing: it takes no build state, carries no colour that
    means anything, and needs no sentence, because it says the same thing on
    every plate.

20. **One mark a mount, three fills, and the block's own width
    (2026-08-27, Commander request).** Three things at once, all of them about
    the drawing and none about a figure.

    **The numerals go.** Review note 19 built them clear of each other, out on a
    ring when a plate ran out of corners, each on its own leader. It worked and
    it was still the wrong drawing: a gunsight 172px across carrying a numeral
    for every hardpoint reads as a page of digits laid over a diagram, and every
    one of those digits was already the first thing that mount's sentence beside
    the plate says. So the numeral, `placeNumerals`, the leaders and the ring
    are all withdrawn, and what is left is one dot a mount. Nothing on the plate
    carries text now — which is also what lets an empty mount take a mark ink
    rather than a text one, since there is no numeral left to hold to the 4.5:1
    a 7px digit owes.

    **The empty mount's outline goes with them.** An unfitted hardpoint was
    drawn hollow — the plate's ground inside a quiet outline — so that a shape
    difference carried what an ink difference could not on a 7px mark. On a
    plate of nothing but dots that reads as another _kind_ of mark rather than
    as the absence of a weapon. All three states are one shape now, told apart
    by fill alone: the armed mount's amber, the same amber gone stale
    (`--edsb-palette-amber-deep`, 3.62:1 against the worst stripe of the plate's
    hatch and 3.96:1 against its halo's ground) for a mount with
    nothing on it, and the cool ink for the mount the workspace has open. The
    selection ink wins over the stale one where a selected hardpoint is empty,
    and that mount's sentence — unchanged — says both. No reading moves: the
    sentences carried all three facts before this and carry all three after
    (FR-011, FR-012, FR-013).

    **The block stops at the canvas's own 508px.** This document's "Panel
    layout" read block 3 as spanning the full width beneath the pair, and the
    canvas gives it `max-width: 508px; align-self: flex-start` (@660195). Built across the
    row, a 172px plate stood marooned in the middle of an 862px frame with the
    range field stretched out beside it. It is the bound that was missing, not a
    departure: the built block now stops where the canvas stops it and sits at
    the leading edge, which is the canvas's own arrangement at the canvas's own
    width.

21. **A bigger plate, marks that are left off it, a shorter track and no dot in
    the boresight (2026-08-27, Commander request).** Four more properties of the
    drawing, none of which moves a figure.

    **The plate is drawn at `14rem` — 224px — against the canvas's 172px.** With
    the block bounded at 508px (review note 20) the plate is no longer setting
    the panel's height, and 172px inside that frame is a small drawing with air
    around it. 224px is half of what the bounded block holds: 508 less its two
    18px insets and its two hairlines is a 470px content box, and less the 22px
    gap that is 448px shared by the plate and the range column.
    Squareness is what matters and every mark is a fraction of the plate, so it
    is the same diagram at 128, 172 or 224 pixels.

    **A shot outside the field of view is left off the plate.** The canvas
    clamps every dot to `4%`–`96%` and this followed it. Held at the margin, a
    dot says a shot lands where it does not, and the mounts that reach the margin
    pile up along it as a spread the build does not have. Measured over the
    package's own gunsights at the track's shortest range: three of the reference
    hull's eight mounts leave the plate, thirty-six of the forty-eight hulls lose
    none at all, and three lose a majority. `PLATE_MARGIN_FRACTION` becomes the bound past which a mount
    is **not drawn**: its sentence beside the plate stays, carrying the offset
    and the angle it really has, so nothing is lost but a misleading mark. This
    is the first thing on this plate that is only in the text (`spec.md`
    FR-011).

    **The track stops at 3,000 m.** Review note 18 took the ceiling to 5,000 m
    to reach past a weapon's maximum range, and this brings it back to 3,000 m
    as a preference about the drawing — stated as one, because it is not a
    package fact: a cannon states 4,500 m and a multi-cannon 4,000 m, both of
    which fit this hull, so a build carrying one can be fired past the end of
    this track. What the track is for is watching the shots close on the axis,
    and an offset subtends less and less of the plate as the range grows, so the
    steps past 3,000 m are the ones that move the marks least. Note 18's own
    line that "a Multi-Cannon on this application's reference hull states a
    maximum range of 3,000 m" is wrong on the same figures, and is corrected
    here rather than edited there: it is the stock hull's _pulse lasers_ that
    state 3,000 m.

    **The boresight loses its centre dot.** The canvas draws a filled 3px dot
    inside the boresight ring. On a plate whose marks were dots beside numerals
    it read as the axis; on a plate of nothing but dots it reads as a shot
    landing dead on the axis, which is the one thing it is not. The ring stays,
    and it is still where the hull points.

    **One canvas fact recorded here is deliberately not adopted**: block 3's
    tighter `13px 14px` inset. Every `.offence__block` takes the panel's one
    inset, `16px 18px`, so the three blocks are the same plate; at 508px that
    leaves a 470px content box, still within the canvas's own 480px inner bound.

## States no canvas draws

Neither canvas draws: no build, pending, projection failure, no fitted weapons,
unavailable hardpoint coverage, an all-disabled or genuine-zero weapon, absent
`unclassified`, absent range, piercing or projectile members, zero capacity, an
immediate or infinite time to drain, a build dealing no conventional damage, a
hull the gunsight catalogue does not place, a placed hull the build has armed
nothing on, a hardpoint on the plate with nothing fitted to it, the mount the
workspace has selected, a target range the canvas's own script never draws, or a shot
far enough off-axis for the plate to leave it off the drawing. They are required all the same, and they come from
[offence-profile.md](./offence-profile.md) and
[component-state-preview-matrix.md](./component-state-preview-matrix.md), not
from the mock.

## Canvas revision, 2026-08-25

The canvas changed under a built region. What follows is the whole of it for
this feature, and each item is written into the section it belongs to above.

The table below was written when the revision landed and every drawn item was
outstanding. **All of them are now built**, and the status column records what
each one is built as rather than what it was waiting on.

| Change                                                       | Status against the build                                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `RANGE` column added to the weapon list, before `FALLOFF`    | **Built.** `maximumRange` on the row between `PIERCE` and `FALLOFF`; absent stays not-stated text.           |
| `GUNSIGHT VIEW AT TARGET RANGE` note removed                 | **Built.** `offence.convergence.note` is withdrawn from both catalogues.                                     |
| Ring caption moved onto the block's heading line             | **Superseded 2026-08-26**: the caption is drawn nowhere in the canvas, and the block's heading stands alone. |
| `AT THIS RANGE` dropped from the ring caption                | **Superseded 2026-08-26**: the caption is withdrawn whole, and `offence.convergence.ring` with it.           |
| `IMPACT PLANE` rule removed                                  | **Built.** `offence.convergence.impact-plane` is withdrawn from both catalogues.                             |
| Field of view `115 mrad` → `40 mrad`                         | **Built.** `FIELD_OF_VIEW_MILLIRADIANS = 40`.                                                                |
| Plate square in angle; `ASPECT = 6 / 16` withdrawn           | **Built.** `PLATE_ASPECT` is gone, and the box is the canvas's own square one, so a ring is a pixel circle.  |
| Off-axis shots clamped to the frame, not clipped             | **Departed 2026-08-27.** `PLATE_MARGIN_FRACTION` is now the bound past which a mount is not drawn at all.    |
| Edge badge and leader replaced by a numeral beside the dot   | **Departed 2026-08-27.** One dot per mount and no numeral at all; the mount's number is in its sentence.     |
| Slider re-laid out: `TARGET RANGE` and value above the track | **Built.** `edsb-range-field` sets label and value on the row above its track.                               |
| Canvas 1d rewritten as canvas 1c's blocks stacked            | **Already built.** One DOM at both widths was the built answer; the drawing now agrees.                      |
| `VS 45% RESIST` block removed from canvas 1d                 | **Already correct.** It was excluded; it is now not drawn at all.                                            |
| `CORROSIVE +30%` chip kept on canvas 1d                      | **Still excluded.** No package field publishes an effect bonus.                                              |

The convergence items were one change, not ten: the plate's field of view, its
aspect, its clamping and its marks are `wireConvergence`'s own, and the built
plate mirrored the old script exactly. It was rebuilt by re-deriving
`convergence.ts` from the new script rather than by patching a constant.

**One thing the revised drawing does that the built region deliberately does
not**, and it is an arrangement rather than a figure: the weapon list's aligned
table.

_(The four fact cells stood here too, as the second of the two. The 2026-08-26
canvas draws none of them and neither does the built region, so the comparison
has nothing left to make — see the build table above and review note 21.)_

**The weapon list's aligned table is drawn only where five columns fit, which on
a 1440px desktop is not this block.** Canvas 1c draws its five columns in a card
wider than the one that viewport gives the `WEAPONS` block: measured in Chromium
against the stock Anaconda, the list is given 300px there.

What "fit" means was re-measured on 2026-08-26, after the built table drew its
five columns as one flexible module track beside four content-sized figure
tracks. That gives every spare pixel to the module name and none to the figures,
and the row reads as a name with a field of empty ground after it and four
figures crushed against the trailing edge — which is not the table canvas 1c
draws, where `MODULE` is about twice a figure column and the four figure columns
are the same width as each other. The five tracks are now all flexible in the
canvas's own proportion, `2fr` against `1fr` each, above floors that hold the
module cell at the 155px two lines of a weapon's cell need.

That changes what the block has to be given before the table is worth drawing.
A figure column has to be at least as wide as the longer of its own head and its
own figure, and in German that is `DURCHSCHLAG` at 73.3px rather than about 50px
for `3,000 m`. So 155px + 4 × 73.3px + four 10px gutters ≈ 488px, and the table
promotes at **31rem**; below that a head no longer fits its own column and
breaks inside its own word, which is not a column head. The earlier 26rem was
measured against the old track list, where what collapsed first was the module
name rather than the heads.

Below the threshold the compact arrangement carries the same five figures with
the word that names each one beside it. Nothing is dropped and no figure loses
the label that names it; what is lost is the alignment, at widths where
alignment would have cost a column its head or the module its name. The canvas
reaches an aligned table at phone width by a route this list does not take —
canvas 1d folds `FALL 1,800` under the range cell, four columns carrying five
figures — and that route alone does not reach this floor either: folded into
four columns at 300px the module track comes out at 140px in English and 90px in
German, because it is the heads that size those columns and canvas 1d
abbreviates its own to `PRC`. Restoring the table at 1440px means abbreviating
the heads as well, which is a change to what the columns are called and not only
to how they are laid out.

The plate's **box** is not in that category, and is built as the canvas draws
it: square, in a wrapping row with the range beside it. Its width and what
stands under it have both moved since — `14rem` rather than the canvas's 172px,
and no cells at all — and both are recorded in review notes 20 and 21. An earlier revision of this paragraph defended keeping the
wide `16 / 6` box on the ground that §3 above said the box "stays wide". That
was a misreading of the script and is corrected there: the box's aspect is not
composition, because under a mapping square in angle it _is_ the drawing's
vertical scale, and a wide box would have squashed every shot's height by
`16 / 6` and clipped both rings.
