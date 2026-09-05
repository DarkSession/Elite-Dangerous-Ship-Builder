# Defence Profile

**Route context**: complete capability inside `/outfitting`; no new route

**Reference context**: `.design/Ship Builder.dc.html` canvas 1c wide Defence Analysis and canvas 1d
mobile Defence mode

**Design-system composition**: workspace capability navigation, metric/definition groups,
responsive damage relationship, calculation-issue notice, responsive reserve and fitted-role
collections, and localized values

## Purpose

Let a Commander read the package's shield, recovery, cell-bank, armour, hardness and module-
protection results for the active build without changing the build.

## Entry and exit

- The anatomy region's mode strip selects `DEFENCE` in one interaction and preserves the active
  build and the standing viewing conditions.
- Capability selection remains memory-only and never enters the fragment, local record or SLEF.
- The canvas draws no action inside either card: the surface is a reading, and the ledger and the
  bench six centimetres away are where a slot is reached.
- Losing/replacing the active build returns through the workspace's no-build/pending lifecycle.
  Feature 006 creates no placeholder hull or stale result.

## Semantic information order

1. the region's own `DEFENCE ANALYSIS` rule;
2. the shield card's name and the generator the package resolved;
3. shield strength as the headline pool;
4. four shield resistance/effective-MJ relationships, over one stated scale, each closed by the
   same pool read at the standing SYS allocation;
5. the recharge rate and the two recovery phases;
6. the shield role groups, each closed by the package's own aggregate;
7. the cell-bank reserve, as one line: the package total and the banks behind it;
8. the armour card's name and the bulkhead the package resolved;
9. hull hit points as the headline pool;
10. four armour resistance/effective-hull-point relationships, over the same stated scale;
11. hardness, module protection and module armour;
12. the armour role groups, each closed by the package's own aggregate.

A refused shield replaces its own block with the reasons the package gave, in the order it gave
them. A refused recovery replaces its own block with the reasons the strength has not already
stated, and is left out where none is left. The rest of the order is intact either way.

The DOM and screen-reader order always follows this list. At roomy widths the complete shield block
(items 2–7) and armour block (items 8–12) may appear as peer fluid columns. When either column would
truncate, overflow or lose target size, they become one stack. Tablet behavior follows available
inline space, not a device-name breakpoint. Landscape phones, expanded text and 400% zoom always use
the complete stacked composition.

**The pair opens at the wide container step, corrected 2026-08-26 (Commander request).** It opened at
the medium one, and the medium step is 24rem: a 430-pixel phone hands this region about 25rem, so on
a large phone the two cards went side by side where canvas 1d stacks them — two columns of about
12rem each once the gap is taken off, narrower than the readings they hold, with the labels wrapping
a word at a time. The wide step is the one feature 005's power dashboard has used since wave 13, and
a pair is only a pair while both halves can hold what is in them.

## Shield and recovery

- The headline is the package's own total strength. The four returned EHP values are the pools set
  beside the four resistances, not a substitute for it.
- Pair each damage resistance with its same-type EHP. The canvas's row order is the damage type,
  its bar, its resistance and its pool, on one line. The bar is supplemental, drawn over a scale
  the bar column's own width, and every length a bar draws is stated beside it as a figure.
- **The scale names zero and the far end, and each name stands on the place it names. Ruled
  2026-08-28 (Commander request).** The scale printed its floor and its ceiling as a row under the
  track with the two pushed to its ends, and zero as a third mark wherever the table reached below
  it. Two things were wrong with that. The names sat where the row's own edges fell rather than where
  the track begins and ends, so on a signed table `-20%` stood a little inside the length it names.
  And on a table that reaches nowhere below zero the floor _is_ zero, so the row printed the same
  figure twice, side by side, as `-0%%`.

  Each name is now a box of no width centred on the place it names: zero at the mark the bars are
  drawn from, and the ceiling at the end of the track. The floor is not named — where it is below
  zero the scale is read from the zero mark, and where it is not, naming it would be naming zero a
  second time. A box of no width is what centres a name on a mark without a transform that has to
  know which way the document runs.

