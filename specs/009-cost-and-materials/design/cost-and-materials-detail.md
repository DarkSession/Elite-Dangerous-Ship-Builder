# Cost and Materials Detail

**Parent**: the outfitting workspace status rail (canvas 1c) / Status mode (canvas 1d)
**Requirements**: FR-001–FR-010
**Binding ruling**: [reference-review.md](./reference-review.md), "Ruled divergences" (wave 10)

## Purpose and semantic order

Present what the canvas draws, and nothing else. DOM and read order is always:

1. the `COST` block;
2. the `MATERIALS` block, ending with the conditional Merc Coin row.

Visual placement changes with width; semantic order and content do not.

## The COST block

Four rows, in the canvas's order:

| Row        | Value                         | Treatment                  |
| ---------- | ----------------------------- | -------------------------- |
| Hull       | `buildCost().credits.hull`    | primary ink                |
| Modules    | `buildCost().credits.modules` | primary ink                |
| `TOTAL`    | `buildCost().credits.total`   | accent, the block's anchor |
| `REBUY 5%` | `buildCost().credits.rebuy`   | faint micro label, tracked |

`TOTAL` is a literal package result in Almanac 0.1.6, and `REBUY 5%` is a fixed label — the
percentage is canvas text, not a derivation from the number beside it. The original ruling A remains
the reason the row is present; the application-owned arithmetic it once allowed is retired.

A rule sits above `TOTAL`, as the canvas draws it. It is structure, not decoration: it is what makes
the row read as the sum of the two above it rather than a third fact beside them. `TOTAL` is also
two steps up the type ramp from the facts it totals and set in a heavier weight.

The whole cost row — label and figure alike — is the canvas's JetBrains Mono face, which is what
separates this block from the material rows below it: there the names are Barlow prose. `Hull` and
`Modules` read sentence case; `TOTAL` and `REBUY 5%` are uppercased.

The returned `unpriced` list is read by nothing. No qualification, evidence list or slot action is
built (ruled F). Captured purchase values are never read.

## The MATERIALS block

The heading carries the blueprint count opposite it, exactly as the canvas draws `14 BLUEPRINTS`.

Every consolidated row, with no truncation and no top-N cut (ruled E). Each row is a rarity marker,
the package-localised material name, and the locale-formatted quantity — the row composition feature
002 shipped in `edsb-material-cost-list`, which is now this block's alone (ruling G, amended
2026-08-23).

Rows run **commonest first, then by name** within a rarity band — a shopping list in the order a
Commander gathers one, and the order the Engineer panel's list used before it was withdrawn. Both
canvases draw the opposite; ruling G decided that the two material lists in the application should
agree with each other rather than each match its own artboard, and it stands now that only one is
left (amended 2026-08-23). The package returns its own
catalogue order, which is neither, so the ordering is applied at the presentation layer where the
localised name exists — the projection keeps the literal `buildCost().materials` order. A material the
package grades no rarity for sorts last: an unknown rarity is not a low one.

The block is separated from `COST` by a rule, and closes with the type/unit footer over another.
The footer's two counts sit at opposite ends of the row rather than joined into one sentence, in the
same faint micro treatment as `REBUY 5%`. Both are counted over the consolidated package result.

The Merc Coin row is last, over a rule of its own, drawn only when `buildCost().mercCoins` is greater
than zero and carrying that literal package total in its own colour. It opens with the shipped 14px
coin, as the canvas draws it — decorative, because the
localized label beside it is what carries the meaning. It is excluded from the type and unit counts — it is a purchase price, not a material.
Its rule is omitted when it is the block's only row: on a build that bought an article and crafts
nothing there is no list above it to be ruled off.

A build with no engineering draws no material rows, no blueprint count and no footer. A recipe the
package cannot cost contributes nothing and says nothing (ruled F).

## Responsive composition

- Wide follows canvas 1c: the two blocks stack in the status rail beside the ledger and bench.
- Mobile follows canvas 1d: the same two blocks, same order, in the Status stack.
- Between those, and at 200% text and 400% zoom, the same single semantic column. No row, label or
  count is truncated; the document never scrolls horizontally.
- Nothing here is interactive, so there is no target-size or hover concern in these blocks.

## Required states

| State                        | Presentation                                           |
| ---------------------------- | ------------------------------------------------------ |
| No active build              | Existing workspace empty state; neither block is drawn |
| Active build                 | Both blocks, from the current package result           |
| No engineering               | `COST` only; the materials block is absent             |
| Zero package Merc Coin total | No Merc Coin row, and no zero in its place             |
| Non-zero package total       | The Merc Coin row carrying the package build total     |

There is no pending, stale, mismatched-context or projection-failure treatment: the projection is a
synchronous read of the active loadout, so there is no state between having a build and having its
figures.

## Accessibility and localization

Both blocks are labelled regions with localized headings. Label/value pairs are description lists,
so each number is associated with its label natively rather than by sitting beside it — the pattern
`edsb-material-cost-list` established.

Material names render through feature 011's `edsb-game-text`, which carries the untranslated
disclosure the rest of the application uses. Rarity uses `edsb-material-grade`, not the canvas's
cross-origin icon. Every owned label comes from application messages; every number uses a named
active-locale formatter and changes no value.

Nothing in these blocks depends on colour alone: the Merc Coin row is named as well as coloured, and
`TOTAL` is labelled as well as accented.

## Component impact

Compose the shared section, description-list, micro-label, `edsb-game-text` and `edsb-material-grade`
primitives, and feature 011's active-locale collator for the name tie-break. Nothing here needs a new
shared primitive, and no screen-local colours, sizes, spacing, radii, elevation or motion are added:
the four rules use `--ednb-border-region` and the insets use the existing space roles.
