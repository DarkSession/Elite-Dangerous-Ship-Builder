# Data Model: Cost and Materials

These are immutable, in-memory projections of one package `ShipLoadout`, not persistence schemas.
Game identities remain exact package slot keys, module/material `symbol` values and blueprint/effect
`fdname` values. Formatted numbers and localized application text are presentation-only.

## CostAndMaterialsSnapshot

| Field           | Type                                | Rule                                                    |
| --------------- | ----------------------------------- | ------------------------------------------------------- |
| `buildRevision` | opaque active-build revision        | Matches the captured loadout for every child value      |
| `retail`        | `RetailCreditsProjection`           | One literal `retailCredits()` result plus qualification |
| `mercenary`     | `MercenaryProjection`               | Conditional recognized purchases and package total      |
| `engineering`   | `EngineeringRequirementsProjection` | Exact sources, package consolidation and traces         |

The whole snapshot is published atomically. A build revision invalidates the whole value. A locale
change re-presents the same domain snapshot and does not trigger package quantity calls.

## Shared semantic states

```text
Exact<T>      = { kind: 'exact'; value: T }
LowerBound<T, E> = { kind: 'lowerBound'; value: T; missing: readonly E[] }
Unavailable<E>  = { kind: 'unavailable'; evidence: E }
```

Numeric zero remains an exact value. `unavailable` represents a package `null` or unresolved package
metadata, not zero or an empty list. Conditional `absent` is used only where the concept does not
apply. Package-returned `[]` is a known empty list and remains distinct from `null`.

## RetailCreditsProjection

| Field      | Type                                                       | Validation                                            |
| ---------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| `hull`     | `Exact<number>`                                            | Literal non-null package `hull`                       |
| `modules`  | `Exact<number> \| LowerBound<number, UnpricedCreditEntry>` | Lower bound iff `unpriced` is non-empty               |
| `rebuy`    | `Exact<number> \| LowerBound<number, UnpricedCreditEntry>` | Literal package `rebuy`; same missing-module evidence |
| `unpriced` | ordered `UnpricedCreditEntry[]`                            | Exact returned order and cardinality                  |

`UnpricedCreditEntry` preserves package `slot` and module `symbol`. It may reference a matching
captured `LoadoutSlot`/module record for later package-name presentation, but the raw identities are
always retained. There is no nullable retail hull/rebuy field, combined credit total, captured
purchase value or consumer-derived percentage.

## MercenaryProjection

```text
{ kind: 'absent' }

{ kind: 'present';
  entries: readonly MercenaryPurchaseEntry[]; // non-empty
  total: Exact<number> | LowerBound<number, MercenaryPurchaseEntry> }
```

`MercenaryPurchaseEntry` exists only for a fitted module whose package
`preEngineeredVariant.acquisition` is `mercenary`.

| Field           | Type                                                  | Rule                                     |
| --------------- | ----------------------------------------------------- | ---------------------------------------- |
| `slot`          | package slot key                                      | Exact action identity                    |
| `moduleSymbol`  | package module symbol                                 | Exact fitted identity                    |
| `variant`       | package `PreEngineeredVariant` identity               | Source of recognition and purchase facts |
| `purchaseGrade` | number                                                | Package variant grade                    |
| `currentGrade`  | number                                                | Fitted engineering level                 |
| `price`         | `Exact<number> \| Unavailable<'missingPackagePrice'>` | Optional variant `mercCoinCost`          |

Transitions follow the current package snapshot:

- zero recognized entries → `absent`, regardless of `mercCoinCost() === 0`;
- first recognized entry → `present` and one package total call;
- any missing entry price → the literal package total is a lower bound naming all missing entries;
- a later purchase-route grade retains the original variant price;
- clearing/replacing engineering may remove recognition and return to `absent`.

## EngineeringSelectionSource

One committed fitted selection that either contributes a package cost list or explains why it does
not.

