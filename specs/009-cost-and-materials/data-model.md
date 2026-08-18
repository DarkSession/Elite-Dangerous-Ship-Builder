# Data Model: Cost and Materials

All records are immutable projections of one package `ShipLoadout`. They are not persistence schemas.
Game identities use exact package slot keys, module `symbol`, blueprint/effect `fdname` and material
`symbol`. Application display text and formatted figures are deliberately absent.

## CostAndMaterialsSnapshot

| Field           | Type                                | Rule                                                          |
| --------------- | ----------------------------------- | ------------------------------------------------------------- |
| `buildRevision` | opaque monotonic revision           | Must match the captured active build for every child result   |
| `retail`        | `RetailCreditsProjection`           | One literal `retailCredits()` result, semantically classified |
| `mercCoin`      | `MercCoinProjection`                | `absent` or recognized purchase collection                    |
| `engineering`   | `EngineeringRequirementsProjection` | Exact source costs, consolidation and traces                  |

The snapshot is published in one assignment. Locale changes re-present it and do not produce a new
domain snapshot. Build changes invalidate the whole snapshot.

## Semantic value states

| State                          | Meaning                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `exact(value)`                 | Complete package value; numeric zero remains exact                                     |
| `lowerBound(value, missing[])` | Package value excludes named unavailable contributions                                 |
| `unavailable(evidence)`        | Package returned `null`, metadata was unresolved, or a package call failed             |
| `absent`                       | The conditional concept does not apply; used only for no recognized Mercenary purchase |
| `knownEmpty`                   | A package cost helper returned `[]`; never interchangeable with unavailable            |

Under the released #306 fix, an ordinary selected blueprint returning `knownEmpty` is a regression and blocks
publication as a valid material requirement. Fixed/purchase baselines use explicit non-crafted
states rather than `knownEmpty`.

## RetailCreditsProjection

| Field      | Type                                                                        | Validation                                                                                          |
| ---------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `hull`     | `exact(number) \| unavailable`                                              | Literal package `hull`; no substitute when `null`                                                   |
| `modules`  | `exact(number) \| lowerBound(number, UnpricedCreditEntry[])`                | Literal package `modules`; lower bound iff `unpriced` is non-empty                                  |
| `rebuy`    | `exact(number) \| lowerBound(number, UnpricedCreditEntry[]) \| unavailable` | Literal package `rebuy`; unavailable when `null`; otherwise qualified with the same module evidence |
| `unpriced` | ordered `UnpricedCreditEntry[]`                                             | Exact package order and cardinality                                                                 |

No field represents hull plus modules. `UnpricedCreditEntry` preserves exact `slot` and `symbol` and
may carry resolved package module/slot facts for presentation. Captured purchase value is not a field.

## MercCoinProjection

```text
absent
present {
  entries: MercenaryPurchaseEntry[]
  total: exact(number) | lowerBound(number, MercenaryPurchaseEntry[])
}
```

`MercenaryPurchaseEntry` contains exact `slot`, module `symbol`, variant `blueprint`, purchase
`grade`, current grade where present, and `price: exact(number) | unavailable`. It exists only from a
fitted `preEngineeredVariant` whose acquisition is `mercenary`. `present.entries` is never empty.

Transitions:

- no recognized entries → `absent`, regardless of `mercCoinCost() === 0`;
- first recognized entry → `present`; call the package total once;
- any missing entry price → total becomes `lowerBound` with every missing entry;
- later ordinary grade → purchase identity/price unchanged when the package retains recognition;
- clearing/replacing engineering → follow the new package recognition, possibly returning to absent.

## EngineeringSelectionCost

One fitted selection that can explain a material requirement.

| Field           | Type                                                                           | Rule                                                   |
| --------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `sourceId`      | composite of exact slot + kind + fdname                                        | Stable only within the snapshot; never persisted       |
| `slot`          | package slot key                                                               | Exact action target                                    |
| `moduleSymbol`  | package symbol                                                                 | Never inferred from position                           |
| `kind`          | `blueprint \| experimental`                                                    | Which package helper owns the cost                     |
| `fdname`        | package id                                                                     | Blueprint/effect identity                              |
| `selectedGrade` | `number \| null`                                                               | Blueprint grade; effect uses null                      |
| `baselineGrade` | `number \| null`                                                               | Mercenary purchase grade skipped by the package helper |
| `cost`          | `known(list) \| unavailable \| fixedNotCrafted \| mercenaryPurchaseNotCrafted` | Exact semantic source state                            |

`known(list)` retains the exact package-returned list, including a genuine `[]`. Fixed states do not
manufacture a zero list. Repeated selections remain separate source records.

## EngineeringRequirementsProjection

```text
none { nonCraftedSources[] }
complete { sources[], materials[] }
incomplete { sources[], knownMaterials[], missingSources[] }
unavailable { sources[], evidence[] }
```

- `none`: no crafted blueprint/effect source exists; fixed/purchase sources may explain why.
- `complete`: every crafted source returned a known list; `materials` is the literal `sumMaterials`
  result enriched with metadata and traces.
- `incomplete`: one or more source costs are unavailable; `knownMaterials` is the explicitly
  lower-bound result of `sumMaterials` over only known lists and `missingSources` names every gap.
- `unavailable`: package material metadata or an unexpected package failure prevents an honest row.

## MaterialRequirement

| Field           | Type                               | Rule                                                       |
| --------------- | ---------------------------------- | ---------------------------------------------------------- |
| `symbol`        | package material symbol            | Identity from `sumMaterials()` and `getMaterialBySymbol()` |
| `canonicalName` | package English name               | Never an application translation                           |
| `grade`         | package `MaterialGrade`            | Never derived from icon, category or source recipe         |
| `category`      | package category                   | Optional presentation grouping only; not needed for totals |
| `quantity`      | package `sumMaterials()` count     | Never re-summed locally                                    |
| `contributors`  | non-empty `MaterialContribution[]` | Every known source list containing this symbol             |

`MaterialContribution` retains `sourceId`, slot/module, kind/fdname/grade and the count on that exact
package source-list item. It does not contain a derived percentage or share. Multiple equal selections
remain multiple contributors.

## Presentation-only models

The presenter adds:

- active-locale material/module/blueprint/effect names from Almanac helpers;
- canonical fallback plus an explicit untranslated marker when a helper returns `null`;
- localized application labels, qualifiers, grades, quantities, credits and Merc Coin unit labels;
- accessible action names and associations;
- disclosure state keyed by material symbol.

Formatting never changes domain numbers. Disclosure state is memory-only and omitted from history,
storage, links and exports.
