# Research: Cost and Materials

Research re-read the accepted feature spec and constitution, the feature 001/002/011 interfaces,
the current source/configuration, `.design/Ship Builder.dc.html`, and the installed
`@elite-dangerous-almanac/core` declarations and runtime data. Package probes are regression
evidence only; no application rule depends on catalogue counts.

> **Superseded in part by the wave 10 ruling** ([design/reference-review.md](./design/reference-review.md)).
> Six spec-versus-canvas collisions were surfaced to the user and the design won all six. Decisions
> 1, 3, 4, 6, 8, 9 and 10 below are amended accordingly; each amendment is marked inline. The
> rationale text is kept because it still records _why_ the alternative was once preferred, which is
> worth having when the ruling is revisited.

> **Reconciled with Almanac 0.1.6 on 2026-08-23.** The package replaced the separate retail and Merc
> Coin queries with one `ShipLoadout.buildCost()` result containing four credit fields, Merc Coin
> and consolidated materials. That result supersedes the operative parts of Decisions 1, 4 and 6:
> the application now reads it once, derives no `TOTAL`, performs no Merc Coin recognition and does
> no material consolidation. Historical rationale below remains a record of the 0.1.5 contract.

## Decision 1: preserve the package credit result

**Decision** _(amended for Almanac 0.1.6)_: Call `ShipLoadout.buildCost()` once and preserve
`credits.hull`, `credits.modules`, `credits.total` and `credits.rebuy`. Label the rebuy `REBUY 5%`
with the canvas's fixed text (ruling B) without deriving the percentage from the number. Do not
project `unpriced` (ruling F).

**Rationale**: In the installed package all three fields are non-nullable numbers. The earlier plan's nullable hull
and rebuy states contradicted the installed public API. A valid `ShipLoadout` already has a known
catalogue hull; construction/projection failure is separate from retail-field semantics.

**Alternatives considered**: Nullable retail fields, calculating five percent locally, sorting
`unpriced`, or reading each module's catalogue cost independently were rejected because they change
or duplicate the package contract. Summing hull and modules was also rejected here and has since
been **ruled in** — it is the canvas's anchor row, and addition over two package results owns no
game rule. Under Almanac 0.1.6 that temporary application sum is retired because `credits.total` is
the package answer.

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

**Decision** _(amended, wave 10)_: A pure projector accepts the active loadout, reads fitted modules
once, performs the package cost calls, and returns one immutable result. **The revision key, the
store/cache and the feature 003 adapter are withdrawn** (ruling F): with one consumer there is no
second surface to disagree with, so there is no coherence problem to solve and nothing for a cache
to key. The component reads the projection through a computed signal, and the signal graph memoizes
it. Locale changes rebuild presentation only.

**Rationale** _(as originally written; the premise no longer holds)_: A single edit may change
retail evidence, Mercenary recognition and multiple material sources. Independent component calls
can display a mixed revision even when every individual number is correct. That risk was real when
detail and a Status summary were two surfaces; with one surface it cannot arise. Package work is synchronous, so the normal settled state need not invent asynchronous
loading; pending is reserved for the owning integration boundary when a requested context is not yet
available.

**Alternatives considered**: Template calls, independent per-card signals, a second `ShipLoadout`,
and persisted derived snapshots were rejected as hard to test, stale-prone or duplicative.

## Decision 4: recognize and price Mercenary purchases through the package

**Decision** _(amended for Almanac 0.1.6)_: Read `buildCost().mercCoins`. Display the literal number
when greater than zero and omit the row when zero. Do not infer applicability from module or
engineering identity.

_Amended, wave 10_: **per-slot Merc Coin pricing, purchase grade and current grade are not projected**
(ruling C). The canvas draws one `Merc Coins` row at the foot of `MATERIALS`, so the projection is a
single optional number and there is no per-entry price to be missing.

**Historical rationale (Almanac 0.1.5)**: `mercCoinCost()` returns zero both for no recognized article and, prospectively, for a
recognized article whose optional price is missing from the variant. Entry recognition is therefore
the applicability boundary. All installed Mercenary variants are priced, but the public optional
field and FR-005 require the missing-price state.

**Historical alternatives considered (Almanac 0.1.5)**: Symbol/blueprint allowlists, total-nonzero recognition, summing variant
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

## Decision 6: preserve package-consolidated materials

**Decision** _(amended for Almanac 0.1.6)_: Preserve `buildCost().materials` order, identities and
quantities. The per-row contributor trace remains withdrawn (ruling F).

A source the package cannot cost contributes nothing and is not named; a source that costs `[]`
contributes nothing either. When nothing contributes, the whole materials block is absent rather
than showing a `none` explanation. **Three counts are added** (ruling D): contributing modules,
consolidated rows, and the sum of the package counts.

