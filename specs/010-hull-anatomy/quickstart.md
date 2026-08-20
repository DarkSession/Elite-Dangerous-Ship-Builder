# Quickstart: Validate Hull Anatomy and Mount Geometry

This guide validates feature 010 after its prerequisite features and contract updates land. It is a
run/acceptance guide, not implementation code.

## Prerequisites and blocking gates

1. Use the repository-configured Node version and install the committed dependency graph:

   ```bash
   pnpm install --frozen-lockfile
   ```

2. Confirm the Almanac resolves from the committed lockfile and rerun the full installed-asset audit
   after any upgrade.
3. Confirm features 001, 002 and 003 provide the active build/workspace, complete exact-slot ledger
   and settled deployed/retracted revision context.
4. Confirm feature 005 exports a generalized located-mount power observation for both hardpoint and
   utility keys. Do not implement a feature-010 consumer/band join while its hardpoint-only port is
   still present.
5. Confirm feature 011 has enabled TypeScript `strict`, Angular `strictTemplates`, the shared design/
   localization layers, ten Chromium/Firefox Playwright projects and axe checks.
6. Confirm feature 012 opens its planned in-place help/provenance modal through the shared contextual
   intent.
7. Confirm feature 002's modelled-snapshot reconstruction contract is delivered before declaring the
   complete dependency chain shippable.

If any gate is absent, stop rather than introducing a feature-local editor, power calculation,
style/localization layer, cache, test-matrix reduction or provenance route.

## Focused and full commands

```bash
node scripts/check-almanac-schematics.mjs
pnpm exec ng test --watch=false --include 'src/app/**/*anatomy*.spec.ts'
pnpm run build
pnpm exec playwright test e2e/hull-anatomy.spec.ts
pnpm exec playwright test e2e/schematic-offline.spec.ts
pnpm run check
```

Expected: every command succeeds; coverage remains at least 80% for statements, branches, functions
and lines; no project/browser/layout is skipped.

## Scenario 1: installed package and output integrity

Run the package audit before and after the production build.

Expected for the installed-package regression:

- every package hull has a matching asset directory;
- top and bottom schematics for every hull;
- every hardpoint and utility is represented across both sides;
- documented cross-side repeats are accepted and same-side repeats fail;
- every annotation key resolves to the matching package kind;
- only the released static SVG content contract is present;
- generated schematic bytes/hashes match installed package files; and
- no generated package SVG is tracked under application source/public files.

The audit derives its expected catalogue and mount set from the installed package.

## Scenario 2: hardpoint and utility parity

Open a supported build containing fitted, empty and engineered hardpoints and utilities. Inspect top,
bottom, selected facts and the unique text list. Fixed mounts are already package-populated and
unsupported module identities are outside this capability's ingress contract.

Expected:

- both package mount kinds are interactive only through exact matching annotations;
- every package hardpoint/utility appears once in the unique package-ordered list;
- kind, exact key, size/not-class-sized, fitted/empty, engineering, selected, priority and
  power state agree across geometry, selected facts and text;
- utilities receive the same detail and navigation as hardpoints; and
- no node number, name prefix or coordinate is used as identity.

## Scenario 3: two-way exact-slot movement

Activate a top hardpoint, a bottom utility and each item in the text list. Then select those slots
from the complete ledger. Include a cross-side repeated hardpoint and an internal slot.

Expected:

- one interaction reaches the exact feature 002 slot/editor;
- ledger selection reveals a containing schematic;
- narrow layout keeps a containing current side, otherwise selects top then bottom;
- every repeated occurrence shows identical selected/build state while the text list has one item;
- internal selection remains usable in the ledger and creates no false geometry; and
- URL fragment, build revision, persistence and undo history do not change from navigation alone.

## Scenario 4: current power states

Under deployed and retracted viewing conditions, cover always-powered and deployed-only utilities,
weapons, disabled modules and shed priority bands.

Expected:

- feature 005's normalized one-based priority and current state are copied unchanged;
- disabled, inactive-retracted, powered, shed and not-applicable remain distinct;
- any changed condition publishes one coherent conditions revision; and
- feature 010 reads no raw `on`/`priority`, modifiers, consumers or bands.

## Scenario 5: duplicate and defect handling

Use real Federal Corvette/Lynx cross-side repeats, then fixture documents with an unknown key,
wrong-kind annotation, same-side repeat, missing mount and unsafe/invalid SVG.

Expected:

- valid cross-side repeats remain one item/two synchronized occurrences;
- invalid occurrences are omitted and reported, never guessed;
- same-side ambiguity is not resolved by drawing order;
- unsafe documents never enter the live DOM;
- missing geometry becomes a defect only after both valid sides settle; and
- unique list and complete ledger remain fully operable in every case.

## Scenario 6: independent loading and offline recovery

Against a production build controlled by the real service worker:

1. open one hull online and wait for both sides;
2. reload offline;
3. select a different uncached hull while offline;
4. restore connectivity without reloading; and
5. separately fail/retry only one side.

Expected: opened schematics reload from the versioned cache; uncached sides are identified as
temporarily unavailable; ledger/editing never block; the active failed side loads after reconnect;
and stale responses from a prior hull never replace current geometry.

## Scenario 7: responsive, target and accessibility matrix

Run the primary journey and axe scan in Chromium and Firefox at:

- 1440×900 desktop;
- 834×1112 tablet portrait;
- 1112×834 tablet landscape;
- 390×844 mobile portrait; and
- 844×390 mobile landscape.

Repeat meaningful states with 200% text, actual 400% browser zoom, reduced motion, long expanded
text and RTL direction.

Expected:

- paired views appear only when container space supports them; constrained layouts use one labelled
  side selector;
- no document horizontal overflow occurs; only bounded schematic regions may pan;
- every geometry target has exact-shape 44px hit treatment and every mount has an independent 44px
  text action, including nearby/overlapping cases;
- state is never conveyed only by color/shape/position;
- headings, side image descriptions, list, selected facts, statuses and relationships are announced
  coherently with no duplicate cross-side announcement; and
- smooth reveal/nonessential motion is absent under reduced motion.

Manual screen-reader validation remains required; axe is the floor, not proof.

## Scenario 8: localization and provenance

Switch locale while a mount is selected and open the anatomy provenance action both online and
offline.

Expected:

- owned labels/states/numbers update through feature 011 without changing identity or revisions;
- Almanac names use localized, disclosed canonical fallback or unavailable state—never a private
  translation/raw-id display fallback;
- the feature 012 modal opens in place with current anatomy/build state preserved;
- external licence/issue actions are deliberate and labelled as leaving the app; and
- no external URL contains hull, slot, module, build, fragment or storage data.

## Final acceptance

Run `pnpm run check` from a clean install. Review generated service-worker/output evidence and the
manual screen-reader/zoom record. The feature is not complete while any prerequisite blocker,
single-browser shortcut, missing axe state, inaccessible overlap case or package-contract failure
remains.
