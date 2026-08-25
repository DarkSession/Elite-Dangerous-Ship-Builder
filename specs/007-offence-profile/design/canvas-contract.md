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
then block 3 across the full width beneath it (`margin-top: 12px`).

Both drawn blocks are the same plate: `border: 1px solid var(--amber-a2)`,
`background: var(--panel)`, `padding: 16px 18px`, `gap: 13px`.

### 1. WEAPONS

- Header: `WEAPONS` left, `5 MOUNTED` right (@610707).
- A headline pair on the line below: `248.6` at 30px against
  `DPS BURST · 186.4 SUSTAINED` at 10px.
- A four-column list. The column head is
  `MODULE` (`flex: 1`) · `DPS` (46px) · `PIERCE` (44px) · `FALLOFF` (60px), the
  last three `text-align: right`.
- Five rows. Each row's `MODULE` cell is two lines: the module name in Barlow
  10.5px, and a code line in mono 8px beneath it — the module's class and rating,
  its mount, then whatever else is true of it, as
  `4A GIMBALLED · OVERCHARGED G5 · CORROSIVE`. Reading that second line as an
  engineering line is what made an earlier revision draw only its last part, and
  nothing at all under `3E FIXED · STOCK`. The three figure cells are one line
  each.

The five rows, verbatim:

| MODULE                                                           | DPS  | PIERCE | FALLOFF |
| ---------------------------------------------------------------- | ---- | ------ | ------- |
| Huge Multi-Cannon<br>`4A GIMBALLED · OVERCHARGED G5 · CORROSIVE` | 78.9 | 68     | 1,800 m |
| Large Beam Laser<br>`3D GIMBALLED · LONG RANGE G5`               | 41.4 | 52     | 1,200 m |
| Large Beam Laser<br>`3D GIMBALLED · LONG RANGE G5`               | 41.4 | 52     | 1,200 m |
| Large Multi-Cannon<br>`3E FIXED · STOCK`                         | 50.1 | 55     | 1,800 m |
| Medium Multi-Cannon<br>`2F GIMBALLED · OVERCHARGED G5`           | 36.8 | 45     | 1,600 m |

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
   figure: `500 m 248.6` · `1,200 m 204.1` · `1,800 m 134.8` · `3,000 m 47.2`;
3. `WEAPON CAPACITOR` (@642341) — three rows, each a label, a bar and a figure:
   `DRAW 5.61 MW` · `RECHARGE 3.90 MW` · `FULL FIRE 14.2 s`.

### 3. SHOT CONVERGENCE

Header `SHOT CONVERGENCE` left, `GUNSIGHT VIEW AT TARGET RANGE` right (@649971).
A gunsight diagram (`#cv-ring1`, `#cv-ring2`, `#cv-dots`, an `IMPACT PLANE` rule
and a `RING 2 · 10.0 m · 17 MRAD` caption), a draggable `RANGE` track from
`100 m` to `2,000 m` reading `600 m`, and four facts: `LATERAL SPAN 18.8 m` ·
`VERTICAL SPAN 6.5 m` · `APPARENT SPREAD 33 mrad` · `WIDEST MOUNT HP 6 · 9.8 m`.

## Canvas 1d — the mobile OFFENCE panel

`data-m-mode="offence"`, @1026240. It is not canvas 1c stacked. Four blocks:

1. `SUSTAINED DPS · 248.6`, the same kinetic/thermal bar, a legend without
   percentages (`KINETIC 165.8`, `THERMAL 82.8`), and the same four range bands;
2. `CONVERGENCE` — the gunsight again, a `RANGE` track and the same four facts;
3. `DAMAGE PROFILE` / `VS 45% RESIST` — `ALPHA 612` · `BURST DPS 318.4` ·
   `VS SHIELD 136.7` · `VS HULL 173.9`;
4. two chips: `WEP CAP 61 MJ · 14 s FIRE` and `CORROSIVE +30%`.

It draws no weapon list and no separate capacitor block. The mobile head map
titles it `OFFENCE`, not `OFFENCE ANALYSIS`.

## The status rail cell

