# Offence Profile

**Route context**: the `OFFENCE` mode of the hull anatomy region inside `/build`; no new route

**Design-system composition**: the anatomy mode strip; the range field; semantic not-stated and
unavailable text; localized game text and values; the status rail's own block pattern. The blocks
themselves are markup over tokens, as canvas 1c draws them: no metric definition group appears
anywhere on this panel.

[canvas-contract.md](./canvas-contract.md) is the template. This document says how the drawn
elements behave and what they do in the states no canvas draws; it adds no user-facing element the
contract does not sanction.

## Purpose

Let a Commander read what the build's weapons do, weapon by weapon, and how long the weapons
capacitor sustains them — without selecting a target or leaving the active build.

## Entry, exit and ownership

- `OFFENCE` is the fifth segment of the anatomy mode strip. Selecting it retitles the region
  `OFFENCE ANALYSIS`, hides the plates, the side selector and the legend, and draws this panel in the
  space they leave. Leaving it restores the mounts exactly as they were.
- Which mode is open, and the chosen convergence target range, are memory-only, and never enter build
  data, storage, history, route state, links or SLEF.
- Weapon rows are inert, as the canvas draws them. The mount control is in `HULL ANATOMY`.
- Feature 005 owns the WEP allocation. This panel reads it and never sets it: the canvas draws the
  pip control in `POWER`, and nowhere else.
- Losing the active build leaves the workspace in feature 001's no-build state; this panel draws
  nothing and asks the package nothing.

## Semantic information order

1. `WEAPONS` — the returned weapon count, the two damage totals, and the weapon collection;
2. `DAMAGE PROFILE` — the stacked damage bar and its legend, the four range bands, then the weapon
   capacitor;
3. `SHOT CONVERGENCE` — the gunsight plate and its shot sentences, the target-range control, and the
   four facts.

At roomy widths the first two blocks are the canvas's `1fr 1fr` pair and the third runs the full
width beneath them. At narrow widths, landscape phones, expanded text and 400% zoom all three stack
in the same order. The arrangement is chosen from the space
the region is given, not from a device name — the same rule feature 005's dashboard follows. No value
or action is omitted, abbreviated into ambiguity or moved to hover.

## WEAPONS

- The header carries the block name and the count of weapons the package returned, which is the
  canvas's `5 MOUNTED`.
- The headline is the canvas's pair: burst damage per second and sustained damage per second, each
  separately labelled. The canvas's own labels contradict each other between its two panels, so both
  figures are named in full and neither is left to a reader to infer.
- Numeric zero stays numeric. The exact package total is displayed even when every weapon is
  disabled, a weapon is a genuine zero, or hardpoint coverage is unavailable.
- The whole-build firing cost — capacitor draw, heat and deployed plant draw — is not shown. No canvas
  draws it here, and the capacitor's own `DRAW` row is the capacitor result's field, not this one.

### The weapon collection

The canvas's four columns, one row per returned weapon, in package order. The collection neither
sorts nor merges: two mounts carrying the same module are two rows, as the canvas draws them.

Summary content, which is the canvas's row exactly:

- the module's localized package name, with disclosed canonical fallback and an unavailable state;
- the code line beneath it — the module's class and rating, its mount, and any engineering summary
  after them — drawn by the same badge feature 002 draws on a ledger row;
- damage per second, armour piercing, and falloff range.

Piercing and falloff are frequently absent. An absent field is field-specific not-stated text, never
a zero and never an em dash standing in for a number.

A disabled weapon keeps its row and its own figures, and is marked as off.

**The row carries no control.** It does not navigate, disclose or select, and activating it does
nothing — the canvas draws the rows inert and the mount control lives in `HULL ANATOMY`. An earlier
revision added a details disclosure and a per-row slot action to every row; both are withdrawn
([canvas-contract.md](./canvas-contract.md), review note 5), and the fields the disclosure carried
are fields no canvas ever drew.

