# Quickstart: Validate Power and Thermals

This is a validation guide, not an implementation guide. Contracts are under
[contracts/](./contracts/), the state model is in
[data-model.md](./data-model.md), and the screen is in
[design/power-and-heat-detail.md](./design/power-and-heat-detail.md).

> **Rewritten 2026-08-23 (wave 12).** The original guide validated a `powerAndHeat` detail
> capability behind a workspace selector, feature 003's shared draft/Apply/Reset conditions,
> integer half-pips, a `StatusProvider` bundle and a `MountPowerObservationPort`. Feature 003's
> rulings withdrew all of them. What is validated here is the surface the canvases draw.
>
> **Rewritten again 2026-08-24 (wave 13).** Wave 12's build was read against the artboard and
> rejected. The plates are gone in `POWER` mode rather than standing above the dashboard, there is
> no subtitle, no headroom, utilisation or verdict, no plant marker sentence and no module-row
> action; the four blocks are four plates; groups nothing is assigned to are left out; module lines
> read the selected state; and the rail draws the segmented bar the canvas draws. This guide
> validates that surface.

## 1. Establish the toolchain

```bash
nvm use
pnpm install --frozen-lockfile
```

Confirm:

- Node satisfies `.nvmrc` / `package.json#engines`;
- the Almanac resolves from the committed lockfile;
- production imports use leaf subpaths;
- TypeScript strict mode is enabled before feature work;
- prerequisite features 001, 002, 010 and 011 are implemented.

## 2. Verify prerequisite integration contracts

Before implementation acceptance, confirm:

- feature 001 exposes one active `ShipLoadout`, a numeric build revision, a no-build state and
  `/build`;
- feature 002 advances that revision on committed edits and reveals an exact slot target;
- feature 010 owns the hull plates, their side selector, their legend and the five-segment mode
  strip, and this feature enables one of those segments rather than adding a surface of its own;
- feature 011 supplies shared UI, localized formatting and game text, and the ten Playwright
  projects with their axe helper.

Expected: no feature 005 state duplicates a prerequisite, and this feature adds no capability
selector, no status provider and no observation port.

## 3. Run focused automated tests

```bash
pnpm test
pnpm exec playwright test e2e/power-and-heat.spec.ts
```

Expected: unit suites compare every view field with the package's own answer for the same build,
never with a figure written down in the suite. The browser suite runs the configured projects with
the shared accessibility helper.

## 4. Validate the selected hardpoint state

Use a build whose deployed draw sheds a lower priority group while its retracted draw does not:

1. Open `/build`, then the anatomy region's `POWER` segment.
2. Confirm the region retitles to `POWER & THERMALS`, that the plates, their side selector and their
   legend are gone, and that the dashboard is drawn in the space they left. Nothing stands under the
   rule explaining the panel: the canvas draws a title per mode and nothing else.
3. Confirm the four blocks are drawn as four plates, in the canvas's order — `PRIORITY GROUPS` and
   `DRAW BY MODULE` side by side where there is room for both, then `HEAT PROFILE`, then
   `POWER DISTRIBUTOR AND PIPS` — each on the panel ground inside its own hairline. The
   first two square up against each other and go no taller: neither is ruled off around empty
   ground.
4. Confirm `DEPLOYED` is selected, on its own line under the `PRIORITY GROUPS` header rather than
   inside it, behind the caption the canvas abbreviates to `H‑PTS` — drawn here as the whole word,
   set in capitals by the design system, and exposed as the segment pair's own accessible name
   rather than as a hidden string beside it — with no draft, Apply, Reset or error state.
5. Compare plant output, the powered draw, the unpowered remainder and every drawn group's own draw
   and cumulative share with the deployed `powerBudget()` result.
6. Confirm the three tiles under the groups are `PLANT OUTPUT`, `POWERED DRAW` and `UNPOWERED`, and
   that no headroom, no utilisation and no within-budget verdict is drawn anywhere: the canvas
   prints none of them, and no `n MW plant` sentence stands beside the groups either.
7. Select `RETRACTED`.
8. Compare every group figure, every module line and all three tiles with the retracted package
   fields.

Expected: exactly one state is shown at a time, it takes effect immediately, and both states state
the same three tiles — there is no sentence about missing figures, because nothing is missing.

## 5. Validate disabled and zero-output power

Use builds for:

- a disabled consumer;
- zero plant output with positive draw;
- a build whose plant sheds its lowest group.

Expected:

