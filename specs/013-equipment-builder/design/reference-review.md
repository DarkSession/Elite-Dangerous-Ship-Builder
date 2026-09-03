# Reference Review: Equipment Builder

What is taken from `.design/Equipment Builder.dc.html`, what is withdrawn, and why. The canvas is
the record: what it draws ships, and what it does not draw does not.

The canvas has two turns. Turn 1 is artboards `1a` (1640px) and `1b` (390px): a bench with a suit
already on it. Turn 2 is `2a` and `2b`, added on 2026-09-03: the same bench before a suit is chosen.

## Retained as drawn

- Three regions wide — ledger, item view, stats — with materials under the stats column, and three
  tabs compact with the item view as a drill-in.
- The ledger's shape: the suit first, then one row per mount, each row naming the item and its
  modification count as `n / 4`.
- The grade ladder as a row of grades on the item view, not a stepper.
- Modification slots drawn as slots, locked ones present and marked.
- Resistances as signed percentage bars in two groups, armour and shields.
- Firepower as one row per fitted weapon rather than a single total. The canvas computes a total
  and does not draw it.
- Materials as a list with a `n TYPES · n UNITS` summary.
- The export dialog's three formats: loadout JSON, share link, plain text.
- The save dialog's name and note.
- Undo and redo on the compact bar.

## Withdrawn, with the reason

| Drawn on `1a`                       | Withdrawn because                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Its own topbar with mark and `BETA` | `Tool Navigation.dc.html` draws one shell over both builders, and the application already draws it               |
| `SAVED LOADOUTS` dialog             | feature 001's record library is one list holding both tools' records; a second list would need a second index    |
| `HELP · ABOUT` with `APP VERSION`   | feature 012 owns one modal and one pair of versions for the deployment; two would be two answers to one question |
| Grade upgrade costs                 | the canvas's own FAQ says the material requirement covers applying modifications, not raising a grade            |
| Hover-revealed `CLEAR SLOT`         | nothing essential may depend on hover (constitution V); it becomes a control in the chooser                      |

The first three are the design collision the spec's Assumptions record. The canvas asked for a
ruling rather than making one, and this is the ruling.

## Restored on 2026-09-03, when the library caught up

Three things were withdrawn only because `@elite-dangerous-almanac/core` published nothing for
them. Almanac 0.2.9 closes all three gaps, so all three ship as the canvas draws them:

