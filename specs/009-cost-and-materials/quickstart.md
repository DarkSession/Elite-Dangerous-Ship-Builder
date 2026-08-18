# Quickstart: Validate Cost and Materials

This guide validates the completed capability and its package boundary. It does not contain
implementation code or replace [contracts/](./contracts/) and later `tasks.md`.

## Prerequisites

1. Use the repository toolchain and committed graph:

   ```bash
   nvm use
   pnpm install --frozen-lockfile
   ```

2. Confirm features 001, 002, 003 and 011 are implemented against their accepted contracts:
   active-build revision capture, shared engineering-cost classification/exact-slot actions,
   `AssemblyRequirementsPort`, and shared localization/UI/dual-engine accessibility infrastructure.
3. Confirm the package remains pinned to Almanac 0.1.2 or deliberately re-run every package
   regression before accepting a later release.
4. Confirm `pnpm exec playwright test --list` contains Chromium and Firefox projects for desktop,
   tablet portrait/landscape and mobile portrait/landscape, and the shared axe helper is active.

Stop if the package again offers stock cargo racks
`CargoRack_IncreasedCapacity` as ordinary engineering or its G5 cost is anything other than
`null`. Raise/fix the regression upstream; do not add an application exception.

## Commands

```bash
pnpm exec ng test --include='src/app/domain/cost-materials/**/*.spec.ts' --include='src/app/application/cost-materials/**/*.spec.ts'
pnpm exec playwright test e2e/cost-and-materials.spec.ts
pnpm run check
```

The full gate must perform format checking, strict target type checking, production build/budgets,
script tests, unit coverage at 80% or above for statements/branches/functions/lines, and every
Playwright project without skips or quarantine.

## Scenario 1: exact and lower-bound retail

Open a fully priced active build and compare the three rendered figures to one captured
`retailCredits()` result.

Expected:

- hull, fitted modules and rebuy equal the package's numeric fields after locale parsing;
- all three are separately labelled; no combined hull-plus-modules value is present;
- historical purchase values do not enter state, appear in the interface or fill a missing catalogue
  price.

Repeat with injected/representative builds whose package result contains one and then multiple
`unpriced` records.

Expected: hull remains exact; modules and rebuy remain their literal package values and are labelled
lower bounds; every returned slot/symbol appears in returned order and opens the exact feature-002
slot. There is no nullable hull/rebuy retail state.

## Scenario 2: Mercenary purchase currency

Fit multiple package-recognized Mercenary articles.

Expected:

- every entry comes only from
  `preEngineeredVariant.acquisition === 'mercenary'`;
- each shows exact slot, variant purchase grade and optional variant `mercCoinCost`;
- the total equals one `mercCoinCost()` result;
- credits and craft materials remain separate with no conversion/comparison;
- later purchase-route grades retain the package's current catalogue Merc Coin cost;
- clearing/replacing engineering follows current package recognition;
- no recognized entry omits the whole Mercenary region and Status summary.

Use a contract fixture with a recognized article whose optional price is absent. Its price is
unavailable and the package total is a lower bound naming the affected slot, never zero/free.

## Scenario 3: committed engineering and consolidation

Create a build with repeated ordinary blueprints at several grades, overlapping materials and
experimental effects.

Expected:

- every ordinary blueprint source equals
  `getBlueprintCost(fdname, selectedGrade)`;
- every separately applied effect equals one `getExperimentalEffectCost(fdname)`;
- consolidated order/symbol/name/count equals the literal
  `sumMaterials(...knownSourceLists)` result;
- every row shows package material identity, localized/canonical-disclosed name, grade and quantity;
- each trace names every exact fitted source and preserves repeated equal selections;
- no component or test fixture reimplements grade rolls or material totals.

## Scenario 4: purchase baselines, fixed rewards and missing costs

Validate:

1. a Mercenary article at its purchase grade;
2. the same purchase route at a later grade;
3. a fixed non-Mercenary reward with its baked effect;
4. that reward with a separately selected different effect and with the effect removed;
5. injected `null` blueprint/effect cost results;
6. a genuine helper `[]` contract result.

Expected:

- purchase grade and fixed blueprint/effect are explicit non-crafted states with no recipe call/list;
- later Mercenary grade calls the package blueprint helper above the purchase baseline;
- a changed present effect contributes one package effect cost; baked/removed effect does not;
- every missing recipe retains exact identity and makes known consolidated rows incomplete;
- `null` never becomes `[]`, while a real `[]` stays known empty.

## Scenario 5: contextual editor versus committed build

Open feature 002's Engineer surface and change blueprint/grade/effect drafts without applying.

Expected: contextual package costs update, but committed detail, Status summary, active revision,
storage and URL do not. A successful Apply advances one build revision and both committed surfaces
settle to the same new snapshot. Cancel/refusal/no-op changes neither.

## Scenario 6: metadata, localization and formatting

For each shipped locale, exercise translated package material/name facts, a package locale miss, and
an injected material-metadata miss.

Expected:

- app-owned headings, qualifications, controls, accessible names and units use application messages;
- every number/unit uses active-locale named formatting;
- module/slot/variant/blueprint/effect/material names come from package helpers;
- a locale miss shows canonical package text plus translated untranslated disclosure;
- a metadata miss retains symbol, package-consolidated quantity and trace while name/grade are
  unavailable;
- no raw message key, blank label, private game translation or invented slot label appears;
- bundled English fallback works offline.

## Scenario 7: revision, offline and performance boundaries

Rapidly upgrade/clear engineering, replace modules and replace the active build while exposing test
revision markers.

Expected: detail and feature 003 always match the requested build revision; stale values are never
restamped. Locale switching does not invoke the domain projector. Under mobile Chromium with in-page
4x CPU slowdown measurement, committed revision to matching rendered revision is at most 100 ms;
Firefox runs the same functional journey without Chromium-only instrumentation.

After initial load, set the context offline and repeat both primary stories. Reject unexpected
cross-origin requests. Verify cost snapshots, traces and disclosure state do not occur in local
storage, browser history, URLs, build links or SLEF.

## Scenario 8: responsive and accessibility matrix

Exercise exact retail, unpriced lower bounds, Mercenary absent/present/missing-price, no crafted
materials, complete/repeated materials, missing recipe, untranslated text, metadata gap, trace
expanded/collapsed, integration pending and failure across all ten browser projects. Run the shared
axe scan on every relevant state.

Manually verify 200% text, actual 400% zoom, expanded/RTL text and reduced motion:

- no document-level horizontal overflow, content loss or ambiguous truncation;
- headings, facts, qualifications and evidence follow retail → conditional Mercenary → materials;
- no state/grade/acquisition meaning depends on colour, icon, title or position;
- trace and slot controls expose correct names/state, satisfy target size and work by touch/pointer;
- a screen reader can identify every material's quantity and all contributing fitted selections;
- initial/unchanged/locale-only content is silent and each settled semantic change produces at most
  one polite summary.

Automated success does not waive a manual failure. Any conformance statement must name the keyboard
criteria excluded by the constitution.
