# Design Reference Review: Ship Statistics and Status

The design source is `.design/Ship Builder.dc.html`.

- Canvas **1c** is the 1560 px wide outfitting composition: a 392 px slot ledger, a fluid central
  anatomy/fitting area behind five capability tabs, and a 306 px status rail.
- Canvas **1d** is the 390 px mobile composition, whose six capability tabs include one Status mode.
- No tablet, intermediate-width, landscape or zoom composition is designed. Those are plan-owned and
  are decided from content rather than copied measurements.

The HTML is the record of what this capability presents. It is not a source of game values, component
code, breakpoints or assets.

## What the canvas draws

### 1c — the wide status rail

Read at byte offset 761513 and following:

```text
BUILD STATUS                          mono 600 10px, amber-2, .2em   padding 14/16/12
  ▌Priority group 4 is unpowered …    Barlow 500 11px/1.4, hot-2
                                      bg rgba(255,107,61,.1), border-left 3px var(--hot)
────────────────────────────────────  border-bottom 1px amber-a16
POWER            29.64 / 31.20 MW · 7.80 OFF   label mono 8.5px ink-48; value mono 11px hot
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░│               8px bar: 79% amber, 21% hatched hot, 2px ink marker
  ┌──────────┬──────────┐            grid 1fr 1fr, gap 1px over amber-a12
  │ SHIELD   │ ARMOUR   │            cells panel-2, padding 10/11
  │ 1,842 MJ │ 3,914    │            label mono 8px ink-45 .14em; value mono 16px ink; unit 9px ink-45
  │ DPS      │ JUMP     │
  │ 248.6    │ 21.4 ly  │
  │ SPEED    │ MASS     │
  │ 200 m/s  │ 1,142 t  │
  └──────────┴──────────┘
────────────────────────────────────  border-bottom 1px amber-a16
COST / MATERIALS                      feature 009, built
```

### 1d — the compact Status mode

Read at byte offset 1064071 and following. The same blocks, one step down the ramp, with a three-column
metric grid — and **four** status blocks rather than one, each in its own tone. Canvas 1c draws the
same four:

| Block   | Treatment                                                                  | Canvas text                                                       |
| ------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| hot     | `border-left 3px var(--hot)`, `rgba(255,107,61,.1)`, `hot-2`               | `Priority group 4 is unpowered — 7.80 MW … above plant output.`   |
| amber   | `border-left 3px rgba(255,140,26,.55)`, `rgba(255,140,26,.08)`, `ink-8`    | `Sustained fire peaks at 131% heat — module damage above 100%.`   |
| green   | `border-left 3px var(--good-2)`, `rgba(143,217,74,.08)`, `good-2`          | `Jump range and mass lock clear the requirements for this build.` |
| neutral | `border-left 3px rgba(232,222,209,.28)`, `rgba(232,222,209,.04)`, `ink-66` | `2 hardpoints and 3 optional slots are empty.`                    |

