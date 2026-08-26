# Visual Reference Review

## Reference scope

`.design/Ship Builder.dc.html` is a local, ignored visual reference, not a
runtime asset or source of game values. Feature 005 appears in:

- canvas `#1c` (“Outfitting … live stats”), beginning around line 621;
  its Power tab is part of the central analysis area and reveals
  `data-anat-detail="power"` around lines 966–1184;
- canvas `#1d` (“Mobile — full outfitting …”), beginning around line 1745;
  its stacked `data-m-mode="power"` appears around lines 2083–2155.

The package, accepted specs, constitution and implemented feature 011 design
system override every sample number, label, interaction and CSS literal.

## Adopted direction

| Reference idea                                         | Planned adaptation                                                                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Power and Thermals is a peer build-analysis capability | Compose one `powerAndHeat` capability inside `/build`, reachable from feature 003's power summary and workspace capability selection. |
| Selected hardpoint state precedes power analysis       | Reuse feature 003's shared condition group and present one selected package state, default deployed.                                  |
| Capacity, priority bands and module draw are adjacent  | Keep this comparison with all five bands, exact package fields and one row per returned consumer.                                     |
| Heat follows power, then distributor                   | Preserve that semantic/narrow order with the exact five heat scenarios and all three complete capacitors.                             |
| Wide panels form a compact dashboard                   | Use fluid design-system regions where inline space supports them without changing semantic order.                                     |
| Mobile analysis becomes stacked cards                  | Stack complete content at narrow widths, landscape phones, expanded text and 400% zoom.                                               |
| Power warnings also appear in build status             | Supply feature 003's compact revision-stamped power projection; feature 003 owns its rail/capability placement.                       |
| Power facts can augment hardpoint geometry             | Supply feature 010's exact-slot observation port; diagrams remain supplemental to complete text.                                      |

## Required departures

### Power

- Both mock variants show only groups 1–4 although the package has five. All
  five bands remain present, including zero draw.
- Desktop module rows aggregate identical weapons; mobile truncates to “TOP
  DRAW.” FR-005/FR-006 require one complete package consumer per exact slot.
- Module rows omit exact slot, enabled, priority and deployed-only state. The
  implementation includes each and a named slot action.
- Mock bars/percentages imply local scaling and “powered draw/unpowered”
  subtraction. Only returned fields are values; any bar is supplemental.
- Retracted mode must omit package deployed-only headroom, utilisation and
  within-budget fields instead of adapting the mock summary tiles.
- Disabled-consumer and zero-capacity states are absent from the mock and are
  explicit in the implementation.
- Ledger priority/enabled controls around lines 759–870 remain feature 002
  editing; feature 005 displays and links only.

### Distributor

- Desktop shows capacity, max recharge, pips and recharge, but mobile omits
  capacity/rated recharge. Every size presents all fields.
- Pip blocks are visual-only and whole-pip. Feature 003's accessible half-pip
  draft/Apply control is reused.
- The mobile filled blocks and its “3 · 1 · 2 PIPS” footer are internally
  inconsistent. Neither is acceptance data.
- Package null and genuine zero receive distinct states missing from the mock.

### Heat

- Desktop uses six non-contract scenarios; mobile uses four. Replace them with
  exactly `idle`, `thrusters`, `fsdCharging`, `firingSustained` and
  `firingDrained`.
- Every scenario must show thermal load, heat level, gauge, overheat and time
  to overheat. The mock omits most of those fields.
- Plant efficiency, hull heat capacity and unavailable/non-finite states are
  added.
- Cruise, weapons alpha, shield-cell bank, heat-sink count, resting/peak heat,
  WEP net and “100% module damage” are not inferred by feature 005.

### Interaction and implementation

- Clickable `div` tabs/state choices, title-only meaning and tiny targets
  become shared semantic controls with visible matching names/states.
- Color, fill, pattern, position and hover never carry a state without text.
- Fixed widths, ellipsis, tiny type, hard-coded English, number formatting,
  Google Fonts and remote asset references are not copied.
- Feature 011 tokens, bundled messages/formatters, same-origin assets and shared
  target sizes govern implementation.

## Missing reference states

The reference has no authoritative tablet, landscape, 200%-text, 400%-zoom,
expanded-language, RTL, reduced-motion, no-build, pending, error, group-5,
unavailable-distributor/heat or semantic infinity state. The screen and preview definitions supply them; no design
omission reduces the accepted requirements.

## Source-of-truth conclusion

Adopt the Power and Thermals hierarchy and dark dashboard density. Reject every
sample calculation, abbreviation and unsupported scenario. The repository's
feature 011 tokens/components are the visual source of truth, while the installed
Almanac package is the sole game-result source.

---

