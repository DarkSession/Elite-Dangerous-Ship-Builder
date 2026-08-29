# Hull Detail Screen

**Route**: `/ships/:symbol`  
**Requirements**: FR-001, FR-003, FR-004, FR-005, FR-006, FR-007, FR-022

## Composition

- Wide: canvas 1a's inspector rail beside the manifest. Narrow: canvas 1b's full-screen detail sheet, which replaces the shipyard's command bar with one of its own (see [the sheet's own bar](#the-sheets-own-bar)). Neither carries a page heading of its own: the bar names the screen (see [screen chrome](#screen-chrome-and-the-command-bar)).
- `HullArtwork` on the hatched plate, loaded from the same-origin package asset path with reserved area and temporary-unavailable text.
- The hull's name in tracked condensed amber, over one monospace identity line reading `MANUFACTURER · <PAD> LANDING PAD`. The pad class is named as a pad class — `LARGE LANDING PAD`, not a bare `LARGE` — through `hullDetail.landing-pad`. Both facts keep their labels in the markup; only the eye sees the compressed line. At compact width the same two facts are the bar's title and the line under it instead, and the body's block is not drawn — the canvas puts them in the bar and draws them once.
- A ruled two-column `FactList` of the eight figures the reference's metric grid carries: speed, boost, shield, armour, hull mass, hardness, crew and mass lock, each with its localized unit where the reference draws one.
- The mount classes the hull carries, under a section rule, as `<count> <CLASS>` chips with the classes it has none of left out.
- The three slot groups under section rules of the same shape, in the canvas's order: `UTILITY MOUNTS` with its count and nothing else, `CORE INTERNALS` with its total and seven chips reading the package's name for each mount and its size, and `OPTIONAL INTERNALS` with its total and one chip per size run (see [what the hull carries](#what-the-hull-carries)).
- `RESTRICTED SLOTS` on its own rule, in the hot tone, where the hull has any: the count of restricted mounts on the trailing edge, and under it one entry per restriction — what those mounts take, in the package's own words, over their sizes as chips. Drawn only where the hull has one; every hull the installed package publishes has at least one.
- One `HULL PRICE` row: the ready-to-fly cost, on a rule of its own.
- Primary `ActionButton` requesting stock-build creation, below the wide composition only, present only when `getDefaultLoadout(symbol)` succeeds (see [the wide rail has no action](#the-wide-rail-has-no-action)).
- `InlineNotice`/`ErrorSummary` for default unavailability or unknown symbol.

### The inspector is the reference composition

Canvas 1a's rail and canvas 1b's detail sheet hold exactly the artwork, the identity line, the metric grid, the mount chips, the three slot groups and their restricted row, one price and — on the sheet alone — the hull action. This screen holds those and nothing else.

The earlier divergence recorded here is **closed**. The design gained hardness, crew and mass lock on 2026-08-21, and FR-004 was narrowed the same day to drop heat capacity and dissipation, reserve fuel and the rotation rates. The metric grid is the reference's eight figures, in its order:

| Reference label | Fact id         | Unit |
| --------------- | --------------- | ---- |
| `SPEED m/s`     | `maximum-speed` | m/s  |
| `BOOST m/s`     | `boost`         | m/s  |
| `SHIELD MJ`     | `base-shield`   | MJ   |
| `ARMOUR`        | `base-armour`   | —    |
| `HULL MASS t`   | `hull-mass`     | t    |
| `HARDNESS`      | `hardness`      | —    |
| `CREW`          | `crew`          | —    |
| `MASS LOCK`     | `masslock`      | —    |

Four of the eight carry no unit, because the reference draws none: hardness and mass lock are comparative numbers the game publishes bare, crew is a count, and armour is drawn as `ARMOUR`, not as "hull points". `HullFactUnit` admits `null` for exactly that, so nothing is invented to fill the column.

Every figure in the grid is whole. The reference draws `400`, not `400.0`, and hull mass was the one figure carrying a fraction digit; `HullFact.fractionDigits` is gone with it, so there is no place left to add one back by accident.

The viewing condition — "at 4 ENG pips" — is gone with the rotation rates and the zero-pip endpoints that needed it. `SPEED` is the reference's one speed figure.

### What the hull carries

Under the metric grid, both canvases state the hull's own capacity: its utility mounts, its seven
core-internal mounts and its optional-internal mounts, each group a section rule of the same shape
as `HARDPOINTS` — a tracked label, a hairline filling the width, and the group's total on the
trailing edge.

The three groups are drawn differently because they say different things:

| Group                | Total                                 | Chips                                                                                                                                                                              |
| -------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UTILITY MOUNTS`     | The count, amber, in place of a total | None. Every utility mount is the same size, so a chip per mount would be one number written eight times                                                                            |
| `CORE INTERNALS`     | Always `7`                            | Seven, in the package's own core order, each reading the mount's name and its size — the canvas abbreviates them `PWR 8`, `THR 7`, `FSD 6`, `LIFE 7`, `DIST 7`, `SENS 8`, `FUEL 5` |
| `OPTIONAL INTERNALS` | The number of unrestricted mounts     | One per run of equal sizes, largest first, a run of more than one prefixed by its multiplier — `7`, `3 × 6`, `3 × 5`, `2 × 4`, `3`, `2`, `1`                                       |

The canvas abbreviates the seven core functions to fit an 8.5px chip of tracked monospace. This
screen does not: a core mount's name is game text, and the package names it — `Power Plant`,
`Thrusters`, `Frame Shift Drive` — through `getLoadoutSlotName`. An abbreviation table here would be
a private catalogue of game nouns, which is what constitution II and FR-020 keep out of this
application, so the chips carry the package's own names and are wider than the canvas's. That is a
recorded departure from the reference, and it is the same one the ledger's mount rows already make.

`RESTRICTED SLOTS` follows. It is the same rule in the hot tone, its hairline tinted to match, and
the count of restricted mounts on its trailing edge where the other three carry their own total.
Under it, one entry per restriction the hull has: what those mounts take, in the package's own
words, over their sizes grouped the way the optional ones are.

The canvas draws that group with a single `MILITARY ONLY` note against an empty chip row, and hides
the group entirely on the hull it draws. It is a mock of one restriction on one hull, and the shape
does not survive contact with the package: `getShipSlots(...).optional[].restriction` is one of six
values, all 48 hulls carry at least one restricted mount — the planetary approach suite has its own
— and nineteen carry two or three, the Type-11 Prospector three. A single note on the rule's edge
cannot say what an Anaconda's military and planetary mounts are, so the group takes a list.

`MILITARY ONLY` is the canvas's own wording, not the package's. The package's phrase for that value
is `reinforcement packages and shield cell banks`, from `getSlotRestrictionLabel`, and it answers in
English alone — so the phrase is drawn through `edsb-game-text` and carries the untranslated
disclosure in every other locale, exactly as a module name does (011/FR-020, constitution VI).

The two optional groups **partition** the column. `OPTIONAL INTERNALS` is the mounts that take
anything of their kind that fits; `RESTRICTED SLOTS` is the mounts that take one family. A mount is
counted in one of them and never both, so the two totals add up to the hull's optional column and
neither figure is a subset of the other silently. The canvas's own `12` is the partition: the hull
it draws has fourteen optional mounts, two of them restricted, and `12` is what is left.

A hull with no restricted mount draws no rule and no empty group — a heading over nothing states an
absence the canvas does not. No hull in the installed package reaches that state; the rule stands
because a release that dropped a restriction should draw one group fewer rather than an empty one.

Everything here is `getShipSlots(symbol)`: `utility`, `core`, `optional` and the `restriction` on an
optional mount, read as the package publishes them. Nothing is counted from a build, and the
outfitting ledger — one row per mount, with what is fitted in it — stays canvas 1c's and feature
002's.

### The wide rail has no action

Canvas 1a's rail ends at `HULL PRICE`. The stock-hull action is drawn on canvas 1b's
sheet alone, so at wide width this screen offers no control at all — and it does not need one,
because the manifest beside it already builds: a rested pointer opens a hull and the press after it
flies that hull's stock build (`responsive-catalogue-view.ts`, `activate`). The rail button was the
same transaction reached a second way, one press further from the row a Commander was already on.

At compact width there is no row to press twice — the sheet is over it — so the sheet keeps the
action, and it stays the one thing on this screen that creates a build. The transaction below is the
same either way. Canvas 1b pins that action to a footer plate, beside the library button this
screen does not draw.

Between the two the action stays as well. The rail is a wide composition — below it the detail is a
panel stacked under the manifest rather than a rail beside it — and a panel under a manifest is the
nearer of the two canvases to canvas 1b's sheet. The withdrawal is therefore keyed to the width the
rail itself starts at, not to the medium step where the two-column arrangement has not begun.

The reference's second button opens the saved-build library, which the command bar already offers on
this screen. Canvas 1a's rail does not draw it; canvas 1b's sheet pins it to the footer plate beside
the stock-hull action. It is not drawn here at either width, because the bar carrying it is on
screen at both — a second control for the same destination, a centimetre below the first.

The withdrawal at wide width follows the press rather than the width. A manifest row builds only
where the device can hover — a row that both reads a hull and builds it needs a pointer that can
rest without pressing — so on a wide touch screen, which neither canvas draws, the rail keeps the
action rather than leaving that device with no way to build at all.

### The sheet's own bar

Canvas 1b draws no back arrow inside the sheet. It replaces the whole bar: a bare `←` on the leading
edge, the hull's name where the screen's name goes on every other screen, and `MANUFACTURER · <PAD>
LANDING PAD` under it — and no insignia, no release mark, no count. The sheet is not a screen a
Commander navigated to; it is one they opened over the shipyard, and its bar says what they opened
and how to close it.

The screen therefore publishes that bar rather than drawing one, the same way the workspace publishes
its build identity: the shell owns the bar, and a second one inside the page would be a second bar
(011/`ScreenReturn`, `ScreenChrome.setReturn`). Which width draws it is the shell's decision — canvas
1a's wide inspector still has the manifest beside it, keeps the shipyard's bar, and reaches the
manifest by looking at it, so there is no back arrow at that width and never was.

Two consequences follow, both recorded rather than assumed:

- **The name is drawn once.** At compact width the body's identity block is not drawn, because the
  bar is already carrying it. The labelled `dt`/`dd` pair survives at wide width, where the block is;
  at compact the same two facts are stated in the bar's own line, unlabelled, exactly as the canvas
  draws them. The text is there either way, which is what FR-010 of feature 011 asks for.
- **A hull the package cannot name keeps its body block.** `ScreenReturn.title` admits `null`; the
  bar then carries the way back alone and the body's block — which says what it could not name and
  why — is what a Commander reads. A bar with an empty title and a body with nothing in it would be
  a screen that says nothing about the hull it is showing.

### The action is one word, 2026-08-28 (Commander request)

Canvas 1b writes `BUILD STOCK HULL` on the sheet's own action, and this is a **live divergence** from
it. The action stands at the foot of a hull's own sheet, under that hull's figures and its price, so
the noun in it names what a Commander is already looking at and the adjective describes what
everything they build starts as. `Build` is the whole of what the press does; the sheet around it
says what is being built. Nothing about the transaction below changes, and the action stays the one
thing on this screen that creates a build.

## States

| State                            | Required presentation and behavior                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Populated                        | Every figure the reference inspector carries is shown with its unit, and every slot group with its total; no build is created by entry.                                                                                                                                                                                                                                                                                                 |
| No restricted mount              | The restricted rule and its entries are not drawn. Nothing states that the hull has none: the other three groups are complete without it, and a heading over an empty group would read as a fact about the hull rather than as the absence of one. No hull the installed package publishes reaches this state — all 48 carry a planetary-approach mount — so it is a guard against a future layout rather than a state on screen today. |
| Artwork loading                  | Facts remain usable, and the stock action with them wherever it is drawn; the loading mark is drawn inside the artwork plate so nothing below it moves when the illustration arrives, and the plate carries the mark alone — a hull that is no longer the hull being asked for is hidden rather than held up until the new one decodes. The load state stays textually available beside the mark.                                       |
| Artwork missing/offline uncached | Temporary same-origin asset absence is explained; the artwork coordinator retries when connectivity returns without a page reload; action remains usable.                                                                                                                                                                                                                                                                               |
| Unknown symbol                   | Named error, catalogue-return action, no facts guessed, no build mutation/action.                                                                                                                                                                                                                                                                                                                                                       |
| Package factory failure          | Blocking error is announced once; current build and route state remain.                                                                                                                                                                                                                                                                                                                                                                 |

## Creation transaction

1. Confirm the route symbol resolves and a package default record exists.
2. Construct `ShipLoadout.default(symbol)` as a detached candidate.
3. Confirm every fixed mount is package-populated and read package validation.
4. Commit to `ActiveBuildStore`, mint an unnamed record for the new build and autosave it there,
   publish the fragment if representable and navigate to `/build`.

No image state participates in these steps, and no step asks a question. The replacement
confirmation this screen used to raise at step 4 is withdrawn (screen inventory, "Cross-screen
ingress rule"; Commander request 2026-08-25): the build a Commander leaves behind here is recoverable
from a record `/builds` lists, so creating a stock hull takes nothing from them.

## Responsive and accessibility notes

- The exact same `/ships/:symbol` state appears as a wide inspector or narrow full-screen layer; browser history and symbol identity do not depend on the breakpoint.
- Facts reflow from inspector groups to one narrow column without changing heading or definition order.
- Hardness, crew, mass lock and armour are drawn bare, as the reference draws them, rather than being given an invented unit; every figure that has a unit names it.
- Canonical package text is marked untranslated when appropriate.
- The canvas's hard-coded mock values are visual references only; every displayed value is read from the active package record. Runtime art is the package `illustration.svg` rasterised to PNG by `scripts/convert-ship-artwork.mjs` and served from this application's origin, matching the reference's own `assets/ships/*.png`.
- Component previews cover populated, missing-fact, artwork-loading/error and unknown-symbol states.

## Reference composition

Measured from canvas 1a's inspector rail and canvas 1b's `sd-screen`.

| Part           | Canvas                                                                                                                                                                                                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Artwork        | A fixed-height hatched plate inside an amber hairline; the illustration is contained, not cropped, and pushed into amber by a filter rather than by shipping a tinted copy                                                                                                                                |
| Missing art    | The same plate, with the reason centred in Barlow 300 inside it                                                                                                                                                                                                                                           |
| Identity       | Hull name in condensed 700 tracked 0.08em at the display step, over a monospace line reading `MANUFACTURER · LANDING PAD`                                                                                                                                                                                 |
| Facts          | A two-column grid whose one-pixel gaps expose an amber ground as rules; each cell is a tracked monospace label over a larger monospace value; a final cell spans both columns                                                                                                                             |
| Hardpoints     | A section rule — tracked label, a hairline filling the width, the total on the trailing edge — over count-and-size pills                                                                                                                                                                                  |
| Slot groups    | The same rule three times over — `UTILITY MOUNTS` carrying its count in amber where a total goes and no chips, `CORE INTERNALS` and `OPTIONAL INTERNALS` carrying a quiet total over chips on the inset ground inside an amber hairline, each chip a tracked monospace label beside a larger amber figure |
| Restricted     | The same rule in the hot tone with a hot-tinted hairline, the count of restricted mounts where a total goes, over one entry per restriction — the package's phrase for what those mounts take, over chips of the same shape. Absent where the hull has none                                               |
| Price          | Its own rule, the label on the leading edge and the value in large monospace amber with a quiet `cr` suffix                                                                                                                                                                                               |
| Actions        | None on canvas 1a's rail, which ends at the price. Canvas 1b's sheet draws two on its footer plate — the stock-hull action filled amber, condensed 700 tracked 0.22em, full width, and the saved-build button beside it, which this screen does not draw because the command bar already carries it       |
| Panel          | The rail takes its content's height rather than the row's, and closes with the same amber hairline that runs down its leading edge                                                                                                                                                                        |
| Compact layout | The same stack as a full-screen layer whose command bar is the sheet's own — `←`, the hull's name, its manufacturer line — with the stock-hull action pinned to a footer plate                                                                                                                            |
