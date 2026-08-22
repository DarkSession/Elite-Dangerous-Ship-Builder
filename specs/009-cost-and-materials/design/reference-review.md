# Design Reference Review: Cost and Materials

The design source is `.design/Ship Builder.dc.html`.

- Canvas **1c** is a 1560 px wide outfitting composition with a 392 px slot ledger, fluid central
  anatomy/fitting/engineering area and 306 px Status/cost/material rail.
- Canvas **1d** is a 390 px mobile composition whose Status mode stacks warnings, summary, Cost and
  Materials, while Change Module and Engineer use full-screen in-document layers.
- No tablet, intermediate-width, landscape or zoom composition is designed. Those are plan-owned,
  and are decided from content rather than copied measurements.

The HTML is the record of what this capability presents. It is not a source of game values,
component code, breakpoints or assets.

## What the canvas draws

Read out of 1c (lines 12280–12470) and confirmed identical in 1d's Status mode (lines 7120–7330):

```text
COST                                 mono 600 10px, amber-2, .2em   padding 14/16
  Hull        146,969,450            mono 400 11px, ink-7
  Modules     214,382,910            mono 400 11px, ink-7
  ─────────────────────────────────  border-top 1px amber-a16, padding-top 9
  TOTAL       361,352,360            mono 500 13px, amber-3
  REBUY 5%     18,067,618            mono 400 9px, ink-36, .06em, margin-top 2
────────────────────────────────────  border-top 1px amber-a16
MATERIALS              14 BLUEPRINTS amber-2 / ink-38               padding 14/16
  [g5] Pharmaceutical Isolators   12
  [g5] Military Grade Alloys      24
  [g4] Proto Light Alloys         36
  [g4] Selenium                   30
  [g3] Zirconium                  45     names in Barlow 400 10.5px, ink-2
  ─────────────────────────────────  border-top 1px amber-a16, padding-top 8
  18 MATERIAL TYPES  412 UNITS TOTAL  ink-36, .06em, space-between
  ─────────────────────────────────  border-top 1px amber-a16, padding-top 9
  [coin] Merc Coins            1,840  14px coin, then the words, then #f2003c
```

**The block is ruled four times**, each a one-pixel `amber-a16` wash: above
`TOTAL`, between the two blocks, above the counts, and above Merc Coin. These
rules are structure rather than decoration — the one above `TOTAL` is what makes
that row read as the sum of the two rows over it rather than a third fact beside
them. Each block carries its own `14px 16px` inset and the blocks sit flush, so
every rule runs the full width of the rail.

**Two voices, deliberately.** The whole cost row — the word and its figure —
is one JetBrains Mono face; the material names below are Barlow prose. A number
and the word for it belong to the same voice in the cost block, and `TOTAL` is
two steps up the ramp from the facts it totals (13px against 11px) in a heavier
weight. `Hull` and `Modules` are sentence case; `TOTAL` and `REBUY 5%` are not.

**The canvas draws the rows rarest first** — 5, 5, 4, 4, 3, in both the rail
list and the Engineer panel's `MATERIALS · G5` list. This is the one thing the
product does not copy; see ruling G.

**The Merc Coin row opens with a 14px coin**, then the words, then the figure.

**The two footer counts sit at opposite ends of their row**, in a
`space-between` flex. They are two facts separated by the width of the block,
not one sentence joined by punctuation.

There is no disclosure control anywhere in either block. There is no unpriced, lower-bound,
unavailable, missing-recipe or error state. The two `▾` glyphs in 1c belong to the blueprint and
grade selectors in the Engineer panel, not here.

## Adopt

- The two blocks, in this order, at every width: `COST` then `MATERIALS`.
- Hull and Modules as separate package facts, `TOTAL` as the amber anchor, `REBUY 5%` beneath in the
  faint micro treatment.
- The blueprint count opposite the `MATERIALS` heading.
- Material rows as rarity marker, name taking the width, mono count.
- Rows ordered rarest first, then by name within a rarity band.
- The four rules, and each block's own inset.
- The type/unit footer in the same faint micro treatment as `REBUY 5%`, its two
  counts set at opposite ends of the row.
- Merc Coin as the final row of the materials block, in its own colour.
- The wide rail becoming a stacked block in 1d's Status mode.

## Ruled divergences (wave 10, 2026-08-22)

Six collisions between the specification and the canvas were surfaced to the user before
implementation. **The design won all six.** These rulings are binding; do not re-litigate them.

| #   | Canvas draws                                            | Specification wanted                                                                                                                                                                                    | Ruling                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | `TOTAL 361,352,360`, the amber anchor of the block      | No combined total — the package returns no such field (FR-001/002)                                                                                                                                      | **Design.** The application adds the package `hull` and `modules` and draws the row.                                                                                                                                                                                 |
| B   | `REBUY 5%` as the label                                 | The literal package rebuy with no derived percentage (FR-002)                                                                                                                                           | **Design.** The label text is the canvas's, fixed; the number stays the package's `rebuy`.                                                                                                                                                                           |
| C   | `Merc Coins 1,840` as the last row of `MATERIALS`       | A separate conditional region with per-slot entries, purchase grade and current grade (FR-005/006)                                                                                                      | **Design.** One row, at the foot of the materials block, shown only when a Mercenary article is recognized. Per-slot Merc pricing is not built.                                                                                                                      |
| D   | `14 BLUEPRINTS`, `18 MATERIAL TYPES`, `412 UNITS TOTAL` | No authored aggregate arithmetic (Story 2)                                                                                                                                                              | **Design.** All three are counted by the application over package results.                                                                                                                                                                                           |
| E   | Five material rows out of eighteen                      | Every consolidated row (Story 2)                                                                                                                                                                        | **Split: every row, and keep the counts.** The list is complete; the canvas's aggregate footer stays. This is the one ruling that is not purely the canvas — truncation was rejected because a Commander cannot shop from a list that hides thirteen of its entries. |
| F   | _(nothing)_                                             | Per-row material trace disclosure (SC-003 as written), the unpriced-module evidence list with slot actions (FR-002), and lower-bound / unavailable / missing-recipe / untranslated wording (FR-008/010) | **Design — remove all of it.** Roughly half of the specified surface is drawn nowhere on either canvas and is not built. The former SC-002 and SC-003 are withdrawn with it.                                                                                         |