| Field           | Type                        | Rule                                     |
| --------------- | --------------------------- | ---------------------------------------- |
| `sourceId`      | exact slot + kind + fdname  | Snapshot-local stable identity           |
| `slot`          | package slot key            | Exact feature-002 target                 |
| `moduleSymbol`  | package symbol              | Never inferred from position             |
| `kind`          | `blueprint \| experimental` | Package helper ownership                 |
| `fdname`        | package id                  | Blueprint/effect identity                |
| `selectedGrade` | `number \| null`            | Blueprint current grade; null for effect |
| `baselineGrade` | `number \| null`            | Mercenary purchase grade only            |
| `cost`          | `EngineeringSourceCost`     | Classification below                     |

```text
EngineeringSourceCost =
  | { kind: 'known'; materials: readonly EngineeringMaterial[] }
  | { kind: 'unavailable'; reason: 'missingBlueprintCost' | 'missingEffectCost' }
  | { kind: 'fixedNotCrafted' }
  | { kind: 'mercenaryPurchaseNotCrafted' }
```

`known.materials` retains the exact helper list, including `[]`. Repeated selections remain separate
records. A Mercenary source at purchase grade is classified before any blueprint lookup; later grades
use `baselineGrade`. A current effect matching a variant's baked effect is fixed, while a different
current effect is a separately costed source.

## EngineeringRequirementsProjection

```text
{ kind: 'none'; nonCraftedSources: readonly EngineeringSelectionSource[] }

{ kind: 'complete';
  sources: readonly EngineeringSelectionSource[];
  materials: readonly MaterialRequirement[];
  metadataGaps: readonly MaterialMetadataGap[] }

{ kind: 'incomplete';
  sources: readonly EngineeringSelectionSource[];
  knownMaterials: readonly MaterialRequirement[];
  missingSources: readonly EngineeringSelectionSource[];
  metadataGaps: readonly MaterialMetadataGap[] }

{ kind: 'failure'; evidence: ProjectionFailure }
```

- `none`: no crafted source exists; fixed/purchase sources may explain why.
- `complete`: every crafted cost is known; rows preserve literal `sumMaterials()` order/quantity.
- `incomplete`: one or more source costs are unavailable; `knownMaterials` is visibly a lower bound
  obtained by passing only known lists to `sumMaterials()`.
- `failure`: an unexpected package/integration failure prevents a current-revision projection; stale
  data is not relabelled current.

`metadataGaps` qualify affected rows without discarding their known package quantity, symbol or
trace.

## MaterialRequirement

| Field          | Type                                | Rule                                    |
| -------------- | ----------------------------------- | --------------------------------------- |
| `symbol`       | package material symbol             | Literal `sumMaterials()` identity/order |
| `quantity`     | number                              | Literal `sumMaterials()` count          |
| `metadata`     | `resolved(Material) \| unavailable` | Only `getMaterialBySymbol()`            |
| `contributors` | non-empty `MaterialContribution[]`  | Every source list containing the symbol |

Resolved package `Material` supplies canonical name, canonical symbol, grade, category and line.
`MaterialContribution` retains source id, exact slot/module, kind/fdname/grade and the count on that
source-list item. Contributor matching is case-insensitive like `sumMaterials`; contributors are a
relational trace, not an arithmetic breakdown or percentage.

## Presentation-only models

The presenter adds:

- package-localized module, slot, variant, blueprint, effect and material names;
- canonical package English plus explicit untranslated disclosure on locale miss;
- localized application headings, state/evidence wording and accessible action names;
- active-locale number, credit, Merc Coin, quantity and grade/unit formatting;
- expanded/collapsed material trace state keyed by material symbol.

Slot labels require joining the exact key back to the captured package `LoadoutSlot`; if it cannot be
joined, the raw key remains visible. Formatting never changes numbers. Presentation/disclosure state
is memory-only and excluded from history, persistence, URLs, links and exports.