- **A fifth column, added by the 2026-08-25 canvas revision: `MJ × N SYS PIPS`.** The shield table
  now closes each row with the same effective pool read at the standing SYS allocation, beside the
  bare one. `N` is that allocation, drawn into the heading and moving with it — the canvas samples
  it at four, which is a sample and not the label. At zero pips the column heads `× 0 SYS PIPS` and
  repeats the `MJ` column, which is correct and is what the reading means. The heading is two lines,
  as the canvas sets it (`MJ<br><span style="font-size: 7px">× 4 SYS PIPS</span>`): `MJ` over a
  smaller `× N SYS PIPS`. On one line it was the widest thing in the table, and it stood over a
  column of four-character figures. The
  heading states the allocation because a figure that moves with a condition shown without that
  condition is the misleading number constitution IV forbids. The armour table gains nothing: the
  canvas leaves it at four columns, and pips do not reach a hull.
- **The first four columns are the bare shield and stay still.** `RESIST` is the base resistance and
  `MJ` the pool that follows from it — `shieldMetricsResult()`, which since Almanac 0.2.0 takes no
  allocation at all. Moving a pip changes the fifth column and nothing else on the table. A
  resistance percentage with systems resistance folded into it is not drawn anywhere.
- The bar stays drawn from the **bare** resistance, the column it sits beside. Two lengths on one
  track, or a length drawn from one column and printed beside another, would be a reading the canvas
  does not draw.
- **The rows are set tight. Ruled 2026-08-28 (Commander request).** A cell takes 4px of block inset,
  not a control's 10px, which puts a damage row at 26px. A table row is not a control and has no
  target to hold, and at 38px there was more air between one resistance and the next than either of
  them occupied — half a screen of it across the two cards. 26px is what the offence panel's own
  range-band rows already read at, so the two analyses agree. The inset is the cells', so the column
  heads and the scale under the bars close up with the rows.
- **Each reason is stated once.** Everything that refuses the strength refuses the recovery too:
  both calls resolve the same generator and the same retracted power state first, and the recovery
  reads more besides. So the card draws an issue under the strength and does not draw it again under
  the recovery. A recovery with no reason of its own is left out of the card, its unavailable state
  with it. A recovery refused by anything else keeps that state and says what refused it.
- **The four states a Commander reaches by outfitting are stated in plain words.** No generator, a
  generator switched off, a generator the plant sheds and a plant switched off each get a sentence
  of this application's own, chosen by the package's `field` and `reason` and by nothing else. The
  package's English sentence is never read, parsed or reproduced — it opens with a raw slot key and
  module symbol, and it is the one thing `getCalculationIssueMessage()` cannot give any locale but
  English. Wording a structured result is labelling it, which principle II sanctions.
- Every other reason keeps the package's own words, every issue in package order, with its canonical
  language disclosed. The card derives no verdict of its own and folds no diagnosis into another:
  the four above and an unresolved record are five reasons and read as five.
- A refusal is standing content, not an announced update: the projection is read again at every
  build revision and at every pip move, and an unchanged refusal is not spoken again.
- No headline, no damage table, no source row and no action stands in for a refused result.
- Shield and recovery are independent in the one direction the package can reach: a complete
  strength stands beside a recovery refused on its own, and that refusal is stated. The reverse
  cannot occur — the recovery resolves the strength's own inputs first.
- Recovery presents the three readings the canvas draws — the recharge rate, `0→100%` and the broken
  reset. A phase that does not finish has its own phrase; raw “Infinity” is not shown.
- Role groups are named by what the package resolved and closed by the package's own aggregate. No
  row is given a share of it.

## Cell banks

- `noneFitted` draws no reserve line at all. The canvas has one line for a reserve, and a line
  reading zero is a reserve of nothing rather than no reserve.
- A fitted reserve is the package's own restorable total, with every bank aboard listed under it in
  package order, each on its own canvas row.
