# Quickstart: Validate Module Outfitting and Engineering

This is an acceptance guide for the plan, not implementation code. Features 001 and 011 remain
repository prerequisites. Ingress relies on the package returning every fixed mount populated from
the hull defaults.

From the repository root, install the pinned workspace and start the development application with:

```bash
pnpm install --frozen-lockfile
pnpm start
```

Run focused unit or Playwright files during development, then use `pnpm run check` for the mandatory
complete gate. The scenarios below define the fixtures and expected outcomes those tests must cover.

## 1. Prerequisites and package verification

1. Confirm feature 001's canonical `BuildSnapshotV1` captures exact package-resolved slot/item
   identity, sparse power fields, name/ident, ordinary engineering and every identified
   pre-engineered variant, then reconstructs them through `ShipLoadout` before atomic swap.
2. Confirm reconstruction ignores captured purchase values and recalculates current catalogue retail.
3. Confirm feature 001 supplies one active `ShipLoadout`, snapshot/reconstruction/swap, atomic
   replacement and autosave/fragment observers. The history tape remains session-only.
4. Confirm feature 011 supplies tokens, localization, responsive shared components, Firefox plus
   desktop/tablet/mobile portrait/landscape Playwright projects, and axe integration.
5. Confirm the installed Almanac provides:
   - package construction that refuses an unknown hull and returns every fixed mount populated;
   - fixed-reward experimental-effect add/replace/remove that preserves the fixed base modifier
     block and variant identity while recomputing effect-dependent stats;
   - complete supported partial-quality normalization with a structured unsupported outcome.
6. Run the engineering reproductions in [research.md](./research.md). Mass Manager must change the
   package-reported effective optimal mass while preserving `preEngineeredVariant`; removing it must
   restore the package-reported baseline. Do not proceed if supported partial quality remains partial.
7. Confirm all package imports use leaf paths and no component imports Almanac catalogues/loadouts.

Expected: all package prerequisites are ready — including engineering operations and fixed defaults.
Do not implement a local substitute, captured-event checkpoints, inverse commands or intent replay.

## 2. Inspect every slot

1. Open a default build with hardpoint, utility, core, optional, armour, planetary approach and
   cargo-hatch mounts.
2. Compare the rendered groups/order/keys with `loadout.slots()`.
3. Load fixtures with empty removable slots, omitted fixed entries and package-reported invalid states.
4. Inspect invalid/incomplete package validation states.

Expected:

- every package slot appears by exact game key, in the ledger's own order — the cargo hatch closing
  the core internals, and no row at all for the planetary approach mount (FR-002a);
- unavailable package facts remain explicit, never zero/guessed;
- fixed mounts are populated before activation and unknown modules are outside the fixture contract;
- invalid/incomplete builds remain editable wherever the package offers an operation;
- no component owns or mutates a duplicate fitted array.

## 3. Verify fixed-mount construction

1. Prepare imports with missing or unusable armour/core/cargo-hatch entries, plus resolved modules
   with and without attached partial engineering.
2. Run the candidate through the shared ingress pipeline.
3. Observe the active build before any calculation presenter reads it.
4. Inspect the build status and history controls.

Expected:

- package construction populates every fixed mount before quality processing;
- supported partial evidence is then completed;
- no `repairFixedMount()` pass or application default lookup occurs;
- saved/shared/exported active state carries the package-returned modules without repair provenance;
- undo is unavailable when normalization was the only change.

## 4. Build and search replacement choices

1. Select representative core, optional, weapon and utility slots.
2. Compare choice membership to `modulesForSlot(slotKey)` plus every
   `getPreEngineeredVariants(symbol)` result.
3. Use a module with multiple route-distinct variants.
4. Verify package family grouping and order, and inside a family: class descending, price
   descending, an unpriced choice after the priced ones of its class, and then name, rating,
   stock-before-variant and deterministic ties. Confirm no section heading is drawn
   and that a unique reward sits in the family of the module it is built on.
5. Search with mixed case, accents and multiple whitespace-separated terms spanning name, class,
   rating and mount.
6. Enter a no-match query and clear it.
7. Measure `input` to rendered result with browser `performance.now()`/`MutationObserver` over the
   largest package list.

Expected:

- exact package membership with no deduplication or local fit candidates;
- community-goal/event-reward variants sit in their own module's family and keep their labels there;
- every family id and name on screen came from the installed package, with no abbreviation and no
  local rewriting of its text;