- a disabled consumer keeps its line, marked `· Off` and carrying the nothing it draws;
- every draw, group figure and tile equals its package value;
- one row per priority group this build actually puts something in, in ascending order — a group
  nothing is assigned to is left out rather than drawn empty, because an empty group is not a
  reading of this build;
- a group the plant does not keep lit reads `OFFLINE` in place of its percentage, which is the one
  thing the canvas draws in that column, and its bar is hatched rather than only reddened — as is a
  module line in that group;
- every track in a list starts and ends on the same two lines, whatever the figures beside it are:
  a longer draw widens the column for every row rather than shortening its own bar;
- zero plant output leaves every group unlit and the whole demand in `UNPOWERED`. No utilisation is
  derived, so there is no infinity to word, no glyph and no clamped percentage.

## 6. Validate module contributions

For every returned `PowerBudget.consumers` entry:

1. Compare the module name, its draw, its enabled state, its priority group and its deployed-only
   state.
2. Confirm the list is complete at every width — no `TOP DRAW` truncation — and that it is headed
   `MODULE` against `MW` over its own tracks, with the bar column between them unheaded and no
   total standing beside the block's heading.
3. Confirm mounts carrying the same module in the same group and the same enabled state are drawn as
   one line with the canvas's `x2` count, and that the count is the number of mounts behind it.
4. Confirm a deployed-only mount reads `0.00` while `RETRACTED` is selected, and that each state's
   lines add up to that state's own `TOTAL DRAW` row at the foot of the list.
5. Confirm a switched-off module reads `· Off` and the nothing it draws.
6. Confirm a line the plant leaves dark carries the canvas's `· GRP 4`, and that a line in a lit
   group carries no group at all.

Expected: a consumer the package did not return is not invented, and a consumer it returned without
a symbol is named by its slot rather than by an inferred identity. The list holds no control: the
canvas draws it as a reading, and feature 002's ledger is where a mount is selected.

## 7. Validate the distributor

1. Confirm the block states its name once. The heading is the plate's own; the table repeats it
   in no caption of its own.
2. Compare `SYS`, `ENG` and `WEP` capacity, rated recharge, returned pips and recharge rate with
   `distributorMetrics()` at the opening `2/2/2`.
3. Press each of a bank's four blocks. Confirm the bank lands on that **whole** count, that the six
   pips there are between the three banks are held, and that the other two paid half a pip each —
   from `2 · 2 · 2`, three in `SYS` leaves `1.5` in each of the others. Confirm a bank with nothing
   left to give pays nothing and the other pays the whole pip: from `1 · 4 · 1`, four in `SYS`
   gives `4 · 2 · 0`. Confirm no control offers a half pip directly.
4. Confirm pressing the block a bank already stands on steps it back one, which is the only way down
   to none through four blocks that each name a count.
5. Confirm capacity and rated recharge never move: they are properties of the fitted distributor.
6. Confirm the pips shown are the pips the result carries, not the ones pressed.
7. Confirm zero pips reads as a genuine zero recharge.
8. Confirm the figures keep their columns at every width: the pip blocks take the space they need
   and no more, and no capacity, rated recharge or recharge rate wraps or is cut off.
9. Exercise a `null` result — an absent, switched-off, unresolvable or retracted-shed distributor.

Expected: every field equals `distributorMetrics()`; there is no draft, no running total across the
three banks and no validation; a `null` result is one unavailable group with no catalogue figure and
no diagnosis of which of the four reasons it was, and power, heat and the conditions stay usable.

## 8. Validate heat

For a ready heat profile:

1. Compare heat efficiency, hull heat capacity and hull heat dissipation.
2. In order, compare idle, thrusters, FSD charging, sustained fire and drained-capacitor fire.
3. For each, compare all five `HeatState` fields.
4. Repeat with a build that never settles under sustained fire.
5. Repeat with a build the package returns `null` heat for.

Then confirm the block is one plate split down the middle: the five bars and the threshold caption
on the leading side, and the two-key legend over the canvas's `RESTING HEAT`, `PEAK SUSTAINED`,
`DISSIPATION` and `HEAT SINKS` tiles in a column of equal width beside them. The key reads before
the tiles at both arrangements — it explains the bars, not the four figures. Confirm each scenario
name carries its description in the system's own tooltip rather than in a `title`: hover one and it
is drawn, press one and it is drawn, press it again and it is put away, and `Escape` puts away
whichever is on screen. Confirm the pointer can travel from the name onto the bubble without it
collapsing on the way. Then confirm none of the six is reachable _only_ by hovering — every gloss is
related to its own name by `aria-describedby` whether or not it is drawn, so a screen reader reads
it without touching a control. The caption sits under the threshold line drawn through the bars, and
a level that never settles reads `∞` with the sentence it stands for carried beside it. `PEAK SUSTAINED` is the hottest of the bars drawn
beside it, picked out rather than worked out; `HEAT SINKS` is the count of what is fitted over the
canvas's `2 x 3` breakdown, which is absent where the launchers do not all carry the same charges.

