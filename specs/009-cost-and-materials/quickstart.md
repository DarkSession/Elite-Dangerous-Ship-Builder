# Quickstart: Validate Cost and Materials

This guide validates the completed capability and its package boundary. It does not contain
implementation code or replace [contracts/](./contracts/) and [tasks.md](./tasks.md).

Binding ruling: [design/reference-review.md](./design/reference-review.md), wave 10. The scenarios
below validate what canvases 1c and 1d draw. States the canvas does not draw are not built, and
their scenarios are withdrawn — see "Withdrawn scenarios" at the end.

## Prerequisites

1. Use the repository toolchain and committed graph:

   ```bash
   nvm use
   pnpm install --frozen-lockfile
   ```

2. Confirm features 001, 002 and 011 are implemented against their accepted contracts: the active
   build and `/build` workspace, `engineeringCost()` / `materialRarity()` / `edsb-material-grade`,
   and shared localization/UI/dual-engine accessibility infrastructure. Feature 003 is **not**
   required.
3. Confirm the Almanac resolves from the committed lockfile and rerun every package-contract
   regression after an upgrade.
4. Confirm `pnpm exec playwright test --list` contains Chromium and Firefox projects for desktop,
   tablet portrait/landscape and mobile portrait/landscape, and the shared axe helper is active.

Stop if the package again offers stock cargo racks `CargoRack_IncreasedCapacity` as ordinary
engineering or its G5 cost is anything other than `null`. Raise/fix the regression upstream; do not
add an application exception.

## Commands

```bash
pnpm exec ng test --include='src/app/domain/ships/cost-materials/**/*.spec.ts'
pnpm exec playwright test e2e/cost-and-materials.spec.ts
pnpm run check
```

The full gate must perform format checking, strict target type checking, production build/budgets,
script tests, unit coverage at 80% or above for statements/branches/functions/lines, and every
Playwright project without skips or quarantine.

## Scenario 1: the COST block

Open an active build and compare the four rendered rows to one captured `buildCost().credits`
result.

Expected:

- Hull and Modules equal the package's numeric fields after locale parsing;
- `TOTAL` equals the package `total` field;
- the rebuy row shows the package's `rebuy`, labelled `REBUY 5%` with fixed canvas text;
- the four rows appear in canvas order: Hull, Modules, `TOTAL`, `REBUY 5%`;
- historical purchase values do not enter state or appear in the interface.

Repeat with a build whose package result contains `unpriced` records. Expected: the figures are the
package's, and nothing about the unpriced modules is drawn — no evidence list, no qualification, no
slot action. This silence is ruled (F) and is what the canvas draws.

## Scenario 2: the Merc Coin row

Create builds whose package `buildCost().mercCoins` result is zero and non-zero.

Expected:

- applicability comes only from the package total, never application inspection of identities;
- one `Merc Coins` row appears as the last row of the materials block, carrying the literal
  `buildCost().mercCoins` result;
- the figure is excluded from the material-type and unit counts;
- credits and Merc Coin are never summed, converted or compared;
- later purchase-route grades retain the package's current catalogue Merc Coin cost.

With a zero package total, the row is absent and no zero appears in its place. Clear, replace or
change engineering until the total returns to zero and confirm the row disappears with no retained
purchase history.

## Scenario 3: the MATERIALS block

Create a build with repeated ordinary blueprints at several grades, overlapping materials and
experimental effects.

Expected:

- consolidated order, symbol and count equal the literal `buildCost().materials` result;
- every consolidated row is shown — no truncation, no top-N cut;
- each row shows a package rarity marker, the package-localised name and the locale-formatted
  quantity;
- the blueprint count opposite the heading equals the number of fitted modules that contributed a
  list;
- the footer's material-type count equals the row count and its unit total equals the sum of the
  package counts;
- `engineeringCost()` is called once per fitted module and no second classifier exists;
- no component or fixture reimplements grade rolls or material totals.

With no engineering at all: the whole materials block is absent — no heading, no counts, no
fabricated zero rows.

## Scenario 4: purchase baselines, fixed rewards and uncostable recipes

Validate:

