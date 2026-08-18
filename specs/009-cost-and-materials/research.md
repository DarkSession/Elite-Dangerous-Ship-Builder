# Research: Cost and Materials

Research re-read the accepted feature spec and constitution, the planned feature 001/002/003/011
interfaces, the current source/configuration, `.design/Ship Builder.dc.html`, and the installed
`@elite-dangerous-almanac/core@0.1.2` declarations and runtime data. Package counts below are
regression evidence only; no application rule depends on them.

## Decision 1: preserve the numeric `RetailCredits` contract

**Decision**: Call `ShipLoadout.retailCredits()` once and preserve its numeric `hull`, `modules` and
`rebuy` plus its returned `unpriced` sequence. Hull is exact. Modules and rebuy are exact when
`unpriced` is empty and lower bounds naming every returned entry otherwise. Do not create a combined
hull-plus-modules value or repeat the package's rebuy calculation.

**Rationale**: In 0.1.2 all three fields are non-nullable numbers. The earlier plan's nullable hull
and rebuy states contradicted the installed public API. A valid `ShipLoadout` already has a known
catalogue hull; construction/projection failure is separate from retail-field semantics.

**Alternatives considered**: Nullable retail fields, summing hull and modules, calculating five
percent locally, sorting `unpriced`, or reading each module's catalogue cost independently were
rejected because they change or duplicate the package contract.

## Decision 2: discard historical purchase values

**Decision**: Never use `ShipLoadout.sourcePurchase`, a fitted module's captured `value`, or feature
004 input fields to fill an unpriced retail entry. No capability presents or retains these historical
values; they are absent from the application model.

**Rationale**: The builder answers what the current fitted configuration costs at current package
catalogue retail. What one source Commander paid is neither a build characteristic nor a useful
fallback for an unpriced current article.

**Alternatives considered**: Historical-price presentation, fallback pricing and a blended
purchase/retail total were rejected as both misleading and contrary to FR-003.

## Decision 3: create one revision-coherent projection

**Decision**: A pure projector accepts one captured `{ loadout, buildRevision }`, reads fitted
modules once, performs the package cost calls, and returns one immutable snapshot. A revision-keyed
store/cache publishes it only for the requested active revision. Detail and feature 003 adapt that
same value. Locale changes rebuild presentation only.

**Rationale**: A single edit may change retail evidence, Mercenary recognition and multiple material
sources. Independent component calls can display a mixed revision even when every individual number
is correct. Package work is synchronous, so the normal settled state need not invent asynchronous
loading; pending is reserved for the owning integration boundary when a requested context is not yet
available.

**Alternatives considered**: Template calls, independent per-card signals, a second `ShipLoadout`,
and persisted derived snapshots were rejected as hard to test, stale-prone or duplicative.

## Decision 4: recognize and price Mercenary purchases through the package

**Decision**: Recognize an entry only when
`fitted.preEngineeredVariant?.acquisition === 'mercenary'`. Preserve its exact slot, module symbol,
variant identity, purchase grade and optional `mercCoinCost`. With no recognized entries, return
`absent` and do not call or display a zero total. Otherwise call `ShipLoadout.mercCoinCost()` once.
The literal total is exact when every entry is priced and a lower bound naming every missing-price
entry otherwise.

**Rationale**: `mercCoinCost()` returns zero both for no recognized article and, prospectively, for a
recognized article whose optional price is missing from the variant. Entry recognition is therefore
the applicability boundary. Current 0.1.2 data has 22 Mercenary variants and all are priced, but the
public optional field and FR-005 require the future missing-price state.

**Alternatives considered**: Symbol/blueprint allowlists, total-nonzero recognition, summing variant
prices, remembering purchase identity after the package loses it, and converting/comparing Merc Coin
with credits were rejected.

## Decision 5: classify committed engineering before recipe calls

**Decision**: Reuse feature 002's framework-agnostic engineering-cost boundary and produce exact
committed source records:

- no recognized variant: `getBlueprintCost(BlueprintName, Level)`;
- recognized Mercenary at its purchase grade: `mercenaryPurchaseNotCrafted`, with no cost lookup;
- recognized Mercenary above purchase grade:
  `getBlueprintCost(BlueprintName, Level, variant.grade)`;
- recognized non-Mercenary fixed blueprint: `fixedNotCrafted`;
- current effect equal to the recognized variant's baked effect: `fixedNotCrafted`;
- a current effect different from the baked effect: one
  `getExperimentalEffectCost(ExperimentalEffect)` call;
- absent/removed effect: no source.

A `null` helper result is unavailable and keeps the exact slot/kind/fdname/grade. A returned `[]` is
known empty and is not recast as `null`.

**Rationale**: Every Mercenary record currently arrives at grade 1 and its purchase-route recipe
starts at grade 2, so calling `getBlueprintCost(fdname, 1)` would deliberately return `null`. The
purchase baseline must be classified first. Fixed reward identity can survive effect-only edits;
comparing the current effect with the variant's baked effect distinguishes the free baked state from
a separately applied one-application cost. `getBlueprintCost` owns cumulative rolls and sparse
grades.

**Alternatives considered**: Calling all blueprints from grade zero, calling a Merc purchase-grade
recipe, treating all pre-engineered articles as forever free, looping grades/rolls, or keeping a local
fixed-fdname table were rejected.