Canvas 1c's status rail (@749242) draws six metric cells under feature 005's
`POWER` line: `SHIELD 1,842 MJ` · `ARMOUR 3,914` · `DPS 248.6` · `JUMP 21.4 ly` ·
`SPEED 200 m/s` · `MASS 1,142 t`. Canvas 1d draws the same six.

`DPS` is this feature's cell and the only one it may add. It is a label and a
bare figure: the canvas gives it no unit, no second figure and no condition.

## What is built

| Canvas element                                       | Built as                                                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `OFFENCE` strip segment, `OFFENCE ANALYSIS` title    | The mode, enabled; the region's rule renamed exactly as the script renames it.                               |
| `WEAPONS` header and `5 MOUNTED`                     | The block heading and the count of weapons the package returned (ruled exception 1).                         |
| `248.6` / `DPS BURST · 186.4 SUSTAINED`              | `total.damagePerSecond` at headline size, `total.sustainedDamagePerSecond` on the note beside it.            |
| `MODULE` / `DPS` / `PIERCE` / `FALLOFF` columns      | One row per returned weapon in package order: name, `damagePerSecond`, `armourPiercing`, `falloffRange`.     |
| The code line under a module name                    | `4A GIMBALLED · OVERCHARGED G5`, drawn by the same badge feature 002 draws on a ledger row.                  |
| Inert rows                                           | Inert rows. No disclosure, no action, no navigation (review note 5).                                         |
| `DAMAGE PROFILE` / `BY TYPE AND RANGE`               | The block heading and its note, both verbatim: the block now carries both halves.                            |
| The stacked kinetic/thermal bar                      | One segment per conventional type the build deals, each sized by its share of the conventional total.        |
| `KINETIC 165.8 · 67%` legend                         | Every conventional amount from `damageByType`, each with its share, as the legend line under the bar.        |
| `DPS BY RANGE BAND` and its four rows                | `damageFalloff()` applied to every enabled weapon at 500 m, 1,200 m, 1,800 m and 3,000 m.                    |
| The four range-band bars                             | Each band filled against the strongest band — one scale, and every figure is stated (review note 6).         |
| `WEAPON CAPACITOR` `DRAW` / `RECHARGE` / `FULL FIRE` | `sustainedEnergyPerSecond`, `rechargeRate` and `timeToDrain`, in package units.                              |
| Canvas 1d's `WEP CAP 61 MJ`                          | `capacity`, as a fourth row of the same block.                                                               |
| The capacitor bars                                   | `DRAW` and `RECHARGE` only: those two share MJ/s. `CAPACITY` and `FULL FIRE` do not (review note 6).         |
| `SHOT CONVERGENCE` / `GUNSIGHT VIEW AT TARGET RANGE` | The third block's heading and note, across the full width.                                                   |
| `#cv-ring1`, `#cv-ring2`, `#cv-dots`, `IMPACT PLANE` | A gunsight plate over the canvas's own 115 mrad field of view and `16 / 6` box.                              |
| The canvas's dot, edge badge and leader per mount    | The same three marks: the dot where the shot lands, the numbered badge at the plate's edge, the leader.      |
| The canvas's four fact cells                         | `repeat(4, 1fr)` label-over-figure cells with a hairline between them, falling to fewer columns when narrow. |
| The `RING 2 · 10.0 m · 17 MRAD` caption              | The outer ring's angle, and what it spans at the chosen range.                                               |
| The `RANGE` track, `100 m` to `2,000 m`, at `600 m`  | A range field over the canvas's own bounds, step and initial value.                                          |
| `LATERAL SPAN` / `VERTICAL SPAN`                     | The widest horizontal and vertical separation between two armed mounts, in metres.                           |
| `APPARENT SPREAD 33 mrad`                            | The diagonal of that spread at the chosen range, from the package's own projection.                          |
| `WIDEST MOUNT HP 6 · 9.8 m`                          | The armed mount furthest from the cockpit's axis, by its place in the hull's hardpoint order.                |
| Status rail `DPS 248.6`                              | One rail cell carrying `total.sustainedDamagePerSecond` (review note 2).                                     |

Three things are added, and all three are required by the drawing rather than
chosen:

