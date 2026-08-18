# Quickstart: Validate Module Outfitting and Engineering

This is an acceptance guide for the plan, not implementation code. Almanac 0.1.1 satisfies the
former engineering gates; features 001 and 011 remain repository prerequisites.

From the repository root, install the pinned workspace and start the development application with:

```bash
pnpm install --frozen-lockfile
pnpm start
```

Run focused unit or Playwright files during development, then use `pnpm run check` for the mandatory
complete gate. The scenarios below define the fixtures and expected outcomes those tests must cover.

## 1. Prerequisites and released-API verification

1. Confirm feature 001 supplies one active `ShipLoadout`, lossless `BuildSnapshotV1`, atomic active
   replacement and autosave/fragment observers.
2. Confirm feature 011 supplies tokens, localization, responsive shared components, Firefox plus
   desktop/tablet/mobile portrait/landscape Playwright projects, and axe integration.
3. Confirm pinned Almanac 0.1.1 provides:
   - fixed-reward experimental-effect add/replace/remove that preserves the fixed base modifier
     block and variant identity while recomputing effect-dependent stats;
   - complete supported partial-quality normalization with a structured unsupported outcome.
4. Run the two minimal reproductions in [research.md](./research.md). Mass Manager must change the
   tech-broker FSD's optimal mass from 1785 to 1856.399902 while preserving `preEngineeredVariant`;
   removing it must return to 1785. Do not proceed if supported partial quality remains partial.
5. Confirm all package imports use leaf paths and no component imports Almanac catalogues/loadouts.

Expected: the Almanac gate is ready; no app modifier rewrite, clamp,
private catalogue or hidden capability is introduced.

## 2. Inspect every slot

1. Open a default build with hardpoint, utility, core, optional, armour, planetary and cargo-hatch
   mounts.
2. Compare the rendered groups/order/keys with `loadout.slots()`.
3. Load fixtures with an empty known slot, unresolved module in a known slot and fitted record in an
   original slot unknown to the hull layout.
4. Inspect invalid/incomplete package validation states.

Expected:

- every package slot appears by exact game key;
- unresolved values and original identities remain visible and unavailable, never zero/guessed;
- unknown original slots appear in a separate unresolved group and survive round-trip;
- invalid/incomplete builds remain editable wherever the package offers an operation;
- no component owns or mutates a duplicate fitted array.

## 3. Verify fixed-mount normalization

1. Prepare imports with missing and unresolved armour/core/cargo-hatch entries and at least one
   unresolved removable entry.
2. Run the candidate through the shared ingress pipeline.
3. Observe the active build before any calculation presenter reads it.
4. Inspect normalization notices and history controls.

Expected:

- only slots whose package reason is `requiredSlot`/`cargoHatch` are normalized;
- `fromLoadout()` restores cargo and `repairFixedMount()` repairs remaining fixed mounts from package defaults;
- removable unresolved entry is untouched;
- notices name slot, absent/replaced identity and default identity;
- saved/shared/exported active state carries repairs;
- undo is unavailable when normalization was the only change.

## 4. Build and search replacement choices

1. Select representative core, optional, weapon and utility slots.
2. Compare choice membership to `modulesForSlot(slotKey)` plus every
   `getPreEngineeredVariants(symbol)` result.
3. Use a module with multiple route-distinct variants.
4. Verify standard and final unique-reward sections, name groups, class descending, rating ascending,
   stock-before-variant and deterministic ties.
5. Search with mixed case, accents and multiple whitespace-separated terms spanning name, class,
   rating and mount.
6. Enter a no-match query and clear it.
7. Measure `input` to rendered result with browser `performance.now()`/`MutationObserver` over the
   largest package list.

Expected:

- exact package membership with no deduplication or local fit candidates;
- community-goal/event-reward variants form the final section;
- Mercenary/tech-broker and entitlement labels stack correctly;
- every search term matches one of exactly four fields; symbols/stats/acquisition do not match;
- no-match is explicit and clear restores all results;
- result rendering settles under 100 ms for the 481-choice 0.1.1 maximum (or a later package's
  newly measured maximum).

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
- UI `1..5` maps to package `0..4` without changing absence in lossless snapshots;
- power-dependent results refresh from `ShipLoadout`;
- module remains fitted, so mass/cost remain.

## 7. Engineer ordinary and Mercenary modules

1. Compare blueprint fdnames/grades and effect fdnames with package menu methods.
2. Apply a blueprint + grade + effect in one confirmation.
3. Replace grade/blueprint; add/replace/remove only the effect; clear all ordinary engineering.
4. Fit a Mercenary article, upgrade beyond purchase grade and then clear.

Expected:

- every apply passes explicit quality `1` and creates one history step;
- effect-only removal preserves current blueprint/grade;
- clear-all differs and may intentionally erase package Mercenary identification;
- purchase grade remains distinct from current grade until package identity disappears;
- package `stats`/`effectiveStats`/modifiers drive values; no private delta/better-worse math appears.

## 8. Engineer fixed/final rewards and validate costs

1. Fit the regression-fixture tech-broker FSD and add/replace/remove a later experimental effect.
2. Inspect a final Guardian reward.
3. Compare ordinary, Mercenary upgrade, selected effect and fixed baked-reward costs with package APIs.
4. Use known-zero `[]` and unavailable `null` cost fixtures.

Expected:

- fixed base modifiers, acquisition and `preEngineeredVariant` survive effect-only changes while
  effect-dependent stats recompute;
- final article exposes the package restriction and no unsupported actions;
- fixed baked engineering adds no craft cost;
- Mercenary progression starts above purchase grade; Merc Coin is separate;
- `[]` is shown as known zero and `null` as unavailable.

## 9. Normalize imported quality

1. Import known ordinary, Mercenary, fixed reward plus later effect, and package-supported uncommon
   recipes at partial qualities.
2. Complete ingress and inspect active engineering/effective stats/notices before any calculations.
3. Save/share/export and reload the result.

Expected:

- package-supported identities become true quality-1 computed states, not scalar-only rewrites;
- notices name original quality/slot and the 100% result;
- active/persisted/published/exported build represents quality 1;
- normalization creates no undo step;
- a structured unsupported package outcome never becomes fabricated modifiers or silent partial state.

## 10. Exercise 100-decision undo/redo

1. Mix fits, remove, engineering, effect, power, name and ident edits.
2. Undo and redo each intermediate state, comparing canonical snapshots and package results.
3. Undo several, make a new edit and check redo.
4. Execute 101 decisions and traverse the retained history.
5. Open/create/import/restore a replacement build.

Expected:

- one successful decision equals one checkpoint; draft/no-op/cancel/refusal/viewing/normalization equals
  none;
- every restored snapshot is exact and results recompute through the package;
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
- verify wide inline and narrow full-screen compositions expose identical capability.

Conformance wording, wherever used, is: “WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4,
2.4.1, 2.4.3, 2.4.7 and 2.4.11.”

## 12. Final gate

Run `pnpm run check`. Confirm coverage remains at least 80% in every dimension, every Playwright
project/axe scan runs, and no test/browser is skipped. Search production source for broad Almanac
barrels, color/spacing literals outside tokens, hard-coded application strings, history serialization,
raw modifier rewrites and local fit/variant rules.

Expected: the released Almanac regressions pass and the full suite is green once feature 001/011
prerequisites are present. A green subset is not feature completion.
