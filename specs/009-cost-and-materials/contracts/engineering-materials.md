# Engineering Materials Contract

## Package boundary

Use only leaf exports:

- `getBlueprintCost` from `@elite-dangerous-almanac/core/ships/blueprint-costs`;
- `getExperimentalEffectCost` from
  `@elite-dangerous-almanac/core/ships/experimental-effect-costs`;
- `sumMaterials` from `@elite-dangerous-almanac/core/ships/engineering`;
- `getMaterialBySymbol` from `@elite-dangerous-almanac/core/materials/materials`;
- `getMaterialName` from `@elite-dangerous-almanac/core/i18n/materials`;
- package leaf name helpers for modules, slots, variants, blueprints and effects.

No application data contains recipes, roll multipliers, fixed/Mercenary identity lists, material
grades or game-name translations.

## Committed source extraction

Walk the captured fitted-module snapshots in their package order. A fitted engineering identity comes
only from `FittedModule.engineering`; a fixed/purchase identity comes only from
`FittedModule.preEngineeredVariant`.

For each committed selection:

1. No recognized variant: call
   `getBlueprintCost(BlueprintName, Level)`.
2. Recognized Mercenary and `Level === variant.grade`: classify the purchase baseline as
   `mercenaryPurchaseNotCrafted`; do not call a blueprint cost helper.
3. Recognized Mercenary and `Level > variant.grade`: call
   `getBlueprintCost(BlueprintName, Level, variant.grade)`.
4. Recognized non-Mercenary variant: classify its baked blueprint as `fixedNotCrafted`.
5. If the current `ExperimentalEffect` equals `variant.experimental`, classify it as baked
   `fixedNotCrafted`.
6. If a current effect is present and differs from `variant.experimental`, call
   `getExperimentalEffectCost(currentEffect)` once for that source.
7. An absent/removed effect contributes no source and no cost.

A helper `null` becomes an unavailable source retaining exact slot, module, kind, fdname and grade.
A returned `[]` remains a known empty package result. Feature 009's normal committed call shapes
should not produce an empty blueprint climb, but the public helper does legitimately return `[]`
when a caller's baseline is already at/above target; do not globally redefine that package result as
a defect.

This classification reuses feature 002's accepted framework-agnostic cost boundary. Feature 009 does
not maintain a second fdname/acquisition classifier.

## Consolidation and traceability

Pass every known source list to `sumMaterials(...knownLists)` once per projection. Preserve its
literal first-seen order, symbols, names and counts. Do not loop grades, multiply rolls, add counts,
deduplicate or sort before/after the package call.

- Every crafted source known → `complete`.
- One or more source costs unavailable → `incomplete`; consolidate known lists and qualify the
  result as a lower bound naming every missing source.
- No crafted sources → `none`; fixed/purchase explanations may remain but create no material row.
- Unexpected package/integration exception → current-revision projection `failure`.

For each consolidated row, case-insensitively join its symbol to every matching item in the retained
source lists. Preserve each item's package count and source identity. This trace is relational
evidence only: it never derives totals, percentages or allocations. Every consolidated row must have
at least one contributor and repeated fitted selections remain repeated traces.

## Metadata and language

Resolve each consolidated symbol through `getMaterialBySymbol()`. The returned record alone supplies
canonical identity/name, grade, category and line. If metadata is absent, keep the consolidated
symbol, quantity and trace visible while marking name/grade unavailable and raising an upstream data
gap; do not infer any field.

The presenter requests `getMaterialName(symbol, activeLocale)`. On `null`, it follows feature
011's package-English/canonical fallback and attaches the shared visible/programmatic untranslated
disclosure. Owned headings, source-kind labels, qualifications, quantities and accessible names use
application localization and named formatters.

## Pinned package regression

Almanac 0.1.3 reports no ordinary stock cargo-rack route for
`CargoRack_IncreasedCapacity` and `getBlueprintCost(..., 5)` returns `null`, while the authored
fixed variants remain package-identifiable. Cross-package tests pin that boundary. The application
must not special-case the fdname, call it free, or substitute another recipe.

## Verification

Tests cover ordinary cumulative climbs, sparse grades, Mercenary purchase baseline and later grade,
fixed blueprint/effect, changed and removed effects, one-application effect costs, repeated and
shared materials, source `null` versus `[]`, incomplete consolidation, first-seen order,
case-insensitive traces, missing metadata, locale fallback and the cargo-rack regression. Quantities
are deep-equal to package outputs.
