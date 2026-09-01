# Engineering Materials Contract

Binding ruling: [../design/reference-review.md](../design/reference-review.md), wave 10.

## Package boundary

This feature reads the package's consolidated `buildCost().materials` result. It calls feature 002's
accepted framework-agnostic boundary only for the blueprint count:

- `engineeringCost(selection)` from `src/app/domain/ships/outfitting/engineering-cost.ts`, which owns
  `getBlueprintCost`, `getExperimentalEffectCost` and the fixed / Mercenary-purchase classification;
- `materialRarity(symbol)` from the same module, which owns `getMaterialBySymbol`;
- `getMaterialName` through feature 011's game-text presenter, for row names.

**No second classifier.** Feature 002 already ruled the Mercenary purchase baseline, the fixed
reward baseline, the baked effect and the cumulative climb (waves 5 and 9, recorded in that file's
comments). Feature 009 consumes those decisions and adds none.

No application data contains recipes, roll multipliers, fixed or Mercenary identity lists, material
grades, or game-name translations.

## Consolidation

Walk the captured fitted modules in package order. For each, build the committed
`EngineeringSelection` from `FittedModule.engineering` and `FittedModule.preEngineeredVariant`, and
call `engineeringCost()` once.

- A module whose `combined` cost is `known` with a non-empty list contributes that list, and counts
  towards `blueprints`.
- A module whose `combined` cost is `known` and empty contributes nothing and is not counted.
- A module whose `combined` cost is `unavailable` contributes nothing, is not counted, and is not
  named (ruled F). Feature 002's boundary already returns `unavailable` rather than a zero, so no
  free upgrade is implied — it is simply absent from the list.

Preserve `buildCost().materials` order, symbols and counts. Do not loop grades, multiply rolls, add
counts, deduplicate or consolidate before or after the package call.

**Reading order is a presentation concern, not a projection one.** The projection returns the
package's order untouched; the surface orders the rows commonest first and then by name, through the
shared `sortMaterialLines` (ruling G). The distinction matters because the tie-break needs the active-locale name,
which the domain does not have, and because a consumer that wanted the package's own order must
still be able to get it.

When no module contributes, the materials block is absent in whole. There is no `none` explanation,
no fixed or purchase baseline note, and no fabricated zero row.

## Ruled counting

Three figures the canvas draws are counted by the application over the package result (ruling D):

| Figure       | Definition                                            |
| ------------ | ----------------------------------------------------- |
| `blueprints` | Number of fitted modules that contributed a cost list |
| `types`      | `rows.length` of the `buildCost().materials` result   |
| `units`      | Sum of every row's package count                      |

Nothing else is derived. No percentage, share, allocation, per-row trace or readiness judgement
exists.

## Metadata and language

Each consolidated symbol's rarity comes from `materialRarity()` and nothing else; a `null` grade
means the row draws no rarity marker, and no field is inferred from a symbol, icon or colour.

Row names come from the package through feature 011's game-text presenter, which supplies the
canonical-text fallback and untranslated disclosure the whole application uses. Feature 009 adds no
game-text handling of its own.

## Package regression

The installed Almanac reports no ordinary stock cargo-rack route for `CargoRack_IncreasedCapacity`
and `getBlueprintCost(..., 5)` returns `null`, while the authored fixed variants remain
package-identifiable. The application must not special-case the fdname, call it free, or substitute
another recipe — under this contract such a module simply contributes nothing.

## Verification

Tests cover ordinary cumulative climbs, a Mercenary purchase baseline and a later grade, a fixed
blueprint and baked effect, a changed and a removed effect, repeated and shared materials across
modules, a source that costs `[]` versus one that is `unavailable`, first-seen order preservation,
the three counts, an absent materials block, and the cargo-rack regression. Quantities are
deep-equal to package outputs.
