## Purpose

This capability presents the current catalogue-retail credits, the current Merc Coin cost and the
engineering materials for the active build. Historical purchase values are outside the application
model.

## Requirements

### Requirement: Package ownership of prices and quantities

Every credit, Merc Coin and material quantity MUST come from `@elite-dangerous-almanac/core`. The
application MUST NOT calculate a price, a rebuy, a Merc Coin cost or a material quantity.

One exception is ruled: the three counts the canvas draws that the package does not return — the
blueprint count, the material-type count and the unit total — ARE computed by the application, by
counting package results only. No other derived figure is permitted. `TOTAL` is a package result.

Source: 009/FR-001, 009/SC-001.

#### Scenario: A drawn price or quantity equals its package result

- **WHEN** the screen draws a price, a Merc Coin figure or a material quantity, `TOTAL` included
- **THEN** the value equals its Almanac `buildCost()` result

#### Scenario: A derived figure outside the three counts

- **WHEN** a figure is neither a package result nor one of the three ruled counts
- **THEN** the application does not present it

### Requirement: Credits from one build-cost result

Credits MUST use one `BuildMetrics.buildCost().credits` result for hull, modules, total and rebuy.
The returned `unpriced` list MUST NOT be presented; the canvas draws no evidence list and none is
built.

Source: 009/FR-002, 009/SC-003.

#### Scenario: The cost rows

- **WHEN** the cost block is drawn
- **THEN** hull, fitted-module, total and rebuy credits all come from one
  `BuildMetrics.buildCost().credits` result

#### Scenario: The rendered blocks

- **WHEN** the blocks of canvases 1c and 1d are rendered
- **THEN** `COST` holds Hull, Modules, a ruled `TOTAL` and `REBUY 5%`
- **AND** over a rule, `MATERIALS` holds its blueprint count, every consolidated row in ascending
  rarity, and a ruled type and unit footer
- **AND** the conditional ruled Merc Coin row sits behind its coin

#### Scenario: A build with unpriced modules

- **WHEN** the package cannot price a fitted module
- **THEN** the package `modules` figure is lower and the screen draws no qualification for it

### Requirement: Catalogue retail is the only credits estimate

Captured or historical purchase values MUST NOT enter build state or cost presentation. Catalogue
retail MUST remain the sole credits estimate for the current fitted build.

Source: 009/FR-003.

#### Scenario: An imported capture carries purchase values

- **WHEN** a capture carries a purchase value for a module
- **THEN** that value enters neither the build state nor the cost block, and catalogue retail states
  the cost

### Requirement: The Merc Coin charge comes from the package

Whether the current build has a Merc Coin charge MUST come only from
`BuildMetrics.buildCost().mercCoins`. The application MUST NOT infer it from module identity,
acquisition route, blueprint or experimental effect.

Source: 009/FR-004.

#### Scenario: Recognising a Merc Coin charge

- **WHEN** the application decides whether the build has a Merc Coin charge
- **THEN** it reads `BuildMetrics.buildCost().mercCoins` and nothing else

### Requirement: The Merc Coin row

The Merc Coin figure MUST be the literal `BuildMetrics.buildCost().mercCoins` total, presented as one
row ruled off at the foot of the cost block, under `REBUY 5%`, when the total is greater than zero.
The `MATERIALS` block begins below that row. A purchase price is not a material, so Merc Coin stays
out of the material list and out of the two counts.

Merc Coin MUST NOT be added to, converted into or compared with credits or rebuy, and MUST NOT be
folded into the material-type or unit totals. Per-slot Merc Coin pricing MUST NOT be presented.

Source: 009/FR-005.

#### Scenario: A build with a Merc Coin charge

- **WHEN** the package reports a Merc Coin total greater than zero
- **THEN** one row ruled off under `REBUY 5%` at the foot of the cost block states that literal total
- **AND** the total is not added to credits or rebuy and not counted as a material

### Requirement: The Merc Coin row follows the package total

The Merc Coin row MUST be absent when the package total is zero. Fitting, removing or engineering
modules MUST update the row to the package's current build total, with no retained purchase history.

Source: 009/FR-006.

#### Scenario: No Merc Coin charge

- **WHEN** the package Merc Coin total is zero
- **THEN** no Merc Coin row is drawn

#### Scenario: Engineering changes

- **WHEN** the Commander clears or changes engineering and the package Merc Coin total changes
- **THEN** the row follows the resulting package state

### Requirement: Consolidated materials from one package result

The consolidated material identities and quantities MUST be the literal
`BuildMetrics.buildCost().materials` result. This feature reuses feature 002's `engineeringCost()`
boundary only to count fitted modules that contribute a cost list, and MUST NOT add a second cost
classifier or consolidation path.

