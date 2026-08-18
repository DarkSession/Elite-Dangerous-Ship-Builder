# Research: Cost and Materials

Research used the accepted specifications, the project constitution, existing feature 001–007/011
plans, `.design/Ship Builder.dc.html`, installed `@elite-dangerous-almanac/core@0.1.1`, and
upstream `main` at `7fbb8054c569d8b0ab2b158e979f914e4916c7ae`. Runtime probes used detached
package `ShipLoadout` values. No application formulas were used.

## One revision-coherent projection

**Decision**: A pure `CostAndMaterialsProjector` accepts one captured `{ loadout, buildRevision }`,
performs all package reads, and returns one deeply immutable snapshot. A signal store publishes that
snapshot atomically only while the active revision still matches. Components receive presentation
models; feature 003 receives an adapter over the identical snapshot.

**Rationale**: Costs and engineering requirements can all change in one edit. Independent component
reads could show a new Merc Coin state beside old materials or relabel stale values with a new build.
The projection is derived and must not be persisted.

**Alternatives considered**: Calling package methods in templates was rejected as untestable and
repeat-prone. Per-card signals were rejected because they allow mixed revisions. Persisting the
snapshot was rejected because it duplicates derived package truth.

## Retail credits and source-purchase separation

**Decision**: Call `ShipLoadout.retailCredits()` once and preserve its `hull`, `modules`, `rebuy` and
ordered `unpriced` entries. Hull is exact or unavailable independently. Non-empty `unpriced`
qualifies modules and any non-null rebuy as lower bounds. Name each unpriced slot from package slot
and module identity; keep the exact symbol when a localized package name is unavailable. Do not add
hull and modules into a consumer total.

Captured `FittedModule.value`/`sourcePurchase` remains source provenance owned by features 001/004.
It is neither a substitute for an unpriced catalogue module nor part of retail presentation.

**Rationale**: The package deliberately supplies separate retail fields and evidence for missing
module prices. It does not return a combined build credit total. Source purchase means what a capture
said was paid, not current catalogue retail.

**Alternatives considered**: Adding hull plus modules, deriving rebuy, using catalogue module `cost`
per slot, or filling missing retail from captured purchase values were rejected as application-owned
price calculations or changed provenance meaning.

## Merc Coin recognition and lower bounds

**Decision**: Enumerate fitted modules in package order and recognize an entry only when
`preEngineeredVariant?.acquisition === 'mercenary'`. Preserve exact slot, symbol, variant identity and
optional `mercCoinCost`. If no entry is recognized, the Merc Coin result is `absent` and its entire
region is omitted. Otherwise call `ShipLoadout.mercCoinCost()` once. The total is exact when every
recognized entry has a price and a lower bound naming every unavailable slot when any price is
missing.

The purchase grade is part of the variant, separate from current ordinary grade. Later ordinary
grades do not change variant `mercCoinCost`. Clearing engineering follows the package's resulting
recognition; the application does not remember a purchase after `preEngineeredVariant` becomes
`null`.

**Rationale**: 0.1.1 owns both fitted recognition and total arithmetic. All 22 current Mercenary
rows carry a positive price, but the public field is optional and the spec requires honest future
missing-price behavior.

**Alternatives considered**: Inferring purchase from module symbol, blueprint spelling, route label
or known catalogue membership was rejected. Summing variant prices locally or showing zero when no
article exists was rejected. Credits conversion/comparison was rejected because the currencies have
no exchange relationship.

## Engineering source classification

**Decision**: Build a list of exact fitted engineering selections before consolidation:

- ordinary current blueprint: `getBlueprintCost(fdname, selectedGrade)`;
- later grade on a recognized Mercenary article:
  `getBlueprintCost(fdname, selectedGrade, purchaseGrade)`;
- selected ordinary experimental effect: one `getExperimentalEffectCost(fdname)`;
- baked recognized fixed blueprint/effect: `fixedNotCrafted`, with no cost call;
- Mercenary purchase grade: `mercenaryPurchaseNotCrafted`, with no cost call;
- missing helper result: `unavailable`, retaining slot, kind, fdname and grade.

The classifier is shared with feature 002's engineering editor. Feature 009 reads only committed
fitted state, never the editor draft. It uses package `preEngineeredVariant` to distinguish fixed
identity from ordinary engineering and never keeps an fdname exception table.

**Rationale**: `getBlueprintCost` already performs cumulative grade-roll weighting, including sparse
grade sets; `getExperimentalEffectCost` is explicitly one application. The fitted package identity
is the only reliable fixed/purchase boundary.

**Alternatives considered**: Looping grades/rolls, pricing fixed identities as ordinary, treating all
pre-engineering as free after a later grade, and using raw modifier signatures were rejected as local
engineering rules.

## Expanded Cargo Rack regression

