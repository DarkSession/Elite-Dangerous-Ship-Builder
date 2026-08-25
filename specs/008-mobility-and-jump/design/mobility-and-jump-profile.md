# Drives & Mass Capability

> **Rewritten against the design.** An earlier version of this document described the capability as
> a fluid sequence of five stacked regions — a condition-context block, Jump Performance, Mobility
> Performance, Mass and Capacity, and a per-module mass table. Canvases 1c and 1d draw two cards.
> Where that document and the design disagreed the design decides, so this one describes the two
> cards. The accessibility, state and localization requirements it carried are unchanged and are
> kept below; only the arrangement they apply to has been corrected.

## Purpose and placement

Drives & Mass is the `DRIVES` mode of feature 010's hull anatomy region, beside `MOUNTS` and
`POWER`, exactly as canvas 1c draws it. Selecting the mode retitles the region and draws this
content in the space the plates leave; leaving it restores the plates unchanged. It is also the
target of feature 003's shared `mobilityAndJump` detail intent.

It owns no route, no build mutation, no viewing-condition control and no persisted view state.

## The two cards

Canvas 1c puts them side by side and canvas 1d stacks them. Both are the same DOM in the same order.

**Thruster Load**, in the canvas's order:

1. the card heading, which names the region for a reader moving by heading;
2. the fitted thruster's identity — the canvas's `7A · DIRTY DRIVES G5`, the class, rating and
   blueprint of the module every reading in the card comes from — at the far end of the heading's
   own line, and `Switched off` when the mount is off. The module's name is not repeated; see
   `design/reference-review.md`, "The identity line";
3. the headline loaded mass;
4. the hull / modules / fuel bar — one band carrying the three parts laid end to end;
5. the thruster's own optimal and maximum mass, each written under the position on that bar it
   marks — the optimal under its own tick, which is also drawn on the track, and the maximum at the
   end of the track, which is where the maximum is;
6. the canvas's three legend rows, one per part, each carrying the swatch of the segment it
   explains, its own mass, and the qualifier the canvas runs in beside the part's name rather than
   under it — the hull and its bulkhead, how many modules are fitted, and which tank the fuel figure
   is. The block is not headed; neither canvas heads it, and its name is the list's accessible name
   only;
7. the canvas's hairline between that legend and the block below it; and
8. `Speed envelope at this mass` — top speed, boost, pitch, roll and yaw — under the canvas's own
   heading and nothing more. The two mass-curve multipliers the package also returns are **not**
   drawn; neither canvas has them.

There is no fourth group between the legend and the envelope. The canvas draws no unladen mass and
no cargo capacity, and a reading it does not draw is not this screen's to add; both tank capacities
appear where it puts them, in the fuel row's own qualifier.

**Frame Shift Drive**:

1. the card heading, with the `SCO` badge riding inside it, on its line — the canvas keeps the two
   together, because the badge is a property of the drive the heading names rather than of the card;
2. the fitted drive's identity, on the same terms as the thruster's;
3. the canvas's headline trio on one hairline ground — `Jump laden`, `Jump unladen` and `Mass lock`;
4. the canvas's hairline under that trio;
5. `Range by load` — three rows in the same label / bar / figure shape the speed envelope takes,
   each naming the load and the one figure the canvas puts on it;
6. the canvas's hairline between the ranges and the legend; and
7. the legend under them: optimal mass, maximum fuel per jump, and `Total range` with the jumps that
   tank makes. Three rows, and no fourth: a Guardian FSD Booster changes every range above and the
   canvas still states only these, so its bonus is not drawn. The rows take the same swatch, name
   and figure shape the mass legend on the other card takes, because that is how the canvas draws
   both.

The package publishes a whole-tank total and a jump count for each of the three loads. The canvas
draws them once, not three times, and once is what is drawn: `totalUnladen`, because the canvas's
qualifier names a full tank and no cargo and that is how the package words the same summary.

The DOM and screen-reader order is that order at every width. Grid placement never changes it, and
no figure is duplicated into a second summary block.

### The mass bar

The canvas's bar is additive, and its own arithmetic says so: its `400`, `662` and `80` run 21.16%,
35.03% and 4.23% of one track, its `MAX 1,890 t` is that track's end, and its optimal mark stands at
1,260 of the same 1,890. So the three parts are laid end to end on a scale that runs from nothing to
the thrusters' maximum supported mass, the length they reach is what the build weighs against that
ceiling, and the optimal mark says where on it the drives stop performing at their best.