## Ruled divergences (wave 12)

Feature 003 was rewritten in its own wave 11, and three of its rulings land directly on this
feature. They are binding here; do not re-litigate them.

| Ruling                                                                                                | Consequence for feature 005                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **B** — canvas 1c draws five capability tabs and no Status mode; there is no wide capability selector | There is no `powerAndHeat` detail target, no `WorkspaceTarget` and no capability registration. This capability is the `POWER` segment of the anatomy mode strip canvas 1c already draws.                   |
| **C** — the hardpoint and pip conditions are drawn inside the Power capability                        | Feature 005 owns them. There is no feature 003 `ViewingConditions`, `ViewingConditionsStore`, draft/Apply/Reset, half-pip domain or condition revision to reuse, and none is recreated under another name. |
| **A** — nothing in the status rail is interactive, and the rail carries no counts                     | Feature 005's rail contributions are read-only text. No count, no action, no disclosure.                                                                                                                   |

### Where this capability actually is

| Canvas | Address                                                                         | What it draws                                                                                                  |
| ------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1c     | `.anat-tab[data-mode="power"]`, retitling the region `POWER & THERMALS`         | `data-anat-layer="power"` over both plates, and `data-anat-detail="power"` — a two-column dashboard under them |
| 1c     | the 306 px status rail, between the validation issues and the six metric cells  | tier 1's power sentence, tier 2's heat sentence, and the `POWER` headline                                      |
| 1d     | `data-m-mode="power"`, heading `POWER & THERMALS` / `DRAW AGAINST PLANT OUTPUT` | the same dashboard, stacked                                                                                    |
| 1d     | `data-m-mode="status"`                                                          | the same three rail contributions                                                                              |

Canvas 1c's own switching script hides the plates in every mode but `MOUNTS`, which contradicts the
five `data-anat-layer` overlays the same artboard authors — there is no reason to draw a per-mount
`P1`/`OFF` layer for a mode that never shows the plate. Feature 010's accepted design settled it
already: the four other segments are “the same plates read by features 005 to 008”
(`specs/010-hull-anatomy/design/hull-anatomy.md`). The plates stay, the power layer is drawn over
them, and the dashboard sits underneath.

### The conditions, as this artboard draws them

- **Hardpoints**: the two-segment `DEPLOYED` / `RETRACTED` toggle above `PRIORITY GROUPS`. Deployed
  is the selected default.
- **Pips**: four whole steps per bank in the `PIPS` column of `POWER DISTRIBUTOR & PIPS` (renamed
  from `POWER DISTRIBUTOR & PIP ALLOCATION` on 2026-08-25), and — since the same revision — four
  more in the status rail, which is the same control in a second place.
  Four steps, three banks, and nothing else: **no half-pips, no running total, no Apply, no Reset
  and no error text**, because the artboard draws none of them. A pip is set and the result follows.
- **Load**: no control on either artboard, and none is built.

### The three rail contributions

Feature 003's review assigns tiers 1 and 2 of canvas 1d's warning stack to this feature by name.
Both are sentences this application authors over package fields, and each names only fields
`powerBudget()` and `heatMetrics()` return:

| Tier | Condition                                     | Fields it names                                   |
| ---- | --------------------------------------------- | ------------------------------------------------- |
| 1    | a priority band with `poweredDeployed: false` | the band's `priority` and its own `deployed` draw |
| 2    | `heatMetrics().firingSustained.overheats`     | that scenario's `gauge`                           |

The `POWER` headline keeps the canvas's shape and takes package figures: `deployed / available` in
megawatts. The canvas's `· 7.80 OFF` suffix is dropped — powered draw and unpowered draw are
subtractions the package does not return, and tier 1 already names the band and the figure.

> **Overturned in wave 13.** The suffix is drawn, and the first figure is the lit draw rather than
> the whole demand. Tier 2 is withdrawn entirely.

### Bars, and why there are none

> **Overturned in wave 13.** This ruling was wrong on its own facts and was the single largest
> reason the wave 12 build was rejected. Every bar named below is drawn. See "Wave 13" at the foot
> of this document.

Feature 003 rejected the rail's power bar outright: “a reverse-engineered threshold, and the package
publishes no such ratio”. The same argument retires every bar this artboard draws — the priority
band bars with their plant marker, the module draw bars, and the heat scenario bars with their
`WITHIN LIMIT` / `OVER THRESHOLD` hatching. Each is a length divided out of two package figures, and
each sits beside the complete text that says the same thing. The text stays; the bar does not.

`WITHIN LIMIT` and `OVER THRESHOLD` survive as words, because `HeatState.overheats` is a package
field and each scenario states its own verdict in its own row.

### Withdrawn from this feature's own plan

