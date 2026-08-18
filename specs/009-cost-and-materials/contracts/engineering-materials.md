# Engineering Materials Contract

## Package imports

- `getBlueprintCost` from `@elite-dangerous-almanac/core/ships/blueprint-costs`;
- `getExperimentalEffectCost` from
  `@elite-dangerous-almanac/core/ships/experimental-effect-costs`;
- `sumMaterials` from `@elite-dangerous-almanac/core/ships/engineering`;
- `getMaterialBySymbol` from `@elite-dangerous-almanac/core/materials/materials`;
- `getMaterialName` from `@elite-dangerous-almanac/core/i18n/materials`.

No application code carries recipe counts, roll multipliers, fixed-article ids, material grades or
game-name translations.

## Source extraction

Walk fitted modules in package order. For each committed engineering selection, create an exact source
record before consolidation:

- ordinary blueprint → `getBlueprintCost(fdname, selectedGrade)`;
- recognized Mercenary later grade →
  `getBlueprintCost(fdname, selectedGrade, purchaseGrade)`;
- ordinary experimental effect → one `getExperimentalEffectCost(fdname)`;
- recognized baked fixed blueprint/effect → `fixedNotCrafted`;
- Mercenary purchase grade → `mercenaryPurchaseNotCrafted`.

The shared feature 002/009 classifier decides these states only from current package
`preEngineeredVariant` and engineering identities. A `null` helper result is unavailable and retains
its exact slot, kind, fdname and grade. `[]` is a distinct known-empty package result. After consuming
the #306 fix, an ordinary known-empty blueprint is a cross-package regression and must not be silently
presented as a free craft.

## Consolidation

Pass every known source list to `sumMaterials()` once per projection. Do not loop grades, multiply
rolls, add material counts, deduplicate or sort before the package call.

- All sources known → `complete` with the literal result.
- Some sources unavailable → `incomplete`; retain the literal consolidation of known lists as a
  visibly qualified lower bound and name all missing sources.
- No crafted source → `none`; fixed/purchase sources may be explained but yield no material row.
- Unexpected helper or metadata failure → `unavailable` for the affected current revision.

For traceability, join each consolidated `symbol` to source-list items with the same package symbol.
Retain their package counts and source identities. This is a relational join, not an arithmetic total.
Every material row has at least one contributor; repeated fitted selections remain repeated traces.

## Metadata and language

Resolve each consolidated symbol through `getMaterialBySymbol()`. Grade, canonical name and optional
category come only from that record. A missing record is an Almanac dependency and cannot be inferred.

The presenter requests `getMaterialName(symbol, activeLocale)`. When it returns `null`, request the
canonical English package name, keep it visible and attach the shared localized untranslated
disclosure. Owned headings, source kinds, qualifiers, grade labels, quantities and accessible names
come from application messages and locale formatters.

## Upstream gate

[Almanac #306](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/306) must be fixed in a
released version. The application must not special-case `CargoRack_IncreasedCapacity`, reinterpret
its empty recipe or replace it with another recipe. A package regression test must prove that a stock
rack no longer exposes/applies that fixed reward as ordinary engineering while fixed variants remain
identifiable and Mercenary climbs remain distinct.

## Verification

Tests cover cumulative grade costs, sparse grades, one effect application, repeated source lists,
shared materials, fixed-only builds, Mercenary baseline/later grade, missing blueprint/effect costs,
known empty versus unavailable, exact contributor traces, missing metadata, localized name/fallback
and the #306 regression. Expected quantities are package values, never hand-computed fixtures.