Blueprint cost MUST be cumulative through the selected grade, and each experimental effect MUST
contribute one application. Repeated engineering selections contribute repeatedly before package
consolidation.

The states the canvas does not draw MUST NOT be built: material traces, unpriced evidence,
lower-bound wording and unavailable wording.

Source: 009/FR-007.

#### Scenario: The consolidated list

- **WHEN** the material list is drawn
- **THEN** one consolidated list states every material's package-localised name, rarity grade and
  quantity, ordered commonest first and then by name

#### Scenario: A build with no engineering

- **WHEN** the build carries no engineering
- **THEN** the list shows no material rows and no blueprint count

### Requirement: The three counts are counted over the package result

The block MUST state how many blueprints contributed, and MUST close with the number of material
types and the total number of units, set at opposite ends of the closing row. Each of the three
counts MUST be counted over the package result and MUST match it.

Source: 009/FR-001, 009/SC-002.

#### Scenario: The closing row

- **WHEN** the material block is drawn
- **THEN** it states the contributing blueprint count
- **AND** it closes with the material-type count and the unit total at opposite ends of the row
- **AND** each count matches a count over the package result

### Requirement: The material list is a bounded box

The material list MUST be drawn as a bounded box that scrolls within itself, as both canvases draw it
— five rows against a footer counting eighteen types. Every consolidated row MUST remain present and
reachable; bounding the box MUST NOT drop a row, and the two counts beneath it MUST continue to
describe the whole list rather than the part in view. The bound MUST be expressed in a text-relative
unit so the box grows with the Commander's text size instead of holding fewer rows at 200%. Because
the box scrolls, it MUST be focusable and MUST carry an accessible name, which the block's own
heading supplies.

The measure is a floor as well as a bound, and which of the two it acts as depends on what the block
sits in. Where the rail is the canvas's own third track it is a column of a fixed height — everything
the command bar leaves — and this block closes it. In that column the box MUST take the space the
blocks above it leave and scroll only what will not fit, and it MUST NOT fall below the measure.
Everywhere else — the rail as a band under the bench, the compact Status stack, a released short
viewport — the page has the height to grow into, and the measure MUST stay a cap, or the whole
shopping list runs down the screen.

Source: 009/FR-007a.

#### Scenario: More rows than the box holds

- **WHEN** the consolidated list holds more rows than the box shows
- **THEN** the box scrolls within itself, every consolidated row stays present and reachable, and the
  two counts still describe the whole list

#### Scenario: The block closes the fixed-height column

- **WHEN** the block sits in the canvas's third track, a column of a fixed height
- **THEN** the box takes the space the blocks above it leave, scrolls only what will not fit, and
  does not fall below the measure

#### Scenario: The page has height to grow into

- **WHEN** the block sits in the rail as a band under the bench, in the compact Status stack, or in a
  released short viewport
- **THEN** the measure acts as a cap on the box

#### Scenario: The Commander enlarges the text

- **WHEN** the Commander sets text to 200%
- **THEN** the box grows with the text rather than holding fewer rows

### Requirement: A blueprint the package cannot cost

A blueprint or effect the package cannot cost MUST contribute nothing to the list. The canvas draws
no missing-recipe wording and none is built.

Source: 009/FR-008.

#### Scenario: An uncostable blueprint

- **WHEN** the package cannot cost a blueprint or an experimental effect
- **THEN** it contributes nothing to the material list and no missing-recipe wording is shown

### Requirement: Fixed pre-engineering and purchase grades

Fixed pre-engineering MUST contribute no craft cost. A Mercenary purchase grade MUST be treated as a
purchase rather than as ordinary crafted engineering, and the later ordinary grades MUST retain their
package material cost.

Source: 009/FR-009.

#### Scenario: A module with fixed pre-engineering

- **WHEN** a fitted module carries fixed pre-engineering
- **THEN** it contributes no craft cost to the material list

#### Scenario: A Mercenary purchase grade

- **WHEN** a module carries a Mercenary purchase grade
- **THEN** that grade contributes no craft cost and the later ordinary grades keep their package
  material cost

### Requirement: Material identity and names come from the package

Material identity, rarity grade and localised name MUST come from the Almanac. Material names MUST be
rendered through feature 011's shared game-text primitive, which carries the application's own
canonical-text fallback and untranslated disclosure. This feature adds no game-text handling of its
own and MUST NOT maintain game-text translations. These rows are the application's only material
list, and they are rendered the way every other game name in the application is.

Source: 009/FR-010, 009/SC-004.

#### Scenario: A material name

- **WHEN** a material row states a name
- **THEN** the name, the rarity grade and the identity come from the Almanac through feature 011's
  shared game-text primitive

#### Scenario: No application-owned cost rule

- **WHEN** the application's own files are inspected
- **THEN** no application-owned price, rebuy, Merc Coin, recognition or material-consolidation rule
  exists
