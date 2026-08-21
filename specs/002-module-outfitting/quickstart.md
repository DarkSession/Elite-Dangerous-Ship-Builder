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

1. Open a default build with hardpoint, utility, core, optional, armour, planetary and cargo-hatch
   mounts.
2. Compare the rendered groups/order/keys with `loadout.slots()`.
3. Load fixtures with empty removable slots, omitted fixed entries and package-reported invalid states.
4. Inspect invalid/incomplete package validation states.

Expected:

- every package slot appears by exact game key;
- unavailable package facts remain explicit, never zero/guessed;
- fixed mounts are populated before activation and unknown modules are outside the fixture contract;
- invalid/incomplete builds remain editable wherever the package offers an operation;
- no component owns or mutates a duplicate fitted array.

## 3. Verify fixed-mount construction

1. Prepare imports with missing or unusable armour/core/cargo-hatch entries, plus resolved modules
   with and without attached partial engineering.
2. Run the candidate through the shared ingress pipeline.
3. Observe the active build before any calculation presenter reads it.
4. Inspect quality-completion notices and history controls.

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
- result rendering settles under 100 ms for the installed package's measured maximum choice set,
  measured in the Chromium timing project at the mobile viewport under 4x CPU throttling.

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
- verify wide inline and narrow full-screen compositions expose identical capability.

Conformance wording, wherever used, is: “WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4,
2.4.1, 2.4.3, 2.4.7 and 2.4.11.”

## 12. Final gate

Run `pnpm run check`. Confirm coverage remains at least 80% in every dimension, every Playwright
project/axe scan runs, and no test/browser is skipped. Search production source for broad Almanac
barrels, color/spacing literals outside tokens, hard-coded application strings, history serialization,
raw modifier rewrites and local fit/variant rules.

Expected: the snapshot reconstruction and engineering regressions pass and the full suite is green
once feature 001/011 prerequisites are present. A green subset is not feature completion.
