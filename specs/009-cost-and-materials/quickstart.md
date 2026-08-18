# Quickstart: Validate Cost and Materials

This guide validates the completed capability end to end. It does not replace implementation tasks or
the contracts in [contracts/](./contracts/).

## Prerequisites and release gates

1. Use the repository's Node version and install the committed dependency graph:

   ```bash
   nvm use
   pnpm install --frozen-lockfile
   ```

2. Confirm features 001, 002, 003 and 011 are implemented and their contracts accepted.
3. Confirm [Almanac #306](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/306) is closed
   by a release newer than beta.12, upgrade the pinned package and rerun the minimal reproduction in
   [research.md](./research.md#expanded-cargo-rack--upstream-blocker).

Expected after the fixed release: a stock cargo rack no longer advertises/applies
`CargoRack_IncreasedCapacity` as ordinary free engineering; the two fixed community-goal variants
remain package-identifiable; the distinct Mercenary cargo-rack climbs remain available through their
purchased articles. Stop if this does not hold. Do not add a consumer special case.

## Focused and full commands

```bash
pnpm test -- --include 'src/app/domain/cost-materials/**/*.spec.ts' --include 'src/app/domain/engineering-cost/**/*.spec.ts' --include 'src/app/application/cost-materials/**/*.spec.ts'
pnpm exec playwright test e2e/cost-and-materials.spec.ts
pnpm exec playwright test --list
pnpm run check
```

The Playwright list must include ten projects: Chromium and Firefox at desktop, tablet portrait,
tablet landscape, mobile portrait and mobile landscape. The full gate must run format checking,
strict type checking, production build/budgets, script tests, unit coverage at 80% or above for all
four measures and the complete Playwright matrix without skips or quarantine.

## Scenario 1: exact and lower-bound credits

Open a fully priced active build and compare the three visible values directly with one captured
`retailCredits()` result.

Expected:

- hull, fitted modules and rebuy equal package fields after locale parsing;
- no hull-plus-modules total appears;
- captured source-purchase values do not replace or mix with catalogue retail.

Repeat with one and then every fitted module unpriced. Every package `unpriced` slot/symbol must remain
named, modules and non-null rebuy must be visibly lower bounds, hull must retain its independent state,
and exact-slot actions must open the matching feature 002 target.

## Scenario 2: Mercenary purchases

Fit multiple package-recognized Mercenary articles.

Expected:

- each entry comes from `preEngineeredVariant.acquisition === 'mercenary'` and shows exact slot plus
  the variant's `mercCoinCost`;
- the total equals one `mercCoinCost()` result;
- credits remain in their own group with no conversion/comparison;
- upgrading an article through later ordinary grades does not change its purchase price;
- clearing/replacing engineering follows package recognition;
- a build with no recognized article omits the entire Merc Coin region.

Use an injected contract fixture with a recognized article whose optional price is absent. The entry
must be unavailable and the package total must be a named lower bound, never zero/free.

## Scenario 3: cumulative materials and traceability

Create a build with repeated ordinary blueprints at multiple selected grades, overlapping materials
and experimental effects.

Expected:

- each blueprint source equals `getBlueprintCost(fdname, selectedGrade)`;
- each effect source equals one `getExperimentalEffectCost(fdname)` result;
- every consolidated row equals the literal `sumMaterials(...sourceLists)` result;
- each row shows package material symbol/name/grade/quantity and traces to every exact fitted source;
- repeated equal selections remain separate trace entries before package consolidation;
- no component/test expectation reimplements roll or total arithmetic.

## Scenario 4: fixed, purchase and missing recipes

Validate fixed reward engineering, a Mercenary article at purchase grade, that article at a later
ordinary grade, and injected `null` blueprint/effect cost results.

Expected:

- baked fixed and Mercenary purchase grades contribute no fabricated craft list;
- later Mercenary grades use the purchase grade as the package helper baseline;
- later ordinary effects contribute one package effect cost;
- every missing recipe remains named and unavailable;
- known requirements remain only as an explicitly incomplete lower bound;
- no missing source becomes `[]`, while a genuine helper `[]` remains distinguishable and triggers
  the post-#306 ordinary-empty regression guard.

## Scenario 5: localization and formatting

Switch every shipped locale and exercise one package-localized material plus one active-locale miss.

Expected:

- owned headings, qualifiers, source kinds, accessible names and units use application messages;
- credits, Merc Coin, grades and quantities use the active locale's named formatters;
- Merc Coin and credits have separate translated unit labels, not invented ISO codes;
- the localized material comes from `getMaterialName`;
- the locale miss shows canonical package English with the shared translated untranslated disclosure;
- no raw key, blank label or private material translation appears;
- bundled English fallback works while the context is offline.

## Scenario 6: revisions, performance and offline boundary

Rapidly upgrade/clear engineering, swap modules and replace the active build while observing the
revision marker.

Expected: detail and feature 003 summary always carry one matching current revision; stale work never
publishes. Under mobile Chromium with CDP 4x CPU slowdown, measure in-page from the committed edit to
the matching DOM revision and require at most 100 ms. Firefox runs the same functional journey without
Chromium-only throttling.

After initial load, set the browser context offline and repeat both stories. Monitor requests: there
must be no upload, cross-origin API, runtime translation or asset request. Cost/material projections
must not appear in local storage, history, links, URLs or SLEF.

## Scenario 7: responsive and accessibility matrix

For exact, lower-bound, absent Merc Coin, complete materials, incomplete recipe, untranslated,
metadata-unavailable, pending and error states, test all ten projects and run the shared axe scan.

Also verify manually at 200% text and 400% zoom with expanded/RTL fixtures and reduced motion:

- no document-level horizontal overflow and no lost/truncated content;
- semantic headings and label/value relationships follow the designed reading order;
- qualifiers/unavailable states are associated and not carried by color/icon/position alone;
- trace and exact-slot controls have correct names/state, meet the shared touch target and work by
  touch/pointer;
- a screen reader can complete both primary stories and identify every material's sources;
- initial/unchanged content is silent and each settled change produces at most one polite summary.

Automated success does not waive manual failures. Any conformance statement must name the excluded
keyboard criteria listed in the constitution.
