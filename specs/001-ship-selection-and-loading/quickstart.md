# Quickstart Validation: Ship Selection and Build Loading

This guide validates the completed feature end to end. It is not an implementation recipe. Model and boundary details are in [data-model.md](./data-model.md) and [contracts/](./contracts/).

## Prerequisites

- Node.js from `.nvmrc` / `package.json#engines`
- pnpm from `package.json#packageManager`
- Playwright Chromium and Firefox, or compatible executables supplied through `E2E_CHROMIUM_PATH` and `E2E_FIREFOX_PATH`
- Feature 011's design-system/localization/accessibility foundations
- Feature 004's SLEF export action for the link-refusal fallback

Install and run the full gate:

```bash
pnpm install --frozen-lockfile
pnpm run check
```

Expected: format, strict typecheck, production static build, script tests, unit tests with at least 80% statements/branches/functions/lines, and all Chromium/Firefox Playwright projects pass. No test is skipped or quarantined.

For exploratory validation:

```bash
pnpm start
```

Use the printed same-origin development URL. Clear only this application's site storage when a scenario explicitly asks for a clean state.

## Scenario 1: Find a hull without changing work

1. Open `/ships` and note the total package hull count.
2. Exercise text search, each facet and both directions of every sort field.
3. Verify each result shows name, manufacturer, size, hardpoint layout and localized retail credits; active constraints and match count remain visible.
4. Create equal sort values and missing/zero fixtures in the unit harness; verify ties retain package order and missing remains distinct from zero.
5. Scroll to a result, open its detail, then return.

Expected: constraints, order and anchored position return exactly; no active build, storage record, route query or fragment contains catalogue session state.

## Scenario 2: Inspect and create a stock build

1. Open a known `/ships/<symbol>` detail URL.
2. Verify every FR-004 fact, unit, slot group and the same-origin package illustration. Confirm the text distinguishes hull specifications from build results.
3. Abort/fail the image request and repeat the creation action.
4. Open an unknown symbol URL.
5. With a build already active, request creation for a different known hull.

Expected: image absence is temporary/nonblocking; unknown symbol shows an error and creates nothing; creation asks nothing and produces the exact `ShipLoadout.default(symbol)`, records package validation and navigates to the workspace. The build that was active is still listed in `/builds`, under its own record, with everything it had.

## Scenario 3: Restore work without being asked to save it

1. Edit the active build, wait for saved status and reload.
2. Open a second page in the same browser context, create/edit a different build and reload both pages.
3. Duplicate one live tab to exercise cloned `sessionStorage` detection, edit both and reload.
4. Open the same record in both pages.
5. Simulate blocked storage and quota failure while continuing to edit.
6. Create four builds in a row without saving anything, then open `/builds`.

Expected: each page restores the record it holds; a duplicated collision and a second page opening a held record both fork before autosave; neither page overwrites the other; storage failure is clear while the current in-memory build, link and SLEF capabilities remain usable. All four builds from step 6 are listed, none of them was asked about, and none of them replaced another.

## Scenario 4: Manage named and unnamed records

1. Name/save the current build, then open, rename and duplicate it.
2. Count the records before and after naming one.
3. Reuse an existing display name and exercise the warning/proceed path.
4. Delete a record and test both cancel and confirm.
5. Seed 20 unnamed records and create a twenty-first build.
6. Select records in the manager, confirm deletion and retry persistence. Separately, name one of the
   listed records instead of discarding any.

Expected: IDs remain independent of names; naming leaves the record count unchanged and leaves no
unnamed copy behind; duplicate names are preserved after warning; cancel deletes nothing; unnamed
record 21 is memory-only until explicit management, and naming a listed record releases a slot as
surely as discarding one; no record is automatically evicted.

## Scenario 5: Resolve a real multi-tab conflict

Use two Playwright pages in one browser context so they share `localStorage` but have separate tab sessions:

1. Open the same record in both. The later page forks onto an unnamed record of its own; confirm both
   are listed and both are editable.
2. Make divergent edits, then name page A's record and page B's under the same display name.
3. In separate runs choose cancel, keep both and overwrite.
4. Before accepting overwrite, make/save a third change in page A.