Only the neutral one is a structural fact the package reports. The hot and amber blocks are authored
power and heat sentences belonging to feature 005, and the green one is an authored mobility
sentence belonging to feature 008; none of the three is a `LoadoutValidation` issue and none is
built here. The green block is why this rail's own all-clear line has a shape to take, and it is not
why the line exists — see [status-rail](./status-rail.md#the-issue-block).

### The capability selectors

| Canvas | Selector                                                                                     | Status present? |
| ------ | -------------------------------------------------------------------------------------------- | --------------- |
| 1c     | `.anat-tab` at 349767: `MOUNTS` `POWER` `DRIVES` `DEFENCE` `OFFENCE`                         | **No.**         |
| 1d     | six `.m-tab`s at 1223742, the last `status: ['BUILD STATUS', 'WARNINGS · COST · MATERIALS']` | Yes.            |

At wide width Status is the rail and nothing else. There is no wide Status mode and no control that
opens one.

### Where the viewing conditions actually are

Every condition the specification wanted inside Status is drawn inside the **Power** capability:

| Condition  | Canvas                                                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hardpoints | `DEPLOYED` / `RETRACTED`, a two-segment toggle at 418873, above `PRIORITY GROUPS · CUMULATIVE DRAW` in the wide Power tab                             |
| Pips       | `POWER DISTRIBUTOR & PIP ALLOCATION` at 493763 (wide) and `PIP ALLOCATION` at 986740 (compact): SYS/ENG/WEP rows of four whole bars                   |
| Load       | _no control anywhere._ `JUMP LADEN` (532152) and `JUMP UNLADEN` (533587) are drawn as two separate readouts; the thruster block reads `1,142 t LADEN` |

The pip rows draw four whole steps per bank. There are no half-pips, no running total, no Apply, no
Reset and no error text on either canvas.

Nothing in the rail or in Status mode is interactive. There is no control, no link, no disclosure and
no slot action in either block.

## Adopt

- The `BUILD STATUS` heading opening the rail and the Status mode.
- Validation issues as the canvas's bordered blocks, in package order, directly under that heading.
- The severity treatment: tier 1 for a package `error`, tier 2 for a package `warning`, tier 3 for a
  package `incomplete`, and no severity word on the screen, because neither canvas draws one.
- The rail as the wide home for build status, and the stacked Status mode as the compact one.
- Warnings → power → the metric cells → cost → materials, at both widths.

## Added beyond the canvas

**`CARGO` and `PASSENGERS`. Ruled 2026-08-31 (Commander request; FR-023).** The standing rule is
that a reading neither canvas draws is not restored, whatever the specification says. This is the
one exception, and it is a Commander's own ask rather than a reading of the artboards: a rail that
says what a build is worth, how far it jumps and how hard it hits, and not what it can carry, leaves
out the question a trader and a passenger runner open the screen with. The two cells take the last
row of the rail's own cell band, in the band's own treatment, so the addition is two more cells and
not a block of its own. Feature 008's `DRIVES` card is untouched: it draws no cargo capacity, and
its own ruling against one stands.

## Ruled divergences (wave 11, 2026-08-22)

Three collisions between the accepted specification and the canvas were surfaced to the user before
implementation. **The design won all three.** These rulings are binding; do not re-litigate them.

| #   | Canvas draws                                                               | Specification wanted                                                                                                           | Ruling                                                                                                                                                                     |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Validation issues **in the rail**, under `BUILD STATUS`                    | The rail carrying counts only, with every issue record moved into a separate complete Status capability (former FR-004/FR-020) | **Design.** The issues are drawn where the canvas draws them. There are no counts, because the canvas draws none.                                                          |
| B   | Five wide capability tabs, **no Status**; Status is the rail at wide width | Status added as a sixth peer desktop capability, reached by a labelled action in the rail (plan §Desktop)                      | **Design.** No wide Status mode and no opening action are built. The rail is the wide surface. The compact Status tab is 1d's own and arrives with the tabs it belongs to. |
| C   | Load, pip and hardpoint conditions **inside the Power capability**         | A `ViewingConditionsControl` inside Status, with half-pips, a running total and Apply/Reset (former FR-016–FR-019, Story 3)    | **Design.** Feature 003 builds no condition control and owns no condition state. The surface belongs to feature 005, which draws what its own artboard draws.              |

### What these rulings withdraw

Not built, and not to be reintroduced without a new ruling:

- `StatusCapability` as a wide-width mode, its central-selector registration and the rail's
  open-Status action (ruling B).
- `StructuralFacts` as a definition list of `valid` and `complete`. A build the package calls valid
  draws one line saying so and nothing else — not a definition list, not a readiness claim, not a
  qualification (ruling A, and FR-015 as it now stands). Since Almanac 0.2.1 that line can stand
  above an issue block, because a `warning` leaves a build valid.
- The issue and qualification **counts**, the qualification summary section and both none-reported
  statements (ruling A).
- `StatusCountAnnouncer` and `StatusAnnouncementCoordinator`. They announced count changes, and there
  are no counts (ruling A).
- Per-issue exact-slot actions and per-result detail actions. Nothing in either block is interactive
  on either canvas, and at both widths the slot ledger the action would reach is already on screen
  (rulings A and B, former FR-012).
- `ViewingConditions`, `ViewingConditionsDraft`, `ViewingConditionsStore`, the half-pip domain and
  the serialization-exclusion suite that existed to prove they were never persisted (ruling C).
- The visible `LoadoutIssueCode`. The canvas draws a sentence, not a code (ruling A). The severity
  survives, because the design system's block already names its own tone in words.

Ruling A also made the rail silent for a build the package reported nothing about, on the reading
that silence claims less than an all-clear statement would. **That half of it is withdrawn
(2026-08-27.)** A Commander read the silence as a block that had failed to load, and asked for the
confirmation: the block now draws `Build is valid`, which is the package's own verdict and not a
readiness claim built on top of it. Nothing is drawn where there is no build to have a verdict about.
The rest of ruling A stands.

A consequence accepted with ruling C: feature 003 passes no conditions to anything. The seven
headline results are each their owning capability's, computed under whatever conditions that
capability's own surface offers.

## Rejected mock content

- The authored power and heat warnings (tiers 1 and 2 of 1d's three). They are feature 005 sentences,
  not `LoadoutValidation` issues, and this application authors no diagnosis of its own. The tiers
  they were drawn in carry package severities instead.
- The segmented power bar with its 79%/21% split, hatched overflow band and marker. It is a
  reverse-engineered threshold, and the package publishes no such ratio.
- Cross-origin `edassets.org` imagery and Google Fonts runtime requests.
- Raw colour literals, and any status meaning carried by colour or ornament alone.

## Departures that remain, on constitutional grounds

| Canvas                              | Built instead                                         | Reason                                                                                                                                                                                                           |
| ----------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Warning blocks as unsemantic `div`s | A list, each item naming its severity in hidden words | Meaning may not be carried by a coloured border alone. The word is not drawn — the design draws none — and it is what carries the severity, because the canvas's four blocks differ from each other in hue alone |
| Package sentences set as plain text | The shared `edsb-game-text` primitive                 | A locale miss must disclose that the words are the package's own                                                                                                                                                 |
| Inline colours and sizes            | Design tokens                                         | One design system                                                                                                                                                                                                |

`edsb-game-text` is the design system's existing behaviour for every package string in the
application, not a feature-003 addition — the same argument feature 009 settled under its ruling F.

## Responsive consequence

Wide 1c proximity and compact 1d stacking are the compositional intent. DOM and read order stay
`BUILD STATUS` → issues → (feature 004's completion notice) → (feature 005's power) →
(the metric cells) → `COST` → `MATERIALS` at every width.

**The completion notice joined the first block 2026-08-26 (Commander request).** What the Almanac
completed while a build was read in used to stand over the whole workspace as a banner, which said
"here is why you cannot have this" every time an import succeeded. It is the package's reading of the
build now open, exactly like the issues beside it, so it belongs under the same heading — owned by
[004](../../004-slef/spec.md), drawn in this rail, and the rail's own order is what places it. Nothing depends on hover, and the document never scrolls horizontally.
