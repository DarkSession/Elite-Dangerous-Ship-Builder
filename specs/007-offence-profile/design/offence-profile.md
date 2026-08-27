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

**The pair opens at the wide container step, corrected 2026-08-26 (Commander request).** It opened at
the medium one, and the medium step is 24rem: a 430-pixel phone hands this region about 25rem, so on
a large phone the first two blocks went side by side where canvas 1d stacks them — two columns of about
12rem each once the gap is taken off, narrower than the readings they hold, with the labels wrapping
a word at a time. The wide step is the one feature 005's power dashboard has used since wave 13, and
a pair is only a pair while both halves can hold what is in them.

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

The canvas's five columns, one row per returned weapon, in package order. The collection neither
sorts nor merges: two mounts carrying the same module are two rows, as the canvas draws them.

Summary content, which is the canvas's row exactly:

- the module's localized package name, with disclosed canonical fallback and an unavailable state;
- the code line beneath it — the module's class and rating, its mount, and any engineering summary
  after them — drawn by the same badge feature 002 draws on a ledger row;
- damage per second, armour piercing, maximum range, and falloff range.

Piercing, maximum range and falloff are frequently absent. An absent field is field-specific
not-stated text, never
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

- The canvas's four distances — 500 m, 1,000 m, 2,000 m and 3,000 m — each carry what the enabled
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
- **One mark per hardpoint, and one only** — a dot where the package projects that mount's shot at
  the chosen range _(Commander request 2026-08-27)_. The hardpoint numeral that used to stand beside
  it is withdrawn, along with the placement that kept numerals clear of one another, the leaders and
  the ring a crowded plate sent them out on. A gunsight 172px across carrying a numeral for every
  hardpoint is a page of digits over a diagram, and every one of them is already the first thing
  that mount's own sentence says. The plate now draws no text at all.
- **The dots never move.** A dot is where the shot lands, and that is the reading. That is what
  separates this from feature 010's schematics, where the mark _is_ the mount and may be walked to
  where there is room; here two mounts that project to the same place are drawn there, and their
  sentences state the two offsets exactly.
- **The block stops at the canvas's own 508px**, at the leading edge of its row, rather than running
  the panel's width _(Commander request 2026-08-27; `design/canvas-contract.md`, review note 20)_.
  The plate inside it is a fixed square, so a block given the whole row stood a 172px drawing in the
  middle of an 862px frame with the range field stretched beside it.
- **The plate is a diagram and is hidden from assistive technology.** Every mark it draws is also a
  sentence beside it: a shot naming its weapon, its place in the hull's hardpoint order, how it is
  aimed and where its shot goes; and the ring caption, which is the one figure the plate draws that
  the four cells beneath it do not repeat. A shot the field of view does not reach is **clamped to
  the frame's own margin**, where the revised script puts it; its sentence still states its true
  offset and angle at that range, exactly as at any other. The field of view is a property of the
  drawing and never widens to fit a build.
- The target range is a range field over 500 m to 5,000 m on a 100 m step, starting at 1,000 m,
  announcing the distance as a Commander reads it rather than as a bare number. Those are the
  maintainer's bounds rather than the canvas's own 100 m–2,000 m: a weapon on this application's
  reference hull states a maximum range of 3,000 m, and a track that stopped short of it could not
  be moved to the distance being asked about (`design/canvas-contract.md`, review note 18). It is
  the one control this panel owns, and it sets nothing outside the panel.
- Four facts under the plate: the lateral span, the vertical span, the apparent spread at the chosen
  range, and the widest mount by its place in the hull's hardpoint order. The two spans are distances
  between mounts and do not move with the range; the spread does. All four are about a group of
  armed mounts, so a build that has armed none of them is given none of them.
- A hull the gunsight catalogue does not carry, or one whose gunsight does not line up with its
  hardpoints, says so. A convergence drawn from part of the mounts would be a spread nobody has.
  A hull the catalogue _does_ carry is drawn whether or not the build has armed any of it: saying
  the package publishes no geometry for a placed hull would be false. It keeps its axes, its rings
  and every one of its mounts, drawn empty.
