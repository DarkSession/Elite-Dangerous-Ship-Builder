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
3. Confirm features 001 and 002 provide the active build and workspace, the ship-asset output path
   and its lazy worker group, and the complete exact-slot ledger with one `selectedSlotKey`. Nothing
   to confirm about feature 003: the `MOUNTS` mode reads no condition and no revision context.
4. Nothing to confirm about feature 005. The `MOUNTS` mode carries no power state — power is
   feature 005's own mode over the same plates — so feature 010 consumes no power observation and
   defines no port (`design/hull-anatomy.md`, "Divergence from FR-005 and the legend").
5. Confirm feature 011 has enabled TypeScript `strict`, Angular `strictTemplates`, the application's
   sole service-worker registration/base configuration, the shared design/localization layers, ten
   Chromium/Firefox Playwright projects and axe checks. No worker configuration changes here:
   feature 001's existing lazy `/assets/ships/**` group already covers both of a side's files.
6. Nothing to confirm about feature 012. Neither canvas puts a provenance control on the anatomy
   panel; `HELP & FAQ` appears once, in canvas 1d's application menu, and belongs to feature 012
   (`design/hull-anatomy.md`, "Divergence from FR-011").

If any gate is absent, stop rather than introducing a feature-local editor, power calculation,
style/localization layer, cache, test-matrix reduction or provenance route.

## Focused and full commands

```bash
pnpm exec ng test --include 'src/app/**/*anatomy*.spec.ts' --include 'src/app/**/*schematic*.spec.ts'
node scripts/convert-ship-artwork.mjs        # only after a package pin move
node scripts/extract-schematic-mounts.mts   # likewise; both write public/assets/ships
pnpm run policy                     # includes the copied-schematics and anatomy-ownership audits
pnpm exec playwright test e2e/hull-anatomy.spec.ts
pnpm run e2e:offline                # includes e2e/schematic-offline.spec.ts
pnpm run check
```

The installed-package audit is `src/app/domain/anatomy/almanac-anatomy-contract.spec.ts` rather than
a script of its own: it runs the same parser the application runs over every file the package ships,
so the audit and the product cannot disagree about what a valid document is. The generated-output
half is the `copied-schematics` rule in `scripts/check-interface-foundations.mjs`, which reads the
installed package and the committed extracts — not the build output, so it needs no build. It
recomputes each extract's recorded source digest, and that is what turns "re-run both scripts after
a pin move" from a note into a failing gate.

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
- every committed extract's recorded source digest matches the installed SVG's; and
- no package SVG is tracked under application source or public files.

The audit derives its expected catalogue and mount set from the installed package.

## Scenario 2: hardpoint and utility parity

Open a supported build containing fitted, empty and engineered hardpoints and utilities. Inspect
both plates and feature 002's complete ledger beside them. Fixed mounts are already
package-populated and unsupported module identities are outside this capability's ingress contract.

Expected:

- both package mount kinds are interactive only through exact matching annotations;
- every package hardpoint and utility appears once in the ledger, in package order, whether or not
  its schematic arrived — the ledger is the enumerable list, and there is no second one;
- kind, mount name, fitted/empty, engineering and selected state agree between a mount on the plate
  and its ledger row;
- utilities receive the same interaction, state and navigation as hardpoints; and
- no node number, name prefix or coordinate is used as identity.

## Scenario 3: two-way exact-slot movement

Activate a top hardpoint and a bottom utility. Then select those slots from the complete ledger.
Include a cross-side repeated hardpoint (`Federation_Corvette/MediumHardpoint1`) and an internal
slot.

Expected:

- one interaction reaches the exact feature 002 slot, and its bench opens on it;
- ledger selection marks the mount on the plates; where one plate is shown, the shown side becomes
  one that contains the slot — the current side if it already does, otherwise top before bottom;
- nothing scrolls, because the whole plate is in view: revealing an occurrence is marking it;
- every occurrence of a repeated slot shows identical selected and build state;
- internal selection remains usable in the ledger and creates no false geometry; and
- URL fragment, build revision, persistence and undo history do not change from navigation alone.

## Scenario 4: no power state

There is nothing to run. The `MOUNTS` mode the canvases draw carries five states — selected, fitted,
empty, utility, engineered — and power is a different mode over the same plates, which feature 005
owns. Confirm instead that no power or priority value appears anywhere in the anatomy region, and
that `scripts/policy/anatomy-ownership.mjs` passes.