- A bank's row is a source row: the package's own name for the module, the class and rating from
  the fitted record, the cells it carries and its powered state on the code line, and what one
  activation restores as its figure with a bar drawn to it. It carries no restorable of its own,
  because the package publishes none per bank and one worked out here would be invented.
- Every bar in the block — the reserve's and each bank's — is drawn against the largest figure in
  it, so the reserve and one activation of one bank are read on one scale.
- Banks that differ in any of those are listed apart. Banks alike in all of them collapse into one
  row carrying the canvas's `×4`.
- All banks unpowered keeps the line, keeps every bank under it, and says so in words on each. The
  word is the whole of it: the canvas gives an unpowered bank's own line no colour.

## Armour and protection

- Show the `ArmourMetrics` fields the canvas draws. Armour EHP uses hull points, never MJ.
- The canvas's three protection facts are `HARDNESS`, `MODULE PROT.` and `INTEGRITY`, and they are
  the hull's hardness, the module-protection fraction and the module armour respectively.
- Hardness is the package's own value. No matchup against a weapon's armour piercing is generated.
- Armour remains complete when shield/recovery is missing, disabled, shed or otherwise unavailable.
- The actual fitted bulkhead is shown only from the package slot. Stock calculation fallback never
  fabricates a fitted source row.
- Armour role groups are named by what the package resolved and carry no apportioned value.

## State behavior

| State                           | Presentation                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| no active build                 | Shared no-build state and feature 001 actions; no package read                          |
| recomputing revision            | Shared pending state for the requested revision; no stale metric payload                |
| ready                           | Complete projection, current conditions and exact actions                               |
| shield/recovery unavailable     | Each package issue once, in package order; independent complete sections remain         |
| one reason refusing both        | Stated under the strength; the recovery block is removed with it                        |
| missing/disabled/shed/plant off | The capability's own sentence for that exact field and reason, and nothing in its place |
| any other diagnosis             | Exact issue field/reason and package-localized diagnostic, and nothing in its place     |
| non-finishing recovery phase    | Field-specific semantic phrase only for the affected duration                           |
| no banks                        | No reserve line at all                                                                  |
| all banks unpowered             | The reserve line, every bank in it and the word in text                                 |
| negative resistance             | Signed percentage, exact EHP and visible weakness meaning                               |
| unbounded EHP                   | Field-specific unbounded text with no clamped/substituted number                        |
| projection failure              | Shared blocking error for current revision; no fabricated/stale payload                 |
| unknown hull ingress            | Rejected before activation by feature 001/004; no Defence surface state                 |

## Responsive and interaction rules

- Desktop reference: retain the workspace's slot ledger, central capability and Status rail; the
  central Defence region uses fluid tracks, not the mock's fixed 392/fluid/306 pixel shell.
- Narrow reference: retain Defence as an in-workspace capability and stack shield then armour, but do
  not copy its abbreviated data footer. The complete reserve, sources and protection facts remain.
- A wide semantic table may become same-order labelled cards. Local table overflow is a last resort;
  the page never scrolls horizontally.
- No reading depends on hover, colour, bars, icons, fixed position or motion.
- The panel holds no control of its own: the mode strip that opened it is feature 010's, and it
  meets feature 011's 44 CSS-pixel baseline there.
- Logical properties and wrapping handle RTL, long game names and doubled application text.
- Reduced motion changes no result timing, order or meaning.

## Localization and announcements

Application headings, states, explanations, units and sentinels use localization keys. Numbers,
percentages, multipliers, counts and durations use the active locale. Module/hull/slot names and
calculation diagnostics use Almanac leaf helpers; unavailable locale results use feature 011's
canonical-language disclosure or unavailable state.

The canvas prints no live region in this panel, and the mode strip already says which layer is
open, so the surface announces nothing of its own: a reading that narrated every pip would talk over
the control being used.

## Requirement mapping

The surface owns FR-001–FR-009. Shield/recovery owns FR-002–FR-005; the reserve owns FR-006; armour
and protection own FR-007–FR-008; the named role groups own FR-009. The full surface enforces
FR-001's package-only and same-revision boundary.