Not built, and not to be reintroduced without a new ruling:

- `PowerStatusProjection`, `PowerStatusProvider` and `PowerStatusAdapter`. They implemented feature
  003's withdrawn `StatusProvider<T, I>` envelope; the rail block reads one pure projection directly,
  exactly as feature 009's does.
- `WorkspaceTarget`, the `powerAndHeat` detail target and the capability selector registration
  (ruling B).
- `ViewingConditions` as feature 003 property, the half-pip domain, the draft/Apply/Reset
  transaction, the condition revision and the pip validation error states (ruling C).
- The `PowerHeatStore` revision-pair memoisation, the `projectionFailed` lifecycle and the
  `PowerHeatAnnouncementCoordinator`. One active build, one pure synchronous projection and the
  signal graph's own memoisation — the shape feature 009 already ships and feature 003's ruling
  named for 005–008.
- Preview declarations. Every component this feature adds is a feature block under
  `src/app/features/`, not a shared primitive under `src/app/ui/`, and the preview manifest covers
  the latter.

## Wave 13 — the review of the wave 12 build

The wave 12 build was shipped and rejected. The finding was one thing said several ways: it had
drawn its own reading of the artboard instead of the artboard. What follows is what was overturned,
and it is binding over every ruling above it.

### The bars are drawn

Wave 12 retired every bar in this artboard as "a length divided out of two package figures". That
reasoning proves too much — a percentage printed as text is the same division — and it is wrong
about the rail bar specifically. The artboard's `79%`, `21%` and `83.3%` are `29.64`, `7.80` and
`31.20` over the whole demand of `37.44`: its own figures, exactly. Nothing was reverse-engineered.

Every bar is now drawn: the priority band bars, the module draw bars, the heat scenario bars with
their hatch beyond the threshold, the pip blocks, and the rail bar. Each is decoration on top of a
figure printed beside it, so a reader who cannot see a fill loses nothing.

The division is done in `src/app/domain/power-heat` and nowhere else, which the ownership policy
enforces.

### The plates leave the region

The artboard's switching script hides `[data-anat-plates]` outside `mounts`. POWER takes the region
over rather than annotating what is already there, and the authored-but-unreachable power overlay
stays unbuilt.

### Withdrawn from the wave 12 surface

None of these is in the artboard, and none is to return without a new ruling:

- `Verdict`, `Headroom` and `Utilisation` anywhere on the surface;
- the rail's heat sentence, and the `Danger` / `Caution` severities on either sentence;
- the region subtitle, the `31.20 MW PLANT` marker line, the hardpoint condition under the summary
  tiles, and the distributor table's caption;
- a priority group this build puts nothing in;
- table presentations of the group, module and heat readings.

### Added to it

- The six-pip rule: six between the three banks, four at most in one, and setting one bank takes the
  pips out of the other two. **Wave 14 corrected how**, below.
- The `· 7.80 OFF` suffix on the rail's `POWER` line, over the lit draw rather than the demand.
- Each module line reading what it draws in the state being read — `0.00 MW` for a stowed hardpoint
  and for a module switched off, the latter marked `· Off`.
- All four panel blocks as the artboard's bounded plate.

## Wave 14 — the 2026-08-25 canvas revision, built

The revision's nine unbuilt rows (`design/power-and-heat-detail.md`, "Canvas revision, 2026-08-25")
are built: the condition's visible caption, the module list's column heads and its `TOTAL DRAW`
row in place of the header note, the heat key above the tiles, a drawn description under every
scenario name, the shortened distributor heading with the fitted module's identity withdrawn, and
the rail's pip control.

### The pip rule, ruled

Wave 13 recorded "half a pip at a time", `spec.md` FR-007 and wave 12's ruling C said whole pips, and
the store implemented neither: it redistributed the _remainder_ evenly between the other two, which
throws away where those two were standing — from `4 · 1 · 1`, two in engines gave `2 · 2 · 2` rather
than charging each of the other two half a pip.

The owner ruled on 2026-08-25, and the ruling is now FR-007's own block: **a Commander assigns a
whole pip, and the other two banks pay half a pip each.** Where only one of the two has pips left to
give, that one pays the whole of it; taking pips back out of a bank runs the same rule backwards,
all of it going to one bank where the other is already at four. Where the split will not divide on
the half step — the bank being set was standing on a half — the odd half falls on whichever of the
two can better afford it.

It follows that the bank being set always stands on a whole pip while the two paying for it stand on
the half step, which is exactly what four blocks filled from the leading edge draw. No control offers
a half pip directly, in either place one can be set.

### The caption is a word, not the abbreviation