**Historical rationale (Almanac 0.1.5)**: `sumMaterials()` is the only _package-rule_ arithmetic and itself matches symbols
case-insensitively. The three ruled counts are counting over its output, not a second opinion about
what anything costs.

**Alternatives considered**: A local reducer/Map, sorting the consolidated list, hiding all known
materials after one missing recipe, or presenting a partial list without a qualification were
rejected.

## Decision 7: resolve metadata and language without private game text

**Decision** _(amended, wave 10)_: Resolve each consolidated symbol's rarity through feature 002's
`materialRarity()`, which owns `getMaterialBySymbol()`. Resolve display text through feature 011's
game-text presenter, which owns `getMaterialName(symbol, activeLocale)` and the canonical-text
fallback with its untranslated disclosure — the same path feature 002's material rows already take.

A `null` rarity simply draws no marker. **The visible metadata-gap wording is withdrawn** (ruling F).
**Slot, module, variant, blueprint and effect names are no longer needed at all**, because the
withdrawn trace and evidence list were the only things that showed them.

Application labels and numeric formatting use feature 011.

**Rationale**: Recipe `EngineeringMaterial.name` is canonical source text, not active-locale text,
and grade belongs to the material catalogue. The package locale helper intentionally returns `null`
instead of silently falling back.

**Alternatives considered**: Private material translations, locale-implicit `toLocaleString()`,
recipe-name localization, grade inference from icons/color and invented slot labels were rejected.

## Decision 8: adapt the reference at two information levels

**Decision** _(amended, wave 10)_: Feature 002 already owns the contextual per-selection cost beside
the Engineer editor and ships it. Feature 009 owns only the build-level `COST` and `MATERIALS`
blocks in canvas 1c's rail and canvas 1d's Status stack. No route is added, and there is no second
information level for this feature to build.

The delivered order is `COST` then `MATERIALS`, with the Merc Coin row last (ruling C). Wide layout
places both in the rail; narrow, landscape, 200% text and 400% zoom use one semantic stack.

**Rationale**: The references communicate useful proximity. They contain no tablet/intermediate
design, so breakpoint behaviour is decided from content. What the original rationale called
"happy-path mock values" is, under the ruling, simply the specification of what these blocks show.

**Alternatives considered**: Copying the canvases, a separate costs route, making Status the only
detail, horizontal mobile tables, hover/title-only acquisition, or an unverified Merc Coin image
dependency were rejected.

## Decision 9: reject unsupported reference calculations and assets

**Decision** _(largely reversed, wave 10)_. The reference treatments now split in two.

**Built as drawn**, by ruling: the package's combined credit `TOTAL` (A), the `REBUY 5%` label (B),
the blueprint/type/unit aggregates (D) and Merc Coin as a row inside the materials block (C).

**Still rejected**, on constitutional rather than specification grounds: remote `edassets.org`
material-grade SVGs and Google Fonts requests (constitution I forbids cross-origin runtime
requests), the `Mcr` abbreviation (not locale-safe), `.design/assets/merc-coin.png` (no accepted
provenance decision), and hard-coded values or literal styles (one design system). Top-five material
truncation is also still rejected, by ruling E — the list is complete.

**Rationale**: The original rationale conflated two different objections. "Violates the package
boundary" was a specification judgement the user has now overruled; "depends on another origin" and
"fails localization" are constitutional and stand.

## Decision 10: validate package equality, revision coherence and every state

**Decision** _(amended, wave 10)_: Unit/contract tests compare every quantity to direct package
results and cover retail, `total` as the package sum, Merc absence and presence, purchase baseline
and later grades, baked and separate effects, repeated sources, a source that costs `[]` versus one
that is `unavailable`, the three ruled counts and an absent materials block. Cross-package
regression tests characterize the installed package's Expanded Cargo Rack behaviour without a
consumer special-case. Playwright covers both stories across the feature-011 ten-project
Chromium/Firefox matrix with axe, manual screen-reader/zoom/text-expansion checks and offline
request monitoring, plus a design-fidelity assertion that no undrawn control or state text exists.

The stale-revision, mixed-revision and 100 ms settled-render measures are withdrawn with the store
(ruling F).

**Rationale**: The active-build, UI, localization and complete browser/accessibility foundations are
explicit prerequisites, not reasons to weaken the required gate.

**Alternatives considered**: Hand-computed expected quantities, snapshots alone, Chromium-only or
portrait-only coverage, axe as a complete accessibility proof, and lowering/skipping existing gates
were rejected.

## Package audit and resolved unknowns

The package audit covers every installed blueprint mechanic, cost key, effect, recipe-referenced
material and Mercenary variant. The costless Expanded Cargo Rack identity returns `null` and is not
an ordinary stock-module route; every recipe-referenced material resolves, and every installed
Mercenary variant currently has a price.

No planning clarification or direct feature-009 Almanac blocker remains. Repository implementation
depends on features 001, 002 and 011, all of which are present. Feature 003 is no longer a
dependency (ruling F).