- **Every hardpoint the catalogue places is drawn, armed or not.** Where a mount sits is a property
  of the hull rather than of what is on it, and a Commander deciding what to fit is asking exactly
  where a shot from that mount would go. An empty one is the same dot in the armed mount's own hue
  gone stale — filled, not hollow, since 2026-08-27 — and its own sentence beside the plate names it
  as empty. The outline went with the numerals: on a plate of nothing but dots a hollow mark reads
  as another kind of mark rather than as the absence of a weapon.
  Neither canvas draws this; it is a sanctioned departure asked for by the maintainer
  (`design/canvas-contract.md`, review note 8, and `spec.md` FR-012).
- **The mount the workspace has selected takes the plate's other ink**, and nothing else. The ring
  that used to be drawn around that mark is withdrawn _(Commander request 2026-08-26)_: a crowded
  plate now draws a ring of numerals with leaders across it, and a second circle around one dot in
  the middle of that reads as a third kind of mark rather than as emphasis. Nothing a reader had is
  lost, because the ring only ever repeated what the mark's own sentence beside the plate already
  says — which is where the fact has to live in any case, a colour never having been a reading
  (011 FR-022). That ink is the one the canvas spends on a gimballed mount; the
  fixed-against-aimed distinction is withdrawn from the drawing with it, because this plate has three
  things to separate where the canvas had one, and how a weapon aims is the one of them its own
  sentence was already carrying (`design/canvas-contract.md`, review note 17). A selected hardpoint
  with nothing on it takes the selection ink over the stale one — one mark carries one fill since
  2026-08-27 — and its sentence says it is empty _and_ selected, which is the sentence it always
  had. The selection is feature 002's own `selectedSlotKey`, the same
  one the ledger row and the hull schematics mark, so the three drawings of one hull cannot disagree
  about which mount is open. Its sentence beside the plate names it as the selected mount
  (`spec.md` FR-013).
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

| State                                    | Presentation                                                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------------- |
| Workspace no build                       | Feature 001's no-build state; this panel draws nothing and calls nothing               |
| Complete populated                       | Exact totals, damage types, capacitor and every returned weapon field                  |
| Confirmed no fitted weapons              | Explicit empty meaning, with the package's own zero totals beside it                   |
| Coverage unavailable                     | Explicit qualification; no fabricated output and no false empty claim                  |
| Some or all returned weapons disabled    | Full rows with exact enabled flags and the package's own totals                        |
| Genuine zero weapon                      | Complete row including numeric zero in every drawn column                              |
| Unclassified absent                      | No segment, no legend line and no stated zero — and never unavailable                  |
| Range or piercing member absent          | Field-specific not stated, never numeric zero                                          |
| No conventional damage dealt             | No bar and no legend: nothing is drawn and no zero is stated                           |
| Nothing landing at any range band        | Four stated figures and no track at all, rather than four empty bars                   |
| Finite, immediate or infinite endurance  | The exact field, or `∞` with what it stands for said beside it                         |
| Zero capacity                            | The package's own zero, with no cause attached                                         |
| Gunsight unavailable for the hull        | Stated in words; no plate, no facts and no partial spread                              |
| A placed hull with nothing armed         | The plate with its axes, its rings and every mount drawn empty; none of the four facts |
| A hardpoint with nothing fitted to it    | The same dot in the stale amber, and a sentence naming it as empty                     |
| The mount the workspace has selected     | The plate's third ink, and a sentence naming it as selected. No ring, no outline       |
| An empty hardpoint that is also selected | The selected ink, with the sentence saying both: one mark carries one fill             |
| A shot outside the plate's field of view | Held at the frame's own margin, and stated at its true angle beside it                 |
| A plate too crowded to separate two dots | Both dots drawn where the shots land; their two sentences state the two offsets        |

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

The capability owns FR-001–FR-013. `WEAPONS` owns FR-002 and FR-005 with the collection owning
FR-004; `DAMAGE PROFILE` owns FR-003 for the bar and its legend, FR-008 for the range bands, and
FR-006 and FR-007 for the capacitor; `SHOT CONVERGENCE` owns FR-010 to FR-013 — the projection, the
sentences beside the plate, every hardpoint on it and the ring on the selected one. FR-009 is owned
wherever a bar is drawn, which is the range bands and two of the four capacitor rows. The whole panel
and the rail cell enforce FR-001's package-only boundary, and the canvas contract enforces SC-004,
including the two departures FR-012 and FR-013 are (review notes 8 and 17).

FR-012 was withdrawn on 2026-08-24 and reinstated on 2026-08-26; `spec.md` carries the whole of why.