Expected: no page ever autosaves into a record another live page holds. Where a deliberate write does
collide, page B receives a conflict: cancel writes nothing to the conflicted record; keep both creates
a new UUID and retains both versions; overwrite replaces only the version shown; a third revision
refreshes the conflict rather than disappearing. Both pages' own records remain recoverable
throughout.

## Scenario 6: Migrations and hostile storage

1. Load every frozen supported-version fixture and open it.
2. Force migration persistence failure.
3. Seed an unsupported newer version and separately malformed owned JSON.

Expected: supported fixtures reconstruct identical modelled state and migrate losslessly; failed migration retains original bytes; newer/malformed records remain stored and listed unavailable while valid siblings still work.

## Scenario 7: Share and navigate links

1. Create a stock build, inspect the URL and copy the published link.
2. Confirm build data occurs only after `#`, starts `b.` and the value is at most 500 characters.
3. Edit repeatedly and verify browser history does not gain an entry per edit.
4. Load the link in another tab; verify an equivalent modelled build appears as working/link provenance without a named save.
5. Navigate/paste malformed, truncated, over-limit and unsupported-version fragments while another edited build is active.
6. Load an older supported payload that omits fixed entries, then separately load a payload with an
   unknown hull or an identity absent from its selected codec table.

Expected: initial and navigated hashes use identical validation rules; failures leave work unchanged;
a valid link is loaded without a question, into a record of its own, while the build it replaced stays
listed; unknown or unrepresentable identities are refused; and the supported older payload
reconstructs with package-defaulted fixed mounts as ordinary fitted state. Local name/note/IDs,
catalogue facts, calculations and prices are absent from payloads.

## Scenario 8: Network, offline and privacy

1. Record all requests while exercising catalogue, detail, storage and share flows.
2. Open the app shell and one hull illustration, then go offline and reload/navigate among already cached content.
3. Request an uncached illustration while offline, then restore connectivity without reloading.

Expected: no automatic cross-origin request occurs; no request URL contains fragment payload data; the shell and fallback English remain readable offline; previously opened art is available; uncached art absence does not block capability and can recover on reconnection.

## Scenario 9: Responsive, localized and accessible operation

Run the journeys in desktop, tablet portrait/landscape and mobile portrait/landscape projects in both Chromium and Firefox.

For every screen and relevant empty/loading/error/disabled/dialog state, verify:

- the automated accessibility scan has no in-scope violation;
- landmarks, headings, names, roles, selected/expanded/invalid state and live announcements are meaningful;
- status/validation/constraints never depend on color alone;
- touch exposes every action without hover;
- 200% text and 400% zoom preserve content/function with no page horizontal overflow;
- expanded and RTL fixture messages remain readable and ordered;
- reduced motion removes nonessential motion;
- numbers, credits, units and dates follow the active locale;
- canonical Almanac text is visibly identified as untranslated when the active locale is unavailable from the package.

Where conformance is stated, expected wording names the excluded criteria: 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.

## Scenario 10: Design-reference reconciliation

Compare the implementation with `.design/Ship Builder.dc.html` canvases 1a–1d and [design/reference-review.md](./design/reference-review.md):

1. At wide widths, verify the shipyard manifest/detail rail (whose track is held whether or not a hull is open), the centered saved-build route modal with its title bar, search-and-count header, column headers and committing footer, and the workspace command bar and save/share dialogs, all preserve the reference hierarchy.
2. At narrow widths, verify stacked hull records, full-screen detail/library layers, workspace overflow actions and sheet dialogs preserve every action and route.
3. Confirm all mandatory adaptations: complete FR-004 facts, working/error/storage states, semantic controls, 44 px targets, package SVGs/data, localized formatting, same-origin fonts/assets and canonical `/build#b.…` links.
4. Monitor runtime requests and inspect the built asset tree.

Expected: the application reflects the supplied visual language without bundling `.design` mock data/assets, requesting Google Fonts, using the sample `/b/<name>#h=…` URL, or reproducing the mock's partial-engineering-quality help claim.