## Scenario 5: duplicate and defect handling

Use the real `Federation_Corvette` and `MediumTransport01` cross-side repeats, then documents with an
unknown key,
wrong-kind annotation, same-side repeat, missing mount and unsafe or invalid SVG at build time, and
a body that is not JSON, an extract for another hull or side and a malformed mount at runtime.

Expected:

- valid cross-side repeats remain one mount with two synchronized occurrences;
- invalid occurrences are omitted and reported, never guessed;
- same-side ambiguity is not resolved by drawing order;
- unsafe documents never enter the live DOM;
- a mount no side draws is published with no location rather than as a defect, and stays selectable
  and editable in the ledger; and
- the complete ledger remains fully operable in every case.

## Scenario 6: independent loading and offline recovery

Against a production build controlled by the real service worker:

1. open one hull online and wait for both sides;
2. reload offline; and
3. confirm only that hull's two files are in the cache.

Expected: opened schematics reload from the versioned cache with no network at all, and the cache
holds two files rather than the package's ninety-six.

The uncached half — a hull nobody has opened, a side that fails and retries, a connectivity
transition that recovers without a reload, and a response from a prior hull that never replaces
current geometry — is run in all ten projects in `e2e/hull-anatomy.spec.ts` by refusing the requests
instead. Playwright's offline emulation does not reach a Firefox service worker's own fetches, so an
"offline" assertion there would pass in Chromium and lie in Firefox.

## Scenario 7: responsive, target and accessibility matrix

Run the primary journey and axe scan in Chromium and Firefox at:

- 1440×900 desktop;
- 834×1112 tablet portrait;
- 1112×834 tablet landscape;
- 390×844 mobile portrait; and
- 844×390 mobile landscape.

Check 744×1133 as well. It is not a matrix profile, and it is the window that once drew the pair into
the middle of a single flow: not short, and two pixels wider than the centre column a 1440px desktop
draws its plates inside (`design/hull-anatomy.md`, "Intermediate tablet"). It now fails the pair's
room condition and its arrangement condition together, and the automated suite asserts both halves so
that the screen keeps drawing one plate whichever of the two is changed.

Repeat meaningful states with 200% text, actual 400% browser zoom, reduced motion, long expanded
text and RTL direction.

Expected:

- paired views appear only where the workspace is composing more than one region, **and** the block
  has the inline size for two plates at the width one plate is drawn at, **and** the window is not a
  short one; every other layout uses one labelled side selector;
- every profile in the matrix draws **one** plate and its `TOP`/`BOTTOM` selector. The room the pair
  asks for is 74.075rem of block, which the widest of them does not reach: at 1440×900 the block is
  742px. 744×1133 portrait draws one for the same reason and for the arrangement around it as well,
  and 1440×900 at 200% text draws one because the step is a container query in `rem` and moves with
  the reader's text where a page breakpoint would not (`design/hull-anatomy.md`, "Intermediate
  tablet");
- no document horizontal overflow occurs; only bounded schematic regions may pan;
- every geometry target is a named button at the canvas's own mark size, operable from the keyboard
  one mount at a time and raised above the marks it overlaps while it is being worked with — which
  is what nearby and overlapping mounts allow without moving package geometry; the ledger row beside
  the plates is each mount's route at the full 44-pixel baseline
  (`design/hull-anatomy.md`, "Divergence from FR-012");
- state is never conveyed only by color/shape/position;
- headings, side descriptions, mount names, statuses and relationships are announced coherently,
  with one announcement per side rather than one per mount; and
- smooth reveal/nonessential motion is absent under reduced motion.

Manual screen-reader validation remains required; axe is the floor, not proof.

## Scenario 8: localization and provenance

Switch locale while a mount is selected.

Expected:

- owned labels and states update through feature 011 without changing identity or revisions;
- Almanac mount names use the localized value feature 002 already resolved, with its disclosed
  canonical fallback — never a private translation and never a raw slot key read out;
- the exact package slot key stays the machine identity and is never presented as text; and
- the anatomy region publishes no provenance control and no external link at all.

## Final acceptance

Run `pnpm run check` from a clean install. Review generated service-worker/output evidence and the
manual screen-reader/zoom record. The feature is not complete while any prerequisite blocker,
single-browser shortcut, missing axe state, inaccessible overlap case or package-contract failure
remains.