The canvas draws `H‑PTS`. This draws the whole word and lets the design system set it in capitals,
which is what the application already does wherever the canvas abbreviates a label it owns — `GRP 1`
comes from `Group {{group}}`. The caption is the segment pair's accessible name now rather than a
hidden string beside it, so the abbreviation would have been the announced name too. `SYS`, `ENG`
and `WEP` stay abbreviated: those are the game's own marks on the pip display.

### The pip control in two places

The rail's control and the distributor cell are one control drawn twice. Both call the same store
action, so neither can hold a reading the other does not have, and there is no second allocation, no
draft and no running total. The rail's blocks are drawn from the standing allocation rather than
from a `distributorMetrics()` result, because the rail is on screen for a build with no distributor
fitted: the pips are a question being asked about the ship, and what an allocation does to a recharge
is the distributor table's reading — which is where a `null` result is stated.

### Withdrawn in this wave

- `DistributorView.identity`, the `DistributorIdentity` type and the projection helper behind them,
  on T037's precedent: the canvas stopped drawing the fitted distributor beside the heading, and
  nothing read them afterwards.
- `power.modules.total`, `power.distributor.module` and `power.distributor.module.separator`, from
  both catalogues and from the translation-review ledger.

## Wave 15 — three readings the Commander sent back

Three notes on the wave 14 build, and what the reference says about each. Every one is a
re-reading of `.design/Ship Builder.dc.html` rather than a new decision.

### The priority-group bars are additive, and the canvas draws that

The column beside them says `CUMULATIVE DRAW`, and the percentages climb — `60%`, `75%`, `95%` — so
each row states its own draw and the running total both. The build drew one solid length to the
running total, which said the total twice and never said what the row added.

The reference draws each row as **two lengths on one track**: a wash to where the groups above this
one end, then this group's own draw solid on the end of it. `GRP 2` is `left: 50%; width: 12.5%` —
`4.68 / 37.44` starting where `GRP 1`'s `18.72 / 37.44` stopped. Both are shares of the whole
demand rather than of plant output, which is why the bar and the percentage beside it disagree:
`GRP 1` is sixty per cent of the plant and half of the track.

A one-pixel mark stands on every row at `83.33%` — `31.20 / 37.44`, where the plant runs out. It is
the same track and the same figure the rail's own bar marks, so the projection measures both on one
scale and the group whose length crosses the mark is the group the plant ran out on. Unlabelled: the
words `31.20 MW PLANT` remain out of the canvas.

### The pip blocks are chips, not buttons

The reference draws a pip block at 14 CSS pixels square in the rail and 16 in the distributor: a chip
in a row of four. The build held every one to the project's 44-pixel design baseline, which put four
of them across a strip wider than the rest of the distributor's figures put together and left three
rail groups of four unable to share a 306-pixel column at all — the row scrolled sideways inside
itself to hold them.

Held to WCAG 2.2 SC 2.5.8's 24-pixel floor instead, recorded on `DENSE_TARGETS` beside the ledger's
power chip and the segmented strip. That is the floor and not a waiver, and the reference's own 14
pixels stay unbuilt. The rail keeps the reference's own arrangement — three groups side by side,
the name over the blocks — and wraps them when they do not fit, which is what it has always done
with them; at the floor a group is 108 pixels rather than 188.

### The panel is two rows of two

`canvas-contract.md` read the panel as a two-column row over two full-width blocks, and the build
drew that. The reference has **two sibling two-column grids** — the priority groups beside the module
list (@416700), the heat profile beside the distributor (@465531) — and the `margin-top: 12px` the
contract quoted for a full-width block belongs to the second grid.

Built as read, the distributor stood a whole panel below the fold of a region that is bounded by the
column it sits in: a Commander opening `POWER` found the module list and nothing under it, and
reported the block as missing. Laid out as the reference draws it, the dashboard is a third shorter
and the distributor sits beside the heat profile on the second row.

The pairing opens at the wide step rather than the medium one. A pair is only a pair while both
halves can hold what is in them, and at the tablet column's 442 pixels each block came out at 209 —
narrower than the minimum a single block is held to, with the distributor's five columns and the
heat scenarios' names both wrapping a word at a time. Below that step all four stack, which is
canvas 1d.

The heat block now measures itself rather than the panel around it, because half of a wide panel is
not a wide block: whether its bars and its tiles stand side by side is a question about that box.

### Still standing after this wave

The region is bounded by the column and scrolls what will not fit, which is what wave 14 settled and
what keeps the distributor's own controls reachable. Two rows of two shortens the dashboard; it does
not make it fit. At 1440×900 the panel is about 800 CSS pixels in a slot of about 325, so the second
row is still reached by scrolling the region — the bench's own 26rem minimum is what bounds the slot,
and that belongs to feature 002.