Expected: five scenarios whenever the profile is ready, each carrying the package's own figures. A
load that never settles and a scenario that never overheats are distinct statements, each read off
its own field. `null` remains unavailable, with no hull or catalogue figure standing in.

## 9. Validate the mode and the status rail

1. Open the `POWER` segment and confirm the plates, the side selector and the legend are gone rather
   than dimmed, and that leaving the mode restores the mounts layer exactly as it was. The canvas's
   switching script hides the plate container outside `mounts`, so nothing reads a priority group
   off a mount: the groups are read in `PRIORITY GROUPS` and the mounts in `DRAW BY MODULE`.
2. In the status rail, confirm one sentence per priority group the package reports unpowered with
   the hardpoints deployed, each naming its group and its own deployed draw, and no severity word
   standing beside it to grade it.
3. Confirm a build whose plant covers every group states no sentence at all: neither canvas draws an
   all-clear line, and silence claims strictly less than one would.
4. Confirm the `POWER` line reads the lit draw against plant output, and that the canvas's
   `· 7.80 OFF` suffix appears only where something is dark.
5. Confirm the bar under it draws those same figures over the whole demand — the lit length, the
   dark length after it, and a mark where the plant runs out — and that it carries a name rather
   than being left a shape to guess at. Where the plant covers the demand the track scales to the
   plant instead, so the mark lands at the end of it rather than off it.
6. Confirm the rail reads the deployed state whatever the dashboard is showing.
7. Confirm the block is inset from both of the rail's seams, as the groups above and below it are.
8. Confirm the sentence, the `POWER` line and the bar hold no control between them, and that no heat
   sentence is drawn here: what a build does under sustained fire is stated in the heat profile,
   which is the block that draws it.
9. Confirm the three pip groups under the bar — `SYS`, `ENG` and `WEP`, four blocks each, filled
   from the leading edge — and that each is named with the allocation it stands at and each block
   with the bank and the count pressing it asks for.
10. Confirm the rail's control and the distributor cell move **one** allocation: set a bank from the
    rail and read the change in the distributor table, then set it from the table and read the
    change in the rail. Neither is a draft, and neither carries a running total.
11. Confirm the pip control is still drawn after leaving `POWER` for another anatomy mode, which is
    the whole reason it is in the rail: the distributor table goes with the mode and the rail does
    not.
12. Confirm every one of the rail's twelve blocks meets the same target baseline the distributor
    cell's blocks meet, at all five layout profiles.

Expected: the rail and the dashboard are two readings of one projection of one package answer, and
they agree for the same build — including the allocation, which is one condition drawn in two
places.

## 10. Validate responsive, accessibility and localization behavior

Exercise the ready, retracted, unavailable-distributor and unavailable-heat states at desktop,
tablet and mobile portrait and landscape, in Chromium and Firefox:

- run axe and fail every in-scope violation;
- verify headings, captions, table relationships and visible control names that match their
  accessible names;
- verify a text equivalent for every state the treatment draws;
- verify distinct accessible names for every pip block, each naming its bank and the count it asks
  for, and the shared touch-target sizing on all twelve of them;
- verify 200% text and actual 400% zoom without the document scrolling horizontally;
- verify expanded translations, RTL, reduced motion and both orientations;
- confirm nothing here is announced: both controls report their own state and the region is on
  screen.

Switch through every shipped locale. Confirm owned text and sentinel statements come from messages,
numbers and units use active-locale formatting, and module names come from the Almanac through
feature 011's game-text presenter.

If conformance is stated, name the exclusions: WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4,
2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.

## 11. Run the complete gate

```bash
pnpm run check
```

Expected: the format check, every typecheck, the policy checks — including
`scripts/policy/power-heat-ownership.mjs` — the static build, unit coverage at or above 80% on
every threshold, and the complete dual-engine Playwright and accessibility matrix pass with no
skipped, focused or quarantined case.