### What ruling F withdraws

Not built, and not to be reintroduced without a new ruling:

- `MaterialTraceComponent` and every per-row disclosure of contributing fitted selections.
- The unpriced-credit evidence list and its per-entry feature-002 slot actions.
- Per-slot Mercenary entries, purchase grade, current grade and a Mercenary region total separate
  from the one drawn row.
- Every visible lower-bound, unavailable, missing-blueprint, missing-effect and metadata-gap
  qualification.
- The `Exact` / `LowerBound` / `Unavailable` discriminant tower that existed only to carry them.

A consequence accepted with the ruling: an unpriced module lowers the package `modules` figure and
a package that cannot cost a recipe contributes nothing to the list, and neither says so on screen.

### Ruling G — material order (wave 10, 2026-08-22)

| Canvas draws                | Product does                      | Ruling                                              |
| --------------------------- | --------------------------------- | --------------------------------------------------- |
| Rarest first: 5, 5, 4, 4, 3 | **Commonest first**, then by name | **Spec/consistency wins, by explicit instruction.** |

The one ruling in this feature that does not follow the artboard. The order is a
shopping list's — what a Commander gathers first — and it is the order
`edsb-material-cost-list` already puts the Engineer panel's list in, under
feature 002's wave 9 ruling. Copying the artboard here would have left the two
material lists in one application sorted opposite ways, each faithful to its own
drawing and neither to the other. A material the package grades no rarity for
sorts last: an unknown rarity is not a low one.

Ordering is applied at the presentation layer, not in the projection: the
tie-break needs the active-locale name, and the projection keeps the package's
own `sumMaterials()` order for any consumer that wants it.

Both lists call one comparator, `sortMaterialLines` in
`src/app/ui/outfitting/material-cost-list.ts`. A second copy would be a second
ordering of the same shopping list, which is the thing this ruling exists to
prevent — and feature 002's original copy had already drifted: it broke ties
with a bare `localeCompare()`, which reads the _browser's_ language rather than
the one the application is drawing in, so the two lists disagreed for any
Commander whose chosen language is not their browser's. The shared comparator
takes the active-locale collator, and feature 002 now calls it.

### What survives ruling F, and why

Material names render through feature 011's shared `edsb-game-text` primitive, which carries its own
untranslated disclosure. That is the design system's existing behaviour for every game name in the
application — feature 002's material rows already render this way — not a feature-009 addition.
Removing it here would make this one surface inconsistent with the rest of the app.

## Departures that remain, on constitutional grounds

These are not spec-versus-design collisions; the constitution forbids the canvas's mechanism and the
canvas's _intent_ is preserved by another means. Both were already settled for feature 002.

| Canvas                                                                           | Built instead                                               | Reason                                                                             |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `<img src="https://edassets.org/static/img/materials/grade-N.svg">` rarity icons | `edsb-material-grade`, the same fact drawn from the package | Constitution I forbids cross-origin runtime requests                               |
| `Mcr` in 1d's module rows, and `.design/assets/merc-coin.png`                    | Locale-formatted numbers with the block's own labels        | The abbreviation is not locale-safe; the asset has no accepted provenance decision |
| Clickable unsemantic `div`s and inline colours/sizes                             | Shared primitives and design tokens                         | Touch, screen-reader operation and one design system                               |

### Text the canvas cannot draw

Two strings reach a screen reader and no screen. A canvas is a picture, so it
has no way to draw either, and neither adds anything a sighted Commander is not
already being shown — they are the accessibility floor, not new surface.

| String                                          | Where                              | Why it exists                                                                                                                                                  |
| ----------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `credits` (`cost-materials.cost.unit`)          | Once in the `COST` block           | The canvas states the unit by the block's context alone; read aloud, four bare numbers name no currency                                                        |
| `Build status` (`outfitting.status-rail.label`) | The status rail's scroll container | The canvas's own name for this region — 1d labels the mode `BUILD STATUS`, `WARNINGS · COST · MATERIALS` — so it still fits once feature 003 adds the warnings |

The rail's tab stop needs its own note, because the criterion it looks like it
is for is out of scope here. Keyboard operation — 2.1.1 among the seven — is
constitutionally excluded, and no requirement in this repository may demand it.
The in-scope requirement is the one above it: no loss of content. At the widest
composition a long material list makes the rail taller than the viewport, and a
sticky column with no scroll box of its own would pin with its lower rows
permanently off-screen. The scroll box is what prevents that; `tabindex="0"` is
what the automated axe gate requires of a scroll box, since
`scrollable-region-focusable` carries the `wcag2a` tag the scan selects on and
the scan has no per-criterion exclusion. Same pattern, and same reasoning,
as `edsb-data-table` and `edsb-attribute-comparison`.

## Responsive consequence

Wide 1c proximity and mobile 1d stacking are the compositional intent. DOM and read order stay
`COST` → `MATERIALS` at every width. Nothing depends on hover, and the document never scrolls
horizontally.
