# Reference Review: Equipment Builder

What is taken from `.design/Equipment Builder.dc.html`, what is withdrawn, and why. The canvas is
the record: what it draws ships, and what it does not draw does not.

The canvas has two turns. Turn 1 is artboards `1a` (1640px) and `1b` (390px): a bench with a suit
already on it. Turn 2 is `2a` and `2b`, added on 2026-09-03: the same bench before a suit is chosen.
A revision on 2026-09-04 anchors every attribute bar at its midline and drops the demo suit to
grade 2, so the artboards show a ladder with room left in it.

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
| Hover-revealed `CLEAR SLOT`         | nothing essential may depend on hover (constitution V); it becomes a control in the chooser                      |

The first three are the design collision the spec's Assumptions record. The canvas asked for a
ruling rather than making one, and this is the ruling.

## The material requirement states the whole cost, against the canvas's FAQ

The canvas answers "Do material costs include upgrading?" with "No. Material requirements cover one
application of each fitted modification. Grade upgrade costs are paid separately at a settlement."
The Commander ruled otherwise on 2026-09-04, and the requirement covers both costs: one application
of each fitted modification, and the climb to each item's selected grade — the suit's and every
fitted weapon's, counted from grade 1.

Raising a suit or a weapon consumes micro-resources, and a list that leaves them out tells a
Commander to gather less than the loadout costs to reach. `equipment/upgrade-costs` publishes the
recipes, keyed by the grade being reached, and `sumPersonalEngineeringIngredients` totals them
beside the modification costs, so the arithmetic is the library's.

It stays one list and one total, which is what both artboards draw. Two things follow from counting
the climb. A graded loadout with nothing fitted on it has a list, so the empty state is the loadout
that asks for nothing at all — grade 1 throughout — and it says there is nothing to gather rather
than that no modification is fitted. And the footnote under the total states both costs. A held
mount's weapon and a locked slot's modification count for nothing (FR-007, FR-011): a weapon on a
mount the suit does not carry is not being raised either.

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

| Drawn                                                                                                      | What ships instead                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The `ARMOUR` resistance group's figures — `ar = dr ? .2 : 0`, one flat number across all four damage types | The one set the library publishes, drawn in both blocks. `SuitGrade` carries `kinetic/thermal/plasma/explosiveResistance` and nothing else, and `applyPersonalModifiers` states why: a resistance multiplies the _damage taken_, which is as true of the pool as of the shield in front of it. The canvas's armour figure is the mock's own arithmetic and is already folded into the published four (`Damage Resistance` is `×0.9` on each). So the canvas's shape ships whole — an `ARMOUR` block over `SHIELDS` in the stats rail, `ARMOUR · KINETIC` beside `SHIELD · KINETIC` in the item grid — with a sourced figure in every cell. The cost is that one fact is printed twice, chosen deliberately over inventing a second (Commander request 2026-09-04, asked and answered three times) |
| The suit's type word, `TACTICAL`                                                                           | The mount counts alone. `Suit` publishes `family`, `name` and `mounts` and no type, so `2 PRIMARY / 1 SECONDARY` is the whole of the code line.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `HEADSHOT DPS` and `MAGAZINE DAMAGE`                                                                       | `HEADSHOT DAMAGE` and `DPS`, from `personalWeaponMetrics`. The two the canvas draws are products it worked out itself; the grid keeps its eight cells and every one of them is a published figure.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| The item view's `DAMAGE` per projectile                                                                    | `DAMAGE PER SHOT`, the same cell told honestly: `personalWeaponMetrics` counts the projectiles a round carries and the rounds a trigger pull fires, which the canvas's own figure did not.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

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
answer replaces the borrowed one: **wide, the bench is never replaced by an empty state**. Every
region stays drawn — the suit row, all three mounts, the figures, the material block — and the
detail column holds the one live choice there is.

The canvas was revised on 2026-09-04 and `2b` no longer draws the ledger at all: the compact
`LOADOUT` tab opens straight onto `STEP 1 · CHOOSE A SUIT`. The rows it dropped were four fifths of
a 390px screen, every one of them saying `LOCKED` about a mount no suit has offered yet, standing
over the one control there is. Wide keeps them because `2a` has a column to keep them in. The rows
below are read against that split.