| Restored                                 | What made it possible                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUIT TOOLS` region                      | `equipment/tools` and `i18n/personal-tools` ([#25](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/25), [#29](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/29)) |
| `SUSTAINED DPS` and `HEADSHOT DPS` lines | `personalWeaponMetrics` ([#23](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/23))                                                                                              |
| The `FIREPOWER` per-second figure        | the same call                                                                                                                                                                                  |

The region ships as drawn: a dashed badge and a name per tool, dimmed and unselectable, under a
count. The canvas draws three fixed rows; which rows a suit gets follows its `suitFamilies`
membership, so the Maverick draws the canvas's three and the Artemis draws three different ones
including the Genetic Sampler the canvas never saw. The count is that number rather than a literal.

**Published and deliberately not drawn**: every tool's battery and timing stats, and the Reduced
Tool Battery Consumption recipe that moves them. Neither artboard draws a tool stat, so the region
states none. That is the same rule the rest of this review applies — the canvas is the record — and
it cuts against the library here rather than for it.

## Withdrawn because the library publishes no such figure

The canvas is the record for what a screen draws. Where it draws a figure
`@elite-dangerous-almanac/core` does not publish, constitution II and IV rule:
the figure is not computed here, and what the canvas asked for is withdrawn or
replaced by the package's own answer to the same question.

| Drawn                                   | What ships instead                                                                                                                                                                                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The `ARMOUR` resistance group           | Nothing. The library publishes one set of four resistances — `SuitGrade.kinetic/thermal/plasma/explosiveResistance` — which is the canvas's `SHIELDS` group. Its `ARMOUR` group is `0.2` when Damage Resistance is fitted and `0` otherwise, invented in the mock. |
| The suit's type word, `TACTICAL`        | The mount counts alone. `Suit` publishes `family`, `name` and `mounts` and no type, so `2 PRIMARY / 1 SECONDARY` is the whole of the code line.                                                                                                                    |
| `HEADSHOT DPS` and `MAGAZINE DAMAGE`    | `HEADSHOT DAMAGE` and `DPS`, from `personalWeaponMetrics`. The two the canvas draws are products it worked out itself; the grid keeps its eight cells and every one of them is a published figure.                                                                 |
| The item view's `DAMAGE` per projectile | `DAMAGE PER SHOT`, the same cell told honestly: `personalWeaponMetrics` counts the projectiles a round carries and the rounds a trigger pull fires, which the canvas's own figure did not.                                                                         |

## Kept against the canvas, with the reason

| The canvas draws                                    | The bench draws                                                                                                                                                                               |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A held mount as `Slot unavailable`, its weapon gone | The weapon still named, with the mount stated unavailable in the code line. An unavailable row whose content is invisible would lose the very thing FR-007 retains.                           |
| A modification chooser row as a name alone          | The name over the engineers who grant it. The canvas's own recipe list carries them per recipe and its render drops them; FR-010 keeps them, in the place every other row puts its code line. |

## Mock content that is not a requirement

The canvas's `GROUNDPOUNDER` loadout, its `5 LOADOUTS` count, its figures and its
`DOMINATOR SUIT G5` line are illustration. Every figure the bench states comes from the package for
the loadout actually open.

## Visual literals

The canvas's colours, type sizes, letter-spacing and paddings are inline styles on a mock. They are
matched through the design system's tokens, and no literal from the canvas enters a stylesheet
(constitution VII).

## The empty bench, as turn 2 draws it

Turn 1 opened on a bench with a suit already on it, and the state the application actually opens in
was answered here by the ship tool's no-build block. Turn 2 draws that state, and the canvas's
answer replaces the borrowed one: **the bench is never replaced by an empty state**. Every region
stays drawn — the suit row, all three mounts, the figures, the material block — and the detail
column holds the one live choice there is.

| Drawn on `2a` / `2b`                                     | What ships                                                                                                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The ledger with a `+` suit row and three locked mounts   | As drawn. The mounts are the catalogue's three, each named and stated `LOCKED`; the counts are `0`, `—`, `—`.                                                      |
| `NO SUIT FITTED` over the detail column                  | As drawn, with the step rule `STEP 1 · CHOOSE A SUIT` and the suits beneath it.                                                                                    |
| The four suits as two-up cards                           | The same rows the suit chooser draws, laid out two to a line. One list component serves the chooser and the gate, so a suit reads the same in both places.         |
| A dimmed grade ladder and four dashed modification slots | As drawn wide, `inert` and out of the accessibility tree: they are previews of controls, not controls. Canvas `2b` leaves both out, and so does the compact bench. |
| `COMMANDER STATS` with a dash in every figure            | As drawn. Which figures a suit answers is itself information, and an absent block states none of it.                                                               |
| `MATERIAL REQUIREMENTS · NONE` with its footnote         | As drawn.                                                                                                                                                          |

Dimming is how the canvas separates the live choice from what is drawn around it. Here that is
carried by words and by the accessibility tree — `LOCKED` on a mount, `EMPTY · REQUIRED FIRST` on
the suit row, `inert` on the previews — because nothing essential may depend on a colour value
(constitution V).

### Withdrawn from turn 2, with the reason

| Drawn on `2a` / `2b`                                            | Withdrawn because                                                                                                                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Each suit's type word — `TACTICAL`, `UTILITY`, `EXPLORATION`    | `Suit` publishes no type, as the table above already records for the ledger's code line                                                                                                          |
| Each suit's description — "Combat frame. Two primaries, …"      | The package publishes no suit description. Four sentences of prose about what a suit is for would be written here and stated as the library's (constitution II)                                  |
| `SUIT TOOLS` rows on an empty bench — Energylink, Arc Cutter, … | Carriage is a property of a suit. With none worn there is no published tool list, and the canvas's three rows are the subset its mock happened to draw. The heading and its `—` count still are. |
| `IMPORT A JOURNAL EVENT`                                        | The bench has no such capability. Nothing in the spec imports a journal event, and a link to a screen that does not exist is not an arrangement                                                  |
| The `SLOTS` caption over each card's mount line                 | The card is the chooser's row, and that row already carries the mount line as its code line. One row shape for both places is worth more than one word of caption                                |

`OPEN A SAVED BUILD` ships as drawn, pointing at feature 001's record library — the one list that
holds both tools' records, as the first table in this review rules.

## The state neither turn draws

| The state                  | What ships                                                                                                                                                                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A mount with nothing on it | The item view states the mount and offers `CHOOSE A WEAPON`, with no grade ladder and no attribute grid: an empty mount publishes no figure, and the item view is the one place the chooser that fills it is opened. The canvas's mock has every mount already filled. |

## The record library, which this tool now shares

Feature 001's library was a list of ship builds and its second column was headed `Ship`. It now
holds both tools' records, so that column carries a hull for one and a suit for the other. The
column keeps its heading — it is the ship tool's own canvas, and no canvas draws a two-tool
library — and each row names the tool that made it among its read-not-drawn facts, so a reader is
never left to infer the tool from a name they may not recognise.