## DAMAGE PROFILE

- The canvas's stacked bar, one segment per conventional type in `damageByType` the build deals, and
  the legend beside it. The bar is decorative: each segment's own exact amount **and** its share are
  written in the legend, because a length and a colour are not a reading.
- The legend is the whole damage-by-type reading. A type the build does not deal — including an
  `unclassified` the package omits, which is how it says zero — gets no segment, no line and no
  stated zero, which is what both canvases do with one.
- `antiXeno` and `sustainedDamageByType` are not read at all: no canvas draws either
  (`design/canvas-contract.md`, review note 7).
- A build dealing no conventional damage draws no bar, rather than an empty one.
- No combined total, resistance result or target adjustment appears anywhere.

### DPS by range band

- The canvas's four distances — 500 m, 1,200 m, 1,800 m and 3,000 m — each carry what the enabled
  weapons together land there, from the package's own falloff at that distance.
- Each row is filled against the strongest band, and states its own figure whether or not the bar
  reaches. A build landing nothing anywhere is given no track at all, rather than four empty ones:
  there is nothing for the four to be read against, and an empty bar reads as a figure of nothing.
- No target, hardness, resistance or projectile path is modelled. The multiplier is the package's.

## Weapon capacitor

- The four fields a canvas draws, in the order the canvases draw them: sustained draw while firing,
  recharge rate and time to drain — canvas 1c's own three rows — with canvas 1d's `WEP CAP` capacity
  behind them. Each is a labelled fact in package units — megajoules and megajoules per second, not
  the canvas's mislabelled megawatts.
- The allocation those figures were read at is feature 005's, and the panel names the condition
  without offering to change it.
- Time to drain carries one of three meanings, each read off its own field: a positive finite result
  is localized seconds; zero means the capacitor drains immediately; and infinity means the recharge
  keeps pace, which draws `∞` with what the symbol stands for said beside it and kept out of sight.
  The package's own sentinel never leaves the projection as a number.
- Zero capacity is the package's own result and is shown as one. No cause is stated, offered or
  implied: the package does not say which of its reasons it was, so neither does this.
- Draw and recharge are the same quantity in the same unit, share one scale, and carry a bar each.
  Capacity is megajoules and time to drain is seconds; neither shares a scale with anything beside
  it, so neither is filled. Every one of the four is written in words either way.

## SHOT CONVERGENCE

- The gunsight plate is the canvas's: **40 milliradians** either side of the axis on **both** axes,
  square in angle, with the canvas's two dashed rings at a third and two thirds of that half field —
  circles in angle, so their pixel height is corrected for the box's own aspect. _(Redrawn by the
  2026-08-25 canvas revision, which had it at 115 milliradians over a six-sixteenths box.)_
- One mark per armed hardpoint, placed where the package projects its shot at the chosen range: a
  dot where the shot lands, and that mount's hardpoint numeral beside it, at whichever of the
  script's four candidate offsets stands furthest from every other dot. The edge badge and its
  leader are gone with the same revision.
- **The plate is a diagram and is hidden from assistive technology.** Every mark it draws is also a
  sentence beside it: a shot naming its weapon, its place in the hull's hardpoint order, how it is
  aimed and where its shot goes; and the ring caption, which is the one figure the plate draws that
  the four cells beneath it do not repeat. A shot the field of view does not reach is **clamped to
  the frame's own margin**, where the revised script puts it; its sentence still states its true
  offset and angle at that range, exactly as at any other. The field of view is a property of the
  drawing and never widens to fit a build.
- The target range is a range field over the canvas's own bounds — 100 m to 2,000 m, starting at
  600 m — announcing the distance as a Commander reads it rather than as a bare number. It is the one
  control this panel owns, and it sets nothing outside the panel.