- Mercenary/tech-broker and entitlement labels stack correctly;
- every search term matches one of exactly four fields; symbols/stats/acquisition do not match;
- no-match is explicit and clear restores all results;
- result rendering settles under 100 ms for the installed package's measured maximum choice set,
  measured in the Chromium timing project at the mobile viewport under 4x CPU throttling.

## 4a. Open, close and seed module families

1. Open a mount whose fitted module is offered again as a choice, and confirm that its family alone is
   open and every other family is closed.
2. Open a mount whose fitted module has no available family — one where package restrictions have
   withdrawn it — and confirm every family is closed and no unrelated family is opened in its place.
3. Toggle several families open and closed by pointer and by touch. Read the build revision and the
   undo/redo state before and after.
4. Type a query matching choices in more than one family, then extend it so it matches in only one.
   4b. Type a single letter, so the query matches more than a screenful, and read the family counts.
5. Clear the query.
6. Switch the active locale, including to one the package does not name every family in.
7. Fit a different module, so the chooser rebuilds.

Expected:

- exactly one open family, or none, on first presentation and after each rebuild;
- toggling changes no build revision, adds no history step and leaves undo/redo exactly as it was;
- every family holding a match is present and counted on each query change and families without a
  match are absent; where the match set is within a screenful every one of them is open and no
  matching row is behind a closed control, and where it is larger every one of them is closed;
- clearing the query restores the fitted-family seed rather than the set the Commander left open;
- a locale change relabels and reorders without moving a choice between families, and a family the
  active language does not name shows its canonical English name with the untranslated disclosure;
- each family control exposes its name, its current count and its open state to assistive technology,
  and each clears 44 CSS px at every viewport.

## 5. Fit, replace, remove and refuse

1. Fit one exact stock choice into an empty slot.
2. Replace it with an exact package variant.
3. Replace an engineered module with another stock module.
4. Remove from a package-removable slot.
5. Attempt a fixture that the package refuses for an exclusive/count constraint.
6. Inspect a non-removable required/module-limit slot.

Expected:

- transaction passes exact package objects to `setModule`/`setPreEngineeredVariant`;
- all package results and validation refresh after one committed revision;
- replacement does not inherit old engineering;
- remove appears only when `removable` is true;
- `LoadoutEditError` code/constraint/params become localized structured feedback;
- refusal leaves active snapshot, autosave/link and history unchanged.

## 6. Verify cargo hatch and power

1. Inspect cargo hatch on desktop and mobile.
2. Toggle enabled and set each visible priority.
3. Observe package power/downstream results, mass and costs.

Expected:

- facts, enabled and priority are available; replace/search/engineering/remove are absent;
- UI `1..5` maps to package `0..4` without fabricating an absent source value;
- power-dependent results refresh from `ShipLoadout`;
- module remains fitted, so mass/cost remain.

## 7. Engineer ordinary and Mercenary modules

1. Compare blueprint fdnames/grades and effect fdnames with package menu methods.
2. Apply a blueprint + grade + effect in one confirmation.
3. Replace grade/blueprint; add/replace/remove only the effect; clear all ordinary engineering by
   choosing the explicit no-blueprint entry and applying.
4. Fit a Mercenary article, upgrade beyond purchase grade and then clear.

Expected:

- every apply passes explicit quality `1` and creates one history step;
- effect-only removal preserves current blueprint/grade;
- clear-all differs and may intentionally erase package Mercenary identification;
- no separate clear control exists at any width, and clearing dispatches `clearEngineering`;
- purchase grade remains distinct from current grade until package identity disappears;
- package `stats`/`effectiveStats`/modifiers and, for an identified pre-engineered variant's stock
  column, the catalogue record read by symbol drive values; no private delta/better-worse math
  appears.

## 8. Engineer fixed/final rewards and validate costs

1. Fit the regression-fixture tech-broker FSD and add/replace/remove a later experimental effect.
2. Inspect a final Guardian reward.
3. Compare ordinary, Mercenary upgrade, selected effect and fixed baked-reward costs with package APIs.
4. Use known-zero `[]` and unavailable `null` cost fixtures.

Expected:

- fixed base modifiers, acquisition and `preEngineeredVariant` survive effect-only changes while
  effect-dependent stats recompute;
- the fixed reward's `STOCK` and `MODIFIED` columns differ on the attributes its own engineering
  moves — `STOCK` is the catalogue record for the symbol, not the resolved article `stats` holds —
  and a symbol the catalogue does not carry states the absence in every `STOCK` cell;