1. a Mercenary article at its purchase grade;
2. the same purchase route at a later grade;
3. a fixed non-Mercenary reward with its baked effect;
4. that reward with a separately selected different effect and with the effect removed;
5. an injected `null` blueprint/effect cost result;
6. a genuine helper `[]` contract result.

Expected:

- purchase grade and fixed blueprint/effect contribute no rows and are not counted — feature 002's
  boundary already returns `notSelected` for both;
- a later Mercenary grade contributes its package climb above the purchase baseline;
- a changed present effect contributes one package effect cost; a baked or removed effect does not;
- an uncostable recipe contributes nothing, is not counted, and is **not named** (ruled F);
- a real `[]` also contributes nothing, and neither case is presented as free.

## Scenario 5: localization and formatting

For each shipped locale, exercise translated package material names and a package locale miss.

Expected:

- app-owned headings and labels use application messages;
- every number uses active-locale named formatting and changes no value;
- material names come from package helpers by exact symbol;
- a locale miss shows canonical package text through the shared `edsb-game-text` disclosure, as
  everywhere else in the application;
- no raw message key, blank label or private game translation appears;
- the bundled English fallback works offline.

## Scenario 6: offline boundary

After initial load, set the context offline and repeat both stories. Reject unexpected cross-origin
requests — in particular, confirm no `edassets.org` or Google Fonts request is made. Verify no cost
or material value occurs in local storage, browser history, URLs or build links.

Two notes on where this runs and what it can claim.

The **offline half needs a service worker**, which exists only in a production build, so it runs
under `pnpm run e2e:offline` — `e2e/offline-privacy.spec.ts`, beside feature 007's own offline
journey — rather than in `e2e/cost-and-materials.spec.ts`. Going offline is not enough on its own:
engineer a mount with the network gone and confirm the materials block appears from nothing, with
its footer counting the rows beside it. That is what tells a live read from a painted one — the
block is absent for a build that crafts nothing, so it can only appear by being built from the
package's consolidated result.

Expect the **credit figures not to move**. A blueprint is paid for in materials, and a module's
catalogue price is what it is whether or not it has been engineered. Assert that too, rather than
leaving it implicit: a reader who assumed otherwise would take the unchanged figures for a frozen
screen.

A **SLEF export legitimately carries `HullValue`, `ModulesValue` and `Rebuy`** — they are fields of
the format, and feature 004 writes the package's current catalogue retail into them
(`src/app/domain/ships/slef/slef-export-pricing.spec.ts`). Do not assert their absence. What must be absent
is what this feature owns: no material, no consolidated list and no Merc Coin figure.

## Scenario 7: responsive and accessibility matrix

Exercise the no-build, active-build, no-engineering, Mercenary-absent and Mercenary-present states
across all ten browser projects. Run the shared axe scan on every state.

Manually verify 200% text, actual 400% zoom, expanded/RTL text and reduced motion:

- no document-level horizontal overflow, content loss or ambiguous truncation;
- read order is `COST` → `MATERIALS` at every width;
- no figure or state depends on colour, icon, title or position alone — `TOTAL` and the Merc Coin
  row are named as well as accented;
- a screen reader reads every label with its value, and every material's name, rarity and quantity.

Automated success does not waive a manual failure. Any conformance statement must say WCAG 2.2 AA
except criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11; no shorter or unqualified claim
passes review.

## Scenario 8: design fidelity

Assert that the rendered blocks carry exactly the canvas's rows and no others. Specifically, confirm
the absence of: any trace or disclosure control, any unpriced evidence list, any per-slot Mercenary
entry, and any lower-bound, unavailable, missing-recipe or metadata-gap wording.

This scenario exists because the pre-ruling specification asked for all of them. It fails if they
come back without a new ruling.

## Withdrawn scenarios

Withdrawn with ruling F, and not to be reinstated without a new ruling:

- unpriced lower-bound retail evidence and its exact-slot actions;
- per-slot Mercenary entries, purchase/current grade display and a missing-price state;
- per-row material traces and their contributing-selection assertions;
- missing-recipe and metadata-gap presentation;
- the contextual-editor-versus-committed-build scenario — feature 002 owns and already ships that
  surface;
- revision coherence, stale-value rejection and the 100 ms settled-render measure, which existed for
  a two-surface publication that no longer has two surfaces.