- Four facts under the plate: the lateral span, the vertical span, the apparent spread at the chosen
  range, and the widest mount by its place in the hull's hardpoint order. The two spans are distances
  between mounts and do not move with the range; the spread does. All four are about a group of
  armed mounts, so a build that has armed none of them is given none of them.
- A hull the gunsight catalogue does not carry, or one whose gunsight does not line up with its
  hardpoints, says so. A convergence drawn from part of the mounts would be a spread nobody has.
  A hull the catalogue _does_ carry is drawn whether or not the build has armed any of it: saying
  the package publishes no geometry for a placed hull would be false. It keeps its axes and its
  rings and takes no mark, which is what the canvas's own script draws with nothing to place. A
  hardpoint the build has not filled is not drawn at all: the canvas faces one on its own sample
  build and says nothing whatsoever about it.
- The plate never mirrors. Its marks are placed physically, as the hull schematic's are: a gunsight
  is a view out of the cockpit, and a right-to-left interface does not move a ship's port hardpoint
  to starboard.

## Coverage, empty and qualification states

- An empty returned collection with feature 002's confirmed-empty coverage is stated as no weapons
  fitted.
- Unavailable coverage says the weapon result could not establish what is fitted. It never claims
  empty hardpoints, and `weapons.length` is never read as an answer.
- A non-empty collection with a zero total stays populated. Disabled and genuine-zero meanings stay
  visible per row.

## State behavior

| State                                    | Presentation                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| Workspace no build                       | Feature 001's no-build state; this panel draws nothing and calls nothing |
| Complete populated                       | Exact totals, damage types, capacitor and every returned weapon field    |
| Confirmed no fitted weapons              | Explicit empty meaning, with the package's own zero totals beside it     |
| Coverage unavailable                     | Explicit qualification; no fabricated output and no false empty claim    |
| Some or all returned weapons disabled    | Full rows with exact enabled flags and the package's own totals          |
| Genuine zero weapon                      | Complete row including numeric zero in every drawn column                |
| Unclassified absent                      | No segment, no legend line and no stated zero — and never unavailable    |
| Range or piercing member absent          | Field-specific not stated, never numeric zero                            |
| No conventional damage dealt             | No bar and no legend: nothing is drawn and no zero is stated             |
| Nothing landing at any range band        | Four stated figures and no track at all, rather than four empty bars     |
| Finite, immediate or infinite endurance  | The exact field, or `∞` with what it stands for said beside it           |
| Zero capacity                            | The package's own zero, with no cause attached                           |
| Gunsight unavailable for the hull        | Stated in words; no plate, no facts and no partial spread                |
| A placed hull with nothing armed         | The plate with its axes and rings, no marks, and none of the four facts  |
| A shot outside the plate's field of view | Clipped from the drawing, and kept in the sentences beside it            |

## Status contribution

The outfitting status rail receives one cell: the canvas's `DPS`, carrying sustained damage per
second from the same projection function this panel reads, over the same build. It is a label and a bare figure — no unit, no
second figure, no condition, because that is what the canvas draws. Unavailable hardpoint coverage
qualifies it once; an exact zero does not.

## Announcements

Nothing here announces. Both surfaces are read-only projections of the active build, every change to
them is a change a Commander just made somewhere they can see, and neither canvas draws a live
region. The target-range field announces itself, as a native range control does, and nothing else on
the panel speaks.

## Requirement mapping

The capability owns FR-001–FR-011, and records FR-012 as withdrawn. `WEAPONS` owns FR-002 and FR-005 with the collection owning
FR-004; `DAMAGE PROFILE` owns FR-003 for the bar and its legend, FR-008 for the range bands,
and FR-006 and FR-007 for the capacitor; `SHOT CONVERGENCE` owns FR-010 and FR-011; FR-012 is withdrawn. FR-009 is owned
wherever a bar is drawn, which is the range bands and two of the four capacitor rows. The whole panel
and the rail cell enforce FR-001's package-only boundary, and the canvas contract enforces SC-004.