1. **Every mark on the plate is also a sentence.** The plate is a diagram; it is
   hidden from assistive technology and each mark is restated beside it as text
   naming the weapon, its hardpoint, its mount and where its shot goes. The ring
   caption is stated with them, because it is the one figure the plate draws
   that the four cells beneath it do not repeat. A shot clipped by the field of
   view keeps its sentence (`spec.md` FR-011).
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

| Canvas element                                   | Why not                                                                                                         |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| The stacked bar's `title` tooltips               | Hover-only meaning, unreachable by touch (011 FR-006). The legend beside the bar states both figures.           |
| A damage-type list with a figure for each type   | No canvas draws one. The bar and its legend are the whole reading (review note 7).                              |
| `VS 45% RESIST`, `ALPHA`, `VS SHIELD`, `VS HULL` | Target simulation. The package returns no result against a target, and the canvas states no target model.       |
| `CORROSIVE +30%`                                 | An effect bonus no package field publishes.                                                                     |
| `MW` on `DRAW` and `RECHARGE`                    | The package returns MJ/s for both. Package units win.                                                           |
| `OUTPUT, RANGE, CONVERGENCE`                     | A mobile-only sub-line the desktop switching script does not carry.                                             |
| `PIERCE` drawn in two colours                    | The canvas states no rule for the difference, so there is nothing to build (review note 3).                     |
| Every sample figure                              | Non-authoritative. Desktop calls 248.6 burst and 186.4 sustained; mobile calls 248.6 sustained and 318.4 burst. |

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
- The per-weapon `WeaponMetrics` fields beyond the row's four columns, and every
  ammunition field. The canvas draws its weapon rows inert and gives them
  nowhere else to go (review note 5).
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
   reading, and colour alone could not carry one in any case (011 FR-022).
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
   the requirement moved instead: FR-004 now asks for the four columns the canvas
   draws, and the fields beyond them join the unread list above. Nothing that was
   on the screen and package-backed has been taken off it — the withdrawn
   disclosure carried fields no canvas ever drew.

6. **A bar only where a scale exists.** The canvas draws seven bars: four range
   bands and three capacitor rows. The four bands share one scale — damage per
   second at four distances — and are drawn. `DRAW` and `RECHARGE` are both MJ/s
   and share one, and are drawn. `CAPACITY` is MJ and `FULL FIRE` is seconds;
   neither shares a scale with anything beside it, so both keep their figure and
   lose their bar. This is feature 006's established rule, and it takes no figure
   off the screen: every capacitor value is stated in words either way.

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

8. **A hardpoint the build has not filled is drawn — withdrawn 2026-08-24.**
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

9. **A build that has armed nothing is still placed.** An earlier revision
   returned the unavailable state for it, which draws the sentence "the game
   data package does not publish gunsight geometry for this hull". For a hull
   the catalogue does place, that sentence is false. The two are separate
   answers: a hull the catalogue does not place is unavailable; a placed hull
   nobody has armed keeps the plate with its axes and its rings, takes no mark —
   which is what `wireConvergence` draws when its array is empty — and is given
   none of the four figures beneath the plate, all of which are about a group of
   armed mounts.

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
    sibling `IMPACT PLANE` caption stays uppercase, because it is words and
    carries no unit at all — the same rule as note 14, applied to a caption
    rather than a label.

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
    being one of four columns rather than the row's subject; the badge takes a
    `compact` input for the smaller. Its code line needs no such choice — the
    canvas draws it 9px on the one and 8px on the other, and the type scale's
    `micro` step is mapped to that whole 7.5–9.5 band.

## States no canvas draws

Neither canvas draws: no build, pending, projection failure, no fitted weapons,
unavailable hardpoint coverage, an all-disabled or genuine-zero weapon, absent
`unclassified`, absent range, piercing or projectile members, zero capacity, an
immediate or infinite time to drain, a build dealing no conventional damage, a
hull the gunsight catalogue does not place, a placed hull the build has armed
nothing on, or a shot the plate's field of view clips. They are required all the same, and they come from
[offence-profile.md](./offence-profile.md) and
[component-state-preview-matrix.md](./component-state-preview-matrix.md), not
from the mock.