## Decision 6: consolidate only with `sumMaterials()` and retain traces

**Decision**: Keep each known package-returned source list, pass all known lists to
`sumMaterials()` once, and preserve its first-seen output order and values. Join each consolidated
row back to every source-list item with the same case-insensitive package symbol; retain the source
item's package count and exact selection identity. The join never derives a share or total.

If every selected crafted source is known, requirements are complete. If one or more costs are
unavailable, retain the consolidation of known lists as an explicitly incomplete lower bound and
name every missing source. With no crafted source, return `none`; fixed and purchase baselines may be
explained but do not manufacture empty material rows.

**Rationale**: `sumMaterials()` is the only allowed arithmetic and itself matches symbols
case-insensitively. Keeping inputs makes SC-003 observable and preserves repeated selections before
consolidation.

**Alternatives considered**: A local reducer/Map, sorting the consolidated list, hiding all known
materials after one missing recipe, or presenting a partial list without a qualification were
rejected.

## Decision 7: resolve metadata and language without private game text

**Decision**: Resolve every consolidated symbol through `getMaterialBySymbol()` for canonical
identity, name, grade, category and line. Resolve display text with `getMaterialName(symbol,
activeLocale)`. On a locale miss, use package English/canonical text and feature 011's visible and
programmatic untranslated disclosure. If metadata is missing, preserve the package quantity,
symbol and trace but mark name/grade metadata unavailable; never infer it.

Application labels and numeric/unit formatting use feature 011. Slot labels are obtained by joining
the exact key to the captured `loadout.slots()` record before calling the package slot-name helper;
if no slot record exists, the exact raw key remains visible. Module, variant, blueprint and effect
names use their package leaf helpers.

**Rationale**: Recipe `EngineeringMaterial.name` is canonical source text, not active-locale text,
and grade belongs to the material catalogue. The package locale helper intentionally returns `null`
instead of silently falling back.

**Alternatives considered**: Private material translations, locale-implicit `toLocaleString()`,
recipe-name localization, grade inference from icons/color and invented slot labels were rejected.

## Decision 8: adapt the reference at two information levels

**Decision**: Retain canvas 1c's contextual engineering cost beside the editor and build-level
cost/material rail, plus canvas 1d's full-screen Engineer and stacked Status hierarchy. Feature 002
owns draft/current-selection cost interaction through the shared classifier; feature 009 owns the
committed whole-build detail and feature 003 summary adapter. No route is added.

The delivered order is retail credits, conditional Mercenary purchases, then the complete
consolidated material list and traces. Wide layout may group independent regions; narrow, landscape,
200% text and 400% zoom use one semantic stack without dropping evidence.

**Rationale**: The references communicate useful proximity and progressive disclosure but only show
happy-path mock values. They contain no tablet/intermediate design and do not cover required
unavailable/lower-bound/trace states.

**Alternatives considered**: Copying the canvases, a separate costs route, making Status the only
detail, horizontal mobile tables, hover/title-only acquisition, or an unverified Merc Coin image
dependency were rejected.

## Decision 9: reject unsupported reference calculations and assets

**Decision**: Do not implement the reference's combined credit `TOTAL`, `REBUY 5%` derivation,
blueprint/type/unit aggregates, top-five material truncation, `Mcr` abbreviation, Merc Coin inside a
materials card, remote material-grade SVGs, Google Fonts requests, hard-coded values or literal
styles. An approved same-origin Merc Coin ornament may supplement explicit text later, but no
feature behavior depends on it.

**Rationale**: These treatments either violate the package boundary, merge distinct concepts,
truncate the specified list, depend on another origin, or fail localization/accessibility.

**Alternatives considered**: Treating mock totals/counts as presentational arithmetic and copying the
PNG without a provenance decision were rejected.

## Decision 10: validate package equality, revision coherence and every state

**Decision**: Unit/contract tests compare every quantity to direct package results and cover priced
and unpriced retail, Merc absence/presence/missing price, purchase baseline/later grades, baked and
separate effects, repeated sources, `null` versus `[]`, metadata miss and stale-revision rejection.
Cross-package regression tests pin the 0.1.2 Expanded Cargo Rack behavior without a consumer
special-case. Playwright covers both stories and all meaningful states across the feature-011
ten-project Chromium/Firefox matrix with axe, manual screen-reader/zoom/text-expansion checks,
offline request monitoring and the 100 ms in-page performance measure.

**Rationale**: The current repository has only three Chromium portrait projects, no axe dependency,
and no implemented active-build/UI/localization foundations. Those are explicit prerequisites, not
reasons to weaken the required gate.

**Alternatives considered**: Hand-computed expected quantities, snapshots alone, Chromium-only or
portrait-only coverage, axe as a complete accessibility proof, and lowering/skipping existing gates
were rejected.

## Package audit and resolved unknowns

Pinned 0.1.2 contains 107 blueprint mechanics identities and 106 cost keys; the costless Expanded
Cargo Rack identity returns `null` and is not an ordinary stock-module route. It also contains 86
effect identities with 86 cost keys, 106 distinct recipe-referenced material symbols that all resolve
within the 146-material catalogue, and 22 Mercenary variants whose prices are currently present.

No planning clarification or direct feature-009 Almanac blocker remains. Repository implementation
still depends on features 001, 002, 003 and 011 as recorded in [plan.md](./plan.md).
