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

- The six-pip rule: six between the three banks, four at most in one, half a pip at a time, and
  setting one bank takes the pips out of the other two evenly.
- The `· 7.80 OFF` suffix on the rail's `POWER` line, over the lit draw rather than the demand.
- Each module line reading what it draws in the state being read — `0.00 MW` for a stowed hardpoint
  and for a module switched off, the latter marked `· Off`.
- All four panel blocks as the artboard's bounded plate.