| Drawn on `2a` / `2b`                                               | What ships                                                                                                                                                           |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The ledger with a `+` suit row and three locked mounts (`2a` only) | As drawn wide. The mounts are the catalogue's three, each named and stated `LOCKED`; the counts are `0`, `—`, `—`. Compact draws no ledger, as `2b` no longer does.  |
| `NO SUIT FITTED` over the detail column                            | As drawn, with the step rule `STEP 1 · CHOOSE A SUIT` and the suits beneath it.                                                                                      |
| The four suits as two-up rows                                      | As drawn. One list component serves the chooser and the gate, so a suit reads the same in both places — which is what the 2026-09-04 canvas revision settled on too. |
| A dimmed grade ladder and four dashed modification slots           | As drawn wide, `inert` and out of the accessibility tree: they are previews of controls, not controls. Canvas `2b` leaves both out, and so does the compact bench.   |
| `COMMANDER STATS` with a dash in every figure                      | As drawn. Which figures a suit answers is itself information, and an absent block states none of it.                                                                 |
| `MATERIAL REQUIREMENTS · NONE` with its footnote                   | As drawn.                                                                                                                                                            |

Dimming is how the canvas separates the live choice from what is drawn around it. Here that is
carried by words and by the accessibility tree — `LOCKED` on a mount, `EMPTY · REQUIRED FIRST` on
the suit row, `inert` on the previews — because nothing essential may depend on a colour value
(constitution V).

### Withdrawn from turn 2, with the reason

| Drawn on `2a` / `2b`                                            | Withdrawn because                                                                                                                                                                                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Each suit's type word — `TACTICAL`, `UTILITY`, `EXPLORATION`    | `Suit` publishes no type, as the table above already records for the ledger's code line                                                                                                                                                                 |
| Each suit's description — "Combat frame. Two primaries, …"      | The package publishes no suit description. Four sentences of prose about what a suit is for would be written here and stated as the library's (constitution II)                                                                                         |
| `SUIT TOOLS` rows on an empty bench — Energylink, Arc Cutter, … | Carriage is a property of a suit. With none worn there is no published tool list, and the canvas's three rows are the subset its mock happened to draw. The heading and its `—` count are still drawn wide; compact the whole ledger is gone with them. |
| `IMPORT A JOURNAL EVENT`                                        | The bench has no such capability. Nothing in the spec imports a journal event, and a link to a screen that does not exist is not an arrangement                                                                                                         |
| The `SLOTS` caption over each row's mount line                  | The row already carries the mount line as its code line. One row shape for both places is worth more than one word of caption — and the 2026-09-04 revision deleted the caption from the canvas as well                                                 |

`OPEN A SAVED BUILD` ships as drawn, pointing at feature 001's record library — the one list that
holds both tools' records, as the first table in this review rules.

## The state neither turn draws

| The state                                      | What ships                                                                                                                                                                                                                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A suit that takes no modification at any grade | The item view says so in words under the four locked slots. The Flight Suit is the case; without the sentence, four slots nothing can ever open would say the bench was refusing an upgrade the game allows (spec Edge Cases)                                          |
| A mount with nothing on it                     | The item view states the mount and offers `CHOOSE A WEAPON`, with no grade ladder and no attribute grid: an empty mount publishes no figure, and the item view is the one place the chooser that fills it is opened. The canvas's mock has every mount already filled. |

## The record library, which this tool now shares

Feature 001's library was a list of ship builds and its second column was headed `Ship`. It now
holds both tools' records, so that column carries a hull for one and a suit for the other. The
column keeps its heading — it is the ship tool's own canvas, and no canvas draws a two-tool
library — and each row names the tool that made it among its read-not-drawn facts, so a reader is
never left to infer the tool from a name they may not recognise.

## The command bar, which the shell draws

A design-conformance pass on 2026-09-03 compared the built bench against artboards 1a, 1b, 2a and
2b and closed nineteen differences. Three are left, and all three are the shell's rather than this
tool's — the equipment canvas draws a command bar that `Tool Navigation.dc.html` also draws, and
where the two disagree the shell's is what ships (the first table's rule).

| The canvas draws                                           | What ships, and why                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `↶ UNDO REDO ↷` ahead of `OPEN BUILD IMPORT EXPORT SAVE ?` | The bench publishes its history pair as region actions, which the shell draws ahead of the screen's own — so the order within what this tool publishes is the canvas's. Where the shell's own `OPEN SAVED BUILD` and `IMPORT BUILD` fall is the shell's decision and the same on every screen                                 |
| `SAVE` as a solid amber button                             | Emphasis in the action row is the shell's, and it draws one treatment for every action on every screen. A tool that made its own save louder than the ship tool's would be two answers to one question                                                                                                                        |
| The `BETA` chip on the name's own line                     | The chip's placement beside a screen identity is the frame's, drawn the same for the ship workspace. Moving it for one tool is a shell change made from inside a feature                                                                                                                                                      |
| Canvas 1b's `TACTICAL · 2P / 1S` on the compact suit row   | The type word is withdrawn above, and the abbreviation is the only part left. The code line is one string the presenter states once for both artboards, and the long form fits the row at 390px — a second, shorter wording of the same fact, selected by composition, is a presenter that has to know how wide the screen is |

