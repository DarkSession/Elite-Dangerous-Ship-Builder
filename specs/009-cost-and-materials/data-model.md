# Data Model: Cost and Materials

One immutable, in-memory projection of the active package `ShipLoadout`. Not a persistence schema.
Material identities remain exact package `symbol` values. Formatted numbers and localized text are
presentation-only.

The `Exact` / `LowerBound` / `Unavailable` discriminant tower this file once defined is **withdrawn**
by the wave 10 ruling ([design/reference-review.md](./design/reference-review.md), ruling F). It
existed only to carry qualifications the canvas does not draw. What remains is what the two blocks
render.

## CostAndMaterials

| Field       | Type                    | Rule                                               |
| ----------- | ----------------------- | -------------------------------------------------- |
| `credits`   | `CreditsView`           | Literal `buildCost().credits` fields               |
| `materials` | `MaterialsView \| null` | `null` when no engineering contributes a cost list |
| `mercCoin`  | `number \| null`        | `buildCost().mercCoins`, or `null` when it is zero |

The projection is a synchronous pure function of the loadout. There is no revision key, no cache
generation and no pending or failure state: a build either exists, in which case these figures are
read from it, or it does not, in which case nothing is drawn.

## CreditsView

| Field     | Type     | Rule                                                         |
| --------- | -------- | ------------------------------------------------------------ |
| `hull`    | `number` | Literal package `hull`                                       |
| `modules` | `number` | Literal package `modules`                                    |
| `total`   | `number` | Literal package `total`                                      |
| `rebuy`   | `number` | Literal package `rebuy`; the `5%` in its label is fixed text |

The package's `unpriced` list is not projected. There is no nullable numeric field, no captured
purchase value and no consumer-derived percentage.

## MaterialsView

| Field        | Type                     | Rule                                                 |
| ------------ | ------------------------ | ---------------------------------------------------- |
| `blueprints` | `number`                 | Count of fitted modules that contributed a cost list |
| `rows`       | `readonly MaterialRow[]` | Literal `buildCost().materials` symbols and counts   |
| `types`      | `number`                 | `rows.length`                                        |
| `units`      | `number`                 | Sum of `rows[].count`                                |

`blueprints`, `types` and `units` are the three ruled counting derivations (ruling D). Nothing else
is counted, summed, sorted, deduplicated or reordered. The Merc Coin figure is excluded from all
three.

Reading order is not the projection's business. The rows leave here in the package's own order; the
surface sorts a copy for display through the shared `sortMaterialLines`, because the tie-break needs
the active-locale name that only the presentation layer has (ruling G).

`materials` is `null` — the whole block absent — when no fitted module contributes a known cost
list. A module whose recipe the package cannot cost simply contributes nothing (ruling F); it does
not make the block absent and is not named.

## MaterialRow

| Field    | Type             | Rule                                               |
| -------- | ---------------- | -------------------------------------------------- |
| `symbol` | `string`         | Literal `buildCost().materials` identity, in order |
| `count`  | `number`         | Literal `buildCost().materials` count              |
| `grade`  | `number \| null` | `materialRarity(symbol)`; `null` where none exists |

## Presentation-only

The surface adds package-localised material names as a `GameTextPresentation` — the shape the
Engineer panel's own list consumed before feature 002 withdrew it (ruling G, amended 2026-08-23),
carrying its own untranslated disclosure — plus localized
block headings and labels and active-locale number formatting. Formatting never changes a number.

It also decides **reading order**: rows are drawn commonest first and then by name, using the
active-locale collator, with an ungraded material last and its symbol as the tie-break key. The
projection above keeps the package's own order; ordering for reading needs the localised name and
belongs where that name is resolved.

No presentation state is persisted, and none reaches history, URLs, build links or SLEF.