- final article exposes the package restriction and no unsupported actions;
- fixed baked engineering adds no craft cost;
- Mercenary progression starts above purchase grade; Merc Coin is separate;
- `[]` is shown as known zero and `null` as unavailable.

## 9. Normalize imported quality

1. Import known ordinary, Mercenary, fixed reward plus later effect, and package-supported uncommon
   recipes at partial qualities. Add quality-1 and unengineered resolved modules across mount kinds.
2. Complete ingress and inspect active engineering/effective stats/notices before any calculations.
3. Save/share/export and reload the result.

Expected:

- package-supported identities become true quality-1 computed states, not scalar-only rewrites;
- notices name original quality/slot and the 100% result;
- active/persisted/published/exported build represents quality 1;
- normalization creates no undo step;
- unknown module identities are outside the supported import matrix;
- unsupported partial engineering on a remaining resolved module is atomically refused before
  activation with exact package reason; current build, storage, fragment, notices and history remain
  unchanged;
- a structured unsupported package outcome never becomes fabricated modifiers or silent partial state.

## 10. Exercise 100-decision undo/redo

1. Mix fits, remove, engineering, effect, power, name and ident edits. Set a ship name, set an ident,
   then clear each back to absence.
2. Undo and redo each intermediate state, comparing modelled state and recomputed package results.
3. Undo several, make a new edit and check redo.
4. Execute 101 decisions and traverse the retained history.
5. Open/create/import/restore a replacement build.

Expected:

- one successful decision equals one checkpoint; draft/no-op/cancel/refusal/viewing/normalization equals
  none — typing in the name or ident field before confirming is a draft;
- a cleared name or ident restores absence rather than an empty string, and undo restores the prior
  value with every other modelled field unchanged;
- every restored modelled checkpoint is exact, and historical purchase values never reappear;
- new edit clears redo;
- newest 100 decisions remain after 101;
- replacement resets both directions;
- no history data occurs in local records, fragments, SLEF or browser navigation.

## 11. Responsive, localization and accessibility matrix

Run stories 1–4 in Playwright for desktop, tablet and mobile portrait/landscape in Chromium and
Firefox. For workspace, chooser, engineering, no-build, empty, no-match, unavailable, refusal,
normalization and history-disabled states:

- run `@axe-core/playwright` and fail all in-scope findings;
- assert roles/names/selected/expanded/checked/invalid/live relationships;
- use touch for every action and ensure targets meet 44 CSS px;
- verify no document horizontal overflow, 200% text and 400% zoom;
- run expanded-message and RTL fixtures;
- run reduced-motion mode and both orientations;
- verify wide inline and narrow full-screen compositions expose identical capability;
- exercise family open/close in every project, including the compact `FITTED HERE` block above the
  family list;
- re-measure SC-002 against the largest choice set now that a collapsed family draws one control
  instead of its rows, and record the figure whether or not it clears 100 ms.

Conformance wording, wherever used, is: “WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4,
2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.”

## 12. Final gate

Run `pnpm run check`. Confirm coverage remains at least 80% in every dimension, every Playwright
project/axe scan runs, and no test/browser is skipped. Search production source for broad Almanac
barrels, color/spacing literals outside tokens, hard-coded application strings, history serialization,
raw modifier rewrites and local fit/variant rules.

Expected: the snapshot reconstruction and engineering regressions pass and the full suite is green
once feature 001/011 prerequisites are present. A green subset is not feature completion.

## Run record — 2026-08-23 (wave 10, module families)

`pnpm run check` green end to end, the SC-002 timing step included for the first time since that
criterion was written: 1,365 unit tests across 109 files at **83.42% statements, 83.04% branches,
86.25% functions, 83.16% lines**; **3,410** Playwright tests across the ten-project matrix (Chromium
and Firefox × desktop, tablet portrait/landscape, mobile portrait/landscape) with axe over every
rendered state, including the seeded, fully open, searched, above-a-screenful and all-closed family
states; the timing measurement; and 90 offline tests. No test is skipped, focused or quarantined —
the policy checker fails the build on any of those forms.

**SC-002 is met at the compact composition.** On the Panther Mk II's 478-choice mount at 390 px under
4x CPU throttling, `m mu mul mult multi` settles at 50.4, 56.8, 33.0, 33.6, 33.5 ms against a 100 ms
budget, over three consecutive runs at 59 ms worst or better. Collapsed families alone did not do it —
they moved the cost to the first broad search term, which built the matching families' rows cold at
538.7 ms. What closed it is the rule that a search opens what it matched only up to a screenful of
twenty-five choices; above that the families stand closed with their counts. FR-023 and SC-008 are
amended to that rather than bent around it, and the diagnosis is in `design/module-replacement.md`.

