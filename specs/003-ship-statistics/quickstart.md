# Quickstart: Ship Statistics and Status

This guide validates feature 003 against its prerequisites and pinned Almanac 0.1.1.

## 1. Confirm prerequisites

1. Install with `pnpm install --frozen-lockfile`.
2. Confirm features 001 and 002 provide one revisioned active `ShipLoadout`, exact-slot selection and
   versioned local records.
3. Confirm features 005–009 expose the five area ports defined in the status-snapshot contract.
4. Confirm feature 011 supplies localization, tokens/components, Chromium and Firefox viewport
   projects, and automated accessibility scanning.
5. Confirm pinned 0.1.1 contains fixes for
   [#296](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/296) and
   [#297](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/297). Rerun their minimal
   reproductions. Do not implement local gates or corrections.
6. For fixed-mount provenance, also pin feature 002's released package regressions
   [#291](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/291) and
   [#292](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/292).

## 2. Verify structural status

1. Open `/build` without an active build.
2. Confirm status does not create/select a hull and the existing empty-state actions remain.
3. Load fixtures covering valid/complete, valid/incomplete, invalid/complete where package-reachable,
   and invalid/incomplete.
4. Compare the visible facts and issue list with `loadout.validation`.

Expected: `valid` and `complete` are independent; every issue appears once in package order with exact
structured context; kind and severity are text; no wording says ready, flyable, working, good or
optimal. A package issue without `slot` has no invented action.

## 3. Verify result-state honesty

Open reference builds producing:

- exact positive and exact zero results;
- unknown power draw and an unpriced article;
- incomplete mass/capacity or recipe cost;
- package null/thrown unavailable state;
- package semantic infinity;
- no recognized Mercenary article.

Expected: every state remains distinct, useful package numbers stay visible with qualifications, and
Merc Coin is absent rather than zero. Values show localized units and conditions. Canonical package
diagnostics remain unparsed and receive the untranslated disclosure outside English.

## 4. Verify viewing conditions

1. Start a fresh active build and inspect defaults.
2. Select maximum-jump, unladen and laden in turn.
3. Apply valid half-pip allocations including boundary values.
4. Try an out-of-range, non-half-step and non-six-total draft.
5. Toggle deployed/retracted hardpoints.
6. Reload, open another stored build, then load a link/SLEF candidate.

Expected: defaults are unladen, 2/2/2 and deployed. Valid changes update one settled revision without
refresh; invalid drafts retain the prior results and explain the constraint. Load mappings equal the
package results. Retracted power uses only retracted fields and omits deployed-only summaries.
Conditions reset after reload/replacement and travel in no save, history, preference, link or export.

## 5. Verify atomic revision publication

1. Stamp the status host in test builds with `buildRevision` and `conditionsRevision`.
2. Rapidly toggle enabled/priority state while changing conditions.
3. Delay one injected area port so an older request completes last.

Expected: issues, headlines and requirements always carry one matching revision pair. The stale
request never publishes. During current-context work the UI does not relabel old figures as current.

## 6. Verify targeting

1. Activate a validation issue containing a package slot on wide and narrow layouts.
2. Inspect an issue without a slot.
3. Activate every headline and assembly summary action.

Expected: one action reveals/opens the exact package slot; untargeted issues remain readable and
noninteractive. Each summary opens its owning feature 005–009 detail/anchor. No action changes the
`b.…` fragment.

## 7. Verify local normalisation provenance

1. Ingest a build whose fixed mount feature 002 normalises.
2. Reload its working record, save it by name, duplicate it and open the named record.
3. Edit one affected mount successfully; undo the model edit.
4. Copy a compact link and export SLEF.
5. Delete the local record.

Expected: provenance is separate from package issues, persists/copies with local records, clears only
for the edited exact mount and does not return on undo. Refused/cancelled/no-op and condition changes
do not clear it. Neither link nor SLEF contains it. Record deletion discards it.

## 8. Verify announcements

Observe the polite live region while resolving/introducing issues and qualifications, including rapid
edits.

Expected: initial content is silent; each settled count change emits one combined current-count
message; unchanged values and stale intermediate revisions are silent. Visible diagnostics are not
the live region and ordinary issues do not use alerts.

## 9. Verify responsive and accessible presentation

Run every relevant populated, empty, updating, issue, provenance, exact-zero, qualified, incomplete,
unavailable, infinite and absent state in Chromium and Firefox at desktop, tablet, mobile portrait
and landscape.

Expected: automated accessibility checks pass; all content/actions remain at 200% text and 400% zoom;
there is no document horizontal scrolling; touch targets are at least 44 CSS px; expanded/RTL text
wraps; reduced motion changes no result or announcement semantics.

## 10. Verify performance and the complete gate

At the mobile Chromium viewport, use CDP `Emulation.setCPUThrottlingRate(4)`. Measure in-page from a
committed edit/accepted condition revision to rendered DOM carrying the same revision pair; exclude
Playwright transport time.

Expected: every affected status/result renders within 100 ms. Firefox runs the same functional and
accessibility journeys without Chromium-only CDP throttling.

Finally run:

```bash
pnpm run check
```

Coverage remains at or above 80% for statements, branches, functions and lines; no test, browser or
viewport is skipped to obtain a passing result.