**Decision**: Consume Almanac 0.1.1's released
[fix for #306](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/306) and retain a
cross-package regression test.

**Evidence**: On 0.1.1, a stock size-5 rack on a default Python reports:

```text
availableBlueprints(slot) -> no CargoRack_IncreasedCapacity route
getBlueprintCost('CargoRack_IncreasedCapacity', 5) -> null
```

The same identity belongs to two fixed `communityGoal` variants with authored modifier blocks.
Package provenance says the upstream source has no components, so the reward remains available only
through the authored fixed variants rather than as ordinary engineering.

**Rationale**: Feature 009 requires that fixed pre-engineering add no craft cost and that ordinary
engineering never silently becomes an empty list. A consumer cannot repair package engineering
availability or decide the missing recipe itself.

**Alternatives considered**: Special-casing the fdname, calling it free, charging the distinct
Mercenary cargo-rack recipe or inventing unavailable locally were rejected. Each would fork package
truth and leave other consumers exposed.

## Consolidation and traceability

**Decision**: Preserve each package-returned source list, then call `sumMaterials(...knownLists)` once.
Every consolidated row comes directly from that result. Join its `symbol` back to each returned
source-list item of the same symbol and retain that item's package count plus exact selection identity.
This produces traces without calculating a share or re-summing quantities.

When every selected source is known, the state is `complete`. When one or more sources are
unavailable, retain the package-consolidated known requirements as an explicitly `incomplete` lower
bound and name every missing source; never label that list complete or replace a missing source with
`[]`. With no crafted selections, the state is `none`; recognized fixed-only selections may accompany
the explanation but do not create a zero-cost material row.

**Rationale**: The package owns total quantities while the UI must explain which fitted selections
supplied them. Retaining inputs makes that relationship observable and keeps repeated identical
selections separate before consolidation.

**Alternatives considered**: A `Map` or reducer summing counts was rejected as reimplementing
`sumMaterials`. Hiding all known requirements after one missing recipe was rejected as unnecessarily
discarding useful package facts. Showing partial requirements without an incomplete qualification was
rejected as misleading.

## Material identity, grade and language

**Decision**: Resolve each consolidated symbol with `getMaterialBySymbol()` from
`materials/materials`; preserve the returned canonical identity and grade. Resolve active-locale text
with `getMaterialName(symbol, locale)`. On `null`, request canonical English through the same helper,
keep it visible and add feature 011's localized untranslated disclosure. A missing material metadata
record makes that row unavailable and is an upstream data gap; grade is never inferred.

Owned labels, quantities, grades, credits and Merc Coin figures use feature 011 messages and named
`Intl`-backed formatters. Credits and Merc Coin use separate translated unit labels rather than
invented ISO currency codes.

**Rationale**: All 106 material symbols currently used in blueprint/effect costs resolve, and all
have English names. The locale helper intentionally returns `null` rather than silently falling back.

**Alternatives considered**: `toLocaleString()` without the active locale, private translations,
using recipe `name` as localized text, inferring grade from icon/color and treating English fallback
as translated were rejected.

## Surface ownership and targets

**Decision**: Add no route. The full detail composes `/build`; feature 003's compact Assembly
Requirements section mirrors classified summaries and targets the detail capability. Unpriced module,
Mercenary entry and engineering-source actions carry exact package slot keys to feature 002. Material
trace expansion is local presentation state keyed by material symbol and is not navigation or build
state.

**Rationale**: Cost/material values describe the current build, and exact game identities must not be
replaced with positions. One snapshot avoids status/detail disagreement.

**Alternatives considered**: A `/costs` route, fragment selection, index-based slot actions and a
second loadout were rejected.

## Responsive, accessible reference adaptation

**Decision**: Retain the reference's semantic order—retail, conditional Merc Coin, materials—and
glanceable wide grouping. At narrow widths and 400% zoom, stack complete semantic label/value groups
and per-material trace disclosures. Every qualifier is textually and programmatically associated;
every exact-slot action meets the shared 44 CSS-pixel target baseline. Coalesce settled changes into
one polite localized summary; initial and unchanged content stay silent.

Reject the reference's combined credit total, authored counts and unit total, top-five truncation,
Merc Coin inside the material card, visual-only grade icons, favorable coloring, hard-coded values and
cross-origin `edassets.org` images.

**Rationale**: Those reference facts are not package results and its desktop table/mobile cards do not
represent unavailable, lower-bound, untranslated or trace states.

**Alternatives considered**: Copying the canvas, horizontal tables on narrow screens, hover-only
details and a compact status rail as the only disclosure location were rejected.

## Validation and performance

**Decision**: Unit tests deep-equal every package input/output and cover exact zero, unavailable,
known-empty, lower-bound, absent, fixed-not-crafted, purchase baseline, repeated sources, missing
recipes and revision cancellation. Playwright covers both stories and every meaningful state in the
ten-project Chromium/Firefox desktop/tablet/mobile portrait/landscape matrix, running axe over each
state plus manual screen-reader checks. Chromium mobile under 4x CPU slowdown must publish the matching
revision within 100 ms, measured in-page.

Run offline after initial load and reject unexpected cross-origin requests. Preserve existing bundle
budgets and the 80% coverage thresholds.

**Rationale**: The current repository has only three Chromium projects, no axe dependency/helper and
no implemented feature 011 UI/i18n layer. Those are prerequisites to close, never requirements to
relax.

**Alternatives considered**: Component snapshots, axe alone, Chromium alone, portrait only, skipped
states, Playwright transport timing and lowering coverage/budgets were rejected.

## Package coverage audit

0.1.1 has 107 blueprint records and 106 cost records with declared-grade coverage for every offered
ordinary route, 86 effects
with matching cost records, 106 referenced material symbols all resolved by the material catalogue,
and 22 Mercenary variants all currently priced. Mercenary recognition and price survive later grades;
clearing engineering removes recognition. No unresolved feature-009 Almanac dependency was found.

No planning ambiguity remains.