A build heavier than its thrusters can carry fills the band and is clipped by it, which is what being
over the maximum looks like. Nothing is rescaled to make it fit: rescaling would move the optimal
mark, and the mark's position is the reading. A thruster publishing no curve has no scale at all, so
the bar and its two marks are absent rather than drawn against something chosen here; the legend
keeps every figure either way.

`Optimal` and `Max` are the canvas's own two words, each written under the position on the scale it
marks: the optimal centred on its own tick, the maximum against the end of the track. Both stay in
the flow of one row rather than being pinned over it, so the pair can never paint across each other
— in German at a doubled text size the row wraps and the maximum drops to a line of its own instead.
The tick on the track carries the position; the words under it carry the two figures.

### The headline trio

Canvas 1c opens the drive card with three cells on a hairline ground: `JUMP LADEN`, `JUMP UNLADEN`
and `MASS LOCK`. They are the card's summary, the way the loaded mass is the thruster card's, and
the two jumps are the ends of the `Range by load` list below them — `Jump unladen` is the row the
canvas heads `UNLADEN`, the package's `maximum`, and `Jump laden` is its fully loaded end, the
package's `laden`. The canvas's own `21.4 LY` is neither: it is the figure canvas 1d puts on a
`CURRENT` row, which this application has no viewing condition to read. So the tile is filled from
the load it is named for rather than from a figure nothing here can produce, and the card can never
head itself with a jump its own rows disagree with.

Mass lock is the hull's own catalogue fact and answers whether or not the drive can be read, so the
trio is drawn for every build. It sits here, where the canvas draws it, rather than in the legend
under the ranges.

## The status rail

Canvas 1c closes its status rail with a grid of six cells — `SHIELD`, `ARMOUR`, `DPS`, `JUMP`,
`SPEED` and `MASS`. Features 006 and 007 own the first three; the last three are this feature's, and
they are drawn under feature 007's `DPS` and above the cost block, exactly where the canvas puts
them. Canvas 1d draws the same three in its Status mode.

Every one is a figure the two cards already state, from the same projection asked the same way:
`JUMP` is the drive card's `Jump laden` cell, `SPEED` the top speed at the head of its speed
envelope, and `MASS` the thruster card's own headline. Same load, same ENG allocation, same
precision. The rail and the cards are one reading of one build seen twice, and a rail that weighed
the hold or rounded differently would put two numbers for one quantity on one screen with both
looking like answers.

None of **these three cells** is interactive, as none of the six is: the canvas draws no control in
that grid, and at both widths the cards these figures come from are a segment away. The rail around
them is no longer entirely a read-out — the 2026-08-25 canvas revision put feature 005's
`SYS` / `ENG` / `WEP` pip control in it — but that control is that feature's and it is not in this
grid (`specs/003-ship-statistics/design/status-rail.md`, item 4).

## Responsive composition

The two-column pair is selected from the space the _region_ is given, with a container query, not
from the viewport. A 400% zoom and a narrow window therefore select the stacked arrangement for the
same reason a phone does, and one DOM serves both. Every field, mark, issue and legend row is
present at every width; nothing is dropped, collapsed behind a control or scrolled off sideways.

## The three loads

The package publishes three and the card draws three. Its `maximum`, `unladen` and `laden` are the
canvas's `UNLADEN`, `FUELLED` and `FULL CARGO`, and the mapping is exact: one jump's fuel with an
empty hold, a full main tank with an empty hold, a full tank with a full hold. The canvas writes the
three names and nothing beside them, so the card writes the three names: a gloss under each row is a
line neither canvas draws.

The canvas's fourth `CURRENT` row is not one of these three: canvas 1d sets it at `21.4 ly` beside
`FUELLED 23.5`, and `21.4` is the figure canvas 1c heads `JUMP LADEN`. It is a jump at some arbitrary
current fuel and cargo state, and this application carries no current-load viewing condition to read
one at, so the three the package publishes are the three drawn.

Equal values stay separate rows. Zero fuel is a numeric zero, not an empty card.

## Four readings the library now answers