### Left as built, after the second pass

| The canvas draws                                                                             | What ships, and why                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUSTAINED DPS` in the accent, and the commander rail's `STRENGTH` beside a plain `REGEN /S` | The metric grid is the ship tool's, and it has no headline cell. Adding one to the shared model is a design decision about every metric grid in the application, and no other canvas asks for it. Both artboards mark a headline figure this way — the item's sustained DPS and the commander rail's shield strength — and both are the same component and the same refusal |
| Canvas 1b stacking the grade chip over the `n/4` count                                       | One row component draws the chip and the count for both artboards. Stacking them compact is a second row arrangement selected by width, for two marks that fit on one line at 390px                                                                                                                                                                                         |
| The gate's cards leading with the Dominator                                                  | The order is the package's own suit catalogue, which is what every other list in this tool is ordered by. The canvas's order is its mock's                                                                                                                                                                                                                                  |

### Left as built, after the fifth pass

Three more passes on 2026-09-03 compared re-captured screenshots of the built bench against the
four artboards and closed a further thirty-one differences, including one invention: the compact
swap block had been drawn as a button opening a sheet, where canvas 1b draws the alternatives
inline in the drill-in it has already opened. The sheet and the component behind it are gone.

What is left, and why:

| The canvas draws                                                                            | What ships, and why                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `opacity: 0.34` over the empty bench's locked ledger groups, and `0.28` over the gate title | Those rows are controls that say `Locked` in words and answer to a reader. At a third of their ink they measure under 2:1 on the panel ground, which is below the floor for text (SC 1.4.3). They ship at `--ednb-text-faint`, the faintest ink that still clears 4.5:1 — a real gap from the artboard, and the one constitution V does not allow closing. The two _previews_ are dimmed as the canvas dims them, because both are `inert` and out of the accessibility tree |
| The live grade ladder on `--panel-2` inside an `--amber-a14` hairline, 32px tall            | The ladder is the ship tool's `ednb-grade-selector`, and `Tool Navigation.dc.html`'s canvas 1d draws the same control 38px tall on a quiet amber wash. Where two canvases disagree about a shared control the shell's is what ships, as the command-bar table above rules. Only the preview state, which no other tool draws, follows this canvas exactly                                                                                                                    |
| `SUSTAINED DPS`, `BURST DPS` and `RESERVE AMMO` against dashes in canvas 2a's `FIREPOWER`   | The fitted bench lists one row per mount, and the empty bench draws that same block with a dash on every row: which mounts a suit will carry is what the block is about on both artboards, and one row shape serves both. Burst DPS is not a figure the package publishes, so two of the three labels could not be answered once a weapon was on the bench anyway                                                                                                            |
| Canvas 1b's compact rows rendering at 78–80px                                               | Shipped at that height, but read from the artboard's rendering rather than its literals: 1b states `min-height: 56–58px` over 11px of padding and omits the `box-sizing: border-box` its sibling artboard 2b sets on the same row, so what it states and what it draws are 22px apart. The rendering is what a Commander sees, so the rendering is what the measure matches                                                                                                  |

### Hover, and the one control this feature does not get to decide

The canvas recorded hover as `style-hover` attributes until 2026-09-04, when the author replaced
that convention with a block of real `:hover` rules and stated every interactive element outright.
Four states this feature had inferred from the idiom rather than read — a modification slot, a
grade cell, a picker row and the way back out of the drill-in — are now written down, and all four
inferences held: the slot lifts its edge, the grade cell lifts its edge and its number, the picker
row takes the quiet amber wash, and the way back answers in ink. The grade cell ships with half of
its answer, for the reason in the last row of the table below.

Two things the rules corrected. A row under a pointer takes a flat ground and a lit leading marker
rather than the selected row's amber wash, so a pointer can never make an unselected row look
chosen; and a control already carrying a state answers by brightening what it has
(`filter: brightness(1.12)`) rather than taking a second ground over it. The same revision added a
state this feature did not have — the modification slot whose picker is open, marked as a selected
row is — and that is built.

Two are left alone on purpose, both of them controls this feature shares with the ship tool.

| The canvas draws                                                                                                        | What ships, and why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `border-color: var(--amber-a7)` with no fill on an action button, and `background: var(--amber-2)` on the primary one   | `ui/components/action` answers with an `--amber-a14` fill, which is the ship canvas's own idiom for a control under a pointer (`style-hover="background:rgba(255,140,26,.1)"`, nine records) — and that canvas records 73 hovers against this one's 24, including a different border lift (`--amber-a6`, thirty-five records) for the same shape. Two canvases disagree about a shell control, so the shell's own answer stands, exactly as it does for `SAVE`'s emphasis and the `BETA` chip. Changing the hover of every button in the application from inside one feature is the change this table exists to refuse |
| `.pe-gr:hover { border-color: rgba(255,140,26,.6); color: #ffb060 }` on a grade cell — the edge and the number together | The edge only. `ui/outfitting/grade-selector` is the ship tool's ladder as well, and there the number's colour is what says a cell is past the choice: `module-engineering.spec.ts`'s "numbers every grade cell" measures one ink for the filled cells and one for the rest. Lifting the number under a pointer gives that claim two unfilled inks — it failed on all four mobile profiles, where the pointer is left resting on a cell after the sheet closes — and a cell lit in the accent reads as the chosen one. The a18-to-a60 edge carries the answer on its own                                               |
| The bench's three columns on `#0d0d0d`, `#111111` and `#0d0d0d`                                                         | All three ship on `--ednb-surface-panel` (`#101010`). The canvas lifts the working column four units above its rails; at that separation the seam between them is carried by the amber rule between the columns, which is drawn, and not by the grounds                                                                                                                                                                                                                                                                                                                                                                |

#### What the 2026-09-04 canvas revision settled

The canvas was revised twice on 2026-09-04. The second revision moved toward what was built and
away from three of the rulings below, which are struck here rather than left standing.

| Was recorded as a divergence                                                | Now                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The gate's four suits as two-up **cards**, against the rows that shipped    | The canvas draws the rows. `2a`'s suit list is now `display:flex;align-items:center;gap:11px;padding:11px 13px` over a name, a code line and one figure — the swap block's row exactly. The card arrangement is deleted from `ui/equipment/choice-list`                                                                                                                                                                  |
| A recipe another slot holds, offered and marked `FITTED` against the canvas | The canvas filters it out (`lib.filter(m => !(list.indexOf(m[0]) > -1 && …))`), which is what ships. The marker, its message and the `unavailable` state the shared list carried for it are deleted                                                                                                                                                                                                                      |
| The swap block under the modification slots                                 | The canvas moved it above the figures and renamed its rule from `SWAP PRIMARY WEAPON` to `PRIMARY WEAPON`. Both are built. The two artboards put it in two places and both are built: wide it is under the grade ladder (`#pe-alt` before `#pe-stats`), compact it opens the scrolling body above the ladder (`$('#me-dbody').innerHTML = altHtml + h`), which `item-view.scss` orders on the item's own container query |

Three further refinements landed with it and are built: the fitted item is listed among the
alternatives and marked rather than filtered out of them, the suit figure's unit reads `SHIELD`
rather than `SP`, and the `WEAPON SLOTS` cell left the attribute grid with the mount counts, which
the canvas moved onto the swap rows' code line.

That repetition is over. Almanac 0.2.10, pinned 2026-09-04, splits the two: `SuitGrade` carries
`armour*Resistance`, which a grade moves, and `Suit` carries `shield*Resistance`, which no grade
moves; the Damage Resistance modification points at the armour's four alone. Each block now reads
its own published set, which is what the canvas drew before the package could answer it — the
drawing never changed, only the source. The canvas's own `ARMOUR` figures remain its mock's
`ar = dr ? .2 : 0` and are drawn from neither.

The shared help copy is the revision's too, and not this feature's wording. All four Ship Builder
artboards rewrote `help.purpose` from "Ship Builder is an Elite Dangerous outfitting bench." to name
the application instead, and the completed-grades answer with it — one help dialog now opens over
both benches, so neither sentence can name one of them.

The export layer's `#ge-exp-meta` line is built with it. The canvas names the chosen format in the
same words its own format chips carry (`st.expFmt.toUpperCase()`, so `JSON · 4 ITEMS · 6 MODS ·
1.2 KB`); this application's chips name the three formats in full, for the reason recorded above,
so the line repeats the word a Commander just pressed rather than a fourth spelling of it. The
count, the modification count, the suit counted among the items and the kilobyte figure are the
canvas's own.

The suit's subtitle is the one place that revision leaves standing. The canvas cut it to the type
word alone (`obj.t + ' suit'`), and the type word is not published — so the mount counts stay there
rather than leave the item column with nothing under its name.

### Two the Commander overrode on 2026-09-04

| The canvas draws                                                                                                                                            | What ships, and why                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A mount the worn suit does not carry, as a dimmed `Slot unavailable` row over `MAVERICK SUIT HAS 1 PRIMARY SLOT` (canvas 5487-5492 wide, 5918-5921 compact) | No row at all, in the ledger or in `FIREPOWER`. A bench that lists mounts a Commander cannot use is listing the catalogue rather than the suit. What is on the mount is retained and returns with a suit that carries it, so FR-007 is answered by the loadout rather than by a row; the item column falls back to the suit, which is what the canvas does with the selection |
| Nothing — but the package records the engineers who grant each recipe, and the canvas's feature caption at 2420 lists "modification slots & engineers"      | No engineer is named anywhere. The caption is the only mention on any artboard; the picker row is `'<div …>' + m[0] + '</div>'` and draws no code line, and the fitted slot draws its status and nothing more. FR-010 is reversed to say so                                                                                                                                   |

The `FIREPOWER` half of the first row is the canvas's own (`st.w.map((sl, i) => { if (!enabled(i))
return ''; … })`); only the ledger half is the override.

## The picker bar, which cannot be 30px

| The canvas draws                                                                 | What ships, and why                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The inline picker's header bar at 30px (`padding: 10px 13px` around a 10px line) | 41px. The canvas's 30px assumes `CLOSE ✕` is a line of text; here it is a button, and 10px of padding either side of the 24px floor (WCAG 2.2 SC 2.5.8) is 44 at the baseline and 41 at the floor. The bar is as close to the canvas as a control a Commander has to be able to hit can be — the alternative is a target nobody using a pointing device reliably can |

### Answering the 2026-09-04 review

| The canvas draws                                                                        | What ships, and why                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A fitted modification slot as two lines, a name over `FITTED`                           | Three: the engineers who grant it below the status. FR-010 was amended on 2026-09-04 to name them wherever a modification is named, and the slot is where a Commander reads the bench to work out where to take the recipe. The cell grows from ~56px to ~74px, so a row holding one fitted slot stands taller than a row of empty ones |
| The compact materials note under an empty list (canvas 1b renders it unconditionally)   | Only where the list has something in it. A sentence explaining what a total covers, printed where there is no total, is a second line about a figure that is not there                                                                                                                                                                  |
| The action row at 32px (canvas 4c) and ~30px (canvas 1a)                                | 44px, the same WCAG 2.2 SC 2.5.8 floor the picker bar's row above records. It is the shell's own control and the same measurement governs every screen                                                                                                                                                                                  |
| `cursor: text` on the name control, beside `title="Tap to rename"` — all three canvases | As drawn. The 2026-09-04 review asked for a pointer on everything clickable and this is the one control the canvases exempt: it is an inline edit, and the text cursor is what says the name is the field. What did change is its accessible name, which said `Rename the ship` on a bench that renames a loadout                       |

### The numerals, which belong to the other canvas

| The canvas draws                                                                                                                                                                    | What ships, and why                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The engineers who grant a recipe, which the canvas's picker row now omits at both widths — the author deleted the line and re-cut the compact row from 60px to 44px to be rid of it | The line ships. FR-010 is a MUST: the engineers the library records as granting each modification have to be named, and the picker row is the only place on the bench where a recipe is named at all — nowhere else could carry it without inventing a surface no artboard draws. The price is measured and real: the picker's rows are 52px against the canvas's 33, so its 230px scroller shows four recipes where the canvas shows seven                         |
| Every figure on the bench in Barlow Condensed — the attribute grid at `600 19px`, a swap row's at `600 15px`, the shield cells at `600 21px`                                        | The mono face, through the shared `metric-value` treatment. `Ship Builder.dc.html` sets every one of its metric values in JetBrains Mono, including all of its largest numerals, and it is the canvas that governs the shared component. Two canvases disagreeing about a shared control is settled the way the command bar and the grade ladder are. It is the largest single difference between this canvas's item column and the built one, and it is deliberate |
| Canvas 1a's slot cells over one framed ground (`background: var(--amber-a12); padding: 1px`)                                                                                        | The unframed grid every metric group in the application draws. Same rule, same reason — the ship canvas draws no frame on any of its grids                                                                                                                                                                                                                                                                                                                          |