Three defects the wave's own new scans found, all fixed in it: the layer's foot went on sticking over
the list at short viewports because its release was written above the rule it overrode and a media
query carries no specificity, so rows scrolled underneath `CANCEL` and `FIT MODULE` at 844×390; the
sticky family bar showed a sliver of the row behind it in the seam above it at fractional device
pixels, and now sticks a hairline high to cover it; and the compact `FITTED HERE` block put a second
radio carrying this group's name and the fitted choice's value into the list, so only one of the two
could be checked and the row a Commander had just taken could be painted as taken while reporting
unchecked. The pinned block carries no control at all now, which is what canvas 1d draws.

### Run record — 2026-08-22

`pnpm run check` green end to end: 1,103 unit tests across 94 files at **83.05% statements, 82.27%
branches, 85.88% functions, 82.58% lines**; **2,680** Playwright tests across the ten-project matrix
(Chromium and Firefox × desktop, tablet portrait/landscape, mobile portrait/landscape) with axe over
every rendered state; the SC-002 timing measurement; and 70 offline tests. No test is skipped,
focused or quarantined — the policy checker fails the build on any of those forms.

Each scenario above, and what executes it:

| Scenario                                 | Executed by                                                                                                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Prerequisites and package verification | `build-snapshot.*.spec.ts`, `modeled-build-checkpoint.spec.ts`, `outfitting-engineering.spec.ts`; leaf-import and component-import rules by `scripts/policy/outfitting-ownership.mjs` |
| 2 Inspect every slot                     | `e2e/module-outfitting.spec.ts` "the slot ledger"; `slot-view.spec.ts`                                                                                                                |
| 3 Verify fixed-mount construction        | `e2e/module-outfitting.spec.ts` "package-populated fixed mounts"; `fixed-mounts.spec.ts`                                                                                              |
| 4 Build and search replacement choices   | `e2e/module-outfitting.spec.ts` "finding a replacement"; `candidate-query.spec.ts`; `e2e/outfitting-timing.spec.ts`                                                                   |
| 4a Open, close and seed module families  | `e2e/outfitting-families.spec.ts`; `candidate-query.spec.ts`; `candidate-components.spec.ts`; `e2e/outfitting-accessibility.spec.ts` "in every family state"                          |
| 5 Fit, replace, remove and refuse        | `e2e/module-outfitting.spec.ts` "the slot ledger"; `outfitting.store.spec.ts`                                                                                                         |
| 6 Verify cargo hatch and power           | `e2e/module-outfitting.spec.ts` "power and the cargo hatch"; `outfitting-engineering.spec.ts`                                                                                         |
| 7 Engineer ordinary and Mercenary        | `e2e/module-engineering.spec.ts`; `engineering-draft.spec.ts`; `engineering-cost.spec.ts`                                                                                             |
| 8 Engineer fixed/final rewards and costs | `e2e/module-engineering.spec.ts` "purchased and reward articles"; `build-snapshot.serializer.spec.ts`                                                                                 |
| 9 Normalize imported quality             | `e2e/module-engineering.spec.ts` "reading a build in"; `build-ingress-normalizer.spec.ts`                                                                                             |
| 10 Exercise 100-decision undo/redo       | `e2e/outfitting-history.spec.ts`; `session-edit-history.spec.ts`; `outfitting-history.spec.ts`                                                                                        |
| 11 Responsive, localization, a11y matrix | `e2e/outfitting-responsive.spec.ts`, `e2e/outfitting-accessibility.spec.ts`, and the per-state sweeps in the suites above                                                             |
| 12 Final gate                            | `pnpm run check`; source rules by `scripts/policy/outfitting-ownership.mjs`                                                                                                           |

The exact hundred-decision bound is proven where a decision costs no browser —
`session-edit-history.spec.ts` walks 101 decisions and 100 steps back, and
`outfitting-history.spec.ts` dispatches 101 real store decisions. The browser journey walks twelve
through the controls a Commander actually presses, which is the part only a browser can answer.

One flake was observed and is recorded rather than hidden: `e2e/offline-privacy.spec.ts` "keeps an
illustration that has been seen once" failed once at `chromium-tablet-portrait` under full-matrix
load, and passed on its own and in every other run. It belongs to feature 001's offline caching, not
to this feature.