Four of the canvas's readings — the headline loaded mass, the "% of optimal mass" position beside
it, the modules segment of the mass bar and the `SCO` badge — had no result in the version of
`@elite-dangerous-almanac/core` this feature started against. All four were raised against the
library, all four are published now, and each is drawn in the place the canvas puts it:

- the headline mass and the whole hull / modules / fuel split are **one** package answer,
  `buildMass(load)`, read at the load the card names;
- the position on the curve is that answer's loaded mass against the thruster's own `optMass`, the
  comparison the package's `thrusters` getter itself prescribes; and
- the `SCO` badge is the drive record's `supercruiseOvercharge` flag, never inferred from a symbol.

`unladenMass + fuel + cargo` is available on this very screen and is deliberately still not worked
out: that sum would be this application calculating a game value, which constitution II forbids and
constitution IV forbids showing. The total is read, not added, and it would disagree with the
package the moment the package counted something this addition does not.

## Bars are decoration

Every bar on both cards — the mass band, the speed envelope, the range rows — is `aria-hidden`
and every figure it is drawn from is printed beside or beneath it in text. No meaning rests on a
length, and none on a colour: the mass band's three parts take three depths of one amber, and which
part is which is carried by the legend row that names it in words. The envelope's bars are each
scaled inside their own group because the package publishes no maximum speed or rotation rate for a
build to be measured against, and the mass band's track runs to the thrusters' maximum supported
mass because that is the only maximum the package gives it.

## Mobility, and when the package cannot say

Two complete results present the five readings the canvas draws: `boost` from the flight model,
which the package states independently of the allocation, and `speed`, `pitch`, `roll` and `yaw`
from what the settled ENG pips make of it. The flight model's `loadedMass` is what the position on
the curve is measured against, and its two multipliers are not drawn. An incomplete result — either
of them — presents the package's exact issues in the package's order, whose fields and reasons distinguish absent, disabled, shed,
package-unresolved and invalid-input thrusters.

The hull's own catalogue speed and rotation exist and are deliberately not reached for: a catalogue
speed is not this build's speed (FR-005). Nothing stands in.

A switched-off mount is reported as off rather than as missing — two different states, worded
differently — and its curve marks stay, because what is unavailable is the build's mobility, not the
module's stats.

Complete all-zero performance above supported mass stays a ready package zero, in text as well as in
appearance.

## Absent stays absent

A hull the catalogue does not carry has no mass lock, and that reads as unavailable — this build's
hull simply is not known. A drive fact the package does not publish is likewise absent rather than
zero: `null` is drawn as unavailable, never as a figure.

## Surface states and feedback

### No active build

The region draws nothing at all. Feature 001's workspace already says why the screen is empty, and a
mass of `0 t` is a number a Commander could act on.

### Package blockers and incomplete results

Every independent group stays available. Only the dependent group is replaced, by localized
unavailable framing with its exact issues associated to it.

### Package zero

A locale-formatted zero with text that preserves the load and result meaning. Colour may supplement
the distinction and cannot carry it.

### No failure state, and no announcement

Neither is drawn, on feature 005's ruling for the same region
(`specs/005-power-and-heat/design/power-and-heat-detail.md`). The projection is synchronous over a
loadout already in memory: there is no moment at which it is on its way, and a package exception is
an application defect rather than a screen. `projectionFailed` belongs to feature 003's status
transaction and appears nowhere here.

Changing a module or a pip changes visible content in place, and none of it is announced: the
control reports its own state, the region is on screen, and feature 003's ruling A already
established that visible content in this area is not live. The package's issue lists are ordinary
readable content rather than a burst of live-region messages.

## Localization and state coverage

Every owned heading, label, load identity, state, unit and badge resolves through feature 011.
Numbers use named locale formatters for light-years, m/s, degrees/s, tonnes, percentages and integer
counts. The Almanac owns module and slot names and its own diagnostics; canonical fallback is
disclosed.

There is no preview declaration: the manifest holds one per exported `src/app/ui/` component, and
this is a feature region rather than a design-system component. The meaningful states from
[screen-inventory.md](./screen-inventory.md) are covered by the Playwright suite instead, at desktop,
tablet and mobile widths, portrait and landscape, expanded text, RTL and reduced motion. Source
identity, result, unit, badge and issue association must survive every variant.
